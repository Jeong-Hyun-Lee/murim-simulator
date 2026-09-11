import { create } from "zustand";
import {
  monsterStats,
  playerStats,
  stageReward,
  nextStage,
  expToNextLevel,
  isBossStage,
  damage,
  rollPlayerDamage,
  rollEvaded,
  type StageId,
  type UnitStats,
  type PlayerStats,
} from "./combat";
import { loadState, saveState, type GameState } from "./state";
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
  totalGongSecondaryStats,
  type GongLevels,
  type GongBoard,
  type GongCurrency,
} from "./gongData";
import {
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  createEquipItem,
  aggregateEquipStats,
  enhanceCost,
  enhanceStoneCost,
  needsProtectionEligible,
  rollEnhance,
  type SlotId,
  type EquipItem,
} from "./equipData";
import { rollStageDrops } from "./dropData";
import { realmName, rebirthGateMajor, rebirthBuffPercent } from "./rebirthData";
import {
  SECT_NAME,
  SECT_MAX_LEVEL,
  CHI_PER_CONTRIBUTION,
  ELIXIR_CONTRIBUTION_RATE,
  sectExpToNextLevel,
  sectBuffPercent,
} from "./sectData";
import {
  PULL_COST,
  PULL_10_COST,
  HARD_PITY,
  pullSingle,
  pullTen,
  GRADE_COLOR,
  gradeTier,
  type PullResult,
} from "./gachaData";
import { elixirExchangeCost } from "./shopData";

// wiki/concepts/ux-시나리오-기획서.md §3-4: 오프라인 방치 성장 없음, 1일 1회 정액 재접속 보너스만.
const DAILY_BONUS_GOLD = 50;
const DAILY_BONUS_CHI = 30;
const DAILY_BONUS_ELIXIR = 5;
// wiki/concepts/상점-기연-시스템.md: 대보스(X-10) 최초 클리어 시 영약 3개 확정 지급.
const BOSS_FIRST_CLEAR_ELIXIR = 3;
const DEFEAT_CONSOLATION_RATIO = 0.2;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// 사냥터 모드는 이미 도달한(자동 등반이 지나온) 스테이지만 farming 대상으로 허용 — 현재 막힌
// 스테이지보다 앞선 곳을 미리 사냥하는 우회를 막는다.
export function isStageAtOrBefore(a: StageId, b: StageId): boolean {
  return a.major < b.major || (a.major === b.major && a.sub <= b.sub);
}

export interface GachaOutcome {
  results: PullResult[];
}

export interface BossRewardOutcome {
  stage: StageId;
  bossName: string;
  reward: { exp: number; gold: number; chi: number };
  elixirGained: number;
}

interface GameStoreState extends GameState {
  player: PlayerStats;
  playerHp: number;
  enemy: UnitStats;
  enemyHp: number;
  toastMessage: string;
  lastGachaOutcome: GachaOutcome | null;
  paused: boolean;
  // wiki/concepts/ux-시나리오-기획서.md 3-3절: 보스 조우 직전 [도전] 확인, 보스 격파 후
  // [계속하기] 확인 — 둘 다 사용자 확인 전까지 자동전투를 멈춘다.
  awaitingBossChallenge: boolean;
  awaitingBossReward: BossRewardOutcome | null;

  showToast: (msg: string) => void;
  togglePause: () => void;
  claimDailyBonusIfNeeded: () => void;
  buyGongUpgrade: (nodeId: string) => void;
  buyGongUpgradeBulk10: (nodeId: string) => void;
  bulkUpgradeAllGong: () => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: SlotId) => void;
  enhanceItem: (itemId: string, useProtection: boolean) => void;
  disassembleItems: (itemIds: string[]) => void;
  donateChiToSect: () => void;
  donateElixirToSect: () => void;
  performRebirth: () => void;
  pullGachaSingle: () => void;
  pullGachaTen: () => void;
  resetGachaOutcome: () => void;
  exchangeGoldForElixir: () => void;
  confirmBossChallenge: () => void;
  confirmBossReward: () => void;
  startFarming: (stage: StageId) => void;
  stopFarming: () => void;
  completeOnboarding: (nickname: string) => void;
  markTutorialGongDone: () => void;
  playerAttack: () => { dmg: number; isCrit: boolean; enemyDefeated: boolean };
  enemyAttack: () => { dmg: number; playerDefeated: boolean; evaded: boolean } | null;
}

