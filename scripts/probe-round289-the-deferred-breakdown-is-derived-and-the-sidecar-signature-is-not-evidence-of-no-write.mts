/**
 * Round 289, Daedalus, 2026-09-28 (WORK fire). The three items Theseus's Round 288 handed this
 * seat, built, plus the one thing his §2 argument was missing.
 *
 * ── What this probe covers ───────────────────────────────────────────────────
 *
 *   V  the DEFERRED breakdown (his §4: *no third list, derive it*) — the detector behind the
 *      derived figure, its known positives, its known negatives, and its RED limb
 *   E  `evaluate()`'s predicate-8 branch (his §1: the red limb had never been observed to fire)
 *   S  the sidecar wording (his §2), asserted on the message the driver actually prints
 *   W  the two generators of the sidecar signature, driven — including one that refutes a claim
 *      this probe was originally going to assert
 *   Y  this probe's own brackets
 *
 * ── The finding, and it cuts against the change it justifies ─────────────────
 *
 * Theseus's §2 establishes that `-shm` exists only while a connection holds the database, so a
 * sidecar-only movement is what a holder arriving or leaving looks like: `npm run dev` on :3001, a
 * sibling worktree's fire ending. Correct, and it is the reason predicate 8's message needed to
 * stop saying "there is no git copy to restore from" for that case.
 *
 * What does not follow — and what W5 shows, driven — is that a sidecar-only movement means **no
 * write happened**. Under WAL a committed write lands in `-wal` and the main `.db` bytes do not
 * change until a checkpoint. With the sidecars already present, an INSERT that is committed and not
 * checkpointed reports, through this fleet's own sentinel:
 *
 *     changed: canary.db-shm, canary.db-wal        sidecarOnly = true
 *
 * — byte-identical in shape to the benign holder transition. So the honest wording is
 * *indistinguishable*, not *harmless*, and the grade must not change. That is what shipped:
 * `promote-probes.mts` prints predicate 7's epistemics ("could be this probe or a concurrent
 * holder; not promotable either way") and still refuses to promote.
 *
 * ── A correction to Round 288 §2, found by trying to reproduce it ────────────
 *
 * His W7 reads "the sidecars VANISH when the last connection closes". W3 below is that cycle with
 * a READ-ONLY connection as the last holder, and the sidecars **survive** the close — a read-only
 * connection cannot checkpoint, so it cannot clean up. W4 is the same cycle with a writable
 * connection and they do vanish. One variable between them. This probe was drafted with "close →
 * vanish" as an arm and the draft was wrong; the arm now asserts what the run does.
 *
 * ── Costs and discipline ─────────────────────────────────────────────────────
 *
 * No port bound, no model call, no network. **No database inside this repository is opened, read or
 * written** — `klatch.db` is hashed by the Y bracket and nothing else. Every live SQLite fixture
 * lives in a `mkdtemp` directory under the OS temp dir and is removed in a `finally`, and the
 * sentinel is pointed at THAT directory as its `repo`. That is deliberate and is a change from
 * Round 287 arm B and Round 288's P arms, both of which minted a gitignored database at the repo
 * root because "graded" is defined as "outside `.testdata/`" and accepted, while it existed, that a
 * concurrent `promote-probes` run would see a graded database appear. `snapshot()` takes its root
 * as a parameter, so that exposure was never necessary: a temp directory is "outside `.testdata/`"
 * too, and no other seat is walking it.
 *
 * NOT asserted: that the verdict-bearing detector's figure equals what those 100 files would do if
 * driven. It is a static read of source and it can over-read — a file that mentions a conclusion
 * line without reaching it counts as verdict-bearing. Over-reading is the safe direction for the
 * only claim made from the figure (that part of DEFERRED is not pending work at all), because it
 * understates it. Under-reading is the dangerous direction and V1/V6 are what stand against it.
 */

import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { snapshot, compare, unchanged, describe, sidecarOnly } from './lib/db-sentinel.mts';
import { stripSource } from './lib/strip-source.mjs';
import { evaluate, type DriveResult } from './promote-probes.mts';
import { SWEPT, DEFERRED, verdictBearing, verdictBearingProblems } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

