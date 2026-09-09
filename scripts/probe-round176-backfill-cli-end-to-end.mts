/**
 * Round 176 — drive the entity-backfill CLI end to end, as a user would.
 *
 * Daedalus shipped `packages/server/src/db/entity-backfill.ts` +
 * `scripts/backfill-entity-bindings.mts` on 2026-09-09 and disclaimed exactly
 * one layer in his memo:
 *
 *   "The CLI path — snapshot, apply, undo record round trip — is exercised on
 *    that fixture and by hand, not by an automated test; the module underneath
 *    it is unit-tested, the wiring above it is not."
 *
 * That layer is this seat. And it matters more than usual because the next
 * thing that happens to this tool is **xian running one command against the
 * only klatch.db anyone cares about.** Every arm below runs the real script as
 * a real subprocess (real argv, real `process.env.KLATCH_DB` resolution, real
 * `db.backup()`) against a real file-backed database built by the real
 * `importSession`. Nothing here mocks anything.
 *
 * Verification is deliberately NOT done through the code under test: after each
 * subprocess the probe opens the database with its own read-only better-sqlite3
 * handle and asserts in raw SQL. The one exception is arm D, which must call
 * the real `getEntityTranscript` because "the agent can see its own answers" is
 * a claim about that function; it runs in its own subprocess (role=transcript).
 *
 * Zero model calls. Zero API spend. `klatch.db` is never opened — the fixture
 * lives in `.testdata/r176/` (gitignored).
 *
 *   npx tsx scripts/probe-round176-backfill-cli-end-to-end.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r176');
const DB = path.join(DATA, 'klatch.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const SELF = fileURLToPath(import.meta.url);

const DEFAULT_ENTITY_ID = 'default-entity';

// ── self-spawned roles ────────────────────────────────────────────────────────
// Both roles import the server's db modules, which resolve KLATCH_DB once at
// import time. Running them in their own process is what keeps the probe's own
// handle out of the way of the CLI's snapshot.

if (process.env.R176_ROLE === 'build') {
  await buildFixture();
  process.exit(0);
}
if (process.env.R176_ROLE === 'transcript') {
  const { getEntityTranscript } = await import('../packages/server/src/db/queries.js');
  const rows = getEntityTranscript(process.env.R176_ENTITY!);
  console.log(
    JSON.stringify(
      rows.map((r: any) => ({ role: r.role, content: String(r.content).slice(0, 60) }))
    )
  );
  process.exit(0);
}

// ── fixture ───────────────────────────────────────────────────────────────────

interface Seeded {
  [key: string]: string; // label -> channel id
}

async function buildFixture(): Promise<void> {
  const { importSession, createProject, createEntity } = await import(
    '../packages/server/src/db/queries.js'
  );

  const turns = (n: number, opener: string) =>
    Array.from({ length: n }, (_, i) => ({
      userText: i === 0 ? opener : `follow-up ${i}`,
      assistantText: `assistant answer ${i}`,
      timestamp: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
      originalId: crypto.randomUUID(),
    }));

  const seeded: Seeded = {};
  const mk = (
    label: string,
    name: string,
    source: 'claude-code' | 'claude-ai' | 'klatch',
    opener: string,
    n = 3,
    projectId?: string
  ) => {
    const r = importSession({
      channelName: name,
      source,
      sourceMetadata: { probe: 'r176' },
      turns: turns(n, opener),
      projectId,
    });
    seeded[label] = r.channelId;
    return r.channelId;
  };

  // An agent that already exists, so one channel reuses rather than mints.
  const sable = createEntity('Sable', 'claude-opus-5', '', '#888888');

  mk('wren', 'wren-session', 'claude-code', 'You are Wren, a careful reviewer.');
  mk('tarn-a', 'tarn-one', 'claude-code', 'You are Tarn. Start here.');
  mk('tarn-b', 'tarn-two', 'claude-ai', 'You are Tarn, again.');
  mk('reuse', 'sable-session', 'claude-code', 'You are Sable and you keep notes.');
  mk('claude', 'claude-session', 'claude-ai', 'You are Claude, an AI assistant.');
  mk('noguess', 'anon-session', 'claude-code', 'hey can you look at this file');

  const proj = createProject('Klatchwork', '', 'claude-code', {});
  mk('project', 'project-session', 'claude-code', 'please review the diff', 3, proj.id);

  const multi = mk('multi', 'multi-session', 'claude-code', 'You are Wren, second seat.');
  const { getDb } = await import('../packages/server/src/db/index.js');
  getDb()
    .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
    .run(multi, sable.id);

  // Out of scope by source: reported as `excluded`, never touched.
  mk('native-ish', 'klatch-source-session', 'klatch', 'You are Wren, in a package.');

  // P3: assistant rows imported before `messages.entity_id` existed. Nothing in
  // the app writes these today, which is exactly why they need making by hand —
  // they are the population the schema predicts and the corpus may or may not
  // contain. One per candidate channel; the rest stay P2.
  const db = getDb();
  for (const label of ['wren', 'tarn-a', 'tarn-b', 'reuse', 'claude', 'multi']) {
    const oldest = db
      .prepare(
        `SELECT id FROM messages WHERE channel_id = ? AND role = 'assistant'
          ORDER BY rowid ASC LIMIT 1`
      )
      .get(seeded[label]) as { id: string };
    db.prepare('UPDATE messages SET entity_id = NULL WHERE id = ?').run(oldest.id);
  }

  fs.writeFileSync(path.join(DATA, 'seeded.json'), JSON.stringify(seeded, null, 2));
}

// ── harness ───────────────────────────────────────────────────────────────────

interface Check {
  arm: string;
  name: string;
  ok: boolean | 'open';
  detail: string;
}
const checks: Check[] = [];
const measurements: string[] = [];

function check(arm: string, name: string, ok: boolean, detail: string) {
  checks.push({ arm, name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${arm} · ${name} — ${detail}`);
}
function open_(arm: string, name: string, detail: string) {
  checks.push({ arm, name, ok: 'open', detail });
  console.log(`  [OPEN] ${arm} · ${name} — ${detail}`);
}
function measure(text: string) {
  measurements.push(text);
  console.log(`  [MEAS] ${text}`);
}

function cli(args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync('npx', ['tsx', CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R176_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}

function sha(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * A consistent copy of a live SQLite database.
 *
 * `fs.copyFileSync` is wrong here and the probe's first run proved it: the
 * fixture is in WAL mode, so a byte copy of `klatch.db` alone can be missing
 * every table. Same trap the CLI itself avoids by using `db.backup()`, and the
 * same one my 8/12 note on `inspect-klatch-db.mjs` recorded.
 */
