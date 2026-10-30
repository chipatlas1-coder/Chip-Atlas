/**
 * Facing at constant cutting speed. The control holds vc by raising the spindle speed as the
 * diameter falls, n = 1000 · vc / (π · D), until n reaches the set limit; from there n stays at the
 * limit and vc falls in proportion to D, to zero at the centre.
 * Shared by the component's first render (build time) and its script (live updates).
 */
export interface FacingState { vc: number; d0: number; nmax: number; d: number }
export interface FacingText { n: string; vc: string; dia: string; limit: string; face: string; rpm: string; mmin: string }

const f1 = (v: number) => v.toFixed(1);

export function facingAt(s: { vc: number; nmax: number }, d: number) {
  const nFree = d > 0 ? (1000 * s.vc) / (Math.PI * d) : Infinity;
  const n = Math.min(nFree, s.nmax);
  return { nFree, n, vc: (Math.PI * d * n) / 1000 };
}
/** Diameter at which the spindle limit is reached. */
export const clampDia = (s: { vc: number; nmax: number }) => (1000 * s.vc) / (Math.PI * s.nmax);

/** A round tick step so that about four steps cover v, and the axis top it gives. */
const niceAxis = (v: number, steps = 4) => {
  const raw = v / steps, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  return { step, top: Math.ceil(v / step - 1e-9) * step };
};
const ticks = (a: { step: number; top: number }) => Array.from({ length: Math.round(a.top / a.step) + 1 }, (_, i) => +(i * a.step).toFixed(6));

