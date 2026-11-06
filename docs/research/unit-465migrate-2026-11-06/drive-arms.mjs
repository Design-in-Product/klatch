#!/usr/bin/env node
/**
 * unit-465migrate — drive the registered arms.
 *
 * Each arm gets its own directory under `scratch/arms/<ARM>/` holding a fresh
 * copy of the input database, because the tool writes a snapshot *beside* the
 * database it is given and two arms sharing a directory would read each other's.
 *
 * The input database is never the file tracked on `main` — that one has already
 * been migrated by the apply this unit is about. `scratch/pristine-march.db` is
 * the pre-apply blob out of `git show c945e8aa:…`, extracted once by hand and
 * checked here on every run so a drive cannot silently use the wrong baseline.
 *
 * Nothing in here hard-types a schema. Every object and column list printed is
 * read out of the database file in front of it.
 *
 * usage: node docs/research/unit-465migrate-2026-11-06/drive-arms.mjs <label>
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';

const UNIT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(UNIT, '../../..');
const SCRATCH = path.join(UNIT, 'scratch');
const PRISTINE = path.join(SCRATCH, 'pristine-march.db');
/**
 * The subject. `--tool=<path>` points the drive at a *frozen* copy of the
 * script instead of the live one, which is how the PRE cells for the argv arms
 * are taken after the cure has landed.
 *
 * It has to sit in `scripts/` either way: the script's imports are relative to
 * its own directory, so a copy anywhere else resolves nothing. For the argv arms
 * that costs nothing — the parse boundary refuses before the first dynamic
 * import runs, so the cured modules beside the frozen copy are never loaded, and
 * the absence of a SCHEMA block in those cells is the evidence.
 */
const toolArg = process.argv.find((a) => a.startsWith('--tool='))?.slice('--tool='.length);
const TOOL = toolArg ? path.resolve(toolArg) : path.join(REPO, 'scripts/backfill-entity-bindings.mts');

const label = process.argv[2] ?? 'unlabelled';

// The baseline's identity, asserted against bytes rather than a filename. If the
// extraction is ever redone from the wrong rev this is where the drive stops.
const PRISTINE_BYTES = 5230592;
if (!fs.existsSync(PRISTINE)) {
  console.error(`no pristine baseline at ${PRISTINE}`);
  console.error("extract it:  git show c945e8aa:backups/klatch.db.backup-2026-03-14 > " + PRISTINE);
  process.exit(1);
}
const pristineSize = fs.statSync(PRISTINE).size;
if (pristineSize !== PRISTINE_BYTES) {
  console.error(`pristine baseline is ${pristineSize} bytes, registered as ${PRISTINE_BYTES}`);
  process.exit(1);
}

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/** Everything about a database file this unit makes a claim about. */
function census(p) {
  const d = new Database(p, { readonly: true, fileMustExist: true });
  try {
    const objs = d.prepare('SELECT type, name FROM sqlite_master ORDER BY type, name').all();
    const tables = objs.filter((o) => o.type === 'table').map((o) => o.name);
    const cols = {};
    for (const t of tables) {
      cols[t] = d.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
    }
    return {
      bytes: fs.statSync(p).size,
      sha256: sha(p),
      // Two keys, named. `objects` is every sqlite_master row; `objectsNoAuto`
      // excludes `sqlite_autoindex_*`, which is the key Theseus's `pre objects: 7`
      // is computed under. Printing one of them unlabelled is how two correct
      // counts come to look like a disagreement.
      objects: objs.map((o) => `${o.type}:${o.name}`),
      objectsNoAuto: objs.filter((o) => !o.name.startsWith('sqlite_autoindex_')).map((o) => `${o.type}:${o.name}`),
      cols,
      pageCount: d.pragma('page_count', { simple: true }),
      pageSize: d.pragma('page_size', { simple: true }),
      freelist: d.pragma('freelist_count', { simple: true }),
    };
  } finally {
    d.close();
  }
}

function diffCensus(before, after) {
  const addedObjects = after.objectsNoAuto.filter((o) => !before.objectsNoAuto.includes(o));
  const removedObjects = before.objectsNoAuto.filter((o) => !after.objectsNoAuto.includes(o));
  const addedCols = [];
  const movedCols = [];
  for (const [t, cs] of Object.entries(after.cols)) {
    const was = before.cols[t];
    if (!was) continue;
    for (const c of cs) if (!was.includes(c)) addedCols.push(`${t}.${c}`);
    const wasKept = was.filter((c) => cs.includes(c));
    const nowKept = cs.filter((c) => was.includes(c));
    if (wasKept.join(',') !== nowKept.join(',')) movedCols.push(`${t}: ${was.join(',')} -> ${cs.join(',')}`);
  }
  return { addedObjects, removedObjects, addedCols, movedCols };
}

/**
 * A database at the *current* schema, built by letting the product's own
 * migration path run against a copy — not by a hand-written CREATE TABLE set,
 * which would be a second schema definition to drift from the first.
 */
