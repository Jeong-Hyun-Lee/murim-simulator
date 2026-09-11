import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { loadAnimatedSprite } from "./sprite";
import { loadDamageFont, createDamageNumber, createCriticalLabel } from "./damageFont";
import { loadNormalHitEffect, normalHitEffectFrames, loadCriticalHitEffect, criticalHitEffectFrames } from "./hitEffect";
import { useGameStore, isBossStage, type StageId } from "../game/store";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const PLAYER_X = 280;
const PLAYER_Y = 470;
const ENEMY_X = 700;
const ENEMY_Y = 410;
const HIT_BURST_LIFETIME_MS = 260;
const NORMAL_HIT_EFFECT_SCALE = 0.22;
const CRITICAL_HIT_EFFECT_SCALE = 0.16;
// 스프라이트시트가 64x64/96x64 표시 규격보다 4배 큰 캔버스로 제작돼 있어(저해상도 확대 시 흐려지는 것 방지) 배율을 그만큼 낮춘다.
const PLAYER_SCALE = 0.75;
const ENEMY_BOSS_SCALE = 0.75;
const ENEMY_MOB_SCALE = 0.55;
const ENEMY_HIT_TINT = 0xff6666;
const HIT_FLASH_MS = 140;
const POPUP_LIFETIME_MS = 800;
const POPUP_HOLD_RATIO = 0.6; // 전체 수명의 앞 60%는 투명도 유지, 이후에만 페이드아웃
const ATTACK_INTERVAL_MS = 1300;
const MIN_ATTACK_INTERVAL_MS = 300; // 장구 공격속도% 최대치에서도 공격이 순간이동처럼 보이지 않게 하는 하한
const ENEMY_ATTACK_INTERVAL_MS = 1600;

interface DamagePopup {
  text: Container;
  baseY: number;
  age: number;
}

interface HitBurst {
  gfx: Graphics;
  age: number;
}

interface FramedHitEffect {
  sprite: Sprite;
  frames: Texture[];
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

      // ponytail: 임시 배경 — wiki/raw/assets/배경-아트-02-혈랑채.svg를 그대로 래스터화한 자체 제작 플레이스홀더.
      // 실제 이미지 생성 AI 산출물로 교체 예정(디자인-프롬프트-큐.md "대1 스테이지 배경" 항목 참고).
      const bgTexture = await Assets.load("/backgrounds/stage1-hyeollangchae.png");
      const background = new Sprite(bgTexture);
      app.stage.addChild(background);
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      const [idleAnim, attackAnim, bossIdle, bossAttack, gruntIdle, gruntAttack] = await Promise.all([
        loadAnimatedSprite("/sprites/character/mokhyeon-idle-sheet.json", "idle"),
        loadAnimatedSprite("/sprites/character/mokhyeon-attack-sheet.json", "attack"),
        loadAnimatedSprite("/sprites/character/hyeollangchae-boss-idle-sheet.json", "idle"),
        loadAnimatedSprite("/sprites/character/hyeollangchae-boss-attack-sheet.json", "attack"),
        loadAnimatedSprite("/sprites/character/hyeollangchae-grunt-idle-sheet.json", "idle"),
        loadAnimatedSprite("/sprites/character/hyeollangchae-grunt-attack-sheet.json", "attack"),
        loadDamageFont(),
        loadNormalHitEffect(),
        loadCriticalHitEffect(),
      ]);
      const normalHitFrames = normalHitEffectFrames();
      const criticalHitFrames = criticalHitEffectFrames();
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

      // 혈랑채(스테이지 1) 전용 스프라이트. 그 외 스테이지는 아직 아트가 없어 enemyBox 플레이스홀더로 대체.
      type EnemyKind = "none" | "boss" | "grunt";
      const enemyIdleByKind = { boss: bossIdle, grunt: gruntIdle };
      const enemyAttackByKind = { boss: bossAttack, grunt: gruntAttack };
      const enemyScaleByKind = { boss: ENEMY_BOSS_SCALE, grunt: ENEMY_MOB_SCALE };
      let currentEnemyKind: EnemyKind = "none";

      for (const kind of ["boss", "grunt"] as const) {
        const idle = enemyIdleByKind[kind];
        const attack = enemyAttackByKind[kind];
        for (const anim of [idle, attack]) {
          anim.position.set(ENEMY_X, ENEMY_Y);
          const s = enemyScaleByKind[kind];
          anim.scale.set(-s, s); // 플레이어를 마주보도록 좌우 반전
          anim.visible = false;
        }
        attack.loop = false;
        attack.onComplete = () => {
          attack.visible = false;
          if (currentEnemyKind === kind) {
            idle.visible = true;
            idle.gotoAndPlay(0);
          }
        };
        app.stage.addChild(idle, attack);
      }

