/**
 * Property values compared across material pages. Each value is the one printed in that page's
 * table, with the same source: 1.4301 / 1.4401 from Deutsche Edelstahlwerke and Outokumpu;
 * C45E from Deutsche Edelstahlwerke (2011); 42CrMo4 from thyssenkrupp Materials Services;
 * aluminium alloys from their own pages (6061-T6: Euralliage, Aalco; 6082-T6: Euralliage,
 * Hydro; 7075-T6: MatWeb 130, voestalpine and Euralliage 134, drawn as a range). Keep in step with those tables.
 */
type L = 'en' | 'tr';
type Row = { key: string; en: string; tr: string; sub?: { en: string; tr: string }; k: number; lo?: number; hi?: number };
const rows: Row[] = [
  { key: '304', en: '304', tr: '304', sub: { en: '1.4301', tr: '1.4301' }, k: 15 },
  { key: '316', en: '316', tr: '316', sub: { en: '1.4401', tr: '1.4401' }, k: 15 },
  { key: 'c45e', en: 'C45E', tr: 'C45E', sub: { en: '1.1191', tr: '1.1191' }, k: 42.6 },
  { key: '42crmo4', en: '42CrMo4', tr: '42CrMo4', sub: { en: '1.7225', tr: '1.7225' }, k: 45.1 },
  { key: '7075', en: '7075-T6', tr: '7075-T6', sub: { en: 'EN AW-7075', tr: 'EN AW-7075' }, k: 130, lo: 130, hi: 134 },
  { key: '6061', en: '6061-T6', tr: '6061-T6', sub: { en: 'EN AW-6061', tr: 'EN AW-6061' }, k: 166 },
  { key: '6082', en: '6082-T6', tr: '6082-T6', sub: { en: 'EN AW-6082', tr: 'EN AW-6082' }, k: 172 },
];
/** Thermal conductivity at 20 °C, W/(m·K). `hl` = keys of the page's own materials; `only` = rows to show (all if omitted). */
export const conductivity = (l: L, hl: string[], only?: string[]) =>
  rows.filter((r) => !only || only.includes(r.key)).map((r) => {
    const t = r.lo !== undefined && r.hi !== undefined ? `${r.lo}–${r.hi}` : String(r.k);
    return { label: r[l], sub: r.sub?.[l], value: r.k, lo: r.lo, hi: r.hi, highlight: hl.includes(r.key), text: l === 'tr' ? t.replace('.', ',') : t };
  });
