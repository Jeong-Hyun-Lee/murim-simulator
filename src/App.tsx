import { useEffect, useState } from 'react';
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

export const App = () => {
  const claimDailyBonusIfNeeded = useGameStore((s) => s.claimDailyBonusIfNeeded);
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  useEffect(() => {
    claimDailyBonusIfNeeded();
  }, [claimDailyBonusIfNeeded]);

  // wiki/concepts/ux-시나리오-기획서.md 4장 5단계: 첫 성장보드 강제 개방.
  useEffect(() => {
    if (onboardingDone && !tutorialGongDone) setOpenPanel('gong');
  }, [onboardingDone, tutorialGongDone]);

  const togglePanel = (key: PanelKey) => {
    setOpenPanel((cur) => (cur === key ? null : key));
  };

  return (
    <div id="game-viewport">
      <div id="game-root">
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
