/**
 * unit-465rows — drive.
 *
 * usage: node docs/research/unit-465rows-2026-11-06/drive-arms.mjs <corpus|optout|rebuild|control>
 *
 * Every arm prints a `CELL <id> ...` line per registered cell and nothing else
 * that looks like one, so the RESULTS table is read off this output rather than
 * off a reading of it. Scratch lives in os.tmpdir(), never in the repo: a unit
 * directory somebody diffs should hold the instrument and the recording, not the
 * subject.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');
const DBIDX = path.join(REPO, 'packages/server/src/db/index.ts');
const DELTA = path.join(REPO, 'packages/server/src/db/schema-delta.ts');
const arm = process.argv[2];

function tmp(tag) {
  return path.join(os.tmpdir(), `klatch-465rows-${tag}-${randomUUID()}.db`);
}
function rm(p) {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
}
/** Run a child and keep both streams and the exit code — a pipe would hide two of the three. */
function run(cmd, args, env = {}) {
  try {
    const out = execFileSync(cmd, args, {
      cwd: REPO,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out, err: '' };
  } catch (e) {
    return { code: e.status ?? -1, out: e.stdout ?? '', err: e.stderr ?? '' };
  }
}
/** A database at the current schema, built by the real migration code. */
function freshCurrent(tag) {
  const p = tmp(tag);
  const r = run('npx', ['tsx', '-e', `import(${JSON.stringify(DBIDX)}).then(m => { m.getDb(); });`], {
    KLATCH_DB: p,
  });
  if (!fs.existsSync(p)) throw new Error(`freshCurrent failed: ${r.code}\n${r.err}`);
  return p;
}
function deltaOf(p) {
  const r = run('npx', [
    'tsx',
    '-e',
    `import(${JSON.stringify(DELTA)}).then(m => { const d = m.schemaDelta(${JSON.stringify(p)});` +
      ` console.log(JSON.stringify({ d, note: m.describeSchemaDelta(d, ${JSON.stringify(p)}) ?? null })); });`,
  ]);
  const line = r.out.trim().split('\n').filter((l) => l.startsWith('{')).pop();
  if (!line) throw new Error(`deltaOf failed: ${r.code}\n${r.out}\n${r.err}`);
  return JSON.parse(line);
}

// ── B: reachability on the real corpus ────────────────────────────────────────
const MODEL_ALIAS_KEYS = (() => {
  const src = fs.readFileSync(path.join(REPO, 'packages/shared/src/types.ts'), 'utf8');
  const m = /MODEL_ALIASES[^=]*=\s*{([^}]*)}/s.exec(src);
  if (!m) throw new Error('MODEL_ALIASES not found in shared/src/types.ts');
  return [...m[1].matchAll(/'([^']+)'\s*:/g)].map((x) => x[1]);
})();

