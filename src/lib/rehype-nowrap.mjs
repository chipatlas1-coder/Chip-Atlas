/**
 * Rehype plugin: in headings, keep hyphenated tokens that contain a digit ("8589-1", "286-1", "M8-6H")
 * on one line, so a heading never breaks as "DIN 8589-" / "1". Wraps each such token in
 * <span class="nw"> (white-space: nowrap in global.css). Text inside code and KaTeX is left alone.
 */
import { visit, SKIP } from 'unist-util-visit';

const TOKEN = /[A-Za-z0-9.,]+(?:[-‐][A-Za-z0-9.,]+)+/g;
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4']);

function splitText(value) {
  const out = [];
  let last = 0;
  for (const m of value.matchAll(TOKEN)) {
    if (!/\d/.test(m[0])) continue;
    if (m.index > last) out.push({ type: 'text', value: value.slice(last, m.index) });
    out.push({ type: 'element', tagName: 'span', properties: { className: ['nw'] }, children: [{ type: 'text', value: m[0] }] });
    last = m.index + m[0].length;
  }
  if (!out.length) return null;
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out;
}

function walk(node) {
  if (!node.children) return;
  const next = [];
  for (const c of node.children) {
    if (c.type === 'text') { const parts = splitText(c.value); if (parts) next.push(...parts); else next.push(c); continue; }
    if (c.type === 'element') {
      const cls = [].concat(c.properties?.className || []).join(' ');
      if (c.tagName !== 'code' && !/katex/.test(cls)) walk(c);
    }
    next.push(c);
  }
  node.children = next;
}

export default function rehypeNowrap() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!HEADINGS.has(node.tagName)) return;
      walk(node);
      return SKIP;
    });
  };
}
