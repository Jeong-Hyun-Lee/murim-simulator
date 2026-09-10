// wiki/concepts/상점-기연-시스템.md "수치" 절 축소 구현.
// ponytail: 장구 인벤토리가 없어 뽑기 보상은 아이템 대신 등급 배율(장구-시스템 6단계)을 곱한
// 내공 지급으로 대체. 일반상점은 shopData.ts(전→영약 교환 1종)로 v1 범위 축소 구현,
// 결과 카드 등급별 색상/글로우는 GRADE_COLOR·GRADE_TIER로 GachaPanel에서 적용.

export const PULL_COST = 100; // 영약
export const PULL_10_COST = 900;
export const SOFT_PITY_START = 75; // 76번째 굴림부터 선품 확률 가산 시작
export const HARD_PITY = 90;
const BASE_CHI_REWARD = 200;

export type Grade = "하품" | "중품" | "상품" | "절품" | "신품" | "선품";

const GRADE_TABLE: { grade: Grade; chance: number; mult: number }[] = [
  { grade: "하품", chance: 0.55, mult: 1.0 },
  { grade: "중품", chance: 0.3, mult: 1.3 },
  { grade: "상품", chance: 0.12, mult: 1.7 },
  { grade: "절품", chance: 0.025, mult: 2.3 },
  { grade: "신품", chance: 0.0045, mult: 3.0 },
  { grade: "선품", chance: 0.0005, mult: 4.0 },
];

// wiki/concepts/장구-시스템.md 등급 체계 통합 표의 색상 그대로 사용.
export const GRADE_COLOR: Record<Grade, string> = {
  하품: "#9e9e9e",
  중품: "#4caf50",
  상품: "#2196f3",
  절품: "#9c27b0",
  신품: "#ff9800",
  선품: "#ffd76a",
};

// 뽑기 결과 연출 강도(0=하품 ~ 5=선품) — wiki "뽑기 결과 연출" 표의 등급별 차등을
// 카드 테두리 글로우 강도로 단순화 구현(파티클/화면 진동 등은 캔버스 연출 인프라
// 없는 v1에서 범위 밖).
export function gradeTier(grade: Grade): number {
  return GRADE_TABLE.findIndex((g) => g.grade === grade);
}

function multFor(grade: Grade): number {
  return GRADE_TABLE.find((g) => g.grade === grade)!.mult;
}

function rewardFor(grade: Grade): number {
  return Math.round(BASE_CHI_REWARD * multFor(grade));
}

function gradeAtLeast(grade: Grade, floor: Grade): boolean {
  const order = GRADE_TABLE.map((g) => g.grade);
  return order.indexOf(grade) >= order.indexOf(floor);
}

export interface PullResult {
  grade: Grade;
  reward: number;
}

// pityCounter: 마지막 선품 이후 굴린 횟수(0부터 시작, 이번 굴림 전 값을 전달).
function rollOnce(pityCounter: number): { grade: Grade; nextPity: number } {
  if (pityCounter >= HARD_PITY - 1) {
    return { grade: "선품", nextPity: 0 };
  }

  const table = GRADE_TABLE.map((g) => ({ ...g }));
  if (pityCounter + 1 >= SOFT_PITY_START) {
    const bonus = (pityCounter + 1 - SOFT_PITY_START + 1) * 0.005;
    const sun = table.find((g) => g.grade === "선품")!;
    const ha = table.find((g) => g.grade === "하품")!;
    const applied = Math.min(bonus, ha.chance);
    sun.chance += applied;
    ha.chance -= applied;
  }

  let roll = Math.random();
  for (const g of table) {
    if (roll < g.chance) return { grade: g.grade, nextPity: g.grade === "선품" ? 0 : pityCounter + 1 };
    roll -= g.chance;
  }
  const last = table[table.length - 1];
  return { grade: last.grade, nextPity: last.grade === "선품" ? 0 : pityCounter + 1 };
}

export function pullSingle(pityCounter: number): { result: PullResult; nextPity: number } {
  const { grade, nextPity } = rollOnce(pityCounter);
  return { result: { grade, reward: rewardFor(grade) }, nextPity };
}

export function pullTen(pityCounter: number): { results: PullResult[]; nextPity: number } {
  let pity = pityCounter;
  const results: PullResult[] = [];
  for (let i = 0; i < 10; i++) {
    const { grade, nextPity } = rollOnce(pity);
    pity = nextPity;
    results.push({ grade, reward: rewardFor(grade) });
  }
  if (!results.some((r) => gradeAtLeast(r.grade, "상품"))) {
    results[results.length - 1] = { grade: "상품", reward: rewardFor("상품") };
  }
  return { results, nextPity: pity };
}
