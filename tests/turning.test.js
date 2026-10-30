// Turning-operations figures: the chip of a turning edge and facing at constant cutting speed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chipOf, drawEntering } from '../src/lib/entering.ts';
import { facingAt, clampDia, drawFacing } from '../src/lib/facing.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const rad = (d) => (d * Math.PI) / 180;

test('chip thickness h = fn · sin κr, width b = ap / sin κr, section ap · fn whatever the angle', () => {
  for (const kr of [35, 45, 60, 75, 90, 95]) {
    const c = chipOf({ kr, fn: 0.3, ap: 2 });
    near(c.h, 0.3 * Math.sin(rad(kr)));
    near(c.b, 2 / Math.sin(rad(kr)));
    near(c.A, 0.6);
    near(c.h * c.b, 0.6, 1e-12);
  }
});

test('Sandvik factors: h ≈ 0.71 fn at κr 45°, h ≈ 1.0 fn at 95°', () => {
  near(chipOf({ kr: 45, fn: 1, ap: 1 }).h, 0.7071, 1e-4);
  near(chipOf({ kr: 95, fn: 1, ap: 1 }).h, 0.9962, 1e-4);
});

test('entering-angle drawing has no NaN at the slider limits', () => {
  for (const kr of [35, 95]) for (const fn of [0.05, 0.6]) for (const ap of [0.5, 2.5]) for (const narrow of [false, true]) {
    const g = drawEntering({ kr, fn, ap }, { feed: 'f', machined: 'm', unmachined: 'u', zoom: 'z', insert: 'i', work: 'w', h: 'h', b: 'b' }, narrow, (v) => v, 't');
    assert.ok(!/NaN|Infinity/.test(g.svg), `kr ${kr} fn ${fn} ap ${ap} narrow ${narrow}`);
  }
});

test('G96 with a speed limit: n = 1000 · vc / (π · D) until the limit, then n = limit', () => {
  const s = { vc: 180, nmax: 3000 };
  const dc = clampDia(s);
  near(dc, (1000 * 180) / (Math.PI * 3000));
  near(dc, 19.0986, 1e-4);                                   // G96 S180 LIMS=3000
  const out = facingAt(s, 100);
  near(out.n, (1000 * 180) / (Math.PI * 100));
  near(out.vc, 180, 1e-9);
  const ins = facingAt(s, 10);
  assert.equal(ins.n, 3000);
  near(ins.vc, (Math.PI * 10 * 3000) / 1000);
  assert.ok(ins.vc < 180);
  near(facingAt(s, dc).vc, 180, 1e-9);
  assert.equal(facingAt(s, 0).vc, 0);
});

test('facing drawing has no NaN from the edge to the centre', () => {
  const T = { n: 'n', vc: 'vc', dia: 'D', limit: 'lim', face: 'face', rpm: 'rpm', mmin: 'm/min' };
  for (const d of [120, 50, 19, 1, 0]) for (const narrow of [false, true]) {
    const g = drawFacing({ vc: 200, d0: 120, nmax: 2500, d }, T, narrow, (v) => v);
    assert.ok(!/NaN|Infinity/.test(g.svg), `d ${d} narrow ${narrow}`);
  }
});
