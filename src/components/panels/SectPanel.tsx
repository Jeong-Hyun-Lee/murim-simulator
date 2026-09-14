import { useState } from 'react';
import {
  useGameStore,
  SECT_NAME,
  SECT_MAX_LEVEL,
  CHI_PER_CONTRIBUTION,
  ELIXIR_CONTRIBUTION_RATE,
  sectExpToNextLevel,
  sectBuffPercent,
  GONG_BOARDS,
  isBoardUnlocked,
  boardUnlockLabel,
} from '../../game/store';
import { Sheet } from '../Sheet';

// 기여도로 연마하는 문파 무공 보드(삼재검법 2보).
const SECT_BOARD = GONG_BOARDS.find((b) => b.currency === 'contribution')!;

type DonateKind = 'chi' | 'elixir';

// 전량 기부 확인 — 실제 소비량·획득 기여도·기부 후 잔액을 보여준 뒤 실행.
const DonateSheet = ({ kind, onClose }: { kind: DonateKind; onClose: () => void }) => {
  const chi = useGameStore((s) => s.chi);
  const elixir = useGameStore((s) => s.elixir);
  const donateChiToSect = useGameStore((s) => s.donateChiToSect);
  const donateElixirToSect = useGameStore((s) => s.donateElixirToSect);

  const units = Math.floor(chi / CHI_PER_CONTRIBUTION);
  const isChi = kind === 'chi';
  const spent = isChi ? units * CHI_PER_CONTRIBUTION : elixir;
  const gained = isChi ? units : elixir * ELIXIR_CONTRIBUTION_RATE;
  const balance = isChi ? chi : elixir;
  const label = isChi ? '내공' : '영약';
  const conversion = isChi
    ? `${CHI_PER_CONTRIBUTION.toLocaleString()} 내공 → 기여도 1`
    : `영약 1개 → 기여도 ${ELIXIR_CONTRIBUTION_RATE}`;

  return (
    <Sheet title={`${label} 전량 기부`} onClose={onClose}>
      <section className="donate-sheet-intro">
        <span>문파 성장 기여</span>
        <strong>{conversion}</strong>
        <p>기부한 재화는 문파 특전과 문파 무공 성장에 쓰입니다.</p>
      </section>
      <dl className="stat-list donate-sheet-summary">
        <div className="stat-row">
          <dt>이번 기부</dt>
          <dd>
            {label} {spent.toLocaleString()}
          </dd>
        </div>
        <div className="stat-row">
          <dt>획득 기여도</dt>
          <dd>+{gained.toLocaleString()}</dd>
        </div>
        <div className="stat-row">
          <dt>기부 후 {label} 잔액</dt>
          <dd>{(balance - spent).toLocaleString()}</dd>
        </div>
      </dl>
      {isChi && (
        <p className="muted donate-sheet-note">
          내공 {CHI_PER_CONTRIBUTION.toLocaleString()}당 기여도 1로 교환되며, 교환 단위에 못 미치는
          내공은 남습니다.
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={gained <= 0}
          onClick={() => {
            if (isChi) donateChiToSect();
            else donateElixirToSect();
            onClose();
          }}
        >
          기부하기
        </button>
      </div>
    </Sheet>
  );
};

export const SectPanel = ({ onOpenBoard }: { onOpenBoard: (boardId: string) => void }) => {
  const sectLevel = useGameStore((s) => s.sectLevel);
  const sectExp = useGameStore((s) => s.sectExp);
  const sectTotalContribution = useGameStore((s) => s.sectTotalContribution);
  const sectContributionPoints = useGameStore((s) => s.sectContributionPoints);
  const chi = useGameStore((s) => s.chi);
  const elixir = useGameStore((s) => s.elixir);
  const sectBoardUnlocked = useGameStore((s) =>
    isBoardUnlocked(SECT_BOARD, {
      highestMajorCleared: s.highestMajorCleared,
      gongLevels: s.gongLevels,
    }),
  );
  const [donate, setDonate] = useState<DonateKind | null>(null);

  const levelMaxed = sectLevel >= SECT_MAX_LEVEL;
  const nextExp = sectExpToNextLevel(sectLevel);

  return (
    <div className="sect-tab">
      <section className="card sect-banner">
        <h3>{SECT_NAME}</h3>
        <p className="muted">
          목현이 몸담은 정파 문파. 기부로 문파를 키우면 전투력 특전이 오릅니다.
        </p>
      </section>

      <section className="card sect-level-card">
        <div className="unit-name-row">
          <strong>
            문파 Lv.{sectLevel}/{SECT_MAX_LEVEL}
          </strong>
          <span>특전: 전투력 +{sectBuffPercent(sectLevel)}%</span>
        </div>
        <div className="bar exp-bar" role="img" aria-label="문파 경험치">
          <div
            className="bar-fill"
            style={{ width: levelMaxed ? '100%' : `${Math.min(100, (sectExp / nextExp) * 100)}%` }}
          />
          <span className="bar-text">
            {levelMaxed ? '최대 레벨' : `${sectExp.toLocaleString()} / ${nextExp.toLocaleString()}`}
          </span>
        </div>
      </section>

      <section className="card sect-contribution-card">
        <div className="sect-contribution-grid">
          <div className="sect-contribution-value">
            <span>사용 가능 기여도</span>
            <strong>{sectContributionPoints.toLocaleString()}</strong>
            <small>삼재검법 2보 연마에 사용</small>
          </div>
          <div className="sect-contribution-value">
            <span>누적 기여도</span>
            <strong>{sectTotalContribution.toLocaleString()}</strong>
            <small>기부 기록 · 사용해도 유지</small>
          </div>
        </div>
      </section>

      <section className="card sect-donate-card">
        <h3>기부</h3>
        <p className="muted">
          내공 {CHI_PER_CONTRIBUTION.toLocaleString()} = 기여도 1 · 영약 1개 = 기여도{' '}
          {ELIXIR_CONTRIBUTION_RATE}
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={chi < CHI_PER_CONTRIBUTION}
            onClick={() => setDonate('chi')}
          >
            내공 전량 기부
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={elixir <= 0}
            onClick={() => setDonate('elixir')}
          >
            영약 전량 기부
          </button>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-block sect-board-action"
        disabled={!sectBoardUnlocked}
        onClick={() => onOpenBoard(SECT_BOARD.id)}
      >
        문파 무공 보기 ({SECT_BOARD.name})
      </button>
      {!sectBoardUnlocked && <p className="muted small">{boardUnlockLabel(SECT_BOARD)}</p>}

      {donate && <DonateSheet kind={donate} onClose={() => setDonate(null)} />}
    </div>
  );
};
