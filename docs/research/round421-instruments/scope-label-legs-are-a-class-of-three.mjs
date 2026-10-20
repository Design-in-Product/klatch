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
// A scope-label leg is one whose pattern anchors a markdown bullet with a **word:** scope. Keyed
// on that shape over the source, so the census finds legs I did not think to list.
const SCOPE_SHAPE = /\^\\s\*\\\*\\s\+\\\*\\\*[a-z?|]+:\\\*\\\*/g;
const keyLines = SRC.split('\n')
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => /^const has[A-Z]\w* = \(l\) =>/.test(l) || /^const is[A-Z]\w* = \(l\) =>/.test(l));
say(`  bucket-key definitions found in source: ${keyLines.length}`);
const scopeLegs = keyLines.filter(({ l }) => SCOPE_SHAPE.test(l.replace(/\\\\/g, '\\')) || /\\\*\\\*\(?\w/.test(l));
for (const { n, l } of keyLines) {
  const name = l.match(/^const (\w+)/)[1];
  const hasScope = /\^\\s\*\\\*\\s\+\\\*\\\*/.test(l);
  const soleLeg = hasScope && !/\|/.test(l.replace(/\(docs\|internal\|chore\|ci\|test\|build\|deps\|readme\)[^)]*/, 'X'));
  say(`    line ${String(n).padStart(3)}  ${name.padEnd(20)} scope-label leg: ${hasScope ? 'YES' : 'no '}${hasScope ? (soleLeg ? '  (its ONLY leg)' : '  (first of several)') : ''}`);
}
const scopeKeyed = keyLines.filter(({ l }) => /\^\\s\*\\\*\\s\+\\\*\\\*/.test(l)).map(({ l }) => l.match(/^const (\w+)/)[1]);
say('');
say(`  scope-label-keyed legs: ${scopeKeyed.join(', ')}`);
// His report named one. The census finds how many there are. isNonBehavioural is scope-keyed too,
// but it is an EXCLUSION — a scope label is the right evidence for "this entry is docs:", because
// the claim being made there is about the changelog's own taxonomy, not about Klatch's surface.
const INCLUSION_SCOPE_LEGS = scopeKeyed.filter((n) => n !== 'isNonBehavioural');
predict('the scope-label mechanism is live in 3 INCLUSION legs, not the 1 he reported',
  ['hasStreamScope', 'hasToolSurface', 'hasModelsSurface'], INCLUSION_SCOPE_LEGS);
gate('CONTROL: the census did not simply return every key', keyLines.length > scopeKeyed.length,
  `${scopeKeyed.length} scope-keyed of ${keyLines.length} keys`);

// --- §4: the i-flag asymmetry, read off source ------------------------------
say('');
say('## 2. §4 — the one key without an `i` flag, and the precedence under it');
say('');
const flagged = keyLines.map(({ n, l }) => {
  const name = l.match(/^const (\w+)/)[1];
  const re = l.match(/\/(?:[^/\\\n]|\\.)+\/([a-z]*)/);
  return { n, name, flags: re ? re[1] : '(built with new RegExp)' };
});
for (const f of flagged) say(`    line ${String(f.n).padStart(3)}  ${f.name.padEnd(20)} flags: ${f.flags || '(none)'}`);
const noI = flagged.filter((f) => !/i/.test(f.flags) && f.flags !== '(built with new RegExp)');
say('');
say(`  literal-regex keys WITHOUT an i flag: ${noI.map((f) => f.name).join(', ') || '(none)'}`);
say(`  keys built with new RegExp (flags not visible in the literal): ${flagged.filter((f) => f.flags === '(built with new RegExp)').map((f) => f.name).join(', ') || '(none)'}`);
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

const cellResults = {};
for (const [name, pairs] of CELLS_SPEC) {
  const src = pairs.length ? mutate(SRC, pairs, name) : SRC;
  if (src === null) { say(`  ${name}: SKIPPED — anchor miss`); cellResults[name] = null; continue; }
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'cell.mjs');
  writeFileSync(file, src);
  // depth check per cell: the cell's own dirname must still be depth 3 under REPO.
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir is depth 3`, false, dir); continue; }
  const r = spawnSync('node', [file, CHANGELOG], { cwd: dir, encoding: 'utf8', timeout: 300000 });
  const text = (r.stdout || '') + (r.stderr || '');
  const m = read(text);
  cellResults[name] = { ...m, exit: r.status };
  say(`  ${name.padEnd(28)} denom ${String(m.denom).padStart(4)} | reachable ${String(m.reachable).padStart(3)} | behavioural ${String(m.behavioural).padStart(3)} | exit ${r.status} | GATE ${m.gate.slice(0, 40)}`);
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
gate('dropping all three scope legs is at least as large a move as dropping his one',
  all3 && t && all3.behavioural <= t.behavioural, all3 && t ? `all3=${all3.behavioural} tools-only=${t.behavioural}` : 'cell missing');
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
say(`  his §3 instance reproduces: 29 -> ${t ? t.behavioural : '?'} when the tools: scope leg goes`);
say(`  the mechanism is live in ${INCLUSION_SCOPE_LEGS.length} inclusion legs: ${INCLUSION_SCOPE_LEGS.join(', ')}`);
say(`  census-only (all three scope legs dropped): behavioural ${all3 ? all3.behavioural : '?'}`);
say(`  his §4 i-flag near-miss: behavioural ${base ? base.behavioural : '?'} -> ${ev ? ev.behavioural : '?'} with the flag`);

writeFileSync(path.join(import.meta.dirname, 'scope-label-legs-are-a-class-of-three.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
