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
 *   M  the preamble has one definition, and the live seed reaches it           [regression]
 *   F  continuity asymmetry — still open, still xian's call                    [open]
 *
 * Regression arms exit 1 on failure. `open` reports and does not, written in the positive
 * so the day it passes is the day the item closed. Same convention as Rounds 142/161.
 *
 * ── Round 213 (Theseus, 2026-09-15 START) ────────────────────────────────────────────
 * This file crashed at import time from 2026-09-06 until today: a `readConst` regex read a
 * string literal out of ChannelSidebar.tsx, and Iris's `c62b4f48` replaced that literal with
 * an identifier 4.5 hours after the probe was written. No arm ran for nine days, including
 * through two later edits to this file — both correct as static reads, neither executed.
 * Argus caught it by running every script Round 211 touched instead of trusting the diff.
 *
 * Two changes, and the second is the one that generalises:
 *   1. `CLIENT_FALLBACK` now derives from the shared constant; arm M replaces the client-copy
 *      measurement, which post-dedup would have compared `PREAMBLE` to itself.
 *   2. Source reads that feed *checks* go through `locateLiteral`, which returns `null` and
 *      turns one check red, instead of throwing and taking every arm with it. A probe whose
 *      source reads are load-bearing should degrade to a failure, never to a crash.
 *
 * ── Round 215 (Theseus, 2026-09-15 WORK) ─────────────────────────────────────────────
 * Arm M argued four server sites should source the shared constant. Daedalus did it
 * (`dd99b374`, same day) and found two more in `__tests__/setup.ts` that my grep had walked
 * past. The fix invalidated all four of arm M's checks — this file ran 4-red at the top of
 * this fire, nine hours after the last re-aim. **Change 2 above earned itself twice in one
 * day: the arm degraded to four reds and the other 31 checks ran.**
 *
 * Arm M is re-aimed onto three properties that survive the fix, and the third is the one
 * Round 213 left open: the seed path is now *executed*, not read. This probe deletes its
 * scratch DB at startup, so the server it spawns runs the real `db/index.ts` seed against an
 * empty file every run — the chain from seed to layer-4 drop was always measurable here and
 * was never measured. Details at arm M.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { reapOnExit, requireAnUnoccupiedPort } from './lib/probe-server-ownership.mts';

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

// ── Round 213: what the client sends when the purpose field is left blank ──────────
//
// This was a `readConst` against a string literal in ChannelSidebar.tsx. Iris's
// `c62b4f48` (2026-09-06 19:31, 4.5h after this probe was written) unified the client's
// preamble literals onto the shared constant, so the line became
// `newPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE` — an identifier. The regex stopped
// matching, `readConst` threw at import time, and **this probe has not run a single arm
// since 9/6**, through two later edits to this file that were correct as static reads and
// never executed. Found by Argus, 2026-09-15, by running it rather than reading it.
//
// Post-dedup the client's value IS `PREAMBLE`, so reading it back out of the client would
// be a tautology dressed as an observation. Use the shared value at the call sites — that
// is genuinely what the client now sends — and move the drift question to the checks in
// `sourceCopyChecks()` below, which test the property that can still regress.
const CLIENT_FALLBACK = PREAMBLE;

/**
 * Locate a hardcoded copy of the preamble by its surrounding syntax and return it.
 *
 * `null` means the pattern no longer matches — which is the failure mode that took this
 * whole probe down for nine days. It is returned, never thrown: a source read that goes
 * stale should turn one check red and leave every other arm running.
 */
function locateLiteral(file: string, re: RegExp): string | null {
  const p = path.join(REPO, file);
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(re);
  return m ? m[1] : null;
}

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

await requireAnUnoccupiedPort(PORT, 'probe-round162-preamble-drop-and-roster-live');

const serverLog = path.join(SCRATCH, 'server.log');
const logFd = fs.openSync(serverLog, 'a');
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB },
  stdio: ['ignore', logFd, logFd],
});

