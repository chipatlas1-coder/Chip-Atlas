/**
 * ISO 5608 designation of turning and copying tool holders and cartridges for indexable inserts.
 *
 * Sources (see `sources` below):
 * - ISO 5608:2012 is current (confirmed 2023). Its text could not be read; the position tables follow
 *   ISO 5608:1995 as adopted word for word in IS 14863:2000, and the worked examples of
 *   ISO 5610-2 and ISO 5610-7:2014 (adopted as IS 16637 Parts 2 and 7:2018), which cite
 *   "ISO 5608:2012, Table 6" for the length letters and use the same nine positions.
 * - Positions 2, 4 and 9 follow ISO 1832 (ISO 5608:1995: "The codes (2), (4) and (9) are in
 *   accordance with ISO 1832"), so they are taken from the site's ISO 1832 tables.
 * - `single: true` marks a value found in one source only (the 1995 text); `note` keys point to the
 *   known disagreements between sources, which the decoder shows rather than resolves.
 */
import { shapes, clearances, sizes } from './iso1832.js';

export { shapes, clearances };

/** Position 1: method of holding the horizontally mounted insert. Turkish names as AKKO prints them. */
export const clamping = {
  C: { hole: false, en: 'Top clamping, insert without hole', tr: 'Deliksiz üstten sıkma (uçta delik yok)', aka: { en: 'top clamp', tr: 'üstten sıkma' } },
  M: { hole: true, en: 'Top and hole clamping, insert with hole', tr: 'Üstten ve delikten sıkma (delikli uç)', aka: { en: 'catalogues: multi lock, pin and clamp; Mitsubishi: double clamp', tr: 'kataloglarda: çoklu sıkma, pim ve pabuç; Mitsubishi: çift sıkma' } },
  P: { hole: true, en: 'Hole clamping, insert with hole', tr: 'Delikten levye ile sıkma (delikli uç)', aka: { en: 'catalogues: lever lock', tr: 'kataloglarda: levye (lever lock)' } },
  S: { hole: true, en: 'Screw clamping through the hole', tr: 'Vida ile sıkma (delikten vidalı)', aka: { en: 'catalogues: screw-on', tr: 'kataloglarda: vidalı' } },
};

/** Letters found in catalogues at position 1 that ISO 5608:1995 does not define. */
export const clampingNonIso = {
  D: { en: 'not in ISO 5608:1995; catalogues use it for a double or rigid clamp, a variant of top and hole clamping', tr: 'ISO 5608:1995’te yok; kataloglar çift ya da rijit sıkma için kullanır (üstten ve delikten sıkmanın bir türü)' },
  E: { en: 'not in ISO 5608:1995; HHTools uses it for a pin lock (Sumitomo lists a pin lock with an eccentric pin, but its letter could not be read)', tr: 'ISO 5608:1995’te yok; HHTools pimle sıkma için kullanır (Sumitomo eksantrik pimli sıkma da verir, ama harfi okunamadı)' },
  A: { en: 'not in ISO 5608:1995; Tungaloy uses it for a double clamp', tr: 'ISO 5608:1995’te yok; Tungaloy çift sıkma için kullanır' },
  T: { en: 'not in ISO 5608:1995; YG-1 uses it for a hole clamp in one catalogue and a double clamp in another', tr: 'ISO 5608:1995’te yok; YG-1 bir katalogda delikten sıkma, bir başkasında çift sıkma için kullanır' },
  N: { en: 'not in ISO 5608:1995; Kennametal (inch catalogue) uses it for its Top Notch clamp', tr: 'ISO 5608:1995’te yok; Kennametal (inç kataloğu) Top Notch sıkması için kullanır' },
};

/**
 * Position 3: tool style. kr = tool cutting edge angle κr in degrees (measured from the feed
 * direction); shank straight or offset; cut = side (feed across the shank), end (feed along the
 * shank) or both. part = the ISO 5610 part that gives the style's dimensions.
 */
