#!/usr/bin/env node
/**
 * **unit-491partitionbuild — the cripple, on a relocated `.gitignore`d `.scratch` copy. The tracked
 * gate is never edited for a cripple.**
 *
 * ## Why this unit needs one at all, and why it is not optional
 *
 * Two of the three edits are **unobservable on the live tree**:
 *
 * - **Zero rows.** No verdict class is empty today, so the branch changes not one byte. Theseus's
 *   `unit-490` V1 was BYTE-IDENTICAL to CONTROL. *A branch whose only observable state requires a
 *   cripple has no other grader* — his §4, and it is the same shape as this seat's own `unit-489`
 *   unconditional print (invisible in the only state the tree is in).
 * - **Both assertions.** They refuse on a label set the gate does not have. An assertion that never
 *   fires cannot be told apart from one that is dead — this corpus's declared-cripple-no-hook-reads
 *   lesson — so each one is driven to its refusal AND driven on a healthy copy that must stay green.
 *
 * ## The arms
 *
 * | arm | what is substituted | the question it answers |
 * |---|---|---|
 * | CONTROL | nothing | does the relocated copy reproduce the tracked gate exactly? |
 * | (a) cured + `MARKED` emptied | `declared` forced to 0 | does an empty class PRINT a row at 0? |
 * | (a') PRE-REG REV + `MARKED` emptied | same substitution, gate source at `1bbfd429` | did it print NO row before the cure? |
 * | (b) order reversed | `LABELS` → `MARKED, UNGUARDED, GUARDED` | does suffix-ordering refuse? |
 * | (b2) TODAY'S PUBLISHED ORDER | `LABELS` → `UNGUARDED, MARKED, GUARDED` | would the assertion have refused the format this gate published until today? |
 * | (c) fourth class | `'UNGUARDED'` branch → `'SUSPECT'` | does the closed-label-set assertion refuse? |
 *
 * (a') is the half that makes (a) evidence. A row reading `MARKED 0` proves the row prints; only the
 * pre-cure gate driven under the SAME substitution proves it did not print before — *a count of 0
 * alone cannot be told from a list that never ran* (`unit-489` §3).
 *
 * (b2) is the one arm that measures something about the past rather than the cure: today's
 * count-descending order is a real label order this gate shipped, and the assertion is only worth
 * having if it rejects it.
 *
 * ## The relocation needs its sibling closure, not just the right depth (`unit-490` §5)
 *
 * `ROOT = resolve(HERE, '..')`, so the copy must be a DIRECT child of the repo root — `.scratch/`,
 * gitignored — or `git -C ROOT ls-files` lists a handful of files and every cell refuses. Correct
 * depth is **necessary and not sufficient**: `./lib/strip-source.mjs` and `decl-body-slicers.baseline`
 * also resolve from `HERE`, so both are carried over — the import rewritten to the TRACKED module's
 * absolute path, the baseline copied beside the copy. Theseus hit both of those refusals in order.
 *
 * **That rewrite is an edit, so CONTROL gates the evidence: if CONTROL does not reproduce the
 * tracked figures, no other arm is reported as evidence**, because then the cripple is grading the
 * relocation.
 *
 * **NO exemption marker here either, same reason** (see `drive.mjs`'s header and RESULTS §6): this
 * file carries the gate's branch and label lines as pinned string fixtures and slices nothing at all,
 * so it is out of the population and a marker would exempt nothing while joining the gate's
 * never-load-bearing disclosure class.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = join(ROOT, '.scratch');
const COPY_NAME = 'gate-unit491partitionbuild.mjs';
// The rev the PRE-REGISTRATION was pushed at, before the cure existed. Pinned rather than `HEAD`,
// because `HEAD` moves when the cure is committed and an arm keyed on `HEAD` would then grade the
// cure against itself — this corpus's restore-lands-on-the-last-restamp lesson.
const PREREG_REV = '1bbfd429';

const TRACKED_SRC = readFileSync(GATE, 'utf8');
const prereg = spawnSync('git', ['-C', ROOT, 'show', `${PREREG_REV}:scripts/verify-decl-body-slicers.mjs`],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (prereg.status !== 0 || !prereg.stdout) {
  console.error(`BLOCKED — could not read the gate at ${PREREG_REV}: rc=${prereg.status}`);
  process.exit(2);
}
const PREREG_SRC = prereg.stdout;

/* --------------------------------------------------------- pinned lines (R4: nothing hand-typed) */
const IMPORT_LINE = "import { blankLongStrings, stripSource } from './lib/strip-source.mjs';";
const LABELS_LINE = "const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];";
const DECLARED_LINE = '  const declared = MARKER.test(raw) ? declaredMarkerCount(raw) : 0;';
const UNGUARDED_BRANCH = "    else verdicts.set(rel, 'UNGUARDED');";

