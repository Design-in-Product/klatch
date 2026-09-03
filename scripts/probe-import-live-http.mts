/**
 * Round 141 probe — the import entity binding over a REAL listening server.
 *
 * Theseus, 2026-09-02 STOP fire. Closes two gaps that were named, not guessed:
 *
 * 1. My own Round 139 limit, written down in that session's log: "The curl
 *    fallback recipe is route-level, not server-level. I drove the same Hono
 *    route the dev server mounts; I did not stand up `npm run dev` and curl it."
 *    `scripts/probe-import-entity-binding.mts` uses in-process `app.request()`.
 *    This one spawns `packages/server/src/index.ts` and talks real HTTP to it.
 *
 * 2. Iris's `uploadClaudeCodeSession` multipart call site (client.ts:610-647),
 *    added in f26b8fc, appends `entityName`/`entityId` as form fields. NOTHING
 *    has ever driven that branch end-to-end — my probe posted JSON only. A form
 *    field that the server ignored would fail exactly the way the claude.ai ZIP
 *    route already does: silent discard, 201, wrong binding.
 *
 * Run:  npx tsx scripts/probe-import-live-http.mts
 *
 * Self-contained and hermetic, unlike the Round 139 probe: it writes its own
 * JSONL fixtures under the gitignored `.testdata/` rather than reading
 * `~/.claude/projects`, so it runs anywhere including a sandboxed session.
 * That is a real trade — synthetic transcripts are shallow where the live
 * corpus is deep. This probe measures the *transport and binding contract*,
 * not parser fidelity against real-world sessions; the Round 139 probe is
 * still the one to run for that, on a machine with the live corpus.
 *
 * Zero model calls. Scratch DB via KLATCH_DB; xian's `klatch.db` is untouched.
 *
 * Arms:
 *   A  JSON body + entityName, over real HTTP           — must bind per-agent
 *   B  second session, same entityName                  — must reuse, not fork
 *   C  JSON body, NO entity fields                      — must land on default
 *   D  MULTIPART upload + entityName (Iris's new path)  — must bind per-agent
 *   E  MULTIPART upload, NO entity fields               — must land on default
 *
 * Every arm asserts behavior that must hold. A failure here is a regression,
 * so this probe exits 1 on any failure — no gap-arm bookkeeping, unlike
 * Round 139 where arms C/D/E encoded defects that were expected to flip.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'import-live-http');
const DB = path.join(SCRATCH, 'scratch.db');

// packages/server/src/index.ts hardcodes `const port = 3001` — there is no env
// override, so this probe cannot pick its own port. It therefore refuses to run
// when 3001 is occupied rather than silently measuring somebody else's server
// (and, worse, somebody else's klatch.db). Stop your dev server and re-run.
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

if (!(await portIsFree(PORT))) {
  console.error(`Cannot run: port ${PORT} is already in use.`);
  console.error('The server hardcodes 3001, so this probe would otherwise talk to a server');
  console.error("it did not start, backed by a DB it does not own. Stop `npm run dev` and re-run.");
  process.exit(2);
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Fixtures ──────────────────────────────────────────────────
// Shaped after docs/JSONL-SCHEMA.md: a human user event opens the turn, an
// assistant event answers. The opening line carries the identity claim that
// entity-guess.ts reads for basis 'identity-claim'.

let uuidN = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++uuidN).padStart(12, '0')}`;

function writeSession(file: string, identityLine: string, reply: string): string {
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    {
      type: 'user',
      uuid: userUuid,
      parentUuid: null,
      sessionId,
      timestamp: '2026-09-02T19:00:00.000Z',
      cwd: '/tmp/probe',
      permissionMode: 'default',
      message: { role: 'user', content: identityLine },
    },
    {
      type: 'assistant',
      uuid: uuid(),
      parentUuid: userUuid,
      sessionId,
      timestamp: '2026-09-02T19:00:05.000Z',
      cwd: '/tmp/probe',
      message: {
        role: 'assistant',
        model: 'claude-opus-5',
        content: [{ type: 'text', text: reply }],
        stop_reason: 'end_turn',
      },
    },
  ];
  const p = path.join(SCRATCH, file);
  fs.writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return p;
}

const daedalusA = writeSession('daedalus-a.jsonl', 'You are Daedalus, the architecture agent.', 'Understood — Daedalus here.');
const daedalusB = writeSession('daedalus-b.jsonl', 'You are Daedalus. Continuing yesterday.', 'Picking up where we left off.');
const anon      = writeSession('anon.jsonl',       'Fix the flaky test in the parser suite.', 'Looking at the parser suite now.');
const irisUp    = writeSession('iris-upload.jsonl','You are Iris, the design agent.',        'Iris, ready.');
const anonUp    = writeSession('anon-upload.jsonl','Please summarize this repository.',      'Here is a summary.');

// ── Server lifecycle ──────────────────────────────────────────

const serverLog = path.join(SCRATCH, 'server.log');
const logFd = fs.openSync(serverLog, 'a');
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB },
  stdio: ['ignore', logFd, logFd],
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
}
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });

async function waitForServer(timeoutMs = 45_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}). Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
    }
    try {
      const res = await fetch(`${BASE}/api/channels`);
      if (res.ok) return;
    } catch { /* not listening yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} within ${timeoutMs}ms. Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
}

// ── Checks ────────────────────────────────────────────────────

const results: Array<{ arm: string; check: string; pass: boolean; detail: string }> = [];
function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) as any };
}

/** Drives the exact shape client.ts `uploadClaudeCodeSession` sends. */
async function postMultipart(url: string, filePath: string, fields: Record<string, string>) {
  const fd = new FormData();
  const bytes = fs.readFileSync(filePath);
  fd.append('file', new Blob([bytes], { type: 'application/jsonl' }), path.basename(filePath));
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(`${BASE}${url}`, { method: 'POST', body: fd });
  return { status: res.status, body: await res.json().catch(() => ({})) as any };
}

