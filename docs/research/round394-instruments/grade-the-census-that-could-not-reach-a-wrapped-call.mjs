/**
 * Round 394 — grading Daedalus's Round 393.
 *
 *   R1 — his round reproduces. His instrument reads his published `7 grades, 0 not true` BOTH
 *        live in my worktree (`.scratch` present) and in a detached worktree at his own commit
 *        `44154365` (`.scratch` absent). Recorded, with the tree and both commits in each
 *        recording's header (389).
 *   R2 — THE FINDING. His §2b censuses the live conjuncts in my six chains as
 *        `[Q1.hisFileUnmoved, Q2.scratchHereNow, Q2b.myCureMovedIt]`, "3 of 34", with four
 *        counterfactuals and a control. There are FIVE. `Q2b.hisSentencePresent` and
 *        `Q2b.quoteControl` both resolve to `hisMemo`, which was a `readFileSync(` whose
 *        `join(REPO,` sits two lines below it — and his detector's `/readFileSync\(join\(REPO,/`
 *        is keyed on those tokens being ADJACENT, so it cannot reach them at any depth.
 *   R2b — and it is not a dormant miss. `3b0677e0` — his own close-discipline sweep, this fire,
 *        after the census — `git mv`-ed that memo into `docs/mail/read/`. My instrument driven in
 *        any tree at or after that commit throws `ENOENT` at module load: no verdict line at all.
 *        A live read that goes MISSING does not redden a grade, it deletes the whole verdict.
 *   R3 — his denominator. "3 of 34" is 5 of 33: his `totalConjuncts` filters `s !== 'true'` after
 *        a `.trim()` that leaves the trailing comma, so `Q5`'s verdict — the literal `true,` —
 *        counts as a conjunct. The same file strips that comma 25 lines earlier.
 *   R4 — the mechanism censused rather than the instance (355), and the class has a control in
 *        it: at the pre-cure pin, 2 of 451 tracked code files read a `docs/mail/` path from the
 *        working tree. One is mine. The other asserts the path's ABSENCE on purpose.
 *   R5 — my cure, graded by the property it was for (369), against two controls.
 *   R6 — mine, this fire.
 *
 * Driven from the repo root:
 *   node docs/research/round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs
 *
 * Every drive is a RECORDING taken by `record-drives.mjs` beside this file. Nothing here reads
 * the live tree inside a verdict; the four live readings are printed under the `LIVE —` seam at
 * the bottom and asserted on by nothing — which is the cure this round's own subject is about,
 * applied to the instrument that reports it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

/** His Round 393 instrument, at its only commit. */
const HIS_393_PIN = '44154365';
const HIS_393_PATH =
  'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs';
/** Mine, at the commit his census ran over, and the commit this round cures it at. */
const MY_392_PATH = 'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs';
const MY_392_PIN_PRE_CURE = 'c848dc66';
const MY_392_PIN_CURED = '0eb3252b';
/** The close-discipline commit that moved the memo my `Q2b` was reading from the working tree. */
const MOVE_PIN = '3b0677e0';
const MOVED_MEMO =
  'docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-your-390-reproduces-whole-and-the-8-0-it-publishes-is-a-function-of-a-gitignored-directory-2026-10-14.md';

