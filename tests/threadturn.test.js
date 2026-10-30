// Thread turning page: pass schedules, infeed geometry, helix angle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MMC, schedule, perPass, radialAreas, cumulative, passSplit, tips, helix, helixApprox, pitchD, drawSection, drawSplit, drawRings, drawAreas, drawGauge, drawHelixChart, METHODS } from '../src/lib/threadturn.ts';
import { passCounts } from '../src/data/threadturn-charts.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const T30 = Math.tan(Math.PI / 6);

test('ISCAR constant-area formula reproduces its worked example (P 1.25, ap 0.78, 6 passes)', () => {
  const c = schedule('iscar', 0.78, 6).map((v) => Math.round(v * 100) / 100);
  assert.deepEqual(c, [0.19, 0.35, 0.49, 0.6, 0.7, 0.78]);
  // per pass from ISCAR's rounded cumulative values: 0.19 / 0.16 / 0.14 / 0.11 / 0.10 / 0.08
  assert.deepEqual(perPass(c).map((v) => Math.round(v * 100) / 100), [0.19, 0.16, 0.14, 0.11, 0.1, 0.08]);
  // areas: 0.3 : 0.7 : 1 : 1 : 1 : 1
  const a = radialAreas(schedule('iscar', 0.78, 6));
  near(a[0] / a[2], 0.3, 1e-12); near(a[1] / a[2], 0.7, 1e-12); near(a[5] / a[2], 1, 1e-12);
});

test('√N rule: first pass ap/√n, every pass the same area; constant depth: 2nd pass 3 × the 1st', () => {
  const c = schedule('sqrt', 1.23, 8);
  near(c[0], 1.23 / Math.sqrt(8), 1e-12); near(c[7], 1.23, 1e-12);
  const a = radialAreas(c);
  a.forEach((v) => near(v, a[0], 1e-12));
  const k = radialAreas(schedule('const', 0.5, 2));
  near(k[1] / k[0], 3, 1e-12);
});

test('Mitsubishi rows add up to their totals, and the totals sit at about 0.613 P', () => {
  for (const r of MMC) {
    near(r.passes.reduce((a, b) => a + b, 0), r.total, 1e-9);
    assert.ok(Math.abs(r.total - 0.6134 * r.P) <= 0.01, `P ${r.P}`);
    assert.equal(r.passes[r.passes.length - 1], 0.06);
  }
});

test('infeed split: radial even, flank one edge only, modified a thin second cut, alternating switches', () => {
  const p = MMC[4].passes, H = 0.92;
  const tot = (s) => s.reduce((a, x) => a + x.left + x.right, 0);
  for (const m of METHODS) near(tot(passSplit(m, p, 3)), T30 * H * H, 2e-3);
  passSplit('radial', p).forEach((s) => near(s.left, s.right, 2e-4));
  passSplit('flank', p).forEach((s) => assert.equal(s.left, 0));
  passSplit('modified', p, 3).forEach((s) => { const sh = s.left / (s.left + s.right); assert.ok(sh > 0.01 && sh < 0.15, String(sh)); });
  passSplit('alternating', p).forEach((s, i) => assert.equal(i % 2 === 0 ? s.left : s.right, 0));
  // every method ends on the finished profile
  for (const m of METHODS) { const t = tips(m, p, 3); near(t[t.length - 1].x, 0, 1e-12); near(t[t.length - 1].y, H, 1e-9); }
  // flank: the tips lie on the finished left flank line x = −(H − d)·tan 30°
  tips('flank', p).forEach((t) => near(t.x, -(H - t.y) * T30, 1e-12));
});

test('helix angle: ISCAR’s Ø20 × 2.5 example (d2 18.376 mm, φ ≈ 2.5°); Hoffmann’s 20·P/D', () => {
  near(pitchD(20, 2.5), 18.376, 5e-4);
  near(helix(2.5, 18.376), 2.48, 5e-3);
  near(helixApprox(2.5, 20), 2.5, 1e-12);
  near(helix(2.5, 18.376, 2), (Math.atan(5 / (Math.PI * 18.376)) * 180) / Math.PI, 1e-12);
});

test('drawings render without NaN', () => {
  const T = { left: 'l', right: 'r', mm2: 'mm²', pass: 'pass', infeed: 'infeed' };
  const dec = (s) => s;
  for (const m of METHODS) for (const row of MMC) for (const narrow of [false, true]) {
    for (let k = 0; k <= row.passes.length; k++) {
      const s = drawSection(m, row.passes, 3, narrow, T, dec, k, k < row.passes.length ? k : null, 0.5, 0.5).svg;
      assert.ok(!s.includes('NaN'), `${m} ${row.P} ${k}`);
    }
    assert.ok(!drawSplit(passSplit(m, row.passes, 3, 120, 80), narrow, T, 2, dec, 0.4).svg.includes('NaN'));
  }
  const cums = ['iscar', 'sqrt', 'const'].map((r) => schedule(r, 0.92, 6));
  for (const narrow of [false, true]) {
    for (const g of [0, 0.3, 1]) assert.ok(!drawRings(cums, ['a', 'b', 'c'], narrow, dec, g).svg.includes('NaN'));
    assert.ok(!drawAreas(cums.map(radialAreas), narrow, { x: 'x', y: 'y' }, dec).svg.includes('NaN'));
    const H = { std: 's', approx: 'a', deg: '°', d: 'd', phi: 'φ', pLab: 'P' };
    for (const [d, P, n] of [[3, 0.5, 4], [20, 2.5, 1], [200, 6, 1], [3, 6, 1]]) {
      assert.ok(!drawGauge(helix(P, pitchD(d, P), n), helixApprox(P, d, n), H, dec, narrow).svg.includes('NaN'));
      assert.ok(!drawHelixChart(d, P, n, H, dec, narrow).svg.includes('NaN'));
    }
  }
});

test('pass-count chart: ranges in order and Mitsubishi matching its table', () => {
  const c = passCounts('en');
  const mmc = { '0.5': 4, '1.0': 5, '1.5': 6, '2.0': 8, '2.5': 10, '3.0': 12 };
  for (const r of c.rows) {
    r.ranges.forEach((g) => assert.ok(g.lo <= g.hi));
    const P = r.label.match(/P ([\d.]+)/)[1];
    if (mmc[P]) assert.equal(r.ranges[0].lo, mmc[P]);
    const row = MMC.find((m) => m.P === Number(P));
    if (row) assert.equal(row.passes.length, r.ranges[0].lo);
  }
  assert.ok(passCounts('tr').rows[0].label.includes('0,5'));
});
