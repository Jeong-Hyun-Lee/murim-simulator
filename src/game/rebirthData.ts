// wiki/concepts/환골탈태-시스템.md "수치" 절 그대로 구현.

const REALM_NAMES = ['후천', '선천', '초절정', '화경', '현경', '생사경'];

export const realmName = (count: number): string => {
  if (count < REALM_NAMES.length) return REALM_NAMES[count];
  return `등봉조극 ${count - REALM_NAMES.length + 1}중`;
};

export const rebirthGateMajor = (count: number): number => {
  if (count === 0) return 7;
  if (count === 1) return 9;
  return 10;
};

export const rebirthBuffPercent = (count: number): number => count * 15;
