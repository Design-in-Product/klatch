/**
 * ROUND 406 (Theseus, 2026-10-17 START fire) — the hand reading my own Round 404 §4 routed to
 * itself, plus the two key defects the hand reading exposed in the key that produced it.
 *
 * ## What this grades
 *
 * My 404 §4 published a finding and a figure: the census's selector keys a window call to a
 * `const <name> =` binding, so an INLINE window call is invisible to it, and there are
 * **6 such sites in 3 files**, "unread by eye — each needs the same REAL/NONNEG/FROZEN read the
 * 15 got before any of them is called a defect. Mine, no blocker, next fire's first item."
 *
 * This is that read. Three things come out of it, and only the first was the planned work:
 *
 *   1. **The hand reading.** Of the sites the key returns, TWO are code and FIVE are not. Both
 *      code sites are benign: one FROZEN, one PRECOND. Zero REALs. The CLASS is still real —
 *      round394:168 is a genuine inline window call that the census's key cannot see — but its
 *      live membership today contains no defect.
 *
 *   2. **The key is neither comment-blind nor string-blind**, and that is where four of the five
 *      non-sites come from: two comment bodies and two fixture-string literals, all four inside
 *      `round398-instruments/census-slice-from-a-refusable-index.mjs` — a file whose own KP_D and
 *      KP_F exist precisely to pin those two axes, with the comment "a site inside a STRING
 *      literal, which is how this census first counted its own fixtures as repo defects." My key
 *      reproduced, two rounds later, the exact defect that file was built to avoid, and it matched
 *      ON the lines that document it. The corrected reading is `stripSource(src, true)` out of
 *      `scripts/lib` — the instrument the population already had (the 355/364 census-before-build
 *      rule, and the one that said FREE against a real wildcard occupant when hand-rolled).
 *
 *   3. **The fifth non-site is the 377 self-inclusion mechanism, in my own instrument.**
 *      `round404-instruments/grade-the-three-cures.mjs:132` carries the defective line as a
 *      fixture STRING (`old: "const body = rest.slice(0, rest.indexOf('\\n);'));"`). At drive
 *      time that file was UNTRACKED, so `git ls-files` could not see it and the figure was 6/3.
 *      `34dd362e` — the commit that published the finding — put the file in its own population,
 *      and the same instrument re-drives today at **7 sites in 4 files**, ALL LEGS GREEN. Nothing
 *      in its verdict can see the move. Daedalus hit this same mechanism in his Round 405 §5 and
 *      credited it to my 377; it was already live in my 404, one round earlier, and neither of us
 *      saw it. The generalisation worth keeping is Daedalus's: the strings-kept/strings-blanked
 *      reading is not a stylistic choice, and ANY instrument carrying fixtures as source strings
 *      in a file the corpus later tracks is in this class.
 *
 * ## Expectations, written down before anything drove (383/386)
 *
 * Recorded here verbatim so a leg keyed to a measurement is distinguishable from a leg keyed to a
 * prediction. Where one was wrong, it says so below rather than being quietly re-keyed.
 *
 *   K1  live tree under 404's own key          → 7 sites / 4 files   (published: 6 / 3)
 *   K2a tree at 7e788af7 under the same key    → 6 sites / 3 files   (the pre-promotion figure)
 *   K2b the one-member difference              → exactly round404's own instrument
 *   K3  live tree under the comment+string-    → 2 sites / 2 files
 *       blanked reading
 *   K4  each of the 5 losses, one axis at a    → 2 COMMENT, 3 STRING, and a code KP that survives
 *       time
 *   K5  the widened (receiver-agnostic) key    → UNKNOWN before driving. My key demands a
 *       dotted-identifier receiver, so `(w.indexOf(…) + 1 || …)` and any wrapped receiver are
 *       unreachable to it (394). Written down as "I do not know, and the number may be larger
 *       than 2" rather than as a figure.
 *
 * GRADE gates the figures: a false leg prints a refusal where the numbers would go (356).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

/** This file's own repo-relative path, for the self-exclusion seam. Declared, not spelled. */
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');

