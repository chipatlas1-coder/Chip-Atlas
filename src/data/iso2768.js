/**
 * ISO 2768-1:1989 general tolerances, and the straightness/flatness table of the withdrawn ISO 2768-2:1989.
 * Values verified against Star Rapid (DIN ISO 2768 PDF), AMESweb, Engineers Edge and CAMCUT (2026-10).
 * Ranges: [lower exclusive, upper inclusive] in mm; the first range includes its lower bound (0.5).
 * null = no general tolerance specified for that class and range.
 */

export const CLASSES = ['f', 'm', 'c', 'v'];

export const LINEAR = [
  { from: 0.5, to: 3, dev: { f: 0.05, m: 0.1, c: 0.2, v: null } },
  { from: 3, to: 6, dev: { f: 0.05, m: 0.1, c: 0.3, v: 0.5 } },
  { from: 6, to: 30, dev: { f: 0.1, m: 0.2, c: 0.5, v: 1 } },
  { from: 30, to: 120, dev: { f: 0.15, m: 0.3, c: 0.8, v: 1.5 } },
  { from: 120, to: 400, dev: { f: 0.2, m: 0.5, c: 1.2, v: 2.5 } },
  { from: 400, to: 1000, dev: { f: 0.3, m: 0.8, c: 2, v: 4 } },
  { from: 1000, to: 2000, dev: { f: 0.5, m: 1.2, c: 3, v: 6 } },
  { from: 2000, to: 4000, dev: { f: null, m: 2, c: 4, v: 8 } },
];

/** External radii and chamfer heights. */
export const RADII = [
  { from: 0.5, to: 3, dev: { f: 0.2, m: 0.2, c: 0.4, v: 0.4 } },
  { from: 3, to: 6, dev: { f: 0.5, m: 0.5, c: 1, v: 1 } },
  { from: 6, to: Infinity, dev: { f: 1, m: 1, c: 2, v: 2 } },
];

/** Angular dimensions, by length of the shorter side of the angle; deviations in arc minutes. */
export const ANGULAR = [
  { from: 0, to: 10, dev: { f: 60, m: 60, c: 90, v: 180 } },
  { from: 10, to: 50, dev: { f: 30, m: 30, c: 60, v: 120 } },
  { from: 50, to: 120, dev: { f: 20, m: 20, c: 30, v: 60 } },
  { from: 120, to: 400, dev: { f: 10, m: 10, c: 15, v: 30 } },
  { from: 400, to: Infinity, dev: { f: 5, m: 5, c: 10, v: 20 } },
];

/** ISO 2768-2:1989 (withdrawn 2021, replaced by ISO 22081:2021): straightness and flatness, mm. */
export const FLATNESS = [
  { from: 0, to: 10, tol: { H: 0.02, K: 0.05, L: 0.1 } },
  { from: 10, to: 30, tol: { H: 0.05, K: 0.1, L: 0.2 } },
  { from: 30, to: 100, tol: { H: 0.1, K: 0.2, L: 0.4 } },
  { from: 100, to: 300, tol: { H: 0.2, K: 0.4, L: 0.8 } },
  { from: 300, to: 1000, tol: { H: 0.3, K: 0.6, L: 1.2 } },
  { from: 1000, to: 3000, tol: { H: 0.4, K: 0.8, L: 1.6 } },
];

function find(table, size, minIncl) {
  if (!(size > 0)) return null;
  for (let i = 0; i < table.length; i++) {
    const r = table[i];
    const lowerOk = i === 0 ? size >= (minIncl ?? r.from) : size > r.from;
    if (lowerOk && size <= r.to) return r;
  }
  return null;
}

/** ± deviation in mm for a linear size, or null (outside the table or not specified). */
export function linearDeviation(size, cls) {
  const r = find(LINEAR, size, 0.5);
  return r ? r.dev[cls] ?? null : null;
}

export function radiusDeviation(size, cls) {
  const r = find(RADII, size, 0.5);
  return r ? r.dev[cls] ?? null : null;
}

/** ± deviation in arc minutes, by the length of the shorter side (mm). */
export function angularDeviation(shorterSide, cls) {
  const r = find(ANGULAR, shorterSide, 0);
  return r ? r.dev[cls] ?? null : null;
}

export function flatnessTolerance(length, cls) {
  const r = find(FLATNESS, length, 0);
  return r ? r.tol[cls] ?? null : null;
}

/** 90 → "1°30′", 20 → "0°20′". */
export function formatAngle(min) {
  const d = Math.floor(min / 60), m = min % 60;
  return `${d}°${m ? m + '′' : ''}`.replace(/°$/, '°');
}
