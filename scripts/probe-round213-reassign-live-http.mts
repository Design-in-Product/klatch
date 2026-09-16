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
 *   F  malformed and absent request bodies                                     [regression]
 *   G  the guard is universal — all 15 JSON-body routes, over the wire         [regression]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163.
 *
 * ── Round 215 (Theseus, 2026-09-15 WORK) ─────────────────────────────────────────────
 * Arms F and G found the unguarded `c.req.json()` 500 and established it was systemic, not
 * Round 212's. Daedalus guarded all 15 sites the same day (`readJsonBody`, `ed099d11`) and
 * wrote: "your probe's arm F/G assertions will now fail against the fixed server. Retiring
 * or re-aiming them is yours." Both halves of that turned out to need care:
 *
 *   - **Arm F had no assertions to fail.** All six malformed-body cases were `measure()`,
 *     because in Round 213 the 500 *was* the finding and there was no contract to pin.
 *     Six measurements went 500 → 400 in silence. They are checks now, and they pin the
 *     split Daedalus deliberately kept: bad bytes get the guard's sentence, well-formed
 *     JSON of the wrong shape keeps the route's own.
 *   - **Arm G's one assertion went red with a false sentence** — it printed "DIFFERENT from
 *     the reassign route, which would make it a Round 212 regression" while the reassign
 *     route was behaving identically. It never read that side of the comparison. Detail in
 *     the arm. Re-aimed from "is the 500 systemic?" (closed) to "is the guard universal?"
 *     (live, and the thing a new route can regress).
 *
 * ── Round 217 (Theseus, 2026-09-15 STOP) ─────────────────────────────────────────────
 * Argus re-ran this probe unmodified against Round 216 and got 42/42 — green, with a MEAS
 * line inside arm G that had gone false underneath it. Same failure mode as arm F one round
 * earlier, one level up: arm F was a measurement that could not notice its subject got fixed;
 * this was a measurement whose LABEL asserted "the unfixed sibling" over an output showing it
 * fixed. The count in the same line was wrong too, from a grep with no exclusion for the
 * helper's own file, so it counted a docstring as a call site. Both closed in arm G below,
 * and the general lesson is written there rather than here: **a MEAS whose label makes a
 * claim is a check with no assertion behind it.** The full six-site sweep the fix earns is a
 * separate probe — `probe-round217-multipart-guard-live-http.mts`.
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
): Promise<{ status: number; text: string; contentType: string | null }> {
  const res = await fetch(`${BASE}/channels/${channelId}/entities/${fromEntityId}`, {
    method: 'PATCH', headers, body,
  });
  // Round 215: the content-type is now load-bearing, not decoration. A 400 whose body is
  // `text/plain` is a correct status code hiding the same failure the 500 had — every
  // wrapper in `api/client.ts` recovers the sentence via `res.json().catch(() => null)`.
  return { status: res.status, text: (await res.text()).slice(0, 300), contentType: res.headers.get('content-type') };
}

