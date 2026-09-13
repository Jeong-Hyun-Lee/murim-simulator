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
  planChiBulkUpgrade,
  type GongBoard,
  type GongCurrency,
} from '../../game/store';
import type { GongStatKey } from '../../game/gongData';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';
import { Sheet } from '../Sheet';
import type { NavTarget } from '../common';

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
  tutorialLocked: boolean;
  tutorialHighlight: boolean;
}

// 모바일에서는 길게 누르기 반복 소비 없이 명시적 탭(1회 / 최대 10회)만 사용.
const GongNodeCard = ({ node, currency, tutorialLocked, tutorialHighlight }: CardProps) => {
  const gongLevels = useGameStore((s) => s.gongLevels);
  const balance = useGameStore((s) =>
    currency === 'contribution' ? s.sectContributionPoints : s.chi,
  );
  const buyGongUpgrade = useGameStore((s) => s.buyGongUpgrade);
  const buyGongUpgradeBulk10 = useGameStore((s) => s.buyGongUpgradeBulk10);

  const lv = nodeLevel(node, gongLevels);
  const unlocked = isNodeUnlocked(node, gongLevels);
  const maxed = lv >= node.maxLevel;
  const cost = nodeUpgradeCost(node, lv);
  const bulk = nodeBulkUpgrade(node, lv);
  const singleDisabled = !unlocked || maxed || balance < cost || tutorialLocked;
  const hold = useHoldRepeat(() => buyGongUpgrade(node.id), singleDisabled);
  const currencyLabel = CURRENCY_LABEL[currency];
  const effectLabel = EFFECT_LABEL[node.statKey ?? 'power'];
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
        <strong>{node.name}</strong>
        <span className="tag">{TIER_LABEL[node.tier]}</span>
        <span className="gong-card-level">
          Lv.{lv}/{node.maxLevel}
        </span>
      </div>
      <p className="muted">
        {effectLabel} +{(lv * node.effectPerLevel).toFixed(2)}%
        {!maxed && ` → 다음 +${((lv + 1) * node.effectPerLevel).toFixed(2)}%`}
        {maxed && ' · 대성'}
      </p>
      {!unlocked && <p className="warn">{missing.join(', ')} 필요</p>}
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
            1회 연마
            <small>
              {currencyLabel} {cost.toLocaleString()}
            </small>
          </button>
          {bulk.levelsGained > 1 && (
            <button
              type="button"
              className="btn"
              disabled={balance < bulk.cost || tutorialLocked}
              onClick={() => buyGongUpgradeBulk10(node.id)}
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

const planNow = () => {
  const s = useGameStore.getState();
  return { chi: s.chi, ...planChiBulkUpgrade(s.chi, s.gongLevels, s.highestMajorCleared) };
};

// 실행 전 대상 범위·예상 횟수·총소비·잔액을 보여주고, 실행 시 최신 상태로 다시 계산해 달라졌으면
// 갱신된 요약을 한 번 더 확인받는다.
const BulkAllSheet = ({ onClose }: { onClose: () => void }) => {
  const bulkUpgradeAllGong = useGameStore((s) => s.bulkUpgradeAllGong);
  const [preview, setPreview] = useState(planNow);
  const [changed, setChanged] = useState(false);

  const execute = () => {
    const latest = planNow();
    if (latest.purchased !== preview.purchased || latest.spent !== preview.spent) {
      setPreview(latest);
      setChanged(true);
      return;
    }
    bulkUpgradeAllGong();
    onClose();
  };

  return (
    <Sheet title="전체 내공 연마" onClose={onClose}>
      <p>
        해금된 <strong>모든 내공 무공 보드</strong>에서 가장 싼 초식부터 내공이 떨어질 때까지
        연마합니다. 기여도로 연마하는 보드는 제외됩니다.
      </p>
      <dl className="stat-list">
        <div className="stat-row">
          <dt>예상 연마 횟수</dt>
          <dd>{preview.purchased.toLocaleString()}회</dd>
        </div>
        <div className="stat-row">
          <dt>총 소비 내공</dt>
          <dd>{preview.spent.toLocaleString()}</dd>
        </div>
        <div className="stat-row">
          <dt>연마 후 내공 잔액</dt>
          <dd>{(preview.chi - preview.spent).toLocaleString()}</dd>
        </div>
      </dl>
      {changed && (
        <p className="warn">보유 내공이나 대상이 바뀌어 요약을 갱신했습니다. 다시 확인하세요.</p>
      )}
      <div className="btn-row">
        <button type="button" className="btn" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={preview.purchased === 0}
          onClick={execute}
        >
          연마 실행
        </button>
      </div>
    </Sheet>
  );
};

interface Props {
  boardId: string;
  onBoardChange: (boardId: string) => void;
  onNavigate: (target: NavTarget) => void;
}

export const GongPanel = ({ boardId, onBoardChange, onNavigate }: Props) => {
  const gongLevels = useGameStore((s) => s.gongLevels);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const tutorialGongDone = useGameStore((s) => s.tutorialGongDone);
  const markTutorialGongDone = useGameStore((s) => s.markTutorialGongDone);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [tutorialJustDone, setTutorialJustDone] = useState(false);

  const tutorialActive = onboardingDone && !tutorialGongDone;
  const unlockCtx = { highestMajorCleared, gongLevels };
  const requested = GONG_BOARDS.find((b) => b.id === boardId) ?? GONG_BOARDS[0];
  // 환골탈태 등으로 선택 보드가 잠기면 첫 보드로 표시.
  const selectedBoard =
    tutorialActive || !isBoardUnlocked(requested, unlockCtx) ? GONG_BOARDS[0] : requested;
  const boardBalance = useGameStore((s) =>
    selectedBoard.currency === 'contribution' ? s.sectContributionPoints : s.chi,
  );
  const cheapestCost = Math.min(
    ...selectedBoard.nodes
      .filter((n) => isNodeUnlocked(n, gongLevels) && nodeLevel(n, gongLevels) < n.maxLevel)
      .map((n) => nodeUpgradeCost(n, nodeLevel(n, gongLevels))),
  );
  const shortage =
    Number.isFinite(cheapestCost) && boardBalance < cheapestCost ? cheapestCost - boardBalance : 0;

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
        <span>
          <strong>{selectedBoard.name}</strong> · {CURRENCY_LABEL[selectedBoard.currency]}
        </span>
        <span>
          완성도 {boardCompletionPercent(selectedBoard, gongLevels)}% {pickerOpen ? '▴' : '▾'}
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

      {shortage > 0 && !tutorialActive && (
        <div className="banner">
          <span>
            {CURRENCY_LABEL[selectedBoard.currency]} {shortage.toLocaleString()} 부족
          </span>
          {selectedBoard.currency === 'contribution' ? (
            <button type="button" className="btn" onClick={() => onNavigate('sect')}>
              문파 기부
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => onNavigate('stagePicker')}>
              사냥터 보기
            </button>
          )}
        </div>
      )}

      <p className="muted small">1회 연마 버튼을 길게 누르면 연속으로 연마합니다.</p>
      <div className="card-list">
        {selectedBoard.nodes.map((node) => (
          <GongNodeCard
            key={node.id}
            node={node}
            currency={selectedBoard.currency}
            tutorialLocked={tutorialActive && node.id !== TUTORIAL_NODE_ID}
            tutorialHighlight={tutorialActive && node.id === TUTORIAL_NODE_ID}
          />
        ))}
      </div>

      <div className="sticky-actions">
        <button
          type="button"
          className="btn btn-block"
          disabled={tutorialActive}
          onClick={() => setBulkOpen(true)}
        >
          전체 내공 연마
        </button>
      </div>
      {bulkOpen && <BulkAllSheet onClose={() => setBulkOpen(false)} />}
    </div>
  );
};
