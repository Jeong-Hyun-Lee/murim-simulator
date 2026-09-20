---
type: concept
tags: [UI, UI-Element, 비주얼디자인, 모바일, 에셋, 코덱스]
created: 2026-09-16
updated: 2026-09-20
sources: []
---

# UI Element 대체 기획서

CSS 색·테두리·그라데이션만으로 그린 현재 UI를 **게임 UI 이미지 요소(UI Element)**로 바꾸는 기획이다. 화면 구조·기능·상태 판정은 [[모바일-UX-개선-기획서]]의 현재 구현을 그대로 두고, 표면(패널·버튼·탭·팝업·아이콘·고정 문구)을 이미지로 교체하며, 앱 테마 배경과 색 토큰을 레퍼런스의 흰 회벽·먹색 기와 대비로 바꾼다(2.4, 4.4). [[모바일-디자인-에셋-제작-명세]]의 공통 UI·조작 아이콘·장비/무공/문파/상점 그림 항목을 실제 제작 단위로 구체화하며, UI 표면의 표현 규칙은 이 문서를 따른다. UI Element 이미지 생성은 코덱스가 6단계 프롬프트로 수행한다. [[장기-플레이-시스템]]의 수련 목표·수련탑·오프라인 보상·저장 백업 화면도 같은 규칙으로 포함한다.

## 1. 원칙

1. **동적 데이터는 텍스트, 고정 표시는 에셋.** 게임 상태에 따라 바뀌는 수치·이름·상태 문구는 HTML 텍스트로 쓰고, 항상 같은 탭 이름·버튼 문구·팝업 제목·단계 태그·기능 표식은 이미지에 포함한다(3장).
2. **기능 표식은 글자 대신 아이콘.** 닫기는 X 표식, 뒤로는 화살 표식, 설정은 원판 표식처럼 아이콘 버튼으로 바꾼다. 이미지 버튼에도 `aria-label`로 같은 뜻의 이름을 남긴다.
3. **레이아웃은 그대로.** React 컴포넌트 구조·클래스·스크롤·안전 영역·팝업 초점 처리는 유지하고, CSS의 배경·테두리를 이미지로 바꾼다. 이미지가 로드되지 않아도 현재 CSS 색으로 읽힐 수 있게 둔다.
4. **글자는 생성 모델에 맡기지 않는다.** 이미지 생성 모델은 한글·한자 글자를 틀리게 그리기 쉽다. 생성 단계에서는 글자 없는 바탕·질감·아이콘만 만들고, 고정 문구는 폰트 합성 스크립트로 이미지에 넣는다(7장).
5. **캐릭터·배경보다 튀지 않는다.** UI 장식은 테두리·모서리·질감에 두고, 전투 무대와 SD 페인터리 캐릭터가 화면의 주인공이 되게 한다.
6. **테마 배경이 가장 먼저.** UI Element를 게임에 적용할 때는 4.4의 테마 배경·색 토큰을 **최우선으로 수정**한다. 프레임·버튼·아이콘·게이지의 대비와 색 검수는 모두 바뀐 흰 회벽/흑칠 테마 위에서 한다.
7. **아이콘으로 읽는 속도를 높인다.** 기능 버튼뿐 아니라 상태 문구·능력치·비용·정렬 같은 곳에도 의미가 분명한 아이콘을 붙인다(5.4, 6.1). 아이콘은 글자를 돕는 표식이며 동적 수치를 대신하지 않는다.

## 2. 비주얼 방향

### 2.1 레퍼런스 해석

| 레퍼런스 | 관찰한 요소 | UI에 가져올 것 |
| --- | --- | --- |
| 궁궐 실내(원형 월동문·현판·격자창) | 흰 회벽에 먹으로 그린 나뭇가지 벽화, 둥근 월동문, 남색 바탕에 금색 글자와 금테를 두른 현판, 목재 격자창, 붉은 옻칠 기둥, 청화 문양 카펫, 청동·금 장식 | 앱 본문의 흰 회벽 바탕과 먹 가지 장식, 팝업 제목의 현판, 탭 선택 상태, 격자창 모서리 문양. 붉은 옻칠은 작은 포인트로만 사용 |
| 산문 전경(회흑 기와 누각·단풍·안개 절벽) | 짙은 회흑색 기와 지붕과 치켜 올라간 처마, 밝은 돌 광장과 흰 안개의 흑백 대비, 주황·노랑 단풍 | 상단 신분줄의 검은 기와 처마 띠, 넓은 화면 바깥의 수묵 산수 배경, 보조 버튼의 전돌·벽돌 질감. 단풍 주황은 알림·보상 강조색으로 제한 사용 |
| 청기와 전각(녹청 기와·원형 연못·돌길) | 녹청 유약 기와, 붉은 기둥과 황금색 창살, 회색 돌 난간과 원형 석조 | 이동·연결 버튼의 청기와 질감, 하단 탭바의 돌 난간·목재 난간, 게이지의 청동 테두리 |

레퍼런스의 특정 건물·문양·구도를 복제하지 않는다. 사진 같은 실사 질감이 아니라 [[캐릭터-이미지-생성-지침]]의 **SD 페인터리 캐릭터와 어울리는 부드러운 반실사 일러스트 질감**으로 해석한다.

### 2.2 색

기존 CSS 토큰은 텍스트·대체 색으로 유지하고, 에셋은 아래 색 범위 안에서 만든다.

| 역할 | 색 | 쓰임 |
| --- | --- | --- |
| 흰 회벽 | `#efebe3` ~ `#f6f3ec` | 앱 본문 바탕 |
| 먹 | `#141416` ~ `#2a2a2d` | 흰 바탕 위 글자, 먹 붓선·실루엣 |
| 흑칠 목재 | `#1b1a1c` ~ `#2c2a2b` | 헤더·탭바·팝업 틀·강조 패널 테두리, 기둥 |
| 주칠(붉은 옻칠) | `#5a1f18` ~ `#7a2a1f` | 틀 안쪽 가는 선·기둥 포인트(소량) |
| 짙은 목재 | `#2a1d16` ~ `#3b2a1f` | 강조 패널 안쪽, 보조 버튼 테 |
| 금박 | `#c8962e` ~ `#f4d66e` (기존 `--gold`·`--gold-hi`) | 모서리 장식, 주요 버튼 테두리, 선택 상태 |
| 현판 남색 | `#1c2740` ~ `#2b3a5c` | 팝업 제목 현판, 선택된 소탭 |
| 회흑 기와 | `#34373c` ~ `#4a4e55` | 상단 처마 띠, 보조 버튼 벽돌 |
| 청기와 녹청 | `#35685c` ~ `#5ea98f` (기존 `--jade`) | 이동·연결 버튼 |
| 한지·비단 | `#eee4cb` ~ `#f6eedb` (기존 `--paper`) | 기본 카드·팝업 안쪽, 두루마리 |
| 붉은 벽돌 | `#8a3a2c` ~ `#a8483a` | 위험·되돌릴 수 없는 행동 버튼 |
| 단풍 주황 | `#d9782d` | 알림 점·새로 열림 표식(소량) |

장비 6등급 색은 `src/game/gradeData.ts`의 `GRADE_COLOR`(하품 `#9e9e9e`·중품 `#4caf50`·상품 `#2196f3`·절품 `#9c27b0`·신품 `#ff9800`·선품 `#ffd76a`)을 등급 프레임의 보석·테두리 색으로 그대로 쓴다. 금색은 주요 행동·선택 상태에만 쓰고 선품 등급색과 같은 뜻으로 섞지 않는다.

### 2.3 재질과 모티프 매핑

| 모티프 | UI 요소 |
| --- | --- |
| 흰 회벽 + 먹 나뭇가지 벽화(월동문 벽) | 앱 본문 바탕 |
| 흰 안개 + 먹색 산봉우리·기와 누각 실루엣(수묵 산수) | 넓은 화면의 앱 바깥 배경 |
| 먹 붓선 | 섹션 구분선 |
| 기와 처마(회흑 기와 + 치켜 올라간 끝) | 상단 신분줄 배경 |
| 흑칠 목재 난간 + 회흑 돌 바닥 | 하단 4탭 바 배경 |
| 현판(남색 바탕·금테·금색 글자) | 팝업 제목, 선택된 탭·소탭, 문파 이름판 |
| 흑칠 목재 틀 + 금 모서리 장식 + 격자 문양 | 팝업 테두리, 강조 패널 |
| 한지 바탕 + 얇은 흑칠 테두리 | 기본 카드 |
| 황금 유약 기와 | 주요 버튼(연마·장착·구매·확인) |
| 회흑 전돌·벽돌 | 보조 버튼(취소·선택·설정 토글) |
| 청기와 | 이동·연결 버튼(전투 보기·등반·문파 무공 보기) |
| 붉은 벽돌 | 위험 버튼(분해하기·환골탈태 실행) |
| 죽간 두루마리(대나무 조각을 끈으로 엮은 형태) | 무공 초식 카드 |
| 비단 두루마리(양끝 나무 축) | 무공 보드 선택기, 튜토리얼·완료 배너 |
| 한지·양피지 두루마리 | 스토리 컷신·온보딩 대화창 |
| 청동 원판 | 원형 아이콘 버튼(설정·닫기·뒤로) |
| 청동 테두리 게이지 | 체력·경험치·문파 게이지 |
| 붉은 낙관(인장) | 초식 단계 태그(1차·2차·오의) |
| 무기고 목재 벽 + 무기걸이 | 장비 페이퍼돌 배경 |
| 약방 목패 간판 | 일반상점 영약 교환소 |

### 2.4 명도 구조: 흰 벽과 먹 기와

레퍼런스의 공통 인상은 **흰 회벽·한지·안개와 먹색 기와·목재·산 실루엣의 흑백 대비**다. 지금의 먹갈색 단일 톤 대신 이 대비로 앱 전체 명도를 재구성한다. 위(기와 처마 신분줄)와 아래(난간 탭바)는 검은 띠, 그 사이 본문은 흰 회벽이고, 전투 무대는 어두운 밤 배경 그대로 흑칠 액자에 넣어 흰 벽에 걸린 그림처럼 보이게 한다. 금·청기와·주칠·단풍 색은 행동·선택·알림에만 쓴다.

| 영역 | 명도 | 바탕 에셋 | 글자 |
| --- | --- | --- | --- |
| 넓은 화면의 앱 바깥 | 흰 안개 + 먹 산수 | `theme-outer-landscape` | – |
| 상단 신분줄 | 검 | `frame-header-eave` | 크림 |
| 전투 요약줄 | 검 | `frame-summary-strip` | 크림 |
| 전투 무대 | 어두운 그림 | 전투 캔버스 배경 + `frame-battle-stage` | 캔버스 HUD |
| 무대 아래 전투 정보·본문 스크롤 | 흰 | `theme-app-wall` + `theme-wall-ink-branch` | 먹 |
| 기본 카드 | 흰(한지) | `frame-panel-hanji` | 먹 |
| 강조 카드(보스 카드·보드 선택 목록·장비 페이퍼돌) | 검 | `frame-panel-dark`, `panel-armory` | 크림 |
| 팝업 | 한지 안쪽 + 흑칠 틀 | `frame-popup` | 먹 |
| 팝업 뒤 가림막 | 먹 반투명 | CSS | – |
| 하단 탭바 | 검 | `frame-tabbar` | 탭 이미지 |

## 3. 고정 표시와 동적 표시의 구분

| 구분 | 예 | 처리 |
| --- | --- | --- |
| 동적 텍스트 | 재화 수치, 연마 비용, 레벨, 체력, 전투력, 경험치 %, 도호·경지, 보드 이름, 적·보스 이름, 장비 이름·강화 수치, 스테이지 번호·지명, 전투 상태(진행 중·반복 사냥 중), 해금 조건, 설명 문장, 확률표, 개수 `(3)` | HTML 텍스트를 에셋 위에 올린다 |
| 고정 에셋 | 탭 이름, 고정 버튼 문구, 고정 팝업·섹션 제목, 초식 단계 태그, 재화·기능·장비 슬롯 아이콘, 문파 이름판, 상점 간판 | 글자·아이콘을 포함한 이미지 |
| 고정 문구 + 동적 값 | `1회 연마` + `내공 53,573`, `영약 1개 교환` + `전 246,112`, `문파 무공 보기` + `(삼재검법 2보)`, `강화하기` 앞의 `+11`, `소지품` 뒤의 `(0)` | 고정 부분은 라벨 이미지, 동적 부분은 옆이나 아래 줄 텍스트 |
| 동적 횟수가 문구 안에 있음 | `{n}회 연마` | 라벨 이미지 `연마` + 텍스트 `{n}회` |
| 상태에 따라 두 문구 중 하나 | `전투 일시정지`/`전투 재개`, `효과음 켜기`/`효과음 끄기`, `전체 선택`/`전체 해제`, `다음`/`계속하기` | 두 라벨 이미지를 모두 만들고 상태로 교체 |
| 유한한 조합 | `{탭} 잠김`(4종), `{내공·영약} 전량 기부`(2종) | 모든 조합을 라벨 이미지로 만든다. 조합이 8종을 넘으면 고정 부분만 이미지로 만들고 나머지는 텍스트 |

- 글자가 박힌 이미지에는 `aria-label` 또는 화면 밖 텍스트(`sr-only`)로 같은 문구를 남긴다.
- 기기 글자 크기를 키워도 이미지 글자는 커지지 않는다. 고정 라벨은 화면 표시 높이 14px 이상으로 두고, 판단에 필요한 수치·조건은 반드시 HTML 텍스트로 둔다.

## 4. 구현 방식

### 4.1 에셋 형태

