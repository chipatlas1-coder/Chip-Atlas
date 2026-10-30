/**
 * Regenerative chatter, the single-degree-of-freedom model used to teach it.
 *
 * Frequency response of a mass–spring–damper (stiffness k in N/m, damping ratio ζ, natural frequency fn in Hz),
 * frequency ratio r = f / fn:
 *   Re[G] = (1/k) · (1 − r²) / ((1 − r²)² + (2ζr)²)
 *   Im[G] = (1/k) · (−2ζr) / ((1 − r²)² + (2ζr)²)
 * Stability limit (turning form, Tlusty; Schmitz & Smith, Machining Dynamics):
 *   b_lim = −1 / (2 · Ks · μ · Re[G])          only where Re[G] < 0, i.e. above fn
 *   fc / f_pass = N + ε / 2π,   ε = 2π − 2 · atan(Re[G] / Im[G])
 *   spindle speed n (rpm) = 60 · fc / (z · (N + ε / 2π))     (z = 1 for turning, z teeth for the
 *   average-tooth-angle milling approximation, where μ also takes the average number of teeth in the cut)
 * Smallest limit over all speeds: b_lim,crit = 2 · k · ζ · (1 + ζ) / (Ks · μ).
 * Ks is the specific cutting force in N/m² (N/mm² × 10⁶); b comes out in m and is reported in mm.
 *
 * The regenerative chip: with the surface left by the previous pass y₀ = A·sin(ωt − ε) and the present
 * vibration y = A·sin(ωt), the chip thickness is h = h_m + y₀ − y; its swing is ± 2A·|sin(ε/2)|.
 */
export interface Sys { fn: number; k: number; zeta: number; Ks: number; z: number; mu: number }
export interface Pt { rpm: number; b: number; fc: number }

export function frf(f: number, s: Pick<Sys, 'fn' | 'k' | 'zeta'>) {
  const r = f / s.fn, d = (1 - r * r) ** 2 + (2 * s.zeta * r) ** 2;
  return { re: (1 - r * r) / (s.k * d), im: (-2 * s.zeta * r) / (s.k * d) };
}

/** Phase between the present vibration and the surface it cuts, in radians, between π and 2π above fn. */
export function phase(f: number, s: Pick<Sys, 'fn' | 'k' | 'zeta'>) {
  const g = frf(f, s);
  return 2 * Math.PI - 2 * Math.atan(g.re / g.im);
}

/** Limiting depth of cut in mm at chatter frequency f (Hz); Infinity where Re[G] ≥ 0. */
export function blim(f: number, s: Sys) {
  const g = frf(f, s);
  if (g.re >= 0) return Infinity;
  return (-1 / (2 * s.Ks * s.mu * g.re)) * 1000;
}

export const blimCrit = (s: Sys) => ((2 * s.k * s.zeta * (1 + s.zeta)) / (s.Ks * s.mu)) * 1000;

/** Lobe N (0, 1, 2 …): points from just above fn to fMax, with rpm rising along the lobe. */
export function lobe(N: number, s: Sys, fMax = 3 * s.fn, steps = 600): Pt[] {
  const out: Pt[] = [];
  const f0 = s.fn * (1 + 1e-4);
  for (let i = 0; i <= steps; i++) {
    const f = f0 * (fMax / f0) ** (i / steps);           // log spacing: the lobe is steep near fn
    const eps = phase(f, s);
    const rpm = (60 * f) / (s.z * (N + eps / (2 * Math.PI)));
    out.push({ rpm, b: blim(f, s), fc: f });
  }
  return out;
}

/** The stability boundary at a spindle speed: the smallest lobe value there, and which lobe gives it. */
export function boundary(rpm: number, lobes: Pt[][]) {
  let best = Infinity, which = -1, fc = NaN;
  lobes.forEach((L, N) => {
    for (let i = 1; i < L.length; i++) {
      const a = L[i - 1], c = L[i];
      if ((a.rpm - rpm) * (c.rpm - rpm) <= 0 && a.rpm !== c.rpm) {
        const t = (rpm - a.rpm) / (c.rpm - a.rpm);
        const b = a.b + t * (c.b - a.b);
        if (b < best) { best = b; which = N; fc = a.fc + t * (c.fc - a.fc); }
      }
    }
  });
  return { b: best, N: which, fc };
}

/** Speeds where the tooth-passing frequency is fn / (N + 1): the tops of the stable pockets lie just above them. */
export const pocketRpm = (N: number, s: Pick<Sys, 'fn' | 'z'>) => (60 * s.fn) / (s.z * (N + 1));

/** Regenerative chip thickness along one wave: present surface y, previous surface y0 (both in units of A). */
export function chip(eps: number, hm: number, A: number, t: number) {
  const y = A * Math.sin(t), y0 = A * Math.sin(t - eps);
  return { y, y0, h: hm + y0 - y };
}
export const swing = (eps: number, A: number) => 2 * A * Math.abs(Math.sin(eps / 2));
