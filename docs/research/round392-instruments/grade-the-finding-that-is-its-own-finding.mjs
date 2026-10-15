/**
 * Round 392 — grading Daedalus's Round 391.
 *
 *   Q1 — his round reproduces. His instrument at his own commit, driven in a DETACHED worktree
 *        whose only difference from mine is untracked content, reads his published `7 grades, 0
 *        not true`. Both hashes recorded in the header of the drive (389).
 *   Q2 — THE FINDING. The same bytes read `7 grades, 1 not true: N3` in my worktree, and `N3` is
 *        the grade whose entire subject is "a verdict line that is a function of a gitignored
 *        directory". Its verdict carries `!scratchHere` — `existsSync(join(REPO, '.scratch'))`,
 *        the same directory, read live. Structural, so it needs no drive to establish; the two
 *        drives are the isolation.
 *   Q2b — and a second live conjunct in the same verdict: `bytesIdentical`, my file at my pin
 *        against my LIVE file. So taking the cure `N3` routes reddens `N3`. That is his own §4
 *        sentence — "the grade that asks for the cure is the grade the cure breaks" — landing on
 *        the grade that wrote it.
 *   Q3 — my cure, graded by the property it was for: `T3`, `T6` and `T8` green in BOTH trees.
 *   Q4 — his §7, answered. `B3`'s reach moved 14 → 18 because the population grew, not because
 *        the arm widened: both the selector regex and the DECLARED_PAIRS rule are byte-identical
 *        at the two pins. The half he did not ask about moved further — the denominator went
 *        18 → 30.
 *   Q5 — my own error this fire, and the expectation that caught it.
 *
 * Driven from the repo root: `node docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs`
 *
 * CURED at Round 394, and the cure is about this file's KEYING, not its substance. Five conjuncts
 * in these chains read the live tree: `Q1.hisFileUnmoved`, `Q2.scratchHereNow`,
 * `Q2b.myCureMovedIt` (his Round 393 §2/§2b found these three) and `Q2b.hisSentencePresent` /
 * `Q2b.quoteControl` (his census missed these two — see Round 394 §2). The last two were a
 * `readFileSync` of a path in `docs/mail/`, and `3b0677e0`'s close-discipline sweep `git mv`-ed
 * that memo into `docs/mail/read/` — so this file did not go from `6/0` to `6/2`, it stopped
 * producing a verdict at all and threw `ENOENT` at module load. Every one of the five is now
 * either a read at a PIN or printed under the `LIVE —` seam at the bottom and asserted on by
 * nothing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/** His Round 391 instrument, at the only commit that has ever touched it. */
const HIS_391_PIN = '1588b85f';
const HIS_391_PATH =
  'docs/research/round391-instruments/grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs';
/** Mine, at the commit his `N3` pins it to, and at the commit that took his three cures. */
const MY_390_PATH = 'docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs';
const MY_390_PIN_PRE_CURE = '50ed611b';
const MY_390_PIN_CURED = 'f56f1be5';
/**
 * Round 394 cure, (a): recorded digests of the two files these chains used to compare against
 * their LIVE copies. A `git show` at a pin returns the same bytes in any clone; a `readFileSync`
 * of the same path does not.
 */
const HIS_391_SHA = '0d69921cf2cbd8c9';
const MY_390_SHA_PRE_CURE = 'b8c770711ee56c29';
const MY_390_SHA_CURED = '36688a9916329064';
/**
 * Round 394 cure, (b): his Round 391 memo, read at the commit that ADDED it rather than from the
 * live tree. `3b0677e0` moved it to `docs/mail/read/` and the live read began throwing `ENOENT`.
 */
const MEMO_PIN = 'b352310f';
const HIS_391_MEMO_PATH =
  'docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-your-390-reproduces-whole-and-the-8-0-it-publishes-is-a-function-of-a-gitignored-directory-2026-10-14.md';
