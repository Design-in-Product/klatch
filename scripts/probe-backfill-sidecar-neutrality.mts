/**
 * Does a backfill run that writes nothing to the target leave anything beside it?
 *
 * ## Why this exists
 *
 * `scripts/backfill-entity-bindings.mts` takes its pre-write snapshot from a
 * **read-only** handle, and the header's claim is that *"a dry run cannot touch
 * the database it is reporting on."* The rows claim held under every state
 * `unit-465migrate` and Theseus's 2026-11-06 round could build for it. The
 * *files* claim did not: opening a WAL-mode database read-only makes SQLite
 * create `-shm`, and a `-wal` if one is absent, because that is how a reader
 * reaches the WAL at all. So a dry run left two files beside an artefact it was
 * promising not to touch (`unit-465migrate` §7.1, reproduced by Theseus), and
 * `unit-465rowdelta` found the `--no-migrate` **refusal** path doing the same —
 * worse, because that path's own last word to the operator is *"Nothing was
 * written."*
 *
 * The cure removes only what that read-only open created, under two guards (the
 * sidecar was absent before the open, and the `-wal` is zero-length). This probe
 * is the guard on the cure, and it is written as a **two-sided** check on
 * purpose: a run that genuinely opens the target for writing must still leave its
 * sidecars, or the "cure" would be a `rm` of live frames dressed as tidiness.
 *
 * Hermetic: temp databases under `os.tmpdir()`, built by the product's own
 * `applySchema`. No ports, no corpus, no model call, no `$HOME` read.
 */
import { execFileSync } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { applySchema } from '../packages/server/src/db/index.js';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');
const results: ProbeVerdict[] = [];
const made: string[] = [];

/**
 * A WAL-mode, current-schema database with **no sidecars on disk** — the state
 * the app leaves after a checkpoint, and the only starting state in which the
 * question has an answer. `seeded` adds the rows that make the migration want to
 * write (an unbound channel, a `type='file'` artifact not yet in `files`).
 */
function build(kind: 'clean' | 'seeded'): string {
  const p = path.join(os.tmpdir(), `klatch-sidecar-${randomUUID()}.db`);
  made.push(p);
  const db = new Database(p);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  if (kind === 'seeded') {
    db.prepare(
      `INSERT INTO channels (id, name, system_prompt, source) VALUES ('ch', 'unbound', '', 'claude-code')`
    ).run();
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m', 'ch', 'user', 'hi', 'complete')`
    ).run();
    db.prepare(
      `INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
       VALUES ('a', 'm', 'file', 'a.txt', 'text/plain', 3, 'storage/a.txt')`
    ).run();
  } else {
    db.prepare(
      `INSERT INTO channels (id, name, system_prompt, source) VALUES ('ch', 'bound', '', 'claude-code')`
    ).run();
    db.prepare(
      `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch', 'default-entity')`
    ).run();
  }
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  return p;
}

function run(dbPath: string, flags: string[]): { code: number; out: string } {
  try {
    const out = execFileSync('npx', ['tsx', TOOL, dbPath, ...flags], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}\n${e.stderr ?? ''}` };
  }
}

const sidecars = (p: string) =>
  (['-wal', '-shm'] as const).filter((s) => fs.existsSync(p + s)).join(' ');

const check = (arm: string, label: string, pass: boolean, got: string) => {
  results.push({ arm, check: `${label} — ${got}`, pass });
  console.log(`  [${arm}] ${pass ? 'ok  ' : 'FAIL'} ${label} — ${got}`);
};

console.log('probe-backfill-sidecar-neutrality');

// ── A: the refusal path. --no-migrate over a database the migration would write
//    to: the run exits 1 having written nothing, and must leave nothing behind.
{
  const p = build('seeded');
  const r = run(p, ['--apply', '--no-migrate']);
  check('A', 'refusal exits 1', r.code === 1, `exit ${r.code}`);
  check('A', 'refusal names the rows', /Refusing to run: --no-migrate, and this run would write the rows/.test(r.out), 'reason line');
  check('A', 'no sidecar beside the refused target', sidecars(p) === '', sidecars(p) || '(nothing)');
}

// ── B: the dry run. No flags at all, the review sheet, the claim in the header.
{
  const p = build('seeded');
  const r = run(p, []);
  check('B', 'dry run exits 0', r.code === 0, `exit ${r.code}`);
  check('B', 'no sidecar beside the dry-run target', sidecars(p) === '', sidecars(p) || '(nothing)');
}

// ── C: the other side. A run that is NOT refused opens the target for writing
//    through `getDb()` *after* the cleanup, so its sidecars are live and must
//    survive. Without this arm, `rm -f` on both paths would score three green.
{
  const p = build('clean');
  const r = run(p, ['--apply', '--no-migrate']);
  check('C', 'a clean database is not refused', r.code === 0, `exit ${r.code}`);
  check(
    'C',
    'a writing run keeps its own sidecars',
    sidecars(p) === '-wal -shm',
    sidecars(p) || '(nothing)'
  );
}

// ── D: a sidecar that was already there is never removed, whatever the path.
//    The guard that keeps this a tidy-up rather than a data loss: a `-wal` on
//    disk before the run can hold committed frames.
{
  const p = build('seeded');
  fs.writeFileSync(p + '-wal', '');
  fs.writeFileSync(p + '-shm', '');
  const r = run(p, ['--apply', '--no-migrate']);
  check('D', 'still refuses', r.code === 1, `exit ${r.code}`);
  check(
    'D',
    'a pre-existing sidecar is left alone',
    sidecars(p) === '-wal -shm',
    sidecars(p) || '(nothing)'
  );
}

for (const p of made) {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
  for (const f of fs.readdirSync(os.tmpdir())) {
    if (f.startsWith(path.basename(p))) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
  }
}

summariseAndExit({ probeName: 'backfill-sidecar-neutrality', results });
