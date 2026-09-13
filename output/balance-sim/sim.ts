// 진행 시뮬레이션 — 실제 게임 공식(src/game/*.ts)을 그대로 불러 자동전투 진행 시간을 추정한다.
// 스테이지-레벨링-기획서 2.3절 "챕터3 확장 결정"의 곡선 검증(대15·대20 도달 시간) 용도.
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

// --- 기획안 비교용 가상 조건(기본값은 현재 코드 그대로) ---
const env = (k: string, d: number) => Number(process.env[k] ?? d);
// MON_FROM 대스테이지 이후 몬스터 성장률(대스테이지당). 기본 1.8/1.6/1.5 = 현재 공식.
const MON_HP = env('MON_HP', 1.8);
const MON_ATK = env('MON_ATK', 1.6);
const MON_DEF = env('MON_DEF', 1.5);
const MON_FROM = env('MON_FROM', 10);
// 몬스터 기초치(1-1 앵커) 배수와 장비 고정 스탯(ATK/DEF/HP) 배수.
const MON_BASE = env('MON_BASE', 1);
const GEAR_SCALE = env('GEAR_SCALE', 1);
// 장비 고정 스탯 곡선: linear = 현재(아이템 레벨 × 20), exp = 캐릭터와 같은 1.052^(아이템 레벨-1) × GEAR_K.
const GEAR_CURVE = process.env.GEAR_CURVE ?? 'linear';
const GEAR_K = env('GEAR_K', 20);
// 장비 퍼센트 스탯: linear = 현재(아이템 레벨 × 20 × 비중 × 등급), fixed = 레벨 무관 비중 × 등급 × GEAR_PCT_K(%).
const GEAR_PCT = process.env.GEAR_PCT ?? 'linear';
const GEAR_PCT_K = env('GEAR_PCT_K', 5);
// 챕터1 보드 비용 스케일: 해금 순서 k(0~4)마다 비용 × CH1_SCALE^k (무공 문서 "3.8배" 표 반영 여부).
const CH1_SCALE = env('CH1_SCALE', 1);
// 신규 보드(챕터2·3): NEW_BOARDS=0이면 없음. 해금 대스테이지·효과 방식·효과 배수·비용 배수.
const NEW_BOARDS = env('NEW_BOARDS', 0);
const NEW_MODE = process.env.NEW_MODE ?? 'add'; // add: 공통 가산 버킷, mult: 보드별 곱연산
const NEW_EFFECT = env('NEW_EFFECT', 1); // 챕터1 노드 효과표(0.06/0.12/0.4%) 대비 배수
const NEW_COST_DIV = env('NEW_COST_DIV', 1); // 비용 = 챕터1 비용 × 1.8^(해금대-1) ÷ 이 값
// 대11부터 2대스테이지마다 1개(챕터당 5개). 챕터 추가 검증용으로 대49까지 같은 규칙.
const NEW_UNLOCKS = Array.from({ length: 20 }, (_, i) => 11 + i * 2);

const FINAL_MAJOR = Number(process.env.FINAL_MAJOR ?? 30);
const HOUR_CAP = Number(process.env.HOUR_CAP ?? 3000);
const WALL_HOURS = Number(process.env.WALL_HOURS ?? 150); // 이 시간 동안 최전선이 안 움직이면 벽으로 판정
const REBIRTH_STUCK_HOURS = 1;
const ENHANCE_LIMIT = 10; // 하락 위험 구간(+11~) 전까지만 자동 강화
const ATTACK_INTERVAL_MS = 1300;
const MIN_ATTACK_INTERVAL_MS = 300;
const ENEMY_ATTACK_INTERVAL_MS = 1600;
const DEFEAT_PAUSE_MS = 900;
const DEFEAT_CONSOLATION_RATIO = 0.2;

// 스토리보드 챕터3 기획의 환골탈태 게이트(6회차 대25, 7회차 이후 대30). 5회차까지는 코드와 같다.
const gateMajor = (count: number): number => {
  if (count <= 4) return rebirthGateMajor(count);
  return count === 5 ? 25 : 30;
};

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

// 신규 보드 모델: 챕터1 보드와 같은 트리(1차 3·2차 2·오의 1)와 비용·효과 곡선.
const TIERS = [
  { count: 3, base: 30, growth: 1.12, eff: 0.06, max: 50, req: 0 },
  { count: 2, base: 200, growth: 1.15, eff: 0.12, max: 50, req: 10 },
  { count: 1, base: 2000, growth: 1.25, eff: 0.4, max: 20, req: 30 },
];
const newBoards = NEW_UNLOCKS.slice(0, NEW_BOARDS).map((unlock) => ({
  unlock,
  levels: TIERS.map((t) => Array<number>(t.count).fill(0)),
}));
const newBoardPercent = (b: (typeof newBoards)[number]) =>
  TIERS.reduce(
    (sum, t, i) => sum + b.levels[i].reduce((s, lv) => s + lv * t.eff * NEW_EFFECT, 0),
    0,
  );

