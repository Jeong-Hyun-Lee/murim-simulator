import { useEffect, useRef, type ReactNode } from 'react';
import { useGameStore, realmName, type StageId } from '../game/store';
import { useSfxEnabled } from '../audio/sfx';
import { useBackLayer } from '../hooks/useBackLayer';
import { Sheet } from './Sheet';
import {
  TAB_KEYS,
  TAB_LABEL,
  formatShort,
  stageLabel,
  useBattleStatus,
  type TabKey,
} from './common';

type CurrencyKey = 'gold' | 'chi' | 'elixir' | 'contribution' | 'stones';

const CURRENCY_LABEL: Record<CurrencyKey, string> = {
  gold: '전',
  chi: '내공',
  elixir: '영약',
  contribution: '기여도',
  stones: '강화석',
};

// 화면별로 당장 필요한 재화 1~2종만 상단에 노출 — 전체 정확한 수치는 재화 상세 시트에서.
const TAB_CURRENCIES: Record<TabKey, CurrencyKey[]> = {
  battle: ['gold', 'chi'],
  gong: ['chi', 'contribution'],
  gear: ['gold', 'stones'],
  sect: ['chi', 'elixir'],
  shop: ['gold', 'elixir'],
};

const useCurrencies = (): Record<CurrencyKey, number> => {
  const gold = useGameStore((s) => s.gold);
  const chi = useGameStore((s) => s.chi);
  const elixir = useGameStore((s) => s.elixir);
  const contribution = useGameStore((s) => s.sectContributionPoints);
  const stones = useGameStore((s) => s.enhanceStones);
  return { gold, chi, elixir, contribution, stones };
};

interface HeaderProps {
  tab: TabKey;
  onOpenInfo: () => void;
  onOpenSettings: () => void;
  onOpenCurrency: () => void;
}

export const AppHeader = ({ tab, onOpenInfo, onOpenSettings, onOpenCurrency }: HeaderProps) => {
  const name = useGameStore((s) => s.player.name);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const currencies = useCurrencies();

  return (
    <header id="app-header">
      <button type="button" className="header-profile" onClick={onOpenInfo} aria-label="내 정보">
        <span className="header-portrait" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
        <span className="header-name">
          {name} · {realmName(rebirthCount)}
        </span>
      </button>
      <button
        type="button"
        className="header-currencies"
        onClick={onOpenCurrency}
        aria-label="재화 상세"
      >
        {TAB_CURRENCIES[tab].map((key) => (
          <span key={key} className="currency-chip">
            <span className="currency-chip-label">{CURRENCY_LABEL[key]}</span>{' '}
            {formatShort(currencies[key])}
          </span>
        ))}
      </button>
      <button type="button" className="header-icon-btn" onClick={onOpenSettings} aria-label="설정">
        ⚙
      </button>
    </header>
  );
};

// 전투 외 탭 상단 요약줄 — 작은 캔버스를 중복 생성하지 않고 텍스트로만 상태를 보여준다.
export const BattleSummaryBar = ({ onClick }: { onClick: () => void }) => {
  const stage = useGameStore((s) => s.stage);
  const status = useBattleStatus();
  const needsAttention = status === '보상 확인 대기' || status === '보스 도전 대기';

  return (
    <button
      type="button"
      className={`battle-summary${needsAttention ? ' battle-summary-alert' : ''}`}
      onClick={onClick}
    >
      <span>{stageLabel(stage)}</span>
      <span aria-live="polite">{status}</span>
      <span className="battle-summary-go">전투 보기 ›</span>
    </button>
  );
};

interface TabBarProps {
  tab: TabKey;
  lockReasons: Record<TabKey, string | null>;
  // 첫 성장 안내 중에는 무공 탭만 조작 가능.
  onlyTab: TabKey | null;
  // 새로 해금된 내용이 있고 아직 열어 보지 않은 탭.
  badges: TabKey[];
  onSelect: (key: TabKey) => void;
}

