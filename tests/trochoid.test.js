// Trochoidal slotting geometry: engagement of the cutter's edge over one loop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engagementLoop, angleForAe, aeForAngle, centre } from '../src/lib/trochoid.ts';

test('the path: bottom at t = 0, front at t = π/2, advancing s per loop', () => {
  const s = 1, r = 3;
  const a = centre(0, s, r), b = centre(Math.PI / 2, s, r), c = centre(2 * Math.PI, s, r);
  assert.ok(Math.abs(a.x) < 1e-12 && Math.abs(a.y + r) < 1e-12);
  assert.ok(Math.abs(b.x - (s / 4 + r)) < 1e-12 && Math.abs(b.y) < 1e-12);
  assert.ok(Math.abs(c.x - s) < 1e-12 && Math.abs(c.y + r) < 1e-12);
});

test('straight side milling relation ae ↔ φ', () => {
  assert.ok(Math.abs(angleForAe(10, 5) - 90) < 1e-9);
  assert.ok(Math.abs(angleForAe(10, 10) - 180) < 1e-9);
  assert.ok(Math.abs(aeForAngle(10, angleForAe(10, 1.7)) - 1.7) < 1e-9);
});

test('a plain slot (W = D) engages half the cutter', () => {
  const e = engagementLoop(10, 10, 1);
  assert.ok(Math.abs(e.max - 180) <= 3, `max ${e.max}`);
});

test('a very wide loop approaches straight side milling with ae = s', () => {
  const e = engagementLoop(10, 200, 1, { back: 2, warm: 3 });
  const straight = angleForAe(10, 1);
  assert.ok(e.max >= straight - 1 && e.max - straight < 3, `max ${e.max} vs ${straight}`);
});

test('engagement grows with the step and vanishes as the step goes to zero', () => {
  const a = engagementLoop(10, 16, 0.25).max, b = engagementLoop(10, 16, 0.5).max, c = engagementLoop(10, 16, 1).max, d = engagementLoop(10, 16, 2).max;
  assert.ok(a < b && b < c && c < d, `${a} ${b} ${c} ${d}`);
  assert.ok(engagementLoop(10, 16, 0.02).max < 12);
});

test('converges: the default sampling matches a fine run, and the reference case', () => {
  const a = engagementLoop(10, 15.5, 1), b = engagementLoop(10, 15.5, 1, { n: 360, dt0: (0.05 * Math.PI) / 180, back: 3 });
  assert.ok(Math.abs(a.max - b.max) < 0.5, `${a.max} vs ${b.max}`);
  // independent exact union and the analytic check at the front give 60.9°
  assert.ok(Math.abs(a.max - 60.9) < 0.5, `max ${a.max}`);
});
