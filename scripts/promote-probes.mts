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
import { stripSource } from './lib/strip-source.mjs';
// @ts-expect-error — sweep-probes.d.mts declares the runtime exports; census() is not among them.
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
  suite: /\b(npm\s+(run\s+)?(test|typecheck)|vitest)\b/,
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

/** Comments blanked so prose cannot vote; strings KEPT so a subprocess command still can. */
export const hazards = (src: string): string[] =>
  Object.entries(DETECTORS)
    .filter(([, re]) => re.test(stripSource(src, false)))
    .map(([k]) => k);

export type DriveResult = {
  code: number | null;
  out: string;
  timedOut: boolean;
  ms: number;
  /** Names that appeared under `scripts/` during the run, and names that vanished. */
  appeared: string[];
  vanished: string[];
  samples: number;
};

/**
 * One drive, sampled. Async `spawn` rather than `spawnSync` for exactly one reason: `spawnSync`
 * blocks the event loop, so no timer can fire while the child runs, so predicate 7 is unmeasurable
 * from a synchronous driver. The instrument dictates the concurrency model here, not taste.
 */
export const drive = (file: string, home: string): Promise<DriveResult> =>
  new Promise((resolve) => {
    const baseline = new Set(population());
    const appeared = new Set<string>();
    const vanished = new Set<string>();
    let samples = 0;

    const started = Date.now();
    // `detached: true` puts the child in its OWN process group so the timeout can kill the group.
    // The first version spawned normally and sent SIGKILL to `npx`; `probe-scan-latency-vs-cap`
    // was then held for `predicate 2 (terminates): hit the 25000 ms budget (real=81092 ms)` — the
    // detection was right and the BUDGET was not, by a factor of three. Cause: `npx` is a shim, and
    // killing a shim does not kill the `tsx` it exec'd, which keeps the stdio pipes open, so
    // `close` does not fire until the grandchild finishes on its own. Theseus's Round 268 finding
    // ("the reaper sends the one signal a shim cannot forward") arriving in my own driver.
    const child = spawn('npx', ['tsx', join('scripts', file)], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
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
      resolve({
        code,
        out,
        timedOut,
        ms: Date.now() - started,
        appeared: [...appeared].sort(),
        vanished: [...vanished].sort(),
        samples,
      });
    });
  });

/** The conclusion line a probe reached, or null if it reached none. Predicate 5's observable. */
export const conclusion = (out: string): string | null => {
  const line = diagnosisLine(out) as string;
  return /^(All \d+ regression checks passed|FAILED — |INCONCLUSIVE — )/.test(line) ? line : null;
};

/** Predicate 6's observable, and the `expect` an entry would carry. */
export const passPin = (out: string): string | null =>
  (out.match(/^All (\d+) regression checks passed/m) || [])[0] ?? null;

type Verdict = { file: string; promotable: boolean; reason: string; entry?: string };

const evaluate = (file: string, real: DriveResult, empty: DriveResult): Verdict => {
  const no = (reason: string): Verdict => ({ file, promotable: false, reason });

  if (real.timedOut || empty.timedOut) {
    return no(`predicate 2 (terminates): hit the ${TIMEOUT_MS} ms budget (real=${real.ms} ms, emptyHOME=${empty.ms} ms)`);
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
  const swept = new Set((SWEPT as { file: string }[]).map((s) => s.file));

  // Selection. DEFERRED, hazard-clean, and — if `--only` is given — matching. Deliberately not
  // random: stable order means two fires drive disjoint prefixes only if someone promotes in
  // between, which is the intended pressure.
  const skipped: Record<string, string[]> = {};
  const forced: string[] = [];
  const candidates: string[] = [];
  for (const f of files) {
    if (swept.has(f)) continue;
    if (!(DEFERRED as string[]).includes(f)) continue; // unclassified — the census owns that red
    if (ONLY && !f.includes(ONLY)) continue;
    const h = hazards(readFileSync(join(SCRIPTS, f), 'utf8'));
    if (h.length) {
      for (const k of h) (skipped[k] ??= []).push(f);
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

  console.log(`promote-probes — ${files.length} probe files · ${swept.size} SWEPT · ${(DEFERRED as string[]).length} DEFERRED`);
  console.log(`  hazard-clean DEFERRED candidates: ${candidates.length}`);
  for (const [k, v] of Object.entries(skipped).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  not driven (${k}): ${v.length}`);
  }
  console.log(`  driving this run: ${drivable.length}${ONLY ? ` (--only ${ONLY})` : ` of ${candidates.length} (--n ${N})`}`);
  for (const f of drivable) console.log(`    · ${f}`);
  for (const f of forced) console.log(`  FORCED past the reading list: ${f}`);

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

  const verdicts: Verdict[] = [];
  console.log('\ndriving (real HOME, then an empty HOME — one variable):');
  for (const f of drivable) {
    const real = await drive(f, process.env.HOME ?? '');
    const empty = await drive(f, emptyHome);
    const v = evaluate(f, real, empty);
    verdicts.push(v);
    console.log(`  [${v.promotable ? 'PROMOTABLE' : 'held     '}] ${f}`);
    console.log(`               ${v.reason}`);
  }

  const after = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
  const treeMoved = after.scripts !== before.scripts || after.packages !== before.packages;

  const promotable = verdicts.filter((v) => v.promotable);
  console.log(`\n${promotable.length} of ${verdicts.length} driven probes are promotable.`);
  console.log(`tree across the whole drive: scripts/ ${treeMoved ? 'MOVED' : 'unchanged'} · packages/ ${after.packages === before.packages ? 'unchanged' : 'MOVED'}`);

  if (promotable.length) {
    console.log('\n── paste into SWEPT in scripts/sweep-probes.mjs, with your round named ──\n');
    for (const v of promotable) console.log(v.entry);
    console.log('\nand delete each promoted name from DEFERRED — the census requires an exact partition.');
  }

  if (treeMoved) {
    console.log('\nPROMOTE RED — the tree moved across this drive and did not come back. That is this');
    console.log('tool\'s fault, not a probe\'s finding. `git status` before trusting anything above.');
    process.exit(1);
  }
  console.log('\nPROMOTE OK — drive complete, tree where it was found.');
  process.exit(0);
};

if (process.argv[1] && process.argv[1].endsWith('promote-probes.mts')) {
  void main();
}