// ── Run ───────────────────────────────────────────────────────

console.log(`spawning real server on :${PORT} against ${path.relative(REPO, DB)}\n`);
await waitForServer();
console.log('server is listening — every request below is real HTTP, not app.request()\n');

// Read the DB the same way the server does, but read-only and after the fact.
process.env.KLATCH_DB = DB;
const { default: Database } = await import('better-sqlite3');
const { DEFAULT_ENTITY_ID } = await import(path.join(REPO, 'packages/shared/src/types.ts'));
const sql = new Database(DB, { readonly: true });

const entityOfChannel = (channelId: string): { id: string; name: string } | undefined =>
  sql.prepare(
    'SELECT e.id as id, e.name as name FROM channel_entities ce JOIN entities e ON e.id = ce.entity_id WHERE ce.channel_id = ?'
  ).get(channelId) as any;

const assistantEntityIds = (channelId: string): Array<string | null> =>
  (sql.prepare(
    "SELECT DISTINCT entity_id as eid FROM messages WHERE channel_id = ? AND role = 'assistant'"
  ).all(channelId) as any[]).map((r) => r.eid);

// Arm A — JSON + entityName over real HTTP.
{
  const { status, body } = await postJson('/api/import/claude-code', {
    sessionPath: daedalusA, channelName: 'probe-daedalus-a', entityName: 'Daedalus',
  });
  check('A', 'JSON import over real HTTP succeeds', status === 200 || status === 201, `HTTP ${status}`);
  const bound = body.channelId ? entityOfChannel(body.channelId) : undefined;
  check('A', 'channel bound to a Daedalus entity, not default',
    !!bound && bound.name === 'Daedalus' && bound.id !== DEFAULT_ENTITY_ID,
    bound ? `bound to "${bound.name}" (${bound.id})` : 'no channel_entities row');
  check('A', 'server echoes entityId + disposition to the client',
    typeof body.entityId === 'string' && !!body.entityDisposition,
    `entityId=${body.entityId} disposition=${body.entityDisposition}`);
  const eids = body.channelId ? assistantEntityIds(body.channelId) : [];
  check('A', 'assistant rows stamped with the minted entity (not NULL, not default)',
    eids.length > 0 && eids.every((e) => e === bound?.id),
    `distinct assistant entity_id: ${JSON.stringify(eids)}`);
  var daedalusEntityId = bound?.id;
}

// Arm B — same name again: reuse, do not fork a second Daedalus.
{
  const { status, body } = await postJson('/api/import/claude-code', {
    sessionPath: daedalusB, channelName: 'probe-daedalus-b', entityName: 'Daedalus',
  });
  check('B', 'second same-name import succeeds', status === 200 || status === 201, `HTTP ${status}`);
  const bound = body.channelId ? entityOfChannel(body.channelId) : undefined;
  check('B', 'reuses the SAME entity row (no typo-fork)',
    !!bound && bound.id === daedalusEntityId,
    `${bound?.id} vs arm A ${daedalusEntityId}`);
  check('B', 'disposition reports a match, not a mint',
    body.entityDisposition === 'matched-by-name' || body.entityDisposition === 'matched',
    `disposition=${body.entityDisposition}`);
  const count = (sql.prepare('SELECT COUNT(*) as n FROM entities WHERE lower(name) = ?').get('daedalus') as any).n;
  check('B', 'exactly one Daedalus entity exists', count === 1, `${count} row(s) named Daedalus`);
}

