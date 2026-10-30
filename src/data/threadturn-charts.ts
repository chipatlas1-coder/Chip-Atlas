/**
 * Thread-turning article: number of passes by pitch, ISO metric, maker by maker as each states it (never
 * averaged). Mitsubishi Materials, "Standard of depth of cut, external (radial infeed)" ISO 60°; Korloy,
 * threading catalogue p. D6; Haas, "Top Notch" threading speeds and number of passes (insert grade HU25),
 * whose rows cover pitch bands (0.5–0.75, 0.8–1.0, 1.25–1.5, 1.75–2.0, 2.5–3.0, 3.5–4.0 mm).
 */
type L = 'en' | 'tr';
export const passCounts = (l: L) => {
  const tr = l === 'tr';
  const t = (s: string) => (tr ? s.replace(/(\d)\.(\d)/g, '$1,$2') : s);
  const M = {
    mmc: { color: '#d4520f', name: 'Mitsubishi' },
    kor: { color: '#2a78d6', name: 'Korloy' },
    haas: { color: '#13998a', name: 'Haas (HU25)' },
  };
  type K = keyof typeof M;
  const pt = (v: number) => ({ lo: v, hi: v, color: M.mmc.color, note: M.mmc.name, text: String(v) });
  const rg = (k: K, a: number, b: number, band?: string) => ({ lo: a, hi: b, color: M[k].color, note: M[k].name, text: t(`${a}–${b}${band ? (tr ? ` (${band} mm satırı)` : ` (${band} mm row)`) : ''}`) });
  const row = (P: string, ranges: ReturnType<typeof rg>[]) => ({ label: t(`P ${P} mm`), ranges });
  return {
    legend: (Object.keys(M) as K[]).map((k) => ({ name: M[k].name, color: M[k].color })),
    rows: [
      row('0.5', [pt(4), rg('kor', 4, 6), rg('haas', 4, 5, '0.5–0.75')]),
      row('1.0', [pt(5), rg('kor', 4, 8), rg('haas', 5, 6, '0.8–1.0')]),
      row('1.5', [pt(6), rg('kor', 6, 10), rg('haas', 6, 8, '1.25–1.5')]),
      row('2.0', [pt(8), rg('kor', 7, 12), rg('haas', 8, 10, '1.75–2.0')]),
      row('2.5', [pt(10), rg('kor', 8, 14), rg('haas', 9, 12, '2.5–3.0')]),
      row('3.0', [pt(12), rg('kor', 9, 16), rg('haas', 9, 12, '2.5–3.0')]),
      row('3.5', [pt(12), rg('kor', 10, 18), rg('haas', 12, 15, '3.5–4.0')]),
      row('4.0', [pt(14), rg('kor', 11, 18), rg('haas', 12, 15, '3.5–4.0')]),
    ],
  };
};
