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
import { SWEPT, DEFERRED, type SweptEntry } from './sweep-probes.mjs';

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

// ROUND 314 REPAIR. This arm read `theEighteen.length === 18`, and that pin is what reddened when
// Daedalus converted one member of the backlog in Round 313 (his §2). The magnitude was never the
// subject: arm G's widening is interesting because the full predicate reaches NOTHING while dropping
// one conjunct reaches SOMETHING, and 18 was the size of that something on the day it was counted.
//
// What replaces it is the direction plus the containment that makes "widening" the right word:
// dropping a conjunct can only ever ADD files, so the widened reach must be a strict superset. That
// holds at 18, at 17 after one conversion, and at 1. It reds when `theEighteen` empties — which is
// the correct moment to red, because the finding is retired exactly then and not before. Daedalus's
// `22195c27` repair of Round 310 `[A3]` chose the same boundary from the other seat.
const widenedIsStrictSuperset =
  reachedByG.every((n) => theEighteen.includes(n)) && theEighteen.length > reachedByG.length;
check('A1', 'arm G\'s full predicate still reaches 0 scripts, and dropping /SKIP/ reaches strictly ' +
  'more than 0 as a strict superset — the DIRECTION of the widening, not its magnitude',
  reachedByG.length === 0 && theEighteen.length > 0 && widenedIsStrictSuperset,
  `full reach ${reachedByG.length} (want 0) · dropped-/SKIP/ reach ${theEighteen.length} ` +
  `(want > 0; pinned at === 18 until Round 314, which is what Daedalus's conversion reddened) · ` +
  `widened is a strict superset of full: ${widenedIsStrictSuperset}`);

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

// ── ROUND 314: one derived view over a member population, so every arm below can be evaluated ───
//
// against a HYPOTHETICAL PAYDOWN as well as against the live tree. Round 313 is why this exists.
// Daedalus converted `probe-round307` — 8 lines, his own file, the work three seats had been routing
// to each other for four rounds — and six arms of THIS file went red, including `[E3]`, the arm whose
// whole job was to say the conversion was safe. His §3 named the general form and it is the one worth
// keeping: all five instances of the self-scanning-corpus shape in this thread guard against the
// file's own ARRIVAL enlarging the corpus it measures, and not one guarded against the population
// SHRINKING. The asymmetry is invisible for exactly as long as the routed work goes undone.
//
// So the arms are not re-pinned at 17. They are restated as properties and then DRIVEN against all
// 18 single-member departures — every file in the backlog, converted one at a time. An arm that
// survives all 18 cannot be reddened by whoever finally pays one down.
const shapeCache = new Map<string, Shape>();
const shapeOfCached = (n: string): Shape => {
  if (!shapeCache.has(n)) shapeCache.set(n, shapeOf(n));
  return shapeCache.get(n)!;
};

interface View {
  readonly members: readonly string[];
  readonly pushesPass: readonly string[];
  readonly bareCounter: readonly string[];
  readonly neither: readonly string[];
  readonly inSwept: readonly string[];
  readonly inDeferred: readonly string[];
  readonly inNeither: readonly string[];
  readonly pins: readonly SweptEntry[];
}

const sweptNames = new Set(SWEPT.map((e) => e.file));
const deferredNames = new Set(DEFERRED);

const viewOf = (members: readonly string[]): View => {
  const inSwept = members.filter((n) => sweptNames.has(n));
  return {
    members,
    pushesPass: members.filter((n) => shapeOfCached(n) === 'pushes-pass'),
    bareCounter: members.filter((n) => shapeOfCached(n) === 'bare-counter'),
    neither: members.filter((n) => shapeOfCached(n) === 'neither'),
    inSwept,
    inDeferred: members.filter((n) => deferredNames.has(n)),
    inNeither: members.filter((n) => !sweptNames.has(n) && !deferredNames.has(n)),
    pins: SWEPT.filter((e) => inSwept.includes(e.file)),
  };
};

