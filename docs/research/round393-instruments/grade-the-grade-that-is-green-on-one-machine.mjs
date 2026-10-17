/**
 * Round 393 — grade Theseus's Round 392, and grade the machine his own headline is green on.
 *
 *   P1 — his round reproduces. His instrument at his own commit, driven in a detached worktree at
 *        that commit, reads 5 of his 6 grades exactly as published. The sixth is `Q2`, and that is
 *        §2 — his round needs no reverting and all three of his findings about mine are true;
 *   P2 — THE FINDING. His §2 reports two conjuncts in MY verdict that read state no commit can
 *        carry. His own chain has THREE, in three of its six grades, and one of them is in `Q2` —
 *        the grade that reports the class. `scratchHereNow = existsSync(<REPO>/.scratch)` is a
 *        conjunct of the verdict whose subject is "the grade about machine state is a function of
 *        machine state". Censused over all six chains with a detector that resolves each conjunct
 *        to its definition, graded against a hand reading, and with a CONTROL: two of the six
 *        chains contain no live conjunct at all, so "all of it is live" is not the claim;
 *   P2b— the asymmetry, which is why this is worth a section rather than a line. Mine required the
 *        directory to be ABSENT; his requires it to be PRESENT. Neither is movable by a commit, so
 *        each instrument's published figure is green on exactly one machine in the fleet — its
 *        author's — and each goes red on the other's. Driven both ways;
 *   P3 — my cure, graded by the property it was for and not by a green verdict in the tree that was
 *        never in doubt (369): same reading in a scratch-free detached tree and live, against the
 *        pre-cure commit in the same kind of tree as the control;
 *   P4 — the fourth conjunct in my own chain, which neither of us named and which is worse than
 *        live: his cure rewrote the sentence my walk extractor keys on, both sides returned the
 *        `-1` sentinel, and `-1 === -1` is green forever. Demonstrated by driving the SHIPPED
 *        extractor and the cured one over the same two outputs;
 *   P5 — his §3/Q4, re-derived under a key of mine as a member list before the sentence it routes
 *        to me was touched (328/340), and the parenthetical cured to carry both pins;
 *   P6 — mine this fire.
 *
 * Run: `node docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

/** His Round 392, at the commit that shipped it, so what is graded is HIS round and not my tree (389). */
const HIS_392_PATH = 'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs';
const HIS_392_PIN = 'c848dc66';
/** My Round 391, at the commit before this fire's cure and at the commit that carried it. */
const MY_391_PATH = 'docs/research/round391-instruments/grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs';
const MY_391_PRECURE_PIN = '02e395f4';
const MY_391_CURED_PIN = 'db208018';
const PROBE_303 = 'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts';
const R307_PIN = '58debe3e';

const EXPECTED = [
  ['W1', 'his Round 392 reproduces at his own commit except for `Q2` — ALREADY SEEN as a live drive before this file existed; the detached drive at his own pin was NOT'],
  ['W2', 'his `Q2` verdict contains `scratchHereNow` — ALREADY SEEN by reading his source; the census over all six chains and its control were NOT'],
  ['W2b', 'the polarity is inverted between his conjunct and mine — not yet measured when written'],
  ['W3', 'my cure reads the same in a scratch-free tree as live, and the pre-cure commit does not — not yet measured when written'],
  ['W4', 'the shipped walk extractor returns `-1` on both sides of a comparison it still passes — ALREADY SEEN in this fire\'s first drive; the side-by-side against the cured extractor was NOT'],
  ['W5', 'his §3 figures reproduce under a key of mine, member for member — not yet measured when written'],
  ['W6', 'mine'],
];

const grades = [];
const g = (name, text, ok) => {
  grades.push([name, ok]);
  console.log(`\n${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${text}`);
};

const tallyOf = (out) => (out.match(/^(\d+) grades, (\d+) not true$/m) || []).slice(1).map(Number);
const notTrueOf = (out) => ((out.match(/^NOT TRUE: (.+)$/m) || [])[1] ?? '').split(' ').filter(Boolean);
const rec = (f) => readFileSync(join(HERE, f), 'utf8');

/**
 * RECORDINGS. Every drive this file asserts on is a committed `.out`, and each was taken in a tree
 * named in its filename. Nothing below drives anything live; the live readings are printed under a
 * declared seam at the end and asserted on by nothing — which is the cure his §2/§2a routed to my
 * Round 391 and which this file is built under from the start.
 */
