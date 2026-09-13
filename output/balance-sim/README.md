# balance-sim — 진행 곡선 시뮬레이션

실제 게임 공식(`src/game/*.ts`)을 그대로 불러 자동전투 진행 시간을 추정하는 분석 도구. 결과와 해석은 `wiki/synthesis/진행-곡선-검증-시뮬레이션-2026-09-13.md`.

- `sim.ts` — 시뮬레이터. 기본값은 현재 코드 그대로이며, 새 챕터를 검토할 때 환경 변수로 가상 조건을 켠다.
- `run.sh` — 시드 3개 요약: `bash output/balance-sim/run.sh "라벨" KEY=VAL ...`

빌드·실행:

```bash
npx esbuild output/balance-sim/sim.ts --bundle --platform=node --outfile=output/balance-sim/sim.cjs
node output/balance-sim/sim.cjs                                  # 현재 코드, 상세 이정표
bash output/balance-sim/run.sh 현재코드                            # 시드 3개 요약
bash output/balance-sim/run.sh 챕터4기획 FINAL_MAJOR=40 MON_HP=1.6 MON_ATK=1.4 MON_DEF=1.3 EXTRA_BOARDS=5 EXTRA_GATES=35,40
```

환경 변수: `SEED`, `FINAL_MAJOR`, `HOUR_CAP`, `WALL_HOURS`, `MON_FROM`(이 대스테이지 이후에만 아래 성장률 적용, 기본 30), `MON_HP`/`MON_ATK`/`MON_DEF`(대스테이지당 성장률, 기본 1.5/1.333/1.25), `MON_BASE`(몬스터 기초치 배수), `EXP_SCALE`(경험치 배수), `EXTRA_BOARDS`(코드 마지막 챕터 보드 다음부터 두 대스테이지마다 가상 곱연산 보드 N개), `EXTRA_COST`(가상 보드 비용 배수), `EXTRA_GATES`(8회차부터의 환골탈태 게이트, 예: `35,40`), `SUMMARY`/`JSON`(출력 형식).

가정: 기대값 전투(치명타 평균 피해), 이상적 플레이어(막히면 직전 스테이지 사냥·이길 수 있으면 즉시 복귀, 막힌 지 1시간이면 가능한 환골탈태 실행), 내공은 가장 싼 연마부터 구매, 장비는 등급·아이템 레벨 우선 장착, +10까지 자동 강화. 문파 기부·기연·오프라인 시간은 넣지 않았다. 대31 이후를 볼 때는 `combat.ts`의 `FINAL_MAJOR`가 30이므로 시뮬레이터의 `FINAL_MAJOR`만 올리면 된다(이름이 없는 스테이지도 수치는 계산된다).
