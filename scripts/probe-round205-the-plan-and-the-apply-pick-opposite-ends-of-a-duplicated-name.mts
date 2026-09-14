/**
 * Round 205 — the plan and the apply pick opposite ends of a duplicated name.
 *
 * Theseus, 2026-09-13 STOP fire. Daedalus's Round 204 §2 filed one item
 * undispositioned: `resolveImportEntity` matches on `normalizeName` via
 * `entities.find(…)`, first match wins, so with a case-variant pair present a
 * later reuse-by-name resolve "binds to whichever `getAllEntities()` returns
 * first." That is true, and it is the smaller half of it.
 *
 * There are **two** resolvers of "the entity with this name" and they read the
 * table in opposite directions:
 *
 *   plan   `entity-backfill.ts:432`  new Map(SELECT id, name FROM entities)
 *                                    — no ORDER BY; a Map keeps the LAST row
 *   apply  `entity-backfill.ts:677` → `entity-resolve.ts:96-100`
 *                                    getAllEntities() = ORDER BY created_at ASC,
 *                                    then .find() — the FIRST row
 *
 * When a name is carried by more than one entity these disagree, and the sheet
 * cannot show it: `MATCHED-BY-NAME → "Daedalus"` prints the name, never the id.
 * Round 202 closed the plan/apply divergence for the *basis* question, and its
 * own comment states the rule — "the apply pass has no business reaching a
 * different answer." The rule still has a hole for the which-of-several
 * question.
 *
 * Arms A–C drive it end to end with no corpus present. Arms D–E measure xian's
 * March backup, where **66 of 68 entities live inside a duplicate-name group**.
 * Arm F states the reachability limit honestly rather than dressing it up: on
 * *this* corpus, today, no reusing basis fires, so nothing here is a live
 * mis-write against it. Arm Z asserts nothing was written outside `.testdata/`.
 *
 * Run: npx tsx scripts/probe-round205-the-plan-and-the-apply-pick-opposite-ends-of-a-duplicated-name.mts
 */

import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(ROOT, '.testdata', 'r205-probe');
const CORPUS = '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const SELF = fileURLToPath(import.meta.url);

// ---------------------------------------------------------------------------
// Child mode. `db/index.ts` resolves DB_PATH once at import time from
// KLATCH_DB, so a plan against a chosen file has to happen in a fresh process.
// The probe re-execs itself rather than adding a second committed script.
// ---------------------------------------------------------------------------
if (process.env.R205_PLAN_DB) {
  process.env.KLATCH_DB = process.env.R205_PLAN_DB;
  const { planEntityBackfill } = await import('../packages/server/src/db/entity-backfill.js');
  const plan = planEntityBackfill({ bases: ['identity-claim'] });
  const rows = plan.rows
    .filter((r) => r.guessName)
    .map((r) => ({
      channelId: r.channelId,
      action: r.action,
      guessName: r.guessName,
      targetEntityId: r.targetEntityId ?? null,
      // Round 206 replaced the singular `sameNameEntityId` with a list; this
      // projection still asked for the old name and so reported null for every
      // row. No check read it, so nothing was scored wrong — but it would have
      // scored wrong the moment one did. Corrected Round 209.
      sameNameEntityIds: r.sameNameEntityIds ?? null,
    }));
  console.log(JSON.stringify({ rows, summary: plan.summary }));
  process.exit(0);
}

let checks = 0;
let failed = 0;
let open = 0;
let meas = 0;

const pass = (id: string, why: string, detail = '') => {
  checks++;
  console.log(`  [PASS] ${id} · ${why}${detail ? ` — ${detail}` : ''}`);
};
const fail = (id: string, why: string, detail = '') => {
  checks++;
  failed++;
  console.log(`  [FAIL] ${id} · ${why}${detail ? ` — ${detail}` : ''}`);
};
const check = (id: string, cond: boolean, why: string, detail = '') =>
  cond ? pass(id, why, detail) : fail(id, why, detail);
const open_ = (id: string, why: string) => {
  open++;
  console.log(`  [OPEN] ${id} · ${why}`);
};
const measure = (id: string, what: string) => {
  meas++;
  console.log(`  [MEAS] ${id}: ${what}`);
};

