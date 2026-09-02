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
 * only runs on a machine with a live Claude Code install (see CAST below);
 * it exits 2 with a clear message where that corpus is absent.
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
import os from 'os';

const PROJECTS = path.join(os.homedir(), '.claude', 'projects');
const REPO = path.resolve(import.meta.dirname, '..');

// Fresh scratch DB per run, under the gitignored .testdata/. Set before any
// dynamic import below — db/index.ts reads KLATCH_DB at module load.
const SCRATCH = path.join(REPO, '.testdata', 'import-entity-binding');
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });
process.env.KLATCH_DB = path.join(SCRATCH, 'scratch.db');

// Sessions chosen by size (150–600KB) from five distinct agent worktrees. These
// stand in for the Piper Morgan cast: five named agents with real, long,
// independently-authored transcripts.
const CAST: Array<{ agent: string; dir: string; file: string }> = [
  { agent: 'Argus',    dir: '-Users-xian-Development-klatch-worktrees-argus',    file: '7907f86d-da81-4090-a002-14db3e780812.jsonl' },
  { agent: 'Calliope', dir: '-Users-xian-Development-klatch-worktrees-calliope', file: 'fb175963-278a-473b-8222-966c36d703dc.jsonl' },
  { agent: 'Daedalus', dir: '-Users-xian-Development-klatch-worktrees-daedalus', file: '543a019a-6ae9-47ae-89f5-902337505dd1.jsonl' },
  { agent: 'Iris',     dir: '-Users-xian-Development-klatch-worktrees-iris',     file: 'dc7151a8-7eea-4b01-9dfa-d2c9d5e14a5b.jsonl' },
  { agent: 'Theseus',  dir: '-Users-xian-Development-klatch-worktrees-theseus',  file: '6e0073c1-2d2b-4e50-a427-3d1be1a9764b.jsonl' },
];

const ARGUS_SECOND = { dir: CAST[0].dir, file: '82fbcc87-a329-423e-b836-f2ac708ac9e2.jsonl' };
const UNNAMED      = { dir: CAST[1].dir, file: '4f45d6e3-dafd-48a4-aae5-46413452c4a9.jsonl' };

const sessionPathOf = (s: { dir: string; file: string }) => path.join(PROJECTS, s.dir, s.file);

// Precondition: the live corpus. Absent it, this probe reports nothing rather
// than reporting a fleet of failures that only mean "wrong machine".
const missing = [...CAST.map(sessionPathOf), sessionPathOf(ARGUS_SECOND), sessionPathOf(UNNAMED)].filter((p) => !fs.existsSync(p));
if (missing.length) {
  console.error(`Cannot run: ${missing.length} of the named sessions are absent under ${PROJECTS}.`);
  console.error('This probe needs a machine with the live Claude Code corpus it was written against.');
  console.error('First missing: ' + missing[0]);
  process.exit(2);
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

const afterA = q.getAllEntities();
check('A', 'five distinct new entities exist', afterA.length === baselineEntities.length + 5,
  `${baselineEntities.length} -> ${afterA.length}: ${afterA.map((e: any) => e.name).join(', ')}`);

const distinctIds = new Set(Object.values(armA).map((b: any) => b.entityId));
check('A', 'no two agents share an entity', distinctIds.size === 5, `${distinctIds.size} distinct entityIds across 5 imports`);

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
  const p = sessionPath(ARGUS_SECOND);
  const res = await post('/api/import/claude-code', { sessionPath: p, entityName: 'Argus' });
  const body = await res.json();
  check('B', 'second Argus session matched by name (not a look-alike)',
    body.entityDisposition === 'matched-by-name' && body.entityId === armA['Argus']?.entityId,
    `disposition=${body.entityDisposition} entityId=${body.entityId} firstArgus=${armA['Argus']?.entityId}`);
  const afterB = q.getAllEntities();
  check('B', 'entity count unchanged by the second import', afterB.length === afterA.length,
    `${afterA.length} -> ${afterB.length}`);
  const chans = db.prepare('SELECT COUNT(*) n FROM channel_entities WHERE entity_id = ?').get(armA['Argus']?.entityId) as { n: number };
  check('B', 'Argus now owns two channels', chans.n === 2, `channels bound to Argus=${chans.n}`);
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