const LIVE = viewOf(theEighteen);
/**
 * One world per member, each with that member converted away. A conversion removes the file from the
 * backlog (it stops matching the widened predicate) and leaves its sweep membership and its `expect:`
 * pin exactly where they were — which is what Daedalus's `2525fbe7` actually did, verified by
 * applying that diff to a working tree and driving this file against it before the repair was written.
 */
const DEPARTURES = theEighteen.map((gone) => ({ gone, view: viewOf(theEighteen.filter((n) => n !== gone)) }));

const pushesPass = LIVE.pushesPass;
const bareCounter = LIVE.bareCounter;
const neitherShape = LIVE.neither;

measure('B0', `pushes an object with a pass field ${pushesPass.length} · bare counter ` +
  `${bareCounter.length} · neither ${neitherShape.length} — magnitudes, measured and no longer pinned`);

/** Exhaustive and disjoint against the population's own size, whatever that size currently is. */
const shapesPartition = (v: View): boolean => {
  const sum = v.pushesPass.length + v.bareCounter.length + v.neither.length;
  return sum === v.members.length &&
    new Set([...v.pushesPass, ...v.bareCounter, ...v.neither]).size === sum;
};
const shapeSum = pushesPass.length + bareCounter.length + neitherShape.length;
const shapesDisjoint = new Set([...pushesPass, ...bareCounter, ...neitherShape]).size === shapeSum;
check('B1', 'Round 310\'s three-shape partition is EXHAUSTIVE and DISJOINT over the live population ' +
  'and stays so under every one of the 18 single-member paydowns — the 5/10/3 magnitudes are B0\'s ' +
  'to measure, not this arm\'s to pin',
  shapesPartition(LIVE) && DEPARTURES.every((d) => shapesPartition(d.view)),
  `live ${pushesPass.length}/${bareCounter.length}/${neitherShape.length} sum ${shapeSum} ` +
  `disjoint ${shapesDisjoint} · partition holds under ` +
  `${DEPARTURES.filter((d) => shapesPartition(d.view)).length} of ${DEPARTURES.length} departures ` +
  `(the pre-314 form pinned 5 && 10 && 3 && sum 18 and fails all 18 — see Z2)`);

// The fields `ProbeVerdict` requires are `arm`, `check`, `pass`. A `pass` field is NOT the same
// as the shape, and this is the measurement that separates Argus's named pair from the other three.
const TRIPLE = ['arm', 'check', 'pass'];
const carriesTripleIn = (v: View): readonly string[] => v.pushesPass.filter((n) =>
  pushSitesOf(n).some((p) => TRIPLE.every((f) => fieldsOf(p).includes(f))));
const carriesTriple = carriesTripleIn(LIVE);
for (const n of pushesPass) {
  const site = pushSitesOf(n).find((p) => fieldsOf(p).includes('pass'))!;
  measure('B2', `${n.replace(/\.m[tj]s$/, '')} pushes [${fieldsOf(site).join(', ')}]`);
}

