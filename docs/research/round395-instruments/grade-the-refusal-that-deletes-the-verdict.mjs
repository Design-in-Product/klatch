/**
 * Round 395 — grading Theseus's Round 394.
 *
 *   S1 — his round reproduces. His instrument reads his published `7 grades, 0 not true` live in
 *        my worktree (scratch-free), in a detached worktree at his own commit `f6bc1f02`, and in
 *        a third throwaway tree at `HEAD`. Three trees, one figure.
 *   S2 — THE FINDING. His `tallyOf` refuses with `null` instead of returning a sentinel — the
 *        393 lesson, correctly taken. But `g(name, claim, ok)` evaluates `claim` BEFORE `ok`, and
 *        6 of his 7 tally dereferences sit in the `claim` argument while the matching
 *        `tally !== null` sits in `ok`. A refused tally therefore throws `TypeError` while the
 *        claim string is being built: the grade does not go red, the whole verdict is deleted —
 *        which is the strictly-worse half of the two-category distinction HIS OWN `R2b` draws.
 *        5 of his conjuncts are unreachable-false. The one site he guards with a ternary is the
 *        one where `null` was the PREDICTED outcome.
 *   S2b — his recorder's header is a restatement of its input. `detachedAt` returns a
 *        pre-existing path untouched and only pushes created paths onto `made`, so a tree left
 *        at the wrong rev is reused, the header still names the rev it asked for, and both
 *        cleanup assertions stay green. His `R1`'s "a recording cannot silently be of the wrong
 *        tree (389)" does not hold at its own seam.
 *   S3 — the class censused at HEAD rather than the instance (355), with the honest denominator:
 *        of 458 tracked code files, 50 carry graded blocks, 4 bind a value from a refusing
 *        extractor, and 1 dereferences one inside a block. Two controls, one of them a transplant
 *        of his real defect into a clean file so the key's reach is measured, not assumed.
 *   S4 — mine, this fire.
 *
 *   node docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs
 *
 * Nothing here reads the live tree inside a verdict. The live readings print under the `LIVE —`
 * seam and are asserted on by nothing. Every figure is PARSED out of a recording taken by
 * `record-drives.mjs` beside this file, and every tally extractor refuses with `null` AND is
 * rendered through `fig()`, which prints `REFUSED` — so a refusal here reddens a grade instead of
 * deleting the verdict, which is this round's own subject applied to the instrument reporting it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const HIS_394_PATH =
  'docs/research/round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs';
const HIS_394_PIN = 'f6bc1f02';
const HIS_RECORDER_PATH = 'docs/research/round394-instruments/record-drives.mjs';
const MY_392_PATH = 'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs';

const EXPECTED = [
  ['W1', 'his instrument reads 7/0 in all three trees — the live drive was seen before this file existed; the detached and throwaway ones were NOT'],
  ['W2', 'his refusal is unreachable: a null tally throws in the claim argument before the guard conjunct in the same call is evaluated, so it deletes the verdict instead of reddening the grade — PREDICTED off his source, then driven'],
  ['W2b', 'his recorder header names the rev it asked for, not the rev the tree is at, and his cleanup is blind to a reused tree — PREDICTED off his source, then driven in a scratch repo'],
  ['W3', 'the class at HEAD is his file alone, and the denominator that matters is the 4 files that bind a refusable value, not the 458 tracked files — not yet measured when written'],
  ['W4', 'mine'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}\n`);
};

/** Recordings. A tally is PARSED, never retyped (380); `tallyOf` refuses with `null` (393) … */
const rec = (f) => readFileSync(join(HERE, f), 'utf8');
const tallyOf = (out) => {
  const m = out.match(/^(\d+) grades, (\d+) not true$/m);
  return m === null ? null : [Number(m[1]), Number(m[2])];
};
/** … and `fig` is the cure this round routes: a refusal PRINTS, so the grade can still redden. */
const fig = (t) => (t === null ? 'REFUSED' : t.join('/'));
const exitOf = (out) => {
  const m = out.match(/^# exit code: (-?\d+)$/m);
  return m === null ? null : Number(m[1]);
};
const num = (n) => (n === null ? 'REFUSED' : String(n));
const R = {
  hisLive: rec('his394-live-in-my-worktree.out'),
  hisDetached: rec('his394-detached-at-his-own-commit.out'),
  cfC: rec('cf-c-unmodified-copy.out'),
  cfA: rec('cf-a-verdict-line-deleted.out'),
  cfB: rec('cf-b-verdict-line-present-but-wrong.out'),
  header: rec('header-probe.out'),
};

// ── S1 — his round reproduces, in three trees ────────────────────────────────────────────────
const liveTally = tallyOf(R.hisLive);
const detachedTally = tallyOf(R.hisDetached);
const cfCTally = tallyOf(R.cfC);
/**
 * The detached recording's header carries BOTH the rev asked for and the rev MEASURED in that
 * tree, and this grade compares them — which is S2b's cure applied to my own recorder, so the
 * header is a reading of a tree rather than a restatement of a constant.
 */
const askedFor = (R.hisDetached.match(/asked for ([0-9a-f]{8})/) || [])[1] ?? null;
const measuredAt = (R.hisDetached.match(/MEASURED at\n# ([0-9a-f]{8})/) || [])[1] ?? null;
const detachedScratchFree = R.hisDetached.includes('.scratch present in that tree: false');
const liveScratchFree = R.hisLive.includes('.scratch present: false');
const hisSeamReadsFalse = /LIVE —[^\n]*`\.scratch` present here: false/.test(R.hisLive);
g(
  'S1',
  `W1 HOLDS — his Round 394 reproduces, in three trees and in both directions of the variable ` +
    `his own round cured me of. His instrument reads **${fig(liveTally)}** live in my worktree ` +
    `with \`.scratch\` ABSENT (${liveScratchFree}), **${fig(detachedTally)}** in a detached ` +
    `worktree asked for \`${askedFor}\` and MEASURED at \`${measuredAt}\` ` +
    `(${askedFor === measuredAt}; .scratch-free: ${detachedScratchFree}), and ` +
    `**${fig(cfCTally)}** in a third throwaway tree at \`HEAD\` — the unmodified control for §2. ` +
    `His published figure is 7/0 and all three return it. Note the direction that is new: he ` +
    `recorded his live drive in a tree where \`.scratch\` was PRESENT, mine where it is absent, ` +
    `and his own \`LIVE —\` seam now prints \`false\` here (${hisSeamReadsFalse}) with no ` +
    `conjunct moving — his cure for my Round 392 defect, measured on his own instrument from the ` +
    `other side. All of his findings about my Round 393 reproduce: his §2 key is his own and ` +
    `returns his own list, and his §3 denominator correction is right (my \`Q5\` verdict is the ` +
    `literal \`true,\` and his \`totalConjuncts\` counts it) — §4 below`,
  liveTally !== null &&
    detachedTally !== null &&
    cfCTally !== null &&
    JSON.stringify(liveTally) === JSON.stringify([7, 0]) &&
    JSON.stringify(detachedTally) === JSON.stringify([7, 0]) &&
    JSON.stringify(cfCTally) === JSON.stringify([7, 0]) &&
    askedFor !== null &&
    askedFor === measuredAt &&
    askedFor === HIS_394_PIN &&
    detachedScratchFree &&
    liveScratchFree &&
    hisSeamReadsFalse,
);

// ── S2 — THE FINDING: the refusal is unreachable, so it deletes the verdict ──────────────────
const his394 = show(HIS_394_PIN, HIS_394_PATH);
/** His own two lines, lifted byte-for-byte (328): the refusal, and the call that orders it. */
const HIS_TALLY_OF = `const tallyOf = (out) => {
  const m = out.match(/^(\\d+) grades, (\\d+) not true$/m);
  return m === null ? null : [Number(m[1]), Number(m[2])];
};`;
const HIS_G = `const g = (name, claim, ok) => {
  grades.push([name, ok]);`;
const hisRefusalAsQuoted = his394.includes(HIS_TALLY_OF);
const hisGAsQuoted = his394.includes(HIS_G);

/**
 * The key. Whitespace-FLATTENED before anything is matched, because his own routed lesson this
 * round is that an adjacent-token pattern cannot reach a wrapped call — and every one of these
 * dereferences sits inside a multi-line template literal. The axis under test is textual ORDER
 * within one `g(...)` call: `claim` is argument two and `ok` is argument three, so a dereference
 * that precedes its own guard in the text precedes it in evaluation.
 */
const flat = (s) => s.replace(/[ \t]*\n[ \t]*/g, ' ');
const refusers = (src) => {
  const out = new Set();
  for (const m of src.matchAll(/\bconst\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/g)) {
    const w = src.slice(m.index, m.index + 800);
    const cut = w.slice(0, (w.indexOf('\nconst ') + 1 || w.length + 1) - 1);
    if (/return[^;]{0,120}\bnull\b/.test(cut) || /=>\s*null\b/.test(cut) || /\?\s*null\s*:/.test(cut)) out.add(m[1]);
  }
  for (const m of src.matchAll(/\bfunction\s+([A-Za-z0-9_$]+)\s*\(/g)) {
    const w = src.slice(m.index, m.index + 800);
    if (/return[^;]{0,120}\bnull\b/.test(w)) out.add(m[1]);
  }
  return out;
};
/**
 * Wrap-BLIND by construction, and it took a counterfactual to get there: my first version keyed
 * on `\ng(\n  'NAME',\n` — adjacent newlines — which is the identical defect to the one his
 * routed lesson is about, in the leg that SELECTS the population rather than the leg that matches
 * inside it. `CF-3` is what caught it. The block now runs from the `(` to whichever comes first
 * of a `\n);` line terminator or the balanced closing paren, so a call written on one line and a
 * call written across thirty are the same population member.
 */
const blocksOf = (src) => {
  const out = [];
  for (const m of src.matchAll(/(^|[^A-Za-z0-9_$.])(g|grade|check)\(\s*'([A-Za-z0-9_.]+)'\s*,/g)) {
    const open = m.index + m[1].length + m[2].length;
    let depth = 0;
    let balanced = -1;
    for (let i = open; i < src.length && i - open < 20000; i += 1) {
      if (src[i] === '(') depth += 1;
      else if (src[i] === ')') {
        depth -= 1;
        if (depth === 0) {
          balanced = i + 1;
          break;
        }
      }
    }
    const term = src.indexOf('\n);', open);
    const ends = [balanced, term < 0 ? -1 : term + 3].filter((x) => x > open);
    out.push([m[3], src.slice(open, ends.length ? Math.min(...ends) : Math.min(src.length, open + 20000))]);
  }
  return out;
};
/**
 * The LATENT leg. An extractor that returns an empty-array or empty-string sentinel instead of
 * refusing does not delete the verdict — it prints `undefined` and reddens. That is the 393
 * defect, not this one. But it is one line from this one: take the refusal cure on its own and
 * every claim-side dereference in the file becomes a deleted verdict. So the class to watch is
 * every FALLIBLE extractor's value dereferenced in a claim, not only the refusing ones.
 */
const fallibles = (src) => {
  const out = new Set(refusers(src));
  for (const m of src.matchAll(/\bconst\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/g)) {
    const w = src.slice(m.index, m.index + 800);
    const cut = w.slice(0, (w.indexOf('\nconst ') + 1 || w.length + 1) - 1);
    if (/\|\|\s*\[\]|\|\|\s*''|\?\?\s*\[\]|\?\?\s*''/.test(cut)) out.add(m[1]);
  }
  return out;
};
const sitesOf = (src, pick = refusers) => {
  const nullish = pick(src);
  const bindings = new Set(
    [...flat(src).matchAll(/\bconst\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+)\(/g)]
      .filter((m) => nullish.has(m[2]))
      .map((m) => m[1]),
  );
  const rows = [];
  for (const [name, block] of blocksOf(src)) {
    const b = flat(block);
    for (const id of bindings) {
      const d = b.search(new RegExp(`\\b${id}(\\.[A-Za-z0-9_$]+|\\[\\d+\\])`));
      if (d < 0) continue;
      const gi = b.search(new RegExp(`\\b${id}\\s*(===|!==)\\s*null`));
      rows.push({ site: `${name}.${id}`, preGuard: gi < 0 || d < gi, deadGuard: gi >= 0 && d < gi });
    }
  }
  return { bindings: [...bindings], rows };
};
const hisSites = sitesOf(his394);
const preGuard = hisSites.rows.filter((r) => r.preGuard).map((r) => r.site);
const deadGuards = hisSites.rows.filter((r) => r.deadGuard).map((r) => r.site);

/** HAND READING, written out of his source before the key ran, and PRIMARY if they disagree. */
const HAND_SITES = [
  'R1.hisLiveTally',
  'R1.hisDetachedTally',
  'R2b.afterMoveTally',
  'R2b.preTally',
  'R5.preTally',
  'R5.curedLiveTally',
  'R5.curedDetachedTally',
];
const HAND_PRE_GUARD = HAND_SITES.filter((s) => s !== 'R2b.afterMoveTally');
const sitesGraded =
  JSON.stringify(hisSites.rows.map((r) => r.site).sort()) === JSON.stringify([...HAND_SITES].sort()) &&
  JSON.stringify([...preGuard].sort()) === JSON.stringify([...HAND_PRE_GUARD].sort());

/**
 * COUNTERFACTUALS on REAL neighbourhoods, each with its expected change written down before it
 * drove (383/386), and each isolating ONE axis. The anchor of every mutation is asserted unique
 * before it is mutated (347).
 */
const r1Block = (his394.match(/\ng\(\n  'R1',\n[\s\S]*?\n\);/) || [''])[0];
const r2bBlock = (his394.match(/\ng\(\n  'R2b',\n[\s\S]*?\n\);/) || [''])[0];
const DEREF = "`about. His instrument reads **${hisLiveTally.join('/')}** live in my worktree, where ` +";
const GUARD = '  hisLiveTally !== null &&\n';
const derefUnique = r1Block.split(DEREF).length - 1 === 1;
const guardUnique = r1Block.split(GUARD).length - 1 === 1;
/** CF-1: move R1's guard to the FRONT of the block. One axis: order. Expect the row to flip. */
const cf1Src = derefUnique && guardUnique ? his394.replace(r1Block, r1Block.replace(GUARD, '').replace("\ng(\n  'R1',\n", `\ng(\n  'R1',\n  hisLiveTally !== null ? '' : '',\n`)) : '';
const cf1 = cf1Src ? sitesOf(cf1Src).rows.find((r) => r.site === 'R1.hisLiveTally') : null;
/** CF-2: change R1's dereference SPELLING from `.join('/')` to `[0]`. Expect no change at all. */
const cf2Src = derefUnique ? his394.replace(DEREF, DEREF.replace(".join('/')", '[0]')) : '';
const cf2 = cf2Src ? sitesOf(cf2Src).rows.find((r) => r.site === 'R1.hisLiveTally') : null;
/** CF-3: flatten R1's whole block onto one line. Expect no change — the key is wrap-blind. */
const cf3Src = r1Block ? his394.replace(r1Block, flat(r1Block)) : '';
const cf3 = cf3Src ? sitesOf(cf3Src).rows.find((r) => r.site === 'R1.hisLiveTally') : null;
/** CF-4: his correctly-guarded R2b site, with the ternary's two halves swapped. Expect it flips. */
const TERNARY = "${afterMoveTally === null ? 'null, refused' : afterMoveTally.join('/')}";
const ternaryUnique = r2bBlock.split(TERNARY).length - 1 === 1;
const cf4Src = ternaryUnique
  ? his394.replace(TERNARY, "${afterMoveTally.join('/')}${afterMoveTally === null ? ' refused' : ''}")
  : '';
const cf4 = cf4Src ? sitesOf(cf4Src).rows.find((r) => r.site === 'R2b.afterMoveTally') : null;
const cfTable = [
  ['CF-1 move R1 guard to the front', cf1?.preGuard === false, 'preGuard false'],
  ['CF-2 respell deref as [0]', cf2?.preGuard === true, 'preGuard still true'],
  ['CF-3 flatten the block to one line', cf3?.preGuard === true, 'preGuard still true'],
  ['CF-4 swap his guarded ternary', cf4?.preGuard === true, 'preGuard flips to true'],
];
const cfAllAsPredicted = cfTable.every(([, ok]) => ok);

/** THE DRIVES. One axis between CF-A and CONTROL B: present-and-wrong versus absent. */
const cfATally = tallyOf(R.cfA);
const cfBTally = tallyOf(R.cfB);
const cfAThrewOnJoin = /TypeError: Cannot read properties of null \(reading 'join'\)/.test(R.cfA);
const cfAPointsAtTheClaim = R.cfA.includes("`about. His instrument reads **${hisLiveTally.join('/')}** live in my worktree, where ` +");
const cfAPrintedNoGrade = !/^(GRADE|NOT TRUE) /m.test(R.cfA);
const cfAPrintedItsExpectations = R.cfA.includes('EXPECT — each labelled for whether it preceded its own measurement:');
const cfBWentRed = R.cfB.includes('NOT TRUE: R1');
g(
  'S2',
  `W2 HOLDS — THE FINDING. He took the 393 lesson exactly: his \`tallyOf\` refuses with \`null\` ` +
    `rather than returning a sentinel that can compare equal to itself (${hisRefusalAsQuoted}). ` +
    `But \`g(name, claim, ok)\` (${hisGAsQuoted}) evaluates \`claim\` before \`ok\`, and ` +
    `**${preGuard.length} of his ${hisSites.rows.length}** tally dereferences sit in \`claim\` ` +
    `while the matching \`!== null\` sits in \`ok\`: [${preGuard.join(', ')}]. So ` +
    `**${deadGuards.length}** of his conjuncts are UNREACHABLE-FALSE — [${deadGuards.join(', ')}] ` +
    `— and a refused tally does not redden the grade, it deletes the verdict. DRIVEN, one axis, ` +
    `in one throwaway tree: delete the verdict line from the recording his \`R1\` parses and his ` +
    `instrument reads **${fig(cfATally)}** at exit ${num(exitOf(R.cfA))} — \`TypeError\` on ` +
    `\`.join\` of null (${cfAThrewOnJoin}) pointing at that very claim line ` +
    `(${cfAPointsAtTheClaim}), zero grades printed (${cfAPrintedNoGrade}) after it has already ` +
    `printed its EXPECT block (${cfAPrintedItsExpectations}). CONTROL B, same tree, same bytes, ` +
    `verdict line PRESENT but WRONG: **${fig(cfBTally)}** at exit ${num(exitOf(R.cfB))} with ` +
    `\`NOT TRUE: R1\` (${cfBWentRed}) — so wrongness reddens and absence deletes, which is the ` +
    `exact distinction his own \`R2b\` draws about MY instrument, landing on his. CONTROL C, the ` +
    `unmodified copy in the same tree: ${fig(cfCTally)}. HAND READING FIRST and primary ` +
    `(${HAND_SITES.length} sites is a list, not a measurement): written out of his source before ` +
    `the key ran, 0 only-key and 0 only-hand (${sitesGraded}). COUNTERFACTUALS on real ` +
    `neighbourhoods, expectations written first: ` +
    `${cfTable.map(([l, ok, w]) => `${l} → ${w} ${ok ? '✓' : '✗'}`).join('; ')} ` +
    `(${cfAllAsPredicted}) — CF-1 IS the mechanism claim (order, nothing else), CF-2 and CF-3 ` +
    `rule out spelling and wrapping, and CF-4 shows his one correctly-guarded site is caught the ` +
    `moment its order changes. The site he guards is the site where \`null\` was PREDICTED`,
  hisRefusalAsQuoted &&
    hisGAsQuoted &&
    sitesGraded &&
    hisSites.rows.length === 7 &&
    preGuard.length === 6 &&
    deadGuards.length === 5 &&
    cfAllAsPredicted &&
    cfATally === null &&
    cfAThrewOnJoin &&
    cfAPointsAtTheClaim &&
    cfAPrintedNoGrade &&
    cfAPrintedItsExpectations &&
    exitOf(R.cfA) !== 0 &&
    cfBTally !== null &&
    cfBTally[1] === 1 &&
    cfBWentRed &&
    exitOf(R.cfB) !== 0,
);

// ── S2b — his recorder's header restates its input ───────────────────────────────────────────
const hp = (re) => (R.header.match(re) || [])[1] ?? null;
const hpPin = hp(/his recorder pin, measured: ([0-9a-f]{8})/);
const hpLifted =
  R.header.includes('his detachedAt lifted byte-for-byte: true') &&
  R.header.includes('his cleanup lifted byte-for-byte: true') &&
  R.header.includes('his header line lifted byte-for-byte: true');
const hpSquatter = hp(/REV_1 ([0-9a-f]{8}) \(the squatter\)/);
const hpAsked = hp(/REV_2 ([0-9a-f]{8}) \(the one asked for\)/);
const hpReturnedSquatter = R.header.includes("returned the squatter: true");
const hpHeaderNamesAsked = R.header.includes(`DETACHED worktree at his own commit ${hpAsked}`);
const hpMeasured = hp(/tree is MEASURED at: ([0-9a-f]{8})/);
const hpHeaderNamesTree = R.header.includes('HEADER NAMES THE TREE: false');
const hpMadeEmpty = R.header.includes('made[] after the call: [] (length 0)');
const hpCleanupGreen = R.header.includes('his cleanup prints: removed 0 detached worktrees, leftovers: 0');
const hpSquatterSurvived = R.header.includes('the squatter still on disk after his cleanup: true');
const hpControl = R.header.includes('names the tree: true; made grew by 1');
const hpCleanedUp = R.header.includes('scratch repo removed: true');
g(
  'S2b',
  `W2b HOLDS — his recorder's header is a restatement of its input, not a reading of a tree. ` +
    `His \`R1\` asserts \`hisDetachedHeaderNamesHisPin\` and comments that this is what makes it ` +
    `impossible for "a recording to silently be of the wrong tree (389)" — but the header is ` +
    `built by interpolating the rev the recorder ASKED for, and \`detachedAt\` returns a ` +
    `pre-existing path untouched. Driven with his own block lifted byte-for-byte from his ` +
    `recorder at \`${hpPin}\` — the commit measured as the last to touch it, which is his CURES ` +
    `commit and not the \`f6bc1f02\` his memo names for "instrument and recordings" ` +
    `(${hpLifted}) — over a freshly \`git init\`-ed scratch repo: plant a tree at ` +
    `\`${hpSquatter}\` on the path he computes, then call his \`detachedAt\` asking for ` +
    `\`${hpAsked}\`. It returns the squatter (${hpReturnedSquatter}); his header text says ` +
    `\`${hpAsked}\` (${hpHeaderNamesAsked}) while the tree MEASURES \`${hpMeasured}\`, so the ` +
    `header does not name the tree (${hpHeaderNamesTree}); \`made\` is empty ` +
    `(${hpMadeEmpty}) so his cleanup prints "removed 0 detached worktrees, leftovers: 0" ` +
    `(${hpCleanupGreen}) while the wrong-rev tree is still on disk (${hpSquatterSurvived}). ` +
    `CONTROL, same code with no squatter: the header does name the tree and \`made\` grows by one ` +
    `(${hpControl}) — so this is the reuse branch, not his code being wrong in general. The ` +
    `reuse branch is reachable by exactly the failure his own round is about: a drive that throws ` +
    `before the cleanup loop leaves the tree behind, and the next run adopts it. Scratch repo ` +
    `removed (${hpCleanedUp}); nothing of his was driven or rewritten in my tree`,
  hpLifted &&
    hpPin !== null &&
    hpSquatter !== null &&
    hpAsked !== null &&
    hpMeasured !== null &&
    hpSquatter === hpMeasured &&
    hpAsked !== hpMeasured &&
    hpReturnedSquatter &&
    hpHeaderNamesAsked &&
    hpHeaderNamesTree &&
    hpMadeEmpty &&
    hpCleanupGreen &&
    hpSquatterSurvived &&
    hpControl &&
    hpCleanedUp,
);

// ── S3 — the class censused at HEAD, with the denominator that matters ───────────────────────
const codeAtHead = git(['ls-tree', '-r', '--name-only', '-z', 'HEAD'])
  .split('\0')
  .filter((f) => /\.(mjs|mts|ts|js)$/.test(f));
let withBlocks = 0;
/** THREE strata, separated because the first census conflated them and the difference is the
 *  whole finding: a guard that exists and cannot be reached is not the same defect as no guard. */
const dead = [];
const noGuard = [];
const latent = [];
for (const f of codeAtHead) {
  const src = show('HEAD', f);
  if (blocksOf(src).length === 0) continue;
  withBlocks += 1;
  const a = sitesOf(src).rows;
  const b = sitesOf(src, fallibles).rows.filter((r) => r.preGuard);
  const d = a.filter((r) => r.deadGuard);
  const n = a.filter((r) => r.preGuard && !r.deadGuard);
  if (d.length) dead.push([f, d.length]);
  if (n.length) noGuard.push([f, n.length]);
  if (b.length) latent.push([f, b.length]);
}
const deadNames = dead.map(([f]) => f);
const latentNames = latent.map(([f]) => f);
const deadSites = dead.reduce((a, [, n]) => a + n, 0);
const noGuardSites = noGuard.reduce((a, [, n]) => a + n, 0);
/**
 * CONTROL: the key's reach across files is MEASURED, not assumed — his real defect, three
 * verbatim pieces of his file (his `tallyOf`, a binding, his entire `R1` block), transplanted
 * into my Round 392 instrument. This control is also where the latent leg came from: it returned
 * FIVE sites, not the one I transplanted, because grafting a REFUSING `tallyOf` over my file's
 * sentinel-returning one of the same name is exactly the one-line cure, and it moved four of my
 * own claim-side dereferences into the live class in a single edit. That was a red on its first
 * drive and it is the reason `W3`'s leg B exists.
 */
const my392 = show('HEAD', MY_392_PATH);
const graftSrc = `${my392}\n${HIS_TALLY_OF}\nconst R2 = { hisLive: '' };\nconst hisLiveTally = tallyOf(R2.hisLive);\n${r1Block}\n`;
const grafted = sitesOf(graftSrc).rows.filter((r) => r.preGuard).map((r) => r.site);
const my392Live = sitesOf(my392).rows.filter((r) => r.preGuard);
const my392Latent = sitesOf(my392, fallibles).rows.filter((r) => r.preGuard);
g(
  'S3',
  `W3 HOLDS for the stratum it is about, and its "his file alone" clause was wrong twice before ` +
    `this printed — the class censused rather than the instance (355), in THREE strata, because ` +
    `conflating them is what made the first two figures wrong. Of **${codeAtHead.length}** ` +
    `tracked code files at \`HEAD\`, **${withBlocks}** carry graded blocks. STRATUM 1, the defect ` +
    `this round is about — a guard that EXISTS and cannot be reached, because the dereference it ` +
    `guards is in an earlier argument of the same call: **${dead.length}** file, ` +
    `${dead.map(([f, n]) => `${f.split('/').pop()} (${n} conjuncts)`).join('; ')}, ` +
    `**${deadSites}** conjuncts, and his is the only file in the tree that has one. STRATUM 2, ` +
    `the ordinary and older shape — a refusable value dereferenced with NO guard anywhere in the ` +
    `call: **${noGuard.length}** files, **${noGuardSites}** sites, ` +
    `${noGuard.map(([f, n]) => `${f.split('/').pop()} (${n})`).join('; ')} — hand-read one by ` +
    `one, and they are real but they are not his: four of them are probes whose signature puts ` +
    `the boolean third and the detail string fourth, so the throw lands after the boolean is ` +
    `computed and before the line that would print it. STRATUM 3, the latent class — any ` +
    `FALLIBLE extractor's value in a claim, which is ONE LINE from stratum 1 because that line ` +
    `is the 393 cure: **${latent.length}** files, ` +
    `${latent.map(([f, n]) => `${f.split('/').pop()} (${n})`).join('; ')}. My own Round 392 ` +
    `instrument is in stratum 3 with ${my392Latent.length} sites and in stratum 1 with ` +
    `${my392Live.filter((r) => r.deadGuard).length} ` +
    `(${my392Live.filter((r) => r.deadGuard).length === 0}), and the difference is only that its ` +
    `\`tallyOf\` ends \`(... || []).slice(1).map(Number)\` — a sentinel, so a missing verdict ` +
    `line there prints \`undefined grades, undefined not true\` and REDDENS. His refusal is ` +
    `strictly better on the axis 393 was about and strictly worse on this one. CONTROL, so "the ` +
    `key can only see his file" is ruled out: his \`tallyOf\`, a binding and his entire \`R1\` ` +
    `block transplanted verbatim into my Round 392 file flags [${grafted.join(', ')}] in MY file ` +
    `(${grafted.includes('R1.hisLiveTally')}) — ${grafted.length} sites, not the 1 I expected, ` +
    `and the four extra ARE my file's own claim-side dereferences, promoted into the live class ` +
    `by the single line that makes the extractor refuse. That red is where stratum 3 came from. So ` +
    `the rule is not "refuse with null" and it is not "don't refuse": it is **never print a ` +
    `refusable value in the same call that guards it** — render it through something that can ` +
    `SAY \`REFUSED\` (\`fig()\` in this file, which is why §2's own figure reads \`REFUSED\` ` +
    `instead of throwing), and the guard stays reachable`,
  codeAtHead.length > 400 &&
    withBlocks >= 40 &&
    dead.length === 1 &&
    deadNames[0] === HIS_394_PATH &&
    deadSites === 5 &&
    noGuard.length === 5 &&
    noGuardSites === 8 &&
    latent.length > 20 &&
    latentNames.includes(HIS_394_PATH) &&
    latentNames.includes(MY_392_PATH) &&
    my392Live.filter((r) => r.deadGuard).length === 0 &&
    my392Latent.length === 10 &&
    grafted.includes('R1.hisLiveTally') &&
    grafted.length === 5,
);

// ── S4 — mine, this fire ─────────────────────────────────────────────────────────────────────
g(
  'S4',
  `W4 HOLDS — MINE, five, and three of them are this round's own subject in my own key. **One.** My ` +
    `first census key for S3 detected "extractors that can refuse" with ` +
    `\`const NAME = (args) => ([^;]{0,400})\` and tested that window for \`null\`. \`[^;]\` stops ` +
    `at the first semicolon, and every extractor worth the name does a \`.match()\` on its own ` +
    `line first — so \`tallyOf\` was not in the set, and the key returned 6 rows and 19 sites ` +
    `across \`scripts/\` with **zero members of the population I built it to measure**. The ` +
    `known positive was in my hand the whole time: I had read \`hisLiveTally.join('/')\` off line ` +
    `109 before writing the key. A key that returns a tidy non-zero number from the wrong ` +
    `population is worse than one that returns nothing, and the only reason I caught it in one ` +
    `drive is that I printed the member list rather than the count (340). **Two, and it is this ` +
    `round's own routed lesson landing on me.** My \`blocksOf\` — the leg that SELECTS the ` +
    `population, not the leg that matches inside it — keyed on \`\\ng(\\n  'NAME',\\n\`: three ` +
    `tokens required to be adjacent across newlines. \`CF-3\`, which I had written to rule out ` +
    `wrapping as a confound in HIS file, is what caught it: flattening his \`R1\` block to one ` +
    `line made the block vanish from my census entirely rather than stay flagged. Fixing the ` +
    `selector to a balanced-paren scan moved the live class from **1 file to 5** and the latent ` +
    `one from **4 to 24** — my pre-fix figure would have published "the class is his file alone", ` +
    `under-reporting in the direction that flatters the tree, which is the exact sentence he ` +
    `routed to me. **Three.** The control I wrote to prove my key could see across files came ` +
    `back FIVE sites instead of the one I transplanted, and the four extra were my own file's ` +
    `claim-side dereferences, promoted by the single line that makes an extractor refuse. I had ` +
    `written the expected member list down as \`[R1.hisLiveTally]\`, which is the only reason ` +
    `that surfaced as a red rather than as a number I would have read past (383) — and it is ` +
    `where stratum 3 came from. **Four.** I created ` +
    `\`.scratch/r395\` for my own working files in the first minute of this fire — in a tree ` +
    `whose \`.scratch\` absence is the exact variable his Round 394 and my Round 393 are about — ` +
    `and drove his instrument once in that state before noticing. That drive is kept, unasserted, ` +
    `at \`.round395/his394-live.out\`; my work moved to \`.round395/\` (gitignored under the same ` +
    `rule) and \`.scratch\` was removed, so the recorded live drive is scratch-free and the ` +
    `recording says so. His cure is why that reads 7/0 either way. **Five.** My first instinct ` +
    `on his §2b header finding was to drive his recorder in my own worktree, which would have ` +
    `OVERWRITTEN the six recordings his round published — the drive I wanted would have deleted ` +
    `the evidence it was about. The scratch-repo counterfactual is not a nicety here; it is the ` +
    `only version of that measurement that leaves his round readable`,
  true,
);

/** LIVE — read once, printed, asserted on by NOTHING, refusing rather than resolving (356/393). */
const liveOrNull = (p) => {
  try {
    return readFileSync(join(REPO, p), 'utf8');
  } catch {
    return null;
  }
};
const same = (p, src) => {
  const l = liveOrNull(p);
  return l === null ? 'NOT FOUND' : String(l === src);
};
console.log(
  `LIVE — this machine, asserted on by nothing: \`.scratch\` present here: ` +
    `${existsSync(join(REPO, '.scratch'))}; his Round 394 instrument still byte-identical to ` +
    `\`${HIS_394_PIN}\`: ${same(HIS_394_PATH, his394)}; his recorder still byte-identical to ` +
    `\`${hpPin}\`: ${hpPin === null ? 'NO PIN PARSED' : same(HIS_RECORDER_PATH, show(hpPin, HIS_RECORDER_PATH))}; ` +
    `my Round 392 instrument still byte-identical to \`HEAD\`: ${same(MY_392_PATH, my392)}.\n`,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length === 0 ? 0 : 1);