async function snapshotTo(dest: string): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(dest + s, { force: true });
  const src = new Database(DB, { readonly: true, fileMustExist: true });
  await src.backup(dest);
  src.close();
}

/** Put the fixture back to its as-built state, sidecars included. */
async function restorePristine(): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(DB + s, { force: true });
  const src = new Database(PRISTINE, { readonly: true, fileMustExist: true });
  await src.backup(DB);
  src.close();
  for (const f of [...backupsBeside(), ...recordsBeside()]) fs.rmSync(path.join(DATA, f), { force: true });
}

function ro<T>(fn: (db: any) => T): T {
  const db = new Database(DB, { readonly: true, fileMustExist: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

/** The three tables the undo claim is about, dumped for row-for-row comparison. */
function dumpTables(file: string): string {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try {
    const parts: string[] = [];
    for (const [table, order] of [
      ['messages', 'id'],
      ['channel_entities', 'channel_id, entity_id'],
      ['entities', 'id'],
    ] as const) {
      const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
      parts.push(`-- ${table}\n${rows.map((r) => JSON.stringify(r)).join('\n')}`);
    }
    return parts.join('\n');
  } finally {
    db.close();
  }
}

function backupsBeside(): string[] {
  return fs.readdirSync(DATA).filter((f) => f.startsWith('klatch.db.backup-backfill-'));
}
function recordsBeside(): string[] {
  return fs.readdirSync(DATA).filter((f) => /^klatch\.db\.backfill-.*\.json$/.test(f));
}

// ── run ───────────────────────────────────────────────────────────────────────

console.log('\n=== Round 176 — backfill CLI, driven end to end ===\n');

fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });

console.log('Building fixture (real importSession, file-backed DB)...');
execFileSync('npx', ['tsx', SELF], {
  cwd: ROOT,
  env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB },
  stdio: 'inherit',
});
const seeded: Seeded = JSON.parse(fs.readFileSync(path.join(DATA, 'seeded.json'), 'utf8'));
const PRISTINE = path.join(DATA, 'pristine.db');
await snapshotTo(PRISTINE);

