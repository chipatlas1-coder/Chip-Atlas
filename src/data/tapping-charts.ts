/**
 * Tapping article: cutting speeds by maker, as printed (m/min). Only values whose column could be
 * assigned with certainty are used (see the article): YG-1 Prime taps (HSS-PM, bright) and Synchro
 * taps (HSS-PM, TiN/TiCN), CERATIZIT TruTap through-hole taps (HSS-E; range over its coating
 * variants, ISO main groups; DIN 371 and 376, pp. 6|16–17), Hoffmann (GARANT) nitrided HSS-E.
 * Yamawa's AU sheet is left out: its speed column has six values for seven materials.
 */
type L = 'en' | 'tr';
export const tapSpeeds = (l: L) => {
  const tr = l === 'tr';
  const t = (s: string) => (tr ? s.replace(/\./g, ',') : s);
  const S = {
    ygB: { color: '#1e6fd6', name: tr ? 'YG-1 HSS-PM, kaplamasız' : 'YG-1 HSS-PM, bright' },
    ygT: { color: '#c98a0a', name: tr ? 'YG-1 HSS-PM, TiN/TiCN (senkron)' : 'YG-1 HSS-PM, TiN/TiCN (synchro)' },
    cer: { color: '#d4520f', name: tr ? 'CERATIZIT HSS-E, spiral uçlu' : 'CERATIZIT HSS-E, spiral point' },
    hof: { color: '#13998a', name: tr ? 'Hoffmann HSS-E, nitrürlenmiş' : 'Hoffmann HSS-E, nitrided' },
  };
  const r = (lo: number, hi: number, s: { color: string; name: string }, extra = '') => ({ lo, hi, color: s.color, note: s.name + (extra ? `, ${extra}` : ''), text: (lo === hi ? t(String(lo)) : t(`${lo}–${hi}`)) + (extra ? ` (${extra})` : '') });
  const isoP = tr ? 'tüm ISO P' : 'all of ISO P';
  return {
    legend: Object.values(S).map((s) => ({ name: s.name, color: s.color })),
    rows: [
      { label: tr ? 'Alaşımsız çelik' : 'Unalloyed steel', ranges: [r(15, 20, S.ygB), r(41, 46, S.ygT), r(12, 15, S.cer, isoP)] },
      { label: tr ? 'Alaşımlı çelik' : 'Alloy steel', ranges: [r(10, 15, S.ygB), r(28, 33, S.ygT), r(12, 15, S.cer, isoP)] },
      { label: tr ? 'Östenitik paslanmaz' : 'Austenitic stainless', ranges: [r(5, 8, S.ygB), r(13, 18, S.ygT), r(7, 9, S.cer)] },
      { label: tr ? 'Gri dökme demir' : 'Grey cast iron', ranges: [r(10, 15, S.ygB), r(28, 33, S.ygT), r(12, 18, S.cer), r(13, 13, S.hof)] },
      { label: tr ? 'Dövme alüminyum' : 'Wrought aluminium', ranges: [r(25, 35, S.ygB), r(72, 77, S.ygT), r(12, 12, S.cer, 'ISO N')] },
    ],
  };
};