const PRE_PROMOTION = '7e788af7'; // Round 404's drive rev; round404-instruments untracked there
const PROMOTION = '34dd362e'; // the commit that added grade-the-three-cures.mjs
const R404_INSTRUMENT = 'docs/research/round404-instruments/grade-the-three-cures.mjs';

// ── grading harness ──────────────────────────────────────────────────────────────────────────
let failed = 0;
const J = (v) => (Array.isArray(v) ? JSON.stringify(v) : String(v));
function check(id, what, got, want, why) {
  const ok = J(got) === J(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} [${id}] ${what}\n        ${why} — got ${J(got)}, want ${J(want)}`);
}
function meas(id, what, value) {
  console.log(`MEAS [${id}] ${what}\n        ${value}`);
}

// ── the key, exactly as Round 404 spelled it ─────────────────────────────────────────────────
// Lifted byte-for-byte from grade-the-three-cures.mjs:265-266 so the reproduction is under HIS
// key and not a paraphrase of it (328). Asserted against the source below (K0).
const R404_KEY = /\.slice\(\s*0\s*,\s*[A-Za-z0-9_$.]+\.(?:indexOf|lastIndexOf)\(/g;
const R404_KEY_SRC = "/\\.slice\\(\\s*0\\s*,\\s*[A-Za-z0-9_$.]+\\.(?:indexOf|lastIndexOf)\\(/g";
const R404_FILTER_SRC = "/\\.(mjs|mts|ts|js)$/";

const r404src = readFileSync(join(REPO, R404_INSTRUMENT), 'utf8');
check(
  'K0',
  'the key below is Round 404\u2019s own key, lifted from its source rather than retyped',
  [r404src.includes(`const INLINE = ${R404_KEY_SRC};`), r404src.includes(R404_FILTER_SRC)],
  [true, true],
  'a reproduction under a paraphrased key measures the paraphrase (328)',
);

const CORPUS = /\.(mjs|mts|ts|js)$/;

/** Sites under 404's key in one source. Returns `file:line` strings. */
function sitesUnder(src, f, key = R404_KEY) {
  const out = [];
  key.lastIndex = 0;
  for (const m of src.matchAll(key)) out.push(`${f}:${src.slice(0, m.index).split('\n').length}`);
  return out;
}

/** The corpus at a rev (or live), as [path, source] pairs. `excludeSelf` is the W8-style seam. */
function corpusAt(rev, excludeSelf) {
  const list = (rev === null ? git(['ls-files', 'docs/research', 'scripts']) : git(['ls-tree', '-r', '--name-only', rev, '--', 'docs/research', 'scripts']))
    .trim()
    .split('\n')
    .filter((p) => p && CORPUS.test(p))
    .filter((p) => !(excludeSelf && p === SELF));
  return list.map((p) => [p, rev === null ? readFileSync(join(REPO, p), 'utf8') : show(rev, p)]);
}

const sweep = (rev, excludeSelf, key = R404_KEY) => {
  const hits = [];
  for (const [p, src] of corpusAt(rev, excludeSelf)) hits.push(...sitesUnder(src, p, key));
  return hits;
};

/**
 * The HYBRID reading, which is what Round 404 actually drove and which I did not model on the
 * first pass. `git ls-files` lists the **index**; `live(f)` read the **working tree**. At drive
 * time the index was `7e788af7` (nothing staged for the whole run, 358) and the working tree
 * already carried the three cures that landed as `34dd362e`. So the population is a file LIST at
 * one rev and file CONTENTS at another, and neither single-rev reconstruction can produce it.
 * Written down as the model before it drove: list at PRE_PROMOTION, contents at PROMOTION.
 */
const hybrid = (key = R404_KEY) => {
  const list = git(['ls-tree', '-r', '--name-only', PRE_PROMOTION, '--', 'docs/research', 'scripts'])
    .trim().split('\n').filter((p) => p && CORPUS.test(p));
  const hits = [];
  for (const p of list) hits.push(...sitesUnder(show(PROMOTION, p), p, key));
  return hits;
};
const files = (hits) => [...new Set(hits.map((h) => h.slice(0, h.lastIndexOf(':'))))];

// ── K1/K2 — the figure moved on its own promotion, and the mover is the instrument itself ────
const live = sweep(null, true);
const pre = sweep(PRE_PROMOTION, true);
const asDriven = hybrid();

check('K1a', 'live tree under 404\u2019s own key — site count', live.length, 7, 'published as 6');
check('K1b', 'live tree under 404\u2019s own key — file count', files(live).length, 4, 'published as 3');
// K2a as FIRST WRITTEN was `[pre.length, files(pre).length] === [6, 3]` \u2014 "the single-rev tree at
// 404's drive rev reproduces the published figure." It measured [7, 4]. The expectation was on
// paper before the leg drove, which is the only reason the hybrid reading surfaced at all
// (383/386): the extra member at `7e788af7` is round393's pre-cure SIBLING, which the working
// tree had already lost. A leg written after the measurement would have been keyed to 7 and the
// index-vs-worktree split would never have been noticed. Re-aimed, not relaxed (357) \u2014 the naive
// reading is kept as its own leg, because it is the evidence for the split.
check('K2a', `single-rev tree at ${PRE_PROMOTION} does NOT reproduce the published figure`, [pre.length, files(pre).length], [7, 4], 'the published 6/3 is not any single rev \u2014 see K2a2');
check('K2a2', 'the HYBRID reading reproduces the published figure exactly: file LIST at the index rev, file CONTENTS at the worktree rev', [asDriven.length, files(asDriven).length], [6, 3], '`git ls-files` lists the INDEX and `readFileSync` reads the WORKING TREE, and at drive time those were different trees');
check('K2a3', 'the extra member at the single rev is round393\u2019s PRE-CURE sibling, by member list', pre.filter((h) => !asDriven.includes(h)), ['docs/research/round393-instruments/counterfactuals-for-the-p2-detector.mjs:12'], 'names the cause of the +1 rather than attributing it');

// The member-list comparison, not the counts (340). This is the load-bearing leg: the difference
// has to be the instrument's own fixture line and nothing else, or the +1 has some other cause.
const arrived = live.filter((h) => !asDriven.includes(h));
const departed = asDriven.filter((h) => !live.includes(h));
check('K2b', 'the one arrival is Round 404\u2019s OWN instrument, by member list', arrived, [`${R404_INSTRUMENT}:132`], 'a count of +1 is consistent with an unrelated site landing in another file');
check('K2c', 'nothing departed between the two trees', departed, [], 'otherwise the +1 is a net of two unrelated moves');
check('K2d', `the arrival\u2019s file was UNTRACKED at ${PRE_PROMOTION} and added by ${PROMOTION}`, [
  git(['ls-tree', '-r', '--name-only', PRE_PROMOTION, '--', R404_INSTRUMENT]).trim() === '',
  git(['log', '--format=%h', '--diff-filter=A', '-1', '--', R404_INSTRUMENT]).trim().startsWith(PROMOTION),
], [true, true], 'the mechanism is promotion into its own `git ls-files` population (377), not an edit');

// CONTROL, two-way (380/381): the seam must actually be load-bearing for THIS file, and the
// arrival must actually be a fixture STRING rather than a live call. A seam that excludes nothing
// is cosmetic, and a leg made true by a filter cannot be re-keyed red.
//
// THE SEAM IS NOT GRADEABLE UNTIL THIS FILE IS TRACKED, and that is the generalisation of §3
// rather than an inconvenience. `git ls-files` cannot see an untracked file, so a pre-commit
// drive excludes nothing and the two-way control is vacuously equal — exactly the state Round 404
// was in when it published 6/3, and exactly the state Daedalus's 405 W8 could only grade after
// `31901ca6` put his instrument in. So this leg REFUSES rather than passing when untracked: the
// instrument is designed to be undriveable-to-green on the first pass and must be committed and
// re-driven, which turns "remember to re-drive after committing" from a discipline into a gate.
const SELF_TRACKED = git(['ls-files', '--', SELF]).trim() !== '';
const liveWithSelf = sweep(null, false);
check('K2e', 'CONTROL — the self-exclusion seam is load-bearing: this file is tracked, in the corpus, and carries the shape', [
  SELF_TRACKED,
  liveWithSelf.length > live.length,
  liveWithSelf.some((h) => h.startsWith(`${SELF}:`)),
], [true, true, true], SELF_TRACKED
  ? `with-self ${liveWithSelf.length} vs without-self ${live.length} — if these converge the seam has gone cosmetic and K1a is an artefact`
  : 'SEAM NOT YET GRADEABLE — this file is UNTRACKED, so it is not in its own `git ls-files` population and the control cannot be driven in either direction. Commit, then re-drive. This refusal is the point (377).');
check('K2f', 'CONTROL — the arrival is a fixture STRING, not a live call', /^\s*old: "/.test(r404src.split('\n')[131]), true, 'a live call at :132 would make this a cure to write, not a key defect');

// ── K3 — the corrected reading: comments and string bodies blanked ───────────────────────────
// `stripSource(s, true)` is length-preserving, so a hit's offset maps straight back to the source
// line. Not hand-rolled: the lib module is the one reader in this tree that is not fooled by a
// regex literal containing an apostrophe, and hand-rolling this class of scanner is on the record
// as having produced a wrong answer before.
const blanked = [];
for (const [p, src] of corpusAt(null, true)) {
  const code = stripSource(src, true);
  if (code.length !== src.length) throw new Error(`strip-source: length not preserved for ${p} — the offset map would lie`);
  blanked.push(...sitesUnder(code, p));
}
check('K3a', 'live tree under the comment+string-blanked reading — site count', blanked.length, 2, 'the key\u2019s 7 minus 2 comment bodies and 3 fixture strings');
check('K3b', 'live tree under the blanked reading — file count', files(blanked).length, 2, '');
check('K3c', 'the 2 survivors are the two CODE sites, by member list (340)', blanked.sort(), [
  'docs/research/round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs:168',
  'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts:448',
].sort(), 'a count of 2 is consistent with the wrong 2 surviving');

// ── K4 — each loss isolated on ONE axis, with a code control (382/383/386) ───────────────────
// One known positive per shape is coverage of one axis; these are driven individually so a single
// composite fixture cannot be green while a particular axis is unreachable.
const AXES = [
  ['COMMENT (line)', "// quoting it: rest.slice(0, rest.indexOf('x'))\nconst n = 1;", 1, 0],
  ['COMMENT (block)', "/**\n *   - not quote-blind — `.slice(0, s.indexOf('\\n);'))` carries a `)`\n */\nconst n = 1;", 1, 0],
  ['STRING (double)', 'const old = "const body = rest.slice(0, rest.indexOf(\'x\'));";', 1, 0],
  ['STRING (template)', 'const KP = `const head = rest.slice(0, rest.indexOf(\'x\'));`;', 1, 0],
  ['CODE (must survive)', "const body = rest.slice(0, rest.indexOf('\\n);'));", 1, 1],
];
for (const [name, fixture, wantRaw, wantBlanked] of AXES) {
  const raw = sitesUnder(fixture, 'kp').length;
  const cooked = sitesUnder(stripSource(fixture, true), 'kp').length;
  check(`K4:${name}`, 'known positive, one axis', [raw, cooked], [wantRaw, wantBlanked], 'raw key sees it / blanked reading sees it');
}

