// wiki/concepts/장구-시스템.md "등급별 획득처" 표 구현.
// ponytail: 하품/중품/상품 드랍 확률과 강화석 동반 수량, 보호부적 획득처는 위키에 수치가
// 없어 v1 근사치로 신규 정의(절품 "확정 드랍"만 위키 그대로). 상세는 wiki/concepts/
// 장구-시스템.md v1 구현 범위 절 참고.

import { isBossStage, type StageId } from './combat';
import { ALL_SLOTS, createGearItem, type GearItem } from './gearData';

const COMMON_DROP_CHANCE = 0.12; // 하품, 일반 스테이지
const UNCOMMON_DROP_CHANCE = 0.08; // 중품, 소보스(X-5) 이상
const RARE_BOSS_DROP_CHANCE = 0.4; // 상품, 대보스(X-10)
const PROTECTION_CHARM_BOSS_CHANCE = 0.05; // 보호부적, 대보스(X-10) 전용 희귀 드랍

// 장구-시스템.md "신품·선품 획득 경로" 1절 — 챕터3 최초 클리어는 신품 확정, 이미 깬 보스를
// 반복 처치하면 희귀 드랍. ponytail: 확률은 구현 후 시뮬레이터로 조정할 자리표시자.
const DIVINE_FIRST_CLEAR_MAJOR = 21;
const BOSS_REPEAT_DROPS: { minMajor: number; grade: '절품' | '신품'; chance: number }[] = [
  { minMajor: 11, grade: '절품', chance: 0.02 },
  { minMajor: 21, grade: '신품', chance: 0.003 },
];

const randomSlot = () => ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)];

export interface StageDropResult {
  items: GearItem[];
  stones: number;
  protectionCharms: number;
}

export const rollStageDrops = (
  stage: StageId,
  playerLevel: number,
  isFirstMajorClear: boolean,
): StageDropResult => {
  const items: GearItem[] = [];
  let stones = 0;
  let protectionCharms = 0;

  if (Math.random() < COMMON_DROP_CHANCE) {
    items.push(createGearItem(randomSlot(), '하품', playerLevel));
    stones += 1;
  }
  if (stage.sub >= 5 && Math.random() < UNCOMMON_DROP_CHANCE) {
    items.push(createGearItem(randomSlot(), '중품', playerLevel));
    stones += 2;
  }
  if (isBossStage(stage)) {
    if (Math.random() < RARE_BOSS_DROP_CHANCE)
      items.push(createGearItem(randomSlot(), '상품', playerLevel));
    if (Math.random() < PROTECTION_CHARM_BOSS_CHANCE) protectionCharms += 1;
    if (isFirstMajorClear) {
      const grade = stage.major >= DIVINE_FIRST_CLEAR_MAJOR ? '신품' : '절품';
      items.push(createGearItem(randomSlot(), grade, playerLevel));
    } else {
      for (const { minMajor, grade, chance } of BOSS_REPEAT_DROPS) {
        if (stage.major >= minMajor && Math.random() < chance)
          items.push(createGearItem(randomSlot(), grade, playerLevel));
      }
    }
  }

  return { items, stones, protectionCharms };
};
