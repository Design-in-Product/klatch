/**
 * Round 168 probe — Round 167's floor *report*, driven at the real HTTP endpoint.
 *
 * Theseus, 2026-09-07 WORK/MID fire. Daedalus landed my Round 167 items 2, 3 and 4 this
 * morning and asked for exactly one thing back:
 *
 *   > Re-drive the endpoint if it's cheap — specifically `'7_floor'` on both the floored
 *   > and the boilerplate-as-identity agent, since that pair is the whole point of the
 *   > implementation and my confidence in it is unit-test-deep, not endpoint-deep.
 *
 * That pair is arm A, and it is the reason this probe exists. The pair matters because
 * the two agents produce a **byte-identical 28-character assembled prompt** and must
 * report opposite floor states:
 *
 *   - the floored agent   — `parts` empty, boilerplate substituted   → `7_floor` ACTIVE
 *   - boilerplate-as-identity — `parts = [boilerplate]`, floor silent → `7_floor` INACTIVE
 *
 * Any implementation that derives the report from the output string (`assembled ===
 * PREAMBLE`, `assembledLength === 28`) passes every ordinary case and gets this pair
 * exactly backwards on one side. Daedalus says he verified the predicate is load-bearing
 * by breaking it in a unit test; this drives the same divergence through real HTTP, over
 * every room shape the app can produce, including the *seeded default agent* — which is
 * the boilerplate-as-identity case every fresh install ships with.
 *
 * Run:  npx tsx scripts/probe-round167-floor-report-live.mts
 *
 * ZERO MODEL CALLS. Every arm reads `/api/channels/:id/prompt-debug`, which assembles the
 * prompt the API *would* be sent and returns it without sending it. `/aaxt-probe` and
 * `/aaxt-run` are deliberately NOT called — both spend the auxiliary model, which is why
 * the two `aaxt.ts` report sites are checked by source comparison (arm F) and said so.
 * Scratch DB via KLATCH_DB under `.testdata/`; xian's `klatch.db` is never opened.
 * Nothing under `packages/` is written — asserted at exit (arm Z), not assumed.
 *
 * Arms:
 *   A  THE PAIR — identical 28-char output, opposite floor reports        [regression]
 *   B  the report is ACTIVE in every room where the floor actually fires  [regression]
 *   C  the report is INACTIVE in every room where a layer assembled       [regression]
 *   D  the key exists in every shape a caller can ask for                 [regression]
 *   E  what the report and the length say together, room by room          [measurement]
 *   F  the three report sites, compared in source (aaxt costs model)      [measurement]
 *   G  Round 167 items 3 and 4 re-driven at the endpoint                  [regression]
 *   H  the layer-6 asymmetry (item 1), re-measured under the new report   [open]
 *   J  how a user reaches the floored room — Daedalus's frequency ask     [open]
 *   Z  the probe wrote nothing under packages/                            [regression]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163/165/167.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round167-floor-report');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}/api`;

// Read from source so a rename can't stale the probe.
function readConst(file: string, re: RegExp, what: string): string {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const m = src.match(re);
  if (!m) throw new Error(`could not read ${what} from ${file}`);
  return m[1];
}
const DEFAULT_ENTITY_ID = readConst('packages/shared/src/types.ts', /export const DEFAULT_ENTITY_ID = '([^']+)'/, 'DEFAULT_ENTITY_ID');
const PREAMBLE = readConst('packages/shared/src/types.ts', /export const DEFAULT_CHANNEL_PREAMBLE = '([^']+)'/, 'DEFAULT_CHANNEL_PREAMBLE');

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

async function req(method: string, pathname: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}
const post = (p: string, b: unknown) => req('POST', p, b);
const patch = (p: string, b: unknown) => req('PATCH', p, b);
const get = (p: string) => req('GET', p);

/** Drives the exact shape client.ts `uploadClaudeCodeSession` sends. */
async function postMultipart(url: string, filePath: string, fields: Record<string, string>) {
  const fd = new FormData();
  const bytes = fs.readFileSync(filePath);
  fd.append('file', new Blob([bytes], { type: 'application/jsonl' }), path.basename(filePath));
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(`${BASE}${url}`, { method: 'POST', body: fd });
  return { status: res.status, json: await res.json().catch(() => ({})) as any };
}

