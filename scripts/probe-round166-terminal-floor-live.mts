/**
 * Round 167 probe — Daedalus's Round 166 terminal floor, driven at the real HTTP endpoint.
 *
 * Theseus, 2026-09-07 START fire. `b88fb2d` landed this morning and answers Round 165's
 * finding — that a zero-length assembled prompt is reachable through writers Round 164's
 * enumeration missed — with a three-part ruling:
 *
 *   1. `PATCH /entities/:id` substitutes on empty-string, passes through on absent.
 *   2. The two *import* writers deliberately preserve `''` (writer six mints imported
 *      agents blank on purpose — an imported agent's identity is its transcript).
 *   3. `buildSystemPrompt` gets a terminal floor: `if (parts.length === 0) push(PREAMBLE)`.
 *
 * Daedalus shipped it suite-level only and named the thing he most wanted measured:
 *
 *   > "the floor never appears above an identity at the endpoint" is a different claim
 *   > from "the unit test says `parts` was non-empty."
 *
 * That is arm D, and it is the reason this probe exists. Arms A–C re-drive Round 165's
 * seven failures to see whether the fix reaches them through real HTTP; arm D tries to
 * catch the floor firing where something else already assembled; arm E goes after the one
 * layer that can be non-empty *without* an identity (carried context), because that is
 * the case where `parts.length !== 0` is true and the room still has no one in it.
 *
 * Run:  npx tsx scripts/probe-round166-terminal-floor-live.mts
 *
 * ZERO MODEL CALLS. Every assembly arm reads `/api/channels/:id/prompt-debug`, which
 * assembles the prompt the API *would* be sent and returns it without sending it.
 * `/aaxt-probe` and `/aaxt-run` are deliberately NOT called (both spend the auxiliary
 * model). Scratch DB via KLATCH_DB under `.testdata/`; xian's `klatch.db` is never
 * opened. Nothing under `packages/` is written — asserted at exit (arm Z), not assumed.
 *
 * Arms:
 *   A  Round 165's failing writers, re-driven through PATCH                 [regression]
 *   B  the import writers still preserve the deliberate blank              [regression]
 *   C  the floor fires — the rooms Round 165 reached at 0 chars            [regression]
 *   D  the floor never appears above an identity (Daedalus's ask)          [regression]
 *   E  the one layer that is non-empty without an identity: carried ctx    [measurement]
 *   F  Round 162/163 regression: the layer-4 drop still holds              [regression]
 *   G  what the layer report says when the floor fires                     [measurement]
 *   H  the bare-literal count after Round 166                              [measurement]
 *   J  PATCH input shapes either side of the new ternary                   [open]
 *   Z  the probe wrote nothing under packages/                             [regression]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163/165.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round166-terminal-floor');
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

/** Read an entity row straight out of the scratch file — what was *stored*, not what assembly did with it. */
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

/** A default 1:1 bound to one agent: the most-travelled path, and the one the ruling is about. */
async function boundChat(name: string, entityId: string, body: Record<string, unknown> = {}): Promise<{ id: string; dbg: any }> {
  const ch = await post('/channels', { name, systemPrompt: PREAMBLE, entityIds: [entityId], ...body });
  if (ch.status !== 201) throw new Error(`channel create failed for ${name}: ${ch.status} ${JSON.stringify(ch.json)}`);
  const dbg = await get(`/channels/${ch.json.id}/prompt-debug`);
  return { id: ch.json.id as string, dbg: dbg.json };
}

/**
 * The arm-D predicate, stated once. "The floor never appears above an identity" is
 * operationally: whatever else assembled, the 28-character boilerplate is not anywhere
 * in the string — not at char 0, not appended, not in the middle.
 */
function floorAbsent(assembled: string | undefined): boolean {
  return typeof assembled === 'string' && !assembled.includes(PREAMBLE);
}

