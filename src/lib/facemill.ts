/**
 * Face milling geometry for the face-milling page.
 *
 * Cutter position (plan view). The work is a strip of width ae along the feed direction +x, centred on y = 0;
 * the cutter centre sits at y = e, radius R = Dc / 2. A tooth at angle α from the feed direction (α = 0 at the
 * front) is at y = e + R·sin α; it cuts where that lies inside the strip, on the front half (|α| ≤ 90°).
 * Its chip thickness is h = fz · cos α · sin κr, the same law as h(φ) = fz · sin φ · sin κr with φ measured
 * from the tangent point (ISCAR; see the climb vs conventional page). The cutter turns clockwise seen from the
 * spindle (M03), so a tooth enters at the upper edge of the strip and leaves at the lower one. At α > 0 the tooth
 * moves the way the cutter travels (+x), i.e. against the work's feed: conventional, the chip grows from the entry.
 * At α < 0 it moves against the cutter's travel: climb, the chip thins towards the exit.
 *
 * Entering angle (section). Chip thickness h = fz · sin κr, chip width b = ap / sin κr.
 */
export interface Pos { ratio: number; off: number }          // ratio = Dc / ae; off = e / ae
const deg = (r: number) => (r * 180) / Math.PI;

/** Largest centre offset (in ae) at which the cutter still covers the whole width of cut. */
export const maxOffset = (ratio: number) => Math.max(0, (ratio - 1) / 2);

export function engagement(p: Pos) {
  const R = p.ratio / 2, e = p.off;                          // in units of ae
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const aIn = Math.asin(clamp((0.5 - e) / R));               // upper edge: entry
  const aOut = Math.asin(clamp((-0.5 - e) / R));             // lower edge: exit
  const reachesUpper = (0.5 - e) / R < 1, reachesLower = (-0.5 - e) / R > -1;
  const span = aIn - aOut;                                   // engaged arc, radians
  const climb = Math.max(0, -aOut) - Math.max(0, -aIn);      // part of the arc with α < 0
  return {
    aIn, aOut, span, reachesUpper, reachesLower,
    hIn: Math.cos(aIn), hOut: Math.cos(aOut),                // chip thickness at entry and exit, as a share of fz · sin κr
    hMax: aIn >= 0 && aOut <= 0 ? 1 : Math.max(Math.cos(aIn), Math.cos(aOut)),
    climbShare: span > 0 ? climb / span : 0,
    inDeg: deg(aIn), outDeg: deg(aOut), spanDeg: deg(span),
  };
}

export const chipSection = (kr: number, fz: number, ap: number) => {
  const s = Math.sin((kr * Math.PI) / 180);
  return { h: fz * s, b: ap / s, A: fz * ap };
};

/** Makers' cutter-to-width ratios, each as published: Mitsubishi D = 1.2–1.3 B; Sumitomo a cut 70–80 % of the
 *  cutter diameter (so 1.25–1.43); Ingersoll 1-1/2 times the width of cut. */
export const RATIOS = [
  { who: 'Mitsubishi', lo: 1.2, hi: 1.3 },
  { who: 'Sumitomo', lo: 1 / 0.8, hi: 1 / 0.7 },
  { who: 'Ingersoll', lo: 1.5, hi: 1.5 },
];
