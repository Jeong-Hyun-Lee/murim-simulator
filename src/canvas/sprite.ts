// Aseprite json-array 스프라이트시트(mokhyeon-idle-sheet.json 등)를 PIXI.AnimatedSprite로 로드.
import { AnimatedSprite, Assets, Rectangle, Spritesheet, Texture } from 'pixi.js';

interface AsepriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  // trim 내보내기 시트만 가진다: 잘린 프레임이 원래 셀(sourceSize)의 어디에 있었는지.
  spriteSourceSize?: { x: number; y: number; w: number; h: number };
  sourceSize?: { w: number; h: number };
  duration: number;
}

interface AsepriteSheet {
  frames: AsepriteFrame[];
  meta: {
    image: string;
    frameTags: { name: string; from: number; to: number }[];
    anchor?: { x: number; y: number };
  };
}

interface PackedFrame {
  anchor?: { x: number; y: number };
  duration?: number;
}

export const loadAnimatedSprite = async (
  jsonUrl: string,
  tagName: string,
): Promise<AnimatedSprite> => {
  const res = await fetch(jsonUrl);
  const sheet: AsepriteSheet = await res.json();
  const tag = sheet.meta.frameTags.find((t) => t.name === tagName);
  if (!tag) throw new Error(`sprite tag not found: ${tagName} in ${jsonUrl}`);
  const frames = sheet.frames.slice(tag.from, tag.to + 1);

  const imageUrl = new URL(sheet.meta.image, new URL(jsonUrl, window.location.href)).toString();
  const baseTexture = await Assets.load<Texture>(imageUrl);

  const textures = frames.map((f) => ({
    texture: new Texture({
      source: baseTexture.source,
      frame: new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h),
      // 잘린 프레임을 원래 셀 크기·위치로 복원해 anchor가 프레임마다 같은 루트를 가리키게 한다.
      ...(f.sourceSize &&
        f.spriteSourceSize && {
          orig: new Rectangle(0, 0, f.sourceSize.w, f.sourceSize.h),
          trim: new Rectangle(f.spriteSourceSize.x, f.spriteSourceSize.y, f.frame.w, f.frame.h),
        }),
    }),
    time: f.duration,
  }));

  const sprite = new AnimatedSprite(textures);
  // 신규 시트는 캐릭터별 루트 축을 JSON에 기록한다. 기존 시트는 중앙 하단 앵커를 유지한다.
  sprite.anchor.set(sheet.meta.anchor?.x ?? 0.5, sheet.meta.anchor?.y ?? 0.875);
  return sprite;
};

// PixiJS hash 형식(한 PNG + animations 사전) 시트를 그대로 파싱한다.
// 목현 v4처럼 한 캐릭터의 모든 모션이 하나의 시트에 들어간 에셋에 사용한다.
export const loadPackedAnimatedSprite = async (
  jsonUrl: string,
  animationName: string,
): Promise<AnimatedSprite> => {
  const sheet = await Assets.load<Spritesheet>(jsonUrl);
  const frameNames = sheet.data.animations?.[animationName];
  const textures = sheet.animations[animationName];
  if (!frameNames || !textures?.length) {
    throw new Error(`packed sprite animation not found: ${animationName} in ${jsonUrl}`);
  }
  const packedFrames = sheet.data.frames as Record<string, PackedFrame>;
  const frames = textures.map((texture, index) => ({
    texture,
    time: packedFrames[frameNames[index]].duration ?? 80,
  }));
  const { anchor } = packedFrames[frameNames[0]];
  const sprite = new AnimatedSprite(frames);
  sprite.anchor.set(anchor?.x ?? 0.5, anchor?.y ?? 0.875);
  return sprite;
};
