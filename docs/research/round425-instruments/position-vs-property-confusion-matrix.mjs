#!/usr/bin/env node
/**
 * Round 425 — the confusion matrix I owed for the §3 cure, and Theseus's Round 424 §3 reproduced.
 *
 * WHAT WAS OWED. Theseus's Round 422 §3 charge was that my scope-label census was keyed on the
 * DECLARATION LINE, so a key whose pattern is hoisted into a `const …_RE = /…/` above it was
 * unfindable — 2 of 10 subjects. He was also right that one cell cannot grade the cure: a single
 * fixture conflates POSITION (where the pattern sits) with PROPERTY (whether the pattern anchors a
 * `**word:**` scope). It needs a confusion matrix. I applied the cure in Round 423 (`resolvePattern`
 * follows a hoisted identifier and REFUSES on a runtime-built pattern) and shipped it described as
 * applied-and-reasoned, never as graded, with the fire window as the named blocker. This is it.
 *
 * THE MATRIX. Two axes, four cells, one inert scope label that exists nowhere in the product:
 *
 *                       | pattern anchors `**cellscope:**` | pattern has no `**…:**` anchor
 *   --------------------+----------------------------------+-------------------------------
 *   literal INLINE      | must be YES                      | must be no
 *   literal HOISTED     | must be YES  <-- the cured cell  | must be no
 *
 * Property-keyed means the left column agrees across rows and the right column agrees across rows.
 * Position-keyed means the hoisted/anchored cell disagrees with the inline/anchored one. The
 * right-hand column is the control the matrix needs: a key that answered YES to everything would
 * satisfy the left column by accident.
 *
 * BOTH KEYS ARE SLICED FROM SOURCE, NEVER RE-TYPED (Rounds 408/412: a hand-typed reader is not a
 * slice, and the last time one of us hand-copied the other's key it disagreed with its owner about
 * one of his own movers). The CURED key is sliced out of the live instrument as one contiguous
 * region and evaluated with `SRC` as a parameter. The OLD key is sliced out of the newest rev of
 * that same file whose blob carries the position-keyed token — derived by PROPERTY, with a refusal
 * if no rev carries it, because the cure and this grader are commits of the same week and a
 * `git show HEAD:` would hand me the cured text back (Rounds 420/422).
 *
 * ALSO HERE: his Round 424 §3, which I am not taking on his word. `RE_LITERAL` is non-global and
 * the hoisted branch is only reached when there is no inline literal at all, so a body carrying two
 * patterns is classified on its first alone. Reproduced as its own pair of cells (identical pair of
 * patterns, order swapped), and his "0 of 10 live" re-measured over the live population with the
 * instrument's own `keyLines`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const S_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';

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

say('# Round 425 — position vs property: the confusion matrix the §3 cure was owed');
say('');
say(`REPO: ${REPO}`);
say(`HEAD at open: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`subject: ${S_REL}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

const SRC = readFileSync(path.join(REPO, S_REL), 'utf8');

// --- slice the CURED key out of the live file -------------------------------
say('## 1. The two keys, sliced out of source');
say('');
const CURED_SLICE_RE = /^const RE_LITERAL = [\s\S]*?\.test\(l\)\);$/m;
const curedSlice = (SRC.match(CURED_SLICE_RE) || [null])[0];
gate('the cured key sliced out of the live instrument as one contiguous region',
  curedSlice !== null, curedSlice === null ? '(no match)' : `${curedSlice.split('\n').length} lines, ${curedSlice.length} bytes`);
for (const needle of ['const resolvePattern = (body) =>', 'const SCOPE_IN_PATTERN =', 'const keyLines = SRC.split']) {
  gate(`…and the slice carries \`${needle}\``, curedSlice !== null && curedSlice.includes(needle));
}

// --- derive the OLD key by property, from the newest rev that carries it ----
// The position-keyed token, as it appeared in the pre-cure spelling. Keyed on the CALL shape
// (`.test(l)` over the declaration line), not on a line number (Rounds 357/375).
const OLD_TOKEN = 'const hasScope = /\\^\\\\s\\*\\\\\\*\\\\s\\+\\\\\\*\\\\\\*/.test(l);';
const history = git('log', '--format=%H', '--', S_REL).stdout.trim().split('\n').filter(Boolean);
const carriers = history.filter((r) => git('show', `${r}:${S_REL}`).stdout.includes(OLD_TOKEN));
const PRE_CURE = carriers.length ? carriers[0] : null;
say(`  the subject's rev history (newest first): ${history.map((r) => r.slice(0, 8)).join(', ') || '(none)'}`);
say(`  revs whose blob carries the position-keyed token: ${carriers.map((r) => r.slice(0, 8)).join(', ') || '(none)'}`);
say(`  PRE_CURE (derived, the OLD key's source): ${PRE_CURE ? PRE_CURE.slice(0, 8) : 'REFUSED (null)'}`);
gate('a rev carries the position-keyed token (there IS an old key to grade)', PRE_CURE !== null,
  `${carriers.length} of ${history.length} revs carry it`);
