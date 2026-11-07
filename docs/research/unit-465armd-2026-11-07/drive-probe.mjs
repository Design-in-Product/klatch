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
import { execFileSync } from 'child_process';
import path from 'path';
import process from 'process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const PROBE = path.join(REPO, 'scripts/probe-backfill-sidecar-neutrality.mts');

const label = process.argv[2] ?? '(unlabelled)';
const cripple = {};
if (process.argv.includes('--x1')) cripple.U465ARMD_X1 = '1';
if (process.argv.includes('--x2')) cripple.U465ARMD_X2 = '1';

console.log(`drive: ${label}`);
console.log(`cripple requested: ${Object.keys(cripple).length ? Object.keys(cripple).join(',') : '(none)'}`);
console.log(`subject rev: ${execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`);
console.log(
  `subject dirty (packages/ scripts/): ${
    execFileSync('git', ['-C', REPO, 'status', '--short', '--', 'packages/', 'scripts/'], {
      encoding: 'utf8',
    }).trim() || '(clean)'
  }`
);

let code = 0;
let out = '';
try {
  out = execFileSync('npx', ['tsx', PROBE], {
    cwd: REPO,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, ...cripple },
  });
} catch (err) {
  code = err.status ?? -1;
  // stderr is captured deliberately: execFileSync otherwise echoes a child's
  // stderr into this recording out of band, where it reads as the driver's.
  out = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
}

console.log(`probe exit: ${code}`);
console.log('--- probe stdout/stderr ---');
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
