/**
 * Trochoidal slotting, plan view. The slot runs along +x with width W; a cutter of diameter D moves its centre on a
 * circle of radius r = (W − D)/2 that advances s along the slot per loop, turning counter-clockwise seen from above:
 *   c(t) = ( s·t/2π + r·sin t , −r·cos t )
 * t = 0 is the bottom of the loop, t = π/2 the front. The engagement at time t is the arc of the cutter's edge that
 * lies in material not yet removed by the cutter's earlier positions (sampled numerically). Pure geometry: no cutting
 * data. Engagement angle φ and the radial width of cut it corresponds to in straight side milling are related by
 * ae = D/2·(1 − cos φ) (φ ≤ 180°).
 */
export interface Pt { x: number; y: number }

export const centre = (t: number, s: number, r: number): Pt => ({ x: (s * t) / (2 * Math.PI) + r * Math.sin(t), y: -r * Math.cos(t) });

/**
 * Engagement (degrees of the cutter's edge in uncut material) over one loop, after `warm` loops. Exact for the sampled
 * history: each earlier cutter disc at distance d < 2R covers the arc of the current edge centred on the direction to
 * it with half-width acos(d / 2R); the covered arcs are merged and what is left is the engagement. The history is
 * sampled finely (opts.dt0, default 0.25° of loop), the output at `n` points per loop. Earlier loops further back than
 * `back` lie behind the previous loop's sweep and cannot touch the current edge.
 */
export function engagementLoop(D: number, W: number, s: number, opts: { n?: number; warm?: number; back?: number; dt0?: number } = {}) {
  const R = D / 2, r = Math.max(0, (W - D) / 2);
  const n = opts.n ?? 120, warm = opts.warm ?? 4, back = opts.back ?? 3;
  const TAU = 2 * Math.PI;
  // history spacing: 0.1° of loop, and never more than 0.5 % of D along the path
  const pathPerRad = Math.hypot(s / TAU, r) + s / TAU;
  const dtH = Math.min(opts.dt0 ?? (0.25 * Math.PI) / 180, (0.005 * D) / Math.max(1e-9, pathPerRad));
  const out: number[] = [];
  const arcs: { from: number; to: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = (warm + i / n) * TAU;
    const c = centre(t, s, r);
    const iv: [number, number][] = [];
    const k0 = Math.max(0, Math.ceil((t - back * TAU) / dtH));
    const k1 = Math.floor(t / dtH - 1e-9);
    for (let k = k0; k <= k1; k++) {
      const tau = k * dtH;
      if (tau >= t) break;
      const p = centre(tau, s, r);
      const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
      if (d >= 2 * R) continue;
      const mid = Math.atan2(dy, dx), half = Math.acos(d / (2 * R));
      let a = mid - half, b = mid + half;
      a = ((a % TAU) + TAU) % TAU; b = a + 2 * half;
      if (b > TAU) { iv.push([a, TAU]); iv.push([0, b - TAU]); } else iv.push([a, b]);
    }
    iv.sort((u, v) => u[0] - v[0]);
    // merge and collect the uncovered gaps on [0, 2π)
    const gaps: [number, number][] = [];
    let cur = 0;
    for (const [a, b] of iv) { if (a > cur) gaps.push([cur, a]); if (b > cur) cur = b; }
    if (cur < TAU) gaps.push([cur, TAU]);
    // join a gap that wraps through 0
    if (gaps.length > 1 && gaps[0][0] === 0 && gaps[gaps.length - 1][1] === TAU) {
      const last = gaps.pop()!; gaps[0] = [last[0] - TAU, gaps[0][1]];
    }
    let total = 0, best: [number, number] = [0, 0];
    for (const g of gaps) { const L = g[1] - g[0]; total += L; if (L > best[1] - best[0]) best = g; }
    out.push((total * 180) / Math.PI);
    arcs.push({ from: (best[0] * 180) / Math.PI, to: (best[1] * 180) / Math.PI });
  }
  const max = Math.max(...out);
  return { deg: out, arcs, max, maxAt: out.indexOf(max), n, r, R };
}

/** Radial width of cut in straight side milling that gives engagement φ (degrees). */
export const aeForAngle = (D: number, phiDeg: number) => (D / 2) * (1 - Math.cos((Math.min(180, phiDeg) * Math.PI) / 180));
/** Engagement angle (degrees) of straight side milling at radial width ae. */
export const angleForAe = (D: number, ae: number) => (Math.acos(Math.max(-1, Math.min(1, 1 - (2 * ae) / D))) * 180) / Math.PI;
/** Length of the centre path per loop (numerical) and the share of it spent cutting (engagement > 0). */
export function pathPerLoop(D: number, W: number, s: number, n = 720) {
  const r = Math.max(0, (W - D) / 2), dt = (2 * Math.PI) / n;
  let L = 0, p = centre(0, s, r);
  for (let i = 1; i <= n; i++) { const q = centre(i * dt, s, r); L += Math.hypot(q.x - p.x, q.y - p.y); p = q; }
  return L;
}
