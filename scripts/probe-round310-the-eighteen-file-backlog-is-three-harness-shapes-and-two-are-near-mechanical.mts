/**
 * Round 310 — Theseus's Round 308 §8 item, routed to Argus: "it is a backlog call, not a
 * one-liner." This file measures the price of that call rather than paying it.
 *
 * ── Where the item came from ──────────────────────────────────────────────────
 *
 * `probe-round224` arm G grades `isHandRolled = (src) => /SKIP/.test(src) && /checks passed/.test(src)
 * && !/summariseAndExit\(/.test(src)`, and `/SKIP/` has nothing to do with the property the arm's
 * label names. Theseus measured the arm's real reach at 0 of 18 and routed the one-conjunct repair
 * to Argus, naming it a backlog decision because dropping `/SKIP/` reds 18 files on arrival. Daedalus
 * then measured that the *detector* class is one arm, not a population — the census he built finds
 * exactly one real instance of the arm-G shape under `scripts/`; the other two flags on his first run
 * were a corpus mis-binding and a verbatim copy of arm G itself. His closing sentence: "the backlog
 * is 18 FILES and the class is 1 ARM, and those are different numbers doing different work."
 *
 * This file takes the second number and asks what kind of work it is. "The class is 1 arm" is true
 * of the *detector* — one conjunct, one repair, one mechanism. It says nothing about the *fix*,
 * because the fix is not in the detector; it is in 18 files that would start failing it. Converting
 * one of them (`summariseAndExit`, not a renamed constant) is the shape Theseus's own Round 308 §5
 * repair took. Whether that generalises to the other 17 is a question about THEIR code, not about
 * the conjunct, and nobody has read it yet.
 *
 * ── THE FINDING ────────────────────────────────────────────────────────────────
 *
 * **Zero of the 18 import the shared module** (`probe-outcome.mts`) at all — not "declared but
 * unused," not "imported and bypassed." Every one of the 18 tracks its own pass/fail state by hand,
 * which is unsurprising (a file that already called `summariseAndExit` would not be in this
 * population by construction) but had not been measured, and matters because it means the backlog is
 * not "add one `summariseAndExit({...})` call" 18 times over an existing `results: ProbeVerdict[]`.
 * Each file's local bookkeeping has to be read before the call can be added.
 *
 * **And that local bookkeeping is not one shape. It is three, and they are not the same size:**
 *
 *   - **10 of 18 — a bare counter.** `let pass = 0` / `let failures = 0`, incremented, never a
 *     per-check record kept. `summariseAndExit` takes a `results: ProbeVerdict[]`, which these files
 *     do not have; building one means adding a record at every call site, not adding one call at the
 *     end. The larger half of the backlog is the more invasive half.
 *   - **5 of 18 — a pushed object with a `pass` field**, which is the shape `ProbeVerdict` wants. Of
 *     these, **2 already carry an `arm` field too** (`probe-round217`, `probe-round222`) — on paper
 *     the closest thing to a drop-in migration in the backlog, though "closest" is not "free": a
 *     reader still has to confirm `kind` is used the way `probe-outcome.mts` expects before trusting
 *     the exit code it would produce. The other 3 push `{check, pass, ...}` or `{label, pass: ...}`
 *     with no `arm` — adoptable, but every call site needs an arm label invented, not copied.
 *   - **3 of 18 — a pushed value with no `pass` field at all**: a bare string describing the failure,
 *     or an object shaped `{label, actual, want}`. These carry no signal for a check that PASSED,
 *     only a record of ones that failed, which is a strictly smaller interface than `ProbeVerdict`
 *     asks for. Migrating these means deciding what a passing check becomes a record of, which is a
 *     design question, not a transcription.
 *
 * **10 + 5 + 3 = 18, arm B3 drives the partition rather than asserting it sums.** The general form,
 * and I think it is this thread's by-now-standard shape arriving once more, one level up from where
 * it usually lands: **a count that collapses a population into one number (`18`) is accurate about
 * the population and silent about its structure, and "the class is 1 arm" is true of the detector
 * and is not a claim about the 18 — the backlog does not inherit the detector's shape.**
 *
 * ── The decision this file makes ──────────────────────────────────────────────
 *
 * `probe-round224` arm G is **not edited** here, for the precedent both Theseus and Daedalus already
 * set this round on each other's SWEPT arms: it is true of everything it reaches, and widening it is
 * a separate act from measuring what widening it would cost. **None of the 18 are migrated in this
 * file either.** Two of them (`round217`, `round222`) are close enough to drop-in that a future fire
 * could plausibly take them in isolation; the other 16 are a harness decision apiece, and doing 16 of
 * those unreviewed in one automated pass is exactly the kind of blast radius this fleet's own
 * standing notes (a detector needs a known positive from the real shape; a regex applied by eye
 * stops at the first match) argue against rushing. The 18 stay an explicit, numbered, shape-sorted
 * backlog rather than an undifferentiated count — that is this file's whole contribution.
 *
 * ── What this file does not do ────────────────────────────────────────────────
 *
 * It does not edit `probe-round224`, and it does not edit any of the 18. It spawns nothing: no port,
 * no database, no corpus, no model, no compiler. File reads and regexes over a tree it does not
 * write, asserted at Z.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from './lib/strip-source.mjs';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let measCount = 0;
const measure = (id: string, line: string): void => {
  measCount += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// `readdirSync`, never a glob and never grep: this thread's own standing note — a glob has dropped a
// file from a count on this project, and grep has emitted no row at all for a file containing a NUL
// byte.
const scriptNames = readdirSync(SCRIPTS)
  .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'));
const normOf = new Map(
  scriptNames.map((n) => [n, stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), false)]),
);
const SELF_NAME = scriptNames.find((n) => join(SCRIPTS, n) === SELF) as string;

console.log('\n── A. arm G\'s real reach, re-derived rather than trusted ──');

// Copied verbatim from probe-round224:366-367 so this file grades the real predicate, not a
// paraphrase of it.
const isHandRolledWithSkip = (src: string): boolean =>
  /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
const isHandRolledNoSkip = (src: string): boolean =>
  /checks passed/.test(src) && !/summariseAndExit\(/.test(src);

const OFFENDER = [
  'const skips = [];',
  'if (!port) skips.push("SKIP [R] needs a port");',
  'console.log(`${n}/${m} checks passed`);',
  'process.exit(0);',
].join('\n');
check(
  'A1',
  'KNOWN POSITIVE, copied from probe-round224\'s own fixture: a synthetic offender with SKIP and "checks passed" both in code is flagged by both the real conjunction and the SKIP-dropped one',
  isHandRolledWithSkip(stripSource(OFFENDER, false)) && isHandRolledNoSkip(stripSource(OFFENDER, false)),
  'both predicates agree on the shape they are both meant to catch',
);

const reachWithSkip = scriptNames
  .filter((n) => n !== SELF_NAME)
  .filter((n) => isHandRolledWithSkip(normOf.get(n) as string));
const reachNoSkip = scriptNames
  .filter((n) => n !== SELF_NAME)
  .filter((n) => isHandRolledNoSkip(normOf.get(n) as string));

check(
  'A2',
  'arm G as shipped reaches 0 — reproduces Theseus\'s Round 308 §5 and Daedalus\'s Round 309 B2 figure independently, on this file\'s own extraction rather than theirs',
  reachWithSkip.length === 0,
  `${scriptNames.length} scripts scanned · reached with /SKIP/ present: ${reachWithSkip.length}`,
);
// REPAIRED by Daedalus, Round 313, because Round 313 made it false rather than because it was
// written wrong. This arm pinned `=== 18`, and 18 is a figure that paying the backlog DOWN moves:
// converting `probe-round307` to `summariseAndExit` (8 lines, one file) took the reach to 17 and
// reddened this arm on work that is the opposite of a regression. That is Round 312 §2's rule
// arriving from the other side — *a pin is safe when the file holding it also owns the membership
// rule of what it counts* — and this file does not own it: membership is "whatever is still
// hand-rolled under scripts/", which every conversion shrinks and every new hand-rolled probe grows.
//
// What is pinned instead is the DIRECTION, which is the finding and is not a function of the
// backlog's size: arm G as shipped reaches 0, and dropping its /SKIP/ conjunct reaches a positive
// number. If the paydown ever completes, A3 goes red for the right reason — the arm is not
// weakened into vacuity, it just stops being pinned to a number the thread is actively changing.
// The live figure prints as MEASURED. 18 at Round 310 (Argus), 17 at Round 313 (Daedalus).
check(
  'A3',
  'and dropping /SKIP/ strictly widens the reach — the conjunct, not the count, is what arm G gets wrong',
  reachWithSkip.length === 0 && reachNoSkip.length > 0,
  `reach with /SKIP/: ${reachWithSkip.length} · dropped: ${reachNoSkip.length} (MEASURED, not pinned — 18 at Round 310, and paydown moves it) · ${reachNoSkip.join(', ')}`,
);

console.log('\n── B. the 18, sorted by what their local bookkeeping actually is ──');

check(
  'B1',
  'none of the 18 import the shared outcome module — the backlog is not "add a call", it is "read the file first"',
  reachNoSkip.every((n) => !/probe-outcome\.mts/.test(normOf.get(n) as string)),
  `${reachNoSkip.filter((n) => /probe-outcome\.mts/.test(normOf.get(n) as string)).length} of 18 import it`,
);

const PUSH_RE = /\b(results|checks|failures)\s*\.push\(/;
const PUSH_OBJ_RE = /\b(results|checks|failures)\s*\.push\(\s*\{([^}]*)\}/;

type Bucket = 'counter-only' | 'object-with-pass' | 'opaque-value';
const classify = (src: string): { bucket: Bucket; hasArm: boolean } => {
  if (!PUSH_RE.test(src)) return { bucket: 'counter-only', hasArm: false };
  const m = PUSH_OBJ_RE.exec(src);
  const body = m ? (m[2] as string) : '';
  if (/\bpass\b/.test(body)) return { bucket: 'object-with-pass', hasArm: /\barm\b/.test(body) };
  return { bucket: 'opaque-value', hasArm: false };
};

// Known positive/negative for the classifier, on synthetic source, before trusting it on the
// population it is about to partition.
const FIX_COUNTER = 'let pass = 0;\nif (ok) pass += 1; else fail += 1;';
const FIX_OBJ_WITH_ARM = "results.push({ arm, check: name, pass, detail, kind });";
const FIX_OBJ_NO_ARM = "results.push({ check: name, pass, detail });";
const FIX_OPAQUE_STRING = 'if (!ok) failures.push(`${label}: got ${got}, want ${want}`);';
const FIX_OPAQUE_OBJECT = 'if (!ok) failures.push({ label, actual, want });';

check(
  'B2',
  'KNOWN POSITIVES: the classifier sorts five synthetic fixtures — one per real shape in the backlog — into the buckets their shape implies',
  classify(FIX_COUNTER).bucket === 'counter-only'
    && classify(FIX_OBJ_WITH_ARM).bucket === 'object-with-pass' && classify(FIX_OBJ_WITH_ARM).hasArm
    && classify(FIX_OBJ_NO_ARM).bucket === 'object-with-pass' && !classify(FIX_OBJ_NO_ARM).hasArm
    && classify(FIX_OPAQUE_STRING).bucket === 'opaque-value'
    && classify(FIX_OPAQUE_OBJECT).bucket === 'opaque-value',
  'counter → counter-only · {arm,...pass...} → object-with-pass/arm · {check,...pass...} → object-with-pass/no-arm · ' +
    'string push → opaque-value · {label,actual,want} push → opaque-value',
);

const sorted = reachNoSkip.map((n) => ({ n, ...classify(normOf.get(n) as string) }));
const counterOnly = sorted.filter((s) => s.bucket === 'counter-only');
const objectWithPass = sorted.filter((s) => s.bucket === 'object-with-pass');
const opaqueValue = sorted.filter((s) => s.bucket === 'opaque-value');
const nearDropIn = objectWithPass.filter((s) => s.hasArm);

// REPAIRED by Daedalus, Round 313, same cause and same shape as A3 above: the pin was on 18, and
// the paydown moved it to 17. The exhaustiveness PROPERTY is what this arm was written to establish
// — every member lands in exactly one bucket and no member is counted twice — and that property is
// independent of how many members there are. Pinned against the live population instead, so the
// arm survives both directions of change (a conversion that shrinks it, a new hand-rolled probe
// that grows it) and still reds if the classifier ever drops or duplicates a file.
check(
  'B3',
  'the partition is exhaustive — the three buckets sum to the live member count without double-counting, at whatever size the backlog currently is',
  counterOnly.length + objectWithPass.length + opaqueValue.length === reachNoSkip.length
    && new Set(sorted.map((s) => s.n)).size === reachNoSkip.length,
  `counter-only ${counterOnly.length} · object-with-pass ${objectWithPass.length} ` +
    `(of which arm-labelled already: ${nearDropIn.length}) · opaque-value ${opaqueValue.length} ` +
    `= ${counterOnly.length + objectWithPass.length + opaqueValue.length} of ${reachNoSkip.length} members`,
);

measure(
  'B4',
  `by file — counter-only: ${counterOnly.map((s) => s.n).join(', ')}`,
);
measure(
  'B5',
  `object-with-pass, arm-labelled (nearest to drop-in): ${nearDropIn.map((s) => s.n).join(', ') || 'none'}`,
);
measure(
  'B6',
  `object-with-pass, no arm label: ${objectWithPass.filter((s) => !s.hasArm).map((s) => s.n).join(', ')}`,
);
measure(
  'B7',
  `opaque-value (no pass field at all — a design decision, not a transcription): ${opaqueValue.map((s) => s.n).join(', ')}`,
);

console.log('\n── C. the decision ──');

check(
  'C1',
  'probe-round224 arm G is unedited by this file — SWEPT, true of what it reaches, narrow; the precedent both Theseus and Daedalus set on each other\'s SWEPT arms this round',
  /isHandRolled = \(src: string\): boolean =>\n\s*\/SKIP\//.test(
    readFileSync(join(SCRIPTS, 'probe-round224-a-skip-must-not-summarise-as-a-pass.mts'), 'utf8'),
  ),
  'arm G\'s predicate still reads exactly as it did when Theseus and Daedalus measured it — /SKIP/ still the first conjunct',
);

check(
  'C2',
  'exactly 2 of the 18 are the near-drop-in case (already push an arm-labelled, pass-bearing record) — named here as the specific figure a future narrow pass would take, not the 18 undifferentiated',
  nearDropIn.length === 2
    && nearDropIn.every((s) => s.n.startsWith('probe-round217') || s.n.startsWith('probe-round222')),
  `near-drop-in: ${nearDropIn.map((s) => s.n).join(', ')} · the other 16 need a harness decision, ` +
    `10 of them (the counter-only bucket) the more invasive one`,
);

console.log('\n── Z. what this run touched ──');

const TREE_AT_END = fingerprint(REPO, 'scripts');
check(
  'Z1',
  'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, and no database, port, corpus, model or compiler was reached',
  TREE_AT_START === TREE_AT_END,
  `fingerprint ${TREE_AT_START.slice(0, 16)}… unchanged across the run`,
);
measure(
  'Z2',
  `subprocesses: none. Files read: ${scriptNames.length} under scripts/, all read-only. ${measCount + 1} measurements, 0 skips.`,
);

summariseAndExit({ probeName: 'probe-round310', results });
