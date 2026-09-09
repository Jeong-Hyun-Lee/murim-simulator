import { SpriteAnimation } from "./sprite";
import {
  monsterStats,
  playerStats,
  stageReward,
  nextStage,
  stageLabel,
  expToNextLevel,
  damage,
  rollPlayerDamage,
  isBossStage,
  type StageId,
} from "./combat";
import { loadState, saveState, type GameState } from "./state";
import { SAMJAE_BOARD, nodeLevel, nodeUpgradeCost, isNodeUnlocked, totalGongBuffPercent } from "./gongData";
import { WEAPON_MAX_LEVEL, weaponUpgradeCost, weaponBuffPercent } from "./equipData";
import { realmName, rebirthGateMajor, rebirthBuffPercent } from "./rebirthData";
import { SECT_NAME, SECT_MAX_LEVEL, CHI_PER_CONTRIBUTION, sectExpToNextLevel, sectBuffPercent } from "./sectData";
import { PULL_COST, PULL_10_COST, HARD_PITY, pullSingle, pullTen, type PullResult } from "./gachaData";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#battle-canvas")!;
const ctx = canvas.getContext("2d")!;

const el = {
  stage: document.querySelector<HTMLElement>("#stage-label")!,
  gold: document.querySelector<HTMLElement>("#gold-label")!,
  chi: document.querySelector<HTMLElement>("#chi-label")!,
  elixir: document.querySelector<HTMLElement>("#elixir-label")!,
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
  equipToggleBtn: document.querySelector<HTMLButtonElement>("#equip-toggle-btn")!,
  equipCloseBtn: document.querySelector<HTMLButtonElement>("#equip-close-btn")!,
  equipPanel: document.querySelector<HTMLElement>("#equip-panel")!,
  equipNodeList: document.querySelector<HTMLElement>("#equip-node-list")!,
  pauseBtn: document.querySelector<HTMLButtonElement>("#pause-toggle-btn")!,
  rebirthToggleBtn: document.querySelector<HTMLButtonElement>("#rebirth-toggle-btn")!,
  rebirthCloseBtn: document.querySelector<HTMLButtonElement>("#rebirth-close-btn")!,
  rebirthPanel: document.querySelector<HTMLElement>("#rebirth-panel")!,
  rebirthBody: document.querySelector<HTMLElement>("#rebirth-body")!,
  sectToggleBtn: document.querySelector<HTMLButtonElement>("#sect-toggle-btn")!,
  sectCloseBtn: document.querySelector<HTMLButtonElement>("#sect-close-btn")!,
  sectPanel: document.querySelector<HTMLElement>("#sect-panel")!,
  sectBody: document.querySelector<HTMLElement>("#sect-body")!,
  gachaToggleBtn: document.querySelector<HTMLButtonElement>("#gacha-toggle-btn")!,
  gachaCloseBtn: document.querySelector<HTMLButtonElement>("#gacha-close-btn")!,
  gachaPanel: document.querySelector<HTMLElement>("#gacha-panel")!,
  gachaBody: document.querySelector<HTMLElement>("#gacha-body")!,
  gachaResult: document.querySelector<HTMLElement>("#gacha-result")!,
};

const ATTACK_INTERVAL_MS = 1300;
const ENEMY_ATTACK_INTERVAL_MS = 1600;
const DEFEAT_CONSOLATION_RATIO = 0.2;
// wiki/concepts/ux-시나리오-기획서.md §3-4: 오프라인 방치 성장 없음, 1일 1회 정액 재접속 보너스만.
const DAILY_BONUS_GOLD = 50;
const DAILY_BONUS_CHI = 30;
const DAILY_BONUS_ELIXIR = 5;
// wiki/concepts/상점-기연-시스템.md: 대보스(X-10) 최초 클리어 시 영약 3개 확정 지급.
const BOSS_FIRST_CLEAR_ELIXIR = 3;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const PLAYER_X = 280;
const PLAYER_Y = 400;
const ENEMY_X = 700;
const ENEMY_Y = 340;
const HIT_FLASH_MS = 140;
const POPUP_LIFETIME_MS = 800;

