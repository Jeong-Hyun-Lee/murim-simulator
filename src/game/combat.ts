// wiki/concepts/스테이지-레벨링-기획서.md 2~5장 공식 그대로 구현.
// ponytail: BASE_* 앵커값(HP/ATK/DEF/EXP/GOLD/CHI 각 1)은 위키에 실측치가 없어 1-1이 이기고 시작할
// 만한 수준으로 임의 지정한 자리표시자 — 실측 밸런싱 시 여기만 바꾸면 전체 곡선이 따라 움직인다.

export interface StageId {
  major: number; // 1~20 (챕터1: 1~10, 챕터2: 11~20)
  sub: number; // 1~10
}

export const BOSS_NAMES: Record<number, string> = {
  1: '혈랑채 두목',
  2: '흑시장 조직 두목',
  3: '팽가 소공자',
  4: '사공(邪功) 사용자',
  5: '혈교 살수 두목',
  6: '마두',
  7: '심마(心魔)',
  8: '혈교 선봉대장',
  9: '청운문 배신자',
  10: '혈교 하남지단주 척망',
  // wiki/concepts/스토리보드-기획서-챕터2.md 2장 — 대11~20.
  11: '혈교 밀사',
  12: '장강 수로채 채주',
  13: '남궁세가 방계 장로',
  14: '화산 마검',
  15: '혈교 이장로',
  16: '천외 술사',
  17: '타락한 전이자',
  18: '혈교 호법',
  19: '혈교 부교주',
  20: '혈교주',
};

