/**
 * Jaw-chuck gripping force against spindle speed. The jaws are masses on a turning body, so each pulls outwards with
 * the centrifugal force F = m · r · ω², ω = π · n / 30 (n in min⁻¹). Summed over the jaws, with m in kg and r in m:
 *   Fc = Σ (m · r) · (π · n / 30)²   [N]
 * Gripping from outside (OD), the jaws are pulled off the work: Fsp(n) = Fsp0 − Fc. Gripping from inside (ID), they
 * are pressed onto it: Fsp(n) = Fsp0 + Fc. Here Σ(m · r) is per chuck, i.e. already summed over the jaws.
 */
export const omega = (n: number) => (Math.PI * n) / 30;
/** Centrifugal force of all jaws in N; mr = Σ m·r in kg·m. */
export const centrifugal = (mr: number, n: number) => mr * omega(n) ** 2;
/** Dynamic gripping force in N; Fsp0 static gripping force in N; od = gripping from outside. */
export const gripping = (Fsp0: number, mr: number, n: number, od = true) => Fsp0 + (od ? -1 : 1) * centrifugal(mr, n);
/** Speed at which the OD gripping force has fallen to a given force F (N), e.g. the force the cut needs × a safety factor. */
export const speedFor = (Fsp0: number, mr: number, F: number) => (F >= Fsp0 ? 0 : (30 / Math.PI) * Math.sqrt((Fsp0 - F) / mr));
/** Σ m·r for z equal jaws of mass m (kg) whose centre of mass sits at radius r (mm). */
export const jawMoment = (z: number, m: number, rMm: number) => z * m * (rMm / 1000);

/** Speed at which the jaws' centrifugal force reaches a share of the static force (e.g. 2/3). */
export const speedAtShare = (Fsp0: number, mr: number, share: number) => (30 / Math.PI) * Math.sqrt((share * Fsp0) / mr);
/**
 * Permissible speed for a given static force, gripping from outside, rearranged from the makers' equations:
 * Fsp = Fspz · Sz (force the cut needs, with the machining safety factor) and Fsp0 = Ssp · (Fsp + Fc) (static force with
 * the clamping safety factor), with Fc = Σ(m·r) · ω²:  n = (30/π) · √((Fsp0/Ssp − Fspz·Sz) / Σ(m·r)). 0 if never enough.
 */
export const permissibleSpeed = (Fsp0: number, mr: number, Fspz: number, Sz = 1.5, Ssp = 1.5) => {
  const room = Fsp0 / Ssp - Fspz * Sz;
  return room <= 0 ? 0 : (30 / Math.PI) * Math.sqrt(room / mr);
};
