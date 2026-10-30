// G-code page: the motion reader.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, pointAt, lengthOf } from '../src/lib/gcode.ts';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const nearV = (a, b, tol = 1e-9) => { near(a[0], b[0], tol); near(a[1], b[1], tol); };

test('modal motion and absolute / incremental', () => {
  const { moves, errors } = parse(['G90 G00 X10 Y5', 'G01 X20 F100', 'Y15', 'G91 X-5 Y-5', 'G90']);
  assert.equal(errors.length, 0);
  assert.deepEqual(moves.map((m) => m.kind), ['rapid', 'feed', 'feed', 'feed']);
  nearV(moves[1].to, [20, 5]); nearV(moves[2].to, [20, 15]); nearV(moves[3].to, [15, 10]);
  assert.equal(moves[2].feed, 100);
});

test('arcs by I J: centre from the start point; G02 clockwise, G03 counter-clockwise', () => {
  const { moves } = parse(['G01 X10 Y0', 'G03 X0 Y10 I-10 J0', 'G02 X10 Y20 I10 J0']);
  const a = moves[1], b = moves[2];
  nearV(a.center, [0, 0]); near(a.sweep, Math.PI / 2); assert.equal(a.cw, false);
  nearV(pointAt(a, 0.5), [10 * Math.SQRT1_2, 10 * Math.SQRT1_2]);
  nearV(b.center, [10, 10]); near(b.sweep, Math.PI / 2); assert.equal(b.cw, true);
  nearV(pointAt(b, 0.5), [10 - 10 * Math.SQRT1_2, 10 + 10 * Math.SQRT1_2]);
  near(lengthOf(a), 5 * Math.PI);
});

test('arcs by R: positive for the short arc, negative for the long one; a full circle needs I J', () => {
  const { moves, errors } = parse(['G01 X10 Y0', 'G03 X0 Y10 R10', 'G01 X10 Y0', 'G03 X0 Y10 R-10', 'G02 X0 Y10 R5', 'G03 X0 Y10 I0 J-5']);
  nearV(moves[1].center, [0, 0]); near(moves[1].sweep, Math.PI / 2);
  nearV(moves[3].center, [10, 10]); near(moves[3].sweep, 1.5 * Math.PI);
  assert.ok(errors.some((e) => e.line === 4));                     // full circle with R
  near(moves[moves.length - 1].sweep, 2 * Math.PI);               // full circle with I J
});

test('rapid as a dog-leg: 45° until the shorter axis arrives, then straight', () => {
  const { moves } = parse(['G00 X30 Y10']);
  const m = moves[0];
  nearV(pointAt(m, 1 / 3, true), [10, 10]);
  nearV(pointAt(m, 2 / 3, true), [20, 10]);
  nearV(pointAt(m, 1, true), [30, 10]);
  near(lengthOf(m, true), 10 * Math.SQRT2 + 20);
});
