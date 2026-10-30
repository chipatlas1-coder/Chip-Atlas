/**
 * Rehype plugin for article tables.
 * - Wraps every <table> in <div class="table-frame"><div class="table-scroll">…</div></div>
 *   so wide tables scroll inside a frame instead of the page.
 * - Marks numeric columns: a column whose body cells are mostly numbers gets class "num"
 *   on every cell (right-aligned, tabular figures). Text columns stay left-aligned.
 */
import { visit, SKIP } from 'unist-util-visit';

const text = (node) => {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  return (node.children || []).map(text).join('');
};

const LETTERS = /[A-Za-zÇĞİÖŞÜçğıöşüÄäÖöÜüßµ]/g;
/** "0.42–0.50", "≤ 16", "355", "+20 °C", "1,5", "4–12", "—" count as numeric; words do not. */
export function isNumeric(raw) {
  const t = raw.trim();
  if (t === '' || t === '—' || t === '–' || t === '-') return null; // empty: no vote
  if (!/^[≤≥<>~≈±+\-−–(]?\s*\d/.test(t)) return false;
  const letters = (t.match(LETTERS) || []).length;
  return letters <= 4 && t.length <= 28;
}

const addClass = (node, cls) => {
  const p = (node.properties ||= {});
  const c = p.className ? (Array.isArray(p.className) ? p.className : String(p.className).split(/\s+/)) : [];
  if (!c.includes(cls)) c.push(cls);
  p.className = c;
};

const rows = (table) => {
  const out = [];
  visit(table, 'element', (n) => { if (n.tagName === 'tr') out.push(n); });
  return out;
};
const cells = (tr) => (tr.children || []).filter((c) => c.type === 'element' && (c.tagName === 'td' || c.tagName === 'th'));

export default function rehypeTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      const all = rows(node);
      const body = all.filter((tr) => cells(tr).some((c) => c.tagName === 'td'));
      const width = Math.max(0, ...all.map((tr) => cells(tr).length));
      for (let col = 0; col < width; col++) {
        let yes = 0, votes = 0;
        for (const tr of body) {
          const v = isNumeric(text(cells(tr)[col]));
          if (v === null) continue;
          votes++; if (v) yes++;
        }
        if (votes > 0 && yes / votes >= 0.6) for (const tr of all) { const c = cells(tr)[col]; if (c) addClass(c, 'num'); }
      }
      const frame = {
        type: 'element', tagName: 'div', properties: { className: ['table-frame'] },
        children: [{ type: 'element', tagName: 'div', properties: { className: ['table-scroll'], tabIndex: 0 }, children: [node] }],
      };
      parent.children[index] = frame;
      return SKIP;
    });
  };
}
