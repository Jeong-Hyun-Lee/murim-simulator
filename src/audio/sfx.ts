// 효과음 — 외부 음원 없이 Web Audio로 합성한 짧은 톤들(다크 무협 HUD 톤).
// ponytail: AudioContext는 사용자 제스처(클릭) 안에서 지연 생성 — 브라우저 자동재생 정책 대응.
import { useEffect, useState } from "react";

const SFX_ENABLED_KEY = "murim-simulator-sfx-enabled";

let ctx: AudioContext | null = null;
let enabled = localStorage.getItem(SFX_ENABLED_KEY) !== "false";

export function isSfxEnabled(): boolean {
  return enabled;
}

export function setSfxEnabled(value: boolean) {
  enabled = value;
  localStorage.setItem(SFX_ENABLED_KEY, String(value));
}

export function useSfxEnabled(): [boolean, () => void] {
  const [value, setValue] = useState(enabled);
  useEffect(() => setValue(enabled), []);
  return [
    value,
    () => {
      setSfxEnabled(!enabled);
      setValue(enabled);
    },
  ];
}

interface ToneSpec {
  type: OscillatorType;
  freqStart: number;
  freqEnd: number;
  duration: number; // 초
  gain?: number;
  delay?: number; // 초, 재생 시작 지연 (연속음 연출용)
}

function playTones(tones: ToneSpec[]) {
  if (!enabled) return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();

  for (const { type, freqStart, freqEnd, duration, gain = 0.15, delay = 0 } of tones) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);

    osc.type = type;
    const start = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freqStart, start);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, start + duration);

    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.start(start);
    osc.stop(start + duration);
  }
}

export function playClick() {
  playTones([{ type: "square", freqStart: 900, freqEnd: 220, duration: 0.07, gain: 0.15 }]);
}

export function playHit() {
  playTones([{ type: "triangle", freqStart: 500, freqEnd: 150, duration: 0.05, gain: 0.12 }]);
}

export function playCrit() {
  playTones([{ type: "sawtooth", freqStart: 1200, freqEnd: 300, duration: 0.09, gain: 0.18 }]);
}

export function playVictory() {
  playTones([
    { type: "sine", freqStart: 440, freqEnd: 660, duration: 0.1, gain: 0.14 },
    { type: "sine", freqStart: 660, freqEnd: 880, duration: 0.12, gain: 0.14, delay: 0.1 },
  ]);
}

export function playDefeat() {
  playTones([{ type: "sine", freqStart: 300, freqEnd: 120, duration: 0.25, gain: 0.12 }]);
}

export function playGachaReveal() {
  playTones([{ type: "triangle", freqStart: 600, freqEnd: 900, duration: 0.15, gain: 0.14 }]);
}

export function playEnhanceSuccess() {
  playTones([{ type: "sine", freqStart: 500, freqEnd: 1000, duration: 0.15, gain: 0.15 }]);
}

export function playEnhanceFail() {
  playTones([{ type: "sawtooth", freqStart: 400, freqEnd: 150, duration: 0.15, gain: 0.12 }]);
}
