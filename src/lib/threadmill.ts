/**
 * Thread milling: the helical tool path of Haas's example program O60023 (internal 1.5-8 UNC with a
 * Ø0.5 in multi-tooth thread mill, spindle M03) drawn in plan and in section, frame by frame; and the
 * feed arithmetic of the feed calculator.
 *
 * O60023 cutting blocks (inch), from the Haas G02/G03 reference:
 *   G01 Z-0.5156 F50.                 feed to starting depth (−0.5 minus 1/8 of the pitch)
 *   G41 X0.25 Y-0.25 F10. D01         cutter comp on
 *   G03 X0.5 Y0 I0 J0.25 Z-0.5        arc into the thread, ramps up 1/8 pitch
 *   I-0.5 J0 Z-0.375 F20.             full thread: one orbit, Z up one pitch
 *   X0.25 Y0.25 I-0.25 J0 Z-0.3594    arc out, ramps up 1/8 pitch
 * The return to the centre and the retract in the figure stand for the rest of the program
 * (ISCAR's steps 5–6, “rapid return”); they are not blocks of O60023. Haas's next block as printed,
 * G40 G01 X0 Y1, would drive the tool outward through the wall (X0 Y0 was evidently meant), so it is not drawn.
 */
export const P = 0.125;                       // pitch, in (8 TPI)
export const D = 1.5, d = 0.5;                // thread major Ø, cutter Ø (in)
export const RP = (D - d) / 2;                // tool-centre path radius (0.5)
export const RD = 0.675;                      // drilled hole radius, schematic (thread depth 0.075 in)
export const ZTOP = 0.1, Z0 = -0.5156, ZA = -0.5, ZB = -0.375, ZC = -0.3594;
const TAU = Math.PI * 2;

export type Phase = 'down' | 'line' | 'arcin' | 'full' | 'arcout' | 'back' | 'up' | 'hold';
export const PHASES: { k: Phase; dur: number }[] = [
  { k: 'down', dur: 1.1 }, { k: 'line', dur: 0.6 }, { k: 'arcin', dur: 0.9 }, { k: 'full', dur: 4.2 },
  { k: 'arcout', dur: 0.9 }, { k: 'back', dur: 0.6 }, { k: 'up', dur: 0.9 }, { k: 'hold', dur: 1.6 },
];
export const TOTAL = PHASES.reduce((a, p) => a + p.dur, 0);

export interface TState { phase: Phase; u: number; x: number; y: number; z: number; theta: number; spin: number; t: number }
const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
/** Tool state at time t (s) in the loop: centre (x, y) and Z of the lowest tooth, in inches; theta = orbit angle done (rad). */
export function stateAt(tIn: number): TState {
  const t = ((tIn % TOTAL) + TOTAL) % TOTAL;
  let acc = 0, ph = PHASES[0], u = 0;
  for (const p of PHASES) { if (t < acc + p.dur) { ph = p; u = (t - acc) / p.dur; break; } acc += p.dur; }
  const spin = t * 9;                         // rad: the spindle turns clockwise throughout (M03)
  let x = 0, y = 0, z = ZTOP, theta = 0;
  switch (ph.k) {
    case 'down': z = ZTOP + (Z0 - ZTOP) * ease(u); break;
    case 'line': x = 0.25 * u; y = -0.25 * u; z = Z0; break;
    case 'arcin': { const a = -Math.PI / 2 + (Math.PI / 2) * u; x = 0.25 + 0.25 * Math.cos(a); y = 0.25 * Math.sin(a); z = Z0 + (ZA - Z0) * u; break; }
    case 'full': theta = TAU * u; x = RP * Math.cos(theta); y = RP * Math.sin(theta); z = ZA + (ZB - ZA) * u; break;
    case 'arcout': { const a = (Math.PI / 2) * u; x = 0.25 + 0.25 * Math.cos(a); y = 0.25 * Math.sin(a); z = ZB + (ZC - ZB) * u; theta = TAU; break; }
    case 'back': x = 0.25 * (1 - u); y = 0.25 * (1 - u); z = ZC; theta = TAU; break;
    case 'up': z = ZC + (ZTOP - ZC) * ease(u); theta = TAU; break;
    case 'hold': z = ZTOP; theta = TAU; break;
  }
  return { phase: ph.k, u, x, y, z, theta, spin, t };
}

