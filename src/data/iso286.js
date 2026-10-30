/**
 * ISO 286-1:2010 code system for tolerances on linear sizes, nominal sizes up to 500 mm.
 * Standard tolerance grades IT1–IT18 and the fundamental deviations of the
 * common tolerance positions. All values in micrometres (µm).
 *
 * Cross-checked against: Wikipedia "IT Grade" (IT table, from ISO 286-1),
 * Emile Maurin ISO tolerance tables (f, g, h, m, n, p shafts; D, E, F, G, H,
 * JS9, N9, P9 holes up to 250 mm) and ISO 286-2 extracts published by bearing
 * suppliers (k, r, js shafts; J, JS, K, M, N, P holes). See tests/iso286.test.js.
 */

/** Main size ranges: "over a up to and including b". */
export const RANGES = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];

/** Standard tolerance grades, µm, per main range (IT1 … IT18). */
export const IT = {
  1: [0.8, 1, 1, 1.2, 1.5, 1.5, 2, 2.5, 3.5, 4.5, 6, 7, 8],
  2: [1.2, 1.5, 1.5, 2, 2.5, 2.5, 3, 4, 5, 7, 8, 9, 10],
  3: [2, 2.5, 2.5, 3, 4, 4, 5, 6, 8, 10, 12, 13, 15],
  4: [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
  5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
  6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
  12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
  13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
  14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
  15: [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
  16: [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000],
  17: [1000, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000, 4600, 5200, 5700, 6300],
  18: [1400, 1800, 2200, 2700, 3300, 3900, 4600, 5400, 6300, 7200, 8100, 8900, 9700],
};

/** Intermediate breakpoints used by positions whose deviation changes inside a main range. */
export const SUB_RANGES = [3, 6, 10, 14, 18, 24, 30, 40, 50, 65, 80, 100, 120, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500];

/**
 * Shaft fundamental deviations.
 * a–h: upper deviation es (≤ 0). k–u: lower deviation ei (≥ 0).
 * `main` arrays follow RANGES; `sub` arrays follow SUB_RANGES.
 */
export const SHAFT = {
  c: { kind: 'es', sub: [-60, -70, -80, -95, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480] },
  d: { kind: 'es', main: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230] },
  e: { kind: 'es', main: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135] },
  f: { kind: 'es', main: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68] },
  g: { kind: 'es', main: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20] },
  h: { kind: 'es', main: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  // k: these values apply to grades IT4–IT7; for IT3 and below and IT8 and above, ei = 0.
  k: { kind: 'ei', main: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5] },
  m: { kind: 'ei', main: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23] },
  n: { kind: 'ei', main: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40] },
  p: { kind: 'ei', main: [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68] },
  r: { kind: 'ei', sub: [10, 15, 19, 23, 23, 28, 28, 34, 34, 41, 43, 51, 54, 63, 65, 68, 77, 80, 84, 94, 98, 108, 114, 126, 132] },
  s: { kind: 'ei', sub: [14, 19, 23, 28, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252] },
  u: { kind: 'ei', sub: [18, 23, 28, 33, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540] },
};

/** Grades offered per position (ISO 286-2 commonly tabulated classes). */
export const SHAFT_GRADES = {
  c: [8, 9, 10, 11, 12, 13], d: [6, 7, 8, 9, 10, 11, 12, 13], e: [5, 6, 7, 8, 9, 10], f: [5, 6, 7, 8, 9, 10], g: [4, 5, 6, 7, 8, 9, 10],
  h: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  k: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13], m: [4, 5, 6, 7, 8, 9], n: [4, 5, 6, 7, 8, 9], p: [4, 5, 6, 7, 8, 9, 10], r: [4, 5, 6, 7, 8, 9, 10], s: [4, 5, 6, 7, 8, 9, 10], u: [5, 6, 7, 8, 9, 10],
};
export const HOLE_GRADES = {
  C: [8, 9, 10, 11, 12, 13], D: [6, 7, 8, 9, 10, 11, 12, 13], E: [5, 6, 7, 8, 9, 10], F: [6, 7, 8, 9, 10], G: [5, 6, 7, 8, 9, 10],
  H: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], JS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  K: [5, 6, 7, 8], M: [5, 6, 7, 8, 9, 10], N: [5, 6, 7, 8, 9, 10, 11], P: [5, 6, 7, 8, 9, 10], R: [5, 6, 7, 8, 9, 10], S: [5, 6, 7, 8, 9, 10], U: [6, 7, 8, 9, 10],
};

/** Index of the main range containing size D (mm), or -1 outside 0 < D ≤ 500. */
export function rangeIndex(D) {
  if (!(D > 0) || D > 500) return -1;
  return RANGES.findIndex((b) => D <= b);
}
function subIndex(D) {
  return SUB_RANGES.findIndex((b) => D <= b);
}
export function rangeLabel(D) {
  const i = rangeIndex(D);
  if (i < 0) return null;
  return { from: i === 0 ? 0 : RANGES[i - 1], to: RANGES[i] };
}
export function subRangeLabel(D) {
  const i = subIndex(D);
  if (i < 0) return null;
  return { from: i === 0 ? 0 : SUB_RANGES[i - 1], to: SUB_RANGES[i] };
}

/** Standard tolerance ITn in µm for size D. */
export function itValue(grade, D) {
  const i = rangeIndex(D);
  if (i < 0 || !IT[grade]) return NaN;
  return IT[grade][i];
}

