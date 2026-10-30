/**
 * Corner of an 80° rhombic insert in parallel projection, shared by the wear drawings.
 * X right, Y back (negative = away from the viewer), Z up. Corner toward the viewer;
 * main cutting edge to the right, minor edge to the left, nose radius re, 7° clearance.
 */
export type V3 = [number, number, number];
export function insertCorner(o: { cx: number; cy: number; k: number; re?: number; th?: number; len?: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const k = o.k, re = o.re ?? 24, th = o.th ?? 62, len = o.len ?? 560, cl = Math.tan(rad(7));
  const P = (X: number, Y: number, Z: number) => [o.cx + X * k, o.cy + (Y * 0.52 - Z * 0.86) * k];
  const f1 = (p: number[]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const path = (pts: number[][], close = true) => 'M' + pts.map((q) => f1(P(q[0], q[1], q[2] ?? 0))).join(' L') + (close ? ' Z' : '');
  const m = [Math.sin(rad(40)), -Math.cos(rad(40))], s = [-Math.sin(rad(40)), -Math.cos(rad(40))];
  const nm = [Math.cos(rad(40)), Math.sin(rad(40))], ns = [-Math.cos(rad(40)), Math.sin(rad(40))];
  const t = re / Math.tan(rad(40));
  const Cn = [0, -re / Math.sin(rad(40))];
  const at = (d: number[], kk: number, base = [0, 0]) => [base[0] + d[0] * kk, base[1] + d[1] * kk];
  const T1 = at(m, t), T2 = at(s, t);
  const arc = (r: number, z: number) => {
    const a1 = Math.atan2(T1[1] - Cn[1], T1[0] - Cn[0]), a2 = Math.atan2(T2[1] - Cn[1], T2[0] - Cn[0]);
    return Array.from({ length: 19 }, (_, i) => { const a = a2 - ((a2 - a1) * i) / 18; return [Cn[0] + r * Math.cos(a), Cn[1] + r * Math.sin(a), z]; });
  };
  const E1 = at(m, len), E2 = at(s, len), zb = -th, inset = th * cl;
  const sh = (p: number[], n: number[], kk: number) => [p[0] - n[0] * kk, p[1] - n[1] * kk];
  const B1 = sh(T1, nm, inset), BE1 = sh(E1, nm, inset), B2 = sh(T2, ns, inset), BE2 = sh(E2, ns, inset);
  const top = [[E2[0], E2[1], 0], [T2[0], T2[1], 0], ...arc(re, 0), [T1[0], T1[1], 0], [E1[0], E1[1], 0], [E1[0], E1[1] - 900, 0], [E2[0], E2[1] - 900, 0]];
  const mainFlank = [[T1[0], T1[1], 0], [E1[0], E1[1], 0], [BE1[0], BE1[1], zb], [B1[0], B1[1], zb]];
  const minorFlank = [[T2[0], T2[1], 0], [E2[0], E2[1], 0], [BE2[0], BE2[1], zb], [B2[0], B2[1], zb]];
  const noseFlank = [...arc(re, 0), ...arc(re - inset, zb).reverse()];
  const edge = [[E2[0], E2[1], 0], [T2[0], T2[1], 0], ...arc(re, 0), [T1[0], T1[1], 0], [E1[0], E1[1], 0]];
  const bottom = [[BE2[0], BE2[1], zb], [B2[0], B2[1], zb], ...arc(re - inset, zb), [B1[0], B1[1], zb], [BE1[0], BE1[1], zb]];
  /** point on the main edge at distance d from the corner tangent point, pushed down the flank by z (z < 0) */
  const onMain = (d: number, z = 0): V3 => { const p = at(m, t + d); const q = sh(p, nm, -z * cl); return [q[0], q[1], z]; };
  /** point on the rake face, d along the main edge and w inward from it */
  const onRake = (d: number, w: number): V3 => { const p = sh(at(m, t + d), nm, w); return [p[0], p[1], 0.3]; };
  return { P, f1, path, m, s, nm, ns, t, Cn, arc, re, th, top, mainFlank, minorFlank, noseFlank, edge, bottom, onMain, onRake, cl };
}