/** Tool-centre path from the start of the loop up to time t, sampled (inches). */
export function pathTo(t: number) {
  const pts: [number, number][] = [];
  const st = stateAt(t);
  const order: Phase[] = ['line', 'arcin', 'full', 'arcout', 'back'];
  const idx = PHASES.findIndex((p) => p.k === st.phase);
  let acc = 0;
  for (const p of PHASES) {
    if (order.includes(p.k)) {
      const pi = PHASES.indexOf(p);
      if (pi > idx) break;
      const n = p.k === 'full' ? 72 : 12;
      const uMax = pi === idx ? st.u : 1;
      for (let i = 0; i <= n; i++) { const uu = (i / n) * uMax; const s = stateAt(acc + uu * p.dur); pts.push([s.x, s.y]); }
    }
    acc += p.dur;
  }
  return pts;
}

const f = (n: number) => n.toFixed(1);

/** Plan view: work, drilled hole, thread root circle, tool-centre path so far, tool with four flutes. */
export function drawTop(st: TState, narrow: boolean, cutAll = false) {
  const S = 112, cx = 120, cy = 120;
  const X = (v: number) => cx + v * S, Y = (v: number) => cy - v * S;  // +Y up in plan
  const o: string[] = [];
  // the thread root, revealed as far as the orbit has gone (cutAll: whole circle)
  const th = cutAll ? TAU : st.theta;
  const R = (D / 2) * S;
  if (th >= TAU - 0.02) o.push(`<circle cx="${cx}" cy="${cy}" r="${f(R)}" class="tm-root"/>`);
  else if (th > 0.001) {
    const a1 = th;
    o.push(`<path d="M${f(cx + R)},${f(cy)} A${f(R)},${f(R)} 0 ${a1 > Math.PI ? 1 : 0} 0 ${f(cx + R * Math.cos(a1))},${f(cy - R * Math.sin(a1))}" class="tm-root"/>`);
  }
  const pts = pathTo(cutAll ? PHASES.slice(0, 6).reduce((a, p) => a + p.dur, 0) - 0.001 : st.t);
  if (pts.length > 1) o.push(`<path d="M${pts.map(([x, y]) => `${f(X(x))},${f(Y(y))}`).join(' L')}" class="tm-path"/>`);
  // tool: body circle, four flutes, turning clockwise
  const tx = X(st.x), ty = Y(st.y), r = (d / 2) * S;
  const fl = [0, 1, 2, 3].map((i) => {
    const a = -st.spin + (i * Math.PI) / 2;
    const p1 = [tx + r * Math.cos(a), ty - r * Math.sin(a)], p2 = [tx + r * 0.45 * Math.cos(a + 0.5), ty - r * 0.45 * Math.sin(a + 0.5)];
    return `M${f(tx)},${f(ty)} L${f(p1[0])},${f(p1[1])} L${f(p2[0])},${f(p2[1])} Z`;
  }).join(' ');
  o.push(`<g class="tm-tool"><circle cx="${f(tx)}" cy="${f(ty)}" r="${f(r)}" class="tm-body"/><path d="${fl}" class="tm-fl"/><circle cx="${f(tx)}" cy="${f(ty)}" r="2" class="tm-c"/></g>`);
  return o.join('');
}

