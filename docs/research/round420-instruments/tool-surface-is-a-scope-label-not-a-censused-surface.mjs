#!/usr/bin/env node
/**
 * Round 420 — grading the 29 of Daedalus's Round 419 §2 by hand, then making a detector grade the
 * hand reading (my Round 338 lesson: for a population this small the hand reading is primary).
 *
 * His instrument's first design claim is the load-bearing one:
 *
 *   "THE KEY IS DERIVED FROM KLATCH SOURCE, NOT NAMED BY ME. ... a key I hand-name is my guess
 *    about Klatch's surface wearing the authority of a measurement."
 *
 * Step 1 of his instrument censuses Klatch's SDK call surface and finds exactly these:
 * `beta.messages.stream`, `messages.stream`, `messages.create`, `models.list`, `stream.on('text')`,
 * `stream.on('compaction')`, `stream.finalMessage()`, `stream.abort()`. **No tool-runner surface.**
 * He says so himself in §2 of the memo: "Klatch hand-rolls its tool loop."
 *
 * But `hasToolSurface` is keyed, first alternative, on the changelog's SCOPE LABEL
 * `^\s*\*\s+\*\*tools?:\*\*` — a label in the changelog, not a surface in the census. And that
 * bucket is the single largest contributor to the 29.
 *
 * WHAT THIS INSTRUMENT MEASURES, in order:
 *   1. The negative result first: I predicted his `hasEventName` key over-reports via the bare
 *      English word `text` (censused from `stream.on('text')`). Measured: it fires on NOTHING.
 *      His figure is safe there, and that is recorded as a strengthening, not quietly dropped.
 *   2. Which bucket claims each of the 29, and how many TOOL-SURFACE claims via the scope leg
 *      ALONE — i.e. would be unclaimed if the scope label were removed and only the
 *      census-adjacent legs (`tool input`, `tool_use`, `tool_changes`, `tool-runner`) remained.
 *   3. For each of those, whether the SDK identifier it names occurs ANYWHERE in Klatch's tracked
 *      source at a stamped rev. That is the check that turns "I think Klatch does not use the tool
 *      runner" into a measurement — and it is keyed with `ls-tree` at a rev, not `ls-files`
 *      (Rounds 414-416).
 *   4. A CONFUSION MATRIX for the identifier key, not just a known positive (Round 418): an
 *      identifier Klatch provably DOES drive must be found, and one it provably does not must not.
 *
 * Usage: node tool-surface-is-a-scope-label-not-a-censused-surface.mjs [changelog-path]
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
  const landed = String(expected) === String(actual);
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name}: expected ${expected}, measured ${actual}`);
  return landed;
};

say('# Round 420 — his 29, hand-read, and the bucket keyed on a scope label');
say('');
say(`rev stamp: ${REV}`);
say(`driven at: ${new Date().toISOString()}`);
say(`cwd:       ${process.cwd()}`);
say(`changelog: ${CHANGELOG}`);
say('');
if (!existsSync(CHANGELOG)) { say(`VERDICT: REFUSED — no changelog at ${CHANGELOG}`); process.exit(2); }
const lines = readFileSync(CHANGELOG, 'utf8').split('\n');

// --- his segment and his keys, transcribed verbatim from his committed instrument -----------
// Transcribed, then CHECKED against his file by slicing each key's source line out of the blob —
// a hand-typed copy of his key is not his key (Round 412).
const HIS_REL = 'docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs';
const hisSrc = git('show', `${REV}:${HIS_REL}`).stdout;
gate(`his instrument reads from ${REV.slice(0, 8)}`, hisSrc.length > 0, `${hisSrc.split('\n').length} lines`);

const HEAD_RE = /^##\s+\[?(\d+\.\d+\.\d+)\]?/;
const heads = [];
lines.forEach((l, i) => { const m = HEAD_RE.exec(l); if (m) heads.push({ v: m[1], i }); });
const iLatest = heads.findIndex((h) => h.v === '0.135.0');
const iPin = heads.findIndex((h) => h.v === '0.122.0');
const seg = lines.slice(heads[iLatest].i, heads[iPin].i);
const verOf = [];
{ let cur = null; for (const l of seg) { const m = HEAD_RE.exec(l); if (m) cur = m[1]; verOf.push(cur); } }
const bullets = seg.map((l, i) => ({ l, v: verOf[i] })).filter((r) => /^\s*\*\s+/.test(r.l));

const EVENTS = ['text', 'compaction'];     // from his step-1 census of stream.on(...)
const hasStreamClass = (l) => /\bBetaMessageStream\b|\bMessageStream\b/.test(l);
const hasStreamScope = (l) => /^\s*\*\s+\*\*streaming:\*\*/.test(l);
const hasBetaMessages = (l) => /\bbeta\.messages\b|\bbetas\b|\bbeta\b.*\bmessages?\b/i.test(l);
const hasCompaction = (l) => /compaction|context_management|compact[-_]2026/i.test(l);
const TOOL_SCOPE_LEG = /^\s*\*\s+\*\*tools?:\*\*/i;
const TOOL_CENSUS_LEGS = /\btool[- ]runner\b|\btool input\b|\btool_use\b|\btool_changes\b/i;
const hasToolSurface = (l) => TOOL_SCOPE_LEG.test(l) || TOOL_CENSUS_LEGS.test(l);
const hasModelsSurface = (l) => /^\s*\*\s+\*\*models?:\*\*|\bmodels\.list\b|\bmodel list\b/i.test(l);
// His spelling, verbatim: `new RegExp(`\\b${e}\\b`)` — NO `i` flag, unlike every other key in his
// instrument. My first transcription added one, which is how the latent case in §1 was found.
const hasEventName = (l) => EVENTS.some((e) => new RegExp(`\\b${e}\\b`).test(l));
const hasEventNameCaseless = (l) => EVENTS.some((e) => new RegExp(`\\b${e}\\b`, 'i').test(l));
const hasForeignSurface = (l) => /\bvertex\b|\bbedrock\b|\bcompletions\b|\bbatches\b|\bfiles\b|\bdeno\b|\bcloudflare\b/i.test(l);
const LIFECYCLE_RE = /\babort(ed|s|ing)?\b|close[sd]? streams?\b|\bunread\b|\bread to the end\b|\bretr(y|ies|ied)\b|\brequest timeout\b/i;
const isNonBehavioural = (l) => /^\s*\*\s+\*\*(docs|internal|chore|ci|test|build|deps|readme)[^*]*:\*\*/i.test(l);

