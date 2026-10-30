/**
 * Tapping torque and power, as tap makers print them (LUBERO, "Technology – Calculations"; the same
 * formula in SUHNER's spindle calculator):
 *   Md = kc · P² · d / 8000   [N·m]   kc in N/mm², pitch P and nominal Ø d in mm
 *   Pc = Md · n / 9549        [kW]    (LUBERO and SUHNER print 9500; 60 000 / 2π = 9549.3)
 * Forming taps: about 40–50 % more torque than cutting (Völkel), shown as a factor of 1.4–1.5.
 * The kc values and strength ranges are LUBERO's table, as printed.
 */
export interface Size { name: string; d: number; P: number }
export const SIZES: Size[] = [
  { name: 'M3', d: 3, P: 0.5 }, { name: 'M4', d: 4, P: 0.7 }, { name: 'M5', d: 5, P: 0.8 }, { name: 'M6', d: 6, P: 1 },
  { name: 'M8', d: 8, P: 1.25 }, { name: 'M10', d: 10, P: 1.5 }, { name: 'M12', d: 12, P: 1.75 }, { name: 'M14', d: 14, P: 2 },
  { name: 'M16', d: 16, P: 2 }, { name: 'M20', d: 20, P: 2.5 }, { name: 'M24', d: 24, P: 3 },
];
export interface Mat { k: string; kc: number; rm: string; en: string; tr: string }
export const MATS: Mat[] = [
  { k: 'unalloyed', kc: 2300, rm: '≤ 700', en: 'Unalloyed structural steel', tr: 'Alaşımsız yapı çeliği' },
  { k: 'free', kc: 2300, rm: '≤ 700', en: 'Free-cutting steel', tr: 'Otomat çeliği' },
  { k: 'structural', kc: 2500, rm: '500–950', en: 'Structural steel', tr: 'Yapı çeliği' },
  { k: 'qt', kc: 2600, rm: '500–950', en: 'Quenched and tempered steel, medium strength', tr: 'Islah çeliği, orta dayanım' },
  { k: 'nitriding', kc: 3600, rm: '950–1400', en: 'Nitriding steel, quenched and tempered', tr: 'Nitrürleme çeliği, ıslah edilmiş' },
  { k: 'tool', kc: 3600, rm: '950–1400', en: 'Tool steel', tr: 'Takım çeliği' },
  { k: 'stainless', kc: 3200, rm: '500–950', en: 'Austenitic stainless and acid-resistant steel', tr: 'Östenitik paslanmaz ve aside dayanıklı çelik' },
  { k: 'gg', kc: 1250, rm: '100–400', en: 'Grey cast iron', tr: 'Gri dökme demir' },
  { k: 'gg-alloy', kc: 1600, rm: '150–250', en: 'Alloyed grey cast iron', tr: 'Alaşımlı gri dökme demir' },
  { k: 'malleable', kc: 1100, rm: '350–700', en: 'Malleable cast iron', tr: 'Temper döküm' },
  { k: 'al-long', kc: 800, rm: '≤ 550', en: 'Aluminium alloys, long-chipping', tr: 'Alüminyum alaşımları, uzun talaşlı' },
  { k: 'al-short', kc: 680, rm: '≤ 400', en: 'Aluminium alloys, short-chipping', tr: 'Alüminyum alaşımları, kısa talaşlı' },
  { k: 'cu-long', kc: 1100, rm: '300–700', en: 'Copper alloys, long-chipping', tr: 'Bakır alaşımları, uzun talaşlı' },
  { k: 'cu-short', kc: 720, rm: '≤ 500', en: 'Copper alloys, short-chipping', tr: 'Bakır alaşımları, kısa talaşlı' },
];
export const FORM = [1.4, 1.5];

export const torque = (kc: number, s: Size) => (kc * s.P * s.P * s.d) / 8000;
export const rpm = (vc: number, s: Size) => (1000 * vc) / (Math.PI * s.d);
export const power = (md: number, n: number) => (md * n) / 9549.3;

export interface State { size: number; mat: number; form: boolean; vc: number }
export interface Out { n: number; vf: number; md: [number, number]; pc: [number, number] }
export function compute(st: State): Out {
  const s = SIZES[st.size], kc = MATS[st.mat].kc;
  const m = torque(kc, s), n = rpm(st.vc, s);
  const md: [number, number] = st.form ? [m * FORM[0], m * FORM[1]] : [m, m];
  return { n, vf: s.P * n, md, pc: [power(md[0], n), power(md[1], n)] };
}

