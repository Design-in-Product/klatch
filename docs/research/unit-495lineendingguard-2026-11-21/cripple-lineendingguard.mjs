#!/usr/bin/env node
/**
 * **The cripple set for assertion (c) — `unit-495lineendingguard`, 2026-11-21, Daedalus.**
 *
 * (c) refuses when a published line would END in a bare verdict label. In the state the tree is
 * actually in there are **zero** such lines, so the refuse branch has **no live observable state**:
 * every drive of the real gate is green whether the assertion works or is a no-op. A branch whose
 * only observable state requires a cripple has no other grader, which is why this file exists and
 * is committed beside the cure rather than described in a memo.
 *
 * ## Mechanism, and why it is a scratch COPY at `scripts/` depth
 *
 * Each arm copies `scripts/verify-decl-body-slicers.mjs` to an **untracked** scratch path **inside
 * `scripts/`**, mutates the copy textually, drives it, records `rc`/stdout/stderr, and deletes it.
 *
 * - **Depth is load-bearing.** The gate resolves `HERE` from `import.meta.url`, `ROOT` as
 *   `HERE/..`, and `BASELINE` as `HERE/decl-body-slicers.baseline`. A copy one directory deeper
 *   reads a baseline that does not exist and exits 2 — **a refusal in every cell, which grades
 *   nothing**. This seat has shipped that defect four times; the copy goes at the same depth as the
 *   original, and `drive0` asserts the unmutated copy reproduces the original byte-for-byte before
 *   any arm is believed.
 * - **Untracked is load-bearing too.** The gate's population is `git ls-files`, so a scratch copy
 *   cannot enter the population or move the published figures. Verified by `drive0`'s equality.
 * - **No tracked file is edited by any arm.** R1 holds: the mutations live and die in the copy.
 *
 * ## The arms
 *
 * | arm | mutation | registered expectation |
 * |---|---|---|
 * | `drive0` | none (identity copy) | byte-identical to the real gate, `rc=0` |
 * | `C0-control` | plant a label-terminal prose line AND disable (c) | `rc=0`, the line PUBLISHED |
 * | `C1` | plant a label-terminal prose line | `rc=2`, nothing after it published |
 * | `C2` | plant a label-LAST verdict row (`      3  GUARDED`) | `rc=2` |
 * | `C3` | force one in-population quoted-only member, UNQUOTED site | `rc=2` |
 * | `C4` | force the same member, QUOTED site (the shipped cure) | `rc=0`, line published |
 * | `C5a` | force a stale baseline entry, UNQUOTED stderr site | `rc=2` (a RED becomes a REFUSAL) |
 * | `C5b` | force the same entry, QUOTED site (the shipped cure) | `rc=1`, red published |
 * | `C5c` | force a stale entry that is GONE, UNQUOTED site | `rc=1` — `ABSENT` is not in `LABELS` |
 *
 * `C0-control` is the arm that makes the rest mean anything: it is the same plant with the guard
 * removed. Without it, a `rc=2` from `C1` could be the plant crashing the gate rather than the
 * assertion catching it.
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = join(ROOT, 'scripts', 'scratch-unit495-cripple.mjs'); // same depth as the original
const SRC = readFileSync(GATE, 'utf8');

/* ------------------------------------------------------------------ the mutations, as anchors */
// Every anchor is a literal slice of the live gate. A mutation whose anchor is absent is a FAILED
// arm, never a silent no-op: `mutate` throws, because an arm that quietly changed nothing would
// report the control's result under the cripple's name.
function mutate(src, pairs) {
  let out = src;
  for (const [from, to] of pairs) {
    if (!out.includes(from)) throw new Error(`anchor absent, arm not driven: ${from.slice(0, 60)}…`);
    const before = out;
    out = out.split(from).join(to);
    if (out === before) throw new Error(`anchor matched but replacement is a no-op: ${from.slice(0, 60)}…`);
  }
  return out;
}

const ANCHOR_FIRST_EMIT = "emit('verify-decl-body-slicers — brace-balance body slicers in the TRACKED tree');";
const ANCHOR_GUARD_BODY = '    if (label) {';
const ANCHOR_INPOP_LINE = 'for (const f of inPopQuotedOnly) emit(`      ${f}  → \\`${verdicts.get(f)}\\``);';
const ANCHOR_STALE_LINE = '  for (const f of stale) emitErr(`      ${f}  → now \\`${verdicts.get(f) ?? \'ABSENT\'}\\``);';
const ANCHOR_STALE_DECL = "const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');";
const ANCHOR_INPOP_HEADER = '/* ---------------------------------- IN-POPULATION QUOTED-ONLY';

// A plant ending in a bare label. Printed FIRST so an arm that refuses proves the refusal happens
// before publication rather than after the whole report is out.
const PLANT_PROSE = `emit('  every file listed below is UNGUARDED');\n${ANCHOR_FIRST_EMIT}`;
const PLANT_ROW = `emit('      3  GUARDED');\n${ANCHOR_FIRST_EMIT}`;
// Disabling (c): the label is still computed, the refusal is not taken. Keeps the arm a cripple of
// the ASSERTION rather than of the emitter.
const DISABLE_GUARD = '    if (false && label) {';
// A forced member of the two empty lists. `scripts/lib/decl-body.mjs` is in the population and
// verdict GUARDED, which is what makes the rendered line label-terminal when unquoted.
const FORCE_INPOP = `inPopQuotedOnly.push('scripts/lib/decl-body.mjs');\n${ANCHOR_INPOP_HEADER}`;
const FORCE_STALE = `${ANCHOR_STALE_DECL}\nstale.push('scripts/lib/decl-body.mjs');`;
const FORCE_STALE_GONE = `${ANCHOR_STALE_DECL}\nstale.push('scripts/this-path-has-never-existed.mjs');`;
const UNQUOTE_INPOP = 'for (const f of inPopQuotedOnly) emit(`      ${f}  → ${verdicts.get(f)}`);';
const UNQUOTE_STALE = "  for (const f of stale) emitErr(`      ${f}  → now ${verdicts.get(f) ?? 'ABSENT'}`);";

