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
/**
 * Prefix for every artefact this invocation writes. Without it the clean re-drive
 * would overwrite the cripple-present recordings under the same names, and a
 * single-file artefact then holds only the last arm driven.
 */
const TAG = (() => {
  const a = process.argv.slice(2).find((x) => x.startsWith('tag:'));
  return a ? `${a.slice(4)}-` : '';
})();
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

/**
 * The conclusion line, found from the end, past the exit-3 legend.
 *
 * The first version of this copied `sweep-probes.mjs`'s `CONCLUSION` list
 * verbatim — `[/^INCONCLUSIVE — /, /^FAILED — /, /^All \d+ regression checks
 * passed/]` — and printed `(none)` for the red drive, because `probe-outcome`'s
 * own failure headline is `N of M regression check(s) FAILED.` and matches none of
 * the three. **That is a defect in this reader, not in the sweep:** the sweep
 * reaches the same line through its `NOT_A_CONCLUSION`-filtered fallback, and
 * `/^FAILED — /` is live for the hand-rolled probes that do not summarise through
 * `probe-outcome` (`probe-round298`, `-299`, `-305`, `verify-expand-reachability`,
 * `probe-scratch-server`). I went looking for a dead pattern and it is not one.
 */
const conclusion = (out: string) =>
  out
    .trim()
    .split('\n')
    .reverse()
    .find((l) =>
      /^(INCONCLUSIVE — |FAILED — |All \d+ regression checks passed|\d+ of \d+ regression check\(s\) FAILED)/.test(l)
    ) ?? '(none)';

/**
 * The grading summary goes to a FILE as well as stdout. The first pass of this
 * unit left its grading rows only in a terminal, which makes the one artefact that
 * carries a verdict the one artefact nobody can re-read.
 */
const graded: string[] = [];
const say = (s: string) => {
  graded.push(s);
  console.log(s);
};

const want = process.argv.slice(2).filter((x) => !x.startsWith('tag:'));
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
  fs.writeFileSync(path.join(HERE, `${TAG}${arm.name}.out`), out);
  fs.writeFileSync(path.join(HERE, `${TAG}${arm.name}.err`), r.stderr ?? '');
  const code = r.status ?? -1;

  say(`\n=== ${arm.name}  ${arm.note}`);
  say(`exit ${code}  ${ms} ms`);
  say(`conclusion: ${conclusion(out)}`);
  const stateLine = out.split('\n').find((l) => l.includes('[E] state '));
  say(`state line: ${stateLine?.trim() ?? '(absent)'}`);
  const didNotRun = out.split('\n').filter((l) => l.includes('did not run:'));
  say(`did-not-run line(s): ${didNotRun.length ? didNotRun.map((l) => l.trim()).join(' | ') : '(none)'}`);

  // P3: the two downstream claims must be ABSENT from the output in the skip
  // state, not merely green or suppressed.
  //
  // **Keyed on arm E's own rows, not on the label text.** The first version of
  // this loop was `out.includes('keeps every byte')` and it reported EMITTED in
  // the skip state — because arm **D**'s row is `a pre-existing -wal keeps every
  // byte`, and an undifferentiated containment match fused two arms' claims. The
  // substance was fine; the detector could not say so. Driven, drive1, and
  // recorded in RESULTS rather than quietly fixed.
  const eRows = out.split('\n').filter((l) => /^\s*\[E\] /.test(l) && !l.includes('[E] state '));
  say(`  arm E check row(s): ${eRows.length}`);
  for (const s of ['keeps every byte', 'another process can still read']) {
    say(`  [E] claim "${s}": ${eRows.some((l) => l.includes(s)) ? 'EMITTED' : 'absent'}`);
  }
  for (const l of out.split('\n').filter((l) => l.includes('FAIL'))) say(`  ${l.trim()}`);

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
    say(`  classify [${label}] -> ${v.state}  (matched=${v.matched} skipped=${v.skipped} code=${v.code})`);
  }
}

// Named for the arms actually driven, so a partial re-drive cannot silently
// overwrite the full set's grading.
fs.writeFileSync(
  path.join(HERE, `${TAG}grading-${want.length ? want.join('+') : 'all'}.txt`),
  `${graded.join('\n')}\n`
);
