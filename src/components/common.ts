import { useGameStore, isBossStage, type StageId } from '../game/store';

export type TabKey = 'gong' | 'gear' | 'sect' | 'shop';
export type ViewKey = 'stagePicker' | 'myInfo' | 'rebirth';
export type NavTarget = TabKey | ViewKey;

export const TAB_KEYS: TabKey[] = ['gong', 'gear', 'sect', 'shop'];

export const TAB_LABEL: Record<TabKey, string> = {
  gong: '무공',
  gear: '장비',
  sect: '문파',
  shop: '상점',
};

export const isViewKey = (target: NavTarget): target is ViewKey =>
  target === 'stagePicker' || target === 'myInfo' || target === 'rebirth';

// 환골탈태 화면 진입은 대7 클리어부터(실행 가능 여부는 회차별 rebirthGateMajor 판정).
export const REBIRTH_ENTRY_MAJOR = 7;

// 만/억 단위 축약 — 소수 첫째 자리까지 내림 표기(올림으로 보유량을 부풀려 보이지 않게).
export const formatShort = (n: number): string => {
  const trim = (v: number) => String(Math.floor(v * 10) / 10);
  if (n >= 1e8) return `${trim(n / 1e8)}억`;
  if (n >= 1e4) return `${trim(n / 1e4)}만`;
  return Math.floor(n).toLocaleString();
};

export const stageLabel = (stage: StageId): string =>
  `${stage.major}-${stage.sub}${isBossStage(stage) ? ' 보스' : ''}`;

export const useBattleStatus = (): string =>
  useGameStore((s) => {
    if (s.awaitingBossReward) return '보상 확인 대기';
    if (s.awaitingBossChallenge) return '보스 도전 대기';
    if (s.paused) return '일시정지';
    if (s.farmReturnStage) return '반복 사냥 중';
    return '자동 전투 중';
  });

// 잠긴 탭의 해금 조건 문구 — null이면 열림.
export const useTabLockReasons = (): Record<TabKey, string | null> => {
  const hasAnyGear = useGameStore(
    (s) => s.inventory.length > 0 || Object.keys(s.equippedGear).length > 0,
  );
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  return {
    gong: null,
    gear: hasAnyGear ? null : '장비 아이템을 처음 획득하면 열립니다.',
    sect: highestMajorCleared >= 2 ? null : '대2 보스를 처음 클리어하면 열립니다.',
    shop: highestMajorCleared >= 1 ? null : '대1 보스를 처음 클리어하면 열립니다.',
  };
};
