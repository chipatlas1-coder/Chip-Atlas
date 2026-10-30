/** Data for article figures, computed from the formulas and values stated in the articles. */
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

/** chip-formation: shear angle models, μ = 0.6 → β = atan 0.6 */
export const shearModels = (l: 'en' | 'tr') => {
  const beta = (Math.atan(0.6) * 180) / Math.PI;
  return [
    { name: 'Merchant', color: '#d4520f', points: range(-10, 30, 40).map((a) => [a, 45 + a / 2 - beta / 2] as [number, number]) },
    { name: l === 'tr' ? 'Lee–Shaffer' : 'Lee–Shaffer', color: '#1e6fd6', points: range(-10, 30, 40).map((a) => [a, 45 + a - beta] as [number, number]) },
  ];
};

/** climb milling: maximum chip thickness hex/fz (κr = 90°) against ae/D */
export const hexCurve = (l: 'en' | 'tr') => [
  { name: 'hex / (fz · sin κr)', color: '#d4520f', points: range(0, 1, 240).map((t) => t * t).map((r) => [r, r < 0.5 ? 2 * Math.sqrt(r * (1 - r)) : 1] as [number, number]) },
];
export const engagementCurve = (l: 'en' | 'tr') => [
  { name: 'φe', color: '#1e6fd6', points: range(0, 1, 200).map((r) => [r, (Math.acos(1 - 2 * r) * 180) / Math.PI] as [number, number]) },
];

/** cutting forces: rake angle correction factor (1 − γ/100) */
export const rakeFactor = () => [
  { name: '1 − γ/100', color: '#d4520f', points: range(-10, 20, 30).map((g) => [g, 1 - g / 100] as [number, number]) },
];

/** taylor: the two-test example V1 = 250 m/min, T1 = 15 min; V2 = 200 m/min, T2 = 40 min */
export const taylorExample = () => {
  const n = Math.log(250 / 200) / Math.log(40 / 15);
  const C = 250 * Math.pow(15, n);
  return { n, C, series: [{ name: `V · T^${n.toFixed(3)} = ${C.toFixed(0)}`, color: '#d4520f', points: [1, 2, 5, 10, 20, 50, 100].map((T) => [T, C / Math.pow(T, n)] as [number, number]) }] };
};

/** taylor: n by tool material, three sources (article table) */
export const nSources = (l: 'en' | 'tr') => {
  const K = { color: '#1e6fd6', note: 'Kalpakjian & Schmid' }, A = { color: '#d4520f', note: l === 'tr' ? 'ACSCE modülü' : 'ACSCE module' }, G = { color: '#7a4fd0', note: 'Groover' };
  const r = (lo: number, hi: number, s: { color: string; note: string }, extra = '') => ({ lo, hi, color: s.color, note: s.note + extra });
  return {
    legend: [{ name: K.note, color: K.color }, { name: A.note, color: A.color }, { name: G.note, color: G.color }],
    rows: [
      { label: l === 'tr' ? 'Yüksek hız çeliği' : 'High-speed steel', ranges: [r(0.08, 0.2, K), r(0.1, 0.18, A), r(0.125, 0.125, G)] },
      { label: l === 'tr' ? 'Döküm kobalt alaşımları' : 'Cast cobalt alloys', ranges: [r(0.1, 0.15, K)] },
      { label: l === 'tr' ? 'Karbürler' : 'Carbides', ranges: [r(0.2, 0.5, K), r(0.2, 0.25, A, l === 'tr' ? ', kaplamasız' : ', uncoated'), r(0.3, 0.3, A, ', TiC/TiN'), r(0.4, 0.4, A, ', Al₂O₃'), r(0.25, 0.25, G)] },
      { label: l === 'tr' ? 'Seramikler' : 'Ceramics', ranges: [r(0.5, 0.7, K), r(0.4, 0.7, A), r(0.6, 0.6, G)] },
    ],
  };
};

/** taylor: carbide line n = 0.25, C = 500 m/min, with the two optima of the example */
export const carbideLine = (l: 'en' | 'tr') => [
  { name: l === 'tr' ? 'karbür, n = 0,25' : 'carbide, n = 0.25', color: '#d4520f', points: [1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 100].map((T) => [T, 500 / Math.pow(T, 0.25)] as [number, number]) },
];

