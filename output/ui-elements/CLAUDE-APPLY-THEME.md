# UI 테마 에셋 적용 작업 지시

## 목표

`assets/ui/theme/`의 검수된 에셋 4종을 기존 게임의 테마 레이어로 적용한다. 화면 구조, React 상태 처리, 스크롤, 팝업 초점 처리와 전투 캔버스 동작은 바꾸지 않는다.

## 먼저 읽을 파일

- `AGENTS.md`
- `wiki/concepts/UI-Element-대체-기획서.md` 2.4, 3, 4.3, 4.4, 5.6, 6, 8장
- `assets/ui/manifest.json`
- `src/style.css`

`assets/ui/`의 모든 적용 대상은 눈에 보이는 알파(8 초과) 경계까지 외곽 여백을 제거한 파일이다. 적용 크기와 3·9-slice 값은 반드시 최신 `manifest.json`의 `sourceSize`·`slice`를 읽고, 이미지 자체에 여백이 있다고 보고 CSS `padding`이나 보정 오프셋을 추가하지 않는다.

## 적용 범위

현재 테마 단계는 `src/style.css`만 수정한다. 이후 P0 프레임 적용 단계도 `src/style.css`만 수정하며, `src/App.tsx`와 게임 로직은 수정하지 않는다.

## 다음 승인 에셋

`frame-panel-hanji`가 추가되었다. `/ui/frame/frame-panel-hanji.webp`를 `.card`의 `border-image`로 적용하고, 이미지가 없을 때 현재 `background`, `border`, `border-radius`가 남도록 선언 순서를 유지한다. slice는 원본 40px이다.

`frame-panel-dark`가 추가되었다. `/ui/frame/frame-panel-dark.webp`를 보스 카드·보드 선택 목록과 `.full-view` 머리에 9-slice로 적용한다. 원본의 네 방향 48px만 고정하고 가운데 목재 면을 늘린다. 강조 정보의 기존 텍스트 대비와 동적 내용은 보존한다.

`frame-header-eave`가 추가되었다. `/ui/frame/frame-header-eave.webp`를 `#app-header`의 가로 3-slice 배경으로 적용한다. 양끝 120px은 고정하고 가운데 기와 줄만 늘린다. 기존 어두운 `background` 색은 이미지 실패 시 폴백으로 남기며, 헤더의 안전 영역 높이·자식 레이아웃·텍스트 대비는 바꾸지 않는다.

`frame-tabbar`가 추가되었다. `/ui/frame/frame-tabbar.webp`를 `#tab-bar`의 가로 3-slice 배경으로 적용한다. 양끝 96px은 고정하고 가운데 난간·돌바닥만 늘린다. 하단 안전 영역, 탭의 클릭 영역과 활성·잠김 상태 CSS는 유지한다.

`frame-battle-stage`가 추가되었다. `/ui/frame/frame-battle-stage.webp`를 전투 캔버스의 기존 `.battle-stage-frame` 둘레에 9-slice로 적용한다. 원본 slice는 40px이며 중앙 알파 영역으로 캔버스가 그대로 보여야 한다. 전투 캔버스 크기·좌표·HUD와 애니메이션은 변경하지 않는다.

`frame-popup`이 추가되었다. `/ui/frame/frame-popup.webp`를 `dialog.sheet .sheet-inner`의 9-slice 프레임으로 적용한다. top 96px, 나머지 56px slice를 유지하고, 팝업의 초점 처리·최대 높이·본문 스크롤·닫기 동작은 바꾸지 않는다.

`frame-title-plaque`가 추가되었다. `/ui/frame/frame-title-plaque.webp`를 `.sheet-header`의 가로 3-slice 제목 현판 바탕으로 적용한다. 동적 제목 텍스트와 기존 접근성 이름은 HTML로 유지한다.

`frame-gauge-player`가 추가되었다. `/ui/gauge/frame-gauge-player.webp`를 플레이어 HP 게이지의 가로 3-slice 테두리로 적용한다. 좌측 옥 장식 36px과 우측 마감 24px을 고정하고, 가운데만 늘린다. 현재 HP 수치·채움 폭 계산·전투 로직은 변경하지 않는다.

