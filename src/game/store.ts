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
  type StageId,
  type UnitStats,
} from "./combat";
import { loadState, saveState, type GameState } from "./state";
import {
  GONG_BOARDS,
  nodeLevel,
  nodeUpgradeCost,
  isNodeUnlocked,
  isBoardUnlocked,
  findBoardByNodeId,
  boardCompletionPercent,
  totalGongBuffPercent,
  type GongLevels,
  type GongBoard,
} from "./gongData";
import { WEAPON_MAX_LEVEL, weaponUpgradeCost, weaponBuffPercent } from "./equipData";
import { realmName, rebirthGateMajor, rebirthBuffPercent } from "./rebirthData";
import { SECT_NAME, SECT_MAX_LEVEL, CHI_PER_CONTRIBUTION, sectExpToNextLevel, sectBuffPercent } from "./sectData";
import { PULL_COST, PULL_10_COST, HARD_PITY, pullSingle, pullTen, type PullResult } from "./gachaData";

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

export interface GachaOutcome {
  results: PullResult[];
  totalReward: number;
}

interface GameStoreState extends GameState {
  player: UnitStats;
  playerHp: number;
  enemy: UnitStats;
  enemyHp: number;
  toastMessage: string;
  lastGachaOutcome: GachaOutcome | null;
  paused: boolean;

  showToast: (msg: string) => void;
  togglePause: () => void;
  claimDailyBonusIfNeeded: () => void;
  buyGongUpgrade: (nodeId: string) => void;
  upgradeWeapon: () => void;
  donateChiToSect: () => void;
  performRebirth: () => void;
  pullGachaSingle: () => void;
  pullGachaTen: () => void;
  resetGachaOutcome: () => void;
  playerAttack: () => { dmg: number; isCrit: boolean; enemyDefeated: boolean };
  enemyAttack: () => { dmg: number; playerDefeated: boolean } | null;
}

function totalBuffPercent(s: Pick<GameStoreState, "gongLevels" | "weaponLevel" | "rebirthCount" | "sectLevel">): number {
  return (
    totalGongBuffPercent(s.gongLevels) +
    weaponBuffPercent(s.weaponLevel) +
    rebirthBuffPercent(s.rebirthCount) +
    sectBuffPercent(s.sectLevel)
  );
}

