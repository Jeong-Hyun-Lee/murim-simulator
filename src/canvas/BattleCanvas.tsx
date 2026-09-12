import { useEffect, useRef } from 'react';
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
  type AnimatedSprite,
} from 'pixi.js';
import { loadAnimatedSprite } from './sprite';
import { loadDamageFont, createDamageNumber, createCriticalLabel } from './damageFont';
import {
  loadNormalHitEffect,
  normalHitEffectFrames,
  loadCriticalHitEffect,
  criticalHitEffectFrames,
} from './hitEffect';
import { useGameStore, isBossStage, enemyKind, type StageId, type EnemyKind } from '../game/store';
import { playHit, playCrit, playVictory, playDefeat } from '../audio/sfx';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const PLAYER_X = 310;
const ENEMY_X = 650;
const GROUND_Y = 470; // 플레이어·적 스프라이트가 같은 바닥선에 서도록 공유하는 좌표(앵커가 바닥-중앙이라 이 값이 곧 발 위치)
const PLAYER_Y = GROUND_Y;
const ENEMY_Y = GROUND_Y;
const HIT_BURST_LIFETIME_MS = 260;
const NORMAL_HIT_EFFECT_SCALE = 0.22;
const CRITICAL_HIT_EFFECT_SCALE = 0.16;
// IMPLEMENTATION-SPEC.md 규격대로 재패킹(캐릭터별 idle 신체 높이 256px 정규화, 앵커 (0.5,0.875)).
// 신체 높이가 모든 캐릭터에서 256px로 통일됐으므로 화면 배율은 이 값 기준 목표 표시 높이로 역산했다.
// 화면에서는 두 인물의 몸통 간 거리를 좁히되, 두목은 잡몹보다 조금 크게 유지한다.
const PLAYER_SCALE = 0.92;
const ENEMY_BOSS_SCALE = 1.07;
const ENEMY_MOB_SCALE = 0.82;
const ENEMY_ELITE_SCALE = 0.92; // 정예산적은 졸개·궁수와 두목 사이 체급
const ENEMY_HIT_TINT = 0xff6666;
const HIT_FLASH_MS = 140;
const POPUP_LIFETIME_MS = 800;
const POPUP_HOLD_RATIO = 0.6; // 전체 수명의 앞 60%는 투명도 유지, 이후에만 페이드아웃
const POPUP_RISE_PX = 64; // 데미지 숫자가 사라지기까지 위로 이동하는 거리
const ATTACK_INTERVAL_MS = 1300;
const MIN_ATTACK_INTERVAL_MS = 300; // 장구 공격속도% 최대치에서도 공격이 순간이동처럼 보이지 않게 하는 하한
const ENEMY_ATTACK_INTERVAL_MS = 1600;
// 쓰러짐 모션(6프레임 x 120ms = 720ms)이 끝까지 보이도록 다음 전투를 잠깐 멈추는 시간.
const DEFEAT_PAUSE_MS = 900;

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

// 6모션(idle/공격1/공격2/피격/쓰러짐/승리) 에셋을 확보한 캐릭터만 attack2~victory를 채운다 —
// 아직 idle/attack 2종뿐인 캐릭터는 옵셔널 필드를 비워두면 기존 2모션 그대로 동작.
interface AnimSet {
  idle: AnimatedSprite;
  attack1: AnimatedSprite;
  attack2?: AnimatedSprite;
  hurt?: AnimatedSprite;
  death?: AnimatedSprite;
  victory?: AnimatedSprite;
}

// visible=false만으로는 재생 중이던 AnimatedSprite의 내부 타이머가 멈추지 않아, 이미 화면에서
// 숨긴 뒤에도 그 onComplete가 뒤늦게 발동해 idle을 다시 보이게 만든다(다른 모션과 겹쳐 보이는 원인).
// 숨길 때는 반드시 stop()도 같이 호출해 그 onComplete가 아예 발동하지 않게 한다.
const stopAndHide = (target: AnimatedSprite) => {
  const anim = target;
  anim.visible = false;
  anim.stop();
};

