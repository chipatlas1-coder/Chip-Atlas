/**
 * ISO general purpose metric screw threads.
 *
 * Profile and basic dimensions: ISO 68-1:2023 and ISO 724:2023 (formulas below).
 * Diameter/pitch selection: ISO 261:1998 and ISO 262 (selected sizes as printed in ISO 262:1998;
 * the 2023 edition's table could not be read, see the article).
 * Tensile stress area: ISO 898-1 formula As = π/4·((d2 + d3)/2)².
 * Tap drills for coarse threads: DIN 336 / ISO 2306 values as published by Gühring (2025) and GSR,
 * cross-checked against Engineering Toolbox and ISO 2306 Table 1 (M3–M20). Fine threads: DIN 336
 * values from Gühring (to M33×2, re-checked 2026-10-11) and Engineering Toolbox.
 * 6H minor-diameter tolerance TD1 by pitch: read off published 6H limit tables (Gühring, Ganter,
 * CDE Fasteners) for M3–M36; only pitches confirmed there are listed.
 * Verified 2026-10-11. Each value set is covered by tests/metric-threads.test.js.
 */

export const SQRT3_2 = Math.sqrt(3) / 2;

/** Fundamental triangle height H = (√3/2)·P. */
export const H = (P) => SQRT3_2 * P;

/** Basic pitch diameter d2 = D2 = d − 2·(3H/8) = d − 0.649519·P (ISO 724). */
export const pitchDiameter = (d, P) => d - 0.75 * H(P);

/** Basic minor diameter of the internal thread D1 = d − 2·(5H/8) = d − 1.082532·P (ISO 724). */
export const minorDiameterInternal = (d, P) => d - 1.25 * H(P);

/** Minor diameter of the external thread (design profile) d3 = d − 2·(17H/24) = d − 1.226869·P (ISO 724:2023). */
export const minorDiameterExternal = (d, P) => d - (17 / 12) * H(P);

/** Tensile stress area As = π/4 · ((d2 + d3)/2)², mm² (ISO 898-1). */
export function stressArea(d, P) {
  const m = (pitchDiameter(d, P) + minorDiameterExternal(d, P)) / 2;
  return (Math.PI / 4) * m * m;
}

/** Round to n significant figures (ISO 898-1 prints stress areas to three). */
export function sig(v, n = 3) {
  if (!v) return 0;
  const p = Math.pow(10, n - Math.ceil(Math.log10(Math.abs(v))));
  return Math.round(v * p) / p;
}

/**
 * Coarse series, ISO 261 / ISO 262. `choice`: 1 or 2 (column of ISO 261).
 * `choiceSingle`: the choice column for this size was confirmed by one source only.
 * `drill`: recommended tap drill for cutting taps, DIN 336 / ISO 2306.
 * `drillSingle`: drill value confirmed by one source only.
 */
export const COARSE = [
  { d: 1, P: 0.25, choice: 1, choiceSingle: true, drill: 0.75 },
  { d: 1.2, P: 0.25, choice: 1, choiceSingle: true, drill: 0.95 },
  { d: 1.6, P: 0.35, choice: 1, drill: 1.25 },
  { d: 2, P: 0.4, choice: 1, drill: 1.6 },
  { d: 2.5, P: 0.45, choice: 1, drill: 2.05 },
  { d: 3, P: 0.5, choice: 1, drill: 2.5 },
  { d: 4, P: 0.7, choice: 1, drill: 3.3 },
  { d: 5, P: 0.8, choice: 1, drill: 4.2 },
  { d: 6, P: 1, choice: 1, drill: 5.0 },
  { d: 8, P: 1.25, choice: 1, drill: 6.8 },
  { d: 10, P: 1.5, choice: 1, drill: 8.5 },
  { d: 12, P: 1.75, choice: 1, drill: 10.2 },
  { d: 14, P: 2, choice: 2, drill: 12.0 },
  { d: 16, P: 2, choice: 1, drill: 14.0 },
  { d: 18, P: 2.5, choice: 2, drill: 15.5 },
  { d: 20, P: 2.5, choice: 1, drill: 17.5 },
  { d: 22, P: 2.5, choice: 2, drill: 19.5 },
  { d: 24, P: 3, choice: 1, drill: 21.0 },
  { d: 27, P: 3, choice: 2, choiceSingle: true, drill: 24.0 },
  { d: 30, P: 3.5, choice: 1, drill: 26.5 },
  { d: 33, P: 3.5, choice: 2, choiceSingle: true, drill: 29.5 },
  { d: 36, P: 4, choice: 1, drill: 32.0 },
  { d: 39, P: 4, choice: 2, choiceSingle: true, drill: 35.0 },
  { d: 42, P: 4.5, choice: 1, drill: 37.5 },
  { d: 45, P: 4.5, choice: 2, choiceSingle: true, drill: 40.5 },
  { d: 48, P: 5, choice: 1, drill: 43.0 },
  { d: 52, P: 5, choice: 2, choiceSingle: true, drill: 47.0 },
  { d: 56, P: 5.5, choice: 1, drill: 50.5 },
  { d: 60, P: 5.5, choice: 2, drill: 54.5, drillSingle: true },
  { d: 64, P: 6, choice: 1, drill: 58.0 },
];

