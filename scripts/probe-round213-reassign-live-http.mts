/**
 * Round 213 probe — Daedalus's Round 212 reassign endpoint, driven over a real socket.
 *
 * Theseus, 2026-09-15 START fire. `81511a3f` / `1fc3904f` add
 * `PATCH /api/channels/:channelId/entities/:entityId` with `{ toEntityId }`, plus a
 * 13-test suite he mutation-tested four ways. His §6 names exactly what those tests do
 * not reach, and it is the list this probe exists to close:
 *
 *   > **Not driven through a live HTTP server.** Tests hit the real route via
 *   > `app.request` on the real Hono app with a real (in-memory) database, so the
 *   > route wiring, status codes and JSON body are exercised — but no socket.
 *
 * `app.request` hands Hono a Request object that the test constructed. A socket hands it
 * bytes. The gap between those two is where body parsing, content-type handling and
 * framework-level error mapping live — none of which a hand-built Request exercises,
 * because the test always builds a well-formed one. Arm D is aimed squarely at that gap
 * and it is the arm that found something.
 *
 * Run:  npx tsx scripts/probe-round213-reassign-live-http.mts
 *
 * ZERO MODEL CALLS. No message is ever POSTed — the conversation state arms B/C/E need is
 * written straight into the scratch DB, the same idiom as Round 163 arm G. The reassign
 * route itself does no generation. Scratch DB via KLATCH_DB under `.testdata/`; xian's
 * `klatch.db` is never opened. Nothing under `packages/` is written — asserted at exit.
 *
 * Arms:
 *   A  the contract as documented: path, verb, 200 body shape                  [regression]
 *   B  the stamps move with the seat — the A5 invariant, over the wire         [regression]
 *   C  `added_at` survives, so a klatch roster does not reshuffle              [regression]
 *   D  the five refusals, each with its own status AND its own sentence        [regression]
 *   E  the orphan report, and that it is a report and not a delete             [regression]
 *   F  malformed and absent request bodies                                     [measurement]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round213-reassign');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}/api`;

function readConst(file: string, re: RegExp, what: string): string {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const m = src.match(re);
  if (!m) throw new Error(`could not read ${what} from ${file}`);
  return m[1];
}
const DEFAULT_ENTITY_ID = readConst(
  'packages/shared/src/types.ts',
  /export const DEFAULT_ENTITY_ID = '([^']+)'/,
  'DEFAULT_ENTITY_ID'
);

type Kind = 'regression' | 'open' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'regression' ? 'FAIL' : kind === 'open' ? 'OPEN' : 'NOTE';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, detail, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

function packagesDiff(): string {
  return execFileSync('git', ['diff', '--stat', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const diffBefore = packagesDiff();

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

if (!(await portIsFree(PORT))) {
  console.error(`port ${PORT} is occupied — this probe needs to own the server. Stop the dev server and re-run.`);
  process.exit(2);
}

const serverLog = path.join(SCRATCH, 'server.log');
const logFd = fs.openSync(serverLog, 'a');
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB },
  stdio: ['ignore', logFd, logFd],
});

async function shutdown(code: number): Promise<never> {
  server.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 400));
  if (server.exitCode === null) server.kill('SIGKILL');
  process.exit(code);
}

{
  const deadline = Date.now() + 45_000;
  let up = false;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      console.error(`server exited early (code ${server.exitCode}). Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
      process.exit(1);
    }
    try { if ((await fetch(`${BASE}/channels`)).ok) { up = true; break; } } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!up) {
    console.error(`server did not come up. Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
    await shutdown(1);
  }
}

async function post(pathname: string, body: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}
async function get(pathname: string): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE}${pathname}`);
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}
async function reassign(
  channelId: string, fromEntityId: string, toEntityId: string
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE}/channels/${channelId}/entities/${fromEntityId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toEntityId }),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

/** Raw PATCH — the caller owns the bytes and the headers. Arm F needs this; `reassign` won't do. */
async function rawPatch(
  channelId: string, fromEntityId: string, body: BodyInit | undefined, headers: Record<string, string>
): Promise<{ status: number; text: string }> {
  const res = await fetch(`${BASE}/channels/${channelId}/entities/${fromEntityId}`, {
    method: 'PATCH', headers, body,
  });
  return { status: res.status, text: (await res.text()).slice(0, 300) };
}

