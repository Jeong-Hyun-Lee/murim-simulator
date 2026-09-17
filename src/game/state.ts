import { create } from 'zustand';
import type { StageId } from './combat';
import type { GongLevels } from './gongData';
import type { GearItem, SlotId } from './gearData';
import { EMPTY_DAILY_COUNTS, type DailyCounts } from './goalData';

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
  // 스토리 연출 최초 1회 판정 — 환골탈태로 1-1에 돌아가도 유지한다.
  storySeenMajor: number; // 진입 카드를 본 가장 높은 대스테이지
  storySeenStage: number; // 자막을 본 가장 먼 소스테이지(storyStageIndex 일렬 번호)
  // 마지막으로 저장한 시각(ms) — 다시 열었을 때 오프라인 보상 경과 시간 계산용. 0이면 기록 없음.
  lastActiveAt: number;
  // 수련 목표 — dailyDate가 오늘이 아니면 일일 진행·수령 기록은 초기화된 것으로 본다.
  dailyDate: string;
  dailyCounts: DailyCounts;
  dailyClaimed: string[];
  milestonesClaimed: string[];
  totalKills: number;
  towerBest: number;
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
  storySeenMajor: 0,
  storySeenStage: 0,
  lastActiveAt: 0,
  dailyDate: '',
  dailyCounts: EMPTY_DAILY_COUNTS,
  dailyClaimed: [],
  milestonesClaimed: [],
  totalKills: 0,
  towerBest: 0,
});

// 저장 실패(저장 공간 부족·브라우저 저장 차단 등)를 화면에 알리기 위한 상태 — 실패를 성공처럼 숨기지 않는다.
export const useSaveStatus = create<{ failed: boolean }>(() => ({ failed: false }));

export const loadState = (): GameState => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    // 연출 필드가 없는 기존 저장은 이미 클리어한 대스테이지까지 본 것으로 취급 — 지나온 연출을 다시 띄우지 않는다.
    const cleared = parsed.highestMajorCleared ?? 0;
    return {
      ...defaultState(),
      storySeenMajor: cleared,
      storySeenStage: cleared * 10,
      ...parsed,
    };
  } catch {
    return defaultState();
  }
};

// 백업 복원 직후 새로고침 전까지 실행 중인 게임이 복원한 저장을 덮어쓰지 못하게 막는다.
let saveLocked = false;

export const saveState = (state: GameState) => {
  if (saveLocked) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (useSaveStatus.getState().failed) useSaveStatus.setState({ failed: false });
  } catch {
    useSaveStatus.setState({ failed: true });
  }
};

// 세이브 백업 — 서버가 없어 브라우저 데이터가 지워지면 진행이 사라지므로 저장 내용을 문자열로 옮긴다.
// 한글 도호가 들어 있어 UTF-8 바이트로 바꾼 뒤 base64로 인코딩한다.
export const exportSaveCode = (): string => {
  const bytes = new TextEncoder().encode(localStorage.getItem(SAVE_KEY) ?? '');
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
};

// 성공하면 true — 호출한 쪽이 바로 새로고침해 복원한 저장으로 다시 시작한다.
export const importSaveCode = (code: string): boolean => {
  try {
    const binary = atob(code.trim());
    const text = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    const parsed = JSON.parse(text) as Partial<GameState>;
    if (typeof parsed.level !== 'number' || typeof parsed.stage?.major !== 'number') return false;
    localStorage.setItem(SAVE_KEY, text);
    saveLocked = true;
    return true;
  } catch {
    return false;
  }
};