export const styles = {
  A: { kr: 90, shank: 'straight', cut: 'side', part: 2, note: 'tri91A' },
  B: { kr: 75, shank: 'straight', cut: 'side', part: 3 },
  C: { kr: 90, shank: 'straight', cut: 'end', single: true },
  D: { kr: 45, shank: 'straight', cut: 'side', part: 4, round: true },
  E: { kr: 60, shank: 'straight', cut: 'side' },
  F: { kr: 90, shank: 'offset', cut: 'end', part: 5, note: 'F' },
  G: { kr: 90, shank: 'offset', cut: 'side', part: 6, note: 'tri91G' },
  H: { kr: 107.5, shank: 'offset', cut: 'side', part: 14, note: 'H100' },
  J: { kr: 93, shank: 'offset', cut: 'side', part: 7 },
  K: { kr: 75, shank: 'offset', cut: 'end', part: 8 },
  L: { kr: 95, shank: 'offset', cut: 'both', part: 9, note: 'L' },
  M: { kr: 50, shank: 'straight', cut: 'side', single: true },
  N: { kr: 63, shank: 'straight', cut: 'side', part: 10, note: 'N625' },
  P: { kr: 117.5, shank: 'offset', cut: 'side', single: true, note: 'P625' },
  R: { kr: 75, shank: 'offset', cut: 'side', part: 11 },
  S: { kr: 45, shank: 'offset', cut: 'side', part: 12, round: true },
  T: { kr: 60, shank: 'offset', cut: 'side', part: 13 },
  U: { kr: 93, shank: 'offset', cut: 'end' },
  V: { kr: 72.5, shank: 'unclear', cut: 'side', part: 15, note: 'Vshank' },
  W: { kr: 60, shank: 'offset', cut: 'end' },
  Y: { kr: 85, shank: 'offset', cut: 'end' },
};

/** Style letters seen in catalogues that ISO 5608:1995 does not define for external holders. */
export const stylesNonIso = {
  Q: { kr: 107.5, en: 'not an ISO 5608 style letter: catalogues (Tungaloy, ISCAR, Kennametal) use Q for κr 107.5°, which ISO writes H; in ISO 5609-6 (boring bars) style Q is 107.5° with a reduced shank', tr: 'ISO 5608 tutucu tipi harfi değil: kataloglar (Tungaloy, ISCAR, Kennametal) κr 107,5° için Q kullanır, ISO bunu H ile yazar; ISO 5609-6’da (delik tornalama barası) Q tipi, κr 107,5° ve inceltilmiş saplıdır' },
  X: { kr: null, en: 'special design (Mitsubishi, ISCAR); Tungaloy’s index uses X for 20°; not an ISO 5608 style letter', tr: 'özel tasarım (Mitsubishi, ISCAR); Tungaloy’un dizini X’i 20° için kullanır; ISO 5608 tutucu tipi harfi değil' },
  I: { kr: 76.5, en: 'Tungaloy’s own letter (κr 76.5°); not in ISO 5608', tr: 'Tungaloy’a özgü harf (κr 76,5°); ISO 5608’de yok' },
};

/** Notes on the disagreements between sources, shown with the style. */
export const styleNotes = {
  tri91A: { en: 'ISO gives 90°; Tungaloy prints 91° for style A.', tr: 'ISO 90° verir; Tungaloy A tipi için 91° basar.' },
  F: { en: 'ISO 5608:1995 and the BSI abstract of ISO 5610-5 give an offset shank and end cutting; the iso.org abstract says straight shank, side cutting. ISO gives 90°; Tungaloy and Sumitomo (DTFNR) print 91°.', tr: 'ISO 5608:1995 ve ISO 5610-5’in BSI özeti kaçık sap ve uçtan kesme verir; iso.org özeti düz sap ve yandan kesme der. ISO 90° verir; Tungaloy ve Sumitomo (DTFNR) 91° basar.' },
  tri91G: { en: 'ISO gives 90°; several makers print 91° for style G with triangular inserts (Tungaloy, ISCAR, ZCC DTGNR, Pramet DTGN and STGC).', tr: 'ISO 90° verir; birçok üretici üçgen uçlu G tipi için 91° basar (Tungaloy, ISCAR, ZCC DTGNR, Pramet DTGN ve STGC).' },
  H100: { en: 'ISO 5608:1995, ISO 5610-14 and YG-1 give 107.5°; Tungaloy’s 2023-24 index prints H at 100°.', tr: 'ISO 5608:1995, ISO 5610-14 ve YG-1 107,5° verir; Tungaloy’un 2023-24 dizini H için 100° basar.' },
  L: { en: 'ISO 5608:1995: 95° on both cutting edges (side and end cutting); the ISO 5610-9 summary says end cutting.', tr: 'ISO 5608:1995: iki kesici ağızda da 95° (yandan ve uçtan kesme); ISO 5610-9 özeti uçtan kesme der.' },
  N625: { en: 'ISO gives 63°; several catalogues (ISCAR, YG-1, ZCC) print 62.5°, which is (180° − 55°)/2 for a 55° insert centred in a neutral holder.', tr: 'ISO 63° verir; bazı kataloglar (ISCAR, YG-1, ZCC) 62,5° basar; bu, nötr tutucuda ortalanmış 55°’lik uç için (180° − 55°)/2’dir.' },
  P625: { en: 'Tungaloy, ZCC, Pramet and Kennametal use P for 62.5° instead of ISO’s 117.5°: check the catalogue.', tr: 'Tungaloy, ZCC, Pramet ve Kennametal P’yi ISO’nun 117,5°’si yerine 62,5° için kullanır: kataloğa bakın.' },
  Vshank: { en: 'κr 72.5° is agreed; the shank is straight in the ISO 5608:1995 table but offset in ISO 5610-15.', tr: 'κr 72,5° konusunda kaynaklar uyuşur; sap ISO 5608:1995 tablosunda düz, ISO 5610-15’te kaçıktır.' },
};

