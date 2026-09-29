/**
 * Round 291, Daedalus, 2026-09-28 (STOP fire). The sentinel's name predicate did not grade three
 * gitignored copies of the real database — including the two under `backups/` — and they are the
 * recovery path for the exact accident the module was written to detect.
 *
 * ── How this was found, which matters for what it generalises to ─────────────
 *
 * Theseus's Round 290 §8 routed one item here: re-drive `probe-round288` on this tree, the known
 * negative he could not run. It is **17/17, exit 0** (recorded below as arm R, and it is the reason
 * that item is closed). While reading its `[W1m]` measurement line —
 *
 *     this tree's graded set is ["klatch.db","sizing-copy.db-shm","sizing-copy.db-wal"]
 *
 * — the question that produced this probe was not about the three names present. It was about a
 * fourth file sitting one line away from them in `ls`:
 *
 *     klatch.db.backup-pre-round227-cleanup-20260918      425,984 bytes
 *
 * `isDbFile` was `/\.db(-wal|-shm)?$/`. That name does not *end* at `.db`, so it matched nothing,
 * so the sentinel did not grade it. Walking out from there found two more, larger:
 *
 *     backups/klatch.db.backup-2026-03-14                5,230,592 bytes
 *     backups/klatch.db.backup-2026-03-15-pre-fresh        335,872 bytes
 *
 * ── Why this is the module's own stated criterion and not a widening of scope ─
 *
 * `db-sentinel.mts`'s header names precisely one reason it exists: *"the one asset the sandbox
 * cannot see is also the one asset git cannot restore."* Test both halves against these three, and
 * they qualify harder than `klatch.db` does:
 *
 *   - **git cannot restore them.** `.gitignore:11` is `*.db.backup*` and `backups/` has a line of
 *     its own. `git check-ignore -v` names both rules; `git status --porcelain -uall` lists none of
 *     the three. Arm C drives this rather than quoting `.gitignore`, because the question is what
 *     git *does*, not what the file says.
 *   - **the sandbox could not see them.** Not graded, so `DriveResult.db` is `unchanged` across a
 *     drive that deleted all three. Arm D drives that: the promotion path's own `compare()` over the
 *     *old* predicate returns `unchanged` for a delta that destroyed 5.99 MB.
 *
 * And they are worse to lose than the primary, which is the part that makes this a finding rather
 * than a tidy-up: a backup is *defined* as the thing you fall back to when the primary is destroyed.
 * The sentinel graded the primary and left the fallback unguarded. `klatch.db` is 0.45 MB; these are
 * 5.99 MB, thirteen times more unrecoverable bytes outside the bracket than inside it.
 *
 * ── The mechanism, which is the third instance of a family this fleet keeps hitting ─
 *
 * The walk was never at fault. `snapshot()` descends `backups/` — it is not in `PRUNE` — so
 * `readdirSync` visited every one of these files and handed each to `isDbFile`, which said no.
 * Round 287 wrote that walk specifically so "a database that appears in a new location is graded
 * from the moment it exists rather than from the moment someone remembers to add it", and that
 * reasoning is sound and was undone one function later by the filter downstream of it.
 *
 * This is Theseus's Round 290 §4 shape with the polarity flipped. There, a correct regex over
 * un-normalised input let prose vote and returned a number that was too *large*. Here, a narrow
 * regex over correct input returned a set that was too *small*. Same signature in both: **the
 * detector kept returning a plausible number, so nothing looked broken.** My own memory rule for
 * this — every detector gets a known positive copied from the real call shape — is why arms A and B
 * below drive the seventeen suffix shapes actually present on disk rather than three I invented.
 *
 * ── The mirror failure, which the fix had to avoid ───────────────────────────
 *
 * A wider rule grades the wrong files. Of the 330 files on this tree carrying a `.db.`/`.db-` infix,
 * **66 are `<stem>.db.backfill-<timestamp>.json`** — the backfill tool's record of what it changed.
 * Those are reports *about* a database and hashing them as databases would be the same error
 * pointed the other way. My first draft of the predicate swallowed all 66, because `[A-Za-z0-9._-]`
 * includes the dot. Arm B is the known-negative set that caught it, and `NON_DB_SUFFIX` is the fix.
 *
 * ── Discipline ───────────────────────────────────────────────────────────────
 *
 * Every live database this probe opens is under a `mkdtemp` root in the OS temp dir. **No database
 * inside this repository is opened, read or written** — the three real backups are `statSync`'d for
 * their sizes and `isDbFile`-tested by name, never read and never touched. Arm D's "deletion" of
 * 5.99 MB is performed on `mkdtemp` copies with the real names, not on the real files. No port is
 * bound, no model call, no network. Arms Y bracket the tree.
 */

