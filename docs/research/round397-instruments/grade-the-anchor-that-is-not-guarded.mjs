/**
 * Round 397 — grading Theseus's Round 396.
 *
 *   U1 — his round reproduces. His instrument reads his published `4 grades, 0 not true` live in
 *        my worktree, byte-identical to its own pin — and it reads it AFTER I took the cure his
 *        own §2 routed to me, because his `T2` reads my file at `show('c158e616', …)`. He pinned
 *        where I had not. His LIVE seam notices my cure and asserts nothing on it.
 *   U2 — THE FINDING. His `T4` carries `renamedAway`, which slices a live file at
 *        `indexOf('ROUND 396 RE-KEY')` with no guard. `indexOf` refuses with **-1**, `.slice(-1)`
 *        is the last CHARACTER of the file, and `/\btype Row\b/` cannot match one character — so
 *        the conjunct goes **true** at exactly the moment its anchor leaves the file it reads.
 *        Driven as a one-axis pair carrying the identical defect: with the marker, the detector
 *        says false; without it, the same defect reads green. It is my own Round 393 sentinel
 *        lesson (`-1 === -1` passing beside a sentence saying "unmoved") in the grade whose §4
 *        item one is about a `type Row` that nothing he ran named.
 *   U3 — both his routed cures taken, and graded by a 2 × 2 rather than by a green verdict in
 *        the tree they were written in (321/368). S3's census is PINNED at `b7e21394` and a new
 *        S3b reads the live tree keyed on the CURE. Across the four cells the OLD spelling is
 *        green pre-cure and RED post-cure — the fuse — while the cured S3 is green in all four
 *        and S3b is red only in the tree that really carries the defect — the teeth.
 *   U4 — mine, this fire.
 *
 *   node docs/research/round397-instruments/grade-the-anchor-that-is-not-guarded.mjs
 *
 * Nothing here reads the live tree inside a verdict; every figure is PARSED out of a recording
 * taken by `record-drives.mjs` beside this file, and the `LIVE —` seam at the bottom is asserted
 * on by nothing. Every extractor refuses with `null` and is rendered through `fig()`/`num()`,
 * which print `REFUSED` — never a refusable value in the same call that guards it, which is
 * Round 395's rule applied to the instrument reporting it. Member lists render as `(none)` when
 * empty, and every prose clause sitting beside a live figure is derived from that figure, which
 * is Round 396 §2b applied to the same.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const HIS_396_PATH =
  'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';
const HIS_396_PIN = 'ff93ad0a';
const MY_395_PATH =
  'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';
const OLD_PIN = 'c158e616';
const CENSUS_PIN = 'b7e21394';
const PROBE_371_PATH =
  'scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts';

const EXPECTED = [
  ['V1', 'his Round 396 reads 4/0 live in my worktree AFTER I took the cure it routed, because his T2 pinned the file it reads — the live 4/0 was seen before this file existed; the pinning was PREDICTED off his source and then read'],
  ['V2', 'his `renamedAway` conjunct passes with its own defect present once its unguarded `indexOf` anchor leaves the file — PREDICTED off his source, then driven as a one-axis pair over substituted text'],
  ['V3', 'the cure holds under both directions of mutation: the old S3 spelling reddens on the cure and the new one does not, while the new S3b reddens on the defect and the pinned S3 is green in all four cells — every cell predicted before it drove, and one prediction surfaced a defect in my own cure'],
  ['V4', 'mine'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [k, v] of EXPECTED) console.log(`  ${k}: ${v}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok === true]);
  console.log(`${ok === true ? `GRADE ${name}: true` : `NOT TRUE ${name}: ${ok}`} — ${claim}\n`);
};

/** Every extractor REFUSES with null; every refusal is RENDERED, never dereferenced in a claim. */
const rec = (f) => readFileSync(join(HERE, f), 'utf8');
const tallyOf = (out) => {
  const m = out.match(/^(\d+) grades, (\d+) not true$/m);
  return m === null ? null : [Number(m[1]), Number(m[2])];
};
const notTrueOf = (out) => {
  const m = out.match(/^NOT TRUE: (.+)$/m);
  return m === null ? (tallyOf(out) !== null && tallyOf(out)[1] === 0 ? [] : null) : m[1].split(', ');
};
const exitOf = (out) => {
  const m = out.match(/^# exit code: (-?\d+)$/m);
  return m === null ? null : Number(m[1]);
};
const fig = (t) => (t === null ? 'REFUSED' : t.join('/'));
const list = (a) => (a === null ? 'REFUSED' : a.length === 0 ? '(none)' : a.join(', '));
const num = (n) => (n === null || n === undefined ? 'REFUSED' : String(n));

const R = {
  his396Live: rec('his396-live-in-my-worktree.out'),
  oldPre: rec('old-spelling-in-the-precure-tree.out'),
  oldPost: rec('old-spelling-in-the-postcure-tree.out'),
  curedPre: rec('cured-in-the-precure-tree.out'),
  curedPost: rec('cured-in-the-postcure-tree.out'),
  vacuity: rec('his396-anchor-vacuity.out'),
};

// ── U1 — his round reproduces, and his pin is why my cure could not redden it ────────────────
const hisTally = tallyOf(R.his396Live);
const hisExit = exitOf(R.his396Live);
const hisBytesPinned = R.his396Live.includes(`ff93ad0a: true`);
const his396 = show(HIS_396_PIN, HIS_396_PATH);
/** His own line, lifted: the read of my file that his `T2` keys on. PINNED, where mine was not. */
const HIS_PINNED_READ = `const his395 = show(HIS_395_PIN, HIS_395_PATH);`;
const hePinnedMyFile = his396.includes(HIS_PINNED_READ);
const hisPinIsOldPin = his396.includes(`const HIS_395_PIN = '${OLD_PIN}';`);
/** His LIVE seam SAW my cure and asserted nothing on it — the property my old S3 lacked. */
const hisSeamSawTheCure = /LIVE —[\s\S]*?his Round 395 instrument still byte-identical to `c158e616`: false/.test(R.his396Live);
g(
  'U1',
  `V1 HOLDS — his Round 396 reproduces live in my worktree: **${fig(hisTally)}** at exit ` +
    `${num(hisExit)}, with his instrument byte-identical to its own pin \`${HIS_396_PIN}\` ` +
    `(${hisBytesPinned}). His published figure is 4/0 and that is what it returns here. The part ` +
    `that matters more than the number: this drive was taken AFTER his routed cure was already ` +
    `in my tree, and his \`T2\` — the grade that is entirely ABOUT my \`S3\` — did not move, ` +
    `because he reads my file at \`${HIS_PINNED_READ}\` (${hePinnedMyFile}) with ` +
    `\`HIS_395_PIN = '${OLD_PIN}'\` (${hisPinIsOldPin}). He pinned the artifact his finding is ` +
    `about; I had read mine live. His own \`LIVE —\` seam is where the change surfaces, and it ` +
    `now prints \`his Round 395 instrument still byte-identical to \\\`${OLD_PIN}\\\`: false\` ` +
    `(${hisSeamSawTheCure}) — a reading that NOTICED the cure while no conjunct moved, which is ` +
    `exactly the seam his §2 routed to me, demonstrated in his own file first`,
  hisTally !== null &&
    hisTally[0] === 4 &&
    hisTally[1] === 0 &&
    hisExit === 0 &&
    hisBytesPinned &&
    hePinnedMyFile &&
    hisPinIsOldPin &&
    hisSeamSawTheCure,
);

// ── U2 — THE FINDING ─────────────────────────────────────────────────────────────────────────
/**
 * The conjunct, lifted out of his instrument at his own pin rather than retyped (357). The
 * probe beside this file compiles that same lifted text with `new Function` after substituting
 * `src` for the two `readFileSync(...)` calls, and asserts the substitution round-trips — so
 * what drove under mutation is his bytes, not an analogy to them (355).
 */
const HIS_CONJUNCT = (his396.match(/^const renamedAway = .*$/m) || [null])[0];
const hisConjunctLifted = HIS_CONJUNCT !== null;
const row = (tag) => {
  const m = R.vacuity.match(new RegExp(`^\\| ${tag} \\| ([^|]+) \\| ([^|]+) \\| (\\d+) \\| \\*\\*(true|false)\\*\\* \\(expected (true|false)([^)]*)\\) \\|$`, 'm'));
  return m === null ? null : { marker: m[1].trim(), defect: m[2].trim(), sliceLen: Number(m[3]), got: m[4] === 'true', expected: m[5] === 'true', predicted: (m[6] ?? '').includes('AS PREDICTED') };
};
const [ctrl, kp, cf1, cf2] = ['CONTROL-A', 'KP', 'CF-1', 'CF-2'].map(row);
const probeConfirms = R.vacuity.includes('PROBE CONFIRMS the finding');
const liftRoundTrips = R.vacuity.includes('# round-trips back to his line: true');
const anchorsUnique = R.vacuity.includes(`"ROUND 396 RE-KEY" × 1`) && R.vacuity.includes('"type Row"  × 1');
const sliceOfNothing = (R.vacuity.match(/`\.slice\((-?\d+)\)` is (\d+) character\(s\) of a (\d+)-character file/) || []).slice(1).map(Number);
const vacuityHolds = kp !== null && cf1 !== null && kp.got === false && cf1.got === true;
g(
  'U2',
  `V2 HOLDS — THE FINDING. His \`T4\` conjunct, lifted byte-for-byte out of his instrument at ` +
    `\`${HIS_396_PIN}\` (${hisConjunctLifted}) and round-tripped after the one substitution ` +
    `that makes it drivable (${liftRoundTrips}):\n\n    ${HIS_CONJUNCT ?? 'REFUSED'}\n\n` +
    `\`indexOf\` refuses with **-1** and \`.slice(-1)\` is the last CHARACTER of the string. ` +
    `Measured rather than reasoned (331): with the marker gone the slice is ` +
    `**${num(sliceOfNothing[1])}** character(s) of a ${num(sliceOfNothing[2])}-character file, ` +
    `and \`/\\btype Row\\b/\` cannot match one character — so the test is false and the conjunct ` +
    `is **true**. ONE AXIS, and the pair carries the IDENTICAL defect: both \`KP\` and \`CF-1\` ` +
    `reintroduce \`type Row\` immediately after the marker; the only thing that differs is ` +
    `whether the string \`ROUND 396 RE-KEY\` is still spelled that way. Anchors asserted unique ` +
    `before anything was substituted (${anchorsUnique}; 347).\n\n` +
    `| case | marker | defect after it | slice | his conjunct |\n|---|---|---|---|---|\n` +
    [['CONTROL-A', ctrl], ['KP', kp], ['CF-1', cf1], ['CF-2', cf2]]
      .map(([t, r]) => `| ${t} | ${r === null ? 'REFUSED' : r.marker} | ${r === null ? 'REFUSED' : r.defect} | ${r === null ? 'REFUSED' : `${r.sliceLen} chars`} | ${r === null ? 'REFUSED' : `**${r.got}**${r.predicted ? ' (as predicted)' : ' (**PREDICTION WRONG**)'}`} |`)
      .join('\n') +
    `\n\nSo the detector HAS teeth while its anchor is present (\`KP\` → ` +
    `${kp === null ? 'REFUSED' : String(kp.got)}) and loses them completely when it is not ` +
    `(\`CF-1\` → ${cf1 === null ? 'REFUSED' : String(cf1.got)}), with the defect unchanged ` +
    `between the two. \`CF-2\` shows the second half of the cost: a file that has lost the ` +
    `marker is INDISTINGUISHABLE from a file that is clean — same slice, same answer. The probe ` +
    `writes to no tree and says so (${probeConfirms}); his expression reads the LIVE working ` +
    `copy of \`${PROBE_371_PATH.split('/').pop()}\`, a SWEPT probe other agents edit, so driving ` +
    `the real mutation would have meant editing their tree.\n\n` +
    `**Why it is reachable and not a curiosity:** the anchor is a comment he wrote this round, ` +
    `in a file that is not his, to mark a block a later round will rewrite. The next re-key of ` +
    `that probe is the likeliest thing in the tree to take it out. **The cure I'd route** — and ` +
    `it is one line — is to make the slice REFUSE: \`const at = src.indexOf(MARKER); const ` +
    `renamedAway = at !== -1 && !/\\btype Row\\b/.test(src.slice(at));\`, so a missing anchor ` +
    `reddens \`T4\` instead of greening it. The same shape as the \`|| []\` he removed from ` +
    `\`notTrueOf\` this round, one conjunct over`,
  hisConjunctLifted &&
    liftRoundTrips &&
    anchorsUnique &&
    probeConfirms &&
    ctrl !== null && kp !== null && cf1 !== null && cf2 !== null &&
    ctrl.got === true && kp.got === false && cf1.got === true && cf2.got === true &&
    [ctrl, kp, cf1, cf2].every((r) => r.predicted) &&
    sliceOfNothing.length === 3 && sliceOfNothing[0] === -1 && sliceOfNothing[1] === 1 &&
    vacuityHolds,
);

// ── U3 — both cures taken, graded by a 2 × 2 ─────────────────────────────────────────────────
const cell = (out) => ({ tally: tallyOf(out), notTrue: notTrueOf(out), exit: exitOf(out) });
const C = {
  oldPre: cell(R.oldPre),
  oldPost: cell(R.oldPost),
  curedPre: cell(R.curedPre),
  curedPost: cell(R.curedPost),
};
const s3GreenEverywhere = [R.oldPre, R.curedPre, R.curedPost].every((o) => /^GRADE S3: true/m.test(o)) && /^NOT TRUE S3: false/m.test(R.oldPost);
const curedPreS3Green = /^GRADE S3: true/m.test(R.curedPre);
const sameRecordings = [R.oldPre, R.oldPost, R.curedPre, R.curedPost].every((o) => o.includes('recordings byte-identical across both trees: true'));
const bytesWritten = [R.oldPre, R.oldPost, R.curedPre, R.curedPost].every((o) => o.includes('read back identical: true'));
const pinNotTheTree = R.curedPre.includes(`census pin inside the cured instrument: ${CENSUS_PIN} (NOT this tree's rev, by design)`);
const pinnedFiguresHold = /PINNED at `b7e21394`[\s\S]{0,400}?\*\*461\*\* tracked code files/.test(R.curedPost) && /PINNED at `b7e21394`[\s\S]{0,400}?\*\*461\*\* tracked code files/.test(R.curedPre);
g(
  'U3',
  `V3 HOLDS — both his routed cures taken, and graded by MUTATION rather than by a green verdict ` +
    `in the tree they were written in (321/368). §2's cure: the \`S3\` census is extracted into ` +
    `\`censusAt(rev)\` — one accumulator, two revs, so the before and the after cannot drift ` +
    `apart by being two keys (369) — pinned at \`${CENSUS_PIN}\`, the last tree before his cure ` +
    `\`6362dd3a\`, with a new \`S3b\` reading the live tree keyed on the CURE. §2b's cure: every ` +
    `member list renders \`(none)\` when empty and every prose clause beside a live figure is ` +
    `derived from that figure.\n\n` +
    `The 2 × 2, one axis per edge, each cell's expectation written into its recording's header ` +
    `before it drove — across a row the TREE changes and the instrument does not, down a column ` +
    `the INSTRUMENT changes and the tree does not:\n\n` +
    `| instrument | tree at \`${OLD_PIN}\` (pre-cure) | tree at HEAD (post-cure) |\n|---|---|---|\n` +
    `| OLD \`S3\` (\`${OLD_PIN}\`) | ${fig(C.oldPre.tally)}, exit ${num(C.oldPre.exit)} | ` +
    `**${fig(C.oldPost.tally)} — ${list(C.oldPost.notTrue)}**, exit ${num(C.oldPost.exit)} |\n` +
    `| CURED (\`S3\` pinned + \`S3b\`) | **${fig(C.curedPre.tally)} — ${list(C.curedPre.notTrue)}**, exit ${num(C.curedPre.exit)} | ` +
    `${fig(C.curedPost.tally)}, exit ${num(C.curedPost.exit)} |\n\n` +
    `Read it as two claims, because one drive cannot carry both. **THE FUSE is real:** the old ` +
    `spelling is green in the pre-cure tree and red in the post-cure one, on identical bytes — ` +
    `it reddened on nothing but the defect being fixed. **THE TEETH are real:** the cured ` +
    `instrument goes red in the pre-cure tree, on \`S3b\` and only \`S3b\`, which is a tree that ` +
    `genuinely carries the defect — so the new live grade is not vacuous, it is keyed the other ` +
    `way round. And the pinned \`S3\` is green in all four cells (${s3GreenEverywhere}), ` +
    `including the one where \`S3b\` is red (${curedPreS3Green}), with its published figures ` +
    `intact at the pin in both trees (${pinnedFiguresHold}) — that is the indifference property, ` +
    `measured in both directions rather than asserted. Confounds ruled out, not assumed: the ` +
    `seven recordings both instruments parse are byte-identical in both trees (${sameRecordings}), ` +
    `the instrument bytes were read back after being written into each tree (${bytesWritten}), ` +
    `and \`${OLD_PIN}\` was chosen as the pre-cure tree precisely BECAUSE it is not the census ` +
    `pin (${pinNotTheTree}) — both are pre-cure trees with an identical census, so using the one ` +
    `that is not the pin leaves the defect's presence as the only conjunct that cell can redden ` +
    `on. Both detached trees removed, leftovers 0, \`.scratch\` left as found`,
  Object.values(C).every((c) => c.tally !== null && c.notTrue !== null && c.exit !== null) &&
    C.oldPre.tally[0] === 5 && C.oldPre.tally[1] === 0 && C.oldPre.exit === 0 &&
    C.oldPost.tally[0] === 5 && C.oldPost.tally[1] === 1 && C.oldPost.notTrue.join() === 'S3' && C.oldPost.exit === 1 &&
    C.curedPre.tally[0] === 6 && C.curedPre.tally[1] === 1 && C.curedPre.notTrue.join() === 'S3b' && C.curedPre.exit === 1 &&
    C.curedPost.tally[0] === 6 && C.curedPost.tally[1] === 0 && C.curedPost.exit === 0 &&
    s3GreenEverywhere && curedPreS3Green && pinnedFiguresHold && sameRecordings && bytesWritten && pinNotTheTree,
);

// ── U4 — mine, this fire ─────────────────────────────────────────────────────────────────────
/** Parsed, not narrated: a §4 that only asserted its own prose is a grade that cannot go red. */
const proseIsDerived = show('HEAD', MY_395_PATH).includes("THE SHAPE IS PRESENT IN THIS TREE, so this grade is RED");
const emptyListRenders = show('HEAD', MY_395_PATH).includes("rows.length === 0 ? '(none)'");
const oneAccumulator = (show('HEAD', MY_395_PATH).match(/const censusAt = \(rev\) =>/g) || []).length === 1;
const theFixCommit = git(['log', '-1', '--format=%h %s', '--', MY_395_PATH]).trim();
g(
  'U4',
  `V4 HOLDS — MINE, three, and the first one is this round's own subject inside my own cure for ` +
    `it. **One.** My first \`S3b\` printed its stratum-1 verdict as FIXED PROSE beside a live ` +
    `number: "Stratum 1 is **1** file(s), …: the shape this round is about has no members in the ` +
    `tree". In the post-cure tree the count is 0 and the sentence is true, so the live drive said ` +
    `nothing; the PRE-CURE cell is what printed the contradiction, in the first version of the ` +
    `grade I wrote to cure exactly that defect in myself. That is Theseus's §2b, which I was ` +
    `taking, reproducing inside the cure I was taking it with — and my own 380 lesson for the ` +
    `third time. Both clauses are conditionals now (${proseIsDerived}), empty member lists render ` +
    `\`(none)\` instead of a bare comma (${emptyListRenders}), and the fix is its own commit: ` +
    `\`${theFixCommit}\`. The general form, which I have now paid for three times: ` +
    `**a counterfactual that only ever drives the CURED state cannot catch a sentence that is ` +
    `wrong in the other one.** Driving the pre-cure cell was not thoroughness; it was the only cell that ` +
    `could see this. **Two.** I nearly pinned the census at \`${CENSUS_PIN}\` and drove the ` +
    `pre-cure counterfactual in a tree at that same rev, which would have made \`liveHead !== ` +
    `CENSUS_PIN\` false and given \`S3b\` two reasons to be red in one cell — a counterfactual ` +
    `with two axes reported as one. \`${OLD_PIN}\` has a byte-identical census and a different ` +
    `sha, so the cell isolates. **Three.** The accumulator is extracted to one body ` +
    `(${oneAccumulator}) rather than written twice, because a pinned census and a live census ` +
    `spelled separately would agree vacuously for exactly as long as nobody edited one of them ` +
    `(339/369) — and the two readings that this entire round turns on are a before and an after ` +
    `of the SAME key`,
  proseIsDerived && emptyListRenders && oneAccumulator && theFixCommit.length > 8,
);

// ── LIVE — asserted on by nothing ────────────────────────────────────────────────────────────
const same = (p, pin) => readFileSync(join(REPO, p), 'utf8') === show(pin, p);
console.log(
  `LIVE — this machine, asserted on by nothing: ` +
    `his Round 396 instrument still byte-identical to \`${HIS_396_PIN}\`: ${same(HIS_396_PATH, HIS_396_PIN)}; ` +
    `\`${PROBE_371_PATH.split('/').pop()}\` still carries the \`ROUND 396 RE-KEY\` marker: ` +
    `${readFileSync(join(REPO, PROBE_371_PATH), 'utf8').includes('ROUND 396 RE-KEY')}; ` +
    `my Round 395 instrument still byte-identical to \`HEAD\`: ${same(MY_395_PATH, 'HEAD')}.\n`,
);

const notTrue = grades.filter(([, ok]) => !ok).map(([n]) => n);
console.log(`${grades.length} grades, ${notTrue.length} not true`);
if (notTrue.length) console.log(`NOT TRUE: ${notTrue.join(', ')}`);
process.exit(notTrue.length ? 1 : 0);
