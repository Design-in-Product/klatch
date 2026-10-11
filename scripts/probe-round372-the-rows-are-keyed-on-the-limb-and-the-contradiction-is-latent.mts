/**
 * probe-round372 — **the per-probe rows are keyed on the limb, and the contradiction they could
 * have printed is latent rather than live.**
 *
 * Closes the residue `blockedKind` named in Round 369 and that neither Daedalus nor I had examined
 * for two rounds. Round 369 re-keyed the sweep's VERDICT LINE from the `refused`/`skipped` flags
 * onto the exit-code limb, because the flags are independent predicates over one output and the
 * counters derived from them do not partition `blocked`. It left the four PER-PROBE annotation
 * lines in `main()` flag-keyed. A BLOCKED run carrying both a declared refusal text and a declared
 * `did not run:` label therefore printed both verdict annotations — "could not run" and "ran but
 * did not finish" — about one run, while the verdict line beneath it attributed exactly one kind.
 * For an exit-3 run "could not run" is not a gentler phrasing of the same fact, it is false.
 *
 * **What this round adds that Round 369 could not: the measurement, not a second argument.** That
 * docblock carried an explicit NOT-claimed — whether `probe-round225`'s live blocked output trips
 * both flags — and named the instrument it was missing: the occupied-port cell, with `:3001` free
 * both ends of the fire. Driven here, in Round 372, by binding `:3001` in-process and releasing it
 * in the same process, the answer is **no, and in three independent ways**:
 *
 *   1. exactly ONE SWEPT entry declares either pattern — `probe-round225`, which declares both.
 *      No entry declares a refusal only or a skip only, so it is the only entry that can reach
 *      either BLOCKED limb and every BLOCKED run the sweep can produce comes from it;
 *   2. driven on a HELD `:3001` it exits **3 with `refused: false, skipped: true`**. Its declared
 *      refusal `/probe-round223b: something already holds 3001/` occurs **0 times** in its own
 *      output — it prints the prose "with its declared refusal text present" and its child's
 *      exit/duration counts, never the child's text. The both-flags run is reachable by
 *      construction through `classify` and is not the run that occurs;
 *   3. the refusal limb has no witness from the other side either: `probe-round225` has **0** live
 *      `process.exit(` and exactly **1** `summariseAndExit(`, whose outcome code is typed
 *      `0 | 1 | 3`. It cannot exit 2, so `(code === 2 && refused)` is unreachable over this
 *      population and "could not run" cannot print at all today.
 *
 * So the residue was a **latent** defect, and the row it would have mis-worded has never been
 * printed. That is the reason to fix it on the KEY and not on the wording, and the reason to pin
 * all three reachability facts rather than leave the latency to be re-assumed: one declaration — a
 * second entry's refusal pattern, or this one echoing its child's output — makes the contradiction
 * live, and nothing in the sweep's output would announce the change. Section D reds in that case,
 * and its red says re-measure.
 *
 * **Why the rows had to be extracted to be graded at all.** `main()` held the key inline, so a
 * grader at the call site could only re-implement the key it was grading — Daedalus's Round 369 §2
 * on my own Round 368 grader, which pinned a verdict line by re-spelling it from a memo's prose,
 * and my Round 369 lesson that a pin recomputing what it grades is hollow. `probeRowAnnotations`
 * is therefore an exported function returning its lines, `main()` prints what it returns, and
 * section C drives the residue back into existence by mutating the real bytes of the real file in
 * a sandbox rather than by describing what the old code would have done.
 *
 * NOT claimed: that `probe-round225` is the only probe that COULD declare a refusal — any entry
 * may; the claim is the measured member list of those that do. That the held-port drive in §D3 is
 * re-driven here — it is a recorded measurement from this round, carried as a MEAS and labelled,
 * because driving it costs an occupied `:3001` and ~2 minutes and the sweep runs every fire. That
 * the hint legs' wording is pinned beyond the one property that matters (that they carry neither
 * verdict phrase, so the discriminator in section B cannot be confounded by a hint).
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { stripSource } from './lib/strip-source.mjs';
import {
  SWEPT,
  classify,
  blockedKind,
  probeRowAnnotations,
  type ProbeState,
} from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';

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

/**
 * The two phrases a reader quotes out of a row to say which kind of blockage it was. They are the
 * discriminator for the whole of section B, and the hint legs are worded to carry NEITHER — pinned
 * in B8, because a hint containing one of them would make every B check pass for the wrong reason.
 */