// wiki/concepts/스테이지-레벨링-기획서.md 7장 전투력 공식: 무공/장구강화/문파특전/환골탈태
// 4항목을 하나의 가산버프 버킷에 합산 후 BaseStat_총합에 한 번만 곱한다. 장구의 원본 스탯
// (ATK/DEF/HP/치명타율 등)은 별도로 BaseStat_총합에 가산(computePlayerStats 참고).
function totalBuffPercent(
  s: Pick<GameStoreState, "gongLevels" | "rebirthCount" | "sectLevel">,
  gearEnhanceBuffPercent: number,
): number {
  return (
    totalGongBuffPercent(s.gongLevels) + gearEnhanceBuffPercent + rebirthBuffPercent(s.rebirthCount) + sectBuffPercent(s.sectLevel)
  );
}

function computePlayerStats(
  level: number,
  s: Pick<GameStoreState, "gongLevels" | "rebirthCount" | "sectLevel" | "equippedItems" | "nickname">,
): PlayerStats {
  const agg = aggregateEquipStats(s.equippedItems);
  const gongSecondary = totalGongSecondaryStats(s.gongLevels);
  const buffPercent = totalBuffPercent(s, agg.enhanceBuffPercent);
  return playerStats(
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
    s.nickname || "목현",
  );
}

// HP 최대치가 바뀔 때 이미 입은 피해량은 그대로 유지하고 최대치 증가분만 회복분으로 반영.
function carryOverHp(prevMaxHp: number, prevHp: number, newMaxHp: number): number {
  return Math.min(newMaxHp, prevHp + Math.max(0, newMaxHp - prevMaxHp));
}

// 무공 보드는 내공(chi) 또는 문파무공은 기여도(sectContributionPoints) 두 재화 중 하나를 쓴다.
function gongCurrencyBalance(board: GongBoard, s: Pick<GameStoreState, "chi" | "sectContributionPoints">): number {
  return board.currency === "contribution" ? s.sectContributionPoints : s.chi;
}

function gongCurrencyPatch(board: GongBoard, newBalance: number): Partial<GameStoreState> {
  return board.currency === "contribution" ? { sectContributionPoints: newBalance } : { chi: newBalance };
}

function applySectContribution(sectLevel: number, sectExp: number, contribution: number): { sectLevel: number; sectExp: number } {
  let level = sectLevel;
  let exp = sectExp + contribution;
  while (level < SECT_MAX_LEVEL && exp >= sectExpToNextLevel(level)) {
    exp -= sectExpToNextLevel(level);
    level += 1;
  }
  return { sectLevel: level, sectExp: exp };
}

function persist(s: GameStoreState) {
  const state: GameState = {
    level: s.level,
    exp: s.exp,
    gold: s.gold,
    chi: s.chi,
    stage: s.stage,
    gongLevels: s.gongLevels,
    equippedItems: s.equippedItems,
    inventory: s.inventory,
    enhanceStones: s.enhanceStones,
    protectionCharms: s.protectionCharms,
    rebirthCount: s.rebirthCount,
    highestMajorCleared: s.highestMajorCleared,
    sectLevel: s.sectLevel,
    sectExp: s.sectExp,
    sectTotalContribution: s.sectTotalContribution,
    sectContributionPoints: s.sectContributionPoints,
    elixir: s.elixir,
    elixirExchangeCount: s.elixirExchangeCount,
    gachaPity: s.gachaPity,
    lastLoginDate: s.lastLoginDate,
    nickname: s.nickname,
    onboardingDone: s.onboardingDone,
    tutorialGongDone: s.tutorialGongDone,
    farmReturnStage: s.farmReturnStage,
  };
  saveState(state);
}

