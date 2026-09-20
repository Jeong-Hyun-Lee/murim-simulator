import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGameStore, realmName, type StageId } from '../game/store';
import { useSfxEnabled } from '../audio/sfx';
import { exportSaveCode, importSaveCode } from '../game/state';
import { useBackLayer } from '../hooks/useBackLayer';
import { Sheet } from './Sheet';
import {
  TAB_KEYS,
  TAB_LABEL,
  battleStatusIcon,
  formatShort,
  stageLabel,
  useBattleStatus,
  type TabKey,
} from './common';

type CurrencyKey = 'gold' | 'chi' | 'elixir' | 'contribution' | 'stones';
type IconName = CurrencyKey | TabKey | 'settings' | 'lock';

const ICON_SRC: Record<IconName, string> = {
  gong: '/ui/icon/icon-tab-gong.webp',
  gear: '/ui/icon/icon-tab-gear.webp',
  sect: '/ui/icon/icon-tab-sect.webp',
  shop: '/ui/icon/icon-tab-shop.webp',
  gold: '/ui/icon/icon-gold.webp',
  chi: '/ui/icon/icon-chi.webp',
  elixir: '/ui/icon/icon-elixir.webp',
  contribution: '/ui/icon/icon-contribution.webp',
  stones: '/ui/icon/icon-stones.webp',
  settings: '/ui/icon/icon-settings.webp',
  lock: '/ui/icon/icon-lock.webp',
};

const UiIcon = ({ name }: { name: IconName }) => (
  <img src={ICON_SRC[name]} alt="" aria-hidden="true" className="ui-icon" />
);

const CURRENCY_LABEL: Record<CurrencyKey, string> = {
  gold: '전',
  chi: '내공',
  elixir: '영약',
  contribution: '기여도',
  stones: '강화석',
};

const CURRENCY_USAGE: Record<CurrencyKey, string> = {
  gold: '영약 교환과 장비 강화',
  chi: '무공 연마와 문파 기부',
  elixir: '기연과 문파 기부',
  contribution: '문파무공 연마',
  stones: '장비 강화',
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
          <strong>{name}</strong>
          <small>{realmName(rebirthCount)}</small>
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
      <span className="battle-summary-stage">{stageLabel(stage)}</span>
      <span className="battle-summary-status" aria-live="polite">
        <img
          src={battleStatusIcon(status)}
          alt=""
          aria-hidden="true"
          style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.25em' }}
        />
        {status}
      </span>
      <span className="battle-summary-go">
        <img src="/ui/label/label-battle-view.webp" alt="전투 보기" style={{ height: '1.1em' }} /> ›
      </span>
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
          <img src="/ui/icon/icon-back.webp" alt="" aria-hidden="true" className="btn-close-icon" />
          뒤로
        </button>
        <h2>{title}</h2>
      </div>
      <div className="full-view-body">{children}</div>
    </section>
  );
};

// 세이브 백업 — 코드를 복사해 두었다가 다른 브라우저·기기에서 붙여넣어 복원한다.
const SaveBackup = () => {
  const retrySave = useGameStore((s) => s.retrySave);
  const [exported, setExported] = useState('');
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const exportCode = async () => {
    retrySave();
    const code = exportSaveCode();
    setExported(code);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // 클립보드 권한이 없으면 아래 입력칸의 코드를 직접 복사한다.
      setCopied(false);
    }
  };

  const restore = () => {
    if (!importSaveCode(input)) {
      setError('백업 코드가 올바르지 않습니다.');
      setConfirming(false);
      return;
    }
    window.location.reload();
  };

  return (
    <div className="setting-row save-backup">
      <div>
        <strong>
          <img
            src="/ui/icon/icon-backup.webp"
            alt=""
            aria-hidden="true"
            style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.25em' }}
          />
          <img
            src="/ui/label/section-save-backup.webp"
            alt="저장 백업"
            style={{ height: '1.1em', verticalAlign: '-0.15em' }}
          />
        </strong>
        <p>이 기기에만 저장됩니다. 브라우저 데이터를 지우기 전에 백업 코드를 보관하세요.</p>
      </div>
      <button type="button" className="btn" onClick={exportCode}>
        <img
          src="/ui/label/label-backup-copy.webp"
          alt="백업 코드 복사"
          style={{ height: '1.1em' }}
        />
      </button>
      {exported && (
        <>
          <p className="muted small">
            {copied ? '클립보드에 복사했습니다.' : '아래 코드를 직접 복사하세요.'}
          </p>
          <textarea readOnly value={exported} aria-label="백업 코드" rows={3} />
        </>
      )}
      <textarea
        value={input}
        placeholder="복원할 백업 코드 붙여넣기"
        aria-label="복원할 백업 코드"
        rows={3}
        onChange={(e) => {
          setInput(e.target.value);
          setError('');
          setConfirming(false);
        }}
      />
      {error && (
        <p className="warn">
          <img
            src="/ui/icon/icon-warn.webp"
            alt=""
            aria-hidden="true"
            style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.25em' }}
          />
          {error}
        </p>
      )}
      {confirming ? (
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={restore}>
            <img
              src="/ui/label/label-backup-overwrite.webp"
              alt="현재 진행을 덮어쓰고 복원"
              style={{ height: '1.1em' }}
            />
          </button>
          <button type="button" className="btn" onClick={() => setConfirming(false)}>
            <img src="/ui/label/label-cancel.webp" alt="취소" style={{ height: '1.1em' }} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn"
          disabled={!input.trim()}
          onClick={() => setConfirming(true)}
        >
          <img
            src="/ui/label/label-backup-restore.webp"
            alt="백업 코드로 복원"
            style={{ height: '1.1em' }}
          />
        </button>
      )}
    </div>
  );
};

