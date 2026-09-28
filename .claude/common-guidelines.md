# 공통 개발 지침 (템플릿)

흔한 LLM 코딩 실수를 줄이기 위한 행동 지침 + Claude Code 도구 사용 취향. 프로젝트 특성과 무관해서 다른 레포에 그대로 복사해 재사용 가능. 고유 내용(스택/명령/위키/gotchas)은 프로젝트 루트 `CLAUDE.md`에 있음.

**트레이드오프:** 이 지침은 속도보다 신중함에 무게를 둠. 사소한 작업은 판단에 맡김.

## 필요한 플러그인

아래 섹션들이 전제하는 플러그인. `/plugin marketplace add <repo>` 후 `/plugin install <name>@<marketplace>`로 설치.

- **caveman** — Caveman 모드 섹션. 마켓플레이스: GitHub `JuliusBrussee/caveman`.
- **ponytail** — Ponytail 플러그인 지침 섹션. 마켓플레이스: GitHub `DietrichGebert/ponytail`.
- **superpowers** — Superpowers 플러그인 지침 섹션 및 에이전트 팀 섹션 1단계. 마켓플레이스: GitHub `obra/superpowers-marketplace`.
- **ecc** — Superpowers 섹션(`ecc:browser-qa`) 및 에이전트 팀 섹션 2단계(`ecc:team-builder`). 마켓플레이스: `https://github.com/affaan-m/ECC.git`.
- **harness** — 에이전트 팀 섹션 3단계(팀 아키텍처 설계). 마켓플레이스: GitHub `revfactory/harness`.
- **oh-my-claudecode (OMC)** — 에이전트 팀 섹션 4단계(`/oh-my-claudecode:team`, 별칭 `/team`). 마켓플레이스: GitHub `Yeachan-Heo/oh-my-claudecode`. ⚠️ Claude Code 네이티브 implicit agent team 기반이라 여전히 실험적 기능 — `settings.json`에 `"env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }` 추가하거나 환경변수 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`로 export 필요.

## 코딩 전에 생각하기

**추측 금지. 혼란 숨기지 않기. 트레이드오프 드러내기.**

구현 전:

- 가정을 명시적으로 밝힘. 불확실하면 질문.
- 여러 해석이 가능하면 모두 제시 - 조용히 하나만 고르지 않음.
- 더 단순한 방법 있으면 언급. 근거 있으면 반박도 함.
- 불명확하면 멈춤. 무엇이 헷갈리는지 명시. 질문.

## 단순함 우선

**문제 해결에 필요한 최소 코드. 추측성 코드 없음.**

- 요청받지 않은 기능 없음.
- 1회성 코드에 추상화 없음.
- 요청하지 않은 "유연성"이나 "설정 가능성" 없음.
- 발생 불가능한 시나리오용 에러 처리 없음.
- 200줄 짜리가 50줄로 줄일 수 있다면 다시 씀.

자문: "시니어 엔지니어가 이걸 과도하다고 할까?" 그렇다면 단순화.

## 외과적 변경

**꼭 필요한 것만 건드림. 자기가 만든 것만 정리.**

기존 코드 수정 시:

- 인접 코드, 주석, 포맷팅 "개선" 안 함.
- 안 망가진 것 리팩터링 안 함.
- 본인 스타일이 달라도 기존 스타일 맞춤.
- 관련 없는 죽은 코드 발견하면 언급만 - 삭제 안 함.

변경으로 고아 코드 생겼을 때:

- 본인 변경으로 안 쓰이게 된 import/변수/함수는 제거.
- 요청 없이 기존 죽은 코드 제거 안 함.

기준: 변경된 모든 줄은 사용자 요청과 직접 연결돼야 함.

## 목표 지향 실행

**성공 기준 정의. 검증될 때까지 반복.**

작업을 검증 가능한 목표로 전환:

- "검증 추가" → "잘못된 입력에 대한 테스트 작성 후 통과시키기"
- "버그 수정" → "재현하는 테스트 작성 후 통과시키기"
- "X 리팩터링" → "리팩터링 전후 테스트 통과 확인"

다단계 작업은 간단한 계획 명시:

```
1. [단계] → 검증: [확인 항목]
2. [단계] → 검증: [확인 항목]
3. [단계] → 검증: [확인 항목]
```

강한 성공 기준은 독립적 반복을 가능케 함. 약한 기준("작동하게 하기")은 계속된 확인 필요.

---

**이 지침이 작동 중이라는 신호:** 불필요한 diff 변경 감소, 과도한 설계로 인한 재작업 감소, 실수 이후가 아닌 구현 전에 나오는 확인 질문.

## 커밋 메시지 규칙

- 커밋 메시지는 항상 한글로 작성하세요.
- Conventional Commits 규칙을 따르세요 (`feat:`, `fix:`, `chore:`, `refactor:` 등).
- 짧은 서술형 구문 스타일로 작성하고, "했습니다", "하였습니다", "됩니다" 같은 완결형 문장으로 끝내지 마세요.
- "~개선", "~추가", "~수정", "~제거", "~반영", "~정리", "~지원" 같은 명사형 어미를 선호하세요 (예: "Layers collapse 시 Templates 영역 크기 유지", "Object Manager 패널 스타일 개선").
- 무엇이 왜 바뀌었는지 가능하면 1줄로 표현하세요.
- Co-authored-by 등의 trailer 라인은 추가하지 마세요.

## Caveman 모드

- 항상 한글로 답변하세요.
- 세션 중 `/caveman ultra` 모드가 적용되어 있지 않다면 `/caveman ultra` 명령을 1번 실행하세요.

## Ponytail 플러그인 지침

코드 작성/수정 작업에는 `ponytail` 플러그인을 사용하세요. 불필요한 추상화, 미리 만드는 보일러플레이트, 과도한 설정 옵션 없이 최소한의 동작 코드를 우선합니다. 표준 라이브러리/기존 코드베이스 재사용 > 새 구현 순서를 따르고, 의도적으로 단순화한 부분은 한계와 확장 지점을 짧게 남기세요.

## Superpowers 플러그인 지침

작업 시작 전 관련 스킬 있으면 반드시 사용 — 특히 프로세스 스킬을 구현 스킬보다 먼저 적용:

- 새 기능/변경 착수 전: `superpowers:brainstorming` — 요구사항·의도 먼저 탐색, 바로 구현 안 함.
- 버그·테스트 실패·예상 밖 동작: `superpowers:systematic-debugging` — 원인 규명 먼저, 바로 고치지 않음.
- 스펙/요구사항 있는 다단계 작업: `superpowers:writing-plans`로 계획 작성 후 `superpowers:executing-plans`로 실행.
- 신규 기능/버그 수정 구현: `superpowers:test-driven-development`.
- 완료·수정·통과 주장 전: `superpowers:verification-before-completion` — 검증 명령 실제로 실행하고 출력 확인 후에만 주장.
- 개발 브랜치 마무리 시: `superpowers:finishing-a-development-branch`.

UI 동작 검증은 아래 "에이전트 팀 기능 지침" 횡단 규칙(`ecc:browser-qa`)을 따르세요.

## 에이전트 팀 기능 지침 (Agent Teams Guidelines)

멀티 에이전트로 작업할지 판단할 때 아래 4단계를 순서대로 거칩니다. 각 단계는 역할이 배타적이므로 건너뛰지 말고 순서대로 확인하세요.

### 1단계: 단일 세션으로 충분한가?

대부분의 기능 개발/버그 수정은 여기서 끝납니다. 위 "Superpowers 플러그인 지침"의 프로세스 스킬(브레인스토밍 → 계획 → TDD → 검증)만 적용하고 2~4단계는 건너뜁니다. 태스크가 여러 도메인(예: 보안 + 성능 + QA)에 걸쳐 있거나 대규모 파일 분석이 필요할 때만 2단계로 진행합니다.

### 2단계: 재사용 가능한 에이전트가 이미 있고, 서로 대화 없이 병렬 실행 + 결과 취합만 하면 되는가?

- **YES:** `ecc:team-builder`로 기존 `.claude/agents/*.md` 페르소나를 즉석 조합해 병렬 디스패치합니다. 신규 파일 생성 없이 1회성으로 사용하고 3~4단계는 건너뜁니다.
- **NO** (전용 팀이 없거나 에이전트 간 실제 리뷰·대화가 필요한 경우) → 3단계로 진행합니다.

### 3단계: 팀 아키텍처 신규 설계 (도메인당 1회)

`harness` 플러그인으로 "하네스 구성해줘" 요청 → 도메인 분석 후 6개 패턴(Pipeline/Fan-out-Fan-in/Expert Pool/Producer-Reviewer/Supervisor/Hierarchical Delegation) 중 선택 → `.claude/agents/*.md` + `.claude/skills/*/SKILL.md` 생성. 매번 반복하지 않고 팀 자산으로 재사용합니다.

### 4단계: 팀 실행/조정

3단계에서 설계했거나 이미 존재하는 팀을 실제로 가동할 때 `oh-my-claudecode`(OMC) 플러그인의 `team` 스킬로 실행합니다:

- **호출:** `/oh-my-claudecode:team N:agent-type "작업설명"`(별칭 `/team`). N·agent-type 생략 시 작업 분해 기반 자동 라우팅.
- **런타임:** Claude Code 네이티브 implicit agent team(2.1.178+) 사용 — 별도 `TeamCreate` 없이 현재 세션이 곧 팀이고, 팀원은 `Agent`/`Task` 툴로 고유 `name`을 부여받아 직접 스폰됨.
- **파이프라인:** `team-plan → team-prd → team-exec → team-verify → team-fix`(실패 시 루프) 단계별로 전용 에이전트 자동 배정 — 계획(`explore`/`planner`/`architect`) → 요구사항(`analyst`/`critic`) → 실행(`executor`/`debugger`/`designer` 등) → 검증(`verifier`/`security-reviewer`/`code-reviewer`).
- **동기화:** 팀원 간 메시지는 활성 팀/대화 surface로 자동 전달됨 — 별도 SQLite나 메시징 인프라 불필요(레거시 swarm 방식 대체). 단계 전환마다 `.omc/handoffs/<stage>.md`에 결정사항·기각안·리스크를 남겨 컨텍스트 압축이나 재시작에도 이어지게 함.
- **최종 종합(Synthesis):** `team-verify` 통과 후 팀 리더가 결과를 요약하고, `/oh-my-claudecode:cancel`로 우아한 shutdown(팀원 확인 응답 대기 후 정리)을 수행해 세션을 종료합니다.

### 횡단 규칙 (모든 경로 공통)

- 개발 완료 후에는 항상 `ecc:browser-qa`로 브라우저 자동화를 통해 실제 화면에서 검증합니다.
