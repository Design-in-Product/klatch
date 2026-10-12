/**
 * probe-round374 — **Round 373's second witness is an absence assertion with no positive control,
 * and the spelling that would falsify it is already in the subject's source twice.**
 *
 * Round 373 (Daedalus) added the missing RED hint leg — a red carrying a declared hard-skip label
 * now says so — and it is right, the cure is right, and its 14 checks reproduce. Its section B4
 * offers a SECOND, independent witness for why the mirror leg (the refusal hint) has no witness
 * today: the declared refusal text occurs **0 times in `probe-round225`'s own source**, so the
 * child-echo Round 372 measured as not happening is the only route to it.
 *
 * That reading is TRUE today — arm A1 below is the check that says so. It is also keyed on a
 * hand-copied literal:
 *
 *   const refusalInSubject = (r225Src.match(/probe-round223b: something already holds 3001/g) …
 *
 * rather than on `r225.refusal`, the registry object the claim is about — and it asserts an
 * **absence**, so its failure mode is a false PASS. A detector that cannot find the string returns
 * `0` and reads exactly like a detector that looked and found nothing. There is no positive control
 * anywhere in the arm: nothing establishes that this detector can find anything in that file at all.
 *
 * **What makes it more than a style note: the drift that falsifies the claim is a drift toward a
 * string that is ALREADY IN THE TREE, twice.** `probe-round225` spells the same intent *shorter*
 * than the registry does — `const R223B_REFUSAL = /something already holds 3001/` — and that shorter
 * spelling occurs **2** times in its source. One of them (A3m, with line numbers) is inside a child
 * `probe-round225` mints and RUNS every fire. So if the registry's declared pattern is ever
 * shortened to the spelling the subject itself uses — the single most likely edit anyone would make
 * to it — the claim "0 occurrences" becomes false by 2, and B4, keyed on the long literal, still
 * prints `0` and still goes green. A5 drives exactly that, over a real mutated registry, rather than
 * describing it.
 *
 * The cure is the one Round 372 and Round 373 both used: fix it on the KEY, and pin the thing so the
 * next edit gets a red that says re-measure instead of silence. A6 is the cured form — keyed on
 * `r225.refusal`, with A4 as the positive control the shipped arm has no equivalent of.
 *
 * **Why this file and not one file.** The other half of Round 374 — driving `probe-round225` itself
 * into the RED-plus-declared-skip state, which is the hole Round 373 §4 named and declined — needs a
 * HELD `:3001`, and `promote-probes.mts` correctly classifies a probe that calls `server.listen` as
 * a `net` hazard that may not be swept. Landed as one file, that verdict would have put this pin in
 * the DEFERRED set, where nothing drives it — and a pin nothing drives is the defect this whole
 * chain is about, one surface over. So the port-holding half lives in
 * `probe-round374b-the-subject-reaches-the-state-itself-on-a-held-port.mts`, DEFERRED on its merits
 * and not merely on arrival, and everything here is hazard-clean and driven every sweep.
 *
 * NOT claimed: that B4 is wrong today — it is right, and A1 says so. That `r225.refusal` is the only
 * thing a reader of B4 could want keyed; the claim is narrower, that an ABSENCE reported by a
 * detector with no positive control is not evidence. That this file reaches the state Round 373's
 * live half reached: it drives nothing and spawns nothing, by design — see 374b.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const R373 = 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const SANDBOX = join(REPO, '.testdata', 'round374');

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

const sweepSrc = readFileSync(SWEEP, 'utf8');
const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r373Src = readFileSync(join(HERE, R373), 'utf8');
const r225 = SWEPT.find((s) => s.file === R225)!;

/** Occurrences of a literal string, counted by splitting rather than by a built regex. */
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

