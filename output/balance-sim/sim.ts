// 진행 시뮬레이션 — 실제 게임 공식(src/game/*.ts)을 그대로 불러 자동전투 진행 시간을 추정한다.
// 결과·해석: wiki/synthesis/진행-곡선-검증-시뮬레이션-2026-09-13.md
// ponytail: 기대값 전투(치명타는 평균 피해로 환산)·이상적 플레이어(막히면 바로 앞 스테이지 사냥,
// 이길 수 있게 되면 즉시 복귀) 가정. 문파 기부·기연 뽑기·오프라인 시간은 넣지 않았다.
// 실행: npx esbuild output/balance-sim/sim.ts --bundle --platform=node --outfile=output/balance-sim/sim.cjs && node output/balance-sim/sim.cjs
import {
  monsterStats,
  stageReward,
  previousStage,
  isBossStage,
  playerStats,
  combatPower,
  baseDamage,
  expToNextLevel,
  type StageId,
  type PlayerStats,
} from '../../src/game/combat';
import {
  GONG_BOARDS,
  nodeLevel,
  nodeUpgradeCost,
  isNodeUnlocked,
  isBoardUnlocked,
  totalGongBuffPercent,
  totalGongSecondaryStats,
  boardPowerPercent,
  type GongLevels,
} from '../../src/game/gongData';
import {
  ALL_SLOTS,
  aggregateGearStats,
  enhanceCost,
  enhanceStoneCost,
  rollEnhance,
  type GearItem,
  type SlotId,
} from '../../src/game/gearData';
import { rollStageDrops } from '../../src/game/dropData';
import { rebirthGateMajor, rebirthBuffPercent } from '../../src/game/rebirthData';
import { gradeTier } from '../../src/game/gradeData';

// --- 재현 가능한 난수 ---
let seed = Number(process.env.SEED ?? 7);
Math.random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// --- 새 챕터 검토용 가상 조건(기본값은 현재 코드 그대로) ---
const env = (k: string, d: number) => Number(process.env[k] ?? d);
// MON_FROM 대스테이지 이후 몬스터 성장률(대스테이지당). 기본값 = combat.ts의 1.5 / 4/3 / 1.25.
const CODE_HP_GROWTH = 1.5;
const CODE_ATK_GROWTH = 1.37;
const CODE_DEF_GROWTH = 1.25;
const MON_HP = env('MON_HP', CODE_HP_GROWTH);
const MON_ATK = env('MON_ATK', CODE_ATK_GROWTH);
const MON_DEF = env('MON_DEF', CODE_DEF_GROWTH);
const MON_FROM = env('MON_FROM', 30);
const MON_BASE = env('MON_BASE', 1); // 몬스터 기초치 배수
const EXP_SCALE = env('EXP_SCALE', 1); // 경험치 보상 배수

const FINAL_MAJOR = env('FINAL_MAJOR', 30);
// 새 챕터 무공 보드 가정: 코드의 마지막 챕터 보드를 대(마지막+2)부터 두 대스테이지마다 복제하고,
// 비용은 해금 구간 수입에 맞춰 ×1.8^(해금 대스테이지 차이).
const EXTRA_BOARDS = env('EXTRA_BOARDS', 0);
const EXTRA_COST = env('EXTRA_COST', 1); // 가상 보드 비용 추가 배수
// 새 챕터 환골탈태 게이트: "35,40" = 코드 마지막 게이트 다음 회차부터 35, 그다음 회차 이후 40.
const EXTRA_GATES = (process.env.EXTRA_GATES ?? '').split(',').filter(Boolean).map(Number);
const HOUR_CAP = env('HOUR_CAP', 3000);
const WALL_HOURS = env('WALL_HOURS', 150); // 이 시간 동안 최전선이 안 움직이면 벽으로 판정
const REBIRTH_STUCK_HOURS = 1;
const ENHANCE_LIMIT = 10; // 하락 위험 구간(+11~) 전까지만 자동 강화
const ATTACK_INTERVAL_MS = 1300;
const MIN_ATTACK_INTERVAL_MS = 300;
const ENEMY_ATTACK_INTERVAL_MS = 1600;
const DEFEAT_PAUSE_MS = 900;
const DEFEAT_CONSOLATION_RATIO = 0.2;

