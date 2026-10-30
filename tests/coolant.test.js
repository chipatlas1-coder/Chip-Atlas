// Coolant concentration page: refractometer factor and sump correction.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { concentration, readingFor, addFor, mixed } from '../src/lib/coolant.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('reading × factor = concentration, and back', () => {
  near(concentration(4, 1.5), 6);
  near(readingFor(6, 1.5), 4);
  near(concentration(5, 1), 5);
});

test('sump correction by volume balance', () => {
  // 1000 L at 4 % to 6 % with neat concentrate: x = 1000·2/94
  const x = addFor(1000, 4, 6, 100);
  near(x, 2000 / 94);
  near(mixed(1000, 4, x, 100), 6);
  // with 10 % premix: x = 1000·2/4 = 500 L
  near(addFor(1000, 4, 6, 10), 500);
  // diluting 8 % to 6 % with water: x = 1000·(6−8)/(0−6) = 333.3 L
  near(addFor(1000, 8, 6, 0), 2000 / 6);
  // impossible: raising the concentration with water
  assert.ok(Number.isNaN(addFor(1000, 4, 6, 0)));
});

test('reproduces the Master Fluid Solutions TB #060 example and the page examples', () => {
  // 123 gal sump, 0 → 1 % with neat concentrate: Master gives "about 1.24 gallons"
  near(addFor(123, 0, 1, 100), 123 / 99);
  assert.equal(addFor(123, 0, 1, 100).toFixed(2), '1.24');
  // page: 400 L at 3 % to 5 % with neat concentrate ≈ 8.4 L; 8 % to 6 % with water ≈ 133 L
  assert.equal(addFor(400, 3, 5, 100).toFixed(1), '8.4');
  assert.equal(addFor(400, 8, 6, 0).toFixed(0), '133');
  // Motul SAFKOOL 6110 factor 2.5: a reading of 2.0 gives 5.0 %
  near(concentration(2, 2.5), 5);
});
