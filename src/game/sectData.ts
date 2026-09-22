// wiki/concepts/문파-시스템.md "수치" 절 축소 구현.
// ponytail: 6개 문파 중 목현은 스토리상 청운문 고정 소속(§UX "청운문 예외") — 가입/이적 UI,
// 문파원 목록·일일임무·주간토벌전(멀티플레이 전제)은 백엔드 없는 v1에서 전부 skip.
// 기여도 획득은 "내공 기부"(1,000 내공=1 기여도)와 "영약 기부"(영약 1개=10 기여도) 2경로 구현.
// 청운문 문파무공은 삼재검법 2보. 청운문 Lv50(일대종사) 이후 청운문 기여도를 타 문파에 바쳐
// 교분을 쌓고, 기준치에 닿으면 그 문파의 무공 보드를 전수받는다(gongData.ts SECT_ART_BOARDS).

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

export interface OtherSect {
  id: string;
  name: string;
  boardId: string; // 교분이 기준치에 닿으면 전수받는 무공 보드
}

// wiki/concepts/문파-시스템.md "일대종사·타 문파 교류". 전수 기준치는 문파 공통.
// ponytail: 기준치는 구현 후 조정 예정인 자리표시자.
export const SECT_FAVOR_TO_TRANSMIT = 3000;

export const OTHER_SECTS: OtherSect[] = [
  { id: 'hwasan', name: '화산파', boardId: 'hwasan_maehwa' },
  { id: 'mudang', name: '무당파', boardId: 'mudang_taeguk' },
  { id: 'namgung', name: '남궁세가', boardId: 'namgung_changnyong' },
  { id: 'gaebang', name: '개방', boardId: 'gaebang_hangnyong' },
  { id: 'sorim', name: '소림사', boardId: 'sorim_baekbo' },
];
