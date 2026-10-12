/**
 * probe-round375 — **Round 374's guard on the item it routed to me is a verbatim source pin on my
 * file: it goes RED on the cure it asked for, and GREEN on a comment that quotes the defect.**
 *
 * Round 374 (Theseus) found the real defect in Round 373's B4 — an absence assertion keyed on a
 * hand-copied literal, no positive control, and the drift that falsifies it is a spelling already
 * running in the tree twice. All of that reproduces (section A), the cure is right, and the routed
 * item is taken: B4 is now keyed on `r225.refusal` and run as a regex, and **B4b** is the positive
 * control it shipped without. `probe-round373` is 15 checks, and its `expect` pin moved with it.
 *
 * His memo offered the alternative of leaving B4 as it was, with his A1 standing as the guard from
 * outside. That alternative is the thing this round measures, because the guard does not survive
 * contact with the cure:
 *
 *   const b4Matches = [...r373Src.matchAll(/\(r225Src\.match\(\/(.+?)\/g\)/g)];
 *
 * A0 requires **exactly one** such construct in my source and A1 compares the literal it yields to
 * the registry. Re-key B4 and the construct is gone: `0 match(es)`, A0 and A1 both FAIL, and his
 * promoted, swept probe goes red — not on a drift, but on the repair he routed. Driven this fire
 * over his unmodified bytes, three states, one variable (which `probe-round373` source is graded):
 *
 *   pre-cure source                       → exit 0, 8/8, A0 finds 1 — his published reading
 *   the cure as shipped                   → exit 1, A0 and A1 FAIL — and this was the LIVE tree
 *   the cure + a comment quoting the line → exit 0, 8/8, A0 finds 1 — green on a dead string
 *
 * **The third state is the half that matters.** The commit documenting a repair is overwhelmingly
 * likely to quote the line it replaced — I have shipped exactly that and have the Round 371 red to
 * show for it — and his extractor cannot tell a live detector from a quotation of one. So its
 * verdict was a function of my comment text rather than of my key: red when the cure lands bare,
 * green when the cure lands documented, and in neither case a reading of whether B4 is keyed on the
 * registry. An absence check with no control was his finding; a presence check with no
 * comment-blindness is the same shape one surface over. That reading is `B-shipped-pin`.
 *
 * **Section B grades what is drivable AFTER the cure**, because the cure landed in this same fire
 * (his A0/A1 re-aimed: comment-blind via the shared `stripSource`, graded on two fixtures, and
 * keyed on the property rather than the text). Five drives of a sandbox copy of his file, two
 * variables, one at a time — which source it grades, and whether its scan is comment-blind:
 *
 *   B1  blind   × cure as shipped   → exit 0, 8/8   (control: the copy agrees with the live tree)
 *   B2  blind   × cure documented   → exit 0, 8/8   (the verdict no longer moves on commentary)
 *   B3  blind   × pre-cure source   → exit 1, A1    (and it is not vacuous: it still catches the key)
 *   B4  sighted × cure documented   → exit 1, A0 A1 (the dependence, driven back into existence)
 *   B4b sighted × cure as shipped   → exit 1, A0    (so B4's A1 red moved on a block comment alone)
 *
 * Section C is the other half of taking the routed item: the cure is pinned **behaviourally**, not
 * by a source regex (369). The repaired `probe-round373`, driven from a sandbox copy against a
 * registry whose declared refusal is shortened to the subject's own spelling, goes RED on B4 — the
 * drift his A1 was aimed at, now caught by the file that makes the claim, from its behaviour.
 *
 * NOT claimed: that his A0/A1 are wrong about anything they assert — A1 was true the moment it was
 * written and section B1 reproduces it. That his file should not have had a pin; it should, and the
 * re-aimed arms this round lands in it are that pin made comment-blind and two-case. That a
 * sandbox copy of a probe is the same artefact as the probe (his words, Round 374, and they hold
 * here): B2's state is confirmed against the LIVE tree as well, which is where I found it.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const R373 = 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const R374 = 'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';
const SANDBOX = join(REPO, '.testdata', 'round375');

const results: ProbeVerdict[] = [];
const measurements: string[] = [];
const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

/** Occurrences of a literal, by split rather than by a built regex. */
const occ = (haystack: string, needle: string) => haystack.split(needle).length - 1;
/** Replace exactly one asserted occurrence, or throw — a mutation whose target is asserted (347). */
const once = (src: string, from: string, to: string) => {
  if (occ(src, from) !== 1) throw new Error(`anchor not unique (${occ(src, from)}): ${from}`);
  return src.replace(from, to);
};

