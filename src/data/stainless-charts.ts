/**
 * Chart data for the 304/316 page, copied from its tables (producer data sheets reproducing
 * EN 10088-3, tool makers' application data). Keep in step with the article when either changes.
 */
export const BLUE = '#1e6fd6';
export const ORANGE = '#d4520f';
type L = 'en' | 'tr';

/** Composition windows, EN 10088-3 (bars), % by mass. */
export const ssComp = (l: L) => [
  { label: 'Cr', ranges: [{ lo: 17.5, hi: 19.5, color: BLUE, note: '1.4301' }, { lo: 16.5, hi: 18.5, color: ORANGE, note: '1.4401' }] },
  { label: 'Ni', ranges: [{ lo: 8.0, hi: 10.5, color: BLUE, note: '1.4301' }, { lo: 10.0, hi: 13.0, color: ORANGE, note: '1.4401' }] },
  { label: 'Mo', ranges: [{ lo: 2.0, hi: 2.5, color: ORANGE, note: '1.4401' }] },
];

/** Solution annealing and sensitization, °C. First range = the span the page uses, others = what each source prints. */
type HT = { en: string; tr: string; ranges: { lo: number; hi: number; en?: string; tr?: string }[] };
const ht = (rows: HT[], l: L) =>
  rows.map((r) => ({ label: r[l], ranges: r.ranges.map((g, k) => ({ lo: g.lo, hi: g.hi, note: g[l], kind: k === 0 ? ('main' as const) : ('alt' as const) })) }));
export const ssHeat = (l: L) => ht([
  { en: 'Solution annealing, 1.4301 / 1.4307 / 1.4305', tr: 'Çözeltiye alma tavı, 1.4301 / 1.4307 / 1.4305', ranges: [
    { lo: 1000, hi: 1100 }, { lo: 1010, hi: 1120, en: 'Atlas Steels (304, 303)', tr: 'Atlas Steels (304, 303)' } ] },
  { en: 'Solution annealing, 1.4401 / 1.4404 / 1.4571', tr: 'Çözeltiye alma tavı, 1.4401 / 1.4404 / 1.4571', ranges: [
    { lo: 1020, hi: 1120 }, { lo: 1000, hi: 1100, en: 'Outokumpu, general', tr: 'Outokumpu, genel' }, { lo: 1010, hi: 1120, en: 'Atlas Steels (316)', tr: 'Atlas Steels (316)' }, { lo: 1020, hi: 1100, en: 'MARKS (1.4404)', tr: 'MARKS (1.4404)' } ] },
  { en: 'Sensitization (avoid long holds)', tr: 'Hassaslaşma (uzun bekletmeden kaçının)', ranges: [
    { lo: 400, hi: 860 }, { lo: 400, hi: 850, en: 'DEW 1.4301, 2015', tr: 'DEW 1.4301, 2015' }, { lo: 450, hi: 850, en: 'DEW 1.4301 (2007), 1.4307, 1.4306', tr: 'DEW 1.4301 (2007), 1.4307, 1.4306' },
    { lo: 425, hi: 860, en: 'Atlas Steels', tr: 'Atlas Steels' }, { lo: 427, hi: 816, en: 'Allegheny Ludlum', tr: 'Allegheny Ludlum' }, { lo: 482, hi: 816, en: 'Rolled Alloys', tr: 'Rolled Alloys' } ] },
], l);

/** Pitting resistance: bar = Outokumpu typical PRE; whisker = range DEW computes from the EN limits. */
export const ssPre = (l: L) => [
  { label: '304', sub: '1.4301', value: 18, lo: 17.5, hi: 21.1 },
  { label: '304L', sub: '1.4307', value: 18, lo: 17.5, hi: 21.1 },
  { label: '316', sub: '1.4401', value: 24, lo: 23.1, hi: 28.5, highlight: true },
  { label: '316L', sub: '1.4404', value: 24, lo: 23.1, hi: 28.5, highlight: true },
  { label: '316Ti', sub: '1.4571', value: 24, lo: 23.1, hi: 26.7, highlight: true },
].map((b) => ({ ...b, text: String(b.value) }));

/** Turning starting values, vc in m/min, from tool makers and producers (see the article). */
export const ssSpeeds = (l: L) => {
  const tr = l === 'tr';
  const k = tr ? 'Kennametal, M1, kaplamalı karbür' : 'Kennametal, M1, coated carbide';
  return [
    { label: 'KCU10B', sub: k, ranges: [{ lo: 150, hi: 275 }] },
    { label: 'KCU25B', sub: k, ranges: [{ lo: 100, hi: 265 }] },
    { label: 'KCM15B', sub: k, ranges: [{ lo: 100, hi: 240 }] },
    { label: 'KCM25B', sub: k, ranges: [{ lo: 90, hi: 180 }] },
    { label: 'KCM35B', sub: k, ranges: [{ lo: 80, hi: 135 }] },
    { label: '1.4301 / 1.4307', sub: tr ? 'DEW; ap 6 mm, f 0,1–0,5 mm/dev' : 'DEW; ap 6 mm, f 0.1–0.5 mm/rev', ranges: [{ lo: 65, hi: 170 }] },
    { label: '1.4401 / 1.4404 / 1.4571', sub: tr ? 'DEW; ap 6 mm, f 0,1–0,5 mm/dev' : 'DEW; ap 6 mm, f 0.1–0.5 mm/rev', ranges: [{ lo: 70, hi: 175 }] },
    { label: 'Prodec 304L / 316L', sub: tr ? 'işlenebilirliği artırılmış; f 0,25, ap 2–5' : 'improved machinability; f 0.25, ap 2–5', ranges: [{ lo: 200, hi: 260 }] },
  ];
};
