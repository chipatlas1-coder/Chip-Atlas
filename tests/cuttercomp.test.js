// Cutter radius compensation geometry: the tool centre stays one radius from the programmed profile.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offsetProfile, reverse, elLength, elPoint } from '../src/lib/cuttercomp.ts';
const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

// a step: top face, inside fillet R20, wall, outside corner, upper face (material lower right)
const prof = [
  { type: 'line', a: [45, 60], b: [150, 60] },
  { type: 'arc', a: [150, 60], b: [170, 80], c: [150, 80], ccw: true },
  { type: 'line', a: [170, 80], b: [170, 140] },
  { type: 'line', a: [170, 140], b: [270, 140] },
];
// distance from a point to the programmed profile (sampled)
const distToProfile = (p) => {
  let best = Infinity;
  for (const s of prof) for (let k = 0; k <= 400; k++) {
    const u = k / 400; let q;
    if (s.type === 'line') q = [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u];
    else { const a0 = Math.atan2(s.a[1] - s.c[1], s.a[0] - s.c[0]); const a = a0 + u * Math.PI / 2; q = [s.c[0] + 20 * Math.cos(a), s.c[1] + 20 * Math.sin(a)]; }
    best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]));
  }
  return best;
};

test('G41 on this profile: offsets on the outside, transition arc at the outside corner', () => {
  const r = 8, o = offsetProfile(prof, r, 1);
  assert.equal(o.interference, false);
  near(o.els[0].a[1], 68); near(o.els[0].b[1], 68);
  assert.equal(o.els[1].type, 'arc'); near(o.els[1].r, 12);           // inside fillet: 20 − 8
  near(o.els[2].a[0], 162);                                              // wall: x = 170 − 8
  assert.deepEqual(o.corners.map((c) => c.kind), ['outside']);
  const t = o.els[3]; assert.equal(t.type, 'arc'); near(t.r, 8); assert.equal(t.ccw, false);
  near(o.els[4].a[1], 148);
});

test('every centre point is one radius from the profile (both correct sides)', () => {
  for (const [segs, side] of [[prof, 1], [reverse(prof), -1]]) {
    const r = 6, o = offsetProfile(segs, r, side);
    for (const e of o.els) { const L = elLength(e); for (let k = 0; k <= 20; k++) near(distToProfile(elPoint(e, (L * k) / 20)), r, 0.05); }
  }
});

test('the wrong side puts the centre inside the material and trims the corner', () => {
  const r = 8, o = offsetProfile(prof, r, -1);
  near(o.els[0].a[1], 52);
  assert.deepEqual(o.corners.map((c) => c.kind), ['inside']);
  near(o.els[2].b[0], 178); near(o.els[2].b[1], 132); near(o.els[3].a[0], 178); near(o.els[3].a[1], 132);
});

test('a tool larger than the inside fillet does not fit', () => {
  assert.equal(offsetProfile(prof, 19.9, 1).interference, false);
  assert.equal(offsetProfile(prof, 20, 1).interference, false);        // r = R: the centre pauses at the fillet centre
  assert.equal(offsetProfile(prof, 20.5, 1).interference, true);
  assert.equal(offsetProfile(reverse(prof), 25, -1).interference, true);
  // too big: the arc is dropped and the two lines meet at (170 − r, 60 + r)
  const o = offsetProfile(prof, 24, 1);
  assert.ok(o.els.every((e) => e.type !== 'arc' || !e.collapsed));
  near(o.els[0].b[0], 146); near(o.els[0].b[1], 84); near(o.els[1].a[0], 146); near(o.els[1].a[1], 84);
});

test('sharp outside corner: the two offset lines meet at their intersection', () => {
  const r = 8, o = offsetProfile(prof, r, 1, [0, 1, 2, 3], 'sharp');
  assert.equal(o.els.length, 4);                                         // no transition arc
  near(o.els[2].b[0], 162); near(o.els[2].b[1], 148); near(o.els[3].a[0], 162); near(o.els[3].a[1], 148);
});
