#!/usr/bin/env node
/**
 * Round 422 §3 — his scope-label census reads the DEFINITION LINE, so 2 of its 10 subjects cannot
 * be found scope-keyed no matter what their pattern is. His answer of "three inclusion legs" is
 * right; it is right by luck for two of the ten.
 *
 * THE MECHANISM. `scope-label-legs-are-a-class-of-three.mjs` censuses scope-label legs like this:
 *
 *     line  96  keyLines  = source lines matching a `const hasX = (l) =>` declaration
 *     line 101  hasScope  = a regex for the literal text `^\s*\*\s+\*\*`, tested against `l`
 *                           — and `l` is the DEFINITION LINE's own source text
 *
 * So the evidence is the text of one line. Two of his ten keys do not carry their pattern on that
 * line at all, and his own §2 output says so in a different section without connecting it to §1:
 *
 *     hasStreamLifecycle   pattern hoisted to `const LIFECYCLE_RE = …` on the PREVIOUS line
 *     hasEventName         pattern built at runtime from `events.keys()`
 *
 * His §2 prints both as "flags: (built with new RegExp)" and his §1 prints both as "scope-label
 * leg: no". The second of those is not a measurement — it is what the key returns for any input.
 *
 * WHY THIS IS NOT A NITPICK. It is the load-bearing selector under two published claims: "the
 * mechanism is live in 3 INCLUSION legs" and, through the cells it motivates, the census-only
 * ceiling of 21. A census that cannot see 2 of its 10 subjects can only ever report a floor on the
 * class size. He was careful about this exact failure one layer down — Round 421 §2 keys the needle
 * on the CALL SHAPE "rather than the path string" because a path-string key still matches a
 * correctly repaired file. The same correction applies to his own census: the property is "this key
 * anchors a scope label", and the line the key is declared on is not where that property lives.
 *
 * HOW IT IS GRADED — a CONFUSION MATRIX, not a known positive (Round 418: a separating key needs
 * one; and 364: a known positive must carry the property, not an analogy). Two cells carry the
 * IDENTICAL property and differ only in WHERE it sits:
 *
 *   KP-HOISTED   `**lifecycle:**` added as an alternative inside `LIFECYCLE_RE` (the hoisted
 *                constant)                       -> predict his census MISSES it: still 3 legs,
 *                                                    still GATE true, still 9 landed, exit 0
 *   CONTROL-INLINE  the same `**lifecycle:**` alternative added to the `hasStreamLifecycle`
 *                DEFINITION LINE instead         -> predict his census CATCHES it: 4 legs, his
 *                                                    own predict() REFUTES, exit 1
 *
 * If both were missed, the finding would be "his regex is wrong" — a different, weaker claim. If
 * both were caught, there is no finding. Only the pair separates POSITION from PROPERTY, which is
 * what the charge is actually about.
 *
 * The scope label is chosen to be inert: no `**lifecycle:**` bullet exists in the changelog, so the
 * property is present while every figure stays put. His own baseline gate (191/32/29) is the check
 * on that, and it is read back from each cell rather than assumed.
 *
 * ALSO REPORTED, static: `SCOPE_SHAPE` at his line 93 and `scopeLegs` at his line 98 are dead —
 * `scopeLegs` is assigned and never read, and the comment above them at lines 91-92 ("Keyed on
 * that shape over the source, so the census finds legs I did not think to list") describes the
 * dead regex, not the live one. The dead regex is also a /g literal driven by `.test()`, whose
 * `lastIndex` advances between calls, so had it been live in a `.filter()` over 10 lines it would
 * have skipped alternate matches. Both facts are derived from his source here, not asserted.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const HIS_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';
const HIS_REV = '5bf46753';
const GRADED_REL = 'docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs';
const KPDIR = path.join(REPO, '.testdata', 'round422kp');          // holds the mutated subjects
const CELLS = path.join(REPO, '.testdata', 'round422kpcells');      // depth-2; cells are depth-3

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
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

say('# Round 422 §3 — what his scope-label census is structurally unable to see');
say('');
say(`REPO: ${REPO}`);
say(`my HEAD: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`his instrument from commit ${HIS_REV}; the instrument it censuses from the working tree`);
say(`driven at: ${new Date().toISOString()}`);
say('');

const HIS = git('show', `${HIS_REV}:${HIS_REL}`).stdout;
const GRADED = readFileSync(path.join(REPO, GRADED_REL), 'utf8');
gate('his instrument was extracted from his commit, non-empty', HIS.length > 0, `${HIS.length}B`);
gate('the instrument he censuses is present', GRADED.length > 0, `${GRADED.length}B`);
gate('a cell DIRECTORY is depth 3 under REPO',
  path.resolve(path.join(CELLS, 'x'), '../../..') === REPO);
if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.join('; ')}`); process.exit(2); }

// --- 1. the blindness, derived from his source before any cell is driven ------
say('');
say('## 1. Which of his ten subjects declare their pattern on their own definition line');
say('');
// His own keyLines selector, taken from his source rather than retyped (408/412). Pinned: if he
// ever respells it, this instrument refuses instead of silently censusing something else.
const HIS_KEYLINE_KEY = `.filter(({ l }) => /^const has[A-Z]\\w* = \\(l\\) =>/.test(l) || /^const is[A-Z]\\w* = \\(l\\) =>/.test(l));`;
gate('his keyLines selector is in his source exactly once (so the pin below is on HIS key)',
  HIS.split(HIS_KEYLINE_KEY).length - 1 === 1, `occurs=${HIS.split(HIS_KEYLINE_KEY).length - 1}`);
const HIS_SCOPE_KEY = `/\\^\\\\s\\*\\\\\\*\\\\s\\+\\\\\\*\\\\\\*/.test(l)`;
say(`  his scope-label test, as it appears in his source: occurs ${HIS.split(HIS_SCOPE_KEY).length - 1}x`);
gate('his scope-label test reads a single line variable `l` and occurs more than once (§1 and the '
  + 'scopeKeyed re-filter)', HIS.split(HIS_SCOPE_KEY).length - 1 >= 2,
  `occurs=${HIS.split(HIS_SCOPE_KEY).length - 1}`);

const keyLines = GRADED.split('\n').map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => /^const has[A-Z]\w* = \(l\) =>/.test(l) || /^const is[A-Z]\w* = \(l\) =>/.test(l));
say(`  his census subjects: ${keyLines.length}`);
const noLiteralOnOwnLine = [];
for (const { n, l } of keyLines) {
  const name = l.match(/^const (\w+)/)[1];
  // Does the definition line carry a regex LITERAL at all? If not, no line-text key can ever read
  // this subject's pattern — whatever that pattern is.
  const hasLiteral = /=>\s*(?:\/(?:[^/\\\n]|\\.)+\/[a-z]*|\[[\s\S]*new RegExp)/.test(l) && /\/(?:[^/\\\n]|\\.)+\/[a-z]*/.test(l);
  if (!hasLiteral) noLiteralOnOwnLine.push(name);
  say(`    line ${String(n).padStart(3)}  ${name.padEnd(20)} regex literal on its own line: ${hasLiteral ? 'yes' : 'NO  <- his line-text key is blind here'}`);
}
say('');
say(`  subjects his line-text key cannot read: ${noLiteralOnOwnLine.join(', ') || '(none)'}`);
predict('exactly two of his ten subjects declare no regex literal on their own definition line',
  ['hasEventName', 'hasStreamLifecycle'], noLiteralOnOwnLine);
gate('CONTROL: this key is not simply calling every subject unreadable',
  noLiteralOnOwnLine.length > 0 && noLiteralOnOwnLine.length < keyLines.length,
  `${noLiteralOnOwnLine.length} of ${keyLines.length}`);
// And his own §2 section already knows it, in a section that never feeds §1's census.
predict('his own published .out reports those same two as "(built with new RegExp)" in §2',
  true, /hasEventName +flags: \(built with new RegExp\)/.test(git('show', `${HIS_REV}:docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.out`).stdout)
    && /hasStreamLifecycle +flags: \(built with new RegExp\)/.test(git('show', `${HIS_REV}:docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.out`).stdout));

// --- 2. the dead regex, also derived -----------------------------------------
say('');
say('## 2. His line 93/98 SCOPE_SHAPE and scopeLegs: assigned, never read');
say('');
const nScopeShape = (HIS.match(/\bSCOPE_SHAPE\b/g) || []).length;
const nScopeLegs = (HIS.match(/\bscopeLegs\b/g) || []).length;
say(`  identifier SCOPE_SHAPE occurs ${nScopeShape}x · scopeLegs occurs ${nScopeLegs}x in his source`);
predict('scopeLegs is declared once and read zero times (dead)', 1, nScopeLegs);
predict('SCOPE_SHAPE is read only by that dead line', 2, nScopeShape);
const scopeShapeDecl = (HIS.match(/^const SCOPE_SHAPE = .*$/m) || [, ''])[0];
say(`  its declaration: ${scopeShapeDecl}`);
predict('and it is a /g literal, whose lastIndex advances across .test() calls', true,
  /\/[a-z]*g[a-z]*;$/.test(scopeShapeDecl.trim()));
// Demonstrated, not asserted: the same /g literal driven by .test() over identical inputs.
const demo = new RegExp('a', 'g');
const alternates = [demo.test('a'), demo.test('a'), demo.test('a'), demo.test('a')];
say(`  a /g literal .test()ed four times on the same matching input: ${JSON.stringify(alternates)}`);
predict('…which alternates true/false on identical input', [true, false, true, false], alternates);

// --- 3. the confusion matrix --------------------------------------------------
say('');
say('## 3. The same property in two positions');
say('');
rmSync(KPDIR, { recursive: true, force: true });
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(KPDIR, { recursive: true });
mkdirSync(CELLS, { recursive: true });

const LIFE_RE_FROM = `const LIFECYCLE_RE = /\\babort(ed|s|ing)?\\b|close[sd]? streams?\\b|\\bunread\\b|\\bread to the end\\b|\\bretr(y|ies|ied)\\b|\\brequest timeout\\b/i;`;
const LIFE_RE_TO = `const LIFECYCLE_RE = /\\babort(ed|s|ing)?\\b|close[sd]? streams?\\b|\\bunread\\b|\\bread to the end\\b|\\bretr(y|ies|ied)\\b|\\brequest timeout\\b|^\\s*\\*\\s+\\*\\*lifecycle:\\*\\*/i;`;
const LIFE_DEF_FROM = `const hasStreamLifecycle = (l) => LIFECYCLE_RE.test(l);`;
const LIFE_DEF_TO = `const hasStreamLifecycle = (l) => LIFECYCLE_RE.test(l) || /^\\s*\\*\\s+\\*\\*lifecycle:\\*\\*/i.test(l);`;

gate('the hoisted-constant anchor occurs exactly once in the censused instrument',
  GRADED.split(LIFE_RE_FROM).length - 1 === 1, `occurs=${GRADED.split(LIFE_RE_FROM).length - 1}`);
gate('the definition-line anchor occurs exactly once in the censused instrument',
  GRADED.split(LIFE_DEF_FROM).length - 1 === 1, `occurs=${GRADED.split(LIFE_DEF_FROM).length - 1}`);
const INSTR_REL_FROM = `const INSTR_REL = 'docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs';`;
gate('his INSTR_REL declaration occurs exactly once in HIS source',
  HIS.split(INSTR_REL_FROM).length - 1 === 1, `occurs=${HIS.split(INSTR_REL_FROM).length - 1}`);
if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.join('; ')}`); process.exit(2); }

