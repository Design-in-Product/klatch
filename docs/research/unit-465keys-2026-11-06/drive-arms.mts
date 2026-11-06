/**
 * unit-465keys — drive the registered arms.
 *
 * usage: npx tsx drive-arms.mts <arm> [<arm> …]      (or `all`)
 *
 * Each arm re-seeds its own input from `seed.mts` rather than sharing one, so no
 * arm inherits a previous arm's writes or sidecars. Every run of the subject is
 * `execFileSync` with stdout and stderr captured **separately** — the tool's
 * refusals go to stderr, and a merged recording cannot say which stream a line
 * came from.
 *
 * Nothing here asserts. It prints what it read, including the raw exit code, and
 * RESULTS.md grades it.
 */
import { execFileSync } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const UNIT = import.meta.dirname;
const SCRATCH = path.join(ROOT, '.testdata/u465keys');
const TOOL = 'scripts/backfill-entity-bindings.mts';

fs.mkdirSync(SCRATCH, { recursive: true });

function seed(target: string, kind: string): void {
  const out = execFileSync('npx', ['tsx', path.join(UNIT, 'seed.mts'), target, kind], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(`  seed: ${out.trim().split('\n').filter((l) => l.startsWith('seeded')).join(' ')}`);
}

/** Every file beside the target, so a leftover cannot be missed by asking only about the two expected. */
function beside(target: string): string {
  const dir = path.dirname(target);
  const base = path.basename(target);
  const found = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(base) && f !== base)
    .sort()
    .map((f) => `${f.slice(base.length)}:${fs.statSync(path.join(dir, f)).size}B`);
  return found.length ? found.join(' ') : '(nothing)';
}

function counts(target: string): string {
  const d = new Database(target, { readonly: true });
  const n = (t: string) => {
    try {
      return String(d.prepare(`SELECT COUNT(*) FROM "${t}"`).pluck().get());
    } catch {
      return 'ABSENT';
    }
  };
  const row = `channels=${n('channels')} channel_entities=${n('channel_entities')} message_artifacts=${n('message_artifacts')} files=${n('files')} file_refs=${n('file_refs')}`;
  d.close();
  // This read-only open creates sidecars of its own — the defect the subject's own
  // §5 is about. Removed here so a *later* `beside()` in the same arm reads the
  // subject's leftovers and not this instrument's. `beside()` is always called
  // before this, never after.
  for (const s of ['-wal', '-shm']) fs.rmSync(target + s, { force: true });
  return row;
}

/**
 * `cripple` is passed to the subject's child only, never to `seed()`: Y2 removes
 * the table the `artifact` seed has to insert into, so a seed built by the
 * crippled path is not the input the arm registered. Y1 does not need the
 * separation and gets it anyway, so the two arms' inputs are built identically.
 */
