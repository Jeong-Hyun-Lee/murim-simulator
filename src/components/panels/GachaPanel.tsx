import { useEffect, type CSSProperties } from 'react';
import {
  useGameStore,
  PULL_COST,
  PULL_10_COST,
  HARD_PITY,
  GRADE_COLOR,
  gradeTier,
  SLOT_INFO,
} from '../../game/store';
import { playGachaReveal } from '../../audio/sfx';

// wiki "뽑기 결과 연출" 표: 등급이 높을수록(신품 이상) 카드 글로우를 강하게 — 파티클/화면
// 진동 등 캔버스 연출은 v1 범위 밖(gachaData.ts 주석 참고).
const glowForTier = (tier: number): string => {
  if (tier >= 5) return '0 0 16px 4px';
  if (tier >= 4) return '0 0 10px 2px';
  if (tier >= 3) return '0 0 6px 1px';
  return 'none';
};

const resultCardStyle = (tier: number, color: string): CSSProperties => {
  const glow = glowForTier(tier);
  return {
    borderColor: color,
    color,
    boxShadow: glow === 'none' ? undefined : `${glow} ${color}`,
  };
};

export const GachaPanel = () => {
  const elixir = useGameStore((s) => s.elixir);
  const gachaPity = useGameStore((s) => s.gachaPity);
  const lastGachaOutcome = useGameStore((s) => s.lastGachaOutcome);
  const pullGachaSingle = useGameStore((s) => s.pullGachaSingle);
  const pullGachaTen = useGameStore((s) => s.pullGachaTen);
  const resetGachaOutcome = useGameStore((s) => s.resetGachaOutcome);

  useEffect(() => {
    resetGachaOutcome();
  }, [resetGachaOutcome]);

  useEffect(() => {
    if (lastGachaOutcome) playGachaReveal();
  }, [lastGachaOutcome]);

  return (
    <>
      <div id="gacha-body">
        <div>
          보유 영약: {elixir.toLocaleString()}
          <br />
          천장 진행: {gachaPity}/{HARD_PITY} (선품 확정까지)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="gong-upgrade-btn"
            disabled={elixir < PULL_COST}
            onClick={pullGachaSingle}
          >
            1회 뽑기 (영약 {PULL_COST})
          </button>
          <button
            type="button"
            className="gong-upgrade-btn"
            disabled={elixir < PULL_10_COST}
            onClick={pullGachaTen}
          >
            10회 뽑기 (영약 {PULL_10_COST})
          </button>
        </div>
      </div>
      <div id="gacha-result">
        {lastGachaOutcome?.results.map((r, i) => (
          // 뽑기 결과는 자체 id가 없고 재정렬/필터링 없이 append-only로만 렌더되므로 index key가 안전함.
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="gacha-result-card"
            style={resultCardStyle(gradeTier(r.grade), GRADE_COLOR[r.grade])}
          >
            {r.grade} · {SLOT_INFO[r.slot].name}
          </div>
        ))}
      </div>
    </>
  );
};
