// 부드러운 진행 곡선 탐색 — 조합마다 sim.cjs를 실행해 목표 시각과의 로그 오차로 순위를 매긴다.
// 실행: node output/balance-sim/search.cjs
const { execFile } = require('child_process');
const path = require('path');

const TARGET = { 5: 0.3, 10: 1.5, 15: 4, 20: 8, 25: 14, 30: 22 };
const combos = [];
for (const hp of [1.35, 1.45, 1.55, 1.65])
  for (const atkR of [0.7, 0.85])
    for (const base of [1, 2, 4])
      for (const eff of [1, 2, 3])
        for (const gk of [10, 20])
          combos.push({ hp, atk: +(1 + (hp - 1) * atkR).toFixed(3), def: +(1 + (hp - 1) * atkR * 0.85).toFixed(3), base, eff, div: 10, gk });

const runOne = (c) =>
  new Promise((resolve) => {
    const env = {
      ...process.env, JSON: '1', SEED: '1', FINAL_MAJOR: '40', HOUR_CAP: '150', WALL_HOURS: '30',
      MON_FROM: '0', MON_HP: c.hp, MON_ATK: c.atk, MON_DEF: c.def, MON_BASE: c.base,
      NEW_BOARDS: '15', NEW_MODE: 'mult', NEW_EFFECT: c.eff, NEW_COST_DIV: c.div, GEAR_CURVE: 'exp', GEAR_K: c.gk,
    };
    execFile('node', [path.join(__dirname, 'sim.cjs')], { env, maxBuffer: 1 << 20 }, (err, out) => {
      const r = JSON.parse(out.trim().split('\n').pop());
      let score = 0;
      for (const [m, t] of Object.entries(TARGET)) {
        const got = r.times[m];
        score += got === undefined ? 25 : Math.log(Math.max(got, 0.05) / t) ** 2;
      }
      if (r.times[1] > 0.1) score += 5;
      if ((r.times[10] ?? 99) < 0.7) score += 3; // 챕터1이 너무 빠르면 감점 // 대1에서 막히면 감점
      if (r.times[30] !== undefined && r.times[40] === undefined) score += 3; // 대40 연장 시 벽
      resolve({ c, r, score });
    });
  });

(async () => {
  const results = [];
  const queue = [...combos];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) results.push(await runOne(queue.shift()));
  }));
  results.sort((a, b) => a.score - b.score);
  for (const { c, r, score } of results.slice(0, 12)) {
    const t = (m) => (r.times[m] ?? '-');
    console.log(`${score.toFixed(2)} | 성장 ${c.hp}/${c.atk}/${c.def} 기초×${c.base} 보드효과×${c.eff} 장비K${c.gk} | 대1 ${t(1)} 대5 ${t(5)} 대10 ${t(10)} 대15 ${t(15)} 대20 ${t(20)} 대25 ${t(25)} 대30 ${t(30)} 대40 ${t(40)} | 환골${r.rebirth} ${r.wall}`);
  }
})();