/** Position 5: hand of tool. */
export const hands = {
  R: { en: 'Right-hand', tr: 'Sağ' },
  L: { en: 'Left-hand', tr: 'Sol' },
  N: { en: 'Neutral (ISO 5608:1995: “either hand”)', tr: 'Nötr (ISO 5608:1995: “either hand”, iki yönlü)' },
};

/** Position 8: tool length l1 in mm (ISO 5608 Table 6). X = special length, to be specified. */
export const lengths = {
  A: 32, B: 40, C: 50, D: 60, E: 70, F: 80, G: 90, H: 100, J: 110, K: 125, L: 140, M: 150,
  N: 160, P: 170, Q: 180, R: 200, S: 250, T: 300, U: 350, V: 400, W: 450, Y: 500, X: null,
};

/** Optional position 10: qualified tools, ±0.08 mm (ISO 5608:1995, one source). */
export const qualified = {
  Q: { en: 'Back and end qualified tool, ±0.08 mm', tr: 'Arka ve alın yüzeyi kalibre tutucu, ±0,08 mm' },
  F: { en: 'Front and end qualified tool, ±0.08 mm', tr: 'Ön ve alın yüzeyi kalibre tutucu, ±0,08 mm' },
  B: { en: 'Front, back and end qualified tool, ±0.08 mm', tr: 'Ön, arka ve alın yüzeyi kalibre tutucu, ±0,08 mm' },
};

