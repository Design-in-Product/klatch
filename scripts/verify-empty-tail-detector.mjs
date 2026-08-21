/**
 * Empty-tail detector check — Round 69, Theseus, 2026-08-21 (WORK fire).
 *
 * **Why this exists.** Round 68 established that a caller which fills a recall tool call
 * from the malformed-address error's slot form emits strings where `readExpandArg` types
 * numbers, so the expand argument is dropped whole and the call is recorded as
 * `Searched own conversations: ` — an empty-tailed search sitting in the column a recall
 * arm's primary DV is scored from. Daedalus's 8/21 MID memo §4 assigns the detector to me
 * and does not reach for it. This is it.
 *
 * The detector itself is `scripts/lib/recall-call-kind.mjs`, imported by
 * `probe-recall-tool.mjs`. This file's whole job is to keep that module honest against two
 * different things it could drift from:
 *
 *   1. **The producer.** Every expectation below is checked against the string the *real*
 *      `toolUseInputSummary` emits for a real tool input, not against a string written by
 *      hand in this file. If the production wording or the `readExpandArg` typing changes,
 *      the table goes red here rather than silently in a live run's scoring.
 *
 *   2. **The probe it replaced.** The extraction moved a regex and a `.replace()` out of
 *      `probe-recall-tool.mjs`. Replacing a classifier *between arms of a live experiment*
 *      is the confound Round 58 refused to accept on argument, so the old inline block is
 *      frozen below and the two are compared over every case. The one intended divergence
 *      is listed, not hidden.
 *
 * **Costs nothing.** No API calls, no server, no Anthropic key, no rows written.
 *
 *   npx tsx scripts/verify-empty-tail-detector.mjs
 */

import { existsSync, rmSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  readCallKind, callKindWarning, SEARCH_PREFIX,
} from './lib/recall-call-kind.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '..', '.testdata');
const DB_PATH = path.join(SCRATCH_DIR, `empty-tail-detector-${process.pid}.db`);

// Same module-load ordering constraint the other verifiers carry: `db/index.ts` binds its
// path at import time. Nothing here opens the database — `toolUseInputSummary` is pure —
// but the import graph reaches `db/queries.ts`, so the path is pointed at scratch rather
// than left to default onto the real `klatch.db`.
mkdirSync(SCRATCH_DIR, { recursive: true });
process.env.KLATCH_DB = DB_PATH;

const { toolUseInputSummary } = await import('../packages/server/src/claude/client.ts');
const { RECALL_TOOL_NAME } = await import('../packages/server/src/claude/carried-context.ts');

