---
type: concept
tags: [UI, UI-Element, 비주얼디자인, 모바일, 에셋, 코덱스]
created: 2026-09-16
updated: 2026-09-16
sources: []
---

# UI Element 대체 기획서

CSS 색·테두리·그라데이션만으로 그린 현재 UI를 **게임 UI 이미지 요소(UI Element)**로 바꾸는 기획이다. 화면 구조·기능·상태 판정은 [[모바일-UX-개선-기획서]]의 현재 구현을 그대로 두고, 표면(패널·버튼·탭·팝업·아이콘·고정 문구)을 이미지로 교체하며, 앱 테마 배경과 색 토큰을 레퍼런스의 흰 회벽·먹색 기와 대비로 바꾼다(2.4, 4.4). [[모바일-디자인-에셋-제작-명세]]의 공통 UI·조작 아이콘·장비/무공/문파/상점 그림 항목을 실제 제작 단위로 구체화하며, UI 표면의 표현 규칙은 이 문서를 따른다. UI Element 이미지 생성은 코덱스가 11장의 프롬프트로 수행한다.

## 1. 원칙

1. **동적 데이터는 텍스트, 고정 표시는 에셋.** 게임 상태에 따라 바뀌는 수치·이름·상태 문구는 HTML 텍스트로 쓰고, 항상 같은 탭 이름·버튼 문구·팝업 제목·단계 태그·기능 표식은 이미지에 포함한다(3장).
2. **기능 표식은 글자 대신 아이콘.** 닫기는 X 표식, 뒤로는 화살 표식, 설정은 원판 표식처럼 아이콘 버튼으로 바꾼다. 이미지 버튼에도 `aria-label`로 같은 뜻의 이름을 남긴다.
3. **레이아웃은 그대로.** React 컴포넌트 구조·클래스·스크롤·안전 영역·팝업 초점 처리는 유지하고, CSS의 배경·테두리를 이미지로 바꾼다. 이미지가 로드되지 않아도 현재 CSS 색으로 읽힐 수 있게 둔다.
4. **글자는 생성 모델에 맡기지 않는다.** 이미지 생성 모델은 한글·한자 글자를 틀리게 그리기 쉽다. 생성 단계에서는 글자 없는 바탕·질감·아이콘만 만들고, 고정 문구는 폰트 합성 스크립트로 이미지에 넣는다(7장).
5. **캐릭터·배경보다 튀지 않는다.** UI 장식은 테두리·모서리·질감에 두고, 전투 무대와 SD 페인터리 캐릭터가 화면의 주인공이 되게 한다.

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

### 4.4 테마 배경·색 토큰 CSS 대체 계획

현재 `src/style.css`는 `body` `#0c0b09`, `#app` 금빛 방사 그라데이션 + `--ink` `#15130f`의 먹갈색 테마다. 색은 hex 341곳·rgba 123곳에 직접 쓰여 있고 `var(--…)` 토큰 사용은 약 100곳뿐이라, 토큰 값만 바꿔서는 테마가 바뀌지 않는다. 아래 순서로 대체한다.

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
| `frame-bar` | 청동 게이지 테두리 | 3-slice | 200×20 → 400×40 | 좌우 24 | `.bar`, `.hp-bar`, `.exp-bar` | P0 |
| `fill-bar-hp` | 붉은 옻칠 광택 채움 | 가로 반복 | 32×12 → 64×24 | – | `.hp-bar .bar-fill` | P0 |
| `fill-bar-exp` | 옥색 채움 | 가로 반복 | 32×12 → 64×24 | – | `.exp-bar .bar-fill` | P0 |
| `fill-bar-sect` | 청색 비단 채움 | 가로 반복 | 32×12 → 64×24 | – | 문파 단계 게이지 | P1 |
| `frame-banner-silk` | 붉은 비단 띠 + 양끝 매듭 | 3-slice | 360×48 → 720×96 | 좌우 72 | `.banner`, `.banner-done` | P1 |
| `frame-toast-note` | 한지 쪽지 + 붓 자국 가장자리 | 9-slice | 96×64 → 192×128 | 32 | `Toast` | P1 |
| `frame-portrait` | 둥근 청동·금 테 초상 틀 | 고정 | 40×40 → 120×120 | – | `.header-portrait` | P0 |

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

