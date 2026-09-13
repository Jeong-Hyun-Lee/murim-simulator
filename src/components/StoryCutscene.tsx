import { useState } from 'react';
import { useGameStore } from '../game/store';

// 챕터·특수 컷 — 온보딩 인트로와 같은 대사 카드. 표시 중에는 자동전투가 멈춘다(BattleCanvas).
export const StoryCutscene = ({ cards }: { cards: string[] }) => {
  const closeStoryCutscene = useGameStore((s) => s.closeStoryCutscene);
  const [index, setIndex] = useState(0);
  const last = index >= cards.length - 1;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="이야기">
      <div className="onboarding-box">
        <button type="button" className="onboarding-skip-btn" onClick={closeStoryCutscene}>
          건너뛰기
        </button>
        <p className="onboarding-text" aria-live="polite">
          {cards[index]}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={last ? closeStoryCutscene : () => setIndex((i) => i + 1)}
        >
          {last ? '계속하기' : '다음'}
        </button>
      </div>
    </div>
  );
};
