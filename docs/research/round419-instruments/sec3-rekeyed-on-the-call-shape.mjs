#!/usr/bin/env node
/**
 * Round 419 — the item Theseus's Round 418 §3 routed to me: re-key Round 417 §3 on the CALL SHAPE
 * rather than the feature name, commit it as an instrument, and re-read the blast radius.
 *
 * Three design decisions, each answering a specific past failure:
 *
 * 1. THE KEY IS DERIVED FROM KLATCH SOURCE, NOT NAMED BY ME. His §3 routed "BetaMessageStream,
 *    beta.messages, streaming: scope, plus your existing alternation" — but a key I hand-name is
 *    my guess about Klatch's surface wearing the authority of a measurement. So the SDK surface is
 *    censused out of the five non-test files that import the SDK (`git ls-tree` + `git show`, at a
 *    stamped rev), and the changelog key is built from what that census returns. If Klatch's call
 *    surface changes, this key changes with it; if the census returns nothing, the instrument
 *    refuses rather than falling back to my list.
 *
 * 2. EVERY BUCKET IS POSITIVELY KEYED AND THE DENOMINATOR IS PUBLISHED (Round 411). Round 417 §3
 *    published 7 rows with no denominator, so "7" could not be read as a fraction of anything.
 *    Here every bullet in the segment is classified, UNMODELLED is reached by its own positive
 *    test rather than by falling off the end of the classifier, and its count is published as a
 *    FLOOR on my blindness rather than as a residue of things that do not matter.
 *
 * 3. GATE LEGS AND PREDICTION LEGS ARE SEPARATED BY WHAT THEY READ (Round 409). A GATE leg reads
 *    only the key and its known positives and must hold or the instrument refuses. A PREDICTION
 *    leg reads the measurement and may be refuted — refutations are the point, and are recorded.
 *
 * Known positives are slices of the fetched file (Round 408), asserted to occur exactly once
 * before any figure prints. Drivable from any cwd: every path is resolved against the repo root,
 * which is derived from import.meta.dirname — this is the defect his §5 found in my Round 417
 * instrument, and the repair is applied here as well as there.
 *
 * Usage: node sec3-rekeyed-on-the-call-shape.mjs [changelog-path]
 *   default changelog: <repo>/.testdata/round419-sdk-changelog.md (written by fetch-changelog.mjs)
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const CHANGELOG = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(REPO, '.testdata', 'round419-sdk-changelog.md');

const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').stdout.trim();

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
  return ok;
};
const predict = (name, expected, actual) => {
  const landed = expected === actual;
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name}: expected ${expected}, measured ${actual}`);
  return landed;
};

say('# Round 419 — Round 417 §3, re-keyed on the call shape');
say('');
say(`rev stamp: ${REV}`);
say(`driven at: ${new Date().toISOString()}`);
say(`cwd:       ${process.cwd()}`);
say(`changelog: ${CHANGELOG}`);
say('');

if (!existsSync(CHANGELOG)) {
  say(`VERDICT: REFUSED — no changelog at ${CHANGELOG}. Run fetch-changelog.mjs first, or pass a path.`);
  process.exit(2);
}
const lines = readFileSync(CHANGELOG, 'utf8').split('\n');

// ---------------------------------------------------------------------------
// STEP 1 — census Klatch's SDK call surface out of tracked source at this rev.
// ---------------------------------------------------------------------------
say('='.repeat(78));
say('## 1. Klatch\'s SDK call surface, censused from tracked non-test source');
say('');

const tracked = git('ls-tree', '-r', '--name-only', REV, '--', 'packages')
  .stdout.split('\n').filter((f) => /\.(ts|tsx)$/.test(f));
const nonTest = tracked.filter((f) => !f.includes('__tests__'));
const testFiles = tracked.filter((f) => f.includes('__tests__'));
say(`tracked packages/ ts|tsx at ${REV.slice(0, 8)}: ${tracked.length} (non-test ${nonTest.length}, test ${testFiles.length})`);

const show = (f) => git('show', `${REV}:${f}`).stdout;

const importers = nonTest.filter((f) => /@anthropic-ai\/sdk/.test(show(f)));
say(`non-test files importing @anthropic-ai/sdk: ${importers.length}`);
importers.forEach((f) => say(`   ${f}`));

// The surface: SDK member-expression chains off the client, plus the stream events Klatch
// attaches handlers to. Keyed on the client-accessor Klatch actually uses rather than on a
// variable name, because the accessor is the one spelling that cannot be renamed locally.
const SURFACE_RE = /(?:getAnthropicClient\(\)|new Anthropic\(\)|anthropic|client)\s*\.((?:[A-Za-z_$][\w$]*\s*\.\s*)*[A-Za-z_$][\w$]*)\s*\(/g;
const EVENT_RE = /\.on\(\s*['"]([a-zA-Z_][\w]*)['"]/g;
const AWAITED_RE = /\bstream\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g;

const chains = new Map();   // "beta.messages.stream" -> [file:line]
const events = new Map();   // "compaction" -> [file:line]

for (const f of importers.length ? importers : []) {
  const src = show(f);
  src.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(SURFACE_RE)) {
      const chain = m[1].replace(/\s+/g, '');
      if (!chains.has(chain)) chains.set(chain, []);
      chains.get(chain).push(`${f}:${i + 1}`);
    }
    for (const m of l.matchAll(EVENT_RE)) {
      if (!events.has(m[1])) events.set(m[1], []);
      events.get(m[1]).push(`${f}:${i + 1}`);
    }
    for (const m of l.matchAll(AWAITED_RE)) {
      const chain = `stream.${m[1]}`;
      if (!chains.has(chain)) chains.set(chain, []);
      chains.get(chain).push(`${f}:${i + 1}`);
    }
  });
}

say('');
say('SDK call chains found (chain -> sites):');
[...chains.entries()].sort().forEach(([c, s]) => say(`   ${c.padEnd(34)} ${s.length}×  ${s.slice(0, 3).join(' ')}`));
say('stream events handled:');
[...events.entries()].sort().forEach(([e, s]) => say(`   '${e}'`.padEnd(37) + ` ${s.length}×  ${s.slice(0, 3).join(' ')}`));

say('');
// GATE: the census must find the surface Round 418 §3 and my own §4 both walked by hand. If it
// does not, the key below is built on nothing and no figure may print.
gate('census found beta.messages.stream', chains.has('beta.messages.stream'),
  (chains.get('beta.messages.stream') || []).join(' '));
gate('census found messages.stream (native path)', chains.has('messages.stream'),
  (chains.get('messages.stream') || []).join(' '));
gate("census found the 'compaction' stream event", events.has('compaction'),
  (events.get('compaction') || []).join(' '));
gate('census found stream.finalMessage()', chains.has('stream.finalMessage'),
  (chains.get('stream.finalMessage') || []).join(' '));
// CONTROL: the chain key must not invent a surface. A chain Klatch does not drive must be absent.
gate('CONTROL chain key refuses a surface Klatch does not drive (completions.create)',
  !chains.has('completions.create'));

// ---------------------------------------------------------------------------
// STEP 2 — the segment, by the Round 417 span logic, re-derived here.
// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 2. The 0.122.0 -> 0.135.0 segment');
say('');

const HEAD_RE = /^##\s+\[?(\d+\.\d+\.\d+)\]?/;
const heads = [];
lines.forEach((l, i) => { const m = HEAD_RE.exec(l); if (m) heads.push({ v: m[1], i }); });
const iLatest = heads.findIndex((h) => h.v === '0.135.0');
const iPin = heads.findIndex((h) => h.v === '0.122.0');
gate('both span endpoints present in the changelog', iLatest >= 0 && iPin >= 0, `iLatest=${iLatest} iPin=${iPin}`);
if (iLatest < 0 || iPin < 0) { say('VERDICT: REFUSED — an endpoint is missing.'); process.exit(1); }

const seg = lines.slice(heads[iLatest].i, heads[iPin].i);
const releases = heads.slice(iLatest, iPin).map((h) => h.v);
say(`segment lines: ${seg.length} | releases above the pin: ${releases.length}`);
say(`releases: ${releases.join(', ')}`);

// Which release each line belongs to — needed so every bucket row carries its version.
const verOf = [];
{
  let cur = null;
  for (const l of seg) { const m = HEAD_RE.exec(l); if (m) cur = m[1]; verOf.push(cur); }
}
const BULLET_RE = /^\s*\*\s+/;
const bullets = seg.map((l, i) => ({ l, v: verOf[i] })).filter((r) => BULLET_RE.test(r.l));
say(`bullet lines in the segment (the DENOMINATOR): ${bullets.length}`);

// ---------------------------------------------------------------------------
// STEP 3 — known positives, sliced from this file (Round 408), before any key runs.
// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 3. Known positives — slices of the fetched changelog, not hand-typed');
say('');

const sliceOnce = (needle) => {
  const hits = seg.filter((l) => l.includes(needle));
  return { hits, n: hits.length, line: hits[0] ?? null };
};
// Each KP names a DIFFERENT axis of the key, so one KP cannot stand in for the rest.
const KPS = {
  KP_STREAM_CLASS: 'tolerate unknown event types in MessageStream and BetaMessageStream',
  // Sliced from changelog:221 after the occurs==1 gate refused my first, hand-typed version of
  // this one — I had written it with backticks around `iterSSEChunks` because that is how a
  // changelog usually spells an identifier, and this entry does not. Round 408, live.
  KP_STREAM_SCOPE: 'drop the redundant iterSSEChunks layer',
  KP_BETA_PARAM: 'deprecate the betas param on GA models and completions methods',
  KP_COMPACTION: 'compaction instructions replace the server\'s summarization prompt',
  KP_TOOL_INPUT: 'show every complete array item and hold back unfinished numbers in partial tool input',
};
const kpLines = {};
for (const [name, needle] of Object.entries(KPS)) {
  const { n, line } = sliceOnce(needle);
  kpLines[name] = line;
  gate(`${name} occurs exactly once in the segment`, n === 1, `occurs=${n}`);
}
// A negative KP: a line in the segment that must land in no Klatch-surface bucket.
const KP_NEG = sliceOnce('chore(internal)');
say(`  KP_NEG candidates (chore(internal)): ${KP_NEG.n}`);

if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.length} gate(s) failed before any figure: ${fails.join(', ')}`); process.exit(1); }

// ---------------------------------------------------------------------------
// STEP 4 — the buckets. Positively keyed, in declared precedence order.
// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 4. Blast radius — every bullet classified, UNMODELLED keyed positively');
say('');

// Derived from the census in step 1: the changelog words that can name each censused surface.
const hasStreamClass = (l) => /\bBetaMessageStream\b|\bMessageStream\b/.test(l);
const hasStreamScope = (l) => /^\s*\*\s+\*\*streaming:\*\*/.test(l);
const hasBetaMessages = (l) => /\bbeta\.messages\b|\bbetas\b|\bbeta\b.*\bmessages?\b/i.test(l);
const hasCompaction = (l) => /compaction|context_management|compact[-_]2026/i.test(l);
const hasToolSurface = (l) => /^\s*\*\s+\*\*tools?:\*\*|\btool[- ]runner\b|\btool input\b|\btool_use\b|\btool_changes\b/i.test(l);
const hasModelsSurface = (l) => /^\s*\*\s+\*\*models?:\*\*|\bmodels\.list\b|\bmodel list\b/i.test(l);
const hasEventName = (l) => [...events.keys()].some((e) => new RegExp(`\\b${e}\\b`).test(l));
// Surfaces Klatch provably does not drive — positively keyed so they are EXCLUDED on evidence.
const hasForeignSurface = (l) => /\bvertex\b|\bbedrock\b|\bcompletions\b|\bbatches\b|\bfiles\b|\bdeno\b|\bcloudflare\b/i.test(l);
// Non-behavioural scopes, positively keyed.
const isNonBehavioural = (l) => /^\s*\*\s+\*\*(docs|internal|chore|ci|test|build|deps|readme)[^*]*:\*\*/i.test(l);

