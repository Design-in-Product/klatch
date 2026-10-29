#!/usr/bin/env node
/**
 * drive.mjs — record one drive of a cell to <label>.out / <label>.err and print the
 * three things a recording is worthless without: the child's exit code, the byte count
 * of its stderr, and the rev the drive was taken at.
 *
 * Usage: node drive.mjs <label> <cmd> [args...]
 *   env passed through, plus any VAR=VALUE pairs given before <cmd> as CRIPPLE_*=...
 *
 * Why this exists rather than shell redirection: a shell pipeline reports the exit code
 * of its tail, and `execFileSync` echoes the child's stderr into the parent's own
 * recording. `spawnSync` with pinned `stdio: 'pipe'` keeps the two streams separate and
 * hands back the child's own status.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
if (argv.length < 2) {
  console.error('usage: node drive.mjs <label> [VAR=VAL...] <cmd> [args...]');
  process.exit(2);
}
const label = argv[0];
const rest = argv.slice(1);
const env = { ...process.env };
let i = 0;
for (; i < rest.length; i++) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(rest[i]);
  if (!m) break;
  env[m[1]] = m[2];
}
const cmd = rest[i];
const args = rest.slice(i + 1);
if (!cmd) {
  console.error('no command given');
  process.exit(2);
}

const rev = spawnSync('git', ['-C', HERE, 'rev-parse', 'HEAD'], {
  stdio: 'pipe',
  encoding: 'utf8',
});
const head = rev.status === 0 ? rev.stdout.trim() : 'UNRESOLVED';

const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', env, cwd: process.cwd() });
const out = r.stdout ?? '';
const err = r.stderr ?? '';
writeFileSync(join(HERE, `${label}.out`), out);
writeFileSync(join(HERE, `${label}.err`), err);

const verdict = out.split('\n').filter((l) => /^VERDICT\//.test(l));
console.log(`DRIVE ${label}`);
console.log(`  rev      ${head}`);
console.log(`  status   ${r.status === null ? `SIGNAL ${r.signal}` : r.status}`);
console.log(`  outBytes ${Buffer.byteLength(out)}`);
console.log(`  errBytes ${Buffer.byteLength(err)}`);
for (const v of verdict) console.log(`  ${v}`);
if (!verdict.length) console.log('  (no VERDICT/ line in stdout)');
if (err.length) console.log(`  stderr first line: ${err.split('\n')[0]}`);
