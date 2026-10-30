import { getCollection, type CollectionEntry } from 'astro:content';
import { sections, sectionPath } from '../data/sections';
import type { Locale } from '../i18n';

export type Article = CollectionEntry<'articles'>;

export async function articlesFor(locale: Locale): Promise<Article[]> {
  const all = await getCollection('articles', (a) => a.data.locale === locale);
  const subIndex = (a: Article) => {
    const sec = sections.find((s) => s.n === a.data.section);
    const i = sec ? sec.subsections.findIndex((x) => x.slug.en === a.data.subsection) : -1;
    return i < 0 ? 999 : i;
  };
  return all.sort(
    (a, b) =>
      a.data.section - b.data.section ||
      subIndex(a) - subIndex(b) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title),
  );
}

export function articlePath(a: Article): string {
  const sec = sections.find((s) => s.n === a.data.section)!;
  return `${sectionPath(a.data.locale, sec)}${a.data.slug}/`;
}

/** Path of the same article in the other language, or that language's section page. */
export async function alternatePath(a: Article): Promise<string> {
  const other: Locale = a.data.locale === 'en' ? 'tr' : 'en';
  const match = (await getCollection('articles', (x) => x.data.locale === other && x.data.key === a.data.key))[0];
  if (match) return articlePath(match);
  const sec = sections.find((s) => s.n === a.data.section)!;
  return sectionPath(other, sec);
}
