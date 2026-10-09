import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENEMY_ART_MAJORS, enemyArtForStage, enemyArtsForMajor } from './enemyArt';

const loadSheet = (prefix: string): { animations: Record<string, string[]> } =>
  JSON.parse(readFileSync(`assets/sprites/character/${prefix}-sheet.json`, 'utf8'));

describe('적 그림 표', () => {
  const arts = ENEMY_ART_MAJORS.flatMap(enemyArtsForMajor);

  it('표의 모든 시트가 네 모션을 갖고 있다', () => {
    for (const { prefix } of arts) {
      const { animations } = loadSheet(prefix);
      expect(Object.keys(animations), prefix).toEqual(
        expect.arrayContaining(['idle', 'attack1', 'attack2', 'death']),
      );
    }
  });

  it('타격 프레임이 공격 모션 길이 안에 있다', () => {
    for (const { prefix, hitFrames } of arts) {
      const { animations } = loadSheet(prefix);
      expect(hitFrames.attack1, prefix).toBeLessThan(animations.attack1.length);
      expect(hitFrames.attack2, prefix).toBeLessThan(animations.attack2.length);
    }
  });

  it('스테이지의 적 종류에 맞는 그림을 고른다', () => {
    expect(enemyArtForStage({ major: 1, sub: 1 })?.prefix).toBe('hyeollangchae-grunt-v3');
    expect(enemyArtForStage({ major: 1, sub: 7 })?.prefix).toBe('hyeollangchae-archer-v3');
    expect(enemyArtForStage({ major: 2, sub: 9 })?.prefix).toBe('black-market-fixer-v1');
    expect(enemyArtForStage({ major: 4, sub: 10 })?.prefix).toBe('forbidden-art-user-v1');
    expect(enemyArtForStage({ major: 5, sub: 9 })?.prefix).toBe('blood-cult-captain-v1');
  });

  it('전용 그림이 없는 칸은 null이다', () => {
    expect(enemyArtForStage({ major: 5, sub: 10 })).toBeNull();
    expect(enemyArtForStage({ major: 30, sub: 1 })).toBeNull();
  });
});