function run(
  target: string,
  extra: string[],
  cripple?: 'Y1' | 'Y2'
): { code: number; out: string; err: string } {
  const args = ['tsx', TOOL, target, '--apply', '--no-migrate', ...extra];
  const env = { ...process.env, ...(cripple ? { U465KEYS_CRIPPLE: cripple } : {}) };
  try {
    const out = execFileSync('npx', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    return { code: 0, out, err: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? -1, out: err.stdout ?? '', err: err.stderr ?? '' };
  }
}

/** A non-zero `-wal`: a child that writes and exits **without closing**, so nothing checkpoints. */
function crashWithFrames(target: string): void {
  const script = `
    const D = require('better-sqlite3');
    const db = new D(process.argv[1]);
    db.pragma('journal_mode = WAL');
    db.pragma('wal_autocheckpoint = 0');
    db.prepare("INSERT INTO channels (id, name, system_prompt) VALUES ('ch-crash', 'crash', '')").run();
    db.prepare("INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch-crash', 'default-entity')").run();
    process.exit(0);
  `;
  execFileSync('node', ['-e', script, target], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
}

function header(id: string, what: string): void {
  console.log(`\n${'='.repeat(78)}\n${id} — ${what}\n${'='.repeat(78)}`);
}

const arms: Record<string, () => void> = {
  // ── Controls and the sidecar cells ───────────────────────────────────────
  A1: () => {
    header('A1', 'CONTROL: current schema, nothing pending, --apply --no-migrate');
    const t = path.join(SCRATCH, 'a1.db');
    seed(t, 'clean');
    console.log(`  before: ${beside(t)}`);
    const r = run(t, []);
    console.log(`  exit=${r.code}`);
    console.log(`  beside after: ${beside(t)}`);
    console.log(`  counts after: ${counts(t)}`);
    console.log(`  --- stdout ---\n${r.out}\n  --- stderr ---\n${r.err}`);
  },

  A3: () => {
    header('A3', 'MATCHED BASELINE: §4 seed, NO sidecar before, refused run');
    const t = path.join(SCRATCH, 'a3.db');
    seed(t, 'seeded');
    console.log(`  before: ${beside(t)}`);
    const r = run(t, []);
    console.log(`  exit=${r.code}`);
    console.log(`  beside after: ${beside(t)}`);
    console.log(`  counts after: ${counts(t)}`);
    console.log(`  --- stderr ---\n${r.err}`);
  },

  A2: () => {
    header('A2', 'P1SHMONLY: §4 seed, `-shm` present and `-wal` absent before, refused run');
    const t = path.join(SCRATCH, 'a2.db');
    seed(t, 'seeded');
    fs.writeFileSync(t + '-shm', Buffer.alloc(32768));
    console.log(`  before: ${beside(t)}   (guard reads !before['-wal'] && !before['-shm'])`);
    const r = run(t, []);
    console.log(`  exit=${r.code}`);
    console.log(`  beside after: ${beside(t)}`);
    console.log(`  --- stderr ---\n${r.err}`);
  },

  A2b: () => {
    header('A2b', 'P2WALCREATE: does a read-only open create a `-wal` when a `-shm` is already there?');
    const t = path.join(SCRATCH, 'a2b.db');
    seed(t, 'seeded');
    fs.writeFileSync(t + '-shm', Buffer.alloc(32768));
    console.log(`  before: ${beside(t)}`);
    const d = new Database(t, { readonly: true, fileMustExist: true });
    d.prepare('SELECT count(*) FROM channels').pluck().get();
    d.close();
    console.log(`  after a bare read-only open+close: ${beside(t)}`);
  },

  A4: () => {
    header('A4', 'the cure\'s other side: a NON-ZERO `-wal` before must be left alone');
    const t = path.join(SCRATCH, 'a4.db');
    seed(t, 'seeded');
    crashWithFrames(t);
    console.log(`  before: ${beside(t)}`);
    const r = run(t, []);
    console.log(`  exit=${r.code}`);
    console.log(`  beside after: ${beside(t)}`);
    console.log(`  --- stdout head ---\n${r.out.split('\n').slice(0, 8).join('\n')}`);
  },

  // ── The additive-key arms ───────────────────────────────────────────────
  A5: () => {
    header('A5', 'P3DROPBLIND: cripple Y1 in place — drop + recreate a populated table');
    const t = path.join(SCRATCH, 'a5.db');
    seed(t, 'artifact');
    console.log(`  counts before: ${counts(t)}`);
    console.log(`  --- schemaDelta() on this file, field by field (Y1 in the child) ---`);
    console.log(delta(t, 'Y1'));
    const r = run(t, [], 'Y1');
    console.log(`  exit=${r.code}`);
    console.log(`  counts after: ${counts(t)}`);
    console.log(`  --- stdout ---\n${r.out}\n  --- stderr ---\n${r.err}`);
  },

  A6: () => {
    header('A6', 'P4DROPONLY: cripple Y2 in place — pure drop, no recreate');
    const t = path.join(SCRATCH, 'a6.db');
    seed(t, 'artifact');
    console.log(`  counts before: ${counts(t)}`);
    console.log(`  --- schemaDelta() on this file, field by field (Y2 in the child) ---`);
    console.log(delta(t, 'Y2'));
    const r = run(t, [], 'Y2');
    console.log(`  exit=${r.code}`);
    console.log(`  counts after: ${counts(t)}`);
    console.log(`  --- stdout ---\n${r.out}\n  --- stderr ---\n${r.err}`);
  },

  A7: () => {
    header('A7', "P5INITSITES: current schema, `default` channel row deleted — an initSchema site");
    const t = path.join(SCRATCH, 'a7.db');
    seed(t, 'nodefault');
    console.log(`  counts before: ${counts(t)}`);
    console.log(`  --- schemaDelta() on this file, field by field ---`);
    console.log(delta(t));
    const r = run(t, []);
    console.log(`  exit=${r.code}`);
    console.log(`  counts after: ${counts(t)}`);
    console.log(`  --- stdout ---\n${r.out}\n  --- stderr ---\n${r.err}`);
  },

  // ── The two arms I registered as expecting to come back clean ───────────
  A8: () => {
    header('A8', 'P6TRUNCATE: is a bare `DELETE FROM t` counted by total_changes()?');
    const t = path.join(SCRATCH, 'a8.db');
    for (const s of ['', '-wal', '-shm']) fs.rmSync(t + s, { force: true });
    const d = new Database(t);
    d.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
    const ins = d.prepare('INSERT INTO t (v) VALUES (?)');
    for (let i = 0; i < 17; i++) ins.run(`r${i}`);
    const tc = () => d.prepare('SELECT total_changes()').pluck().get() as number;
    const before = tc();
    const rows = d.prepare('SELECT COUNT(*) FROM t').pluck().get() as number;
    d.exec('DELETE FROM t');
    const after = tc();
    console.log(`  rows before delete: ${rows}`);
    console.log(`  total_changes() before=${before} after=${after} delta=${after - before}`);
    console.log(`  rows after delete: ${d.prepare('SELECT COUNT(*) FROM t').pluck().get()}`);
    console.log(`  sqlite version: ${d.prepare('select sqlite_version()').pluck().get()}`);
    d.close();
  },

  A9: () => {
    header('A9', "P7BACKUPWAL: does `source.backup()` see uncheckpointed frames, and leave a `-wal`?");
    const t = path.join(SCRATCH, 'a9.db');
    const snap = path.join(SCRATCH, 'a9.snapshot.db');
    seed(t, 'clean');
    crashWithFrames(t);
    console.log(`  target before: ${beside(t)}`);
    const liveRows = (() => {
      const d = new Database(t, { readonly: true });
      const n = d.prepare('SELECT COUNT(*) FROM channels').pluck().get() as number;
      d.close();
      return n;
    })();
    const fileOnly = (() => {
      const copy = path.join(SCRATCH, 'a9.filecopy.db');
      for (const s of ['', '-wal', '-shm']) fs.rmSync(copy + s, { force: true });
      fs.copyFileSync(t, copy);
      const d = new Database(copy, { readonly: true });
      const n = d.prepare('SELECT COUNT(*) FROM channels').pluck().get() as number;
      d.close();
      return n;
    })();
    for (const s of ['', '-wal', '-shm']) fs.rmSync(snap + s, { force: true });
    // Same call the subject makes at backfill-entity-bindings.mts:627.
    backupTo(t, snap);
    const snapRows = (() => {
      const d = new Database(snap, { readonly: true });
      const n = d.prepare('SELECT COUNT(*) FROM channels').pluck().get() as number;
      d.close();
      for (const s of ['-wal', '-shm']) fs.rmSync(snap + s, { force: true });
      return n;
    })();
    console.log(`  channels through a live handle (WAL included): ${liveRows}`);
    console.log(`  channels in a bare fs.copyFileSync of the .db:  ${fileOnly}`);
    console.log(`  channels in source.backup()'s destination:      ${snapRows}`);
    console.log(`  beside the snapshot right after backup(): ${beside(snap)}`);
  },
};

/**
 * `backup()` is async in better-sqlite3 and the subject `await`s it at
 * `backfill-entity-bindings.mts:627`. Run through a child so this driver stays
 * synchronous, using the same API and the same better-sqlite3 build rather than
 * a `copyFileSync` stand-in — a stand-in is exactly the thing under test here.
 */
function backupTo(src: string, dest: string): void {
  const script = `
    const D = require('better-sqlite3');
    const s = new D(process.argv[1], { readonly: true, fileMustExist: true });
    s.backup(process.argv[2]).then(() => { s.close(); process.exit(0); })
      .catch((e) => { console.error(String(e)); process.exit(3); });
  `;
  execFileSync('node', ['-e', script, src, dest], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** `schemaDelta()`'s answer, field by field, read from the TypeScript source via tsx. */
function delta(target: string, cripple?: 'Y1' | 'Y2'): string {
  return execFileSync('npx', ['tsx', path.join(UNIT, 'delta-print.mts'), target], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...(cripple ? { U465KEYS_CRIPPLE: cripple } : {}) },
  });
}

const want = process.argv.slice(2);
const order = want.length === 0 || want[0] === 'all' ? Object.keys(arms) : want;
for (const id of order) {
  const fn = arms[id];
  if (!fn) {
    console.log(`\n!! no such arm: ${id}`);
    continue;
  }
  fn();
}
