import Phaser from 'phaser';

export class HPBar {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private color: number;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    color = 0x22dd44
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;

    this.bg = scene.add.graphics();
    this.bar = scene.add.graphics();
    this.draw(1);
  }

  update(current: number, max: number): void {
    const ratio = max > 0 ? Math.max(0, current / max) : 0;
    this.draw(ratio);
  }

  private draw(ratio: number): void {
    this.bg.clear();
    this.bg.fillStyle(0x333333, 1);
    this.bg.fillRect(this.x, this.y, this.width, this.height);
    this.bg.lineStyle(1, 0x666666, 1);
    this.bg.strokeRect(this.x, this.y, this.width, this.height);

    this.bar.clear();
    if (ratio > 0) {
      const barColor = ratio > 0.5 ? this.color : ratio > 0.25 ? 0xddaa00 : 0xdd2222;
      this.bar.fillStyle(barColor, 1);
      this.bar.fillRect(this.x + 1, this.y + 1, Math.floor((this.width - 2) * ratio), this.height - 2);
    }
  }

  destroy(): void {
    this.bg.destroy();
    this.bar.destroy();
  }

  setVisible(visible: boolean): void {
    this.bg.setVisible(visible);
    this.bar.setVisible(visible);
  }
}
