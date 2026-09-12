// Round 192: what a `-wal` beside the database tells you, and whether the CLI's own
// read-only open confounds it. Zero model calls; a scratch DB in tmp.
import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r192-wal-'));
const db = path.join(dir, 'k.db');
const size = (p) => (fs.existsSync(p) ? fs.statSync(p).size : -1);
const sizes = (tag) =>
  console.log(`${tag.padEnd(38)} db=${size(db)} wal=${size(db + '-wal')} shm=${size(db + '-shm')}`);

let w = new Database(db);
w.pragma('journal_mode = WAL');
w.exec('CREATE TABLE t(a); INSERT INTO t VALUES (1),(2),(3)');
sizes('after create+insert (still open)');
w.pragma('wal_checkpoint(TRUNCATE)');
sizes('after TRUNCATE checkpoint (still open)');
w.close();
sizes('after close');

const r = new Database(db, { readonly: true, fileMustExist: true });
r.prepare('SELECT count(*) c FROM t').get();
sizes('read-only open + select');
r.close();
sizes('after read-only close');

// A second connection held open across a writer's whole life: Round 191's K.
const holder = new Database(db, { readonly: true });
holder.prepare('SELECT count(*) c FROM t').get();
const w2 = new Database(db);
w2.exec('INSERT INTO t VALUES (4)');
w2.close();
sizes('writer closed, holder still open');

// Shape 2's open question: can a TRUNCATE checkpoint see an *idle* connection?
const w3 = new Database(db);
try {
  console.log('TRUNCATE, idle holder open   ->', JSON.stringify(w3.pragma('wal_checkpoint(TRUNCATE)')));
} catch (e) {
  console.log('TRUNCATE, idle holder open   -> THREW', e.message);
}
w3.close();
sizes('after that checkpoint');

// And with the holder inside an open read transaction.
holder.exec('BEGIN');
holder.prepare('SELECT count(*) c FROM t').get();
const w4 = new Database(db);
w4.exec('INSERT INTO t VALUES (5)');
try {
  console.log('TRUNCATE, holder in a read txn ->', JSON.stringify(w4.pragma('wal_checkpoint(TRUNCATE)')));
} catch (e) {
  console.log('TRUNCATE, holder in a read txn -> THREW', e.message);
}
w4.close();
holder.exec('COMMIT');
holder.close();
sizes('end');
fs.rmSync(dir, { recursive: true, force: true });
