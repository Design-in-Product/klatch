/**
 * Round 139 probe — does a fresh import actually mint per-agent entities?
 *
 * Theseus, 2026-09-02 WORK fire. Answers Calliope's Q1 in
 * `calliope-to-daedalus-theseus-cc-team-xian-urgent-friday-piper-morgan-test-2026-09-02.md`:
 *
 *   "Increment #1 (imports mint entities, shipped 8/08) already works correctly
 *    for anything imported *now* ... a fresh import ... should mint proper
 *    per-agent entities on the way in, with no backfill needed at all."
 *
 * Run:  npx tsx scripts/probe-import-entity-binding.mts
 *
 * Read-only against the repo: it writes a scratch SQLite DB under the
 * gitignored `.testdata/` and touches nothing else. Zero model calls — import
 * is entirely local. It reads real sessions out of `~/.claude/projects`, so it
 * only runs on a machine with a live Claude Code install; it exits 2 with a
 * diagnosis that distinguishes "no corpus here" from "corpus here, but it does
 * not meet the stated properties".
 *
 * ## 2026-09-20, Daedalus (Round 241) — the cast is resolved, not pinned
 *
 * Until this change the cast was **seven session UUIDs, written into this file**.
 * Theseus drove it in Round 240 and it exited 2: four of the seven were already
 * deleted, and it blamed the machine. The machine had 538 sessions.
 *
 * `~/.claude/projects` is not under version control and is on a retention fuse:
 * a session file is swept roughly 30 days after its **last append** (measured
 * two-sided — see `scripts/lib/probe-corpus-sessions.mts`). One of the three
 * surviving pins had under a day left. So this file's cast was not at risk of
 * rotting; it was scheduled to, and the acceptance test for the import confirm
 * step was scheduled to go dark with it.
 *
 * The cast is now **resolved by property at run time** — N distinct project
 * directories, each holding at least two real transcripts in a size band — and
 * **printed**, because a resolution that is not reported reads exactly like a
 * pin that happens to still resolve. Agent names are derived from the directory
 * they came from, so they are still distinct per source, which is the only
 * property arms A and B ever needed from them.
 *
 * **This is the acceptance test for the import confirm step.** Arms A and B
 * already pass — the server half shipped 8/09. Arm C is expected to FLIP to
 * "no longer lands on default-entity" once the client sends the confirmed name
 * (`docs/ux/import-confirm-step-scope-2026-08-09.md`). Arms D/E stay failing
 * until the claude.ai ZIP path gets entity plumbing it does not currently have.
 *
 * Arms:
 *   A  five real sessions, one per named agent, each POSTed WITH entityName
 *   B  a second Argus session POSTed with the same entityName (reuse-by-name)
 *   C  a session POSTed with NO entity fields — this is the shape the shipped
 *      client actually sends (`importClaudeCodeSession` in client/src/api/client.ts)
 *   D  claude.ai ZIP import — the other real import path
 */

import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import {
  resolveSessionCast,
  describeResolution,
  refuseWithCorpusDiagnosis,
} from './lib/probe-corpus-sessions.mts';

const REPO = path.resolve(import.meta.dirname, '..');

// Fresh scratch DB per run, under the gitignored .testdata/. Set before any
// dynamic import below — db/index.ts reads KLATCH_DB at module load.
const SCRATCH = path.join(REPO, '.testdata', 'import-entity-binding');
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });
process.env.KLATCH_DB = path.join(SCRATCH, 'scratch.db');

// The cast: five distinct project directories, each with two real, long,
// independently-authored transcripts (150–600 KB). These stand in for the Piper
// Morgan cast. Two sessions per source because arm B needs a *second* session
// from one source and arm C needs a session nobody has imported yet.
//
// Resolution, not pinning — and the refusal below distinguishes the two causes
// that used to be conflated into one misleading sentence.
const resolution = (() => {
  try {
    return resolveSessionCast({ count: 5, sessionsPerDir: 2 });
  } catch (e) {
    refuseWithCorpusDiagnosis(e);
  }
})();

console.log(describeResolution(resolution));

const CAST = resolution.sources.map((s) => ({
  agent: s.label,
  dir: s.dir,
  file: s.sessions[0].file,
  path: s.sessions[0].path,
}));

// A second session from the *same* source as CAST[0] — reuse-by-name (arm B).
const SECOND = { ...CAST[0], path: resolution.sources[0].sessions[1].path };
// A session from a different source, not yet imported — the no-entity shape (arm C).
const UNNAMED = { path: resolution.sources[1].sessions[1].path };

const sessionPathOf = (s: { path: string }) => s.path;