function levelUp(level: number, exp: number): { level: number; exp: number } {
  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level += 1;
  }
  return { level, exp };
}

type ItemLocation = { item: EquipItem; source: "equipped" } | { item: EquipItem; source: "inventory" };

function findItemLocation(s: GameStoreState, itemId: string): ItemLocation | null {
  for (const slot of ALL_SLOTS) {
    const item = s.equippedItems[slot];
    if (item && item.id === itemId) return { item, source: "equipped" };
  }
  const item = s.inventory.find((it) => it.id === itemId);
  return item ? { item, source: "inventory" } : null;
}

function applyStageDrops(
  s: Pick<GameStoreState, "inventory" | "enhanceStones" | "protectionCharms">,
  stage: StageId,
  playerLevel: number,
  isFirstMajorClear: boolean,
): { inventory: EquipItem[]; enhanceStones: number; protectionCharms: number; dropSummary: string } {
  const drop = rollStageDrops(stage, playerLevel, isFirstMajorClear);
  const dropParts: string[] = [];
  if (drop.items.length > 0) dropParts.push(`장구 ${drop.items.length}개`);
  if (drop.stones > 0) dropParts.push(`강화석 +${drop.stones}`);
  if (drop.protectionCharms > 0) dropParts.push(`보호부적 +${drop.protectionCharms}`);
  return {
    inventory: drop.items.length > 0 ? [...s.inventory, ...drop.items] : s.inventory,
    enhanceStones: s.enhanceStones + drop.stones,
    protectionCharms: s.protectionCharms + drop.protectionCharms,
    dropSummary: dropParts.length > 0 ? ` (드랍: ${dropParts.join(", ")})` : "",
  };
}

const saved: GameState = loadState();