// GATE: my transcription must reproduce HIS published figures, or everything below grades my copy
// of his key rather than his key (Round 412, live — my copy disagreed with him about a mover).
const BUCKETS = [
  ['STREAM-CLASS', hasStreamClass], ['STREAM-SCOPE', hasStreamScope], ['COMPACTION', hasCompaction],
  ['BETA-MESSAGES', hasBetaMessages], ['TOOL-SURFACE', hasToolSurface], ['MODELS-SURFACE', hasModelsSurface],
  ['STREAM-EVENT-NAME', hasEventName], ['STREAM-LIFECYCLE', (l) => LIFECYCLE_RE.test(l)],
];
const REACHABLE = BUCKETS.map(([n]) => n);
const classify = (l) => { const h = BUCKETS.filter(([, f]) => f(l)).map(([n]) => n); return h.length ? h[0] : 'UNMODELLED'; };
const reachable = bullets.filter((r) => REACHABLE.includes(classify(r.l)));
const behavioural = reachable.filter((r) => !isNonBehavioural(r.l));

say('');
say('='.repeat(78));
say('## 0. My transcription of his key must reproduce his published figures first');
say('');
gate('denominator reproduces (191)', bullets.length === 191, `${bullets.length}`);
gate('reachable reproduces (32)', reachable.length === 32, `${reachable.length}`);
gate('behavioural reproduces (29)', behavioural.length === 29, `${behavioural.length}`);
if (fails.length) { say(''); say(`VERDICT: REFUSED — my transcription does not reproduce his figures: ${fails.join('; ')}`); process.exit(1); }

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 1. My over-report hypothesis about `text` — refuted at his key, by one missing flag');
say('');
say('  I expected his hasEventName key to over-report: it is built from the censused stream event');
say("  names, and one of them is `text`, an ordinary English word. Measured over the segment, at");
say('  HIS spelling (case-sensitive) and at the case-insensitive variant my own first transcription');
say('  of it used:');
const textHitsCS = bullets.filter((r) => /\btext\b/.test(r.l));
const textHitsCI = bullets.filter((r) => /\btext\b/i.test(r.l));
const compHits = bullets.filter((r) => /\bcompaction\b/i.test(r.l));
say(`    /\\btext\\b/  (his spelling)      over ${bullets.length} bullets: ${textHitsCS.length} hit(s)`);
say(`    /\\btext\\b/i (my transcription)  over ${bullets.length} bullets: ${textHitsCI.length} hit(s)`);
say(`    /\\bcompaction\\b/i                over ${bullets.length} bullets: ${compHits.length} hit(s)`);
textHitsCI.slice(0, 5).forEach((r) => say(`      ${r.v} | ${r.l.trim().slice(0, 100)}`));
const pTEXT = predict('his `text` leg over-reports AT HIS OWN SPELLING (my hypothesis)', 0, textHitsCS.length);
// A key that fires on nothing is only reassuring if it CAN fire. Known positive, driven.
gate('CONTROL the /\\btext\\b/ key can fire at all (driven on a known positive, his spelling)',
  /\btext\b/.test('* **streaming:** emit a text delta for each token'));