/**
 * **RE-AIMED BY Daedalus in Round 375, and RESPELLED HERE in Round 376 — the re-aim was the same
 * mechanism one surface over, and it is driven both ways below rather than argued.**
 *
 * As first shipped, this pair scraped Round 373's RAW source for the literal-keyed detector and
 * required **exactly one** such construct. Both halves were a verbatim source pin on another seat's
 * file (357), and taking the item this round routed falsified both at once: red on the cure (`0
 * match(es)`, gate at 40/41), green on the cure plus a comment quoting the replaced line. That
 * finding is Daedalus's, it is right, and his three drives are in `probe-round375` section B.
 *
 * His re-aim made the scan comment-blind through `lib/strip-source.mjs` and graded it on two
 * fixtures — both correct, and neither reaches the defect, because the arm was still keyed on a
 * hand-typed spelling of HIS construction: `occurrences(masked, 'new RegExp(r225.refusal')  === 1`.
 * Round 376 drove six sandbox arms (`docs/research/round376-…`), and the re-aimed A1's verdict is
 * **anti-correlated with the property it names**:
 *
 *   - **FALSE DEFECT.** Build the same two regexes from the same registry objects through a
 *     one-line helper — `const gOf = (p: RegExp) => new RegExp(p.source, `${p.flags}g`)` — and
 *     `probe-round373` stays at **exit 0, All 15**, and still goes **B4 FAIL at 2** under the
 *     shortened registry (arms D2/D6: the property is fully present). The re-aimed A1 goes **RED**.
 *   - **FALSE PASS.** Re-key B4 to a frozen copy of the declared pattern in the shape a person
 *     would actually write it — a named `const FROZEN_REFUSAL = /probe-round223b: …/g` beside the
 *     registry-built regex, which is literally the drift the arm's own text said it catches — and
 *     the re-aimed A1 goes **green** (arm D3). Add the registry drift on top and `probe-round373`
 *     reports `0` and passes **All 15** while its claim is false by 2 (arm D4), against **B4 FAIL
 *     at 2** on the shipped key under the identical registry (arm D5, the one-variable control).
 *
 * **A static reading cannot be made sound here, and that is a measurement rather than a preference.**
 * The needle is the declared pattern's text; the place a frozen copy lives is a regex literal; and
 * `stripSource` blanks a regex body in BOTH its readings, by design and for a load-bearing reason
 * stated in its own header. Measured on arm D3: the frozen copy occurs **1** time in the raw source
 * and **0** times in `stripSource(src, false)`. So comment-blindness and visibility-of-the-copy are
 * not simultaneously available from the shared reader — and the raw-source alternative is red on a
 * repair that documents the line it replaced, which is the failure Round 375 just found here.
 *
 * So this pair is now **behavioural**, in the register where the property cannot drift (369): a
 * sandbox copy of `probe-round373` driven as a child against two registry modules, one variable.
 * A0 is the faithful control, A1 is the drifted arm. Independent of his C1/C2 in both the selector
 * and the expected figure — his mutant shortens the refusal and expects `2`; this one sets the
 * declared refusal to the declared SKIP source and expects `1` — so their agreement is a second
 * reading rather than a second copy (339).
 */
const R373_IMPORT_OUTCOME = "from './lib/probe-outcome.mts';";
const R373_IMPORT_SWEEP = "} from './sweep-probes.mjs';";
const R373_HERE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
const R373_SANDBOX_DECL = "const SANDBOX = join(HERE, '..', '.testdata', 'round373');";

/** Replace exactly one asserted occurrence, or throw — a mutation whose target is asserted (347). */
const once = (src: string, from: string, to: string) => {
  const n = occurrences(src, from);
  if (n !== 1) throw new Error(`anchor occurs ${n} time(s), expected exactly 1: ${from}`);
  return src.replace(from, to);
};

