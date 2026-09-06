/**
 * Round 163 probe — Daedalus's Round 162 fixes driven at the real HTTP endpoint.
 *
 * Theseus, 2026-09-06 MID fire. `aeef9f2` landed three hours before this fire and closes
 * the two consequences I measured live in Round 161:
 *
 *   1. `buildSystemPrompt` layer 4 now skips the boilerplate default via
 *      `isDefaultChannelPreamble()` (shared), and all three prompt-debug L4 reporters
 *      follow assembly with `EMPTY — default purpose, not sent`.
 *   2. The chat roster guard counts distinct agents, so `entityIds: [X, X]` is
 *      201-with-one-seat rather than 400.
 *
 * 12 unit tests plus a negative control back it. Same reason as Round 161 to drive it
 * anyway: unit tests call `buildSystemPrompt` directly, and the question a user has is
 * what comes back off a real server.
 *
 * This probe also tests a **population claim** that the unit tests cannot reach, because
 * it is a claim about stored data rather than about assembly. His memo §2 point 1 and his
 * doc title both say the assembly fix "reaches the imports," and that imported channels
 * are "exactly the 'real identity at layer 5' case where the generic line contradicts
 * something." Arm H imports a session through the real endpoint and reads what was
 * actually stored.
 *
 * Run:  npx tsx scripts/probe-round162-preamble-drop-and-roster-live.mts
 *
 * ZERO MODEL CALLS. Every assembly arm reads `/api/channels/:id/prompt-debug`, which
 * assembles the prompt the API *would* be sent and returns it without sending it. The
 * AAXT reporters (`/aaxt-probe`, `/aaxt-run`) are deliberately NOT called — those routes
 * generate probes with the auxiliary model. Arm L checks them by source identity instead.
 * Scratch DB via KLATCH_DB under `.testdata/`; xian's `klatch.db` is never opened.
 * Nothing under `packages/` is written — asserted at exit, not assumed.
 *
 * Arms:
 *   A  Round 161 regression: the Path C binding still survives the round trip  [regression]
 *   E  the generic line is gone from a bound chat — Round 161's open arm       [regression]
 *   G  the fix reaches channels that already existed (stored-string case)      [regression]
 *   H  the import population: what an imported channel actually stores         [measurement]
 *   I  the same 28 chars at layer 5, which the predicate does not filter       [measurement]
 *   J  the deduped roster, and the ordering Daedalus pinned                    [regression]
 *   K  the cost of an unconditional drop: exact-match boundaries               [regression]
 *   L  the three L4 reporters agree, checked mechanically                      [regression]
 *   F  continuity asymmetry — still open, still xian's call                    [open]
 *
 * Regression arms exit 1 on failure. `open` reports and does not, written in the positive
 * so the day it passes is the day the item closed. Same convention as Rounds 142/161.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round162-preamble-drop');
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
// The string under test, taken from the constant Round 162 introduced rather than retyped.
const PREAMBLE = readConst('packages/shared/src/types.ts', /export const DEFAULT_CHANNEL_PREAMBLE = '([^']+)'/, 'DEFAULT_CHANNEL_PREAMBLE');
// The client still holds its own copy (Iris's four literals, deliberately untouched in 162).
const CLIENT_FALLBACK = readConst('packages/client/src/components/ChannelSidebar.tsx', /newPrompt\.trim\(\) \|\| '([^']+)'/, 'the client prompt fallback');

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

// ── A Claude Code session fixture, written under .testdata (same shape as
//    probe-import-live-http.mts). Arm H imports it through the real endpoint. ──────
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function writeSession(file: string, identityLine: string, reply: string): string {
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    {
      type: 'user', uuid: userUuid, parentUuid: null, sessionId,
      timestamp: '2026-09-06T19:00:00.000Z', cwd: '/tmp/probe', permissionMode: 'default',
      message: { role: 'user', content: identityLine },
    },
    {
      type: 'assistant', uuid: uuid(), parentUuid: userUuid, sessionId,
      timestamp: '2026-09-06T19:00:05.000Z', cwd: '/tmp/probe',
      message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: reply }], stop_reason: 'end_turn' },
    },
  ];
  const p = path.join(SCRATCH, file);
  fs.writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return p;
}
const IMPORT_FIXTURE = writeSession('piper-session.jsonl', 'You are Piper Morgan, a product manager.', 'Piper here.');

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
/** Read a channel row straight out of the scratch file — what was *stored*, not what assembly did with it. */
async function storedSystemPrompt(channelId: string): Promise<string | null> {
  const { default: Database } = await import('better-sqlite3');
  const conn = new Database(DB, { readonly: true });
  const row = conn.prepare('SELECT system_prompt FROM channels WHERE id = ?').get(channelId) as { system_prompt: string | null } | undefined;
  conn.close();
  return row ? row.system_prompt : null;
}

