export interface CharacterStats {
  name: string;
  level: number;
  exp: number;
  nextExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
}

export class Character {
  name: string;
  level: number;
  exp: number;
  nextExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;

  constructor(stats: CharacterStats) {
    this.name = stats.name;
    this.level = stats.level;
    this.exp = stats.exp;
    this.nextExp = stats.nextExp;
    this.hp = stats.hp;
    this.maxHp = stats.maxHp;
    this.mp = stats.mp;
    this.maxMp = stats.maxMp;
    this.atk = stats.atk;
    this.def = stats.def;
    this.spd = stats.spd;
  }

  get isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(amount: number): number {
    const actual = Math.max(1, amount);
    this.hp = Math.max(0, this.hp - actual);
    return actual;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  useMp(amount: number): boolean {
    if (this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  toStats(): CharacterStats {
    return {
      name: this.name,
      level: this.level,
      exp: this.exp,
      nextExp: this.nextExp,
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      atk: this.atk,
      def: this.def,
      spd: this.spd,
    };
  }
}