| id | 모티프 | CSS 크기 → 원본 | 적용 | 우선 |
| --- | --- | --- | --- | --- |
| `icon-close` | 붓으로 그은 X 두 획(청동 원판 위에 올림) | 24 → 72 | `Sheet` 닫기, 뽑기 결과 닫기 | P0 |
| `icon-back` | 왼쪽을 향한 화살촉 | 24 → 72 | `FullView` 뒤로 | P0 |
| `icon-settings` | 팔괘 나침판 원판 | 24 → 72 | 상단 설정 | P0 |
| `icon-lock` | 청동 자물통 | 24 → 72 | 잠긴 탭·잠긴 초식·잠김 팝업 | P0 |
| `icon-dropdown` | 아래로 늘어진 매듭 끈 | 16 → 48 | 사냥터 선택, 보드 선택기 | P0 |
| `icon-badge` | 작은 홍등(단풍 주황) | 12 → 36 | 새로 열림 | P0 |
| `icon-gold` | 네모 구멍 엽전 | 20 → 60 | 전(錢) | P0 |
| `icon-chi` | 청백색 기운이 도는 단전 불꽃 | 20 → 60 | 내공 | P0 |
| `icon-elixir` | 붉은 마개 도자기 약병 | 20 → 60 | 영약 | P0 |
| `icon-contribution` | 청운문 옥패 | 20 → 60 | 기여도 | P0 |
| `icon-stones` | 푸른 광석 조각 | 20 → 60 | 강화석 | P0 |
| `icon-charm` | 붉은 글씨 노란 부적 | 20 → 60 | 보호부적 | P1 |
| `icon-slot-weapon` | 직검 | 32 → 96 | 장비 슬롯 무기 | P1 |
| `icon-slot-body` | 가죽 갑주 | 32 → 96 | 몸통 | P1 |
| `icon-slot-head` | 두건 | 32 → 96 | 머리 | P1 |
| `icon-slot-arm` | 완갑 | 32 → 96 | 팔 | P1 |
| `icon-slot-foot` | 경신화 | 32 → 96 | 발 | P1 |
| `icon-slot-waist` | 요대 | 32 → 96 | 허리 | P1 |
| `icon-slot-neck` | 옥 목걸이 | 32 → 96 | 목 | P1 |
| `icon-slot-ring` | 지환(반지) — L/R 공용 | 32 → 96 | 손가락 L·R | P1 |
| `icon-gacha` | 붉은 실로 묶인 점괘 죽통 | 48 → 144 | 기연 | P1 |
| `icon-rebirth` | 불사조 깃 원형 문양 | 48 → 144 | 환골탈태 | P1 |

무공 보드 7종의 식별 표식은 보드 기획이 바뀔 수 있어 이 목록에서 제외하고, [[모바일-디자인-에셋-제작-명세]]의 무공 항목에서 별도로 산정한다. `icon-charm`의 부적 글씨는 읽을 수 있는 글자가 아닌 붓 획 문양으로만 그린다.

### 5.5 특수 배경·간판 (원본 2배)

