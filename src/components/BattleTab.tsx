import { useEffect, useState } from 'react';
import { BattleCanvas } from '../canvas/BattleCanvas';
import { useGameStore, expToNextLevel, rebirthGateMajor } from '../game/store';
import { combatPower } from '../game/combat';
import { MAJOR_STORIES } from '../game/storyData';
import { REBIRTH_ENTRY_MAJOR, stageLabel, useBattleStatus, type NavTarget } from './common';
import { Sheet } from './Sheet';

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
}

const SUBTITLE_MS = 3000;
const INTRO_MS = 2000;

// 소스테이지 최초 클리어 자막 — 전투를 막지 않고 잠깐 보였다 사라진다. 매 클리어마다 낭독되지 않게 aria-hidden.
const StorySubtitle = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), SUBTITLE_MS);
    return () => window.clearTimeout(id);
  }, []);
  return visible ? (
    <p className="story-subtitle" aria-hidden="true">
      <span>전언</span>
      {text}
    </p>
  ) : null;
};

// 대스테이지 진입 카드 — 2초 뒤 자동으로 닫히고 탭하면 바로 닫힌다. 전투는 계속된다.
const StoryIntroCard = ({ major }: { major: number }) => {
  const dismissStoryIntro = useGameStore((s) => s.dismissStoryIntro);
  const [place, line] = MAJOR_STORIES[major].intro.split(' — ');
  useEffect(() => {
    const id = window.setTimeout(dismissStoryIntro, INTRO_MS);
    return () => window.clearTimeout(id);
  }, [dismissStoryIntro]);
  return (
    <div role="status">
      <button type="button" className="story-intro" onClick={dismissStoryIntro}>
        <span className="story-intro-label">대스테이지 진입</span>
        <strong>{place}</strong>
        {line && <span>{line}</span>}
      </button>
    </div>
  );
};

// 보스 도전·격파 팝업 — 전투가 멈추는 순간 어느 탭에 있든 바로 띄운다(App에서 렌더).
// 도전 팝업을 닫으면 직전 스테이지 반복 사냥, 격파 팝업을 닫으면 보상 수령으로 처리한다.
export const BossSheet = () => {
  const enemyName = useGameStore((s) => s.enemy.name);
  const stageMajor = useGameStore((s) => s.stage.major);
  const bossReward = useGameStore((s) => s.awaitingBossReward);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const pendingEncounter = useGameStore((s) => s.pendingEncounter);
  const chiGainMultiplier = useGameStore((s) => s.player.chiGainMultiplier);
  const confirmBossChallenge = useGameStore((s) => s.confirmBossChallenge);
  const declineBossChallenge = useGameStore((s) => s.declineBossChallenge);
  const confirmBossReward = useGameStore((s) => s.confirmBossReward);

  if (bossReward) {
    const { stage, bossName, reward, elixirGained, firstClear } = bossReward;
    const defeatLine = firstClear ? MAJOR_STORIES[stage.major]?.bossDefeat : undefined;
    return (
      <Sheet key="reward" title="보스 격파" onClose={confirmBossReward}>
        <section className="card action-card-reward boss-reward-card">
          <p className="boss-sheet-kicker">보스 격파</p>
          <h3>{bossName} 격파!</h3>
          <p>{stageLabel(stage)} 클리어</p>
          {defeatLine && <p className="story-line">{defeatLine}</p>}
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
      </Sheet>
    );
  }

  // 쓰러짐 연출 중에는 아직 앞 전투가 화면에 남아 있으므로 연출이 끝난 뒤 띄운다.
  if (!awaitingBossChallenge || pendingEncounter) return null;
  const encounterLine = MAJOR_STORIES[stageMajor]?.bossEncounter;
  return (
    <Sheet key="challenge" title="보스 도전" onClose={declineBossChallenge}>
      <section className="card boss-challenge-card">
        <p className="boss-sheet-kicker">{stageLabel({ major: stageMajor, sub: 10 })}</p>
        <h3>{enemyName}</h3>
        {encounterLine && (
          <p className="story-line">
            {enemyName}: {encounterLine}
          </p>
        )}
        <p>
          도전하거나, 직전 스테이지에서 사냥하며 수련할 수 있습니다. 수련 중에는 사냥터 옆 [등반]
          버튼으로 다시 도전합니다.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={confirmBossChallenge}>
            도전
          </button>
          <button type="button" className="btn" onClick={declineBossChallenge}>
            수련하기
          </button>
        </div>
      </section>
    </Sheet>
  );
};

export const BattleTab = ({ onNavigate }: Props) => {
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
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const storyIntroMajor = useGameStore((s) => s.storyIntroMajor);
  const storySubtitle = useGameStore((s) => s.storySubtitle);
  const storyCutscene = useGameStore((s) => s.storyCutscene);
  const [rebirthOpen, setRebirthOpen] = useState(false);
  const status = useBattleStatus();

  const expPercent = Math.min(100, (exp / expToNextLevel(level)) * 100);
  const canRebirth =
    highestMajorCleared >= Math.max(REBIRTH_ENTRY_MAJOR, rebirthGateMajor(rebirthCount));

  return (
    <div className="battle-tab">
      <div className="battle-state-row">
        <span className="battle-state-primary" aria-live="polite">
          {status}
        </span>
        {farmReturnStage && (
          <span className="battle-farm-status">등반 위치 {stageLabel(farmReturnStage)}</span>
        )}
        {canRebirth && (
          <button
            type="button"
            className="battle-event-button"
            aria-haspopup="dialog"
            onClick={() => setRebirthOpen(true)}
          >
            환골탈태 가능 ›
          </button>
        )}
      </div>

      <div className="unit-status">
        <span className="unit-name">{enemyName}</span>
        <HpBar hp={enemyHp} maxHp={enemyMaxHp} label={enemyName} />
      </div>

      <div className="battle-stage-frame">
        <BattleCanvas />
        <div className="battle-stage-controls">
          <button
            type="button"
            className="battle-stage-select"
            aria-haspopup="dialog"
            aria-label={`사냥터 선택, 현재 ${stageLabel(stage)}`}
            onClick={() => onNavigate('stagePicker')}
          >
            사냥터 {stageLabel(stage)} ▾
          </button>
          {farmReturnStage && (
            <button
              type="button"
              className="battle-stage-select"
              aria-label={`등반 위치 ${stageLabel(farmReturnStage)}로 복귀`}
              onClick={stopFarming}
            >
              등반
            </button>
          )}
        </div>
        {paused && <div className="battle-paused">일시정지</div>}
        {/* 컷이 떠 있는 동안에는 자막·진입 카드 타이머가 흘러가지 않도록 컷을 닫은 뒤 띄운다. */}
        {storySubtitle && !storyCutscene && (
          <StorySubtitle key={storySubtitle.index} text={storySubtitle.text} />
        )}
        {storyIntroMajor && !storyCutscene && (
          <StoryIntroCard key={storyIntroMajor} major={storyIntroMajor} />
        )}
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

      {rebirthOpen && canRebirth && (
        <Sheet title="환골탈태 가능" onClose={() => setRebirthOpen(false)}>
          <section className="card">
            <h3>환골탈태 가능</h3>
            <p>
              경지를 올려 영구 능력치를 얻을 수 있습니다. 실행 전 초기화·유지 항목을 확인하세요.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                setRebirthOpen(false);
                onNavigate('rebirth');
              }}
            >
              환골탈태 보기
            </button>
          </section>
        </Sheet>
      )}
    </div>
  );
};
