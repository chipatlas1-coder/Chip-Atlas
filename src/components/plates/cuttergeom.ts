/**
 * Shared drawing geometry for milling cutters and screw threads (side views).
 * Screen coordinates, y down.
 */

/**
 * Outline of a milling cutter with N teeth: each tooth has a radial rake face, a clearance land
 * that falls `drop` behind the tip, and a rounded gullet down to radius R − depth.
 * dir = +1 turns the rake faces clockwise on screen, −1 counter-clockwise.
 */
export function cutterPath(cx: number, cy: number, R: number, N: number, dir: number, depth = 15, drop = 6, landDeg = 22): string {
  const pts: string[] = [];
  const pitch = (2 * Math.PI) / N, land = (landDeg * Math.PI) / 180, Rg = R - depth;
  const rad = (a: number, r: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  for (let k = 0; k < N; k++) {
    const th = k * pitch;
    for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(rad(dir * (th - land + land * t), R - drop + drop * t * t)); }
    pts.push(rad(dir * (th + 0.02), Rg));
    const g = pitch - land;
    for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push(rad(dir * (th + 0.02 + (g - 0.02) * t), Rg + (R - drop - Rg) * t * t)); }
  }
  return 'M' + pts.join(' L') + ' Z';
}

/**
 * Trapezoidal thread profile as a list of [x, y] points from x0 to x1.
 * One period: root (wr), rising flank (wf), crest (wc), falling flank (wf); P = wr + 2·wf + wc.
 * `phase` is where a period starts (the middle of a root), so crest centres sit at phase + P/2 + k·P.
 */
export function trapWave(x0: number, x1: number, phase: number, P: number, wf: number, wc: number, yRoot: number, yCrest: number): [number, number][] {
  const wr = P - wc - 2 * wf;
  const knots = [0, wr / 2, wr / 2 + wf, wr / 2 + wf + wc, wr / 2 + 2 * wf + wc, P];
  const hAt = (u: number) => {
    if (u <= knots[1]) return 0;
    if (u <= knots[2]) return (u - knots[1]) / wf;
    if (u <= knots[3]) return 1;
    if (u <= knots[4]) return 1 - (u - knots[3]) / wf;
    return 0;
  };
  const y = (x: number) => { const u = (((x - phase) % P) + P) % P; return yRoot + (yCrest - yRoot) * hAt(u); };
  const xs = new Set<number>([x0, x1]);
  const k0 = Math.floor((x0 - phase) / P) - 1, k1 = Math.ceil((x1 - phase) / P) + 1;
  for (let k = k0; k <= k1; k++) for (const kn of knots) { const x = phase + k * P + kn; if (x > x0 && x < x1) xs.add(x); }
  return [...xs].sort((a, b) => a - b).map((x) => [x, y(x)] as [number, number]);
}

export const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L');
