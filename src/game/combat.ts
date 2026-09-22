// wiki/concepts/스테이지-레벨링-기획서.md 2~5장 공식 그대로 구현.
// ponytail: BASE_* 앵커값(HP/ATK/DEF/EXP/GOLD/CHI 각 1)은 위키에 실측치가 없어 1-1이 이기고 시작할
// 만한 수준으로 임의 지정한 자리표시자 — 실측 밸런싱 시 여기만 바꾸면 전체 곡선이 따라 움직인다.

export interface StageId {
  major: number; // 1~30 (챕터1: 1~10, 챕터2: 11~20, 챕터3: 21~30)
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
  // wiki/concepts/스토리보드-기획서-챕터3.md 2장 — 대21~30.
  21: '혈교 삼장로',
  22: '천외 추혼대주',
  23: '흑사막 마적왕',
  24: '사천당가 독수 당혁',
  25: '천외 탐혼사',
  26: '천외 혼백사',
  27: '귀환자 한도윤',
  28: '천외 결계사',
  29: '호천위장',
  30: '천외주',
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
  21: '사기 잠식 혈귀병',
  22: '추혼대 사냥꾼',
  23: '흑사막 마적',
  24: '당가 이탈파 문도',
  25: '천외 탐혼 시종',
  26: '혼백 괴뢰',
  27: '귀환파 계약 무사',
  28: '설원 결계병',
  29: '호천위 무사',
  30: '천외 친위 술사',
};

// 스테이지-레벨링-기획서 10절 진행 곡선 재조정안(2026-09-13) — 챕터3(대30)까지 자동전투 약 하루.
// 몬스터 세 스탯은 플레이어 스탯(레벨당 같은 비율)과 격차가 벌어지지 않게 비슷한 성장률로 두고,
// 공격 성장률은 후반까지 내 방어력을 따라가도록 체력·방어보다 조금 높게 잡는다.
// 경험치는 기초치만 낮춰 속도를 맞춘다. 내공·전 보상 곡선은 신규 무공 보드 비용과 맞물려 유지.
const BASE_HP_1 = 45;
const BASE_ATK_1 = 9;
const BASE_DEF_1 = 3;
const HP_GROWTH = 1.5;
const ATK_GROWTH = 1.37;
const DEF_GROWTH = 1.25;
const BASE_EXP_1 = 6;
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

// 스테이지-적-구성-연출-기획서 1절 배치 템플릿 — 모든 대스테이지가 1~6 졸개, 7~8 변형(공격형),
// 9 정예, 10 두목. 코드 키 archer는 대1 궁수에서 온 이름이지만 "변형" 전체를 뜻한다.
// 전용 그림은 아직 대1만 있고, 나머지는 전투 캔버스의 대체 표시를 쓴다.
export const enemyKind = (stage: StageId): EnemyKind => {
  if (isBossStage(stage)) return 'boss';
  if (stage.sub >= 9) return 'elite';
  if (stage.sub >= 7) return 'archer';
  return 'grunt';
};

// 스테이지-적-구성-연출-기획서 2절 로스터의 변형·정예 이름.
const MOB_VARIANT_NAMES: Record<number, Partial<Record<EnemyKind, string>>> = {
  1: { archer: '혈랑채 궁수', elite: '혈랑채 정예산적' },
  2: { archer: '흑시장 독침꾼', elite: '흑시장 해결사' },
  3: { archer: '팽가 비도수', elite: '팽가 도객 교두' },
  4: { archer: '사공 암기수', elite: '진기 폭주 무인' },
  5: { archer: '혈교 암전수', elite: '혈교 살수 조장' },
  6: { archer: '부패 관군 궁병', elite: '마두의 호위 무사' },
  7: { archer: '기억의 잔상', elite: '주화의 불꽃' },
  8: { archer: '혈교 궁노수', elite: '혈교 선봉 백인장' },
  9: { archer: '혈교 밀정', elite: '매수된 청운문 제자' },
  10: { archer: '혈공 술사', elite: '혈인(血人)' },
  11: { archer: '잔당 암기수', elite: '밀사 호위' },
  12: { archer: '수로채 화공 궁수', elite: '수로채 두령' },
  13: { archer: '방계 식객 암기수', elite: '방계 장로 직속 검수' },
  14: { archer: '세작 비수수', elite: '타락한 매화검수' },
  15: { archer: '혈교 혈침술사', elite: '이장로 친위대장' },
  16: { archer: '결계 부적사', elite: '천외 탐혼 술사' },
  17: { archer: '폭주한 진기 파편', elite: '갈취된 힘의 화신' },
  18: { archer: '혈교 궁노대', elite: '호법 직속 무사' },
  19: { archer: '진법 궁수', elite: '결진 장로' },
  20: { archer: '개천 술사', elite: '문지기 친위장' },
  21: { archer: '사기 투척병', elite: '사기 잠식 장로 호위' },
  22: { archer: '추혼대 쇠뇌수', elite: '추혼대 조장' },
  23: { archer: '흑사막 기마 궁수', elite: '흑사막 마적 두령' },
  24: { archer: '당가 암기수', elite: '당가 독인(毒人)' },
  25: { archer: '탐혼 추적 술사', elite: '탐혼사 수석 제자' },
  26: { archer: '혼백 조종 술사', elite: '이혼 의식 수호자' },
  27: { archer: '귀환파 청부 궁수', elite: '귀환파 부대장' },
  28: { archer: '결계 궁수', elite: '진안 수호자' },
  29: { archer: '호천위 궁수', elite: '호천위 부장' },
  30: { archer: '문의 그림자', elite: '선객의 잔상' },
};

