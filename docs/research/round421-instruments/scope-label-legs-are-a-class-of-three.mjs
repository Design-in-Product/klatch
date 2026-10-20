#!/usr/bin/env node
/**
 * Round 421 §3/§4 — Theseus's Round 420 §3 and §4, taken, reproduced, and widened.
 *
 * HIS §3 CHARGE, and it is correct: my `hasToolSurface` key's FIRST alternative anchors a
 * markdown bullet carrying the changelog's own `tools:` scope label — not a surface my step-1
 * census returned. My docblock's first design decision says "THE KEY IS DERIVED FROM KLATCH
 * SOURCE, NOT NAMED BY ME", and a scope label is the SDK's taxonomy, not Klatch's surface. He
 * measured 32/29 -> 27/24 when the leg is dropped.
 *
 * WHAT I FOUND TAKING IT: the mechanism he reported in one leg is live in THREE. Round 355 —
 * census the mechanism, not just the reported instance.
 *
 *   line 220  hasStreamScope     anchors the `streaming:` scope label  <- scope label, WHOLLY
 *   line 223  hasToolSurface     anchors the `tools:` scope label      <- his instance
 *   line 224  hasModelsSurface   anchors the `models:` scope label     <- same shape, unreported
 *
 * So the question is not "is 29 or 24 the figure" but "what does the published figure owe to the
 * SDK's scope labels rather than to Klatch's censused surface", and that has to be answered for
 * all three legs or the answer is just his instance with my sign-off on it.
 *
 * HOW THE KEY IS OBTAINED. Not transcribed. Every cell is a MUTATED COPY of the committed
 * instrument, driven, with its own printed figures read back — so each cell uses my real key with
 * one leg changed, and a transcription error cannot move a number (Rounds 408/412: a hand-typed
 * reader is not a slice). Copies live at depth 3 under the gitignored .testdata/ because the
 * instrument derives REPO from `import.meta.dirname/../../..`.
 *
 * Every mutation anchor is asserted to occur exactly once before it is applied (Round 347), and
 * the baseline cell must reproduce my published 191/32/29 before any counterfactual is believed
 * (Round 328 / 412: reproduce the figures under the key that published them, first).
 *
 * HIS §4, also correct: `hasEventName` is the one key built without an `i` flag while every
 * sibling carries one, and the exclusion bucket written for the row an `i` flag would catch
 * (`FOREIGN-SURFACE`, keyed `\bcompletions\b`) sits at precedence 9, AFTER `STREAM-EVENT-NAME` at
 * 7 — so the row would be claimed reachable before its own exclusion is ever consulted. Both the
 * flag and the ordering are measured here.
 *
 * ROUND 422 §2 AND §3 — both taken, both cured in place, and both correct. Neither said a number
 * of mine was wrong; both said an instrument of mine would have published a different number just
 * as green, which is what makes a number unverified rather than verified.
 *   §2  `26`, `29` and `21` were `say()`-only, and the one gate touching the census-only figure was
 *       an inequality that `null <= 24` satisfies. All three are now `predict()`ed on their value,
 *       every published figure is gated non-null first, and the SUMMARY sentence is bound to the
 *       set of legs each cell MEASURABLY dropped rather than to the cell's name.
 *   §3  the §1 census keyed on each key's DEFINITION LINE, so the two subjects that declare no
 *       regex literal there (`hasEventName`, built at runtime; `hasStreamLifecycle`, hoisted into
 *       `LIFECYCLE_RE`) returned `no` for any input. Replaced with one pattern RESOLVER, shared by
 *       §1 and §2, that follows a hoisted identifier and publishes UNRESOLVED for a runtime-built
 *       one. `3 inclusion legs` is reported as a FLOOR with its direction of error named.
 * The dead `SCOPE_SHAPE` / `scopeLegs` pair he found is deleted, not repaired.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const INSTR_REL = 'docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs';
const INSTR_ABS = path.join(REPO, INSTR_REL);
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
// Each CELL DIRECTORY must itself be depth 3 under REPO, because the instrument derives REPO as
// `import.meta.dirname/../../..` and the cell file sits in that directory. So CELLS is depth 2 and
// `CELLS/<name>` is depth 3. My first spelling put the cells one level deeper and every cell
// refused — caught by the per-cell depth gate, which is why it is a gate and not a comment.
const CELLS = path.join(REPO, '.testdata', 'round421cells');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

say('# Round 421 §3/§4 — the scope-label leg is a class of three, and the `i` flag');
say('');
say(`HEAD: ${spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

gate('the instrument under test is present', existsSync(INSTR_ABS), INSTR_REL);
gate('the changelog fixture is present', existsSync(CHANGELOG), CHANGELOG);
gate('a cell DIRECTORY is depth 3 under REPO (the instrument derives REPO from its own dirname)',
  path.resolve(path.join(CELLS, 'sample'), '../../..') === REPO,
  path.resolve(path.join(CELLS, 'sample'), '../../..'));
if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.join('; ')}`); process.exit(2); }

const SRC = readFileSync(INSTR_ABS, 'utf8');

// --- the anchors, verbatim from source --------------------------------------
const A_STREAM_SCOPE = `const hasStreamScope = (l) => /^\\s*\\*\\s+\\*\\*streaming:\\*\\*/.test(l);`;
const A_TOOL = `const hasToolSurface = (l) => /^\\s*\\*\\s+\\*\\*tools?:\\*\\*|\\btool[- ]runner\\b|\\btool input\\b|\\btool_use\\b|\\btool_changes\\b/i.test(l);`;
const A_MODELS = `const hasModelsSurface = (l) => /^\\s*\\*\\s+\\*\\*models?:\\*\\*|\\bmodels\\.list\\b|\\bmodel list\\b/i.test(l);`;
const A_EVENT = 'const hasEventName = (l) => [...events.keys()].some((e) => new RegExp(`\\\\b${e}\\\\b`).test(l));';

// --- the scope-label mechanism, censused from source rather than hand-listed -
say('');
say('## 1. The mechanism, censused from my own source');
say('');
// ROUND 422 §3, TAKEN. The spelling under this banner used to test each key's DEFINITION LINE for
// the literal text `^\s*\*\s+\*\*`. Two of the ten subjects declare no regex literal on that line:
// `hasEventName` builds its pattern at runtime from `events.keys()`, and `hasStreamLifecycle`
// delegates to `LIFECYCLE_RE`, hoisted to the previous line. For those two, `scope-label leg: no`
// was not a measurement — it was what the key returns for any input. He graded it as a confusion
// matrix rather than a known positive (right, because the claim is about position and one cell
// cannot separate position from property): with an inert `**lifecycle:**` alternative HOISTED into
// `LIFECYCLE_RE` the census said `no` and the whole instrument was green end to end; with the
// identical alternative INLINE it said `YES`. Position was the only difference.
//
// Also his, also correct, also fixed here: the two bindings that used to sit at the head of this
// block — `SCOPE_SHAPE` (a /g literal driven by .test(), which alternates true/false on identical
// input) and `scopeLegs` (assigned and read zero times) — were dead, and the comment above them
// described that dead regex rather than the live looser key below it. They are gone rather than
// repaired: the live key is the resolver.
//
// THE CURE, in the words I used one layer down in Round 421: key on the CALL SHAPE, not on the
// path string. Here that means resolving each key's pattern — following a hoisted identifier to
// its declaration — and REFUSING on a runtime-built one instead of silently calling it `no`
// (Round 411: a terminal bucket reached by fall-through absorbs every blindness; Round 399: a
// refusal value is not the sentinel — publish UNRESOLVED). One resolver, feeding both §1 and §2,
// because the old spelling's §2 output already knew about these two and §1 never read it.
const RE_LITERAL = /\/(?:[^/\\\n[]|\\.|\[(?:[^\]\\]|\\.)*\])+\/([a-z]*)/;
const declOf = (ident) => (SRC.match(new RegExp(`^const ${ident} = (.*)$`, 'm')) || [, null])[1];
const resolvePattern = (body) => {
  const inline = body.match(RE_LITERAL);
  if (inline) return { src: inline[0], flags: inline[1], how: 'inline' };
  const ref = body.match(/\b([A-Z][A-Z0-9_]*)\s*\.test\(/);
  if (ref) {
    const lit = (declOf(ref[1]) || '').match(RE_LITERAL);
    if (lit) return { src: lit[0], flags: lit[1], how: `hoisted via ${ref[1]}` };
    return { src: null, flags: null, how: `UNRESOLVED (${ref[1]} declares no regex literal)` };
  }
  if (/new RegExp\(/.test(body)) return { src: null, flags: null, how: 'UNRESOLVED (built with new RegExp)' };
  return { src: null, flags: null, how: 'UNRESOLVED (no pattern found)' };
};
// A scope-label leg is one whose RESOLVED pattern anchors a markdown bullet with a **word:** scope.
const SCOPE_IN_PATTERN = /\^\\s\*\\\*\\s\+\\\*\\\*/;
const keyLines = SRC.split('\n')
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => /^const has[A-Z]\w* = \(l\) =>/.test(l) || /^const is[A-Z]\w* = \(l\) =>/.test(l));
say(`  bucket-key definitions found in source: ${keyLines.length}`);
const subjects = keyLines.map(({ n, l }) => {
  const name = l.match(/^const (\w+)/)[1];
  const body = l.replace(/^const \w+ = \(l\) =>\s*/, '');
  const pat = resolvePattern(body);
  const hasScope = pat.src === null ? null : SCOPE_IN_PATTERN.test(pat.src);
  const soleLeg = hasScope === true &&
    !/\|/.test(pat.src.replace(/\(docs\|internal\|chore\|ci\|test\|build\|deps\|readme\)[^)]*/, 'X'));
  return { n, name, pat, hasScope, soleLeg };
});
for (const s of subjects) {
  const verdict = s.hasScope === null ? 'UNRESOLVED' : s.hasScope ? 'YES' : 'no ';
  const note = s.hasScope === true ? (s.soleLeg ? '  (its ONLY leg)' : '  (first of several)')
    : s.hasScope === null ? `  ${s.pat.how}` : '';
  say(`    line ${String(s.n).padStart(3)}  ${s.name.padEnd(20)} scope-label leg: ${verdict}${note}`);
  if (s.pat.how.startsWith('hoisted')) say(`${' '.repeat(26)}  ^ resolved ${s.pat.how}`);
}
const unresolved = subjects.filter((s) => s.hasScope === null).map((s) => s.name);
const scopeKeyed = subjects.filter((s) => s.hasScope === true).map((s) => s.name);
say('');
say(`  resolvable subjects: ${subjects.length - unresolved.length} of ${subjects.length}` +
  `   UNRESOLVED: ${unresolved.join(', ') || '(none)'}`);
say(`  scope-label-keyed legs: ${scopeKeyed.join(', ')}`);
// The resolver must actually resolve the two subjects the old position key could not see, and it
// must NOT silently bucket a runtime-built pattern as `no` (Round 411). Both directions gated.
const byName = Object.fromEntries(subjects.map((s) => [s.name, s]));
gate('the resolver follows the hoisted identifier: hasStreamLifecycle resolves via LIFECYCLE_RE',
  byName.hasStreamLifecycle?.pat.how === 'hoisted via LIFECYCLE_RE' && byName.hasStreamLifecycle.hasScope === false,
  `${byName.hasStreamLifecycle?.pat.how} → hasScope=${byName.hasStreamLifecycle?.hasScope}`);
gate('the resolver REFUSES on the runtime-built pattern rather than calling it `no`',
  byName.hasEventName?.hasScope === null && /new RegExp/.test(byName.hasEventName.pat.how),
  `hasEventName → ${byName.hasEventName?.hasScope} · ${byName.hasEventName?.pat.how}`);
gate('CONTROL: the resolver did not resolve everything to UNRESOLVED', unresolved.length < subjects.length,
  `${unresolved.length} unresolved of ${subjects.length}`);
// His report named one. The census finds how many there are. isNonBehavioural is scope-keyed too,
// but it is an EXCLUSION — a scope label is the right evidence for "this entry is docs:", because
// the claim being made there is about the changelog's own taxonomy, not about Klatch's surface.
const INCLUSION_SCOPE_LEGS = scopeKeyed.filter((n) => n !== 'isNonBehavioural');
predict('the scope-label mechanism is live in 3 INCLUSION legs, not the 1 he reported',
  ['hasStreamScope', 'hasToolSurface', 'hasModelsSurface'], INCLUSION_SCOPE_LEGS);
gate('CONTROL: the census did not simply return every key', keyLines.length > scopeKeyed.length,
  `${scopeKeyed.length} scope-keyed of ${keyLines.length} keys`);
// The direction of error, stated rather than left implicit (Round 408: a refusing signal only
// raises a floor, so say which end it can move). An UNRESOLVED subject can only ADD a scope leg if
// resolved, never remove one — so 3 is a FLOOR on the class and every figure derived from dropping
// the class is a CEILING. With `hasEventName` unresolvable, the honest statement is "3 of the 9
// resolvable legs, 1 unresolvable", not "3 of 10".
say('');
say(`  the class is a FLOOR of ${INCLUSION_SCOPE_LEGS.length}, measured over ` +
  `${subjects.length - unresolved.length} of ${subjects.length} subjects; ` +
  `${unresolved.length} unresolvable can only raise it`);
predict('exactly one subject is unresolvable, and it is the runtime-built one',
  ['hasEventName'], unresolved);

// --- §4: the i-flag asymmetry, read off source ------------------------------
say('');
say('## 2. §4 — the one key without an `i` flag, and the precedence under it');
say('');
// Reads the SAME resolver §1 reads. The old spelling had its own definition-line scan here, which
// is how it came to print `(built with new RegExp)` for `hasStreamLifecycle` — hoisted, not built —
// in a section §1 never consulted. One resolver means the two sections cannot disagree again.
const flagged = subjects.map((s) => ({ n: s.n, name: s.name, flags: s.pat.flags, how: s.pat.how }));
for (const f of flagged) {
  say(`    line ${String(f.n).padStart(3)}  ${f.name.padEnd(20)} flags: ${f.flags === null ? 'UNRESOLVED' : (f.flags || '(none)')}` +
    `${f.how === 'inline' ? '' : '   ' + f.how}`);
}
const noI = flagged.filter((f) => f.flags !== null && !/i/.test(f.flags));
say('');
say(`  resolvable keys WITHOUT an i flag: ${noI.map((f) => f.name).join(', ') || '(none)'}`);
say(`  keys whose pattern is UNRESOLVED (flags unreadable from source): ${flagged.filter((f) => f.flags === null).map((f) => f.name).join(', ') || '(none)'}`);
gate('the flag read agrees with the §1 resolver on how each pattern is obtained',
  flagged.every((f) => (f.flags === null) === (byName[f.name].hasScope === null)),
  `${flagged.filter((f) => f.flags === null).length} unresolved here vs ${unresolved.length} in §1`);
gate('hasEventName is built with new RegExp and carries no flags argument',
  SRC.includes(A_EVENT) && !/new RegExp\(`\\\\b\$\{e\}\\\\b`, *'i'\)/.test(SRC),
  SRC.includes(A_EVENT) ? 'anchor found, no i flag' : 'ANCHOR NOT FOUND');

// Precedence: his claim is STREAM-EVENT-NAME at 7 and FOREIGN-SURFACE at 9. That is a claim about
// the LIVE array, `BUCKETS` — not `BUCKETS_V1`. My first spelling of this prediction read
// BUCKETS_V1, got [7, 8], and refuted him; the refutation was mine, not his. BUCKETS is
// BUCKETS_V1 with STREAM-LIFECYCLE spliced in at 7, which pushes FOREIGN-SURFACE to 9. Both
// orders are derived from source and printed, because the one the classifier uses is the one that
// decides a row's bucket (Round 350: characterise a detector under its OWN selector).
const v1Block = SRC.split('const BUCKETS_V1 = [')[1]?.split('];')[0] ?? '';
const v1Order = [...v1Block.matchAll(/\['([A-Z-]+)'/g)].map((m) => m[1]);
const liveBlock = SRC.split('const BUCKETS = [')[1]?.split('];')[0] ?? '';
const spliceAt = +(liveBlock.match(/BUCKETS_V1\.slice\(0, *(\d+)\)/) || [, NaN])[1];
const insertedName = (liveBlock.match(/\['([A-Z-]+)'/) || [, null])[1];
const liveOrder = Number.isInteger(spliceAt) && insertedName
  ? [...v1Order.slice(0, spliceAt), insertedName, ...v1Order.slice(spliceAt)]
  : v1Order;
say('');
say(`  BUCKETS_V1 declared order: ${v1Order.join(' > ')}`);
say(`  BUCKETS (live, used by classify) : ${liveOrder.join(' > ')}`);
gate('the live order was derived from the splice in source, not assumed',
  Number.isInteger(spliceAt) && insertedName !== null, `slice(0,${spliceAt}) inserting ${insertedName}`);
const iEvent = liveOrder.indexOf('STREAM-EVENT-NAME'), iForeign = liveOrder.indexOf('FOREIGN-SURFACE');
predict('his "STREAM-EVENT-NAME at 7, FOREIGN-SURFACE at 9", read off the LIVE array (1-indexed)',
  [7, 9], [iEvent + 1, iForeign + 1]);
gate('the inclusion bucket really does precede the exclusion written for its rows',
  iEvent >= 0 && iForeign >= 0 && iEvent < iForeign, `${iEvent + 1} < ${iForeign + 1}`);

// --- the cells ---------------------------------------------------------------
say('');
say('## 3. The cells — my real key, one leg changed per cell, each driven');
say('');
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(CELLS, { recursive: true });

const mutate = (src, pairs, label) => {
  let s = src;
  for (const [from, to] of pairs) {
    const occurs = s.split(from).length - 1;
    gate(`[${label}] anchor occurs exactly once: ${from.slice(0, 44)}…`, occurs === 1, `occurs=${occurs}`);
    if (occurs !== 1) return null;
    s = s.split(from).join(to);
  }
  return s;
};

// Dropping a scope alternative = replace the leg's pattern with the rest of its alternatives.
const TOOL_NO_SCOPE = `const hasToolSurface = (l) => /\\btool[- ]runner\\b|\\btool input\\b|\\btool_use\\b|\\btool_changes\\b/i.test(l);`;
const MODELS_NO_SCOPE = `const hasModelsSurface = (l) => /\\bmodels\\.list\\b|\\bmodel list\\b/i.test(l);`;
// hasStreamScope has no non-scope alternative: without its scope label it has no key at all, so
// the honest counterfactual is a leg that cannot fire. Named NEVER so the output says so.
const STREAM_NO_SCOPE = `const hasStreamScope = (l) => /(?!)/.test(l); // MUTANT: scope-label leg removed, nothing left`;
const EVENT_WITH_I = 'const hasEventName = (l) => [...events.keys()].some((e) => new RegExp(`\\\\b${e}\\\\b`, \'i\').test(l));';

