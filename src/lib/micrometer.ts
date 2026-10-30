/**
 * Reading an outside micrometer: the scales, random readings, the breakdown of a reading into what the eye adds
 * up (frame base + numbered sleeve line + further sleeve lines + half line + thimble) and a diagnosis of a wrong
 * answer. Everything is in integer counts of the resolution, so no floating-point sums ever decide right or wrong.
 *
 * Sourced (dossier caliper-micrometer.md, micrometer-sim.md):
 * - metric: spindle pitch 0.5 mm, thimble 50 divisions, 0.01 mm per division; sleeve lines every 1 mm above the
 *   index line and every 0.5 mm below it (NPL GPG 40 pp. 40–41; MEB Ölçme ve Kontrol 10 pp. 47, 54).
 * - inch: one thimble turn = 0.025 in, thimble 25 divisions of 0.001 in; sleeve numbered every 0.100 in, each
 *   0.100 split into four 0.025 in lines (NPL GPG 40 pp. 43–44; Mitutoyo Product Fundamentals p. 2).
 */
export type Unit = 'mm' | 'in';
/** rel: the sleeve is numbered from 0 and the frame's base is added; abs: the sleeve carries the actual size. */
export type Style = 'rel' | 'abs';

export interface Spec {
  unit: Unit;
  /** counts per unit: 100 (0.01 mm) or 1000 (0.001 in) */
  q: number;
  dec: number;
  /** counts in one frame range: 25 mm or 1 in */
  span: number;
  /** counts per thimble turn */
  rev: number;
  /** spacing of the sleeve lines on the main side of the index line */
  line: number;
  /** spacing of the half lines below the index line (metric), 0 when there are none */
  half: number;
  /** spacing of the numbered sleeve lines */
  numbered: number;
  /** frame bases, in units */
  bases: number[];
  rangeLen: number;
  /** size of one unit in mm, for drawing parts to scale */
  mmPerUnit: number;
}

export const SPECS: Record<Unit, Spec> = {
  mm: { unit: 'mm', q: 100, dec: 2, span: 2500, rev: 50, line: 100, half: 50, numbered: 500, bases: [0, 25, 50, 75, 100], rangeLen: 25, mmPerUnit: 1 },
  in: { unit: 'in', q: 1000, dec: 3, span: 1000, rev: 25, line: 25, half: 0, numbered: 100, bases: [0, 1, 2, 3, 4], rangeLen: 1, mmPerUnit: 25.4 },
};

export const thimbleDivisions = (s: Spec) => s.rev;          // one division = one count

export interface Reading {
  unit: Unit;
  base: number;        // frame base, units
  style: Style;
  inC: number;         // counts past the frame base, 0 … span
  valC: number;        // the full reading in counts
}

export const reading = (unit: Unit, base: number, style: Style, inC: number): Reading => {
  const s = SPECS[unit];
  return { unit, base, style: base === 0 ? 'rel' : style, inC, valC: base * s.q + inC };
};

/** Label printed at the k-th numbered sleeve line (k = 0, 1, …). */
export function sleeveLabel(s: Spec, base: number, style: Style, k: number): string {
  if (s.unit === 'mm') return String((style === 'abs' ? base : 0) + k * 5);
  // inch: digits 0–9 for each 0.100 in; an abs sleeve shows the whole inches too
  const tenths = k % 10, whole = Math.floor(k / 10);
  if (style === 'abs' && base > 0) return tenths === 0 ? String(base + whole) : String(tenths);
  return tenths === 0 && whole > 0 ? String(whole) : String(tenths);
}

export type TermKind = 'base' | 'numbered' | 'lines' | 'half' | 'thimble';
export interface Term { kind: TermKind; c: number; label: string; n?: number }

