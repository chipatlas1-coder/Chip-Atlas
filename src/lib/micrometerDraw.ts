/**
 * Canvas drawings for the micrometer simulator: the whole instrument holding a part (overview) and the sleeve and
 * thimble scales magnified (close-up). Scale layout follows src/lib/micrometer.ts; the metal finishes, the frame
 * shape and the part shapes are drawn for legibility, not to any maker's design.
 */
import { SPECS, sleeveLabel, breakdown, fmtShort, type Spec, type Style, type Part, type Unit } from './micrometer';

export const COL = {
  base: '#445261', numbered: '#e2601a', lines: '#8b52c9', half: '#d99a0b', thimble: '#1e5fc4', hl: '#13998a',
};
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
const DISP = "'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif";
const ENG = '#15181c';
const SLEEVE: [number, string][] = [[0, '#59616a'], [0.16, '#a3acb4'], [0.4, '#e3e7ea'], [0.52, '#f1f3f5'], [0.66, '#ccd3d9'], [0.86, '#8b949c'], [1, '#4c535b']];
const THIMB: [number, string][] = [[0, '#4a5058'], [0.18, '#959da5'], [0.42, '#d7dde1'], [0.55, '#e6e9ec'], [0.7, '#bcc3c9'], [0.88, '#767e86'], [1, '#3d434a']];
const BEVEL: [number, string][] = [[0, '#41474e'], [0.3, '#a2aab1'], [0.5, '#ced4d8'], [0.72, '#9ba3aa'], [1, '#3a3f45']];

export interface View {
  unit: Unit;
  base: number;
  style: Style;
  /** displayed position, counts past the base (may be fractional while the thimble turns) */
  r: number;
  /** the reading the part sets (counts past the base), for the part's size */
  partC?: number;
  part?: Part | null;
  partAlpha?: number;
  reveal?: boolean;
  /** tutorial highlights: frame, upper, lower, numbers, thimble, datum, edge */
  hl?: string[];
  /** part names for the labelled overview (tutorial step 1) */
  names?: Record<string, string> | null;
  locale: 'en' | 'tr';
  /** 0…1, grows the reveal marks in */
  pop?: number;
}

export interface Anchors { thimble?: { x: number; y: number }; edge: number }

