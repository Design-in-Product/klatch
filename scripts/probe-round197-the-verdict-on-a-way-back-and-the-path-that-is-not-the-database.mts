/**
 * Round 197 — the verdict the new listing puts on a way back, and what the tool
 * does when the path it is given is not the database.
 *
 * Round 196 (`d35b9b01`) closed Round 195's M2/M3/M4 and N2 by giving every arm
 * that ends "this database cannot be read" a sentence, and by listing the
 * `.backup-backfill-*` files actually beside the database **each with its own
 * verdict**, under a printed rule: *"a snapshot taken after the damage is a copy
 * of it, so newest is not the answer — take the newest one that reads as
 * sound"*. Reproduced unmodified this fire: **21 · 0 failed · 0 open · 3**.
 *
 * That rule is now load-bearing: it is the sentence an operator follows at the
 * moment they have a database that will not open. It rests entirely on
 * `quickCheck()` (CLI `:386-409`) being able to tell a way back from something
 * that is not one. Daedalus put the invariant in writing — *"a
 * `.backup-backfill-*` file beside the database is never a known-bad copy"* —
 * and asked to be told if it reads the other way. This round drives the verdict
 * itself, at the files a half-finished copy actually leaves behind.
 *
 * Three things are driven, in the order an operator meets them:
 *
 *   P. The listing, with a **zero-length** `.backup-backfill-*` beside the
 *      database — what a `cp` that died before it wrote anything leaves, and
 *      what a `cp` onto a full disk leaves. Measured first, outside the CLI:
 *      SQLite reads a 0-byte file as a valid empty database and `quick_check`
 *      returns `ok`.
 *   Q. The same listing at every other shape a failed copy leaves: a truncated
 *      database, a text file, a directory, a file with no read permission.
 *   R. The path itself. `klatch.db-wal` sits beside `klatch.db` and is one tab
 *      away from it; `fileMustExist` is satisfied by anything on disk.
 *   S. What the listing costs. Round 196's F4 measured `quick_check` on a 94KB
 *      backup (12ms) and recorded the cost on a corpus the size of xian's as
 *      **not measured**. It is measured here, and it is per file listed.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures are Round 176's, built
 * under `.testdata/r197/` (gitignored).
 *
 *   npx tsx scripts/probe-round197-the-verdict-on-a-way-back-and-the-path-that-is-not-the-database.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r197');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

/**
 * The files this round's verdicts actually rest on. `CLI` is the subject — every P/Q/R verdict is a
 * reading of what it prints. `R176` is executed to BUILD the fixtures those verdicts are taken over
 * (see {@link build}), so a modified R176 changes the fixture and therefore the verdict, exactly as
 * a modified CLI does. Neither reaches `packages/`: both import only node builtins and
 * `better-sqlite3`, checked before this list was written, which is why `packages/` is not in it.
 */
const SUBJECTS = ['scripts/backfill-entity-bindings.mts', 'scripts/probe-round176-backfill-cli-end-to-end.mts'];

// Round 266: the bracket is taken at open, before anything in this file runs, so arm Z grades the
// whole run rather than the tail of it.
const zBefore = fingerprint(ROOT, 'packages/');
const zBeforeScripts = fingerprint(ROOT, 'scripts/');

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
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status ?? -1, out: (r.stdout ?? '') + (r.stderr ?? ''), ms: Date.now() - t0 };
}

const ownLine = (out: string) => /^Candidates:.*$/m.exec(out)?.[0] ?? '(none)';
const quoted = (out: string) => /^ {4,}(Candidates:.*)$/m.exec(out)?.[1] ?? '(none)';
const backupOf = (out: string) =>
  /^Backup \(taken before anything was written\): (.+)$/m.exec(out)?.[1] ?? '';
const firstLine = (out: string) =>
  out
    .split('\n')
    .find((l) => l.trim() && !/Deprecation|trace-deprecation/.test(l))
    ?.trim() ?? '(nothing)';
const hasStack = (out: string) => /SqliteError|^\s+at [A-Za-z]/m.test(out);