// Arm C — JSON, no entity fields. Server-side default is still correct behavior;
// the client is what must now always send a name. This pins the fallback.
{
  const { status, body } = await postJson('/api/import/claude-code', {
    sessionPath: anon, channelName: 'probe-anon',
  });
  check('C', 'import with no entity fields still succeeds', status === 200 || status === 201, `HTTP ${status}`);
  const bound = body.channelId ? entityOfChannel(body.channelId) : undefined;
  check('C', 'falls back to default-entity (documented fallback, not a bug)',
    !!bound && bound.id === DEFAULT_ENTITY_ID,
    bound ? `bound to ${bound.id}` : 'no channel_entities row');
}

// Arm D — MULTIPART + entityName. Iris's new call site. Never before exercised.
{
  const { status, body } = await postMultipart('/api/import/claude-code', irisUp, {
    channelName: 'probe-iris-upload', entityName: 'Iris',
  });
  check('D', 'multipart upload over real HTTP succeeds', status === 200 || status === 201, `HTTP ${status}`);
  const bound = body.channelId ? entityOfChannel(body.channelId) : undefined;
  check('D', 'entityName form field is HONORED, not silently discarded',
    !!bound && bound.name === 'Iris' && bound.id !== DEFAULT_ENTITY_ID,
    bound ? `bound to "${bound.name}" (${bound.id})` : 'no channel_entities row');
  const eids = body.channelId ? assistantEntityIds(body.channelId) : [];
  check('D', 'assistant rows stamped on the multipart path too',
    eids.length > 0 && eids.every((e) => e === bound?.id),
    `distinct assistant entity_id: ${JSON.stringify(eids)}`);
}

// Arm E — MULTIPART, no entity fields: same documented fallback.
{
  const { status, body } = await postMultipart('/api/import/claude-code', anonUp, {
    channelName: 'probe-anon-upload',
  });
  check('E', 'multipart with no entity fields succeeds', status === 200 || status === 201, `HTTP ${status}`);
  const bound = body.channelId ? entityOfChannel(body.channelId) : undefined;
  check('E', 'falls back to default-entity',
    !!bound && bound.id === DEFAULT_ENTITY_ID,
    bound ? `bound to ${bound.id}` : 'no channel_entities row');
}