const src = (en, tr, url) => ({ en, tr, url });
const sourceList = [
  src('ISO 5608:2012, Turning and copying tool holders and cartridges for indexable inserts — Designation (ISO catalogue page; confirmed 2023)', 'ISO 5608:2012, Turning and copying tool holders and cartridges for indexable inserts — Designation (ISO katalog sayfası; 2023’te yeniden onaylandı)', 'https://www.iso.org/standard/60180.html'),
  src('IS 14863:2000 (BIS), identical to ISO 5608:1995 — position tables, qualified tools, example CTGNR 3225 M16 Q', 'IS 14863:2000 (BIS), ISO 5608:1995 ile aynı — hane tabloları, kalibre tutucular, CTGNR 3225 M16 Q örneği', 'https://archive.org/details/gov.in.is.14863.2000'),
  src('IS 16637 (Part 7):2018 and (Part 2):2018 (BIS), identical to ISO 5610-7:2014 and ISO 5610-2:2014 — worked examples SDJCR 1010 E07, PTJNR 3225 P16, SVJBR 2020 K16, SCACR 1010 E06', 'IS 16637 (Bölüm 7):2018 ve (Bölüm 2):2018 (BIS), ISO 5610-7:2014 ve ISO 5610-2:2014 ile aynı — çözümlü örnekler SDJCR 1010 E07, PTJNR 3225 P16, SVJBR 2020 K16, SCACR 1010 E06'),
  src('ISO 5610-2 to -15:2014, tool holders with rectangular shank, one style per part (ISO catalogue abstracts)', 'ISO 5610-2 … ISO 5610-15:2014, dikdörtgen saplı tutucular, her bölümde bir tip (ISO katalog özetleri)', 'https://www.iso.org/standard/64182.html'),
  src('Mitsubishi Materials, ISO codes key: turning tools for external machining', 'Mitsubishi Materials, ISO kod anahtarı: dış çap tornalama takımları', 'https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/bite_1.html'),
  src('Sumitomo Electric, Section C 25-26, external tool identification table', 'Sumitomo Electric, Section C 25-26, dış çap takımı tanıtım tablosu', 'https://online.flippingbook.com/view/331904629/2/'),
  src('Tungaloy, General Catalogue 2023-2024, C External toolholders, designation system', 'Tungaloy, Genel Katalog 2023-2024, C Dış çap tutucuları, kodlama sistemi', 'https://tungaloy.com/wpdata/wp-content/uploads/GC_2023-2024_G_C_ExternalToolholder.pdf'),
  src('ISCAR, ISOTURN inch catalogue 2022, toolholder identification system (pp. 6–7)', 'ISCAR, ISOTURN inç kataloğu 2022, tutucu tanıtım sistemi (s. 6–7)', 'https://www.iscar.com/Catalogs/publication-2022/english-1/Turning_catalog_INCH_2022_45/Turning%20catalog%20INCH%202022_LR_P1-112.pdf'),
  src('YG-1, YE-IT24 indexable inserts, turning (holder designation key)', 'YG-1, YE-IT24 kesici uçlar, tornalama (tutucu kod anahtarı)', 'https://groupedorise.fr/boutique/datas/documents/ye-it24-indexable-insert_240430_int_turning_20241211170704.pdf'),
  src('AKKO Cutting Tools (Turkey), tool catalogue in Turkish, English and Russian — Turkish clamping names', 'AKKO Cutting Tools (Türkiye), Türkçe, İngilizce ve Rusça takım kataloğu — Türkçe sıkma tipi adları', 'https://pdf.directindustry.com/pdf/akko-cutting-tools/akko-tool-catalog/54143-1063236.html'),
  src('Kennametal, Turning Toolholders Master Catalog (inch/ANSI lead angles; converted here with κr = 90° − lead)', 'Kennametal, Turning Toolholders Master Catalog (inç/ANSI lead açıları; burada κr = 90° − lead ile çevrildi)', 'https://www.productivity.com/wp-content/uploads/pdfs/Kennametal%20Turning%20Toolholders%20-%20Master%20Catalog.pdf'),
  src('ZCC-CT, Turning Holder catalogue 2022–2023 (DTGNR 91°, SDNCN and PDPNN 62°30′)', 'ZCC-CT, Tornalama Tutucuları kataloğu 2022–2023 (DTGNR 91°, SDNCN ve PDPNN 62°30′)', 'https://sakusakuec.com/download/zcc_catalog_2022-2023_TurningHolder.pdf'),
  src('Dormer Pramet catalogue, external turning tools (DTGN and STGC 91°, DDPNN 62.5°)', 'Dormer Pramet kataloğu, dış çap tornalama takımları (DTGN ve STGC 91°, DDPNN 62,5°)', 'https://powelltoolsupplyinc.assets-ascend-prod.roccommercecloud.com/assets%2FProduction%2F2c09719daaecbb19072d1c095c6d3a1e/Pramet_6753291_Catalog.pdf'),
  src('KORLOY, Code System – External Toolholders (positions 10 and 11: clamping system, insert thickness)', 'KORLOY, Code System – External Toolholders (10. ve 11. haneler: sıkma sistemi, uç kalınlığı)', 'https://www.cutwel.co.uk/media/product-pdfs/downloads/Ceramic%20Turning%20Tools.pdf'),
  src('HHTools / Euro-Inserts, identification of ISO holders (E pin lock, O special clearance)', 'HHTools / Euro-Inserts, ISO tutucu tanıtım tablosu (E pim sıkma, O özel boşluk açısı)', 'https://hhtools.nl/content/files/technische%20informatie/identification%20of%20iso%20holders%20b2.pdf'),
  src('YG-1, YE-IT20 indexable inserts (T = hole clamp; N 63°, SDNCN 62.5°)', 'YG-1, YE-IT20 kesici uçlar (T = delikten sıkma; N 63°, SDNCN 62,5°)', 'https://organametrisis.gr/cdn/shop/files/YAAV-01-M3x10_datasheet.pdf'),
  src('Mitsubishi Materials e-learning, tool holder identification code (P lever lock, negative insert, thickness symbol)', 'Mitsubishi Materials e-öğrenme, tutucu tanıtım kodu (P levye, negatif uç, kalınlık simgesi)', 'https://www.mmc-carbide.com/permanent/courses/85/tool-holder-identification-code.html'),
  src('BS ISO 5609-6:2012, boring bars, style Q (κr 107.5°, reduced shank), BSI abstract', 'BS ISO 5609-6:2012, delik tornalama baraları, Q tipi (κr 107,5°, inceltilmiş sap), BSI özeti', 'https://knowledge.bsigroup.com/products/tool-holders-for-internal-turning-with-cylindrical-shank-for-indexable-inserts-style-q'),
  src('BS ISO 5610-5:2014, style F (offset shank, κr 90°, end cutting), BSI abstract', 'BS ISO 5610-5:2014, F tipi (kaçık sap, κr 90°, uçtan kesme), BSI özeti', 'https://knowledge.bsigroup.com/products/tool-holders-with-rectangular-shank-for-indexable-inserts-style-f'),
  src('McMaster-Carr, turning carbide insert holders (cut direction: right-hand holders move from right to left toward the chuck)', 'McMaster-Carr, tornalama tutucuları (kesme yönü: sağ tutucular sağdan sola, aynaya doğru ilerler)', 'https://www.mcmaster.com/cnmg-carbide-insert-holders'),
  src('Sherline, 55° RH and LH tool holders (a right-hand tool has its cutting edge on the left)', 'Sherline, 55° sağ ve sol tutucular (sağ takımın kesici ağzı soldadır)', 'https://sherline.com/product/2256-2258-55-rh-and-lh-carbide-insert-tool-holders'),
  src('Cromwell, Sandvik Coromant DCLNR 2020-K12 (“Top & Hole Clamp”, l1 125 mm)', 'Cromwell, Sandvik Coromant DCLNR 2020-K12 (“Top & Hole Clamp”, l1 125 mm)', 'https://cromwell.co.uk/shop/cutting-tools/iso-external-toolholders/dclnr-2020-k12-toolholder-top-and-hole-clamp/p/SNK1062276T'),
];
/** Sources in the page's language, as { label, url } for the tool frame. */
export const sourcesFor = (locale) => sourceList.map((x) => ({ label: x[locale], url: x.url }));
export const sources = sourcesFor('en');

