/**
 * Round 288, Theseus, 2026-09-28 (START fire). The known positive Round 287 did not have, and one
 * property of the graded set that makes predicate 8 reddenable by something other than a probe.
 *
 * ── Why this probe exists ────────────────────────────────────────────────────
 *
 * Round 287 built `lib/db-sentinel.mts` and predicate 8 because the promotion sandbox had no
 * instrument that could see the one file git cannot restore. That finding holds and I re-derived
 * its parts on this tree. But the memo's own §2 names the failure family it was avoiding — "an arm
 * that would assert a presence it is structurally incapable of observing, and go *green* forever" —
 * and `probe-round287` does not close that hole for the predicate it shipped.
 *
 * Read its 24 arms by what they observe, not by what they are about:
 *
 *   A1/A2   the graded set is non-empty and holds `klatch.db`          — vacuity guard, static
 *   C/D/E/F the sentinel module reports movement                       — **in-process**, never driven
 *   G4, H2  a drive did **not** move a graded database                 — the NEGATIVE
 *
 * Nothing anywhere shows `drive()` **reporting a graded database that moved**. `DriveResult.db` is
 * predicate 8's only input, and it is computed inside `drive()` — a different place from the module
 * arms C/D/E/F exercise. Swap `graded` for `scratch` at `promote-probes.mts`'s
 * `db: compare(dbBefore.graded, dbAfter.graded)`, or take the "after" snapshot before the child's
 * writes land, and **every one of those 24 arms still passes** while predicate 8 never fires again.
 * That is the same green-forever shape, one layer up from where it was caught.
 *
 * So arms P are the known positive: a child process, driven through the real `drive()`, that
 * modifies a graded database, and the assertion that `drive()` says so — in the literal expression
 * `evaluate()` branches on. `evaluate` is module-private, so P3 pins its *condition*
 * (`!unchanged(real.db)`) rather than calling it; that is a stated limit, not a claim of coverage.
 *
 * ── The second finding: predicate 8's graded set moves without any probe ─────
 *
 * `klatch.db` is open in WAL mode, so on this tree the graded set is **three** files: `klatch.db`,
 * `klatch.db-shm`, `klatch.db-wal`. The sidecars are in the set deliberately and correctly (Round
 * 287 arm E, and the live justification in its §5). The consequence is not in that memo, and the
 * first version of it I wrote here was too strong — arms W5–W7 exist because driving it narrowed
 * the claim:
 *
 *   **Wrong** (W6, refuted): any process that opens `klatch.db` during a drive moves a graded file.
 *     A read-only open with the sidecars already present leaves the `-shm` byte-identical.
 *   **Right** (W2, W7): the sidecars are *created* by the first connection and *removed* by the
 *     last one to close. Both are `appeared`/`vanished` in the graded set. So a holder acquiring or
 *     releasing `klatch.db` mid-drive — the dev server on :3001 starting or stopping, a sibling
 *     worktree's fire finishing — trips predicate 8 against whichever probe was in the bracket, in
 *     wording that says the damage is unrecoverable ("there is no git copy to restore from").
 *
 * That is narrower than "any reader" and it is not rare: on this tree `klatch.db-shm` and
 * `klatch.db-wal` exist right now, so the transition has a live occupant to make.
 *
 * Arms W drive that mechanism on a scratch canary. **No arm of this probe opens, reads or writes
 * `klatch.db`** — it is hashed and nothing else, exactly as in Round 287.
 *
 * Arms:
 *   P  predicate 8's observable, both directions, through the real driver: a drive that writes a
 *      GRADED database is reported (known positive, absent from Round 287); a drive that writes
 *      nothing is not (control); a drive that writes under `.testdata/` lands in `dbScratch` and
 *      not in `db` (the split, through the driver rather than in-module)
 *   W  the graded set contains a live database's WAL sidecars; their creation and removal move the
 *      graded set, a steady-state reader does not — so predicate 8 has a false-red source that is
 *      not a probe, and it is narrower than the obvious version of that claim
 *   X  independent re-derivation of Round 287's A arms on a second worktree, plus a control on the
 *      sentinel's PRUNE list
 *   Y  this probe's own tree and database brackets
 *
 * Costs: no port bound, no model call, no network. Fixtures live in `.testdata/r288/` except one
 * gitignored `zz-round288-*.db` at the repo root, which has to be there because "graded" is defined
 * as "outside `.testdata/`" — there is nowhere else a graded fixture can go. It is created after
 * this probe's opening bracket and removed in a `finally`, so the net delta is empty; while it
 * exists a concurrent `promote-probes` run would see a graded database appear, which is the same
 * exposure Round 287 arm B accepted at the repo root and is called out here rather than hidden.
 *
 * NOT asserted: that `evaluate()` itself returns the predicate-8 verdict — it is not exported, so
 * P3 pins its condition on a real `DriveResult` and stops there. Exporting it, or driving the CLI
 * against a hazardous fixture, would close that last inch and needs a DEFERRED-list entry to point
 * `--only` at; neither is done in this fire.
 */

