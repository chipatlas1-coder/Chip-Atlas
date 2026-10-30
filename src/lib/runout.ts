/**
 * Radial runout of a milling cutter, the simple geometric model. The cutter's axis is offset by e from the spindle
 * axis, so a dial indicator on the rotating edge reads TIR = 2e. Tooth i (of z, equally spaced) then sits at radius
 * r_i = R + e·cos(2π·i/z + φ0) from the spindle axis (first order in e/R). Seen along the feed, tooth i reaches
 * x_i = i·fz + r_i; it cuts what the earlier teeth have not reached:
 *   h_i = max(0, x_i − max_{k<i} x_k)
 * the largest chip thickness of tooth i where the edge moves along the feed. The same idea underlies the classic
 * runout models of milling; here it is pure geometry (no deflection, no wear).
 */
export function chipLoads(z: number, fz: number, tir: number, opts: { R?: number; phase?: number; revs?: number } = {}) {
  const R = opts.R ?? 5, e = tir / 2, ph = opts.phase ?? 0, revs = opts.revs ?? 6;
  const r = (i: number) => R + e * Math.cos((2 * Math.PI * (i % z)) / z + ph);
  let best = -Infinity;
  const h: number[] = [];
  for (let i = 0; i < revs * z; i++) {
    const x = i * fz + r(i);
    const hi = Number.isFinite(best) ? Math.max(0, x - best) : 0;
    if (i >= (revs - 1) * z) h.push(hi);
    best = Math.max(best, x);
  }
  return h;
}
/** Largest and smallest load as a share of fz, and how many teeth cut at all. */
export function spread(z: number, fz: number, tir: number) {
  const h = chipLoads(z, fz, tir);
  return { h, max: Math.max(...h) / fz, min: Math.min(...h) / fz, cutting: h.filter((v) => v > 1e-12).length };
}
