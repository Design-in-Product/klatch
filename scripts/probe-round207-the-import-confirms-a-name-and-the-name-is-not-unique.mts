/**
 * Round 207 probe — Theseus, 2026-09-14 START fire.
 *
 * Two jobs, in order.
 *
 * **1. Round 205 re-vehicled against Round 206's fix (arms A, B).** My
 * `probe-round205` encodes the defect, so against Daedalus's fix its
 * assertions must flip. He said so in his §5 and deliberately left the
 * re-aiming to me. Arms A/B here are the same fixtures with the assertions
 * inverted: a regression suite over the fix rather than a report of the defect.
 *
 * **2. Daedalus's §7.1, driven (arms C, D, E).** He closed the backfill's
 * duplicate-name pick and left the *import* path's open:
 *
 *   > `resolveImportEntity` with `reuseByName` on still takes the first of
 *   > several. The backfill no longer leans on that; an import does.
 *
 * Arms C–E drive the real import route in-process and measure what an operator
 * can see from their seat.
 *
 * Run:  npx tsx scripts/probe-round207-the-import-confirms-a-name-and-the-name-is-not-unique.mts
 *
 * Zero model calls. Writes only under the gitignored `.testdata/r207-probe`,
 * **which it clears on entry** — see the note on WORK below, which is a finding
 * of this round against my own previous instrument.
 *
 * Arms D and E read xian's March backup read-only if it is present and degrade
 * to a single line if it is not, so A–C reproduce the whole finding on any
 * machine with no corpus at all.
 */

import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(ROOT, '.testdata', 'r207-probe');
const CORPUS = '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const SELF = fileURLToPath(import.meta.url);

// ---------------------------------------------------------------------------
// Child mode, as in Round 205: `db/index.ts` resolves DB_PATH once at import
// time from KLATCH_DB, so a plan against a chosen file needs a fresh process.
// ---------------------------------------------------------------------------
if (process.env.R207_PLAN_DB) {
  process.env.KLATCH_DB = process.env.R207_PLAN_DB;
  const { planEntityBackfill } = await import('../packages/server/src/db/entity-backfill.js');
  const plan = planEntityBackfill({ bases: ['identity-claim'] });
  const rows = plan.rows
    .filter((r) => r.guessName)
    .map((r) => ({
      channelId: r.channelId,
      action: r.action,
      guessName: r.guessName,
      skipReason: (r as any).skipReason ?? null,
      targetEntityId: r.targetEntityId ?? null,
      sameNameEntityIds: (r as any).sameNameEntityIds ?? null,
    }));
  console.log(JSON.stringify({ rows, summary: plan.summary }));
  process.exit(0);
}

const normalizeName = (name: string) => name.trim().toLowerCase();

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
    env: { ...process.env, R207_PLAN_DB: dbFile },
  });
  const line = out.trim().split('\n').filter((l) => l.startsWith('{')).pop()!;
  return JSON.parse(line) as {
    rows: {
      channelId: string;
      action: string;
      guessName: string;
      skipReason: string | null;
      targetEntityId: string | null;
      sameNameEntityIds: string[] | null;
    }[];
    summary: Record<string, unknown>;
  };
};

