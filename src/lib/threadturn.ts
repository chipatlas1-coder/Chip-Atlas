/**
 * Thread turning: infeed geometry, the depth of each pass and the helix angle.
 *
 * Depths per pass: Mitsubishi Materials, "Standard of depth of cut, external (radial infeed)", ISO 60°
 * (each row's passes add up to the stated total). The infeed figure applies the same depths to every infeed
 * method so that the methods can be compared.
 *
 * Geometry (section through the groove, x across, y = depth below the crest line, both in mm): the tool is a
 * sharp 60° V with its tip at (tx, ty). Infeed at angle θ from the radial direction moves the tip along
 * (sin θ, cos θ) to its final position (0, H); at depth d the tip sits at x = −(H − d)·tan θ.
 * θ = 0: radial. θ = 30°: flank; the insert's left edge then lies on the finished left flank and only the
 * right edge cuts. θ = 30° − offset: modified flank; the left edge takes a thin cut instead.
 * Alternating: +30° and −30° pass by pass.
 * What a pass removes is its wedge minus everything cut before; at each x the groove is as deep as the
 * deepest wedge so far, so the area removed up to pass k is ∫ max(0, maxⱼ≤ₖ yⱼ(x)) dx.
 */
export const MMC: { P: number; total: number; passes: number[] }[] = [
  { P: 0.5, total: 0.31, passes: [0.1, 0.08, 0.07, 0.06] },
  { P: 0.75, total: 0.46, passes: [0.16, 0.14, 0.1, 0.06] },
  { P: 1.0, total: 0.61, passes: [0.18, 0.15, 0.12, 0.1, 0.06] },
  { P: 1.25, total: 0.77, passes: [0.19, 0.17, 0.14, 0.11, 0.1, 0.06] },
  { P: 1.5, total: 0.92, passes: [0.22, 0.21, 0.17, 0.14, 0.12, 0.06] },
  { P: 1.75, total: 1.07, passes: [0.22, 0.21, 0.16, 0.13, 0.11, 0.09, 0.09, 0.06] },
  { P: 2.0, total: 1.23, passes: [0.24, 0.23, 0.17, 0.16, 0.14, 0.12, 0.11, 0.06] },
  { P: 2.5, total: 1.53, passes: [0.26, 0.23, 0.19, 0.17, 0.15, 0.13, 0.12, 0.11, 0.11, 0.06] },
  { P: 3.0, total: 1.84, passes: [0.27, 0.25, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.12, 0.11, 0.1, 0.06] },
];
export type Method = 'radial' | 'flank' | 'modified' | 'alternating';
export const METHODS: Method[] = ['radial', 'flank', 'modified', 'alternating'];
const T30 = Math.tan(Math.PI / 6), DEG = Math.PI / 180;

/** Cumulative depth after each pass. */
export const cumulative = (passes: number[]) => passes.reduce<number[]>((a, d) => (a.push((a.length ? a[a.length - 1] : 0) + d), a), []);
/** Depth of each pass from the cumulative depths. */
export const perPass = (cum: number[]) => cum.map((c, i) => c - (i ? cum[i - 1] : 0));

/* ---------- pass rules ---------- */
export type Rule = 'iscar' | 'sqrt' | 'const';
/**
 * Cumulative depth after each of n passes for a total depth ap.
 * iscar: ISCAR's constant chip area, ap / √(n − 1) · √C with C = 0.3 (1st pass), 1 (2nd), i − 1 (i-th, i ≥ 3).
 * sqrt: first-pass depth × √(pass number) (Haas G76 "D*sqrt(N)", Kennametal); with n passes reaching ap
 *       the first pass is ap / √n.
 * const: the same depth every pass (Korloy's example; Vargus "depth constant").
 */
export function schedule(rule: Rule, ap: number, n: number) {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (rule === 'iscar') out.push(n < 2 ? ap : (ap / Math.sqrt(n - 1)) * Math.sqrt(i === 1 ? 0.3 : i === 2 ? 1 : i - 1));
    else if (rule === 'sqrt') out.push(ap * Math.sqrt(i / n));
    else out.push((ap * i) / n);
  }
  return out;
}
/** Area (mm²) each pass removes with a sharp 60° V fed radially: tan 30° · (cᵢ² − cᵢ₋₁²). */
export const radialAreas = (cum: number[]) => cum.map((c, i) => T30 * (c * c - (i ? cum[i - 1] ** 2 : 0)));