export function drawFacing(s: FacingState, T: FacingText, narrow: boolean, dec: (v: string) => string) {
  const W = narrow ? 360 : 660, H = narrow ? 486 : 290;
  // end view of the face with the tool on a radius below the centre
  const ev = narrow ? { cx: 180, cy: 116, R: 84 } : { cx: 122, cy: 150, R: 100 };
  const rr = (s.d / s.d0) * ev.R;
  // two plots sharing the diameter axis: n above, vc below; D runs from d0 (left) to 0 (right)
  const c = narrow
    ? { x0: 52, x1: 340, n: { y1: 262, y0: 352 }, v: { y1: 376, y0: 446 } }
    : { x0: 310, x1: 640, n: { y1: 40, y0: 150 }, v: { y1: 178, y0: 250 } };
  const Dc = clampDia(s);
  const na = niceAxis(Math.max(s.nmax * 1.15, ((1000 * s.vc) / (Math.PI * s.d0)) * 1.15), 3), nTop = na.top;
  const va = niceAxis(s.vc * 1.08, 3), vTop = va.top;
  const X = (d: number) => c.x0 + (1 - d / s.d0) * (c.x1 - c.x0);
  const Yn = (n: number) => c.n.y0 - (Math.min(n, nTop) / nTop) * (c.n.y0 - c.n.y1);
  const Yv = (v: number) => c.v.y0 - (v / vTop) * (c.v.y0 - c.v.y1);
  const N = 90;
  const curve = (dFrom: number, dTo: number) =>
    Array.from({ length: N + 1 }, (_, i) => { const d = dFrom + ((dTo - dFrom) * i) / N; return `${f1(X(d))},${f1(Yn((1000 * s.vc) / (Math.PI * d)))}`; }).join(' L');
  const dTopN = (1000 * s.vc) / (Math.PI * nTop);
  const freeN = Dc < s.d0 ? `M${curve(Dc, Math.max(dTopN, 0.001))}` : '';
  const actN = Dc < s.d0 ? `M${curve(s.d0, Dc)} L${f1(X(0))},${f1(Yn(s.nmax))}` : `M${f1(X(s.d0))},${f1(Yn(s.nmax))} L${f1(X(0))},${f1(Yn(s.nmax))}`;
  const vStart = Dc < s.d0 ? s.vc : (Math.PI * s.d0 * s.nmax) / 1000;
  const actV = Dc < s.d0
    ? `M${f1(X(s.d0))},${f1(Yv(s.vc))} L${f1(X(Dc))},${f1(Yv(s.vc))} L${f1(X(0))},${f1(Yv(0))}`
    : `M${f1(X(s.d0))},${f1(Yv(vStart))} L${f1(X(0))},${f1(Yv(0))}`;
  const cur = facingAt(s, s.d);
  const o: string[] = [];
  // ---- end view
  o.push(`<circle cx="${ev.cx}" cy="${ev.cy}" r="${ev.R}" class="fs-face"/>`);
  for (let k = 1; k <= 5; k++) o.push(`<circle cx="${ev.cx}" cy="${ev.cy}" r="${f1((ev.R * k) / 6)}" class="fs-ring"/>`);
  o.push(`<line x1="${ev.cx - ev.R - 8}" x2="${ev.cx + ev.R + 8}" y1="${ev.cy}" y2="${ev.cy}" class="fs-mark"/><line x1="${ev.cx}" x2="${ev.cx}" y1="${ev.cy - ev.R - 8}" y2="${ev.cy + ev.R + 8}" class="fs-mark"/>`);
  o.push(`<path d="M${ev.cx - ev.R},${ev.cy} A${ev.R},${ev.R} 0 1,0 ${ev.cx + ev.R},${ev.cy} A${ev.R},${ev.R} 0 1,0 ${ev.cx - ev.R},${ev.cy} Z M${f1(ev.cx - rr)},${ev.cy} A${f1(rr)},${f1(rr)} 0 1,1 ${f1(ev.cx + rr)},${ev.cy} A${f1(rr)},${f1(rr)} 0 1,1 ${f1(ev.cx - rr)},${ev.cy} Z" class="fs-done" fill-rule="evenodd"/>`);
  o.push(`<circle cx="${ev.cx}" cy="${ev.cy}" r="${f1(Math.max(rr, 0.01))}" class="fs-cur"/>`);
  const ty = ev.cy + rr;
  o.push(`<rect x="${ev.cx - 20}" y="${f1(ty + 15)}" width="40" height="${f1(ev.R * 0.5)}" rx="2" class="fs-shank"/>`);
  o.push(`<path d="M${ev.cx},${f1(ty)} L${ev.cx + 13},${f1(ty + 17)} L${ev.cx - 13},${f1(ty + 17)} Z" class="fs-tool"/>`);
  o.push(`<line x1="${ev.cx + 30}" x2="${ev.cx + 30}" y1="${f1(ty + 50)}" y2="${f1(ty + 18)}" class="fs-feed" marker-end="url(#ca-arr-data)"/>`);
  const ra = ev.R + 12;
  o.push(`<path d="M${f1(ev.cx + ra * Math.cos(-1.25))},${f1(ev.cy + ra * Math.sin(-1.25))} A${ra},${ra} 0 0,1 ${f1(ev.cx + ra * Math.cos(-0.35))},${f1(ev.cy + ra * Math.sin(-0.35))}" class="fs-rot" marker-end="url(#ca-arr-acc)"/>`);
  o.push(`<text x="${ev.cx}" y="${f1(ev.cy - ev.R - 16)}" text-anchor="middle" class="fs-t">${T.face}</text>`);
  o.push(`<text x="${f1(ev.cx - Math.max(rr, 10) * 0.7 - 6)}" y="${f1(ev.cy - Math.max(rr, 10) * 0.7 - 4)}" text-anchor="end" class="fs-t dat">D ${dec(s.d.toFixed(0))}</text>`);
  // ---- n plot
  ticks(na).forEach((n) => o.push(`<line x1="${c.x0}" x2="${c.x1}" y1="${f1(Yn(n))}" y2="${f1(Yn(n))}" class="fs-grid"/><text x="${c.x0 - 6}" y="${f1(Yn(n) + 4)}" text-anchor="end" class="fs-tick">${n}</text>`));
  o.push(`<text x="${c.x0}" y="${c.n.y1 - 12}" class="fs-t dat">n (${T.rpm})</text>`);
  o.push(`<line x1="${c.x0}" x2="${c.x1}" y1="${f1(Yn(s.nmax))}" y2="${f1(Yn(s.nmax))}" class="fs-lim"/>`);
  o.push(`<text x="${c.x0 + 6}" y="${f1(Yn(s.nmax) - 6)}" class="fs-t sm">${T.limit} ${s.nmax}</text>`);
  if (freeN) o.push(`<path d="${freeN}" class="fs-free"/>`);
  o.push(`<path d="${actN}" class="fs-n"/>`);
  // ---- vc plot
  ticks(va).forEach((v) => o.push(`<line x1="${c.x0}" x2="${c.x1}" y1="${f1(Yv(v))}" y2="${f1(Yv(v))}" class="fs-grid"/><text x="${c.x0 - 6}" y="${f1(Yv(v) + 4)}" text-anchor="end" class="fs-tick">${dec(String(v))}</text>`));
  o.push(`<text x="${c.x0}" y="${c.v.y1 - 10}" class="fs-t acc">vc (${T.mmin})</text>`);
  o.push(`<path d="${actV}" class="fs-v"/>`);
  // ---- shared diameter axis
  const da = niceAxis(s.d0, 4);
  ticks(da).filter((d) => d <= s.d0 + 1e-9).forEach((d) => o.push(`<text x="${f1(X(d))}" y="${c.v.y0 + 16}" text-anchor="middle" class="fs-tick">${d}</text>`));
  o.push(`<text x="${(c.x0 + c.x1) / 2}" y="${c.v.y0 + 34}" text-anchor="middle" class="fs-t">${T.dia} D (mm) →</text>`);
  if (Dc < s.d0) {
    o.push(`<line x1="${f1(X(Dc))}" x2="${f1(X(Dc))}" y1="${f1(Yn(s.nmax))}" y2="${c.v.y0}" class="fs-dc"/>`);
    // under the flat part of the vc line, left of the limit diameter, so it never sits on the line
    o.push(`<text x="${f1(X(Dc) - 5)}" y="${f1(Math.min(Yv(s.vc) + 14, c.v.y0 - 4))}" text-anchor="end" class="fs-t sm">D ${dec(Dc.toFixed(1))}</text>`);
  }
  // ---- current position, both plots
  const xd = X(s.d);
  o.push(`<line x1="${f1(xd)}" x2="${f1(xd)}" y1="${c.n.y1}" y2="${c.v.y0}" class="fs-now"/>`);
  o.push(`<circle cx="${f1(xd)}" cy="${f1(Yn(cur.n))}" r="4.5" class="fs-dot n"/><circle cx="${f1(xd)}" cy="${f1(Yv(cur.vc))}" r="4.5" class="fs-dot v"/>`);
  o.push(`<rect x="${c.x0}" y="${c.n.y1}" width="${c.x1 - c.x0}" height="${c.v.y0 - c.n.y1}" class="fs-hit" data-hit/>`);
  return { W, H, svg: o.join('') };
}
