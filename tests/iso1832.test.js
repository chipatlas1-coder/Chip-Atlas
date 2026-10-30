import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInsertCode, sizes, shapes } from '../src/data/iso1832.js';

test('CNMG 120408 decodes to the classic 80° rhombic roughing insert', () => {
  const r = parseInsertCode('CNMG 12 04 08');
  assert.ok(r);
  assert.equal(r.shape, 'C');
  assert.equal(r.clearance, 'N');
  assert.equal(r.tolerance, 'M');
  assert.equal(r.fixing, 'G');
  assert.equal(r.inscribedCircle, 12.7);
  assert.equal(r.edgeLength, 12.9);
  assert.equal(r.thickness, 4.76);
  assert.equal(r.radius, 0.8);
});

test('suffix, edge condition and hand are read when present', () => {
  const r = parseInsertCode('dcmt 11 t3 04 er-pm 4325');
  assert.equal(r.shape, 'D');
  assert.equal(r.thicknessCode, 'T3');
  assert.equal(r.thickness, 3.97);
  assert.equal(r.radius, 0.4);
  assert.equal(r.edge, 'E');
  assert.equal(r.hand, 'R');
  assert.equal(r.suffix, 'PM4325');
});

test('round inserts carry their diameter in the size code', () => {
  const r = parseInsertCode('RCMT 10 T3 M0');
  assert.equal(r.inscribedCircle, 10);
  assert.equal(r.radius, 0);
});

test('garbage is rejected', () => {
  assert.equal(parseInsertCode('hello'), null);
  assert.equal(parseInsertCode('CNMG 12'), null);
});

test('rhombic edge lengths equal d / sin(ε) within rounding', () => {
  for (const [shape, table] of Object.entries(sizes)) {
    const def = shapes[shape];
    if (def.kind !== 'rhombus') continue;
    for (const [code, [l, d]] of Object.entries(table)) {
      const expect = d / Math.sin((def.angle * Math.PI) / 180);
      assert.ok(Math.abs(l - expect) < 0.11, `${shape}${code}: ${l} vs ${expect.toFixed(2)}`);
    }
  }
  for (const [code, [l, d]] of Object.entries(sizes.T)) {
    assert.ok(Math.abs(l - d * Math.sqrt(3)) < 0.11, `T${code}`);
  }
});