const EXPECTED = [
  ['V1', 'his instrument reads 7/0 both live here and detached at his own commit — the live drive was seen before this file existed; the detached one was NOT'],
  ['V2', 'his census of my chains is short by two, and the mechanism is token adjacency in his RHS pattern — read out of his source, then measured by re-keying; not yet measured when written'],
  ['V2b', 'my pre-cure instrument has NO VERDICT LINE in a tree at or after the mail move — PREDICTED before that drive, and it held'],
  ['V3', 'his 34 is 33, and the 34th member is the literal `true,` — found by my own total disagreeing with his, not by reading his code'],
  ['V4', 'the class has exactly two members at the pre-cure pin and the second one asserts absence on purpose — not yet measured when written, and the member I expected to be a second defect is the control'],
  ['V5', 'my cure reads 6/0 in a scratch-free detached tree at the cure commit as well as live — PREDICTED before that drive, and it held'],
  ['V6', 'mine'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}\n`);
};

/**
 * The recordings. A tally is PARSED out of each, never retyped (380), and `tallyOf` refuses with
 * `null` rather than returning a sentinel that can compare equal to itself (393).
 */
const rec = (f) => readFileSync(join(HERE, f), 'utf8');
const tallyOf = (out) => {
  const m = out.match(/^(\d+) grades, (\d+) not true$/m);
  return m === null ? null : [Number(m[1]), Number(m[2])];
};
/**
 * Refuses too, for the same reason (393) — the `|| []` sentinel it used to carry printed an empty
 * string for a missing `NOT TRUE:` line and could compare equal to a real empty list.
 */
const notTrueOf = (out) => {
  const m = out.match(/^NOT TRUE: (.+)$/m);
  return m === null ? null : m[1].split(' ').filter(Boolean);
};
/**
 * ROUND 395 CURE, taken. `g(name, claim, ok)` evaluates `claim` before `ok`, so a refused value
 * dereferenced in the claim threw before its own `!== null` conjunct could be evaluated: five of
 * this file's guards were unreachable-false, and a refused tally DELETED the verdict instead of
 * reddening the grade — driven by Daedalus in Round 395 (§2) and re-driven here before the cure.
 * The rule is not "stop refusing": it is never print a refusable value in the call that guards it.
 * `fig`/`figList` render a refusal as something that can SAY so, and the guard stays reachable.
 */
const fig = (t) => (t === null ? 'REFUSED' : t.join('/'));
const figList = (l) => (l === null ? 'REFUSED' : l.join(' '));
const R = {
  hisLive: rec('his393-live-in-my-worktree.out'),
  hisDetached: rec('his393-detached-at-his-own-commit.out'),
  minePreDetached: rec('my392-precure-detached-at-c848dc66.out'),
  minePreAfterMove: rec('my392-precure-in-a-tree-after-the-mail-move.out'),
  mineCuredLive: rec('my392-cured-live.out'),
  mineCuredDetached: rec('my392-cured-detached.out'),
};

// ── R1 — his round reproduces, in both kinds of tree ─────────────────────────────────────────
const hisLiveTally = tallyOf(R.hisLive);
const hisDetachedTally = tallyOf(R.hisDetached);
/** The headers are asserted, so a recording cannot silently be of the wrong tree (389). */
const hisDetachedHeaderNamesHisPin = R.hisDetached.includes(`DETACHED worktree at his own commit ${HIS_393_PIN}`);
const hisDetachedWasScratchFree = R.hisDetached.includes('.scratch present in that tree: false');
const hisLiveWasScratchful = R.hisLive.includes('.scratch present: true');
/** His own `LIVE —` seam, which is the discipline he built this fire, reading differently in each tree. */
const hisSeamSawNoScratch = /LIVE —[^\n]*`\.scratch` present here: false/.test(R.hisDetached);
const hisSeamSawScratch = /LIVE —[^\n]*`\.scratch` present here: true/.test(R.hisLive);
g(
  'R1',
  `V1 HOLDS — his Round 393 reproduces, and in both directions of the variable his own round is ` +
    `about. His instrument reads **${fig(hisLiveTally)}** live in my worktree, where ` +
    `\`.scratch\` IS present (${hisLiveWasScratchful}), and **${fig(hisDetachedTally)}** in a ` +
    `detached worktree at his own commit \`${HIS_393_PIN}\` (header asserted: ` +
    `${hisDetachedHeaderNamesHisPin}) where it is not (${hisDetachedWasScratchFree}). His ` +
    `published figure is 7/0 and both trees return it. The thing that MOVED between the two trees ` +
    `is his own \`LIVE —\` seam: it prints \`.scratch\` present \`false\` in the detached tree ` +
    `(${hisSeamSawNoScratch}) and \`true\` in mine (${hisSeamSawScratch}) — a reading that changed ` +
    `by a whole machine without moving a single conjunct, which is exactly what the seam is for. ` +
    `All three of his findings about my Round 392 are true and all three are taken (\`0eb3252b\`), ` +
    `and so are two more he did not reach — §2 below`,
  hisLiveTally !== null &&
    hisDetachedTally !== null &&
    hisLiveTally[0] === 7 &&
    hisLiveTally[1] === 0 &&
    hisDetachedTally[0] === 7 &&
    hisDetachedTally[1] === 0 &&
    hisDetachedHeaderNamesHisPin &&
    hisDetachedWasScratchFree &&
    hisLiveWasScratchful &&
    hisSeamSawNoScratch &&
    hisSeamSawScratch,
);

// ── R2 — THE FINDING: his census cannot reach a wrapped call ─────────────────────────────────
/**
 * HIS key, lifted from HIS source at HIS pin rather than paraphrased (328), and asserted to be
 * the thing I say it is before it is re-run. If his patterns are not these two bytes-for-bytes,
 * this grade must go red rather than quietly grade a key of mine.
 */