`frame-gauge-exp`가 추가되었다. `/ui/gauge/frame-gauge-exp.webp`를 경험치 게이지의 가로 3-slice 테두리로 적용한다. 좌우 12px을 고정하고 가운데만 늘린다. 경험치 수치·채움 폭 계산과 성장 로직은 변경하지 않는다.

게이지 채움 에셋 8종이 추가되었다. 적은 `fill-hp-enemy`와 `fill-hp-enemy-trail`, 보스는 `fill-hp-boss`와 `fill-hp-boss-trail`, 플레이어는 `fill-hp-player`와 `fill-hp-player-trail`, 경험치는 `fill-exp`, 공용 광택은 `overlay-gauge-gloss`를 `/ui/gauge/`에서 반복 배경으로 사용한다. 잔상은 현재 채움보다 0.35초 늦게 줄어들되, 회복 시 즉시 맞춘다. 광택은 채움 위에만 얹고 `pointer-events: none`으로 둔다. 수치 텍스트와 퍼센트 계산·위험 상태·접근성 설정은 기존 HTML/CSS 로직으로 유지한다.

P0 고정 문구 라벨 30종을 `/ui/label/`에 추가했다. `label-*`은 버튼 배경 위에, `title-*`은 제목 현판 위에, `section-goal-*`은 목표 구역 제목에 원본 비율로 배치한다. 라벨 이미지는 동적 수치·이름·상태 문구를 대체하지 않는다. 버튼의 클릭 영역·aria-label·비활성 상태 처리는 기존 HTML/CSS에 남긴다.

하단 탭 8종과 원본 아이콘 4종을 추가했다. `/ui/tab/tab-gong(-active).webp`, `tab-gear(-active)`, `tab-sect(-active)`, `tab-shop(-active)`를 각 기존 하단 탭에 배경 이미지로 배치한다. 현재 선택 탭에만 `-active` 변형을 쓰며, 잠김 표식과 새로 열림 점은 별도 CSS 레이어로 유지한다. 클릭 이벤트·선택 상태·aria-label은 변경하지 않는다.

상단 재화 칩과 비용 표시에 P0 아이콘 5종을 추가했다: `/ui/icon/icon-gold.webp`, `icon-chi.webp`, `icon-elixir.webp`, `icon-contribution.webp`, `icon-stones.webp`. 각각 20px로 수치 앞에 놓고 재화 이름·수치·비용 계산·aria-label은 HTML로 유지한다.

공통 기능 아이콘 6종을 추가했다: `icon-settings`, `icon-close`, `icon-back`, `icon-lock`은 24px, `icon-dropdown`은 16px, `icon-badge`는 12px이다. 모두 `/ui/icon/`에서 원본 비율로 사용한다. 설정·닫기·뒤로 버튼의 클릭 대상과 aria-label, 잠금 조건·배지 표시 로직은 기존 구현을 유지한다.

전투 상태 아이콘 6종을 추가했다: `icon-status-auto`, `icon-status-paused`, `icon-status-farm`, `icon-status-boss`, `icon-status-reward`, `icon-climb`. 전투 상태 문구·보스 이름·스테이지 번호는 기존 HTML로 유지하고, 이 아이콘은 해당 내용 앞의 20px 보조 표식으로만 사용한다.

무공·장비 능력치의 P0 아이콘 6종을 추가했다: `icon-stat-power`, `icon-stat-crit-chance`, `icon-stat-crit-damage`, `icon-stat-attack-speed`, `icon-stat-evasion`, `icon-stat-chi-gain`. 모두 20px 보조 표식이며 능력치 이름·수치·계산은 HTML로 유지한다.

전투 보조 아이콘 6종을 추가했다: `icon-stat-hp`, `icon-combat-power`, `icon-tower`, `icon-hourglass`, `icon-action-train`, `icon-diff-up`. 각각 기존 HP·전투력·수련탑·시간·연마·증가 표현 앞의 보조 표식으로 배치하고 수치·타이머·행동 로직은 유지한다.

설정·목표 아이콘 3종을 추가했다: `icon-sfx-on`, `icon-sfx-off`, `icon-goal`. 모두 24px으로 설정의 효과음 제어와 전투 상태 줄의 수련 목표 버튼 앞에 둔다. 효과음 설정값·목표 수·버튼 동작은 기존 로직으로 유지한다.