/**
 * Fine pitches selected in ISO 262 (as printed in the 1998 edition), with tap drills.
 * `drill`: DIN 336 value from Gühring's table (fine threads to M33×2), matching Engineering Toolbox; DIN 336 rounds
 * M10×1.25 and M12×1.25 up to 8.8 and 10.8 mm. `drillSingle`: published by one source only (Engineering Toolbox).
 * Sizes without `drill` have no published value on file; the calculator then uses d − P.
 */
export const FINE = [
  [8, 1, 7.0], [10, 1.25, 8.8], [10, 1, 9.0], [12, 1.5, 10.5], [12, 1.25, 10.8], [14, 1.5, 12.5], [16, 1.5, 14.5],
  [18, 2], [18, 1.5, 16.5], [20, 2, 18.0], [20, 1.5, 18.5], [22, 2, 20.0], [22, 1.5, 20.5], [24, 2, 22.0],
  [27, 2, 25.0], [30, 2, 28.0], [33, 2, 31.0],
  [36, 3, 33.0, 1], [39, 3, 36.0, 1], [42, 3, 39.0, 1], [45, 3], [48, 3, 45.0, 1], [52, 4], [56, 4, 52.0, 1],
  [60, 4], [64, 4, 60.0, 1],
].map(([d, P, drill, single]) => (drill === undefined ? { d, P } : { d, P, drill, ...(single ? { drillSingle: true } : {}) }));

/**
 * Minor-diameter tolerance of the internal thread, grade 6 (TD1(6)), mm, by pitch (ISO 965-1).
 * Only pitches whose value was confirmed from published 6H limit tables are listed.
 */
export const TD1_6 = {
  0.5: 0.14, 0.7: 0.18, 0.8: 0.2, 1: 0.236, 1.25: 0.265, 1.5: 0.3, 1.75: 0.335,
  2: 0.375, 2.5: 0.45, 3: 0.5, 3.5: 0.56, 4: 0.6,
};

/** ISO 724 rounds basic dimensions to three decimals. */
const r3 = (v) => Math.round(v * 1000) / 1000;

/** 6H limits of the internal minor diameter (H: EI = 0), or null when TD1 for this pitch is not on file. */
export function minor6H(d, P) {
  const t = TD1_6[P];
  if (t === undefined) return null;
  const min = r3(minorDiameterInternal(d, P));
  return { min, max: r3(min + t) };
}

/**
 * Recommended tap drill for a cutting tap: the DIN 336 value where one is on file (coarse threads,
 * also ISO 2306; selected fine threads), else d − P.
 * `source`: 'coarse' | 'fine' | 'rule'.
 */
export function tapDrill(d, P) {
  const c = COARSE.find((x) => x.d === d && x.P === P);
  if (c) return { drill: c.drill, standard: true, single: Boolean(c.drillSingle), source: 'coarse' };
  const f = FINE.find((x) => x.d === d && x.P === P && x.drill !== undefined);
  if (f) return { drill: f.drill, standard: true, single: Boolean(f.drillSingle), source: 'fine' };
  return { drill: r3(d - P), standard: false, single: false, source: 'rule' };
}

/** Everything the calculator shows for one thread. */
export function threadData(d, P) {
  if (!(d > 0) || !(P > 0) || P >= d / 2) return null;
  const lim = minor6H(d, P);
  const td = tapDrill(d, P);
  return {
    d, P,
    H: H(P),
    d2: r3(pitchDiameter(d, P)),
    D1: r3(minorDiameterInternal(d, P)),
    d3: r3(minorDiameterExternal(d, P)),
    H1: 0.625 * H(P), // basic thread overlap 5H/8
    h3: (17 / 24) * H(P), // external thread depth on the design profile
    As: sig(stressArea(d, P), 3),
    drill: td.drill,
    drillStandard: td.standard,
    drillSingle: td.single,
    drillSource: td.source,
    minor6H: lim,
    drillInLimits: lim ? td.drill >= lim.min && td.drill <= lim.max : null,
    coarse: COARSE.some((x) => x.d === d && x.P === P),
  };
}

/** "M10" for coarse, "M10×1.25" for fine. */
export function designation(d, P, sep = '×', dec = '.') {
  const n = (v) => String(v).replace('.', dec);
  return COARSE.some((x) => x.d === d && x.P === P) ? `M${n(d)}` : `M${n(d)}${sep}${n(P)}`;
}
