# Chip Atlas — The Machining Encyclopedia

Talaşlı imalatın tamamını kapsayan, iki dilli (EN ana dil, TR ikinci dil) ansiklopedik referans sitesi.
Astro + Tailwind + GSAP + Three.js. Her formül testlidir, her tablo kaynaklıdır.

## Komutlar

```bash
npm install            # bağımlılıklar
npm run dev            # geliştirme sunucusu (http://localhost:4321)
npm test               # formül ve veri testleri (node:test)
npm run build          # üretim derlemesi: dist/ (temiz URL'ler) + Pagefind arama indeksi
npm run build:preview  # sunucusuz önizleme: sayfa başına tek dosya, göreli bağlantılar
```

## Yapı

```
src/
  data/sections.ts     18 bölüm ve alt bölümler (EN/TR adlar, sayfa sayıları, öncelik)
  data/tools.ts        74 araç; durum (live / review / planned) ve bölüm eşlemesi
  data/iso1832.js      ISO 1832 uç kodu tabloları + parseInsertCode()
  data/site.ts         site adresi, kanal bağlantıları (boş olanlar gösterilmez)
  i18n/index.ts        rotalar, UI metinleri, href() yardımcısı
  data/iso286.js       ISO 286 IT dereceleri ve temel sapmalar
  data/iso2768.js      ISO 2768-1 genel toleranslar (+ geri çekilen 2768-2 düzlemsellik tablosu)
  data/metric-threads.js ISO metrik diş ölçüleri (ISO 724 formülleri), normal/ince adımlar, DIN 336 kılavuz
                       matkapları, 6H küçük çap sınırları, gerilme kesiti
  lib/calc.js          tornalama, frezeleme, delme ve pürüzlülük formülleri (saf fonksiyonlar)
  lib/profile.js       sentetik pürüzlülük profilleri, Ra/Rz/Rt, ISO 13565-2 Rk yapımı
  lib/articles.ts      makale listesi, yollar ve dil karşılıkları
  content/articles/    makaleler: en/<anahtar>.mdx ve tr/<anahtar>.mdx (aynı `key`, farklı `slug`)
  components/mdx/      makale şekilleri (49 bileşen). Grafikler: LineChart, RangeChart, StepChart, KienzleChart,
                       TapBands, TaylorChart, WearCurve, BoltClasses, ImpactGrades, JominyBand, RaProcess,
                       BarCompare (tek özellik, malzemeler arası; isteğe bağlı ikinci değer çerçeve olarak),
                       AgeCycle (çözeltiye alma → su verme → yaşlandırma çevrimi), OverAgeing (7075 tempere göre
                       dayanım, gerilmeli korozyon, iletkenlik), WeldHaz (Eurocode 9 ITAB dayanımı).
                       Malzeme çizimleri: HardenedLayer, GradeMatrix, QuenchStress, TemperCode (temper kodu çözücü).
                       Çizimler: ShearAngle, ChipForms, ChipBreaker, ChipWindow, ForceComponents, ForceChain,
                       WearTypes, WearMeasures, ClimbBacklash, MillingDirection, Crosshatch, HoningForms,
                       HoningStroke, SkiveRoll, TapProfile, TapHoles, StressArea, ThreadCode, BoltCode, Iso513,
                       Iso513Code, Iso2768Lookup, Iso21920Map, ProfileRaRz, SkewProfiles, AbbottRk, CaseRoute.
                       Model3D (insert / thread / bore), Figure, Note
  lib/models/          Three.js modelleri: stage.ts (sahne, kamera uydurma, etiketler), insert.ts (aşınmış uç),
                       thread.ts (M10×1,5 çeyreği kesik), bore.ts (honlanmış delik, açısı ayarlanabilir)
  data/figures.ts      şekil verileri (kaynaklı aralıklar ve hesaplanan eğriler); malzeme sayfalarının grafik
                       verileri steel-charts.ts, stainless-charts.ts, aluminium-charts.ts ve material-compare.ts'de
  layouts/Article.astro makale şablonu: başlık + plaka, "bir bakışta" değerleri, içindekiler (okuma konumunu izler),
                       ilgili araçlar, kaynaklar, önceki/sonraki; okuma çizgisi ve tablo sütun vurgusu
  components/plates/   makale plakaları: art/<anahtar>.astro (480×320 teknik çizim), Plate.astro (hero/thumb),
                       Defs.astro (ortak gradyanlar, ISO 128 tarama, oklar), Elements.astro, Elements2.astro
                       (iki kaliteyi yan yana veren element kutuları), chipgeom.ts
  components/ArticleCard.astro  plakalı makale kartı (ana sayfa ve bölüm sayfaları)
  lib/rehype-tables.mjs tabloları çerçeveler, sayısal sütunları sağa hizalar
  layouts/Base.astro   sayfa iskeleti: meta, hreflang, header, footer
  components/          Home, ToolsHub, SectionPage, ShaftHero (3D), tools/*
  components/Emblem.astro  18 bölüm amblemi (96×96 çizim, üzerine gelince tek bir hareket)
  components/ProgressStrip.astro  bölüm ilerleme şeridi: alt bölüm başına bir parça, dolu kısım yayındaki sayfalar
  pages/               EN sayfalar; pages/tr/ Türkçe karşılıkları
  styles/global.css    tasarım token'ları ve bileşen stilleri
tests/                 calc, iso1832, milling-drilling, iso286, profile, iso2768, metric-threads testleri (39 test)
scripts/               relativize (önizleme), stage-artifact, check-links (iç bağlantı denetimi),
                       quote-frontmatter (YAML değerlerini tırnaklar), shot-*.mjs (ekran görüntüsü)
```