let failures = 0;
const ok = (label, cond, detail) => {
  if (!cond) failures++;
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail ? `   ${detail}` : ''}`);
};

// ── The old classifier, frozen ──────────────────────────────────────────────
// Verbatim from `probe-recall-tool.mjs:1579-1600` as of d069306, before the extraction.
// Dead in the probe after this fire; alive here only as the thing being compared against.
const OLD_EXPAND_SUMMARY = /^Expanded own conversation:\s+(.+)\s+(\d+)–(\d+)$/;
function oldClassify(summary) {
  const m = summary.match(OLD_EXPAND_SUMMARY);
  if (m) {
    return {
      kind: 'expand', query: '',
      expand: { conversation: m[1], from: Number(m[2]), to: Number(m[3]) },
    };
  }
  return {
    kind: 'search',
    query: summary.replace(/^Searched own conversations:\s*/, ''),
    expand: null,
  };
}

// ── The cases ───────────────────────────────────────────────────────────────
//
// `input` is what the model supplies. `summary` is never written here — it is produced by
// running the real `toolUseInputSummary` over `input`. `expect` is the classification.
//
// The two that carry the finding are marked. Everything else is there so that a classifier
// returning a constant cannot pass: the table has to discriminate.

const CASES = [
  {
    label: 'ordinary search',
    input: { query: 'depot cipher' },
    expect: { kind: 'search', query: 'depot cipher', noQuery: false, blankQuery: false },
  },
  {
    label: 'well-typed expand',
    input: { expand: { conversation: 'design-review', from: 12, to: 38 } },
    expect: {
      kind: 'expand', query: '', noQuery: false, blankQuery: false,
      expand: { conversation: 'design-review', from: 12, to: 38 },
    },
  },
  {
    // ← THE FINDING. The slot form the no-address error teaches, followed literally.
    label: 'slot-shaped expand (the error copy, followed)',
    input: { expand: { conversation: '<name>', from: '<first position>', to: '<last position>' } },
    expect: { kind: 'search', query: '', noQuery: true, blankQuery: false },
    mustBeExactlyThePrefix: true,
  },
  {
    // The near-miss a model is most likely to produce unprompted: numbers as strings.
    // `readExpandArg` rejects it for the same reason and it lands in the same column.
    label: 'expand with stringified numbers',
    input: { expand: { conversation: 'design-review', from: '12', to: '38' } },
    expect: { kind: 'search', query: '', noQuery: true, blankQuery: false },
  },
  {
    label: 'expand missing a field',
    input: { expand: { conversation: 'design-review', from: 12 } },
    expect: { kind: 'search', query: '', noQuery: true, blankQuery: false },
  },
  {
    label: 'expand null',
    input: { expand: null },
    expect: { kind: 'search', query: '', noQuery: true, blankQuery: false },
  },
  {
    label: 'no arguments at all',
    input: {},
    expect: { kind: 'search', query: '', noQuery: true, blankQuery: false },
  },
  {
    // ← THE HONEST LIMIT, asserted rather than written in prose only. A deliberate
    // empty-string query is byte-identical in the artifact to a dropped expand. The
    // detector cannot separate them; it can only mark the row for adjudication.
    label: 'a genuinely empty query is indistinguishable',
    input: { query: '' },
    expect: { kind: 'search', query: '', noQuery: true, blankQuery: false },
  },
  {
    label: 'whitespace-only query is a near-neighbour, not the signature',
    input: { query: '   ' },
    expect: { kind: 'search', query: '', noQuery: false, blankQuery: true },
  },
  {
    label: 'expand wins when both are present and the expand is well-typed',
    input: { query: 'depot cipher', expand: { conversation: 'design-review', from: 1, to: 2 } },
    expect: {
      kind: 'expand', query: '', noQuery: false, blankQuery: false,
      expand: { conversation: 'design-review', from: 1, to: 2 },
    },
  },
  {
    // ← THE SECOND HONEST LIMIT. A dropped expand that *also* carried a query leaves no
    // empty tail. The detector is blind to it, and the run reads as an ordinary search.
    label: 'a dropped expand alongside a query leaves no trace',
    input: { query: 'depot cipher', expand: { conversation: '<name>', from: '<a>', to: '<b>' } },
    expect: { kind: 'search', query: 'depot cipher', noQuery: false, blankQuery: false },
  },
  {
    // A conversation name that is itself address-shaped, and one carrying an en dash and
    // digits — the greedy `(.+)` has to split on the *trailing* range, not the first one.
    label: 'address-shaped conversation name still parses to the real range',
    input: { expand: { conversation: 'sprint 3–4', from: 44, to: 73 } },
    expect: {
      kind: 'expand', query: '', noQuery: false, blankQuery: false,
      expand: { conversation: 'sprint 3–4', from: 44, to: 73 },
    },
  },
];

console.log('--- classification, against the string the real producer emits');
for (const c of CASES) {
  const summary = toolUseInputSummary(RECALL_TOOL_NAME, c.input);
  if (typeof summary !== 'string') {
    failures++;
    console.log(`  FAIL  ${c.label}   producer returned ${summary}`);
    continue;
  }
  c.summary = summary;
  const got = readCallKind(summary);
  const fields = ['kind', 'query', 'noQuery', 'blankQuery'];
  const bad = fields.filter((f) => got[f] !== c.expect[f]);
  if (c.expect.expand) {
    if (JSON.stringify(got.expand) !== JSON.stringify(c.expect.expand)) bad.push('expand');
  } else if (got.expand !== null) {
    bad.push('expand');
  }
  ok(c.label, bad.length === 0,
    bad.length === 0
      ? `→ ${JSON.stringify(summary)}`
      : `disagrees on ${bad.join(', ')}: got ${JSON.stringify(got)}`);
  if (c.mustBeExactlyThePrefix) {
    ok(`  …and the summary is exactly the search prefix, no tail`,
      summary === SEARCH_PREFIX, JSON.stringify(summary));
  }
}

// ── Preconditions ───────────────────────────────────────────────────────────
// A table that never produced an expand, or never produced an empty tail, would be
// satisfied by a classifier that returns a constant. Stated rather than assumed.
const reads = CASES.map((c) => readCallKind(c.summary));
console.log('\n--- preconditions (a constant-returning classifier would pass a flat table)');
ok('at least one case classifies as an expand', reads.some((r) => r.kind === 'expand'));
ok('at least one case classifies as a search', reads.some((r) => r.kind === 'search'));
ok('at least one case trips the detector', reads.some((r) => r.noQuery));
ok('at least one search case does NOT trip it', reads.some((r) => r.kind === 'search' && !r.noQuery));
ok('the detector emits a warning line when it fires',
  reads.some((r) => (callKindWarning(r) || '').includes('EMPTY TAIL')));
ok('a clean search emits no warning line',
  callKindWarning(readCallKind(`${SEARCH_PREFIX}depot cipher`)) === null);

// ── Equivalence with the block this replaced ────────────────────────────────
// The extraction must change no measurement the probe was already taking.
console.log('\n--- equivalence with the inline classifier the probe carried before (d069306)');
let divergences = 0;
for (const c of CASES) {
  const before = oldClassify(c.summary);
  const after = readCallKind(c.summary);
  const same = before.kind === after.kind
    && before.query === after.query
    && JSON.stringify(before.expand) === JSON.stringify(after.expand);
  if (!same) {
    divergences++;
    console.log(`  DIVERGES  ${c.label}: ${JSON.stringify(before)} vs ${JSON.stringify(after)}`);
  }
}
ok('every producer-generated case classifies identically', divergences === 0,
  `${CASES.length} cases`);

// The one intended difference, exercised so it is a listed decision and not a surprise.
// The old block fell through to `search` for anything that was not an expand, so a third
// recall mode's summary would have been tokenized as a query made of its own prose and
// scored as a keyword miss.
const THIRD_MODE = 'Replayed own conversation: design-review turn 12';
console.log('\n--- the one intended divergence (a summary vocabulary neither form covers)');
console.log(`  old  → ${JSON.stringify(oldClassify(THIRD_MODE))}`);
console.log(`  new  → kind: ${JSON.stringify(readCallKind(THIRD_MODE).kind)}`);
ok('the old block would have scored it as a search over its own prose',
  oldClassify(THIRD_MODE).kind === 'search' && oldClassify(THIRD_MODE).query === THIRD_MODE);
ok('the new module refuses to classify it', readCallKind(THIRD_MODE).kind === 'unknown');
ok('…and says so', (callKindWarning(readCallKind(THIRD_MODE)) || '').includes('UNRECOGNISED'));

// ── Negative controls ───────────────────────────────────────────────────────
// Everything above reported success. A check that can only report success is the
// instrument Round 66 caught passing its own control. So two deliberately broken
// classifiers are run over the same real summaries and required to be caught.
//
// These are local stand-ins, not the imported module — the question a negative control
// answers is "would this table notice a broken detector", and for that a broken detector
// has to be constructed. The check that the *real* module is the one under test is the
// equivalence block above, which imports it.
console.log('\n--- negative controls (a blunted detector must be caught)');

const bluntedDetector = (s) => ({ ...readCallKind(s), noQuery: false });
const bluntedCaught = CASES.some((c) => {
  const expected = readCallKind(c.summary).noQuery;
  return expected !== bluntedDetector(c.summary).noQuery;
});
ok('a detector that never fires disagrees with the table', bluntedCaught);

const driftedPrefix = (s) => (s.startsWith('Searched my other conversations: ')
  ? { kind: 'search' } : { kind: 'unknown' });
const driftedCaught = CASES.some((c) => {
  const real = readCallKind(c.summary);
  return real.kind === 'search' && driftedPrefix(c.summary).kind !== 'search';
});
ok('a classifier holding a stale prefix stops recognising searches', driftedCaught);

// ── Scratch cleanup ─────────────────────────────────────────────────────────
// Nothing here opens the database, so the file should never have been created. Checked
// rather than assumed — an import that quietly calls `getDb()` would leave one behind.
const leftBehind = existsSync(DB_PATH);
if (leftBehind) rmSync(DB_PATH, { force: true });
for (const suffix of ['-wal', '-shm']) {
  if (existsSync(DB_PATH + suffix)) rmSync(DB_PATH + suffix, { force: true });
}
console.log(`\nscratch db was created: ${leftBehind}   (expected false — this check is pure)`);

console.log(`\n${failures === 0
  ? 'DETECTOR VERIFIED — it reads what the producer emits, and the extraction is inert.'
  : `${failures} FAILURE(S) — do not trust the empty-tail column.`}`);
process.exit(failures === 0 ? 0 : 1);
