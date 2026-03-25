import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS,
} from '../constants';
import { Character } from '../entities/Character';
import { EnemyData } from '../data/enemies';
import { BattleManager, BattleCommand } from '../systems/BattleManager';
import { gainExp } from '../systems/LevelSystem';
import { HPBar } from '../ui/HPBar';

type UIState = 'command' | 'message' | 'level_up' | 'ended';

const COMMANDS: { label: string; cmd: BattleCommand }[] = [
  { label: 'こうげき', cmd: 'attack' },
  { label: 'じゅもん', cmd: 'magic' },
  { label: 'にげる',  cmd: 'run'   },
];

export class BattleScene extends Phaser.Scene {
  private player!: Character;
  private enemy!: Character;
  private enemyData!: EnemyData;
  private manager!: BattleManager;

  private playerHPBar!: HPBar;
  private enemyHPBar!: HPBar;
  private playerHPText!: Phaser.GameObjects.Text;
  private enemyHPText!: Phaser.GameObjects.Text;

  private messageText!: Phaser.GameObjects.Text;
  private commandTexts: Phaser.GameObjects.Text[] = [];
  private commandCursor = 0;
  private cursorGraphic!: Phaser.GameObjects.Graphics;

  private enemyExp = 0;
  private uiState: UIState = 'command';
  private messageQueue: string[] = [];
  private waitTimer = 0;

