/**
 * probe-round377 — **Rounds 375 and 376 each found the other seat's guard keyed on a copy of the
 * graded file's source text, each cured the reported site, and the same mechanism was still live in
 * BOTH files at a third and fourth site — one of them inside the very check whose docblock claimed
 * the two readings "share neither end".**
 *
 * Round 375 (mine): Theseus's A0/A1 in `probe-round374` were keyed on a hand-typed copy of my
 * `probe-round373` construct, so they went red on the cure he routed and green on a comment quoting
 * it. Round 376 (his): my re-aim of those arms was keyed on a hand-typed spelling of HOW my file
 * builds its regex, so it was red on a behaviour-preserving refactor and green on the drift it named.
 * Both findings are right, both cures are right (section A re-derives his), and both of us then
 * shipped the same mechanism one surface over, in the arms immediately above the ones we were
 * arguing about:
 *
 *   probe-round374 A2   [...r225Src.matchAll(/const R223B_REFUSAL = \/(.+?)\/;/g)]   requires === 1
 *   probe-round375 A1   occ(r225Src, `const R223B_REFUSAL = /${shortFromRegistry}/;`) === 1
 *
 * Both are hand-typed spellings of how a THIRD probe — `probe-round225`, neither of ours — writes a
 * local `const`. The identifier is declared twice there, both uses local, nothing exported, so
 * renaming it is behaviour-preserving in the strictest sense available. Driven before either file
 * was edited, one variable (which copy of `probe-round225` the probe reads):
 *
 *   probe-round374 × faithful copy   exit 0 · All 8                 (control)
 *   probe-round374 × one const renamed   exit 1 · FAIL A2 A5        A3m collapses to `0 times`
 *   probe-round375 × faithful copy   exit 0 · All 8                 (control)
 *   probe-round375 × one const renamed   exit 1 · FAIL A1           A2 stays GREEN on the same bytes
 *
 * **Three reds across two swept probes, and not one of them about anything either file claims.** The
 * property — that the registry's declared refusal is the subject's own spelling behind a probe-name
 * prefix, and that the spelling occurs in the subject twice — is untouched by a rename: `probe-
 * round375`'s A2 reads it and stays green through the state where A1 dies, which is the internal
 * control that makes the red attributable to declaration syntax rather than to the property.
 *
 * **And in my file it had already made a published claim false.** A1's docblock said the derivation
 * reached the same string as his A2 by "two selectors that share neither end" (339). Both selectors
 * required `const R223B_REFUSAL = /…/;` to be present verbatim in `probe-round225`. They shared
 * exactly one end, and the one they shared is the one that breaks.
 *
 * Both sites are re-keyed this fire onto the registry derivation — the prefix strip, which is the
 * one reading of this string that nothing in `probe-round225` can move — and section C pins both
 * cures BEHAVIOURALLY (369): green on the rename that used to redden them, red when the registry
 * stops declaring the prefixed form, which is the drift their claims are actually about.
 *
 * NOT claimed: that a general detector for this class is built — it is not, and section B says why
 * in the measured terms Round 376 §4 established. That `probe-round225` is going to be renamed; the
 * cost is not the likelihood, it is that a swept probe's verdict was a function of a third file's
 * identifier spelling. That either seat was careless: both arms were true when written, and the
 * fixture this file uses as a known positive is the same bytes doing no harm, because it grades
 * files I can see rather than making a claim about one I cannot.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inspect } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { stripSource } from './lib/strip-source.mjs';
// `census` as well as `SWEPT`: B1m's population has to be the registry's own selector, not a
// narrower one of mine. Keying it on `probe-round*` instead of `/^probe-/` moved the figure by 3.
import { census, SWEPT } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const R374 = 'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';
const R375 = 'probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const SANDBOX = join(REPO, '.testdata', 'round377');

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
  const n = occ(src, from);
  if (n !== 1) throw new Error(`anchor not unique (${n}): ${from.slice(0, 70)}`);
  return src.replace(from, to);
};

const sweepSrc = readFileSync(SWEEP, 'utf8');
const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r374Src = readFileSync(join(HERE, R374), 'utf8');
const r375Src = readFileSync(join(HERE, R375), 'utf8');
const r225 = SWEPT.find((s) => s.file === R225)!;
const e374 = SWEPT.find((s) => s.file === R374)!;
const e375 = SWEPT.find((s) => s.file === R375)!;

mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));

// ── Section A — Round 376's figures, re-derived under keys that are not his ──

/**
 * `util.inspect` rather than `JSON.stringify`, which prints a RegExp as `{}` — I have read a pin
 * wrong that way, and so has he; this is the reading we now both use. `instanceof RegExp` is
 * asserted as well, because a pin that had been replaced by a string would inspect as a quoted
 * pattern and still "look right" in a printed line.
 */
