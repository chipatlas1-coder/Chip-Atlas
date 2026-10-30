/**
 * Chip Atlas calculation library.
 * Pure functions, SI machining units: mm, mm/rev, m/min, N, kW, N·m, µm.
 * Every function is covered by tests/calc.test.js.
 */

const PI = Math.PI;

/* ------------------------------------------------------------------ */
/* Turning                                                              */
/* ------------------------------------------------------------------ */

/** Cutting speed vc [m/min] from diameter D [mm] and spindle speed n [rpm]. */
export function cuttingSpeed(D, n) {
  return (PI * D * n) / 1000;
}

/** Spindle speed n [rpm] from cutting speed vc [m/min] and diameter D [mm]. */
export function spindleSpeed(vc, D) {
  return (vc * 1000) / (PI * D);
}

/** Metal removal rate Q [cm³/min] from vc [m/min], ap [mm], f [mm/rev]. */
export function removalRate(vc, ap, f) {
  return vc * ap * f;
}

/** Undeformed chip thickness h [mm] from feed f [mm/rev] and entering angle κr [deg]. */
export function chipThickness(f, kr) {
  return f * Math.sin((kr * PI) / 180);
}

/** Specific cutting force kc [N/mm²] by Kienzle: kc = kc1.1 · h^(−mc). */
export function specificCuttingForce(kc11, mc, h) {
  if (h <= 0) return NaN;
  return kc11 * Math.pow(h, -mc);
}

/** Main cutting force Fc [N] = kc [N/mm²] · ap [mm] · f [mm/rev]. */
export function cuttingForce(kc, ap, f) {
  return kc * ap * f;
}

/** Net cutting power Pc [kW] = Fc [N] · vc [m/min] / 60000. */
export function cuttingPower(Fc, vc) {
  return (Fc * vc) / 60000;
}

/** Cutting torque Mc [N·m] = Fc [N] · D [mm] / 2000. */
export function cuttingTorque(Fc, D) {
  return (Fc * D) / 2000;
}

/** Cutting time tc [min] for length L [mm] at feed f [mm/rev] and n [rpm]. */
export function cuttingTime(L, f, n) {
  return L / (f * n);
}

/** Feed speed vf [mm/min] = f [mm/rev] · n [rpm]. */
export function feedSpeed(f, n) {
  return f * n;
}

/* ------------------------------------------------------------------ */
/* Theoretical surface roughness in turning                             */
/* ------------------------------------------------------------------ */

/**
 * Textbook peak-to-valley height Rt [µm] for a nose-radius-only profile:
 * Rt = f² / (8·rε), with f and rε in mm.
 */
export function rtArc(f, re) {
  return ((f * f) / (8 * re)) * 1000;
}

/**
 * Textbook arithmetic mean roughness Ra [µm] for the same profile:
 * Ra ≈ f² / (31.2·rε). (Exact for a parabolic cusp: f²/(18√3·rε).)
 */
export function raArc(f, re) {
  return ((f * f) / (31.2 * re)) * 1000;
}

/**
 * Tool profile height h(u) [mm] above its lowest point, u measured along
 * the feed direction from the nose-arc centre. The arc spans from the
 * leading-edge tangent (−rε·sin κr) to the trailing-edge tangent (+rε·sin κr′);
 * beyond the tangents the straight edges continue at their angles.
 * Angles in degrees. Leading angles ≥ 90° are treated as a vertical wall.
 */
export function toolProfile(u, re, kr, krPrime) {
  const a = Math.min(kr, 90) * (PI / 180);
  const b = Math.min(krPrime, 90) * (PI / 180);
  const uL = -re * Math.sin(a);
  const uT = re * Math.sin(b);
  if (u >= uL && u <= uT) {
    return re - Math.sqrt(Math.max(0, re * re - u * u));
  }
  if (u < uL) {
    const h0 = re * (1 - Math.cos(a));
    if (a >= PI / 2 - 1e-9) return Infinity;
    return h0 + (uL - u) * Math.tan(a);
  }
  const h0 = re * (1 - Math.cos(b));
  if (b >= PI / 2 - 1e-9) return Infinity;
  return h0 + (u - uT) * Math.tan(b);
}

/**
 * Generated surface over one feed period: the lower envelope of the tool
 * profile repeated every f. Returns { x, z } arrays in mm, z ≥ 0.
 */
export function generatedProfile(f, re, kr, krPrime, samples = 1200) {
  const x = new Array(samples);
  const z = new Array(samples);
  const reach = Math.ceil((re * 2) / f) + 2;
  for (let i = 0; i < samples; i++) {
    const xi = (i / samples) * f;
    let best = Infinity;
    for (let k = -reach; k <= reach; k++) {
      const h = toolProfile(xi - k * f, re, kr, krPrime);
      if (h < best) best = h;
    }
    x[i] = xi;
    z[i] = best;
  }
  return { x, z };
}

/**
 * Geometric roughness of the generated profile.
 * Returns Rt, Ra, Rz (= Rt for a periodic profile) in µm, plus the
 * textbook arc-only values for comparison and a flag telling whether the
 * trailing edge takes part in the cusp (textbook formula then overestimates).
 */
