import { useEffect } from "react";
import { useGameStore, PULL_COST, PULL_10_COST, HARD_PITY } from "../../game/store";

interface Props {
  onClose: () => void;
}

export function GachaPanel({ onClose }: Props) {
  const elixir = useGameStore((s) => s.elixir);
  const gachaPity = useGameStore((s) => s.gachaPity);
  const lastGachaOutcome = useGameStore((s) => s.lastGachaOutcome);
  const pullGachaSingle = useGameStore((s) => s.pullGachaSingle);
  const pullGachaTen = useGameStore((s) => s.pullGachaTen);
  const resetGachaOutcome = useGameStore((s) => s.resetGachaOutcome);

  useEffect(() => {
    resetGachaOutcome();
  }, [resetGachaOutcome]);

  return (
    <div id="gacha-panel" className="stat-panel">
      <div className="panel-header">
        <span>기연(奇緣)</span>
        <button onClick={onClose}>닫기</button>
      </div>
      <div id="gacha-body">
        <div>
          보유 영약: {elixir.toLocaleString()}
          <br />
          천장 진행: {gachaPity}/{HARD_PITY} (선품 확정까지)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button className="gong-upgrade-btn" disabled={elixir < PULL_COST} onClick={pullGachaSingle}>
            1회 뽑기 (영약 {PULL_COST})
          </button>
          <button className="gong-upgrade-btn" disabled={elixir < PULL_10_COST} onClick={pullGachaTen}>
            10회 뽑기 (영약 {PULL_10_COST})
          </button>
        </div>
      </div>
      <div id="gacha-result">
        {lastGachaOutcome?.results.map((r, i) => (
          <div key={i} className="gacha-result-card">
            {r.grade} +내공{r.reward}
          </div>
        ))}
      </div>
    </div>
  );
}
