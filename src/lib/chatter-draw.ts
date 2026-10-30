/**
 * Drawing for the regenerative-chatter figure: the surface unrolled, the tool riding on a spring, the wave the
 * previous pass left (outer) and the wave this pass cuts (inner), the chip between them, and the chip thickness
 * at the edge traced underneath. Model in chatter.ts: h = h_m + y₀ − y, y = A·sin t, y₀ = A·sin(t − ε).
 */
import { chip, swing, lobe, boundary, pocketRpm, blimCrit, type Sys } from './chatter';

export interface RText { prev: string; now: string; chip: string; h: string; trace: string; mean: string; eps: string; spring: string; uncut: string }
const f1 = (v: number) => v.toFixed(1);

export function drawRegen(epsDeg: number, u: number, T: RText, narrow: boolean) {
  const W = narrow ? 360 : 640, H = narrow ? 334 : 316;
  const x0 = narrow ? 14 : 30, x1 = W - (narrow ? 14 : 30);
  const waves = narrow ? 2 : 3, A = narrow ? 11 : 13, hm = narrow ? 28 : 32;
  const yBase = narrow ? 150 : 140;                       // mean height of the surface being cut
  const eps = (epsDeg * Math.PI) / 180;
  const T2 = waves * 2 * Math.PI;
  const X = (t: number) => x0 + ((x1 - x0) * t) / T2;
  const tTool = Math.max(0.0001, Math.min(T2, u * T2));
  const xT = X(tTool);
  const yNow = (t: number) => yBase - A * Math.sin(t);
  const yPrev = (t: number) => yBase - hm - A * Math.sin(t - eps);
  const N = 160;
  const pts = (fn: (t: number) => number, ta: number, tb: number) => {
    const out: string[] = [];
    for (let i = 0; i <= N; i++) { const t = ta + ((tb - ta) * i) / N; out.push(`${f1(X(t))},${f1(fn(t))}`); }
    return out;
  };
  const yBot = yBase + 46;
  // workpiece: cut surface left of the tool, the previous surface to its right
  const cut = pts(yNow, 0, tTool), ahead = pts(yPrev, tTool, T2);
  const work = `M${f1(x0)},${yBot} L${cut.join(' L')} L${f1(xT)},${f1(yPrev(tTool))} L${ahead.join(' L')} L${f1(x1)},${yBot} Z`;
  // the layer still to come off: between the previous surface and the inner wave, right of the tool
  const layer = `M${pts(yPrev, tTool, T2).join(' L')} L${pts(yNow, tTool, T2).reverse().join(' L')} Z`;
  const innerAhead = pts(yNow, tTool, T2).join(' ');
  const prevBehind = pts(yPrev, 0, tTool).join(' ');
  // tool: tip on the inner wave, rake face facing the material ahead, on a spring hung from the holder
  const tipY = yNow(tTool);
  const tool = `M${f1(xT)},${f1(tipY)} L${f1(xT - 5)},${f1(tipY - 54)} L${f1(xT - 46)},${f1(tipY - 54)} L${f1(xT - 46)},${f1(tipY - 8)} Z`;
  const yHold = narrow ? 30 : 22, sx = xT - 26, top = tipY - 54;
  const coils = 6, sp: string[] = [`${f1(sx)},${yHold}`, `${f1(sx)},${yHold + 6}`];
  const span = top - 6 - (yHold + 6);
  for (let i = 0; i < coils; i++) sp.push(`${f1(sx + (i % 2 ? -7 : 7))},${f1(yHold + 6 + (span * (i + 0.5)) / coils)}`);
  sp.push(`${f1(sx)},${f1(top - 6)}`, `${f1(sx)},${f1(top)}`);
  // chip leaving the rake face: a curl whose thickness follows h at the edge
  const c = chip(eps, hm, A, tTool), h = c.h;
  const th = Math.max(3, h * 0.42);
  const chipPath = `M${f1(xT + 1)},${f1(tipY - 2)} C${f1(xT + 6)},${f1(tipY - 30)} ${f1(xT + 30)},${f1(tipY - 62)} ${f1(xT + 52)},${f1(tipY - 52)} L${f1(xT + 52 - th * 0.5)},${f1(tipY - 52 + th)} C${f1(xT + 30)},${f1(tipY - 58 + th)} ${f1(xT + 6 + th)},${f1(tipY - 30)} ${f1(xT + 1 + th)},${f1(tipY - 2)} Z`;
  // phase marker: a crest of the inner wave and the crest of the outer wave that follows it
  const kC = 1, tCrestNow = Math.PI / 2 + kC * 2 * Math.PI, tCrestPrev = tCrestNow + eps;
  const xa = X(tCrestNow), xb = X(Math.min(T2, tCrestPrev));
  // trace of h under the figure
  const ty0 = yBot + (narrow ? 40 : 38), tyH = narrow ? 78 : 72, tyMid = ty0 + tyH / 2;
  const sc = (tyH / 2 - 4) / (2 * A);
  const tracePts: string[] = [];
  for (let i = 0; i <= N; i++) { const t = (tTool * i) / N; tracePts.push(`${f1(X(t))},${f1(tyMid - (chip(eps, hm, A, t).h - hm) * sc)}`); }
  const sw = swing(eps, A);
  const dot = { x: xT, y: tyMid - (h - hm) * sc };
  const svg = `
  <rect x="${x0}" y="${ty0}" width="${x1 - x0}" height="${tyH}" rx="6" class="cr-panel"/>
  <line x1="${x0}" x2="${x1}" y1="${f1(tyMid)}" y2="${f1(tyMid)}" class="cr-mean"/>
  <line x1="${x0}" x2="${x1}" y1="${f1(tyMid - sw * sc)}" y2="${f1(tyMid - sw * sc)}" class="cr-band"/>
  <line x1="${x0}" x2="${x1}" y1="${f1(tyMid + sw * sc)}" y2="${f1(tyMid + sw * sc)}" class="cr-band"/>
  <polyline points="${tracePts.join(' ')}" class="cr-trace"/>
  <circle cx="${f1(dot.x)}" cy="${f1(dot.y)}" r="4" class="cr-dot"/>
  <text x="${x0}" y="${ty0 - 8}" class="cr-t s">${T.trace}</text>
  <text x="${x1 - 8}" y="${f1(tyMid - 4)}" class="cr-t s" text-anchor="end">${T.mean}</text>
  <path d="${work}" class="cr-work"/>
  <path d="${layer}" class="cr-layer"/>
  <polyline points="${prevBehind}" class="cr-ghost"/>
  <polyline points="${innerAhead}" class="cr-future"/>
  <polyline points="${cut.join(' ')}" class="cr-now"/>
  <polyline points="${ahead.join(' ')}" class="cr-prev"/>
  <line x1="${x0}" x2="${x1}" y1="${yHold}" y2="${yHold}" class="cr-hold"/>
  <polyline points="${sp.join(' ')}" class="cr-spring"/>
  <path d="${chipPath}" class="cr-chip"/>
  <path d="${tool}" class="cr-tool"/>
  <line x1="${f1(xT + 10)}" x2="${f1(xT + 10)}" y1="${f1(yPrev(tTool) + 2)}" y2="${f1(tipY - 2)}" class="cr-h" marker-start="url(#cr-a)" marker-end="url(#cr-a)"/>
  <text x="${f1(xT + 16)}" y="${f1((yPrev(tTool) + tipY) / 2 + 4)}" class="cr-t h">${T.h}</text>
  ${xb > xa + 6 && xb < x1 - 4 ? `<line x1="${f1(xa)}" x2="${f1(xa)}" y1="${f1(yNow(tCrestNow) + 4)}" y2="${f1(yBase + 30)}" class="cr-tick"/>
  <line x1="${f1(xb)}" x2="${f1(xb)}" y1="${f1(yPrev(tCrestPrev) - 4)}" y2="${f1(yBase + 30)}" class="cr-tick p"/>
  <line x1="${f1(xa)}" x2="${f1(xb)}" y1="${yBase + 26}" y2="${yBase + 26}" class="cr-eps" marker-end="url(#cr-ae)"/>
  <text x="${f1((xa + xb) / 2)}" y="${yBase + 42}" class="cr-t e" text-anchor="middle">${T.eps}</text>` : ''}
  <text x="${f1(x0 + 6)}" y="${yHold - 6}" class="cr-t s">${T.spring}</text>`;
  return { svg, W, H, h, sw };
}


