import { useEffect, useRef } from "react";
import { Application, Graphics, Text } from "pixi.js";
import { loadAnimatedSprite } from "./sprite";
import { useGameStore, isBossStage, type StageId } from "../game/store";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const PLAYER_X = 280;
const PLAYER_Y = 400;
const ENEMY_X = 700;
const ENEMY_Y = 340;
const PLAYER_SCALE = 3;
const HIT_FLASH_MS = 140;
const POPUP_LIFETIME_MS = 800;
const ATTACK_INTERVAL_MS = 1300;
const ENEMY_ATTACK_INTERVAL_MS = 1600;

interface DamagePopup {
  text: Text;
  baseY: number;
  age: number;
}

export function BattleCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let removeTicker: (() => void) | undefined;
    const app = new Application();

    (async () => {
      await app.init({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: 0x242430, antialias: false });
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }
      container.appendChild(app.canvas);

      const ground = new Graphics().rect(0, 400, CANVAS_WIDTH, CANVAS_HEIGHT - 400).fill(0x141419);
      app.stage.addChild(ground);

      const [idleAnim, attackAnim] = await Promise.all([
        loadAnimatedSprite("/sprites/character/mokhyeon-idle-sheet.json", "idle"),
        loadAnimatedSprite("/sprites/character/mokhyeon-attack-sheet.json", "attack"),
      ]);
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      for (const anim of [idleAnim, attackAnim]) {
        anim.position.set(PLAYER_X, PLAYER_Y);
        anim.scale.set(PLAYER_SCALE);
      }
      attackAnim.loop = false;
      attackAnim.visible = false;
      attackAnim.onComplete = () => {
        attackAnim.visible = false;
        idleAnim.visible = true;
        idleAnim.gotoAndPlay(0);
      };
      idleAnim.play();
      app.stage.addChild(idleAnim, attackAnim);

      const playerFlash = new Graphics().rect(PLAYER_X - 40, PLAYER_Y - 130, 80, 130).fill(0xff4444);
      playerFlash.alpha = 0;
      app.stage.addChild(playerFlash);

      const enemyBox = new Graphics();
      app.stage.addChild(enemyBox);

      const popups: DamagePopup[] = [];

      let attackClock = 0;
      let enemyAttackClock = 0;
      let playerFlashMs = 0;
      let enemyFlashMs = 0;

      function spawnPopup(x: number, y: number, msg: string, color: number) {
        const text = new Text({ text: msg, style: { fontSize: 22, fontWeight: "bold", fill: color } });
        text.anchor.set(0.5);
        text.position.set(x, y);
        app.stage.addChild(text);
        popups.push({ text, baseY: y, age: 0 });
      }

      function drawEnemyBox(stage: StageId) {
        const boxSize = isBossStage(stage) ? 90 : 60;
        const color = enemyFlashMs > 0 ? 0xffffff : isBossStage(stage) ? 0x7a2fb0 : 0xb03a3a;
        enemyBox.clear().rect(ENEMY_X - boxSize / 2, ENEMY_Y - boxSize, boxSize, boxSize).fill(color);
      }

      const onTick = () => {
        const deltaMs = app.ticker.deltaMS;
        const s = useGameStore.getState();

        if (!s.paused) {
          attackClock += deltaMs;
          enemyAttackClock += deltaMs;

          if (attackClock >= ATTACK_INTERVAL_MS) {
            attackClock = 0;
            const { dmg, isCrit } = s.playerAttack();
            enemyFlashMs = HIT_FLASH_MS;
            spawnPopup(ENEMY_X, ENEMY_Y - 70, isCrit ? `치명타! -${dmg}` : `-${dmg}`, isCrit ? 0xff9800 : 0xffe27a);
            idleAnim.visible = false;
            attackAnim.visible = true;
            attackAnim.gotoAndPlay(0);
          }
          if (enemyAttackClock >= ENEMY_ATTACK_INTERVAL_MS) {
            enemyAttackClock = 0;
            const result = s.enemyAttack();
            if (result) {
              playerFlashMs = HIT_FLASH_MS;
              spawnPopup(PLAYER_X, PLAYER_Y - 110, `-${result.dmg}`, 0xff6b6b);
            }
          }

          enemyFlashMs = Math.max(0, enemyFlashMs - deltaMs);
          playerFlashMs = Math.max(0, playerFlashMs - deltaMs);
          for (const p of popups) p.age += deltaMs;
          while (popups.length && popups[0].age >= POPUP_LIFETIME_MS) {
            popups.shift()!.text.destroy();
          }
        }

        playerFlash.alpha = 0.5 * (playerFlashMs / HIT_FLASH_MS);
        drawEnemyBox(s.stage);
        for (const p of popups) {
          const t = p.age / POPUP_LIFETIME_MS;
          p.text.alpha = 1 - t;
          p.text.position.y = p.baseY - t * 40;
        }
      };

      app.ticker.add(onTick);
      removeTicker = () => app.ticker.remove(onTick);
    })();

    return () => {
      disposed = true;
      removeTicker?.();
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} id="battle-canvas-mount" />;
}