export function geometricRoughness(f, re, kr = 95, krPrime = 5) {
  const { z } = generatedProfile(f, re, kr, krPrime);
  const n = z.length;
  let max = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    if (z[i] > max) max = z[i];
    sum += z[i];
  }
  const mean = sum / n;
  let dev = 0;
  for (let i = 0; i < n; i++) dev += Math.abs(z[i] - mean);
  const Ra = (dev / n) * 1000;
  const Rt = max * 1000;
  const b = Math.min(krPrime, 90) * (PI / 180);
  const a = Math.min(kr, 90) * (PI / 180);
  const arcOnly = f / 2 <= re * Math.sin(b) + 1e-12 && f / 2 <= re * Math.sin(a) + 1e-12;
  return {
    Rt,
    Rz: Rt,
    Ra,
    RtArc: rtArc(f, re),
    RaArc: raArc(f, re),
    arcOnly,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Round to a sensible number of significant digits for display. */
export function fmt(value, digits = 3) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  const magnitude = Math.floor(Math.log10(abs));
  const decimals = Math.max(0, digits - 1 - magnitude);
  return value.toFixed(Math.min(decimals, 4));
}

/* ------------------------------------------------------------------ */
/* Milling                                                              */
/* Sources: Sandvik Coromant "Formulas and definitions for milling"     */
/* (vf, Q, Pc, Mc); chip thickness from the circular-path model         */
/* h(φ) = fz · sin φ · sin κr, integrated over the engagement arc.       */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

/** Table feed vf [mm/min] = fz [mm] · zc · n [rpm]. */
export function tableFeed(fz, zc, n) {
  return fz * zc * n;
}

/** Metal removal rate in milling Q [cm³/min] = ap · ae · vf / 1000. */
export function millingRemovalRate(ap, ae, vf) {
  return (ap * ae * vf) / 1000;
}

/**
 * Engagement angle φe [deg].
 * mode 'side': cutter edge on the workpiece edge, radial engagement ae from that edge.
 * mode 'centre': cutter centred over a face of width ae.
 */
export function engagementAngle(ae, D, mode = 'side') {
  const r = Math.min(Math.max(ae / D, 0), 1);
  if (mode === 'centre') return (2 * Math.asin(r)) / DEG;
  return Math.acos(1 - 2 * r) / DEG;
}

/** Maximum chip thickness hex [mm]. */
export function maxChipThickness(fz, ae, D, kr = 90, mode = 'side') {
  const s = Math.sin(kr * DEG);
  const r = Math.min(Math.max(ae / D, 0), 1);
  if (mode === 'centre') return fz * s; // the arc always passes 90°
  if (r >= 0.5) return fz * s;
  return fz * s * Math.sqrt(1 - (1 - 2 * r) ** 2);
}

/** Mean (average) chip thickness hm [mm] over the engagement arc. */
export function meanChipThickness(fz, ae, D, kr = 90, mode = 'side') {
  const s = Math.sin(kr * DEG);
  const r = Math.min(Math.max(ae / D, 0), 1);
  if (r === 0) return 0;
  if (mode === 'centre') return (fz * s * r) / Math.asin(r);
  return (fz * s * 2 * r) / Math.acos(1 - 2 * r);
}

/** Feed per tooth that gives a target maximum chip thickness. */
export function feedForChipThickness(hexTarget, ae, D, kr = 90, mode = 'side') {
  const unit = maxChipThickness(1, ae, D, kr, mode);
  return unit > 0 ? hexTarget / unit : NaN;
}

/** Net milling power Pc [kW] = ae · ap · vf · kc / (60·10⁶). */
export function millingPower(ae, ap, vf, kc) {
  return (ae * ap * vf * kc) / 60e6;
}

/** Spindle torque Mc [N·m] from power Pc [kW] and n [rpm]: Pc · 30·10³ / (π · n). */
export function torqueFromPower(Pc, n) {
  return (Pc * 30e3) / (Math.PI * n);
}

/* ------------------------------------------------------------------ */
/* Drilling                                                             */
/* Sources: Iscar Drilling Handbook (MRR, Pnet = Fc·vc/60, T = Fc·D/2000 */
/* with Fc the force on one lip); two-lip twist drill, Kienzle per lip. */
/* ------------------------------------------------------------------ */

/** Removal rate in drilling Q [cm³/min] = D · fn · vc / 4. */
export function drillRemovalRate(vc, D, fn) {
  return (D * fn * vc) / 4;
}

/** Chip thickness per lip h [mm] = (fn / 2) · sin κr, κr = half the point angle. */
export function drillChipThickness(fn, pointAngle = 140) {
  return (fn / 2) * Math.sin((pointAngle / 2) * DEG);
}

/** Cutting force on one lip Fc [N] = kc · (fn / 2) · (D / 2). */
export function drillLipForce(kc, D, fn) {
  return kc * (fn / 2) * (D / 2);
}

/** Net drilling power Pc [kW] = Fc,lip · vc / 60 000. Equals fn·vc·D·kc / 240 000. */
export function drillPower(lipForce, vc) {
  return (lipForce * vc) / 60000;
}

/** Drilling torque Mc [N·m] = Fc,lip · D / 2000. */
export function drillTorque(lipForce, D) {
  return (lipForce * D) / 2000;
}