/**
 * The subject copy. Four replacements, each asserted unique, and the child sandbox kept at the SAME
 * DEPTH under `.testdata/` as the real one — the child `probe-round373` mints reaches the shared
 * module through `../../scripts/lib/`, so a copy one level deeper fails to load for a reason that
 * has nothing to do with the registry. Daedalus's C1 caught exactly that; inheriting the constraint
 * rather than rediscovering it.
 */
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
const R373_SUBJECT = join(SANDBOX, 'subject-round373.mts');
const copy373 = (sweepPath: string) => {
  let s = once(r373Src, R373_IMPORT_OUTCOME, `from '${join(HERE, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, R373_IMPORT_SWEEP, `} from '${sweepPath}';`);
  s = once(s, R373_HERE, `const HERE = ${JSON.stringify(HERE)};`);
  s = once(s, R373_SANDBOX_DECL, `const SANDBOX = ${JSON.stringify(join(REPO, '.testdata', 'round374-r373-child'))};`);
  return s;
};
const SWEEP_FAITHFUL = join(SANDBOX, 'sweep-faithful.mjs');
const SWEEP_REFUSAL_IS_FILE = join(SANDBOX, 'sweep-refusal-is-file.mjs');
writeFileSync(SWEEP_FAITHFUL, sweepSrc, 'utf8');
/**
 * The drift target, and why THIS one. It has to be (a) derived from the registry entry rather than
 * typed, (b) present in the subject's source a known non-zero number of times, and (c) **narrow** —
 * the first mutant tried here declared the refusal as the registry's own SKIP source, which makes
 * the two declared patterns identical and reddens `probe-round373`'s B2 as well as its B4, so the
 * red stopped being attributable to B4's key (this file's own A5b lesson, applied to itself).
 * `r225.file` is in the entry, occurs exactly once in the subject's source, and collides with
 * nothing `classify` does — A1 asserts B4 is the ONLY failing arm, so that narrowness is checked
 * rather than claimed.
 */
const DRIFT_TARGET = r225.file;
writeFileSync(
  SWEEP_REFUSAL_IS_FILE,
  once(sweepSrc, `refusal: /${r225.refusal!.source}/,`, `refusal: /${DRIFT_TARGET}/,`),
  'utf8',
);

type R373Drive = {
  status: number | null;
  b4: 'ok' | 'FAIL' | 'none';
  count: number;
  all15: boolean;
  failed: string[];
};
const driveR373 = (label: string, sweepPath: string): R373Drive => {
  writeFileSync(R373_SUBJECT, copy373(sweepPath), 'utf8');
  const run = spawnSync('npx', ['tsx', R373_SUBJECT], { cwd: REPO, encoding: 'utf8', timeout: 180_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const m = /(FAIL|\[ok\]) B4 {2}the mirror leg[^\n]*occurs (\d+) times/.exec(out);
  const d: R373Drive = {
    status: run.status,
    b4: m ? ((m[1] === 'FAIL' ? 'FAIL' : 'ok') as 'ok' | 'FAIL') : 'none',
    count: m ? Number(m[2]) : -1,
    all15: /All 15 regression checks passed/.test(out),
    failed: out
      .split('\n')
      .filter((l) => l.startsWith('FAIL '))
      .map((l) => l.slice(5).split(/\s+/)[0]),
  };
  meas(
    `A-drive(${label})`,
    `exit ${String(d.status)} · B4 ${d.b4} at ${d.count} occurrence(s) · ` +
      (d.all15
        ? 'All 15 regression checks passed'
        : `failing arm(s): ${d.failed.join(' ') || '(none printed)'}`),
  );
  return d;
};

const faithful = driveR373('faithful-registry', SWEEP_FAITHFUL);
check(
  'A0',
  'CONTROL, and the arm that makes A1 attributable: a sandbox copy of `probe-round373`, differing ' +
    'from the shipped file in four asserted import/path replacements and nothing else, driven as a ' +
    'child against a VERBATIM copy of the registry module, is green on all 15 with B4 reading ' +
    `${faithful.count} — exit ${String(faithful.status)}. The copy is the file, so a red below is ` +
    'the mutated declaration and not the copy',
  faithful.status === 0 && faithful.b4 === 'ok' && faithful.count === 0 && faithful.all15,
);

const drifted = driveR373('refusal-declared-as-the-entry-filename', SWEEP_REFUSAL_IS_FILE);
check(
  'A1',
  "B4's figure is a FUNCTION OF THE REGISTRY DECLARATION, not of a copy of its text: declare the " +
    `refusal as \`${DRIFT_TARGET}\` — one asserted replacement, a string the entry already carries ` +
    `and the subject's source contains once — and B4 goes RED and says the number: exit ` +
    `${String(drifted.status)}, B4 ${drifted.b4} at ${drifted.count} occurrence(s), and B4 is the ` +
    `ONLY failing arm (${drifted.failed.join(' ')}), so the red is attributable to its key and not ` +
    'to a registry that broke something else. Any frozen copy of the shipped spelling reports 0 ' +
    'here and passes, which is what Round 376 arm D3 drove over a real re-keyed file — so this arm ' +
    'is red on exactly the drift its predecessor let through, and it does not move when the repair ' +
    "documents the line it replaced, because it reads none of that seat's text",
  drifted.status === 1 &&
    drifted.b4 === 'FAIL' &&
    drifted.count === 1 &&
    !drifted.all15 &&
    drifted.failed.length === 1 &&
    drifted.failed[0] === 'B4',
);

/**
 * The frozen spelling the pre-cure B4 was keyed on, now read from the registry rather than scraped
 * out of his file. A1 above establishes there is no such literal in `probe-round373` any more, so
 * there is nothing to scrape; and what the arms below actually need is *a key frozen at today's
 * declared spelling*, which is what `r225.refusal.source` read now is. The pre-cure arm asserted
 * these two were byte-identical, so this substitution changes no figure A5 or A6 reports.
 */
const b4Literal = r225.refusal!.source;

/**
 * The subject's own spelling of the same intent, extracted from its source. This is the drift
 * candidate, and it is not hypothetical: it is the spelling a person editing the registry would most
 * plausibly move to, because it is the one the subject already uses.
 */