## Tasarım sistemi

- Zemin: grafit (`--color-graphite-900` #141618); vurgu: kıvılcım turuncusu (`--color-spark-500` #ff6a1a);
  ölçülen değerler: metroloji mavisi (`--color-metro-500` #4fb3ff).
- Yazı: Space Grotesk (başlık ve metin), IBM Plex Mono (değerler, kodlar). Fontlar paketten gelir, dış servis yok.
- Tek "gösterişli" unsur ana sayfadaki 3D şafttır; geri kalan her şey teknik resim disiplinindedir.
- Tasarım değişirse yalnızca `global.css` ve bileşen stilleri değişir; veri ve içerik dosyalarına dokunulmaz.

## Doğruluk kuralı (uygulanış)

1. `lib/calc.js` içindeki her formül `tests/calc.test.js` ile el hesabına karşı doğrulanır.
2. `data/iso1832.js` tabloları ISO 1832:2017 hane tanımlarına ve iki tedarikçi referansına (HH Tools ISO tanımlama sayfaları) karşı çapraz kontrol edildi.
   Kenar uzunlukları iç teğet çemberden geometriyle türetilir ve 0,1 mm'ye yuvarlanır; test dosyası bunu da denetler.
3. Son onayı bekleyen tablolar sayfada "İncelemede" işaretiyle gösterilir (`review` bayrağı).
4. Her araç sayfasının sonunda kaynak listesi vardır; bağlantılar derleme öncesi tek tek açılarak doğrulanmıştır.

## Yayına alma (Cloudflare Workers, yalnız statik dosyalar)

- Ayar dosyası `wrangler.jsonc`: Worker kodu yok, `dist/` olduğu gibi sunulur; eksik adreslerde `404.html` döner.
- Build komutu: `npm run build` · deploy komutu: `npx wrangler deploy` · Node 22.
- GitHub deposu Cloudflare'e bağlanınca her `git push` siteyi birkaç dakikada yeniden derleyip yayınlar.
- Alan adı iki yerde aynı olmalı: `astro.config.mjs` → `site` ve `src/data/site.ts` → `url` (canonical, hreflang, site haritası bu adresi kullanır).
- Site haritası (`sitemap-index.xml`) derlemede otomatik üretilir; `robots.txt` onu gösterir.
- `src/dev-pages/` altındaki şekil galerileri yalnız `astro dev` altında açılır (`/dev-figs`, `/dev-new`); hiçbir derlemeye girmez.
- Kanal bağlantıları: `site.ts` → `channels` alanını doldur; boş bırakılanlar footer'da görünmez.

## Yayında olanlar

- Ana sayfa (EN/TR): 3D şaft hero'su, canlı vc / n / vf / Ra okumaları, "okumaya başla" (her bölümden bir sayfa,
  en çok 8; telefonda kaydırılır), 18 bölümün amblemli kartları (yayındaki / planlanan sayfa, faz), araç vitrini.
- Araçlar Merkezi: 74 aracın tam listesi; 10 araç yayında (7 araç sayfası + makale içi simülasyonlar).
- ISO 1832 uç kodu çözücü, teorik pürüzlülük Ra/Rz (ikincil kenar etkisi dahil), tornalama hesaplayıcısı.
- Frezeleme hesaplayıcısı: kavrama açısı, maks./ortalama talaş kalınlığı, talaş inceltme, hm ile güç ve tork.
- Delme hesaplayıcısı: uç boyu dahil delme süresi, ağız başına Kienzle kuvveti, net güç ve tork.
- ISO 286 geçme hesaplayıcısı ve tolerans arama: 500 mm'ye kadar C–U / c–u konumları, Δ kuralı ve M6 özel durumu;
  `tests/iso286.test.js` yayımlanmış tablolardan ~900 hücreyi birebir doğrular.
- Kılavuz deliği ve metrik diş hesaplayıcısı: DIN 336 matkap çapı (normal ve ince adım), 6H sınır kontrolü,
  d2/D1/d3, gerilme kesiti, ölçekli diş profili; `tests/metric-threads.test.js` yayımlanmış tablolara karşı doğrular.
- 18 bölüm sayfası (EN/TR): büyük amblem, yayındaki / planlanan / alt bölüm / faz göstergeleri ve alt bölüm
  şeridi, yayındaki makaleler, alt bölüm haritası (her birinde ilerleme çubuğu), bölüme ait araçlar.
- Üç 3D model: aşınmış tornalama ucu (VB, KT, çentik), M10×1,5 dış diş (d, d2, d3, P, 60°), honlanmış delik
  (çapraz tarama açısı kaydırıcıyla). Görünüme yaklaşınca yüklenir; dokunmatik ekranda görünüm düğmeleriyle döner.
- 10 makale, İngilizce ve Türkçe (20 sayfa), her biri kaynak listesiyle:
  talaş oluşumu, talaş tipleri ve ISO 3685 formları, kesme kuvvetleri ve Kienzle (üç katalog karşılaştırması),
  takım aşınması ve ISO 3685/8688 kriterleri, Taylor takım ömrü ve ekonomisi, ISO 513, yüzey pürüzlülüğü
  parametreleri ve ISO 21920 değişiklikleri, Rk ailesi (İncelemede), ISO 2768 genel toleranslar (arama aracıyla),
  cıvata mukavemet sınıfları (ISO 898-1/-2, ISO 3506-1).
- 8 makale daha (ikinci parti, 16 sayfa): ISO metrik vida dişleri, kılavuz matkap çapları ve ezme kılavuzu,
  aynı ve zıt yönlü frezeleme (canlı simülasyon), honlama ve plato honlama (çapraz tarama hesaplayıcısı,
  hidrolik silindir boruları), C45, 42CrMo4, S355 (St 52-3 / St 44-2), 16MnCr5.
- Bütün makaleler bağımsız bir doğrulama ve çeviri kontrolünden geçti (11 Ekim 2026).

## Görsel dil ve hareket

- Her makalenin bir plakası vardır: gerçek geometriye göre çizilmiş teknik resim (`components/plates/art/<anahtar>.astro`).
  Değerler makaledeki değerlerle birebir aynı olmalı; plakaya makalede olmayan sayı yazılmaz.
- Hero plakası açılışta çizilir (çizgiler `class="d"` + `pathLength="1"`, dolgular `f`, etiketler `lbl`).
  Kart küçük resimlerinde etiket ve hareket yoktur. `prefers-reduced-motion` tüm hareketi kapatır.
- Sayfa geçişleri CSS görünüm geçişleridir (`@view-transition`); kart plakası makale başlığındaki plakaya dönüşür.
- "Bir bakışta" değerleri ön bilgideki `glance` alanındadır (en çok 4); her değer makale gövdesinden gelir.
- Grafik renkleri: mavi `#2f95e0`, turuncu `#e85a12`, mor `#9a7be0` (koyu yüzeyde renk körlüğü denetiminden geçti).
- Telefon düzeni: geniş ve dar iki SVG çizilir, `.narrow{display:none}` ve `@media (max-width:40rem)` ile değişir;
  betikle çizilen şekiller (ShearAngle, TaylorChart, MillingDirection) yazı boyunu ekrandaki ölçeğe göre seçer.
  Hedef: telefonda şekil yazısı en az ~10 px. Uzun açıklamalar SVG yerine HTML'de durur (sarar, ölçeklenmez).
- Açılış animasyonu `opacity`'yi 1'e götürür: `f`, `d`, `lbl` sınıflı öğelerde saydamlık için `opacity` değil,
  `fill-opacity` / `stroke-opacity` kullan.
- Amblemler bölümün konusunu plakalarla aynı dille çizer (metal/karbür gradyanları, turuncu kesme, mavi veri);
  13'teki maliyet eğrisi gerçek bir a/v + c·v² toplamıdır, toplam hiçbir zaman bileşenlerinin altına inmez.

## Makale yazma

- Dosya: `src/content/articles/<dil>/<anahtar>.mdx`. Ön bilgi: `key`, `locale`, `slug`, `title`, `description`,
  `section` (1–18), `subsection` (EN alt bölüm slug'ı), `order`, `status` (live/review), `updated`, `tools`, `sources`, `glance`.
- Yeni makaleye plaka ekle: `components/plates/art/<anahtar>.astro` ve `data/plates.ts` içine başlık (EN/TR).
- `title`, `description` ve `label` değerlerini tek tırnakla yaz (`node scripts/quote-frontmatter.mjs` bunu yapar).
- Formüller `$$ … $$` (KaTeX); şekil: `<Figure caption="…"><Bileşen locale="en" /></Figure>`; not: `<Note kind="note|warn|key">`.
- İç bağlantılar temiz URL ile yazılır (`/fundamentals/chip-types/`, `/tr/temeller/talas-tipleri/`).
- Derleme sonrası `node scripts/check-links.mjs dist` kırık bağlantı bırakmamalı.

## Sıradaki işler

Site haritası dokümanındaki "İlk yayın seti" sırasıyla: talaş tipleri için 3D model, çapak oluşumu, rijit kılavuz çekme, ISO 5608 tutucu kodu çözücü (güvenilir katalog kaynağı gerekiyor),
sertlik dönüşümü, çelik eşdeğer tablosu, 304/316 ve alüminyum alaşımları, problem çözme sayfaları.
ISO 262:2023 seçilmiş ölçü tablosu okunabildiğinde ince adım listesi yeniden kontrol edilecek.
Rk sayfasındaki tek kaynaklı hedef değerler ikinci bir kaynakla doğrulanınca "İncelemede" işareti kaldırılacak.