| id | 그룹 | 모티프 | 형태 | 크기 | slice | 적용 | 우선 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scroll-bamboo-card` | `scroll` | 죽간 두루마리: 세로 대나무 조각을 위아래 끈으로 엮고 좌우 끝에 말린 죽간 | 9-slice | 358×180 → 716×360 | 좌우 72, 위아래 40 | `.gong-card` | P0 |
| `scroll-bamboo-card-locked` | `scroll` | 같은 죽간이 빛바래고 끈이 풀린 상태 | 9-slice | 358×180 → 716×360 | 동일 | `.gong-card-locked` | P0 |
| `scroll-silk-picker` | `scroll` | 비단 두루마리 가로 펼침 + 양끝 목재 축 | 3-slice | 358×64 → 716×128 | 좌우 80 | `.board-picker-btn` | P0 |
| `scroll-parchment-dialog` | `scroll` | 한지 두루마리 대화창, 위아래 말린 가장자리 | 9-slice | 256×160 → 512×320 | 위아래 64, 좌우 40 | `StoryCutscene`, `OnboardingFlow`, `.story-intro` | P1 |
| `panel-armory` | `panel` | 무기고 목재 벽 + 무기걸이 + 격자창 | 고정 | 358×200 → 716×400 | – | 장비 페이퍼돌 영역 | P1 |
| `frame-slot` | `frame` | 청동 테 장비 슬롯 | 9-slice | 80×36 → 160×72 | 24 | 장비 슬롯 버튼 | P1 |
| `frame-grade-하품` ~ `frame-grade-선품` (6종) | `frame` | 슬롯 테두리에 등급색 보석 1개 + 등급색 안쪽 선 | 9-slice | 80×36 → 160×72 | 24 | 등급별 슬롯·소지품 카드 | P1 |
| `panel-gacha-card-back` | `panel` | 금박 운문 카드 뒷면 | 고정 | 72×96 → 144×192 | – | 기연 결과 공개 전 | P1 |
| `panel-stage-map` | `panel` | 지도 두루마리 조각 | 9-slice | 358×56 → 716×112 | 48 | 사냥터 선택 대스테이지 행 | P1 |

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
| `tag-tier-primary` | 1차 | 흰 글자 | 붉은 낙관 | 초식 카드 단계 | P0 |
| `tag-tier-secondary` | 2차 | 흰 글자 | 붉은 낙관 | 초식 카드 단계 | P0 |
| `tag-tier-capstone` | 오의 | 금 글자 | 짙은 붉은 낙관 + 금테 | 초식 카드 단계 | P0 |
| `sign-sect-qingyun` | 청운문 | 금 글자 | 남색 현판 전체(글자 포함 간판) | `SectPanel` 소속 카드 머리 | P1 |
| `sign-shop-elixir` | 영약 교환소 | ink | 약방 목패 전체(글자 포함 간판) | `ShopPanel` | P1 |

`tag-*`, `sign-*`은 낙관·현판·목패 그림을 생성하고 그 위에 폰트로 글자를 합성한 한 장짜리 이미지다. 태그 크기는 36×20 → 108×60, 간판은 358×72 → 1074×216이다.

## 6. 화면별 적용 계획

| 화면·컴포넌트 | 교체할 표면 | 에셋 | 텍스트로 남길 것 |
| --- | --- | --- | --- |
| `body`·`#app` | 앱 바탕, 넓은 화면 바깥, 섹션 구분선, 색 토큰 | `theme-app-wall`, `theme-wall-ink-branch`, `theme-outer-landscape`, `theme-divider-ink`, 4.4 토큰 | 모든 동적 텍스트(영역별 글자 토큰) |
| `AppHeader` | 신분줄 배경, 초상 틀, 재화 칩 아이콘, 설정 버튼 | `frame-header-eave`, `frame-portrait`, `icon-gold/chi/elixir/contribution/stones`, `btn-round`+`icon-settings` | 도호, 경지, 재화 수치, 재화 이름 |
| `TabBar` | 탭바 배경, 4탭 | `frame-tabbar`, `tab-*`, `icon-lock`, `icon-badge` | 없음(`aria-label` 유지) |
| `BattleSummaryBar` | 요약줄 | `frame-summary-strip`, `label-battle-view` | 스테이지, 전투 상태 |
| `BattleTab` | 전투 무대 액자, 체력·경험치 게이지, 사냥터·등반 버튼, 보스 카드 | `frame-battle-stage`, `frame-bar`, `fill-bar-*`, `label-stage`, `label-climb`, `label-boss-challenge`, `label-keep-training`, `label-continue` | 적·보스 이름, 체력 수치, 레벨, 전투력, 보상 |
| `Sheet` | 팝업 틀, 제목 현판, 닫기 | `frame-popup`, `frame-title-plaque` 또는 `title-*`, `btn-round`+`icon-close` | 동적 제목(`title-*`가 없는 경우), 본문 |
| `FullView` | 뒤로 버튼 | `btn-round`+`icon-back` | 화면 제목 |
| `SettingsSheet` | 버튼 | `btn-primary-tile`+`label-pause/resume`, `btn-secondary-brick`+`label-sfx-on/off`, `title-settings` | 진행 중·일시정지 상태 |
| `CurrencySheet` | 목록 아이콘 | `icon-*`, `icon-charm`, `title-currency` | 재화 이름·용도·수치 |
| `LockedTabSheet` | 잠김 표식·제목 | `icon-lock`, `title-locked-*` | 해금 조건, 진행 위치 |
| `GongPanel` | 보드 선택기, 초식 카드, 단계 태그, 연마 버튼 | `scroll-silk-picker`, `icon-dropdown`, `scroll-bamboo-card(-locked)`, `tag-tier-*`, `label-train-once`, `label-train`, `frame-banner-silk` | 보드 이름·진행도, 초식 이름·레벨, 효과 수치, 비용, `{n}회`, 해금 조건 |
| `GearPanel` | 무기고 배경, 슬롯, 등급 테, 섹션 제목, 버튼 | `panel-armory`, `frame-slot`, `frame-grade-*`, `icon-slot-*`, `section-*`, `label-equip-best` 외 장비 라벨 | 장비 이름·등급명·강화 수치·능력치 비교·개수 |
| `SectPanel` | 소속 간판, 카드, 게이지, 기부 버튼 | `sign-sect-qingyun`, `frame-panel-hanji`, `fill-bar-sect`, `section-donate`, `label-donate-*`, `label-sect-board` | 문파 레벨·특전·기여도 수치·환산 비율 |
| `ShopPanel`·`GachaPanel` | 소탭, 간판, 상품 카드, 뽑기 버튼, 카드 뒷면 | `btn-segment(-active)`, `label-subtab-*`, `sign-shop-elixir`, `icon-elixir`, `label-gacha-*`, `panel-gacha-card-back`, `icon-gacha` | 비용·보유 전·잔액·확률표·결과 등급과 이름 |
| `StagePicker` | 대스테이지 행 | `panel-stage-map`, `label-climb` | 대 번호·지명·보스 이름·소스테이지 번호 |
| `RebirthView`·`MyInfoView` | 섹션 제목, 버튼, 문양 | `section-*`, `title-rebirth-*`, `label-rebirth-*`, `icon-rebirth` | 조건·유지/초기화 항목·능력치 |
| `OnboardingFlow`·`StoryCutscene` | 대화창, 버튼 | `scroll-parchment-dialog`, `label-next`, `label-skip`, `label-continue`, `label-use-default` | 대사, 도호 입력 |
| `Toast` | 쪽지 | `frame-toast-note` | 알림 문구 |

