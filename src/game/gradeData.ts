// wiki/concepts/장구-시스템.md 등급 체계 통합 표 — 장구/기연 전 시스템 공통 6단계.
// gachaData.ts와 gearData.ts가 공유하므로 별도 모듈로 분리(기존엔 gachaData.ts에만 있었음).

export type Grade = '하품' | '중품' | '상품' | '절품' | '신품' | '선품';

export const GRADE_ORDER: Grade[] = ['하품', '중품', '상품', '절품', '신품', '선품'];

export const GRADE_MULTIPLIER: Record<Grade, number> = {
  하품: 1.0,
  중품: 1.3,
  상품: 1.7,
  절품: 2.3,
  신품: 3.0,
  선품: 4.0,
};

export const GRADE_COLOR: Record<Grade, string> = {
  하품: '#9e9e9e',
  중품: '#4caf50',
  상품: '#2196f3',
  절품: '#9c27b0',
  신품: '#ff9800',
  선품: '#ffd76a',
};

export const gradeTier = (grade: Grade): number => GRADE_ORDER.indexOf(grade);

export const gradeAtLeast = (grade: Grade, floor: Grade): boolean =>
  gradeTier(grade) >= gradeTier(floor);