meas(
  'A1m',
  `the two pins Round 376 moved or left standing, through the module: round374 ${inspect(e374.expect)}` +
    `, round375 ${inspect(e375.expect)} — and SWEPT.length is ${SWEPT.length}`,
);
/**
 * **This arm's first spelling pinned `SWEPT.length === 42` and went RED on its own promotion.** It
 * was green standing alone, green through both arms of `promote-probes.mts`, and red on the first
 * gate run after its entry landed — because the registry it was counting then had 43 entries, the
 * 43rd being this file. The promotion tool drives a candidate in the state BEFORE its entry exists,
 * so a conjunct that counts the registry is invisible to promotion by construction: there is no
 * arrangement of that tool that could have caught it.
 *
 * The claim was never about the registry's size. It is about the two pins Round 376 moved or left
 * standing. The size is now a figure in A1m, where a change to it is information rather than a
 * false defect — and this is the same lesson as 357 in a third register: a pin on a count is a pin
 * on a fact about the world that the pinning act itself changes.
 */
check(
  'A1',
  `his pin moves land as published: \`probe-round374\` unmoved at 8 and \`probe-round375\` converted ` +
    `18 → 8, both real RegExps rather than strings that would inspect the same way. The registry's ` +
    `size (${SWEPT.length}) is A1m's figure and not a conjunct here, because the first spelling of ` +
    'this arm pinned it at 42 and went red on the promotion of this very file',
  e374.expect instanceof RegExp &&
    e375.expect instanceof RegExp &&
    e374.expect.source === String.raw`All 8 regression checks passed` &&
    e375.expect.source === String.raw`All 8 regression checks passed`,
);

/**
 * One of Round 376 §6's three recorded readings, closed as a check rather than left as prose: two
 * different checks in my file both carried the label `B1a`, so `FAIL B1a` did not say which claim
 * had failed. Structural — it reads the `check(` construct, which is this repo's own, not another
 * seat's spelling of anything.
 */
