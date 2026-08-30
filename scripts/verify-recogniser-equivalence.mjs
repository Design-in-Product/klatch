/**
 * Recogniser equivalence check — Round 58, Theseus, 2026-08-16 (WORK fire).
 *
 * **Why this exists.** `probe-recall-tool.mjs` recognises the recall markers with
 * five regexes and two bare fragments that were, until this fire, hand-written
 * copies of strings in `recall.ts`. Daedalus landed `RECALL_MARKER_PHRASES`
 * (`recall.ts:145`) so the probe can derive them instead. Replacing a recogniser
 * *between arms of a live experiment* is precisely the confound I have spent
 * three rounds removing, so the replacement is not allowed to be justified by
 * reading the two forms and finding them similar.
 *
 * This script measures it. It renders **real** marker text through the real
 * `recallFromOtherConversations` / `expandConversationRange` against a scratch
 * database, then runs the **old** hand-written patterns and the **new** derived
 * patterns over that same text and compares every field the probe extracts. If
 * they disagree anywhere, the instrument change is not inert and it exits 1.
 *
 * The old patterns below are copied verbatim from `probe-recall-tool.mjs` as of
 * `b914af4`, deliberately frozen here. They are dead in the probe after this
 * fire; they stay alive in this file only as the thing being compared against.
 * That is the whole point — after the swap there is no other copy of them left.
 *
 * **Chain of custody, stated rather than assumed.** This file proves
 * *old-regex ≡ new-regex over real rendered text*. It does **not** prove that
 * the constants match what the build renders — a derived regex agrees with the
 * build by construction, which is exactly the detection Daedalus's memo §2 says
 * is given up. That half is pinned longhand, elsewhere, in the build's own
 * suite: `packages/server/src/__tests__/round58-recall-marker-phrases.test.ts`.
 * Two instruments, two jobs. Neither one alone is sufficient.
 *
 * **Costs nothing.** No API calls, no server, no Anthropic key. Seeds a scratch
 * SQLite file, renders, compares, deletes the file.
 *
 *   npx tsx scripts/verify-recogniser-equivalence.mjs
 */

import { randomUUID } from 'crypto';
import { buildRecogniser } from './lib/recall-recogniser.mjs';
import { explainTsxRequirement } from './lib/tsx-required.mjs';
import { existsSync, rmSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '..', '.testdata');
const DB_PATH = path.join(SCRATCH_DIR, `recogniser-equivalence-${process.pid}.db`);

// Same module-load ordering constraint as the probe: `db/index.ts` binds its
// path at import time, so the env var must be set before the dynamic import and
// the import must be dynamic for that ordering to exist at all.
mkdirSync(SCRATCH_DIR, { recursive: true });
process.env.KLATCH_DB = DB_PATH;

// Under plain `node` these resolve into TypeScript whose own `.js` specifiers node will not map,
// and the raw `ERR_MODULE_NOT_FOUND` names a file rather than the runner (Round 120 §5 read it as
// a missing build artifact; it is not). `explainTsxRequirement` either says so and exits 2, or
// re-throws a genuine absence untouched.
let createEntity, createChannel, getDb,
    recallFromOtherConversations, expandConversationRange, RECALL_MARKER_PHRASES, DEFAULT_MODEL;
try {
  ({ createEntity, createChannel } = await import('../packages/server/src/db/queries.ts'));
  ({ getDb } = await import('../packages/server/src/db/index.ts'));
  ({ recallFromOtherConversations, expandConversationRange, RECALL_MARKER_PHRASES } =
    await import('../packages/server/src/claude/recall.ts'));
  ({ DEFAULT_MODEL } = await import('../packages/shared/src/types.ts'));
} catch (err) {
  explainTsxRequirement(err, import.meta.url);
}

const P = RECALL_MARKER_PHRASES;

// ── The old recogniser, frozen ──────────────────────────────────────────────
// Verbatim from probe-recall-tool.mjs:1046-1061 and :1089/:1109/:1119 at b914af4.

