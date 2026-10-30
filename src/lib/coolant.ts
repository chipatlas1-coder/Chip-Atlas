/**
 * Coolant concentration arithmetic.
 * Refractometer: concentration (%) = reading (°Brix) × the product's refractometer factor (Master Fluid Solutions TB 110).
 * Correcting a sump by volume balance, assuming volumes add: a sump of V litres at c1 % gets x litres of a fluid at
 * cA % (100 for neat concentrate, the premix strength for premix, 0 for water) and ends at c2 %:
 *   (V·c1 + x·cA) / (V + x) = c2   →   x = V · (c2 − c1) / (cA − c2)
 * x < 0 or an impossible target (cA on the wrong side of c2) returns NaN.
 */
export const concentration = (reading: number, factor: number) => reading * factor;
export const readingFor = (conc: number, factor: number) => conc / factor;
export function addFor(V: number, c1: number, c2: number, cA: number) {
  if (c2 === cA) return NaN;
  const x = (V * (c2 - c1)) / (cA - c2);
  return x >= 0 ? x : NaN;
}
export const mixed = (V: number, c1: number, x: number, cA: number) => (V * c1 + x * cA) / (V + x);
