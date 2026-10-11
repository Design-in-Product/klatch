/**
 * Round 369's grading instrument: does `probe-round369` actually catch the things it claims to?
 *
 * Drive from the repo root: `node docs/research/round369-instruments/verdict-line-kind-counterfactuals.mjs`
 *
 * Four mutations of `scripts/sweep-probes.mjs`, each driven against the probe, in a THROWAWAY COPY
 * under `.testdata/` — never the live tree, so a crash mid-run cannot leave another seat's checkout
 * mutated. The copy is made here rather than assumed, so the instrument is self-contained.
 *
 * Each mutation asserts its anchor occurs EXACTLY ONCE before `String.replace` touches it. Without
 * that, `replace` silently hits the first of several occurrences and reddens a different arm than
 * the one the case is about — which grades as a pass for the wrong reason.
 *
 * The grade is on the exit code AND the named arms, because three of the four mutations are supposed
 * to redden specific arms and one is supposed to fail to load at all.
 */
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SCRATCH = '.testdata/r369';
const SWEEP = `${SCRATCH}/scripts/sweep-probes.mjs`;
const PROBE = `${SCRATCH}/scripts/probe-round369-the-verdict-line-carries-the-blocked-kind.mts`;

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
cpSync('scripts', `${SCRATCH}/scripts`, { recursive: true });

// Read the PRISTINE source from the live tree, so a stale scratch copy cannot be the baseline.
const PRISTINE = readFileSync('scripts/sweep-probes.mjs', 'utf8');
writeFileSync(SWEEP, PRISTINE);

const KIND_TEMPLATE =
  '`${blocked} blocked (${blockedRefused} could not run, ${blockedSkipped} ran but did not finish), `';
const KIND_ACCUM = `    const kind = blockedKind(state, code);
    if (kind === 'refused') blockedRefused += 1;
    if (kind === 'skipped') blockedSkipped += 1;`;
const TALLY_HEAD = 'for (const { state, code } of runs) {';
const PUSH_SITE = "if (state === 'BLOCKED') blockedRuns.push({ state, code });";

const run = () => {
  const r = spawnSync('npx', ['tsx', PROBE], { encoding: 'utf8' });
  const stderr = r.stderr || '';
  const fails = [...r.stdout.matchAll(/^FAIL (\w+)/gm)].map((m) => m[1]);
  // Two reading errors this harness made and both printed a plausible line rather than an error:
  //   1. `^All \d+ regression checks passed$` — the real line ends with a PERIOD, so the anchor
  //      matched nothing and the green pristine run reported "NO SUMMARY LINE" at exit 0;
  //   2. `FAILED — .*` — `summariseAndExit` does not spell a failure that way. It is
  //      `N of M regression check(s) FAILED.`, so every CAUGHT mutation also read "NO SUMMARY LINE"
  //      and the only thing carrying the grade was the exit code.
  // Both were found by reading the probe's real tail rather than by reasoning about the regex.
  const summary = (r.stdout.match(
    /^(All \d+ regression checks passed\.?|\d+ of \d+ regression check\(s\) FAILED\.?|INCONCLUSIVE — .*)$/m,
  ) || ['NO SUMMARY LINE'])[0];
  return { exit: r.status, fails, summary, stderr };
};

