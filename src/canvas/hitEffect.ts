// 타격 이펙트 스프라이트시트 로더. 각 시트는 폭발 진행 단계를 잘라 붙인 필름스트립이며,
// BattleCanvas가 프레임을 순서대로 재생해 기존 프로시저럴 원형 확산을 대체한다.
// - normal: wiki/raw/assets/일반 타격 이펙트.png(디자인-프롬프트-큐.md "일반 타격 이펙트" 산출물, ignite/peak/fadeout 3단계)
// - critical: wiki/raw/assets/크리티컬 히트 이펙트.png(디자인-프롬프트-큐.md "크리티컬 히트 이펙트" 산출물, ignite/peak/fade1/fade2 4단계)
import { Assets, Texture, Rectangle } from 'pixi.js';

interface EffectFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EffectSheet {
  frames: Record<string, EffectFrame>;
}

const NORMAL_FRAME_ORDER = ['ignite', 'peak', 'fadeout'] as const;
const CRITICAL_FRAME_ORDER = ['ignite', 'peak', 'fade1', 'fade2'] as const;

let normalBase: Texture | null = null;
let normalSheet: EffectSheet | null = null;
let criticalBase: Texture | null = null;
let criticalSheet: EffectSheet | null = null;

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  return res.json();
};

export const loadNormalHitEffect = async (): Promise<void> => {
  const [base, sheet] = await Promise.all([
    Assets.load<Texture>('/effects/hit-normal.png'),
    fetchJson<EffectSheet>('/effects/hit-normal.json'),
  ]);
  normalBase = base;
  normalSheet = sheet;
};

export const loadCriticalHitEffect = async (): Promise<void> => {
  const [base, sheet] = await Promise.all([
    Assets.load<Texture>('/effects/hit-critical.png'),
    fetchJson<EffectSheet>('/effects/hit-critical.json'),
  ]);
  criticalBase = base;
  criticalSheet = sheet;
};

const sheetFrames = (
  base: Texture | null,
  sheet: EffectSheet | null,
  order: readonly string[],
): Texture[] | null => {
  if (!base || !sheet) return null;
  return order.map((name) => {
    const f = sheet.frames[name];
    return new Texture({ source: base.source, frame: new Rectangle(f.x, f.y, f.w, f.h) });
  });
};

// ignite→peak→fadeout 순서의 텍스처 3장을 반환. 로딩 전이면 null — 호출부는 이 경우
// 기존 프로시저럴 이펙트로 대체한다.
export const normalHitEffectFrames = (): Texture[] | null =>
  sheetFrames(normalBase, normalSheet, NORMAL_FRAME_ORDER);

// ignite→peak→fade1→fade2 순서의 텍스처 4장을 반환. 로딩 전이면 null — 호출부는 이 경우
// 기존 프로시저럴 이펙트로 대체한다.
export const criticalHitEffectFrames = (): Texture[] | null =>
  sheetFrames(criticalBase, criticalSheet, CRITICAL_FRAME_ORDER);
