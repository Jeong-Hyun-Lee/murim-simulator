import { BattleCanvas } from '../canvas/BattleCanvas';
import { useGameStore, expToNextLevel, rebirthGateMajor } from '../game/store';
import { combatPower } from '../game/combat';
import {
  REBIRTH_ENTRY_MAJOR,
  TAB_LABEL,
  stageLabel,
  useBattleStatus,
  type NavTarget,
  type TabKey,
} from './common';

const HpBar = ({ hp, maxHp, label }: { hp: number; maxHp: number; label: string }) => {
  const shown = Math.max(0, Math.round(hp));
  return (
    <div className="bar hp-bar" role="img" aria-label={`${label} 체력 ${shown}/${maxHp}`}>
      <div className="bar-fill" style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }} />
      <span className="bar-text">
        {shown.toLocaleString()} / {maxHp.toLocaleString()}
      </span>
    </div>
  );
};

interface Props {
  onNavigate: (target: NavTarget) => void;
  lastGrowthTab: TabKey;
}

// 다음 행동 카드는 한 번에 하나만 — 보스 보상 확인 > 보스 도전 > 환골탈태 가능 > 성장 화면 진입.
// 첫 성장 안내는 튜토리얼이 무공 탭을 강제로 열어 이 카드에 도달하지 않는다.
const NextActionCard = ({ onNavigate, lastGrowthTab }: Props) => {
  const enemyName = useGameStore((s) => s.enemy.name);
  const bossReward = useGameStore((s) => s.awaitingBossReward);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const chiGainMultiplier = useGameStore((s) => s.player.chiGainMultiplier);
  const confirmBossChallenge = useGameStore((s) => s.confirmBossChallenge);
  const confirmBossReward = useGameStore((s) => s.confirmBossReward);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);

  if (bossReward) {
    const { stage, bossName, reward, elixirGained } = bossReward;
    return (
      <section className="card action-card action-card-reward">
        <h3>{bossName} 격파!</h3>
        <p>{stageLabel(stage)} 클리어</p>
        <ul className="reward-list">
          <li>경험치 +{reward.exp.toLocaleString()}</li>
          <li>전 +{reward.gold.toLocaleString()}</li>
          <li>내공 +{Math.round(reward.chi * chiGainMultiplier).toLocaleString()}</li>
          {elixirGained > 0 && <li>영약 +{elixirGained} (대스테이지 최초 클리어)</li>}
        </ul>
        <button type="button" className="btn btn-primary btn-block" onClick={confirmBossReward}>
          계속하기
        </button>
      </section>
    );
  }

  if (awaitingBossChallenge) {
    return (
      <section className="card action-card">
        <h3>보스 도전 대기</h3>
        <p>
          {enemyName}이(가) 앞을 막아선다. 도전을 누르기 전까지 전투가 멈춰 있으며, 그동안 성장
          화면을 이용할 수 있습니다.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={confirmBossChallenge}>
            도전
          </button>
          <button type="button" className="btn" onClick={() => onNavigate(lastGrowthTab)}>
            성장 준비
          </button>
        </div>
      </section>
    );
  }

  if (highestMajorCleared >= Math.max(REBIRTH_ENTRY_MAJOR, rebirthGateMajor(rebirthCount))) {
    return (
      <section className="card action-card">
        <h3>환골탈태 가능</h3>
        <p>경지를 올려 영구 능력치를 얻을 수 있습니다. 실행 전 초기화·유지 항목을 확인하세요.</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('rebirth')}
        >
          환골탈태 보기
        </button>
      </section>
    );
  }

  return (
    <section className="card action-card">
      <h3>성장하기</h3>
      <p>막히기 전에 무공과 장비로 전투력을 올려 두세요.</p>
      <button type="button" className="btn btn-block" onClick={() => onNavigate(lastGrowthTab)}>
        {TAB_LABEL[lastGrowthTab]} 화면으로
      </button>
    </section>
  );
};

export const BattleTab = ({ onNavigate, lastGrowthTab }: Props) => {
  const stage = useGameStore((s) => s.stage);
  const enemyName = useGameStore((s) => s.enemy.name);
  const enemyHp = useGameStore((s) => s.enemyHp);
  const enemyMaxHp = useGameStore((s) => s.enemy.hp);
  const player = useGameStore((s) => s.player);
  const playerHp = useGameStore((s) => s.playerHp);
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const paused = useGameStore((s) => s.paused);
  const farmReturnStage = useGameStore((s) => s.farmReturnStage);
  const stopFarming = useGameStore((s) => s.stopFarming);
  const status = useBattleStatus();

  const expPercent = Math.min(100, (exp / expToNextLevel(level)) * 100);

  return (
    <div className="battle-tab">
      <div className="battle-stage-row">
        <span className="stage-badge">{stageLabel(stage)}</span>
        <span aria-live="polite">{status}</span>
      </div>

      <div className="unit-status">
        <span className="unit-name">{enemyName}</span>
        <HpBar hp={enemyHp} maxHp={enemyMaxHp} label={enemyName} />
      </div>

      <div className="battle-stage-frame">
        <BattleCanvas />
        {paused && <div className="battle-paused">일시정지</div>}
      </div>

      <div className="unit-status">
        <div className="unit-name-row">
          <span className="unit-name">
            {player.name} · Lv.{level}
          </span>
          <span className="muted">전투력 {combatPower(player).toLocaleString()}</span>
        </div>
        <HpBar hp={playerHp} maxHp={player.hp} label={player.name} />
        <div className="bar exp-bar" role="img" aria-label={`경험치 ${Math.floor(expPercent)}%`}>
          <div className="bar-fill" style={{ width: `${expPercent}%` }} />
        </div>
      </div>

      {farmReturnStage && (
        <section className="card farm-card">
          <div>
            <strong>반복 사냥 중 {stageLabel(stage)}</strong>
            <p className="muted">등반 위치 {stageLabel(farmReturnStage)}는 그대로 유지됩니다.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={stopFarming}>
            등반 복귀
          </button>
        </section>
      )}

      <NextActionCard onNavigate={onNavigate} lastGrowthTab={lastGrowthTab} />

      <button type="button" className="btn btn-block" onClick={() => onNavigate('stagePicker')}>
        사냥터
      </button>
    </div>
  );
};
