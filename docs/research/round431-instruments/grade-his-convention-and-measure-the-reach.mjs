/**
 * Round 431 — the twelfth hit cured, its REACH measured, and two defects in the cure I imported.
 *
 * Daedalus's Round 430 took my Round 429 §1 charge as a gate on the convention rather than a slice
 * of my text, built `refusal-convention.mjs`, and censused the complement of my `new Function(`
 * floor under a key sharing no leg with mine. His P4 came back REFUTED by exactly one member, and
 * the member is mine: `round414-instruments/…:133`, an absence test on the sliced reader's own
 * refusal sentinel. Granted, reproduced, and cured here.
 *
 * ## What this round adds that his does not
 *
 * His grid grades the convention over MUTATED COPIES OF THE SUBJECT: M1 (success also carries the
 * sentinel), M2 (sentinel renamed), M3 (control). Both cells are real and both reproduce here. But
 * a census that reports "12 instances of the class" treats every member as equally live, and that
 * is the shape of my own Round 429 §3 mistake, where two of my four legs were inert on the live
 * census and my gate asserted all four had moved it. So the question this round asks about MY
 * member is not "is it the class" (it is) but **which mutation can reach it**:
 *
 *   P1  M2 — the sentinel renamed — is INERT at my site. The dangerous direction in his grid, the
 *       one where a refusal reads as an answer, cannot reach line 133 at all: the only input that
 *       site drives takes the ANSWER path, whose shape a rename does not touch.
 *   P2  M1 DOES reach it, and in the SAFE direction: the old predicate goes false on a true
 *       answer. What the cure buys at this site is therefore the REASON, not the verdict — a named
 *       shared-key refusal in place of a red that presents as a span mismatch.
 *
 * So the class of twelve is not homogeneous, and the axis it needs is not a count.
 *
 * ## And two defects in the module I imported
 *
 * G4  `conventionOf`'s answer-shape leg is keyed on the literal `.slice(` appearing in a value, and
 *     has no model of the function's PARAMETER. Its own docblock says the answer shape is "the one
 *     carrying a value that slices the function's own input". Three probes differing in one thing
 *     each: a value slicing the input (ANSWER, correct), a value slicing a MODULE CONSTANT and
 *     touching the input nowhere (ANSWER — admitted, and the published sentence is false of it),
 *     and a value derived from the input WITHOUT `.slice(` (REFUSED — excluded). Both directions
 *     off one leg. The over-admission is the dangerous one: this module's whole value is refusing
 *     when it cannot tell, and a looser answer leg refuses LESS often than the sentence promises.
 *
 * G5  the "every value is a message" leg reads `maskedValue !== rawValue`, and `stripSource` blanks
 *     COMMENT bodies as well as string bodies. So a comment inside a return value makes that value
 *     read as a message: one `/* … *\/` inside an answer return flips the shape to a refusal, and
 *     with no answer shape left `conventionOf` refuses the whole subject. Comment-blindness is the
 *     pin he has twice told me to re-aim rather than loosen (357/375) and his message detector does
 *     not have it. Graded with the comment OUTSIDE the return expression as the control, and with
 *     `Function.prototype.toString` asserted to carry comments at all rather than assumed to.
 *
 * ## Form
 *
 * Nothing here re-types a convention. The refusal sentinel used to locate the cured line is
 * DERIVED from the live reader's own returns via his module; the `new Function(` precondition that
 * made my own 429 census blind to this site is SLICED out of my 429 source; the subject reader and
 * all three mutants are HIS committed slices, each verified as the single-variable edit it claims
 * before it is used. The pre-cure text is pinned by PROPERTY — the text at the pinned rev must
 * LACK the cure's import specifier — so a wrong rev reddens rather than inverting once the cure is
 * committed (420/422).
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conventionOf, classify, keyOf } from '../round430-instruments/refusal-convention.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const SELF_DIR = `${SELF.split('/').slice(0, -1).join('/')}/`;
const REV = git(['rev-parse', 'HEAD']).trim();

/** The rev of my worktree at the moment this fire opened — BEFORE the cure was written. Pinned by
 *  property in G6a below, not trusted: the text there must lack the cure's import. */
const REV_PRECURE = '40b69a33d1aea187a6cf659c45a0527c4ff4ea84';

