# murim-simulator

"무림인 키우기" — 현대에서 살던 사람이 무림으로 이세계 전이해 성장하는 방치형(idle) 캔버스 웹게임.

@.claude/common-guidelines.md 지침을 따른다.

## 전투 캐릭터 방향

- 캐릭터 이미지 생성·재생성·배경 제거·시트 패킹 전에 `wiki/concepts/캐릭터-이미지-생성-지침.md`를 읽고 따른다. 생성 후보와 검증된 런타임 에셋을 구분하고, 실제 알파·프레임 크기·여백·기준점·모션 간 배율을 검수한다.

- 주인공(목현)만 전투 캔버스 화면 왼쪽에 배치하고 화면 오른쪽을 바라보게 생성한다.
- 적 캐릭터는 모두 화면 오른쪽에 배치하고 화면 왼쪽을 바라보게 생성한다. 적 스프라이트를 좌우 반전해 이 규칙을 우회하지 않는다.

## 기획 위키

`wiki/` 폴더가 이 프로젝트의 지식 위키다. 작업 전 `wiki/AGENTS.md` 참고. 게임 기획 산출물(스토리, UX, 시스템 등)은 `wiki/concepts/`에 파일링한다.

위키 사서 역할: `wiki/` 내 산출물 추가·수정 시 기존 문서와 중복·모순 없는지 확인, 알맞은 폴더(`concepts/`, `design/`, `entities/`, `sources/`, `synthesis/`, `raw/`)에 분류, `wiki/index.md`와 `wiki/log.md` 최신 상태 유지 책임진다.

폐기 처리 원칙: 문서·에셋·기능을 폐기하면 **폐기했다는 기록을 남기지 않는다**. "(폐기)" 표기나 취소선으로 흔적을 남기지 말고 관련 서술·링크·색인 항목·로그 항목을 전부 제거하며, 남는 문장은 현재 사실만 말하도록 고친다. 코드 주석이 사라진 문서를 가리키면 경로만 걷어내고 규칙 설명은 남긴다. 문서가 폐기 이력으로 계속 길어지는 것을 막기 위함이다.

## 코딩 컨벤션 (2026-09-11부터)

- Airbnb JavaScript/React 스타일 가이드 준수. `.eslintrc.cjs`(`eslint-config-airbnb` + `airbnb-typescript` + `airbnb/hooks`) + `.prettierrc.json`(single quote/세미콜론/trailing comma)로 강제.
- 함수는 전부 화살표 함수(`const fn = () => {}`)로 정의 — `function` 키워드 선언 금지(ESLint `func-style`/`react/function-component-definition` 규칙으로 강제, React 컴포넌트도 동일).
- 비동기 처리는 `async`/`await` 사용, `.then()`/`.catch()` 체이닝 지양.
- 커밋 전 `npm run lint`(위반 시 `npm run lint:fix`) + `npm run format` 실행.

## 환경 노트

- GateGuard 훅 활성: 세션 첫 Edit/Bash 호출 시 사실 제시(영향 파일/함수, 요청 원문 등) 요구 → 바로 제공 후 재시도.
- `.Codex/settings.local.json`은 로컬 전용, 커밋 제외 (gitignore 미등록이어도 관례상 제외).
