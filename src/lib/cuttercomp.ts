/**
 * Cutter radius compensation, geometry only. A programmed profile of lines and arcs is offset by the tool radius r to
 * the left (side = +1, G41) or right (side = −1, G42) of the direction of travel. Lines shift along their left normal;
 * an arc's radius grows or shrinks (a counter-clockwise arc has its centre on the left). Where two offset elements
 * leave a gap (an outside corner for the tool) a transition arc of radius r about the programmed corner is inserted;
 * where they overlap (an inside corner) both are trimmed to their intersection (line–line junctions only). With
 * corner = 'sharp' an outside corner between two lines is closed by extending both to their intersection instead of the
 * arc (Siemens G451; Haas Setting 58 Fanuc mode up to 270°). An arc whose
 * offset radius would be < 0 is flagged as interference: the tool does not fit; between two lines it is then dropped
 * and the lines are trimmed to their intersection, so the drawn path stays connected. Coordinates in the maths sense
 * (y up).
 */
export type Pt = [number, number];
export type Seg =
  | { type: 'line'; a: Pt; b: Pt }
  | { type: 'arc'; a: Pt; b: Pt; c: Pt; ccw: boolean };
export type El =
  | { type: 'line'; a: Pt; b: Pt; block: number }
  | { type: 'arc'; a: Pt; b: Pt; c: Pt; r: number; ccw: boolean; block: number; collapsed?: boolean };

const sub = (p: Pt, q: Pt): Pt => [p[0] - q[0], p[1] - q[1]];
const add = (p: Pt, q: Pt, k = 1): Pt => [p[0] + k * q[0], p[1] + k * q[1]];
const len = (v: Pt) => Math.hypot(v[0], v[1]);
const unit = (v: Pt): Pt => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const left = (t: Pt): Pt => [-t[1], t[0]];
const cross = (u: Pt, v: Pt) => u[0] * v[1] - u[1] * v[0];

/** Unit tangent at the start and end of a segment, in the direction of travel. */
export function tangents(s: Seg): [Pt, Pt] {
  if (s.type === 'line') { const t = unit(sub(s.b, s.a)); return [t, t]; }
  const ra = unit(sub(s.a, s.c)), rb = unit(sub(s.b, s.c));
  // counter-clockwise: tangent = left normal of the radius vector
  return s.ccw ? [left(ra), left(rb)] : [[-left(ra)[0], -left(ra)[1]], [-left(rb)[0], -left(rb)[1]]];
}

/** Reverse a profile: same geometry, travelled the other way. */
export function reverse(segs: Seg[]): Seg[] {
  return segs.slice().reverse().map((s) => (s.type === 'line' ? { type: 'line', a: s.b, b: s.a } : { type: 'arc', a: s.b, b: s.a, c: s.c, ccw: !s.ccw }));
}

/** Offset one segment; returns null radius when an arc collapses. */
function offsetSeg(s: Seg, r: number, side: 1 | -1, block: number): { el: El; collapsed: boolean } {
  if (s.type === 'line') {
    const n = left(unit(sub(s.b, s.a)));
    return { el: { type: 'line', a: add(s.a, n, side * r), b: add(s.b, n, side * r), block }, collapsed: false };
  }
  const R = len(sub(s.a, s.c));
  const Rn = s.ccw ? R - side * r : R + side * r;
  const ua = unit(sub(s.a, s.c)), ub = unit(sub(s.b, s.c));
  const rr = Math.max(Rn, 0.001);
  const collapsed = Rn < -1e-9;                                          // r = R still fits: the centre pauses at a point
  return { el: { type: 'arc', a: add(s.c, ua, rr), b: add(s.c, ub, rr), c: s.c, r: rr, ccw: s.ccw, block, collapsed }, collapsed };
}