무공 초식 카드용 죽간 배경 2종을 추가했다: `/ui/scroll/scroll-bamboo-card.webp`와 잠김 상태의 `scroll-bamboo-card-locked.webp`. 각각 `.gong-card`, `.gong-card-locked`에 9-slice로 적용하며 좌우 72px과 위아래 40px을 고정한다. 무공 이름·레벨·효과·비용·잠김 조건과 버튼 상태는 HTML/기존 로직으로 유지한다.

`scroll-silk-picker`를 `.board-picker-btn`의 가로 3-slice 바탕으로 추가했다. 파일은 `/ui/scroll/scroll-silk-picker.webp`이며 좌우 80px은 고정하고 중앙 비단만 늘린다. 현재 보드 이름·선택 상태·드롭다운 동작과 접근성 이름은 유지한다.

초식 단계 표식 3종을 추가했다: `tag-tier-primary`(1차), `tag-tier-secondary`(2차), `tag-tier-capstone`(오의). 파일은 `/ui/label/`에 있으며 각각 36×20px으로 초식 카드의 단계 표시에 쓴다. 초식 이름·레벨·효과 등 동적 텍스트는 대체하지 않는다.

`frame-banner-silk`을 추가했다. `/ui/frame/frame-banner-silk.webp`를 `.banner`, `.banner-done`의 가로 3-slice 바탕으로 쓰며 양끝 72px은 고정하고 중앙 비단만 늘린다. 배너의 동적 안내 문구와 완료 상태는 기존 HTML/CSS로 유지한다.

P1 고정 문구 라벨 48종을 `/ui/label/`에 추가했다. 버튼용 `label-*`, 팝업 현판용 `title-*`, 구역 제목용 `section-*`을 원본 비율로 배치한다. 라벨은 고정 문구만 대체하며 비용·수치·이름·상태 등 동적 텍스트와 모든 이벤트·접근성 처리는 기존 구현에 남긴다.

`panel-armory`를 추가했다. `/ui/panel/panel-armory.webp`를 장비 화면의 페이퍼돌 배경으로 표시하되, 중앙 빈 공간에 기존 캐릭터·장비 슬롯·수치를 계속 HTML/캔버스 레이어로 얹는다. 슬롯 선택·장착·비교 로직은 변경하지 않는다.

`panel-gacha-card-back`을 추가했다. `/ui/panel/panel-gacha-card-back.webp`를 기연 결과가 공개되기 전 카드 뒷면으로 사용한다. 카드 공개 순서·결과 등급·카드 클릭과 애니메이션 로직은 변경하지 않는다.

장비 슬롯 프레임 `frame-slot`과 등급별 프레임 6종(`frame-grade-하품`~`frame-grade-선품`)을 추가했다. 모두 `/ui/frame/`에서 80×36px 9-slice로 적용한다. 등급명·장비 이름·수치·선택/장착 상태는 기존 HTML과 로직으로 유지한다.

문파 기여도 게이지용 `frame-gauge-sect`, `fill-sect`를 `/ui/gauge/`에 추가했다. 틀은 가로 3-slice(좌우 16px), 채움은 반복 배경이다. 기여도 수치·최대치·채움 폭 계산은 기존 구현으로 유지한다.

`panel-stage-map`을 `/ui/panel/panel-stage-map.webp`에 추가했다. StagePicker의 대스테이지 행에 9-slice로 적용하며, 스테이지 번호·지명·보스 이름·해금 조건은 기존 HTML로 중앙 빈 영역에 표시한다.

`panel-tower-gate`를 `/ui/panel/panel-tower-gate.webp`에 추가했다. 사냥터 팝업의 수련탑 진입 행 배경으로 사용하고, 중앙 빈 영역에 기존 수련탑 이름·층·해금 문구와 버튼을 표시한다.

`panel-offline-night`를 `/ui/panel/panel-offline-night.webp`에 추가했다. 오프라인 보상 팝업 머리 그림으로 사용하되, 경과 시간·처치·보상·레벨 수치와 확인 버튼은 기존 HTML·로직을 유지한다.

## P0 후속 적용 지시

