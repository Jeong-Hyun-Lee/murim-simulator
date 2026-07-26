# LLM Wiki 설계 (murim-simulator)

## 목적

murim-simulator 프로젝트(무림 시뮬레이터 게임) 관련 지식 축적용 위키. LLM(Claude Code)이 원본 소스를 읽고 구조화된 마크다운 위키로 통합·유지보수. 사용자는 소스 큐레이션, 질문, 방향 제시만 담당.

## 배경

- 저장소: `murim-simulator` (git, origin: github.com/Jeong-Hyun-Lee/murim-simulator), 커밋 1개(`e5b2e51 Initial commit`), README만 존재.
- 위키는 게임 코드와 같은 repo 안에 `wiki/` 폴더로 둠 (별도 repo 아님).
- 소스 종류: (1) 사용자가 직접 쓰는 게임 설계 메모/아이디어, (2) 외부 참고자료(무협 장르물, 리뷰, 세계관 자료) — 둘 다 해당.
- Ingest 방식: 배치 ingest 선호 (여러 소스 한번에 넣고 LLM이 감독 적게 자동 처리).
- Obsidian으로 위키를 병행 열람할 예정 → frontmatter/Dataview 호환 필요.
- 현재 `wiki/raw`에 넣을 소스 파일 없음 — 빈 구조부터 시작.
- repo에 기존 `CLAUDE.md` 없음.

## 아키텍처

```
wiki/
  CLAUDE.md        # 스키마 문서: ingest/query/lint 워크플로 정의
  index.md          # 카탈로그: 모든 페이지 링크 + 한줄요약 + 카테고리
  log.md            # append-only 로그: ## [YYYY-MM-DD] ingest|query|lint | 제목
  raw/               # 원본 소스, LLM이 절대 수정하지 않음 (source of truth)
    assets/          # Obsidian 첨부파일(이미지) 다운로드 타겟
  sources/           # ingest한 소스 1개당 요약 페이지 1개
  entities/          # 캐릭터, 문파/세력, NPC 등 개체 페이지
  concepts/          # 게임 시스템, 메커닉, 세계관 테마 등 개념 페이지
  synthesis/         # 설계 논지, 비교표, 질의응답 중 남길 가치있는 답변
```

카테고리(`entities/`, `concepts/`)는 무림 시뮬레이터 도메인에 맞춘 것으로, 프로젝트 성격이 바뀌면 조정 가능.

## 세 계층

1. **Raw sources** (`wiki/raw/`) — 불변. LLM이 읽기만 함.
2. **Wiki** (`wiki/{sources,entities,concepts,synthesis}/`, `index.md`, `log.md`) — LLM이 전적으로 소유·관리.
3. **Schema** (`wiki/CLAUDE.md`) — LLM 행동 규칙. 사용자와 LLM이 함께 계속 개선.

## 워크플로

### Ingest (배치)
1. 사용자가 `wiki/raw/`에 소스 파일 여러 개 배치.
2. "ingest해줘" 등으로 지시.
3. LLM이 각 소스를 읽고 (파일당 확인 없이 자동 처리):
   - `wiki/sources/<소스명>.md` 요약 페이지 작성.
   - 관련 `wiki/entities/*.md`, `wiki/concepts/*.md` 페이지 갱신 (신규 생성 포함). 기존 내용과 모순되는 정보 발견 시 명시적으로 표시.
   - `wiki/index.md`에 신규/갱신 페이지 반영.
   - `wiki/log.md`에 `## [YYYY-MM-DD] ingest | <소스명>` 항목 추가.
4. 전체 ingest 완료 후 사용자에게 변경사항 요약 보고 (파일별 중간 확인 없음).

### Query
1. LLM이 `wiki/index.md`를 먼저 읽어 관련 페이지 탐색.
2. 관련 페이지들을 읽고 출처 인용 포함해 답변 종합.
3. 답변 형식은 질문에 맞게 선택 (마크다운 페이지, 비교표, 필요시 다이어그램 등).
4. 남길 가치 있는 답변은 `wiki/synthesis/`에 새 페이지로 파일링하고 `index.md`/`log.md` 갱신.

### Lint (요청 시)
- 페이지 간 모순, 새 소스로 낡아진 주장, 고아 페이지(인바운드 링크 없음), 언급만 되고 전용 페이지 없는 개념, 누락된 상호참조 점검.
- 발견사항 보고 후 사용자 승인 받고 수정.

## 컨벤션

- **Frontmatter** (모든 wiki 페이지, YAML):
  ```yaml
  ---
  type: entity | concept | source | synthesis
  tags: []
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  sources: []   # 인용한 wiki/raw 파일명 목록
  ---
  ```
- **내용 언어**: 한글.
- **index.md 형식**: 카테고리별(entities/concepts/sources/synthesis) 섹션, 각 항목 `- [[페이지명]] — 한줄요약`.
- **log.md 형식**: 최신 항목이 파일 하단에 append. prefix 통일로 `grep "^## \["` 파싱 가능하게 유지.
- **raw/ 불변 원칙**: LLM은 raw 파일을 절대 수정하지 않음.
- Git: 게임 코드와 동일 저장소/커밋 흐름. 별도 브랜치 불필요.

## 범위 밖 (지금 안 함)

- CLI 검색 도구(qmd 등) — 현재 빈 구조 단계라 불필요. 위키 규모 커지면 재검토.
- 슬라이드덱(Marp), 차트 등 특수 출력 포맷 — 필요 시 나중에 추가.
- 게임 코드 자체 구조/구현 — 이 설계는 위키 레이어만 다룸.

## 성공 기준

- `wiki/CLAUDE.md`를 읽은 LLM이 별도 설명 없이 ingest/query/lint 워크플로를 수행할 수 있음.
- 빈 구조(`wiki/`, 하위 폴더, `index.md`, `log.md` 뼈대) 생성 및 커밋 완료.
