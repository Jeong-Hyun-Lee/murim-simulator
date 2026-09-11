import { useGameStore, realmName, rebirthGateMajor, rebirthBuffPercent } from '../../game/store';

interface Props {
  onClose: () => void;
}

export const RebirthPanel = ({ onClose }: Props) => {
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const performRebirth = useGameStore((s) => s.performRebirth);

  const gateMajor = rebirthGateMajor(rebirthCount);
  const eligible = highestMajorCleared >= gateMajor;

  const handleClick = () => {
    if (
      !window.confirm(
        '환골탈태를 진행하시겠습니까? 레벨/스테이지/무공/내공이 초기화되고 되돌릴 수 없습니다.',
      )
    )
      return;
    performRebirth();
  };

  return (
    <div id="rebirth-panel" className="stat-panel">
      <div className="panel-header">
        <span>환골탈태(換骨奪胎)</span>
        <button type="button" className="panel-close-btn" onClick={onClose}>
          닫기
        </button>
      </div>
      <div id="rebirth-body">
        <div>
          현재 경지: <b>{realmName(rebirthCount)}</b> ({rebirthCount}회)
          <br />
          영구 스탯 버프: +{rebirthBuffPercent(rebirthCount)}%
          <br />
          다음 환골탈태 조건: 대{gateMajor} 보스 클리어 (현재 최고 클리어: 대{highestMajorCleared})
          <br />
          초기화됨: 레벨/스테이지 진행도/무공 노드/소지 내공
          <br />
          유지됨: 전(錢), 장비 강화 단계, 누적 환골탈태 횟수
        </div>
        <button
          type="button"
          className="gong-upgrade-btn"
          disabled={!eligible}
          onClick={handleClick}
        >
          {eligible ? '환골탈태 진행하기' : '조건 미충족'}
        </button>
      </div>
    </div>
  );
};