const results: ProbeVerdict[] = [];
const check = (arm: string, what: string, pass: boolean, detail = ''): void => {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'pass' : 'FAIL'}  ${what}${detail ? `\n        ${detail}` : ''}`);
};
const measure = (arm: string, what: string): void => {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}`);
};

const bracketBefore = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
const dbBefore = snapshot(REPO);

const readProbe = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
const population = (): string[] => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();

// ── V — the derived DEFERRED breakdown, and the detector under it ────────────

console.log('\nV — verdict-bearing: the derivation Theseus asked for instead of a third list');

const sweptFiles = SWEPT.map((s) => s.file);

// V1 is the whole design in one line. Every SWEPT entry carries an `expect` pin the sweep matches
// against real output, so each SWEPT file is a known positive BY CONSTRUCTION — a population of
// known positives that maintains itself, which is the thing a static detector normally cannot get.
check(
  'V1',
  'KNOWN POSITIVES: every SWEPT file reads verdict-bearing (they are known positives by construction)',
  verdictBearingProblems(sweptFiles, readProbe).length === 0,
  `${sweptFiles.length}/${sweptFiles.length} SWEPT files true`,
);

// V2's three files are Theseus's published known negatives (Round 288 §3), re-read here with a
// detector of a different shape than his. Taken from his memo rather than chosen by this seat, so
// a detector tuned to pass its own examples would still have to pass these.
const NEGATIVES = [
  'probe-accepted-multipart-allocation.mts',
  'probe-backfill-entity-sizing.mts',
  'probe-dedup-resolver-scaling.mts',
];
const presentNegatives = NEGATIVES.filter((f) => population().includes(f));
check(
  'V2',
  "KNOWN NEGATIVES: Theseus's three published non-verdict-bearing probes read false",
  presentNegatives.length === NEGATIVES.length && presentNegatives.every((f) => !verdictBearing(readProbe(f))),
  `${presentNegatives.length}/${NEGATIVES.length} present, all false`,
);

