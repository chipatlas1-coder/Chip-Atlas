// Reaming page: ISO 522 reamer limits, stock allowance tables, drawing smoke tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reamerLimits, ceilUm, HOLES, GUEHRING, NEWMAN, KMT, kmtAt, bandAt, allowRead, drawTol, drawAllow } from '../src/lib/ream.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('ISO 522 worked example: 12 H7, IT7 = 18 µm, 0.15 IT = 2.7 → 3 µm, reamer 12.008–12.015', () => {
  const L = reamerLimits(12, 'H7');
  assert.equal(L.IT, 18);
  assert.equal(L.ES, 18); assert.equal(L.EI, 0);
  assert.equal(L.a, 3); assert.equal(L.b, 7);
  assert.equal(L.hi, 15); assert.equal(L.lo, 8);
  assert.equal(L.rest, 8);
});

test('Hoffmann 163000 Ø13 H7 (+0.008/+0.015) matches the ISO 522 rule', () => {
  const L = reamerLimits(13, 'H7');
  assert.equal(L.hi, 15); assert.equal(L.lo, 8);
});

test('rounding up ignores floating-point noise: 0.15 × 20 is 3, not 4', () => {
  assert.equal(ceilUm(0.15 * 20), 3);
  assert.equal(ceilUm(0.35 * 20), 7);
  assert.equal(ceilUm(0.15 * 21), 4);          // 3.15 → 4
  assert.equal(ceilUm(0.35 * 21), 8);          // 7.35 → 8
});

test('every hole class gives a reamer band inside the hole zone, for every size 1–100 mm', () => {
  for (const cls of HOLES) {
    for (let d = 1; d <= 100; d += 0.5) {
      const L = reamerLimits(d, cls);
      assert.ok(L, `${cls} ${d}`);
      assert.ok(L.hi < L.ES && L.lo > L.EI, `${cls} ${d}: ${L.lo}…${L.hi} in ${L.EI}…${L.ES}`);
      assert.equal(L.a + L.b + L.rest, L.IT, `${cls} ${d}: chain adds up`);
      assert.ok(Number.isInteger(L.a) && Number.isInteger(L.b));
      assert.ok(L.a >= 0.15 * L.IT - 1e-9 && L.a < 0.15 * L.IT + 1);
    }
  }
});

test('m6 stock grade at 12 mm is +7/+18 µm', () => {
  const L = reamerLimits(12, 'H7');
  assert.deepEqual(L.m6, { es: 18, ei: 7 });
});

test('Gühring table, all materials: Ø6 → 0.1–0.2, Ø6.5 → 0.2, Ø16 → 0.2–0.3, Ø45 → 0.4–0.5', () => {
  const g = (d) => { const b = bandAt(GUEHRING.all, d); return [b.lo, b.hi]; };
  assert.deepEqual(g(6), [0.1, 0.2]);
  assert.deepEqual(g(6.5), [0.2, 0.2]);
  assert.deepEqual(g(16), [0.2, 0.3]);
  assert.deepEqual(g(16.5), [0.3, 0.3]);
  assert.deepEqual(g(45), [0.4, 0.5]);
  assert.deepEqual([bandAt(GUEHRING.h63, 12).lo, bandAt(GUEHRING.h63, 12).hi], [0.1, 0.2]);
  assert.deepEqual([bandAt(GUEHRING.h48, 30).lo, bandAt(GUEHRING.h48, 30).hi], [0.3, 0.3]);
});

test('Kennametal and Newman inch tables convert to mm', () => {
  near(kmtAt(6).lo, 0.254);
  near(kmtAt(6.35).lo, 0.381);
  near(kmtAt(12.7).lo, 0.381);
  near(kmtAt(20).lo, 0.635);
  assert.equal(kmtAt(40), null);
  near(bandAt(NEWMAN, 10).lo, 0.254); near(bandAt(NEWMAN, 10).hi, 0.381);
  assert.equal(bandAt(NEWMAN, 20), null);
  assert.equal(NEWMAN[3].txt, '.008–.014 in');
  assert.equal(KMT[0].txt, '.010 in');
});

test('readouts: Ø16 → Gühring drill 15.7–15.8, Kennametal 3 % → 15.52', () => {
  const r = allowRead({ d: 16, mat: 'all' });
  near(r.g.dlo, 15.7); near(r.g.dhi, 15.8);
  near(r.p.dlo, 15.52);
  assert.equal(r.n.lo, 0.012 * 25.4);
});

test('drawings render without NaN', () => {
  const dec = (s) => s;
  const T = { hole: 'Hole', reamer: 'Reamer', stock: 'm6', nominal: 'Ø', rest: 'rest', um: 'µm' };
  const A = { d: 'Ø', mm: 'mm', g: 'G', n: 'N', k: 'K', p: 'P', h: 'H' };
  for (const cls of HOLES) for (const d of [1, 3, 12, 50, 100]) for (const nar of [false, true]) {
    assert.ok(!drawTol(reamerLimits(d, cls), T, nar, dec).svg.includes('NaN'));
  }
  for (const mat of ['all', 'h48', 'h63']) for (let d = 1; d <= 50; d += 0.5) for (const nar of [false, true]) {
    assert.ok(!drawAllow({ d, mat }, A, nar, dec).svg.includes('NaN'));
  }
});
