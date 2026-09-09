import { SpriteAnimation } from "./sprite";
import {
  monsterStats,
  playerStats,
  stageReward,
  nextStage,
  stageLabel,
  expToNextLevel,
  damage,
  isBossStage,
  type StageId,
} from "./combat";
import { loadState, saveState, type GameState } from "./state";
import { SAMJAE_BOARD, nodeLevel, nodeUpgradeCost, isNodeUnlocked, totalGongBuffPercent } from "./gongData";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#battle-canvas")!;
const ctx = canvas.getContext("2d")!;

const el = {
  stage: document.querySelector<HTMLElement>("#stage-label")!,
  gold: document.querySelector<HTMLElement>("#gold-label")!,
  chi: document.querySelector<HTMLElement>("#chi-label")!,
  level: document.querySelector<HTMLElement>("#level-label")!,
  playerHpFill: document.querySelector<HTMLElement>("#player-hp-fill")!,
  playerExpFill: document.querySelector<HTMLElement>("#player-exp-fill")!,
  enemyName: document.querySelector<HTMLElement>("#enemy-name-label")!,
  enemyHpFill: document.querySelector<HTMLElement>("#enemy-hp-fill")!,
  toast: document.querySelector<HTMLElement>("#log-toast")!,
  gongToggleBtn: document.querySelector<HTMLButtonElement>("#gong-toggle-btn")!,
  gongCloseBtn: document.querySelector<HTMLButtonElement>("#gong-close-btn")!,
  gongPanel: document.querySelector<HTMLElement>("#gong-panel")!,
  gongNodeList: document.querySelector<HTMLElement>("#gong-node-list")!,
};

const ATTACK_INTERVAL_MS = 1300;
const ENEMY_ATTACK_INTERVAL_MS = 1600;
const DEFEAT_CONSOLATION_RATIO = 0.2;
// wiki/concepts/ux-시나리오-기획서.md §3-4: 오프라인 방치 성장 없음, 1일 1회 정액 재접속 보너스만.
const DAILY_BONUS_GOLD = 50;
const DAILY_BONUS_CHI = 30;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

let toastTimer: number | undefined;
function showToast(msg: string) {
  el.toast.textContent = msg;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.toast.textContent = "";
  }, 2200);
}