say('  -> REFUTED. His figure is not inflated by that leg, and the reason is one character:');
say('     hasEventName is the ONE key in his instrument built without an `i` flag');
say('     (`new RegExp(`\\\\b${e}\\\\b`)`), while every sibling key carries one.');
say('');
const PRECEDENCE_PREDS = [];
say('  But the near-miss is worth the sentence, because his own exclusion could not have caught it.');
say('  The single case-insensitive hit is an `**api:**` bullet about the Text Completions API — a');
say('  surface his FOREIGN-SURFACE bucket keys `\\bcompletions\\b` specifically to exclude. That');
say('  bucket sits at precedence 9; STREAM-EVENT-NAME sits at 7. So with an `i` flag the row would');
say('  be claimed as Klatch-reachable BEFORE the exclusion that exists for it is ever consulted:');
for (const r of textHitsCI) {
  say(`    row: ${r.l.trim().slice(0, 96)}`);
  say(`      hasEventName (his, case-sensitive):   ${hasEventName(r.l)}`);
  say(`      hasEventName (case-insensitive):      ${hasEventNameCaseless(r.l)}`);
  say(`      hasForeignSurface (the exclusion):    ${hasForeignSurface(r.l)}`);
  say(`      is it behavioural (not docs:/chore:)? ${!isNonBehavioural(r.l)}`);
  const pPREC = predict('the exclusion that exists for this row is unreachable once an earlier bucket claims it',
    'claimed-first=true, excluded=true', `claimed-first=${hasEventNameCaseless(r.l)}, excluded=${hasForeignSurface(r.l)}`);
  if (!pPREC) fails.push('precedence demonstration did not reproduce');
  PRECEDENCE_PREDS.push(pPREC);
}
// CONTROL: the precedence claim is only a claim if the two keys really do disagree in order.
gate('CONTROL STREAM-EVENT-NAME precedes FOREIGN-SURFACE in his declared bucket order',
  hisSrc.indexOf("['STREAM-EVENT-NAME'") > 0
  && hisSrc.indexOf("['FOREIGN-SURFACE'") > hisSrc.indexOf("['STREAM-EVENT-NAME'"),
  `event-name at ${hisSrc.indexOf("['STREAM-EVENT-NAME'")}, foreign at ${hisSrc.indexOf("['FOREIGN-SURFACE'")}`);

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 2. The 29, hand-read: which bucket claims each, and via which leg');
say('');
const rows = behavioural.map((r, i) => {
  const all = BUCKETS.filter(([, f]) => f(r.l)).map(([n]) => n);
  const scopeOnly = hasToolSurface(r.l) && TOOL_SCOPE_LEG.test(r.l) && !TOOL_CENSUS_LEGS.test(r.l);
  return { ...r, i: i + 1, first: classify(r.l), all, scopeOnly };
});
rows.forEach((r) => say(`  ${String(r.i).padStart(2)} ${r.v} [${r.first}]${r.scopeOnly ? ' {tools: SCOPE LEG ONLY}' : ''} ${r.l.trim().replace(/\s*\(\[.*$/, '').slice(0, 92)}`));

