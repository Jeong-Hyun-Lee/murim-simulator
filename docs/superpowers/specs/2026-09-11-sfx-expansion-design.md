---
title: 오디오 SFX 확장 + 효과음 설정 토글
date: 2026-09-11
status: approved
---

# 배경

`wiki/synthesis/기획-공백-브레인스토밍.md`가 "BGM/효과음 언급이 9개 문서 전체에서 전무"함을 공백으로 지적. 현재 구현 상태는 버튼 클릭음(`src/audio/clickSound.ts`) 하나뿐. 전투/가챠/강화 등 핵심 이벤트에 SFX를 붙이고, 사운드 on/off 설정을 추가한다.

# 범위

- SFX 8종: 클릭(기존), 타격, 치명타, 승리, 패배, 가챠 결과 공개, 강화 성공, 강화 실패
- 효과음 on/off 토글 UI 1개
- **범위 밖**: BGM, 등급별 가챠 연출 차등, 풀 설정 팝업(언어/로그아웃/사운드 개별 슬라이더 등)

# 아키텍처

`src/audio/clickSound.ts` → `src/audio/sfx.ts`로 확장.

- 공유 `AudioContext` 싱글톤 + `playTone(opts)` 헬퍼(주파수 시작/끝, duration, oscillator type, gain envelope) — 기존 `playClickSound` 로직을 일반화.
- 이벤트별 재생 함수: `playClick`, `playHit`, `playCrit`, `playVictory`, `playDefeat`, `playGachaReveal`, `playEnhanceSuccess`, `playEnhanceFail`. 모두 재생 전 `isSfxEnabled()` 체크.
- 설정 상태: 모듈 전역 플래그, `localStorage` 키 `murim-simulator-sfx-enabled` (기본 true, 게임 세이브 `SAVE_KEY`와 분리). `isSfxEnabled()`/`setSfxEnabled(bool)` export.
- React 연동용 `useSfxEnabled(): [boolean, () => void]` 훅 export — TopBar 토글 버튼용.

# 연결 지점

| 이벤트 | 파일 | 트리거 |
|---|---|---|
| 클릭 | `main.tsx` | 기존 전역 delegation 유지, import 경로만 변경 |
| 타격/치명타 | `canvas/BattleCanvas.tsx` | `playerAttack()` 반환 `isCrit` 분기, 기존 hit effect 스폰 옆 |
| 승리 | `canvas/BattleCanvas.tsx` | `playerAttack()` 반환 `enemyDefeated` true (사냥터 처치/일반 클리어/보스 격파 보류 상태 전부 포함) |
| 패배 | `canvas/BattleCanvas.tsx` | `enemyAttack()` 반환 `playerDefeated` true |
| 가챠 결과 | `components/panels/GachaPanel.tsx` | `lastGachaOutcome` 변화 감지 `useEffect`, 결과 존재 시 1회 |
| 강화 성공/실패 | `game/store.ts` + `components/panels/GearPanel.tsx` | `enhanceItem`이 `void` → `{ success: boolean }` 반환하도록 시그니처 확장(playerAttack/enemyAttack과 동일 패턴). GearPanel onClick에서 분기 |

# 설정 UI

위키 기획(톱니바퀴 팝업: 사운드/언어/로그아웃)은 이번 범위 밖. `TopBar.tsx`의 기존 "일시정지" 토글 버튼과 동일한 스타일로 "효과음 ON/OFF" 버튼 1개만 추가.

# 에러 처리

기존 `clickSound.ts`와 동일하게 AudioContext 생성은 첫 사용자 제스처(클릭) 안에서 지연 생성. 별도 에러 처리 불필요(브라우저 미지원 시 조용히 무동작 — Web Audio는 모든 타깃 브라우저에서 지원).

# 테스트

자동 테스트 프레임워크 없음(프로젝트 컨벤션). `npx tsc --noEmit` + `npm run build` + claude-in-chrome 실브라우저 검증(각 이벤트 최소 1회 실제 트리거, 콘솔 에러 없음 확인, 토글 off 시 무음 확인).
