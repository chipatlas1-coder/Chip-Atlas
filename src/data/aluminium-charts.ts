/**
 * Chart data for the aluminium pages (6061/6082 and 7075), copied from their tables. Sources are
 * named in each article; keep in step with the tables when either changes.
 */
import { BLUE, ORANGE } from './stainless-charts';
type L = 'en' | 'tr';
const c = (l: L, s: string) => (l === 'tr' ? s.replaceAll('.', ',') : s);

/** EN 573-3 composition windows, % by mass. 6082 blue, 6061 orange; "≤" limits drawn as up-to bars. */
export const alComp = (l: L) => {
  const r = (lo: number, hi: number, color: string, note: string) => ({ lo, hi, color, note });
  const up = (hi: number, color: string, note: string) => ({ lo: 0, hi, color, note, upTo: true, text: c(l, `≤ ${hi.toFixed(2)}`) });
  return [
    { label: 'Si', ranges: [r(0.7, 1.3, BLUE, '6082'), r(0.4, 0.8, ORANGE, '6061')] },
    { label: 'Mg', ranges: [r(0.6, 1.2, BLUE, '6082'), r(0.8, 1.2, ORANGE, '6061')] },
    { label: 'Mn', ranges: [r(0.4, 1.0, BLUE, '6082'), up(0.15, ORANGE, '6061')] },
    { label: 'Cu', ranges: [up(0.1, BLUE, '6082'), r(0.15, 0.4, ORANGE, '6061')] },
    { label: 'Cr', ranges: [up(0.25, BLUE, '6082'), r(0.04, 0.35, ORANGE, '6061')] },
  ];
};

/** EN 755-2 extruded bar, minimum Rp0.2 (bar) and Rm (outline), MPa. */
export const alTemperStrength = (l: L) => {
  const tr = l === 'tr';
  return [
    { label: '6061-T4', sub: tr ? 'çubuk ≤ 200 mm' : 'bar ≤ 200 mm', value: 110, outer: 180 },
    { label: '6061-T6', sub: tr ? 'çubuk ≤ 200 mm' : 'bar ≤ 200 mm', value: 240, outer: 260, highlight: true },
    { label: '6082-T4', sub: tr ? 'çubuk ≤ 200 mm' : 'bar ≤ 200 mm', value: 110, outer: 205 },
    { label: '6082-T6', sub: tr ? 'çubuk 20–150 mm' : 'bar 20–150 mm', value: 260, outer: 310, highlight: true },
  ];
};

/** Eurocode 9 (EN 1999-1-1), 6082 extrusions: parent and heat-affected-zone strength, MPa. */
export const alHaz = (l: L) => {
  const tr = l === 'tr';
  return [
    { name: tr ? '6082-T6, %0,2 akma dayanımı fo' : '6082-T6, 0.2 % proof strength fo', color: '#e2601a', parent: 260, haz: 125, rho: c(l, '0.48') },
    { name: tr ? '6082-T6, çekme dayanımı fu' : '6082-T6, tensile strength fu', color: '#e2601a', parent: 310, haz: 185, rho: c(l, '0.60'), faint: true },
    { name: tr ? '6082-T4, %0,2 akma dayanımı fo' : '6082-T4, 0.2 % proof strength fo', color: '#1e6fd6', parent: 110, haz: 100, rho: c(l, '0.91') },
  ];
};

/** EN 485-2 sheet and plate, minimum strength against thickness, MPa. Dashed = one source only. */
export const plateSteps = (l: L) => {
  const tr = l === 'tr';
  const st = (b: [number, number, number, boolean?][]) => b.map(([from, to, y, dashed]) => ({ from, to, y, ...(dashed ? { dashed: true } : {}) }));
  const k = (a: string, p: string) => (tr ? `${a}, ${p} en az` : `${a}, ${p} min`);
  const rp = tr ? 'Rp0,2' : 'Rp0.2';
  return [
    { name: '7075 Rp0.2', key: k('7075-T6/T651', rp), color: ORANGE, steps: st([[0.4, 0.8, 460], [0.8, 1.5, 460], [1.5, 3, 470], [3, 6, 475], [6, 12.5, 460], [12.5, 25, 470], [25, 50, 460], [50, 60, 440], [60, 80, 420], [80, 90, 390], [90, 100, 360], [100, 120, 300], [120, 150, 260], [150, 200, 240]]) },
    { name: '7075 Rm', key: k('7075-T6/T651', 'Rm'), color: ORANGE, faint: true, steps: st([[0.4, 0.8, 525], [0.8, 1.5, 540], [1.5, 3, 540], [3, 6, 545], [6, 12.5, 540], [12.5, 25, 540], [25, 50, 530], [50, 60, 525], [60, 80, 495], [80, 90, 490], [90, 100, 460], [100, 120, 410], [120, 150, 360], [150, 200, 360]]) },
    { name: '6082 Rp0.2', key: k('6082-T6/T651', rp), color: BLUE, steps: st([[0.4, 6, 260], [6, 12.5, 255], [12.5, 100, 240], [100, 150, 240], [150, 175, 230, true], [175, 200, 220, true]]) },
    { name: '6082 Rm', key: k('6082-T6/T651', 'Rm'), color: BLUE, faint: true, steps: st([[0.4, 6, 310], [6, 12.5, 300], [12.5, 100, 295], [100, 150, 275], [150, 175, 275, true], [175, 200, 260, true]]) },
  ].map((s) => (tr ? { ...s, name: s.name.replace('0.2', '0,2') } : s));
};

/** Typical (not minimum) strength, Aluminum Association values via MatWeb: Rp0.2 (bar) and Rm (outline), MPa. */
export const alTypical = (l: L) => {
  const tr = l === 'tr';
  return [
    { label: '6061-T6', sub: tr ? 'tipik' : 'typical', value: 276, outer: 310 },
    { label: '2024-T351', sub: tr ? 'tipik' : 'typical', value: 324, outer: 469 },
    { label: '7075-T73', sub: tr ? 'tipik' : 'typical', value: 435, outer: 505, highlight: true },
    { label: '7075-T6', sub: tr ? 'tipik' : 'typical', value: 503, outer: 572, highlight: true },
  ];
};

/** 7075 tempers on the ageing curve: stress-corrosion rating (ECSS-Q-70-36A) and conductivity (AMS 2658D). */
export const alOverage = (l: L) => {
  const tr = l === 'tr';
  return [
    { code: 'T6', u: 0.3, rm: 572, scc: 1 as const, sccText: tr ? 'düşük' : 'low', iacs: c(l, '30.5–36.0') },
    { code: 'T76', u: 0.55, scc: 2 as const, sccText: tr ? 'orta' : 'moderate', iacs: c(l, '38.0–42.0') },
    { code: 'T73', u: 0.82, rm: 505, scc: 3 as const, sccText: tr ? 'yüksek' : 'high', iacs: c(l, '40.0–43.0') },
  ];
};