      function enemyKindForStage(stage: StageId): EnemyKind {
        if (stage.major !== 1) return "none";
        return isBossStage(stage) ? "boss" : "grunt";
      }

      function activeEnemySprite() {
        if (currentEnemyKind === "none") return null;
        const idle = enemyIdleByKind[currentEnemyKind];
        return idle.visible ? idle : enemyAttackByKind[currentEnemyKind];
      }

      const enemyBox = new Graphics();
      app.stage.addChild(enemyBox);

      const popups: DamagePopup[] = [];
      const hitBursts: HitBurst[] = [];
      const framedHitEffects: FramedHitEffect[] = [];

      function spawnHitBurst(x: number, y: number, color: number) {
        const gfx = new Graphics().circle(0, 0, 10).fill(color);
        gfx.position.set(x, y);
        gfx.alpha = 0.85;
        app.stage.addChild(gfx);
        hitBursts.push({ gfx, age: 0 });
      }

      function spawnFramedHitEffect(x: number, y: number, frames: Texture[], scale: number) {
        const sprite = new Sprite(frames[0]);
        sprite.anchor.set(0.5);
        sprite.scale.set(scale);
        sprite.position.set(x, y);
        app.stage.addChild(sprite);
        framedHitEffects.push({ sprite, frames, age: 0 });
      }

      // wiki/raw/assets/일반 타격 이펙트.png 기반 3프레임(ignite/peak/fadeout)을 순서대로 재생.
      // 로딩 실패/미완료 시(이론상 발생 안 함) 기존 프로시저럴 원형 확산으로 대체.
      function spawnNormalHitEffect(x: number, y: number) {
        if (!normalHitFrames) {
          spawnHitBurst(x, y, 0xffe27a);
          return;
        }
        spawnFramedHitEffect(x, y, normalHitFrames, NORMAL_HIT_EFFECT_SCALE);
      }

      // wiki/raw/assets/크리티컬 히트 이펙트.png 기반 4프레임(ignite/peak/fade1/fade2)을 순서대로 재생.
      // 로딩 실패/미완료 시(이론상 발생 안 함) 기존 프로시저럴 원형 확산으로 대체.
      function spawnCriticalHitEffect(x: number, y: number) {
        if (!criticalHitFrames) {
          spawnHitBurst(x, y, 0xff9800);
          return;
        }
        spawnFramedHitEffect(x, y, criticalHitFrames, CRITICAL_HIT_EFFECT_SCALE);
      }

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

      // wiki/raw/assets/데미지 폰트.png 기반 비트맵 숫자 폰트로 플레이어의 공격 데미지를 표시.
      // 폰트 로딩 실패/미완료 시(이론상 발생 안 함, Promise.all로 이미 대기함) 기존 텍스트로 대체.
      function spawnDamageNumberPopup(x: number, y: number, dmg: number, isCrit: boolean) {
        const numberContainer = createDamageNumber(`-${dmg}`, isCrit ? "crit" : "normal");
        if (!numberContainer) {
          spawnPopup(x, y, isCrit ? `치명타! -${dmg}` : `-${dmg}`, isCrit ? 0xff9800 : 0xffe27a);
          return;
        }
        const root = new Container();
        root.addChild(numberContainer);
        if (isCrit) {
          const label = createCriticalLabel();
          if (label) {
            label.position.set(0, -numberContainer.height / 2 - label.height / 2 - 4);
            root.addChild(label);
          }
        }
        root.position.set(x, y);
        app.stage.addChild(root);
        popups.push({ text: root, baseY: y, age: 0 });
      }

      // wiki/raw/assets/피격 데미지 폰트.png 기반 비트맵 숫자 폰트로 플레이어가 입는 피해를 표시.
      function spawnHitNumberPopup(x: number, y: number, dmg: number) {
        const numberContainer = createDamageNumber(`-${dmg}`, "hit");
        if (!numberContainer) {
          spawnPopup(x, y, `-${dmg}`, 0xff6b6b);
          return;
        }
        numberContainer.position.set(x, y);
        app.stage.addChild(numberContainer);
        popups.push({ text: numberContainer, baseY: y, age: 0 });
      }

      function drawEnemyBox(stage: StageId) {
        const boxSize = isBossStage(stage) ? 90 : 60;
        const color = enemyFlashMs > 0 ? 0xffffff : isBossStage(stage) ? 0x7a2fb0 : 0xb03a3a;
        enemyBox.clear().rect(ENEMY_X - boxSize / 2, ENEMY_Y - boxSize, boxSize, boxSize).fill(color);
      }