// V3 pins the reading, not the count. `stripSource(src, true)` blanks string bodies, and two SWEPT
// probes hand-roll their summary as a string literal, so the strings-blanked reading loses them —
// the fourth instance in eleven days of a detector failing by returning a smaller number. This arm
// is a known positive for the FAILURE: it asserts that the weaker reading really does under-read on
// today's population, so if someone "simplifies" the detector back to it, this goes red.
const missUnderBlanked = sweptFiles.filter((f) => {
  const s = stripSource(readProbe(f), true);
  return !(/\bsummariseAndExit\s*\(/.test(s) || /regression checks passed/.test(s) || /\bFAILED\s+—/.test(s) || /\bINCONCLUSIVE\s+—/.test(s));
});
check(
  'V3',
  'the strings-blanked reading UNDER-READS on this population, which is why strings are kept',
  missUnderBlanked.length > 0,
  `strings blanked loses ${missUnderBlanked.length} known positive(s): ${missUnderBlanked.map((f) => f.slice(0, 44)).join(', ')}`,
);

// V4 mints one known positive per limb, each copied from the real call shape in this repo rather
// than written to match the regex — the discipline Round 285 arm B1 established after a detector
// with a plausible non-zero count turned out to be blind to the dominant spelling. The negative in
// the same arm is the comment case: prose must not vote.
const MINTED: { label: string; src: string; want: boolean }[] = [
  { label: 'summariseAndExit call', src: "import { summariseAndExit } from './lib/probe-outcome.mts';\nsummariseAndExit({ probeName: 'x', results });\n", want: true },
  { label: 'hand-rolled pass line', src: "console.log(`All ${n} regression checks passed`);\n", want: true },
  { label: 'hand-rolled FAILED line', src: "console.log(`FAILED — ${bad} of ${n}`);\n", want: true },
  { label: 'hand-rolled INCONCLUSIVE line', src: "console.log('INCONCLUSIVE — nothing ran');\n", want: true },
  { label: 'the line in a COMMENT only', src: '// prints All 7 regression checks passed when it is done\nconsole.log(table);\n', want: false },
  { label: 'a pure measurement dump', src: "console.log(JSON.stringify(rows, null, 2));\n", want: false },
];
const mintedWrong = MINTED.filter((m) => verdictBearing(m.src) !== m.want);
check(
  'V4',
  'minted known positives (one per limb) and known negatives (comment-only, measurement dump) all read correctly',
  mintedWrong.length === 0,
  mintedWrong.length ? `wrong: ${mintedWrong.map((m) => m.label).join(', ')}` : `${MINTED.length}/${MINTED.length}`,
);

// V5 drives the census rather than re-calling the function: the figure a reader sees comes from a
// print statement, and a derivation that is correct in-process and mis-printed is still wrong on
// the only surface anybody reads.
const censusRun = spawnSync('node', [join('scripts', 'sweep-probes.mjs'), '--census'], { cwd: REPO, encoding: 'utf8', timeout: 120_000 });
const censusOut = `${censusRun.stdout || ''}${censusRun.stderr || ''}`;
const printed = censusOut.match(/verdict-bearing:\s*(\d+)\s*·\s*no conclusion line:\s*(\d+)/);
const presentDeferred = DEFERRED.filter((f) => population().includes(f));
const bearingHere = presentDeferred.filter((f) => verdictBearing(readProbe(f))).length;
check(
  'V5',
  'the census PRINTS the decomposed DEFERRED count, and it agrees with an independent computation here',
  !!printed && Number(printed[1]) === bearingHere && Number(printed[2]) === presentDeferred.length - bearingHere,
  printed
    ? `printed ${printed[1]}/${printed[2]} · computed ${bearingHere}/${presentDeferred.length - bearingHere} · census exit ${censusRun.status}`
    : `NO decomposed line found — ${censusOut.split('\n').slice(0, 3).join(' | ')}`,
);
measure('V5', `DEFERRED ${DEFERRED.length}: verdict-bearing ${bearingHere}, no conclusion line ${presentDeferred.length - bearingHere}`);

// V6 is the arm Round 287 did not have for predicate 8 and Theseus was right to name: the RED limb,
// observed firing. Driven on a fixture list, not on the real one — reddening the real census to
// prove the census can redden would be a probe that breaks the tree to show the tree can break.
const v6Problems = verdictBearingProblems(
  ['fixture-investigation.mts'],
  () => 'console.log(JSON.stringify(rows));\n',
);
const v6Control = verdictBearingProblems(['fixture-probe.mts'], () => 'summariseAndExit({ probeName: "x", results });\n');
check(
  'V6',
  'RED LIMB: a SWEPT-listed file that cannot emit a conclusion line is reported as a census problem',
  v6Problems.length === 1 && /verdict-bearing detector reads it false/.test(v6Problems[0]),
  v6Problems[0]?.slice(0, 96) ?? '(no problem reported)',
);
check(
  'V6b',
  'CONTROL: the same call returns no problem for a file that CAN, so V6 is the branch and not the function',
  v6Control.length === 0,
);

// ── E — evaluate()'s predicate-8 branch, now that it is exported ─────────────

console.log('\nE — predicate 8, driven through the decision instead of around it');

const emptyDelta = { changed: [], appeared: [], vanished: [] };
const okResult = (over: Partial<DriveResult> = {}): DriveResult => ({
  code: 0,
  out: 'All 3 regression checks passed\n',
  timedOut: false,
  ms: 10,
  appeared: [],
  vanished: [],
  samples: 1,
  db: { ...emptyDelta },
  dbScratch: { ...emptyDelta },
  ...over,
});

const e1 = evaluate('f.mts', okResult({ db: { changed: ['klatch.db'], appeared: [], vanished: [] } }), okResult());
check(
  'E1',
  'KNOWN POSITIVE: a moved GRADED database makes evaluate() refuse, naming predicate 8',
  e1.promotable === false && /^predicate 8 \(db-preserving\)/.test(e1.reason),
  e1.reason.slice(0, 110),
);

const e2 = evaluate('f.mts', okResult(), okResult());
check(
  'E2',
  'CONTROL: the same pair with an unchanged database is PROMOTABLE, so E1 is the branch and not a blanket refusal',
  e2.promotable === true,
  e2.reason.slice(0, 80),
);

const e3 = evaluate('f.mts', okResult(), okResult({ db: { changed: [], appeared: ['klatch.db'], vanished: [] } }));
check(
  'E3',
  'the emptyHOME arm alone is enough: both DriveResults are read, not just the first',
  e3.promotable === false && /^predicate 8/.test(e3.reason),
  e3.reason.slice(0, 96),
);

// E4 is the ordering claim Round 287 made in a comment. A probe that both wrote the database AND
// reached no conclusion trips 5 and 8; the one it must report is 8, because the damage is not a
// property of the verdict.
const e4 = evaluate(
  'f.mts',
  okResult({ code: 1, out: 'nothing recognisable\n', db: { changed: ['klatch.db'], appeared: [], vanished: [] } }),
  okResult({ code: 1, out: 'nothing recognisable\n' }),
);
check(
  'E4',
  'predicate 8 is reported BEFORE predicate 5 when a result trips both',
  e4.promotable === false && /^predicate 8/.test(e4.reason),
  e4.reason.slice(0, 96),
);

// ── S — the message change, asserted on the message ─────────────────────────

console.log('\nS — the sidecar wording: predicate 7 epistemics, unchanged grade');

const s1 = evaluate('f.mts', okResult({ db: { changed: [], appeared: ['klatch.db-shm', 'klatch.db-wal'], vanished: [] } }), okResult());
check(
  'S1',
  'sidecar-only movement gets the ambiguous wording — "not promotable either way", not "no git copy to restore from"',
  /not promotable either way/.test(s1.reason) && !/no git copy to restore from/.test(s1.reason),
  s1.reason.slice(0, 150),
);
check('S1b', 'and it is still NOT promotable: the wording changed, the grade did not', s1.promotable === false);

const s2 = evaluate('f.mts', okResult({ db: { changed: ['klatch.db'], appeared: [], vanished: [] } }), okResult());
check(
  'S2',
  'CONTROL: a main .db file keeps the unrecoverable wording, so S1 is the branch and not the new default',
  /no git copy to restore from/.test(s2.reason),
  s2.reason.slice(0, 110),
);

const s3 = evaluate('f.mts', okResult({ db: { changed: ['klatch.db'], appeared: ['klatch.db-wal'], vanished: [] } }), okResult());
check(
  'S3',
  'a MIXED delta is not downgraded: one main .db among the sidecars keeps the strong wording',
  /no git copy to restore from/.test(s3.reason),
  s3.reason.slice(0, 96),
);

check(
  'S4',
  'sidecarOnly() is false for an empty delta — a predicate that fires on "nothing moved" would relabel every clean drive',
  sidecarOnly({ changed: [], appeared: [], vanished: [] }) === false,
);

// ── W — the two generators of the sidecar signature, driven ─────────────────

console.log('\nW — what actually produces a sidecar-only delta (temp dir, never this repo)');

const walRoot = mkdtempSync(join(tmpdir(), 'klatch-r289-wal-'));
try {
  const dbPath = join(walRoot, 'canary.db');
  const seed = new Database(dbPath);
  seed.pragma('journal_mode = WAL');
  seed.exec('CREATE TABLE t (a TEXT)');
  seed.close();

  const idleA = snapshot(walRoot);
  const idleB = snapshot(walRoot);
  check(
    'W1',
    'CONTROL: two snapshots of an idle database agree, so any delta below is the event and not the instrument',
    unchanged(compare(idleA.graded, idleB.graded)),
    `graded: ${idleA.graded.map((s) => s.path).join(', ')}`,
  );

  const before = snapshot(walRoot);
  const reader = new Database(dbPath, { readonly: true });
  reader.prepare('SELECT count(*) AS n FROM t').get();
  const during = snapshot(walRoot);
  const dRead = compare(before.graded, during.graded);
  check(
    'W2',
    'KNOWN POSITIVE: a READ-ONLY open moves the graded set — sidecars appear, no main .db touched',
    sidecarOnly(dRead) && dRead.appeared.length === 2 && dRead.changed.length === 0,
    `delta: ${describe(dRead)}`,
  );

  reader.close();
  const afterRead = snapshot(walRoot);
  const dCloseRO = compare(during.graded, afterRead.graded);
  // W3 is a correction to Round 288 §2's W7, and it is the reason this probe drove the cycle rather
  // than citing it. A read-only connection cannot checkpoint, so closing it — even as the last
  // holder — leaves the sidecars in place. "The sidecars vanish when the last connection closes"
  // holds only for a connection that could write.
  check(
    'W3',
    'CORRECTION to R288 §2: closing the last READ-ONLY holder does NOT remove the sidecars',
    unchanged(dCloseRO),
    `delta across the read-only close: ${describe(dCloseRO)} (a read-only connection cannot checkpoint)`,
  );

  const beforeWriteCycle = snapshot(walRoot);
  const writer = new Database(dbPath);
  writer.exec("INSERT INTO t VALUES ('x'),('y'),('z')");
  const mid = snapshot(walRoot);
  const dUncheckpointed = compare(beforeWriteCycle.graded, mid.graded);
  // W5's control comes first in the file so the assertion below cannot be read as "nothing was
  // written". A separate connection sees the committed rows while the writer is still open.
  const other = new Database(dbPath, { readonly: true });
  const seenByOther = (other.prepare('SELECT count(*) AS n FROM t').get() as { n: number }).n;
  other.close();
  check(
    'W4',
    'CONTROL for W5: the rows really are COMMITTED — a second connection reads all three while the writer is still open',
    seenByOther === 3,
    `rows visible to an independent reader: ${seenByOther}`,
  );
  check(
    'W5',
    'THE HEADLINE: an UNCHECKPOINTED COMMITTED WRITE produces the SAME sidecar-only signature as a benign holder',
    sidecarOnly(dUncheckpointed) && dUncheckpointed.changed.length === 2 && !dUncheckpointed.changed.some((p) => /\.db$/.test(p)),
    `delta: ${describe(dUncheckpointed)} — sidecarOnly=${sidecarOnly(dUncheckpointed)}, main .db untouched. ` +
      'So "sidecar-only" means indistinguishable, not harmless, and predicate 8 must keep refusing.',
  );

  writer.close();
  const afterWrite = snapshot(walRoot);
  const dCloseRW = compare(mid.graded, afterWrite.graded);
  check(
    'W6',
    'and closing a WRITABLE holder checkpoints: the main .db moves, so the full window of a write-and-close IS graded strongly',
    !sidecarOnly(dCloseRW) && dCloseRW.changed.some((p) => /\.db$/.test(p)),
    `delta across the writable close: ${describe(dCloseRW)}`,
  );
  measure('W6', `the ambiguous window is exactly "a connection left open past the bracket": ${describe(compare(beforeWriteCycle.graded, afterWrite.graded))} once it closes`);
} finally {
  rmSync(walRoot, { recursive: true, force: true });
}

// ── Y — this probe's own brackets ───────────────────────────────────────────

console.log('\nY — what this run did to the tree it was run in');

const bracketAfter = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
check(
  'Y1',
  'scripts/ and packages/ fingerprints unchanged across this run',
  bracketAfter.scripts === bracketBefore.scripts && bracketAfter.packages === bracketBefore.packages,
  `scripts ${bracketBefore.scripts} → ${bracketAfter.scripts}`,
);
const dbAfter = snapshot(REPO);
const dbDelta = compare(dbBefore.graded, dbAfter.graded);
check(
  'Y2',
  'no GRADED database in this repository moved — and none was created here, unlike R287 arm B and R288 arm P',
  unchanged(dbDelta),
  `graded: ${dbAfter.graded.length} file(s) · delta: ${describe(dbDelta)} · scratch: ${dbAfter.scratch.length} file(s)`,
);

summariseAndExit({ probeName: 'round289', results });