/** Write straight to the scratch DB. Arm G needs a resolvable resource, not a real upload. */
async function sqlWrite(query: string, ...params: unknown[]): Promise<void> {
  const { default: Database } = await import('better-sqlite3');
  const conn = new Database(DB);
  conn.prepare(query).run(...(params as any[]));
  conn.close();
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
    const GUARD = 'Request body must be valid JSON';
    const SHAPE = 'toEntityId is required';
    const cases: Array<[string, BodyInit | undefined, Record<string, string>, string]> = [
      ['no body at all', undefined, {}, GUARD],
      ['empty string body, JSON content-type', '', { 'Content-Type': 'application/json' }, GUARD],
      ['invalid JSON', '{ not json', { 'Content-Type': 'application/json' }, GUARD],
      ['valid JSON, wrong shape (array)', '[]', { 'Content-Type': 'application/json' }, SHAPE],
      ['valid JSON, toEntityId is a number', '{"toEntityId":42}', { 'Content-Type': 'application/json' }, SHAPE],
      ['form-encoded instead of JSON', `toEntityId=${PIPER}`, { 'Content-Type': 'application/x-www-form-urlencoded' }, GUARD],
    ];
    // ── Round 215 re-aim ────────────────────────────────────────────────────────
    // These six were measurements in Round 213 because the answer (500) was the finding
    // and there was no contract to pin. `readJsonBody` (Daedalus, `ed099d11`) gives them
    // one, so they become checks. Note for the record: Daedalus predicted "your probe's
    // arm F/G assertions will now fail against the fixed server." Half right, and the
    // half he was wrong about is the reason this edit exists — **arm F had no assertions
    // to fail.** Six measurements went from 500 to 400 in silence. A probe that only
    // measures cannot notice that the thing it measured got fixed.
    //
    // Two contracts, deliberately different, and the split is the thing worth pinning:
    // bytes-that-aren't-JSON get the guard's sentence; well-formed JSON of the wrong
    // shape keeps the *route's own* sentence. Daedalus kept shape validation out of the
    // helper on purpose ("a generic 'must be an object' would be a worse sentence"), and
    // his own mutation 4 was a route that let the guard take it over. This is the check
    // that goes red if someone later collapses the two.
    for (const [label, body, headers, expected] of cases) {
      const r = await rawPatch(CID, MINTED, body, headers);
      let parsed: any = null;
      try { parsed = JSON.parse(r.text); } catch { /* stays null — that IS the failure */ }
      check('F', `${label} → 400 with a recoverable sentence`,
        r.status === 400 && parsed?.error === expected,
        `status ${r.status} · content-type=${r.contentType ?? '(none)'} · ${
          parsed === null
            ? `body did NOT parse as JSON: ${JSON.stringify(r.text)} — api/client.ts does res.json().catch(() => null), so this flattens to statusText`
            : `error=${JSON.stringify(parsed.error)} (expected ${JSON.stringify(expected)})`}`);
    }
    // Whatever the status, the invariant that matters is that a malformed request is
    // inert: it must not have moved anything. THIS is the regression assertion.
    const stillBound = await sql('SELECT 1 FROM channel_entities WHERE channel_id = ? AND entity_id = ?', CID, MINTED);
    check('F', 'no malformed body moved a seat',
      stillBound.length === 1, `MINTED still bound after six malformed requests: ${stillBound.length === 1}`);
    const up = await get('/channels');
    check('F', 'and the server is still serving after all six', up.status === 200, `GET /channels → ${up.status}`);
  }

  // ── Arm G — is the guard universal, or only where someone looked? ─────────────
  //
  // ── Round 215 re-aim (Theseus, 2026-09-15 WORK) ──────────────────────────────
  // Round 213's arm G was a control with one job: decide whether arm F's 500 was a defect
  // in a two-hour-old endpoint or the repo's default. It answered "the repo's" — two older
  // routes returned 500 too — and Daedalus fixed all 15 sites the same day (`ed099d11`).
  //
  // **The check did not just go red. It went red with a false sentence**, and that is worth
  // more than the re-aim. It asserted `statuses.every(s => s === 500)` and printed, on
  // failure: "DIFFERENT from the reassign route, which would make it a Round 212
  // regression." The older routes now return 400 — and so does the reassign route. They are
  // identical. The message asserted a comparison the check never made: it only ever read
  // the older routes' statuses, and inferred the reassign route's from an assumption that
  // was true the day it was written. Anyone reading that output at face value would have
  // reported a regression in Daedalus's endpoint that does not exist.
  //
  // Second instance of the same class in one fire — arm M of `probe-round162` printed
  // `literal="${DEFAULT_CHANNEL_PREAMBLE}"` as though it were drift. Both are failure
  // messages that state a *conclusion* instead of an *observation*. The rule that falls out:
  // **a check may print what it read; it may not print what that implies.** Everything below
  // reads both sides of every comparison it reports.
  //
  // The 500 question is closed, so arm G takes the question the fix opened: the guard is
  // applied site-by-site, which means the next route someone adds re-introduces the 500 at
  // that site with the whole suite green. Two checks, source and wire, neither sufficient
  // alone.
  {
    // ── G1 — every JSON-body route, over the wire, not a sample of two ───────────
    //
    // Enumerated from source rather than hand-listed, then driven. ZERO MODEL CALLS holds:
    // `POST /channels/:id/messages` is refused at the body read, well before generation.
    //
    // **First run of this arm was 1-red, and the red was mine.** I wrote, as the reason
    // all 15 were tractable with throwaway ids, "readJsonBody runs before any path/id
    // resolution, so a nonexistent id in the URL doesn't change the answer." That is true
    // of 14 routes and false of `POST /files/:id/promote`, which calls `getFile()` and
    // returns 404 *before* the body read (`files.ts:315-319`). So the probe reported
    // `404 File not found` as a guard failure.
    //
    // Checked the route before believing the output, the same way Round 213's arm E
    // fixture-reuse red turned out to be mine. Fixed by giving the route a real file row
    // rather than by dropping the route or loosening the check — a 404-before-400 is
    // correct behaviour and the guard still needs driving behind it. The row goes straight
    // into the scratch DB (same idiom as `seedMessages`); `promote` only needs `getFile()`
    // to resolve before it reads the body, so no bytes need to exist on disk.
    await sqlWrite(
      `INSERT INTO files (id, name, mime_type, size_bytes, storage_key) VALUES (?, ?, ?, ?, ?)`,
      'probe215-file', 'arm-g-fixture.txt', 'text/plain', 11, 'probe215/arm-g-fixture.txt');
    const siteCount = execFileSync('bash', ['-c',
      "grep -rn 'readJsonBody<' packages/server/src/routes/ | grep -v json-body.ts | wc -l"],
      { cwd: REPO, encoding: 'utf8' }).trim();
    const routes: Array<[string, string, string]> = [
      ['POST', '/channels', 'channels.ts:143'],
      ['PATCH', '/channels/default', 'channels.ts:225'],
      ['POST', '/projects', 'projects.ts:22'],
      ['PATCH', '/projects/no-such-project', 'projects.ts:45'],
      ['POST', '/entities', 'entities.ts:51'],
      ['PATCH', '/entities/no-such-entity', 'entities.ts:99'],
      ['POST', '/channels/default/entities', 'entities.ts:202'],
      ['PATCH', '/channels/default/entities/no-such-entity', 'entities.ts:259'],
      ['POST', '/channels/default/messages', 'messages.ts:74'],
      ['POST', '/files/pin', 'files.ts:246'],
      ['POST', '/files/probe215-file/promote', 'files.ts:321'],
      ['POST', '/import/claude-code', 'import.ts:201'],
      ['POST', '/import/claude-ai/preview', 'import.ts:504'],
      ['POST', '/import/claude-ai', 'import.ts:636'],
      ['POST', '/import/klatch', 'import.ts:930'],
    ];
    const bad: string[] = [];
    for (const [method, pathname, site] of routes) {
      const res = await fetch(`${BASE}${pathname}`, {
        method, headers: { 'Content-Type': 'application/json' }, body: '{ not json',
      });
      const text = (await res.text()).slice(0, 200);
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { /* null is the failure */ }
      const ok = res.status === 400 && typeof parsed?.error === 'string' && parsed.error.length > 0;
      if (!ok) bad.push(`${method} ${pathname} (${site}) → ${res.status} ${res.headers.get('content-type')} ${JSON.stringify(text)}`);
    }
    check('G', `all ${routes.length} JSON-body routes refuse malformed bytes with 400 + a JSON sentence`,
      bad.length === 0,
      bad.length === 0
        ? `${routes.length} routes driven over the wire, every one 400 with a parseable {error}; source reports ${siteCount} readJsonBody call sites`
        : `${bad.length} of ${routes.length} did not: ${bad.join(' | ')}`);
    check('G', 'the enumeration is complete — as many routes driven as call sites in source',
      routes.length === Number(siteCount),
      `drove ${routes.length} · source has ${siteCount} readJsonBody call sites — if these diverge, a site was added and this list was not updated`);

    // ── G2 — and no bare c.req.json() anywhere outside the helper ────────────────
    //
    // G1 can only drive routes this list names. G2 does not depend on the list: it is the
    // anti-reintroduction check, the same shape as arm M's sweep in probe-round162. The
    // helper's own call is the one legitimate occurrence.
    const bare = execFileSync('bash', ['-c',
      "grep -rn 'await c.req.json' packages/server/src/routes/ | grep -v 'json-body.ts' || true"],
      { cwd: REPO, encoding: 'utf8' }).trim();
    check('G', 'no bare c.req.json() survives outside json-body.ts',
      bare === '',
      bare === '' ? 'swept packages/server/src/routes/; the only occurrence is inside readJsonBody itself'
                  : `re-introduced at:\n${bare}`);

    // ── The sibling, no longer unfixed ──────────────────────────────────────────
    //
    // ── Round 217 re-aim (Theseus, 2026-09-15 STOP), on Argus's catch ───────────
    // This was a `measure()` labelled "the unfixed sibling", and by the time Argus re-ran it
    // the label was false on two counts at once — Round 216 (`c46b14a1`) had landed between
    // this probe's last edit and his sweep:
    //
    //   1. The MEAS printed `400 application/json` with the guard's own sentence while the
    //      label around it still said "unfixed". The numbers were right; the editorial
    //      sentence wrapped around them was not. **Third instance of the same class in one
    //      day, and the first one that was mine twice** — this is exactly the rule Round 215
    //      wrote here two checks above: *a check may print what it read, it may not print
    //      what that implies.* Writing the rule did not stop me breaking it in the same file.
    //      A MEAS whose label makes a claim is a check with no assertion behind it; the fix
    //      is to make it a check, not to reword the label.
    //   2. The count grep was `grep 'await c.req.formData()' | wc -l` with **no exclusion for
    //      the helper's own file**, unlike the `readJsonBody` sweep directly above it, which
    //      correctly does `grep -v json-body.ts`. So it counted 2: one real call (inside
    //      `readFormBody`) and one line of PROSE — `form-body.ts`'s docstring, which says
    //      "Use this, not a bare `await c.req.formData()`". A naive grep reddening on the
    //      comment that documents the fix is the precise trap Daedalus's Round 216 §6 built a
    //      line-shape guard against; arm G fell into it in the sibling probe, the same fire.
    //
    // Re-aimed from a stale measurement into the assertion the fix earns. The six-site x
    // five-shape sweep lives in `probe-round217-multipart-guard-live-http.mts`; this stays
    // as the one site arm F drove pre-fix, so this probe's own before/after is self-contained.
    const GUARD_SENTENCE = readConst(
      'packages/server/src/routes/form-body.ts',
      /throw new HTTPException\(400, \{\s*res: c\.json\(\{ error: '([^']+)'/,
      'readFormBody sentence'
    );
    const mp = await fetch(`${BASE}/import/klatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=----probe215' },
      body: 'not a multipart body at all',
    });
    const mpText = (await mp.text()).slice(0, 200);
    let mpErr: string | null = null;
    try { mpErr = JSON.parse(mpText)?.error ?? null; } catch { /* null IS the failure */ }
    check('G', 'the multipart sibling is guarded too — same site arm F drove at 500 before Round 216',
      mp.status === 400 && (mp.headers.get('content-type') ?? '').includes('application/json') && mpErr === GUARD_SENTENCE,
      `POST /import/klatch, broken multipart body → ${mp.status} ${mp.headers.get('content-type')} error=${
        JSON.stringify(mpErr)} (expected ${JSON.stringify(GUARD_SENTENCE)}, read from form-body.ts)`);
    // Same line-shape discipline as the `readJsonBody` sweep above: the CALL form, and the
    // helper's own file excluded. Counting the docstring is what made the old label wrong.
    const bareForm = execFileSync('bash', ['-c',
      "grep -rn 'await c\\.req\\.formData()' packages/server/src/routes/ | grep -v 'form-body.ts' || true"],
      { cwd: REPO, encoding: 'utf8' }).trim();
    check('G', 'no bare c.req.formData() survives outside form-body.ts either',
      bareForm === '',
      bareForm === '' ? 'swept packages/server/src/routes/; the only call is inside readFormBody itself'
                      : `re-introduced at:\n${bareForm}`);
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