const once = (src, anchor, label) => {
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${label}: anchor occurs ${n} times, expected exactly 1 — refusing to mutate`);
  return true;
};

const cases = [
  {
    name: 'M1 — revert the kind split to the retired `(did not conclude)`',
    mutate: (src) => {
      once(src, KIND_TEMPLATE, 'M1');
      return src.replace(KIND_TEMPLATE, '`${blocked} blocked (did not conclude), `');
    },
    expect: ['B1', 'B2', 'B3', 'B6', 'B7', 'D1', 'E2'],
  },
  {
    name: 'M2 — respell it as the vacuous `(N declared blocker, clearable)`',
    mutate: (src) => {
      once(src, KIND_TEMPLATE, 'M2');
      return src.replace(KIND_TEMPLATE, '`${blocked} blocked (${blocked} declared blocker, clearable), `');
    },
    expect: ['B1', 'B2', 'B3', 'B5', 'B7', 'D1', 'E2'],
  },
  {
    // The realistic shape of the mistake now that the tally is extracted: it takes TWO sites,
    // because the tally's parameter has to start carrying the flags before it can key on them.
    name: 'M3 — two-site: the loop pushes the flags and the tally keys on them',
    mutate: (src) => {
      once(src, KIND_ACCUM, 'M3/accum');
      once(src, TALLY_HEAD, 'M3/head');
      once(src, PUSH_SITE, 'M3/push');
      return src
        .replace(PUSH_SITE, "if (state === 'BLOCKED') blockedRuns.push({ state, code, refused, skipped });")
        .replace(TALLY_HEAD, 'for (const { state, code, refused, skipped } of runs) {')
        .replace(
          KIND_ACCUM,
          `    if (refused) blockedRefused += 1;
    if (skipped) blockedSkipped += 1;`,
        );
    },
    // NOT E3: that arm is scoped to the call site, which this mutation deliberately preserves —
    // `main()` still takes its figures from `blockedTally`. The arms that catch M3 are behavioural
    // (C3/C6), which is the whole point of extracting the tally, plus E4 on the push shape.
    expect: ['C3', 'C6', 'E4'],
  },
  {
    // The one-site version of the same mistake, kept because its outcome is different and worth
    // recording: it cannot even load. `blockedTally` never receives the flags, so keying on them
    // inside it is a ReferenceError rather than a wrong number. The defect is unrepresentable at
    // the tally's current signature, not merely detected — which is a stronger property than a
    // caught mutation, and holds only for that signature.
    name: 'M4 — one-site: key the tally on flags it was never handed',
    mutate: (src) => {
      once(src, KIND_ACCUM, 'M4');
      return src.replace(
        KIND_ACCUM,
        `    if (refused) blockedRefused += 1;
    if (skipped) blockedSkipped += 1;`,
      );
    },
    expect: [],
    expectThrows: /refused is not defined/,
  },
];

let allGood = true;
for (const c of cases) {
  writeFileSync(SWEEP, PRISTINE);
  const mutated = c.mutate(PRISTINE);
  if (mutated === PRISTINE) throw new Error(`${c.name}: mutation changed nothing`);
  writeFileSync(SWEEP, mutated);
  const r = run();
  const got = new Set(r.fails);
  const missing = c.expect.filter((a) => !got.has(a));
  const threwAsExpected = c.expectThrows ? c.expectThrows.test(r.stderr) : true;
  const ok = r.exit !== 0 && missing.length === 0 && threwAsExpected;
  if (!ok) allGood = false;
  console.log(`\n${c.name}`);
  console.log(`  exit=${r.exit}  summary="${r.summary}"`);
  console.log(`  reddened: [${r.fails.join(', ')}]`);
  console.log(`  expected to redden: [${c.expect.join(', ')}]`);
  if (c.expectThrows) {
    const line = (r.stderr.match(/^\w*Error: .*$/m) || ['NO ERROR LINE'])[0];
    console.log(`  expected throw matching ${c.expectThrows} -> ${threwAsExpected ? 'YES' : 'NO'}: ${line}`);
  }
  if (missing.length) console.log(`  MISSING (expected red, stayed green): [${missing.join(', ')}]`);
  console.log(`  ${ok ? 'GRADE PASS — the mutation is caught' : 'GRADE FAIL'}`);
}

writeFileSync(SWEEP, PRISTINE);
const restored = run();
console.log(`\nrestored pristine: exit=${restored.exit} summary="${restored.summary}"`);
if (restored.exit !== 0) allGood = false;

console.log('');
if (allGood !== true) {
  console.log('COUNTERFACTUAL GRADE: FAILED — at least one mutation went unnoticed');
  process.exit(1);
}
console.log(
  `COUNTERFACTUAL GRADE: PASSED — all ${cases.length} mutations produced their intended outcome, pristine is green`,
);
