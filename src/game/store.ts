import { create } from 'zustand';
import {
  monsterStats,
  playerStats,
  stageReward,
  nextStage,
  isFinalStage,
  previousStage,
  expToNextLevel,
  isBossStage,
  enemyKind,
  damage,
  rollPlayerDamage,
  rollEvaded,
  type StageId,
  type UnitStats,
  type PlayerStats,
  type EnemyKind,
} from './combat';
import { loadState, saveState, type GameState } from './state';
import {
  GONG_BOARDS,
  nodeLevel,
  nodeUpgradeCost,
  nodeBulkUpgrade,
  isNodeUnlocked,
  isBoardUnlocked,
  findBoardByNodeId,
  boardCompletionPercent,
  boardUnlockLabel,
  totalGongBuffPercent,
  gongMultiplier,
  boardPowerPercent,
  totalGongSecondaryStats,
  type GongLevels,
  type GongBoard,
  type GongCurrency,
} from './gongData';
import {
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  createGearItem,
  aggregateGearStats,
  enhanceCost,
  enhanceStoneCost,
  needsProtectionEligible,
  rollEnhance,
  type SlotId,
  type GearItem,
} from './gearData';
import { rollStageDrops } from './dropData';
import { realmName, rebirthGateMajor, rebirthBuffPercent } from './rebirthData';
import {
  SECT_NAME,
  SECT_MAX_LEVEL,
  CHI_PER_CONTRIBUTION,
  ELIXIR_CONTRIBUTION_RATE,
  sectExpToNextLevel,
  sectBuffPercent,
  GRANDMASTER_TITLE,
  OTHER_SECTS,
  GRANDMASTER_SEAL_SLOT,
  OTHER_SECT_MAX_FAVOR,
  otherSectLevel,
  otherSectPerkPercent,
  otherSectSecondaryStats,
  isSectTransmitted,
  allSectsTransmitted,
} from './sectData';
import {
  PULL_COST,
  PULL_10_COST,
  HARD_PITY,
  pullSingle,
  pullTen,
  GRADE_COLOR,
  gradeTier,
  type PullResult,
} from './gachaData';
import { elixirExchangeCost } from './shopData';
import { MAJOR_STORIES, BOSS_CUTSCENES, ARRIVAL_CUTSCENES, storyStageIndex } from './storyData';
import {
  DAILY_GOALS,
  EMPTY_DAILY_COUNTS,
  MILESTONES,
  rewardText,
  todayString,
  type DailyCounterKey,
  type GoalReward,
} from './goalData';
import {
  TOWER_TURN_LIMIT,
  TOWER_UNLOCK_MAJOR,
  towerDisplayStage,
  towerEnemy,
  towerFloorReward,
} from './towerData';

// 1일 1회 정액 재접속 보너스.
const DAILY_BONUS_GOLD = 50;
const DAILY_BONUS_CHI = 30;
const DAILY_BONUS_ELIXIR = 5;
// wiki/concepts/장기-플레이-시스템.md 4절: 자리를 비운 시간만큼 20초에 1마리씩 현재 사냥터를
// 처치한 것으로 보고 경험치·전·내공만 지급한다. 5분 미만은 무시, 최대 12시간.
const OFFLINE_MIN_MS = 5 * 60 * 1000;
const OFFLINE_MAX_MS = 12 * 60 * 60 * 1000;
const OFFLINE_KILL_INTERVAL_MS = 20 * 1000;
// wiki/concepts/상점-기연-시스템.md: 대보스(X-10) 최초 클리어 시 영약 3개 확정 지급.
const BOSS_FIRST_CLEAR_ELIXIR = 3;
const DEFEAT_CONSOLATION_RATIO = 0.2;

// 사냥터 모드는 이미 도달한(자동 등반이 지나온) 스테이지만 farming 대상으로 허용 — 현재 막힌
// 스테이지보다 앞선 곳을 미리 사냥하는 우회를 막는다.
// 아직 최초 클리어하지 않은 대스테이지의 보스만 도전 확인 팝업으로 멈춘다 — 이미 잡은 보스는 바로 싸운다.
const needsBossChallenge = (stage: StageId, highestMajorCleared: number): boolean =>
  isBossStage(stage) && stage.major > highestMajorCleared;

export const isStageAtOrBefore = (a: StageId, b: StageId): boolean =>
  a.major < b.major || (a.major === b.major && a.sub <= b.sub);

// wiki에 분해 환급량 수치가 없어 v1 근사치: 등급 1단계당 강화석 1개씩 증가(하품 1개~선품 6개).
// 실행 전 확인 화면과 실제 분해가 같은 값을 쓰도록 공유.
export const disassembleStoneYield = (items: GearItem[]): number =>
  items.reduce((sum, it) => sum + 1 + gradeTier(it.grade), 0);

// 강화 시도 이력(성공/실패 횟수, 실제 소모 골드)은 저장하지 않으므로, "전부 성공했다고 가정한
// 누적 강화 비용"의 50%를 근사 환급액으로 쓴다. enhanceCost(i)는 i단계→i+1단계 강화 1회 시도 비용.
const ENHANCE_REFUND_RATE = 0.5;
export const enhanceGoldRefund = (items: GearItem[]): number =>
  items.reduce((sum, it) => {
    let itemCost = 0;
    for (let lv = 0; lv < it.enhanceLevel; lv += 1) itemCost += enhanceCost(lv);
    return sum + Math.round(itemCost * ENHANCE_REFUND_RATE);
  }, 0);

export interface GachaOutcome {
  results: PullResult[];
}

export interface BossRewardOutcome {
  stage: StageId;
  bossName: string;
  reward: { exp: number; gold: number; chi: number };
  elixirGained: number;
  firstClear: boolean;
}

// 쓰러짐 연출이 끝난 뒤에 적용할 다음 전투 상태. 연출 중에는 쓰러진 쪽 HP를 0으로 남겨둬
// 화면(HP 바·스테이지 표시)과 쓰러짐 모션이 같은 시점에 바뀌도록 맞춘다.
export interface PendingEncounter {
  stage: StageId;
  enemy: UnitStats;
  enemyHp: number;
  playerHp: number;
  awaitingBossChallenge: boolean;
  farmReturnStage: StageId | null;
}

export interface OfflineReport {
  elapsedMs: number;
  kills: number;
  exp: number;
  gold: number;
  chi: number;
  levelsGained: number;
}

// lastActiveAt은 저장 파일에만 두고 화면 상태에는 올리지 않는다(아래 lastActiveAt 변수 참고).
interface GameStoreState extends Omit<GameState, 'lastActiveAt'> {
  player: PlayerStats;
  // 수련탑 도전 중인 층 — null이면 일반 전투. 새로고침하면 도전은 끝난다(저장 안 함).
  towerFloor: number | null;
  towerTurns: number; // 이번 층에서 적이 공격한 횟수(TOWER_TURN_LIMIT 도달 시 실패)
  offlineReport: OfflineReport | null;
  playerHp: number;
  enemy: UnitStats;
  enemyHp: number;
  toastMessage: string;
  lastGachaOutcome: GachaOutcome | null;
  paused: boolean;
  // UX 기획 3-3절: 보스 조우 직전 [도전] 확인, 보스 격파 후
  // [계속하기] 확인 — 둘 다 사용자 확인 전까지 자동전투를 멈춘다.
  awaitingBossChallenge: boolean;
  awaitingBossReward: BossRewardOutcome | null;
  // null이 아니면 쓰러짐 연출 대기 중 — BattleCanvas가 연출을 끝낼 때 startPendingEncounter()로 반영.
  pendingEncounter: PendingEncounter | null;
  // 스토리 연출(wiki 스테이지-적-구성-연출-기획서 4절) — 표시 중인 것만 담는 임시 상태.
  storyIntroMajor: number | null; // 대스테이지 진입 카드
  storySubtitle: { index: number; text: string } | null; // 소스테이지 자막
  storyCutscene: string[] | null; // 차단형 대사 카드 — 표시 중 자동전투 정지

