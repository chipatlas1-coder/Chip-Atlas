// Radial runout: chip load per tooth in the simple geometric model.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chipLoads, spread } from '../src/lib/runout.ts';
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('no runout: every tooth takes fz', () => {
  chipLoads(4, 0.05, 0).forEach((h) => near(h, 0.05));
});

test('two teeth: TIR shifts load from one tooth to the other', () => {
  // r0 = R + e, r1 = R − e, so the loads are fz ± 2e = fz ± TIR
  const h = chipLoads(2, 0.05, 0.02);
  near(Math.max(...h), 0.07); near(Math.min(...h), 0.03);
  near(h.reduce((a, b) => a + b, 0), 0.1);                 // the feed per revolution is still removed
});

test('when TIR reaches fz on a two-flute cutter one tooth does all the work', () => {
  const s = spread(2, 0.05, 0.05);
  near(s.max, 2); near(s.min, 0); assert.equal(s.cutting, 1);
  const t = spread(2, 0.05, 0.08);
  near(t.max, 2); assert.equal(t.cutting, 1);
});

test('the loads always add up to z·fz per revolution', () => {
  for (const [z, tir] of [[3, 0.01], [4, 0.03], [6, 0.1]]) {
    const h = chipLoads(z, 0.04, tir);
    near(h.reduce((a, b) => a + b, 0), z * 0.04, 1e-9);
  }
});
