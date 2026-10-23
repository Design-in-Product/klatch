/**
 * Round 438 — the hand reading, kept because for a population of three findings the hand reading is
 * primary and the grader's job is to GRADE it. Every row is driven at the real entry point
 * (`conventionOf` on a whole function source), and the pre-cure side is the committed slice, not a
 * re-typed copy.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const live = await import(join(REPO, 'docs/research/round430-instruments/refusal-convention.mjs'));
const pre = await import(join(REPO, 'docs/research/round436-instruments/precure-refusal-convention.sliced.mjs'));

const BODY = (ret) => `
  const CONST = 'ZZZZ';
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
`;
const SUBJ = (ret) => `function read(src) {${BODY(ret)}}`;
const adm = (c) => (c === null || c === undefined ? null : c.refused === undefined);

const rows = [
  ['F1 fn expr name', '{ span: function src() { return 1; } }'],
  ['F1 gen expr name', '{ span: function* src() { return 1; } }'],
  ['F1 async fn name', '{ span: async function src() { return 1; } }'],
  ['F1 class expr name', '{ span: class src { m() { return 1; } } }'],
  ['F1 ctl fn q', '{ span: function q() { return 1; } }'],
  ['F1 ctl gen q', '{ span: function* q() { return 1; } }'],
  ['F1 ctl async q', '{ span: async function q() { return 1; } }'],
  ['F1 ctl class q', '{ span: class q { m() { return 1; } } }'],
  ['F1 ref plain', '{ span: src }'],
  ['F1 ref slice', '{ span: src.slice(0, 1) }'],
  ['F1 anon extends', '{ span: class extends Object { m() { return src; } } }'],
  ['F2 class src first', '{ span: class { src() { return 1; } a() { return 2; } } }'],
  ['F2 class src second', '{ span: class { a() { return 1; } src() { return 2; } } }'],
  ['F2 class semi', '{ span: class { a() { return 1; }; src() { return 2; } } }'],
  ['F2 class neither', '{ span: class { a() { return 1; } q() { return 2; } } }'],
  ['F2 obj src first', '{ span: { src() { return 1; }, a() { return 2; } } }'],
  ['F2 obj src second', '{ span: { a() { return 1; }, src() { return 2; } } }'],
  ['stmt call ctl', '{ f: () => { src(1); } }'],
  ['stmt call multi', '{ f: () => { other(1); src(2); } }'],
  ['stmt call param', '{ f: (a) => { src(a); } }'],
  ['cured 435 method', '{ span: { src() { return 1; } } }'],
  ['cured 435 spread', '{ span: { ...src } }'],
  ['435 opts dot src', '{ span: { a: opts . src } }'],
  ['F3 ASI block', '{ f: () => { src(1)\n  { let x = 1; } } }'],
];

for (const [label, ret] of rows) {
  const s = SUBJ(ret);
  console.log(`${label.padEnd(22)} live=${String(adm(live.conventionOf(s))).padEnd(6)} `
    + `pre436=${String(adm(pre.conventionOf(s))).padEnd(6)} mentions=${live.mentionsParam(ret, ['src'])}`);
}
console.log('\n--- masker output, his Finding 2 rows ---');
for (const [label, ret] of rows.slice(11, 17)) {
  console.log(`${label.padEnd(22)} ${live.maskKeyPositions(ret)}`);
}