  showToast: (msg: string) => void;
  dismissStoryIntro: () => void;
  closeStoryCutscene: () => void;
  togglePause: () => void;
  retrySave: () => void;
  claimDailyBonusIfNeeded: () => void;
  claimOfflineReward: () => void;
  closeOfflineReport: () => void;
  claimDailyGoal: (goalId: string) => void;
  claimMilestone: (milestoneId: string) => void;
  startTower: () => void;
  leaveTower: () => void;
  buyGongUpgrade: (nodeId: string) => void;
  buyGongUpgradeBulk10: (nodeId: string) => void;
  equipItem: (itemId: string) => void;
  equipBestAll: () => void;
  unequipItem: (slot: SlotId) => void;
  enhanceItem: (itemId: string, useProtection: boolean) => { success: boolean } | undefined;
  disassembleItems: (itemIds: string[]) => void;
  donateChiToSect: () => void;
  donateElixirToSect: () => void;
  investSectFavor: (sectId: string) => void;
  performRebirth: () => void;
  pullGachaSingle: () => void;
  pullGachaTen: () => void;
  resetGachaOutcome: () => void;
  exchangeGoldForElixir: () => void;
  confirmBossChallenge: () => void;
  declineBossChallenge: () => void;
  confirmBossReward: () => void;
  startFarming: (stage: StageId) => void;
  stopFarming: () => void;
  completeOnboarding: (nickname: string) => void;
  markTutorialGongDone: () => void;
  playerAttack: () => { dmg: number; isCrit: boolean; enemyDefeated: boolean };
  enemyAttack: () => { dmg: number; playerDefeated: boolean; evaded: boolean } | null;
  startPendingEncounter: () => void;
}

// wiki/concepts/스테이지-레벨링-기획서.md 7장 전투력 공식: 무공/문파특전/환골탈태 3항목을 하나의
// 가산버프 버킷에 합산 후 BaseStat_총합에 한 번만 곱한다. 장구 스탯(강화 배율 포함, ATK/DEF/HP/
// 치명타율 등)은 별도로 BaseStat_총합에 가산(computePlayerStats 참고).
const totalBuffPercent = (
  s: Pick<GameStoreState, 'gongLevels' | 'rebirthCount' | 'sectLevel'>,
): number =>
  totalGongBuffPercent(s.gongLevels) +
  rebirthBuffPercent(s.rebirthCount) +
  sectBuffPercent(s.sectLevel);

const computePlayerStats = (
  level: number,
  s: Pick<
    GameStoreState,
    'gongLevels' | 'rebirthCount' | 'sectLevel' | 'equippedGear' | 'nickname' | 'sectFavor'
  >,
): PlayerStats => {
  const agg = aggregateGearStats(s.equippedGear);
  // 무공 보조 스탯과 타 문파 레벨 특전은 같은 보조 스탯 축이라 합쳐서 더한다.
  const gong = totalGongSecondaryStats(s.gongLevels);
  const sect = otherSectSecondaryStats(s.sectFavor);
  const gongSecondary = {
    critChancePercent: gong.critChancePercent + sect.critChancePercent,
    critDamagePercent: gong.critDamagePercent + sect.critDamagePercent,
    attackSpeedPercent: gong.attackSpeedPercent + sect.attackSpeedPercent,
    evasionPercent: gong.evasionPercent + sect.evasionPercent,
    chiGainPercent: gong.chiGainPercent + sect.chiGainPercent,
  };
  const buffPercent = totalBuffPercent(s);
  const base = playerStats(
    level,
    buffPercent,
    {
      atk: agg.atk,
      def: agg.def,
      hp: agg.hp,
      critChancePercent: agg.critChancePercent + gongSecondary.critChancePercent,
      critDamagePercent: agg.critDamagePercent + gongSecondary.critDamagePercent,
      attackSpeedPercent: agg.attackSpeedPercent + gongSecondary.attackSpeedPercent,
      evasionPercent: agg.evasionPercent + gongSecondary.evasionPercent,
      chiGainPercent: agg.chiGainPercent + gongSecondary.chiGainPercent,
    },
    s.nickname || '목현',
  );
  // 챕터2 이후 무공 보드는 가산 버킷 밖에서 최종 HP·ATK·DEF에 따로 곱한다.
  const mult = gongMultiplier(s.gongLevels);
  return {
    ...base,
    hp: Math.round(base.hp * mult),
    atk: Math.round(base.atk * mult),
    def: Math.round(base.def * mult),
  };
};

// HP 최대치가 바뀔 때 이미 입은 피해량은 그대로 유지하고 최대치 증가분만 회복분으로 반영.
const carryOverHp = (prevMaxHp: number, prevHp: number, newMaxHp: number): number =>
  Math.min(newMaxHp, prevHp + Math.max(0, newMaxHp - prevMaxHp));

// 무공 보드는 내공(chi) 또는 문파무공은 기여도(sectContributionPoints) 두 재화 중 하나를 쓴다.
const gongCurrencyBalance = (
  board: GongBoard,
  s: Pick<GameStoreState, 'chi' | 'sectContributionPoints'>,
): number => (board.currency === 'contribution' ? s.sectContributionPoints : s.chi);

const gongCurrencyPatch = (board: GongBoard, newBalance: number): Partial<GameStoreState> =>
  board.currency === 'contribution' ? { sectContributionPoints: newBalance } : { chi: newBalance };

const applySectContribution = (
  sectLevel: number,
  sectExp: number,
  contribution: number,
): { sectLevel: number; sectExp: number } => {
  let level = sectLevel;
  let exp = sectExp + contribution;
  while (level < SECT_MAX_LEVEL && exp >= sectExpToNextLevel(level)) {
    exp -= sectExpToNextLevel(level);
    level += 1;
  }
  return { sectLevel: level, sectExp: exp };
};

// 일일 카운터 증가 패치 — 날짜가 바뀌었으면 진행·수령 기록을 비우고 새로 센다.
const dailyPatch = (
  s: Pick<GameStoreState, 'dailyDate' | 'dailyCounts' | 'dailyClaimed'>,
  key: DailyCounterKey,
  amount: number,
): Pick<GameStoreState, 'dailyDate' | 'dailyCounts' | 'dailyClaimed'> => {
  const today = todayString();
  const fresh = s.dailyDate === today;
  const counts = fresh ? s.dailyCounts : EMPTY_DAILY_COUNTS;
  return {
    dailyDate: today,
    dailyCounts: { ...counts, [key]: counts[key] + amount },
    dailyClaimed: fresh ? s.dailyClaimed : [],
  };
};