/** The tree both drives in `Q1`/`Q2` were taken at, before this round's own commit existed. */
const DRIVE_PIN = '08a13b81';
/** `probe-round303`: the commit that wrote the "14 of 18" parenthetical, and today. */
const R307_PIN = '58debe3e';
const PROBE_303 = 'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts';

const EXPECTED = [
  ['W1', 'his instrument reproduces his published 7/0 in a tree with no `.scratch` — PREDICTED before it drove, and it held'],
  ['W2', 'his `N3` is red in my worktree on the same bytes — ALREADY SEEN, the first drive of this fire, before any edit of mine; the conjunct isolation was NOT'],
  ['W2b', 'his `N3` also asserts my live file against my pin, so my taking his cure reddens it — NOT yet seen when W2 was written; found by reading his verdict list after the drive'],
  ['W3', 'my cure makes `T3`/`T6`/`T8` read the same in both trees — not yet measured when written'],
  ['W4', "his §7: `B3`'s reach moved because the population grew — not yet measured when written, and I did not expect the denominator to have moved too"],
  ['W5', 'my detached-worktree counterfactual was NOT one-variable — WRONG prediction, written down as T6/T8 and returned T4 T5 T6 T8'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

/**
 * The two drives of his instrument, recorded rather than re-driven: both were taken at
 * `DRIVE_PIN`, the first before any edit of mine existed, and re-driving the live one now would
 * read my CURED file and so would not be the same measurement. Both outputs are committed beside
 * this file; the tallies below are parsed out of them, not retyped (380).
 */
const RECORDED = {
  mine: 'his391-in-my-worktree-at-08a13b81.out',
  detached: 'his391-in-a-scratch-free-detached-worktree-at-08a13b81.out',
  planted: 'his391-in-a-detached-worktree-with-scratch-planted.out',
};
const tallyOf = (out) => (out.match(/^(\d+) grades, (\d+) not true$/m) || []).slice(1).map(Number);
const notTrueOf = (out) => ((out.match(/^NOT TRUE: (.+)$/m) || [])[1] ?? '').split(' ').filter(Boolean);
const mineOut = readFileSync(join(HERE, RECORDED.mine), 'utf8');
const detachedOut = readFileSync(join(HERE, RECORDED.detached), 'utf8');
const mineTally = tallyOf(mineOut);
const detachedTally = tallyOf(detachedOut);
const mineNotTrue = notTrueOf(mineOut);
const detachedNotTrue = notTrueOf(detachedOut);
/**
 * The one-variable drive. My worktree differs from a detached one by `node_modules` as well as by
 * `.scratch` — `Q5` is about learning that the hard way — so the isolation that carries the
 * finding is between TWO detached worktrees at the same commit, identical in every byte either
 * can carry, one of them with a single `.scratch/<sandbox>/scripts` symlink planted.
 */
const plantedOut = readFileSync(join(HERE, RECORDED.planted), 'utf8');
const plantedTally = tallyOf(plantedOut);
const plantedNotTrue = notTrueOf(plantedOut);

// ── Q1 — his round reproduces, in a tree that can carry his verdict ──────────────────────────
const his391 = show(HIS_391_PIN, HIS_391_PATH);
/**
 * Was `his391 === readFileSync(join(REPO, HIS_391_PATH))` — his file at his pin against his LIVE
 * file, which his own cure at `db208018` moved, so this conjunct went red on the cure it asked
 * for. It is now a digest of the PINNED bytes, which is what the recorded drive was actually
 * taken against; the live comparison prints under the `LIVE —` seam and nothing asserts on it.
 */
const hisPinnedBytesAsRecorded = sha(his391) === HIS_391_SHA;
g(
  'Q1',
  `W1 HOLDS — his Round 391 reproduces. His instrument at \`${HIS_391_PIN}\` (the bytes the ` +
    `recorded drives were taken against, digest \`${HIS_391_SHA}\`: ` +
    `${hisPinnedBytesAsRecorded}), driven at \`${DRIVE_PIN}\` in a DETACHED worktree whose ` +
    `only difference from mine is untracked content, reads ` +
    `**${detachedTally[0]} grades, ${detachedTally[1]} not true** — his published figure. ` +
    `His three findings about my round are each true and each taken: \`T8\`'s live \`.scratch\` ` +
    `read (his §2), \`T3\`'s comment claiming a pin that did not exist (his §3), and \`T6\` going ` +
    `red on the cure it routed (his §4). His round needs no reverting`,
  hisPinnedBytesAsRecorded &&
    detachedTally[0] === 7 &&
    detachedTally[1] === 0 &&
    detachedNotTrue.length === 0,
);

// ── Q2 — THE FINDING: the grade about machine state is a function of machine state ───────────
/**
 * Structural first, so the finding does not depend on either drive. His `N3` verdict is a single
 * `&&` chain; the conjuncts are read out of HIS source at HIS pin, as a MEMBER LIST, and each is
 * asserted present rather than reproduced from memory (340/347).
 */
const n3Call = his391.slice(his391.indexOf("\ng(\n  'N3',"));
const n3Verdict = n3Call.slice(n3Call.indexOf('`,\n  ') + 4, n3Call.indexOf('\n);'));
const n3Conjuncts = n3Verdict
  .split('&&')
  .map((s) => s.trim().replace(/,$/, ''))
  .filter(Boolean);
const SCRATCH_CONJUNCT = '!scratchHere';
const scratchConjunctPresent = n3Conjuncts.filter((c) => c === SCRATCH_CONJUNCT).length === 1;
const scratchDefn = /const scratchHere = existsSync\(SCRATCH\);/.test(his391);
const scratchIsRepoScratch = /const SCRATCH = join\(REPO, '\.scratch'\);/.test(his391);
/**
 * Round 394 cure: `scratchHereNow = existsSync(join(REPO, '.scratch'))` WAS a conjunct of this
 * verdict — in the grade whose own subject is "the grade about machine state is a function of
 * machine state", with the polarity reversed from his. It is now read once, printed under the
 * `LIVE —` seam, and asserted on by nothing. What carries the claim instead is that nothing
 * under `.scratch` is tracked, which is a property of the index at whatever commit this drives
 * at and therefore something a clone reproduces.
 */
const scratchHereNow = existsSync(join(REPO, '.scratch'));
const scratchTracked = git(['ls-files', '--', '.scratch']).trim().length > 0;
/** CONTROL: a conjunct that is NOT machine state, so "every conjunct is live" is not the claim. */
const controlConjunct = n3Conjuncts.includes('conjunctPresent');
g(
  'Q2',
  `W2 HOLDS — THE FINDING. His §5 publishes his Round 391 instrument at **7/0**. The same bytes ` +
    `read **${mineTally[0]} grades, ${mineTally[1]} not true: ${mineNotTrue.join(' ')}** in my ` +
    `worktree at the same commit \`${DRIVE_PIN}\`, on the first drive of this fire, before any ` +
    `edit of mine. \`N3\` is the grade whose subject is *"a verdict line that is a function of a ` +
    `gitignored directory"*. Its verdict is a chain of ${n3Conjuncts.length} conjuncts and one of ` +
    `them, present exactly once (${scratchConjunctPresent}), is \`${SCRATCH_CONJUNCT}\` — where ` +
    `\`scratchHere = existsSync(SCRATCH)\` (${scratchDefn}) and \`SCRATCH = join(REPO, ` +
    `'.scratch')\` (${scratchIsRepoScratch}): the same directory, read live, in the grade that ` +
    `reports the class. \`git ls-files\` holds nothing under it (${!scratchTracked}), so no ` +
    `commit can move that conjunct either way — and whether it exists on the driving machine is ` +
    `printed under the \`LIVE —\` seam below rather than asserted here, which is this grade's own ` +
    `Round 394 cure. ` +
    `CONTROL, so the claim is not "all of it is live": \`conjunctPresent\` is in the same chain ` +
    `(${controlConjunct}) and is a read of MY source at MY pin, which any clone reproduces. ` +
    `ISOLATION, and the variable is ONE: two detached worktrees at \`${DRIVE_PIN}\`, identical in ` +
    `every byte either can carry and differing only in that one has a single ` +
    `\`.scratch/<sandbox>/scripts\` symlink planted — ` +
    `\`${detachedTally.join('/')}\` without it against \`${plantedTally.join('/')}: ` +
    `${plantedNotTrue.join(' ')}\` with it. My own worktree, which also has \`node_modules\` and ` +
    `so is NOT one variable away, reads \`${mineTally.join('/')}: ${mineNotTrue.join(' ')}\` and ` +
    `is the drive that found it, not the one that isolates it. His own cure, from ` +
    `his §2, applies to his own grade verbatim: a constant, or drop the conjunct`,
  scratchConjunctPresent &&
    scratchDefn &&
    scratchIsRepoScratch &&
    !scratchTracked &&
    controlConjunct &&
    mineTally[0] === 7 &&
    mineNotTrue.length === 1 &&
    mineNotTrue[0] === 'N3' &&
    detachedNotTrue.length === 0 &&
    plantedTally[0] === 7 &&
    JSON.stringify(plantedNotTrue) === JSON.stringify(['N3']),
);

// ── Q2b — the second live conjunct, and it is the class his own §4 is about ──────────────────
const BYTES_CONJUNCT = 'bytesIdentical';
const bytesConjunctPresent = n3Conjuncts.filter((c) => c === BYTES_CONJUNCT).length === 1;
const bytesDefn = /const bytesIdentical = his390AtPin === his390Live;/.test(his391);
const my390AtPin = show(MY_390_PIN_PRE_CURE, MY_390_PATH);
/**
 * Round 394 cure: `myCureMovedIt` WAS `my390AtPin !== readFileSync(join(REPO, MY_390_PATH))` — my
 * file at my pin against my live file. The claim is "taking his three cures moved that file", and
 * that claim is between two COMMITS, not between a commit and a working tree. Both digests
 * recorded, so a drive at a third commit cannot quietly re-point either side.
 */
const my390AtCurePin = show(MY_390_PIN_CURED, MY_390_PATH);
const myCureMovedIt =
  my390AtPin !== my390AtCurePin &&
  sha(my390AtPin) === MY_390_SHA_PRE_CURE &&
  sha(my390AtCurePin) === MY_390_SHA_CURED;
/** His §4, quoted from his memo's own words, so the parallel is his sentence and not my gloss. */
const HIS_SENTENCE = 'the grade that asks for the cure is the grade the cure breaks';
/**
 * Round 394 cure, and this is the pair his own census missed (Round 394 §2). This WAS
 * `readFileSync(join(REPO, '<the memo's path in docs/mail/>'))`, spelled across four lines — which
 * is why his `/readFileSync\(join\(REPO,/` pattern, keyed on token adjacency, did not reach it at
 * any depth. Then `3b0677e0` `git mv`-ed the memo into `docs/mail/read/` and the live read began
 * throwing `ENOENT` at module load: not a red grade, no verdict at all. Read at the commit that
 * ADDED the memo, which no later move can take away.
 */
const hisMemo = show(MEMO_PIN, HIS_391_MEMO_PATH);
/**
 * Whitespace-normalised, not loosened: his memo hard-wraps and this sentence crosses a line break,
 * so a raw `includes` of the exact words returned false and reddened this grade on its first
 * drive. The quote is unchanged; what changed is that the haystack is normalised before the
 * match, and the CONTROL below is a sentence that is NOT in his memo, so "normalising made
 * everything match" is itself ruled out (371/383).
 */
const flat = (s) => s.replace(/\s+/g, ' ');
const hisSentencePresent = flat(hisMemo).includes(flat(HIS_SENTENCE));
const quoteControl = !flat(hisMemo).includes(flat('the grade that asks for the cure is the grade the cure saves'));
g(
  'Q2b',
  `W2b HOLDS — and it is the second live conjunct in the same verdict, from the same chain of ` +
    `${n3Conjuncts.length}. \`${BYTES_CONJUNCT}\` is present exactly once ` +
    `(${bytesConjunctPresent}) and is defined as \`his390AtPin === his390Live\` (${bytesDefn}) — ` +
    `my file at my pin against my LIVE file. His \`N3\` routes me three cures; taking them moved ` +
    `that file — \`${MY_390_PIN_PRE_CURE}\` against \`${MY_390_PIN_CURED}\`, both digests ` +
    `recorded, between two commits rather than between a commit and this working tree ` +
    `(${myCureMovedIt}) — so \`N3\` is now red on that conjunct too, in a tree where ` +
    `every sentence inside it is still true. His §4 says of my \`T6\`: "${HIS_SENTENCE}" ` +
    `(verbatim from his memo, whitespace-normalised because it crosses a hard wrap: ` +
    `${hisSentencePresent}; and a one-word-altered copy of the same sentence is NOT found, so the ` +
    `normalisation is not what makes it match: ${quoteControl}). It is his sentence, and this is the grade ` +
    `that wrote it. The cure is the one he applied to his own \`P3\`/\`P4\` and I applied to my ` +
    `\`T3\`/\`T6\` this fire: read the pin, print the live file beside it, assert on neither`,
  bytesConjunctPresent && bytesDefn && myCureMovedIt && hisSentencePresent && quoteControl,
);

// ── Q3 — my cure, graded by the property it was for ──────────────────────────────────────────
/**
 * Not "the live drive is green" — that was true BEFORE the cure as well, which is the whole
 * defect. The property is that the three grades now read the SAME in a tree that cannot carry
 * untracked state (369: grade the thing the cure was for, behaviourally).
 */
const CURED = {
  live: 'my390-cured-live.out',
  detached: 'my390-cured-in-a-scratch-free-detached-worktree.out',
};
const curedLive = readFileSync(join(HERE, CURED.live), 'utf8');
const curedDetached = readFileSync(join(HERE, CURED.detached), 'utf8');
const curedLiveNotTrue = notTrueOf(curedLive);
const curedDetachedNotTrue = notTrueOf(curedDetached);
const THREE = ['T3', 'T6', 'T8'];
const threeGreenBoth = THREE.filter(
  (n) => !curedLiveNotTrue.includes(n) && !curedDetachedNotTrue.includes(n),
);
/** The pre-cure reading of the same three, in the same scratch-free tree — the control. */
const PRE_CURE_DETACHED_NOT_TRUE = ['T4', 'T5', 'T6', 'T8'];
const movedByTheCure = PRE_CURE_DETACHED_NOT_TRUE.filter((n) => !curedDetachedNotTrue.includes(n));
g(
  'Q3',
  `W3 HOLDS — my cure graded by the property it was for, and not by a green verdict in the one ` +
    `tree that was never in doubt. The three grades he routed read the same in both trees: ` +
    `${threeGreenBoth.length} of ${THREE.length} green in each (${threeGreenBoth.join(', ')}), ` +
    `live \`${tallyOf(curedLive).join('/')}\` and scratch-free detached ` +
    `\`${tallyOf(curedDetached).join('/')}\`. CONTROL, the same detached tree before the cure: ` +
    `[${PRE_CURE_DETACHED_NOT_TRUE.join(' ')}] not true, so the cure moved ` +
    `[${movedByTheCure.join(' ')}] and nothing else. What remains red there is ` +
    `[${curedDetachedNotTrue.join(' ')}] — \`T4\` and \`T5\` typecheck, that tree has no ` +
    `\`node_modules\`, and \`npx --no-install tsc --version\` fails in it. They REFUSE rather ` +
    `than read green, which is the guard my Round 390 built for exactly that, firing. Named and ` +
    `not cured: a toolchain is reproducible from the lockfile and a \`.scratch\` is reproducible ` +
    `by nothing, so they are not the same class`,
  threeGreenBoth.length === 3 &&
    curedLiveNotTrue.length === 0 &&
    JSON.stringify(curedDetachedNotTrue) === JSON.stringify(['T4', 'T5']) &&
    JSON.stringify(movedByTheCure) === JSON.stringify(['T6', 'T8']),
);

// ── Q4 — his §7, answered: the population grew, the arm did not ──────────────────────────────
const ARROW = /export declare const ([A-Za-z0-9_$]+)\s*:\s*\(/g;
const FUNC = /export declare function ([A-Za-z0-9_$]+)\s*\(/g;
const shapesAt = (pin) => {
  const files = git(['ls-tree', '-r', '--name-only', pin])
    .split('\n')
    .filter((f) => f.startsWith('scripts/') && f.endsWith('.d.mts'));
  const per = {};
  let arrow = 0;
  let func = 0;
  for (const f of files) {
    const src = show(pin, f);
    const a = [...src.matchAll(ARROW)].length;
    const b = [...src.matchAll(FUNC)].length;
    per[f.replace('scripts/', '')] = [a, b];
    arrow += a;
    func += b;
  }
  return { per, arrow, func, total: arrow + func };
};
const then = shapesAt(R307_PIN);
const now = shapesAt('HEAD');
/**
 * The two halves of "the arm did not move", quoted out of his probe at both pins rather than
 * eyeballed: the selector `B3` counts with, and the rule that picks the files it counts over.
 */
const sliceAt = (pin, needle, n) => {
  const s = show(pin, PROBE_303);
  const i = s.indexOf(needle);
  return i < 0 ? null : s.slice(i, i + n);
};
const selectorThen = sliceAt(R307_PIN, 'decl.matchAll(', 70);
const selectorNow = sliceAt('HEAD', 'decl.matchAll(', 70);
const pairsThen = sliceAt(R307_PIN, 'const DECLARED_PAIRS', 120);
const pairsNow = sliceAt('HEAD', 'const DECLARED_PAIRS', 120);
const armUnmoved = selectorThen === selectorNow && pairsThen === pairsNow && selectorThen !== null;
const floorThen = (show(R307_PIN, PROBE_303).match(/signaturesChecked >= (\d+)/) || [])[1];
const floorNow = (show('HEAD', PROBE_303).match(/signaturesChecked >= (\d+)/) || [])[1];
/** KNOWN POSITIVE: the key must return the figure the probe itself prints today, or it is my key. */
const KP_PROBE_PRINTS = 18;
const keyAgreesWithProbe = now.arrow === KP_PROBE_PRINTS;
const grewBy = Object.entries(now.per)
  .filter(([f, [a]]) => a !== (then.per[f]?.[0] ?? 0))
  .map(([f, [a]]) => `${f} ${then.per[f]?.[0] ?? 0}→${a}`);
const unreachable = Object.entries(now.per)
  .filter(([, [a, b]]) => a === 0 && b > 0)
  .map(([f, [, b]]) => `${f} (${b})`);
g(
  'Q4',
  `W4 HOLDS — his §7, answered, and the half he did not ask about moved further. He named two ` +
    `hypotheses for \`B3\`'s reach going 14 → 18 and did not pick: the file grew, or the arm was ` +
    `widened. It is the first. The arm is byte-identical at both pins (${armUnmoved}) — same ` +
    `selector and same \`DECLARED_PAIRS\` rule — and the floor is \`>= ${floorThen}\` at both ` +
    `(${floorThen === floorNow}), which is why no value above 14 can redden it. What moved is the ` +
    `population: [${grewBy.join(', ')}]. KNOWN POSITIVE: my key returns ${now.arrow} today, ` +
    `which is the figure the probe itself prints (${keyAgreesWithProbe}), so the key is graded ` +
    `against a published reading and not just against itself. AND the denominator moved with it. ` +
    `At \`${R307_PIN}\` the tree held ${then.arrow} const-arrow and ${then.func} function-shaped ` +
    `declarations — ${then.arrow} of ${then.total}, exactly the parenthetical. Today it is ` +
    `${now.arrow} of ${now.total}. So the sentence is stale in BOTH halves and in the direction ` +
    `that matters: \`B3\` reached ${Math.round((then.arrow / then.total) * 100)}% of declared ` +
    `signatures when the note was written and reaches ` +
    `${Math.round((now.arrow / now.total) * 100)}% now. Wholly unreachable to it today, 0 ` +
    `const-arrow and all function-shaped: [${unreachable.join(', ')}]`,
  armUnmoved &&
    floorThen === floorNow &&
    floorThen === '14' &&
    keyAgreesWithProbe &&
    then.arrow === 14 &&
    then.total === 18 &&
    now.total > then.total &&
    grewBy.length > 0,
);

// ── Q5 — mine, this fire ─────────────────────────────────────────────────────────────────────
g(
  'Q5',
  `W5 HOLDS — MINE, and the only reason it surfaced is that I wrote the expectation down before ` +
    `the drive (382/386). To isolate his §2 I built a detached worktree at \`${DRIVE_PIN}\` and ` +
    `predicted my Round 390 instrument would read \`8 grades, 2 not true: T6 T8\` there. It read ` +
    `\`8 grades, 4 not true: [${PRE_CURE_DETACHED_NOT_TRUE.join(' ')}]\`. A detached worktree is ` +
    `NOT one variable away from mine: it carries no \`node_modules\` either, and \`T4\`/\`T5\` ` +
    `drive \`tsc\`. Had I treated that tree as the counterfactual I would have attributed two ` +
    `typecheck refusals to the gitignored directory and published a four-grade swing as evidence ` +
    `for a one-conjunct finding. The finding above is structural for exactly this reason — ` +
    `\`${SCRATCH_CONJUNCT}\` is read out of his verdict chain, so it stands whatever the drives ` +
    `do — and the two drives are isolation beside it, not the argument. SECOND, smaller, and also ` +
    `caught by a grade rather than by care: \`Q2b\` went red on its first drive because I keyed ` +
    `his sentence with a raw \`includes\` and his memo hard-wraps it across two lines. The quote ` +
    `was right and the key was wrong — the failure direction of a quote check is toward "he never ` +
    `said that", which is the most expensive thing to publish about another agent's memo (371)`,
  true,
);

/**
 * LIVE — the five readings that used to be conjuncts of the chains above, read once here and
 * asserted on by NOTHING. A missing read prints as a refusal rather than resolving into a passing
 * comparison (356/393): `null`, never a sentinel that can compare equal to itself.
 */
const liveOrNull = (p) => {
  try {
    return readFileSync(join(REPO, p), 'utf8');
  } catch {
    return null;
  }
};
const his391LiveNow = liveOrNull(HIS_391_PATH);
const my390LiveNow = liveOrNull(MY_390_PATH);
const memoLiveNow = liveOrNull(HIS_391_MEMO_PATH);
const sameOrRefuse = (pinned, live) => (live === null ? 'NOT FOUND' : String(pinned === live));
console.log(
  `\nLIVE — this machine, asserted on by nothing: \`.scratch\` present here: ${scratchHereNow}; ` +
    `his Round 391 file still byte-identical to \`${HIS_391_PIN}\`: ` +
    `${sameOrRefuse(his391, his391LiveNow)}; my Round 390 file still byte-identical to ` +
    `\`${MY_390_PIN_CURED}\`: ${sameOrRefuse(my390AtCurePin, my390LiveNow)}; his Round 391 memo ` +
    `still at its original \`docs/mail/\` path: ${memoLiveNow === null ? 'NOT FOUND' : 'true'}.\n`,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length === 0 ? 0 : 1);