import Database from 'better-sqlite3';
import { readdirSync, mkdirSync, writeFileSync, appendFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { snapshot, compare, unchanged, describe } from './lib/db-sentinel.mts';
import { drive } from './promote-probes.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SCRATCH = join(REPO, '.testdata', 'r288');
/** Driven files are spawned as `scripts/<file>`, so a `.testdata/` fixture is reached by `../`. */
const asDriven = (p: string): string => join('..', '.testdata', 'r288', p);

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

/** Graded by definition: outside `.testdata/`. Gitignored by `*.db`, so it dirties no status. */
const GRADED_CANARY = join(REPO, 'zz-round288-graded-canary.db');
/** A second graded path, never created until arm P4 wants an `appeared`. */
const GRADED_NEWCOMER = join(REPO, 'zz-round288-graded-newcomer.db');
const SCRATCH_TARGET = join(SCRATCH, 'scratch-target.db');
const WAL_CANARY = join(SCRATCH, 'wal-canary.db');

try {
  // ─── X · re-derivation, on a different worktree than the one that built the module ──
  //
  // Round 287's A1/A2 ran on Daedalus's tree. Re-derived here first because everything below
  // depends on the graded set being real, and because his §4 reported a graded set of three whose
  // *members* are not the three on this tree — a figure worth not inheriting.
  console.log('\n[X] the graded set on this tree, and what the PRUNE list costs');

  const gradedPaths = dbBefore.graded.map((d) => d.path);
  check(
    'X1',
    'the graded set is non-empty — otherwise predicate 8 passes unconditionally and looks like safety',
    dbBefore.graded.length > 0,
    `graded=${dbBefore.graded.length} · scratch=${dbBefore.scratch.length}`,
  );
  check(
    'X2',
    'and repo-root klatch.db is in it, the path resolveDbPath(undefined) returns',
    gradedPaths.includes('klatch.db'),
    `graded: ${JSON.stringify(gradedPaths)}`,
  );

  // The sentinel prunes node_modules/.git/dist/.claude. A database under one of those is invisible
  // to predicate 8 forever. Today that costs nothing — but "today" is a measurement, so it is one.
  const PRUNED = new Set(['node_modules', '.git', 'dist', '.claude']);
  const isDbFile = (n: string): boolean => /\.db(-wal|-shm)?$/.test(n);
  const hiddenOutsideScratch: string[] = [];
  const walkAll = (dir: string, underPrune: boolean): void => {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as never;
    } catch {
      return;
    }
    for (const e of entries as unknown as { name: string; isDirectory(): boolean; isFile(): boolean }[]) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        walkAll(abs, underPrune || PRUNED.has(e.name));
        continue;
      }
      if (!e.isFile() || !isDbFile(e.name) || !underPrune) continue;
      const rel = relative(REPO, abs).split(sep).join('/');
      if (!rel.startsWith('.testdata/')) hiddenOutsideScratch.push(rel);
    }
  };
  walkAll(REPO, false);
  check(
    'X3',
    'no database lives under a PRUNEd directory outside .testdata/ — the prune list costs no coverage today',
    hiddenOutsideScratch.length === 0,
    `would-be-graded but unreachable: ${hiddenOutsideScratch.length}` +
      (hiddenOutsideScratch.length ? ` — ${hiddenOutsideScratch.slice(0, 5).join(', ')}` : ''),
  );

  // ─── P · predicate 8's observable, driven in both directions ────────────────
  //
  // The whole point of this probe. `run.db` is the ONLY input to predicate 8, and it is computed
  // inside `drive()`, not inside the sentinel module — so the module arms of Round 287 do not
  // cover it. P1 is the known positive that was missing; P0 is its control, without which P1 would
  // be equally consistent with `drive()` reporting movement unconditionally.
  console.log('\n[P] a drive that writes a graded database is reported; one that does not, is not');

  const quiet = join(SCRATCH, 'quiet.mjs');
  writeFileSync(quiet, ["console.log('quiet fixture: wrote nothing');", ''].join('\n'));
  const quietRun = await drive(asDriven('quiet.mjs'), process.env.HOME ?? '', join(SCRATCH, 'sandbox-quiet.db'));
  check(
    'P0',
    'CONTROL: a driven child that writes no database leaves run.db unchanged',
    unchanged(quietRun.db),
    `run.db: ${describe(quietRun.db)} · child exit ${quietRun.code}`,
  );

  // The canary exists before the drive so its movement is a `changed`, which is what a corrupted
  // real database looks like — not an `appeared`, which is the easier case.
  writeFileSync(GRADED_CANARY, 'round288 canary, initial contents\n');
  const writer = join(SCRATCH, 'graded-writer.mjs');
  writeFileSync(
    writer,
    [
      "import { appendFileSync } from 'node:fs';",
      `appendFileSync(${JSON.stringify(GRADED_CANARY)}, 'a write that predicate 8 must see\\n');`,
      "console.log('graded-writer fixture: appended to the graded canary');",
      '',
    ].join('\n'),
  );
  const gradedRun = await drive(asDriven('graded-writer.mjs'), process.env.HOME ?? '', join(SCRATCH, 'sandbox-graded.db'));

  check(
    'P1',
    'KNOWN POSITIVE: drive() reports a GRADED database the child changed — the case Round 287 never observed',
    gradedRun.db.changed.includes('zz-round288-graded-canary.db'),
    `run.db: ${describe(gradedRun.db)} · child exit ${gradedRun.code}`,
  );
  check(
    'P2',
    'and the expression evaluate() branches on, `!unchanged(real.db)`, is true for that result',
    !unchanged(gradedRun.db),
    'predicate 8 would hold this probe; evaluate() itself is module-private, so its condition is ' +
      'pinned here and its return value is not — see the probe header',
  );

  // A graded database that did not exist before the drive. Distinct code path in `compare()`
  // (`appeared`, not `changed`), and the shape a probe that mints its own database would produce.
  const minter = join(SCRATCH, 'graded-minter.mjs');
  writeFileSync(
    minter,
    [
      "import { writeFileSync } from 'node:fs';",
      `writeFileSync(${JSON.stringify(GRADED_NEWCOMER)}, 'minted during a drive\\n');`,
      "console.log('graded-minter fixture: minted a graded database');",
      '',
    ].join('\n'),
  );
  const mintRun = await drive(asDriven('graded-minter.mjs'), process.env.HOME ?? '', join(SCRATCH, 'sandbox-mint.db'));
  check(
    'P3',
    'and a graded database that APPEARS during a drive is reported too, not only one that changed',
    mintRun.db.appeared.includes('zz-round288-graded-newcomer.db'),
    `run.db: ${describe(mintRun.db)}`,
  );

  // The other direction. Without this arm, P1 would be equally consistent with `drive()` grading
  // every database write, which would make predicate 8 fire on nearly every probe and get it
  // switched off inside a round — the failure mode Round 287 §4 designed the split to avoid.
  const scratchWriter = join(SCRATCH, 'scratch-writer.mjs');
  writeFileSync(
    scratchWriter,
    [
      "import { appendFileSync } from 'node:fs';",
      `appendFileSync(${JSON.stringify(SCRATCH_TARGET)}, 'a sanctioned scratch write\\n');`,
      "console.log('scratch-writer fixture: appended under .testdata/');",
      '',
    ].join('\n'),
  );
  writeFileSync(SCRATCH_TARGET, 'initial\n');
  const scratchRun = await drive(asDriven('scratch-writer.mjs'), process.env.HOME ?? '', join(SCRATCH, 'sandbox-scratch.db'));
  check(
    'P4',
    'KNOWN NEGATIVE: the same write under .testdata/ moves dbScratch and leaves db unchanged',
    unchanged(scratchRun.db) && scratchRun.dbScratch.changed.includes('.testdata/r288/scratch-target.db'),
    `run.db: ${describe(scratchRun.db)} · run.dbScratch: ${describe(scratchRun.dbScratch)}`,
  );

  // ─── W · the graded set moves without any probe touching it ─────────────────
  //
  // Round 287 arm E2 establishes that the server sets `journal_mode = WAL` by reading the source.
  // What follows from it is not in that memo and is not readable off any source line: under WAL,
  // `-shm` is the index and it is written by the act of OPENING the database. So the graded set
  // this predicate brackets is mutated by any reader, including a read-only one.
  console.log('\n[W] opening a WAL database moves the sidecars predicate 8 grades');

  check(
    'W1',
    'klatch.db\'s WAL sidecars are themselves in the graded set on this tree',
    gradedPaths.includes('klatch.db-shm') || gradedPaths.includes('klatch.db-wal'),
    `graded: ${JSON.stringify(gradedPaths)} — membership read from the snapshot; klatch.db is never opened here`,
  );

  // Driven on a scratch canary. Same pragma the server uses, so this is the live mechanism.
  const seed = new Database(WAL_CANARY);
  seed.pragma('journal_mode = WAL');
  seed.exec('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT)');
  seed.prepare('INSERT INTO t (v) VALUES (?)').run('row');
  seed.close();

  const sidecarsOf = (paths: string[]): string[] =>
    paths.filter((p) => p.startsWith('.testdata/r288/wal-canary.db'));
  const beforeOpen = snapshot(REPO);
  const mainBefore = statSync(WAL_CANARY).size;
  const mainShaBefore = beforeOpen.scratch.find((d) => d.path === '.testdata/r288/wal-canary.db')?.sha;

  // READ ONLY. One SELECT, no write of any kind, then closed.
  const reader = new Database(WAL_CANARY, { readonly: true });
  const rows = reader.prepare('SELECT COUNT(*) AS n FROM t').get() as { n: number };
  reader.close();

  const afterOpen = snapshot(REPO);
  const sidecarDelta = compare(
    beforeOpen.scratch.filter((d) => sidecarsOf([d.path]).length > 0),
    afterOpen.scratch.filter((d) => sidecarsOf([d.path]).length > 0),
  );
  const mainShaAfter = afterOpen.scratch.find((d) => d.path === '.testdata/r288/wal-canary.db')?.sha;

  check(
    'W2',
    'KNOWN POSITIVE: a READ-ONLY open of a WAL database moves a file the sentinel would grade',
    !unchanged(sidecarDelta),
    `rows read: ${rows.n} · sidecar delta: ${describe(sidecarDelta)}`,
  );
  check(
    'W3',
    'CONTROL: the main .db file\'s own bytes did not change across that open — W2 is the sidecars',
    mainShaBefore !== undefined && mainShaBefore === mainShaAfter,
    `main .db sha ${mainShaBefore} → ${mainShaAfter} · ${mainBefore} bytes`,
  );
  measure(
    'W4',
    `if this canary were outside .testdata/, that read-only open alone would hold a probe for ` +
      `predicate 8 — the graded set on this tree contains ${gradedPaths.filter((p) => /-(wal|shm)$/.test(p)).length} ` +
      `sidecar(s) of the live database`,
  );

  // W2 observed the sidecars being CREATED, because SQLite deletes them when the last connection
  // closes. That is not quite the live case: `klatch.db-shm` and `klatch.db-wal` exist right now on
  // this tree, which means something is holding the real database open. The arm that matters is
  // therefore the one where the sidecars are ALREADY there — a long-lived holder (the dev server on
  // :3001 is exactly this) plus one more reader arriving.
  const holder = new Database(WAL_CANARY);
  holder.pragma('journal_mode = WAL');
  holder.prepare('SELECT COUNT(*) AS n FROM t').get();

  const heldBefore = snapshot(REPO);
  const shmBefore = heldBefore.scratch.find((d) => d.path === '.testdata/r288/wal-canary.db-shm')?.sha;
  // Control first: a second snapshot with NOTHING happening in between, so W5 is the open and not
  // a file that simply drifts every time it is looked at.
  const idle = snapshot(REPO);
  const shmIdle = idle.scratch.find((d) => d.path === '.testdata/r288/wal-canary.db-shm')?.sha;

  const secondReader = new Database(WAL_CANARY, { readonly: true });
  secondReader.prepare('SELECT COUNT(*) AS n FROM t').get();
  secondReader.close();

  const heldAfter = snapshot(REPO);
  const shmAfter = heldAfter.scratch.find((d) => d.path === '.testdata/r288/wal-canary.db-shm')?.sha;
  holder.close();

  check(
    'W5',
    'CONTROL: with the sidecars present and nothing happening, two snapshots agree — the -shm does not drift on its own',
    shmBefore !== undefined && shmBefore === shmIdle,
    `-shm sha ${shmBefore} → ${shmIdle} across an idle pair`,
  );
  // This arm asserts the REFUTATION of the hypothesis it was written to confirm. First version
  // claimed a second read-only open moves the `-shm` while the sidecars are already present — the
  // "any concurrent reader reddens predicate 8" story. Driven, it does not: the content is
  // byte-identical across the open. Kept, inverted, because the narrowed claim is the useful one
  // and because the broad version is the obvious thing for the next reader to assume.
  check(
    'W6',
    'but with the sidecars ALREADY present, a further read-only open does NOT move the -shm — the ' +
      'exposure is not "any concurrent reader", it is creation and removal',
    shmBefore !== undefined && shmAfter !== undefined && shmBefore === shmAfter,
    `-shm sha ${shmBefore} → ${shmAfter} across a read-only open with a holder connection live`,
  );

  // The narrowed known positive. `appeared` was driven in W2; this is `vanished`, and it is the one
  // that matters on this tree, where the sidecars exist right now. Whatever is holding klatch.db
  // open (or left them behind) releasing it mid-drive is a predicate 8 red with no probe involved.
  const releaser = new Database(WAL_CANARY);
  releaser.pragma('journal_mode = WAL');
  releaser.prepare('SELECT COUNT(*) AS n FROM t').get();
  // Snapshot taken with the connection LIVE, so the sidecars are present in the "before" term.
  const beforeRelease = snapshot(REPO);
  releaser.close();
  const afterRelease = snapshot(REPO);
  const releaseDelta = compare(
    beforeRelease.scratch.filter((d) => sidecarsOf([d.path]).length > 0),
    afterRelease.scratch.filter((d) => sidecarsOf([d.path]).length > 0),
  );
  check(
    'W7',
    'KNOWN POSITIVE, narrowed: the sidecars VANISH when the last connection closes — a holder ' +
      'releasing the database mid-drive moves the graded set with no probe involved',
    releaseDelta.vanished.length > 0,
    `sidecar delta across a full open-and-close cycle: ${describe(releaseDelta)}`,
  );
} finally {
  rmSync(GRADED_CANARY, { force: true });
  rmSync(GRADED_NEWCOMER, { force: true });
  rmSync(SCRATCH, { recursive: true, force: true });
}