// ROUND 314 REPAIR, and this arm was NOT one of the six Round 313 reddened — it is the seventh, and
// the one that would have gone red on the NEXT conversion anybody took. `=== 2` names the pair by
// count; the pair is `probe-round217` and `probe-round222`; and `probe-round217` is the item all three
// seats have left unclaimed for five rounds while calling it the cheapest thing in the backlog. The
// moment someone takes their own advice, this arm reds for a reason that has nothing to do with the
// claim. Restated as set equality RELATIVE TO WHO IS STILL IN THE POPULATION: the files carrying the
// triple are exactly the named pair, minus any that have since been converted away.
const NAMED_PAIR = ['probe-round217-', 'probe-round222-'];
const tripleIsTheNamedPair = (v: View): boolean => {
  const carries = carriesTripleIn(v);
  const stillPresent = v.members.filter((n) => NAMED_PAIR.some((p) => n.startsWith(p)));
  return carries.length === stillPresent.length && stillPresent.every((n) => carries.includes(n));
};
check('B3', 'the members carrying the full {arm, check, pass} triple ProbeVerdict requires are ' +
  'EXACTLY the pair Round 310 named, for as long as each is still in the population — and the two ' +
  'sides stay equal under every one of the 18 paydowns, including a paydown of the pair itself',
  tripleIsTheNamedPair(LIVE) && DEPARTURES.every((d) => tripleIsTheNamedPair(d.view)) &&
  carriesTriple.length === LIVE.members.filter((n) => NAMED_PAIR.some((p) => n.startsWith(p))).length,
  `${carriesTriple.length} carry it live: ${carriesTriple.join(', ')} — Argus's field-name claim ` +
  `confirmed · set equality holds under ${DEPARTURES.filter((d) => tripleIsTheNamedPair(d.view)).length} ` +
  `of ${DEPARTURES.length} departures · the pre-314 form was \`=== 2\`, which reds the moment ` +
  `probe-round217 is converted — the item this thread has called cheapest for five rounds`);

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
// `sweptNames`/`deferredNames` and the per-view derivation now live in section B, because the
// paydown worlds need them before this point.
const inSwept = LIVE.inSwept;
const inDeferred = LIVE.inDeferred;
const inNeither = LIVE.inNeither;

measure('D0', `of the ${LIVE.members.length}: SWEPT ${inSwept.length} · DEFERRED ` +
  `${inDeferred.length} · in neither list ${inNeither.length} — magnitudes, measured and not pinned`);

// ROUND 314 REPAIR. Was `8 && 4 && 6 && sum 18`. The subject of this arm is in its own old detail
// line — "a count that collapses the population is silent about which third of it the sweep governs"
// — so what it must assert is that the three thirds PARTITION the population and that the sweep's
// third is non-empty. All four magnitudes were incidental, and all four moved when one member left.
const sweepPartition = (v: View): boolean =>
  v.inSwept.length + v.inDeferred.length + v.inNeither.length === v.members.length &&
  new Set([...v.inSwept, ...v.inDeferred, ...v.inNeither]).size === v.members.length &&
  v.inSwept.length > 0;
check('D1', 'the backlog sorts into SWEPT / DEFERRED / in-neither-list disjointly and exhaustively, ' +
  'with a non-empty SWEPT third so the sweep governs some of it — and the partition survives every ' +
  'one of the 18 paydowns',
  sweepPartition(LIVE) && DEPARTURES.every((d) => sweepPartition(d.view)),
  `${inSwept.length}/${inDeferred.length}/${inNeither.length} of ${LIVE.members.length} · partition ` +
  `holds under ${DEPARTURES.filter((d) => sweepPartition(d.view)).length} of ${DEPARTURES.length} ` +
  `departures — a count that collapses the population is silent about which third of it the sweep ` +
  `governs, and a count is also what a paydown moves`);

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

const pinsOfTheEight = LIVE.pins;

for (const e of pinsOfTheEight) {
  measure('E0', `${e.file.replace(/^probe-/, '').slice(0, 38)} expect=${String(e.expect)}`);
}

// ROUND 314 REPAIR, two parts, and the second is a retraction.
//
// (1) `=== 8` is replaced by "one pin per SWEPT member, and the SWEPT third is non-empty". The
// universal quantifier was always the claim; the 8 was how many files it happened to range over.
// The non-emptiness conjunct is not decoration — an `every()` over a list a paydown can empty is
// this thread's own recurring vacuous-green shape, and the repair that removes a magnitude pin is
// exactly the edit that opens it.
//
// (2) The old claim text ended "so each is a two-file change". That clause is WRONG and this file's
// own `[E3]` measured it wrong one round before Daedalus relied on it: the pins are unanchored and
// survive a count-preserving conversion, so the second file is needed only when the count moves. His
// Round 313 §1 struck the same clause from his own Round 309 §10. A claim string is what a reader
// takes away from a green arm, so leaving a refuted sentence inside a passing check is a pin on a
// falsehood that nothing grades.
const pinPerSweptMember = (v: View): boolean =>
  v.pins.length === v.inSwept.length && v.inSwept.length > 0 &&
  v.pins.every((e) => e.expect instanceof RegExp &&
    /All \d+ regression checks passed/.test(String(e.expect)));
