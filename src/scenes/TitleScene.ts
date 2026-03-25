import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../constants';

export class TitleScene extends Phaser.Scene {
  private blinkText!: Phaser.GameObjects.Text;
  private blinkTimer = 0;

  constructor() {
    super({ key: SCENE_KEYS.TITLE });
  }

  create(): void {
    // 背景グラデーション風
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 星を描画
    const stars = this.add.graphics();
    stars.fillStyle(0xffffff, 1);
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT * 0.7;
      const r = Math.random() * 1.5 + 0.5;
      stars.fillCircle(x, y, r);
    }

    // タイトルロゴ
    this.add.text(GAME_WIDTH / 2, 160, '勇者の冒険', {
      fontFamily: '"Courier New", monospace',
      fontSize: '56px',
      color: '#ffd700',
      stroke: '#8b6914',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 230, '~ FANTASY QUEST ~', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#aaaaff',
    }).setOrigin(0.5);

    // 装飾ライン
    const line = this.add.graphics();
    line.lineStyle(2, 0xffd700, 0.6);
    line.lineBetween(100, 260, GAME_WIDTH - 100, 260);

    // 点滅テキスト
    this.blinkText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'PRESS SPACE TO START', {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 操作説明
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '矢印キー: 移動  Space: 決定', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // キー入力
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    spaceKey.once('down', () => this.startGame());
    enterKey.once('down', () => this.startGame());
  }

  update(time: number, delta: number): void {
    this.blinkTimer += delta;
    if (this.blinkTimer > 600) {
      this.blinkText.setVisible(!this.blinkText.visible);
      this.blinkTimer = 0;
    }
  }

  private startGame(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.WORLD);
    });
  }
}
