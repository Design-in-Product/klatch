/**
 * Round 325 — the two items Theseus routed to this seat in Round 324, taken.
 *
 * ## §6, taken: exit ownership is the property, and `process.exit(` was a proxy for it
 *
 * His Round 324 C4 (`docs/mail/theseus-to-daedalus-…-your-three-state-table-is-not-a-partition-and-the-cell-it-omits-has-two-live-members-2026-10-03.md`
 * §6): my Round 323 `handRollsExit` requires a literal `process.exit(`, so a probe that neither
 * delegates **nor** calls `process.exit` reads FALSE and escapes my B1 — while a skip there reports
 * as a pass just as loudly, because the module falls off its end at code 0.
 *
 * **Driven before repairing, in a scratch harness under gitignored `.testdata/r325/`** rather than
 * inferred from Node's documented semantics: a real probe-shaped `.mts` module that pushes a skip,
 * prints `All 2 regression checks passed, 1 measurements, 1 skips`, and then simply ends, run under
 * `spawnSync(npx tsx …)` → **`status=0, signal=null`**. The figure is DERIVED, so the fixture sits
 * squarely inside my B1's population and my B1 could not see it. Arm B6 carries the figure; the
 * shipped probe spawns nothing (see "What this file does NOT do").
 *
 * The repair is `exitShape`, a three-cell **partition** over who owns the exit code:
 *
 * | cell | source shape | what the exit code can carry |
 * |---|---|---|
 * | `delegates` | `summariseAndExit(` present | 0 / 1 / 3 — the summariser owns it. Compliant. |
 * | `hand-rolled` | no delegation, a literal `process.exit(` | whatever the tail computes |
 * | `ends` | neither | **0, always** — the worst value, and unreachable by any other means |
 *
 * My Round 323 docblock (its 216-218) wrote this as THREE rows and read as complete; the third row
 * there was `anything + summariseAndExit`, so the cell `ends` had no row. That is the same defect
 * Theseus found in my Round 323 §2 table one layer over: **a table that enumerates the cases I
 * thought of reads as a partition of the cases that exist.** B5 grades this one as a partition —
 * total over the live population, every value claimed — which is the shape his Round 324 A2 asked
 * to keep, pointed at the thing my own table got wrong rather than at his.
 *
 * ## And the repair had to be ADDITIVE, which is a measured property of A3, not a preference
 *
 * His §6 asked: "your call whether it's worth the conjunct." It is — but **not by editing the
 * conjunct**, because his own Round 324 A3 pins `handRollsExit` and my `cheapCured` conjunction
 * VERBATIM at `probe-round323:223-224`. Repairing them in place reddens HIS file, and clearing that
 * red means editing his file to restage the pin — which Round 295's objection forbids from this
 * seat. **Arm B7 drives it** rather than arguing it: his A3 regex, lifted verbatim, is applied to
 * my round323 source with the widening substitution applied in memory, and it no longer matches.
 *
 * So round323's narrow `handRollsExit` stays exactly where it is and **earns a second job**: it is
 * the known-negative discriminator in B3, which requires the narrow form to read FALSE on the
 * fixture the widened form flags. A future seat who "simplifies" the widening back to a literal
 * token search reds B3 by construction.
 *
 * The general property, which is worth more than this instance: **a verbatim cross-file pin converts
 * a one-line repair into a two-seat operation.** It is the right trade — the pin exists so three
 * seats' instruments cannot silently split, and it worked — but it means repairs to pinned lines
 * must be additive or coordinated, never in-place from one seat.
 *
 * ## §5/§3, taken: "pin-neutral by construction" was one word too strong, and the tempting repair
 * ## for the inflated pin is worse than the inflation
 *
 * His §5 is right and the condition is load-bearing: `summarise` counts `(r.kind ?? regressionKind)`
 * as a hard check (`lib/probe-outcome.mts:149`), so a migration whose `measure()` pushes untagged
 * verdicts turns `All 3` into `All 5` and breaks the sweep's `expect:` pin. C1 re-derives his figure.
 *
 * **What this file adds is the next step, which is where the damage actually lands.** A seat who
 * hits that red has a one-character repair available: restage the pin to `All 5`. I am the seat with
 * the documented habit — Round 321 §5 restaged two count pins (70→72, 15→17) in one fire. Restaging
 * here is not bookkeeping. It accepts the inflated population, and the two measurements are now
 * **hard checks**: a failing measurement returns code **1** with the headline `1 of 5 regression
 * check(s) FAILED`, where in the tagged shape the identical failure leaves code **0** and cannot
 * redden the probe. **C2 drives both halves off one input set.** The red sweep is loud; the contract
 * change that clears it is silent.
 *
 * C3 grades the asymmetry at its source: ONE default (`?? regressionKind`) is simultaneously **safe
 * for the verdict** — a no-kind failure is not silently dropped, which is exactly what the module's
 * own docblock calls "the safe reading" — and **unsafe for the pin**, because the same default
 * inflates `ran`. The recipe therefore cannot be derived from the module's stated rationale, which
 * is why "by construction" was wrong. C4 grades that the step is now written where it is read:
 * `lib/probe-outcome.mts` carries a declared `PIN-NEUTRALITY` note, the same device as the
 * `INAPPLICABLE-CALLERS` list in that file which `probe-round224` arm E already reads.
 *
 * ## What this file does NOT do
 *
 * It installs no count. B1 is a conjunction over however many members exist — a frozen magnitude
 * over this population is the disease the whole arc is about (Round 322 §8 → 323 §2 → 324 §3).
 *
 * It does not edit `probe-round322`, `probe-round323` or `probe-round324`. The widened predicate
 * lives here; the narrow one stays there, pinned and now load-bearing.
 *
 * **It spawns nothing.** No port, no database, no corpus, no model, no compiler, no subprocess —
 * deliberately, including for B6: a `spawnSync(process.execPath, …)` site would be an *unresolvable*
 * spawn target to `promote-probes.mts`'s `spawnScan`, which voids a file's exemptions. The one claim
 * that genuinely needs a child process (what a module returns when it ends) was driven once in the
 * scratch harness and is carried as a `[MEAS]`, not asserted as a check. Everything else is file
 * reads, regexes over a tree this file does not write, and in-process `summarise()` calls. Z1 is a
 * before/after `scripts/` fingerprint.
 *
 * Every predicate borrowed from round322, round323 and round324 is lifted VERBATIM and A1 grades
 * that it is still verbatim at its source, so an edit to any of the three reds this file rather than
 * letting four seats' instruments split.
 */
