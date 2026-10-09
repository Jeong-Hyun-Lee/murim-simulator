import { describe, expect, it } from 'vitest';
import { baseDamage, damage, expToNextLevel, monsterStats, nextStage, playerStats } from './combat';

describe('baseDamage', () => {
  it('방어가 공격과 같으면 피해가 절반이다', () => {
    expect(baseDamage(100, 100)).toBe(50);
  });

  it('방어가 아무리 높아도 최소 1이다', () => {
    expect(baseDamage(1, 1_000_000)).toBe(1);
  });

  it('편차는 기본 피해의 90~110% 안이다', () => {
    for (let i = 0; i < 200; i += 1) {
      const d = damage(1000, 0);
      expect(d).toBeGreaterThanOrEqual(900);
      expect(d).toBeLessThanOrEqual(1100);
    }
  });
});

describe('monsterStats', () => {
  it('1-1 졸개는 기초치에 종류 가중치를 곱한 값이다', () => {
    expect(monsterStats({ major: 1, sub: 1 })).toMatchObject({ hp: 31, atk: 12, def: 3 });
  });

  it('대20까지는 대스테이지당 체력 1.5배·공격 1.37배다', () => {
    const a = monsterStats({ major: 19, sub: 1 });
    const b = monsterStats({ major: 20, sub: 1 });
    expect(b.hp / a.hp).toBeCloseTo(1.5, 2);
    expect(b.atk / a.atk).toBeCloseTo(1.37, 2);
  });

  it('대21부터는 체력 1.6배·공격 1.4배, 방어는 1.25배 그대로다', () => {
    const at = (major: number) => monsterStats({ major, sub: 1 });
    expect(at(21).hp / at(20).hp).toBeCloseTo(1.6, 2);
    expect(at(21).atk / at(20).atk).toBeCloseTo(1.4, 2);
    expect(at(30).hp / at(29).hp).toBeCloseTo(1.6, 2);
    expect(at(30).def / at(29).def).toBeCloseTo(1.25, 2);
  });

  it('대31부터는 체력 1.4배·공격 1.3배다', () => {
    const at = (major: number) => monsterStats({ major, sub: 1 });
    expect(at(31).hp / at(30).hp).toBeCloseTo(1.4, 2);
    expect(at(31).atk / at(30).atk).toBeCloseTo(1.3, 2);
    expect(at(40).hp / at(39).hp).toBeCloseTo(1.4, 2);
    expect(at(40).name).toBe('맹약패에 조종된 무인');
  });

  it('수련탑용 곡선은 대21 이후에도 1.5배·1.37배를 잇는다', () => {
    const at = (major: number) => monsterStats({ major, sub: 9 }, false);
    expect(at(25).hp / at(24).hp).toBeCloseTo(1.5, 2);
    expect(at(25).atk / at(24).atk).toBeCloseTo(1.37, 2);
    expect(at(20)).toEqual(monsterStats({ major: 20, sub: 9 }));
  });

  it('보스(소10)는 소9 정예보다 체력이 1.8배다', () => {
    const elite = monsterStats({ major: 3, sub: 9 });
    const boss = monsterStats({ major: 3, sub: 10 });
    expect(boss.hp / elite.hp).toBeCloseTo(1.8, 1);
  });
});

describe('진행 공식', () => {
  it('필요 경험치는 레벨마다 1.15배다', () => {
    expect(expToNextLevel(1)).toBe(40);
    expect(expToNextLevel(11) / expToNextLevel(10)).toBeCloseTo(1.15, 2);
  });

  it('버프는 기본 스탯에 한 번 곱한다', () => {
    const base = playerStats(1);
    const buffed = playerStats(1, 100);
    expect(buffed.atk).toBe(base.atk * 2);
    expect(buffed.hp).toBe(base.hp * 2);
  });

  it('최종 스테이지에서는 다음 스테이지가 자기 자신이다', () => {
    expect(nextStage({ major: 40, sub: 10 })).toEqual({ major: 40, sub: 10 });
    expect(nextStage({ major: 30, sub: 10 })).toEqual({ major: 31, sub: 1 });
    expect(nextStage({ major: 1, sub: 10 })).toEqual({ major: 2, sub: 1 });
  });
});