export interface LText { x: string; y: string; stable: string; chatter: string; crit: string }
export interface LGeom { W: number; H: number; X0: number; X1: number; Y0: number; Y1: number; nMin: number; nMax: number; bMax: number }
export interface LRange { nMin: number; nMax: number; bMax: number; ticks: number[]; ticksNarrow: number[] }
export const lobeGeom = (narrow: boolean, r: LRange): LGeom => narrow
  ? { W: 360, H: 300, X0: 44, X1: 348, Y0: 252, Y1: 16, nMin: r.nMin, nMax: r.nMax, bMax: r.bMax }
  : { W: 640, H: 330, X0: 58, X1: 622, Y0: 290, Y1: 22, nMin: r.nMin, nMax: r.nMax, bMax: r.bMax };

/** The stability lobe chart for system s: areas, lobes, boundary, pocket lines, axes, and the point group. */
export function drawLobes(s: Sys, rg: LRange, narrow: boolean, T: LText, dec: (v: string) => string, grp: (v: number) => string, n0: number, b0: number, uid: string) {
  const g = lobeGeom(narrow, rg), { W, H, X0, X1, Y0, Y1, nMin, nMax, bMax } = g;
  const X = (n: number) => X0 + ((X1 - X0) * (n - nMin)) / (nMax - nMin);
  const Y = (b: number) => Y0 - ((Y0 - Y1) * Math.min(b, bMax * 1.02)) / bMax;
  const lobes = Array.from({ length: 16 }, (_, N) => lobe(N, s, 4 * s.fn, 900));
  const bd: string[] = [];
  for (let i = 0; i <= 700; i++) { const n = nMin + ((nMax - nMin) * i) / 700; bd.push(`${f1(X(n))},${f1(Y(boundary(n, lobes).b))}`); }
  const line = bd.join(' L');
  const lobePaths = lobes.map((L) => {
    const pts = L.filter((p) => p.rpm >= nMin * 0.95 && p.rpm <= nMax * 1.05 && p.b < bMax * 1.5);
    return pts.length > 1 ? `<path d="M${pts.map((p) => `${f1(X(p.rpm))},${f1(Y(p.b))}`).join(' L')}" class="lobe"/>` : '';
  }).join('');
  const pockets = Array.from({ length: 16 }, (_, N) => ({ N, n: pocketRpm(N, s) })).filter((p) => p.n >= nMin && p.n <= nMax);
  // label the pocket lines from the right (N = 0) leftwards while there is room
  let lastX = 1e9;
  const pkLabels = pockets.map((p) => { const x = X(p.n); if (lastX - x < (narrow ? 30 : 40)) return ''; lastX = x; return `<text x="${f1(x - 3)}" y="${Y1 + 12}" text-anchor="end" class="pkl">N=${p.N}</text>`; }).join('');
  const xt = narrow ? rg.ticksNarrow : rg.ticks;
  const yt = Array.from({ length: Math.floor(bMax) + 1 }, (_, i) => i);
  const crit = blimCrit(s);
  const fs = narrow ? 'n' : 'w';
  const svg = `
  <defs><clipPath id="${uid}"><rect x="${X0}" y="${Y1}" width="${X1 - X0}" height="${Y0 - Y1}"/></clipPath></defs>
  <g clip-path="url(#${uid})">
    <path d="M${X0},${Y1} L${line} L${X1},${Y1} Z" class="un"/>
    <path d="M${X0},${Y0} L${line} L${X1},${Y0} Z" class="st"/>
    ${yt.map((b) => `<line x1="${X0}" x2="${X1}" y1="${f1(Y(b))}" y2="${f1(Y(b))}" class="gl"/>`).join('')}
    ${lobePaths}
    <line x1="${X0}" x2="${X1}" y1="${f1(Y(crit))}" y2="${f1(Y(crit))}" class="crit"/>
    <path d="M${line}" class="bd" pathLength="1"/>
    ${pockets.map((p) => `<line x1="${f1(X(p.n))}" x2="${f1(X(p.n))}" y1="${Y0}" y2="${Y1}" class="pk"/>`).join('')}
  </g>
  <line x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}" class="ax"/>
  <line x1="${X0}" x2="${X0}" y1="${Y0}" y2="${Y1}" class="ax"/>
  ${xt.map((n) => `<line x1="${f1(X(n))}" x2="${f1(X(n))}" y1="${Y0}" y2="${Y0 + 5}" class="ax"/><text x="${f1(X(n))}" y="${Y0 + 18}" text-anchor="${n === nMax ? 'end' : n === nMin ? 'start' : 'middle'}" class="tk ${fs}">${grp(n)}</text>`).join('')}
  ${yt.map((b) => `<text x="${X0 - 7}" y="${f1(Y(b) + 4)}" text-anchor="end" class="tk ${fs}">${b}</text>`).join('')}
  ${pkLabels}
  <text x="${X1 - 6}" y="${f1(Y(crit) + 15)}" text-anchor="end" class="critl ${fs}">b<tspan baseline-shift="sub" font-size="75%">lim,crit</tspan> ${dec(crit.toFixed(2))} mm${narrow ? '' : ` · ${T.crit}`}</text>
  <text x="${f1((X0 + X1) / 2)}" y="${H - 4}" text-anchor="middle" class="axl ${fs}">${T.x}</text>
  <text x="12" y="${f1((Y0 + Y1) / 2)}" text-anchor="middle" class="axl ${fs}" transform="rotate(-90 12 ${f1((Y0 + Y1) / 2)})">${T.y}</text>
  <text x="${X0 + 10}" y="${Y1 + 32}" class="zl un-t ${fs}">${T.chatter}</text>
  <text x="${X0 + 10}" y="${Y0 - 10}" class="zl st-t ${fs}">${T.stable}</text>
  <g data-pt>
    <line data-g="v" x1="${f1(X(n0))}" x2="${f1(X(n0))}" y1="${Y0}" y2="${f1(Y(b0))}" class="guide"/>
    <circle data-g="halo" cx="${f1(X(n0))}" cy="${f1(Y(b0))}" r="${narrow ? 11 : 13}" class="halo"/>
    <circle data-g="c" cx="${f1(X(n0))}" cy="${f1(Y(b0))}" r="${narrow ? 6 : 7}" class="pt"/>
  </g>`;
  return { svg, W, H };
}
