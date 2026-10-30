/**
 * ISO 1832 indexable insert designation tables.
 * Sources: ISO 1832:2017 (designation positions), manufacturer catalogues
 * (Sandvik Coromant, Kennametal, Iscar) for inscribed-circle / edge-length
 * pairs and tolerance values. Values awaiting Mustafa's sign-off are flagged
 * with `review: true` on the table.
 */

/** Position 1 — insert shape. Included angle ε in degrees; null = round. */
export const shapes = {
  A: { angle: 85, en: 'Parallelogram, 85°', tr: 'Paralelkenar, 85°', kind: 'parallelogram' },
  B: { angle: 82, en: 'Parallelogram, 82°', tr: 'Paralelkenar, 82°', kind: 'parallelogram' },
  C: { angle: 80, en: 'Rhombic, 80°', tr: 'Eşkenar dörtgen, 80°', kind: 'rhombus' },
  D: { angle: 55, en: 'Rhombic, 55°', tr: 'Eşkenar dörtgen, 55°', kind: 'rhombus' },
  E: { angle: 75, en: 'Rhombic, 75°', tr: 'Eşkenar dörtgen, 75°', kind: 'rhombus' },
  F: { angle: 50, en: 'Rhombic, 50°', tr: 'Eşkenar dörtgen, 50°', kind: 'rhombus' },
  H: { angle: 120, en: 'Hexagonal', tr: 'Altıgen', kind: 'polygon', sides: 6 },
  K: { angle: 55, en: 'Parallelogram, 55°', tr: 'Paralelkenar, 55°', kind: 'parallelogram' },
  L: { angle: 90, en: 'Rectangular', tr: 'Dikdörtgen', kind: 'rectangle' },
  M: { angle: 86, en: 'Rhombic, 86°', tr: 'Eşkenar dörtgen, 86°', kind: 'rhombus' },
  O: { angle: 135, en: 'Octagonal', tr: 'Sekizgen', kind: 'polygon', sides: 8 },
  P: { angle: 108, en: 'Pentagonal', tr: 'Beşgen', kind: 'polygon', sides: 5 },
  R: { angle: null, en: 'Round', tr: 'Yuvarlak', kind: 'round' },
  S: { angle: 90, en: 'Square', tr: 'Kare', kind: 'polygon', sides: 4 },
  T: { angle: 60, en: 'Triangular', tr: 'Üçgen', kind: 'polygon', sides: 3 },
  V: { angle: 35, en: 'Rhombic, 35°', tr: 'Eşkenar dörtgen, 35°', kind: 'rhombus' },
  W: { angle: 80, en: 'Trigon, 80°', tr: 'Trigon, 80°', kind: 'trigon' },
  X: { angle: null, en: 'Special shape', tr: 'Özel şekil', kind: 'special' },
};

/** Position 2 — normal clearance angle αn. */
export const clearances = {
  A: 3, B: 5, C: 7, D: 15, E: 20, F: 25, G: 30, N: 0, P: 11, O: null,
};

/**
 * Position 3 — tolerance class. Values ± in mm for m (corner to opposite
 * reference), s (thickness) and d (inscribed circle). Ranges mean the
 * tolerance grows with insert size.
 */
export const tolerances = {
  A: { m: '0.005', s: '0.025', d: '0.025' },
  C: { m: '0.013', s: '0.025', d: '0.025' },
  E: { m: '0.025', s: '0.025', d: '0.025' },
  F: { m: '0.005', s: '0.025', d: '0.013' },
  G: { m: '0.025', s: '0.13', d: '0.025' },
  H: { m: '0.013', s: '0.025', d: '0.013' },
  J: { m: '0.005', s: '0.025', d: '0.05–0.15' },
  K: { m: '0.013', s: '0.025', d: '0.05–0.15' },
  L: { m: '0.025', s: '0.025', d: '0.05–0.15' },
  M: { m: '0.08–0.2', s: '0.13', d: '0.05–0.15' },
  N: { m: '0.08–0.2', s: '0.025', d: '0.05–0.15' },
  U: { m: '0.13–0.38', s: '0.13', d: '0.08–0.25' },
};
export const toleranceNote = {
  en: 'For classes J to U the m and d tolerances grow with the inscribed circle; the range shown runs from the smallest to the largest standard size. Ground classes (A, C, E, F, G, H) hold the inscribed circle tightly; pressed-and-sintered classes (M, U) are the common roughing choice.',
  tr: 'J–U sınıflarında m ve d toleransları iç teğet çemberle büyür; gösterilen aralık en küçük ve en büyük standart ölçü arasındadır. Taşlanmış sınıflar (A, C, E, F, G, H) iç teğet çemberi dar toleransta tutar; preslenip sinterlenmiş sınıflar (M, U) kaba işlemede yaygındır.',
};

