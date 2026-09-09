// wiki/concepts/스테이지-레벨링-기획서.md 2~5장 공식 그대로 구현.
// ponytail: BASE_* 앵커값(HP/ATK/DEF/EXP/GOLD/CHI 각 1)은 위키에 실측치가 없어 1-1이 이기고 시작할
// 만한 수준으로 임의 지정한 자리표시자 — 실측 밸런싱 시 여기만 바꾸면 전체 곡선이 따라 움직인다.

export interface StageId {
  major: number; // 1~10
  sub: number; // 1~10
}

export const BOSS_NAMES: Record<number, string> = {
  1: "혈랑채 두목",
  2: "흑시장 조직 두목",
  3: "팽가 소공자",
  4: "사공(邪功) 사용자",
  5: "혈교 살수 두목",
  6: "마두",
  7: "심마(心魔)",
  8: "혈교 선봉대장",
  9: "청운문 배신자",
  10: "혈교 하남지단주 척망",
};

const MOB_NAMES: Record<number, string> = {
  1: "혈랑채 졸개",
  2: "흑시장 하수인",
  3: "팽가 무사",
  4: "사공 추종자",
  5: "혈교 살수",
  6: "마두의 수하",
  7: "심마의 환영",
  8: "혈교 선봉병",
  9: "배신자의 수하",
  10: "혈교 정예병",
};

const BASE_HP_1 = 30;
const BASE_ATK_1 = 6;
const BASE_DEF_1 = 2;
const BASE_EXP_1 = 20;
const BASE_GOLD_1 = 10;
const BASE_CHI_1 = 15;

export interface UnitStats {
  name: string;
  hp: number;
  atk: number;
  def: number;
}

export function isBossStage(stage: StageId): boolean {
  return stage.sub === 10;
}

export function monsterStats(stage: StageId): UnitStats {
  const effSub = Math.min(stage.sub, 9);
  const baseHp = BASE_HP_1 * 1.8 ** (stage.major - 1);
  const baseAtk = BASE_ATK_1 * 1.6 ** (stage.major - 1);
  const baseDef = BASE_DEF_1 * 1.5 ** (stage.major - 1);

  let hp = baseHp * (1 + 0.15 * (effSub - 1));
  let atk = baseAtk * (1 + 0.12 * (effSub - 1));
  let def = baseDef * (1 + 0.1 * (effSub - 1));

  if (isBossStage(stage)) {
    hp *= 3.0;
    atk *= 2.0;
    def *= 1.5;
  }

  const name = isBossStage(stage) ? BOSS_NAMES[stage.major] : MOB_NAMES[stage.major];
  return { name, hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
}

export interface StageReward {
  exp: number;
  gold: number;
  chi: number;
}

export function stageReward(stage: StageId): StageReward {
  const effSub = Math.min(stage.sub, 9);
  let exp = BASE_EXP_1 * 1.8 ** (stage.major - 1) * (1 + 0.15 * (effSub - 1));
  let gold = BASE_GOLD_1 * 1.6 ** (stage.major - 1) * (1 + 0.12 * (effSub - 1));
  let chi = BASE_CHI_1 * 1.8 ** (stage.major - 1) * (1 + 0.15 * (effSub - 1));

  if (isBossStage(stage)) {
    exp *= 5.0;
    gold *= 5.0;
    chi *= 5.0;
  }

  return { exp: Math.round(exp), gold: Math.round(gold), chi: Math.round(chi) };
}

export function nextStage(stage: StageId): StageId {
  if (stage.major === 10 && stage.sub === 10) return stage; // 챕터1 최종 스테이지는 계속 반복 파밍
  if (stage.sub < 10) return { major: stage.major, sub: stage.sub + 1 };
  return { major: stage.major + 1, sub: 1 };
}

export function stageLabel(stage: StageId): string {
  return `${stage.major}-${stage.sub}`;
}

// 플레이어 기본 스탯 곡선 — 스테이지-레벨링-기획서 §7-1의 1.052^(Lv-1) 곡선을
// HP/ATK/DEF 각각에 동일 비율로 적용한 v1 근사치.
const PLAYER_BASE_HP = 60;
const PLAYER_BASE_ATK = 8;
const PLAYER_BASE_DEF = 3;

export function playerStats(level: number, gongBuffPercent = 0): UnitStats {
  const mult = 1.052 ** (level - 1) * (1 + gongBuffPercent / 100);
  return {
    name: "목현",
    hp: Math.round(PLAYER_BASE_HP * mult),
    atk: Math.round(PLAYER_BASE_ATK * mult),
    def: Math.round(PLAYER_BASE_DEF * mult),
  };
}

export function expToNextLevel(level: number): number {
  return Math.round(40 * 1.15 ** (level - 1));
}

export function damage(attackerAtk: number, defenderDef: number): number {
  return Math.max(1, attackerAtk - defenderDef);
}

// ponytail: 장구-시스템의 슬롯별 치명타율/치명타피해 스탯은 v1 인벤토리가 없어 아직 반영 못함 —
// 플레이어 공격에만 고정 확률/배율 크리티컬 적용한 축소판.
const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 1.5;

export interface DamageResult {
  amount: number;
  isCrit: boolean;
}

export function rollPlayerDamage(attackerAtk: number, defenderDef: number): DamageResult {
  const base = damage(attackerAtk, defenderDef);
  const isCrit = Math.random() < CRIT_CHANCE;
  return { amount: isCrit ? Math.round(base * CRIT_MULTIPLIER) : base, isCrit };
}