/**
 * Parse a holder designation such as "PCLNR 2525 M12", "SVJBR 2020 K16", "CTGNR 3225 M16 Q",
 * "DCLNR 2020-K12" or a cartridge such as "PTFNR 10CA11". Returns null when the nine
 * mandatory positions cannot be read.
 */
export function parseHolderCode(input) {
  const raw = String(input || '').toUpperCase().trim();
  const compact = raw.replace(/\s+/g, '');
  let m = compact.match(/^([A-Z])([A-Z])([A-Z])([A-Z])([A-Z])(\d{2})(\d{2})-?([A-Z]|-)(\d{2})(.*)$/);
  let kind = 'holder';
  let h = null, b = null, cartridge = null, lengthCode = null, size = null, rest = '';
  let letters;
  if (m) {
    letters = m.slice(1, 6);
    h = Number(m[6]); b = Number(m[7]); lengthCode = m[8]; size = m[9]; rest = m[10];
  } else {
    m = compact.match(/^([A-Z])([A-Z])([A-Z])([A-Z])([A-Z])(\d{2})C([A-Z])([A-Z]|-)?(\d{2})(.*)$/);
    if (!m) return null;
    kind = 'cartridge';
    letters = m.slice(1, 6);
    h = Number(m[6]); cartridge = m[7]; lengthCode = m[8] || null; size = m[9]; rest = m[10];
  }
  const [clamp, shape, style, clearance, hand] = letters;
  let qual = null, suffix = null;
  const r = rest.replace(/^[-\s]+/, '');
  const q = r.match(/^([QFB])(?:-(.*))?$/);
  if (rest && q && !rest.startsWith('-')) { qual = q[1]; suffix = q[2] || null; }
  else if (r) suffix = r;
  const sizeTable = sizes[shape];
  const dims = sizeTable ? sizeTable[size] : undefined;
  const st = styles[style];
  const sh = shapes[shape];
  const eps = sh && sh.angle != null ? sh.angle : null;
  // minor cutting edge angle κr′ = 180° − κr − εr for a side or end cutting holder
  const kr = st ? st.kr : stylesNonIso[style]?.kr ?? null;
  const minor = kr != null && eps != null && hand !== 'N' ? 180 - kr - eps : null;
  return {
    code: compact,
    kind,
    clamp, shape, style, clearance, hand,
    height: h, width: b, cartridge,
    lengthCode, length: lengthCode && lengthCode !== '-' ? (lengths[lengthCode] ?? null) : null,
    size,
    edgeLength: dims ? dims[0] : null,
    inscribedCircle: dims ? dims[1] : null,
    qualified: qual,
    suffix,
    kr, eps, minor,
    // ISO 1832 insert that fits: shape, clearance and size are shared by the two codes
    insert: `${shape}${clearance}·· ${size}`,
    known: {
      clamp: Boolean(clamping[clamp]),
      clampNonIso: Boolean(clampingNonIso[clamp]),
      shape: Boolean(sh),
      style: Boolean(st),
      styleNonIso: Boolean(stylesNonIso[style]),
      clearance: clearance in clearances,
      hand: Boolean(hands[hand]),
      length: lengthCode === '-' || lengthCode === null ? kind === 'cartridge' : lengthCode in lengths,
      size: Boolean(dims),
    },
  };
}
