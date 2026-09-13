import { create } from 'zustand';
import type { StageId } from './combat';
import type { GongLevels } from './gongData';
import type { GearItem, SlotId } from './gearData';

const SAVE_KEY = 'murim-simulator-save-v2';

export interface GameState {
  level: number;
  exp: number;
  gold: number;
  chi: number;
  stage: StageId;
  gongLevels: GongLevels;
  equippedGear: Partial<Record<SlotId, GearItem>>;
  inventory: GearItem[];
  enhanceStones: number;
  protectionCharms: number;
  rebirthCount: number;
  highestMajorCleared: number;
  sectLevel: number;
  sectExp: number;
  sectTotalContribution: number;
  sectContributionPoints: number; // 문파무공(삼재검법 2보) 강화에 쓰는 소모 가능 기여도 잔액
  elixir: number;
  elixirExchangeCount: number;
  gachaPity: number;
  lastLoginDate: string; // YYYY-MM-DD, 로컬 날짜 기준 1일 1회 재접속 보너스 판정용
  nickname: string;
  onboardingDone: boolean;
  tutorialGongDone: boolean;
  // 사냥터 모드로 진입하기 전, 자동 등반이 멈춰 있던 원래 스테이지(복귀 대상). null이면 사냥터 모드가 아님.
  farmReturnStage: StageId | null;
}

const defaultState = (): GameState => ({
  level: 1,
  exp: 0,
  gold: 0,
  chi: 0,
  stage: { major: 1, sub: 1 },
  gongLevels: {},
  equippedGear: {},
  inventory: [],
  enhanceStones: 0,
  protectionCharms: 0,
  rebirthCount: 0,
  highestMajorCleared: 0,
  sectLevel: 1,
  sectExp: 0,
  sectTotalContribution: 0,
  sectContributionPoints: 0,
  elixir: 0,
  elixirExchangeCount: 0,
  gachaPity: 0,
  lastLoginDate: '',
  nickname: '',
  onboardingDone: false,
  tutorialGongDone: false,
  farmReturnStage: null,
});

// 저장 실패(저장 공간 부족·브라우저 저장 차단 등)를 화면에 알리기 위한 상태 — 실패를 성공처럼 숨기지 않는다.
export const useSaveStatus = create<{ failed: boolean }>(() => ({ failed: false }));

export const loadState = (): GameState => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<GameState>) };
  } catch {
    return defaultState();
  }
};

export const saveState = (state: GameState) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (useSaveStatus.getState().failed) useSaveStatus.setState({ failed: false });
  } catch {
    useSaveStatus.setState({ failed: true });
  }
};