/** Section through the hole (looking along +Y): cut grooves on both walls, helix on the back wall, the tool. */
export function drawSide(st: TState, cutAll = false) {
  const S = 112, cx = 130, ys = 86;                                 // ys: y of the top face (Z = 0)
  const X = (v: number) => cx + v * S, Yz = (z: number) => ys - z * S;
  const depth = (D / 2 - RD) * S, w = 2 * depth * Math.tan(Math.PI / 6);
  const o: string[] = [];
  const th = cutAll ? TAU : st.theta;
  // right wall (θ = 0): cut as the arc in finishes; left wall (θ = 180°) as the orbit passes it
  const opR = cutAll ? 1 : st.phase === 'arcin' ? st.u : th > 0 || ['arcout', 'back', 'up', 'hold'].includes(st.phase) ? 1 : 0;
  const opL = cutAll ? 1 : Math.min(1, Math.max(0, (th - Math.PI * 0.85) / (Math.PI * 0.3)));
  const groove = (s: number, z: number) => {
    const xd = X(s * RD), xm = X(s * (D / 2)), y = Yz(z);
    return `M${f(xd)},${f(y - w / 2)} L${f(xm)},${f(y)} L${f(xd)},${f(y + w / 2)} Z`;
  };
  const zs = (z0: number) => [0, 1, 2, 3, 4].map((k) => z0 + k * P).filter((z) => z <= 0.001);
  if (opR > 0) o.push(`<path d="${zs(ZA).map((z) => groove(1, z)).join(' ')}" class="tm-groove" opacity="${opR.toFixed(2)}"/>`);
  if (opL > 0) o.push(`<path d="${zs(ZA + P / 2).map((z) => groove(-1, z)).join(' ')}" class="tm-groove" opacity="${opL.toFixed(2)}"/>`);
  // back wall (θ from 0 to 180°): the thread root, rising to the left, drawn as far as the orbit has reached
  const tb = Math.min(th, Math.PI);
  if (tb > 0.01) {
    const lines: string[] = [];
    for (let k = 0; k < 5; k++) {
      const q: string[] = [];
      for (let i = 0; i <= 24; i++) {
        const a = (tb * i) / 24, z = ZA + k * P + (a / TAU) * P;
        if (z > 0.001) break;
        q.push(`${f(X((D / 2) * Math.cos(a)))},${f(Yz(z))}`);
      }
      if (q.length > 1) lines.push(`M${q.join(' L')}`);
    }
    o.push(`<path d="${lines.join(' ')}" class="tm-helix"/>`);
  }
  // the tool: shank, neck and five annular teeth (60° V), lowest tooth at Z
  const tx = X(st.x), z = st.z, rc = (d / 2) * S, rk = rc - depth;
  const yb = Yz(z), teeth = 5;
  const L: string[] = [], R: string[] = [];
  for (let k = 0; k < teeth; k++) {
    const yc = yb - k * P * S;
    // crest at yc, roots half a pitch above and below
    L.push(`${f(tx - rk)},${f(yc + (P * S) / 2)}`, `${f(tx - rk)},${f(yc + w / 2)}`, `${f(tx - rc)},${f(yc)}`, `${f(tx - rk)},${f(yc - w / 2)}`);
    R.push(`${f(tx + rk)},${f(yc + (P * S) / 2)}`, `${f(tx + rk)},${f(yc + w / 2)}`, `${f(tx + rc)},${f(yc)}`, `${f(tx + rk)},${f(yc - w / 2)}`);
  }
  const yTopT = yb - (teeth - 0.5) * P * S, yNeck = yTopT - 10, yShank = -10;
  const rs = rc * 0.92, rn = rk * 0.8;
  const body = `M${f(tx - rs)},${yShank} L${f(tx - rs)},${f(yNeck - 6)} L${f(tx - rn)},${f(yNeck)} L${f(tx - rk)},${f(yTopT)} L${L.reverse().join(' L')} L${f(tx + rk)},${f(yb + (P * S) / 2)} L${R.join(' L')} L${f(tx + rk)},${f(yTopT)} L${f(tx + rn)},${f(yNeck)} L${f(tx + rs)},${f(yNeck - 6)} L${f(tx + rs)},${yShank} Z`;
  // straight flutes (the teeth are annular, so the flutes run straight), sliding left as the tool turns clockwise
  const fl: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = ((-st.spin + (i * TAU) / 3) % TAU + TAU) % TAU;     // angle on the cylinder, 0 = right edge, π/2 = front … seen from the front
    if (Math.sin(a) >= 0) continue;                                 // on the back side
    const xa = tx + rk * Math.cos(a), xw = Math.max(2, Math.abs(Math.sin(a)) * rk * 0.42);
    fl.push(`<rect x="${f(xa - xw / 2)}" y="${f(yTopT)}" width="${f(xw)}" height="${f(yb + (P * S) / 2 - yTopT)}" class="tm-flute"/>`);
  }
  o.push(`<g class="tm-tool"><path d="${body}" class="tm-body"/>${fl.join('')}<path d="${body}" class="tm-edge"/></g>`);
  return o.join('');
}