## 7. 제작 파이프라인

1. **스타일 보드(승인 게이트).** 코덱스가 버튼 4종·패널·팝업·탭·아이콘 5종을 한 화면에 모은 무드 보드 1장을 생성한다. 사용자가 색·질감·장식 밀도를 승인하기 전에는 개별 에셋을 대량 생성하지 않는다.
2. **글자 없는 그림 생성.** 5.1~5.6의 프레임·버튼 바탕·아이콘·두루마리·간판 바탕·테마 배경을 이미지 생성으로 만든다. 글자·숫자·가짜 한자를 그리지 않게 한다.
3. **정리 스크립트.** 배경 제거, 원본 크기 맞춤, 9-slice 모서리·변 정렬 확인, WebP 변환을 스크립트로 처리한다. 원본 PNG는 `output/ui-elements/source/`, 결과는 `assets/ui/<그룹>/`에 둔다.
4. **라벨 합성 스크립트.** 5.7의 문구를 폰트로 그려 `ink`/`cream` 스타일로 저장하고, `tag-*`·`sign-*`·`tab-*`은 생성한 바탕 그림 위에 글자를 합성한다.
   - 폰트는 SIL Open Font License 한글 폰트를 쓴다. 제목·태그·간판은 붓글씨 계열(Nanum Brush Script), 버튼 라벨·탭 이름과 한자가 섞인 문구는 명조 계열(Nanum Myeongjo)을 기본으로 한다. 폰트 파일과 라이선스 파일을 `output/ui-elements/fonts/`에 함께 둔다.
   - 합성 후 모든 글자가 폰트에 있는지(빈 네모 없음) 검사한다.
5. **매니페스트.** `assets/ui/manifest.json`에 `id`, `file`, `kind`(`nine-slice`·`three-slice`·`fixed`·`repeat`), `cssSize`, `sourceSize`, `slice`, `text`(라벨 문구), `priority`를 기록한다.
6. **미리보기 검수.** `output/ui-elements/preview.html`에서 390px·320px 폭 기준으로 9-slice 프레임을 여러 크기로 늘려 보고, 버튼 바탕+라벨 조합과 탭 선택 상태를 확인한다.
7. **게임 적용.** 4.4의 토큰 정리·값 교체·배경 레이어를 먼저 적용하고, 매니페스트와 6장 표를 기준으로 CSS·컴포넌트를 바꾼다. 에셋 승인 후 별도로 진행한다.

## 8. 검수 기준

