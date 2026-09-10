// wiki/concepts/장구-시스템.md "수치" 절 축소 구현.
// ponytail: 원문은 9슬롯 + 드랍/인벤토리 + 강화석 + 확률 실패(+11 이상)까지 포함하지만,
// v1엔 드랍/인벤토리 시스템 자체가 없어 "무기" 슬롯 1개만, 실패 없는 결정적 강화로 축소.
// 나머지 8슬롯·강화석·실패 확률·보호부적은 인벤토리 시스템 도입 시 확장.

export const WEAPON_MAX_LEVEL = 15;
const BASE_COST = 100;
const GROWTH_RATE = 1.6;
const BUFF_PERCENT_PER_LEVEL = 1.5;

export function weaponUpgradeCost(currentLevel: number): number {
  return Math.round(BASE_COST * GROWTH_RATE ** currentLevel);
}

export function weaponBuffPercent(level: number): number {
  return level * BUFF_PERCENT_PER_LEVEL;
}
