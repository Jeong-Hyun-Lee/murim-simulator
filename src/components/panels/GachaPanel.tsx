import { useEffect, useState, type CSSProperties } from 'react';
import {
  useGameStore,
  PULL_COST,
  PULL_10_COST,
  HARD_PITY,
  SOFT_PITY_START,
  GRADE_CHANCE,
  GRADE_COLOR,
  gradeTier,
  SLOT_INFO,
} from '../../game/store';
import { GRADE_ORDER } from '../../game/gradeData';
import { playGachaReveal } from '../../audio/sfx';
import { Sheet } from '../Sheet';

// 등급이 높을수록(신품 이상) 카드 글로우를 강하게.
const glowForTier = (tier: number): string => {
  if (tier >= 5) return '0 0 1rem 0.25rem';
  if (tier >= 4) return '0 0 0.625rem 0.125rem';
  if (tier >= 3) return '0 0 0.375rem 1px';
  return 'none';
};

const resultCardStyle = (tier: number, color: string): CSSProperties => {
  const glow = glowForTier(tier);
  return {
    borderColor: color,
    boxShadow: glow === 'none' ? undefined : `${glow} ${color}`,
  };
};

// 결과 연출 동안 연타로 추가 뽑기가 실행되지 않게 막는 시간.
const REVEAL_LOCK_MS = 600;

type PullKind = 'single' | 'ten';

const RatesSheet = ({ onClose }: { onClose: () => void }) => (
  <Sheet title="기연 확률" onClose={onClose}>
    <section className="gacha-rates-intro">
      <span>등급별 획득 확률</span>
      <strong>희귀한 장비를 찾아보세요</strong>
    </section>
    <dl className="gacha-rates-list">
      {GRADE_ORDER.map((grade) => (
        <div key={grade} className="gacha-rate-row">
          <dt>
            <span className="grade-dot" style={{ background: GRADE_COLOR[grade] }} />
            {grade}
          </dt>
          <dd>{(GRADE_CHANCE[grade] * 100).toFixed(2)}%</dd>
        </div>
      ))}
    </dl>
    <p className="gacha-rates-guarantee">
      {SOFT_PITY_START + 1}회째부터 선품 확률이 조금씩 오르고, {HARD_PITY}회째에는 선품이
      확정됩니다. 10회 뽑기는 상품 이상 1개가 보장됩니다. 슬롯은 9종 중 무작위입니다.
    </p>
  </Sheet>
);

export const GachaPanel = () => {
  const elixir = useGameStore((s) => s.elixir);
  const gachaPity = useGameStore((s) => s.gachaPity);
  const lastGachaOutcome = useGameStore((s) => s.lastGachaOutcome);
  const pullGachaSingle = useGameStore((s) => s.pullGachaSingle);
  const pullGachaTen = useGameStore((s) => s.pullGachaTen);
  const resetGachaOutcome = useGameStore((s) => s.resetGachaOutcome);
  const [revealing, setRevealing] = useState(false);
  const [lastKind, setLastKind] = useState<PullKind>('single');
  const [ratesOpen, setRatesOpen] = useState(false);

  // 결과가 새로 생길 때만 연출 — 탭을 오가도 컴포넌트가 유지돼 재생·재지급이 없다.
  useEffect(() => {
    if (!lastGachaOutcome) return undefined;
    playGachaReveal();
    setRevealing(true);
    const id = window.setTimeout(() => setRevealing(false), REVEAL_LOCK_MS);
    return () => window.clearTimeout(id);
  }, [lastGachaOutcome]);

  const pull = (kind: PullKind) => {
    if (revealing) return;
    setLastKind(kind);
    if (kind === 'single') pullGachaSingle();
    else pullGachaTen();
  };

  const lastCost = lastKind === 'single' ? PULL_COST : PULL_10_COST;
  const pityPercent = Math.min(100, Math.round((gachaPity / HARD_PITY) * 100));
  const summary = lastGachaOutcome
    ? GRADE_ORDER.map((grade) => ({
        grade,
        count: lastGachaOutcome.results.filter((r) => r.grade === grade).length,
      })).filter((g) => g.count > 0)
    : [];

  return (
    <div className="gacha">
      <section className="card gacha-pull-card">
        <div className="gacha-pull-head">
          <div>
            <small>장비 기연</small>
            <h3>기연(奇緣)</h3>
          </div>
          <span>영약 {elixir.toLocaleString()}</span>
        </div>
        <dl className="stat-list">
          <div className="stat-row">
            <dt>보유 영약</dt>
            <dd>{elixir.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>천장 진행</dt>
            <dd>
              {gachaPity}/{HARD_PITY} (선품 확정까지)
            </dd>
          </div>
        </dl>
        <div
          className="gacha-pity-progress"
          aria-label={`선품 확정 천장 진행 ${gachaPity}/${HARD_PITY}`}
        >
          <div>
            <span>선품 확정 천장</span>
            <strong>
              {gachaPity}
              <small> / {HARD_PITY}</small>
            </strong>
          </div>
          <span className="gacha-pity-track">
            <i style={{ width: `${pityPercent}%` }} />
          </span>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={elixir < PULL_COST || revealing}
            onClick={() => pull('single')}
          >
            1회 뽑기
            <small>영약 {PULL_COST}</small>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={elixir < PULL_10_COST || revealing}
            onClick={() => pull('ten')}
          >
            10회 뽑기
            <small>영약 {PULL_10_COST}</small>
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => setRatesOpen(true)}
        >
          확률 정보 보기
        </button>
      </section>

      {lastGachaOutcome && (
        <section className="card gacha-outcome-card" aria-live="polite">
          <div className="gacha-outcome-head">
            <div>
              <p>기연의 결과</p>
              <h3>뽑기 결과</h3>
            </div>
            <span>{lastGachaOutcome.results.length}개 획득</span>
          </div>
          <p className="muted">
            {summary.map((g) => `${g.grade} ${g.count}`).join(' · ')} — 소지품에 추가됨
          </p>
          <div className="gacha-result-grid">
            {lastGachaOutcome.results.map((r, i) => (
              // 뽑기 결과는 자체 id가 없고 재정렬 없이 렌더만 하므로 index key가 안전함.
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="gacha-result-card"
                style={resultCardStyle(gradeTier(r.grade), GRADE_COLOR[r.grade])}
              >
                <span className="grade-dot" style={{ background: GRADE_COLOR[r.grade] }} />
                <span>
                  <strong>{r.grade}</strong>
                  <small>{SLOT_INFO[r.slot].name}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button type="button" className="btn" onClick={resetGachaOutcome}>
              닫기
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={elixir < lastCost || revealing}
              onClick={() => pull(lastKind)}
            >
              다시 뽑기
              <small>영약 {lastCost}</small>
            </button>
          </div>
        </section>
      )}
      {ratesOpen && <RatesSheet onClose={() => setRatesOpen(false)} />}
    </div>
  );
};
