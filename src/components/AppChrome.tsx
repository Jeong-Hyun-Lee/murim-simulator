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
type IconName = CurrencyKey | TabKey | 'settings' | 'lock';

const UiIcon = ({ name }: { name: IconName }) => {
  const paths: Record<IconName, ReactNode> = {
    gong: (
      <path d="m12 3 2 2-7.5 7.5-2-2L12 3Zm-8.3 9.2 2.1 2.1-1.8 1.8-2.2.4.4-2.2 1.5-2.1Zm8.8-2.5 2 2 4.8-4.8-2-2-4.8 4.8Zm2.8 3.2 4.1 4.1-2.2 2.2-4.1-4.1 2.2-2.2Z" />
    ),
    gear: (
      <path d="M6 5 9 3h6l3 2 2 5-3 2v7H7v-7l-3-2 2-5Zm2.4 1.8L7.2 10l2.2 1.5h5.2l2.2-1.5-1.2-3.2H8.4Z" />
    ),
    sect: (
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 3 4.5 2.2L12 10.4 7.5 8.2 12 6Zm-5 5.2 4 2v4.2l-4-2V11.2Zm6 6.2v-4.2l4-2v4.2l-4 2Z" />
    ),
    shop: <path d="M5 9h14l-1 10H6L5 9Zm2-5h10l2 4H5l2-4Zm3 8v4h4v-4h-4Z" />,
    gold: (
      <path d="M12 3 20 8v8l-8 5-8-5V8l8-5Zm0 3.1L7 9v6l5 3 5-3V9l-5-2.9Zm-1 4h2v1h1v2h-1v1h-2v-1h-1v-2h1v-1Z" />
    ),
    chi: (
      <path d="M12 3c3.3 3.3 5 5.8 5 8.3A5 5 0 1 1 7 11.3C7 8.8 8.7 6.3 12 3Zm0 5.1c-1.4 1.7-2.1 3-2.1 4.1a2.1 2.1 0 0 0 4.2 0c0-1.1-.7-2.4-2.1-4.1Z" />
    ),
    elixir: (
      <path d="M9 3h6v2l-1 2v2.1l3.5 4.5V20h-11v-6.4L10 9.1V7L9 5V3Zm1.8 8.2-2.3 3v3.3h6.9v-3.3l-2.2-3h-2.4Z" />
    ),
    contribution: (
      <path d="m12 3 2.1 4.3 4.8.7-3.5 3.4.8 4.8-4.2-2.2-4.2 2.2.8-4.8L5.1 8l4.8-.7L12 3Z" />
    ),
    stones: <path d="m12 3 6 6-6 12L6 9l6-6Zm0 4.1L9 10l3 6 3-6-3-2.9Z" />,
    settings: (
      <path d="M10.1 3h3.8l.5 2.1 1.7.7 1.8-1.1 2.7 2.7-1.1 1.8.7 1.7 2.1.5v3.8l-2.1.5-.7 1.7 1.1 1.8-2.7 2.7-1.8-1.1-1.7.7-.5 2.1h-3.8l-.5-2.1-1.7-.7-1.8 1.1-2.7-2.7 1.1-1.8-.7-1.7-2.1-.5v-3.8l2.1-.5.7-1.7-1.1-1.8 2.7-2.7 1.8 1.1 1.7-.7.5-2.1ZM12 9.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2Z" />
    ),
    lock: <path d="M7 10V7a5 5 0 0 1 10 0v3h1v10H6V10h1Zm3 0h4V7a2 2 0 1 0-4 0v3Z" />,
  };

  return (
    <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
};

const CURRENCY_LABEL: Record<CurrencyKey, string> = {
  gold: '전',
  chi: '내공',
  elixir: '영약',
  contribution: '기여도',
  stones: '강화석',
};

// 화면별로 당장 필요한 재화 1~2종만 상단에 노출 — 전체 정확한 수치는 재화 상세 시트에서.
const TAB_CURRENCIES: Record<TabKey, CurrencyKey[]> = {
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
            <UiIcon name={key} />
            <span className="currency-chip-label">{CURRENCY_LABEL[key]}</span>
            <strong>{formatShort(currencies[key])}</strong>
          </span>
        ))}
      </button>
      <button type="button" className="header-icon-btn" onClick={onOpenSettings} aria-label="설정">
        <UiIcon name="settings" />
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
          <UiIcon name={key} />
          {locked && (
            <span className="tab-lock" aria-label="잠김">
              <UiIcon name="lock" />
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
      <section className="settings-summary" aria-label="현재 전투 상태">
        <span>자동 전투</span>
        <strong className={paused ? 'settings-state paused' : 'settings-state'}>
          {paused ? '일시정지' : '진행 중'}
        </strong>
      </section>
      <div className="setting-row setting-row-primary">
        <div>
          <strong>전투 제어</strong>
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
