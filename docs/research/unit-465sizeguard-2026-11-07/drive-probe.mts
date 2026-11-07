/**
 * Drives `probe-backfill-sidecar-neutrality.mts` itself, with the C1 cripple on or
 * off, so the promoted arm E is graded the way every other arm in this round was:
 * the same cripple, **dead before the arm existed and live after it**.
 *
 *   node --import tsx drive-probe.mts crippled   → C1 on,  arm E must redden
 *   node --import tsx drive-probe.mts clean      → C1 off, arm E must be green
 *
 * Sets the gate variables in-process and then imports the probe, rather than
 * prefixing them on a command line, so the recording and the environment it was
 * taken under cannot drift apart.
 */
import os from 'os';
import path from 'path';

const mode = String(process.argv[2] ?? '');
if (mode !== 'crippled' && mode !== 'clean') {
  console.error('usage: drive-probe.mts <crippled|clean>');
  process.exit(2);
}
if (mode === 'crippled') {
  process.env.KLATCH_U465SG_C1 = '1';
  process.env.KLATCH_U465SG_SENTINEL = path.join(os.tmpdir(), `u465sg-probe-${process.pid}.txt`);
}
console.log(`drive-probe: mode=${mode} C1=${process.env.KLATCH_U465SG_C1 ?? '(unset)'}`);
await import('../../../scripts/probe-backfill-sidecar-neutrality.mts');
