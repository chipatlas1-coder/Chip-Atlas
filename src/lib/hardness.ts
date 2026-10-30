/**
 * Hardness testing: Brinell, Vickers and Rockwell arithmetic for the hardness page and its calculator.
 *
 * Brinell (ISO 6506-1, as ZwickRoell and Metkon restate it): HBW = 0.102 · 2F / (π D (D − √(D² − d²))),
 *   F in N, D and d in mm; valid when 0.24 D ≤ d ≤ 0.6 D; test piece at least 8 × the indentation depth.
 *   Depth of the spherical cap: h = (D − √(D² − d²)) / 2 (geometry). Force-diameter index 0.102 · F / D².
 * Vickers (ISO 6507-1): HV = 0.102 · 2F · sin(136°/2) / d² ≈ 0.1891 F / d², d the mean diagonal in mm;
 *   test piece at least 1.5 × the diagonal; ranges by force (ISO 6507-1:2023 Table 1).
 *   Depth of the pyramid: d / (2 √2 tan 68°) ≈ d / 7 (geometry; Instron: "about 1/7").
 * Rockwell (ISO 6508-1, PTB's table): HR = N − h / S, h the permanent depth in mm under the preliminary force;
 *   N = 100 (diamond cone, superficial scales) or 130 (regular ball scales); S = 0.002 mm (regular) or 0.001 mm (superficial).
 */
const DEG = Math.PI / 180;
export const KGF = 9.80665;

/* ---------- Brinell ---------- */
export const BALLS = [10, 5, 2.5, 1];
export const RATIOS = [30, 10, 5, 2.5, 1];
/** Test force in N for ball D (mm) and force-diameter index k: the nominal force k · D² kgf (e.g. 10/3000 = 29.42 kN, ZwickRoell). */
export const brinellForce = (D: number, k: number) => k * D * D * KGF;
export const capDepth = (D: number, d: number) => (D - Math.sqrt(D * D - d * d)) / 2;
export function brinell(F: number, D: number, d: number) {
  const ok = d > 0 && d < D;
  const HBW = ok ? (0.102 * 2 * F) / (Math.PI * D * (D - Math.sqrt(D * D - d * d))) : NaN;
  const h = ok ? capDepth(D, d) : NaN;
  return { HBW, h, minThick: 8 * h, valid: d >= 0.24 * D - 1e-9 && d <= 0.6 * D + 1e-9, dMin: 0.24 * D, dMax: 0.6 * D, spacing: 3 * d, edge: 2.5 * d };
}

/* ---------- Vickers ---------- */
export const VK = (0.102 * 2 * Math.sin(68 * DEG));                  // 0.18909…
/** Common test-force steps (kgf), as the designations HV 0,01 … HV 100 name them. */
export const HV_STEPS = [0.01, 0.025, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 3, 5, 10, 20, 30, 50, 100];
export function vickers(F: number, d1: number, d2: number) {
  const d = (d1 + d2) / 2;
  const HV = d > 0 ? (VK * F) / (d * d) : NaN;
  const range = F >= 49.03 - 1e-6 ? 'macro' : F >= 1.961 - 1e-6 ? 'low' : 'micro';
  return { d, HV, minThick: 1.5 * d, depth: d / (2 * Math.SQRT2 * Math.tan(68 * DEG)), range, inDiag: d >= 0.02 - 1e-9 && d <= 1.4 + 1e-9 };
}