      const onTick = () => {
        const deltaMs = app.ticker.deltaMS;
        const s = useGameStore.getState();

        if (!s.paused && !s.awaitingBossChallenge && !s.awaitingBossReward && s.onboardingDone) {
          attackClock += deltaMs;
          enemyAttackClock += deltaMs;

          const effectiveAttackInterval = Math.max(
            MIN_ATTACK_INTERVAL_MS,
            ATTACK_INTERVAL_MS / (1 + s.player.attackSpeedPercent / 100),
          );
          if (attackClock >= effectiveAttackInterval) {
            attackClock = 0;
            const { dmg, isCrit } = s.playerAttack();
            enemyFlashMs = HIT_FLASH_MS;
            spawnDamageNumberPopup(ENEMY_X, ENEMY_Y - 70, dmg, isCrit);
            if (isCrit) {
              spawnCriticalHitEffect(ENEMY_X, ENEMY_Y - 40);
            } else {
              spawnNormalHitEffect(ENEMY_X, ENEMY_Y - 40);
            }
            idleAnim.visible = false;
            attackAnim.visible = true;
            attackAnim.gotoAndPlay(0);
          }
          if (enemyAttackClock >= ENEMY_ATTACK_INTERVAL_MS) {
            enemyAttackClock = 0;
            const result = s.enemyAttack();
            if (result?.evaded) {
              spawnPopup(PLAYER_X, PLAYER_Y - 110, "회피!", 0x8ad0ff);
            } else if (result) {
              playerFlashMs = HIT_FLASH_MS;
              spawnHitNumberPopup(PLAYER_X, PLAYER_Y - 110, result.dmg);
              spawnHitBurst(PLAYER_X, PLAYER_Y - 70, 0xff6b6b);
            }
            if (currentEnemyKind !== "none") {
              enemyIdleByKind[currentEnemyKind].visible = false;
              const attack = enemyAttackByKind[currentEnemyKind];
              attack.visible = true;
              attack.gotoAndPlay(0);
            }
          }

          enemyFlashMs = Math.max(0, enemyFlashMs - deltaMs);
          playerFlashMs = Math.max(0, playerFlashMs - deltaMs);
          for (const p of popups) p.age += deltaMs;
          while (popups.length && popups[0].age >= POPUP_LIFETIME_MS) {
            popups.shift()!.text.destroy();
          }
          for (const b of hitBursts) b.age += deltaMs;
          while (hitBursts.length && hitBursts[0].age >= HIT_BURST_LIFETIME_MS) {
            hitBursts.shift()!.gfx.destroy();
          }
          for (const e of framedHitEffects) e.age += deltaMs;
          while (framedHitEffects.length && framedHitEffects[0].age >= HIT_BURST_LIFETIME_MS) {
            framedHitEffects.shift()!.sprite.destroy();
          }
        }

        playerFlash.alpha = 0.5 * (playerFlashMs / HIT_FLASH_MS);

        const kind = enemyKindForStage(s.stage);
        if (kind !== currentEnemyKind) {
          for (const k of ["boss", "grunt"] as const) {
            enemyIdleByKind[k].visible = k === kind;
            enemyAttackByKind[k].visible = false;
          }
          if (kind !== "none") enemyIdleByKind[kind].gotoAndPlay(0);
          currentEnemyKind = kind;
        }
        enemyBox.visible = kind === "none";
        if (kind === "none") {
          drawEnemyBox(s.stage);
        } else {
          const sprite = activeEnemySprite();
          if (sprite) sprite.tint = enemyFlashMs > 0 ? ENEMY_HIT_TINT : 0xffffff;
        }

        for (const p of popups) {
          const t = p.age / POPUP_LIFETIME_MS;
          const fadeT = Math.max(0, (t - POPUP_HOLD_RATIO) / (1 - POPUP_HOLD_RATIO));
          p.text.alpha = 1 - fadeT;
          p.text.position.y = p.baseY - t * 40;
        }

        for (const b of hitBursts) {
          const t = b.age / HIT_BURST_LIFETIME_MS;
          b.gfx.scale.set(1 + t * 2.5);
          b.gfx.alpha = 0.85 * (1 - t);
        }

        for (const e of framedHitEffects) {
          const t = e.age / HIT_BURST_LIFETIME_MS;
          const lastIndex = e.frames.length - 1;
          const frameIndex = Math.min(lastIndex, Math.floor(t * e.frames.length));
          e.sprite.texture = e.frames[frameIndex];
          const frameStartT = frameIndex / e.frames.length;
          e.sprite.alpha = frameIndex === lastIndex ? 1 - (t - frameStartT) * e.frames.length : 1;
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
