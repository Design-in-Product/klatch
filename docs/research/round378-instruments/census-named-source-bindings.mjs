// Round 378 — v2 of the bindings detector. v1 returned 5 with `probe-round269` MISSING, because
// both of its known positives carried the same `const R225 = '…'` indirection the five files I had
// already looked at use, and 269 spells the binding with the filename INLINE:
//
//   v1's shape (372/373/374/375/377):  const R225 = 'probe-round225-….mts';
//                                      const r225Src = readFileSync(join(HERE, R225), 'utf8');
//   269's shape (lines 1138, 1289):    readFileSync(join(REPO, 'scripts', 'probe-round225-….mts'), 'utf8')
//
// So v1 failed downward, which is the only direction a source-scanning key fails. v2 takes both
// shapes and carries a known positive for EACH, plus the known negatives that must stay out:
// a population loop (`entry.file`), a declared member list (`{ file: 'probe-round255-….mts' }`,
// compared as a string and never read), and a named-but-unread const.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';
const m = await import('../../../scripts/sweep-probes.mjs');
const HERE = 'scripts';
const censusPop = readdirSync(HERE).filter((f) => /^probe-/.test(f)).sort();

const namedBindings = (src, ownFile, pop = censusPop) => {
  const code = stripSource(src, false); // comments blanked, string literals kept
  const out = new Set();
  const others = pop.filter((f) => f !== ownFile);

  // shape 1 — inline: the literal filename appears inside a readFileSync(...) call's argument text
  for (const mt of code.matchAll(/readFileSync\s*\(([\s\S]{0,200}?)\)/g)) {
    for (const f of others) if (mt[1].includes(f)) out.add(f);
  }
  // shape 2 — indirection: const IDENT = '<literal>', and IDENT reaches a readFileSync argument
  for (const mt of code.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]\s*;/g)) {
    const [, ident, literal] = mt;
    if (!others.includes(literal)) continue;
    const reach = new RegExp('readFileSync\\s*\\([^)]{0,200}\\b' + ident + '\\b');
    if (reach.test(code)) out.add(literal);
  }
  return [...out];
};

// ── grade the detector before believing any live figure ──────────────────────────────────────
const P225 = 'probe-round225-a-citation-is-not-a-call.mts';
const P255 = 'probe-round255-the-comment-shadow-census.mts';
const POP = [P225, P255, 'probe-self.mts'];
const cases = [
  // known positives — one per real shape, copied from the real call sites
  [`const r225 = stripSource(readFileSync(join(REPO, 'scripts', '${P225}'), 'utf8'), false);`, 1, 'KP inline (269:1138)'],
  [`const R225 = '${P225}';\nconst r225Src = readFileSync(join(HERE, R225), 'utf8');`, 1, 'KP indirection (372:72)'],
  // known negatives — the three ways a probe names another probe WITHOUT binding its source
  [`for (const entry of SWEPT) { const raw = readFileSync(join(REPO, 'scripts', entry.file), 'utf8'); }`, 0, 'KN population loop'],
  [`const DECLARED = [{ file: '${P255}', rendered: 'MEAS [A] files walked: 194' }];`, 0, 'KN declared member list'],
  [`const R225 = '${P225}';\nconsole.log(R225);`, 0, 'KN named but never read'],
];
let graded = true;
for (const [src, want, label] of cases) {
  const got = namedBindings(src, 'probe-self.mts', POP).length;
  const ok = got === want;
  if (!ok) graded = false;
  console.log((ok ? '  ok  ' : ' FAIL ') + label + ' — want ' + want + ', got ' + got);
}
console.log('detector graded on 2 known positives + 3 known negatives: ' + graded);
if (graded !== true) {
  console.log('GRADE is not true — refusing to publish a figure (356)');
  process.exit(1);
}

// ── the live reading ─────────────────────────────────────────────────────────────────────────
const members = [];
for (const e of m.SWEPT) {
  const b = namedBindings(readFileSync(join(HERE, e.file), 'utf8'), e.file);
  if (b.length) members.push([e.file, b]);
}
console.log('\nSWEPT entries binding another NAMED probe source: ' + members.length + ' of ' + m.SWEPT.length);
for (const [f, b] of members) {
  console.log('   ' + (f.match(/^probe-round(\d+[a-z]?)/) ?? [, '?'])[1].padStart(4) + '  binds ' +
    b.map((x) => (x.match(/^probe-round(\d+[a-z]?)/) ?? [, x])[1]).join(', '));
}
const mine = members.map(([f]) => (f.match(/^probe-round(\d+[a-z]?)/) ?? [, '?'])[1]);
const his = ['269', '372', '373', '374', '375'];
console.log('\nhis list  (pre-promotion, + 377 as "the 6th"): ' + his.join(', '));
console.log('mine      (live, 377 present in SWEPT)       : ' + mine.join(', '));
console.log('his ∪ 377 vs mine — identical: ' + ([...his, '377'].join(',') === mine.join(',')));