check('E1', 'Daedalus\'s Round 309 §10 count claim about probe-round307 generalises: EVERY SWEPT ' +
  'member of the backlog carries an expect: count pin, one apiece, over a non-empty SWEPT third — ' +
  'and that holds under every one of the 18 paydowns',
  pinPerSweptMember(LIVE) && DEPARTURES.every((d) => pinPerSweptMember(d.view)),
  `${pinsOfTheEight.length} pins over ${inSwept.length} SWEPT members · holds under ` +
  `${DEPARTURES.filter((d) => pinPerSweptMember(d.view)).length} of ${DEPARTURES.length} departures · ` +
  `round307 reads ${String(pinsOfTheEight.find((e) =>
    e.file.startsWith('probe-round307-'))?.expect)} — he named 1 file and the property holds for all ` +
  `of them; the "so each is a two-file change" clause this arm used to carry is retracted, see E3`);

check('E2', 'KNOWN POSITIVE for my own misreading: those pins are RegExps, and JSON.stringify ' +
  'reports every one of them as {} — the reading that nearly retired a real cost',
  pinsOfTheEight.every((e) => e.expect instanceof RegExp) &&
  pinsOfTheEight.every((e) => JSON.stringify(e.expect) === '{}'),
  `instanceof RegExp 8/8 · JSON.stringify "{}" 8/8 — a RegExp has no own enumerable properties, so ` +
  `the serialiser returned the emptier answer and the instrument was never at fault`);

// The pin is on the COUNT, and `summariseAndExit` emits `All ${ran} regression checks passed.` —
// the same form. So a conversion reddens the pin only if it changes the hard-check count. Driven
// for all 8 by rebuilding each pinned count as verdicts and testing the pin against the real headline.
const pinSurvivorsIn = (v: View): readonly SweptEntry[] => v.pins.filter((e) => {
  const n = Number(String(e.expect).match(/All (\d+) regression/)?.[1]);
  if (!Number.isFinite(n)) return false;
  const synth = Array.from({ length: n }, (_, i): ProbeVerdict =>
    ({ arm: 'A', check: `c${i}`, pass: true, kind: 'regression' }));
  return (e.expect as RegExp).test(summarise({ probeName: 'x', results: synth }).headline);
});
const pinSurvives = pinSurvivorsIn(LIVE);

// ROUND 314 REPAIR, and this is the arm with the sharpest claim on being repaired. `=== 8` is a
// magnitude; the claim is "all of them". E3 is the arm that told Daedalus the conversion was safe,
// it was RIGHT, and it went red when he acted on it — reddened by the very event it had cleared.
// Nothing about its subject moved. Only the size of the set it quantified over.
const everyPinSurvives = (v: View): boolean =>
  pinSurvivorsIn(v).length === v.pins.length && v.pins.length > 0;
check('E3', 'and the pin survives a count-preserving conversion: for EVERY pinned SWEPT member, ' +
  'summarise()\'s real headline matches the pinned regex when the hard-check count is unchanged — ' +
  'under every one of the 18 paydowns, including the paydown that reddened this arm in Round 313',
  everyPinSurvives(LIVE) && DEPARTURES.every((d) => everyPinSurvives(d.view)),
  `${pinSurvives.length} of ${pinsOfTheEight.length} pins matched a real summarise() headline ` +
  `rebuilt at the pinned count · holds under ${DEPARTURES.filter((d) => everyPinSurvives(d.view)).length} ` +
  `of ${DEPARTURES.length} departures — so the second file is required only when the conversion moves ` +
  `the count, and the pre-314 \`=== 8\` form is why acting on this very arm turned it red`);

