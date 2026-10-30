/**
 * Helpers for figures that animate once when they scroll into view.
 * html.anim is set in the page head only when motion is allowed; the observer in Base
 * adds [data-in] to every [data-anim] element on entry and fires an `anim:in` event.
 */
const animOn = () => document.documentElement.classList.contains('anim');

/** Run fn once, after the element has entered the view (and only with motion on). */
export function whenIn(el: Element, fn: () => void) {
  let done = false;
  const go = () => { if (!done && animOn()) { done = true; requestAnimationFrame(() => requestAnimationFrame(fn)); } };
  if (el.hasAttribute('data-in')) go();
  el.addEventListener('anim:in', go);
}

/** Start the SMIL animations inside el (they are declared with begin="indefinite"). */
export function beginSmil(el: Element, sel = 'animate, animateMotion, animateTransform') {
  el.querySelectorAll<SVGAnimationElement>(sel).forEach((a) => { try { a.beginElement(); } catch { /* not supported */ } });
}

/** Count the first number in el's text up from zero, keeping its decimals and decimal mark. */
export function countUp(el: Element, ms = 700, delay = 0) {
  const text = el.textContent ?? '';
  const m = text.match(/(\d[\d.,]*)/);
  if (!m) return;
  const raw = m[1];
  const comma = /,\d+$/.test(raw) && !/\.\d{3}/.test(raw);
  const dec = raw.match(/[.,](\d+)$/)?.[1].length ?? 0;
  const value = Number(comma ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, ''));
  if (!Number.isFinite(value)) return;
  const pre = text.slice(0, m.index), post = text.slice((m.index ?? 0) + raw.length);
  const fmt = (v: number) => { const s = v.toFixed(dec); return comma ? s.replace('.', ',') : s; };
  const t0 = performance.now() + delay;
  el.textContent = pre + fmt(0) + post;
  const step = (t: number) => {
    const k = Math.min(1, Math.max(0, (t - t0) / ms));
    if (k >= 1) { el.textContent = text; return; }
    el.textContent = pre + fmt(value * (1 - (1 - k) ** 3)) + post;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