// Control on the resolution itself: the three roles must be three distinct
// files. A resolver that handed back the same path twice would make arm B's
// "matched-by-name" and arm C's "lands on default-entity" both trivially true.
{
  const paths = [...CAST.map((c) => c.path), SECOND.path, UNNAMED.path];
  if (new Set(paths).size !== paths.length) {
    console.error('Cannot run [resolution-degenerate]: the resolved cast contains a duplicate path.');
    console.error(paths.join('\n'));
    process.exit(2);
  }
}

/**
 * Two kinds of check, and conflating them is how an instrument lies.
 *
 * Arms A/B assert **behavior that must hold** — a failure there is a regression
 * in shipped code. Arms C/D/E assert **a gap that is currently present** — they
 * "pass" today by confirming the defect. When someone fixes the client or adds
 * entity plumbing to the claude.ai path, those flip, and that flip is the good
 * news, not a regression. So they are reported and exit-coded separately.
 */
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; gap: boolean }> = [];
function check(arm: string, name: string, pass: boolean, detail: string) {
  const gap = arm === 'C' || arm === 'D' || arm === 'E';
  results.push({ arm, check: name, pass, detail, gap });
  const tag = gap ? (pass ? 'GAP-OPEN ' : 'GAP-CLOSED') : (pass ? 'PASS      ' : 'FAIL      ');
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}

const { importRoutes } = await import(path.join(REPO, 'packages/server/src/routes/import.ts'));
const q = await import(path.join(REPO, 'packages/server/src/db/queries.ts'));
const { getDb } = await import(path.join(REPO, 'packages/server/src/db/index.ts'));
const { DEFAULT_ENTITY_ID } = await import(path.join(REPO, 'packages/shared/src/types.ts'));

const app = new Hono();
app.route('/api', importRoutes);

