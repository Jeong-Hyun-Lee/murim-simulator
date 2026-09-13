import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  AppHeader,
  BattleSummaryBar,
  CurrencySheet,
  FullView,
  LockedTabSheet,
  SettingsSheet,
  TabBar,
} from './components/AppChrome';
import { BattleTab } from './components/BattleTab';
import { Toast } from './components/Toast';
import { OnboardingFlow } from './components/OnboardingFlow';
import { GongPanel } from './components/panels/GongPanel';
import { GearPanel } from './components/panels/GearPanel';
import { SectPanel } from './components/panels/SectPanel';
import { ShopPanel } from './components/panels/ShopPanel';
import { StagePicker } from './components/panels/StagePicker';
import { MyInfoView } from './components/panels/MyInfoView';
import { RebirthView } from './components/panels/RebirthView';
import {
  TAB_LABEL,
  isViewKey,
  useTabLockReasons,
  type NavTarget,
  type TabKey,
  type ViewKey,
} from './components/common';
import { useGameStore, GONG_BOARDS } from './game/store';

type SheetKey = 'settings' | 'currency' | TabKey; // TabKey = 잠긴 탭 조건 안내

const VIEW_TITLE: Record<ViewKey, string> = {
  stagePicker: '사냥터',
  myInfo: '내 정보',
  rebirth: '환골탈태',
};

// 세로형·하단 5탭 모바일 틀. 모든 탭 화면을 계속 마운트해 두고 hidden으로만 전환한다 —
// 전투 진행이 BattleCanvas의 틱에 묶여 있어 탭 전환으로 캔버스가 제거되면 전투가 멈추기 때문이며,
// 보드 선택·필터 같은 화면 상태도 세션 동안 그대로 유지된다.
// ponytail: 숨겨진 전투 탭도 Pixi가 계속 렌더링함. 배터리 문제가 보이면 화면 밖일 때 렌더만 끄기.
export const App = () => {
  const claimDailyBonusIfNeeded = useGameStore((s) => s.claimDailyBonusIfNeeded);
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const lockReasons = useTabLockReasons();

  const [tab, setTab] = useState<TabKey>('battle');
  const [views, setViews] = useState<ViewKey[]>([]);
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [returnTab, setReturnTab] = useState<TabKey | null>(null);
  const [lastGrowthTab, setLastGrowthTab] = useState<TabKey>('gong');
  const [gongBoardId, setGongBoardId] = useState(GONG_BOARDS[0].id);
  const pageRefs = useRef<Partial<Record<TabKey, HTMLElement | null>>>({});
  const scrollTops = useRef<Partial<Record<TabKey, number>>>({});

  const tutorialActive = onboardingDone && !tutorialGongDone;
  const topView = views[views.length - 1];

  useEffect(() => {
    claimDailyBonusIfNeeded();
  }, [claimDailyBonusIfNeeded]);

  // 첫 성장 안내: 무공 탭을 강제로 연다.
  useEffect(() => {
    if (tutorialActive) {
      setTab('gong');
      setViews([]);
    }
  }, [tutorialActive]);

  // 탭별 스크롤 위치 복원(display:none 전환 시 브라우저가 스크롤을 잃는 경우 대비).
  useLayoutEffect(() => {
    const el = pageRefs.current[tab];
    if (el) el.scrollTop = scrollTops.current[tab] ?? 0;
  }, [tab]);

  const switchTab = (next: TabKey) => {
    scrollTops.current[tab] = pageRefs.current[tab]?.scrollTop ?? 0;
    setTab(next);
    setViews([]);
    if (next !== 'battle') setLastGrowthTab(next);
  };

  const selectTab = (next: TabKey) => {
    if (lockReasons[next]) {
      setSheet(next);
      return;
    }
    setReturnTab(null);
    switchTab(next);
  };

  // 화면 안 바로가기 — 다른 탭으로 건너가면 ‘돌아가기’로 출발 탭을 복원할 수 있게 기억한다.
  const navigate = (target: NavTarget) => {
    if (isViewKey(target)) {
      setViews((cur) => [...cur, target]);
      return;
    }
    if (lockReasons[target]) {
      setSheet(target);
      return;
    }
    if (target === tab) {
      setViews([]);
      return;
    }
    // 전투 탭 복귀는 요약줄이 이미 제공하므로 돌아가기 바를 따로 두지 않는다.
    setReturnTab(target === 'battle' || tab === 'battle' ? null : tab);
    switchTab(target);
  };

  const goBackToReturnTab = () => {
    if (!returnTab) return;
    setReturnTab(null);
    switchTab(returnTab);
  };

  const popView = () => setViews((cur) => cur.slice(0, -1));

  const openBoard = (boardId: string) => {
    setGongBoardId(boardId);
    navigate('gong');
  };

  // 상세 화면은 탭 화면 위에 덮어 띄우고(탭 스크롤 유지), 가려진 탭은 inert로 조작·낭독에서 제외.
  const page = (key: TabKey, content: ReactNode) => (
    <section
      className="tab-page"
      hidden={tab !== key}
      inert={!!topView}
      aria-label={TAB_LABEL[key]}
      ref={(el) => {
        pageRefs.current[key] = el;
      }}
    >
      {content}
    </section>
  );

  const renderView = (view: ViewKey) => {
    if (view === 'stagePicker') return <StagePicker onBack={popView} />;
    if (view === 'myInfo') return <MyInfoView onNavigate={navigate} />;
    return (
      <RebirthView
        onDone={() => {
          setReturnTab(null);
          switchTab('battle');
        }}
      />
    );
  };

  const closeSheet = () => setSheet(null);
  const lockedSheetTab = sheet && sheet !== 'settings' && sheet !== 'currency' ? sheet : null;
  const lockedReason = lockedSheetTab ? lockReasons[lockedSheetTab] : null;

  return (
    <div id="app">
      <AppHeader
        tab={tab}
        onOpenInfo={() => navigate('myInfo')}
        onOpenSettings={() => setSheet('settings')}
        onOpenCurrency={() => setSheet('currency')}
      />
      {tab !== 'battle' && <BattleSummaryBar onClick={() => selectTab('battle')} />}
      {returnTab && !topView && (
        <button type="button" className="back-bar" onClick={goBackToReturnTab}>
          ‹ {TAB_LABEL[returnTab]}(으)로 돌아가기
        </button>
      )}

      <main id="app-main">
        {page('battle', <BattleTab onNavigate={navigate} lastGrowthTab={lastGrowthTab} />)}
        {page(
          'gong',
          <GongPanel boardId={gongBoardId} onBoardChange={setGongBoardId} onNavigate={navigate} />,
        )}
        {page('gear', <GearPanel onNavigate={navigate} />)}
        {page('sect', <SectPanel onOpenBoard={openBoard} />)}
        {page('shop', <ShopPanel />)}
        {topView && (
          <FullView key={topView} title={VIEW_TITLE[topView]} onBack={popView}>
            {renderView(topView)}
          </FullView>
        )}
        <Toast />
      </main>

      <TabBar
        tab={tab}
        lockReasons={lockReasons}
        onlyTab={tutorialActive ? 'gong' : null}
        onSelect={selectTab}
      />

      {sheet === 'settings' && <SettingsSheet onClose={closeSheet} />}
      {sheet === 'currency' && <CurrencySheet onClose={closeSheet} />}
      {lockedSheetTab && lockedReason && (
        <LockedTabSheet tab={lockedSheetTab} reason={lockedReason} onClose={closeSheet} />
      )}
      {!onboardingDone && <OnboardingFlow />}
    </div>
  );
};
