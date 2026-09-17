// wiki/concepts/장기-플레이-시스템.md 3절 "수련탑" — 최고 기록 다음 층부터 한 층씩 오르는 도전.
// 적은 스테이지 곡선을 5층당 대스테이지 1단계씩 따라가므로 대30 이후에도 계속 강해진다.
import { monsterStats, type StageId, type UnitStats } from './combat';
import type { GoalReward } from './goalData';

export const TOWER_UNLOCK_MAJOR = 5;
// 적 공격 20회(약 32초) 안에 쓰러뜨리지 못하면 실패 — 방어만 높아 끝나지 않는 도전을 막는다.
export const TOWER_TURN_LIMIT = 20;
const FLOORS_PER_MAJOR = 5;

const towerMajor = (floor: number): number => 1 + (floor - 1) / FLOORS_PER_MAJOR;

// 각 층 적은 해당 스테이지 곡선의 정예(소9) 능력치.
export const towerEnemy = (floor: number): UnitStats => ({
  ...monsterStats({ major: towerMajor(floor), sub: 9 }),
  name: `수련탑 ${floor}층 수문장`,
});

// 전투 배경·적 그림을 고를 때 쓰는 스테이지.
export const towerDisplayStage = (floor: number): StageId => ({
  major: Math.floor(towerMajor(floor)),
  sub: 9,
});

export const towerFloorReward = (floor: number): GoalReward =>
  floor % 10 === 0 ? { elixir: 5, stones: 5 } : { stones: 2 };
