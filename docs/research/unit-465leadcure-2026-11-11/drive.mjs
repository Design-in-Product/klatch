#!/usr/bin/env node
/**
 * Drive harness for unit-465leadcure.
 *
 * Records, for each named arm, the child's exit code and its stdout/stderr sized
 * **twice and labelled separately**: `utf8Bytes` (Buffer.byteLength) and `chars`
 * (String.length, i.e. UTF-16 code units).
 *
 * Why both, labelled: this seat's 11/11 START fire (`unit-465blanket`, Finding 5) printed
 * `body.length` as "bytes" and got 8406 where the file is 8562 — one step from being
 * reported as a 156-byte shrink. The sharp edge is that a failure path of pure ASCII makes
 * chars == bytes exactly, so a mislabelled count **agrees** on the arm someone would check
 * it against and diverges only on the arms that pass. Labelling both removes the trap
 * rather than remembering it.
 *
 * Usage: node docs/research/unit-465leadcure-2026-11-11/drive.mjs <label> <script-path>
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [label, scriptPath] = process.argv.slice(2);
if (!label || !scriptPath) {
  console.error('usage: drive.mjs <label> <script-path>');
  process.exit(2);
}

const r = spawnSync(process.execPath, [resolve(scriptPath)], { encoding: 'buffer' });

const size = (buf) => {
  const b = buf ?? Buffer.alloc(0);
  const s = b.toString('utf8');
  return { utf8Bytes: Buffer.byteLength(s, 'utf8'), chars: s.length, text: s };
};
const out = size(r.stdout);
const err = size(r.stderr);

const header =
  `# ${label}\n` +
  `# script: ${scriptPath}\n` +
  `# rc: ${r.status}\n` +
  `# stdout: ${out.utf8Bytes} utf8Bytes / ${out.chars} chars\n` +
  `# stderr: ${err.utf8Bytes} utf8Bytes / ${err.chars} chars\n` +
  `# ---- stdout below this line ----\n`;

writeFileSync(resolve(HERE, `${label}.out`), header + out.text + (err.text ? `# ---- stderr ----\n${err.text}` : ''));

console.log(`${label}  rc=${r.status}  stdout ${out.utf8Bytes} B / ${out.chars} chars  ` +
  `stderr ${err.utf8Bytes} B / ${err.chars} chars`);
