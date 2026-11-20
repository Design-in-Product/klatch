#!/usr/bin/env node
/**
 * **Two-sided cripple of the re-keyed `MARKED` verdict, on a relocated `.gitignore`d `.scratch`
 * copy. The tracked gate is never edited for a cripple.** (`unit-484popnarrow` §8's discipline. A
 * cripple's restore-from-HEAD discards an uncommitted cure, and the cure under test here IS
 * uncommitted while this runs, so there is deliberately nothing to restore.)
 *
 * ## What is crippled, and why this is the only honest edit
 *
 * The re-key points `MARKED` at `declaredMarkerCount(raw) > 0`. The cheap cripple — delete the
 * marker regex — would redden everything and prove nothing about the DECLARED reading specifically;
 * `unit-487`'s cripple already did that for the disclosure. So this one **inverts the
 * declared/quoted discriminator** inside `declaredMarkerCount`: one `!` is removed, so comment
 * occurrences stop counting and string-literal occurrences start counting. The marker vocabulary,
 * the population key, the guard keys and the report are all untouched. **It drives the exact reading
 * the two-seat decision turned on and nothing else.**
 *
 * ## Why TWO sides, pre-registered as P5
 *
 * Side (a) alone — "`MARKED` collapses to 0" — is satisfied by a reader that is simply DEAD. A count
 * of 0 cannot be told apart from a key that never ran (this corpus's zero-valued-fixture lesson).
 * So side (b) requires the inversion to make the NEW in-population quoted-only list report a
 * non-zero, named membership computed from the same run. **A list that can only ever print 0 is the
 * vacuous-reach defect this gate's own report warns about one screen further up.**
 *
 * ## The relocation needs its own control, and that control gates the evidence
 *
 * `ROOT = resolve(HERE, '..')`, so a copy under this unit's directory would make ROOT the unit
 * directory and `git -C ROOT ls-files` would list a handful of files — *a scratch copy at the wrong
 * depth refuses every cell*. The copy therefore lives in `.scratch/` (gitignored), a DIRECT child of
 * the repo root, where `resolve(HERE,'..')` is the repo root exactly as for `scripts/`. Two
 * consequences handled rather than assumed: the baseline is copied next to it (`BASELINE` is
 * `HERE`-relative), and the `./lib/strip-source.mjs` import is rewritten to the TRACKED module's
 * absolute path so the reading under test is the real one.
 *
 * **That rewrite is an edit, so CONTROL runs the relocated copy UNCRIPPLED and must reproduce the
 * tracked gate's figures exactly. If CONTROL fails, (a) and (b) are not reported as evidence** —
 * without it the cripple grades the relocation.
 *
 * ## P7 — nothing scores a pass on a value it never computed
 *
 * `unit-487`'s cripple shipped four checks that scored `PASS` on `null === null` after its arm
 * crashed, one fire ago. Every check here goes through `check()`, which REFUSES when either side is
 * `null`/`undefined`, and every reader returns `null` rather than a default on no-match.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
// **`.scratch` itself and NOT a per-unit subdirectory under it, and this line is a repaired defect
// rather than a careful choice.** The first spelling here was `.scratch/unit-489markedrekey/`, to
// keep this unit's copy away from `unit-487`'s. The gate computes `ROOT = resolve(HERE, '..')`, so
// one extra directory made the copy's ROOT `.scratch` instead of the repo root, `git -C ROOT
// ls-files` listed nothing, and **CONTROL reported population 0 with rc=1** — *a scratch copy at the
// wrong depth refuses every cell*, which is the lesson written in `unit-487`'s cripple docblock that
// this file had already quoted. The refusal is kept as `drive3.cripple.out`. The copy is given a
// unit-distinct FILENAME instead, which buys the same isolation at the right depth.
const SCRATCH = join(ROOT, '.scratch');
const COPY_NAME = 'gate-unit489markedrekey.mjs';

const TRACKED_SRC = readFileSync(GATE, 'utf8');

/* ------------------------------------------------------------- pinned lines (R4: nothing typed) */
// Each pin is asserted present VERBATIM. A cripple whose pinned literal goes stale when its subject
// is repaired must fail LOUD rather than relocate a file it cannot rewrite and report whatever that
// produces — `unit-487`'s cripple did exactly that, correctly, on the first drive after its cure.
const IMPORT_LINE = "import { blankLongStrings, stripSource } from './lib/strip-source.mjs';";
// The discriminator. The `!` is what this cripple removes.
const DISCRIM = "    if (!kept.startsWith('brace-slicer-deliberate:', m.index)) n += 1;";
const DISCRIM_INVERTED = "    if (kept.startsWith('brace-slicer-deliberate:', m.index)) n += 1;";
// The re-keyed verdict line, asserted present so this cripple cannot silently grade the OLD key.
const REKEY_LINE = '  const declared = MARKER.test(raw) ? declaredMarkerCount(raw) : 0;';

