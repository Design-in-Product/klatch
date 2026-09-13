/**
 * Round 198 — a way back has tables in it, and the sidecar is not the database.
 *
 * Theseus's Round 198 input is his Round 197 (`10bbcbff`), reproduced unmodified
 * from this seat this fire at **18 · 0 failed · 6 open · 6 measurements** — his
 * table line for line, all six opens in the same places. He drove the rule Round
 * 196 made load-bearing, *"take the newest one that reads as sound"*, at the six
 * shapes a half-finished copy actually leaves beside a database, and found the
 * one that gets through:
 *
 *   P2/P3/P4/Q4  a **zero-length** file is a *valid empty* SQLite database —
 *                `quick_check` and `integrity_check` both return `ok` — so the
 *                listing called it sound; it is written last, so the printed
 *                rule pointed at it; and following that rule left `klatch.db`
 *                at 0 bytes with SQLite calling the result sound. It is what a
 *                `cp` that died in its first instant leaves, and what a `cp`
 *                onto a full disk leaves: `cp` truncates the destination before
 *                it reads the source.
 *   R1           the dry run aimed at `klatch.db-wal` — one tab away from
 *                `klatch.db` — answered with `SqliteError: file is not a
 *                database` and a raw `better-sqlite3/lib/methods/backup.js:43`
 *                stack, because `source.backup()` sat *above* the `try` that
 *                `unreadable()` is the catch for.
 *   R3/R4        aimed at an empty file that exists, the tool reported
 *                `Candidates: 0 — 0 would move, 0 skipped.` and exit 0 over a
 *                corpus that does not exist — and the `--apply` built an
 *                8-table Klatch schema in the file it was describing.
 *   Q5           a file with no read permission reported `unable to open
 *                database file` and nothing about permissions.
 *
 * All four of his shapes are built. What this probe pins:
 *
 *   A. The listing, at the zero-length file. The verdict is a **table-count**
 *      floor, not a size one and not `ok` — every `.backup-backfill-*` file is
 *      by construction a copy this tool took of a Klatch database, so one with
 *      no tables is not a way back whatever its size, and the rule needs no
 *      comparison against a target whose own count is usually unknowable
 *      (it is damaged when this prints). **A4 follows the printed rule
 *      mechanically** — parses the listing, takes the newest row the tool
 *      itself calls sound, runs all four steps with it — because the rule
 *      pointing somewhere better is the whole claim.
 *   B. The other five shapes, unchanged, plus Q5's permissions clause.
 *   C. The sidecar path. Answered as *the sidecar, not the database*, with the
 *      real file named, and — the reason this is not merely cosmetic — **not**
 *      as damage: a restore is the wrong remedy and the backup listing would
 *      be searching beside a file that has never had one.
 *   D. The empty file. A dry run is not refused (an empty database is a legal
 *      thing to point this at) but says the zero is the file and not the
 *      corpus; a **writing** run refuses, because the alternative measured in
 *      R4 is creating the schema it then reports finding no work in.
 *   E. Controls on a healthy corpus — the note must not print, the refusals
 *      must not fire, and the apply must still work end to end.
 *   F. What the floor costs. Round 196's F4 and his arm S measured `quick_check`
 *      at ~0.4ms/MB, per file listed. The table count is one `count(*)` over
 *      `sqlite_master` on a handle already open; F measures it at the same three
 *      rungs so the answer is a number rather than an expectation.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures are Round 176's, built
 * under `.testdata/r198/` (gitignored).
 *
 *   npx tsx scripts/probe-round198-a-way-back-has-tables-in-it-and-the-sidecar-is-not-the-database.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r198');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

type Result = { arm: string; name: string; ok: boolean | 'open'; detail: string };
const checks: Result[] = [];
const measurements: string[] = [];
function check(arm: string, name: string, ok: boolean, detail: string): void {
  checks.push({ arm, name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${arm} · ${name} — ${detail}`);
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

/**
 * The first line the *script* says, which is the thing every voice check in
 * this round is about.
 *
 * Node's own `DEP0205 module.register()` warning lands on stderr ahead of it
 * non-deterministically under `npx tsx` — three details in the first run of
 * this probe reported it as the tool's opening sentence while the assertions
 * beside them passed, which is a detail line that misinforms its reader.
 */