function shaftBase(letter, D) {
  const def = SHAFT[letter];
  if (!def) return NaN;
  return def.main ? def.main[rangeIndex(D)] : def.sub[subIndex(D)];
}

/** Δ = ITn − IT(n−1), used for holes K…ZC. */
export function delta(grade, D) {
  if (D <= 3) return 0;
  if (grade < 3 || grade > 8) return 0;
  return itValue(grade, D) - itValue(grade - 1, D);
}

/** Limit deviations of a shaft class, e.g. ('g', 6, 25) → { es, ei } in µm. */
export function shaftDeviations(letter, grade, D) {
  const ITn = itValue(grade, D);
  if (!Number.isFinite(ITn)) return null;
  if (letter === 'js') return { es: ITn / 2, ei: -ITn / 2 };
  const def = SHAFT[letter];
  if (!def) return null;
  if (def.kind === 'es') {
    const es = shaftBase(letter, D);
    return { es, ei: es - ITn };
  }
  let ei = shaftBase(letter, D);
  if (letter === 'k' && (grade <= 3 || grade >= 8)) ei = 0;
  return { es: ei + ITn, ei };
}

/** Limit deviations of a hole class, e.g. ('H', 7, 25) → { ES, EI } in µm. */
export function holeDeviations(letter, grade, D) {
  const ITn = itValue(grade, D);
  if (!Number.isFinite(ITn)) return null;
  if (letter === 'JS') return { ES: ITn / 2, EI: -ITn / 2 };
  if ('CDEFGH'.includes(letter) && letter.length === 1) {
    const EI = -shaftBase(letter.toLowerCase(), D);
    return { ES: EI + ITn, EI };
  }
  const lower = letter.toLowerCase();
  let ES;
  if (letter === 'K') {
    ES = grade <= 8 ? -shaftBase('k', D) + delta(grade, D) : 0;
  } else if (letter === 'M') {
    ES = grade <= 8 ? -shaftBase('m', D) + delta(grade, D) : -shaftBase('m', D);
    if (grade === 6 && D > 250 && D <= 315) ES = -9; // ISO 286-1 special case
  } else if (letter === 'N') {
    if (grade <= 8) ES = -shaftBase('n', D) + delta(grade, D);
    else ES = D <= 3 ? -4 : 0;
  } else if (SHAFT[lower] && SHAFT[lower].kind === 'ei') {
    ES = -shaftBase(lower, D) + (grade <= 7 ? delta(grade, D) : 0);
  } else {
    return null;
  }
  return { ES, EI: ES - ITn };
}

/** Parse "H7", "g6", "JS9", "js6". Returns { letter, grade, kind: 'hole' | 'shaft' } or null. */
export function parseClass(text) {
  const m = String(text || '').trim().match(/^(JS|js|[A-Za-z])(\d{1,2})$/);
  if (!m) return null;
  const letter = m[1];
  const grade = Number(m[2]);
  const kind = letter === letter.toUpperCase() ? 'hole' : 'shaft';
  const grades = kind === 'hole' ? HOLE_GRADES[letter] : SHAFT_GRADES[letter];
  if (!grades || !grades.includes(grade)) return null;
  return { letter, grade, kind };
}

/** Evaluate a fit "H7/g6" at size D: deviations, limits and the fit type. */
export function fit(holeClass, shaftClass, D) {
  const h = parseClass(holeClass), s = parseClass(shaftClass);
  if (!h || h.kind !== 'hole' || !s || s.kind !== 'shaft') return null;
  const hole = holeDeviations(h.letter, h.grade, D);
  const shaft = shaftDeviations(s.letter, s.grade, D);
  if (!hole || !shaft) return null;
  const maxClearance = hole.ES - shaft.ei; // µm, positive = clearance
  const minClearance = hole.EI - shaft.es;
  const type = minClearance >= 0 ? 'clearance' : maxClearance <= 0 ? 'interference' : 'transition';
  return { hole, shaft, maxClearance, minClearance, type };
}

/** Preferred fits (ISO 286-1 Annex / ANSI B4.2 metric preferred fits). */
export const PREFERRED_FITS = [
  { hole: 'H11', shaft: 'c11', en: 'Loose running', tr: 'Gevşek çalışma' },
  { hole: 'H9', shaft: 'd9', en: 'Free running', tr: 'Serbest çalışma' },
  { hole: 'H8', shaft: 'f7', en: 'Close running', tr: 'Sıkı çalışma' },
  { hole: 'H7', shaft: 'g6', en: 'Sliding', tr: 'Kayar' },
  { hole: 'H7', shaft: 'h6', en: 'Locational clearance', tr: 'Konumlandırıcı boşluklu' },
  { hole: 'H7', shaft: 'k6', en: 'Locational transition', tr: 'Konumlandırıcı geçiş' },
  { hole: 'H7', shaft: 'n6', en: 'Locational transition', tr: 'Konumlandırıcı geçiş' },
  { hole: 'H7', shaft: 'p6', en: 'Locational interference', tr: 'Konumlandırıcı sıkı' },
  { hole: 'H7', shaft: 's6', en: 'Medium drive', tr: 'Orta sıkı (pres)' },
  { hole: 'H7', shaft: 'u6', en: 'Force', tr: 'Zorlamalı (sıcak/soğuk geçme)' },
];
