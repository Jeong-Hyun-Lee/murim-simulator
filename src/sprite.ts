// Aseprite json-array 스프라이트시트(mokhyeon-idle-sheet.json 등) 로더 + 프레임 애니메이터.

interface AsepriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  duration: number;
}

interface AsepriteSheet {
  frames: AsepriteFrame[];
  meta: { image: string; frameTags: { name: string; from: number; to: number }[] };
}

export class SpriteAnimation {
  private image: HTMLImageElement;
  private frames: AsepriteFrame[];
  private elapsedMs = 0;
  private frameIndex = 0;

  private constructor(image: HTMLImageElement, frames: AsepriteFrame[]) {
    this.image = image;
    this.frames = frames;
  }

  static async load(jsonUrl: string, tagName: string): Promise<SpriteAnimation> {
    const sheet: AsepriteSheet = await fetch(jsonUrl).then((res) => res.json());
    const tag = sheet.meta.frameTags.find((t) => t.name === tagName);
    if (!tag) throw new Error(`sprite tag not found: ${tagName} in ${jsonUrl}`);
    const frames = sheet.frames.slice(tag.from, tag.to + 1);

    const imageUrl = new URL(sheet.meta.image, new URL(jsonUrl, window.location.href)).toString();
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    return new SpriteAnimation(image, frames);
  }

  reset() {
    this.elapsedMs = 0;
    this.frameIndex = 0;
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs;
    let frame = this.frames[this.frameIndex];
    while (this.elapsedMs >= frame.duration) {
      this.elapsedMs -= frame.duration;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      frame = this.frames[this.frameIndex];
    }
  }

  get totalDurationMs(): number {
    return this.frames.reduce((sum, f) => sum + f.duration, 0);
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, flip: boolean) {
    const f = this.frames[this.frameIndex].frame;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-scale, scale);
    else ctx.scale(scale, scale);
    ctx.drawImage(this.image, f.x, f.y, f.w, f.h, -f.w / 2, -f.h, f.w, f.h);
    ctx.restore();
  }
}
