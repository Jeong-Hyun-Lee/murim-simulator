import { describe, expect, it } from 'vitest';
import { realmName, rebirthBuffPercent, rebirthGateMajor } from './rebirthData';

describe('환골탈태', () => {
  it('게이트는 스토리 이정표 순서다', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(rebirthGateMajor)).toEqual([
      7, 9, 10, 15, 20, 25, 30, 35, 40,
    ]);
  });

  it('마지막 게이트 뒤에는 더 돌파할 수 없다', () => {
    expect(rebirthGateMajor(9)).toBeNull();
    expect(rebirthGateMajor(20)).toBeNull();
  });

  it('영구 버프는 회차당 15%다', () => {
    expect(rebirthBuffPercent(0)).toBe(0);
    expect(rebirthBuffPercent(7)).toBe(105);
  });

  it('6회부터는 등봉조극 N중으로 표기한다', () => {
    expect(realmName(0)).toBe('후천');
    expect(realmName(5)).toBe('생사경');
    expect(realmName(7)).toBe('등봉조극 2중');
  });
});