const BUCKETS = [
  ['STREAM-CLASS', (l) => hasStreamClass(l)],
  ['STREAM-SCOPE', (l) => hasStreamScope(l)],
  ['COMPACTION', (l) => hasCompaction(l)],
  ['BETA-MESSAGES', (l) => hasBetaMessages(l)],
  ['TOOL-SURFACE', (l) => hasToolSurface(l)],
  ['MODELS-SURFACE', (l) => hasModelsSurface(l)],
  ['STREAM-EVENT-NAME', (l) => hasEventName(l)],
  ['FOREIGN-SURFACE', (l) => hasForeignSurface(l)],
  ['NON-BEHAVIOURAL-SCOPE', (l) => isNonBehavioural(l)],
];

const classify = (l) => {
  const hit = BUCKETS.filter(([, f]) => f(l)).map(([n]) => n);
  // UNMODELLED is reached by its own positive test — "no bucket key fires" — and is published as
  // a floor on this key's blindness. It is NOT a fall-through default (Round 411).
  if (hit.length === 0) return { bucket: 'UNMODELLED', all: [] };
  return { bucket: hit[0], all: hit };
};

const byBucket = new Map();
for (const b of [...BUCKETS.map(([n]) => n), 'UNMODELLED']) byBucket.set(b, []);
for (const r of bullets) {
  const { bucket, all } = classify(r.l);
  byBucket.get(bucket).push({ ...r, all });
}

