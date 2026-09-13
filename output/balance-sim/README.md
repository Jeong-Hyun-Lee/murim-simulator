# balance-sim — 진행 곡선 시뮬레이션

실제 게임 공식(`src/game/*.ts`)을 그대로 불러 자동전투 진행 시간을 추정하는 1회성 분석 도구. 결과와 해석은 `wiki/synthesis/진행-곡선-검증-시뮬레이션-2026-09-13.md`.

- `sim.ts` — 시뮬레이터. 환경 변수로 기획안(몬스터 성장률·기초치·보상·장비 곡선·신규 무공 보드)을 켠다. 기본값은 현재 코드 그대로.
- `run.sh` — 시드 3개 요약 비교: `bash output/balance-sim/run.sh "라벨" KEY=VAL ...`
- `search.cjs`, `model.cjs` — 계수 탐색(목표 시각과의 로그 오차 순위).

빌드·실행:

```bash
npx esbuild output/balance-sim/sim.ts --bundle --platform=node --outfile=output/balance-sim/sim.cjs
node output/balance-sim/sim.cjs                 # 현재 코드
bash output/balance-sim/run.sh 재조정안B MON_FROM=0 MON_BASE=1.5 MON_HP=1.5 MON_ATK=1.3333 MON_DEF=1.25 \
  REWARD_TIE=0 EXP_SCALE=0.3 GEAR_CURVE=exp GEAR_K=10 GEAR_PCT=fixed GEAR_PCT_K=5 \
  NEW_BOARDS=10 NEW_MODE=mult NEW_EFFECT=0.5 NEW_COST_DIV=10
```

가정: 기대값 전투(치명타 평균 피해), 이상적 플레이어(막히면 직전 스테이지 사냥·이길 수 있으면 즉시 복귀, 막힌 지 1시간이면 가능한 환골탈태 실행), 내공은 가장 싼 연마부터 구매, 장비는 등급·아이템 레벨 우선 장착, +10까지 자동 강화. 문파 기부·기연·오프라인 시간은 넣지 않았다.
