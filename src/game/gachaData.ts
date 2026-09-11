// wiki/concepts/상점-기연-시스템.md "수치" 절 구현.
// ponytail: 일반상점은 shopData.ts(전→영약 교환 1종)로 v1 범위 축소 구현. 결과 카드 등급별
// 색상/글로우는 GRADE_COLOR·gradeTier(gradeData.ts, 재노출)로 GachaPanel에서 적용.
// 2026-09-10: 장구 인벤토리 도입에 맞춰 기연 보상을 내공 환산 대신 실제 장구 아이템으로
// 변경 — 여기서는 등급/슬롯만 정하고, 실제 GearItem 생성(플레이어 레벨 필요)은 store.ts에서.

import { GRADE_COLOR, gradeAtLeast, gradeTier, type Grade } from './gradeData';
import { ALL_SLOTS, type SlotId } from './gearData';

export { GRADE_COLOR, gradeTier };
export type { Grade };

export const PULL_COST = 100; // 영약
export const PULL_10_COST = 900;
export const SOFT_PITY_START = 75; // 76번째 굴림부터 선품 확률 가산 시작
export const HARD_PITY = 90;

const GRADE_CHANCE: Record<Grade, number> = {
  하품: 0.55,
  중품: 0.3,
  상품: 0.12,
  절품: 0.025,
  신품: 0.0045,
  선품: 0.0005,
};

const GRADE_ORDER_TABLE = (Object.keys(GRADE_CHANCE) as Grade[]).map((grade) => ({
  grade,
  chance: GRADE_CHANCE[grade],
}));

const randomSlot = (): SlotId => ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)];

export interface PullResult {
  grade: Grade;
  slot: SlotId;
}

// pityCounter: 마지막 선품 이후 굴린 횟수(0부터 시작, 이번 굴림 전 값을 전달).
const rollOnce = (pityCounter: number): { grade: Grade; nextPity: number } => {
  if (pityCounter >= HARD_PITY - 1) {
    return { grade: '선품', nextPity: 0 };
  }

  const table = GRADE_ORDER_TABLE.map((g) => ({ ...g }));
  if (pityCounter + 1 >= SOFT_PITY_START) {
    const bonus = (pityCounter + 1 - SOFT_PITY_START + 1) * 0.005;
    const sun = table.find((g) => g.grade === '선품')!;
    const ha = table.find((g) => g.grade === '하품')!;
    const applied = Math.min(bonus, ha.chance);
    sun.chance += applied;
    ha.chance -= applied;
  }

  let roll = Math.random();
  for (const g of table) {
    if (roll < g.chance)
      return { grade: g.grade, nextPity: g.grade === '선품' ? 0 : pityCounter + 1 };
    roll -= g.chance;
  }
  const last = table[table.length - 1];
  return { grade: last.grade, nextPity: last.grade === '선품' ? 0 : pityCounter + 1 };
};

export const pullSingle = (pityCounter: number): { result: PullResult; nextPity: number } => {
  const { grade, nextPity } = rollOnce(pityCounter);
  return { result: { grade, slot: randomSlot() }, nextPity };
};

export const pullTen = (pityCounter: number): { results: PullResult[]; nextPity: number } => {
  let pity = pityCounter;
  const results: PullResult[] = [];
  for (let i = 0; i < 10; i += 1) {
    const { grade, nextPity } = rollOnce(pity);
    pity = nextPity;
    results.push({ grade, slot: randomSlot() });
  }
  if (!results.some((r) => gradeAtLeast(r.grade, '상품'))) {
    results[results.length - 1] = { grade: '상품', slot: randomSlot() };
  }
  return { results, nextPity: pity };
};
