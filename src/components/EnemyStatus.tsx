import { useGameStore } from '../game/store';

export const EnemyStatus = () => {
  const name = useGameStore((s) => s.enemy.name);
  const hp = useGameStore((s) => s.enemyHp);
  const maxHp = useGameStore((s) => s.enemy.hp);

  const hpPercent = Math.max(0, (hp / maxHp) * 100);

  return (
    <div id="enemy-status">
      <span>{name}</span>
      <div className="bar hp-bar">
        <div className="bar-fill" style={{ width: `${hpPercent}%` }} />
      </div>
    </div>
  );
};
