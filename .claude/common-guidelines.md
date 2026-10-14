# 공통 개발 지침 (템플릿)

흔한 LLM 코딩 실수를 줄이기 위한 행동 지침 + Claude Code 도구 사용 취향. 프로젝트 특성과 무관해서 다른 레포에 그대로 복사해 재사용 가능. 고유 내용(스택/명령/위키/gotchas)은 프로젝트 루트 `CLAUDE.md`에 있음.

**트레이드오프:** 이 지침은 속도보다 신중함에 무게를 둠. 사소한 작업은 판단에 맡김.

## 필요한 플러그인

아래 섹션들이 전제하는 플러그인. `/plugin marketplace add <repo>` 후 `/plugin install <name>@<marketplace>`로 설치.

- **caveman** — Caveman 모드 섹션. 마켓플레이스: GitHub `JuliusBrussee/caveman`.
- **ponytail** — Ponytail 플러그인 지침 섹션. 마켓플레이스: GitHub `DietrichGebert/ponytail`.
- **oh-my-claudecode (OMC)** — 개발 지침 섹션(`/oh-my-claudecode:autopilot` 기본 사용). 마켓플레이스: GitHub `Yeachan-Heo/oh-my-claudecode`. ⚠️ Claude Code 네이티브 implicit agent team 기반이라 여전히 실험적 기능 — `settings.json`에 `"env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }` 추가하거나 환경변수 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`로 export 필요.

## 커밋 메시지 규칙

- 커밋 메시지는 항상 한글로 작성하세요.
- Conventional Commits 규칙을 따르세요 (`feat:`, `fix:`, `chore:`, `refactor:` 등).
- 짧은 서술형 구문 스타일로 작성하고, "했습니다", "하였습니다", "됩니다" 같은 완결형 문장으로 끝내지 마세요.
- "~개선", "~추가", "~수정", "~제거", "~반영", "~정리", "~지원" 같은 명사형 어미를 선호하세요 (예: "Layers collapse 시 Templates 영역 크기 유지", "Object Manager 패널 스타일 개선").
- 무엇이 왜 바뀌었는지 가능하면 1줄로 표현하세요.
- Co-authored-by 등의 trailer 라인은 추가하지 마세요.

## Caveman 모드

- 항상 한글로 답변하세요.
- 강도는 SessionStart 훅이 ultra로 자동 적용 — 수동 실행 불필요.

## Ponytail 플러그인 지침

코드 작성/수정 작업에는 `ponytail` 플러그인을 사용하세요. 불필요한 추상화, 미리 만드는 보일러플레이트, 과도한 설정 옵션 없이 최소한의 동작 코드를 우선합니다. 표준 라이브러리/기존 코드베이스 재사용 > 새 구현 순서를 따르고, 의도적으로 단순화한 부분은 한계와 확장 지점을 짧게 남기세요.

## 개발 지침

기능 추가/변경, 버그 수정, 리팩터링 같은 개발 작업은 OMC `autopilot` 스킬(`/oh-my-claudecode:autopilot`)을 기본으로 사용하세요. 요구사항 정리부터 계획, 구현, 리뷰, 검증까지 autopilot이 한 흐름으로 진행합니다. 오타 수정, 한 줄 설정 변경, 단순 질의 같은 사소한 작업은 autopilot 없이 직접 처리합니다.
