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
 * B4's detector, extracted from Round 373's SOURCE rather than retyped here, so that if Daedalus
 * re-keys it this file follows him instead of grading a copy of what it used to say. The extraction
 * is graded before it is used: exactly one such construct, and the literal it yields must occur in
 * his source in the spelling this arm reconstructs (Round 331 — run the regex, do not reason about
 * it; a source-scraping regex fails by returning a smaller number).
 */
const b4Matches = [...r373Src.matchAll(/\(r225Src\.match\(\/(.+?)\/g\)/g)];
const b4Literal = b4Matches.length === 1 ? b4Matches[0][1] : '(not extracted)';
check(
  'A0',
  `the extractor found Round 373's B4 detector exactly once (${b4Matches.length} match(es)) and the ` +
    'literal it yields is present in his source in the reconstructed spelling — graded before it ' +
    'is used, because a scrape that silently finds nothing would make every arm below vacuous',
  b4Matches.length === 1 && occurrences(r373Src, `(r225Src.match(/${b4Literal}/g)`) === 1,
);

check(
  'A1',
  'B4 is CORRECT today, and this is the check that says so: the literal it hand-copied is ' +
    `byte-identical to the registry's declared refusal source (\`${b4Literal}\`). This arm is the ` +
    'pin the shipped one has no equivalent of — it goes red on the day either side drifts, which ' +
    'is the day B4 starts reporting 0 about a string nobody declares',
  b4Literal === r225.refusal!.source,
);

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
