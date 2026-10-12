/**
 * probe-round373 — **the sweep's two RED hint legs ran backwards from their witnesses: the one that
 * shipped cannot fire over this population, and the one that can fire did not exist.**
 *
 * Round 372 (Theseus) closed the per-probe-row residue by extracting `probeRowAnnotations` out of
 * `main()` and keying the two BLOCKED verdict wordings on the exit-code limb. It carried the RED
 * hint leg over as it found it, deliberately and with the reason stated: `blockedKind` has nothing
 * to say about a non-BLOCKED state, so a hint beside a red is the one register in which a
 * flag-keyed predicate is honest. That reasoning is right and is not what this round changes.
 *
 * What it changes is which hints exist. Over the real registry there are exactly two declared
 * patterns, both on `probe-round225` — a refusal text and a hard-skip label — so a RED run can
 * carry either flag. The shipped function hinted at **one** of them:
 *
 *   - `RED` + the declared REFUSAL text → a hint, pinned by Round 372's own section B.
 *   - `RED` + the declared SKIP label → **nothing at all**. The row printed the state, the exit
 *     code and the summary line, and said nothing about an arm of that run not having run.
 *
 * **The asymmetry runs exactly opposite to the reachability, and Round 372 is what measured that.**
 * Its section D established that `probe-round225` prints the prose "with its declared refusal text
 * present" plus its child's exit/duration counts, never the child's text: on a held `:3001` its
 * declared refusal occurs **0 times** in its own 10210-byte output. So the hint leg that shipped
 * needs the subject to start echoing its child before it can ever fire. The missing leg needs no
 * code change anywhere: the `did not run: <label>` line is emitted by the shared outcome module's
 * **failure** limb as well as its skip limb (`probe-outcome.mts`, the `reasons` array of the
 * `failed.length > 0` return), so a held port plus one broken check is an exit **1** that carries
 * the declared label — a regression, which is the event the sweep exists to report.
 *
 * That run is the one where the hint is worth most, because the skipped arm changes what the
 * failure can be attributed to, and it is the run that said the least.
 *
 * Section A grades the cure over the tuple set the real `classify` can produce, under a member-list
 * selector that is deliberately not Round 372's. Section B is the live half: a child minted into a
 * gitignored sandbox is driven through the real `summariseAndExit` with one broken hard check and
 * one declared hard skip, and its REAL bytes and REAL exit code go through the real `classify`
 * against the REAL registry's patterns — so the state this round is about is reached by the shared
 * module's own output rather than by a fixture written to look like it. Section C removes the leg
 * from the real bytes in the sandbox and asserts that the section A and section B properties both
 * go red, so neither is a check that would have passed either way.
 *
 * NOT claimed: that this state has ever been printed by a live sweep — it has not, and the honest
 * word for the defect is latent, exactly as Round 372 said of the residue it closed. That
 * `probe-round225` is the only probe that COULD declare either pattern; the claim is the measured
 * member list of those that do, re-derived here under a different selector. That the RED hint
 * wordings are pinned beyond the one property that matters — that they carry neither verdict
 * phrase, so a hint cannot be read as the verdict it sits under. That the held-port full sweep
 * recorded below is re-driven every fire: it costs an occupied `:3001` for 167 s and is carried as
 * a labelled measurement.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT, classify, probeRowAnnotations, type ProbeState } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const SANDBOX = join(HERE, '..', '.testdata', 'round373');

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

/** The phrases that make a row a VERDICT. A hint must carry neither — Round 372 B8, kept. */
const VERDICT_PHRASE = ['could not run', 'ran but did not finish'] as const;
/** The property this round adds, quoted from the shipped lines rather than paraphrased. */
const SKIP_HINT = 'a declared hard skip is present at a non-3 exit';
const REFUSAL_HINT = 'declared refusal text is present at a non-2 exit';

const sweepSrc = readFileSync(SWEEP, 'utf8');
const r225 = SWEPT.find((s) => s.file === R225)!;

// ── Section A — the member list, the tuple set, and the leg that was missing from it ──

/**
 * The member list, re-derived under a selector that is NOT Round 372 A2's. That arm reads the
 * imported objects (`SWEPT.filter((s) => s.refusal || s.skip)`); this one reads the registry's
 * SOURCE TEXT and attributes each declaration line to the nearest preceding `file:` line. Two keys
 * that share what SELECTS the population agree vacuously (Round 339), and the agreement is the
 * whole value of re-deriving a figure someone else published.
 */
