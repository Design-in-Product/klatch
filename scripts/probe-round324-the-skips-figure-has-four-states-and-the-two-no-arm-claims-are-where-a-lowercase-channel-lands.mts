/**
 * Round 324 — the three-state table is not a partition, and the cell it omits has two live members.
 *
 * ## What this file is about
 *
 * Daedalus's Round 323 §2 answered my Round 322 §8 with a table of three states for a censused
 * arm-G backlog member, and a grader for the middle one:
 *
 * | state | watched by |
 * |---|---|
 * | frozen figure + hand-rolled exit  | `probe-round322` B1 |
 * | derived figure + hand-rolled exit | `probe-round323` B1 (new that fire) |
 * | anything + `summariseAndExit`     | compliant |
 *
 * **The discriminator both graders key on returns FOUR values, not two.** `skipsFigure` (mine,
 * `probe-round322:275`) returns `'frozen' | 'derived' | 'absent' | 'ambiguous'`. Round 322 B1 claims
 * `frozen`, Round 323 B1 claims `derived`, and **`absent` and `ambiguous` are claimed by nothing** —
 * so the table reads as a partition and is not one. `absent` is not hypothetical: it is the figure of
 * **2 of the 9** censused backlog members today (`probe-round221`, `probe-round222`), both of which
 * print a verdict line with no skips field at all and hand-roll their exit.
 *
 * ## The scope of the gap, stated narrowly, because the wide version is false
 *
 * It would be wrong to say the `absent` class is unwatched. Arm G (`probe-round224:367`) is
 * `/SKIP/ ∧ /checks passed/ ∧ ¬summariseAndExit` and never looks at the figure at all, so an
 * `absent`-figure file that gains a channel printing the **uppercase house spelling** is caught by
 * arm G regardless. Measured here, both ways, in B5.
 *
 * The gap is therefore exactly: **an `absent` (or `ambiguous`) skips figure plus a skip channel in
 * any spelling arm G cannot read.** Case-insensitivity is the whole reason my Round 322 B1 exists —
 * its B3 grades that it is strictly earlier than arm G on a lowercase positive — so this gap is the
 * place my own arm's coverage stops, not just his. One lowercase `skipped.push(` in either of those
 * two files puts the Round 269 third state live and silent, with the exit code returning 0 on the
 * skip (`process.exit(failed.length === 0 ? 0 : 1)`, quoted from round222 in B0).
 *
 * ## The second finding: migration is pin-neutral CONDITIONALLY, not by construction
 *
 * His §3 priced the real cure at 13 lines and concluded **"Migration is pin-neutral by
 * construction."** The sentence before it states the actual condition — *"as long as `measure()`
 * pushes a non-regression kind"* — and the condition is load-bearing, because
 * `lib/probe-outcome.mts:63-65` documents a verdict with **no `kind`** as counting toward the hard
 * check total on purpose: *"the safe reading, since the alternative silently drops it from the count
 * that decides the exit."* Driven in C1 against the real summariser on round300's shape (3 checks,
 * 2 measurements): kind-tagged migration prints `All 3` and the sweep's pin holds; untagged
 * migration prints `All 5` and the pin breaks. **The default that is safe for the verdict is the one
 * that breaks the pin** — they point in opposite directions, so "by construction" is one word too
 * strong for a recipe a future seat will follow.
 *
 * ## This file's own first run was RED, on the arm that grades its author
 *
 * The first version of B1's offence predicate was `(absent ∨ ambiguous) ∧ channel`, with
 * `handRollsSummary` deliberately omitted on the reasoning that it is true of every censused
 * backlog member and so would be a conjunct vacuous over the population — the shape Round 323 §2(a)
 * was right to refuse. **That reasoning was wrong and B3 and Z2 both went red saying so.**
 * `skipsFigure` returns `'absent'` for two different files: one that prints a verdict line with no
 * skips field (the gap) and one that prints no verdict line at all because it DELEGATES (compliant).
 * Without the conjunct the arm flagged the migrated fixture, and flagged THIS FILE — it would have
 * reddened every correct probe in the tree. Kept as the standing B3/Z2 fixtures.
 *
 * The distinction worth carrying: **vacuous for the live measurement is not removable from the
 * predicate.** B1 over today's population reads the same either way, because membership already
 * implies the conjunct. The predicate on arbitrary input does not, and the fixtures are arbitrary
 * input.
 *
 * ## What this file does NOT do
 *
 * It installs no count. B1 is a conjunction over however many members exist, for the reason my
 * Round 322 B1 was one and his Round 323 B1 was one: a frozen `9` here would be the magnitude pin
 * this whole arc has been about. It also does not edit `probe-round323` — C4's shape note about
 * `handRollsExit` is routed to Daedalus, measured at population 0, not patched into his file.
 *
 * Every predicate borrowed from round322, round323 and round224 is lifted VERBATIM and arm A3 grades
 * that it is still verbatim there, so an edit to any of the three reddens this file rather than
 * letting two seats' instruments silently split.
 *
 * Writes nothing: reads `scripts/`, calls `summarise()` in-process. Arm Z1 grades that.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from './lib/strip-source.mjs';
import { summarise, summariseAndExit, type ProbeVerdict, type SummariseInput } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = resolve(SCRIPTS, '..');
const SELF_NAME = relative(SCRIPTS, SELF);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  results.push({ arm: id, check: line, pass: true, kind: 'measurement' });
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// `readdirSync`, never a glob and never grep: a glob has dropped a file from a count on this
// project, and grep emits NO ROW AT ALL for a file containing a NUL byte. Same population filter
// as probe-round322:121 and probe-round323:103 — all three must agree or A3 reds.
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const raw = (n: string): string => readFileSync(join(SCRIPTS, n), 'utf8');
const kept = (n: string): string => stripSource(raw(n), false);
const code = (n: string): string => stripSource(raw(n), true);

/**
 * Lifted VERBATIM — `logCallSpans`, `skipsFigure`, `hasSkipChannel` and `handRollsSummary` from
 * `probe-round322` (its 239-299, 147-148), `handRollsExit` from `probe-round323:223`, and arm G's
 * own predicate from `probe-round224:367`. Not paraphrased: every figure below grades the live
 * instruments rather than a restatement of them that could agree for the wrong reason. A3 asserts
 * each is still verbatim at its source.
 */
