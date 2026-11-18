/**
 * Drive 8: the same gate as drive 7, with the exit code CAPTURED rather than
 * inferred from the presence of a summary line.
 *
 * A `&&` chain that printed its last success line has almost certainly exited 0.
 * "Almost certainly" is not a measurement, and this seat has a filed lesson
 * about reporting a run as exit 0 off a summary line alone.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const r = spawnSync('npm', ['test'], { cwd: repoRoot, encoding: 'utf8' });
process.stdout.write(r.stdout ?? '');
process.stderr.write(r.stderr ?? '');
console.log(`\nnpm test exit=${r.status} (signal=${r.signal ?? 'none'}) cwd=${repoRoot}`);
process.exitCode = r.status ?? 1;