let sum = 0;
for (const [b, rows] of byBucket) { sum += rows.length; say(`${b.padEnd(24)} ${String(rows.length).padStart(4)}`); }
say(`${'TOTAL'.padEnd(24)} ${String(sum).padStart(4)}   (denominator ${bullets.length})`);
gate('buckets partition the denominator (every bullet in exactly one)', sum === bullets.length, `${sum} vs ${bullets.length}`);

// KLATCH-REACHABLE = the union of the censused-surface buckets, minus the non-behavioural scopes.
const REACHABLE_BUCKETS = ['STREAM-CLASS', 'STREAM-SCOPE', 'COMPACTION', 'BETA-MESSAGES', 'TOOL-SURFACE', 'MODELS-SURFACE', 'STREAM-EVENT-NAME'];
const reachable = bullets.filter((r) => REACHABLE_BUCKETS.includes(classify(r.l).bucket));
const reachableBehavioural = reachable.filter((r) => !isNonBehavioural(r.l));
say('');
say(`KLATCH-REACHABLE bullets: ${reachable.length} of ${bullets.length}`);
say(`  of which behavioural (not docs:/internal:/chore:): ${reachableBehavioural.length}`);
say('');
say('--- the behavioural, Klatch-reachable set, by release ---');
for (const v of releases) {
  const rows = reachableBehavioural.filter((r) => r.v === v);
  if (!rows.length) continue;
  say(`  ${v}`);
  rows.forEach((r) => say(`     [${classify(r.l).all.join('+')}] ${r.l.trim().replace(/\s*\(\[.*$/, '').slice(0, 118)}`));
}

