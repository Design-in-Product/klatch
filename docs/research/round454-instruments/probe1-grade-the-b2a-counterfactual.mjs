// Round 454 — probe 1: does `B2a` actually redden if `class` is taken back out?
//
// Round 454 widened `probe-round303`'s `declaredNames` from `const|function` to
// `const|function|class` and added `B2a` to grade it. `B2a` passes. That on its own is worth
// nothing: a check added beside its own cure passes for both the reason I want and the reason I
// don't, and the only way to tell is to drive the counterfactual. A guard whose target is not
// asserted is a guard that has not been shown to move.
//
// So: lift the kind list and the two readers OUT of probe-round303's source — not retyped — and
// drive the KP bundle twice, once with the post-454 list and once with the pre-454 list. The gate
// requires BOTH arms to reach a verdict and the two verdicts to DIFFER on exactly the class row.

import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const SUBJECT = 'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts';
const src = execFileSync('cat', [`${ROOT}/${SUBJECT}`], { encoding: 'utf8', maxBuffer: 1 << 28 });

// The reader, built from the SAME expression the subject builds it from, with the kind list as a
// parameter — because a leg you cannot point at a counterfactual cannot be graded for vacuity.
const readerFor = (kinds) => (s) => {
  const out = new Set();
  const re = new RegExp(`^export\\s+declare\\s+(?:${kinds.join('|')})\\s+([A-Za-z0-9_$]+)`, 'gm');
  for (const m of s.matchAll(re)) out.add(m[1]);
  return [...out];
};

// The KP bundle sliced out of the subject rather than re-typed, so a divergence between the rows
// graded here and the rows the probe grades is unrepresentable.
const blind = stripSource(src, false); // strings KEPT — the KP rows ARE string literals
const anchor = 'const DECL_READER_KP: [string, string[]][] = [';
const i = blind.indexOf(anchor);
if (i === -1) throw new Error(`probe1: anchor not found in ${SUBJECT}`);
const close = blind.indexOf('\n];', i);
if (close === -1) throw new Error('probe1: KP array did not close');
const arraySrc = src.slice(i + anchor.length - 1, close + 2);
// eslint-disable-next-line no-new-func
const KP = new Function(`return ${arraySrc};`)();

// The modelled kind list, also sliced.
const kindsOf = (name) => {
  const m = new RegExp(`const ${name} = \\[([^\\]]*)\\]`).exec(src);
  if (m === null) throw new Error(`probe1: ${name} not found`);
  return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
};
const POST = kindsOf('DECLARED_KINDS_MODELLED');
const PRE = POST.filter((k) => k !== 'class'); // the pre-454 list, derived rather than typed

const run = (kinds) => {
  const read = readerFor(kinds);
  return KP.map(([s, want]) => {
    const got = read(s);
    return got.length === want.length && want.every((n) => got.includes(n));
  });
};
const post = run(POST);
const pre = run(PRE);

console.log(`probe1 — the B2a counterfactual.   subject ${SUBJECT}`);
console.log(`  modelled kinds POST-454: [${POST.join(', ')}]`);
console.log(`  modelled kinds PRE-454 : [${PRE.join(', ')}]   (derived by dropping \`class\`, not typed)`);
console.log(`  KP rows sliced from the subject: ${KP.length}`);
console.log('');
for (let n = 0; n < KP.length; n += 1) {
  console.log(`   row ${n} POST ${post[n] ? 'ok ' : 'BAD'}  PRE ${pre[n] ? 'ok ' : 'BAD'}  ${JSON.stringify(KP[n][0].slice(0, 52))} want [${KP[n][1]}]`);
}

const moved = KP.map((_, n) => post[n] !== pre[n]);
const classRows = KP.map(([s]) => /export declare class/m.test(s));
const GATE = [
  ['both arms reached a verdict on every row', post.length === KP.length && pre.length === KP.length],
  ['the POST arm is all-ok (which is what B2a reports)', post.every(Boolean)],
  ['the PRE arm is NOT all-ok — so B2a would have been RED before the widening',
    !pre.every(Boolean)],
  ['every row that MOVED is a row mentioning `export declare class`',
    moved.every((m, n) => !m || classRows[n])],
  ['at least one row moved (the figure is not identical across arms)', moved.some(Boolean)],
  ['the indentation row did NOT move (it pins a limit both lists share)',
    KP.findIndex(([s]) => /^\s+export/.test(s)) !== -1
      && moved[KP.findIndex(([s]) => /^\s+export/.test(s))] === false],
];
console.log('');
console.log('GATE');
let red = 0;
for (const [name, ok] of GATE) {
  console.log(`  ${ok === true ? 'ok ' : 'RED'}  ${name}`);
  if (ok !== true) red += 1;
}
console.log('');
console.log(`probe1 verdict: ${red === 0 ? 'ok' : `RED (${red})`}`
  + ` · rows ${KP.length} · POST ok ${post.filter(Boolean).length} · PRE ok ${pre.filter(Boolean).length}`
  + ` · moved ${moved.filter(Boolean).length}`);
if (red !== 0) process.exitCode = 1;
