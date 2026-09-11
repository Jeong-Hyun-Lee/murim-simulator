import { useGameStore, expToNextLevel } from '../game/store';
import { combatPower } from '../game/combat';

export const PlayerStatus = () => {
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const playerHp = useGameStore((s) => s.playerHp);
  const player = useGameStore((s) => s.player);
  const playerName = player.name;
  const playerMaxHp = player.hp;

  const hpPercent = Math.max(0, (playerHp / playerMaxHp) * 100);
  const expPercent = Math.min(100, (exp / expToNextLevel(level)) * 100);

  return (
    <div id="player-status">
      <span>
        {playerName} · Lv.{level}
      </span>
      <span className="combat-power">전투력 {combatPower(player).toLocaleString()}</span>
      <div className="bar hp-bar">
        <div className="bar-fill" style={{ width: `${hpPercent}%` }} />
      </div>
      <div className="bar exp-bar">
        <div className="bar-fill" style={{ width: `${expPercent}%` }} />
      </div>
    </div>
  );
};
