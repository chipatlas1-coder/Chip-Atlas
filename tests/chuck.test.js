// Chuck page: gripping force against speed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { omega, centrifugal, gripping, speedFor, jawMoment } from '../src/lib/chuck.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('F = m·r·ω² with ω = π·n/30', () => {
  near(omega(30), Math.PI);
  near(centrifugal(1, 30), Math.PI ** 2);
  // three 1.2 kg jaw sets at 70 mm, 3000 min⁻¹: 0.252 kg·m × (100π)² ≈ 24.87 kN
  near(centrifugal(jawMoment(3, 1.2, 70), 3000), 0.252 * (100 * Math.PI) ** 2, 1e-6);
});

test('gripping outside loses the centrifugal force, gripping inside gains it', () => {
  const mr = jawMoment(3, 1, 80), fc = centrifugal(mr, 2500);
  near(gripping(50000, mr, 2500, true), 50000 - fc);
  near(gripping(50000, mr, 2500, false), 50000 + fc);
  near(gripping(50000, mr, 0, true), 50000);
});

test('the speed for a remaining force inverts the parabola', () => {
  const mr = 0.25, n = speedFor(60000, mr, 20000);
  near(gripping(60000, mr, n, true), 20000, 1e-6);
  assert.equal(speedFor(10000, mr, 20000), 0);
});

import { speedAtShare, permissibleSpeed } from '../src/lib/chuck.ts';
test('Kitagawa B-208 check: 87 kN static, 32.9 kN at 5000 min⁻¹ imply Σ m·r ≈ 0.197 kg·m and a 62 % loss', () => {
  const mr = (87000 - 32900) / omega(5000) ** 2;
  near(mr, 0.19733, 1e-4);
  near(gripping(87000, mr, 5000, true), 32900, 1e-6);
  assert.ok(centrifugal(mr, 5000) / 87000 < 2 / 3);
  near(centrifugal(mr, 5000) / 87000, 0.6218, 1e-3);
  near(centrifugal(mr, speedAtShare(87000, mr, 2 / 3)), 58000, 1e-6);
});
test('permissible speed: the static force with Ssp covers the cut with Sz plus the centrifugal force', () => {
  const mr = 0.2, n = permissibleSpeed(87000, mr, 10000);
  near(1.5 * (10000 * 1.5 + centrifugal(mr, n)), 87000, 1e-6);
  assert.equal(permissibleSpeed(20000, mr, 10000), 0);
});