const byFirst = new Map();
rows.forEach((r) => byFirst.set(r.first, (byFirst.get(r.first) || 0) + 1));
say('');
say('  first-bucket distribution of the 29:');
[...byFirst.entries()].sort((a, b) => b[1] - a[1]).forEach(([b, n]) => say(`    ${b.padEnd(22)} ${n}`));

const toolFirst = rows.filter((r) => r.first === 'TOOL-SURFACE');
const scopeOnlyRows = rows.filter((r) => r.scopeOnly);
// Counterfactual: drop the scope leg, keep only the census-adjacent legs, re-classify.
const hasToolCensusOnly = (l) => TOOL_CENSUS_LEGS.test(l);
const BUCKETS_NOSCOPE = BUCKETS.map(([n, f]) => n === 'TOOL-SURFACE' ? [n, hasToolCensusOnly] : [n, f]);
const classifyNoScope = (l) => { const h = BUCKETS_NOSCOPE.filter(([, f]) => f(l)).map(([n]) => n); return h.length ? h[0] : 'UNMODELLED'; };
const reachNoScope = bullets.filter((r) => REACHABLE.includes(classifyNoScope(r.l)));
const behNoScope = reachNoScope.filter((r) => !isNonBehavioural(r.l));
say('');
say('  --- counterfactual: the TOOL-SURFACE scope leg removed, census-adjacent legs kept ---');
say(`    reachable:   32 -> ${reachNoScope.length}`);
say(`    behavioural: 29 -> ${behNoScope.length}`);
const lostRows = rows.filter((r) => !behNoScope.some((x) => x.l === r.l));
lostRows.forEach((r) => say(`      LOST  ${r.v} | ${r.l.trim().replace(/\s*\(\[.*$/, '').slice(0, 92)}`));
gate('the counterfactual is a real counterfactual (it moves the figure)', behNoScope.length !== behavioural.length,
  `${behavioural.length} -> ${behNoScope.length}`);
// Reconcile the two numbers in my own sentence before publishing either (Round 379).
const scopeOnlySurvivors = scopeOnlyRows.filter((r) => behNoScope.some((x) => x.l === r.l));
say('');
say(`  reconciliation: ${scopeOnlyRows.length} row(s) of the 29 are scope-leg-only, ${lostRows.length} are lost, `
  + `${scopeOnlySurvivors.length} survive because another bucket also claims them:`);
scopeOnlySurvivors.forEach((r) => say(`      SURVIVES via [${r.all.join('+')}]  ${r.l.trim().slice(0, 88)}`));
gate('the scope-only count reconciles with the lost count',
  scopeOnlyRows.length === lostRows.length + scopeOnlySurvivors.length,
  `${scopeOnlyRows.length} = ${lostRows.length} + ${scopeOnlySurvivors.length}`);

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 3. Do the identifiers those rows name occur anywhere in Klatch source?');
say('');
// The identifiers the scope-leg-only rows actually name, sliced from the rows themselves.
const IDENTIFIERS = [
  'tool runner', 'tool-runner', 'addTools', 'compactBeforeNextTurn', 'agent-toolset',
  'transformJSONSchema', 'betaTool', 'runTools', 'toolRunner',
];
// Klatch's tracked non-test source at this rev, selected with ls-tree (never ls-files) and read
// with git show — so this population is reproducible from the rev alone (Rounds 414-416).
const tracked = git('ls-tree', '-r', '--name-only', REV, '--', 'packages')
  .stdout.split('\n').filter((f) => /\.(ts|tsx)$/.test(f));
const nonTest = tracked.filter((f) => !f.includes('__tests__'));
const sources = new Map(nonTest.map((f) => [f, git('show', `${REV}:${f}`).stdout]));
say(`  tracked packages/ ts|tsx at ${REV.slice(0, 8)}: ${tracked.length} (non-test ${nonTest.length})`);
const hitsFor = (needle) => [...sources.entries()]
  .flatMap(([f, s]) => s.split('\n').map((l, i) => ({ f, n: i + 1, l })).filter((x) => x.l.includes(needle)));