아래 P0 에셋도 이미 검수되어 `assets/ui/`에 있다. 새 에셋을 생성하거나 `manifest.json`을 고치지 말고, 파일이 실제로 존재하는 항목만 적용한다. 이미지가 실패했을 때 현재 CSS 색·테두리·텍스트가 남도록 `background`·`border` 폴백 뒤에 이미지 선언을 둔다. 동적 수치·이름·상태, 클릭 처리와 `aria-label`은 HTML에 남긴다.

| 범위 | 에셋과 적용 대상 | 규칙 |
| --- | --- | --- |
| 버튼 바탕 | `btn-primary-tile` → `.btn-primary`, `btn-secondary-brick` → `.btn`·`.btn-ghost`, `btn-travel-jade` → 이동·연결 버튼, `btn-danger-brick` → 위험 버튼, `btn-segment(-active)` → `.segmented-btn`, `btn-round` → 설정·닫기·뒤로 아이콘 버튼 | 모두 가로 3-slice다. 버튼의 활성·비활성·누름 상태, 클릭 영역과 키보드 초점은 기존 CSS·HTML로 유지한다. |
| 공통 프레임 | `frame-summary-strip` → `.battle-summary`, `frame-portrait` → `.header-portrait`, `frame-row-slip` → `.setting-row`·수련 목표 행·수련탑 진입 행 | 요약 띠는 좌우 64px, 목간 행은 9-slice 32px이다. 초상 틀은 40px 고정이며 이미 있는 초상 이미지 위에만 겹친다. |
| 전투 게이지 | `frame-gauge-enemy`·`frame-gauge-boss`·`frame-gauge-player`·`frame-gauge-exp` 및 대응 `fill-*`, `overlay-gauge-gloss` → `.hp-bar-enemy`, `.hp-bar-boss`, `.hp-bar-player`, `.exp-bar` | 각 원본 slice를 그대로 쓰고 채움·잔상·광택·수치의 기존 레이어 순서를 유지한다. 광택은 `pointer-events: none`이며, 체력 계산과 위험 상태는 바꾸지 않는다. |
| 무공 | `scroll-bamboo-card(-locked)` → `.gong-card(-locked)`, `scroll-silk-picker` → `.board-picker-btn`, `tag-tier-*` → 초식 단계 표식 | 죽간은 좌우 72px·위아래 40px, 비단은 좌우 80px 3-slice다. 초식 이름·레벨·효과·비용·해금 조건은 텍스트로 유지한다. |
| 하단 탭 | `tab-gong/gear/sect/shop`과 각 `-active` → `#tab-bar`의 해당 탭 | 현재 선택 탭만 `-active` 파일을 쓴다. 잠김 표식과 새 알림 점은 별도 CSS 레이어, 탭 이름의 접근성 이름·선택 로직은 기존 HTML에 남긴다. |
| P0 라벨·제목 | `label-*` → 해당 버튼의 고정 문구, `title-*` → `.sheet-header`, `section-goal-*` → `GoalsView` 구역 제목 | `label-train*`·`label-climb`·`label-boss-challenge`은 전투/무공, `label-claim`·`label-claimed`·`label-goal-progress`는 목표, `label-sfx-*`은 설정에 쓴다. 수치·횟수·비용·상태는 절대 이미지로 대체하지 않는다. |
| P0 아이콘 | 재화 `icon-gold`·`icon-chi`·`icon-elixir`·`icon-contribution`·`icon-stones`, 기능 `icon-settings`·`icon-close`·`icon-back`·`icon-lock`·`icon-dropdown`·`icon-badge`, 전투·능력치·행동 P0 아이콘 | 재화·능력치·상태·행동 보조는 20px, 설정·닫기·뒤로·잠금은 24px, 드롭다운은 16px, 배지는 12px이다. `icon-gold` 등 비용 아이콘은 수치 앞에만 두며 이름·수치·`aria-label`을 유지한다. |

### 버튼 표면 교체 (2026-09-20)