const labelsOf = (src: string) => [...src.matchAll(/\bcheck\(\s*\n?\s*'([^']+)'/g)].map((m) => m[1]);
const myLabels = labelsOf(r375Src);
const dupes = (ls: string[]) => ls.filter((l, i) => ls.indexOf(l) !== i);
const popUnder = (mask: boolean) =>
  SWEPT.map((e) => {
    const raw = readFileSync(join(HERE, e.file), 'utf8');
    const ls = labelsOf(mask ? stripSource(raw, false) : raw);
    return { file: e.file, n: ls.length, dupes: [...new Set(dupes(ls))] };
  }).filter((r) => r.dupes.length > 0);
const popRaw = popUnder(false);
const popMasked = popUnder(true);
check(
  'A2',
  `the duplicate label Round 376 reported in my file is gone: ${myLabels.length} check labels in ` +
    `\`probe-round375\`, ${new Set(myLabels).size} distinct, duplicates ${JSON.stringify(dupes(myLabels))}`,
  myLabels.length > 0 && dupes(myLabels).length === 0,
);
/**
 * And the population version of that reading REFUSES, which is the useful part. Taking the same
 * selector over all 42 under two readings — raw source, and comment-and-regex-blanked — gives
 * different populations: the counts and the member lists both move. One file alone returns 178
 * labels, where the same label is passed by a loop over cases and the re-use is the design rather
 * than a defect. So the selector cannot tell "two checks that share a label" from "one check driven
 * N times", and two keys that disagree on the member list are not two readings of one number (340).
 * A2 above is a check because it reads ONE file I wrote and can hand-verify; the population figure
 * is not published, because the number I could print here would be a count of my selector's
 * confusion (351).
 */
meas(
  'A2m',
  `the population version of that reading, REFUSED and showing its work: the same selector finds ` +
    `${popRaw.length} of ${SWEPT.length} probes with a duplicated label over raw source and ` +
    `${popMasked.length} over comment-blanked source, and the two member lists differ ` +
    `(${JSON.stringify(popRaw.filter((r) => !popMasked.some((q) => q.file === r.file)).map((r) => r.file.slice(0, 14)))} ` +
    `only in the first, ${JSON.stringify(popMasked.filter((r) => !popRaw.some((q) => q.file === r.file)).map((r) => r.file.slice(0, 14)))} ` +
    `only in the second). The largest member returns ${Math.max(...popRaw.map((r) => r.n))} labels, ` +
    'which is a loop re-using one label per case by design. No population figure is published from ' +
    'this; what Round 376 reported about my file is checked by A2 and nothing broader is claimed',
);

/**
 * His §4 closure of the static direction, re-derived on a real file rather than on a sandbox copy:
 * `stripSource` blanks a regex BODY in both readings, so a construct that lives inside a regex
 * literal is invisible to a comment-blind scan. `probe-round225` carries the short spelling twice —
 * once inside a regex literal (line 307), once inside a string a child mints (line 440) — which
 * makes it the one file in the tree that reads both halves of his claim at once.
 */
const short = r225.refusal!.source.replace(/^probe-round\d+[a-z]?: /, '');
const rawHits = occ(r225Src, short);
const maskedHits = occ(stripSource(r225Src, false), short);
const bareHits = occ(stripSource(r225Src, true), short);
meas(
  'A3m',
  `his "a static reading cannot be made sound here" re-derived under my own reader, on the live ` +
    `\`probe-round225\` instead of his sandbox D3: the short spelling occurs ${rawHits} time(s) raw, ` +
    `${maskedHits} with comments and regex bodies blanked, ${bareHits} with strings blanked too`,
);
check(
  'A3',
  `and that is his measurement, from the other side: a regex body is blanked by the comment-blind ` +
    `reading (raw ${rawHits} → masked ${maskedHits}), and the remaining hit is the one inside a ` +
    `minted string, which the strings-blanked reading removes as well (${bareHits}). So ` +
    'comment-blindness and visibility-of-a-frozen-copy are not simultaneously available from the ' +
    'shared reader — the behavioural register is not a preference here, it is what is left',
  rawHits === 2 && maskedHits === 1 && bareHits === 0,
);

// ── Section B — the finding: the class, the member list, and the pre-cure drives ──

/**
 * The census, hand-read first and graded here. 16 of the 42 swept probes name another probe file;
 * 5 bind another NAMED probe's source text to an identifier (a loop over the whole population is a
 * census, not a pin, and is excluded). Of the use-sites in those 5, exactly two keyed a check on a
 * hand-typed fragment of the other file's DECLARATION SYNTAX, and both are cured in this fire.
 *
 * **A general detector for this class is not built, and the reason is measured rather than
 * preferred** — it is the same closure Round 376 §4 reached. The construct has to be found inside
 * string and regex LITERAL positions only: `const PREFIXED = /^(probe-round…` is a probe's own
 * declaration of its own regex and matches any pattern loose enough to catch the two sites above.
 * Literal-position awareness is exactly what the shared reader removes — it blanks those spans — so
 * the detector would have to re-implement it, and a span-diff reconstruction is blind to characters
 * that blank to themselves (344). What is built instead: a fixture-keyed check (B3) over the two
 * files that had the defect, with the pre-cure spellings carried here AS FIXTURES. The same bytes
 * are inert in that position: they grade files this probe can read in full, and they make no claim
 * about `probe-round225`, so nothing `probe-round225` does can move them.
 */
const censusPop = census(HERE);
const namesOtherUnder = (pop: string[]) =>
  SWEPT.filter((e) => {
    const src = readFileSync(join(HERE, e.file), 'utf8');
    return pop.some((f) => f !== e.file && src.includes(f));
  }).map((e) => e.file);
/**
 * ── Round 379: both legs of this figure's own stated derivation are DERIVED now ───────────────
 *
 * B1m's first spelling published `${namesOther}` — 20 — beside the sentence *"My first reading said
 * 16 … 153 files rather than the 118 I had, and the figure moved by 3"*. 16 + 3 is 19, and the line
 * printed 20. The member lists at `6859ba16` and at HEAD are identical and both 20, so nothing
 * arrived later to move it: **the sentence did not close on the day it shipped.**
 *
 * Measured, rather than inferred from the two numbers already in the sentence: the narrow selector
 * reads **17** members over a **122**-file population, the census selector reads 20 over 153, and
 * the move is +3 **from 17**. The delta was right and its starting point was not — my hand reading
 * of 16 was one short of the selector it claimed to implement, and I published the hand figure as
 * the detector's (341, 350). Neither leg is hardcoded now, so a delta that does not close is no
 * longer expressible here.
 */
const narrowPop = censusPop.filter((f) => /^probe-round/.test(f));
const narrowMembers = namesOtherUnder(narrowPop);
const censusMembers = namesOtherUnder(censusPop);
const namesOther = censusMembers.length;
const onlyUnderCensus = censusMembers.filter((f) => !narrowMembers.includes(f));
const onlyUnderNarrow = narrowMembers.filter((f) => !censusMembers.includes(f));
/**
 * The check the broken sentence needed, and it can fail two ways that matter. `onlyUnderCensus`
 * being non-empty is NOT true by construction — it holds only because some swept probe names a
 * population file that `probe-round*` cannot see, and editing those references away would empty it
 * and silently collapse the published delta to 0. `onlyUnderNarrow` being empty asserts the two
 * selectors are still NESTED, which is what makes "+3" a delta rather than two unrelated readings;
 * re-keying either leg breaks it. The subset arithmetic is left to close on its own — asserting
 * `17 + 3 === 20` against numbers this file just computed would recompute what it grades (369).
 */
check(
  'B1',
  `the delta B1m publishes is nested and non-empty, which is what the first spelling of that ` +
    `sentence got wrong: ${narrowMembers.length} members under \`probe-round*\` (${narrowPop.length} ` +
    `files), ${namesOther} under \`census()\`'s \`/^probe-/\` (${censusPop.length}), ` +
    `${onlyUnderCensus.length} member(s) visible ONLY to the wider selector — ` +
    `${onlyUnderCensus.map((f) => `\`${f.split('-').slice(0, 2).join('-')}\``).join(', ')} — and ` +
    `${onlyUnderNarrow.length} visible only to the narrower, which must be 0 for the two readings ` +
    `to be the same reading at two widths`,
  onlyUnderCensus.length > 0 && onlyUnderNarrow.length === 0,
);
const PRECURE_374 = String.raw`[...r225Src.matchAll(/const R223B_REFUSAL = \/(.+?)\/;/g)]`;
const PRECURE_375 = 'occ(r225Src, `const R223B_REFUSAL = /${shortFromRegistry}/;`)';
const DECL_FRAGMENT = 'const R223B_REFUSAL = ';
meas(
  'B1m',
  `the class, hand-read and then re-derived under the registry's OWN population selector: ` +
    `${namesOther} of ${SWEPT.length} swept probes name another probe file. My HAND reading said 16 ` +
    `and the narrow selector I thought I was implementing reads ${narrowMembers.length} over ` +
    `${narrowPop.length} files, so the hand figure was one short of its own detector; keying the ` +
    `population on \`/^probe-/\` the way \`census()\` does — ${censusPop.length} files — moves it ` +
    `+${onlyUnderCensus.length} from ${narrowMembers.length} to ${namesOther} (339). The first ` +
    `spelling of this line published ${namesOther} while explaining a move of ` +
    `+${onlyUnderCensus.length} from 16, which lands on 19; both legs are derived now and B1 checks ` +
    `the delta is nested and non-empty (Round 379). Of those, 5 bind ` +
    "another NAMED probe's source to an identifier — `probe-round269`, `372`, `373`, `374`, `375`; " +
    'a loop over the whole population is a census, not a pin, and is excluded — and this file will ' +
    'be the 6th. Two of those bindings fed a check keyed on that file\'s DECLARATION SYNTAX: ' +
    '`probe-round374` A2 and `probe-round375` A1, one per seat, both shipped in the two rounds that ' +
    'were about this exact defect, both cured in this fire. `probe-round373` 255/256 and ' +
    '`probe-round374` 282/345 read the same file through a REGISTRY-derived key and are not members',
);
meas(
  'B2m',
  'the pre-cure drives, recorded here because the construct they graded no longer exists and the ' +
    'only reconstruction available would be a frozen copy of what the two files used to say — the ' +
    'precedent Round 376 §4b set in `probe-round375` section B. One variable, which copy of ' +
    '`probe-round225` the probe reads, five asserted replacements and nothing else in each copy: ' +
    'probe-round374 × faithful → exit 0, own verdict All 8; probe-round374 × one const renamed → ' +
    'exit 1, FAIL A2 A5, A3m printing `0 times … at line(s) ` and A5 printing "has become false by ' +
    '0"; probe-round375 × faithful → exit 0, own verdict All 8; probe-round375 × one const renamed ' +
    '→ exit 1, FAIL A1 only, with A2 — the arm that reads the property — GREEN on the same bytes',
);
/**
 * ── B3 was a CHECK and is a recorded measurement, on Theseus's Round 378 §3 reading ───────────
 *
 * It asked for exactly this second reading in §6 of the Round 377 memo — whether the fixture
 * spellings are inert where they sit. They are, on the narrow question: B3's verdict could not be
 * moved by anything `probe-round225` does, because both fixtures are literals in THIS file and
 * both live legs read files this probe grades in full. That part of the argument survives.
 *
 * The known positive does not. The two KP legs read the fixtures RAW; the two live legs read
 * through `stripSource(…, true)`. Put the same two fixtures through the reader the live legs use
 * and they give **0 and 0** — so the KP is non-zero only because it bypasses the reader, and it
 * cannot witness the one failure mode the live legs have. Driven on the pre-cure sources out of
 * `56b180e6^` — the state in which the defect was present, by this file's own account:
 *
 *       file               raw   comments-blanked   both-blanked ← B3's live leg
 *       probe-round374  PRE  2                  0              0
 *                       LIVE 2                  0              0
 *       probe-round375  PRE  2                  1              0
 *                       LIVE 2                  0              0
 *
 * B3's live legs would have read **0 on both uncured files**. It was green on the cured state and
 * would have been green on the defect, which is the Round 355 shape with the fixture doing the
 * work the reader was supposed to do. And it cannot be repaired by re-aiming the reader: for
 * `probe-round374` all three readings are blind (2→2, 0→0, 0→0), because that site lived inside a
 * regex literal and `stripSource` blanks a regex body in both readings (Round 376 §4). Only
 * `probe-round375` has a distinguishing reading at all — comment-blanked, 1→0 — and it is the one
 * reading B3 does not use.
 *
 * So this is §1 of the Round 377 memo turned on its own remaining static arm: *there is no sound
 * static reading of this construct available from the shared reader*. What replaces it is section
 * C, in that memo's own §4 words — C2 and C3 assert both cured probes are green on the rename that
 * reddened their predecessors, which is the behavioural form of this claim and strictly stronger.
 * The readings are recorded rather than re-derived from git inside a swept probe: `probe-round263`
 * arm A pins a commit sha and cannot be driven in a minted repo at all (Round 378 §2).
 */
