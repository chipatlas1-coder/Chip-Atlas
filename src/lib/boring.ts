/**
 * Boring-bar deflection as a cantilever (Kennametal's calculator; E. Isakov, Cutting Tool Engineering 2019):
 *   δ = F · L³ / (3 · E · I),  I = π · D⁴ / 64 (solid bar) or π · (D⁴ − Di⁴) / 64 (bar with a coolant bore)
 * with the tip load F (N), overhang L (mm), modulus E (N/mm²) and bar diameter D (mm); δ in mm.
 * The deflected line of a cantilever with an end load: y(x) = F · x² · (3L − x) / (6 · E · I).
 * Moduli as Kennametal states them for its own bars: steel 206,843, heavy metal 330,948, carbide 551,581 N/mm².
 * Longest overhangs drawn as guides: Sandvik Coromant's training handbook (steel 4 × D, carbide 6 × D) and,
 * for heavy metal, Kennametal's 4:1 to 6:1 (trade press, 2008).
 */
export type Mat = 'steel' | 'heavy' | 'carbide';
export const E: Record<Mat, number> = { steel: 206843, heavy: 330948, carbide: 551581 };
export const LIMIT: Record<Mat, number> = { steel: 4, heavy: 6, carbide: 6 };
export const inertia = (D: number, Di = 0) => (Math.PI * (D ** 4 - Di ** 4)) / 64;
export const deflection = (F: number, L: number, mat: Mat, D: number, Di = 0) => (F * L ** 3) / (3 * E[mat] * inertia(D, Di));
export const shape = (F: number, L: number, mat: Mat, D: number, x: number, Di = 0) => (F * x * x * (3 * L - x)) / (6 * E[mat] * inertia(D, Di));

export interface BState { mat: Mat; D: number; ld: number; F: number }
export interface BText { clamp: string; ld: string; mag: string; force: string; limit: string; steel: string; heavy: string; carbide: string; yAxis: string; xAxis: string }
const f = (n: number) => n.toFixed(1);

/** Side view of the bar: clamp (4 × D), the overhang, the straight line and the deflected line (magnified), the force. */
export function drawBar(s: BState, T: BText, narrow: boolean, dec: (v: string) => string, bend = 1) {
  const W = narrow ? 360 : 400, H = narrow ? 210 : 230;
  const x0 = narrow ? 70 : 84, x1 = W - 24, yAx = 92;
  const L = s.ld * s.D, clampL = 4 * s.D;
  const k = (x1 - x0) / Math.max(L, 10 * s.D);                     // px per mm: 10 × D always fits
  const r = Math.max(4, (s.D / 2) * k);
  const d = deflection(s.F, L, s.mat, s.D);
  const tipFull = 34;                                              // the tip is drawn 34 px down, whatever δ is
  const mag = d > 0 ? tipFull / (d * k) : 1;
  const tipPx = tipFull * bend;
  const o: string[] = [];
  // clamp: a block holding 4 × D of the shank (drawn to the same scale, cut off at the left edge)
  const cw = Math.min(clampL * k, x0 - 8);
  o.push(`<rect x="${f(x0 - cw)}" y="${f(yAx - r - 14)}" width="${f(cw)}" height="${f(2 * r + 28)}" rx="3" class="bd-clamp"/>`);
  o.push(`<text x="${f(x0 - cw / 2)}" y="${f(yAx + r + 30)}" text-anchor="middle" class="bd-t s">${T.clamp}</text>`);
  // the bar, straight (dashed) and deflected (solid, magnified)
  o.push(`<line x1="${x0}" x2="${f(x0 + L * k)}" y1="${yAx}" y2="${yAx}" class="bd-axis"/>`);
  const N = 40, top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * L, y = shape(s.F, L, s.mat, s.D, x) * k * mag * bend;
    const xp = x0 + x * k;
    top.push(`${f(xp)},${f(yAx - r + y)}`); bot.push(`${f(xp)},${f(yAx + r + y)}`);
  }
  o.push(`<path d="M${f(x0 - cw)},${f(yAx - r)} L${top.join(' L')} L${bot.reverse().join(' L')} L${f(x0 - cw)},${f(yAx + r)} Z" class="bd-bar ${s.mat}"/>`);
  // insert at the tip and the radial force pushing the bar away from the wall
  const tx = x0 + L * k, ty = yAx + tipPx;
  o.push(`<path d="M${f(tx - 2)},${f(ty - r)} L${f(tx + 9)},${f(ty - r - 9)} L${f(tx + 9)},${f(ty - r + 3)} Z" class="bd-ins"/>`);
  o.push(`<line x1="${f(tx + 4)}" x2="${f(tx + 4)}" y1="${f(ty - r - 44)}" y2="${f(ty - r - 12)}" class="bd-force" marker-end="url(#bd-arr)"/>`);
  o.push(`<text x="${f(tx - 2)}" y="${f(ty - r - 48)}" text-anchor="end" class="bd-t f">F = ${s.F} N</text>`);
  // δ at the tip
  o.push(`<line x1="${f(tx + 14)}" x2="${f(tx + 14)}" y1="${yAx}" y2="${f(ty)}" class="bd-dim" marker-start="url(#bd-d)" marker-end="url(#bd-d)"/>`);
  // L/D ticks under the bar, with the guide limit for this material
  const yT = yAx + r + 52;
  for (let j = 0; j <= 10; j++) {
    const x = x0 + j * s.D * k;
    o.push(`<line x1="${f(x)}" x2="${f(x)}" y1="${yT - 4}" y2="${yT + 4}" class="bd-tick"/>`);
    if (!narrow || j % 2 === 0) o.push(`<text x="${f(x)}" y="${yT + 16}" text-anchor="middle" class="bd-t s">${j}</text>`);
  }
  o.push(`<line x1="${x0}" x2="${f(x0 + 10 * s.D * k)}" y1="${yT}" y2="${yT}" class="bd-tick"/>`);
  const lim = x0 + LIMIT[s.mat] * s.D * k;
  o.push(`<rect x="${x0}" y="${yT - 3}" width="${f(lim - x0)}" height="6" rx="3" class="bd-ok"/>`);
  o.push(`<line x1="${f(lim)}" x2="${f(lim)}" y1="${yT - 10}" y2="${yT + 4}" class="bd-lim"/>`);
  o.push(`<text x="${f(x0 - 8)}" y="${yT + 4}" text-anchor="end" class="bd-t s">${T.ld}</text>`);
  o.push(`<text x="${f(x0 + 2)}" y="16" class="bd-t s">${T.mag} × ${Math.round(mag)}</text>`);
  return { W, H, svg: o.join(''), d, mag };
}

