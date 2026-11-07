/**
 * unit-465skipE driver. One arm per declared state, each one a real `npx tsx` run
 * of the real probe — not a fixture. Writes `<arm>.out` / `<arm>.err` beside this
 * file and prints the rows the grading needs.
 *
 * `classify` is **imported** from `sweep-probes.mjs`, never re-spelled: a grader
 * at this call site could only grade its own copy of the thing it is grading.
 * The `expect` pattern is the shape `summariseAndExit` prints, and the three
 * `skip:` variants are the declaration's three states — declared-and-present,
 * absent, declared-but-not-on-the-line — because the declaration has to be
 * load-bearing in BOTH directions or BLOCKED is bought by the exit code alone.
 *
 * Usage: npx tsx docs/research/unit-465skipE-2026-11-07/drive-skipE.mts <arm...>
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { classify } from '../../../scripts/sweep-probes.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const PROBE = 'scripts/probe-backfill-sidecar-neutrality.mts';

type Arm = { name: string; env: Record<string, string>; note: string };

const ARMS: Arm[] = [
  { name: 'drive0', env: {}, note: 'control — no gate variable set' },
  { name: 'drive1', env: { KLATCH_U465SKIPE_LOSE: '1' }, note: 'X1 — race deterministically lost' },
  { name: 'drive2', env: { KLATCH_U465SKIPE_NOSIZE: '1' }, note: 'C1 — size test removed, race built' },
  {
    name: 'drive3',
    env: { KLATCH_U465SKIPE_LOSE: '1', KLATCH_U465SKIPE_NOSIZE: '1' },
    note: 'X1 + C1 — a lost race under a crippled product still skips, it does not red',
  },
  { name: 'drive4', env: {}, note: 'control, repeat — the green state is stable' },
];

/** The conclusion line, found from the end, past the exit-3 legend. */
const conclusion = (out: string) =>
  out
    .trim()
    .split('\n')
    .reverse()
    .find((l) => /^(INCONCLUSIVE — |FAILED — |All \d+ regression checks passed)/.test(l)) ?? '(none)';

const want = process.argv.slice(2);
for (const arm of ARMS) {
  if (want.length && !want.includes(arm.name)) continue;
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', PROBE], {
    cwd: REPO,
    encoding: 'utf8',
    env: { ...process.env, ...arm.env },
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Date.now() - t0;
  const out = r.stdout ?? '';
  fs.writeFileSync(path.join(HERE, `${arm.name}.out`), out);
  fs.writeFileSync(path.join(HERE, `${arm.name}.err`), r.stderr ?? '');
  const code = r.status ?? -1;

  console.log(`\n=== ${arm.name}  ${arm.note}`);
  console.log(`exit ${code}  ${ms} ms`);
  console.log(`conclusion: ${conclusion(out)}`);
  const stateLine = out.split('\n').find((l) => l.includes('[E] state '));
  console.log(`state line: ${stateLine?.trim() ?? '(absent)'}`);
  const didNotRun = out.split('\n').filter((l) => l.includes('did not run:'));
  console.log(`did-not-run line(s): ${didNotRun.length ? didNotRun.map((l) => l.trim()).join(' | ') : '(none)'}`);

  // P3: the two downstream claims must be ABSENT from the output in the skip
  // state, not merely green or suppressed. Keyed on the label text, which is what
  // a reader sees.
  for (const s of ['keeps every byte', 'another process can still read']) {
    console.log(`  claim "${s}": ${out.includes(s) ? 'EMITTED' : 'absent'}`);
  }
  for (const l of out.split('\n').filter((l) => l.includes('FAIL'))) console.log(`  ${l.trim()}`);

  // P4: the same real (code, out) through the real classifier, declaration as the
  // only variable.
  const expect = /All \d+ regression checks passed/;
  const variants: [string, RegExp | undefined][] = [
    ['declared + on the line', /the race state could not be built/],
    ['no declaration at all', undefined],
    ['declared label not on the line', /the corpus was unreadable/],
  ];
  for (const [label, skip] of variants) {
    const v = classify(code, out, expect, undefined, skip);
    console.log(`  classify [${label}] -> ${v.state}  (matched=${v.matched} skipped=${v.skipped} code=${v.code})`);
  }
}
