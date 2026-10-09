// 캐릭터 스프라이트 시트를 PIXI.AnimatedSprite로 로드.
import { AnimatedSprite, Assets, Spritesheet } from 'pixi.js';

interface PackedFrame {
  anchor?: { x: number; y: number };
  duration?: number;
}

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