`btn-primary-tile`, `btn-secondary-brick`, `btn-travel-jade`, `btn-danger-brick`, `btn-segment`, `btn-segment-active`, `btn-round`은 기왓장·벽돌·말림 장식형에서 **텍스트 우선의 일반 버튼 표면**으로 다시 제작했다. 파일명·원본 크기·3-slice 값은 기존 매니페스트와 같으므로 CSS 셀렉터·`border-image` 선언은 바꾸지 않는다. 주요 버튼은 연한 금빛, 보조 버튼은 숯색, 이동 버튼은 옥색, 위험 버튼은 짙은 적색, 선택 소탭은 남색으로 구분한다. 모든 바탕의 중앙은 비워 두었으므로 버튼 라벨과 비용·보조 문구는 HTML 텍스트로 겹쳐 표시한다.

P0 적용 뒤에는 320px·390px·430px에서 전투·무공·설정·재화 팝업을 열어 9-slice 모서리, 탭 선택 상태, 게이지 수치와 고정 라벨이 겹치지 않는지 확인한다.

## P1 후속 적용 지시

아래 파일은 이미 검수되어 `assets/ui/`에 있다. 새 에셋을 생성하거나 `manifest.json`을 고치지 말고, 파일이 실제로 존재하는 항목만 적용한다. 우선 기존 클래스에 CSS로 연결하고, 아이콘·라벨을 넣을 종류별 클래스가 없을 때만 해당 컴포넌트 TSX에 의미 있는 클래스를 추가한다. 동적 텍스트·수치·상태와 모든 이벤트·`aria-label`은 HTML에 남긴다.

| 범위 | 에셋과 적용 대상 | 규칙 |
| --- | --- | --- |
| 스토리·온보딩 | `scroll-parchment-dialog` → `.story-intro`, `.story-cutscene-box`, `.onboarding-box` | 9-slice: 위아래 64px, 좌우 40px 원본 slice. 본문 여백을 늘려 말린 가장자리와 겹치지 않게 한다. |
| 토스트 | `frame-toast-note` → `Toast`의 최상위 컨테이너 | 9-slice: 네 변 32px 원본 slice. 알림 문구·종류·닫기 동작은 HTML·기존 로직으로 유지한다. |
| 장비 | `icon-slot-*` → `.gear-doll-slot`의 슬롯 종류별 보조 표식, `icon-sort`·`icon-filter` → 장비 정렬·필터 제어, `icon-stat-atk`·`icon-stat-def`·`icon-stat-status-resist` → 장비 능력치 줄, `icon-action-equip`·`icon-action-unequip`·`icon-action-disassemble`·`icon-action-enhance` → 장착·해제·최적 장착·분해·강화 버튼 | 슬롯 이름·등급·강화 수치는 텍스트로 유지한다. 슬롯 아이콘은 32px, 나머지는 20px이다. |
| 등급 프레임 | `frame-grade-하품/중품/상품/진품/극품/선품` → 소지품의 `.grade-chip`과 장착 슬롯 | 화면 등급명은 `하품/중품/상품/절품/신품/선품`이다. `절품`에는 보라색 `frame-grade-진품`, `신품`에는 주황색 `frame-grade-극품`을 쓴다. 모두 9-slice 24px, `border-image-width: 12px`다. |
| 문파·상점·기연 | `sign-sect-qingyun`, `sign-shop-elixir`, `sign-tower`, `icon-gacha`, `icon-action-donate`, `icon-action-exchange`, `panel-gacha-card-back`, `label-donate-*`, `label-sect-board`, `label-shop-exchange`, `label-gacha-*`, `title-gacha-rates`, `section-gacha-result` | 간판은 해당 카드·행의 고정 머리로만 쓰고, 비용·확률·결과 등급은 텍스트로 남긴다. `icon-gacha`는 대표 48px이며 버튼 안에서는 20px으로 축소할 수 있다. `icon-action-donate`는 전량 기부 버튼, `icon-action-exchange`는 영약 교환 버튼의 20px 보조 표식이다. |
| 환골탈태·저장 | `icon-rebirth`, `icon-reset`, `icon-backup`, `icon-warn`, `icon-check`, `label-rebirth-*`, `title-rebirth-*`, `section-rebirth`·`section-kept`·`section-reset`, `label-backup-*`, `section-save-backup` | `icon-rebirth`은 대표 문양 48px, 나머지는 20px이다. 초기화·경고·유지 항목의 이름과 조건 문구를 이미지로 대체하지 않는다. |
| 전투 경험치 | `icon-exp` → 경험치 게이지의 수치·퍼센트 앞 | 16px 보조 표식이다. 경험치 수치·채움 폭·성장 로직은 기존 구현으로 유지한다. |
| 능력치 증감 | `icon-diff-up`·`icon-diff-down` → 무공·장비 능력치의 다음 효과·비교 수치 앞 | 각각 16px 보조 표식이다. 상승·하락 수치와 계산은 텍스트·기존 로직으로 유지한다. |
| 목표·사냥터·오프라인 | `icon-goal-daily`, `icon-goal-milestone`, `icon-hold`, `icon-stage-current`, `icon-offline`, `icon-info`, `icon-unlock` | 목표 구역 아이콘·길게 누르기 안내·현재 소스테이지·오프라인 보상·도움말·해금 토스트의 보조 표식으로 쓴다. `icon-stage-current`만 16px, 나머지는 20px이다. |
| 공통 | `icon-charm` | 보호부적 이름·개수 앞의 20px 보조 표식으로 쓴다. |