// ─── Y · this probe's own brackets ────────────────────────────────────────────
console.log('\n[Y] this run left the tree and the graded databases where it found them');

const bracketAfter = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
const dbAfter = snapshot(REPO);
const gradedDelta = compare(dbBefore.graded, dbAfter.graded);

check(
  'Y1',
  'scripts/ and packages/ fingerprints unchanged across this probe',
  bracketAfter.scripts === bracketBefore.scripts && bracketAfter.packages === bracketBefore.packages,
  `scripts ${bracketAfter.scripts === bracketBefore.scripts ? 'same' : 'MOVED'} · ` +
    `packages ${bracketAfter.packages === bracketBefore.packages ? 'same' : 'MOVED'}`,
);
check(
  'Y2',
  'and the graded set is back where it started — the P-arm canaries are removed, klatch.db untouched',
  unchanged(gradedDelta),
  `graded delta: ${describe(gradedDelta)} — NOTE per arms W2/W7: a concurrent process ACQUIRING or ` +
    `RELEASING klatch.db during this run would redden this arm without any write by this probe. ` +
    `A steady-state reader would not (W6).`,
);
check(
  'Y3',
  'both repo-root graded fixtures were removed',
  !existsSync(GRADED_CANARY) && !existsSync(GRADED_NEWCOMER),
  `${GRADED_CANARY} absent · ${GRADED_NEWCOMER} absent`,
);

summariseAndExit({
  probeName: 'probe-round288-predicate-8s-red-branch-had-never-been-observed-to-fire',
  results,
});
