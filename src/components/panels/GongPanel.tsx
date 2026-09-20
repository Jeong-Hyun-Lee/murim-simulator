import { useEffect, useState } from 'react';
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
} from '../../game/store';
import type { GongStatKey } from '../../game/gongData';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';

const TIER_LABEL = { primary: '1차', secondary: '2차', capstone: '오의' } as const;
const CURRENCY_LABEL: Record<GongCurrency, string> = { chi: '내공', contribution: '기여도' };
const EFFECT_LABEL: Record<GongStatKey, string> = {
  power: '공격·방어·체력',
  critChance: '치명타 확률',
  critDamage: '치명타 피해',
  attackSpeed: '공격속도',
  evasion: '회피율',
  chiGain: '내공 획득량',
};
// 첫 성장 안내에서 강제로 여는 노드("휘두르기" 역할).
const TUTORIAL_NODE_ID = 'cheon';

const NODE_NAME = new Map(GONG_BOARDS.flatMap((b) => b.nodes).map((n) => [n.id, n.name]));

interface CardProps {
  node: GongBoard['nodes'][number];
  currency: GongCurrency;
  multiplicative: boolean;
  tutorialLocked: boolean;
  tutorialHighlight: boolean;
}

const GongNodeCard = ({
  node,
  currency,
  multiplicative,
  tutorialLocked,
  tutorialHighlight,
}: CardProps) => {
  const gongLevels = useGameStore((s) => s.gongLevels);
  const balance = useGameStore((s) =>
    currency === 'contribution' ? s.sectContributionPoints : s.chi,
  );
  const buyGongUpgrade = useGameStore((s) => s.buyGongUpgrade);

  const lv = nodeLevel(node, gongLevels);
  const unlocked = isNodeUnlocked(node, gongLevels);
  const maxed = lv >= node.maxLevel;
  const cost = nodeUpgradeCost(node, lv);
  const bulk = nodeBulkUpgrade(node, lv);
  const singleDisabled = !unlocked || maxed || balance < cost || tutorialLocked;
  const hold = useHoldRepeat(() => buyGongUpgrade(node.id), singleDisabled);
  // 버튼이 사라지는 조건(대성 임박으로 1회분만 남음)도 포함해야 반복이 즉시 멈춘다.
  const bulkDisabled =
    !unlocked || maxed || bulk.levelsGained <= 1 || balance < bulk.cost || tutorialLocked;
  const bulkHold = useHoldRepeat(
    () => useGameStore.getState().buyGongUpgradeBulk10(node.id),
    bulkDisabled,
  );
  const currencyLabel = CURRENCY_LABEL[currency];
  // 곱연산 보드는 다른 버프와 합산되지 않고 따로 곱해진다는 점을 표시.
  const effectLabel = `${EFFECT_LABEL[node.statKey ?? 'power']}${multiplicative ? '(곱연산)' : ''}`;
  const missing = (node.requires ?? [])
    .filter((r) => (gongLevels[r.nodeId] ?? 0) < r.level)
    .map((r) => `${NODE_NAME.get(r.nodeId)} Lv.${r.level}`);

  return (
    <article
      className={`card gong-card${unlocked ? '' : ' gong-card-locked'}${
        tutorialHighlight ? ' gong-card-tutorial' : ''
      }`}
    >
      <div className="gong-card-head">
        <div className="gong-card-title">
          <span style={{ display: 'inline-flex' }}>
            <img
              src={`/ui/label/tag-tier-${node.tier}.webp`}
              alt={TIER_LABEL[node.tier]}
              className="tag-img"
            />
          </span>
          <strong>{node.name}</strong>
        </div>
        <span className="gong-card-level">
          Lv.{lv}/{node.maxLevel}
        </span>
      </div>
      <div className="gong-card-effect">
        <span>{effectLabel}</span>
        <strong>
          현재 +{(lv * node.effectPerLevel).toFixed(2)}%
          {!maxed && ` · 다음 +${((lv + 1) * node.effectPerLevel).toFixed(2)}%`}
          {maxed && ' · 대성'}
        </strong>
      </div>
      {!unlocked && (
        <p className="warn gong-card-requirement">
          <img
            src="/ui/icon/icon-lock.webp"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            style={{ verticalAlign: 'middle', marginRight: 4 }}
          />
          해금 조건 · {missing.join(', ')}
        </p>
      )}
      {unlocked && !maxed && (
        <div className="btn-row">
          {/* useHoldRepeat이 반환하는 누르기/떼기/이동/클릭 핸들러 묶음 — 개별 나열하면 훅 캡슐화가 깨짐 */}
          <button
            type="button"
            className="btn btn-primary hold-btn"
            disabled={singleDisabled}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...hold}
          >
            <img
              src="/ui/label/label-train-once.webp"
              alt="1회 연마"
              style={{ height: '1.1em', display: 'block' }}
            />
            <small>
              {currencyLabel} {cost.toLocaleString()}
            </small>
          </button>
          {bulk.levelsGained > 1 && (
            <button
              type="button"
              className="btn hold-btn"
              disabled={bulkDisabled}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...bulkHold}
            >
              {bulk.levelsGained}회 연마
              <small>
                {currencyLabel} {bulk.cost.toLocaleString()}
              </small>
            </button>
          )}
        </div>
      )}
    </article>
  );
};