| 형태 | 설명 | CSS 적용 |
| --- | --- | --- |
| 9-slice 프레임 | 모서리 장식은 고정, 네 변은 늘리거나 반복, 가운데는 채움 | `border-image: url(...) <slice> fill / <폭> round` |
| 3-slice 가로 띠 | 좌우 끝 고정, 가운데 가로 반복·늘림 | `border-image`(위아래 slice 0) |
| 고정 크기 이미지 | 탭·라벨·간판·아이콘처럼 크기가 정해진 그림 | `background-image` 또는 `<img alt="">` |

- 9-slice 원본의 모서리에는 장식을 넣고, 변은 늘려도 왜곡이 보이지 않는 곧은 목재·벽돌 줄눈으로 만든다. 가운데는 글자 대비를 해치지 않게 무늬를 약하게 둔다.
- 버튼 바탕과 라벨을 분리한다. 같은 바탕을 폭이 다른 여러 버튼이 공유하고, 라벨 이미지를 가운데에 올린다.

### 4.2 해상도와 포맷

| 종류 | 원본 배율 | 이유 |
| --- | --- | --- |
| 프레임·질감·배경 | CSS 표시 크기의 2배 | 늘리거나 반복하므로 과한 해상도가 필요 없다 |
| 라벨(글자)·아이콘 | CSS 표시 크기의 3배 | 배율 3 기기에서도 글자 획이 흐리지 않게 한다 |

- 생성·합성 원본은 PNG(실제 알파)로 `output/ui-elements/source/`에 보관한다.
- 게임에는 `assets/ui/<그룹>/<id>.webp`로 넣는다. 글자·아이콘은 무손실 WebP, 질감·배경은 품질 90 손실 WebP를 쓴다. 빌드 대상(iOS 14 Safari·안드로이드 크롬 87 이상)은 WebP 알파를 지원한다.
- 9-slice 원본 크기는 slice 값이 원본 px로 딱 떨어지게 짝수로 맞춘다. CSS `border-width`는 `slice ÷ 원본 배율`이다.

### 4.3 상태 표현과 성능

- 누름 상태는 CSS(`filter: brightness(0.9)` + `translateY(1px)`), 비활성은 CSS(`filter: grayscale(0.7) brightness(0.75)`)로 처리해 파일 수를 줄인다. 선택 상태처럼 모양이 달라지는 경우만 전용 이미지를 만든다.
- 상단 신분줄·하단 탭·기본 버튼·패널 프레임·닫기 아이콘은 첫 화면에 쓰이므로 `<link rel="preload">`로 미리 불러온다.
- 목표 용량은 P0 전체 1MB 이하다. 넘으면 질감 원본 크기와 WebP 품질을 먼저 낮춘다.

### 4.4 테마 배경·색 토큰 CSS 대체 계획 (적용 1순위)

**적용 상태(2026-09-19):** 2~4단계 적용 완료. `:root`에 아래 토큰을 두고 기본 `--text`·`--muted`·`--warn`·`--up`·`--down`을 흰 벽 값으로, 흑칠 영역(`#app-header`, `#tab-bar`, `.battle-summary`, `.unit-status`, `.sticky-actions`, `.btn`, `.list-row`, `.segmented`, `.toolbar select`, `#gear-doll`)에서 on-ink 값으로 다시 정의했다. `#app`·`.full-view` 바탕은 `theme-app-wall`, `#app::before/::after`는 먹 가지 장식, 30rem 이상 `body`는 `theme-outer-landscape`, `.section-title::after`는 `theme-divider-ink`다. 1단계의 직접 쓴 색 전면 치환은 하지 않았다 — 흑칠 컴포넌트(신분줄·탭바·강조 카드 등) 안의 hex는 검은 바탕 전제로 그대로 읽히므로, 흰 벽 위에 직접 놓인 요소(전투 상태 칩·수련 목표 버튼·연마 안내·뒤로 띠)만 토큰으로 바꿨다. 남은 hex는 프레임 에셋 적용 때 해당 컴포넌트별로 걷어낸다.

적용 전 `src/style.css`는 `body` `#0c0b09`, `#app` 금빛 방사 그라데이션 + `--ink` `#15130f`의 먹갈색 테마였다. 색은 hex 341곳·rgba 123곳에 직접 쓰여 있고 `var(--…)` 토큰 사용은 약 100곳뿐이라, 토큰 값만 바꿔서는 테마가 바뀌지 않는다. **UI Element 적용 작업에서 이 절을 가장 먼저 수행**하고, 프레임·버튼·아이콘·게이지 적용은 이 절이 끝난 뒤 시작한다. 아래 순서로 대체한다.

1. **토큰 정리(화면 변화 없음).** 직접 쓴 색을 역할 토큰으로 치환한다. 값이 같으므로 적용 전후 스크린샷이 같아야 한다.

   | 새 토큰 | 역할 |
   | --- | --- |
   | `--surface-wall` | 앱 본문 바탕 |
   | `--surface-ink` / `--surface-ink-2` | 검은 영역 바탕 |
   | `--text-on-wall` / `--muted-on-wall` / `--line-on-wall` | 흰 바탕 위 글자·보조 글자·구분선 |
   | `--text-on-ink` / `--muted-on-ink` / `--line-on-ink` | 검은 바탕 위 글자·보조 글자·구분선 |
   | `--accent-gold` / `--accent-gold-deep` | 금색 면·테두리 / 흰 바탕 위 금색 글자 |
   | `--accent-jade` / `--accent-red` / `--accent-maple` | 이동·위험·알림 |
   | `--up-on-wall` / `--down-on-wall` / `--warn-on-wall` | 흰 바탕 위 증감·경고 |
   | `--backdrop` | 팝업 뒤 가림막 |

2. **영역별 글자 토큰.** 기본 `--text`·`--muted`·`--line`은 흰 바탕 값으로 두고, 검은 영역 컨테이너(`#app-header`, `#tab-bar`, `.battle-summary`, 강조 카드)에서만 `--text: var(--text-on-ink)`처럼 다시 정의한다. 자식 요소는 `var(--text)`를 그대로 써서 영역에 따라 글자색이 자동으로 바뀐다.

3. **토큰 값 교체.** 명암 대비는 각 바탕 기준으로 계산했다(WCAG 본문 기준 4.5:1 이상).

   | 토큰 | 현재 값 | 새 값 | 대비 |
   | --- | --- | --- | --- |
   | `--surface-wall` (`body`·`#app` 바탕) | `#0c0b09` / `#15130f` | `#efebe3` | – |
   | `--text-on-wall` | 현재 `--text` `#ece3cf` | `#1f1d1b` | 14.1 |
   | `--muted-on-wall` | 현재 `--muted` `#a89a7c` | `#5f594f` | 5.8 |
   | `--line-on-wall` | 현재 `--ink-line` `#3b342a` | `#cfc8ba` | 장식선 |
   | `--surface-ink` / `--surface-ink-2` | `#15130f` / `#221e18` | `#1c1b1d` / `#28262a` | – |
   | `--text-on-ink` | `#ece3cf` | `#efe8d8` | 14.1 |
   | `--muted-on-ink` | `#a89a7c` | `#b3aa98` | 7.5 |
   | `--line-on-ink` | `#3b342a` | `#3d3a3c` | 장식선 |
   | `--accent-gold` | `#c8962e` | 유지(면·테두리, 검은 바탕 위 글자) | 6.4 |
   | `--accent-gold-deep` | – | `#7a5818`(흰 바탕 위 금색 글자) | 5.5 |
   | `--up-on-wall` | `#3f8a3a`(흰 바탕 3.6으로 미달) | `#2f6e2b` | 5.2 |
   | `--down-on-wall` | `#b0463a` | `#9c3b30` | 5.7 |
   | `--warn-on-wall` | `#e0a15a` | `#9a5a1c` | 4.6 |
   | `--paper` 계열 | `#eee4cb` 등 | 유지(한지 카드·팝업 안쪽) | 먹 글자 14.5 |
   | `--backdrop` | 개별 rgba | `rgba(20, 19, 21, 0.62)` | – |

4. **배경 레이어.**
   - `#app`: `background: url(theme-app-wall.webp) repeat, var(--surface-wall)`로 흰 회벽 질감을 깐다. 금빛 방사 그라데이션은 제거한다.
   - 먹 가지 장식: `#app::before`에 `theme-wall-ink-branch`를 오른쪽 위·왼쪽 아래 모서리에만 놓는다(`pointer-events: none`, 불투명도 0.35~0.5, 본문 아래 레이어). 왼쪽 아래는 같은 이미지를 CSS로 좌우·상하 반전한다.
   - 넓은 화면: `@media (min-width: 30rem)`에서만 `body`에 `theme-outer-landscape`를 `center / cover`로 깐다. 조건에 맞지 않는 휴대폰은 이 이미지를 내려받지 않는다. `body`는 이미 스크롤하지 않으므로 `background-attachment: fixed`를 쓰지 않는다.
   - 기기 다크 모드와 무관하게 이 테마를 고정한다(`color-scheme: light`).
5. **대비 보호.** 흰 회벽 질감의 명도 편차는 ±4% 안으로 두고, 먹 가지 장식은 카드·목록 글자 뒤로 오지 않게 모서리에만 둔다. 카드 밖 본문 글자(전투 정보·도움말)는 흰 벽 위에서 `--text-on-wall`로 읽혀야 한다.
6. **검수.** 320/390/430px와 넓은 화면에서 모든 탭·팝업을 캡처해 대비와 영역별 글자색을 확인하고, 이미지를 불러오지 못한 상태에서도 토큰 색만으로 읽히는지 확인한다.

## 5. 에셋 목록

`id`가 파일 이름이다. 크기는 `CSS 표시 크기 → 원본 크기`이며, slice는 원본 px 기준이다.

### 5.1 공통 프레임·띠 (그룹 `frame`, 원본 2배)

| id | 모티프 | 형태 | 크기 | slice | 적용 | 우선 |
| --- | --- | --- | --- | --- | --- | --- |
| `frame-panel-dark` | 짙은 목재 안쪽 + 흑칠 테두리 + 주칠 안쪽 가는 선 + 금 모서리 | 9-slice | 96×96 → 192×192 | 48 | 강조 카드(보스 카드·보드 선택 목록), `.full-view` 머리 | P0 |
| `frame-panel-hanji` | 한지 안쪽 + 얇은 흑칠 테두리 | 9-slice | 96×96 → 192×192 | 40 | `.card` 기본 카드, 문파·상점 카드, `.sheet .card` | P0 |
| `frame-popup` | 흑칠 기둥 틀 + 위쪽 처마 곡선 + 금 격자 모서리, 안쪽 한지 | 9-slice | 192×192 → 384×384 | 위 96, 나머지 56 | `dialog.sheet .sheet-inner` | P0 |
| `frame-title-plaque` | 남색 현판 + 금테 (글자 없음) | 3-slice | 240×48 → 480×96 | 좌우 56 | `.sheet-header` 동적 제목 바탕 | P0 |
| `frame-header-eave` | 회흑 기와 처마 띠, 양끝 치켜 올라간 끝 | 3-slice | 390×56 → 780×112 | 좌우 120 | `#app-header` | P0 |
| `frame-tabbar` | 흑칠 목재 난간 + 회흑 돌 바닥 | 3-slice | 390×64 → 780×128 | 좌우 96 | `#tab-bar` | P0 |
| `frame-summary-strip` | 얇은 흑칠 목패 띠 | 3-slice | 390×44 → 780×88 | 좌우 64 | `.battle-summary` | P0 |
| `frame-battle-stage` | 흑칠 목재 액자 + 격자창 모서리 + 금 안쪽 선 | 9-slice | 128×128 → 256×256 | 40 | 전투 캔버스 둘레 | P0 |
| `frame-banner-silk` | 붉은 비단 띠 + 양끝 매듭 | 3-slice | 360×48 → 720×96 | 좌우 72 | `.banner`, `.banner-done` | P1 |
| `frame-toast-note` | 한지 쪽지 + 붓 자국 가장자리 | 9-slice | 96×64 → 192×128 | 32 | `Toast` | P1 |
| `frame-portrait` | 둥근 청동·금 테 초상 틀 | 고정 | 40×40 → 120×120 | – | `.header-portrait` | P0 |
| `frame-row-slip` | 가로로 긴 목간 쪽지 + 얇은 흑칠 테 + 좌우 끈 매듭 | 9-slice | 358×64 → 716×128 | 32 | `.setting-row`(설정 줄, 수련 목표 행, 수련탑 진입 행) | P0 |

### 5.2 버튼 바탕 (그룹 `button`, 원본 2배, 글자 없음)

| id | 역할 | 모티프 | 형태 | 크기 | slice | 적용 |
| --- | --- | --- | --- | --- | --- | --- |
| `btn-primary-tile` | 주요 행동 | 황금 유약 기와 + 금테 | 3-slice | 180×56 → 360×112 | 좌우 40 | `.btn-primary` |
| `btn-secondary-brick` | 보조 행동 | 회흑 전돌 벽돌 + 짙은 목재 테 | 3-slice | 180×56 → 360×112 | 좌우 40 | `.btn`, `.btn-ghost` |
| `btn-travel-jade` | 이동·연결 | 청기와 + 금 못 장식 | 3-slice | 180×56 → 360×112 | 좌우 40 | 전투 보기·등반·문파 무공 보기·환골탈태 보기 |
| `btn-danger-brick` | 위험 행동 | 붉은 벽돌 + 짙은 목재 테 | 3-slice | 180×56 → 360×112 | 좌우 40 | 분해하기·환골탈태 진행/실행 |
| `btn-segment` | 소탭 기본 | 짙은 목재 판 | 3-slice | 160×40 → 320×80 | 좌우 32 | `.segmented`, `.shop-tab` |
| `btn-segment-active` | 소탭 선택 | 남색 현판 + 금테 | 3-slice | 160×40 → 320×80 | 좌우 32 | 선택된 소탭 |
| `btn-round` | 원형 아이콘 버튼 | 청동 원판 | 고정 | 44×44 → 132×132 | – | 설정·닫기·뒤로 (원본 3배) |

