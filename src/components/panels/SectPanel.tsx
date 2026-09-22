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
  GRANDMASTER_TITLE,
  OTHER_SECTS,
  OTHER_SECT_MAX_FAVOR,
  otherSectLevel,
  otherSectPerkPercent,
  isSectTransmitted,
  allSectsTransmitted,
  nodeLevel,
  SLOT_INFO,
} from '../../game/store';
import { Sheet } from '../Sheet';

// 기여도로 연마하는 문파 무공 보드(삼재검법 2보).
const SECT_BOARD = GONG_BOARDS.find((b) => b.currency === 'contribution')!;
const CONTRIBUTION_BOARDS = GONG_BOARDS.filter((b) => b.currency === 'contribution');

type DonateKind = 'chi' | 'elixir';

const PERK_LABEL = {
  critChance: '치명타 확률',
  critDamage: '치명타 피해',
  attackSpeed: '공격속도',
  evasion: '회피율',
  chiGain: '내공 획득량',
} as const;

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
    <Sheet
      title={`${label} 전량 기부`}
      titleImage={`/ui/label/title-donate-${kind}.webp`}
      onClose={onClose}
    >
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
  const sectFavor = useGameStore((s) => s.sectFavor);
  const investSectFavor = useGameStore((s) => s.investSectFavor);
  const sectBoardUnlocked = useGameStore((s) => isBoardUnlocked(SECT_BOARD, s));
  // 청운문·타 문파가 모두 최대 레벨이고 기여도 보드도 전부 대성이면 기여도를 쓸 곳이 없어 기부 칸을 숨긴다.
  const donationDone = useGameStore(
    (s) =>
      s.sectLevel >= SECT_MAX_LEVEL &&
      allSectsTransmitted(s.sectFavor) &&
      CONTRIBUTION_BOARDS.every((b) =>
        b.nodes.every((n) => nodeLevel(n, s.gongLevels) >= n.maxLevel),
      ),
  );
  const [donate, setDonate] = useState<DonateKind | null>(null);

  const levelMaxed = sectLevel >= SECT_MAX_LEVEL;
  const nextExp = sectExpToNextLevel(sectLevel);

  return (
    <div className="sect-tab">
      <section className="card sect-banner">
        <img
          src="/ui/label/sign-sect-qingyun.webp"
          alt={SECT_NAME}
          style={{ height: '2em', display: 'block', margin: '0 auto' }}
        />
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
        {levelMaxed && <p className="sect-title">직책: {GRANDMASTER_TITLE}</p>}
        <div className="exp-row">
          <img src="/ui/icon/icon-exp.webp" alt="" aria-hidden="true" className="exp-row-icon" />
          <div className="bar exp-bar" role="img" aria-label="문파 경험치">
            <div
              className="bar-fill"
              style={{
                width: levelMaxed ? '100%' : `${Math.min(100, (sectExp / nextExp) * 100)}%`,
              }}
            />
            <span className="bar-text">
              {levelMaxed
                ? '최대 레벨'
                : `${sectExp.toLocaleString()} / ${nextExp.toLocaleString()}`}
            </span>
          </div>
        </div>
      </section>

      <section className="card sect-contribution-card">
        <div className="sect-contribution-grid">
          <div className="sect-contribution-value">
            <span>사용 가능 기여도</span>
            <strong>{sectContributionPoints.toLocaleString()}</strong>
            <small>문파 무공 연마·타 문파 교분에 사용</small>
          </div>
          <div className="sect-contribution-value">
            <span>누적 기여도</span>
            <strong>{sectTotalContribution.toLocaleString()}</strong>
            <small>기부 기록 · 사용해도 유지</small>
          </div>
        </div>
      </section>

      {!donationDone && (
        <section className="card sect-donate-card">
          <h3>
            <img
              src="/ui/label/section-donate.webp"
              alt="기부"
              style={{ height: '1.1em', display: 'block' }}
            />
          </h3>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <img
                  src="/ui/icon/icon-action-donate.webp"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 20, height: 20 }}
                />
                <img
                  src="/ui/label/label-donate-chi.webp"
                  alt="내공 전량 기부"
                  style={{ height: '1.1em' }}
                />
              </span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={elixir <= 0}
              onClick={() => setDonate('elixir')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <img
                  src="/ui/icon/icon-action-donate.webp"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 20, height: 20 }}
                />
                <img
                  src="/ui/label/label-donate-elixir.webp"
                  alt="영약 전량 기부"
                  style={{ height: '1.1em' }}
                />
              </span>
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        className="btn btn-travel btn-block sect-board-action"
        disabled={!sectBoardUnlocked}
        onClick={() => onOpenBoard(SECT_BOARD.id)}
      >
        <img
          src="/ui/label/label-sect-board.webp"
          alt="문파 무공 보기"
          style={{ height: '1.1em', display: 'block' }}
        />
        <small>({SECT_BOARD.name})</small>
      </button>
      {!sectBoardUnlocked && <p className="muted small">{boardUnlockLabel(SECT_BOARD)}</p>}

      <section className="card sect-exchange-card">
        <h3>{GRANDMASTER_TITLE} · 타 문파 교류</h3>
        <p className="muted">
          {levelMaxed
            ? '청운문 기여도를 바쳐 타 문파의 레벨을 올립니다. 레벨 10마다 문파 특전이 오르고, 최대 레벨에 그 문파의 무공을 전수받습니다.'
            : `청운문 Lv.${SECT_MAX_LEVEL}을 달성하면 ${GRANDMASTER_TITLE} 직책을 받아 타 문파와 교류할 수 있습니다.`}
        </p>
        <ul className="sect-exchange-list">
          {OTHER_SECTS.map((sect) => {
            const favor = sectFavor[sect.id] ?? 0;
            const transmitted = isSectTransmitted(favor);
            const { level, exp } = otherSectLevel(favor);
            const board = GONG_BOARDS.find((b) => b.id === sect.boardId)!;
            const slotName = SLOT_INFO[sect.giftSlot].name.split('(')[0];
            return (
              <li key={sect.id} className="setting-row">
                <div>
                  <strong>
                    {sect.name} Lv.{level}/{SECT_MAX_LEVEL}
                  </strong>
                  <p>
                    {transmitted
                      ? `${board.name} 전수 완료`
                      : `다음 레벨 ${exp.toLocaleString()} / ${sectExpToNextLevel(level).toLocaleString()} · 전수: ${board.name}`}
                  </p>
                  <p className="muted small">
                    특전: {PERK_LABEL[sect.perkStat]} +
                    {otherSectPerkPercent(sect, favor).toFixed(1)}% ·{' '}
                    {favor === 0 ? `첫 기여 보상: 신품 ${slotName}` : '첫 기여 보상 받음'}
                  </p>
                </div>
                <div className="sect-exchange-actions">
                  {transmitted ? (
                    <button
                      type="button"
                      className="btn btn-travel"
                      onClick={() => onOpenBoard(board.id)}
                    >
                      무공 보기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      disabled={!levelMaxed || sectContributionPoints <= 0}
                      onClick={() => investSectFavor(sect.id)}
                    >
                      기여도 바치기
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="muted small">
          5개 문파를 모두 최대 레벨로 올려 무공을 전수받으면 일대종사 신표(선품 머리)를 1회
          받습니다. 문파 하나를 최대 레벨까지 올리는 데 기여도{' '}
          {OTHER_SECT_MAX_FAVOR.toLocaleString()}이 듭니다.
        </p>
      </section>

      {donate && <DonateSheet kind={donate} onClose={() => setDonate(null)} />}
    </div>
  );
};