- [ ] 모든 에셋이 실제 알파 PNG 원본과 WebP 결과를 가지며, 투명해야 할 영역의 알파가 0이다.
- [ ] 생성 그림에 글자·숫자·가짜 한자·워터마크가 없다. 모든 글자는 5.7 라벨 합성으로 들어갔고, 문구가 표와 한 글자도 다르지 않다.
- [ ] 9-slice·3-slice 에셋을 가로 2배·세로 2배로 늘려도 모서리 장식이 찌그러지지 않고 변의 이음매가 보이지 않는다.
- [ ] 라벨·동적 텍스트가 바탕 가운데에서 명암 대비 4.5:1 이상으로 읽힌다.
- [ ] 320px 폭에서 가장 긴 라벨(`환골탈태 화면 열기`, `확률 정보 보기`)이 버튼 안에 들어가고 16px 글자 높이를 유지한다.
- [ ] 같은 역할(주요·보조·이동·위험)의 버튼이 모든 화면에서 같은 바탕을 쓴다. 금색 바탕은 주요 행동에만 쓴다.
- [ ] 탭 기본/선택, 소탭 기본/선택, 초식 카드 기본/잠김이 색만이 아니라 모양·밝기로도 구분된다.
- [ ] 등급 프레임 6종의 색이 `GRADE_COLOR`와 같고, 등급명 텍스트와 함께 쓰인다.
- [ ] 이미지 버튼마다 `aria-label` 또는 화면 밖 텍스트가 있다.
- [ ] P0 에셋 전체 용량이 1MB 이하다.
- [ ] 흰 회벽 바탕 위 본문 글자·보조 글자·증감색이 4.4의 대비 기준을 넘고, 검은 영역 안에서는 on-ink 글자 토큰으로 바뀐다.
- [ ] `theme-app-wall`을 이어 붙였을 때 이음매가 보이지 않고, 먹 가지 장식이 카드·목록 글자 뒤에 오지 않는다.
- [ ] 휴대폰 폭에서는 `theme-outer-landscape`를 내려받지 않는다.
- [ ] 이미지를 불러오지 못해도 토큰 색만으로 흰/검 명도 구조와 글자가 읽힌다.
- [ ] 레퍼런스의 건물·문양을 그대로 옮기지 않았고, SD 페인터리 캐릭터·전투 배경과 나란히 놓았을 때 톤이 어긋나지 않는다.

## 9. 작업 순서

| 단계 | 범위 | 완료 조건 |
| --- | --- | --- |
| 1 | 스타일 보드(흰 회벽 바탕에서 검수) | 사용자 승인 |
| 2 | P0 에셋: 공통 프레임·띠, 버튼 바탕, P0 테마 배경, 하단 탭, P0 아이콘, 무공 죽간·비단, P0 라벨·제목·태그 | 매니페스트·미리보기·검수 통과 |
| 2a | 4.4 토큰 정리(화면 변화 없음) | 적용 전후 스크린샷 동일, lint·빌드 통과 |
| 3 | P0 게임 적용: 4.4 토큰 값 교체·배경 레이어, 헤더·탭바·요약줄·팝업·설정·재화·잠김·전투 탭·무공 탭 | 320/390/430px 실기기 확인, 대비 검사 |
| 4 | P1 에셋: 장비·문파·상점·기연·환골탈태·스테이지 선택·스토리·토스트 | 매니페스트·미리보기·검수 통과 |
| 5 | P1 게임 적용 | 모든 탭과 팝업에서 같은 역할의 표면이 일관 |

## 10. 코덱스 작업 규칙

- 저장소 루트의 `AGENTS.md`와 이 문서를 먼저 읽는다.
- 이 기획 범위에서 `src/`의 코드와 `src/style.css`는 수정하지 않는다. 스크립트는 `output/ui-elements/tools/`에 둔다.
- 생성 결과가 목록의 크기·slice·투명도·문구를 지키지 못하면 후보로만 두고 `assets/ui/`에 넣지 않는다.
- 작업이 끝나면 생성한 파일 목록, 검수 결과, 기준을 못 지킨 항목을 보고한다.

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

### 11.3 프롬프트 2 — P0 프레임·띠·버튼 바탕

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md를 읽어. 승인된 스타일 보드는 output/ui-elements/style-board/style-board-v1.png이다. 이 보드의 색·질감·장식 밀도를 기준으로 맞춘다.

목표: 기획서 5.1 표에서 우선이 P0인 항목 전체와 5.2 표의 버튼 바탕 7종을 만든다.

