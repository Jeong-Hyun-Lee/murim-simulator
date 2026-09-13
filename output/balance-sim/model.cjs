// 구조안 검증 — 보상 곡선 유지, 몬스터 3스탯 동일 성장률, 장비 지수 곡선, 챕터별 곱연산 무공.
// 실행: node output/balance-sim/model.cjs
const { execFile } = require('child_process');
const path = require('path');
const TARGET = { 5: 0.3, 10: 1.5, 15: 4, 20: 8, 25: 14, 30: 22 };
const combos = [];
for (const g of [1.45, 1.5, 1.55, 1.6])
  for (const xs of [0.05, 0.1, 0.2, 0.3])
    for (const eff of [0, 0.2, 0.35, 0.5])
      for (const base of [1, 1.5])
        for (const div of [1, 10])
          combos.push({ g, xs, eff, base, div });
const runOne = (c, seed = 1, final = 40) => new Promise((resolve) => {
  const env = { ...process.env, JSON: '1', SEED: String(seed), FINAL_MAJOR: String(final), HOUR_CAP: '100', WALL_HOURS: '30',
    MON_FROM: '0', MON_BASE: c.base ?? 1, MON_HP: c.g, MON_ATK: c.g * 1.6 / 1.8, MON_DEF: c.g * 1.5 / 1.8, REWARD_TIE: '0', EXP_SCALE: c.xs,
    GEAR_CURVE: 'exp', GEAR_K: '10', GEAR_PCT: 'fixed', GEAR_PCT_K: '5', NEW_BOARDS: c.eff ? '15' : '0', NEW_MODE: 'mult', NEW_EFFECT: c.eff, NEW_COST_DIV: c.div ?? 10 };
  execFile('node', [path.join(__dirname, 'sim.cjs')], { env, maxBuffer: 1 << 20 }, (e, out) => {
    const r = JSON.parse(out.trim().split('\n').pop());
    let score = 0;
    for (const [m, t] of Object.entries(TARGET)) score += r.times[m] === undefined ? 25 : Math.log(Math.max(r.times[m], 0.05) / t) ** 2;
    if (r.times[1] > 0.2) score += 5;
    if (r.times[40] === undefined) score += 4; // 챕터4(대40)까지 연장 시 벽이면 감점
    else score += Math.log(r.times[40] / 45) ** 2 * 0.5; // 챕터4 완결 약 45h 기대
    resolve({ c, r, score });
  });
});
module.exports = { runOne };
if (require.main === module) (async () => {
  const results = []; const q = [...combos];
  await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) results.push(await runOne(q.shift())); }));
  results.sort((a, b) => a.score - b.score);
  for (const { c, r, score } of results.slice(0, 10)) {
    const t = (m) => r.times[m] ?? '-';
    console.log(`${score.toFixed(2)} | g ${c.g} 경험치×${c.xs} 보드효과×${c.eff} 기초×${c.base} 비용÷${c.div} | 대1 ${t(1)} 대5 ${t(5)} 대10 ${t(10)} 대15 ${t(15)} 대20 ${t(20)} 대25 ${t(25)} 대30 ${t(30)} 대35 ${t(35)} 대40 ${t(40)} | 환골${r.rebirth} ${r.wall}`);
  }
})();
