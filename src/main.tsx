import { createRoot } from 'react-dom/client';
import { App } from './App';
import { playClick } from './audio/sfx';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#root')!;
createRoot(root).render(<App />);

// 모든 버튼 클릭에 효과음 — 이벤트 위임으로 한 곳에서 처리(패널마다 onClick 수정 불필요).
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('button')) playClick();
});
