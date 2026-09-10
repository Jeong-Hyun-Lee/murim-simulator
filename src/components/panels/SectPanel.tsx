import {
  useGameStore,
  SECT_NAME,
  SECT_MAX_LEVEL,
  CHI_PER_CONTRIBUTION,
  ELIXIR_CONTRIBUTION_RATE,
  sectExpToNextLevel,
  sectBuffPercent,
} from "../../game/store";

interface Props {
  onClose: () => void;
}

export function SectPanel({ onClose }: Props) {
  const sectLevel = useGameStore((s) => s.sectLevel);
  const sectExp = useGameStore((s) => s.sectExp);
  const sectTotalContribution = useGameStore((s) => s.sectTotalContribution);
  const chi = useGameStore((s) => s.chi);
  const elixir = useGameStore((s) => s.elixir);
  const donateChiToSect = useGameStore((s) => s.donateChiToSect);
  const donateElixirToSect = useGameStore((s) => s.donateElixirToSect);

  const donatableChi = Math.floor(chi / CHI_PER_CONTRIBUTION);
  const elixirContribution = elixir * ELIXIR_CONTRIBUTION_RATE;
  const maxed = sectLevel >= SECT_MAX_LEVEL;

  return (
    <div id="sect-panel" className="stat-panel">
      <div className="panel-header">
        <span>문파</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="sect-body">
        <div>
          소속: <b>{SECT_NAME}</b>
          <br />
          문파 Lv.{sectLevel}/{SECT_MAX_LEVEL} ({sectExp}/{maxed ? "-" : sectExpToNextLevel(sectLevel)})
          <br />
          문파 특전: 전투력 +{sectBuffPercent(sectLevel)}%
          <br />
          누적 기여도: {sectTotalContribution.toLocaleString()}
          <br />
          내공 {CHI_PER_CONTRIBUTION.toLocaleString()} = 기여도 1 (보유 내공 {chi.toLocaleString()}) · 영약 1개 = 기여도 {ELIXIR_CONTRIBUTION_RATE} (보유 영약 {elixir.toLocaleString()})
        </div>
        <div className="equip-detail-actions">
          <button className="gong-upgrade-btn" disabled={maxed || donatableChi <= 0} onClick={donateChiToSect}>
            {maxed ? "대성" : `내공 기부 (기여도 +${donatableChi})`}
          </button>
          <button className="gong-upgrade-btn" disabled={maxed || elixir <= 0} onClick={donateElixirToSect}>
            {maxed ? "대성" : `영약 기부 (기여도 +${elixirContribution})`}
          </button>
        </div>
      </div>
    </div>
  );
}