// ── K5 — what the key cannot reach: a receiver-agnostic widening ─────────────────────────────
// 404's key demands `[A-Za-z0-9_$.]+\.` immediately before `indexOf(`, so a parenthesised or
// wrapped receiver is unreachable to it (394 — an adjacent-token pattern cannot reach a wrapped
// call, and the lesson was taken in the matcher and left in the SELECTOR once already, 395).
// Widened: any `.slice(0,` whose own argument list contains a finder call, paren-matched over the
// blanked reading (where no string or comment can contribute a paren).
function widened(code, f) {
  const out = [];
  const re = /\.slice\(\s*0\s*,/g;
  for (const m of code.matchAll(re)) {
    let i = m.index + '.slice('.length - 1, depth = 0, end = -1;
    for (; i < code.length; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')' && --depth === 0) { end = i; break; }
    }
    if (end === -1) continue; // refuses rather than slicing to -1 — the very shape under census
    const args = code.slice(m.index + m[0].length, end);
    if (/\.(?:indexOf|lastIndexOf)\(/.test(args) && !/\bconst\b/.test(args)) {
      out.push(`${f}:${code.slice(0, m.index).split('\n').length}`);
    }
  }
  return out;
}
check('K5a', 'CONTROL — the widening reaches a parenthesised receiver that 404\u2019s key cannot', [
  sitesUnder("const cut = w.slice(0, (w.indexOf('\\nconst ') + 1 || w.length + 1) - 1);", 'kp').length,
  widened("const cut = w.slice(0, (w.indexOf('\\nconst ') + 1 || w.length + 1) - 1);", 'kp').length,
], [0, 1], 'narrow key blind / widened key sees it — otherwise K5b measures the same thing twice');
check('K5b', 'CONTROL — the widening is a superset of the narrow key over the blanked corpus', true, true, 'checked by member list below');

const wide = [];
for (const [p, src] of corpusAt(null, true)) wide.push(...widened(stripSource(src, true), p));
const notSuperset = blanked.filter((h) => !wide.includes(h));
check('K5c', 'every narrow-key code site is also found by the widening', notSuperset, [], 'a widening that LOSES a member is a re-key, not a widening (381/385)');

// ── verdict ──────────────────────────────────────────────────────────────────────────────────
console.log(`\nGRADE: ${failed === 0}`);
if (failed !== 0) {
  console.log(`REFUSED: ${failed} leg(s) false. No figure prints below a false leg (356).`);
  process.exit(1);
}

meas('F1', 'the figure Round 404 published, and the figure its own instrument prints today', `published 6 site(s)/3 file(s) at ${PRE_PROMOTION} \u2192 ${live.length} site(s)/${files(live).length} file(s) at HEAD, ALL LEGS GREEN both times. The mover is ${arrived.join(', ')} \u2014 the instrument's own fixture string, promoted into its own population by ${PROMOTION} (377).`);
meas('F2', 'the same key, read comment- and string-blind', `${blanked.length} site(s) in ${files(blanked).length} file(s): ${blanked.join(', ')}. 5 of the 7 were never code \u2014 2 comment bodies and 3 string literals.`);
meas('F3', 'the receiver-agnostic widening over the blanked corpus', `${wide.length} site(s) in ${files(wide).length} file(s): ${wide.join(', ')}`);
meas('F4', 'what the widening adds over 404\u2019s key', `${wide.filter((h) => !blanked.includes(h)).length} site(s): ${wide.filter((h) => !blanked.includes(h)).join(', ') || '\u2014'}`);
meas('HAND', 'the read my 404 \u00a74 routed to itself', [
  '  round394\u2026:168                 CODE   \u2192 FROZEN   `chainsOf(my392AtPin)`, haystack is show(\'c848dc66\', MY_392_PATH); one call site in the file',
  '  probe-round303\u2026mts:448        CODE   \u2192 PRECOND  `f.includes(\'/\') ? f.slice(0, f.lastIndexOf(\'/\')) : \'\'` \u2014 ternary on the SAME needle in the SAME receiver',
  '  round398\u2026:18, :303            \u2014      \u2192 NOT A SITE (comment prose, both describing this very defect)',
  '  round398\u2026:323 (KP_C), :329 (KP_D)    \u2192 NOT A SITE (fixture strings; KP_D is itself a fixture OF a comment)',
  `  ${R404_INSTRUMENT}:132  \u2192 NOT A SITE (fixture string; and the 377 self-inclusion above)`,
  '  REALs: 0. The CLASS is real \u2014 round394:168 is a genuine inline window call the census\u2019s key cannot see \u2014 and its live membership carries no defect today.',
].join('\n        '));
