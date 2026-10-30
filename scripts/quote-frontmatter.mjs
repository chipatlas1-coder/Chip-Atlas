// Quote frontmatter scalar values (title, description, label) so colons and quotes never break YAML.
import fs from 'node:fs';
import path from 'node:path';
const root = 'src/content/articles';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(root).filter((f) => f.endsWith('.mdx'))) {
  const src = fs.readFileSync(f, 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) continue;
  const fm = m[1].replace(/^(\s*(?:- )?(?:title|description|label): )(.+)$/gm, (all, k, v) => {
    if (/^'.*'$/.test(v)) return all;
    if (/^".*"$/.test(v) && !/^".*".+/.test(v)) {
      // already double-quoted as a whole
      try { JSON.parse(v); return all; } catch {}
    }
    return k + "'" + v.replace(/'/g, "''") + "'";
  });
  if (fm !== m[1]) { fs.writeFileSync(f, src.replace(m[1], fm)); console.log('quoted', f); }
}