/**
 * The verdict lines the CLI prints, read the way an operator reads them: each
 * `.backup-backfill-*` name in printed order, with the word under it.
 *
 * Parsed from the block `waysBack()` prints (CLI `:421-443`) rather than
 * re-derived, because the claim under test is what the operator is *told*, not
 * what SQLite would say if asked again.
 */
function listing(out: string): Array<{ name: string; sound: boolean; why: string }> {
  const lines = out.split('\n');
  const start = lines.findIndex((l) => /^Backups beside this database, newest first/.test(l));
  if (start < 0) return [];
  const rows: Array<{ name: string; sound: boolean; why: string }> = [];
  for (let i = start + 1; i < lines.length; i++) {
    const name = /^ {2}(\S.*\.backup-backfill-\S*)$/.exec(lines[i]);
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
function holds(p: string): { ok: boolean; text: string; channels: number } {
  if (!fs.existsSync(p)) return { ok: false, text: 'absent', channels: -1 };
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
    return {
      ok: verdict === 'ok',
      text: `quick_check ${verdict.split('\n').filter((l) => !/^\*{3}/.test(l))[0] ?? verdict} (channels ${channels})`,
      channels,
    };
  } catch (err) {
    return { ok: false, text: `READ FAILED: ${(err as Error).message}`, channels: -1 };
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
        `.run('r197-'+Date.now(), 'x'.repeat(3000));process.exit(0);`,
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

console.log(
  '=== Round 197 — the verdict on a way back, and the path that is not the database ===\n'
);

// ── Arm P — a copy that died before it wrote anything ────────────────────────
console.log('Arm P — the listing, with a zero-length .backup-backfill-* beside the database');
{
  const db = build('p');
  const preApply = cli([db]);
  const applied = cli([db, '--apply']);
  const goodBackup = backupOf(applied.out);
  writeOneMessage(db);
  fs.copyFileSync(goodBackup, db); // step 3 with step 2 skipped — Round 191's H
  // What a `cp` that died in its first instant leaves: the destination is
  // created and truncated before a byte of the source is read. A full disk
  // leaves the same file. Stamped later than the apply's own backup, because
  // that is the order these happen in: the good backup first, the failed rescue
  // copy second.
  const empty = laterStamp(db, 1);
  fs.writeFileSync(empty, '');
  const corrupt = holds(db);
  check(
    'P0',
    'setup: the naive copy leaves a malformed database, with two .backup-backfill-* files beside it',
    !corrupt.ok && fs.existsSync(empty) && sizeOf(empty) === 0,
    `db: ${corrupt.text} · ${path.basename(goodBackup)} ${sizeOf(goodBackup)} B · ${path.basename(empty)} ${sizeOf(empty)} B`
  );

  const dry = cli([db]); // step 4's own command
  const rows = listing(dry.out);
  const emptyRow = rows.find((r) => r.name === path.basename(empty));
  check(
    'P1',
    'the refusal still answers in a sentence and lists both files',
    dry.code === 1 && !hasStack(dry.out) && rows.length === 2,
    `exit ${dry.code} · stack ${hasStack(dry.out)} · listed ${rows.length} · first line: "${firstLine(dry.out)}"`
  );
  // Round 198 built the floor: a candidate with no tables is not a way back,
  // whatever SQLite says about it. These three were `open_()` calls reporting
  // the behaviour it changed; they are checks now.
  check(
    'P2',
    'the zero-length file is named as NOT a way back, and the verdict cites the fact `ls` would show',
    /NOT A WAY BACK/.test(emptyRow?.why ?? '') && /0 bytes/.test(emptyRow?.why ?? ''),
    `${path.basename(empty)} → "${emptyRow?.why ?? '(not listed)'}" · the file is ${sizeOf(empty)} bytes`
  );
  const firstSound = rows.find((r) => r.sound);
  check(
    'P3',
    "the tool's own rule — take the newest one that reads as sound — no longer points at that file",
    firstSound !== undefined && firstSound.name !== path.basename(empty),
    `printed order: ${rows.map((r) => `${r.name.replace(/^klatch\.db\./, '')}=${r.sound ? 'sound' : 'unreadable'}`).join(', ')} · ` +
      `newest sound: ${firstSound ? path.basename(firstSound.name) : '(none)'} · ` +
      `is the empty one: ${firstSound?.name === path.basename(empty)}`
  );

  // Follow the rule literally — it now lands on a file with tables in it.
  restoreByHand(db, firstSound ? path.join(path.dirname(db), firstSound.name) : goodBackup);
  const afterRule = holds(db);
  check(
    'P4',
    "following the tool's own rule now restores the corpus rather than emptying the database",
    afterRule.ok && afterRule.channels === holds(goodBackup).channels,
    `after the four steps: ${afterRule.text} · db size ${sizeOf(db)} B · the corpus was ${corrupt.channels < 0 ? 'unreadable' : corrupt.channels} channels, the backup holds ${holds(goodBackup).channels}`
  );

  // Defence in depth: drive the empty restore anyway, as an operator who ignores
  // the verdict and copies the newest file by date. P5 is the second line.
  restoreByHand(db, empty);

  // The mitigation, driven rather than assumed: step 4 exists to tell the
  // operator whether the restore worked, and this is the case it has to catch.
  const after = cli([db]);
  check(
    'P5',
    "step 4's check does catch it: the line it prints does not match the line the apply quoted",
    after.code === 0 && ownLine(after.out) !== quoted(applied.out),
    `after the empty restore "${ownLine(after.out)}" · quoted "${quoted(applied.out)}" · exit ${after.code}`
  );
  check(
    'P6',
    'control: the real backup is untouched by all of this and still restores the corpus',
    (() => {
      restoreByHand(db, goodBackup);
      const h = holds(db);
      const back = cli([db]);
      return h.ok && ownLine(back.out) === quoted(applied.out);
    })(),
    `${path.basename(goodBackup)} → ${holds(db).text} · pre-apply line was "${ownLine(preApply.out)}"`
  );
  meas(
    'P',
    `a 0-byte file is a valid empty SQLite database: quick_check returns "ok" on it, ` +
      `integrity_check returns "ok" on it, and the CLI's own quickCheck() (:386-409) reports the ` +
      `same. Every other shape a failed copy leaves is caught — see arm Q.`
  );
}

// ── Arm Q — the other shapes a failed copy leaves ────────────────────────────
console.log('\nArm Q — the listing at every other shape a half-finished copy leaves');
{
  const db = build('q');
  const applied = cli([db, '--apply']);
  const goodBackup = backupOf(applied.out);
  const good = fs.readFileSync(goodBackup);
  writeOneMessage(db);
  fs.copyFileSync(goodBackup, db);

  const made: Array<{ label: string; file: string }> = [];
  const add = (label: string, minutes: number, make: (p: string) => void) => {
    const p = laterStamp(db, minutes);
    make(p);
    made.push({ label, file: path.basename(p) });
    return p;
  };
  add('truncated at a page boundary', 1, (p) =>
    fs.writeFileSync(p, good.subarray(0, Math.floor(good.length / 2 / 4096) * 4096))
  );
  add('a text file', 2, (p) => fs.writeFileSync(p, 'not a database, just what was in the buffer\n'));
  add('a directory', 3, (p) => fs.mkdirSync(p));
  const noperm = add('no read permission', 4, (p) => {
    fs.writeFileSync(p, good);
    fs.chmodSync(p, 0o000);
  });
  add('zero length', 5, (p) => fs.writeFileSync(p, ''));

  const dry = cli([db]);
  const rows = listing(dry.out);
  const byName = new Map(rows.map((r) => [r.name, r]));
  check(
    'Q1',
    'the refusal survives all of them: a sentence, no stack, exit 1, and every file named',
    dry.code === 1 &&
      !hasStack(dry.out) &&
      made.every((m) => byName.has(m.file)) &&
      byName.has(path.basename(goodBackup)),
    `exit ${dry.code} · stack ${hasStack(dry.out)} · listed ${rows.length} of ${made.length + 1} · first line: "${firstLine(dry.out)}"`
  );
  const wrong = made.filter((m) => byName.get(m.file)?.sound);
  check(
    'Q2',
    'a truncated database, a text file and a directory are each refused as a way back',
    ['truncated at a page boundary', 'a text file', 'a directory'].every(
      (l) => byName.get(made.find((m) => m.label === l)!.file)?.sound === false
    ),
    made
      .filter((m) => m.label !== 'zero length')
      .map((m) => `${m.label} → ${byName.get(m.file)?.sound ? 'SOUND' : 'refused'}`)
      .join(' · ')
  );
  check(
    'Q3',
    'the one the apply actually took is still marked sound, so the listing is not simply pessimistic',
    byName.get(path.basename(goodBackup))?.sound === true,
    `${path.basename(goodBackup)} → "${byName.get(path.basename(goodBackup))?.why}"`
  );
  check(
    'Q4',
    'no shape gets through any more: nothing the listing calls sound is anything but a way back',
    wrong.length === 0,
    `files the listing calls sound that are not a way back: ${wrong.length} (${wrong.map((w) => w.label).join(', ') || 'none'})`
  );
  meas(
    'Q',
    `verdict wording per shape: ` +
      made.map((m) => `${m.label} → "${byName.get(m.file)?.why ?? '(not listed)'}"`).join(' | ')
  );
  // Round 198 took this shape too: the remedy for a permissions problem is chmod,
  // not a restore, and the verdict now says so. Was a measurement, is a check.
  check(
    'Q5',
    'an unreadable-by-permissions file is told apart from a damaged one, and pointed at its own remedy',
    /permission/i.test(byName.get(path.basename(noperm))?.why ?? ''),
    `a file with no read permission reports "${byName.get(path.basename(noperm))?.why ?? '(not listed)'}"`
  );
  fs.chmodSync(noperm, 0o600); // leave the fixture removable
}

// ── Arm R — the path given is not the database ───────────────────────────────
console.log('\nArm R — the path is one tab away: klatch.db-wal, and a file that is not a database');
{
  const db = build('r');
  writeOneMessage(db); // leave a real -wal beside a real database
  const wal = `${db}-wal`;
  const walBefore = sizeOf(wal);
  const dbBefore = holds(db);
  check(
    'R0',
    'setup: a real database with a real -wal sitting beside it',
    dbBefore.ok && typeof walBefore === 'number' && walBefore > 0,
    `db ${dbBefore.text} · ${path.basename(wal)} ${walBefore} B`
  );

  const dryWal = cli([wal]);
  const thrown = /^\s*(\w*Error: .*)$/m.exec(dryWal.out)?.[1] ?? '(no error line)';
  // Round 198 put a branch above the corrupt one. Two things had to be true and
  // only one of them was what I asked for: the voice, and the *advice*. Routing
  // a -wal to the damage paragraph would have been a sentence in the right voice
  // giving the wrong remedy, so this checks the remedy too.
  //
  // The voice whitelist below is the same class of miss as Round 196's: it
  // enumerated openings that all predate the fix. Round 198's two new ones —
  // "this is not the database, it is one of its sidecars:" and "this file is not
  // a Klatch database:" — are named here rather than left to be rediscovered.
  const ownVoice =
    /^(no such database|Candidates:|Dry run|cannot |this is not the database, it is one of its sidecars:|this file is not a Klatch database:)/m.test(
      dryWal.out
    );
  check(
    'R1',
    "the dry run aimed at klatch.db-wal answers in this script's voice, and points at the database rather than a restore",
    dryWal.code === 1 &&
      !hasStack(dryWal.out) &&
      ownVoice &&
      /sidecar/i.test(firstLine(dryWal.out)) &&
      !/backup/i.test(firstLine(dryWal.out)),
    `exit ${dryWal.code} · stack ${hasStack(dryWal.out)} · "${thrown}" · own voice: ${ownVoice} · ` +
      `first line: "${firstLine(dryWal.out)}"`
  );
  const applyWal = cli([wal, '--apply']);
  const walAfter = sizeOf(wal);
  const dbAfter = holds(db);
  check(
    'R2',
    '--apply aimed at klatch.db-wal writes nothing into it and leaves the real database readable',
    walAfter === walBefore && dbAfter.ok && dbAfter.channels === dbBefore.channels,
    `exit ${applyWal.code} · ${path.basename(wal)} ${walBefore} → ${walAfter} B · db after: ${dbAfter.text} · ` +
      `no data harm; the failure is the voice · first line: "${firstLine(applyWal.out)}"`
  );

  // The other half of the same slip: a path that exists and is empty. `cp`
  // creates one; so does a shell redirect; so does `touch`.
  const typo = path.join(path.dirname(db), 'klatch.db.bak');
  fs.writeFileSync(typo, '');
  const tablesIn = (p: string): number => {
    try {
      const d = new Database(p, { readonly: true, fileMustExist: true });
      const n = (
        d.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get() as { n: number }
      ).n;
      d.close();
      return n;
    } catch {
      return -1;
    }
  };
  const dryTypo = cli([typo]);
  const afterDry = { size: sizeOf(typo), tables: tablesIn(typo) };
  const applyTypo = cli([typo, '--apply']);
  const afterApply = { size: sizeOf(typo), tables: tablesIn(typo) };
  // Round 198 split these two apart, which is the right shape: an empty database
  // is a legal thing to point a *reading* run at, and never a legal thing to
  // write into. So the dry run still runs — but says the zero is the file and
  // not the corpus — and the writing run refuses.
  check(
    'R3',
    'aimed at an empty file, the dry run says the zero is the file rather than the corpus, and the writing run refuses',
    dryTypo.code === 0 && /0 bytes|empty/i.test(dryTypo.out) && applyTypo.code === 1,
    `dry run exit ${dryTypo.code} ("${ownLine(dryTypo.out)}", empty-file note: ${/0 bytes|empty/i.test(dryTypo.out)}) · ` +
      `--apply exit ${applyTypo.code} · first line: "${firstLine(applyTypo.out)}"`
  );
  // This arm's assertion is inverted from the round that found it, and the
  // inversion *is* the fix — Round 197 asserted the apply builds a Klatch schema
  // in an empty file, because it did. It refuses now, so the file stays as the
  // operator left it. A probe whose failure is the product improving has to be
  // re-aimed, not silenced; same situation as my M5 last round.
  check(
    'R4',
    'neither run builds a Klatch schema in the file: the dry run never wrote, and the apply now refuses to',
    afterDry.size === 0 && afterDry.tables === 0 && afterApply.size === 0 && afterApply.tables === 0,
    `after the dry run: ${path.basename(typo)} ${afterDry.size} B, ${afterDry.tables} tables · ` +
      `after --apply: ${afterApply.size} B, ${afterApply.tables} tables — the refusal leaves it untouched`
  );
  meas(
    'R',
    `the guard at CLI :246 is fs.existsSync — it separates "no such database" from everything else, ` +
      `and anything on disk satisfies it. What decides the rest is whether SQLite will open the ` +
      `file, and it opens an empty one.`
  );
}

// ── Arm S — what the listing costs, per file, at size ────────────────────────
console.log("\nArm S — Round 196's F4, measured at size: quick_check is O(db), once per file listed");
{
  const dir = path.join(DATA, 's');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const base = build('s-src');
  const grow = (target: number, name: string): string => {
    const p = path.join(dir, name);
    fs.copyFileSync(base, p);
    const d = new Database(p, { fileMustExist: true });
    d.pragma('journal_mode=DELETE');
    const ch = (d.prepare('SELECT id FROM channels LIMIT 1').get() as { id: string }).id;
    const ins = d.prepare(
      "INSERT INTO messages (id, channel_id, role, content, status, created_at) VALUES (?, ?, 'user', ?, 'complete', datetime('now'))"
    );
    const body = 'x'.repeat(2000);
    const batch = d.transaction((n: number) => {
      for (let i = 0; i < n; i++) ins.run(`r197-${name}-${i}-${Math.random()}`, ch, body);
    });
    // Small batches: the first cut inserted 2,000 rows (~4MB) at a time, so the
    // 1MB and 8MB rungs both landed at 8MB and the ladder's bottom two points
    // were the same file measured twice. Two equal sizes timed 3ms and 2ms, and
    // a monotonicity check over them was checking scheduler noise.
    while (fs.statSync(p).size < target) batch(250);
    d.close();
    return p;
  };
  const timeQuickCheck = (p: string): number => {
    const t0 = Date.now();
    const d = new Database(p, { readonly: true, fileMustExist: true });
    d.pragma('quick_check(1)');
    d.close();
    return Date.now() - t0;
  };
  const points: Array<{ mb: number; ms: number }> = [];
  for (const mb of [8, 24, 64]) {
    const p = grow(mb * 1024 * 1024, `size-${mb}mb.db`);
    const ms = Math.min(timeQuickCheck(p), timeQuickCheck(p)); // warm, best of two
    points.push({ mb: +(fs.statSync(p).size / 1024 / 1024).toFixed(1), ms });
  }
  meas(
    'S1',
    `quick_check, best of two warm runs: ` +
      points.map((p) => `${p.mb}MB → ${p.ms}ms`).join(' · ') +
      ` — roughly ${(points[points.length - 1].ms / points[points.length - 1].mb).toFixed(1)}ms per MB on this machine, warm cache`
  );
  const perMb = points[points.length - 1].ms / points[points.length - 1].mb;
  check(
    'S2',
    'the cost is linear enough in file size to extrapolate a refusal on a large corpus',
    points.every((p, i) => i === 0 || p.ms >= points[i - 1].ms),
    `${points.map((p) => `${p.mb}MB=${p.ms}ms`).join(' ')} · a refusal listing N backups pays this N+1 times ` +
      `(N listed, plus the database itself)`
  );
  meas(
    'S3',
    `extrapolated from ${perMb.toFixed(1)}ms/MB: one 500MB database with 3 backups beside it is ` +
      `~${Math.round((perMb * 500 * 4) / 1000)}s of quick_check before the refusal prints. ` +
      `Cold cache is not measured, and is the case that matters (a refusal arrives when something ` +
      `has just gone wrong, not in a loop).`
  );
}

// ── Arm Z — what this run did, and what its verdicts rest on ─────────────────
/**
 * ## Round 266 — one assertion was two questions, and the allowlist that fixed the false red
 * dropped a real dependency
 *
 * The arm that stood here read the whole of `packages` + `scripts`, filtered out every
 * `scripts/probe-round\d+-` path, and asserted the remainder was empty. Three things are wrong with
 * that, and they are separable:
 *
 *  1. **It is two questions in one assertion.** *"Did this run move the tree?"* is about the RUN and
 *     is this seat's responsibility. *"Was the tree valid to measure against?"* is a PRECONDITION on
 *     the verdicts and is not this seat's doing at all. An emptiness claim answers neither cleanly:
 *     it reddens for a third party's in-flight work, and it is blind to a write this run makes into
 *     a file that was already modified (`scripts/lib/tree-fingerprint.mts` header, false-green half).
 *
 *  2. **The window admitted 347 files, and this round's verdicts depend on none of them.** Measured
 *     before the rewrite, from `git ls-files packages scripts`: 422 tracked, 75 allowlisted away as
 *     `probe-round*`, **347 admitted** — 270 under `packages/` and 77 more under `scripts/`. The CLI
 *     imports `node:fs`, `node:os`, `node:path` and `better-sqlite3` and nothing from `packages/`;
 *     so does R176. Not one of the 347 can change a verdict here.
 *
 *  3. **And the allowlist excluded a file that CAN.** `R176` is not an instrument sitting beside the
 *     subject — it is `execFileSync`'d to build every fixture the P/Q/R verdicts are taken over. It
 *     matches `probe-round\d+-`, so the patch that fixed the false red filtered the one real
 *     dependency in the tree out of the validity window. That is the false-green half of the class
 *     with a name and a line number, in my own file, found by the census that counted it.
 *
 * **Rule: narrow the window to the subject before you weaken the assertion.** An emptiness claim
 * over a shared window is not repaired by deleting it and it is not repaired by allowlisting the
 * noise — it is repaired by naming what the measurement actually depends on. Here that is two
 * files, and the right instruments are a bracket for question 1 and a named-file diff for question 2.
 */
console.log('\nArm Z — what this run did, and what its verdicts rest on');
{
  const zAfter = fingerprint(ROOT, 'packages/');
  const zAfterScripts = fingerprint(ROOT, 'scripts/');
  check(
    'Z',
    'this run left packages/ and scripts/ as it found them — a bracket, not an emptiness claim',
    zAfter === zBefore && zAfterScripts === zBeforeScripts,
    zAfter === zBefore && zAfterScripts === zBeforeScripts
      ? `both fingerprints identical across the run. Every write is under .testdata/r197 (gitignored), ` +
        `and a third party's in-flight work under either pathspec is invisible to this arm by design.`
      : `MOVED.\n    packages/ before: ${zBefore}\n    packages/ after:  ${zAfter}\n` +
        `    scripts/ before: ${zBeforeScripts}\n    scripts/ after:  ${zAfterScripts}`
  );

  // Question 2, scoped to the two files named in SUBJECTS — and spelled as a CONTENT COMPARISON,
  // not as an emptiness claim over a window.
  //
  // The first draft of this arm asked `git status --porcelain -- <subjects>` and asserted the
  // result was `''`. Round 256's census flagged it the same fire, and correctly: a narrower window
  // is still a window, and `dirtySubjects === ''` is the same shape the whole class is about. Worse,
  // it was a REGRESSION — the old `offenders` spelling was invisible to that census (a
  // `.split().filter().join()` chain it cannot recognise), so "repairing" it in that form moved a
  // hidden instance into a plain detectable one instead of removing it.
  //
  // What this precondition actually means is "the bytes I am about to measure are the bytes on
  // main", which is a comparison between two contents and needs no window at all. Comparing blobs
  // is also strictly more precise than porcelain: it is a statement about each named file rather
  // than about whatever the pathspec happened to match.
  const drifted = SUBJECTS.filter((rel) => {
    const head = spawnSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    if (head.status !== 0) return true;
    return !head.stdout.equals(fs.readFileSync(path.join(ROOT, rel)));
  });
  check(
    'Z2',
    'the two files these verdicts rest on are byte-identical to HEAD',
    drifted.length === 0,
    drifted.length === 0
      ? `${SUBJECTS.join(' and ')} both match HEAD blob-for-blob, so the P/Q/R verdicts are ` +
        `readings of the CLI that is on main, over fixtures built by the R176 that is on main. ` +
        `R176 is named here because it BUILDS the fixtures; the old arm's probe-round* allowlist ` +
        `excluded it. A comparison, not an emptiness claim — and per-file, not per-pathspec.`
      : `${drifted.length} subject(s) differ from HEAD, so the verdicts below are about edited ` +
        `code: ${drifted.join(', ')}`
  );

  // The rest of the window: reported, never graded. This is the half that is not this run's doing.
  const rest = windowState(ROOT, 'packages/')
    .split('\n')
    .concat(windowState(ROOT, 'scripts/').split('\n'))
    .filter((l) => l.trim() && !SUBJECTS.some((s) => l.includes(s)));
  meas(
    'Z3',
    rest.length === 0
      ? `packages/ and scripts/ carried no other modification at close. Recorded so a later reader ` +
        `knows arm Z's comparison was taken over a quiet tree this time — which is luck, not an ` +
        `invariant, and is exactly what the old arm mistook for one.`
      : `${rest.length} other path(s) under packages/ or scripts/ differ from HEAD. Not this run's ` +
        `doing, not graded, and not capable of changing a verdict above (SUBJECTS is the dependency ` +
        `set): ${rest.slice(0, 6).join('; ')}${rest.length > 6 ? ` …+${rest.length - 6}` : ''}`
  );
}

const passed = checks.filter((c) => c.ok === true).length;
const failed = checks.filter((c) => c.ok === false);
const open = checks.filter((c) => c.ok === 'open');
console.log('\n' + '='.repeat(78));
console.log(
  `${checks.length} checks · ${failed.length} failed · ${open.length} open · ${measurements.length} measurements`
);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  ${f.arm} · ${f.name}\n    ${f.detail}`);
}
if (open.length) {
  console.log('\nOPEN:');
  for (const o of open) console.log(`  ${o.arm} · ${o.name}`);
}
console.log('='.repeat(78));
void passed;
process.exit(failed.length ? 1 : 0);