import { readFileSync, readdirSync } from 'node:fs';
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

// `readdirSync`, never a glob and never grep — a glob has dropped a file from a count on this
// project and grep emits NO ROW AT ALL for a file containing a NUL byte. Same population filter as
// probe-round322:121, probe-round323:103 and probe-round324:108; all four must agree or A1 reds.
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const raw = (n: string): string => readFileSync(join(SCRIPTS, n), 'utf8');
const kept = (n: string): string => stripSource(raw(n), false);
const code = (n: string): string => stripSource(raw(n), true);

/**
 * Lifted VERBATIM — `logCallSpans`, `skipsFigure`, `hasSkipChannel`, `handRollsSummary` from
 * `probe-round322`; `handRollsExit` from `probe-round323:223`, which this file does NOT widen in
 * place and instead keeps as B3's discriminator. A1 asserts each is still verbatim at its source.
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
/** round323:223, the NARROW form. Kept verbatim on purpose — B3 requires it to read false. */
const handRollsExit = (c: string): boolean => /process\.exit\s*\(/.test(c) && !/summariseAndExit\s*\(/.test(c);

/**
 * THE REPAIR. A total function onto three cells, so the case I did not think of cannot be the case
 * with no row. `delegates` is tested FIRST and wins: `lib/probe-outcome.mts` itself contains both
 * spellings, and the original predicate's `&& !summariseAndExit` had the same precedence.
 */
const exitShape = (c: string): 'delegates' | 'hand-rolled' | 'ends' => {
  if (/summariseAndExit\s*\(/.test(c)) return 'delegates';
  if (/process\.exit\s*\(/.test(c)) return 'hand-rolled';
  return 'ends';
};
const ownsItsExit = (c: string): boolean => exitShape(c) !== 'delegates';

const sweptFiles = new Set(SWEPT.map((s) => s.file));
const deferredFiles = new Set(DEFERRED);
const backlog = scriptNames.filter((n) => handRollsSummary(kept(n)));
const censused = backlog.filter((n) => sweptFiles.has(n) || deferredFiles.has(n));

/** Fixtures get the same two-reading treatment a real file gets. */
const figOf = (fx: string): string => skipsFigure(stripSource(fx, false), stripSource(fx, true));
const chanOf = (fx: string): boolean => hasSkipChannel(stripSource(fx, true));
const shapeOf = (fx: string): string => exitShape(stripSource(fx, true));
const narrowOf = (fx: string): boolean => handRollsExit(stripSource(fx, true));
const rollsOf = (fx: string): boolean => handRollsSummary(stripSource(fx, false));

/**
 * The offence, widened from round323's `derived && handRollsExit`.
 *
 * `handRollsSummary` is kept as a conjunct for the reason Theseus's Round 324 §4 paid for in two
 * red arms: it is true of every member of the live censused population, so it is *vacuous for the
 * measurement* — and NOT removable from the predicate, because fixtures are arbitrary input and
 * without it a delegating file with a derived figure is flagged. His lesson arrived exactly one
 * round before the repair that would otherwise have tempted me to drop it as dead weight.
 */
const isOffence = (kept_: string, code_: string): boolean =>
  handRollsSummary(kept_) && skipsFigure(kept_, code_) === 'derived' && ownsItsExit(code_);
const offenceOf = (fx: string): boolean => isOffence(stripSource(fx, false), stripSource(fx, true));

// ── The fixture space. One per cell, each a real shape from the tree. ─────────────────────────────
/** round323 B2's fixture, verbatim: the cheap cure as Round 322 §8 proposed it. */
const CHEAP_CURED = [
  'const skips = [];',
  'if (!corpus) skips.push("skip [C] no corpus on this machine");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
/** THE NEW CELL — his §6 shape. Derived figure, live skip, and no exit call of any kind. */
const ENDS_AT_ZERO = [
  'const skips = [];',
  'if (!corpus) skips.push("skip [C] no corpus on this machine");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
].join('\n');
/** round322 B1's cell, verbatim: the frozen figure beside a lowercase channel. Not mine to flag. */
const STILL_FROZEN = [
  'const skipped = [];',
  'if (!corpus) skipped.push("no corpus on this machine");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);',
  'process.exit(fail === 0 ? 0 : 1);',
].join('\n');
/** Compliant: the summariser owns both the figure and the code. */
const MIGRATED = [
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
  'summariseAndExit({ probeName: "x", results });',
].join('\n');

console.log('\n── A. the borrowed instruments, and the population they read ──');

const nameOf = (stem: string): string | undefined => scriptNames.find((x) => x.startsWith(stem));
const R322 = nameOf('probe-round322-');
const R323 = nameOf('probe-round323-');
const R324 = nameOf('probe-round324-');

const BORROWED: Array<[string, string | undefined, RegExp]> = [
  ['round322 skipsFigure: the absent branch', R322, /if \(summaries\.length === 0\) return 'absent';/],
  ['round322 skipsFigure: the four-value signature', R322, /'frozen' \| 'derived' \| 'absent' \| 'ambiguous'/],
  ['round322 handRollsSummary', R322, /\/checks passed\/\.test\(src\) && !\/summariseAndExit\\\(\/\.test\(src\)/],
  ['round323 handRollsExit, THE NARROW FORM B3 needs to read false', R323,
    /\/process\\\.exit\\s\*\\\(\/\.test\(c\) && !\/summariseAndExit\\s\*\\\(\/\.test\(c\)/],
  ['round324 B1 offence: the absent-or-ambiguous cell', R324,
    /\(fig === 'absent' \|\| fig === 'ambiguous'\) && hasSkipChannel\(code_\)/],
  ['the shared population filter', R322,
    /readdirSync\(SCRIPTS\)\.filter\(\(n\) => \/\\\.\(mts\|mjs\)\$\/\.test\(n\) && !n\.startsWith\('\.'\)\)/],
];
const missing = BORROWED.filter(([, f, re]) => f === undefined || !re.test(raw(f))).map(([label]) => label);
check('A1', 'every predicate this file borrows — from probe-round322, probe-round323 and '
  + 'probe-round324 — is still VERBATIM at its source, so an edit to any of the three reddens this '
  + 'file instead of letting four seats\' instruments silently split',
  missing.length === 0,
  missing.length === 0
    ? `all ${BORROWED.length} borrowed source lines present in round322/round323/round324`
    : `no longer verbatim: ${missing.join('; ')}`);

const live = censused.map((n) => ({
  n, fig: skipsFigure(kept(n), code(n)), shape: exitShape(code(n)), chan: hasSkipChannel(code(n)),
}));
const byShape = (s: string): number => live.filter((x) => x.shape === s).length;
const byFig = (f: string): number => live.filter((x) => x.fig === f).length;

measure('A0', `arm-G backlog ${backlog.length}, censused ${censused.length}. By skips figure: `
  + `frozen ${byFig('frozen')} · derived ${byFig('derived')} · absent ${byFig('absent')} · `
  + `ambiguous ${byFig('ambiguous')}. By exit shape: delegates ${byShape('delegates')} · `
  + `hand-rolled ${byShape('hand-rolled')} · ends ${byShape('ends')}`);

measure('A2', 'his §6 population figure, re-derived from this seat rather than quoted: censused '
  + `backlog members with NO process.exit of any kind = ${byShape('ends')} of ${censused.length}`);

console.log('\n── B. the repair: who owns the exit code, as a partition rather than a list ──');

const offenders = live.filter((x) => isOffence(kept(x.n), code(x.n)));
check('B1', 'THE TRIPWIRE, widened: no censused arm-G backlog member prints a DERIVED skips figure '
  + 'while OWNING ITS OWN EXIT CODE — whether by hand-rolling process.exit or by ending without one, '
  + 'because a module that ends returns 0 and a skip there reports as a pass',
  offenders.length === 0,
  offenders.length === 0
    ? `${censused.length} censused members, 0 offenders. By shape: hand-rolled ${byShape('hand-rolled')}, `
      + `ends ${byShape('ends')}, delegates ${byShape('delegates')}`
    : offenders.map((x) => `${x.n} figure=${x.fig} exit=${x.shape}`).join(' | '));

check('B2', 'KNOWN POSITIVE, inherited: the cheap cure as Round 322 §8 proposed it — the fixture '
  + 'round323 B2 uses, verbatim — is still flagged, so this is a WIDENING of that tripwire and not a '
  + 'replacement that quietly drops its original cell',
  offenceOf(CHEAP_CURED) && figOf(CHEAP_CURED) === 'derived' && shapeOf(CHEAP_CURED) === 'hand-rolled',
  `figure=${figOf(CHEAP_CURED)}, exit shape=${shapeOf(CHEAP_CURED)} → flagged=${offenceOf(CHEAP_CURED)}`);

check('B3', 'KNOWN POSITIVE, NEW — his §6 cell, and the narrow form is the discriminator: a derived '
  + 'figure with a live skip and NO process.exit at all is flagged here, and round323\'s '
  + 'handRollsExit (lifted verbatim above) reads FALSE on the same fixture. A future seat who '
  + '"simplifies" this back to a literal token search reds this arm by construction',
  offenceOf(ENDS_AT_ZERO) && shapeOf(ENDS_AT_ZERO) === 'ends' && !narrowOf(ENDS_AT_ZERO)
  && figOf(ENDS_AT_ZERO) === 'derived' && chanOf(ENDS_AT_ZERO),
  `figure=${figOf(ENDS_AT_ZERO)}, exit shape=${shapeOf(ENDS_AT_ZERO)}, channel=${chanOf(ENDS_AT_ZERO)} → `
    + `this file flags it=${offenceOf(ENDS_AT_ZERO)}; round323's narrow handRollsExit reads `
    + `${narrowOf(ENDS_AT_ZERO)}, so his B1 reads ${figOf(ENDS_AT_ZERO) === 'derived' && narrowOf(ENDS_AT_ZERO)}`);

check('B4', 'KNOWN NEGATIVES in BOTH directions: a still-frozen file is NOT flagged (that is '
  + 'round322 B1\'s cell, and the arms must not overlap) and a delegating file is NOT flagged even '
  + 'with a derived figure — which is what handRollsSummary buys, per his §4',
  !offenceOf(STILL_FROZEN) && !offenceOf(MIGRATED)
  && figOf(STILL_FROZEN) === 'frozen' && figOf(MIGRATED) === 'derived' && shapeOf(MIGRATED) === 'delegates',
  `still-frozen: figure=${figOf(STILL_FROZEN)} flagged=${offenceOf(STILL_FROZEN)}; `
    + `migrated: figure=${figOf(MIGRATED)} shape=${shapeOf(MIGRATED)} hand-rolls-summary=`
    + `${rollsOf(MIGRATED)} flagged=${offenceOf(MIGRATED)}`);

/**
 * B5 — coverage over the CODOMAIN, not over the population. His Round 324 A2 is the shape he asked
 * to keep, and this is it pointed at the table my Round 323 docblock got wrong: three rows that read
 * as a partition while the cell `ends` had no row at all.
 */
const SHAPES = ['delegates', 'hand-rolled', 'ends'] as const;
const CLAIMED_BY: Record<string, string> = {
  delegates: 'compliant — not an offence by construction (B4)',
  'hand-rolled': 'B1 via B2, inherited from round323',
  ends: 'B1 via B3, the cell round323\'s table omitted',
};
const shapeFixtures = [CHEAP_CURED, ENDS_AT_ZERO, MIGRATED, STILL_FROZEN];
const observedShapes = [...new Set(shapeFixtures.map(shapeOf))].sort();
const totalOverPopulation = live.every((x) => (SHAPES as readonly string[]).includes(x.shape));
check('B5', 'exitShape is a PARTITION, graded as one: it is total over the live censused population, '
  + 'every one of its values is claimed by a named arm, and the fixtures exhibit every value — so a '
  + 'fourth exit shape reds THIS arm instead of arriving in a cell no row covers',
  totalOverPopulation
  && SHAPES.every((s) => CLAIMED_BY[s] !== undefined)
  && observedShapes.length === SHAPES.length
  && SHAPES.every((s) => observedShapes.includes(s)),
  `${live.length} live members all land in one of ${SHAPES.length} cells, but all ${byShape('hand-rolled')} `
    + 'of them in the SAME cell — so the population half of this arm is weak and the codomain half is '
    + `the load-bearing one. Claims: ${SHAPES.map((s) => `${s} → ${CLAIMED_BY[s]}`).join(' · ')}. `
    + `Fixtures exhibit ${observedShapes.length} of ${SHAPES.length}: ${observedShapes.join(', ')}`);

measure('B6', 'DRIVEN, not inferred, in a scratch harness under gitignored .testdata/r325/ because '
  + 'a spawn site here would be an unresolvable target to promote-probes\' spawnScan: a probe-shaped '
  + '.mts that pushes a skip, prints `All 2 regression checks passed, 1 measurements, 1 skips` and '
  + 'then ends, run under spawnSync(npx tsx …) → status=0, signal=null. The cell `ends` reports a '
  + 'skipped run as a pass, and 0 is the only value it can return');

/**
 * B7 — why the repair is additive, driven rather than argued.
 *
 * His Round 324 A3 pins round323's `handRollsExit` and `cheapCured` conjunction verbatim. Apply the
 * widening to my own source IN MEMORY — no file is written, Z1 grades that — and run his pinning
 * regex, lifted verbatim from `probe-round324:314`, against the result.
 */
const HIS_A3_PIN = /\/process\\\.exit\\s\*\\\(\/\.test\(c\) && !\/summariseAndExit\\s\*\\\(\/\.test\(c\)/;
const r323Src = R323 === undefined ? '' : raw(R323);
const widenedInMemory = r323Src.replace(
  'const handRollsExit = (c: string): boolean => /process\\.exit\\s*\\(/.test(c) && !/summariseAndExit\\s*\\(/.test(c);',
  'const handRollsExit = (c: string): boolean => !/summariseAndExit\\s*\\(/.test(c);',
);
check('B7', 'the repair had to be ADDITIVE and that is a measured property, not a preference: '
  + 'widening round323\'s handRollsExit IN PLACE makes probe-round324 A3\'s verbatim pin stop '
  + 'matching, so his file reds and clearing it means editing his file from this seat — which Round '
  + '295\'s objection forbids. A verbatim cross-file pin makes a one-line repair a two-seat operation',
  R323 !== undefined
  && HIS_A3_PIN.test(r323Src)
  && widenedInMemory !== r323Src
  && !HIS_A3_PIN.test(widenedInMemory),
  R323 === undefined ? 'probe-round323 not found'
    : `his A3 pin matches round323 today=${HIS_A3_PIN.test(r323Src)}; the in-memory widening changed `
      + `the source=${widenedInMemory !== r323Src}; his pin then matches=${HIS_A3_PIN.test(widenedInMemory)}`);

console.log('\n── C. the kind-tagging condition, and the one-character repair that is worse ──');

/** 3 hard checks + 2 measurements, tagged and untagged. Round 300's shape, his §5 fixture. */
const THREE_CHECKS: ProbeVerdict[] = [
  { arm: 'A', check: 'a', pass: true, kind: 'regression' },
  { arm: 'B', check: 'b', pass: true, kind: 'regression' },
  { arm: 'C', check: 'c', pass: true, kind: 'regression' },
];
const taggedMeas: ProbeVerdict[] = [
  { arm: 'M1', check: 'm', pass: true, kind: 'measurement' },
  { arm: 'M2', check: 'm', pass: true, kind: 'measurement' },
];
const untaggedMeas: ProbeVerdict[] = [{ arm: 'M1', check: 'm', pass: true }, { arm: 'M2', check: 'm', pass: true }];

const tagged = summarise({ probeName: 'migrated', results: [...THREE_CHECKS, ...taggedMeas] });
const untagged = summarise({ probeName: 'migrated', results: [...THREE_CHECKS, ...untaggedMeas] });

/**
 * C0, and the CORRECTION it carries. A verdict kind is `kind: 'regression'` or `kind: 'measurement'`
 * — the two spellings `summarise` discriminates on — read on the strings-KEPT source, because
 * blanking strings erases the only thing that tells a verdict kind from a homonym.
 *
 * My first predicate here was the loose `/kind\s*:/` on the blanked reading, and it read **1 of 7**
 * against Theseus's §5 figure of none. His figure is right. The extra hit is `probe-round300:104`,
 * `type Site = { file: string; line: number; kind: 'literal' | 'opaque' | 'invisible' }` — a site classification with no
 * relation to a probe verdict. **Seventh instance of my own standing class (a source-scanning
 * predicate measuring something other than what its name says) and the FIRST that fails by
 * returning a LARGER number** — every prior instance returned a smaller one, so "fails low" was
 * itself too narrow a statement of the rule. C5 keeps the homonym as a fixture.
 */
const VERDICT_KIND = /kind\s*:\s*['"](?:regression|measurement)['"]/;
const LOOSE_KIND = /kind\s*:/;
const frozenSeven = censused.filter((n) => skipsFigure(kept(n), code(n)) === 'frozen');
const withVerdictKind = frozenSeven.filter((n) => VERDICT_KIND.test(kept(n)));
const withLooseKind = frozenSeven.filter((n) => LOOSE_KIND.test(code(n)));
measure('C0', `the files a future migration would touch: ${frozenSeven.length} censused members with `
  + `a frozen skips figure, of which ${withVerdictKind.length} declare a VERDICT kind today — so `
  + 'every one of them is a migration that has to add the tagging deliberately. His §5 figure of '
  + `none is confirmed. The loose /kind\\s*:/ my first predicate used reads ${withLooseKind.length}`
  + `${withLooseKind.length ? ` (${withLooseKind.map((n) => n.slice(11, 20)).join(', ')}, a type's own unrelated field)` : ''}`);

/** `probe-round300:104`, copied from the file rather than paraphrased — the real over-reported line. */
const SITE_HOMONYM = 'type Site = { file: string; line: number; kind: \'literal\' | \'opaque\' | \'invisible\' };';
const REAL_TAG = 'results.push({ arm: id, check: line, pass: true, kind: \'measurement\' });';
check('C5', 'THE CORRECTION, as a fixture: the discriminator between a verdict kind and a homonym is '
  + 'the kind VALUE on the strings-kept reading. probe-round300\'s `type Site = { … kind: … }` is '
  + 'rejected and a real measurement tag is accepted, where the loose /kind:/ my first C0 used '
  + 'accepts both — so this over-report cannot return silently',
  !VERDICT_KIND.test(SITE_HOMONYM) && VERDICT_KIND.test(REAL_TAG)
  && LOOSE_KIND.test(SITE_HOMONYM) && LOOSE_KIND.test(REAL_TAG),
  `verdict-kind predicate: homonym=${VERDICT_KIND.test(SITE_HOMONYM)} real tag=${VERDICT_KIND.test(REAL_TAG)}; `
    + `loose predicate: homonym=${LOOSE_KIND.test(SITE_HOMONYM)} real tag=${LOOSE_KIND.test(REAL_TAG)} — `
    + 'it is the loose one that cannot tell them apart');

check('C1', 'HIS §5, re-derived in-process rather than quoted: the headline integer the sweep pins '
  + 'counts untagged verdicts, so a migration that leaves its measurements untagged turns `All 3` '
  + 'into `All 5` and breaks the pin. "Pin-neutral by construction" was one word too strong',
  tagged.ran === 3 && untagged.ran === 5
  && /All 3 regression checks passed/.test(tagged.headline)
  && /All 5 regression checks passed/.test(untagged.headline),
  `3 checks + 2 measurements: tagged → ran=${tagged.ran} "${tagged.headline}" · `
    + `untagged → ran=${untagged.ran} "${untagged.headline}"`);

const taggedFail = summarise({
  probeName: 'migrated',
  results: [...THREE_CHECKS, { arm: 'M1', check: 'm', pass: false, kind: 'measurement' }],
});
const restagedFail = summarise({
  probeName: 'migrated',
  results: [...THREE_CHECKS, { arm: 'M1', check: 'm', pass: false }],
});
check('C2', 'THE STEP HIS §5 ROUTES TO, and it is where the damage lands: the one-character repair '
  + 'for the inflated pin is to RESTAGE it to All 5 — a habit this seat has (Round 321 §5 restaged '
  + 'two) — and doing so accepts the inflated population, promoting the measurements to HARD CHECKS. '
  + 'The identical failing measurement then returns code 1 instead of leaving the probe green. The '
  + 'red sweep is loud; the contract change that clears it is silent',
  taggedFail.code === 0 && restagedFail.code === 1
  && taggedFail.ran === 3 && restagedFail.ran === 4
  && /1 of 4 regression check\(s\) FAILED/.test(restagedFail.headline),
  `the same failing measurement, tagged → code ${taggedFail.code} ran=${taggedFail.ran} `
    + `"${taggedFail.headline}"; untagged → code ${restagedFail.code} ran=${restagedFail.ran} `
    + `"${restagedFail.headline}"`);

check('C3', 'and the asymmetry comes from ONE default, which is why the recipe cannot be derived '
  + 'from the module\'s own rationale: `(r.kind ?? regressionKind)` is SAFE for the verdict — a '
  + 'no-kind failure is counted rather than silently dropped, exactly as probe-outcome.mts\'s '
  + 'docblock claims — and UNSAFE for the pin, because the same default inflates `ran`. The two '
  + 'defaults point in opposite directions and both effects fall out of one expression',
  restagedFail.code === 1 && restagedFail.failed.length === 1
  && untagged.ran > tagged.ran && untagged.code === 0
  && /r\.kind \?\? regressionKind/.test(readFileSync(join(SCRIPTS, 'lib', 'probe-outcome.mts'), 'utf8')),
  `safe for the verdict: the untagged failure is reported (code ${restagedFail.code}, `
    + `${restagedFail.failed.length} failed, not dropped). Unsafe for the pin: ran ${tagged.ran} → `
    + `${untagged.ran} on the same five verdicts, headline still "passed" (code ${untagged.code})`);

/**
 * C4 — the recipe step, written where a migrator reads rather than only in a memo. Same device as
 * the `INAPPLICABLE-CALLERS` list in that file, which `probe-round224` arm E already reads from
 * source. The marker is held once and split so this file cannot become a decoy for the finder —
 * Round 321 E1a's discipline.
 */
const C4_MARK = `PIN-${'NEUTRALITY'}:`;
const outcomeSrc = readFileSync(join(SCRIPTS, 'lib', 'probe-outcome.mts'), 'utf8');
check('C4', 'the step is now stated where it is read: lib/probe-outcome.mts carries a declared '
  + 'PIN-NEUTRALITY note next to the default that causes the inflation, so a future migrator meets '
  + 'the condition at the point of use rather than in a Round 323 memo that claimed it was free',
  outcomeSrc.includes(C4_MARK) && /non-regression kind/.test(outcomeSrc),
  `marker present in lib/probe-outcome.mts: ${outcomeSrc.includes(C4_MARK)}; it names the remedy `
    + `("non-regression kind"): ${/non-regression kind/.test(outcomeSrc)}`);

console.log('\n── Z. what this run touched ──');

check('Z1', 'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, '
  + 'and no subprocess, port, database, corpus, model or compiler was reached — B7\'s widening was '
  + 'applied to a string in memory, never to his file',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  `fingerprint ${TREE_AT_START.slice(0, 14)}… unchanged across the run`);

check('Z2', 'and this file is outside the population it measures BY BEHAVIOUR rather than by name: '
  + 'it delegates to summariseAndExit, so handRollsSummary rejects it, its exit shape is `delegates`, '
  + 'and its own widened B1 does not flag it',
  !handRollsSummary(kept(SELF_NAME)) && !backlog.includes(SELF_NAME)
  && exitShape(code(SELF_NAME)) === 'delegates'
  && !isOffence(kept(SELF_NAME), code(SELF_NAME)),
  `${SELF_NAME.slice(0, 34)}…: hand-rolls-summary=${handRollsSummary(kept(SELF_NAME))}, `
    + `in backlog=${backlog.includes(SELF_NAME)}, exit shape=${exitShape(code(SELF_NAME))}, `
    + `flagged by its own B1=${isOffence(kept(SELF_NAME), code(SELF_NAME))}`);

const siblings = [R322, R323, R324].filter((x): x is string => x !== undefined);
check('Z3', 'and neither does it flag the three instruments it borrows from — the widening does not '
  + 'reach back and redden round322, round323 or round324, all three of which delegate',
  siblings.length === 3 && siblings.every((n) => exitShape(code(n)) === 'delegates')
  && siblings.every((n) => !isOffence(kept(n), code(n))),
  siblings.map((n) => `${n.slice(0, 16)}… shape=${exitShape(code(n))} flagged=${isOffence(kept(n), code(n))}`).join(' | '));

console.log(`\n${meas} measurements`);
summariseAndExit({ probeName: 'probe-round325', results });
