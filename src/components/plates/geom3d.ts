/**
 * Small 3D helpers for the plates: an orthographic camera seen from the front, right and above,
 * cylinders, boxes and extruded profiles, all returned as SVG path strings in plate coordinates.
 * World axes: X to the right, Y up, Z towards the viewer.
 */
export type V3 = [number, number, number];
export type P2 = [number, number];

export const f1 = (n: number) => n.toFixed(1);
export const pt = (p: P2) => `${f1(p[0])},${f1(p[1])}`;
export const path = (q: P2[], close = true) => `M${q.map(pt).join(' L')}${close ? ' Z' : ''}`;
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const unit = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export interface Camera {
  P: (v: V3) => P2;
  dv: V3;                                   // unit vector towards the viewer
  seen: (n: V3) => boolean;                 // is a face with outward normal n turned to the viewer
  depth: (v: V3) => number;                 // larger is nearer
  poly: (q: V3[]) => string;
}

/** Orthographic camera: azimuth (to the right) and elevation in degrees, scale k, origin (ox, oy). */
export function ortho(az: number, el: number, k: number, ox: number, oy: number): Camera {
  const r = Math.PI / 180, cf = Math.cos(az * r), sf = Math.sin(az * r), ct = Math.cos(el * r), st = Math.sin(el * r);
  const dv: V3 = [sf * ct, st, cf * ct];
  const P = (v: V3): P2 => [ox + k * (v[0] * cf - v[2] * sf), oy + k * (v[0] * sf * st - v[1] * ct + v[2] * cf * st)];
  return { P, dv, seen: (n) => dot(n, dv) > 1e-9, depth: (v) => dot(v, dv), poly: (q) => path(q.map(P)) };
}

/** Orthographic camera rolled so that the world X axis runs level across the plate (for shafts and
 *  bars drawn along their axis); otherwise as ortho(). */
export function orthoLevel(az: number, el: number, k: number, ox: number, oy: number): Camera {
  const r = Math.PI / 180, cf = Math.cos(az * r), sf = Math.sin(az * r), ct = Math.cos(el * r), st = Math.sin(el * r);
  const dv: V3 = [sf * ct, st, cf * ct];
  const e1 = unit(sub([1, 0, 0], mul(dv, dv[0])));
  const e2 = cross(dv, e1);                                            // screen up
  const P = (v: V3): P2 => [ox + k * dot(v, e1), oy - k * dot(v, e2)];
  return { P, dv, seen: (n) => dot(n, dv) > 1e-9, depth: (v) => dot(v, dv), poly: (q) => path(q.map(P)) };
}

/** A circular cylinder of radius r from centre a to centre b. */
export function cylinder(cam: Camera, a0: V3, b0: V3, r: number) {
  let a = a0, b = b0;
  let ax = unit(sub(b, a));
  if (dot(ax, cam.dv) < 0) { [a, b] = [b, a]; ax = mul(ax, -1); }   // b is the end whose cap faces the viewer
  const ref: V3 = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = unit(cross(cross(ax, ref), ax));                          // in the section plane, towards ref
  const w = cross(ax, u);
  const nrm = (t: number) => add(mul(u, Math.cos(t)), mul(w, Math.sin(t)));
  const at = (c: V3, t: number, rr = r) => add(c, nrm(t), rr);
  const t1 = Math.atan2(-dot(u, cam.dv), dot(w, cam.dv));            // silhouette; the seen half runs t1 → t1 + π
  const arc = (c: V3, ta: number, tb: number, n = 48, rr = r): P2[] => Array.from({ length: n + 1 }, (_, i) => cam.P(at(c, ta + ((tb - ta) * i) / n, rr)));
  const body = path([...arc(b, t1, t1 - Math.PI), ...arc(a, t1 + Math.PI, t1)]);
  const cap = (c: V3 = b, rr = r) => path(arc(c, 0, 2 * Math.PI, 72, rr));
  const capFaces = dot(ax, cam.dv) > 1e-9;
  const across = (s = 0.5) => { const c = add(a, sub(b, a), s); const p = cam.P(at(c, t1)), q = cam.P(at(c, t1 + Math.PI)); return { x1: f1(p[0]), y1: f1(p[1]), x2: f1(q[0]), y2: f1(q[1]) }; };
  const seenArc = (c: V3, rr = r, n = 48) => arc(c, t1 + Math.PI, t1, n, rr);    // near half of a circle round the axis
  return { a, b, ax, u, w, t1, at, arc, body, cap, capFaces, across, seenArc, nrm };
}

/** Faces of a convex prism given its two end polygons (same order); returns the seen faces, end caps included. */
export function prism(cam: Camera, front: V3[], back: V3[]) {
  const faces: { d: string; n: V3; depth: number; kind: 'side' | 'front' | 'back'; i: number }[] = [];
  const centroid = (q: V3[]) => mul(q.reduce((s, v) => add(s, v), [0, 0, 0] as V3), 1 / q.length);
  const cF = centroid(front), cB = centroid(back), cAll = mul(add(cF, cB), 0.5);
  const nOf = (q: V3[]) => {
    const n = unit(cross(sub(q[1], q[0]), sub(q[2], q[0])));
    return dot(n, sub(centroid(q), cAll)) < 0 ? mul(n, -1) : n;
  };
  const push = (q: V3[], kind: 'side' | 'front' | 'back', i: number) => {
    const n = nOf(q);
    if (cam.seen(n)) faces.push({ d: cam.poly(q), n, depth: cam.depth(centroid(q)), kind, i });
  };
  push(front, 'front', -1);
  push([...back].reverse(), 'back', -1);
  for (let i = 0; i < front.length; i++) {
    const j = (i + 1) % front.length;
    push([front[i], front[j], back[j], back[i]], 'side', i);
  }
  return faces.sort((p, q) => p.depth - q.depth);
}