### 5.3 하단 탭 (그룹 `tab`, 원본 3배, 아이콘+글자 포함)

| id | 내용 | 크기 |
| --- | --- | --- |
| `tab-gong`, `tab-gong-active` | 검 아이콘 + `무공` | 97×64 → 292×192 |
| `tab-gear`, `tab-gear-active` | 갑주 아이콘 + `장비` | 97×64 → 292×192 |
| `tab-sect`, `tab-sect-active` | 문파 전각 아이콘 + `문파` | 97×64 → 292×192 |
| `tab-shop`, `tab-shop-active` | 약방 목패 아이콘 + `상점` | 97×64 → 292×192 |

기본 상태는 짙은 목재 위의 흐린 청동색 아이콘·글자, 선택 상태는 남색 현판 조각 위의 금색 아이콘·글자다. 잠김 표식(`icon-lock`)과 새로 열림 점(`icon-badge`)은 탭 위에 CSS로 겹친다. 모두 P0이다.

### 5.4 아이콘 (그룹 `icon`, 원본 3배, 글자 없음)

#### 아이콘 규칙

- **스타일.** 짙은 갈색 먹 윤곽(`#2a1d16`) + 청동·금 기본 채움 + 의미 색 한 가지(체력 붉은색, 내공 청백색 등). 흰 회벽과 흑칠 바탕 양쪽에서 읽혀야 하므로 윤곽선을 생략하지 않는다. 정면 시점, 왼쪽 위 광원, 모든 아이콘이 같은 윤곽 두께를 쓴다.
- **크기 등급.** 16px(문장 안 보조 표식), 20px(재화·능력치·상태), 24px(기능 버튼·탭), 32px(장비 슬롯), 48px(대표 문양). 원본은 표의 크기 × 3배로 만들고, 16px 아이콘은 세부 장식을 줄인 단순 실루엣으로 만든다.
- **글자와의 관계.** 닫기·뒤로·설정·정보·펼침만 아이콘 단독 버튼으로 두고 `aria-label`을 붙인다. 그 밖의 아이콘은 이름·수치 앞에 붙는 보조 표식이다. 예외로 비용 표시(`내공 53,573`)에서는 상단 재화 칩·재화 팝업에서 이름과 함께 익힌 재화 아이콘이 이름을 대신할 수 있고, 이때 `aria-label`에 재화 이름을 남긴다.
- **색만으로 뜻을 전하지 않는다.** 상승·하락, 보스·일반, 잠김·열림은 모양 자체가 달라야 한다.
- **버튼 안 아이콘.** 라벨 이미지 왼쪽에 버튼당 하나만 붙인다(20px, 라벨과 간격 4px).
- **상태.** 비활성은 CSS 필터로 처리하고, 선택된 탭만 5.3의 전용 탭 이미지를 쓴다.

#### 탐색·기능

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-tab-gong` | 비스듬히 선 직검과 검 끈 | 24 | 하단 탭 무공(5.3 탭 이미지에 합성) | P0 |
| `icon-tab-gear` | 가죽 비늘 갑주 | 24 | 하단 탭 장비 | P0 |
| `icon-tab-sect` | 기와 지붕 산문 전각 | 24 | 하단 탭 문파 | P0 |
| `icon-tab-shop` | 약방 목패와 약병 | 24 | 하단 탭 상점 | P0 |
| `icon-settings` | 팔괘 나침판 원판 | 24 | 상단 설정 버튼 | P0 |
| `icon-close` | 붓으로 그은 X 두 획 | 24 | 팝업 닫기, 뽑기 결과 닫기 | P0 |
| `icon-back` | 왼쪽을 향한 화살촉 | 24 | 전체 화면 뒤로 | P0 |
| `icon-lock` | 청동 자물통 | 24 | 잠긴 탭·초식·보드·사냥터, 해금 조건 | P0 |
| `icon-unlock` | 고리가 열린 청동 자물통 | 20 | 해금 알림 | P1 |
| `icon-dropdown` | 아래로 늘어진 매듭 끈 | 16 | 사냥터 선택, 보드 선택기, 정렬·필터 선택 | P0 |
| `icon-badge` | 작은 홍등(단풍 주황) | 12 | 새로 열림 | P0 |
| `icon-info` | 반쯤 펼친 작은 두루마리 | 20 | 확률 정보, 도움말 | P1 |
| `icon-check` | 붉은 인주 붓 체크 | 20 | 클리어한 소스테이지, 선택됨, 유지되는 항목 | P1 |
| `icon-sort` | 위아래로 엇갈린 화살촉 두 개 | 20 | 장비 정렬 | P1 |
| `icon-filter` | 대나무 체 | 20 | 장비 슬롯 필터 | P1 |
| `icon-hold` | 누르고 있는 손끝과 겹친 물결 세 줄 | 20 | 길게 눌러 연속 연마 안내 | P1 |
| `icon-sfx-on` | 울리는 청동 종과 울림선 | 24 | 설정 효과음 켜짐 | P0 |
| `icon-sfx-off` | 청동 종과 사선 | 24 | 설정 효과음 꺼짐 | P0 |
| `icon-goal` | 붓으로 점을 찍은 과녁 목패 | 24 | 전투 상태 줄 수련 목표 버튼 | P0 |
| `icon-goal-daily` | 떠오르는 해와 붓 획 한 줄 | 20 | 일일 수련 구역 | P1 |
| `icon-goal-milestone` | 길가의 돌 이정표 | 20 | 누적 수련 구역 | P1 |
| `icon-backup` | 자물통이 달린 죽간 보관함 | 20 | 설정 저장 백업 | P1 |

#### 재화·재료

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-gold` | 네모 구멍 엽전 | 20 | 전(錢): 상단 칩, 비용, 보유량 | P0 |
| `icon-chi` | 청백색 기운이 도는 단전 불꽃 | 20 | 내공 | P0 |
| `icon-elixir` | 붉은 마개 도자기 약병 | 20 | 영약 | P0 |
| `icon-contribution` | 청운문 옥패 | 20 | 기여도 | P0 |
| `icon-stones` | 푸른 광석 조각 | 20 | 강화석 | P0 |
| `icon-charm` | 노란 부적(붓 획 문양, 읽을 수 있는 글자 없음) | 20 | 보호부적 | P1 |

#### 능력치

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-stat-power` | 검과 방패가 겹친 문양 | 20 | 무공 효과 `공격·방어·체력` | P0 |
| `icon-stat-crit-chance` | 과녁 중심을 찌르는 칼끝 | 20 | 치명타 확률 | P0 |
| `icon-stat-crit-damage` | 갈라진 섬광이 튀는 칼날 | 20 | 치명타 피해 | P0 |
| `icon-stat-attack-speed` | 바람결 세 줄을 가르는 검 | 20 | 공격속도 | P0 |
| `icon-stat-evasion` | 흐릿한 잔상이 남는 발자국 | 20 | 회피율 | P0 |
| `icon-stat-chi-gain` | 단전 불꽃과 위로 오르는 기운 | 20 | 내공 획득량 | P0 |
| `icon-stat-hp` | 붉은 혈 구슬 | 20 | 내 체력바 앞, 장비 체력 | P0 |
| `icon-stat-atk` | 칼날 하나 | 20 | 장비 공격력 | P1 |
| `icon-stat-def` | 비늘 방패 | 20 | 장비 방어력 | P1 |
| `icon-stat-status-resist` | 부적이 붙은 방패 | 20 | 상태이상 저항 | P1 |

#### 전투·진행 상태

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-status-auto` | 엇갈린 두 검 | 20 | `자동 전투 중` | P0 |
| `icon-status-paused` | 세로 먹 붓 두 획 | 20 | `일시정지`, 전투 제어 설정 | P0 |
| `icon-status-farm` | 원을 그리며 도는 화살 | 20 | `반복 사냥 중` | P0 |
| `icon-status-boss` | 붉은 귀면 탈 | 20 | `보스 도전 대기`, 보스 이름, 사냥터 보스 표식 | P0 |
| `icon-status-reward` | 매듭 묶은 비단 보따리 | 20 | `보상 확인 대기`, 보상 알림 | P0 |
| `icon-climb` | 산봉우리 위로 오르는 화살 | 20 | 등반 버튼, 등반 위치 | P0 |
| `icon-combat-power` | 금테 원 안의 엇갈린 검 | 20 | 전투력 | P0 |
| `icon-exp` | 옥 구슬 | 16 | 경험치 게이지 앞 | P1 |
| `icon-stage-current` | 작은 붉은 깃발 | 16 | 사냥터 선택의 현재 위치 | P1 |
| `icon-tower` | 층층이 올라가는 기와 누각 탑 | 24 | 수련탑 상태 칩·진입 행·누적 목표 | P0 |
| `icon-hourglass` | 청동 테 모래시계 | 20 | 수련탑 남은 공방, 오프라인 경과 시간 | P0 |
| `icon-offline` | 초승달과 감긴 두루마리 | 20 | 자리를 비운 동안 팝업 | P1 |

#### 행동 보조

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-action-train` | 먹 붓과 단전 불꽃 | 20 | 연마 버튼 | P0 |
| `icon-action-equip` | 갑주와 아래로 향한 화살촉 | 20 | 장착·최적 장착 | P1 |
| `icon-action-unequip` | 갑주와 위로 향한 화살촉 | 20 | 해제 | P1 |
| `icon-action-disassemble` | 대장간 망치 | 20 | 분해 선택·분해하기 | P1 |
| `icon-action-enhance` | 모루 위 불꽃 | 20 | 강화하기 | P1 |
| `icon-action-donate` | 시주함 | 20 | 전량 기부 | P1 |
| `icon-action-exchange` | 엽전과 약병 사이 교환 화살 | 20 | 영약 교환 | P1 |
| `icon-gacha` | 붉은 실로 묶인 점괘 죽통 | 48 | 기연 대표 문양, 뽑기 버튼(20px로 축소) | P1 |
| `icon-rebirth` | 불사조 깃 원형 문양 | 48 | 환골탈태 대표 문양, 환골탈태 버튼(20px로 축소) | P1 |
| `icon-reset` | 거꾸로 감기는 두루마리 화살 | 20 | 초기화되는 항목 | P1 |

#### 장비 슬롯

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-slot-weapon` | 직검 | 32 | 무기 | P1 |
| `icon-slot-body` | 가죽 갑주 | 32 | 몸통 | P1 |
| `icon-slot-head` | 두건 | 32 | 머리 | P1 |
| `icon-slot-arm` | 완갑 | 32 | 팔 | P1 |
| `icon-slot-foot` | 경신화 | 32 | 발 | P1 |
| `icon-slot-waist` | 요대 | 32 | 허리 | P1 |
| `icon-slot-neck` | 옥 목걸이 | 32 | 목 | P1 |
| `icon-slot-ring` | 지환(반지), L/R 공용 | 32 | 손가락 L·R | P1 |

장비 슬롯 아이콘 8종은 같은 청동색 단일 톤 실루엣에 금색 포인트만 두고 등급색을 넣지 않는다.

#### 증감·알림

| id | 모티프 | 크기 | 쓰임 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-diff-up` | 위로 향한 초록 옥 화살촉 | 16 | 능력치 상승, 무공 `다음` 효과 | P0 |
| `icon-diff-down` | 아래로 향한 붉은 화살촉 | 16 | 능력치 하락 | P1 |
| `icon-warn` | 붉은 매듭이 달린 경고 목패 | 20 | 재화 부족, 조건 미충족 | P1 |

무공 보드 7종의 식별 표식은 보드 기획이 바뀔 수 있어 이 목록에서 제외하고, [[모바일-디자인-에셋-제작-명세]]의 무공 항목에서 별도로 산정한다.

### 5.5 특수 배경·간판 (원본 2배)

| id | 그룹 | 모티프 | 형태 | 크기 | slice | 적용 | 우선 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scroll-bamboo-card` | `scroll` | 죽간 두루마리: 세로 대나무 조각을 위아래 끈으로 엮고 좌우 끝에 말린 죽간 | 9-slice | 358×180 → 716×360 | 좌우 72, 위아래 40 | `.gong-card` | P0 |
| `scroll-bamboo-card-locked` | `scroll` | 같은 죽간이 빛바래고 끈이 풀린 상태 | 9-slice | 358×180 → 716×360 | 동일 | `.gong-card-locked` | P0 |
| `scroll-silk-picker` | `scroll` | 비단 두루마리 가로 펼침 + 양끝 목재 축 | 3-slice | 358×64 → 716×128 | 좌우 80 | `.board-picker-btn` | P0 |
| `scroll-parchment-dialog` | `scroll` | 한지 두루마리 대화창, 위아래 말린 가장자리 | 9-slice | 256×160 → 512×320 | 위아래 64, 좌우 40 | `StoryCutscene`, `OnboardingFlow`, `.story-intro` | P1 |
| `panel-armory` | `panel` | 무기고 목재 벽 + 무기걸이 + 격자창 | 고정 | 358×200 → 716×400 | – | 장비 페이퍼돌 영역 | P1 |
| `frame-slot` | `frame` | 청동 테 장비 슬롯 | 9-slice | 80×36 → 160×72 | 24 | 장비 슬롯 버튼 | P1 |
| `frame-grade-하품`·`중품`·`상품`·`진품`·`극품`·`선품` (6종) | `frame` | 슬롯 테두리에 등급색 보석 1개 + 등급색 안쪽 선 | 9-slice | 80×36 → 160×72 | 24 | 등급별 슬롯·소지품 카드 | P1 |
| `panel-gacha-card-back` | `panel` | 금박 운문 카드 뒷면 | 고정 | 72×96 → 144×192 | – | 기연 결과 공개 전 | P1 |
| `panel-stage-map` | `panel` | 지도 두루마리 조각 | 9-slice | 358×56 → 716×112 | 48 | 사냥터 선택 대스테이지 행 | P1 |
| `panel-tower-gate` | `panel` | 안개 속 층층 누각 탑 실루엣, 아래쪽은 글자를 올릴 수 있게 비워 둠 | 고정 | 358×96 → 716×192 | – | 사냥터 팝업 수련탑 진입 행 바탕 | P1 |
| `panel-offline-night` | `panel` | 달밤 누각과 등불, 가운데는 비워 둠 | 고정 | 358×112 → 716×224 | – | 자리를 비운 동안 팝업 머리 | P1 |

