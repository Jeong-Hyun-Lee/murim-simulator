import { useEffect, useRef, useState } from 'react';
import { useGameStore, isStageAtOrBefore, type StageId } from '../../game/store';
import { FINAL_MAJOR } from '../../game/combat';
import { stageLabel } from '../common';

const MAJORS = Array.from({ length: FINAL_MAJOR }, (_, i) => i + 1);
const SUBS = Array.from({ length: 10 }, (_, i) => i + 1);

const sameStage = (a: StageId | null, b: StageId | null): boolean =>
  !!a && !!b && a.major === b.major && a.sub === b.sub;

// 이미 지나온 스테이지를 골라 반복 사냥하는 상세 화면. 행 선택만으로는 이동하지 않고
// 하단 버튼으로 적용 — 뒤로 가면 선택은 버려진다. 실행 가능 여부는 store의 startFarming 판정.
export const StagePicker = ({ onBack }: { onBack: () => void }) => {
  const stage = useGameStore((s) => s.stage);
  const farmReturnStage = useGameStore((s) => s.farmReturnStage);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const awaitingBossReward = useGameStore((s) => s.awaitingBossReward);
  const startFarming = useGameStore((s) => s.startFarming);
  const stopFarming = useGameStore((s) => s.stopFarming);

  const frontier = farmReturnStage ?? stage;
  const [openMajor, setOpenMajor] = useState(stage.major);
  const [selected, setSelected] = useState<StageId | null>(null);
  const openRowRef = useRef<HTMLButtonElement>(null);

  // 처음 열 때 현재 대스테이지가 보이도록 스크롤.
  useEffect(() => {
    openRowRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  let blockedReason: string | null = null;
  if (awaitingBossReward) blockedReason = '보스 보상을 확인한 뒤 이동할 수 있습니다.';
  else if (awaitingBossChallenge) blockedReason = '보스 도전 대기 중에는 이동할 수 없습니다.';

  const apply = () => {
    if (!selected) return;
    startFarming(selected);
    onBack();
  };

  let applyLabel = '사냥터를 선택하세요';
  if (selected && sameStage(selected, frontier)) applyLabel = '등반 위치로 복귀';
  else if (selected) applyLabel = `${stageLabel(selected)}에서 반복 사냥`;

  return (
    <div className="picker stage-picker">
      <div className="card picker-pinned stage-picker-summary">
        <div className="stage-picker-summary-row">
          <span>현재 전투</span>
          <strong>{stageLabel(stage)}</strong>
          <em>{farmReturnStage ? '반복 사냥 중' : '자동 등반 중'}</em>
        </div>
        <div className="stage-picker-summary-row">
          <span>등반 위치</span>
          <strong>{stageLabel(frontier)}</strong>
          <em>도달 지점</em>
        </div>
        <p className="stage-picker-help">이미 클리어한 사냥터를 골라 반복 사냥할 수 있습니다.</p>
        {farmReturnStage && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              stopFarming();
              onBack();
            }}
          >
            등반 위치로 복귀
          </button>
        )}
      </div>

      <ul className="list stage-major-list">
        {MAJORS.map((major) => {
          const reached = major <= frontier.major;
          const open = openMajor === major && reached;
          let majorHint = '미도달';
          if (reached) majorHint = open ? '접기' : '펼치기';
          return (
            <li key={major}>
              <button
                ref={major === stage.major ? openRowRef : undefined}
                type="button"
                className={`list-row stage-major-row${open ? ' stage-major-row-open' : ''}`}
                aria-expanded={open}
                disabled={!reached}
                onClick={() => setOpenMajor(open ? 0 : major)}
              >
                <span className="stage-major-title">
                  <b>대{major}</b>
                  <small>사냥터 {major * 10 - 9}–{major * 10}</small>
                </span>
                <span className={`stage-major-state${reached ? '' : ' stage-major-state-locked'}`}>
                  {majorHint}
                </span>
              </button>
              {open && (
                <ul className="list list-nested stage-option-list">
                  {SUBS.map((sub) => {
                    const target: StageId = { major, sub };
                    const reachable = isStageAtOrBefore(target, frontier);
                    const isSelected = sameStage(selected, target);
                    let state = '미도달';
                    if (isSelected) state = '선택됨';
                    else if (sameStage(target, stage)) state = '현재 전투';
                    else if (sameStage(target, frontier)) state = '등반 위치';
                    else if (reachable) state = '클리어';
                    return (
                      <li key={sub}>
                        <button
                          type="button"
                          className={`list-row stage-option-row${isSelected ? ' list-row-selected' : ''}`}
                          aria-pressed={isSelected}
                          disabled={!reachable}
                          onClick={() => setSelected(target)}
                        >
                          <span className="stage-option-title">
                            <b>{stageLabel(target)}</b>
                            <small>{sub === 10 ? '보스 구역' : '일반 구역'}</small>
                          </span>
                          <span className={`stage-option-state stage-option-state-${state.replace(' ', '-')}`}>
                            {state}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="sticky-actions">
        {blockedReason && <p className="warn">{blockedReason}</p>}
        <p className="stage-selection-summary">
          {selected ? `선택한 사냥터 · ${stageLabel(selected)}` : '반복 사냥할 사냥터를 선택하세요'}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!selected || !!blockedReason}
          onClick={apply}
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
};
