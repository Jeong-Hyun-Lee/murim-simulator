# UI 테마 에셋 적용 작업 지시

## 목표

`assets/ui/theme/`의 검수된 에셋 4종을 기존 게임의 테마 레이어로 적용한다. 화면 구조, React 상태 처리, 스크롤, 팝업 초점 처리와 전투 캔버스 동작은 바꾸지 않는다.

## 먼저 읽을 파일

- `AGENTS.md`
- `wiki/concepts/UI-Element-대체-기획서.md` 2.4, 3, 4.3, 4.4, 5.6, 6, 8장
- `assets/ui/manifest.json`
- `src/style.css`

## 적용 범위

`src/style.css`만 수정한다. `src/App.tsx`와 게임 로직은 수정하지 않는다.

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