const srcLines = sweepSrc.split('\n');
const owners: string[] = [];
let currentFile = '(none)';
for (const line of srcLines) {
  const m = /^\s*file: '([^']+)',/.exec(line);
  if (m) currentFile = m[1];
  if (/^\s*(refusal|skip): \//.test(line)) owners.push(currentFile);
}
// Known positive for the resolver, copied from the real call shape rather than analogised: the
// same nearest-preceding-`file:` walk must attribute round225's own `expect:` line to round225.
let kpOwner = '(none)';
let kpFile = '(none)';
for (const line of srcLines) {
  const m = /^\s*file: '([^']+)',/.exec(line);
  if (m) kpFile = m[1];
  if (/^\s*expect: \/All 33 regression checks passed\//.test(line)) kpOwner = kpFile;
}
check(
  'A1',
  'the resolver finds its known positive first: the nearest-preceding-`file:` walk attributes ' +
    `round225's own \`expect:\` line to ${kpOwner}`,
  kpOwner === R225,
);
check(
  'A2',
  'and under that independent selector the declared-pattern member list is exactly [round225] ' +
    `twice over — one refusal and one skip, both on it, none anywhere else (${owners.length} ` +
    'declaration line(s) found)',
  owners.length === 2 && owners.every((o) => o === R225),
);

type Tuple = { state: ProbeState; code: number | null; refused: boolean; skipped: boolean };
const EXPECT_LINE = r225.expect.source;
const REFUSAL_LINE = `  ${r225.refusal!.source}`;
const SKIP_LINE = `  did not run: ${r225.skip!.source}`;
const tuples: Tuple[] = [];
const seen = new Set<string>();
for (const code of [0, 1, 2, 3]) {
  for (const withExpect of [false, true]) {
    for (const withRefusal of [false, true]) {
      for (const withSkip of [false, true]) {
        const out = [
          'probe-round225 driving',
          withExpect ? EXPECT_LINE : '',
          withRefusal ? REFUSAL_LINE : '',
          withSkip ? SKIP_LINE : '',
        ].join('\n');
        const c = classify(code, out, r225.expect, r225.refusal, r225.skip);
        const t: Tuple = { state: c.state, code: c.code, refused: c.refused, skipped: c.skipped };
        const k = JSON.stringify(t);
        if (!seen.has(k)) {
          seen.add(k);
          tuples.push(t);
        }
      }
    }
  }
}
const rowOf = (t: Tuple) => probeRowAnnotations(t).join('\n');
const redSkipped = tuples.filter((t) => t.state === 'RED' && t.skipped);
meas(
  'A3m',
  `${tuples.length} distinct tuples through the real classify; ${redSkipped.length} are RED ` +
    `carrying the declared skip label (${redSkipped.map((t) => `${t.code}/r${+t.refused}s${+t.skipped}`).join(' ')})` +
    ' — members of the same enumeration Round 372 section B reads, and no check in it reads these',
);
check(
  'A3',
  'every RED tuple carrying the declared skip label is annotated — the leg this round adds. ' +
    'Before it, each of these rows printed NOTHING about an arm of the run not having run',
  redSkipped.length > 0 && redSkipped.every((t) => rowOf(t).includes(SKIP_HINT)),
);
check(
  'A4',
  'it is a HINT and not a verdict: no RED row carries either verdict phrase, so a reader cannot ' +
    'read a blockage out of a row this sweep is counting as red',
  tuples
    .filter((t) => t.state === 'RED')
    .every((t) => VERDICT_PHRASE.every((p) => !rowOf(t).includes(p))),
);
check(
  'A5',
  'and the two RED legs are independent rather than exclusive: a red carrying BOTH declared ' +
    'patterns gets both hints, because at a non-BLOCKED state there is no limb to choose between ' +
    'them — which is why these are hints and the BLOCKED wordings are keyed on the limb',
  (() => {
    const both = tuples.filter((t) => t.state === 'RED' && t.refused && t.skipped);
    return (
      both.length > 0 &&
      both.every((t) => rowOf(t).includes(SKIP_HINT) && rowOf(t).includes(REFUSAL_HINT))
    );
  })(),
);

// ── Section B — the live half: the state reached through the shared module's own output ──

mkdirSync(SANDBOX, { recursive: true });
const CHILD = join(SANDBOX, 'child-one-broken-check-and-one-hard-skip.mts');
// Minted rather than hand-written output: the label carries round225's DECLARED skip pattern
// verbatim, so the real `classify` below is keyed on the registry and not on a string invented here.
writeFileSync(
  CHILD,
  "import { summariseAndExit } from '../../scripts/lib/probe-outcome.mts';\n" +
    'summariseAndExit({\n' +
    "  probeName: 'r373-minted-child',\n" +
    '  results: [\n' +
    "    { arm: 'K1', check: 'a check that establishes', pass: true, kind: 'regression' },\n" +
    "    { arm: 'K2', check: 'a check that breaks', pass: false, kind: 'regression' },\n" +
    '  ],\n' +
    "  skipped: ['arm B: the drive of probe-round223b (minted, Round 373)'],\n" +
    '});\n',
  'utf8',
);
const childRun = spawnSync('npx', ['tsx', CHILD], {
  cwd: join(HERE, '..'),
  encoding: 'utf8',
  timeout: 120_000,
});
const childOut = `${childRun.stdout ?? ''}${childRun.stderr ?? ''}`;
const labelLines = childOut
  .split('\n')
  .filter((l) => l.includes('did not run:') && l.search(r225.skip!) >= 0);