const OLD = {
  GAP_LINE: /^\[… (\d+) message\(s\) here are part of that conversation but not of your transcript, and were not read …\]$/,
  EDGE_LINE: /^\[… (\d+) (earlier|later) message\(s\) in this conversation, not shown here: (.+) …\]$/,
  REACHABLE_R54: /(\d+) that a different search of yours could reach/,
  REACHABLE_R56: /(\d+) you can read — ask for them with expand \{conversation: "([^"]*)", from: (\d+), to: (\d+)\}/,
  UNREACHABLE: /(\d+) that no search of yours can reach/,
  INTERIOR_PHRASE: /not of your transcript/,
  EDGE_HEADER_STEM: /is the edge of an excerpt/,
};

// ── The new recogniser: the real one, imported ──────────────────────────────
// Not a copy. A verifier that certifies its own reimplementation of the new
// recogniser proves nothing about the probe — that is the same duplicated-literal
// defect the swap exists to remove, one level out. `buildRecogniser` is what
// `probe-recall-tool.mjs` runs.

const NEW = buildRecogniser(P);

// ── The extraction ──────────────────────────────────────────────────────────
// The old side is the probe's block as it stood at b914af4, parameterised by
// pattern set. The new side is `NEW.read`, which returns strictly more fields
// than the old block did (`line`, `clauses`, `clausesUnrecognised`,
// `recogniserBlind`, `expectationViolations` — all added this fire). Comparing
// raw would fail on the additions and say nothing about the question, so the
// comparison is restricted to the fields that existed before the change. What is
// being asked is narrow and worth stating narrowly: **do the pre-existing
// measurements come out the same?**

function extract(R, text) {
  const lines = text.split('\n');
  const gapLines = lines.filter((l) => R.GAP_LINE.test(l.trim()));
  const edgeLines = lines
    .map((l) => l.trim().match(R.EDGE_LINE))
    .filter(Boolean)
    .map((m) => ({
      total: Number(m[1]),
      side: m[2],
      reachable: Number(m[3].match(R.REACHABLE_R56)?.[1] || m[3].match(R.REACHABLE_R54)?.[1] || 0),
      address: (() => {
        const a = m[3].match(R.REACHABLE_R56);
        return a ? { conversation: a[2], from: Number(a[3]), to: Number(a[4]) } : null;
      })(),
      unreachable: Number(m[3].match(R.UNREACHABLE)?.[1] || 0),
      leakedInteriorPhrase: R.INTERIOR_PHRASE.test(m[0]),
    }));
  return comparable({
    edgeLines: edgeLines.length,
    edgeLineDetail: edgeLines,
    edgeReachable: edgeLines.reduce((n, e) => n + e.reachable, 0),
    edgeUnreachable: edgeLines.reduce((n, e) => n + e.unreachable, 0),
    edgeVocabularyLeak: edgeLines.some((e) => e.leakedInteriorPhrase),
    addressesOffered: edgeLines.map((e) => e.address).filter(Boolean),
    addressArithmeticOk: edgeLines
      .filter((e) => e.address)
      .every((e) => e.address.to - e.address.from + 1 === e.reachable),
    headerExplainsTheEdge: R.EDGE_HEADER_STEM.test(text.split('\n\n')[0]),
    headerExplainsTheMarker: R.INTERIOR_PHRASE.test(text.split('\n\n')[0]),
    scopeGapLines: gapLines.length,
    withheldMarked: gapLines.reduce((n, l) => n + Number(l.trim().match(R.GAP_LINE)[1]), 0),
  });
}

/**
 * The fields that existed before this fire, in a fixed order, with each edge line
 * reduced to its pre-existing subfields. Applied to both sides so neither one's
 * key order or later additions can make a difference look like an agreement — or
 * an agreement look like a difference.
 */