/** Position 4 — fixing hole and chipbreaker. */
export const fixing = {
  A: { hole: 'cylindrical', chipbreaker: 'none', en: 'Cylindrical hole, no chipbreaker', tr: 'Silindirik delik, talaş kırıcı yok' },
  B: { hole: 'single countersink 70–90°', chipbreaker: 'none', en: 'Hole with single 70–90° countersink, no chipbreaker', tr: 'Tek taraflı 70–90° havşalı delik, talaş kırıcı yok' },
  C: { hole: 'double countersink 70–90°', chipbreaker: 'none', en: 'Hole with double 70–90° countersink, no chipbreaker', tr: 'Çift taraflı 70–90° havşalı delik, talaş kırıcı yok' },
  F: { hole: 'none', chipbreaker: 'both', en: 'No hole, chipbreaker on both faces', tr: 'Deliksiz, iki yüzde talaş kırıcı' },
  G: { hole: 'cylindrical', chipbreaker: 'both', en: 'Cylindrical hole, chipbreaker on both faces', tr: 'Silindirik delik, iki yüzde talaş kırıcı' },
  H: { hole: 'single countersink 70–90°', chipbreaker: 'one', en: 'Single 70–90° countersink, chipbreaker on one face', tr: 'Tek taraflı 70–90° havşa, tek yüzde talaş kırıcı' },
  J: { hole: 'double countersink 70–90°', chipbreaker: 'both', en: 'Double 70–90° countersink, chipbreaker on both faces', tr: 'Çift taraflı 70–90° havşa, iki yüzde talaş kırıcı' },
  M: { hole: 'cylindrical', chipbreaker: 'one', en: 'Cylindrical hole, chipbreaker on one face', tr: 'Silindirik delik, tek yüzde talaş kırıcı' },
  N: { hole: 'none', chipbreaker: 'none', en: 'No hole, no chipbreaker', tr: 'Deliksiz, talaş kırıcı yok' },
  Q: { hole: 'double countersink 40–60°', chipbreaker: 'none', en: 'Double 40–60° countersink, no chipbreaker', tr: 'Çift taraflı 40–60° havşa, talaş kırıcı yok' },
  R: { hole: 'none', chipbreaker: 'one', en: 'No hole, chipbreaker on one face', tr: 'Deliksiz, tek yüzde talaş kırıcı' },
  T: { hole: 'single countersink 40–60°', chipbreaker: 'one', en: 'Single 40–60° countersink, chipbreaker on one face', tr: 'Tek taraflı 40–60° havşa, tek yüzde talaş kırıcı' },
  U: { hole: 'double countersink 40–60°', chipbreaker: 'both', en: 'Double 40–60° countersink, chipbreaker on both faces', tr: 'Çift taraflı 40–60° havşa, iki yüzde talaş kırıcı' },
  W: { hole: 'single countersink 40–60°', chipbreaker: 'none', en: 'Single 40–60° countersink, no chipbreaker', tr: 'Tek taraflı 40–60° havşa, talaş kırıcı yok' },
  X: { hole: 'special', chipbreaker: 'special', en: 'Special fixing or chipbreaker', tr: 'Özel bağlama veya talaş kırıcı' },
};

/**
 * Positions 5–6 — size code → cutting edge length l and inscribed circle d
 * for the common shapes. For round inserts the code is the diameter.
 */
export const sizes = {
  // l = cutting edge length computed from d by the shape geometry and rounded
  // to 0.1 mm (catalogues sometimes truncate instead). d = inscribed circle.
  // Rhombic: l = d / sin(ε). Triangular: l = d·√3. Square: l = d.
  // Trigon: l ≈ 0.685·d. Round: the code is the diameter.
  C: { '06': [6.4, 6.35], '08': [8.1, 7.94], '09': [9.7, 9.525], '12': [12.9, 12.7], '16': [16.1, 15.875], '19': [19.3, 19.05], '25': [25.8, 25.4] },
  D: { '07': [7.75, 6.35], '09': [9.7, 7.94], '11': [11.6, 9.525], '15': [15.5, 12.7], '19': [19.4, 15.875] },
  S: { '06': [6.35, 6.35], '07': [7.94, 7.94], '09': [9.525, 9.525], '12': [12.7, 12.7], '15': [15.875, 15.875], '19': [19.05, 19.05], '25': [25.4, 25.4], '31': [31.75, 31.75] },
  T: { '06': [6.9, 3.97], '08': [8.2, 4.76], '09': [9.6, 5.56], '11': [11.0, 6.35], '13': [13.7, 7.94], '16': [16.5, 9.525], '22': [22.0, 12.7], '27': [27.5, 15.875], '33': [33.0, 19.05] },
  V: { '08': [8.3, 4.76], '09': [9.7, 5.56], '11': [11.1, 6.35], '16': [16.6, 9.525], '22': [22.1, 12.7] },
  W: { '03': [3.8, 5.56], '04': [4.3, 6.35], '05': [5.4, 7.94], '06': [6.5, 9.525], '08': [8.7, 12.7], '10': [10.9, 15.875] },
  R: { '05': [5.0, 5.0], '06': [6.0, 6.0], '08': [8.0, 8.0], '10': [10.0, 10.0], '12': [12.0, 12.0], '16': [16.0, 16.0], '20': [20.0, 20.0], '25': [25.0, 25.0], '32': [32.0, 32.0] },
};
export const sizesReview = true;

