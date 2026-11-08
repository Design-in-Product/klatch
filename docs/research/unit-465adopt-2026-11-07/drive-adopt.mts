/**
 * unit-465adopt driver. P1–P8 and M1.
 *
 * Every arm is a real `npx tsx` run of the real probe. `classify`, `entryProblems`
 * and `measurementCheck` are **imported** from `scripts/sweep-probes.mjs`, never
 * re-spelled here: a grader that re-types the predicate it grades is grading its
 * own copy of it, and this file's whole job is the join between the probe's label
 * and the sweep's reader.
 *
 * Usage:
 *   npx tsx .../drive-adopt.mts tag:<prefix> <arm...>      # arms: control x1 c1 x1c1
 *   npx tsx .../drive-adopt.mts tag:<prefix> entry:draft    # P7/P8 on the proposed object
 *   npx tsx .../drive-adopt.mts tag:<prefix> entry:live     # P7/P8 on the object in SWEPT
 *   npx tsx .../drive-adopt.mts tag:<prefix> m1             # M1, 10 uncrippled runs
 *
 * `tag:` prefixes every artefact this invocation writes, because the cripple-present
 * and cripple-absent passes record under the same arm names and a single-file
 * artefact otherwise holds only the last pass driven.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { classify, entryProblems, measurementCheck, SWEPT } from '../../../scripts/sweep-probes.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const PROBE = 'scripts/probe-backfill-sidecar-neutrality.mts';
const FILE = 'probe-backfill-sidecar-neutrality.mts';

const argv = process.argv.slice(2);
const TAG = (() => {
  const a = argv.find((x) => x.startsWith('tag:'));
  return a ? `${a.slice(4)}-` : '';
})();
const want = argv.filter((x) => !x.startsWith('tag:'));

/** The pin and the declared label, written once and read by every cell below. */
const EXPECT = /All 13 regression checks passed/;
const SKIP = /the race state could not be built/;
/** P4's near-miss: a declared label that is NOT on the run's own line. */
const SKIP_OFF_LINE = /the race state was not built/;

const graded: string[] = [];
const say = (s: string) => {
  graded.push(s);
  console.log(s);
};

const drive = (name: string, env: Record<string, string>) => {
  const r = spawnSync('npx', ['tsx', PROBE], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, ...env },
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  fs.writeFileSync(path.join(HERE, `${TAG}${name}.out`), r.stdout || '');
  fs.writeFileSync(path.join(HERE, `${TAG}${name}.err`), r.stderr || '');
  return { code: r.status, out };
};

/**
 * The conclusion line, found from the END and past `probe-outcome.mts`'s exit-3
 * legend. `probe-outcome`'s failure headline is `N of M regression check(s)
 * FAILED.`, which `sweep-probes.mjs`'s own `CONCLUSION` list does not match —
 * Theseus's `unit-465skipE` §7 found that by copying that list into a reader and
 * printing `(none)` for the red drive. The sweep itself reaches the line through a
 * fallback; a reader that copies only the list does not.
 */
const conclusion = (out: string) =>
  out
    .trim()
    .split('\n')
    .reverse()
    .map((l) => l.trim())
    .find((l) =>
      /^(INCONCLUSIVE — |FAILED — |All \d+ regression checks passed|\d+ of \d+ regression check\(s\) FAILED)/.test(l)
    ) ?? '(none)';

/**
 * P2's same-line conjunction, asserted on a LINE rather than on the whole output.
 * `classify` requires `did not run:` and the declared pattern on one line; a
 * whole-output check would be satisfied by two unrelated lines and would pass for
 * the wrong reason on exactly the tree where the entry is wrong.
 */
const sameLine = (out: string, re: RegExp) =>
  out.split('\n').find((l) => l.includes('did not run:') && l.search(re) >= 0) ?? null;

const ARMS: Record<string, Record<string, string>> = {
  control: {},
  x1: { KLATCH_U465ADOPT_LOSE: '1' },
  c1: { KLATCH_U465ADOPT_NOSIZE: '1' },
  x1c1: { KLATCH_U465ADOPT_LOSE: '1', KLATCH_U465ADOPT_NOSIZE: '1' },
};

for (const arm of want.filter((w) => w in ARMS)) {
  const t0 = Date.now();
  const { code, out } = drive(arm, ARMS[arm]);
  const ms = Date.now() - t0;
  const full = classify(code, out, EXPECT, undefined, SKIP);
  const bare = classify(code, out, EXPECT, undefined, undefined);
  const offLine = classify(code, out, EXPECT, undefined, SKIP_OFF_LINE);
  say(`${arm.padEnd(6)} exit ${String(code).padEnd(2)} ${String(ms).padStart(5)} ms  ${conclusion(out)}`);
  say(`       declared   -> ${full.state} (matched=${full.matched} skipped=${full.skipped})`);
  say(`       no skip:   -> ${bare.state} (skipped=${bare.skipped})`);
  say(`       off-line:  -> ${offLine.state} (skipped=${offLine.skipped})`);
  const line = sameLine(out, SKIP);
  say(`       same-line  -> ${line === null ? 'NO LINE carries both' : JSON.stringify(line.trim())}`);
}

for (const mode of want.filter((w) => w.startsWith('entry:'))) {
  const which = mode.slice(6);
  const draft = {
    file: FILE,
    expect: EXPECT,
    skip: SKIP,
    why: 'draft — 13 regression checks',
  };
  const live = SWEPT.find((e: { file: string }) => e.file === FILE);
  const entry = which === 'live' ? live : draft;
  if (!entry) {
    say(`entry:${which} -> NOT IN SWEPT (nothing to grade; promotion has not been written)`);
    continue;
  }
  const probs = entryProblems(entry);
  say(`entry:${which} entryProblems -> ${probs.length === 0 ? '[] (none)' : JSON.stringify(probs)}`);
  const controlOut = fs.existsSync(path.join(HERE, `${TAG}control.out`))
    ? fs.readFileSync(path.join(HERE, `${TAG}control.out`), 'utf8')
    : '';
  if (!controlOut) {
    say(`entry:${which} measurementCheck -> NOT RUN (no ${TAG}control.out beside this file)`);
  } else {
    say(`entry:${which} measurementCheck -> ${JSON.stringify(measurementCheck(entry, controlOut))}`);
  }
  say(`entry:${which} expect.source  -> ${entry.expect.source}`);
  say(`entry:${which} skip.source    -> ${entry.skip ? entry.skip.source : '(absent)'}`);
}

if (want.includes('m1')) {
  const N = 10;
  const codes: number[] = [];
  for (let i = 0; i < N; i += 1) {
    const { code, out } = drive(`m1-${i}`, {});
    codes.push(code ?? -1);
    const st = out.split('\n').find((l) => l.includes('[E] state')) ?? '(no state line)';
    say(`m1 run ${i} exit ${code}  ${st.trim()}`);
  }
  const won = codes.filter((c) => c === 0).length;
  say(`M1 — ${won} of ${N} uncrippled runs exited 0; ${N - won} did not (codes ${codes.join(',')})`);
}

/**
 * APPENDED, not written. Found by this unit's own second invocation under the same
 * tag — the entry:live pass overwrote the four-arm grading with four lines, because
 * a single-file artefact keyed on the tag alone holds only the last invocation.
 * The arms could not be re-driven to recover it either: the cripples were already
 * out of the tree by then, which is the correct order and makes the overwrite
 * unrecoverable rather than inconvenient.
 */
fs.appendFileSync(
  path.join(HERE, `${TAG}grading.txt`),
  `── ${new Date().toISOString()} · ${want.join(' ')} ──\n${graded.join('\n')}\n`
);