  private spaceKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: SCENE_KEYS.BATTLE });
  }

  init(data: { player: Character; enemy: EnemyData }): void {
    this.enemyData = data.enemy;
    this.player = data.player;
    this.enemy = new Character({
      name: data.enemy.name,
      level: 1,
      exp: 0,
      nextExp: 999,
      hp: data.enemy.hp,
      maxHp: data.enemy.maxHp,
      mp: data.enemy.mp,
      maxMp: data.enemy.maxMp,
      atk: data.enemy.atk,
      def: data.enemy.def,
      spd: data.enemy.spd,
    });
    this.enemyExp = data.enemy.exp;
    this.manager = new BattleManager(this.player, this.enemy);
    this.uiState = 'command';
    this.messageQueue = [];
    this.commandCursor = 0;
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.drawBackground();
    this.drawEnemySprite();
    this.drawPlayerSprite();
    this.createStatusUI();
    this.createCommandUI();
    this.createMessageUI();
    this.createCursor();
    this.setupKeys();

    this.showMessage(`${this.enemy.name} があらわれた！`);
    this.time.delayedCall(1200, () => {
      this.uiState = 'command';
      this.updateCommandUI();
    });
  }

  // ---------- 描画 ----------

  private drawBackground(): void {
    const g = this.add.graphics();
    // 空
    g.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x2a2a6e, 0x2a2a6e, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);
    // 地面
    g.fillStyle(0x3a6449, 1);
    g.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);
    // 地平線
    g.lineStyle(3, 0x2a5239, 1);
    g.lineBetween(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.55);
  }

  private drawEnemySprite(): void {
    const ex = GAME_WIDTH * 0.65;
    const ey = GAME_HEIGHT * 0.3;
    const g = this.add.graphics();
    const data = this.getEnemyData();
    const s = data.size * 48;
    g.fillStyle(data.color, 1);
    g.fillCircle(ex, ey, s);
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(ex - s * 0.3, ey - s * 0.3, s * 0.25);
    g.fillCircle(ex + s * 0.3, ey - s * 0.3, s * 0.25);

    // 名前タグ
    this.add.text(ex, ey + s + 10, this.enemy.name, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
  }

  private getEnemyData() {
    return this.enemyData;
  }

  private drawPlayerSprite(): void {
    const px = GAME_WIDTH * 0.2;
    const py = GAME_HEIGHT * 0.42;
    const g = this.add.graphics();
    // 体
    g.fillStyle(COLORS.PLAYER, 1);
    g.fillRect(px - 12, py - 4, 24, 22);
    // 頭
    g.fillCircle(px, py - 16, 13);
    g.lineStyle(2, COLORS.PLAYER_OUTLINE, 1);
    g.strokeCircle(px, py - 16, 13);
  }

  private createStatusUI(): void {
    const panelY = GAME_HEIGHT * 0.62;

    // 背景パネル
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d1e, 0.95);
    bg.fillRoundedRect(10, panelY, GAME_WIDTH - 20, GAME_HEIGHT - panelY - 10, 8);
    bg.lineStyle(2, 0x4a4aff, 1);
    bg.strokeRoundedRect(10, panelY, GAME_WIDTH - 20, GAME_HEIGHT - panelY - 10, 8);

    // プレイヤーステータス
    const psx = 20;
    const psy = panelY + 10;

    this.add.text(psx, psy, `${this.player.name} Lv.${this.player.level}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#ffff88',
    });

    this.add.text(psx, psy + 20, 'HP', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#88ff88',
    });
    this.playerHPBar = new HPBar(this, psx + 24, psy + 22, 160, 12, 0x22dd44);
    this.playerHPBar.update(this.player.hp, this.player.maxHp);

    this.playerHPText = this.add.text(psx + 192, psy + 20, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    this.updateHPTexts();

    // 敵ステータス
    const esx = GAME_WIDTH / 2 + 10;
    this.add.text(esx, psy, this.enemy.name, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#ff8888',
    });
    this.add.text(esx, psy + 20, 'HP', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ff6666',
    });
    this.enemyHPBar = new HPBar(this, esx + 24, psy + 22, 160, 12, 0xdd2222);
    this.enemyHPBar.update(this.enemy.hp, this.enemy.maxHp);

    this.enemyHPText = this.add.text(esx + 192, psy + 20, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    this.updateHPTexts();
  }

  private updateHPTexts(): void {
    this.playerHPText.setText(`${this.player.hp}/${this.player.maxHp}`);
    this.enemyHPText.setText(`${this.enemy.hp}/${this.enemy.maxHp}`);
    this.playerHPBar.update(this.player.hp, this.player.maxHp);
    this.enemyHPBar.update(this.enemy.hp, this.enemy.maxHp);
  }

  private createCommandUI(): void {
    const startX = 30;
    const startY = GAME_HEIGHT * 0.72;
    this.commandTexts = COMMANDS.map((c, i) => {
      const t = this.add.text(startX + 16, startY + i * 26, c.label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ffffff',
        padding: { x: 10, y: 8 },
      }).setInteractive({ useHandCursor: false });

      t.on('pointerdown', () => {
        if (this.uiState !== 'command') return;
        this.commandCursor = i;
        this.updateCommandUI();
        this.executeCommand(c.cmd);
      });
      t.on('pointerover', () => {
        if (this.uiState !== 'command') return;
        this.commandCursor = i;
        this.updateCommandUI();
      });

      return t;
    });
  }

  private createMessageUI(): void {
    this.messageText = this.add.text(GAME_WIDTH * 0.3, GAME_HEIGHT * 0.72, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: GAME_WIDTH * 0.65 },
    });
    this.messageText.setVisible(false);
  }

  private createCursor(): void {
    this.cursorGraphic = this.add.graphics();
    this.updateCommandUI();
  }

  private updateCommandUI(): void {
    const startX = 28;
    const startY = GAME_HEIGHT * 0.72;
    this.cursorGraphic.clear();

    const visible = this.uiState === 'command';
    this.commandTexts.forEach(t => t.setVisible(visible));
    this.messageText.setVisible(!visible || this.uiState === 'message');
    this.cursorGraphic.setVisible(visible);

    if (visible) {
      this.messageText.setVisible(false);
      this.cursorGraphic.fillStyle(0xffff00, 1);
      this.cursorGraphic.fillTriangle(
        startX, startY + this.commandCursor * 26 + 4,
        startX, startY + this.commandCursor * 26 + 14,
        startX + 8, startY + this.commandCursor * 26 + 9,
      );
    }
  }

  private setupKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  }

  // ---------- ゲームループ ----------

  update(_time: number, delta: number): void {
    if (this.uiState === 'command') {
      this.handleCommandInput();
    }
  }

  private handleCommandInput(): void {
    if (!this.upKey || !this.downKey || !this.spaceKey) return;
    if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.commandCursor = (this.commandCursor - 1 + COMMANDS.length) % COMMANDS.length;
      this.updateCommandUI();
    } else if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.commandCursor = (this.commandCursor + 1) % COMMANDS.length;
      this.updateCommandUI();
    } else if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.executeCommand(COMMANDS[this.commandCursor].cmd);
    }
  }

  private executeCommand(cmd: BattleCommand): void {
    let result;
    if (cmd === 'attack') result = this.manager.playerAttack();
    else if (cmd === 'magic') result = this.manager.playerMagic();
    else result = this.manager.playerRun();

    this.updateHPTexts();

    if (result.escaped) {
      this.showMessage(result.message, () => this.returnToWorld());
      return;
    }

    const endCheck = this.manager.checkBattleEnd();
    if (endCheck.ended) {
      if (endCheck.playerWon) {
        this.showMessage(result.message, () => this.handleVictory());
      } else {
        this.showMessage(result.message, () => this.handleDefeat());
      }
      return;
    }

    // メッセージ表示後、敵ターン
    this.showMessage(result.message, () => {
      const enemyResult = this.manager.enemyAction();
      this.updateHPTexts();
      const endCheck2 = this.manager.checkBattleEnd();
      if (endCheck2.ended && !endCheck2.playerWon) {
        this.showMessage(enemyResult.message, () => this.handleDefeat());
      } else {
        this.showMessage(enemyResult.message, () => {
          this.uiState = 'command';
          this.updateCommandUI();
        });
      }
    });
  }

  private showMessage(msg: string, callback?: () => void): void {
    this.uiState = 'message';
    this.commandTexts.forEach(t => t.setVisible(false));
    this.cursorGraphic.setVisible(false);
    this.messageText.setVisible(true);
    this.messageText.setText(msg);
    this.waitTimer = 1400;

    if (callback) {
      this.time.delayedCall(1400, callback);
    }
  }

  private handleVictory(): void {
    const enemyData = { exp: 0 }; // exp は scene init で渡した EnemyData から取得
    // EnemyData の exp を使いたいが Character には持たせていないため
    // BattleManager 経由で enemy の exp を取得する代わりに固定値を使う
    // ※ 実装を簡略化するため enemy の exp を BattleManager に保持
    const expGain = this.enemyExp;

    const levelResult = gainExp(this.player, expGain);
    const expMsg = `${this.enemy.name} をたおした！\n${expGain} の経験値を獲得！`;

    if (levelResult.leveled) {
      this.showMessage(expMsg, () => {
        this.showMessage(
          `レベルアップ！ Lv.${levelResult.newLevel} になった！\nHP +${levelResult.hpGain}  ATK +${levelResult.atkGain}  DEF +${levelResult.defGain}`,
          () => this.returnToWorld()
        );
      });
    } else {
      this.showMessage(expMsg, () => this.returnToWorld());
    }
  }

  private handleDefeat(): void {
    this.showMessage(`${this.player.name} は たおれた……`, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENE_KEYS.GAME_OVER);
      });
    });
  }

  private returnToWorld(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.WORLD, { player: this.player });
    });
  }
}