function migratedCopy(dest) {
  fs.copyFileSync(PRISTINE, dest);
  // An absolute file URL, not a relative specifier: `tsx -e` resolves a relative
  // import against the child's cwd, which is the class of defect this unit's own
  // driver would otherwise walk into.
  const idx = pathToFileURL(path.join(REPO, 'packages/server/src/db/index.ts')).href;
  execFileSync('npx', ['tsx', '-e', `import(${JSON.stringify(idx)}).then(m => { m.getDb(); });`], {
    cwd: REPO,
    env: { ...process.env, KLATCH_DB: dest },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const side of ['-wal', '-shm']) fs.rmSync(dest + side, { force: true });
  return dest;
}

function run(arm, { input, args, note }) {
  const dir = path.join(SCRATCH, 'arms', arm);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const db = path.join(dir, 'subject.db');
  if (input === 'pristine') fs.copyFileSync(PRISTINE, db);
  else if (input === 'migrated') migratedCopy(db);
  else if (typeof input === 'function') input(db);
  else throw new Error(`arm ${arm}: unknown input ${input}`);

  const before = census(db);
  const t0 = Date.now();
  let status = 0;
  let out = '';
  let err = '';
  try {
    out = execFileSync('npx', ['tsx', TOOL, db, ...args], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    status = e.status ?? -1;
    out = e.stdout ?? '';
    err = e.stderr ?? '';
  }
  const ms = Date.now() - t0;
  const after = census(db);
  const d = diffCensus(before, after);
  const leftovers = fs.readdirSync(dir).filter((f) => f !== 'subject.db');

  console.log(`\n${'='.repeat(78)}\n== ${arm}  [${note}]\n${'='.repeat(78)}`);
  console.log(`argv:   ${args.join(' ') || '(none)'}`);
  console.log(`exit:   ${status}`);
  console.log(`wall:   ${ms} ms`);
  console.log(`bytes:  ${before.bytes} -> ${after.bytes}`);
  console.log(`pages:  ${before.pageCount} -> ${after.pageCount}  (page_size ${after.pageSize}, freelist ${before.freelist} -> ${after.freelist})`);
  console.log(`sha256: ${before.sha256.slice(0, 16)} -> ${after.sha256.slice(0, 16)}  ${before.sha256 === after.sha256 ? 'TARGET INTACT' : 'TARGET WRITTEN'}`);
  console.log(`objects(no-auto): ${before.objectsNoAuto.length} -> ${after.objectsNoAuto.length}`);
  console.log(`objects(all):     ${before.objects.length} -> ${after.objects.length}`);
  if (d.addedObjects.length) console.log(`added objects:   ${d.addedObjects.join('  ')}`);
  if (d.removedObjects.length) console.log(`removed objects: ${d.removedObjects.join('  ')}`);
  console.log(`added columns (${d.addedCols.length}): ${d.addedCols.join('  ') || '(none)'}`);
  for (const m of d.movedCols) console.log(`column order moved: ${m}`);
  console.log(`files left beside the db: ${leftovers.join('  ') || '(none)'}`);
  console.log(`--- stdout (${out.length} bytes) ---`);
  console.log(out.trimEnd());
  console.log(`--- stderr (${err.length} bytes) ---`);
  console.log(err.trimEnd());
}

/** A current-schema database with exactly one column removed, by rebuild. */
function migratedMinusProjectsMemory(dest) {
  migratedCopy(dest);
  const d = new Database(dest);
  d.pragma('foreign_keys = OFF');
  d.exec(`
    CREATE TABLE projects_rebuild (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'native',
      source_metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO projects_rebuild (id, name, instructions, source, source_metadata, created_at)
      SELECT id, name, instructions, source, source_metadata, created_at FROM projects;
    DROP TABLE projects;
    ALTER TABLE projects_rebuild RENAME TO projects;
  `);
  d.close();
  for (const side of ['-wal', '-shm']) fs.rmSync(dest + side, { force: true });
}

const ARMS = {
  M1: { input: 'pristine', args: ['--bases=identity-claim,role-title', '--apply'], note: 'his own command, from the pristine blob' },
  M2: { input: 'pristine', args: [], note: 'dry run — does it touch the target at all' },
  A1: { input: 'migrated', args: [], note: 'already at the current schema, dry run' },
  A2: { input: 'pristine', args: ['--apply', '--no-migrate'], note: 'the opt-out, on a database that would be upgraded' },
  A3: { input: 'migrated', args: ['--apply', '--no-migrate'], note: 'the opt-out, on a database that would not' },
  // Declared post-hoc, added after drive2 and labelled as such rather than
  // folded into A3's registered cell. A3 as registered said "applies, exit 0";
  // it exited 0 and refused nothing, but with the default bases the plan had
  // nothing to move, so the half of the cell that says a *write* proceeds was
  // never demonstrated. This arm is A3 with his own two bases on the line.
  A3b: { input: 'migrated', args: ['--bases=identity-claim,role-title', '--apply', '--no-migrate'], note: 'POST-HOC: A3 with a plan that actually moves rows' },
  A4: { input: 'pristine', args: ['--apply', '--no-migrat'], note: 'the typo — does the argv rule cover the new flag' },
  A5: { input: 'pristine', args: ['--no-migrate'], note: 'review sheet with the opt-out on the line' },
  A6: { input: migratedMinusProjectsMemory, args: [], note: 'current schema minus exactly one column' },
};

const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const names = only.length ? only : Object.keys(ARMS).filter((n) => n !== 'A3b');
console.log(`unit-465migrate drive — ${label}`);
console.log(`repo HEAD: ${execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()}`);
console.log(`pristine:  ${pristineSize} bytes  sha256 ${sha(PRISTINE).slice(0, 16)}`);
console.log(`tool:      ${path.relative(REPO, TOOL)}`);
console.log(`arms:      ${names.join(' ')}`);
for (const n of names) run(n, ARMS[n]);