try {
  // ── Fixtures ──────────────────────────────────────────────────────────────────
  const PIPER_MARKER = 'PIPER-IDENTITY-MARKER-R163';
  const VESPER_MARKER = 'VESPER-IDENTITY-MARKER-R163';
  const PIPER_PROMPT = `You are Piper Morgan, a product manager. ${PIPER_MARKER}`;

  const piperRes = await post('/entities', { name: 'Piper Morgan', handle: 'piper', systemPrompt: PIPER_PROMPT });
  const vesperRes = await post('/entities', { name: 'Vesper', handle: 'vesper', systemPrompt: `You are Vesper. ${VESPER_MARKER}` });
  if (piperRes.status !== 201 || vesperRes.status !== 201) {
    console.error('fixture entities failed', piperRes, vesperRes); await shutdown(1);
  }
  const PIPER = piperRes.json.id as string;
  const VESPER = vesperRes.json.id as string;

  // ── Arm A — the Path C binding still survives the round trip ──────────────────
  //
  // Round 161's arms A–C, re-run unchanged. Round 162 touched the create route, so the
  // binding is exactly the thing that could have regressed underneath the fix.
  const bound = await post('/channels', {
    name: 'Continue with Piper', systemPrompt: CLIENT_FALLBACK,
    type: undefined, mode: undefined, projectId: undefined, entityIds: [PIPER],
  });
  check('A', 'POST with a one-agent roster is accepted', bound.status === 201, `status ${bound.status}`);
  const BOUND_ID = bound.json?.id as string;
  check('A', 'server resolves the omitted type to chat', bound.json?.type === 'chat', `type=${bound.json?.type}`);

  const dbg = await get(`/channels/${BOUND_ID}/prompt-debug`);
  check('A', 'the resolved entity is the one that was picked', dbg.json?.entityId === PIPER, `entityId=${dbg.json?.entityId}`);
  check('A', 'the roster is exactly one seat, and it is Piper',
    dbg.json?.participants?.length === 1 && dbg.json.participants[0].id === PIPER,
    `participants=${JSON.stringify(dbg.json?.participants?.map((p: any) => p.name))}`);
  check('A', 'the default entity is NOT in the room',
    !dbg.json?.participants?.some((p: any) => p.id === DEFAULT_ENTITY_ID),
    `ids=${JSON.stringify(dbg.json?.participants?.map((p: any) => p.id))}`);
  check('A', "Piper's identity text is in the assembled prompt",
    (dbg.json?.assembledPrompt ?? '').includes(PIPER_MARKER), 'marker present');
  check('A', "no other agent's identity leaked in",
    !(dbg.json?.assembledPrompt ?? '').includes(VESPER_MARKER), 'Vesper marker absent');

  const plain = await post('/channels', { name: 'A new assistant', systemPrompt: CLIENT_FALLBACK });
  const plainDbg = await get(`/channels/${plain.json?.id}/prompt-debug`);
  check('A', 'omitting the roster still lands on the default entity',
    plainDbg.json?.entityId === DEFAULT_ENTITY_ID, `entityId=${plainDbg.json?.entityId}`);

  // ── Arm E — Round 161's open arm, now asserted as a regression ────────────────
  //
  // This was `open` in Round 161 and it FAILED there: the bound chat carried the generic
  // line at char 0 and Piper's identity at char 71. Promoted to `regression` because the
  // fix is shipped; from here on, a failure is a re-introduction.
  const assembled: string = dbg.json?.assembledPrompt ?? '';
  const idxPreamble = assembled.indexOf(PREAMBLE);
  check('E', 'a bound chat does not carry the generic-assistant line',
    idxPreamble === -1,
    idxPreamble === -1 ? 'absent' : `present at char ${idxPreamble}`);
  check('E', 'the bound chat is the identity alone, at char 0',
    assembled === PIPER_PROMPT,
    `${dbg.json?.assembledLength} chars — ${JSON.stringify(assembled)}`);
  check('E', 'the L4 reporter says what assembly does', dbg.json?.layers?.['4_channelAddendum'] === 'EMPTY — default purpose, not sent',
    JSON.stringify(dbg.json?.layers?.['4_channelAddendum']));

  // The Round 161 control, re-measured. It was 58 chars = the sentence twice (layer 4
  // duplicating layer 5, since the default entity's seeded prompt is the same string).
  // Daedalus predicts 28. Measured, not reasoned — the number is the evidence that the
  // change reached the default path and did not over-reach into layer 5.
  measure('E', 'the default 1:1 assembled prompt, in full',
    `${plainDbg.json?.assembledLength} chars — ${JSON.stringify(plainDbg.json?.assembledPrompt)} (Round 161: 58 chars)`);
  check('E', 'the default 1:1 still carries an identity at layer 5 (layer 5 must NOT be filtered)',
    (plainDbg.json?.assembledPrompt ?? '').trim() === PREAMBLE,
    `assembled=${JSON.stringify(plainDbg.json?.assembledPrompt)}`);
  measure('E', 'the client still holds its own copy of the string',
    `ChannelSidebar.tsx sends ${JSON.stringify(CLIENT_FALLBACK)}; shared exports ${JSON.stringify(PREAMBLE)}; equal=${CLIENT_FALLBACK === PREAMBLE}`);

  // ── Arm G — the fix reaches channels that already existed ─────────────────────
  //
  // Daedalus's stated reason for fixing in assembly rather than at creation: "Creation-time
  // fixes only help channels created after they land. Every channel that already exists
  // carries the stored string." That is the load-bearing argument for where the fix went,
  // and it is testable — write the stored string into a channel row directly, bypassing the
  // route entirely, and see whether assembly drops it.
  {
    const preexisting = await post('/channels', { name: 'Created before the fix', systemPrompt: 'A real purpose.', entityIds: [PIPER] });
    const PRE_ID = preexisting.json?.id as string;
    const { default: Database } = await import('better-sqlite3');
    const conn = new Database(DB);
    conn.prepare('UPDATE channels SET system_prompt = ? WHERE id = ?').run(PREAMBLE, PRE_ID);
    conn.close();
    const preDbg = await get(`/channels/${PRE_ID}/prompt-debug`);
    check('G', 'a channel carrying the stored string is covered without being rewritten',
      !(preDbg.json?.assembledPrompt ?? '').includes(PREAMBLE) && (preDbg.json?.assembledPrompt ?? '').includes(PIPER_MARKER),
      `${preDbg.json?.assembledLength} chars — ${JSON.stringify(preDbg.json?.assembledPrompt)}`);
    check('G', 'the row is untouched — the fix reads, it does not migrate',
      (await storedSystemPrompt(PRE_ID)) === PREAMBLE,
      `stored=${JSON.stringify(await storedSystemPrompt(PRE_ID))}`);
  }

  // ── Arm H — the import population ─────────────────────────────────────────────
  //
  // The claim under test, from the Round 162 memo §2 point 1: imported channels are
  // "*exactly* the 'real identity at layer 5' case where the generic line contradicts
  // something," and the doc title says the fix "reaches the imports." Both are claims
  // about what imports STORE, which no assembly unit test can see. Imported through the
  // real endpoint; the row is then read straight out of the file.
  {
    const imp = await post('/import/claude-code', {
      sessionPath: IMPORT_FIXTURE, channelName: 'probe-imported-piper', entityName: 'Piper Morgan',
    });
    if (imp.status !== 200 && imp.status !== 201) {
      measure('H', 'import failed — arm skipped', `status ${imp.status} — ${JSON.stringify(imp.json)}`);
    } else {
      const IMP_ID = (imp.json?.channelId ?? imp.json?.channel?.id ?? imp.json?.id) as string;
      const stored = await storedSystemPrompt(IMP_ID);
      measure('H', 'what an imported channel actually stores as its purpose',
        `${JSON.stringify(stored)} (length ${stored === null ? 'null' : stored.length})`);
      const impDbg = await get(`/channels/${IMP_ID}/prompt-debug`);
      measure('H', 'the L4 reporter on an imported channel', JSON.stringify(impDbg.json?.layers?.['4_channelAddendum']));
      measure('H', 'the imported channel type and bound entity',
        `type=${impDbg.json?.channelType ?? '(not reported)'} · entityName=${JSON.stringify(impDbg.json?.entityName)}`);
      // The consequential question: was this population ever affected? Layer 4 was skipped
      // pre-162 for any falsy-after-trim value, so an empty stored purpose means the
      // boilerplate was never in an imported channel's prompt and the fix changes nothing
      // here. Written as a check so the answer is unambiguous either way.
      const everAffected = !!(stored && stored.trim() === PREAMBLE);
      measure('H', 'was the import population ever carrying the generic line?',
        everAffected
          ? 'YES — the stored purpose IS the boilerplate, so Round 162 changes what imports assemble'
          : `NO — stored purpose is ${JSON.stringify(stored)}, which layer 4 skipped before Round 162 as well (falsy after trim). The fix does not reach this population because the population was never affected.`);
    }
  }

  // ── Arm I — the same 28 chars at layer 5, which the predicate does not filter ──
  //
  // `isDefaultChannelPreamble` is applied to layer 4 only. `routes/entities.ts` substitutes
  // the identical string into an ENTITY's own prompt when the field is left blank, and
  // layer 5 has no predicate. So the question Round 162 answers for the channel form is
  // still open for the agent form. Measured, not ruled — an entity plausibly *should* have
  // a prompt, and this may be the right answer.
  {
    const blank = await post('/entities', { name: 'Unnamed Helper', handle: 'unnamed' });
    if (blank.status !== 201) {
      measure('I', 'blank-prompt entity create failed — arm skipped', `status ${blank.status} — ${JSON.stringify(blank.json)}`);
    } else {
      measure('I', "an entity created with no prompt stores", `${JSON.stringify(blank.json?.systemPrompt)}`);
      const blankChat = await post('/channels', { name: 'Chat with a blank agent', systemPrompt: CLIENT_FALLBACK, entityIds: [blank.json.id] });
      const blankDbg = await get(`/channels/${blankChat.json?.id}/prompt-debug`);
      measure('I', 'a chat bound to that agent assembles to',
        `${blankDbg.json?.assembledLength} chars — ${JSON.stringify(blankDbg.json?.assembledPrompt)}`);
      measure('I', 'its L4 vs L5 reporters',
        `L4=${JSON.stringify(blankDbg.json?.layers?.['4_channelAddendum'])} · L5=${JSON.stringify(blankDbg.json?.layers?.['5_entityPrompt'])}`);
      measure('I', 'AAXT consequence',
        `probe-generator TRIVIAL_CONTENT_THRESHOLD is 40 chars and applies per layer, so a ${PREAMBLE.length}-char L5 is below it — the Round 28 guard covers this shape too`);
    }
  }

  // ── Arm J — the deduped roster, and the ordering Daedalus pinned ──────────────
  const dupChat = await post('/channels', { name: 'Duplicated seat', entityIds: [PIPER, PIPER] });
  check('J', 'a chat with the same agent twice is accepted', dupChat.status === 201,
    `status ${dupChat.status} — ${JSON.stringify(dupChat.json?.error)} (Round 161: 400)`);
  if (dupChat.status === 201) {
    const dupDbg = await get(`/channels/${dupChat.json.id}/prompt-debug`);
    check('J', 'and seats that agent exactly once', dupDbg.json?.participants?.length === 1,
      `seats=${dupDbg.json?.participants?.length}`);
  }
  const dupKlatch = await post('/channels', { name: 'Duplicated klatch seat', type: 'klatch', entityIds: [PIPER, PIPER] });
  check('J', 'the klatch behaviour it was aligned to is unchanged', dupKlatch.status === 201, `status ${dupKlatch.status}`);
  check('J', 'two DISTINCT agents in a chat is still rejected',
    (await post('/channels', { name: 'Two in a chat', entityIds: [PIPER, VESPER] })).status === 400, 'status 400');
  // The ordering Daedalus pinned in a unit test, pinned here on the wire: dedup runs AFTER
  // unknown-id validation, so a duplicated unknown id is still a 400 rather than a 201 with
  // a phantom seat. He named this as "the bit a future refactor gets wrong."
  const dupUnknown = await post('/channels', { name: 'Ghost twice', entityIds: ['no-such-entity', 'no-such-entity'] });
  check('J', 'a duplicated UNKNOWN id is still rejected',
    dupUnknown.status === 400 && /Unknown entity ID/.test(dupUnknown.json?.error ?? ''),
    `status ${dupUnknown.status} — ${JSON.stringify(dupUnknown.json?.error)}`);
  const mixedUnknown = await post('/channels', { name: 'Piper and a ghost', entityIds: [PIPER, 'no-such-entity', PIPER] });
  check('J', 'dedup does not launder an unknown id in a mixed roster',
    mixedUnknown.status === 400, `status ${mixedUnknown.status} — ${JSON.stringify(mixedUnknown.json?.error)}`);

  // ── Arm K — the cost of an unconditional drop ─────────────────────────────────
  //
  // The predicate is exact-match-after-trim, so a user who *deliberately types* the
  // sentence loses it silently. That is the accepted cost and I am not disputing it —
  // but the boundaries need pinning, because the failure mode of a content-matching
  // predicate is eating content that merely starts with the string.
  {
    const cases: Array<[string, string, boolean]> = [
      // [label, purpose sent, expected to SURVIVE assembly]
      ['a purpose that merely starts with it', `${PREAMBLE} Use TypeScript.`, true],
      ['the string with surrounding whitespace', `  ${PREAMBLE}  `, false],
      ['a lowercase variant', PREAMBLE.toLowerCase(), true],
      ['the string without its full stop', PREAMBLE.replace(/\.$/, ''), true],
      ['a genuine purpose', 'This chat is about the parser rewrite.', true],
    ];
    for (const [label, purpose, shouldSurvive] of cases) {
      const ch = await post('/channels', { name: `K: ${label}`, systemPrompt: purpose, entityIds: [PIPER] });
      const d = await get(`/channels/${ch.json?.id}/prompt-debug`);
      const survived = (d.json?.assembledPrompt ?? '').includes(purpose.trim());
      check('K', `${label} → ${shouldSurvive ? 'survives' : 'dropped'}`, survived === shouldSurvive,
        `sent ${JSON.stringify(purpose)} · survived=${survived} · L4=${JSON.stringify(d.json?.layers?.['4_channelAddendum'])}`);
    }
  }

  // ── Arm L — the three L4 reporters agree ──────────────────────────────────────
  //
  // Daedalus's stated reason this matters: AAXT reads these exact strings to decide which
  // layers to probe, so a reporter saying ACTIVE for a layer assembly drops would quietly
  // re-create the Round 28 false-positive Phantom. `/prompt-debug` is checked live above;
  // the two AAXT routes are NOT called, because both generate probes with the auxiliary
  // model. Checked by source identity instead — cheap, and it is the property that matters.
  {
    const sources = [
      ['routes/channels.ts', fs.readFileSync(path.join(REPO, 'packages/server/src/routes/channels.ts'), 'utf8')],
      ['routes/aaxt.ts', fs.readFileSync(path.join(REPO, 'packages/server/src/routes/aaxt.ts'), 'utf8')],
    ] as const;
    const all = sources.map(([, s]) => s).join('\n');
    const reporters = [...all.matchAll(/'4_channelAddendum': \(\(\) => \{[\s\S]*?\}\)\(\),/g)].map((m) => m[0]);
    check('L', 'exactly three L4 reporters exist', reporters.length === 3, `found ${reporters.length}`);
    const guarded = reporters.filter((r) => /isDefaultChannelPreamble/.test(r) && /default purpose, not sent/.test(r));
    check('L', 'every one of them follows assembly', guarded.length === reporters.length,
      `${guarded.length}/${reporters.length} carry both the predicate and the EMPTY-with-reason string`);
    // The layer-4 assembly line and the reporters must use the SAME predicate, or the debug
    // surface can drift from the send path without any test noticing.
    const clientSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/claude/client.ts'), 'utf8');
    check('L', 'the assembly line uses the same predicate as the reporters',
      /if \(channelPreamble\?\.trim\(\) && !isDefaultChannelPreamble\(channelPreamble\)\) parts\.push/.test(clientSrc),
      'buildSystemPrompt layer 4 guarded by isDefaultChannelPreamble');
  }

  // ── Arm F — the continuity asymmetry, unchanged and still open ────────────────
  //
  // Round 161's other finding. Round 162 deliberately did not touch it — it is a design
  // call in front of xian (bidirectionality, open question 2, unanswered since 2026-07-19),
  // and Daedalus was right not to pre-empt it with a default. Re-run so the state stays
  // measured rather than remembered.
  const klatchDbg = await get(`/channels/${dupKlatch.json?.id}/prompt-debug?entityId=${PIPER}`);
  measure('F', 'layer 6 in the bound 1:1', JSON.stringify(dbg.json?.layers?.['6_carriedContext']));
  measure('F', 'layer 6 in a klatch seating the same agent', JSON.stringify(klatchDbg.json?.layers?.['6_carriedContext']));
  check('F', "a bound 1:1 arrives with the agent's own prior conversation",
    /^ACTIVE/.test(dbg.json?.layers?.['6_carriedContext'] ?? ''),
    `1:1 layer 6 = ${JSON.stringify(dbg.json?.layers?.['6_carriedContext'])}`, 'open');

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
