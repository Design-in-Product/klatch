/**
 * Round 161 probe — Path C ("continue existing role") driven at the real HTTP endpoint.
 *
 * Theseus, 2026-09-06 START fire. Daedalus shipped Path C in `717bfb6` three hours
 * before this fire: the New Chat form now offers the agent picker, so a 1:1 can be
 * bound to an agent you already have instead of always landing on the shared default
 * entity. His 11 new tests are React component tests against a mocked callback, and
 * the commit message's end-to-end claim —
 *
 *   "Verified end-to-end, not assumed: the send path resolves responders from
 *    getChannelEntities (messages.ts:87) with no default hardcode, and
 *    buildSystemPrompt layers entity.systemPrompt (client.ts:491)"
 *
 * — cites two source line numbers. That is a code read. It is very likely correct,
 * and it is not the same thing as having watched a bound chat come back off a real
 * server. Round 141 arm F is why the distinction is worth a probe: `entityGuess` was
 * typed, populated and unit-tested against mocked fetch, and would have shipped a
 * permanently-blank field because the route never spread it.
 *
 * Run:  npx tsx scripts/probe-path-c-chat-binding-live.mts
 *
 * ZERO MODEL CALLS. Every arm reads `/api/channels/:id/prompt-debug`, which assembles
 * the prompt the API *would* be sent and returns it without sending it. Scratch DB via
 * KLATCH_DB under `.testdata/`; xian's `klatch.db` is never opened. Nothing under
 * `packages/` is written — asserted at exit, not assumed.
 *
 * Arms:
 *   A  the binding survives the round trip: POST roster -> GET participants   [regression]
 *   B  layer 5 is the bound agent, and its text is in the assembled prompt    [regression]
 *   C  the empty-roster path still lands on the default entity                [regression]
 *   D  route guards: chat+2 rejects, unknown id rejects, [X,X] boundary       [regression]
 *   E  the generic-assistant preamble the form's own default injects          [open]
 *   F  continuity asymmetry: same agent, continuous in a klatch, blank in 1:1 [open]
 *   G  which model a bound chat runs on                                       [measurement]
 *
 * A–D assert behaviour that holds today and must keep holding; a failure exits 1.
 * E and F encode consequences that are live RIGHT NOW and are written in the positive
 * — the day they pass is the day the underlying item is genuinely closed. They report
 * and do not exit 1, so a red exit stays meaningful. Same convention as Round 142.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'path-c-chat-binding');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}/api`;

// Read from source so a rename can't stale the probe.
const DEFAULT_ENTITY_ID = (() => {
  const src = fs.readFileSync(path.join(REPO, 'packages/shared/src/types.ts'), 'utf8');
  const m = src.match(/export const DEFAULT_ENTITY_ID = '([^']+)'/);
  if (!m) throw new Error('could not read DEFAULT_ENTITY_ID from shared/src/types.ts');
  return m[1];
})();

// The client's own fallback, read out of the shipped component rather than retyped —
// arm E is a claim about what the FORM sends, so the string has to come from the form.
const CLIENT_PROMPT_FALLBACK = (() => {
  const src = fs.readFileSync(path.join(REPO, 'packages/client/src/components/ChannelSidebar.tsx'), 'utf8');
  const m = src.match(/newPrompt\.trim\(\) \|\| '([^']+)'/);
  if (!m) throw new Error('could not read the prompt fallback from ChannelSidebar.tsx');
  return m[1];
})();

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

// ── Preflight: the tree must be clean under packages/ before and after ───────────
import { execFileSync } from 'child_process';
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

// Boot
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

try {
  // ── Fixtures ──────────────────────────────────────────────────────────────────
  //
  // PIPER is the shape Path C exists for: an agent with a real identity prompt and a
  // conversation of its own already in the DB. VESPER is a second agent, needed only
  // for the chat+2 guard.
  const PIPER_MARKER = 'PIPER-IDENTITY-MARKER-R161';
  const VESPER_MARKER = 'VESPER-IDENTITY-MARKER-R161';

  const piperRes = await post('/entities', {
    name: 'Piper Morgan',
    handle: 'piper',
    systemPrompt: `You are Piper Morgan, a product manager. ${PIPER_MARKER}`,
  });
  const vesperRes = await post('/entities', {
    name: 'Vesper',
    handle: 'vesper',
    systemPrompt: `You are Vesper. ${VESPER_MARKER}`,
  });
  if (piperRes.status !== 201 || vesperRes.status !== 201) {
    console.error('fixture entities failed', piperRes, vesperRes);
    await shutdown(1);
  }
  const PIPER = piperRes.json.id as string;
  const VESPER = vesperRes.json.id as string;

  // Piper's prior conversation. Created bound to Piper, then seeded with messages by a
  // second connection to the same file — the server's reads are ordinary SELECTs and
  // see committed rows. This is the state a user is actually in when they reach for
  // Path C: they imported Piper yesterday and want to talk to them today.
  const PRIOR_MARKER = 'PRIOR-CONVERSATION-MARKER-R161';
  const prior = await post('/channels', { name: "Piper's earlier thread", entityIds: [PIPER] });
  if (prior.status !== 201) { console.error('prior channel failed', prior); await shutdown(1); }
  const PRIOR_ID = prior.json.id as string;

  {
    const { default: Database } = await import('better-sqlite3');
    const conn = new Database(DB);
    const ins = conn.prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Six turns. `entity_id` NULL on user rows and stamped on assistant rows, matching
    // `insertMessage` — `entityTranscriptWhere` (queries.ts:647) unions on exactly that
    // shape, so getting it wrong here would silently measure half a conversation.
    for (let i = 0; i < 3; i++) {
      ins.run(`r161-u${i}`, PRIOR_ID, 'user', `Question ${i} about the roadmap.`, 'complete', null, null,
        new Date(Date.UTC(2026, 8, 5, 10, i)).toISOString());
      ins.run(`r161-a${i}`, PRIOR_ID, 'assistant', `Answer ${i}. ${PRIOR_MARKER}`, 'complete', 'claude-opus-5', PIPER,
        new Date(Date.UTC(2026, 8, 5, 10, i, 30)).toISOString());
    }
    conn.close();
  }

  // ── Arm A — the binding survives the round trip ───────────────────────────────
  //
  // Sent exactly as the shipped form sends it: `type` omitted (ChannelSidebar.tsx:125
  // passes undefined for a chat), the client's own prompt fallback, one entity.
  const bound = await post('/channels', {
    name: 'Continue with Piper',
    systemPrompt: CLIENT_PROMPT_FALLBACK,
    type: undefined,
    mode: undefined,
    projectId: undefined,
    entityIds: [PIPER],
  });
  check('A', 'POST with a one-agent roster is accepted', bound.status === 201, `status ${bound.status}`);
  const BOUND_ID = bound.json?.id as string;
  check('A', 'server resolves the omitted type to chat', bound.json?.type === 'chat', `type=${bound.json?.type}`);

  const dbg = await get(`/channels/${BOUND_ID}/prompt-debug`);
  check('A', 'prompt-debug reachable for the bound chat', dbg.status === 200, `status ${dbg.status}`);
  check('A', 'the resolved entity is the one that was picked',
    dbg.json?.entityId === PIPER, `entityId=${dbg.json?.entityId} expected=${PIPER}`);
  check('A', 'the roster is exactly one seat, and it is Piper',
    Array.isArray(dbg.json?.participants) && dbg.json.participants.length === 1 && dbg.json.participants[0].id === PIPER,
    `participants=${JSON.stringify(dbg.json?.participants?.map((p: any) => p.name))}`);
  check('A', 'the default entity is NOT in the room',
    !dbg.json?.participants?.some((p: any) => p.id === DEFAULT_ENTITY_ID),
    `ids=${JSON.stringify(dbg.json?.participants?.map((p: any) => p.id))}`);

  const list = await get('/channels');
  const listed = list.json?.find((c: any) => c.id === BOUND_ID);
  check('A', 'the bound chat appears in the enriched channel list with one seat',
    listed?.entityCount === 1, `entityCount=${listed?.entityCount}`);

  // ── Arm B — layer 5 is the bound agent ────────────────────────────────────────
  check('B', 'layer 5 names Piper',
    typeof dbg.json?.layers?.['5_entityPrompt'] === 'string' && dbg.json.layers['5_entityPrompt'].includes('Piper Morgan'),
    `layer5=${JSON.stringify(dbg.json?.layers?.['5_entityPrompt'])}`);
  check('B', "Piper's identity text is in the assembled prompt",
    typeof dbg.json?.assembledPrompt === 'string' && dbg.json.assembledPrompt.includes(PIPER_MARKER),
    `marker present=${dbg.json?.assembledPrompt?.includes(PIPER_MARKER)}`);
  check('B', "no other agent's identity leaked in",
    !dbg.json?.assembledPrompt?.includes(VESPER_MARKER), 'Vesper marker absent');

  // ── Arm C — the empty-roster path is unchanged ────────────────────────────────
  const plain = await post('/channels', { name: 'A new assistant', systemPrompt: CLIENT_PROMPT_FALLBACK });
  const plainDbg = await get(`/channels/${plain.json?.id}/prompt-debug`);
  check('C', 'omitting the roster still lands on the default entity',
    plainDbg.json?.entityId === DEFAULT_ENTITY_ID, `entityId=${plainDbg.json?.entityId}`);
  check('C', 'the default chat carries no bound agent identity',
    !plainDbg.json?.assembledPrompt?.includes(PIPER_MARKER), 'Piper marker absent');
  // The control arm E needs. Pre-Path-C every 1:1 landed here, and the default
  // entity's own seeded prompt (db/index.ts:84) is the *same string* the form sends
  // as its fallback — so layer 4 duplicated layer 5 and cost nothing. Measured rather
  // than reasoned, because the whole point of E is that this line did not change.
  measure('C', 'the default 1:1 assembled prompt, in full',
    `${plainDbg.json?.assembledLength} chars — ${JSON.stringify(plainDbg.json?.assembledPrompt)}`);

  // ── Arm D — the route guards ──────────────────────────────────────────────────
  const two = await post('/channels', { name: 'Two in a chat', entityIds: [PIPER, VESPER] });
  check('D', 'chat + 2 agents is rejected', two.status === 400, `status ${two.status} — ${JSON.stringify(two.json?.error)}`);

  const unknown = await post('/channels', { name: 'Ghost', entityIds: ['no-such-entity'] });
  check('D', 'an unknown entity id is rejected with a clean 400',
    unknown.status === 400 && /Unknown entity ID/.test(unknown.json?.error ?? ''),
    `status ${unknown.status} — ${JSON.stringify(unknown.json?.error)}`);

  const klatchTwo = await post('/channels', { name: 'Two in a klatch', type: 'klatch', entityIds: [PIPER, VESPER] });
  check('D', 'klatch + 2 agents is accepted', klatchTwo.status === 201, `status ${klatchTwo.status}`);
  const KLATCH_ID = klatchTwo.json?.id as string;

  // The boundary the form cannot reach but the API can: a duplicated id. `createChannel`
  // dedups (`[...new Set(entityIds)]`, queries.ts:178) but the route's coherence guard
  // counts the raw array (`:183`), so the two disagree about what [X,X] means. Recorded
  // rather than asserted — I have no ruling on which is right.
  const dup = await post('/channels', { name: 'Duplicated seat', entityIds: [PIPER, PIPER] });
  measure('D', 'chat with a duplicated entity id',
    `status ${dup.status} — route counts the raw array (rejects at length>1); createChannel would have deduped to one seat`);
  const dupKlatch = await post('/channels', { name: 'Duplicated klatch seat', type: 'klatch', entityIds: [PIPER, PIPER] });
  const dupKlatchDbg = dupKlatch.status === 201 ? await get(`/channels/${dupKlatch.json.id}/prompt-debug`) : null;
  measure('D', 'klatch with a duplicated entity id',
    `status ${dupKlatch.status}, seats=${dupKlatchDbg?.json?.participants?.length ?? 'n/a'} (dedup happens below the guard)`);

  // ── Arm E — the preamble the form's own default injects ───────────────────────
  //
  // The claim under test: a user who picks "continue with Piper Morgan" and leaves the
  // optional prompt field empty gets a channel addendum that says they are a generic
  // assistant, layered ABOVE Piper's own identity (buildSystemPrompt pushes layer 4 at
  // client.ts:482 and layer 5 at :491). Written in the positive — this passes on the
  // day a bound chat no longer carries the generic line.
  const assembled: string = dbg.json?.assembledPrompt ?? '';
  const idxFallback = assembled.indexOf(CLIENT_PROMPT_FALLBACK);
  const idxIdentity = assembled.indexOf(PIPER_MARKER);
  check('E', 'a bound chat does not carry the generic-assistant line',
    idxFallback === -1,
    idxFallback === -1
      ? 'absent'
      : `present at char ${idxFallback}; Piper's identity at ${idxIdentity} — generic line comes ${idxFallback < idxIdentity ? 'FIRST' : 'second'}`,
    'open');
  measure('E', 'layer 4 as prompt-debug reports it', `${JSON.stringify(dbg.json?.layers?.['4_channelAddendum'])}`);
  measure('E', 'the exact string the form sends when the prompt field is empty',
    `${JSON.stringify(CLIENT_PROMPT_FALLBACK)} (ChannelSidebar.tsx handleSubmit)`);

  // ── Arm F — the continuity asymmetry ──────────────────────────────────────────
  //
  // Same agent, same prior conversation, two rooms. `buildCarriedContextBlock` returns
  // undefined unless `channel.type === 'klatch'` (carried-context.ts:303), and the
  // recall tool is gated on that same value (client.ts:1023), so a bound 1:1 gets
  // neither. The decision is real and documented — continuity-3-carried-context.md:11,
  // "Scope: klatches only. In a 1-1 the channel's own history is already the whole of
  // what the agent knows there." Path C is what makes that sentence false: the bound
  // agent's history lives somewhere else by construction.
  const klatchDbg = await get(`/channels/${KLATCH_ID}/prompt-debug?entityId=${PIPER}`);
  const chatLayer6: string = dbg.json?.layers?.['6_carriedContext'] ?? '';
  const klatchLayer6: string = klatchDbg.json?.layers?.['6_carriedContext'] ?? '';

  measure('F', 'layer 6 in the bound 1:1', JSON.stringify(chatLayer6));
  measure('F', 'layer 6 in a klatch seating the same agent', JSON.stringify(klatchLayer6));

  const klatchCarries = /^ACTIVE/.test(klatchLayer6);
  check('F', 'the klatch control actually carries something (otherwise F measures nothing)',
    klatchCarries, klatchCarries ? 'klatch layer 6 ACTIVE' : `klatch layer 6 = ${JSON.stringify(klatchLayer6)}`);

  const chatHasPrior = assembled.includes(PRIOR_MARKER);
  const klatchHasPrior = (klatchDbg.json?.assembledPrompt ?? '').includes(PRIOR_MARKER);
  check('F', "a bound 1:1 arrives with the agent's own prior conversation",
    chatHasPrior,
    `prior-conversation marker in the 1:1 prompt: ${chatHasPrior}; in the klatch prompt: ${klatchHasPrior}`,
    'open');

  measure('F', 'assembled prompt length, bound 1:1 vs klatch',
    `${dbg.json?.assembledLength} chars vs ${klatchDbg.json?.assembledLength} chars ` +
    `(delta ${(klatchDbg.json?.assembledLength ?? 0) - (dbg.json?.assembledLength ?? 0)})`);

  // The recall tool rides the same gate. Asserted at source with an exact occurrence
  // count rather than inferred, because there is no way to observe tool availability
  // through prompt-debug and I am not spending a model call to find out.
  {
    const src = fs.readFileSync(path.join(REPO, 'packages/server/src/claude/client.ts'), 'utf8');
    const gate = src.match(/\.\.\.\(carried \? \{ recall: \{ entity, channel \} \} : \{\}\)/g) ?? [];
    measure('F', 'recall tool gate in the 1:1 send path',
      `${gate.length} occurrence(s) of \`...(carried ? { recall } : {})\` — carried is undefined for a chat, so the tool is absent`);
  }

  // ── Arm G — which model a bound chat runs on ──────────────────────────────────
  //
  // The form passes `undefined` for the channel model (App.tsx handleCreateChannel), so
  // the channel row gets DEFAULT_MODEL, while streamClaudeCore reads `entity.model`
  // (client.ts:800). For a bound chat those can differ, and the channel row is what
  // the settings surface reads. Recorded, not judged.
  // The off-default model is taken from the server's own /models list rather than
  // hardcoded — a hardcoded id is rejected by `isValidModel` (routes/models.ts:107)
  // the moment the discovered list changes, which silently skips the arm.
  const modelsRes = await get('/models');
  const defaultModel: string = modelsRes.json?.defaultModel;
  const offDefault = (modelsRes.json?.models ?? []).map((m: any) => m.id).find((id: string) => id !== defaultModel);

  if (!offDefault) {
    measure('G', 'skipped', `no second model in the server's list (source=${modelsRes.json?.source})`);
  } else {
    const wrenRes = await post('/entities', { name: 'Wren', handle: 'wren', model: offDefault, systemPrompt: 'You are Wren.' });
    if (wrenRes.status !== 201) {
      measure('G', 'skipped', `entity create with ${offDefault} returned ${wrenRes.status} — ${JSON.stringify(wrenRes.json?.error)}`);
    } else {
      const wrenChat = await post('/channels', { name: 'Continue with Wren', systemPrompt: CLIENT_PROMPT_FALLBACK, entityIds: [wrenRes.json.id] });
      const wrenDbg = await get(`/channels/${wrenChat.json?.id}/prompt-debug`);
      const chanRow = (await get('/channels')).json?.find((c: any) => c.id === wrenChat.json?.id);
      measure('G', 'channel row model vs bound entity model',
        `channel.model=${chanRow?.model} · entity.model=${wrenRes.json.model} · ` +
        `the turn runs on entity.model (client.ts:800), so the channel row is not what gets called`);
      measure('G', 'the bound entity resolves regardless of model', `entityName=${wrenDbg.json?.entityName}`);
      measure('G', 'model list source', `${modelsRes.json?.source}, default=${defaultModel}, off-default picked=${offDefault}`);
    }
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
  const openPassing = open.filter((r) => r.pass);

  console.log('\n──────── summary ────────');
  console.log(`regression: ${reg.length - regFailed.length}/${reg.length} passed`);
  console.log(`open:       ${openPassing.length}/${open.length} now passing (a pass here means the item closed)`);
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
