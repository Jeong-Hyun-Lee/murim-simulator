import { useState } from "react";
import { useGameStore, isBossStage, isStageAtOrBefore, type StageId } from "../../game/store";

const MAJORS = Array.from({ length: 10 }, (_, i) => i + 1);
const SUBS = Array.from({ length: 10 }, (_, i) => i + 1);

interface Props {
  onClose: () => void;
}

// 보스(혹은 잡몹)에게 막혀 강해질 필요가 있을 때, 이미 지나온 스테이지를 골라 반복 사냥할 수
// 있게 하는 패널. 자동 등반이 멈춰 있던 스테이지보다 앞선 곳은 선택할 수 없다.
export function StagePanel({ onClose }: Props) {
  const stage = useGameStore((s) => s.stage);
  const farmReturnStage = useGameStore((s) => s.farmReturnStage);
  const startFarming = useGameStore((s) => s.startFarming);

  const frontier = farmReturnStage ?? stage;
  const [selectedMajor, setSelectedMajor] = useState(frontier.major);

  function handlePick(sub: number) {
    const target: StageId = { major: selectedMajor, sub };
    if (!isStageAtOrBefore(target, frontier)) return;
    startFarming(target);
    onClose();
  }

  return (
    <div id="stage-panel" className="stat-panel">
      <div className="panel-header">
        <span>사냥터</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="stage-body-desc">
        이미 지나온 스테이지를 선택해 반복 사냥할 수 있습니다. 자동 등반 스테이지({frontier.major}-{frontier.sub})는 그대로
        유지되며, 언제든 상단의 "자동 등반 복귀" 버튼으로 되돌아갈 수 있습니다.
      </div>
      <div id="stage-body">
        <div id="stage-major-tabs">
          {MAJORS.map((major) => {
            const unlocked = major <= frontier.major;
            return (
              <button
                key={major}
                disabled={!unlocked}
                className={"gong-board-tab" + (major === selectedMajor ? " gong-board-tab-active" : "") + (unlocked ? "" : " gong-board-tab-locked")}
                onClick={() => setSelectedMajor(major)}
              >
                대{major}
              </button>
            );
          })}
        </div>
        <div id="stage-sub-grid">
          {SUBS.map((sub) => {
            const target: StageId = { major: selectedMajor, sub };
            const unlocked = isStageAtOrBefore(target, frontier);
            const isCurrentFarm = farmReturnStage !== null && stage.major === selectedMajor && stage.sub === sub;
            return (
              <button
                key={sub}
                disabled={!unlocked}
                className={
                  "stage-cell" +
                  (unlocked ? "" : " stage-cell-locked") +
                  (isBossStage(target) ? " stage-cell-boss" : "") +
                  (isCurrentFarm ? " stage-cell-active" : "")
                }
                onClick={() => handlePick(sub)}
              >
                {selectedMajor}-{sub}
                {isBossStage(target) ? " (보스)" : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