export const TabBar = ({ tab, lockReasons, onlyTab, badges, onSelect }: TabBarProps) => (
  <nav id="tab-bar" aria-label="주요 화면">
    {TAB_KEYS.map((key) => {
      const locked = !!lockReasons[key];
      return (
        <button
          type="button"
          key={key}
          className={`tab-btn${tab === key ? ' tab-btn-active' : ''}${locked ? ' tab-btn-locked' : ''}`}
          aria-current={tab === key ? 'page' : undefined}
          disabled={onlyTab !== null && onlyTab !== key}
          onClick={() => onSelect(key)}
        >
          {locked && (
            <span className="tab-lock" aria-label="잠김">
              🔒
            </span>
          )}
          {TAB_LABEL[key]}
          {badges.includes(key) && (
            <span className="tab-badge">
              <span className="sr-only"> 새로 열림</span>
            </span>
          )}
        </button>
      );
    })}
  </nav>
);

export const FullView = ({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) => {
  const backRef = useRef<HTMLButtonElement>(null);
  // 열 때 뒤로 버튼에 초점을 두고, 닫힐 때 화면을 연 버튼으로 초점을 돌려준다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    backRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  useBackLayer(true, onBack);

  return (
    <section className="full-view" aria-label={title}>
      <div className="full-view-header">
        <button ref={backRef} type="button" className="btn btn-ghost" onClick={onBack}>
          ‹ 뒤로
        </button>
        <h2>{title}</h2>
      </div>
      <div className="full-view-body">{children}</div>
    </section>
  );
};

export const SettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const paused = useGameStore((s) => s.paused);
  const togglePause = useGameStore((s) => s.togglePause);
  const [sfxEnabled, toggleSfx] = useSfxEnabled();

  return (
    <Sheet title="설정" onClose={onClose}>
      <div className="setting-row">
        <div>
          <strong>전투</strong>
          <p className="muted">
            {paused ? '일시정지 중 — 재개를 눌러야 다시 진행됩니다.' : '진행 중'}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={togglePause}>
          {paused ? '전투 재개' : '전투 일시정지'}
        </button>
      </div>
      <div className="setting-row">
        <div>
          <strong>효과음</strong>
          <p className="muted">{sfxEnabled ? '켜짐' : '꺼짐'}</p>
        </div>
        <button type="button" className="btn" onClick={toggleSfx}>
          {sfxEnabled ? '효과음 끄기' : '효과음 켜기'}
        </button>
      </div>
    </Sheet>
  );
};

export const CurrencySheet = ({ onClose }: { onClose: () => void }) => {
  const currencies = useCurrencies();
  const protectionCharms = useGameStore((s) => s.protectionCharms);

  return (
    <Sheet title="보유 재화" onClose={onClose}>
      <dl className="stat-list">
        {(Object.keys(CURRENCY_LABEL) as CurrencyKey[]).map((key) => (
          <div key={key} className="stat-row">
            <dt>{key === 'contribution' ? '사용 가능 기여도' : CURRENCY_LABEL[key]}</dt>
            <dd>{currencies[key].toLocaleString()}</dd>
          </div>
        ))}
        <div className="stat-row">
          <dt>보호부적</dt>
          <dd>{protectionCharms.toLocaleString()}</dd>
        </div>
      </dl>
      <p className="muted">오늘의 접속 보너스는 하루 한 번 접속 시 자동 지급됩니다.</p>
    </Sheet>
  );
};

const progressText = (tab: TabKey, highestMajorCleared: number, stage: StageId): string => {
  if (tab === 'gear')
    return '아직 획득한 장비가 없습니다. 전투에서 적을 처치하면 장비가 떨어집니다.';
  return `현재 최고 클리어: ${highestMajorCleared > 0 ? `대${highestMajorCleared}` : '없음'} · 진행 위치 ${stageLabel(stage)}`;
};

export const LockedTabSheet = ({
  tab,
  reason,
  onClose,
}: {
  tab: TabKey;
  reason: string;
  onClose: () => void;
}) => {
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const stage = useGameStore((s) => s.farmReturnStage ?? s.stage);

  return (
    <Sheet title={`${TAB_LABEL[tab]} 잠김`} onClose={onClose}>
      <p>{reason}</p>
      <p className="muted">{progressText(tab, highestMajorCleared, stage)}</p>
    </Sheet>
  );
};
