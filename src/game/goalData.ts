// wiki/concepts/장기-플레이-시스템.md 2절 "수련 목표" — 서버 없이 기기 날짜로 초기화하는 일일 목표와
// 1회만 받는 누적 목표. 보상은 레벨과 무관한 고정 재화(영약·강화석·보호부적)만 준다.

export type DailyCounterKey = 'kills' | 'gong' | 'enhance';
export type DailyCounts = Record<DailyCounterKey, number>;

export const EMPTY_DAILY_COUNTS: DailyCounts = { kills: 0, gong: 0, enhance: 0 };

// YYYY-MM-DD — 기존 접속 보너스와 같은 날짜 기준을 쓴다.
export const todayString = (): string => new Date().toISOString().slice(0, 10);

export interface GoalReward {
  elixir?: number;
  stones?: number;
  charms?: number;
}

export const rewardText = (reward: GoalReward): string =>
  [
    reward.elixir ? `영약 +${reward.elixir}` : '',
    reward.stones ? `강화석 +${reward.stones}` : '',
    reward.charms ? `보호부적 +${reward.charms}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

export interface DailyGoal {
  id: string;
  label: string;
  counter: DailyCounterKey;
  target: number;
  reward: GoalReward;
}

export const DAILY_GOALS: DailyGoal[] = [
  {
    id: 'daily-kills',
    label: '적 200명 처치',
    counter: 'kills',
    target: 200,
    reward: { elixir: 3 },
  },
  { id: 'daily-gong', label: '무공 10회 연마', counter: 'gong', target: 10, reward: { stones: 5 } },
  {
    id: 'daily-enhance',
    label: '장비 강화 3회 시도',
    counter: 'enhance',
    target: 3,
    reward: { charms: 1 },
  },
];

export type MilestoneMetric = 'highestMajorCleared' | 'rebirthCount' | 'totalKills' | 'towerBest';

export interface Milestone {
  id: string;
  label: string;
  metric: MilestoneMetric;
  target: number;
  reward: GoalReward;
}

const milestones = (
  metric: MilestoneMetric,
  label: (n: number) => string,
  steps: [number, GoalReward][],
): Milestone[] =>
  steps.map(([target, reward]) => ({
    id: `${metric}-${target}`,
    label: label(target),
    metric,
    target,
    reward,
  }));

export const MILESTONES: Milestone[] = [
  ...milestones(
    'highestMajorCleared',
    (n) => `대${n} 보스 첫 격파`,
    [5, 10, 15, 20, 25, 30].map((n): [number, GoalReward] => [n, { elixir: 10 }]),
  ),
  ...milestones(
    'rebirthCount',
    (n) => `환골탈태 ${n}회`,
    [1, 3, 5, 7].map((n): [number, GoalReward] => [n, { elixir: 20 }]),
  ),
  ...milestones('totalKills', (n) => `누적 처치 ${n.toLocaleString()}명`, [
    [1000, { stones: 20 }],
    [10000, { stones: 50 }],
    [100000, { stones: 100 }],
  ]),
  ...milestones('towerBest', (n) => `수련탑 ${n}층 돌파`, [
    [10, { elixir: 10 }],
    [30, { elixir: 20 }],
    [50, { elixir: 30 }],
    [100, { elixir: 50 }],
  ]),
];