gate('the NEWEST rev does NOT carry it (the cure has landed and is committed)',
  history.length > 0 && !carriers.includes(history[0]), `newest=${history[0]?.slice(0, 8) ?? '(none)'}`);
if (PRE_CURE === null || curedSlice === null) {
  say('');
  say(`GATE: FALSE (${fails.join('; ')})`);
  say('SUMMARY: REFUSED — one of the two keys could not be sliced, and I will not re-type it by hand');
  writeFileSync(path.join(import.meta.dirname, 'position-vs-property-confusion-matrix.out'), out.join('\n') + '\n');
  process.exit(2);
}
const OLD_SRC = git('show', `${PRE_CURE}:${S_REL}`).stdout;
const oldSlice = (OLD_SRC.match(/^\s*const hasScope = .*\.test\(l\);$/m) || [null])[0];
gate('the OLD key sliced out of the derived rev', oldSlice !== null, (oldSlice || '(no match)').trim());
say(`  OLD key:   ${(oldSlice || '').trim()}`);
say(`  CURED key: resolvePattern() + SCOPE_IN_PATTERN, ${curedSlice.split('\n').length} lines as sliced`);

// Both keys as callables over a synthetic source. The cured one needs SRC in scope because
// `declOf` resolves a hoisted identifier against the whole file.
// CURED (Round 428) — THE CLASSIFIER IS SLICED OUT OF THE SUBJECT TOO, not re-typed here.
// This line used to read `pat.src === null ? null : SCOPE_IN_PATTERN.test(pat.src)`: a hand-typed
// copy of the subject's own `const hasScope = …`. The §6 cure of this same fire changed the
// subject's classifier to a disjunction over `pat.srcs`, and THIS FILE WENT ON PUBLISHING
// `anchor SECOND → cured false … REPRODUCES in my rig, and is LATENT` with GATE true — green, and
// false about the live subject, because it was reading its own stale copy of the key rather than
// the key. Exactly the class Theseus charged in his §3, found on myself by driving my own cure.
// Sliced, and gated to carry the disjunction so a silent revert reddens here.
const CLASSIFIER_RE = /^ {2}const hasScope = ([\s\S]*?);$/m;
const classifierOf = (src, where) => {
  const m = src.match(CLASSIFIER_RE);
  gate(`the \`hasScope\` classifier was sliced out of ${where}, not re-typed in this file`,
    m !== null, m === null ? '(no match)' : m[1].replace(/\s+/g, ' ').slice(0, 86));
  return m === null ? null : new Function('pat', 'SCOPE_IN_PATTERN', `"use strict"; return (${m[1]});`);
};
const curedClassify = classifierOf(SRC, 'the live subject');
gate('…and the live classifier reads EVERY pattern in the body (`pat.srcs`), so a silent revert to '
  + 'the first-pattern spelling reddens here instead of being published as a reproduction',
  (SRC.match(CLASSIFIER_RE) || [, ''])[1].includes('pat.srcs'));