P1 적용 뒤에는 375×812 모바일에서 장비·기연·환골탈태·오프라인 팝업을 열어 아이콘과 텍스트가 겹치지 않는지 확인한다. `npm run lint && npm run build`를 통과한 변경만 커밋한다.

## 현재 미적용 에셋 (2026-09-20 확인)

아래 39종은 `src/**/*.css`, `src/**/*.tsx`에서 에셋 id 또는 파일명을 직접 참조하지 않아 아직 게임 화면에 연결되지 않은 것으로 확인했다. 파일과 `assets/ui/manifest.json`은 정상이며, **새 에셋을 만들지 말고** 아래 대상에 연결한다. 이미 적용된 에셋의 선언·동적 텍스트·상태 처리·접근성 이름은 건드리지 않는다.

| 범위 | 미적용 에셋 | 우선 적용 대상 | 적용 규칙 |
| --- | --- | --- | --- |
| P0 헤더·탭 | `frame-portrait`, `icon-badge` | `.header-portrait`, 새 알림이 있는 `#tab-bar` 탭의 배지 레이어 | 초상 프레임은 40px 고정으로 기존 초상 위에 겹친다. 배지는 12px 보조 표식이며 탭 이름·잠김·새 알림 상태 로직은 HTML/CSS에 남긴다. |
| P0 전투·무공 아이콘 | `icon-status-auto`, `icon-status-paused`, `icon-status-farm`, `icon-status-boss`, `icon-status-reward`, `icon-tower`, `icon-stat-hp`, `icon-stat-power`, `icon-action-train`, `icon-diff-up` | 전투 상태 칩·보스/보상 알림·수련탑 행, 플레이어 HP·전투력·무공 능력치·연마 버튼과 다음 효과 수치 앞 | 기본 20px, `icon-diff-up`은 16px이다. 상태 문구·보스 이름·수치·타이머·연마 비용은 텍스트로 유지한다. |
| P0 설정·무공 라벨 | `label-sfx-on`, `label-sfx-off`, `tag-tier-primary`, `tag-tier-secondary`, `tag-tier-capstone` | `SettingsSheet` 효과음 버튼, `.gong-card`의 단계 표식 | 라벨은 고정 문구만 대체한다. 단계 표식은 36×20px이며 초식 이름·레벨·해금 조건은 HTML 텍스트로 남긴다. |
| P0 잠김 팝업 제목 | `title-locked-gong`, `title-locked-gear`, `title-locked-sect`, `title-locked-shop` | `LockedTabSheet`의 탭 종류별 `.sheet-header` | 현재 잠긴 탭에 맞는 제목만 고른다. 해금 조건 문구와 닫기 동작은 기존 구현을 유지한다. |
| P1 장비·문파·상점 아이콘 | `icon-slot-weapon`, `icon-slot-body`, `icon-slot-head`, `icon-slot-arm`, `icon-slot-foot`, `icon-slot-waist`, `icon-slot-neck`, `icon-slot-ring`, `icon-action-enhance`, `icon-action-donate`, `icon-action-exchange`, `icon-diff-down` | `.gear-doll-slot`의 슬롯 종류별 표식, 장비 강화·문파 전량 기부·상점 영약 교환 버튼, 장비 비교의 하락 수치 앞 | 슬롯 아이콘은 32px, 나머지는 20px, `icon-diff-down`은 16px이다. 장비 이름·등급·강화·비용·비교 수치는 텍스트로 남긴다. |
| P1 해금·상점 라벨 | `icon-unlock`, `label-subtab-gacha` | 해금 `Toast`, `ShopPanel`의 기연 소탭 | `icon-unlock`은 20px 보조 표식이다. 소탭 라벨은 고정 문구만 대체하고 선택 상태·탭 전환·접근성 이름은 유지한다. |
| P1 환골탈태·기부 팝업 라벨 | `section-stats`, `section-kept`, `title-donate-chi`, `title-donate-elixir` | `MyInfoView` 주요 능력치 구역, `RebirthView` 유지 항목 구역, `SectPanel` 기부 확인 팝업의 `.sheet-header` | 구역 제목·팝업 제목만 이미지로 바꾸며, 수치·유지/초기화 목록·기부량·확인/취소 흐름은 HTML과 기존 로직으로 유지한다. |