const CELLS_SPEC = [
  ['baseline', []],
  ['drop-tools-scope', [[A_TOOL, TOOL_NO_SCOPE]]],
  ['drop-models-scope', [[A_MODELS, MODELS_NO_SCOPE]]],
  ['drop-streaming-scope', [[A_STREAM_SCOPE, STREAM_NO_SCOPE]]],
  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE], [A_STREAM_SCOPE, STREAM_NO_SCOPE]]],
  ['event-key-with-i-flag', [[A_EVENT, EVENT_WITH_I]]],
];

const read = (text) => {
  const d = text.match(/^denominator: (\d+)/m) || text.match(/\(denominator (\d+)\)/m);
  const r = text.match(/^KLATCH-REACHABLE bullets: (\d+) of (\d+)/m);
  const b = text.match(/of which behavioural \(not docs:\/internal:\/chore:\): (\d+)/);
  const g = text.match(/^GATE: (.*)$/m);
  return {
    denom: r ? +r[2] : (d ? +d[1] : null),
    reachable: r ? +r[1] : null,
    behavioural: b ? +b[1] : null,
    gate: g ? g[1] : '(none)',
  };
};

// ROUND 422 §2, TAKEN — the half of it that is about the cell's NAME. His BETA cell left the cell
// still *named* `drop-all-three-scope-legs` while dropping two, and my SUMMARY published its 24 in
// the slot reserved for 21, green, because the sentence was bound to the cell's name and not to
// what the cell did. So the dropped set is now MEASURED out of each cell's own source — which of
// the three scope anchors survive in it — and the published sentence names the measured set and is
// gated against the size of the class §1 censused.
const SCOPE_ANCHORS = { hasToolSurface: A_TOOL, hasModelsSurface: A_MODELS, hasStreamScope: A_STREAM_SCOPE };