function lineIntersect(p1: Pt, t1: Pt, p2: Pt, t2: Pt): Pt | null {
  const d = cross(t1, t2);
  if (Math.abs(d) < 1e-9) return null;
  const a = cross(sub(p2, p1), t2) / d;
  return add(p1, t1, a);
}

export interface Offset { els: El[]; interference: boolean; corners: { at: Pt; kind: 'outside' | 'inside' }[] }

/**
 * Offset a connected profile. blocks[i] is the block number given to segment i (and to the transition arc that
 * follows it).
 */
export function offsetProfile(segs: Seg[], r: number, side: 1 | -1, blocks: number[] = segs.map((_, i) => i), corner: 'arc' | 'sharp' = 'arc'): Offset {
  const out: El[] = [];
  const corners: Offset['corners'] = [];
  let interference = false;
  const offs = segs.map((s, i) => { const o = offsetSeg(s, r, side, blocks[i]); if (o.collapsed) interference = true; return o.el; });
  for (let i = 0; i < offs.length; i++) {
    out.push(offs[i]);
    if (i === offs.length - 1) break;
    const [, t1] = tangents(segs[i]);
    const [t2] = tangents(segs[i + 1]);
    const c = cross(t1, t2), dot = t1[0] * t2[0] + t1[1] * t2[1];
    if (Math.abs(c) < 1e-6 && dot > 0) continue;                       // tangent: the offsets meet
    const V = segs[i].b;
    if (c * side < 0) {                                                  // outside corner
      const A = offs[i], B = offs[i + 1];
      if (corner === 'sharp' && A.type === 'line' && B.type === 'line') {  // extend both lines to their intersection
        const X = lineIntersect(A.a, unit(sub(A.b, A.a)), B.a, unit(sub(B.b, B.a)));
        if (X) { A.b = X; B.a = X; }
      } else out.push({ type: 'arc', a: A.b, b: B.a, c: V, r, ccw: c > 0, block: blocks[i] });   // transition arc
      corners.push({ at: V, kind: 'outside' });
    } else {                                                             // inside corner: trim to the intersection
      const A = offs[i], B = offs[i + 1];
      if (A.type === 'line' && B.type === 'line') {
        const X = lineIntersect(A.a, unit(sub(A.b, A.a)), B.a, unit(sub(B.b, B.a)));
        if (X) { A.b = X; B.a = X; }
      }
      corners.push({ at: V, kind: 'inside' });
    }
  }
  // a collapsed arc between two lines: drop it and meet the lines at their intersection
  for (let i = 1; i < out.length - 1; i++) {
    const e = out[i], A = out[i - 1], B = out[i + 1];
    if (e.type === 'arc' && e.collapsed && A.type === 'line' && B.type === 'line') {
      const X = lineIntersect(A.a, unit(sub(A.b, A.a)), B.a, unit(sub(B.b, B.a)));
      if (X) { A.b = X; B.a = X; out.splice(i, 1); i--; }
    }
  }
  return { els: out, interference, corners };
}

/** Length of an element. */
export function elLength(e: El): number {
  if (e.type === 'line') return len(sub(e.b, e.a));
  let a0 = Math.atan2(e.a[1] - e.c[1], e.a[0] - e.c[0]), a1 = Math.atan2(e.b[1] - e.c[1], e.b[0] - e.c[0]);
  let d = e.ccw ? a1 - a0 : a0 - a1;
  while (d < 0) d += 2 * Math.PI;
  return d * e.r;
}

/** Point at distance s along an element. */
export function elPoint(e: El, s: number): Pt {
  if (e.type === 'line') { const L = elLength(e) || 1; return add(e.a, sub(e.b, e.a), Math.min(1, s / L)); }
  const a0 = Math.atan2(e.a[1] - e.c[1], e.a[0] - e.c[0]);
  const a = a0 + (e.ccw ? 1 : -1) * (s / e.r);
  return [e.c[0] + e.r * Math.cos(a), e.c[1] + e.r * Math.sin(a)];
}
