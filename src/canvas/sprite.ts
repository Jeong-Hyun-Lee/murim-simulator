// Aseprite json-array 스프라이트시트(mokhyeon-idle-sheet.json 등)를 PIXI.AnimatedSprite로 로드.
import { AnimatedSprite, Assets, Rectangle, Texture } from "pixi.js";

interface AsepriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  duration: number;
}

interface AsepriteSheet {
  frames: AsepriteFrame[];
  meta: { image: string; frameTags: { name: string; from: number; to: number }[] };
}

export async function loadAnimatedSprite(jsonUrl: string, tagName: string): Promise<AnimatedSprite> {
  const sheet: AsepriteSheet = await fetch(jsonUrl).then((res) => res.json());
  const tag = sheet.meta.frameTags.find((t) => t.name === tagName);
  if (!tag) throw new Error(`sprite tag not found: ${tagName} in ${jsonUrl}`);
  const frames = sheet.frames.slice(tag.from, tag.to + 1);

  const imageUrl = new URL(sheet.meta.image, new URL(jsonUrl, window.location.href)).toString();
  const baseTexture = await Assets.load<Texture>(imageUrl);

  const textures = frames.map((f) => ({
    texture: new Texture({ source: baseTexture.source, frame: new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h) }),
    time: f.duration,
  }));

  const sprite = new AnimatedSprite(textures);
  sprite.anchor.set(0.5, 1);
  return sprite;
}
