import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Articles live in src/content/articles/{en,tr}/<key>.mdx.
 * `key` is shared by the two language versions of the same article.
 */
const articles = defineCollection({
  // Ids come from the file path (en/iso-513, tr/iso-513), so the two languages may share a URL slug.
  loader: glob({ base: './src/content/articles', pattern: '**/*.mdx', generateId: ({ entry }) => entry.replace(/\.mdx$/, '') }),
  schema: z.object({
    key: z.string(),
    locale: z.enum(['en', 'tr']),
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    section: z.number().int().min(1).max(18),
    subsection: z.string(),
    order: z.number().default(100),
    status: z.enum(['live', 'review']).default('live'),
    updated: z.coerce.date(),
    tools: z.array(z.string()).default([]),
    sources: z.array(z.object({ label: z.string(), url: z.string().optional() })).default([]),
    /** Three or four key figures shown under the title. Values must come from the article body. */
    glance: z.array(z.object({ value: z.string(), unit: z.string().optional(), label: z.string() })).max(4).default([]),
  }),
});

export const collections = { articles };
