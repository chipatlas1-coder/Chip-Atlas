// Long-chips page: the uncut chip cross-section from the edge geometry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { section, leftAt, rightAt, tangents } from '../src/lib/chipsection.ts';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

// independent check: rasterise the removed material (inside the tool now, outside it one, two … revolutions ago)
const brute = (e, nx = 500, nz = 900) => {
  const zs = -e.re - e.ap * 1.2, ze = e.re + e.ap * 1.2 + e.f, dz = (ze - zs) / nz, dx = e.ap / nx;
  let a = 0;
  for (let i = 0; i < nx; i++) {
    const x = (i + 0.5) * dx, l = leftAt(x, e), r = rightAt(x, e);
    for (let j = 0; j < nz; j++) {
      const z = zs + (j + 0.5) * dz;
      if (z < l || z > r) continue;
      let before = false;
      for (let k = 1; k < 40 && !before; k++) if (z >= l + k * e.f && z <= r + k * e.f) before = true;
      if (!before) a += dx * dz;
    }
  }
  return a;
};
test('the chip area matches a rasterised removal and stays just under f × ap (the feed scallops remain)', () => {
  for (const kr of [45, 75, 95]) for (const [ap, f, re] of [[0.3, 0.1, 0.8], [1, 0.25, 0.4], [2, 0.4, 1.2]]) {
    const krMinor = kr === 95 ? 5 : kr === 75 ? 15 : 45;
    const e = { ap, f, re, kr, krMinor }, s = section(e);
    near(s.area, brute(e), 0.01 * f * ap);
    assert.ok(s.area <= f * ap + 1e-9 && s.area > 0.9 * f * ap, `${s.area} vs ${f * ap}`);
  }
});

test('the nose arc and the edges meet at their tangency points', () => {
  const e = { ap: 2, f: 0.2, re: 0.8, kr: 75, krMinor: 15 };
  const t = tangents(e);
  near(leftAt(t.xm - 1e-9, e), t.zm, 1e-6);
  near(leftAt(t.xm + 1e-9, e), t.zm, 1e-4);
  near(rightAt(t.xt - 1e-9, e), t.zt, 1e-6);
  near(rightAt(t.xt + 1e-9, e), t.zt, 1e-4);
  near(leftAt(e.ap, e), 0, 1e-9);
});

test('deep cut, straight edge: thickness is f · sin κr', () => {
  for (const kr of [45, 75, 90, 95]) {
    const s = section({ ap: 4, f: 0.3, re: 0.4, kr, krMinor: kr === 45 ? 45 : 5 });
    near(s.hmax, 0.3 * Math.sin((kr * Math.PI) / 180), 0.003);
    assert.equal(s.noseOnly, false);
  }
});

test('ap below the nose: only the arc cuts, the chip is thinner than f', () => {
  const s = section({ ap: 0.3, f: 0.2, re: 1.2, kr: 95, krMinor: 5 });
  assert.equal(s.noseOnly, true);
  assert.ok(s.hmax < 0.2 * 0.75, String(s.hmax));
  const deep = section({ ap: 3, f: 0.2, re: 1.2, kr: 95, krMinor: 5 });
  assert.ok(deep.hmax > s.hmax);
});
