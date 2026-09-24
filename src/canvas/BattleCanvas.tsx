import { useEffect, useRef, useState } from 'react';
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
import { loadAnimatedSprite, loadPackedAnimatedSprite } from './sprite';
import { loadDamageFont, createDamageNumber, createCriticalLabel } from './damageFont';
import {
  loadNormalHitEffect,
  normalHitEffectFrames,
  loadCriticalHitEffect,
  criticalHitEffectFrames,
} from './hitEffect';
import {
  useGameStore,
  battleViewStage,
  isBossStage,
  enemyKind,
  type StageId,
  type EnemyKind,
} from '../game/store';
import { playHit, playCrit, playDefeat } from '../audio/sfx';

// 무공 메인 상단의 낮은 전투 무대(약 1.64:1). 원본 비율로 렌더링해 인물을 자르거나 늘리지 않는다.
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 390;
// 두 인물의 몸통 간 거리(340)는 기존 배치와 같게 유지해 공격 모션 범위가 겹치지 않게 한다.
const PLAYER_X = 150;
const ENEMY_X = 490;
// 혈랑채 배경(1280x780, 캔버스와 같은 비율)의 흙바닥 공터 안쪽에 발이 닿는 높이 비율.
const GROUND_RATIO = 0.8;
const GROUND_Y = Math.round(CANVAS_HEIGHT * GROUND_RATIO); // 플레이어·적 스프라이트가 같은 바닥선에 서도록 공유하는 좌표(앵커가 바닥-중앙이라 이 값이 곧 발 위치)
const PLAYER_Y = GROUND_Y;
const ENEMY_Y = GROUND_Y;
const HIT_BURST_LIFETIME_MS = 260;
const NORMAL_HIT_EFFECT_SCALE = 0.22;
const CRITICAL_HIT_EFFECT_SCALE = 0.16;
// 목현 v2는 920px 셀(신체 높이 약 527px)을 0.5배로 표시해 무대 목표 높이 약 256px에 맞춘다.
// 캔버스 렌더 배율 상한 2배에서 텍스처 1px이 화면 1px이 되는 크기라 해상도 낭비가 없다.
// 신규 두목도 공통 대형 셀을 사용하며, 모션별 확대·축소 없이 하나의 런타임 배율만 적용한다.
// 화면에서는 두 인물의 몸통 간 거리를 좁히되, 두목은 잡몹보다 조금 크게 유지한다.
const PLAYER_SCALE = 0.5;
const ENEMY_BOSS_SCALE = 0.58;
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
// 목현 attack1/attack2 모두 7번 프레임에서 칼 궤적이 처음 나온다 — 이 프레임에 피해를 넣는다.
const PLAYER_HIT_FRAME = 7;
// 혈랑채 적 공격 모션에서 무기가 닿는(칼 궤적·화살 발사) 프레임 — 이 프레임에 플레이어가 피해를 입는다.
const ENEMY_HIT_FRAMES: Record<EnemyKind, { attack1: number; attack2: number }> = {
  boss: { attack1: 9, attack2: 9 },
  grunt: { attack1: 2, attack2: 2 },
  archer: { attack1: 3, attack2: 2 },
  elite: { attack1: 2, attack2: 4 },
};
// 10프레임 쓰러짐(총 1080ms)이 마지막 정지 자세까지 보이도록 다음 전투를 잠깐 멈춘다.
const DEFEAT_PAUSE_MS = 1180;

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

// idle/공격/쓰러짐 에셋을 확보한 캐릭터만 선택 모션을 채운다 —
// 아직 idle/attack 2종뿐인 캐릭터는 옵셔널 필드를 비워두면 기존 2모션 그대로 동작.
interface AnimSet {
  idle: AnimatedSprite;
  attack1: AnimatedSprite;
  attack2?: AnimatedSprite;
  death?: AnimatedSprite;
}

const BACKGROUND_SLUGS = [
  'hyeollangchae',
  'black-market',
  'peng-clan-training-ground',
  'county-tournament-arena',
  'qingyun-night',
  'central-city-magistrate-courtyard',
  'mindscape',
  'righteous-alliance-frontline',
  'qingyun-main-sanctuary',
  'blood-sect-henan-branch',
];

