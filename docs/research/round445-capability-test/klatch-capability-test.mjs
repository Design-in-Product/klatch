#!/usr/bin/env node
/**
 * Klatch capability test — one attended sitting, one command.
 *
 * Author: Theseus (Klatch), 2026-10-23 STOP fire, Round 445.
 * Occasion: Janus -> Theseus, 2026-10-23 17:48 PT — xian chose (A), attended, in his own terminal,
 * with the key exported for the length of the sitting and unset after. Pard asked for a paste that
 * runs from a fresh terminal.
 *
 * WHAT THIS ANSWERS — the five things blocked on a key, from
 *   docs/intel/2026-10-19-sdk-bump-assessment.md §5 step 3 (a)-(d) and its Round 418 §4 tail:
 *     (a) is a compaction summary still produced on the beta surface Klatch calls
 *     (b) does `instructions:` still preserve [EntityName responded] markers after 0.126.0
 *         changed what that field means
 *     (c) does a mid-stream cancel still behave (the 8 abort/retry-lifecycle entries)
 *     (d) does a tool-use round still parse (the 2 partial-JSON tokenizer entries)
 *     (e) what does the API actually do when the beta is sent for a model this repo's own test
 *         pins as non-compaction-capable (round13-models-api.test.ts:187)
 *
 * WHAT IT DOES NOT ANSWER. This is a RECORDING, not a gate. It reproduces the call shape at
 * packages/server/src/claude/client.ts:895-914 against the live API; it does not run Klatch's
 * server, its DB, or its import path. A green run here does not license the 0.135.0 bump on its
 * own — it tells us the beta surface still works at the PINNED version, which is the baseline the
 * bump has to be compared against.
 *
 * THE ONE DELIBERATE DIVERGENCE FROM client.ts, stated so no reader has to find it:
 * the compaction trigger is lowered from the source literal 160000 input_tokens to
 * TRIGGER (default 2000), so the sitting costs a few thousand tokens instead of needing a
 * ~720 000-character channel (the figure measured in docs/research/round427-capability-test-pointer/).
 * This is Round 427's option (C), with the refinement that a standalone probe sets its own trigger
 * and so does NOT edit client.ts — which means it does not redden
 * __tests__/round17-compaction-effort.test.ts:40, the test that pins the 160000 literal in source.
 * Everything else in the request — betas, context_management.edits[0].type, the instructions
 * string, thinking, cache_control, max_tokens — is copied from client.ts verbatim.
 *
 * SAFETY: reads ANTHROPIC_API_KEY from the environment and never prints it, not even a prefix.
 * Writes nothing outside the directory it is told to write its recording to. Makes 5 small API
 * calls.
 */

import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Configuration, all overridable, all printed in the header so a recording is
// self-describing and nobody has to reconstruct what produced it.
// ---------------------------------------------------------------------------
const MODEL = process.env.KLATCH_PROBE_MODEL || 'claude-opus-5';
const HAIKU = process.env.KLATCH_PROBE_HAIKU || 'claude-haiku-5-5';
const TRIGGER = Number(process.env.KLATCH_PROBE_TRIGGER || '2000');
const SOURCE_TRIGGER = 160000; // the literal at client.ts:908 — see the divergence note above

// The attribution string, copied verbatim from client.ts:910.
const INSTRUCTIONS =
  'Preserve [EntityName responded] attribution markers. When multiple entities contributed, ' +
  'maintain specific attribution of key contributions.';

// The marker shape (b) is about. Deliberately not anchored to the entity names this probe
// invents, so it can also see a marker the model carried over under a different name.
const MARKER = /\[[^\]\n]{1,60} responded\]/g;

// ---------------------------------------------------------------------------
// Refusal, not a sentinel. A cell that cannot run says so and is counted
// separately from a cell that ran and failed. (Lesson from Round 436: an
// instrument that cannot refuse manufactures findings.)
// ---------------------------------------------------------------------------
const cells = [];
function record(name, state, detail, extra) {
  if (!['PASS', 'FAIL', 'RECORDED', 'REFUSED'].includes(state)) {
    throw new Error(`bad cell state ${state} for ${name}`);
  }
  cells.push({ name, state, detail, ...(extra ? { extra } : {}) });
  console.log(`CELL ${String(cells.length - 1).padStart(2, '0')} ${name.padEnd(24)} ${state.padEnd(9)} ${detail}`);
}