/** δ against L/D (log scale) for the three bar materials at the chosen D and F, with the current point. */
export function drawCurve(s: BState, T: BText, narrow: boolean, dec: (v: string) => string) {
  const W = narrow ? 360 : 260, H = narrow ? 200 : 230, L = 42, R = 10, top = 22, bot = H - 30;
  const xs = (ld: number) => L + ((ld - 1) / 9) * (W - L - R);
  const vals = (['steel', 'heavy', 'carbide'] as Mat[]).flatMap((m) => [1, 10].map((ld) => deflection(s.F, ld * s.D, m, s.D) * 1000));
  const lo = Math.pow(10, Math.floor(Math.log10(Math.max(1e-3, Math.min(...vals))))), hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...vals))));
  const ys = (um: number) => bot - ((Math.log10(um) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (bot - top);
  const o: string[] = [];
  for (let p = Math.log10(lo); p <= Math.log10(hi) + 1e-9; p++) {
    const v = Math.pow(10, p);
    o.push(`<line x1="${L}" x2="${W - R}" y1="${f(ys(v))}" y2="${f(ys(v))}" class="bd-grid"/>`);
    o.push(`<text x="${L - 5}" y="${f(ys(v) + 4)}" text-anchor="end" class="bd-t s">${v >= 1 ? v : dec(String(v))}</text>`);
  }
  [1, 2, 4, 6, 8, 10].forEach((ld) => o.push(`<text x="${f(xs(ld))}" y="${bot + 14}" text-anchor="middle" class="bd-t s">${ld}</text>`));
  o.push(`<text x="${L - 5}" y="12" text-anchor="end" class="bd-t s">${T.yAxis}</text><text x="${W - R}" y="${H - 4}" text-anchor="end" class="bd-t s">${T.xAxis}</text>`);
  (['steel', 'heavy', 'carbide'] as Mat[]).forEach((m) => {
    const pts: string[] = [];
    for (let i = 0; i <= 45; i++) { const ld = 1 + (i / 45) * 9; pts.push(`${f(xs(ld))},${f(ys(deflection(s.F, ld * s.D, m, s.D) * 1000))}`); }
    o.push(`<path d="M${pts.join(' L')}" class="bd-c ${m}${m === s.mat ? ' on' : ''}"/>`);

  });
  // legend, bottom right (the curves rise to the right, so this corner stays clear)
  (['steel', 'heavy', 'carbide'] as Mat[]).forEach((m, i) => {
    const y = bot - 40 + i * 14, x = W - R - 92;
    o.push(`<line x1="${x}" x2="${x + 14}" y1="${y - 4}" y2="${y - 4}" class="bd-c ${m} on"/><text x="${x + 19}" y="${y}" class="bd-t c ${m}">${T[m]}</text>`);
  });
  const cur = deflection(s.F, s.ld * s.D, s.mat, s.D) * 1000;
  o.push(`<circle cx="${f(xs(s.ld))}" cy="${f(ys(Math.max(cur, lo)))}" r="4.5" class="bd-dot ${s.mat}"/>`);
  return { W, H, svg: o.join('') };
}