let pass = 0;
let fail = 0;
let open = 0;
const check = (id: string, ok: boolean, what: string, detail = '') => {
  ok ? pass++ : fail++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${id} · ${what}${detail ? ` — ${detail}` : ''}`);
};
const open_ = (id: string, what: string, detail = '') => {
  open++;
  console.log(`  [OPEN] ${id} · ${what}${detail ? ` — ${detail}` : ''}`);
};
const meas = (id: string, what: string) => console.log(`  [MEAS] ${id}: ${what}`);

// ---------------------------------------------------------------------------
// WORK is CLEARED, not merely created. `probe-round205` used
// `mkdirSync({recursive:true})` and never cleared, and both consequences bit on
// 2026-09-14:
//
//   1. A stale `f-reach.db-wal` (4,276,592 B from the previous night) survived
//      `copyFileSync` of the main file and replayed into the fresh pages, so
//      the second run died with SQLITE_CORRUPT in an unrelated arm. This is
//      Round 191's finding, and Daedalus hit the same thing from the other side
//      in his Round 206 §6.
//   2. Worse: arm C's `readdirSync(WORK).filter(...)[0]` found the PREVIOUS
//      run's undo record, so five checks reported green about a run that had
//      not happened. A probe that can read its own last run is a probe that can
//      report a fix as broken, or a defect as fixed, with neither being so.
//
// Clearing the whole tree — sidecars, snapshots and undo records with it — is
// the only form of this that does not have to be remembered file by file.
// ---------------------------------------------------------------------------
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

function buildCorpus(file: string, entities: { id: string; name: string; created: string }[]) {
  fs.rmSync(file, { force: true });
  for (const side of ['-wal', '-shm']) fs.rmSync(file + side, { force: true });
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
  // `datetime('now')` form, NOT ISO-8601 — Round 205's own fixture defect.
  db.prepare(`INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?,?,?)`).run(
    'ch-1',
    'default-entity',
    '2026-03-14 00:00:00'
  );
  const m = db.prepare(
    `INSERT INTO messages (id, channel_id, role, content, status, created_at, entity_id)
     VALUES (?,?,?,?,'complete',?,?)`
  );
  m.run('m-u', 'ch-1', 'user', 'You are Daedalus, and we are picking up where we left off.',
    '2026-03-14T00:00:01.000Z', null);
  for (let i = 0; i < 3; i++)
    m.run(`m-a${i}`, 'ch-1', 'assistant', 'ok', '2026-03-14T00:00:02.000Z', 'default-entity');
  db.close();
}

const OLD = 'aaaaaaaa-0000-0000-0000-000000000001';
const NEW = 'bbbbbbbb-0000-0000-0000-000000000002';

console.log('='.repeat(78));
console.log('Round 207 — the import confirms a name, and the name is not unique');
console.log('='.repeat(78));

// ---------------------------------------------------------------------------
console.log('\nArm A — Round 205 re-vehicled: the plan now refuses the ambiguous name');
// Round 205's arm A fixture, unchanged. Every assertion below is the inverse of
// the one it replaces.
const A = path.join(WORK, 'a-two-agents-one-name.db');
buildCorpus(A, [
  { id: OLD, name: 'Daedalus', created: '2024-01-01T00:00:00.000Z' },
  { id: NEW, name: 'daedalus', created: '2026-01-01T00:00:00.000Z' },
]);

const planA = planOf(A);
const rowA = planA.rows.find((r) => r.channelId === 'ch-1')!;
check('A1', rowA?.action === 'skipped', 'the plan skips where Round 205 had it reuse', rowA?.action);
check('A2', rowA?.skipReason === 'ambiguous-name', 'and the reason names the ambiguity', String(rowA?.skipReason));
check('A3', rowA?.targetEntityId === null, 'no target is pinned, so there is nothing for an apply to carry',
  String(rowA?.targetEntityId));
check(
  'A4',
  Array.isArray(rowA?.sameNameEntityIds) &&
    rowA!.sameNameEntityIds!.length === 2 &&
    rowA!.sameNameEntityIds!.includes(OLD) &&
    rowA!.sameNameEntityIds!.includes(NEW),
  'the plan carries BOTH ids where Round 205 carried the last one, singular',
  `${(rowA?.sameNameEntityIds ?? []).map((i) => i.slice(0, 8)).join(', ')}`
);

const applyA = runCli([A, '--bases=identity-claim', '--apply']);
check('A5', applyA.code === 0, 'the apply exits 0', `code ${applyA.code}`);
const dbA = new Database(A, { readonly: true });
const boundA = (
  dbA.prepare(`SELECT entity_id AS e FROM channel_entities WHERE channel_id='ch-1'`).all() as { e: string }[]
).map((r) => r.e);
const stampedA = (
  dbA.prepare(`SELECT DISTINCT entity_id AS e FROM messages WHERE channel_id='ch-1' AND role='assistant'`)
    .all() as { e: string }[]
).map((r) => r.e);
dbA.close();
check('A6', boundA.length === 1 && boundA[0] === 'default-entity',
  'and it writes nothing: the binding is where it started', boundA[0]);
check('A7', stampedA.length === 1 && stampedA[0] === 'default-entity',
  'as are the stamps — Round 205 had both on the OLD id', stampedA[0]);
const recsA = fs.readdirSync(WORK).filter((f) => f.startsWith(path.basename(A) + '.backfill'));
check('A8', recsA.length === 0, 'and no undo record, because there is nothing to undo', String(recsA.length));

// ---------------------------------------------------------------------------
console.log('\nArm B — the sheet says so, where Round 205 had it silently endorse a pick');
const B = path.join(WORK, 'b-sheet.db');
buildCorpus(B, [
  { id: OLD, name: 'Daedalus', created: '2024-01-01T00:00:00.000Z' },
  { id: NEW, name: 'daedalus', created: '2026-01-01T00:00:00.000Z' },
]);
const sheetB = runCli([B, '--bases=identity-claim']).out;
check('B1', !/MATCHED-BY-NAME/.test(sheetB),
  'no MATCHED-BY-NAME row — Round 205 B1 asserted the opposite');
check('B2', !/reused agents \(1\): Daedalus/.test(sheetB),
  'and the summary no longer counts a reuse where two carry the name');
const noteB = sheetB.split('\n').filter((l) => /↳|note:/.test(l));
check(
  'B3',
  noteB.some((l) => l.includes(OLD.slice(0, 8))) && noteB.some((l) => l.includes(NEW.slice(0, 8))),
  'both ids reach the sheet — Round 205 B2 was that it prints the name, never an id',
  noteB.map((l) => l.trim()).join(' | ').slice(0, 110)
);
check('B4', /ambiguous|already exist|more than one|2 agents/i.test(sheetB),
  'and the operator is told why, in the sheet\'s own voice');

// ---------------------------------------------------------------------------
console.log('\nArm C — Daedalus\'s §7.1: the import path still takes the first of several');
// Set KLATCH_DB before the first dynamic import of any db module — `db/index.ts`
// reads it once, at module load.
const C = path.join(WORK, 'c-import.db');
fs.rmSync(C, { force: true });
process.env.KLATCH_DB = C;

const { Hono } = await import('hono');
const { getDb } = await import('../packages/server/src/db/index.js');
const q = await import('../packages/server/src/db/queries.js');
const { resolveImportEntity } = await import('../packages/server/src/import/entity-resolve.js');
const { importRoutes } = await import('../packages/server/src/routes/import.js');

const dbC = getDb();
// Two agents, one name. Same shape as arm A — the ids and the created_at order
// are chosen so "first" and "last" are unambiguous and visibly different.
const insC = dbC.prepare(
  `INSERT INTO entities (id, name, model, system_prompt, color, created_at) VALUES (?,?,?,'','#888',?)`
);
insC.run(OLD, 'Daedalus', 'claude-opus-5', '2024-01-01T00:00:00.000Z');
insC.run(NEW, 'daedalus', 'claude-opus-5', '2026-01-01T00:00:00.000Z');

const app = new Hono();
app.route('/api', importRoutes);
const postImport = (body: unknown) =>
  app.request('/api/import/claude-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const sessionFile = (id: string, opener: string) => {
  const p = path.join(WORK, `${id}.jsonl`);
  const base = {
    parentUuid: null as string | null,
    userType: 'external',
    cwd: '/Users/test/r207',
    sessionId: id,
    version: '2.1.19',
    gitBranch: 'main',
    slug: 'r207',
  };
  const lines = [
    JSON.stringify({ ...base, type: 'user', message: { role: 'user', content: opener },
      uuid: `${id}-u`, timestamp: '2026-03-14T10:00:00.000Z' }),
    JSON.stringify({ ...base, parentUuid: `${id}-u`, type: 'assistant',
      message: { model: 'claude-opus-5', id: `msg-${id}`, type: 'message', role: 'assistant',
        content: [{ type: 'text', text: 'Picking it up.' }], stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 } },
      uuid: `${id}-a`, timestamp: '2026-03-14T10:00:01.000Z' }),
  ];
  fs.writeFileSync(p, lines.join('\n') + '\n');
  return p;
};

const resC = await postImport({
  sessionPath: sessionFile('r207-dup', 'You are Daedalus, and we are picking up where we left off.'),
  entityName: 'Daedalus',
});
const bodyC: any = await resC.json();
check('C1', resC.status === 201, 'the import succeeds', `status ${resC.status}`);
check('C2', bodyC.entityDisposition === 'matched-by-name',
  'it reuses by name — no refusal, where the backfill now refuses this exact shape',
  String(bodyC.entityDisposition));
check('C3', bodyC.entityId === OLD,
  'and it binds the FIRST row by (created_at, id), not a choice anyone made',
  `${String(bodyC.entityId).slice(0, 8)} (OLD) of [${OLD.slice(0, 8)}, ${NEW.slice(0, 8)}]`);

const boundC = (
  dbC.prepare(`SELECT entity_id AS e FROM channel_entities WHERE channel_id=?`).all(bodyC.channelId) as
    { e: string }[]
).map((r) => r.e);
check('C4', boundC.length === 1 && boundC[0] === OLD,
  'the channel really is on that entity, not merely reported so', boundC.join(','));

// The control: the same call with the name made unique. If the response can't be
// told apart, the ambiguity is not on the wire either.
const uniqueName = 'Ariadne';
const resCtl = await postImport({
  sessionPath: sessionFile('r207-uniq', 'You are Ariadne, and we are picking up where we left off.'),
  entityName: uniqueName,
});
const bodyCtl: any = await resCtl.json();
check(
  'C5',
  bodyCtl.entityDisposition === 'minted' || bodyCtl.entityDisposition === 'matched-by-name',
  'the control import resolves too',
  String(bodyCtl.entityDisposition)
);
const shapeOf = (b: any) => Object.keys(b).filter((k) => k.startsWith('entity')).sort().join(',');
check(
  'C6',
  shapeOf(bodyC) === shapeOf(bodyCtl),
  'the ambiguous response carries no field the unambiguous one does not — nothing on the wire says "one of several"',
  `${shapeOf(bodyC)} vs ${shapeOf(bodyCtl)}`
);

// ---------------------------------------------------------------------------
console.log('\nArm D — what the operator confirms, and what they are shown afterwards');
const dialog = fs.readFileSync(
  path.join(ROOT, 'packages/client/src/components/ImportDialog.tsx'), 'utf8'
);
check(
  'D1',
  /entityName: confirmedName/.test(dialog) && !/entityId: *(sessionEntity|confirmed)/.test(dialog),
  'the confirm step sends a NAME and never an id — so it cannot pin what the backfill now pins'
);
check(
  'D2',
  /→ added to \{conv\.entityName\}/.test(dialog),
  'and the result line prints `conv.entityName`'
);
// `conv.entityName` is `confirmedName` — what the user typed (:411) — not
// anything read back out of the entity that was bound. Driven: bind to an
// entity whose stored name differs from the typed string and see whether the
// difference can surface.
const storedName = q.getEntity(bodyC.entityId)?.name;
check(
  'D3',
  storedName === 'Daedalus',
  'the entity actually bound is the one named exactly as typed here (so D4 is about the mechanism, not this case)',
  String(storedName)
);
const resD = await postImport({
  sessionPath: sessionFile('r207-case', 'You are Daedalus, and we are picking up where we left off.'),
  entityName: 'DAEDALUS',
});
const bodyD: any = await resD.json();
check(
  'D4',
  bodyD.entityId === OLD && q.getEntity(bodyD.entityId)?.name === 'Daedalus',
  'typing DAEDALUS binds an entity stored as "Daedalus" — the line the operator reads back is their own input, not the record',
  `typed DAEDALUS → ${String(bodyD.entityId).slice(0, 8)} named "${q.getEntity(bodyD.entityId)?.name}"`
);
open_(
  'D5',
  'so from the import seat the divergence Round 205 fixed is still fully invisible: the field is a name, ' +
    'the confirmation echoes the typed name, and the id is on the wire but not on the screen'
);

// ---------------------------------------------------------------------------
console.log('\nArm E — the determinism Daedalus added, measured from the import seat');
// His §4: `ORDER BY created_at ASC, e.id ASC`. `createEntity` stamps
// milliseconds, so same-millisecond mints are the case the tiebreak is for.
const sameMs = '2026-05-05T05:05:05.005Z';
const T1 = 'cccccccc-0000-0000-0000-000000000003';
const T2 = 'dddddddd-0000-0000-0000-000000000004';
insC.run(T2, 'Theseus', 'claude-opus-5', sameMs); // inserted second, sorts second by id
insC.run(T1, 'theseus', 'claude-opus-5', sameMs); // inserted first-by-id, later physically
const picks = new Set<string>();
for (let i = 0; i < 5; i++) {
  picks.add(String(resolveImportEntity({ entityName: 'Theseus' }).entityId));
}
check('E1', picks.size === 1, 'repeated resolution of a same-millisecond pair is stable', `${picks.size} distinct`);
check('E2', [...picks][0] === T1, 'and it is the id-ASC winner, which is what makes it stable',
  `${[...picks][0]?.slice(0, 8)} (T1) vs ${T2.slice(0, 8)} (T2)`);
open_(
  'E3',
  'stable is not correct — this is Daedalus\'s own §4 caveat holding from the import seat: ' +
    'five identical arbitrary answers, none of them chosen by anyone'
);

// ---------------------------------------------------------------------------
console.log('\nArm F — is any of this reachable on xian\'s March corpus?');
if (!fs.existsSync(CORPUS)) {
  meas('F0', `corpus absent at ${CORPUS} — arms A–E above carry the finding without it`);
} else {
  const F = path.join(WORK, 'f-corpus.db');
  fs.copyFileSync(CORPUS, F);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(CORPUS)).digest('hex').slice(0, 16);
  const dbF = new Database(F, { readonly: true });
  const ents = dbF.prepare(`SELECT id, name FROM entities`).all() as { id: string; name: string }[];
  const byName = new Map<string, string[]>();
  for (const e of ents) {
    const k = normalizeName(e.name);
    byName.set(k, [...(byName.get(k) ?? []), e.id]);
  }
  const dupNames = [...byName.entries()].filter(([, ids]) => ids.length > 1);
  meas('F1', `corpus ${sha} · ${ents.length} entities · ${dupNames.length} names carried by more than one`);

  // The reachability question is not "are there duplicates" — Round 205 answered
  // that — but "can the import's own guesser propose one of these names?" The
  // import route calls guessEntityName(firstUserMessage, projectName) with no
  // basis flag, so this is the guesser as an import actually gets it.
  const openers = dbF.prepare(`
    SELECT c.id AS cid, (
      SELECT m.content FROM messages m
      WHERE m.channel_id = c.id AND m.role = 'user'
      ORDER BY m.created_at ASC LIMIT 1
    ) AS opener
    FROM channels c
  `).all() as { cid: string; opener: string | null }[];
  dbF.close();

  const { guessEntityName } = await import('../packages/server/src/import/entity-guess.js');
  let guessed = 0;
  const bases = new Map<string, number>();
  const hitsDup: string[] = [];
  for (const o of openers) {
    const g = guessEntityName(o.opener ?? undefined, undefined);
    if (!g?.name) continue;
    guessed++;
    bases.set(String(g.basis), (bases.get(String(g.basis)) ?? 0) + 1);
    const ids = byName.get(normalizeName(g.name));
    if (ids && ids.length > 1) hitsDup.push(`"${g.name}" → ${ids.length} entities`);
  }
  meas('F2', `${openers.length} channels · ${guessed} produce a name guess through the import's own call · bases ${[...bases].map(([b, n]) => `${b}:${n}`).join(' ')}`);
  // I aimed this the other way first and was wrong. Round 205 recorded that on
  // this corpus the *backfill* has 0 `matched-by-name` rows under its default
  // basis, and I expected the import to inherit that. It does not, for a reason
  // that is the point of this arm: `guessEntityName` takes **no basis filter**.
  // The backfill gates `role-title` behind `--bases` (Round 203) and now
  // refuses ambiguity on top; the import route calls the guesser raw at :140
  // and pre-fills whatever comes back.
  check(
    'F3',
    hitsDup.length > 0,
    'a guess the import would pre-fill DOES land on a duplicated name here — the backfill\'s default basis reaches 0 rows on this same corpus',
    hitsDup.join('; ') + ` (of ${guessed})`
  );
  check(
    'F4',
    (bases.get('role-title') ?? 0) === guessed,
    'and every one of them is role-title — the basis the backfill will not run without an explicit flag',
    `role-title ${bases.get('role-title') ?? 0} of ${guessed}`
  );
  const shaAfter = crypto.createHash('sha256').update(fs.readFileSync(CORPUS)).digest('hex').slice(0, 16);
  check('F5', sha === shaAfter, 'the corpus is byte-identical after this arm', `${sha} → ${shaAfter}`);
}

