import { useRef, useState } from 'react';
import { useGameStore, realmName, rebirthGateMajor, rebirthBuffPercent } from '../../game/store';
import { Sheet } from '../Sheet';

// 초기화/유지 항목은 store.ts performRebirth의 실제 필드 기준.
const RESET_ITEMS = [
  '레벨·경험치',
  '보유 내공',
  '모든 무공 초식 레벨',
  '현재 스테이지(1-1부터)·반복 사냥 상태',
];
const KEEP_ITEMS = [
  '전·영약·강화석·보호부적',
  '장비와 강화 단계',
  '문파 레벨·기여도',
  '최고 클리어 대스테이지 기록',
  '기연 천장 진행',
];

export const RebirthView = ({ onDone }: { onDone: () => void }) => {
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const performRebirth = useGameStore((s) => s.performRebirth);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ realm: string; buff: number } | null>(null);
  // 확인 버튼 중복 탭으로 횟수가 여러 번 늘지 않게 한 번만 실행.
  const executed = useRef(false);

  if (result) {
    return (
      <div className="rebirth">
        <section className="card action-card-reward">
          <h3>환골탈태 완료</h3>
          <p>
            <strong>{result.realm}</strong> 경지에 올랐습니다. 영구 능력치 +{result.buff}%
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            1-1 전투로
          </button>
        </section>
      </div>
    );
  }

  const gateMajor = rebirthGateMajor(rebirthCount);
  const eligible = highestMajorCleared >= gateMajor;

  const execute = () => {
    if (executed.current) return;
    executed.current = true;
    performRebirth();
    const next = useGameStore.getState().rebirthCount;
    setConfirming(false);
    setResult({ realm: realmName(next), buff: rebirthBuffPercent(next) });
  };

  return (
    <div className="rebirth">
      <section className="card rebirth-hero">
        <div className="rebirth-tier-row">
          <span>현재 경지</span>
          <strong>{realmName(rebirthCount)}</strong>
          <em>
            {rebirthCount}회 · 영구 +{rebirthBuffPercent(rebirthCount)}%
          </em>
        </div>
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
      </section>
      <section className="card rebirth-reset-card">
        <h3>초기화되는 항목</h3>
        <ul className="bullet-list">
          {RESET_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="card rebirth-keep-card">
        <h3>유지되는 항목</h3>
        <ul className="bullet-list">
          {KEEP_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <div className="sticky-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!eligible}
          onClick={() => setConfirming(true)}
        >
          {eligible ? '환골탈태 진행' : '조건 미충족'}
        </button>
      </div>
      {confirming && (
        <Sheet title="환골탈태 확인" onClose={() => setConfirming(false)}>
          <p>
            레벨·내공·무공·스테이지가 초기화되며 되돌릴 수 없습니다. {realmName(rebirthCount + 1)}{' '}
            경지로 오르시겠습니까?
          </p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              취소
            </button>
            <button type="button" className="btn btn-primary" onClick={execute}>
              환골탈태 실행
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
};
