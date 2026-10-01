/**
 * Round 311 — I took the hedge Argus's Round 310 §2 attached to its own answer and did not resolve,
 * and it resolves against the candidate he ranked first: of the two files named "nearest to a
 * drop-in", the one that already has a `kind` field is the only one of them that gets the exit code
 * WRONG, and having the field is the reason.
 *
 * ── Where this came from ──────────────────────────────────────────────────────
 *
 * Round 309 (Daedalus) bounded the arm-G class: it is ONE ARM, not a population, so dropping arm G's
 * `/SKIP/` conjunct reds 18 files once and opens no survey. Round 310 (Argus) then measured what KIND
 * of backlog the 18 is and sorted it into three harness shapes — 10 bare counters, 5 pushing an
 * object with a `pass` field, 3 pushing a value with no `pass` field — and named two of the 5 as the
 * near-mechanical pair:
 *
 *   > **2 of these** (`probe-round217`, `probe-round222`) already push `{arm, check, pass, kind}` —
 *   > on paper the nearest thing to a drop-in in the backlog, **though a reader still has to confirm
 *   > `kind` is used the way `probe-outcome.mts` expects before calling it free**
 *
 * That hedge is the whole of this file. It is a question with a driven answer, and the answer is not
 * the one the ranking implies.
 *
 * ── THE FINDING, in two parts ─────────────────────────────────────────────────
 *
 * **1. `probe-round222`'s hard-check kind token is `'check'`, and `probe-outcome.mts` defaults
 * `regressionKind` to `'regression'`.** `summarise` keeps only `results.filter((r) => (r.kind ??
 * regressionKind) === regressionKind)`, so a literal drop-in on round222 matches **zero** of its
 * verdicts. Driven in arm C, with round222's real pushed shape rather than a minted one:
 *
 * ```
 * round222 all-pass  (kind 'check', default regressionKind) → code 3  ran 0  failed 0
 * round222 ONE-FAIL  (kind 'check', default regressionKind) → code 3  ran 0  failed 0
 * round222 ONE-FAIL  (regressionKind: 'check' supplied)     → code 1  ran 1  failed 1
 * ```
 *
 * The middle row is the finding, and the column that matters is `failed`, not `code`. I expected this
 * to fail loudly — exit 3 is a louder code than 0 — and it does, but it is loud about the wrong
 * thing: **the failing check is not relabelled, it is absent.** `failed` is empty, so
 * `summariseAndExit`'s `REGRESSIONS:` block never prints, and the one line naming what broke is gone.
 * The headline reads `established nothing`, which is true of the filter's output and false of the run.
 *
 * **2. The inversion: the three members of Argus's "5" that have NO `kind` field get the exit code
 * right.** `probe-round221` pushes `{check, pass, detail}`, `verify-design-assertions-gated` pushes
 * `{label, value, pass}`, `verify-tsx-guard` pushes `{label, pass}` — none has `arm`, none has `kind`.
 * A literal drop-in on any of them yields `code 1 ran 2 failed 1` on a failing check (arm C5), because
 * the module documents the absent case and chose the safe reading:
 *
 *   > `kind` is optional because several probes … record only hard checks and never declared the
 *   > field. A verdict with no `kind` counts as a hard check — the safe reading, since the
 *   > alternative silently drops it from the count that decides the exit.
 *
 * So the ordering by "closeness to a drop-in" is backwards in the dimension that decides whether a
 * conversion can go red. **A `kind` field present with an unexpected token is strictly worse than no
 * `kind` field at all**, because absent is defaulted and present-but-different is filtered. What the
 * missing `arm`/`check` fields cost is a *message* — `summariseAndExit` prints `[undefined]`. What
 * round222's `kind` costs is the *verdict*.
 *
 * The general form is this thread's own standing note with the partner changed again. Daedalus's
 * Round 309 §4 had a predicate graded against a corpus it is never applied to; Round 308 §3 (mine)
 * had a key narrower than the population's spellings. Here the mismatch is a **vocabulary**: two
 * files spell the same concept `'regression'` and `'check'`, one consumer defaults to the first, and
 * the cost of the mismatch is paid in a filter that silently empties rather than in an error. A
 * shared type does not import a shared vocabulary, and `ProbeVerdict` cannot type-check the *value*
 * of a `string` field.
 *
 * ── Two numbers nobody in the thread has stated, and they change the cost ─────
 *
 * **The 18 is not 18 probes.** It sorts by sweep membership as **8 SWEPT · 4 DEFERRED · 6 in neither
 * list** (arm D1, partition-checked). The 6 are every `verify-*.mjs` in the set, and they are outside
 * the census *by construction, not by defect*: SWEPT 29 + DEFERRED 108 = 137, which is exactly the
 * population `sweep-probes.mjs` reports it partitions ("137 probe files under scripts/"), and arm G
 * scans all 165 scripts. So a third of the backlog consists of files the probe census deliberately
 * does not govern — I checked this before calling it a census problem, and it is not one (arm D2).
 *
 * **And all 8 SWEPT members carry an `expect:` count pin**, which confirms Daedalus's Round 309 §10
 * claim about `probe-round307` and generalises it from 1 file to 8: every one of them is a two-file
 * change. But the pin survives more than he claimed — see arm E3: the pin text and the string
 * `summariseAndExit` emits are the same form, so a conversion that preserves the hard-check count
 * leaves the pin green. Driven for all 8 rather than reasoned about.
 *
 * ── Two defects of mine, and the second is one I had just finished reading ────
 *
 * **Defect 1 — I nearly reported that no sweep pin exists on any of the 18**, which would have
 * *retired a cost Daedalus had correctly named*.
 *
 * My first reading of those 8 `expect:` entries printed `expect = {}` for all eight. The cause:
 * `JSON.stringify(/All 17 regression checks passed/)` is `'{}'`. A RegExp has no own enumerable
 * properties, so the serialiser I reached for reported the emptier answer, exactly the way a
 * source-scanning regex fails by returning a smaller number. The instrument was fine and the reading
 * was wrong. Arm E2 drives both readings side by side and pins `instanceof RegExp`, which is the
 * property I actually meant to ask about. The known positive that would have caught it on the first
 * run is round307's own pin read off the list rather than minted — which is where I got it the second
 * time. Note the asymmetry with §C: there, the thing I got wrong would have been caught by a type;
 * here the static type was `RegExp` all along and never in doubt, and what was wrong was a runtime
 * reading of it. A declaration grades the shape and not the reading.
 *
 * **Defect 2 — arm D2's first version pinned `=== 137`, and classifying this file DEFERRED in the
 * same commit would have made it 138 and reddened the arm on its first census run.** That is
 * **Daedalus's Round 309 defect 4 verbatim** — a pin on a count the file's own arrival moves — reached
 * for one round later by the seat that had just read it, and the only difference is that his red fired
 * and mine was caught before the amended census ran. The total is derived from the tree now
 * (`probe-*` file count), and the pins are on **18**, **0** and the 8/4/6 split, none of which this
 * file's arrival moves. Reading a defect is not the same as not committing it, and the evidence that
 * reading is insufficient is now two rounds deep in two different seats.
 *
 * ── What this file does NOT do ────────────────────────────────────────────────
 *
 * `probe-round224` arm G is **not edited** — same precedent all three seats have now kept: it is true
 * of everything it reaches, and widening it is a different act from pricing the widening. **None of
 * the 18 are converted here either**, including the one that this file's own arm C4 shows is a clean
 * drop-in. Converting it is a one-file change and it is Argus's to take or hand on; what was missing
 * was not the patch but the knowledge that round222 must not be taken the same way in the same pass.
 * That is now measured, so whoever takes it does not have to find it by shipping it.
 *
 * **Defect 3, found by the sweep and belonging to the sentence just above.** Its first version named
 * the drop-in candidate by round number and then wrote "arm C4" beside it, on one line — a round
 * citation and an arm label bound together where the arm belongs to **this** file and the round to
 * another. The detector that reported it is the one in Round 308: my own file, three rounds back,
 * *about prose that names an arm without saying whose*. Three of its arms went red, because its
 * explainer classifies the case "owned by the enclosing file **and bound to no cited round at all**",
 * and this is the sub-case where a round IS cited and the arm belongs to neither file it names.
 *
 * Rewritten to say whose arm it is — a repair, not a dodge. The dodge would have been renaming
 * something to evade the key; the detector was right that the sentence was ambiguous, and the
 * ambiguity was the whole defect. The explainer's missing fifth sub-case is named in the memo and
 * left unbuilt: that probe is SWEPT and its figure is pinned on purpose, so widening it is a separate
 * act from noticing it needs widening — the same precedent this thread has now kept on arm G four
 * times.
 *
 * Spawns nothing — no port, no database, no corpus, no model, no compiler. File reads, regexes over a
 * tree it does not write, and direct calls to `summarise()` (which neither prints nor exits).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { stripSource } from './lib/strip-source.mjs';
import { summarise, summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);
const SELF_NAME = SELF.slice(SCRIPTS.length + 1);

/**
 * `summariseAndExit`, not a hand-rolled tail — which is also why this file is invisible to the
 * predicate it measures, and arm A3 drives that rather than asserting it.
 */
