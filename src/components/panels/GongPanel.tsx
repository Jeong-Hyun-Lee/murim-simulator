import { useEffect, useState } from "react";
import {
  useGameStore,
  GONG_BOARDS,
  nodeLevel,
  nodeUpgradeCost,
  nodeBulkUpgrade,
  isNodeUnlocked,
  isBoardUnlocked,
  boardCompletionPercent,
  boardUnlockLabel,
  type GongBoard,
  type GongCurrency,
} from "../../game/store";
import { useHoldRepeat } from "../../hooks/useHoldRepeat";

const TIER_LABEL = { primary: "1차", secondary: "2차", capstone: "캡스톤" } as const;
const CURRENCY_LABEL: Record<GongCurrency, string> = { chi: "내공", contribution: "기여도" };
// wiki/concepts/ux-시나리오-기획서.md 4장 5단계: 튜토리얼 강제 개방 대상 노드("휘두르기" 역할).
const TUTORIAL_NODE_ID = "cheon";

interface RowProps {
  node: GongBoard["nodes"][number];
  currency: GongCurrency;
  tutorialLocked: boolean;
  tutorialHighlight: boolean;
}

function GongNodeRow({ node, currency, tutorialLocked, tutorialHighlight }: RowProps) {
  const gongLevels = useGameStore((s) => s.gongLevels);
  const balance = useGameStore((s) => (currency === "contribution" ? s.sectContributionPoints : s.chi));
  const buyGongUpgrade = useGameStore((s) => s.buyGongUpgrade);
  const buyGongUpgradeBulk10 = useGameStore((s) => s.buyGongUpgradeBulk10);

  const lv = nodeLevel(node, gongLevels);
  const unlocked = isNodeUnlocked(node, gongLevels);
  const maxed = lv >= node.maxLevel;
  const cost = nodeUpgradeCost(node, lv);
  const disabled = !unlocked || maxed || balance < cost || tutorialLocked;

  const bulk = nodeBulkUpgrade(node, lv);
  const bulkDisabled = !unlocked || bulk.levelsGained <= 0 || balance < bulk.cost || tutorialLocked;

  const hold = useHoldRepeat(() => buyGongUpgrade(node.id), disabled);
  const currencyLabel = CURRENCY_LABEL[currency];

  let label: string;
  if (!unlocked) label = "잠금";
  else if (maxed) label = "대성";
  else label = `강화 (${currencyLabel} ${cost.toLocaleString()})`;

  return (
    <div
      className={"gong-node" + (unlocked ? "" : " gong-node-locked") + (tutorialHighlight ? " gong-node-tutorial-highlight" : "")}
    >
      <span className="gong-node-name">{node.name}</span>
      <span className="gong-node-tier">{TIER_LABEL[node.tier]}</span>
      <span className="gong-node-level">
        Lv.{lv}/{node.maxLevel}
      </span>
      {unlocked && !maxed && (
        <button
          className="gong-upgrade-btn gong-bulk-btn"
          disabled={bulkDisabled}
          onClick={() => buyGongUpgradeBulk10(node.id)}
        >
          {bulk.levelsGained}연마 ({currencyLabel} {bulk.cost.toLocaleString()})
        </button>
      )}
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
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const markTutorialGongDone = useGameStore((s) => s.markTutorialGongDone);
  const [selectedId, setSelectedId] = useState(GONG_BOARDS[0].id);

  const tutorialActive = onboardingDone && !tutorialGongDone;
  const effectiveSelectedId = tutorialActive ? GONG_BOARDS[0].id : selectedId;
  const selectedBoard = GONG_BOARDS.find((b) => b.id === effectiveSelectedId) ?? GONG_BOARDS[0];
  const unlockCtx = { highestMajorCleared, gongLevels };
  const selectedUnlocked = isBoardUnlocked(selectedBoard, unlockCtx);

  useEffect(() => {
    if (tutorialActive && (gongLevels[TUTORIAL_NODE_ID] ?? 0) >= 1) {
      markTutorialGongDone();
    }
  }, [tutorialActive, gongLevels, markTutorialGongDone]);

  return (
    <div id="gong-panel" className="stat-panel">
      <div className="panel-header">
        <span>무공</span>
        <button className="panel-close-btn" disabled={tutorialActive} onClick={onClose}>닫기</button>
      </div>
      {tutorialActive && (
        <div className="tutorial-banner">첫 강화를 체험해보세요! "제1식 천(天)"을 강화하면 다음으로 넘어갑니다.</div>
      )}
      <div id="gong-body">
        <div id="gong-board-tabs">
          {GONG_BOARDS.map((board) => {
            const unlocked = isBoardUnlocked(board, unlockCtx);
            return (
              <button
                key={board.id}
                disabled={tutorialActive}
                className={
                  "gong-board-tab" +
                  (board.id === effectiveSelectedId ? " gong-board-tab-active" : "") +
                  (unlocked ? "" : " gong-board-tab-locked")
                }
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
            selectedBoard.nodes.map((node) => (
              <GongNodeRow
                key={node.id}
                node={node}
                currency={selectedBoard.currency}
                tutorialLocked={tutorialActive && node.id !== TUTORIAL_NODE_ID}
                tutorialHighlight={tutorialActive && node.id === TUTORIAL_NODE_ID}
              />
            ))
          ) : (
            <div className="gong-board-locked-message">{boardUnlockLabel(selectedBoard)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