### 5.6 테마 배경 (그룹 `theme`, 원본 2배)

| id | 모티프 | 형태 | 크기 | 적용 | 우선 |
| --- | --- | --- | --- | --- | --- |
| `theme-app-wall` | 흰 회벽과 한지가 섞인 미세 질감, 명도 편차 ±4%, 이음매 없는 반복 | 반복 타일 | 256×256 → 512×512 | `#app` 바탕 | P0 |
| `theme-wall-ink-branch` | 흰 벽에 먹으로 그린 매화 가지 실루엣(월동문 벽화 모티프), 투명 배경 | 고정 | 240×320 → 480×640 | `#app::before` 오른쪽 위·왼쪽 아래 | P0 |
| `theme-outer-landscape` | 흰 안개 속 먹색 산봉우리와 기와 누각 실루엣의 수묵 산수, 가운데 세로 띠는 비워 둠 | 고정 cover | 원본 1920×1200 (손실 WebP 품질 80) | 30rem 초과 화면의 `body` | P1 |
| `theme-divider-ink` | 먹 붓선 한 획, 양끝이 가늘어짐 | 3-slice | 358×12 → 716×24 (slice 좌우 64) | `.section-title` 아래, 목록 구분 | P1 |

`theme-outer-landscape`는 휴대폰에서 내려받지 않으므로 P0 용량 목표에서 제외한다.

### 5.7 고정 문구 라벨 (그룹 `label`, 원본 3배, 폰트 합성)

라벨은 투명 배경에 글자만 있는 이미지이며 버튼 바탕·현판 위에 올린다. 글자 색은 바탕에 맞춰 두 가지다.

- `ink`: 먹색 `#1b1409` 글자 + 밝은 금색 윤곽 — 황금 기와(`btn-primary-tile`), 흰 회벽, 한지 카드·팝업 안쪽 위
- `cream`: 크림색 `#f3e6c4` 글자 + 짙은 갈색 윤곽 — 벽돌·청기와·현판·강조 패널 위

버튼 라벨의 CSS 글자 높이는 16px(원본 48px), 제목은 20px(원본 60px)이다. 이미지 폭은 글자 폭 + 좌우 여백으로 자른다.

| id | 문구 | 색 | 바탕 | 사용처 | 우선 |
| --- | --- | --- | --- | --- | --- |
| `label-train-once` | 1회 연마 | ink | primary | `GongPanel` | P0 |
| `label-train` | 연마 | cream | secondary | `GongPanel` (`{n}회` 텍스트와 함께) | P0 |
| `label-confirm` | 확인 | ink | primary | 튜토리얼 완료·온보딩 | P0 |
| `label-cancel` | 취소 | cream | secondary | 장비·문파·환골탈태 확인 | P0 |
| `label-pause` | 전투 일시정지 | ink | primary | `SettingsSheet` | P0 |
| `label-resume` | 전투 재개 | ink | primary | `SettingsSheet` | P0 |
| `label-sfx-on` | 효과음 켜기 | cream | secondary | `SettingsSheet` | P0 |
| `label-sfx-off` | 효과음 끄기 | cream | secondary | `SettingsSheet` | P0 |
| `label-battle-view` | 전투 보기 | cream | travel | `BattleSummaryBar` | P0 |
| `label-stage` | 사냥터 | cream | secondary | 전투 무대 사냥터 버튼 (스테이지 번호는 텍스트) | P0 |
| `label-climb` | 등반 | cream | travel | 전투 무대·사냥터 선택 | P0 |
| `label-boss-challenge` | 도전 | ink | primary | 보스 도전 | P0 |
| `label-keep-training` | 수련하기 | cream | secondary | 보스 도전 보류 | P0 |
| `label-continue` | 계속하기 | ink | primary | 보스 결과·스토리 | P0 |
| `label-goals` | 수련 목표 | cream | secondary | 전투 상태 줄 (받을 수 있는 개수는 텍스트) | P0 |
| `label-tower` | 수련탑 | cream | secondary | 전투 상태 칩·사냥터 팝업 (층·남은 공방은 텍스트) | P0 |
| `label-tower-quit` | 포기 | cream | danger | 전투 무대 수련탑 종료 | P0 |
| `label-claim` | 받기 | ink | primary | `GoalsView` | P0 |
| `label-claimed` | 받음 | cream | secondary | `GoalsView` 수령 완료 | P0 |
| `label-goal-progress` | 진행 중 | cream | secondary | `GoalsView` 미달성 | P0 |
| `label-next` | 다음 | ink | primary | 온보딩·스토리 | P1 |
| `label-skip` | 건너뛰기 | cream | secondary | 온보딩·스토리 | P1 |
| `label-use-default` | 기본값 사용 | cream | secondary | 온보딩 | P1 |
| `label-equip-best` | 최적 장착 | ink | primary | `GearPanel` | P1 |
| `label-disassemble-select` | 분해 선택 | cream | secondary | `GearPanel` | P1 |
| `label-disassemble` | 분해하기 | cream | danger | `GearPanel` | P1 |
| `label-select-all` | 전체 선택 | cream | secondary | `GearPanel` | P1 |
| `label-deselect-all` | 전체 해제 | cream | secondary | `GearPanel` | P1 |
| `label-equip` | 장착 | ink | primary | `GearPanel` | P1 |
| `label-unequip` | 해제 | cream | secondary | `GearPanel` | P1 |
| `label-enhance` | 강화하기 | ink | primary | 강화 팝업 (`+n` 텍스트와 함께) | P1 |
| `label-donate-chi` | 내공 전량 기부 | ink | primary | `SectPanel` | P1 |
| `label-donate-elixir` | 영약 전량 기부 | cream | secondary | `SectPanel` | P1 |
| `label-sect-board` | 문파 무공 보기 | cream | travel | `SectPanel` (보드 이름은 텍스트) | P1 |
| `label-shop-exchange` | 영약 1개 교환 | ink | primary | `ShopPanel` (비용은 텍스트) | P1 |
| `label-gacha-once` | 1회 뽑기 | ink | primary | `GachaPanel` | P1 |
| `label-gacha-ten` | 10회 뽑기 | ink | primary | `GachaPanel` | P1 |
| `label-gacha-again` | 다시 뽑기 | ink | primary | `GachaPanel` | P1 |
| `label-gacha-rates` | 확률 정보 보기 | cream | secondary | `GachaPanel` | P1 |
| `label-rebirth-view` | 환골탈태 보기 | cream | travel | 전투 탭 | P1 |
| `label-rebirth-open` | 환골탈태 화면 열기 | cream | travel | `MyInfoView` | P1 |
| `label-rebirth-proceed` | 환골탈태 진행 | cream | danger | `RebirthView` | P1 |
| `label-rebirth-not-ready` | 조건 미충족 | cream | secondary | `RebirthView` | P1 |
| `label-rebirth-execute` | 환골탈태 실행 | cream | danger | `RebirthView` | P1 |
| `label-back-to-first-stage` | 1-1 전투로 | ink | primary | `RebirthView` | P1 |
| `label-backup-copy` | 백업 코드 복사 | cream | secondary | `SettingsSheet` | P1 |
| `label-backup-restore` | 백업 코드로 복원 | cream | secondary | `SettingsSheet` | P1 |
| `label-backup-overwrite` | 현재 진행을 덮어쓰고 복원 | cream | danger | `SettingsSheet` 2단계 확인 | P1 |
| `label-subtab-general` | 일반상점 | cream | segment | `ShopPanel` 소탭 | P1 |
| `label-subtab-gacha` | 기연(奇緣) | cream | segment | `ShopPanel` 소탭 | P1 |
| `title-settings` | 설정 | cream | 현판 | 설정 팝업 | P0 |
| `title-currency` | 보유 재화 | cream | 현판 | 재화 팝업 | P0 |
| `title-boss-challenge` | 보스 도전 | cream | 현판 | 보스 도전 팝업 | P0 |
| `title-boss-defeated` | 보스 격파 | cream | 현판 | 보스 결과 팝업 | P0 |
| `title-locked-gong` | 무공 잠김 | cream | 현판 | 잠김 팝업 | P0 |
| `title-locked-gear` | 장비 잠김 | cream | 현판 | 잠김 팝업 | P0 |
| `title-locked-sect` | 문파 잠김 | cream | 현판 | 잠김 팝업 | P0 |
| `title-locked-shop` | 상점 잠김 | cream | 현판 | 잠김 팝업 | P0 |
| `title-offline-report` | 자리를 비운 동안 | cream | 현판 | 오프라인 보상 팝업 | P1 |
| `title-rebirth-ready` | 환골탈태 가능 | cream | 현판 | 전투 탭 팝업 | P1 |
| `title-rebirth-confirm` | 환골탈태 확인 | cream | 현판 | `RebirthView` | P1 |
| `title-rebirth-done` | 환골탈태 완료 | cream | 현판 | `RebirthView` | P1 |
| `title-gacha-rates` | 기연 확률 | cream | 현판 | `GachaPanel` | P1 |
| `title-disassemble` | 장비 분해 | cream | 현판 | `GearPanel` | P1 |
| `title-donate-chi` | 내공 전량 기부 | cream | 현판 | `SectPanel` 확인 팝업 | P1 |
| `title-donate-elixir` | 영약 전량 기부 | cream | 현판 | `SectPanel` 확인 팝업 | P1 |
| `section-equipped` | 현재 장비 | ink | 흰 회벽 | `GearPanel` | P1 |
| `section-inventory` | 소지품 | ink | 흰 회벽 | `GearPanel` (개수는 텍스트) | P1 |
| `section-candidates` | 소지품 후보 | ink | 팝업 한지 | 장비 비교 팝업 | P1 |
| `section-donate` | 기부 | ink | 한지 카드 | `SectPanel` | P1 |
| `section-stats` | 주요 능력치 | ink | 흰 회벽 | `MyInfoView` | P1 |
| `section-rebirth` | 환골탈태 | ink | 흰 회벽 | `MyInfoView` | P1 |
| `section-kept` | 유지되는 항목 | ink | 흰 회벽 | `RebirthView` | P1 |
| `section-reset` | 초기화되는 항목 | ink | 흰 회벽 | `RebirthView` | P1 |
| `section-gacha-result` | 뽑기 결과 | ink | 흰 회벽 | `GachaPanel` | P1 |
| `section-goal-daily` | 일일 수련 | ink | 한지 카드 | `GoalsView` | P0 |
| `section-goal-milestone` | 누적 수련 | ink | 한지 카드 | `GoalsView` | P0 |
| `section-save-backup` | 저장 백업 | ink | 한지 카드 | `SettingsSheet` | P1 |
| `tag-tier-primary` | 1차 | 흰 글자 | 붉은 낙관 | 초식 카드 단계 | P0 |
| `tag-tier-secondary` | 2차 | 흰 글자 | 붉은 낙관 | 초식 카드 단계 | P0 |
| `tag-tier-capstone` | 오의 | 금 글자 | 짙은 붉은 낙관 + 금테 | 초식 카드 단계 | P0 |
| `sign-sect-qingyun` | 청운문 | 금 글자 | 남색 현판 전체(글자 포함 간판) | `SectPanel` 소속 카드 머리 | P1 |
| `sign-shop-elixir` | 영약 교환소 | ink | 약방 목패 전체(글자 포함 간판) | `ShopPanel` | P1 |
| `sign-tower` | 수련탑 | 금 글자 | 남색 현판 전체(글자 포함 간판) | 사냥터 팝업 수련탑 진입 행 머리 | P1 |

수련탑 도전 버튼은 보스 도전과 문구가 같아 `label-boss-challenge`를 함께 쓰고, 복원 취소에는 `label-cancel`을 쓴다.

`tag-*`, `sign-*`은 낙관·현판·목패 그림을 생성하고 그 위에 폰트로 글자를 합성한 한 장짜리 이미지다. 태그 크기는 36×20 → 108×60, 간판은 358×72 → 1074×216이다.

### 5.8 게이지(체력바) 디자인 (그룹 `gauge`, 원본 2배)

현재 체력바는 `.bar`(높이 18px, 둥근 반투명 검정 홈)에 붉은 그라데이션을 채운 CSS이고, 경험치는 높이 8px 파란 그라데이션이다. 체력바는 전투에서 가장 자주 보는 정보이므로 전용 디자인으로 바꾼다.

#### 레이어 구조