// ---------------------------------------------------------------------------
// WORK is CLEARED, not merely created — retrofitted 2026-09-14 (Round 209).
// As first written this was `mkdirSync({recursive:true})` alone, and both
// consequences were observed for real:
//
//   1. Argus's 2026-09-14 09:02 fire hit `SqliteError: database disk image is
//      malformed` inside `planEntityBackfill` on a *cold* run. Cause reproduced
//      with a control this fire: `planOf()` opens KLATCH_DB read-write, and the
//      child `process.exit(0)`s without checkpointing, leaving a 4,276,592 B
//      `f-reach.db-wal`. Arms D/E/F below then `copyFileSync` the main file
//      only, so the next run's fresh pages get the previous run's WAL replayed
//      on top of them. Read-only opens survive it; the plan child does not.
//   2. Worse, and not corruption: arm C's `readdirSync(WORK).filter(...)[0]`
//      can find the PREVIOUS run's undo record, so C1–C5 report green about a
//      run that never happened.
//
// Clearing the whole tree is the only form of this that does not have to be
// remembered file by file. `copyCorpus` below is the same rule for the copies
// arms D/E/F make *within* a run. Both are `probe-round207`'s idiom, back-ported.
// ---------------------------------------------------------------------------
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

/** `copyFileSync` for a SQLite file: the sidecars go too, or they replay. */
function copyCorpus(src: string, dest: string) {
  fs.rmSync(dest, { force: true });
  for (const side of ['-wal', '-shm']) fs.rmSync(dest + side, { force: true });
  fs.copyFileSync(src, dest);
}

// entity-resolve.ts:60 and entity-backfill.ts:361, verbatim. Module-private in
// both, so copied rather than imported.
const normalizeName = (name: string) => name.trim().toLowerCase();

const sha = (p: string) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);

const runCli = (args: string[]) => {
  try {
    return {
      code: 0,
      out: execFileSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }),
    };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

const planOf = (dbFile: string) => {
  const out = execFileSync('npx', ['tsx', SELF], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, R205_PLAN_DB: dbFile },
  });
  const line = out.trim().split('\n').filter((l) => l.startsWith('{')).pop()!;
  return JSON.parse(line) as {
    rows: {
      channelId: string;
      action: string;
      guessName: string;
      targetEntityId: string | null;
      sameNameEntityIds: string[] | null;
    }[];
    summary: any;
  };
};

/** A minimal corpus: one channel with an identity-claim opener, N seeded agents. */
function buildCorpus(file: string, entities: { id: string; name: string; created: string }[]) {
  for (const s of ['', '-wal', '-shm']) if (fs.existsSync(file + s)) fs.unlinkSync(file + s);
  const db = new Database(file);
  db.exec(`
    CREATE TABLE channels (id TEXT PRIMARY KEY, name TEXT NOT NULL, system_prompt TEXT,
      created_at TEXT NOT NULL, source TEXT, source_metadata TEXT, project_id TEXT);
    CREATE TABLE messages (id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, role TEXT NOT NULL,
      content TEXT NOT NULL, status TEXT, created_at TEXT NOT NULL, entity_id TEXT,
      original_timestamp TEXT, original_id TEXT);
    CREATE TABLE entities (id TEXT PRIMARY KEY, name TEXT NOT NULL, model TEXT, system_prompt TEXT,
      color TEXT, handle TEXT, created_at TEXT);
    CREATE TABLE channel_entities (channel_id TEXT NOT NULL, entity_id TEXT NOT NULL,
      added_at TEXT, PRIMARY KEY (channel_id, entity_id));
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT,
      source TEXT, source_metadata TEXT);
    CREATE TABLE message_artifacts (id TEXT PRIMARY KEY, message_id TEXT NOT NULL, type TEXT,
      tool_name TEXT, input_summary TEXT, content TEXT);
    INSERT INTO entities (id, name, created_at)
      VALUES ('default-entity','Claude','2020-01-01T00:00:00.000Z');
  `);
  const e = db.prepare(
    `INSERT INTO entities (id, name, model, created_at) VALUES (?,?,'claude-opus-5',?)`
  );
  for (const x of entities) e.run(x.id, x.name, x.created);
  db.prepare(`INSERT INTO channels (id, name, created_at, source) VALUES (?,?,?,'claude-ai')`).run(
    'ch-1',
    '3/14: the chat',
    '2026-03-14T00:00:00.000Z'
  );
  // `datetime('now')` form, NOT ISO-8601. Every production writer of
  // `channel_entities` omits the column and lets the schema default supply it
  // (`db/index.ts:76`), and `checkUndoRecord` refuses any other shape — Round
  // 175's G1/G2 guard. An ISO fixture here makes the apply write a record its
  // own undo then rejects, which is a fixture defect wearing a bug's clothes.
  db.prepare(`INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?,?,?)`).run(
    'ch-1',
    'default-entity',
    '2026-03-14 00:00:00'
  );
  const m = db.prepare(
    `INSERT INTO messages (id, channel_id, role, content, status, created_at, entity_id)
     VALUES (?,?,?,?,'complete',?,?)`
  );
  m.run(
    'm-u',
    'ch-1',
    'user',
    'You are Daedalus, and we are picking up where we left off.',
    '2026-03-14T00:00:01.000Z',
    null
  );
  for (let i = 0; i < 3; i++)
    m.run(`m-a${i}`, 'ch-1', 'assistant', 'ok', '2026-03-14T00:00:02.000Z', 'default-entity');
  db.close();
}