/** Assert a literal is present EXACTLY once: absent → rc=2, ambiguous → rc=3. */
function pin(src, what, lit, where) {
  const n = src.split(lit).length - 1;
  if (n === 0) { console.error(`BLOCKED — ${what} absent verbatim in ${where}.\n  Expected: ${lit}`); process.exit(2); }
  if (n !== 1) { console.error(`BLOCKED — ${what} appears ${n}× in ${where}; the anchor is ambiguous.`); process.exit(3); }
}
pin(TRACKED_SRC, 'the strip-source import', IMPORT_LINE, 'the cured gate');
pin(TRACKED_SRC, 'the LABELS declaration', LABELS_LINE, 'the cured gate');
pin(TRACKED_SRC, 'the declared-marker line', DECLARED_LINE, 'the cured gate');
pin(TRACKED_SRC, 'the UNGUARDED branch', UNGUARDED_BRANCH, 'the cured gate');
pin(PREREG_SRC, 'the strip-source import', IMPORT_LINE, `the gate at ${PREREG_REV}`);
pin(PREREG_SRC, 'the declared-marker line', DECLARED_LINE, `the gate at ${PREREG_REV}`);
// The pre-cure gate must NOT have the cure in it, or (a') is grading the cure twice.
if (PREREG_SRC.includes(LABELS_LINE)) {
  console.error(`BLOCKED — the gate at ${PREREG_REV} already carries LABELS; (a') cannot be a before-state.`);
  process.exit(3);
}

