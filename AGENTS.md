# murim-simulator

"무림인 키우기" — 현대에서 살던 사람이 무림으로 이세계 전이해 성장하는 방치형(idle) 캔버스 웹게임.

@.claude/common-guidelines.md 지침을 따른다.

## 기획 위키

`wiki/` 폴더가 이 프로젝트의 지식 위키다. 작업 전 `wiki/AGENTS.md` 참고. 게임 기획 산출물(스토리, UX, 시스템 등)은 `wiki/concepts/`에 파일링한다.

위키 사서 역할: `wiki/` 내 산출물 추가·수정 시 기존 문서와 중복·모순 없는지 확인, 알맞은 폴더(`concepts/`, `design/`, `entities/`, `sources/`, `synthesis/`, `raw/`)에 분류, `wiki/index.md`와 `wiki/log.md` 최신 상태 유지 책임진다.

## 코딩 컨벤션 (2026-09-11부터)

- Airbnb JavaScript/React 스타일 가이드 준수. `.eslintrc.cjs`(`eslint-config-airbnb` + `airbnb-typescript` + `airbnb/hooks`) + `.prettierrc.json`(single quote/세미콜론/trailing comma)로 강제.
- 함수는 전부 화살표 함수(`const fn = () => {}`)로 정의 — `function` 키워드 선언 금지(ESLint `func-style`/`react/function-component-definition` 규칙으로 강제, React 컴포넌트도 동일).
- 비동기 처리는 `async`/`await` 사용, `.then()`/`.catch()` 체이닝 지양.
- 커밋 전 `npm run lint`(위반 시 `npm run lint:fix`) + `npm run format` 실행.

## 환경 노트

- GateGuard 훅 활성: 세션 첫 Edit/Bash 호출 시 사실 제시(영향 파일/함수, 요청 원문 등) 요구 → 바로 제공 후 재시도.
- `.Codex/settings.local.json`은 로컬 전용, 커밋 제외 (gitignore 미등록이어도 관례상 제외).
