// Internal turning page: cantilever deflection of a boring bar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E, inertia, deflection, shape, drawBar, drawCurve, LIMIT } from '../src/lib/boring.ts';
import { ldLimits } from '../src/data/boring-charts.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('I = π D⁴ / 64, hollow bar π (D⁴ − Di⁴) / 64', () => {
  near(inertia(25), (Math.PI * 25 ** 4) / 64);
  near(inertia(25, 5), (Math.PI * (25 ** 4 - 5 ** 4)) / 64);
});

test('δ = F L³ / 3EI: Ø25 steel at 4 × D, 500 N', () => {
  const d = deflection(500, 100, 'steel', 25);
  near(d, (500 * 100 ** 3) / (3 * 206843 * inertia(25)));
  assert.ok(d > 0.0415 && d < 0.0425, String(d));             // about 42 µm
});

test('doubling L gives 8 × δ; doubling D gives 1/16; carbide is stiffer by E ratio', () => {
  near(deflection(500, 200, 'steel', 25) / deflection(500, 100, 'steel', 25), 8);
  near(deflection(500, 100, 'steel', 50) / deflection(500, 100, 'steel', 25), 1 / 16);
  near(deflection(500, 100, 'steel', 25) / deflection(500, 100, 'carbide', 25), E.carbide / E.steel);
});

test('the deflected line reaches δ at the tip and is zero at the clamp', () => {
  near(shape(500, 100, 'steel', 25, 100), deflection(500, 100, 'steel', 25));
  assert.equal(shape(500, 100, 'steel', 25, 0), 0);
});

test('guide limits: steel 4, carbide 6 (Sandvik), heavy metal 6 (Kennametal 4:1–6:1)', () => {
  assert.deepEqual(LIMIT, { steel: 4, heavy: 6, carbide: 6 });
});

test('drawings and chart data render without NaN', () => {
  const T = { clamp: 'c', ld: 'L/D', mag: 'm', force: 'F', limit: 'l', steel: 's', heavy: 'h', carbide: 'c', yAxis: 'y', xAxis: 'x' };
  for (const mat of ['steel', 'heavy', 'carbide']) for (const D of [6, 25, 60]) for (const ld of [1, 4.5, 10]) for (const F of [50, 3000]) for (const nar of [false, true]) {
    const s = { mat, D, ld, F };
    assert.ok(!drawBar(s, T, nar, (v) => v).svg.includes('NaN'));
    assert.ok(!drawCurve(s, T, nar, (v) => v).svg.includes('NaN'));
  }
  for (const l of ['en', 'tr']) assert.equal(ldLimits(l).rows.length, 4);
});
