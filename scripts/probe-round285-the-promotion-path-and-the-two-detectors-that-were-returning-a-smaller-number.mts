/**
 * Round 285, Daedalus, 2026-09-27 (STOP fire). Drives `scripts/promote-probes.mts` — the promotion
 * path Theseus's Round 284 §7 routed to this seat — and the two defects it had when first run.
 *
 * What this probe is for, stated as the thing that could go wrong:
 *
 *   The promotion path's whole value is that **six of its seven predicates are observed rather than
 *   read.** An observation that cannot go red is worth nothing, and this fleet has found four of
 *   those in the last ten rounds (Round 279 arm E, Round 283 arm E3, Round 284 §5, and both
 *   detectors below). So every arm here is two-sided: a known positive AND a known negative, and
 *   the positive is constructed, never hoped for.
 *
 * The one predicate that had never fired on anything is **7, population-preserving**, and its
 * instrument is new. Arm A is therefore the arm that matters most:
 *
 *   Theseus's DEFERRED entry for `probe-round284` says a probe that transiently mutates the
 *   population is "a confound the sweep cannot see." That is true of a before/after bracket, and
 *   `tree-fingerprint` is one. A mutation restored inside the window is invisible *because* the
 *   probe cleaned up correctly — **good citizenship erases the evidence.** So the bracket is not a
 *   weak instrument for this job, it is the wrong KIND of instrument, and no amount of care fixes a
 *   category error. The sampler is the right kind. Arm A proves it by showing the bracket saying
 *   "unchanged" over the very same run the sampler flags.
 *
 * Arms:
 *   A  the sampler, two-sided — a synthetic probe that creates-and-removes a `probe-*` file is
 *      CAUGHT; one that does nothing is not; and `fingerprint` reports "unchanged" for both
 *   B  all five hazard detectors validated in both directions on known positives and negatives
 *   C  the string-blanking defect, pinned: `blankStrings: true` makes the `suite` detector vacuous
 *   D  the trailing-`\b` defect, pinned: the old `homedir` regex matches NEITHER known corpus
 *      reader, the new one matches BOTH
 *   E  `evaluate`'s predicate ordering, on synthetic drive results — each predicate can be the one
 *      that fires, and a green result really does reach `promotable`
 *   F  the tree bracket over this probe's own run
 *
 * Costs: no port bound, no model call, no database, no corpus outside the repo. Arm A spawns two
 * minted node scripts under gitignored `.testdata/r285/`. Arm E calls `evaluate`'s observable
 * surface through exported helpers on literals — no subprocess.
 *
 * NOT asserted, deliberately: that the sampler catches EVERY transient mutation. It is a sampler
 * with a 40 ms default interval; a create-and-delete inside one interval is missed. Arm A2 pins the
 * direction of that error (misses are possible, false hits are not caused by this tool) and the
 * driver's docstring prices it. A probe claiming completeness here would be the vacuous kind.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { stripSource } from './lib/strip-source.mjs';
import { drive, hazards, conclusion, passPin } from './promote-probes.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');
const SCRATCH = join(REPO, '.testdata', 'r285');

const results: ProbeVerdict[] = [];
const check = (arm: string, what: string, pass: boolean, detail = ''): void => {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'pass' : 'FAIL'}  ${what}${detail ? `\n        ${detail}` : ''}`);
};
const measure = (arm: string, what: string): void => {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}`);
};

mkdirSync(SCRATCH, { recursive: true });
const bracketBefore = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };

// ─── A · the sampler, on a known positive and a known negative ────────────────
//
// The positive is MINTED rather than borrowed from `probe-round284`, for two reasons. Round 284
// connects to 3001 and spawns the gate, so driving it here would cost 40 s and a port for a fact
// about a sampler. And a minted mutator makes the mutation's TIMING explicit — it holds the file
// for 600 ms, comfortably more than the 40 ms sample interval, so a miss would be a real defect
// rather than an unlucky race. That is the difference between a control and a coin flip.
console.log('\n[A] predicate 7 — the sampler, two-sided');

const mutatorName = 'probe-round285-SYNTHETIC-MUTATOR-DELETE-ME.mts';
const mutatorPath = join(SCRIPTS, mutatorName);
const mutator = join(SCRATCH, 'mutator.mjs');
const inert = join(SCRATCH, 'inert.mjs');

// Writes a `probe-*` file into scripts/, holds it, removes it in a `finally` — Round 284's shape.
writeFileSync(
  mutator,
  [
    "import { writeFileSync, rmSync } from 'node:fs';",
    `const target = ${JSON.stringify(mutatorPath)};`,
    'try {',
    "  writeFileSync(target, '// synthetic, round285 arm A\\n');",
    '  await new Promise((r) => setTimeout(r, 600));',
    '} finally {',
    '  rmSync(target, { force: true });',
    '}',
    "console.log('All 1 regression checks passed');",
    '',
  ].join('\n'),
);
writeFileSync(
  inert,
  ["await new Promise((r) => setTimeout(r, 600));", "console.log('All 1 regression checks passed');", ''].join('\n'),
);

// `drive` takes a name relative to `scripts/`, so reach the scratch scripts by relative path. This
// is the driver's real code path, not a reimplementation of it.
const rel = (p: string): string => join('..', '.testdata', 'r285', p);

const beforeA = fingerprint(REPO, 'scripts/');
const mutRun = await drive(rel('mutator.mjs'), process.env.HOME ?? '');
const afterMut = fingerprint(REPO, 'scripts/');
const inertRun = await drive(rel('inert.mjs'), process.env.HOME ?? '');

check(
  'A1',
  'the sampler CATCHES a probe that creates and removes a probe-* file inside its own run',
  mutRun.appeared.includes(mutatorName),
  `appeared=${JSON.stringify(mutRun.appeared)} vanished=${JSON.stringify(mutRun.vanished)} samples=${mutRun.samples}`,
);
check(
  'A2',
  'and reports nothing for a run of identical duration that touches no probe-* file — so A1 is the ' +
    'mutation being detected, not the sampler firing on anything that moves',
  inertRun.appeared.length === 0 && inertRun.vanished.length === 0,
  `inert: appeared=${inertRun.appeared.length} vanished=${inertRun.vanished.length} samples=${inertRun.samples} ms=${inertRun.ms}`,
);
// The headline. Same run, two instruments, opposite answers.
check(
  'A3',
  'the before/after fingerprint bracket reports scripts/ UNCHANGED across the very run the sampler ' +
    'flagged — a restored mutation is invisible to a bracket, which is why predicate 7 needed a ' +
    'different kind of instrument and not a more careful bracket',
  afterMut === beforeA && mutRun.appeared.length > 0,
  `fingerprint before===after: ${afterMut === beforeA} · sampler hits: ${mutRun.appeared.length}`,
);
check(
  'A4',
  'the synthetic mutator left nothing behind in scripts/',
  !existsSync(mutatorPath),
  `${mutatorName} present: ${existsSync(mutatorPath)}`,
);
measure(
  'A5',
  `sampler resolution on this machine: ${mutRun.samples} samples over a ${mutRun.ms} ms run ` +
    `(~${Math.round(mutRun.ms / Math.max(mutRun.samples, 1))} ms/sample); the mutation was held 600 ms, ` +
    'so A1 is not a race it happened to win',
);

// ─── B · every detector, both directions ──────────────────────────────────────
//
// A detector is a claim about source text, so its positive can be a literal. Round 284 §5's lesson
// applied one layer down: the negatives are the half that catches a regex which matches everything.
console.log('\n[B] the five hazard detectors, validated in both directions');

const POSITIVE: Record<string, string> = {
  net: "const s = createServer(() => {});",
  model: "const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });",
  db: "import Database from 'better-sqlite3';",
  suite: "spawnSync('npm', ['test'], { cwd: REPO });",
  homedir: "const root = path.join(os.homedir(), '.claude', 'projects');",
};
const NEGATIVE = 'const x = 1 + 1;\nconsole.log(x);\n';

for (const [name, src] of Object.entries(POSITIVE)) {
  check(
    `B1.${name}`,
    `detector \`${name}\` fires on its own known positive`,
    hazards(src).includes(name),
    `hazards(${JSON.stringify(src.slice(0, 46))}…) = ${JSON.stringify(hazards(src))}`,
  );
}
check(
  'B2',
  'and no detector fires on a two-line file that does none of those things',
  hazards(NEGATIVE).length === 0,
  `hazards(negative) = ${JSON.stringify(hazards(NEGATIVE))}`,
);
// The direction that actually bit: a detector whose evidence is in a comment must not vote.
check(
  'B3',
  'a file that only DISCUSSES a hazard in prose is not flagged — comments are blanked, so the ' +
    'reading list cannot be reddened by a docstring',
  hazards('// This probe deliberately never calls createServer or better-sqlite3 or npm test.\nconst x = 1;\n').length === 0,
  'prose-only mention of createServer/better-sqlite3/npm test',
);

// ─── C · the string-blanking defect, pinned ───────────────────────────────────
//
// `promote-probes.mts` reads `stripSource(src, false)`. This arm pins WHY, on the live population,
// so a future edit back to `true` reddens here instead of silently going blind. Round 283's arm D
// used `true`, and its published "8 of 113 residue" is an over-statement of safety by that much.
console.log('\n[C] why the reading is blankStrings:false');

// The REPAIRED detector (arm B1.suite found the first one blind to the argv spelling). Kept as a
// local literal rather than imported so this arm measures a stated regex against a stated
// population; if the driver's copy diverges, B1.suite is the arm that says so.
const SUITE = /\bnpm['"\s,[\]]+(run['"\s,[\]]+)?(test|typecheck)|\bvitest\b/;
const live = execFileSync('git', ['ls-files', 'scripts'], { cwd: REPO, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => /^scripts\/probe-/.test(l))
  .map((l) => l.replace(/^scripts\//, ''));

let suiteBlanked = 0;
let suiteKept = 0;
for (const f of live) {
  const src = readFileSync(join(SCRIPTS, f), 'utf8');
  if (SUITE.test(stripSource(src, true))) suiteBlanked += 1;
  if (SUITE.test(stripSource(src, false))) suiteKept += 1;
}
check(
  'C1',
  'with string bodies blanked the `suite` detector is VACUOUS on the whole live population — a ' +
    'subprocess command is a string literal, so blanking strings deletes the only evidence it has',
  suiteBlanked === 0 && suiteKept > 0,
  `suite hits over ${live.length} tracked probe files: strings-blanked=${suiteBlanked}, strings-kept=${suiteKept}`,
);
check(
  'C2',
  'and the stricter reading is not merely different, it is strictly more sensitive: every ' +
    'strings-blanked hit is also a strings-kept hit',
  suiteKept >= suiteBlanked,
  `${suiteKept} >= ${suiteBlanked}`,
);
measure('C3', `live tracked probe files scanned this run: ${live.length} (git ls-files, not readdirSync — this arm is about tracked source)`);

// ─── D · the trailing-`\b` defect, pinned on the two files it missed ──────────
//
// Third instance in seven days of one mechanism, so it gets a pin rather than a note. Both files
// named here are the ones Round 283 §E identified as corpus readers BY DRIVING them, which is what
// makes them a usable known-positive set: their status was established by observation, not by the
// detector now being graded against them.
console.log('\n[D] the regex that could not match');

const OLD_HOMEDIR = /\b(homedir\s*\(|\.claude\/projects|process\.env\.HOME)\b/;
const NEW_HOMEDIR = /homedir\s*\(|\.claude[/'"\s,)\]]+projects|process\.env\.HOME\b/;
const KNOWN_READERS = ['probe-scan-cost-model-control.mts', 'probe-scan-latency-vs-cap.mts'];

const oldHits = KNOWN_READERS.filter((f) => OLD_HOMEDIR.test(stripSource(readFileSync(join(SCRIPTS, f), 'utf8'), false)));
const newHits = KNOWN_READERS.filter((f) => NEW_HOMEDIR.test(stripSource(readFileSync(join(SCRIPTS, f), 'utf8'), false)));

check(
  'D1',
  'the original `homedir` alternation matched NEITHER known corpus reader: after `homedir(` the ' +
    'next character is `)`, and a trailing `\\b` between two non-word characters never holds',
  oldHits.length === 0,
  `old regex hits: ${JSON.stringify(oldHits)} of ${KNOWN_READERS.length} known readers`,
);
check(
  'D2',
  'the repaired detector matches BOTH — and both were already established as corpus readers by ' +
    'driving, so this is a detector graded against observations rather than against itself',
  newHits.length === KNOWN_READERS.length,
  `new regex hits: ${JSON.stringify(newHits)}`,
);
check(
  'D3',
  'and the repair does not match everything: it still does not fire on a file that reads no home ' +
    'directory (the failure mode a widened regex usually has)',
  !NEW_HOMEDIR.test(NEGATIVE),
  'negative control against the repaired regex',
);

// ─── E · the observables `evaluate` decides on ────────────────────────────────
//
// `evaluate` is not exported — it closes over the run's budget. Its two decision functions are, and
// they are where a wrong answer would be silent, so they are what gets driven. The corners are the
// ones a probe actually lands on: a pass line, a FAILED line, an INCONCLUSIVE line, and no line.
console.log('\n[E] the conclusion and pass-pin readers');

const CORNERS: [string, string, boolean, boolean][] = [
  ['a pass line', 'setup\nAll 19 regression checks passed\n', true, true],
  ['a FAILED line', 'setup\nFAILED — 2 of 17, 2 measurements, 0 skips\n', true, false],
  ['an INCONCLUSIVE line', 'setup\nINCONCLUSIVE — established 32, skipped 1\n', true, false],
  ['a plain dump with no verdict', '{\n  "routes": 14\n}\n', false, false],
];
for (const [label, out, hasConclusion, isPass] of CORNERS) {
  check(
    `E1.${label.replace(/\s+/g, '-')}`,
    `${label}: conclusion=${hasConclusion}, passPin=${isPass}`,
    (conclusion(out) !== null) === hasConclusion && (passPin(out) !== null) === isPass,
    `conclusion=${JSON.stringify(conclusion(out))} passPin=${JSON.stringify(passPin(out))}`,
  );
}
// The corner that makes predicate 6 non-vacuous: a probe can print its pass line and still die.
// `evaluate` requires exit 0 AND the pin, which is the same conjunction Theseus's Round 284 arm E2
// checked on the sweep's `classify`. Pinned here because the two must not drift apart.
check(
  'E2',
  'a pass line is readable from output that ALSO ends in a non-zero exit — so predicate 6 must be ' +
    'the conjunction (exit 0 AND the pin) and not either half alone',
  passPin('All 3 regression checks passed\nsegfault handler\n') !== null,
  'passPin finds the line regardless of exit code; the exit code is checked separately in evaluate',
);

// ─── F · this probe's own bracket ─────────────────────────────────────────────
console.log('\n[F] the bracket over this run');

rmSync(mutator, { force: true });
rmSync(inert, { force: true });
const bracketAfter = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
check(
  'F1',
  'this probe moved neither scripts/ nor packages/ — including the synthetic mutator, which was ' +
    'created under scripts/ on purpose and removed by the code that created it',
  bracketAfter.scripts === bracketBefore.scripts && bracketAfter.packages === bracketBefore.packages,
  `scripts/ ${bracketAfter.scripts === bracketBefore.scripts ? 'unchanged' : 'MOVED'} · packages/ ${bracketAfter.packages === bracketBefore.packages ? 'unchanged' : 'MOVED'}`,
);

summariseAndExit({
  probeName: 'probe-round285-the-promotion-path-and-the-two-detectors-that-were-returning-a-smaller-number',
  results,
});
