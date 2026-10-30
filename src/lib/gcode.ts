/**
 * A small G-code reader for the motion commands, enough to draw and animate a program on the G-code page:
 * G00 / G01 / G02 / G03 in the XY plane (G17), G90 / G91, the arc centre as I J (incremental from the start point)
 * or as a radius R (positive: the arc of 180° or less; negative: the longer arc), and F. Everything else on a line
 * is kept as text but does not move the tool. Modal: a motion code or G90/G91 stays in force until another one of
 * its group replaces it, and a line with coordinates and no motion code repeats the last motion.
 * G02 is clockwise seen looking down the Z axis from its positive end onto the XY plane (standard x right, y up).
 */
export type Vec = [number, number];
export interface Move {
  line: number;                       // index of the program line
  kind: 'rapid' | 'feed' | 'arc';
  from: Vec; to: Vec;
  center?: Vec; cw?: boolean; sweep?: number;   // arcs: centre, direction, swept angle (rad, positive)
  feed?: number;
}
export interface Parsed { moves: Move[]; errors: { line: number; msg: string }[] }

const words = (src: string) => {
  const code = src.replace(/\([^)]*\)/g, ' ').replace(/;.*$/, '').toUpperCase();
  const out: [string, number][] = [];
  const re = /([A-Z])\s*([+-]?\d*\.?\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) out.push([m[1], Number(m[2])]);
  return out;
};

export function parse(lines: string[], start: Vec = [0, 0]): Parsed {
  const moves: Move[] = [], errors: Parsed['errors'] = [];
  let pos: Vec = [start[0], start[1]], motion = -1, abs = true, feed: number | undefined;
  lines.forEach((src, line) => {
    const w = words(src);
    let x: number | undefined, y: number | undefined, i: number | undefined, j: number | undefined, r: number | undefined;
    for (const [k, v] of w) {
      if (k === 'G') {
        if ([0, 1, 2, 3].includes(v)) motion = v;
        else if (v === 90) abs = true;
        else if (v === 91) abs = false;
      } else if (k === 'X') x = v; else if (k === 'Y') y = v;
      else if (k === 'I') i = v; else if (k === 'J') j = v; else if (k === 'R') r = v;
      else if (k === 'F') feed = v;
    }
    if (x === undefined && y === undefined && i === undefined && j === undefined) return;
    if (motion < 0) { errors.push({ line, msg: 'coordinates without a motion code' }); return; }
    const to: Vec = abs ? [x ?? pos[0], y ?? pos[1]] : [pos[0] + (x ?? 0), pos[1] + (y ?? 0)];
    if (motion === 0 || motion === 1) {
      moves.push({ line, kind: motion === 0 ? 'rapid' : 'feed', from: pos, to, feed: motion === 1 ? feed : undefined });
    } else {
      const cw = motion === 2;
      let c: Vec;
      if (r !== undefined) {
        const dx = to[0] - pos[0], dy = to[1] - pos[1], d = Math.hypot(dx, dy);
        if (d === 0) { errors.push({ line, msg: 'R cannot describe a full circle' }); return; }
        const R = Math.abs(r);
        if (d > 2 * R + 1e-9) { errors.push({ line, msg: 'R too small for the chord' }); return; }
        const h = Math.sqrt(Math.max(0, R * R - (d / 2) ** 2));
        const mx = (pos[0] + to[0]) / 2, my = (pos[1] + to[1]) / 2, nx = -dy / d, ny = dx / d;   // left normal of the chord
        // for the short arc (r > 0) the centre lies to the right of the chord going clockwise, to the left counter-clockwise
        const side = (cw ? -1 : 1) * (r > 0 ? 1 : -1);
        c = [mx + side * h * nx, my + side * h * ny];
      } else c = [pos[0] + (i ?? 0), pos[1] + (j ?? 0)];
      const a0 = Math.atan2(pos[1] - c[1], pos[0] - c[0]), a1 = Math.atan2(to[1] - c[1], to[0] - c[0]);
      let sweep = cw ? a0 - a1 : a1 - a0;
      while (sweep <= 1e-12) sweep += 2 * Math.PI;                  // same start and end: a full circle
      const rs = Math.hypot(pos[0] - c[0], pos[1] - c[1]), re = Math.hypot(to[0] - c[0], to[1] - c[1]);
      if (Math.abs(rs - re) > 1e-3 * Math.max(1, rs)) errors.push({ line, msg: 'start and end are not on one circle' });
      moves.push({ line, kind: 'arc', from: pos, to, center: c, cw, sweep, feed });
    }
    pos = to;
  });
  return { moves, errors };
}

/** Point at share u (0–1) along a move. Rapids may be drawn as a "dog-leg": both axes at the same speed until the
 *  shorter one arrives, then the longer one alone (each axis at its own rapid rate, assumed equal here). */
export function pointAt(m: Move, u: number, dogleg = false): Vec {
  if (m.kind === 'arc') {
    const c = m.center!, a0 = Math.atan2(m.from[1] - c[1], m.from[0] - c[0]), r = Math.hypot(m.from[0] - c[0], m.from[1] - c[1]);
    const a = a0 + (m.cw ? -1 : 1) * m.sweep! * u;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  }
  const dx = m.to[0] - m.from[0], dy = m.to[1] - m.from[1];
  if (m.kind === 'rapid' && dogleg) {
    const t = u * Math.max(Math.abs(dx), Math.abs(dy));          // the move lasts as long as the longer axis needs
    const kx = Math.min(t, Math.abs(dx)), ky = Math.min(t, Math.abs(dy));
    return [m.from[0] + Math.sign(dx) * kx, m.from[1] + Math.sign(dy) * ky];
  }
  return [m.from[0] + dx * u, m.from[1] + dy * u];
}

/** Length of the path a move draws (for timing the animation). */
export function lengthOf(m: Move, dogleg = false) {
  if (m.kind === 'arc') return Math.hypot(m.from[0] - m.center![0], m.from[1] - m.center![1]) * m.sweep!;
  const dx = Math.abs(m.to[0] - m.from[0]), dy = Math.abs(m.to[1] - m.from[1]);
  if (m.kind === 'rapid' && dogleg) { const s = Math.min(dx, dy); return s * Math.SQRT2 + (Math.max(dx, dy) - s); }
  return Math.hypot(dx, dy);
}
