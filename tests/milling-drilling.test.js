import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tableFeed, millingRemovalRate, engagementAngle, maxChipThickness, meanChipThickness,
  feedForChipThickness, millingPower, torqueFromPower, spindleSpeed, cuttingSpeed,
  drillRemovalRate, drillChipThickness, drillLipForce, drillPower, drillTorque, specificCuttingForce,
} from '../src/lib/calc.js';

const close = (a, b, rel = 1e-3) => assert.ok(Math.abs(a - b) <= Math.abs(b) * rel + 1e-12, `${a} vs ${b}`);

/** Numerical reference: integrate h(φ) = fz·sinφ·sinκr over the engagement arc. */
function numeric(fz, ae, D, kr, mode) {
  const s = Math.sin((kr * Math.PI) / 180);
  let a0, a1;
  if (mode === 'centre') { const half = Math.asin(ae / D); a0 = Math.PI / 2 - half; a1 = Math.PI / 2 + half; }
  else { a0 = 0; a1 = Math.acos(1 - (2 * ae) / D); }
  const N = 200000; let sum = 0, max = 0;
  for (let i = 0; i < N; i++) {
    const phi = a0 + ((i + 0.5) / N) * (a1 - a0);
    const h = fz * Math.sin(phi) * s;
    sum += h; if (h > max) max = h;
  }
  return { hm: sum / N, hex: max };
}

test('Sandvik milling base formulas', () => {
  // D 63, z 5, vc 200 → n ≈ 1010.5; fz 0.15 → vf ≈ 757.9; ap 3, ae 40 → Q ≈ 90.9
  const n = spindleSpeed(200, 63);
  close(n, 1010.53, 1e-4);
  const vf = tableFeed(0.15, 5, n);
  close(vf, 757.9, 1e-4);
  close(millingRemovalRate(3, 40, vf), 90.95, 1e-3);
  close(cuttingSpeed(63, n), 200);
});

test('engagement angle: slot 180°, half-width 90°, centred full face 180°', () => {
  close(engagementAngle(20, 20), 180);
  close(engagementAngle(10, 20), 90);
  close(engagementAngle(20, 20, 'centre'), 180);
  close(engagementAngle(10, 20, 'centre'), 60);
});

test('chip thickness formulas match numerical integration', () => {
  for (const mode of ['side', 'centre']) {
    for (const ratio of [0.05, 0.1, 0.25, 0.4, 0.5, 0.75, 1]) {
      for (const kr of [90, 45, 15]) {
        const D = 50, ae = ratio * D, fz = 0.2;
        const ref = numeric(fz, ae, D, kr, mode);
        close(meanChipThickness(fz, ae, D, kr, mode), ref.hm, 1e-4);
        close(maxChipThickness(fz, ae, D, kr, mode), ref.hex, 1e-4);
      }
    }
  }
});

test('radial chip thinning factor equals Machining Doctor RCTF', () => {
  // RCTF = 1 / sqrt(1 − (1 − 2ae/D)²); at ae/D = 0.1 → 1.6667
  const fz = feedForChipThickness(0.1, 2, 20, 90);
  close(fz / 0.1, 1 / Math.sqrt(1 - (1 - 0.2) ** 2));
  close(fz / 0.1, 1.6667, 1e-4);
});

test('milling power and torque are consistent', () => {
  // Pc = ae·ap·vf·kc/60e6; with kc 2000, ae 40, ap 3, vf 757.9 → 3.03 kW
  const Pc = millingPower(40, 3, 757.9, 2000);
  close(Pc, 3.0316, 1e-3);
  // Torque from power equals force × radius: Mc = Pc·30e3/(π n)
  const n = 1010.53;
  close(torqueFromPower(Pc, n), (Pc * 1000) / ((2 * Math.PI * n) / 60));
});

test('drilling: Iscar per-lip formulas equal Sandvik closed forms', () => {
  const D = 12, fn = 0.2, vc = 90, kc11 = 1800, mc = 0.25, point = 140;
  const h = drillChipThickness(fn, point);
  close(h, 0.1 * Math.sin((70 * Math.PI) / 180));
  const kc = specificCuttingForce(kc11, mc, h);
  const F = drillLipForce(kc, D, fn);
  const Pc = drillPower(F, vc);
  close(Pc, (fn * vc * D * kc) / 240000); // Sandvik closed form
  const n = spindleSpeed(vc, D);
  close(drillTorque(F, D), torqueFromPower(Pc, n)); // T = Fc·D/2000 equals Pc·30e3/(πn)
  close(drillRemovalRate(vc, D, fn), (Math.PI * D * D / 4) * fn * n / 1000); // swept volume
});