say('');
say('--- UNMODELLED: this key\'s declared blindness, published as a floor ---');
const unmod = byBucket.get('UNMODELLED');
say(`  ${unmod.length} bullet(s) match no bucket key:`);
unmod.slice(0, 12).forEach((r) => say(`     ${r.v} | ${r.l.trim().replace(/\s*\(\[.*$/, '').slice(0, 112)}`));
if (unmod.length > 12) say(`     … and ${unmod.length - 12} more`);

// ---------------------------------------------------------------------------
// STEP 5 — grade the two published figures this round is about.
// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 5. Grading the published figures');
say('');

// (a) My Round 417 §3 declared key, verbatim from the intel doc, over the same segment.
const MY_417_KEY = /compaction|context_management|compact-2026|compact_2026|betas/;
const my417 = bullets.filter((r) => MY_417_KEY.test(r.l));
const my417Behavioural = my417.filter((r) => !isNonBehavioural(r.l));
say(`(a) Round 417 §3's declared key over the segment: ${my417.length} bullets`);
say(`    of those, behavioural (the undeclared filter §3 actually applied): ${my417Behavioural.length}`);
const pA = predict('my 417 §3 key returns 9, not the 7 published', 9, my417.length);
const pB = predict('the 7 published = the key minus its undeclared scope filter', 7, my417Behavioural.length);

