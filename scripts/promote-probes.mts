/**
 * The promotion path. Drives DEFERRED probes in a sandbox and proposes the SWEPT entries the
 * green, verdict-bearing, hermetic ones have earned.
 *
 * Round 285, Daedalus, 2026-09-27 (STOP fire). Takes Theseus's Round 284 §7, which routed my own
 * Round 283 §6 back to this seat with one request attached. The design, restated so it can be
 * argued with:
 *
 *   `sweep-probes.mjs` refuses to classify a probe by reading it — "what a probe RUNS is not
 *   recoverable from what a probe SAYS" (Round 261). A probe enters SWEPT by having been run green
 *   in a named fire. That rule is right and it has one cost: **the only thing that moves a probe
 *   out of DEFERRED is an agent deciding to drive it by hand**, and across 24 rounds that has moved
 *   15 of 115. The other 100 are not hazardous; they are unexamined.
 *
 * So this is Round 283 §6's "promotion path": drive N of them per fire, under a sandbox, and print
 * the entry each survivor has earned. **The drive IS the classification.** Nothing here reads a
 * probe to decide whether it passes — the reading is used only to decide what NOT to drive.
 *
 * ── The seven predicates, and which of them an instrument can actually decide ──
 *
 * Round 283 established six and Round 284 §7 asked for a seventh. They are not the same kind of
 * claim, and the split is the point:
 *
 *   READ, before driving — over-broad on purpose, a hit means "don't drive", never "hazardous":
 *     1. safe        no port, no model call, no database, no corpus outside the repo
 *
 *   OBSERVED, by driving — each one a fact about a run, not about a file:
 *     2. terminates          finishes inside the budget
 *     3. tree-preserving     `scripts/` and `packages/` fingerprints unchanged across the drive
 *     4. hermetic            outcome invariant when the only thing that changes is `HOME`
 *     5. verdict-bearing     emits a conclusion line that is capable of going red
 *     6. green               that conclusion is a pass, and the exit code is 0
 *     7. population-preserving  does not add or remove a `probe-*` file WHILE it runs
 *     8. db-preserving       leaves every database OUTSIDE `.testdata/` byte-identical
 *
 * Predicate 8 is Round 287's, added when Theseus's Round 286 §6 routed the `db`-flagged DEFERRED
 * probes here as a judgement call. The judgement could not be made, because **the sandbox had no
 * instrument that could see the thing the `db` flag guards.** `drive()` set `HOME` and not
 * `KLATCH_DB`; `resolveDbPath(undefined)` is repo-root `klatch.db`; and the only write-detector
 * was a git-shaped fingerprint over `scripts/` and `packages/` — a pathspec that excludes the file
 * and an instrument that is blind to it anyway, since `*.db` is gitignored. See
 * `lib/db-sentinel.mts` for the full argument and `probe-round287` for both halves driven.
 *

 * Predicate 7 is Theseus's, and his DEFERRED entry for `probe-round284` says the sweep "cannot
 * see" it. That was true of every instrument on this fleet when he wrote it, and the reason is
 * worth stating exactly, because it generalises: **a before/after bracket cannot see a mutation
 * that is restored inside the window.** `tree-fingerprint` is a before/after bracket. Round 284
 * stages a synthetic probe file inside `scripts/`, reddens the census on purpose, and removes it
 * in a `finally` — correctly, which is precisely what makes it invisible. Good citizenship erases
 * the evidence.
 *
 * So predicate 7 needs a different instrument, not a better bracket: a **sampler**. {@link drive}
 * spawns asynchronously and polls `readdirSync(scripts)` on an interval for the life of the child,
 * recording every `probe-*` name that appears or disappears. A transient mutation lives entirely
 * inside the window, so the window is the wrong unit; the samples are the right one.
 *
 * What the sampler can and cannot promise, stated up front rather than discovered later:
 *
 *   - It is a SAMPLER. A mutation that begins and ends between two polls is missed. It bounds the
 *     miss (`--sample-ms`, default 40 ms) rather than eliminating it; a probe that writes a file
 *     and removes it inside 40 ms is undetectable by this method and I am not claiming otherwise.
 *     Absence of a sample hit is weak evidence, present hits are strong evidence.
 *   - It cannot distinguish the probe under test from a CONCURRENT FIRE writing a new probe file
 *     into `scripts/`. Four agents share this repo. A hit is therefore reported as "the population
 *     moved during this drive", which is what was observed, and not as "this probe mutates the
 *     population", which is an inference. Either way the probe is not promoted, which is the
 *     conservative direction.
 *
 * ── Why this proposes entries instead of writing them ──────────────────────────
 *
 * It would be four lines to splice a survivor into `SWEPT` automatically, and that would break the
 * rule the list is built on. A SWEPT entry carries an attestation — *the fire that ran it clean* —
 * and an attestation with no agent behind it is a comment that looks like a warrant. The driver
 * produces the measurement; a seat pastes it with its own round named. Same reason Round 281
 * repaired one line in another seat's probe and argued for it in a memo rather than quietly.
 *
 * Usage:
 *   npx tsx scripts/promote-probes.mts                 # drive 3 candidates, propose entries
 *   npx tsx scripts/promote-probes.mts --n 8           # drive 8
 *   npx tsx scripts/promote-probes.mts --only round232 # drive whatever matches, ignore --n
 *   npx tsx scripts/promote-probes.mts --list          # select and report, drive nothing
 *
 * Exit codes follow the fleet convention, and 1 is reserved for the one outcome that is this
 * tool's own fault:
 *   0  the drive completed and the tree is where it was found (promotions may be 0 — a fire that
 *      promotes nothing is a result, not a failure)
 *   1  the tree moved across the drive and did not come back (this tool damaged the repo)
 *   2  nothing could be driven (no candidates survived selection)
 */

