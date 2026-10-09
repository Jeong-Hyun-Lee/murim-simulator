import { beforeEach, describe, expect, it } from 'vitest';
import { defaultState, loadState, useSaveStatus } from './state';

const SAVE_KEY = 'murim-simulator-save-v2';
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  } as Storage;
  useSaveStatus.setState({ failed: false, recovered: false });
});

describe('loadState', () => {
  it('저장이 없으면 기본 상태로 시작한다', () => {
    expect(loadState()).toEqual(defaultState());
    expect(useSaveStatus.getState().recovered).toBe(false);
  });

  it('없는 필드는 기본값으로 채운다', () => {
    store.set(SAVE_KEY, JSON.stringify({ level: 12, highestMajorCleared: 3 }));
    const s = loadState();
    expect(s.level).toBe(12);
    expect(s.rebirthCount).toBe(0);
    // 연출 필드가 없는 예전 저장은 이미 클리어한 곳까지 본 것으로 읽는다.
    expect(s.storySeenMajor).toBe(3);
    expect(s.storySeenStage).toBe(30);
  });

  it('형식이 어긋난 필드는 버리고 기본값을 쓴다', () => {
    store.set(
      SAVE_KEY,
      JSON.stringify({ level: 'abc', chi: null, stage: { major: 'x' }, gold: 77 }),
    );
    const s = loadState();
    expect(s.level).toBe(1);
    expect(s.chi).toBe(0);
    expect(s.stage).toEqual({ major: 1, sub: 1 });
    expect(s.gold).toBe(77);
  });

  it('읽지 못한 저장은 따로 보존하고 알린다', () => {
    store.set(SAVE_KEY, '{broken');
    expect(loadState()).toEqual(defaultState());
    expect(store.get(`${SAVE_KEY}-corrupt`)).toBe('{broken');
    expect(useSaveStatus.getState().recovered).toBe(true);
  });
});