/** What the eye adds up, in reading order. The terms sum to valC. */
export function breakdown(r: Reading): Term[] {
  const s = SPECS[r.unit];
  const out: Term[] = [];
  const baseC = r.base * s.q;
  if (r.base > 0 && r.style === 'rel') out.push({ kind: 'base', c: baseC, label: String(r.base) });
  const k = Math.floor(r.inC / s.numbered);
  const numC = k * s.numbered + (r.style === 'abs' ? baseC : 0);
  out.push({ kind: 'numbered', c: numC, label: sleeveLabel(s, r.base, r.style, k), n: k });
  const rest = r.inC - k * s.numbered;
  const nLines = Math.floor(rest / s.line);
  out.push({ kind: 'lines', c: nLines * s.line, label: String(nLines), n: nLines });
  let after = rest - nLines * s.line;
  if (s.half) {
    const h = after >= s.half ? s.half : 0;
    out.push({ kind: 'half', c: h, label: h ? '1' : '0', n: h ? 1 : 0 });
    after -= h;
  }
  out.push({ kind: 'thimble', c: after, label: String(after), n: after });
  return out;
}

export const sumTerms = (t: Term[]) => t.reduce((a, b) => a + b.c, 0);

/** "57,88" / "57.88" / ".287" → counts; null when it is not a reading at this resolution. */
export function parse(s: Spec, raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!/^\d{0,3}(\.\d*)?$/.test(t) || t === '' || t === '.') return null;
  const [, frac = ''] = t.split('.');
  if (frac.length > s.dec) return null;
  return Math.round(parseFloat(t) * s.q);
}

export function fmt(s: Spec, c: number, locale: 'en' | 'tr' = 'en', dec = s.dec): string {
  const v = (c / s.q).toFixed(dec);
  return locale === 'tr' ? v.replace('.', ',') : v;
}

/** Shortest decimal form of a term value (0,5 not 0,50; 0,075 not 0,0750). */
export function fmtShort(s: Spec, c: number, locale: 'en' | 'tr' = 'en'): string {
  let v = (c / s.q).toFixed(s.dec).replace(/0+$/, '').replace(/\.$/, '');
  if (v === '') v = '0';
  return locale === 'tr' ? v.replace('.', ',') : v;
}

export type Diag =
  | 'forgotBase' | 'forgotBaseMore' | 'doubleBase' | 'droppedBase'
  | 'halfHigh' | 'halfLow' | 'half' | 'mm' | 'mmLow'
  | 'lineHigh' | 'lineLow' | 'line' | 'tenth'
  | 'one' | 'thimble' | 'general';

/** Why an answer is wrong, as far as the numbers tell. null when it is right. */
export function diagnose(r: Reading, ans: number): Diag | null {
  const s = SPECS[r.unit];
  const d = ans - r.valC;
  if (d === 0) return null;
  const baseC = r.base * s.q, div = r.inC % s.rev;
  if (r.base > 0 && r.style === 'rel') {
    const d2 = d + baseC;
    if (d2 === 0) return 'forgotBase';
    if (Math.abs(d2) <= s.line) return 'forgotBaseMore';
  }
  if (r.base > 0 && r.style === 'abs' && d === baseC) return 'doubleBase';
  if (r.base > 0 && r.style === 'abs' && d === -baseC) return 'droppedBase';
  if (s.unit === 'mm') {
    if (Math.abs(d) === 50) {
      if (d === 50 && div >= 40) return 'halfHigh';
      if (d === -50 && div <= 9) return 'halfLow';
      return 'half';
    }
    if (Math.abs(d) === 100) {
      if (d === 100 && div >= 40 && r.inC % 100 >= 50) return 'halfHigh';
      // a whole-millimetre line just uncovered by a thimble that has only just passed 0
      if (d === -100 && div <= 9 && r.inC % 100 < 50) return 'mmLow';
      return 'mm';
    }
  } else {
    if (Math.abs(d) === 25) {
      if (d === 25 && div >= 20) return 'lineHigh';
      if (d === -25 && div <= 4) return 'lineLow';
      return 'line';
    }
    if (Math.abs(d) === 100) return 'tenth';
  }
  if (Math.abs(d) === 1) return 'one';
  if (Math.floor(ans / s.rev) === Math.floor(r.valC / s.rev)) return 'thimble';
  return 'general';
}