const lastChapterBoard = GONG_BOARDS.filter((b) => b.multiplicative).at(-1)!;
const lastUnlock = lastChapterBoard.unlock.type === 'stage' ? lastChapterBoard.unlock.major : 0;
const BOARDS = [
  ...GONG_BOARDS,
  ...Array.from({ length: EXTRA_BOARDS }, (_, i) => {
    const unlockMajor = lastUnlock + 2 * (i + 1);
    const scale = 1.8 ** (unlockMajor - lastUnlock) * EXTRA_COST;
    const rename = (id: string) => `x${i}_${id}`;
    return {
      ...lastChapterBoard,
      id: rename(lastChapterBoard.id),
      unlock: { type: 'stage' as const, major: unlockMajor },
      nodes: lastChapterBoard.nodes.map((n) => ({
        ...n,
        id: rename(n.id),
        baseCost: Math.round(n.baseCost * scale),
        requires: n.requires?.map((r) => ({ ...r, nodeId: rename(r.nodeId) })),
      })),
    };
  }),
];
// gongData.gongMultiplier와 같은 곱 — 가상 보드까지 포함.
const multiplier = (levels: GongLevels) =>
  BOARDS.reduce((m, b) => (b.multiplicative ? m * (1 + boardPowerPercent(b, levels) / 100) : m), 1);
// 코드 게이트는 7회차(count 6) 이후 대30 고정 — EXTRA_GATES는 8회차(count 7)부터 덮어쓴다.
const gateMajor = (count: number) =>
  count >= 7 && EXTRA_GATES.length > 0
    ? EXTRA_GATES[Math.min(count - 7, EXTRA_GATES.length - 1)]
    : rebirthGateMajor(count);

const nextStage = (s: StageId): StageId => {
  if (s.major === FINAL_MAJOR && s.sub === 10) return s;
  return s.sub < 10 ? { major: s.major, sub: s.sub + 1 } : { major: s.major + 1, sub: 1 };
};
const same = (a: StageId, b: StageId) => a.major === b.major && a.sub === b.sub;

interface Sim {
  ms: number;
  level: number;
  exp: number;
  chi: number;
  gold: number;
  stones: number;
  gong: GongLevels;
  equipped: Partial<Record<SlotId, GearItem>>;
  rebirth: number;
  highest: number;
  frontier: StageId;
  farm: StageId | null;
  lastAdvanceMs: number;
}

const st: Sim = {
  ms: 0,
  level: 1,
  exp: 0,
  chi: 0,
  gold: 0,
  stones: 0,
  gong: {},
  equipped: {},
  rebirth: 0,
  highest: 0,
  frontier: { major: 1, sub: 1 },
  farm: null,
  lastAdvanceMs: 0,
};

// store.ts computePlayerStats와 같은 합산(문파 특전은 기부를 넣지 않아 0).
const player = (): PlayerStats => {
  const agg = aggregateGearStats(st.equipped);
  const sec = totalGongSecondaryStats(st.gong);
  const buff =
    totalGongBuffPercent(st.gong) + agg.enhanceBuffPercent + rebirthBuffPercent(st.rebirth);
  const p = playerStats(st.level, buff, {
    atk: agg.atk,
    def: agg.def,
    hp: agg.hp,
    critChancePercent: agg.critChancePercent + sec.critChancePercent,
    critDamagePercent: agg.critDamagePercent + sec.critDamagePercent,
    attackSpeedPercent: agg.attackSpeedPercent + sec.attackSpeedPercent,
    evasionPercent: agg.evasionPercent + sec.evasionPercent,
    chiGainPercent: agg.chiGainPercent + sec.chiGainPercent,
  });
  const mult = multiplier(st.gong);
  return { ...p, hp: p.hp * mult, atk: p.atk * mult, def: p.def * mult };
};

