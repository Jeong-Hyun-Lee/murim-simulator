# murim-simulator

"무림인 키우기" — 현대에서 살던 사람이 무림으로 이세계 전이해 성장하는 방치형(idle) 캔버스 웹게임.

## 실행

```
npm install
npm run dev
```

`npm run build`로 프로덕션 빌드, `npm run preview`로 빌드 결과 미리보기, `npm test`로 게임 공식·저장 테스트 실행.

## 스택

Vite + TypeScript + React(화면·패널) + PixiJS(전투 캔버스) + zustand(게임 상태). 게임 에셋은 `assets/`에 두고 그대로 정적 서빙한다. 진행 곡선은 `output/balance-sim` 시뮬레이터로 검증한다.

## 기획

게임 기획/디자인 문서는 `wiki/`에 있다. 작업 전 `wiki/CLAUDE.md` 참고.
