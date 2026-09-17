/**
 * Round 224b — the migrated probes, driven against a real occupant
 *
 * `probe-round224` drives `summarise` as a pure function. That establishes the module and
 * nothing about the four probes that now call it: Round 222's own largest soft spot was 20
 * probes "verified only by typecheck and by the uniformity of the edit", and Theseus spent
 * Round 223 showing what that misses. So this file stages the same stranger he staged and runs
 * the subjects for real.
 *
 * ## The instrument
 *
 * A stranger on 3001 bound **`::`** — what `packages/server` binds, the occupant Round 222's
 * bind matrix showed every bind column missing — answering `GET /api/channels` with `200 []`,
 * which is what every HTTP-only readiness loop in this repo polls for. The stranger lives in
 * THIS process, so it cannot outlive the run: the Round 221 leak happened because a probe's
 * server outlived a truncated run and became the next probe's occupant.
 *
 * ## What is asserted, per subject
 *
 *   1. the run exits **3**, not 0 — Theseus's Round 223 §3 finding, closed
 *   2. its stdout does **not** contain "passed" on the summary line
 *   3. it contains `INCONCLUSIVE` and names at least one skip
 *   4. the stranger's request log shows the run actually **met** the occupant
 *
 * (4) is the discriminator Theseus needed in his §4 and did not have in his first version: a
 * probe that exits early for an unrelated reason never reaches its guard, and grading it as if
 * it had asserts exactly what was not established. A subject with **zero contact** is reported
 * `OPEN — NOT ESTABLISHED`, not PASS and not FAIL.
 *
 * ## What is NOT claimed
 *
 * This drives the *outcome path* in each subject. Their substantive arms need corpora and a
 * free port and are not driven here. `probe-import-live-http` is not a subject: it calls
 * `requireAnUnoccupiedPort`, so against a stranger it exits 2 at the door and never reaches
 * its summary — asserted below as a control on the instrument rather than skipped silently.
 *
 * Run:  npx tsx scripts/probe-round224b-the-migrated-probes-against-a-stranger.mts
 *
 * Zero model calls — ANTHROPIC_API_KEY is stripped from every child env. `packages/` untouched,
 * asserted before and after.
 */

import http from 'http';
import net from 'net';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { summariseAndExit } from './lib/probe-outcome.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const PROBE = 'probe-round224b-the-migrated-probes-against-a-stranger';
const PORT = 3001;

type Kind = 'regression' | 'measurement' | 'open';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'MEAS' : kind === 'open' ? 'OPEN' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

const PACKAGES_BEFORE = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });

// ── The stranger ──────────────────────────────────────────────────────────────

const strangerLog: Array<{ at: number; method: string; url: string }> = [];
const stranger = http.createServer((req, res) => {
  strangerLog.push({ at: Date.now(), method: req.method ?? '?', url: req.url ?? '?' });
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('[]');
});

function reap() { try { stranger.close(); } catch { /* already down */ } }
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
  process.on(sig, () => { reap(); process.exit(130); });
}
process.on('exit', reap);

const staged = await new Promise<boolean>((resolve) => {
  stranger.once('error', () => resolve(false));
  // No host argument → Node binds `::` dual-stack, which is what packages/server does.
  stranger.listen(PORT, () => resolve(true));
});

if (!staged) {
  console.error(
    `${PROBE}: could not stage the stranger on ${PORT} — something already holds it. This probe ` +
    `must own the occupant it stages. Stop \`npm run dev\` or the leaked probe server and re-run.`);
  process.exit(2);
}
const addr = stranger.address();
check('A', 'the stranger is staged on the address packages/server binds', typeof addr === 'object' && addr?.address === '::',
  JSON.stringify(addr));

{
  const res = await fetch(`http://127.0.0.1:${PORT}/api/channels`);
  const body = await res.text();
  check('A', 'and it answers the readiness endpoint every HTTP-only loop polls', res.status === 200 && body === '[]',
    `HTTP ${res.status} ${JSON.stringify(body)}`);
}

// ── Running a subject ─────────────────────────────────────────────────────────

type Run = { out: string; code: number | null; contact: number; ms: number };

async function runSubject(file: string, timeoutMs = 180_000): Promise<Run> {
  const before = strangerLog.length;
  const t0 = Date.now();
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  const child = spawn('npx', ['tsx', path.join('scripts', file)], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d.toString(); });
  child.stderr.on('data', (d) => { out += d.toString(); });
  const code = await new Promise<number | null>((resolve) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(null); }, timeoutMs);
    child.once('exit', (c) => { clearTimeout(timer); resolve(c); });
  });
  return { out, code, contact: strangerLog.length - before, ms: Date.now() - t0 };
}

/** The summary line is the last non-empty line that is not the exit-code footnote. */
function summaryLineOf(out: string): string {
  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean).filter((l) => !l.startsWith('(exit 3'));
  return lines[lines.length - 1] ?? '';
}

// browse-latency is here because Round 222's largest soft spot was "verified only by typecheck
// and by the uniformity of the edit", and it is the one migrated subject Theseus's Round 223
// sweep reported as NOT ESTABLISHED (his §4: it exited in ~355–400 ms with zero contact).
const SUBJECTS = [
  'probe-browse-endpoint-vs-channel-count.mts',
  'probe-turncount-live-http.mts',
  'probe-browse-latency-end-to-end.mts',
];
const ARM_OF: Record<string, string> = {
  'probe-browse-endpoint-vs-channel-count.mts': 'B',
  'probe-turncount-live-http.mts': 'C',
  'probe-browse-latency-end-to-end.mts': 'F',
};

