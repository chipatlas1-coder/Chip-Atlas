import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ra, rz, rt, rkFamily, moments } from '../src/lib/profile.js';

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('Ra of a sine of amplitude A is 2A/π', () => {
  const z = Array.from({ length: 10000 }, (_, i) => Math.sin((i / 10000) * 2 * Math.PI * 25));
  close(ra(z), 2 / Math.PI, 1e-3);
  close(rt(z), 2, 1e-3);
  close(rz(z).Rz, 2, 1e-3);
});

test('Rk family of a uniform (linear Abbott curve) profile: no peak or valley zone', () => {
  // Heights uniformly spread from +1 to −1: Abbott curve is a straight line.
  const z = Array.from({ length: 4001 }, (_, i) => 1 - (2 * i) / 4000);
  const r = rkFamily(z);
  close(r.Rk, 2, 0.01);
  close(r.Rpk, 0, 0.01);
  close(r.Rvk, 0, 0.01);
});

test('Rk family: added deep valleys raise Rvk, not Rk', () => {
  const core = Array.from({ length: 4000 }, (_, i) => 1 - (2 * i) / 3999);
  const valleys = Array.from({ length: 400 }, (_, i) => -1 - (3 * (i + 1)) / 400); // down to −4
  const r = rkFamily([...core, ...valleys]);
  assert.ok(r.Rvk > 0.5, `Rvk ${r.Rvk}`);
  assert.ok(r.Mr2 < 95, `Mr2 ${r.Mr2}`);
  close(r.Rk, 2 * 4400 / 4000, 0.05); // secant slope over the core stretched by the extra points
});

test('moments: a sine has Rq = A/√2, Rsk = 0, Rku = 1.5', () => {
  const z = Array.from({ length: 10000 }, (_, i) => Math.sin((i / 10000) * 2 * Math.PI * 25));
  const m = moments(z);
  close(m.Rq, 1 / Math.SQRT2, 1e-3);
  close(m.Rsk, 0, 1e-3);
  close(m.Rku, 1.5, 1e-3);
});

test('moments: rare deep valleys give negative skewness, rare peaks positive', () => {
  const base = Array.from({ length: 1000 }, (_, i) => (i % 2 ? 0.1 : -0.1));
  const valleys = base.map((v, i) => (i % 50 === 0 ? -2 : v));
  const peaks = valleys.map((v) => -v);
  assert.ok(moments(valleys).Rsk < -1);
  assert.ok(moments(peaks).Rsk > 1);
  close(moments(valleys).Rku, moments(peaks).Rku, 1e-9);
});
