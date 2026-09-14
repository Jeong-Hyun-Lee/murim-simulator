import { useEffect } from 'react';
import { useGameStore } from '../game/store';

const TOAST_DURATION_MS = 2200;

export const Toast = () => {
  const toastMessage = useGameStore((s) => s.toastMessage);
  const showToast = useGameStore((s) => s.showToast);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const id = window.setTimeout(() => showToast(''), TOAST_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toastMessage, showToast]);

  // 처치마다 바뀌는 짧은 알림이라 화면 읽기 라이브 영역으로 두지 않는다(중요 상태는 요약줄이 전달).
  return (
    <div id="log-toast" hidden={!toastMessage}>
      <span className="toast-label">전황</span>
      <span>{toastMessage}</span>
    </div>
  );
};
