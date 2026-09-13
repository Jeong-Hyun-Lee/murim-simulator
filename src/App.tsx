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
import { StoryCutscene } from './components/StoryCutscene';
import { GongPanel } from './components/panels/GongPanel';
import { GearPanel } from './components/panels/GearPanel';
import { SectPanel } from './components/panels/SectPanel';
import { ShopPanel } from './components/panels/ShopPanel';
import { StagePicker } from './components/panels/StagePicker';
import { Sheet } from './components/Sheet';
import { MyInfoView } from './components/panels/MyInfoView';
import { RebirthView } from './components/panels/RebirthView';
import { useBackLayer } from './hooks/useBackLayer';
import { useSaveStatus } from './game/state';
import {
  TAB_KEYS,
  TAB_LABEL,
  isViewKey,
  useTabLockReasons,
  type NavTarget,
  type TabKey,
  type ViewKey,
} from './components/common';
import { useGameStore, GONG_BOARDS, isBoardUnlocked } from './game/store';

type SheetKey = 'settings' | 'currency' | TabKey; // TabKey = 잠긴 탭 조건 안내

const VIEW_TITLE: Record<ViewKey, string> = {
  stagePicker: '사냥터',
  myInfo: '내 정보',
  rebirth: '환골탈태',
};

// 세로형·하단 4탭 모바일 틀. 모든 탭 화면을 계속 마운트해 두고 hidden으로만 전환한다 —
// 전투 진행이 BattleCanvas의 틱에 묶여 있어 탭 전환으로 캔버스가 제거되면 전투가 멈추기 때문이며,
// 보드 선택·필터 같은 화면 상태도 세션 동안 그대로 유지된다.
// ponytail: 숨겨진 무공 탭의 전투 Pixi도 계속 렌더링함. 배터리 문제가 보이면 화면 밖일 때 렌더만 끄기.
export const App = () => {
  const claimDailyBonusIfNeeded = useGameStore((s) => s.claimDailyBonusIfNeeded);
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const storyCutscene = useGameStore((s) => s.storyCutscene);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const lockReasons = useTabLockReasons();
  const unlockedBoardCount = useGameStore(
    (s) =>
      GONG_BOARDS.filter((board) =>
        isBoardUnlocked(board, {
          highestMajorCleared: s.highestMajorCleared,
          gongLevels: s.gongLevels,
        }),
      ).length,
  );
  const saveFailed = useSaveStatus((s) => s.failed);
  const retrySave = useGameStore((s) => s.retrySave);
  const [badges, setBadges] = useState<TabKey[]>([]);

  const [tab, setTab] = useState<TabKey>('gong');
  const [views, setViews] = useState<ViewKey[]>([]);
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [returnTab, setReturnTab] = useState<TabKey | null>(null);
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

  // 새 해금 배지 — 세션 중 탭이 열리거나 무공 보드가 새로 열리면 표시하고, 그 탭을 열면 지운다.
  // 접속 시점에 이미 열려 있던 것은 알리지 않는다.
  const unlockKey = [
    unlockedBoardCount,
    lockReasons.gear ? 0 : 1,
    lockReasons.sect ? 0 : 1,
    lockReasons.shop ? 0 : 1,
  ].join(',');
  const prevUnlockKey = useRef(unlockKey);
  useEffect(() => {
    const prev = prevUnlockKey.current.split(',').map(Number);
    const next = unlockKey.split(',').map(Number);
    prevUnlockKey.current = unlockKey;
    const grown = TAB_KEYS.filter((key, i) => next[i] > prev[i] && key !== tab);
    if (grown.length > 0) setBadges((cur) => [...new Set([...cur, ...grown])]);
  }, [unlockKey, tab]);

  const switchTab = (next: TabKey) => {
    scrollTops.current[tab] = pageRefs.current[tab]?.scrollTop ?? 0;
    setBadges((cur) => cur.filter((key) => key !== next));
    setTab(next);
    setViews([]);
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
    setReturnTab(tab);
    switchTab(target);
  };

  const goBackToReturnTab = () => {
    if (!returnTab) return;
    setReturnTab(null);
    switchTab(returnTab);
  };
  useBackLayer(!!returnTab, goBackToReturnTab);

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
        if (key !== 'gong') pageRefs.current[key] = el;
      }}
      data-main={key === 'gong' ? 'true' : undefined}
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
          switchTab('gong');
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
      {saveFailed && (
        <div className="save-error" role="alert">
          <span>저장 실패: 최근 진행이 이 기기에 저장되지 않았습니다.</span>
          <button type="button" className="btn" onClick={retrySave}>
            다시 저장
          </button>
        </div>
      )}
      {tab !== 'gong' && <BattleSummaryBar onClick={() => selectTab('gong')} />}
      {returnTab && !topView && (
        <button type="button" className="back-bar" onClick={goBackToReturnTab}>
          ‹ {TAB_LABEL[returnTab]}(으)로 돌아가기
        </button>
      )}

      <main id="app-main">
        {page(
          'gong',
          <div className="gong-main">
            <BattleTab onNavigate={navigate} />
            <div
              className="gong-scroll"
              ref={(el) => {
                pageRefs.current.gong = el;
              }}
            >
              <GongPanel
                boardId={gongBoardId}
                onBoardChange={setGongBoardId}
                onNavigate={navigate}
              />
            </div>
          </div>,
        )}
        {page('gear', <GearPanel onNavigate={navigate} />)}
        {page('sect', <SectPanel onOpenBoard={openBoard} />)}
        {page('shop', <ShopPanel />)}
        {topView && topView !== 'stagePicker' && (
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
        badges={badges}
        onSelect={selectTab}
      />

      {sheet === 'settings' && <SettingsSheet onClose={closeSheet} />}
      {sheet === 'currency' && <CurrencySheet onClose={closeSheet} />}
      {topView === 'stagePicker' && (
        <Sheet title="사냥터 선택" onClose={popView}>
          <StagePicker onBack={popView} />
        </Sheet>
      )}
      {lockedSheetTab && lockedReason && (
        <LockedTabSheet tab={lockedSheetTab} reason={lockedReason} onClose={closeSheet} />
      )}
      {!onboardingDone && <OnboardingFlow />}
      {storyCutscene && <StoryCutscene key={storyCutscene[0]} cards={storyCutscene} />}
    </div>
  );
};