// ---------------------------------------------------------------------------
console.log('\nArm G — the live claude-code corpus, through the real browse endpoint');
// Arm F measures the guesser against March prose. This measures the actual
// path: `GET /import/claude-code/sessions` is what fills the import dialog, and
// `entityGuess` (:140) is what pre-fills the confirm field. Needs a machine with
// a live Claude Code install; reports one line and no checks where absent.
const PROJECTS_DIR = path.join(process.env.HOME ?? '', '.claude', 'projects');
if (!fs.existsSync(PROJECTS_DIR)) {
  meas('G0', `no live Claude Code corpus at ${PROJECTS_DIR} — arms A–F carry the finding without it`);
} else {
  const resG = await app.request('/api/import/claude-code/sessions');
  if (resG.status !== 200) {
    meas('G0', `browse returned ${resG.status} — not measured`);
  } else {
    const bodyG: any = await resG.json();
    const basisG = new Map<string, number>();
    const nameCount = new Map<string, number>();
    let sessions = 0;
    for (const p of bodyG.projects ?? []) {
      for (const s of p.sessions ?? []) {
        sessions++;
        basisG.set(String(s.entityGuess?.basis ?? 'none'), (basisG.get(String(s.entityGuess?.basis ?? 'none')) ?? 0) + 1);
        if (s.entityGuess?.name) nameCount.set(s.entityGuess.name, (nameCount.get(s.entityGuess.name) ?? 0) + 1);
      }
    }
    const shared = [...nameCount.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
    meas('G1', `${bodyG.totalProjects} projects · ${sessions} sessions · bases ${[...basisG].map(([b, n]) => `${b}:${n}`).join(' ')}`);
    meas('G2', `${nameCount.size} distinct proposed names · ${shared.length} proposed for more than one session · top: ${shared.slice(0, 5).map(([n, c]) => `${n}×${c}`).join(', ')}`);
    check(
      'G3',
      shared.length > 0,
      'the live corpus proposes the SAME name across many sessions — reuse-by-name is load-bearing here, not incidental',
      `${shared.length} repeated names`
    );
    // This is the number that decides Daedalus's §7.1. Refusal is what the
    // backfill does; here refusal would cost the operator the import, on the
    // path where reuse is the feature working as designed.
    const worst = shared[0];
    check(
      'G4',
      (worst?.[1] ?? 0) > 50,
      'and the blast radius of ONE duplicate entity is the whole run of that name, silently redirected',
      worst ? `a second entity named "${worst[0]}" would arbitrarily capture ${worst[1]} sessions` : 'n/a'
    );
    open_(
      'G5',
      'so the answer to his §7.1 is NOT the backfill\'s answer: refusing an ambiguous name here refuses ' +
        'the import. The confirm step is the place, and the plumbing exists — `entityId` already wins ' +
        'over `entityName` (import.ts:206) and resolves `bound-existing`. It is a picker, not a refusal.'
    );
  }
}

// ---------------------------------------------------------------------------
console.log('\nArm Z — nothing outside .testdata was written');
const dirty = execFileSync('git', ['status', '--porcelain', 'packages/'], { cwd: ROOT, encoding: 'utf8' }).trim();
check('Z1', dirty === '', 'packages/ is clean', dirty ? dirty.split('\n').length + ' file(s)' : 'clean');

console.log('\n' + '-'.repeat(78));
console.log(`${pass + fail} checks · ${fail} failed · ${open} open`);
process.exit(fail === 0 ? 0 : 1);