const seededCount = ro((db) =>
  db
    .prepare(
      `SELECT COUNT(*) AS n FROM channels c JOIN channel_entities ce ON ce.channel_id = c.id
        WHERE ce.entity_id = ? AND c.source IN ('claude-code','claude-ai')`
    )
    .get(DEFAULT_ENTITY_ID)
);
measure(`fixture: ${seededCount.n} in-scope candidate channels bound to the default`);

// ── Arm A — a dry run must not touch the database it reports on ──────────────
console.log('\nArm A — dry run writes nothing');
const beforeHash = sha(DB);
const beforeMtime = fs.statSync(DB).mtimeMs;
const beforeDump = dumpTables(DB);
const beforeEntities = ro((db) => db.prepare('SELECT COUNT(*) AS n FROM entities').get().n);
const tmpBefore = fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('klatch-backfill-dryrun-'));

const dry = cli([DB]);

check('A', 'dry run exits 0', dry.code === 0, `exit ${dry.code}${dry.code ? ` · stderr: ${dry.err.slice(0, 200)}` : ''}`);
check('A', 'database bytes unchanged', sha(DB) === beforeHash, sha(DB) === beforeHash ? 'sha256 identical' : 'FILE CHANGED');
check('A', 'mtime unchanged', fs.statSync(DB).mtimeMs === beforeMtime, `${beforeMtime} → ${fs.statSync(DB).mtimeMs}`);
check('A', 'every row unchanged', dumpTables(DB) === beforeDump, 'messages + channel_entities + entities dumps identical');
check(
  'A',
  'no entity minted',
  ro((db) => db.prepare('SELECT COUNT(*) AS n FROM entities').get().n) === beforeEntities,
  `entities ${beforeEntities} → ${ro((db) => db.prepare('SELECT COUNT(*) AS n FROM entities').get().n)}`
);
check('A', 'no backup left beside the DB', backupsBeside().length === 0, `found ${backupsBeside().length}`);
const tmpAfter = fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('klatch-backfill-dryrun-'));
check('A', 'tmp snapshot deleted', tmpAfter.length === tmpBefore.length, `${tmpBefore.length} → ${tmpAfter.length} in ${os.tmpdir()}`);
const sidecars = ['-wal', '-shm'].filter((s) => fs.existsSync(DB + s));

// Separately: xian may well have `npm run dev` up when he runs this. Held in its
// own arm because a writable handle checkpoints WAL on close and would otherwise
// be mistaken for the CLI writing.
const holder = new Database(DB);
holder.prepare('SELECT COUNT(*) FROM channels').get();
const dryHeld = cli([DB]);
holder.close();
check('A2', 'runs while another process holds the DB writable', dryHeld.code === 0 && !/SQLITE_BUSY|locked/i.test(dryHeld.err), `exit ${dryHeld.code}, no busy/locked error — the readonly snapshot open does not contend with a live server`);
check('A2', 'same sheet under contention', /Candidates: \d+ — \d+ would move/.exec(dryHeld.out)?.[0] === /Candidates: \d+ — \d+ would move/.exec(dry.out)?.[0], `${/Candidates: .*/.exec(dryHeld.out)?.[0]}`);
await restorePristine();

if (sidecars.length) {
  open_('A', 'WAL sidecars beside the real DB', `dry run leaves ${sidecars.join(', ')} beside klatch.db — known and documented in the CLI header (Theseus, 8/12); gitignored, but it is a file creation next to a database the tool promises not to write to`);
} else {
  check('A', 'no sidecars left beside the DB', true, 'none');
}

