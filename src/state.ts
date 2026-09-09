import type { StageId } from "./combat";

const SAVE_KEY = "murim-simulator-save-v1";

export interface GameState {
  level: number;
  exp: number;
  gold: number;
  chi: number;
  stage: StageId;
}

export function loadState(): GameState {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { level: 1, exp: 0, gold: 0, chi: 0, stage: { major: 1, sub: 1 } };
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return { level: 1, exp: 0, gold: 0, chi: 0, stage: { major: 1, sub: 1 } };
  }
}

export function saveState(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
