import { useState } from "react";
import {
  useGameStore,
  GONG_BOARDS,
  nodeLevel,
  nodeUpgradeCost,
  isNodeUnlocked,
  isBoardUnlocked,
  boardCompletionPercent,
  type GongBoard,
} from "../../game/store";
import { useHoldRepeat } from "../../hooks/useHoldRepeat";

const TIER_LABEL = { primary: "1차", secondary: "2차", capstone: "캡스톤" } as const;

interface RowProps {
  node: GongBoard["nodes"][number];
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
  const gongLevels = useGameStore((s) => s.gongLevels);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const [selectedId, setSelectedId] = useState(GONG_BOARDS[0].id);

  const selectedBoard = GONG_BOARDS.find((b) => b.id === selectedId) ?? GONG_BOARDS[0];
  const selectedUnlocked = isBoardUnlocked(selectedBoard, highestMajorCleared);

  return (
    <div id="gong-panel" className="stat-panel">
      <div className="panel-header">
        <span>무공</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="gong-body">
        <div id="gong-board-tabs">
          {GONG_BOARDS.map((board) => {
            const unlocked = isBoardUnlocked(board, highestMajorCleared);
            return (
              <button
                key={board.id}
                className={"gong-board-tab" + (board.id === selectedId ? " gong-board-tab-active" : "") + (unlocked ? "" : " gong-board-tab-locked")}
                onClick={() => setSelectedId(board.id)}
              >
                {unlocked ? board.name : `🔒 ${board.name}`}
                {unlocked && <span className="gong-board-tab-percent"> {boardCompletionPercent(board, gongLevels)}%</span>}
              </button>
            );
          })}
        </div>
        <div id="gong-node-list">
          {selectedUnlocked ? (
            selectedBoard.nodes.map((node) => <GongNodeRow key={node.id} node={node} />)
          ) : (
            <div className="gong-board-locked-message">대{selectedBoard.unlockMajor} 보스 클리어 후 해금됩니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
