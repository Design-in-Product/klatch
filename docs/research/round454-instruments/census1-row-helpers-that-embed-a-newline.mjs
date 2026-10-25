// Round 454 — census 1: how many round-instrument row helpers embed a newline in a row detail?
//
// This exists because my first version of §1's figure was an inline `grep -rn "legs.push({"` over
// the WORKING TREE, run AFTER I had already repaired 449. It reported "21 helpers, exactly one
// embeds a newline" and every part of that was wrong:
//
//   * the working tree no longer contains the defect (I had cured it), so the single hit it found
//     was my own README quoting the pre-repair line back — prose written beside its own cure needs
//     a pin (memory: a pin on a count reddens on its own promotion);
//   * `legs.push({` is one of TWO row-helper tokens — `preds.push({` is the other, and in 449 the
//     newline is in BOTH helpers, so a one-token key under-reports by half;
//   * `grep -rn docs/research/` includes `.md` files, which is how the README got counted.
//
// So: keyed on a PINNED REV via `git ls-tree`/`git show` (never `ls-files`, never the working
// tree — a population keyed on the working tree is irreproducible from any rev), restricted to
// `.mjs`, and keyed on BOTH helper tokens. The rev is taken as a parameter so this can be pointed
// at the pre-repair commit and at HEAD and the two answers compared.
//
// Usage:  node census1-row-helpers-that-embed-a-newline.mjs [rev]

import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});

const REV = git('rev-parse', process.argv[2] ?? 'HEAD').trim();
const SCOPE = 'docs/research/';
// BOTH row-helper tokens. Named as a list so the count of keys is visible in the recording, and so
// a future reader can see that a one-token key would have halved the answer.
const HELPER_TOKENS = ['legs.push({', 'preds.push({'];

const files = git('ls-tree', '-r', '--name-only', '-z', REV, SCOPE)
  .split('\0').filter((f) => f !== '' && f.endsWith('.mjs'));

const rows = [];
const rounds = new Set();
let helperLines = 0;
for (const f of files) {
  const src = git('show', `${REV}:${f}`);
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n += 1) {
    const line = lines[n];
    if (!HELPER_TOKENS.some((t) => line.includes(t))) continue;
    helperLines += 1;
    const m = f.match(/round(\d+)-instruments/);
    if (m) rounds.add(Number(m[1]));
    // A source line that contains the two characters `\` `n` inside a template literal is what
    // publishes a two-line row. Keyed on the SOURCE escape, not on a runtime newline, because the
    // helper is never executed here.
    if (line.includes('\\n')) rows.push({ f, n: n + 1, line: line.trim() });
  }
}

const r = [...rounds].sort((a, b) => a - b);
console.log(`census1 — row helpers that embed a newline.   rev = ${REV}`);
console.log(`  scope ${SCOPE}**/*.mjs at the rev · ${files.length} file(s)`);
console.log(`  keys (${HELPER_TOKENS.length}): ${HELPER_TOKENS.map((t) => JSON.stringify(t)).join(', ')}`);
console.log(`  row-helper lines: ${helperLines} across ${r.length} round(s), span ${r[0]}..${r[r.length - 1]}`);
console.log(`  OF WHICH EMBED A NEWLINE: ${rows.length}`);
for (const x of rows) console.log(`     ${x.f}:${x.n}  ${x.line.slice(0, 120)}`);

// ── Gate ─────────────────────────────────────────────────────────────────────────────────────────
// KP: the two-token key must find strictly more helper lines than either token alone, which is the
// defect that made my first figure wrong. A key that answers the same as a one-token key would be
// evidence I had not actually fixed anything.
const perToken = HELPER_TOKENS.map((t) => {
  let c = 0;
  for (const f of files) {
    for (const line of git('show', `${REV}:${f}`).split('\n')) if (line.includes(t)) c += 1;
  }
  return { t, c };
});
const GATE = [
  ['the population is non-empty', files.length > 0],
  ['the two-token key finds more than either token alone (so neither token is redundant)',
    perToken.every(({ c }) => c < helperLines) && perToken.every(({ c }) => c > 0)],
  ['no `.md` file is in the population (my first figure counted the README)',
    files.every((f) => !f.endsWith('.md'))],
];
console.log('');
for (const { t, c } of perToken) console.log(`  per-token: ${JSON.stringify(t)} → ${c}`);
console.log('GATE');
let red = 0;
for (const [name, ok] of GATE) {
  console.log(`  ${ok === true ? 'ok ' : 'RED'}  ${name}`);
  if (ok !== true) red += 1;
}
console.log('');
console.log(`census1 verdict: ${red === 0 ? 'ok' : `RED (${red})`} · ${helperLines} helper line(s), ${rows.length} with a newline`);
if (red !== 0) process.exitCode = 1;