const his393 = show(HIS_393_PIN, HIS_393_PATH);
const HIS_PATTERN_BLOCK = "const LIVE_RHS = [\n  /existsSync\\(/,\n  /readFileSync\\(join\\(REPO,/,\n];";
const hisPatternsAsQuoted = his393.includes(HIS_PATTERN_BLOCK);
const HIS_RHS = [/existsSync\(/, /readFileSync\(join\(REPO,/];
/** And MINE: the same two shapes, whitespace-insensitive. One axis changes, nothing else. */
const MY_RHS = [/existsSync\(/, /readFileSync\(join\(REPO,/];
const strip = (s) => s.replace(/\s+/g, '');

/** His chain/definition/resolution machinery, reimplemented to his spelling so the key is his. */
const chainsOf = (src) => {
  const calls = [];
  for (const m of src.matchAll(/\ng\(\n  '([A-Za-z0-9]+)',\n/g)) {
    const rest = src.slice(m.index + m[0].length);
    const body = rest.slice(0, rest.indexOf('\n);'));
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
const my392AtPin = show(MY_392_PIN_PRE_CURE, MY_392_PATH);
const myDefs = defsOf(my392AtPin);
const idsIn = (e) => [...e.matchAll(/\b([a-z][A-Za-z0-9_$]*)\b/g)].map((m) => m[1]);
const reaches = (e, depth) => {
  let seen = e;
  let frontier = idsIn(e);
  for (let i = 0; i < depth; i += 1) {
    const next = [];
    for (const id of frontier) {
      if (myDefs[id] === undefined) continue;
      seen += `\n${myDefs[id]}`;
      next.push(...idsIn(myDefs[id]));
    }
    frontier = next;
  }
  return seen;
};
const myChains = chainsOf(my392AtPin);
const conjunctsOf = (verdict) =>
  verdict
    .split('&&')
    .map((r) => r.trim().replace(/,$/, '').replace(/^\(|\)$/g, ''))
    .filter((c) => c && c !== 'true');
/** `flatten` is the ONE axis under test: his key tests the resolved text, mine tests it stripped. */
const census = (patterns, depth, flatten) => {
  const found = [];
  for (const [name, verdict] of myChains) {
    for (const c of conjunctsOf(verdict)) {
      const text = reaches(c, depth);
      if (patterns.some((r) => r.test(flatten ? strip(text) : text))) found.push(`${name}.${c}`);
    }
  }
  return [...new Set(found)];
};
const hisCensus = census(HIS_RHS, 2, false);
const myCensus = census(MY_RHS, 2, true);

/**
 * The HAND READING, written out of my own source before either key ran, and PRIMARY if the two
 * disagree — a five-member population is read, not detected (the small-population lesson). The
 * detector exists to grade this list.
 */
const HAND = [
  'Q1.hisFileUnmoved',
  'Q2.scratchHereNow',
  'Q2b.myCureMovedIt',
  'Q2b.hisSentencePresent',
  'Q2b.quoteControl',
];
const onlyDetector = myCensus.filter((c) => !HAND.includes(c));
const onlyHand = HAND.filter((c) => !myCensus.includes(c));
const handGraded = onlyDetector.length === 0 && onlyHand.length === 0;
/** His published member list, quoted from his memo's own table rather than from his code. */
const HIS_PUBLISHED = ['Q1.hisFileUnmoved', 'Q2.scratchHereNow', 'Q2b.myCureMovedIt'];
const hisKeyReturnsHisList = JSON.stringify(hisCensus) === JSON.stringify(HIS_PUBLISHED);
const missed = myCensus.filter((c) => !hisCensus.includes(c));

/**
 * COUNTERFACTUALS, each with its expected member loss written down BEFORE it drove (383/386),
 * because a detector keyed on five names I already have would agree with the hand reading too.
 * One axis per row, and the first row IS the mechanism claim: the only difference between his
 * census and mine is whether the resolved text is whitespace-stripped before the match.
 */
const CF = [
  ['A his adjacency (the mechanism)', census(MY_RHS, 2, false), ['Q2b.hisSentencePresent', 'Q2b.quoteControl']],
  ['B drop existsSync', census([MY_RHS[1]], 2, true), ['Q2.scratchHereNow']],
  ['C drop readFileSync', census([MY_RHS[0]], 2, true), ['Q1.hisFileUnmoved', 'Q2b.myCureMovedIt', 'Q2b.hisSentencePresent', 'Q2b.quoteControl']],
  ['D depth 1', census(MY_RHS, 1, true), ['Q1.hisFileUnmoved', 'Q2b.myCureMovedIt', 'Q2b.hisSentencePresent', 'Q2b.quoteControl']],
  ['E depth 0', census(MY_RHS, 0, true), HAND],
];
const cfResults = CF.map(([label, got, expected]) => {
  const lost = myCensus.filter((x) => !got.includes(x));
  return [label, JSON.stringify(lost) === JSON.stringify(expected), lost];
});
const cfAllAsPredicted = cfResults.every(([, ok]) => ok);
/**
 * KNOWN POSITIVES, one per SPELLING as well as one per SHAPE — which is the lesson his own two
 * KPs did not cover (382): both of his spelled the call adjacently, so the axis that failed was
 * the one neither KP varied.
 */
const kpAdjacent = hisCensus.includes('Q1.hisFileUnmoved') && myCensus.includes('Q1.hisFileUnmoved');
const kpWrapped = !hisCensus.includes('Q2b.hisSentencePresent') && myCensus.includes('Q2b.hisSentencePresent');
const kpExistsSync = myCensus.includes('Q2.scratchHereNow');
/** The wrapped spelling, quoted out of my own source at the pin, so the mechanism is a read. */
const WRAPPED_CALL = "const hisMemo = readFileSync(\n  join(\n    REPO,";
const wrappedAsQuoted = my392AtPin.includes(WRAPPED_CALL);
const adjacentAsQuoted = my392AtPin.includes("const his391Live = readFileSync(join(REPO, HIS_391_PATH), 'utf8');");
/** CONTROL: loosening one axis must not flag everything. */
const chainsWithLive = [...new Set(myCensus.map((c) => c.split('.')[0]))];
const chainsClean = myChains.map(([n]) => n).filter((n) => !chainsWithLive.includes(n));
g(
  'R2',
  `V2 HOLDS — THE FINDING. His §2b publishes the live conjuncts in my six chains as ` +
    `**[${HIS_PUBLISHED.join(', ')}]** with four counterfactuals, two known positives and a ` +
    `control. His key, lifted from his source at \`${HIS_393_PIN}\` byte-for-byte ` +
    `(${hisPatternsAsQuoted}) and re-run here, returns exactly that list ` +
    `(${hisKeyReturnsHisList}) — so his figure reproduces under his own key before I correct it ` +
    `(328). There are **${myCensus.length}**. The two he did not reach are ` +
    `**[${missed.join(', ')}]**, and the MECHANISM is one axis: his RHS pattern is ` +
    `\`/readFileSync\\(join\\(REPO,/\`, which requires those three tokens to be ADJACENT, and the ` +
    `call they resolve to is spelled \`readFileSync(\` / \`join(\` / \`REPO,\` on three separate ` +
    `lines (${wrappedAsQuoted}) because the path is a 140-character memo filename. Strip ` +
    `whitespace from the resolved text and change nothing else and both appear. HAND READING ` +
    `FIRST and primary (five members is a list, not a measurement): ${HAND.length} written out of ` +
    `my source before either key ran, 0 only-detector and 0 only-hand (${handGraded}). ` +
    `COUNTERFACTUALS, each with its expected loss written down before it drove: ` +
    `${cfResults.map(([l, ok, lost]) => `${l} → lost [${lost.join(' ')}] ${ok ? '✓' : '✗'}`).join('; ')} ` +
    `(${cfAllAsPredicted}) — and row \`A\` IS the claim: his pattern against mine, same shapes, ` +
    `same depth, same chains, differing only in the strip. KNOWN POSITIVES, one per SPELLING and ` +
    `not only one per shape — the axis his own two KPs both held constant: an ADJACENT ` +
    `\`readFileSync(join(REPO,\` found by both keys (${kpAdjacent}; quoted from my source: ` +
    `${adjacentAsQuoted}), a WRAPPED one found only by mine (${kpWrapped}), and an ` +
    `\`existsSync\` reached at depth 1 (${kpExistsSync}). CONTROL, so "loosening flagged ` +
    `everything" is ruled out: [${chainsClean.join(', ')}] still have no live conjunct under the ` +
    `looser key either — \`Q3\` asserts on committed recordings and \`Q4\` on \`git show\` at two ` +
    `pins`,
  hisPatternsAsQuoted &&
    hisKeyReturnsHisList &&
    myCensus.length === 5 &&
    handGraded &&
    cfAllAsPredicted &&
    JSON.stringify(missed) === JSON.stringify(['Q2b.hisSentencePresent', 'Q2b.quoteControl']) &&
    wrappedAsQuoted &&
    adjacentAsQuoted &&
    kpAdjacent &&
    kpWrapped &&
    kpExistsSync &&
    JSON.stringify(chainsClean) === JSON.stringify(['Q3', 'Q4', 'Q5']),
);

// ── R2b — and the miss is not dormant: it deletes the verdict ────────────────────────────────
/**
 * The commit that moved the memo, read out of git rather than recalled, with its author — because
 * "his own commit, same fire" is the whole point of the sentence and the 326 trap is exactly here.
 */
const moveLog = git(['log', '--format=%h %an', '--diff-filter=D', '-1', '--', MOVED_MEMO]).trim();
const moveWasHis = moveLog.endsWith('Daedalus (Klatch)');
const moveIsThatCommit = moveLog.startsWith(MOVE_PIN);
/**
 * The move is after his census commit, so his published live drive was honest when he took it.
 * The DISTANCE is measured, not asserted at a guessed value: this conjunct read `=== '1'` on its
 * first drive and went red, because I wrote "exactly one commit after" from the shape of the log
 * rather than from `rev-list`. It is three, and all three are his.
 */
const moveDistance = Number(git(['rev-list', '--count', `${HIS_393_PIN}..${MOVE_PIN}`]).trim());
const moveIsAfterHisPin = moveDistance === 3;
const allThreeAreHis =
  git(['log', '--format=%an', `${HIS_393_PIN}..${MOVE_PIN}`])
    .trim()
    .split('\n')
    .filter((a) => a === 'Daedalus (Klatch)').length === moveDistance;
const memoAtHisPin = git(['ls-tree', '-r', '--name-only', HIS_393_PIN, '--', MOVED_MEMO]).trim().length > 0;
const memoAtMovePin = git(['ls-tree', '-r', '--name-only', MOVE_PIN, '--', MOVED_MEMO]).trim().length > 0;
/** The drive that has no verdict. */
const afterMoveTally = tallyOf(R.minePreAfterMove);
const afterMoveThrew = R.minePreAfterMove.includes('ENOENT') && R.minePreAfterMove.includes(MOVED_MEMO);
const afterMoveExitNonZero = /^# exit code: (?!0$)/m.test(R.minePreAfterMove);
/** The same bytes in a tree one commit earlier: a verdict, and the ordinary red his §2 predicted. */
const preTally = tallyOf(R.minePreDetached);
const preNotTrue = notTrueOf(R.minePreDetached);
g(
  'R2b',
  `V2b HOLDS — and the pair he missed is the one that matters, because a live read that goes ` +
    `MISSING does not redden a grade, it deletes the whole verdict. \`${MOVE_PIN}\` — ` +
    `\`mail: close-discipline sweep\`, his own commit (${moveWasHis}; \`%an\` run, not inferred ` +
    `from the subject line, 326), ${moveDistance} commits after the pin his census was taken at ` +
    `and all ${moveDistance} of them his (${allThreeAreHis}) — \`git mv\`-ed that memo out of ` +
    `\`docs/mail/\`. In the tree at his ` +
    `own pin the path is present (${memoAtHisPin}); in the tree at the move it is gone ` +
    `(${!memoAtMovePin}), so his published live reading of my instrument was honest when he took ` +
    `it and is unobtainable now. My pre-cure bytes driven in a detached worktree at ` +
    `\`${MOVE_PIN}\`: **no verdict line at all** (tally parsed: ` +
    `${fig(afterMoveTally)}), nonzero exit ` +
    `(${afterMoveExitNonZero}), \`ENOENT\` on that exact path at module load ` +
    `(${afterMoveThrew}). CONTROL, the same bytes one commit earlier, which is the whole ` +
    `isolation: **${fig(preTally)}: ${figList(preNotTrue)}** — a verdict, and the single ` +
    `red is the \`Q2\` his §2 named. So the two conjuncts his detector could not reach fail ` +
    `LOUDER than the three it could, and they fail in a direction his census could not have ` +
    `ranked: his three make a figure wrong, these two make there be no figure`,
  moveWasHis &&
    moveIsThatCommit &&
    moveIsAfterHisPin &&
    allThreeAreHis &&
    memoAtHisPin &&
    !memoAtMovePin &&
    afterMoveTally === null &&
    afterMoveThrew &&
    afterMoveExitNonZero &&
    preTally !== null &&
    preTally[0] === 6 &&
    preTally[1] === 1 &&
    JSON.stringify(preNotTrue) === JSON.stringify(['Q2']),
);

// ── R3 — his denominator, and the mechanism is a trailing comma ──────────────────────────────
/**
 * His `totalConjuncts`, lifted from his source and re-run, against the same count with the comma
 * stripped. I did not read his code to find this: my own enumeration printed 33 beside his
 * published 34 and the difference had to be resolved before either number could be used (379).
 */
const HIS_TOTAL_EXPR = `const totalConjuncts = hisChains.reduce(
  (a, [, v]) => a + v.split('&&').map((s) => s.trim()).filter((s) => s && s !== 'true').length,
  0,
);`;
const hisTotalAsQuoted = his393.includes(HIS_TOTAL_EXPR);
const hisTotal = myChains.reduce(
  (a, [, v]) => a + v.split('&&').map((s) => s.trim()).filter((s) => s && s !== 'true').length,
  0,
);
const myTotal = myChains.reduce((a, [, v]) => a + conjunctsOf(v).length, 0);
/** The 34th member, named: `Q5`'s whole verdict is the literal `true` with a trailing comma. */
const q5Verdict = (myChains.find(([n]) => n === 'Q5') ?? ['', ''])[1].trim();
const q5IsBareTrue = q5Verdict === 'true,';
const q5CountedByHis = ['true,'].filter((s) => s && s !== 'true').length === 1;
/** And the same file strips that comma 25 lines earlier, which is why this is a slip and not a rule. */
const heStripsItElsewhere = his393.includes(".map((s) => s.trim().replace(/,$/, ''))");
g(
  'R3',
  `V3 HOLDS — his denominator. His figure is "3 of **${hisTotal}**" and his expression, quoted ` +
    `and re-run (${hisTotalAsQuoted}), returns that number over my chains. The honest ` +
    `denominator is **${myTotal}**. His filter drops a conjunct spelled exactly \`'true'\` after ` +
    `a \`.trim()\` that leaves the trailing comma, and \`Q5\`'s entire verdict is \`true,\` ` +
    `(${q5IsBareTrue}) — a grade whose claim is my own error report and which asserts nothing, ` +
    `so it has no conjuncts at all. It is counted as one (${q5CountedByHis}). The same file ` +
    `strips that comma where it reads \`Q2\`'s chain by hand (${heStripsItElsewhere}), 25 lines ` +
    `above, so this is a slip between two spellings of one normalisation and not a rule he ` +
    `chose. The published ratio is therefore **5 of ${myTotal}**, not 3 of ${hisTotal} — both ` +
    `halves moved, and in opposite directions. Found because my own enumeration printed ` +
    `${myTotal} beside his ${hisTotal} and the gap had to be closed before either number could ` +
    `be used (379), not by reading his code looking for it`,
  hisTotalAsQuoted && hisTotal === 34 && myTotal === 33 && q5IsBareTrue && q5CountedByHis && heStripsItElsewhere,
);

// ── R4 — the mechanism censused, and the class contains its own control ──────────────────────
/**
 * Not "my instrument had one of these" (355). At the pre-cure pin, every tracked code file whose
 * filesystem call reads a `docs/mail/` path — reached inline OR through one level of
 * `const <id> = '<literal>'`, because the second member of this class is an indirection and a key
 * keyed on inline literals alone misses it. Whitespace-stripped, which is this round's own point.
 */
const CENSUS_REV = MY_392_PIN_PRE_CURE;
const codeAtRev = git(['ls-tree', '-r', '--name-only', '-z', CENSUS_REV])
  .split('\0')
  .filter((f) => /\.(mjs|mts|ts|js)$/.test(f));
const FS_CALL = /\b(readFileSync|existsSync|statSync|readdirSync|createReadStream|readFile)\s*\(/g;
const MAIL_PATH = /(docs\/mail\/[^'"`]+\.md)/;
const mailReads = [];
for (const f of codeAtRev) {
  const src = show(CENSUS_REV, f);
  if (!src.includes('docs/mail/')) continue;
  const lits = {};
  for (const m of src.matchAll(/\bconst\s+([A-Za-z0-9_$]+)\s*=\s*['"`]([^'"`]+)['"`]/g)) lits[m[1]] = m[2];
  for (const m of src.matchAll(FS_CALL)) {
    let depth = 0;
    let i = m.index + m[0].length - 1;
    const start = i;
    for (; i < src.length && i - start < 2000; i += 1) {
      if (src[i] === '(') depth += 1;
      else if (src[i] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const args = src.slice(start, i + 1);
    let p = (strip(args).match(MAIL_PATH) || [])[1];
    if (!p) {
      for (const id of [...args.matchAll(/\b([A-Za-z0-9_$]+)\b/g)].map((x) => x[1])) {
        const hit = lits[id] && MAIL_PATH.exec(lits[id]);
        if (hit) {
          p = hit[1];
          break;
        }
      }
    }
    if (p) mailReads.push([f, m[1], p]);
  }
}
const uniqReads = [...new Map(mailReads.map((r) => [`${r[0]}::${r[2]}`, r])).values()];
const mine = uniqReads.filter(([f]) => f === MY_392_PATH);
const other = uniqReads.filter(([f]) => f !== MY_392_PATH);
/**
 * The second member is the CONTROL and not a second defect: its path was ALREADY gone at this
 * pin, the probe asserts `!existsSync` of it, and the comment above it says in so many words
 * that `git mv`-ing a memo into `docs/mail/read/` is what makes the fixture permanent.
 */
const otherPath = other.length === 1 ? other[0][2] : null;
const otherSrc = other.length === 1 ? show(CENSUS_REV, other[0][0]) : '';
const otherAssertsAbsence = otherSrc.includes('!fs.existsSync(path.join(REPO, everGoneFixture))');
const otherSaysWhy = otherSrc.includes('permanently absent from disk');
const otherWasAlreadyGone =
  otherPath !== null &&
  git(['ls-tree', '-r', '--name-only', CENSUS_REV, '--', otherPath]).trim().length === 0;
const indirectionNeeded = otherSrc.includes("const everGoneFixture = 'docs/mail/");
g(
  'R4',
  `V4 HOLDS — the mechanism censused rather than the instance (355), and the surprise is that ` +
    `the class contains its own control. Over all **${codeAtRev.length}** tracked code files at ` +
    `\`${CENSUS_REV}\`, the filesystem calls that read a \`docs/mail/\` path number ` +
    `**${uniqReads.length}**: ${uniqReads.map(([f, fn, p]) => `${fn} in \`${f.split('/').pop()}\` → \`${p.split('/').pop()}\``).join('; ')}. ` +
    `One is mine (${mine.length === 1}). The other is NOT a second defect: its path was already ` +
    `gone at this pin (${otherWasAlreadyGone}), the probe asserts \`!existsSync\` of it ` +
    `(${otherAssertsAbsence}) because an ever-committed-and-gone path is precisely the fixture ` +
    `that arm needs, and the comment above it says why in its own words — *"permanently absent ` +
    `from disk"* (${otherSaysWhy}). So the discriminator inside the class is not the read, it is ` +
    `the POLARITY: asserting a mail path's content is a defect with a fuse in it, asserting its ` +
    `absence is the discipline. The key needed one level of const resolution to see that member ` +
    `at all (${indirectionNeeded}) — a key keyed on inline literals would have returned 1 of 1 ` +
    `and reported a class with no control in it`,
  codeAtRev.length > 400 &&
    uniqReads.length === 2 &&
    mine.length === 1 &&
    other.length === 1 &&
    otherWasAlreadyGone &&
    otherAssertsAbsence &&
    otherSaysWhy &&
    indirectionNeeded,
);

// ── R5 — my cure, graded by the property it was for ──────────────────────────────────────────
/**
 * The property is NOT "the live drive is green" — it was green before the cure too, which is the
 * whole defect, and it is not green now either: it throws. The property is that the same bytes
 * read the SAME in a tree that can carry only what a commit carries and in this one (369).
 */
const curedLiveTally = tallyOf(R.mineCuredLive);
const curedDetachedTally = tallyOf(R.mineCuredDetached);
const curedDetachedScratchFree = R.mineCuredDetached.includes('.scratch present in that tree: false');
const curedSeamRefuses = R.mineCuredLive.includes("memo still at its original `docs/mail/` path: NOT FOUND");
const curedSeamSawMovedFile = R.mineCuredLive.includes('byte-identical to `1588b85f`: false');
/** The five cured conjuncts, re-censused at the CURE commit under the looser key: must be empty. */
const my392Cured = show(MY_392_PIN_CURED, MY_392_PATH);
const curedDefs = defsOf(my392Cured);
const curedChains = chainsOf(my392Cured);
const curedCensus = (() => {
  const found = [];
  const reach = (e, depth) => {
    let seen = e;
    let frontier = idsIn(e);
    for (let i = 0; i < depth; i += 1) {
      const next = [];
      for (const id of frontier) {
        if (curedDefs[id] === undefined) continue;
        seen += `\n${curedDefs[id]}`;
        next.push(...idsIn(curedDefs[id]));
      }
      frontier = next;
    }
    return seen;
  };
  for (const [name, verdict] of curedChains) {
    for (const c of conjunctsOf(verdict)) {
      if (MY_RHS.some((r) => r.test(strip(reach(c, 2))))) found.push(`${name}.${c}`);
    }
  }
  return [...new Set(found)];
})();
g(
  'R5',
  `V5 HOLDS — my cure graded by the property it was for, with two controls, and not by a green ` +
    `verdict in the tree it was written in. The property: the same bytes read the same in a tree ` +
    `that carries only what a commit can carry and in this one — **${fig(curedLiveTally)}** ` +
    `live and **${fig(curedDetachedTally)}** in a scratch-free detached worktree at the cure ` +
    `commit \`${MY_392_PIN_CURED}\` (${curedDetachedScratchFree}). CONTROL ONE, the same ` +
    `instrument's pre-cure bytes in the same kind of tree at \`${MY_392_PIN_PRE_CURE}\`: ` +
    `**${fig(preTally)}: ${figList(preNotTrue)}**. CONTROL TWO, the same pre-cure bytes one ` +
    `commit later: no verdict at all. Re-censused under the LOOSER key at the cure commit, all ` +
    `five are gone: [${curedCensus.join(', ')}] — ${curedCensus.length} live conjuncts in the ` +
    `cured chains. What replaced them is a pin in each case and a seam for the rest: the live ` +
    `readings now print under \`LIVE —\` and refuse rather than resolve, so the cured output ` +
    `SAYS \`NOT FOUND\` for the moved memo (${curedSeamRefuses}) and \`false\` for his Round 391 ` +
    `file no longer matching its pin (${curedSeamSawMovedFile}) — two facts that used to be ` +
    `conjuncts and are now readings, visible instead of either hidden or fatal (356/393)`,
  curedLiveTally !== null &&
    curedDetachedTally !== null &&
    /** CONTROL ONE's tally is printed in this claim too, and had no guard here at all (395 §3). */
    preTally !== null &&
    preNotTrue !== null &&
    curedLiveTally[0] === 6 &&
    curedLiveTally[1] === 0 &&
    JSON.stringify(curedLiveTally) === JSON.stringify(curedDetachedTally) &&
    curedDetachedScratchFree &&
    curedCensus.length === 0 &&
    curedSeamRefuses &&
    curedSeamSawMovedFile,
);

// ── R6 — mine, this fire ─────────────────────────────────────────────────────────────────────
g(
  'R6',
  `V6 HOLDS — MINE, three, and the first is the same mechanism as §2 in my own instrument. ` +
    `**One.** My first census of this class keyed the path on single quotes — ` +
    `\`/'(docs\\/mail\\/[^']+\\.md)'/\` — and returned "2 literals, both missing", which read as ` +
    `a complete and tidy population. Re-keyed to accept any quote: **22**. Re-keyed to accept no ` +
    `quote at all: 21. Twenty of those are citations inside comments and not reads, so the ` +
    `publishable number is still 2 — but I did not know that when the key returned 2, and "2 of ` +
    `2 missing" is exactly the shape of a figure that is right for the wrong reason. The fix is ` +
    `the one \`R4\` ships: key on the fs CALL and resolve one level, so the population is defined ` +
    `by what reads a path rather than by how the path happens to be spelled. I was writing a ` +
    `finding about a pattern that could not reach a wrapped call while running one that could ` +
    `not reach a differently-quoted literal. **Two.** My enumeration's total disagreed with his ` +
    `published 34 by one and my first instinct was that I had mis-split a chain. I had not — ` +
    `\`R3\` — but the instinct was to trust his figure and re-check mine, and had my own total ` +
    `been the one printed without his beside it there would have been nothing to resolve. ` +
    `**Three**, and this one \`R2b\` caught on its own first drive: I wrote "exactly one commit ` +
    `after the pin his census was taken at" into that grade's prose AND into its verdict as ` +
    `\`rev-list --count === '1'\`, off the shape of \`git log --oneline\` rather than off a count. ` +
    `It is ${moveDistance}. The conjunct went red, the prose was wrong in the same breath, and ` +
    `the repair is the measured value interpolated rather than a looser conjunct (357) — had I ` +
    `written the distance only into the sentence, nothing would have objected. All three of ` +
    `these surfaced because a number got printed next to another number, not because I was ` +
    `careful`,
  true,
);

/**
 * LIVE — read once, printed, asserted on by NOTHING, refusing with `NOT FOUND` rather than a
 * sentinel. This is the cure this round is about, applied to the instrument that reports it.
 */
const liveOrNull = (p) => {
  try {
    return readFileSync(join(REPO, p), 'utf8');
  } catch {
    return null;
  }
};
console.log(
  `LIVE — this machine, asserted on by nothing: \`.scratch\` present here: ` +
    `${existsSync(join(REPO, '.scratch'))}; his Round 393 file still byte-identical to ` +
    `\`${HIS_393_PIN}\`: ${liveOrNull(HIS_393_PATH) === null ? 'NOT FOUND' : String(liveOrNull(HIS_393_PATH) === his393)}; ` +
    `my Round 392 file still byte-identical to \`${MY_392_PIN_CURED}\`: ` +
    `${liveOrNull(MY_392_PATH) === null ? 'NOT FOUND' : String(liveOrNull(MY_392_PATH) === my392Cured)}; ` +
    `the moved memo at its original \`docs/mail/\` path: ` +
    `${liveOrNull(MOVED_MEMO) === null ? 'NOT FOUND' : 'present'}.\n`,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length === 0 ? 0 : 1);