/** Static parts of the section: the work with the drilled hole. */
export function sideWork() {
  const S = 112, cx = 130, ys = 86, yb = ys + 0.72 * S, yBlk = ys + 1.02 * S;
  const xl = cx - RD * S, xr = cx + RD * S;
  return `<path d="M16,${ys} L${f(xl)},${ys} L${f(xl)},${f(yb)} L${f(xr)},${f(yb)} L${f(xr)},${ys} L244,${ys} L244,${f(yBlk)} L16,${f(yBlk)} Z" class="tm-work"/>` +
    `<rect x="${f(xl)}" y="${ys}" width="${f(xr - xl)}" height="${f(yb - ys)}" class="tm-bore"/>` +
    `<line x1="${cx}" x2="${cx}" y1="4" y2="${f(yBlk + 6)}" class="tm-axis"/>`;
}
export function topWork() {
  const S = 112, cx = 120, cy = 120;
  return `<rect x="12" y="12" width="216" height="216" rx="4" class="tm-work"/><circle cx="${cx}" cy="${cy}" r="${f(RD * S)}" class="tm-bore"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${f((D / 2) * S)}" class="tm-major"/><path d="M${cx - 8},${cy} L${cx + 8},${cy} M${cx},${cy - 8} L${cx},${cy + 8}" class="tm-axis"/>`;
}

/* ---------- feed calculator ---------- */
/** Edge (contour) feed vf = fz · z · n, mm/min. */
export const edgeFeed = (fz: number, z: number, n: number) => fz * z * n;
/** Tool-centre feed: internal (D − d)/D · vf, external (D + d)/D · vf (Harvey Tool; Allied for internal). */
export const centreFeed = (vf: number, Dm: number, dc: number, internal: boolean) => vf * (internal ? (Dm - dc) / Dm : (Dm + dc) / Dm);
export const rpm = (vc: number, dc: number) => (1000 * vc) / (Math.PI * dc);
/** ISO metric basic minor diameter of the nut, D1 = D − 1.0825 P (= D − 5H/4 with H = 0.866 P). */
export const minorD = (Dm: number, Pm: number) => Dm - 1.0825 * Pm;
export const COARSE: { name: string; D: number; P: number }[] = [
  { name: 'M6', D: 6, P: 1 }, { name: 'M8', D: 8, P: 1.25 }, { name: 'M10', D: 10, P: 1.5 }, { name: 'M12', D: 12, P: 1.75 },
  { name: 'M16', D: 16, P: 2 }, { name: 'M20', D: 20, P: 2.5 }, { name: 'M24', D: 24, P: 3 }, { name: 'M30', D: 30, P: 3.5 },
  { name: 'M36', D: 36, P: 4 }, { name: 'M42', D: 42, P: 4.5 }, { name: 'M48', D: 48, P: 5 },
];
export interface FState { th: number; dc: number; z: number; vc: number; fz: number; internal: boolean }
export function feedCalc(s: FState) {
  const t = COARSE[s.th];
  const n = rpm(s.vc, s.dc), vf = edgeFeed(s.fz, s.z, n), vm = centreFeed(vf, t.D, s.dc, s.internal);
  const D1 = minorD(t.D, t.P);
  return {
    t, n, vf, vm, D1,
    ratio: s.dc / t.D,
    iscar: 0.7 * t.D,                              // ISCAR: internal, up to 70 % of the major diameter
    vargus: 0.7 * D1,                              // Vargus (standard inserts): below 70 % of the minor diameter
    fraisa: (2 / 3) * D1,                          // FRAISA: not over 2/3 of the nut core diameter
    pathR: s.internal ? (t.D - s.dc) / 2 : (t.D + s.dc) / 2,
    arcR: s.internal ? (t.D - s.dc) / 4 : NaN,     // Allied: arc on/off radius (internal)
    zArc: t.P / 8,                                 // Allied, Haas: Z on the arc in = 1/8 pitch
  };
}