/** honing: plateau-honing targets for engine bores from three sources (article table). Text keeps each source's precision. */
export const honingTargets = (l: 'en' | 'tr') => {
  const t = (s: string) => (l === 'tr' ? s.replace(/\./g, ',') : s);
  const M = { color: '#1e6fd6', note: l === 'tr' ? 'MS Motorservice, binek araç' : 'MS Motorservice, passenger car' };
  const Z = { color: '#d4520f', note: l === 'tr' ? 'Zynp patenti' : 'Zynp patent' };
  const G = { color: '#7a4fd0', note: l === 'tr' ? 'Gruszka vd., “bugün”' : 'Gruszka et al., “today”' };
  const r = (lo: number, hi: number, s: { color: string; note: string }, text: string, upTo = false) => ({ lo, hi, color: s.color, note: s.note, text: t(text), upTo });
  return {
    legend: [M, Z, G].map((s) => ({ name: s.note, color: s.color })),
    rows: [
      { label: 'Rpk', ranges: [r(0, 0.2, M, '< 0.20', true), r(0, 0.25, Z, '≤ 0.25', true), r(0, 0.3, G, '< 0.3', true)] },
      { label: 'Rk', ranges: [r(0.2, 0.6, M, '0.20–0.60'), r(0.2, 0.6, Z, '≈ 0.2–0.6'), r(0.25, 0.75, G, '0.25–0.75')] },
      { label: 'Rvk', ranges: [r(1.4, 1.8, M, '1.40–1.80'), r(1.2, 2.5, Z, '≈ 1.2–2.5'), r(1.7, 3.0, G, '1.7–3.0')] },
    ],
  };
};

/** rk-parameters: MS Motorservice cylinder bore targets, passenger car vs diesel utility vehicle (article table). */
export const msBoreTargets = (l: 'en' | 'tr') => {
  const t = (s: string) => (l === 'tr' ? s.replace(/\./g, ',') : s);
  const P = { color: '#1e6fd6', note: l === 'tr' ? 'Binek araç' : 'Passenger car' };
  const D = { color: '#d4520f', note: l === 'tr' ? 'Dizel ticari araç' : 'Diesel utility vehicle' };
  const r = (lo: number, hi: number, s: { color: string; note: string }, text: string, upTo = false) => ({ lo, hi, color: s.color, note: s.note, text: t(text), upTo });
  return {
    legend: [P, D].map((s) => ({ name: s.note, color: s.color })),
    rows: [
      { label: 'Rpk', ranges: [r(0, 0.2, P, '< 0.20', true), r(0.2, 0.4, D, '0.20–0.40')] },
      { label: 'Rk', ranges: [r(0.2, 0.6, P, '0.20–0.60'), r(0.5, 1.5, D, '0.50–1.50')] },
      { label: 'Rvk', ranges: [r(1.4, 1.8, P, '1.40–1.80'), r(1.5, 2.0, D, '1.50–2.00')] },
    ],
  };
};

/** iso-2768: ISO 2768-1:1989 linear deviations (± mm) by nominal size, as step lines (article table). */
const steps = (bands: [number, number, number | null][]) => {
  const pts: [number, number][] = [];
  bands.forEach(([a, b, v]) => { if (v !== null) { pts.push([a, v], [b, v]); } });
  return pts;
};
export const iso2768Linear = (l: 'en' | 'tr') => {
  const lim = [0.5, 3, 6, 30, 120, 400, 1000, 2000, 4000];
  const row = (vals: (number | null)[]) => steps(vals.map((v, i) => [lim[i], lim[i + 1], v] as [number, number, number | null]));
  const nm = l === 'tr' ? ['f (ince)', 'm (orta)', 'c (kaba)', 'v (çok kaba)'] : ['f (fine)', 'm (medium)', 'c (coarse)', 'v (very coarse)'];
  return [
    { name: nm[0], color: '#6da7ec', points: row([0.05, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, null]) },
    { name: nm[1], color: '#2a78d6', points: row([0.1, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 2]) },
    { name: nm[2], color: '#1c5cab', points: row([0.2, 0.3, 0.5, 0.8, 1.2, 2, 3, 4]) },
    { name: nm[3], color: '#0d366b', points: row([null, 0.5, 1, 1.5, 2.5, 4, 6, 8]) },
  ];
};