meas(
  'B3m',
  `the construct class in both cured files, read three ways, with the PRE-CURE state out of ` +
    `\`56b180e6^\` beside it. Live: \`probe-round374\` ${occ(r374Src, DECL_FRAGMENT)} raw / ` +
    `${occ(stripSource(r374Src, false), DECL_FRAGMENT)} comment-blanked / ` +
    `${occ(stripSource(r374Src, true), DECL_FRAGMENT)} both-blanked; \`probe-round375\` ` +
    `${occ(r375Src, DECL_FRAGMENT)} / ${occ(stripSource(r375Src, false), DECL_FRAGMENT)} / ` +
    `${occ(stripSource(r375Src, true), DECL_FRAGMENT)}. Pre-cure, same three readings: 374 was ` +
    `2 / 0 / 0 and 375 was 2 / 1 / 0. This was a CHECK on the both-blanked pair being 0, with the ` +
    `two fixtures as known positives — and it would have been GREEN on the defect, because the ` +
    `pre-cure pair was 0 as well. The fixtures read 1 and 1 raw but ` +
    `${occ(stripSource(PRECURE_374, true), DECL_FRAGMENT)} and ` +
    `${occ(stripSource(PRECURE_375, true), DECL_FRAGMENT)} through the reader the live legs use, ` +
    `so the known positive never carried the property (355). For 374 no reading distinguishes the ` +
    `two states; for 375 only the comment-blanked one does. Converted on Theseus's Round 378 §3 ` +
    `reading, which answered the §6 question this file asked; the claim is carried behaviourally ` +
    `by C2 and C3`,
);