const keyWith = (slice, classify) => (src) => {
  const f = new Function('SRC', `${slice}\nreturn { resolvePattern, SCOPE_IN_PATTERN, keyLines };`);
  const { resolvePattern, SCOPE_IN_PATTERN, keyLines } = f(src);
  return keyLines.map(({ n, l }) => {
    const name = l.match(/^const (\w+)/)[1];
    const body = l.replace(/^const \w+ = \(l\) =>\s*/, '');
    const pat = resolvePattern(body);
    return { n, name, how: pat.how, hasScope: classify(pat, SCOPE_IN_PATTERN) };
  });
};
const curedKey = keyWith(curedSlice, curedClassify);
// The pre-§6 resolver, for the order pair below: the newest rev of the subject whose blob does NOT
// carry the disjunction. Derived by property, never typed and never `HEAD~1`.
const SIX_TOKEN = 'pat.srcs.some(';
const PRE_SIX = history.find((r) => !git('show', `${r}:${S_REL}`).stdout.includes(SIX_TOKEN)) ?? null;
gate('a rev of the subject predates the Round 428 §6 cure (there IS a first-pattern resolver to '
  + 'grade the cure against)', PRE_SIX !== null, PRE_SIX === null ? 'REFUSED (null)' : PRE_SIX.slice(0, 8));
const PRE_SIX_SRC = PRE_SIX === null ? '' : git('show', `${PRE_SIX}:${S_REL}`).stdout;
const preSixSlice = (PRE_SIX_SRC.match(CURED_SLICE_RE) || [null])[0];
gate('…and the first-pattern resolver sliced out of it as one contiguous region', preSixSlice !== null,
  preSixSlice === null ? '(no match)' : `${preSixSlice.split('\n').length} lines`);
const preSixClassify = PRE_SIX === null ? null : classifierOf(PRE_SIX_SRC, `${PRE_SIX.slice(0, 8)} (pre-§6)`);
const preSixKey = preSixSlice !== null && preSixClassify !== null ? keyWith(preSixSlice, preSixClassify) : null;
// CURED (Round 428, his Round 426 §3, second half): this file's §3 header claims *both keys are
// sliced from source, never re-typed*. The old key is a PAIR — a SELECTOR (which lines are
// subjects) and a CLASSIFIER (`hasScope`) — and only the classifier was sliced; the selector was
// typed here. He measured the typed one byte-identical to `5bf46753`'s, so no figure had moved —
// latent, and the header was stronger than the code. Now the selector is sliced out of the same
// derived rev as the classifier, and asserted to occur there exactly once, so the header is true
// of the code rather than of this tree.
const OLD_SELECTOR_RE = /^const keyLines = SRC\.split\('\\n'\)\n(?:.*\n)*?.*\.test\(l\)\);$/m;
const oldSelector = (OLD_SRC.match(OLD_SELECTOR_RE) || [null])[0];
gate('the OLD key\'s SELECTOR was sliced out of the derived rev too, not typed in this file',
  oldSelector !== null, oldSelector === null ? '(no match)' : `${oldSelector.split('\n').length} lines, ${oldSelector.length} bytes`);
gate('…and it occurs in that rev exactly once',
  oldSelector !== null && OLD_SRC.split(oldSelector).length - 1 === 1,
  `occurs=${oldSelector === null ? -1 : OLD_SRC.split(oldSelector).length - 1}`);
const oldSelect = (src) => (oldSelector === null ? null
  : new Function('SRC', `${oldSelector}\nreturn keyLines;`)(src));
gate('KNOWN POSITIVE: the sliced OLD selector finds exactly one key in a synthetic one-key source',
  (oldSelect('const hasKP = (l) => /x/.test(l);\nconst notAKey = 1;') || []).length === 1);
const oldKey = (src) => (oldSelect(src) || []).map(({ l }) => ({
  name: l.match(/^const (\w+)/)[1],
  hasScope: new Function('l', `${oldSlice}\nreturn hasScope;`)(l),
}));