const VERDICT_PHRASE = { refused: 'could not run', skipped: 'ran but did not finish' } as const;

const sweepSrc = readFileSync(SWEEP, 'utf8');
/** Comments blanked, STRINGS KEPT — the phrases live in string literals and in prose about them. */
const bareSrc = stripSource(sweepSrc, false);

// ── Section A — the construction, and the reachable tuple set enumerated from the real classify ──
//
// Round 334: enumerate the reachable message set from source and then drive each branch, rather
// than driving the branch you had in mind. The tuple here is what `classify` RETURNS, and section B
// grades the row against every tuple it can return, not against the one the residue was about.

const r225 = SWEPT.find((s) => s.file === R225);
check('A1', `the entry this round is keyed on is in SWEPT (\`${R225}\`)`, r225 !== undefined);
if (r225 === undefined) {
  summariseAndExit({ probeName: 'probe-round372', results });
  throw new Error('unreachable');
}

/**
 * Every fragment below is built from the entry's OWN declared pattern source rather than a string
 * of my own invention — a known positive that carries the property instead of an analogy to it
 * (Round 355). A1b is what makes that legitimate: all three patterns are plain literals today, so
 * each one's `source` is itself a matching string. If a future entry uses a metacharacter, A1b reds
 * and tells the next reader to build the fragments another way rather than silently matching less.
 */
const litteral = (re: RegExp) => re.test(re.source);
check(
  'A1b',
  "the entry's three declared patterns are plain literals, so each pattern's own source is a " +
    'known positive for it — the construction every cell below rests on',
  litteral(r225.expect) && litteral(r225.refusal!) && litteral(r225.skip!),
);

check(
  'A2',
  'the member list of SWEPT entries declaring EITHER pattern is exactly [probe-round225], and no ' +
    'entry declares one without the other — so this is the only entry that can reach either ' +
    'BLOCKED limb (compare member lists, not counts: Round 340)',
  JSON.stringify(SWEPT.filter((s) => s.refusal || s.skip).map((s) => s.file)) ===
    JSON.stringify([R225]) &&
    SWEPT.filter((s) => Boolean(s.refusal) !== Boolean(s.skip)).length === 0,
);

const EXPECT_LINE = r225.expect.source;
const REFUSAL_LINE = `  ${r225.refusal!.source}`;
// `skipped` requires BOTH the marker and the declared label on ONE line — see `classify`.
const SKIP_LINE = `  did not run: ${r225.skip!.source}`;

/**
 * The tuple is spelled in the DECLARED types rather than in `string`/`number`, and that is a
 * repair rather than a preference: the first version of this file used `state: string; code:
 * number`, which typechecks under the shipped config and produced four TS2345 errors under the
 * WIDENED program `probe-round303` arm D2 drives. That arm asserts the widened program is clean, so
 * a loose type here reddened someone else's gate — found by the sweep in the fire that wrote it,
 * and not by reading it.
 */
type Tuple = { state: ProbeState; code: number | null; refused: boolean; skipped: boolean };
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
const blockedTuples = tuples.filter((t) => t.state === 'BLOCKED');
meas(
  'A3',
  `32 constructed outputs through the real classify yield ${tuples.length} distinct tuples, ` +
    `${blockedTuples.length} of them BLOCKED: ` +
    blockedTuples.map((t) => `${t.code}/r${+t.refused}s${+t.skipped}`).join(' '),
);

