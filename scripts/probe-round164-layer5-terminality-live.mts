/**
 * Round 165 probe — Daedalus's Round 164 invariant driven at the real HTTP endpoint.
 *
 * Theseus, 2026-09-06 STOP fire. `deaf83d` landed hours before this fire and states a
 * rule rather than changing behaviour:
 *
 *     "assembly never hands the model a zero-length system prompt"
 *
 * The rule is the load-bearing half of the Round 164 ruling. Layer 4 may drop the
 * boilerplate *because* layer 5 is terminal and guaranteed to hold something. His memo
 * names the guarantee's basis explicitly: "all three writers of an entity row substitute
 * a non-empty prompt (`entities.ts:81`, plus the two seeds at `db/index.ts:84,351`)."
 *
 * That is an enumeration, and an enumeration is exactly the shape of claim I got wrong
 * myself last round — Round 163, "two channel-insert paths," off a grep scoped to `db/`
 * and `routes/`; there were three. So this probe does not test the ruling (I agree with
 * it). It tests **the enumeration the ruling rests on**, at the endpoint, by trying to
 * reach a zero-length assembled prompt through ordinary routes.
 *
 * Run:  npx tsx scripts/probe-round164-layer5-terminality-live.mts
 *
 * ZERO MODEL CALLS. Every assembly arm reads `/api/channels/:id/prompt-debug`, which
 * assembles the prompt the API *would* be sent and returns it without sending it.
 * `/aaxt-probe` and `/aaxt-run` are deliberately NOT called (both spend the auxiliary
 * model), and neither is `GET /channels/:id/export` with notes — arm H checks
 * `export.ts` by source identity instead. Scratch DB via KLATCH_DB under `.testdata/`;
 * xian's `klatch.db` is never opened. Nothing under `packages/` is written — asserted at
 * exit (arm Z), not assumed.
 *
 * Arms:
 *   A  the three named writers hold at the endpoint — Round 164, live      [regression]
 *   B  PATCH /entities/:id with an empty prompt — the update path          [regression]
 *   C  the same through whitespace, and the omitted-field control          [regression]
 *   D  a klatch package whose entity carries no prompt — the import path   [regression]
 *   E  what the L5 reporter says when layer 5 is empty                     [measurement]
 *   F  Round 162/163 regression: the layer-4 drop still holds              [regression]
 *   G  what the wire gets when assembly returns zero length                [measurement]
 *   H  `export.ts:249` and the count of bare literals on the server        [measurement]
 *   Z  the probe wrote nothing under packages/                             [regression]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round164-layer5-terminality');
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

/** Read an entity row straight out of the scratch file — what was *stored*, not what assembly did with it. */
async function storedEntityPrompt(entityId: string): Promise<string | null> {
  const { default: Database } = await import('better-sqlite3');
  const conn = new Database(DB, { readonly: true });
  const row = conn.prepare('SELECT system_prompt FROM entities WHERE id = ?').get(entityId) as { system_prompt: string | null } | undefined;
  conn.close();
  return row ? row.system_prompt : null;
}

/** A default 1:1 bound to one agent: the most-travelled path, and the one the ruling is about. */
async function boundChat(name: string, entityId: string): Promise<{ id: string; dbg: any }> {
  const ch = await post('/channels', { name, systemPrompt: PREAMBLE, entityIds: [entityId] });
  if (ch.status !== 201) throw new Error(`channel create failed for ${name}: ${ch.status} ${JSON.stringify(ch.json)}`);
  const dbg = await get(`/channels/${ch.json.id}/prompt-debug`);
  return { id: ch.json.id as string, dbg: dbg.json };
}

