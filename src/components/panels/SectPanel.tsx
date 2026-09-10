import { useGameStore, SECT_NAME, SECT_MAX_LEVEL, CHI_PER_CONTRIBUTION, sectExpToNextLevel, sectBuffPercent } from "../../game/store";

interface Props {
  onClose: () => void;
}

export function SectPanel({ onClose }: Props) {
  const sectLevel = useGameStore((s) => s.sectLevel);
  const sectExp = useGameStore((s) => s.sectExp);
  const sectTotalContribution = useGameStore((s) => s.sectTotalContribution);
  const chi = useGameStore((s) => s.chi);
  const donateChiToSect = useGameStore((s) => s.donateChiToSect);

  const donatable = Math.floor(chi / CHI_PER_CONTRIBUTION);
  const maxed = sectLevel >= SECT_MAX_LEVEL;

  return (
    <div id="sect-panel" className="stat-panel">
      <div className="panel-header">
        <span>문파</span>
        <button onClick={onClose}>닫기</button>
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
          내공 {CHI_PER_CONTRIBUTION.toLocaleString()} = 기여도 1 (보유 내공 {chi.toLocaleString()})
        </div>
        <button className="gong-upgrade-btn" disabled={maxed || donatable <= 0} onClick={donateChiToSect}>
          {maxed ? "대성" : `내공 기부 (기여도 +${donatable})`}
        </button>
      </div>
    </div>
  );
}
