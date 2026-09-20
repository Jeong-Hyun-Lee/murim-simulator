import { useGameStore } from '../game/store';
import { Sheet } from './Sheet';

const durationText = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
};

// 오프라인 보상 결과 — 보상은 계산 즉시 지급되고, 이 팝업은 내역만 보여준다.
export const OfflineReportSheet = () => {
  const report = useGameStore((s) => s.offlineReport);
  const close = useGameStore((s) => s.closeOfflineReport);
  if (!report) return null;

  return (
    <Sheet
      title="자리를 비운 동안"
      titleImage="/ui/label/title-offline-report.webp"
      onClose={close}
    >
      <div className="offline-report-banner" aria-hidden="true" />
      <section className="card">
        <p className="boss-sheet-kicker">
          <img
            src="/ui/icon/icon-offline.webp"
            alt=""
            aria-hidden="true"
            style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: '0.3rem' }}
          />
          수련 보고
        </p>
        <h3>{durationText(report.elapsedMs)} 동안 수련했습니다</h3>
        <p className="muted small">
          <img
            src="/ui/icon/icon-info.webp"
            alt=""
            aria-hidden="true"
            style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: '0.3rem' }}
          />
          최대 12시간까지, 현재 사냥터 기준으로 계산합니다.
        </p>
        <ul className="reward-list">
          <li>처치 {report.kills.toLocaleString()}명</li>
          <li>경험치 +{report.exp.toLocaleString()}</li>
          <li>전 +{report.gold.toLocaleString()}</li>
          <li>내공 +{report.chi.toLocaleString()}</li>
          {report.levelsGained > 0 && <li>레벨 +{report.levelsGained}</li>}
        </ul>
        <button type="button" className="btn btn-primary btn-block" onClick={close}>
          <img
            src="/ui/label/label-confirm.webp"
            alt="확인"
            style={{ height: '1.1em', display: 'block' }}
          />
        </button>
      </section>
    </Sheet>
  );
};