// 가상 성장률 — 현재 공식 값에 (새 성장률/코드 성장률)^(N-MON_FROM)을 곱한다.
const growthK = (stage: StageId) => Math.max(0, stage.major - MON_FROM);
const monster = (stage: StageId) => {
  const e = monsterStats(stage);
  const k = growthK(stage);
  return {
    hp: e.hp * MON_BASE * (MON_HP / CODE_HP_GROWTH) ** k,
    atk: e.atk * MON_BASE * (MON_ATK / CODE_ATK_GROWTH) ** k,
    def: e.def * MON_BASE * (MON_DEF / CODE_DEF_GROWTH) ** k,
  };
};
const rewardOf = (stage: StageId) => {
  const r = stageReward(stage);
  return { exp: r.exp * EXP_SCALE, chi: r.chi, gold: r.gold };
};

// 한 번의 조우 결과(기대값): 이기면 처치 시간, 지면 쓰러질 때까지 시간.
const fight = (p: PlayerStats, stage: StageId) => {
  const e = monster(stage);
  const hit = baseDamage(p.atk, e.def) * (1 + p.critChance * (p.critMultiplier - 1));
  const interval = Math.max(
    MIN_ATTACK_INTERVAL_MS,
    ATTACK_INTERVAL_MS / (1 + p.attackSpeedPercent / 100),
  );
  const killMs = Math.ceil(e.hp / hit) * interval;
  const taken = baseDamage(e.atk, p.def) * (1 - p.evasion);
  const dieMs = Math.ceil(p.hp / taken) * ENEMY_ATTACK_INTERVAL_MS;
  return { win: killMs < dieMs, killMs, dieMs };
};

// 내공으로 가장 싼 연마부터 계속 구매(길게 누르기 연속 연마를 쓰는 플레이어 가정).
const buyGong = () => {
  const ctx = { highestMajorCleared: st.highest, gongLevels: st.gong, sectFavor: {} };
  for (;;) {
    let best: { id: string; cost: number; lv: number } | null = null;
    for (const board of BOARDS) {
      if (board.currency !== 'chi' || !isBoardUnlocked(board, ctx)) continue;
      for (const node of board.nodes) {
        const lv = nodeLevel(node, st.gong);
        if (lv >= node.maxLevel || !isNodeUnlocked(node, st.gong)) continue;
        const cost = nodeUpgradeCost(node, lv);
        if (!best || cost < best.cost) best = { id: node.id, cost, lv };
      }
    }
    if (!best || st.chi < best.cost) return;
    st.chi -= best.cost;
    st.gong[best.id] = best.lv + 1;
  }
};

// 게임의 "최적 장착"(등급→강화 단계)보다 아이템 레벨까지 보는 이상적 선택.
const better = (a: GearItem, b: GearItem | undefined) =>
  !b ||
  (gradeTier(a.grade) !== gradeTier(b.grade)
    ? gradeTier(a.grade) > gradeTier(b.grade)
    : a.itemLevel > b.itemLevel || a.enhanceLevel > b.enhanceLevel);

const equipDrops = (items: GearItem[]) => {
  for (const it of items) if (better(it, st.equipped[it.slot])) st.equipped[it.slot] = it;
};

const enhance = () => {
  for (;;) {
    const target = ALL_SLOTS.map((s) => st.equipped[s])
      .filter((it): it is GearItem => !!it && it.enhanceLevel < ENHANCE_LIMIT)
      .sort((a, b) => a.enhanceLevel - b.enhanceLevel)[0];
    if (!target) return;
    const cost = enhanceCost(target.enhanceLevel);
    const stones = enhanceStoneCost(target.enhanceLevel + 1);
    if (st.gold < cost || st.stones < stones) return;
    st.gold -= cost;
    st.stones -= stones;
    target.enhanceLevel = rollEnhance(target.enhanceLevel, false).newLevel;
  }
};

const levelUp = () => {
  while (st.exp >= expToNextLevel(st.level)) {
    st.exp -= expToNextLevel(st.level);
    st.level += 1;
  }
};

const milestones: string[] = [];
const times: Record<number, number> = {};
const hours = () => st.ms / 3_600_000;
// 대스테이지 전투 체감 — 처치 타수와 적 한 대 피해(내 최대 체력 대비 %). 졸개 1·정예 9·보스 10.
const tempo = (p: PlayerStats, major: number) =>
  ([1, 9, 10] as const)
    .map((sub) => {
      const e = monster({ major, sub });
      const hit = baseDamage(p.atk, e.def) * (1 + p.critChance * (p.critMultiplier - 1));
      const pct = (baseDamage(e.atk, p.def) / p.hp) * 100;
      return `${sub}:${Math.ceil(e.hp / hit)}타·${pct.toFixed(1)}%`;
    })
    .join(' ');