function post(url: string, body: unknown) {
  return app.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const sessionPath = sessionPathOf;

// Entities present before anything is imported — the DB ships with default-entity.
const baselineEntities = q.getAllEntities();
console.log(`\nbaseline entities: ${baselineEntities.length} (${baselineEntities.map((e: any) => e.name).join(', ')})\n`);

// ── Arm A: import each agent WITH a confirmed entityName ──────────────
const armA: Record<string, any> = {};
for (const c of CAST) {
  const p = sessionPath(c);
  if (!fs.existsSync(p)) { check('A', `${c.agent} session exists`, false, p); continue; }
  const res = await post('/api/import/claude-code', { sessionPath: p, entityName: c.agent });
  const body = await res.json();
  armA[c.agent] = body;
  check('A', `${c.agent} import 201`, res.status === 201, `status=${res.status} msgs=${body.messageCount ?? '-'} disposition=${body.entityDisposition ?? 'NONE'}`);
  check('A', `${c.agent} minted its own entity`, body.entityDisposition === 'minted' && !!body.entityId && body.entityId !== DEFAULT_ENTITY_ID,
    `entityId=${body.entityId ?? 'NONE'} disposition=${body.entityDisposition ?? 'NONE'}`);
}

// Cast size is now resolved, so these counts are derived from it. A literal 5
// here would silently stop tracking the resolver the moment either moved.
const afterA = q.getAllEntities();
check('A', `${CAST.length} distinct new entities exist`, afterA.length === baselineEntities.length + CAST.length,
  `${baselineEntities.length} -> ${afterA.length}: ${afterA.map((e: any) => e.name).join(', ')}`);

const distinctIds = new Set(Object.values(armA).map((b: any) => b.entityId));
check('A', 'no two agents share an entity', distinctIds.size === CAST.length,
  `${distinctIds.size} distinct entityIds across ${CAST.length} imports`);

// Every channel is bound to exactly its own agent's entity, and assistant
// messages carry that entity_id (the thing carried context reads).
const db = getDb();
for (const c of CAST) {
  const b = armA[c.agent];
  if (!b?.channelId) continue;
  const bound = db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').all(b.channelId) as Array<{ entity_id: string }>;
  check('A', `${c.agent} channel bound to exactly its entity`,
    bound.length === 1 && bound[0].entity_id === b.entityId,
    `bindings=[${bound.map((r) => r.entity_id).join(',')}] expected=${b.entityId}`);
  const wrong = db.prepare(
    "SELECT COUNT(*) n FROM messages WHERE channel_id = ? AND role = 'assistant' AND (entity_id IS NULL OR entity_id != ?)"
  ).get(b.channelId, b.entityId) as { n: number };
  check('A', `${c.agent} assistant messages carry its entity_id`, wrong.n === 0, `mismatched assistant rows=${wrong.n}`);
}

// ── Arm B: a second session for the same confirmed name ───────────────
{
  const first = CAST[0].agent;
  const p = sessionPath(SECOND);
  const res = await post('/api/import/claude-code', { sessionPath: p, entityName: first });
  const body = await res.json();
  check('B', `second ${first} session matched by name (not a look-alike)`,
    body.entityDisposition === 'matched-by-name' && body.entityId === armA[first]?.entityId,
    `disposition=${body.entityDisposition} entityId=${body.entityId} first${first}=${armA[first]?.entityId}`);
  const afterB = q.getAllEntities();
  check('B', 'entity count unchanged by the second import', afterB.length === afterA.length,
    `${afterA.length} -> ${afterB.length}`);
  const chans = db.prepare('SELECT COUNT(*) n FROM channel_entities WHERE entity_id = ?').get(armA[first]?.entityId) as { n: number };
  check('B', `${first} now owns two channels`, chans.n === 2, `channels bound to ${first}=${chans.n}`);
}

// ── Arm C: no entity fields — the shape the shipped client actually sends ──
{
  const before = q.getAllEntities().length;
  const res = await post('/api/import/claude-code', { sessionPath: sessionPath(UNNAMED) });
  const body = await res.json();
  const bound = body.channelId
    ? (db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').all(body.channelId) as Array<{ entity_id: string }>)
    : [];
  check('C', 'import with no entityName lands on default-entity',
    bound.length === 1 && bound[0].entity_id === DEFAULT_ENTITY_ID,
    `status=${res.status} bound=[${bound.map((r) => r.entity_id).join(',')}] entityDisposition=${body.entityDisposition ?? 'ABSENT'}`);
  check('C', 'no entity was minted', q.getAllEntities().length === before, `${before} -> ${q.getAllEntities().length}`);
}

// ── Arm D: the claude.ai ZIP path ─────────────────────────────────────
{
  const zip = path.join(REPO, 'packages/server/src/__tests__/fixtures/claude-ai/test-export.zip');
  const before = q.getAllEntities().length;
  const res = await post('/api/import/claude-ai', { zipPath: zip });
  const body = await res.json();
  const ids: string[] = (body.imported ?? []).map((i: any) => i.channelId);
  const bindings = ids.flatMap((id) =>
    (db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').all(id) as Array<{ entity_id: string }>).map((r) => r.entity_id)
  );
  // Precondition, not a gap: the arm is only meaningful if the import ran.
  check('B', 'claude.ai ZIP import succeeded (precondition for D/E)', res.status === 201, `status=${res.status} imported=${body.totalImported ?? 0}`);
  check('D', 'every claude.ai channel landed on default-entity',
    bindings.length > 0 && bindings.every((b) => b === DEFAULT_ENTITY_ID),
    `bindings=[${[...new Set(bindings)].join(',')}]`);
  check('D', 'claude.ai import minted no entities', q.getAllEntities().length === before,
    `${before} -> ${q.getAllEntities().length}`);
}

// ── Arm E: does the route even accept an entity on the claude.ai path? ──
{
  const zip = path.join(REPO, 'packages/server/src/__tests__/fixtures/claude-ai/test-tools-export.zip');
  const before = q.getAllEntities().length;
  const res = await post('/api/import/claude-ai', { zipPath: zip, entityName: 'PiperCXO' });
  const body = await res.json();
  const ids: string[] = (body.imported ?? []).map((i: any) => i.channelId);
  const bindings = ids.flatMap((id) =>
    (db.prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?').all(id) as Array<{ entity_id: string }>).map((r) => r.entity_id)
  );
  const minted = q.getAllEntities().some((e: any) => e.name === 'PiperCXO');
  check('E', 'claude.ai route SILENTLY IGNORES entityName (no error, no binding)',
    res.status === 201 && !minted && bindings.every((b) => b === DEFAULT_ENTITY_ID),
    `status=${res.status} mintedPiperCXO=${minted} bindings=[${[...new Set(bindings)].join(',')}] entityCount ${before} -> ${q.getAllEntities().length}`);
}

// ── Summary ───────────────────────────────────────────────────────────
const behavior = results.filter((r) => !r.gap);
const gaps = results.filter((r) => r.gap);
const regressions = behavior.filter((r) => !r.pass);
const closed = gaps.filter((r) => !r.pass);

console.log(`\nbehavior (A/B): ${behavior.length - regressions.length}/${behavior.length} pass`);
console.log(`gaps (C/D/E):   ${gaps.length - closed.length}/${gaps.length} still open`);
if (regressions.length) {
  console.log('\nREGRESSIONS — shipped behavior broke:');
  for (const f of regressions) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
if (closed.length) {
  console.log('\nGAPS CLOSED since this probe was written (good — update the probe):');
  for (const f of closed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
console.log('\nfinal entities:', q.getAllEntities().map((e: any) => `${e.name}`).join(', '));
process.exit(regressions.length ? 1 : 0);