try {
  // ── Arm A — the three named writers, at the endpoint ──────────────────────────
  //
  // Round 164's ruling, driven live rather than through buildSystemPrompt directly.
  // If any of these three fails, the ruling is wrong at the endpoint and everything
  // below is moot.
  const blank = await post('/entities', { name: 'Blank Agent', handle: 'blank' });
  check('A', 'POST /entities with no prompt is accepted', blank.status === 201, `status ${blank.status}`);
  const BLANK = blank.json?.id as string;
  const blankStored = await storedEntityPrompt(BLANK);
  check('A', 'the create route substitutes the boilerplate (entities.ts:87)',
    blankStored === PREAMBLE, `stored ${JSON.stringify(blankStored)} (${blankStored?.length ?? 0} chars)`);

  const seedStored = await storedEntityPrompt(DEFAULT_ENTITY_ID);
  check('A', 'the seeded default entity carries it too (db/index.ts)',
    seedStored === PREAMBLE, `stored ${JSON.stringify(seedStored)} (${seedStored?.length ?? 0} chars)`);

  const aChat = await boundChat('Blank-bound chat', BLANK);
  check('A', 'a chat bound to a blank-prompt agent assembles to the boilerplate, not to nothing',
    aChat.dbg?.assembledLength === PREAMBLE.length,
    `assembledLength=${aChat.dbg?.assembledLength} (expected ${PREAMBLE.length})`);
  measure('A', 'the layer report on that chat',
    `L4=${JSON.stringify(aChat.dbg?.layers?.['4_channelAddendum'])} L5=${JSON.stringify(aChat.dbg?.layers?.['5_entityPrompt'])}`);

  // ── Arm B — the update path ───────────────────────────────────────────────────
  //
  // `PATCH /entities/:id` is a fourth writer of `entities.system_prompt`
  // (`queries.ts:413`), and it is not in the enumeration. The route passes
  // `body.systemPrompt?.trim()` with no `||` fallback (`entities.ts:125`), and
  // `updateEntity` coalesces with `??`, which treats `''` as a value rather than an
  // absence. Every step of that is readable in source; what it does to the *assembled
  // prompt* is not, so it is measured here.
  const upd = await patch(`/entities/${BLANK}`, { systemPrompt: '' });
  check('B', 'PATCH with an empty prompt is accepted', upd.status === 200, `status ${upd.status}`);
  const updStored = await storedEntityPrompt(BLANK);
  measure('B', 'what the update path stored', `${JSON.stringify(updStored)} (${updStored?.length ?? 0} chars)`);
  check('B', 'the update path substitutes a non-empty prompt, like the other three writers',
    (updStored ?? '').length > 0, `stored ${JSON.stringify(updStored)}`);

  const bChat = await boundChat('Emptied-agent chat', BLANK);
  measure('B', 'the assembled prompt for a 1:1 bound to the emptied agent', `${bChat.dbg?.assembledLength} chars`);
  check('B', 'assembly never hands the model a zero-length system prompt',
    (bChat.dbg?.assembledLength ?? -1) > 0,
    `assembledLength=${bChat.dbg?.assembledLength}, layers L4=${JSON.stringify(bChat.dbg?.layers?.['4_channelAddendum'])} L5=${JSON.stringify(bChat.dbg?.layers?.['5_entityPrompt'])}`);

  // The seeded default entity is the one the ruling names as the most-travelled path.
  // If the update route can empty *that*, the default 1:1 is reachable from the UI.
  const seedUpd = await patch(`/entities/${DEFAULT_ENTITY_ID}`, { systemPrompt: '' });
  const seedAfter = await storedEntityPrompt(DEFAULT_ENTITY_ID);
  measure('B', 'the seeded default entity after the same PATCH',
    `status ${seedUpd.status}, stored ${JSON.stringify(seedAfter)} (${seedAfter?.length ?? 0} chars)`);
  check('B', 'the seeded default entity cannot be emptied through the update route',
    (seedAfter ?? '').length > 0, `stored ${JSON.stringify(seedAfter)}`);
  const seedChat = await boundChat('Default 1:1 after emptying the seed', DEFAULT_ENTITY_ID);
  check('B', 'the default 1:1 still assembles to something',
    (seedChat.dbg?.assembledLength ?? -1) > 0, `assembledLength=${seedChat.dbg?.assembledLength}`);
  // Restore, so later arms measure the shipped state rather than this arm's damage.
  await patch(`/entities/${DEFAULT_ENTITY_ID}`, { systemPrompt: PREAMBLE });

  // ── Arm C — whitespace, and the omitted-field control ─────────────────────────
  //
  // The control matters: if an *omitted* field also emptied the prompt, arm B would be a
  // much larger bug and I would be reading the coalescing wrong. It doesn't — checked,
  // not assumed.
  const ws = await post('/entities', { name: 'Whitespace Agent', handle: 'ws', systemPrompt: 'You are Ws.' });
  const WS = ws.json?.id as string;
  await patch(`/entities/${WS}`, { systemPrompt: '   \n  ' });
  const wsStored = await storedEntityPrompt(WS);
  measure('C', 'a whitespace-only PATCH stored', `${JSON.stringify(wsStored)} (${wsStored?.length ?? 0} chars)`);
  check('C', 'a whitespace-only prompt does not empty the agent',
    (wsStored ?? '').length > 0, `stored ${JSON.stringify(wsStored)}`);

  const keep = await post('/entities', { name: 'Rename Me', handle: 'rename', systemPrompt: 'You are Rename Me.' });
  const KEEP = keep.json?.id as string;
  await patch(`/entities/${KEEP}`, { name: 'Renamed' });
  const keepStored = await storedEntityPrompt(KEEP);
  check('C', 'CONTROL — a PATCH that omits systemPrompt leaves the prompt alone',
    keepStored === 'You are Rename Me.', `stored ${JSON.stringify(keepStored)}`);

  // ── Arm D — the import path ───────────────────────────────────────────────────
  //
  // `klatch-import.ts:305` writes `e.prompt || ''` for a manifest entity. That is a fifth
  // writer, also outside the enumeration, and unlike the update path it needs no user
  // gesture at all — a package built by another Klatch instance carries it in.
  const { default: AdmZip } = await import('adm-zip');
  const IMPORTED_CHANNEL = 'r165-imported-channel';
  const IMPORTED_ENTITY = 'r165-promptless-entity';
  const manifest = {
    format_version: '1.0.0',
    source_type: 'klatch',
    package_id: 'r165-pkg',
    package_kind: 'klatch.context.v1',
    created_at: '2026-09-06T19:00:00.000Z',
    provenance: [{ source: 'klatch', at: '2026-09-06T19:00:00.000Z', channel_id: IMPORTED_CHANNEL }],
    project: null,
    conversation_context: { id: IMPORTED_CHANNEL, name: 'Promptless import', type: 'chat', mode: 'roundtable', created_at: '2026-09-06T19:00:00.000Z' },
    // The entity a sending instance would produce if its own agent had no prompt.
    entities: [{ id: IMPORTED_ENTITY, name: 'Promptless', handle: 'promptless', model: 'claude-opus-5' }],
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
  check('D', 'the package imports through the real route', imported.status === 201,
    `status ${imported.status} ${JSON.stringify(imported.json)?.slice(0, 160)}`);
  const impStored = await storedEntityPrompt(IMPORTED_ENTITY);
  measure('D', 'what the import path stored for a promptless entity',
    `${JSON.stringify(impStored)} (${impStored?.length ?? 0} chars)`);
  check('D', 'the import path substitutes a non-empty prompt, like the other three writers',
    (impStored ?? '').length > 0, `stored ${JSON.stringify(impStored)}`);

  const impDbg = await get(`/channels/${IMPORTED_CHANNEL}/prompt-debug`);
  measure('D', 'the imported channel assembles to', `${impDbg.json?.assembledLength} chars`);
  measure('D', 'its layer report',
    `L1=${JSON.stringify(impDbg.json?.layers?.['1_kitBriefing'])} L4=${JSON.stringify(impDbg.json?.layers?.['4_channelAddendum'])} L5=${JSON.stringify(impDbg.json?.layers?.['5_entityPrompt'])}`);
  // An imported channel gets a kit briefing at layer 1, so it is NOT zero-length even with
  // an empty layer 5 — say so explicitly rather than let the number look reassuring.
  const dChat = await boundChat('Native chat seating the imported agent', IMPORTED_ENTITY);
  measure('D', 'a NATIVE 1:1 seating the same imported agent assembles to', `${dChat.dbg?.assembledLength} chars`);
  check('D', 'a native 1:1 seating an imported promptless agent still gets a system prompt',
    (dChat.dbg?.assembledLength ?? -1) > 0, `assembledLength=${dChat.dbg?.assembledLength}`);

  // ── Arm E — what the L5 reporter says when layer 5 is empty ───────────────────
  //
  // Layer 4 grew a reason string in Round 162 (`EMPTY — default purpose, not sent`) so a
  // reader can tell "nothing was written" from "boilerplate was written and dropped".
  // Layer 5 reports a length and nothing else. Recorded, not argued.
  const emptyL5 = bChat.dbg?.layers?.['5_entityPrompt'];
  measure('E', 'L5 reporter with an empty entity prompt', JSON.stringify(emptyL5));
  measure('E', 'L5 reporter with the boilerplate', JSON.stringify(aChat.dbg?.layers?.['5_entityPrompt']));
  check('E', 'a reader can tell an empty layer 5 from a populated one',
    typeof emptyL5 === 'string' && /— 0 chars$/.test(emptyL5),
    `L5=${JSON.stringify(emptyL5)}`);

  // ── Arm F — Round 162/163 regression ──────────────────────────────────────────
  //
  // Round 164 is comments and tests, so layer 4 should be byte-identical. Re-run the two
  // numbers that pinned Round 163 rather than trusting the diff.
  // The expected length is computed from the fixture, not typed. First run of this probe
  // asserted a hand-counted 57 against a measured 58 — my arithmetic, not the server's.
  const PIPER_PROMPT = 'You are Piper Morgan, a product manager. PIPER-MARKER-R165';
  const piper = await post('/entities', { name: 'Piper Morgan', handle: 'piper165', systemPrompt: PIPER_PROMPT });
  const PIPER = piper.json?.id as string;
  const fChat = await boundChat('Continue with Piper', PIPER);
  check('F', 'the boilerplate purpose is still dropped at layer 4',
    fChat.dbg?.layers?.['4_channelAddendum'] === 'EMPTY — default purpose, not sent',
    `L4=${JSON.stringify(fChat.dbg?.layers?.['4_channelAddendum'])}`);
  check('F', "the identity is the whole prompt, at char 0",
    fChat.dbg?.assembledPrompt === PIPER_PROMPT,
    `prompt starts ${JSON.stringify(fChat.dbg?.assembledPrompt?.slice(0, 40))}`);
  check('F', 'a real identity at layer 5 is untouched by any of this',
    fChat.dbg?.assembledLength === PIPER_PROMPT.length,
    `assembledLength=${fChat.dbg?.assembledLength} (fixture is ${PIPER_PROMPT.length})`);

  // ── Arm I — blast radius: which rooms are actually exposed ────────────────────
  //
  // A zero-length assembly needs *every* layer empty. I expected a klatch to be protected
  // by a briefing above layer 5 and wrote the arm to show that; it measured 0 chars too.
  // The kit briefing is layer 1 and fires on `source !== 'native'` only, which is why the
  // *imported* channel in arm D came back at 1009 chars and a native klatch does not.
  // Left in with the wrong expectation corrected rather than deleted, because the arm's
  // value turned out to be that it widened the blast radius rather than bounding it.
  const emptied = await post('/entities', { name: 'Emptied Two', handle: 'emptied2', systemPrompt: 'temporary' });
  const EMPTIED = emptied.json?.id as string;
  await patch(`/entities/${EMPTIED}`, { systemPrompt: '' });
  const klatch = await post('/channels', { name: 'Klatch with an emptied seat', type: 'klatch', systemPrompt: PREAMBLE, entityIds: [EMPTIED, PIPER] });
  const kDbg = await get(`/channels/${klatch.json?.id}/prompt-debug?entityId=${EMPTIED}`);
  measure('I', 'a klatch seat held by the emptied agent assembles to', `${kDbg.json?.assembledLength} chars (status ${klatch.status})`);
  const nativeDbg = (await boundChat('Native 1:1 with the emptied agent', EMPTIED)).dbg;
  measure('I', 'a native 1:1 with the same agent assembles to', `${nativeDbg?.assembledLength} chars`);
  measure('I', 'exposed rooms', 'every NATIVE room — 1:1 and klatch both — with no project, no files and a default purpose; only an imported channel is covered, and only by its layer-1 kit briefing');

  // ── Arm G — what the wire gets when assembly returns zero length ──────────────
  //
  // Source identity, not a model call: `client.ts` sends `systemPrompt || undefined`, so a
  // zero-length assembly is not a zero-length `system` field — it is *no* system field.
  // Worth stating precisely, because the invariant is written as "never a zero-length
  // prompt" and the real consequence is "no system prompt at all".
  {
    const src = fs.readFileSync(path.join(REPO, 'packages/server/src/claude/client.ts'), 'utf8');
    const sends = [...src.matchAll(/system: systemPrompt \|\| undefined,/g)].length;
    measure('G', 'send sites that coalesce an empty assembled prompt to undefined', `${sends} in claude/client.ts`);
    check('G', 'an empty assembly reaches the API as an absent system field, not an empty one',
      sends >= 1, `${sends} site(s) matched \`system: systemPrompt || undefined\``);
    check('G', 'layer 5 pushes only a non-empty prompt (so an empty one is skipped, not blanked)',
      /if \(entity\.systemPrompt\?\.trim\(\)\) parts\.push\(entity\.systemPrompt\.trim\(\)\);/.test(src),
      'buildSystemPrompt layer 5 guarded by a truthiness check');
  }

  // ── Arm H — export.ts:249, and the bare-literal count ─────────────────────────
  //
  // Daedalus named `export.ts:249` as "the last bare literal on the server" and left it
  // deliberately. Two things measured here: that the fallback is still there (it protects
  // session notes from exactly the state arm B produces), and the actual count, because
  // "last" is loose — the seeds are bare literals too.
  {
    const files = ['routes/export.ts', 'routes/entities.ts', 'db/index.ts', 'claude/client.ts', 'aaxt/probe-generator.ts'];
    let bare = 0;
    const sites: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(path.join(REPO, 'packages/server/src', f), 'utf8');
      src.split('\n').forEach((line, i) => {
        if (!line.includes(PREAMBLE)) return;
        const t = line.trim();
        const isComment = t.startsWith('*') || t.startsWith('//') || t.startsWith('/*');
        if (isComment) return;
        bare++;
        sites.push(`${f}:${i + 1}`);
      });
    }
    measure('H', 'bare (non-comment) occurrences of the literal on the server', `${bare} — ${sites.join(', ')}`);
    const exportSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/export.ts'), 'utf8');
    check('H', 'the session-notes call still substitutes when an entity prompt is empty',
      new RegExp(`system: entity\\.systemPrompt \\|\\| '${PREAMBLE.replace(/\./g, '\\.')}'`).test(exportSrc),
      'routes/export.ts keeps its own fallback');
    // The asymmetry worth naming: the export path protects itself against the empty-prompt
    // state, and assembly does not.
    measure('H', 'asymmetry', 'export.ts substitutes for an empty entity prompt; buildSystemPrompt layer 5 skips it');
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
  await shutdown(regFailed.length > 0 ? 1 : 0);
} catch (err) {
  console.error(err);
  await shutdown(1);
}