const OLD = 'aaaaaaaa-0000-0000-0000-000000000001';
const NEW = 'bbbbbbbb-0000-0000-0000-000000000002';

console.log('='.repeat(78));
console.log('Round 205 — the plan and the apply pick opposite ends of a duplicated name');
console.log('='.repeat(78));

// ---------------------------------------------------------------------------
console.log('\nArm A — two agents, one name: the plan names one and the apply writes the other');
// Case-variant on purpose — this is Daedalus's Round 204 §2 pair, in miniature.
const A = path.join(WORK, 'a-two-agents-one-name.db');
buildCorpus(A, [
  { id: OLD, name: 'Daedalus', created: '2024-01-01T00:00:00.000Z' },
  { id: NEW, name: 'daedalus', created: '2026-01-01T00:00:00.000Z' },
]);

const planA = planOf(A);
const rowA = planA.rows.find((r) => r.channelId === 'ch-1')!;
check('A1', rowA?.action === 'matched-by-name', 'the plan reuses rather than mints', rowA?.action);
check(
  'A2',
  rowA?.targetEntityId === NEW,
  'and it names the LAST row of the unordered scan',
  `${rowA?.targetEntityId?.slice(0, 8)} (NEW)`
);

const applyA = runCli([A, '--bases=identity-claim', '--apply']);
check('A3', applyA.code === 0, 'the apply exits 0', `code ${applyA.code}`);
const dbA = new Database(A, { readonly: true });
const boundA = (
  dbA.prepare(`SELECT entity_id AS e FROM channel_entities WHERE channel_id='ch-1'`).all() as {
    e: string;
  }[]
).map((r) => r.e);
const stampedA = (
  dbA
    .prepare(
      `SELECT DISTINCT entity_id AS e FROM messages WHERE channel_id='ch-1' AND role='assistant'`
    )
    .all() as { e: string }[]
).map((r) => r.e);
dbA.close();
check('A4', boundA.length === 1 && boundA[0] === OLD, 'the binding written is the FIRST row by created_at', `${boundA[0]?.slice(0, 8)} (OLD)`);
check('A5', stampedA.length === 1 && stampedA[0] === OLD, 'and every message stamp follows the write, not the plan', `${stampedA[0]?.slice(0, 8)}`);
check(
  'A6',
  rowA?.targetEntityId !== boundA[0],
  'so the agent the operator approved is not the agent that got the channel',
  `plan ${rowA?.targetEntityId?.slice(0, 8)} vs db ${boundA[0]?.slice(0, 8)}`
);

// ---------------------------------------------------------------------------
console.log('\nArm B — the sheet cannot show the operator which one it means');
const dryB = runCli([A.replace('.db', '-dry.db'), '--bases=identity-claim']);
const B = A.replace('.db', '-dry.db');
buildCorpus(B, [
  { id: OLD, name: 'Daedalus', created: '2024-01-01T00:00:00.000Z' },
  { id: NEW, name: 'daedalus', created: '2026-01-01T00:00:00.000Z' },
]);
const sheetB = runCli([B, '--bases=identity-claim']).out;
const matchLine = sheetB.split('\n').find((l) => /MATCHED-BY-NAME/.test(l)) ?? '';
check('B1', matchLine !== '', 'the sheet shows the row as a reuse', matchLine.trim().slice(0, 60));
check(
  'B2',
  // `matchLine !== ''` is the guard, not decoration. Without it this check
  // reads `!''.includes(…) && !''.includes(…)` → true, so it went GREEN once
  // Round 206 stopped emitting a MATCHED-BY-NAME row at all — reporting "the
  // divergence is not visible from the sheet" when there is no longer a
  // divergence to see. Second instance of the vacuous-subject trap in this
  // file; see arm E. A check whose subject can default to empty has to say so.
  matchLine !== '' &&
    !matchLine.includes(OLD.slice(0, 8)) &&
    !matchLine.includes(NEW.slice(0, 8)),
  'and it prints the name, never an id — the divergence is not visible from the sheet'
);
check(
  'B3',
  /reused agents \(1\): Daedalus/.test(sheetB),
  'the summary counts one reused agent where two carry the name'
);
check(
  'B4',
  !/collision/i.test(sheetB),
  'and no collision block fires — that check only covers the mint case'
);
void dryB;

