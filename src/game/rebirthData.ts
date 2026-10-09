// wiki/concepts/환골탈태-시스템.md "수치" 절 그대로 구현.

const REALM_NAMES = ['후천', '선천', '초절정', '화경', '현경', '생사경'];

export const realmName = (count: number): string => {
  if (count < REALM_NAMES.length) return REALM_NAMES[count];
  return `등봉조극 ${count - REALM_NAMES.length + 1}중`;
};

// 회차별 게이트(보스 클리어 대스테이지) — 스토리 이정표마다 한 번씩만 돌파한다.
const REBIRTH_GATES = [7, 9, 10, 15, 20, 25, 30];

// 다음 회차의 게이트. 목록을 다 돌파했으면 null.
export const rebirthGateMajor = (count: number): number | null => REBIRTH_GATES[count] ?? null;

export const rebirthBuffPercent = (count: number): number => count * 15;
