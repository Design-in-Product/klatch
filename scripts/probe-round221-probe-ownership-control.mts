/**
 * Round 221 — a control for the pre-flight that Round 217/219 did not have.
 *
 * WHY THIS EXISTS
 *
 * On 2026-09-16 the Round 217 probe ran its entire suite against a server it did not spawn.
 * A leaked server from a truncated Round 219 run was holding port 3001; the probe's own
 * server failed to bind (0-byte log, no scratch DB ever created); and the probe proceeded
 * anyway, reporting PASS on arm after arm, before dying on the first read of a database that
 * did not exist. The guard that should have stopped it —
 *
 *     net.createServer().listen(3001, '127.0.0.1')   // "is the port free?"
 *
 * — returned "free". Node sets SO_REUSEADDR, and BSD/macOS permits a specific-address bind
 * alongside a wildcard one. The guard asked "can I bind here?" as a proxy for "is anyone
 * answering here?", and the two questions have different answers.
 *
 * WHAT THIS DRIVES
 *
 * A stub listener is put on the wildcard address, answering `GET /api/channels` the way a
 * real server does, and then:
 *
 *   1. the OLD bind test is run against it   → expected to wrongly report "free"
 *   2. the NEW request test is run against it → expected to report the occupant
 *   3. the Round 217 probe is spawned         → expected to exit 2 without running an arm
 *   4. the Round 219 probe is spawned         → expected to exit 2 without running an arm
 *
 * Checks 3 and 4 are the load-bearing ones: they are the difference between a fix that reads
 * correctly and a fix that works. The stub is closed in a `finally`, so this control cannot
 * itself leak the thing it is about.
 *
 * ZERO MODEL CALLS — nothing here reaches a route that generates. `packages/` untouched.
 */

import { spawn } from 'child_process';
import { execFileSync } from 'child_process';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3001;
const HOST = '127.0.0.1';

const results: Array<{ check: string; pass: boolean; detail: string }> = [];
function check(name: string, pass: boolean, detail: string) {
  results.push({ check: name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name} — ${detail}`);
}
function measure(name: string, detail: string) {
  console.log(`MEAS ${name} — ${detail}`);
}

function packagesDiff(): string {
  return execFileSync('git', ['diff', '--stat', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const diffBefore = packagesDiff();

/** The guard as Round 217 and Round 219 both shipped it, verbatim. */
async function oldBindTestSaysFree(): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(PORT, HOST);
  });
}

/** The guard as repaired. */
async function newRequestTestFindsOccupant(): Promise<string | null> {
  try {
    const res = await fetch(`http://${HOST}:${PORT}/api/channels`, { signal: AbortSignal.timeout(3000) });
    return `HTTP ${res.status}`;
  } catch {
    return null;
  }
}

function runProbe(script: string): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve) => {
    const p = spawn('npx', ['tsx', path.join('scripts', script)], { cwd: REPO });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => resolve({ code, out }));
  });
}

// ── Pre-flight for the control itself ────────────────────────────────────────

if ((await newRequestTestFindsOccupant()) !== null) {
  console.error(`port ${PORT} is already answering before this control starts. Stop it and re-run.`);
  process.exit(2);
}

// ── The stub occupant, on the wildcard address, as the leaked server was ─────

const stub = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/channels')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('[]');
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end('{"error":"stub"}');
});

try {
  await new Promise<void>((resolve, reject) => {
    stub.once('error', reject);
    stub.listen(PORT, () => resolve()); // no host → wildcard, which is the case that matters
  });
  const addr = stub.address();
  measure('stub occupant', `listening on ${typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`} (wildcard)`);

  // 1 — the old guard, shown wrong rather than argued wrong
  const bindSaysFree = await oldBindTestSaysFree();
  check('the OLD bind test reports the port FREE while a server is answering on it',
    bindSaysFree === true,
    `net.createServer().listen(${PORT}, '${HOST}') → ${bindSaysFree ? 'bound (reported free)' : 'EADDRINUSE'}. ` +
    `This is the exact call both probes shipped as their pre-flight.`);

  // 2 — the new guard
  const occupant = await newRequestTestFindsOccupant();
  check('the NEW request test finds the occupant',
    occupant !== null,
    `GET /api/channels → ${occupant ?? 'no answer'}`);

  // 2b — the two guards disagree, which is the whole finding in one line
  check('the two guards disagree about the same port at the same moment',
    bindSaysFree === true && occupant !== null,
    `bind says free=${bindSaysFree} · request says occupied=${occupant !== null}. ` +
    `A probe trusting the first drives a stranger's process; one trusting the second refuses to start.`);

  // 3/4 — the fix, driven end to end
  for (const script of [
    'probe-round217-multipart-guard-live-http.mts',
    'probe-round219-files-cap-live-http.mts',
  ]) {
    const { code, out } = await runProbe(script);
    const ranAnArm = /^(PASS|FAIL|OPEN|MEAS) \[/m.test(out);
    measure(`${script} exit`, `code=${code} · first line: ${JSON.stringify(out.split('\n').find((l) => l.trim()) ?? '')}`);
    check(`${script} refuses to start against an occupied port`,
      code === 2, `exit code ${code} (2 = pre-flight refusal)`);
    check(`${script} reported no check at all — it did not grade a stranger's process`,
      !ranAnArm, ranAnArm ? 'it printed check lines anyway' : 'no PASS/FAIL/OPEN/MEAS line in its output');
  }
} finally {
  await new Promise<void>((resolve) => stub.close(() => resolve()));
}

// ── Hygiene ──────────────────────────────────────────────────────────────────

const diffAfter = packagesDiff();
check('packages/ untouched by this control', diffAfter === diffBefore,
  diffAfter === diffBefore ? `git diff --stat -- packages/ unchanged (${diffBefore === '' ? 'empty' : 'same as before'})` : `CHANGED:\n${diffAfter}`);

const stillAnswering = await newRequestTestFindsOccupant();
check('this control left nothing listening on the port', stillAnswering === null,
  stillAnswering === null ? `port ${PORT} silent after the stub closed` : `STILL ANSWERING: ${stillAnswering}`);

const failed = results.filter((r) => !r.pass);
console.log('\n' + '─'.repeat(78));
console.log(`Round 221 — ${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  for (const f of failed) console.log(`  FAIL ${f.check} — ${f.detail}`);
}
console.log('─'.repeat(78));
process.exit(failed.length ? 1 : 0);