// Arm F — the browse contract. Iris's confirm field prefills from
// `SessionInfo.entityGuess` (client.ts:507). That field is mirrored by hand
// from the server type, and her tests supply it via mocked fetch — so nothing
// proves the REAL endpoint emits it. If it didn't, the confirm step would ship
// as a permanently-blank field and every import would silently take the arm-C
// path. This asserts it over live HTTP against whatever corpus is reachable.
{
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`);
  const body = await res.json().catch(() => ({})) as any;
  check('F', 'browse endpoint responds', res.ok, `HTTP ${res.status}`);
  const sessions = (body.projects ?? []).flatMap((p: any) => p.sessions ?? []);
  if (sessions.length === 0) {
    // Honest no-op rather than a vacuous pass: with no readable corpus (e.g. a
    // sandboxed session that cannot see ~/.claude/projects) there is nothing to
    // assert, and "0 of 0 carried a guess" is not evidence the contract holds.
    check('F', 'corpus reachable to assert the guess contract', false,
      `0 sessions returned — contract NOT exercised (totalProjects=${body.totalProjects ?? 0}). Re-run where ~/.claude/projects is readable.`);
  } else {
    const withGuess = sessions.filter((s: any) => s.entityGuess && typeof s.entityGuess.basis === 'string');
    check('F', 'every browsed session carries entityGuess{basis,rationale}',
      withGuess.length === sessions.length,
      `${withGuess.length}/${sessions.length} sessions`);
    const bases = [...new Set(sessions.map((s: any) => s.entityGuess?.basis))];
    check('F', 'bases are drawn from the documented set only',
      bases.every((b) => b === 'identity-claim' || b === 'project-name' || b === 'none'),
      `observed: ${JSON.stringify(bases)}`);

    // Reported, not asserted. The confirm step has three visual treatments, one
    // per basis; this is how often each will actually be seen on this machine's
    // corpus. A treatment that never fires is dead UI, and a corpus that is
    // mostly 'project-name' means the import screen is mostly amber warnings.
    const dist: Record<string, number> = {};
    for (const s of sessions) dist[s.entityGuess?.basis ?? 'MISSING'] = (dist[s.entityGuess?.basis ?? 'MISSING'] ?? 0) + 1;
    const pct = (n: number) => `${((n / sessions.length) * 100).toFixed(1)}%`;
    console.log(`\n  basis distribution over ${sessions.length} real sessions:`);
    for (const [b, n] of Object.entries(dist).sort((a, b2) => b2[1] - a[1])) {
      console.log(`    ${b.padEnd(15)} ${String(n).padStart(4)}  ${pct(n)}`);
    }
    // Per-name counts, not just distinct names: this is the shape of the
    // cast the import screen will offer, and how hard the batch group-confirm
    // banner (≥2 identity-claim sessions agreeing on a name) will work.
    const byName: Record<string, number> = {};
    for (const s of sessions) {
      if (s.entityGuess?.basis !== 'identity-claim') continue;
      const n = s.entityGuess.name.trim().toLowerCase();
      byName[n] = (byName[n] ?? 0) + 1;
    }
    const ranked = Object.entries(byName).sort((a, b2) => b2[1] - a[1]);
    console.log(`    identity-claim names (${ranked.length} distinct):`);
    for (const [n, c] of ranked) console.log(`      ${n.padEnd(12)} ${String(c).padStart(4)} session(s)`);
    console.log(`    would group-confirm (>=2 sessions): ${ranked.filter(([, c]) => c >= 2).length} names\n`);
  }
}

// Arm G — a DEEP transcript, end to end.
//
// This closes the sharpest limit I wrote down in Round 139: "Duty-cycle
// sessions are one turn with enormous tool payloads, so 2 messages is correct —
// but it means my corpus is a *shallow* proxy. Nothing here measures how a
// 400-message transcript imports." Every arm above still uses 2-event fixtures.
//
// The live corpus turns out to contain deep, strongly-identified sessions in
// non-Klatch projects (480-600+ messages). Those are the closest thing on this
// machine to the Friday load, so this arm imports the largest one it can find
// and asserts the binding holds at depth, not just on a toy file.
//
// Conditional on the corpus: skipped-with-a-note where it is unreachable,
// rather than silently reducing the probe's coverage.
{
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`);
  const body = await res.json().catch(() => ({})) as any;
  const deep = ((body.projects ?? []) as any[])
    .flatMap((p) => (p.sessions ?? []).map((s: any) => ({ ...s, projectName: p.projectName })))
    .filter((s) => s.entityGuess?.basis === 'identity-claim' && (s.messageCount ?? 0) >= 300)
    .sort((a, b2) => (b2.messageCount ?? 0) - (a.messageCount ?? 0));

  if (deep.length === 0) {
    console.log('\n  [G] no session >=300 messages in reach — depth arm SKIPPED, not passed.\n');
  } else {
    const target = deep[0];
    const name = target.entityGuess.name;
    console.log(`\n  [G] deepest reachable session: "${name}" in project ${target.projectName}, ${target.messageCount} messages`);
    const t0 = Date.now();
    const { status, body: r } = await postJson('/api/import/claude-code', {
      sessionPath: target.path, channelName: `probe-deep-${String(name).toLowerCase()}`, entityName: name,
    });
    const ms = Date.now() - t0;
    check('G', `deep import (${target.messageCount} msgs) succeeds over real HTTP`,
      status === 200 || status === 201, `HTTP ${status} in ${ms}ms`);
    const bound = r.channelId ? entityOfChannel(r.channelId) : undefined;
    check('G', 'deep transcript binds to its own entity, not default',
      !!bound && bound.name === name && bound.id !== DEFAULT_ENTITY_ID,
      bound ? `bound to "${bound.name}"` : 'no channel_entities row');
    const persisted = r.channelId
      ? (sql.prepare('SELECT COUNT(*) as n FROM messages WHERE channel_id = ?').get(r.channelId) as any).n
      : 0;
    check('G', 'messages actually persisted at depth', persisted >= 100, `${persisted} rows in messages`);
    // The binding must hold for EVERY assistant row, not just the first page —
    // a partial stamp is the exact failure the backfill exists to repair.
    const stray = r.channelId
      ? (sql.prepare(
          "SELECT COUNT(*) as n FROM messages WHERE channel_id = ? AND role = 'assistant' AND (entity_id IS NULL OR entity_id != ?)"
        ).get(r.channelId, bound?.id ?? '') as any).n
      : -1;
    check('G', 'zero assistant rows NULL-stamped or mis-stamped at depth', stray === 0,
      `${stray} stray assistant row(s)`);
  }
}

// ── Report ────────────────────────────────────────────────────

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
const names = (sql.prepare('SELECT name FROM entities ORDER BY name').all() as any[]).map((r) => r.name);
console.log(`entities in scratch DB: ${names.length} (${names.join(', ')})`);
sql.close();
shutdown();

if (failed.length) {
  console.log('\nFAILURES:');
  for (const f of failed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
  process.exit(1);
}
process.exit(0);
