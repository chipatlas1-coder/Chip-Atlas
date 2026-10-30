// Tapping page: torque and power (LUBERO / SUHNER formula), the calculator's data, the speed chart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIZES, MATS, FORM, torque, rpm, power, compute, drawTapLoad, fmt, range } from '../src/lib/tapload.ts';
import { tapSpeeds } from '../src/data/tapping-charts.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const en = (v) => v, tr = (v) => v.replace('.', ',');

test('Md = kc · P² · d / 8000: M10 × 1.5 in unalloyed structural steel is 6.47 N·m', () => {
  const m10 = SIZES.find((s) => s.name === 'M10');
  near(torque(2300, m10), (2300 * 1.5 * 1.5 * 10) / 8000);
  near(torque(2300, m10), 6.46875);
});

test('n = 1000 · vc / (π · d) and P = Md · n / 9549.3: M10 at 10 m/min is 318 rpm and 0.22 kW', () => {
  const m10 = SIZES.find((s) => s.name === 'M10');
  near(rpm(10, m10), 318.31, 0.01);
  near(power(torque(2300, m10), rpm(10, m10)), 0.2156, 1e-4);
  near(power(1, 60000 / (2 * Math.PI)), 1, 1e-4);            // 1 N·m at 9549 rpm is 1 kW
});

test('coarse pitches are the ISO 261 coarse series', () => {
  const coarse = { M3: 0.5, M4: 0.7, M5: 0.8, M6: 1, M8: 1.25, M10: 1.5, M12: 1.75, M14: 2, M16: 2, M20: 2.5, M24: 3 };
  assert.equal(SIZES.length, Object.keys(coarse).length);
  for (const s of SIZES) { near(s.P, coarse[s.name]); near(s.d, Number(s.name.slice(1))); }
});

