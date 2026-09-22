import {
  useGameStore,
  totalGongBuffPercent,
  gongMultiplier,
  totalGongSecondaryStats,
  aggregateGearStats,
  rebirthBuffPercent,
  sectBuffPercent,
  realmName,
  otherSectSecondaryStats,
} from '../../game/store';
import { combatPower } from '../../game/combat';
import { REBIRTH_ENTRY_MAJOR, type NavTarget } from '../common';

const pct = (n: number, digits = 1): string => `${n.toFixed(digits)}%`;

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="stat-row">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

// 전투력 → 주요 능력치 → 보조 능력치 → 성장별 기여도 순으로 단계적으로 펼친다.
export const MyInfoView = ({ onNavigate }: { onNavigate: (target: NavTarget) => void }) => {
  const player = useGameStore((s) => s.player);
  const playerHp = useGameStore((s) => s.playerHp);
  const level = useGameStore((s) => s.level);
  const gongLevels = useGameStore((s) => s.gongLevels);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const sectLevel = useGameStore((s) => s.sectLevel);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const sectFavor = useGameStore((s) => s.sectFavor);

  const gongSecondary = totalGongSecondaryStats(gongLevels);
  const gear = aggregateGearStats(equippedGear);
  const sectPerk = otherSectSecondaryStats(sectFavor);

  return (
    <div className="my-info">
      <section className="card profile-hero">
        <div className="profile-identity">
          <span>{realmName(rebirthCount)}</span>
          <strong>{player.name}</strong>
          <em>Lv.{level}</em>
        </div>
        <span className="profile-combat-label">현재 전투력</span>
        <p className="big-number profile-combat-power">{combatPower(player).toLocaleString()}</p>
        <p className="profile-hero-note">
          전투력은 공격·방어·체력 등을 합친 종합 참고 지수입니다. 보스 승리를 보장하지는 않습니다.
        </p>
      </section>

      <section className="card profile-primary-stats">
        <h3>주요 능력치</h3>
        <dl className="stat-list profile-stat-list">
          <Row
            label="체력"
            value={`${Math.max(0, Math.round(playerHp)).toLocaleString()} / ${player.hp.toLocaleString()}`}
          />
          <Row label="공격력" value={player.atk.toLocaleString()} />
          <Row label="방어력" value={player.def.toLocaleString()} />
        </dl>
      </section>

      <details className="card">
        <summary>보조 능력치</summary>
        <dl className="stat-list">
          <Row label="치명타 확률" value={pct(player.critChance * 100)} />
          <Row label="치명타 피해" value={pct(player.critMultiplier * 100)} />
          <Row label="공격속도" value={`+${pct(player.attackSpeedPercent)}`} />
          <Row label="회피율" value={pct(player.evasion * 100)} />
          <Row label="내공 획득량" value={pct(player.chiGainMultiplier * 100)} />
        </dl>
      </details>

      <details className="card">
        <summary>성장별 기여도</summary>
        <dl className="stat-list">
          <Row label="무공 (공격·방어·체력)" value={`+${pct(totalGongBuffPercent(gongLevels))}`} />
          <Row
            label="무공 경지 배율 (곱연산)"
            value={`×${gongMultiplier(gongLevels).toFixed(2)}`}
          />
          <Row label="문파 특전" value={`+${pct(sectBuffPercent(sectLevel))}`} />
          <Row label="환골탈태" value={`+${pct(rebirthBuffPercent(rebirthCount))}`} />
          <Row
            label="무공 치명·치피·공속·회피"
            value={`+${pct(gongSecondary.critChancePercent)} / +${pct(gongSecondary.critDamagePercent)} / +${pct(gongSecondary.attackSpeedPercent)} / +${pct(gongSecondary.evasionPercent)}`}
          />
          <Row
            label="타 문파 치명·치피·공속·회피·내공"
            value={`+${pct(sectPerk.critChancePercent)} / +${pct(sectPerk.critDamagePercent)} / +${pct(sectPerk.attackSpeedPercent)} / +${pct(sectPerk.evasionPercent)} / +${pct(sectPerk.chiGainPercent)}`}
          />
          <Row
            label="장비 치명·치피·공속·회피·내공"
            value={`+${pct(gear.critChancePercent)} / +${pct(gear.critDamagePercent)} / +${pct(gear.attackSpeedPercent)} / +${pct(gear.evasionPercent)} / +${pct(gear.chiGainPercent)}`}
          />
        </dl>
      </details>

      <section className="card">
        <h3>
          <img
            src="/ui/label/section-rebirth.webp"
            alt="환골탈태"
            style={{ height: '1.1em', display: 'block' }}
          />
        </h3>
        {highestMajorCleared >= REBIRTH_ENTRY_MAJOR ? (
          <button type="button" className="btn btn-block" onClick={() => onNavigate('rebirth')}>
            <img
              src="/ui/label/label-rebirth-open.webp"
              alt="환골탈태 화면 열기"
              style={{ height: '1.1em', display: 'block' }}
            />
          </button>
        ) : (
          <p className="muted">
            대{REBIRTH_ENTRY_MAJOR} 보스를 클리어하면 열립니다. (현재 최고 클리어: 대
            {highestMajorCleared})
          </p>
        )}
      </section>
    </div>
  );
};
