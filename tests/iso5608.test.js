// ISO 5608 tool holder designations: the parser against the worked examples of ISO 5610 and ISO 5608.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHolderCode, styles, lengths, clamping, qualified } from '../src/data/iso5608.js';

test('ISO 5610-7:2014 example 1: SDJCR 1010 E07', () => {
  const p = parseHolderCode('SDJCR 1010 E07');
  assert.equal(p.kind, 'holder');
  assert.deepEqual([p.clamp, p.shape, p.style, p.clearance, p.hand], ['S', 'D', 'J', 'C', 'R']);
  assert.equal(p.height, 10); assert.equal(p.width, 10);
  assert.equal(p.length, 70);
  assert.equal(p.edgeLength, 7.75);
  assert.equal(p.kr, 93);
  assert.equal(p.minor, 32);                         // 180 − 93 − 55
  assert.equal(p.insert, 'DC·· 07');
});

test('ISO 5610-7:2014 examples 2 and 3: PTJNR 3225 P16, SVJBR 2020 K16', () => {
  const a = parseHolderCode('PTJNR 3225 P16');
  assert.equal(a.height, 32); assert.equal(a.width, 25);   // height first, then width
  assert.equal(a.length, 170); assert.equal(a.edgeLength, 16.5);
  const b = parseHolderCode('svjbr2020k16');
  assert.equal(b.length, 125); assert.equal(b.edgeLength, 16.6);
  assert.equal(b.minor, 52);                         // 180 − 93 − 35
});

test('ISO 5610-2:2014 examples: SCACR 1010 E06, PTANR 3225 P16', () => {
  const a = parseHolderCode('SCACR 1010 E06');
  assert.equal(a.kr, 90); assert.equal(styles.A.shank, 'straight'); assert.equal(a.edgeLength, 6.4);
  const b = parseHolderCode('PTANR 3225 P16');
  assert.equal(b.length, 170);
});

test('ISO 5608:1995 example with a qualified tool: CTGNR 3225 M16 Q', () => {
  const p = parseHolderCode('C T G N R 32 25 M 16 Q');
  assert.equal(p.clamp, 'C'); assert.equal(clamping.C.hole, false);
  assert.equal(p.style, 'G'); assert.equal(styles.G.shank, 'offset');
  assert.equal(p.length, 150);
  assert.equal(p.qualified, 'Q'); assert.ok(qualified.Q);
});

test('catalogue forms: PCLNR 2525M 12, Mitsubishi thickness suffix, Sandvik hyphen, non-ISO D', () => {
  const p = parseHolderCode('PCLNR 2525M 12');
  assert.equal(p.kr, 95); assert.equal(p.minor, 5); assert.equal(p.edgeLength, 12.9);
  const q = parseHolderCode('PCLNR 25 25 M 12 04');
  assert.equal(q.suffix, '04'); assert.equal(q.qualified, null);
  const s = parseHolderCode('DCLNR 2020-K12');
  assert.equal(s.length, 125); assert.equal(s.known.clamp, false); assert.equal(s.known.clampNonIso, true);
  const t = parseHolderCode('PCLNR2525M12-A7');
  assert.equal(t.suffix, 'A7');
});

test('trigon and neutral holders: MWLNR 2525M08, SVVBN 2525M16', () => {
  const w = parseHolderCode('MWLNR 2525M08');
  assert.equal(w.edgeLength, 8.7); assert.equal(w.minor, 5);   // WNMG in a 95° holder
  const n = parseHolderCode('SVVBN 2525M16');
  assert.equal(n.hand, 'N'); assert.equal(n.minor, null); assert.equal(n.kr, 72.5);
});

test('cartridge: PTFNR 10CA11', () => {
  const c = parseHolderCode('PTFNR 10CA11');
  assert.equal(c.kind, 'cartridge');
  assert.equal(c.height, 10); assert.equal(c.cartridge, 'A');
  assert.equal(c.length, null); assert.equal(c.edgeLength, 11.0);
});

test('length letters follow ISO 5608 Table 6 and skip I and O', () => {
  assert.equal(lengths.K, 125); assert.equal(lengths.M, 150); assert.equal(lengths.Y, 500);
  assert.equal('I' in lengths, false); assert.equal('O' in lengths, false);
  assert.equal(lengths.X, null);
});

test('non-ISO style Q is read with its catalogue angle and flagged', () => {
  const p = parseHolderCode('SVQBR 2020 K16');
  assert.equal(p.known.style, false); assert.equal(p.known.styleNonIso, true); assert.equal(p.kr, 107.5);
});

test('an insert code is not a holder code', () => {
  assert.equal(parseHolderCode('CNMG 12 04 08'), null);
  assert.equal(parseHolderCode(''), null);
});
