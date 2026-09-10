import { useGameStore, isBossStage } from "../game/store";
import type { PanelKey } from "../App";

interface Props {
  onTogglePanel: (key: PanelKey) => void;
}

export function TopBar({ onTogglePanel }: Props) {
  const stage = useGameStore((s) => s.stage);
  const gold = useGameStore((s) => s.gold);
  const chi = useGameStore((s) => s.chi);
  const elixir = useGameStore((s) => s.elixir);
  const paused = useGameStore((s) => s.paused);
  const togglePause = useGameStore((s) => s.togglePause);

  return (
    <div id="top-bar">
      <span>
        {stage.major}-{stage.sub}
        {isBossStage(stage) ? " (보스)" : ""}
      </span>
      <span>전 {gold.toLocaleString()}</span>
      <span>내공 {chi.toLocaleString()}</span>
      <span>영약 {elixir.toLocaleString()}</span>
      <button className="topbar-btn" onClick={() => onTogglePanel("gong")}>무공</button>
      <button className="topbar-btn" onClick={() => onTogglePanel("equip")}>장구</button>
      <button className="topbar-btn" onClick={() => onTogglePanel("rebirth")}>환골탈태</button>
      <button className="topbar-btn" onClick={() => onTogglePanel("sect")}>문파</button>
      <button className="topbar-btn" onClick={() => onTogglePanel("gacha")}>기연</button>
      <button className="topbar-btn" onClick={togglePause}>{paused ? "재개" : "일시정지"}</button>
    </div>
  );
}
