# LLM Wiki Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the empty `wiki/` folder skeleton, `index.md`, `log.md`, and `wiki/CLAUDE.md` schema doc inside the `murim-simulator` repo, per the approved design at `docs/superpowers/specs/2026-07-26-llm-wiki-design.md`.

**Architecture:** Pure markdown/folder scaffolding, no application code. Each task creates one structural piece of the wiki and verifies it with `git status` / `grep` checks instead of unit tests — there is no runtime to execute.

**Tech Stack:** Markdown, git. No frameworks.

## Global Constraints

- Wiki lives at `wiki/` inside the existing `murim-simulator` repo (not a separate repo).
- `wiki/raw/` is immutable — LLM never edits files under it, ever.
- Wiki content language: 한글.
- Every wiki content page (`sources/`, `entities/`, `concepts/`, `synthesis/`) uses this exact frontmatter:
  ```yaml
  ---
  type: entity | concept | source | synthesis
  tags: []
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  sources: []
  ---
  ```
- `index.md` is organized into category sections: Entities, Concepts, Sources, Synthesis. Each entry: `- [[페이지명]] — 한줄요약`.
- `log.md` is append-only, newest entries at the bottom, one line per entry: `## [YYYY-MM-DD] ingest|query|lint | 제목` — must stay `grep "^## \["`-parseable.
- Ingest workflow is batch-style: no per-file confirmation, summary report only at the end.
- Attachment folder convention: `wiki/raw/assets/` (this is what the user will point Obsidian's "Attachment folder path" setting at manually — not something this plan configures).

---

### Task 1: Wiki folder skeleton

**Files:**
- Create: `wiki/raw/assets/.gitkeep`
- Create: `wiki/sources/.gitkeep`
- Create: `wiki/entities/.gitkeep`
- Create: `wiki/concepts/.gitkeep`
- Create: `wiki/synthesis/.gitkeep`

**Interfaces:**
- Produces: the directory layout (`wiki/raw/assets/`, `wiki/sources/`, `wiki/entities/`, `wiki/concepts/`, `wiki/synthesis/`) that Tasks 2–4 write files into.

- [ ] **Step 1: Create the directories with placeholder files**

Git does not track empty directories, so each leaf directory gets a `.gitkeep` placeholder.

```bash
mkdir -p wiki/raw/assets wiki/sources wiki/entities wiki/concepts wiki/synthesis
touch wiki/raw/assets/.gitkeep wiki/sources/.gitkeep wiki/entities/.gitkeep wiki/concepts/.gitkeep wiki/synthesis/.gitkeep
```

- [ ] **Step 2: Verify the layout**

Run: `find wiki -type d | sort`
Expected output:
```
wiki
wiki/concepts
wiki/entities
wiki/raw
wiki/raw/assets
wiki/sources
wiki/synthesis
```

- [ ] **Step 3: Commit**

```bash
git add wiki/raw/assets/.gitkeep wiki/sources/.gitkeep wiki/entities/.gitkeep wiki/concepts/.gitkeep wiki/synthesis/.gitkeep
git commit -m "Scaffold wiki/ folder layout"
```

---

### Task 2: index.md

**Files:**
- Create: `wiki/index.md`

**Interfaces:**
- Consumes: category directory names from Task 1 (`entities/`, `concepts/`, `sources/`, `synthesis/`).
- Produces: the `wiki/index.md` file that Task 4's `CLAUDE.md` instructs the LLM to read first on every query, and to update on every ingest.

- [ ] **Step 1: Write index.md**

```markdown
# 위키 색인

무림 시뮬레이터 프로젝트 지식 위키의 전체 카탈로그. 새 페이지가 생기거나 갱신될 때마다 이 파일도 함께 갱신한다. 질문에 답하기 전 이 파일을 먼저 읽고 관련 페이지를 찾는다.

## Entities

(캐릭터, 문파/세력, NPC 등 — 아직 없음)

## Concepts

(게임 시스템, 메커닉, 세계관 테마 등 — 아직 없음)

## Sources

(ingest한 원본 소스 요약 — 아직 없음)

## Synthesis

(설계 논지, 비교, 질의응답 중 남긴 답변 — 아직 없음)
```

- [ ] **Step 2: Verify required sections exist**

Run: `grep -E "^## (Entities|Concepts|Sources|Synthesis)$" wiki/index.md`
Expected: 4 matching lines, one per category.

- [ ] **Step 3: Commit**

```bash
git add wiki/index.md
git commit -m "Add wiki index.md skeleton"
```

---

### Task 3: log.md

**Files:**
- Create: `wiki/log.md`

**Interfaces:**
- Produces: the append-only log file that Task 4's `CLAUDE.md` instructs the LLM to append one line to on every ingest/query/lint.

- [ ] **Step 1: Write log.md with format header and first entry**

```markdown
# 위키 로그

append-only 기록. 새 항목은 항상 파일 맨 아래에 추가한다. 형식을 지켜야 `grep "^## \["` 로 파싱 가능하다:

`## [YYYY-MM-DD] ingest|query|lint | 제목`

---

## [2026-07-26] lint | 위키 초기 구조 생성
```

- [ ] **Step 2: Verify format is grep-parseable**

Run: `grep "^## \[" wiki/log.md`
Expected: `## [2026-07-26] lint | 위키 초기 구조 생성`

- [ ] **Step 3: Commit**

```bash
git add wiki/log.md
git commit -m "Add wiki log.md skeleton"
```

---

### Task 4: wiki/CLAUDE.md schema doc

**Files:**
- Create: `wiki/CLAUDE.md`

**Interfaces:**
- Consumes: category names and file paths from Tasks 1–3 (`wiki/index.md`, `wiki/log.md`, `wiki/{sources,entities,concepts,synthesis}/`).
- Produces: the schema document that governs every future Claude Code session working inside `wiki/` — this is the terminal deliverable of the plan.

- [ ] **Step 1: Write wiki/CLAUDE.md**

```markdown
# 위키 스키마 — murim-simulator

이 폴더는 murim-simulator(무림 시뮬레이터 게임) 프로젝트의 지식 위키다. 원본 소스를 읽고 구조화된 마크다운으로 통합·유지보수하는 것이 이 문서를 읽는 LLM의 역할이다. 사용자는 소스 큐레이션, 질문, 방향 제시만 한다.

## 계층

1. **`raw/`** — 원본 소스. 불변. **이 폴더 안 파일은 절대 수정하지 않는다.**
2. **`sources/`, `entities/`, `concepts/`, `synthesis/`, `index.md`, `log.md`** — 위키 본체. LLM이 전적으로 소유·관리한다.
3. **이 파일(`CLAUDE.md`)** — 스키마. 사용자와 함께 계속 개선한다.

## 카테고리 정의

- **`entities/`** — 캐릭터, 문파/세력, NPC 등 개체 하나당 페이지 하나.
- **`concepts/`** — 게임 시스템, 메커닉, 세계관 테마 등 개념 하나당 페이지 하나.
- **`sources/`** — `raw/`에 ingest한 소스 하나당 요약 페이지 하나. 파일명은 원본 소스 파일명과 대응시킨다.
- **`synthesis/`** — 질의응답 중 남길 가치 있는 답변, 비교표, 설계 논지.

## Frontmatter

모든 wiki 페이지(위 4개 카테고리) 최상단에 다음 YAML을 붙인다:

```yaml
---
type: entity | concept | source | synthesis
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []   # 이 페이지 내용의 근거가 된 raw/ 파일명 목록
---
```

`created`는 최초 생성일로 고정, `updated`는 내용을 바꿀 때마다 오늘 날짜로 갱신한다.

## Ingest (배치)

1. 사용자가 `raw/`에 소스 파일을 하나 이상 넣고 ingest를 지시한다.
2. 각 소스를 읽는다. **파일마다 확인을 받지 않고** 이어서 처리한다:
   - `sources/<소스명>.md`에 요약 페이지를 쓴다(신규 또는 갱신).
   - 관련된 `entities/*.md`, `concepts/*.md`를 갱신하거나 새로 만든다.
   - 기존 페이지 내용과 새 소스가 모순되면 삭제하지 말고 두 주장을 모두 남기고 모순 사실을 명시한다.
   - `index.md`에서 해당 카테고리 섹션에 신규/갱신 페이지를 반영한다.
   - `log.md` 맨 아래에 `## [YYYY-MM-DD] ingest | <소스명>` 한 줄을 추가한다.
3. 모든 소스 처리가 끝나면 사용자에게 변경사항(새/갱신 페이지 목록, 발견한 모순)을 요약 보고한다.

## Query

1. 먼저 `index.md`를 읽어 관련 페이지를 찾는다.
2. 관련 페이지를 읽고, 출처(어떤 `sources/` 또는 `raw/` 파일에 근거하는지)를 인용하며 답한다.
3. 질문 성격에 맞는 형식으로 답한다 — 마크다운 설명, 비교표 등.
4. 남길 가치가 있는 답변은 `synthesis/`에 새 페이지로 저장하고 `index.md`, `log.md`를 갱신한다.

## Lint (요청 시에만 수행)

다음을 점검하고 발견사항을 보고한 뒤, 사용자 승인을 받고서 수정한다:

- 페이지 간 모순되는 서술
- 새 소스로 인해 낡아진 주장
- 고아 페이지 (다른 어떤 페이지에서도 링크되지 않음)
- 여러 페이지에서 언급되지만 전용 페이지가 없는 개념/개체
- 있어야 할 상호참조(위키링크)가 빠진 곳

## 규칙 요약

- `raw/` 파일은 절대 수정하지 않는다.
- ingest는 배치 처리, 파일별 중간 확인 없음, 끝나고 요약 보고.
- 위키 내용 언어는 한글.
- `index.md`, `log.md`는 ingest/query/lint 때마다 함께 갱신한다.
- `log.md`는 append-only, 새 항목은 파일 맨 아래.
```

- [ ] **Step 2: Verify required sections exist**

Run: `grep -E "^## (계층|카테고리 정의|Frontmatter|Ingest \(배치\)|Query|Lint|규칙 요약)$" wiki/CLAUDE.md`
Expected: 7 matching lines.

- [ ] **Step 3: Commit**

```bash
git add wiki/CLAUDE.md
git commit -m "Add wiki/CLAUDE.md schema doc"
```

---

### Task 5: Final structure check

**Files:**
- None created — verification only.

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: confirmation that the scaffold is complete and committed, and the exact Obsidian vault path to hand back to the user.

- [ ] **Step 1: Verify full tree and clean git status**

Run: `find wiki -type f | sort && git status --short`
Expected: lists `wiki/CLAUDE.md`, `wiki/index.md`, `wiki/log.md`, and the five `.gitkeep` files; `git status --short` prints nothing (all committed).

- [ ] **Step 2: Report Obsidian manual setup steps to the user**

Not a file change. Tell the user, in the chat, to:
1. Open Obsidian → "Open folder as vault" → select `D:\dev\murim-simulator\wiki`.
2. Settings → Files and links → Attachment folder path → set to `raw/assets`.
3. Settings → Hotkeys → search "Download attachments for current file" → bind a hotkey (e.g. Ctrl+Shift+D).

These are manual Obsidian-app steps; no file in this repo configures them.
