export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const TILE_SIZE = 48;
export const MAP_COLS = 20;
export const MAP_ROWS = 20;

export const COLORS = {
  GRASS: 0x4a7c59,
  GRASS_DARK: 0x3a6449,
  WALL: 0x6b6b6b,
  WALL_DARK: 0x4a4a4a,
  PATH: 0xc8a96e,
  WATER: 0x3a7bd5,
  PLAYER: 0xf0d080,
  PLAYER_OUTLINE: 0xa08020,
  TEXT_WHITE: '#ffffff',
  TEXT_YELLOW: '#ffff00',
  TEXT_GREEN: '#00ff88',
  TEXT_RED: '#ff4444',
  UI_BG: 0x1a1a2e,
  UI_BORDER: 0x4a4aff,
};

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  WORLD: 'WorldScene',
  BATTLE: 'BattleScene',
  GAME_OVER: 'GameOverScene',
};

// タイルタイプ
export const TILE = {
  GRASS: 0,
  WALL: 1,
  PATH: 2,
  WATER: 3,
} as const;
export type TileType = typeof TILE[keyof typeof TILE];