| 순서(아래→위) | 레이어 | 구현 |
| --- | --- | --- |
| 1 | 홈(track): 틀 안쪽의 어두운 빈 칸 | 틀 이미지의 가운데 영역 |
| 2 | 잔상(trail): 피해 직후 줄어든 만큼 잠시 남는 연한 띠 | `fill-*-trail` 반복 이미지. 폭이 채움보다 0.35초 늦게 줄어든다(CSS `transition-delay`) |
| 3 | 채움(fill): 현재 값 | `fill-*` 반복 이미지. 폭 = 현재/최대 |
| 4 | 광택(gloss): 위쪽 1/3의 옅은 빛 | `overlay-gauge-gloss` 반복 이미지(모든 게이지 공용) |
| 5 | 틀(frame)과 끝 장식 | `frame-gauge-*` 3-slice. 끝 장식은 slice 안에 둔다 |
| 6 | 수치 텍스트 `현재 / 최대` | HTML. 크림색 `#f3e6c4` + 먹색 윤곽(`text-shadow`), 12px, 가운데 정렬 |

회복할 때는 채움이 먼저 늘고 잔상은 채움 폭에 바로 맞춘다. `prefers-reduced-motion`에서는 잔상 지연을 없앤다.

#### 종류

| 종류 | 틀 모티프 | 채움 | 표시 높이 | 앞 아이콘 |
| --- | --- | --- | --- | --- |
| 적 체력(일반) | 흑칠 목재 틀 + 청동 못 | 붉은 옻칠 광택 `fill-hp-enemy` | 20px | 없음 |
| 적 체력(보스) | 금테 흑칠 틀, 왼쪽 끝 붉은 귀면 장식, 오른쪽 끝 매듭 술 | 짙은 진홍 `fill-hp-boss` | 24px | 틀의 귀면 장식 |
| 내 체력 | 청동 틀, 왼쪽 끝 옥 구슬 장식 | 붉은 혈색 `fill-hp-player`(적과 무늬를 달리해 구분) | 20px | `icon-stat-hp` |
| 경험치 | 얇은 청동 선 틀 | 옥색 `fill-exp` | 10px | `icon-exp`(P1) |
| 문파 단계 | 한지 카드용 얇은 흑칠 틀 | 청색 비단 `fill-sect` | 16px | 없음 |

- **위험 상태.** 체력이 30% 이하이면 채움을 조금 밝게 하고 틀 안쪽에 붉은 빛을 CSS `box-shadow`로 더한다. 움직임 줄이기 설정에서는 깜빡임 없이 색만 유지한다. 수치 텍스트는 항상 보인다.
- **0 체력.** 채움·잔상이 모두 사라지고 홈만 남는다. 쓰러짐 연출은 전투 캔버스가 담당한다.
- **적과 내 체력 구분.** 틀 모양(흑칠·금테 대 청동)과 끝 장식으로 구분하고, 같은 붉은 계열이어도 채움 무늬를 다르게 한다(적: 옻칠 광택, 나: 은은하게 흐르는 결).

#### 에셋

| id | 형태 | 크기 | slice | 우선 |
| --- | --- | --- | --- | --- |
| `frame-gauge-enemy` | 3-slice | 240×20 → 480×40 | 좌우 24 | P0 |
| `frame-gauge-boss` | 3-slice | 240×24 → 480×48 | 좌 48(귀면), 우 32(술) | P0 |
| `frame-gauge-player` | 3-slice | 240×20 → 480×40 | 좌 36(옥 구슬), 우 24 | P0 |
| `frame-gauge-exp` | 3-slice | 240×10 → 480×20 | 좌우 12 | P0 |
| `frame-gauge-sect` | 3-slice | 240×16 → 480×32 | 좌우 16 | P1 |
| `fill-hp-enemy` / `fill-hp-enemy-trail` | 가로 반복 | 32×16 → 64×32 | – | P0 |
| `fill-hp-boss` / `fill-hp-boss-trail` | 가로 반복 | 32×20 → 64×40 | – | P0 |
| `fill-hp-player` / `fill-hp-player-trail` | 가로 반복 | 32×16 → 64×32 | – | P0 |
| `fill-exp` | 가로 반복 | 32×6 → 64×12 | – | P0 |
| `fill-sect` | 가로 반복 | 32×12 → 64×24 | – | P1 |
| `overlay-gauge-gloss` | 가로 반복, 반투명 | 32×16 → 64×32 | – | P0 |

잔상 이미지는 채움과 같은 무늬를 한지빛(`#f1d9b8`) 쪽으로 밝게 바꾼 버전이다. 채움 영역 높이는 틀 높이에서 위아래 틀 두께를 뺀 값이며, 틀 안쪽 홈 위치를 매니페스트에 `inset`으로 기록한다.

## 6. 화면별 적용 계획

| 화면·컴포넌트 | 교체할 표면 | 에셋 | 텍스트로 남길 것 |
| --- | --- | --- | --- |
| `body`·`#app` | 앱 바탕, 넓은 화면 바깥, 섹션 구분선, 색 토큰 | `theme-app-wall`, `theme-wall-ink-branch`, `theme-outer-landscape`, `theme-divider-ink`, 4.4 토큰 | 모든 동적 텍스트(영역별 글자 토큰) |
| `AppHeader` | 신분줄 배경, 초상 틀, 재화 칩 아이콘, 설정 버튼 | `frame-header-eave`, `frame-portrait`, `icon-gold/chi/elixir/contribution/stones`, `btn-round`+`icon-settings` | 도호, 경지, 재화 수치, 재화 이름 |
| `TabBar` | 탭바 배경, 4탭 | `frame-tabbar`, `tab-*`, `icon-lock`, `icon-badge` | 없음(`aria-label` 유지) |
| `BattleSummaryBar` | 요약줄 | `frame-summary-strip`, `label-battle-view` | 스테이지, 전투 상태 |
| `BattleTab` | 전투 상태 줄, 수련 목표 버튼, 전투 무대 액자, 수련탑 상태 칩, 적·보스·내 체력바, 경험치 게이지, 사냥터·등반 버튼, 보스 카드 | `icon-status-*`, `icon-climb`, `icon-combat-power`, `frame-battle-stage`, 5.8 게이지, `icon-stat-hp`, `label-stage`, `label-climb`, `label-boss-challenge`, `label-keep-training`, `label-continue`, `icon-goal`+`label-goals`, `icon-tower`+`label-tower`, `icon-hourglass`, `btn-danger-brick`+`label-tower-quit` | 적·보스 이름, 체력 수치, 레벨, 전투력 수치, 전투 상태 문구, 보상 |
| `Sheet` | 팝업 틀, 제목 현판, 닫기 | `frame-popup`, `frame-title-plaque` 또는 `title-*`, `btn-round`+`icon-close` | 동적 제목(`title-*`가 없는 경우), 본문 |
| `FullView` | 뒤로 버튼 | `btn-round`+`icon-back` | 화면 제목 |
| `SettingsSheet` | 설정 줄, 버튼, 저장 백업 구역 | `frame-row-slip`, `btn-primary-tile`+`label-pause/resume`, `btn-secondary-brick`+`label-sfx-on/off`, `title-settings`, `section-save-backup`, `icon-backup`, `label-backup-copy/restore`, `btn-danger-brick`+`label-backup-overwrite` | 진행 중·일시정지 상태, 백업 코드 문자열, 복사·복원 결과 안내 |
| `CurrencySheet` | 목록 아이콘 | `icon-*`, `icon-charm`, `title-currency` | 재화 이름·용도·수치 |
| `LockedTabSheet` | 잠김 표식·제목 | `icon-lock`, `title-locked-*` | 해금 조건, 진행 위치 |
| `GongPanel` | 보드 선택기, 초식 카드, 단계 태그, 연마 버튼 | `scroll-silk-picker`, `icon-dropdown`, `scroll-bamboo-card(-locked)`, `tag-tier-*`, `label-train-once`, `label-train`, `frame-banner-silk` | 보드 이름·진행도, 초식 이름·레벨, 효과 수치, 비용, `{n}회`, 해금 조건 |
| `GearPanel` | 무기고 배경, 슬롯, 등급 테, 섹션 제목, 버튼 | `panel-armory`, `frame-slot`, `frame-grade-*`, `icon-slot-*`, `section-*`, `label-equip-best` 외 장비 라벨 | 장비 이름·등급명·강화 수치·능력치 비교·개수 |
| `SectPanel` | 소속 간판, 카드, 게이지, 기부 버튼 | `sign-sect-qingyun`, `frame-panel-hanji`, `frame-gauge-sect`, `fill-sect`, `section-donate`, `label-donate-*`, `label-sect-board` | 문파 레벨·특전·기여도 수치·환산 비율 |
| `ShopPanel`·`GachaPanel` | 소탭, 간판, 상품 카드, 뽑기 버튼, 카드 뒷면 | `btn-segment(-active)`, `label-subtab-*`, `sign-shop-elixir`, `icon-elixir`, `label-gacha-*`, `panel-gacha-card-back`, `icon-gacha` | 비용·보유 전·잔액·확률표·결과 등급과 이름 |
| `StagePicker` | 대스테이지 행, 수련탑 진입 행 | `panel-stage-map`, `label-climb`, `frame-row-slip`, `panel-tower-gate`, `sign-tower`, `icon-tower`, `btn-primary-tile`+`label-boss-challenge` | 대 번호·지명·보스 이름·소스테이지 번호, 최고 층·다음 층·해금 조건 |
| `GoalsView` | 구역 제목, 목표 행, 수령 버튼 | `frame-panel-hanji`, `section-goal-daily`, `section-goal-milestone`, `icon-goal-daily`, `icon-goal-milestone`, `frame-row-slip`, `btn-primary-tile`+`label-claim`, `btn-secondary-brick`+`label-claimed`/`label-goal-progress`, 목표별 `icon-*` | 목표 이름·진행 수치·보상 수치 |
| `OfflineReportSheet` | 팝업 머리 그림, 제목, 확인 버튼 | `frame-popup`, `panel-offline-night`, `title-offline-report`, `icon-offline`, `icon-hourglass`, `icon-status-reward`, `btn-primary-tile`+`label-confirm` | 경과 시간, 처치 수, 획득 수치, 오른 레벨 |
| `RebirthView`·`MyInfoView` | 섹션 제목, 버튼, 문양 | `section-*`, `title-rebirth-*`, `label-rebirth-*`, `icon-rebirth` | 조건·유지/초기화 항목·능력치 |
| `OnboardingFlow`·`StoryCutscene` | 대화창, 버튼 | `scroll-parchment-dialog`, `label-next`, `label-skip`, `label-continue`, `label-use-default` | 대사, 도호 입력 |
| `Toast` | 쪽지 | `frame-toast-note` | 알림 문구 |

### 6.1 아이콘 추가 위치

지금 글자만 있는 곳 중 아이콘을 붙일 자리다. 괄호 안은 계속 남기는 텍스트다.

| 화면 | 위치 | 추가 아이콘 | 우선 |
| --- | --- | --- | --- |
| 하단 탭 | 4탭 | `icon-tab-*`(탭 이미지에 합성), `icon-lock`, `icon-badge` | P0 |
| 상단 신분줄 | 설정 버튼 | `icon-settings` | P0 |
| 상단 신분줄 | 재화 칩 | `icon-gold`·`icon-chi`·`icon-elixir`·`icon-contribution`·`icon-stones` (재화 이름·수치) | P0 |
| 전투 탭 | 전투 상태 줄 | 상태별 `icon-status-auto/paused/farm/boss/reward` (상태 문구) | P0 |
| 전투 탭 | 수련 목표 버튼 | `icon-goal` (받을 수 있는 개수) | P0 |
| 전투 탭 | 수련탑 상태 칩·포기 버튼 | `icon-tower`, `icon-hourglass` (층·남은 공방) | P0 |
| 전투 탭 | 등반 위치·등반 버튼 | `icon-climb` (스테이지 번호) | P0 |
| 전투 탭 | 적 이름 줄 | 보스일 때 `icon-status-boss` (적 이름) | P0 |
| 전투 탭 | 내 이름 줄 | `icon-combat-power` (전투력 수치) | P0 |
| 전투 탭 | 체력·경험치 게이지 | 5.8 게이지, `icon-stat-hp`, `icon-exp` | P0/P1 |
| 전투 요약줄 | 상태 | 상태별 `icon-status-*` (스테이지·상태 문구) | P0 |
| 무공 탭 | 초식 카드 효과 줄 | 효과별 `icon-stat-*`, `다음` 앞 `icon-diff-up` (효과 수치) | P0 |
| 무공 탭 | 연마 버튼 비용 줄 | `icon-action-train`, 비용 재화 아이콘 (비용 수치, `{n}회`) | P0 |
| 무공 탭 | 해금 조건·잠긴 보드 | `icon-lock` (조건 문구) | P0 |
| 무공 탭 | 보드 선택기 | `icon-dropdown` (보드 이름·진행도) | P0 |
| 무공 탭 | 길게 누르기 안내 | `icon-hold` (안내 문구) | P1 |
| 설정 팝업 | 전투 제어·효과음 줄 | `icon-status-paused`/`icon-status-auto`, `icon-sfx-on`/`icon-sfx-off` (상태 문구) | P0 |
| 설정 팝업 | 저장 백업 줄 | `icon-backup`, 경고 문구에 `icon-warn` (백업 코드·안내) | P1 |
| 수련 목표 | 일일·누적 구역 제목 | `icon-goal-daily`, `icon-goal-milestone` (구역 제목은 라벨) | P1 |
| 수련 목표 | 목표 행 | 목표 종류별 `icon-status-boss`·`icon-rebirth`·`icon-action-train`·`icon-action-enhance`·`icon-tower`, 보상 재화 아이콘, 수령 완료 `icon-check` (진행·보상 수치) | P1 |
| 사냥터 선택 | 수련탑 진입 행 | `icon-tower`, 잠김 시 `icon-lock`, 제한 안내에 `icon-hourglass` (최고 층·다음 층·조건) | P1 |
| 오프라인 팝업 | 경과·보상 줄 | `icon-offline`, `icon-hourglass`, `icon-status-reward`, 획득 재화 아이콘 (시간·수치) | P1 |
| 팝업 공통 | 닫기·뒤로 | `icon-close`, `icon-back` (`aria-label`) | P0 |
| 잠김 팝업 | 잠김 표식 | `icon-lock`, 해금 토스트에 `icon-unlock` | P0/P1 |
| 장비 탭 | 9슬롯 | `icon-slot-*` (슬롯 이름·등급·강화 수치) | P1 |
| 장비 탭 | 정렬·필터 선택 | `icon-sort`, `icon-filter`, `icon-dropdown` (선택값) | P1 |
| 장비 탭 | 능력치 비교 | `icon-stat-*`, `icon-diff-up`/`icon-diff-down` (수치) | P1 |
| 장비 탭 | 최적 장착·장착·해제·분해·강화 버튼 | `icon-action-*` | P1 |
| 문파 탭 | 기여도·환산 비율·기부 버튼 | `icon-contribution`, `icon-chi`, `icon-elixir`, `icon-action-donate` (수치·비율) | P1 |
| 상점 탭 | 비용·보유·잔액, 부족 표시 | `icon-gold`, `icon-elixir`, `icon-warn` (수치) | P1 |
| 상점 탭 | 교환·뽑기·확률 정보 버튼 | `icon-action-exchange`, `icon-gacha`, `icon-info` | P1 |
| 사냥터 선택 | 소스테이지 칸 | 보스 칸 `icon-status-boss`, 클리어 `icon-check`, 현재 위치 `icon-stage-current`, 잠김 `icon-lock` (번호) | P1 |
| 환골탈태 | 유지·초기화 항목, 버튼 | `icon-check`, `icon-reset`, `icon-rebirth` (항목 이름) | P1 |
| 토스트 | 알림 종류 | 보상 `icon-status-reward`, 해금 `icon-unlock`, 경고 `icon-warn` (알림 문구) | P1 |

