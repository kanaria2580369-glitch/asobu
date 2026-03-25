import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    // アセットなし（グラフィックAPIで描画）
  }

  create(): void {
    this.scene.start(SCENE_KEYS.TITLE);
  }
}
