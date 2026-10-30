/**
 * Internal-turning article: longest recommended boring-bar overhang, in bar diameters, maker by maker,
 * as each states it (never averaged). Sources in the article: Sandvik Coromant training handbook; ISCAR's
 * World 2/2017 and WHISPERLINE guide 2019; Mitsubishi Materials e-learning; Tungaloy BoreMeister 517-US
 * (2026); Kyocera Unimerco "Dynamic Bar" and Kyocera KAV pages; Ingersoll NEW-337-5 (2026); Seco press
 * release (2018); Kennametal heavy-metal bars via Aerospace Manufacturing and Design (2008).
 */
type L = 'en' | 'tr';
export const ldLimits = (l: L) => {
  const tr = l === 'tr';
  const t = (s: string) => (tr ? s.replace(/(\d)\.(\d)/g, '$1,$2') : s);
  const M = {
    sandvik: { color: '#13998a', name: 'Sandvik Coromant' },
    iscar: { color: '#1e6fd6', name: 'ISCAR' },
    mmc: { color: '#d4520f', name: 'Mitsubishi' },
    tung: { color: '#c98a0a', name: 'Tungaloy' },
    kyo: { color: '#8b52c9', name: 'Kyocera' },
    ing: { color: '#d23c63', name: 'Ingersoll' },
    seco: { color: '#1690a6', name: 'Seco' },
    kmt: { color: '#555d63', name: 'Kennametal' },
  };
  type K = keyof typeof M;
  const up = (k: K, v: number, txt?: string) => ({ lo: 0, hi: v, upTo: true, color: M[k].color, note: M[k].name, text: t(txt ?? `${tr ? '' : 'up to '}${v}${tr ? '’e kadar' : ''}`) });
  const rg = (k: K, a: number, b: number, txt: string) => ({ lo: a, hi: b, color: M[k].color, note: M[k].name, text: t(txt) });
  const steel = tr ? 'Çelik bara' : 'Steel bar', heavy = tr ? 'Ağır metal bara' : 'Heavy-metal bar', carb = tr ? 'Karbür bara' : 'Carbide bar', damp = tr ? 'Titreşim sönümleyici bara' : 'Damped bar';
  return {
    legend: (Object.keys(M) as K[]).map((k) => ({ name: M[k].name, color: M[k].color })),
    rows: [
      { label: steel, ranges: [
        up('sandvik', 4, tr ? '4' : '4'), up('iscar', 4, '4'), up('tung', 4, '4'), rg('kyo', 4, 4, tr ? 'yaklaşık 4' : 'about 4'),
        rg('mmc', 4, 5, tr ? '4–5 üstünde titreşime yatkın' : 'prone to vibration above 4–5'),
        up('ing', 3, tr ? '3 (çok kararlı koşulda ~4)' : '3 (~4 if very stable)'),
      ] },
      { label: heavy, ranges: [rg('kmt', 4, 6, '4–6')] },
      { label: carb, ranges: [
        up('sandvik', 6, '6'), rg('iscar', 4, 6, tr ? '4’ün üstünde, 6’ya kadar' : 'over 4, up to 6'), rg('kyo', 7, 7, tr ? 'yaklaşık 7' : 'about 7'),
        up('ing', 5, tr ? '5 (s. 3); 6’nın ötesinde sorun (s. 4)' : '5 (p. 3); trouble beyond 6 (p. 4)'),
        rg('mmc', 5, 5, tr ? '5’in üstünde karbür önerilir' : 'carbide recommended above 5'),
      ] },
      { label: damp, ranges: [
        up('sandvik', 7, tr ? '7 kısa' : '7 short'), up('sandvik', 10, tr ? '10 uzun' : '10 long'), up('sandvik', 14, tr ? '14 karbür takviyeli' : '14 carbide-reinf.'),
        rg('iscar', 7, 10, tr ? '7–10 (12 ve 14 istek üzerine)' : '7–10 (12 and 14 on request)'),
        up('seco', 10, '10'), up('kyo', 10, '10'),
        up('tung', 14, '14'), up('ing', 14, '14'),
      ] },
    ],
  };
};
