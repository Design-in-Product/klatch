#!/usr/bin/env node
/**
 * Drive a command, capture combined stdout+stderr to a file, and print the exit code **read off the
 * child process** rather than inferred from the output. `exit 0 with no summary line is not a
 * measurement`, and a shell-captured `$?` through a pipeline is not the child's code.
 *
 * Usage: node run.mjs <outfile> <cmd> [args...]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [out, cmd, ...args] = process.argv.slice(2);
const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: process.env.DRIVE_CWD || process.cwd() });
const body = (r.stdout || '') + (r.stderr || '');
const tail = `\n--- exit code read off the child process: rc=${r.status} (signal=${r.signal}) ---\n`;
writeFileSync(out, body + tail);
process.stdout.write(body + tail);