// ponytail: 대11~30 배경은 아직 없어 대10 배경을 재사용, 원화가 나오면 슬러그만 추가.
const backgroundUrlForStage = (stage: StageId) => {
  const major = Math.min(stage.major, BACKGROUND_SLUGS.length);
  return `/backgrounds/stage${major}-${BACKGROUND_SLUGS[major - 1]}.webp`;
};

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
  // 로딩 실패 시 재시도 횟수를 바꿔 효과를 다시 실행한다.
  const [attempt, setAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let destroyed = false;
    let removeTicker: (() => void) | undefined;
    const app = new Application();

    const destroyApp = () => {
      if (destroyed) return;
      destroyed = true;
      try {
        app.destroy(true, { children: true });
      } catch {
        // 초기화 전에 실패해 렌더러가 없으면 정리할 것이 없다.
      }
    };

    const setup = async () => {
      // 렌더 버퍼를 기기 픽셀 배율에 맞춰 그리되 최대 2배로 제한 — 저사양 안드로이드(배율 1~1.5)는
      // 메모리를 아끼고, 배율 3인 아이폰·고급 안드로이드도 GPU 메모리 초과로 컨텍스트를 잃지 않게 한다.
      await app.init({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: 0x242430,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
      if (disposed) {
        destroyApp();
        return;
      }
      container.appendChild(app.canvas);

      // 대 단위 전투 배경 — 원화(wiki/raw/assets/*-battle-background-sd-*-candidate.png)를 렌더 배율
      // 2배 기준 1280x780으로 줄여 캔버스 비율에 맞춘 WebP. 캔버스에 꽉 채워 그린다.
      let backgroundUrl = backgroundUrlForStage(battleViewStage(useGameStore.getState()));
      const bgTexture = await Assets.load(backgroundUrl);
      let displayedBackgroundUrl = backgroundUrl;
      const background = new Sprite(bgTexture);
      background.width = CANVAS_WIDTH;
      background.height = CANVAS_HEIGHT;
      app.stage.addChild(background);
      if (disposed) {
        destroyApp();
        return;
      }

      // attack2/쓰러짐은 아직 일부 캐릭터만 에셋이 있음 — 파일이 없으면
      // null을 반환해 Promise.all 전체가 실패하지 않게 한다(에셋 없는 캐릭터는 기존 2모션 그대로).
      const tryLoadAnimatedSprite = async (jsonUrl: string, tagName: string) => {
        try {
          return await loadAnimatedSprite(jsonUrl, tagName);
        } catch {
          return null;
        }
      };

      // 시트 파일명 규칙(<접두>-<모션>-sheet.json)이 캐릭터마다 같아 한 번에 모션 세트를 읽는다.
      // idle/attack은 필수, 나머지는 에셋이 있는 캐릭터만 채워진다.
      const loadAnimSet = async (prefix: string): Promise<AnimSet> => {
        const base = `/sprites/character/${prefix}`;
        const [idle, attack1, attack2, death] = await Promise.all([
          loadAnimatedSprite(`${base}-idle-sheet.json`, 'idle'),
          loadAnimatedSprite(`${base}-attack-sheet.json`, 'attack'),
          tryLoadAnimatedSprite(`${base}-attack2-sheet.json`, 'attack2'),
          tryLoadAnimatedSprite(`${base}-death-sheet.json`, 'death'),
        ]);
        return {
          idle,
          attack1,
          attack2: attack2 ?? undefined,
          death: death ?? undefined,
        };
      };

      const loadPackedAnimSet = async (prefix: string): Promise<AnimSet> => {
        const jsonUrl = `/sprites/character/${prefix}-sheet.json`;
        const [idle, attack1, attack2, death] = await Promise.all([
          loadPackedAnimatedSprite(jsonUrl, 'idle'),
          loadPackedAnimatedSprite(jsonUrl, 'attack1'),
          loadPackedAnimatedSprite(jsonUrl, 'attack2'),
          loadPackedAnimatedSprite(jsonUrl, 'death'),
        ]);
        return { idle, attack1, attack2, death };
      };

      const [playerAnim, bossSet, gruntSet, archerSet, eliteSet] = await Promise.all([
        loadPackedAnimSet('mokhyeon-v10'),
        loadPackedAnimSet('hyeollangchae-boss-v3'),
        loadAnimSet('hyeollangchae-grunt'),
        loadAnimSet('hyeollangchae-archer'),
        loadAnimSet('hyeollangchae-elite'),
      ]);
      await Promise.all([loadDamageFont(), loadNormalHitEffect(), loadCriticalHitEffect()]);
      const normalHitFrames = normalHitEffectFrames();
      const criticalHitFrames = criticalHitEffectFrames();
      if (disposed) {
        destroyApp();
        return;
      }

      const idleAnim = playerAnim.idle;
      const attackAnim = playerAnim.attack1;
      const playerSprites = (): AnimatedSprite[] =>
        [playerAnim.idle, playerAnim.attack1, playerAnim.attack2, playerAnim.death].filter(
          (a): a is AnimatedSprite => a !== undefined,
        );

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

      // 쓰러짐은 리워드 연출 동안 마지막 프레임을 유지한다.
      const playPlayerOneShot = (sprite: AnimatedSprite | undefined) => {
        if (!sprite) return;
        const anim = sprite;
        for (const s of playerSprites()) stopAndHide(s);
        anim.visible = true;
        anim.gotoAndPlay(0);
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
        return [set.idle, set.attack1, set.attack2, set.death].filter(
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

      // 쓰러짐은 리워드 연출 동안 마지막 프레임을 유지한다.
      const playEnemyOneShot = (kind: EnemyKind, sprite: AnimatedSprite | undefined) => {
        if (!sprite) return;
        const anim = sprite;
        for (const s of enemySpritesOf(kind)) stopAndHide(s);
        anim.visible = true;
        anim.gotoAndPlay(0);
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

      const enemyHitFrames = new Map<AnimatedSprite, number>();
      for (const kind of ENEMY_KINDS) {
        const set = enemyAnimByKind[kind];
        enemyHitFrames.set(set.attack1, ENEMY_HIT_FRAMES[kind].attack1);
        if (set.attack2) enemyHitFrames.set(set.attack2, ENEMY_HIT_FRAMES[kind].attack2);
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
      // 휘두르는 프레임을 아직 지나지 않은 플레이어 공격 모션 — 그 프레임에서 피해를 적용한다.
      let pendingAttack: AnimatedSprite | null = null;
      let pendingEnemyAttack: AnimatedSprite | null = null;

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

        if (
          !s.paused &&
          !s.awaitingBossChallenge &&
          !s.awaitingBossReward &&
          !s.storyCutscene &&
          s.onboardingDone
        ) {
          if (defeatPauseMs > 0) {
            // 쓰러짐 연출이 끝날 때까지 전투를 멈춰두고, 끝나는 프레임에 다음 전투(스테이지 이동·HP
            // 회복)를 반영하면서 양쪽을 idle로 세운다 — 연출과 HP 바가 같은 시점에 바뀌도록.
            defeatPauseMs = Math.max(0, defeatPauseMs - deltaMs);
            if (defeatPauseMs === 0) {
              useGameStore.getState().startPendingEncounter();
              for (const sprite of playerSprites()) stopAndHide(sprite);
              returnPlayerToIdle();
              // 적 종류가 바뀌는 경우는 아래 스테이지 전환 처리가 새 적을 세우므로 여기선 건드리지 않는다.
              const nextKind = enemyKindForStage(battleViewStage(useGameStore.getState()));
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
          const resolvePlayerHit = () => {
            pendingAttack = null;
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
            if (currentEnemyKind !== 'none') {
              const set = enemyAnimByKind[currentEnemyKind];
              if (enemyDefeated) {
                pendingEnemyAttack = null;
                playEnemyOneShot(currentEnemyKind, set.death);
              }
            }
            // 보스 처치는 보상 팝업이 이미 화면을 멈추므로 별도 텀이 필요 없다.
            if (enemyDefeated && !useGameStore.getState().awaitingBossReward) {
              defeatPauseMs = DEFEAT_PAUSE_MS;
            }
          };
          if (defeatPauseMs === 0 && attackClock >= effectiveAttackInterval) {
            attackClock = 0;
            // 공격속도가 빨라 이전 모션이 휘두르기 전에 다음 공격이 오면 이전 피해를 먼저 넣는다.
            if (pendingAttack) resolvePlayerHit();
            if (defeatPauseMs === 0) {
              for (const sprite of playerSprites()) stopAndHide(sprite);
              const attack =
                playerAnim.attack2 && Math.random() < 0.5 ? playerAnim.attack2 : playerAnim.attack1;
              attack.visible = true;
              attack.gotoAndPlay(0);
              pendingAttack = attack;
            }
          }
          // 일시정지 등으로 모션이 먼저 끝나 버린 경우(playing=false)도 피해는 넣는다.
          if (
            pendingAttack &&
            (pendingAttack.currentFrame >= PLAYER_HIT_FRAME || !pendingAttack.playing)
          ) {
            resolvePlayerHit();
          }
          const resolveEnemyHit = () => {
            pendingEnemyAttack = null;
            // null이면 적이 이미 쓰러진 뒤라 피해가 없다.
            const result = s.enemyAttack();
            if (result?.evaded) {
              spawnPopup(PLAYER_X, PLAYER_Y - 110, '회피!', 0x8ad0ff);
            } else if (result) {
              playerFlashMs = HIT_FLASH_MS;
              spawnHitNumberPopup(PLAYER_X, PLAYER_Y - 110, result.dmg);
              spawnHitBurst(PLAYER_X, PLAYER_Y - 70, 0xff6b6b);
              if (result.playerDefeated) {
                playDefeat();
                pendingAttack = null;
                playPlayerOneShot(playerAnim.death);
                defeatPauseMs = DEFEAT_PAUSE_MS;
              }
            }
          };
          if (defeatPauseMs === 0 && enemyAttackClock >= ENEMY_ATTACK_INTERVAL_MS) {
            enemyAttackClock = 0;
            if (pendingEnemyAttack) resolveEnemyHit();
            // 스프라이트가 없는 적(대체 사각형)은 모션이 없어 바로 피해를 넣는다.
            if (currentEnemyKind === 'none') {
              if (defeatPauseMs === 0) resolveEnemyHit();
            } else if (defeatPauseMs === 0) {
              const set = enemyAnimByKind[currentEnemyKind];
              for (const sprite of enemySpritesOf(currentEnemyKind)) stopAndHide(sprite);
              const attack = set.attack2 && Math.random() < 0.5 ? set.attack2 : set.attack1;
              attack.visible = true;
              attack.gotoAndPlay(0);
              pendingEnemyAttack = attack;
            }
          }
          if (
            pendingEnemyAttack &&
            (pendingEnemyAttack.currentFrame >= (enemyHitFrames.get(pendingEnemyAttack) ?? 0) ||
              !pendingEnemyAttack.playing)
          ) {
            resolveEnemyHit();
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

        // 대가 바뀌면 새 배경을 읽어 교체하고, 표시하던 배경은 텍스처 메모리에서 내린다.
        // 읽는 동안에는 이전 배경을 그대로 두고, 그 사이 대가 또 바뀌면 늦게 온 결과는 버린다.
        const viewStage = battleViewStage(s);
        const nextBackgroundUrl = backgroundUrlForStage(viewStage);
        if (nextBackgroundUrl !== backgroundUrl) {
          backgroundUrl = nextBackgroundUrl;
          (async () => {
            try {
              const texture = await Assets.load(nextBackgroundUrl);
              if (disposed || backgroundUrl !== nextBackgroundUrl) return;
              const previousUrl = displayedBackgroundUrl;
              background.texture = texture;
              displayedBackgroundUrl = nextBackgroundUrl;
              if (previousUrl !== nextBackgroundUrl) await Assets.unload(previousUrl);
            } catch (err) {
              // 배경 하나를 못 읽어도 전투는 이전 배경으로 계속 진행한다.
              // eslint-disable-next-line no-console
              console.error('전투 배경 로딩 실패', err);
            }
          })();
        }

        const kind = enemyKindForStage(viewStage);
        if (kind !== currentEnemyKind) {
          pendingEnemyAttack = null;
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
            pendingAttack = null;
            for (const sprite of playerSprites()) stopAndHide(sprite);
            idleAnim.visible = true;
            idleAnim.gotoAndPlay(0);
          }
        }
        enemyBox.visible = kind === 'none';
        if (kind === 'none') {
          drawEnemyBox(viewStage);
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
    };

    (async () => {
      try {
        await setup();
      } catch (err) {
        if (disposed) return;
        // eslint-disable-next-line no-console
        console.error('전투 화면 로딩 실패', err);
        destroyApp();
        setLoadFailed(true);
      }
    })();

    return () => {
      disposed = true;
      removeTicker?.();
      destroyApp();
    };
  }, [attempt]);

  return (
    <>
      <div ref={containerRef} id="battle-canvas-mount" />
      {loadFailed && (
        <div className="battle-load-error" role="alert">
          <p>전투 화면을 불러오지 못해 전투가 멈춰 있습니다. 진행 상황은 그대로입니다.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setLoadFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            다시 시도
          </button>
        </div>
      )}
    </>
  );
};
