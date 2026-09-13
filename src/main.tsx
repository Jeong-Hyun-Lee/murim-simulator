import { createRoot } from 'react-dom/client';
import { App } from './App';
import { playClick } from './audio/sfx';
import './style.css';

// dvh 미지원 브라우저(iOS 15.4 미만·구형 안드로이드 웹뷰)는 100vh가 주소창 높이를 포함해 하단 탭이
// 가려진다 — 실제 보이는 높이를 CSS 변수로 넘긴다(style.css #app).
if (!CSS.supports('height', '100dvh')) {
  const syncAppHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };
  syncAppHeight();
  window.addEventListener('resize', syncAppHeight);
  window.visualViewport?.addEventListener('resize', syncAppHeight);
}

const root = document.querySelector<HTMLDivElement>('#root')!;
createRoot(root).render(<App />);

// 모든 버튼 클릭에 효과음 — 이벤트 위임으로 한 곳에서 처리(패널마다 onClick 수정 불필요).
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('button')) playClick();
});
