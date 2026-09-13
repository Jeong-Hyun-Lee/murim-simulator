#!/usr/bin/env bash
# 기획안 비교 실행 — 시드 3개의 대10/15/20/25/30 최초 클리어 시각(전투 시간)과 벽 위치 요약.
# 사용: bash output/balance-sim/run.sh "라벨" KEY=VAL ...
label="$1"; shift
for seed in 1 2 3; do
  echo "[$label] seed$seed: $(env "$@" SEED=$seed SUMMARY=1 node "$(dirname "$0")/sim.cjs")"
done
