/**
 * Reaming article: cutting speeds for HSS reamers as two sources print them, in m/min.
 * Hoffmann Group data sheets 164180 14 and 164180 28 (HSS-E machine reamer, DIN 208 B; the same
 * table in both): one value per row. Productivity Inc. / Red Line Tools, "Reamers – Technical Info",
 * catalogue p. 372: HSS SFM ranges, converted with 1 SFM = 0.3048 m/min and rounded to whole m/min.
 * Productivity rows are paired only where the material family is the same; the pairing is named.
 */
type L = 'en' | 'tr';
const SFM = 0.3048;
export const reamSpeeds = (l: L) => {
  const tr = l === 'tr';
  const t = (s: string) => (tr ? s.replace(/\./g, ',') : s);
  const S = {
    hof: { color: '#d4520f', name: tr ? 'Hoffmann HSS-E, DIN 208 B' : 'Hoffmann HSS-E, DIN 208 B' },
    pro: { color: '#1e6fd6', name: tr ? 'Productivity HSS (SFM’den çevrildi)' : 'Productivity HSS (converted from SFM)' },
  };
  const one = (v: number, extra = '') => ({ lo: v, hi: v, color: S.hof.color, note: S.hof.name + (extra ? `, ${extra}` : ''), text: t(String(v)) + (extra ? ` (${extra})` : '') });
  const sfm = (lo: number, hi: number, row: string) => {
    const a = Math.round(lo * SFM), b = Math.round(hi * SFM);
    return { lo: a, hi: b, color: S.pro.color, note: `${S.pro.name}: ${row}, ${lo}–${hi} SFM`, text: t(`${a}–${b}`) };
  };
  const lim = tr ? 'yalnız kısıtlı koşullarda' : 'restricted conditions only';
  return {
    legend: Object.values(S).map((s) => ({ name: s.name, color: s.color })),
    rows: [
      { label: tr ? 'Alüminyum' : 'Aluminium', ranges: [one(20), sfm(125, 325, tr ? 'alüminyum' : 'aluminum')] },
      { label: tr ? 'Çelik < 500 N/mm²' : 'Steel < 500 N/mm²', ranges: [one(15), sfm(50, 80, tr ? 'düşük karbonlu çelikler' : 'low carbon steels')] },
      { label: tr ? 'Çelik < 750 N/mm²' : 'Steel < 750 N/mm²', ranges: [one(10)] },
      { label: tr ? 'Çelik < 900 N/mm²' : 'Steel < 900 N/mm²', ranges: [one(7)] },
      { label: tr ? 'Çelik < 1.100 N/mm²' : 'Steel < 1,100 N/mm²', ranges: [one(5)] },
      { label: tr ? 'Paslanmaz < 900 N/mm²' : 'Stainless < 900 N/mm²', ranges: [one(5), sfm(20, 30, tr ? 'östenitik paslanmaz' : 'stainless, austenitic')] },
      { label: tr ? 'Dökme demir GG(G)' : 'Cast iron GG(G)', ranges: [one(5, lim), sfm(25, 40, tr ? 'sfero dökme demir' : 'cast iron, ductile')] },
      { label: tr ? 'Bakır' : 'Copper', ranges: [one(13, lim), sfm(50, 75, tr ? 'bakır ve bakır alaşımları' : 'copper / Cu alloys')] },
      { label: tr ? 'Titanyum > 850 N/mm²' : 'Titanium > 850 N/mm²', ranges: [one(5, lim), sfm(35, 100, tr ? 'titanyum' : 'titanium')] },
    ],
  };
};
