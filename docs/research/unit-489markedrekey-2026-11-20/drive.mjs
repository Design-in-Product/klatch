#!/usr/bin/env node
/**
 * Drive harness for `unit-489markedrekey`.
 *
 * One job: run a command, capture stdout+stderr+rc into a named drive file, and print the rc so a
 * drive that crashed cannot be mistaken for one that ran. **`rc` is written INTO the capture file**,
 * because a capture whose exit code lives only in a transcript is a figure nobody can re-read —
 * `unit-487`'s drive0 note, generalised.
 *
 * Usage: node drive.mjs <out-name> <cmd> [args…]
 */
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [name, cmd, ...args] = process.argv.slice(2);
if (!name || !cmd) {
  console.error('usage: node drive.mjs <out-name> <cmd> [args…]');
  process.exit(2);
}
const ROOT = join(HERE, '../../..');
const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
// `r.status` is null when the child was killed by a signal; that is NOT 0 and must not render as
// one. A null rendered as "rc=0" is the vacuous-pass shape this unit's P7 forbids.
const rc = r.status === null ? `SIGNAL:${r.signal}` : r.status;
const body = `${r.stdout || ''}${r.error ? `\n[spawn error] ${r.error.message}\n` : ''}`
  + `${r.stderr ? `\n--- stderr ---\n${r.stderr}` : ''}`
  + `\n--- rc=${rc} ---\n`;
writeFileSync(join(HERE, name), body);
console.log(`${name}: rc=${rc}  (${body.length} bytes)`);
