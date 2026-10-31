#!/usr/bin/env node
// drive.mjs — unit-464reach, 2026-10-31 START fire (Theseus).
//
// stdout and stderr captured SEPARATELY with the child's `stdio` PINNED, so a 0-byte
// `.err` is a property of the child and not of the capture.

import { spawnSync } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';

const tag = process.argv[2];
const script = process.argv[3];
const rest = process.argv.slice(4);

const r = spawnSync('node', [script, ...rest], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
});
writeFileSync(`${tag}.out`, r.stdout ?? '');
writeFileSync(`${tag}.err`, r.stderr ?? '');
console.log(
  `--- ${tag}  node ${script} ${rest.join(' ')}  exit=${r.status}  ` +
    `out=${statSync(`${tag}.out`).size}B  err=${statSync(`${tag}.err`).size}B`,
);
process.stdout.write(r.stdout ?? '');
if ((r.stderr ?? '').length > 0) process.stdout.write(`\n--- ${tag}.err ---\n${r.stderr}`);