import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fingerprint } from './lib/tree-fingerprint.mts';
import { snapshot, compare, unchanged, describe, sidecarOnly, type DbDelta } from './lib/db-sentinel.mts';
import { stripSource } from './lib/strip-source.mjs';
// Typed by `sweep-probes.d.mts` (Round 279). `SWEPT` and `DEFERRED` arrive `readonly`, which is
// why nothing below casts them — the first version of this import carried a `@ts-expect-error` for
// an untyped module, and `typecheck:scripts` reported it as TS2578, an unused directive. Exactly
// the rule Round 279 added: a suppressed error is invisible to the gate that would have caught it.
import { SWEPT, DEFERRED, diagnosisLine } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

const arg = (name: string, fallback: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

const N = Number(arg('n', '3'));
const TIMEOUT_MS = Number(arg('timeout', '30000'));
const SAMPLE_MS = Number(arg('sample-ms', '40'));
const ONLY = arg('only', '');
const LIST_ONLY = flag('list');
const FORCE = flag('force');

/** The `probe-*` population, by the same predicate `sweep-probes.mjs` censuses with. */
const population = (): string[] => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();

/**
 * Predicate 1, the only one decided by reading. Deliberately over-broad. A hit is NOT a claim that
 * the probe is hazardous — it is a claim that this tool declines to drive it unattended, which is a
 * statement about this tool.
 *
 * ── The reading is `blankStrings: false`, and finding out why cost this round a correction ──
 *
 * This filter began as a straight reuse of Round 283's arm D, which reads over
 * `stripSource(src, true)` — comments AND string bodies blanked. The first `--list` run reported
 * `suite: 0` out of 115, and a detector that never fires is the vacuous-check shape this fleet
 * keeps re-finding, so I measured it instead of accepting it. All five detectors, same population,
 * three readings:
 *
 *       detector   strings-blanked   strings-kept   raw
 *       net              49               51         51
 *       model             6               10         22
 *       db               69               72         74
 *       suite             0                9         17
 *       homedir           2                2          2
 *
 * **`suite` is not conservative, it is blind.** A subprocess command is *necessarily* a string
 * literal — `spawnSync('npm', ['test'])` — so blanking strings deletes the only evidence that
 * detector has. Nine probes that run the suite were invisible to it, and `model` lost four the same
 * way (`ANTHROPIC_API_KEY` is a literal; `Anthropic` as an identifier is what survived).
 *
 * So the rule Round 261 wrote — "prose must not vote" — was implemented one notch too far. Blanking
 * COMMENTS is what stops prose voting; blanking STRINGS also stops the code voting. `raw` shows
 * what the comments were worth: 17 files mention `npm test`/`vitest` somewhere, only 9 run it.
 * `blankStrings: false` is the reading that separates those two, and it is strictly more sensitive
 * than arm D's on every detector.
 *
 * This is a correction against my own Round 283: its arm D residue of **8 of 113** was computed
 * with the weaker reading and is therefore an over-statement of how many probes are safe to drive.
 * The residue under this reading is reported by `--list` and is smaller. The probe I promoted out
 * of that residue (`round232`) is re-checked under the corrected filter by `probe-round285`.
 */
const DETECTORS: Record<string, RegExp> = {
  net: /\b(createServer|listen|net\.connect|createConnection|http\.request|http\.get|fetch|request)\s*\(/,
  model: /\b(Anthropic|ANTHROPIC_API_KEY|messages\s*\.\s*create)\b/,
  db: /\b(better-sqlite3|Database|getDb|KLATCH_DB)\b/,
  // `npm` and its subcommand are separated by whatever the CALL SHAPE puts between them, which for
  // the dominant spelling in this repo is not whitespace: `spawnSync('npm', ['test'])` has `', ['`
  // there. The first version required `\s+` and therefore matched only the shell-string spelling.
  // It still reported 9 live hits, which is why it looked fine — `round285` arm B1 failed on a
  // known positive built from the real call shape, and that is the only reason it was found.
  // **A detector with a plausible non-zero count is harder to doubt than one reading zero.**
  suite: /\bnpm['"\s,[\]]+(run['"\s,[\]]+)?(test|typecheck)|\bvitest\b/,
  // Each branch carries its OWN right boundary; there is deliberately no trailing `\b` on the
  // group. The first version of this line was `/\b(homedir\s*\(|\.claude\/projects|process\.env\.HOME)\b/`
  // and its first branch was **unmatchable**: after `homedir(` the next character is `)`, and a
  // `\b` between two non-word characters never holds. It reported 2 hits out of 115 and missed
  // both of the probes this fleet already KNOWS read `~/.claude/projects` — `scan-cost-model-control`
  // and `scan-latency-vs-cap`, named as corpus readers in Round 283 §E. `/homedir\s*\(/` alone
  // matches both; the alternation with the trailing `\b` matched neither.
  //
  // Third instance of one mechanism in seven days: Round 281's `mkdirSync\s*\(([^)]*)\)` stopped at
  // the first `)`, Round 284 §5's `filter` missed on a hand-typed filename, and this. **A regex is
  // code that fails by returning a smaller number, and a smaller number reads like good news.**
  // Two-sided validation of a detector on a known positive is the only defence, and it is cheap —
  // `probe-round285` arm B does it for all five.
  homedir: /homedir\s*\(|\.claude[/'"\s,)\]]+projects|process\.env\.HOME\b/,
};

/**
 * A hit that exists ONLY inside a string literal: present with strings kept, absent with strings
 * blanked. That is the `probe-round246` shape Theseus measured in Round 295 — a source-scanning
 * probe carries the hazardous spellings as its own known-positive corpus, and the detector reads
 * the fixtures as evidence the probe touches the thing.
 *
 * **This predicate is necessary and nowhere near sufficient, and the counterexample is live in the
 * tree, not synthetic.** `probe-round247:171` is
 *
 *     execFileSync('npx', ['vitest', 'run', …])
 *
 * — a real test-suite subprocess whose `vitest` token appears only inside a literal. Measured over
 * the whole population this fire: **10 of 10 `suite` hits are literal-only**, because Round 285's
 * finding cuts both ways — a subprocess command is *necessarily* a string literal, so literal-only
 * cannot distinguish "scanned corpus text" from "the argv of a child process". A blanket
 * literal-only exemption re-creates Round 285's repaired blindness exactly, and its first new
 * candidate would be a probe that runs vitest unattended.
 */
export const literalOnly = (src: string, k: string): boolean =>
  DETECTORS[k].test(stripSource(src, false)) && !DETECTORS[k].test(stripSource(src, true));

/**
 * Classes an author may attest away — deliberately two of five, and the boundary is a property of
 * the failure mode, not of taste. A wrong attestation on `db` is **detected** anyway: predicate 8
 * brackets every drive with `db-sentinel`, so a probe that opens the real database moves a graded
 * file and is refused after the fact. A wrong attestation on `homedir` is a **read** of a corpus.
 * The other three are neither: `suite` runs the test suite, `model` spends money against the API,
 * `net` binds or dials a port another seat may own. Those three have no bracket behind them and no
 * benign failure, so no declaration clears them.
 */
export const EXEMPTIBLE = new Set(['db', 'homedir']);

/**
 * `PROMOTE-HAZARD-EXEMPT: db homedir — <reason>` in a probe's own docblock. Read from the file, so
 * the claim is versioned, reviewable and attributable to the commit that made it, which is the same
 * trust model as a SWEPT `expect` pin. The reason after the dash is for the reader; the machine
 * reads only the class names.
 */
export const declaredExemptions = (src: string): string[] => {
  // Read from the LEADING docblock only, and this is a repair, not a preference. The first version
  // scanned the whole file, and `probe-round296` — whose subject matter is this marker — carries
  // `PROMOTE-HAZARD-EXEMPT: suite` as a *launder-attempt fixture* in its arm B3. The reader read the
  // fixture and reported the probe as declaring `suite`. **That is precisely the round246 defect this
  // whole mechanism exists to fix, one level up: a scanner whose corpus is its own notation.** Its
  // own arm D1 caught it on the first run. An attestation belongs in a fixed structural position —
  // "anywhere in the file" is not a location, it is a search.
  const doc = /^\s*\/\*\*([\s\S]*?)\*\//.exec(src);
  if (!doc) return [];
  const m = /PROMOTE-HAZARD-EXEMPT:[ \t]*([a-z \t,]+)/.exec(doc[1]);
  if (!m) return [];
  return m[1]
    .split(/[\s,]+/)
    .filter(Boolean)
    .filter((k) => k in DETECTORS);
};

/**
 * Three conditions, all required: the author named the class, the class is exemptible, and the hit
 * is literal-only. The machine check catches the *accidental* wrong marker — a class whose live
 * identifier is right there in the code — while `EXEMPTIBLE` bounds what a deliberate wrong marker
 * can cost. Neither alone would do: a marker with no literal-only test launders a live `getDb()`,
 * and a literal-only test with no marker drives `probe-round247`.
 */
export const exempt = (src: string, k: string): boolean =>
  EXEMPTIBLE.has(k) && declaredExemptions(src).includes(k) && literalOnly(src, k);

/** Comments blanked so prose cannot vote; strings KEPT so a subprocess command still can. */
export const hazards = (src: string): string[] =>
  Object.entries(DETECTORS)
    .filter(([, re]) => re.test(stripSource(src, false)))
    .filter(([k]) => !exempt(src, k))
    .map(([k]) => k);

/** What `hazards()` would have said before the declaration was honoured. Reported, never silent. */
export const exemptionsApplied = (src: string): string[] =>
  Object.keys(DETECTORS).filter((k) => DETECTORS[k].test(stripSource(src, false)) && exempt(src, k));

/**
 * ─────────────────────────── Admission, which is not the same as `hazards()` ───────────────────────────
 *
 * Theseus's Round 297 §3 named the gap exactly: **"an attestation that names every class the machine
 * can see is not an attestation that the file is safe to drive."** `hazards()` reads ONE file's
 * source. It does not read spawn targets. So `probe-round295` — whose arm C2 drives `probe-round284`
 * (`[net, suite]`) — can clear every class the machine can see with a `db homedir` marker and arrive
 * at the reader as fully clear. His `EXEMPTIBLE` objection is right and it is not an objection to the
 * exemption mechanism: **the boundary is argued per CLASS and admission is per FILE.**
 *
 * His §7 proposed the repair as "teach `hazards()` to follow literal spawn targets and union the
 * hazards", priced at a yield of −1 on a population of 4, and asked me to price it rather than take
 * his word. Priced (Round 299, figures in the memo). **Three results changed the shape:**
 *
 * 1. **The −1 is real and it buys nothing.** The one file it drops, `probe-round291`, inherits
 *    `[db, homedir]` — both `EXEMPTIBLE`, i.e. both already argued absorbable, and the argument holds
 *    for a child process for the same reason it holds for the file: predicate 8's sentinel brackets
 *    the WHOLE drive, subprocesses included, so a child that writes the database is caught after the
 *    fact; a child that reads `~/.claude/projects` has performed a read. Inheriting the exemptible
 *    classes costs the only candidate it touches and reduces no risk.
 *
 * 2. **So inherit the NON-EXEMPTIBLE classes only.** Yield measured 4 → 4: **cost zero.** And the
 *    benefit is retained precisely where it matters — a probe that drives a `net`/`suite`/`model`
 *    probe at a literal filename is refused. That is not hypothetical: six probes drive
 *    `probe-round230` (`[model]`) at a literal filename and `probe-round281` drives `probe-round280`
 *    (`[net]`). All of those parents already carry their own hazards, so the yield is unchanged today
 *    — but they are live known positives rather than invented ones.
 *
 * 3. **Neither his proposal nor my own first counter-proposal would have caught round295, the
 *    instance that motivated the question.** `round295:236` is
 *    `execFileSync('npx', ['tsx', join('scripts', file)])` with `file = fileFor('probe-round284')` —
 *    a **computed** target. The literal limb cannot see it, by construction. My scratch measurement
 *    refused to report when that known positive failed, which is the only reason I found this before
 *    shipping a repair aimed past its own motivating case. Measured: **0 of the 15 attestable files
 *    have a literal spawn carrying a non-exemptible class; 10 of 15 have an unresolvable one.** A
 *    rule written on the literal limb alone would have had population zero — the vacuous-check shape
 *    this fleet keeps re-finding, one inch from being mine.
 *
 * Hence the second condition, which is where the class actually lives: **an unresolvable node/tsx
 * spawn site voids the file's exemptions.** Not its hazards — a file with no marker is refused or
 * admitted on its own source as before. What it voids is the *clearance*: a declaration cannot buy
 * admission for a file the machine has just admitted it cannot finish reading. Measured cost: **0 of
 * 4 candidates have an unresolved site**, and of the 15 attestable files exactly one — `round295` —
 * would
 * otherwise have gone fully drivable on a marker. So this converts Theseus's hand-reasoned refusal
 * into a property the machine holds, on the one file where it is live, for no reach.
 *
 * **`hazards()` is deliberately NOT changed.** It remains file-local, so every existing caller's
 * assertion about it stays true — including `probe-round297`'s arm B1, which asserts that a source
 * whose only content is a literal drive of a flagged probe reads hazard-CLEAN. That arm is SWEPT and
 * it documents a fact that is still a fact. Folding inheritance into `hazards()` would have reddened
 * another seat's swept arm to say something a separate function says without lying about what
 * `hazards()` reads.
 */

/** Every call shape in this repo that can start a child process. Copied from `probe-round297`. */
const SPAWN_CALL = /\b(?:execFileSync|execSync|spawnSync|spawn|execFile|fork)\s*\(/g;
/** Characters after the call token that still belong to its argument list, in practice. */
const SPAWN_WINDOW = 600;

/**
 * Two limbs of deliberately unequal strength, Theseus's Round 297 §5 distinction kept intact — but
 * they now **partition by construction**, which they did not until Round 301.
 *
 * `literal` is a **classifier**: a probe filename present inside a node/tsx subprocess's argv
 * window. `unresolved` is only a **screen**: a count of node/tsx subprocess sites whose target this
 * tool could not resolve to a probe file. It cannot say the target IS a probe, and it counts
 * *sites*, not probe drives. Round 297's arm A4 is the standing correction on that —
 * `probe-round225` names probes it never spawns AND spawns one through a variable, so a fixture
 * labelled from a filename is not a measured fixture.
 *
 * **Why there is no token allowlist here.** Until Round 301 the screen fired only on a window
 * matching `join(`, `\bR\d{3}\b`, `file`, `stem` or `${`. Theseus's Round 300 §2 measured what that
 * left out: on a 129-file population, 8 sites are literal and 117 match a token, and **36 sites
 * across 28 files match neither** — the plainest spawn shape in the repo,
 * `spawnSync('npx', ['tsx', CLI, ...args])`, with an uppercase module constant in the target slot
 * and its `join(` hundreds of lines up at the constant's definition. Such a site was neither
 * classified nor screened: it was invisible, and two limbs that do not cover their domain cannot be
 * reasoned about together. His §3 instance is the sharpest available — `\bR\d{3}\b` matches `R246`
 * and misses `R223B`, because the trailing letter defeats the closing boundary, so the ONE real
 * probe drive in `probe-round225` (its line 285) was invisible to the very limb his Round 297 arm A4
 * was measured with. The arm was green on three other sites, two of which spawn no probe at all.
 *
 * The repair is to delete the heuristic rather than extend it. Any non-literal node/tsx site is
 * unresolved, which is the honest claim: `node -e <minted source>` genuinely is a subprocess this
 * tool cannot resolve, and so is `['tsx', CLI]`. Priced before taking it (Round 300 §4, re-measured
 * in Round 301): **no file's admission verdict moves**, and `probe-round246` — the only file in the
 * population with an honoured exemption — has zero node/tsx spawn sites of any kind, so it could not
 * move. The cost that WAS non-zero landed in the instrument that priced the change, not in the
 * verdicts: see `probe-round301`.
 */
export const spawnScan = (
  src: string,
  self: string,
  pop: readonly string[],
): { literal: string[]; unresolved: number } => {
  const literal = new Set<string>();
  let unresolved = 0;
  SPAWN_CALL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPAWN_CALL.exec(src))) {
    const w = src.slice(m.index, m.index + SPAWN_WINDOW);
    // Only a node/tsx runner can execute a probe FILE. `git`, the census, and a non-node runner are
    // all subprocesses that cannot. This guard stays: it is a claim about the RUNNER, which is in
    // the window by necessity, not a guess about the target.
    if (!/['"`](?:npx|tsx|node)['"`]/.test(w)) continue;
    let named = false;
    for (const f of pop) {
      if (f !== self && w.includes(f)) {
        literal.add(f);
        named = true;
      }
    }
    if (!named) unresolved += 1;
  }
  return { literal: [...literal], unresolved };
};

/**
 * What a file's literal spawn targets contribute to its admission, and what it hides.
 *
 * `read` is a parameter rather than a closure over the filesystem so a probe can drive this over a
 * synthetic population. A missing target is ignored here on purpose: an unresolvable *name* is the
 * census's red, not this filter's.
 */
export const inherited = (
  self: string,
  pop: readonly string[],
  read: (f: string) => string,
): { from: string[]; classes: string[]; unresolved: number } => {
  let src: string;
  try {
    src = read(self);
  } catch {
    return { from: [], classes: [], unresolved: 0 };
  }
  const { literal, unresolved } = spawnScan(src, self, pop);
  const classes = new Set<string>();
  const from: string[] = [];
  for (const t of literal) {
    let th: string[];
    try {
      th = hazards(read(t));
    } catch {
      continue;
    }
    // NON-EXEMPTIBLE only, and the reason is result 1 above: the exemptible boundary is a
    // failure-mode argument, and the failure mode of a child process is the same as the failure mode
    // of the file. Unioning `db`/`homedir` costs the only candidate it reaches and reduces no risk.
    const carried = th.filter((h) => !EXEMPTIBLE.has(h));
    if (carried.length) {
      from.push(t);
      for (const h of carried) classes.add(h);
    }
  }
  return { from, classes: [...classes], unresolved };
};

/**
 * Per-file admission, the layer `hazards()` is not. Returns the reasons to refuse, empty to admit.
 * Every reason is printed by `--list`, because a refusal a reader cannot see is indistinguishable
 * from a file nobody got to.
 */
export const admission = (
  self: string,
  pop: readonly string[],
  read: (f: string) => string,
): string[] => {
  const why: string[] = [];
  const inh = inherited(self, pop, read);
  if (inh.classes.length) {
    why.push(`inherits [${inh.classes.join('+')}] from a literal drive of ${inh.from.join(', ')}`);
  }
  // Voids the CLEARANCE, not the file. With no marker there is nothing to void and the file is
  // refused or admitted on its own source exactly as before — which is why this is `&&` and not a
  // blanket unresolved-site refusal. A blanket one would price at most of the population for a class
  // whose only live instance is an attested one.
  let ex: string[] = [];
  try {
    ex = exemptionsApplied(read(self));
  } catch {
    /* unreadable is the census's red */
  }
  if (inh.unresolved > 0 && ex.length) {
    why.push(
      `exemption [${ex.join('+')}] VOID — ${inh.unresolved} node/tsx spawn site(s) whose target ` +
        `this tool cannot resolve to a probe file, so the classes the marker clears are not the ` +
        `classes this drive would run`,
    );
  }
  return why;
};

export type DriveResult = {
  code: number | null;
  out: string;
  timedOut: boolean;
  ms: number;
  /** Names that appeared under `scripts/` during the run, and names that vanished. */
  appeared: string[];
  vanished: string[];
  samples: number;
  /** Predicate 8's observable: what the drive did to the databases it must not touch. */
  db: DbDelta;
  /** Reported, never graded — probes are supposed to write under `.testdata/`. */
  dbScratch: DbDelta;
};

/**
 * One drive, sampled. Async `spawn` rather than `spawnSync` for exactly one reason: `spawnSync`
 * blocks the event loop, so no timer can fire while the child runs, so predicate 7 is unmeasurable
 * from a synchronous driver. The instrument dictates the concurrency model here, not taste.
 */
// `dbSandbox` is optional so that Round 285's existing call sites keep compiling, but its DEFAULT is
// a fresh temp path rather than "leave KLATCH_DB alone". Defaulting to the ambient environment would
// mean the safe behaviour had to be remembered at every call site, and the whole point of predicate
// 8 is that the unsafe default was invisible.
export const drive = (
  file: string,
  home: string,
  dbSandbox: string = join(mkdtempSync(join(tmpdir(), 'promote-db-')), 'scratch.db'),
): Promise<DriveResult> =>
  new Promise((resolve) => {
    const baseline = new Set(population());
    const appeared = new Set<string>();
    const vanished = new Set<string>();
    let samples = 0;
    // Predicate 8's "before". Taken inside `drive` rather than around the whole run so a hit names
    // the probe that caused it; a bracket around all N drives would only say that one of them did.
    const dbBefore = snapshot(REPO);

    const started = Date.now();
    // `detached: true` puts the child in its OWN process group so the timeout can kill the group.
    // The first version spawned normally and sent SIGKILL to `npx`; `probe-scan-latency-vs-cap`
    // was then held for `predicate 2 (terminates): hit the 25000 ms budget (real=81092 ms)` — the
    // detection was right and the BUDGET was not, by a factor of three. Cause: `npx` is a shim, and
    // killing a shim does not kill the `tsx` it exec'd, which keeps the stdio pipes open, so
    // `close` does not fire until the grandchild finishes on its own. Theseus's Round 268 finding
    // ("the reaper sends the one signal a shim cannot forward") arriving in my own driver.
    // `KLATCH_DB` is set for the same reason `HOME` is: the default is the thing being protected.
    // `resolveDbPath(undefined)` returns repo-root `klatch.db` (`packages/server/src/dbPath.ts`),
    // so a probe that calls `getDb()` without setting the variable itself opens the REAL database —
    // and, per `db-sentinel.mts`, that file is ignored and untracked, so there is no `git checkout`
    // behind it. The redirect is prevention; the sentinel below is detection. Both, because a probe
    // is free to pass an explicit path and ignore this entirely.
    const child = spawn('npx', ['tsx', join('scripts', file)], {
      cwd: REPO,
      env: { ...process.env, HOME: home, KLATCH_DB: dbSandbox },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    let out = '';
    child.stdout?.on('data', (d: Buffer) => { out += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { out += d.toString(); });

    const sampler = setInterval(() => {
      samples += 1;
      let now: Set<string>;
      try {
        now = new Set(population());
      } catch {
        return; // a directory read can lose a race with a rename; a missed sample is not a finding
      }
      for (const f of now) if (!baseline.has(f)) appeared.add(f);
      for (const f of baseline) if (!now.has(f)) vanished.add(f);
    }, SAMPLE_MS);

    let timedOut = false;
    /**
     * Kills the whole group, and reports whether it could. A negative pid is the group; ESRCH means
     * the group is already gone, which is not an error. Returned rather than swallowed because a
     * budget that silently fails to hold is the defect this replaced.
     */
    const killGroup = (): void => {
      try {
        if (child.pid) process.kill(-child.pid, 'SIGKILL');
      } catch {
        try { child.kill('SIGKILL'); } catch { /* already reaped */ }
      }
    };
    const killer = setTimeout(() => {
      timedOut = true;
      killGroup();
    }, TIMEOUT_MS);
    // A fire killed mid-drive must not leave a detached grandchild behind. Same reasoning as
    // Round 284's `process.on('exit')` for its synthetic seed file.
    process.once('exit', killGroup);

    child.on('close', (code) => {
      clearInterval(sampler);
      clearTimeout(killer);
      process.removeListener('exit', killGroup);
      const dbAfter = snapshot(REPO);
      resolve({
        code,
        out,
        timedOut,
        ms: Date.now() - started,
        appeared: [...appeared].sort(),
        vanished: [...vanished].sort(),
        samples,
        db: compare(dbBefore.graded, dbAfter.graded),
        dbScratch: compare(dbBefore.scratch, dbAfter.scratch),
      });
    });
  });

/** The conclusion line a probe reached, or null if it reached none. Predicate 5's observable. */
export const conclusion = (out: string): string | null => {
  const line = diagnosisLine(out);
  return /^(All \d+ regression checks passed|FAILED — |INCONCLUSIVE — )/.test(line) ? line : null;
};

/** Predicate 6's observable, and the `expect` an entry would carry. */
export const passPin = (out: string): string | null =>
  (out.match(/^All (\d+) regression checks passed/m) || [])[0] ?? null;

export type Verdict = { file: string; promotable: boolean; reason: string; entry?: string };

/**
 * The seven-predicate decision, on two `DriveResult`s. **Exported since Round 289**, at Theseus's
 * Round 288 §1 request: his P arms could show `drive()` *reporting* a moved graded database and
 * could not show this function *branching* on it, because it was module-private — so predicate 8's
 * red limb had never been observed to fire, which is one inch short of the green-forever family
 * Round 287 was built to close. A pure function of two records is the cheapest thing in this file
 * to drive both ways, and the alternative he named (minting a hazardous DEFERRED fixture for
 * `--only` to point at) would have put a database-writing probe in the population to test the check
 * that guards against database-writing probes.
 */
export const evaluate = (file: string, real: DriveResult, empty: DriveResult): Verdict => {
  const no = (reason: string): Verdict => ({ file, promotable: false, reason });

  if (real.timedOut || empty.timedOut) {
    return no(`predicate 2 (terminates): hit the ${TIMEOUT_MS} ms budget (real=${real.ms} ms, emptyHOME=${empty.ms} ms)`);
  }
  // Predicate 8 is checked BEFORE 5/6, deliberately. A probe that writes the real database and then
  // exits 0 with a green conclusion line is the worst case this path has, and grading the outcome
  // first would promote it. The damage is not a property of the verdict.
  if (!unchanged(real.db) || !unchanged(empty.db)) {
    // Two wordings, one grade. Theseus's Round 288 §2 drove the fact behind the split: the `-shm`
    // WAL index EXISTS only while some connection holds the database, so a sidecar-only movement is
    // what a holder arriving or leaving looks like — `npm run dev` on :3001, a sibling worktree's
    // fire ending — and on a tree where the sidecars are live right now there is always an occupant
    // available to make the transition. Calling that "the probe moved the database" is wrong in the
    // same way predicate 7 would be wrong if it claimed the probe moved the population.
    //
    // It is NOT downgraded to a pass, and the reason is one his memo does not have: an
    // uncheckpointed committed write produces the identical signature (`-wal` appeared, main `.db`
    // untouched). Sidecar-only means *indistinguishable*, not *benign* — `probe-round289` arm W
    // generates the signature both ways and shows the bracket reporting them the same. So the
    // change here is the message and only the message.
    const side = sidecarOnly(real.db) && (unchanged(empty.db) || sidecarOnly(empty.db));
    return no(
      side
        ? `predicate 8 (db-preserving): only WAL SIDECARS moved outside .testdata/, no main .db file — ` +
            `realHOME: ${describe(real.db)} · emptyHOME: ${describe(empty.db)}. ` +
            `That is what a connection being acquired or released looks like (a dev server, a sibling ` +
            `fire) AND what an uncheckpointed committed write looks like; the bracket cannot tell them ` +
            `apart. Could be this probe or a concurrent holder; not promotable either way`
        : `predicate 8 (db-preserving): a database OUTSIDE .testdata/ moved across the drive — ` +
            `realHOME: ${describe(real.db)} · emptyHOME: ${describe(empty.db)}. ` +
            `These files are gitignored and untracked: there is no git copy to restore from`,
    );
  }
  const moved = [...real.appeared, ...real.vanished, ...empty.appeared, ...empty.vanished];
  if (moved.length) {
    return no(
      `predicate 7 (population-preserving): the probe-* population MOVED during the drive — ` +
        `${moved.slice(0, 3).join(', ')}${moved.length > 3 ? ` +${moved.length - 3}` : ''}. ` +
        `Could be this probe or a concurrent fire; not promotable either way`,
    );
  }
  const cReal = conclusion(real.out);
  const cEmpty = conclusion(empty.out);
  if (!cReal || !cEmpty) {
    return no(
      `predicate 5 (verdict-bearing): no conclusion line, so the exit code cannot go red ` +
        `(real=${real.code}, emptyHOME=${empty.code})`,
    );
  }
  if (real.code !== empty.code || cReal !== cEmpty) {
    return no(
      `predicate 4 (hermetic): outcome moves when HOME alone changes — ` +
        `real=${real.code}/"${cReal.slice(0, 48)}" vs emptyHOME=${empty.code}/"${cEmpty.slice(0, 48)}"`,
    );
  }
  const pin = passPin(real.out);
  if (real.code !== 0 || !pin) {
    return no(`predicate 6 (green): ${cReal.slice(0, 80)} (exit ${real.code})`);
  }

  return {
    file,
    promotable: true,
    reason: `all 7 · exit 0 both arms · "${pin}" · ${real.ms}/${empty.ms} ms · ${real.samples + empty.samples} population samples`,
    entry: [
      '  {',
      '    // PROMOTED BY: <your round, your fire> — driven by `promote-probes.mts`, which observed',
      '    // predicates 2-7 rather than reading them. Replace this line with the round that pastes it;',
      '    // an attestation with no agent behind it is a comment wearing a warrant\'s clothes.',
      `    file: '${file}',`,
      `    expect: /${pin}/,`,
      `    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): ` +
        `${pin.replace(/^All (\d+).*/, '$1/$1')} green, exit 0 both arms, ${real.ms} ms; population ` +
        `and tree fingerprints for scripts/ and packages/ unchanged across ${real.samples + empty.samples} samples',`,
      '  },',
    ].join('\n'),
  };
};

const main = async (): Promise<void> => {
  const files = population();
  const swept = new Set(SWEPT.map((s) => s.file));

  // Selection. DEFERRED, hazard-clean, and — if `--only` is given — matching. Deliberately not
  // random: stable order means two fires drive disjoint prefixes only if someone promotes in
  // between, which is the intended pressure.
  const skipped: Record<string, string[]> = {};
  const forced: string[] = [];
  const exempted: string[] = [];
  const inadmissible: string[] = [];
  const candidates: string[] = [];
  const readProbe = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
  for (const f of files) {
    if (swept.has(f)) continue;
    if (!DEFERRED.includes(f)) continue; // unclassified — the census owns that red
    if (ONLY && !f.includes(ONLY)) continue;
    const src = readProbe(f);
    const ex = exemptionsApplied(src);
    if (ex.length) exempted.push(`${f} (${ex.join('+')})`);
    const h = hazards(src);
    // Bucketed for the report BEFORE admission can `continue` past it, and that ordering is a
    // repair. The first version checked admission first, and the `not driven (db)` column went
    // 80 → 74 on a change that moved no file's hazards at all — seven files simply stopped reaching
    // the bucketing. **That is Round 296 §8's own warning inverted: there I nearly read an unchanged
    // number as evidence nothing happened; here a changed number would have been evidence of
    // something that did not happen.** A per-class column and a per-file refusal are different
    // questions and both answers are printed.
    if (h.length) for (const k of h) (skipped[k] ??= []).push(f);
    // Admission runs before `--force` can reach it, and THAT ordering is the design. `--force` exists
    // to let a measurement overrule the reading list about **this file's own source**. It was never an
    // argument about a child process: an inherited `net`/`suite`/`model`, or an exemption voided by an
    // unresolvable spawn target, is not a claim about this file that driving this file could refute.
    const bad = admission(f, files, readProbe);
    if (bad.length) {
      inadmissible.push(`${f} — ${bad.join('; ')}`);
      continue;
    }
    if (h.length) {
      // (the `skipped` bucketing for this file happened above, before admission could skip past it)
      // `--force` exists because without it the reading list has the final say, and that contradicts
      // the one sentence this whole path rests on: the drive IS the classification. The filter is
      // over-broad on purpose, and over-breadth costs yield in exactly one observable way —
      // `probe-round244` was PROMOTABLE on this fire's first drive and is excluded by the corrected
      // `homedir` detector, having already been observed green under both HOME arms. A reading that
      // cannot be overruled by a measurement is a comment with a veto.
      //
      // Requires `--only`, so forcing is always a named, deliberate act on a named file, never a
      // blanket "drive everything" that would put a port-binding or model-calling probe in a sweep.
      if (!(FORCE && ONLY)) continue;
      forced.push(`${f} (over ${h.join('+')})`);
    }
    candidates.push(f);
  }

  const budget = ONLY ? candidates.length : Math.min(N, candidates.length);
  const drivable = candidates.slice(0, budget);

  console.log(`promote-probes — ${files.length} probe files · ${swept.size} SWEPT · ${DEFERRED.length} DEFERRED`);
  console.log(`  hazard-clean DEFERRED candidates: ${candidates.length}`);
  for (const [k, v] of Object.entries(skipped).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  not driven (${k}): ${v.length}`);
  }
  console.log(`  driving this run: ${drivable.length}${ONLY ? ` (--only ${ONLY})` : ` of ${candidates.length} (--n ${N})`}`);
  for (const f of drivable) console.log(`    · ${f}`);
  for (const f of forced) console.log(`  FORCED past the reading list: ${f}`);
  // Printed unconditionally, including under `--list`. An exemption that does not appear in the
  // report is a silent widening of what this tool will drive unattended, which is the one property
  // the reading filter exists to keep visible.
  for (const f of exempted) console.log(`  EXEMPT by declaration (literal-only hit): ${f}`);
  // Printed for the same reason exemptions are: this is the one refusal that is NOT a statement about
  // the file's own source, so a reader who checks the file and finds it clean would otherwise have no
  // way to learn why the tool declined it.
  for (const f of inadmissible) console.log(`  INADMISSIBLE (spawn closure, not own source): ${f}`);

  if (LIST_ONLY) {
    console.log('\n--list: selection only, nothing driven.');
    process.exit(drivable.length ? 0 : 2);
  }
  if (!drivable.length) {
    console.log('\nNothing to drive. Either every hazard-clean DEFERRED probe is examined, or --only matched nothing.');
    process.exit(2);
  }

  const before = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
  const emptyHome = mkdtempSync(join(tmpdir(), 'promote-home-'));
  const sandboxDir = mkdtempSync(join(tmpdir(), 'promote-db-'));

  // Reported before any drive so the graded set is visible rather than implicit. If this reads 0,
  // predicate 8 is vacuous and should be distrusted — the same two-sided discipline `probe-round285`
  // arm B applied to the hazard detectors.
  const dbOpen = snapshot(REPO);
  console.log(
    `\ndatabases in scope: ${dbOpen.graded.length} graded (outside .testdata/) · ` +
      `${dbOpen.scratch.length} scratch (under .testdata/, reported not graded)`,
  );
  for (const d of dbOpen.graded) console.log(`  graded · ${d.path} (${d.bytes} bytes, sha ${d.sha})`);

  const verdicts: Verdict[] = [];
  console.log('\ndriving (real HOME, then an empty HOME — one variable; KLATCH_DB redirected in both):');
  for (const f of drivable) {
    const real = await drive(f, process.env.HOME ?? '', join(sandboxDir, `${f}.real.db`));
    const empty = await drive(f, emptyHome, join(sandboxDir, `${f}.empty.db`));
    const v = evaluate(f, real, empty);
    verdicts.push(v);
    console.log(`  [${v.promotable ? 'PROMOTABLE' : 'held     '}] ${f}`);
    console.log(`               ${v.reason}`);
    const scratch = [describe(real.dbScratch), describe(empty.dbScratch)].filter((s) => s !== 'unchanged');
    if (scratch.length) console.log(`               scratch dbs (measurement, not graded): ${scratch.join(' | ')}`);
  }

  const after = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
  const treeMoved = after.scripts !== before.scripts || after.packages !== before.packages;
  const dbClose = compare(dbOpen.graded, snapshot(REPO).graded);

  const promotable = verdicts.filter((v) => v.promotable);
  console.log(`\n${promotable.length} of ${verdicts.length} driven probes are promotable.`);
  console.log(`tree across the whole drive: scripts/ ${treeMoved ? 'MOVED' : 'unchanged'} · packages/ ${after.packages === before.packages ? 'unchanged' : 'MOVED'}`);
  console.log(`graded databases across the whole drive: ${describe(dbClose)}`);

  if (promotable.length) {
    console.log('\n── paste into SWEPT in scripts/sweep-probes.mjs, with your round named ──\n');
    for (const v of promotable) console.log(v.entry);
    console.log('\nand delete each promoted name from DEFERRED — the census requires an exact partition.');
  }

  if (treeMoved || !unchanged(dbClose)) {
    console.log('\nPROMOTE RED — the repo moved across this drive and did not come back. That is this');
    console.log('tool\'s fault, not a probe\'s finding. `git status` before trusting anything above.');
    if (!unchanged(dbClose)) {
      console.log(`A GRADED DATABASE MOVED: ${describe(dbClose)}`);
      console.log('These files are gitignored and untracked — git cannot restore them. Check for a');
      console.log('backup under .testdata/ before doing anything else.');
    }
    process.exit(1);
  }
  console.log('\nPROMOTE OK — drive complete, tree where it was found.');
  process.exit(0);
};

if (process.argv[1] && process.argv[1].endsWith('promote-probes.mts')) {
  void main();
}
