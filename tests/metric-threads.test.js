import test from 'node:test';
import assert from 'node:assert/strict';
import { threadData, stressArea, sig, minor6H, tapDrill, COARSE, FINE, designation } from '../src/data/metric-threads.js';

test('ISO 724:2023 basic dimensions (sample rows of Table 1)', () => {
  // M x P: d2 / D1 / d3
  const rows = [
    [6, 1, 5.350, 4.917, 4.773], [8, 1.25, 7.188, 6.647, 6.466], [10, 1.5, 9.026, 8.376, 8.160],
    [16, 2, 14.701, 13.835, 13.546], [24, 3, 22.051, 20.752, 20.319], [36, 4, 33.402, 31.670, 31.093],
    [48, 5, 44.752, 42.587, 41.866], [64, 6, 60.103, 57.505, 56.639],
  ];
  for (const [d, P, d2, D1, d3] of rows) {
    const t = threadData(d, P);
    assert.equal(t.d2, d2, `d2 M${d}`);
    assert.equal(t.D1, D1, `D1 M${d}`);
    assert.equal(t.d3, d3, `d3 M${d}`);
  }
});

test('6H minor diameter limits match published tables', () => {
  const rows = [
    [3, 0.5, 2.459, 2.599], [4, 0.7, 3.242, 3.422], [5, 0.8, 4.134, 4.334], [6, 1, 4.917, 5.153],
    [8, 1.25, 6.647, 6.912], [10, 1.5, 8.376, 8.676], [12, 1.75, 10.106, 10.441], [14, 2, 11.835, 12.21],
    [16, 2, 13.835, 14.21], [18, 2.5, 15.294, 15.744], [20, 2.5, 17.294, 17.744], [22, 2.5, 19.294, 19.744],
    [24, 3, 20.752, 21.252], [30, 3.5, 26.211, 26.771], [36, 4, 31.67, 32.27],
  ];
  for (const [d, P, min, max] of rows) {
    const l = minor6H(d, P);
    assert.deepEqual(l, { min, max }, `M${d}`);
  }
  assert.equal(minor6H(64, 6), null);
});

test('Tensile stress area matches ISO 898-1 values to three significant figures', () => {
  const coarse = { 3: 5.03, 4: 8.78, 5: 14.2, 6: 20.1, 8: 36.6, 10: 58.0, 12: 84.3, 14: 115, 16: 157, 18: 192, 20: 245, 22: 303, 24: 353, 27: 459, 30: 561, 33: 694, 36: 817, 39: 976, 42: 1120, 48: 1470, 56: 2030, 64: 2680 };
  for (const [d, v] of Object.entries(coarse)) {
    const c = COARSE.find((x) => x.d === Number(d));
    assert.equal(sig(stressArea(c.d, c.P)), v, `M${d}`);
  }
  const fine = [[8, 1, 39.2], [10, 1, 64.5], [10, 1.25, 61.2], [12, 1.25, 92.1], [12, 1.5, 88.1], [14, 1.5, 125], [16, 1.5, 167], [18, 1.5, 216], [20, 1.5, 272], [22, 1.5, 333], [24, 2, 384], [27, 2, 496], [30, 2, 621], [33, 2, 761], [36, 3, 865], [39, 3, 1030]];
  for (const [d, P, v] of fine) assert.equal(sig(stressArea(d, P)), v, `M${d}x${P}`);
});

test('Tap drills: DIN 336 values for coarse and fine threads, d − P otherwise, all inside 6H limits where known', () => {
  assert.equal(tapDrill(8, 1.25).drill, 6.8);
  assert.equal(tapDrill(12, 1.75).drill, 10.2);
  assert.equal(tapDrill(2.5, 0.45).drill, 2.05);
  assert.equal(tapDrill(56, 5.5).drill, 50.5);
  assert.equal(tapDrill(10, 1.25).drill, 8.8);
  assert.equal(tapDrill(12, 1.25).drill, 10.8);
  assert.equal(tapDrill(10, 1.25).source, 'fine');
  assert.equal(tapDrill(36, 3).single, true);
  assert.deepEqual(tapDrill(18, 2), { drill: 16, standard: false, single: false, source: 'rule' });
  assert.equal(tapDrill(10, 0.75).source, 'rule');
  assert.equal(tapDrill(20, 1.5).drill, 18.5);
  for (const c of COARSE) {
    const l = minor6H(c.d, c.P);
    if (l) assert.ok(c.drill >= l.min && c.drill <= l.max, `M${c.d}: ${c.drill} in ${l.min}…${l.max}`);
    // every coarse drill is d − P rounded to a standard drill size within 0.05 mm
    assert.ok(Math.abs(c.drill - (c.d - c.P)) <= 0.05 + 1e-9, `M${c.d} drill close to d − P`);
  }
  for (const f of FINE) {
    const l = minor6H(f.d, f.P);
    const t = tapDrill(f.d, f.P).drill;
    if (l) assert.ok(t >= l.min && t <= l.max, `M${f.d}x${f.P}`);
    assert.ok(Math.abs(t - (f.d - f.P)) <= 0.05 + 1e-9, `M${f.d}x${f.P} drill close to d − P`);
  }
});

test('Designation', () => {
  assert.equal(designation(10, 1.5), 'M10');
  assert.equal(designation(10, 1.25), 'M10×1.25');
  assert.equal(designation(2.5, 0.45, '×', ','), 'M2,5');
});