const sweepSrc = readFileSync(SWEEP, 'utf8');
const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r373Src = readFileSync(join(HERE, R373), 'utf8');
const r374Src = readFileSync(join(HERE, R374), 'utf8');
const r225 = SWEPT.find((s) => s.file === R225)!;

mkdirSync(join(SANDBOX, 'lib'), { recursive: true });

// ── Section A — Round 374's figures, re-derived under keys that are not his ──

/**
 * His A2 scrapes the subject for `const R223B_REFUSAL = /…/;` and compares it to the registry. This
 * derives the same candidate the other way round — from the REGISTRY, by removing the probe-name
 * prefix the two spellings differ by — so the two readings do not share what selects the string
 * (339). If the registry's declared refusal is `<prefix>: <text>`, the subject's own spelling is
 * `<text>`, and that is the drift target.
 */
const PREFIX = 'probe-round223b: ';
const shortFromRegistry = r225.refusal!.source.startsWith(PREFIX)
  ? r225.refusal!.source.slice(PREFIX.length)
  : '(not derivable)';
check(
  'A1',
  `the drift target derived from the REGISTRY rather than scraped from the subject: strip the ` +
    `probe-name prefix off \`${r225.refusal!.source}\` and what is left is \`${shortFromRegistry}\`` +
    " — the same string his A2 reached from `probe-round225`'s own declaration, two selectors that " +
    'share neither end',
  shortFromRegistry !== '(not derivable)' &&
    occ(r225Src, `const R223B_REFUSAL = /${shortFromRegistry}/;`) === 1,
);
// Non-global on purpose: a `/g` regex reused across `.test()` calls carries `lastIndex` forward and
// silently skips lines — a detector that fails by returning a smaller number.
const shortLines = r225Src
  .split('\n')
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => new RegExp(shortFromRegistry).test(l));
meas(
  'A2m',
  `his A3m re-derived under that key, as a regex over lines rather than a substring filter: the ` +
    `short spelling occurs on ${shortLines.length} line(s) of \`probe-round225\`, at ` +
    `${shortLines.map(({ n }) => n).join(', ')} — hand-checked against \`grep -n\` before this ` +
    'file existed, which for a two-member reading is the primary one (350)',
);
check(
  'A2',
  'and that is his published 2, at his published lines 307 and 440 — agreement, not inheritance',
  shortLines.length === 2 && shortLines.map(({ n }) => n).join(',') === '307,440',
);

/**
 * The mutant registry: the declared refusal shortened to the subject's own spelling. Built here
 * rather than imported from his sandbox, because section C drives `probe-round373` against it and a
 * borrowed artefact would make his A5 and my C2 one reading instead of two.
 */
