import { useEffect, useState } from 'react';
import { BattleCanvas } from '../canvas/BattleCanvas';
import {
  useGameStore,
  expToNextLevel,
  isBossStage,
  rebirthGateMajor,
  DAILY_GOALS,
  MILESTONES,
  TOWER_TURN_LIMIT,
  todayString,
} from '../game/store';
import { combatPower } from '../game/combat';
import { MAJOR_STORIES } from '../game/storyData';
import {
  REBIRTH_ENTRY_MAJOR,
  battleStatusIcon,
  stageLabel,
  useBattleStatus,
  type NavTarget,
} from './common';
import { Sheet } from './Sheet';

type HpVariant = 'enemy' | 'boss' | 'player';

// 잔상(뒤처진 채움)은 데미지로 줄어들 때만 0.35초 늦게 따라가고, 회복 시에는 즉시 맞춘다.
const HpBar = ({
  hp,
  maxHp,
  label,
  variant,
}: {
  hp: number;
  maxHp: number;
  label: string;
  variant: HpVariant;
}) => {
  const shown = Math.max(0, Math.round(hp));
  const pct = Math.max(0, (hp / maxHp) * 100);
  const [trailPct, setTrailPct] = useState(pct);
  useEffect(() => {
    if (pct >= trailPct) {
      setTrailPct(pct);
      return undefined;
    }
    const id = window.setTimeout(() => setTrailPct(pct), 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  return (
    <div
      className={`bar hp-bar hp-bar-${variant}`}
      role="img"
      aria-label={`${label} 체력 ${shown}/${maxHp}`}
    >
      <div className="bar-fill-trail" style={{ width: `${trailPct}%` }} />
      <div className="bar-fill" style={{ width: `${pct}%` }} />
      <span className="bar-text">
        {shown.toLocaleString()} / {maxHp.toLocaleString()}
      </span>
    </div>
  );
};

interface Props {
  onNavigate: (target: NavTarget) => void;
}

// 지금 받을 수 있는 수련 목표 수 — 버튼 배지용.
const useClaimableGoalCount = (): number =>
  useGameStore((s) => {
    const today = s.dailyDate === todayString();
    const daily = DAILY_GOALS.filter(
      (g) => today && !s.dailyClaimed.includes(g.id) && s.dailyCounts[g.counter] >= g.target,
    ).length;
    const milestones = MILESTONES.filter(
      (m) => !s.milestonesClaimed.includes(m.id) && s[m.metric] >= m.target,
    ).length;
    return daily + milestones;
  });

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
      <Sheet
        key="reward"
        title="보스 격파"
        titleImage="/ui/label/title-boss-defeated.webp"
        onClose={confirmBossReward}
      >
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
            <img src="/ui/label/label-continue.webp" alt="계속하기" style={{ height: '1.1em' }} />
          </button>
        </section>
      </Sheet>
    );
  }

  // 쓰러짐 연출 중에는 아직 앞 전투가 화면에 남아 있으므로 연출이 끝난 뒤 띄운다.
  if (!awaitingBossChallenge || pendingEncounter) return null;
  const encounterLine = MAJOR_STORIES[stageMajor]?.bossEncounter;
  return (
    <Sheet
      key="challenge"
      title="보스 도전"
      titleImage="/ui/label/title-boss-challenge.webp"
      onClose={declineBossChallenge}
    >
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
            <img src="/ui/label/label-boss-challenge.webp" alt="도전" style={{ height: '1.1em' }} />
          </button>
          <button type="button" className="btn" onClick={declineBossChallenge}>
            <img
              src="/ui/label/label-keep-training.webp"
              alt="수련하기"
              style={{ height: '1.1em' }}
            />
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
  const towerFloor = useGameStore((s) => s.towerFloor);
  const towerTurns = useGameStore((s) => s.towerTurns);
  const leaveTower = useGameStore((s) => s.leaveTower);
  const claimableGoals = useClaimableGoalCount();
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
          <img
            src={battleStatusIcon(status)}
            alt=""
            aria-hidden="true"
            style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.25em' }}
          />
          {status}
        </span>
        {farmReturnStage && (
          <span className="battle-farm-status">
            <img
              src="/ui/icon/icon-climb.webp"
              alt=""
              aria-hidden="true"
              style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.25em' }}
            />
            등반 위치 {stageLabel(farmReturnStage)}
          </span>
        )}
        <button type="button" className="battle-goal-button" onClick={() => onNavigate('goals')}>
          <img src="/ui/label/label-goals.webp" alt="수련 목표" style={{ height: '1.1em' }} />
          {claimableGoals > 0 && <span className="goal-count"> {claimableGoals}</span>}
        </button>
        {canRebirth && (
          <button
            type="button"
            className="battle-event-button"
            aria-haspopup="dialog"
            onClick={() => setRebirthOpen(true)}
          >
            <img
              src="/ui/label/title-rebirth-ready.webp"
              alt="환골탈태 가능"
              style={{ height: '1.1em', verticalAlign: '-0.2em' }}
            />{' '}
            ›
          </button>
        )}
      </div>

      <div className="unit-status">
        <span className="unit-name">{enemyName}</span>
        <HpBar
          hp={enemyHp}
          maxHp={enemyMaxHp}
          label={enemyName}
          variant={isBossStage(stage) ? 'boss' : 'enemy'}
        />
      </div>

      <div className="battle-stage-frame">
        <BattleCanvas />
        <div className="battle-stage-controls">
          {towerFloor !== null ? (
            <>
              <span className="battle-stage-select">
                <img
                  src="/ui/icon/icon-tower.webp"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.2em' }}
                />
                수련탑 {towerFloor}층 ·
                <img
                  src="/ui/icon/icon-hourglass.webp"
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    verticalAlign: '-0.3em',
                    margin: '0 0.2em 0 0.35em',
                  }}
                />
                남은 공방 {TOWER_TURN_LIMIT - towerTurns}
              </span>
              <button type="button" className="battle-stage-select" onClick={leaveTower}>
                <img
                  src="/ui/label/label-tower-quit.webp"
                  alt="포기"
                  style={{ height: '1.1em', display: 'block' }}
                />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="battle-stage-select"
                aria-haspopup="dialog"
                aria-label={`사냥터 선택, 현재 ${stageLabel(stage)}`}
                onClick={() => onNavigate('stagePicker')}
              >
                <img
                  src="/ui/label/label-stage.webp"
                  alt="사냥터"
                  style={{ height: '1.1em', verticalAlign: '-0.2em' }}
                />{' '}
                {stageLabel(stage)}
                <img
                  src="/ui/icon/icon-dropdown.webp"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 16, height: 16, verticalAlign: '-0.1em', marginLeft: '0.2em' }}
                />
              </button>
              {farmReturnStage && (
                <button
                  type="button"
                  className="battle-stage-select"
                  aria-label={`등반 위치 ${stageLabel(farmReturnStage)}로 복귀`}
                  onClick={stopFarming}
                >
                  <img
                    src="/ui/label/label-climb.webp"
                    alt="등반"
                    style={{ height: '1.1em', display: 'block' }}
                  />
                </button>
              )}
            </>
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
          <span className="muted">
            <img
              src="/ui/icon/icon-combat-power.webp"
              alt=""
              aria-hidden="true"
              style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.2em' }}
            />
            전투력 {combatPower(player).toLocaleString()}
          </span>
        </div>
        <HpBar hp={playerHp} maxHp={player.hp} label={player.name} variant="player" />
        <div className="bar exp-bar" role="img" aria-label={`경험치 ${Math.floor(expPercent)}%`}>
          <div className="bar-fill" style={{ width: `${expPercent}%` }} />
        </div>
      </div>

      {rebirthOpen && canRebirth && (
        <Sheet
          title="환골탈태 가능"
          titleImage="/ui/label/title-rebirth-ready.webp"
          onClose={() => setRebirthOpen(false)}
        >
          <section className="card">
            <h3>
              <img
                src="/ui/label/title-rebirth-ready.webp"
                alt="환골탈태 가능"
                style={{ height: '1.1em', display: 'block' }}
              />
            </h3>
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
              <img
                src="/ui/label/label-rebirth-view.webp"
                alt="환골탈태 보기"
                style={{ height: '1.1em' }}
              />
            </button>
          </section>
        </Sheet>
      )}
    </div>
  );
};
