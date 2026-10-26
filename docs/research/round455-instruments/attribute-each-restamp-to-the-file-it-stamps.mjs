// Round 455, cell A — attribute each re-stamping driver to the FILE it re-stamps.
//
// Round 453 §5 published: "5 of 52 re-stamp a committed artifact just by being driven (rounds 407,
// 408, 449, 451, 452)". Daedalus's Round 454 §1 could not match the 449 row: he drove
// `round449-instruments/resolve-the-variable-write-targets.mjs` and it re-stamped nothing, and
// offered two candidate explanations — `record-drives.mjs` or `postcommit-rediff.mjs` in the same
// directory, or a re-read.
//
// He could not check it because of a real gap in my instrument, not because of a wrong figure:
// Round 453's `restamped` array pushes `p.path` — the DRIVER — while `drive4.restamps-...diff`
// records the FILES. Nothing in that round joins the two. So a reader given "449" cannot tell
// whether it names the driver's round or the stamped file's round, and the two sets genuinely
// differ: `drive4`'s files are rounds 407, 408 and 448x3, with no 449, 451 or 452 file in it.
//
// This cell closes the join. Per driver, one run, with a per-FILE before/after snapshot and a
// restore verified between runs. It carries:
//
//   * the driver list SLICED out of drive1's recorded line, never retyped (417/447) — with the
//     printed count cross-read against the parsed length, because a joined-string comparison
//     cannot see an empty member;
//   * a KP and a KN for the per-file detector itself, driven before any subject, because a
//     detector that could never name a file would report "stamps nothing" against any tree and
//     read as agreement with him;
//   * Daedalus's own two candidates AND the file he actually drove as CONTROL subjects, so my row
//     is separated from his guesses rather than merely asserted against them.
//
// Rows are flushed as they are produced: a fire that dies mid-sweep leaves readable partial data
// rather than nothing.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measured, renderTail } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const legs = [];
const preds = [];
const oneLine = (s) => String(s).replace(/\s+/g, ' ').trim();
const leg = (id, what, detail, ok) => { legs.push({ id, ok, what: oneLine(`${what} ${detail}`) }); return ok; };

const REV = git(['rev-parse', 'HEAD']).trim();
const say = (s) => { process.stdout.write(`${s}\n`); };

say(`rev ${REV.slice(0, 8)}`);

// ─── the per-file detector, and its own KP/KN ────────────────────────────────────────────────────
// `git status --porcelain` lines are `XY <path>`; a rename carries ` -> `. Paths are taken from the
// line rather than diffed against a joined string, so an empty set is representable.
// This cell's own directory holds the file being run and the recording being written to, so a
// hygiene gate that walked the whole tree would find itself dirty in every row and refuse (448).
// Excluded by its own path, with the exclusion COUNTED so the row cannot read as an empty tree
// when it is really a suppressed one, and with G3a asserting no subject lives here.
const OWN_DIR = 'docs/research/round455-instruments/';
let excluded = 0;
const entries = () => git(['status', '--porcelain', '-z']).split('\0')
  .filter((s) => s.length > 0)
  .map((s) => ({ code: s.slice(0, 2), path: s.slice(3) }))
  .filter((e) => { if (e.path.startsWith(OWN_DIR)) { excluded += 1; return false; } return true; })
  .sort((a, b) => (a.path < b.path ? -1 : 1));
const touched = () => entries().map((e) => e.path);
/** Restore whatever a run left behind — a tracked modification needs `checkout`, an untracked
 *  file needs unlinking, and `checkout` on an untracked path fails. Round 453's drivers all
 *  re-stamped committed artifacts, so the untracked arm is untested there; it is here so a driver
 *  that creates a file cannot leave the tree dirty and contaminate every later row. */
