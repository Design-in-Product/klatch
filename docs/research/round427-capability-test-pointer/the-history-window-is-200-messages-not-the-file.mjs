#!/usr/bin/env node
/**
 * Round 427 — the compaction trigger is reached by the HISTORY WINDOW, not by the file.
 *
 * Why this exists. The Round 418 §4 / Round 419 §5 capability test has been blocked for weeks on
 * "a key plus a channel large enough to trigger compaction" (Daedalus,
 * `docs/intel/2026-10-19-sdk-bump-assessment.md` §5 step 3 and its Round 419 widening). xian asked
 * today (Janus relay, 17:11 PT) to be told exactly what he has to provide. Before telling him
 * "a large channel", I measured what the request actually carries, because
 * `packages/server/src/claude/client.ts` windows history to the last MAX_HISTORY_MESSAGES
 * messages. A 3.86 MB session file is not the same thing as a 160 000-token request, and if the
 * window bites, "bring a big channel" is the wrong instruction.
 *
 * What it measures, from the repo's own reachable corpus (`exports/sessions/*.jsonl`):
 *   1. The two constants, SLICED FROM SOURCE, not retyped — the window size and the trigger value.
 *   2. The channel the importer would build from that corpus, read with the importer's OWN parser
 *      (`packages/server/src/import/parser.ts`), not a hand-rolled JSONL reader.
 *   3. The message sequence `db/queries.ts` would insert for those turns, then the subset
 *      `buildPanelHistory` would actually send: non-empty content, last MAX_HISTORY_MESSAGES.
 *   4. Characters in the whole channel vs. characters in the window — so the window's effect is
 *      visible rather than asserted.
 *   5. A bracketed token estimate, and a verdict that REFUSES (`UNDETERMINED`) when the bracket
 *      straddles the trigger. No single chars-per-token ratio is published as if it were a count:
 *      only a live `input_tokens` from the API measures this, and that is the blocked part.
 *
 * Declared blindness, stated as a floor/ceiling rather than hidden:
 *   - Tool artifacts are inserted into `message_artifacts`, NOT into `messages.content`
 *     (`db/queries.ts`), and `buildPanelHistory` filters on `m.content`. So artifact bytes are in
 *     the 3.86 MB file and are NOT in the request. The window figure is therefore much smaller
 *     than the file, by design, and that is the finding.
 *   - The system prompt, `tools`, and carried context add input tokens this instrument does not
 *     model. They can only RAISE the request's input_tokens, so the window figure is a FLOOR on
 *     the request, and a `DOES-NOT-TRIGGER` verdict off a floor is weaker than a `TRIGGERS` one.
 *     That asymmetry is published.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');

const gate = [];
function leg(name, ok, detail) {
  gate.push({ name, ok: ok === true, detail });
}

// ── 1. Constants, sliced from source with an exactly-once gate ────────────────
//
// A retyped constant is not a pin (Round 426). Each anchor must occur exactly once in the file it
// is sliced from, or the slice refuses.

const CLIENT_PATH = join(REPO, 'packages/server/src/claude/client.ts');
const clientSrc = existsSync(CLIENT_PATH) ? readFileSync(CLIENT_PATH, 'utf8') : null;
leg('client.ts readable', clientSrc !== null, CLIENT_PATH);

function sliceOnce(src, re, label) {
  if (src === null) return { value: null, count: 0, why: 'source unreadable' };
  const all = [...src.matchAll(re)];
  if (all.length !== 1) return { value: null, count: all.length, why: `${label}: ${all.length} matches, need exactly 1` };
  return { value: all[0][1], count: 1, why: null };
}

const windowSlice = sliceOnce(clientSrc, /const\s+MAX_HISTORY_MESSAGES\s*=\s*(\d+)/g, 'MAX_HISTORY_MESSAGES');
const triggerSlice = sliceOnce(clientSrc, /trigger:\s*\{\s*type:\s*'input_tokens',\s*value:\s*(\d+)\s*\}/g, 'compaction trigger');

leg('MAX_HISTORY_MESSAGES sliced exactly once', windowSlice.count === 1, windowSlice.why ?? `= ${windowSlice.value}`);
leg('compaction trigger sliced exactly once', triggerSlice.count === 1, triggerSlice.why ?? `= ${triggerSlice.value}`);

const WINDOW = windowSlice.value === null ? null : Number(windowSlice.value);
const TRIGGER = triggerSlice.value === null ? null : Number(triggerSlice.value);

// The window is applied by `.slice(-MAX_HISTORY_MESSAGES)`. If that call shape is absent, the
// constant is declared but not the thing doing the windowing, and this instrument is measuring the
// wrong mechanism. Gate on the call, not only the declaration.
const sliceCalls = clientSrc === null ? [] : [...clientSrc.matchAll(/\.slice\(-MAX_HISTORY_MESSAGES\)/g)];
leg('the window is applied by .slice(-MAX_HISTORY_MESSAGES)', sliceCalls.length >= 1, `${sliceCalls.length} call site(s)`);

// The history filter this instrument replicates, pinned by property (non-empty trimmed content)
// rather than by byte-identical source text.
const hasEmptyFilter = clientSrc !== null && /\.filter\(\(m\)\s*=>\s*m\.content\.trim\(\)\.length\s*>\s*0\)/.test(clientSrc);
leg('history drops empty-content messages', hasEmptyFilter, 'm.content.trim().length > 0');

// ── 2. Known positive + control for the window arithmetic ─────────────────────
//
// The slicing and filtering logic below is graded on a synthetic sequence whose answer is known by
// construction, before it is pointed at the real corpus. A hand-typed expectation on the real
// corpus would be a guess; this one is arithmetic.

function messagesFromTurns(turns) {
  // Replicates db/queries.ts importClaudeCodeSession: a user row when userText is truthy, an
  // assistant row when assistantText OR artifacts are present (content may then be '').
  const out = [];
  for (const t of turns) {
    if (t.userLen > 0) out.push({ role: 'user', len: t.userLen });
    if (t.assistantLen > 0 || t.artifacts > 0) out.push({ role: 'assistant', len: t.assistantLen });
  }
  return out;
}

function windowed(messages, windowSize) {
  // Replicates buildPanelHistory: drop empty content, then take the last `windowSize`.
  return messages.filter((m) => m.len > 0).slice(-windowSize);
}

const KP_TURNS = [
  { userLen: 10, assistantLen: 20, artifacts: 0 },  // → 2 messages, 30 chars
  { userLen: 0, assistantLen: 7, artifacts: 0 },    // → 1 message (no user row), 7 chars
  { userLen: 5, assistantLen: 0, artifacts: 3 },    // → user 5; assistant row exists but len 0 →
                                                    //   inserted, then DROPPED by the empty filter
];
const kpMessages = messagesFromTurns(KP_TURNS);
const kpWindowAll = windowed(kpMessages, 99);
const kpWindow2 = windowed(kpMessages, 2);
const kpSumAll = kpWindowAll.reduce((a, m) => a + m.len, 0);
const kpSum2 = kpWindow2.reduce((a, m) => a + m.len, 0);

leg('KP: 3 turns insert 5 message rows', kpMessages.length === 5, `${kpMessages.length}`);
leg('KP: the empty-content row is dropped from history (5 → 4)', kpWindowAll.length === 4, `${kpWindowAll.length}`);
leg('KP: unwindowed sum is 42', kpSumAll === 42, `${kpSumAll}`);
// CONTROL: the window must actually bite when it is smaller than the message count. If this leg is
// green while the real-corpus window equals the real-corpus whole, the window genuinely is not
// biting there — it is not this code failing to apply it.
//
// REVISION, recorded because the number came out wrong in my own sentence and not in the code: I
// first wrote this expectation as 25 chars. The last two HISTORY-ELIGIBLE messages are turn 2's
// assistant (7) and turn 3's user (5) — turn 3's assistant row is inserted but empty, so it is
// dropped before the slice. 7 + 5 = 12. The instrument reported 12 and failed the leg; the leg was
// wrong, not the arithmetic under it. Same class as Round 379: add up the numbers in your own
// sentence. Left visible rather than quietly corrected, because a control I mis-stated is the one
// leg whose redness I was most likely to explain away.
leg('CONTROL: a window of 2 bites, keeping the last 2 eligible (7 + 5 = 12 chars)', kpWindow2.length === 2 && kpSum2 === 12, `${kpWindow2.length} msgs / ${kpSum2} chars`);

// ── 3. The real corpus, read with the importer's own parser ───────────────────

const EXPORT_DIR = join(REPO, 'exports/sessions');
const corpusFiles = existsSync(EXPORT_DIR)
  ? readdirSync(EXPORT_DIR).filter((f) => f.endsWith('.jsonl')).sort()
  : [];
leg('at least one in-repo .jsonl corpus exists', corpusFiles.length >= 1, `${corpusFiles.length}: ${corpusFiles.join(', ')}`);

/**
 * Hands the file to `parseClaudeCodeSession` — the function the import route calls — and gets back
 * only per-turn lengths. Using the real parser is the point: a hand-typed JSONL reader would
 * disagree with the importer about which events are turns, which is the whole quantity here.
 */
