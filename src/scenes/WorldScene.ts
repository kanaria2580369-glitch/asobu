import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, MAP_COLS, MAP_ROWS,
  COLORS, TILE, TileType, SCENE_KEYS,
} from '../constants';
import { Character } from '../entities/Character';
import { INITIAL_PLAYER } from '../data/playerData';
import { EncounterSystem } from '../systems/EncounterSystem';
import { EnemyData } from '../data/enemies';
import { VirtualPad } from '../ui/VirtualPad';
import { generateCharacterSheetPdf } from '../utils/PdfGenerator';

// マップレイアウト (0=草, 1=壁, 2=道, 3=水)
const MAP_DATA: TileType[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,2,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,2,0,0,0,0,0,3,3,0,0,1],
  [1,0,0,0,0,3,3,0,0,2,0,0,0,0,0,3,3,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,3,3,0,0,2,0,0,1,1,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,2,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export class WorldScene extends Phaser.Scene {
  private player!: Character;
  private playerSprite!: Phaser.GameObjects.Graphics;
  private playerX = 2; // タイル座標
  private playerY = 2;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private pad!: VirtualPad;
  private encounter!: EncounterSystem;
  private moving = false;
  private moveCooldown = 0;
  private transitioning = false; // エンカウント後のロック

  // UI
  private statusText!: Phaser.GameObjects.Text;
  private pdfKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: SCENE_KEYS.WORLD });
  }

  init(data: { player?: Character }): void {
    if (data?.player) {
      this.player = data.player;
    } else {
      this.player = new Character(INITIAL_PLAYER);
    }
  }

  create(): void {
    this.encounter = new EncounterSystem();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.pdfKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    this.drawMap();
    this.createPlayer();
    this.createUI();
    this.pad = new VirtualPad(this, 100, GAME_HEIGHT - 100);

    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private drawMap(): void {
    const g = this.add.graphics();
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = MAP_DATA[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        switch (tile) {
          case TILE.GRASS: {
            const shade = (col + row) % 2 === 0 ? COLORS.GRASS : COLORS.GRASS_DARK;
            g.fillStyle(shade, 1);
            g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;
          }
          case TILE.WALL: {
            g.fillStyle(COLORS.WALL, 1);
            g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            g.fillStyle(COLORS.WALL_DARK, 1);
            g.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            break;
          }
          case TILE.PATH: {
            g.fillStyle(COLORS.PATH, 1);
            g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            g.fillStyle(0xb8996e, 0.4);
            g.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            break;
          }
          case TILE.WATER: {
            g.fillStyle(COLORS.WATER, 1);
            g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            g.fillStyle(0x5a9be5, 0.5);
            g.fillRect(x + 4, y + 8, TILE_SIZE - 8, 4);
            g.fillRect(x + 8, y + 20, TILE_SIZE - 16, 4);
            break;
          }
        }
      }
    }
  }

  private createPlayer(): void {
    this.playerSprite = this.add.graphics();
    this.drawPlayerSprite();
    this.syncSpritePosition();
  }

  private drawPlayerSprite(): void {
    this.playerSprite.clear();
    // 体
    this.playerSprite.fillStyle(COLORS.PLAYER, 1);
    this.playerSprite.fillRect(-10, -4, 20, 18);
    // 頭
    this.playerSprite.fillStyle(COLORS.PLAYER, 1);
    this.playerSprite.fillCircle(0, -12, 10);
    // アウトライン
    this.playerSprite.lineStyle(2, COLORS.PLAYER_OUTLINE, 1);
    this.playerSprite.strokeCircle(0, -12, 10);
    // 目
    this.playerSprite.fillStyle(0x333333, 1);
    this.playerSprite.fillRect(-4, -14, 3, 3);
    this.playerSprite.fillRect(2, -14, 3, 3);
  }

  private syncSpritePosition(): void {
    this.playerSprite.x = this.playerX * TILE_SIZE + TILE_SIZE / 2;
    this.playerSprite.y = this.playerY * TILE_SIZE + TILE_SIZE / 2;
  }

  private createUI(): void {
    // ステータスウィンドウ（カメラに固定）
    this.statusText = this.add.text(8, 8, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(10);

    this.add.text(GAME_WIDTH - 8, 8, '[P] PDF', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#aaaaff',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(10).setOrigin(1, 0);

    this.updateStatusUI();
  }

  private updateStatusUI(): void {
    const p = this.player;
    this.statusText.setText(
      `${p.name}  Lv.${p.level}\nHP: ${p.hp}/${p.maxHp}  MP: ${p.mp}/${p.maxMp}\nEXP: ${p.exp}/${p.nextExp}`
    );
  }

  update(_time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.pdfKey)) {
      generateCharacterSheetPdf(this.player.toStats());
    }

    if (this.transitioning) return;
    this.moveCooldown -= delta;
    if (this.moveCooldown > 0) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.pad.left) dx = -1;
    else if (this.cursors.right.isDown || this.pad.right) dx = 1;
    else if (this.cursors.up.isDown || this.pad.up) dy = -1;
    else if (this.cursors.down.isDown || this.pad.down) dy = 1;

    if (dx === 0 && dy === 0) return;

    const nx = this.playerX + dx;
    const ny = this.playerY + dy;

    if (!this.canMove(nx, ny)) return;

    this.playerX = nx;
    this.playerY = ny;
    this.syncSpritePosition();
    this.moveCooldown = 140; // ms

    // エンカウント判定
    const tile = MAP_DATA[this.playerY][this.playerX] as TileType;
    const enemy = this.encounter.step(this.player.level, tile === TILE.GRASS);
    if (enemy) {
      this.transitioning = true;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENE_KEYS.BATTLE, { player: this.player, enemy });
      });
    }

    this.updateStatusUI();
  }

  private canMove(col: number, row: number): boolean {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
    const tile = MAP_DATA[row][col];
    return tile !== TILE.WALL && tile !== TILE.WATER;
  }
}
