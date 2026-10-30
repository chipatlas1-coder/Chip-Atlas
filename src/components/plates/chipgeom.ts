/**
 * Orthogonal cutting geometry for the plates. Tool tip T on the cut line, rake angle `rake`
 * (deg, textbook α), shear angle `phi` (deg). The chip's free side passes through S, the point
 * where the shear plane meets the free surface; hc = h·cos(φ − α)/sin φ.
 */
export type Pt = [number, number];
export function chipGeom(o: { T: Pt; h: number; rake: number; phi: number; contact: number; curlR: number; sweep: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const al = r(o.rake), ph = r(o.phi);
  const T = o.T, h = o.h;
  const S: Pt = [T[0] - h / Math.tan(ph), T[1] - h];
  const hc = (h * Math.cos(ph - al)) / Math.sin(ph);
  const u: Pt = [Math.sin(al), -Math.cos(al)];
  const n: Pt = [-Math.cos(al), -Math.sin(al)];
  const add = (p: Pt, q: Pt, k = 1): Pt => [p[0] + k * q[0], p[1] + k * q[1]];
  const contactEnd = add(T, u, o.contact);
  const cIn = add(contactEnd, n, hc);
  const C = add(cIn, n, o.curlR);
  const a0 = Math.atan2(-n[1], -n[0]);
  const arc = (rr: number, steps = 24): Pt[] => Array.from({ length: steps + 1 }, (_, i) => { const a = a0 + (r(o.sweep) * i) / steps; return [C[0] + rr * Math.cos(a), C[1] + rr * Math.sin(a)] as Pt; });
  const f = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const outer = arc(o.curlR + hc), inner = arc(o.curlR);
  const chip = `M${f(S)} L${f(T)} L${f(contactEnd)} ${outer.map((p) => 'L' + f(p)).join(' ')} ${[...inner].reverse().map((p) => 'L' + f(p)).join(' ')} Z`;
  /** Streamline of the layer at depth fraction k (0 free surface, 1 cut line), starting at x0. */
  const stream = (k: number, x0: number, frac = 0.85) => {
    const P = add(S, [T[0] - S[0], T[1] - S[1]], k);
    const Q = add(cIn, n, -k * hc);
    const a = arc(o.curlR + k * hc, 24).slice(0, Math.round(24 * frac));
    return `M${x0},${(S[1] + k * h).toFixed(1)} L${f(P)} L${f(Q)} ${a.map((p) => 'L' + f(p)).join(' ')}`;
  };
  return { S, T, hc, u, n, add, f, contactEnd, cIn, C, outer, inner, chip, stream };
}
