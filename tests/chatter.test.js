// Chatter page: single-degree-of-freedom regenerative model.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frf, phase, blim, blimCrit, lobe, boundary, pocketRpm, chip, swing } from '../src/lib/chatter.ts';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const S = { fn: 1000, k: 2e7, zeta: 0.03, Ks: 2000e6, z: 4, mu: 1 };

test('FRF: static compliance 1/k, −1/(2ζk) imaginary at resonance', () => {
  near(frf(1e-6, S).re, 1 / S.k);
  near(frf(S.fn, S).re, 0, 1e-12);
  near(frf(S.fn, S).im, -1 / (2 * S.zeta * S.k));
});

test('the most negative real part is −1/(4kζ(1+ζ)) at r = √(1+2ζ)', () => {
  const r = Math.sqrt(1 + 2 * S.zeta);
  near(frf(r * S.fn, S).re, -1 / (4 * S.k * S.zeta * (1 + S.zeta)), 1e-9);
  // no lower value nearby
  for (const d of [-0.01, 0.01]) assert.ok(frf((r + d) * S.fn, S).re > frf(r * S.fn, S).re);
});

test('b_lim,crit = 2kζ(1+ζ)/Ks equals the minimum of b_lim over frequency', () => {
  const r = Math.sqrt(1 + 2 * S.zeta);
  near(blim(r * S.fn, S), blimCrit(S), 1e-9);
  near(blimCrit(S), (2 * 2e7 * 0.03 * 1.03) / 2000e6 * 1000);   // 0.618 mm
  assert.equal(blim(0.9 * S.fn, S), Infinity);
});

test('phase runs from 2π just above fn down towards π far above it', () => {
  assert.ok(phase(S.fn * 1.0001, S) > 1.99 * Math.PI);
  assert.ok(phase(S.fn * 50, S) < 1.02 * Math.PI);
  for (let f = 1.01; f < 3; f += 0.1) { const e = phase(f * S.fn, S); assert.ok(e > Math.PI && e < 2 * Math.PI, String(e)); }
});

test('each lobe climbs in speed; lobe N sits between the pocket speeds of N and N+1', () => {
  for (const N of [0, 1, 2, 5]) {
    const L = lobe(N, S);
    for (let i = 1; i < L.length; i++) assert.ok(L[i].rpm > L[i - 1].rpm);
    assert.ok(L[0].rpm < pocketRpm(N, S) * 1.005 && L[0].rpm >= pocketRpm(N, S));   // starts at fn/(N+1)
    assert.ok(L[L.length - 1].rpm > pocketRpm(N, S));
  }
});

test('boundary picks the lowest lobe and never goes below b_lim,crit', () => {
  const lobes = [0, 1, 2, 3, 4, 5, 6, 7].map((N) => lobe(N, S));
  for (let rpm = 2000; rpm < 15000; rpm += 137) {
    const bd = boundary(rpm, lobes);
    assert.ok(bd.b >= blimCrit(S) * 0.999, `${rpm}: ${bd.b}`);
  }
  // just above a pocket speed the boundary is high (stable pocket)
  const top = boundary(pocketRpm(0, S) * 1.02, lobes).b;
  const mid = boundary(pocketRpm(0, S) * 0.8, lobes).b;
  assert.ok(top > 2 * mid, `${top} vs ${mid}`);
});

test('regenerative chip: constant when the waves are in phase, swing 2A when they are opposite', () => {
  near(swing(0, 1), 0); near(swing(Math.PI, 1), 2); near(swing(Math.PI / 2, 1), Math.SQRT2);
  for (let t = 0; t < 6.3; t += 0.3) near(chip(0, 1, 0.3, t).h, 1);
  const hs = Array.from({ length: 200 }, (_, i) => chip(Math.PI, 1, 0.3, (i / 200) * 2 * Math.PI).h);
  near(Math.max(...hs) - Math.min(...hs), 1.2, 1e-3);
});