const MOB_NAMES: Record<number, string> = {
  1: '혈랑채 졸개',
  2: '흑시장 하수인',
  3: '팽가 무사',
  4: '사공 추종자',
  5: '혈교 살수',
  6: '마두의 수하',
  7: '심마의 환영',
  8: '혈교 선봉병',
  9: '배신자의 수하',
  10: '혈교 정예병',
  11: '혈교 척후병',
  12: '수로채 뱃도적',
  13: '남궁세가 방계 무사',
  14: '화산파 잠입 세작',
  15: '혈교 정예 호위',
  16: '천외 견습 술사',
  17: '타락한 전이자의 잔영',
  18: '혈교 정사대전 병사',
  19: '총단 수문장',
  20: '혈교 친위대',
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

export const isBossStage = (stage: StageId): boolean => stage.sub === 10;

export type EnemyKind = 'grunt' | 'archer' | 'elite' | 'boss';

// 대1(혈랑채)은 보스 직전 구간에 궁수·정예산적을 배치해 난이도 결을 만든다. 나머지 대스테이지는
// 아직 종류별 아트가 없어 잡몹 1종 + 보스 구성 그대로다.
export const enemyKind = (stage: StageId): EnemyKind => {
  if (isBossStage(stage)) return 'boss';
  if (stage.major !== 1) return 'grunt';
  if (stage.sub >= 9) return 'elite';
  if (stage.sub >= 7) return 'archer';
  return 'grunt';
};

// 잡몹 이름이 종류별로 갈리는 대스테이지만 등록 — 없으면 MOB_NAMES의 대표 이름을 쓴다.
const MOB_VARIANT_NAMES: Record<number, Partial<Record<EnemyKind, string>>> = {
  1: { archer: '혈랑채 궁수', elite: '혈랑채 정예산적' },
};

export const monsterStats = (stage: StageId): UnitStats => {
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

  const kind = enemyKind(stage);
  const name =
    kind === 'boss'
      ? BOSS_NAMES[stage.major]
      : (MOB_VARIANT_NAMES[stage.major]?.[kind] ?? MOB_NAMES[stage.major]);
  return { name, hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
};

export interface StageReward {
  exp: number;
  gold: number;
  chi: number;
}

export const stageReward = (stage: StageId): StageReward => {
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
};

// wiki/concepts/스테이지-레벨링-기획서.md 1.1절 — 챕터2(대11~20) 신설로 10→20 상향(2026-09-12).
const FINAL_MAJOR = 20;

export const nextStage = (stage: StageId): StageId => {
  if (stage.major === FINAL_MAJOR && stage.sub === 10) return stage; // 최종 스테이지는 계속 반복 파밍
  if (stage.sub < 10) return { major: stage.major, sub: stage.sub + 1 };
  return { major: stage.major + 1, sub: 1 };
};

// 현재 기획된 마지막 스테이지(다음 스토리가 아직 없어 nextStage가 같은 자리를 반환하는 지점).
export const isFinalStage = (stage: StageId): boolean =>
  stage.major === FINAL_MAJOR && stage.sub === 10;

// 정상 진행 순서상 이 스테이지 직전에 클리어했어야 하는 스테이지 — 패배 시 후퇴 지점으로 사용.
export const previousStage = (stage: StageId): StageId => {
  if (stage.sub > 1) return { major: stage.major, sub: stage.sub - 1 };
  if (stage.major > 1) return { major: stage.major - 1, sub: 10 };
  return stage; // 1-1은 더 이전 스테이지가 없음
};

export const stageLabel = (stage: StageId): string => `${stage.major}-${stage.sub}`;

// 플레이어 기본 스탯 곡선 — 스테이지-레벨링-기획서 §7-1의 1.052^(Lv-1) 곡선을
// HP/ATK/DEF 각각에 동일 비율로 적용한 v1 근사치.
const PLAYER_BASE_HP = 60;
const PLAYER_BASE_ATK = 8;
const PLAYER_BASE_DEF = 3;

// 장구-시스템 슬롯 스탯(치명타율/치명타피해/공격속도/회피율/내공획득량) 인게임 반영 기준값.
// 위키 BaseStat 공식(ItemLevel×Coeff×SlotWeight×GradeMultiplier)을 %스탯에 그대로 적용하면
// 고레벨에서 100%를 가볍게 넘으므로, 실제 전투 계산에 쓰일 때만 안전 상한을 둔다(원본 합산치
// 자체는 gearData.ts에 그대로 보존 — 인벤토리/강화 UI 수치 표시는 원본을 그대로 보여준다).
const BASE_CRIT_CHANCE = 0.1;
const BASE_CRIT_MULTIPLIER = 1.5;
const MAX_CRIT_CHANCE = 0.9;
const MAX_EVASION = 0.75;

export interface GearStatBonus {
  atk: number;
  def: number;
  hp: number;
  critChancePercent: number;
  critDamagePercent: number;
  attackSpeedPercent: number;
  evasionPercent: number;
  chiGainPercent: number;
}

const NO_GEAR: GearStatBonus = {
  atk: 0,
  def: 0,
  hp: 0,
  critChancePercent: 0,
  critDamagePercent: 0,
  attackSpeedPercent: 0,
  evasionPercent: 0,
  chiGainPercent: 0,
};

export interface PlayerStats extends UnitStats {
  critChance: number; // 0~1
  critMultiplier: number; // 예: 1.5 = 치명타 시 150% 피해
  attackSpeedPercent: number; // BattleCanvas가 공격 주기 계산에 사용
  evasion: number; // 0~1
  chiGainMultiplier: number; // 1 = 기본
}

const clamp = (x: number, min: number, max: number): number => Math.max(min, Math.min(max, x));

export const playerStats = (
  level: number,
  buffPercent = 0,
  gear: GearStatBonus = NO_GEAR,
  name = '목현',
): PlayerStats => {
  const charMult = 1.052 ** (level - 1);
  const buffMult = 1 + buffPercent / 100;

  return {
    name,
    hp: Math.round((PLAYER_BASE_HP * charMult + gear.hp) * buffMult),
    atk: Math.round((PLAYER_BASE_ATK * charMult + gear.atk) * buffMult),
    def: Math.round((PLAYER_BASE_DEF * charMult + gear.def) * buffMult),
    critChance: clamp(BASE_CRIT_CHANCE + gear.critChancePercent / 100, 0, MAX_CRIT_CHANCE),
    critMultiplier: BASE_CRIT_MULTIPLIER + gear.critDamagePercent / 100,
    attackSpeedPercent: gear.attackSpeedPercent,
    evasion: clamp(gear.evasionPercent / 100, 0, MAX_EVASION),
    chiGainMultiplier: 1 + gear.chiGainPercent / 100,
  };
};

// wiki/concepts/스테이지-레벨링-기획서.md 7장 "전투력 지수" 표시용 근사치.
// player.hp/atk/def는 이미 버프가 곱연산된 최종치라 별도 가중합만 하면 된다.
// ponytail: 가중치(0.5/8/8)는 위키 §7 "Lv1 ≈ 100" 앵커에 근접시킨 자리표시자 — 실측 밸런싱 시 조정.
export const combatPower = (stats: Pick<PlayerStats, 'hp' | 'atk' | 'def'>): number =>
  Math.round(stats.hp * 0.5 + stats.atk * 8 + stats.def * 8);

export const expToNextLevel = (level: number): number => Math.round(40 * 1.15 ** (level - 1));

export const damage = (attackerAtk: number, defenderDef: number): number =>
  Math.max(1, attackerAtk - defenderDef);

export interface DamageResult {
  amount: number;
  isCrit: boolean;
}

export const rollPlayerDamage = (
  attackerAtk: number,
  defenderDef: number,
  critChance: number,
  critMultiplier: number,
): DamageResult => {
  const base = damage(attackerAtk, defenderDef);
  const isCrit = Math.random() < critChance;
  return { amount: isCrit ? Math.round(base * critMultiplier) : base, isCrit };
};

export const rollEvaded = (evasion: number): boolean => Math.random() < evasion;
