// wiki/concepts/장구-시스템.md "등급별 획득처" 표 구현.
// ponytail: 하품/중품/상품 드랍 확률과 강화석 동반 수량, 보호부적 획득처는 위키에 수치가
// 없어 v1 근사치로 신규 정의(절품 "확정 드랍"만 위키 그대로). 상세는 wiki/concepts/
// 장구-시스템.md v1 구현 범위 절 참고.

import { isBossStage, type StageId } from "./combat";
import { ALL_SLOTS, createEquipItem, type EquipItem } from "./equipData";

const COMMON_DROP_CHANCE = 0.12; // 하품, 일반 스테이지
const UNCOMMON_DROP_CHANCE = 0.08; // 중품, 소보스(X-5) 이상
const RARE_BOSS_DROP_CHANCE = 0.4; // 상품, 대보스(X-10)
const PROTECTION_CHARM_BOSS_CHANCE = 0.05; // 보호부적, 대보스(X-10) 전용 희귀 드랍

function randomSlot() {
  return ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)];
}

export interface StageDropResult {
  items: EquipItem[];
  stones: number;
  protectionCharms: number;
}

export function rollStageDrops(stage: StageId, playerLevel: number, isFirstMajorClear: boolean): StageDropResult {
  const items: EquipItem[] = [];
  let stones = 0;
  let protectionCharms = 0;

  if (Math.random() < COMMON_DROP_CHANCE) {
    items.push(createEquipItem(randomSlot(), "하품", playerLevel));
    stones += 1;
  }
  if (stage.sub >= 5 && Math.random() < UNCOMMON_DROP_CHANCE) {
    items.push(createEquipItem(randomSlot(), "중품", playerLevel));
    stones += 2;
  }
  if (isBossStage(stage)) {
    if (Math.random() < RARE_BOSS_DROP_CHANCE) items.push(createEquipItem(randomSlot(), "상품", playerLevel));
    if (Math.random() < PROTECTION_CHARM_BOSS_CHANCE) protectionCharms += 1;
    if (isFirstMajorClear) items.push(createEquipItem(randomSlot(), "절품", playerLevel));
  }

  return { items, stones, protectionCharms };
}