const MY414 = 'docs/research/round414-instruments/grade-the-refusing-half-and-reconcile-the-ten.mjs';
const MY429 = 'docs/research/round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs';
const MY412 = 'docs/research/round412-instruments/resolve-the-ternary-and-reconstruct-the-nine.mjs';
const HIS430 = 'docs/research/round430-instruments/';
const HIS_SLICE = `${HIS430}his412-prefix.sliced.mjs`;
const CURE_SPECIFIER = '../round430-instruments/refusal-convention.mjs';
const PRECURE_OUT = `${SELF_DIR}baseline-round414-precure.out`;
const POSTCURE_OUT = `${SELF_DIR}round414-postcure.out`;

const read = (p) => readFileSync(join(REPO, p), 'utf8');
const atRev = (rev, p) => git(['show', `${rev}:${p}`]);

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
let gateOK = true;
const legs = [];
const preds = [];

const g = (id, claim, ok, detail) => {
  legs.push({ id, ok });
  if (ok !== true) gateOK = false;
  say(`  ${ok === true ? 'TRUE ' : 'FALSE'} ${id}  [GATE] ${claim}`);
  say(`        ${detail}`);
};
const p = (id, claim, ok, detail) => {
  preds.push({ id, ok });
  say(`  ${ok === true ? 'TRUE ' : 'FALSE'} ${id}  [PRED] ${claim}`);
  say(`        ${detail}`);
};

say(`${SELF}`);
say(`rev ${REV} · pre-cure rev pinned by property: ${REV_PRECURE}`);
say('');

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G1 — the subject reader I am about to grade is an honest slice of my own round412 file.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const sliceText = read(HIS_SLICE);
const my412Text = read(MY412);
/** The length of the longest common prefix, derived rather than pinned as a line number. */
let k = 0;
while (k < sliceText.length && k < my412Text.length && sliceText[k] === my412Text[k]) k += 1;
const tail = sliceText.slice(k);
const tailBare = stripSource(tail, false).replace(/\s+/g, ' ').trim();
const TAIL_IS_ONLY_EXPORTS = /^export \{[^}]*\};$/.test(tailBare);
g('G1', `his committed slice of my round412 reader is a WHOLE-LINE prefix of my live file plus `
  + `exactly one export statement — so the function graded below is mine and not a copy`,
  k > 0 && sliceText[k - 1] === '\n' && TAIL_IS_ONLY_EXPORTS
  && sliceText.slice(0, k) === my412Text.slice(0, k),
  `common prefix ${k} byte(s) = ${sliceText.slice(0, k).split('\n').length - 1} line(s) of my `
  + `${my412Text.split('\n').length - 1} · prefix ends at a newline: ${sliceText[k - 1] === '\n'} `
  + `· remainder, comment-blinded and whitespace-normalised, is only an export list: `
  + `${TAIL_IS_ONLY_EXPORTS} ("${tailBare.slice(0, 48)}…")`);