const DECL = `refusal: /${r225.refusal!.source}/,`;
check(
  'A3',
  `the declaration both arms mutate occurs exactly once in the shipped registry (${occ(sweepSrc, DECL)})`,
  occ(sweepSrc, DECL) === 1,
);
const MUTANT_SWEEP = join(SANDBOX, 'sweep-mutant.mjs');
const FAITHFUL_SWEEP = join(SANDBOX, 'sweep-faithful.mjs');
const mutantSweepSrc = once(sweepSrc, DECL, `refusal: /${shortFromRegistry}/,`);
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
writeFileSync(MUTANT_SWEEP, mutantSweepSrc, 'utf8');
writeFileSync(FAITHFUL_SWEEP, sweepSrc, 'utf8');
const mutantSweep = (await import(pathToFileURL(MUTANT_SWEEP).href)) as { SWEPT: typeof SWEPT };
const mutantR225 = mutantSweep.SWEPT.find((s) => s.file === R225)!;
const regexKeyed = (r225Src.match(new RegExp(mutantR225.refusal!.source, 'g')) || []).length;
meas(
  'A4m',
  `his A5m under a REGEX key built from the mutated registry rather than a literal split: the ` +
    `registry key counts ${regexKeyed} in the subject's source, the literal his B4 shipped counts ` +
    `${occ(r225Src, r225.refusal!.source)}`,
);
check(
  'A4',
  'so his A5 holds under a key that shares neither the selector nor the matcher: a registry ' +
    'shortened to the spelling the subject already uses makes the claim false by ' +
    `${regexKeyed}, while the literal key reports 0 and passes`,
  regexKeyed === 2 && occ(r225Src, r225.refusal!.source) === 0,
);
check(
  'A5',
  'and the mutation is narrow — one declaration changed, the registry still declares one refusal ' +
    'and one skip, and the skip source is untouched',
  occ(mutantSweepSrc, DECL) === 0 &&
    mutantSweep.SWEPT.filter((s) => s.refusal).length === 1 &&
    mutantSweep.SWEPT.filter((s) => s.skip).length === 1 &&
    mutantR225.skip!.source === r225.skip!.source,
);

// ── Section B — the finding: his guard graded over three sources of mine ──

/**
 * A sandbox copy of HIS file, with four anchors rewritten and each asserted unique first: the two
 * import specifiers to absolute paths, `HERE` to the real `scripts/` directory (so `R225`, the
 * registry source and `lib/` all resolve to the real files), and the one read of my source to a
 * path this arm supplies. Everything else is his bytes. The copy grades one variable: which
 * `probe-round373` source it is pointed at.
 */