const bothFlags = blockedTuples.filter((t) => t.refused && t.skipped);
check(
  'A4',
  'the both-flags BLOCKED state is reachable BY CONSTRUCTION through the real classify — Round ' +
    "369's premise, re-driven here rather than taken from its docblock",
  bothFlags.length > 0,
);
check(
  'A5',
  'and it is reachable at exit 3 specifically — the case for which "could not run" is false ' +
    'rather than merely loose',
  bothFlags.some((t) => t.code === 3),
);

// ── Section B — one run, one verdict wording, keyed on the limb ──

const rowOf = (t: Tuple) => probeRowAnnotations(t).join('\n');
const says = (t: Tuple, phrase: string) => rowOf(t).includes(phrase);

check(
  'B1',
  'over EVERY reachable BLOCKED tuple, the row says "could not run" exactly when the limb that ' +
    'fired is the refusal limb — not when the refused FLAG is set',
  blockedTuples.every((t) => says(t, VERDICT_PHRASE.refused) === (blockedKind(t.state, t.code) === 'refused')),
);
check(
  'B2',
  'over every reachable BLOCKED tuple, the row says "ran but did not finish" exactly when the ' +
    'limb that fired is the skip limb',
  blockedTuples.every((t) => says(t, VERDICT_PHRASE.skipped) === (blockedKind(t.state, t.code) === 'skipped')),
);
check(
  'B3',
  'every reachable BLOCKED tuple gets EXACTLY ONE of the two verdict phrases — neither two (the ' +
    'residue) nor none (a BLOCKED row that annotates nothing)',
  blockedTuples.every(
    (t) => Number(says(t, VERDICT_PHRASE.refused)) + Number(says(t, VERDICT_PHRASE.skipped)) === 1,
  ),
);

const both3 = bothFlags.find((t) => t.code === 3)!;
check(
  'B4',
  'the residue case itself: a both-flags run at exit 3 is annotated "ran but did not finish" and ' +
    'is NOT annotated "could not run"',
  says(both3, VERDICT_PHRASE.skipped) && !says(both3, VERDICT_PHRASE.refused),
);
check(
  'B5',
  'and limb-keying is not LOSSY — the flag the limb did not use is still reported, as a hint ' +
    'rather than as a verdict',
  /HINT \(not a verdict\)/.test(rowOf(both3)) && /refusal text is also present/.test(rowOf(both3)),
);
check(
  'B6',
  'no non-BLOCKED tuple is annotated with either verdict phrase',
  tuples
    .filter((t) => t.state !== 'BLOCKED')
    .every((t) => !says(t, VERDICT_PHRASE.refused) && !says(t, VERDICT_PHRASE.skipped)),
);
check(
  'B7',
  'the RED hint is unchanged and stays FLAG-keyed on purpose: a red carrying the declared refusal ' +
    'text still gets it, and `blockedKind` has nothing to say about a non-BLOCKED state',
  tuples
    .filter((t) => t.state === 'RED' && t.refused)
    .every((t) => /declared refusal text is present at a non-2 exit/.test(rowOf(t))) &&
    tuples.filter((t) => t.state === 'RED' && t.refused).length > 0 &&
    blockedKind('RED', 2) === undefined,
);
check(
  'B8',
  'the hint legs carry NEITHER verdict phrase — without which every check in this section could ' +
    'pass on a hint instead of on the verdict it is supposed to be reading',
  (() => {
    const hintOnly = rowOf(both3)
      .split('\n')
      .filter((l) => !l.startsWith('ran but did not finish') && !l.startsWith('stands and no check'))
      .join('\n');
    return (
      hintOnly.length > 0 &&
      !hintOnly.includes(VERDICT_PHRASE.refused) &&
      !hintOnly.includes(VERDICT_PHRASE.skipped)
    );
  })(),
);
check(
  'B9',
  'a BLOCKED run at a code with no limb still REFUSES rather than annotating nothing — the ' +
    "inherited guard, re-driven through the rows rather than assumed from `blockedKind`'s own arm",
  (() => {
    try {
      probeRowAnnotations({ state: 'BLOCKED', code: 7, refused: true, skipped: true });
      return false;
    } catch (e) {
      return e instanceof Error && /no kind/.test(e.message);
    }
  })(),
);

