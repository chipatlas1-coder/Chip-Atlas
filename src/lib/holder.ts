/**
 * Drawing for the ISO 5608 holder decoder: plan view of the holder head at work (workpiece above,
 * shank towards the operator, shank broken), the insert at its entering angle κr with the main
 * edge highlighted, the feed direction(s) for the style, the clamping system on the insert, and an
 * end view of the shank (h1 × b). Pure function: returns SVG markup for a 640 × 410 view box, or,
 * with `narrow`, for 440 × 600 with the end view under the plan view (phones).
 *
 * Conventions: plan view seen from above with the rake face up. A right-hand holder (R) cuts with
 * the insert at the left of the head; side cutting feeds to the left (towards the chuck), end
 * cutting feeds along the shank towards the workpiece axis. L is the mirror image; N is symmetric.
 */
export interface HolderText {
  plan: string; end: string; feed: string; work: string; broken: string; nodraw: string; mm: string;
  centred: string; table: string;     // neutral holders: the insert is drawn centred; table = 'style {s}: {k}°' with placeholders
}
interface Parsed {
  code: string; kind: string; clamp: string; shape: string; style: string; hand: string;
  height: number | null; width: number | null; length: number | null; size: string;
  edgeLength: number | null; inscribedCircle: number | null; kr: number | null; eps: number | null;
}
interface StyleInfo { kr: number; shank: string; cut: string }
interface ShapeInfo { angle: number | null; kind: string; sides?: number }
type Pt = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const f1 = (n: number) => n.toFixed(1);
const P = (p: Pt) => `${f1(p[0])},${f1(p[1])}`;
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + k * b[0], a[1] + k * b[1]];
const dirOf = (deg: number): Pt => [Math.cos(rad(deg)), Math.sin(rad(deg))];

/** Insert outline with the nose at the origin and its bisector along +y (into the insert). */
function canonical(sh: ShapeInfo, l: number, d: number): Pt[] | null {
  if (sh.kind === 'rhombus' && sh.angle) {
    const h = rad(sh.angle / 2), u1: Pt = [-Math.sin(h), Math.cos(h)], u2: Pt = [Math.sin(h), Math.cos(h)];
    return [[0, 0], add([0, 0], u1, l), add(add([0, 0], u1, l), u2, l), add([0, 0], u2, l)];
  }
  if (sh.kind === 'polygon' && sh.sides) {
    const n = sh.sides, R = d / 2 / Math.cos(Math.PI / n);
    return Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [R * Math.cos(a), R * Math.sin(a) + R] as Pt; });
  }
  if (sh.kind === 'trigon') {
    const R1 = d / (2 * Math.sin(rad(40))), R2 = 0.6528 * R1;
    return Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (Math.PI * i) / 3, R = i % 2 === 0 ? R1 : R2; return [R * Math.cos(a), R * Math.sin(a) + R1] as Pt; });
  }
  if ((sh.kind === 'parallelogram' || sh.kind === 'rectangle') && sh.angle) return canonical({ angle: sh.angle, kind: 'rhombus' }, l, d);
  return null;
}