// 종류별 가중치 — 소스테이지 기본 공식(§2.1) 위에 곱한다. 적 한 대가 성장 곡선 위 플레이어 체력의
// 약 2~13%를 깎도록 공격을 잡고, 처치가 늘어지지 않게 체력은 낮게 둔다.
// 궁수는 잘 죽지만 아프게 때리고(유리 대포), 정예산적은 보스 앞을 막는 벽 역할이라 체력·방어가 높다.
// 보상은 체력(=처치에 걸리는 시간)에 맞춰 잡아 특정 종류가 파밍 최적 구간이 되지 않게 한다 —
// 졸개 대비 시간당 보상이 궁수 약 1.1배, 정예 약 0.94배, 보스 약 1.67배가 되도록 맞췄다.
const KIND_WEIGHTS: Record<EnemyKind, { hp: number; atk: number; def: number; reward: number }> = {
  grunt: { hp: 0.7, atk: 1.3, def: 1.0, reward: 1.0 },
  archer: { hp: 0.6, atk: 1.6, def: 0.85, reward: 0.95 },
  elite: { hp: 1.0, atk: 1.0, def: 1.3, reward: 1.35 },
  boss: { hp: 1.8, atk: 1.1, def: 1.5, reward: 4.3 },
};

export const monsterStats = (stage: StageId): UnitStats => {
  const effSub = Math.min(stage.sub, 9);
  const baseHp = BASE_HP_1 * HP_GROWTH ** (stage.major - 1);
  const baseAtk = BASE_ATK_1 * ATK_GROWTH ** (stage.major - 1);
  const baseDef = BASE_DEF_1 * DEF_GROWTH ** (stage.major - 1);

  const kind = enemyKind(stage);
  const weight = KIND_WEIGHTS[kind];
  const hp = baseHp * (1 + 0.15 * (effSub - 1)) * weight.hp;
  const atk = baseAtk * (1 + 0.12 * (effSub - 1)) * weight.atk;
  const def = baseDef * (1 + 0.1 * (effSub - 1)) * weight.def;

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
  const rewardWeight = KIND_WEIGHTS[enemyKind(stage)].reward;
  const exp = BASE_EXP_1 * 1.8 ** (stage.major - 1) * (1 + 0.15 * (effSub - 1)) * rewardWeight;
  const gold = BASE_GOLD_1 * 1.6 ** (stage.major - 1) * (1 + 0.12 * (effSub - 1)) * rewardWeight;
  const chi = BASE_CHI_1 * 1.8 ** (stage.major - 1) * (1 + 0.15 * (effSub - 1)) * rewardWeight;

  return { exp: Math.round(exp), gold: Math.round(gold), chi: Math.round(chi) };
};

// wiki/concepts/스테이지-레벨링-기획서.md 1.1절 — 챕터3(대21~30)까지.
export const FINAL_MAJOR = 30;

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

// 피해 편차 — 기본 피해의 90%~110% 사이 정수를 고르게 뽑는다(10 → 9~11, 100만 → 90만~110만).
// 전투 수치 연출용 내부 규칙이라 스탯창에는 표시하지 않는다.
const DAMAGE_MIN_RATIO = 0.9;
const DAMAGE_MAX_RATIO = 1.1;

// 비율식 — 방어가 공격과 같으면 피해 절반. 뺄셈식(공격 − 방어)은 방어가 공격을 넘는 순간
// 피해가 1로 고정돼 적 공격이 무의미해지므로 쓰지 않는다.
export const baseDamage = (attackerAtk: number, defenderDef: number): number =>
  Math.max(1, (attackerAtk * attackerAtk) / (attackerAtk + Math.max(0, defenderDef)));

export const damage = (attackerAtk: number, defenderDef: number): number => {
  const base = baseDamage(attackerAtk, defenderDef);
  const min = Math.max(1, Math.round(base * DAMAGE_MIN_RATIO));
  const max = Math.max(min, Math.round(base * DAMAGE_MAX_RATIO));
  return min + Math.floor(Math.random() * (max - min + 1));
};

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
