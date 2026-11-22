#!/usr/bin/env node
/**
 * unit-503stalelabelwidth — BASELINE PROBE, run BEFORE the pre-registration was written, so that
 * every figure this unit registers against is one this seat measured rather than one it carried
 * forward from a memo. Read-only: it drives the real gate and captures BOTH streams separately.
 *
 * `spawnSync`, never `execFileSync` — returning stdout only on a clean exit is exactly the
 * stream-level blindness this unit's own subject is about.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const GATE = `${ROOT}/scripts/verify-decl-body-slicers.mjs`;

const sha = (b) => createHash('sha256').update(b).digest('hex');
const r = spawnSync(process.execPath, [GATE], { cwd: ROOT, maxBuffer: 1 << 26 });

const report = (name, buf) => ({
  bytes: buf.length,
  lines: buf.toString('utf8').split('\n').length - (buf.length && buf.at(-1) === 0x0a ? 1 : 0),
  sha: buf.length ? sha(buf) : null,
});

const out = report('stdout', r.stdout);
const err = report('stderr', r.stderr);
const named = {};
for (const line of r.stdout.toString('utf8').split('\n')) {
  const m = /^\s*(tracked files read|population[^:]*|baseline entries[^:]*):\s*(\d+)/.exec(line);
  if (m) named[m[1].trim()] = Number(m[2]);
  if (/tracked file\(s\) contain the marker token ONLY inside a string/.test(line)) {
    named['quoted-only'] = Number(/^\s*(\d+)/.exec(line)?.[1] ?? -1);
  }
}

console.log(JSON.stringify({ rc: r.status, stdout: out, stderr: err, named }, null, 2));