/** Positions 7–8 — thickness code → s in mm. */
export const thicknesses = {
  '01': 1.59, T1: 1.98, '02': 2.38, T2: 2.78, '03': 3.18, T3: 3.97, '04': 4.76, '05': 5.56, '06': 6.35, '07': 7.94, '09': 9.52, '11': 11.11, '12': 12.7,
};

/**
 * Positions 9–10 — corner radius code → rε in mm. 00 is a sharp corner.
 * On round inserts the field carries no radius: M0 marks a metric size, 00 an inch size.
 */
export const radii = {
  '00': 0, '01': 0.1, '02': 0.2, '04': 0.4, '08': 0.8, '12': 1.2, '16': 1.6, '20': 2.0, '24': 2.4, '32': 3.2,
};

/** Optional position 11 — cutting edge condition. */
export const edgeConditions = {
  F: { en: 'Sharp edge', tr: 'Keskin kenar' },
  E: { en: 'Rounded (honed) edge', tr: 'Yuvarlatılmış (honlanmış) kenar' },
  T: { en: 'Chamfered edge', tr: 'Pahlı kenar' },
  S: { en: 'Chamfered and rounded edge', tr: 'Pahlı ve yuvarlatılmış kenar' },
  K: { en: 'Double chamfered edge', tr: 'Çift pahlı kenar' },
  P: { en: 'Double chamfered and rounded edge', tr: 'Çift pahlı ve yuvarlatılmış kenar' },
};

/** Optional position 12 — cutting direction. */
export const hands = {
  R: { en: 'Right-hand', tr: 'Sağ' },
  L: { en: 'Left-hand', tr: 'Sol' },
  N: { en: 'Neutral (both directions)', tr: 'Nötr (iki yön)' },
};

export const sources = [
  { label: 'ISO 1832:2017 — Indexable inserts for cutting tools — Designation', url: 'https://www.iso.org/standard/69202.html' },
  { label: 'ISO insert designation tables as reproduced in tool-supplier documentation (HH Tools, ISO identification sheet)', url: 'https://hhtools.nl/content/files/technische%20informatie/iso%20identification.pdf' },
];

/**
 * Parse an ISO 1832 designation like "CNMG 12 04 08-PM 4425".
 * Returns null when the first ten positions cannot be read.
 */
export function parseInsertCode(input) {
  const raw = String(input || '').toUpperCase().trim();
  const compact = raw.replace(/\s+/g, '');
  const m = compact.match(/^([A-Z])([A-Z])([A-Z])([A-Z])(\d{2})(T\d|\d{2})(M0|\d{2})([FESTKP]?)([RLN]?)(?:[-\s]?(.*))?$/);
  if (!m) return null;
  const [, shape, clearance, tolerance, fix, size, thick, rad, edge, hand, rest] = m;
  const sizeTable = sizes[shape];
  const dims = sizeTable ? sizeTable[size] : undefined;
  return {
    code: compact,
    shape,
    clearance,
    tolerance,
    fixing: fix,
    size,
    edgeLength: dims ? dims[0] : null,
    inscribedCircle: dims ? dims[1] : null,
    thicknessCode: thick,
    thickness: thicknesses[thick] ?? null,
    radiusCode: rad,
    radius: rad === 'M0' ? 0 : radii[rad] ?? null,
    edge: edge || null,
    hand: hand || null,
    suffix: rest ? rest.replace(/^-/, '') : null,
    known: {
      shape: Boolean(shapes[shape]),
      clearance: clearance in clearances,
      tolerance: Boolean(tolerances[tolerance]),
      fixing: Boolean(fixing[fix]),
    },
  };
}