export const BattleCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let removeTicker: (() => void) | undefined;
    const app = new Application();

    (async () => {
      // 기본 해상도 FHD(1920x1080) — 논리 캔버스는 960x540(레이아웃/좌표 그대로 유지)지만
      // resolution:2로 실제 렌더 버퍼는 2배(FHD)로 그려 페인터리 아트가 흐려지지 않게 함.
      await app.init({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: 0x242430,
        antialias: true,
        resolution: 2,
        autoDensity: true,
      });
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }
      container.appendChild(app.canvas);

      // ponytail: 임시 배경 — wiki/raw/assets/배경-아트-02-혈랑채.svg를 그대로 래스터화한 자체 제작 플레이스홀더.
      // 실제 이미지 생성 AI 산출물로 교체 예정(디자인-프롬프트-큐.md "대1 스테이지 배경" 항목 참고).
      const bgTexture = await Assets.load('/backgrounds/stage1-hyeollangchae.png');
      const background = new Sprite(bgTexture);
      app.stage.addChild(background);
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      // 6모션 중 attack2/피격/쓰러짐/승리는 아직 일부 캐릭터만 에셋이 있음 — 파일이 없으면
      // null을 반환해 Promise.all 전체가 실패하지 않게 한다(에셋 없는 캐릭터는 기존 2모션 그대로).
      const tryLoadAnimatedSprite = async (jsonUrl: string, tagName: string) => {
        try {
          return await loadAnimatedSprite(jsonUrl, tagName);
        } catch {
          return null;
        }
      };

      // 시트 파일명 규칙(<접두>-<모션>-sheet.json)이 캐릭터마다 같아 한 번에 모션 세트를 읽는다.
      // idle/attack은 필수, 나머지는 에셋이 있는 캐릭터만 채워진다(궁수·정예산적은 승리 모션 없음).
      const loadAnimSet = async (prefix: string): Promise<AnimSet> => {
        const base = `/sprites/character/${prefix}`;
        const [idle, attack1, attack2, hurt, death, victory] = await Promise.all([
          loadAnimatedSprite(`${base}-idle-sheet.json`, 'idle'),
          loadAnimatedSprite(`${base}-attack-sheet.json`, 'attack'),
          tryLoadAnimatedSprite(`${base}-attack2-sheet.json`, 'attack2'),
          tryLoadAnimatedSprite(`${base}-hurt-sheet.json`, 'hurt'),
          tryLoadAnimatedSprite(`${base}-death-sheet.json`, 'death'),
          tryLoadAnimatedSprite(`${base}-victory-sheet.json`, 'victory'),
        ]);
        return {
          idle,
          attack1,
          attack2: attack2 ?? undefined,
          hurt: hurt ?? undefined,
          death: death ?? undefined,
          victory: victory ?? undefined,
        };
      };

      const [playerAnim, bossSet, gruntSet, archerSet, eliteSet] = await Promise.all([
        loadAnimSet('mokhyeon'),
        loadAnimSet('hyeollangchae-boss'),
        loadAnimSet('hyeollangchae-grunt'),
        loadAnimSet('hyeollangchae-archer'),
        loadAnimSet('hyeollangchae-elite'),
      ]);
      await Promise.all([loadDamageFont(), loadNormalHitEffect(), loadCriticalHitEffect()]);
      const normalHitFrames = normalHitEffectFrames();
      const criticalHitFrames = criticalHitEffectFrames();
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      const idleAnim = playerAnim.idle;
      const attackAnim = playerAnim.attack1;
      const playerSprites = (): AnimatedSprite[] =>
        [
          playerAnim.idle,
          playerAnim.attack1,
          playerAnim.attack2,
          playerAnim.hurt,
          playerAnim.death,
          playerAnim.victory,
        ].filter((a): a is AnimatedSprite => a !== undefined);

      for (const anim of playerSprites()) {
        anim.position.set(PLAYER_X, PLAYER_Y);
        anim.scale.set(PLAYER_SCALE);
      }
      for (const anim of playerSprites()) {
        if (anim !== idleAnim) {
          anim.loop = false;
          anim.visible = false;
        }
      }

      const returnPlayerToIdle = () => {
        idleAnim.visible = true;
        idleAnim.gotoAndPlay(0);
      };

      // hurt/승리는 재생 후 idle로 복귀('idle'), 쓰러짐은 리워드 연출 동안 마지막 프레임을 유지('hold').
      const playPlayerOneShot = (sprite: AnimatedSprite | undefined, onDone: 'idle' | 'hold') => {
        if (!sprite) return;
        const anim = sprite;
        for (const s of playerSprites()) stopAndHide(s);
        anim.visible = true;
        anim.gotoAndPlay(0);
        anim.onComplete = () => {
          if (onDone === 'idle') {
            stopAndHide(anim);
            returnPlayerToIdle();
          }
        };
      };

      attackAnim.onComplete = () => {
        stopAndHide(attackAnim);
        returnPlayerToIdle();
      };
      if (playerAnim.attack2) {
        const { attack2 } = playerAnim;
        attack2.onComplete = () => {
          stopAndHide(attack2);
          returnPlayerToIdle();
        };
      }
      idleAnim.play();
      app.stage.addChild(...playerSprites());

      const playerFlash = new Graphics()
        .rect(PLAYER_X - 40, PLAYER_Y - 130, 80, 130)
        .fill(0xff4444);
      playerFlash.alpha = 0;
      app.stage.addChild(playerFlash);

      // 혈랑채(스테이지 1) 전용 스프라이트. 그 외 스테이지는 아직 아트가 없어 enemyBox 플레이스홀더로 대체.
      type ActiveEnemyKind = EnemyKind | 'none';
      const ENEMY_KINDS = ['boss', 'grunt', 'archer', 'elite'] as const;
      const enemyAnimByKind: Record<EnemyKind, AnimSet> = {
        boss: bossSet,
        grunt: gruntSet,
        archer: archerSet,
        elite: eliteSet,
      };
      const enemyScaleByKind: Record<EnemyKind, number> = {
        boss: ENEMY_BOSS_SCALE,
        grunt: ENEMY_MOB_SCALE,
        archer: ENEMY_MOB_SCALE,
        elite: ENEMY_ELITE_SCALE,
      };
      // 재패킹한 혈랑채 원화는 모두 화면 왼쪽을 보므로 런타임 좌우 반전이 필요 없다.
      let currentEnemyKind: ActiveEnemyKind = 'none';

      const enemySpritesOf = (kind: EnemyKind): AnimatedSprite[] => {
        const set = enemyAnimByKind[kind];
        return [set.idle, set.attack1, set.attack2, set.hurt, set.death, set.victory].filter(
          (a): a is AnimatedSprite => a !== undefined,
        );
      };

      const hideAllEnemySprites = () => {
        for (const kind of ENEMY_KINDS) {
          for (const sprite of enemySpritesOf(kind)) stopAndHide(sprite);
        }
      };

      const returnToIdle = (kind: EnemyKind) => {
        if (currentEnemyKind !== kind) return;
        const { idle } = enemyAnimByKind[kind];
        idle.visible = true;
        idle.gotoAndPlay(0);
      };

      // hurt/승리는 재생 후 idle로 복귀('idle'), 쓰러짐은 리워드 연출 동안 마지막 프레임을 유지('hold').
      const playEnemyOneShot = (
        kind: EnemyKind,
        sprite: AnimatedSprite | undefined,
        onDone: 'idle' | 'hold',
      ) => {
        if (!sprite) return;
        const anim = sprite;
        for (const s of enemySpritesOf(kind)) stopAndHide(s);
        anim.visible = true;
        anim.gotoAndPlay(0);
        anim.onComplete = () => {
          if (onDone === 'idle') {
            stopAndHide(anim);
            returnToIdle(kind);
          }
        };
      };

      for (const kind of ENEMY_KINDS) {
        const set = enemyAnimByKind[kind];
        const scale = enemyScaleByKind[kind];
        for (const anim of enemySpritesOf(kind)) {
          anim.position.set(ENEMY_X, ENEMY_Y);
          anim.scale.set(scale);
          anim.visible = false;
          anim.loop = false;
        }
        set.idle.loop = true;
        set.idle.visible = false;
        // currentEnemyKind는 호출 시점(공격 애니메이션 종료 시)의 최신값을 읽어야 하는 의도적 참조 —
        // 클로저 생성 시점이 아니라 실제 재생 완료 시점의 활성 적 종류를 확인한다.
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        set.attack1.onComplete = () => {
          stopAndHide(set.attack1);
          returnToIdle(kind);
        };
        if (set.attack2) {
          const { attack2 } = set;
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          attack2.onComplete = () => {
            stopAndHide(attack2);
            returnToIdle(kind);
          };
        }
        app.stage.addChild(...enemySpritesOf(kind));
      }

      // 스테이지별 적 종류는 combat.ts가 단일 기준 — 이름(monsterStats)과 스프라이트가 같은 규칙을 쓴다.
      const enemyKindForStage = (stage: StageId): ActiveEnemyKind =>
        stage.major === 1 ? enemyKind(stage) : 'none';

      const activeEnemySprite = () => {
        if (currentEnemyKind === 'none') return null;
        return enemySpritesOf(currentEnemyKind).find((sprite) => sprite.visible) ?? null;
      };

      const enemyBox = new Graphics();
      app.stage.addChild(enemyBox);

      const popups: DamagePopup[] = [];
      const hitBursts: HitBurst[] = [];
      const framedHitEffects: FramedHitEffect[] = [];

      const spawnHitBurst = (x: number, y: number, color: number) => {
        const gfx = new Graphics().circle(0, 0, 10).fill(color);
        gfx.position.set(x, y);
        gfx.alpha = 0.85;
        app.stage.addChild(gfx);
        hitBursts.push({ gfx, age: 0 });
      };

      const spawnFramedHitEffect = (x: number, y: number, frames: Texture[], scale: number) => {
        const sprite = new Sprite(frames[0]);
        sprite.anchor.set(0.5);
        sprite.scale.set(scale);
        sprite.position.set(x, y);
        app.stage.addChild(sprite);
        framedHitEffects.push({ sprite, frames, age: 0 });
      };

      // wiki/raw/assets/일반 타격 이펙트.png 기반 3프레임(ignite/peak/fadeout)을 순서대로 재생.
      // 로딩 실패/미완료 시(이론상 발생 안 함) 기존 프로시저럴 원형 확산으로 대체.
      const spawnNormalHitEffect = (x: number, y: number) => {
        if (!normalHitFrames) {
          spawnHitBurst(x, y, 0xffe27a);
          return;
        }
        spawnFramedHitEffect(x, y, normalHitFrames, NORMAL_HIT_EFFECT_SCALE);
      };

      // wiki/raw/assets/크리티컬 히트 이펙트.png 기반 4프레임(ignite/peak/fade1/fade2)을 순서대로 재생.
      // 로딩 실패/미완료 시(이론상 발생 안 함) 기존 프로시저럴 원형 확산으로 대체.
      const spawnCriticalHitEffect = (x: number, y: number) => {
        if (!criticalHitFrames) {
          spawnHitBurst(x, y, 0xff9800);
          return;
        }
        spawnFramedHitEffect(x, y, criticalHitFrames, CRITICAL_HIT_EFFECT_SCALE);
      };

      let attackClock = 0;
      let enemyAttackClock = 0;
      let playerFlashMs = 0;
      let enemyFlashMs = 0;
      let defeatPauseMs = 0;

      const spawnPopup = (x: number, y: number, msg: string, color: number) => {
        const text = new Text({
          text: msg,
          style: { fontSize: 22, fontWeight: 'bold', fill: color },
        });
        text.anchor.set(0.5);
        text.position.set(x, y);
        app.stage.addChild(text);
        popups.push({ text, baseY: y, age: 0 });
      };

      // wiki/raw/assets/데미지 폰트.png 기반 비트맵 숫자 폰트로 플레이어의 공격 데미지를 표시.
      // 폰트 로딩 실패/미완료 시(이론상 발생 안 함, Promise.all로 이미 대기함) 기존 텍스트로 대체.
      const spawnDamageNumberPopup = (x: number, y: number, dmg: number, isCrit: boolean) => {
        const numberContainer = createDamageNumber(`-${dmg}`, isCrit ? 'crit' : 'normal');
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
      };

      // wiki/raw/assets/피격 데미지 폰트.png 기반 비트맵 숫자 폰트로 플레이어가 입는 피해를 표시.
      const spawnHitNumberPopup = (x: number, y: number, dmg: number) => {
        const numberContainer = createDamageNumber(`-${dmg}`, 'hit');
        if (!numberContainer) {
          spawnPopup(x, y, `-${dmg}`, 0xff6b6b);
          return;
        }
        numberContainer.position.set(x, y);
        app.stage.addChild(numberContainer);
        popups.push({ text: numberContainer, baseY: y, age: 0 });
      };

      const drawEnemyBox = (stage: StageId) => {
        const boxSize = isBossStage(stage) ? 90 : 60;
        let color = isBossStage(stage) ? 0x7a2fb0 : 0xb03a3a;
        if (enemyFlashMs > 0) color = 0xffffff;
        enemyBox
          .clear()
          .rect(ENEMY_X - boxSize / 2, ENEMY_Y - boxSize, boxSize, boxSize)
          .fill(color);
      };

      const onTick = () => {
        const deltaMs = app.ticker.deltaMS;
        const s = useGameStore.getState();

        if (!s.paused && !s.awaitingBossChallenge && !s.awaitingBossReward && s.onboardingDone) {
          if (defeatPauseMs > 0) {
            // 쓰러짐 연출이 끝날 때까지 전투를 멈춰두고, 끝나는 프레임에 다음 전투(스테이지 이동·HP
            // 회복)를 반영하면서 양쪽을 idle로 세운다 — 연출과 HP 바가 같은 시점에 바뀌도록.
            defeatPauseMs = Math.max(0, defeatPauseMs - deltaMs);
            if (defeatPauseMs === 0) {
              useGameStore.getState().startPendingEncounter();
              for (const sprite of playerSprites()) stopAndHide(sprite);
              returnPlayerToIdle();
              // 적 종류가 바뀌는 경우는 아래 스테이지 전환 처리가 새 적을 세우므로 여기선 건드리지 않는다.
              const nextKind = enemyKindForStage(useGameStore.getState().stage);
              if (currentEnemyKind !== 'none' && nextKind === currentEnemyKind) {
                for (const sprite of enemySpritesOf(currentEnemyKind)) stopAndHide(sprite);
                returnToIdle(currentEnemyKind);
              }
            }
          } else {
            attackClock += deltaMs;
            enemyAttackClock += deltaMs;
          }

          const effectiveAttackInterval = Math.max(
            MIN_ATTACK_INTERVAL_MS,
            ATTACK_INTERVAL_MS / (1 + s.player.attackSpeedPercent / 100),
          );
          if (defeatPauseMs === 0 && attackClock >= effectiveAttackInterval) {
            attackClock = 0;
            const { dmg, isCrit, enemyDefeated } = s.playerAttack();
            enemyFlashMs = HIT_FLASH_MS;
            spawnDamageNumberPopup(ENEMY_X, ENEMY_Y - 70, dmg, isCrit);
            if (isCrit) {
              spawnCriticalHitEffect(ENEMY_X, ENEMY_Y - 40);
              playCrit();
            } else {
              spawnNormalHitEffect(ENEMY_X, ENEMY_Y - 40);
              playHit();
            }
            if (enemyDefeated) playVictory();
            if (currentEnemyKind !== 'none') {
              const set = enemyAnimByKind[currentEnemyKind];
              if (enemyDefeated) {
                playEnemyOneShot(currentEnemyKind, set.death, 'hold');
              } else {
                playEnemyOneShot(currentEnemyKind, set.hurt, 'idle');
              }
            }
            // 보스 처치는 보상 팝업이 이미 화면을 멈추므로 별도 텀이 필요 없다.
            if (enemyDefeated && !useGameStore.getState().awaitingBossReward) {
              defeatPauseMs = DEFEAT_PAUSE_MS;
            }
            // 상대가 쓰러지면 승리 포즈를 잡은 채로 유지한다('hold') — 다음 전투가 시작될 때
            // (연출 종료·보스 보상 확인 후) idle로 되돌려지므로 포즈가 그대로 남지 않는다.
            if (enemyDefeated && playerAnim.victory) {
              playPlayerOneShot(playerAnim.victory, 'hold');
            } else {
              for (const sprite of playerSprites()) stopAndHide(sprite);
              const attack =
                playerAnim.attack2 && Math.random() < 0.5 ? playerAnim.attack2 : playerAnim.attack1;
              attack.visible = true;
              attack.gotoAndPlay(0);
            }
          }
          if (defeatPauseMs === 0 && enemyAttackClock >= ENEMY_ATTACK_INTERVAL_MS) {
            enemyAttackClock = 0;
            const result = s.enemyAttack();
            if (result?.evaded) {
              spawnPopup(PLAYER_X, PLAYER_Y - 110, '회피!', 0x8ad0ff);
            } else if (result) {
              playerFlashMs = HIT_FLASH_MS;
              spawnHitNumberPopup(PLAYER_X, PLAYER_Y - 110, result.dmg);
              spawnHitBurst(PLAYER_X, PLAYER_Y - 70, 0xff6b6b);
              if (result.playerDefeated) {
                playDefeat();
                playPlayerOneShot(playerAnim.death, 'hold');
                defeatPauseMs = DEFEAT_PAUSE_MS;
              } else {
                playPlayerOneShot(playerAnim.hurt, 'idle');
              }
            }
            // result가 null이면 적이 이미 쓰러진 프레임이라 공격 모션을 재생하면 안 된다.
            if (currentEnemyKind !== 'none' && result) {
              const set = enemyAnimByKind[currentEnemyKind];
              if (result.playerDefeated && set.victory) {
                playEnemyOneShot(currentEnemyKind, set.victory, 'hold');
              } else {
                for (const sprite of enemySpritesOf(currentEnemyKind)) stopAndHide(sprite);
                const attack = set.attack2 && Math.random() < 0.5 ? set.attack2 : set.attack1;
                attack.visible = true;
                attack.gotoAndPlay(0);
              }
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
          hideAllEnemySprites();
          currentEnemyKind = kind;
          if (kind !== 'none') {
            const { idle } = enemyAnimByKind[kind];
            idle.visible = true;
            idle.gotoAndPlay(0);
          }
          // 전투 대상이 바뀔 때 플레이어도 idle로 초기화 — 단 쓰러짐 연출 중이면 그 자세를
          // 유지하고(패배 후퇴로 적이 바뀌는 경우) 연출이 끝날 때 idle로 되돌린다.
          if (defeatPauseMs === 0) {
            for (const sprite of playerSprites()) stopAndHide(sprite);
            idleAnim.visible = true;
            idleAnim.gotoAndPlay(0);
          }
        }
        enemyBox.visible = kind === 'none';
        if (kind === 'none') {
          drawEnemyBox(s.stage);
        } else {
          const sprite = activeEnemySprite();
          if (sprite) sprite.tint = enemyFlashMs > 0 ? ENEMY_HIT_TINT : 0xffffff;
        }

        for (const p of popups) {
          const t = p.age / POPUP_LIFETIME_MS;
          const fadeT = Math.max(0, (t - POPUP_HOLD_RATIO) / (1 - POPUP_HOLD_RATIO));
          p.text.alpha = 1 - fadeT;
          p.text.position.y = p.baseY - t * POPUP_RISE_PX;
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

      // 연출 대기 중에 캔버스가 다시 마운트되면(핫리로드 등) 연출 타이머가 사라져 예약이 영영
      // 반영되지 않는다 — 시작 시 남아 있는 예약을 먼저 적용해 0 HP로 멈춘 상태를 방지.
      useGameStore.getState().startPendingEncounter();

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
};