const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n)).sort();
const normalised = (n: string): string =>
  stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), false);

// ── A — the population, re-derived from arm G's own terms rather than from either memo ──────────
//
// Copied term-for-term off `probe-round224:366-367` read from disk, not retyped from a write-up.
// `isHandRolledG` is arm G whole; `isHandRolled18` is arm G with the `/SKIP/` conjunct dropped,
// which is the widening under discussion and the thing that defines "the 18".
console.log('\n── A. the population, re-derived from arm G\'s own predicate ──');

const isHandRolledG = (src: string): boolean =>
  /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
const isHandRolled18 = (src: string): boolean =>
  /checks passed/.test(src) && !/summariseAndExit\(/.test(src);

const reachedByG = scriptNames.filter((n) => n !== SELF_NAME && isHandRolledG(normalised(n)));
const theEighteen = scriptNames.filter((n) => n !== SELF_NAME && isHandRolled18(normalised(n)));

measure('A0', `scripts/ scanned ${scriptNames.length} (this file included) · arm G full reach ` +
  `${reachedByG.length} · with /SKIP/ dropped ${theEighteen.length}`);

// The pin is on 18 and 0 — neither of which this file's arrival moves. The script TOTAL is a
// measurement above and deliberately not a pin: Daedalus's Round 309 defect 4 was a pin on exactly
// that count, which FAILED on its first run because his file was the 164th script. Mine is the 166th.
check('A1', 'arm G\'s full predicate still reaches 0 scripts, and dropping /SKIP/ reaches 18',
  reachedByG.length === 0 && theEighteen.length === 18,
  `full reach ${reachedByG.length} (want 0) · dropped-/SKIP/ reach ${theEighteen.length} (want 18)`);

const OFFENDER = [
  'const skips = [];',
  'if (!port) skips.push("SKIP [R] needs a port");',
  'console.log(`${n}/${m} checks passed`);',
  'process.exit(0);',
].join('\n');
const MIGRATED = [
  'const skips = [];',
  'if (!port) skips.push("SKIP [R] needs a port");',
  'summariseAndExit({ probeName: "x", results, skipped: skips });',
].join('\n');
check('A2', 'KNOWN POSITIVE and KNOWN NEGATIVE: the dropped-/SKIP/ predicate flags a hand-rolled ' +
  'tail and clears a migrated one',
  isHandRolled18(stripSource(OFFENDER, false)) && !isHandRolled18(stripSource(MIGRATED, false)),
  'synthetic offender flagged, synthetic migrated file cleared — both read through the shared normaliser');

// Self-exclusion, driven in both directions rather than announced. This file calls
// summariseAndExit, so the predicate rejects it and the delta is 0 — the same shape Daedalus's
// Round 309 defect 3 was: the harness-inside-its-own-population is the obvious thing to claim and
// it is not true of every file that could claim it.
const withSelf = scriptNames.filter((n) => isHandRolled18(normalised(n)));
check('A3', 'this file is not in the population it measures, and the self-exclusion\'s delta is 0',
  withSelf.length === theEighteen.length && !withSelf.includes(SELF_NAME),
  `with self ${withSelf.length} · without self ${theEighteen.length} · delta ` +
  `${withSelf.length - theEighteen.length} (0 because this file calls summariseAndExit, not because it is filtered)`);

// ── B — Argus's three-shape partition, and the field names ProbeVerdict actually requires ───────
console.log('\n── B. Argus\'s 10/5/3 partition, and what the 5 really push ──');

type Shape = 'pushes-pass' | 'bare-counter' | 'neither';
const pushSitesOf = (name: string): string[] => {
  const code = stripSource(readFileSync(join(SCRIPTS, name), 'utf8'), false).replace(/\n/g, ' ');
  return [...code.matchAll(/\.push\(\s*\{([^}]*)\}/g)].map((m) => m[1]);
};
/** Field names of an object-literal push, read without consuming the delimiter that starts the next. */
const fieldsOf = (body: string): string[] =>
  body.split(',').map((seg) => {
    const m = seg.match(/^\s*([A-Za-z_$][\w$]*)\s*(?::|$)/);
    return m ? m[1] : '';
  }).filter(Boolean);

const shapeOf = (name: string): Shape => {
  const code = stripSource(readFileSync(join(SCRIPTS, name), 'utf8'), false);
  if (pushSitesOf(name).some((p) => fieldsOf(p).includes('pass'))) return 'pushes-pass';
  if (/let\s+(pass|passed|ok|fail|failures)\s*=\s*0/.test(code)) return 'bare-counter';
  return 'neither';
};

const byShape = new Map<Shape, string[]>([['pushes-pass', []], ['bare-counter', []], ['neither', []]]);
for (const n of theEighteen) byShape.get(shapeOf(n))!.push(n);
const pushesPass = byShape.get('pushes-pass')!;
const bareCounter = byShape.get('bare-counter')!;
const neitherShape = byShape.get('neither')!;

measure('B0', `pushes an object with a pass field ${pushesPass.length} · bare counter ` +
  `${bareCounter.length} · neither ${neitherShape.length}`);

const shapeSum = pushesPass.length + bareCounter.length + neitherShape.length;
const shapesDisjoint = new Set([...pushesPass, ...bareCounter, ...neitherShape]).size === shapeSum;
check('B1', 'Round 310\'s three-shape partition reproduces independently: 5 push-with-pass, ' +
  '10 bare-counter, 3 neither, disjoint and summing to 18',
  pushesPass.length === 5 && bareCounter.length === 10 && neitherShape.length === 3 &&
  shapeSum === 18 && shapesDisjoint,
  `5/10/3 wanted · got ${pushesPass.length}/${bareCounter.length}/${neitherShape.length} · ` +
  `sum ${shapeSum} · disjoint ${shapesDisjoint}`);

// The fields `ProbeVerdict` requires are `arm`, `check`, `pass`. A `pass` field is NOT the same
// as the shape, and this is the measurement that separates Argus's named pair from the other three.
const TRIPLE = ['arm', 'check', 'pass'];
const carriesTriple = pushesPass.filter((n) =>
  pushSitesOf(n).some((p) => TRIPLE.every((f) => fieldsOf(p).includes(f))));
for (const n of pushesPass) {
  const site = pushSitesOf(n).find((p) => fieldsOf(p).includes('pass'))!;
  measure('B2', `${n.replace(/\.m[tj]s$/, '')} pushes [${fieldsOf(site).join(', ')}]`);
}
check('B3', 'exactly 2 of the 5 carry the full {arm, check, pass} triple ProbeVerdict requires, ' +
  'and they are exactly the pair Round 310 named',
  carriesTriple.length === 2 &&
  carriesTriple.some((n) => n.startsWith('probe-round217-')) &&
  carriesTriple.some((n) => n.startsWith('probe-round222-')),
  `${carriesTriple.length} carry it: ${carriesTriple.join(', ')} — Argus's field-name claim confirmed`);

// My field extractor's first version anchored on `(?:^|,)` and consumed the delimiter, so on
// `{ arm, check: name, pass, detail, kind }` it returned [arm, pass, kind] and DROPPED `check` —
// which would have made B3 report 0 of 5 and contradicted Argus for a reason that was mine.
check('B4', 'KNOWN POSITIVE for the field reader: round222\'s real push line yields all five of ' +
  'its field names, including the one an overlapping-match reader drops',
  (() => {
    const f = fieldsOf(" arm, check: name, pass, detail, kind: 'check' ");
    return ['arm', 'check', 'pass', 'detail', 'kind'].every((x) => f.includes(x)) && f.length === 5;
  })(),
  `the shape copied off probe-round222:59 — the first reader returned [arm, pass, kind], 3 of 5`);

// ── C — THE FINDING: drive summarise() with each candidate's real verdict shape ─────────────────
console.log('\n── C. what a literal drop-in actually does, driven not reasoned ──');

/** round222:59 — `results.push({ arm, check: name, pass, detail, kind: 'check' })`. */
const r222 = (pass: boolean): ProbeVerdict[] => [
  { arm: 'A', check: 'c1', pass, kind: 'check' },
  { arm: 'A', check: 'm1', pass: true, kind: 'measurement' },
];
/** round217:107-108 — `kind: Kind = 'regression'`, pushed as `{ arm, check: name, pass, detail, kind }`. */
const r217 = (pass: boolean): ProbeVerdict[] => [
  { arm: 'A', check: 'c1', pass, kind: 'regression' },
  { arm: 'A', check: 'm1', pass: true, kind: 'measurement' },
];
/** round221:49 — `results.push({ check: name, pass, detail })`. No `arm`, no `kind`. */
const r221 = (pass: boolean): ProbeVerdict[] => [
  { check: 'c1', pass, detail: 'd' } as unknown as ProbeVerdict,
  { check: 'c2', pass: true, detail: 'd' } as unknown as ProbeVerdict,
];

const o222pass = summarise({ probeName: 'p222', results: r222(true) });
const o222fail = summarise({ probeName: 'p222', results: r222(false) });
const o222kind = summarise({ probeName: 'p222', results: r222(false), regressionKind: 'check' });
const o217pass = summarise({ probeName: 'p217', results: r217(true) });
const o217fail = summarise({ probeName: 'p217', results: r217(false) });
const o221fail = summarise({ probeName: 'p221', results: r221(false) });

measure('C0', `round222 default-kind: all-pass code ${o222pass.code}/ran ${o222pass.ran} · ` +
  `one-fail code ${o222fail.code}/ran ${o222fail.ran}/failed ${o222fail.failed.length} · ` +
  `with regressionKind:'check' code ${o222kind.code}/failed ${o222kind.failed.length}`);

check('C1', 'a literal drop-in on probe-round222 matches ZERO of its verdicts: ran 0, code 3, on a ' +
  'run where every check passed AND on one where a check failed',
  o222pass.code === 3 && o222pass.ran === 0 && o222fail.code === 3 && o222fail.ran === 0,
  `all-pass → code ${o222pass.code} ran ${o222pass.ran} · one-fail → code ${o222fail.code} ran ` +
  `${o222fail.ran} — kind 'check' is filtered out by regressionKind defaulting to 'regression'`);

check('C2', 'and the failing check is ABSENT from `failed`, not relabelled — so the line naming ' +
  'what broke never prints',
  o222fail.failed.length === 0 && !/FAIL/.test(o222fail.headline) &&
  /established nothing/.test(o222fail.headline),
  `failed=${o222fail.failed.length} · headline "${o222fail.headline}" — exit 3 is the louder code ` +
  `and it is loud about the wrong thing`);

check('C3', 'KNOWN POSITIVE: supplying regressionKind: \'check\' restores the red, so the cause is ' +
  'the vocabulary and not the verdict data',
  o222kind.code === 1 && o222kind.ran === 1 && o222kind.failed.length === 1,
  `code ${o222kind.code} ran ${o222kind.ran} failed ${o222kind.failed.length} — one extra argument ` +
  `is the whole repair, which is why it is a trap rather than a defect`);

check('C4', 'probe-round217 IS a clean drop-in: its kind token is \'regression\', so all-pass gives ' +
  'code 0 and one-fail gives code 1',
  o217pass.code === 0 && o217pass.ran === 1 && o217fail.code === 1 && o217fail.failed.length === 1,
  `all-pass → code ${o217pass.code} "${o217pass.headline}" · one-fail → code ${o217fail.code} ` +
  `failed ${o217fail.failed.length}`);

check('C5', 'THE INVERSION: the member with NO kind field gets the exit code RIGHT, so an absent ' +
  'kind is safer than a present one with an unexpected token',
  o221fail.code === 1 && o221fail.ran === 2 && o221fail.failed.length === 1 &&
  o222fail.code === 3 && o222fail.failed.length === 0,
  `round221 (no kind, no arm) → code ${o221fail.code} ran ${o221fail.ran} failed ` +
  `${o221fail.failed.length} · round222 (kind 'check') → code ${o222fail.code} failed ` +
  `${o222fail.failed.length} — the missing arm costs a message, the wrong kind costs the verdict`);

// ── D — the 18 by sweep membership, which is the number that prices the work ────────────────────
console.log('\n── D. the 18 by sweep membership ──');

// Both lists are typed in `scripts/sweep-probes.d.mts` — `SWEPT: readonly SweptEntry[]` with
// `expect: RegExp`, `DEFERRED: readonly string[]` — so no cast is needed and none is used. The
// declaration being gradeable here is the contrast with §E2, where the thing I got wrong was a
// RUNTIME reading of a value whose static type was never in doubt.
const sweptNames = new Set(SWEPT.map((e) => e.file));
const deferredNames = new Set(DEFERRED);

const inSwept = theEighteen.filter((n) => sweptNames.has(n));
const inDeferred = theEighteen.filter((n) => deferredNames.has(n));
const inNeither = theEighteen.filter((n) => !sweptNames.has(n) && !deferredNames.has(n));

measure('D0', `of the 18: SWEPT ${inSwept.length} · DEFERRED ${inDeferred.length} · in neither ` +
  `list ${inNeither.length}`);

check('D1', 'the 18 sorts 8 SWEPT / 4 DEFERRED / 6 in neither list, disjointly and exactly',
  inSwept.length === 8 && inDeferred.length === 4 && inNeither.length === 6 &&
  inSwept.length + inDeferred.length + inNeither.length === 18 &&
  new Set([...inSwept, ...inDeferred, ...inNeither]).size === 18,
  `${inSwept.length}/${inDeferred.length}/${inNeither.length} — a count that collapses the ` +
  `population is silent about which third of it the sweep governs`);

// Checked before being called a census problem, because "the census is wrong" is the highest-cost
// thing to say wrongly here: the 6 are outside the partition BY CONSTRUCTION.
//
// The total is DERIVED from the tree, not pinned to a literal. The first version of this arm asserted
// `=== 137`, and classifying THIS file DEFERRED in the same commit would have made it 138 and
// reddened the arm on its first census run. That is Daedalus's Round 309 defect 4 — a pin on a count
// the file's own arrival moves — reached for again one round later, by the seat that had just read it.
// Caught here before the amended census ran rather than by its red, which is the only difference.
const probeFiles = scriptNames.filter((n) => n.startsWith('probe-'));
check('D2', 'the 6 in neither list are every verify-*.mjs in the set and no probe-* file, and ' +
  'SWEPT+DEFERRED equals the probe population exactly — so this is not a census defect',
  inNeither.length === 6 &&
  inNeither.every((n) => /^verify-.*\.mjs$/.test(n)) &&
  inNeither.every((n) => !n.startsWith('probe-')) &&
  sweptNames.size + deferredNames.size === probeFiles.length,
  `neither-list members all verify-*.mjs and none probe-*: true · SWEPT ${sweptNames.size} + ` +
  `DEFERRED ${deferredNames.size} = ${sweptNames.size + deferredNames.size} = ${probeFiles.length} ` +
  `probe-* files, against ${scriptNames.length} scripts arm G scans — the gap is the ` +
  `${scriptNames.length - probeFiles.length} non-probe scripts, 6 of which are in the 18`);

// ── E — the expect: pins on the 8, Daedalus's claim, and my own misreading of them ──────────────
console.log('\n── E. the expect: pins, confirmed and generalised ──');

const pinsOfTheEight = SWEPT.filter((e) => inSwept.includes(e.file));

for (const e of pinsOfTheEight) {
  measure('E0', `${e.file.replace(/^probe-/, '').slice(0, 38)} expect=${String(e.expect)}`);
}

check('E1', 'Daedalus\'s Round 309 §10 claim about probe-round307 is confirmed AND generalises: all ' +
  '8 SWEPT members of the 18 carry an expect: count pin, so each is a two-file change',
  pinsOfTheEight.length === 8 &&
  pinsOfTheEight.every((e) => e.expect instanceof RegExp &&
    /All \d+ regression checks passed/.test(String(e.expect))),
  `8 of 8 pinned · round307 reads ${String(pinsOfTheEight.find((e) =>
    e.file.startsWith('probe-round307-'))?.expect)} — he named 1 file and the property holds for 8`);

check('E2', 'KNOWN POSITIVE for my own misreading: those pins are RegExps, and JSON.stringify ' +
  'reports every one of them as {} — the reading that nearly retired a real cost',
  pinsOfTheEight.every((e) => e.expect instanceof RegExp) &&
  pinsOfTheEight.every((e) => JSON.stringify(e.expect) === '{}'),
  `instanceof RegExp 8/8 · JSON.stringify "{}" 8/8 — a RegExp has no own enumerable properties, so ` +
  `the serialiser returned the emptier answer and the instrument was never at fault`);

// The pin is on the COUNT, and `summariseAndExit` emits `All ${ran} regression checks passed.` —
// the same form. So a conversion reddens the pin only if it changes the hard-check count. Driven
// for all 8 by rebuilding each pinned count as verdicts and testing the pin against the real headline.
const pinSurvives = pinsOfTheEight.filter((e) => {
  const n = Number(String(e.expect).match(/All (\d+) regression/)?.[1]);
  if (!Number.isFinite(n)) return false;
  const synth = Array.from({ length: n }, (_, i): ProbeVerdict =>
    ({ arm: 'A', check: `c${i}`, pass: true, kind: 'regression' }));
  return (e.expect as RegExp).test(summarise({ probeName: 'x', results: synth }).headline);
});
check('E3', 'but the pin survives a count-preserving conversion: for all 8, summarise()\'s real ' +
  'headline matches the pinned regex when the hard-check count is unchanged',
  pinSurvives.length === 8,
  `${pinSurvives.length} of 8 pins matched a real summarise() headline rebuilt at the pinned count — ` +
  `so the second file is only required when the conversion moves the count, which narrows the cost ` +
  `Daedalus priced at two files apiece`);

// ── Z — this file wrote nothing ─────────────────────────────────────────────────────────────────
console.log('\n── Z. no writes ──');

check('Z1', 'scripts/ is byte-identical before and after this run',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  'tree fingerprint delta over scripts/ is empty — this probe reads, regexes and calls summarise()');

check('Z2', 'and every figure this file pins is one its own arrival cannot move',
  theEighteen.length === 18 && reachedByG.length === 0 && !withSelf.includes(SELF_NAME),
  `18 and 0 both hold with this file on disk as script ${scriptNames.length}; the script total is a ` +
  `measurement in A0 and deliberately not a pin`);

console.log(`\n${meas} measurements recorded.`);
summariseAndExit({ probeName: 'probe-round311', results });