// Both subjects carry the IDENTICAL scope-label alternative. Only its position differs.
const SUBJECTS = [
  ['KP-HOISTED', GRADED.split(LIFE_RE_FROM).join(LIFE_RE_TO), false],
  ['CONTROL-INLINE', GRADED.split(LIFE_DEF_FROM).join(LIFE_DEF_TO), true],
];
// Sanity: each mutant must actually differ from the original, and must differ from the other.
gate('the two mutants differ from the original and from each other',
  SUBJECTS[0][1] !== GRADED && SUBJECTS[1][1] !== GRADED && SUBJECTS[0][1] !== SUBJECTS[1][1]);
// And both really do carry the property, keyed on the scope-label text appearing anywhere in the
// subject's source — the property, stated independently of his key (364).
for (const [name, src] of SUBJECTS) {
  gate(`[${name}] carries the \`**lifecycle:**\` scope-label alternative somewhere in its source`,
    src.includes('\\*\\*lifecycle:\\*\\*'), 'property present');
}

const results = {};
for (const [name, src, expectCaught] of SUBJECTS) {
  const subjRel = path.posix.join('.testdata', 'round422kp', `${name}.mjs`);
  writeFileSync(path.join(REPO, subjRel), src);
  // Point HIS instrument at the mutated subject. Nothing else of his is changed.
  const hisSrc = HIS.split(INSTR_REL_FROM).join(`const INSTR_REL = '${subjRel}';`);
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir depth 3`, false, dir); continue; }
  const file = path.join(dir, 'his.mjs');
  writeFileSync(file, hisSrc);
  const r = spawnSync('node', [file], { cwd: dir, encoding: 'utf8', timeout: 900000 });
  const text = (r.stdout || '') + (r.stderr || '');
  const legs = (text.match(/^ {2}scope-label-keyed legs: (.*)$/m) || [, '(none)'])[1];
  const lifeRow = (text.match(/^ {4}line +\d+ +hasStreamLifecycle +scope-label leg: (\S+)/m) || [, '(none)'])[1];
  const mechPred = (text.match(/^ {2}\[PRED\] (LANDED|REFUTED) +the scope-label mechanism is live in 3 INCLUSION legs.*$/m) || [, '(none)'])[1];
  results[name] = {
    exit: r.status, expectCaught,
    legs,
    lifecycleRow: lifeRow,
    mechanismPred: mechPred,
    baseline: (text.match(/^ {2}baseline +denom +(\d+) \| reachable +(\d+) \| behavioural +(\d+)/m) || []).slice(1, 4).join('/') || '(none)',
    gate: (text.match(/^GATE: (.*)$/m) || [, '(none)'])[1],
    preds: (text.match(/^PREDICTIONS: (.*)$/m) || [, '(none)'])[1],
  };
  const R = results[name];
  say(`  ${name}`);
  say(`      his §1 row for hasStreamLifecycle:  scope-label leg: ${R.lifecycleRow}`);
  say(`      his scope-label-keyed legs:         ${R.legs}`);
  say(`      his own 3-leg prediction:           ${R.mechanismPred}`);
  say(`      his baseline denom/reach/behav:     ${R.baseline}`);
  say(`      exit ${R.exit} | GATE ${R.gate.slice(0, 46)} | PREDICTIONS ${R.preds}`);
}

// --- 4. does position decide? -------------------------------------------------
say('');
say('## 4. The matrix');
say('');
const KP = results['KP-HOISTED'], CT = results['CONTROL-INLINE'];
// The inert-label check FIRST: if the figures moved, the two cells are not comparable and the
// matrix means nothing (Round 344/347 — assert the counterfactual changed only what it meant to).
gate('the scope label is inert: both subjects still produce his baseline 191/32/29, so position '
  + 'is the ONLY difference between the two cells',
  KP && CT && KP.baseline === '191/32/29' && CT.baseline === '191/32/29',
  KP && CT ? `KP ${KP.baseline} · CONTROL ${CT.baseline}` : 'a cell did not run');

predict('KP-HOISTED: his census MISSES the property — hasStreamLifecycle still "no"',
  'no', KP && KP.lifecycleRow);
predict('KP-HOISTED: …so his 3-leg prediction still LANDS', 'LANDED', KP && KP.mechanismPred);
predict('KP-HOISTED: …and his instrument is green end to end', ['true', '9 landed, 0 refuted', 0],
  KP ? [KP.gate, KP.preds, KP.exit] : null);

predict('CONTROL-INLINE: the identical property on the definition line IS caught',
  'YES', CT && CT.lifecycleRow);
predict('CONTROL-INLINE: …so his own 3-leg prediction REFUTES', 'REFUTED', CT && CT.mechanismPred);
predict('CONTROL-INLINE: …and his instrument exits non-zero', true, !!(CT && CT.exit !== 0));

gate('THE DISCRIMINATOR: the same scope-label alternative is invisible when hoisted and visible '
  + 'when inline, so his census keys on POSITION, not on the property it names',
  KP && CT && KP.lifecycleRow === 'no' && CT.lifecycleRow === 'YES'
  && KP.mechanismPred === 'LANDED' && CT.mechanismPred === 'REFUTED',
  KP && CT ? `hoisted:${KP.lifecycleRow}/${KP.mechanismPred} · inline:${CT.lifecycleRow}/${CT.mechanismPred}` : 'a cell did not run');

// --- hygiene ------------------------------------------------------------------
say('');
rmSync(KPDIR, { recursive: true, force: true });
rmSync(CELLS, { recursive: true, force: true });
gate('the subject and cell trees were removed', !existsSync(KPDIR) && !existsSync(CELLS));
for (const d of ['docs/research/round421-instruments', 'docs/research/round419-instruments']) {
  const dirty = git('status', '--porcelain', '--', d).stdout.trim();
  gate(`${d} untouched by this drive`, dirty === '', dirty || '(clean)');
}

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
say(`  subjects his line-text census cannot read:  ${noLiteralOnOwnLine.join(', ')}  (${noLiteralOnOwnLine.length} of ${keyLines.length})`);
say(`  property hoisted into a constant:           his census says "${KP ? KP.lifecycleRow : '?'}", his own prediction ${KP ? KP.mechanismPred : '?'}, exit ${KP ? KP.exit : '?'}`);
say(`  identical property on the definition line:  his census says "${CT ? CT.lifecycleRow : '?'}", his own prediction ${CT ? CT.mechanismPred : '?'}, exit ${CT ? CT.exit : '?'}`);
say(`  => his "three inclusion legs" is a FLOOR on the class, not a count of it.`);
writeFileSync(path.join(import.meta.dirname, 'his-scope-census-cannot-see-a-hoisted-pattern.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
