import type { StageId } from "./combat";
import type { GongLevels } from "./gongData";

const SAVE_KEY = "murim-simulator-save-v1";

export interface GameState {
  level: number;
  exp: number;
  gold: number;
  chi: number;
  stage: StageId;
  gongLevels: GongLevels;
  weaponLevel: number;
  rebirthCount: number;
  highestMajorCleared: number;
  sectLevel: number;
  sectExp: number;
  sectTotalContribution: number;
  elixir: number;
  gachaPity: number;
  lastLoginDate: string; // YYYY-MM-DD, 로컬 날짜 기준 1일 1회 재접속 보너스 판정용
}

function defaultState(): GameState {
  return {
    level: 1,
    exp: 0,
    gold: 0,
    chi: 0,
    stage: { major: 1, sub: 1 },
    gongLevels: {},
    weaponLevel: 0,
    rebirthCount: 0,
    highestMajorCleared: 0,
    sectLevel: 1,
    sectExp: 0,
    sectTotalContribution: 0,
    elixir: 0,
    gachaPity: 0,
    lastLoginDate: "",
  };
}

export function loadState(): GameState {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return defaultState();
  try {
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<GameState>) };
  } catch {
    return defaultState();
  }
}

export function saveState(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
