/**
 * The 18 sections of the atlas, with their subsections.
 * Mirrors the Chip Atlas site map; page counts are planned pages.
 * Priority: 1 = first three months, 2 = months 3–9, 3 = after.
 */
export interface Subsection {
  slug: { en: string; tr: string };
  name: { en: string; tr: string };
  pages: number;
}

export interface Section {
  n: number;
  slug: { en: string; tr: string };
  name: { en: string; tr: string };
  lead: { en: string; tr: string };
  priority: 1 | 2 | 3;
  subsections: Subsection[];
}

const s = (en: string, tr: string, pages: number, slugEn: string, slugTr: string): Subsection => ({
  slug: { en: slugEn, tr: slugTr },
  name: { en, tr },
  pages,
});

export const sections: Section[] = [
  {
    n: 1,
    slug: { en: 'fundamentals', tr: 'temeller' },
    name: { en: 'Fundamentals', tr: 'Temeller' },
    lead: {
      en: 'The physics behind every process: how a chip forms, where the heat goes, why tools wear and what a surface remembers of the cut.',
      tr: 'Her prosesin arkasındaki fizik: talaş nasıl oluşur, ısı nereye gider, takım neden aşınır ve yüzey kesmeden ne hatırlar.',
    },
    priority: 1,
    subsections: [
      s('Chip formation', 'Talaş oluşumu', 9, 'chip-formation', 'talas-olusumu'),
      s('Cutting mechanics', 'Kesme mekaniği', 9, 'cutting-mechanics', 'kesme-mekanigi'),
      s('Heat in cutting', 'Kesme bölgesinde ısı', 6, 'heat-in-cutting', 'kesme-bolgesinde-isi'),
      s('Tool wear', 'Takım aşınması', 6, 'tool-wear', 'takim-asinmasi'),
      s('Tool life and economics', 'Takım ömrü ve ekonomi', 5, 'tool-life', 'takim-omru'),
      s('Machinability', 'İşlenebilirlik', 6, 'machinability', 'islenebilirlik'),
      s('Surface integrity', 'Yüzey bütünlüğü', 7, 'surface-integrity', 'yuzey-butunlugu'),
      s('Vibration and chatter', 'Titreşim ve tırlama', 5, 'vibration-and-chatter', 'titresim-ve-tirlama'),
    ],
  },
  {
    n: 2,
    slug: { en: 'processes', tr: 'prosesler' },
    name: { en: 'Processes', tr: 'Prosesler' },
    lead: {
      en: 'Turning, milling, hole-making, grinding and every finishing and non-traditional method, each opened with a 3D model and tied to its cutting data.',
      tr: 'Tornalama, frezeleme, delik işlemleri, taşlama ve bütün ince ve geleneksel olmayan yöntemler; her biri 3D modelle açılır ve kendi kesme verisine bağlanır.',
    },
    priority: 1,
    subsections: [
      s('Turning', 'Tornalama', 16, 'turning', 'tornalama'),
      s('Milling', 'Frezeleme', 18, 'milling', 'frezeleme'),
      s('Hole-making', 'Delik işlemleri', 15, 'hole-making', 'delik-islemleri'),
      s('Grinding and finishing', 'Taşlama ve ince işlemler', 19, 'grinding-and-finishing', 'taslama-ve-ince-islemler'),
      s('Gear manufacturing', 'Dişli imalatı', 10, 'gear-manufacturing', 'disli-imalati'),
      s('Broaching, planing, sawing', 'Broşlama, planya, testere', 6, 'broaching-planing-sawing', 'broslama-planya-testere'),
      s('Non-traditional methods', 'Geleneksel olmayan yöntemler', 11, 'non-traditional', 'geleneksel-olmayan'),
      s('Hybrid and special methods', 'Hibrit ve özel yöntemler', 10, 'hybrid-and-special', 'hibrit-ve-ozel'),
    ],
  },
  {
    n: 3,
    slug: { en: 'machines', tr: 'tezgahlar' },
    name: { en: 'Machines', tr: 'Tezgâhlar' },
    lead: {
      en: 'Lathes, machining centres, grinders and the parts inside them: spindles, guideways, drives and what makes one machine stiffer than another.',
      tr: 'Tornalar, işleme merkezleri, taşlama tezgâhları ve içlerindeki parçalar: iş milleri, kızaklar, tahrikler ve bir tezgâhı diğerinden daha rijit yapan şey.',
    },
    priority: 2,
    subsections: [
      s('Lathes', 'Torna tezgâhları', 7, 'lathes', 'torna-tezgahlari'),
      s('Milling machines and machining centres', 'Freze ve işleme merkezleri', 6, 'milling-machines', 'freze-tezgahlari'),
      s('Grinding and finishing machines', 'Taşlama ve ince işlem tezgâhları', 6, 'grinding-machines', 'taslama-tezgahlari'),
      s('Other machines', 'Diğer tezgâhlar', 5, 'other-machines', 'diger-tezgahlar'),
      s('Machine components', 'Tezgâh bileşenleri', 12, 'machine-components', 'tezgah-bilesenleri'),
      s('Selection and acceptance', 'Tezgâh seçimi ve kabulü', 6, 'machine-selection', 'tezgah-secimi'),
    ],
  },
  {
    n: 4,
    slug: { en: 'cutting-tools', tr: 'kesici-takimlar' },
    name: { en: 'Cutting Tools', tr: 'Kesici Takımlar' },
    lead: {
      en: 'Tool materials, coatings, ISO designation decoders, geometry and a wear-diagnosis guide: the most searched part of the atlas.',
      tr: 'Takım malzemeleri, kaplamalar, ISO kod çözücüler, geometri ve aşınma teşhis rehberi: atlasın en çok aranan bölümü.',
    },
    priority: 1,
    subsections: [
      s('Tool materials', 'Takım malzemeleri', 11, 'tool-materials', 'takim-malzemeleri'),
      s('Coatings', 'Kaplamalar', 7, 'coatings', 'kaplamalar'),
      s('ISO codes and decoders', 'ISO kodlama ve kod çözücüler', 8, 'iso-codes', 'iso-kodlari'),
      s('Tool geometry', 'Takım geometrisi', 8, 'tool-geometry', 'takim-geometrisi'),
      s('Tool types', 'Takım tipleri', 12, 'tool-types', 'takim-tipleri'),
      s('Abrasives and grinding wheels', 'Taşlama taşları ve aşındırıcılar', 7, 'abrasives', 'asindiricilar'),
      s('Wear diagnosis and tool management', 'Aşınma teşhisi ve takım yönetimi', 6, 'tool-wear-diagnosis', 'asinma-teshisi'),
    ],
  },
  {
    n: 5,
    slug: { en: 'workholding-and-toolholding', tr: 'takim-ve-is-baglama' },
    name: { en: 'Workholding & Toolholding', tr: 'Takım ve İş Bağlama' },
    lead: {
      en: 'Spindle interfaces, toolholders, chucks, vices and fixture design — the 3-2-1 principle and what clamping does to a thin part.',
      tr: 'İş mili arayüzleri, takım tutucular, aynalar, mengeneler ve fikstür tasarımı: 3-2-1 prensibi ve sıkmanın ince parçaya yaptığı şey.',
    },
    priority: 2,
    subsections: [
      s('Spindle interfaces', 'Takım tutucu arayüzleri', 8, 'spindle-interfaces', 'is-mili-arayuzleri'),
      s('Toolholders', 'Takım tutucular', 10, 'toolholders', 'takim-tutucular'),
      s('Workholding', 'İş bağlama', 11, 'workholding', 'is-baglama'),
      s('Fixture design', 'Fikstür tasarımı', 7, 'fixture-design', 'fikstur-tasarimi'),
    ],
  },
  {
    n: 6,
    slug: { en: 'materials', tr: 'malzemeler' },
    name: { en: 'Materials', tr: 'Malzemeler' },
    lead: {
      en: 'Steels, cast irons, aluminium, copper, titanium and superalloys: composition, properties, heat treatment, machinability notes and equivalent grades across DIN, EN, AISI, JIS and GOST.',
      tr: 'Çelikler, dökme demirler, alüminyum, bakır, titanyum ve süper alaşımlar: bileşim, özellik, ısıl işlem, işlenebilirlik notları ve DIN, EN, AISI, JIS, GOST eşdeğerleri.',
    },
    priority: 1,
    subsections: [
      s('Materials basics', 'Malzeme bilgisi temelleri', 7, 'materials-basics', 'malzeme-temelleri'),
      s('Steels', 'Çelikler', 60, 'steels', 'celikler'),
      s('Cast irons', 'Dökme demirler', 7, 'cast-irons', 'dokme-demirler'),
      s('Aluminium and light alloys', 'Alüminyum ve hafif alaşımlar', 6, 'aluminium', 'aluminyum'),
      s('Copper alloys', 'Bakır alaşımları', 5, 'copper-alloys', 'bakir-alasimlari'),
      s('Titanium and superalloys', 'Titanyum ve süper alaşımlar', 5, 'titanium-and-superalloys', 'titanyum-ve-super-alasimlar'),
      s('Other materials', 'Diğer malzemeler', 7, 'other-materials', 'diger-malzemeler'),
      s('Heat treatment and surface treatments', 'Isıl işlem ve yüzey işlemleri', 7, 'heat-treatment', 'isil-islem'),
    ],
  },
  {
    n: 7,
    slug: { en: 'cutting-data', tr: 'kesme-verileri' },
    name: { en: 'Cutting Data', tr: 'Kesme Verileri' },
    lead: {
      en: 'One data source feeds every table, chart and calculator: cutting speeds, feeds, forces and cycle times, each value with its reference.',
      tr: 'Tek veri kaynağı bütün tabloları, grafikleri ve hesaplayıcıları besler: kesme hızları, ilerlemeler, kuvvetler ve çevrim süreleri; her değerin kaynağı yanında.',
    },
    priority: 1,
    subsections: [
      s('Cutting data tables', 'Kesme verisi tabloları', 10, 'cutting-data-tables', 'kesme-verisi-tablolari'),
      s('Calculators', 'Hesaplayıcılar', 18, 'calculators', 'hesaplayicilar'),
      s('Formula reference', 'Formül referansı', 8, 'formulas', 'formuller'),
    ],
  },
  {
    n: 8,
    slug: { en: 'coolant-and-lubrication', tr: 'sogutma-ve-yaglama' },
    name: { en: 'Coolant & Lubrication', tr: 'Soğutma ve Yağlama' },
    lead: {
      en: 'Emulsions, oils, MQL, high pressure and cryogenic cooling; how to choose, maintain and measure a cutting fluid.',
      tr: 'Emülsiyonlar, yağlar, MQL, yüksek basınç ve kriyojenik soğutma; kesme sıvısı nasıl seçilir, bakılır ve ölçülür.',
    },
    priority: 2,
    subsections: [s('Coolant and lubrication', 'Soğutma ve yağlama', 18, 'coolant', 'sogutma')],
  },
  {
    n: 9,
    slug: { en: 'cnc-programming', tr: 'cnc-programlama' },
    name: { en: 'CNC Programming & CAM', tr: 'CNC Programlama ve CAM' },
    lead: {
      en: 'Every G and M code on its own page with an animation, canned cycles, macros, controller differences and CAM strategy.',
      tr: 'Her G ve M kodu kendi sayfasında animasyonla; sabit çevrimler, makrolar, kontrolör farkları ve CAM stratejileri.',
    },
    priority: 1,
    subsections: [
      s('CNC basics', 'CNC temelleri', 7, 'cnc-basics', 'cnc-temelleri'),
      s('G and M code reference', 'G ve M kodu referansı', 96, 'g-code-reference', 'g-kodu-referansi'),
      s('Programming examples', 'Programlama örnekleri', 34, 'programming-examples', 'programlama-ornekleri'),
      s('CAM', 'CAM', 10, 'cam', 'cam'),
      s('Digital manufacturing', 'Dijital imalat', 4, 'digital-manufacturing', 'dijital-imalat'),
    ],
  },
  {
    n: 10,
    slug: { en: 'metrology', tr: 'metroloji' },
    name: { en: 'Metrology & Quality', tr: 'Metroloji ve Kalite' },
    lead: {
      en: 'From the caliper to the CMM, with surface texture explored to a depth found nowhere else: Ra, Rz, the Rk family and how to read a plateau-honed bore.',
      tr: 'Kumpastan CMM’e kadar bütün ölçü aletleri; yüzey dokusu başka hiçbir yerde olmayan derinlikte: Ra, Rz, Rk ailesi ve plato honlanmış kovan nasıl okunur.',
    },
    priority: 1,
    subsections: [
      s('Measurement basics', 'Ölçme temelleri', 7, 'measurement-basics', 'olcme-temelleri'),
      s('Measuring instruments', 'Ölçü aletleri', 14, 'measuring-instruments', 'olcu-aletleri'),
      s('Surface roughness', 'Yüzey pürüzlülüğü', 16, 'surface-roughness', 'yuzey-puruzlulugu'),
      s('Form and position measurement', 'Form ve konum ölçümü', 7, 'form-measurement', 'form-olcumu'),
      s('Quality systems', 'Kalite sistemleri', 7, 'quality-systems', 'kalite-sistemleri'),
    ],
  },
  {
    n: 11,
    slug: { en: 'drawings-and-tolerances', tr: 'teknik-resim-ve-toleranslar' },
    name: { en: 'Drawings & Tolerances', tr: 'Teknik Resim ve Toleranslar' },
    lead: {
      en: 'Reading drawings, ISO 286 fits, GD&T with 3D tolerance zones, threads and the standard features every drawing refers to.',
      tr: 'Teknik resim okuma, ISO 286 geçmeleri, 3D tolerans bölgeleriyle GD&T, dişler ve her resmin atıf yaptığı standart elemanlar.',
    },
    priority: 1,
    subsections: [
      s('Drawing reading', 'Teknik resim okuma', 8, 'drawing-reading', 'teknik-resim-okuma'),
      s('Dimensional tolerances', 'Boyut toleransları', 10, 'dimensional-tolerances', 'boyut-toleranslari'),
      s('Geometric tolerances (GD&T)', 'Geometrik toleranslar (GD&T)', 8, 'gdt', 'gdt'),
      s('Threads and standard parts', 'Diş ve standart elemanlar', 12, 'threads-and-standard-parts', 'disler-ve-standart-elemanlar'),
    ],
  },
  {
    n: 12,
    slug: { en: 'troubleshooting', tr: 'problem-cozme' },
    name: { en: 'Troubleshooting', tr: 'Problem Çözme' },
    lead: {
      en: 'Symptom, likely causes in order, how to check, how to fix. Written short enough to read on a phone at the machine.',
      tr: 'Belirti, olasılık sırasıyla nedenler, nasıl kontrol edilir, nasıl çözülür. Tezgâh başında telefondan okunacak kadar kısa.',
    },
    priority: 1,
    subsections: [
      s('Surface problems', 'Yüzey kalitesi sorunları', 9, 'surface-problems', 'yuzey-sorunlari'),
      s('Dimensional problems', 'Ölçü ve form sorunları', 9, 'dimensional-problems', 'olcu-sorunlari'),
      s('Tool problems', 'Takım sorunları', 9, 'tool-problems', 'takim-sorunlari'),
      s('Chip control', 'Talaş kontrol sorunları', 5, 'chip-control', 'talas-kontrolu'),
      s('Machine and process problems', 'Tezgâh ve proses sorunları', 8, 'machine-problems', 'tezgah-sorunlari'),
      s('Diagnostic tools', 'Teşhis araçları', 4, 'diagnostic-tools', 'teshis-araclari'),
    ],
  },
  {
    n: 13,
    slug: { en: 'production-and-economics', tr: 'uretim-ve-ekonomi' },
    name: { en: 'Production & Economics', tr: 'Üretim ve Ekonomi' },
    lead: {
      en: 'Part cost, machine-hour rates, process planning, OEE, automation and what it takes to set up a shop.',
      tr: 'Parça maliyeti, tezgâh saat ücreti, proses planlama, OEE, otomasyon ve atölye kurmak için gerekenler.',
    },
    priority: 2,
    subsections: [
      s('Costing', 'Maliyet ve fiyatlandırma', 7, 'costing', 'maliyet'),
      s('Process planning', 'Proses planlama', 7, 'process-planning', 'proses-planlama'),
      s('Productivity', 'Verimlilik', 5, 'productivity', 'verimlilik'),
      s('Automation', 'Otomasyon', 6, 'automation', 'otomasyon'),
      s('Shop setup', 'Atölye kurma', 5, 'shop-setup', 'atolye-kurma'),
    ],
  },
  {
    n: 14,
    slug: { en: 'safety', tr: 'guvenlik' },
    name: { en: 'Safety', tr: 'Güvenlik' },
    lead: {
      en: 'Lathe, mill and grinder safety, chips, fluids, fire risk of light-alloy dust, lockout and machine guarding.',
      tr: 'Torna, freze ve taşlama güvenliği, talaş, sıvılar, hafif alaşım tozunun yangın riski, kilitleme ve makine koruyucuları.',
    },
    priority: 2,
    subsections: [s('Safety', 'Güvenlik', 15, 'safety', 'guvenlik')],
  },
  {
    n: 15,
    slug: { en: 'standards', tr: 'standartlar' },
    name: { en: 'Standards', tr: 'Standartlar' },
    lead: {
      en: 'What each ISO, DIN, EN and ASME standard governs, where it applies and which atlas pages rest on it.',
      tr: 'Her ISO, DIN, EN ve ASME standardının neyi düzenlediği, nerede uygulandığı ve hangi atlas sayfalarının ona dayandığı.',
    },
    priority: 3,
    subsections: [
      s('Cutting tool standards', 'Kesici takım standartları', 11, 'tool-standards', 'takim-standartlari'),
      s('Interface and holder standards', 'Arayüz ve tutucu standartları', 6, 'interface-standards', 'arayuz-standartlari'),
      s('Tolerance and geometry standards', 'Tolerans ve geometri standartları', 8, 'tolerance-standards', 'tolerans-standartlari'),
      s('Surface and measurement standards', 'Yüzey ve ölçüm standartları', 9, 'surface-standards', 'yuzey-standartlari'),
      s('Material standards', 'Malzeme standartları', 9, 'material-standards', 'malzeme-standartlari'),
      s('Thread and fastener standards', 'Diş ve bağlantı elemanı standartları', 5, 'thread-standards', 'dis-standartlari'),
      s('Safety and environmental standards', 'Güvenlik ve çevre standartları', 5, 'safety-standards', 'guvenlik-standartlari'),
    ],
  },
  {
    n: 16,
    slug: { en: 'history', tr: 'tarih' },
    name: { en: 'History', tr: 'Talaşlı İmalatın Tarihi' },
    lead: {
      en: 'From the bow lathe to five axes: Maudslay, Whitworth, Taylor, the first NC machine and the parts that marked a turning point.',
      tr: 'Yay tornasından beş eksene: Maudslay, Whitworth, Taylor, ilk NC tezgâh ve dönüm noktası olan parçalar.',
    },
    priority: 3,
    subsections: [s('History', 'Tarih', 16, 'history', 'tarih')],
  },
  {
    n: 17,
    slug: { en: 'glossary', tr: 'sozluk' },
    name: { en: 'Glossary', tr: 'Çok Dilli Sözlük' },
    lead: {
      en: 'Around 1,500 machining terms in English, Turkish and German, each with its symbol, unit and the page that explains it.',
      tr: 'İngilizce, Türkçe ve Almanca yaklaşık 1.500 talaşlı imalat terimi; her biri sembolü, birimi ve açıklayan sayfasıyla.',
    },
    priority: 2,
    subsections: [s('Glossary', 'Sözlük', 8, 'glossary', 'sozluk')],
  },
  {
    n: 18,
    slug: { en: 'tools', tr: 'araclar' },
    name: { en: 'Tools Hub', tr: 'Araçlar Merkezi' },
    lead: {
      en: 'Seventy-four decoders, calculators, simulators, diagnostic wizards and 3D models, collected in one place and embedded where they belong.',
      tr: 'Yetmiş dört kod çözücü, hesaplayıcı, simülatör, teşhis sihirbazı ve 3D model; tek yerde toplanmış ve ait oldukları sayfalara gömülmüş.',
    },
    priority: 1,
    subsections: [
      s('Decoders and calculators', 'Kod çözücüler ve hesaplayıcılar', 43, 'calculators', 'hesaplayicilar'),
      s('Simulators, wizards, 3D models and data tools', 'Simülatörler, sihirbazlar, 3D modeller ve veri araçları', 31, 'simulators', 'simulatorler'),
    ],
  },
];

export const totalPages = sections.reduce(
  (sum, sec) => sum + sec.subsections.reduce((a, b) => a + b.pages, 0),
  0,
);

export function sectionBySlug(locale: 'en' | 'tr', slug: string): Section | undefined {
  return sections.find((sec) => sec.slug[locale] === slug);
}

export function sectionPath(locale: 'en' | 'tr', sec: Section): string {
  return locale === 'en' ? `/${sec.slug.en}/` : `/tr/${sec.slug.tr}/`;
}