for (const [label, lit] of [['strip-source import', IMPORT_LINE], ['discriminator', DISCRIM],
  ['re-keyed MARKED line', REKEY_LINE]]) {
  if (!TRACKED_SRC.includes(lit)) {
    console.error(`BLOCKED — the ${label} is not present verbatim in ${GATE}.`);
    console.error(`  Expected: ${lit}`);
    process.exit(2);
  }
}
// A pin that matches twice is an ambiguous anchor, and that refusal is `unit-488` §3's finding
// arriving in this seat's instrument: a docblock quoting a line cannot be told from the line.
// `DISCRIM` is quoted in THIS file, but this file is not the subject; the subject is checked alone.
for (const [label, lit] of [['discriminator', DISCRIM], ['re-keyed MARKED line', REKEY_LINE]]) {
  const n = TRACKED_SRC.split(lit).length - 1;
  if (n !== 1) {
    console.error(`BLOCKED — the ${label} appears ${n} times in the subject; the anchor is ambiguous.`);
    process.exit(3);
  }
}

/* ------------------------------------------------------------------------------ drive a variant */
/** @param {string|null} replacement  `[from, to]` pair to substitute, or null for CONTROL */
function drive(name, replacement) {
  mkdirSync(SCRATCH, { recursive: true });
  // The named-import LIST is carried over rather than retyped — `unit-487`'s cripple hard-coded a
  // one-name import, and when the gate gained a second named import every arm that reached
  // `stripSource` died with a ReferenceError while four checks read green.
  const names = IMPORT_LINE.match(/^import\s*(\{[^}]*\})/)[1];
  let src = TRACKED_SRC.replace(
    IMPORT_LINE,
    `import ${names} from ${JSON.stringify(join(ROOT, 'scripts/lib/strip-source.mjs'))};`,
  );
  if (replacement) {
    const [from, to] = replacement;
    src = src.replace(from, to);
    if (src.includes(from)) { console.error(`BLOCKED — substitution for ${name} did not apply.`); process.exit(3); }
  }
  const copy = join(SCRATCH, COPY_NAME);
  writeFileSync(copy, src);
  writeFileSync(join(SCRATCH, 'decl-body-slicers.baseline'),
    readFileSync(join(ROOT, 'scripts/decl-body-slicers.baseline'), 'utf8'));
  const r = spawnSync(process.execPath, [copy], { encoding: 'utf8', cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
  const rc = r.status === null ? null : r.status;
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  // A crashed arm must not be able to read green. An empty capture is returned as a REFUSAL, not as
  // a report whose every reader will then return null and whose every check would skip.
  return { name, rc, out, ran: Boolean(out.trim()) && rc !== null };
}

/* -------------------------------------------------------------------------------------- readers */
// **Every reader ANCHORS; none CONTAINS.** Argus's standing pin: `/GUARDED\s+(\d+)/` matches inside
// `UNGUARDED  58` — one label is a suffix of another — which manufactured a `GUARDED 3 → 58` figure
// move out of an instrument that had not moved by a byte. `^\s+GUARDED\s` cannot match
// `  UNGUARDED  58`, because the two characters before `GUARDED` there are `UN` and not whitespace.
// Every reader returns `null` on no-match. A reader that defaults to 0 turns "the line is gone"
// into "the count is zero", which is the exact confusion this cripple exists to prevent.
const num = (out, re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
const verdictCount = (out, label) => num(out, new RegExp(`^\\s+${label}\\s+(\\d+)\\s*$`, 'm'));
// **An EMPTY verdict class prints no row at all, so "collapsed to 0" and "row never printed" are the
// same bytes — and this reader is the repair for a REFUSAL, not a precaution.** `drive4` refused
// *"(a) MARKED collapses to 0"* with `got=null`: the gate builds its partition rows from the
// verdicts it actually observed, so when the cripple emptied `MARKED` the row vanished and the
// anchored reader correctly declined to invent a zero.
//
// **The gate's own published partition therefore has the exact defect the new in-population
// quoted-only line was written to avoid** — a class at zero is invisible rather than reported — and
// that is an unregistered finding about the subject, one screen above the cure. **Not fixed in the
// gate this fire, on `unit-487` §3's precedent:** reformatting the published partition moves every
// captured drive's comparability, and that is a separate decision from re-keying a verdict.
//
// The zero is DERIVED from the run's own accounting identity and never defaulted: the row is absent
// AND the other two classes exactly account for the population. If the identity does not close, the
// reader still returns `null`, because then "absent" means something this check cannot name.
const verdictCountOrDerivedZero = (out, label, others) => {
  const direct = verdictCount(out, label);
  if (direct !== null) return direct;
  const pop = population(out);
  const sum = others.map((l) => verdictCount(out, l));
  if (pop === null || sum.some((v) => v === null)) return null;
  return sum.reduce((a, b) => a + b, 0) === pop ? 0 : null;
};
const population = (out) => num(out, /^\s+population \(compares against both braces\): (\d+)\s*$/m);
// Number-first line, per the format finding; the count is the FIRST token after the indent.
const inPopQuoted = (out) => num(out, /^\s+(\d+) in-population file\(s\) carry the marker token/m);
const inPopQuotedMembers = (out) => {
  const i = out.search(/^\s+\d+ in-population file\(s\) carry the marker token/m);
  if (i < 0) return null;
  const rest = out.slice(i).split('\n').slice(1);
  const members = [];
  for (const l of rest) {
    const m = l.match(/^ {6}(\S+)\s+→\s+(\S+)\s*$/);
    if (m) members.push([m[1], m[2]]);
    else if (members.length) break;
  }
  return members;
};
const redNew = (out) => num(out, /^RED — (\d+) new hand-rolled brace-balance body slicer\(s\):/m);

/* --------------------------------------------------------------------------------------- checks */
let pass = 0; let fail = 0; let refused = 0;
function check(label, got, want, cmp = (a, b) => a === b) {
  // P7: a comparison where either side is absent is a REFUSAL, never a pass and never a failure.
  if (got === null || got === undefined || want === null || want === undefined) {
    refused += 1;
    console.log(`  REFUSED  ${label}  (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
    return;
  }
  if (cmp(got, want)) { pass += 1; console.log(`  PASS     ${label}  (${JSON.stringify(got)})`); }
  else { fail += 1; console.log(`  FAIL     ${label}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); }
}

console.log('unit-489markedrekey — two-sided cripple of the re-keyed MARKED verdict');
console.log(`  subject: scripts/verify-decl-body-slicers.mjs (${TRACKED_SRC.length} bytes)`);
console.log(`  crippled line: the \`!\` in the declared/quoted discriminator`);
console.log(`    from: ${DISCRIM.trim()}`);
console.log(`    to:   ${DISCRIM_INVERTED.trim()}\n`);

/* ------------------------------------------------------------------- the tracked reference figures */
const tracked = spawnSync(process.execPath, [GATE], { encoding: 'utf8', cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
const T = `${tracked.stdout || ''}${tracked.stderr || ''}`;
const ref = {
  pop: population(T), marked: verdictCount(T, 'MARKED'), guarded: verdictCount(T, 'GUARDED'),
  unguarded: verdictCount(T, 'UNGUARDED'), inpop: inPopQuoted(T), rc: tracked.status,
};
console.log(`TRACKED GATE (the reference): rc=${ref.rc} population=${ref.pop} `
  + `UNGUARDED=${ref.unguarded} MARKED=${ref.marked} GUARDED=${ref.guarded} inPopQuotedOnly=${ref.inpop}`);
if (Object.values(ref).some((v) => v === null)) {
  console.error('BLOCKED — a reference figure could not be read off the tracked gate; every check'
    + ' downstream would REFUSE and the run would be a vacuous zero.');
  process.exit(3);
}

/* ------------------------------------------------------------------------------- arm CONTROL (P6) */
console.log('\narm CONTROL — relocated copy, UNCRIPPLED. Grades the relocation, not the key.');
const c = drive('control', null);
if (!c.ran) {
  console.error(`BLOCKED — CONTROL produced no output (rc=${c.rc}). The relocation is broken, so`
    + ' sides (a) and (b) are not reported as evidence.');
  process.exit(3);
}
// **A HARNESS refusal, kept separate from the claim legs on purpose.** `drive3` showed why: with the
// relocation broken, CONTROL's population read 0 and the check *"in-population quoted-only matches
// tracked"* scored **PASS on 0 === 0** — the reader returned a real zero because the new report line
// prints unconditionally, so P7's null-guard could not catch it. **That is the price of printing a
// reach at 0: a genuine zero and a dead run are the same bytes.** The cure is a refusal on the
// harness's own precondition, NOT a sanity conjunct bolted onto the claim — a leg that conjoins a
// sanity check with its claim cannot say which half reddened.
if (!population(c.out)) {
  console.error('BLOCKED — CONTROL read population 0. The relocated copy is not reading the repo'
    + ' tree, so every figure below would be a zero that looks like a measurement.');
  process.exit(3);
}
check('CONTROL rc matches tracked', c.rc, ref.rc);
check('CONTROL population matches tracked', population(c.out), ref.pop);
check('CONTROL MARKED matches tracked', verdictCount(c.out, 'MARKED'), ref.marked);
check('CONTROL GUARDED matches tracked', verdictCount(c.out, 'GUARDED'), ref.guarded);
check('CONTROL UNGUARDED matches tracked', verdictCount(c.out, 'UNGUARDED'), ref.unguarded);
check('CONTROL in-population quoted-only matches tracked', inPopQuoted(c.out), ref.inpop);
const controlClean = fail === 0 && refused === 0;

/* ------------------------------------------- side (a): the verdict key depends on DECLARED, not raw */
console.log('\nside (a) — discriminator INVERTED: comments stop counting, strings start counting.');
const a = drive('inverted', [DISCRIM, DISCRIM_INVERTED]);
if (!a.ran) {
  console.error(`BLOCKED — side (a) produced no output (rc=${a.rc}).`);
  process.exit(3);
}
check('(a) MARKED collapses to 0 (row absent; zero DERIVED from the accounting identity)',
  verdictCountOrDerivedZero(a.out, 'MARKED', ['UNGUARDED', 'GUARDED']), 0);
check('(a) population is UNCHANGED — the cripple moved the verdict key, not membership',
  population(a.out), ref.pop);
check('(a) UNGUARDED absorbs all 4 former MARKED files',
  verdictCount(a.out, 'UNGUARDED'), ref.unguarded + ref.marked);
check('(a) GUARDED is unchanged', verdictCount(a.out, 'GUARDED'), ref.guarded);
check('(a) the gate REDDENS', a.rc, 0, (got) => got !== 0);
check('(a) and it reddens on exactly the 4 files whose exemption was withdrawn',
  redNew(a.out), ref.marked);

/* ---------------------------- side (b): the new list is reachable and can print a NON-ZERO membership */
console.log('\nside (b) — the same run\'s in-population quoted-only list. A count of 0 cannot be told'
  + ' from a list that never ran, so the inversion must make it SATURATE.');
check('(b) in-population quoted-only saturates at the former MARKED count',
  inPopQuoted(a.out), ref.marked);
const mem = inPopQuotedMembers(a.out);
check('(b) and it NAMES them, one line each', mem ? mem.length : null, ref.marked);
check('(b) every named member fell through to UNGUARDED, not to a silent GUARDED column',
  mem ? mem.filter(([, v]) => v === 'UNGUARDED').length : null, ref.marked);
check('(b) the tracked run reports the same reach at ZERO — the two sides bracket the list',
  ref.inpop, 0);

/* -------------------------------------------------------------------------------------- verdict */
console.log(`\n  checks: ${pass} PASS · ${fail} FAIL · ${refused} REFUSED`);
if (!controlClean) {
  console.log('  CONTROL WAS NOT CLEAN — sides (a) and (b) above are NOT evidence about the key.');
  process.exit(1);
}
if (refused) {
  console.log('  REFUSALS PRESENT — a refused check is not a pass. This run does not support P5.');
  process.exit(1);
}
if (fail) { console.log('  CRIPPLE FAILED — the re-key is not keyed the way P5 registered.'); process.exit(1); }
console.log('  CRIPPLE OK — both sides held: the verdict key depends on the DECLARED reading, and the'
  + ' new in-population quoted-only list is reachable and reports a named non-zero membership.');
process.exit(0);
