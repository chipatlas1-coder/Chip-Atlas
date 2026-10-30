export type Locale = 'en' | 'tr';
export const locales: Locale[] = ['en', 'tr'];

/** Canonical routes for pages that exist in both languages. */
export const routes = {
  home: { en: '/', tr: '/tr/' },
  tools: { en: '/tools/', tr: '/tr/araclar/' },
  decoder: { en: '/tools/insert-code-decoder/', tr: '/tr/araclar/uc-kodu-cozucu/' },
  holder: { en: '/tools/toolholder-code-decoder/', tr: '/tr/araclar/tutucu-kodu-cozucu/' },
  roughness: { en: '/tools/theoretical-roughness/', tr: '/tr/araclar/teorik-puruzluluk/' },
  turning: { en: '/tools/turning-calculator/', tr: '/tr/araclar/tornalama-hesaplayicisi/' },
  milling: { en: '/tools/milling-calculator/', tr: '/tr/araclar/frezeleme-hesaplayicisi/' },
  drilling: { en: '/tools/drilling-calculator/', tr: '/tr/araclar/delme-hesaplayicisi/' },
  fits: { en: '/tools/iso-286-fits/', tr: '/tr/araclar/iso-286-gecmeler/' },
  tapdrill: { en: '/tools/tap-drill-calculator/', tr: '/tr/araclar/kilavuz-deligi-hesaplayicisi/' },
  micrometer: { en: '/tools/micrometer-reading/', tr: '/tr/araclar/mikrometre-okuma/' },
  // Simulators that live inside an article (Tools Hub links straight to the article).
  climbMilling: { en: '/processes/climb-vs-conventional-milling/', tr: '/tr/prosesler/ayni-ve-zit-yonlu-frezeleme/' },
} as const;

export type RouteKey = keyof typeof routes;

/**
 * Turn a clean route ("/tools/x/") into the link this build serves.
 * Production keeps clean URLs; the preview build is one file per page.
 */
export function href(route: string): string {
  if (!import.meta.env.PREVIEW) return route;
  const [path, hash] = route.split('#');
  const anchor = hash ? `#${hash}` : '';
  if (path === '/' || path === '') return `/index.html${anchor}`;
  // Every other route, the locale root included, is one file: "/tr/" → "/tr.html".
  const trimmed = path.replace(/\/$/, '');
  return `${trimmed}.html${anchor}`;
}

export const ui = {
  en: {
    siteName: 'Chip Atlas',
    tagline: 'The Machining Encyclopedia',
    nav: { atlas: 'Atlas', tools: 'Tools', search: 'Search' },
    lang: { switchTo: 'Türkçe', code: 'TR' },
    footer: {
      accuracy: 'Every number on this site carries its source. Formulas are tested, tables are cross-checked against at least two references, and anything still under review is marked as such.',
      sections: 'Sections',
      tools: 'Tools',
      channels: 'Chip Atlas elsewhere',
      rights: 'Chip Atlas. Built in Konya, read everywhere.',
    },
    status: { live: 'Live', review: 'Under review', production: 'In production', planned: 'Charted' },
    common: {
      pages: 'pages',
      subsections: 'subsections',
      phase: 'Phase',
      priority: 'Priority',
      relatedTools: 'Tools for this section',
      openTool: 'Open tool',
      allTools: 'All tools',
      sources: 'Sources',
      backToTools: 'All tools',
      inputs: 'Inputs',
      results: 'Results',
      formulae: 'Formulae',
      notes: 'Notes',
      section: 'Section',
    },
  },
  tr: {
    siteName: 'Chip Atlas',
    tagline: 'Talaşlı İmalat Ansiklopedisi',
    nav: { atlas: 'Atlas', tools: 'Araçlar', search: 'Ara' },
    lang: { switchTo: 'English', code: 'EN' },
    footer: {
      accuracy: 'Bu sitedeki her sayının kaynağı yazılıdır. Formüller test edilir, tablolar en az iki kaynakla çapraz kontrol edilir; inceleme bekleyen her şey açıkça işaretlenir.',
      sections: 'Bölümler',
      tools: 'Araçlar',
      channels: 'Chip Atlas başka yerlerde',
      rights: "Chip Atlas. Konya'da yapıldı, her yerde okunuyor.",
    },
    status: { live: 'Yayında', review: 'İncelemede', production: 'Üretimde', planned: 'Haritalandı' },
    common: {
      pages: 'sayfa',
      subsections: 'alt bölüm',
      phase: 'Faz',
      priority: 'Öncelik',
      relatedTools: 'Bu bölümün araçları',
      openTool: 'Aracı aç',
      allTools: 'Tüm araçlar',
      sources: 'Kaynaklar',
      backToTools: 'Tüm araçlar',
      inputs: 'Girdiler',
      results: 'Sonuçlar',
      formulae: 'Formüller',
      notes: 'Notlar',
      section: 'Bölüm',
    },
  },
} as const;

export function t(locale: Locale) {
  return ui[locale];
}

/** Pick the localized member of a {en, tr} pair. */
export function pick<T>(locale: Locale, pair: { en: T; tr: T }): T {
  return pair[locale];
}
