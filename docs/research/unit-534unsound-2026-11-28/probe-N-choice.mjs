/**
 * unit-534unsound — PROBE, run BEFORE the pre-registration and declared in its §1.
 *
 * Its only job is to pick a branch for cure `N` whose fall-through the real corpus actually
 * reaches. It measures the published classifier's site distribution; it registers nothing and
 * grades nothing. Whatever it prints is declared as READ in PRE-REGISTRATION.md §1, so no
 * prediction in this unit may claim blindness to it.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const occ = (hay, needle) => hay.split(needle).length - 1;
const pad = (s, n) => String(s).padEnd(n, ' ');

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');

const sliceBetween = (text, a, b, label) => {
  for (const [n, lit] of [[`${label}.start`, a], [`${label}.end`, b]]) {
    const c = occ(text, lit);
    if (c !== 1) throw new Error(`anchor ${n} occurs ${c} times, not once`);
  }
  const i = text.indexOf(a);
  const j = text.indexOf(b);
  if (j <= i) throw new Error(`${label}: anchors out of order`);
  return text.slice(i, j);
};

const SLICED = sliceBetween(
  frozenText,
  "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];",
  '// ─── Arm B ',
  'SLICE',
);

const RETURN = `
  return { armA, keyIndirect, bindingOf, receiverSpan, corpus };
`;
// eslint-disable-next-line no-new-func
const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
  SLICED + RETURN);
const INST = f(stripSource, parenSpanEnd, sh, readFileSync, ROOT, []);

const RUN = INST.armA(INST.corpus);
console.log(`corpus ${INST.corpus.length} files · sites ${RUN.sites.length}`);

const tally = {};
for (const s of RUN.sites) tally[s.cls] = (tally[s.cls] || 0) + 1;
console.log('\nclass tally:');
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${pad(k, 20)}${v}`);
}

// For every candidate branch, how many of its sites would FALL THROUGH under a given inner guard?
const probes = [
  ['CALL', 'receiver matches /^[\\w$.]+\\s*\\($/', (s) => /^[\w$.]+\s*\($/.test(s.receiver)],
  ['CALL', 'receiver ends with ()', (s) => /\(\s*\)$/.test(s.receiver)],
  ['PROPERTY', 'exactly one dot', (s) => occ(s.receiver, '.') === 1],
  ['OTHER-BOUND', 'bindLine is non-null', (s) => s.bindLine !== null],
  ['RECEIVER-UNKEYED', 'receiver ends with ]', (s) => /\]$/.test(s.receiver)],
  ['UNRESOLVED', 'receiver is capitalised', (s) => /^[A-Z]/.test(s.receiver)],
];
console.log('\ncandidate inner guards — sites in the class, guard TRUE, guard FALSE (= would orphan):');
for (const [cls, desc, pred] of probes) {
  const rows = RUN.sites.filter((s) => s.cls === cls);
  const t = rows.filter(pred).length;
  console.log(`  ${pad(cls, 20)}${pad(desc, 40)}n=${pad(rows.length, 5)}true=${pad(t, 5)}false=${rows.length - t}`);
}

console.log('\nreceivers by class (first 12 each):');
for (const cls of ['CALL', 'PROPERTY', 'OTHER-BOUND', 'RECEIVER-UNKEYED', 'UNRESOLVED']) {
  const rows = RUN.sites.filter((s) => s.cls === cls);
  console.log(`  ${cls} (${rows.length}):`);
  for (const s of rows.slice(0, 12)) console.log(`    ${JSON.stringify(s.receiver)}`);
}
