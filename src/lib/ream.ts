/**
 * Reaming: the reamer's diameter limits for a given hole (ISO 522:1975, section 2) and the stock
 * allowance before reaming as four sources print it. Drawing helpers for the two interactive figures
 * on the reaming page (ReamTolerance, ReamAllowance); the server renders the first state and the
 * page script redraws with the same functions.
 *
 * ISO 522, sec. 2.1: high limit of the reamer = maximum hole diameter − 0.15 IT; low limit = the
 * reamer's maximum − 0.35 IT; both values "rounded upwards to a whole multiple of 0,001 mm".
 * Unless otherwise ordered, reamers are made to m6 (the standard stock grade).
 */
import { itValue, holeDeviations, shaftDeviations } from '../data/iso286.js';

export const HOLES = ['H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'G7', 'F7', 'JS7', 'K7', 'N7', 'P7'];

/** Round up to whole micrometres, ignoring floating-point noise (0.15 × 20 = 3.0000000000000004). */
export const ceilUm = (v: number) => Math.ceil(v - 1e-9);

export interface ReamLimits {
  D: number; cls: string; IT: number; ES: number; EI: number;
  a: number; b: number; hi: number; lo: number; rest: number; m6: { es: number; ei: number };
}
/** Limits in µm relative to the nominal size D (mm), for a hole class such as 'H7'. */
export function reamerLimits(D: number, cls: string): ReamLimits | null {
  const m = cls.match(/^(JS|[A-Z])(\d+)$/);
  if (!m) return null;
  const grade = Number(m[2]);
  const dev = holeDeviations(m[1], grade, D) as { ES: number; EI: number } | null;
  const IT = itValue(grade, D) as number;
  if (!dev || !Number.isFinite(IT)) return null;
  const a = ceilUm(0.15 * IT), b = ceilUm(0.35 * IT);
  const ES = dev.ES || 0, EI = dev.EI || 0;                       // no −0 from the h/H position
  const hi = ES - a, lo = hi - b;
  const m6 = shaftDeviations('m', 6, D) as { es: number; ei: number };
  return { D, cls, IT, ES, EI, a, b, hi, lo, rest: lo - EI, m6 };
}

/* ---------- stock allowance before reaming, on diameter, mm ---------- */
const IN = 25.4;
export interface Band { from: number; to: number; lo: number; hi: number; txt?: string }
/** Gühring, catalogue "Reamers, countersinks, de-burring tools", p. 13, "Recommended stock allowance, in mm". */
export const GUEHRING: Record<'all' | 'h48' | 'h63', Band[]> = (() => {
  const edges = [0, 6, 10, 16, 25, 40, 50];
  const rows = {
    all: [[0.1, 0.2], [0.2, 0.2], [0.2, 0.3], [0.3, 0.3], [0.3, 0.4], [0.4, 0.5]],
    h48: [[0.1, 0.2], [0.2, 0.2], [0.2, 0.2], [0.2, 0.2], [0.3, 0.3], [0.3, 0.3]],
    h63: [[0.1, 0.1], [0.1, 0.1], [0.1, 0.2], [0.2, 0.2], [0.2, 0.2], [0.2, 0.2]],
  };
  const out = {} as Record<'all' | 'h48' | 'h63', Band[]>;
  (Object.keys(rows) as (keyof typeof rows)[]).forEach((k) => {
    out[k] = rows[k].map(([lo, hi], i) => ({ from: edges[i], to: edges[i + 1], lo, hi }));
  });
  return out;
})();
/** Newman Tools "Reaming Recommendations" (same sheet as ICS Cutting Tools), stock by reamer Ø, inch. */
export const NEWMAN: Band[] = [
  [0, 1 / 16, 0.003, 0.005], [1 / 16, 1 / 8, 0.004, 0.008], [1 / 8, 1 / 4, 0.006, 0.012],
  [1 / 4, 3 / 8, 0.008, 0.014], [3 / 8, 1 / 2, 0.01, 0.015], [1 / 2, 3 / 4, 0.012, 0.018],
].map(([a, b, lo, hi]) => ({ from: a * IN, to: b * IN, lo: lo * IN, hi: hi * IN, txt: `.${String(Math.round(lo * 1000)).padStart(3, '0')}–.${String(Math.round(hi * 1000)).padStart(3, '0')} in` }));
/** Kennametal Tech Tip #8: "<1/4” = .010”", "¼” to ½” = .015”", "½” to 1-1/2” = .025”". */
export const KMT: Band[] = [
  [0, 1 / 4, 0.01], [1 / 4, 1 / 2, 0.015], [1 / 2, 1.5, 0.025],
].map(([a, b, v]) => ({ from: a * IN, to: b * IN, lo: v * IN, hi: v * IN, txt: `.${String(Math.round(v * 1000)).padStart(3, '0')} in` }));
/** Kennametal blog: drill "approximately 3% smaller than the finished hole". */
export const KMT_PCT = 0.03;
/** Hoffmann Group data sheets, per tool: [Ø, lo, hi]. */
export const HOFFMANN: [number, number, number][] = [[11.5, 0.1, 0.2], [13, 0.2, 0.2], [14, 0.2, 0.3], [28, 0.3, 0.5]];

/** Band containing d; the upper edge belongs to the band ("up to and including"), except Kennametal's first (“<1/4”). */
export function bandAt(bands: Band[], d: number, openFirst = false): Band | null {
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const inLow = i === 0 ? d > 0 : d > b.from;
    const inHigh = openFirst && i === 0 ? d < b.to : d <= b.to + 1e-9;
    if (inLow && inHigh) return b;
  }
  return null;
}
export const kmtAt = (d: number) => bandAt(KMT, d, true) ?? (Math.abs(d - IN / 4) < 1e-9 ? KMT[1] : null);

