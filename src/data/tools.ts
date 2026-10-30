import type { RouteKey } from '../i18n';

export type ToolKind = 'decoder' | 'calculator' | 'simulator' | 'wizard' | 'model3d' | 'data';
export type ToolStatus = 'live' | 'review' | 'planned';

export interface Tool {
  id: number;
  name: { en: string; tr: string };
  blurb?: { en: string; tr: string };
  kind: ToolKind;
  section: number;
  priority: 1 | 2 | 3;
  status: ToolStatus;
  route?: RouteKey;
}

export const kindLabel: Record<ToolKind, { en: string; tr: string }> = {
  decoder: { en: 'Decoder', tr: 'Kod çözücü' },
  calculator: { en: 'Calculator', tr: 'Hesaplayıcı' },
  simulator: { en: 'Simulator', tr: 'Simülatör' },
  wizard: { en: 'Diagnostic wizard', tr: 'Teşhis sihirbazı' },
  model3d: { en: '3D model', tr: '3D model' },
  data: { en: 'Data tool', tr: 'Veri aracı' },
};

const T = (
  id: number,
  en: string,
  tr: string,
  kind: ToolKind,
  section: number,
  priority: 1 | 2 | 3,
  status: ToolStatus = 'planned',
  route?: RouteKey,
): Tool => ({ id, name: { en, tr }, kind, section, priority, status, route });