const { default: Database } = await import('better-sqlite3');
function sqlOpen(readonly = true) { return new Database(DB, { readonly }); }
function storedEntityPrompt(entityId: string): string | null {
  const conn = sqlOpen();
  const row = conn.prepare('SELECT system_prompt FROM entities WHERE id = ?').get(entityId) as { system_prompt: string | null } | undefined;
  conn.close();
  return row ? row.system_prompt : null;
}
function entityByName(name: string): { id: string; system_prompt: string } | undefined {
  const conn = sqlOpen();
  const row = conn.prepare('SELECT id, system_prompt FROM entities WHERE name = ?').get(name) as any;
  conn.close();
  return row;
}

/**
 * The report predicate, stated once. `7_floor` is a prose string, so a probe that
 * matched it exactly would break on any rewording and tell us nothing about the
 * behaviour. What is load-bearing is the ACTIVE/INACTIVE verdict at char 0 — that is
 * what a reader and an AAXT consumer both key on.
 */
function floorVerdict(dbg: any): 'ACTIVE' | 'INACTIVE' | 'MISSING' | 'MALFORMED' {
  const s = dbg?.layers?.['7_floor'];
  if (typeof s !== 'string') return 'MISSING';
  if (s.startsWith('ACTIVE')) return 'ACTIVE';
  if (s.startsWith('INACTIVE')) return 'INACTIVE';
  return 'MALFORMED';
}

/** Every room this probe visits, so arm E can report the whole table at once. */
const visited: Array<{ room: string; verdict: string; len: number; equalsPreamble: boolean }> = [];
function recordRoom(room: string, dbg: any) {
  visited.push({
    room,
    verdict: floorVerdict(dbg),
    len: dbg?.assembledLength ?? -1,
    equalsPreamble: dbg?.assembledPrompt === PREAMBLE,
  });
}