// ---------------------------------------------------------------------------
console.log('\nArm C — the write is wrong-target, not unrecoverable');
const recs = fs.readdirSync(WORK).filter((f) => f.startsWith(path.basename(A) + '.backfill'));
check('C1', recs.length === 1, 'the apply wrote one undo record', String(recs.length));

// Round 209: when C1 fails there is no record to read, and reading it anyway
// threw out of the whole probe at this line — so arms D/E/F never ran and the
// corpus measurements were silently lost behind an arm-C regression. A probe
// reports its findings; it does not abort on one. C2–C5 degrade to OPEN.
if (recs.length !== 1) {
  open_('C2', 'no undo record to inspect — the apply refused the group and wrote none');
  open_('C3', 'undo not driveable without a record');
  open_('C4', 'binding-restored unverifiable without a record');
  open_('C5', 'stamps-restored unverifiable without a record');
} else {
  const rec = JSON.parse(fs.readFileSync(path.join(WORK, recs[0]), 'utf8'));
  check(
    'C2',
    rec.channels?.[0]?.toEntityId === OLD,
    'the record holds the id that was actually written, not the plan’s',
    rec.channels?.[0]?.toEntityId?.slice(0, 8)
  );
  const undoC = runCli([A, `--undo=${path.join(WORK, recs[0])}`]);
  check('C3', undoC.code === 0, 'the undo exits 0', `code ${undoC.code}`);
  const dbC = new Database(A, { readonly: true });
  const backC = (
    dbC.prepare(`SELECT entity_id AS e FROM channel_entities WHERE channel_id='ch-1'`).all() as {
      e: string;
    }[]
  ).map((r) => r.e);
  const stampC = (
    dbC
      .prepare(
        `SELECT DISTINCT entity_id AS e FROM messages WHERE channel_id='ch-1' AND role='assistant'`
      )
      .all() as { e: string }[]
  ).map((r) => r.e);
  dbC.close();
  check('C4', backC.length === 1 && backC[0] === 'default-entity', 'the binding goes back', backC[0]);
  check('C5', stampC.length === 1 && stampC[0] === 'default-entity', 'and so do the stamps');
}