import { readdirSync, mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { snapshot, compare, unchanged, describe, isDbFile } from './lib/db-sentinel.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

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

/** The predicate as Round 287 shipped it, kept verbatim so the arms below compare against the real thing. */
const isDbFileR287 = (name: string): boolean => /\.db(-wal|-shm)?$/.test(name);

/**
 * The three real files this round is about. Named as literals rather than rediscovered, so the arms
 * stay meaningful on a tree where they have been cleaned up (arm E covers that case explicitly).
 */
const REAL_BACKUPS = [
  'klatch.db.backup-pre-round227-cleanup-20260918',
  'backups/klatch.db.backup-2026-03-14',
  'backups/klatch.db.backup-2026-03-15-pre-fresh',
];

/**
 * The one of the three that git genuinely cannot restore. **This literal is the correction arm C
 * forced on the first draft of this probe**, which asserted all three were gitignored because I read
 * `.gitignore` — `*.db.backup*` on line 11, `backups/` on its own line — instead of asking git. The
 * `backups/` pair is *tracked*, and a tracked file is never ignored, so `git checkout --` restores
 * both. Arms C1/C1b now drive the partition rather than assuming it.
 */
const UNRECOVERABLE = 'klatch.db.backup-pre-round227-cleanup-20260918';

const TMP = mkdtempSync(join(tmpdir(), 'r291-'));

try {
  // ─── A · known positives, copied from the suffix shapes actually on disk ─────
  console.log('\n[A] the widened predicate matches every database-copy shape this tree really has');

  /** Every distinct suffix shape found by walking this tree, not a hand-invented sample. */
  const KNOWN_POSITIVES = [
    'klatch.db',
    'klatch.db-wal',
    'sizing-copy.db-shm',
    'klatch.db.backup-pre-round227-cleanup-20260918',
    'klatch.db.backup-2026-03-14',
    'klatch.db.backup-2026-03-15-pre-fresh',
    'klatch.db.backup-backfill-2026-09-11T00-26-15-660Z',
    'klatch.db.backup-backfill-2026-09-11T00-26-16-749Z-shm',
    'klatch.db.backup-backfill-2026-09-11T00-26-16-749Z-wal',
    'klatch.db.r196-copy',
    'klatch.db.r196-snapshot-wal',
    'klatch.db.bak',
    "xian's klatch.db.backup-backfill-2026-09-13T00-31-36-059Z",
  ];
  const posMissed = KNOWN_POSITIVES.filter((n) => !isDbFile(n));
  check(
    'A1',
    'KNOWN POSITIVES: all 13 real database-copy name shapes on this tree are database files',
    posMissed.length === 0,
    `${KNOWN_POSITIVES.length} shapes tested · missed: ${posMissed.length ? posMissed.join(', ') : 'none'}`,
  );

  const r287Missed = KNOWN_POSITIVES.filter((n) => !isDbFileR287(n));
  check(
    'A2',
    'THE FINDING: the Round 287 predicate missed 10 of those 13 — so A1 is not vacuous, it is a repair',
    r287Missed.length === 10,
    `Round 287 missed ${r287Missed.length}: ${r287Missed.join(', ')}`,
  );

  // ─── B · known negatives, including the 66 the first draft swallowed ─────────
  console.log('\n[B] and it does not match reports ABOUT a database, or non-databases');

  const KNOWN_NEGATIVES = [
    'klatch.db.backfill-2026-09-11T00-26-15-660Z.json',
    'fixture.db.backfill-2026-09-09T16-26-40-321Z.json',
    'klatch.db.backfill-r187-g1.json',
    'sweep.db.log',
    'notes.db.md',
    'export.db.csv',
    'README.md',
    'queries.ts',
    'klatch.dbx',
    'database',
    'db',
  ];
  const negFlagged = KNOWN_NEGATIVES.filter((n) => isDbFile(n));
  check(
    'B1',
    'KNOWN NEGATIVES: .json/.log/.md/.csv reports about a database, and non-databases, are not graded',
    negFlagged.length === 0,
    `${KNOWN_NEGATIVES.length} shapes tested · wrongly flagged: ${negFlagged.length ? negFlagged.join(', ') : 'none'}`,
  );

  /** The draft that was wrong, kept so B2 shows the mirror failure was real and not hypothetical. */
  const isDbFileNaiveDraft = (name: string): boolean =>
    /\.db(-wal|-shm)?$/.test(name) || /\.db\.[A-Za-z0-9._-]+?(-wal|-shm)?$/.test(name) || /\.bak$/.test(name);
  const draftFlagged = KNOWN_NEGATIVES.filter((n) => isDbFileNaiveDraft(n));
  check(
    'B2',
    'NON-VACUITY for B1: the first draft of the widening DID flag the .json reports — the exclusion earns its place',
    draftFlagged.length >= 3,
    `draft wrongly flagged ${draftFlagged.length}: ${draftFlagged.join(', ')}`,
  );

  // ─── C · git cannot restore any of the three ────────────────────────────────
  console.log('\n[C] what git can and cannot restore — one of the three, not all three');

  const present = REAL_BACKUPS.filter((p) => existsSync(join(REPO, p)));
  const tracked = present.filter(
    (p) => (spawnSync('git', ['ls-files', '--error-unmatch', p], { cwd: REPO }).status ?? 1) === 0,
  );
  const ignored = present.filter((p) => spawnSync('git', ['check-ignore', '-q', p], { cwd: REPO }).status === 0);

  check(
    'C1',
    'the repo-root backup is gitignored AND untracked — the one file here that git genuinely cannot restore',
    present.includes(UNRECOVERABLE) && ignored.includes(UNRECOVERABLE) && !tracked.includes(UNRECOVERABLE),
    `${UNRECOVERABLE}: ignored=${ignored.includes(UNRECOVERABLE)} tracked=${tracked.includes(UNRECOVERABLE)} · ${(statSync(join(REPO, UNRECOVERABLE)).size / 1048576).toFixed(2)} MB`,
  );

  check(
    'C1b',
    'CORRECTION this probe forced on itself: the `backups/` pair is TRACKED, so git CAN restore it — the unrecoverable class is 1 file, not 3',
    tracked.length === 2 && tracked.every((p) => p.startsWith('backups/')) && ignored.length === 1,
    `tracked: ${tracked.length} (${tracked.join(', ')}) · ignored: ${ignored.length} · a tracked file is never ignored, which is why reading .gitignore gave the wrong answer`,
  );

  const status = spawnSync('git', ['status', '--porcelain', '-uall'], { cwd: REPO, encoding: 'utf8' }).stdout ?? '';
  const listedByStatus = present.filter((p) => status.includes(p));
  check(
    'C2',
    'none of the three appears in `git status --porcelain -uall` as things stand — the ignored one never can, the tracked pair only would if modified',
    listedByStatus.length === 0,
    `status lines: ${status.split('\n').filter(Boolean).length} · listing a backup: ${listedByStatus.length}`,
  );

  /** `fingerprint()` is called as `fingerprint(REPO,'scripts/')` and `(REPO,'packages/')` — nothing else. */
  const bracketCoversBackups = ['scripts/', 'packages/'].some((ps) => REAL_BACKUPS.some((p) => p.startsWith(ps)));
  check(
    'C2b',
    'and the promotion bracket does not cover them either: `fingerprint()` is scoped to scripts/ and packages/, so even the RECOVERABLE pair has nothing watching it',
    !bracketCoversBackups,
    `backups/ and the repo root are outside both fingerprinted pathspecs — git could restore the tracked pair, but no instrument in the promotion path would report it moved`,
  );

  const controlPath = 'package.json';
  check(
    'C3',
    'CONTROL for C1: a tracked file is NOT reported ignored — check-ignore discriminates',
    spawnSync('git', ['check-ignore', '-q', controlPath], { cwd: REPO }).status !== 0,
    `${controlPath} is not ignored`,
  );

  // ─── D · the old predicate reported `unchanged` across their destruction ────
  console.log('\n[D] under the Round 287 predicate, deleting all three was reported as no movement');

  /** A faithful mkdtemp replica: the real names, the real layout, fake bytes. */
  const fakeRoot = join(TMP, 'replica');
  mkdirSync(join(fakeRoot, 'backups'), { recursive: true });
  const replicaSizes = REAL_BACKUPS.map((p) => {
    const abs = join(REPO, p);
    return { rel: p, bytes: existsSync(abs) ? statSync(abs).size : 0 };
  });
  writeFileSync(join(fakeRoot, 'klatch.db'), 'PRIMARY');
  for (const rel of REAL_BACKUPS) writeFileSync(join(fakeRoot, rel), `COPY-OF-PRIMARY:${rel}`);

  /** `snapshot()` parameterised on root (Theseus's Round 290 §3 improvement) — no ambient dependence. */
  const beforeReplica = snapshot(fakeRoot);
  const gradedNow = beforeReplica.graded.map((s) => s.path).sort();
  check(
    'D1',
    'the repaired sentinel grades the primary AND all three backups under a mkdtemp replica',
    REAL_BACKUPS.every((p) => gradedNow.includes(p)) && gradedNow.includes('klatch.db'),
    `graded: ${JSON.stringify(gradedNow)}`,
  );

  for (const rel of REAL_BACKUPS) rmSync(join(fakeRoot, rel), { force: true });
  const afterReplica = snapshot(fakeRoot);
  const deltaNew = compare(beforeReplica.graded, afterReplica.graded);
  check(
    'D2',
    'THE FINDING, restated as the predicate the promotion path branches on: destroying all three now MOVES the graded set',
    !unchanged(deltaNew) && deltaNew.vanished.length === 3,
    `graded delta: ${describe(deltaNew)}`,
  );

  /** The same delta as Round 287 would have computed it: filter both snapshots by the old predicate. */
  const byR287 = (paths: { path: string; sha: string; bytes: number; hashed: boolean }[]) =>
    paths.filter((s) => isDbFileR287(s.path.split('/').pop() as string));
  const deltaOld = compare(byR287(beforeReplica.graded), byR287(afterReplica.graded));
  const unrecoverableBytes = replicaSizes.find((x) => x.rel === UNRECOVERABLE)?.bytes ?? 0;
  check(
    'D3',
    'and under Round 287 the identical deletion was `unchanged` — predicate 8 would have passed the drive that did it',
    unchanged(deltaOld),
    `Round 287 graded delta: ${describe(deltaOld)} — ${(replicaSizes.reduce((a, x) => a + x.bytes, 0) / 1048576).toFixed(2)} MB destroyed and reported as no movement, of which ${(unrecoverableBytes / 1048576).toFixed(2)} MB is the unrecoverable file per C1`,
  );

  // ─── E · the repair does not depend on this machine's litter ────────────────
  console.log('\n[E] the repair is a property of the path rule, not of this tree');

  const cleanRoot = join(TMP, 'clean');
  mkdirSync(join(cleanRoot, '.testdata'), { recursive: true });
  writeFileSync(join(cleanRoot, 'README.md'), 'no databases here');
  writeFileSync(join(cleanRoot, '.testdata', 'scratch.db.backup-2026-01-01'), 'scratch copy');
  const cleanSnap = snapshot(cleanRoot);
  check(
    'E1',
    'on a root with no backups at all the graded set is empty — no ambient dependence, and E2 below still discriminates',
    cleanSnap.graded.length === 0,
    `graded: ${JSON.stringify(cleanSnap.graded.map((s) => s.path))}`,
  );
  check(
    'E2',
    'NON-VACUITY: a backup UNDER .testdata/ is scratch, never graded — the `.testdata/` split still governs',
    cleanSnap.scratch.length === 1 && cleanSnap.scratch[0].path === '.testdata/scratch.db.backup-2026-01-01',
    `scratch: ${JSON.stringify(cleanSnap.scratch.map((s) => s.path))}`,
  );

  // ─── F · the walk was never the problem ─────────────────────────────────────
  console.log('\n[F] the walk already reached them — the miss was the name filter, one function later');

  const seenByWalk: string[] = [];
  const rawWalk = (dir: string): void => {
    let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as never;
    } catch {
      return;
    }
    for (const e of entries) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.claude'].includes(e.name)) rawWalk(abs);
        continue;
      }
      if (e.isFile()) seenByWalk.push(relative(REPO, abs).split(sep).join('/'));
    }
  };
  rawWalk(REPO);
  const walkReached = present.filter((p) => seenByWalk.includes(p));
  check(
    'F1',
    "the same walk `snapshot()` uses visits every backup present — `backups/` is not in PRUNE, so the filter rejected what the walk delivered",
    walkReached.length === present.length,
    `walked ${seenByWalk.length} files · reached ${walkReached.length}/${present.length} backups`,
  );

  // ─── R · Theseus's Round 290 §8 item, driven on the tree he could not run ───
  console.log('\n[R] Round 290 §8: probe-round288 re-driven here, the known negative');

  const r288 = spawnSync(
    'npx',
    ['tsx', 'scripts/probe-round288-predicate-8s-red-branch-had-never-been-observed-to-fire.mts'],
    { cwd: REPO, encoding: 'utf8' },
  );
  const r288Out = `${r288.stdout ?? ''}${r288.stderr ?? ''}`;
  check(
    'R1',
    "probe-round288 is 17/17 exit 0 on Daedalus's tree — Theseus's Round 290 §3 repair holds on the tree that lacks his ambient sidecars",
    r288.status === 0 && /All 17 regression checks passed/.test(r288Out),
    `exit ${r288.status} · pass lines ${(r288Out.match(/\] pass /g) ?? []).length} · FAIL lines ${(r288Out.match(/\] FAIL/g) ?? []).length}`,
  );

  // ─── M · measurements: facts about this machine, which decay ────────────────
  console.log('\n[M] measurements');
  const live = snapshot(REPO);
  measure(
    'M1',
    `this tree's graded set is now ${live.graded.length} file(s), ${(live.graded.reduce((a, s) => a + s.bytes, 0) / 1048576).toFixed(2)} MB: ${JSON.stringify(live.graded.map((s) => s.path))}`,
  );
  measure(
    'M2',
    `of that, ${replicaSizes.filter((r) => r.bytes > 0).length} backup(s) totalling ${(replicaSizes.reduce((a, x) => a + x.bytes, 0) / 1048576).toFixed(2)} MB were ungraded before this round; ${(unrecoverableBytes / 1048576).toFixed(2)} MB of it is untracked-and-ignored, i.e. comparable to the 0.45 MB of klatch.db rather than 13x it`,
  );
  measure('M3', `scratch set is ${live.scratch.length} file(s) — reported, never graded`);

  // ─── Y · brackets ───────────────────────────────────────────────────────────
  console.log('\n[Y] this run left the tree and the graded databases where it found them');
  const bracketAfter = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
  check(
    'Y1',
    'scripts/ and packages/ fingerprints unchanged across this probe',
    bracketAfter.scripts === bracketBefore.scripts && bracketAfter.packages === bracketBefore.packages,
    `scripts ${bracketAfter.scripts === bracketBefore.scripts ? 'same' : 'MOVED'} · packages ${bracketAfter.packages === bracketBefore.packages ? 'same' : 'MOVED'}`,
  );
  const dbAfter = snapshot(REPO);
  const gradedDelta = compare(dbBefore.graded, dbAfter.graded);
  check(
    'Y2',
    'and the graded set is where it started — nothing was minted at the repo root, so this is empty by construction',
    unchanged(gradedDelta),
    `graded delta: ${describe(gradedDelta)} — arm R drives probe-round288, which creates and removes its own repo-root fixtures; per Round 288 W2/W7 a concurrent holder acquiring or releasing klatch.db would also redden this`,
  );
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

summariseAndExit({
  probeName: 'probe-round291-the-sentinel-did-not-grade-the-backups-that-are-the-recovery-path',
  results,
});