export const tools: Tool[] = [
  {
    ...T(1, 'ISO 1832 insert code decoder', 'ISO 1832 uç kodu çözücü', 'decoder', 4, 1, 'live', 'decoder'),
    blurb: {
      en: 'Type CNMG 120408 and read every position: shape, clearance, tolerance, hole, size, thickness, radius.',
      tr: 'CNMG 120408 yaz, her haneyi oku: şekil, boşluk açısı, tolerans, delik, ölçü, kalınlık, radyüs.',
    },
  },
  {
    ...T(2, 'ISO 5608 toolholder code decoder', 'ISO 5608 tutucu kodu çözücü', 'decoder', 4, 1, 'live', 'holder'),
    blurb: {
      en: 'Type PCLNR 2525 M12 and read every position: clamping, insert, style and entering angle, hand, shank, length — with the holder drawn at work.',
      tr: 'PCLNR 2525 M12 yaz, her haneyi oku: sıkma, uç, tip ve yanaşma açısı, yön, sap, boy; tutucu iş başında çizilmiş olarak.',
    },
  },
  T(3, 'ISO 5611 boring bar code decoder', 'ISO 5611 bara barası kodu çözücü', 'decoder', 4, 2),
  T(4, 'Grinding wheel code decoder (ISO 525)', 'Taşlama taşı kodu çözücü (ISO 525)', 'decoder', 4, 2),
  T(5, 'Surface texture symbol decoder', 'Yüzey işareti sembol çözücü', 'decoder', 11, 2),
  T(6, 'Material name decoder and equivalents', 'Malzeme adı çözücü ve eşdeğer arama', 'decoder', 6, 1),
  T(7, 'G-code translator (Fanuc / Siemens / Heidenhain)', 'G-kodu çevirici (Fanuc / Siemens / Heidenhain)', 'decoder', 9, 2),
  {
    ...T(8, 'Turning calculator', 'Tornalama hesaplayıcısı', 'calculator', 7, 1, 'live', 'turning'),
    blurb: {
      en: 'Speed, spindle, feed, depth, removal rate, force, power, torque and cycle time, all linked.',
      tr: 'Hız, devir, ilerleme, derinlik, talaş hacmi, kuvvet, güç, tork ve çevrim süresi; hepsi birbirine bağlı.',
    },
  },
  {
    ...T(9, 'Milling calculator (with chip thinning)', 'Frezeleme hesaplayıcısı (talaş inceltme dâhil)', 'calculator', 7, 1, 'live', 'milling'),
    blurb: {
      en: 'Table feed, removal rate, power and torque, plus the real chip thickness when the cutter is only partly engaged.',
      tr: 'Tabla ilerlemesi, talaş hacmi, güç ve tork; freze kısmen kavradığında gerçek talaş kalınlığıyla birlikte.',
    },
  },
  {
    ...T(10, 'Drilling calculator', 'Delme hesaplayıcısı', 'calculator', 7, 1, 'live', 'drilling'),
    blurb: {
      en: 'Spindle speed, penetration rate, removal rate, power and torque for a two-lip drill, with drilling time.',
      tr: 'İki ağızlı matkap için devir, ilerleme hızı, talaş hacmi, güç ve tork; delme süresiyle birlikte.',
    },
  },
  {
    ...T(11, 'Tap drill and metric thread dimensions', 'Kılavuz deliği ve metrik diş ölçüleri', 'calculator', 7, 1, 'live', 'tapdrill'),
    blurb: {
      en: 'Tap drill for every metric thread, checked against the 6H limits, with pitch diameter, minor diameters and stress area.',
      tr: 'Her metrik diş için 6H sınırlarına göre kontrol edilmiş kılavuz matkap çapı; bölüm dairesi çapı, diş dibi çapları ve gerilme kesitiyle birlikte.',
    },
  },
  T(12, 'Thread calculator (metric, inch, pipe, trapezoidal)', 'Diş hesaplayıcısı (metrik, inç, boru, trapez)', 'calculator', 7, 1),
  T(13, 'Cutting force and power (Kienzle)', 'Kesme kuvveti ve güç (Kienzle)', 'calculator', 1, 2),
  T(14, 'Taylor tool life and optimum speed', 'Taylor takım ömrü ve optimum hız', 'calculator', 1, 2),
  {
    ...T(15, 'Theoretical roughness Ra / Rz', 'Teorik pürüzlülük Ra / Rz', 'calculator', 7, 1, 'live', 'roughness'),
    blurb: {
      en: 'Feed and nose radius become a drawn profile and a number you can compare with the drawing.',
      tr: 'İlerleme ve uç radyüsü, çizilmiş bir profile ve resimle karşılaştırabileceğin bir sayıya dönüşür.',
    },
  },
  T(16, 'Ball-nose scallop and stepover', 'Küresel uç izi (scallop) ve adım', 'calculator', 7, 2),
  T(17, 'Effective diameter and true cutting speed', 'Efektif çap ve gerçek Vc', 'calculator', 7, 2),
  T(18, 'Taper calculator', 'Konik hesaplayıcısı', 'calculator', 7, 2),
  T(19, 'Dividing head and angle division', 'Bölme başı ve açı bölme', 'calculator', 7, 3),
  T(20, 'Sine bar and gauge block stack', 'Sinüs çubuğu ve mastar blok kombinasyonu', 'calculator', 7, 3),
  T(21, 'Three-wire thread measurement', 'Üç tel diş ölçümü', 'calculator', 7, 2),
  T(22, 'Unit converter (SFM, IPT, HP)', 'Birim dönüştürücü (SFM, IPT, HP)', 'calculator', 7, 1),
  T(23, 'Removed volume and part weight', 'Talaş hacmi ve parça ağırlığı', 'calculator', 7, 2),
  T(24, 'Cycle time and part cost', 'Çevrim süresi ve parça maliyeti', 'calculator', 13, 2),
  {
    ...T(25, 'ISO 286 fit calculator (H7/g6)', 'ISO 286 geçme hesaplayıcısı (H7/g6)', 'calculator', 11, 1, 'live', 'fits'),
    blurb: {
      en: 'Deviations, limits of size and clearance or interference for any hole/shaft pair up to 500 mm, drawn to scale.',
      tr: '500 mm\u2019ye kadar her delik/mil çifti için sapmalar, sınır ölçüler ve boşluk ya da sıkılık; ölçekli çizimle.',
    },
  },
  T(26, 'Tolerance lookup (size + code → deviations)', 'Tolerans arama (çap + kod → sapma)', 'calculator', 11, 1, 'live', 'fits'),
  T(27, 'Tolerance stack-up', 'Tolerans zinciri ve yığılma', 'calculator', 11, 3),
  T(28, 'Hardness conversion (HB / HRC / HV / HRB)', 'Sertlik dönüşümü (HB / HRC / HV / HRB)', 'calculator', 6, 1),
  T(29, 'Bolt tightening torque', 'Cıvata sıkma torku', 'calculator', 11, 2),
  T(30, 'Measurement uncertainty', 'Ölçüm belirsizliği', 'calculator', 10, 3),
  T(31, 'Thermal correction to 20 °C', 'Termal düzeltme (20 °C referans)', 'calculator', 10, 3),
  T(32, 'SPC charts and Cp / Cpk', 'SPC kartları ve Cp / Cpk', 'calculator', 10, 2),
  T(33, 'Gage R&R', 'Gage R&R', 'calculator', 10, 3),
  T(34, 'Machine-hour rate and quotation', 'Tezgâh saat ücreti ve teklif', 'calculator', 13, 2),
  T(35, 'OEE', 'OEE', 'calculator', 13, 3),
  T(36, 'Chuck clamping force and loss at speed', 'Ayna sıkma kuvveti ve devirde kayıp', 'calculator', 5, 3),
  T(37, 'Holder balance grade G', 'Tutucu balansı G sınıfı', 'calculator', 5, 3),
  T(38, 'Emulsion concentration', 'Emülsiyon konsantrasyonu', 'calculator', 8, 3),
  T(39, 'Saw tooth pitch', 'Testere diş adımı', 'calculator', 2, 3),
  T(40, 'Gear calculator (module, span measurement)', 'Dişli hesaplayıcısı (modül, ölçü üstü)', 'calculator', 2, 2),
  T(41, 'MMC bonus tolerance and true position', 'MMC bonus tolerans ve gerçek konum', 'calculator', 11, 2),
  T(42, 'Printable speed-and-feed card for the machine', 'Tezgâh başı devir-ilerleme kartı (yazdırılabilir)', 'calculator', 7, 2),
  T(43, 'Shaft deflection and steady-rest need', 'Mil sehimi ve lünet ihtiyacı', 'calculator', 2, 3),
  T(44, 'Abbott-Firestone / Rk simulator', 'Abbott-Firestone / Rk simülatörü', 'simulator', 10, 1, 'review'),
  T(45, 'Theoretical surface profile (nose radius × feed)', 'Teorik yüzey profili (uç radyüsü × ilerleme)', 'simulator', 1, 1, 'live', 'roughness'),
  T(46, 'Orthogonal cutting and Merchant circle', 'Dik kesme ve Merchant çemberi', 'simulator', 1, 2),
  T(47, 'Stability lobe diagram', 'Kararlılık lob diyagramı', 'simulator', 1, 3),
  {
    ...T(48, 'Climb vs conventional milling', 'Aynı / zıt yönlü frezeleme', 'simulator', 2, 2, 'live', 'climbMilling'),
    blurb: {
      en: 'Watch the chip go thick-to-thin or thin-to-thick as you change the radial engagement, and see where the forces point.',
      tr: 'Radyal kavramayı değiştir; talaşın kalından inceye mi inceden kalına mı gittiğini ve kuvvetlerin nereye yöneldiğini gör.',
    },
  },
  T(49, 'Chip thinning (radial and axial)', 'Talaş inceltme (radyal ve eksenel)', 'simulator', 2, 2),
  T(50, 'G-code simulator (write, see the toolpath)', 'G-kodu simülatörü (yaz, takım yolunu gör)', 'simulator', 9, 2),
  T(51, 'Canned cycle animations (G81–G89, G70–G76)', 'Sabit çevrim animasyonları (G81–G89, G70–G76)', 'simulator', 9, 2),
  T(52, 'Iron–carbon diagram', 'Demir-karbon diyagramı', 'simulator', 6, 3),
  T(53, 'Surface texture filtering (λc)', 'Yüzey dokusu filtreleme (λc)', 'simulator', 10, 2),
  T(54, 'Machining history timeline', 'Talaşlı imalat tarihi zaman çizelgesi', 'simulator', 16, 3),
  T(55, 'Surface defect diagnostic wizard', 'Yüzey hatası teşhis sihirbazı', 'wizard', 12, 2),
  T(56, 'Tool wear diagnostic wizard', 'Takım aşınması teşhis sihirbazı', 'wizard', 4, 1),
  T(57, 'Chatter diagnostic wizard', 'Tırlama teşhis sihirbazı', 'wizard', 12, 2),
  T(58, 'Hole defect diagnostic wizard', 'Delik hatası teşhis sihirbazı', 'wizard', 12, 2),
  T(59, 'Tool material and coating selector', 'Takım malzemesi ve kaplama seçim rehberi', 'wizard', 4, 2),
  T(60, 'Hole-making method selector', 'Delik yöntemi seçimi (matkap / bara / rayba / honlama)', 'wizard', 2, 2),
  T(61, 'Machine selection guide', 'Tezgâh seçim rehberi', 'wizard', 3, 3),
  T(62, 'Cutting fluid selector', 'Kesme sıvısı seçim rehberi', 'wizard', 8, 3),
  T(63, '13 lathe operations on one bar', '13 torna operasyonu tek çubukta', 'model3d', 2, 1),
  T(64, 'Three ways to make a hole', 'Üç delik yöntemi (matkap, bara, rayba)', 'model3d', 2, 1),
  T(65, 'Tool angles (rake, clearance, approach)', 'Takım açıları (talaş, boşluk, yanaşma)', 'model3d', 4, 1),
  T(66, 'Wear types gallery', 'Aşınma türleri galerisi', 'model3d', 1, 1),
  T(67, 'GD&T tolerance zones (14 symbols)', 'GD&T tolerans bölgeleri (14 sembol)', 'model3d', 11, 2),
  T(68, 'Plateau-honed bore section and cross-hatch', 'Plato honlama kesiti ve çapraz tarama', 'model3d', 2, 1),
  T(69, 'Caliper and micrometer', 'Kumpas ve mikrometre', 'model3d', 10, 2),
  T(70, 'Five-axis kinematics', '5 eksen kinematikleri', 'model3d', 3, 3),
  T(71, 'Chuck and vice types', 'Ayna ve mengene tipleri', 'model3d', 5, 3),
  T(72, 'Bore sealing-surface analysis', 'Kovan sızdırmazlık yüzeyi analizi', 'data', 10, 2, 'review'),
  T(73, 'Steel equivalents table', 'Çelik eşdeğer tablosu', 'data', 6, 1),
  T(74, 'Cutting data tables', 'Kesme verisi tabloları', 'data', 7, 1),
  {
    ...T(75, 'Micrometer reading simulator', 'Mikrometre okuma simülatörü', 'simulator', 10, 1, 'live', 'micrometer'),
    blurb: {
      en: 'Learn it step by step, then read ten random parts: metric and inch, every frame up to 125 mm, both sleeve numberings.',
      tr: 'Adım adım öğren, sonra on rastgele parçayı oku: metrik ve inç, 125 mm’ye kadar her gövde, iki kovan numaralaması.',
    },
  },
];

export const liveTools = tools.filter((tool) => tool.status === 'live' && tool.route);
export const flagshipTools = liveTools.filter((tool) => tool.blurb);
export const toolsForSection = (n: number) => tools.filter((tool) => tool.section === n);
