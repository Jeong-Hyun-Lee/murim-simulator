// 브라우저 뒤로 가기를 화면 레이어(확인창·시트·상세 화면·돌아가기)와 연결한다.
// 레이어가 열려 있는 동안 history 항목을 하나씩 유지하고, 뒤로 가면 가장 위 레이어만 닫는다.
// 레이어가 없는 탭 최상위에서는 브라우저 기본 이탈을 그대로 허용한다.
import { useEffect, useRef } from 'react';

interface Layer {
  close: () => void;
}

const stack: Layer[] = [];
let entries = 0; // 이 모듈이 쌓아 둔 history 항목 수
let pendingPops = 0; // 코드가 직접 되돌린 이동의 popstate는 무시

window.addEventListener('popstate', () => {
  if (pendingPops > 0) {
    pendingPops -= 1;
    return;
  }
  if (entries === 0) return;
  entries -= 1;
  stack.pop()?.close();
});

// 화면 버튼·Esc로 닫혀 남은 history 항목을 정리. 같은 렌더에서 레이어가 교체되는 경우
// (닫힘과 새 레이어 열림이 동시에 일어남) 항목을 재사용하도록 마이크로태스크로 미룬다.
const syncHistory = () => {
  const extra = entries - stack.length;
  if (extra <= 0) return;
  entries = stack.length;
  pendingPops += 1;
  window.history.go(-extra);
};

export const useBackLayer = (active: boolean, onBack: () => void) => {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!active) return undefined;
    const layer: Layer = { close: () => onBackRef.current() };
    stack.push(layer);
    if (entries < stack.length) {
      window.history.pushState({ backLayer: stack.length }, '');
      entries += 1;
    }
    return () => {
      const index = stack.indexOf(layer);
      if (index === -1) return; // 뒤로 가기로 이미 닫힌 레이어
      stack.splice(index, 1);
      queueMicrotask(syncHistory);
    };
  }, [active]);
};