interface Props {
  boardId: string;
  onBoardChange: (boardId: string) => void;
}

export const GongPanel = ({ boardId, onBoardChange }: Props) => {
  const gongLevels = useGameStore((s) => s.gongLevels);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const markTutorialGongDone = useGameStore((s) => s.markTutorialGongDone);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tutorialJustDone, setTutorialJustDone] = useState(false);

  const tutorialActive = onboardingDone && !tutorialGongDone;
  const unlockCtx = { highestMajorCleared, gongLevels };
  const requested = GONG_BOARDS.find((b) => b.id === boardId) ?? GONG_BOARDS[0];
  // 환골탈태 등으로 선택 보드가 잠기면 첫 보드로 표시.
  const selectedBoard =
    tutorialActive || !isBoardUnlocked(requested, unlockCtx) ? GONG_BOARDS[0] : requested;

  useEffect(() => {
    if (tutorialActive && (gongLevels[TUTORIAL_NODE_ID] ?? 0) >= 1) {
      markTutorialGongDone();
      setTutorialJustDone(true);
    }
  }, [tutorialActive, gongLevels, markTutorialGongDone]);

  return (
    <div className="gong-tab">
      {tutorialActive && (
        <div className="banner">
          첫 성장: &quot;제1식 천(天)&quot;을 1회 연마해 보세요. 연마하면 능력치가 바로 오릅니다.
        </div>
      )}
      {tutorialJustDone && (
        <div className="banner banner-done">
          <span>첫 연마 완료! 공격·방어·체력이 올랐습니다.</span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setTutorialJustDone(false);
            }}
          >
            확인
          </button>
        </div>
      )}

      <button
        type="button"
        className="board-picker-btn"
        aria-expanded={pickerOpen}
        disabled={tutorialActive}
        onClick={() => setPickerOpen((v) => !v)}
      >
        <span className="board-picker-title">
          <strong>{selectedBoard.name}</strong>
          <small>{CURRENCY_LABEL[selectedBoard.currency]}으로 연마</small>
        </span>
        <span className="board-picker-progress">
          <small>완성도</small>
          <strong>{boardCompletionPercent(selectedBoard, gongLevels)}%</strong>
          <img
            src="/ui/icon/icon-dropdown.webp"
            alt=""
            aria-hidden="true"
            style={{ width: 16, height: 16, transform: pickerOpen ? 'rotate(180deg)' : 'none' }}
          />
        </span>
      </button>
      {pickerOpen && (
        <ul className="list">
          {GONG_BOARDS.map((board) => {
            const unlocked = isBoardUnlocked(board, unlockCtx);
            return (
              <li key={board.id}>
                <button
                  type="button"
                  className={`list-row${board.id === selectedBoard.id ? ' list-row-selected' : ''}`}
                  aria-pressed={board.id === selectedBoard.id}
                  disabled={!unlocked}
                  onClick={() => {
                    onBoardChange(board.id);
                    setPickerOpen(false);
                  }}
                >
                  <span>
                    {unlocked ? '' : '🔒 '}
                    {board.name}
                    <small className="muted"> · {CURRENCY_LABEL[board.currency]}</small>
                  </span>
                  <span className="muted">
                    {unlocked
                      ? `${boardCompletionPercent(board, gongLevels)}%`
                      : boardUnlockLabel(board)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="gong-hold-tip">
        <img
          src="/ui/icon/icon-hold.webp"
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          style={{ verticalAlign: 'middle', marginRight: 4 }}
        />
        1회 연마 버튼을 길게 누르면 연속으로 연마합니다.
      </p>
      <div className="card-list">
        {selectedBoard.nodes.map((node) => (
          <GongNodeCard
            key={node.id}
            node={node}
            currency={selectedBoard.currency}
            multiplicative={!!selectedBoard.multiplicative}
            tutorialLocked={tutorialActive && node.id !== TUTORIAL_NODE_ID}
            tutorialHighlight={tutorialActive && node.id === TUTORIAL_NODE_ID}
          />
        ))}
      </div>
    </div>
  );
};