/* ---------- infeed geometry ---------- */
export const infeedAngle = (m: Method, i: number, offset: number) =>
  m === 'flank' ? 30 : m === 'modified' ? 30 - offset : m === 'alternating' ? (i % 2 === 0 ? 30 : -30) : 0;
/** Tool-tip positions (x, depth) for every pass. */
export function tips(m: Method, passes: number[], offset = 3) {
  const cum = cumulative(passes), H = cum[cum.length - 1];
  return cum.map((d, i) => ({ x: -(H - d) * Math.tan(infeedAngle(m, i, offset) * DEG), y: d, th: infeedAngle(m, i, offset) }));
}
/**
 * Area (mm²) each pass removes, split by the edge of the insert that meets it: the tool comes in along its
 * infeed direction, and a point of material is met by the left or the right edge, whichever reaches it first.
 * Seen from the tool, a point at Q (relative to the final tip, Q.y ≤ 0) moves back along the infeed
 * direction v; it leaves the wedge through the left edge after t_L = (Q.x − Q.y·tan 30°) / (cos θ·tan 30° − sin θ)
 * and through the right edge after t_R = (−Q.y·tan 30° − Q.x) / (sin θ + cos θ·tan 30°); the smaller one is
 * the edge it entered by. With θ = 30° the left edge only slides along its own line and cuts nothing.
 * Integrated on a grid over the groove.
 */
export function passSplit(m: Method, passes: number[], offset = 3, NX = 360, NY = 240) {
  const tp = tips(m, passes, offset), H = tp[tp.length - 1].y, half = H * T30;
  const dx = (2 * half) / NX, dy = H / NY, out = tp.map(() => ({ left: 0, right: 0 }));
  const rate = tp.map((t) => ({ dl: Math.cos(t.th * DEG) * T30 - Math.sin(t.th * DEG), dr: Math.sin(t.th * DEG) + Math.cos(t.th * DEG) * T30 }));
  for (let iy = 0; iy < NY; iy++) {
    const y = (iy + 0.5) * dy;
    for (let ix = 0; ix < NX; ix++) {
      const x = -half + (ix + 0.5) * dx;
      for (let k = 0; k < tp.length; k++) {
        const qx = x - tp[k].x, qy = y - tp[k].y;
        if (qy > 0 || Math.abs(qx) > -qy * T30) continue;           // not inside this pass's wedge
        const { dl, dr } = rate[k];
        const tL = dl > 1e-12 ? (qx - qy * T30) / dl : Infinity, tR = dr > 1e-12 ? (-qy * T30 - qx) / dr : Infinity;
        if (tL < tR) out[k].left += dx * dy; else out[k].right += dx * dy;
        break;
      }
    }
  }
  return out;
}

/* ---------- helix angle ---------- */
/** ISO metric basic pitch diameter d2 = d − 0.6495 P (ISO 724). */
export const pitchD = (d: number, P: number) => d - 0.649519 * P;
/** Helix (lead) angle in degrees: φ = arctan(P · starts / (π · d2)). */
export const helix = (P: number, d2: number, starts = 1) => (Math.atan((P * starts) / (Math.PI * d2)) * 180) / Math.PI;
/** Hoffmann Group's approximation, degrees: a ≈ 20 · P / D. */
export const helixApprox = (P: number, D: number, starts = 1) => (20 * P * starts) / D;

