import { useGameStore, DAILY_GOALS, MILESTONES, rewardText, todayString } from '../../game/store';

const GoalRow = ({
  label,
  current,
  target,
  reward,
  claimed,
  onClaim,
}: {
  label: string;
  current: number;
  target: number;
  reward: string;
  claimed: boolean;
  onClaim: () => void;
}) => {
  const done = current >= target;
  return (
    <li className="setting-row">
      <div>
        <strong>{label}</strong>
        <p>
          {Math.min(current, target).toLocaleString()} / {target.toLocaleString()} · {reward}
        </p>
      </div>
      <button
        type="button"
        className={done && !claimed ? 'btn btn-primary' : 'btn'}
        disabled={claimed || !done}
        onClick={onClaim}
      >
        {claimed && (
          <img
            src="/ui/label/label-claimed.webp"
            alt="받음"
            style={{ height: '1.1em', display: 'block' }}
          />
        )}
        {!claimed && done && (
          <img
            src="/ui/label/label-claim.webp"
            alt="받기"
            style={{ height: '1.1em', display: 'block' }}
          />
        )}
        {!claimed && !done && (
          <img
            src="/ui/label/label-goal-progress.webp"
            alt="진행 중"
            style={{ height: '1.1em', display: 'block' }}
          />
        )}
      </button>
    </li>
  );
};

// 수련 목표 — 일일 목표(기기 날짜 기준 초기화)와 1회만 받는 누적 목표. 받을 수 있는 목표를 위로 올린다.
export const GoalsView = () => {
  const dailyDate = useGameStore((s) => s.dailyDate);
  const dailyCounts = useGameStore((s) => s.dailyCounts);
  const dailyClaimed = useGameStore((s) => s.dailyClaimed);
  const milestonesClaimed = useGameStore((s) => s.milestonesClaimed);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const totalKills = useGameStore((s) => s.totalKills);
  const towerBest = useGameStore((s) => s.towerBest);
  const claimDailyGoal = useGameStore((s) => s.claimDailyGoal);
  const claimMilestone = useGameStore((s) => s.claimMilestone);

  const today = dailyDate === todayString();
  const metrics = { highestMajorCleared, rebirthCount, totalKills, towerBest };
  // 종류별로 아직 받지 않은 가장 낮은 목표 하나만 보여준다(MILESTONES는 종류 안에서 목표 오름차순).
  const milestoneRows = MILESTONES.filter(
    (m, i) =>
      !milestonesClaimed.includes(m.id) &&
      !MILESTONES.slice(0, i).some(
        (p) => p.metric === m.metric && !milestonesClaimed.includes(p.id),
      ),
  ).sort((a, b) => Number(metrics[b.metric] >= b.target) - Number(metrics[a.metric] >= a.target));

  return (
    <div className="goals-view">
      <section className="card">
        <h3>
          <span className="goal-section-title">
            <img
              src="/ui/icon/icon-goal-daily.webp"
              alt=""
              aria-hidden="true"
              style={{ width: 20, height: 20 }}
            />
            <img
              src="/ui/label/section-goal-daily.webp"
              alt="일일 수련"
              style={{ height: '1.1em', display: 'block' }}
            />
          </span>
        </h3>
        <p className="muted small">날짜가 바뀌면 진행이 초기화됩니다.</p>
        <ul className="goal-list">
          {DAILY_GOALS.map((goal) => (
            <GoalRow
              key={goal.id}
              label={goal.label}
              current={today ? dailyCounts[goal.counter] : 0}
              target={goal.target}
              reward={rewardText(goal.reward)}
              claimed={today && dailyClaimed.includes(goal.id)}
              onClaim={() => claimDailyGoal(goal.id)}
            />
          ))}
        </ul>
      </section>
      <section className="card">
        <h3>
          <span className="goal-section-title">
            <img
              src="/ui/icon/icon-goal-milestone.webp"
              alt=""
              aria-hidden="true"
              style={{ width: 20, height: 20 }}
            />
            <img
              src="/ui/label/section-goal-milestone.webp"
              alt="누적 수련"
              style={{ height: '1.1em', display: 'block' }}
            />
          </span>
        </h3>
        {milestoneRows.length === 0 ? (
          <p className="muted">모든 누적 목표를 달성했습니다.</p>
        ) : (
          <ul className="goal-list">
            {milestoneRows.map((m) => (
              <GoalRow
                key={m.id}
                label={m.label}
                current={metrics[m.metric]}
                target={m.target}
                reward={rewardText(m.reward)}
                claimed={false}
                onClaim={() => claimMilestone(m.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