const note = (label: string) => {
  const p = player();
  milestones.push(
    [
      label,
      `${hours().toFixed(1)}h`,
      `Lv${st.level}`,
      `환골${st.rebirth}`,
      `전투력 ${combatPower(p).toLocaleString('en-US')}`,
      `무공 +${totalGongBuffPercent(st.gong).toFixed(0)}% ×${multiplier(st.gong).toFixed(2)}`,
      tempo(p, Math.max(1, st.highest)),
    ].join(' | '),
  );
};

let wall = '';
while (hours() < HOUR_CAP) {
  const p = player();
  const stage = st.farm ?? st.frontier;
  const r = fight(p, stage);

  if (r.win) {
    st.ms += r.killMs + DEFEAT_PAUSE_MS;
    const reward = rewardOf(stage);
    st.exp += reward.exp;
    st.gold += reward.gold;
    st.chi += Math.round(reward.chi * p.chiGainMultiplier);
    const firstMajor = !st.farm && isBossStage(stage) && stage.major > st.highest;
    const drop = rollStageDrops(stage, st.level, firstMajor);
    st.stones += drop.stones;
    equipDrops(drop.items);
    levelUp();
    buyGong();
    enhance();

    if (!st.farm) {
      if (isBossStage(stage) && stage.major > st.highest) {
        st.highest = stage.major;
        times[stage.major] = Number(hours().toFixed(1));
        note(`대${stage.major} 최초 클리어`);
      }
      if (same(stage, { major: FINAL_MAJOR, sub: 10 })) break;
      st.frontier = nextStage(stage);
      st.lastAdvanceMs = st.ms;
    } else if (fight(player(), st.frontier).win) {
      st.farm = null;
    }
  } else {
    st.ms += r.dieMs + DEFEAT_PAUSE_MS;
    const reward = rewardOf(stage);
    st.exp += Math.round(reward.exp * DEFEAT_CONSOLATION_RATIO);
    st.gold += Math.round(reward.gold * DEFEAT_CONSOLATION_RATIO);
    levelUp();
    st.farm = previousStage(stage);
  }

  const stuckMs = st.ms - st.lastAdvanceMs;
  if (st.farm && st.highest >= gateMajor(st.rebirth) && stuckMs > REBIRTH_STUCK_HOURS * 3_600_000) {
    st.rebirth += 1;
    note(`환골탈태 ${st.rebirth}회 (막힌 곳 ${st.frontier.major}-${st.frontier.sub})`);
    st.level = 1;
    st.exp = 0;
    st.chi = 0;
    st.gong = {};
    st.frontier = { major: 1, sub: 1 };
    st.farm = null;
    st.lastAdvanceMs = st.ms;
  } else if (stuckMs > WALL_HOURS * 3_600_000) {
    wall = `벽: ${st.frontier.major}-${st.frontier.sub}에서 ${WALL_HOURS}시간 동안 진행 없음`;
    note(wall);
    break;
  }
}

if (!wall && hours() >= HOUR_CAP)
  wall = `시간 상한 ${HOUR_CAP}h, 최전선 ${st.frontier.major}-${st.frontier.sub}`;
if (process.env.JSON) {
  console.log(JSON.stringify({ times, rebirth: st.rebirth, wall }));
} else if (process.env.SUMMARY) {
  // 대10·15·20·25·30 최초 클리어 시각과 벽 위치 한 줄 요약(run.sh용).
  const at = (m: number) => (times[m] === undefined ? '-' : `${times[m]}h`);
  console.log(
    `대10 ${at(10)} · 대15 ${at(15)} · 대20 ${at(20)} · 대25 ${at(25)} · 대30 ${at(30)}${FINAL_MAJOR >= 40 ? ` · 대35 ${at(35)} · 대40 ${at(40)}` : ''} · 환골 ${st.rebirth}회${wall ? ` · ${wall}` : ''}`,
  );
} else {
  console.log(milestones.join('\n'));
  if (wall) console.log(wall);
}
