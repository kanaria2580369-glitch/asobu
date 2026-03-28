import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../constants';
import { Character } from '../entities/Character';
import { generateCharacterSheetPdf } from '../utils/PdfGenerator';

export class GameOverScene extends Phaser.Scene {
  private player?: Character;

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER });
  }

  init(data: { player?: Character }): void {
    this.player = data?.player;
  }

  create(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'GAME OVER', {
      fontFamily: '"Courier New", monospace',
      fontSize: '56px',
      color: '#ff2222',
      stroke: '#440000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'タップ / SPACE でタイトルへ', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    if (this.player) {
      const pdfText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, '[P] キャラクターシートを保存', {
        fontFamily: '"Courier New", monospace',
        fontSize: '15px',
        color: '#aaaaff',
        backgroundColor: '#00000099',
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      pdfText.on('pointerdown', () => {
        generateCharacterSheetPdf(this.player!.toStats());
      });

      this.input.keyboard!.on('keydown-P', () => {
        generateCharacterSheetPdf(this.player!.toStats());
      });
    }

    const toTitle = () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENE_KEYS.TITLE);
      });
    };
    this.input.keyboard!.once('keydown-SPACE', toTitle);
    this.input.once('pointerdown', toTitle);
  }
}
