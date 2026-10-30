/**
 * Entering angle and the uncut chip in turning, plan view.
 * The main cutting edge runs at κr to the feed direction. In one revolution it sweeps the band
 * between the machined and the unmachined surface (depth of cut ap) over the feed fn, so the uncut
 * chip section is a parallelogram: thickness h = fn · sin κr normal to the edge, width
 * b = ap / sin κr along it, area A = ap · fn whatever κr is.
 * Shared by the component's first render (build time) and its script (live updates).
 */
export interface EnteringState { kr: number; fn: number; ap: number }
export interface EnteringText { feed: string; machined: string; unmachined: string; zoom: string; insert: string; work: string; h: string; b: string }

const DEG = Math.PI / 180;
const f1 = (v: number) => v.toFixed(1);
type Pt = { x: number; y: number };
const P = (p: Pt) => `${f1(p.x)},${f1(p.y)}`;

export function chipOf(s: EnteringState) {
  const sk = Math.sin(s.kr * DEG);
  return { h: s.fn * sk, b: s.ap / sk, A: s.ap * s.fn };
}

/** SVG markup (inner) for one layout; uid keeps ids unique per figure and layout. */
export function drawEntering(s: EnteringState, T: EnteringText, narrow: boolean, dec: (v: string) => string, uid: string) {
  const id = `${uid}${narrow ? 'n' : 'w'}`;
  const W = narrow ? 360 : 660, H = narrow ? 452 : 262;
  const k = s.kr * DEG, ck = Math.cos(k), sk = Math.sin(k);
  // plan view: workpiece above (axis off the top), tool below, feed to the left
  const pv = narrow ? { x0: 10, x1: 350, top: 42, yM: 104, s: 36 } : { x0: 14, x1: 420, top: 38, yM: 104, s: 40 };
  const apPx = s.ap * pv.s, fPx = s.fn * pv.s;
  const yU = pv.yM + apPx;                                   // unmachined surface: larger radius, lower
  const tip: Pt = { x: narrow ? 186 : 236, y: pv.yM };
  const edgeLen = apPx / sk;
  const mainDir: Pt = { x: -ck, y: sk };                     // from the tip along the main edge
  const E: Pt = { x: tip.x + mainDir.x * edgeLen, y: yU };   // edge meets the unmachined surface
  // insert: main edge along tip→E and beyond, nose angle 80°, minor edge towards the machined side
  const ang = Math.atan2(mainDir.y, mainDir.x) - 80 * DEG;
  const minDir: Pt = { x: Math.cos(ang), y: Math.sin(ang) };
  const Lm = edgeLen + 30, Ln = 66;
  const a: Pt = { x: tip.x + mainDir.x * Lm, y: tip.y + mainDir.y * Lm };
  const c: Pt = { x: tip.x + minDir.x * Ln, y: tip.y + minDir.y * Ln };
  const d: Pt = { x: a.x + (c.x - tip.x), y: a.y + (c.y - tip.y) };
  const insert = `M${P(tip)} L${P(a)} L${P(d)} L${P(c)} Z`;
  // holder shank under the insert
  const ic: Pt = { x: (tip.x + d.x) / 2, y: (tip.y + d.y) / 2 };
  const sb = narrow ? Math.min(H + 2, ic.y + 96) : H + 2;
  const shank = `M${f1(ic.x - 26)},${f1(ic.y + 4)} L${f1(ic.x + 30)},${f1(ic.y + 4)} L${f1(ic.x + 30)},${f1(sb)} L${f1(ic.x - 26)},${f1(sb)} Z`;
  // chip: what the edge removes in the next revolution, between it and its position fn ahead
  const tf: Pt = { x: tip.x - fPx, y: tip.y }, Ef: Pt = { x: E.x - fPx, y: E.y };
  const chip = `M${P(tip)} L${P(tf)} L${P(Ef)} L${P(E)} Z`;
  const next = `M${P(tf)} L${P(Ef)}`;
  const work = `M${pv.x0},${pv.top} L${pv.x1},${pv.top} L${pv.x1},${pv.yM} L${P(tip)} L${P(E)} L${pv.x0},${f1(yU)} Z`;
  // κr arc between the feed direction (−x) and the edge
  const R = 24;
  const arc = `M${f1(tip.x - R)},${f1(tip.y)} A${R},${R} 0 0,0 ${f1(tip.x + mainDir.x * R)},${f1(tip.y + mainDir.y * R)}`;
  const lab: Pt = { x: tip.x - R - 8 - (ck > 0 ? fPx : 0), y: tip.y + 15 };

  // zoom: the chip rotated so the edge is horizontal, magnified
  const Z = narrow ? { cx: 180, cy: 336, r: 86, m: 3 } : { cx: 548, cy: 128, r: 98, m: 3.2 };
  const theta = Math.atan2(E.y - tip.y, E.x - tip.x) / DEG;
  const cc: Pt = { x: (tip.x + Ef.x) / 2, y: (tip.y + Ef.y) / 2 };
  const zt = `translate(${f1(Z.cx)} ${f1(Z.cy)}) scale(${Z.m}) rotate(${f1(-theta)}) translate(${f1(-cc.x)} ${f1(-cc.y)})`;
  const th = -theta * DEG, cth = Math.cos(th), sth = Math.sin(th);
  const zp = (p: Pt): Pt => { const dx = (p.x - cc.x) * Z.m, dy = (p.y - cc.y) * Z.m; return { x: Z.cx + dx * cth - dy * sth, y: Z.cy + dx * sth + dy * cth }; };
  const zchip = `M${P(zp(tip))} L${P(zp(tf))} L${P(zp(Ef))} L${P(zp(E))} Z`;
  const zedge = `M${P(zp(tip))} L${P(zp(E))}`;
  const znext = `M${P(zp(tf))} L${P(zp(Ef))}`;
  const { h, b } = chipOf(s);
  const hz = h * pv.s * Z.m, bz = b * pv.s * Z.m, skz = fPx * Z.m * ck;
  // in zoom coordinates the edge runs along y = Z.cy - hz/2 … the chip below it (thickness hz)
  const ey = Z.cy - hz / 2, half = bz / 2;
  const xr = Math.min(Z.cx + half, Z.cx + Z.r - 18), xl = Math.max(Z.cx - half, Z.cx - Z.r + 18);
  const hx = Math.min(Z.cx + half - Math.abs(skz) / 2 - 6, Z.cx + Z.r * 0.55);

  const o: string[] = [];
  o.push(`<defs>`);
  o.push(`<linearGradient id="${id}-wk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a8389" stop-opacity="0.15"/><stop offset="0.24" stop-color="#a5aeb6"/><stop offset="1" stop-color="#889299"/></linearGradient>`);
  o.push(`<clipPath id="${id}-zc"><circle cx="${Z.cx}" cy="${Z.cy}" r="${Z.r}"/></clipPath>`);
  o.push(`<linearGradient id="${id}-ins" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#666d72"/><stop offset="1" stop-color="#53575a"/></linearGradient>`);
  o.push(`<g id="${id}-ctx"><path d="${work}" fill="url(#${id}-wk)"/><path d="${shank}" class="ea-shank" vector-effect="non-scaling-stroke"/><path d="${insert}" fill="url(#${id}-ins)" class="ea-insert" vector-effect="non-scaling-stroke"/></g>`);
  o.push(`</defs>`);
  o.push(`<use href="#${id}-ctx"/>`);
  o.push(`<path d="${chip}" class="ea-chip"/><path d="${next}" class="ea-next"/><path d="M${P(tip)} L${P(E)}" class="ea-edge"/>`);
  o.push(`<path d="${arc}" class="ea-arc"/>`);
  o.push(`<text x="${f1(lab.x)}" y="${f1(lab.y)}" text-anchor="end" class="ea-t acc">κr ${Math.round(s.kr)}°</text>`);
  // feed arrow above the work, surface names in the air below each surface
  o.push(`<line x1="${pv.x0 + 128}" x2="${pv.x0 + 54}" y1="${pv.top - 18}" y2="${pv.top - 18}" class="ea-feed" marker-end="url(#ca-arr-data)"/>`);
  o.push(`<text x="${pv.x0 + 136}" y="${pv.top - 14}" class="ea-t dat">${T.feed} fn</text>`);
  o.push(`<text x="${pv.x0 + 4}" y="${f1(yU + 18)}" class="ea-t">${T.unmachined}</text>`);
  o.push(`<text x="${pv.x1 - 4}" y="${pv.yM + 18}" text-anchor="end" class="ea-t">${T.machined}</text>`);
  // ap dimension left of the chip
  const ax = Math.max(pv.x0 + 34, Math.min(E.x, tip.x) - fPx - 72);
  o.push(`<line x1="${f1(ax)}" x2="${f1(ax)}" y1="${pv.yM}" y2="${f1(yU)}" class="ea-dim" marker-start="url(#ca-arr)" marker-end="url(#ca-arr)"/>`);
  o.push(`<line x1="${f1(ax - 10)}" x2="${f1(tip.x)}" y1="${pv.yM}" y2="${pv.yM}" class="ea-ext"/>`);
  o.push(`<text x="${f1(ax - 7)}" y="${f1((pv.yM + yU) / 2 + 4)}" text-anchor="end" class="ea-t">ap</text>`);
  // zoom lens and leader
  o.push(`<line x1="${f1(cc.x)}" y1="${f1(cc.y)}" x2="${f1(Z.cx + (narrow ? 0 : -Z.r))}" y2="${f1(Z.cy + (narrow ? -Z.r : 0))}" class="ea-lead"/>`);
  o.push(`<circle cx="${f1(cc.x)}" cy="${f1(cc.y)}" r="6" class="ea-lens"/>`);
  o.push(`<circle cx="${Z.cx}" cy="${Z.cy}" r="${Z.r}" class="ea-zbg"/>`);
  o.push(`<g clip-path="url(#${id}-zc)"><use href="#${id}-ctx" transform="${zt}"/><path d="${zchip}" class="ea-zchip"/><path d="${znext}" class="ea-next"/><path d="${zedge}" class="ea-edge"/></g>`);
  o.push(`<circle cx="${Z.cx}" cy="${Z.cy}" r="${Z.r}" class="ea-zring"/>`);
  // h across the chip, normal to the edge; b along it
  o.push(`<line x1="${f1(hx)}" x2="${f1(hx)}" y1="${f1(ey)}" y2="${f1(ey + hz)}" class="ea-hdim" marker-start="url(#ca-arr-acc)" marker-end="url(#ca-arr-acc)"/>`);
  o.push(`<text x="${f1(hx)}" y="${f1(ey + hz + 17)}" text-anchor="middle" class="ea-t acc">h ${dec(h.toFixed(3))}</text>`);
  o.push(`<line x1="${f1(xl)}" x2="${f1(xr)}" y1="${f1(ey - 12)}" y2="${f1(ey - 12)}" class="ea-dim" ${xl > Z.cx - half ? '' : 'marker-start="url(#ca-arr)"'} ${xr < Z.cx + half ? '' : 'marker-end="url(#ca-arr)"'}/>`);
  o.push(`<text x="${Z.cx}" y="${f1(ey - 18)}" text-anchor="middle" class="ea-t">b ${dec(b.toFixed(2))}</text>`);
  o.push(`<text x="${f1(Z.cx - Z.r * 0.62)}" y="${f1(ey - 34)}" class="ea-t">${T.insert}</text>`);
  o.push(`<text x="${f1(Z.cx - Z.r * 0.62)}" y="${f1(ey + hz + 34)}" class="ea-t">${T.work}</text>`);
  o.push(`<text x="${Z.cx}" y="${f1(Z.cy + Z.r + 18)}" text-anchor="middle" class="ea-t mut">${T.zoom}</text>`);
  return { W, H, svg: o.join('') };
}
