import { useRef, useState } from 'react';
import { useGameStore, realmName, rebirthGateMajor, rebirthBuffPercent } from '../../game/store';

export const RebirthView = () => {
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const performRebirth = useGameStore((s) => s.performRebirth);
  const [result, setResult] = useState<{ realm: string; buff: number } | null>(null);
  // 결과 화면으로 바뀌기 전의 연타로 두 단계가 한 번에 오르지 않게 한 번만 실행.
  const executing = useRef(false);

  if (result) {
    return (
      <div className="rebirth">
        <section className="card action-card-reward">
          <h3>
            <img
              src="/ui/label/title-rebirth-done.webp"
              alt="환골탈태 완료"
              style={{ height: '1.1em', display: 'block' }}
            />
          </h3>
          <p>
            <strong>{result.realm}</strong> 경지에 올랐습니다. 영구 능력치 +{result.buff}%
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              executing.current = false;
              setResult(null);
            }}
          >
            <img
              src="/ui/label/label-confirm.webp"
              alt="확인"
              style={{ height: '1.1em', display: 'block' }}
            />
          </button>
        </section>
      </div>
    );
  }

  const gateMajor = rebirthGateMajor(rebirthCount);
  const eligible = gateMajor !== null && highestMajorCleared >= gateMajor;

  const execute = () => {
    if (executing.current) return;
    executing.current = true;
    performRebirth();
    const next = useGameStore.getState().rebirthCount;
    setResult({ realm: realmName(next), buff: rebirthBuffPercent(next) });
  };

  return (
    <div className="rebirth">
      <section className="card rebirth-hero">
        <img
          src="/ui/icon/icon-rebirth.webp"
          alt=""
          aria-hidden="true"
          className="rebirth-hero-icon"
        />
        <div className="rebirth-tier-row">
          <span>현재 경지</span>
          <strong>{realmName(rebirthCount)}</strong>
          <em>
            {rebirthCount}회 · 영구 +{rebirthBuffPercent(rebirthCount)}%
          </em>
        </div>
        {gateMajor === null ? (
          <p className="rebirth-gate rebirth-gate-ready">모든 경지를 돌파했습니다</p>
        ) : (
          <>
            <div className="rebirth-arrow" aria-hidden="true">
              ↓
            </div>
            <div className="rebirth-tier-row rebirth-tier-next">
              <span>다음 경지</span>
              <strong>{realmName(rebirthCount + 1)}</strong>
              <em>영구 +{rebirthBuffPercent(rebirthCount + 1)}%</em>
            </div>
            <p className={`rebirth-gate${eligible ? ' rebirth-gate-ready' : ''}`}>
              {eligible
                ? `대${gateMajor} 보스 클리어 완료 · 환골탈태 가능`
                : `대${gateMajor} 보스 클리어 필요 · 현재 대${highestMajorCleared}`}
            </p>
          </>
        )}
      </section>
      {gateMajor !== null && (
        <div className="sticky-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!eligible}
            onClick={execute}
          >
            {eligible ? (
              <img
                src="/ui/label/label-rebirth-proceed.webp"
                alt="환골탈태 진행"
                style={{ height: '1.1em', display: 'block' }}
              />
            ) : (
              <img
                src="/ui/label/label-rebirth-not-ready.webp"
                alt="조건 미충족"
                style={{ height: '1.1em', display: 'block' }}
              />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
