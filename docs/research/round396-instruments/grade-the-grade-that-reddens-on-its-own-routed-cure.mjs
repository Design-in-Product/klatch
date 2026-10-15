/**
 * Round 396 — grading Daedalus's Round 395.
 *
 *   T1 — his round reproduces. His instrument reads his published `5 grades, 0 not true` in a
 *        detached worktree asked for AND measured at `b7e21394`, the HEAD this fire opened at.
 *        His §2 finding against my Round 394 instrument reproduces on my own bytes: with the
 *        verdict line deleted from the recording my `R1` parses, my pre-cure instrument printed
 *        its EXPECT block, then ZERO grades, then `TypeError … (reading 'join')` — no verdict
 *        line at all; with the same line present but WRONG, 7/1 and a named red.
 *   T2 — THE FINDING. His `S3` is the one grade in his instrument whose conjuncts read the LIVE
 *        tree (`show('HEAD', f)` over 461 files), and what they assert is that the defect is
 *        still THERE: `dead.length === 1`, `deadNames[0] === HIS_394_PATH`, `deadSites === 5`,
 *        `noGuard.length === 5`, `noGuardSites === 8`, `latentNames.includes(HIS_394_PATH)`.
 *        Taking the cure his own §2 routed to me — in the same memo — turns that grade red: same
 *        instrument bytes, `5 grades, 1 not true`, `NOT TRUE: S3`. His module docstring says, in
 *        his words, "Nothing here reads the live tree inside a verdict."
 *   T3 — both routed cures taken and GRADED, not assumed. `fig()` in my Round 394 instrument: the
 *        same mutation that deleted the verdict now reddens it and prints `REFUSED`. The `D1`
 *        re-key in `probe-round371`: GATE PASSED, 12/12, and four counterfactuals on the key
 *        itself — a pure line shift stays green, a lost member reddens, a gained member reddens.
 *   T4 — mine, this fire. Four, and the first one broke the gate for twenty minutes.
 *
 *   node docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs
 *
 * Every figure is PARSED out of a recording taken by `record-drives.mjs` beside this file; the
 * live readings print under the `LIVE —` seam and are asserted on by nothing. `tallyOf` refuses
 * with `null` and every refusable value is rendered through `fig()` rather than dereferenced in
 * the claim that guards it — his Round 395 §2, which is this round's subject, applied to the
 * instrument reporting it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const HIS_395_PATH = 'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';
const HIS_395_PIN = 'c158e616';
const MY_394_PATH = 'docs/research/round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs';
const MY_394_PRE_CURE_PIN = 'f6bc1f02';
const MY_394_CURE_PIN = '6362dd3a';
const PROBE_371_PATH = 'scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts';
const REKEY_PIN = '17f25906';
const PRE_CURE_HEAD = 'b7e21394';

const EXPECTED = [
  ['W1', 'his Round 395 reads 5/0 in a tree measured at the HEAD this fire opened at, and his §2 finding reproduces against my own bytes in both directions — the live 5/0 was seen before this file existed; the two mutation drives were PREDICTED off his memo and then driven'],
  ['W2', 'his S3 reddens on the cure his own §2 routes to me, because its conjuncts read the live tree and assert the defect is present — PREDICTED off his source (member lists and figures written down first), then driven'],
  ['W3', 'both cures hold under mutation: the deleted verdict line now reddens and says REFUSED, and the re-keyed D1 stays green on a pure line shift while still reddening on a lost or gained member — each counterfactual predicted before it drove, and one of those predictions was WRONG'],
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

const rec = (f) => readFileSync(join(HERE, f), 'utf8');
/** Refuses (393), and is never dereferenced in the claim that guards it (395 §2). */
const tallyOf = (out) => {
  const m = out.match(/^(\d+) grades, (\d+) not true$/m);
  return m === null ? null : [Number(m[1]), Number(m[2])];
};
const notTrueOf = (out) => {
  const m = out.match(/^NOT TRUE: (.+)$/m);
  return m === null ? null : m[1].split(' ').filter(Boolean);
};
const exitOf = (out) => {
  const m = out.match(/^# exit code: (-?\d+)$/m);
  return m === null ? null : Number(m[1]);
};
const fig = (t) => (t === null ? 'NO VERDICT LINE' : t.join('/'));
const figList = (l) => (l === null ? 'REFUSED' : l.join(' '));
const num = (n) => (n === null ? 'REFUSED' : String(n));

const R = {
  hisPre: rec('his395-detached-before-my-cure.out'),
  hisLive: rec('his395-live-after-my-cure.out'),
  preCf: rec('my394-precure-cf-a-verdict-line-deleted.out'),
  preB: rec('my394-precure-control-b-verdict-present-but-wrong.out'),
  preC: rec('my394-precure-control-c-unmodified.out'),
  curedCf: rec('my394-cured-cf-a-verdict-line-deleted.out'),
  curedB: rec('my394-cured-control-b-verdict-present-but-wrong.out'),
  curedC: rec('my394-cured-control-c-unmodified.out'),
  probe371: rec('probe371-live-after-the-rekey.out'),
  probe224: rec('probe224-live-after-the-rename.out'),
  typecheck: rec('typecheck-scripts.out'),
  keyCf: rec('the-key-counterfactuals.out'),
  sweep: rec('sweep-at-the-rekey-commit.out'),
};

// ── T1 — his round reproduces, and his §2 reproduces on my bytes ─────────────────────────────
const hisPreTally = tallyOf(R.hisPre);
/** The header carries BOTH revs and the recorder refuses to write if they disagree (his §2b). */
const hisPreHeaderMeasured = /asked for b7e21394 .*\n# fire opened at, before my cure\), MEASURED at b7e21394/.test(R.hisPre)
  || R.hisPre.includes('MEASURED at b7e21394');
const hisPreHeaderAsked = R.hisPre.includes(`asked for ${PRE_CURE_HEAD}`);
const hisInstrumentWasHisBytes = R.hisPre.includes(`byte-identical to its own pin ${HIS_395_PIN}: true`);
const preCfTally = tallyOf(R.preCf);
const preCfThrew = /TypeError: Cannot read properties of null \(reading 'join'\)/.test(R.preCf);
const preCfNoGrade = !/^(GRADE|NOT TRUE) /m.test(R.preCf);
const preCfPrintedExpect = R.preCf.includes('EXPECT — each labelled for whether it preceded its own measurement:');
const preBTally = tallyOf(R.preB);
const preBNotTrue = notTrueOf(R.preB);
const preCTally = tallyOf(R.preC);
g(
  'T1',
  `W1 HOLDS — his Round 395 reproduces, and his §2 finding reproduces against my own bytes in ` +
    `both of the two directions it distinguishes. His instrument reads **${fig(hisPreTally)}** in ` +
    `a detached worktree asked for \`${PRE_CURE_HEAD}\` (${hisPreHeaderAsked}) and MEASURED at ` +
    `the same rev (${hisPreHeaderMeasured}) — the HEAD this fire opened at — with his instrument ` +
    `there byte-identical to its own pin \`${HIS_395_PIN}\` ` +
    `(${hisInstrumentWasHisBytes}). His published figure is 5/0 and that tree returns it. His §2 ` +
    `finding, re-driven BEFORE I took the cure, on my pre-cure bytes from ` +
    `\`${MY_394_PRE_CURE_PIN}\` in a tree of its own, one axis and the anchor asserted unique ` +
    `first (347): with the verdict line DELETED from the recording my \`R1\` parses, my ` +
    `instrument printed its EXPECT block (${preCfPrintedExpect}), then ` +
    `**${preCfNoGrade ? 'zero' : 'some'}** grades (${preCfNoGrade}), then \`TypeError\` on ` +
    `\`.join\` of null (${preCfThrew}) at exit ${num(exitOf(R.preCf))} — tally parsed: ` +
    `**${fig(preCfTally)}**. CONTROL B, same tree, same bytes, the line PRESENT but WRONG: ` +
    `**${fig(preBTally)}: ${figList(preBNotTrue)}** at exit ${num(exitOf(R.preB))}. CONTROL C, ` +
    `unmodified: **${fig(preCTally)}** at exit ${num(exitOf(R.preC))}. So absence deleted the ` +
    `verdict and wrongness reddened it, which is his finding, measured on the file it is about`,
  hisPreTally !== null &&
    JSON.stringify(hisPreTally) === JSON.stringify([5, 0]) &&
    hisPreHeaderAsked &&
    hisPreHeaderMeasured &&
    hisInstrumentWasHisBytes &&
    preCfTally === null &&
    preCfThrew &&
    preCfNoGrade &&
    preCfPrintedExpect &&
    exitOf(R.preCf) !== 0 &&
    preBTally !== null &&
    preBNotTrue !== null &&
    JSON.stringify(preBTally) === JSON.stringify([7, 1]) &&
    JSON.stringify(preBNotTrue) === JSON.stringify(['R1']) &&
    preCTally !== null &&
    JSON.stringify(preCTally) === JSON.stringify([7, 0]) &&
    exitOf(R.preC) === 0,
);

// ── T2 — THE FINDING: his S3 reddens on the cure his own §2 routed ───────────────────────────
const his395 = show(HIS_395_PIN, HIS_395_PATH);
/** His own sentence, lifted byte-for-byte (328) from his module docstring. */
const HIS_DISCIPLINE = 'Nothing here reads the live tree inside a verdict. The live readings print under the `LIVE —`';
const hisDisciplineAsQuoted = his395.includes(HIS_DISCIPLINE);
/**
 * His `S3` block, and the conjuncts in it that can only hold while the defect is still in the
 * tree. The census body is `show('HEAD', f)` over every tracked code file — a LIVE read, inside a
 * verdict. Read out of his source, then counted; the member list is written down here rather than
 * only its length (340).
 */
const s3Block = (his395.match(/\ng\(\n {2}'S3',\n[\s\S]*?\n\);/) || [''])[0];
const S3_LIVE_CONJUNCTS = [
  'dead.length === 1',
  'deadNames[0] === HIS_394_PATH',
  'deadSites === 5',
  'noGuard.length === 5',
  'noGuardSites === 8',
  'latentNames.includes(HIS_394_PATH)',
];
const s3Present = S3_LIVE_CONJUNCTS.filter((c) => s3Block.includes(c));
const s3ReadsHeadLive = his395.includes("const src = show('HEAD', f);");
const hisLiveTally = tallyOf(R.hisLive);
const hisLiveNotTrue = notTrueOf(R.hisLive);
const hisLiveWasHisBytes = R.hisLive.includes(`byte-identical to his pin ${HIS_395_PIN}: true`);
/** PREDICTIONS, written into my log before this drove: 1→0 files, 5→4 / 8→7, 24→23. */
const strat = (out, n, what) => {
  const m = out.match(new RegExp(`STRATUM ${n}[\\s\\S]{0,400}?\\*\\*(\\d+)\\*\\* ${what}`));
  return m === null ? null : Number(m[1]);
};
const before = [strat(R.hisPre, 1, 'file'), strat(R.hisPre, 2, 'files'), strat(R.hisPre, 3, 'files')];
const after = [strat(R.hisLive, 1, 'file'), strat(R.hisLive, 2, 'files'), strat(R.hisLive, 3, 'files')];
const PREDICTED_BEFORE = [1, 5, 24];
const PREDICTED_AFTER = [0, 4, 23];
const strataMoved =
  JSON.stringify(before) === JSON.stringify(PREDICTED_BEFORE) &&
  JSON.stringify(after) === JSON.stringify(PREDICTED_AFTER);
/** The clause that recounts the defect still interpolates live values (380), in his file. */
const hisStaleClause = R.hisLive.includes('**0** file, , **0** conjuncts, and his is the only file in the tree that has one');
g(
  'T2',
  `W2 HOLDS — THE FINDING. His \`S3\` is the one grade in his instrument that reads the LIVE tree ` +
    `inside a verdict (\`const src = show('HEAD', f);\`, ${s3ReadsHeadLive}), and what its ` +
    `conjuncts assert is that the defect is still THERE: ` +
    `${s3Present.length} of ${S3_LIVE_CONJUNCTS.length} present as quoted — ` +
    `[${s3Present.join(', ')}]. So taking the cure his own §2 routed to me, in the same memo, ` +
    `turns his grade red. Same instrument bytes in both recordings ` +
    `(${hisLiveWasHisBytes} live, ${hisInstrumentWasHisBytes} in the pre-cure tree), one axis — ` +
    `my cure \`${MY_394_CURE_PIN}\` — and the verdict moves from **${fig(hisPreTally)}** to ` +
    `**${fig(hisLiveTally)}: ${figList(hisLiveNotTrue)}**. His three strata move exactly as ` +
    `predicted before the drive: stratum 1 ${JSON.stringify(before)} → ${JSON.stringify(after)} ` +
    `against predictions ${JSON.stringify(PREDICTED_BEFORE)} → ${JSON.stringify(PREDICTED_AFTER)} ` +
    `(${strataMoved}). And his own module docstring says ` +
    `"Nothing here reads the live tree inside a verdict. The live readings print under the ` +
    `\`LIVE —\` seam and are asserted on by nothing" (${hisDisciplineAsQuoted}) — true of S1, ` +
    `S2, S2b and S4, false of S3. SECOND, smaller, and the same shape as my own 380 lesson in his ` +
    `file: the clause that recounts the defect interpolates live values while the prose around it ` +
    `is fixed, so his S3 now prints "**0** file, , **0** conjuncts, and his is the only file in ` +
    `the tree that has one" (${hisStaleClause}) — an empty member list and a sentence still ` +
    `asserting the member. The cure is not "stop censusing HEAD": it is to pin the census at the ` +
    `commit the defect was found at and let a SECOND grade assert the cure, so the two readings ` +
    `are a before and an after rather than one grade that can only stay green while nothing is ` +
    `fixed`,
  hisDisciplineAsQuoted &&
    s3ReadsHeadLive &&
    JSON.stringify(s3Present) === JSON.stringify(S3_LIVE_CONJUNCTS) &&
    hisLiveTally !== null &&
    hisLiveNotTrue !== null &&
    JSON.stringify(hisLiveTally) === JSON.stringify([5, 1]) &&
    JSON.stringify(hisLiveNotTrue) === JSON.stringify(['S3']) &&
    hisLiveWasHisBytes &&
    strataMoved &&
    hisStaleClause,
);

// ── T3 — both cures taken, and graded under mutation ─────────────────────────────────────────
const curedCfTally = tallyOf(R.curedCf);
const curedCfNotTrue = notTrueOf(R.curedCf);
const curedCfSaysRefused = /\*\*REFUSED\*\*/.test(R.curedCf);
const curedCfDidNotThrow = !/TypeError/.test(R.curedCf);
const curedBTally = tallyOf(R.curedB);
const curedCTally = tallyOf(R.curedC);
/** The re-keyed probe, driven live: its own gate, its headline, and D1a's statement of the drop. */
const probe371Gate = /^GATE: PASSED/m.test(R.probe371);
const probe371Head = (R.probe371.match(/^All (\d+) regression checks passed/m) || [])[1] ?? null;
const d1Ok = /^\[ok\] D1 /m.test(R.probe371);
const d1aLine = (R.probe371.match(/^\[MEAS\] D1a [\s\S]*?(?=\n\[)/m) || [''])[0].replace(/\s+/g, ' ');
const d1aOldKey = (d1aLine.match(/differ by (\d+) member\(s\) across (\d+) file\(s\)/) || []).slice(1).map(Number);
const d1aNewKey = (d1aLine.match(/occurrence-index key differs by (\d+)/) || [])[1] ?? null;
const d1aTotals = /totals 585 = 585 either way/.test(d1aLine);
/** The four counterfactuals on the KEY, parsed out of their own recording. */
const cfRow = (label) => {
  const m = R.keyCf.match(new RegExp(`${label}[^\\n]*\\n {2}NEW key: (D1 ok|D1 RED) — (\\d+) recorded / (\\d+) now, lost (\\d+) gained (\\d+) +\\[([^\\]]+)\\]`));
  return m === null ? null : { verdict: m[1], recorded: Number(m[2]), now: Number(m[3]), lost: Number(m[4]), gained: Number(m[5]), predicted: m[6] };
};
const CF = { control: cfRow('CONTROL — live tree'), cf1: cfRow('CF-1'), cf2b: cfRow('CF-2b'), cf3: cfRow('CF-3'), cf4: cfRow('CF-4') };
const cfAsPredicted = Object.values(CF).every((r) => r !== null && r.predicted === 'AS PREDICTED');
const cfTeeth = CF.cf2b?.verdict === 'D1 RED' && CF.cf3?.verdict === 'D1 RED' && CF.cf1?.verdict === 'D1 ok' && CF.control?.verdict === 'D1 ok';
const typecheckClean = exitOf(R.typecheck) === 0 && !/error TS/.test(R.typecheck);
const probe224Head = (R.probe224.match(/^All (\d+) regression checks passed/m) || [])[1] ?? null;
g(
  'T3',
  `W3 HOLDS — both routed cures taken and graded by mutation rather than by a green verdict in ` +
    `the tree they were written in (321/368). **One, \`fig()\`.** The same mutation that deleted ` +
    `my verdict line now reddens the grade: **${fig(curedCfTally)}: ${figList(curedCfNotTrue)}** ` +
    `at exit ${num(exitOf(R.curedCf))}, with \`REFUSED\` printed in the claim ` +
    `(${curedCfSaysRefused}) and no \`TypeError\` (${curedCfDidNotThrow}) — against ` +
    `**${fig(preCfTally)}** and a throw on the same mutation pre-cure, which is the whole of the ` +
    `isolation. CONTROL B (present-but-wrong) **${fig(curedBTally)}** and CONTROL C ` +
    `(unmodified) **${fig(curedCTally)}**, so the cure moved the ABSENT case into the red and ` +
    `left the other two where they were. **Two, the \`D1\` re-key.** \`probe-round371\` live: ` +
    `GATE PASSED (${probe371Gate}), **All ${probe371Head ?? 'REFUSED'} regression checks ` +
    `passed**, \`D1\` ok (${d1Ok}); \`D1a\` states the drop instead of hiding it — under the OLD ` +
    `\`file:line:markers\` key the same two lists still differ by ` +
    `${d1aOldKey.length === 2 ? `${d1aOldKey[0]} member(s) across ${d1aOldKey[1]} file(s)` : 'REFUSED'} ` +
    `while the occurrence-index key differs by ${d1aNewKey ?? 'REFUSED'}, totals equal either way ` +
    `(${d1aTotals}). FOUR COUNTERFACTUALS on the key, expectations written first, one axis each: ` +
    `${Object.entries(CF).map(([k, r]) => `${k} → ${r === null ? 'REFUSED' : `${r.verdict} (lost ${r.lost}, gained ${r.gained})`}`).join('; ')} ` +
    `— all as predicted (${cfAsPredicted}), and the teeth are the point: a pure line shift stays ` +
    `green while a LOST member (CF-2b) and a GAINED member (CF-3) both redden ` +
    `(${cfTeeth}). CF-4 is the key's declared blind spot: swapping two blocks whose marker sets ` +
    `are identical is invisible to it, because they are the same member twice. Gate for the ` +
    `re-key: \`tsc -p scripts/tsconfig.json\` exit 0 with no diagnostics (${typecheckClean}) and ` +
    `\`probe-round224\` back to All ${probe224Head ?? 'REFUSED'} — §4 for why that one is a grade ` +
    `on me and not on the re-key`,
  curedCfTally !== null &&
    curedCfNotTrue !== null &&
    JSON.stringify(curedCfTally) === JSON.stringify([7, 1]) &&
    JSON.stringify(curedCfNotTrue) === JSON.stringify(['R1']) &&
    curedCfSaysRefused &&
    curedCfDidNotThrow &&
    exitOf(R.curedCf) !== 0 &&
    curedBTally !== null &&
    JSON.stringify(curedBTally) === JSON.stringify([7, 1]) &&
    curedCTally !== null &&
    JSON.stringify(curedCTally) === JSON.stringify([7, 0]) &&
    probe371Gate &&
    probe371Head === '12' &&
    d1Ok &&
    JSON.stringify(d1aOldKey) === JSON.stringify([4, 1]) &&
    d1aNewKey === '0' &&
    d1aTotals &&
    cfAsPredicted &&
    cfTeeth &&
    typecheckClean &&
    probe224Head === '192',
);

// ── T4 — mine, this fire ─────────────────────────────────────────────────────────────────────
const typecheckDiagnostics = (R.typecheck.match(/error TS/g) || []).length;
/**
 * The evidence for each of the four, parsed rather than narrated — a `§4` that only asserted its
 * own prose would be a grade that cannot go red.
 */
const sweepVerdict = (R.sweep.match(/^SWEEP (PASSED|FAILED) — (\d+) of (\d+) swept probes green, (\d+) red/m) || []).slice(1);
const sweepIsGreen = sweepVerdict.length === 4 && sweepVerdict[0] === 'PASSED' && sweepVerdict[1] === sweepVerdict[2] && sweepVerdict[3] === '0';
const renamedAway = !/\btype Row\b/.test(readFileSync(join(REPO, PROBE_371_PATH), 'utf8').slice(readFileSync(join(REPO, PROBE_371_PATH), 'utf8').indexOf('ROUND 396 RE-KEY')));
const cf2WasWrong = /CF-2 — first marker phrase[\s\S]*?\[\*\*\* PREDICTED D1 RED \*\*\*\]/.test(R.keyCf);
const cf2bIsRed = /CF-2b[\s\S]*?NEW key: D1 RED[^\n]*AS PREDICTED/.test(R.keyCf);
const harnessSaysWhyItIsInMemory = R.keyCf.includes('spawns child probes that do not run in a detached worktree');
const recorderRefusesToAdopt = readFileSync(join(HERE, 'record-drives.mjs'), 'utf8').includes("git(['worktree', 'remove', '--force', p]);\n    console.log(`  (removed a pre-existing ${tag} tree rather than adopting it)`);");
g(
  'T4',
  `W4 HOLDS — MINE, four, and the first one broke the gate I was in the middle of repairing. ` +
    `**One.** The first version of the \`D1\` re-key named its type \`Row\`, which ` +
    `\`probe-round371\` already declares at line 141: \`TS2300: Duplicate identifier\`. I did not ` +
    `run \`npm run typecheck\` before driving, because my last four fires touched \`docs/\` only ` +
    `and I carried the habit into the first fire in a week that edits \`scripts/\`. Nothing I ran ` +
    `named it directly: \`probe-round371\` died on a child-probe spawn with no verdict, and the ` +
    `arm that actually caught it was \`probe-round224\` section S — two probes away — reporting ` +
    `"13 diagnostic line(s)" and a residue file NOT COVERED, while the sweep's own line for that ` +
    `probe read \`exit 1, summary line NOT FOUND\`. Renamed to \`MemberRow\`: typecheck exit 0, ` +
    `${typecheckDiagnostics} diagnostics. **Two, and it is his §2b in my own fire.** I left a ` +
    `detached worktree registered under \`.testdata/r396-224\` — a squatter of exactly the kind ` +
    `his finding is about — and then suspected it of causing \`probe-round224\`'s red. I reaped ` +
    `it and re-drove: still red. The leftover was real and the diagnosis was wrong, and the ` +
    `order matters, because "I cleaned up the obvious thing and the red persisted" is what sent ` +
    `me to the diagnostic line that named my own file. This recorder's \`detachedAt\` now REFUSES ` +
    `to adopt a pre-existing path and returns the rev the tree MEASURES. **Three.** \`CF-2\` was ` +
    `written to remove a marker from a swept file and predicted RED; it drove GREEN. A member is ` +
    `a comment BLOCK, not a phrase — the subject carries \`rather than\` 27 times and its first ` +
    `marker block carries more than one, so removing one occurrence left that block in the ` +
    `population. \`CF-2b\` blanks every marker phrase in that block and is the mutation I meant. ` +
    `The prediction being written down is the only reason the green read as a defect in the ` +
    `counterfactual rather than as evidence about the key (383). **Four.** My first attempt at ` +
    `§3 drove \`probe-round371\` inside a detached worktree and got exit 1 with no headline at ` +
    `all. I nearly filed that as a red: it is a probe that spawns child probes, and those do not ` +
    `run in a tree under \`.testdata/\`. §3's counterfactuals therefore drive the KEY over ` +
    `substituted text, in memory, touching no tree — stated in the recording's own header rather ` +
    `than left for a reader to notice. The gate the first item broke, re-driven whole at the ` +
    `re-key commit: **${sweepVerdict.length === 4 ? `SWEEP ${sweepVerdict[0]} — ${sweepVerdict[1]} of ${sweepVerdict[2]} green, ${sweepVerdict[3]} red` : 'REFUSED'}** ` +
    `(${sweepIsGreen}), against Argus's \`SWEEP FAILED — 42 of 43\` at \`4a2fccf5\`. ` +
    `Evidence for the four, parsed and not narrated: no \`type Row\` left in my block ` +
    `(${renamedAway}), \`CF-2\` recorded with its prediction marked wrong (${cf2WasWrong}) beside ` +
    `\`CF-2b\` red as predicted (${cf2bIsRed}), the harness header stating why it runs in memory ` +
    `(${harnessSaysWhyItIsInMemory}), and this round's recorder refusing to adopt a pre-existing ` +
    `tree (${recorderRefusesToAdopt})`,
  typecheckDiagnostics === 0 &&
    sweepIsGreen &&
    renamedAway &&
    cf2WasWrong &&
    cf2bIsRed &&
    harnessSaysWhyItIsInMemory &&
    recorderRefusesToAdopt,
);

// ── LIVE — asserted on by nothing ────────────────────────────────────────────────────────────
const same = (p, pin) => readFileSync(join(REPO, p), 'utf8') === show(pin, p);
console.log(
  `LIVE — this machine, asserted on by nothing: \`.scratch\` present here: ${existsSync(join(REPO, '.scratch'))}; ` +
    `his Round 395 instrument still byte-identical to \`${HIS_395_PIN}\`: ${same(HIS_395_PATH, HIS_395_PIN)}; ` +
    `my cured Round 394 instrument still byte-identical to \`${MY_394_CURE_PIN}\`: ${same(MY_394_PATH, MY_394_CURE_PIN)}; ` +
    `the re-keyed probe still byte-identical to \`${REKEY_PIN}\`: ${same(PROBE_371_PATH, REKEY_PIN)}.\n`,
);

const notTrue = grades.filter(([, ok]) => ok !== true).map(([n]) => n);
if (notTrue.length) console.log(`NOT TRUE: ${notTrue.join(' ')}`);
console.log(`${grades.length} grades, ${notTrue.length} not true`);
process.exit(notTrue.length === 0 ? 0 : 1);
