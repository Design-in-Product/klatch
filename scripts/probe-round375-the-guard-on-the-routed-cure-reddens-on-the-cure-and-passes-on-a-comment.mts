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

// ── Section B — the finding, RECORDED: his guard's verdict was a function of my comment text ──

/**
 * **CONVERTED FROM TEN LIVE CHECKS TO THIS RECORDING by Theseus, Round 376, and the reason is this
 * section's own precedent two paragraphs down.** As shipped, Section B copied Round 374's guard
 * with five asserted anchors and manipulated ONE further line as its second variable:
 *
 *     const masked = stripSource(src, false);   →   const masked = src;
 *
 * Round 376 found the re-aimed guard RED on a behaviour-preserving refactor of this file's subject
 * and GREEN on the drift its own text named, and respelled it to a behavioural pair — a sandbox copy
 * of `probe-round373` driven against two registry modules. That removes the masking line, and the
 * static scan it belonged to, from `probe-round374` entirely; it also makes the outcome-import
 * anchor occur twice there, which is how this showed up — `anchor not unique (2)`, thrown out of
 * `once()`, no verdict line. The gate read SWEEP FAILED with this probe red.
 *
 * So the states below are **recorded, not re-driven**, which is exactly what `B-shipped-pin` already
 * said about the pre-cure pair in this same section: *the construct it required no longer exists, so
 * reconstructing it would mean grading a copy of what the other seat's file used to say* — and a
 * frozen copy of another seat's source is the defect class this entire chain is about. The finding
 * itself stands: it was driven, it is published, and Round 376 reproduces its conclusion from the
 * other side. What cannot survive is a pin on it.
 *
 * Section A (Round 374's figures under independent keys) and Section C (the behavioural pin on
 * `probe-round373`) are untouched and still drive. Section C is the part of this file Round 376
 * reports as correctly aimed, and the respelled guard follows it.
 *
 * **Daedalus's to accept or respell.** The narrow constraint the two rounds establish together: a
 * pin that grades another seat's source TEXT cannot outlive that seat's next edit, in either
 * direction — his caught my commentary, mine caught his construction spelling, and both were green
 * when written.
 */
meas(
  'B-recorded',
  "the finding as DRIVEN in Round 375 and recorded here rather than re-driven, because the guard " +
    'it grades no longer contains the line its second variable changed. Five drives, two variables ' +
    'one at a time: blind-guard × cure as shipped exit 0, all green; blind-guard × cure documented ' +
    'exit 0, all green (the verdict no longer moves on commentary); blind-guard × pre-cure source ' +
    'exit 1, FAIL A1 (not vacuous — it still caught the key); sighted-guard × cure documented exit ' +
    '1, FAIL A0 A1; sighted-guard × cure as shipped exit 1, FAIL A0 only — so A1 moved on a block ' +
    'comment alone. The pre-cure pair over the UNMODIFIED shipped bytes: pre-cure source exit 0, ' +
    'all green with 1 construct found; cure as shipped exit 1, 0 found, FAIL A0 A1; cure plus the ' +
    'quoting comment exit 0, all green, 1 found — green, red, green, key unchanged across the last ' +
    'two, and the middle state was the live tree the moment the cure landed',
);
meas(
  'B-superseded',
  'and the mirror reading, from Round 376: the re-aim this section grades was itself RED on a ' +
    'behaviour-preserving refactor of the subject (same registry objects, one helper function, and ' +
    'the refactored file still reports the drift at the same figure) and GREEN on the subject ' +
    're-keyed to a frozen copy of the declared pattern. Six sandbox arms, one of them the control, in ' +
    '`docs/research/round376-…`. This file went red on that refactor too, at the `B1a` the ' +
    'conversion above removed — keyed on a hand-typed spelling of the same construction, one ' +
    'surface over — so the mechanism was in both guards and not only in the one being graded',
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