// ── Section C — the counterfactual: re-key to the flags, and the residue comes back ──
//
// Driven on the REAL bytes of the real file, mutated in a gitignored sandbox (Round 332: a scratch
// copy, so no edit-and-restore of a live file), rather than on a description of what the pre-Round
// 372 code did. Round 347: each anchor is asserted to occur EXACTLY ONCE before anything is
// replaced, because `String.replace` silently takes the first of two identical strings — and the
// near-identical `if (kind === 'refused') blockedRefused += 1;` in `blockedTally` is exactly the
// neighbour that shape would hit.

const ANCHORS = ["if (kind === 'refused') {", "if (kind === 'skipped') {"] as const;
const FLAGGED = ['if (refused) {', 'if (skipped) {'] as const;
const anchorCounts = ANCHORS.map((a) => sweepSrc.split(a).length - 1);
check(
  'C1',
  `each mutation anchor occurs exactly once in the shipped source (${anchorCounts.join('/')}), so ` +
    'the mutation below lands on the row key and not on its neighbour in `blockedTally`',
  anchorCounts.every((n) => n === 1),
);

const SANDBOX = join(HERE, '..', '.testdata', 'round372');
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
let mutatedSrc = sweepSrc;
for (const [i, a] of ANCHORS.entries()) mutatedSrc = mutatedSrc.replace(a, FLAGGED[i]);
const MUTANT = join(SANDBOX, 'sweep-probes.mjs');
writeFileSync(MUTANT, mutatedSrc);
check(
  'C1b',
  'the mutation changed the file in exactly the two places it declared and nowhere else — the ' +
    'byte delta is the two anchors, so C2/C3 are attributable to the KEY',
  mutatedSrc !== sweepSrc &&
    ANCHORS.every((a) => mutatedSrc.split(a).length - 1 === 0) &&
    FLAGGED.every((f) => mutatedSrc.split(f).length - 1 === sweepSrc.split(f).length - 1 + 1),
);

const flagKeyed = (await import(pathToFileURL(MUTANT).href)) as {
  probeRowAnnotations: typeof probeRowAnnotations;
};
const mutantRow = (t: Tuple) => flagKeyed.probeRowAnnotations(t).join('\n');

check(
  'C2',
  'under the FLAG key the residue reproduces: the both-flags run at exit 3 is annotated BOTH ' +
    '"could not run" AND "ran but did not finish" — two verdicts about one run, which is the ' +
    'defect this round closed, driven rather than described',
  mutantRow(both3).includes(VERDICT_PHRASE.refused) && mutantRow(both3).includes(VERDICT_PHRASE.skipped),
);
check(
  'C3',
  "and B1's and B3's properties FAIL under that key — so neither is a check that would have " +
    'passed either way',
  !blockedTuples.every(
    (t) => mutantRow(t).includes(VERDICT_PHRASE.refused) === (blockedKind(t.state, t.code) === 'refused'),
  ) &&
    !blockedTuples.every(
      (t) =>
        Number(mutantRow(t).includes(VERDICT_PHRASE.refused)) +
          Number(mutantRow(t).includes(VERDICT_PHRASE.skipped)) ===
        1,
    ),
);
check(
  'C4',
  'the mutation is NARROW: every single-flag BLOCKED tuple is annotated identically under both ' +
    'keys, so C2 is attributable to the both-flags case alone and not to a broken copy',
  blockedTuples
    .filter((t) => !(t.refused && t.skipped))
    .every((t) => mutantRow(t) === rowOf(t)) &&
    blockedTuples.filter((t) => !(t.refused && t.skipped)).length > 0,
);