/* ---------- drawing ---------- */
type Dec = (s: string) => string;
const f = (n: number) => n.toFixed(1);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export interface TolText { hole: string; reamer: string; stock: string; nominal: string; rest: string; um: string }
/** Tolerance zones of the hole and the reamer, to scale in µm. */
export function drawTol(L: ReamLimits, T: TolText, narrow: boolean, dec: Dec) {
  const W = narrow ? 360 : 660, H = narrow ? 330 : 300;
  const top = 34, bot = H - (narrow ? 64 : 40);
  const vals = [L.ES, L.EI, L.lo, L.hi, L.m6.es, L.m6.ei, 0];
  let vmax = Math.max(...vals), vmin = Math.min(...vals);
  const span = Math.max(vmax - vmin, 10);
  vmax += span * 0.12; vmin -= span * 0.12;
  const Y = (v: number) => top + ((vmax - v) / (vmax - vmin)) * (bot - top);
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => (vmax - vmin) / s <= (narrow ? 7 : 8)) ?? 200;
  const ax = narrow ? 40 : 62;
  const cH = narrow ? [88, 156] : [116, 260], cR = narrow ? [185, 265] : [300, 420], cM = narrow ? [292, 340] : [576, 636];
  const o: string[] = [];
  // grid and µm scale
  for (let v = Math.ceil(vmin / step) * step; v <= vmax; v += step) {
    o.push(`<line x1="${ax}" x2="${W - 10}" y1="${f(Y(v))}" y2="${f(Y(v))}" class="rt-grid"/>`);
    o.push(`<text x="${ax - 6}" y="${f(Y(v) + 4)}" text-anchor="end" class="rt-tick">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}</text>`);
  }
  o.push(`<text x="${ax - 6}" y="${top - 16}" text-anchor="end" class="rt-tick">${T.um}</text>`);
  // nominal line
  o.push(`<line x1="${ax}" x2="${W - 10}" y1="${f(Y(0))}" y2="${f(Y(0))}" class="rt-zero"/>`);
  o.push(`<text x="${ax + 4}" y="${f(Y(0) - 5)}" class="rt-t sm">${esc(T.nominal)} ${dec(String(L.D))}</text>`);
  const col = (x: [number, number], hi: number, lo: number, cls: string, i: number) =>
    `<rect x="${x[0]}" y="${f(Y(hi))}" width="${x[1] - x[0]}" height="${f(Math.max(1.5, Y(lo) - Y(hi)))}" rx="2" class="rt-z ${cls}" style="--i:${i}"/>`;
  o.push(col(cH as [number, number], L.ES, L.EI, 'hole', 0));
  o.push(col(cR as [number, number], L.hi, L.lo, 'ream', 1));
  o.push(col(cM as [number, number], L.m6.es, L.m6.ei, 'stock', 2));
  // limits of the hole carried across to the reamer column
  [L.ES, L.EI].forEach((v) => o.push(`<line x1="${cH[1]}" x2="${cR[1] + 8}" y1="${f(Y(v))}" y2="${f(Y(v))}" class="rt-ext"/>`));
  // dimension chain beside the reamer column: 0.15 IT, 0.35 IT, the rest
  const dx = cR[1] + (narrow ? 8 : 14);
  const dim = (v1: number, v2: number, label: string, cls: string, i: number) => {
    const y1 = Y(v1), y2 = Y(v2), ym = (y1 + y2) / 2;
    const small = Math.abs(y2 - y1) < 12;
    return `<g class="rt-d ${cls}" style="--i:${i}"><line x1="${dx}" x2="${dx}" y1="${f(y1)}" y2="${f(y2)}" class="rt-dim"/>` +
      `<line x1="${dx - 4}" x2="${dx + 4}" y1="${f(y1)}" y2="${f(y1)}" class="rt-dim"/><line x1="${dx - 4}" x2="${dx + 4}" y1="${f(y2)}" y2="${f(y2)}" class="rt-dim"/>` +
      (narrow ? '' : `<text x="${dx + 8}" y="${f(ym + (small ? 0 : 4))}" class="rt-t ${cls}"${small ? ' dominant-baseline="middle"' : ''}>${label}</text>`) + '</g>';
  };
  o.push(dim(L.ES, L.hi, `0${dec('.15')} IT = ${L.a} µm`, 'a', 0));
  o.push(dim(L.hi, L.lo, `0${dec('.35')} IT = ${L.b} µm`, 'b', 1));
  o.push(dim(L.lo, L.EI, `${esc(T.rest)} ${L.rest} µm`, 'r', 2));
  // limit values on the zones
  const sg = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)}`;
  const lab = (x: number, v: number, up: boolean, cls: string) => `<text x="${x}" y="${f(Y(v) + (up ? -5 : 13))}" text-anchor="middle" class="rt-t ${cls}">${sg(v)}</text>`;
  o.push(lab((cH[0] + cH[1]) / 2, L.ES, true, 'hole'), lab((cH[0] + cH[1]) / 2, L.EI, false, 'hole'));
  o.push(lab((cR[0] + cR[1]) / 2, L.hi, true, 'ream'), lab((cR[0] + cR[1]) / 2, L.lo, false, 'ream'));
  o.push(lab((cM[0] + cM[1]) / 2, L.m6.es, true, 'stock'), lab((cM[0] + cM[1]) / 2, L.m6.ei, false, 'stock'));
  // column heads at the foot
  const yb = H - (narrow ? 44 : 14);
  const head = (x: [number, number], t: string, cls: string) => `<text x="${(x[0] + x[1]) / 2}" y="${yb}" text-anchor="middle" class="rt-h ${cls}">${esc(t)}</text>`;
  o.push(head(cH as [number, number], `${T.hole} ${L.cls}`, 'hole'), head(cR as [number, number], T.reamer, 'ream'), head(cM as [number, number], T.stock, 'stock'));
  if (narrow) {
    // the chain as a legend under the heads
    const items = [[`0${dec('.15')} IT ${L.a}`, 'a'], [`0${dec('.35')} IT ${L.b}`, 'b'], [`${T.rest} ${L.rest}`, 'r']];
    items.forEach(([t, c], i) => o.push(`<text x="${18 + i * 114}" y="${H - 14}" class="rt-t ${c}">${esc(t)} µm</text>`));
  }
  return { W, H, svg: o.join('') };
}

export interface AllowText { d: string; mm: string; g: string; n: string; k: string; p: string; h: string }
export interface AState { d: number; mat: 'all' | 'h48' | 'h63' }
/** Stock allowance against reamer Ø, 0–50 mm, with a cursor at the chosen size. */
export function drawAllow(st: AState, T: AllowText, narrow: boolean, dec: Dec) {
  const W = narrow ? 360 : 660, H = narrow ? 290 : 310, L = narrow ? 40 : 56, R = narrow ? 12 : 132, top = 24, bot = H - 40;
  const xMax = 50, yMax = 0.8;
  const X = (v: number) => L + (v / xMax) * (W - L - R);
  const Y = (v: number) => top + (1 - v / yMax) * (bot - top);
  const o: string[] = [];
  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].forEach((v) => {
    o.push(`<line x1="${L}" x2="${W - R}" y1="${f(Y(v))}" y2="${f(Y(v))}" class="ra-grid"/>`);
    o.push(`<text x="${L - 6}" y="${f(Y(v) + 4)}" text-anchor="end" class="ra-tick">${dec(v.toFixed(1))}</text>`);
  });
  [0, 6, 10, 16, 25, 40, 50].forEach((v) => o.push(`<text x="${f(X(v))}" y="${bot + 16}" text-anchor="middle" class="ra-tick">${v}</text>`));
  o.push(`<text x="${L}" y="${top - 10}" class="ra-ax">${esc(T.mm)}</text>`);
  o.push(`<text x="${W - R}" y="${H - 6}" text-anchor="end" class="ra-ax">${esc(T.d)}</text>`);
  o.push(`<clipPath id="ra-clip-${narrow ? 'n' : 'w'}"><rect x="${L}" y="${top}" width="${W - L - R}" height="${bot - top}"/></clipPath>`);
  o.push(`<g clip-path="url(#ra-clip-${narrow ? 'n' : 'w'})">`);
  const bands = (bs: Band[], cls: string) => {
    const area = bs.map((b) => `<rect x="${f(X(b.from) + 0.5)}" y="${f(Y(b.hi) - (b.hi === b.lo ? 1.5 : 0))}" width="${f(X(b.to) - X(b.from) - 1)}" height="${f(Math.max(3, Y(b.lo) - Y(b.hi)))}" class="ra-band ${cls}"/>`).join('');
    const edge = (key: 'lo' | 'hi') => bs.map((b, i) => `${i ? 'L' : 'M'}${f(X(b.from))},${f(Y(b[key]))} L${f(X(b.to))},${f(Y(b[key]))}`).join(' ');
    return `<g class="ra-s ${cls}">${area}<path d="${edge('hi')}" class="ra-edge" pathLength="1"/><path d="${edge('lo')}" class="ra-edge" pathLength="1"/></g>`;
  };
  o.push(bands(GUEHRING[st.mat], 'g'));
  o.push(bands(NEWMAN, 'n'));
  o.push(`<g class="ra-s k"><path d="${KMT.map((b, i) => `${i ? 'L' : 'M'}${f(X(b.from))},${f(Y(b.lo))} L${f(X(b.to))},${f(Y(b.lo))}`).join(' ')}" class="ra-line" pathLength="1"/></g>`);
  o.push(`<g class="ra-s p"><path d="M${f(X(0))},${f(Y(0))} L${f(X(yMax / KMT_PCT))},${f(Y(yMax))}" class="ra-pct" pathLength="1"/></g>`);
  o.push('<g class="ra-s h">' + HOFFMANN.map(([d, lo, hi]) => `<line x1="${f(X(d))}" x2="${f(X(d))}" y1="${f(Y(hi) - (hi === lo ? 3 : 0))}" y2="${f(Y(lo) + (hi === lo ? 3 : 0))}" class="ra-hof"/>`).join('') +
    (narrow ? '' : `<text x="${f(X(28) + 7)}" y="${f(Y(0.5) + 4)}" class="ra-hofl">${esc(T.h)}</text>`) + '</g>');
  o.push('</g>');
  o.push(`<line x1="${L}" x2="${W - R}" y1="${f(Y(0))}" y2="${f(Y(0))}" class="ra-axis"/>`);
  // end labels (wide)
  if (!narrow) {
    const lastG = GUEHRING[st.mat][GUEHRING[st.mat].length - 1];
    const ends = [
      { y: Y((lastG.lo + lastG.hi) / 2), t: T.g, c: 'g' },
      { y: Y(KMT[2].lo), t: T.k, c: 'k' },
      { y: Y(0.75), t: T.p, c: 'p' },
      { y: Y((NEWMAN[5].lo + NEWMAN[5].hi) / 2), t: T.n, c: 'n' },
    ].sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
    ends.forEach((e) => o.push(`<text x="${W - R + 8}" y="${f(e.y + 4)}" class="ra-lab ${e.c}">${esc(e.t)}</text>`));
  }
  // cursor
  const cx = X(st.d);
  o.push(`<g class="ra-cur"><line x1="${f(cx)}" x2="${f(cx)}" y1="${top}" y2="${bot}" class="ra-curl"/>`);
  const g = bandAt(GUEHRING[st.mat], st.d), n = bandAt(NEWMAN, st.d), k = kmtAt(st.d);
  if (g) o.push(`<circle cx="${f(cx)}" cy="${f(Y(g.hi))}" r="3.4" class="ra-dot g"/><circle cx="${f(cx)}" cy="${f(Y(g.lo))}" r="3.4" class="ra-dot g"/>`);
  if (n) o.push(`<circle cx="${f(cx)}" cy="${f(Y(n.hi))}" r="3" class="ra-dot n"/><circle cx="${f(cx)}" cy="${f(Y(n.lo))}" r="3" class="ra-dot n"/>`);
  if (k) o.push(`<circle cx="${f(cx)}" cy="${f(Y(k.lo))}" r="3.4" class="ra-dot k"/>`);
  if (KMT_PCT * st.d <= yMax) o.push(`<circle cx="${f(cx)}" cy="${f(Y(KMT_PCT * st.d))}" r="3" class="ra-dot p"/>`);
  const lw = 44, lx = Math.min(Math.max(cx, L + lw / 2 + 2), W - R - lw / 2 - 2);
  o.push(`<rect x="${f(lx - lw / 2)}" y="${top + 4}" width="${lw}" height="17" rx="3" class="ra-curb"/><text x="${f(lx)}" y="${top + 16.5}" text-anchor="middle" class="ra-curt">Ø ${dec(String(st.d))}</text></g>`);
  return { W, H, svg: o.join('') };
}

/** Readouts for the allowance figure: allowance range and pre-drill range, mm (null where a table ends). */
export function allowRead(st: AState) {
  const g = bandAt(GUEHRING[st.mat], st.d), n = bandAt(NEWMAN, st.d), k = kmtAt(st.d);
  const pr = (b: Band | null) => (b ? { lo: b.lo, hi: b.hi, dlo: st.d - b.hi, dhi: st.d - b.lo, txt: b.txt } : null);
  const p = KMT_PCT * st.d;
  return { g: pr(g), n: pr(n), k: pr(k), p: { lo: p, hi: p, dlo: st.d - p, dhi: st.d - p } };
}