## 7. 제작 파이프라인

1. **스타일 보드(승인 게이트).** 코덱스가 버튼 4종·패널·팝업·탭·아이콘 5종을 한 화면에 모은 무드 보드 1장을 생성한다. 사용자가 색·질감·장식 밀도를 승인하기 전에는 개별 에셋을 대량 생성하지 않는다.
2. **글자 없는 그림 생성.** 5.1~5.6·5.8의 테마 배경·프레임·버튼 바탕·아이콘·두루마리·간판 바탕·게이지를 이미지 생성으로 만든다. 테마 배경을 먼저 만들어 이후 에셋을 그 바탕 위에서 검수한다. 글자·숫자·가짜 한자를 그리지 않게 한다.
3. **정리 스크립트.** 배경 제거, 원본 크기 맞춤, 9-slice 모서리·변 정렬 확인, WebP 변환을 스크립트로 처리한다. 원본 PNG는 `output/ui-elements/source/`, 결과는 `assets/ui/<그룹>/`에 둔다.
4. **라벨 합성 스크립트.** 5.7의 문구를 폰트로 그려 `ink`/`cream` 스타일로 저장하고, `tag-*`·`sign-*`·`tab-*`은 생성한 바탕 그림 위에 글자를 합성한다.
   - 폰트는 SIL Open Font License 한글 폰트를 쓴다. 제목·태그·간판은 붓글씨 계열(Nanum Brush Script), 버튼 라벨·탭 이름과 한자가 섞인 문구는 명조 계열(Nanum Myeongjo)을 기본으로 한다. 폰트 파일과 라이선스 파일을 `output/ui-elements/fonts/`에 함께 둔다.
   - 합성 후 모든 글자가 폰트에 있는지(빈 네모 없음) 검사한다.
5. **매니페스트.** `assets/ui/manifest.json`에 `id`, `file`, `kind`(`nine-slice`·`three-slice`·`fixed`·`repeat`), `cssSize`, `sourceSize`, `slice`, `text`(라벨 문구), `priority`를 기록한다.
6. **미리보기 검수.** `output/ui-elements/preview.html`에서 390px·320px 폭 기준으로 9-slice 프레임을 여러 크기로 늘려 보고, 버튼 바탕+라벨 조합과 탭 선택 상태를 확인한다.
7. **게임 적용.** 에셋 승인 후 별도로 진행한다. **가장 먼저 4.4의 테마 배경·색 토큰을 수정**(토큰 정리 → 값 교체 → 배경 레이어)하고, 그 테마 위에서 매니페스트와 6장·6.1 표를 기준으로 프레임·버튼·게이지·아이콘을 바꾼다.

## 8. 검수 기준

- [ ] 모든 에셋이 실제 알파 PNG 원본과 WebP 결과를 가지며, 투명해야 할 영역의 알파가 0이다.
- [ ] 생성 그림에 글자·숫자·가짜 한자·워터마크가 없다. 모든 글자는 5.7 라벨 합성으로 들어갔고, 문구가 표와 한 글자도 다르지 않다.
- [ ] 9-slice·3-slice 에셋을 가로 2배·세로 2배로 늘려도 모서리 장식이 찌그러지지 않고 변의 이음매가 보이지 않는다.
- [ ] 라벨·동적 텍스트가 바탕 가운데에서 명암 대비 4.5:1 이상으로 읽힌다.
- [ ] 320px 폭에서 가장 긴 라벨(`현재 진행을 덮어쓰고 복원`, `환골탈태 화면 열기`, `확률 정보 보기`)이 버튼 안에 들어가고 16px 글자 높이를 유지한다. 백업 복원 라벨은 필요하면 두 줄로 나눈 이미지를 쓴다.
- [ ] 같은 역할(주요·보조·이동·위험)의 버튼이 모든 화면에서 같은 바탕을 쓴다. 금색 바탕은 주요 행동에만 쓴다.
- [ ] 탭 기본/선택, 소탭 기본/선택, 초식 카드 기본/잠김이 색만이 아니라 모양·밝기로도 구분된다.
- [ ] 등급 프레임 6종의 색이 `GRADE_COLOR`와 같고, 등급명 텍스트와 함께 쓰인다.
- [ ] 모든 아이콘을 흰 회벽과 흑칠 바탕 양쪽에서 16·20·24px로 줄여도 모양으로 구분되고, 같은 윤곽 두께·광원·시점을 쓴다. 상승/하락, 잠김/열림, 보스/일반은 색이 아니라 모양이 다르다.
- [ ] 아이콘이 동적 수치·이름을 대신하지 않으며, 아이콘 단독 버튼(닫기·뒤로·설정·정보·펼침)과 재화 이름을 대신한 비용 아이콘에 `aria-label`이 있다.
- [ ] 게이지 틀을 폭 120~358px로 늘려도 끝 장식이 찌그러지지 않고, 채움·잔상·광택이 틀 안쪽 홈에 정확히 맞는다. 적·보스·내 체력바가 틀 모양만으로 구분된다.
- [ ] 체력 30% 이하 위험 상태와 잔상 지연이 동작하고, 움직임 줄이기 설정에서는 깜빡임·지연이 없다.
- [ ] 이미지 버튼마다 `aria-label` 또는 화면 밖 텍스트가 있다.
- [ ] 수련 목표 행의 `받기`·`받음`·`진행 중` 세 상태가 바탕 모양과 밝기로도 구분되고, 받을 수 있는 목표가 한눈에 띈다.
- [ ] `frame-row-slip`을 높이 56~112px로 늘려도 끈 매듭 장식이 찌그러지지 않고, 설정·수련 목표·수련탑 진입 행이 같은 바탕을 쓴다.
- [ ] 오프라인 팝업의 `panel-offline-night` 위에서 경과 시간·획득 수치가 4.5:1 이상으로 읽히고, 밤 그림이 보스 팝업과 톤이 어긋나지 않는다.
- [ ] P0 에셋 전체 용량이 1MB 이하다.
- [x] 흰 회벽 바탕 위 본문 글자·보조 글자·증감색이 4.4의 대비 기준을 넘고, 검은 영역 안에서는 on-ink 글자 토큰으로 바뀐다.
- [ ] `theme-app-wall`을 이어 붙였을 때 이음매가 보이지 않고, 먹 가지 장식이 카드·목록 글자 뒤에 오지 않는다.
- [x] 휴대폰 폭에서는 `theme-outer-landscape`를 내려받지 않는다.
- [x] 이미지를 불러오지 못해도 토큰 색만으로 흰/검 명도 구조와 글자가 읽힌다.
- [ ] 레퍼런스의 건물·문양을 그대로 옮기지 않았고, SD 페인터리 캐릭터·전투 배경과 나란히 놓았을 때 톤이 어긋나지 않는다.

## 9. 작업 순서

| 단계 | 범위 | 완료 조건 |
| --- | --- | --- |
| 1 | 스타일 보드(흰 회벽 바탕에서 검수) | 사용자 승인 |
| 2 | 테마 배경 에셋(5.6) | 이음매·명도 편차 검수 통과 |
| 3 | **테마 적용(최우선):** 4.4 토큰 정리(화면 변화 없음) → 토큰 값 교체 → 배경 레이어 | 정리 단계 전후 스크린샷 동일, 교체 후 대비 검사·320/390/430px 확인, lint·빌드 통과 |
| 4 | P0 에셋: 공통 프레임·띠, 버튼 바탕, 게이지, 하단 탭, P0 아이콘, 무공 죽간·비단, P0 라벨·제목·태그 | 바뀐 테마 위 매니페스트·미리보기·검수 통과 |
| 5 | P0 게임 적용: 헤더·탭바·요약줄·팝업·설정·재화·잠김·전투 탭(게이지·상태 아이콘)·무공 탭 | 320/390/430px 실기기 확인 |
| 6 | P1 에셋: 장비·문파·상점·기연·환골탈태·스테이지 선택·스토리·토스트, P1 아이콘·게이지 | 매니페스트·미리보기·검수 통과 |
| 7 | P1 게임 적용 | 모든 탭과 팝업에서 같은 역할의 표면·아이콘이 일관 |
| 8 | 포트폴리오 보드(12장) | 12.3 절차 완료, 사용자 확인 |

[[장기-플레이-시스템]] 화면의 에셋은 위 단계에 나눠 넣는다. 전투 화면에 늘 보이는 수련 목표 버튼·수련탑 상태 칩과 공용 `frame-row-slip`은 4·5단계(P0)에, 수련 목표 화면 내부 아이콘·사냥터 팝업 수련탑 진입 행·오프라인 팝업·저장 백업 구역은 6·7단계(P1)에 넣는다.

## 10. 코덱스 작업 규칙

- 저장소 루트의 `AGENTS.md`와 이 문서를 먼저 읽는다.
- 이 기획 범위에서 `src/`의 코드와 `src/style.css`는 수정하지 않는다. 스크립트는 `output/ui-elements/tools/`에 둔다.
- 생성 결과가 목록의 크기·slice·투명도·문구를 지키지 못하면 후보로만 두고 `assets/ui/`에 넣지 않는다.
- 작업이 끝나면 생성한 파일 목록, 검수 결과, 기준을 못 지킨 항목을 보고한다.

### 10.1 적용 인계

에셋 생성 단계가 끝난 뒤의 P0·P1 게임 반영은 `output/ui-elements/CLAUDE-APPLY-THEME.md`를 단일 지시서로 사용한다. 그 단계에서는 이 절의 `src/` 수정 금지 규칙을 적용하지 않는다. 먼저 에셋 파일·`assets/ui/manifest.json`·대상 클래스가 모두 있는지 확인하고, 가능한 항목은 CSS로 연결한다. 아이콘·고정 라벨처럼 종류별 대상 클래스가 없을 때만 필요한 TSX 클래스를 추가한다.

등급 데이터의 표시명은 `하품/중품/상품/절품/신품/선품`이며, 현재 검수 에셋 파일명은 `하품/중품/상품/진품/극품/선품`이다. 따라서 `절품`에는 `frame-grade-진품`, `신품`에는 `frame-grade-극품`을 매핑한다. 색은 반드시 `src/game/gradeData.ts`의 `GRADE_COLOR`와 대조한다.

### 10.2 P1 생성 완료 현황

| id | 상태 | 비고 |
| --- | --- | --- |
| `frame-toast-note` | 완료 | `assets/ui/frame/frame-toast-note.webp`, 192×128 원본·9-slice 32px |

## 11. 코덱스 프롬프트

아래 프롬프트를 순서대로 하나씩 코덱스에 전달한다. 각 프롬프트는 앞 단계 결과가 승인된 뒤 실행한다.

### 11.1 공통 스타일 문장

모든 이미지 생성 요청의 맨 앞에 붙이는 영어 스타일 문장이다. 11.2~11.7 프롬프트가 이 문장을 참조한다.

```text
Mobile game UI element for a Korean wuxia idle RPG. Soft semi-realistic painterly illustration, matching chibi SD painterly characters. Strong white-and-black contrast like ink-wash painting: white lime-plaster walls and hanji paper (#efebe3-#f6eedb) against black lacquered wood and black ink brush silhouettes (#141416-#2c2a2b); color only as small accents. Traditional East Asian palace and mountain-sect architecture materials: black lacquered wood with small red lacquer accents (#5a1f18-#7a2a1f), dark wood (#2a1d16-#3b2a1f), restrained gold leaf trim (#c8962e-#f4d66e), deep navy signboard plaques with gold frames (#1c2740-#2b3a5c), charcoal clay roof tiles (#34373c-#4a4e55), green-glazed roof tiles (#35685c-#5ea98f), silk (#eee4cb-#f6eedb), red brick (#8a3a2c-#a8483a). Clean readable silhouette, front orthographic view, even soft top-left lighting, subtle wear, no heavy grunge. Transparent background (real alpha). Absolutely no text, no letters, no numbers, no Chinese characters, no watermark, no logo. Do not copy any specific existing building or game UI.
```