/* ------------------------------------------------------------------------------ drive a variant */
function drive(name, src0, replacements) {
  mkdirSync(SCRATCH, { recursive: true });
  const names = IMPORT_LINE.match(/^import\s*(\{[^}]*\})/)[1];
  let src = src0.replace(IMPORT_LINE,
    `import ${names} from ${JSON.stringify(join(ROOT, 'scripts/lib/strip-source.mjs'))};`);
  for (const [from, to] of replacements) {
    src = src.replace(from, to);
    if (src.includes(from)) { console.error(`BLOCKED — substitution for ${name} did not apply.`); process.exit(3); }
  }
  const copy = join(SCRATCH, COPY_NAME);
  writeFileSync(copy, src);
  writeFileSync(join(SCRATCH, 'decl-body-slicers.baseline'),
    readFileSync(join(ROOT, 'scripts/decl-body-slicers.baseline'), 'utf8'));
  const r = spawnSync(process.execPath, [copy], { encoding: 'utf8', cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  // A crashed arm must not read green: an empty capture comes back as `ran: false`, never as a
  // report whose every reader returns null and whose every check then skips.
  return { name, rc: r.status, out, ran: Boolean(out.trim()) && r.status !== null };
}

/* -------------------------------------------------------------------------------------- readers */
// Every reader ANCHORS and returns `null` on no-match. A reader that defaults to 0 turns "the row is
// gone" into "the count is zero", which is the precise confusion this cripple exists to resolve.
const num = (out, re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
const population = (out) => num(out, /^\s+population \(compares against both braces\): (\d+)\s*$/m);
/** The partition block as an ORDERED list of [label, count] — order is what this unit changed, and
 *  no reader in the tree reads order, only values. Delimited by the population line above and the
 *  baseline line below, so a row outside the block cannot join it. */
function rows(out) {
  const lines = out.split('\n');
  const start = lines.findIndex((l) => /^\s+population \(compares against both braces\): \d+\s*$/.test(l));
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && /^\s+baseline entries: \d+\s*$/.test(l));
  if (end < 0) return null;
  const got = [];
  for (const l of lines.slice(start + 1, end)) {
    const m = l.match(/^ {6}(\S+) +(\d+)\s*$/);
    if (m) got.push([m[1], Number(m[2])]);
    else if (l.trim()) return null; // an unparseable line inside the block is not an empty block
  }
  return got;
}
const rowFor = (out, label) => {
  const r = rows(out);
  if (r === null) return null;
  const hit = r.find(([l]) => l === label);
  return hit ? hit[1] : 'NO ROW';
};
const order = (out) => { const r = rows(out); return r === null ? null : r.map(([l]) => l).join(','); };
// **`drive6`'s two REFUSALS were a defect in this harness, and it is the third instance of one
// mechanism in three fires.** `check()` treats `null` on EITHER side as "unmeasurable", so the two
// checks whose CORRECT expectation is the absence sentinel — *(b)/(c) print no partition at all* —
// could never pass: they refused with `got=null want=null`, which reads as a measurement that did
// not happen rather than as the agreement it was. **A sentinel meaning "I could not measure this"
// cannot also be a legitimate expected value.** Same family as Theseus's `unit-490` §6 null-guard
// (a guard sharing its return value with a legitimate result) and this seat's `unit-489` §3. The cure
// is a reader whose domain excludes the sentinel, never a special case inside `check()`.
const hasPartition = (out) => rows(out) !== null;
const blockedOrder = (out) => /^verify-decl-body-slicers: BLOCKED — the verdict row order is unreadable:/m.test(out);
const blockedClass = (out) => {
  const m = out.match(/^verify-decl-body-slicers: BLOCKED — verdict class `(\w+)` is produced/m);
  return m ? m[1] : null;
};
const namesPair = (out) => {
  const m = out.match(/`(\w+)` is a suffix of `(\w+)` and prints AFTER it/);
  return m ? `${m[1]}<${m[2]}` : null;
};

/* --------------------------------------------------------------------------------------- checks */
let pass = 0; let fail = 0; let refused = 0;
function check(label, got, want) {
  if (got === null || got === undefined || want === null || want === undefined) {
    refused += 1;
    console.log(`  REFUSED  ${label}  (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
    return;
  }
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass += 1; console.log(`  PASS     ${label}  (${JSON.stringify(got)})`); }
  else { fail += 1; console.log(`  FAIL     ${label}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); }
}

console.log('unit-491partitionbuild — cripple of the partition format (order, zero rows, 2 assertions)');
console.log(`  subject: scripts/verify-decl-body-slicers.mjs (${TRACKED_SRC.length} bytes)`);
console.log(`  before-state: the same file at ${PREREG_REV} (${PREREG_SRC.length} bytes)\n`);

/* ------------------------------------------------- the tracked reference, and CONTROL gating it */
const t = spawnSync(process.execPath, [GATE], { encoding: 'utf8', cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
const T = `${t.stdout || ''}${t.stderr || ''}`;
const ref = { pop: population(T), rows: rows(T), rc: t.status };

const CONTROL = drive('CONTROL', TRACKED_SRC, []);
console.log(`CONTROL — relocated copy, uncrippled (rc=${CONTROL.rc}, ran=${CONTROL.ran})`);
check('CONTROL rc matches the tracked gate', CONTROL.rc, ref.rc);
check('CONTROL population matches', population(CONTROL.out), ref.pop);
check('CONTROL rows match the tracked gate exactly (labels, counts AND order)', rows(CONTROL.out), ref.rows);
check('CONTROL order is the gate\'s branch order', order(CONTROL.out), 'MARKED,GUARDED,UNGUARDED');
check('CONTROL fires neither assertion', [blockedOrder(CONTROL.out), blockedClass(CONTROL.out)], [false, null]);
const controlOk = CONTROL.ran && fail === 0 && refused === 0;
if (!controlOk) {
  console.log('\nBLOCKED — CONTROL did not reproduce the tracked gate, so no arm below is evidence.');
  console.log(`  ${pass} PASS · ${fail} FAIL · ${refused} REFUSED`);
  process.exit(2);
}

/* ---------------------------------------------------------------------- (a) / (a') the zero row */
const EMPTY_MARKED = [DECLARED_LINE, '  const declared = 0;'];
const A = drive('(a) cured, MARKED emptied', TRACKED_SRC, [EMPTY_MARKED]);
const A2 = drive("(a') pre-cure, MARKED emptied", PREREG_SRC, [EMPTY_MARKED]);
console.log(`\n(a) cured gate, MARKED forced empty (rc=${A.rc}, ran=${A.ran})`);
check('(a) MARKED prints a row, reading 0', rowFor(A.out, 'MARKED'), 0);
check('(a) the other two classes still print', [rowFor(A.out, 'GUARDED') !== 'NO ROW', rowFor(A.out, 'UNGUARDED') !== 'NO ROW'], [true, true]);
check('(a) the three rows account for the population',
  ['MARKED', 'GUARDED', 'UNGUARDED'].reduce((n, l) => n + (rowFor(A.out, l) === 'NO ROW' ? NaN : rowFor(A.out, l)), 0),
  population(A.out));
check('(a) order survives a collapsed class', order(A.out), 'MARKED,GUARDED,UNGUARDED');
console.log(`(a') pre-cure gate at ${PREREG_REV}, same substitution (rc=${A2.rc}, ran=${A2.ran})`);
check("(a') MARKED printed NO ROW before the cure", rowFor(A2.out, 'MARKED'), 'NO ROW');
check("(a') and the population was unchanged between the two", population(A2.out), population(A.out));

/* ----------------------------------------------------------------- (b) / (b2) suffix-ordering */
const B = drive('(b) order reversed', TRACKED_SRC,
  [[LABELS_LINE, "const LABELS = ['MARKED', 'UNGUARDED', 'GUARDED'];"]]);
const B2 = drive('(b2) today\'s published order', TRACKED_SRC,
  [[LABELS_LINE, "const LABELS = ['UNGUARDED', 'MARKED', 'GUARDED'];"]]);
console.log(`\n(b) LABELS reordered so UNGUARDED precedes GUARDED (rc=${B.rc}, ran=${B.ran})`);
check('(b) refuses rc=2', B.rc, 2);
check('(b) names the suffix-ordering violation', blockedOrder(B.out), true);
check('(b) names the pair, suffix<superstring', namesPair(B.out), 'GUARDED<UNGUARDED');
check('(b) prints no partition at all', hasPartition(B.out), false);
console.log(`(b2) LABELS set to the count-descending order this gate published until today (rc=${B2.rc}, ran=${B2.ran})`);
check('(b2) refuses rc=2 — the assertion rejects the format that shipped', B2.rc, 2);
check('(b2) names the same pair', namesPair(B2.out), 'GUARDED<UNGUARDED');

/* ------------------------------------------------------------------- (c) the closed label set */
const C = drive('(c) fourth class', TRACKED_SRC,
  [[UNGUARDED_BRANCH, "    else verdicts.set(rel, 'SUSPECT');"]]);
console.log(`\n(c) a fourth verdict class produced by a branch and absent from LABELS (rc=${C.rc}, ran=${C.ran})`);
check('(c) refuses rc=2', C.rc, 2);
check('(c) names the class the classifier produced', blockedClass(C.out), 'SUSPECT');
check('(c) prints no partition at all', hasPartition(C.out), false);
check('(c) does NOT misreport this as an ordering violation', blockedOrder(C.out), false);

console.log(`\n  ${pass} PASS · ${fail} FAIL · ${refused} REFUSED`);
process.exit(fail || refused ? 1 : 0);
