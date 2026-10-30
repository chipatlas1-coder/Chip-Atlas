// Micrometer reading: breakdown, parsing, formatting, diagnosis, random rounds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECS, reading, breakdown, sumTerms, parse, fmt, fmtShort, diagnose, buildRound, randomInC, sleeveLabel, partFits } from '../src/lib/micrometer.ts';

const mm = SPECS.mm, inch = SPECS.in;
const terms = (r) => Object.fromEntries(breakdown(r).map((t) => [t.kind, t]));

// a seeded generator so the random tests are repeatable
const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

test('metric: the user’s example, 30 + 3 + 0.5 + 0.15 = 33.65 on a 25–50 sleeve numbered 25 … 50', () => {
  const r = reading('mm', 25, 'abs', 865);                      // 33.65 − 25 = 8.65 mm past the base
  assert.equal(r.valC, 3365);
  const t = terms(r);
  assert.equal(t.base, undefined);
  assert.equal(t.numbered.label, '30'); assert.equal(t.numbered.c, 3000);
  assert.equal(t.lines.n, 3); assert.equal(t.lines.c, 300);
  assert.equal(t.half.c, 50);
  assert.equal(t.thimble.c, 15);
  assert.equal(sumTerms(breakdown(r)), 3365);
});

test('metric: the same micrometer with a 0–25 sleeve adds the frame base first', () => {
  const r = reading('mm', 25, 'rel', 865);
  const t = terms(r);
  assert.equal(t.base.c, 2500); assert.equal(t.numbered.label, '5'); assert.equal(t.numbered.c, 500);
  assert.equal(sumTerms(breakdown(r)), 3365);
});

test('metric worked examples from the sources: 5.85 mm (MEB) and 23.71 mm (Ankara)', () => {
  let t = terms(reading('mm', 0, 'rel', 585));
  assert.deepEqual([t.numbered.c, t.lines.c, t.half.c, t.thimble.c], [500, 0, 50, 35]);
  t = terms(reading('mm', 0, 'rel', 2371));
  assert.deepEqual([t.numbered.c, t.lines.c, t.half.c, t.thimble.c], [2000, 300, 50, 21]);
});

test('inch worked examples from NPL: 0.239 in and 0.361 in', () => {
  let t = terms(reading('in', 0, 'rel', 239));
  assert.deepEqual([t.numbered.label, t.lines.n, t.thimble.c], ['2', 1, 14]);
  t = terms(reading('in', 0, 'rel', 361));
  assert.deepEqual([t.numbered.label, t.lines.n, t.thimble.c], ['3', 2, 11]);
  assert.equal(terms(reading('in', 0, 'rel', 361)).half, undefined);
});

test('inch 1–2 in frame: base + 0.2 + 3 × 0.025 + 0.012 = 1.287 in', () => {
  const r = reading('in', 1, 'rel', 287);
  const t = terms(r);
  assert.equal(t.base.c, 1000); assert.equal(t.numbered.c, 200); assert.equal(t.lines.c, 75); assert.equal(t.thimble.c, 12);
  assert.equal(r.valC, 1287); assert.equal(sumTerms(breakdown(r)), 1287);
  const a = reading('in', 1, 'abs', 287);
  assert.equal(terms(a).base, undefined); assert.equal(terms(a).numbered.c, 1200); assert.equal(sumTerms(breakdown(a)), 1287);
});

test('every reading in every frame breaks down to itself', () => {
  for (const unit of ['mm', 'in']) {
    const s = SPECS[unit];
    for (const base of s.bases) for (const style of ['rel', 'abs']) for (let c = 0; c <= s.span; c++) {
      const r = reading(unit, base, style, c);
      assert.equal(sumTerms(breakdown(r)), r.valC);
      const t = terms(r);
      assert.ok(t.lines.n >= 0 && t.lines.n < s.numbered / s.line);
      assert.ok(t.thimble.c >= 0 && t.thimble.c < s.rev);
    }
  }
});

test('a frame without a base has one sleeve style only', () => {
  assert.equal(reading('mm', 0, 'abs', 500).style, 'rel');
});

test('sleeve labels', () => {
  assert.equal(sleeveLabel(mm, 50, 'abs', 1), '55'); assert.equal(sleeveLabel(mm, 50, 'rel', 1), '5');
  assert.equal(sleeveLabel(inch, 0, 'rel', 3), '3'); assert.equal(sleeveLabel(inch, 0, 'rel', 10), '1');
});