/** iso-2768: ISO 2768-1:1989 angular deviations (± arc minutes) by the shorter side (article table). Over 400 mm drawn to 1000 mm. */
export const iso2768Angles = (l: 'en' | 'tr') => {
  const lim = [1, 10, 50, 120, 400, 1000];
  const row = (vals: number[]) => steps(vals.map((v, i) => [lim[i], lim[i + 1], v] as [number, number, number]));
  return [
    { name: l === 'tr' ? 'f ve m' : 'f and m', color: '#2a78d6', points: row([60, 30, 20, 10, 5]) },
    { name: 'c', color: '#1c5cab', points: row([90, 60, 30, 15, 10]) },
    { name: 'v', color: '#0d366b', points: row([180, 120, 60, 30, 20]) },
  ];
};

/** tap-drill-sizes: OSG tapping speeds (m/min) by work material and tap type (article table, one maker). */
export const osgTapSpeeds = (l: 'en' | 'tr') => {
  const tr = l === 'tr';
  const t = (s: string) => (tr ? s.replace(/\./g, ',') : s);
  const A = { color: '#1e6fd6', note: tr ? 'El ve helisel oluklu' : 'Hand and spiral flute' };
  const B = { color: '#d4520f', note: tr ? 'Spiral uçlu' : 'Spiral point' };
  const C = { color: '#7a4fd0', note: tr ? 'Ezme' : 'Forming' };
  const r = (lo: number, hi: number, s: { color: string; note: string }, extra = '') => ({ lo, hi, color: s.color, note: s.note + (extra ? `, ${extra}` : ''), text: t(`${lo}–${hi}`) + (extra ? ` ${extra}` : '') });
  return {
    legend: [A, B, C].map((s) => ({ name: s.note, color: s.color })),
    rows: [
      { label: tr ? 'Düşük karbonlu çelik' : 'Low-carbon steel', ranges: [r(8, 13, A), r(15, 25, B), r(8, 13, C)] },
      { label: tr ? 'Orta karbonlu çelik' : 'Medium-carbon steel', ranges: [r(7, 12, A), r(10, 15, B), r(7, 10, C)] },
      { label: tr ? 'Yüksek karbonlu çelik' : 'High-carbon steel', ranges: [r(6, 9, A), r(8, 13, B), r(5, 8, C)] },
      { label: tr ? 'Alaşımlı çelik' : 'Alloy steel', ranges: [r(7, 12, A), r(10, 15, B), r(5, 8, C)] },
      { label: tr ? 'Paslanmaz çelik' : 'Stainless steel', ranges: [r(4, 7, A, tr ? '(el)' : '(hand)'), r(5, 8, A, tr ? '(helisel oluklu)' : '(spiral flute)'), r(8, 13, B), r(5, 10, C)] },
      { label: tr ? 'Alüminyum döküm' : 'Aluminium castings', ranges: [r(10, 15, A), r(15, 20, B), r(10, 15, C)] },
    ],
  };
};

/** chip-formation: shear strain γ = cot φ + tan(φ − α) against φ for three rake angles (article formula). */
export const shearStrain = (l: 'en' | 'tr') => {
  const r = (d: number) => (d * Math.PI) / 180;
  const g = (phi: number, a: number) => 1 / Math.tan(r(phi)) + Math.tan(r(phi - a));
  const mk = (a: number, color: string) => ({ name: `α = ${a > 0 ? '+' : a < 0 ? '−' : ''}${Math.abs(a)}°`, color, points: range(8, 60, 104).map((p) => [p, g(p, a)] as [number, number]) });
  void l;
  return [mk(-10, '#7a4fd0'), mk(0, '#d4520f'), mk(10, '#1e6fd6')];
};
