// Ballbar error models: shapes and sizes of the signatures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { squareness, scale, servo, backlash, spanOf } from '../src/lib/ballbar.ts';
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('squareness: an ellipse on the diagonals, the same in both directions', () => {
  const R = 100, a = 10e-6;                     // 10 µm/m
  near(squareness(R, a, Math.PI / 4), R * a / 2); near(squareness(R, a, -Math.PI / 4), -R * a / 2);
  near(spanOf((t) => squareness(R, a, t)), R * a, 1e-9);
});

test('scale mismatch: an ellipse on the axes', () => {
  near(scale(100, 20e-6, 0, 0), 0.002); near(scale(100, 20e-6, 0, Math.PI / 2), 0);
});

test('servo mismatch flips with direction and grows with feed', () => {
  const R = 100, dt = 0.001;
  near(servo(R, 1000, dt, Math.PI / 4, 1), -servo(R, 1000, dt, Math.PI / 4, -1));
  near(spanOf((t) => servo(R, 2000, dt, t, 1)), 2 * spanOf((t) => servo(R, 1000, dt, t, 1)), 1e-12);
  // v = 1000 mm/min, Δt = 1 ms: v·Δt = 16.7 µm, peak-to-valley of the ellipse = v·Δt
  near(spanOf((t) => servo(R, 1000, dt, t, 1)), (1000 / 60) * dt, 1e-9);
});

test('backlash: steps of b where the axis reverses', () => {
  const b = 0.01, e = 1e-6;
  // X reverses at θ = 0 and π (counter-clockwise): the deviation jumps by b there
  near(backlash(b, 0, e, 1) - backlash(b, 0, -e, 1), b, 1e-6);
  near(Math.abs(backlash(b, 0, Math.PI + e, 1) - backlash(b, 0, Math.PI - e, 1)), b, 1e-6);
});
