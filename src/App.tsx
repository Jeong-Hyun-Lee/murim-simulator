import { useEffect, useRef, useState } from 'react';
import { BattleCanvas } from './canvas/BattleCanvas';
import { TopBar } from './components/TopBar';
import { PlayerStatus } from './components/PlayerStatus';
import { EnemyStatus } from './components/EnemyStatus';
import { Toast } from './components/Toast';
import { GongPanel } from './components/panels/GongPanel';
import { GearPanel } from './components/panels/GearPanel';
import { RebirthPanel } from './components/panels/RebirthPanel';
import { SectPanel } from './components/panels/SectPanel';
import { ShopPanel } from './components/panels/ShopPanel';
import { StagePanel } from './components/panels/StagePanel';
import { StatPanel } from './components/panels/StatPanel';
import { BossDialog } from './components/BossDialog';
import { OnboardingFlow } from './components/OnboardingFlow';
import { useGameStore } from './game/store';

export type PanelKey = 'gong' | 'gear' | 'rebirth' | 'sect' | 'shop' | 'stage' | 'stat';

// #game-root의 내부 좌표 기준 논리 해상도(BattleCanvas.tsx의 CANVAS_WIDTH/HEIGHT와 동일 비율 16:9).
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

export const App = () => {
  const claimDailyBonusIfNeeded = useGameStore((s) => s.claimDailyBonusIfNeeded);
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const gameRootRef = useRef<HTMLDivElement>(null);

  // 뷰포트 크기에 맞춰 960x540 논리 레이아웃을 비율 유지한 채 꽉 채우는 배율 계산 —
  // 내부 좌표/CSS 수치는 그대로 두고 화면 출력 크기만 여러 해상도에 반응형으로 대응.
  useEffect(() => {
    const updateScale = () => {
      const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
      gameRootRef.current?.style.setProperty('--game-scale', String(scale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    claimDailyBonusIfNeeded();
  }, [claimDailyBonusIfNeeded]);

  // UX 기획 4장 5단계: 첫 성장보드 강제 개방.
  useEffect(() => {
    if (onboardingDone && !tutorialGongDone) setOpenPanel('gong');
  }, [onboardingDone, tutorialGongDone]);

  const togglePanel = (key: PanelKey) => {
    setOpenPanel((cur) => (cur === key ? null : key));
  };

  return (
    <div id="game-viewport">
      <div id="game-root" ref={gameRootRef}>
        <BattleCanvas />
        <div id="ui-overlay">
          <TopBar onTogglePanel={togglePanel} />
          <div id="status-row">
            <PlayerStatus />
            <EnemyStatus />
          </div>
          <Toast />
        </div>
        {openPanel === 'gong' && (
          <GongPanel onClose={() => setOpenPanel(null)} onNavigate={setOpenPanel} />
        )}
        {openPanel === 'gear' && (
          <GearPanel onClose={() => setOpenPanel(null)} onNavigate={setOpenPanel} />
        )}
        {openPanel === 'rebirth' && <RebirthPanel onClose={() => setOpenPanel(null)} />}
        {openPanel === 'sect' && <SectPanel onClose={() => setOpenPanel(null)} />}
        {openPanel === 'shop' && <ShopPanel onClose={() => setOpenPanel(null)} />}
        {openPanel === 'stage' && <StagePanel onClose={() => setOpenPanel(null)} />}
        {openPanel === 'stat' && <StatPanel onClose={() => setOpenPanel(null)} />}
        <BossDialog />
        {!onboardingDone && <OnboardingFlow />}
      </div>
    </div>
  );
};
