import {
  useGameStore,
  totalGongBuffPercent,
  totalGongSecondaryStats,
  aggregateEquipStats,
  rebirthBuffPercent,
  sectBuffPercent,
} from "../../game/store";
import { combatPower } from "../../game/combat";

interface Props {
  onClose: () => void;
}

function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

// 성장 요소(레벨/무공/장구/문파/환골탈태)를 한 화면에서 확인할 수 있는 종합 스탯창.
export function StatPanel({ onClose }: Props) {
  const player = useGameStore((s) => s.player);
  const playerHp = useGameStore((s) => s.playerHp);
  const level = useGameStore((s) => s.level);
  const gongLevels = useGameStore((s) => s.gongLevels);
  const equippedItems = useGameStore((s) => s.equippedItems);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const sectLevel = useGameStore((s) => s.sectLevel);

  const gongPower = totalGongBuffPercent(gongLevels);
  const gongSecondary = totalGongSecondaryStats(gongLevels);
  const equip = aggregateEquipStats(equippedItems);
  const rebirthPower = rebirthBuffPercent(rebirthCount);
  const sectPower = sectBuffPercent(sectLevel);

  return (
    <div id="stat-panel" className="stat-panel">
      <div className="panel-header">
        <span>스탯</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="stat-body">
        <div className="stat-section">
          <div className="stat-section-title">기본</div>
          <div className="stat-row"><span>레벨</span><span>{level}</span></div>
          <div className="stat-row"><span>전투력</span><span>{combatPower(player).toLocaleString()}</span></div>
          <div className="stat-row"><span>체력</span><span>{Math.max(0, Math.round(playerHp)).toLocaleString()} / {player.hp.toLocaleString()}</span></div>
          <div className="stat-row"><span>공격력</span><span>{player.atk.toLocaleString()}</span></div>
          <div className="stat-row"><span>방어력</span><span>{player.def.toLocaleString()}</span></div>
        </div>

        <div className="stat-section">
          <div className="stat-section-title">전투 특성</div>
          <div className="stat-row"><span>치명타 확률</span><span>{pct(player.critChance * 100)}</span></div>
          <div className="stat-row"><span>치명타 피해</span><span>{pct(player.critMultiplier * 100)}</span></div>
          <div className="stat-row"><span>공격속도</span><span>+{pct(player.attackSpeedPercent)}</span></div>
          <div className="stat-row"><span>회피율</span><span>{pct(player.evasion * 100)}</span></div>
          <div className="stat-row"><span>내공 획득량</span><span>{pct(player.chiGainMultiplier * 100)}</span></div>
        </div>

        <div className="stat-section">
          <div className="stat-section-title">성장 요소별 기여도</div>
          <div className="stat-row"><span>무공 (ATK/DEF/HP 버프)</span><span>+{pct(gongPower)}</span></div>
          <div className="stat-row"><span>문파 버프</span><span>+{pct(sectPower)}</span></div>
          <div className="stat-row"><span>환골탈태 버프</span><span>+{pct(rebirthPower)}</span></div>
          <div className="stat-row"><span>장구 강화 버프</span><span>+{pct(equip.enhanceBuffPercent)}</span></div>
          <div className="stat-row-sub"><span>· 무공(질풍살검) 치명타확률/피해/공속/회피</span><span>+{pct(gongSecondary.critChancePercent)} / +{pct(gongSecondary.critDamagePercent)} / +{pct(gongSecondary.attackSpeedPercent)} / +{pct(gongSecondary.evasionPercent)}</span></div>
          <div className="stat-row-sub"><span>· 장구 치명타확률/피해/공속/회피/내공획득</span><span>+{pct(equip.critChancePercent)} / +{pct(equip.critDamagePercent)} / +{pct(equip.attackSpeedPercent)} / +{pct(equip.evasionPercent)} / +{pct(equip.chiGainPercent)}</span></div>
        </div>
      </div>
    </div>
  );
}
