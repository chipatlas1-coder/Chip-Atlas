/**
 * Synthetic roughness profiles for illustrations, and the ISO parameter
 * computations used on them (Ra, Rz, Rt, material ratio curve, Rk family).
 * Deterministic: the same seed always draws the same profile.
 */

export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Correlated random profile, zero mean. n points, `corr` = moving-average width. */
export function randomProfile(n, seed = 7, corr = 9, amplitude = 1) {
  const rnd = prng(seed);
  const raw = Array.from({ length: n + corr }, () => (rnd() + rnd() + rnd() - 1.5));
  const z = [];
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < corr; k++) s += raw[i + k];
    z.push((s / Math.sqrt(corr)) * amplitude);
  }
  const m = z.reduce((a, b) => a + b, 0) / n;
  return z.map((v) => v - m);
}

/** Plateau-honed style profile: truncated peaks plus sparse deep grooves. */
export function plateauProfile(n, seed = 11) {
  const rnd = prng(seed);
  let z = randomProfile(n, seed, 7, 0.55);
  z = z.map((v) => Math.min(v, 0.35)); // plateau: peaks removed
  let i = 0;
  while (i < n) {
    i += 40 + Math.floor(rnd() * 90);
    const w = 6 + Math.floor(rnd() * 10), depth = 1.6 + rnd() * 2.2;
    for (let k = -w; k <= w; k++) {
      const j = i + k;
      if (j >= 0 && j < n) z[j] = Math.min(z[j], -depth * (1 - Math.abs(k) / (w + 1)) ** 1.6 + 0.1);
    }
  }
  const m = z.reduce((a, b) => a + b, 0) / n;
  return z.map((v) => v - m);
}

export function ra(z) {
  const m = z.reduce((a, b) => a + b, 0) / z.length;
  return z.reduce((a, b) => a + Math.abs(b - m), 0) / z.length;
}

/** Rz as the mean of the peak-to-valley heights of `sections` equal sections; also returns each section. */
export function rz(z, sections = 5) {
  const len = Math.floor(z.length / sections);
  const parts = [];
  for (let s = 0; s < sections; s++) {
    const seg = z.slice(s * len, (s + 1) * len);
    let pi = 0, vi = 0;
    seg.forEach((v, k) => { if (v > seg[pi]) pi = k; if (v < seg[vi]) vi = k; });
    parts.push({ start: s * len, peak: s * len + pi, valley: s * len + vi, rzi: seg[pi] - seg[vi] });
  }
  return { Rz: parts.reduce((a, p) => a + p.rzi, 0) / sections, parts };
}

export function rt(z) {
  return Math.max(...z) - Math.min(...z);
}

/**
 * Material ratio (Abbott–Firestone) curve and ISO 13565-2 parameters.
 * Returns heights sorted from highest to lowest with their material ratio in %,
 * and Rk, Rpk, Rvk, Mr1, Mr2 by the 40 % secant of least gradient.
 */
export function rkFamily(z) {
  const n = z.length;
  const sorted = [...z].sort((a, b) => b - a);
  const mr = sorted.map((_, i) => ((i + 0.5) / n) * 100);
  const at = (p) => sorted[Math.min(n - 1, Math.max(0, Math.round((p / 100) * n - 0.5)))];
  // 40 % secant with the smallest height difference.
  let best = { m: 0, dz: Infinity };
  for (let m = 0; m <= 60; m += 0.1) {
    const dz = at(m) - at(m + 40);
    if (dz < best.dz) best = { m, dz };
  }
  const slope = best.dz / 40; // µm per %
  const z0 = at(best.m) + slope * best.m; // line at Mr = 0
  const z100 = z0 - slope * 100; // line at Mr = 100
  const Rk = z0 - z100;
  // Mr1: where the curve falls below the upper core limit z0; Mr2: where it falls below z100.
  let Mr1 = 0, Mr2 = 100;
  for (let i = 0; i < n; i++) { if (sorted[i] <= z0) { Mr1 = mr[i]; break; } }
  for (let i = 0; i < n; i++) { if (sorted[i] < z100) { Mr2 = mr[i]; break; } }
  // Areas of the peak and valley zones (µm·%), then equal-area triangles.
  const step = 100 / n;
  let A1 = 0, A2 = 0;
  for (let i = 0; i < n; i++) {
    if (mr[i] <= Mr1) A1 += (sorted[i] - z0) * step;
    if (mr[i] >= Mr2) A2 += (z100 - sorted[i]) * step;
  }
  const Rpk = Mr1 > 0 ? (2 * A1) / Mr1 : 0;
  const Rvk = Mr2 < 100 ? (2 * A2) / (100 - Mr2) : 0;
  return { sorted, mr, secant: best, z0, z100, Rk, Mr1, Mr2, A1, A2, Rpk, Rvk };
}

/** Rq, Rsk and Rku of a profile (heights from its mean line). */
export function moments(z) {
  const n = z.length;
  const m = z.reduce((a, b) => a + b, 0) / n;
  let s2 = 0, s3 = 0, s4 = 0;
  for (const v of z) { const d = v - m; s2 += d * d; s3 += d * d * d; s4 += d * d * d * d; }
  const Rq = Math.sqrt(s2 / n);
  return { Rq, Rsk: s3 / n / Rq ** 3, Rku: s4 / n / Rq ** 4 };
}

/**
 * Plateau-honed style profile with soft plateaus: peaks above `cap` are flattened (kept at `soft`
 * of their height), and narrow rounded grooves are cut at random spacing. With the defaults and
 * seed 11 the Rk family comes out near Rk 0.58, Rpk 0.13, Rvk 1.68, Mr1 6.8 %, Mr2 82.5 %.
 */
export function honedProfile(n = 700, seed = 11, o = {}) {
  const p = { corr: 6, amp: 0.42, cap: 0.12, soft: 0.8, w0: 3, w1: 5, d0: 1.5, d1: 1.2, s0: 50, s1: 60, ...o };
  const rnd = prng(seed * 7 + 1);
  let z = randomProfile(n, seed, p.corr, p.amp);
  z = z.map((v) => (v > p.cap ? p.cap + (v - p.cap) * p.soft : v));
  let i = Math.floor(rnd() * 30);
  while (i < n) {
    const w = p.w0 + Math.floor(rnd() * p.w1), depth = p.d0 + rnd() * p.d1;
    for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < n) z[j] = Math.min(z[j], -depth * Math.cos((Math.PI / 2) * (k / (w + 1))) ** 1.3 + 0.05); }
    i += p.s0 + Math.floor(rnd() * p.s1);
  }
  const m = z.reduce((a, b) => a + b, 0) / n;
  return z.map((v) => v - m);
}