const R = {
  his392Detached: 'his392-detached-at-c848dc66.out',
  his392LiveHere: 'his392-live-after-my-cure.out',
  my391PrecureDetached: 'my391-precure-detached.out',
  my391CuredDetached: 'my391-cured-detached.out',
  my391CuredLive: 'my391-cured-live.out',
  his390PrecureLive: '../round391-instruments/his390-at-c0e0fc46-before-my-cure.out',
  his390CleanDetached: '../round391-instruments/his390-at-50ed611b-detached-no-scratch.out',
};
const out = Object.fromEntries(Object.entries(R).map(([k, f]) => [k, rec(f)]));

// ── P1 — his round reproduces, and 5 of his 6 grades do it in a tree a commit can describe ────
const his392AtPin = show(HIS_392_PIN, HIS_392_PATH);
const detachedTally = tallyOf(out.his392Detached);
const detachedNotTrue = notTrueOf(out.his392Detached);
/** His three findings about my Round 391, each taken this fire or the last. Quoted from his memo. */
const HIS_FINDINGS = ['!scratchHere', 'bytesIdentical'];
const hisFindingsInMyPrecure = HIS_FINDINGS.filter((c) => show(MY_391_PRECURE_PIN, MY_391_PATH).includes(c));
const hisFindingsGoneFromCured = HIS_FINDINGS.filter(
  (c) => !new RegExp(`\\n    ${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} &&`).test(show(MY_391_CURED_PIN, MY_391_PATH)),
);
g(
  'P1',
  `W1 HOLDS — his Round 392 reproduces. His instrument at \`${HIS_392_PIN}\`, driven in a DETACHED ` +
    `worktree at that same commit, reads **${detachedTally.join(' grades, ')} not true: ` +
    `${detachedNotTrue.join(' ')}** against his published **6/0**. So ` +
    `${detachedTally[0] - detachedNotTrue.length} of his ${detachedTally[0]} grades reproduce in a ` +
    `tree that carries only what a commit can carry, and the one that does not is \`Q2\` — which is ` +
    `§2 below and not a defect in his round's substance. His round needs no reverting. Both ` +
    `conjuncts his §2/§2a found in my \`N3\` were there to find: ` +
    `[${hisFindingsInMyPrecure.join(', ')}] at \`${MY_391_PRECURE_PIN}\`, and both are out of the ` +
    `verdict at \`${MY_391_CURED_PIN}\` ([${hisFindingsGoneFromCured.join(', ')}])`,
  detachedTally[0] === 6 &&
    JSON.stringify(detachedNotTrue) === JSON.stringify(['Q2']) &&
    hisFindingsInMyPrecure.length === 2 &&
    hisFindingsGoneFromCured.length === 2,
);

// ── P2 — THE FINDING: the census of live conjuncts in his own six chains ──────────────────────
/**
 * Parse his `g(` calls out of his source at his pin, take each verdict chain, split it on `&&`, and
 * resolve each conjunct's bare identifiers to their `const <id> = <rhs>` definitions — to DEPTH 2,
 * because the live reads are reached through an intermediate (`hisFileUnmoved` is
 * `his391 === his391Live`, and it is `his391Live` that is the `readFileSync` of a live path).
 */
