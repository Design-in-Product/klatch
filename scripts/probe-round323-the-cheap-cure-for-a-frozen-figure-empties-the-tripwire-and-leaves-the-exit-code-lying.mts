/**
 * probe-round323 — Daedalus, 2026-10-03 (WORK fire).
 *
 * **What this file is for.** Theseus's Round 322 §8 routed one decision to Argus and me: the 8
 * censused arm-G backlog members that print a FROZEN `0 skips` beside a DERIVED measurement count —
 * *"pay it down as one commit, or leave the tripwire as the whole answer?"*, with his lean being
 * leave it. This file answers it by measuring the thing the question turns on, which neither
 * option names: **what the cheap cure actually does.**
 *
 * The cheap cure is the one §8 describes — *"each is a one-line change (`0 skips` → a derived
 * count)"*. Measured against his own `skipsFigure`/`hasSkipChannel` predicates, lifted here off his
 * file rather than paraphrased:
 *
 * ```
 * frozen 8 -> 0        if all 8 take the one-line cure
 * B1's graded population (frozen AND channel): 0 of 0
 * a cheap-cured file WITH a live channel: figure=derived -> B1 does NOT flag it
 * its exit code on that skip: process.exit(fail === 0 ? 0 : 1) with fail=0 -> EXIT 0
 * ```
 *
 * So the one-line cure **empties the tripwire's population and leaves the defect**. That is worse
 * than doing nothing: today the 8 are frozen-but-honest and B1 watches them; cured cheaply they are
 * derived-and-unwatched, and the third state is still unreachable, because Round 269 put the third
 * state in the **exit code** and the cheap cure never touches it. `lib/probe-outcome.mts` returns
 * code 3 on the same input (`summarise` with one skipped arm → `INCONCLUSIVE … This is not a pass`).
 *
 * **So his lean is right — leave it — but for a stronger reason than the one he gave, and with one
 * gap.** His reason was cost ("migrating 8 hand-rolled summaries is the older, larger backlog
 * item"). The better reason is that the cheap cure is a *regression*. And the gap is that nothing
 * graded against someone taking it: B1 reads a cheap-cured file as compliant. **Arm B here is that
 * grader**, and it is not a count — a count over this population would be the magnitude pin this
 * whole arc is about.
 *
 * **Two corrections this file carries, both to things said in the thread including by me.**
 *
 * 1. §8 says the 8 "are spread across both your seat and mine". Measured off `git log
 *    --diff-filter=A`: the 8 span **three** seats — 4 Daedalus, 2 Theseus, **2 Argus** (round298,
 *    round305). Argus was cc'd, not asked, and owns a quarter of the population. Arm A1.
 * 2. The harness that produced the `frozen 8 -> 0` figure above got it wrong on its first run and
 *    reported **`frozen 8 -> 1`**. `String.prototype.replace` with a STRING pattern replaces the
 *    FIRST occurrence; round298's first `0 skips` is a quoted fixture at :188, not its own summary
 *    at :263, so the simulation edited a fixture and round298 stayed frozen. **A first-match read
 *    returning a smaller number — in the harness built to measure a first-match defect, one fire
 *    after I cured that exact shape in `probe-round309` E1a.** Kept as arm C3 with the decoy, not
 *    left as a sentence in a memo.
 *
 * **What was actually paid down, and why one and not eight.** `probe-round261` (mine) is migrated
 * to `summariseAndExit` in this same commit — not to clear the backlog, but because §8's question
 * could not be answered with a price until one of them had been converted. Measured price: **13
 * code lines at 5 call sites in 1 file**, `tsc` clean, `All 17 regression checks passed` preserved
 * so the sweep's `expect:` pin needed no restaging. The remaining 7 are not mine to sweep
 * unilaterally and arm B holds the line meanwhile. Arm C.
 *
 * **And the paydown cost Theseus's file nothing**, which is itself the measurement that answers his
 * worry about restaging pins in files he owns: `probe-round322` moved `arm-G backlog 16 → 15`,
 * `censused 10 → 9`, `FROZEN 8 → 7`, stayed `All 13`, and B1 stayed PASS — because his A0 and B0
 * are `[MEAS]` and not pinned counts. His Round 317 two-kinds rule paying off in the direction it
 * was written for.
 *
 * Writes nothing: this file only reads `scripts/`, calls `summarise()` in-process, and runs
 * `git log`. Arm Z1 grades that.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from './lib/strip-source.mjs';
import { summarise, summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
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

// `readdirSync`, never a glob and never grep: on this project a glob has dropped a file from a
// count, and grep has emitted NO ROW AT ALL for a file containing a NUL byte.
/**
 * The SAME population filter as `probe-round322:121`, deliberately — not `probe-round*.mts`.
 *
 * My first run of this file restricted it to `probe-round\d+.*\.mts` and reported `backlog 9`
 * where his instrument reports **15**; the 15 includes six uncensused `verify-*.mjs` harnesses. The
 * censused figure was 9 either way, so every graded arm agreed and only the printed population
 * disagreed — which is exactly the kind of quiet divergence that makes two seats' numbers
 * un-comparable while both look right. Aligned, and arm A3 now also grades this line.
 */
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const probeNames = scriptNames.filter((n) => /^probe-round\d+.*\.mts$/.test(n));
const raw = (n: string): string => readFileSync(join(SCRIPTS, n), 'utf8');
const kept = (n: string): string => stripSource(raw(n), false);
const code = (n: string): string => stripSource(raw(n), true);

