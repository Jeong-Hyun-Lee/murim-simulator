// wiki/concepts/장구-시스템.md "수치" 절 정식 구현 — 9슬롯 인벤토리·등급·강화.
// ponytail: 등급/드랍 확률 자체(dropData.ts)와 달리 이 파일의 슬롯 스탯 비중·강화 비용/확률/
// 강화석 수는 위키에 명시된 수치를 그대로 옮긴 것. 강화석 개수는 위키 본문 예시("+6~+8:2개,
// +9~+11:3개")와 위키에 적힌 식 `ceil(level/3)`이 서로 안 맞아(예: ceil(7/3)=3≠2), 예시를
// 기준으로 역산한 `ceil((level-5)/3)+1`을 채택 — 위키 상점-기연-시스템 갱신 시 함께 정정.

import { GRADE_MULTIPLIER, type Grade } from './gradeData';

export type SlotId =
  'weapon' | 'body' | 'head' | 'arm' | 'foot' | 'waist' | 'neck' | 'ringL' | 'ringR';

export type StatKey =
  | 'atk'
  | 'def'
  | 'hp'
  | 'critChance'
  | 'critDamage'
  | 'attackSpeed'
  | 'evasion'
  | 'chiGain'
  | 'statusResist';

export const SLOT_INFO: Record<
  SlotId,
  { name: string; weights: Partial<Record<StatKey, number>> }
> = {
  weapon: { name: '무기(병기)', weights: { atk: 0.7, critChance: 0.2, critDamage: 0.1 } },
  body: { name: '몸통(갑주)', weights: { def: 0.5, hp: 0.4, statusResist: 0.1 } },
  head: { name: '머리(두건)', weights: { hp: 0.4, def: 0.3, critDamage: 0.3 } },
  arm: { name: '팔(완갑)', weights: { atk: 0.3, attackSpeed: 0.4, critChance: 0.3 } },
  foot: { name: '발(경신화)', weights: { evasion: 0.4, attackSpeed: 0.4, def: 0.2 } },
  waist: { name: '허리(요대)', weights: { hp: 0.5, def: 0.5 } },
  neck: { name: '목(패도목걸이)', weights: { chiGain: 0.3, atk: 0.4, critDamage: 0.3 } },
  ringL: { name: '손가락 L(지환)', weights: { critChance: 0.5, atk: 0.3, critDamage: 0.2 } },
  ringR: { name: '손가락 R(지환)', weights: { critChance: 0.3, critDamage: 0.5, atk: 0.2 } },
};

export const ALL_SLOTS: SlotId[] = Object.keys(SLOT_INFO) as SlotId[];

const ITEM_STAT_COEFF = 20; // wiki 예시계수

export interface GearItem {
  id: string;
  slot: SlotId;
  grade: Grade;
  itemLevel: number; // 드랍/획득 시점 캐릭터 레벨
  enhanceLevel: number; // +0~+15
}

let nextItemSeq = 1;
export const createGearItem = (slot: SlotId, grade: Grade, itemLevel: number): GearItem => {
  const id = `item-${Date.now()}-${nextItemSeq}`;
  nextItemSeq += 1;
  return { id, slot, grade, itemLevel: Math.max(1, itemLevel), enhanceLevel: 0 };
};

// BaseStat_슬롯 = ItemLevel × Coeff × SlotWeight × GradeMultiplier — 강화 단계는 포함하지 않음
// (강화는 별도로 Σ가산버프 버킷에 더해짐, enhanceBuffPercent 참고. 이중계산 방지 규정).
export const itemBaseStats = (item: GearItem): Partial<Record<StatKey, number>> => {
  const { weights } = SLOT_INFO[item.slot];
  const gradeMult = GRADE_MULTIPLIER[item.grade];
  const result: Partial<Record<StatKey, number>> = {};
  for (const key of Object.keys(weights) as StatKey[]) {
    const weight = weights[key]!;
    result[key] = item.itemLevel * ITEM_STAT_COEFF * weight * gradeMult;
  }
  return result;
};

