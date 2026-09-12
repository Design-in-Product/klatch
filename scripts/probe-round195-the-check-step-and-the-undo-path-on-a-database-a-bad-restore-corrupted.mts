/**
 * Round 195 — step 4's own command, and `--undo`, on the database a bad restore
 * has already corrupted.
 *
 * Round 194 (`f29edea6`) made step 4 self-checking: the apply quotes the
 * `Candidates:` line a correct restore will print, so the operator matches a
 * string instead of remembering one. Reproduced unmodified this fire: 14 · 0 · 0.
 *
 * What that leaves undriven is the other branch of step 4 — the one an operator
 * reaches by getting the restore **wrong**. `unflaggedCandidates()` carries a
 * comment naming this arm exactly: *"a malformed database being exactly the arm
 * where these steps matter most"*. That fallback is asserted in a comment and
 * reached by no test and no probe. Rounds 191 and 193 both stopped one step
 * short of it: 193's B1 measured that the dry run on such a file "exits 1 and
 * prints no Candidates line" — but not **what it prints instead**, and not what
 * the other two commands do on the same file.
 *
 * The sequence driven here is the one the tool's own text walks an operator
 * into, in order:
 *   1. `--apply` (exit 0, backup named, four steps printed).
 *   2. the app writes one message — Round 193's measured width.
 *   3. a naive `cp` of the backup, i.e. the steps with **step 2 skipped**.
 *      Round 191's H: `database disk image is malformed`.
 *   4. from there, each of the three things the tool tells you to do next:
 *      step 4's own no-flag re-run, another `--apply`, and `--undo` — which the
 *      header calls one of the "two independent ways back".
 *
 * These were found by an exploratory pass (`.testdata/r195-explore*.mts`, not
 * committed) before this file was written, so the arms below are written to
 * **pin down** shapes already seen once, not to predict unseen ones. Stated
 * plainly because the difference matters when reading OPEN items: M1, M2 and M3
 * each reproduced twice before this probe existed.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures are Round 176's, built
 * under `.testdata/r195/` (gitignored).
 *
 *   npx tsx scripts/probe-round195-the-check-step-and-the-undo-path-on-a-database-a-bad-restore-corrupted.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r195');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

type Result = { arm: string; name: string; ok: boolean | 'open'; detail: string };
const checks: Result[] = [];
const measurements: string[] = [];
function check(arm: string, name: string, ok: boolean, detail: string): void {
  checks.push({ arm, name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${arm} · ${name} — ${detail}`);
}
function open_(arm: string, name: string, detail: string): void {
  checks.push({ arm, name, ok: 'open', detail });
  console.log(`  [OPEN] ${arm} · ${name} — ${detail}`);
}
function meas(arm: string, detail: string): void {
  measurements.push(`${arm}: ${detail}`);
  console.log(`  [MEAS] ${arm}: ${detail}`);
}

/** Round 176's fixture, checkpointed so the main file holds all of it. */
function build(dirName: string): string {
  const dir = path.join(DATA, dirName);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
  const db = path.join(dir, 'klatch.db');
  execFileSync('npx', ['tsx', R176], {
    cwd: ROOT,
    env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: db },
    stdio: 'ignore',
  });
  const w = new Database(db, { fileMustExist: true });
  w.pragma('wal_checkpoint(TRUNCATE)');
  w.close();
  return db;
}

