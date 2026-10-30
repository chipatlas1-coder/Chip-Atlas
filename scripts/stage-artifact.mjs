// Prepare the preview build for publishing as a multi-file artifact.
// The entry page is published as a fragment (the host wraps it in its own
// document skeleton); every other file is published as-is.
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const stage = process.argv[2];
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(dist, stage, { recursive: true });

let html = readFileSync(join(stage, 'index.html'), 'utf8');
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<\/html>/i, '')
  .replace(/<head>/i, '')
  .replace(/<\/head>/i, '')
  .replace(/<body>/i, '')
  .replace(/<\/body>/i, '')
  .replace(/<title>[^<]*<\/title>/i, '<title>Chip Atlas</title>');
writeFileSync(join(stage, 'index.html'), html.trim() + '\n');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = {};
for (const f of walk(stage)) {
  const rel = relative(stage, f);
  if (rel === 'index.html') continue;
  files[rel] = { from: f };
}
writeFileSync(join(stage, '..', 'artifact-files.json'), JSON.stringify(files, null, 2));
console.log(`staged ${Object.keys(files).length} supporting files`);