function comparable(o) {
  return {
    edgeLines: o.edgeLines,
    edgeLineDetail: o.edgeLineDetail.map((e) => ({
      total: e.total,
      side: e.side,
      reachable: e.reachable,
      address: e.address,
      unreachable: e.unreachable,
      leakedInteriorPhrase: e.leakedInteriorPhrase,
    })),
    edgeReachable: o.edgeReachable,
    edgeUnreachable: o.edgeUnreachable,
    edgeVocabularyLeak: o.edgeVocabularyLeak,
    addressesOffered: o.addressesOffered,
    addressArithmeticOk: o.addressArithmeticOk,
    headerExplainsTheEdge: o.headerExplainsTheEdge,
    headerExplainsTheMarker: o.headerExplainsTheMarker,
    scopeGapLines: o.scopeGapLines,
    withheldMarked: o.withheldMarked,
  };
}

// ── Real rendered text ──────────────────────────────────────────────────────
// The room is `round58-recall-marker-phrases.test.ts`'s `everyMarkerRoom()`:
// the one geometry that fires the interior marker, both edge markers, a
// reachable clause with an address and an unreachable clause, all in one render.
// Copied in shape, not imported, because that helper is a vitest fixture bound
// to the in-memory setup mock.

const say = (channelId, entityId, content, at) =>
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(randomUUID(), channelId, 'assistant', content, 'complete', DEFAULT_MODEL, entityId, at);

const ask = (channelId, content, at) =>
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(randomUUID(), channelId, 'user', content, 'complete', DEFAULT_MODEL, null, at);

const t = (n) => `2026-08-16T09:${String(n).padStart(2, '0')}:00.000Z`;

const agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
const colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');
const oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
const klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [
  agent.id,
  colleague.id,
]);

ask(klatch.id, 'kickoff one', t(1));
say(klatch.id, colleague.id, 'corvus preamble', t(2));
ask(klatch.id, 'kickoff two', t(3));
say(klatch.id, agent.id, 'acknowledged', t(4));
say(klatch.id, agent.id, 'the ledger token is jade-vireo', t(5));
say(klatch.id, colleague.id, 'corvus middle', t(6));
say(klatch.id, agent.id, 'noted', t(7));
say(klatch.id, agent.id, 'closing', t(8));
say(klatch.id, colleague.id, 'corvus tail', t(9));
ask(klatch.id, 'one more thing', t(10));

const searchText = recallFromOtherConversations(agent, oneOnOne, { query: 'ledger token' }).text;
// The probe reconstructs expansions through a different function, so the
// expansion render is a second surface the recogniser has to agree on. The
// address is taken from the search render rather than written down, so this
// exercises the same address the model would have been handed.
const offered = searchText
  .split('\n')
  .map((l) => l.trim().match(NEW.patterns.EDGE_LINE))
  .filter(Boolean)
  .map((m) => m[3].match(NEW.patterns.REACHABLE_R56))
  .filter(Boolean)[0];
const expandText = offered
  ? expandConversationRange(agent, oneOnOne, {
      conversation: offered[2],
      from: Number(offered[3]),
      to: Number(offered[4]),
    }).text
  : null;

// ── Compare ─────────────────────────────────────────────────────────────────

let failures = 0;
const surfaces = [['search render', searchText], ['expand render', expandText]];

console.log('='.repeat(78));
console.log('RECOGNISER EQUIVALENCE — old hand-written patterns vs. derived from RECALL_MARKER_PHRASES');
console.log('='.repeat(78));