test('LUBERO kc table: 14 rows as printed', () => {
  const kc = Object.fromEntries(MATS.map((m) => [m.k, m.kc]));
  assert.deepEqual(kc, { unalloyed: 2300, free: 2300, structural: 2500, qt: 2600, nitriding: 3600, tool: 3600, stainless: 3200, gg: 1250, 'gg-alloy': 1600, malleable: 1100, 'al-long': 800, 'al-short': 680, 'cu-long': 1100, 'cu-short': 720 });
  for (const m of MATS) { assert.ok(m.en && m.tr && m.rm, m.k); assert.ok(!/'/.test(m.tr), `straight apostrophe in ${m.tr}`); }
});

test('forming adds 40–50 % torque (Völkel); speed, feed and power follow', () => {
  const st = { size: 5, mat: 0, form: true, vc: 10 };
  const o = compute(st);
  near(o.md[0], 6.46875 * FORM[0]);
  near(o.md[1], 6.46875 * FORM[1]);
  near(o.vf, 1.5 * o.n);
  near(o.pc[1] / o.pc[0], FORM[1] / FORM[0]);
  const c = compute({ ...st, form: false });
  assert.equal(c.md[0], c.md[1]);
});

test('display: decimals by size, decimal comma in Turkish, a range only when the ends differ', () => {
  assert.equal(fmt(6.46875, en), '6.47');
  assert.equal(fmt(6.46875, tr), '6,47');
  assert.equal(fmt(0.0645, en), '0.065');
  assert.equal(fmt(121, en), '121');
  assert.equal(range([6.47, 6.47], en), '6.47');
  assert.equal(range([9.06, 9.70], tr), '9,06–9,70');
});

test('torque chart: no NaN anywhere, the chosen size is marked, both layouts', () => {
  const T = { axis: 'a', form: 'f', sel: 's' };
  for (let size = 0; size < SIZES.length; size++) for (let mat = 0; mat < MATS.length; mat++) for (const form of [false, true]) for (const narrow of [false, true]) {
    const g = drawTapLoad({ size, mat, form, vc: 10 }, T, narrow, en);
    assert.ok(!/NaN|Infinity/.test(g.svg), `${size} ${mat} ${form} ${narrow}`);
    assert.equal((g.svg.match(/tl-col on/g) || []).length, 1);
  }
  const mid = drawTapLoad({ size: 0, mat: 0, form: false, vc: 10 }, T, false, en, 0.5, 680, 0.3);
  assert.ok(!/NaN/.test(mid.svg));
});

test('speed chart: only column-certain makers, sane ranges, same rows in both languages', () => {
  for (const l of ['en', 'tr']) {
    const c = tapSpeeds(l);
    assert.equal(c.rows.length, 5);
    assert.ok(!c.legend.some((x) => /Yamawa/.test(x.name)), 'Yamawa is not column-certain');
    for (const r of c.rows) for (const g of r.ranges) { assert.ok(g.lo <= g.hi && g.lo > 0 && g.hi <= 80, `${r.label} ${g.text}`); assert.ok(c.legend.some((x) => x.color === g.color)); }
  }
  const e = tapSpeeds('en'), t = tapSpeeds('tr');
  assert.deepEqual(e.rows.map((r) => r.ranges.map((g) => [g.lo, g.hi])), t.rows.map((r) => r.ranges.map((g) => [g.lo, g.hi])));
  // YG-1 bright: structural steel 15–20, austenitic 5–8, grey iron 10–15, wrought Al 25–35 (Prime taps table)
  assert.deepEqual([e.rows[0], e.rows[2], e.rows[3], e.rows[4]].map((r) => [r.ranges[0].lo, r.ranges[0].hi]), [[15, 20], [5, 8], [10, 15], [25, 35]]);
});

// ---- tap-breakage page: blind-hole depth chain ----
import { DRILL, FORMS, CLEAR, depths, drawBlind } from '../src/lib/blindhole.ts';

test('blind hole: tap depth = thread + n·P, drill = tap + 0.050 in, point = D/2 / tan 59°', () => {
  const v = depths({ size: 5, form: 1, k: 1.5 });                // M10, form C (3 threads), 1.5 d
  near(v.L, 15); near(v.cham, 4.5); near(v.tap, 19.5);
  near(CLEAR, 1.27);
  near(v.cyl, 20.77);
  near(v.point, 4.25 / Math.tan((59 * Math.PI) / 180));
  near(v.total, 20.77 + 2.5536, 1e-3);
  // form B needs 2 threads (3 mm for M10) more than form C
  near(depths({ size: 5, form: 0, k: 1.5 }).tap - v.tap, 3);
});

test('blind hole: DIN 336 drills for every size, chamfer forms at the top of the makers’ ranges', () => {
  assert.deepEqual(DRILL, { M3: 2.5, M4: 3.3, M5: 4.2, M6: 5.0, M8: 6.8, M10: 8.5, M12: 10.2, M14: 12.0, M16: 14.0, M20: 17.5, M24: 21.0 });
  assert.deepEqual(FORMS.map((f) => [f.k, f.n]), [['B', 5], ['C', 3], ['E', 2]]);
});

test('blind hole drawing: no NaN, fits its width, every size, form and depth, both layouts', () => {
  const T = { thread: 't', cham: 'c', clear: 'k', point: 'p', total: 'd', tap: 'tap' };
  for (let size = 0; size < 11; size++) for (let form = 0; form < 3; form++) for (const k of [1, 1.5, 2.5]) for (const narrow of [false, true]) {
    const g = drawBlind({ size, form, k }, T, narrow, (s) => s);
    assert.ok(!/NaN|Infinity/.test(g.svg), `${size} ${form} ${k} ${narrow}`);
    const xs = [...g.svg.matchAll(/x[12]?="(-?[\d.]+)"/g)].map((m) => Number(m[1]));
    assert.ok(Math.min(...xs) >= 0 && Math.max(...xs) <= g.W, `x range ${Math.min(...xs)}..${Math.max(...xs)} for ${size} ${form} ${k} ${narrow}`);
  }
});

test('blind hole drawing: the two-decimal chain labels add up to the total in every state', () => {
  const T = { thread: 't', cham: 'c', clear: 'k', point: 'p', total: 'd', tap: 'tap' };
  for (let size = 0; size < 11; size++) for (let form = 0; form < 3; form++) for (let k10 = 10; k10 <= 25; k10++) {
    const st = { size, form, k: k10 / 10 };
    const g = drawBlind(st, T, false, (s) => s);
    const lab = (name) => Number(new RegExp(`>${name} (-?[\\d.]+)<`).exec(g.svg)[1]);
    const sum = lab('t') + lab('c') + lab('k') + lab('p');
    assert.equal(sum.toFixed(2), depths(st).total.toFixed(2), `${size} ${form} ${st.k}`);
  }
});
