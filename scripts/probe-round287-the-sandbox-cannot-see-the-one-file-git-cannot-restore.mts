/**
 * Round 287, Daedalus, 2026-09-28 (START fire). Drives the claim that made Theseus's Round 286 §6
 * request unanswerable as asked, and the instrument built to answer it.
 *
 * ── The request, and why the answer is not a judgement ───────────────────────
 *
 * Round 286 §6 routed "the forced-drive judgement calls on the 72 `db`-flagged DEFERRED probes" to
 * this seat. (Live figure this fire is **73** — the population moved by one.) The framing was that
 * the reading list is over-broad, `--force` is the override, and what remains is a per-probe
 * judgement about which flagged probes are actually safe to drive.
 *
 * That framing assumes something that is not true: **that the sandbox could tell us if we got the
 * judgement wrong.** It could not. Three facts, each verified in code rather than recalled:
 *
 *   1. `promote-probes.mts`'s `drive()` set `HOME` and nothing else. It did not set `KLATCH_DB`.
 *   2. `resolveDbPath(undefined)` returns repo-root `klatch.db` (`packages/server/src/dbPath.ts`).
 *      So a forced probe calling `getDb()` without setting the variable itself opens the REAL one.
 *   3. The only write-detector in the path was `fingerprint()` over `scripts/` and `packages/`.
 *
 * So the loop was closed in the wrong direction: the override existed, the hazard it overrode was
 * real, and the bracket that was supposed to catch a mistake was pointed somewhere else. A
 * judgement whose errors are undetectable is not a judgement, it is a guess with a procedure
 * around it.
 *
 * ── The part that makes this a module and not a one-line fix ─────────────────
 *
 * The obvious repair is to widen the fingerprint's pathspec to include `klatch.db`. **That produces
 * a check that cannot go red**, and it would look exactly like a fix. `fingerprint()` is built on
 * `git status --porcelain -uall` and `git diff HEAD`; `.gitignore` line 3 is `*.db`; git does not
 * list ignored paths in `status` without `--ignored`. Every term — `P:`, `D:`, `U:` — comes back
 * empty for a database no matter which pathspec it is handed.
 *
 * That is the fifth vacuous-check instance this fleet has logged in ten rounds, and the first one
 * found BEFORE it shipped rather than after. Arm B drives it in both directions instead of
 * asserting it, because "git can't see ignored files" is exactly the kind of thing that is true in
 * general and might have an exception in the spelling that matters.
 *
 * And the two facts compose into the reason this is worth a fire: **the one asset the sandbox
 * cannot see is the one asset git cannot restore.** `klatch.db` is ignored and untracked. There is
 * no `git checkout --` for it.
 *
 * Arms:
 *   A  the sentinel's graded set is non-empty and contains repo-root `klatch.db` — because a
 *      predicate over an empty set is vacuous, and predicate 8 would then always pass
 *   B  the vacuity, two-sided: `fingerprint` reports "unchanged" across a real content change to an
 *      IGNORED db file (known positive for blindness), and DOES report a change across the same
 *      edit to a NON-ignored file (known negative — the instrument works, it is specifically blind)
 *   C  the sentinel catches what `fingerprint` missed, on the same file and the same edit
 *   D  `compare()` two-sided on changed / appeared / vanished, including the equal-length overwrite
 *      that a size-only or mtime-only check would miss
 *   E  WAL sidecars are in the graded set — a committed write under `journal_mode = WAL` can land
 *      in `-wal` with the main `.db` bytes untouched, so a `*.db`-only sentinel would false-green
 *   F  `.testdata/` databases are scratch, not graded — a probe writing its own fixture is not a
 *      finding, and grading it would make predicate 8 fire on nearly every probe
 *   G  the redirect: `drive()` passes a `KLATCH_DB` that is NOT the repo default, driven through
 *      the real code path rather than read off the diff
 *   H  the tree and db brackets over this probe's own run
 *
 * Costs: no port bound, no model call, no corpus outside the repo. **No database outside
 * `.testdata/r287/` is opened, written, or read by any arm** — the fixtures are minted files, and
 * the real `klatch.db` is only ever hashed. Arm B writes one non-ignored file at the repo root
 * (`zz-round287-*.txt`) and removes it; repo root is chosen precisely because no other seat's
 * bracket watches it, so this cannot redden a concurrent fire's `scripts/` or `packages/` window.
 *
 * NOT asserted: that predicate 8 catches every possible database write. A probe that writes and
 * then restores byte-identical content inside the drive is invisible to a before/after bracket —
 * the same limit `tree-fingerprint` has and for the same reason. Round 285's sampler exists because
 * of that limit; extending sampling to databases is named here and not built, because a hash of a
 * 434 KB file every 40 ms is a different cost profile and no observed defect motivates it yet.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { snapshot, compare, unchanged, describe } from './lib/db-sentinel.mts';
import { drive } from './promote-probes.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SCRATCH = join(REPO, '.testdata', 'r287');

const results: ProbeVerdict[] = [];
const check = (arm: string, what: string, pass: boolean, detail = ''): void => {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'pass' : 'FAIL'}  ${what}${detail ? `\n        ${detail}` : ''}`);
};
const measure = (arm: string, what: string): void => {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}`);
};

mkdirSync(SCRATCH, { recursive: true });
const bracketBefore = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
const dbBefore = snapshot(REPO);

// ─── A · the graded set is not empty ──────────────────────────────────────────
//
// First because it is the vacuity guard for everything after it. Predicate 8 compares the graded
// set before and after; if that set were empty, the predicate would pass unconditionally and look
// like a safety property. Round 283's arm E3 and Round 285's `suite: 0` are the two prior cases of
// an instrument whose real problem was that it had nothing to say.
console.log('\n[A] the sentinel grades a non-empty set, and repo-root klatch.db is in it');

const gradedPaths = dbBefore.graded.map((d) => d.path);
check(
  'A1',
  'the graded set (databases outside .testdata/) is non-empty — otherwise predicate 8 is vacuous',
  dbBefore.graded.length > 0,
  `graded=${dbBefore.graded.length} scratch=${dbBefore.scratch.length}`,
);
check(
  'A2',
  'and it contains repo-root klatch.db, the file resolveDbPath(undefined) returns',
  gradedPaths.includes('klatch.db'),
  `graded paths: ${JSON.stringify(gradedPaths)}`,
);
measure('A3', `graded ${dbBefore.graded.length} · scratch ${dbBefore.scratch.length} database files`);

// ─── B · the vacuity of the obvious fix, driven in BOTH directions ────────────
//
// The known positive here is a claim of BLINDNESS, which is an unusual shape: I have to show the
// instrument reporting "unchanged" across a change that really happened. So the change is made
// real first (arm B0 asserts the bytes on disk actually differ) before B1 is allowed to mean
// anything. Without B0, "fingerprint didn't move" could just mean "nothing happened".
console.log('\n[B] widening the pathspec would be vacuous — git cannot see an ignored file');

const ignoredDb = join(SCRATCH, 'blind.db'); // matches BOTH `*.db` and `.testdata/` in .gitignore
const ignoredRel = '.testdata/r287/blind.db';
writeFileSync(ignoredDb, 'AAAA');
const fpIgnoredBefore = fingerprint(REPO, ignoredRel);
const shaIgnoredBefore = snapshot(REPO);
writeFileSync(ignoredDb, 'BBBB'); // same length, different content — see arm D
const fpIgnoredAfter = fingerprint(REPO, ignoredRel);

check(
  'B0',
  'the control edit really changed the file on disk — so B1 is blindness, not a no-op',
  readFileSync(ignoredDb, 'utf8') === 'BBBB',
  `bytes now: ${JSON.stringify(readFileSync(ignoredDb, 'utf8'))}`,
);
check(
  'B1',
  'KNOWN POSITIVE for blindness: fingerprint() reports the IGNORED db as unchanged across that edit',
  fpIgnoredBefore === fpIgnoredAfter,
  `before=${fpIgnoredBefore}\n        after =${fpIgnoredAfter}`,
);

// The known negative. Same instrument, same kind of edit, a path git is NOT ignoring. If this also
// came back "unchanged" then B1 would be proving nothing about ignoring — it would just mean
// `fingerprint` was broken, which is a different finding with a different fix.
const visible = join(REPO, 'zz-round287-known-negative-DELETE-ME.txt');
let fpVisibleBefore = '';
let fpVisibleAfter = '';
try {
  writeFileSync(visible, 'AAAA');
  fpVisibleBefore = fingerprint(REPO, 'zz-round287-known-negative-DELETE-ME.txt');
  writeFileSync(visible, 'BBBB');
  fpVisibleAfter = fingerprint(REPO, 'zz-round287-known-negative-DELETE-ME.txt');
} finally {
  rmSync(visible, { force: true });
}
check(
  'B2',
  'KNOWN NEGATIVE: the SAME instrument DOES move for the same edit to a non-ignored file — so B1 is ' +
    'git ignoring the path, not fingerprint() being broken',
  fpVisibleBefore !== fpVisibleAfter && fpVisibleBefore !== '',
  `before=${fpVisibleBefore}\n        after =${fpVisibleAfter}`,
);
// The arm that kills the obvious fix. `klatch.db` EXISTS (A2 established that), so if git could see
// it at all, a fingerprint at its own exact pathspec would carry a `U:` term for it. It carries
// none — the widened-pathspec repair would ship a check incapable of going red.
const fpRealDb = fingerprint(REPO, 'klatch.db');
check(
  'B3',
  'a fingerprint at klatch.db\'s OWN pathspec carries no U: term for it, though the file exists — ' +
    'so widening the pathspec is the vacuous fix, not the fix',
  !fpRealDb.includes('U:klatch.db') && existsSync(join(REPO, 'klatch.db')),
  `fingerprint(REPO, 'klatch.db') = ${fpRealDb}\n        klatch.db exists: ${existsSync(join(REPO, 'klatch.db'))}`,
);
check(
  'B4',
  'and git agrees it is ignored, via check-ignore — the mechanism behind B1 and B3, named not inferred',
  (() => {
    try {
      return execFileSync('git', ['check-ignore', '-v', 'klatch.db'], { cwd: REPO }).toString().includes('klatch.db');
    } catch {
      return false;
    }
  })(),
  '`git check-ignore -v klatch.db` matches a .gitignore rule',
);

// ─── C · the sentinel catches exactly what fingerprint missed ─────────────────
console.log('\n[C] the sentinel sees the same edit fingerprint() was blind to');

const shaIgnoredAfter = snapshot(REPO);
const scratchDelta = compare(shaIgnoredBefore.scratch, shaIgnoredAfter.scratch);
check(
  'C1',
  'the sentinel reports the ignored db as CHANGED across the very edit fingerprint() called unchanged',
  scratchDelta.changed.includes(ignoredRel),
  `delta: ${describe(scratchDelta)}`,
);
check(
  'C2',
  'and the graded set did NOT move during it — the fixture is scratch, so this edit is not a finding',
  unchanged(compare(shaIgnoredBefore.graded, shaIgnoredAfter.graded)),
  `graded delta: ${describe(compare(shaIgnoredBefore.graded, shaIgnoredAfter.graded))}`,
);

// ─── D · compare(), two-sided on each of its three outcomes ───────────────────
//
// On literals rather than on disk: `compare` is a pure function and driving it directly means each
// branch is exercised deliberately instead of hoping a filesystem produces all three.
console.log('\n[D] compare() — changed / appeared / vanished, each one made to fire and not fire');

const S = (path: string, sha: string) => ({ path, bytes: 4, sha, hashed: true });
const base = [S('a.db', 'aaa'), S('b.db', 'bbb')];

check(
  'D1',
  'identical snapshots produce an empty delta',
  unchanged(compare(base, base)),
  `delta: ${describe(compare(base, base))}`,
);
check(
  'D2',
  'an EQUAL-LENGTH content change is reported — the case a bytes-only or mtime-only check misses',
  compare(base, [S('a.db', 'zzz'), S('b.db', 'bbb')]).changed.join() === 'a.db',
  `delta: ${describe(compare(base, [S('a.db', 'zzz'), S('b.db', 'bbb')]))}`,
);
check(
  'D3',
  'a new database file is reported as appeared, and a removed one as vanished',
  compare(base, [...base, S('c.db', 'ccc')]).appeared.join() === 'c.db' &&
    compare(base, [S('a.db', 'aaa')]).vanished.join() === 'b.db',
  `appeared=${describe(compare(base, [...base, S('c.db', 'ccc')]))} · ` +
    `vanished=${describe(compare(base, [S('a.db', 'aaa')]))}`,
);

// ─── E · WAL sidecars are graded ──────────────────────────────────────────────
//
// `getDb()` runs `db.pragma('journal_mode = WAL')`. A committed write can therefore live in the
// `-wal` file with the main `.db` untouched. A sentinel matching only `*.db` would report
// "unchanged" across a run that wrote rows — the same false green, one layer down.
console.log('\n[E] WAL sidecars count as databases');

const walFixture = join(SCRATCH, 'wal-fixture.db-wal');
writeFileSync(walFixture, 'wal');
const withWal = snapshot(REPO);
check(
  'E1',
  'a `.db-wal` sidecar is in the sentinel set — a *.db-only matcher would false-green a WAL write',
  withWal.scratch.some((d) => d.path === '.testdata/r287/wal-fixture.db-wal'),
  `scratch entries under r287: ${JSON.stringify(withWal.scratch.filter((d) => d.path.includes('r287')).map((d) => d.path))}`,
);
check(
  'E2',
  'and the server really does enable WAL, so E1 is guarding a live mechanism, not a hypothetical',
  readFileSync(join(REPO, 'packages/server/src/db/index.ts'), 'utf8').includes("journal_mode = WAL"),
  'packages/server/src/db/index.ts contains `db.pragma(\'journal_mode = WAL\')`',
);

// ─── F · scratch is not graded ────────────────────────────────────────────────
//
// The direction that keeps predicate 8 usable. Probes are SUPPOSED to write databases under
// `.testdata/`; grading those would fire on nearly every probe and the predicate would be turned
// off within a round.
console.log('\n[F] .testdata/ databases are scratch, never graded');

check(
  'F1',
  'every .testdata/ database lands in scratch and none of them in graded',
  withWal.scratch.every((d) => d.path.startsWith('.testdata/')) &&
    withWal.graded.every((d) => !d.path.startsWith('.testdata/')),
  `scratch=${withWal.scratch.length} graded=${withWal.graded.length}`,
);
check(
  'F2',
  'and the scratch set is non-empty, so F1 is a real partition and not an empty-set tautology',
  withWal.scratch.length > 0,
  `scratch=${withWal.scratch.length}`,
);
// The size cap is a performance concession and it is allowed to weaken only the reported half.
// If it ever reached the graded set, predicate 8's evidence would quietly become `size:mtime` —
// which an equal-length overwrite defeats, the exact case arm D2 exists for.
check(
  'F3',
  'EVERY graded database is content-hashed — the 8 MB cap never applies to the set predicate 8 grades',
  withWal.graded.every((d) => d.hashed),
  `graded: ${JSON.stringify(withWal.graded.map((d) => `${d.path} hashed=${d.hashed}`))}`,
);
measure(
  'F4',
  `scratch files identified by size:mtime rather than content (over the cap): ` +
    `${withWal.scratch.filter((d) => !d.hashed).length} of ${withWal.scratch.length}`,
);

// ─── G · the redirect, driven through the real code path ──────────────────────
//
// Read off the diff this would be "I added KLATCH_DB to the env object". Driven, it is a fact about
// what a child process actually receives. The fixture prints the value it was given; the arm
// asserts it is neither empty nor the repo default.
console.log('\n[G] drive() hands the child a KLATCH_DB that is not the repo default');

const reporter = join(SCRATCH, 'reporter.mjs');
writeFileSync(
  reporter,
  [
    "console.log('KLATCH_DB=' + (process.env.KLATCH_DB ?? '<unset>'));",
    "console.log('All 1 regression checks passed');",
    '',
  ].join('\n'),
);
const rel = (p: string): string => join('..', '.testdata', 'r287', p);
const sandboxPath = join(SCRATCH, 'sandbox-target.db');
const run = await drive(rel('reporter.mjs'), process.env.HOME ?? '', sandboxPath);
const seen = (run.out.match(/^KLATCH_DB=(.*)$/m) || [])[1] ?? '<no line>';

check(
  'G1',
  'the child receives the sandbox KLATCH_DB that was passed in',
  seen === sandboxPath,
  `child saw: ${seen}\n        passed in : ${sandboxPath}`,
);
check(
  'G2',
  'which is NOT repo-root klatch.db — the path an unset KLATCH_DB would have resolved to',
  seen !== join(REPO, 'klatch.db') && seen !== '<unset>',
  `default would be: ${join(REPO, 'klatch.db')}`,
);
check(
  'G3',
  'and the default parameter also redirects — a call site that forgets the argument is still safe',
  await (async () => {
    const d = await drive(rel('reporter.mjs'), process.env.HOME ?? '');
    const v = (d.out.match(/^KLATCH_DB=(.*)$/m) || [])[1] ?? '<no line>';
    return v !== '<unset>' && v !== join(REPO, 'klatch.db');
  })(),
  'drive() with two arguments still sets KLATCH_DB to a fresh temp path',
);
check(
  'G4',
  'and the drive did not move any graded database',
  unchanged(run.db),
  `run.db: ${describe(run.db)}`,
);

// ─── H · this probe's own brackets ────────────────────────────────────────────
console.log('\n[H] this run left the tree and the graded databases where it found them');

rmSync(ignoredDb, { force: true });
rmSync(walFixture, { force: true });
rmSync(reporter, { force: true });
rmSync(sandboxPath, { force: true });

const bracketAfter = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
const dbAfter = snapshot(REPO);
const gradedDelta = compare(dbBefore.graded, dbAfter.graded);

check(
  'H1',
  'scripts/ and packages/ fingerprints unchanged across this probe',
  bracketAfter.scripts === bracketBefore.scripts && bracketAfter.packages === bracketBefore.packages,
  `scripts ${bracketAfter.scripts === bracketBefore.scripts ? 'same' : 'MOVED'} · ` +
    `packages ${bracketAfter.packages === bracketBefore.packages ? 'same' : 'MOVED'}`,
);
check(
  'H2',
  'and no graded database moved — this probe hashes klatch.db and never opens it',
  unchanged(gradedDelta),
  `graded delta: ${describe(gradedDelta)}`,
);
check(
  'H3',
  'the repo-root known-negative fixture was removed',
  !existsSync(visible),
  `${visible} absent`,
);

summariseAndExit({ probeName: 'probe-round287-the-sandbox-cannot-see-the-one-file-git-cannot-restore', results });