for (const [label, text] of surfaces) {
  if (text === null) {
    console.log(`\n${label}: SKIPPED — the search render offered no address to expand.`);
    failures++;
    continue;
  }
  const full = NEW.read(text);
  const before = extract(OLD, text);
  const after = comparable(full);
  const same = JSON.stringify(before) === JSON.stringify(after);
  console.log(`\n--- ${label} (${text.length} chars)`);
  console.log(`  edge lines        : ${before.edgeLines}`);
  console.log(`  scope gap lines   : ${before.scopeGapLines}   withheld marked: ${before.withheldMarked}`);
  console.log(`  reachable / unreach: ${before.edgeReachable} / ${before.edgeUnreachable}`);
  console.log(`  addresses offered : ${JSON.stringify(before.addressesOffered)}`);
  console.log(`  arithmetic ok     : ${before.addressArithmeticOk}`);
  console.log(`  header: edge=${before.headerExplainsTheEdge} marker=${before.headerExplainsTheMarker}`);
  console.log(`  vocabulary leak   : ${before.edgeVocabularyLeak}`);
  console.log(`  IDENTICAL UNDER BOTH RECOGNISERS: ${same}`);
  if (!same) {
    failures++;
    console.log('  OLD: ' + JSON.stringify(before, null, 2));
    console.log('  NEW: ' + JSON.stringify(after, null, 2));
  }
  // The fields added this fire are new behaviour, not a re-measurement, so they get
  // checked on their own terms rather than against the old recogniser: on a healthy
  // build every declared expectation holds and nothing is blind.
  console.log(`  recogniser blind  : ${full.recogniserBlind}`);
  console.log(`  expectations held : ${full.expectationViolations.length === 0}`);
  if (full.recogniserBlind || full.expectationViolations.length > 0) {
    failures++;
    for (const v of full.expectationViolations) console.log(`    !! ${v.name} — expected ${v.expect}`);
  }
}

// A recogniser that matches nothing also "agrees". The comparison is only
// meaningful if the render actually fired the markers, so that is asserted
// rather than hoped for — this is the same failure mode as the stale regex:
// zero is a legal value and does not announce itself.
const fired = NEW.read(searchText);
const preconditions = [
  ['interior marker fired', fired.scopeGapLines > 0],
  ['both edge markers fired', fired.edgeLines === 2],
  ['an address was offered', fired.addressesOffered.length > 0],
  ['an unreachable clause rendered', fired.edgeUnreachable > 0],
  ['the header explains the edge', fired.headerExplainsTheEdge],
];
console.log('\n--- preconditions (a recogniser matching nothing would agree trivially)');
for (const [what, ok] of preconditions) {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${what}`);
  if (!ok) failures++;
}

// ── Negative control ────────────────────────────────────────────────────────
// Everything above is a check that reported success. A check that can only
// report success is the same instrument the Round 54 pattern was: it agrees with
// the world whatever the world does. So the check is checked — a recogniser
// built from a *deliberately reworded* record is run over the same real text,
// and it is required to disagree. If it does not, this file is not measuring
// anything and its EQUIVALENT verdict above means nothing.
//
// The rewording targets the reachable clause because that is the exact string
// Round 56 changed and the exact one whose stale pattern read a false zero.
const drifted = buildRecogniser(
  Object.freeze({ ...P, edgeReachableWithAddress: ' you may read — request them via expand ' }),
);
const driftedRead = drifted.read(searchText);
const noticed =
  JSON.stringify(comparable(driftedRead)) !== JSON.stringify(comparable(NEW.read(searchText)));
console.log('\n--- negative control (a reworded record must be caught)');
console.log(`  the drifted recogniser disagrees   : ${noticed}`);
console.log(`  it also trips an expectation       : ${driftedRead.expectationViolations.length > 0}`);
console.log(`  ...and reports itself blind        : ${driftedRead.recogniserBlind}`);
if (!noticed || driftedRead.expectationViolations.length === 0) {
  failures++;
  console.log('  !! the control did NOT fire — this script cannot detect a drifted recogniser');
}

if (existsSync(DB_PATH)) rmSync(DB_PATH, { force: true });
for (const suffix of ['-wal', '-shm']) {
  if (existsSync(DB_PATH + suffix)) rmSync(DB_PATH + suffix, { force: true });
}
console.log(`\nscratch db removed: ${!existsSync(DB_PATH)}`);

console.log(`\n${failures === 0 ? 'EQUIVALENT — the instrument change is inert.' : `${failures} DIVERGENCE(S) — do not swap the recogniser.`}`);
process.exit(failures === 0 ? 0 : 1);