const ARMS = [
  ['drive0.identity', []],
  ['C0-control.plant-and-guard-disabled', [[ANCHOR_FIRST_EMIT, PLANT_PROSE], [ANCHOR_GUARD_BODY, DISABLE_GUARD]]],
  ['C1.plant-prose-line', [[ANCHOR_FIRST_EMIT, PLANT_PROSE]]],
  ['C2.plant-label-last-row', [[ANCHOR_FIRST_EMIT, PLANT_ROW]]],
  ['C3.inpop-member-unquoted', [[ANCHOR_INPOP_LINE, UNQUOTE_INPOP], [ANCHOR_INPOP_HEADER, FORCE_INPOP]]],
  ['C4.inpop-member-quoted', [[ANCHOR_INPOP_HEADER, FORCE_INPOP]]],
  ['C5a.stale-entry-unquoted', [[ANCHOR_STALE_LINE, UNQUOTE_STALE], [ANCHOR_STALE_DECL, FORCE_STALE]]],
  ['C5b.stale-entry-quoted', [[ANCHOR_STALE_DECL, FORCE_STALE]]],
  ['C5c.stale-entry-gone-unquoted', [[ANCHOR_STALE_LINE, UNQUOTE_STALE], [ANCHOR_STALE_DECL, FORCE_STALE_GONE]]],
];

/* ------------------------------------------------------------------------------- the drives */
const real = spawnSync('node', [GATE], { encoding: 'utf8' });
const rows = [];
for (const [name, pairs] of ARMS) {
  let rc, out, err, note = '';
  try {
    writeFileSync(SCRATCH, mutate(SRC, pairs));
    const r = spawnSync('node', [SCRATCH], { encoding: 'utf8' });
    rc = r.status; out = r.stdout; err = r.stderr;
  } catch (e) {
    rc = null; out = ''; err = ''; note = `ARM NOT DRIVEN: ${e.message}`;
  } finally {
    if (existsSync(SCRATCH)) unlinkSync(SCRATCH);
  }
  // The question every arm is really asked: did a line ending in a bare verdict label reach the
  // published output? Read off the capture, with the gate's own vocabulary, not from the rc.
  const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];
  const terminal = (s) => (s || '').split('\n').filter((l) => LABELS.some((v) => l.endsWith(v)));
  rows.push({
    arm: name,
    rc,
    stdoutBytes: Buffer.byteLength(out || ''),
    stderrBytes: Buffer.byteLength(err || ''),
    identicalToReal: (out || '') === real.stdout,
    labelTerminalPublished: terminal(out).length + terminal(err).length,
    refused: /BLOCKED — a published line would END/.test(err || ''),
    note,
  });
}

console.log('cripple-lineendingguard — assertion (c), the refuse branch with no live observable state');
console.log(`  real gate: rc=${real.status} · stdout ${Buffer.byteLength(real.stdout)} B · stderr ${Buffer.byteLength(real.stderr)} B`);
console.log('');
console.log('  arm                                    rc  stdout  stderr  label-terminal  refused  ==real');
for (const r of rows) {
  console.log(`  ${r.arm.padEnd(38)}${String(r.rc).padStart(3)}  ${String(r.stdoutBytes).padStart(6)}  ${String(r.stderrBytes).padStart(6)}  ${String(r.labelTerminalPublished).padStart(14)}  ${String(r.refused).padStart(7)}  ${String(r.identicalToReal).padStart(6)}`);
  if (r.note) console.log(`      ${r.note}`);
}
console.log('');
// The gradings, each one a conjunction stated here rather than left to the reader of the table —
// and each one keyed on a DIFFERENT column, so a single column being wrong cannot green them all.
const by = (n) => rows.find((r) => r.arm.startsWith(n));
const checks = [
  ['drive0 reproduces the real gate byte-for-byte (depth is right)', by('drive0').identicalToReal && by('drive0').rc === 0],
  ['C0 control: plant published, guard disabled, rc=0', by('C0').rc === 0 && by('C0').labelTerminalPublished === 1 && !by('C0').refused],
  ['C1 prose plant: refused, nothing label-terminal published', by('C1').rc === 2 && by('C1').refused && by('C1').labelTerminalPublished === 0],
  ['C2 label-last row: refused', by('C2').rc === 2 && by('C2').refused],
  ['C3 in-pop member, unquoted: refused', by('C3').rc === 2 && by('C3').refused],
  ['C4 in-pop member, quoted (shipped cure): publishes, rc=0', by('C4').rc === 0 && !by('C4').refused && by('C4').labelTerminalPublished === 0],
  ['C5a stale entry, unquoted: a RED becomes a REFUSAL', by('C5a').rc === 2 && by('C5a').refused],
  ['C5b stale entry, quoted (shipped cure): red published, rc=1', by('C5b').rc === 1 && !by('C5b').refused],
  ['C5c stale entry GONE, unquoted: rc=1, ABSENT is outside the key', by('C5c').rc === 1 && !by('C5c').refused],
];
let bad = 0;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) bad += 1;
}
console.log('');
console.log(bad === 0
  ? `CRIPPLE OK — ${checks.length} of ${checks.length}: assertion (c) fires on every planted violation, is silent on none, and the two quoting cures are what keep a real state publishable.`
  : `CRIPPLE RED — ${bad} of ${checks.length} gradings failed; the table above is the evidence.`);
process.exit(bad === 0 ? 0 : 1);