/* ---------- Rockwell ---------- */
export interface Scale { k: string; ind: 'cone' | 'b1' | 'b3'; F0: number; F: number; N: number; S: number }
const C = 'cone' as const, b1 = 'b1' as const, b3 = 'b3' as const;
export const SCALES: Scale[] = [
  { k: 'HRA', ind: C, F0: 98.07, F: 588.4, N: 100, S: 0.002 },
  { k: 'HRBW', ind: b1, F0: 98.07, F: 980.7, N: 130, S: 0.002 },
  { k: 'HRC', ind: C, F0: 98.07, F: 1471, N: 100, S: 0.002 },
  { k: 'HRD', ind: C, F0: 98.07, F: 980.7, N: 100, S: 0.002 },
  { k: 'HREW', ind: b3, F0: 98.07, F: 980.7, N: 130, S: 0.002 },
  { k: 'HRFW', ind: b1, F0: 98.07, F: 588.4, N: 130, S: 0.002 },
  { k: 'HRGW', ind: b1, F0: 98.07, F: 1471, N: 130, S: 0.002 },
  { k: 'HRHW', ind: b3, F0: 98.07, F: 588.4, N: 130, S: 0.002 },
  { k: 'HRKW', ind: b3, F0: 98.07, F: 1471, N: 130, S: 0.002 },
  { k: 'HR15N', ind: C, F0: 29.42, F: 147.1, N: 100, S: 0.001 },
  { k: 'HR30N', ind: C, F0: 29.42, F: 294.2, N: 100, S: 0.001 },
  { k: 'HR45N', ind: C, F0: 29.42, F: 441.3, N: 100, S: 0.001 },
  { k: 'HR15TW', ind: b1, F0: 29.42, F: 147.1, N: 100, S: 0.001 },
  { k: 'HR30TW', ind: b1, F0: 29.42, F: 294.2, N: 100, S: 0.001 },
  { k: 'HR45TW', ind: b1, F0: 29.42, F: 441.3, N: 100, S: 0.001 },
];
export const rockwell = (s: Scale, h: number) => s.N - h / s.S;
export const rockwellDepth = (s: Scale, HR: number) => (s.N - HR) * s.S;

/* ---------- drawing: the indentation in each method ---------- */
const f = (n: number) => n.toFixed(1);
export interface IndText { d: string; h: string; d1: string; d2: string }
/** Brinell: ball pressed into the surface, in section, and the round indentation seen from above; to scale. */
export function drawBrinell(D: number, d: number, T: IndText, dec: (s: string) => string) {
  const W = 300, H = 210, cx = 96, ys = 92, R = 58;                // ball drawn with radius 58 px
  const k = R / (D / 2), rd = (d / 2) * k, h = capDepth(D, Math.min(d, D * 0.999)) * k;
  const o: string[] = [];
  // work with the cap-shaped indentation
  const ang = Math.asin(Math.min(1, rd / R));
  o.push(`<path d="M10,${ys} L${f(cx - rd)},${ys} A${R},${R} 0 0 0 ${f(cx + rd)},${ys} L182,${ys} L182,${H - 14} L10,${H - 14} Z" class="hd-work"/>`);
  // ball, resting in the indentation (centre R − h above the bottom of the cap)
  const bc = ys + h - R;
  o.push(`<circle cx="${cx}" cy="${f(bc)}" r="${R}" class="hd-ball"/>`);
  void ang;
  // d and h dimensions
  o.push(`<line x1="${f(cx - rd)}" x2="${f(cx + rd)}" y1="${ys + 22}" y2="${ys + 22}" class="hd-dim" marker-start="url(#hd-a)" marker-end="url(#hd-a)"/>`);
  o.push(`<line x1="${f(cx - rd)}" x2="${f(cx - rd)}" y1="${ys}" y2="${ys + 26}" class="hd-ext"/><line x1="${f(cx + rd)}" x2="${f(cx + rd)}" y1="${ys}" y2="${ys + 26}" class="hd-ext"/>`);
  o.push(`<text x="${cx}" y="${ys + 38}" text-anchor="middle" class="hd-t">${T.d} = ${dec(d.toFixed(2))} mm</text>`);
  o.push(`<text x="${f(cx + rd + 8)}" y="${f(ys + h / 2 + 4)}" class="hd-t s">${T.h} ${dec(capDepth(D, d).toFixed(3))}</text>`);
  // seen from above: the round indentation and its diameter
  const px = 240, py = 92, pr = Math.max(4, rd * 0.8);
  o.push(`<circle cx="${px}" cy="${py}" r="${f(pr)}" class="hd-print"/><line x1="${f(px - pr)}" x2="${f(px + pr)}" y1="${py}" y2="${py}" class="hd-dim"/>`);
  return { W, H, svg: o.join('') };
}
/** Vickers: the square indentation seen from above, with its two diagonals. */
export function drawVickers(d1: number, d2: number, T: IndText, dec: (s: string) => string) {
  const W = 300, H = 210, cx = 150, cy = 98;
  const m = Math.max(d1, d2), k = 120 / Math.max(m, 0.02);
  const a = (d1 / 2) * k, b = (d2 / 2) * k;
  const o: string[] = [];
  o.push(`<rect x="10" y="10" width="280" height="176" rx="4" class="hd-surf"/>`);
  o.push(`<path d="M${f(cx - a)},${cy} L${cx},${f(cy - b)} L${f(cx + a)},${cy} L${cx},${f(cy + b)} Z" class="hd-print"/>`);
  o.push(`<path d="M${f(cx - a)},${cy} L${cx},${cy} M${cx},${f(cy - b)} L${cx},${cy}" class="hd-edge"/><path d="M${cx},${cy} L${f(cx + a)},${cy} M${cx},${cy} L${cx},${f(cy + b)}" class="hd-edge"/>`);
  o.push(`<line x1="${f(cx - a)}" x2="${f(cx + a)}" y1="${cy}" y2="${cy}" class="hd-diag"/><line x1="${cx}" x2="${cx}" y1="${f(cy - b)}" y2="${f(cy + b)}" class="hd-diag v"/>`);
  o.push(`<text x="${f(cx + a + 6)}" y="${cy + 4}" class="hd-t">${T.d1} ${dec(d1.toFixed(3))}</text><text x="${cx + 6}" y="${f(cy - b - 6)}" class="hd-t v">${T.d2} ${dec(d2.toFixed(3))}</text>`);
  return { W, H, svg: o.join('') };
}