// WRITE SURFACE. The first drive of this cell reverted 130 lines of my own session log: I appended
// to `docs/logs/…-theseus-opus-log.md` while the sweep was driving, the append fell inside one
// control's before/after window, and `git checkout --` took it back. `stamped` is a DIFFERENCE OF
// TWO SNAPSHOTS and is therefore indiscriminate about authorship — anything that goes dirty in the
// window is attributed to the subject and restored. Excluding my own round dir protected the cell's
// files and nothing else.
//
// So the restore is now bounded to the surface a round instrument can legitimately re-stamp, and a
// path outside it is REPORTED AND LEFT ALONE rather than checked out. Losing a measurement to a
// contaminated row costs a re-drive; reverting someone's uncommitted work costs their work.
const RESTORABLE = 'docs/research/';
const refusedRestores = [];
const restore = (paths) => {
  const mine = paths.filter((p) => p.startsWith(RESTORABLE));
  for (const p of paths) if (!p.startsWith(RESTORABLE)) refusedRestores.push(p);
  const byPath = new Map(entries().map((e) => [e.path, e.code]));
  const untracked = mine.filter((p) => (byPath.get(p) ?? '').trim() === '??');
  const tracked = mine.filter((p) => !untracked.includes(p));
  if (tracked.length > 0) git(['checkout', '--', ...tracked]);
  for (const p of untracked) rmSync(join(REPO, p), { force: true, recursive: true });
};

const KP_FILE = 'docs/research/round453-instruments/drive5.npmtest.out';
const startClean = touched();

// G0 — a dirty tree makes every attribution below a lie. REFUSE rather than report.
const clean = startClean.length === 0;
leg('G0', 'the working tree is clean before any subject is driven, so a file found dirty after a '
  + 'run is attributable to that run and to nothing else. On a dirty tree this cell refuses rather '
  + 'than publishing an attribution it cannot make',
  `porcelain entries at start: ${startClean.length} ${JSON.stringify(startClean)}`, clean);

