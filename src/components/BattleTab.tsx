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
        <strong>{place}</strong>
        {line && <span>{line}</span>}
      </button>
    </div>
  );
};

// 화면을 가리지 않고 상태를 먼저 알린 뒤, 보스·환골탈태 행동을 열 때만 팝업으로 확인한다.
const BattleActionContents = ({ onNavigate, onClose }: Props & { onClose: () => void }) => {
  const enemyName = useGameStore((s) => s.enemy.name);
  const stageMajor = useGameStore((s) => s.stage.major);
  const bossReward = useGameStore((s) => s.awaitingBossReward);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const chiGainMultiplier = useGameStore((s) => s.player.chiGainMultiplier);
  const confirmBossChallenge = useGameStore((s) => s.confirmBossChallenge);
  const confirmBossReward = useGameStore((s) => s.confirmBossReward);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);

  if (bossReward) {
    const { stage, bossName, reward, elixirGained, firstClear } = bossReward;
    const defeatLine = firstClear ? MAJOR_STORIES[stage.major]?.bossDefeat : undefined;
    return (
      <section className="card action-card-reward">
        <h3>{bossName} 격파!</h3>
        <p>{stageLabel(stage)} 클리어</p>
        {defeatLine && <p className="story-line">{defeatLine}</p>}
        <ul className="reward-list">
          <li>경험치 +{reward.exp.toLocaleString()}</li>
          <li>전 +{reward.gold.toLocaleString()}</li>
          <li>내공 +{Math.round(reward.chi * chiGainMultiplier).toLocaleString()}</li>
          {elixirGained > 0 && <li>영약 +{elixirGained} (대스테이지 최초 클리어)</li>}
        </ul>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            onClose();
            confirmBossReward();
          }}
        >
          계속하기
        </button>
      </section>
    );
  }

  if (awaitingBossChallenge) {
    const encounterLine = MAJOR_STORIES[stageMajor]?.bossEncounter;
    return (
      <section className="card">
        <h3>보스 도전 대기</h3>
        {encounterLine && (
          <p className="story-line">
            {enemyName}: {encounterLine}
          </p>
        )}
        <p>
          {enemyName}이(가) 앞을 막아선다. 도전을 누르기 전까지 전투가 멈춰 있으며, 그동안 성장
          화면을 이용할 수 있습니다.
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              confirmBossChallenge();
            }}
          >
            도전
          </button>
          <button type="button" className="btn" onClick={onClose}>
            무공 수련하기
          </button>
        </div>
      </section>
    );
  }

  if (highestMajorCleared >= Math.max(REBIRTH_ENTRY_MAJOR, rebirthGateMajor(rebirthCount))) {
    return (
      <section className="card">
        <h3>환골탈태 가능</h3>
        <p>경지를 올려 영구 능력치를 얻을 수 있습니다. 실행 전 초기화·유지 항목을 확인하세요.</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            onClose();
            onNavigate('rebirth');
          }}
        >
          환골탈태 보기
        </button>
      </section>
    );
  }

  return null;
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
  const bossReward = useGameStore((s) => s.awaitingBossReward);
  const awaitingBossChallenge = useGameStore((s) => s.awaitingBossChallenge);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const storyIntroMajor = useGameStore((s) => s.storyIntroMajor);
  const storySubtitle = useGameStore((s) => s.storySubtitle);
  const storyCutscene = useGameStore((s) => s.storyCutscene);
  const [actionOpen, setActionOpen] = useState(false);
  const status = useBattleStatus();

  const expPercent = Math.min(100, (exp / expToNextLevel(level)) * 100);
  let actionTitle = '';
  if (bossReward) actionTitle = '보스 보상 확인';
  else if (awaitingBossChallenge) actionTitle = '보스 도전';
  else if (highestMajorCleared >= Math.max(REBIRTH_ENTRY_MAJOR, rebirthGateMajor(rebirthCount))) {
    actionTitle = '환골탈태 가능';
  }

  return (
    <div className="battle-tab">
      <div className="battle-state-row">
        <span aria-live="polite">{status}</span>
        {farmReturnStage && <span>등반 위치 {stageLabel(farmReturnStage)}</span>}
        {actionTitle && (
          <button
            type="button"
            className="battle-event-button"
            aria-haspopup="dialog"
            onClick={() => setActionOpen(true)}
          >
            {actionTitle} ›
          </button>
        )}
      </div>

      <div className="unit-status">
        <span className="unit-name">{enemyName}</span>
        <HpBar hp={enemyHp} maxHp={enemyMaxHp} label={enemyName} />
      </div>

      <div className="battle-stage-frame">
        <BattleCanvas />
        <button
          type="button"
          className="battle-stage-select"
          aria-haspopup="dialog"
          aria-label={`사냥터 선택, 현재 ${stageLabel(stage)}`}
          onClick={() => onNavigate('stagePicker')}
        >
          사냥터 {stageLabel(stage)} ▾
        </button>
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

      {actionOpen && actionTitle && (
        <Sheet title={actionTitle} onClose={() => setActionOpen(false)}>
          <BattleActionContents onNavigate={onNavigate} onClose={() => setActionOpen(false)} />
        </Sheet>
      )}
    </div>
  );
};
