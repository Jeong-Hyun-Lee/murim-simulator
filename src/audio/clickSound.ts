// 버튼 클릭 효과음 — 외부 음원 없이 Web Audio로 합성한 짧은 타격음(다크 무협 HUD 톤).
// ponytail: AudioContext는 사용자 제스처(클릭) 안에서 지연 생성 — 브라우저 자동재생 정책 대응.
let ctx: AudioContext | null = null;

export function playClickSound() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "square";
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.start(now);
  osc.stop(now + 0.07);
}
