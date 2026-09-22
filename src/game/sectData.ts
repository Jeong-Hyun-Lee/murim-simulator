// wiki/concepts/문파-시스템.md "수치" 절 축소 구현.
// ponytail: 6개 문파 중 목현은 스토리상 청운문 고정 소속(§UX "청운문 예외") — 가입/이적 UI,
// 문파원 목록·일일임무·주간토벌전(멀티플레이 전제)은 백엔드 없는 v1에서 전부 skip.
// 기여도 획득은 "내공 기부"(1,000 내공=1 기여도)와 "영약 기부"(영약 1개=10 기여도) 2경로 구현.
// 청운문 문파무공은 삼재검법 2보. 청운문 Lv50(일대종사) 이후 청운문 기여도를 타 문파에 바쳐
// 그 문파 레벨을 올리고, Lv50이 되면 그 문파의 무공 보드를 전수받는다(gongData.ts SECT_ART_BOARDS).

import type { SlotId } from './gearData';
import type { GongSecondaryStats, GongStatKey } from './gongData';

export const SECT_NAME = '청운문';
export const SECT_MAX_LEVEL = 50;
export const CHI_PER_CONTRIBUTION = 1000;
export const ELIXIR_CONTRIBUTION_RATE = 10; // 영약 1개 = 10 기여도

// Lv50까지 누적 약 8,200 기여도.
const BASE_SECT_EXP = 30;
const SECT_GROWTH = 1.06;

export const sectExpToNextLevel = (level: number): number =>
  Math.round(BASE_SECT_EXP * SECT_GROWTH ** (level - 1));

const BONUS_TABLE: [number, number][] = [
  [10, 3],
  [20, 7],
  [30, 12],
  [40, 18],
  [50, 25],
];

export const sectBuffPercent = (level: number): number => {
  let result = 0;
  for (const [lvl, pct] of BONUS_TABLE) {
    if (level >= lvl) result = pct;
  }
  return result;
};

// 청운문 최대 레벨 달성 시 받는 직책 — 타 문파 교류가 열린다.
export const GRANDMASTER_TITLE = '일대종사';

type SecondaryStatKey = Exclude<GongStatKey, 'power'>;

export interface OtherSect {
  id: string;
  name: string;
  boardId: string; // 문파 Lv50에 전수받는 무공 보드
  giftSlot: SlotId; // 처음 기여도를 바칠 때 1회 받는 신품의 슬롯(문파 상징)
  perkStat: SecondaryStatKey; // 문파 레벨 특전으로 오르는 보조 스탯(문파 성격)
}

// wiki/concepts/문파-시스템.md "일대종사 · 타 문파 교류".
// 5개 문파 전수를 모두 마치면 1회 받는 일대종사 신표(선품)의 슬롯.
export const GRANDMASTER_SEAL_SLOT: SlotId = 'head';

export const OTHER_SECTS: OtherSect[] = [
  {
    id: 'hwasan',
    name: '화산파',
    boardId: 'hwasan_maehwa',
    giftSlot: 'weapon',
    perkStat: 'attackSpeed',
  },
  { id: 'mudang', name: '무당파', boardId: 'mudang_taeguk', giftSlot: 'body', perkStat: 'evasion' },
  {
    id: 'namgung',
    name: '남궁세가',
    boardId: 'namgung_changnyong',
    giftSlot: 'neck',
    perkStat: 'critDamage',
  },
  {
    id: 'gaebang',
    name: '개방',
    boardId: 'gaebang_hangnyong',
    giftSlot: 'foot',
    perkStat: 'chiGain',
  },
  { id: 'sorim', name: '소림사', boardId: 'sorim_baekbo', giftSlot: 'arm', perkStat: 'critChance' },
];

// 타 문파 레벨은 청운문과 같은 곡선(sectExpToNextLevel)이고, 바친 기여도 누적치(sectFavor)로 계산한다.
export const otherSectLevel = (favor: number): { level: number; exp: number } => {
  let level = 1;
  let exp = favor;
  while (level < SECT_MAX_LEVEL && exp >= sectExpToNextLevel(level)) {
    exp -= sectExpToNextLevel(level);
    level += 1;
  }
  return { level, exp };
};

// 최대 레벨까지 필요한 누적 기여도 — 이만큼 바치면 무공 전수, 더는 받지 않는다.
export const OTHER_SECT_MAX_FAVOR = Array.from({ length: SECT_MAX_LEVEL - 1 }, (_, i) =>
  sectExpToNextLevel(i + 1),
).reduce((a, b) => a + b, 0);

export const isSectTransmitted = (favor: number): boolean => favor >= OTHER_SECT_MAX_FAVOR;

export const allSectsTransmitted = (sectFavor: Record<string, number>): boolean =>
  OTHER_SECTS.every((o) => isSectTransmitted(sectFavor[o.id] ?? 0));

// 문파 레벨 특전 — Lv10마다 한 단계, Lv50에 최대치(%). 오의 보조 스탯(gongData CAPSTONE_STAT_TOTAL)과 같은 규모.
// ponytail: 수치는 구현 후 조정할 자리표시자.
const OTHER_SECT_PERK_MAX: Record<SecondaryStatKey, number> = {
  critChance: 2,
  critDamage: 6,
  attackSpeed: 3,
  evasion: 1.5,
  chiGain: 5,
};

export const otherSectPerkPercent = (sect: OtherSect, favor: number): number =>
  (OTHER_SECT_PERK_MAX[sect.perkStat] * Math.floor(otherSectLevel(favor).level / 10)) / 5;

const PERK_FIELD: Record<SecondaryStatKey, keyof GongSecondaryStats> = {
  critChance: 'critChancePercent',
  critDamage: 'critDamagePercent',
  attackSpeed: 'attackSpeedPercent',
  evasion: 'evasionPercent',
  chiGain: 'chiGainPercent',
};

export const otherSectSecondaryStats = (sectFavor: Record<string, number>): GongSecondaryStats => {
  const stats: GongSecondaryStats = {
    critChancePercent: 0,
    critDamagePercent: 0,
    attackSpeedPercent: 0,
    evasionPercent: 0,
    chiGainPercent: 0,
  };
  for (const sect of OTHER_SECTS) {
    stats[PERK_FIELD[sect.perkStat]] += otherSectPerkPercent(sect, sectFavor[sect.id] ?? 0);
  }
  return stats;
};
