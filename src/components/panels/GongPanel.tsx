import { useGameStore, SAMJAE_BOARD, nodeLevel, nodeUpgradeCost, isNodeUnlocked } from "../../game/store";
import { useHoldRepeat } from "../../hooks/useHoldRepeat";

const TIER_LABEL = { primary: "1차", secondary: "2차", capstone: "캡스톤" } as const;

interface RowProps {
  node: (typeof SAMJAE_BOARD)[number];
}

function GongNodeRow({ node }: RowProps) {
  const gongLevels = useGameStore((s) => s.gongLevels);
  const chi = useGameStore((s) => s.chi);
  const buyGongUpgrade = useGameStore((s) => s.buyGongUpgrade);

  const lv = nodeLevel(node, gongLevels);
  const unlocked = isNodeUnlocked(node, gongLevels);
  const maxed = lv >= node.maxLevel;
  const cost = nodeUpgradeCost(node, lv);
  const disabled = !unlocked || maxed || chi < cost;

  const hold = useHoldRepeat(() => buyGongUpgrade(node.id), disabled);

  let label: string;
  if (!unlocked) label = "잠금";
  else if (maxed) label = "대성";
  else label = `강화 (내공 ${cost.toLocaleString()})`;

  return (
    <div className={"gong-node" + (unlocked ? "" : " gong-node-locked")}>
      <span className="gong-node-name">{node.name}</span>
      <span className="gong-node-tier">{TIER_LABEL[node.tier]}</span>
      <span className="gong-node-level">
        Lv.{lv}/{node.maxLevel}
      </span>
      <button className="gong-upgrade-btn" disabled={disabled} {...hold}>
        {label}
      </button>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export function GongPanel({ onClose }: Props) {
  return (
    <div id="gong-panel" className="stat-panel">
      <div className="panel-header">
        <span>삼재검법 1보</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="gong-node-list">
        {SAMJAE_BOARD.map((node) => (
          <GongNodeRow key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