// store.ts computePlayerStats와 같은 합산(문파 특전은 기부를 넣지 않아 0).
const player = (): PlayerStats => {
  const agg = aggregateGearStats(st.equipped);
  const sec = totalGongSecondaryStats(st.gong);
  let buff =
    totalGongBuffPercent(st.gong) + agg.enhanceBuffPercent + rebirthBuffPercent(st.rebirth);
  let mult = 1;
  for (const b of newBoards) {
    if (NEW_MODE === 'mult') mult *= 1 + newBoardPercent(b) / 100;
    else buff += newBoardPercent(b);
  }
  // exp 곡선이면 장비 고정 스탯의 "아이템 레벨 × 20" 부분을 지수 곡선으로 바꿔 다시 합산한다.
  let flat = { atk: agg.atk, def: agg.def, hp: agg.hp };
  if (GEAR_CURVE === 'exp') {
    flat = { atk: 0, def: 0, hp: 0 };
    for (const it of Object.values(st.equipped)) {
      if (!it) continue;
      const one = aggregateGearStats({ [it.slot]: it });
      const k = (GEAR_K * 1.052 ** (it.itemLevel - 1)) / (it.itemLevel * 20);
      flat.atk += one.atk * k;
      flat.def += one.def * k;
      flat.hp += one.hp * k;
    }
  }
  let pct = {
    cc: agg.critChancePercent,
    cd: agg.critDamagePercent,
    as: agg.attackSpeedPercent,
    ev: agg.evasionPercent,
    cg: agg.chiGainPercent,
  };
  if (GEAR_PCT === 'fixed') {
    pct = { cc: 0, cd: 0, as: 0, ev: 0, cg: 0 };
    for (const it of Object.values(st.equipped)) {
      if (!it) continue;
      const one = aggregateGearStats({ [it.slot]: it });
      const k = GEAR_PCT_K / (it.itemLevel * 20); // 비중×등급만 남기고 레벨·계수 20을 걷어낸다
      pct.cc += one.critChancePercent * k;
      pct.cd += one.critDamagePercent * k;
      pct.as += one.attackSpeedPercent * k;
      pct.ev += one.evasionPercent * k;
      pct.cg += one.chiGainPercent * k;
    }
  }
  const p = playerStats(st.level, buff, {
    atk: flat.atk * GEAR_SCALE,
    def: flat.def * GEAR_SCALE,
    hp: flat.hp * GEAR_SCALE,
    critChancePercent: pct.cc + sec.critChancePercent,
    critDamagePercent: pct.cd + sec.critDamagePercent,
    attackSpeedPercent: pct.as + sec.attackSpeedPercent,
    evasionPercent: pct.ev + sec.evasionPercent,
    chiGainPercent: pct.cg + sec.chiGainPercent,
  });
  return { ...p, hp: p.hp * mult, atk: p.atk * mult, def: p.def * mult };
};

// 대11 이후 몬스터 성장률 가상 조건 — 현재 공식 값에 (새 성장률/기존 성장률)^(N-10)을 곱한다.
const monster = (stage: StageId) => {
  const e = monsterStats(stage);
  // MON_FROM=0이면 대1부터, 아니면 그 대스테이지 다음부터 성장률을 바꾼다.
  const k = MON_FROM === 0 ? stage.major - 1 : Math.max(0, stage.major - MON_FROM);
  return {
    hp: e.hp * MON_BASE * (MON_HP / 1.8) ** k,
    atk: e.atk * MON_BASE * (MON_ATK / 1.6) ** k,
    def: e.def * MON_BASE * (MON_DEF / 1.5) ** k,
  };
};

// 보상도 몬스터와 같은 비율로 조정 — 경험치·내공은 체력 성장률, 전은 공격 성장률을 따른다.
const REWARD_TIE = env('REWARD_TIE', 1); // 1: 보상도 몬스터 성장률을 따름, 0: 현재 보상 곡선(1.8/1.6) 유지
const EXP_SCALE = env('EXP_SCALE', 1); // 경험치 보상 배수 — 진행 속도 조절 레버
const rewardOf = (stage: StageId) => {
  const r = stageReward(stage);
  const k = MON_FROM === 0 ? stage.major - 1 : Math.max(0, stage.major - MON_FROM);
  const hpK = REWARD_TIE ? MON_BASE * (MON_HP / 1.8) ** k : 1;
  const goldK = REWARD_TIE ? MON_BASE * (MON_ATK / 1.6) ** k : 1;
  return { exp: r.exp * hpK * EXP_SCALE, chi: r.chi * hpK, gold: r.gold * goldK };
};