function cli(args: string[]) {
  const r = spawnSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status ?? -1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

/** The run's own verdict: a `Candidates:` at column 0 (Round 194 indents the quote). */
const ownLine = (out: string) => /^Candidates:.*$/m.exec(out)?.[0] ?? '(none)';
const quoted = (out: string) => /^ {4,}(Candidates:.*)$/m.exec(out)?.[1] ?? '(none)';
const backupOf = (out: string) =>
  /^Backup \(taken before anything was written\): (.+)$/m.exec(out)?.[1] ?? '';
const intactOf = (out: string) =>
  /^The backup from before this run is intact at:\n {2}(.+)$/m.exec(out)?.[1] ?? '';
const recordOf = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';

/**
 * What a file holds, as a reader would find it.
 *
 * The `finally` is not decoration. The first cut of this probe closed the handle
 * on the success path only — and on this round's arms most reads throw, by
 * design. Each throw left an open connection to a file the probe then deleted
 * the sidecars of and copied over, and every later open **in the same process**
 * came back `disk I/O error`. M7 recorded a correct restore as a failure while
 * the CLI, in its own process, read the same bytes fine (`cmp` identical to the
 * backup). A probe artifact wearing a product failure's clothes, in a round
 * about exactly that shape.
 */
function holds(p: string): { ok: boolean; text: string } {
  if (!fs.existsSync(p)) return { ok: false, text: 'absent' };
  let d: Database.Database | undefined;
  try {
    d = new Database(p, { readonly: true, fileMustExist: true });
    const integrity = (d.pragma('integrity_check') as Array<{ integrity_check: string }>)[0]
      .integrity_check;
    const channels = (d.prepare('SELECT count(*) n FROM channels').get() as { n: number }).n;
    const entities = (d.prepare('SELECT count(*) n FROM entities').get() as { n: number }).n;
    return {
      ok: integrity === 'ok',
      text: `integrity ${integrity} (channels ${channels}, entities ${entities})`,
    };
  } catch (err) {
    return { ok: false, text: `READ FAILED: ${(err as Error).message}` };
  } finally {
    try {
      d?.close();
    } catch {
      /* a handle that will not close is still better closed-attempted than leaked */
    }
  }
}

/** The `.backup-backfill-*` files sitting beside a database, sidecars excluded. */
const snapshotsBeside = (db: string): string[] =>
  fs
    .readdirSync(path.dirname(db))
    .filter((f) => f.includes('.backup-backfill-') && !/-wal$|-shm$/.test(f))
    .sort();

/** A writer that exits without closing its handle — the WAL survives it. */
function writeOneMessage(db: string): void {
  const r = spawnSync(
    'node',
    [
      '-e',
      `const D=require('better-sqlite3');const d=new D(process.argv[1]);d.pragma('journal_mode=WAL');` +
        `d.prepare("INSERT INTO messages (id, channel_id, role, content, status, created_at) ` +
        `VALUES (?, (SELECT id FROM channels LIMIT 1), 'user', ?, 'complete', datetime('now'))")` +
        `.run('r195-'+Date.now(), 'x'.repeat(3000));process.exit(0);`,
      db,
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  if (r.status !== 0) throw new Error(`fixture writer failed: ${r.stderr}`);
}

/** Steps 2 and 3, done right. Nothing holds the file here, so step 1 is a no-op. */
function restoreByHand(db: string, backup: string): boolean {
  if (!backup || !fs.existsSync(backup)) return false;
  fs.rmSync(`${db}-wal`, { force: true });
  fs.rmSync(`${db}-shm`, { force: true });
  fs.copyFileSync(backup, db);
  return true;
}

const size = (p: string): number | 'absent' => (fs.existsSync(p) ? fs.statSync(p).size : 'absent');

console.log(
  "=== Round 195 — step 4's own command, and --undo, on a database a bad restore corrupted ===\n"
);

// ── Arm C — the control: on a healthy database, "intact" is true ─────────────
console.log('Arm C — control: --undo on a healthy database names a backup that really is intact');
const healthy = (() => {
  const db = build('c');
  const applied = cli([db, '--apply']);
  const record = recordOf(applied.out);
  const undone = cli([db, `--undo=${record}`]);
  const b = backupOf(undone.out);
  const h = holds(b);
  check(
    'C0',
    'setup: apply then undo on an undisturbed database, both exit 0',
    applied.code === 0 && undone.code === 0,
    `apply ${applied.code} · undo ${undone.code}`
  );
  check(
    'C1',
    "the undo's own backup is a readable database",
    h.ok,
    `${path.basename(b)} — ${h.text}`
  );
  check(
    'C2',
    'step 4 carries the quoted line on this path (Round 194), not the prose fallback',
    /word for word/.test(undone.out) && quoted(undone.out) !== '(none)',
    `quoted "${quoted(undone.out)}"`
  );
  return { db, applied, undone };
})();

// ── Arm M — the corruption arm, driven the way the tool's own text walks into it
console.log(
  '\nArm M — apply, one message, then the naive cp: what each of the three next commands does'
);
{
  const db = build('m');
  const preApply = cli([db]);
  const applied = cli([db, '--apply']);
  const goodBackup = backupOf(applied.out);
  const record = recordOf(applied.out);
  check(
    'M0',
    'setup: the apply exits 0, names a backup, and quotes step 4 (Round 194 in place)',
    applied.code === 0 && goodBackup !== '' && quoted(applied.out) === ownLine(preApply.out),
    `exit ${applied.code} · quoted "${quoted(applied.out)}" · pre-apply "${ownLine(preApply.out)}"`
  );

  writeOneMessage(db);
  const walBefore = size(`${db}-wal`);
  fs.copyFileSync(goodBackup, db); // step 3 with step 2 skipped — Round 191's H
  const corrupt = holds(db);
  check(
    'M1',
    'the naive cp after one message leaves a database SQLite calls malformed (Round 193, reproduced)',
    !corrupt.ok && /malformed/.test(corrupt.text),
    `-wal at the copy ${walBefore} bytes · the database now: ${corrupt.text}`
  );

  // 1 — step 4's own command, run on the file it exists to check.
  const before = snapshotsBeside(db).length;
  // Sidecars excluded: a crashed dry run leaves the snapshot *and* the `-wal` /
  // `-shm` a read-only open creates beside it, so the raw file count moves by 3.
  const tmpSnapshots = () =>
    fs
      .readdirSync(os.tmpdir())
      .filter((f) => f.startsWith('klatch-backfill-dryrun-') && !/-wal$|-shm$/.test(f));
  // The control for the measurement below: a dry run that completes disposes of
  // its own snapshot, so this delta is 0.
  const tmpHealthyBefore = tmpSnapshots().length;
  cli([healthy.db]);
  const tmpHealthyAfter = tmpSnapshots().length;
  const tmpBefore = tmpSnapshots();
  const dry = cli([db]);
  const tmpAfter = tmpSnapshots();
  const hasStack = /SqliteError|at runMigrations|at planEntityBackfill/.test(dry.out);
  open_(
    'M2',
    "step 4's own command on a malformed database answers with a Node stack trace, not a sentence",
    `exit ${dry.code} · stack trace: ${hasStack} · the script's own voice anywhere in the output: ` +
      `${/^(no such database|Candidates:|Dry run)/m.test(dry.out)} · first line: "${dry.out
        .split('\n')
        .find((l) => l.trim() && !/Deprecation|trace-deprecation/.test(l))
        ?.trim()}"`
  );
  meas(
    'M2',
    `dry-run snapshots left in the temp directory: a dry run that completes, ` +
      `${tmpHealthyBefore} → ${tmpHealthyAfter}; this one, ${tmpBefore.length} → ${tmpAfter.length}. ` +
      `The dry run's snapshot goes to tmpdir rather than beside the database (CLI :269-272), so the ` +
      `orphan is out of the operator's sight rather than in it.`
  );

  // 2 — another --apply on the same file.
  const ap = cli([db, '--apply']);
  const afterApply = snapshotsBeside(db);
  const orphan = afterApply.filter((f) => f !== path.basename(goodBackup));
  const orphanHolds = orphan.length ? holds(path.join(path.dirname(db), orphan[0])) : { ok: false, text: 'none' };
  open_(
    'M3',
    'a second --apply on the malformed database crashes the same way and leaves its snapshot behind',
    `exit ${ap.code} · stack trace: ${/SqliteError|at runMigrations/.test(ap.out)} · ` +
      `.backup-backfill-* beside the database ${before} → ${afterApply.length} · ` +
      `the new one holds: ${orphanHolds.text} · the header's rule is "every refusal … disposes of its snapshot"`
  );

  // 3 — --undo, which the CLI header calls one of "two independent ways back".
  const un = cli([db, `--undo=${record}`]);
  const named = intactOf(un.out) || backupOf(un.out);
  const namedHolds = holds(named);
  open_(
    'M4',
    'the undo names its own fresh snapshot as the backup that is "intact" — and that file is malformed',
    `exit ${un.code} · named "${path.basename(named)}" · it holds: ${namedHolds.text} · ` +
      `the four steps printed below it copy that file over the database`
  );
  check(
    'M5',
    'step 4 falls back to prose rather than a guessed line when the plan cannot be computed (Daedalus\'s claim, driven)',
    !/word for word/.test(un.out) && /should read as it did before the run/.test(un.out),
    `step 4 wording: ${/word for word/.test(un.out) ? 'QUOTED' : 'prose fallback'} · never fatal: the run reached its own error path`
  );
  check(
    'M6',
    'the way back did exist: the apply\'s own backup is still beside the database and still readable',
    holds(goodBackup).ok,
    `${path.basename(goodBackup)} — ${holds(goodBackup).text}`
  );
  meas(
    'M4',
    `after this sequence ${snapshotsBeside(db).length} .backup-backfill-* files sit beside the database, ` +
      `and the one the tool last pointed at is ${namedHolds.ok ? 'readable' : 'NOT readable'}: ` +
      JSON.stringify(snapshotsBeside(db))
  );

  // 4 — and the good path is still good: the printed steps, done right.
  const restored = restoreByHand(db, goodBackup);
  // Byte-identical to the backup, checked by `cmp` and not only by this
  // process's own reader — see the note on `holds` above.
  const identical = spawnSync('cmp', ['-s', goodBackup, db]).status === 0;
  const after = cli([db]);
  const held = holds(db);
  check(
    'M7',
    'the printed steps done in full (delete the sidecars, then copy) still recover, and step 4 then matches the quote',
    restored && identical && held.ok && ownLine(after.out) === quoted(applied.out) && after.code === 0,
    `restored ${restored} · byte-identical to the backup (cmp) ${identical} · ${held.text} · after the steps "${ownLine(after.out)}" · quoted "${quoted(applied.out)}" · exit ${after.code}`
  );
}

// ── Arm N — "re-run this script with no flags", read literally ───────────────
console.log('\nArm N — step 4 says "re-run this script with no flags", and it is the only step you cannot paste');
{
  const out = healthy.applied.out;
  const steps = [1, 2, 3, 4].map(
    (n) => new RegExp(`^ {2}${n}\\. (.*)$`, 'm').exec(out)?.[1] ?? '(missing)'
  );
  const pasteable = steps.map((s) => /^(rm -f|cp) /.test(s));
  meas(
    'N',
    `steps that are literal shell commands: ${pasteable.map((p, i) => `${i + 1}:${p}`).join(' ')} ` +
      `— step 4 is prose ("${steps[3].slice(0, 60)}…")`
  );
  const none = cli([]);
  check(
    'N1',
    'run with literally no arguments, the script refuses in its own voice with the usage line',
    none.code === 1 && /^usage: npx tsx scripts\/backfill-entity-bindings\.mts/m.test(none.out),
    `exit ${none.code} · ${/^usage:/m.test(none.out) ? 'usage line printed' : 'no usage line'}`
  );
  // The natural operator slip: scroll up, reuse your own command, drop --apply.
  const db = build('n');
  const preApply = cli([db]);
  const id = /^ {2}([0-9a-f]{8}) .*(?:MINTED|MATCHED-BY-NAME)/m.exec(preApply.out)?.[1] ?? '';
  const applied = cli([db, '--apply', `--channels=${id}`]);
  restoreByHand(db, backupOf(applied.out));
  const reusedFlags = cli([db, `--channels=${id}`]);
  const noFlags = cli([db]);
  check(
    'N2',
    'after a correct restore, re-running with the flags the operator used prints a line that does NOT match the quote',
    ownLine(noFlags.out) === quoted(applied.out) && ownLine(reusedFlags.out) !== quoted(applied.out),
    `no flags "${ownLine(noFlags.out)}" = quote · their own command "${ownLine(reusedFlags.out)}" ≠ quote`
  );
}

// ── Arm Z — this probe changed no product file ──────────────────────────────
console.log('\nArm Z — files changed');
{
  const dirty = spawnSync(
    'git',
    ['status', '--porcelain', '--', 'packages', 'scripts/backfill-entity-bindings.mts'],
    { cwd: ROOT, encoding: 'utf8' }
  ).stdout.trim();
  check('Z', 'no product or CLI file differs from HEAD', dirty === '', dirty === '' ? 'clean' : dirty);
}

// ── summary ─────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => c.ok === false);
const open = checks.filter((c) => c.ok === 'open');
console.log('\n' + '='.repeat(78));
console.log(
  `${checks.length} checks · ${failed.length} failed · ${open.length} open · ${measurements.length} measurements`
);
if (failed.length) {
  console.log('\nFAILED:');
  for (const c of failed) console.log(`  ${c.arm} · ${c.name}\n    ${c.detail}`);
}
if (open.length) {
  console.log('\nOPEN:');
  for (const c of open) console.log(`  ${c.arm} · ${c.name}`);
}
console.log('='.repeat(78));
process.exit(failed.length ? 1 : 0);
