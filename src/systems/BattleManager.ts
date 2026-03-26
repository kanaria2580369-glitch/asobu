import { Character } from '../entities/Character';
import { ReinforcementAgent, EnemyAction } from './ReinforcementAgent';

export type BattlePhase = 'player_command' | 'player_action' | 'enemy_action' | 'result';
export type BattleCommand = 'attack' | 'magic' | 'run';

export interface BattleResult {
  phase: BattlePhase;
  damage?: number;
  healed?: number;
  message: string;
  playerWon?: boolean;
  escaped?: boolean;
  enemyActionUsed?: EnemyAction;
}

const MAGIC_MP_COST = 5;
const ESCAPE_BASE_CHANCE = 0.4;
const ENEMY_MAGIC_MP_COST = 8;
// Damage multiplier for heavy attack; enemy also takes recoil
const HEAVY_ATTACK_MULT = 1.8;
const HEAVY_RECOIL_RATIO = 0.1;
// Guard reduces next incoming damage by this fraction
const GUARD_REDUCTION = 0.5;

export class BattleManager {
  player: Character;
  enemy: Character;
  turn = 0;
  phase: BattlePhase = 'player_command';

  private agent: ReinforcementAgent;
  /** When the enemy guards, the next player attack is dampened. */
  enemyGuarding = false;
  /** Snapshot of enemy HP taken just before the enemy's action (for reward calc). */
  private preActionEnemyHp = 0;

  constructor(player: Character, enemy: Character) {
    this.player = player;
    this.enemy = enemy;
    this.agent = new ReinforcementAgent(enemy.maxMp > 0);
  }

  calcDamage(attacker: Character, defender: Character): number {
    const base = Math.max(1, attacker.atk - Math.floor(defender.def / 2));
    const variance = Math.floor(Math.random() * 5) - 2; // -2 〜 +2
    return Math.max(1, base + variance);
  }

  playerAttack(): BattleResult {
    let dmg = this.calcDamage(this.player, this.enemy);
    if (this.enemyGuarding) {
      dmg = Math.max(1, Math.floor(dmg * (1 - GUARD_REDUCTION)));
      this.enemyGuarding = false;
    }
    this.enemy.takeDamage(dmg);
    this.phase = 'enemy_action';
    return {
      phase: 'player_action',
      damage: dmg,
      message: `${this.player.name} の攻撃！ ${this.enemy.name} に ${dmg} のダメージ！`,
    };
  }

  playerMagic(): BattleResult {
    if (!this.player.useMp(MAGIC_MP_COST)) {
      return {
        phase: 'player_command',
        message: 'MPが足りない！',
      };
    }
    let dmg = Math.floor(this.player.atk * 1.6 + Math.random() * 4);
    if (this.enemyGuarding) {
      dmg = Math.max(1, Math.floor(dmg * (1 - GUARD_REDUCTION)));
      this.enemyGuarding = false;
    }
    this.enemy.takeDamage(dmg);
    this.phase = 'enemy_action';
    return {
      phase: 'player_action',
      damage: dmg,
      message: `${this.player.name} はメラを唱えた！ ${this.enemy.name} に ${dmg} のダメージ！`,
    };
  }

  playerRun(): BattleResult {
    const chance = ESCAPE_BASE_CHANCE + (this.player.spd - this.enemy.spd) * 0.03;
    if (Math.random() < Math.min(0.9, Math.max(0.1, chance))) {
      return {
        phase: 'result',
        message: 'うまく逃げ切った！',
        escaped: true,
      };
    }
    this.phase = 'enemy_action';
    return {
      phase: 'player_action',
      message: 'しかし逃げられなかった！',
    };
  }

  enemyAction(): BattleResult {
    this.turn++;
    this.enemyGuarding = false;

    // Ask the RL agent which action to take
    const action = this.agent.chooseAction(
      this.enemy.hp, this.enemy.maxHp,
      this.player.hp, this.player.maxHp,
    );
    this.preActionEnemyHp = this.enemy.hp;

    return this.executeEnemyAction(action);
  }

  private executeEnemyAction(action: EnemyAction): BattleResult {
    switch (action) {
      case 'attack': {
        const dmg = this.calcDamage(this.enemy, this.player);
        this.player.takeDamage(dmg);
        this.phase = 'player_command';
        return {
          phase: 'enemy_action',
          damage: dmg,
          enemyActionUsed: 'attack',
          message: `${this.enemy.name} の攻撃！ ${this.player.name} に ${dmg} のダメージ！`,
        };
      }
      case 'heavy_attack': {
        const base = this.calcDamage(this.enemy, this.player);
        const dmg = Math.max(1, Math.floor(base * HEAVY_ATTACK_MULT));
        const recoil = Math.max(1, Math.floor(this.enemy.maxHp * HEAVY_RECOIL_RATIO));
        this.player.takeDamage(dmg);
        this.enemy.takeDamage(recoil);
        this.phase = 'player_command';
        return {
          phase: 'enemy_action',
          damage: dmg,
          enemyActionUsed: 'heavy_attack',
          message: `${this.enemy.name} の渾身の一撃！ ${this.player.name} に ${dmg} のダメージ！（反動 ${recoil}）`,
        };
      }
      case 'guard': {
        this.enemyGuarding = true;
        this.phase = 'player_command';
        return {
          phase: 'enemy_action',
          enemyActionUsed: 'guard',
          message: `${this.enemy.name} は身構えた！`,
        };
      }
      case 'magic': {
        if (!this.enemy.useMp(ENEMY_MAGIC_MP_COST)) {
          // Fallback to normal attack when MP is empty
          return this.executeEnemyAction('attack');
        }
        const dmg = Math.floor(this.enemy.atk * 1.5 + Math.random() * 4);
        this.player.takeDamage(dmg);
        this.phase = 'player_command';
        return {
          phase: 'enemy_action',
          damage: dmg,
          enemyActionUsed: 'magic',
          message: `${this.enemy.name} は呪文を唱えた！ ${this.player.name} に ${dmg} のダメージ！`,
        };
      }
    }
  }

  /**
   * Call this after the player's counter-action resolves so the agent can
   * learn from the reward.  Pass `done = true` when the battle has ended.
   */
  notifyRLResult(done: boolean, playerWon: boolean): void {
    // Reward shaping:
    //  +damage dealt to player this turn
    //  −damage taken by enemy since the action (recoil or player counter)
    //  +10 bonus for winning, −10 penalty for losing
    const damageDealtApprox = this.preActionEnemyHp - this.enemy.hp; // negative means enemy took damage
    const reward =
      (this.player.maxHp - this.player.hp) * 0.1 +  // player HP lost is good for enemy
      damageDealtApprox * -0.1 +                      // enemy HP lost is bad for enemy
      (done ? (playerWon ? -10 : 10) : 0);

    this.agent.learn(
      reward,
      this.enemy.hp, this.player.hp,
      this.enemy.maxHp, this.player.maxHp,
      done,
    );

    if (done) this.agent.endEpisode();
  }

  checkBattleEnd(): { ended: boolean; playerWon: boolean } {
    if (!this.enemy.isAlive) return { ended: true, playerWon: true };
    if (!this.player.isAlive) return { ended: true, playerWon: false };
    return { ended: false, playerWon: false };
  }

  /** Expose the agent for debugging / persistence purposes. */
  get rlAgent(): ReinforcementAgent { return this.agent; }
}
