import { useGameStore, expToNextLevel } from "../game/store";

export function PlayerStatus() {
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const playerHp = useGameStore((s) => s.playerHp);
  const playerMaxHp = useGameStore((s) => s.player.hp);
  const playerName = useGameStore((s) => s.player.name);

  const hpPercent = Math.max(0, (playerHp / playerMaxHp) * 100);
  const expPercent = Math.min(100, (exp / expToNextLevel(level)) * 100);

  return (
    <div id="player-status">
      <span>{playerName} · Lv.{level}</span>
      <div className="bar hp-bar">
        <div className="bar-fill" style={{ width: `${hpPercent}%` }} />
      </div>
      <div className="bar exp-bar">
        <div className="bar-fill" style={{ width: `${expPercent}%` }} />
      </div>
    </div>
  );
}