// ── Section C — both cures pinned behaviourally: green on the rename, red on the real drift ──

/**
 * A sandbox copy of each cured probe, six replacements each, every anchor asserted unique first.
 * Two variables, one at a time: which copy of `probe-round225` the probe reads, and which registry
 * module it imports. `HERE` is rewritten to the REAL `scripts/` directory so that everything else
 * each file reads is the live tree — the copy differs from the file in its import paths, its sandbox
 * directory, and the one input under test.
 *
 * The outcome-import and `HERE` anchors are the FULL import/declaration lines rather than the
 * fragments both files also carry as string constants: the short forms occur twice in each file,
 * which is the `anchor not unique (2)` throw Round 376 hit inside my section B.
 */
const A_OUTCOME = "import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';";
const A_SWEPT = "import { SWEPT } from './sweep-probes.mjs';";
const A_HERE = "const HERE = dirname(fileURLToPath(import.meta.url));\nconst REPO = join(HERE, '..');";
const A_R225_READ = "const r225Src = readFileSync(join(HERE, R225), 'utf8');";
/**
 * Both files read the registry TWICE — once as a module (`import { SWEPT }`) and once as source text
 * (`readFileSync(SWEEP)`), because their counterfactuals mutate the declaration and re-import it.
 * Redirecting only the import would leave the two halves disagreeing, and the reds that produced
 * would be about my copy rather than about the one variable. Both are redirected together, so
 * "which registry does this probe see" stays a single variable.
 */