### 11.2 프롬프트 1 — 스타일 보드

```text
저장소: D:\dev\murim-simulator
먼저 AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md(특히 2장·4장·5장·10장)를 읽어.

목표: UI Element 대량 생성 전에 승인받을 스타일 보드 1장을 만든다.

1. 이미지 생성으로 1536×1024 PNG 1장을 만든다. 파일: output/ui-elements/style-board/style-board-v1.png
   - 기획서 11.1 공통 스타일 문장을 앞에 붙이고 아래 내용을 이어서 요청한다. 이 이미지는 보드이므로 투명 배경 대신 실제 앱처럼 흰 회벽 바탕에 배치한다.
   - "A mobile UI style board: a white lime-plaster wall background with a faint black ink plum branch painted in the top-right corner, a black clay roof-tile eave strip across the top edge and a black lacquered wooden railing tab bar across the bottom edge (one tab highlighted with a navy plaque). Between them, neatly arranged with generous spacing: (1) four horizontal button plates side by side — golden glazed roof tile with gold trim, charcoal brick with dark wood trim, green-glazed roof tile with small gold studs, red brick with dark wood trim; (2) a hanji paper card with thin black lacquer border, and next to it a black lacquer emphasis panel with a thin red lacquer inner line and gold corner ornaments; (3) a popup window frame made of black lacquered wooden pillars with an upturned eave top, gold lattice corners, hanji paper inner surface and a deep navy plaque with gold frame on top; (4) a bamboo slip scroll card (vertical bamboo strips tied with cord, rolled ends); (5) a silk scroll banner with wooden rollers; (6) a small dark night battle scene inside a black lacquered wooden picture frame hung on the white wall; (7) five small icons: brushstroke X close mark, arrowhead back mark, bagua compass settings disc, square-holed coin, ceramic elixir bottle with red stopper. All plates and frames are empty with no text."
2. 생성 결과를 확인하고 글자·가짜 한자가 보이면 다시 생성한다(최대 3회).
3. 같은 폴더에 notes.md를 만들어 사용한 프롬프트, 생성 횟수, 눈에 띄는 문제를 적는다.
4. src/, assets/는 건드리지 않는다. 결과 이미지 경로와 요약만 보고하고 멈춰. 사용자 승인 전에는 다음 단계로 가지 않는다.
```

### 11.3 프롬프트 2 — 테마 배경

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md(2.4, 4.4, 5.6장)를 읽어. 스타일 기준은 승인된 output/ui-elements/style-board/style-board-v1.png이다. 테마 배경은 이후 모든 UI Element를 검수할 바탕이므로 가장 먼저 만든다.

목표: 기획서 5.6 표의 테마 배경 4종을 만든다. 앱 본문은 흰 회벽, 위아래 띠와 강조 영역은 먹색이라는 2.4장의 명도 구조를 지킨다.

1. theme-app-wall (512×512)
   - 공통 스타일 문장 뒤에: "Seamless tileable texture of white lime-plaster wall mixed with faint hanji paper fibers, very low contrast, almost flat, no stains, no cracks, no objects." 투명이 아니라 불투명 흰색 질감이다.
   - 스크립트로 이음매를 검사한다: 2×2로 이어 붙인 이미지를 output/ui-elements/source/theme-app-wall-tile-check.png로 저장하고, 명도 편차가 평균 대비 ±4% 안인지 계산한다. 벗어나면 대비를 줄여 다시 만든다.
   - 손실 WebP 품질 85로 assets/ui/theme/theme-app-wall.webp
2. theme-wall-ink-branch (480×640, 투명)
   - "Single black ink brush painting of a plum blossom branch entering from the top-right corner, sparse and elegant, a few small blossoms in pale grey ink, like a mural painted on a white palace wall, isolated on transparent background."
   - 가지가 오른쪽 위 모서리에서 시작해 캔버스 가운데를 넘지 않게 한다. 무손실 WebP로 assets/ui/theme/theme-wall-ink-branch.webp
3. theme-outer-landscape (1920×1200)
   - "Wide ink-wash landscape: white mist, black ink mountain peaks and silhouettes of tiered clay-tile pavilions on cliffs at the left and right sides, the central vertical band (about 30 percent of width) left as calm empty white mist." 불투명 이미지.
   - 손실 WebP 품질 80으로 assets/ui/theme/theme-outer-landscape.webp. 용량을 보고한다.
4. theme-divider-ink (716×24, 투명)
   - "Single horizontal black ink brush stroke, thick in the middle and tapering at both ends, isolated on transparent background." 좌우 slice 64 안에 붓끝이 들어가게 한다. 무손실 WebP로 assets/ui/theme/theme-divider-ink.webp
