// Make a PREVIEW build (one file per page) openable from any folder or static
// host without a server: turns root-relative URLs into relative ones.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let htmlCount = 0;
let cssCount = 0;
for (const file of walk(dist)) {
  if (file.endsWith('.html')) {
    const depth = relative(dist, dirname(file)).split('/').filter(Boolean).length;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    let html = readFileSync(file, 'utf8');
    // Article links written in content as clean URLs ("/fundamentals/chip-types/") become files.
    html = html.replace(/href="\/((?:[a-z0-9-]+\/)*[a-z0-9-]+)\/(#[^"]*)?"/g, (_, p, hash = '') => `href="/${p}.html${hash}"`);
    html = html.replace(/href="\/(#[^"]*)?"/g, (_, hash = '') => `href="/index.html${hash}"`);
    // href="/x", src="/x", data-src, poster — but not protocol-relative "//" and not anchors.
    html = html.replace(/\b(href|src|poster|data-src)="\/(?!\/)/g, `$1="${prefix}`);
    // Root-relative URLs inside inline styles.
    html = html.replace(/url\(\s*(['"]?)\/(?!\/)/g, `url($1${prefix}`);
    writeFileSync(file, html);
    htmlCount++;
  } else if (file.endsWith('.css')) {
    let css = readFileSync(file, 'utf8');
    css = css.replace(/url\(\s*(['"]?)\/assets\//g, 'url($1./');
    writeFileSync(file, css);
    cssCount++;
  }
}
console.log(`relativized ${htmlCount} html, ${cssCount} css`);
