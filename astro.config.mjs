// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeTables from './src/lib/rehype-tables.mjs';
import rehypeNowrap from './src/lib/rehype-nowrap.mjs';

// PREVIEW=1 builds a file-per-page site (tools/x.html) whose links are then
// made relative by scripts/relativize.mjs, so the build can be opened from
// any static host or folder without a server. Production uses clean URLs.
const preview = Boolean(process.env.PREVIEW);

// Working pages (figure galleries) exist only under `astro dev`; no build ever ships them.
const devPages = {
  name: 'dev-pages',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev-figs', entrypoint: './src/dev-pages/dev-figs.astro' });
      injectRoute({ pattern: '/dev-new', entrypoint: './src/dev-pages/dev-new.astro' });
    },
  },
};

export default defineConfig({
  site: 'https://chipatlas.com',
  trailingSlash: preview ? 'never' : 'always',
  build: { format: preview ? 'file' : 'directory', assets: 'assets' },
  integrations: [
    mdx(),
    devPages,
    // No sitemap i18n: EN and TR slugs differ, so its prefix-based alternates would be wrong; each page's
    // <head> already carries the correct hreflang pair.
    sitemap({ filter: (page) => !/\/404\/?$/.test(page) }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { output: 'htmlAndMathml', strict: false }], rehypeTables, rehypeNowrap],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
    define: { 'import.meta.env.PREVIEW': JSON.stringify(preview) },
  },
});