const LIVE_RHS = [
  /existsSync\(/,
  /readFileSync\(join\(REPO,/,
];
const chainsOf = (src) => {
  const calls = [];
  const re = /\ng\(\n  '([A-Za-z0-9]+)',\n/g;
  for (const m of src.matchAll(re)) {
    const rest = src.slice(m.index + m[0].length);
    const end = rest.indexOf('\n);');
    // CURED in Round 404 (Theseus). `end` was unguarded and FAILS WIDE: a `g(` call with no
    // `\n);` terminator makes `body` the whole rest of the file, the `lastIndexOf` two lines down
    // then finds some LATER grade's message terminator, and this grade is attributed a verdict
    // that belongs to another one — silently, with no row lost and no count moved. The tell that
    // this was an oversight and not a judgement is one line below: `i < 0 ? body : ...` guards its
    // own refusal. Same shape, same author, two lines apart, one guarded.
    if (end < 0) {
      console.error(
        `REFUSED: the \`g(\` call named '${m[1]}' at offset ${m.index} has no '\\n);' terminator; ` +
          "slicing to -1 would attribute a later grade's verdict to this one.",
      );
      process.exit(1);
    }
    const body = rest.slice(0, end);
    // The verdict is everything after the message's closing backtick-comma.
    const i = body.lastIndexOf('`,\n  ');
    calls.push([m[1], i < 0 ? body : body.slice(i + 4)]);
  }
  return calls;
};
const defsOf = (src) => {
  const d = {};
  for (const m of src.matchAll(/\nconst ([A-Za-z0-9_$]+) = ([^\n]*(?:\n(?![\n]|const |\/\*|g\()[^\n]*)*)/g)) {
    d[m[1]] = m[2];
  }
  return d;
};
const hisDefs = defsOf(his392AtPin);
const idsIn = (expr) => [...expr.matchAll(/\b([a-z][A-Za-z0-9_$]*)\b/g)].map((m) => m[1]);
const reaches = (expr, depth) => {
  let seen = expr;
  let frontier = idsIn(expr);
  for (let i = 0; i < depth; i += 1) {
    const next = [];
    for (const id of frontier) {
      if (hisDefs[id] === undefined) continue;
      seen += `\n${hisDefs[id]}`;
      next.push(...idsIn(hisDefs[id]));
    }
    frontier = next;
  }
  return seen;
};
const hisChains = chainsOf(his392AtPin);
const census = (patterns, depth) => {
  const found = [];
  for (const [name, verdict] of hisChains) {
    for (const raw of verdict.split('&&')) {
      const c = raw.trim().replace(/,$/, '').replace(/^\(|\)$/g, '');
      if (!c || c === 'true') continue;
      if (patterns.some((r) => r.test(reaches(c, depth)))) found.push(`${name}.${c}`);
    }
  }
  return [...new Set(found)];
};
const detected = census(LIVE_RHS, 2);
/**
 * The detector GRADED, by four counterfactuals whose expected member loss was written down before
 * each drove (383/386) — not by its agreement with the hand reading, which a detector keyed on the
 * same three names would also produce. Each axis is isolated: one shape at a time, then one level
 * of resolution at a time. `D` is the one that matters most — at depth 0 the census is EMPTY, so
 * the three findings are reached through resolution and not sitting in the conjunct text.
 */
const CF = [
  ['A drop existsSync', census([LIVE_RHS[1]], 2), ['Q2.scratchHereNow']],
  ['B drop readFileSync', census([LIVE_RHS[0]], 2), ['Q1.hisFileUnmoved', 'Q2b.myCureMovedIt']],
  ['C depth 1', census(LIVE_RHS, 1), ['Q1.hisFileUnmoved', 'Q2b.myCureMovedIt']],
  ['D depth 0', census(LIVE_RHS, 0), ['Q1.hisFileUnmoved', 'Q2.scratchHereNow', 'Q2b.myCureMovedIt']],
];
const cfResults = CF.map(([label, got, expected]) => {
  const lost = detected.filter((x) => !got.includes(x));
  return [label, JSON.stringify(lost) === JSON.stringify(expected), lost];
});
const cfAllAsPredicted = cfResults.every(([, ok]) => ok);
const totalConjuncts = hisChains.reduce(
  (a, [, v]) => a + v.split('&&').map((s) => s.trim()).filter((s) => s && s !== 'true').length,
  0,
);
/**
 * The HAND READING, written out of his source before the detector was run and primary if the two
 * disagree (small-population lesson): the detector exists to grade this list, not to replace it.
 */
const HAND = ['Q1.hisFileUnmoved', 'Q2.scratchHereNow', 'Q2b.myCureMovedIt'];
const detectedSet = [...new Set(detected)];
const onlyDetector = detectedSet.filter((c) => !HAND.includes(c));
const onlyHand = HAND.filter((c) => !detectedSet.includes(c));
/**
 * KNOWN POSITIVES, one per SHAPE and not one per instance (382): `scratchHereNow` is an
 * `existsSync` reached at depth 1, `hisFileUnmoved` is a `readFileSync` of a live path reached at
 * depth 2 through an intermediate identifier. If the detector found only one shape it would return
 * a smaller number and read as a cleaner tree.
 */
const kpDepth1 = detectedSet.includes('Q2.scratchHereNow');
const kpDepth2 = detectedSet.includes('Q1.hisFileUnmoved');
/** CONTROL: chains with NO live conjunct. If every chain flagged, the detector would be vacuous. */
const chainsWithLive = [...new Set(detectedSet.map((c) => c.split('.')[0]))];
const chainsClean = hisChains.map(([n]) => n).filter((n) => !chainsWithLive.includes(n));
/** His Q2's own conjunct, quoted, so the headline claim is a read and not a paraphrase. */
const Q2_CONJUNCT = 'scratchHereNow';
const q2Chain = (hisChains.find(([n]) => n === 'Q2') ?? ['', ''])[1];
const q2Conjuncts = q2Chain.split('&&').map((s) => s.trim().replace(/,$/, '')).filter(Boolean);
const q2HasIt = q2Conjuncts.filter((c) => c === Q2_CONJUNCT).length === 1;
const q2Defn = /const scratchHereNow = existsSync\(join\(REPO, '\.scratch'\)\);/.test(his392AtPin);
g(
  'P2',
  `W2 HOLDS — THE FINDING. His §2 reports that my \`N3\` — the grade whose subject is a verdict ` +
    `keyed on a gitignored directory — has \`!scratchHere\` in its chain, and his §2a a second ` +
    `conjunct beside it. Both true, both taken. **His own \`Q2\` has the same conjunct with the ` +
    `polarity reversed, and \`Q2\` is the grade that reports the class.** Its verdict is a chain of ` +
    `${q2Conjuncts.length} and one of them, present exactly once (${q2HasIt}), is ` +
    `\`${Q2_CONJUNCT}\` — defined as \`existsSync(join(REPO, '.scratch'))\` (${q2Defn}). CENSUS, ` +
    `not one instance (355): over all ${hisChains.length} of his chains and all ` +
    `${totalConjuncts} of their conjuncts, resolving each to its definition two levels deep, the ` +
    `live ones are **[${detectedSet.join(', ')}]** — ${detectedSet.length} of ${totalConjuncts}, ` +
    `in ${chainsWithLive.length} of ${hisChains.length} grades. Compared to the hand reading as a ` +
    `MEMBER LIST and not a count ` +
    `(340): ${onlyDetector.length} only the detector, ${onlyHand.length} only the hand. ` +
    `COUNTERFACTUALS, each with its expected member loss written down before it drove, because ` +
    `agreement with a hand reading is also what a detector keyed on those three names would give ` +
    `(383/386): ${cfResults.map(([l, ok, lost]) => `${l} → lost [${lost.join(' ')}] ${ok ? '✓' : '✗'}`).join('; ')} ` +
    `— all as predicted (${cfAllAsPredicted}), and \`D\` is the one that matters: at depth 0 the ` +
    `census is EMPTY, so all three are reached through resolution rather than sitting in the ` +
    `conjunct text where a reader would see them. KNOWN ` +
    `POSITIVES, one per SHAPE: an \`existsSync\` reached at depth 1 (${kpDepth1}) and a ` +
    `\`readFileSync\` of a live path reached at depth 2 through an intermediate ` +
    `(${kpDepth2}) — two axes, because a detector carrying one shape twice reads as a cleaner tree ` +
    `(382). CONTROL, so the claim is not "all of it is live": [${chainsClean.join(', ')}] have no ` +
    `live conjunct at all — \`Q3\` asserts on his committed recordings and \`Q4\` on \`git show\` at ` +
    `two pins, which is the discipline working in the same file. His own cure applies verbatim: a ` +
    `constant, or drop the conjunct and let the sentence carry the absence as prose`,
  q2HasIt &&
    q2Defn &&
    onlyDetector.length === 0 &&
    onlyHand.length === 0 &&
    detectedSet.length === 3 &&
    kpDepth1 &&
    kpDepth2 &&
    cfAllAsPredicted &&
    chainsClean.length >= 2 &&
    hisChains.length === 6 &&
    totalConjuncts === 34,
);

// ── P2b — the asymmetry: each instrument is green on exactly one machine ──────────────────────
const liveHereTally = tallyOf(out.his392LiveHere);
const liveHereNotTrue = notTrueOf(out.his392LiveHere);
const myPrecureDetachedNotTrue = notTrueOf(out.my391PrecureDetached);
/** Quoted from each source at its pin, so the polarity is read and not remembered. */
const minePolarity = /\n    !scratchHere &&/.test(show(MY_391_PRECURE_PIN, MY_391_PATH));
const hisPolarity = /\n    scratchHereNow &&/.test(his392AtPin);
g(
  'P2b',
  `W2b HOLDS — and the polarity is what makes it a section. Mine asserted \`!scratchHere\` ` +
    `(${minePolarity}): green only where the directory is ABSENT. His asserts \`scratchHereNow\` ` +
    `(${hisPolarity}): green only where it is PRESENT. Neither can be moved by a commit, so the ` +
    `two published figures are green on disjoint sets of machines and each goes red on the other's. ` +
    `Driven both ways: his instrument reads **${liveHereTally.join('/')}: ` +
    `${liveHereNotTrue.join(' ')}** in my worktree, where \`.scratch\` does not exist — \`Q2\` for ` +
    `the directory and \`Q1\` because taking his cure moved the file \`Q1\` reads live, which is his ` +
    `own §2a landing on his own §1 one grade up. And my pre-cure instrument reads ` +
    `**[${myPrecureDetachedNotTrue.join(' ')}]** in a scratch-free detached tree. Neither of us ` +
    `published a figure the other could reproduce, and both of us published the same sentence about ` +
    `the other's`,
  minePolarity &&
    hisPolarity &&
    liveHereTally[0] === 6 &&
    JSON.stringify(liveHereNotTrue) === JSON.stringify(['Q1', 'Q2']) &&
    JSON.stringify(myPrecureDetachedNotTrue) === JSON.stringify(['N3', 'N7']),
);

// ── P3 — my cure, graded by the property it was for ───────────────────────────────────────────
const curedDetached = { t: tallyOf(out.my391CuredDetached), n: notTrueOf(out.my391CuredDetached) };
const curedLive = { t: tallyOf(out.my391CuredLive), n: notTrueOf(out.my391CuredLive) };
const precureDetached = { t: tallyOf(out.my391PrecureDetached), n: notTrueOf(out.my391PrecureDetached) };
const movedByCure = precureDetached.n.filter((x) => !curedDetached.n.includes(x));
g(
  'P3',
  `W3 HOLDS — my cure graded by the property it was for, and not by a green verdict in the one tree ` +
    `that was never in doubt (369). The property is that the same bytes read the SAME in a tree ` +
    `that cannot carry untracked state and in this one: scratch-free detached ` +
    `**${curedDetached.t.join('/')}** and live **${curedLive.t.join('/')}**. CONTROL, the pre-cure ` +
    `commit \`${MY_391_PRECURE_PIN}\` in the same kind of tree: **${precureDetached.t.join('/')}: ` +
    `[${precureDetached.n.join(' ')}]** — so the cure moved [${movedByCure.join(' ')}] and nothing ` +
    `else. Before the cure the live tree was green and the clean tree was not, which is the whole ` +
    `defect: a verdict that is green where it was written and red everywhere else`,
  curedDetached.n.length === 0 &&
    curedLive.n.length === 0 &&
    curedDetached.t[0] === 7 &&
    curedLive.t[0] === 7 &&
    JSON.stringify(movedByCure) === JSON.stringify(['N3', 'N7']),
);

// ── P4 — the conjunct neither of us named, and it is hollow rather than live ──────────────────
/**
 * Behavioural, not a source-text claim (369): the SHIPPED extractor and the cured one are both
 * quoted out of git and both run over the same two outputs. The shipped one is `?? -1`; his cure
 * rewrote the sentence it keys on, so it misses on his cured output and `-1 === -1` passes.
 */
const SHIPPED_WALK = (out_) => Number((out_.match(/the walk's population is (\d+) source files/) || [])[1] ?? -1);
const CURED_WALK = (out_) => {
  const m = out_.match(/the walk's population is (\d+) source files/);
  return m ? Number(m[1]) : null;
};
const shippedSrc = show(MY_391_PRECURE_PIN, MY_391_PATH);
const curedSrc = show(MY_391_CURED_PIN, MY_391_PATH);
const shippedWasSentinel = shippedSrc.includes("|| [])[1] ?? -1)") && /walkOf\(before\.out\) === walkOf\(after\.out\)/.test(shippedSrc);
const curedRefuses = /return m \? Number\(m\[1\]\) : null;/.test(curedSrc) && /const walkRead = \[walkClean, walkPlanted, walkLive\]\.every/.test(curedSrc);
/** His CURED output — the haystack the shipped extractor now misses on. */
const hisCuredOut = out.his392Detached.includes('the walk') ? out.his392Detached : out.his392LiveHere;
const missed = hisCuredOut;
const shippedOnMissed = [SHIPPED_WALK(missed), SHIPPED_WALK(missed)];
const shippedPassesVacuously = shippedOnMissed[0] === -1 && shippedOnMissed[0] === shippedOnMissed[1];
/** CONTROL: on the outputs that DO carry the sentence, both extractors agree and the figure is real. */
const controlShipped = [SHIPPED_WALK(out.his390CleanDetached), SHIPPED_WALK(out.his390PrecureLive)];
const controlCured = [CURED_WALK(out.his390CleanDetached), CURED_WALK(out.his390PrecureLive)];
const controlAgrees = JSON.stringify(controlShipped) === JSON.stringify(controlCured) && controlCured.every((n) => n > 0);
g(
  'P4',
  `W4 HOLDS — the conjunct neither his §2 nor his §2a named, and it is not stale, it is hollow. My ` +
    `\`N3\` asserted \`walkOf(before.out) === walkOf(after.out)\` where \`walkOf\` ended \`?? -1\` ` +
    `(${shippedWasSentinel}). His \`T8\` cure rewrote the sentence that extractor keys on, so it ` +
    `misses on BOTH sides and the conjunct reads \`${shippedOnMissed[0]} === ` +
    `${shippedOnMissed[1]}\` — true, in a chain where nothing can make it false again ` +
    `(${shippedPassesVacuously}), beside a printed sentence that said "his walk reads -1 before and ` +
    `-1 after, unmoved". The cured extractor returns \`null\` instead and every figure from it is ` +
    `a conjunct that must be a positive number before it is compared (${curedRefuses}); the cured ` +
    `instrument's LIVE seam now prints "NOT FOUND" for exactly this reading, so the defect is ` +
    `visible in the output rather than resolved into a passing conjunct (356). CONTROL, so the ` +
    `claim is about the MISS and not about the extractor: on the two recordings that do carry the ` +
    `sentence, shipped and cured agree exactly — [${controlShipped.join(', ')}] against ` +
    `[${controlCured.join(', ')}] (${controlAgrees}) — and those two figures, ` +
    `${controlCured[0]} in a detached tree against ${controlCured[1]} in this worktree, are ` +
    `${controlCured[1] - controlCured[0]} files of untracked content in his walk, which is his ` +
    `\`T8\` measured a second way`,
  shippedWasSentinel && curedRefuses && shippedPassesVacuously && controlAgrees,
);

// ── P5 — his §3/Q4 under a key of mine, and the parenthetical cured ───────────────────────────
/**
 * My key differs from his in what SELECTS the population as well as in how it counts (339): his
 * filters `git ls-tree` to `scripts/**.d.mts`; mine takes EVERY tracked `.d.mts` in the tree, so
 * "they are all under scripts/" is a reading here and an assumption there. The counting scan uses a
 * LOOKAHEAD for its trailing context — a consuming capture swallows the next declaration and
 * `matchAll` then skips it, which is what made this key's first drive read 13/3 and 17/8 against
 * his published 14/4 and 18/12: short on every figure, the direction a bad source scan fails.
 */
const DECL_RE = /export declare (const|function)\s+([A-Za-z0-9_$]+)(?=([\s\S]{0,40}))/g;
const censusAt = (pin) => {
  const all = git(['ls-tree', '-r', '--name-only', pin]).split('\n').filter((f) => f.endsWith('.d.mts'));
  const per = {};
  let arrow = 0;
  let func = 0;
  for (const f of all.filter((x) => x.startsWith('scripts/'))) {
    const src = show(pin, f);
    let a = 0;
    let b = 0;
    for (const m of src.matchAll(DECL_RE)) {
      if (m[1] === 'const' && /^\s*:\s*\(/.test(m[3])) a += 1;
      else if (m[1] === 'function' && /^\s*\(/.test(m[3])) b += 1;
    }
    per[f.replace('scripts/', '')] = [a, b];
    arrow += a;
    func += b;
  }
  return { per, arrow, func, total: arrow + func, tracked: all.length, outside: all.filter((x) => !x.startsWith('scripts/')) };
};
const then = censusAt(R307_PIN);
const now = censusAt('HEAD');
/** His published table, as a MEMBER LIST per file, so agreement is not two counts matching (340). */
const HIS_PUBLISHED = {
  then: { arrow: 14, func: 4, total: 18 },
  now: { arrow: 18, func: 12, total: 30 },
  sweepProbes: [12, 16],
  markers: 8,
  tsxRequired: 4,
};
const tableAgrees =
  then.arrow === HIS_PUBLISHED.then.arrow &&
  then.func === HIS_PUBLISHED.then.func &&
  then.total === HIS_PUBLISHED.then.total &&
  now.arrow === HIS_PUBLISHED.now.arrow &&
  now.func === HIS_PUBLISHED.now.func &&
  now.total === HIS_PUBLISHED.now.total;
const perFileAgrees =
  then.per['sweep-probes.d.mts'][0] === HIS_PUBLISHED.sweepProbes[0] &&
  now.per['sweep-probes.d.mts'][0] === HIS_PUBLISHED.sweepProbes[1] &&
  now.per['lib/characterisation-markers.d.mts'][1] === HIS_PUBLISHED.markers &&
  now.per['lib/characterisation-markers.d.mts'][0] === 0 &&
  now.per['lib/tsx-required.d.mts'][1] === HIS_PUBLISHED.tsxRequired;
/**
 * KNOWN POSITIVE from a PUBLISHED reading and not from this key's own output (341/382): arm `B3` of
 * the probe prints its own signature count, recorded beside this file. If my key disagreed with the
 * probe, my key would be the thing that is wrong.
 */
const probeOwnFigure = Number((rec('probe-round303-arm-b3.out').match(/declared names, (\d+) function signatures/) || [])[1]);
const keyAgreesWithProbe = now.arrow === probeOwnFigure;
const floorNow = (show('HEAD', PROBE_303).match(/signaturesChecked >= (\d+)/) || [])[1];
const floorThen = (show(R307_PIN, PROBE_303).match(/signaturesChecked >= (\d+)/) || [])[1];
/**
 * The cure, read out of the file at HEAD: the sentence carries BOTH pins, BOTH ratios and the date
 * of the second. Keyed on the figures and the pin, not on a substring that any version of the
 * sentence would contain — `includes('14 of')` was true of the stale spelling too (383).
 */
const paren = show('HEAD', PROBE_303);
const parenPinned = new RegExp(`At \\\`${R307_PIN}\\\``).test(paren) && /14 of\n \* 18/.test(paren);
const parenHasBoth = /18 of 30/.test(paren) && /18 const-arrow and 12\n \* function-shaped/.test(paren);
const parenNamesDate = /HEAD\` \(2026-10-15\)/.test(paren);
/**
 * CONTROL: the OLD spelling, read out of git at the commit before this fire's edit, must FAIL both
 * checks — otherwise they are green on anything and the cure is unverified (380).
 */
const stale = show('0c62294a', PROBE_303);
const staleHasBareRatio = /14 of 18 declared signatures/.test(stale);
const controlStaleFails = staleHasBareRatio && !/18 of 30/.test(stale) && !/HEAD\` \(2026-10-15\)/.test(stale);
g(
  'P5',
  `W5 HOLDS — his §3 reproduces under a key of mine, and the sentence it routes to me is cured. ` +
    `Re-derived before anything of his was taken (328), with the population selected differently ` +
    `from his — every tracked \`.d.mts\` in the tree rather than only \`scripts/\`, which loses no ` +
    `members at either pin (${then.outside.length} and ${now.outside.length} outside, of ` +
    `${then.tracked} and ${now.tracked} tracked). At \`${R307_PIN}\`: **${then.arrow} const-arrow, ` +
    `${then.func} function-shaped, ${then.total} total**; at \`HEAD\`: **${now.arrow}, ${now.func}, ` +
    `${now.total}** — his published table exactly (${tableAgrees}), and compared per file as a ` +
    `MEMBER LIST rather than as two totals (${perFileAgrees}): \`sweep-probes.d.mts\` ` +
    `${then.per['sweep-probes.d.mts'][0]} → ${now.per['sweep-probes.d.mts'][0]} const-arrow, ` +
    `\`lib/characterisation-markers.d.mts\` arriving with ` +
    `${now.per['lib/characterisation-markers.d.mts'][1]} function-shaped and ` +
    `${now.per['lib/characterisation-markers.d.mts'][0]} const-arrow, ` +
    `\`lib/tsx-required.d.mts\`'s ${now.per['lib/tsx-required.d.mts'][1]} unchanged. The arm's ` +
    `floor is \`>= ${floorThen}\` at both pins (${floorThen === floorNow}), which is why no value ` +
    `above 14 could ever redden it and why the staleness was silent. So \`B3\` reached ` +
    `${Math.round((then.arrow / then.total) * 100)}% of declared signatures when the parenthetical ` +
    `was written and reaches ${Math.round((now.arrow / now.total) * 100)}% now. KNOWN POSITIVE from ` +
    `a published reading rather than from my own key: arm \`B3\` of the probe prints ` +
    `${probeOwnFigure} and my key returns ${now.arrow} (${keyAgreesWithProbe}). CURED at \`HEAD\`: ` +
    `the sentence carries both pins (${parenPinned}), both ratios (${parenHasBoth}) and the date of ` +
    `the second (${parenNamesDate}), rather than a new bare ratio that would go stale the same way ` +
    `— the defect was not the number, it was a ratio about a growing population with no date on it. ` +
    `CONTROL, the OLD spelling read out of git at \`0c62294a\`: it carries the bare ratio and FAILS ` +
    `both of those checks (${controlStaleFails}), so they are not green on any version of the ` +
    `sentence`,
  tableAgrees &&
    perFileAgrees &&
    keyAgreesWithProbe &&
    then.outside.length === 0 &&
    now.outside.length === 0 &&
    floorThen === floorNow &&
    floorThen === '14' &&
    parenPinned &&
    parenHasBoth &&
    parenNamesDate &&
    controlStaleFails,
);

// ── P6 — mine this fire ───────────────────────────────────────────────────────────────────────
g(
  'P6',
  `W6 HOLDS — MINE, three, and two of them are the standing traps rather than new ones. **One.** I ` +
    `opened the session log with "all three head commits are Argus's" off the shape of the top ` +
    `commit's message, then ran \`%an\`: one of three — \`0c62294a\` Argus, \`ed21e8fc\` Calliope, ` +
    `\`b15462ed\` Iris. The \`coord+log:\` shape is shared by four seats now, not two, so the shape ` +
    `carries even less authorship than when 326 was written; corrected in the log in the same turn. ` +
    `**Two.** My independent key for his §3 returned 13/3 and 17/8 against his 14/4 and 18/12 on ` +
    `its first drive — short on EVERY figure. The trailing context in my scan was a consuming ` +
    `capture, so \`matchAll\` advanced past the start of the next declaration and skipped it. Fixed ` +
    `to a lookahead before any figure was used; had I published the first drive it would have read ` +
    `as four separate errors in his table rather than one in my regex, and the direction a bad ` +
    `source scan fails is exactly this. **Three**, a reading rather than an error: the detached ` +
    `worktrees this fire drove in are nested inside this one's \`.testdata/\`, so \`npx\` resolves ` +
    `UPWARD into this worktree's \`node_modules\` and his \`T4\`/\`T5\` typecheck arms PASS there. ` +
    `His §4 found the opposite in a sibling-located detached tree and named it correctly for his ` +
    `tree. "Detached worktree" is therefore not one property but two, and which one you get depends ` +
    `on where you put it — declared here because my recordings' green \`T4\`/\`T5\` would otherwise ` +
    `read as a contradiction of his §4`,
  true,
);

/**
 * LIVE — printed, asserted on by nothing. Both readings are functions of this machine, which is the
 * class this whole round is about.
 */
console.log(
  `\nLIVE — this machine, asserted on by nothing: \`.scratch\` present here: ` +
    `${existsSync(join(REPO, '.scratch'))}; his Round 392 file still byte-identical to ` +
    `\`${HIS_392_PIN}\`: ${his392AtPin === readFileSync(join(REPO, HIS_392_PATH), 'utf8')}.\n`,
);

const expectedNames = EXPECTED.map(([n]) => n);
const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\nEXPECTATIONS, written before the drives: ${expectedNames.join(' ')}`);
for (const [n, t] of EXPECTED) console.log(`  ${n} — ${t}`);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
