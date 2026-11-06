/**
 * unit-465rowdelta — build the arms' input databases with the *real* schema code.
 *
 * usage: npx tsx seed.mts <out.db> <kind>
 *
 * Kinds, all built by `applySchema` on an empty file so the schema is current by
 * construction and `schemaDelta().empty` is true — every arm here is about rows,
 * not about the schema, and a seeded file carrying a schema delta would grade the
 * wrong thing.
 *
 *   seeded   Theseus's §4 shape: one channel with NO channel_entities row, one
 *            type='file' artifact whose file_storage_key is not in `files`.
 *   clean    one channel already bound to default-entity, no file artifacts.
 *            The non-vacuity arm: nothing for runMigrations to write.
 *   alias    like `clean`, plus one channel whose `model` is a live MODEL_ALIASES
 *            key. Net row counts unchanged by the migration; rows rewritten.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { applySchema } from '../../../packages/server/src/db/index.js';
import { MODEL_ALIASES, DEFAULT_MODEL } from '../../../packages/shared/src/types.js';

const [out, kind] = process.argv.slice(2);
if (!out || !kind) throw new Error('usage: seed.mts <out.db> <kind>');
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(out + suffix, { force: true });

const db = new Database(out);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
applySchema(db);

// `applySchema` on an empty file mints `default-entity` itself (site 3), so after
// this point every arm's remaining seed is deliberate.
const mk = (id: string, name: string, model: string) =>
  db
    .prepare(
      `INSERT INTO channels (id, name, system_prompt, model, source) VALUES (?, ?, '', ?, 'claude-code')`
    )
    .run(id, name, model);

if (kind === 'seeded') {
  // No channel_entities row for this one: site 4's input.
  mk('ch-unbound', 'unbound', DEFAULT_MODEL);
  // A message to hang the artifact off, and the artifact itself: site 2's input.
  db.prepare(
    `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m1', 'ch-unbound', 'user', 'hi', 'complete')`
  ).run();
  db.prepare(
    `INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
     VALUES (?, 'm1', 'file', 'a.txt', 'text/plain', 3, 'storage/a.txt')`
  ).run(randomUUID());
} else if (kind === 'clean' || kind === 'alias') {
  mk('ch-bound', 'bound', DEFAULT_MODEL);
  db.prepare(
    `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch-bound', 'default-entity')`
  ).run();
  if (kind === 'alias') {
    const legacy = Object.keys(MODEL_ALIASES)[0];
    if (!legacy) throw new Error('MODEL_ALIASES is empty — the alias arm has no input');
    mk('ch-alias', 'alias', legacy);
    db.prepare(
      `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch-alias', 'default-entity')`
    ).run();
    console.log(`alias key seeded: ${legacy} -> ${MODEL_ALIASES[legacy]}`);
  }
} else {
  throw new Error(`unknown kind: ${kind}`);
}

// Checkpoint and close so the arm's input is one file with no sidecars: every arm
// hashes the target, and a hash over a file with a live -wal beside it is not the
// hash of its contents.
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
for (const suffix of ['-wal', '-shm']) fs.rmSync(out + suffix, { force: true });
console.log(`seeded ${kind}: ${out} (${fs.statSync(out).size} bytes)`);