/** Round to a sensible number of decimals for display. */
export function fmt(v: number, dec: (s: string) => string) {
  const d = v < 0.1 ? 3 : v < 10 ? 2 : v < 100 ? 1 : 0;
  return dec(v.toFixed(d));
}
export const range = ([a, b]: [number, number], dec: (s: string) => string) => (Math.abs(a - b) < 1e-9 ? fmt(a, dec) : `${fmt(a, dec)}–${fmt(b, dec)}`);

export interface TapLoadText { axis: string; form: string; sel: string }
/**
 * Torque against thread size on a log scale: one stem per size for the chosen material, the forming
 * band above it when forming is on, the chosen size in orange. `grow` (0..1) raises the stems from
 * the floor for the entry animation; `kcFrom` lets a material change glide (values eased by `mix`).
 */
export function drawTapLoad(st: State, T: TapLoadText, narrow: boolean, dec: (s: string) => string, grow = 1, kcFrom?: number, mix = 1) {
  const W = narrow ? 360 : 680, H = narrow ? 300 : 280;
  const L = narrow ? 44 : 58, Rr = narrow ? 12 : 20, Tp = 22, B = narrow ? 34 : 34;
  const lo = Math.log10(0.05), hi = Math.log10(200);
  const y = (v: number) => H - B - ((Math.log10(Math.max(v, 0.05)) - lo) / (hi - lo)) * (H - B - Tp);
  const n = SIZES.length, step = (W - L - Rr) / n, x = (i: number) => L + step * (i + 0.5);
  const kc = MATS[st.mat].kc, kc0 = kcFrom ?? kc, kcNow = kc0 + (kc - kc0) * mix;
  const floor = H - B;
  const yv = (v: number) => floor - (floor - y(v)) * grow;
  const o: string[] = [];
  // grid: decades and the 3s between them
  for (const v of [0.1, 0.3, 1, 3, 10, 30, 100]) {
    const major = [0.1, 1, 10, 100].includes(v);
    o.push(`<line x1="${L}" x2="${W - Rr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="tl-grid${major ? '' : ' minor'}"/>`);
    o.push(`<text x="${L - 7}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end" class="tl-tick">${dec(String(v))}</text>`);
  }
  o.push(`<text x="${L}" y="12" class="tl-tick ax">${T.axis}</text>`);
  // the curve through the cutting values
  const pts = SIZES.map((s, i) => `${x(i).toFixed(1)},${yv(torque(kcNow, s)).toFixed(1)}`);
  o.push(`<polyline points="${pts.join(' ')}" class="tl-curve"/>`);
  SIZES.forEach((s, i) => {
    const m = torque(kcNow, s), on = i === st.size, X = x(i).toFixed(1);
    o.push(`<g class="tl-col${on ? ' on' : ''}" data-size="${i}">`);
    o.push(`<rect x="${(x(i) - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${H - Tp - 4}" class="tl-hit"/>`);
    o.push(`<line x1="${X}" x2="${X}" y1="${floor}" y2="${yv(m).toFixed(1)}" class="tl-stem"/>`);
    if (st.form) o.push(`<line x1="${X}" x2="${X}" y1="${yv(m * FORM[0]).toFixed(1)}" y2="${yv(m * FORM[1]).toFixed(1)}" class="tl-form"/><line x1="${X}" x2="${X}" y1="${yv(m).toFixed(1)}" y2="${yv(m * FORM[0]).toFixed(1)}" class="tl-stem dash"/>`);
    o.push(`<circle cx="${X}" cy="${yv(m).toFixed(1)}" r="${on ? 5 : 3.6}" class="tl-dot"/>`);
    o.push(`<text x="${X}" y="${H - B + 17}" text-anchor="middle" class="tl-tick sz">${s.name}</text>`);
    o.push('</g>');
  });
  // label for the chosen size
  const s = SIZES[st.size], m = torque(kcNow, s), md: [number, number] = st.form ? [m * FORM[0], m * FORM[1]] : [m, m];
  const xs = x(st.size), ys = yv(md[1]) - 12, txt = `${range(md, dec)} N·m`;
  const anchor = xs > W - 90 ? 'end' : xs < L + 60 ? 'start' : 'middle';
  if (grow > 0.98) o.push(`<text x="${xs.toFixed(1)}" y="${Math.max(ys, Tp + 8).toFixed(1)}" text-anchor="${anchor}" class="tl-val">${txt}</text>`);
  return { W, H, svg: o.join('') };
}