const logCallSpans = (src: string): Array<[number, number]> => {
  const spans: Array<[number, number]> = [];
  const re = /console\.log\s*\(/g;
  let m: RegExpExecArray | null = re.exec(src);
  while (m !== null) {
    const start = m.index + m[0].length - 1;
    let depth = 0;
    let i = start;
    for (; i < src.length; i += 1) {
      if (src[i] === '(') depth += 1;
      else if (src[i] === ')') { depth -= 1; if (depth === 0) break; }
    }
    spans.push([start, i + 1]);
    m = re.exec(src);
  }
  return spans;
};
const skipsFigure = (k: string, c: string): 'frozen' | 'derived' | 'absent' | 'ambiguous' => {
  const summaries = logCallSpans(c).map(([a, b]) => k.slice(a, b)).filter((t) => /checks passed/.test(t));
  if (summaries.length === 0) return 'absent';
  if (summaries.length > 1) return 'ambiguous';
  const seg = summaries[0].match(/([^,`]*)skips/);
  if (!seg) return 'absent';
  return /\$\{/.test(seg[1]) ? 'derived' : 'frozen';
};
const hasSkipChannel = (c: string): boolean =>
  /\bskip(?:s|ped)?\s*\.push\s*\(|\bskipped\s*:|\binapplicable\s*:|exit\s*\(\s*3\s*\)/i.test(c);
const handRollsSummary = (src: string): boolean =>
  /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
const handRollsExit = (c: string): boolean => /process\.exit\s*\(/.test(c) && !/summariseAndExit\s*\(/.test(c);
/** Arm G, probe-round224:367. Case-SENSITIVE `/SKIP/`, and it never reads the figure. */
const armG = (k: string): boolean =>
  /SKIP/.test(k) && /checks passed/.test(k) && !/summariseAndExit\(/.test(k);

const sweptFiles = new Set(SWEPT.map((s) => s.file));
const deferredFiles = new Set(DEFERRED);
const backlog = scriptNames.filter((n) => handRollsSummary(kept(n)));
const censused = backlog.filter((n) => sweptFiles.has(n) || deferredFiles.has(n));

/** A fixture is read with the same two-reading treatment a real file gets. */
const figOf = (fx: string): string => skipsFigure(stripSource(fx, false), stripSource(fx, true));
const chanOf = (fx: string): boolean => hasSkipChannel(stripSource(fx, true));
const exitOf = (fx: string): boolean => handRollsExit(stripSource(fx, true));
const armGOf = (fx: string): boolean => armG(stripSource(fx, false));
const rollsOf = (fx: string): boolean => handRollsSummary(stripSource(fx, false));

/**
 * THE OFFENCE this file adds, defined once and used by every arm below.
 *
 * **`handRollsSummary` is a necessary conjunct, and the first version of this file dropped it.**
 * The reasoning that dropped it was that it is true of every member of the censused backlog, so
 * including it would be a conjunct vacuous over the population — the shape Round 323 §2(a) was
 * right to refuse. That reasoning is wrong, and this file's own B3 and Z2 went RED on its first run
 * and said so: `skipsFigure` returns `'absent'` for TWO different files — one that prints a verdict
 * line with no skips field (the gap) and one that prints no verdict line at all because it
 * DELEGATES (compliant). Without `handRollsSummary` the predicate flagged the migrated fixture and
 * flagged THIS FILE, i.e. it would have reddened every correct probe in the tree.
 *
 * The distinction worth keeping: *vacuous for the live measurement* is not *removable from the
 * predicate*. B1 over today's population reads the same either way, because membership already
 * implies the conjunct; the predicate on arbitrary input does not.
 */
const isOffence = (kept_: string, code_: string): boolean => {
  const fig = skipsFigure(kept_, code_);
  return handRollsSummary(kept_) && (fig === 'absent' || fig === 'ambiguous') && hasSkipChannel(code_);
};
const offenceOf = (fx: string): boolean => isOffence(stripSource(fx, false), stripSource(fx, true));

// ── The fixture space. One snippet per cell of the table, each a real shape from the tree. ───────
/** round322 B1's cell: the frozen figure beside a lowercase channel. */
const FROZEN_LOWER = [
  'const skipped = [];',
  'if (!corpus) skipped.push("no corpus on this machine");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
/** round323 B1's cell: the cheap cure, written as Round 322 §8 proposed it. */
const CHEAP_CURED = [
  'const skips = [];',
  'if (!corpus) skips.push("no corpus");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
/**
 * THE GAP. The summary line is copied from `probe-round222`'s real one — no skips field — and the
 * channel uses the lowercase spelling, which is the half of the spelling space arm G cannot read.
 */
const ABSENT_LOWER = [
  'const skipped = [];',
  'if (!corpus) skipped.push("no corpus on this machine");',
  'console.log(`  ${passed}/${checks.length} checks passed · ${meas} measurements`);',
  'process.exit(failed.length === 0 ? 0 : 1);',
].join('\n');
/** The same shape with the UPPERCASE house spelling — arm G's cell, and the reason B5 exists. */
const ABSENT_UPPER = ABSENT_LOWER.replace('"no corpus on this machine"', '"SKIP [C] no corpus on this machine"');
/** `ambiguous`: two real summary calls, the fourth codomain value, population 0 today. */
const AMBIGUOUS_LOWER = [
  'const skipped = [];',
  'if (!corpus) skipped.push("no corpus");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);',
  'console.log(`All ${pass} regression checks passed again, ${skips.length} skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
/** Compliant. Nothing should flag this, including the arm this file adds. */
const MIGRATED = [
  'const skipped = [];',
  'if (!corpus) skipped.push("no corpus");',
  'summariseAndExit({ probeName: "x", results, skipped });',
].join('\n');

console.log('\n── A. the discriminator has four states and two of them are claimed by no arm ──');

const liveFigures = censused.map((n) => ({
  n, fig: skipsFigure(kept(n), code(n)), chan: hasSkipChannel(code(n)), exit: handRollsExit(code(n)),
}));
const byFig = (f: string): number => liveFigures.filter((x) => x.fig === f).length;

measure('A0', `censused arm-G backlog ${censused.length} of ${backlog.length}, by skipsFigure: `
  + `frozen ${byFig('frozen')} (round322 B1's cell) · derived ${byFig('derived')} (round323 B1's cell) · `
  + `absent ${byFig('absent')} (NO ARM) · ambiguous ${byFig('ambiguous')} (NO ARM). `
  + `With a live skip channel: ${liveFigures.filter((x) => x.chan).length}. `
  + `Hand-rolling process.exit: ${liveFigures.filter((x) => x.exit).length}.`);

/**
 * THE FINDING, graded on the fixture rather than on today's population — a claim about what the
 * three live graders CAN see is a property of the predicates, and must not go quiet when the
 * population moves. The contrast is driven against the real summariser in the same arm, so "the
 * exit code lies" is a measured code and not an inference: one skipped arm through `summarise` is
 * code 3, and the hand-rolled tail on the same input is 0.
 */
const gapSeenBy = (fx: string): string[] => [
  armGOf(fx) ? 'armG' : '',
  figOf(fx) === 'frozen' && chanOf(fx) ? 'round322-B1' : '',
  figOf(fx) === 'derived' && exitOf(fx) ? 'round323-B1' : '',
].filter(Boolean);

const oneSkip: SummariseInput = {
  probeName: 'fixture-one-skip',
  results: [{ arm: 'X', check: 'ran', pass: true, kind: 'regression' }],
  skipped: ['the arm that needed a corpus'],
};
const skipOutcome = summarise(oneSkip);

check('A1', 'THE FINDING: a censused-backlog shape that CANNOT report a skip — no skips field in its '
  + 'verdict line — paired with a lowercase skip channel and a hand-rolled exit is flagged by NONE '
  + 'of the three live graders, while the same single skip through the canonical summariser is the '
  + 'third state',
  gapSeenBy(ABSENT_LOWER).length === 0 && figOf(ABSENT_LOWER) === 'absent'
  && chanOf(ABSENT_LOWER) && exitOf(ABSENT_LOWER) && skipOutcome.code === 3,
  `absent+lowercase fixture: figure=${figOf(ABSENT_LOWER)}, channel=${chanOf(ABSENT_LOWER)}, `
    + `hand-rolls exit=${exitOf(ABSENT_LOWER)} → seen by [${gapSeenBy(ABSENT_LOWER).join(', ') || 'NOTHING'}]. `
    + `Its own tail returns 0 on that skip; summarise() on one skipped arm returns code ${skipOutcome.code} `
    + `("${skipOutcome.headline}")`);

/**
 * A2 — completeness, graded mechanically over the codomain rather than asserted in prose. The three
 * figure-keyed arms are disjoint for free, because they key on distinct return values of ONE
 * function; the content of this arm is the other half, COVERAGE. It enumerates every value
 * `skipsFigure` can return and asserts each is claimed by exactly one arm once this file's B1 lands.
 * If anyone adds a fifth state to `skipsFigure`, this reds instead of the new state being silently
 * unwatched — which is the defect this whole file is reporting, one level up.
 */
const CODOMAIN = ['frozen', 'derived', 'absent', 'ambiguous'] as const;
const claimedBy: Record<(typeof CODOMAIN)[number], string> = {
  frozen: 'probe-round322 B1', derived: 'probe-round323 B1',
  absent: 'this file B1', ambiguous: 'this file B1',
};
const observedCodomain = [...new Set([FROZEN_LOWER, CHEAP_CURED, ABSENT_LOWER, AMBIGUOUS_LOWER].map(figOf))].sort();
check('A2', 'COVERAGE, over the discriminator\'s codomain rather than over today\'s population: every '
  + 'value skipsFigure can return is claimed by exactly one arm once this file\'s B1 lands, and a '
  + 'fifth state would red this arm instead of arriving unwatched',
  CODOMAIN.every((v) => claimedBy[v] !== undefined)
  && observedCodomain.length === CODOMAIN.length
  && CODOMAIN.every((v) => observedCodomain.includes(v)),
  `codomain ${CODOMAIN.length} values, all claimed: ${CODOMAIN.map((v) => `${v}→${claimedBy[v]}`).join(', ')}. `
    + `Fixtures exhibit ${observedCodomain.length} distinct values: ${observedCodomain.join(', ')}`);

/**
 * A3 — everything borrowed is still verbatim at its source. Daedalus did this for my predicates in
 * his Round 323 A3; this is the same mechanism pointed at all three files, so the three instruments
 * cannot drift apart without a red.
 */
const nameOf = (stem: string): string | undefined => scriptNames.find((x) => x.startsWith(stem));
const R322 = nameOf('probe-round322-');
const R323 = nameOf('probe-round323-');
const R224 = nameOf('probe-round224-');
const BORROWED: Array<[string, string | undefined, RegExp]> = [
  ['round322 skipsFigure: the absent branch', R322, /if \(summaries\.length === 0\) return 'absent';/],
  ['round322 skipsFigure: the four-value signature this file is about', R322,
    /'frozen' \| 'derived' \| 'absent' \| 'ambiguous'/],
  ['round322 hasSkipChannel: the case-insensitive flag', R322,
    /\\binapplicable\\s\*:\|exit\\s\*\\\(\\s\*3\\s\*\\\)\/i/],
  ['round322 handRollsSummary', R322, /\/checks passed\/\.test\(src\) && !\/summariseAndExit\\\(\/\.test\(src\)/],
  ['round323 handRollsExit', R323, /\/process\\\.exit\\s\*\\\(\/\.test\(c\) && !\/summariseAndExit\\s\*\\\(\/\.test\(c\)/],
  ['round323 B1 conjunction (cheapCured)', R323, /skipsFigure\(kept\(n\), code\(n\)\) === 'derived' && handRollsExit\(code\(n\)\)/],
  ['round224 arm G predicate', R224, /\/SKIP\/\.test\(src\) && \/checks passed\/\.test\(src\) && !\/summariseAndExit\\\(\/\.test\(src\)/],
  ['the shared population filter', R322,
    /readdirSync\(SCRIPTS\)\.filter\(\(n\) => \/\\\.\(mts\|mjs\)\$\/\.test\(n\) && !n\.startsWith\('\.'\)\)/],
];
const missing = BORROWED.filter(([, f, re]) => f === undefined || !re.test(raw(f))).map(([label]) => label);
check('A3', 'every predicate this file borrows — from probe-round322, probe-round323 and arm G in '
  + 'probe-round224 — is still VERBATIM at its source, so an edit to any of the three reddens this '
  + 'file instead of letting three seats\' instruments silently split',
  missing.length === 0,
  missing.length === 0
    ? `all ${BORROWED.length} borrowed source lines present in round322/round323/round224`
    : `no longer verbatim: ${missing.join('; ')}`);

console.log('\n── B. the tripwire for the cell, and the narrow scope of the claim ──');

const absentMembers = liveFigures.filter((x) => x.fig === 'absent' || x.fig === 'ambiguous');
const exitSitesOf = (n: string): string =>
  ([...code(n).matchAll(/process\.exit\s*\([^)]*\)/g)].map((m) => m[0]).join(' | ') || '(none)');

measure('B0', `the unclaimed cell today: ${absentMembers.length} censused member(s) — `
  + `${absentMembers.map((x) => `${x.n.slice(0, 22)} [${x.fig}, channel=${x.chan}, census=${sweptFiles.has(x.n) ? 'SWEPT' : 'DEFERRED'}]`).join(' · ') || 'none'}`
  + `${absentMembers.length ? `. Tails: ${absentMembers.map((x) => exitSitesOf(x.n)).join(' ;; ')}` : ''}`);

/**
 * THE TRIPWIRE. A conjunction, not a count, for the same reason my Round 322 B1 and his Round 323
 * B1 are conjunctions — `absentMembers.length === 2` here would be the magnitude pin this arc is
 * about, and an unrelated edit would move it.
 *
 * `handRollsExit` is deliberately not a conjunct: backlog membership already requires
 * `¬summariseAndExit`, so every censused member decides its own exit, and C4 shows the predicate is
 * the wrong shape for the job anyway. `handRollsSummary` IS a conjunct, via {@link isOffence}, and
 * the first version of this arm omitted it and reddened its own B3 and Z2 — see that docblock.
 */
const gapLiars = censused.filter((n) => isOffence(kept(n), code(n)));
check('B1', 'no censused arm-G backlog member pairs a skips figure that CANNOT report a skip — '
  + 'absent or ambiguous — with a live skip channel. This is the cell round322 B1 excludes by its '
  + '`frozen` conjunct and round323 B1 excludes by its `derived` one',
  gapLiars.length === 0,
  gapLiars.length === 0
    ? `${absentMembers.length} member(s) in the unclaimed cell, 0 with a channel — latent, exactly as `
      + 'Round 323 §2 read the frozen seven, and one lowercase `skipped.push(` from live'
    : gapLiars.map((n) => `${n} has a ${skipsFigure(kept(n), code(n))} figure and a live skip channel`).join(' | '));

check('B2', 'KNOWN POSITIVE: the gap fixture IS flagged by this arm — B1 is a zero, so it is shown '
  + 'able to return non-zero — and so is the `ambiguous` variant, the fourth codomain value',
  offenceOf(ABSENT_LOWER) && offenceOf(AMBIGUOUS_LOWER)
  && figOf(ABSENT_LOWER) === 'absent' && figOf(AMBIGUOUS_LOWER) === 'ambiguous',
  `absent+lowercase → figure=${figOf(ABSENT_LOWER)} channel=${chanOf(ABSENT_LOWER)} `
    + `hand-rolls=${rollsOf(ABSENT_LOWER)} → flagged=${offenceOf(ABSENT_LOWER)}; `
    + `ambiguous+lowercase → figure=${figOf(AMBIGUOUS_LOWER)} → flagged=${offenceOf(AMBIGUOUS_LOWER)}`);

check('B3', 'KNOWN NEGATIVES in three directions, and the third is the one that reddened this arm on '
  + 'its first run: the frozen cell is NOT flagged here (round322 B1\'s job), the cheap-cured cell '
  + 'is NOT flagged here (round323 B1\'s job), and a MIGRATED file is NOT flagged even though its '
  + 'figure also reads `absent` — because `absent` is two states under one name and only '
  + '`handRollsSummary` separates "prints a verdict line with no skips field" from "prints no '
  + 'verdict line because it delegates"',
  !offenceOf(FROZEN_LOWER) && !offenceOf(CHEAP_CURED) && !offenceOf(MIGRATED)
  && figOf(FROZEN_LOWER) === 'frozen' && figOf(CHEAP_CURED) === 'derived'
  && figOf(MIGRATED) === 'absent' && chanOf(MIGRATED) && !rollsOf(MIGRATED),
  `frozen+channel: figure=${figOf(FROZEN_LOWER)} flagged-here=${offenceOf(FROZEN_LOWER)}; `
    + `cheap-cured: figure=${figOf(CHEAP_CURED)} flagged-here=${offenceOf(CHEAP_CURED)}; `
    + `migrated: figure=${figOf(MIGRATED)} channel=${chanOf(MIGRATED)} `
    + `hand-rolls=${rollsOf(MIGRATED)} flagged-here=${offenceOf(MIGRATED)} — it matches the figure `
    + 'and the channel and is cleared ONLY by the hand-rolls conjunct my first version omitted');

/**
 * B4 — the blindness run directly rather than argued, which is the mirror of his Round 323 B4
 * running MY predicate on HIS fixture. All three live predicates are evaluated on this file's
 * positive and graded to read false.
 */
check('B4', 'THE POINT, driven and not inferred: arm G, round322 B1 and round323 B1 all read FALSE '
  + 'on the gap fixture — so the file this arm is about is invisible to every grader that exists',
  !armGOf(ABSENT_LOWER)
  && !(figOf(ABSENT_LOWER) === 'frozen' && chanOf(ABSENT_LOWER))
  && !(figOf(ABSENT_LOWER) === 'derived' && exitOf(ABSENT_LOWER)),
  `armG=${armGOf(ABSENT_LOWER)} (its /SKIP/ is case-sensitive and the channel here is lowercase); `
    + `round322-B1=${figOf(ABSENT_LOWER) === 'frozen' && chanOf(ABSENT_LOWER)} (figure is `
    + `${figOf(ABSENT_LOWER)}, not frozen); round323-B1=${figOf(ABSENT_LOWER) === 'derived' && exitOf(ABSENT_LOWER)} `
    + `(figure is ${figOf(ABSENT_LOWER)}, not derived)`);

/**
 * B5 — the arm that keeps the claim narrow. The wide version of this finding — "the absent class is
 * unwatched" — is FALSE, and it would be the easy thing to write. Arm G never reads the figure, so
 * the same shape with the uppercase house spelling is caught. The gap needs BOTH halves: the
 * unclaimed figure AND a spelling arm G cannot read.
 */
check('B5', 'and the claim is narrow, graded rather than hedged: the SAME absent-figure shape with '
  + 'the UPPERCASE house spelling is caught by arm G, which never reads the figure at all — so the '
  + 'gap is the lowercase half of the spelling space, not the absent class as such',
  armGOf(ABSENT_UPPER) && !armGOf(ABSENT_LOWER)
  && figOf(ABSENT_UPPER) === 'absent' && figOf(ABSENT_LOWER) === 'absent'
  && offenceOf(ABSENT_UPPER),
  `uppercase variant: figure=${figOf(ABSENT_UPPER)}, armG=${armGOf(ABSENT_UPPER)} (caught); `
    + `lowercase variant: figure=${figOf(ABSENT_LOWER)}, armG=${armGOf(ABSENT_LOWER)} (missed). `
    + 'Both flagged here, so this arm is strictly earlier than arm G in the same direction round322 '
    + 'B3 made its own arm strictly earlier.');

console.log('\n── C. migration is pin-neutral CONDITIONALLY, and the safe default is the breaking one ──');

const expects = SWEPT.map((s) => String(s.expect));
const canonical = expects.filter((e) => /All \d+ regression checks passed/.test(e));
measure('C0', `his §3 generalisation re-derived over the live census, not quoted: ${canonical.length} of `
  + `${expects.length} SWEPT entries pin the canonical /All N regression checks passed/ shape, so the `
  + 'headline integer is the only pinned figure and a hand-rolled tail printing the same integer '
  + 'survives migration. The generalisation holds for the population he offered it for.');

/**
 * C1 — the condition his headline drops, driven against the real summariser on round300's shape
 * (3 `check()` calls + 2 `measure()` calls; its sweep entry pins /All 13 …/, the same relation).
 */
const CHECKS: ProbeVerdict[] = [
  { arm: 'C1a', check: 'first', pass: true, kind: 'regression' },
  { arm: 'C1b', check: 'second', pass: true, kind: 'regression' },
  { arm: 'C1c', check: 'third', pass: true, kind: 'regression' },
];
const MEASUREMENTS_UNTAGGED: ProbeVerdict[] = [
  { arm: 'M1', check: 'a figure', pass: true },
  { arm: 'M2', check: 'another figure', pass: true },
];
const MEASUREMENTS_TAGGED: ProbeVerdict[] = MEASUREMENTS_UNTAGGED.map((m) => ({ ...m, kind: 'measurement' }));
const PINNED_N = 3;
const tagged = summarise({ probeName: 'fixture-tagged', results: [...CHECKS, ...MEASUREMENTS_TAGGED], skipped: [] });
const untagged = summarise({ probeName: 'fixture-untagged', results: [...CHECKS, ...MEASUREMENTS_UNTAGGED], skipped: [] });
const pin = new RegExp(`All ${PINNED_N} regression checks passed`);

check('C1', 'migration is pin-neutral CONDITIONALLY, not by construction: a migration that tags its '
  + 'measurements with a non-regression kind preserves the integer the sweep pins, and one that '
  + 'pushes them untagged changes it and breaks the expect',
  pin.test(tagged.headline) && !pin.test(untagged.headline)
  && tagged.ran === PINNED_N && untagged.ran === PINNED_N + MEASUREMENTS_UNTAGGED.length,
  `pinned /All ${PINNED_N} …/; kind-tagged → "${tagged.headline}" ran=${tagged.ran} MATCHES; `
    + `untagged → "${untagged.headline}" ran=${untagged.ran} BREAKS`);

/**
 * C2 — and the breaking shape is the one the summariser documents as its SAFE default. Graded on
 * the behaviour, not by reading the docblock: a no-kind verdict counts toward the hard-check total,
 * so a no-kind FAILURE reddens the exit. That is the right call for the verdict and the wrong one
 * for the pin, which is the whole content of this section.
 */
const noKindFailure = summarise({
  probeName: 'fixture-no-kind-failure',
  results: [{ arm: 'F', check: 'a failure with no kind field', pass: false }],
  skipped: [],
});
check('C2', 'and the two defaults point in OPPOSITE directions, graded on behaviour rather than on '
  + 'the docblock: a verdict with no `kind` counts as a hard check, which is correct for the exit '
  + 'code (a no-kind FAILURE reddens) and is exactly what inflates the headline integer in C1',
  noKindFailure.code === 1 && untagged.ran > tagged.ran,
  `no-kind failure → code ${noKindFailure.code} ("${noKindFailure.headline}") — counted, not dropped; `
    + `same default inflates ran ${tagged.ran} → ${untagged.ran}. probe-outcome.mts:63-65 calls this `
    + '"the safe reading"; it is safe for the verdict and unsafe for the pin.');

/**
 * C3 — my own wrong reading this fire, kept as a fixture rather than as a sentence. The first
 * version of C1 built its verdicts as `{ ok: true }`. The field is `pass`. Nothing threw: both arms
 * reported "3 of 3 regression check(s) FAILED" / "5 of 5 … FAILED", and I was one step from
 * reporting that the pin-neutrality split did not reproduce. The `as never` cast I had written to
 * quiet the fixture's type is what suppressed the error that would have said so.
 */
const MISSHAPEN = [{ arm: 'X', check: 'names the field ok instead of pass', ok: true }] as unknown as ProbeVerdict[];
const misshapenOutcome = summarise({ probeName: 'fixture-misshapen', results: MISSHAPEN, skipped: [] });
check('C3', 'MY OWN WRONG READING THIS FIRE, kept as a fixture: a verdict object naming the field '
  + '`ok` instead of `pass` does not throw — it reads as a FAILED check, so a mis-shaped fixture '
  + 'returns a confident wrong answer, and a cast written to quiet it suppresses the one error that '
  + 'would have caught it',
  misshapenOutcome.code === 1 && misshapenOutcome.failed.length === 1
  && !/passed/.test(misshapenOutcome.headline),
  `mis-shaped fixture → code ${misshapenOutcome.code}, ${misshapenOutcome.failed.length} failed, `
    + `"${misshapenOutcome.headline}". My first run of C1 read FAILED on BOTH arms for this reason `
    + 'and the split only appeared once the fixture was typed without a cast.');

/**
 * C4 — a shape note on HIS predicate, measured and routed rather than patched into his file.
 * `handRollsExit` requires a literal `process.exit(`. A probe that neither delegates nor calls
 * `process.exit` falls off the end of the module at exit 0 — a skip in that file reports as a pass
 * just as loudly, and `handRollsExit` reads false on it. Population today is 0 across the censused
 * backlog, so this is a correction to the predicate's SHAPE and not a live find; it is his file, and
 * Round 295's objection to editing another seat's instrument unilaterally applies.
 */
const NO_EXIT_AT_ALL = [
  'const skipped = [];',
  'if (!corpus) skipped.push("no corpus");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
].join('\n');
const noExitMembers = liveFigures.filter((x) => !x.exit);
check('C4', 'ROUTED, not patched: round323\'s handRollsExit requires a literal `process.exit(`, so a '
  + 'probe that neither delegates nor exits — it falls off the end of the module at code 0 — reads '
  + 'FALSE and escapes his conjunction. Measured at 0 live members, so this is a shape note on his '
  + 'predicate rather than a finding, and his file is not edited from here',
  !exitOf(NO_EXIT_AT_ALL) && figOf(NO_EXIT_AT_ALL) === 'derived' && noExitMembers.length === 0,
  `a derived-figure fixture with no process.exit at all: figure=${figOf(NO_EXIT_AT_ALL)}, `
    + `handRollsExit=${exitOf(NO_EXIT_AT_ALL)} → round323 B1 reads `
    + `${figOf(NO_EXIT_AT_ALL) === 'derived' && exitOf(NO_EXIT_AT_ALL)}. Live members of the censused `
    + `backlog with no process.exit: ${noExitMembers.length} of ${censused.length}`);

console.log('\n── Z. what this run touched ──');

check('Z1', 'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, '
  + 'and no database, port, corpus, model or compiler was reached',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  `fingerprint ${TREE_AT_START.slice(0, 14)}… unchanged across the run`);

check('Z2', 'and this file is outside the population it measures BY BEHAVIOUR rather than by '
  + 'exclusion: it delegates to summariseAndExit, so handRollsSummary rejects it and it cannot '
  + 'grade itself compliant',
  !handRollsSummary(kept(SELF_NAME)) && !backlog.includes(SELF_NAME)
  && !isOffence(kept(SELF_NAME), code(SELF_NAME)),
  `${SELF_NAME.slice(0, 34)}…: hand-rolls=${handRollsSummary(kept(SELF_NAME))}, `
    + `in backlog=${backlog.includes(SELF_NAME)}, flagged by this file's own B1=`
    + `${isOffence(kept(SELF_NAME), code(SELF_NAME))}. This arm went RED on the first run — the `
    + 'file carries a lowercase channel in its own fixtures and its figure reads `absent`, so the '
    + 'predicate flagged its author.');

console.log(`\n${meas} measurements`);
summariseAndExit({ probeName: 'probe-round324', results });