/* ---------- Rockwell test cycle (schematic depths) ---------- */
/** Phase times (s) of the figure: approach, preliminary force, application of the additional force, dwell, removal, reading. */
export const RC = { t0: 0.4, t1: 1.6, t2: 3.4, t3: 5.4, t4: 6.4, end: 7.6 };
/** Depth of the indenter (mm, below its position under F0) at time t, for permanent depth h; the elastic part is drawn as 0.45 h and the F0 seating depth as 0.35 h (not to scale). */
export function rcDepth(t: number, h: number) {
  const e0 = 0.35 * h, he = 0.45 * h;                                  // below the surface; the F0 datum is at e0
  const s = (u: number) => u * u * (3 - 2 * u);
  if (t < RC.t0) return null;                                          // indenter not yet on the surface
  if (t < RC.t1) return -e0 + e0 * s(Math.min(1, (t - RC.t0) / 0.6)); // F0 applied: seats to the datum (0)
  if (t < RC.t2) return h + he - (h + he) * (1 - s((t - RC.t1) / (RC.t2 - RC.t1)));
  if (t < RC.t3) return h + he + 0.04 * h * ((t - RC.t2) / (RC.t3 - RC.t2)); // creep while F is held
  if (t < RC.t4) return h + (he + 0.04 * h) * (1 - s((t - RC.t3) / (RC.t4 - RC.t3)));   // elastic recovery back to the permanent depth h
  return h;
}
export interface RcText { depth: string; time: string; f0: string; f: string; datum: string; hold: string; read: string }
export function drawRockwellCycle(tNow: number, sc: Scale, h: number, T: RcText, dec: (s: string) => string, narrow: boolean) {
  const W = narrow ? 360 : 660, H = narrow ? 250 : 260, L = narrow ? 46 : 60, R = narrow ? 12 : 120, top = 30, bot = H - 38;
  const yMax = 1.55 * h, yMin = -0.45 * h;
  const X = (t: number) => L + (t / RC.end) * (W - L - R);
  const Y = (d: number) => top + ((d - yMin) / (yMax - yMin)) * (bot - top);
  const o: string[] = [];
  // phase bands
  const bands: [number, number, string, string][] = [[RC.t0, RC.t1, T.f0, 'p0'], [RC.t1, RC.t3, T.f, 'p1'], [RC.t3, RC.end, T.f0, 'p0']];
  bands.forEach(([a, b, lab, c]) => {
    o.push(`<rect x="${f(X(a))}" y="${top}" width="${f(X(b) - X(a))}" height="${bot - top}" class="rc-band ${c}"/>`);
    o.push(`<text x="${f((X(a) + X(b)) / 2)}" y="${top - 10}" text-anchor="middle" class="rc-bl ${c}">${lab}</text>`);
  });
  // datum (depth under F0 before the additional force) and axes
  o.push(`<line x1="${L}" x2="${W - R}" y1="${f(Y(0))}" y2="${f(Y(0))}" class="rc-datum"/>`);
  if (!narrow) o.push(`<text x="${W - R + 6}" y="${f(Y(0) + 4)}" class="rc-t s">${T.datum}</text>`);
  o.push(`<line x1="${L}" x2="${L}" y1="${top}" y2="${bot}" class="rc-axis"/><line x1="${L}" x2="${W - R}" y1="${bot}" y2="${bot}" class="rc-axis"/>`);
  o.push(`<text x="${narrow ? L + 4 : L - 8}" y="${narrow ? top + 12 : top + 4}" text-anchor="${narrow ? 'start' : 'end'}" class="rc-t s">${T.depth}</text><text x="${W - R}" y="${H - 8}" text-anchor="end" class="rc-t s">${T.time}</text>`);
  o.push(`<text x="${L - 8}" y="${bot - 4}" text-anchor="end" class="rc-t s">↓</text>`);
  // the curve up to tNow
  const pts: string[] = [];
  for (let t = RC.t0; t <= Math.min(tNow, RC.end) + 1e-9; t += 0.04) { const d = rcDepth(t, h); if (d !== null) pts.push(`${f(X(t))},${f(Y(d))}`); }
  if (pts.length > 1) o.push(`<path d="M${pts.join(' L')}" class="rc-curve"/>`);
  const dNow = rcDepth(Math.min(tNow, RC.end), h);
  if (dNow !== null && tNow < RC.end) o.push(`<circle cx="${f(X(Math.min(tNow, RC.end)))}" cy="${f(Y(dNow))}" r="4" class="rc-dot"/>`);
  // the reading: h between the datum and the final depth, once the additional force is off
  if (tNow >= RC.t4) {
    const xh = X(RC.t4 + 0.55);
    o.push(`<line x1="${f(X(RC.t4))}" x2="${W - R}" y1="${f(Y(h))}" y2="${f(Y(h))}" class="rc-final"/>`);
    o.push(`<line x1="${f(xh)}" x2="${f(xh)}" y1="${f(Y(0))}" y2="${f(Y(h))}" class="rc-h" marker-start="url(#rc-a)" marker-end="url(#rc-a)"/>`);
    o.push(narrow
      ? `<text x="${f(xh - 8)}" y="${f((Y(0) + Y(h)) / 2 + 4)}" text-anchor="end" class="rc-t h">h = ${dec(h.toFixed(3))} mm</text>`
      : `<text x="${f(xh + 8)}" y="${f((Y(0) + Y(h)) / 2 + 4)}" class="rc-t h">h = ${dec(h.toFixed(3))} mm</text>`);
  }
  // timing notes (ISO 6508-1, as NPL restates it)
  if (!narrow) {
    o.push(`<text x="${f((X(RC.t1) + X(RC.t2)) / 2)}" y="${bot + 16}" text-anchor="middle" class="rc-t s">1–8 s</text>`);
    o.push(`<text x="${f((X(RC.t2) + X(RC.t3)) / 2)}" y="${bot + 16}" text-anchor="middle" class="rc-t s">${T.hold}</text>`);
    o.push(`<text x="${f((X(RC.t0) + X(RC.t1)) / 2)}" y="${bot + 16}" text-anchor="middle" class="rc-t s">≤ 3 s</text>`);
  }
  void sc;
  return { W, H, svg: o.join('') };
}
