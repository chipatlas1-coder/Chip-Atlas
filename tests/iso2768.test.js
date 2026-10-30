import test from 'node:test';
import assert from 'node:assert/strict';
import { linearDeviation, radiusDeviation, angularDeviation, flatnessTolerance, formatAngle } from '../src/data/iso2768.js';

test('ISO 2768-1 linear deviations match the published table', () => {
  const cases = [
    [0.5, 'f', 0.05], [3, 'm', 0.1], [3.01, 'c', 0.3], [6, 'v', 0.5], [25, 'm', 0.2], [30, 'f', 0.1],
    [30.5, 'f', 0.15], [120, 'c', 0.8], [150, 'f', 0.2], [400, 'v', 2.5], [999, 'm', 0.8],
    [1500, 'c', 3], [2000, 'f', 0.5], [2500, 'm', 2], [4000, 'v', 8],
  ];
  for (const [s, c, v] of cases) assert.equal(linearDeviation(s, c), v, `${s} ${c}`);
  assert.equal(linearDeviation(2, 'v'), null);
  assert.equal(linearDeviation(2500, 'f'), null);
  assert.equal(linearDeviation(0.4, 'm'), null);
  assert.equal(linearDeviation(4001, 'm'), null);
});

test('radii, chamfers and angles', () => {
  assert.equal(radiusDeviation(2, 'm'), 0.2);
  assert.equal(radiusDeviation(5, 'c'), 1);
  assert.equal(radiusDeviation(40, 'f'), 1);
  assert.equal(angularDeviation(10, 'm'), 60);
  assert.equal(angularDeviation(40, 'm'), 30);
  assert.equal(angularDeviation(200, 'c'), 15);
  assert.equal(angularDeviation(500, 'v'), 20);
  assert.equal(formatAngle(90), '1°30′');
  assert.equal(formatAngle(60), '1°');
  assert.equal(formatAngle(5), '0°5′');
});

test('ISO 2768-2 straightness and flatness (withdrawn)', () => {
  assert.equal(flatnessTolerance(10, 'H'), 0.02);
  assert.equal(flatnessTolerance(250, 'K'), 0.4);
  assert.equal(flatnessTolerance(3000, 'L'), 1.6);
});