test('parse and format', () => {
  assert.equal(parse(mm, '57,88'), 5788); assert.equal(parse(mm, '57.8'), 5780); assert.equal(parse(mm, '7'), 700);
  assert.equal(parse(mm, '57.885'), null); assert.equal(parse(mm, 'abc'), null); assert.equal(parse(mm, ''), null); assert.equal(parse(mm, '.'), null);
  assert.equal(parse(inch, '.287'), 287); assert.equal(parse(inch, '1,287'), 1287); assert.equal(parse(inch, '0.2871'), null);
  assert.equal(fmt(mm, 3365, 'tr'), '33,65'); assert.equal(fmt(inch, 1287, 'en'), '1.287');
  assert.equal(fmtShort(mm, 50, 'tr'), '0,5'); assert.equal(fmtShort(inch, 75), '0.075'); assert.equal(fmtShort(mm, 3000), '30'); assert.equal(fmtShort(mm, 0), '0');
});

test('diagnosis: forgot the base, added it twice, half line, one division', () => {
  const rel = reading('mm', 50, 'rel', 788);                    // 57.88 on a 0–25 sleeve
  assert.equal(diagnose(rel, 5788), null);
  assert.equal(diagnose(rel, 788), 'forgotBase');
  assert.equal(diagnose(rel, 738), 'forgotBaseMore');
  const abs = reading('mm', 50, 'abs', 788);
  assert.equal(diagnose(abs, 10788), 'doubleBase');
  assert.equal(diagnose(abs, 5738), 'half');
  assert.equal(diagnose(abs, 5787), 'one');
  assert.equal(diagnose(abs, 5780), 'thimble');
  // thimble at 45: the next half line is close to the edge but not yet uncovered
  assert.equal(diagnose(reading('mm', 0, 'rel', 745), 795), 'halfHigh');
  // thimble at 3: the line at the edge has just been uncovered
  assert.equal(diagnose(reading('mm', 0, 'rel', 753), 703), 'halfLow');
  // thimble at 4 just past a whole millimetre: the reader missed the line at the edge
  assert.equal(diagnose(reading('mm', 0, 'rel', 804), 704), 'mmLow');
  assert.equal(diagnose(reading('mm', 0, 'rel', 840), 740), 'mm');
  // a sleeve numbered with the actual size, read as if it started from 0
  assert.equal(diagnose(reading('mm', 50, 'abs', 788), 788), 'droppedBase');
});

test('diagnosis: inch line counting and the numbered digit', () => {
  const r = reading('in', 0, 'rel', 287);
  assert.equal(diagnose(r, 262), 'line'); assert.equal(diagnose(r, 187), 'tenth');
  assert.equal(diagnose(reading('in', 0, 'rel', 222), 247), 'lineHigh');
  assert.equal(diagnose(reading('in', 0, 'rel', 252), 227), 'lineLow');
  assert.equal(diagnose(reading('in', 1, 'rel', 287), 287), 'forgotBase');
});

test('random readings stay inside the frame and rounds are balanced', () => {
  const rnd = lcg(7);
  for (let i = 0; i < 2000; i++) {
    const c = randomInC(mm, i % 2 === 0, rnd); assert.ok(c >= 20 && c <= 2480);
    const ci = randomInC(inch, i % 2 === 0, rnd); assert.ok(ci >= 10 && ci <= 990);
  }
  for (const unit of ['mm', 'in']) {
    const q = buildRound(unit, 'mix', 'mix', lcg(3));
    assert.equal(q.length, 10);
    const s = SPECS[unit];
    for (const b of s.bases) assert.equal(q.filter((x) => x.base === b).length, 2);
    const withBase = q.filter((x) => x.base > 0);
    assert.equal(withBase.filter((x) => x.style === 'rel').length, withBase.length / 2);
    for (const x of q) assert.ok(partFits(x.part, (x.valC / s.q) * s.mmPerUnit, (x.base + s.rangeLen) * s.mmPerUnit) || x.part === 'block');
  }
  const only = buildRound('mm', 2, 'abs', lcg(5));
  assert.ok(only.every((x) => x.base === 50 && x.style === 'abs'));
});