let uuidN = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++uuidN).padStart(12, '0')}`;
function writeSession(file: string, userLine: string, reply: string): string {
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    { type: 'user', uuid: userUuid, parentUuid: null, sessionId, timestamp: '2026-09-07T09:00:00.000Z', cwd: '/tmp/r168-probe', permissionMode: 'default', message: { role: 'user', content: userLine } },
    { type: 'assistant', uuid: uuid(), parentUuid: userUuid, sessionId, timestamp: '2026-09-07T09:00:05.000Z', cwd: '/tmp/r168-probe', message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: reply }], stop_reason: 'end_turn' } },
  ];
  const p = path.join(SCRATCH, file);
  fs.writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return p;
}

/** A default 1:1 bound to one agent: the most-travelled path, and the one the report is about. */
async function boundChat(name: string, entityId: string, body: Record<string, unknown> = {}): Promise<{ id: string; dbg: any }> {
  const ch = await post('/channels', { name, systemPrompt: PREAMBLE, entityIds: [entityId], ...body });
  if (ch.status !== 201) throw new Error(`channel create failed for ${name}: ${ch.status} ${JSON.stringify(ch.json)}`);
  const dbg = await get(`/channels/${ch.json.id}/prompt-debug`);
  recordRoom(name, dbg.json);
  return { id: ch.json.id as string, dbg: dbg.json };
}

try {
  // ── The two agents the whole probe turns on ──────────────────────────────────
  //
  // FLOORED: a genuinely blank prompt. After Round 166 this is reachable only through
  // the import writers — PATCH substitutes and POST substitutes — so it has to be
  // *imported*, not constructed. Writer six (`import/entity-resolve.ts`) mints one when
  // a confirmed entity name matches nothing.
  const sessionFile = writeSession('minted.jsonl', 'Ship the parser fix.', 'On it.');
  const mintRes = await postMultipart('/import/claude-code', sessionFile, { entityName: 'R168 Floored Agent', channelName: 'R168 minted import' });
  check('A', 'precondition — the claude-code upload path imports', mintRes.status === 201,
    `status ${mintRes.status} disposition=${mintRes.json?.entityDisposition}`);
  const floored = entityByName('R168 Floored Agent');
  check('A', 'precondition — writer six minted an agent with a genuinely blank prompt',
    floored !== undefined && floored.system_prompt === '',
    `stored ${JSON.stringify(floored?.system_prompt)} (${floored?.system_prompt?.length ?? -1} chars)`);
  const FLOORED = floored!.id;

  // BOILERPLATE-AS-IDENTITY: an agent whose stored prompt *is* the 28-character
  // constant. This is not a contrived shape — `entities.ts` writes exactly this
  // whenever a user creates an agent and leaves the prompt blank, and the seeded
  // default agent ships with it. It is the ordinary case, which is what makes a
  // string-derived report dangerous rather than merely imprecise.
  const boiler = await post('/entities', { name: 'R168 Boilerplate Identity', handle: 'boiler168' });
  const BOILER = boiler.json?.id as string;
  check('A', 'precondition — the create route stores the boilerplate as this agent\'s identity',
    storedEntityPrompt(BOILER) === PREAMBLE, `stored ${JSON.stringify(storedEntityPrompt(BOILER))}`);

  // ── Arm A — THE PAIR ─────────────────────────────────────────────────────────
  //
  // Two 1:1s, identical in every respect except which agent is seated. Both assemble to
  // the same 28 bytes. The report must distinguish them.
  const aFloored = await boundChat('R168 1-1 seating the floored agent', FLOORED);
  const aBoiler = await boundChat('R168 1-1 seating the boilerplate-as-identity agent', BOILER);

  check('A', 'the two rooms assemble to a byte-identical prompt',
    aFloored.dbg?.assembledPrompt === aBoiler.dbg?.assembledPrompt && aFloored.dbg?.assembledPrompt === PREAMBLE,
    `floored=${JSON.stringify(aFloored.dbg?.assembledPrompt)} boiler=${JSON.stringify(aBoiler.dbg?.assembledPrompt)}`);
  check('A', 'the two rooms assemble to an identical length',
    aFloored.dbg?.assembledLength === aBoiler.dbg?.assembledLength && aFloored.dbg?.assembledLength === PREAMBLE.length,
    `both ${aFloored.dbg?.assembledLength} (constant is ${PREAMBLE.length})`);

  check('A', 'DAEDALUS\'S ASK, HALF 1 — the floored agent reports 7_floor ACTIVE',
    floorVerdict(aFloored.dbg) === 'ACTIVE',
    `7_floor=${JSON.stringify(aFloored.dbg?.layers?.['7_floor'])}`);
  check('A', 'DAEDALUS\'S ASK, HALF 2 — the boilerplate-as-identity agent reports 7_floor INACTIVE',
    floorVerdict(aBoiler.dbg) === 'INACTIVE',
    `7_floor=${JSON.stringify(aBoiler.dbg?.layers?.['7_floor'])}`);
  check('A', 'THE DIVERGENCE — identical output, opposite report: the report is not a string test',
    floorVerdict(aFloored.dbg) === 'ACTIVE' && floorVerdict(aBoiler.dbg) === 'INACTIVE'
      && aFloored.dbg?.assembledPrompt === aBoiler.dbg?.assembledPrompt,
    `same ${aFloored.dbg?.assembledLength} bytes, verdicts ${floorVerdict(aFloored.dbg)}/${floorVerdict(aBoiler.dbg)}`);

  // The reader-can-tell property, stated the way Round 162 stated it for layer 4: from
  // the report alone, without knowing the constant, can you tell where the 28 characters
  // came from? In the floored room layer 5 says "0 chars" and the floor says ACTIVE; in
  // the boilerplate room layer 5 says "28 chars" and the floor says INACTIVE.
  check('A', 'layer 5 and the floor agree on which one supplied the bytes — floored room',
    /0 chars/.test(aFloored.dbg?.layers?.['5_entityPrompt'] ?? '') && floorVerdict(aFloored.dbg) === 'ACTIVE',
    `5=${JSON.stringify(aFloored.dbg?.layers?.['5_entityPrompt'])}`);
  check('A', 'layer 5 and the floor agree on which one supplied the bytes — boilerplate room',
    new RegExp(`${PREAMBLE.length} chars`).test(aBoiler.dbg?.layers?.['5_entityPrompt'] ?? '') && floorVerdict(aBoiler.dbg) === 'INACTIVE',
    `5=${JSON.stringify(aBoiler.dbg?.layers?.['5_entityPrompt'])}`);

  // The case Daedalus did NOT name and that ships with every install: the seeded default
  // agent is a boilerplate-as-identity agent. If the report were string-derived, the
  // very first room a new user opens would be mislabelled.
  const seedChat = await boundChat('R168 1-1 with the seeded default agent', DEFAULT_ENTITY_ID);
  check('A', 'THE SHIPPED CASE — the seeded default agent\'s own room reports INACTIVE, not ACTIVE',
    floorVerdict(seedChat.dbg) === 'INACTIVE' && seedChat.dbg?.assembledPrompt === PREAMBLE,
    `7_floor=${floorVerdict(seedChat.dbg)}, assembled=${JSON.stringify(seedChat.dbg?.assembledPrompt)} (${seedChat.dbg?.assembledLength} chars)`);

  // ── Arm B — ACTIVE wherever the floor actually fires ─────────────────────────
  //
  // Every room Round 165 reached at 0 chars and Round 166 floored. The Round 167 probe
  // pinned that these assemble to 28 bytes; this pins that they *say so*.
  const klatchNoHistory = await post('/channels', { name: 'R168 klatch, blank seat with no other history', type: 'klatch', systemPrompt: PREAMBLE, entityIds: [FLOORED, BOILER] });
  const kFloored = await get(`/channels/${klatchNoHistory.json?.id}/prompt-debug?entityId=${FLOORED}`);
  recordRoom('R168 klatch seat — floored agent', kFloored.json);
  const kBoiler = await get(`/channels/${klatchNoHistory.json?.id}/prompt-debug?entityId=${BOILER}`);
  recordRoom('R168 klatch seat — boilerplate agent', kBoiler.json);

  measure('B', 'the floored agent in a klatch — layer 6 is in scope there, so this may not floor',
    `6=${JSON.stringify(kFloored.json?.layers?.['6_carriedContext'])} 7=${floorVerdict(kFloored.json)} len=${kFloored.json?.assembledLength}`);
  check('B', 'a klatch seat that floors reports ACTIVE; one that does not reports INACTIVE — never silent either way',
    floorVerdict(kFloored.json) !== 'MISSING' && floorVerdict(kFloored.json) !== 'MALFORMED',
    `verdict=${floorVerdict(kFloored.json)}`);
  check('B', 'the report and the assembly agree in the klatch seat: ACTIVE iff the prompt is exactly the constant',
    (floorVerdict(kFloored.json) === 'ACTIVE') === (kFloored.json?.assembledPrompt === PREAMBLE),
    `verdict=${floorVerdict(kFloored.json)}, assembled is the constant=${kFloored.json?.assembledPrompt === PREAMBLE}, len=${kFloored.json?.assembledLength}`);
  check('B', 'the OTHER seat in the same klatch is reported independently',
    floorVerdict(kBoiler.json) === 'INACTIVE',
    `boilerplate seat verdict=${floorVerdict(kBoiler.json)}, len=${kBoiler.json?.assembledLength}`);

  // A second minted blank, seated in a room with a *default* purpose and no project —
  // the plainest floored room there is, and the one a user actually reaches by importing
  // a session and then starting a fresh chat with that agent.
  const s2 = writeSession('minted2.jsonl', 'Review the schema change.', 'Looks fine.');
  await postMultipart('/import/claude-code', s2, { entityName: 'R168 Second Floored', channelName: 'R168 second import' });
  const floored2 = entityByName('R168 Second Floored');
  const b2 = await boundChat('R168 fresh 1-1 with a second imported blank', floored2!.id);
  check('B', 'the ordinary reachable floored room reports ACTIVE',
    floorVerdict(b2.dbg) === 'ACTIVE' && b2.dbg?.assembledPrompt === PREAMBLE,
    `verdict=${floorVerdict(b2.dbg)}, len=${b2.dbg?.assembledLength}`);

  // ── Arm C — INACTIVE wherever a layer assembled ──────────────────────────────
  //
  // The Round 167 probe proved the floor never *appears* above an identity. This proves
  // it never *claims* to. Each case has content at exactly one layer, so a report that
  // fired on any of them would be over-reporting rather than under-reporting — the
  // failure mode that makes a debug view lie in the safe-looking direction.
  const PIPER_PROMPT = 'You are Piper Morgan, a product manager. PIPER-MARKER-R168';
  const piper = await post('/entities', { name: 'Piper Morgan', handle: 'piper168', systemPrompt: PIPER_PROMPT });
  const PIPER = piper.json?.id as string;

  const c5 = await boundChat('R168 layer 5 only', PIPER);
  check('C', 'layer 5 only — a real identity, floor reports INACTIVE',
    floorVerdict(c5.dbg) === 'INACTIVE', `verdict=${floorVerdict(c5.dbg)}, len=${c5.dbg?.assembledLength}`);

  const PURPOSE = 'This room is for triaging the September import defects. PURPOSE-MARKER-R168';
  const c4 = await boundChat('R168 layer 4 only', FLOORED, { systemPrompt: PURPOSE });
  check('C', 'layer 4 only — a real channel purpose above a blank agent, floor reports INACTIVE',
    floorVerdict(c4.dbg) === 'INACTIVE' && c4.dbg?.assembledPrompt === PURPOSE,
    `verdict=${floorVerdict(c4.dbg)}, len=${c4.dbg?.assembledLength}`);

  const INSTRUCTIONS = 'Klatch project instructions. Verify before asserting. INSTRUCTIONS-MARKER-R168';
  const proj = await post('/projects', { name: 'R168 Project', instructions: INSTRUCTIONS });
  const c2 = await boundChat('R168 layer 2 only', FLOORED, { projectId: proj.json?.id });
  check('C', 'layer 2 only — project instructions above a blank agent, floor reports INACTIVE',
    floorVerdict(c2.dbg) === 'INACTIVE' && c2.dbg?.assembledPrompt === INSTRUCTIONS,
    `verdict=${floorVerdict(c2.dbg)}, len=${c2.dbg?.assembledLength}`);

  // The imported channel's id is assigned by the importer, so find it rather than guess.
  const impChannelId = (await get('/channels')).json?.find((ch: any) => ch.name === 'R168 minted import')?.id;
  const c1 = impChannelId ? await get(`/channels/${impChannelId}/prompt-debug`) : { json: null };
  if (c1.json) recordRoom('R168 imported channel (kit briefing)', c1.json);
  check('C', 'layer 1 only — an imported channel\'s kit briefing above a blank agent, floor reports INACTIVE',
    c1.json !== null && floorVerdict(c1.json) === 'INACTIVE' && (c1.json?.assembledLength ?? 0) > PREAMBLE.length,
    c1.json ? `verdict=${floorVerdict(c1.json)}, len=${c1.json?.assembledLength}, 1=${JSON.stringify(c1.json?.layers?.['1_kitBriefing'])}`
            : 'imported channel "R168 minted import" not found in GET /channels');

  const c45 = await boundChat('R168 layers 4+5', PIPER, { systemPrompt: PURPOSE });
  check('C', 'layers 4+5 — two sources of content, floor reports INACTIVE',
    floorVerdict(c45.dbg) === 'INACTIVE' && c45.dbg?.assembledPrompt === `${PURPOSE}\n\n${PIPER_PROMPT}`,
    `verdict=${floorVerdict(c45.dbg)}, len=${c45.dbg?.assembledLength}`);

  // The adversarial placement case, carried forward from Round 167 arm D and re-asked of
  // the *report* rather than the string: an identity that CONTAINS the boilerplate.
  const CONTAINS = `${PREAMBLE} And specifically, you are the R168 containment control.`;
  const contains = await post('/entities', { name: 'R168 Containment Control', handle: 'contains168', systemPrompt: CONTAINS });
  const cContains = await boundChat('R168 identity containing the boilerplate', contains.json?.id);
  check('C', 'an identity that CONTAINS the boilerplate reports INACTIVE and is passed through once',
    floorVerdict(cContains.dbg) === 'INACTIVE' && cContains.dbg?.assembledPrompt === CONTAINS,
    `verdict=${floorVerdict(cContains.dbg)}, len=${cContains.dbg?.assembledLength} (identity is ${CONTAINS.length})`);

  // ── Arm D — the key exists in every shape a caller can ask for ───────────────
  //
  // A consumer reading `layers` to decide what a prompt was meant to convey needs the key
  // to be *present*, not merely correct when present. The `?entityId=` form is a separate
  // code path through the same handler and is the one AAXT-adjacent callers use.
  const shapes: Array<[string, any]> = [
    ['default entity (no query param)', aFloored.dbg],
    ['?entityId= a named seat', kFloored.json],
    ['a room with a project attached', c2.dbg],
    ['an imported channel', c1.json],
  ];
  for (const [label, dbg] of shapes) {
    const v = floorVerdict(dbg);
    check('D', `7_floor is present and well-formed — ${label}`, v === 'ACTIVE' || v === 'INACTIVE',
      `verdict=${v}, raw=${JSON.stringify(dbg?.layers?.['7_floor'])?.slice(0, 60)}`);
  }
  check('D', 'the floor sorts last in the layer report, after 6_carriedContext',
    Object.keys(aFloored.dbg?.layers ?? {}).slice(-1)[0] === '7_floor',
    `keys=${Object.keys(aFloored.dbg?.layers ?? {}).join(',')}`);

  // ── Arm E — the whole table, so the coupling is visible rather than argued ───
  //
  // ACTIVE must imply "the prompt is exactly the constant". The converse must NOT hold —
  // that is the pair. Printed as a table so the asymmetry is legible in the transcript.
  for (const r of visited) {
    measure('E', `room: ${r.room}`, `7_floor=${r.verdict} len=${r.len} isConstant=${r.equalsPreamble}`);
  }
  const activeRooms = visited.filter((r) => r.verdict === 'ACTIVE');
  const constantRooms = visited.filter((r) => r.equalsPreamble);
  check('E', 'every ACTIVE room assembled exactly the constant (ACTIVE ⟹ 28 bytes)',
    activeRooms.every((r) => r.equalsPreamble && r.len === PREAMBLE.length),
    `${activeRooms.length} ACTIVE room(s): ${activeRooms.map((r) => `${r.len}/${r.equalsPreamble}`).join(' ')}`);
  check('E', 'but NOT every 28-byte room is ACTIVE — the converse fails, which is the point',
    constantRooms.length > activeRooms.length,
    `${constantRooms.length} room(s) assemble the constant, ${activeRooms.length} of them by way of the floor`);

  // ── Arm F — the three report sites ───────────────────────────────────────────
  //
  // `channels.ts` prompt-debug is driven above. The two `aaxt.ts` sites are NOT drivable
  // without model spend (both call `generateProbes`/`runProbes` on the auxiliary model
  // immediately after building `layers`), so they are compared in source and labelled as
  // such rather than left implied. This is the honest boundary of this probe.
  {
    const aaxtSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/aaxt.ts'), 'utf8');
    const chanSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/channels.ts'), 'utf8');
    const floorSites = (s: string) => (s.match(/'7_floor':/g) ?? []).length;
    check('F', 'all three report sites exist in source', floorSites(aaxtSrc) === 2 && floorSites(chanSrc) === 1,
      `aaxt.ts=${floorSites(aaxtSrc)}, channels.ts=${floorSites(chanSrc)}`);
    const active = (s: string) => [...s.matchAll(/\? '(ACTIVE — layers 1–6[^']*)'/g)].map((m) => m[1]);
    const inactive = (s: string) => [...s.matchAll(/: '(INACTIVE — layers 1–6[^']*)'/g)].map((m) => m[1]);
    const allActive = [...active(chanSrc), ...active(aaxtSrc)];
    const allInactive = [...inactive(chanSrc), ...inactive(aaxtSrc)];
    check('F', 'every site reports the same verdict word for the firing case',
      allActive.length === 3 && allActive.every((s) => s.startsWith('ACTIVE — layers 1–6 assembled nothing')),
      `${allActive.length} ACTIVE strings found`);
    check('F', 'every site reports the same verdict word for the silent case',
      allInactive.length === 3 && allInactive.every((s) => s === allInactive[0]),
      `${allInactive.length} INACTIVE strings, identical=${allInactive.every((s) => s === allInactive[0])}`);
    const distinctActive = [...new Set(allActive)];
    measure('F', 'ACTIVE wording across the three sites',
      distinctActive.length === 1 ? 'identical at all three' : `${distinctActive.length} variants: ${distinctActive.map((s) => JSON.stringify(s.slice(0, 90))).join(' | ')}`);
    check('F', 'OPEN — a consumer matching the ACTIVE string exactly would see the same text everywhere',
      distinctActive.length === 1,
      distinctActive.length === 1 ? 'one wording' : `${distinctActive.length} wordings — channels.ts adds a trailing clause the aaxt sites omit; verdict prefix is shared, full string is not`,
      'open');
    measure('F', 'why the two aaxt sites are not driven here',
      'both build `layers` and then immediately call the auxiliary model (generateProbes / runProbes); driving them costs API spend, so they are source-compared, not endpoint-verified');
  }

  // ── Arm G — Round 167 items 3 and 4, re-driven ───────────────────────────────
  //
  // Daedalus called both closed. Re-driven anyway, cheaply, because "fixed" and "fixed at
  // the endpoint" have already diverged once on this thread.
  {
    const g = await post('/entities', { name: 'R168 Null Patch Target', handle: 'nullpatch168', systemPrompt: 'You are the null-patch control.' });
    const G = g.json?.id as string;
    const nullPatch = await patch(`/entities/${G}`, { systemPrompt: null });
    check('G', 'ITEM 3 — a null systemPrompt PATCH is handled, not a 500',
      nullPatch.status === 200, `status ${nullPatch.status}`);
    check('G', 'ITEM 3 — and it substitutes rather than storing null or empty',
      storedEntityPrompt(G) === PREAMBLE, `stored ${JSON.stringify(storedEntityPrompt(G))}`);
    const gChat = await boundChat('R168 room after a null PATCH', G);
    check('G', 'ITEM 3 — the resulting room is not floored, because the agent now has an identity',
      floorVerdict(gChat.dbg) === 'INACTIVE', `verdict=${floorVerdict(gChat.dbg)}, len=${gChat.dbg?.assembledLength}`);

    // Item 4's server half. The client half is pinned in Daedalus's five tests against the
    // real EntityManager; the server cannot see the difference and this does not pretend to
    // substitute for it. What it pins is that the route does not independently fill blanks.
    check('G', 'ITEM 4 — precondition: the imported agent is still blank',
      storedEntityPrompt(FLOORED) === '', `stored ${JSON.stringify(storedEntityPrompt(FLOORED))}`);
    const nameOnly = await patch(`/entities/${FLOORED}`, { name: 'R168 Floored Agent Renamed' });
    check('G', 'ITEM 4 — a name-only PATCH returns the blank unchanged',
      nameOnly.status === 200 && nameOnly.json?.systemPrompt === '',
      `status ${nameOnly.status}, body.systemPrompt=${JSON.stringify(nameOnly.json?.systemPrompt)}`);
    check('G', 'ITEM 4 — and the stored blank survives it',
      storedEntityPrompt(FLOORED) === '', `stored ${JSON.stringify(storedEntityPrompt(FLOORED))}`);
    const afterRename = await get(`/channels/${aFloored.id}/prompt-debug`);
    check('G', 'ITEM 4 — the agent\'s room still reports the floor after the unrelated edit',
      floorVerdict(afterRename.json) === 'ACTIVE', `verdict=${floorVerdict(afterRename.json)}`);
  }

  // ── Arm H — item 1, re-measured under the new report ─────────────────────────
  //
  // Daedalus ruled item 1 real but out of scope for the floor, and said the argument that
  // would move him is frequency. Frequency is not measurable in a scratch DB, so what is
  // recorded here is the narrower thing this probe *can* establish: with the report in
  // place, is the asymmetry now legible to a reader of prompt-debug alone? It is — the
  // klatch seat and the 1:1 seat for the same agent differ in layer 6 and in the floor,
  // and both say so. That is a strictly better state than Round 167, and it is what makes
  // the open item a scope question rather than a mystery.
  {
    const oneToOne = aFloored.dbg;
    const klatchSeat = kFloored.json;
    measure('H', 'same agent, native 1:1',
      `6=${JSON.stringify(oneToOne?.layers?.['6_carriedContext'])} 7=${floorVerdict(oneToOne)} len=${oneToOne?.assembledLength}`);
    measure('H', 'same agent, klatch seat',
      `6=${JSON.stringify(klatchSeat?.layers?.['6_carriedContext'])} 7=${floorVerdict(klatchSeat)} len=${klatchSeat?.assembledLength}`);
    check('H', 'OPEN — item 1: does the same agent get the same identity in both room types?',
      oneToOne?.assembledLength === klatchSeat?.assembledLength,
      `1:1=${oneToOne?.assembledLength} chars, klatch=${klatchSeat?.assembledLength} chars — layer 6 is klatch-only by Round 40/41 design (carried-context.ts:304)`,
      'open');
    check('H', 'the asymmetry is at least self-describing now — both rooms name their own cause',
      /INACTIVE — carried context applies to klatches only/.test(oneToOne?.layers?.['6_carriedContext'] ?? '')
        && floorVerdict(oneToOne) !== 'MISSING' && floorVerdict(klatchSeat) !== 'MISSING',
      `1:1 layer 6 says why it is off; both rooms report the floor`);
  }

  // ── Arm J — how a user reaches the floored room ──────────────────────────────
  //
  // Daedalus's ruling on item 1 rests on one empirical claim: seating an imported agent
  // in a fresh native 1:1 is "reachable but not ordinary — a configuration only a probe
  // constructs". He named frequency as the argument that would move him.
  //
  // Frequency is not measurable from here — it needs real usage data, and the `klatch.db`
  // in this worktree is a synthetic scaling corpus (2000 imported channels, 0 messages,
  // 2 entities), not a record of anything a person did. What IS measurable is the weaker
  // and still load-bearing half: whether the gesture is a designed flow or an improvised
  // one. That is in the client source, and it is checked rather than asserted.
  {
    const sidebar = fs.readFileSync(path.join(REPO, 'packages/client/src/components/ChannelSidebar.tsx'), 'utf8');

    check('J', 'the new-chat form has a labelled affordance for seating an existing agent',
      sidebar.includes("'Continue with an existing agent'"),
      `ChannelSidebar.tsx renders this label for newType === 'chat'`);
    check('J', 'the picker\'s primary tier is every entity with a name — which every minted import has',
      /roleAgents:\s*filtered\.filter\(\(e\) => e\.name\.trim\(\)\.length > 0\)/.test(sidebar),
      'roleAgents = named entities; writer six mints from a confirmed *name*, so an imported blank agent is listed in the first tier, by name');
    check('J', 'leaving the purpose blank sends the boilerplate, which layer 4 then drops',
      /newPrompt\.trim\(\) \|\| DEFAULT_CHANNEL_PREAMBLE/.test(sidebar),
      'handleSubmit substitutes DEFAULT_CHANNEL_PREAMBLE for an empty purpose field');

    // The shape that form submits for "pick one agent, leave the purpose blank", driven
    // against the real route. This is the same request arm B made — restated here as the
    // *client's* shape rather than the probe's, because that is the claim under dispute.
    const s3 = writeSession('minted3.jsonl', 'Look at the retry logic.', 'Will do.');
    await postMultipart('/import/claude-code', s3, { entityName: 'R168 Path C Agent', channelName: 'R168 path C import' });
    const pathC = entityByName('R168 Path C Agent');
    const created = await post('/channels', {
      name: 'R168 new chat via the shipped Path C shape',
      systemPrompt: PREAMBLE,          // what an empty purpose field becomes
      entityIds: [pathC!.id],          // one agent picked from "Continue with an existing agent"
      // type/mode/projectId omitted — exactly what handleSubmit sends for a chat
    });
    const pathCDbg = await get(`/channels/${created.json?.id}/prompt-debug`);
    recordRoom('R168 Path C: imported agent, blank purpose', pathCDbg.json);
    check('J', 'ITEM 1 — the shipped Path C gesture produces a floored room in three clicks',
      floorVerdict(pathCDbg.json) === 'ACTIVE' && pathCDbg.json?.assembledPrompt === PREAMBLE,
      `verdict=${floorVerdict(pathCDbg.json)}, len=${pathCDbg.json?.assembledLength} — new chat → pick the imported agent → leave purpose blank`);
    check('J', 'OPEN — is this configuration only reachable by a probe?',
      false,
      'no: it is the designed Path C flow (composition spec §3, scheduled §11a 2026-08-10) with the optional purpose left empty. FREQUENCY is still unmeasured — that needs xian\'s real klatch.db, which is outside this worktree',
      'open');
  }

  // ── Report ────────────────────────────────────────────────────────────────────
  const diffAfter = packagesDiff();
  const clean = diffAfter === diffBefore;
  check('Z', 'packages/ untouched by this probe', clean,
    clean ? `git diff --stat -- packages/ unchanged (${diffBefore === '' ? 'empty' : 'same as before'})` : `CHANGED:\n${diffAfter}`);
  check('Z', "xian's klatch.db was never the target", process.env.KLATCH_DB === undefined || process.env.KLATCH_DB === DB,
    `server ran against ${DB}`);

  const reg = results.filter((r) => r.kind === 'regression');
  const open = results.filter((r) => r.kind === 'open');
  const meas = results.filter((r) => r.kind === 'measurement');
  const regFailed = reg.filter((r) => !r.pass);

  console.log('\n──────── summary ────────');
  console.log(`regression: ${reg.length - regFailed.length}/${reg.length} passed`);
  console.log(`open:       ${open.filter((r) => r.pass).length}/${open.length} now passing (a pass here means the item closed)`);
  console.log(`measurement:${meas.length} recorded`);
  if (regFailed.length > 0) {
    console.log('\nFAILED:');
    for (const r of regFailed) console.log(`  [${r.arm}] ${r.check} — ${r.detail}`);
  }
  const openFailed = open.filter((r) => !r.pass);
  if (openFailed.length > 0) {
    console.log('\nSTILL OPEN:');
    for (const r of openFailed) console.log(`  [${r.arm}] ${r.check} — ${r.detail}`);
  }
  await shutdown(regFailed.length > 0 ? 1 : 0);
} catch (err) {
  console.error(err);
  await shutdown(1);
}