5. manifest.json에 추가하고(kind: repeat|fixed|three-slice), preview.html의 바탕을 theme-app-wall로 바꾼다. 390px 폭 앱 기둥 오른쪽 위에 theme-wall-ink-branch, 넓은 화면 바깥에 theme-outer-landscape를 깔고, 그 위에 한지색(#f6eedb) 카드 상자와 먹색 본문 글자(#1f1d1b), 흑칠색(#1c1b1d) 상단·하단 띠를 CSS로 그려 흰/검 명도 구조를 확인한다. 프레임 에셋은 다음 단계에서 이 미리보기에 추가한다.
6. 기획서 8장의 테마 관련 검수 항목을 확인해 보고한다. src/는 수정하지 않는다.
```

### 11.4 프롬프트 3 — P0 프레임·띠·버튼 바탕·게이지

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md를 읽어. 승인된 스타일 보드는 output/ui-elements/style-board/style-board-v1.png이다. 이 보드의 색·질감·장식 밀도를 기준으로 맞추고, 앞 단계에서 만든 assets/ui/theme/ 테마 배경 위에서 검수한다.

목표: 기획서 5.1 표에서 우선이 P0인 항목 전체, 5.2 표의 버튼 바탕 7종, 5.8 표에서 우선이 P0인 게이지 에셋 전체를 만든다.

규칙
- 모든 이미지 생성 요청 앞에 기획서 11.1 공통 스타일 문장을 붙인다.
- 각 에셋은 표의 원본 크기로 저장한다. 생성 해상도가 다르면 전체를 한 번 같은 비율로 맞추고, 필요하면 투명 여백으로 캔버스를 맞춘다. 가로세로 비율을 바꿔 늘리지 않는다.
- 9-slice/3-slice 에셋은 표의 slice 값 안쪽에만 모서리 장식을 둔다. 변 구간은 늘려도 이음매가 안 보이는 곧은 목재결·기와줄·벽돌 줄눈으로, 가운데 구간은 글자가 올라가도 읽히게 무늬를 약하게 만든다.
- 버튼 바탕은 좌우 끝 slice(원본 40px) 안에 장식을 두고 가운데는 가로로 늘릴 수 있게 한다. 위아래 볼록한 입체감은 유지한다.
- 반복 채움(fill-*)과 광택(overlay-gauge-gloss)은 좌우 끝이 이어지게 만든다.
- 글자·숫자·기호를 그리지 않는다.

에셋별 생성 문장(공통 스타일 문장 뒤에 붙임)
- frame-panel-dark: "Square nine-slice emphasis panel frame: dark wood inner surface, black lacquer border with a thin red lacquer inner line, small gold corner ornaments with lattice motif."
- frame-panel-hanji: "Square nine-slice card frame: light hanji paper inner surface with faint fiber texture, thin black lacquer wood border, tiny gold corner pins."
- frame-popup: "Square nine-slice popup window frame: black lacquered wooden pillars on left and right, top beam with slightly upturned eave ends and gold lattice corners, light hanji paper inner surface."
- frame-title-plaque: "Horizontal three-slice signboard plaque: deep navy lacquer board with ornate gold frame and gold end caps, empty center."
- frame-header-eave: "Horizontal three-slice top bar: row of charcoal clay roof tiles forming an eave, upturned decorative tile ends on left and right, dark wood beam below."
- frame-tabbar: "Horizontal three-slice bottom bar: black lacquered wooden railing with simple balusters over charcoal stone floor slabs, carved end posts on left and right."
- frame-summary-strip: "Horizontal three-slice thin black lacquered wooden plank strip with small gold studs at both ends."
- frame-battle-stage: "Square nine-slice picture frame: black lacquered wood with carved lattice window corners and thin gold inner line, transparent center."
- frame-gauge-enemy: "Horizontal three-slice health bar frame: black lacquered wood rim with small bronze studs, dark empty inner channel."
- frame-gauge-boss: "Horizontal three-slice boss health bar frame: black lacquer rim with ornate gold trim, a small red demon mask ornament on the left end, a knotted tassel on the right end, dark empty inner channel."
- frame-gauge-player: "Horizontal three-slice health bar frame: bronze rim with a round jade bead ornament on the left end, dark empty inner channel."
- frame-gauge-exp: "Very thin horizontal three-slice bronze line gauge frame, dark empty inner channel."
- fill-hp-enemy: "Seamless horizontally tileable glossy red lacquer fill strip." / fill-hp-enemy-trail: 같은 무늬를 한지빛(#f1d9b8) 쪽으로 밝게 만든 버전
- fill-hp-boss: "Seamless horizontally tileable deep crimson lacquer fill strip with faint gold flecks." / fill-hp-boss-trail: 밝은 버전
- fill-hp-player: "Seamless horizontally tileable warm blood-red fill strip with subtle flowing grain." / fill-hp-player-trail: 밝은 버전
- fill-exp: "Seamless horizontally tileable soft jade green fill strip."
- overlay-gauge-gloss: "Seamless horizontally tileable soft white highlight band on the upper third, semi-transparent, transparent elsewhere."
- frame-portrait: "Round portrait frame: bronze ring with gold inner bead line, transparent center."
- frame-row-slip: "Horizontal nine-slice wooden slip panel with thin black lacquer border and small cord knots at both ends, flat readable center."
- btn-primary-tile: "Horizontal three-slice button plate made of golden glazed roof tiles with gold trim edges, slightly convex."
- btn-secondary-brick: "Horizontal three-slice button plate made of charcoal grey bricks with dark wood trim, slightly convex."
- btn-travel-jade: "Horizontal three-slice button plate made of green-glazed roof tiles with small gold studs at both ends, slightly convex."
- btn-danger-brick: "Horizontal three-slice button plate made of red bricks with dark wood trim, slightly convex."
- btn-segment: "Horizontal three-slice flat dark wooden tab board, subtle grain."
- btn-segment-active: "Horizontal three-slice deep navy lacquer plaque with gold frame, used as a selected tab."
- btn-round: "Round bronze disc button with raised rim and soft highlight, empty center."

처리
1. 원본 PNG: output/ui-elements/source/<id>.png
2. output/ui-elements/tools/export_ui.py를 만들어 원본을 검사하고 WebP로 변환한다.
   - 알파 채널이 있고 투명해야 할 영역의 알파가 0인지 검사
   - 원본 크기가 표와 같은지 검사
   - 프레임·질감은 손실 WebP(quality 90). 결과: assets/ui/frame/<id>.webp, assets/ui/button/<id>.webp
3. output/ui-elements/tools/build_manifest.py로 assets/ui/manifest.json을 만든다. 필드: id, file, kind(nine-slice|three-slice|fixed|repeat), cssSize{w,h}, sourceSize{w,h}, slice{top,right,bottom,left}, priority.
4. output/ui-elements/preview.html을 만들어 각 프레임을 CSS border-image로 390px·320px 폭 컨테이너 안에서 작게/크게 늘려 보여준다. 미리보기 바탕은 기획서 4.4의 --surface-wall(#efebe3)로 둔다. 버튼 바탕은 폭 120px·180px·320px으로 보여준다. 게이지는 기획서 5.8 레이어 순서(틀 안쪽 홈 → 잔상 → 채움 → 광택 → 틀 → 수치 텍스트)로 겹쳐 폭 120px·240px·358px, 채움 100%·55%·20%(위험 상태)로 보여주고, 잔상이 0.35초 늦게 줄어드는 동작을 버튼으로 시험할 수 있게 한다. 틀 안쪽 홈 위치를 manifest의 inset 필드로 기록한다.
5. 기획서 8장 검수 항목 중 이 단계에 해당하는 것을 확인하고, 파일 목록·검수 결과·기준 미달 항목을 보고한다. src/는 수정하지 않는다.
```

### 11.5 프롬프트 4 — P0 아이콘·탭 바탕·무공 두루마리

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md(특히 5.4 아이콘 규칙과 표, 6.1)를 읽어. 스타일 기준은 output/ui-elements/style-board/style-board-v1.png와 이미 만든 assets/ui/theme·frame·button 에셋이다.

목표: 기획서 5.4의 모든 표에서 우선이 P0인 아이콘 전부, 하단 탭 바탕 2종, 5.5 표의 P0 두루마리 3종을 만든다.

1. P0 아이콘
   - 대상은 5.4의 탐색·기능, 재화·재료, 능력치, 전투·진행 상태, 행동 보조, 증감·알림 표에서 우선이 P0인 id 전부다. 기획서 표에서 스크립트로 목록을 추출해 빠진 id가 없게 한다.
   - 공통 스타일 문장 뒤에 "Single game icon, centered, bold readable silhouette, consistent dark brown ink outline (#2a1d16), bronze and gold base fill with one meaning color, front view, soft top-left light, isolated on transparent background." 와 표의 모티프를 영어로 옮겨 붙인다.
   - 표의 크기가 16 이하인 아이콘은 "very simple silhouette readable at 16px, minimal inner detail"을 추가한다.
   - icon-close는 청동 원판 없이 X 표식만 만든다(원판은 btn-round를 겹쳐 쓴다).
   - 원본은 (표의 크기 × 3)px 정사각형이고, 아이콘 외곽과 캔버스 가장자리 사이에 원본 폭의 6% 이상 투명 여백을 둔다.
   - 검수 이미지 output/ui-elements/source/icon-sheet-check.png를 만든다. 모든 P0 아이콘을 16·20·24px로 축소해 흰 회벽(theme-app-wall)과 흑칠(#1c1b1d) 바탕에 각각 나열하고, 윤곽 두께·광원·시점이 같은지, icon-lock/icon-status-boss/icon-status-auto처럼 헷갈리기 쉬운 아이콘이 모양만으로 구분되는지 확인한다.
   - 무손실 WebP로 assets/ui/icon/<id>.webp에 저장한다. 원본 PNG는 output/ui-elements/source/<id>.png
2. 탭 바탕(글자·아이콘 없음)
   - tab-bg(흑칠 목재 판, 292×192)와 tab-bg-active(남색 현판 조각 + 금테 + 위쪽 금색 선, 292×192)를 만든다. 저장: output/ui-elements/source/
   - 탭 아이콘은 1항의 icon-tab-gong·icon-tab-gear·icon-tab-sect·icon-tab-shop을 쓴다. 탭 합성은 다음 단계에서 하므로 탭 바탕은 assets/에 넣지 않는다.
3. 무공 두루마리
   - scroll-bamboo-card: "Horizontal nine-slice card made of vertical bamboo slips tied with two cords at top and bottom, rolled bamboo slip bundles at left and right ends, warm aged bamboo color, flat readable center."
   - scroll-bamboo-card-locked: 같은 구도로 "faded desaturated bamboo, loosened cords"를 만들어 기본과 형태·slice가 같게 한다.
   - scroll-silk-picker: "Horizontal three-slice unrolled silk scroll with wooden rollers and small tassels at both ends, cream silk center."
   - 원본 크기·slice는 5.5 표를 따른다. 손실 WebP로 assets/ui/scroll/<id>.webp에 저장한다.
4. manifest.json과 preview.html에 추가한다. preview에는 6.1 표의 P0 위치 예시(전투 상태 줄 아이콘+문구, 초식 카드 효과 줄의 능력치 아이콘+수치+icon-diff-up, 연마 버튼의 icon-action-train과 재화 아이콘 비용 줄, 설정 팝업 효과음 줄)를 함께 보여준다. 두루마리는 폭 320px·358px, 높이 140px·200px로 늘려 본다.
5. 검수 결과와 기준 미달 항목을 보고한다. src/는 수정하지 않는다.
```

### 11.6 프롬프트 5 — P0 라벨·제목·태그·탭 합성

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md(3장, 5.3, 5.7, 7장 4항)를 읽어.

목표: 폰트 합성 스크립트로 P0 고정 문구 이미지를 만든다. 대상은 5.7 표에서 우선이 P0인 label-*, title-*, tag-* 전부와 5.3의 탭 8장이다.

1. 폰트
   - SIL Open Font License 한글 폰트 Nanum Brush Script와 Nanum Myeongjo를 공식 배포처에서 받아 output/ui-elements/fonts/에 두고 라이선스 파일(OFL.txt)을 함께 둔다. 받을 수 없으면 멈추고 보고한다.
   - title-*, tag-*, sign-*은 Nanum Brush Script, label-*과 탭 이름은 Nanum Myeongjo ExtraBold를 쓴다. 한자가 들어간 문구(기연(奇緣))는 Nanum Myeongjo를 쓴다.
2. 스크립트 output/ui-elements/tools/render_labels.py
   - 문구·스타일 목록을 스크립트 안의 표로 두되, 기획서 5.7 표와 id·문구가 정확히 같아야 한다.
   - 원본 배율 3배. 버튼 라벨 글자 높이 48px, 제목 60px.
   - ink 스타일: 글자 #1b1409, 윤곽 3px #f4d66e(불투명도 70%). cream 스타일: 글자 #f3e6c4, 윤곽 6px #2a1d16, 아래쪽 2px 짙은 그림자.
   - 글자 외곽 기준으로 자르고 좌우 18px, 위아래 9px 투명 여백을 둔다.
   - 모든 글자가 폰트에 있는지 검사하고, 없으면 실패로 처리한다.
   - 결과: output/ui-elements/source/<id>.png, 무손실 WebP assets/ui/label/<id>.webp
3. 태그(tag-tier-primary/secondary/capstone)
   - 먼저 이미지 생성으로 글자 없는 낙관 바탕 2종을 만든다(공통 스타일 문장 사용): "Small rectangular red cinnabar seal stamp shape with slightly rough inked edges, empty center"(primary·secondary 공용), "Small rectangular dark crimson seal stamp with thin gold border, empty center"(capstone). 108×60 원본으로 맞춘다.
   - render_labels.py로 1차·2차(흰 글자 #fff8e8), 오의(금 글자 #f4d66e)를 가운데에 합성해 assets/ui/label/tag-tier-*.webp로 저장한다.
4. 탭 8장(tab-gong, tab-gong-active, tab-gear, tab-gear-active, tab-sect, tab-sect-active, tab-shop, tab-shop-active)
   - output/ui-elements/source/의 tab-bg·tab-bg-active 위에 icon-tab-<key>(원본 output/ui-elements/source/icon-tab-<key>.png)를 위쪽 가운데(원본 72px)에 올리고, 아래에 무공·장비·문파·상점 글자(원본 글자 높이 36px)를 합성한다.
   - 기본: 아이콘·글자 모두 흐린 청동색(#a89a7c 계열). 선택: 아이콘 원색 + 금색(#f4d66e) 글자 + 짙은 윤곽.
   - 292×192 원본, 무손실 WebP assets/ui/tab/<id>.webp
5. manifest.json에 kind "fixed"와 text(문구) 필드로 추가한다.
6. preview.html에 조합을 추가한다: primary 바탕+ink 라벨, secondary·travel·danger 바탕+cream 라벨을 폭 120px·180px·320px에서, 팝업 현판 위 제목, 탭 바 위 탭 4개(하나는 선택), 죽간 카드 위 단계 태그.
7. 문구 오탈자(표와 한 글자라도 다른지), 320px 폭에서 가장 긴 P0 라벨이 버튼에 들어가는지, 대비를 확인해 보고한다. src/는 수정하지 않는다.
```

### 11.7 프롬프트 6 — P1 에셋

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md를 읽어. 스타일 기준은 승인된 스타일 보드와 assets/ui/의 P0 에셋이다. P0에서 만든 output/ui-elements/tools/ 스크립트를 재사용한다.

목표: 기획서 5.1·5.4·5.5·5.7·5.8 표에서 우선이 P1인 항목 전부를 만든다. 5.6 테마 배경은 프롬프트 2에서 이미 만들었으므로 제외한다.

1. 그림 생성(글자 없음, 공통 스타일 문장 사용)
   - frame-banner-silk, frame-toast-note
   - 5.4의 모든 표에서 우선이 P1인 아이콘 전부. 프롬프트 4의 아이콘 규칙·크기·검수 이미지 방식을 그대로 쓰고, 기존 P0 아이콘과 나란히 놓아 윤곽·광원·시점이 같은지 확인한다.
     · 장비 슬롯 아이콘 8종은 같은 청동색 단일 톤 실루엣 + 금색 포인트로 통일하고 등급 색을 넣지 않는다. icon-charm의 붓 획은 읽을 수 있는 글자가 아닌 문양으로 그린다.
   - frame-gauge-sect, fill-sect(5.8 표)
   - scroll-parchment-dialog, panel-armory, frame-slot, panel-gacha-card-back, panel-stage-map
   - panel-tower-gate: "Wide panel of a tiered pagoda tower silhouette rising through mist, ink wash tone, lower third left empty for text."
   - panel-offline-night: "Wide panel of a moonlit pavilion with hanging lanterns at night, calm ink wash tone, center area left empty for text."
   - frame-grade-하품·중품·상품·절품·신품·선품: frame-slot과 같은 형태·slice를 쓰고 오른쪽 위 보석 1개와 안쪽 얇은 선만 등급색으로 다르게 한다. 보석·선 영역을 가진 기본 1장을 생성한 뒤, src/game/gradeData.ts의 GRADE_COLOR 값으로 스크립트가 색을 입혀 6장을 만든다.
   - sign-sect-qingyun 바탕: "Wide deep navy lacquer signboard plaque with ornate gold frame and small cloud carvings, empty center"
   - sign-shop-elixir 바탕: "Wide weathered wooden apothecary signboard with dark red lacquer edges and hanging cords, empty center"
   - sign-tower 바탕: sign-sect-qingyun과 같은 남색 현판 바탕을 재사용한다(새로 생성하지 않는다).
2. 합성
   - 5.7 표의 P1 label-*, title-*, section-*을 render_labels.py로 만든다.
   - sign-sect-qingyun(청운문, 금 글자 #f4d66e, Nanum Brush Script), sign-tower(수련탑, 같은 금 글자·바탕), sign-shop-elixir(영약 교환소, ink 스타일)를 바탕 위에 합성한다. 원본 1074×216.
3. 크기·slice·저장 위치·WebP 규칙, manifest.json, preview.html 추가는 P0 단계와 같다. preview에는 장비 슬롯 9개 배치(반지 L/R은 icon-slot-ring 공유), 등급 테 6종, 문파 간판·문파 단계 게이지, 상점 간판, 대화창, 수련탑 진입 행(panel-tower-gate + sign-tower + 도전 버튼), 오프라인 팝업 머리(panel-offline-night + 제목 현판 + 보상 줄), 수련 목표 행 세 상태(받기·받음·진행 중), 6.1 표의 P1 아이콘 위치 예시를 추가한다.
4. 기획서 8장 검수 항목 전체를 확인해 파일 목록·검수 결과·기준 미달 항목을 보고한다. src/는 수정하지 않는다.
```

생성한 에셋의 게임 적용(CSS·컴포넌트 수정)은 에셋 검수 후 6장 표를 기준으로 별도 작업으로 진행한다.

## 12. 포트폴리오 보드

새 디자인 작업이 아니라 9장 작업 순서(1~7단계)를 마친 뒤 이미 나온 산출물을 조합해 외부 공개용(Behance 등)으로 정리하는 마무리 단계다. `src/`, `assets/`는 건드리지 않고 `output/ui-elements/portfolio/`에만 결과를 낸다.

### 12.1 구성

| 섹션 | 내용 | 소스 |
| --- | --- | --- |
| 커버 | 프로젝트명 + 대표 화면 캡처 1장 | 9장 5·7단계 실기기 캡처 |
| 무드보드 | 스타일 방향 요약 | 11.2 `style-board-v1.png` |
| 색 팔레트 | 역할별 색 스와치 | 2.2 |
| 아이콘 세트 | 카테고리별 아이콘 그리드 | 11.5 `icon-sheet-check.png`, 5.4 표 |
| 컴포넌트 시트 | 버튼 4종·게이지 5종·탭 기본/선택·초식 카드 기본/잠김 | `preview.html` 캡처 |
| 화면 목업 | 전투·무공·장비·문파·상점 탭, 폰 프레임 안에 배치 | 9장 5·7단계 실기기 캡처 |
| 전후 비교 | 같은 화면의 CSS 버전과 UI Element 적용 버전을 나란히 배치 | 9장 3단계(테마 적용) 착수 전 캡처 + 9장 5·7단계 캡처 |

### 12.2 폰 프레임

목업의 폰 테두리는 이미지 생성 없이 만든다. 실기기 캡처를 감싸는 단순한 사각 모서리 프레임(그림자만 CSS/합성 스크립트로 추가)을 쓰고, 특정 제조사 기기 외형을 모사하지 않는다.

### 12.3 제작 절차

1. 9장 3단계(테마 적용) 착수 **전**에 전후 비교용으로 CSS 전용 버전 화면 캡처(320/390/430px)를 미리 찍어 `output/ui-elements/portfolio/before/`에 보관한다. 이미 지난 시점이라 캡처가 없으면 전후 비교 섹션은 제외한다.
2. 9장 5·7단계 검수 캡처를 `output/ui-elements/portfolio/after/`에 모은다.
3. 정리 스크립트 `output/ui-elements/tools/build_portfolio.py`로 12.1 표의 섹션을 세로로 이어 붙인 프레젠테이션 이미지 1장 이상을 만든다. 폰 프레임은 12.2 규칙을 따르고, 글자(제목·구간 라벨)는 5.7과 같은 방식으로 폰트 합성한다.
4. 결과는 `output/ui-elements/portfolio/board-01.png`부터 순번으로 저장한다. 외부 공유 여부와 채널(Behance 등)은 이 문서 범위 밖이며 별도로 결정한다.

### 12.4 검수 기준

- [ ] 12.1의 모든 섹션이 실제 게임 화면·에셋에서 나온 캡처이며, 새로 그려 넣은 가짜 화면이 없다.
- [ ] 전후 비교 섹션은 같은 화면·같은 해상도로 찍은 캡처 쌍만 쓴다.
- [ ] 프레젠테이션 이미지의 글자에 오탈자·가짜 한자가 없다.
- [ ] `src/`, `assets/`를 수정하지 않았다.