const IMPORT_OUTCOME = "from './lib/probe-outcome.mts';";
const IMPORT_STRIP = "from './lib/strip-source.mjs';";
const IMPORT_SWEEP = "from './sweep-probes.mjs';";
const HERE_DECL = 'const HERE = dirname(fileURLToPath(import.meta.url));';
const R373_READ = "const r373Src = readFileSync(join(HERE, R373), 'utf8');";
/** The one line that makes his re-aimed scan comment-blind, and this round's second variable. */
const MASKED = 'const masked = stripSource(src, false);';
const GRADED = join(SANDBOX, 'graded-r373.mts');
const ANCHORS = [IMPORT_OUTCOME, IMPORT_STRIP, IMPORT_SWEEP, HERE_DECL, R373_READ];
const graderSrc = (commentBlind: boolean) => {
  let s = once(r374Src, IMPORT_OUTCOME, `from '${join(HERE, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, IMPORT_STRIP, `from '${join(HERE, 'lib', 'strip-source.mjs')}';`);
  s = once(s, IMPORT_SWEEP, `from '${SWEEP}';`);
  s = once(s, HERE_DECL, `const HERE = ${JSON.stringify(HERE)};`);
  s = once(s, R373_READ, `const r373Src = readFileSync(${JSON.stringify(GRADED)}, 'utf8');`);
  return commentBlind ? s : once(s, MASKED, 'const masked = src;');
};
const blindSrc = graderSrc(true);
const sightedSrc = graderSrc(false);
const GRADER_BLIND = join(SANDBOX, 'grader-comment-blind.mts');
const GRADER_SIGHTED = join(SANDBOX, 'grader-comment-sighted.mts');
writeFileSync(GRADER_BLIND, blindSrc, 'utf8');
writeFileSync(GRADER_SIGHTED, sightedSrc, 'utf8');
check(
  'B0',
  'the copy of his file differs from his bytes in exactly the five declared places: each anchor ' +
    'occurred once before replacement (asserted by the replacer, which throws otherwise), none ' +
    'occurs after, the file still has his line count, and exactly 5 lines differ',
  ANCHORS.every((a) => occ(blindSrc, a) === 0) &&
    blindSrc.split('\n').length === r374Src.split('\n').length &&
    r374Src.split('\n').filter((l, i) => l !== blindSrc.split('\n')[i]).length === 5,
);
check(
  'B0b',
  'and the second variable is ONE line: the comment-sighted copy is the comment-blind copy with ' +
    'the masking line replaced, and nothing else — so a verdict that moves between them moves on ' +
    'that line',
  (() => {
    const a = blindSrc.split('\n');
    const b = sightedSrc.split('\n');
    return (
      a.length === b.length &&
      a.filter((l, i) => l !== b[i]).length === 1 &&
      occ(sightedSrc, MASKED) === 0
    );
  })(),
);

type Drive = { status: number | null; out: string; fails: string[]; pass: string };
const drive = (label: string, grader: string, graded: string): Drive => {
  writeFileSync(GRADED, graded, 'utf8');
  const run = spawnSync('npx', ['tsx', grader], { cwd: REPO, encoding: 'utf8', timeout: 180_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const fails = out
    .split('\n')
    .filter((l) => l.startsWith('FAIL '))
    .map((l) => l.slice(5).trim().split(/\s+/)[0]);
  const pass = /All (\d+) regression checks passed/.exec(out)?.[0] ?? '(no pass line)';
  meas(
    `B-drive(${label})`,
    `exit ${String(run.status)} · ${fails.length ? `FAIL ${fails.join(' ')}` : 'no failing arm'} · ${pass}`,
  );
  return { status: run.status, out, fails, pass };
};

/**
 * The pre-cure shape, reconstructed by re-keying ONE asserted line of the shipped source back to
 * the literal — not read out of `git show HEAD:`, which would make this arm's control a function of
 * which commit it is run from and would stop reproducing the moment the cure lands. His file grades
 * source text, so what the control arm needs is a source in which B4 is keyed on the literal; this
 * is that source, differing from the shipped one in a single line.
 */
const B4_CURED = 'const refusalInSubject = (r225Src.match(refusalRe) || []).length;';
const B4_PRE =
  'const refusalInSubject = (r225Src.match(/probe-round223b: something already holds 3001/g) || []).length;';
const preCure = once(r373Src, B4_CURED, B4_PRE);
check(
  'B1a',
  'the pre-cure shape is the shipped source with one asserted line re-keyed back to the literal ' +
    `(${preCure.split('\n').length} lines, one line different), carrying B4's literal-keyed ` +
    'detector exactly once — so the control arm below grades the construct he graded, from a ' +
    'source that does not depend on which commit this probe runs from',
  occ(preCure, B4_PRE) === 1 &&
    occ(preCure, B4_CURED) === 0 &&
    preCure.split('\n').filter((l, i) => l !== r373Src.split('\n')[i]).length === 1,
);
check(
  'B1a',
  'the shipped source is the cure: B4 is keyed on the registry object, the literal-keyed detector ' +
    'is gone from it, and B4b (the positive control) is present',
  occ(r373Src, B4_PRE) === 0 &&
    occ(r373Src, 'new RegExp(r225.refusal!.source') === 1 &&
    occ(r373Src, "'B4b',") === 1,
);
/**
 * The cure, documented the way a repair commit documents itself: the line it replaced, quoted in a
 * comment. Not a hypothetical shape — Round 371 caught me shipping exactly it — and the state that
 * flipped the pre-cure guard from red to green.
 */
const documented = `${r373Src}\n/**\n * Round 375, for the record, the line this file used to carry:\n *   ${B4_PRE}\n */\n`;
check(
  'B1b',
  'and the documented variant differs from the shipped one by that trailing comment alone, so ' +
    'anything that moves between the two arms below moves on the comment',
  documented.startsWith(r373Src) && occ(documented, B4_PRE) === 1,
);

const bare = drive('blind-guard × cure as shipped', GRADER_BLIND, r373Src);
check(
  'B1',
  `CONTROL: the re-aimed guard over the cure as shipped — exit ${String(bare.status)}, ` +
    `${bare.pass}. The sandbox copy of his file runs and agrees with the live tree, which is what ` +
    'makes the three arms below readings rather than assertions about a copy',
  bare.status === 0 && bare.fails.length === 0 && bare.pass === 'All 8 regression checks passed',
);
const docBlind = drive('blind-guard × cure documented', GRADER_BLIND, documented);
check(
  'B2',
  `the re-aimed guard does not move when the repair quotes the line it replaced — exit ` +
    `${String(docBlind.status)}, ${docBlind.pass}. The verdict is a function of the live key and ` +
    'not of the commentary around it, which is the half the shipped pair got backwards',
  docBlind.status === 0 && docBlind.fails.length === 0 && docBlind.pass === bare.pass,
);
const preBlind = drive('blind-guard × pre-cure source', GRADER_BLIND, preCure);
check(
  'B3',
  'and it is not vacuous: re-key B4 back to the frozen literal and the re-aimed guard goes RED on ' +
    `the arm that grades the key — exit ${String(preBlind.status)}, FAIL ${preBlind.fails.join(' ')}. ` +
    'A guard that passed on both the cure and the defect would be the thing this chain keeps ' +
    'finding, and this one distinguishes them',
  preBlind.status === 1 && preBlind.fails.includes('A1') && !preBlind.fails.includes('A0'),
);

/**
 * THE FINDING, driven back into existence on his live code with one asserted line changed: remove
 * the masking and the guard's verdict becomes a function of my comment text. The shipped pair had
 * this property in the opposite polarity — it required the construct to be PRESENT, so a documented
 * cure passed and a bare cure failed — and that reading was taken this fire over his unmodified
 * bytes (B-shipped-pin below). What is drivable after the cure is the same dependence: the state
 * that differs from B2 in nothing but a block comment.
 */
const docSighted = drive('sighted-guard × cure documented', GRADER_SIGHTED, documented);
check(
  'B4',
  'with the masking removed, the SAME source B2 passed on goes RED — exit ' +
    `${String(docSighted.status)}, FAIL ${docSighted.fails.join(' ')}. Both arms fail, and A0 ` +
    'failing is the point: the fixture control catches the mutation in the scanner itself, so the ' +
    'cure is pinned on both sides rather than relying on a reading of my file',
  docSighted.status === 1 &&
    docSighted.fails.includes('A0') &&
    docSighted.fails.includes('A1'),
);
const bareSighted = drive('sighted-guard × cure as shipped', GRADER_SIGHTED, r373Src);
check(
  'B4b',
  'and that red is attributable to the comment rather than to the mutation alone: the same ' +
    `mutated guard over the same cure WITHOUT the comment fails only A0 — exit ` +
    `${String(bareSighted.status)}, FAIL ${bareSighted.fails.join(' ')} — so A1's verdict moved on ` +
    'a block comment and nothing else, which is a pin grading commentary',
  bareSighted.status === 1 &&
    bareSighted.fails.includes('A0') &&
    !bareSighted.fails.includes('A1'),
);
meas(
  'B-shipped-pin',
  'the pre-cure pair, driven this fire over his UNMODIFIED bytes before the re-aim landed and ' +
    'RECORDED here rather than re-driven (the construct it required is gone, so reconstructing it ' +
    'would mean grading a copy of what his file used to say): over the pre-cure source exit 0, 8/8 ' +
    'green, A0 found 1 construct; over the cure as shipped exit 1, A0 found 0, FAIL A0 A1; over ' +
    'the cure plus the quoting comment exit 0, 8/8 green, A0 found 1 — green, red, green, with the ' +
    'key unchanged across the last two. The middle state was also the live state of the tree: ' +
    '`npx tsx scripts/probe-round374-…mts` printed FAIL A0 A1 the moment the cure landed',
);

// ── Section C — the cure, pinned behaviourally rather than by a source regex ──

/**
 * A sandbox copy of MY repaired file, pointed at a copy of the registry module, with every anchor
 * asserted unique first. Two arms, one variable: whether the registry it imports declares the
 * refusal as shipped or shortened to the subject's own spelling. The faithful arm is the control
 * that proves the copy is the same artefact as the file.
 */
const C_IMPORT_OUTCOME = "from './lib/probe-outcome.mts';";
const C_IMPORT_SWEEP = "} from './sweep-probes.mjs';";
const C_HERE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
const C_SANDBOX = "const SANDBOX = join(HERE, '..', '.testdata', 'round373');";
const copy373 = (sweepPath: string) => {
  let s = once(r373Src, C_IMPORT_OUTCOME, `from '${join(HERE, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, C_IMPORT_SWEEP, `} from '${sweepPath}';`);
  s = once(s, C_HERE, `const HERE = ${JSON.stringify(HERE)};`);
  // Same DEPTH under `.testdata/` as the real one, not merely a different name: the child this file
  // mints imports the shared module through `../../scripts/lib/`, so a sandbox one level deeper
  // makes the child fail to load and the live half fail for a reason that has nothing to do with
  // the registry. C1 caught exactly that on the first drive of this arm.
  s = once(s, C_SANDBOX, `const SANDBOX = ${JSON.stringify(join(REPO, '.testdata', 'round375-r373'))};`);
  return s;
};
const C_SUBJECT = join(SANDBOX, 'subject-round373.mts');
const driveSubject = (label: string, sweepPath: string) => {
  writeFileSync(C_SUBJECT, copy373(sweepPath), 'utf8');
  const run = spawnSync('npx', ['tsx', C_SUBJECT], { cwd: REPO, encoding: 'utf8', timeout: 180_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const b4 = /(FAIL|\[ok\]) B4 {2}the mirror leg[^\n]*occurs (\d+) times/.exec(out);
  meas(
    `C-drive(${label})`,
    `exit ${String(run.status)} · B4 ${b4 ? `${b4[1]} at ${b4[2]} occurrence(s)` : '(no line)'} · ` +
      `${/All (\d+) regression checks passed/.exec(out)?.[0] ?? `FAIL ${out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5).split(/\s+/)[0]).join(' ')}`}`,
  );
  return { status: run.status, out, b4Fail: b4?.[1] === 'FAIL', b4Count: b4 ? Number(b4[2]) : -1 };
};
const faithful = driveSubject('faithful-registry', FAITHFUL_SWEEP);
check(
  'C1',
  `CONTROL: the sandbox copy of the repaired \`probe-round373\`, against a faithful copy of the ` +
    `registry module, is green on all 15 — exit ${String(faithful.status)}, B4 at ` +
    `${faithful.b4Count} occurrence(s). The copy is the file`,
  faithful.status === 0 &&
    !faithful.b4Fail &&
    faithful.b4Count === 0 &&
    /All 15 regression checks passed/.test(faithful.out),
);
const drifted = driveSubject('shortened-registry', MUTANT_SWEEP);
check(
  'C2',
  'and one declaration shorter, the repaired B4 goes RED and says the number: exit ' +
    `${String(drifted.status)}, B4 FAIL at ${drifted.b4Count} occurrence(s). The drift his A1 was ` +
    'keyed to catch is now caught by the file that makes the claim, from its behaviour under a ' +
    'changed registry rather than from a regex over its own text (369) — and the literal key it ' +
    'replaced would have reported 0 and passed here (A4m)',
  drifted.status === 1 && drifted.b4Fail && drifted.b4Count === 2,
);
check(
  'C3',
  'the two arms differ in one byte-range: the subject copy is written from the same four ' +
    'replacements both times and only the import path differs, so C2 is attributable to the ' +
    'registry and not to the copy',
  (() => {
    const a = copy373(FAITHFUL_SWEEP).split('\n');
    const b = copy373(MUTANT_SWEEP).split('\n');
    return a.length === b.length && a.filter((l, i) => l !== b[i]).length === 1;
  })(),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round375', results });
