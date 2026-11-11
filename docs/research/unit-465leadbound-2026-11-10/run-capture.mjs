#!/usr/bin/env node
/**
 * Capture one arm of unit-465leadbound: run a node script, record stdout, stderr and the
 * exit status in **three separate places**, and print a one-line summary.
 *
 * Why not a shell pipeline: a pipe hides the head and reports the exit code of the tail, and
 * `execFileSync` echoes the child's stderr into the parent's — which would land the child's
 * diagnostics inside this unit's stdout recording and make the recording a mixture. `spawnSync`
 * with `encoding` keeps the three streams apart.
 *
 * Usage: node run-capture.mjs [--tsx] <label> <script-path> [args…]
 *   writes <label>.out.txt, <label>.err.txt, <label>.status.txt beside this file.
 *
 * `--tsx` runs the script through the repo's own `tsx` loader instead of plain `node`. Some
 * instruments here import TypeScript source and **declare a refusal** (exit 2, named reason)
 * under plain `node` rather than running half-way — `verify-filler-constraints.mjs` is one.
 *
 * cwd is this repo's root, not this directory, so a relative script path resolves the way a
 * person running it from the repo root would get — argv script paths resolve against the
 * **child's** cwd, which is the one set here.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '../../..');

const argv = process.argv.slice(2);
const useTsx = argv[0] === '--tsx';
const [label, script, ...args] = useTsx ? argv.slice(1) : argv;
if (!label || !script) {
  console.error('usage: node run-capture.mjs [--tsx] <label> <script-path> [args…]');
  process.exit(2);
}

const TSX = path.join(ROOT, 'node_modules/.bin/tsx');
const childArgs = useTsx ? [TSX, script, ...args] : [script, ...args];

const r = spawnSync(process.execPath, childArgs, {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

fs.writeFileSync(path.join(HERE, `${label}.out.txt`), r.stdout ?? '');
fs.writeFileSync(path.join(HERE, `${label}.err.txt`), r.stderr ?? '');
fs.writeFileSync(
  path.join(HERE, `${label}.status.txt`),
  `script: ${script}\nargs: ${JSON.stringify(args)}\ninterpreter: ${useTsx ? 'tsx' : 'node'}\ncwd: ${ROOT}\n` +
    `status: ${r.status}\nsignal: ${r.signal}\nerror: ${r.error ? String(r.error) : 'none'}\n` +
    `stdout_bytes: ${Buffer.byteLength(r.stdout ?? '')}\nstderr_bytes: ${Buffer.byteLength(r.stderr ?? '')}\n`,
);

console.log(
  `${label}: status=${r.status} signal=${r.signal} ` +
    `stdout=${Buffer.byteLength(r.stdout ?? '')}B stderr=${Buffer.byteLength(r.stderr ?? '')}B`,
);