const A_SWEEP_READ = "const SWEEP = join(HERE, 'sweep-probes.mjs');";

const R225_FAITHFUL = join(SANDBOX, 'subject-round225-faithful.mts');
const R225_RENAMED = join(SANDBOX, 'subject-round225-renamed.mts');
writeFileSync(R225_FAITHFUL, r225Src, 'utf8');
/**
 * The behaviour-preserving edit: one local identifier renamed. It is declared once and used once,
 * both inside `probe-round225`, and it is not exported — so no reader outside that file can observe
 * the difference, which is what makes a red attributable to the GUARD rather than to the subject.
 */
const RENAMED_FROM = 'R223B_REFUSAL';
const RENAMED_TO = 'R223B_HOLD_MESSAGE';
const renameSites = occ(r225Src, RENAMED_FROM);
writeFileSync(R225_RENAMED, r225Src.split(RENAMED_FROM).join(RENAMED_TO), 'utf8');
check(
  'C0',
  `the mutation is the narrowest one available: \`${RENAMED_FROM}\` occurs ${renameSites} times in ` +
    `\`probe-round225\` — a declaration and a single local use — and \`export\` appears on neither, ` +
    'so renaming it changes nothing any other file can read. The declared refusal text, the ' +
    "registry entry and the subject's two occurrences of the short spelling are all untouched",
  renameSites === 2 &&
    !/export[^\n]*R223B_REFUSAL/.test(r225Src) &&
    occ(r225Src.split(RENAMED_FROM).join(RENAMED_TO), short) === rawHits,
);

/**
 * The drift the cured arms exist for, built from the registry rather than typed: the declared
 * refusal keeps the subject's spelling but loses its probe-name prefix, so the derivation both cures
 * depend on is no longer available. That is the state in which A2 (his) and A1 (mine) SHOULD be red.
 */
const DECL_ANCHOR = `refusal: /${r225.refusal!.source}/,`;
const DRIFTED_DECL = `refusal: /holds-3001-message: ${short}/,`;
const SWEEP_FAITHFUL = join(SANDBOX, 'sweep-faithful.mjs');
const SWEEP_UNPREFIXED = join(SANDBOX, 'sweep-unprefixed.mjs');
writeFileSync(SWEEP_FAITHFUL, sweepSrc, 'utf8');
writeFileSync(SWEEP_UNPREFIXED, once(sweepSrc, DECL_ANCHOR, DRIFTED_DECL), 'utf8');
check(
  'C0b',
  `and the registry mutation is narrow too: the declaration it replaces occurs ` +
    `${occ(sweepSrc, DECL_ANCHOR)} time(s) in the shipped registry (347), the mutated module still ` +
    `declares one refusal and one skip for the subject, and the skip is byte-identical`,
  occ(sweepSrc, DECL_ANCHOR) === 1 && occ(once(sweepSrc, DECL_ANCHOR, DRIFTED_DECL), DECL_ANCHOR) === 0,
);

