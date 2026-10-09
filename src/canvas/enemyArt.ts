// 대스테이지·적 종류별 전용 전투 그림 표. 새 적은 ENEMY_ART에 한 줄만 추가한다 —
// 표에 없는 칸은 전투 캔버스가 대체 사각형으로 표시한다.
// 전투 캔버스는 지금 보는 대스테이지의 그림만 읽고, 대스테이지가 바뀌면 이전 것을 내린다.
import { enemyKind, type EnemyKind, type StageId } from '../game/combat';

export interface EnemyArt {
  // 시트 파일 접두 — /sprites/character/<prefix>-sheet.json
  prefix: string;
  // 공통 대형 셀을 쓰므로 모션별 확대·축소 없이 하나의 런타임 배율만 적용한다.
  scale: number;
  // 공격 모션에서 무기가 닿는(칼 궤적·발사) 프레임 — 이 프레임에 플레이어가 피해를 입는다.
  hitFrames: { attack1: number; attack2: number };
}

// 두목은 잡몹보다 조금 크게 유지한다.
const BOSS_SCALE = 0.58;
const MOB_SCALE = 0.45;

// 타격 프레임은 공격 1·2 모션의 프레임 시트를 뽑아 칼 궤적이 처음 나오거나 암기가 손을 떠나는
// 프레임을 확인해 적는다(내려찍기는 땅에 닿는 프레임). 새 적도 일괄 값을 쓰지 말고 같은 방법으로 확인한다.
const art = (prefix: string, scale: number, attack1: number, attack2: number): EnemyArt => ({
  prefix,
  scale,
  hitFrames: { attack1, attack2 },
});

const ENEMY_ART: Record<number, Partial<Record<EnemyKind, EnemyArt>>> = {
  1: {
    grunt: art('hyeollangchae-grunt-v3', MOB_SCALE, 6, 8),
    archer: art('hyeollangchae-archer-v3', MOB_SCALE, 10, 10),
    elite: art('hyeollangchae-elite-v3', MOB_SCALE, 5, 7),
    boss: art('hyeollangchae-boss-v3', BOSS_SCALE, 9, 9),
  },
  2: {
    grunt: art('black-market-minion-v1', MOB_SCALE, 5, 4),
    archer: art('black-market-dart-v1', MOB_SCALE, 6, 6),
    elite: art('black-market-fixer-v1', MOB_SCALE, 5, 7),
    boss: art('black-market-boss-v1', BOSS_SCALE, 5, 5),
  },
  3: {
    grunt: art('peng-clan-warrior-v1', MOB_SCALE, 5, 5),
    archer: art('peng-clan-dagger-v1', MOB_SCALE, 6, 6),
    elite: art('peng-clan-saber-instructor-v1', MOB_SCALE, 7, 7),
    boss: art('peng-clan-young-master-v1', BOSS_SCALE, 8, 8),
  },
  4: {
    grunt: art('forbidden-art-follower-v1', MOB_SCALE, 7, 7),
    archer: art('forbidden-art-darter-v1', MOB_SCALE, 7, 6),
    elite: art('qi-overload-warrior-v1', MOB_SCALE, 5, 5),
    boss: art('forbidden-art-user-v1', BOSS_SCALE, 8, 8),
  },
  5: {
    grunt: art('blood-cult-assassin-v1', MOB_SCALE, 8, 8),
    archer: art('blood-cult-darter-v1', MOB_SCALE, 8, 8),
  },
};

// 스테이지별 적 종류는 combat.ts가 단일 기준 — 이름(monsterStats)과 그림이 같은 규칙을 쓴다.
export const enemyArtForStage = (stage: StageId): EnemyArt | null =>
  ENEMY_ART[stage.major]?.[enemyKind(stage)] ?? null;

export const enemyArtsForMajor = (major: number): EnemyArt[] =>
  Object.values(ENEMY_ART[major] ?? {});

export const ENEMY_ART_MAJORS = Object.keys(ENEMY_ART).map(Number);