async function sql<T = any>(query: string, ...params: unknown[]): Promise<T[]> {
  const { default: Database } = await import('better-sqlite3');
  const conn = new Database(DB, { readonly: true });
  const rows = conn.prepare(query).all(...(params as any[])) as T[];
  conn.close();
  return rows;
}
/** Write conversation state directly — no message is ever POSTed, so no model is ever called. */
async function seedMessages(
  rows: Array<{ id: string; channelId: string; role: 'user' | 'assistant'; entityId: string | null }>
): Promise<void> {
  const { default: Database } = await import('better-sqlite3');
  const conn = new Database(DB);
  const ins = conn.prepare(
    `INSERT INTO messages (id, channel_id, role, content, status, entity_id)
     VALUES (?, ?, ?, ?, 'complete', ?)`
  );
  for (const r of rows) ins.run(r.id, r.channelId, r.role, `content of ${r.id}`, r.entityId);
  conn.close();
}

try {
  // ── Fixtures ──────────────────────────────────────────────────────────────────
  const mk = async (name: string, handle: string) => {
    const r = await post('/entities', { name, handle, systemPrompt: `You are ${name}.` });
    if (r.status !== 201) { console.error(`fixture entity ${name} failed`, r); await shutdown(1); }
    return r.json.id as string;
  };
  const PIPER = await mk('Piper Morgan', 'piper');
  const VESPER = await mk('Vesper', 'vesper');
  const MINTED = await mk('Piper Morgan (imported)', 'piper-imported');
  const ORBIT = await mk('Orbit', 'orbit');

  // ── Arm A — the contract as documented ────────────────────────────────────────
  //
  // Daedalus's memo §1 states the path, the body key, and six response fields. Checked
  // against a live socket rather than against the memo.
  {
    const ch = await post('/channels', { name: 'A: contract', entityIds: [MINTED] });
    check('A', 'fixture channel created', ch.status === 201, `status ${ch.status}`);
    const r = await reassign(ch.json.id, MINTED, PIPER);
    check('A', 'PATCH /api/channels/:id/entities/:entityId returns 200 over a socket',
      r.status === 200, `status ${r.status} — ${JSON.stringify(r.json?.error ?? '')}`);
    const fields = ['channelId', 'fromEntityId', 'toEntityId', 'messagesReassigned', 'fromEntityOrphaned', 'entities'];
    const missing = fields.filter((f) => !(f in (r.json ?? {})));
    check('A', 'the body carries all six documented fields', missing.length === 0,
      missing.length === 0 ? `fields=${fields.join(', ')}` : `MISSING: ${missing.join(', ')}`);
    check('A', 'the echoed ids are the ones sent',
      r.json?.channelId === ch.json.id && r.json?.fromEntityId === MINTED && r.json?.toEntityId === PIPER,
      `channelId/${r.json?.channelId === ch.json.id} from/${r.json?.fromEntityId === MINTED} to/${r.json?.toEntityId === PIPER}`);
    check('A', 'the roster in the response is the post-move roster',
      Array.isArray(r.json?.entities) && r.json.entities.length === 1 && r.json.entities[0].id === PIPER,
      `entities=${JSON.stringify(r.json?.entities?.map((e: any) => e.name))}`);
    // The roster the response claims and the roster a fresh GET reports must agree —
    // a response body assembled from stale in-request state would pass the line above.
    const dbg = await get(`/channels/${ch.json.id}/prompt-debug`);
    check('A', 'and a fresh read of the channel agrees with it',
      dbg.json?.entityId === PIPER,
      `prompt-debug entityId=${dbg.json?.entityId}`);
  }

  // ── Arm B — the stamps move with the seat ─────────────────────────────────────
  //
  // My A5 invariant, and the reason this endpoint exists rather than POST-then-DELETE.
  // The load-bearing read is `messages.entity_id` AFTER the join row moved: an
  // implementation that moved only the roster passes every roster check and fails here.
  {
    const ch = await post('/channels', { name: 'B: stamps', entityIds: [MINTED] });
    const CID = ch.json.id as string;
    await seedMessages([
      { id: 'b-u1', channelId: CID, role: 'user', entityId: null },
      { id: 'b-a1', channelId: CID, role: 'assistant', entityId: MINTED },
      { id: 'b-a2', channelId: CID, role: 'assistant', entityId: MINTED },
      { id: 'b-u2', channelId: CID, role: 'user', entityId: null },
    ]);
    const r = await reassign(CID, MINTED, PIPER);
    check('B', 'the reassign reports the number of stamps it moved',
      r.json?.messagesReassigned === 2, `messagesReassigned=${r.json?.messagesReassigned} (seeded 2 assistant rows)`);

    // `role` is selected, not inferred from the id prefix: the first draft of this arm
    // filtered on `m.role === undefined` against a projection that never included `role`,
    // so the filter matched every row and the check failed on correct behaviour.
    const after = await sql<{ id: string; role: string; entity_id: string | null }>(
      'SELECT id, role, entity_id FROM messages WHERE channel_id = ? ORDER BY id', CID);
    const stamped = after.filter((m) => m.entity_id === PIPER).map((m) => m.id);
    check('B', "every assistant stamp now names the target, read back from the file",
      stamped.length === 2 && stamped.includes('b-a1') && stamped.includes('b-a2'),
      `rows on target=${JSON.stringify(stamped)}`);
    check('B', 'no stamp is left pointing at the vacated entity',
      after.every((m) => m.entity_id !== MINTED),
      `rows still on source=${JSON.stringify(after.filter((m) => m.entity_id === MINTED).map((m) => m.id))}`);
    // Daedalus's mutation 3 — scoping the move to the channel rather than to the departing
    // agent — is the one this catches. User messages belong to the roster, and the
    // assembly query's NULL branch already assumes it.
    const userRows = after.filter((m) => m.role === 'user');
    check('B', 'user messages are still NULL — the move is scoped to the agent, not the channel',
      userRows.length === 2 && userRows.every((m) => m.entity_id === null),
      `user rows=${JSON.stringify(userRows.map((m) => [m.id, m.entity_id]))}`);
  }

  // ── Arm C — `added_at` survives ───────────────────────────────────────────────
  //
  // `getChannelEntities` orders by `added_at`, so a fresh `datetime('now')` would shuffle
  // the reassigned agent to the end of a klatch roster. A 1:1 cannot show this — there is
  // only one seat to order. Driven on a klatch, which is the shape that can regress, and
  // the seats are inserted with distinct stamps so the ordering is not a coin flip.
  {
    const ch = await post('/channels', { name: 'C: roster order', type: 'klatch', entityIds: [MINTED, VESPER, ORBIT] });
    check('C', 'a three-seat klatch was created', ch.status === 201, `status ${ch.status}`);
    const CID = ch.json.id as string;
    {
      const { default: Database } = await import('better-sqlite3');
      const conn = new Database(DB);
      const setAt = conn.prepare('UPDATE channel_entities SET added_at = ? WHERE channel_id = ? AND entity_id = ?');
      setAt.run('2026-01-01 00:00:01', CID, MINTED);
      setAt.run('2026-01-01 00:00:02', CID, VESPER);
      setAt.run('2026-01-01 00:00:03', CID, ORBIT);
      conn.close();
    }
    const before = (await get(`/channels/${CID}/prompt-debug`)).json?.participants?.map((p: any) => p.id);
    check('C', 'the seeded roster order is MINTED, VESPER, ORBIT',
      JSON.stringify(before) === JSON.stringify([MINTED, VESPER, ORBIT]),
      `order=${JSON.stringify(before)}`);

    const r = await reassign(CID, MINTED, PIPER);
    check('C', 'reassigning the FIRST seat of a klatch is accepted', r.status === 200, `status ${r.status}`);
    const after = r.json?.entities?.map((e: any) => e.id);
    // Named rather than raw uuids: the first draft printed two id arrays, and when the
    // mutation hit, "order=[…]" and "would give […]" were character-identical — which is
    // the loudest possible signal rendered as the most confusing one.
    const nameOf = (id: string) => ({ [PIPER]: 'PIPER', [VESPER]: 'VESPER', [ORBIT]: 'ORBIT', [MINTED]: 'MINTED' }[id] ?? id.slice(0, 8));
    const isBugOrder = JSON.stringify(after) === JSON.stringify([VESPER, ORBIT, PIPER]);
    check('C', 'the reassigned agent holds the seat position, it does not move to the end',
      JSON.stringify(after) === JSON.stringify([PIPER, VESPER, ORBIT]),
      `order=[${(after ?? []).map(nameOf).join(', ')}] · want [PIPER, VESPER, ORBIT]${isBugOrder ? ' — this is EXACTLY the end-of-roster order a fresh added_at produces' : ''}`);
    const stamp = (await sql<{ added_at: string }>(
      'SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?', CID, PIPER))[0];
    check('C', 'and the stamp itself is the vacating seat\'s, not a fresh one',
      stamp?.added_at === '2026-01-01 00:00:01', `added_at=${JSON.stringify(stamp?.added_at)}`);
    check('C', 'the other two seats were not touched',
      (await sql('SELECT 1 FROM channel_entities WHERE channel_id = ? AND entity_id IN (?, ?)', CID, VESPER, ORBIT)).length === 2,
      'VESPER and ORBIT still bound');
  }

  // ── Arm D — the five refusals ─────────────────────────────────────────────────
  //
  // Daedalus's §1 gives each refusal its own status "because each means a different thing
  // to the operator", and the client wrapper surfaces the server's sentence precisely
  // because `statusText` flattens three of the five to "Not Found". So the sentence is
  // part of the contract, not decoration — checked as such, distinctly, not just the code.
  {
    const ch = await post('/channels', { name: 'D: refusals', entityIds: [MINTED] });
    const CID = ch.json.id as string;
    const cases: Array<[string, () => Promise<{ status: number; json: any }>, number, RegExp]> = [
      ['channel not found', () => reassign('no-such-channel', MINTED, PIPER), 404, /Channel not found/],
      ['target entity not found', () => reassign(CID, MINTED, 'no-such-entity'), 404, /Entity not found/],
      ['source not bound (stale read)', () => reassign(CID, VESPER, PIPER), 404, /not assigned to this channel/],
      ['from === to', () => reassign(CID, MINTED, MINTED), 400, /already bound to that entity/],
      ['missing toEntityId', () => fetch(`${BASE}/channels/${CID}/entities/${MINTED}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      }).then(async (res) => ({ status: res.status, json: await res.json().catch(() => null) })), 400, /toEntityId is required/],
    ];
    for (const [label, run, wantStatus, wantMsg] of cases) {
      const r = await run();
      check('D', `${label} → ${wantStatus} with its own sentence`,
        r.status === wantStatus && wantMsg.test(r.json?.error ?? ''),
        `status ${r.status} — ${JSON.stringify(r.json?.error)}`);
    }
    // 409 needs a two-seat channel: the target must already hold a seat.
    const klatch = await post('/channels', { name: 'D: merge attempt', type: 'klatch', entityIds: [MINTED, VESPER] });
    const r409 = await reassign(klatch.json.id, MINTED, VESPER);
    check('D', 'target already on the roster → 409, not a silent seat merge',
      r409.status === 409 && /already assigned to this channel/.test(r409.json?.error ?? ''),
      `status ${r409.status} — ${JSON.stringify(r409.json?.error)}`);

    // Every refusal must be a refusal all the way down: nothing moved.
    const stillBound = await sql('SELECT 1 FROM channel_entities WHERE channel_id = ? AND entity_id = ?', CID, MINTED);
    check('D', 'after five refusals the original binding is untouched',
      stillBound.length === 1, `MINTED still bound to the D channel: ${stillBound.length === 1}`);
    const klatchSeats = await sql<{ entity_id: string }>(
      'SELECT entity_id FROM channel_entities WHERE channel_id = ?', klatch.json.id);
    check('D', 'and the 409 left both seats of the klatch in place',
      klatchSeats.length === 2, `seats=${klatchSeats.length}`);
  }

  // ── Arm E — the orphan is reported, not deleted ───────────────────────────────
  //
  // The motivating case: the import minted an entity, the operator immediately rebinds
  // away from it, and that entity is now holding nothing anywhere. Daedalus deliberately
  // reports rather than deletes — "that is precisely the hidden-second-effect shape the
  // whole endpoint exists to prevent". The check that matters is that the agent is STILL
  // THERE afterwards, which no roster assertion covers.
  {
    // A dedicated entity, minted here and seated exactly once. The first draft reused
    // ORBIT, which arm C had already seated in its klatch — so `fromEntityOrphaned: false`
    // was the correct answer to a question this arm did not mean to ask. An orphan arm has
    // to own its fixture.
    const SOLO = await mk('Minted And Abandoned', 'solo');
    const ch = await post('/channels', { name: 'E: orphan', entityIds: [SOLO] });
    const r = await reassign(ch.json.id, SOLO, PIPER);
    check('E', 'an entity left holding nothing is reported as orphaned',
      r.json?.fromEntityOrphaned === true, `fromEntityOrphaned=${r.json?.fromEntityOrphaned}`);
    const stillExists = await get(`/entities`);
    check('E', 'and it still exists — the route reports, it does not delete',
      (stillExists.json ?? []).some((e: any) => e.id === SOLO),
      `SOLO present in GET /entities: ${(stillExists.json ?? []).some((e: any) => e.id === SOLO)}`);
    check('E', 'nor did it delete the vacated seat\'s messages or leave it bound anywhere',
      (await sql('SELECT 1 FROM channel_entities WHERE entity_id = ?', SOLO)).length === 0,
      'SOLO holds zero seats — orphaned exactly as reported');

    // The negative: an entity still seated elsewhere is NOT orphaned. Without this, the
    // check above is equally consistent with the field being hardcoded true.
    const keep1 = await post('/channels', { name: 'E: vesper here', entityIds: [VESPER] });
    const keep2 = await post('/channels', { name: 'E: vesper there too', entityIds: [VESPER] });
    const r2 = await reassign(keep1.json.id, VESPER, PIPER);
    check('E', 'an entity still seated elsewhere is NOT orphaned',
      r2.json?.fromEntityOrphaned === false,
      `fromEntityOrphaned=${r2.json?.fromEntityOrphaned} (VESPER still holds a seat in ${keep2.json.id})`);

    // And the default entity is never reported orphaned, whatever its seat count.
    const def = await post('/channels', { name: 'E: default seat' });
    const rDef = await reassign(def.json.id, DEFAULT_ENTITY_ID, ORBIT);
    check('E', 'the default entity is never reported orphaned',
      rDef.status === 200 && rDef.json?.fromEntityOrphaned === false,
      `status ${rDef.status} · fromEntityOrphaned=${rDef.json?.fromEntityOrphaned}`);
  }

  // ── Arm F — malformed and absent bodies ───────────────────────────────────────
  //
  // THE arm this probe exists for. `app.request` is always handed a Request the test
  // built, so the body is always well-formed JSON; a socket client can send anything.
  // The route does `await c.req.json<{ toEntityId: string }>()` with no guard, so the
  // question is what Hono does when that throws. Measured, not assumed.
  {
    const ch = await post('/channels', { name: 'F: bodies', entityIds: [MINTED] });
    const CID = ch.json.id as string;
    const cases: Array<[string, BodyInit | undefined, Record<string, string>]> = [
      ['no body at all', undefined, {}],
      ['empty string body, JSON content-type', '', { 'Content-Type': 'application/json' }],
      ['invalid JSON', '{ not json', { 'Content-Type': 'application/json' }],
      ['valid JSON, wrong shape (array)', '[]', { 'Content-Type': 'application/json' }],
      ['valid JSON, toEntityId is a number', '{"toEntityId":42}', { 'Content-Type': 'application/json' }],
      ['form-encoded instead of JSON', `toEntityId=${PIPER}`, { 'Content-Type': 'application/x-www-form-urlencoded' }],
    ];
    for (const [label, body, headers] of cases) {
      const r = await rawPatch(CID, MINTED, body, headers);
      measure('F', label, `status ${r.status} — ${JSON.stringify(r.text)}`);
    }
    // Whatever the status, the invariant that matters is that a malformed request is
    // inert: it must not have moved anything. THIS is the regression assertion.
    const stillBound = await sql('SELECT 1 FROM channel_entities WHERE channel_id = ? AND entity_id = ?', CID, MINTED);
    check('F', 'no malformed body moved a seat',
      stillBound.length === 1, `MINTED still bound after six malformed requests: ${stillBound.length === 1}`);
    const up = await get('/channels');
    check('F', 'and the server is still serving after all six', up.status === 200, `GET /channels → ${up.status}`);
  }

  // ── Arm G — the control: is the 500 Round 212's, or the repo's? ───────────────
  //
  // Arm F shows three malformed-body shapes returning 500 from the reassign route. Before
  // that gets written up as a defect in a two-hour-old endpoint, the question is whether
  // any *older* route behaves differently. `await c.req.json()` appears at 15 sites under
  // routes/ and none is inside a try/catch, so the prediction is that they all do this —
  // but a grep is not a run. Driven against two routes that predate Round 212 by months.
  {
    const older: Array<[string, string]> = [
      ['POST /channels (predates 212)', '/channels'],
      ['POST /entities (predates 212)', '/entities'],
    ];
    const statuses: number[] = [];
    for (const [label, pathname] of older) {
      const res = await fetch(`${BASE}${pathname}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{ not json',
      });
      statuses.push(res.status);
      measure('G', `${label} with invalid JSON`, `status ${res.status} — ${JSON.stringify((await res.text()).slice(0, 120))}`);
    }
    check('G', 'the 500 is the repo-wide default, not something Round 212 introduced',
      statuses.every((s) => s === 500),
      `older routes returned ${JSON.stringify(statuses)} — ${statuses.every((s) => s === 500)
        ? 'identical to the reassign route, so this is pre-existing and systemic'
        : 'DIFFERENT from the reassign route, which would make it a Round 212 regression'}`);
    measure('G', 'the size of it',
      `${execFileSync('bash', ['-c', "grep -rn 'await c.req.json' packages/server/src/routes/ | wc -l"], { cwd: REPO, encoding: 'utf8' }).trim()} unguarded c.req.json() sites under routes/`);
  }

  // ── Report ────────────────────────────────────────────────────────────────────
  const diffAfter = packagesDiff();
  const clean = diffAfter === diffBefore;
  check('Z', 'packages/ untouched by this probe', clean,
    clean ? `git diff --stat -- packages/ unchanged (${diffBefore === '' ? 'empty' : 'same as before'})` : `CHANGED:\n${diffAfter}`);
  check('Z', "xian's klatch.db was never the target",
    process.env.KLATCH_DB === undefined || process.env.KLATCH_DB === DB, `server ran against ${DB}`);

  const reg = results.filter((r) => r.kind === 'regression');
  const open = results.filter((r) => r.kind === 'open');
  const meas = results.filter((r) => r.kind === 'measurement');
  const regFailed = reg.filter((r) => !r.pass);

  console.log('\n──────── summary ────────');
  console.log(`regression: ${reg.length - regFailed.length}/${reg.length} passed`);
  console.log(`open:       ${open.filter((r) => r.pass).length}/${open.length} now passing`);
  console.log(`measurement:${meas.length} recorded`);
  if (regFailed.length > 0) {
    console.log('\nFAILED:');
    for (const r of regFailed) console.log(`  [${r.arm}] ${r.check} — ${r.detail}`);
  }
  await shutdown(regFailed.length > 0 ? 1 : 0);
} catch (err) {
  console.error(err);
  await shutdown(1);
}
