import { useGameStore } from '../game/store';

// wiki/concepts/ux-시나리오-기획서.md 3-3절: 보스 조우 직전 [도전] 확인, 보스 격파 후
// [계속하기] 확인 — 자동전투 ON이어도 보스전은 사용자 확인 1회를 받는다(방치형 관례상
// 과금/장비 점검 유도 지점). 화면 암전/파티클 등 대형 연출은 v1 범위 밖, 확인 다이얼로그로 단순화.
export const BossDialog = () => {
  const stage = useGameStore((s) => s.stage);
  const enemyName = useGameStore((s) => s.enemy.name);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const awaitingBossReward = useGameStore((s) => s.awaitingBossReward);
  const confirmBossChallenge = useGameStore((s) => s.confirmBossChallenge);
  const confirmBossReward = useGameStore((s) => s.confirmBossReward);

  if (awaitingBossReward) {
    const { stage: clearedStage, bossName, reward, elixirGained } = awaitingBossReward;
    return (
      <div className="boss-dialog-overlay">
        <div className="boss-dialog-box">
          <div className="boss-dialog-title">{bossName} 격파!</div>
          <div className="boss-dialog-body">
            {clearedStage.major}-{clearedStage.sub} 클리어
            <br />
            +EXP {reward.exp.toLocaleString()} · +전 {reward.gold.toLocaleString()} · +내공{' '}
            {reward.chi.toLocaleString()}
            {elixirGained > 0 && (
              <>
                <br />
                +영약 {elixirGained} (대스테이지 최초 클리어)
              </>
            )}
          </div>
          <button type="button" className="gong-upgrade-btn" onClick={confirmBossReward}>
            계속하기
          </button>
        </div>
      </div>
    );
  }

  if (awaitingBossChallenge) {
    return (
      <div className="boss-dialog-overlay">
        <div className="boss-dialog-box">
          <div className="boss-dialog-title">보스 조우</div>
          <div className="boss-dialog-body">
            {stage.major}-{stage.sub}: {enemyName}이(가) 앞을 막아선다.
          </div>
          <button type="button" className="gong-upgrade-btn" onClick={confirmBossChallenge}>
            도전
          </button>
        </div>
      </div>
    );
  }

  return null;
};