async function main() {
  const idleAnim = await SpriteAnimation.load("/sprites/character/mokhyeon-idle-sheet.json", "idle");
  const attackAnim = await SpriteAnimation.load("/sprites/character/mokhyeon-attack-sheet.json", "attack");

  const saved: GameState = loadState();
  let stage: StageId = saved.stage;
  let level = saved.level;
  let exp = saved.exp;
  let gold = saved.gold;
  let chi = saved.chi;
  const gongLevels = saved.gongLevels;
  let lastLoginDate = saved.lastLoginDate;

  let player = playerStats(level, totalGongBuffPercent(gongLevels));
  let playerHp = player.hp;
  let enemy = monsterStats(stage);
  let enemyHp = enemy.hp;

  let attackClock = 0;
  let enemyAttackClock = 0;
  let isAttacking = false;
  let attackElapsed = 0;

  function persist() {
    saveState({ level, exp, gold, chi, stage, gongLevels, lastLoginDate });
  }

  function recomputePlayerStats() {
    const newPlayer = playerStats(level, totalGongBuffPercent(gongLevels));
    playerHp = Math.min(newPlayer.hp, playerHp + Math.max(0, newPlayer.hp - player.hp));
    player = newPlayer;
  }

  function claimDailyBonusIfNeeded() {
    const today = todayString();
    if (lastLoginDate === today) return;
    lastLoginDate = today;
    gold += DAILY_BONUS_GOLD;
    chi += DAILY_BONUS_CHI;
    showToast(`재접속 환영 보너스! +전 ${DAILY_BONUS_GOLD} +내공 ${DAILY_BONUS_CHI}`);
    persist();
  }

  function renderGongPanel() {
    el.gongNodeList.innerHTML = "";
    for (const node of SAMJAE_BOARD) {
      const lv = nodeLevel(node, gongLevels);
      const unlocked = isNodeUnlocked(node, gongLevels);
      const maxed = lv >= node.maxLevel;
      const cost = nodeUpgradeCost(node, lv);

      const row = document.createElement("div");
      row.className = "gong-node" + (unlocked ? "" : " gong-node-locked");

      const name = document.createElement("span");
      name.className = "gong-node-name";
      name.textContent = node.name;

      const tier = document.createElement("span");
      tier.className = "gong-node-tier";
      tier.textContent = node.tier === "primary" ? "1차" : node.tier === "secondary" ? "2차" : "캡스톤";

      const lvSpan = document.createElement("span");
      lvSpan.className = "gong-node-level";
      lvSpan.textContent = `Lv.${lv}/${node.maxLevel}`;

      const btn = document.createElement("button");
      btn.className = "gong-upgrade-btn";
      if (!unlocked) {
        btn.textContent = "잠금";
        btn.disabled = true;
      } else if (maxed) {
        btn.textContent = "대성";
        btn.disabled = true;
      } else {
        btn.textContent = `강화 (내공 ${cost.toLocaleString()})`;
        btn.disabled = chi < cost;
        btn.onclick = () => {
          if (chi < cost || (gongLevels[node.id] ?? 0) >= node.maxLevel) return;
          chi -= cost;
          gongLevels[node.id] = (gongLevels[node.id] ?? 0) + 1;
          recomputePlayerStats();
          persist();
          renderGongPanel();
          refreshHud();
        };
      }

      row.append(name, tier, lvSpan, btn);
      el.gongNodeList.appendChild(row);
    }
  }

  el.gongToggleBtn.onclick = () => {
    el.gongPanel.hidden = !el.gongPanel.hidden;
    if (!el.gongPanel.hidden) renderGongPanel();
  };
  el.gongCloseBtn.onclick = () => {
    el.gongPanel.hidden = true;
  };

  claimDailyBonusIfNeeded();

  function refreshHud() {
    el.stage.textContent = stageLabel(stage) + (isBossStage(stage) ? " (보스)" : "");
    el.gold.textContent = `전 ${gold.toLocaleString()}`;
    el.chi.textContent = `내공 ${chi.toLocaleString()}`;
    el.level.textContent = `Lv.${level}`;
    el.playerHpFill.style.width = `${Math.max(0, (playerHp / player.hp) * 100)}%`;
    el.playerExpFill.style.width = `${Math.min(100, (exp / expToNextLevel(level)) * 100)}%`;
    el.enemyName.textContent = enemy.name;
    el.enemyHpFill.style.width = `${Math.max(0, (enemyHp / enemy.hp) * 100)}%`;
  }

  function levelUp() {
    while (exp >= expToNextLevel(level)) {
      exp -= expToNextLevel(level);
      level += 1;
      recomputePlayerStats();
    }
  }

  function spawnEnemy() {
    enemy = monsterStats(stage);
    enemyHp = enemy.hp;
  }

  function onVictory() {
    const reward = stageReward(stage);
    exp += reward.exp;
    gold += reward.gold;
    chi += reward.chi;
    levelUp();
    playerHp = player.hp;
    showToast(`${stageLabel(stage)} 클리어! +EXP ${reward.exp} +전 ${reward.gold}`);
    stage = nextStage(stage);
    spawnEnemy();
    persist();
  }

  function onDefeat() {
    const reward = stageReward(stage);
    const consolationExp = Math.round(reward.exp * DEFEAT_CONSOLATION_RATIO);
    const consolationGold = Math.round(reward.gold * DEFEAT_CONSOLATION_RATIO);
    exp += consolationExp;
    gold += consolationGold;
    levelUp();
    playerHp = player.hp;
    showToast(`패배... 수련 후 재도전 (+EXP ${consolationExp})`);
    spawnEnemy();
    persist();
  }

  function playerAttack() {
    isAttacking = true;
    attackElapsed = 0;
    attackAnim.reset();

    const dmg = damage(player.atk, enemy.def);
    enemyHp -= dmg;
    if (enemyHp <= 0) onVictory();
  }

  function enemyAttack() {
    if (enemyHp <= 0) return;
    const dmg = damage(enemy.atk, player.def);
    playerHp -= dmg;
    if (playerHp <= 0) onDefeat();
  }

  function drawEnemyPlaceholder() {
    const boxSize = isBossStage(stage) ? 90 : 60;
    const cx = 700;
    const cy = 340;
    ctx.fillStyle = isBossStage(stage) ? "#7a2fb0" : "#b03a3a";
    ctx.fillRect(cx - boxSize / 2, cy - boxSize, boxSize, boxSize);
  }

  refreshHud();
  let lastTime = performance.now();

  function frame(time: number) {
    const deltaMs = Math.min(100, time - lastTime);
    lastTime = time;

    attackClock += deltaMs;
    enemyAttackClock += deltaMs;

    if (attackClock >= ATTACK_INTERVAL_MS) {
      attackClock = 0;
      playerAttack();
    }
    if (enemyAttackClock >= ENEMY_ATTACK_INTERVAL_MS) {
      enemyAttackClock = 0;
      enemyAttack();
    }

    if (isAttacking) {
      attackElapsed += deltaMs;
      attackAnim.update(deltaMs);
      if (attackElapsed >= attackAnim.totalDurationMs) {
        isAttacking = false;
        idleAnim.reset();
      }
    } else {
      idleAnim.update(deltaMs);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#242430";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#141419";
    ctx.fillRect(0, 400, canvas.width, canvas.height - 400);

    (isAttacking ? attackAnim : idleAnim).draw(ctx, 280, 400, 3, false);
    drawEnemyPlaceholder();

    refreshHud();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