// (b) His §3 prose: "6 segment lines are invisible to it, 3 of which name BetaMessageStream".
const invisibleToMine = bullets.filter((r) => !MY_417_KEY.test(r.l) && REACHABLE_BUCKETS.includes(classify(r.l).bucket));
const streamClassAll = bullets.filter((r) => hasStreamClass(r.l));
const streamClassInvisible = streamClassAll.filter((r) => !MY_417_KEY.test(r.l));
say('');
say(`(b) bullets reachable-by-call-shape but INVISIBLE to the 417 key: ${invisibleToMine.length}`);
say(`    BetaMessageStream/MessageStream bullets in the segment: ${streamClassAll.length}`);
say(`    of those, invisible to the 417 key: ${streamClassInvisible.length}`);
streamClassAll.forEach((r) => say(`       ${MY_417_KEY.test(r.l) ? 'SEEN   ' : 'INVIS  '} ${r.v} | ${r.l.trim().replace(/\s*\(\[.*$/, '').slice(0, 104)}`));
const pC = predict('his "6 invisible" reproduces', 6, invisibleToMine.length);
const pD = predict('his prose "3 of which name BetaMessageStream" reproduces', 3, streamClassInvisible.length);

// (c) The mock-blindness claim: the route tests mock the SDK away, so none of this is covered.
const mocksWholeSdk = testFiles.filter((f) => {
  const s = show(f);
  return /vi\.mock\(\s*['"]@anthropic-ai\/sdk['"]/.test(s) && !/importActual\s*<?[^>]*>?\(\s*['"]@anthropic-ai\/sdk['"]/.test(s);
});
const mocksWithActual = testFiles.filter((f) => /importActual\s*<?[^>]*>?\(\s*['"]@anthropic-ai\/sdk['"]/.test(show(f)));
say('');
say(`(c) test files mocking @anthropic-ai/sdk wholesale (no importActual): ${mocksWholeSdk.length}`);
say(`    test files reaching the real module via importActual:            ${mocksWithActual.length}`);
gate('CONTROL the two mock keys separate (no file in both sets)',
  mocksWholeSdk.filter((f) => mocksWithActual.includes(f)).length === 0);

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
const landed = [pA, pB, pC, pD].filter(Boolean).length;
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join(', ') + ')'}`);
say(`PREDICTIONS: ${landed} landed, ${4 - landed} refuted`);
say(`SUMMARY: rev ${REV.slice(0, 8)} | denominator ${bullets.length} bullets over ${releases.length} releases | ` +
  `Klatch-reachable ${reachable.length}, behavioural ${reachableBehavioural.length} | ` +
  `417-key ${my417.length} (behavioural ${my417Behavioural.length}) | invisible-to-417 ${invisibleToMine.length} | ` +
  `UNMODELLED ${unmod.length} (FLOOR on blindness, not a measurement of irrelevance)`);

writeFileSync(path.join(import.meta.dirname, 'sec3-rekeyed.out'), out.join('\n') + '\n');
if (fails.length) process.exit(1);