// ---------------------------------------------------------------------------
console.log('\nArm D — xian’s March corpus, measured');
if (!fs.existsSync(CORPUS)) {
  open_('D0', `corpus not reachable from this seat (${CORPUS}) — arms D and E skipped`);
} else {
  const D = path.join(WORK, 'd-measure.db');
  copyCorpus(CORPUS, D);
  const dbD = new Database(D, { readonly: true });
  const ents = dbD
    .prepare(`SELECT rowid AS rid, id, name, created_at FROM entities ORDER BY rowid`)
    .all() as { rid: number; id: string; name: string; created_at: string }[];
  const chanCount = dbD.prepare(`SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?`);

  const groups = new Map<string, typeof ents>();
  for (const e of ents) {
    const k = normalizeName(e.name);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }
  const dupes = [...groups.entries()].filter(([, v]) => v.length > 1);
  const inAGroup = dupes.reduce((n, [, v]) => n + v.length, 0);

  measure('D1', `${ents.length} entities · ${groups.size} distinct normalized names · ${dupes.length} names carried by more than one`);
  check(
    'D2',
    inAGroup > ents.length / 2,
    'most of the entity table lives inside a duplicate-name group',
    `${inAGroup}/${ents.length}`
  );

  // For each group: which id does each resolver reach?
  let differ = 0;
  for (const [, v] of dupes) {
    const applyPick = [...v].sort((a, b) =>
      String(a.created_at).localeCompare(String(b.created_at))
    )[0];
    const planPick = v[v.length - 1]; // last row of a rowid-order table scan
    if (applyPick.id !== planPick.id) differ++;
  }
  check(
    'D3',
    differ === dupes.length,
    'every duplicate group resolves to a different id under the two rules',
    `${differ}/${dupes.length}`
  );

  const cos = ents.filter((e) => normalizeName(e.name) === 'chief of staff');
  check('D4', cos.length === 4, 'four entities in the corpus are named "Chief of Staff"', String(cos.length));
  const cosApply = [...cos].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const cosPlan = cos[cos.length - 1];
  const nApply = (chanCount.get(cosApply.id) as { n: number }).n;
  const nPlan = (chanCount.get(cosPlan.id) as { n: number }).n;
  measure(
    'D5',
    `"Chief of Staff": apply would reach ${cosApply.id.slice(0, 8)} (${nApply} channel(s)); the plan names ${cosPlan.id.slice(0, 8)} (${nPlan} channel(s))`
  );
  check(
    'D6',
    nApply === 0 && nPlan === 1,
    'and the one the apply would reach is the one with no history',
    `${nApply} vs ${nPlan}`
  );
  dbD.close();

  // -------------------------------------------------------------------------
  // RE-AIMED, Round 209. As written this arm pinned the *defect* Round 205
  // reported: a note reading `an agent named "chief of staff" already exists
  // (1e18ec34)` — singular, naming only the last row of an unordered scan,
  // where four entities carry the name. Round 206 fixed it at
  // `backfill-entity-bindings.mts:1201-1208`, citing Round 205 §4 by name.
  //
  // Left as it was, this arm scored the fix as three regressions — and E4 was
  // worse than wrong. Its subject was `notes[0] ?? ''`, and once E1's
  // `/already exists/` stopped matching the now-plural verb, `notes` was empty
  // and E4 tested the empty string: a GREEN check asserting the operator still
  // cannot see the other three, at the exact moment the sheet started naming
  // all four. Vacuous truth reads identically to a pass in this harness, which
  // is the trap `probe-round207` was written to avoid. The checks below assert
  // the corrected behaviour, and E4 now takes the note itself as its subject
  // so an empty match can only fail.
  console.log('\nArm E — the sheet’s note names every agent carrying the name');
  const E = path.join(WORK, 'e-sheet.db');
  copyCorpus(CORPUS, E);
  const sheetE = runCli([E, '--bases=identity-claim,role-title']).out;
  const notes = sheetE.split('\n').filter((l) => /already exist/.test(l));
  check('E1', notes.length === 1, 'exactly one existing-agent note on the sheet', String(notes.length));
  const noteE = notes[0] ?? '';
  check(
    'E2',
    /4 agents named "chief of staff" already exist/.test(noteE),
    'it is the Chief of Staff row, and it states the count'
  );
  const idsE = ['fc4a59b6', 'd064dae8', '45691e94', '1e18ec34'];
  check(
    'E3',
    noteE !== '' && idsE.every((id) => noteE.includes(id)),
    'and it names all four ids, not just the last row of the scan',
    idsE.filter((id) => noteE.includes(id)).length + '/4'
  );
  check(
    'E4',
    noteE !== '' && /\b4 agents\b/.test(noteE) && /does not reuse them/.test(noteE),
    'so the operator is told three more carry the name, and that none is reused'
  );

  // -------------------------------------------------------------------------
  console.log('\nArm F — reachability on THIS corpus, stated as the limit it is');
  const F = path.join(WORK, 'f-reach.db');
  copyCorpus(CORPUS, F);
  const dbF = new Database(F, { readonly: true });
  const nProjects = (dbF.prepare(`SELECT COUNT(*) AS n FROM projects`).get() as { n: number }).n;
  dbF.close();
  check('F1', nProjects === 0, 'the corpus has no projects, so the project-name basis cannot fire', String(nProjects));
  const planF = planOf(F);
  const reusing = planF.rows.filter((r) => r.action === 'matched-by-name');
  check(
    'F2',
    reusing.length === 0,
    'and no channel produces an identity-claim guess, so no row reuses by name today',
    `${reusing.length} matched-by-name rows`
  );
  open_(
    'F3',
    'therefore nothing here is a live mis-write against this backup — it is a defect that ' +
      'fires on the first corpus where a reusing basis meets a duplicated name, and 66 of ' +
      'these 68 names are duplicated'
  );
}

// ---------------------------------------------------------------------------
console.log('\nArm Z — nothing written outside .testdata/');
if (fs.existsSync(CORPUS)) {
  check('Z1', sha(CORPUS) === 'c2295121bbdfdbbb', 'the source corpus is byte-identical', sha(CORPUS));
} else {
  open_('Z1', 'corpus not reachable — hash not checked');
}
const dirty = execFileSync('git', ['status', '--short', '--', 'packages/'], {
  cwd: ROOT,
  encoding: 'utf8',
});
check('Z2', dirty.trim() === '', 'nothing under packages/ was touched', dirty.trim() || 'clean');

console.log('\n' + '='.repeat(78));
console.log(`${checks} checks · ${failed} failed · ${open} open · ${meas} measurements`);
console.log('='.repeat(78));
