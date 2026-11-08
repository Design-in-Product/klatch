/**
 * Drive the full sweep once and record its exit code beside its capture.
 *
 * A pipeline hides the head and the exit code, and `echo $?` in a compound shell command is a
 * separate clause; this driver exists so the rc is written by the same process that ran the sweep.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const started = new Date().toISOString();
const r = spawnSync(process.execPath, [join(REPO, 'scripts', 'sweep-probes.mjs')], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
const ended = new Date().toISOString();
writeFileSync(join(HERE, 'sweep.out'), r.stdout ?? '', 'utf8');
writeFileSync(join(HERE, 'sweep.err'), r.stderr ?? '', 'utf8');
writeFileSync(
  join(HERE, 'sweep.rc'),
  `status=${r.status}\nsignal=${r.signal}\nerror=${r.error ? r.error.message : 'none'}\nstarted=${started}\nended=${ended}\nstdout_bytes=${(r.stdout ?? '').length}\n`,
  'utf8',
);
console.log(`status=${r.status} started=${started} ended=${ended}`);