const rewardPatch = (
  s: Pick<GameStoreState, 'elixir' | 'enhanceStones' | 'protectionCharms'>,
  reward: GoalReward,
): Pick<GameStoreState, 'elixir' | 'enhanceStones' | 'protectionCharms'> => ({
  elixir: s.elixir + (reward.elixir ?? 0),
  enhanceStones: s.enhanceStones + (reward.stones ?? 0),
  protectionCharms: s.protectionCharms + (reward.charms ?? 0),
});

// 전투 화면(배경·적 그림)이 기준으로 삼는 스테이지 — 수련탑 중에는 층에 맞는 스테이지.
export const battleViewStage = (s: Pick<GameStoreState, 'stage' | 'towerFloor'>): StageId =>
  s.towerFloor !== null ? towerDisplayStage(s.towerFloor) : s.stage;

// 저장할 때마다 갱신하는 마지막 활동 시각. 화면 상태에 두면 매 처치마다 불필요한 갱신이 생겨 모듈 변수로 둔다.
let lastActiveAt = 0;

const persist = (s: GameStoreState) => {
  lastActiveAt = Date.now();
  const state: GameState = {
    level: s.level,
    exp: s.exp,
    gold: s.gold,
    chi: s.chi,
    stage: s.stage,
    gongLevels: s.gongLevels,
    equippedGear: s.equippedGear,
    inventory: s.inventory,
    enhanceStones: s.enhanceStones,
    protectionCharms: s.protectionCharms,
    rebirthCount: s.rebirthCount,
    highestMajorCleared: s.highestMajorCleared,
    sectLevel: s.sectLevel,
    sectExp: s.sectExp,
    sectTotalContribution: s.sectTotalContribution,
    sectContributionPoints: s.sectContributionPoints,
    sectFavor: s.sectFavor,
    elixir: s.elixir,
    elixirExchangeCount: s.elixirExchangeCount,
    gachaPity: s.gachaPity,
    lastLoginDate: s.lastLoginDate,
    nickname: s.nickname,
    onboardingDone: s.onboardingDone,
    tutorialGongDone: s.tutorialGongDone,
    farmReturnStage: s.farmReturnStage,
    storySeenMajor: s.storySeenMajor,
    storySeenStage: s.storySeenStage,
    lastActiveAt,
    dailyDate: s.dailyDate,
    dailyCounts: s.dailyCounts,
    dailyClaimed: s.dailyClaimed,
    milestonesClaimed: s.milestonesClaimed,
    totalKills: s.totalKills,
    towerBest: s.towerBest,
  };
  saveState(state);
};

const levelUp = (startLevel: number, startExp: number): { level: number; exp: number } => {
  let level = startLevel;
  let exp = startExp;
  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level += 1;
  }
  return { level, exp };
};

type ItemLocation =
  { item: GearItem; source: 'equipped' } | { item: GearItem; source: 'inventory' };

// 등급이 높을수록, 등급이 같으면 강화단계가 높을수록 "더 좋은" 장비로 취급(인벤토리 정렬 기준과 동일).
export const isBetterGear = (a: GearItem, b: GearItem): boolean =>
  gradeTier(a.grade) !== gradeTier(b.grade)
    ? gradeTier(a.grade) > gradeTier(b.grade)
    : a.enhanceLevel > b.enhanceLevel;

const findItemLocation = (s: GameStoreState, itemId: string): ItemLocation | null => {
  for (const slot of ALL_SLOTS) {
    const item = s.equippedGear[slot];
    if (item && item.id === itemId) return { item, source: 'equipped' };
  }
  const item = s.inventory.find((it) => it.id === itemId);
  return item ? { item, source: 'inventory' } : null;
};

const applyStageDrops = (
  s: Pick<GameStoreState, 'inventory' | 'enhanceStones' | 'protectionCharms'>,
  stage: StageId,
  playerLevel: number,
  isFirstMajorClear: boolean,
): {
  inventory: GearItem[];
  enhanceStones: number;
  protectionCharms: number;
  dropSummary: string;
} => {
  const drop = rollStageDrops(stage, playerLevel, isFirstMajorClear);
  const dropParts: string[] = [];
  if (drop.items.length > 0) dropParts.push(`장비 ${drop.items.length}개`);
  if (drop.stones > 0) dropParts.push(`강화석 +${drop.stones}`);
  if (drop.protectionCharms > 0) dropParts.push(`보호부적 +${drop.protectionCharms}`);
  return {
    inventory: drop.items.length > 0 ? [...s.inventory, ...drop.items] : s.inventory,
    enhanceStones: s.enhanceStones + drop.stones,
    protectionCharms: s.protectionCharms + drop.protectionCharms,
    dropSummary: dropParts.length > 0 ? ` (드랍: ${dropParts.join(', ')})` : '',
  };
};

const { lastActiveAt: savedLastActiveAt, ...saved } = loadState();
lastActiveAt = savedLastActiveAt;