export const SettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const paused = useGameStore((s) => s.paused);
  const togglePause = useGameStore((s) => s.togglePause);
  const [sfxEnabled, toggleSfx] = useSfxEnabled();

  return (
    <Sheet title="설정" titleImage="/ui/label/title-settings.webp" onClose={onClose}>
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
          <img
            src={paused ? '/ui/label/label-resume.webp' : '/ui/label/label-pause.webp'}
            alt={paused ? '전투 재개' : '전투 일시정지'}
            style={{ height: '1.1em', display: 'block' }}
          />
        </button>
      </div>
      <div className="setting-row">
        <div>
          <strong>효과음</strong>
          <p className="muted">{sfxEnabled ? '켜짐' : '꺼짐'}</p>
        </div>
        <button type="button" className="btn" onClick={toggleSfx}>
          <img
            src={sfxEnabled ? '/ui/icon/icon-sfx-on.webp' : '/ui/icon/icon-sfx-off.webp'}
            alt=""
            aria-hidden="true"
            className="btn-close-icon"
          />
          {sfxEnabled ? '효과음 끄기' : '효과음 켜기'}
        </button>
      </div>
      <SaveBackup />
    </Sheet>
  );
};

export const CurrencySheet = ({ onClose }: { onClose: () => void }) => {
  const currencies = useCurrencies();
  const protectionCharms = useGameStore((s) => s.protectionCharms);

  return (
    <Sheet title="보유 재화" titleImage="/ui/label/title-currency.webp" onClose={onClose}>
      <section className="currency-sheet-summary">
        <span>소지품</span>
        <strong>성장에 쓸 재화</strong>
        <p>필요한 화면에서 실제 소비량을 확인할 수 있습니다.</p>
      </section>
      <dl className="currency-list">
        {(Object.keys(CURRENCY_LABEL) as CurrencyKey[]).map((key) => (
          <div key={key} className="currency-row">
            <dt>
              <UiIcon name={key} />
              <span>
                <strong>{key === 'contribution' ? '사용 가능 기여도' : CURRENCY_LABEL[key]}</strong>
                <small>{CURRENCY_USAGE[key]}</small>
              </span>
            </dt>
            <dd>{currencies[key].toLocaleString()}</dd>
          </div>
        ))}
        <div className="currency-row">
          <dt>
            <img src="/ui/icon/icon-charm.webp" alt="" aria-hidden="true" className="ui-icon" />
            <span>
              <strong>보호부적</strong>
              <small>강화 실패 시 단계 하락 방지</small>
            </span>
          </dt>
          <dd>{protectionCharms.toLocaleString()}</dd>
        </div>
      </dl>
      <p className="currency-sheet-note">
        오늘의 접속 보너스는 하루 한 번, 오프라인 보상은 자리를 비운 5분 이후부터 자동 지급됩니다.
      </p>
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
    <Sheet
      title={`${TAB_LABEL[tab]} 잠김`}
      titleImage={`/ui/label/title-locked-${tab}.webp`}
      onClose={onClose}
    >
      <section className="locked-tab-card">
        <span className="locked-tab-emblem" aria-hidden="true">
          <UiIcon name="lock" />
        </span>
        <p className="locked-tab-kicker">성장으로 해금</p>
        <h3>{TAB_LABEL[tab]}</h3>
        <p className="locked-tab-reason">{reason}</p>
        <p className="locked-tab-progress">{progressText(tab, highestMajorCleared, stage)}</p>
      </section>
    </Sheet>
  );
};
