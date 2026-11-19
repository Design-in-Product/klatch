#!/usr/bin/env node
/**
 * Drive runner — spawns a child and records its exit code INTO the capture, so the rc published is
 * read off the child rather than inferred from an `&&` chain. Usage:
 *   node run.mjs <label> <cmd> [args...]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [label, cmd, ...args] = process.argv.slice(2);
const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 });
const rc = r.status === null ? `signal:${r.signal}` : r.status;
const head = `# ${label}\n# cmd: ${cmd} ${args.join(' ')}\n# rc (read off the child): ${rc}\n# when: ${new Date().toISOString()}\n\n`;
writeFileSync(join(HERE, `${label}.out`), head + (r.stdout || ''));
if (r.stderr) writeFileSync(join(HERE, `${label}.err`), head + r.stderr);
process.stdout.write(head + (r.stdout || ''));
if (r.stderr) process.stderr.write(r.stderr);
