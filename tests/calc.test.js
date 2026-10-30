import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cuttingSpeed,
  spindleSpeed,
  removalRate,
  chipThickness,
  specificCuttingForce,
  cuttingForce,
  cuttingPower,
  cuttingTorque,
  cuttingTime,
  rtArc,
  raArc,
  geometricRoughness,
} from '../src/lib/calc.js';

const close = (a, b, rel = 0.01) => assert.ok(Math.abs(a - b) <= Math.abs(b) * rel + 1e-9, `${a} vs ${b}`);

test('cutting speed and spindle speed are inverses', () => {
  close(cuttingSpeed(100, 500), 157.08); // π·100·500/1000
  close(spindleSpeed(200, 50), 1273.24); // 200·1000/(π·50)
  close(spindleSpeed(cuttingSpeed(63, 1200), 63), 1200);
});

test('removal rate: vc 200 m/min, ap 2 mm, f 0.3 mm/rev → 120 cm³/min', () => {
  close(removalRate(200, 2, 0.3), 120);
});

test('Kienzle chain gives textbook power', () => {
  // Steel, kc1.1 = 1500 N/mm², mc = 0.25, κr = 90°, f = 0.3, ap = 3, vc = 200
  const h = chipThickness(0.3, 90);
  close(h, 0.3);
  const kc = specificCuttingForce(1500, 0.25, h);
  close(kc, 1500 * Math.pow(0.3, -0.25)); // ≈ 2026 N/mm²
  const Fc = cuttingForce(kc, 3, 0.3);
  close(Fc, 1823.7, 0.002);
  close(cuttingPower(Fc, 200), 6.079, 0.002);
  close(cuttingTorque(Fc, 100), 91.18, 0.002);
});

test('chip thickness follows the entering angle', () => {
  close(chipThickness(0.4, 45), 0.4 * Math.SQRT1_2);
  close(chipThickness(0.4, 95), 0.4 * Math.sin((95 * Math.PI) / 180));
});

test('cutting time: 200 mm at 0.25 mm/rev and 800 rpm = 1 min', () => {
  close(cuttingTime(200, 0.25, 800), 1);
});

test('textbook roughness: f 0.2, rε 0.8 → Rt 6.25 µm, Ra ≈ 1.60 µm', () => {
  close(rtArc(0.2, 0.8), 6.25);
  close(raArc(0.2, 0.8), 1.603);
});

test('geometric profile matches the textbook when only the arc cuts', () => {
  const r = geometricRoughness(0.2, 0.8, 90, 90);
  assert.equal(r.arcOnly, true);
  close(r.Rt, 6.25, 0.005);
  close(r.Ra, 1.603, 0.01);
});

test('a shallow trailing edge lowers the cusp below the textbook value', () => {
  const r = geometricRoughness(0.3, 0.8, 95, 5);
  assert.equal(r.arcOnly, false);
  assert.ok(r.Rt < r.RtArc, 'trailing edge must cut the cusp down');
  close(r.Rt, 11.4, 0.05); // hand-solved intersection ≈ 11.4 µm vs 14.06 µm textbook
});
