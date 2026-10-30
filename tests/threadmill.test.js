// Thread milling page: the O60023 tool path, the feed formulas, the cutter-size limits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stateAt, PHASES, TOTAL, RP, P, feedCalc, centreFeed, edgeFeed, minorD, drawTop, drawSide, drawFeed, COARSE } from '../src/lib/threadmill.ts';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const endOf = (k) => { let t = 0; for (const p of PHASES) { t += p.dur; if (p.k === k) return t - 1e-9; } };

test('tool path ends each block where O60023 says', () => {
  let s = stateAt(endOf('down')); near(s.x, 0); near(s.y, 0); near(s.z, -0.5156, 1e-6);
  s = stateAt(endOf('line')); near(s.x, 0.25); near(s.y, -0.25); near(s.z, -0.5156);
  s = stateAt(endOf('arcin')); near(s.x, 0.5); near(s.y, 0, 1e-6); near(s.z, -0.5);
  s = stateAt(endOf('full')); near(s.x, 0.5); near(s.y, 0, 1e-6); near(s.z, -0.375);
  s = stateAt(endOf('arcout')); near(s.x, 0.25, 1e-6); near(s.y, 0.25); near(s.z, -0.3594);
});

test('the arcs and the orbit match the I/J centres: arc radius 0.25, orbit radius 0.5 = (1.5 − 0.5)/2', () => {
  near(RP, 0.5);
  let acc = 0;
  for (const p of PHASES) {
    for (let i = 1; i < 10; i++) {
      const s = stateAt(acc + (i / 10) * p.dur);
      if (p.k === 'full') near(Math.hypot(s.x, s.y), 0.5);
      if (p.k === 'arcin' || p.k === 'arcout') near(Math.hypot(s.x - 0.25, s.y), 0.25);
    }
    acc += p.dur;
  }
  near(acc, TOTAL);
});

test('one orbit raises Z by one pitch; each arc by 1/8 pitch (1/64 in, rounded to 0.0156 in the program)', () => {
  near(-0.375 - -0.5, P);
  near(-0.5 - -0.5156, P / 8, 1e-4);
  near(-0.3594 - -0.375, P / 8, 1e-4);
});

test('the orbit is counter-clockwise (G03) seen from above', () => {
  let acc = 0;
  for (const p of PHASES) { if (p.k === 'full') break; acc += p.dur; }
  const a = stateAt(acc + 0.1), b = stateAt(acc + 0.2);
  assert.ok(a.x * b.y - a.y * b.x > 0);
});

test('feeds: vf = fz · z · n; internal centre feed (D − d)/D; external (D + d)/D', () => {
  near(edgeFeed(0.05, 4, 1000), 200);
  near(centreFeed(200, 20, 12, true), 80);
  near(centreFeed(200, 20, 12, false), 320);
  const r = feedCalc({ th: 5, dc: 12, z: 4, vc: 100, fz: 0.05, internal: true });
  near(r.n, 100000 / (Math.PI * 12));
  near(r.vm, r.vf * 8 / 20);
  near(r.pathR, 4); near(r.arcR, 2); near(r.zArc, 2.5 / 8);
});

test('cutter limits: M20 → ISCAR 14 mm (its own example 20 × 0.7), Vargus 0.7 D1 = 12.11 mm, FRAISA 2/3 of D1 = 11.53 mm', () => {
  const r = feedCalc({ th: 5, dc: 12, z: 4, vc: 100, fz: 0.05, internal: true });
  near(r.iscar, 14);
  near(minorD(20, 2.5), 17.29375);
  near(r.fraisa, (2 / 3) * 17.29375);
  near(r.vargus, 0.7 * 17.29375);                                    // Vargus: 70 % of the minor diameter, 12.11 mm
  assert.ok(12 < r.vargus && r.vargus < 12.2);
});

test('ISCAR example: Do 48, D 29 → tool-centre radius A = 9.5', () => {
  near((48 - 29) / 2, 9.5);
  const i = COARSE.findIndex((c) => c.name === 'M48');
  near(feedCalc({ th: i, dc: 29, z: 4, vc: 100, fz: 0.1, internal: true }).pathR, 9.5);
});

test('drawings render without NaN through the whole loop', () => {
  for (let t = 0; t < TOTAL; t += 0.05) {
    const s = stateAt(t);
    assert.ok(!drawTop(s, false).includes('NaN'), `top ${t}`);
    assert.ok(!drawSide(s).includes('NaN'), `side ${t}`);
  }
  const T = { edge: 'e', centre: 'c' };
  for (let th = 0; th < COARSE.length; th++) for (const internal of [true, false]) {
    const s = { th, dc: 6, z: 3, vc: 100, fz: 0.05, internal };
    assert.ok(!drawFeed(s, feedCalc(s), T, (v) => v).svg.includes('NaN'));
  }
});
