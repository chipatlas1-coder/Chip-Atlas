// Check that every internal href in dist/ points to an existing page or file.
import fs from 'node:fs';
import path from 'node:path';
const dist = process.argv[2] || 'dist';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const html = walk(dist).filter((f) => f.endsWith('.html'));
let bad = 0;
for (const f of html) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|data:|javascript:)/.test(h) || h === '') continue;
    let target;
    if (h.startsWith('/')) target = path.join(dist, h);
    else target = path.join(path.dirname(f), h);
    const ok = fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
    const okHtml = !ok && fs.existsSync(target + '.html');
    if (!ok && !okHtml) { bad++; console.log('BROKEN', path.relative(dist, f), '->', h); }
  }
}
console.log(html.length, 'pages checked,', bad, 'broken links');
process.exit(bad ? 1 : 0);
