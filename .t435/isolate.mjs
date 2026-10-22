// Isolate the two candidates at the exported function that owns each, not through conventionOf.
const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const LIVE = await import(`${REPO}/docs/research/round430-instruments/refusal-convention.mjs`);
const PRE = await import(`${REPO}/docs/research/round434-instruments/precure-refusal-convention.sliced.mjs`);

console.log('=== A. mentionsParam on a SPREAD of the parameter ===');
const A = [
  ['{ ...src }', 'spread of the input — a free reference'],
  ['{ ...src, a: 1 }', 'spread plus an entry'],
  ['[...src]', 'array spread of the input'],
  ['f(...src)', 'call spread of the input'],
  ['{ ...o.src }', "CONTROL: spread of someone else's property"],
  ['{ a: src }', 'CONTROL: a plain reference'],
  ['{ a: opts.src }', 'CONTROL: a property access — must stay false'],
];
for (const [v, note] of A) {
  const live = LIVE.mentionsParam(v, ['src']);
  const pre = PRE.mentionsParam(v, ['src']);
  console.log(`  pre ${String(pre).padEnd(5)} live ${String(live).padEnd(5)}  ${v.padEnd(16)}  ${note}`);
}

console.log('');
console.log('=== B. maskKeyPositions on property names that are NOT written `key:` ===');
const B = [
  ['{ src: 1 }', 'his cell — a plain key', true],
  ['{ src() { return 1; } }', 'METHOD SHORTHAND named like the param', false],
  ['{ get src() { return 1; } }', 'GETTER named like the param', false],
  ['{ set src(v) { } }', 'SETTER named like the param', false],
  ['{ async src() { return 1; } }', 'ASYNC METHOD named like the param', false],
  ['{ *src() { yield 1; } }', 'GENERATOR METHOD named like the param', false],
  ['{ src }', 'CONTROL: ES6 shorthand — IS a real reference, must survive', false],
  ['{ a: src }', 'CONTROL: a value reference, must survive', false],
];
for (const [v, note] of B) {
  const masked = LIVE.maskKeyPositions(v);
  const blanked = masked !== v;
  const mentions = LIVE.mentionsParam(v, ['src']);
  console.log(`  blanked ${String(blanked).padEnd(5)} mentionsParam ${String(mentions).padEnd(5)} ${v.padEnd(28)} ${note}`);
  if (blanked) console.log(`        masked: ${JSON.stringify(masked)}`);
}

console.log('');
console.log('=== B reached through conventionOf: is the §1 hole still open via a method name? ===');
const SUBJ = (ret) => `function read(src) {
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
}`;
const adm = (c) => (c === null ? null : c.refused === undefined);
for (const ret of [
  '{ span: { src: 1 } }',
  '{ span: { src() { return 1; } } }',
  '{ span: { get src() { return 1; } } }',
  '{ span: { q() { return 1; } } }',
]) {
  const p = PRE.conventionOf(SUBJ(ret));
  const l = LIVE.conventionOf(SUBJ(ret));
  console.log(`  pre ${String(adm(p)).padEnd(5)} cured ${String(adm(l)).padEnd(5)}  ${ret}`);
}
