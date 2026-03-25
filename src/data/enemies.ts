export interface EnemyData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  exp: number;
  gold: number;
  color: number;
  size: number; // 描画サイズ係数
}

export const ENEMIES: EnemyData[] = [
  {
    id: 'slime',
    name: 'スライム',
    hp: 18, maxHp: 18,
    mp: 0, maxMp: 0,
    atk: 8, def: 3, spd: 6,
    exp: 12, gold: 5,
    color: 0x44aaff,
    size: 0.9,
  },
  {
    id: 'bat',
    name: 'コウモリ',
    hp: 14, maxHp: 14,
    mp: 0, maxMp: 0,
    atk: 10, def: 2, spd: 14,
    exp: 14, gold: 7,
    color: 0x886688,
    size: 0.7,
  },
  {
    id: 'goblin',
    name: 'ゴブリン',
    hp: 28, maxHp: 28,
    mp: 0, maxMp: 0,
    atk: 13, def: 6, spd: 9,
    exp: 22, gold: 12,
    color: 0x88cc44,
    size: 1.0,
  },
  {
    id: 'wolf',
    name: 'オオカミ',
    hp: 36, maxHp: 36,
    mp: 0, maxMp: 0,
    atk: 16, def: 5, spd: 13,
    exp: 30, gold: 15,
    color: 0xaaaaaa,
    size: 1.1,
  },
  {
    id: 'orc',
    name: 'オーク',
    hp: 55, maxHp: 55,
    mp: 0, maxMp: 0,
    atk: 20, def: 10, spd: 7,
    exp: 50, gold: 25,
    color: 0x665522,
    size: 1.3,
  },
];

export function getRandomEnemy(playerLevel: number): EnemyData {
  // レベルに応じて出現する敵を絞る
  const maxIndex = Math.min(ENEMIES.length - 1, playerLevel + 1);
  const minIndex = Math.max(0, playerLevel - 2);
  const idx = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));
  return { ...ENEMIES[Math.min(idx, ENEMIES.length - 1)] };
}