const cellResults = {};
for (const [name, pairs] of CELLS_SPEC) {
  const src = pairs.length ? mutate(SRC, pairs, name) : SRC;
  if (src === null) { say(`  ${name}: SKIPPED — anchor miss`); cellResults[name] = null; continue; }
  const droppedLegs = Object.keys(SCOPE_ANCHORS).filter((k) => !src.includes(SCOPE_ANCHORS[k]));
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'cell.mjs');
  writeFileSync(file, src);
  // depth check per cell: the cell's own dirname must still be depth 3 under REPO.
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir is depth 3`, false, dir); continue; }
  const r = spawnSync('node', [file, CHANGELOG], { cwd: dir, encoding: 'utf8', timeout: 300000 });
  const text = (r.stdout || '') + (r.stderr || '');
  const m = read(text);
  cellResults[name] = { ...m, exit: r.status, droppedLegs };
  say(`  ${name.padEnd(28)} denom ${String(m.denom).padStart(4)} | reachable ${String(m.reachable).padStart(3)} | behavioural ${String(m.behavioural).padStart(3)} | exit ${r.status} | GATE ${m.gate.slice(0, 40)}`);
  say(`${' '.repeat(30)}scope legs this cell actually dropped (measured from its source): ${droppedLegs.join(', ') || '(none)'}`);
}

// ROUND 422 §2, the other half: `read()` returns null when its regex misses, and the one gate
// touching the census-only figure was `all3.behavioural <= t.behavioural` — an inequality, not a
// value. His GAMMA cell reworded the behavioural print line so `read()` missed; the expression
// became `null <= 24`, which JavaScript coerces to `0 <= 24`, and the whole instrument published
// `behavioural null` green. Every figure this instrument publishes is now (a) gated non-null
// before it is read and (b) bound to a `predict()` on its VALUE (Rounds 393/395/409: refuse with
// null, gate the figure on the key, and never print a refusable value beside a guard on identity).
const FIGURE_CELLS = ['baseline', 'drop-tools-scope', 'drop-models-scope', 'drop-streaming-scope',
  'drop-all-three-scope-legs', 'event-key-with-i-flag'];
say('');
for (const n of FIGURE_CELLS) {
  const c = cellResults[n];
  gate(`[${n}] read() returned a number for every figure this instrument publishes`,
    !!c && c.denom !== null && c.reachable !== null && c.behavioural !== null,
    c ? `denom=${c.denom} reachable=${c.reachable} behavioural=${c.behavioural}` : 'cell did not run');
}

// --- the baseline must reproduce my published figures FIRST -----------------
say('');
say('## 4. Baseline reproduces my published key before any counterfactual is believed');
say('');
const base = cellResults['baseline'];
predict('my published denominator', 191, base && base.denom);
predict('my published KLATCH-REACHABLE', 32, base && base.reachable);
predict('my published behavioural', 29, base && base.behavioural);
predict('the baseline cell is green', 'true', base && base.gate);
gate('the baseline reproduces 191/32/29 — without this, no cell below means anything',
  base && base.denom === 191 && base.reachable === 32 && base.behavioural === 29,
  base ? `${base.denom}/${base.reachable}/${base.behavioural}` : 'baseline did not run');

// --- his number, reproduced -------------------------------------------------
say('');
say('## 5. His 27/24, and the two legs he did not report');
say('');
const t = cellResults['drop-tools-scope'];
predict('his "32 -> 27 reachable" when the tools: scope leg is dropped', 27, t && t.reachable);
predict('his "29 -> 24 behavioural" when the tools: scope leg is dropped', 24, t && t.behavioural);

const mo = cellResults['drop-models-scope'];
const st = cellResults['drop-streaming-scope'];
const all3 = cellResults['drop-all-three-scope-legs'];
say('');
say('  what each scope leg is worth, as a delta on the behavioural figure:');
for (const [label, c] of [['tools: (his)', t], ['models:', mo], ['streaming:', st], ['all three', all3]]) {
  if (!c || base == null) { say(`    ${label.padEnd(14)} (cell did not run)`); continue; }
  say(`    ${label.padEnd(14)} behavioural ${base.behavioural} -> ${c.behavioural}   (${c.behavioural - base.behavioural >= 0 ? '+' : ''}${c.behavioural - base.behavioural})`);
}
// Each of these three was `say()`-only in the spelling he graded. They are the figures the memo
// publishes as findings, so they are predicted on their VALUE here.
predict('the streaming: scope leg dropped -> behavioural', 26, st && st.behavioural);
predict('the models: scope leg dropped -> behavioural (the leg is worth nothing)', 29, mo && mo.behavioural);
predict('all three scope legs dropped -> the census-only behavioural figure', 21, all3 && all3.behavioural);
predict('…and `models:` is worth exactly 0, so the figure is not a sum of three non-zero legs',
  0, mo && base ? mo.behavioural - base.behavioural : null);
// The census-only cell must have dropped the whole censused class — measured from its source, not
// taken from its name. This is the gate his BETA cell walked through.
gate('the census-only cell dropped exactly the inclusion scope legs §1 censused',
  !!all3 && JSON.stringify([...all3.droppedLegs].sort()) === JSON.stringify([...INCLUSION_SCOPE_LEGS].sort()),
  all3 ? `dropped [${[...all3.droppedLegs].sort().join(', ')}] vs censused [${[...INCLUSION_SCOPE_LEGS].sort().join(', ')}]` : 'cell missing');
gate('his cell dropped exactly the one leg he reported, and no other',
  !!t && JSON.stringify(t.droppedLegs) === JSON.stringify(['hasToolSurface']),
  t ? `dropped [${t.droppedLegs.join(', ')}]` : 'cell missing');
gate('the baseline cell dropped nothing (its figures are my published key, unmutated)',
  !!base && base.droppedLegs.length === 0, base ? `dropped [${base.droppedLegs.join(', ')}]` : 'cell missing');
// CONTROL: a cell that changes nothing must not move the figure — otherwise the harness, not the
// leg, is moving numbers (Round 411: one control cannot grade two things; this one grades the rig).
gate('CONTROL: the baseline and the committed instrument agree, so the rig moves no number',
  base && base.reachable === 32, base ? `rig baseline ${base.reachable}` : 'n/a');

// --- §4's measured effect ----------------------------------------------------
say('');
say('## 6. §4 — what the `i` flag actually does to the figure');
say('');
const ev = cellResults['event-key-with-i-flag'];
if (ev && base) {
  say(`  reachable  ${base.reachable} -> ${ev.reachable}`);
  say(`  behavioural ${base.behavioural} -> ${ev.behavioural}`);
}
predict('an i flag on hasEventName moves the behavioural figure UP (his near-miss is real)',
  true, !!(ev && base && ev.behavioural > base.behavioural));

say('');
rmSync(CELLS, { recursive: true, force: true });
// My first spelling of this gate keyed on `git status --porcelain docs/research` and went red on
// THIS instrument's own two new files — a false positive in a hygiene check, which is the Round
// 351 shape: a triage instrument that cries wolf produces no work at all. The real hazards are
// (a) a cell surviving the run and (b) the instrument under test having been mutated in place
// instead of in a copy. Those are what is keyed now.
gate('the cell tree was removed', !existsSync(CELLS), CELLS);
const dirty = spawnSync('git', ['-C', REPO, 'diff', '--stat', '--', INSTR_REL], { encoding: 'utf8' }).stdout.trim();
gate('the instrument under test was NOT mutated in place (every cell was a copy)',
  dirty === '', dirty || '(unmodified)');
const strayCells = spawnSync('git', ['-C', REPO, 'status', '--porcelain', '--', 'docs/research'],
  { encoding: 'utf8' }).stdout.trim().split('\n').filter((l) => /cell/i.test(l));
gate('no cell file leaked into docs/research', strayCells.length === 0, strayCells.join(' | ') || '(none)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
say(`  his §3 instance reproduces: 29 -> ${t ? t.behavioural : '?'} when the ${t ? t.droppedLegs.join('+') : '?'} leg goes`);
say(`  the mechanism is live in ${INCLUSION_SCOPE_LEGS.length} inclusion legs (a FLOOR, over ` +
  `${subjects.length - unresolved.length} of ${subjects.length} resolvable subjects): ${INCLUSION_SCOPE_LEGS.join(', ')}`);
// The sentence names the legs the cell MEASURABLY dropped, so a cell that drops a different set
// cannot publish its figure in this slot (Round 422 §2 BETA).
say(`  census-only, dropping the ${all3 ? all3.droppedLegs.length : '?'} legs ` +
  `[${all3 ? [...all3.droppedLegs].sort().join(', ') : '?'}]: behavioural ${all3 ? all3.behavioural : '?'}`);
say(`  his §4 i-flag near-miss: behavioural ${base ? base.behavioural : '?'} -> ${ev ? ev.behavioural : '?'} with the flag`);

writeFileSync(path.join(import.meta.dirname, 'scope-label-legs-are-a-class-of-three.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
