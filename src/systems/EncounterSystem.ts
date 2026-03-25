import { getRandomEnemy, EnemyData } from '../data/enemies';

const ENCOUNTER_RATE = 1 / 12; // 1歩ごとの確率

export class EncounterSystem {
  private stepCount = 0;

  reset(): void {
    this.stepCount = 0;
  }

  /**
   * プレイヤーが草地で1歩移動するたびに呼ぶ。
   * エンカウントした場合は EnemyData を返す。
   */
  step(playerLevel: number, isGrassTile: boolean): EnemyData | null {
    if (!isGrassTile) return null;

    this.stepCount++;
    // 最低5歩後からエンカウント抽選
    if (this.stepCount < 5) return null;

    if (Math.random() < ENCOUNTER_RATE) {
      this.stepCount = 0;
      return getRandomEnemy(playerLevel);
    }
    return null;
  }
}
