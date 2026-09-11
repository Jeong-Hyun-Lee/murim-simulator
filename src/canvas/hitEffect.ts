// wiki/raw/assets/일반 타격 이펙트.png(디자인-프롬프트-큐.md "일반 타격 이펙트" 산출물)에서
// ignite/peak/fadeout 3단계를 잘라낸 스프라이트시트. BattleCanvas의 일반 타격(비치명타) 이펙트가
// 기존 프로시저럴 원형 확산 대신 이 3프레임을 순서대로 재생한다.
import { Assets, Texture, Rectangle } from "pixi.js";

interface EffectFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EffectSheet {
  frames: Record<string, EffectFrame>;
}

const FRAME_ORDER = ["ignite", "peak", "fadeout"] as const;

let sheetBase: Texture | null = null;
let sheetData: EffectSheet | null = null;

export async function loadNormalHitEffect(): Promise<void> {
  const [base, sheet] = await Promise.all([
    Assets.load<Texture>("/effects/hit-normal.png"),
    fetch("/effects/hit-normal.json").then((r) => r.json() as Promise<EffectSheet>),
  ]);
  sheetBase = base;
  sheetData = sheet;
}

// ignite→peak→fadeout 순서의 텍스처 3장을 반환. 로딩 전이면 null — 호출부는 이 경우
// 기존 프로시저럴 이펙트로 대체한다.
export function normalHitEffectFrames(): Texture[] | null {
  if (!sheetBase || !sheetData) return null;
  return FRAME_ORDER.map((name) => {
    const f = sheetData!.frames[name];
    return new Texture({ source: sheetBase!.source, frame: new Rectangle(f.x, f.y, f.w, f.h) });
  });
}
