// Grade the cured `mentionsParam` against a RUNTIME oracle rather than against my reading of the
// source: build the function, call it with several inputs, and see whether the answer value
// actually changes. A value that changes with the input IS input-derived; one that never changes
// over every input is not. That is the property the module's answer-shape leg is trying to read
// off source text, so disagreement between the two is a defect with a direction.
const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const LIVE = await import(`${REPO}/docs/research/round430-instruments/refusal-convention.mjs`);
const PRE = await import(`${REPO}/docs/research/round434-instruments/precure-refusal-convention.sliced.mjs`);

const SUBJ = (ret) => `function read(src) {
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
}`;

const SHAPES = [
  // --- shapes his 7-cell §1 matrix has ---
  ['{ span: { src: 1 } }', 'his cell 1'],
  ['{ span: { q: 1 } }', 'his control'],
  ['{ span: { from: src.length } }', 'his over-reach 1'],
  ['{ span: { src: src.length } }', 'his over-reach 2'],
  ['{ span: { a: src === 1 ? src : 0 } }', 'his over-reach 3'],
  ['{ span: (x) => { return src; } }', 'his over-reach 4 (arrow block)'],
  // --- shapes it does NOT have ---
  ['{ span: { src } }', 'ES6 SHORTHAND — key and value are the same token'],
  ['{ span: { ...src } }', 'spread of the input'],
  ['{ span: { a: 1, src } }', 'shorthand after a keyed entry'],
  ['{ span: { src, a: 1 } }', 'shorthand before a keyed entry'],
  ['{ span: [{ src: 1 }] }', 'key inside an array element'],
  ['{ span: [{ a: src }] }', 'value inside an array element'],
  ['{ span: { get src() { return 1; } } }', 'getter named like the param'],
  ['{ span: { src() { return 1; } } }', 'method shorthand named like the param'],
  ['{ span: { a: { b: { src: 1 } } } }', 'key three levels deep'],
  ['{ span: { a: 1, b: 2, src: 3 } }', 'key as the THIRD entry'],
  ['{ span: { "src": 1 } }', 'string key spelled like the param'],
  ['{ span: { a: [1, 2].map((src2) => src2) } }', 'a shadowing arrow param, input unread'],
  ['{ span: { label: 1, a: src } }', 'key named `label` plus a real read'],
  ['{ span: src && { src: 1 } }', 'key under a short-circuit on the input'],
  ['{ span: { a: `${src}` } }', 'template interpolation of the input'],
  ['{ span: { a: /src/.test("src") } }', 'the name only inside a regex body'],
  ['{ span: { a: "src" } }', 'the name only inside a string body'],
  ['{ span: { a: 1 }, len: src.length }', 'key in one entry, real read in a sibling'],
  ['{ span: { [src]: 1 } }', 'the input as a COMPUTED key'],
  ['{ span: { [`${src}`]: 1 } }', 'the input as a computed template key'],
  ['{ span: (() => { src: for (;;) { break src; } return 1; })() }', 'LABEL spelled like the param'],
  ['{ span: ((o) => { switch (o) { default: return src; } })(1) }', 'read after a `default:`'],
  ['{ span: { a: ((p = src) => p)() } }', 'input as an arrow default'],
  ['{ span: { a: 1, b: cond ? 2 : src } }', 'read in a later entry ternary'],
];

const INPUTS = ['abc', 'defgh', 'ij', 'klmnopq'];
const show = (v) => { try { return JSON.stringify(v); } catch { return String(v); } };

// The oracle: does the answer value actually change with the input?
const oracle = (ret) => {
  let fn;
  try { fn = new Function('src', `const cond = true; const k = 'kk';\n  ${SUBJ(ret).replace(/^function read\(src\) \{/, '').replace(/\}$/, '')}`); } catch (e) { return { err: `build: ${e.message}` }; }
  const outs = [];
  for (const i of INPUTS) {
    try { outs.push(show(fn(i))); } catch (e) { return { err: `call: ${e.message}` }; }
  }
  return { derived: new Set(outs).size > 1, outs };
};

const admitted = (c) => (c === null ? null : c.refused === undefined);
const rows = [];
for (const [ret, note] of SHAPES) {
  const o = oracle(ret);
  const a = PRE.conventionOf(SUBJ(ret));
  const b = LIVE.conventionOf(SUBJ(ret));
  rows.push({
    ret, note, o, pre: admitted(a), cured: admitted(b),
    preR: a?.refused, curedR: b?.refused,
  });
}

const w = Math.max(...rows.map((r) => r.ret.length));
console.log('ORACLE = does the returned value actually change across 4 inputs at runtime');
console.log('');
for (const r of rows) {
  const orc = r.o.err ? `ERR(${r.o.err.slice(0, 28)})` : (r.o.derived ? 'DERIVED  ' : 'not-derived');
  const flag = r.o.err ? '    ' : (r.o.derived === r.cured ? 'ok  ' : 'MISM');
  console.log(`${flag} oracle ${orc}  pre ${String(r.pre).padEnd(5)} cured ${String(r.cured).padEnd(5)}  ${r.ret.padEnd(w)}  ${r.note}`);
  if (flag === 'MISM') {
    console.log(`       cured reason: ${String(r.curedR).slice(0, 110)}`);
    console.log(`       runtime outs: ${r.o.outs.map((x) => String(x).slice(0, 24)).join(' | ')}`);
  }
}
const graded = rows.filter((r) => !r.o.err);
const mism = graded.filter((r) => r.o.derived !== r.cured);
const moved = rows.filter((r) => r.pre !== r.cured);
console.log('');
console.log(`shapes ${rows.length} · oracle-gradable ${graded.length} · oracle-ungradable ${rows.length - graded.length}`);
console.log(`MISMATCHES vs oracle (cured): ${mism.length}`);
console.log(`  over-refusal  (oracle DERIVED, cured refused): ${mism.filter((r) => r.o.derived).length}`);
console.log(`  under-refusal (oracle not-derived, cured admitted): ${mism.filter((r) => !r.o.derived).length}`);
console.log(`moved by the cure (pre !== cured): ${moved.length} — ${moved.map((r) => r.ret).join(' ║ ')}`);