// ── Arm B — the review sheet is the artifact xian reads. Does it say the truth? ──
console.log('\nArm B — review sheet content');
const sheet = dry.out;
const skipLine = /skipped, by reason: (\{.*\})/.exec(sheet);
const skipReasons = skipLine ? JSON.parse(skipLine[1]) : {};
check('B', 'candidates matches raw SQL', new RegExp(`Candidates: ${seededCount.n} `).test(sheet), `sheet says "${/Candidates: \d+ — \d+ would move, \d+ skipped/.exec(sheet)?.[0]}"`);
check('B', 'all four skip reasons reachable', ['no-guess', 'basis-excluded', 'multi-bound', 'resolves-to-default'].every((r) => r in skipReasons), JSON.stringify(skipReasons));
check('B', 'Tarn counted once across two channels', /new agents \(2\):/.test(sheet) && /Tarn/.test(sheet) && /Wren/.test(sheet), `newAgents line: "${/new agents \(\d+\): .*/.exec(sheet)?.[0]}"`);
check('B', 'existing agent reported as reused', /reused agents \(1\): Sable/.test(sheet), `${/reused agents \(\d+\): .*/.exec(sheet)?.[0]}`);
// The `native` line is the schema's own seeded #general, not something the probe
// made — which is the point of this report existing: it names what it left alone.
check('B', 'out-of-scope sources reported not dropped', /untouched: \{.*"klatch":1.*\}/.test(sheet) && /"native":1/.test(sheet), `${/untouched: .*/.exec(sheet)?.[0] ?? '(absent)'}`);
check('B', 'P3 rows counted separately from P2', /P3 \(were NULL/.test(sheet) && !/0 P3/.test(sheet), `${/message rows re-stamped: .*/.exec(sheet)?.[0]}`);
check('B', 'dry run says so in words', /Dry run — planned against a read-only snapshot/.test(sheet), 'closing paragraph present');

// ── Arm G — what xian's one command does when the input is slightly wrong ────
// Run before the apply arms so they operate on a pristine DB.
console.log('\nArm G — operator error, on the exact command xian was handed');
const hashG = sha(DB);

const gTypoBases = cli([DB, '--bases=identity_claim']);
const gTypoMove = /Candidates: \d+ — (\d+) would move/.exec(gTypoBases.out)?.[1];
if (gTypoBases.code === 0 && gTypoMove === '0') {
  open_('G1', 'a typo in --bases reports "0 would move" and exits 0', `--bases=identity_claim (underscore, not hyphen) is accepted, every row falls to basis-excluded, and the sheet reads "0 would move" with no warning. Indistinguishable from a corpus with nothing to fix. Unknown basis names are cast \`as any[]\` at backfill-entity-bindings.mts:115 and never validated against GuessBasis.`);
} else {
  check('G1', 'bad --bases rejected', gTypoBases.code !== 0, `exit ${gTypoBases.code}`);
}

const gTypoChannels = cli([DB, '--channels=not-a-real-id']);
const gcCand = /Candidates: (\d+) /.exec(gTypoChannels.out)?.[1];
if (gTypoChannels.code === 0 && gcCand === '0') {
  open_('G2', 'an unknown --channels id vanishes silently', `--channels=not-a-real-id prints "Candidates: 0" and exits 0. The confirm round trip xian was offered is "read the sheet, hand back the ids you approve" — a mistyped or truncated id in that list is dropped with no message, so approving 4 and moving 3 looks like success. planEntityBackfill filters with \`includes\` (entity-backfill.ts:219) and never reports ids it did not find.`);
} else {
  check('G2', 'unknown --channels id reported', /not-a-real-id/.test(gTypoChannels.out), gTypoChannels.out.slice(-200));
}

// G5 is G2 stopped being hypothetical. The confirm round trip Daedalus offered
// xian is "read the sheet, hand back the ids you approve" — so the ids a user
// hands back are the ids the sheet printed.
const sheetIds = [...dry.out.matchAll(/^ {2}([0-9a-f]{8}) /gm)].map((m) => m[1]);
const gPrefix = cli([DB, `--channels=${sheetIds.slice(0, 2).join(',')}`]);
const gpCand = /Candidates: (\d+) /.exec(gPrefix.out)?.[1];
if (gPrefix.code === 0 && gpCand === '0') {
  open_('G5', 'the ids the sheet prints are not the ids --channels accepts', `The per-channel sheet prints \`r.channelId.slice(0, 8)\` (backfill-entity-bindings.mts:155) — an 8-hex prefix. \`--channels\` matches full uuids with \`includes\` (entity-backfill.ts:219). Copying two ids straight off the sheet (${sheetIds.slice(0, 2).join(', ')}) yields "Candidates: 0" and exit 0. Composed with G2, the documented approve-by-id workflow silently moves nothing and reports success.`);
} else {
  check('G5', 'sheet ids work with --channels', gpCand !== '0', `handed ${sheetIds.slice(0, 2).join(',')} → Candidates: ${gpCand}`);
}

const gMissing = cli([path.join(DATA, 'nope.db')]);
check('G3', 'missing DB path refused', gMissing.code === 1 && /no such database/.test(gMissing.err), `exit ${gMissing.code} · "${gMissing.err.trim().slice(0, 60)}"`);
const gNoArgs = cli([]);
check('G3', 'no argument prints usage', gNoArgs.code === 1 && /usage:/.test(gNoArgs.err), `exit ${gNoArgs.code}`);
const gDir = cli([DATA]);
check('G3', 'a directory path fails loudly, not silently', gDir.code !== 0, `exit ${gDir.code} · ${(gDir.err.split('\n')[0] || '').slice(0, 80)}`);

// G4's vehicle changed in Round 179. It used to be `--channels=not-a-real-id`,
// which after Round 178 is an operator error and refuses (exit 2) — the right
// answer to a different question. G4's invariant is "there is genuinely nothing
// to do", so its input must be one that is genuinely not a mistake:
// `--bases=none` narrows to a basis every row legitimately skips.
const gNothing = cli([DB, '--apply', '--bases=none']);
check('G4', '--apply with nothing to move discards the snapshot', gNothing.code === 0 && /Nothing to apply\. Snapshot discarded\./.test(gNothing.out) && backupsBeside().length === 0, `exit ${gNothing.code} · backups beside DB: ${backupsBeside().length}`);
check('G', 'no operator-error arm mutated the DB', sha(DB) === hashG, sha(DB) === hashG ? 'sha256 unchanged across all of arm G' : 'FILE CHANGED');

// ── Arm F — the approved-ids path actually restricts what moves ─────────────
console.log('\nArm F — --channels applies only the approved id');
const fRun = cli([DB, '--apply', `--channels=${seeded['wren']}`]);
check('F', 'apply exits 0', fRun.code === 0, `exit ${fRun.code}${fRun.code ? ` · ${fRun.err.slice(0, 200)}` : ''}`);
check('F', 'exactly one channel moved', /Applied: 1 channel\(s\) re-pointed, 1 agent\(s\) minted\./.test(fRun.out), `${/Applied: .*/.exec(fRun.out)?.[0]}`);
const fBound = ro((db) =>
  db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').all(seeded['wren'])
);
check('F', 'approved channel is off the default', fBound.length === 1 && fBound[0].entity_id !== DEFAULT_ENTITY_ID, `bindings: ${JSON.stringify(fBound.map((r: any) => r.entity_id))}`);
const fUnapproved = ro((db) =>
  db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').get(seeded['tarn-a'])
);
check('F', 'unapproved channel untouched', fUnapproved.entity_id === DEFAULT_ENTITY_ID, `tarn-a still bound to ${fUnapproved.entity_id}`);
const fRecord = recordsBeside();
check('F', 'undo record written beside the DB', fRecord.length === 1, fRecord.join(', ') || '(none)');
check('F', 'backup written beside the DB', backupsBeside().length === 1, backupsBeside().join(', ') || '(none)');

// Reset to pristine for the full apply.
await restorePristine();

// ── Arm C — the full apply ───────────────────────────────────────────────────
console.log('\nArm C — full apply');
const preApply = dumpTables(DB);
const apply = cli([DB, '--apply']);
check('C', 'apply exits 0', apply.code === 0, `exit ${apply.code}${apply.code ? ` · ${apply.err.slice(0, 300)}` : ''}`);
const appliedN = Number(/Applied: (\d+) channel\(s\) re-pointed, (\d+) agent\(s\) minted\./.exec(apply.out)?.[1] ?? -1);
const mintedN = Number(/Applied: \d+ channel\(s\) re-pointed, (\d+) agent\(s\) minted\./.exec(apply.out)?.[1] ?? -1);
check('C', 'four channels moved (wren, tarn×2, sable-reuse)', appliedN === 4, `${/Applied: .*/.exec(apply.out)?.[0]}`);
check('C', 'the same name mints once across two channels', mintedN === 2, `minted ${mintedN} agents for 4 moved channels (Wren, Tarn; Tarn's second channel reuses)`);

const stillDefault = ro((db) =>
  db
    .prepare(
      `SELECT COUNT(*) AS n FROM channel_entities ce JOIN channels c ON c.id = ce.channel_id
        WHERE ce.entity_id = ? AND c.source IN ('claude-code','claude-ai')`
    )
    .get(DEFAULT_ENTITY_ID)
);
check('C', 'moved channels no longer bind the default', stillDefault.n === 4, `${stillDefault.n} in-scope channels still on the default (expected 4: the four skips)`);

const wrenEntity = ro((db) => db.prepare("SELECT id, name FROM entities WHERE name = 'Wren'").get());
const wrenMsgs = ro((db) =>
  db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN entity_id = ? THEN 1 ELSE 0 END) AS stamped,
              SUM(CASE WHEN entity_id IS NULL THEN 1 ELSE 0 END) AS nulls
         FROM messages WHERE channel_id = ? AND role = 'assistant'`
    )
    .get(wrenEntity.id, seeded['wren'])
);
check('C', 'P2 and P3 both re-stamped (the load-bearing half)', wrenMsgs.stamped === wrenMsgs.total && wrenMsgs.nulls === 0, `wren channel: ${wrenMsgs.stamped}/${wrenMsgs.total} assistant rows now carry Wren, ${wrenMsgs.nulls} still NULL`);
const defaultStamped = ro((db) =>
  db
    .prepare(
      `SELECT COUNT(*) AS n FROM messages WHERE entity_id = ? AND channel_id IN (?,?,?,?)`
    )
    .get(DEFAULT_ENTITY_ID, seeded['wren'], seeded['tarn-a'], seeded['tarn-b'], seeded['reuse'])
);
check('C', "moved channels' answers no longer pool on the placeholder", defaultStamped.n === 0, `${defaultStamped.n} rows in moved channels still stamped default-entity`);
const skipUntouched = ro((db) =>
  db
    .prepare(
      `SELECT COUNT(*) AS n FROM channel_entities WHERE channel_id IN (?,?,?,?) AND entity_id = ?`
    )
    .get(seeded['claude'], seeded['noguess'], seeded['project'], seeded['multi'], DEFAULT_ENTITY_ID)
);
check('C', 'every skipped channel left exactly as found', skipUntouched.n === 4, `${skipUntouched.n}/4 skipped channels still bound to the default`);
const nativeIsh = ro((db) =>
  db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').get(seeded['native-ish'])
);
check('C', 'out-of-scope source untouched', nativeIsh.entity_id === DEFAULT_ENTITY_ID, `klatch-source channel bound to ${nativeIsh.entity_id}`);

const backupFile = backupsBeside()[0];
const recordFile = recordsBeside()[0];
check('C', 'backup taken before anything was written', !!backupFile && dumpTables(path.join(DATA, backupFile)) === preApply, backupFile ? 'backup is row-for-row the pre-apply state' : 'NO BACKUP');
const record = JSON.parse(fs.readFileSync(path.join(DATA, recordFile), 'utf8'));
check('C', 'undo record stores message ids, not a predicate', record.channels.every((c: any) => Array.isArray(c.p2MessageIds) && Array.isArray(c.p3MessageIds)) && record.channels.some((c: any) => c.p3MessageIds.length > 0), `${record.channels.length} channels, ${record.channels.reduce((n: number, c: any) => n + c.p3MessageIds.length, 0)} P3 ids remembered`);
// Which of the two Tarn channels mints is not fixed: `planEntityBackfill` orders
// candidates by channel id, which is a uuid. The invariant that matters is that
// they converge on one agent and only one of them is recorded as having made it.
const tarns = record.channels.filter((c: any) =>
  [seeded['tarn-a'], seeded['tarn-b']].includes(c.channelId)
);
check('C', 'two channels naming the same agent converge on one entity', tarns.length === 2 && tarns[0].toEntityId === tarns[1].toEntityId, `toEntityIds: ${tarns.map((c: any) => c.toEntityId.slice(0, 8)).join(', ')}`);
check('C', 'exactly one of them is recorded as having minted it', tarns.filter((c: any) => c.mintedHere).length === 1, `mintedHere flags: ${tarns.map((c: any) => c.mintedHere).join(', ')} — the other reuses, so undo deletes the agent once`);
const reuseRec = record.channels.find((c: any) => c.channelId === seeded['reuse']);
check('C', 'a pre-existing agent is never recorded as minted by this run', reuseRec && reuseRec.mintedHere === false, `Sable existed before the run; mintedHere=${reuseRec?.mintedHere} — this is what keeps undo from deleting an agent the user made`);

// ── Arm D — can the agent actually see its own answers? (real code path) ─────
console.log('\nArm D — getEntityTranscript, at the real function');
const t = spawnSync('npx', ['tsx', SELF], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, R176_ROLE: 'transcript', KLATCH_DB: DB, R176_ENTITY: wrenEntity.id },
});
let transcript: { role: string; content: string }[] = [];
try {
  transcript = JSON.parse((t.stdout ?? '').trim().split('\n').pop()!);
} catch {
  /* reported by the check below */
}
const assistantSeen = transcript.filter((m) => m.role === 'assistant').length;
check('D', "Wren's transcript contains its own assistant turns", assistantSeen === wrenMsgs.total, `${assistantSeen}/${wrenMsgs.total} assistant rows visible to the entity (exit ${t.status})`);
check('D', 'the P3 row is among them', assistantSeen >= 3, `a NULL-stamped row was invisible to every entity before this run; ${assistantSeen} rows visible now`);
const defTranscript = spawnSync('npx', ['tsx', SELF], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, R176_ROLE: 'transcript', KLATCH_DB: DB, R176_ENTITY: DEFAULT_ENTITY_ID },
});
let defRows: any[] = [];
try {
  defRows = JSON.parse((defTranscript.stdout ?? '').trim().split('\n').pop()!);
} catch {
  /* reported below */
}
const defFromMoved = defRows.filter((m) => m.content?.startsWith('assistant answer')).length;
measure(`default entity transcript after apply: ${defRows.length} rows (the four skipped channels are legitimately still its own)`);

// ── Arm E — undo round trip ─────────────────────────────────────────────────
console.log('\nArm E — undo');
const undo = cli([DB, `--undo=${path.join(DATA, recordFile)}`]);
check('E', 'undo exits 0', undo.code === 0, `exit ${undo.code}${undo.code ? ` · ${undo.err.slice(0, 300)}` : ''}`);
check('E', 'undo reports what it removed', /Reverted 4 channel\(s\)\. Agents removed: 2/.test(undo.out), undo.out.trim());
const postUndo = dumpTables(DB);
if (postUndo !== preApply) {
  fs.writeFileSync(path.join(DATA, 'pre-apply.dump'), preApply);
  fs.writeFileSync(path.join(DATA, 'post-undo.dump'), postUndo);
  const a = preApply.split('\n');
  const b = postUndo.split('\n');
  const diffs = a
    .map((line, i) => (line === b[i] ? null : `    − ${line}\n    + ${b[i]}`))
    .filter(Boolean)
    .slice(0, 6);
  const differing = a.filter((l, i) => l !== b[i]);
  const onlyAddedAt =
    differing.length > 0 &&
    differing.every((l, i) => {
      const before = JSON.parse(l);
      const after = JSON.parse(b[a.indexOf(l)]);
      return (
        'added_at' in before &&
        Object.keys(before).every((k) => k === 'added_at' || before[k] === after[k])
      );
    });
  if (onlyAddedAt) {
    check('E', 'messages and entities restored exactly', true, `every differing column is \`channel_entities.added_at\` on the ${differing.length} restored bindings — messages and entities are row-for-row`);
    open_('E', 'the undo round trip does not restore channel_entities.added_at', `Apply DELETEs the default binding and undo re-INSERTs it, so the restored row's \`added_at\` is the undo's clock, not the original (${differing.length} rows here). \`added_at\` is not decorative: it is the roster ordering key at \`queries.ts:486\` (\`ORDER BY ce.added_at ASC, ce.rowid ASC\`). Invisible on the single-bound channels a backfill touches — a multi-bound channel is skipped by design — and it becomes visible only if a channel gained a second entity between apply and undo, where the restored default would then sort last instead of first. The record already stores per-channel state; carrying the original \`added_at\` in \`BackfillUndoChannel\` would close it. Narrow, and the memo's "row-for-row identical" is true of \`messages\`, \`entities\` and the channel_entities *keys*.`);
  } else {
    check('E', 'messages, channel_entities, entities row-for-row identical to pre-apply', false, `${differing.length} differing line(s); first few:\n${diffs.join('\n')}`);
  }
} else {
  check('E', 'messages, channel_entities, entities row-for-row identical to pre-apply', true, 'byte-identical dumps');
}
const undoTwice = cli([DB, `--undo=${path.join(DATA, recordFile)}`]);
check('E', 'undo is safe to run twice', undoTwice.code === 0 && dumpTables(DB) === postUndo, `exit ${undoTwice.code}; state after a second undo is identical to state after the first`);
// Round 179: this was an unconditional `open_` with no paired check, so it kept
// printing after Daedalus fixed it — the one item in Round 176 that could not
// close itself. Paired now, and the pairing is on evidence rather than on the
// line the CLI prints: the backup file has to exist and be a readable database.
const undoBackupPath = /^Backup \(taken before anything was written\): (.+)$/m.exec(undo.out)?.[1];
let undoBackupReadable = false;
if (undoBackupPath && fs.existsSync(undoBackupPath)) {
  try {
    const b = new Database(undoBackupPath, { readonly: true, fileMustExist: true });
    undoBackupReadable = (b.prepare('SELECT COUNT(*) AS n FROM messages').get() as { n: number }).n > 0;
    b.close();
  } catch {
    undoBackupReadable = false;
  }
}
if (undoBackupReadable) {
  check('E', 'undo takes a snapshot of its own', true, `${path.basename(undoBackupPath!)} — a readable database, taken before undo wrote anything`);
} else {
  open_('E', 'undo takes no snapshot of its own', `\`--undo\` is the one mode that writes to the real database with no backup taken in the same invocation (announced path: ${undoBackupPath ?? 'none printed'}). The apply's backup still exists and covers it, but "two independent ways back" is two ways back from an *apply*; an undo run has one, and it is a file the operator has to still have.`);
}

// ── report ──────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => c.ok === false);
const opens = checks.filter((c) => c.ok === 'open');
console.log(`\n${'='.repeat(78)}`);
console.log(`${checks.length} checks · ${failed.length} failed · ${opens.length} open · ${measurements.length} measurements`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  ${f.arm} · ${f.name} — ${f.detail}`);
}
if (opens.length) {
  console.log('\nOPEN:');
  for (const o of opens) console.log(`  ${o.arm} · ${o.name}`);
}
console.log(`${'='.repeat(78)}\n`);
process.exit(failed.length ? 1 : 0);
