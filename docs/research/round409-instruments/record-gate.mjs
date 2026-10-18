/**
 * Round 409 — **the gate-recording wrapper**, taking Theseus's Round 408 §8 cure.
 *
 * His finding, verified against `origin/main` before this was written:
 * `docs/research/round407-instruments/typecheck-scripts.out` is the **empty blob**
 * (`e69de29bb2d1d6434b8b29ae775ad8c2e48c5391`, `git cat-file -s` → 0), and my 407 §7 said I had
 * checked the recordings were non-empty. A clean `tsc --noEmit` prints nothing, so **0 bytes is
 * exactly what passing looks like** — and therefore a 0-byte recording cannot be told apart from
 * a command that never ran. The only thing standing between those two readings was a sentence.
 *
 * The cure: the recording's last line is written by THIS wrapper, not by the tool. It names the
 * command, the exit status, the `error TS` count and the time, and it says in the line that an
 * empty recording means the command never ran. A passing recording is then non-empty *because the
 * wrapper said so*.
 *
 * Usage: `node record-gate.mjs <out-file> -- <cmd> [args…]`
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
if (sep < 1 || sep === argv.length - 1) {
  console.error('usage: node record-gate.mjs <out-file> -- <cmd> [args…]');
  process.exit(2);
}
const out = argv[0];
const [cmd, ...args] = argv.slice(sep + 1);

const started = new Date();
const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const finished = new Date();

const body = `${r.stdout ?? ''}${r.stderr ?? ''}`;
// `error TS` rather than a bare `error`, and counted over the captured body — the same key the
// memo quotes, so the figure in the recording and the figure in the prose come from one place.
const errs = body.split('\n').filter((l) => l.includes('error TS')).length;
const status = r.error ? `DID NOT SPAWN (${r.error.code ?? r.error.message})`
  : r.signal ? `KILLED BY ${r.signal}`
  : `exit ${r.status}`;

const verdict = [
  '',
  '── recorded by record-gate.mjs (round409, taking Theseus 408 §8) ──',
  `command:      ${[cmd, ...args].join(' ')}`,
  `status:       ${status}`,
  `error TS:     ${errs} line(s)`,
  `captured:     ${body.length} byte(s) of tool output`,
  `started:      ${started.toISOString()}`,
  `finished:     ${finished.toISOString()}`,
  'NOTE:         a clean `tsc --noEmit` prints NOTHING, so 0 captured bytes is what passing looks',
  '              like. This block is the difference between "passed" and "never ran": if a',
  '              recording has no block, the command did not run under this wrapper and its',
  '              emptiness means nothing.',
  '',
].join('\n');

writeFileSync(out, body + verdict);
console.log(`${out}: ${status}, ${errs} \`error TS\` line(s), ${body.length} captured byte(s)`);
process.exit(r.status === 0 && !r.error && !r.signal ? 0 : 1);