규칙
- 모든 이미지 생성 요청 앞에 기획서 11.1 공통 스타일 문장을 붙인다.
- 각 에셋은 표의 원본 크기로 저장한다. 생성 해상도가 다르면 전체를 한 번 같은 비율로 맞추고, 필요하면 투명 여백으로 캔버스를 맞춘다. 가로세로 비율을 바꿔 늘리지 않는다.
- 9-slice/3-slice 에셋은 표의 slice 값 안쪽에만 모서리 장식을 둔다. 변 구간은 늘려도 이음매가 안 보이는 곧은 목재결·기와줄·벽돌 줄눈으로, 가운데 구간은 글자가 올라가도 읽히게 무늬를 약하게 만든다.
- 버튼 바탕은 좌우 끝 slice(원본 40px) 안에 장식을 두고 가운데는 가로로 늘릴 수 있게 한다. 위아래 볼록한 입체감은 유지한다.
- 반복 채움(fill-bar-*)은 좌우 끝이 이어지게 만든다.
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
- frame-bar: "Horizontal three-slice gauge frame: bronze rim with rounded end caps, transparent inner channel."
- fill-bar-hp: "Seamless horizontally tileable glossy red lacquer gauge fill strip."
- fill-bar-exp: "Seamless horizontally tileable soft jade green gauge fill strip."
- frame-portrait: "Round portrait frame: bronze ring with gold inner bead line, transparent center."
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
4. output/ui-elements/preview.html을 만들어 각 프레임을 CSS border-image로 390px·320px 폭 컨테이너 안에서 작게/크게 늘려 보여준다. 미리보기 바탕은 기획서 4.4의 --surface-wall(#efebe3)로 둔다. 버튼 바탕은 폭 120px·180px·320px으로 보여준다.
5. 기획서 8장 검수 항목 중 이 단계에 해당하는 것을 확인하고, 파일 목록·검수 결과·기준 미달 항목을 보고한다. src/는 수정하지 않는다.
```

### 11.4 프롬프트 3 — 테마 배경

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md(2.4, 4.4, 5.6장)를 읽어. 스타일 기준은 승인된 output/ui-elements/style-board/style-board-v1.png와 assets/ui/frame·button 에셋이다.

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
5. manifest.json에 추가하고(kind: repeat|fixed|three-slice), preview.html의 바탕을 theme-app-wall로 바꾼다. 390px 폭 앱 기둥 오른쪽 위에 theme-wall-ink-branch, 넓은 화면 바깥에 theme-outer-landscape를 깔고, 그 위에 frame-panel-hanji 카드와 먹색 본문 글자(#1f1d1b), frame-header-eave·frame-tabbar를 올려 흰/검 명도 구조를 확인한다.
6. 기획서 8장의 테마 관련 검수 항목을 확인해 보고한다. src/는 수정하지 않는다.
```

### 11.5 프롬프트 4 — P0 아이콘·탭 그림·무공 두루마리

```text
저장소: D:\dev\murim-simulator
AGENTS.md와 wiki/concepts/UI-Element-대체-기획서.md를 읽어. 스타일 기준은 output/ui-elements/style-board/style-board-v1.png와 이미 만든 assets/ui/frame·button 에셋이다.

목표: 기획서 5.4 표의 P0 아이콘, 5.5 표의 P0 두루마리 3종, 하단 탭용 글자 없는 바탕·아이콘 그림을 만든다.

1. P0 아이콘(icon-close, icon-back, icon-settings, icon-lock, icon-dropdown, icon-badge, icon-gold, icon-chi, icon-elixir, icon-contribution, icon-stones)
   - 공통 스타일 문장 뒤에 "Single game icon, centered, bold readable silhouette at 24px, dark brown outline, bronze and gold accents, isolated on transparent background." 와 표의 모티프를 영어로 붙인다.
   - icon-close는 청동 원판 없이 X 표식만 만든다(원판은 btn-round를 겹쳐 쓴다).
   - 원본은 표의 원본 크기 정사각형이고, 아이콘 외곽과 캔버스 가장자리 사이에 원본 폭의 6% 이상 투명 여백을 둔다.
   - 모든 아이콘은 같은 윤곽선 두께·광원·시점을 쓴다. 한 장에 모은 비교 이미지 output/ui-elements/source/icon-sheet-check.png를 만든다.
   - 무손실 WebP로 assets/ui/icon/<id>.webp에 저장한다.
2. 탭 그림(글자 없음)
   - tab-art-gong(검), tab-art-gear(갑주), tab-art-sect(문파 전각), tab-art-shop(약방 목패)을 아이콘 규칙으로 144×144 원본으로 만든다. 저장: output/ui-elements/source/tab-art-<key>.png
   - 탭 바탕 tab-bg(짙은 목재 판, 292×192)와 tab-bg-active(남색 현판 조각 + 금테 + 위쪽 금색 선, 292×192)를 만든다. 저장: output/ui-elements/source/
   - 글자 합성은 다음 단계에서 하므로 여기서는 assets/에 넣지 않는다.
3. 무공 두루마리
   - scroll-bamboo-card: "Horizontal nine-slice card made of vertical bamboo slips tied with two cords at top and bottom, rolled bamboo slip bundles at left and right ends, warm aged bamboo color, flat readable center."
   - scroll-bamboo-card-locked: 같은 구도로 "faded desaturated bamboo, loosened cords"를 만들어 기본과 형태·slice가 같게 한다.
   - scroll-silk-picker: "Horizontal three-slice unrolled silk scroll with wooden rollers and small tassels at both ends, cream silk center."
   - 원본 크기·slice는 5.5 표를 따른다. 손실 WebP로 assets/ui/scroll/<id>.webp에 저장한다.
4. manifest.json과 preview.html에 추가한다. 두루마리는 폭 320px·358px, 높이 140px·200px로 늘려 본다.
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
   - output/ui-elements/source/의 tab-bg·tab-bg-active 위에 tab-art-<key>를 위쪽 가운데(원본 72px)에 올리고, 아래에 무공·장비·문파·상점 글자(원본 글자 높이 36px)를 합성한다.
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

목표: 기획서 5.1·5.4·5.5·5.7 표에서 우선이 P1인 항목 전부를 만든다. 5.6 테마 배경은 프롬프트 3에서 이미 만들었으므로 제외한다.

1. 그림 생성(글자 없음, 공통 스타일 문장 사용)
   - fill-bar-sect, frame-banner-silk, frame-toast-note
   - icon-charm(부적의 붓 획은 읽을 수 있는 글자가 아닌 문양), icon-slot-weapon, icon-slot-body, icon-slot-head, icon-slot-arm, icon-slot-foot, icon-slot-waist, icon-slot-neck, icon-slot-ring, icon-gacha, icon-rebirth
     · 장비 슬롯 아이콘 8종은 같은 청동색 단일 톤 실루엣 + 금색 포인트로 통일하고 등급 색을 넣지 않는다.
   - scroll-parchment-dialog, panel-armory, frame-slot, panel-gacha-card-back, panel-stage-map
   - frame-grade-하품·중품·상품·절품·신품·선품: frame-slot과 같은 형태·slice를 쓰고 오른쪽 위 보석 1개와 안쪽 얇은 선만 등급색으로 다르게 한다. 보석·선 영역을 가진 기본 1장을 생성한 뒤, src/game/gradeData.ts의 GRADE_COLOR 값으로 스크립트가 색을 입혀 6장을 만든다.
   - sign-sect-qingyun 바탕: "Wide deep navy lacquer signboard plaque with ornate gold frame and small cloud carvings, empty center"
   - sign-shop-elixir 바탕: "Wide weathered wooden apothecary signboard with dark red lacquer edges and hanging cords, empty center"
2. 합성
   - 5.7 표의 P1 label-*, title-*, section-*을 render_labels.py로 만든다.
   - sign-sect-qingyun(청운문, 금 글자 #f4d66e, Nanum Brush Script)과 sign-shop-elixir(영약 교환소, ink 스타일)를 바탕 위에 합성한다. 원본 1074×216.
3. 크기·slice·저장 위치·WebP 규칙, manifest.json, preview.html 추가는 P0 단계와 같다. preview에는 장비 슬롯 9개 배치(반지 L/R은 icon-slot-ring 공유), 등급 테 6종, 문파 간판, 상점 간판, 대화창을 추가한다.
4. 기획서 8장 검수 항목 전체를 확인해 파일 목록·검수 결과·기준 미달 항목을 보고한다. src/는 수정하지 않는다.
```

생성한 에셋의 게임 적용(CSS·컴포넌트 수정)은 에셋 검수 후 6장 표를 기준으로 별도 작업으로 진행한다.