function persist(s: GameStoreState) {
  const state: GameState = {
    level: s.level,
    exp: s.exp,
    gold: s.gold,
    chi: s.chi,
    stage: s.stage,
    gongLevels: s.gongLevels,
    weaponLevel: s.weaponLevel,
    rebirthCount: s.rebirthCount,
    highestMajorCleared: s.highestMajorCleared,
    sectLevel: s.sectLevel,
    sectExp: s.sectExp,
    sectTotalContribution: s.sectTotalContribution,
    elixir: s.elixir,
    gachaPity: s.gachaPity,
    lastLoginDate: s.lastLoginDate,
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

const saved: GameState = loadState();

export const useGameStore = create<GameStoreState>((set, get) => {
  const initialPlayer = playerStats(saved.level, totalBuffPercent(saved));
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
      if (
        s.chi < curCost ||
        curLevel >= node.maxLevel ||
        !isBoardUnlocked(board, s.highestMajorCleared) ||
        !isNodeUnlocked(node, s.gongLevels)
      )
        return;

      const gongLevels = { ...s.gongLevels, [nodeId]: curLevel + 1 };
      const newPlayer = playerStats(s.level, totalBuffPercent({ ...s, gongLevels }));
      set({
        chi: s.chi - curCost,
        gongLevels,
        player: newPlayer,
        playerHp: Math.min(newPlayer.hp, s.playerHp + Math.max(0, newPlayer.hp - s.player.hp)),
      });
      persist(get());
    },

    upgradeWeapon: () => {
      const s = get();
      const curCost = weaponUpgradeCost(s.weaponLevel);
      if (s.gold < curCost || s.weaponLevel >= WEAPON_MAX_LEVEL) return;

      const weaponLevel = s.weaponLevel + 1;
      const newPlayer = playerStats(s.level, totalBuffPercent({ ...s, weaponLevel }));
      set({
        gold: s.gold - curCost,
        weaponLevel,
        player: newPlayer,
        playerHp: Math.min(newPlayer.hp, s.playerHp + Math.max(0, newPlayer.hp - s.player.hp)),
      });
      persist(get());
    },

    donateChiToSect: () => {
      const s = get();
      const donatable = Math.floor(s.chi / CHI_PER_CONTRIBUTION);
      if (donatable <= 0 || s.sectLevel >= SECT_MAX_LEVEL) return;

      let sectLevel = s.sectLevel;
      let sectExp = s.sectExp + donatable;
      while (sectLevel < SECT_MAX_LEVEL && sectExp >= sectExpToNextLevel(sectLevel)) {
        sectExp -= sectExpToNextLevel(sectLevel);
        sectLevel += 1;
      }

      const newPlayer = playerStats(s.level, totalBuffPercent({ ...s, sectLevel }));
      set({
        chi: s.chi - donatable * CHI_PER_CONTRIBUTION,
        sectTotalContribution: s.sectTotalContribution + donatable,
        sectExp,
        sectLevel,
        player: newPlayer,
        playerHp: Math.min(newPlayer.hp, s.playerHp + Math.max(0, newPlayer.hp - s.player.hp)),
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
      const newPlayer = playerStats(level, totalBuffPercent({ ...s, rebirthCount, gongLevels }));
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
        toastMessage: `환골탈태! ${realmName(rebirthCount)} 경지에 올랐다 (+전체 스탯 15%)`,
      });
      persist(get());
    },

    pullGachaSingle: () => {
      const s = get();
      if (s.elixir < PULL_COST) return;
      const { result, nextPity } = pullSingle(s.gachaPity);
      set({
        elixir: s.elixir - PULL_COST,
        gachaPity: nextPity,
        chi: s.chi + result.reward,
        lastGachaOutcome: { results: [result], totalReward: result.reward },
      });
      persist(get());
    },

    pullGachaTen: () => {
      const s = get();
      if (s.elixir < PULL_10_COST) return;
      const { results, nextPity } = pullTen(s.gachaPity);
      const totalReward = results.reduce((sum, r) => sum + r.reward, 0);
      set({
        elixir: s.elixir - PULL_10_COST,
        gachaPity: nextPity,
        chi: s.chi + totalReward,
        lastGachaOutcome: { results, totalReward },
      });
      persist(get());
    },

    resetGachaOutcome: () => set({ lastGachaOutcome: null }),

    playerAttack: () => {
      const s = get();
      const { amount: dmg, isCrit } = rollPlayerDamage(s.player.atk, s.enemy.def);
      const enemyHp = s.enemyHp - dmg;
      const enemyDefeated = enemyHp <= 0;

      if (enemyDefeated) {
        const reward = stageReward(s.stage);
        const { level, exp } = levelUp(s.level, s.exp + reward.exp);
        const gold = s.gold + reward.gold;
        const chi = s.chi + reward.chi;
        let highestMajorCleared = s.highestMajorCleared;
        let elixir = s.elixir;
        if (isBossStage(s.stage) && s.stage.major > highestMajorCleared) {
          highestMajorCleared = s.stage.major;
          elixir += BOSS_FIRST_CLEAR_ELIXIR;
        }
        const stage = nextStage(s.stage);
        const newPlayer = playerStats(level, totalBuffPercent(s));
        const newEnemy = monsterStats(stage);
        set({
          level,
          exp,
          gold,
          chi,
          highestMajorCleared,
          elixir,
          stage,
          player: newPlayer,
          playerHp: newPlayer.hp,
          enemy: newEnemy,
          enemyHp: newEnemy.hp,
          toastMessage: `${s.stage.major}-${s.stage.sub} 클리어! +EXP ${reward.exp} +전 ${reward.gold}`,
        });
        persist(get());
      } else {
        set({ enemyHp });
      }

      return { dmg, isCrit, enemyDefeated };
    },

    enemyAttack: () => {
      const s = get();
      if (s.enemyHp <= 0) return null;
      const dmg = damage(s.enemy.atk, s.player.def);
      const playerHp = s.playerHp - dmg;
      const playerDefeated = playerHp <= 0;

      if (playerDefeated) {
        const reward = stageReward(s.stage);
        const consolationExp = Math.round(reward.exp * DEFEAT_CONSOLATION_RATIO);
        const consolationGold = Math.round(reward.gold * DEFEAT_CONSOLATION_RATIO);
        const { level, exp } = levelUp(s.level, s.exp + consolationExp);
        const gold = s.gold + consolationGold;
        const newPlayer = playerStats(level, totalBuffPercent(s));
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

      return { dmg, playerDefeated };
    },
  };
});

export { GONG_BOARDS, nodeLevel, nodeUpgradeCost, isNodeUnlocked, isBoardUnlocked, boardCompletionPercent };
export { WEAPON_MAX_LEVEL, weaponUpgradeCost, weaponBuffPercent };
export { realmName, rebirthGateMajor, rebirthBuffPercent };
export { SECT_NAME, SECT_MAX_LEVEL, CHI_PER_CONTRIBUTION, sectExpToNextLevel, sectBuffPercent };
export { PULL_COST, PULL_10_COST, HARD_PITY };
export { expToNextLevel, isBossStage };
export type { PullResult, StageId, GongBoard };
