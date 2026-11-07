/**
 * unit-465armd driver.
 *
 * Runs `scripts/probe-backfill-sidecar-neutrality.mts` and records its verdict at
 * **arm** granularity, not just its exit code — the claim under test is about one
 * arm, and an exit code that saturates over four arms cannot name which one moved.
 *
 * The cripple flag is taken from this script's own argv and handed to the child
 * **explicitly**. The env of this process is not what the probe reads; the probe is
 * a child, and an inherited-env assumption is how a cripple drive comes out
 * silently identical to the clean one. The recording prints what was requested and
 * what the child was given, so a reader can tell a dead cripple from an unarmed one.
 *
 * Usage: node drive-probe.mjs <label> [--x1] [--x2]
 */
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const PROBE = path.join(REPO, 'scripts/probe-backfill-sidecar-neutrality.mts');

const label = process.argv[2] ?? '(unlabelled)';
const cripple = {};
if (process.argv.includes('--x1')) cripple.U465ARMD_X1 = '1';
if (process.argv.includes('--x2')) cripple.U465ARMD_X2 = '1';

// Where X1 reports what it destroyed. A file, because the probe swallows the
// tool's streams (see the note on spawnSync below — that was only the *outer*
// layer of the same problem). Scoped to this process so a stale report from an
// earlier drive cannot be read as this one's.
const SENTINEL = path.join(os.tmpdir(), `u465armd-${process.pid}.log`);
fs.rmSync(SENTINEL, { force: true });
cripple.U465ARMD_LOG = SENTINEL;

console.log(`drive: ${label}`);
// `U465ARMD_LOG` is the report channel, not a cripple; naming it here would make
// every drive look armed.
const requested = Object.keys(cripple).filter((k) => k !== 'U465ARMD_LOG');
console.log(`cripple requested: ${requested.length ? requested.join(',') : '(none)'}`);
console.log(`subject rev: ${execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`);
console.log(
  `subject dirty (packages/ scripts/): ${
    execFileSync('git', ['-C', REPO, 'status', '--short', '--', 'packages/', 'scripts/'], {
      encoding: 'utf8',
    }).trim() || '(clean)'
  }`
);

// `spawnSync`, not `execFileSync`, and this is the second version of this driver.
// The first used `execFileSync`, which returns stdout and makes stderr reachable
// **only through the thrown error** — so on a run that exits 0 the child's stderr
// is dropped on the floor. That silently swallowed the X1 cripple's own
// "fired: -wal NB -> 0B" report on exactly the drive where it mattered, and the
// resulting recording was indistinguishable from one where the cripple never ran.
// Keeping both streams unconditionally is the whole point of a cripple recording.
const r = spawnSync('npx', ['tsx', PROBE], {
  cwd: REPO,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, ...cripple },
});
const code = r.status ?? -1;
const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;

console.log(`probe exit: ${code}`);
console.log('--- cripple self-report (file sentinel) ---');
const sentinel = fs.existsSync(SENTINEL) ? fs.readFileSync(SENTINEL, 'utf8').trimEnd() : '';
// Only X1 carries a sentinel. An earlier version of this line printed "the cripple
// did not fire" whenever the sentinel was empty, which was **false on every X2
// drive** — X2 has no sentinel to write, and drive 3 proves it fired by reddening
// arm D on `-wal -> absent`. A recording that mis-reports its own instrument is
// the exact defect this unit was opened about, so the reason line is keyed on
// which cripple was requested rather than on the sentinel alone.
if (sentinel) {
  console.log(sentinel);
} else if (cripple.U465ARMD_X1) {
  console.log(
    '(X1 requested and NO report — the cripple is DEAD, not undetected. ' +
      'No greenness below is evidence about the arm.)'
  );
} else if (cripple.U465ARMD_X2) {
  console.log('(X2 requested. X2 carries no sentinel — judge it by the arm verdicts below.)');
} else {
  console.log('(no cripple requested)');
}
fs.rmSync(SENTINEL, { force: true });
console.log('--- probe stdout + stderr (both, always) ---');
console.log(out.trimEnd());
console.log('--- per-arm verdicts, parsed ---');

// `  [A] ok   <label> — <got>` / `  [D] FAIL <label> — <got>`
const rows = [];
for (const line of out.split('\n')) {
  const m = line.match(/^\s*\[([A-Z0-9]+)\]\s+(ok|FAIL)\s+(.*)$/);
  if (m) rows.push({ arm: m[1], pass: m[2] === 'ok', text: m[3].trim() });
}
const arms = [...new Set(rows.map((r) => r.arm))].sort();
for (const arm of arms) {
  const mine = rows.filter((r) => r.arm === arm);
  const failed = mine.filter((r) => !r.pass);
  console.log(
    `[${arm}] ${failed.length === 0 ? 'GREEN' : 'RED'}  (${mine.length - failed.length}/${mine.length} checks pass)` +
      (failed.length ? `  first failure: ${failed[0].text}` : '')
  );
}
console.log(`arms seen: ${arms.length ? arms.join(',') : '(none — parse found no arm lines)'}`);
console.log(`checks parsed: ${rows.length}`);
