/**
 * Chart data copied from the article tables (EN ISO 683-1, EN ISO 683-2, EN 10025-2).
 * Keep in step with the tables in c45, 42crmo4 and s355 when either changes.
 */
export const BLUE = '#1e6fd6';
export const ORANGE = '#d4520f';

/** +QT: Re min (y) and Rm range (lo–hi) by diameter of the heat-treated section, mm. */
export const qtSeries = [
  { name: 'C45', color: BLUE, steps: [
    { from: 0, to: 16, y: 490, lo: 700, hi: 850 },
    { from: 16, to: 40, y: 430, lo: 650, hi: 800 },
    { from: 40, to: 100, y: 370, lo: 630, hi: 780 },
  ] },
  { name: '42CrMo4', color: ORANGE, steps: [
    { from: 0, to: 16, y: 900, lo: 1100, hi: 1300 },
    { from: 16, to: 40, y: 750, lo: 1000, hi: 1200 },
    { from: 40, to: 100, y: 650, lo: 900, hi: 1100 },
    { from: 100, to: 160, y: 550, lo: 800, hi: 950 },
    { from: 160, to: 250, y: 500, lo: 750, hi: 900 },
  ] },
];

/** S355: ReH min by nominal thickness, mm; the last band applies to J2 and K2 only. */
export const s355Series = [
  { name: 'S355', color: BLUE, steps: [
    { from: 0, to: 16, y: 355 }, { from: 16, to: 40, y: 345 }, { from: 40, to: 63, y: 335 },
    { from: 63, to: 80, y: 325 }, { from: 80, to: 100, y: 315 }, { from: 100, to: 150, y: 295 },
    { from: 150, to: 200, y: 285 }, { from: 200, to: 250, y: 275 }, { from: 250, to: 400, y: 265, dashed: true },
  ] },
];

/** Heat treatment temperatures (°C) from the article tables; first range = the page's range, others = maker values. */
type HT = { en: string; tr: string; ranges: { lo: number; hi: number; en?: string; tr?: string }[] };
const ht = (rows: HT[], locale: 'en' | 'tr') =>
  rows.map((r) => ({ label: r[locale], ranges: r.ranges.map((g, k) => ({ lo: g.lo, hi: g.hi, note: g[locale], kind: k === 0 ? ('main' as const) : ('alt' as const) })) }));

export const c45Heat = (l: 'en' | 'tr') => ht([
  { en: 'Normalizing', tr: 'Normalizasyon', ranges: [{ lo: 840, hi: 880 }, { lo: 840, hi: 870, en: 'DEW, Ovako', tr: 'DEW, Ovako' }] },
  { en: 'Soft annealing', tr: 'Yumuşatma tavlaması', ranges: [{ lo: 650, hi: 710 }, { lo: 680, hi: 710, en: 'Saarstahl', tr: 'Saarstahl' }, { lo: 650, hi: 700, en: 'DEW, Ovako', tr: 'DEW, Ovako' }] },
  { en: 'Hardening', tr: 'Sertleştirme', ranges: [{ lo: 820, hi: 860 }, { lo: 820, hi: 850, en: 'DEW, water', tr: 'DEW, suda' }, { lo: 830, hi: 860, en: 'DEW, oil', tr: 'DEW, yağda' }, { lo: 820, hi: 850, en: 'Ovako, water', tr: 'Ovako, suda' }, { lo: 840, hi: 870, en: 'Ovako, oil', tr: 'Ovako, yağda' }, { lo: 840, hi: 880, en: 'thyssenkrupp', tr: 'thyssenkrupp' }] },
  { en: 'Tempering', tr: 'Menevişleme', ranges: [{ lo: 550, hi: 660 }] },
], l);

export const crmoHeat = (l: 'en' | 'tr') => ht([
  { en: 'Normalizing', tr: 'Normalizasyon', ranges: [{ lo: 840, hi: 880 }, { lo: 850, hi: 880, en: 'Saarstahl', tr: 'Saarstahl' }] },
  { en: 'Soft annealing', tr: 'Yumuşatma tavlaması', ranges: [{ lo: 680, hi: 720 }] },
  { en: 'Hardening', tr: 'Sertleştirme', ranges: [{ lo: 820, hi: 860 }, { lo: 820, hi: 880, en: 'thyssenkrupp', tr: 'thyssenkrupp' }, { lo: 840, hi: 880, en: 'Ovako', tr: 'Ovako' }] },
  { en: 'Tempering', tr: 'Menevişleme', ranges: [{ lo: 540, hi: 680 }] },
], l);

export const mncrHeat = (l: 'en' | 'tr') => ht([
  { en: 'Carburizing', tr: 'Karbürleme', ranges: [{ lo: 880, hi: 980 }] },
  { en: 'Core hardening', tr: 'Çekirdek sertleştirme', ranges: [{ lo: 860, hi: 900 }] },
  { en: 'Case hardening', tr: 'Kabuk sertleştirme', ranges: [{ lo: 780, hi: 820 }, { lo: 810, hi: 840, en: 'Lucefin', tr: 'Lucefin' }] },
  { en: 'Tempering', tr: 'Menevişleme', ranges: [{ lo: 150, hi: 200 }] },
  { en: 'Soft annealing', tr: 'Yumuşatma tavlaması', ranges: [{ lo: 650, hi: 700 }, { lo: 670, hi: 710, en: 'Ovako', tr: 'Ovako' }] },
], l);