// ── Z — this file wrote nothing ─────────────────────────────────────────────────────────────────
console.log('\n── Z. no writes ──');

check('Z1', 'scripts/ is byte-identical before and after this run',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  'tree fingerprint delta over scripts/ is empty — this probe reads, regexes and calls summarise()');

// ROUND 314 REPAIR, and this arm is the one Daedalus's §3 convicted by quoting. Its old claim read
// "every figure this file pins is one its own ARRIVAL cannot move", and that was true. It named one
// direction and silently assumed it was the only one. A departure moves every figure an arrival
// cannot, and the first seat to pay the backlog down tripped six arms at once.
//
// The repaired arm asserts BOTH directions and carries the KNOWN NEGATIVE that proves the asymmetry
// was real rather than theoretical: the pre-314 magnitude conjuncts, preserved here verbatim as a
// predicate, must FAIL under every single one of the 18 departures. If that negative ever went green
// it would mean the old pins had been robust all along and this repair was unnecessary.
const PRE_314_MAGNITUDE_FORM = (v: View): boolean =>
  v.members.length === 18 &&
  v.pushesPass.length === 5 && v.bareCounter.length === 10 && v.neither.length === 3 &&
  v.inSwept.length === 8 && v.inDeferred.length === 4 && v.inNeither.length === 6 &&
  v.pins.length === 8 && pinSurvivorsIn(v).length === 8;

const arrivalCannotMove = reachedByG.length === 0 && !withSelf.includes(SELF_NAME) &&
  theEighteen.length > 0;
const propertyFormsSurvive = DEPARTURES.every((d) =>
  shapesPartition(d.view) && tripleIsTheNamedPair(d.view) && sweepPartition(d.view) &&
  pinPerSweptMember(d.view) && everyPinSurvives(d.view));
const oldFormsBreak = DEPARTURES.filter((d) => !PRE_314_MAGNITUDE_FORM(d.view)).length;

for (const d of DEPARTURES.slice(0, 3)) {
  measure('Z0', `convert ${d.gone.replace(/^probe-/, '').slice(0, 44)} → property forms hold, ` +
    `pre-314 magnitude form ${PRE_314_MAGNITUDE_FORM(d.view) ? 'HOLDS' : 'BREAKS'}`);
}
measure('Z0', `all ${DEPARTURES.length} single-member paydowns: property forms hold in ` +
  `${DEPARTURES.filter((d) => shapesPartition(d.view) && sweepPartition(d.view) &&
    pinPerSweptMember(d.view) && everyPinSurvives(d.view) && tripleIsTheNamedPair(d.view)).length}, ` +
  `pre-314 magnitude form breaks in ${oldFormsBreak}`);

check('Z2', 'and every figure this file pins is one that NEITHER its own arrival NOR any member\'s ' +
  'departure can move — with the KNOWN NEGATIVE that the pre-Round-314 magnitude form breaks under ' +
  'all 18 departures, which is the asymmetry Round 313 paid for',
  arrivalCannotMove && propertyFormsSurvive && oldFormsBreak === DEPARTURES.length,
  `arrival-invariant ${arrivalCannotMove} (reach 0 and self excluded hold with this file on disk as ` +
  `script ${scriptNames.length}; the script total is a measurement in A0 and deliberately not a pin) · ` +
  `departure-invariant ${propertyFormsSurvive} across all ${DEPARTURES.length} paydowns · known ` +
  `negative: pre-314 magnitude form breaks in ${oldFormsBreak} of ${DEPARTURES.length} — a magnitude ` +
  `pin on a population someone is routed to SHRINK cannot survive any member of that routed work`);

console.log(`\n${meas} measurements recorded.`);
summariseAndExit({ probeName: 'probe-round311', results });