// --- the four cells of the matrix, plus his order pair ----------------------
// `ANCHOR` is the source text the subject's SCOPE_IN_PATTERN looks for; `BARE` is the same bullet
// with no `**…:**` scope. Written as source text, which is what both keys read.
const ANCHOR = String.raw`/^\s*\*\s+\*\*cellscope:\*\*/`;
const BARE = String.raw`/^\s*\*\s+cellscope:/`;
const CELLS = [
  ['inline + anchor', `const hasCellA = (l) => ${ANCHOR}.test(l);`, true],
  ['hoisted + anchor', `const CELL_RE_A = ${ANCHOR};\nconst hasCellB = (l) => CELL_RE_A.test(l);`, true],
  ['inline + no anchor', `const hasCellC = (l) => ${BARE}.test(l);`, false],
  ['hoisted + no anchor', `const CELL_RE_B = ${BARE};\nconst hasCellD = (l) => CELL_RE_B.test(l);`, false],
  // His Round 424 §3: the identical PAIR of patterns, classified by the order of the literals.
  ['two literals, anchor FIRST', `const hasCellE = (l) => ${ANCHOR}.test(l) || ${BARE}.test(l);`, true],
  ['two literals, anchor SECOND', `const hasCellF = (l) => ${BARE}.test(l) || ${ANCHOR}.test(l);`, true],
];

say('');
say('## 2. Expected, written down before the cells are driven');
say('');
say('  cured key: YES · YES · no · no   — the left column agrees across rows (property-keyed)');
say('  old key:   YES · no  · no · no   — the hoisted/anchored cell is the one that moves');
say('  his §3:    both order cells carry the anchor, so a property-keyed resolver owes YES to both;');
say('             a first-pattern-only resolver says YES to the first and `no` to the second.');
say('');

say('## 3. The matrix');
say('');
const M = {};
for (const [label, src, want] of CELLS) {
  const c = curedKey(src), o = oldKey(src);
  gate(`[${label}] exactly one key was found by each reader (a reader that found none would make `
    + `every cell below agree vacuously)`, c.length === 1 && o.length === 1, `cured ${c.length}, old ${o.length}`);
  M[label] = {
    cured: c.length === 1 ? c[0].hasScope : null,
    how: c.length === 1 ? c[0].how : null,
    old: o.length === 1 ? o[0].hasScope : null,
    want,
  };
  say(`  ${label.padEnd(28)} cured ${String(M[label].cured).padEnd(6)} old ${String(M[label].old).padEnd(6)}`
    + ` (property says ${want})   resolved: ${M[label].how}`);
}

say('');
say('## 4. The readings');
say('');
for (const [label] of CELLS.slice(0, 4)) {
  predict(`cured key on \`${label}\` answers the PROPERTY`, M[label].want, M[label].cured);
}
predict('OLD key: inline + anchor — YES', true, M['inline + anchor'].old);
predict('OLD key: hoisted + anchor — HIS FINDING, the same property read as `no` because the '
  + 'literal moved', false, M['hoisted + anchor'].old);
predict('OLD key: inline + no anchor — no', false, M['inline + no anchor'].old);
predict('OLD key: hoisted + no anchor — no', false, M['hoisted + no anchor'].old);
gate('THE DISCRIMINATOR (§3): the cured key agrees across POSITIONS and separates on PROPERTY, '
  + 'while the old key disagrees across positions on the identical property — so the cure is a '
  + 'property key and not a wider position key',
  M['inline + anchor'].cured === true && M['hoisted + anchor'].cured === true
  && M['inline + no anchor'].cured === false && M['hoisted + no anchor'].cured === false
  && M['inline + anchor'].old === true && M['hoisted + anchor'].old === false,
  `cured [${CELLS.slice(0, 4).map(([l]) => M[l].cured).join(', ')}] vs old [${CELLS.slice(0, 4).map(([l]) => M[l].old).join(', ')}]`);
gate('CONTROL: the cured key did not simply answer YES to everything — the no-anchor column is '
  + 'false in both positions',
  M['inline + no anchor'].cured === false && M['hoisted + no anchor'].cured === false);
gate('CONTROL: the matrix is not vacuous — the two keys DISAGREE on exactly one of the four cells',
  CELLS.slice(0, 4).filter(([l]) => M[l].cured !== M[l].old).length === 1,
  `disagree on: ${CELLS.slice(0, 4).filter(([l]) => M[l].cured !== M[l].old).map(([l]) => l).join(', ') || '(none)'}`);

