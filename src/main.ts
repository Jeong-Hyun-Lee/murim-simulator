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
};

const ATTACK_INTERVAL_MS = 1300;
const ENEMY_ATTACK_INTERVAL_MS = 1600;
const DEFEAT_CONSOLATION_RATIO = 0.2;

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

  let player = playerStats(level);
  let playerHp = player.hp;
  let enemy = monsterStats(stage);
  let enemyHp = enemy.hp;

  let attackClock = 0;
  let enemyAttackClock = 0;
  let isAttacking = false;
  let attackElapsed = 0;

  function persist() {
    saveState({ level, exp, gold, chi, stage });
  }

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
      player = playerStats(level);
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
