import { useGameStore, WEAPON_MAX_LEVEL, weaponUpgradeCost } from "../../game/store";
import { useHoldRepeat } from "../../hooks/useHoldRepeat";

interface Props {
  onClose: () => void;
}

export function EquipPanel({ onClose }: Props) {
  const weaponLevel = useGameStore((s) => s.weaponLevel);
  const gold = useGameStore((s) => s.gold);
  const upgradeWeapon = useGameStore((s) => s.upgradeWeapon);

  const maxed = weaponLevel >= WEAPON_MAX_LEVEL;
  const cost = weaponUpgradeCost(weaponLevel);
  const disabled = maxed || gold < cost;
  const hold = useHoldRepeat(upgradeWeapon, disabled);

  return (
    <div id="equip-panel" className="stat-panel">
      <div className="panel-header">
        <span>장구 — 무기</span>
        <button onClick={onClose}>닫기</button>
      </div>
      <div id="equip-node-list">
        <div className="gong-node">
          <span className="gong-node-name">무기 (병기)</span>
          <span className="gong-node-tier">+강화</span>
          <span className="gong-node-level">
            +{weaponLevel}/{WEAPON_MAX_LEVEL}
          </span>
          <button className="gong-upgrade-btn" disabled={disabled} {...hold}>
            {maxed ? "대성" : `강화 (전 ${cost.toLocaleString()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