say('');
say('## 5. His Round 424 §3: reproduced where it lived, and CURED where it lives now');
say('');
// REWRITTEN IN ROUND 428. Last round this section read "REPRODUCES, and is LATENT: 0 of 10" —
// correct then. His Round 426 §6 argued the latency was remembered rather than monitored, I took
// his option 1, and the order-dependence is now gone from the subject's resolver. So the pair is
// graded as a 2 × 2 across the §6 cure instead of being asserted once: both keys sliced from a rev
// derived by property, both driven over the IDENTICAL pair of patterns in both orders.
const PO = ['two literals, anchor FIRST', 'two literals, anchor SECOND'];
const preSixOf = (label) => {
  if (preSixKey === null) return null;
  const k = preSixKey(CELLS.find(([l]) => l === label)[1]);
  return k.length === 1 ? k[0].hasScope : null;
};
const preSix = { [PO[0]]: preSixOf(PO[0]), [PO[1]]: preSixOf(PO[1]) };
for (const l of PO) say(`  ${l.padEnd(28)} pre-§6 ${String(preSix[l]).padEnd(6)} live ${M[l].cured}   (property says true)`);
predict('PRE-§6: anchor FIRST — the first-pattern resolver says YES', true, preSix[PO[0]]);
predict('PRE-§6: anchor SECOND — HIS FINDING, the IDENTICAL pair read as `no` because of the order '
  + 'alone, reproduced against the rev that had it', false, preSix[PO[1]]);
predict('LIVE: anchor FIRST — still YES', true, M[PO[0]].cured);
predict('LIVE: anchor SECOND — THE §6 CURE, the same pair now reads YES in either order',
  true, M[PO[1]].cured);
const SEPARATES_426_6 = preSix[PO[0]] === true && preSix[PO[1]] === false
  && M[PO[0]].cured === true && M[PO[1]].cured === true;
gate('THE DISCRIMINATOR (Round 426 §6): the identical pair of patterns classifies DIFFERENTLY by '
  + 'order under the pre-§6 resolver and the SAME under the live one, and the YES row is unmoved — '
  + 'so the cure removed the order-dependence rather than widening the key',
  SEPARATES_426_6,
  `pre-§6 ${preSix[PO[0]]}/${preSix[PO[1]]} — live ${M[PO[0]].cured}/${M[PO[1]].cured}`);
gate('CONTROL: the §6 cure did not simply answer YES to everything — the no-anchor column is still '
  + 'false in both positions under the LIVE key',
  M['inline + no anchor'].cured === false && M['hoisted + no anchor'].cured === false);

// His "0 of 10 live", re-measured over the live population with the instrument's own keyLines.
//
// THE FIRST DRIVE OF THIS BLOCK READ `0 of 0`, and both zero-figures LANDED on an empty
// population — the exact vacuity I keep writing down (Round 339: two keys sharing a denominator
// agree vacuously). The cause: the subject does not census ITSELF. Its `SRC` is another file, and
// I had passed it its own source. The denominator predict is what caught it, so it stays, and the
// two figures now REFUSE with `null` on an empty population rather than printing a true-looking 0
// (Rounds 393/408: a sentinel that compares equal is green forever; a refusing signal may only
// raise a floor). The population path is sliced out of the subject, not re-typed, so moving it
// there reddens here.
const POP_REL = (SRC.match(/^const INSTR_REL = '(.*)';$/m) || [, null])[1];
gate('the censused population\'s path was sliced out of the subject', POP_REL !== null, POP_REL || '(no match)');
const POP_SRC = POP_REL === null ? '' : readFileSync(path.join(REPO, POP_REL), 'utf8');
gate('…and that file is readable and non-empty', POP_SRC.length > 0, `${POP_REL} — ${POP_SRC.length} bytes`);
const live = curedKey(POP_SRC);
say(`  the subject censuses: ${POP_REL}`);
say(`  live population (the subject's own keyLines over that file): ${live.length} subjects`);
const popOk = live.length > 0;
gate('the population is non-empty — otherwise every figure below is 0 for the wrong reason',
  popOk, `${live.length} subjects`);
