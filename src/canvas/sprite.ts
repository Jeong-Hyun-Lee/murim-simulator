// Aseprite json-array 스프라이트시트(mokhyeon-idle-sheet.json 등)를 PIXI.AnimatedSprite로 로드.
import { AnimatedSprite, Assets, Rectangle, Texture } from 'pixi.js';

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