export const useGameStore = create<GameStoreState>((set, get) => {
  const initialPlayer = computePlayerStats(saved.level, saved);
  const initialEnemy = monsterStats(saved.stage);

  return {
    ...saved,
    player: initialPlayer,
    playerHp: initialPlayer.hp,
    enemy: initialEnemy,
    enemyHp: initialEnemy.hp,
    toastMessage: "",
    lastGachaOutcome: null,
    paused: false,
    awaitingBossChallenge: isBossStage(saved.stage),
    awaitingBossReward: null,

    showToast: (msg) => set({ toastMessage: msg }),
    togglePause: () => set((s) => ({ paused: !s.paused })),

    claimDailyBonusIfNeeded: () => {
      const today = todayString();
      const s = get();
      if (s.lastLoginDate === today) return;
      set({
        lastLoginDate: today,
        gold: s.gold + DAILY_BONUS_GOLD,
        chi: s.chi + DAILY_BONUS_CHI,
        elixir: s.elixir + DAILY_BONUS_ELIXIR,
        toastMessage: `재접속 환영 보너스! +전 ${DAILY_BONUS_GOLD} +내공 ${DAILY_BONUS_CHI} +영약 ${DAILY_BONUS_ELIXIR}`,
      });
      persist(get());
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
        !isBoardUnlocked(board, { highestMajorCleared: s.highestMajorCleared, gongLevels: s.gongLevels }) ||
        !isNodeUnlocked(node, s.gongLevels)
      )
        return;

      const gongLevels = { ...s.gongLevels, [nodeId]: curLevel + 1 };
      const newPlayer = computePlayerStats(s.level, { ...s, gongLevels });
      set({
        ...gongCurrencyPatch(board, balance - curCost),
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
        !isBoardUnlocked(board, { highestMajorCleared: s.highestMajorCleared, gongLevels: s.gongLevels }) ||
        !isNodeUnlocked(node, s.gongLevels)
      )
        return;

      const gongLevels = { ...s.gongLevels, [nodeId]: curLevel + levelsGained };
      const newPlayer = computePlayerStats(s.level, { ...s, gongLevels });
      set({
        ...gongCurrencyPatch(board, balance - cost),
        gongLevels,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    // wiki/concepts/ux-시나리오-기획서.md 1절 하단 액션바 "일괄 연마(모든 보드에 자동으로
    // 재화 소비)" — 해금된 모든 보드의 해금된 노드 중 가장 싼 강화부터 순서대로, 내공이
    // 바닥날 때까지 반복 구매하는 탐욕(greedy) 방식으로 구현. 기여도 재화 보드(문파무공)는
    // 서로 다른 재화라 "가장 싸다" 비교가 성립하지 않아 이 일괄 연마 대상에서 제외.
    bulkUpgradeAllGong: () => {
      const s = get();
      let chi = s.chi;
      const gongLevels = { ...s.gongLevels };
      let purchased = 0;
      const unlockCtx = { highestMajorCleared: s.highestMajorCleared, gongLevels };

      for (let i = 0; i < 100000; i++) {
        let cheapest: { nodeId: string; cost: number; level: number } | null = null;
        for (const board of GONG_BOARDS) {
          if (board.currency !== "chi" || !isBoardUnlocked(board, unlockCtx)) continue;
          for (const node of board.nodes) {
            const level = nodeLevel(node, gongLevels);
            if (level >= node.maxLevel || !isNodeUnlocked(node, gongLevels)) continue;
            const cost = nodeUpgradeCost(node, level);
            if (!cheapest || cost < cheapest.cost) cheapest = { nodeId: node.id, cost, level };
          }
        }
        if (!cheapest || chi < cheapest.cost) break;
        chi -= cheapest.cost;
        gongLevels[cheapest.nodeId] = cheapest.level + 1;
        purchased++;
      }

      if (purchased === 0) return;
      const newPlayer = computePlayerStats(s.level, { ...s, gongLevels });
      set({
        chi,
        gongLevels,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        toastMessage: `일괄 연마: ${purchased}회 강화 완료`,
      });
      persist(get());
    },

    equipItem: (itemId) => {
      const s = get();
      const idx = s.inventory.findIndex((it) => it.id === itemId);
      if (idx < 0) return;
      const item = s.inventory[idx];
      const prevEquipped = s.equippedItems[item.slot];
      const inventory = s.inventory.filter((it) => it.id !== itemId);
      if (prevEquipped) inventory.push(prevEquipped);
      const equippedItems = { ...s.equippedItems, [item.slot]: item };

      const newPlayer = computePlayerStats(s.level, { ...s, equippedItems });
      set({
        equippedItems,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        toastMessage: `${SLOT_INFO[item.slot].name} 장착: ${item.grade} +${item.enhanceLevel}`,
      });
      persist(get());
    },

    unequipItem: (slot) => {
      const s = get();
      const item = s.equippedItems[slot];
      if (!item) return;
      const equippedItems = { ...s.equippedItems };
      delete equippedItems[slot];
      const inventory = [...s.inventory, item];

      const newPlayer = computePlayerStats(s.level, { ...s, equippedItems });
      set({
        equippedItems,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
      });
      persist(get());
    },

    enhanceItem: (itemId, useProtection) => {
      const s = get();
      const location = findItemLocation(s, itemId);
      if (!location) return;
      const { item } = location;
      if (item.enhanceLevel >= ENHANCE_MAX_LEVEL) return;

      const targetLevel = item.enhanceLevel + 1;
      const cost = enhanceCost(item.enhanceLevel);
      const stoneCost = enhanceStoneCost(targetLevel);
      const wantsProtection = useProtection && needsProtectionEligible(targetLevel);
      if (s.gold < cost || s.enhanceStones < stoneCost || (wantsProtection && s.protectionCharms < 1)) return;

      const result = rollEnhance(item.enhanceLevel, wantsProtection);
      const updatedItem: EquipItem = { ...item, enhanceLevel: result.newLevel };

      const equippedItems =
        location.source === "equipped" ? { ...s.equippedItems, [item.slot]: updatedItem } : s.equippedItems;
      const inventory =
        location.source === "inventory" ? s.inventory.map((it) => (it.id === itemId ? updatedItem : it)) : s.inventory;

      const newPlayer = computePlayerStats(s.level, { ...s, equippedItems });
      const message = result.success
        ? `강화 성공! ${SLOT_INFO[item.slot].name} +${result.newLevel}`
        : result.downgraded
          ? `강화 실패... 단계 하락 (현재 +${result.newLevel})`
          : `강화 실패 (현재 +${result.newLevel} 유지)`;
      set({
        gold: s.gold - cost,
        enhanceStones: s.enhanceStones - stoneCost,
        protectionCharms: wantsProtection ? s.protectionCharms - 1 : s.protectionCharms,
        equippedItems,
        inventory,
        player: newPlayer,
        playerHp: carryOverHp(s.player.hp, s.playerHp, newPlayer.hp),
        toastMessage: message,
      });
      persist(get());
    },

    disassembleItems: (itemIds) => {
      const s = get();
      const idSet = new Set(itemIds);
      const toDisassemble = s.inventory.filter((it) => idSet.has(it.id));
      if (toDisassemble.length === 0) return;
      const inventory = s.inventory.filter((it) => !idSet.has(it.id));
      // wiki에 분해 환급량 수치가 없어 v1 근사치: 등급 1단계당 강화석 1개씩 증가(하품 1개~선품 6개).
      const stonesGained = toDisassemble.reduce((sum, it) => sum + 1 + gradeTier(it.grade), 0);
      set({
        inventory,
        enhanceStones: s.enhanceStones + stonesGained,
        toastMessage: `일괄 분해: ${toDisassemble.length}개 → 강화석 +${stonesGained}`,
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
        toastMessage: `환골탈태! ${realmName(rebirthCount)} 경지에 올랐다 (+전체 스탯 15%)`,
      });
      persist(get());
    },

    pullGachaSingle: () => {
      const s = get();
      if (s.elixir < PULL_COST) return;
      const { result, nextPity } = pullSingle(s.gachaPity);
      const item = createEquipItem(result.slot, result.grade, s.level);
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
      const items = results.map((r) => createEquipItem(r.slot, r.grade, s.level));
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
      const { amount: dmg, isCrit } = rollPlayerDamage(s.player.atk, s.enemy.def, s.player.critChance, s.player.critMultiplier);
      const enemyHp = s.enemyHp - dmg;
      const enemyDefeated = enemyHp <= 0;

      if (enemyDefeated && s.farmReturnStage) {
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
          playerHp: newPlayer.hp,
          enemy: newEnemy,
          enemyHp: newEnemy.hp,
          toastMessage: `사냥: ${s.stage.major}-${s.stage.sub} 처치! +EXP ${reward.exp} +전 ${reward.gold}${drop.dropSummary}`,
        });
        persist(get());
      } else if (enemyDefeated && isBossStage(s.stage)) {
        // 보스 격파 직후에는 즉시 다음 스테이지로 넘기지 않고, 사용자가 [계속하기]를
        // 확인할 때까지 보류(confirmBossReward에서 실제 적용) — 드랍도 그때 함께 지급.
        const reward = stageReward(s.stage);
        const elixirGained = s.stage.major > s.highestMajorCleared ? BOSS_FIRST_CLEAR_ELIXIR : 0;
        set({
          enemyHp: 0,
          awaitingBossReward: { stage: s.stage, bossName: s.enemy.name, reward, elixirGained },
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
        set({
          level,
          exp,
          gold,
          chi,
          stage,
          inventory: drop.inventory,
          enhanceStones: drop.enhanceStones,
          protectionCharms: drop.protectionCharms,
          player: newPlayer,
          playerHp: newPlayer.hp,
          enemy: newEnemy,
          enemyHp: newEnemy.hp,
          awaitingBossChallenge: isBossStage(stage),
          toastMessage: `${s.stage.major}-${s.stage.sub} 클리어! +EXP ${reward.exp} +전 ${reward.gold}${drop.dropSummary}`,
        });
        persist(get());
      } else {
        set({ enemyHp });
      }

      return { dmg, isCrit, enemyDefeated };
    },

    confirmBossChallenge: () => set({ awaitingBossChallenge: false }),

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
      set({
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
      if (s.awaitingBossChallenge || s.awaitingBossReward) return;
      const frontier = s.farmReturnStage ?? s.stage;
      if (!isStageAtOrBefore(stage, frontier)) return;

      const farmReturnStage = s.farmReturnStage ?? s.stage;
      const newEnemy = monsterStats(stage);
      set({
        stage,
        farmReturnStage,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        awaitingBossChallenge: false,
        toastMessage: `사냥터 이동: ${stage.major}-${stage.sub}`,
      });
      persist(get());
    },

    // 사냥터 모드 종료 — 자동 등반이 멈춰 있던 스테이지로 복귀해 등반을 재개한다.
    stopFarming: () => {
      const s = get();
      const returnStage = s.farmReturnStage;
      if (!returnStage) return;
      const newEnemy = monsterStats(returnStage);
      set({
        stage: returnStage,
        farmReturnStage: null,
        enemy: newEnemy,
        enemyHp: newEnemy.hp,
        awaitingBossChallenge: isBossStage(returnStage),
        toastMessage: `자동 등반 복귀: ${returnStage.major}-${returnStage.sub}`,
      });
      persist(get());
    },

    // wiki/concepts/ux-시나리오-기획서.md 4장 2절: 도호(별명) 입력, 미입력/스킵 시 기본값.
    completeOnboarding: (nickname) => {
      const s = get();
      const finalName = nickname.trim() || "목현";
      const newPlayer = computePlayerStats(s.level, { ...s, nickname: finalName });
      set({ nickname: finalName, onboardingDone: true, player: newPlayer });
      persist(get());
    },

    // wiki/concepts/ux-시나리오-기획서.md 4장 5절: 첫 성장보드 강제 개방 튜토리얼 완료 처리.
    markTutorialGongDone: () => {
      set({ tutorialGongDone: true });
      persist(get());
    },

    enemyAttack: () => {
      const s = get();
      if (s.enemyHp <= 0) return null;
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
        const newEnemy = monsterStats(s.stage);
        set({
          playerHp: newPlayer.hp,
          level,
          exp,
          gold,
          player: newPlayer,
          enemy: newEnemy,
          enemyHp: newEnemy.hp,
          toastMessage: `패배... 수련 후 재도전 (+EXP ${consolationExp})`,
        });
        persist(get());
      } else {
        set({ playerHp });
      }

      return { dmg, playerDefeated, evaded: false };
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
  totalGongSecondaryStats,
};
export {
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  itemBaseStats,
  aggregateEquipStats,
  enhanceCost,
  enhanceSuccessChance,
  enhanceStoneCost,
  needsProtectionEligible,
} from "./equipData";
export { realmName, rebirthGateMajor, rebirthBuffPercent };
export {
  SECT_NAME,
  SECT_MAX_LEVEL,
  CHI_PER_CONTRIBUTION,
  ELIXIR_CONTRIBUTION_RATE,
  sectExpToNextLevel,
  sectBuffPercent,
};
export { PULL_COST, PULL_10_COST, HARD_PITY, GRADE_COLOR, gradeTier };
export { elixirExchangeCost };
export { expToNextLevel, isBossStage };
export type { PullResult, StageId, GongBoard, GongCurrency, SlotId, EquipItem };