const litRe = (SRC.match(/^const RE_LITERAL = (.*);$/m) || [, null])[1];
gate('RE_LITERAL was sliced out of the subject for the per-body count', litRe !== null, litRe || '(no match)');
const litGlobal = litRe === null ? null : new Function(`return ${litRe.replace(/\/([a-z]*)$/, '/g$1')};`)();
const perBody = live.map((s) => {
  const l = POP_SRC.split('\n')[s.n - 1];
  const body = l.replace(/^const \w+ = \(l\) =>\s*/, '');
  return { name: s.name, literals: (body.match(litGlobal) || []).length, how: s.how };
});
const multi = perBody.filter((p) => p.literals > 1);
const litAndHoist = perBody.filter((p) => p.literals >= 1 && p.how.startsWith('hoisted'));
say(`  literals per body: ${perBody.map((p) => `${p.name}=${p.literals}`).join(', ') || '(no subjects)'}`);
predict('…and the population he measured it over is the one I publish', 10, live.length);
predict('his figure: bodies carrying more than one regex literal, live', 0,
  popOk && litGlobal !== null ? multi.length : null);
predict('his figure: bodies carrying a literal AND resolving via a hoisted ref, live', 0,
  popOk && litGlobal !== null ? litAndHoist.length : null);
// CURED (Round 428, his Round 426 §2): the LATENT reading is named ONCE here and the published
// sentence reads THIS CONST and THIS FIGURE — it no longer re-interpolates `multi.length` and
// `live.length` raw. My own §4 last round was about catching `0 of 0` on an empty population; the
// cure went into the two predicts and into the gate and NOT into the sentence, which over an
// empty population printed exactly the line I had written §4 to say I would not ship. Two of
// three places took the cure; this is the third. The figure itself refuses with `null` rather
// than printing a true-looking 0 (Rounds 393/408).
const LIVE_FIGURE = popOk && litGlobal !== null ? `${multi.length} of ${live.length}` : null;
const LATENT_3 = popOk && litGlobal !== null && multi.length === 0 && litAndHoist.length === 0
  && live.length === 10;
// The LABEL moved with the cure too (Round 428): this leg used to be headed "so his §3 is LATENT
// here", which was true of a resolver that no longer exists. What it reads has not changed — it is
// what the latency was WORTH on the day it was cured, which is what makes "the §6 cure lowered no
// floor" a measurement rather than an argument.
gate('the §6 cure moved no figure: zero live instances of the shape it removed, so the FLOOR '
  + 'language is unaffected and the cure can only ever read MORE scope legs, never fewer',
  LATENT_3, `${LIVE_FIGURE === null ? 'REFUSED' : LIVE_FIGURE} multi-literal, ${litAndHoist.length} literal+hoisted`);

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
say(`  §3 cure (resolve the pattern instead of keying on its position): ${
  M['inline + anchor'].cured === true && M['hoisted + anchor'].cured === true
  && M['inline + no anchor'].cured === false && M['hoisted + no anchor'].cured === false
  && M['inline + anchor'].old === true && M['hoisted + anchor'].old === false
    ? 'SEPARATES — property-keyed in all four cells, where the old key moved with the literal'
    : 'NOT shown to separate'}`);
// Two claims, two discriminators, each the same const its gate above reads — and the LATENT
// clause cannot print a figure the census refused.
say(`  his Round 424 §3 (one pattern per body): ${!SEPARATES_426_6 ? 'NOT shown to separate'
  : `CURED — it reproduces under the pre-§6 resolver (${PRE_SIX?.slice(0, 8)}) and the identical pair `
    + `now reads YES in either order under the live one`}`);
say(`  …and what the latency was worth when it was still latent: ${LATENT_3 && LIVE_FIGURE !== null
  ? `${LIVE_FIGURE} live instances, so the cure moved no figure`
  : 'REFUSED (empty population, or RE_LITERAL did not slice, or the census moved) — not established this drive'}`);

writeFileSync(path.join(import.meta.dirname, 'position-vs-property-confusion-matrix.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