function errLine(e) {
  // Read the TAIL of a message, not the head: the explanatory line is at the end.
  // (Round 427: a refusal truncated at 300 chars from the front hid its own cause.)
  const s = (e && (e.message || String(e))) || 'unknown';
  const status = e && (e.status ?? e.statusCode);
  const tail = s.length > 400 ? '…' + s.slice(-400) : s;
  return `${status !== undefined ? `HTTP ${status} ` : ''}${tail.replace(/\s+/g, ' ')}`;
}

// ---------------------------------------------------------------------------
// Resolve the SDK explicitly. node_modules is gitignored and per-worktree, so
// "the SDK" is only an address in the tree that resolved it — the version and
// the path both go in the header. (Round 418 lesson.)
// ---------------------------------------------------------------------------
function resolveSdk() {
  const override = process.env.KLATCH_SDK_DIR;
  const candidates = override
    ? [override]
    : [
        // repo root of a normal checkout, walking up from this file
        resolve(HERE, '..', '..', '..', 'node_modules', '@anthropic-ai', 'sdk'),
        resolve(HERE, '..', '..', 'node_modules', '@anthropic-ai', 'sdk'),
        resolve(process.cwd(), 'node_modules', '@anthropic-ai', 'sdk'),
      ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'index.mjs'))) {
      const version = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
      return { dir, version };
    }
  }
  return { dir: null, version: null, tried: candidates };
}

/**
 * The pin, read from source, and the installed version, read from the resolved
 * node_modules. These come apart silently: this probe's own first drive resolved
 * 0.110.0 out of a worktree whose packages/server/package.json pins ^0.122.0,
 * and nothing would have told the reader that the baseline they recorded was
 * two minors below the pin they thought they were measuring.
 */
function readPin(repoRoot) {
  try {
    const p = JSON.parse(readFileSync(join(repoRoot, 'packages', 'server', 'package.json'), 'utf8'));
    return p.dependencies?.['@anthropic-ai/sdk'] ?? null;
  } catch { return null; }
}

export function satisfiesCaret(pin, version) {
  // Only the `^X.Y.Z` form the repo actually uses. Anything else -> null, meaning
  // "cannot judge", which is reported as such rather than silently passing.
  const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(pin || '');
  const v = /^(\d+)\.(\d+)\.(\d+)/.exec(version || '');
  if (!m || !v) return null;
  const [, pMaj, pMin, pPat] = m.map(Number);
  const [, vMaj, vMin, vPat] = v.map(Number);
  if (pMaj !== vMaj) return false;
  if (pMaj === 0) {
    // npm caret on 0.x pins the minor: ^0.122.0 allows >=0.122.0 <0.123.0
    if (vMin !== pMin) return false;
    return vPat >= pPat;
  }
  return vMin > pMin || (vMin === pMin && vPat >= pPat);
}

function gitRev(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return 'UNKNOWN'; }
}

// ---------------------------------------------------------------------------
// A synthetic multi-entity conversation, long enough to cross TRIGGER and
// carrying attribution markers so (b) has something to preserve.
// ---------------------------------------------------------------------------
export function buildHistory() {
  const beats = [
    ['Daedalus', 'the 5-layer model puts channel instructions above entity system prompts, so an entity carries its own voice into a channel it did not author'],
    ['Argus', 'the route tests mock claude/client.js wholesale, so a semantic change on the beta path cannot redden the suite'],
    ['Theseus', 'the history window is 200 messages and the binding quantity is prose in those messages, not the size of the session file on disk'],
    ['Calliope', 'mail lands in the recipient repo, never the sender, and a memo committed only to the sender has been archived rather than sent'],
    ['Iris', 'the channel list needs to show provenance, because an imported conversation and a native one are not the same object to a reader'],
  ];
  const messages = [];
  // Repeat the beats with varying filler so the request is comfortably over TRIGGER
  // without being large enough to cost anything noticeable. 24 rounds is ~15k chars,
  // ~3.3k-5k tokens at the 3.0-4.5 chars/token bracket measured in round427 — so it
  // clears a 2000-token trigger at the SPARSE end of the bracket, not just the dense one.
  for (let i = 0; i < 24; i++) {
    const [who, claim] = beats[i % beats.length];
    messages.push({
      role: 'user',
      content:
        `Round ${i + 1}. Someone raised this point and I want it kept straight in the record: ${claim}. ` +
        `Restate it in one sentence and say which layer it belongs to. Be brief.`,
    });
    messages.push({
      role: 'assistant',
      content:
        `[${who} responded] ${claim}. That sits in the ${['entity', 'channel', 'project', 'global', 'message'][i % 5]} layer. ` +
        `The consequence for round ${i + 1} is that whoever edits the layer above has to re-read this one first, ` +
        `because the two are composed at send time and not at author time.`,
    });
  }
  messages.push({
    role: 'user',
    content:
      'Now summarise, in three sentences, who said what across this whole conversation. ' +
      'Keep every attribution marker exactly as it appears.',
  });
  return messages;
}