export type Part = 'ball' | 'shaft' | 'ring' | 'hex' | 'pin' | 'block' | 'plate';
export const PARTS: Part[] = ['ball', 'shaft', 'ring', 'hex', 'pin', 'block', 'plate'];

/** Whether a part of size d (mm) is a plausible thing to measure on a frame whose largest reading is max (mm). */
export function partFits(p: Part, d: number, max: number): boolean {
  const throat = Math.max(20, max * 0.55 + 6);
  switch (p) {
    case 'ball': return d / 2 <= throat - 2;
    case 'shaft': return d >= 4 && d / 2 <= throat - 2;
    case 'ring': return d >= 12 && d / 2 <= throat - 2;
    case 'hex': return d >= 6 && d / Math.sqrt(3) <= throat - 2;
    case 'pin': return d >= 1.5 && d <= 20;
    case 'block': return d >= 1;
    case 'plate': return d <= 8;
  }
}

export type Rnd = () => number;
const int = (rnd: Rnd, a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

/** A random reading inside the frame; tricky ones put the thimble near zero, where the half (or 0.025) line is easy to misjudge. */
export function randomInC(s: Spec, tricky: boolean, rnd: Rnd): number {
  let c: number;
  if (s.unit === 'mm') {
    const div = tricky ? (rnd() < 0.5 ? int(rnd, 43, 49) : int(rnd, 1, 6)) : int(rnd, 0, 49);
    c = int(rnd, 0, 24) * 100 + int(rnd, 0, 1) * 50 + div;
  } else {
    const div = tricky ? (rnd() < 0.5 ? int(rnd, 20, 24) : int(rnd, 1, 4)) : int(rnd, 0, 24);
    c = int(rnd, 0, 9) * 100 + int(rnd, 0, 3) * 25 + div;
  }
  const lo = s.unit === 'mm' ? 20 : 10, hi = s.span - lo;
  if (c < lo) c += s.unit === 'mm' ? 100 : 100;
  if (c > hi) c -= 100;
  return c;
}

export interface Question extends Reading { part: Part }

export function pickPart(dMm: number, maxMm: number, last: Part | '', rnd: Rnd): Part {
  const c = PARTS.filter((p) => p !== last && partFits(p, dMm, maxMm));
  return c.length ? c[int(rnd, 0, c.length - 1)] : 'block';
}

const shuffle = <T,>(a: T[], rnd: Rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * A round of n questions. sel: an index into spec.bases or 'mix' (every frame twice, shuffled). styleSel: 'mix'
 * alternates the two sleeve numberings over the frames that have a base, half and half.
 */
export function buildRound(unit: Unit, sel: number | 'mix', styleSel: Style | 'mix', rnd: Rnd = Math.random, n = 10): Question[] {
  const s = SPECS[unit];
  const idx = sel === 'mix' ? shuffle(Array.from({ length: n }, (_, i) => i % s.bases.length), rnd) : Array(n).fill(sel);
  const withBase = idx.filter((i: number) => s.bases[i] > 0).length;
  const styles: Style[] = styleSel === 'mix'
    ? shuffle(Array.from({ length: withBase }, (_, i) => (i < Math.ceil(withBase / 2) ? 'rel' : 'abs') as Style), rnd)
    : Array(withBase).fill(styleSel);
  const tricky = shuffle(Array.from({ length: n }, (_, i) => i < Math.round(n * 0.4)), rnd);
  let si = 0; let last: Part | '' = '';
  return idx.map((i: number, q: number) => {
    const base = s.bases[i];
    const style = base > 0 ? styles[si++] : 'rel';
    const r = reading(unit, base, style, randomInC(s, tricky[q], rnd));
    const dMm = (r.valC / s.q) * s.mmPerUnit, maxMm = (base + s.rangeLen) * s.mmPerUnit;
    const part = pickPart(dMm, maxMm, last, rnd); last = part;
    return { ...r, part };
  });
}
