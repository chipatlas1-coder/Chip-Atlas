// Oscillation-cutting page figure: tool paths and air cuts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z, thickness, analyse } from '../src/lib/oscillation.ts';

test('without oscillation the chip is one feed thick and never breaks', () => {
  for (const phi of [4000, 4123, 4500]) assert.ok(Math.abs(thickness(phi, 0, 1.5) - 1) < 1e-9);
  assert.equal(analyse(0, 1.5).breaksPerRev, 0);
});

test('a whole number of oscillations per revolution keeps the paths in step: no air cut at any amplitude', () => {
  for (const a of [0.3, 0.8, 1.5]) {
    const r = analyse(a, 1);
    assert.equal(r.breaksPerRev, 0);
    assert.ok(Math.abs(thickness(4321, a, 2) - 1) < 1e-9);
  }
});

test('half a wave of offset per revolution: the paths cross once the amplitude exceeds half the feed', () => {
  assert.equal(analyse(0.45, 1.5).breaksPerRev, 0);
  assert.equal(analyse(0.6, 1.5).breaksPerRev, 1.5);
  assert.equal(analyse(0.6, 0.5).breaksPerRev, 0.5);
  assert.equal(analyse(0.8, 2.5).breaksPerRev, 2.5);
  // with z − z(φ − 360) = 1 + 2a·sin(kφ), the air share is the fraction of a cycle where sin < −1/(2a)
  const a = 1, share = analyse(a, 1.5).airShare, expect = (Math.PI - 2 * Math.asin(1 / (2 * a))) / (2 * Math.PI);
  assert.ok(share <= expect + 0.01, `${share} vs ${expect}`);
  assert.ok(share > 0);
});

test('the surface is the furthest earlier reach, so thickness never exceeds what one revolution of feed allows plus the swing', () => {
  for (let phi = 5000; phi < 5720; phi += 7) {
    const h = thickness(phi, 0.9, 1.5);
    assert.ok(h >= 0 && h <= 1 + 2 * 0.9 + 1e-9);
    assert.ok(Math.max(0, z(phi, 0.9, 1.5) - z(phi - 360, 0.9, 1.5)) >= h - 1e-9);
  }
});
