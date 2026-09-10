// 강화 버튼 꾹 누르기 연속 실행 — pointerdown 후 일정 시간 지나면 반복 트리거,
// pointerup/이탈/포커스아웃 시 정지. 동시에 눌릴 수 있는 버튼은 하나뿐이라 타이머는 모듈 전역 공유.
import type { PointerEvent } from "react";

const HOLD_INITIAL_DELAY_MS = 200;
const HOLD_REPEAT_MS = 40;

let holdTimer: number | undefined;
let holdInterval: number | undefined;

function stopHold() {
  window.clearTimeout(holdTimer);
  window.clearInterval(holdInterval);
  holdTimer = undefined;
  holdInterval = undefined;
}
window.addEventListener("pointerup", stopHold);
window.addEventListener("pointercancel", stopHold);
window.addEventListener("blur", stopHold);

export function useHoldRepeat(action: () => void, disabled: boolean) {
  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.preventDefault();
      stopHold();
      action();
      holdTimer = window.setTimeout(() => {
        holdInterval = window.setInterval(action, HOLD_REPEAT_MS);
      }, HOLD_INITIAL_DELAY_MS);
    },
  };
}
