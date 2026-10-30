/**
 * How deep to drill a blind hole for tapping. The full thread must reach depth L; the tap's chamfer
 * (n threads, the upper end of the makers' range for each DIN 2197 form) leaves incomplete threads
 * below that, so the tap's tip goes n·P deeper; Haas asks for the hole to be drilled at least
 * 0.050 in (1.27 mm) deeper than the tap is programmed to go; a 118° drill point adds D/2 / tan 59°.
 * Tap drills: DIN 336 coarse series (the tap-drill-sizes page).
 */
import { SIZES } from './tapload.ts';
export { SIZES };
export const DRILL: Record<string, number> = { M3: 2.5, M4: 3.3, M5: 4.2, M6: 5.0, M8: 6.8, M10: 8.5, M12: 10.2, M14: 12.0, M16: 14.0, M20: 17.5, M24: 21.0 };
export const FORMS = [
  { k: 'B', range: '3.5–5', n: 5 },
  { k: 'C', range: '2–3', n: 3 },
  { k: 'E', range: '1.5–2', n: 2 },
];
export const CLEAR = 0.05 * 25.4;                      // Haas: at least 0.050 in beyond the programmed tap depth
export interface BState { size: number; form: number; k: number }   // k: full-thread depth in diameters
export function depths(st: BState) {
  const s = SIZES[st.size], D = DRILL[s.name], n = FORMS[st.form].n;
  const L = st.k * s.d, cham = n * s.P, tap = L + cham, cyl = tap + CLEAR, point = D / 2 / Math.tan((59 * Math.PI) / 180);
  return { s, D, n, L, cham, tap, cyl, point, total: cyl + point };
}
export interface BText { thread: string; cham: string; clear: string; point: string; total: string; tap: string }
/** Section of the hole with the dimension chain; proportions to scale (the drawing is scaled to fit). */
export function drawBlind(st: BState, T: BText, narrow: boolean, dec: (s: string) => string) {
  const v = depths(st);
  const W = narrow ? 360 : 660, Hmax = narrow ? 400 : 330;
  const top = 34, avail = Hmax - top - 44;
  const fb = narrow ? 2.4 : 3.2;                                   // block half-width in major radii
  const leftW = narrow ? 14 : 124, rightW = narrow ? 138 : 176, gap = narrow ? 16 : 24;
  const kW = (W - leftW - gap - rightW) / (2 * fb * (v.s.d / 2));
  const k = Math.min(avail / v.total, kW);
  const bot = top + v.total * k + 26, H = Math.round(bot + 12);
  const rM0 = (v.s.d / 2) * k, bw = Math.max(rM0 * fb, 40);
  const cx = leftW + bw, rD = (v.D / 2) * k, rM = rM0;
  const y = (mm: number) => top + mm * k;
  const f = (n: number) => n.toFixed(1);
  const num = (mm: number) => dec(mm.toFixed(2));                  // two decimals, so the chain adds up to the readouts
  const o: string[] = [];
  // block with the hole cut out, in section
  const pitch = v.s.P * k;
  const wallPts = (s: number) => {
    const q: string[] = [];
    const steps = Math.max(2, Math.round(v.tap / (v.s.P / 2)));
    for (let i = 0; i <= steps; i++) {
      const mm = Math.min(v.tap, (i * v.s.P) / 2);
      const full = mm <= v.L ? 1 : Math.max(0, 1 - (mm - v.L) / v.cham);
      const r = i % 2 === 0 ? rD : rD + (rM - rD) * full;
      q.push(`${f(cx + s * r)},${f(y(mm))}`);
    }
    q.push(`${f(cx + s * rD)},${f(y(v.cyl))}`);
    return q;
  };
  const L = wallPts(-1), Rr = wallPts(1);
  o.push(`<path d="M${f(cx - bw)},${f(y(0))} L${L.join(' L')} L${f(cx)},${f(y(v.total))} L${[...Rr].reverse().join(' L')} L${f(cx + bw)},${f(y(0))} L${f(cx + bw)},${f(bot)} L${f(cx - bw)},${f(bot)} Z" class="bh-work"/>`);
  o.push(`<line x1="${cx}" x2="${cx}" y1="${f(top - 14)}" y2="${f(bot)}" class="bh-axis"/>`);
  // the tap at its programmed depth: major Ø down to the chamfer, then the cone to the tip
  const r0 = rD * 0.94, yc = y(v.L), yt = y(v.tap);
  o.push('<g class="bh-tapg">');
  o.push(`<path d="M${f(cx - rM)},${f(top - 16)} L${f(cx - rM)},${f(yc)} L${f(cx - r0)},${f(yt)} L${f(cx + r0)},${f(yt)} L${f(cx + rM)},${f(yc)} L${f(cx + rM)},${f(top - 16)}" class="bh-tap"/>`);
  o.push(`<path d="M${f(cx - rM)},${f(yc)} L${f(cx - r0)},${f(yt)} M${f(cx + rM)},${f(yc)} L${f(cx + r0)},${f(yt)}" class="bh-cham"/>`);
  o.push('</g>');
  void pitch;
  // dimension chain on the right: thread, chamfer, clearance, point; total on the left
  const xd = cx + bw + gap;
  let nd = 0;                                                       // order of appearance (entry animation)
  const dim = (a: number, b: number, x: number, cls: string, label: string, side: 1 | -1, ty?: number) => {
    const ya = y(a), yb = y(b), mid = (ya + yb) / 2;
    o.push(`<g class="bh-d ${cls}" style="--i:${nd++}">`);
    o.push(`<path d="M${f(x - 5)},${f(ya)} H${f(x + 5)} M${f(x - 5)},${f(yb)} H${f(x + 5)} M${f(x)},${f(ya)} V${f(yb)}" class="bh-dim ${cls}"/>`);
    const tx = side > 0 ? x + 12 : x - 10, yy = ty ?? mid;
    if (ty !== undefined && Math.abs(ty - mid) > 1) o.push(`<path d="M${f(x + 1)},${f(mid)} L${f(x + 8)},${f(yy)}" class="bh-ext"/>`);
    o.push(`<text x="${f(tx)}" y="${f(yy + 4)}" text-anchor="${side > 0 ? 'start' : 'end'}" class="bh-t ${cls}">${label}</text>`);
    o.push('</g>');
  };
  // right-hand labels: at the middle of each span, pushed apart where spans are short
  const spans = [
    { a: 0, b: v.L, cls: 'thr', t: `${T.thread} ${num(v.L)}` },
    { a: v.L, b: v.tap, cls: 'acc', t: `${T.cham} ${num(v.cham)}` },
    { a: v.tap, b: v.cyl, cls: 'clr', t: `${T.clear} ${num(CLEAR)}` },
    { a: v.cyl, b: v.total, cls: 'pt', t: `${T.point} ${num(v.point)}` },
  ];
  const ys = spans.map((sp) => (y(sp.a) + y(sp.b)) / 2);
  for (let i = 1; i < ys.length; i++) if (ys[i] < ys[i - 1] + 15) ys[i] = ys[i - 1] + 15;
  spans.forEach((sp, i) => dim(sp.a, sp.b, xd, sp.cls, sp.t, 1, ys[i]));
  const xl = cx - bw - 22;
  if (!narrow) {
    dim(0, v.cyl, xl, 'tot', `${num(v.cyl)}`, -1);
    dim(0, v.tap, xl - 50, 'tap', `${num(v.tap)}`, -1);
    // headers: the tap's ends at its dimension line, the drill's starts at its line, so long words do not collide
    o.push(`<g class="bh-d tap" style="--i:${nd}"><text x="${f(xl - 46)}" y="${f(top - 18)}" text-anchor="end" class="bh-t tap sm">${T.tap}</text></g>`);
    o.push(`<g class="bh-d tot" style="--i:${nd}"><text x="${f(xl - 4)}" y="${f(top - 18)}" text-anchor="start" class="bh-t tot sm">${T.total}</text></g>`);
  }
  // extension lines from the hole to the dimensions
  o.push('<g class="bh-exts">');
  for (const mm of [v.L, v.tap, v.cyl, v.total]) o.push(`<line x1="${f(cx + rD + 4)}" x2="${f(xd + 6)}" y1="${f(y(mm))}" y2="${f(y(mm))}" class="bh-ext"/>`);
  if (!narrow) for (const mm of [v.tap, v.cyl]) o.push(`<line x1="${f(xl - (mm === v.tap ? 56 : 6))}" x2="${f(cx - rD - 4)}" y1="${f(y(mm))}" y2="${f(y(mm))}" class="bh-ext"/>`);
  o.push('</g>');
  return { W, H, svg: o.join(''), v };
}
