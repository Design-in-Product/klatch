/**
 * unit-499livekeypositivecontrol — POST-HOC: the two denominators
 *
 * Grades P3, P4 and P6.
 *
 * P3 — re-measure docblock property 2's `34 console.log calls / 38 published lines` at HEAD, through
 *      the `process.stdout.write` seam rather than Theseus's `console.log` seam.
 * P4 — the recorder's reconstruction is byte-identical to the same run's plain capture. Recorded as
 *      its own term with its own verdict, NOT fused into P3's counters.
 * P6 — the denominator is a function of the tree (over half the published report is a list of paths
 *      of files written about the gate). This measures at the tree THIS unit leaves behind, which is
 *      the only tree a docblock written in this fire could honestly describe.
 *
 * Expectations were committed in `PRE-REGISTRATION.md` at `023d0f58`, before this file existed.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const GATE = join(ROOT, 'scripts', 'verify-decl-body-slicers.mjs');
const PRELOAD = join(HERE, 'recorder-preload.mjs');

const scratch = mkdtempSync(join(tmpdir(), 'unit499-'));
const recordTo = join(scratch, 'writes.json');

let plain = '';
let recorded = [];
try {
  // Run 1: plain, no recorder. This is the control capture P4 compares against.
  plain = execFileSync(process.execPath, [GATE], { cwd: ROOT, encoding: 'utf8' });

  // Run 2: identical, with the recorder installed before the gate's first statement.
  execFileSync(process.execPath, ['--import', PRELOAD, GATE], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, UNIT499_RECORD_TO: recordTo },
  });
  recorded = JSON.parse(readFileSync(recordTo, 'utf8'));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

// --- P4: honesty of the recorder, as its OWN term --------------------------------------------
const reconstructed = recorded.join('');
const p4 = reconstructed === plain;

// --- P3/P6: the denominators ------------------------------------------------------------------
// One `console.log(chunk)` is exactly one `write(chunk + "\n")`. Chunks that themselves contain a
// newline publish more than one line; those extra lines are the `not-first-of-chunk` class, which is
// precisely what a per-CALL guard is blind to and what the docblock's property 2 is about.
const calls = recorded.length;
const linesPerChunk = recorded.map((c) => c.replace(/\n$/, '').split('\n').length);
const publishedLines = linesPerChunk.reduce((a, b) => a + b, 0);
const notFirstOfChunk = publishedLines - calls;

// The rows array: the verdict rows, one per label, rendered by the loop over LABELS.
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];
const allLines = plain.replace(/\n$/, '').split('\n');
const rowLines = allLines.filter((l) => LABELS.some((v) => new RegExp(`^\\s+${v}\\s+\\d+\\s*$`).test(l)));

// Self-naming lines: the mechanism that moved the denominator. Reported, not predicted.
const selfNaming = allLines.filter((l) => /^\s+\S+\.(mjs|mts|ts|js|tsx)\b/.test(l.trim()) || /^\s+docs\/research\//.test(l));

const docblock = { calls: 34, publishedLines: 38, notFirstOfChunk: 4, rows: 3 };
const theseus = { calls: 37, publishedLines: 41, notFirstOfChunk: 4, rows: 3 };
const today = { calls, publishedLines, notFirstOfChunk, rows: rowLines.length };

const mark = (a, b) => (a === b ? 'same' : `MOVED ${a} -> ${b}`);

console.log('unit-499livekeypositivecontrol — POST-HOC: the two denominators');
console.log('');
console.log('  P4 — recorder honesty, recorded as its own term and NOT fused into the counts below');
console.log(`    recorded writes reconstruct the plain capture byte-identically:  ${p4}`);
console.log(`    plain capture bytes ${Buffer.byteLength(plain, 'utf8')} · reconstructed bytes ${Buffer.byteLength(reconstructed, 'utf8')}`);
console.log(`    P4 ${p4 ? 'HIT' : 'REFUTED'}`);
console.log('');
if (!p4) {
  console.log('  P3/P6 NOT MEASURED — the recorder does not reproduce the real output, so nothing');
  console.log('  it counted can be attributed to the gate. Reported as not measured, not as a figure.');
  process.exit(1);
}
console.log('  P3/P6 — the denominators at THIS tree, through the stdout.write seam');
console.log('');
console.log('    quantity              docblock   Theseus(his tree)   today(this tree)   vs docblock');
console.log(`    console.log calls     ${String(docblock.calls).padStart(8)}   ${String(theseus.calls).padStart(17)}   ${String(today.calls).padStart(16)}   ${mark(docblock.calls, today.calls)}`);
console.log(`    published lines       ${String(docblock.publishedLines).padStart(8)}   ${String(theseus.publishedLines).padStart(17)}   ${String(today.publishedLines).padStart(16)}   ${mark(docblock.publishedLines, today.publishedLines)}`);
console.log(`    not first-of-chunk    ${String(docblock.notFirstOfChunk).padStart(8)}   ${String(theseus.notFirstOfChunk).padStart(17)}   ${String(today.notFirstOfChunk).padStart(16)}   ${mark(docblock.notFirstOfChunk, today.notFirstOfChunk)}`);
console.log(`    rows array            ${String(docblock.rows).padStart(8)}   ${String(theseus.rows).padStart(17)}   ${String(today.rows).padStart(16)}   ${mark(docblock.rows, today.rows)}`);
console.log('');
console.log(`    self-naming published lines (file paths of files written about the gate): ${selfNaming.length} of ${today.publishedLines}`);
console.log('');

const p3 = today.calls === theseus.calls
  && today.publishedLines === theseus.publishedLines
  && today.notFirstOfChunk === theseus.notFirstOfChunk
  && today.rows === theseus.rows;
console.log(`  P3 ${p3 ? 'HIT' : 'REFUTED'} — the independent seam reproduces his four figures exactly: ${p3}`);

const p6 = today.publishedLines === theseus.publishedLines;
console.log(`  P6 ${p6 ? 'HIT' : 'REFUTED'} — the line count at the tree this unit leaves behind is still ${theseus.publishedLines}: ${p6}`);
if (!p6) {
  console.log('     => a BARE line count cannot be written into that docblock at all: it would be stale');
  console.log('        at the instant of the commit that writes it. The cure changes from "refresh the');
  console.log('        number" to "pin it to a commit, or state the property without a denominator".');
}
console.log('');
console.log(`  load-bearing content of property 2 (4 non-first lines, rows 3): ${today.notFirstOfChunk === 4 && today.rows === 3 ? 'INTACT' : 'MOVED'}`);
process.exit(p3 && p6 ? 0 : 1);