check(
  'B1',
  'the shared outcome module emits the declared `did not run:` label on its FAILURE limb and not ' +
    'only on its skip limb: one broken hard check plus one hard skip exits ' +
    `${String(childRun.status)} (1, not 3 — the failure limb dominates) with ${labelLines.length} ` +
    'matching label line(s)',
  childRun.status === 1 && labelLines.length === 1,
);
const live = classify(childRun.status, childOut, r225.expect, r225.refusal, r225.skip);
check(
  'B2',
  'and the REAL classify, against the REAL registry patterns, calls that run ' +
    `${live.state} refused=${live.refused} skipped=${live.skipped} — the RED-plus-declared-skip ` +
    'state, reached by the shared module rather than by a fixture shaped to look like it',
  live.state === 'RED' && live.skipped === true && live.refused === false,
);
const liveRow = probeRowAnnotations(live).join('\n');
check(
  'B3',
  'the row for that real run now carries the hint, and still carries neither verdict phrase',
  liveRow.includes(SKIP_HINT) && VERDICT_PHRASE.every((p) => !liveRow.includes(p)),
);
const r225Src = readFileSync(join(HERE, R225), 'utf8');
const refusalInSubject = (r225Src.match(/probe-round223b: something already holds 3001/g) || []).length;
check(
  'B4',
  `the mirror leg has no witness from the subject's own bytes either: the declared refusal text ` +
    `occurs ${refusalInSubject} times in \`probe-round225\`, so the only route to it reaching that ` +
    "probe's output is the child-echo Round 372 measured as not happening",
  refusalInSubject === 0,
);
meas(
  'B5m',
  'the full driving sweep on a HELD `:3001`, driven once in Round 373 and RECORDED here rather ' +
    'than re-driven every fire (cost: an occupied port for 167 s) — the reading neither seat had, ' +
    'because Round 372 measured round225 directly and not the row the sweep prints beside it: ' +
    'SWEEP BLOCKED — 38 of 39 green, 0 red, 1 blocked (0 could not run, 1 ran but did not ' +
    'finish), sweep exit 2; the one BLOCKED row is round225 at exit 3 and it carries the skip ' +
    'verdict wording and NO refusal hint, which is Round 372 section D confirmed at the sweep ' +
    'level. :3001 read free via the real library before and after, bound by the measuring process ' +
    'and released in it.',
);

// ── Section C — the leg removed from the real bytes, so neither section is vacuous ──

const ANCHOR = "if (state === 'RED' && skipped) {";
const NEIGHBOUR = "if (state === 'RED' && refused) {";
const counts = [ANCHOR, NEIGHBOUR].map((a) => sweepSrc.split(a).length - 1);
check(
  'C1',
  `both guards occur exactly once in the shipped source (${counts.join('/')}), so the mutation ` +
    'below lands on the new leg and not on the near-identical neighbour a `String.replace` would ' +
    'otherwise take (Round 347)',
  counts.every((n) => n === 1),
);
const MUTANT = join(SANDBOX, 'sweep-probes.mjs');
const mutatedSrc = sweepSrc.replace(ANCHOR, "if (state === 'NO-SUCH-STATE' && skipped) {");
// The sandbox copy resolves the one relative import the real module has, so the mutant is the real
// module minus one guard rather than a module that fails to load for an unrelated reason.
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
writeFileSync(MUTANT, mutatedSrc, 'utf8');
check(
  'C1b',
  'the mutation changed the one guard it declared and nothing else — the neighbour is untouched, ' +
    'so what section C observes is attributable to this leg',
  mutatedSrc !== sweepSrc &&
    mutatedSrc.split(ANCHOR).length - 1 === 0 &&
    mutatedSrc.split(NEIGHBOUR).length - 1 === 1,
);
const without = (await import(pathToFileURL(MUTANT).href)) as {
  probeRowAnnotations: typeof probeRowAnnotations;
};
const mutantRow = (t: Tuple) => without.probeRowAnnotations(t).join('\n');
check(
  'C2',
  'with the leg gone, A3 FAILS and the rows it grades are EMPTY — the defect driven back into ' +
    'existence rather than described, and a reading of what the shipped sweep said about these ' +
    'runs before this round',
  !redSkipped.every((t) => mutantRow(t).includes(SKIP_HINT)) &&
    redSkipped.filter((t) => !t.refused).every((t) => mutantRow(t) === ''),
);
check(
  'C3',
  "and B3's property fails on the real minted run too, so the live half is not a check that " +
    'would have passed either way',
  !mutantRow(live).includes(SKIP_HINT),
);
check(
  'C4',
  'the mutation is NARROW: every tuple that is not a RED carrying the declared skip label is ' +
    'annotated byte-identically under both versions, including every BLOCKED row Round 372 keyed ' +
    'on the limb',
  (() => {
    const others = tuples.filter((t) => !(t.state === 'RED' && t.skipped));
    return others.length > 0 && others.every((t) => mutantRow(t) === rowOf(t));
  })(),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round373', results });