const firstLine = (out: string) =>
  out
    .split('\n')
    .map((l) => l.trim())
    .find(
      (l) =>
        l.length &&
        !/^\(node:\d+\)/.test(l) &&
        !/DeprecationWarning/.test(l) &&
        !/^\(Use `node --trace-/.test(l)
    ) ??
  '(no output)';

/** A Node stack, as distinct from a sentence: the frame lines are the tell. */
const hasStack = (out: string) => /^\s+at .+:\d+:\d+\)?$/m.test(out) || /SqliteError:/.test(out);

const ownLine = (out: string) => /^Candidates:.*$/m.exec(out)?.[0] ?? '(none)';
const backupOf = (out: string) =>
  /^Backup \(taken before anything was written\): (.+)$/m.exec(out)?.[1] ?? '';

/**
 * The `.backup-backfill-*` listing as an operator reads it: name, then the
 * verdict line under it. `sound` is the phrase the printed rule names, so it is
 * matched as the rule's reader would — the row is a way back only if the tool
 * used those words on it.
 */
function listing(out: string): Array<{ name: string; sound: boolean; why: string }> {
  const lines = out.split('\n');
  const rows: Array<{ name: string; sound: boolean; why: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const name = /^ {2}(klatch\.db\.backup-backfill-\S+)\s*$/.exec(lines[i]);
    if (!name) continue;
    const verdict = lines[i + 1] ?? '';
    rows.push({
      name: name[1].trim(),
      sound: /SQLite reads it as sound/.test(verdict),
      why: verdict.trim(),
    });
  }
  return rows;
}

/** What a file holds, as a reader would find it. Handle closed on every path. */
function holds(p: string): { ok: boolean; text: string; channels: number; tables: number } {
  if (!fs.existsSync(p)) return { ok: false, text: 'absent', channels: -1, tables: -1 };
  let d: Database.Database | undefined;
  try {
    d = new Database(p, { readonly: true, fileMustExist: true });
    const q = (d.pragma('quick_check(1)') as Array<Record<string, unknown>>)[0];
    const verdict = String(Object.values(q)[0]);
    let channels = -1;
    try {
      channels = (d.prepare('SELECT count(*) n FROM channels').get() as { n: number }).n;
    } catch {
      channels = -1;
    }
    const tables = (
      d
        .prepare(
          "SELECT count(*) n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
        .get() as { n: number }
    ).n;
    return {
      ok: verdict === 'ok',
      text: `quick_check ${verdict.split('\n').filter((l) => !/^\*{3}/.test(l))[0] ?? verdict} (${tables} tables, channels ${channels})`,
      channels,
      tables,
    };
  } catch (err) {
    return { ok: false, text: `READ FAILED: ${(err as Error).message}`, channels: -1, tables: -1 };
  } finally {
    try {
      d?.close();
    } catch {
      /* a handle that will not close is still better closed-attempted than leaked */
    }
  }
}

/** A writer that exits without closing its handle — the WAL survives it. */
function writeOneMessage(db: string): void {
  const r = spawnSync(
    'node',
    [
      '-e',
      `const D=require('better-sqlite3');const d=new D(process.argv[1]);d.pragma('journal_mode=WAL');` +
        `d.prepare("INSERT INTO messages (id, channel_id, role, content, status, created_at) ` +
        `VALUES (?, (SELECT id FROM channels LIMIT 1), 'user', ?, 'complete', datetime('now'))")` +
        `.run('r198-'+Date.now(), 'x'.repeat(3000));process.exit(0);`,
      db,
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  if (r.status !== 0) throw new Error(`fixture writer failed: ${r.stderr}`);
}

/** Steps 2 and 3 of the printed restore, done right. */
function restoreByHand(db: string, backup: string): boolean {
  if (!backup || !fs.existsSync(backup)) return false;
  fs.rmSync(`${db}-wal`, { force: true });
  fs.rmSync(`${db}-shm`, { force: true });
  fs.copyFileSync(backup, db);
  return true;
}

/** A `.backup-backfill-*` name stamped later than every one already there. */
function laterStamp(db: string, minutesLater: number): string {
  const stamp = new Date(Date.now() + minutesLater * 60_000).toISOString().replace(/[:.]/g, '-');
  return `${db}.backup-backfill-${stamp}`;
}

const sizeOf = (p: string): number | 'absent' => (fs.existsSync(p) ? fs.statSync(p).size : 'absent');

console.log('=== Round 198 — a way back has tables in it, and the sidecar is not the database ===\n');

// ── Arm A — the listing, at the shape that got through ──────────────────────
console.log('Arm A — the zero-length .backup-backfill-*, and the rule that pointed at it');
{
  const db = build('a');
  const applied = cli([db, '--apply']);
  const goodBackup = backupOf(applied.out);
  writeOneMessage(db);
  fs.copyFileSync(goodBackup, db); // step 3 with step 2 skipped — Round 191's H
  const empty = laterStamp(db, 1);
  fs.writeFileSync(empty, '');
  const corrupt = holds(db);
  const goodHolds = holds(goodBackup);
  check(
    'A0',
    "setup reproduces Theseus's P: a malformed database, a sound backup, and a newer zero-length one",
    !corrupt.ok && sizeOf(empty) === 0 && goodHolds.ok && goodHolds.channels === 10,
    `db: ${corrupt.text} · ${path.basename(goodBackup)} ${sizeOf(goodBackup)} B ${goodHolds.channels} channels · ${path.basename(empty)} ${sizeOf(empty)} B`
  );

  const dry = cli([db]); // step 4's own command
  const rows = listing(dry.out);
  const emptyRow = rows.find((r) => r.name === path.basename(empty));
  check(
    'A1',
    'the refusal is unchanged: a sentence, exit 1, no stack, both files still listed',
    dry.code === 1 && !hasStack(dry.out) && rows.length === 2,
    `exit ${dry.code} · stack ${hasStack(dry.out)} · listed ${rows.length} · first line: "${firstLine(dry.out)}"`
  );
  check(
    'A2',
    'the zero-length file is no longer called sound, and its verdict names the fact ls would show',
    !!emptyRow && !emptyRow.sound && /NOT A WAY BACK/.test(emptyRow.why) && /0 bytes/.test(emptyRow.why),
    `${path.basename(empty)} → "${emptyRow?.why ?? '(not listed)'}"`
  );
  const newestSound = rows.find((r) => r.sound);
  check(
    'A3',
    "the tool's own rule now points at the real backup, not the empty file",
    !!newestSound && newestSound.name === path.basename(goodBackup),
    `printed order: ${rows.map((r) => `${r.name.replace(/^klatch\.db\./, '')}=${r.sound ? 'sound' : 'not a way back'}`).join(', ')} · ` +
      `newest sound: ${newestSound ? newestSound.name : '(none)'}`
  );

  // Follow the printed rule mechanically — not the file a human picked, the
  // file the listing itself nominates. This is the claim.
  const nominated = newestSound ? path.join(path.dirname(db), newestSound.name) : '';
  restoreByHand(db, nominated);
  const after = holds(db);
  check(
    'A4',
    'following that rule, as printed, gives the corpus back',
    after.ok && after.channels === 10,
    `restored from ${nominated ? path.basename(nominated) : '(nothing nominated)'} · after the four steps: ${after.text} · db ${sizeOf(db)} B`
  );

  // And step 4 still agrees, which is the check Round 194 built.
  const step4 = cli([db]);
  check(
    'A5',
    "step 4's own re-run now reports the restore as correct",
    step4.code === 0 && ownLine(step4.out) === 'Candidates: 8 — 4 would move, 4 skipped.',
    `exit ${step4.code} · "${ownLine(step4.out)}"`
  );
  check(
    'A6',
    'the sound row carries its shape, so three copies differing only by timestamp can be told apart',
    !!newestSound && /\d+ tables, [\d,]+ bytes/.test(newestSound.why),
    `"${newestSound?.why ?? '(none)'}"`
  );
}

// ── Arm B — the other five shapes, unchanged, and Q5's missing word ─────────
console.log('\nArm B — the same listing at every other shape a half-finished copy leaves');
{
  const db = build('b');
  const applied = cli([db, '--apply']);
  const goodBackup = backupOf(applied.out);
  writeOneMessage(db);
  fs.copyFileSync(goodBackup, db);

  // Five more candidates beside the real one, each a shape a failed copy leaves.
  const truncated = laterStamp(db, 1);
  const whole = fs.readFileSync(goodBackup);
  fs.writeFileSync(truncated, whole.subarray(0, 4096 * 3));
  const text = laterStamp(db, 2);
  fs.writeFileSync(text, 'this is not a database\n');
  const dir = laterStamp(db, 3);
  fs.mkdirSync(dir, { recursive: true });
  const noperm = laterStamp(db, 4);
  fs.copyFileSync(goodBackup, noperm);
  fs.chmodSync(noperm, 0o000);
  const empty = laterStamp(db, 5);
  fs.writeFileSync(empty, '');

  const dry = cli([db]);
  const rows = listing(dry.out);
  const by = (p: string) => rows.find((r) => r.name === path.basename(p));
  check(
    'B1',
    'the refusal survives all six: a sentence, no stack, exit 1, every file named',
    dry.code === 1 && !hasStack(dry.out) && rows.length === 6,
    `exit ${dry.code} · stack ${hasStack(dry.out)} · listed ${rows.length} of 6 · first line: "${firstLine(dry.out)}"`
  );
  check(
    'B2',
    'not one of the five broken shapes is called a way back',
    [truncated, text, dir, noperm, empty].every((p) => by(p) && !by(p)!.sound),
    [truncated, text, dir, noperm, empty]
      .map((p) => `${path.basename(p).replace(/^klatch\.db\.backup-backfill-/, '')} → ${by(p)?.sound ? 'SOUND' : 'refused'}`)
      .join(' · ')
  );
  check(
    'B3',
    'the one the apply actually took is still the only row called sound — the listing is not simply pessimistic',
    rows.filter((r) => r.sound).length === 1 && by(goodBackup)?.sound === true,
    `sound rows: ${rows.filter((r) => r.sound).length} · ${path.basename(goodBackup)} → "${by(goodBackup)?.why ?? '(not listed)'}"`
  );
  check(
    'B4',
    "Q5: the unreadable-by-permission file's verdict now names permissions",
    /permission/i.test(by(noperm)?.why ?? ''),
    `"${by(noperm)?.why ?? '(not listed)'}"`
  );
  meas(
    'B',
    `verdict per shape: ${[
      ['truncated at a page boundary', truncated],
      ['a text file', text],
      ['a directory', dir],
      ['no read permission', noperm],
      ['zero length', empty],
      ["the apply's own backup", goodBackup],
    ]
      .map(([label, p]) => `${label} → "${by(p as string)?.why ?? '(not listed)'}"`)
      .join(' | ')}`
  );
  fs.chmodSync(noperm, 0o644); // leave the fixture removable
}

// ── Arm C — the path one tab away ───────────────────────────────────────────
console.log('\nArm C — klatch.db-wal, the path tab completion offers next');
{
  const db = build('c');
  writeOneMessage(db); // leaves a real -wal beside the database
  const wal = `${db}-wal`;
  const before = sizeOf(wal);
  check(
    'C0',
    'setup: a real database with a real -wal beside it',
    holds(db).ok && typeof before === 'number' && before > 0,
    `db ${holds(db).text} · ${path.basename(wal)} ${before} B`
  );

  const dry = cli([wal]);
  check(
    'C1',
    'the dry run aimed at the -wal answers in a sentence, not a backup.js stack',
    dry.code === 1 && !hasStack(dry.out),
    `exit ${dry.code} · stack ${hasStack(dry.out)} · first line: "${firstLine(dry.out)}"`
  );
  check(
    'C2',
    'it names the file the operator probably meant',
    dry.out.includes(db) && /sidecar/i.test(dry.out),
    `names ${path.basename(db)}: ${dry.out.includes(db)} · says "sidecar": ${/sidecar/i.test(dry.out)}`
  );
  check(
    'C3',
    'and does not diagnose it as damage — a restore is the wrong remedy and there is no backup beside a -wal',
    !/reads it as damaged/.test(dry.out) && !/backup-backfill/.test(dry.out),
    `"reads it as damaged": ${/reads it as damaged/.test(dry.out)} · mentions a backup listing: ${/backup-backfill/.test(dry.out)}`
  );
  const applied = cli([wal, '--apply']);
  const after = holds(db);
  check(
    'C4',
    '--apply at the same path refuses the same way and still writes nothing',
    applied.code === 1 && !hasStack(applied.out) && sizeOf(wal) === before && after.ok && after.channels === 10,
    `exit ${applied.code} · ${path.basename(wal)} ${before} → ${sizeOf(wal)} B · db after: ${after.text} · first line: "${firstLine(applied.out)}"`
  );
  // A bare file that merely ends in `-wal`, with no database beside it, is not
  // this mistake and must not be told it is.
  const lone = path.join(path.dirname(db), 'notes-wal');
  fs.writeFileSync(lone, 'not a database\n');
  const loneRun = cli([lone]);
  // Matched on the *sentence*, not the word. The first cut of this check
  // grepped the whole output for /sidecar/i and failed: the refusal it gets is
  // the ordinary corrupt-file one, which ends in `sidecarNote()` — "Sidecars
  // beside it right now: notes-wal-wal (0 bytes), notes-wal-shm (32,768
  // bytes)", left by this tool's own read-only open. That is correct output and
  // a wrong assertion; recorded rather than quietly reworded.
  const calledASidecar = /it is one of its sidecars/.test(loneRun.out);
  check(
    'C5',
    'control: a file that merely ends in -wal, with no database beside it, is not told it is a sidecar',
    loneRun.code === 1 && !calledASidecar && !hasStack(loneRun.out),
    `exit ${loneRun.code} · told it is a sidecar: ${calledASidecar} · stack ${hasStack(loneRun.out)} · first line: "${firstLine(loneRun.out)}"`
  );
}

// ── Arm D — the empty file that exists ──────────────────────────────────────
console.log('\nArm D — an empty file: a legal dry-run target, never a writing one');
{
  const dir = path.join(DATA, 'd');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const empty = path.join(dir, 'klatch.db');
  fs.writeFileSync(empty, '');

  const dry = cli([empty]);
  check(
    'D1',
    'the dry run is not refused — an empty database is a legal thing to point this at',
    dry.code === 0,
    `exit ${dry.code} · "${ownLine(dry.out)}"`
  );
  check(
    'D2',
    'but it says the zero is the file and not the corpus, right after the line step 4 asks the operator to compare',
    /held no tables before this run/.test(dry.out) && /0 bytes/.test(dry.out),
    `note present: ${/held no tables before this run/.test(dry.out)} · names 0 bytes: ${/0 bytes/.test(dry.out)}`
  );
  const afterDry = holds(empty);
  check(
    'D3',
    'and the dry run still leaves the file it was pointed at alone',
    sizeOf(empty) === 0 && afterDry.tables === 0,
    `after the dry run: ${sizeOf(empty)} B, ${afterDry.tables} tables`
  );

  const applied = cli([empty, '--apply']);
  const afterApply = holds(empty);
  check(
    'D4',
    'the writing run refuses instead of building a Klatch schema in it',
    applied.code === 1 && !hasStack(applied.out) && sizeOf(empty) === 0 && afterApply.tables === 0,
    `exit ${applied.code} · stack ${hasStack(applied.out)} · after --apply: ${sizeOf(empty)} B, ${afterApply.tables} tables · first line: "${firstLine(applied.out)}"`
  );
  check(
    'D5',
    'the refusal leaves nothing behind — no snapshot, no undo record, no sidecars',
    fs.readdirSync(dir).length === 1,
    `files in the directory: ${fs.readdirSync(dir).join(', ')}`
  );
  const undone = cli([empty, '--undo=/nonexistent.json']);
  check(
    'D6',
    'an --undo at the same file refuses before it reaches the record, for the same reason',
    undone.code === 1 && !hasStack(undone.out),
    `exit ${undone.code} · first line: "${firstLine(undone.out)}"`
  );
}

// ── Arm E — the healthy corpus, untouched ───────────────────────────────────
console.log('\nArm E — controls: nothing above fires on a database that is fine');
{
  const db = build('e');
  const dry = cli([db]);
  check(
    'E1',
    'a dry run on a healthy corpus is unchanged and prints no empty-file note',
    dry.code === 0 &&
      ownLine(dry.out) === 'Candidates: 8 — 4 would move, 4 skipped.' &&
      !/held no tables before this run/.test(dry.out),
    `exit ${dry.code} · "${ownLine(dry.out)}" · note printed: ${/held no tables before this run/.test(dry.out)}`
  );
  const applied = cli([db, '--apply']);
  const backup = backupOf(applied.out);
  const after = holds(db);
  check(
    'E2',
    'an apply still runs end to end, takes a backup, and leaves the corpus readable',
    applied.code === 0 && !!backup && fs.existsSync(backup) && after.ok && after.channels === 10,
    `exit ${applied.code} · backup ${backup ? path.basename(backup) : '(none)'} ${sizeOf(backup)} B · db after: ${after.text}`
  );
  const second = cli([db]);
  const rows = listing(second.out);
  check(
    'E3',
    "a healthy re-run does not print the backup listing at all — it is a refusal's output, not a run's",
    second.code === 0 && rows.length === 0,
    `exit ${second.code} · rows listed: ${rows.length} · "${ownLine(second.out)}"`
  );
}

// ── Arm F — what the floor costs ────────────────────────────────────────────
console.log('\nArm F — the table count, at the sizes Theseus measured quick_check at');
{
  const dir = path.join(DATA, 'f');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const rungs: Array<{ mb: number; quick: number; tables: number }> = [];
  const db = path.join(dir, 'grow.db');
  const w = new Database(db);
  w.pragma('journal_mode = WAL');
  w.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, blob TEXT)');
  const ins = w.prepare('INSERT INTO t (blob) VALUES (?)');
  const batch = w.transaction((n: number) => {
    for (let i = 0; i < n; i++) ins.run('x'.repeat(4000));
  });
  for (const target of [8, 24, 64]) {
    while (fs.statSync(db).size / 1e6 < target) batch(250);
    w.pragma('wal_checkpoint(TRUNCATE)');
    const mb = fs.statSync(db).size / 1e6;
    // Best of two, warm — the same protocol his arm S used, so the two numbers
    // are comparable.
    let quick = Infinity;
    let tables = Infinity;
    for (let i = 0; i < 2; i++) {
      const d = new Database(db, { readonly: true, fileMustExist: true });
      let t = process.hrtime.bigint();
      d.pragma('quick_check(1)');
      quick = Math.min(quick, Number(process.hrtime.bigint() - t) / 1e6);
      t = process.hrtime.bigint();
      d.prepare(
        "select count(*) as n from sqlite_master where type = 'table' and name not like 'sqlite_%'"
      ).get();
      tables = Math.min(tables, Number(process.hrtime.bigint() - t) / 1e6);
      d.close();
    }
    rungs.push({ mb: Math.round(mb * 10) / 10, quick, tables });
  }
  w.close();
  const fmt = (n: number) => `${n.toFixed(n < 1 ? 3 : 1)}ms`;
  meas(
    'F1',
    `best of two warm runs: ${rungs.map((r) => `${r.mb}MB → quick_check ${fmt(r.quick)}, table count ${fmt(r.tables)}`).join(' · ')}`
  );
  const worstShare = Math.max(...rungs.map((r) => r.tables / r.quick));
  check(
    'F2',
    'the floor is free against the check it qualifies — the table count is a schema read, not a page scan',
    worstShare < 0.1,
    `worst rung: the table count is ${(worstShare * 100).toFixed(1)}% of quick_check on the same file · ` +
      `it does not grow with the file (${rungs.map((r) => `${r.mb}MB=${fmt(r.tables)}`).join(', ')})`
  );
  meas(
    'F3',
    `Round 196 F4 / his S3 stand unchanged: a refusal listing N backups still pays quick_check N+1 times at ~0.4ms/MB, and the floor adds ` +
      `${rungs.map((r) => fmt(r.tables)).join('/')} to each. Cold cache is still not measured. On the apply path the count is read from the ` +
      `handle source.backup() already holds, so a writing run pays nothing new at all.`
  );
}

const failed = checks.filter((c) => c.ok === false);
console.log(`\n${'='.repeat(78)}`);
console.log(
  `${checks.length} checks · ${failed.length} failed · ${measurements.length} measurements`
);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  ${f.arm} · ${f.name}\n    ${f.detail}`);
}
console.log('='.repeat(78));
process.exit(failed.length ? 1 : 0);