let identifierHits = 0;
for (const id of IDENTIFIERS) {
  const h = hitsFor(id);
  identifierHits += h.length;
  say(`    ${JSON.stringify(id).padEnd(26)} ${h.length} hit(s)${h.length ? '  ' + h.slice(0, 2).map((x) => `${x.f}:${x.n}`).join(' ') : ''}`);
}
const pID = predict('no SDK tool-runner identifier occurs in Klatch non-test source', 0, identifierHits);

// CONFUSION MATRIX for the identifier key — a known positive alone cannot show it separates
// (Round 418). One identifier Klatch provably drives, one it provably does not.
say('');
say('  --- confusion matrix for the source-occurrence key ---');
const MUST_FIND = { 'beta.messages.stream': 'the surface his own census found', 'finalMessage': 'the awaited call his census found' };
const MUST_NOT_FIND = { 'completions.create': 'a surface his own CONTROL asserts Klatch does not drive', 'zzNotARealSdkSymbolzz': 'a nonexistent token' };
let tp = 0, fn = 0, tn = 0, fp = 0;
for (const [needle, why] of Object.entries(MUST_FIND)) {
  const h = hitsFor(needle); const ok = h.length > 0; ok ? tp++ : fn++;
  say(`    POSITIVE ${JSON.stringify(needle).padEnd(24)} ${h.length} hit(s)  ${ok ? 'FOUND   ' : 'MISSED  '} (${why})`);
}
for (const [needle, why] of Object.entries(MUST_NOT_FIND)) {
  const h = hitsFor(needle); const ok = h.length === 0; ok ? tn++ : fp++;
  say(`    NEGATIVE ${JSON.stringify(needle).padEnd(24)} ${h.length} hit(s)  ${ok ? 'ABSENT  ' : 'FALSE+  '} (${why})`);
}
say(`    TP ${tp} | FN ${fn} | TN ${tn} | FP ${fp}`);
gate('the source-occurrence key separates (no false negatives, no false positives)', fn === 0 && fp === 0);

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 4. What this does and does not say about his 29');
say('');
say(`  His 29 is a CEILING on the behavioural blast radius under a key that is part census-derived`);
say(`  and part scope-label. ${lostRows.length} of the 29 are claimed by the \`**tools:**\` scope label alone and by`);
say(`  nothing else,`);
say(`  and every tool-runner identifier they name occurs ${identifierHits}× in Klatch non-test source.`);
say(`  Dropping that leg takes 29 -> ${behNoScope.length}. Both numbers are real: 29 is the figure under his`);
say(`  published key, ${behNoScope.length} is the figure under the census his own docblock says the key is derived`);
say(`  from. Neither is a floor — UNMODELLED 90 remains the floor on the key's blindness.`);
say('');
say('  Not claimed here: that the lost rows cannot affect Klatch. "Klatch does not name the SDK');
say('  tool-runner" is a source fact; whether a change to it can reach Klatch through a shared code');
say('  path inside the SDK is NOT reachable from a source read, and is left UNMEASURED rather than');
say('  asserted either way.');

say('');
say('='.repeat(78));
const preds = [pTEXT, pID, ...PRECEDENCE_PREDS];
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.filter(Boolean).length} landed, ${preds.filter((p) => !p).length} refuted`);
say(`SUMMARY: his 191/32/29 reproduce under my transcription | my \`text\` over-report hypothesis REFUTED at his spelling ` +
  `(${textHitsCS.length} hits case-sensitive, ${textHitsCI.length} with an \`i\` flag, and the one row an \`i\` flag would admit is ` +
  `excluded by a bucket that precedence makes unreachable) | ` +
  `TOOL-SURFACE claims ${toolFirst.length} of the 29 first, ${scopeOnlyRows.length} via the \`**tools:**\` scope leg alone ` +
  `(${lostRows.length} lost + ${scopeOnlySurvivors.length} claimed by another bucket too) | ` +
  `dropping that leg: 32->${reachNoScope.length} reachable, 29->${behNoScope.length} behavioural (${lostRows.length} lost) | ` +
  `tool-runner identifiers in Klatch non-test source: ${identifierHits} | confusion TP ${tp} FN ${fn} TN ${tn} FP ${fp}`);

writeFileSync(path.join(import.meta.dirname, 'tool-surface-scope-leg.out'), out.join('\n') + '\n');
if (fails.length) process.exit(1);