function corpusArm() {
  console.log(`MODEL_ALIASES keys read from source: ${MODEL_ALIAS_KEYS.join(', ')}`);
  for (const [label, rel] of [
    ['klatch.db', 'klatch.db'],
    ['backup-2026-03-14', 'backups/klatch.db.backup-2026-03-14'],
  ]) {
    const p = path.join(REPO, rel);
    if (!fs.existsSync(p)) {
      console.log(`CELL B-${label} ABSENT ${p}`);
      continue;
    }
    // readonly: this arm must not be the thing that migrates the corpus.
    const db = new Database(p, { readonly: true });
    const unbound = db
      .prepare(
        `SELECT COUNT(*) n FROM channels c LEFT JOIN channel_entities ce ON c.id = ce.channel_id WHERE ce.channel_id IS NULL`
      )
      .get().n;
    let pending = 'n/a';
    try {
      pending = db
        .prepare(
          `SELECT COUNT(*) n FROM message_artifacts WHERE type = 'file' AND file_storage_key IS NOT NULL
             AND file_storage_key NOT IN (SELECT storage_key FROM files)`
        )
        .get().n;
    } catch (e) {
      pending = `error: ${e.message}`;
    }
    let aliasHits = 0;
    for (const k of MODEL_ALIAS_KEYS) {
      for (const t of ['channels', 'messages']) {
        try {
          aliasHits += db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE model = ?`).get(k).n;
        } catch {
          /* table or column absent on an older schema */
        }
      }
    }
    const totals = {
      channels: db.prepare('SELECT COUNT(*) n FROM channels').get().n,
      artifacts: (() => {
        try {
          return db.prepare('SELECT COUNT(*) n FROM message_artifacts').get().n;
        } catch {
          return 'absent';
        }
      })(),
      fileArtifacts: (() => {
        try {
          return db.prepare(`SELECT COUNT(*) n FROM message_artifacts WHERE type = 'file'`).get().n;
        } catch {
          return 'absent';
        }
      })(),
    };
    db.close();
    console.log(`CELL B1 ${label} channels-with-no-entity-row = ${unbound} (of ${totals.channels} channels)`);
    console.log(
      `CELL B2 ${label} file-artifacts-not-yet-in-files = ${pending} (of ${totals.fileArtifacts} type='file', ${totals.artifacts} artifacts)`
    );
    console.log(`CELL B3 ${label} MODEL_ALIASES row matches = ${aliasHits}`);
  }
}

// ── C: the opt-out does not opt out ───────────────────────────────────────────
function seedDataStates(p) {
  const db = new Database(p);
  db.pragma('foreign_keys = ON');
  db.exec(`
    INSERT INTO channels (id, name, system_prompt) VALUES ('ch-unbound', 'a channel nobody bound', '');
    INSERT INTO messages (id, channel_id, role, content) VALUES ('m1', 'ch-unbound', 'user', 'hi');
    INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
      VALUES ('art1', 'm1', 'file', 'a.png', 'image/png', 11, 'store/a.png');
  `);
  // The migration's auto-assign fires on a channel with no row at all, so the
  // seeded channel must be left unbound — and `initSchema`'s own INSERT OR IGNORE
  // for 'default' has already been run by freshCurrent, so the default channel
  // is bound and is not what this cell measures.
  db.prepare(`DELETE FROM channel_entities WHERE channel_id = 'ch-unbound'`).run();
  const state = {
    unbound: db
      .prepare(
        `SELECT COUNT(*) n FROM channels c LEFT JOIN channel_entities ce ON c.id = ce.channel_id WHERE ce.channel_id IS NULL`
      )
      .get().n,
    files: db.prepare('SELECT COUNT(*) n FROM files').get().n,
    refs: db.prepare('SELECT COUNT(*) n FROM file_refs').get().n,
  };
  db.close();
  return state;
}
function readState(p) {
  const db = new Database(p, { readonly: true });
  const s = {
    unbound: db
      .prepare(
        `SELECT COUNT(*) n FROM channels c LEFT JOIN channel_entities ce ON c.id = ce.channel_id WHERE ce.channel_id IS NULL`
      )
      .get().n,
    boundTo: db
      .prepare(`SELECT entity_id FROM channel_entities WHERE channel_id = 'ch-unbound'`)
      .all()
      .map((r) => r.entity_id),
    files: db.prepare('SELECT COUNT(*) n FROM files').get().n,
    refs: db.prepare('SELECT COUNT(*) n FROM file_refs').get().n,
    fileIds: db.prepare('SELECT id FROM files ORDER BY id').all().map((r) => r.id),
  };
  db.close();
  return s;
}

function optoutArm() {
  const runs = [];
  for (const pass of [1, 2]) {
    const p = freshCurrent(`optout${pass}`);
    const before = seedDataStates(p);
    const d = deltaOf(p);
    if (pass === 1) {
      console.log(`CELL C1 delta.empty = ${d.d.empty} · describeSchemaDelta = ${d.note === null ? 'undefined' : 'a note'}`);
      console.log(`  seeded before: ${JSON.stringify(before)}`);
    }
    const r = run('npx', ['tsx', TOOL, p, '--apply', '--no-migrate']);
    const after = readState(p);
    if (pass === 1) {
      console.log(`CELL C2 exit=${r.code} refused=${/Refusing to run/.test(r.out + r.err)}`);
      console.log(`CELL C3 channel_entities for 'ch-unbound' after the run = ${JSON.stringify(after.boundTo)} (unbound now ${after.unbound})`);
      console.log(`CELL C4 files ${before.files} -> ${after.files} · file_refs ${before.refs} -> ${after.refs}`);
      const mentions = /file_refs|files table|channel_entities|auto-assign|SCHEMA:/i.exec(r.out + r.err);
      console.log(`CELL C5 run output mentions either write: ${mentions ? JSON.stringify(mentions[0]) : 'no'}`);
      console.log('--- tool stdout ---');
      console.log(r.out.trimEnd());
      console.log('--- tool stderr ---');
      console.log(r.err.trimEnd());
    }
    runs.push(after.fileIds);
    rm(p);
    for (const f of fs.readdirSync(os.tmpdir())) {
      if (f.startsWith('.backfill-') || f.includes('klatch-465rows-optout')) {
        // undo records the apply writes beside its target
        if (f.startsWith('.backfill-')) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
      }
    }
  }
  const same = JSON.stringify(runs[0]) === JSON.stringify(runs[1]);
  console.log(`CELL C4b file ids across two independent runs identical = ${same} · ${JSON.stringify(runs)}`);
}

// ── D: a rebuild the cured delta reports as a plain column append ─────────────
//
// D1 as pre-registered is refuted and the refutation is recorded, not edited out:
// `applySchema` *throws* on a `messages` that is a strict prefix of the rebuild's
// column order, because the rebuild's `INSERT ... SELECT` names `created_at`
// explicitly. So the blind cell cannot be reached through the one rebuild that
// exists. D1 keeps the original construction to record the throw; D3 shows the
// blind cell at the predicate level with `diffCensus`, which is where it is real;
// D4 reproduces Daedalus's §6b cure under a hand that did not write it.
function rebuildArm() {
  const p = tmp('rebuild');
  const db = new Database(p);
  // The rebuild's own column order, minus the trailing `created_at`, with the
  // narrow three-value status CHECK that the migration's guard fires on.
  db.exec(`
    CREATE TABLE channels (id TEXT PRIMARY KEY, name TEXT NOT NULL, system_prompt TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT 'x', mode TEXT NOT NULL DEFAULT 'y', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'streaming', 'error')),
      stop_reason TEXT,
      model TEXT,
      entity_id TEXT,
      original_timestamp TEXT,
      original_id TEXT
    );
    INSERT INTO channels (id, name) VALUES ('c', 'c');
    INSERT INTO messages (id, channel_id, role, content) VALUES ('m', 'c', 'user', 'row that gets rewritten');
  `);
  const beforeCols = db.prepare(`PRAGMA table_info("messages")`).all().map((c) => c.name);
  db.close();
  console.log(`CELL D1 before cols = ${JSON.stringify(beforeCols)} (a strict prefix of the rebuild's order)`);
  let d1;
  try {
    d1 = deltaOf(p);
    console.log(`CELL D1 rebuiltTables = ${JSON.stringify(d1.d.rebuiltTables)} · alteredTables = ${JSON.stringify(d1.d.alteredTables)} · addedColumns = ${JSON.stringify(d1.d.addedColumns)}`);
  } catch (e) {
    const m = /(SqliteError: [^\n]*)/.exec(e.message);
    console.log(`CELL D1 schemaDelta THREW: ${m ? m[1] : e.message.split('\n')[0]}`);
    console.log(`CELL D1 verdict: the blind cell is NOT reachable through this migration — the rebuild's INSERT..SELECT names every column, so a prefix table dies instead of migrating.`);
  }
  // D1e — what the script does with that throw: the `schemaUnknown` arm, which
  // needs a database that throws *inside* schemaDelta rather than an unreadable
  // file, and is therefore not the same known positive as an unreadable one.
  const r1 = run('npx', ['tsx', TOOL, p, '--apply', '--no-migrate']);
  console.log(
    `CELL D1e --apply --no-migrate against it: exit=${r1.code} · "could not be\\n  determined" = ${/could not be\s+determined/.test(r1.err)}`
  );
  const r1b = run('npx', ['tsx', TOOL, p, '--apply']);
  console.log(`CELL D1f --apply without --no-migrate against it: exit=${r1b.code} · no-such-column surfaced = ${/no such column/.test(r1b.out + r1b.err)}`);
  const dbAfter = new Database(p, { readonly: true });
  const colsAfter = dbAfter.prepare(`PRAGMA table_info("messages")`).all().map((c) => c.name);
  dbAfter.close();
  console.log(`CELL D1g messages cols on the subject after that failed apply = ${JSON.stringify(colsAfter)}`);
  rm(p);

  // D3 — the blind cell at the predicate level, through the exported comparison.
  const before = {
    objects: ['table:t'],
    cols: { t: ['id', 'a'] },
    sql: { t: `CREATE TABLE t (id TEXT, a TEXT CHECK (a IN ('x')))` },
  };
  const after = {
    objects: ['table:t'],
    cols: { t: ['id', 'a', 'b'] },
    sql: { t: `CREATE TABLE t (id TEXT, a TEXT CHECK (a IN ('x','y')), b TEXT)` },
  };
  const r3 = run('npx', [
    'tsx',
    '-e',
    `import(${JSON.stringify(DELTA)}).then(m => console.log(JSON.stringify(m.diffCensus(${JSON.stringify(before)}, ${JSON.stringify(after)}))));`,
  ]);
  const d3 = JSON.parse(r3.out.trim().split('\n').filter((l) => l.startsWith('{')).pop());
  console.log(`CELL D3 appended-column-plus-widened-CHECK: ${JSON.stringify(d3)}`);
  console.log(`CELL D3 verdict: rebuilt=${d3.rebuiltTables.length} altered=${d3.alteredTables.length} — a rebuild reported as a plain append.`);

  // D4 — Daedalus's §6b cure, reproduced by a hand that did not write it. The
  // first narrow-and-apply cycle settles `messages` into the rebuild's own column
  // order; only the second narrow carries the property (same columns, same order,
  // different text), which is the vacuity he found in his own known positive.
  const NARROW_CHECK = `status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'streaming', 'error'))`;
  // Order as `initSchema` + the ALTERs leave it: `created_at` mid-list, where the
  // rebuild does not put it.
  const INIT_ORDER = `id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES channels(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content TEXT NOT NULL DEFAULT '',
      ${NARROW_CHECK}, stop_reason TEXT, model TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), entity_id TEXT, original_timestamp TEXT, original_id TEXT`;
  // The order the rebuild itself produces: `created_at` last.
  const REBUILD_ORDER = `id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES channels(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content TEXT NOT NULL DEFAULT '',
      ${NARROW_CHECK}, stop_reason TEXT, model TEXT, entity_id TEXT, original_timestamp TEXT,
      original_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))`;
  for (const [cell, body, why] of [
    ['D4a', INIT_ORDER, "initSchema's own order — the shape Daedalus's first known positive had"],
    ['D4b', REBUILD_ORDER, "the rebuild's own order — the shape that carries the property"],
  ]) {
    const q = freshCurrent(`kp-${cell}`);
    const h = new Database(q);
    h.pragma('foreign_keys = OFF');
    h.exec(`DROP TABLE messages; CREATE TABLE messages (${body});`);
    const order = h.prepare(`PRAGMA table_info("messages")`).all().map((c) => c.name);
    h.close();
    const dk = deltaOf(q);
    console.log(`CELL ${cell} (${why})`);
    console.log(`CELL ${cell} order = ${JSON.stringify(order)}`);
    console.log(
      `CELL ${cell} delta: rebuilt=${JSON.stringify(dk.d.rebuiltTables)} altered=${JSON.stringify(dk.d.alteredTables)} addedColumns=${JSON.stringify(dk.d.addedColumns)} empty=${dk.d.empty}`
    );
    console.log(`CELL ${cell} note mentions 'changed constraint' = ${/changed constraint/.test(dk.note ?? '')}`);
    if (cell === 'D4b') {
      console.log('--- rendered disclosure (D4b) ---');
      console.log(dk.note ?? '(undefined)');
    }
    rm(q);
  }
}

// ── E: control — the frozen pre-cure script ───────────────────────────────────
function controlArm() {
  // Inside the repo, at `scripts/`'s own depth: a copy in os.tmpdir() cannot
  // resolve `better-sqlite3` and refuses every cell for a reason that has nothing
  // to do with the flag under test. Not under `scripts/`, because that directory
  // is the probe census's own population and a scratch file there is a file the
  // hygiene gate has to have an opinion about.
  const frozen = path.join(REPO, 'docs', `.frozen-465rows-${randomUUID()}.mts`);
  const src = execFileSync('git', ['show', 'c16f53ac^:scripts/backfill-entity-bindings.mts'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 1 << 24,
  });
  fs.writeFileSync(frozen, src);
  const p = freshCurrent('control');
  seedDataStates(p);
  const r = run('npx', ['tsx', frozen, p, '--apply', '--no-migrate']);
  console.log(`CELL E1 frozen script exit=${r.code} · unknown-flag refusal = ${/not a flag this script knows/.test(r.out + r.err)}`);
  console.log('--- frozen stderr (first 12 lines) ---');
  console.log(r.err.trimEnd().split('\n').slice(0, 12).join('\n'));
  const after = readState(p);
  console.log(`  (frozen run state after: ${JSON.stringify(after)})`);
  fs.rmSync(frozen, { force: true });
  rm(p);
}

// ── F: post-hoc, declared as post-hoc ─────────────────────────────────────────
//
// Not pre-registered. The C arm established that an *apply* writes three rows the
// delta cannot see; the script's header claims "a dry run cannot touch the
// database it is reporting on", and the same data states are the sharpest test of
// that sentence there is. Declared here rather than folded into a C cell.
function dryrunArm() {
  const p = freshCurrent('dryrun');
  const before = seedDataStates(p);
  const sizeBefore = fs.statSync(p).size;
  const r = run('npx', ['tsx', TOOL, p]);
  const after = readState(p);
  const sizeAfter = fs.statSync(p).size;
  console.log(`CELL F1 dry run (no --apply): exit=${r.code}`);
  console.log(`  before ${JSON.stringify(before)} · after ${JSON.stringify({ unbound: after.unbound, files: after.files, refs: after.refs })}`);
  console.log(`CELL F1 channel_entities for 'ch-unbound' after a DRY run = ${JSON.stringify(after.boundTo)}`);
  console.log(`CELL F2 file bytes ${sizeBefore} -> ${sizeAfter} · changed = ${sizeBefore !== sizeAfter}`);
  console.log(`CELL F3 sidecars left beside the target: ${['-wal', '-shm'].filter((s) => fs.existsSync(p + s)).join(', ') || 'none'}`);
  rm(p);
}

const arms = { corpus: corpusArm, optout: optoutArm, rebuild: rebuildArm, control: controlArm, dryrun: dryrunArm };
if (!arms[arm]) {
  console.error(`arm must be one of: ${Object.keys(arms).join(', ')}`);
  process.exit(2);
}
console.log(`repo HEAD: ${execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()}`);
console.log(`arm: ${arm} · ${new Date().toISOString()}`);
arms[arm]();