function setup(cv: HTMLCanvasElement) {
  const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: r.width, H: r.height };
}
const grad = (ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fs: number, anchor: 'center' | 'left' = 'center', ink = '#fff', k = 1) {
  ctx.save(); ctx.font = `600 ${fs}px ${MONO}`;
  const w = ctx.measureText(text).width + fs * 0.95, h = fs * 1.6;
  const left = anchor === 'left' ? x : x - w / 2;
  ctx.translate(left + w / 2, y); ctx.scale(k, k); ctx.translate(-(left + w / 2), -y);
  rr(ctx, left, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.shadowColor = 'rgba(21,34,48,.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1.5; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, left + w / 2, y + fs * 0.05);
  ctx.restore(); return { left, w, h };
}
const easeBack = (t: number) => { const c = 1.7; return t <= 0 ? 0 : t >= 1 ? 1 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/* ------------------------------------------------------------------ close-up ------------------------------------------------------------------ */
export function drawCloseup(cv: HTMLCanvasElement, v: View): Anchors {
  const s: Spec = SPECS[v.unit];
  const { ctx, W, H } = setup(cv);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grad(ctx, 0, H, [[0, '#f6f8fa'], [1, '#e2e8ee']]); ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(30,95,196,.06)'; ctx.lineWidth = 1;
  for (let x = 0.5; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0.5; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const hl = new Set(v.hl || []);
  const cy = Math.round(H * 0.5);
  const Rs = H * 0.235, r0 = Rs * 1.1, Rt = Math.min(Rs * 1.6, H * 0.44);
  const xe = Math.round(W * 0.6);
  const visC = s.unit === 'mm' ? 940 : 350;
  const pxC = s.unit === 'mm' ? Math.max(0.19, Math.min(0.46, (xe - 14) / visC)) : Math.max(0.56, Math.min(1.2, (xe - 14) / visC));
  const r = v.r;
  const X = (c: number) => xe + (c - r) * pxC;
  const bw = Math.max(24, Math.min(52, W * 0.075));
  const lw = Math.max(1.4, Math.min(2.6, pxC * s.line * (s.unit === 'mm' ? 0.07 : 0.11)));
  const xHub = X(-s.line * 2.4), sx0 = Math.max(xHub, -12);
  const fs = Math.round(Rs * 0.32);
  const pop = v.pop ?? 1;

  // frame hub at the zero end of the sleeve
  if (xHub > -12) {
    ctx.fillStyle = grad(ctx, cy - Rs * 1.9, cy + Rs * 1.9, [[0, '#5d6c7b'], [0.5, '#4a5866'], [1, '#3a4652']]);
    rr(ctx, -20, cy - Rs * 1.9, xHub + 20, Rs * 3.8, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(xHub - 2, cy - Rs * 1.9, 2, Rs * 3.8);
  }
  // sleeve
  ctx.fillStyle = grad(ctx, cy - Rs, cy + Rs, SLEEVE); ctx.fillRect(sx0, cy - Rs, xe + bw - sx0, 2 * Rs);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.lineWidth = 1;
  for (let i = 0; i < 34; i++) { const y = cy - Rs + (i + 0.5) * (2 * Rs / 34); ctx.strokeStyle = i % 3 ? '#000' : '#fff'; ctx.beginPath(); ctx.moveTo(sx0, y); ctx.lineTo(xe, y); ctx.stroke(); }
  ctx.restore();

  // tutorial bands behind the scales
  const band = (y0: number, y1: number) => { ctx.save(); ctx.fillStyle = 'rgba(19,153,138,.16)'; ctx.fillRect(sx0, y0, xe - sx0, y1 - y0); ctx.strokeStyle = 'rgba(19,153,138,.75)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(sx0 + 1, y0, xe - sx0 - 2, y1 - y0); ctx.restore(); };
  if (hl.has('upper') || hl.has('numbers')) band(cy - Rs + 2, cy - 1);
  if (hl.has('lower')) band(cy + 1, cy + Rs - 2);

  const engrave = (x0: number, y0: number, x1: number, y1: number, w: number, col = ENG) => {
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = w * 0.8; ctx.beginPath(); ctx.moveTo(x0 + 0.9, y0 + 0.9); ctx.lineTo(x1 + 0.9, y1 + 0.9); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  };
  const tall = Rs * 0.5, short = Rs * 0.36;
  const tick = (c: number) => (c % s.numbered === 0 ? tall : short);
  // index (datum) line
  engrave(sx0, cy, xe, cy, hl.has('datum') ? lw * 1.8 : lw, hl.has('datum') ? COL.hl : ENG);
  // main lines above the index line
  for (let c = 0; c <= s.span; c += s.line) { const x = X(c); if (x < sx0 - 2 || x > xe + 3) continue; engrave(x, cy, x, cy - tick(c), lw); }
  // half lines below (metric)
  if (s.half) for (let c = s.half; c < s.span; c += s.line) { const x = X(c); if (x < sx0 - 2 || x > xe + 3) continue; engrave(x, cy, x, cy + short, lw); }
  // numbers
  ctx.font = `600 ${fs}px ${DISP}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (let k = 0; k * s.numbered <= s.span; k++) {
    const x = X(k * s.numbered); if (x < sx0 - 30 || x > xe + 40) continue;
    const lab = sleeveLabel(s, v.base, v.style, k), y = cy - tall - fs * 0.28;
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillText(lab, x + 0.9, y + 0.9); ctx.fillStyle = hl.has('numbers') ? '#0b6f63' : ENG; ctx.fillText(lab, x, y);
  }

  // the answer, drawn into the scales
  const terms = v.reveal ? breakdown({ unit: v.unit, base: v.base, style: v.style, inC: Math.round(r), valC: 0 }) : [];
  const tm = Object.fromEntries(terms.map((t) => [t.kind, t]));
  const pf = Math.round(fs * 0.82);
  if (v.reveal) {
    const k = tm.numbered.n!, cNum = k * s.numbered;
    ctx.save(); ctx.globalAlpha = Math.min(1, pop * 1.4);
    ctx.shadowColor = 'rgba(226,96,26,.7)'; ctx.shadowBlur = 8;
    ctx.strokeStyle = COL.numbered; ctx.lineWidth = lw * 2.2; ctx.beginPath(); ctx.moveTo(X(cNum), cy); ctx.lineTo(X(cNum), cy - tall); ctx.stroke();
    ctx.shadowColor = 'rgba(139,82,201,.7)'; ctx.strokeStyle = COL.lines;
    for (let i = 1; i <= tm.lines.n!; i++) { const x = X(cNum + i * s.line); ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy - short); ctx.stroke(); }
    if (tm.half && tm.half.c) { ctx.shadowColor = 'rgba(217,154,11,.8)'; ctx.strokeStyle = COL.half; const x = X(cNum + tm.lines.n! * s.line + s.half); ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy + short); ctx.stroke(); }
    ctx.restore();
    // little counters on the further lines
    ctx.save(); ctx.globalAlpha = Math.min(1, pop * 1.4);
    for (let i = 1; i <= tm.lines.n!; i++) {
      const x = X(cNum + i * s.line), y = cy - short - pf * 0.85, rad = Math.min(pf * 0.62, s.line * pxC * 0.44) * easeBack(Math.min(1, pop * 1.6 - i * 0.12));
      if (rad <= 0) continue;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = COL.lines; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(pf * 0.78)}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i), x, y + 0.5);
    }
    ctx.restore();
  }
  // shadow of the thimble edge on the sleeve
  const sh = ctx.createLinearGradient(xe - 14, 0, xe, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.32)');
  ctx.fillStyle = sh; ctx.fillRect(xe - 14, cy - Rs, 14, 2 * Rs);

  // thimble body and knurl
  const D = s.rev, A = (2 * Math.PI) / D;
  const tDiv = ((r % D) + D) % D;
  ctx.fillStyle = grad(ctx, cy - Rt, cy + Rt, THIMB); ctx.fillRect(xe + bw - 1, cy - Rt, W - (xe + bw) + 4, 2 * Rt);
  const xk = xe + bw + Math.max(64, W * 0.16);
  if (xk < W) {
    ctx.save(); ctx.beginPath(); ctx.rect(xk, cy - Rt, W - xk, 2 * Rt); ctx.clip();
    ctx.fillStyle = 'rgba(10,12,15,.28)'; ctx.fillRect(xk, cy - Rt, W - xk, 2 * Rt);
    const pitch = Math.PI / 30, phase = -tDiv * A;
    for (const dir of [1, -1]) for (let j = -62; j <= 62; j++) {
      const a0 = j * pitch + phase; ctx.beginPath(); let on = false;
      for (let x = xk; x <= W + 6; x += 5) {
        let a = a0 + dir * (x - xk) / Rt; a = Math.atan2(Math.sin(a), Math.cos(a));
        if (Math.abs(a) < 1.5) { const y = cy - Rt * Math.sin(a); if (on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; } } else on = false;
      }
      ctx.strokeStyle = dir > 0 ? 'rgba(20,24,28,.5)' : 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore(); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(xk - 1, cy - Rt, 2, 2 * Rt);
  }
  // bevel carrying the graduations
  ctx.beginPath(); ctx.moveTo(xe, cy - r0); ctx.lineTo(xe + bw, cy - Rt); ctx.lineTo(xe + bw, cy + Rt); ctx.lineTo(xe, cy + r0); ctx.closePath();
  ctx.fillStyle = grad(ctx, cy - Rt, cy + Rt, BEVEL); ctx.fill();
  if (hl.has('thimble')) { ctx.save(); ctx.fillStyle = 'rgba(19,153,138,.22)'; ctx.fill(); ctx.restore(); }
  if (hl.has('edge')) { ctx.save(); ctx.strokeStyle = COL.hl; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xe, cy - r0 - 4); ctx.lineTo(xe, cy + r0 + 4); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xe, cy - r0); ctx.lineTo(xe, cy + r0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xe + bw, cy - Rt); ctx.lineTo(xe + bw, cy + Rt); ctx.stroke();

  const nx = xe + bw + bw * 0.55, span = 1.42;
  ctx.font = `600 ${fs}px ${DISP}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let k = Math.ceil(tDiv - span / A); k <= Math.floor(tDiv + span / A); k++) {
    const th = (k - tDiv) * A; if (Math.abs(th) > span) continue;
    const sn = Math.sin(th), cs = Math.cos(th);
    const lab = ((k % D) + D) % D, five = lab % 5 === 0;
    const y0 = cy - r0 * sn, y1 = cy - Rt * sn;
    ctx.globalAlpha = Math.min(1, cs * 1.6);
    const w = lw * (0.45 + 0.55 * cs);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = w * 0.8; ctx.beginPath(); ctx.moveTo(xe + 1, y0 + 0.9); ctx.lineTo(xe + bw, y1 + 0.9); if (five) ctx.lineTo(xe + bw + bw * 0.42, y1 + 0.9); ctx.stroke();
    ctx.strokeStyle = ENG; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(xe + 1, y0); ctx.lineTo(xe + bw, y1); if (five) ctx.lineTo(xe + bw + bw * 0.42, y1); ctx.stroke();
    if (five) { ctx.save(); ctx.translate(nx, y1); ctx.scale(1, Math.max(0.05, cs)); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillText(String(lab), 0.9, 0.9); ctx.fillStyle = ENG; ctx.fillText(String(lab), 0, 0); ctx.restore(); }
  }
  ctx.globalAlpha = 1;

  const out: Anchors = { edge: xe };
  if (v.reveal) {
    const kk = Math.round(tDiv) % D, th = (Math.round(tDiv) - tDiv) * A, y = cy - Rt * Math.sin(th), yy = cy - r0 * Math.sin(th);
    ctx.save(); ctx.globalAlpha = Math.min(1, pop * 1.4); ctx.shadowColor = 'rgba(30,95,196,.8)'; ctx.shadowBlur = 8; ctx.strokeStyle = COL.thimble; ctx.lineWidth = lw * 2;
    ctx.beginPath(); ctx.moveTo(xe + 1, yy); ctx.lineTo(xe + bw, y); ctx.lineTo(xe + bw + bw * 0.42, y); ctx.stroke(); ctx.restore();
    const k1 = easeBack(Math.min(1, pop * 1.5 - 0.2));
    const tp = pill(ctx, nx + fs * 1.7, y, String(kk).padStart(2, '0'), COL.thimble, pf, 'left', '#fff', k1);
    out.thimble = { x: tp.left + tp.w / 2, y };
    // numbered line pill above the sleeve
    const cNum = tm.numbered.n! * s.numbered;
    const lab = tm.numbered.label;
    ctx.font = `600 ${pf}px ${MONO}`; const pw = ctx.measureText(lab).width + pf * 0.95;
    let px = Math.min(X(cNum), xe - pw / 2 - 6); px = Math.max(px, pw / 2 + 6);
    const py = cy - Rs - pf * 1.3;
    ctx.save(); ctx.globalAlpha = Math.min(1, pop * 1.4); ctx.strokeStyle = 'rgba(226,96,26,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py + pf * 0.8); ctx.lineTo(X(cNum), cy - tall - fs * 1.1); ctx.stroke(); ctx.restore();
    pill(ctx, px, py, lab, COL.numbered, pf, 'center', '#fff', easeBack(Math.min(1, pop * 1.5)));
    if (tm.half && tm.half.c) {
      const hl2 = '+' + fmtShort(s, s.half, v.locale);
      ctx.font = `600 ${pf}px ${MONO}`; const hw = ctx.measureText(hl2).width + pf * 0.95;
      const xh = X(cNum + tm.lines.n! * s.line + s.half);
      let hx = Math.min(xh, xe - hw / 2 - 6); hx = Math.max(hx, hw / 2 + 6); const hy = cy + Rs + pf * 1.3;
      ctx.save(); ctx.globalAlpha = Math.min(1, pop * 1.4); ctx.strokeStyle = 'rgba(217,154,11,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx, hy - pf * 0.8); ctx.lineTo(xh, cy + short + 2); ctx.stroke(); ctx.restore();
      pill(ctx, hx, hy, hl2, COL.half, pf, 'center', '#1b1405', easeBack(Math.min(1, pop * 1.5 - 0.1)));
    }
    if (tm.base) pill(ctx, 10, 14 + pf, '+' + tm.base.label + ' ' + (v.unit === 'mm' ? 'mm' : 'in'), COL.base, pf, 'left', '#fff', easeBack(Math.min(1, pop * 1.5)));
  }
  return out;
}

/* ------------------------------------------------------------------ overview ------------------------------------------------------------------ */
function partHalf(type: Part, d: number, throat: number) {
  switch (type) {
    case 'hex': return d / Math.sqrt(3);
    case 'pin': return Math.min(Math.max(d * 0.75, 6), throat - 3);
    case 'block': return Math.min(4.5, throat - 3);
    case 'plate': return (throat - 3) * 0.8;
    default: return d / 2;
  }
}
function drawPart(ctx: CanvasRenderingContext2D, type: Part, d: number, throat: number, s: number) {
  const R = d / 2; ctx.lineWidth = 1 / s;
  switch (type) {
    case 'ball': { const g = ctx.createRadialGradient(-R * 0.32, -R * 0.38, R * 0.05, 0, 0, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#d6dce1'); g.addColorStop(0.7, '#7c858d'); g.addColorStop(1, '#3b4148'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); break; }
    case 'shaft': { const g = ctx.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.1, 0, 0, R); g.addColorStop(0, '#d4dade'); g.addColorStop(1, '#6b737b'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.16)'; for (let k = 0.2; k < 0.92; k += 0.09) { ctx.beginPath(); ctx.arc(0, 0, R * k, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#2a2f35'; ctx.beginPath(); ctx.arc(0, 0, Math.max(R * 0.08, 0.6), 0, Math.PI * 2); ctx.fill(); break; }
    case 'ring': { const g = ctx.createLinearGradient(0, -R, 0, R); g.addColorStop(0, '#e4e8eb'); g.addColorStop(0.5, '#a5adb4'); g.addColorStop(1, '#5d656c'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2, true); ctx.fill(); break; }
    case 'hex': { const a = d / Math.sqrt(3); const g = ctx.createLinearGradient(-R, -a, R, a); g.addColorStop(0, '#d9dee2'); g.addColorStop(1, '#646c74'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -a); ctx.lineTo(R, -a / 2); ctx.lineTo(R, a / 2); ctx.lineTo(0, a); ctx.lineTo(-R, a / 2); ctx.lineTo(-R, -a / 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); break; }
    case 'pin': { const h = partHalf('pin', d, throat); const g = ctx.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, '#5e666e'); g.addColorStop(0.35, '#e3e7ea'); g.addColorStop(0.6, '#b2bac1'); g.addColorStop(1, '#4c535a'); ctx.fillStyle = g; rr(ctx, -R, -h, d, 2 * h, Math.min(R * 0.5, 1.2)); ctx.fill(); break; }
    case 'block': { const h = partHalf('block', d, throat); const g = ctx.createLinearGradient(0, -h, 0, h); g.addColorStop(0, '#eef1f3'); g.addColorStop(0.5, '#b9c0c6'); g.addColorStop(1, '#7a838b'); ctx.fillStyle = g; rr(ctx, -R, -h, d, 2 * h, 0.6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke(); break; }
    case 'plate': { const h = partHalf('plate', d, throat); const g = ctx.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, '#59616a'); g.addColorStop(0.5, '#c5ccd2'); g.addColorStop(1, '#59616a'); ctx.fillStyle = g; ctx.fillRect(-R, -h, d, 2 * h); break; }
  }
}

export function drawOverview(cv: HTMLCanvasElement, v: View) {
  const s: Spec = SPECS[v.unit];
  const { ctx, W, H } = setup(cv);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grad(ctx, 0, H, [[0, '#ffffff'], [1, '#eef2f6']]); ctx.fillRect(0, 0, W, H);
  const hl = new Set(v.hl || []);
  const u = s.mmPerUnit, lenMm = s.rangeLen * u;
  const maxMm = (v.base + s.rangeLen) * u;
  const rMm = (v.r / s.q) * u, val = v.base * u + rMm;
  const partMm = v.partC != null ? ((v.base * s.q + v.partC) / s.q) * u : val;
  const xa = 10, xh = xa + maxMm + 3, hubW = 11, xs0 = xh + hubW + 3, sEnd = xs0 + lenMm + 2;
  const thL = 24, thR = 8.2, ratL = 10, ratR = 5.4;
  const throat = Math.max(20, maxMm * 0.55 + 6), ft = 9 + maxMm * 0.06;
  const L0 = -5, L1 = xs0 + lenMm + thL + ratL + 3;
  const ph = v.part ? partHalf(v.part, partMm, throat) : 0;
  const names = v.names;
  const top = Math.max(ph + 2, names ? 24 : 15), bot = throat + ft + (names ? 10 : 2);
  const pad = 10;
  const sc = Math.min((W - 2 * pad) / (L1 - L0), (H - 2 * pad) / (top + bot));
  const ox = (W - (L1 - L0) * sc) / 2 - L0 * sc, oy = (H - (top + bot) * sc) / 2 + top * sc;
  const xe = xs0 + rMm;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
  // frame (a C below the axis)
  const lx0 = -3, lx1 = 6;
  const Ri = Math.min(throat * 0.55, (xh - lx1) / 2 - 1), Ro = Math.min(Ri + ft * 0.9, (throat + ft + 7) / 2);
  ctx.beginPath();
  ctx.moveTo(lx0 + 2, -7.5); ctx.lineTo(lx1, -7.5);
  ctx.lineTo(lx1, throat - Ri); ctx.arcTo(lx1, throat, lx1 + Ri, throat, Ri);
  ctx.lineTo(xh - Ri, throat); ctx.arcTo(xh, throat, xh, throat - Ri, Ri);
  ctx.lineTo(xh, -9.5); ctx.lineTo(xh + hubW - 1.5, -9.5); ctx.arcTo(xh + hubW, -9.5, xh + hubW, -8, 1.5);
  ctx.lineTo(xh + hubW, throat + ft - Ro); ctx.arcTo(xh + hubW, throat + ft, xh + hubW - Ro, throat + ft, Ro);
  ctx.lineTo(lx0 + Ro, throat + ft); ctx.arcTo(lx0, throat + ft, lx0, throat + ft - Ro, Ro);
  ctx.lineTo(lx0, -5.5); ctx.arcTo(lx0, -7.5, lx0 + 2, -7.5, 2); ctx.closePath();
  ctx.fillStyle = grad(ctx, -10, throat + ft, [[0, '#62717f'], [0.55, '#4a5866'], [1, '#3b4753']]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.2 / sc; ctx.stroke();
  // spindle lock
  ctx.fillStyle = '#2f3a45'; rr(ctx, xh + 2.5, -13.5, 4.5, 4.5, 1); ctx.fill();
  ctx.fillStyle = '#7d8a97'; ctx.beginPath(); ctx.arc(xh + 4.75, -14, 2.2, 0, Math.PI * 2); ctx.fill();
  // anvil and spindle
  ctx.fillStyle = grad(ctx, -3.2, 3.2, [[0, '#6c737a'], [0.45, '#d0d5d9'], [1, '#50565c']]); ctx.fillRect(lx1, -3.2, xa - lx1, 6.4);
  ctx.fillStyle = grad(ctx, -3.2, 3.2, [[0, '#6c747c'], [0.4, '#e8ebee'], [1, '#525960']]); ctx.fillRect(xa + val, -3.2, xh - (xa + val), 6.4);
  // sleeve with its line
  ctx.fillStyle = grad(ctx, -5.4, 5.4, SLEEVE); ctx.fillRect(xh + hubW, -5.4, sEnd - (xh + hubW), 10.8);
  ctx.strokeStyle = ENG; ctx.lineWidth = Math.max(0.7 / sc, 0.18);
  ctx.beginPath(); ctx.moveTo(xh + hubW + 1, 0); ctx.lineTo(xe, 0);
  if (sc >= 2.2) for (let c = 0; c <= s.span; c += s.line) { const x = xs0 + (c / s.q) * u; if (x > xe) break; ctx.moveTo(x, 0); ctx.lineTo(x, c % s.numbered ? -1.6 : -2.4); }
  if (s.half && sc >= 3.6) for (let c = s.half; c < s.span; c += s.line) { const x = xs0 + (c / s.q) * u; if (x > xe) break; ctx.moveTo(x, 0); ctx.lineTo(x, 1.6); }
  ctx.stroke();
  // thimble and ratchet
  ctx.fillStyle = grad(ctx, -thR, thR, THIMB);
  ctx.beginPath(); ctx.moveTo(xe, -5.9); ctx.lineTo(xe + 2.4, -thR); ctx.lineTo(xe + thL, -thR); ctx.lineTo(xe + thL, thR); ctx.lineTo(xe + 2.4, thR); ctx.lineTo(xe, 5.9); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(xe + thL - 11, -thR, 11, 2 * thR); ctx.clip();
  ctx.strokeStyle = 'rgba(15,18,22,.42)'; ctx.lineWidth = 0.35;
  for (let k = -20; k < 30; k += 1.3) { ctx.beginPath(); ctx.moveTo(xe + thL - 11 + k, -thR); ctx.lineTo(xe + thL - 11 + k - 10, thR); ctx.moveTo(xe + thL - 11 + k - 10, -thR); ctx.lineTo(xe + thL - 11 + k, thR); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = grad(ctx, -ratR, ratR, THIMB); rr(ctx, xe + thL, -ratR, ratL, 2 * ratR, 1.5); ctx.fill();
  ctx.strokeStyle = 'rgba(15,18,22,.35)'; ctx.lineWidth = 0.3; ctx.beginPath(); for (let k = 1.5; k < ratL; k += 1.4) { ctx.moveTo(xe + thL + k, -ratR); ctx.lineTo(xe + thL + k, ratR); } ctx.stroke();
  // the part between anvil and spindle
  if (v.part && (v.partAlpha ?? 1) > 0) { ctx.save(); ctx.globalAlpha = v.partAlpha ?? 1; ctx.translate(xa + partMm / 2, 0); drawPart(ctx, v.part, partMm, throat, sc); ctx.restore(); }
  // where the close-up looks
  if (!names) {
    const x0 = xe - 10.5, x1 = xe + 6.5, y0 = -thR - 2.4, y1 = thR + 2.4, c = Math.min(3, (x1 - x0) / 4);
    ctx.strokeStyle = 'rgba(226,96,26,.9)'; ctx.lineWidth = 1.4 / sc; ctx.beginPath();
    ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0); ctx.moveTo(x1 - c, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + c);
    ctx.moveTo(x1, y1 - c); ctx.lineTo(x1, y1); ctx.lineTo(x1 - c, y1); ctx.moveTo(x0 + c, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - c); ctx.stroke();
  }
  ctx.restore();
  // frame engraving: range and resolution
  let fz = Math.max(10.5, Math.min(16, ft * sc * 0.5));
  const cx = ox + ((lx0 + xh + hubW) / 2) * sc, cyy = oy + (throat + ft / 2) * sc;
  const uu = v.unit === 'mm' ? 'mm' : 'in';
  const rangeTxt = `${v.base}–${v.base + s.rangeLen} ${uu}`;
  const resTxt = `${fmtShort(s, 1, v.locale)} ${uu}`;
  ctx.textBaseline = 'middle';
  // keep the engraving on the frame's flat bottom
  const avail = Math.max(20, (xh + hubW - lx0 - 0.6 * Ro) * sc - 6);
  ctx.font = `600 ${fz}px ${MONO}`; let w1 = ctx.measureText(rangeTxt).width;
  ctx.font = `500 ${fz * 0.82}px ${MONO}`; let w2 = ctx.measureText(resTxt).width;
  if (w1 + fz * 1.2 + w2 > avail) {
    fz = Math.max(9, fz * avail / (w1 + fz * 1.2 + w2));
    ctx.font = `600 ${fz}px ${MONO}`; w1 = ctx.measureText(rangeTxt).width;
    ctx.font = `500 ${fz * 0.82}px ${MONO}`; w2 = ctx.measureText(resTxt).width;
  }
  const gap = fz * 1.2, tx = cx - (w1 + gap + w2) / 2;
  const frameMark = hl.has('frame') || (v.reveal && v.base > 0 && v.style === 'rel');
  if (frameMark) { ctx.save(); ctx.shadowColor = hl.has('frame') ? 'rgba(19,153,138,.8)' : 'rgba(255,255,255,.8)'; ctx.shadowBlur = 10; rr(ctx, tx - fz * 0.5, cyy - fz * 0.85, w1 + fz, fz * 1.7, fz * 0.85); ctx.strokeStyle = hl.has('frame') ? '#5fe0d0' : '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
  ctx.textAlign = 'left'; ctx.font = `600 ${fz}px ${MONO}`; ctx.fillStyle = 'rgba(244,247,250,.95)'; ctx.fillText(rangeTxt, tx, cyy + 0.5);
  ctx.font = `500 ${fz * 0.82}px ${MONO}`; ctx.fillStyle = 'rgba(244,247,250,.7)'; ctx.fillText(resTxt, tx + w1 + gap, cyy + 0.5);

  // part names with leader lines (tutorial)
  if (names) {
    const P = (x: number, y: number) => [ox + x * sc, oy + y * sc];
    const items: [string, number, number, number, number][] = [
      ['frame', lx0 + 1.5, throat * 0.12, -1, 1],
      ['anvil', (lx1 + xa) / 2, -3.2, -1, -1],
      ['spindle', (xa + val + xh) / 2, -3.2, 0, -1],
      ['lock', xh + 4.75, -16, 1, -1],
      ['sleeve', (xh + hubW + xe) / 2, 5.4, 0, 1],
      ['thimble', xe + thL * 0.55, thR, 0, 1],
      ['ratchet', xe + thL + ratL / 2, -ratR, 1, -1],
    ];
    const lf = Math.max(10.5, Math.min(13.5, W / 60));
    ctx.font = `600 ${lf}px ${DISP}`; ctx.textBaseline = 'middle';
    const placed: { x: number; y: number; w: number }[] = [];
    for (const [key, x, y, hx, vy] of items) {
      const txt = names[key]; if (!txt) continue;
      const [px, py] = P(x, y);
      let ly = vy < 0 ? Math.max(lf, oy - top * sc + lf * 0.2) : Math.min(H - lf * 0.8, py + lf * 2.4);
      const tw = ctx.measureText(txt).width;
      let lx = px + hx * 18 - (hx < 0 ? tw : hx > 0 ? 0 : tw / 2);
      lx = Math.max(4, Math.min(W - tw - 4, lx));
      for (const p of placed) if (Math.abs(p.y - ly) < lf * 1.3 && lx < p.x + p.w + 6 && lx + tw + 6 > p.x) ly += (vy < 0 ? 1 : -1) * lf * 1.35;
      placed.push({ x: lx, y: ly, w: tw });
      ctx.strokeStyle = 'rgba(19,153,138,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(lx + (hx < 0 ? tw : hx > 0 ? 0 : tw / 2), ly + (vy < 0 ? lf * 0.6 : -lf * 0.6)); ctx.stroke();
      ctx.fillStyle = '#13998a'; ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.92)'; rr(ctx, lx - 4, ly - lf * 0.7, tw + 8, lf * 1.4, 4); ctx.fill();
      ctx.fillStyle = '#0b5f56'; ctx.textAlign = 'left'; ctx.fillText(txt, lx, ly + 0.5);
    }
  }
}