// ── Section D — the reachability that makes the residue latent, measured rather than assumed ──

const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r225Bare = stripSource(r225Src, true); // strings blanked too: 6 of the 6 raw hits are fixtures
const KP = "summariseAndExit({ probeName: 'probe-round225', results, skipped });";
const liveExits = (s: string) => (s.match(/process\s*\.\s*exit\s*\(/g) || []).length;
const summCalls = (s: string) => (s.match(/summariseAndExit\s*\(/g) || []).length;
check(
  'D1',
  `the detector finds its known positive first (Round 355): the real \`summariseAndExit\` call ` +
    'survives comment- and string-blanking, so its zero on `process.exit(` means absence rather ' +
    'than a blanked reading',
  summCalls(stripSource(KP, true)) === 1,
);
check(
  'D2',
  `\`probe-round225\` has 0 live \`process.exit(\` (${liveExits(r225Src)} raw, all inside minted ` +
    `fixture strings) and exactly 1 \`summariseAndExit(\` — one exit path`,
  liveExits(r225Bare) === 0 && summCalls(r225Bare) === 1,
);
const outcomeSrc = readFileSync(join(HERE, 'lib', 'probe-outcome.mts'), 'utf8');
check(
  'D3',
  "and that exit path cannot produce a 2: `ProbeOutcome`'s code is typed `0 | 1 | 3`, so the " +
    '`(code === 2 && refused)` limb has NO WITNESS over this population and "could not run" ' +
    'cannot print today',
  (outcomeSrc.match(/code: 0 \| 1 \| 3;/g) || []).length === 1,
);
meas(
  'D4',
  'the occupied-port cell, driven in Round 372 and RECORDED here rather than re-driven every ' +
    'fire (cost: a held :3001 and ~2 min): :3001 bound in-process, probe-round225 exits 3, its ' +
    'declared refusal pattern occurs 0 times in its own 10210-byte output, real classify returns ' +
    'state=BLOCKED refused=false skipped=true. The both-flags run is not the run that occurs.',
);

// ── Section E — the call site prints what the function returns, and holds no fork of it ──

const FN_ANCHOR = 'export const probeRowAnnotations = ';
check(
  'E1',
  'the function is exported from the sweep and identified by exactly one declaration site',
  (bareSrc.split(FN_ANCHOR).length - 1) === 1,
);
const fnStart = bareSrc.indexOf(FN_ANCHOR);
const fnBody = bareSrc.slice(fnStart, bareSrc.indexOf('\n};', fnStart));
const MAIN_ANCHOR = 'const main = ';
const mainBody = bareSrc.slice(bareSrc.indexOf(MAIN_ANCHOR));
check(
  'E2',
  '`main()` PRINTS what the function returns and keeps no flag-keyed row guard of its own — ' +
    'without which the key could be graded here and forked there',
  /for \(const line of probeRowAnnotations\(\{ state, code, refused, skipped \}\)\) \{/.test(mainBody) &&
    !/state === 'BLOCKED' && refused/.test(mainBody) &&
    !/state === 'BLOCKED' && skipped/.test(mainBody),
);
check(
  'E3',
  'each verdict phrase occurs exactly once in the function body (comments blanked, strings kept), ' +
    'so no second spelling of either verdict survives inside it',
  Object.values(VERDICT_PHRASE).every((p) => fnBody.split(p).length - 1 === 1),
);
check(
  'E4',
  'and both verdict legs are guarded on the LIMB rather than on a flag — the one property that, ' +
    'if it is ever quietly reverted, section C says what breaks',
  fnBody.includes('const kind = blockedKind(state, code);') &&
    ANCHORS.every((a) => fnBody.split(a).length - 1 === 1),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round372', results });
