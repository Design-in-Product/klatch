/**
 * unit-465drop — build each arm's input database with the *real* schema code.
 *
 * usage: npx tsx seed.mts <out.db> <kind>
 *
 * Shape borrowed from Theseus's `unit-465keys/seed.mts` so the two units' inputs
 * are comparable where they overlap. Every built kind goes through `applySchema`
 * on an empty file, so the schema is current by construction and an arm about the
 * *keys* carries no schema delta of its own.
 *
 *   artifact   one channel already bound to default-entity, one message, one
 *              **type='thinking'** artifact. Deliberately not type='file': site 2
 *              fires on file artifacts not yet in `files`, and an arm whose point
 *              is "rowWrites stays 0" cannot carry a row write of its own.
 *   clean      the same without the message or artifact. Nothing for the migration
 *              to write.
 *   march      a byte copy of `backups/klatch.db.backup-2026-03-14` as it is in the
 *              working tree **today**. Never the real file: copied, and the copy is
 *              the target. Measured, not assumed, to be behind the schema — and it
 *              is not: 9,449,472 bytes and `empty: true`, because that file was
 *              already upgraded in place by the accident Theseus found on 11-05 and
 *              the restore is still open on xian.
 *   marchgit   the **pre-upgrade** blob, extracted from `c945e8aa` with `git
 *              cat-file`. 5,230,592 bytes. This is the genuine behind-schema
 *              control; `march` is the control for what is on disk now. Read out of
 *              git rather than out of `backups/`, so this unit does not touch a
 *              file whose restore is somebody else's open decision.
 */
import { execFileSync } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { applySchema } from '../../../packages/server/src/db/index.js';
import { DEFAULT_MODEL } from '../../../packages/shared/src/types.js';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const [out, kind] = process.argv.slice(2);
if (!out || !kind) throw new Error('usage: seed.mts <out.db> <kind>');
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(out + suffix, { force: true });

if (kind === 'march') {
  const src = path.join(ROOT, 'backups/klatch.db.backup-2026-03-14');
  if (!fs.existsSync(src)) throw new Error(`no such backup: ${src}`);
  fs.copyFileSync(src, out);
} else if (kind === 'marchgit') {
  const blob = execFileSync(
    'git',
    ['cat-file', 'blob', 'c945e8aa:backups/klatch.db.backup-2026-03-14'],
    { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, encoding: 'buffer' }
  );
  fs.writeFileSync(out, blob);
} else if (kind === 'clean' || kind === 'artifact') {
  const db = new Database(out);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  db.prepare(
    `INSERT INTO channels (id, name, system_prompt, model, source) VALUES ('ch-bound', 'bound', '', ?, 'claude-code')`
  ).run(DEFAULT_MODEL);
  db.prepare(
    `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch-bound', 'default-entity')`
  ).run();
  if (kind === 'artifact') {
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m1', 'ch-bound', 'assistant', 'hi', 'complete')`
    ).run();
    db.prepare(
      `INSERT INTO message_artifacts (id, message_id, type, content) VALUES (?, 'm1', 'thinking', 'a thought')`
    ).run(randomUUID());
  }
  // Checkpoint and close so the input is one file with no sidecars: a leftover
  // from the seed would be read as the subject's.
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  for (const suffix of ['-wal', '-shm']) fs.rmSync(out + suffix, { force: true });
} else {
  throw new Error(`unknown kind: ${kind}`);
}

const summary = (() => {
  const d = new Database(out, { readonly: true });
  const n = (t: string) => {
    try {
      return String(d.prepare(`SELECT COUNT(*) FROM "${t}"`).pluck().get());
    } catch {
      return 'ABSENT';
    }
  };
  const objs = (
    d.prepare('SELECT type, name FROM sqlite_master ORDER BY type, name').all() as {
      type: string;
      name: string;
    }[]
  )
    .filter((o) => !o.name.startsWith('sqlite_autoindex_'))
    .map((o) => `${o.type}:${o.name}`);
  const row = `channels=${n('channels')} channel_entities=${n('channel_entities')} messages=${n('messages')} message_artifacts=${n('message_artifacts')} | ${objs.length} objects`;
  d.close();
  for (const suffix of ['-wal', '-shm']) fs.rmSync(out + suffix, { force: true });
  return row;
})();
console.log(`seeded ${kind}: ${out} (${fs.statSync(out).size} bytes) ${summary}`);