export const useGameStore = create<GameStoreState>((set, get) => {
  const initialPlayer = computePlayerStats(saved.level, saved);
  const initialEnemy = monsterStats(saved.stage);

  return {
    ...saved,
    towerFloor: null,
    towerTurns: 0,
    offlineReport: null,
    player: initialPlayer,
    playerHp: initialPlayer.hp,
    enemy: initialEnemy,
    enemyHp: initialEnemy.hp,
    toastMessage: '',
    lastGachaOutcome: null,
    paused: false,
    awaitingBossChallenge: needsBossChallenge(saved.stage, saved.highestMajorCleared),
    awaitingBossReward: null,
    pendingEncounter: null,
    storyIntroMajor: null,
    storySubtitle: null,
    storyCutscene: null,

    showToast: (msg) => set({ toastMessage: msg }),
    dismissStoryIntro: () => set({ storyIntroMajor: null }),
    closeStoryCutscene: () => set({ storyCutscene: null }),
    togglePause: () => set((s) => ({ paused: !s.paused })),
    retrySave: () => persist(get()),

    claimDailyBonusIfNeeded: () => {
      const today = todayString();
      const s = get();
      if (s.lastLoginDate === today) return;
      set({
        lastLoginDate: today,
        gold: s.gold + DAILY_BONUS_GOLD,
        chi: s.chi + DAILY_BONUS_CHI,
        elixir: s.elixir + DAILY_BONUS_ELIXIR,
        toastMessage: `오늘의 접속 보너스 자동 지급: +전 ${DAILY_BONUS_GOLD} +내공 ${DAILY_BONUS_CHI} +영약 ${DAILY_BONUS_ELIXIR}`,
      });
      persist(get());
    },

    // 앱을 열 때와 백그라운드에서 돌아올 때 호출 — 마지막 저장 이후 비운 시간만큼 보상한다.
    claimOfflineReward: () => {
      const s = get();
      const elapsedMs = Math.min(Date.now() - lastActiveAt, OFFLINE_MAX_MS);
      if (!s.onboardingDone || lastActiveAt === 0 || elapsedMs < OFFLINE_MIN_MS) return;

      const kills = Math.floor(elapsedMs / OFFLINE_KILL_INTERVAL_MS);
      // 보스 도전 대기 중이면 보스 보상 대신 직전 정예 기준.
      const rewardStage = isBossStage(s.stage) ? { major: s.stage.major, sub: 9 } : s.stage;
      const reward = stageReward(rewardStage);
      const exp = reward.exp * kills;
      const gold = reward.gold * kills;
      const chi = Math.round(reward.chi * kills * s.player.chiGainMultiplier);
      const leveled = levelUp(s.level, s.exp + exp);
      const newPlayer = computePlayerStats(leveled.level, s);
      set({
        level: leveled.level,
        exp: leveled.exp,
        gold: s.gold + gold,
        chi: s.chi + chi,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        offlineReport: {
          elapsedMs,
          kills,
          exp,
          gold,
          chi,
          levelsGained: leveled.level - s.level,
        },
      });
      persist(get());
    },

    closeOfflineReport: () => set({ offlineReport: null }),

    claimDailyGoal: (goalId) => {
      const s = get();
      const goal = DAILY_GOALS.find((g) => g.id === goalId);
      if (!goal || s.dailyDate !== todayString()) return;
      if (s.dailyClaimed.includes(goalId) || s.dailyCounts[goal.counter] < goal.target) return;
      set({
        ...rewardPatch(s, goal.reward),
        dailyClaimed: [...s.dailyClaimed, goalId],
        toastMessage: `수련 목표 달성: ${rewardText(goal.reward)}`,
      });
      persist(get());
    },

    claimMilestone: (milestoneId) => {
      const s = get();
      const milestone = MILESTONES.find((m) => m.id === milestoneId);
      if (!milestone || s.milestonesClaimed.includes(milestoneId)) return;
      if (s[milestone.metric] < milestone.target) return;
      set({
        ...rewardPatch(s, milestone.reward),
        milestonesClaimed: [...s.milestonesClaimed, milestoneId],
        toastMessage: `${milestone.label}: ${rewardText(milestone.reward)}`,
      });
      persist(get());
    },

    // 최고 기록 다음 층부터 도전한다. 자동 등반·사냥 위치는 그대로 두고 전투 상대만 바꾼다.
    startTower: () => {
      const s = get();
      if (
        s.towerFloor !== null ||
        s.awaitingBossChallenge ||
        s.awaitingBossReward ||
        s.highestMajorCleared < TOWER_UNLOCK_MAJOR
      )
        return;
      const floor = s.towerBest + 1;
      const enemy = towerEnemy(floor);
      set({
        towerFloor: floor,
        towerTurns: 0,
        enemy,
        enemyHp: enemy.hp,
        playerHp: s.player.hp,
        // 쓰러짐 연출 대기 중이었다면 그 예약은 버린다 — 사용자가 직접 고른 전투가 우선.
        pendingEncounter: null,
        toastMessage: `수련탑 ${floor}층 도전`,
      });
    },

    leaveTower: () => {
      const s = get();
      if (s.towerFloor === null) return;
      const enemy = monsterStats(s.stage);
      set({
        towerFloor: null,
        towerTurns: 0,
        enemy,
        enemyHp: enemy.hp,
        playerHp: s.player.hp,
        awaitingBossChallenge: needsBossChallenge(s.stage, s.highestMajorCleared),
        pendingEncounter: null,
        toastMessage: `수련탑에서 나왔습니다 — 최고 기록 ${s.towerBest}층`,
      });
    },

    buyGongUpgrade: (nodeId) => {
      const board = findBoardByNodeId(nodeId);
      const node = board?.nodes.find((n) => n.id === nodeId);
      if (!board || !node) return;
      const s = get();
      const curLevel = nodeLevel(node, s.gongLevels);
      const curCost = nodeUpgradeCost(node, curLevel);
      const balance = gongCurrencyBalance(board, s);
      if (
        balance < curCost ||
        curLevel >= node.maxLevel ||
        !isBoardUnlocked(board, s) ||
        !isNodeUnlocked(node, s.gongLevels)
      )
        return;

      const gongLevels = { ...s.gongLevels, [nodeId]: curLevel + 1 };
      const newPlayer = computePlayerStats(s.level, { ...s, gongLevels });
      set({
        ...gongCurrencyPatch(board, balance - curCost),
        ...dailyPatch(s, 'gong', 1),
        gongLevels,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    buyGongUpgradeBulk10: (nodeId) => {
      const board = findBoardByNodeId(nodeId);
      const node = board?.nodes.find((n) => n.id === nodeId);
      if (!board || !node) return;
      const s = get();
      const curLevel = nodeLevel(node, s.gongLevels);
      const { levelsGained, cost } = nodeBulkUpgrade(node, curLevel);
      const balance = gongCurrencyBalance(board, s);
      if (
        levelsGained <= 0 ||
        balance < cost ||
        !isBoardUnlocked(board, s) ||
        !isNodeUnlocked(node, s.gongLevels)
      )
        return;

      const gongLevels = { ...s.gongLevels, [nodeId]: curLevel + levelsGained };
      const newPlayer = computePlayerStats(s.level, { ...s, gongLevels });
      set({
        ...gongCurrencyPatch(board, balance - cost),
        ...dailyPatch(s, 'gong', levelsGained),
        gongLevels,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    equipItem: (itemId) => {
      const s = get();
      const idx = s.inventory.findIndex((it) => it.id === itemId);
      if (idx < 0) return;
      const item = s.inventory[idx];
      const prevEquipped = s.equippedGear[item.slot];
      const inventory = s.inventory.filter((it) => it.id !== itemId);
      if (prevEquipped) inventory.push(prevEquipped);
      const equippedGear = { ...s.equippedGear, [item.slot]: item };

      const newPlayer = computePlayerStats(s.level, { ...s, equippedGear });
      set({
        equippedGear,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        toastMessage: `${SLOT_INFO[item.slot].name} 장착: ${item.grade} +${item.enhanceLevel}`,
      });
      persist(get());
    },

    // 슬롯별로 인벤토리 후보와 현재 착용 장비를 비교해 더 좋은 쪽을 일괄 장착.
    equipBestAll: () => {
      const s = get();
      let inventory = [...s.inventory];
      const equippedGear = { ...s.equippedGear };
      let changed = 0;

      for (const slot of ALL_SLOTS) {
        const current = equippedGear[slot];
        const best = inventory
          .filter((it) => it.slot === slot)
          .reduce<GearItem | undefined>(
            (acc, candidate) => (!acc || isBetterGear(candidate, acc) ? candidate : acc),
            current,
          );
        if (best && best.id !== current?.id) {
          inventory = inventory.filter((it) => it.id !== best.id);
          if (current) inventory.push(current);
          equippedGear[slot] = best;
          changed += 1;
        }
      }

      if (changed === 0) {
        set({ toastMessage: '이미 보유 중인 장비 중 가장 좋은 상태입니다.' });
        return;
      }

      const newPlayer = computePlayerStats(s.level, { ...s, equippedGear });
      set({
        equippedGear,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        toastMessage: `일괄 장착: ${changed}개 슬롯 교체`,
      });
      persist(get());
    },

    unequipItem: (slot) => {
      const s = get();
      const item = s.equippedGear[slot];
      if (!item) return;
      const equippedGear = { ...s.equippedGear };
      delete equippedGear[slot];
      const inventory = [...s.inventory, item];

      const newPlayer = computePlayerStats(s.level, { ...s, equippedGear });
      set({
        equippedGear,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    enhanceItem: (itemId, useProtection) => {
      const s = get();
      const location = findItemLocation(s, itemId);
      if (!location) return undefined;
      const { item } = location;
      if (item.enhanceLevel >= ENHANCE_MAX_LEVEL) return undefined;

      const targetLevel = item.enhanceLevel + 1;
      const cost = enhanceCost(item.enhanceLevel);
      const stoneCost = enhanceStoneCost(targetLevel);
      const wantsProtection = useProtection && needsProtectionEligible(targetLevel);
      if (
        s.gold < cost ||
        s.enhanceStones < stoneCost ||
        (wantsProtection && s.protectionCharms < 1)
      ) {
        return undefined;
      }

      const result = rollEnhance(item.enhanceLevel, wantsProtection);
      const updatedItem: GearItem = { ...item, enhanceLevel: result.newLevel };

      const equippedGear =
        location.source === 'equipped'
          ? { ...s.equippedGear, [item.slot]: updatedItem }
          : s.equippedGear;
      const inventory =
        location.source === 'inventory'
          ? s.inventory.map((it) => (it.id === itemId ? updatedItem : it))
          : s.inventory;

      const newPlayer = computePlayerStats(s.level, { ...s, equippedGear });
      let message: string;
      if (result.success) {
        message = `강화 성공! ${SLOT_INFO[item.slot].name} +${result.newLevel}`;
      } else if (result.downgraded) {
        message = `강화 실패... 단계 하락 (현재 +${result.newLevel})`;
      } else {
        message = `강화 실패 (현재 +${result.newLevel} 유지)`;
      }
      set({
        ...dailyPatch(s, 'enhance', 1),
        gold: s.gold - cost,
        enhanceStones: s.enhanceStones - stoneCost,
        protectionCharms: wantsProtection ? s.protectionCharms - 1 : s.protectionCharms,
        equippedGear,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        toastMessage: message,
      });
      persist(get());
      return { success: result.success };
    },

    disassembleItems: (itemIds) => {
      const s = get();
      const idSet = new Set(itemIds);
      const toDisassemble = s.inventory.filter((it) => idSet.has(it.id));
      if (toDisassemble.length === 0) return;
      const inventory = s.inventory.filter((it) => !idSet.has(it.id));
      const stonesGained = disassembleStoneYield(toDisassemble);
      const goldGained = enhanceGoldRefund(toDisassemble);
      const goldSuffix = goldGained > 0 ? ` · 전 +${goldGained.toLocaleString()}` : '';
      set({
        inventory,
        enhanceStones: s.enhanceStones + stonesGained,
        gold: s.gold + goldGained,
        toastMessage: `일괄 분해: ${toDisassemble.length}개 → 강화석 +${stonesGained}${goldSuffix}`,
      });
      persist(get());
    },

    donateChiToSect: () => {
      const s = get();
      const donatable = Math.floor(s.chi / CHI_PER_CONTRIBUTION);
      if (donatable <= 0) return;

      const { sectLevel, sectExp } = applySectContribution(s.sectLevel, s.sectExp, donatable);
      const newPlayer = computePlayerStats(s.level, { ...s, sectLevel });
      set({
        chi: s.chi - donatable * CHI_PER_CONTRIBUTION,
        sectTotalContribution: s.sectTotalContribution + donatable,
        sectContributionPoints: s.sectContributionPoints + donatable,
        sectExp,
        sectLevel,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    // wiki/concepts/문파-시스템.md "기여도 획득" 표: 영약 1개 = 10 기여도.
    donateElixirToSect: () => {
      const s = get();
      if (s.elixir <= 0) return;
      const contribution = s.elixir * ELIXIR_CONTRIBUTION_RATE;

      const { sectLevel, sectExp } = applySectContribution(s.sectLevel, s.sectExp, contribution);
      const newPlayer = computePlayerStats(s.level, { ...s, sectLevel });
      set({
        elixir: 0,
        sectTotalContribution: s.sectTotalContribution + contribution,
        sectContributionPoints: s.sectContributionPoints + contribution,
        sectExp,
        sectLevel,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    // 일대종사(청운문 최대 레벨)만 가능. 사용 가능 기여도를 그 문파 최대 레벨까지 필요한 만큼 바쳐
    // 문파 레벨을 올린다. 처음 바칠 때 1회 문파 상징 슬롯 신품을 주고, 5개 문파를 모두 최대 레벨
    // (무공 전수)로 올린 순간 일대종사 신표(선품)를 1회 준다 — 장구-시스템.md "신품·선품 획득 경로" 2절.
    investSectFavor: (sectId) => {
      const s = get();
      const sect = OTHER_SECTS.find((o) => o.id === sectId);
      if (s.sectLevel < SECT_MAX_LEVEL || !sect) return;
      const current = s.sectFavor[sectId] ?? 0;
      const amount = Math.min(s.sectContributionPoints, OTHER_SECT_MAX_FAVOR - current);
      if (amount <= 0) return;
      const sectFavor = { ...s.sectFavor, [sectId]: current + amount };
      const items: GearItem[] = [];
      const firstGift = current === 0;
      if (firstGift) items.push(createGearItem(sect.giftSlot, '신품', s.level));
      const sealEarned = !allSectsTransmitted(s.sectFavor) && allSectsTransmitted(sectFavor);
      if (sealEarned) items.push(createGearItem(GRANDMASTER_SEAL_SLOT, '선품', s.level));
      const before = otherSectLevel(current).level;
      const after = otherSectLevel(current + amount).level;
      const messages = [
        `${sect.name} Lv.${before} → Lv.${after}`,
        firstGift && `첫 기여 보상: 신품 ${SLOT_INFO[sect.giftSlot].name}`,
        isSectTransmitted(current + amount) && !isSectTransmitted(current) && `무공 전수`,
        sealEarned && `일대종사 신표: 선품 ${SLOT_INFO[GRANDMASTER_SEAL_SLOT].name}`,
      ].filter(Boolean);
      const newPlayer = computePlayerStats(s.level, { ...s, sectFavor });
      set({
        sectContributionPoints: s.sectContributionPoints - amount,
        sectFavor,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        ...(items.length > 0 && { inventory: [...s.inventory, ...items] }),
        toastMessage: messages.join(' · '),
      });
      persist(get());
    },

    performRebirth: () => {
      const s = get();
      const gateMajor = rebirthGateMajor(s.rebirthCount);
      if (s.highestMajorCleared < gateMajor) return;

      const rebirthCount = s.rebirthCount + 1;
      const level = 1;
      const gongLevels: GongLevels = {};
      const stage: StageId = { major: 1, sub: 1 };
      const newPlayer = computePlayerStats(level, { ...s, rebirthCount, gongLevels });
      const newEnemy = monsterStats(stage);
      set({
        rebirthCount,
        level,
        exp: 0,
        chi: 0,
        stage,
        gongLevels,
        player: newPlayer,
        playerHp: newPlayer.hp,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        awaitingBossChallenge: false,
        awaitingBossReward: null,
        farmReturnStage: null,
        towerFloor: null,
        towerTurns: 0,
        // 쓰러짐 연출 대기 중이었다면 그 예약은 버린다 — 사용자가 직접 고른 전투가 우선.
        pendingEncounter: null,
        toastMessage: `환골탈태! ${realmName(rebirthCount)} 경지에 올랐다 (+전체 스탯 15%)`,
      });
      persist(get());
    },

    pullGachaSingle: () => {
      const s = get();
      if (s.elixir < PULL_COST) return;
      const { result, nextPity } = pullSingle(s.gachaPity);
      const item = createGearItem(result.slot, result.grade, s.level);
      set({
        elixir: s.elixir - PULL_COST,
        gachaPity: nextPity,
        inventory: [...s.inventory, item],
        lastGachaOutcome: { results: [result] },
      });
      persist(get());
    },

    pullGachaTen: () => {
      const s = get();
      if (s.elixir < PULL_10_COST) return;
      const { results, nextPity } = pullTen(s.gachaPity);
      const items = results.map((r) => createGearItem(r.slot, r.grade, s.level));
      set({
        elixir: s.elixir - PULL_10_COST,
        gachaPity: nextPity,
        inventory: [...s.inventory, ...items],
        lastGachaOutcome: { results },
      });
      persist(get());
    },

    resetGachaOutcome: () => set({ lastGachaOutcome: null }),

    exchangeGoldForElixir: () => {
      const s = get();
      const cost = elixirExchangeCost(s.elixirExchangeCount);
      if (s.gold < cost) return;
      set({
        gold: s.gold - cost,
        elixir: s.elixir + 1,
        elixirExchangeCount: s.elixirExchangeCount + 1,
        toastMessage: `일반상점: 전 ${cost.toLocaleString()} → 영약 1개 교환`,
      });
      persist(get());
    },

    playerAttack: () => {
      const s = get();
      const { amount: dmg, isCrit } = rollPlayerDamage(
        s.player.atk,
        s.enemy.def,
        s.player.critChance,
        s.player.critMultiplier,
      );
      const enemyHp = s.enemyHp - dmg;
      const enemyDefeated = enemyHp <= 0;

      if (enemyDefeated && s.towerFloor !== null) {
        // 수련탑은 최고 기록 다음 층부터 시작하므로 돌파한 층은 언제나 신기록 — 층마다 보상.
        const cleared = s.towerFloor;
        const reward = towerFloorReward(cleared);
        const newEnemy = towerEnemy(cleared + 1);
        set({
          ...rewardPatch(s, reward),
          towerBest: cleared,
          towerFloor: cleared + 1,
          towerTurns: 0,
          enemyHp: 0,
          pendingEncounter: {
            stage: s.stage,
            enemy: newEnemy,
            enemyHp: newEnemy.hp,
            playerHp: s.player.hp,
            awaitingBossChallenge: false,
            farmReturnStage: s.farmReturnStage,
          },
          toastMessage: `수련탑 ${cleared}층 돌파! ${rewardText(reward)}`,
        });
        persist(get());
      } else if (enemyDefeated && s.farmReturnStage) {
        // 사냥터 모드: 스테이지를 넘기지 않고 같은 스테이지에서 계속 사냥 — 보스 조우 연출 없이
        // 처치할 때마다 파밍용 보상만 지급(최초 클리어 확정 보상·highestMajorCleared 갱신 없음).
        const reward = stageReward(s.stage);
        const { level, exp } = levelUp(s.level, s.exp + reward.exp);
        const gold = s.gold + reward.gold;
        const chi = s.chi + Math.round(reward.chi * s.player.chiGainMultiplier);
        const drop = applyStageDrops(s, s.stage, s.level, false);
        const newPlayer = computePlayerStats(level, s);
        const newEnemy = monsterStats(s.stage);
        set({
          level,
          exp,
          gold,
          chi,
          inventory: drop.inventory,
          enhanceStones: drop.enhanceStones,
          protectionCharms: drop.protectionCharms,
          player: newPlayer,
          enemyHp: 0,
          pendingEncounter: {
            stage: s.stage,
            enemy: newEnemy,
            enemyHp: newEnemy.hp,
            playerHp: newPlayer.hp,
            awaitingBossChallenge: false,
            farmReturnStage: s.farmReturnStage,
          },
          toastMessage: `사냥: ${s.stage.major}-${s.stage.sub} 처치! +EXP ${reward.exp} +전 ${reward.gold}${drop.dropSummary}`,
        });
        persist(get());
      } else if (enemyDefeated && isFinalStage(s.stage) && s.highestMajorCleared >= s.stage.major) {
        // 최종 스테이지(30-10)는 다음 스토리가 없어 nextStage()가 같은 자리를 반환한다 —
        // 최초 클리어 이후에도 기존 보스 보상 팝업 분기를 그대로 타면 처치할 때마다 팝업이
        // 무한 재발생한다. 최초 클리어(highestMajorCleared 갱신) 이후로는 사냥터 모드와
        // 동일하게 팝업 없이 즉시 보상만 반복 지급.
        const reward = stageReward(s.stage);
        const { level, exp } = levelUp(s.level, s.exp + reward.exp);
        const gold = s.gold + reward.gold;
        const chi = s.chi + Math.round(reward.chi * s.player.chiGainMultiplier);
        const drop = applyStageDrops(s, s.stage, s.level, false);
        const newPlayer = computePlayerStats(level, s);
        const newEnemy = monsterStats(s.stage);
        set({
          level,
          exp,
          gold,
          chi,
          inventory: drop.inventory,
          enhanceStones: drop.enhanceStones,
          protectionCharms: drop.protectionCharms,
          player: newPlayer,
          enemyHp: 0,
          pendingEncounter: {
            stage: s.stage,
            enemy: newEnemy,
            enemyHp: newEnemy.hp,
            playerHp: newPlayer.hp,
            awaitingBossChallenge: false,
            farmReturnStage: s.farmReturnStage,
          },
          toastMessage: `${s.stage.major}-${s.stage.sub} 반복 처치! +EXP ${reward.exp} +전 ${reward.gold}${drop.dropSummary} (다음 이야기는 준비 중입니다)`,
        });
        persist(get());
      } else if (enemyDefeated && isBossStage(s.stage)) {
        // 보스 격파 직후에는 즉시 다음 스테이지로 넘기지 않고, 사용자가 [계속하기]를
        // 확인할 때까지 보류(confirmBossReward에서 실제 적용) — 드랍도 그때 함께 지급.
        const reward = stageReward(s.stage);
        const firstClear = s.stage.major > s.highestMajorCleared;
        const elixirGained = firstClear ? BOSS_FIRST_CLEAR_ELIXIR : 0;
        set({
          enemyHp: 0,
          awaitingBossReward: {
            stage: s.stage,
            bossName: s.enemy.name,
            reward,
            elixirGained,
            firstClear,
          },
        });
      } else if (enemyDefeated) {
        const reward = stageReward(s.stage);
        const { level, exp } = levelUp(s.level, s.exp + reward.exp);
        const gold = s.gold + reward.gold;
        const chi = s.chi + Math.round(reward.chi * s.player.chiGainMultiplier);
        const stage = nextStage(s.stage);
        const drop = applyStageDrops(s, s.stage, s.level, false);
        const newPlayer = computePlayerStats(level, s);
        const newEnemy = monsterStats(stage);
        // 자동 등반 중 처음 클리어한 소스테이지만 자막을 띄우고, 다음 소스테이지에 컷이 있으면 연다.
        const clearedIndex = storyStageIndex(s.stage);
        const subtitleText = MAJOR_STORIES[s.stage.major]?.subBeats[s.stage.sub - 1];
        const story: Partial<GameStoreState> =
          clearedIndex > s.storySeenStage
            ? {
                storySeenStage: clearedIndex,
                storySubtitle: subtitleText ? { index: clearedIndex, text: subtitleText } : null,
                storyCutscene: ARRIVAL_CUTSCENES[`${stage.major}-${stage.sub}`] ?? s.storyCutscene,
              }
            : {};
        set({
          ...story,
          level,
          exp,
          gold,
          chi,
          inventory: drop.inventory,
          enhanceStones: drop.enhanceStones,
          protectionCharms: drop.protectionCharms,
          player: newPlayer,
          enemyHp: 0,
          // 스테이지 이동·HP 회복은 쓰러짐 연출이 끝날 때 한꺼번에 반영한다.
          pendingEncounter: {
            stage,
            enemy: newEnemy,
            enemyHp: newEnemy.hp,
            playerHp: newPlayer.hp,
            awaitingBossChallenge: needsBossChallenge(stage, s.highestMajorCleared),
            farmReturnStage: s.farmReturnStage,
          },
          toastMessage: `${s.stage.major}-${s.stage.sub} 클리어! +EXP ${reward.exp} +전 ${reward.gold}${drop.dropSummary}`,
        });
        persist(get());
      } else {
        set({ enemyHp });
      }

      // 처치 수는 각 분기의 다음 저장 때 함께 저장된다.
      if (enemyDefeated) {
        set((cur) => ({ totalKills: cur.totalKills + 1, ...dailyPatch(cur, 'kills', 1) }));
      }

      return { dmg, isCrit, enemyDefeated };
    },

    confirmBossChallenge: () => set({ awaitingBossChallenge: false }),

    // 보스 도전 팝업을 닫으면 직전 스테이지에서 반복 사냥하며 수련한다 — 보스 스테이지를 복귀 지점으로
    // 잡아 두어 전투 화면의 [등반] 버튼으로 다시 도전 팝업을 연다.
    declineBossChallenge: () => {
      const s = get();
      if (!s.awaitingBossChallenge) return;
      const stage = previousStage(s.stage);
      const newEnemy = monsterStats(stage);
      set({
        stage,
        farmReturnStage: s.farmReturnStage ?? s.stage,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        awaitingBossChallenge: false,
        pendingEncounter: null,
        toastMessage: `${stage.major}-${stage.sub}에서 수련 — [등반]으로 보스에 다시 도전`,
      });
      persist(get());
    },

    confirmBossReward: () => {
      const s = get();
      const pending = s.awaitingBossReward;
      if (!pending) return;
      const { stage, reward, elixirGained } = pending;
      const isFirstMajorClear = stage.major > s.highestMajorCleared;
      const { level, exp } = levelUp(s.level, s.exp + reward.exp);
      const gold = s.gold + reward.gold;
      const chi = s.chi + Math.round(reward.chi * s.player.chiGainMultiplier);
      const highestMajorCleared = Math.max(s.highestMajorCleared, stage.major);
      const elixir = s.elixir + elixirGained;
      const nextStg = nextStage(stage);
      const drop = applyStageDrops(s, stage, s.level, isFirstMajorClear);
      const newPlayer = computePlayerStats(level, s);
      const newEnemy = monsterStats(nextStg);
      // 최초 격파면 챕터·특수 컷, 새 대스테이지에 처음 들어서면 진입 카드(컷이 닫힌 뒤 표시).
      const showIntro = nextStg.major > s.storySeenMajor && !!MAJOR_STORIES[nextStg.major];
      set({
        storyCutscene: (isFirstMajorClear && BOSS_CUTSCENES[stage.major]) || s.storyCutscene,
        storySeenMajor: showIntro ? nextStg.major : s.storySeenMajor,
        storyIntroMajor: showIntro ? nextStg.major : s.storyIntroMajor,
        level,
        exp,
        gold,
        chi,
        highestMajorCleared,
        elixir,
        stage: nextStg,
        inventory: drop.inventory,
        enhanceStones: drop.enhanceStones,
        protectionCharms: drop.protectionCharms,
        player: newPlayer,
        playerHp: newPlayer.hp,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        awaitingBossReward: null,
        toastMessage: `${stage.major}-${stage.sub} 클리어! +EXP ${reward.exp} +전 ${reward.gold}${drop.dropSummary}`,
      });
      persist(get());
    },

    // 보스(혹은 잡몹)에게 막혀 강해질 필요가 있을 때, 이미 지나온 스테이지를 골라 반복 사냥하기
    // 위한 진입점 — 자동 등반 스테이지는 그대로 두고 전투만 선택한 스테이지로 옮긴다.
    startFarming: (stage) => {
      const s = get();
      if (s.awaitingBossChallenge || s.awaitingBossReward || s.towerFloor !== null) return;
      const frontier = s.farmReturnStage ?? s.stage;
      if (!isStageAtOrBefore(stage, frontier)) return;

      // 자동 등반이 멈춰 있는 프론티어 스테이지 자체를 고르면 사냥터 모드가 아니라 자동 등반
      // 모드가 되어야 한다 — 이미 사냥 중이었다면 복귀 처리, 아니라면 그대로 둔다.
      if (stage.major === frontier.major && stage.sub === frontier.sub) {
        if (s.farmReturnStage) get().stopFarming();
        return;
      }

      const farmReturnStage = s.farmReturnStage ?? s.stage;
      const newEnemy = monsterStats(stage);
      set({
        stage,
        farmReturnStage,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        // 사용자가 직접 옮긴 전투는 체력을 가득 채워 시작한다.
        playerHp: s.player.hp,
        awaitingBossChallenge: false,
        // 쓰러짐 연출 대기 중이었다면 그 예약은 버린다 — 사용자가 직접 고른 전투가 우선.
        pendingEncounter: null,
        toastMessage: `사냥터 이동: ${stage.major}-${stage.sub}`,
      });
      persist(get());
    },

    // 사냥터 모드 종료 — 자동 등반이 멈춰 있던 스테이지로 복귀해 등반을 재개한다.
    stopFarming: () => {
      const s = get();
      const returnStage = s.farmReturnStage;
      if (!returnStage || s.towerFloor !== null) return;
      const newEnemy = monsterStats(returnStage);
      set({
        stage: returnStage,
        farmReturnStage: null,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        playerHp: s.player.hp,
        awaitingBossChallenge: needsBossChallenge(returnStage, s.highestMajorCleared),
        // 쓰러짐 연출 대기 중이었다면 그 예약은 버린다 — 사용자가 직접 고른 전투가 우선.
        pendingEncounter: null,
        toastMessage: `자동 등반 복귀: ${returnStage.major}-${returnStage.sub}`,
      });
      persist(get());
    },

    // UX 기획 4장 2절: 도호(별명) 입력, 미입력/스킵 시 기본값.
    completeOnboarding: (nickname) => {
      const s = get();
      const finalName = nickname.trim() || '목현';
      const newPlayer = computePlayerStats(s.level, { ...s, nickname: finalName });
      const showIntro = s.storySeenMajor < s.stage.major && s.stage.sub === 1;
      set({
        nickname: finalName,
        onboardingDone: true,
        player: newPlayer,
        storySeenMajor: showIntro ? s.stage.major : s.storySeenMajor,
        storyIntroMajor: showIntro ? s.stage.major : null,
      });
      persist(get());
    },

    // UX 기획 4장 5절: 첫 성장보드 강제 개방 튜토리얼 완료 처리.
    markTutorialGongDone: () => {
      set({ tutorialGongDone: true });
      persist(get());
    },

    enemyAttack: () => {
      const s = get();
      if (s.enemyHp <= 0) return null;

      if (s.towerFloor !== null) {
        // 수련탑: 적 공격 횟수 제한에 닿거나 쓰러지면 도전 종료 — 일반 전투로 돌아가고 최고 기록은 유지.
        const towerTurns = s.towerTurns + 1;
        const timedOut = towerTurns >= TOWER_TURN_LIMIT;
        if (!timedOut && rollEvaded(s.player.evasion)) {
          set({ towerTurns });
          return { dmg: 0, playerDefeated: false, evaded: true };
        }
        const towerDmg = damage(s.enemy.atk, s.player.def);
        const towerPlayerHp = s.playerHp - towerDmg;
        if (!timedOut && towerPlayerHp > 0) {
          set({ towerTurns, playerHp: towerPlayerHp });
          return { dmg: towerDmg, playerDefeated: false, evaded: false };
        }
        const newEnemy = monsterStats(s.stage);
        set({
          playerHp: 0,
          towerFloor: null,
          towerTurns: 0,
          pendingEncounter: {
            stage: s.stage,
            enemy: newEnemy,
            enemyHp: newEnemy.hp,
            playerHp: s.player.hp,
            awaitingBossChallenge: needsBossChallenge(s.stage, s.highestMajorCleared),
            farmReturnStage: s.farmReturnStage,
          },
          toastMessage: `수련탑 ${s.towerFloor}층 ${timedOut ? '시간 초과' : '패배'} — 최고 기록 ${s.towerBest}층`,
        });
        return { dmg: towerDmg, playerDefeated: true, evaded: false };
      }

      if (rollEvaded(s.player.evasion)) return { dmg: 0, playerDefeated: false, evaded: true };

      const dmg = damage(s.enemy.atk, s.player.def);
      const playerHp = s.playerHp - dmg;
      const playerDefeated = playerHp <= 0;

      if (playerDefeated) {
        const reward = stageReward(s.stage);
        const consolationExp = Math.round(reward.exp * DEFEAT_CONSOLATION_RATIO);
        const consolationGold = Math.round(reward.gold * DEFEAT_CONSOLATION_RATIO);
        const { level, exp } = levelUp(s.level, s.exp + consolationExp);
        const gold = s.gold + consolationGold;
        const newPlayer = computePlayerStats(level, s);
        // 사냥터 모드는 사용자가 직접 고른 스테이지라 그대로 재도전, 자동 등반 중 패배했을
        // 때만 직전에 클리어했던 스테이지로 후퇴시켜 막힌 곳에 계속 갇히지 않게 한다.
        const retreatStage = s.farmReturnStage ? s.stage : previousStage(s.stage);
        const retreated =
          !s.farmReturnStage &&
          (retreatStage.major !== s.stage.major || retreatStage.sub !== s.stage.sub);
        const newEnemy = monsterStats(retreatStage);
        set({
          playerHp: 0,
          level,
          exp,
          gold,
          player: newPlayer,
          // 후퇴·HP 회복은 쓰러짐 연출이 끝날 때 반영한다. 후퇴하면 자동 등반을 멈추고 막혔던
          // 스테이지를 복귀 지점으로 잡아 사냥터 모드로 전환 — 그대로 두면 후퇴한 스테이지를
          // 깨자마자 다시 막힌 곳으로 올라가 패배만 반복한다.
          pendingEncounter: {
            stage: retreatStage,
            enemy: newEnemy,
            enemyHp: newEnemy.hp,
            playerHp: newPlayer.hp,
            awaitingBossChallenge: retreated ? false : s.awaitingBossChallenge,
            farmReturnStage: retreated ? s.stage : s.farmReturnStage,
          },
          toastMessage: retreated
            ? `패배... ${retreatStage.major}-${retreatStage.sub}(으)로 후퇴, 자동 등반 중단 (+EXP ${consolationExp})`
            : `패배... 수련 후 재도전 (+EXP ${consolationExp})`,
        });
        persist(get());
      } else {
        set({ playerHp });
      }

      return { dmg, playerDefeated, evaded: false };
    },

    // 쓰러짐 연출이 끝나는 시점에 BattleCanvas가 호출 — 스테이지 이동과 HP 회복이 연출과 같이 맞물린다.
    startPendingEncounter: () => {
      const pending = get().pendingEncounter;
      if (!pending) return;
      set({
        stage: pending.stage,
        enemy: pending.enemy,
        enemyHp: pending.enemyHp,
        playerHp: pending.playerHp,
        awaitingBossChallenge: pending.awaitingBossChallenge,
        farmReturnStage: pending.farmReturnStage,
        pendingEncounter: null,
      });
      persist(get());
    },
  };
});

export {
  GONG_BOARDS,
  nodeLevel,
  nodeUpgradeCost,
  nodeBulkUpgrade,
  isNodeUnlocked,
  isBoardUnlocked,
  boardCompletionPercent,
  boardUnlockLabel,
  totalGongBuffPercent,
  gongMultiplier,
  boardPowerPercent,
  totalGongSecondaryStats,
};
export {
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  itemStats,
  aggregateGearStats,
  enhanceCost,
  enhanceSuccessChance,
  enhanceStoneCost,
  needsProtectionEligible,
  DOWNGRADE_CHANCE_ON_FAIL,
} from './gearData';
export { realmName, rebirthGateMajor, rebirthBuffPercent };
export {
  SECT_NAME,
  SECT_MAX_LEVEL,
  CHI_PER_CONTRIBUTION,
  ELIXIR_CONTRIBUTION_RATE,
  sectExpToNextLevel,
  sectBuffPercent,
  GRANDMASTER_TITLE,
  OTHER_SECTS,
  OTHER_SECT_MAX_FAVOR,
  otherSectLevel,
  otherSectPerkPercent,
  otherSectSecondaryStats,
  isSectTransmitted,
  allSectsTransmitted,
};
export { PULL_COST, PULL_10_COST, HARD_PITY, GRADE_COLOR, gradeTier };
export { DAILY_GOALS, MILESTONES, rewardText, todayString, TOWER_TURN_LIMIT, TOWER_UNLOCK_MAJOR };
export { GRADE_CHANCE, SOFT_PITY_START } from './gachaData';
export { elixirExchangeCost };
export { expToNextLevel, isBossStage, enemyKind };
export type { PullResult, StageId, GongBoard, GongCurrency, SlotId, GearItem, EnemyKind };
