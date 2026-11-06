/**
 * unit-465keys — build each arm's input database with the *real* schema code.
 *
 * usage: npx tsx seed.mts <out.db> <kind>
 *
 * Every kind is built by `applySchema` on an empty file, so the schema is current
 * by construction and `schemaDelta().empty` is true on the uncrippled tree. Arms
 * about the *keys* must not carry a schema delta of their own, or they grade the
 * wrong thing.
 *
 *   seeded     Theseus's §4 shape, copied from Daedalus's `unit-465rowdelta/seed.mts`:
 *              one channel with NO channel_entities row, one type='file' artifact
 *              whose storage key is not in `files`. The arm that must refuse.
 *   clean      one channel already bound to default-entity, no file artifacts.
 *              Nothing for the migration to write — the control.
 *   artifact   `clean`, plus one message and one **type='thinking'** artifact.
 *              Deliberately not type='file': site 2 fires on file artifacts not yet
 *              in `files`, and an arm whose point is "rowWrites is 0" cannot carry a
 *              row write of its own. Input for cripples Y1 and Y2.
 *   nodefault  `clean`, then `DELETE FROM channels WHERE id = 'default'`. Input for
 *              P5INITSITES — a row-writing site in `initSchema`, which the published
 *              census does not name.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { applySchema } from '../../../packages/server/src/db/index.js';
import { DEFAULT_MODEL } from '../../../packages/shared/src/types.js';

const [out, kind] = process.argv.slice(2);
if (!out || !kind) throw new Error('usage: seed.mts <out.db> <kind>');
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(out + suffix, { force: true });

const db = new Database(out);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
applySchema(db);

const mk = (id: string, name: string, model: string) =>
  db
    .prepare(
      `INSERT INTO channels (id, name, system_prompt, model, source) VALUES (?, ?, '', ?, 'claude-code')`
    )
    .run(id, name, model);

const bind = (id: string) =>
  db
    .prepare(`INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, 'default-entity')`)
    .run(id);

if (kind === 'seeded') {
  mk('ch-unbound', 'unbound', DEFAULT_MODEL);
  db.prepare(
    `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m1', 'ch-unbound', 'user', 'hi', 'complete')`
  ).run();
  db.prepare(
    `INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
     VALUES (?, 'm1', 'file', 'a.txt', 'text/plain', 3, 'storage/a.txt')`
  ).run(randomUUID());
} else if (kind === 'clean' || kind === 'artifact' || kind === 'nodefault') {
  mk('ch-bound', 'bound', DEFAULT_MODEL);
  bind('ch-bound');
  if (kind === 'artifact') {
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m1', 'ch-bound', 'assistant', 'hi', 'complete')`
    ).run();
    db.prepare(
      `INSERT INTO message_artifacts (id, message_id, type, content) VALUES (?, 'm1', 'thinking', 'a thought')`
    ).run(randomUUID());
  }
  if (kind === 'nodefault') {
    // The `default` channel `initSchema` seeds with INSERT OR IGNORE. Removing it
    // makes that site's input present. Its own binding row goes with it, or the
    // FK leaves an orphan and site 4 would fire for a channel that is not there.
    db.prepare(`DELETE FROM channel_entities WHERE channel_id = 'default'`).run();
    db.prepare(`DELETE FROM channels WHERE id = 'default'`).run();
  }
} else {
  throw new Error(`unknown kind: ${kind}`);
}

// Checkpoint and close so the input is one file with no sidecars: the sidecar arms
// set their own precondition and a leftover from the seed would be read as one.
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
for (const suffix of ['-wal', '-shm']) fs.rmSync(out + suffix, { force: true });
const counts = (() => {
  const d = new Database(out, { readonly: true });
  const n = (t: string) => d.prepare(`SELECT COUNT(*) FROM "${t}"`).pluck().get() as number;
  const row = `channels=${n('channels')} entities=${n('entities')} channel_entities=${n('channel_entities')} messages=${n('messages')} message_artifacts=${n('message_artifacts')} files=${n('files')}`;
  d.close();
  for (const suffix of ['-wal', '-shm']) fs.rmSync(out + suffix, { force: true });
  return row;
})();
console.log(`seeded ${kind}: ${out} (${fs.statSync(out).size} bytes) ${counts}`);