interface DamagePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
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
  let weaponLevel = saved.weaponLevel;
  let rebirthCount = saved.rebirthCount;
  let highestMajorCleared = saved.highestMajorCleared;
  let sectLevel = saved.sectLevel;
  let sectExp = saved.sectExp;
  let sectTotalContribution = saved.sectTotalContribution;
  let elixir = saved.elixir;
  let gachaPity = saved.gachaPity;
  let lastLoginDate = saved.lastLoginDate;

  function totalBuffPercent(): number {
    return (
      totalGongBuffPercent(gongLevels) +
      weaponBuffPercent(weaponLevel) +
      rebirthBuffPercent(rebirthCount) +
      sectBuffPercent(sectLevel)
    );
  }

  let player = playerStats(level, totalBuffPercent());
  let playerHp = player.hp;
  let enemy = monsterStats(stage);
  let enemyHp = enemy.hp;

  let attackClock = 0;
  let enemyAttackClock = 0;
  let isAttacking = false;
  let attackElapsed = 0;
  let enemyFlashMs = 0;
  let playerFlashMs = 0;
  let paused = false;
  const popups: DamagePopup[] = [];

  el.pauseBtn.onclick = () => {
    paused = !paused;
    el.pauseBtn.textContent = paused ? "재개" : "일시정지";
  };

  function spawnPopup(x: number, y: number, text: string, color: string) {
    popups.push({ x, y, text, color, age: 0 });
  }

  function persist() {
    saveState({
      level,
      exp,
      gold,
      chi,
      stage,
      gongLevels,
      weaponLevel,
      rebirthCount,
      highestMajorCleared,
      sectLevel,
      sectExp,
      sectTotalContribution,
      elixir,
      gachaPity,
      lastLoginDate,
    });
  }

  function donateChiToSect() {
    const donatable = Math.floor(chi / CHI_PER_CONTRIBUTION);
    if (donatable <= 0 || sectLevel >= SECT_MAX_LEVEL) return;
    chi -= donatable * CHI_PER_CONTRIBUTION;
    sectTotalContribution += donatable;
    sectExp += donatable;
    while (sectLevel < SECT_MAX_LEVEL && sectExp >= sectExpToNextLevel(sectLevel)) {
      sectExp -= sectExpToNextLevel(sectLevel);
      sectLevel += 1;
    }
    recomputePlayerStats();
    persist();
    renderSectPanel();
    refreshHud();
  }

  function renderSectPanel() {
    el.sectBody.innerHTML = "";
    const donatable = Math.floor(chi / CHI_PER_CONTRIBUTION);
    const maxed = sectLevel >= SECT_MAX_LEVEL;

    const info = document.createElement("div");
    info.innerHTML =
      `소속: <b>${SECT_NAME}</b><br>` +
      `문파 Lv.${sectLevel}/${SECT_MAX_LEVEL} (${sectExp}/${maxed ? "-" : sectExpToNextLevel(sectLevel)})<br>` +
      `문파 특전: 전투력 +${sectBuffPercent(sectLevel)}%<br>` +
      `누적 기여도: ${sectTotalContribution.toLocaleString()}<br>` +
      `내공 ${CHI_PER_CONTRIBUTION.toLocaleString()} = 기여도 1 (보유 내공 ${chi.toLocaleString()})`;
    el.sectBody.appendChild(info);

    const btn = document.createElement("button");
    btn.className = "gong-upgrade-btn";
    btn.textContent = maxed ? "대성" : `내공 기부 (기여도 +${donatable})`;
    btn.disabled = maxed || donatable <= 0;
    btn.onclick = donateChiToSect;
    el.sectBody.appendChild(btn);
  }

  function recomputePlayerStats() {
    const newPlayer = playerStats(level, totalBuffPercent());
    playerHp = Math.min(newPlayer.hp, playerHp + Math.max(0, newPlayer.hp - player.hp));
    player = newPlayer;
  }

  function claimDailyBonusIfNeeded() {
    const today = todayString();
    if (lastLoginDate === today) return;
    lastLoginDate = today;
    gold += DAILY_BONUS_GOLD;
    chi += DAILY_BONUS_CHI;
    elixir += DAILY_BONUS_ELIXIR;
    showToast(`재접속 환영 보너스! +전 ${DAILY_BONUS_GOLD} +내공 ${DAILY_BONUS_CHI} +영약 ${DAILY_BONUS_ELIXIR}`);
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

  function renderEquipPanel() {
    el.equipNodeList.innerHTML = "";
    const maxed = weaponLevel >= WEAPON_MAX_LEVEL;
    const cost = weaponUpgradeCost(weaponLevel);

    const row = document.createElement("div");
    row.className = "gong-node";

    const name = document.createElement("span");
    name.className = "gong-node-name";
    name.textContent = "무기 (병기)";

    const tier = document.createElement("span");
    tier.className = "gong-node-tier";
    tier.textContent = "+강화";

    const lvSpan = document.createElement("span");
    lvSpan.className = "gong-node-level";
    lvSpan.textContent = `+${weaponLevel}/${WEAPON_MAX_LEVEL}`;

    const btn = document.createElement("button");
    btn.className = "gong-upgrade-btn";
    if (maxed) {
      btn.textContent = "대성";
      btn.disabled = true;
    } else {
      btn.textContent = `강화 (전 ${cost.toLocaleString()})`;
      btn.disabled = gold < cost;
      btn.onclick = () => {
        if (gold < cost || weaponLevel >= WEAPON_MAX_LEVEL) return;
        gold -= cost;
        weaponLevel += 1;
        recomputePlayerStats();
        persist();
        renderEquipPanel();
        refreshHud();
      };
    }

    row.append(name, tier, lvSpan, btn);
    el.equipNodeList.appendChild(row);
  }

  function performRebirth() {
    if (!window.confirm("환골탈태를 진행하시겠습니까? 레벨/스테이지/무공/내공이 초기화되고 되돌릴 수 없습니다.")) return;
    rebirthCount += 1;
    level = 1;
    exp = 0;
    chi = 0;
    stage = { major: 1, sub: 1 };
    for (const key of Object.keys(gongLevels)) delete gongLevels[key];
    recomputePlayerStats();
    playerHp = player.hp;
    spawnEnemy();
    showToast(`환골탈태! ${realmName(rebirthCount)} 경지에 올랐다 (+전체 스탯 15%)`);
    persist();
    renderRebirthPanel();
    refreshHud();
  }

  function renderRebirthPanel() {
    el.rebirthBody.innerHTML = "";
    const gateMajor = rebirthGateMajor(rebirthCount);
    const eligible = highestMajorCleared >= gateMajor;

    const info = document.createElement("div");
    info.innerHTML =
      `현재 경지: <b>${realmName(rebirthCount)}</b> (${rebirthCount}회)<br>` +
      `영구 스탯 버프: +${rebirthBuffPercent(rebirthCount)}%<br>` +
      `다음 환골탈태 조건: 대${gateMajor} 보스 클리어 (현재 최고 클리어: 대${highestMajorCleared})<br>` +
      `초기화됨: 레벨/스테이지 진행도/무공 노드/소지 내공<br>` +
      `유지됨: 전(錢), 장구 강화 단계, 누적 환골탈태 횟수`;
    el.rebirthBody.appendChild(info);

    const btn = document.createElement("button");
    btn.className = "gong-upgrade-btn";
    btn.textContent = eligible ? "환골탈태 진행하기" : "조건 미충족";
    btn.disabled = !eligible;
    btn.onclick = performRebirth;
    el.rebirthBody.appendChild(btn);
  }

  function showGachaResults(results: PullResult[]) {
    el.gachaResult.innerHTML = "";
    let totalReward = 0;
    for (const r of results) {
      totalReward += r.reward;
      const card = document.createElement("div");
      card.className = "gacha-result-card";
      card.textContent = `${r.grade} +내공${r.reward}`;
      el.gachaResult.appendChild(card);
    }
    chi += totalReward;
  }

  function renderGachaPanel() {
    el.gachaBody.innerHTML = "";

    const info = document.createElement("div");
    info.innerHTML =
      `보유 영약: ${elixir.toLocaleString()}<br>` + `천장 진행: ${gachaPity}/${HARD_PITY} (선품 확정까지)`;
    el.gachaBody.appendChild(info);

    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.flexDirection = "column";
    btnGroup.style.gap = "8px";

    const btn1 = document.createElement("button");
    btn1.className = "gong-upgrade-btn";
    btn1.textContent = `1회 뽑기 (영약 ${PULL_COST})`;
    btn1.disabled = elixir < PULL_COST;
    btn1.onclick = () => {
      if (elixir < PULL_COST) return;
      elixir -= PULL_COST;
      const { result, nextPity } = pullSingle(gachaPity);
      gachaPity = nextPity;
      showGachaResults([result]);
      persist();
      renderGachaPanel();
      refreshHud();
    };

    const btn10 = document.createElement("button");
    btn10.className = "gong-upgrade-btn";
    btn10.textContent = `10회 뽑기 (영약 ${PULL_10_COST})`;
    btn10.disabled = elixir < PULL_10_COST;
    btn10.onclick = () => {
      if (elixir < PULL_10_COST) return;
      elixir -= PULL_10_COST;
      const { results, nextPity } = pullTen(gachaPity);
      gachaPity = nextPity;
      showGachaResults(results);
      persist();
      renderGachaPanel();
      refreshHud();
    };

    btnGroup.append(btn1, btn10);
    el.gachaBody.appendChild(btnGroup);
  }

  el.gongToggleBtn.onclick = () => {
    el.gongPanel.hidden = !el.gongPanel.hidden;
    if (!el.gongPanel.hidden) renderGongPanel();
  };
  el.gongCloseBtn.onclick = () => {
    el.gongPanel.hidden = true;
  };
  el.equipToggleBtn.onclick = () => {
    el.equipPanel.hidden = !el.equipPanel.hidden;
    if (!el.equipPanel.hidden) renderEquipPanel();
  };
  el.equipCloseBtn.onclick = () => {
    el.equipPanel.hidden = true;
  };
  el.rebirthToggleBtn.onclick = () => {
    el.rebirthPanel.hidden = !el.rebirthPanel.hidden;
    if (!el.rebirthPanel.hidden) renderRebirthPanel();
  };
  el.rebirthCloseBtn.onclick = () => {
    el.rebirthPanel.hidden = true;
  };
  el.sectToggleBtn.onclick = () => {
    el.sectPanel.hidden = !el.sectPanel.hidden;
    if (!el.sectPanel.hidden) renderSectPanel();
  };
  el.sectCloseBtn.onclick = () => {
    el.sectPanel.hidden = true;
  };
  el.gachaToggleBtn.onclick = () => {
    el.gachaPanel.hidden = !el.gachaPanel.hidden;
    if (!el.gachaPanel.hidden) {
      el.gachaResult.innerHTML = "";
      renderGachaPanel();
    }
  };
  el.gachaCloseBtn.onclick = () => {
    el.gachaPanel.hidden = true;
  };

  claimDailyBonusIfNeeded();

  function refreshHud() {
    el.stage.textContent = stageLabel(stage) + (isBossStage(stage) ? " (보스)" : "");
    el.gold.textContent = `전 ${gold.toLocaleString()}`;
    el.chi.textContent = `내공 ${chi.toLocaleString()}`;
    el.elixir.textContent = `영약 ${elixir.toLocaleString()}`;
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
    if (isBossStage(stage) && stage.major > highestMajorCleared) {
      highestMajorCleared = stage.major;
      elixir += BOSS_FIRST_CLEAR_ELIXIR;
    }
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

    const { amount: dmg, isCrit } = rollPlayerDamage(player.atk, enemy.def);
    enemyHp -= dmg;
    enemyFlashMs = HIT_FLASH_MS;
    spawnPopup(ENEMY_X, ENEMY_Y - 70, isCrit ? `치명타! -${dmg}` : `-${dmg}`, isCrit ? "#ff9800" : "#ffe27a");
    if (enemyHp <= 0) onVictory();
  }

  function enemyAttack() {
    if (enemyHp <= 0) return;
    const dmg = damage(enemy.atk, player.def);
    playerHp -= dmg;
    playerFlashMs = HIT_FLASH_MS;
    spawnPopup(PLAYER_X, PLAYER_Y - 110, `-${dmg}`, "#ff6b6b");
    if (playerHp <= 0) onDefeat();
  }

  function drawEnemyPlaceholder() {
    const boxSize = isBossStage(stage) ? 90 : 60;
    ctx.fillStyle = enemyFlashMs > 0 ? "#ffffff" : isBossStage(stage) ? "#7a2fb0" : "#b03a3a";
    ctx.fillRect(ENEMY_X - boxSize / 2, ENEMY_Y - boxSize, boxSize, boxSize);
  }

  function drawPlayerFlash() {
    if (playerFlashMs <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.5 * (playerFlashMs / HIT_FLASH_MS);
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(PLAYER_X - 40, PLAYER_Y - 130, 80, 130);
    ctx.restore();
  }

  function drawPopups() {
    for (const p of popups) {
      const t = p.age / POPUP_LIFETIME_MS;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = p.color;
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y - t * 40);
      ctx.restore();
    }
  }

  refreshHud();
  let lastTime = performance.now();

  function frame(time: number) {
    const deltaMs = Math.min(100, time - lastTime);
    lastTime = time;

    if (!paused) {
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

      enemyFlashMs = Math.max(0, enemyFlashMs - deltaMs);
      playerFlashMs = Math.max(0, playerFlashMs - deltaMs);
      for (const p of popups) p.age += deltaMs;
      while (popups.length && popups[0].age >= POPUP_LIFETIME_MS) popups.shift();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#242430";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#141419";
    ctx.fillRect(0, 400, canvas.width, canvas.height - 400);

    (isAttacking ? attackAnim : idleAnim).draw(ctx, PLAYER_X, PLAYER_Y, 3, false);
    drawPlayerFlash();
    drawEnemyPlaceholder();
    drawPopups();

    refreshHud();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