적용 시 먼저 종류별 대상 클래스가 실제로 있는지 확인한다. 슬롯·상태·기부 종류처럼 CSS만으로 구분할 수 없는 경우에만 의미 있는 TSX 클래스를 추가한다. 한 항목을 적용할 때마다 375×812에서 텍스트 겹침·대비를 확인하고 `npm run lint && npm run build`를 통과시킨다.

| 에셋 | 파일 | 적용 위치 |
| --- | --- | --- |
| 본문 벽 질감 | `/assets/ui/theme/theme-app-wall.webp` | `#app` |
| 먹 매화 가지 | `/assets/ui/theme/theme-wall-ink-branch.webp` | `#app::before` 및 `#app::after` |
| 넓은 화면 바깥 수묵 산수 | `/assets/ui/theme/theme-outer-landscape.webp` | `@media (min-width: 30rem)`의 `body` |
| 먹 붓선 구분선 | `/assets/ui/theme/theme-divider-ink.webp` | `.section-title::after` |

## 구현 규칙

1. `:root`에 다음 폴백 토큰을 추가한다.

```css
--surface-wall: #efebe3;
--text-on-wall: #1f1d1b;
--wall-muted: #625d55;
--wall-line: #b7b1a5;
--backdrop: rgba(20, 19, 21, 0.62);
color-scheme: light;
```

2. `#app`은 벽 질감을 반복 배경으로 쓰되 `var(--surface-wall)`를 마지막 폴백으로 남긴다. 일반 스크롤 본문의 글자는 `var(--text-on-wall)`로 읽히게 한다. 전투 캔버스와 강조 카드의 어두운 영역은 유지한다.

3. 가지 장식은 콘텐츠보다 아래 레이어에 두고 `pointer-events: none`으로 둔다. 390px에서는 오른쪽 위, 320px에서는 폭 150~170px로 축소해 카드 첫 줄을 가리지 않게 한다. `#app::after`에는 같은 에셋을 좌우·상하 반전해 왼쪽 아래에 둔다. 앱의 실제 자식은 장식보다 위 레이어에 둔다.

4. 산수 배경 URL은 `min-width: 30rem` 미디어 쿼리 안에서만 참조한다. `background-attachment: fixed`는 쓰지 않는다.

5. 구분선은 높이 12px, 최대 폭 358px, 원본 비율을 유지한다. 이미지가 없을 때는 `border-bottom: 1px solid var(--wall-line)`이 보이게 한다.

6. 이번 작업에서는 기존의 직접 지정 색상 전체를 치환하지 않는다. 테마 레이어와 핵심 본문 토큰만 외과적으로 변경한다.

## 완료 기준

- 320px, 390px, 430px와 넓은 화면에서 일반 탭·전투·팝업의 본문 글자가 읽힌다.
- 가지가 버튼 터치·텍스트를 가리지 않는다.
- 이미지 차단 상태에서도 배경과 텍스트 대비가 유지된다.
- 모바일에서 외부 산수 배경을 요청하지 않는다.
- `npm run lint`와 `npm run build`가 통과한다.
- 변경한 파일과 검수 결과만 보고한다.
