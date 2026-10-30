/**
 * Ballbar circle, first-order error models (small errors against the radius). The machine is commanded around a
 * circle of radius R in the XY plane, counter-clockwise (dir = +1) or clockwise (dir = −1); each function returns the
 * radial deviation Δr (mm) at the polar angle θ (rad) for one error alone. Sums of them give a combined plot.
 *  - squareness α (rad): actual x = x + α·y          → Δr = R·α·sinθ·cosθ          (same in both directions)
 *  - scale εx, εy (mm/mm): actual x = x(1 + εx) …    → Δr = R(εx·cos²θ + εy·sin²θ)
 *  - servo mismatch Δt (s), Y lagging X: y(t − Δt)   → Δr = −dir·R·ω·Δt·sinθ·cosθ, ω = v/R (flips with direction)
 *  - backlash b (mm) on an axis: the axis lags b/2 behind its commanded position in the direction it moves
 *                                                    → X: Δr = −(b/2)·sign(vx)·cosθ, Y: Δr = −(b/2)·sign(vy)·sinθ
 * These are the textbook small-error forms; they show the shape of each signature, not a measured machine.
 */
export type Dir = 1 | -1;
export const squareness = (R: number, alpha: number, th: number) => R * alpha * Math.sin(th) * Math.cos(th);
export const scale = (R: number, ex: number, ey: number, th: number) => R * (ex * Math.cos(th) ** 2 + ey * Math.sin(th) ** 2);
export const servo = (R: number, v: number, dt: number, th: number, dir: Dir) => -dir * R * (v / 60 / R) * dt * Math.sin(th) * Math.cos(th);
export function backlash(bx: number, by: number, th: number, dir: Dir) {
  const vx = -dir * Math.sin(th), vy = dir * Math.cos(th);           // direction of motion along the circle
  const sx = Math.abs(vx) < 1e-12 ? 0 : Math.sign(vx), sy = Math.abs(vy) < 1e-12 ? 0 : Math.sign(vy);
  return -(bx / 2) * sx * Math.cos(th) - (by / 2) * sy * Math.sin(th);
}
/** Peak-to-valley of a deviation curve sampled over a full turn. */
export function spanOf(f: (th: number) => number, n = 3600) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) { const v = f((2 * Math.PI * i) / n); if (v < lo) lo = v; if (v > hi) hi = v; }
  return hi - lo;
}