// 한 번의 조우 결과(기대값): 이기면 처치 시간, 지면 쓰러질 때까지 시간.
const fight = (p: PlayerStats, stage: StageId) => {
  const e = monster(stage);
  const hit = Math.max(1, p.atk - e.def) * (1 + p.critChance * (p.critMultiplier - 1));
  const interval = Math.max(
    MIN_ATTACK_INTERVAL_MS,
    ATTACK_INTERVAL_MS / (1 + p.attackSpeedPercent / 100),
  );
  const killMs = Math.ceil(e.hp / hit) * interval;
  const taken = Math.max(1, e.atk - p.def) * (1 - p.evasion);
  const hitsToDie = Math.ceil(p.hp / taken);
  const dieMs = hitsToDie * ENEMY_ATTACK_INTERVAL_MS;
  return { win: killMs < dieMs, killMs, dieMs };
};

// 내공으로 가장 싼 연마부터 계속 구매(길게 누르기 연속 연마를 쓰는 플레이어 가정).
const buyGong = () => {
  const ctx = { highestMajorCleared: st.highest, gongLevels: st.gong };
  const ch1Index = new Map(
    ['samjae1', 'hoeseon', 'yuun', 'taeeul', 'poklloe'].map((id, i) => [id, i]),
  );
  for (;;) {
    let best: { apply: () => void; cost: number } | null = null;
    for (const board of GONG_BOARDS) {
      if (board.currency !== 'chi' || !isBoardUnlocked(board, ctx)) continue;
      const scale = CH1_SCALE ** (ch1Index.get(board.id) ?? 4);
      for (const node of board.nodes) {
        const lv = nodeLevel(node, st.gong);
        if (lv >= node.maxLevel || !isNodeUnlocked(node, st.gong)) continue;
        const cost = nodeUpgradeCost(node, lv) * scale;
        if (!best || cost < best.cost)
          best = {
            cost,
            apply: () => {
              st.gong[node.id] = lv + 1;
            },
          };
      }
    }
    for (const b of newBoards) {
      if (st.highest < b.unlock) continue;
      const costScale = 1.8 ** (b.unlock - 1) / NEW_COST_DIV;
      TIERS.forEach((t, ti) => {
        const prevTierMin = ti === 0 ? Infinity : Math.min(...b.levels[ti - 1]);
        if (ti > 0 && prevTierMin < t.req) return;
        b.levels[ti].forEach((lv, ni) => {
          if (lv >= t.max) return;
          const cost = t.base * t.growth ** lv * costScale;
          if (!best || cost < best.cost)
            best = {
              cost,
              apply: () => {
                b.levels[ti][ni] = lv + 1;
              },
            };
        });
      });
    }
    if (!best || st.chi < best.cost) return;
    st.chi -= best.cost;
    best.apply();
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
const hours = () => st.ms / 3_600_000;
const note = (label: string) => {
  const p = player();
  milestones.push(
    [
      label,
      `${hours().toFixed(1)}h`,
      `Lv${st.level}`,
      `환골${st.rebirth}`,
      `전투력 ${combatPower(p).toLocaleString('en-US')}`,
      `무공 +${totalGongBuffPercent(st.gong).toFixed(0)}%`,
      `ATK ${p.atk.toLocaleString('en-US')}`,
      `HP ${p.hp.toLocaleString('en-US')}`,
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
    for (const b of newBoards) b.levels = TIERS.map((t) => Array<number>(t.count).fill(0));
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
  // 대스테이지별 최초 클리어 시각(시간) — search.cjs 평가용.
  const times: Record<number, number> = {};
  for (const l of milestones) {
    const m = l.match(/^대(\d+) 최초 클리어 \| ([\d.]+)h/);
    if (m) times[Number(m[1])] = Number(m[2]);
  }
  console.log(JSON.stringify({ times, rebirth: st.rebirth, wall }));
} else if (process.env.SUMMARY) {
  // 대10·15·20·25·30 최초 클리어 시각과 벽 위치 한 줄 요약(run.sh용).
  const at = (m: number) =>
    milestones.find((l) => l.startsWith(`대${m} 최초`))?.split(' | ')[1] ?? '-';
  console.log(
    `대10 ${at(10)} · 대15 ${at(15)} · 대20 ${at(20)} · 대25 ${at(25)} · 대30 ${at(30)} · 환골 ${st.rebirth}회${wall ? ` · ${wall}` : ''}`,
  );
} else {
  console.log(milestones.join('\n'));
  if (wall) console.log(wall);
}