export const ENHANCE_MAX_LEVEL = 15;
const ENHANCE_BASE_COST = 100;
const ENHANCE_GROWTH = 1.6;
export const ENHANCE_BUFF_PERCENT_PER_LEVEL = 1.5;
const PROTECTION_THRESHOLD = 11; // wiki "강화 성공 확률" 표 기준 — +11~+15 구간에서 하락 위험·보호부적 모두 적용

export const enhanceCost = (currentLevel: number): number =>
  Math.round(ENHANCE_BASE_COST * ENHANCE_GROWTH ** currentLevel);

// targetLevel = 강화 성공 시 도달하는 단계(currentLevel+1).
export const enhanceSuccessChance = (targetLevel: number): number => {
  if (targetLevel <= 5) return 1.0;
  if (targetLevel <= 10) return (90 - 5 * (targetLevel - 6)) / 100;
  return (50 - 5 * (targetLevel - 11)) / 100;
};

export const enhanceStoneCost = (targetLevel: number): number => {
  if (targetLevel < 6) return 0;
  return Math.ceil((targetLevel - 5) / 3) + 1;
};

export const needsProtectionEligible = (targetLevel: number): boolean =>
  targetLevel >= PROTECTION_THRESHOLD && targetLevel <= ENHANCE_MAX_LEVEL;

// 실패 시 -1 하락 확률(보호부적 미사용 시). +11 이상 구간에서만 적용.
const DOWNGRADE_CHANCE_ON_FAIL = 0.3;

export interface EnhanceResult {
  success: boolean;
  downgraded: boolean;
  newLevel: number;
}

export const rollEnhance = (currentLevel: number, useProtection: boolean): EnhanceResult => {
  const targetLevel = currentLevel + 1;
  const success = Math.random() < enhanceSuccessChance(targetLevel);
  if (success) return { success: true, downgraded: false, newLevel: targetLevel };

  const canDowngrade =
    targetLevel >= PROTECTION_THRESHOLD &&
    !useProtection &&
    Math.random() < DOWNGRADE_CHANCE_ON_FAIL;
  return {
    success: false,
    downgraded: canDowngrade,
    newLevel: canDowngrade ? currentLevel - 1 : currentLevel,
  };
};

export interface GearDerivedStats {
  atk: number;
  def: number;
  hp: number;
  critChancePercent: number;
  critDamagePercent: number;
  attackSpeedPercent: number;
  evasionPercent: number;
  chiGainPercent: number;
  statusResistPercent: number; // 상태이상 시스템 부재로 v1에서는 집계만 하고 효과는 없음
  enhanceBuffPercent: number; // Σ가산버프 버킷에 합산되는 항목(스테이지-레벨링-기획서 7장)
}

export const aggregateGearStats = (
  equipped: Partial<Record<SlotId, GearItem>>,
): GearDerivedStats => {
  const stats: GearDerivedStats = {
    atk: 0,
    def: 0,
    hp: 0,
    critChancePercent: 0,
    critDamagePercent: 0,
    attackSpeedPercent: 0,
    evasionPercent: 0,
    chiGainPercent: 0,
    statusResistPercent: 0,
    enhanceBuffPercent: 0,
  };
  for (const item of Object.values(equipped).filter((it): it is GearItem => !!it)) {
    const base = itemBaseStats(item);
    stats.atk += base.atk ?? 0;
    stats.def += base.def ?? 0;
    stats.hp += base.hp ?? 0;
    stats.critChancePercent += base.critChance ?? 0;
    stats.critDamagePercent += base.critDamage ?? 0;
    stats.attackSpeedPercent += base.attackSpeed ?? 0;
    stats.evasionPercent += base.evasion ?? 0;
    stats.chiGainPercent += base.chiGain ?? 0;
    stats.statusResistPercent += base.statusResist ?? 0;
    stats.enhanceBuffPercent += item.enhanceLevel * ENHANCE_BUFF_PERCENT_PER_LEVEL;
  }
  return stats;
};
