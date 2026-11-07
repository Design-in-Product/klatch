/**
 * Five consecutive clean drives of the probe, arm E lines only — the price tag on
 * promoting arm E out of the sweep's DEFERRED list. Arm E is the only timing-shaped
 * arm in that file, and the question a promotion decision turns on is not whether
 * it passes once but whether it builds its state every time without the retry
 * loop ever reaching its third attempt.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
for (let i = 1; i <= 5; i++) {
  const t0 = Date.now();
  let out = '';
  let rc = 0;
  try {
    out = execFileSync('npx', ['tsx', path.join(HERE, 'drive-probe.mts'), 'clean'], {
      cwd: path.resolve(HERE, '../../..'),
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      // stderr is echoed into this recording rather than captured into a local,
      // because a child's stderr vanishes on a run exiting 0 otherwise.
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } catch (err) {
    const e = err;
    rc = e.status ?? -1;
    out = `${e.stdout ?? ''}`;
  }
  const lines = out
    .split('\n')
    .filter((l) => /^ {2}\[E\]|regression check/.test(l))
    .join('\n    ');
  console.log(`run ${i}: rc=${rc} ${Date.now() - t0}ms\n    ${lines}`);
}