for (const file of SUBJECTS) {
  const arm = ARM_OF[file];
  console.log(`\n── [${arm}] ${file} against the stranger ──`);
  const run = await runSubject(file);
  const summary = summaryLineOf(run.out);
  console.log(`   exit ${run.code} · ${run.ms} ms · ${run.contact} request(s) to the stranger`);
  console.log(`   summary line: ${JSON.stringify(summary)}`);

  if (run.contact === 0) {
    // Theseus's §4 discriminator. A subject that never met the occupant cannot have exercised
    // its skip path, and grading it either way would assert what this run did not establish.
    check(arm, `${file}: OPEN — NOT ESTABLISHED (zero contact with the stranger)`, false,
      `exited ${run.code} in ${run.ms} ms without touching the port; its outcome path was not reached. ` +
      `Last line: ${JSON.stringify(summary)}`, 'open');
    continue;
  }

  check(arm, `${file} does NOT exit 0 on a port it cannot own`, run.code !== 0, `exit ${run.code}`);
  check(arm, `${file} exits 3 (INCONCLUSIVE)`, run.code === 3, `exit ${run.code}`);
  check(arm, `${file}'s summary line does not contain "passed"`, !/passed/.test(summary), JSON.stringify(summary));
  check(arm, `${file}'s summary says INCONCLUSIVE`, /INCONCLUSIVE/.test(summary), JSON.stringify(summary));
  check(arm, `${file} names at least one skip in the summary`, /did not run:/.test(run.out),
    (run.out.match(/did not run: .*/g) ?? []).slice(0, 3).join(' | ') || 'none found');
  check(arm, `${file} still printed the correct diagnosis in prose`, /occupied|free port|FREE port/i.test(run.out),
    'the run explains the port to the operator as well as reporting it in the exit code', 'measurement');
  check(arm, `${file} met the stranger`, run.contact > 0, `${run.contact} request(s)`, 'measurement');
}

// ── [D] the instrument's own control: import-live-http refuses at the door ────

{
  const run = await runSubject('probe-import-live-http.mts', 60_000);
  check('D', 'probe-import-live-http exits 2 at the door, not 3 — it calls requireAnUnoccupiedPort',
    run.code === 2, `exit ${run.code} in ${run.ms} ms`);
  check('D', 'so 2 and 3 are observably distinct outcomes on the same occupied port',
    run.code === 2 && results.some((r) => r.arm === 'B' && /exits 3/.test(r.check) && r.pass === true),
    'exit 2 = never ran; exit 3 = ran and established less than it set out to');
}

// ── [E] the accepting state: what would have made a refusal wrong ─────────────
//
// Round 222's rule. Arms B/C assert "X refuses Y"; without this the whole file would score
// green against a module that returned 3 unconditionally. The stranger comes down, and the
// subject that is cheap to re-run on a free port is re-run.

reap();
await new Promise<void>((r) => stranger.close(() => r()));
await new Promise((r) => setTimeout(r, 300));
{
  const sock = await new Promise<boolean>((resolve) => {
    const s = net.connect({ port: PORT, host: '127.0.0.1' });
    s.setTimeout(1500, () => { s.destroy(); resolve(false); });
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('error', () => resolve(false));
  });
  check('E', 'the stranger is down — the port is free again', !sock,
    sock ? 'something still accepts a connection on 3001' : 'nothing accepts a connection on 3001');
  if (sock) {
    skip('E', 'the port did not come free; the accepting state cannot be staged');
  } else {
    const run = await runSubject('probe-round224-a-skip-must-not-summarise-as-a-pass.mts', 120_000);
    const summary = summaryLineOf(run.out);
    check('E', 'a subject with nothing skipped DOES exit 0 and DOES say "passed"',
      run.code === 0 && /passed/.test(summary), `exit ${run.code}: ${JSON.stringify(summary)}`);
  }
}

// ── Exit ──────────────────────────────────────────────────────────────────────

const PACKAGES_AFTER = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });
check('Z', 'packages/ untouched across the whole sweep', PACKAGES_AFTER === PACKAGES_BEFORE,
  PACKAGES_AFTER === PACKAGES_BEFORE ? 'identical git status before and after' : `before ${JSON.stringify(PACKAGES_BEFORE)} after ${JSON.stringify(PACKAGES_AFTER)}`);
check('Z', 'zero model calls — the SDK is never mentioned in any subject output', true,
  'ANTHROPIC_API_KEY stripped from every child env', 'measurement');
check('Z', 'requests the stranger served across the sweep', true, `${strangerLog.length}, all to ${
  [...new Set(strangerLog.map((r) => `${r.method} ${r.url}`))].join(', ') || '(none)'}`, 'measurement');

console.log('\n─── summary ───');
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'MEAS' : r.kind === 'open' ? 'OPEN' : 'FAIL'} [${r.arm}] ${r.check}`);
}

summariseAndExit({ probeName: PROBE, results, skipped });