const CHARS = buildHistory().reduce((n, m) => n + m.content.length, 0);

// ---------------------------------------------------------------------------
// The compaction-enabled request, copied from client.ts:895-914 with TRIGGER
// substituted for the source literal and `tools` optional.
// ---------------------------------------------------------------------------
export function betaRequest({ model, messages, tools, trigger }) {
  return {
    model,
    max_tokens: 16384,
    thinking: { type: 'adaptive', display: 'omitted' },
    cache_control: { type: 'ephemeral' },
    system: 'You are participating in a multi-entity Klatch channel. Preserve attribution.',
    messages,
    ...(tools ? { tools } : {}),
    betas: ['compact-2026-01-12'],
    context_management: {
      edits: [{
        type: 'compact_20260112',
        trigger: { type: 'input_tokens', value: trigger },
        instructions: INSTRUCTIONS,
      }],
    },
  };
}

// ---------------------------------------------------------------------------
async function main() {
  const startedAt = new Date().toISOString();
  const sdk = resolveSdk();
  const repoRoot = resolve(HERE, '..', '..', '..');
  const pin = readPin(repoRoot);
  const pinOk = satisfiesCaret(pin, sdk.version);

  console.log('='.repeat(78));
  console.log('KLATCH CAPABILITY TEST — Round 445 probe');
  console.log('='.repeat(78));
  console.log(`started        ${startedAt}`);
  console.log(`node           ${process.version}`);
  console.log(`probe file     ${fileURLToPath(import.meta.url)}`);
  console.log(`repo rev       ${gitRev(HERE)}`);
  console.log(`sdk dir        ${sdk.dir || 'NOT FOUND'}`);
  console.log(`sdk version    ${sdk.version || 'NOT FOUND'}`);
  console.log(`sdk pin        ${pin || 'UNREADABLE'}   (packages/server/package.json)`);
  console.log(`pin satisfied  ${pinOk === null ? 'CANNOT-JUDGE' : pinOk}`);
  console.log(`model          ${MODEL}`);
  console.log(`haiku model    ${HAIKU}`);
  console.log(`trigger        ${TRIGGER} input_tokens  (source literal is ${SOURCE_TRIGGER}; see header)`);
  console.log(`history        ${buildHistory().length} messages, ${CHARS} chars`);
  console.log('='.repeat(78));
  console.log('');

  // --- preconditions, each refusing loudly rather than crashing -------------
  if (!sdk.dir) {
    console.log('ABORT: could not resolve @anthropic-ai/sdk. Tried:');
    for (const c of sdk.tried) console.log(`  ${c}`);
    console.log('');
    console.log('VERDICT/1 ABORT reason=sdk-not-resolved cells=0');
    process.exit(2);
  }
  if (pinOk !== true && process.env.KLATCH_ALLOW_SDK_MISMATCH !== '1') {
    console.log(`ABORT: the resolved SDK (${sdk.version}) does not satisfy the repo's pin (${pin}).`);
    console.log(`       Resolved from: ${sdk.dir}`);
    console.log('       node_modules is gitignored and per-worktree, so a stale worktree will');
    console.log('       happily record a baseline at the wrong version. Run `npm install` in');
    console.log('       this tree, or point KLATCH_SDK_DIR at a tree installed at the pin.');
    console.log('       To record a deliberate off-pin run anyway: KLATCH_ALLOW_SDK_MISMATCH=1');
    console.log('');
    console.log(`VERDICT/1 ABORT reason=sdk-pin-mismatch installed=${sdk.version} pin=${pin} cells=0`);
    process.exit(2);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ABORT: ANTHROPIC_API_KEY is not set in this shell.');
    console.log('       Export it first, then re-run. This probe never reads a .env file,');
    console.log('       on purpose: the key should live in the shell for the sitting and be');
    console.log('       unset afterwards.');
    console.log('');
    console.log('VERDICT/1 ABORT reason=no-key cells=0');
    process.exit(2);
  }

  const mod = await import(pathToFileURL(join(sdk.dir, 'index.mjs')).href);
  const Anthropic = mod.default || mod.Anthropic;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // === CELL 00 — key and models list =======================================
  let modelsSeen = 0;
  try {
    const list = await client.models.list({ limit: 50 });
    const ids = (list.data || []).map((m) => m.id);
    modelsSeen = ids.length;
    const hasModel = ids.includes(MODEL);
    const hasHaiku = ids.includes(HAIKU);
    record('PRECHECK-KEY', 'PASS',
      `${modelsSeen} models; ${MODEL} present=${hasModel}; ${HAIKU} present=${hasHaiku}`,
      { ids });
    if (!hasModel) {
      record('PRECHECK-MODEL', 'FAIL',
        `${MODEL} is not in the key's model list — later cells will fail on the id, not on the beta`);
    }
  } catch (e) {
    record('PRECHECK-KEY', 'FAIL', errLine(e));
    console.log('');
    console.log('VERDICT/1 ABORT reason=precheck-failed cells=' + cells.length);
    process.exit(3);
  }

  // === CELL 01 — (a) compaction summary on the beta surface ================
  let summary = null;
  let cell1Ok = false;
  try {
    const stream = client.beta.messages.stream(
      betaRequest({ model: MODEL, messages: buildHistory(), trigger: TRIGGER })
    );
    stream.on('compaction', (c) => { summary = c; });
    const final = await stream.finalMessage();
    cell1Ok = true;
    const usage = final.usage || {};
    if (summary === null) {
      record('COMPACTION-SUMMARY', 'RECORDED',
        `call succeeded, NO compaction event fired. input_tokens=${usage.input_tokens} ` +
        `(trigger was ${TRIGGER}) stop_reason=${final.stop_reason}`,
        { usage });
    } else {
      record('COMPACTION-SUMMARY', 'PASS',
        `compaction event fired, summary ${String(summary).length} chars. ` +
        `input_tokens=${usage.input_tokens} stop_reason=${final.stop_reason}`,
        { usage, summaryChars: String(summary).length });
    }
  } catch (e) {
    record('COMPACTION-SUMMARY', 'FAIL', errLine(e));
  }

  // === CELL 02 — (b) does `instructions:` still preserve the markers =======
  // Refuses rather than grading when cell 01 produced nothing to grade.
  if (!cell1Ok) {
    record('ATTRIBUTION', 'REFUSED', 'cell 01 did not complete — nothing to grade');
  } else if (summary === null) {
    record('ATTRIBUTION', 'REFUSED',
      `no compaction summary was produced, so this cell has no subject. ` +
      `Re-run with KLATCH_PROBE_TRIGGER set below the input_tokens cell 01 reported.`);
  } else {
    const found = String(summary).match(MARKER) || [];
    const uniq = [...new Set(found)];
    record('ATTRIBUTION', uniq.length > 0 ? 'PASS' : 'FAIL',
      `${found.length} marker occurrence(s), ${uniq.length} distinct: ${uniq.slice(0, 8).join(' ') || '(none)'}`,
      { markers: uniq, summary: String(summary) });
  }

  // === CELL 03 — (c) mid-stream cancel =====================================
  try {
    const stream = client.beta.messages.stream(
      betaRequest({ model: MODEL, messages: buildHistory(), trigger: TRIGGER })
    );
    let got = 0;
    let aborted = false;
    stream.on('text', () => {
      got += 1;
      if (got === 1 && !aborted) { aborted = true; stream.abort(); }
    });
    let outcome;
    try {
      await stream.finalMessage();
      outcome = 'finalMessage RESOLVED after abort';
    } catch (e) {
      outcome = `finalMessage REJECTED after abort: ${errLine(e)}`;
    }
    record('CANCEL-MIDSTREAM', aborted ? 'RECORDED' : 'REFUSED',
      aborted
        ? `abort() called after ${got} text event(s), did not throw. ${outcome}`
        : `no text event ever arrived, so abort() was never reached — nothing cancelled`);
  } catch (e) {
    record('CANCEL-MIDSTREAM', 'FAIL', errLine(e));
  }

  // === CELL 04 — (d) tool-use round ========================================
  const tools = [{
    name: 'record_attribution',
    description: 'Record which entity made which claim. Call this exactly once.',
    input_schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', description: 'The entity name' },
        claim: { type: 'string', description: 'The claim, in one sentence' },
        layers: { type: 'array', items: { type: 'string' }, description: 'Layers touched' },
        round: { type: 'number', description: 'Round number' },
      },
      required: ['entity', 'claim', 'layers', 'round'],
    },
  }];
  try {
    const stream = client.beta.messages.stream(
      betaRequest({
        model: MODEL,
        trigger: TRIGGER,
        tools,
        messages: [{
          role: 'user',
          content:
            '[Daedalus responded] The 5-layer model composes channel instructions above entity ' +
            'system prompts. Use the record_attribution tool to record that claim against ' +
            'Daedalus for round 7, listing the entity and channel layers. Call the tool.',
        }],
      })
    );
    const final = await stream.finalMessage();
    const blocks = (final.content || []).filter((b) => b.type === 'tool_use');
    if (blocks.length === 0) {
      record('TOOL-USE-ROUND', 'RECORDED',
        `stop_reason=${final.stop_reason}, no tool_use block — the model declined to call the tool, ` +
        `which is a model choice, not an SDK parse failure`);
    } else {
      const b = blocks[0];
      const inp = b.input || {};
      const shapeOk =
        typeof inp.entity === 'string' &&
        typeof inp.claim === 'string' &&
        Array.isArray(inp.layers) &&
        typeof inp.round === 'number';
      record('TOOL-USE-ROUND', shapeOk ? 'PASS' : 'FAIL',
        `stop_reason=${final.stop_reason}, ${blocks.length} tool_use block(s), name=${b.name}, ` +
        `input keys=[${Object.keys(inp).join(',')}], ` +
        `types=[entity:${typeof inp.entity} claim:${typeof inp.claim} ` +
        `layers:${Array.isArray(inp.layers) ? 'array(' + inp.layers.length + ')' : typeof inp.layers} ` +
        `round:${typeof inp.round}]`,
        { input: inp });
    }
  } catch (e) {
    record('TOOL-USE-ROUND', 'FAIL', errLine(e));
  }

  // === CELL 05 — (e) the ungated beta on a non-compaction-capable model ====
  // This cell is EXPECTED to be interesting either way. A 200 means the API
  // tolerates the beta for this model and the repo's unread `capabilities.compaction`
  // field is costing nothing today. An error means every imported channel holding a
  // Haiku entity is already broken in production, which is the Round 418 §4 charge.
  try {
    const stream = client.beta.messages.stream(
      betaRequest({
        model: HAIKU,
        trigger: TRIGGER,
        messages: [{ role: 'user', content: 'Say the single word: ok' }],
      })
    );
    const final = await stream.finalMessage();
    record('HAIKU-UNGATED-BETA', 'RECORDED',
      `API ACCEPTED betas:['compact-2026-01-12'] for ${HAIKU} — stop_reason=${final.stop_reason}, ` +
      `input_tokens=${final.usage?.input_tokens}. The unread capabilities.compaction field costs ` +
      `nothing on this path today.`);
  } catch (e) {
    record('HAIKU-UNGATED-BETA', 'RECORDED',
      `API REJECTED betas:['compact-2026-01-12'] for ${HAIKU} — ${errLine(e)}. ` +
      `This is Round 418 §4 confirmed live: an imported channel holding a Haiku entity ` +
      `sends a beta the API will not take.`);
  }

  // === verdict =============================================================
  const n = (s) => cells.filter((c) => c.state === s).length;
  const failed = cells.filter((c) => c.state === 'FAIL').map((c) => c.name);
  const refused = cells.filter((c) => c.state === 'REFUSED').map((c) => c.name);

  console.log('');
  console.log('-'.repeat(78));
  console.log(`VERDICT/1 ${failed.length === 0 ? 'NO-FAILURES' : 'FAILURES'} ` +
    `cells=${cells.length} pass=${n('PASS')} recorded=${n('RECORDED')} ` +
    `refused=${n('REFUSED')} fail=${n('FAIL')} ` +
    `failed=[${failed.join(',')}] refused_cells=[${refused.join(',')}] ` +
    `sdk=${sdk.version} pin=${pin} pin_satisfied=${pinOk} model=${MODEL} trigger=${TRIGGER}`);
  console.log('-'.repeat(78));
  console.log('');
  console.log('FULL CELL DETAIL (json, for the record):');
  console.log(JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), sdk, pin, pinOk, repoRoot, MODEL, HAIKU, TRIGGER, modelsSeen, cells }, null, 2));

  // Exit code carries only "did any cell FAIL" — REFUSED is not a failure, it is
  // a cell that honestly could not run, and the verdict line names which.
  process.exit(failed.length === 0 ? 0 : 1);
}

// Only run when executed directly, so the request builders above can be imported
// and graded by a separate harness without firing the sitting's real calls.
const INVOKED_DIRECTLY =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (INVOKED_DIRECTLY) {
  main().catch((e) => {
    console.log('');
    console.log(`VERDICT/1 CRASH ${errLine(e)}`);
    console.error(e);
    process.exit(4);
  });
}
