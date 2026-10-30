// Hardness page: Brinell, Vickers and Rockwell arithmetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brinell, brinellForce, capDepth, vickers, VK, KGF, SCALES, rockwell, rockwellDepth, rcDepth, RC, drawRockwellCycle, drawBrinell, drawVickers } from '../src/lib/hardness.ts';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('Brinell: 10 mm ball at 3000 kgf (index 30), d = 4.00 mm gives 229 HBW', () => {
  const F = brinellForce(10, 30);
  near(F, 3000 * 9.80665, 1e-9);                                    // 29.42 kN
  const r = brinell(F, 10, 4);
  near(r.HBW, 228.8, 0.2);
  assert.ok(r.valid);
  near(r.h, (10 - Math.sqrt(84)) / 2);
  near(r.minThick, 8 * r.h);
});

test('Brinell validity window 0.24 D – 0.6 D', () => {
  assert.equal(brinell(1000, 10, 2.39).valid, false);
  assert.equal(brinell(1000, 10, 2.4).valid, true);
  assert.equal(brinell(1000, 10, 6).valid, true);
  assert.equal(brinell(1000, 10, 6.01).valid, false);
});

test('ZwickRoell examples: 1/30 = 294.2 N, 10/3000 = 29.42 kN, 10/100 = 980.7 N', () => {
  near(brinellForce(1, 30), 294.2, 0.05);
  near(brinellForce(10, 30), 29420, 0.1);
  near(brinellForce(10, 1), 980.7, 0.05);
});

test('ZwickRoell thickness example: d = 6.0 mm on D = 10 mm needs 8.00 mm (8 × depth 1.0 mm)', () => {
  near(capDepth(10, 6), 1, 1e-12);
  near(brinell(1000, 10, 6).minThick, 8);
});

test('Vickers: HV ≈ 0.1891 F / d², ranges by force, depth ≈ d/7', () => {
  near(VK, 0.1891, 1e-4);
  const v = vickers(30 * KGF, 0.4, 0.41);
  near(v.d, 0.405);
  near(v.HV, VK * 30 * KGF / (0.405 * 0.405));
  assert.equal(v.range, 'macro');
  assert.equal(vickers(0.2 * KGF, 0.03, 0.03).range, 'low');
  assert.equal(vickers(0.1 * KGF, 0.03, 0.03).range, 'micro');
  near(v.depth * 7, 0.405, 0.002);
  near(v.minThick, 1.5 * 0.405);
});

test('Rockwell: HRC = 100 − h/0.002, HRBW = 130 − h/0.002, superficial 100 − h/0.001', () => {
  const C = SCALES.find((s) => s.k === 'HRC'), B = SCALES.find((s) => s.k === 'HRBW'), N30 = SCALES.find((s) => s.k === 'HR30N');
  near(rockwell(C, 0.08), 60);
  near(rockwell(B, 0.08), 90);
  near(rockwell(N30, 0.04), 60);
  near(rockwellDepth(C, 60), 0.08);
  assert.equal(C.F, 1471); assert.equal(C.F0, 98.07);
  assert.equal(N30.F0, 29.42); assert.equal(N30.F, 294.2);
});

test('Rockwell cycle curve is continuous and ends at h', () => {
  const h = 0.08;
  let prev = null;
  for (let t = RC.t0 + 0.0001; t <= RC.end; t += 0.001) {
    const d = rcDepth(t, h);
    if (prev !== null) assert.ok(Math.abs(d - prev) < 0.002, `jump at ${t}`);
    prev = d;
  }
  near(rcDepth(RC.end, h), h);
  near(rcDepth(RC.t1, h), 0, 1e-9);
});

test('drawings render without NaN', () => {
  const T = { depth: 'd', time: 't', f0: 'F0', f: 'F', datum: 'x', hold: 'y', read: 'r' };
  for (const s of SCALES) for (const t of [0, 1, 3, 5, 7, 8]) for (const nar of [false, true]) assert.ok(!drawRockwellCycle(t, s, 0.05, T, (v) => v, nar).svg.includes('NaN'));
  const IT = { d: 'd', h: 'h', d1: 'd1', d2: 'd2' };
  for (const D of [10, 5, 2.5, 1]) for (const k of [0.15, 0.4, 0.75]) assert.ok(!drawBrinell(D, k * D, IT, (v) => v).svg.includes('NaN'));
  assert.ok(!drawVickers(0.02, 0.025, IT, (v) => v).svg.includes('NaN'));
});