const LIVE = await import(`../../../${HIS_SLICE}`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G2 — the refusal sentinel, DERIVED. Nothing below types it.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const LIVE_CONV = conventionOf(LIVE.topLevelTernary.toString());
const SENTINELS = Array.isArray(LIVE_CONV.refusal)
  ? [...new Set(LIVE_CONV.refusal.flatMap((s) => s.split(',')))] : [];
g('G2', 'the reader\'s refusal convention is derivable from its own returns, and its refusal shape '
  + 'is a single key — which is what makes a single derived sentinel the right probe below',
  Array.isArray(LIVE_CONV.answer) && Array.isArray(LIVE_CONV.refusal) && SENTINELS.length === 1,
  Array.isArray(LIVE_CONV.answer)
    ? `answer [${LIVE_CONV.answer}] · refusal [${LIVE_CONV.refusal}] · negative answers `
      + `${LIVE_CONV.none} · derived sentinel: "${SENTINELS[0]}" — typed nowhere in this file`
    : `REFUSED: ${LIVE_CONV.refused}`);
const SENTINEL = SENTINELS.length === 1 ? SENTINELS[0] : null;

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G3 — my own round429 census was STRUCTURALLY blind to this site, and the leg that blinded it is
// sliced out of my 429 source rather than recalled. A known positive and a known negative.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const r429src = read(MY429);
const MY429_OUT = 'docs/research/round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.out';
const r429out = read(MY429_OUT);
const tokMatch = /const SLICE_TOKEN = '([^']+)'/.exec(r429src);
const SLICE_TOKEN = tokMatch === null ? null : tokMatch[1];
const occurrences = (hay, needle) => (needle === null ? -1 : hay.split(needle).length - 1);
const HIS413 = 'docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs';
const in414 = occurrences(atRev(REV_PRECURE, MY414), SLICE_TOKEN);
const in413 = occurrences(atRev(REV_PRECURE, HIS413), SLICE_TOKEN);
/** My own recorded 429 output lists every candidate that cleared inclusion leg 1, one per row. */
const CAND_ROW = new RegExp(`^ +\\S.*subjects=\\d+ +(${MY414})$`, 'm');
const candRow = CAND_ROW.exec(r429out);
g('G3', 'HIS STATED REASON FOR MY BLINDNESS IS REFUTED. He wrote that my §1 census "could not see '
  + 'it — its `new Function(` precondition excludes round414". The token occurs in round414, and '
  + 'my own recorded 429 output lists round414 as a candidate that CLEARED that leg with four '
  + 'subjects resolved. The precondition admitted it; something else dropped it',
  SLICE_TOKEN !== null && in414 > 0 && in413 > 0 && candRow !== null,
  SLICE_TOKEN === null ? 'REFUSED: could not slice SLICE_TOKEN out of my 429 source'
    : `sliced token "${SLICE_TOKEN}" · occurrences in round414 at the pre-cure rev: ${in414} `
      + `(round414:284 materialises its sliced regexes with it) · in his round413: ${in413} · and `
      + `my recorded candidate row, read out of ${MY429_OUT.split('/').pop()}: `
      + `"${(candRow?.[0] ?? '(absent)').trim()}"`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G3b — what ACTUALLY dropped it. My 429 key is a VERBATIM containment of a `const NAME = RHS;`
// declared in the subject, so it is receiver-sensitive: round412 declares the predicate with the
// receiver `t`, his round413 copied it character-for-character, and my round414 wrote the same
// predicate with the receiver renamed. Containment fails on a renamed receiver.
// The const reader is SLICED out of my 429 source and materialised, never re-typed (408/412).
// ───────────────────────────────────────────────────────────────────────────────────────────────
const lineOf = (src, re) => (re.exec(src) ?? [null])[0];
const CONST_RE_LINE = lineOf(r429src, /^const CONST_RE = .*$/m);
const MIN_RHS_LINE = lineOf(r429src, /^const MIN_RHS = .*$/m);
const NORM_LINE = lineOf(r429src, /^const norm = .*$/m);
const K = (CONST_RE_LINE === null || MIN_RHS_LINE === null || NORM_LINE === null) ? null
  : new Function(`${CONST_RE_LINE}\n${MIN_RHS_LINE}\n${NORM_LINE}\n`
    + 'return { CONST_RE, MIN_RHS, norm };')();
const ABSENCE_ANY_RECEIVER = SENTINEL === null ? null
  : new RegExp(`(\\w+)\\.${SENTINEL}\\s*===\\s*undefined`);
/** Every hit my own 429 census published, parsed back out of its recorded output. Used by G3b to
 *  pick the carrier it published, and by P3 to hand my whole hit list to his key's shape. */
const HIT_ROW = /^ {6}`(\w+)` \(text occurs in \d+ files of \d+\) ← (\S+)\n {8}(.*)$/gm;
const myHits = [...r429out.matchAll(HIT_ROW)].map((m) => ({ name: m[1], subject: m[2], rhs: m[3] }));
const constsOf = (src) => (K === null ? [] : [...src.matchAll(K.CONST_RE)]
  .map((m) => ({ name: m[1], rhs: K.norm(m[2]) })).filter((c) => c.rhs.length >= K.MIN_RHS));
const my412Consts = constsOf(my412Text);
const carriers = ABSENCE_ANY_RECEIVER === null ? []
  : my412Consts.filter((c) => ABSENCE_ANY_RECEIVER.test(c.rhs));
/** The carrier is not CHOSEN here: it is the hit my own 429 output published, read back out of it
 *  and then located in the subject's live const list, so the two agree on the same bytes. */
const publishedHit = myHits.find((h) => ABSENCE_ANY_RECEIVER !== null
  && ABSENCE_ANY_RECEIVER.test(h.rhs)) ?? null;
const CARRIER = publishedHit === null ? null
  : (carriers.find((c) => c.rhs === publishedHit.rhs)?.rhs ?? null);
const recv = (text) => (ABSENCE_ANY_RECEIVER === null ? null
  : (ABSENCE_ANY_RECEIVER.exec(text) ?? [null, null])[1]);

/**
 * The pre-cure rev of HIS round413 is DERIVED, not pinned: his own cure landed in this fire's
 * history, BEFORE the rev I pinned for my own, so a cell sourced from my pre-cure rev reads his
 * file already cured and the known positive inverts (420/422, and it did — drive 2 read 0 here).
 * Walk the path's revs newest-first and take the transition: the newest rev whose text carries the
 * copied predicate, and the rev after it, which must both LACK it and CARRY his cure's import.
 */
const revsOfPath = (p) => git(['log', '--format=%H', '--', p]).trim().split('\n').filter(Boolean);
const r413revs = revsOfPath(HIS413);
const carriedAt = CARRIER === null ? []
  : r413revs.filter((r) => atRev(r, HIS413).includes(CARRIER));
const KP_REV = carriedAt[0] ?? null;
const CURE_REV = KP_REV === null ? null : (r413revs[r413revs.indexOf(KP_REV) - 1] ?? null);
/** His round413 and my round414 sit at the same depth, so the gate's specifier is the same string
 *  from both — asserted below rather than assumed, by requiring the curing rev to contain it. */
const HIS_CURE_SPECIFIER = CURE_SPECIFIER;
const cureText = CURE_REV === null ? '' : atRev(CURE_REV, HIS413);
const pre414 = atRev(REV_PRECURE, MY414);
g('G3b', 'the real mechanism: my 429 key is a VERBATIM containment of a const RHS declared in the '
  + 'subject, so it is receiver-sensitive. At the rev before each file was cured, BOTH carried the '
  + 'same predicate — his copied the subject\'s bytes character-for-character, mine wrote them on a '
  + 'renamed receiver — and my key saw one of the two. Containment is a byte test',
  K !== null && my412Consts.length > 0 && CARRIER !== null
  && KP_REV !== null && CURE_REV !== null
  && atRev(KP_REV, HIS413).includes(CARRIER) === true
  && cureText.includes(CARRIER) === false && cureText.includes(HIS_CURE_SPECIFIER) === true
  && pre414.includes(CARRIER) === false
  && ABSENCE_ANY_RECEIVER.test(pre414) === true
  && recv(CARRIER) !== null && recv(pre414) !== null && recv(CARRIER) !== recv(pre414),
  K === null ? 'REFUSED: could not slice the const reader out of my 429 source'
    : `const reader sliced as its own source lines and materialised · ${my412Consts.length} const `
      + `RHS(s) of length >= ${K.MIN_RHS} in the subject, of which ${carriers.length} carry the `
      + `absence test on some receiver [${carriers.map((c) => c.name).join(', ')}] · the carrier is `
      + `the one my 429 output actually published, \`${publishedHit?.name}\` = "${CARRIER}" · `
      + `KNOWN POSITIVE at the DERIVED pre-cure rev of his file ${KP_REV?.slice(0, 8)}: contained `
      + `verbatim · his cure at ${CURE_REV?.slice(0, 8)} both removes it and adds `
      + `"${HIS_CURE_SPECIFIER}": ${!cureText.includes(CARRIER)
        && cureText.includes(HIS_CURE_SPECIFIER)} · MY round414 at its own pre-cure rev carries `
      + `the predicate (${ABSENCE_ANY_RECEIVER.test(pre414)}) but NOT those bytes `
      + `(${pre414.includes(CARRIER)}) — subject declares it on "${recv(CARRIER)}", round414 wrote `
      + `it on "${recv(pre414)}". That rename is the whole of my blindness`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// P3 — the consequence. Two keys were published under one label, and they are not one population
// measured twice. Every hit my key found is read out of my OWN recorded output and handed to the
// shape HIS key is built on (340 — compare member lists, not counts).
// ───────────────────────────────────────────────────────────────────────────────────────────────
const myHitsHisShape = ABSENCE_ANY_RECEIVER === null ? []
  : myHits.filter((h) => ABSENCE_ANY_RECEIVER.test(h.rhs));
const MY_PUBLISHED = Number((/^ *(\d+) hits — instruments introduced by Theseus/m.exec(r429out)
  ?? [null, NaN])[1]) + Number((/^ *(\d+) hits — instruments introduced by Daedalus/m.exec(r429out)
  ?? [null, NaN])[1]);
p('P3', 'the twelve and the seven are TWO KEYS, not one class counted twice: mine is a verbatim '
  + 'containment of a copied const RHS, his is the absence-test shape, and the overlap is ONE hit '
  + 'of my twelve. Handing every hit my own key published to the shape his key is built on, only '
  + 'the member we both already knew about comes back — so neither published figure is the size '
  + 'of the class, and "12 instances" names a population that does not exist',
  myHits.length === MY_PUBLISHED && myHits.length > 0 && myHitsHisShape.length === 1,
  `hits parsed out of my own recorded output: ${myHits.length} · my published total: `
  + `${MY_PUBLISHED} (parsed, not retyped) · of those, carrying the absence-test shape his key `
  + `reads: ${myHitsHisShape.length} [${myHitsHisShape.map((h) => h.name).join(', ')}] · the other `
  + `${myHits.length - myHitsHisShape.length} are copied regex literals and arrow bodies — a `
  + `shape his key cannot see at all, exactly as mine could not see his receiver rename`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G4 — his three mutants are each the single-variable edit they claim, VERIFIED under the derived
// convention rather than taken on the filename.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const M1 = await import(`../../../${HIS430}mutant-m1-refused-false-on-success.sliced.mjs`);
const M2 = await import(`../../../${HIS430}mutant-m2-refusal-key-renamed.sliced.mjs`);
const M3 = await import(`../../../${HIS430}mutant-m3-control-message-reworded.sliced.mjs`);
const convOf = (mod) => conventionOf(mod.topLevelTernary.toString());
const C1 = convOf(M1);
const C2 = convOf(M2);
const C3 = convOf(M3);
const shapeStr = (c) => (Array.isArray(c.answer) ? `answer [${c.answer}] refusal [${c.refusal}]`
  : `REFUSED: ${c.refused}`);
const m2Sentinels = Array.isArray(C2.refusal)
  ? [...new Set(C2.refusal.flatMap((s) => s.split(',')))] : [];
g('G4', 'his M1 / M2 / M3 are the three edits they claim to be, each read off the mutant\'s OWN '
  + 'returns: M1 makes the answer and refusal shapes overlap (the convention refuses), M2 renames '
  + 'the sentinel and leaves the answer shape untouched, M3 moves the convention not at all',
  typeof C1.refused === 'string' && C1.refused.includes(SENTINEL ?? '\u0000')
  && m2Sentinels.length === 1 && m2Sentinels[0] !== SENTINEL
  && `${C2.answer}` === `${LIVE_CONV.answer}`
  && `${C3.answer}` === `${LIVE_CONV.answer}` && `${C3.refusal}` === `${LIVE_CONV.refusal}`,
  `M1 → ${shapeStr(C1)} · M2 → ${shapeStr(C2)} (sentinel "${SENTINEL}" → "${m2Sentinels[0]}", `
  + `answer shape unchanged: ${`${C2.answer}` === `${LIVE_CONV.answer}`}) · M3 → ${shapeStr(C3)} `
  + `(byte-identical to LIVE: ${JSON.stringify(C3.answer) === JSON.stringify(LIVE_CONV.answer)
    && JSON.stringify(C3.refusal) === JSON.stringify(LIVE_CONV.refusal)})`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G5 — the site. Its one input, sliced out of my round414 source rather than re-typed.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const s414 = read(MY414);
const r410Match = /const R410 = '([^']+)'/.exec(s414);
const lineMatch = /r\.path === R410 && r\.line === (\d+)/.exec(s414);
const R410 = r410Match === null ? null : r410Match[1];
const SITE_LINE = lineMatch === null ? null : Number(lineMatch[1]);
const siteOf = (mod) => mod.ROWS.find((r) => r.path === R410 && r.line === SITE_LINE);
g('G5', 'the one input my round414 G2 drives is sliced out of my 414 source — subject path and '
  + 'line both — and it resolves to exactly one row in the reader\'s own population',
  R410 !== null && SITE_LINE !== null && siteOf(LIVE) !== undefined
  && LIVE.ROWS.filter((r) => r.path === R410 && r.line === SITE_LINE).length === 1,
  R410 === null ? 'REFUSED: could not slice the subject path out of my 414 source'
    : `subject ${R410}:${SITE_LINE} (both sliced, neither typed) · rows matching: `
      + `${LIVE.ROWS.filter((r) => r.path === R410 && r.line === SITE_LINE).length} of `
      + `${LIVE.ROWS.length}`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// The reach grid. OLD = the predicate my round414 line 133 carried. NEW = the derived classifier.
// Both evaluated at the SITE's own input, under each subject, with the full in-situ claim beside
// the conjunct so the reading is reach and not just the conjunct's own value.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const DRIVE5_OUT = (/const DRIVE5_OUT = '([^']+)'/.exec(s414) ?? [])[1] ?? null;
const d5 = DRIVE5_OUT === null ? '' : read(DRIVE5_OUT);
const spanOf = (tag) => {
  const m = new RegExp(`${tag} ("(?:[^"\\\\]|\\\\.)*")`).exec(d5);
  return m === null ? null : JSON.parse(m[1]);
};
const want = { test: spanOf('test'), cons: spanOf('cons'), alt: spanOf('alt') };

/** The OLD verdict, expressed through the DERIVED sentinel so no convention is re-typed here. */
const oldSaysAnswer = (v) => v !== null && v[SENTINEL] === undefined;
const newSaysAnswer = (v, conv) => classify(v, conv) === 'ANSWER';
const spansMatch = (v) => v !== null && v.test === want.test && v.cons === want.cons
  && v.alt === want.alt;

const cell = (label, mod, conv) => {
  const site = siteOf(mod);
  const v = site === undefined ? null : mod.topLevelTernary(mod.contRaw(site.d));
  const old = oldSaysAnswer(v);
  const nw = newSaysAnswer(v, conv);
  return {
    label,
    keys: v === null ? '(null)' : keyOf(v),
    old,
    nw,
    oldClaim: old && spansMatch(v),
    newClaim: nw && spansMatch(v),
    reason: Array.isArray(conv.answer) ? `classified ${classify(v, conv)}`
      : `convention REFUSED: ${conv.refused}`,
  };
};
const GRID = [cell('LIVE', LIVE, LIVE_CONV), cell('M1', M1, C1), cell('M2', M2, C2),
  cell('M3', M3, C3)];
say('  ── reach grid at the cured site, one variable per row ───────────────────────────────────');
for (const c of GRID) {
  say(`     ${c.label.padEnd(5)} result keys {${c.keys}} · OLD says ANSWER ${String(c.old).padEnd(5)}`
    + ` · NEW says ANSWER ${String(c.nw).padEnd(5)} · in-situ claim OLD ${String(c.oldClaim).padEnd(5)}`
    + ` NEW ${String(c.newClaim).padEnd(5)} · ${c.reason}`);
}
say('');

const live = GRID[0];
const m1 = GRID[1];
const m2 = GRID[2];
const m3 = GRID[3];

g('G6', 'the grid is a reading and not "any edit moves something": the CONTROL row M3 moves '
  + 'nothing at all under either predicate, and the LIVE row has both predicates agreeing and '
  + 'correct — so every difference below is the convention moving',
  live.old === true && live.nw === true && live.oldClaim === true && live.newClaim === true
  && m3.old === live.old && m3.nw === live.nw && m3.oldClaim === live.oldClaim
  && m3.newClaim === live.newClaim && m3.keys === live.keys,
  `LIVE: OLD ${live.old} NEW ${live.nw} claim OLD ${live.oldClaim} NEW ${live.newClaim} · `
  + `M3 CONTROL identical on all four: `
  + `${m3.old === live.old && m3.nw === live.nw && m3.oldClaim === live.oldClaim
    && m3.newClaim === live.newClaim}`);

p('P1', 'M2 — the sentinel renamed, the cell where his grid shows the OLD predicate reading a '
  + 'REFUSAL as an answer — is INERT AT MY SITE: every one of the four readings is unchanged from '
  + 'LIVE, because the only input this site drives takes the answer path, whose shape a rename of '
  + 'the refusal key does not touch. The dangerous direction cannot reach line 133 at all',
  m2.old === live.old && m2.nw === live.nw && m2.oldClaim === live.oldClaim
  && m2.newClaim === live.newClaim,
  `M2 vs LIVE — OLD ${m2.old}/${live.old} · NEW ${m2.nw}/${live.nw} · in-situ OLD `
  + `${m2.oldClaim}/${live.oldClaim} · NEW ${m2.newClaim}/${live.newClaim} · result keys `
  + `{${m2.keys}} vs {${live.keys}} · M2's convention re-derived the sentinel as `
  + `"${m2Sentinels[0]}" and the site never produces that shape`);

p('P2', 'M1 — the success return also carrying the sentinel — DOES reach my site, and in the SAFE '
  + 'direction: the OLD predicate goes FALSE on a true answer, so the leg reddens rather than '
  + 'over-reporting. What the cure buys here is the REASON: the derived reader names the shared-key '
  + 'condition, where the OLD leg\'s red is indistinguishable from a span mismatch',
  m1.old === false && live.old === true && m1.oldClaim === false
  && typeof C1.refused === 'string' && C1.refused.includes(SENTINEL ?? '\u0000'),
  `M1 — OLD says ANSWER ${m1.old} (LIVE ${live.old}) · in-situ claim OLD ${m1.oldClaim} · `
  + `NEW ${m1.newClaim} · and the reason the NEW reader gives: "${C1.refused}" · the OLD leg gives `
  + `no reason at all — its detail line reports span equality, which is TRUE here`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G7 — defect 1 in the module I imported: the answer leg is keyed on `.slice(`, not on the input.
// Three probes, one variable each. These carry the property directly: they ARE functions handed to
// `conventionOf`, not analogies of one.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const NOT_THE_INPUT = 'abcdef';
const probeInput = (s) => {
  if (s === '') return null;
  if (s.length < 2) return { tooShort: 'the subject is shorter than two characters' };
  return { span: s.slice(0, 1) };
};
const probeConstant = (s) => {
  if (s === '') return null;
  if (s.length < 2) return { tooShort: 'the subject is shorter than two characters' };
  return { span: NOT_THE_INPUT.slice(0, 1) };
};
const probeNoSliceCall = (s) => {
  if (s === '') return null;
  if (s.length < 2) return { tooShort: 'the subject is shorter than two characters' };
  return { span: s.charAt(0) };
};
const cInput = conventionOf(probeInput.toString());
const cConst = conventionOf(probeConstant.toString());
const cNoSlice = conventionOf(probeNoSliceCall.toString());
const DOC_SENTENCE = 'slices the function\'s own input';
const docSaysInput = read(`${HIS430}refusal-convention.mjs`).includes(DOC_SENTENCE);
g('G7', 'the answer-shape leg is keyed on a `.slice(` call appearing in a value and has no model '
  + 'of the function\'s parameter, so it is BOTH looser and tighter than the sentence beside it: a '
  + 'value slicing a module constant and reading the input NOWHERE is admitted as the answer '
  + 'shape, and a value derived from the input without that call is refused',
  docSaysInput
  && Array.isArray(cInput.answer)
  && Array.isArray(cConst.answer)
  && typeof cNoSlice.refused === 'string',
  `the module's own docblock says the answer shape is the one that "${DOC_SENTENCE}": `
  + `${docSaysInput} · probe slicing THE INPUT → ${shapeStr(cInput)} · probe slicing A MODULE `
  + `CONSTANT, input untouched → ${shapeStr(cConst)} ← admitted, and the sentence is false of it `
  + `· probe derived from the input via charAt, no slice call → ${shapeStr(cNoSlice)} ← excluded · `
  + 'DIRECTION OF ERROR: the over-admission is the one that matters — this module\'s whole value '
  + 'is refusing when no absence test can work, and a looser answer leg refuses LESS often than '
  + 'the sentence promises');

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G8 — defect 2: the "every value is a message" leg is not comment-blind.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const MARKER = 'inclusive of the first character';
const probeCommentInValue = (s) => {
  if (s === '') return null;
  if (s.length < 2) return { tooShort: 'the subject is shorter than two characters' };
  return { span: s.slice(0, 1) /* inclusive of the first character */ };
};
const probeCommentOutside = (s) => {
  if (s === '') return null;
  if (s.length < 2) return { tooShort: 'the subject is shorter than two characters' };
  /* inclusive of the first character */
  return { span: s.slice(0, 1) };
};
const TOSTRING_KEEPS_COMMENTS = probeCommentInValue.toString().includes(MARKER)
  && probeCommentOutside.toString().includes(MARKER);
const cInValue = conventionOf(probeCommentInValue.toString());
const cOutside = conventionOf(probeCommentOutside.toString());
g('G8', 'the "every value is a message" leg reads masked-differs-from-raw, and the shared masker '
  + 'blanks COMMENT bodies as well as string bodies — so one comment INSIDE an answer return value '
  + 'reads as a message, flips the shape to a refusal, and leaves the subject with no answer shape '
  + 'at all. The same comment OUTSIDE the return expression is the control and moves nothing',
  TOSTRING_KEEPS_COMMENTS
  && typeof cInValue.refused === 'string'
  && Array.isArray(cOutside.answer)
  && `${cOutside.answer}` === `${cInput.answer}`
  && `${cOutside.refusal}` === `${cInput.refusal}`,
  `precondition asserted rather than assumed — Function.prototype.toString carries the comment: `
  + `${TOSTRING_KEEPS_COMMENTS} · comment INSIDE the answer value → ${shapeStr(cInValue)} · `
  + `CONTROL, same comment one line above the return → ${shapeStr(cOutside)}, identical to the `
  + `uncommented probe: ${`${cOutside.answer}` === `${cInput.answer}`} · DIRECTION OF ERROR: `
  + `over-refusal, the safe direction — but it makes the module unusable on any subject that `
  + `comments a return value, and no cell in his M1/M2/M3 grid varies a comment`);

// ───────────────────────────────────────────────────────────────────────────────────────────────
// G9 — the cure landed, read by a detector graded both ways, and my own comments do not re-trip it.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const preText = atRev(REV_PRECURE, MY414);
const PROPERTY_PIN = SENTINEL !== null && !preText.includes(CURE_SPECIFIER);
const ABSENCE_RE = SENTINEL === null ? null
  : new RegExp(`\\.${SENTINEL}\\s*===\\s*undefined`, 'g');
const hits = (text) => (ABSENCE_RE === null ? -1 : (text.match(ABSENCE_RE) ?? []).length);
const blind = (text) => stripSource(text, false);
const liveText = read(MY414);
const preHits = hits(blind(preText));
const postHits = hits(blind(liveText));
const postHitsRaw = hits(liveText);
g('G9', 'the cure landed: the derived absence-test probe finds the site on the PRE-CURE text and '
  + 'nothing on the cured text, and finds nothing on the cured text RAW either — so the cure\'s '
  + 'own comments do not quote the spelling they remove (371/383, which caught us both)',
  PROPERTY_PIN && preHits === 1 && postHits === 0 && postHitsRaw === 0
  && liveText.includes(CURE_SPECIFIER),
  `pre-cure rev pinned by PROPERTY — its text lacks "${CURE_SPECIFIER}": ${PROPERTY_PIN} (a wrong `
  + `rev reddens here rather than inverting once the cure is committed) · probe /`
  + `${ABSENCE_RE === null ? '—' : ABSENCE_RE.source}/ built from the DERIVED sentinel · pre-cure, `
  + `comment-blind: ${preHits} · cured, comment-blind: ${postHits} · cured, RAW: ${postHitsRaw} · `
  + `the cured text imports the gate: ${liveText.includes(CURE_SPECIFIER)}`);

const verdictLines = (text) => text.split('\n')
  .filter((l) => /^(GATE|PREDICTIONS):/.test(l)).join(' | ');
const preV = verdictLines(read(PRECURE_OUT));
const postV = verdictLines(read(POSTCURE_OUT));
g('G10', 'the cure changes no verdict my round414 publishes: its GATE and PREDICTIONS lines are '
  + 'identical to a baseline recorded BEFORE the edit was written',
  preV === postV && preV !== '',
  `pre-cure: ${preV || '(none found)'} · post-cure: ${postV || '(none found)'} · identical: `
  + `${preV === postV} · recorded at ${PRECURE_OUT} and ${POSTCURE_OUT}`);

say('');
const redLegs = legs.filter((x) => x.ok !== true);
say(`GATE: ${gateOK}   (${legs.length} leg(s)`
  + `${redLegs.length ? `, RED: ${redLegs.map((x) => x.id).join(' | ')}` : ''})`);
const refuted = preds.filter((x) => x.ok !== true);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`
  + `${refuted.length ? `: ${refuted.map((x) => x.id).join(' | ')}` : ''}`);
if (gateOK !== true) process.exitCode = 1;
