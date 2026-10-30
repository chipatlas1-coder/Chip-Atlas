/**
 * Oscillation cutting (chip breaking by oscillating the feed axis), from the geometry of the tool paths alone.
 * Total spindle angle φ in degrees. The tool's axial position, in units of the feed per revolution f:
 *   z(φ) = φ/360 + a · sin(k · φ · 2π/360),   a = amplitude / f,   k = oscillations per spindle revolution.
 * The surface at a given angular position is the furthest point any earlier pass reached there:
 *   S(φ) = max over j ≥ 1 of z(φ − 360 j).
 * The chip thickness along the axis is h(φ) = max(0, z(φ) − S(φ)) (in units of f); where it is zero the tool
 * runs in air and the chip is cut through.
 */
export const z = (phi: number, a: number, k: number) => phi / 360 + a * Math.sin((k * phi * Math.PI) / 180);
export const surface = (phi: number, a: number, k: number, J = 8) => {
  let s = -Infinity;
  for (let j = 1; j <= J; j++) s = Math.max(s, z(phi - 360 * j, a, k));
  return s;
};
export const thickness = (phi: number, a: number, k: number) => Math.max(0, z(phi, a, k) - surface(phi, a, k));

/** Air-cut intervals per spindle revolution, and the share of time spent in air, sampled in the steady state. */
export function analyse(a: number, k: number, revs = 40, perRev = 720) {
  const start = 360 * 12, n = revs * perRev;
  let breaks = 0, air = 0, prevAir = thickness(start, a, k) <= 1e-9;
  for (let i = 1; i <= n; i++) {
    const phi = start + (360 * revs * i) / n, isAir = thickness(phi, a, k) <= 1e-9;
    if (isAir) air++;
    if (isAir && !prevAir) breaks++;
    prevAir = isAir;
  }
  return { breaksPerRev: breaks / revs, airShare: air / n };
}
