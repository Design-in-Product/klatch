/**
 * unit-465walcell — drive the seven arms of the sidecar-cleanup outer guard.
 *
 * Every arm is the real `scripts/backfill-entity-bindings.mts` over a hermetic
 * temp database built by the product's own `applySchema`. Nothing here reads
 * `$HOME`, the repo database, or the network.
 *
 * The question is the OUTER guard at `:659`. The arms differ only in which
 * sidecars are on disk before the run, which is the free variable the existing
 * probe never varies past "both" and "neither".
 */
import { execFileSync } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { applySchema } from '../../../packages/server/src/db/index.js';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');
const made: string[] = [];

/** A WAL-mode current-schema database with NO sidecars on disk. */
function build(kind: 'clean' | 'seeded'): string {
  const p = path.join(os.tmpdir(), `klatch-walcell-${randomUUID()}.db`);
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

/**
 * A genuine, VALID, non-zero `-wal` beside the database — not a dummy file.
 * Built by turning autocheckpoint off, committing frames, stashing the real
 * `-wal` bytes aside, closing (which checkpoints and removes it), then putting
 * the stashed log back. The salt and header match the database, so a read-only
 * open recovers it rather than rejecting it, which is what makes this arm a
 * measurement of the size guard instead of a measurement of error handling.
 */
function withNonZeroWal(p: string): number {
  const db = new Database(p);
  db.pragma('journal_mode = WAL');
  db.pragma('wal_autocheckpoint = 0');
  for (let i = 0; i < 40; i++) {
    db.prepare(`INSERT INTO channels (id, name, system_prompt, source) VALUES (?, ?, '', 'claude-code')`).run(
      `pad-${i}`,
      `pad ${i}`
    );
  }
  const stash = fs.readFileSync(p + '-wal');
  db.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  fs.writeFileSync(p + '-wal', stash);
  return stash.length;
}

/** `-shm:32768B -wal:0B` style — presence AND size, because the guard reads size. */
const sidecars = (p: string) => {
  const parts = (['-shm', '-wal'] as const)
    .filter((s) => fs.existsSync(p + s))
    .map((s) => `${s}:${fs.statSync(p + s).size}B`);
  return parts.length ? parts.join(' ') : '(nothing)';
};

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

type Arm = {
  name: string;
  kind: 'clean' | 'seeded';
  flags: string[];
  before: (p: string) => void;
  note: string;
};

const ARMS: Arm[] = [
  { name: 'E1', kind: 'seeded', flags: ['--apply', '--no-migrate'], before: () => {}, note: 'baseline — no sidecar before' },
  {
    name: 'E2',
    kind: 'seeded',
    flags: ['--apply', '--no-migrate'],
    before: (p) => fs.writeFileSync(p + '-shm', Buffer.alloc(32768)),
    note: 'THE ROUTED CELL — -shm present, -wal absent',
  },
  {
    name: 'E3',
    kind: 'seeded',
    flags: ['--apply', '--no-migrate'],
    before: (p) => {
      const n = withNonZeroWal(p);
      fs.writeFileSync(p + '-shm', Buffer.alloc(32768));
      if (n === 0) throw new Error('E3 precondition failed: -wal is zero length');
    },
    note: 'non-zero -wal + -shm — must not be touched',
  },
  {
    name: 'E4',
    kind: 'seeded',
    flags: ['--apply', '--no-migrate'],
    before: (p) => fs.writeFileSync(p + '-wal', ''),
    note: 'zero-length -wal only — my sketch is predicted NOT to cure this',
  },
  {
    name: 'E5',
    kind: 'seeded',
    flags: ['--apply', '--no-migrate'],
    before: (p) => {
      if (withNonZeroWal(p) === 0) throw new Error('E5 precondition failed: -wal is zero length');
    },
    note: 'non-zero -wal only, no -shm',
  },
  { name: 'C', kind: 'clean', flags: ['--apply', '--no-migrate'], before: () => {}, note: 'ARM C — a writing run keeps its own sidecars' },
  {
    name: 'D',
    kind: 'seeded',
    flags: ['--apply', '--no-migrate'],
    before: (p) => {
      fs.writeFileSync(p + '-wal', '');
      fs.writeFileSync(p + '-shm', '');
    },
    note: 'ARM D re-driven — pre-existing sidecars left alone',
  },
];

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
console.log(`unit-465walcell drive — cripples: Y1=${process.env.U465WALCELL_Y1 ?? 'off'} Y2=${process.env.U465WALCELL_Y2 ?? 'off'}`);
console.log(`subject HEAD state is recorded by the caller, not here\n`);

for (const arm of ARMS) {
  if (only.length && !only.includes(arm.name)) continue;
  const p = build(arm.kind);
  arm.before(p);
  const before = sidecars(p);
  const r = run(p, arm.flags);
  const after = sidecars(p);
  const claimsNothing = /Nothing was written/.test(r.out);
  const refusesRows = /Refusing to run: --no-migrate, and this run would write the rows/.test(r.out);
  console.log(`[${arm.name}] ${arm.note}`);
  console.log(`[${arm.name}]   before: ${before}`);
  console.log(`[${arm.name}]   exit:   ${r.code}`);
  console.log(`[${arm.name}]   refusal-names-rows: ${refusesRows ? 'yes' : 'no'}   says-nothing-written: ${claimsNothing ? 'yes' : 'no'}`);
  console.log(`[${arm.name}]   after:  ${after}`);
  console.log(`[${arm.name}]   MOVED:  ${before === after ? 'no' : 'YES'}\n`);
}

for (const p of made) {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
  for (const f of fs.readdirSync(os.tmpdir())) {
    if (f.startsWith(path.basename(p))) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
  }
}
console.log('drive complete');