/** Plan view for the feed calculator: thread, cutter at its path radius, tool-centre path, and the two feeds as tangent arrows. */
export function drawFeed(s: FState, r: ReturnType<typeof feedCalc>, T: { edge: string; centre: string }, dec: (v: string) => string) {
  const W = 300, H = 260, cx = 150, cy = 128;
  const ext = s.internal ? r.t.D / 2 : r.t.D / 2 + s.dc;
  const S = 100 / ext;                                               // the outermost circle has radius 100 px
  const o: string[] = [];
  const Rm = (r.t.D / 2) * S, Rn = (r.D1 / 2) * S, rc = (s.dc / 2) * S, Rp = r.pathR * S;
  if (s.internal) {
    o.push(`<rect x="20" y="${cy - 116}" width="260" height="232" rx="4" class="tf-work"/>`);
    o.push(`<circle cx="${cx}" cy="${cy}" r="${f(Rm)}" class="tf-hole"/>`);
    o.push(`<circle cx="${cx}" cy="${cy}" r="${f(Rn)}" class="tf-minor"/>`);
  } else {
    o.push(`<circle cx="${cx}" cy="${cy}" r="${f(Rm)}" class="tf-post"/>`);
  }
  o.push(`<circle cx="${cx}" cy="${cy}" r="${f(Rm)}" class="tf-major"/>`);
  o.push(`<circle cx="${cx}" cy="${cy}" r="${f(Rp)}" class="tf-path"/>`);
  // the cutter at the top of its path; the contact point on the major diameter straight above or below its centre
  const tx = cx, ty = cy - Rp;
  const ky = cy - Rm;
  o.push(`<circle cx="${f(tx)}" cy="${f(ty)}" r="${f(rc)}" class="tf-tool"/><circle cx="${f(tx)}" cy="${f(ty)}" r="2.2" class="tf-c"/>`);
  // feed arrows, tangent to the orbit: counter-clockwise inside (to the left at the top), clockwise outside (to the right); both climb with M03
  const ux = s.internal ? -1 : 1;
  const Lmax = 80, Lc = Lmax * (r.vm / r.vf), Le = Lmax;
  const sc = Math.max(Le, Lc) > 110 ? 110 / Math.max(Le, Lc) : 1;
  const arrow = (y: number, L: number, cls: string) => `<line x1="${f(tx)}" y1="${f(y)}" x2="${f(tx + ux * L * sc)}" y2="${f(y)}" class="tf-arr ${cls}" marker-end="url(#tf-m-${cls})"/>`;
  o.push(arrow(ky, Le, 'e'), arrow(ty, Lc, 'c'));
  o.push(`<circle cx="${f(tx)}" cy="${f(ky)}" r="2.6" class="tf-k"/>`);
  const anchor = s.internal ? 'end' : 'start';
  o.push(`<text x="${f(tx + ux * (Le * sc + 10))}" y="${f(ky + 4)}" text-anchor="${anchor}" class="tf-t e">${T.edge}</text>`);
  o.push(`<text x="${f(tx + ux * (Lc * sc + 10))}" y="${f(ty + 4)}" text-anchor="${anchor}" class="tf-t c">${T.centre}</text>`);
  o.push(`<text x="${cx}" y="${H - 6}" text-anchor="middle" class="tf-cap">${r.t.name} × ${dec(String(r.t.P))} · Ø${dec(String(s.dc))}</text>`);
  return { W, H, svg: o.join('') };
}