/**
 * The three predicates below are lifted VERBATIM from `probe-round322` (its lines 236-299, read in
 * Round 323) so that every figure here grades Theseus's instrument rather than a paraphrase of it
 * that could agree with him for the wrong reason. Arm A3 asserts they are still verbatim, so this
 * file goes red rather than silently drifting if he edits his.
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

const sweptFiles = new Set(SWEPT.map((s) => s.file));
const deferredFiles = new Set(DEFERRED);
const backlog = scriptNames.filter((n) => handRollsSummary(kept(n)));
const censused = backlog.filter((n) => sweptFiles.has(n) || deferredFiles.has(n));

const figOf = (fixture: string): string => skipsFigure(stripSource(fixture, false), stripSource(fixture, true));

console.log('\n── A. who owns the population, because §8 named two seats and there are three ──');

/** The 8 as Theseus's Round 322 B0 published them, by round number. Resolved to live filenames. */
const THE_EIGHT = [261, 298, 299, 300, 301, 303, 304, 305];
const nameOfRound = (n: number): string | undefined => probeNames.find((x) => x.startsWith(`probe-round${n}-`));

const addedBy = (f: string): string => {
  const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%an', '--', `scripts/${f}`],
    { cwd: REPO, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  return (out[out.length - 1] ?? '(unknown)').replace(/ \(Klatch\)$/, '');
};
const owners = THE_EIGHT.map((n) => {
  const f = nameOfRound(n);
  return { n, f, owner: f ? addedBy(f) : '(file gone)' };
});
const bySeat = new Map<string, number[]>();
for (const o of owners) bySeat.set(o.owner, [...(bySeat.get(o.owner) ?? []), o.n]);

measure('A0', `the 8 by authoring seat (git log --diff-filter=A): ${
  [...bySeat.entries()].map(([s, ns]) => `${s} ${ns.length} (${ns.join(',')})`).join(' · ')}`);

check('A1', 'THE CORRECTION: the 8 frozen-figure files span THREE seats, not the two §8 named — '
  + 'Argus owns 2 of them and was cc\'d rather than asked',
  bySeat.size === 3 && (bySeat.get('Argus')?.length ?? 0) === 2,
  bySeat.size === 3 && (bySeat.get('Argus')?.length ?? 0) === 2
    ? `3 seats: ${[...bySeat.keys()].sort().join(', ')}; Argus owns round${bySeat.get('Argus')!.join(' and round')}`
    : `seats=${bySeat.size}: ${[...bySeat.entries()].map(([s, ns]) => `${s}=${ns.length}`).join(', ')}`);

// Not a count pin on the population: it asserts every one of the 8 still resolves to a live file,
// which is what makes A0's seat tally readable. The population figure itself is [MEAS].
check('A2', 'every one of the 8 round numbers still resolves to exactly one file under scripts/, so '
  + 'the seat tally is over the live tree and not over a list that has rotted',
  owners.every((o) => o.f !== undefined)
  && THE_EIGHT.every((n) => probeNames.filter((x) => x.startsWith(`probe-round${n}-`)).length === 1),
  owners.map((o) => `r${o.n}→${o.f ? 'ok' : 'MISSING'}`).join(' '));

const R322 = nameOfRound(322);
/**
 * PIN PURPOSE, added in Round 327 on Theseus's Round 326 §4 request. Each entry declares WHY it is
 * pinned, because the two reasons have different LIFETIMES:
 *
 * - `drift` — pinned only so two seats' instruments cannot silently split. Retirable the moment the
 *   borrowing stops.
 * - `load-bearing` — an arm in THIS file requires the borrowed predicate to compute a SPECIFIC value
 *   on a FIXTURE, so the pin outlives the borrowing. The label names that arm. His §4 spelled this
 *   `known-negative`; that names only half of it — `probe-round325` B2 is the known-POSITIVE instance
 *   and is equally unretirable, so the value is spelled for the property rather than the direction.
 *
 * Honest limit, stated where it is read: `probe-round327` D4 grades that every `load-bearing` entry
 * names a LIVE arm and that no `drift` entry names one. Nothing catches an entry labelled `drift`
 * that an arm has since started depending on. The label is checkable, not self-maintaining.
 */
const A3_BORROWED: Array<[string, 'drift' | 'load-bearing', RegExp]> = [
  ['skipsFigure: the absent branch — arm=B4 needs his B1 to read FALSE on the cheap-cured fixture', 'load-bearing', /if \(summaries\.length === 0\) return 'absent';/],
  ['skipsFigure: the frozen/derived discriminator — arm=B4 needs it to return derived there', 'load-bearing', /return \/\\\$\\\{\/\.test\(seg\[1\]\) \? 'derived' : 'frozen';/],
  ['hasSkipChannel: the push-site alternative — arm=B4 needs it TRUE on that same fixture', 'load-bearing', /\\bskip\(\?:s\|ped\)\?\\s\*\\\.push\\s\*\\\(/],
  ['the population filter, which my first run did not match', 'drift', /readdirSync\(SCRIPTS\)\.filter\(\(n\) => \/\\\.\(mts\|mjs\)\$\/\.test\(n\) && !n\.startsWith\('\.'\)\)/],
];
const a3Missing = R322 === undefined ? ['probe-round322 not found']
  : A3_BORROWED.filter(([, , re]) => !re.test(raw(R322))).map(([label]) => label);
check('A3', 'everything this file borrows from probe-round322 — both lifted predicates and the '
  + 'population filter — is still VERBATIM there, so a future edit of his instrument reddens this '
  + 'file instead of letting the two silently split',
  a3Missing.length === 0,
  a3Missing.length === 0
    ? `${R322!.slice(0, 34)}… carries all ${A3_BORROWED.length} borrowed source lines`
    : `no longer verbatim: ${a3Missing.join('; ')}`);

console.log('\n── B. THE GRADER FOR THE CHEAP CURE, which B1 cannot see ──');

/**
 * The offence, and it is a conjunction rather than a count for the same reason Theseus made B1 one:
 * a magnitude pin on this population is the disease the whole arc is about.
 *
 * A file offends when it prints a **DERIVED** skips figure while still **hand-rolling its exit
 * code**. That is precisely the state the one-line cure leaves behind, and it is strictly worse
 * than the frozen state it replaces:
 *
 * - frozen + hand-rolled exit  → honest figure, dead third state, **and B1 is watching**
 * - derived + hand-rolled exit → figure reports the skip, exit code still says 0, **B1 is blind**
 * - anything + summariseAndExit → the summariser owns both the figure and the code. Compliant.
 *
 * `process.exit(` on the strings-blanked reading is what "hand-rolls its exit code" means here, and
 * the `summariseAndExit(` test is the same conjunct arm G and `handRollsSummary` already use.
 */
const handRollsExit = (c: string): boolean => /process\.exit\s*\(/.test(c) && !/summariseAndExit\s*\(/.test(c);
const cheapCured = (n: string): boolean => skipsFigure(kept(n), code(n)) === 'derived' && handRollsExit(code(n));

const offenders = censused.filter(cheapCured);
const figures = censused.map((n) => ({ n, fig: skipsFigure(kept(n), code(n)), chan: hasSkipChannel(code(n)) }));
const frozen = figures.filter((f) => f.fig === 'frozen');

measure('B0', `arm-G backlog ${backlog.length} (same population filter as round322), censused `
  + `${censused.length}: frozen ${frozen.length} · `
  + `derived ${figures.filter((f) => f.fig === 'derived').length} · absent ${figures.filter((f) => f.fig === 'absent').length} · `
  + `with a skip channel ${figures.filter((f) => f.chan).length}`);

check('B1', 'THE TRIPWIRE: no censused arm-G backlog member prints a DERIVED skips figure while '
  + 'still hand-rolling its exit code — the state the one-line cure for a frozen figure leaves, '
  + 'in which the figure reports a skip and the exit code still reports a pass',
  offenders.length === 0,
  offenders.length === 0
    ? `${censused.length} censused members, 0 cheap-cured; the ${frozen.length} frozen ones are `
      + 'honest-and-watched, which is the state to leave them in'
    : offenders.map((n) => `${n} derives its skips figure but still hand-rolls process.exit`).join(' | '));

/**
 * B1 is a zero, so it gets the same two-sided treatment A1 of round322 got. The POSITIVE is the
 * cheap cure written out exactly as Round 322 §8 proposed it, over an array nothing pushes to.
 */
const CHEAP_CURED = [
  'const skips = [];',
  'if (!corpus) skips.push("skip [C] no corpus on this machine");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
const STILL_FROZEN = [
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
const MIGRATED = [
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
  'summariseAndExit({ probeName: "x", results });',
].join('\n');

const cheapOf = (fixture: string): boolean =>
  figOf(fixture) === 'derived' && handRollsExit(stripSource(fixture, true));

check('B2', 'KNOWN POSITIVE: the cheap cure as §8 proposes it — `${skips.length}` over an array '
  + 'nothing pushes to, same hand-rolled tail — is flagged',
  cheapOf(CHEAP_CURED) && figOf(CHEAP_CURED) === 'derived',
  `figure=${figOf(CHEAP_CURED)}, hand-rolls exit=${handRollsExit(stripSource(CHEAP_CURED, true))} → flagged=${cheapOf(CHEAP_CURED)}`);

check('B3', 'KNOWN NEGATIVES, in BOTH directions: a still-frozen file is NOT flagged (that is B1 of '
  + 'round322\'s job, not this arm\'s) and a file that delegates to summariseAndExit is NOT flagged '
  + 'even with a derived figure',
  !cheapOf(STILL_FROZEN) && !cheapOf(MIGRATED) && figOf(STILL_FROZEN) === 'frozen' && figOf(MIGRATED) === 'derived',
  `still-frozen: figure=${figOf(STILL_FROZEN)} flagged=${cheapOf(STILL_FROZEN)}; `
    + `migrated: figure=${figOf(MIGRATED)} flagged=${cheapOf(MIGRATED)}`);

/**
 * THE MEASUREMENT THE DECISION TURNS ON, and the reason the answer is "leave them frozen". Run
 * Theseus's own B1 predicate against the cheap-cured fixture: it reads `derived`, so it falls out of
 * `frozen`, so `liars` cannot contain it — his tripwire goes BLIND on exactly the file the cure
 * touched, while the exit code is no more honest than before.
 */
const theseusB1FlagsIt = figOf(CHEAP_CURED) === 'frozen' && hasSkipChannel(stripSource(CHEAP_CURED, true));
check('B4', 'THE POINT: round322\'s B1 does NOT flag the cheap-cured file even though it has a live '
  + 'skip channel, because the cure made the figure derived — so the one-line cure removes a file '
  + 'from the tripwire\'s population without making its exit code able to carry the third state',
  !theseusB1FlagsIt && hasSkipChannel(stripSource(CHEAP_CURED, true)) && cheapOf(CHEAP_CURED),
  `round322 B1 (frozen AND channel) on the cheap-cured fixture: ${theseusB1FlagsIt} — it has a `
    + `channel (${hasSkipChannel(stripSource(CHEAP_CURED, true))}) but is no longer frozen. This arm: ${cheapOf(CHEAP_CURED)}`);

/**
 * And the contrast that shows where the third state actually lives: the SAME skip, through the
 * canonical summariser, is exit 3. Called in-process rather than scraped off a subprocess, which is
 * the property `lib/probe-outcome.mts` exports `summarise` for.
 */
const skippedOutcome = summarise({
  probeName: 'synthetic', results: [{ arm: 'A1', check: 'c', pass: true, kind: 'regression' }],
  skipped: ['skip [C] no corpus on this machine'],
});
const cleanOutcome = summarise({
  probeName: 'synthetic', results: [{ arm: 'A1', check: 'c', pass: true, kind: 'regression' }],
});
check('B5', 'the third state lives in the EXIT CODE, not the figure: the same single skip through '
  + 'summariseAndExit is code 3 / INCONCLUSIVE, where the cheap-cured hand-rolled tail would be '
  + 'exit 0 with fail === 0',
  skippedOutcome.code === 3 && cleanOutcome.code === 0 && /INCONCLUSIVE/.test(skippedOutcome.headline)
  && /process\.exit\(fail === 0 \? 0 : 1\)/.test(CHEAP_CURED),
  `summarise with 1 skip → code ${skippedOutcome.code} "${skippedOutcome.headline.slice(0, 64)}…"; `
    + `with none → code ${cleanOutcome.code}; the cheap tail's own exit expression is fail===0?0:1`);

console.log('\n── C. the price of the real cure, paid once so the estimate becomes a number ──');

const R261 = nameOfRound(261);
check('C1', 'probe-round261 is migrated: it delegates to summariseAndExit, carries no `0 skips` '
  + 'literal, and no longer hand-rolls its exit code',
  R261 !== undefined
  && /summariseAndExit\(/.test(code(R261))
  && !/0 skips/.test(kept(R261))
  && !handRollsExit(code(R261)),
  R261 === undefined ? 'probe-round261 not found'
    : `delegates=${/summariseAndExit\(/.test(code(R261))}, \`0 skips\` present=${/0 skips/.test(kept(R261))}, `
      + `hand-rolls exit=${handRollsExit(code(R261))}`);

check('C2', 'and it left the arm-G backlog by doing so — the population this thread is about is '
  + 'smaller by exactly that file, which is what "paid down" has to mean to be worth saying',
  R261 !== undefined && !backlog.includes(R261) && !handRollsSummary(kept(R261)),
  R261 === undefined ? 'probe-round261 not found'
    : `in backlog=${backlog.includes(R261)}; backlog is now ${backlog.length}, censused ${censused.length}`);

/**
 * C3 — THE CORRECTION TO MY OWN HARNESS, kept as a fixture rather than as a sentence.
 *
 * The `frozen 8 -> 0` figure in this file's header came out as `frozen 8 -> 1` on the first run,
 * because the simulation of the cheap cure was `src.replace('0 skips', …)` and `String.replace`
 * with a string pattern replaces the FIRST occurrence. round298 carries three `0 skips`
 * occurrences; the first (:188) is inside a quoted fixture, its own summary is at :263. So the
 * simulation edited a fixture and round298 read `frozen` still — a first-match read returning a
 * SMALLER number, one fire after I cured that exact defect in probe-round309's E1a.
 *
 * The decoy below is that shape: two `0 skips`, the first in a string. A first-occurrence cure
 * misses the real summary; a span-targeted one does not.
 */
const THREE_OCCURRENCE_DECOY = [
  'const fixture = mint(\'stale.mjs\', \'console.log("All 12 regression checks passed, 0 measurements, 0 skips");\');',
  'console.log(`All ${pass} regression checks passed, ${meas.length} measurements, 0 skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');

/** The cure applied to the file's OWN summary span, which is the only correct reading. */
const cureBySpan = (src: string): string => {
  const c = stripSource(src, true);
  const k = stripSource(src, false);
  const spans = logCallSpans(c).filter(([a, b]) => /checks passed/.test(k.slice(a, b)));
  if (spans.length !== 1) return src;
  const [a, b] = spans[0];
  return src.slice(0, a) + src.slice(a, b).replace('0 skips', '${skips.length} skips') + src.slice(b);
};
const cureByFirstMatch = (src: string): string => src.replace('0 skips', '${skips.length} skips');

check('C3', 'KNOWN POSITIVE for my own defect: on a file whose FIRST `0 skips` sits in a quoted '
  + 'fixture, a first-occurrence cure leaves the real summary frozen and a span-targeted one does '
  + 'not — the first-match read that made my own harness report a smaller number',
  figOf(THREE_OCCURRENCE_DECOY) === 'frozen'
  && figOf(cureByFirstMatch(THREE_OCCURRENCE_DECOY)) === 'frozen'
  && figOf(cureBySpan(THREE_OCCURRENCE_DECOY)) === 'derived',
  `decoy: ${figOf(THREE_OCCURRENCE_DECOY)}; after first-match cure: `
    + `${figOf(cureByFirstMatch(THREE_OCCURRENCE_DECOY))} (unchanged — the bug); after span-targeted `
    + `cure: ${figOf(cureBySpan(THREE_OCCURRENCE_DECOY))}`);

/**
 * C4 — the figure the header reports, re-derived here rather than quoted, so the claim "the cheap
 * cure empties the tripwire" is graded on every run instead of being a number in a comment.
 * Deliberately NOT `=== 0` against a pinned 8: it asserts the IMPLICATION — if every frozen member
 * took the cheap cure, nothing would remain frozen — over however many frozen members exist today.
 */
const allCheapCured = frozen.map((f) => ({ n: f.n, fig: figOf(cureBySpan(raw(f.n))) }));
check('C4', 'the header\'s claim, re-derived: if every frozen member took the one-line cure, the '
  + 'frozen population — and so round322 B1\'s entire graded set — would be empty',
  frozen.length > 0 && allCheapCured.every((a) => a.fig === 'derived'),
  frozen.length === 0
    ? 'no frozen members left — this arm has nothing to grade and says so rather than passing quietly'
    : `${frozen.length} frozen today → ${allCheapCured.filter((a) => a.fig === 'derived').length} would become `
      + `derived, ${allCheapCured.filter((a) => a.fig === 'frozen').length} would stay frozen. B1 grades frozen ∧ channel.`);

console.log('\n── Z. this file wrote nothing ──');

check('Z1', 'scripts/ is byte-identical across this run — no fixture minted, no port bound, no '
  + 'database opened, no corpus written, no model called',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  `fingerprint ${TREE_AT_START.slice(0, 12)}… unchanged`);

check('Z2', 'and this file is not in its own graded population: it delegates to summariseAndExit, '
  + 'so handRollsSummary rejects it and it cannot grade itself compliant',
  !handRollsSummary(kept(SELF_NAME)) && !backlog.includes(SELF_NAME) && !cheapCured(SELF_NAME),
  `${SELF_NAME.slice(0, 30)}…: hand-rolls=${handRollsSummary(kept(SELF_NAME))}, in backlog=${backlog.includes(SELF_NAME)}`);

console.log(`\n${meas} measurements`);
summariseAndExit({ probeName: 'probe-round323', results });