const ownMatches = [...r225Src.matchAll(/const R223B_REFUSAL = \/(.+?)\/;/g)];
const ownSpelling = ownMatches.length === 1 ? ownMatches[0][1] : '(not extracted)';
check(
  'A2',
  `the subject declares its own constant for the same intent exactly once (${ownMatches.length} ` +
    `match(es)): \`${ownSpelling}\` — and the registry's declared pattern is the same text behind ` +
    'a probe-name prefix, so the two spellings differ by a prefix and nothing else',
  ownMatches.length === 1 &&
    r225.refusal!.source.includes(ownSpelling) &&
    r225.refusal!.source !== ownSpelling,
);

const ownLines = r225Src
  .split('\n')
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => l.includes(ownSpelling));
meas(
  'A3m',
  `the shorter spelling occurs ${ownLines.length} times in the subject's own source, at line(s) ` +
    `${ownLines.map(({ n }) => n).join(', ')} — one of them inside a child \`probe-round225\` ` +
    "mints and RUNS every fire, so the text that would falsify B4's claim is not merely " +
    'imaginable, it is already executing in the tree',
);

/**
 * The control B4 does not have. An absence assertion is only evidence if the detector that returned
 * zero can be shown to return non-zero on something known to be in the same file. Round 364's
 * lesson, and Round 355's: a known positive must CARRY the property, and a population-level absence
 * needs a control, or `0` is indistinguishable from a detector that is broken.
 */
const controlCount = occurrences(r225Src, r225.skip!.source);
check(
  'A4',
  'the detector is proven able to find a declared registry pattern in this exact file: the ' +
    `declared SKIP source occurs ${controlCount} time(s) in \`probe-round225\`. Round 373's B4 has ` +
    'no arm of this shape, so its `0` is not distinguishable from a detector that would return 0 ' +
    'for a typo, a renamed pattern, or an unreadable file',
  controlCount > 0,
);

/**
 * The counterfactual, driven over a real mutated registry rather than argued: shorten the declared
 * refusal to the spelling the subject already uses, and B4's two possible keys DISAGREE — the
 * literal key reports 0 and passes, the registry key reports the truth and fails.
 */
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
const ANCHOR = `refusal: /${r225.refusal!.source}/,`;
const anchorCount = occurrences(sweepSrc, ANCHOR);
check(
  'A5a',
  'the declaration this arm mutates occurs exactly once in the shipped registry ' +
    `(${anchorCount}), so the replacement below lands on it and not on a near-identical ` +
    'neighbour a `String.replace` would otherwise take (Round 347)',
  anchorCount === 1,
);
const MUTANT_SWEEP = join(SANDBOX, 'sweep-probes.mjs');
const mutatedSweep = sweepSrc.replace(ANCHOR, `refusal: /${ownSpelling}/,`);
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
writeFileSync(MUTANT_SWEEP, mutatedSweep, 'utf8');
const mutantSweep = (await import(pathToFileURL(MUTANT_SWEEP).href)) as { SWEPT: typeof SWEPT };
const mutantR225 = mutantSweep.SWEPT.find((s) => s.file === R225)!;
const literalKeyed = occurrences(r225Src, b4Literal);
const registryKeyed = occurrences(r225Src, mutantR225.refusal!.source);
meas(
  'A5m',
  "under a registry whose declared refusal is the subject's own spelling: the literal key (B4's) " +
    `counts ${literalKeyed}, the registry key counts ${registryKeyed}`,
);
check(
  'A5',
  'and there the two keys disagree: B4 still reports 0 and still PASSES, while the claim it is ' +
    'making — "the declared refusal text occurs 0 times in `probe-round225`" — has become false ' +
    `by ${registryKeyed}. The failure mode of an absence check keyed on a literal is a false PASS, ` +
    'driven here rather than described',
  mutantR225.refusal!.source === ownSpelling && literalKeyed === 0 && registryKeyed > 0,
);
check(
  'A5b',
  'the mutation is NARROW — exactly one declaration changed and the registry still declares one ' +
    'refusal and one skip, so what A5 observes is attributable to this edit and not to a registry ' +
    'that stopped parsing',
  occurrences(mutatedSweep, ANCHOR) === 0 &&
    mutantSweep.SWEPT.filter((s) => s.refusal).length === 1 &&
    mutantSweep.SWEPT.filter((s) => s.skip).length === 1 &&
    mutantR225.skip!.source === r225.skip!.source,
);

check(
  'A6',
  'the cured form of B4, stated as a check rather than as advice: keyed on `r225.refusal` (not a ' +
    'literal), with A4 standing as its positive control, the declared refusal source occurs 0 ' +
    "times in the subject's source — which is the true claim, now held by a key that cannot drift " +
    'away from what it is about',
  occurrences(r225Src, r225.refusal!.source) === 0 && controlCount > 0,
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round374', results });
