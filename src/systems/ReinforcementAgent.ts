/**
 * Q-Learning based Reinforcement Agent for enemy AI.
 *
 * State  : (enemyHpBucket, playerHpBucket) — each bucketed into LOW / MID / HIGH
 * Actions: attack | heavy_attack | guard | magic
 *
 * The agent maintains a Q-table that is updated every time an action is taken
 * and a reward is observed.  The policy is ε-greedy: with probability ε the
 * agent explores randomly; otherwise it picks the action with the highest Q.
 */

export type EnemyAction = 'attack' | 'heavy_attack' | 'guard' | 'magic';

const ACTIONS: EnemyAction[] = ['attack', 'heavy_attack', 'guard', 'magic'];

type HpBucket = 'low' | 'mid' | 'high';
export interface RLState {
  enemyHp: HpBucket;
  playerHp: HpBucket;
}

type StateKey = string; // `${enemyHp}:${playerHp}`

function toKey(state: RLState): StateKey {
  return `${state.enemyHp}:${state.playerHp}`;
}

function bucket(hp: number, maxHp: number): HpBucket {
  const ratio = hp / maxHp;
  if (ratio <= 0.3) return 'low';
  if (ratio <= 0.65) return 'mid';
  return 'high';
}

// Hyper-parameters
const ALPHA = 0.2;   // learning rate
const GAMMA = 0.9;   // discount factor
const EPSILON_START = 0.3;
const EPSILON_MIN = 0.05;
const EPSILON_DECAY = 0.98; // multiplied after each episode

export class ReinforcementAgent {
  private qTable: Map<StateKey, Record<EnemyAction, number>> = new Map();
  private epsilon: number = EPSILON_START;

  // Memory for the last (state, action) so we can update Q on the next step
  private lastState: RLState | null = null;
  private lastAction: EnemyAction | null = null;

  // Whether the agent has magical ability
  constructor(private hasMagic: boolean = false) {}

  // ------------------------------------------------------------------ //
  //  Public API
  // ------------------------------------------------------------------ //

  /** Choose an action given the current battle state. */
  chooseAction(enemyHp: number, enemyMaxHp: number, playerHp: number, playerMaxHp: number): EnemyAction {
    const state: RLState = {
      enemyHp: bucket(enemyHp, enemyMaxHp),
      playerHp: bucket(playerHp, playerMaxHp),
    };

    const action = this.epsilonGreedy(state);
    this.lastState = state;
    this.lastAction = action;
    return action;
  }

  /**
   * Call after the result of an action is known to update the Q-table.
   * @param reward       Positive for good outcomes (damage dealt, survival), negative for bad.
   * @param nextEnemyHp  Enemy HP after the action resolved (post player counter-attack).
   * @param nextPlayerHp Player HP after the action resolved.
   * @param enemyMaxHp   Max HP (unchanged).
   * @param playerMaxHp  Max HP (unchanged).
   * @param done         True when the battle has ended.
   */
  learn(
    reward: number,
    nextEnemyHp: number,
    nextPlayerHp: number,
    enemyMaxHp: number,
    playerMaxHp: number,
    done: boolean,
  ): void {
    if (this.lastState === null || this.lastAction === null) return;

    const nextState: RLState = {
      enemyHp: bucket(nextEnemyHp, enemyMaxHp),
      playerHp: bucket(nextPlayerHp, playerMaxHp),
    };

    const currentQ = this.getQ(this.lastState, this.lastAction);
    const maxNextQ = done ? 0 : this.maxQ(nextState);
    const newQ = currentQ + ALPHA * (reward + GAMMA * maxNextQ - currentQ);
    this.setQ(this.lastState, this.lastAction, newQ);

    if (done) {
      this.epsilon = Math.max(EPSILON_MIN, this.epsilon * EPSILON_DECAY);
      this.lastState = null;
      this.lastAction = null;
    }
  }

  /** Decay epsilon manually (call after each full battle episode). */
  endEpisode(): void {
    this.epsilon = Math.max(EPSILON_MIN, this.epsilon * EPSILON_DECAY);
  }

  /** Serialise the Q-table so it can be persisted (e.g. localStorage). */
  exportQTable(): Record<string, Record<EnemyAction, number>> {
    const obj: Record<string, Record<EnemyAction, number>> = {};
    this.qTable.forEach((value, key) => { obj[key] = { ...value }; });
    return obj;
  }

  /** Restore a previously exported Q-table. */
  importQTable(data: Record<string, Record<EnemyAction, number>>): void {
    this.qTable.clear();
    for (const key of Object.keys(data)) {
      this.qTable.set(key, { ...data[key] });
    }
  }

  get currentEpsilon(): number { return this.epsilon; }

  // ------------------------------------------------------------------ //
  //  Private helpers
  // ------------------------------------------------------------------ //

  private availableActions(): EnemyAction[] {
    return this.hasMagic ? ACTIONS : ACTIONS.filter(a => a !== 'magic');
  }

  private epsilonGreedy(state: RLState): EnemyAction {
    const actions = this.availableActions();
    if (Math.random() < this.epsilon) {
      return actions[Math.floor(Math.random() * actions.length)];
    }
    return this.bestAction(state);
  }

  private bestAction(state: RLState): EnemyAction {
    const actions = this.availableActions();
    let best = actions[0];
    let bestVal = this.getQ(state, best);
    for (let i = 1; i < actions.length; i++) {
      const val = this.getQ(state, actions[i]);
      if (val > bestVal) { bestVal = val; best = actions[i]; }
    }
    return best;
  }

  private maxQ(state: RLState): number {
    const actions = this.availableActions();
    return Math.max(...actions.map(a => this.getQ(state, a)));
  }

  private getQ(state: RLState, action: EnemyAction): number {
    const row = this.qTable.get(toKey(state));
    if (!row) return 0;
    return row[action] ?? 0;
  }

  private setQ(state: RLState, action: EnemyAction, value: number): void {
    const key = toKey(state);
    let row = this.qTable.get(key);
    if (!row) {
      row = { attack: 0, heavy_attack: 0, guard: 0, magic: 0 };
      this.qTable.set(key, row);
    }
    row[action] = value;
  }
}
