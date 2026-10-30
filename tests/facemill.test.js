// Face-milling page: cutter position and entering angle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engagement, chipSection, RATIOS, maxOffset } from '../src/lib/facemill.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('centred cutter: symmetric arc, entry and exit chips equal, half climb', () => {
  const g = engagement({ ratio: 1.25, off: 0 });
  near(g.aIn, -g.aOut);
  near(g.hIn, g.hOut);
  near(g.climbShare, 0.5);
  near(g.hMax, 1);
  // Dc = 1.25 ae: the edges of the strip are at sin α = ±0.8
  near(Math.sin(g.aIn), 0.8);
  near(g.hIn, 0.6, 1e-12);
});

test('cutter equal to the width: the teeth enter and leave tangentially, chip zero at both ends', () => {
  const g = engagement({ ratio: 1, off: 0 });
  near(g.hIn, 0, 1e-7); near(g.hOut, 0, 1e-7); near(g.spanDeg, 180, 1e-6);
});

test('moving the centre towards the entry edge thickens the entry chip and thins the exit chip', () => {
  const a = engagement({ ratio: 1.4, off: 0 }), b = engagement({ ratio: 1.4, off: 0.2 });
  assert.ok(b.hIn > a.hIn && b.hOut < a.hOut);
  assert.ok(b.climbShare > a.climbShare);
});

test('thin to thick is conventional, thick to thin is climb', () => {
  const conv = engagement({ ratio: 2, off: -0.5 }), climb = engagement({ ratio: 2, off: 0.5 });
  near(conv.hIn, 0, 1e-7); near(conv.hOut, 1, 1e-7); near(conv.climbShare, 0, 1e-9);
  near(climb.hIn, 1, 1e-7); near(climb.hOut, 0, 1e-7); near(climb.climbShare, 1, 1e-9);
  near(maxOffset(1.3), 0.15, 1e-12); near(maxOffset(1), 0);
});

test('entering angle: h = fz·sin κr, b = ap/sin κr, the area does not change', () => {
  near(chipSection(45, 0.2, 3).h, 0.2 * Math.SQRT1_2);
  near(chipSection(45, 0.2, 3).h / 0.2, 0.7071067811865476);      // Kennametal’s .707
  near(chipSection(90, 0.2, 3).h, 0.2);
  for (const k of [10, 45, 75, 90]) { const c = chipSection(k, 0.25, 2); near(c.h * c.b, 0.5, 1e-12); }
});

test('maker ratios: Sumitomo’s 70–80 % width is 1.25–1.43 × the cut', () => {
  const s = RATIOS.find((r) => r.who === 'Sumitomo');
  near(s.lo, 1.25); near(s.hi, 1.4285714285714286);
});
