// 연마 버튼 길게 누르기 연속 실행. 짧은 탭은 click으로 1회만 실행하고, 누른 채 HOLD_DELAY_MS가
// 지나면 반복한다. 모바일에서 목록 스크롤과 겹치지 않도록 누른 즉시 실행하지 않으며, 손가락이
// 움직이거나 브라우저가 스크롤을 시작(pointercancel)하면 반복을 시작하지 않는다.
import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

const HOLD_DELAY_MS = 400;
const REPEAT_MS = 60;
const MOVE_TOLERANCE_PX = 10;

export const useHoldRepeat = (action: () => void, disabled: boolean) => {
  const actionRef = useRef(action);
  const timer = useRef<number | undefined>(undefined);
  const interval = useRef<number | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);
  // 반복이 한 번이라도 돌았으면 손을 뗄 때 따라오는 click은 무시(1회 추가 실행 방지).
  const repeated = useRef(false);

  useEffect(() => {
    actionRef.current = action;
  });

  const stop = () => {
    window.clearTimeout(timer.current);
    window.clearInterval(interval.current);
    timer.current = undefined;
    interval.current = undefined;
    origin.current = null;
  };

  useEffect(() => stop, []);
  // 재화가 떨어지거나 대성에 도달하면 즉시 멈춘다.
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled || e.button !== 0) return;
      stop();
      repeated.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        repeated.current = true;
        actionRef.current();
        interval.current = window.setInterval(() => actionRef.current(), REPEAT_MS);
      }, HOLD_DELAY_MS);
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      if (!origin.current) return;
      const moved = Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y);
      if (moved > MOVE_TOLERANCE_PX) stop();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // detail 0 = 키보드 실행 — 포인터 반복 여부와 무관하게 1회 실행.
      if (repeated.current && e.detail !== 0) {
        repeated.current = false;
        return;
      }
      if (!disabled) actionRef.current();
    },
    // 모바일 길게 누르기 시 뜨는 컨텍스트 메뉴 차단.
    onContextMenu: (e: MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  };
};