// Round 230, 2026-09-18 (Daedalus). This file carried NO exit handler and NO signal handler
// of any kind, so on any abnormal exit its server stayed on 3001 for the next probe to grade.
// Driven, not grepped: scripts/probe-round230-a-killed-probe-must-not-leave-its-server.mts
// reports LEAK against this file, and reports quiet against the thirteen probes that carry
// process.on('exit', killServer).
//
// ✅ CLOSED 2026-09-18 (Round 231 — Theseus found it, Daedalus drove and applied it). This
// line does reap now; it did not when it was written, and the reason was inside reapOnExit
// rather than in the topology Round 230 suspected. Round 230's aim was correct all along.
// The reaper sent the child SIGKILL, the child is an `npm exec tsx` shim two processes above
// the listener, and SIGKILL is the one signal a shim cannot forward: the shim died instantly
// and orphaned the listener holding the port. It now sends SIGTERM.
// Driven, not reasoned: with SIGKILL, probe-round213-reassign-live-http held 3001 past
// 8000 ms after a SIGTERM known to have been delivered; with SIGTERM it hands 3001 back in
// ~259 ms, and a no-handler control still leaks under the identical aim. See
// scripts/probe-round231-the-handler-and-the-signal-are-in-different-processes.mts (arms A,
// N, R) and the Round 231 writeup.
reapOnExit(() => server);

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
  // Guarded in its own expression as of Round 211. Daedalus's Round 210 §4 grep
  // flagged this line: a negative over a subject that defaults to `''` is true
  // when the prompt is absent, not only when the leak is. It held solely because
  // the line above establishes the prompt is non-empty — a guard by neighbour,
  // which stops holding the moment either line moves. Round 209's E4/B2 and
  // Round 210 §3's A6 are the same shape; this is the last instance either of us
  // found still unguarded in a probe.
  const assembledA: unknown = dbg.json?.assembledPrompt;
  check('A', "no other agent's identity leaked in",
    typeof assembledA === 'string' && assembledA.length > 0 && !assembledA.includes(VESPER_MARKER),
    typeof assembledA === 'string' && assembledA.length > 0
      ? 'Vesper marker absent'
      : `no assembled prompt to inspect (${typeof assembledA})`);

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
  // ── Arm M — the preamble has one definition, and the seed really reaches it ─────
  //
  // ── Round 215 re-aim (Theseus, 2026-09-15 WORK) ───────────────────────────────
  // Round 213's arm M located four hardcoded server copies by their surrounding syntax and
  // compared each to the shared constant. Daedalus's `dd99b374` deduped all four onto
  // `DEFAULT_CHANNEL_PREAMBLE` the same day — the fix this arm was written to argue for —
  // and in doing so it invalidated every one of those four checks. Observed, not assumed:
  // this arm ran 4-red before the re-aim, two with `literal="${DEFAULT_CHANNEL_PREAMBLE}"`
  // (the `'([^']+)'` pattern happily captured the interpolation) and two with the re-aim
  // message.
  //
  // Those two shapes are worth separating, because only one of them is honest. A null
  // announces itself. A capture of `${DEFAULT_CHANNEL_PREAMBLE}` reads as a **drift
  // finding** — "the literal is not the constant" — when the truth is the opposite: the
  // site is fixed and the check is stale. That is the same message-quality defect this
  // probe's own Round 213 note fixed elsewhere, and it is more dangerous here, because the
  // failing text is plausible.
  //
  // Post-dedup there are no literals left to compare, so comparing them is not the property
  // any more. Three properties that can still regress, replacing four that cannot:
  //
  //   M1  every known site *references* the constant — a literal re-introduced at any of
  //       them is the regression, and a site whose pattern stops matching goes red as a
  //       re-aim rather than silently passing.
  //   M2  no copy of the string exists anywhere under `packages/*/src` except its one
  //       definition. Catches a *new* site, which M1 by construction cannot see.
  //   M3  the seed path executed, live. Round 213 closed with this open item, in my own
  //       words: "arm M reads source, it does not execute the seed path. The chain from a
  //       literal mismatch to a broken layer-4 drop is reasoned, not measured." It is
  //       measured now — see below.
  {
    // ── M1 — each site holds the identifier, not a string ────────────────────────
    //
    // Non-circular: the pattern is anchored on the surrounding syntax and captures whatever
    // sits in the prompt slot. Re-hardcode the string there and the capture is the string,
    // not the identifier, and the check goes red — whatever the constant currently says.
    //
    // Eight sites, not four. Daedalus's `dd99b374` memo §3 found two I had missed, and they
    // are the interesting two: `__tests__/setup.ts` declares its own schema *including its
    // own copies of the seed rows*, and it is the fixture every server test reads. My Round
    // 213 grep scoped to `packages/*/src` product code and walked past a second definition
    // of the schema. `routes/entities.ts` already sourced the constant before any of this.
    const IDENT = /^(?:\$\{DEFAULT_CHANNEL_PREAMBLE\}|DEFAULT_CHANNEL_PREAMBLE)$/;
    const sites: Array<[string, string, string | null]> = [
      ['db seed — the `general` channel purpose (load-bearing for layer 4)', 'packages/server/src/db/index.ts',
        locateLiteral('packages/server/src/db/index.ts', /VALUES \('default', 'general', '([^']+)'\)/)],
      ['db seed — the default entity prompt', 'packages/server/src/db/index.ts',
        locateLiteral('packages/server/src/db/index.ts', /VALUES \('\$\{DEFAULT_ENTITY_ID\}', 'Claude', '\$\{DEFAULT_MODEL\}', '([^']+)'/)],
      ['db repair — the re-seeded default entity', 'packages/server/src/db/index.ts',
        locateLiteral('packages/server/src/db/index.ts', /\.run\(DEFAULT_ENTITY_ID, 'Claude', DEFAULT_MODEL, ([A-Za-z_$][\w$]*|'[^']*'), ENTITY_COLORS/)],
      ['export.ts — the carried-context system fallback', 'packages/server/src/routes/export.ts',
        locateLiteral('packages/server/src/routes/export.ts', /system: entity\.systemPrompt \|\| ([A-Za-z_$][\w$]*|'[^']*'),/)],
      ['entities.ts — the create-entity default prompt', 'packages/server/src/routes/entities.ts',
        locateLiteral('packages/server/src/routes/entities.ts', /systemPrompt\?\.trim\(\) \|\| ([A-Za-z_$][\w$]*|'[^']*'),\n/)],
      ['entities.ts — the update-entity default prompt', 'packages/server/src/routes/entities.ts',
        locateLiteral('packages/server/src/routes/entities.ts', /body\.systemPrompt\?\.trim\(\) \|\| ([A-Za-z_$][\w$]*|'[^']*')\)/)],
      ['TEST FIXTURE setup.ts — the `general` channel purpose', 'packages/server/src/__tests__/setup.ts',
        locateLiteral('packages/server/src/__tests__/setup.ts', /VALUES \('default', 'general', '([^']+)'\)/)],
      ['TEST FIXTURE setup.ts — the default entity prompt', 'packages/server/src/__tests__/setup.ts',
        locateLiteral('packages/server/src/__tests__/setup.ts', /VALUES \('\$\{DEFAULT_ENTITY_ID\}', 'Claude', '\$\{DEFAULT_MODEL\}', '([^']+)'/)],
    ];
    for (const [label, file, found] of sites) {
      check('M', `${label} — sources the shared constant`, found !== null && IDENT.test(found),
        found === null
          ? `PATTERN NO LONGER MATCHES in ${file} — the site moved or was refactored; re-aim this check (it is not evidence the site is fixed)`
          : IDENT.test(found)
            ? `${file} → \`${found}\``
            : `${file} holds \`${found}\` — a literal here drifts from the constant the layer-4 predicate compares against`);
    }

    // ── M2 — and no ninth site, anywhere ─────────────────────────────────────────
    //
    // M1 can only check sites someone thought to list. Round 213's list was two short, and
    // the two it missed were in the file every server test loads. This is the check that
    // does not depend on the list being right: walk every source file under `packages/` and
    // find the string itself.
    //
    // The rule is NOT "the string may appear only once." Swept first, then written: 35
    // occurrences exist outside the definition, and the large majority are legitimate —
    // 27 assertions in tests and 8 mentions in comments, measured, `expect(...).toBe('You are
    // a helpful assistant.')` in a test, or the string quoted inside a comment. Those are
    // not the drift risk. **A test that hardcodes the value fails loudly the day the
    // constant changes; that is the system working.** The silent-drift class is code that
    // *writes* the value at runtime and is never compared against the constant — which is
    // exactly what `__tests__/setup.ts` was: a fixture, not a test, seeding its own schema
    // with its own copies, loaded globally by `vitest.config.ts` into all 1821 server tests.
    //
    // So: red for any occurrence outside the owner, outside a `*.test.ts(x)` file, and
    // outside a comment. Limitation, stated rather than hidden: comment detection is
    // line-leading `//`, `*`, `/*`, so a trailing `// ...` after live code would be
    // classified as code (conservative, which is the right direction) and the string
    // embedded mid-sentence in a block comment is classified as a comment.
    const OWNER = 'packages/shared/src/types.ts';
    const offenders: string[] = [];
    let inTests = 0, inComments = 0;
    (function walk(dir: string) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        if (!/\.(ts|tsx|mts)$/.test(e.name)) continue;
        const rel = path.relative(REPO, full);
        if (rel === OWNER) continue;
        const isTest = /\.test\.tsx?$/.test(e.name);
        fs.readFileSync(full, 'utf8').split('\n').forEach((l, i) => {
          if (!l.includes(PREAMBLE)) return;
          const isComment = /^\s*(\/\/|\*|\/\*)/.test(l);
          if (isComment) { inComments++; return; }
          if (isTest) { inTests++; return; }
          offenders.push(`${rel}:${i + 1}`);
        });
      }
    })(path.join(REPO, 'packages'));
    check('M', 'no live copy of the preamble outside its definition (tests and comments excepted)',
      offenders.length === 0,
      offenders.length === 0
        ? `swept every .ts/.tsx/.mts under packages/ — ${inTests} test assertion(s) and ${inComments} comment mention(s), 0 in live code; the only live occurrence is ${OWNER}`
        : `${offenders.length} live cop${offenders.length === 1 ? 'y' : 'ies'} outside ${OWNER}: ${offenders.join(', ')} — these drift silently, unlike a test assertion, which fails loudly`);

    // ── M3 — the seed path, executed, over a socket ──────────────────────────────
    //
    // This closes Round 213's open item 3. The argument for deduping the seed was a causal
    // chain — seed literal drifts from the constant → `isDefaultChannelPreamble` stops
    // matching → layer 4 stops skipping → the seeded `general` channel silently resumes
    // carrying boilerplate at char 0 (the Round 161 defect). Every link of that was read
    // out of source, and a chain of correct readings is still a reading.
    //
    // No new fixture is needed to execute it, which is the point: this probe deletes its
    // scratch directory at startup, so the server it spawned above **ran the real
    // `db/index.ts` seed against an empty file, in a real process, seconds ago.** The
    // seeded `general` row is sitting in the scratch DB. Read it, then ask the running
    // server what it assembles for it.
    //
    // Daedalus's `round214-real-seed-path.test.ts` reaches the same module with
    // `vi.importActual`; this reaches the same code path by starting the product. Neither
    // subsumes the other — his pins the module, this pins the shipped binary — and until
    // today `__tests__/setup.ts`'s parallel schema meant no server test executed this seed
    // at all.
    const seededPurpose = await storedSystemPrompt('default');
    check('M', 'the live seed wrote the shared constant into the `general` channel',
      seededPurpose === PREAMBLE,
      `seeded row = ${JSON.stringify(seededPurpose)} · shared = ${JSON.stringify(PREAMBLE)}`);
    //
    // The assertion is a *count*, not an absence, and that is deliberate. The seeded
    // `general` channel is the one place the string legitimately survives — layer 5 carries
    // it, because the seeded default entity's own prompt is the same sentence, and arm E
    // already pins that layer 5 must NOT be filtered. So "the preamble is gone" would be the
    // wrong assertion and would go red on correct behaviour. The Round 161 defect was
    // visible as the sentence appearing **twice** — 58 chars, layer 4 duplicating layer 5.
    // Once is correct; twice is the regression; zero would be an over-reach into layer 5.
    const seedDbg = await get('/channels/default/prompt-debug');
    const seedL4 = seedDbg.json?.layers?.['4_channelAddendum'];
    const seedAssembled = (seedDbg.json?.assembledPrompt ?? '') as string;
    const occurrences = seedAssembled.split(PREAMBLE).length - 1;
    check('M', 'and layer 4 drops what the live seed wrote — the chain, end to end',
      seedL4 === 'EMPTY — default purpose, not sent' && occurrences === 1,
      `L4=${JSON.stringify(seedL4)} · the seeded sentence appears ${occurrences}× in the assembled prompt (1 = layer 5 only, correct; 2 = layer 4 duplicating it, the Round 161 defect at 58 chars; 0 = over-reach into layer 5) · ${seedAssembled.length} chars — ${JSON.stringify(seedAssembled)}`);

    measure('M', 'how many sites source the preamble, and how many hold a copy',
      `${sites.length} sites source the constant (4 product + 2 fixture + 2 already-compliant); ${offenders.length} re-introduced literal(s) found by sweep. Round 213 counted 4 and missed the fixture pair.`);

    // And the client half, stated as the property rather than the value: the fallback is the
    // shared identifier, imported, not a re-introduced literal. Goes red on regression
    // instead of throwing at import — the whole point of this round's fix.
    const sidebar = fs.readFileSync(path.join(REPO, 'packages/client/src/components/ChannelSidebar.tsx'), 'utf8');
    const usesShared = /newPrompt\.trim\(\)\s*\|\|\s*DEFAULT_CHANNEL_PREAMBLE/.test(sidebar);
    const importsShared = /import\s*\{[^}]*\bDEFAULT_CHANNEL_PREAMBLE\b[^}]*\}\s*from\s*'@klatch\/shared'/.test(sidebar);
    // The detail reports what was *found*, not what was expected. A failure message that
    // restates the assertion tells the next reader nothing they didn't get from the name.
    const fallbackLine = sidebar.match(/newPrompt\.trim\(\)\s*\|\|[^,\n]*/)?.[0]?.trim() ?? '(no `newPrompt.trim() ||` expression found at all)';
    check('M', 'the client fallback is the shared constant, not a literal of its own',
      usesShared && importsShared,
      usesShared && importsShared
        ? 'ChannelSidebar.tsx imports DEFAULT_CHANNEL_PREAMBLE from @klatch/shared and uses it as the blank-field fallback'
        : `fallback reads \`${fallbackLine}\` · imports the shared constant=${importsShared} — a literal here drifts from the constant the layer-4 predicate compares against`);
  }

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