let uuidN = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++uuidN).padStart(12, '0')}`;
function writeSession(file: string, userLine: string, reply: string): string {
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    { type: 'user', uuid: userUuid, parentUuid: null, sessionId, timestamp: '2026-09-07T09:00:00.000Z', cwd: '/tmp/r167-probe', permissionMode: 'default', message: { role: 'user', content: userLine } },
    { type: 'assistant', uuid: uuid(), parentUuid: userUuid, sessionId, timestamp: '2026-09-07T09:00:05.000Z', cwd: '/tmp/r167-probe', message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: reply }], stop_reason: 'end_turn' } },
  ];
  const p = path.join(SCRATCH, file);
  fs.writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return p;
}

try {
  // ── Arm A — Round 165's failing writers, re-driven through PATCH ──────────────
  //
  // Round 165 failed seven regression checks. Four of them were the PATCH writer:
  // an empty-string PATCH stored `''`, whitespace stored `''`, the *seeded default
  // agent* could be emptied the same way, and the resulting 1:1 assembled to nothing.
  // Same gestures, same order, against the fixed route.
  const blank = await post('/entities', { name: 'Blank Agent', handle: 'blank167' });
  check('A', 'POST /entities with no prompt is accepted', blank.status === 201, `status ${blank.status}`);
  const BLANK = blank.json?.id as string;
  check('A', 'the create route substitutes the boilerplate (entities.ts:87, now via the constant)',
    storedEntityPrompt(BLANK) === PREAMBLE, `stored ${JSON.stringify(storedEntityPrompt(BLANK))}`);

  const upd = await patch(`/entities/${BLANK}`, { systemPrompt: '' });
  check('A', 'PATCH with an empty prompt is still accepted, not 400', upd.status === 200, `status ${upd.status}`);
  const updStored = storedEntityPrompt(BLANK);
  measure('A', 'what the update path stores now', `${JSON.stringify(updStored)} (${updStored?.length ?? 0} chars)`);
  check('A', 'ROUND 165 FAILURE 1 — the update path substitutes rather than storing zero length',
    updStored === PREAMBLE, `stored ${JSON.stringify(updStored)}`);
  check('A', 'the 200 body reflects the substitution back to the client',
    upd.json?.systemPrompt === PREAMBLE, `body.systemPrompt=${JSON.stringify(upd.json?.systemPrompt)}`);

  const ws = await post('/entities', { name: 'Whitespace Agent', handle: 'ws167', systemPrompt: 'You are Ws.' });
  const WS = ws.json?.id as string;
  await patch(`/entities/${WS}`, { systemPrompt: '   \n  ' });
  check('A', 'ROUND 165 FAILURE 2 — a whitespace-only PATCH substitutes too',
    storedEntityPrompt(WS) === PREAMBLE, `stored ${JSON.stringify(storedEntityPrompt(WS))}`);

  const seedUpd = await patch(`/entities/${DEFAULT_ENTITY_ID}`, { systemPrompt: '' });
  const seedAfter = storedEntityPrompt(DEFAULT_ENTITY_ID);
  check('A', 'ROUND 165 FAILURE 3 — the seeded default agent cannot be emptied in two UI gestures',
    seedAfter === PREAMBLE, `status ${seedUpd.status}, stored ${JSON.stringify(seedAfter)}`);

  // Controls, so a passing arm A means "substitutes on empty" and not "overwrites always".
  const keep = await post('/entities', { name: 'Rename Me', handle: 'rename167', systemPrompt: 'You are Rename Me.' });
  const KEEP = keep.json?.id as string;
  await patch(`/entities/${KEEP}`, { name: 'Renamed' });
  check('A', 'CONTROL — a PATCH that omits systemPrompt leaves the prompt alone (Daedalus pinned this; driven here)',
    storedEntityPrompt(KEEP) === 'You are Rename Me.', `stored ${JSON.stringify(storedEntityPrompt(KEEP))}`);
  await patch(`/entities/${KEEP}`, { systemPrompt: 'You are Renamed, and this is a real identity.' });
  check('A', 'CONTROL — a PATCH carrying a real prompt stores it verbatim, unsubstituted',
    storedEntityPrompt(KEEP) === 'You are Renamed, and this is a real identity.',
    `stored ${JSON.stringify(storedEntityPrompt(KEEP))}`);
  await patch(`/entities/${KEEP}`, { systemPrompt: '  padded identity  ' });
  check('A', 'CONTROL — a real prompt is still trimmed, not just passed through',
    storedEntityPrompt(KEEP) === 'padded identity', `stored ${JSON.stringify(storedEntityPrompt(KEEP))}`);

  // ── Arm B — the import writers preserve the deliberate blank ──────────────────
  //
  // The other half of the ruling. Round 165 proposed substituting here too and Daedalus
  // declined, for the premise reason. So the *correct* behaviour for these two writers is
  // the thing Round 165 filed as a failure — which means it has to be pinned in the same
  // direction it was once pinned against, or a future round "fixes" it back.
  const { default: AdmZip } = await import('adm-zip');
  const IMPORTED_CHANNEL = 'r167-imported-channel';
  const IMPORTED_ENTITY = 'r167-promptless-entity';
  const manifest = {
    format_version: '1.0.0',
    source_type: 'klatch',
    package_id: 'r167-pkg',
    package_kind: 'klatch.context.v1',
    created_at: '2026-09-07T09:00:00.000Z',
    provenance: [{ source: 'klatch', at: '2026-09-07T09:00:00.000Z', channel_id: IMPORTED_CHANNEL }],
    project: null,
    conversation_context: { id: IMPORTED_CHANNEL, name: 'Promptless import', type: 'chat', mode: 'roundtable', created_at: '2026-09-07T09:00:00.000Z' },
    entities: [{ id: IMPORTED_ENTITY, name: 'Promptless', handle: 'promptless167', model: 'claude-opus-5' }],
    files: [],
    conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
    extensions: { klatch: {} },
  };
  const zip = new AdmZip();
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
  zip.addFile('conversation.jsonl', Buffer.from(''));
  const zipPath = path.join(SCRATCH, 'promptless.zip');
  fs.writeFileSync(zipPath, zip.toBuffer());

  const imported = await post('/import/klatch', { zipPath });
  check('B', 'the package imports through the real route', imported.status === 201,
    `status ${imported.status} ${JSON.stringify(imported.json)?.slice(0, 160)}`);
  const impStored = storedEntityPrompt(IMPORTED_ENTITY);
  check('B', 'klatch-import PRESERVES the blank (Round 166 declined my one-liner — pinned in that direction)',
    impStored === '', `stored ${JSON.stringify(impStored)} (${impStored?.length ?? 0} chars)`);

  // Writer six, at the endpoint rather than by unit test. A claude-code upload with a
  // confirmed name that matches nothing mints an entity through `entity-resolve.ts:93`.
  const sessionFile = writeSession('minted.jsonl', 'Ship the parser fix.', 'On it.');
  const mintRes = await postMultipart('/import/claude-code', sessionFile, { entityName: 'R167 Minted Agent', channelName: 'R167 minted import' });
  check('B', 'the claude-code upload path imports', mintRes.status === 201,
    `status ${mintRes.status} disposition=${mintRes.json?.entityDisposition}`);
  const minted = entityByName('R167 Minted Agent');
  check('B', 'WRITER SIX — an agent minted at import carries a deliberately blank prompt',
    minted !== undefined && minted.system_prompt === '',
    `minted=${minted ? `${minted.id} prompt=${JSON.stringify(minted.system_prompt)}` : 'NOT FOUND'}`);
  measure('B', 'the disposition the route reported', `${mintRes.json?.entityDisposition}`);

  // ── Arm C — the floor fires: the rooms Round 165 reached at 0 chars ───────────
  //
  // Round 165 arm I widened the blast radius rather than bounding it: *every* native room
  // with a blanked agent, no project, no files and a default purpose assembled to 0 chars —
  // 1:1 and klatch alike. Those are the exact rooms re-driven here.
  const aChat = await boundChat('R167 blank-bound chat', BLANK);
  check('C', 'a native 1:1 bound to a substituted agent assembles to the boilerplate',
    aChat.dbg?.assembledLength === PREAMBLE.length,
    `assembledLength=${aChat.dbg?.assembledLength} (expected ${PREAMBLE.length})`);

  // The floor's own case: an agent whose stored prompt is genuinely '' — which after
  // Round 166 can only be reached through the import writers, not through PATCH.
  const impChat = await boundChat('R167 native 1:1 seating the imported blank agent', IMPORTED_ENTITY);
  check('C', 'ROUND 165 FAILURE 4 — a native 1:1 seating a truly-blank imported agent is no longer 0 chars',
    (impChat.dbg?.assembledLength ?? -1) > 0, `assembledLength=${impChat.dbg?.assembledLength}`);
  check('C', 'and what it floors to is exactly the boilerplate, nothing more',
    impChat.dbg?.assembledPrompt === PREAMBLE,
    `assembled=${JSON.stringify(impChat.dbg?.assembledPrompt)}`);

  const mintedChat = await boundChat('R167 native 1:1 seating the minted agent', minted!.id);
  check('C', 'the same holds for the writer-six agent — Daedalus\'s stated case',
    mintedChat.dbg?.assembledPrompt === PREAMBLE,
    `assembledLength=${mintedChat.dbg?.assembledLength}, assembled=${JSON.stringify(mintedChat.dbg?.assembledPrompt?.slice(0, 40))}`);

  const PIPER_PROMPT = 'You are Piper Morgan, a product manager. PIPER-MARKER-R167';
  const piper = await post('/entities', { name: 'Piper Morgan', handle: 'piper167', systemPrompt: PIPER_PROMPT });
  const PIPER = piper.json?.id as string;

  const klatch = await post('/channels', { name: 'R167 klatch with a blank seat', type: 'klatch', systemPrompt: PREAMBLE, entityIds: [IMPORTED_ENTITY, PIPER] });
  const kDbg = await get(`/channels/${klatch.json?.id}/prompt-debug?entityId=${IMPORTED_ENTITY}`);
  check('C', 'ROUND 165 FAILURE 5 — a klatch seat held by a blank agent is no longer 0 chars',
    kDbg.json?.assembledPrompt === PREAMBLE,
    `assembledLength=${kDbg.json?.assembledLength}, assembled=${JSON.stringify(kDbg.json?.assembledPrompt)}`);
  const kPiper = await get(`/channels/${klatch.json?.id}/prompt-debug?entityId=${PIPER}`);
  check('C', 'the other seat in the SAME klatch is untouched by the floor',
    kPiper.json?.assembledPrompt === PIPER_PROMPT,
    `assembled=${JSON.stringify(kPiper.json?.assembledPrompt?.slice(0, 40))} len=${kPiper.json?.assembledLength}`);

  // ── Arm D — the floor never appears above an identity ─────────────────────────
  //
  // Daedalus's ask, and the arm that would have caught the fix being wrong. Each case
  // below has *something* at some layer, so the floor must stay silent. The predicate is
  // stricter than "assembledLength > 0": the boilerplate must not appear anywhere in the
  // string. A floor that fired and then got joined *after* a real identity would pass a
  // length check and fail this one.
  const dPiper = await boundChat('R167 continue with Piper', PIPER);
  check('D', 'layer 5 only — a real identity is the whole prompt, and the floor is absent',
    dPiper.dbg?.assembledPrompt === PIPER_PROMPT && floorAbsent(dPiper.dbg?.assembledPrompt),
    `len=${dPiper.dbg?.assembledLength} (identity is ${PIPER_PROMPT.length}), floor present=${!floorAbsent(dPiper.dbg?.assembledPrompt)}`);

  const PURPOSE = 'This room is for triaging the September import defects. PURPOSE-MARKER-R167';
  const dPurpose = await boundChat('R167 purposeful room, blank agent', IMPORTED_ENTITY, { systemPrompt: PURPOSE });
  check('D', 'layer 4 only — a real channel purpose with a blank agent does NOT get the floor',
    dPurpose.dbg?.assembledPrompt === PURPOSE,
    `len=${dPurpose.dbg?.assembledLength} (purpose is ${PURPOSE.length}), assembled=${JSON.stringify(dPurpose.dbg?.assembledPrompt?.slice(0, 50))}`);

  const INSTRUCTIONS = 'Klatch project instructions. Verify before asserting. INSTRUCTIONS-MARKER-R167';
  const proj = await post('/projects', { name: 'R167 Project', instructions: INSTRUCTIONS });
  const dProject = await boundChat('R167 project room, blank agent', IMPORTED_ENTITY, { projectId: proj.json?.id });
  check('D', 'layer 2 only — project instructions with a blank agent do NOT get the floor',
    dProject.dbg?.assembledPrompt === INSTRUCTIONS,
    `len=${dProject.dbg?.assembledLength} (instructions are ${INSTRUCTIONS.length}), floor present=${!floorAbsent(dProject.dbg?.assembledPrompt)}`);

  const impDbg = await get(`/channels/${IMPORTED_CHANNEL}/prompt-debug`);
  check('D', 'layer 1 only — an imported channel\'s kit briefing with a blank agent does NOT get the floor',
    floorAbsent(impDbg.json?.assembledPrompt) && (impDbg.json?.assembledLength ?? 0) > 0,
    `len=${impDbg.json?.assembledLength}, floor present=${!floorAbsent(impDbg.json?.assembledPrompt)}`);

  const dBoth = await boundChat('R167 purposeful room with Piper', PIPER, { systemPrompt: PURPOSE });
  check('D', 'layers 4+5 — purpose then identity, and the floor is absent from both',
    dBoth.dbg?.assembledPrompt === `${PURPOSE}\n\n${PIPER_PROMPT}`,
    `len=${dBoth.dbg?.assembledLength}, starts ${JSON.stringify(dBoth.dbg?.assembledPrompt?.slice(0, 30))}`);

  // The adversarial case for the floor's placement: an agent whose real identity happens
  // to *contain* the boilerplate as a substring. If the floor were implemented as a
  // string test rather than an emptiness test, this is where it would misfire.
  const CONTAINS = `${PREAMBLE} And specifically, you are the R167 containment control.`;
  const contains = await post('/entities', { name: 'Containment Control', handle: 'contains167', systemPrompt: CONTAINS });
  const dContains = await boundChat('R167 containment control room', contains.json?.id);
  check('D', 'an identity that CONTAINS the boilerplate is passed through once, not doubled',
    dContains.dbg?.assembledPrompt === CONTAINS,
    `len=${dContains.dbg?.assembledLength} (fixture is ${CONTAINS.length}), occurrences=${dContains.dbg?.assembledPrompt?.split(PREAMBLE).length - 1}`);

  // The other direction: an agent whose identity IS the boilerplate, byte for byte. Round
  // 164 refused to filter that at layer 5; the floor must not turn it into two copies.
  const isPreamble = await post('/entities', { name: 'Boilerplate Identity', handle: 'boiler167', systemPrompt: PREAMBLE });
  const dIsPreamble = await boundChat('R167 boilerplate-identity room', isPreamble.json?.id);
  check('D', 'an agent whose prompt IS the boilerplate assembles to one copy, not two (Round 164 pin)',
    dIsPreamble.dbg?.assembledPrompt === PREAMBLE,
    `len=${dIsPreamble.dbg?.assembledLength}, occurrences=${dIsPreamble.dbg?.assembledPrompt?.split(PREAMBLE).length - 1}`);

  // ── Arm E — the layer that is non-empty without an identity ───────────────────
  //
  // The floor's condition is `parts.length === 0`, not "no identity assembled". Layer 6 —
  // carried context — is the one layer that can be populated for an agent that has no
  // identity at all, because it is built from the agent's transcript elsewhere. In that
  // room `parts` is non-empty, the floor correctly does not fire, and the model receives
  // a recent-activity digest with no statement of who it is. Not a defect in the floor;
  // measured because it is the shape of room the floor does not cover, and nobody has
  // looked at it.
  //
  // Messages are written straight into the scratch DB — the assembly under test is still
  // the live endpoint's, but generating this history through POST /messages would spend
  // the model, which this probe does not do.
  {
    const carrier = entityByName('Promptless')!;
    const priorRoom = await post('/channels', { name: 'R167 prior room for the blank agent', systemPrompt: PREAMBLE, entityIds: [carrier.id] });
    const conn = sqlOpen(false);
    const ins = conn.prepare('INSERT INTO messages (id, channel_id, role, content, status, created_at, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    ins.run('r167-m1', priorRoom.json.id, 'user', 'What did you conclude about the parser?', 'complete', '2026-09-07T08:00:00.000Z', null);
    ins.run('r167-m2', priorRoom.json.id, 'assistant', 'CARRIED-MARKER-R167 — the parser drops the trailing frame.', 'complete', '2026-09-07T08:00:05.000Z', carrier.id);
    conn.close();

    const carryKlatch = await post('/channels', { name: 'R167 klatch for carried context', type: 'klatch', systemPrompt: PREAMBLE, entityIds: [carrier.id, PIPER] });
    const cDbg = await get(`/channels/${carryKlatch.json?.id}/prompt-debug?entityId=${carrier.id}`);
    const asm: string = cDbg.json?.assembledPrompt ?? '';
    measure('E', 'a blank agent with carried context assembles to', `${cDbg.json?.assembledLength} chars`);
    measure('E', 'its layer report', `L5=${JSON.stringify(cDbg.json?.layers?.['5_entityPrompt'])} L6=${JSON.stringify(cDbg.json?.layers?.['6_carriedContext'])}`);
    const carriedPresent = asm.includes('CARRIED-MARKER-R167');
    check('E', 'the carried block is what assembled (so the floor could not have fired)',
      carriedPresent, `carried marker present=${carriedPresent}`);
    check('E', 'OPEN — is the agent told who it is in that room?',
      asm.includes(PREAMBLE), `boilerplate present=${asm.includes(PREAMBLE)} — if false, the room carries history with no identity line above it`, 'open');
    measure('E', 'reading',
      'layer 6 satisfies `parts.length !== 0` without any layer that says who the agent is. The floor is behaving to spec; the spec\'s unit is "did anything assemble", not "did an identity assemble".');
  }

  // ── Arm F — Round 162/163 regression ──────────────────────────────────────────
  //
  // Round 166 touched assembly, so the layer-4 drop is re-measured rather than assumed.
  check('F', 'the boilerplate purpose is still dropped at layer 4',
    dPiper.dbg?.layers?.['4_channelAddendum'] === 'EMPTY — default purpose, not sent',
    `L4=${JSON.stringify(dPiper.dbg?.layers?.['4_channelAddendum'])}`);
  check('F', 'a real identity still starts at char 0',
    dPiper.dbg?.assembledPrompt?.startsWith(PIPER_PROMPT.slice(0, 20)) === true,
    `prompt starts ${JSON.stringify(dPiper.dbg?.assembledPrompt?.slice(0, 40))}`);

  // ── Arm G — what the layer report says when the floor fires ───────────────────
  //
  // Round 162 gave layer 4 a reason string precisely so a reader could tell "nothing was
  // written" from "boilerplate was written and dropped". The floor has no such reporter:
  // when it fires, every layer reports empty/inactive and `assembledLength` is 28. A
  // reader of prompt-debug cannot see where those 28 characters came from.
  {
    const L = impChat.dbg?.layers ?? {};
    measure('G', 'layer report for a floored room',
      Object.entries(L).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' '));
    const anyLayerActive = Object.values(L).some((v) => typeof v === 'string' && v.startsWith('ACTIVE'));
    check('G', 'OPEN — some layer accounts for the assembled 28 characters',
      anyLayerActive,
      `assembledLength=${impChat.dbg?.assembledLength} with ${anyLayerActive ? 'an' : 'NO'} ACTIVE layer — the debug view shows content from nowhere`,
      'open');
  }

  // ── Arm H — the bare-literal count after Round 166 ────────────────────────────
  //
  // Round 165 measured five bare occurrences of the literal on the server; Daedalus said
  // it should be four after this round. Counted, not taken.
  {
    const files = ['routes/export.ts', 'routes/entities.ts', 'db/index.ts', 'claude/client.ts', 'aaxt/probe-generator.ts'];
    let bare = 0;
    const sites: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(path.join(REPO, 'packages/server/src', f), 'utf8');
      src.split('\n').forEach((line, i) => {
        if (!line.includes(PREAMBLE)) return;
        const t = line.trim();
        if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
        bare++;
        sites.push(`${f}:${i + 1}`);
      });
    }
    measure('H', 'bare (non-comment) occurrences of the literal on the server', `${bare} — ${sites.join(', ')}`);
    check('H', 'Daedalus\'s stated count of four after Round 166', bare === 4, `counted ${bare}`, 'measurement');
    const exportSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/export.ts'), 'utf8');
    check('H', 'export.ts keeps its own fallback (it protects session notes from the blank-prompt state)',
      new RegExp(`system: entity\\.systemPrompt \\|\\| '${PREAMBLE.replace(/\./g, '\\.')}'`).test(exportSrc),
      'routes/export.ts:249 unchanged, as agreed');
  }

  // ── Arm J — PATCH input shapes either side of the new ternary ─────────────────
  //
  // The ternary replaced `body.systemPrompt?.trim()`. The optional chain was doing two
  // jobs: skipping on absent, and surviving a non-string. `body.systemPrompt.trim()` in
  // the false branch has no such guard. `null` is the shape that changed meaning — it is
  // not `undefined`, so it takes the false branch and calls `.trim()` on it. Driven, not
  // reasoned: what the endpoint actually returns is the only thing that settles it.
  {
    const before = storedEntityPrompt(KEEP);
    const nullPatch = await patch(`/entities/${KEEP}`, { systemPrompt: null });
    const after = storedEntityPrompt(KEEP);
    measure('J', 'PATCH {"systemPrompt": null}', `status ${nullPatch.status}, stored before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    check('J', 'OPEN — a null systemPrompt is handled rather than throwing',
      nullPatch.status < 500,
      `status ${nullPatch.status} — the pre-Round-166 \`?.trim()\` returned undefined here (pass-through); the ternary calls .trim() on null`,
      'open');
    check('J', 'whatever it returns, the stored prompt is not left empty',
      (after ?? '').length > 0, `stored ${JSON.stringify(after)}`);

    // The control that says whether this is new: a number was already broken before
    // Round 166 (`(123)?.trim()` throws too), so a 500 there is not a regression.
    const numPatch = await patch(`/entities/${KEEP}`, { systemPrompt: 42 });
    measure('J', 'CONTROL — PATCH {"systemPrompt": 42}', `status ${numPatch.status} (also threw pre-Round-166; not a regression either way)`);
  }

  // ── Arm K — what keeps the two halves of the ruling from colliding ────────────
  //
  // The ruling has PATCH substituting and the import writers preserving. Those two live
  // in the same product: an imported agent's blank is reachable by the very route that
  // substitutes. What keeps them apart is not in the server at all — it is
  // `EntityManager.tsx:199-209`, which sends only *changed* fields, so editing an
  // imported agent's name never mentions its prompt. Read this session; driven here as
  // the two request shapes rather than left as a source reading.
  //
  // The dependency is worth naming because the same file's create branch (`:212`) sends
  // every field unconditionally. If the update branch ever adopted that shape — the
  // ordinary simplification — every writer-six blank would be overwritten with
  // boilerplate on the next unrelated edit, and nothing on the server would catch it.
  {
    const target = entityByName('Promptless')!;
    check('K', 'precondition — the imported agent is still blank going in',
      storedEntityPrompt(target.id) === '', `stored ${JSON.stringify(storedEntityPrompt(target.id))}`);

    // The shape EntityManager's *update* branch actually sends for a name-only edit.
    await patch(`/entities/${target.id}`, { name: 'Promptless Renamed' });
    check('K', 'the shipped client shape preserves the deliberate blank across an unrelated edit',
      storedEntityPrompt(target.id) === '', `stored ${JSON.stringify(storedEntityPrompt(target.id))}`);

    // The shape its *create* branch sends, applied to the same agent. Not a bug today —
    // nothing sends this on update. Measured so the consequence is on the record.
    await patch(`/entities/${target.id}`, { name: 'Promptless Renamed', systemPrompt: '', model: 'claude-opus-5', color: '#3B82F6' });
    const afterAll = storedEntityPrompt(target.id);
    measure('K', 'the send-every-field shape applied to the same agent',
      `stored ${JSON.stringify(afterAll)} — a writer-six blank overwritten by an edit that never touched the prompt field`);
    check('K', 'OPEN — is the import-writer blank protected by anything on the server?',
      afterAll === '', `stored ${JSON.stringify(afterAll)}; the protection is client-side dirty-field tracking only`, 'open');
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
