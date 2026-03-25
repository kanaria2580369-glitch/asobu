import { Character } from '../entities/Character';

export type BattlePhase = 'player_command' | 'player_action' | 'enemy_action' | 'result';
export type BattleCommand = 'attack' | 'magic' | 'run';

export interface BattleResult {
  phase: BattlePhase;
  damage?: number;
  healed?: number;
  message: string;
  playerWon?: boolean;
  escaped?: boolean;
}

const MAGIC_MP_COST = 5;
const ESCAPE_BASE_CHANCE = 0.4;

export class BattleManager {
  player: Character;
  enemy: Character;
  turn = 0;
  phase: BattlePhase = 'player_command';

  constructor(player: Character, enemy: Character) {
    this.player = player;
    this.enemy = enemy;
  }

  calcDamage(attacker: Character, defender: Character): number {
    const base = Math.max(1, attacker.atk - Math.floor(defender.def / 2));
    const variance = Math.floor(Math.random() * 5) - 2; // -2 〜 +2
    return Math.max(1, base + variance);
  }

  playerAttack(): BattleResult {
    const dmg = this.calcDamage(this.player, this.enemy);
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
    const dmg = Math.floor(this.player.atk * 1.6 + Math.random() * 4);
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
    const dmg = this.calcDamage(this.enemy, this.player);
    this.player.takeDamage(dmg);
    this.phase = 'player_command';
    return {
      phase: 'enemy_action',
      damage: dmg,
      message: `${this.enemy.name} の攻撃！ ${this.player.name} に ${dmg} のダメージ！`,
    };
  }

  checkBattleEnd(): { ended: boolean; playerWon: boolean } {
    if (!this.enemy.isAlive) return { ended: true, playerWon: true };
    if (!this.player.isAlive) return { ended: true, playerWon: false };
    return { ended: false, playerWon: false };
  }
}
