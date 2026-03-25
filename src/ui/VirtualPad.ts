import Phaser from 'phaser';

const BTN_RADIUS = 28;
const GAP = 64;
const ALPHA_IDLE = 0.35;
const ALPHA_PRESSED = 0.7;

interface DirButton {
  bg: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  key: string;
}

export class VirtualPad {
  private held = new Set<string>();
  private buttons: DirButton[] = [];

  constructor(scene: Phaser.Scene, cx: number, cy: number) {
    const defs = [
      { key: 'up',    dx: 0,    dy: -GAP, arrow: '▲' },
      { key: 'down',  dx: 0,    dy:  GAP, arrow: '▼' },
      { key: 'left',  dx: -GAP, dy: 0,    arrow: '◀' },
      { key: 'right', dx:  GAP, dy: 0,    arrow: '▶' },
    ];

    for (const d of defs) {
      const x = cx + d.dx;
      const y = cy + d.dy;

      const bg = scene.add.circle(x, y, BTN_RADIUS, 0xffffff, ALPHA_IDLE)
        .setScrollFactor(0)
        .setDepth(200)
        .setInteractive({ useHandCursor: false });

      const label = scene.add.text(x, y, d.arrow, {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0.8);

      const press = () => {
        this.held.add(d.key);
        bg.setAlpha(ALPHA_PRESSED);
      };
      const release = () => {
        this.held.delete(d.key);
        bg.setAlpha(ALPHA_IDLE);
      };

      bg.on('pointerdown', press);
      bg.on('pointerup', release);
      bg.on('pointerout', release);

      this.buttons.push({ bg, label, key: d.key });
    }
  }

  get up(): boolean    { return this.held.has('up'); }
  get down(): boolean  { return this.held.has('down'); }
  get left(): boolean  { return this.held.has('left'); }
  get right(): boolean { return this.held.has('right'); }

  setVisible(v: boolean): void {
    this.buttons.forEach(b => { b.bg.setVisible(v); b.label.setVisible(v); });
  }
}