type Drive = { status: number | null; failed: string[]; own: string | null };
const copyProbe = (file: string, sandboxDecl: string, r225Path: string, sweepPath: string) => {
  let s = readFileSync(join(HERE, file), 'utf8');
  s = once(s, A_OUTCOME, `import { summariseAndExit, type ProbeVerdict } from '${join(HERE, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, A_SWEPT, `import { SWEPT } from '${sweepPath}';`);
  s = once(s, A_HERE, `const HERE = ${JSON.stringify(HERE)};\nconst REPO = ${JSON.stringify(REPO)};`);
  s = once(s, sandboxDecl, `const SANDBOX = ${JSON.stringify(join(SANDBOX, `child-${file.slice(11, 19)}`))};`);
  s = once(s, A_R225_READ, `const r225Src = readFileSync(${JSON.stringify(r225Path)}, 'utf8');`);
  s = once(s, A_SWEEP_READ, `const SWEEP = ${JSON.stringify(sweepPath)};`);
  return s;
};
const SB374 = "const SANDBOX = join(REPO, '.testdata', 'round374');";
const SB375 = "const SANDBOX = join(REPO, '.testdata', 'round375');";
const drive = (label: string, file: string, sbDecl: string, r225Path: string, sweepPath: string): Drive => {
  const p = join(SANDBOX, `drive-${label}.mts`);
  writeFileSync(p, copyProbe(file, sbDecl, r225Path, sweepPath), 'utf8');
  const run = spawnSync('npx', ['tsx', p], { cwd: REPO, encoding: 'utf8', timeout: 300_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  // The LAST verdict line, not the first: both subjects spawn CHILD probes that print their own
  // headline, and `All 15 regression checks passed` in this output is the child's. My own first
  // reading of these drives confounded the two and attributed a child's 15 to the parent.
  const hits = [...out.matchAll(/All \d+ regression checks passed/g)];
  const d: Drive = {
    status: run.status,
    failed: out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5).split(/\s+/)[0]),
    own: run.status === 0 && hits.length ? hits[hits.length - 1][0] : null,
  };
  meas(
    `C-drive(${label})`,
    `exit ${String(d.status)} · own verdict ${d.own ?? '(none — the probe went red)'} · ` +
      `failing arm(s): ${d.failed.join(' ') || '(none)'}`,
  );
  return d;
};

const c374Faithful = drive('374-faithful', R374, SB374, R225_FAITHFUL, SWEEP_FAITHFUL);
const c375Faithful = drive('375-faithful', R375, SB375, R225_FAITHFUL, SWEEP_FAITHFUL);
check(
  'C1',
  `CONTROL, and what makes the arms below attributable: both cured probes, copied and pointed at a ` +
    `VERBATIM copy of \`probe-round225\` and a verbatim copy of the registry, are green on 8 — ` +
    `round374 exit ${String(c374Faithful.status)}, round375 exit ${String(c375Faithful.status)}. ` +
    'The copies are the files',
  c374Faithful.status === 0 &&
    c375Faithful.status === 0 &&
    c374Faithful.own === 'All 8 regression checks passed' &&
    c375Faithful.own === 'All 8 regression checks passed',
);

const c374Renamed = drive('374-renamed', R374, SB374, R225_RENAMED, SWEEP_FAITHFUL);
check(
  'C2',
  `his cured A2 is INSENSITIVE to the rename that reddened its predecessor: exit ` +
    `${String(c374Renamed.status)}, ${c374Renamed.own ?? `FAIL ${c374Renamed.failed.join(' ')}`} — ` +
    'against `exit 1, FAIL A2 A5` on the same copy before the re-key (B2m). A3m still reports 2 at ' +
    'lines 307 and 440, because the value the derivation yields is the value the scrape used to ' +
    'yield and A5 is built on it',
  c374Renamed.status === 0 &&
    c374Renamed.failed.length === 0 &&
    c374Renamed.own === 'All 8 regression checks passed',
);

const c375Renamed = drive('375-renamed', R375, SB375, R225_RENAMED, SWEEP_FAITHFUL);
check(
  'C3',
  `and mine is too: exit ${String(c375Renamed.status)}, ` +
    `${c375Renamed.own ?? `FAIL ${c375Renamed.failed.join(' ')}`} — against \`exit 1, FAIL A1\` ` +
    'before the re-key. A1 now reads the registry and nothing of the subject; A2, which was already ' +
    'green through that state, still reads the subject through a registry-derived key',
  c375Renamed.status === 0 &&
    c375Renamed.failed.length === 0 &&
    c375Renamed.own === 'All 8 regression checks passed',
);

const c374Drift = drive('374-unprefixed-registry', R374, SB374, R225_FAITHFUL, SWEEP_UNPREFIXED);
check(
  'C4',
  `and the re-key is NOT a loosening — his cured A2 is red on the drift it is now about: with the ` +
    `declared refusal carrying a non-probe prefix, exit ${String(c374Drift.status)}, failing arm(s) ` +
    `${c374Drift.failed.join(' ')}. A2 is in that list, and A5 is with it BY CONSTRUCTION rather ` +
    "than by accident: A5's mutant registry is built from A2's derived value, so when the " +
    'derivation is unavailable A5 has no counterfactual to drive. The list is asserted, not assumed',
  c374Drift.status === 1 &&
    c374Drift.failed.includes('A2') &&
    c374Drift.failed.join(' ') === 'A2 A5',
);

const c375Drift = drive('375-unprefixed-registry', R375, SB375, R225_FAITHFUL, SWEEP_UNPREFIXED);
check(
  'C5',
  `and mine is red there too, at the arm that makes the claim: exit ${String(c375Drift.status)}, ` +
    `failing arm(s) ${c375Drift.failed.join(' ')}. This state is NOT narrow for my file and the ` +
    'check says so rather than claiming otherwise — the prefix is upstream of everything this ' +
    "file's section A does with the string, so A2 (the lines the short spelling occurs on), A4 " +
    '(the regex-keyed count under a mutant registry) and C2 (the child drive against that mutant) ' +
    'all lose their input with it. The list is asserted exactly, so a future change that reddens a ' +
    'different set has to come back through this line. The narrowness that IS available is the ' +
    'control: the same bytes against the faithful registry are green on 8 (C1), and the rename ' +
    'that used to redden A1 is green (C3). Four deciding states per file, the same cured bytes in ' +
    'each: green, green on the rename, red on the drift, and the figure A1 reports in each',
  c375Drift.status === 1 &&
    c375Drift.failed[0] === 'A1' &&
    c375Drift.failed.join(' ') === 'A1 A2 A4 C2',
);

const diffLines = (x: string, y: string) => {
  const a = x.split('\n');
  const b = y.split('\n');
  return a.length === b.length ? a.filter((l, i) => l !== b[i]).length : -1;
};
check(
  'C6',
  'the copies differ from each other in exactly the lines the one variable under test touches, so ' +
    'every red above is attributable to that variable and not to the copying: the renamed arm ' +
    `differs from its control in ${diffLines(copyProbe(R374, SB374, R225_FAITHFUL, SWEEP_FAITHFUL), copyProbe(R374, SB374, R225_RENAMED, SWEEP_FAITHFUL))} ` +
    'line (the subject path), the drifted-registry arm in ' +
    `${diffLines(copyProbe(R374, SB374, R225_FAITHFUL, SWEEP_FAITHFUL), copyProbe(R374, SB374, R225_FAITHFUL, SWEEP_UNPREFIXED))} ` +
    '(the module import and the source read, which are one variable in two places), and the same ' +
    'two figures hold for `probe-round375`',
  diffLines(
    copyProbe(R374, SB374, R225_FAITHFUL, SWEEP_FAITHFUL),
    copyProbe(R374, SB374, R225_RENAMED, SWEEP_FAITHFUL),
  ) === 1 &&
    diffLines(
      copyProbe(R374, SB374, R225_FAITHFUL, SWEEP_FAITHFUL),
      copyProbe(R374, SB374, R225_FAITHFUL, SWEEP_UNPREFIXED),
    ) === 2 &&
    diffLines(
      copyProbe(R375, SB375, R225_FAITHFUL, SWEEP_FAITHFUL),
      copyProbe(R375, SB375, R225_RENAMED, SWEEP_FAITHFUL),
    ) === 1 &&
    diffLines(
      copyProbe(R375, SB375, R225_FAITHFUL, SWEEP_FAITHFUL),
      copyProbe(R375, SB375, R225_FAITHFUL, SWEEP_UNPREFIXED),
    ) === 2,
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round377', results });
