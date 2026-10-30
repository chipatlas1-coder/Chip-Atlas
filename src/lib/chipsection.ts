/**
 * The uncut chip cross-section in longitudinal turning, from the geometry of the cutting edge alone.
 * Plane of the drawing: z along the axis (the tool feeds towards −z, f per revolution), x the depth below the
 * uncut surface (x = 0 uncut, x = ap the turned diameter). The edge, as projected: a nose arc of radius rε
 * whose lowest point is the tip at (0, ap); the major edge tangent to it at the entering angle κr to the feed
 * direction; the minor edge tangent on the trailing side at κr' (the end cutting edge angle).
 * The tool outline is convex, so at each depth x it spans one interval [a(x), b(x)]; the same tool one
 * revolution earlier spanned [a + f, b + f]. The chip at depth x is therefore [a(x), min(b(x), a(x) + f)]:
 * exact, for any κr (including κr > 90°, whose major edge leans back over the tip). Its area is just under
 * f · ap: the feed scallops left in the surface stay uncut.
 * Chip thickness at a point of the cutting edge: the distance to the surface the previous revolution left.
 */
export interface Edge { ap: number; f: number; re: number; kr: number; krMinor: number }
const rad = (d: number) => (d * Math.PI) / 180;

export function tangents(e: Edge) {
  const k = rad(e.kr), km = rad(e.krMinor);
  return {
    zm: -e.re * Math.sin(k), xm: e.ap - e.re + e.re * Math.cos(k),       // major-edge tangency
    zt: e.re * Math.sin(km), xt: e.ap - e.re + e.re * Math.cos(km),      // minor-edge tangency
  };
}

/** Left (leading) end of the tool at depth x: major edge above its tangency, the nose arc below it. */
export function leftAt(x: number, e: Edge) {
  const { zm, xm } = tangents(e);
  if (x < xm) return Math.abs(e.kr - 90) < 1e-9 ? zm : zm - (xm - x) / Math.tan(rad(e.kr));
  const d = x - (e.ap - e.re);
  return -Math.sqrt(Math.max(0, e.re * e.re - d * d));
}
/** Right (trailing) end of the tool at depth x: minor edge above its tangency, the nose arc below it. */
export function rightAt(x: number, e: Edge) {
  const { zt, xt } = tangents(e);
  if (x < xt) return zt + (xt - x) / Math.tan(rad(e.krMinor));
  const d = x - (e.ap - e.re);
  return Math.sqrt(Math.max(0, e.re * e.re - d * d));
}

export interface Section { area: number; hmax: number; b: number; noseOnly: boolean; chip: [number, number][]; edge: [number, number][]; prev: [number, number][]; engaged: [number, number][] }

export function section(e: Edge, n = 600): Section {
  const L: [number, number][] = [], R: [number, number][] = [], prev: [number, number][] = [], trail: [number, number][] = [];
  let area = 0;
  const dx = e.ap / n;
  for (let i = 0; i <= n; i++) {
    const x = i * dx, a = leftAt(x, e), b = rightAt(x, e), r = Math.min(b, a + e.f);
    if (r <= a) continue;
    L.push([a, x]); R.push([r, x]);
    if (a + e.f <= b) prev.push([a + e.f, x]); else trail.push([b, x]);
  }
  for (let i = 1; i < L.length; i++) area += 0.5 * ((R[i][0] - L[i][0]) + (R[i - 1][0] - L[i - 1][0])) * (L[i][1] - L[i - 1][1]);
  const chip = [...L, ...R.slice().reverse()];
  // cutting edge in contact: the leading boundary all the way, and the trailing nose where it bounds the chip
  const engaged = [...L, ...trail.slice().reverse()];
  // the previous edge continued above the surface, so the thickness at the top corner is measured square to it
  const ext: [number, number][] = [];
  for (let i = 40; i >= 1; i--) { const x = (-e.ap * i) / 40; ext.push([leftAt(x, e) + e.f, x]); }
  const pv = [...ext, ...prev];
  const dist = (p: [number, number]) => {
    let d = Infinity;
    for (let i = 1; i < pv.length; i++) {
      const [ax, ay] = pv[i - 1], [bx, by] = pv[i];
      const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * vx + (p[1] - ay) * vy) / l2));
      d = Math.min(d, Math.hypot(p[0] - ax - t * vx, p[1] - ay - t * vy));
    }
    return d;
  };
  let hmax = 0, b = 0;
  for (let i = 0; i < L.length; i++) hmax = Math.max(hmax, dist(L[i]));
  for (let i = 1; i < engaged.length; i++) b += Math.hypot(engaged[i][0] - engaged[i - 1][0], engaged[i][1] - engaged[i - 1][1]);
  // the whole edge as drawn: major edge from above the surface, the nose, the minor edge
  const edge: [number, number][] = [];
  const top = -0.25 * Math.max(e.ap, e.re);
  for (let i = 0; i <= 120; i++) { const x = top + ((e.ap - top) * i) / 120; edge.push([leftAt(x, e), x]); }
  for (let i = 120; i >= 0; i--) { const x = top + ((e.ap - top) * i) / 120; edge.push([rightAt(x, e), x]); }
  return { area, hmax, b, noseOnly: tangents(e).xm <= 0, chip, edge, prev, engaged };
}
