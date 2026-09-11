// wiki/raw/assets/데미지 폰트.png(디자인-프롬프트-큐.md "데미지 숫자 폰트 스타일" 산출물)에서
// 자릿수 10개+마이너스 기호(일반/치명타 2색)와 "치명타!" 문구를 잘라내 만든 비트맵 숫자 폰트.
// PIXI.Text(시스템 폰트) 대신 이 스프라이트들을 가로로 이어붙여 데미지 숫자를 렌더링한다.
import { Assets, Container, Sprite, Texture, Rectangle } from "pixi.js";

interface GlyphFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DamageFontSheet {
  frames: Record<string, GlyphFrame>;
}

export type DamageFontVariant = "normal" | "crit";

const DIGIT_SCALE = 0.2;
const CRIT_LABEL_SCALE = 0.16;
const GLYPH_GAP = 2;

const CHAR_KEY: Record<string, string> = { "-": "minus" };

let digitsBase: Texture | null = null;
let digitsSheet: DamageFontSheet | null = null;
let criticalLabelTexture: Texture | null = null;

export async function loadDamageFont(): Promise<void> {
  const [base, sheet, label] = await Promise.all([
    Assets.load<Texture>("/fonts/damage-digits.png"),
    fetch("/fonts/damage-digits.json").then((r) => r.json() as Promise<DamageFontSheet>),
    Assets.load<Texture>("/fonts/critical-label.png"),
  ]);
  digitsBase = base;
  digitsSheet = sheet;
  criticalLabelTexture = label;
}

function glyphTexture(ch: string, variant: DamageFontVariant): Texture | null {
  if (!digitsBase || !digitsSheet) return null;
  const key = `${variant}_${CHAR_KEY[ch] ?? ch}`;
  const frame = digitsSheet.frames[key];
  if (!frame) return null;
  return new Texture({ source: digitsBase.source, frame: new Rectangle(frame.x, frame.y, frame.w, frame.h) });
}

// 숫자(및 '-') 문자열을 글리프 스프라이트를 이어붙인 Container로 만든다. 폰트 로딩 전이거나
// 알 수 없는 문자가 섞이면 null을 반환 — 호출부는 이 경우 기존 텍스트 렌더링으로 대체한다.
export function createDamageNumber(text: string, variant: DamageFontVariant = "normal"): Container | null {
  if (!digitsBase || !digitsSheet) return null;
  const container = new Container();
  let xCursor = 0;
  for (const ch of text) {
    const tex = glyphTexture(ch, variant);
    if (!tex) return null;
    const sprite = new Sprite(tex);
    sprite.scale.set(DIGIT_SCALE);
    sprite.position.set(xCursor, 0);
    container.addChild(sprite);
    xCursor += sprite.width + GLYPH_GAP;
  }
  container.pivot.set(xCursor / 2, container.height / 2);
  return container;
}

export function createCriticalLabel(): Sprite | null {
  if (!criticalLabelTexture) return null;
  const sprite = new Sprite(criticalLabelTexture);
  sprite.anchor.set(0.5);
  sprite.scale.set(CRIT_LABEL_SCALE);
  return sprite;
}
