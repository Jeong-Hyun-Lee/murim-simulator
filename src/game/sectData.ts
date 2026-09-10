// wiki/concepts/문파-시스템.md "수치" 절 축소 구현.
// ponytail: 6개 문파 중 목현은 스토리상 청운문 고정 소속(§UX "청운문 예외") — 가입/이적 UI,
// 문파원 목록·일일임무·주간토벌전(멀티플레이 전제)은 백엔드 없는 v1에서 전부 skip.
// 기여도 획득은 "내공 기부"(1,000 내공=1 기여도) 한 경로만 v1에 구현, 문파무공 보드는 후속 확장.

export const SECT_NAME = "청운문";
export const SECT_MAX_LEVEL = 50;
export const CHI_PER_CONTRIBUTION = 1000;

const BASE_SECT_EXP = 50;
const SECT_GROWTH = 1.08;

export function sectExpToNextLevel(level: number): number {
  return Math.round(BASE_SECT_EXP * SECT_GROWTH ** (level - 1));
}

const BONUS_TABLE: [number, number][] = [
  [10, 3],
  [20, 7],
  [30, 12],
  [40, 18],
  [50, 25],
];

export function sectBuffPercent(level: number): number {
  let result = 0;
  for (const [lvl, pct] of BONUS_TABLE) {
    if (level >= lvl) result = pct;
  }
  return result;
}