export function drawHolder(p: Parsed, st: StyleInfo | null, sh: ShapeInfo | null, T: HolderText, dec: (s: string) => string, narrow = false): string {
  const out: string[] = [];
  const text = (x: number, y: number, s: string, cls = 'hd-t', anchor = 'start') => `<text x="${f1(x)}" y="${f1(y)}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  out.push(text(20, 26, pretty(p.code), 'hd-code'));
  const kr = p.kr;
  if (!st || !sh || kr == null || (sh.kind !== 'round' && !sh.angle)) {
    out.push(text(narrow ? 220 : 320, 210, T.nodraw, 'hd-t hd-dim', 'middle'));
    return out.join('');
  }
  const b = p.width ?? 20;
  const eps = sh.angle ?? 90;
  const d = p.inscribedCircle ?? (sh.kind === 'round' ? Number(p.size) : 12.7);
  const l = p.edgeLength ?? d;
  const s = Math.max(2.4, Math.min(9, 175 / (b + 1.5 * l)));
  const hand = p.hand === 'L' ? 'L' : p.hand === 'N' ? 'N' : 'R';
  const mir = (v: Pt): Pt => (hand === 'L' ? [-v[0], v[1]] : v);
  const cut = hand === 'N' ? 'neutral' : st.cut;
  // main edge e1 and minor edge e2 as angles (screen: x right, y down), right-hand first
  let a1: number, a2: number;
  if (cut === 'end') { const t1 = 180 - kr, t2 = t1 - eps; a1 = 90 - t1; a2 = 90 - t2; }
  else if (cut === 'neutral') { a1 = 90 + eps / 2; a2 = 90 - eps / 2; }
  else { a1 = 180 - kr; a2 = a1 - eps; }
  const e1 = mir(dirOf(a1)), e2 = mir(dirOf(a2));
  const bis = (() => { const v = add(e1, e2); const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m] as Pt; })();
  // shank and nose
  const N: Pt = [hand === 'N' ? 220 : hand === 'L' ? 244 : 196, 128];   // L mirrors R about x 220
  const bw = b * s;
  const over = st.shank === 'offset' ? 0.28 * b * s : 0;
  let xs0: number;
  if (hand === 'N') xs0 = N[0] - bw / 2;
  else if (hand === 'R') xs0 = N[0] + over;
  else xs0 = N[0] - over - bw;
  const xs1 = xs0 + bw;
  // insert outline placed on the nose, rotated so its bisector is `bis`
  let insert: Pt[] | null = null, round: { c: Pt; r: number } | null = null;
  if (sh.kind === 'round') round = { c: add(N, bis, (d / 2) * s), r: (d / 2) * s };
  else {
    const can = canonical(sh, l * s, d * s);
    if (can) {
      const ang = Math.atan2(bis[1], bis[0]) - Math.PI / 2, c = Math.cos(ang), si = Math.sin(ang);
      insert = can.map(([x, y]) => [N[0] + x * c - y * si, N[1] + x * si + y * c] as Pt);
    }
  }
  const pts = insert ?? (round ? Array.from({ length: 16 }, (_, i) => add(round!.c, dirOf(i * 22.5), round!.r)) : []);
  const yTop = Math.max(...pts.map((q) => q[1])) + 6;
  // head: hull of the shank top and the insert (pulled in a little), the nose left out
  const cen = pts.reduce((a, q) => add(a, q, 1 / pts.length), [0, 0] as Pt);
  const pulled = pts.filter((q) => Math.hypot(q[0] - N[0], q[1] - N[1]) > 1).map((q) => add(cen, [q[0] - cen[0], q[1] - cen[1]], 0.86));
  const nearNose = [add(N, e1, 0.3 * l * s), add(N, e2, 0.3 * l * s)].map((q) => add(q, bis, 3));
  const headPts = hull([[xs0, yTop + 10], [xs1, yTop + 10], [xs0, yTop], [xs1, yTop], ...pulled, ...nearNose,
    ...(st.shank === 'straight' || hand === 'N' ? [] : [[hand === 'R' ? xs1 : xs0, N[1] + 6] as Pt])]);
  // workpiece above
  const ap = Math.min(0.45 * l, 4.5) * s;
  const X0 = 20, X1 = 420, Y0 = 34;
  let work: Pt[];
  if (cut === 'end') {
    const sx = hand === 'L' ? -1 : 1;
    const pm = Math.abs(e1[0]) > 1e-6 ? add(N, e1, ap / Math.abs(e1[0])) : add(N, [sx, 0], ap);
    const face = N[1] + 0.95 * l * s;
    work = hand === 'L'
      ? [[X1, Y0], [N[0] - ap, Y0], [N[0] - ap, pm[1]], N, [N[0], face], [X1, face]]
      : [[X0, Y0], [N[0] + ap, Y0], [N[0] + ap, pm[1]], N, [N[0], face], [X0, face]];
  } else if (cut === 'neutral') {
    work = [[X0, Y0], [X1, Y0], [X1, N[1]], [X0, N[1]]];
  } else {
    const pm = add(N, e1, ap / Math.max(0.2, e1[1]));
    work = hand === 'L'
      ? [[X1, Y0], [X1, N[1] + ap], pm, N, [X0, N[1]], [X0, Y0]]
      : [[X0, Y0], [X0, N[1] + ap], pm, N, [X1, N[1]], [X1, Y0]];
  }
  out.push(`<path d="M${work.map(P).join(' L')} Z" class="hd-work" />`);
  out.push(text(X0 + 8, Y0 + 16, T.work, 'hd-t hd-dim'));
  // shank (broken), head, break mark
  const yBrk = 318, yEnd = 352;
  out.push(`<path d="M${P([xs0, yTop])} L${P([xs0, yBrk])} L${P([xs1, yBrk - 6])} L${P([xs1, yTop])} Z" class="hd-shank" />`);
  out.push(`<path d="M${P([xs0, yBrk + 14])} L${P([xs1, yBrk + 8])} L${P([xs1, yEnd])} L${P([xs0, yEnd])} Z" class="hd-shank" />`);
  out.push(`<path d="M${headPts.map(P).join(' L')} Z" class="hd-head" />`);
  out.push(`<path d="M${P([xs0 - 6, yBrk + 1])} L${P([xs1 + 6, yBrk - 7])} M${P([xs0 - 6, yBrk + 15])} L${P([xs1 + 6, yBrk + 7])}" class="hd-brk" />`);
  // insert, clamping, cutting edges
  if (insert) out.push(`<path d="M${insert.map(P).join(' L')} Z" class="hd-ins" />`);
  if (round) out.push(`<circle cx="${f1(round.c[0])}" cy="${f1(round.c[1])}" r="${f1(round.r)}" class="hd-ins" />`);
  const hole = round ? round.c : cen;
  const hr = Math.max(2.5, 0.2 * d * s);
  if (p.clamp === 'C' || p.clamp === 'M' || p.clamp === 'D') {
    const back = add(hole, bis, 0.55 * hr + 0.25 * l * s);
    const w = 0.42 * l * s;
    const nrm: Pt = [-bis[1], bis[0]];
    const q = [add(add(back, nrm, -w / 2), bis, -0.1 * l * s), add(add(back, nrm, w / 2), bis, -0.1 * l * s), add(add(back, nrm, w / 2), bis, 0.7 * l * s), add(add(back, nrm, -w / 2), bis, 0.7 * l * s)];
    out.push(`<path d="M${q.map(P).join(' L')} Z" class="hd-clamp" />`);
  }
  if (p.clamp !== 'C') {
    out.push(`<circle cx="${f1(hole[0])}" cy="${f1(hole[1])}" r="${f1(hr)}" class="hd-hole" />`);
    if (p.clamp === 'S') out.push(`<path d="${star(hole, hr * 0.62)}" class="hd-screw" />`);
    else out.push(`<circle cx="${f1(hole[0])}" cy="${f1(hole[1])}" r="${f1(hr * 0.45)}" class="hd-pin" />`);
  }
  if (!round) {
    const m1 = add(N, e1, l * s), m2 = add(N, e2, l * s);
    out.push(`<path d="M${P(m2)} L${P(N)}" class="hd-minor" />`);
    out.push(`<path d="M${P(N)} L${P(m1)}" class="hd-main" />`);
  } else out.push(`<path d="M${P(add(round.c, dirOf(Math.atan2(-bis[1], -bis[0]) * 180 / Math.PI - 60), round.r))} A${f1(round.r)} ${f1(round.r)} 0 0 1 ${P(add(round.c, dirOf(Math.atan2(-bis[1], -bis[0]) * 180 / Math.PI + 60), round.r))}" class="hd-main" fill="none" />`);
  // feed arrows and the κr arc
  const arrow = (from: Pt, to: Pt, lbl: string, lp: Pt) => { out.push(`<line x1="${f1(from[0])}" y1="${f1(from[1])}" x2="${f1(to[0])}" y2="${f1(to[1])}" class="hd-feed" marker-end="url(#ca-arr-data)" />`); out.push(text(lp[0], lp[1], lbl, 'hd-t hd-data', 'middle')); };
  const rArc = Math.min(0.62 * l * s, 46);
  const sideFeed = () => { const sx = hand === 'L' ? 1 : -1, y = N[1] + Math.max(ap, rArc) + 30, x0 = N[0] + sx * 26; arrow([x0, y], [x0 + sx * 60, y], T.feed, [x0 + sx * 30, y + 16]); };
  // end feed: beside the head, pointing along the shank towards the work; below the work when the drawing also shows side cutting
  const endFeed = (low: boolean) => {
    const sx = hand === 'L' ? -1 : 1;
    const x = low ? (hand === 'L' ? xs0 - 18 : xs1 + 18) : N[0] + sx * (1.15 * l * s + 16);
    const y0 = low ? N[1] + 92 : N[1] + 14;
    arrow([x, y0], [x, y0 - 56], T.feed, [x + sx * 14, y0 - 24]);
  };
  if (cut === 'side') sideFeed();
  if (cut === 'end') endFeed(false);
  if (cut === 'both') { sideFeed(); endFeed(true); }
  if (cut === 'neutral') {
    const y = N[1] + 0.9 * l * s + 16;
    arrow([N[0] - 16, y], [N[0] - 70, y], T.feed, [N[0] - 43, y + 16]);
    arrow([N[0] + 16, y], [N[0] + 70, y], T.feed, [N[0] + 43, y + 16]);
  }
  if (!round) {
    // κr between the feed direction and the main edge
    const fdir = cut === 'end' ? -90 : hand === 'L' ? 0 : 180;
    const mdir = (Math.atan2(e1[1], e1[0]) * 180) / Math.PI;
    let from = fdir, to = mdir;
    let sweep = ((to - from) % 360 + 360) % 360;
    if (sweep > 180) { [from, to] = [to, from]; sweep = 360 - sweep; }
    const r = rArc;
    const pa = add(N, dirOf(from), r), pb = add(N, dirOf(to), r);
    out.push(`<path d="M${P(pa)} A${f1(r)} ${f1(r)} 0 0 1 ${P(pb)}" class="hd-arc" />`);
    out.push(`<path d="M${P(N)} L${P(add(N, dirOf(fdir), r + 10))}" class="hd-ref" />`);
    const mid = add(N, dirOf(from + sweep / 2), r + 16);
    // the arc shows the drawn angle; a neutral holder is drawn with the insert centred (κr = 90° − εr/2),
    // so where the style table gives another value, a note under the plan view says both
    const krDrawn = cut === 'neutral' ? 90 - eps / 2 : kr;
    out.push(text(mid[0], mid[1] + 4, `κr ${dec(String(krDrawn))}°`, 'hd-t hd-acc', 'middle'));
    if (cut === 'neutral' && Math.abs(krDrawn - kr) > 0.05) out.push(text(220, 372, `${T.centred}; ${T.table.replace('{s}', p.style).replace('{k}', dec(String(kr)))}`, 'hd-t hd-dim', 'middle'));
  }
  // dimensions on the plan view: b across the shank, l1 along it (broken)
  const yb = 296;
  out.push(`<path d="M${P([xs0, yb - 8])} L${P([xs0, yb + 8])} M${P([xs1, yb - 8])} L${P([xs1, yb + 8])}" class="hd-ext" />`);
  out.push(`<line x1="${f1(xs0)}" y1="${yb}" x2="${f1(xs1)}" y2="${yb}" class="hd-dimline" marker-start="url(#ca-arr)" marker-end="url(#ca-arr)" />`);
  out.push(text((xs0 + xs1) / 2, yb - 6, `b ${p.width ?? '–'}`, 'hd-t', 'middle'));
  const xl = (hand === 'L' ? xs0 - 26 : xs1 + 26);
  out.push(`<path d="M${P([xl - 6, N[1]])} L${P([xl + 6, N[1]])} M${P([xl - 6, yEnd])} L${P([xl + 6, yEnd])}" class="hd-ext" />`);
  out.push(`<line x1="${f1(xl)}" y1="${f1(N[1])}" x2="${f1(xl)}" y2="${yBrk - 10}" class="hd-dimline" marker-start="url(#ca-arr)" />`);
  out.push(`<line x1="${f1(xl)}" y1="${yBrk + 12}" x2="${f1(xl)}" y2="${yEnd}" class="hd-dimline" marker-end="url(#ca-arr)" />`);
  out.push(text(xl + (hand === 'L' ? -8 : 8), (N[1] + yBrk) / 2, `l1 ${p.length ?? (p.kind === 'cartridge' ? '–' : '?')}`, 'hd-t', hand === 'L' ? 'end' : 'start'));
  out.push(text(220, 392, `${T.plan} · ${T.broken} · ${T.mm}`, 'hd-t hd-dim', 'middle'));
  // end view of the shank, its own scale
  const h = p.height ?? b;
  const s2 = Math.min(s, 130 / Math.max(h, b));
  const cx = narrow ? 220 : 540, cyBase = narrow ? 540 : 290, W = b * s2, H = h * s2;
  const ex0 = cx - W / 2, ey0 = cyBase - H;
  out.push(`<rect x="${f1(ex0)}" y="${f1(ey0)}" width="${f1(W)}" height="${f1(H)}" class="hd-sec" />`);
  const insW = Math.min(0.62 * l * s2 + over * (s2 / s), W * 0.9), insH = Math.max(3, 4.76 * s2);
  const ix = hand === 'L' ? ex0 + W - insW + over * (s2 / s) : hand === 'N' ? cx - insW / 2 : ex0 - over * (s2 / s);
  out.push(`<rect x="${f1(ix)}" y="${f1(ey0 - insH * 0.25)}" width="${f1(insW)}" height="${f1(insH)}" class="hd-ins" />`);
  out.push(`<path d="M${P([ex0 - 16, ey0])} L${P([ex0 - 4, ey0])} M${P([ex0 - 16, cyBase])} L${P([ex0 - 4, cyBase])}" class="hd-ext" />`);
  out.push(`<line x1="${f1(ex0 - 10)}" y1="${f1(ey0)}" x2="${f1(ex0 - 10)}" y2="${cyBase}" class="hd-dimline" marker-start="url(#ca-arr)" marker-end="url(#ca-arr)" />`);
  out.push(text(ex0 - 16, (ey0 + cyBase) / 2 + 4, `h1 ${p.height ?? '–'}`, 'hd-t', 'end'));
  out.push(`<line x1="${f1(ex0)}" y1="${cyBase + 16}" x2="${f1(ex0 + W)}" y2="${cyBase + 16}" class="hd-dimline" marker-start="url(#ca-arr)" marker-end="url(#ca-arr)" />`);
  out.push(text(cx, cyBase + 34, `b ${p.width ?? '–'}`, 'hd-t', 'middle'));
  out.push(text(cx, narrow ? 592 : 392, T.end, 'hd-t hd-dim', 'middle'));
  return out.join('');
}

/** "PCLNR2525M12" → "PCLNR 2525 M12"; cartridges and odd codes are returned as typed. */
function pretty(code: string): string {
  const m = code.match(/^([A-Z]{5})(\d{4})-?([A-Z-])(\d{2})(.*)$/);
  if (m) return `${m[1]} ${m[2]} ${m[3]}${m[4]}${m[5] ? ` ${m[5].replace(/^-/, '')}` : ''}`;
  const c = code.match(/^([A-Z]{5})(\d{2}C[A-Z].*)$/);
  return c ? `${c[1]} ${c[2]}` : code;
}

function hull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [], upper: Pt[] = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function star(c: Pt, r: number): string {
  const q = Array.from({ length: 12 }, (_, i) => { const a = (Math.PI / 6) * i, rr = i % 2 === 0 ? r : r * 0.55; return [c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)] as Pt; });
  return `M${q.map(P).join(' L')} Z`;
}