function parseWithImporter(absPath) {
  // No top-level await: `tsx -e` compiles to CJS, which rejects it. The first version of this
  // used top-level await, and the refusal message truncated at 300 chars of e.message — which
  // printed the echoed script and hid esbuild's one-line cause entirely. Both fixed: an async
  // IIFE, and a refusal that reads the TAIL of stderr, where the cause actually is.
  const script = `
    (async () => {
      const { parseClaudeCodeSession } = await import(${JSON.stringify(join(REPO, 'packages/server/src/import/parser.ts'))});
      const s = await parseClaudeCodeSession(${JSON.stringify(absPath)});
      const turns = (s.turns || []).map((t) => ({
        userLen: (t.userText || '').trim().length,
        assistantLen: (t.assistantText || '').trim().length,
        artifacts: (t.artifacts || []).length,
      }));
      process.stdout.write('@@JSON@@' + JSON.stringify({
        turnCount: turns.length,
        eventCount: s.eventCount ?? null,
        skippedLines: s.skippedLines ?? null,
        model: s.model ?? null,
        turns,
      }));
    })().catch((e) => { process.stderr.write('PARSE_THREW: ' + (e && e.stack || String(e))); process.exit(3); });
  `;
  try {
    const raw = execFileSync('npx', ['tsx', '-e', script], {
      cwd: REPO, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const at = raw.indexOf('@@JSON@@');
    if (at < 0) return { ok: false, why: 'no @@JSON@@ marker in parser output' };
    return { ok: true, data: JSON.parse(raw.slice(at + 8)) };
  } catch (e) {
    const stderr = String(e.stderr || '');
    const tail = (stderr || String(e.message || e)).trim().slice(-600);
    return { ok: false, why: `parser invocation failed (stderr tail): …${tail}` };
  }
}

const measurements = [];
for (const f of corpusFiles) {
  const abs = join(EXPORT_DIR, f);
  const bytes = readFileSync(abs).length;
  const parsed = parseWithImporter(abs);
  if (!parsed.ok) {
    measurements.push({ file: f, bytes, refused: parsed.why });
    continue;
  }
  const msgs = messagesFromTurns(parsed.data.turns);
  const whole = msgs.filter((m) => m.len > 0);
  const win = WINDOW === null ? null : windowed(msgs, WINDOW);
  measurements.push({
    file: f,
    bytes,
    turnCount: parsed.data.turnCount,
    eventCount: parsed.data.eventCount,
    skippedLines: parsed.data.skippedLines,
    model: parsed.data.model,
    rowsInserted: msgs.length,
    historyMessagesWhole: whole.length,
    historyCharsWhole: whole.reduce((a, m) => a + m.len, 0),
    historyMessagesWindowed: win === null ? null : win.length,
    historyCharsWindowed: win === null ? null : win.reduce((a, m) => a + m.len, 0),
    refused: null,
  });
}

leg('every corpus file measured without refusing', measurements.length >= 1 && measurements.every((m) => m.refused === null),
  measurements.map((m) => `${m.file}:${m.refused ?? 'ok'}`).join(' | '));

// ── 4. The bracketed verdict ──────────────────────────────────────────────────
//
// Chars-per-token is not measured here and is not pretended to be. The bracket is deliberately
// wide; the verdict refuses when it straddles the trigger.

const CHARS_PER_TOKEN_DENSE = 3.0;   // → the HIGHEST token estimate
const CHARS_PER_TOKEN_SPARSE = 4.5;  // → the LOWEST token estimate

function verdictFor(chars) {
  if (chars === null || TRIGGER === null) return { high: null, low: null, verdict: null };
  const high = Math.round(chars / CHARS_PER_TOKEN_DENSE);
  const low = Math.round(chars / CHARS_PER_TOKEN_SPARSE);
  let verdict;
  if (low >= TRIGGER) verdict = 'TRIGGERS';
  else if (high < TRIGGER) verdict = 'DOES-NOT-TRIGGER';
  else verdict = 'UNDETERMINED';
  return { high, low, verdict };
}

const GATE = gate.length > 0 && gate.every((l) => l.ok === true);

// ── 5. Report ─────────────────────────────────────────────────────────────────

const lines = [];
lines.push('# Round 427 — the compaction trigger is reached by the history window, not by the file');
lines.push('');
lines.push(`rev: ${(() => { try { return execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'UNKNOWN'; } })()}`);
lines.push(`run: ${new Date().toISOString()}`);
lines.push('');
lines.push('## GATE');
for (const l of gate) lines.push(`${l.ok ? '  ok ' : '  FAIL'} ${l.name} — ${l.detail}`);
lines.push('');
lines.push(`GATE: ${GATE}`);
lines.push('');
lines.push('## Constants, sliced from packages/server/src/claude/client.ts');
lines.push(`  MAX_HISTORY_MESSAGES = ${WINDOW === null ? 'REFUSED' : WINDOW}`);
lines.push(`  compaction trigger   = ${TRIGGER === null ? 'REFUSED' : TRIGGER} input_tokens`);
lines.push('');
lines.push('## Measurements');
for (const m of measurements) {
  lines.push(`  ${m.file} — ${m.bytes} bytes on disk`);
  if (m.refused) { lines.push(`    REFUSED: ${m.refused}`); continue; }
  lines.push(`    parser: ${m.turnCount} turns from ${m.eventCount} events (skipped lines: ${m.skippedLines}), model ${m.model}`);
  lines.push(`    rows the importer would insert into messages: ${m.rowsInserted}`);
  lines.push(`    messages eligible for history (non-empty content): ${m.historyMessagesWhole}`);
  const wholeV = verdictFor(m.historyCharsWhole);
  const winV = verdictFor(m.historyCharsWindowed);
  lines.push(`    WHOLE channel  : ${m.historyCharsWhole} chars → ~${wholeV.low}–${wholeV.high} tokens → ${wholeV.verdict}`);
  lines.push(`    WINDOWED (last ${WINDOW}): ${m.historyMessagesWindowed} messages, ${m.historyCharsWindowed} chars → ~${winV.low}–${winV.high} tokens → ${winV.verdict}`);
  const bites = m.historyMessagesWhole > (m.historyMessagesWindowed ?? Infinity);
  lines.push(`    does the window bite on this corpus? ${bites ? 'YES' : 'NO'} (${m.historyMessagesWhole} eligible vs ${m.historyMessagesWindowed} sent)`);
  lines.push(`    artifact rows excluded from history content: ${m.bytes - m.historyCharsWhole} bytes of the file are not request content`);
}
lines.push('');
lines.push('## Asymmetry, published rather than buried');
lines.push('  The windowed char count is a FLOOR on the request: system prompt, tools and carried');
lines.push('  context are unmodelled here and can only ADD input tokens. So a TRIGGERS verdict off');
lines.push('  this floor is sound; a DOES-NOT-TRIGGER verdict only says "not from message content');
lines.push('  alone" and can be overturned by the unmodelled additions. Only a live call with a key');
lines.push('  returns the real input_tokens — which is the blocked part of the capability test.');
lines.push('');
lines.push('## SUMMARY');
const only = measurements.length === 1 && measurements[0].refused === null ? measurements[0] : null;
if (!GATE || only === null) {
  lines.push('  REFUSED — the gate is not fully green, or the corpus did not reduce to one measured');
  lines.push('  file. No verdict is published off a red gate.');
} else {
  const winV = verdictFor(only.historyCharsWindowed);
  const wholeV = verdictFor(only.historyCharsWhole);
  lines.push(`  The repo's one reachable corpus is ${only.bytes} bytes and yields ${only.historyMessagesWhole}`);
  lines.push(`  history-eligible messages. The request carries at most the last ${WINDOW} of them.`);
  lines.push(`  Whole channel: ~${wholeV.low}–${wholeV.high} tokens (${wholeV.verdict}).`);
  lines.push(`  What is actually sent: ~${winV.low}–${winV.high} tokens (${winV.verdict}) against a ${TRIGGER} trigger.`);
  lines.push('');
  if (winV.verdict === 'TRIGGERS') {
    lines.push('  => The in-repo corpus is large enough ON ITS OWN. The capability test needs a KEY and');
    lines.push('     API reachability, not a channel from xian.');
  } else if (winV.verdict === 'DOES-NOT-TRIGGER') {
    // Published as the BAND, not as one end of it. The first version of this line printed only
    // TRIGGER * DENSE / WINDOW — the optimistic end — as if it were the requirement, which is the
    // same defect (a sentence keyed on less than the measurement beside it) that Round 426
    // charged. Both ends, each labelled with what it guarantees.
    const sureChars = Math.round(TRIGGER * CHARS_PER_TOKEN_SPARSE);
    const maybeChars = Math.round(TRIGGER * CHARS_PER_TOKEN_DENSE);
    lines.push('  => The in-repo corpus is NOT large enough once the window is applied. "Bring a big');
    lines.push('     channel" is the wrong instruction twice over: the binding quantity is message');
    lines.push(`     CONTENT in the last ${WINDOW} messages, and here the window does not even bite.`);
    lines.push(`     Content needed, as a band: >= ${sureChars} chars GUARANTEES the trigger at the`);
    lines.push(`     sparse end of the bracket; < ${maybeChars} chars guarantees it is NOT reached on`);
    lines.push('     content alone; between the two is undetermined without a live call.');
    lines.push(`     This corpus has ${only.historyCharsWindowed} — short of the lower figure by`);
    lines.push(`     ${(maybeChars / only.historyCharsWindowed).toFixed(1)}x, and of the upper by ${(sureChars / only.historyCharsWindowed).toFixed(1)}x.`);
    lines.push('     Floor caveat above applies: the unmodelled additions can only help.');
  } else {
    lines.push('  => UNDETERMINED on content alone: the bracket straddles the trigger. A live call is');
    lines.push('     the only thing that settles it, which is exactly the blocked step.');
  }
}

const report = lines.join('\n') + '\n';
process.stdout.write(report);
process.exit(GATE ? 0 : 1);
