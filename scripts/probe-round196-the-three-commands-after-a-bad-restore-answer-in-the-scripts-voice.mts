/**
 * Round 196 — the three commands after a bad restore, answered in this script's
 * voice, and a step 4 you can paste.
 *
 * Theseus's Round 195 (`174a19d0`) drove the sequence this tool's own text walks
 * an operator into — apply → one message → naive `cp` (the steps with step 2
 * skipped) → malformed — and then each of the three things the tool tells you to
 * do next. All three answered badly:
 *
 *   M2  step 4's own no-flag re-run printed nothing of its own: a raw
 *       `SqliteError: database disk image is malformed` out of `runMigrations`,
 *       uncaught, exit 1.
 *   M3  a second `--apply` crashed the same way and left its snapshot beside the
 *       database, because the throw skipped `discardSnapshot()`.
 *   M4  `--undo` named its **own fresh snapshot** as the backup that is "intact"
 *       — and that file is a page-for-page copy of the corruption, because
 *       `backup()` copies pages and does not read them.
 *   N2  the natural way to compose step 4 (scroll up, reuse the command you just
 *       ran) prints the *filtered* `Candidates:` line after a `--channels` apply
 *       while step 4 quotes the unfiltered one — a correct restore reported as a
 *       failure, reached from the operator's side.
 *
 * This probe pins the fixes, and the arms are written to hold the shapes Round
 * 195 measured, not to re-discover them. Arm F is the one measurement that
 * decided a design choice rather than checking one: `integrity_check` **throws**
 * on exactly these files, so the check that was supposed to produce a verdict
 * would have produced the same uncaught error it was added to prevent.
 * `quick_check` returns the fault as a row. Theseus named quick_check as "the
 * obvious candidate, not a measured fix"; F is the measurement.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures are Round 176's, built
 * under `.testdata/r196/` (gitignored).
 *
 *   npx tsx scripts/probe-round196-the-three-commands-after-a-bad-restore-answer-in-the-scripts-voice.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r196');
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

/** Run a line the operator would paste, exactly as printed, through a real shell. */
function paste(line: string) {
  const r = spawnSync('/bin/sh', ['-c', line], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status ?? -1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

const ownLine = (out: string) => /^Candidates:.*$/m.exec(out)?.[0] ?? '(none)';
const quoted = (out: string) => /^ {4,}(Candidates:.*)$/m.exec(out)?.[1] ?? '(none)';
const backupOf = (out: string) =>
  /^Backup \(taken before anything was written\): (.+)$/m.exec(out)?.[1] ?? '';
const recordOf = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';
const reverseOf = (out: string) => /^ {2}reverse with: {2}(.+)$/m.exec(out)?.[1] ?? '';
/** Step 4's own command, as printed: the only `npx tsx` line inside the steps. */
const step4Command = (out: string) =>
  /^ {7}(npx tsx scripts\/backfill-entity-bindings\.mts .*)$/m.exec(out)?.[1] ?? '';

/** A Node stack, as distinct from a sentence: the frame lines are the tell. */
const hasStack = (out: string) => /^\s+at .+:\d+:\d+\)?$/m.test(out) || /SqliteError:/.test(out);

/**
 * What a file holds, as a reader would find it — `quick_check`, because
 * `integrity_check` throws on the files this round is about (arm F).
 *
 * The `finally` is Theseus's own Round 195 correction: a handle closed only on
 * the success path leaks on every throw, and on these arms most reads throw by
 * design, which poisoned later opens in the same process with `disk I/O error`.
 */
function holds(p: string): { ok: boolean; text: string } {
  if (!fs.existsSync(p)) return { ok: false, text: 'absent' };
  let d: Database.Database | undefined;
  try {
    d = new Database(p, { readonly: true, fileMustExist: true });
    const rows = d.pragma('quick_check(1)') as Array<Record<string, unknown>>;
    const verdict = String(Object.values(rows[0])[0]).replace(/\n/g, ' ');
    const channels = (d.prepare('SELECT count(*) n FROM channels').get() as { n: number }).n;
    return { ok: verdict === 'ok', text: `quick_check ${verdict} (channels ${channels})` };
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
        `.run('r196-'+Date.now(), 'x'.repeat(3000));process.exit(0);`,
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

console.log(
  "=== Round 196 — the three commands after a bad restore, in this script's voice ===\n"
);

// ── Arm A — the sequence Round 195 drove, and the three commands from there ──
console.log('Arm A — apply → one message → naive cp → each of the three things the tool says to do');
{
  const db = build('a');
  const applied = cli([db, '--apply']);
  const goodBackup = backupOf(applied.out);
  const record = recordOf(applied.out);
  writeOneMessage(db);
  // Step 2 skipped on purpose — this is the mistake, not a fixture shortcut.
  fs.copyFileSync(goodBackup, db);
  const wal = fs.existsSync(`${db}-wal`) ? fs.statSync(`${db}-wal`).size : 0;
  const corrupted = holds(db);
  check(
    'A1',
    "setup: the naive copy leaves a database SQLite won't read",
    applied.code === 0 && !!goodBackup && wal > 0 && !corrupted.ok,
    `apply ${applied.code} · -wal ${wal} · db now ${corrupted.text}`
  );
  const beforeThree = snapshotsBeside(db).length;

  // A2 — M2: step 4's own command.
  const reRun = cli([db]);
  check(
    'A2',
    "step 4's own no-flag re-run answers in a sentence, not a Node stack",
    reRun.code === 1 && !hasStack(reRun.out) && /^cannot read this database:/m.test(reRun.out),
    `exit ${reRun.code} · stack ${hasStack(reRun.out)} · says "${
      /^cannot .*$/m.exec(reRun.out)?.[0] ?? '(no sentence of its own)'
    }"`
  );
  check(
    'A3',
    'that answer names the fault, the sidecars, and every backup beside the database with a verdict',
    /btreeInitPage|malformed/.test(reRun.out) &&
      /Sidecars beside it right now:/.test(reRun.out) &&
      /Backups beside this database, newest first/.test(reRun.out) &&
      reRun.out.includes(path.basename(goodBackup)) &&
      /SQLite reads it as sound/.test(reRun.out),
    `names ${path.basename(goodBackup)} as sound: ${/SQLite reads it as sound/.test(reRun.out)}`
  );
  check(
    'A4',
    'the dry run still disposes of its snapshot on this arm',
    snapshotsBeside(db).length === beforeThree,
    `${beforeThree} before, ${snapshotsBeside(db).length} after`
  );

  // A5 — M3: a second --apply.
  const reApply = cli([db, '--apply']);
  check(
    'A5',
    'a second --apply refuses in a sentence and leaves no new snapshot beside the database',
    reApply.code === 1 &&
      !hasStack(reApply.out) &&
      /^cannot use this database:/m.test(reApply.out) &&
      snapshotsBeside(db).length === beforeThree,
    `exit ${reApply.code} · snapshots ${beforeThree} → ${snapshotsBeside(db).length} · stack ${hasStack(
      reApply.out
    )}`
  );

  // A6 — M4: --undo, the sharpest edge. Nothing it names as a way back may be unreadable.
  const undone = cli([db, `--undo=${record}`]);
  const namedIntact = /is intact at:\n {2}(.+)/.exec(undone.out)?.[1] ?? '';
  const namedBackupLine = backupOf(undone.out);
  const namedPaths = [namedIntact, namedBackupLine].filter(Boolean);
  const unreadableNamed = namedPaths.filter((p) => !holds(p).ok);
  check(
    'A6',
    '--undo names no unreadable file as a way back',
    undone.code === 1 && unreadableNamed.length === 0,
    `exit ${undone.code} · named as a way back: ${
      namedPaths.length ? namedPaths.map((p) => path.basename(p)).join(', ') : 'none'
    } · unreadable among them: ${unreadableNamed.length}`
  );
  check(
    'A7',
    '--undo refuses in a sentence and leaves no new snapshot',
    !hasStack(undone.out) &&
      /^cannot use this database:/m.test(undone.out) &&
      snapshotsBeside(db).length === beforeThree,
    `snapshots ${beforeThree} → ${snapshotsBeside(db).length} · stack ${hasStack(undone.out)}`
  );

  // A8 — the way back is still there and still works, which is what the listing points at.
  const listed = /^ {2}(klatch\.db\.backup-backfill-\S+)$/m.exec(undone.out)?.[1] ?? '';
  const restored = restoreByHand(db, goodBackup);
  const after = holds(db);
  check(
    'A8',
    'the backup the listing marks sound does restore the database',
    restored && after.ok && listed === path.basename(goodBackup),
    `listed "${listed}" · after restore ${after.text}`
  );
  const verify = cli([db]);
  check(
    'A9',
    "and step 4's command then prints the line the apply quoted",
    verify.code === 0 && ownLine(verify.out) === quoted(applied.out),
    `ran "${ownLine(verify.out)}" · quoted "${quoted(applied.out)}"`
  );
  meas('A', `three commands on the corrupt file: exits ${reRun.code}/${reApply.code}/${undone.code}, no stack in any`);
}

// ── Arm B — the control: none of this disturbs a healthy database ────────────
console.log('\nArm B — control: a healthy database still applies, undoes, and self-checks');
{
  const db = build('b');
  const applied = cli([db, '--apply']);
  const record = recordOf(applied.out);
  const backup = backupOf(applied.out);
  check(
    'B1',
    'apply exits 0, names a backup that reads as sound, quotes step 4',
    applied.code === 0 && holds(backup).ok && /word for word/.test(applied.out),
    `exit ${applied.code} · ${path.basename(backup)} ${holds(backup).text}`
  );
  const undone = cli([db, `--undo=${record}`]);
  check(
    'B2',
    'undo exits 0 and its own backup reads as sound',
    undone.code === 0 && holds(backupOf(undone.out)).ok,
    `exit ${undone.code} · ${holds(backupOf(undone.out)).text}`
  );
  const dry = cli([db]);
  check('B3', 'the dry run still exits 0 and leaves no snapshot beside the database', dry.code === 0 && snapshotsBeside(db).length === 2, `exit ${dry.code} · ${snapshotsBeside(db).length} snapshots (the apply's and the undo's)`);
}

// ── Arm D — N2: step 4 prints the command it means, and that command agrees ──
console.log('\nArm D — N2: after a --channels apply, step 4 prints its own command');
{
  const db = build('d');
  const dry = cli([db]);
  // A channel the run would actually *move* — a `--channels` list of skips
  // applies nothing, prints no backup and no steps, and would make every check
  // below pass on an empty string. (It did, on this probe's first cut.)
  const movers = (dry.out.split('Per-channel:')[1] ?? '')
    .split('\n')
    .filter((l) => /(MATCHED-BY-NAME|MINTED) → /.test(l))
    .map((l) => /^ {2}(\S{8}) /.exec(l)?.[1])
    .filter((x): x is string => !!x);
  if (!movers.length) throw new Error('fixture has no channel that would move');
  const applied = cli([db, `--channels=${movers[0]}`, '--apply']);
  const cmd = step4Command(applied.out);
  const backup = backupOf(applied.out);
  check(
    'D1',
    'the apply ran filtered and step 4 quotes the unfiltered line',
    applied.code === 0 &&
      /in scope matched your --channels filter/.test(ownLine(applied.out)) &&
      quoted(applied.out) !== '(none)' &&
      !/matched your --channels filter/.test(quoted(applied.out)),
    `ran "${ownLine(applied.out)}" · quoted "${quoted(applied.out)}"`
  );
  check(
    'D2',
    'step 4 prints a command, and it carries no flags',
    !!cmd && !/--channels|--bases|--apply|--undo/.test(cmd),
    cmd || '(no command printed)'
  );
  // The operator's side: restore correctly, then paste step 4's command.
  restoreByHand(db, backup);
  const pasted = paste(cmd);
  check(
    'D3',
    'the pasted command prints exactly the line step 4 told the operator to expect',
    pasted.code === 0 &&
      quoted(applied.out) !== '(none)' &&
      ownLine(pasted.out) === quoted(applied.out),
    `pasted "${ownLine(pasted.out)}" · expected "${quoted(applied.out)}"`
  );
  // The shape Round 195 measured from the operator's side: scrolling up and
  // reusing the command they just ran still disagrees — that is why step 4
  // prints its own. Recorded, not fixed: it is a fact about the old habit.
  const scrolledUp = cli([db, `--channels=${movers[0]}`]);
  meas(
    'D4',
    `the command the operator would have scrolled up to reuse still prints "${ownLine(
      scrolledUp.out
    )}" against a quote of "${quoted(applied.out)}" — the reason step 4 now prints its own`
  );
}

// ── Arm E — the other printed command, on a path with a space ───────────────
console.log('\nArm E — `reverse with:` was never driven through a shell');
{
  const dir = path.join(DATA, 'e dir with space');
  fs.rmSync(dir, { recursive: true, force: true });
  const built = build('e');
  fs.mkdirSync(dir, { recursive: true });
  const db = path.join(dir, "xian's klatch.db");
  fs.copyFileSync(built, db);
  const applied = cli([db, '--apply']);
  const line = reverseOf(applied.out);
  check('E1', 'the apply worked on a path with a space and an apostrophe', applied.code === 0, `exit ${applied.code}`);
  const pasted = paste(line);
  check(
    'E2',
    'the printed `reverse with:` line runs as written through /bin/sh',
    pasted.code === 0 && /Reverted \d+ channel/.test(pasted.out),
    `exit ${pasted.code} · ${/Reverted .*/.exec(pasted.out)?.[0] ?? pasted.out.trim().split('\n').slice(-1)[0]}`
  );
  const cmd = step4Command(applied.out);
  const pasted4 = paste(cmd);
  check(
    'E3',
    "and so does step 4's command on the same path",
    pasted4.code === 0 && ownLine(pasted4.out) !== '(none)',
    `exit ${pasted4.code} · "${ownLine(pasted4.out)}"`
  );
}

// ── Arm F — the measurement behind the design choice ─────────────────────────
console.log('\nArm F — why quick_check and not integrity_check');
{
  const db = build('f');
  const applied = cli([db, '--apply']);
  const backup = backupOf(applied.out);
  writeOneMessage(db);
  fs.copyFileSync(backup, db);
  const read = (p: string, pragma: string): string => {
    let d: Database.Database | undefined;
    try {
      d = new Database(p, { readonly: true, fileMustExist: true });
      const rows = d.pragma(pragma) as Array<Record<string, unknown>>;
      return `returned: ${String(Object.values(rows[0])[0]).replace(/\n/g, ' ')}`;
    } catch (err) {
      return `THREW: ${(err as Error).message}`;
    } finally {
      try {
        d?.close();
      } catch {
        /* ignore */
      }
    }
  };
  const quick = read(db, 'quick_check(1)');
  const full = read(db, 'integrity_check');
  check(
    'F1',
    'integrity_check throws on exactly the file a verdict is needed for',
    full.startsWith('THREW'),
    full
  );
  check(
    'F2',
    'quick_check returns the fault as a row instead',
    quick.startsWith('returned:') && !quick.includes('ok'),
    quick
  );
  // `backup()` from a corrupt source is M4's mechanism, driven rather than cited.
  const snap = `${db}.r196-copy`;
  fs.rmSync(snap, { force: true });
  let src: Database.Database | undefined;
  let copied = false;
  try {
    src = new Database(db, { readonly: true, fileMustExist: true });
    await src.backup(snap);
    copied = true;
  } catch {
    copied = false;
  } finally {
    try {
      src?.close();
    } catch {
      /* ignore */
    }
  }
  check(
    'F3',
    'db.backup() from a corrupt source succeeds and copies the corruption, silently',
    copied && !holds(snap).ok,
    `backup() ${copied ? 'succeeded' : 'threw'} · copy ${holds(snap).text}`
  );
  const t0 = Date.now();
  holds(backup);
  meas('F4', `quick_check on the healthy ${fs.statSync(backup).size.toLocaleString()}-byte backup: ${Date.now() - t0}ms`);
}

// ── Summary ──────────────────────────────────────────────────────────────────
const pass = checks.filter((c) => c.ok === true).length;
const fail = checks.filter((c) => c.ok === false).length;
const open = checks.filter((c) => c.ok === 'open').length;
console.log(`\n=== ${pass} passed · ${fail} failed · ${open} open · ${measurements.length} measurements ===`);
for (const c of checks.filter((c) => c.ok !== true)) console.log(`  ${c.ok === false ? 'FAIL' : 'OPEN'} ${c.arm} — ${c.name}: ${c.detail}`);
for (const m of measurements) console.log(`  MEAS ${m}`);
process.exit(fail ? 1 : 0);