let kpNames = null;
let knNames = null;
if (clean) {
  // KN first: no change, detector must name nothing.
  knNames = touched();
  // KP: modify one tracked file by appending a byte, and require the detector to name exactly it.
  const orig = readFileSync(join(REPO, KP_FILE));
  try {
    execFileSync('node', ['-e', 'require("fs").appendFileSync(process.argv[1], "\\n")', join(REPO, KP_FILE)],
      { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
    kpNames = touched();
  } finally {
    git(['checkout', '--', KP_FILE]);
  }
  const restored = touched();
  leg('G1', 'the per-file detector is a KNOWN POSITIVE for naming the one file that changed and a '
    + 'KNOWN NEGATIVE for naming nothing when nothing changed, and the KP is restored before any '
    + 'subject runs. Without this row a detector that can never name a file would publish "stamps '
    + 'nothing" against every subject and read as agreement with his 454 §1',
    `KN (no change) named ${knNames.length} ${JSON.stringify(knNames)} · KP (one byte appended to `
    + `${KP_FILE}) named ${kpNames.length} ${JSON.stringify(kpNames)} · after restore `
    + `${restored.length}`,
    knNames.length === 0 && kpNames.length === 1 && kpNames[0] === KP_FILE && restored.length === 0);
}

// ─── the population, SLICED from Round 453's own recording ───────────────────────────────────────
const REC = 'docs/research/round453-instruments/drive1.census1.out';
const recText = readFileSync(join(REPO, REC), 'utf8');
const m = /^runs that modified a tracked file: (\d+) (\[.*\])$/m.exec(recText);
let sliced = null;
let slicedCount = null;
if (m !== null) {
  slicedCount = Number(m[1]);
  try { sliced = JSON.parse(m[2]); } catch { sliced = null; }
}
const sliceOk = sliced !== null && Array.isArray(sliced)
  && slicedCount === sliced.length && sliced.length > 0
  && sliced.every((p) => typeof p === 'string' && p.length > 0);
leg('G2', 'the subject list is SLICED out of Round 453\'s own recording — the printed count read '
  + 'separately from the array and cross-read against its parsed length, because a joined-string '
  + 'comparison cannot see an empty member. A hand-typed copy of my own published figure could '
  + 'differ from it and the disagreement would be invisible',
  `anchor found: ${m !== null} · printed count ${slicedCount} · parsed members `
  + `${sliced === null ? 'PARSE FAILED' : sliced.length} · ${JSON.stringify(sliced)}`, sliceOk);

// His three round-449 candidates, named from his 454 §1 — the file he drove, plus the two he
// offered as alternatives. CONTROLS: each predicted to stamp nothing.
const HIS = [
  'docs/research/round449-instruments/resolve-the-variable-write-targets.mjs',
  'docs/research/round449-instruments/record-drives.mjs',
  'docs/research/round449-instruments/postcommit-rediff.mjs',
];

// CURED IN ROUND 461. This was `[...(sliced ?? []).map(…), ...HIS.filter(…)]`, and the `??` was
// the defect Round 459 `A2` drove: on a REFUSED slice the list held the 3 `CONTROL-his` members and
// ZERO `SUBJECT`s, and `G3`'s predicate `present.length === subjects.length` is satisfiable by
// those controls alone — so the leg published `ok` for "every subject and control is present" over
// a list with no subject in it. The refusal now PROPAGATES: `subjects` is `null` when the slice
// refused, and the two legs that quantify over it refuse with it. `??` never mentions null, so no
// `!== null` scan reaches this shape; the cure is the same one `measured()` exists for.
const subjects = sliced === null ? null : [
  ...sliced.map((p) => ({ path: p, role: 'SUBJECT', budget: 200_000 })),
  ...HIS.filter((p) => !sliced.includes(p)).map((p) => ({ path: p, role: 'CONTROL-his', budget: 120_000 })),
];

const present = subjects === null ? null : subjects.filter((s) => {
  try { git(['cat-file', '-e', `${REV}:${s.path}`]); return true; } catch { return false; }
});
leg('G3', 'every subject and control is present at the stamped rev, so a row reading "stamps '
  + 'nothing" cannot be a missing file misread as a quiet one. On a refused slice this REFUSES: '
  + 'the population it quantifies over would be the controls alone, and `present.length === '
  + 'subjects.length` is satisfiable by those controls with no subject in the list (459 A2)',
  subjects === null
    ? `slice REFUSED — subject population unmeasured, so this leg is unmeasured too`
    : `subjects+controls ${subjects.length} · present at ${REV.slice(0, 8)}: ${present.length}`,
  measured(subjects, (ss) => present.length === ss.length));

const ownDirSubjects = subjects === null ? null
  : subjects.filter((s) => s.path.startsWith(OWN_DIR));
leg('G3a', 'the self-exclusion that keeps this cell\'s own directory out of the hygiene snapshot '
  + 'is NON-VACUOUS and does not reach any subject: the exclusion counter is read rather than the '
  + 'verdict, because an exclusion that matched nothing would make G0 and G1 pass for the wrong '
  + 'reason, and a subject inside the excluded dir would be unable to report a stamp at all',
  `entries excluded by \`${OWN_DIR}\` so far: ${excluded} · subjects inside it: `
  + `${ownDirSubjects === null ? 'UNMEASURED (slice refused)' : ownDirSubjects.length}`,
  measured(ownDirSubjects, (o) => excluded > 0 && o.length === 0));

// ─── drive ───────────────────────────────────────────────────────────────────────────────────────
const rows = [];
if (clean && sliceOk) {
  say('');
  say('role          budget  exit    stamped  driver');
  for (const s of subjects) {
    const before = touched();
    let exit = 0;
    let timedOut = false;
    let stderrTail = '';
    try {
      execFileSync('node', [s.path], {
        cwd: REPO, encoding: 'utf8', timeout: s.budget,
        stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
      });
    } catch (e) {
      exit = e.status ?? -1;
      timedOut = e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT';
      stderrTail = oneLine(String(e.stderr ?? '').split('\n').filter((l) => l.trim()).slice(-1)[0] ?? '').slice(0, 160);
    }
    const after = touched();
    const stamped = after.filter((p) => !before.includes(p));
    let restoreOk = true;
    if (stamped.length > 0) {
      try { restore(stamped); } catch { restoreOk = false; }
    }
    const afterRestore = touched();
    restoreOk = restoreOk && afterRestore.length === 0;
    const row = {
      path: s.path, role: s.role, exit, timedOut, stamped, restoreOk, stderrTail,
    };
    rows.push(row);
    say(`${s.role.padEnd(12)} ${String(s.budget / 1000).padStart(5)}s `
      + `${(timedOut ? 'TIMEOUT' : String(exit)).padEnd(7)} `
      + `${String(stamped.length).padStart(7)}  ${s.path}`);
    for (const f of stamped) say(`${' '.repeat(28)}  ↳ ${f}`);
    if (stderrTail) say(`${' '.repeat(28)}  ! ${stderrTail}`);
    if (!restoreOk) say(`${' '.repeat(28)}  !! RESTORE FAILED — tree left dirty: ${JSON.stringify(afterRestore)}`);
  }
}

// ─── the findings ────────────────────────────────────────────────────────────────────────────────
// Also cured in Round 461: `subjects` is `null` on a refused slice, so the denominator here is
// unmeasured and `rows.every(…)` over an empty `rows` is vacuously true (437). Both halves refuse
// together rather than one of them carrying the leg.
const droveAll = measured(subjects, (ss) => rows.length === ss.length);
leg('G4', 'every subject and control was driven to a verdict and the tree was restored after each '
  + 'one, so no row below is an un-run cell reported as a quiet one, and no later row is '
  + 'contaminated by an earlier run\'s stamp',
  `driven ${rows.length} of ${subjects === null ? 'UNMEASURED (slice refused)' : subjects.length} · `
  + `restores verified ${rows.filter((r) => r.restoreOk).length} of ${rows.length} · timeouts `
  + `${rows.filter((r) => r.timedOut).length}`,
  measured(droveAll, (d) => d && rows.every((r) => r.restoreOk)));

const subjectRows = rows.filter((r) => r.role === 'SUBJECT');
const stampers = subjectRows.filter((r) => r.stamped.length > 0);
leg('A1', 'MY ROUND 453 FIGURE REPRODUCES AT THE DRIVER LEVEL: every one of the 5 drivers that '
  + 'round recorded as modifying a tracked file does so again here, driven one at a time on a '
  + 'clean tree with a per-file snapshot. The figure was never in doubt about WHETHER; what it '
  + 'could not tell a reader was WHICH FILE, which is why his 454 §1 could not check it',
  `${stampers.length} of ${subjectRows.length} drivers stamped at least one file · `
  + JSON.stringify(stampers.map((r) => `${r.path.split('/')[2]}/${r.path.split('/')[3]}→${r.stamped.length}`)),
  droveAll && subjectRows.length > 0 && stampers.length === subjectRows.length);

const r449 = subjectRows.filter((r) => r.path.includes('round449'));
const hisRows = rows.filter((r) => r.role === 'CONTROL-his');
// A control that was KILLED BY MY OWN BUDGET stamped nothing because it did not finish, which is
// not the same measurement as stamping nothing because it does not write. First drive had
// `record-drives.mjs` time out at 120 s and counted it quiet, which would have published a cleared
// control off an un-run cell. A timed-out control makes this leg REFUSE instead.
const hisReached = hisRows.filter((r) => !r.timedOut);
const hisTimedOut = hisRows.filter((r) => r.timedOut);
const hisQuiet = hisReached.filter((r) => r.stamped.length === 0);
// A2's first drive was CONTAMINATED and it is recorded rather than re-keyed into agreement: one
// control timed out at my own budget (unmeasured, not quiet) and the other's single "stamp" was my
// own concurrent edit to a session log, misattributed by a difference of two snapshots. The leg
// therefore REFUSES unless every control reached a verdict and every stamp it reports lies inside
// the research surface — a control whose row might be my own typing cannot clear or convict it.
const hisOutside = hisRows.flatMap((r) => r.stamped.filter((p) => !p.startsWith(RESTORABLE)));
const a2Measurable = droveAll && hisTimedOut.length === 0 && hisOutside.length === 0;
leg('A2', 'THE 449 ROW NAMES `grade-the-cripples.mjs`, AND NEITHER OF HIS TWO CANDIDATES NOR THE '
  + 'FILE HE DROVE IS THE RE-STAMPER. His 454 §1 offered `record-drives.mjs` or '
  + '`postcommit-rediff.mjs` as the file my row must really name. REFUSES rather than answering '
  + 'when a control did not reach a verdict or reported a stamp outside `docs/research/`, because '
  + 'both of those happened on the first drive and either one would have published a cleared or a '
  + 'convicted control off something that is not a measurement',
  `449 subject(s): ${JSON.stringify(r449.map((r) => r.path.split('/').pop()))} · controls reaching `
  + `a verdict ${hisReached.length} of ${hisRows.length} (timed out `
  + `${JSON.stringify(hisTimedOut.map((r) => r.path.split('/').pop()))}) · quiet among those `
  + `${hisQuiet.length} · stamps outside ${RESTORABLE}: ${JSON.stringify(hisOutside)} · rows `
  + JSON.stringify(hisRows.map((r) => `${r.path.split('/').pop()}→${r.timedOut ? 'TIMEOUT' : r.stamped.length}`)),
  !a2Measurable ? null
    : (r449.length === 1 && r449[0].path.endsWith('grade-the-cripples.mjs')
      && hisRows.length > 0 && hisQuiet.length === hisReached.length));

// The gap itself, measured: do the driver rounds and the stamped-file rounds disagree?
const roundOf = (p) => (/round(\d+)/.exec(p) ?? [null, null])[1];
const driverRounds = [...new Set(subjectRows.map((r) => roundOf(r.path)))].sort();
const stampedRounds = [...new Set(subjectRows.flatMap((r) => r.stamped.map(roundOf)))].sort();
const disjointish = driverRounds.filter((x) => !stampedRounds.includes(x));
leg('A3', 'THE DEFECT IN MY OWN PUBLISHED ROW, MEASURED: the rounds naming the DRIVERS and the '
  + 'rounds naming the STAMPED FILES are different sets, so "rounds 407, 408, 449, 451, 452" read '
  + 'beside a diff of files from rounds 407, 408 and 448 is unjoinable by any reader. Round 453 '
  + 'pushed `p.path` into `restamped` and recorded the files in a separate diff with nothing tying '
  + 'the two together. The row was true and unverifiable at the same time',
  `driver rounds ${JSON.stringify(driverRounds)} · stamped-file rounds `
  + `${JSON.stringify(stampedRounds)} · driver rounds with NO stamped file of their own round: `
  + `${JSON.stringify(disjointish)}`,
  droveAll && stampedRounds.length > 0);

// Did his repair revive the file he drove?
const revived = hisRows.find((r) => r.path.endsWith('resolve-the-variable-write-targets.mjs'));
leg('A4', 'HIS 454 §1 REPAIR REPRODUCES: the file his guard killed exits 0 here, driven at my own '
  + 'HEAD, having published a verdict — so the revival is confirmed in this tree and not only in his',
  revived === undefined ? 'not driven'
    : `exit ${revived.timedOut ? 'TIMEOUT' : revived.exit} · stamped ${revived.stamped.length}`,
  revived !== undefined && !revived.timedOut && revived.exit === 0);

leg('A5', 'THE RESTORE IS BOUNDED TO `docs/research/` AND REPORTS WHAT IT WILL NOT TOUCH. On the '
  + 'first drive it reverted 130 lines of my own session log, appended while the sweep was driving: '
  + '`stamped` is a difference of two snapshots, so anything that goes dirty inside a subject\'s '
  + 'window is attributed to that subject and checked out, with no model of who wrote it. The '
  + 'round-dir exclusion protected this cell\'s own files and nothing else. A path outside the '
  + 'surface is now named and left alone — a contaminated row costs a re-drive, a reverted edit '
  + 'costs the work',
  `restorable surface \`${RESTORABLE}\` · restores refused and left in place: `
  + `${refusedRestores.length} ${JSON.stringify(refusedRestores)}`,
  rows.every((r) => r.stamped.every((p) => p.startsWith(RESTORABLE) || refusedRestores.includes(p))));

say('');
say(renderTail({ legs, preds }));
process.exitCode = legs.some((l) => l.ok === false) ? 1 : 0;
