import { useEffect, useRef, useState } from 'react';
import {
  useGameStore,
  isStageAtOrBefore,
  TOWER_TURN_LIMIT,
  TOWER_UNLOCK_MAJOR,
  type StageId,
} from '../../game/store';
import { monsterStats } from '../../game/combat';
import { MAJOR_STORIES } from '../../game/storyData';
import { stageLabel } from '../common';

const SUBS = Array.from({ length: 10 }, (_, i) => i + 1);

const sameStage = (a: StageId, b: StageId): boolean => a.major === b.major && a.sub === b.sub;

// 진입 카드 문구 "장소 — 한 줄"의 장소 부분.
const placeName = (major: number): string =>
  MAJOR_STORIES[major]?.intro.split(' — ')[0] ?? `대${major}`;

// 이미 지나온 스테이지를 골라 반복 사냥하는 팝업. 도달한 대스테이지만 최신순으로 보여주고,
// 소스테이지 칸을 누르면 바로 그곳으로 옮긴다. 실행 가능 여부는 store의 startFarming 판정.
export const StagePicker = ({ onBack }: { onBack: () => void }) => {
  const stage = useGameStore((s) => s.stage);
  const farmReturnStage = useGameStore((s) => s.farmReturnStage);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const awaitingBossReward = useGameStore((s) => s.awaitingBossReward);
  const startFarming = useGameStore((s) => s.startFarming);
  const stopFarming = useGameStore((s) => s.stopFarming);
  const towerBest = useGameStore((s) => s.towerBest);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const startTower = useGameStore((s) => s.startTower);

  const frontier = farmReturnStage ?? stage;
  const majors = Array.from({ length: frontier.major }, (_, i) => frontier.major - i);
  const [openMajor, setOpenMajor] = useState(stage.major);
  const openRowRef = useRef<HTMLButtonElement>(null);
  const blocked = !!awaitingBossReward || awaitingBossChallenge;
  const towerUnlocked = highestMajorCleared >= TOWER_UNLOCK_MAJOR;

  // 처음 열 때 현재 전투 중인 대스테이지가 보이도록 스크롤.
  useEffect(() => {
    openRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  const go = (target: StageId) => {
    startFarming(target);
    onBack();
  };

  return (
    <div className="stage-picker">
      <div className="stage-picker-summary">
        <div className="stage-picker-summary-item">
          <span>현재 전투</span>
          <strong>{stageLabel(stage)}</strong>
          <em>{farmReturnStage ? '반복 사냥' : '자동 등반'}</em>
        </div>
        <div className="stage-picker-summary-item">
          <span>등반 위치</span>
          <strong>{stageLabel(frontier)}</strong>
        </div>
        {farmReturnStage && (
          <button
            type="button"
            className="btn btn-primary stage-picker-return"
            onClick={() => {
              stopFarming();
              onBack();
            }}
          >
            등반
          </button>
        )}
      </div>
      <div className="setting-row tower-entry">
        <div>
          <strong>수련탑 · 최고 {towerBest}층</strong>
          <p>
            {towerUnlocked
              ? `${towerBest + 1}층부터 도전 — 적 공격 ${TOWER_TURN_LIMIT}회 안에 쓰러뜨리면 다음 층. 층마다 강화석, 10층마다 영약.`
              : `대${TOWER_UNLOCK_MAJOR} 보스를 처음 클리어하면 열립니다.`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!towerUnlocked || blocked}
          onClick={() => {
            startTower();
            onBack();
          }}
        >
          도전
        </button>
      </div>
      {blocked ? (
        <p className="warn">보스 확인 중에는 사냥터를 옮길 수 없습니다.</p>
      ) : (
        <p className="stage-picker-help">클리어한 칸을 누르면 그곳에서 반복 사냥합니다.</p>
      )}
      <p className="stage-sub-legend" aria-hidden="true">
        <span className="is-current">현재 전투</span>
        <span className="is-frontier">등반 위치</span>
      </p>

      <ul className="list stage-major-list">
        {majors.map((major) => {
          const open = openMajor === major;
          let badge = '';
          if (major === stage.major) badge = '현재';
          else if (major === frontier.major) badge = '등반 중';
          return (
            <li key={major}>
              <button
                ref={major === stage.major ? openRowRef : undefined}
                type="button"
                className={`list-row stage-major-row${open ? ' stage-major-row-open' : ''}`}
                aria-expanded={open}
                onClick={() => setOpenMajor(open ? 0 : major)}
              >
                <span className="stage-major-title">
                  <b>
                    대{major} · {placeName(major)}
                  </b>
                  <small>보스 {monsterStats({ major, sub: 10 }).name}</small>
                </span>
                <span className="stage-major-side">
                  {badge && <em className="stage-major-badge">{badge}</em>}
                  <span aria-hidden="true">{open ? '▴' : '▾'}</span>
                </span>
              </button>
              {open && (
                <div className="stage-sub-grid" role="group" aria-label={`대${major} 소스테이지`}>
                  {SUBS.map((sub) => {
                    const target: StageId = { major, sub };
                    const reachable = isStageAtOrBefore(target, frontier);
                    const isCurrent = sameStage(target, stage);
                    const isFrontier = sameStage(target, frontier);
                    let note = '';
                    if (isCurrent) note = ', 현재 전투';
                    else if (isFrontier) note = ', 등반 위치';
                    else if (!reachable) note = ', 미도달';
                    return (
                      <button
                        key={sub}
                        type="button"
                        className={`stage-sub-chip${isCurrent ? ' is-current' : ''}${
                          isFrontier ? ' is-frontier' : ''
                        }`}
                        aria-label={`${stageLabel(target)}${note}`}
                        aria-current={isCurrent ? 'true' : undefined}
                        disabled={!reachable || blocked || isCurrent}
                        onClick={() => go(target)}
                      >
                        {sub === 10 ? '보스' : sub}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
