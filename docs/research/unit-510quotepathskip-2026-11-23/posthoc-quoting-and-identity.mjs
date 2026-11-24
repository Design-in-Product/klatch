/**
 * unit-510 post-hoc — two legs the arm could not supply.
 *
 * LEG 1 — the arm's `git` column is VACUOUS, and this is my own defect in my own instrument.
 * It compared the indexed path against `cell.rel` using `ls-files -z`, which by construction never
 * quotes, so the column can only ever read `verbatim`. It printed `verbatim` on all 24 rows and
 * would have printed `verbatim` on all 24 rows had git quoted every one of them. A column whose
 * value is forced by the reader that fills it measures the reader, not the subject. This leg reads
 * the quoting under the gate's OWN invocation — plain `ls-files` — and under each candidate flag,
 * so the quoting claim rests on a reader that can disagree.
 *
 * LEG 2 — the pre-registered byte-identity controls (P2.c, P3.c): on the whitespace-free and
 * ASCII cells, each cure's stdout must be byte-identical to G0's. A cure that changes output on a
 * cell it was not aimed at is a rewrite, not a widening.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const CAP = join(HERE, 'captures');
const NUL = String.fromCharCode(0);
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 8);

/* ------------------------------------------------------------- LEG 1: what git actually hands over */
const NAMES = {
  'A-ASCII': 'src/ab.mjs',
  'A-SPACE': `src/a${String.fromCharCode(32)}b.mjs`,
  'A-NONASCII': `src/a${String.fromCharCode(0xe4)}.mjs`,
  'A-DQUOTE': `src/a${String.fromCharCode(34)}b.mjs`,
  'A-LEADSPACE': `${String.fromCharCode(32)}src/a.mjs`,
};

const INVOCATIONS = {
  'plain (the gate as it stands)': ['ls-files'],
  'core.quotePath=false (cand. B)': ['-c', 'core.quotePath=false', 'ls-files'],
  '-z (cand. A)': ['ls-files', '-z'],
};

console.log('LEG 1 — what `git` hands the reader, per cell name, per invocation');
console.log('  (`quoted` = the returned string is not the path that was added)');
console.log('');
const leg1 = [];
for (const [cellName, rel] of Object.entries(NAMES)) {
  const SYN = mkdtempSync(join(tmpdir(), 'u510q-'));
  execFileSync('git', ['-C', SYN, 'init', '-q']);
  mkdirSync(join(SYN, dirname(rel)), { recursive: true });
  writeFileSync(join(SYN, rel), 'x\n');
  execFileSync('git', ['-C', SYN, 'add', '--', rel]);
  const row = { cell: cellName, rel };
  for (const [label, args] of Object.entries(INVOCATIONS)) {
    const raw = execFileSync('git', ['-C', SYN, ...args], { encoding: 'utf8' });
    const got = raw.split(args.includes('-z') ? NUL : '\n').filter(Boolean)[0];
    row[label] = { got, quoted: got !== rel };
  }
  leg1.push(row);
  rmSync(SYN, { recursive: true, force: true });
}
for (const r of leg1) {
  console.log(`  ${r.cell}`);
  for (const label of Object.keys(INVOCATIONS)) {
    const v = r[label];
    console.log(`      ${label.padEnd(32)} ${v.quoted ? 'QUOTED  ' : 'verbatim'} ${JSON.stringify(v.got)}`);
  }
}
console.log('');
for (const label of Object.keys(INVOCATIONS)) {
  const q = leg1.filter((r) => r[label].quoted).map((r) => r.cell);
  console.log(`  ${label.padEnd(32)} quotes ${q.length}/${leg1.length} [${q.join(' ')}]`);
}

/* --------------------------------------------- LEG 2: byte-identity of each cure on unaimed cells */
console.log('');
console.log('LEG 2 — stdout byte-identity against G0 (P2.c / P3.c)');
console.log('');
const read = (tag, ext) => readFileSync(join(CAP, `${tag}.${ext}`));
const present = new Set(readdirSync(CAP));
const CONTROL_CELLS = ['A-ASCII', 'A-SPACE'];
const leg2 = [];
for (const cell of CONTROL_CELLS) {
  const baseTag = `G0-${cell}`;
  if (!present.has(`${baseTag}.out`)) { console.log(`  BLOCKED — missing capture ${baseTag}.out`); continue; }
  const base = read(baseTag, 'out');
  for (const reader of ['G1', 'G2', 'G3']) {
    const tag = `${reader}-${cell}`;
    const got = read(tag, 'out');
    const same = Buffer.compare(base, got) === 0;
    leg2.push({ cell, reader, same, baseSha: sha(base), gotSha: sha(got), bytes: got.length });
    console.log(`  ${cell.padEnd(12)} ${reader}  ${same ? 'BYTE-IDENTICAL' : 'DIFFERS'}`
      + `  G0 ${sha(base)} (${base.length}B)  ${reader} ${sha(got)} (${got.length}B)`);
  }
}
const identical = leg2.filter((r) => r.same).length;
console.log('');
console.log(`  byte-identical on unaimed cells: ${identical}/${leg2.length}`);

// The cells each cure WAS aimed at must differ from G0, or "byte-identical everywhere" would be
// satisfied by a cure that does nothing at all. A control that only checks sameness is green on a
// no-op.
console.log('');
console.log('  the aimed-at cells, which MUST differ (so sameness above is not a no-op):');
const AIMED = { G1: ['A-NONASCII'], G2: ['A-NONASCII', 'A-DQUOTE'], G3: ['A-NONASCII', 'A-DQUOTE', 'A-LEADSPACE'] };
let aimedDiffer = 0; let aimedTotal = 0;
for (const [reader, cells] of Object.entries(AIMED)) {
  for (const cell of cells) {
    const base = read(`G0-${cell}`, 'out');
    const got = read(`${reader}-${cell}`, 'out');
    const differs = Buffer.compare(base, got) !== 0;
    aimedTotal += 1; if (differs) aimedDiffer += 1;
    console.log(`      ${reader} ${cell.padEnd(12)} ${differs ? 'DIFFERS (good)' : 'IDENTICAL (cure is a no-op here)'}`);
  }
}
console.log(`  aimed-at cells that differ: ${aimedDiffer}/${aimedTotal}`);

writeFileSync(join(CAP, 'posthoc-quoting-and-identity.json'),
  `${JSON.stringify({ leg1, leg2, aimed: { aimedDiffer, aimedTotal } }, null, 2)}\n`);
