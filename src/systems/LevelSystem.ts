import { Character } from '../entities/Character';

export interface LevelUpResult {
  leveled: boolean;
  newLevel: number;
  hpGain: number;
  mpGain: number;
  atkGain: number;
  defGain: number;
}

export function calcNextExp(level: number): number {
  return level * 10 + 5;
}

export function gainExp(character: Character, amount: number): LevelUpResult {
  character.exp += amount;
  const result: LevelUpResult = {
    leveled: false,
    newLevel: character.level,
    hpGain: 0,
    mpGain: 0,
    atkGain: 0,
    defGain: 0,
  };

  while (character.exp >= character.nextExp) {
    character.exp -= character.nextExp;
    character.level += 1;
    character.nextExp = calcNextExp(character.level);

    const hpGain = 15;
    const mpGain = 5;
    const atkGain = 3;
    const defGain = 2;

    character.maxHp += hpGain;
    character.hp = character.maxHp; // レベルアップで全回復
    character.maxMp += mpGain;
    character.mp = character.maxMp;
    character.atk += atkGain;
    character.def += defGain;

    result.leveled = true;
    result.newLevel = character.level;
    result.hpGain += hpGain;
    result.mpGain += mpGain;
    result.atkGain += atkGain;
    result.defGain += defGain;
  }

  return result;
}