/* ---------- drawing ---------- */
const f = (n: number) => n.toFixed(1);
/** Pass colour: warm for the first pass, cool for the last. */
/** Pass colour along the temper-colour sequence of heated steel: straw first, blue last. */
const TEMPER = [[233, 185, 58], [222, 140, 40], [200, 96, 47], [168, 70, 106], [125, 63, 156], [74, 82, 184], [47, 117, 201], [46, 155, 181]];
export const passColor = (i: number, n: number) => {
  const u = n > 1 ? (i / (n - 1)) * (TEMPER.length - 1) : 0, k = Math.min(TEMPER.length - 2, Math.floor(u)), t = u - k;
  const c = TEMPER[k].map((v, j) => Math.round(v + (TEMPER[k + 1][j] - v) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
};
export interface IText { left: string; right: string; mm2: string; pass: string; infeed: string }

/**
 * Section of the groove: the workpiece, the passes 0 … shown − 1 (each point coloured by the first pass that
 * cut it), the finished profile, and the tool at pass `tool` (null: no tool) moved back along its infeed
 * direction by `back` (0 = at its depth, 1 = retracted).
 */
export function drawSection(m: Method, passes: number[], offset: number, narrow: boolean, T: IText, dec: (s: string) => string, shown: number, tool: number | null, back = 0, fresh = 1) {
  const W = narrow ? 360 : 400, H = narrow ? 250 : 270;
  const n = passes.length, cum = cumulative(passes), Ht = cum[n - 1], tp = tips(m, passes, offset);
  const yTop = 92, k = (H - yTop - 22) / Ht, cx = W / 2;
  const X = (x: number) => cx + x * k, Y = (y: number) => yTop + y * k;
  const half = Ht * T30;
  const o: string[] = [];
  o.push(`<rect x="10" y="${yTop}" width="${W - 20}" height="${H - yTop - 10}" class="tt-work"/>`);
  o.push(`<path d="M${f(X(-half))},${yTop} L${cx},${f(Y(Ht))} L${f(X(half))},${yTop} Z" class="tt-groove"/>`);
  for (let i = shown - 1; i >= 0; i--) {
    const t = tp[i], w = t.y * T30;
    o.push(`<path d="M${f(X(t.x - w))},${yTop} L${f(X(t.x))},${f(Y(t.y))} L${f(X(t.x + w))},${yTop} Z" fill="${passColor(i, n)}" class="tt-pass"${i === shown - 1 && fresh < 1 ? ` style="opacity:${fresh.toFixed(2)}"` : ''}/>`);
  }
  o.push(`<path d="M${f(X(-half))},${yTop} L${cx},${f(Y(Ht))} L${f(X(half))},${yTop}" class="tt-final"/>`);
  o.push(`<line x1="10" x2="${W - 10}" y1="${yTop}" y2="${yTop}" class="tt-crest"/>`);
  if (tool !== null) {
    const t = tp[tool], th = t.th * DEG, L = 70 * back;
    const px = X(t.x) - Math.sin(th) * L, py = Y(t.y) - Math.cos(th) * L;
    // an edge lying on the finished flank (flank infeed, alternating): drawn while the tool is at depth
    if (back < 0.05 && Math.abs(Math.abs(t.th) - 30) < 1e-6 && tool < n - 1) {
      const sgn = t.th > 0 ? -1 : 1;
      o.push(`<line x1="${f(X(sgn * half))}" y1="${yTop}" x2="${f(px)}" y2="${f(py)}" class="tt-slide"/>`);
    }
    // the insert: a fixed 60° V tall enough for the full depth, then the body
    const vh = Ht * k + 16, wv = vh * T30, yv = py - vh;
    o.push(`<path d="M${f(px)},${f(py)} L${f(px - wv)},${f(yv)} L${f(px - wv)},${f(yv - 60)} L${f(px + wv)},${f(yv - 60)} L${f(px + wv)},${f(yv)} Z" class="tt-tool"/>`);
    o.push(`<circle cx="${f(px)}" cy="${f(py)}" r="2.6" class="tt-tip"/>`);
  }
  // infeed direction of the current (or last) pass, top left
  const ti = tool ?? n - 1, th = tp[ti].th, r = th * DEG, ox = 34, oy = 22, al = 40;
  o.push(`<line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy + al + 6}" class="tt-ref"/>`);
  o.push(`<line x1="${f(ox - Math.sin(r) * 2)}" y1="${f(oy)}" x2="${f(ox + Math.sin(r) * al)}" y2="${f(oy + Math.cos(r) * al)}" class="tt-dir" marker-end="url(#tt-a)"/>`);
  o.push(`<text x="${ox + 14 + (th > 0 ? 18 : 0)}" y="${oy + 30}" class="tt-t d">${dec(String(Math.abs(Math.round(th * 10) / 10)))}°</text>`);
  o.push(`<text x="${ox - 14}" y="${oy + al + 22}" class="tt-t s">${T.infeed}</text>`);
  if (tool !== null) o.push(`<text x="${W - 14}" y="${yTop - 8}" text-anchor="end" class="tt-t s">${T.pass} ${tool + 1}</text>`);
  return { W, H, svg: o.join('') };
}

/** Stacked bars: the area each pass removes, left and right of the tip; passes after `shown` as outlines. */
export function drawSplit(split: { left: number; right: number }[], narrow: boolean, T: IText, shown: number, dec: (s: string) => string, fresh = 1) {
  const W = narrow ? 360 : 250, H = narrow ? 190 : 270, L = 40, R = 8, top = 34, bot = H - 30;
  const n = split.length, max = Math.max(...split.map((s) => s.left + s.right)) * 1.12;
  const step = niceStep(max / 4), ys = (v: number) => bot - (v / max) * (bot - top);
  const bw = Math.min(16, ((W - L - R) / n) * 0.62), xs = (i: number) => L + ((i + 0.5) / n) * (W - L - R);
  const o: string[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) {
    o.push(`<line x1="${L}" x2="${W - R}" y1="${f(ys(v))}" y2="${f(ys(v))}" class="tt-grid"/>`);
    o.push(`<text x="${L - 5}" y="${f(ys(v) + 3.5)}" text-anchor="end" class="tt-t s">${dec(v.toFixed(step < 0.01 ? 3 : 2))}</text>`);
  }
  o.push(`<text x="${L - 5}" y="${top - 10}" text-anchor="end" class="tt-t s">${T.mm2}</text>`);
  split.forEach((s, i) => {
    const x = xs(i) - bw / 2, on = i < shown;
    const g = i === shown - 1 ? fresh : 1, yl = ys(s.left * g), yr = ys((s.left + s.right) * g);
    if (on) {
      o.push(`<rect x="${f(x)}" y="${f(yl)}" width="${f(bw)}" height="${f(bot - yl)}" class="tt-bl"/>`);
      o.push(`<rect x="${f(x)}" y="${f(yr)}" width="${f(bw)}" height="${f(yl - yr)}" class="tt-br"/>`);
      if (g < 1) o.push(`<rect x="${f(x)}" y="${f(ys(s.left + s.right))}" width="${f(bw)}" height="${f(yr - ys(s.left + s.right))}" class="tt-ghost"/>`);
    } else o.push(`<rect x="${f(x)}" y="${f(yr)}" width="${f(bw)}" height="${f(bot - yr)}" class="tt-ghost"/>`);
    o.push(`<rect x="${f(xs(i) - bw / 2)}" y="${bot + 5}" width="${f(bw)}" height="4" rx="1" fill="${passColor(i, n)}" opacity="${on ? 1 : 0.35}"/>`);
    if (n <= 8 || i % 2 === 0) o.push(`<text x="${f(xs(i))}" y="${bot + 21}" text-anchor="middle" class="tt-t s">${i + 1}</text>`);
  });
  o.push(`<rect x="${L}" y="8" width="9" height="9" class="tt-bl"/><text x="${L + 13}" y="16" class="tt-t s">${T.left}</text>`);
  const rx = L + (narrow ? 150 : 104);
  o.push(`<rect x="${rx}" y="8" width="9" height="9" class="tt-br"/><text x="${rx + 13}" y="16" class="tt-t s">${T.right}</text>`);
  return { W, H, svg: o.join('') };
}
function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / p;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
}

/* ---------- pass schedules ---------- */
export const RULES: Rule[] = ['iscar', 'sqrt', 'const'];
export const RULE_COLOR: Record<Rule, string> = { iscar: '#e2601a', sqrt: '#2a78d6', const: '#8b52c9' };
/** Three V sections side by side, one per rule, the passes drawn as bands (each band coloured by its pass). */
export function drawRings(cums: number[][], labels: string[], narrow: boolean, dec: (s: string) => string, grow = 1, fl = ['first', 'last']) {
  const W = narrow ? 360 : 640, H = narrow ? 226 : 220, top = narrow ? 62 : 40, bot = H - 16;
  const ap = cums[0][cums[0].length - 1], k = (bot - top) / ap, cw = W / 3;
  const o: string[] = [];
  cums.forEach((cum, r) => {
    const cx = cw * (r + 0.5), n = cum.length;
    const hw = Math.min(cw / 2 - 10, ap * k * Math.tan(Math.PI / 6));
    const sx = hw / (ap * k * Math.tan(Math.PI / 6));                 // narrow: squeeze the V sideways, not its depth
    o.push(`<rect x="${f(cx - cw / 2 + 6)}" y="${top}" width="${f(cw - 12)}" height="${bot - top + 8}" class="tr-work"/>`);
    const shown = Math.max(0, Math.min(n, Math.ceil(grow * n - 1e-9)));
    for (let i = n - 1; i >= 0; i--) {
      if (i >= shown) continue;
      const prev = i ? cum[i - 1] : 0, fr = grow >= 1 || i < shown - 1 ? 1 : Math.max(0, Math.min(1, grow * n - i));
      const d = (prev + (cum[i] - prev) * fr) * k, w = d * Math.tan(Math.PI / 6) * sx;
      o.push(`<path d="M${f(cx - w)},${top} L${f(cx)},${f(top + d)} L${f(cx + w)},${top} Z" fill="${passColor(i, n)}" class="tr-band"/>`);
    }
    o.push(`<path d="M${f(cx - hw)},${top} L${f(cx)},${f(bot)} L${f(cx + hw)},${top}" class="tr-final"/>`);
    o.push(`<line x1="${f(cx - cw / 2 + 6)}" x2="${f(cx + cw / 2 - 6)}" y1="${top}" y2="${top}" class="tr-crest"/>`);
    const first = `${fl[0]} ${dec(cum[0].toFixed(2))}`, last = `${fl[1]} ${dec((cum[n - 1] - (n > 1 ? cum[n - 2] : 0)).toFixed(2))} mm`;
    if (narrow) {
      o.push(`<text x="${f(cx)}" y="${top - 40}" text-anchor="middle" class="tr-t h" style="fill:${RULE_COLOR[RULES[r]]}">${labels[r]}</text>`);
      o.push(`<text x="${f(cx)}" y="${top - 23}" text-anchor="middle" class="tr-t s">${first}</text><text x="${f(cx)}" y="${top - 9}" text-anchor="middle" class="tr-t s">${last}</text>`);
    } else {
      o.push(`<text x="${f(cx)}" y="${top - 22}" text-anchor="middle" class="tr-t h" style="fill:${RULE_COLOR[RULES[r]]}">${labels[r]}</text>`);
      o.push(`<text x="${f(cx)}" y="${top - 8}" text-anchor="middle" class="tr-t s">${first} · ${last}</text>`);
    }
  });
  return { W, H, svg: o.join('') };
}
/** Chip area per pass for the three rules (lines with dots). */
export function drawAreas(areas: number[][], narrow: boolean, T: { x: string; y: string }, dec: (s: string) => string) {
  const W = narrow ? 360 : 640, H = narrow ? 170 : 180, L = 46, R = 12, top = 24, bot = H - 30;
  const n = areas[0].length, max = Math.max(...areas.flat()) * 1.1;
  const step = niceStep(max / 3), xs = (i: number) => L + (n > 1 ? (i / (n - 1)) : 0.5) * (W - L - R), ys = (v: number) => bot - (v / max) * (bot - top);
  const o: string[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) {
    o.push(`<line x1="${L}" x2="${W - R}" y1="${f(ys(v))}" y2="${f(ys(v))}" class="tr-grid"/>`);
    o.push(`<text x="${L - 5}" y="${f(ys(v) + 3.5)}" text-anchor="end" class="tr-t s">${dec(v.toFixed(step < 0.01 ? 3 : 2))}</text>`);
  }
  for (let i = 0; i < n; i++) if (n <= 12 || i % 2 === 0) o.push(`<text x="${f(xs(i))}" y="${bot + 15}" text-anchor="middle" class="tr-t s">${i + 1}</text>`);
  o.push(`<text x="6" y="${top - 6}" class="tr-t s">${T.y}</text><text x="${W - R}" y="${H - 3}" text-anchor="end" class="tr-t s">${T.x}</text>`);
  areas.forEach((a, r) => {
    const c = RULE_COLOR[RULES[r]];
    o.push(`<path d="M${a.map((v, i) => `${f(xs(i))},${f(ys(v))}`).join(' L')}" class="tr-line" stroke="${c}"/>`);
    a.forEach((v, i) => o.push(`<circle cx="${f(xs(i))}" cy="${f(ys(v))}" r="3" fill="${c}" class="tr-dot"/>`));
  });
  return { W, H, svg: o.join('') };
}

/* ---------- helix gauge and chart ---------- */
export interface HText { std: string; approx: string; deg: string; d: string; phi: string; pLab: string }
const GMAX = 6;
/** A dial from 0° to 6°: the helix angle φ (needle), Hoffmann's 20·P/D (small mark), the standard 1.5° shim. */
export function drawGauge(phi: number, approx: number, T: HText, dec: (s: string) => string, narrow: boolean) {
  const W = narrow ? 360 : 300, H = narrow ? 214 : 230, cx = W / 2, cy = narrow ? 184 : 192, R = narrow ? 128 : 124;
  const ang = (v: number) => Math.PI * (1 - Math.min(Math.max(v, 0), GMAX + 0.3) / GMAX);   // 0° left, 6° right
  const P = (v: number, r: number) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const arc = (a: number, b: number, r: number) => { const [x1, y1] = P(a, r), [x2, y2] = P(b, r); return `M${f(x1)},${f(y1)} A${r},${r} 0 0 1 ${f(x2)},${f(y2)}`; };
  const o: string[] = [];
  o.push(`<path d="${arc(0, GMAX, R)}" class="hx-track"/>`);
  const lo = Math.min(phi, 1.5), hi = Math.max(phi, 1.5);
  if (hi - lo > 0.02) o.push(`<path d="${arc(lo, Math.min(hi, GMAX + 0.3), R)}" class="hx-gap"/>`);
  for (let v = 0; v <= GMAX + 1e-9; v += 0.5) {
    const major = Math.abs(v - Math.round(v)) < 1e-9, [x1, y1] = P(v, R - (major ? 14 : 8)), [x2, y2] = P(v, R);
    o.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="hx-tick"/>`);
    if (major) { const [tx, ty] = P(v, R - 26); o.push(`<text x="${f(tx)}" y="${f(ty + 4)}" text-anchor="middle" class="hx-t s">${v}°</text>`); }
  }
  // the standard shim
  { const [x1, y1] = P(1.5, R + 2), [x2, y2] = P(1.5, R + 16), [tx, ty] = P(1.5, R + 24);
    o.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="hx-std"/>`); void tx; void ty; }
  // legend, top
  o.push(`<rect x="10" y="9" width="4" height="10" class="hx-k std"/><text x="19" y="18" class="hx-t std">${dec('1.5')}° ${T.std}</text>`);
  o.push(`<rect x="${W - 14}" y="9" width="4" height="10" class="hx-k apx"/><text x="${W - 19}" y="18" text-anchor="end" class="hx-t apx">20·P/D</text>`);
  // Hoffmann's approximation
  { const [x1, y1] = P(approx, R - 4), [x2, y2] = P(approx, R + 10);
    o.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="hx-apx"/>`); }
  // needle
  const [nx, ny] = P(phi, R - 6);
  o.push(`<line x1="${cx}" y1="${cy}" x2="${f(nx)}" y2="${f(ny)}" class="hx-needle"/><circle cx="${cx}" cy="${cy}" r="6" class="hx-hub"/>`);
  o.push(`<text x="${cx}" y="${cy - 34}" text-anchor="middle" class="hx-t big">φ = ${dec(phi.toFixed(2))}°</text>`);
  o.push(`<text x="${cx}" y="${cy - 16}" text-anchor="middle" class="hx-t apx">20·P/D ≈ ${dec(approx.toFixed(2))}°</text>`);
  if (phi > GMAX) o.push(`<text x="${W - 8}" y="${cy + 18}" text-anchor="end" class="hx-t s">&gt; ${GMAX}°</text>`);
  return { W, H, svg: o.join('') };
}
/** φ against the major diameter (log scale, 3–200 mm) for several pitches; the chosen pitch bold, its point marked. */
export const HX_PITCHES = [0.5, 1, 1.5, 2, 3, 4, 6];
export function drawHelixChart(d: number, P: number, starts: number, T: HText, dec: (s: string) => string, narrow: boolean) {
  const W = narrow ? 360 : 340, H = narrow ? 200 : 230, L = 34, R = 12, top = 14, bot = H - 30;
  const d0 = 3, d1 = 200, xs = (v: number) => L + (Math.log(v / d0) / Math.log(d1 / d0)) * (W - L - R), ys = (v: number) => bot - (Math.min(v, GMAX) / GMAX) * (bot - top);
  const o: string[] = [];
  for (let v = 0; v <= GMAX; v++) { o.push(`<line x1="${L}" x2="${W - R}" y1="${f(ys(v))}" y2="${f(ys(v))}" class="hx-grid"/><text x="${L - 5}" y="${f(ys(v) + 3.5)}" text-anchor="end" class="hx-t s">${v}°</text>`); }
  [3, 5, 10, 20, 50, 100, 200].forEach((v) => o.push(`<text x="${f(xs(v))}" y="${bot + 14}" text-anchor="middle" class="hx-t s">${v}</text>`));
  o.push(`<text x="${W - R}" y="${H - 3}" text-anchor="end" class="hx-t s">${T.d}</text>`);
  o.push(`<line x1="${L}" x2="${W - R}" y1="${f(ys(1.5))}" y2="${f(ys(1.5))}" class="hx-stdl"/>`);
  const curve = (p: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const v = d0 * Math.pow(d1 / d0, i / 60);
      if (v < 5 * p) continue;                                       // plotted only where d ≥ 5 P
      pts.push(`${f(xs(v))},${f(ys(helix(p, pitchD(v, p), starts)))}`);
    }
    return pts;
  };
  const list = HX_PITCHES.includes(P) ? HX_PITCHES : [...HX_PITCHES, P].sort((a, b) => a - b);
  // curves; labels at each curve's upper (left) end, the chosen pitch first, others only where they do not collide
  const labs: { x: number; y: number; w: number; t: string; on: boolean }[] = [];
  const cand: typeof labs = [];
  list.forEach((p) => {
    const pts = curve(p); if (pts.length < 2) return;
    const on = Math.abs(p - P) < 1e-9;
    o.push(`<path d="M${pts.join(' L')}" class="hx-c${on ? ' on' : ''}"/>`);
    const [lx, ly] = pts[0].split(',').map(Number), t = dec(String(p));
    cand.push({ x: lx + 3, y: Math.max(top + 9, ly - 5), w: t.length * 6.4, t, on });
  });
  cand.sort((a, b) => Number(b.on) - Number(a.on)).forEach((c) => {
    if (labs.some((l) => c.x < l.x + l.w + 4 && l.x < c.x + c.w + 4 && Math.abs(l.y - c.y) < 12)) return;
    labs.push(c);
    o.push(`<text x="${f(c.x)}" y="${f(c.y)}" class="hx-t s${c.on ? ' on' : ''}">${c.t}</text>`);
  });
  o.push(`<text x="${W - R}" y="${top + 4}" text-anchor="end" class="hx-t s">${T.pLab}</text>`);
  const phi = helix(P, pitchD(d, P), starts);
  o.push(`<circle cx="${f(xs(Math.min(Math.max(d, d0), d1)))}" cy="${f(ys(phi))}" r="5" class="hx-dot"/>`);
  return { W, H, svg: o.join('') };
}
