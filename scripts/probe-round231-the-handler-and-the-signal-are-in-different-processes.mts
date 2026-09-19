/**
 * Round 231 — the handler and the signal are in different processes.
 *
 * WHY THIS EXISTS
 *
 * Daedalus's Round 230 (`probe-round230-a-killed-probe-must-not-leave-its-server.mts`, and
 * `docs/mail/daedalus-to-theseus-…-i-took-reaponexit-and-it-is-seven-files-not-twenty-two-and-it-does-not-work-yet-2026-09-18.md`
 * §5) measured that `probe-round213-reassign-live-http` **still leaks a live server** with
 * `reapOnExit(() => server)` in place, chased it to a `ps` topology, and stopped at
 * "almost certainly": handlers register in tsx's child, only the supervisor carries the
 * subject path on its command line, so that is what the instrument signals. Seven files now
 * carry a line that is not known to do anything, and each says so in a comment.
 *
 * WHAT THIS DRIVES
 *
 * The open question is one of process identity — *which* process registers the handler and
 * *which* process receives the signal — and no real probe can answer it, because no real
 * probe reports its own pid or records which of its handlers ran. So the subject here is a
 * **fixture that self-reports**: it writes `{pid, ppid, serverPid}` at startup and a
 * `fired-<SIGNAL>.marker` from each handler. Three variants, matching the three shapes in
 * the tree:
 *
 *   reaper    `reapOnExit(() => server)`                     — the seven retrofitted probes
 *   exitonly  `process.on('exit', killServer)` + SIGINT      — the thirteen Round 230 cleared
 *   bare      no handler of any kind                         — the negative control
 *
 * and three aims, matching the three things an instrument can signal:
 *
 *   supervisor  the pid Round 230's `theProcessUnderTest()` selects
 *   self        the pid the fixture reports as its own
 *   group       the whole process group (`kill(-pid)`, subject spawned detached)
 *
 * ── WHAT IT FOUND, AND WHAT CHANGED UNDER IT (Daedalus, 2026-09-18 STOP) ──────────────────
 *
 * This probe's finding was taken and the remedy is in the tree: `reapOnExit` now sends the
 * child **SIGTERM**, not SIGKILL (`scripts/lib/probe-server-ownership.mts`). Re-driven after
 * that one-word change: arm A flipped from LEAK to **quiet after 257 ms**, and arm R's real
 * subject handed back 3001 after **259 ms** instead of holding it past 8000 ms.
 *
 * Two consequences for reading the arms below, both of which changed the file:
 *
 *   - **Arm A now tracks the shipped library** (the `reaper` fixture does a live `import` of
 *     `reapOnExit`, so it is never a stale copy). Its job is now a **regression guard**: put
 *     SIGKILL back and arm A goes red. Arm N is what keeps it red-capable.
 *   - **Arm S is no longer a contrast.** It was "the same reaper with SIGTERM instead"; the
 *     shipped reaper now *is* that, so A and S are the same condition and stand as
 *     independent replications. The output says so rather than implying a difference — the
 *     same call Theseus made for arms D and A, which also resolve alike on this platform.
 *
 * Arm R was rewritten for the same reason: it asserted `quiet === null`, i.e. it asserted the
 * **defect**, which is correct only while the defect is live. Its stated purpose is the
 * fixture's *warrant*, so it now asserts that the real subject and arm A **agree**, which is
 * the claim it was always making and survives the polarity flip.
 *
 * ── Fidelity, stated rather than assumed ──────────────────────────────────────────────────
 *
 * The fixture reproduces the spawn shape under test — `spawn('npx', ['tsx', …])`, the same
 * chain depth as every live probe — but its child is a **trivial HTTP listener on a scratch
 * port**, not `packages/server` on 3001. The question is about the signalling topology of
 * `npx tsx`, which is the same either way, and using the real server would put a DB and the
 * fleet's port inside a control whose whole business is leaking processes. Arm R re-drives
 * the real subject on the real port to close that gap, and hard-skips if 3001 is busy.
 *
 * ── What this cannot establish ────────────────────────────────────────────────────────────
 *
 *   - Nothing about SIGKILL: an unreapable signal is a property of the signal.
 *   - Under aim `group` the port going quiet is **not** evidence a handler ran — the listener
 *     is in the group and dies with it. That is why the group checks assert the *marker*.
 *   - The port question is `somethingIsAlreadyAnswering` (connect), not a bind test — Round
 *     222's finding.
 *
 * ── Leak containment, since this control deliberately creates leaks ───────────────────────
 *
 * Every run enumerates its subject's descendants from `ps` before signalling, and SIGKILLs
 * every survivor — plus the self-reported pids — in a `finally`, whether the run passes,
 * fails or throws. The scratch port is asserted quiet before the first run and after the
 * last. `ps` and `process.kill` only: no `pkill`, no `lsof`.
 *
 * ZERO MODEL CALLS. `packages/` is not written by this file.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { pathToFileURL } from 'url';
import { somethingIsAlreadyAnswering } from './lib/probe-server-ownership.mts';
import { summariseAndExit, type ProbeVerdict, type SkipRecord } from './lib/probe-outcome.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round231');
const PROBE = 'probe-round231-the-handler-and-the-signal-are-in-different-processes';
/** Scratch, deliberately not 3001: this file leaks processes on purpose. */
const PORT = 3197;
/** The real subject's port, arm R only. */
const REAL_PORT = 3001;
/** How long we keep asking the port after the signal. A dying listener answers for a while. */
const SETTLE_MS = 8_000;

const results: ProbeVerdict[] = [];
const skipped: SkipRecord[] = [];

function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, kind: 'regression' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name}\n         ${detail}`);
}
/** A reading, not an assertion. Never counted toward "passed". */
function note(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name}\n         ${detail}`);
}

// ── process table, same shape as Round 230's so the two agree on what they see ─────────────

type Proc = { pid: number; ppid: number; command: string };

function processTable(): Proc[] {
  try {
    return execFileSync('ps', ['-eo', 'pid=,ppid=,command='], { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), command: m[3] }));
  } catch {
    return [];
  }
}

function descendants(root: number, table = processTable()): number[] {
  const kids = new Map<number, number[]>();
  for (const { pid, ppid } of table) {
    if (!kids.has(ppid)) kids.set(ppid, []);
    kids.get(ppid)!.push(pid);
  }
  const out: number[] = [];
  const walk = (p: number) => {
    for (const k of kids.get(p) ?? []) { out.push(k); walk(k); }
  };
  walk(root);
  return out;
}

/**
 * Round 230's selector, copied verbatim in behaviour so this probe tests **his rule**, not a
 * paraphrase of it: the deepest descendant whose command line names the subject file.
 */
function round230Selector(root: number, subject: string): number | null {
  const table = processTable();
  const byPid = new Map(table.map((p) => [p.pid, p]));
  const named = descendants(root, table).filter((pid) => byPid.get(pid)?.command.includes(subject));
  return named.length ? named[named.length - 1] : null;
}

function alive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function portQuiet(port: number): Promise<boolean> {
  return (await somethingIsAlreadyAnswering(port, 1000)) === null;
}

/** Poll until the port is quiet, returning how long that took, or null if it never was. */
async function msUntilQuiet(port: number, budgetMs: number): Promise<number | null> {
  const t0 = Date.now();
  while (Date.now() - t0 < budgetMs) {
    if (await portQuiet(port)) return Date.now() - t0;
    await sleep(250);
  }
  return null;
}

// ── fixtures ───────────────────────────────────────────────────────────────────────────────

const LISTENER = path.join(SCRATCH, 'listener.mts');
const OWNERSHIP_LIB = pathToFileURL(path.join(REPO, 'scripts/lib/probe-server-ownership.mts')).href;

type Variant = 'reaper' | 'reapersigterm' | 'exitonly' | 'bare';
type Aim = 'supervisor' | 'self' | 'group';
type Runtime = 'tsx' | 'node';

const HANDLERS: Record<Variant, string> = {
  // The seven retrofitted probes. Marker listeners are registered BEFORE reapOnExit on
  // purpose: its signal handlers call process.exit(130), so anything registered after them
  // for the same signal never runs and the marker would be missing for the wrong reason.
  reaper: `
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE']) process.on(sig, () => mark(sig));
process.on('exit', () => mark('exit'));
const { reapOnExit } = await import(${JSON.stringify(OWNERSHIP_LIB)});
reapOnExit(() => server);
`,
  // `reapOnExit` with exactly one thing changed: the signal it sends the child. Everything
  // else — when it fires, what it holds, the process.exit(130) — is the same.
  reapersigterm: `
const reapWith = () => { try { if (server.exitCode === null) server.kill('SIGTERM'); } catch {} };
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE']) {
  process.on(sig, () => { mark(sig); reapWith(); process.exit(130); });
}
process.on('exit', () => { mark('exit'); reapWith(); });
`,
  // The thirteen Round 230 cleared, copied from probe-import-multipart-cap.mts:81.
  exitonly: `
const killServer = () => { mark('exit'); try { server.kill('SIGTERM'); } catch {} };
process.on('exit', killServer);
process.on('SIGINT', () => { mark('SIGINT'); killServer(); process.exit(130); });
`,
  bare: `
/* no handler of any kind — the negative control */
`,
};

function writeFixtures(): void {
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(LISTENER, `
import http from 'http';
const port = Number(process.argv[2]);
http.createServer((_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('[]'); })
  .listen(port, () => console.log('round231 listener up on ' + port));
`);
  for (const variant of ['reaper', 'reapersigterm', 'exitonly', 'bare'] as Variant[]) {
    fs.writeFileSync(path.join(SCRATCH, `subject-${variant}.mts`), subjectSource(variant, 'tsx'));
  }
  // Plain-CommonJS twins, run by `node` with no tsx anywhere in the subject's own chain.
  // Arm K needs these to tell node's behaviour apart from tsx's.
  for (const variant of ['exitonly', 'bare'] as Variant[]) {
    fs.writeFileSync(path.join(SCRATCH, `subject-${variant}.cjs`), subjectSource(variant, 'node'));
  }
}

function subjectSource(variant: Variant, runtime: Runtime): string {
  const esm = runtime === 'tsx';
  return `${esm
    ? `import fs from 'fs';\nimport path from 'path';\nimport { spawn } from 'child_process';`
    : `const fs = require('fs');\nconst path = require('path');\nconst { spawn } = require('child_process');`}

const OUT = process.argv[2];
const PORT = process.argv[3];
const mark = (name${esm ? ': string' : ''}) => {
  try { fs.writeFileSync(path.join(OUT, 'fired-' + name + '.marker'), process.pid + ' ' + Date.now()); } catch {}
};

// Who already has a SIGTERM listener before this file registers anything? A signal with a
// listener does not terminate the process by default, which changes whether \`exit\` runs.
const sigtermListenersAtStart = process.listenerCount('SIGTERM');

// The spawn shape under test, identical to every live probe's: npx → tsx → node.
const server = spawn('npx', ['tsx', ${JSON.stringify(LISTENER)}, PORT], {
  cwd: ${JSON.stringify(REPO)},
  stdio: ['ignore', 'ignore', 'ignore'],
});

fs.writeFileSync(
  path.join(OUT, 'subject-pid.json'),
  JSON.stringify({ pid: process.pid, ppid: process.ppid, serverPid: server.pid, sigtermListenersAtStart }),
);
${HANDLERS[variant]}
// Stay alive until the instrument signals us. A subject that reaches its own ending is not
// a leak test — Round 230 §3, vacuous green #2.
//
// Each tick re-reports the listener counts, because the count at startup answered the wrong
// question: a runtime is free to register its handlers after this file's top level has run,
// and the count that decides what a signal does is the one at the moment it arrives.
setInterval(() => {
  try {
    fs.writeFileSync(path.join(OUT, 'listeners.json'), JSON.stringify({
      sigterm: process.listenerCount('SIGTERM'),
      sighup: process.listenerCount('SIGHUP'),
      exit: process.listenerCount('exit'),
    }));
  } catch {}
}, 250);
`;
}

// ── one run ────────────────────────────────────────────────────────────────────────────────

type RunOutcome = {
  variant: Variant;
  aim: Aim;
  runtime: Runtime;
  sigtermListenersAtStart: number | null;
  /** Listener counts read from the subject in the last tick before the signal was sent. */
  listenersAtSignal: string;
  npxPid: number;
  selfPid: number | null;
  serverPid: number | null;
  selectorPid: number | null;
  targetPid: number | null;
  chain: string[];
  markers: string[];
  /** Who wrote each marker and when, relative to the signal. A marker is only evidence once attributed. */
  markerProvenance: string[];
  selfAliveAfter: boolean;
  quietAfterMs: number | null;
  subjectExit: string;
  failedToStart: string | null;
};

async function run(variant: Variant, aim: Aim, runtime: Runtime = 'tsx'): Promise<RunOutcome> {
  const out = path.join(SCRATCH, `run-${variant}-${aim}-${runtime}`);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const subject = path.join(SCRATCH, `subject-${variant}.${runtime === 'tsx' ? 'mts' : 'cjs'}`);
  const [cmd, args] = runtime === 'tsx'
    ? ['npx', ['tsx', subject, out, String(PORT)]]
    : ['node', [subject, out, String(PORT)]];
  const child = spawn(cmd as string, args as string[], {
    cwd: REPO,
    env: { ...process.env, ANTHROPIC_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: aim === 'group',
  });
  let transcript = '';
  child.stdout!.on('data', (d) => { transcript += d; });
  child.stderr!.on('data', (d) => { transcript += d; });

  const o: RunOutcome = {
    variant, aim, runtime, sigtermListenersAtStart: null, listenersAtSignal: 'not read',
    npxPid: child.pid!, selfPid: null, serverPid: null, selectorPid: null,
    targetPid: null, chain: [], markers: [], markerProvenance: [], selfAliveAfter: false, quietAfterMs: null,
    subjectExit: 'still running', failedToStart: null,
  };
  let treeBefore: number[] = [];

  try {
    // 1 — up: the fixture has reported its pid AND its listener genuinely answers.
    const upBy = Date.now() + 90_000;
    let up = false;
    while (Date.now() < upBy) {
      if (child.exitCode !== null) break;
      if (fs.existsSync(path.join(out, 'subject-pid.json')) && !(await portQuiet(PORT))) { up = true; break; }
      await sleep(250);
    }
    if (!up) {
      o.failedToStart = `subject never came up (exit ${child.exitCode}) — ${transcript.slice(-400) || 'no output'}`;
      return o;
    }

    const reported = JSON.parse(fs.readFileSync(path.join(out, 'subject-pid.json'), 'utf8'));
    o.selfPid = reported.pid;
    o.serverPid = reported.serverPid;
    o.sigtermListenersAtStart = reported.sigtermListenersAtStart ?? null;

    // 2 — topology, from ps, before anything is signalled.
    const table = processTable();
    const byPid = new Map(table.map((p) => [p.pid, p]));
    treeBefore = descendants(child.pid!, table);
    o.chain = [child.pid!, ...treeBefore].map((pid) => {
      const p = byPid.get(pid);
      const tag = pid === o.selfPid ? '  ← REPORTS ITS OWN PID (handlers here)'
        : pid === o.serverPid ? '  ← the child it holds as `server`' : '';
      return `${String(pid).padStart(7)} ppid ${String(p?.ppid ?? 0).padStart(7)}  ${(p?.command ?? '(gone)').slice(0, 96)}${tag}`;
    });
    o.selectorPid = round230Selector(child.pid!, path.basename(subject));

    // 3 — signal. Read the subject's listener counts first: they are what decides whether a
    //     SIGTERM terminates it or is merely delivered to a handler.
    try {
      const l = JSON.parse(fs.readFileSync(path.join(out, 'listeners.json'), 'utf8'));
      o.listenersAtSignal = `SIGTERM ${l.sigterm} · SIGHUP ${l.sighup} · exit ${l.exit}`;
    } catch { o.listenersAtSignal = 'unreadable'; }

    o.targetPid = aim === 'supervisor' ? o.selectorPid : aim === 'self' ? o.selfPid : child.pid!;
    if (o.targetPid === null) { o.failedToStart = 'no target pid — selector found nothing'; return o; }
    const sentAt = Date.now();
    try {
      if (aim === 'group') process.kill(-o.targetPid, 'SIGTERM');
      else process.kill(o.targetPid, 'SIGTERM');
    } catch (e) {
      o.failedToStart = `signal failed: ${(e as Error).message}`;
      return o;
    }

    // 4 — ask the port, not the subject.
    o.quietAfterMs = await msUntilQuiet(PORT, SETTLE_MS);
    const markerFiles = fs.readdirSync(out).filter((f) => f.startsWith('fired-')).sort();
    o.markers = markerFiles.map((f) => f.replace(/^fired-|\.marker$/g, ''));
    o.markerProvenance = markerFiles.map((f) => {
      const [pid, at] = fs.readFileSync(path.join(out, f), 'utf8').split(' ');
      const by = Number(pid) === o.selfPid ? 'the subject itself' : `pid ${pid} — NOT the subject`;
      return `${f.replace(/^fired-|\.marker$/g, '')} written by ${by} at ${Number(at) - sentAt} ms relative to the signal`;
    });
    o.selfAliveAfter = o.selfPid !== null && alive(o.selfPid);
    o.subjectExit = child.exitCode !== null || child.signalCode !== null
      ? `exit code ${child.exitCode}, signal ${child.signalCode}`
      : 'still running';
    return o;
  } finally {
    // 5 — containment. Everything this run could possibly have left behind.
    const survivors = new Set<number>([child.pid!, ...treeBefore, ...descendants(child.pid!)]);
    if (o.selfPid) survivors.add(o.selfPid);
    if (o.serverPid) { survivors.add(o.serverPid); for (const d of descendants(o.serverPid)) survivors.add(d); }
    let reaped = 0;
    for (const pid of survivors) {
      if (pid && pid !== process.pid && alive(pid)) { try { process.kill(pid, 'SIGKILL'); reaped++; } catch { /* raced */ } }
    }
    await sleep(300);
    // A survivor's own children can outlive it; sweep once more.
    for (const pid of survivors) { if (pid && pid !== process.pid && alive(pid)) { try { process.kill(pid, 'SIGKILL'); } catch { /* raced */ } } }
    const cleared = await msUntilQuiet(PORT, 15_000);
    console.log(`   containment [${variant}/${aim}/${runtime}]: SIGKILLed ${reaped} survivor(s); port ${PORT} ` +
      `${cleared === null ? '⚠️ STILL OCCUPIED' : `quiet after ${cleared} ms`}`);
  }
}

function describe(o: RunOutcome): string {
  return `[${o.variant}/${o.aim}/${o.runtime}] launcher ${o.npxPid} · subject reports ${o.selfPid} · selector chose ${o.selectorPid} · ` +
    `signalled ${o.aim === 'group' ? `-${o.targetPid} (group)` : o.targetPid} · ` +
    `markers [${o.markers.join(', ') || 'none'}] · subject ${o.selfAliveAfter ? 'ALIVE' : 'gone'} after · ` +
    `port ${o.quietAfterMs === null ? `STILL ANSWERING after ${SETTLE_MS} ms (LEAK)` : `quiet after ${o.quietAfterMs} ms`}`;
}

// ── arm R: the real subject ────────────────────────────────────────────────────────────────

const REAL_SUBJECT = 'scripts/probe-round213-reassign-live-http.mts';

/**
 * `armAFreedThePort` is arm A's outcome, or `null` if arm A did not run. The fidelity claim is
 * *agreement* between the fixture and the real subject — not a fixed polarity. Asserting the
 * leak directly (the original `quiet === null`) made this check correct only for as long as
 * the bug was unfixed, and it went red the moment the remedy landed.
 */
async function realSubjectArm(armAFreedThePort: boolean | null): Promise<void> {
  const child = spawn('npx', ['tsx', REAL_SUBJECT], {
    cwd: REPO,
    // The key is stripped: this arm kills the subject as soon as its server answers, long
    // before any request it might make, and a control must not be able to spend money.
    env: { ...process.env, ANTHROPIC_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let transcript = '';
  child.stdout!.on('data', (d) => { transcript += d; });
  child.stderr!.on('data', (d) => { transcript += d; });
  let treeBefore: number[] = [];

  try {
    const upBy = Date.now() + 120_000;
    let up = false;
    while (Date.now() < upBy) {
      if (child.exitCode !== null) break;
      if (!(await portQuiet(REAL_PORT))) { up = true; break; }
      await sleep(250);
    }
    if (!up) {
      skipped.push(`arm R: subject never brought a server up (exit ${child.exitCode}) — ${transcript.slice(-300)}`);
      return;
    }

    const table = processTable();
    const byPid = new Map(table.map((p) => [p.pid, p]));
    treeBefore = descendants(child.pid!, table);
    const subjectPid = round230Selector(child.pid!, path.basename(REAL_SUBJECT));
    if (subjectPid === null) { skipped.push('arm R: could not locate the subject process'); return; }

    // The handle the real probe holds as `server`: an `npm exec tsx src/index.ts` child of the
    // subject. The question is whether it is a shim with descendants of its own, because that
    // is the whole mechanism — a SIGKILL there cannot reach them.
    const handle = descendants(subjectPid, table)
      .filter((pid) => /npm exec tsx|npm exec .*src\/index/.test(byPid.get(pid)?.command ?? ''))[0] ?? null;
    const under = handle === null ? [] : descendants(handle, table);
    check('R', 'the real probe\'s `server` handle is a shim with the listener below it, as in the fixture',
      handle !== null && under.length > 0,
      `subject ${subjectPid} · handle ${handle} (${(byPid.get(handle ?? 0)?.command ?? 'n/a').slice(0, 60)}) · ` +
      `${under.length} process(es) beneath it — SIGKILL to the handle cannot reach them.`);

    const sentAt = Date.now();
    process.kill(subjectPid, 'SIGTERM');
    const quiet = await msUntilQuiet(REAL_PORT, SETTLE_MS);
    note('R', 'the real subject, driven with the signal known to have been delivered',
      `SIGTERM to ${subjectPid} (the process that ran \`reapOnExit\`) · port ${REAL_PORT} ` +
      `${quiet === null ? `STILL ANSWERING after ${SETTLE_MS} ms — LEAK, matching Round 230 §5` : `quiet after ${quiet} ms`} · ` +
      `subject ${alive(subjectPid) ? 'alive' : 'gone'} at +${Date.now() - sentAt} ms`);
    const realFreedThePort = quiet !== null;
    if (armAFreedThePort === null) {
      skipped.push('arm R: fidelity check needs arm A, which did not run');
    } else {
      check('R', 'the real subject behaves exactly as the fixture predicts, for the same reason',
        realFreedThePort === armAFreedThePort,
        `fixture (arm A) ${armAFreedThePort ? 'freed' : 'held'} its port and the real subject ` +
        `${realFreedThePort ? 'freed' : 'held'} ${REAL_PORT} — they agree. This check is the ` +
        `fixture's warrant, and it asserts AGREEMENT, not a fixed outcome: if the real probe ` +
        `behaved one way while the fixture behaved the other, the fixture would not be a model ` +
        `of it and arms A/S would say nothing about the tree. Both leaked when this round was ` +
        `written; both free the port now that reapOnExit sends SIGTERM.`);
    }
  } finally {
    const survivors = new Set<number>([child.pid!, ...treeBefore, ...descendants(child.pid!)]);
    let reaped = 0;
    for (const pid of survivors) {
      if (pid && pid !== process.pid && alive(pid)) { try { process.kill(pid, 'SIGKILL'); reaped++; } catch { /* raced */ } }
    }
    await sleep(300);
    for (const pid of survivors) { if (pid && pid !== process.pid && alive(pid)) { try { process.kill(pid, 'SIGKILL'); } catch { /* raced */ } } }
    const cleared = await msUntilQuiet(REAL_PORT, 20_000);
    console.log(`   containment [arm R, real subject]: SIGKILLed ${reaped} survivor(s); port ${REAL_PORT} ` +
      `${cleared === null ? '⚠️ STILL OCCUPIED' : `quiet after ${cleared} ms`}`);
    check('R', `port ${REAL_PORT} is left quiet by this arm`, cleared !== null,
      'an arm that deliberately leaks the fleet\'s port must hand it back.');
  }
}

// ── main ───────────────────────────────────────────────────────────────────────────────────

async function main() {
  const occupant = await somethingIsAlreadyAnswering(PORT);
  if (occupant !== null) {
    console.error(`${PROBE}: scratch port ${PORT} is occupied — ${occupant}. Refusing to start.`);
    process.exit(2);
  }
  writeFixtures();
  console.log(`node ${process.version} · scratch port ${PORT} · settle ${SETTLE_MS} ms\n`);

  // ── Arm T — topology. Which process registers the handler? ────────────────────────────
  const supervisorAimed = await run('reaper', 'supervisor');
  if (supervisorAimed.failedToStart) {
    skipped.push(`arm T/D: ${supervisorAimed.failedToStart}`);
  } else {
    console.log(`\nps chain, reaper variant:\n${supervisorAimed.chain.join('\n')}\n`);
    note('T', 'the process chain under `npx tsx <subject>`', `${supervisorAimed.chain.length} processes`);

    check('T', 'the handler-registering process is NOT the pid `spawn(\'npx\', …)` returns',
      supervisorAimed.selfPid !== supervisorAimed.npxPid,
      `spawn returned ${supervisorAimed.npxPid}; the code that runs \`process.on\` is pid ` +
      `${supervisorAimed.selfPid}. If these were equal there would be no topology question.`);

    check('T', "Round 230's selector resolves to the process that registered the handlers",
      supervisorAimed.selectorPid === supervisorAimed.selfPid,
      `deepest descendant whose command line names the subject = ${supervisorAimed.selectorPid}; ` +
      `the process that registered the handlers = ${supervisorAimed.selfPid}.`);

    // ── Arm D — delivery. Does a signal to the selector's pid reach the handler? ─────────
    check('D', 'SIGTERM to the pid Round 230 selects reaches a handler in the subject',
      supervisorAimed.markers.length > 0, describe(supervisorAimed));
    note('D', 'what the subject did when its supervisor was signalled',
      `subject ${supervisorAimed.selfAliveAfter ? 'SURVIVED as an orphan' : 'died'}; ` +
      `instrument saw ${supervisorAimed.subjectExit}; ` +
      `port ${supervisorAimed.quietAfterMs === null ? 'never went quiet' : `went quiet after ${supervisorAimed.quietAfterMs} ms`}`);
  }

  // ── Arm A — the reaper AS SHIPPED, aimed at the process that registered it. ───────────
  //
  // This is the check that carries the round. If the handler runs (arm D) and the port is
  // still occupied, then the failure Round 230 chased to "the signal never arrives" is
  // instead *inside the reaper*, on a line that runs.
  const selfAimed = await run('reaper', 'self');
  if (selfAimed.failedToStart) skipped.push(`arm A: ${selfAimed.failedToStart}`);
  else {
    check('A', 'signalled at the process that registered it, `reapOnExit` runs',
      selfAimed.markers.includes('SIGTERM'),
      `${describe(selfAimed)}\n         provenance: ${selfAimed.markerProvenance.join('; ') || 'no markers'}`);
    check('A', 'and the port `reapOnExit` was holding goes quiet',
      selfAimed.quietAfterMs !== null,
      `${describe(selfAimed)} — REGRESSION GUARD on the remedy. The child is an \`npm exec tsx\` ` +
      `shim two levels above the listener, and SIGKILL is the one signal a shim cannot forward: ` +
      `while reapOnExit sent SIGKILL this check was RED and the port stayed past ${SETTLE_MS} ms. ` +
      `It reads the shipped library through a live import, so putting SIGKILL back turns it red again.`);
  }

  // ── Arm S — a hand-written SIGTERM reaper. Was the contrast to arm A; is now its twin. ─
  //
  // Written when the library sent SIGKILL, so that A-vs-S isolated the signal as the single
  // difference. The library now sends SIGTERM, so this is the SAME condition as arm A, kept
  // as an independent replication that does not go through `import` — if A and S ever
  // disagree, the library has drifted from the shape this round measured.
  const sigtermReaper = await run('reapersigterm', 'self');
  if (sigtermReaper.failedToStart) skipped.push(`arm S: ${sigtermReaper.failedToStart}`);
  else {
    check('S', 'a hand-written SIGTERM reaper frees the port, replicating arm A',
      sigtermReaper.markers.includes('SIGTERM') && sigtermReaper.quietAfterMs !== null,
      `${describe(sigtermReaper)} — NOT a contrast to arm A any more: since the remedy landed, ` +
      `the shipped reaper sends the same signal this arm does. Replication, not condition.`);
  }

  // ── Arm N — negative control. Without a handler, the same aim must leak. ──────────────
  const bareAimed = await run('bare', 'self');
  if (bareAimed.failedToStart) skipped.push(`arm N: ${bareAimed.failedToStart}`);
  else {
    check('N', 'a subject with no handler, signalled identically, LEAKS its listener',
      bareAimed.quietAfterMs === null && bareAimed.markers.length === 0,
      `${describe(bareAimed)} — without this red-capable control, arms A and S are greens that could not have been red.`);
  }

  // ── Arm E — the thirteen. What does the `exit`-only shape do under a delivered SIGTERM? ─
  const exitAimed = await run('exitonly', 'self');
  if (exitAimed.failedToStart) skipped.push(`arm E: ${exitAimed.failedToStart}`);
  else {
    check('E', 'the `exit`-only shape frees the port under a SIGTERM that is actually delivered',
      exitAimed.quietAfterMs !== null, describe(exitAimed));
    note('E', 'and its exit listener ran, which POSIX alone does not predict',
      `markers [${exitAimed.markers.join(', ') || 'none'}]; listeners in the subject at the ` +
      `moment the signal arrived: ${exitAimed.listenersAtSignal} (at its own startup, ` +
      `${exitAimed.sigtermListenersAtStart} SIGTERM). A signal with a listener does not ` +
      `terminate the process by default — see arm K for whether that listener is tsx's.`);
  }

  // ── Arm K — is the thirteen's safety node's, or tsx's? ────────────────────────────────
  //
  // Same fixture, same signal, same aim; the only difference is that the subject is plain
  // CommonJS run by `node` with no tsx in its own chain. If the exit listener stops running
  // there, then what saves the thirteen is a property of the launcher, not of node — and the
  // thirteen are safe only for as long as every one of them is launched through tsx.
  const exitPlainNode = await run('exitonly', 'self', 'node');
  const barePlainNode = await run('bare', 'self', 'node');
  if (exitPlainNode.failedToStart || barePlainNode.failedToStart) {
    skipped.push(`arm K: ${exitPlainNode.failedToStart ?? barePlainNode.failedToStart}`);
  } else {
    check('K', 'under plain `node`, a delivered SIGTERM does NOT run the exit listener',
      !exitPlainNode.markers.includes('exit'), describe(exitPlainNode));
    check('K', 'and so the same `exit`-only shape leaks its listener under plain `node`',
      exitPlainNode.quietAfterMs === null, describe(exitPlainNode));
    note('K', 'the listener counts the two runtimes present at the moment of the signal',
      `exit-only under tsx: ${exitAimed.listenersAtSignal} → exit listener RAN ` +
      `(${exitAimed.markerProvenance.join('; ') || 'no markers'}) · ` +
      `exit-only under plain node: ${exitPlainNode.listenersAtSignal} → exit listener did NOT run. ` +
      `(bare/plain-node control: markers [${barePlainNode.markers.join(', ') || 'none'}], port ` +
      `${barePlainNode.quietAfterMs === null ? 'still answering' : `quiet after ${barePlainNode.quietAfterMs} ms`})`);
  }

  // ── Arm G — the candidate remedy: signal the process group. ───────────────────────────
  const groupAimed = await run('reaper', 'group');
  if (groupAimed.failedToStart) skipped.push(`arm G: ${groupAimed.failedToStart}`);
  else {
    check('G', 'a group-directed SIGTERM reaches the handler-registering process',
      groupAimed.markers.includes('SIGTERM'), describe(groupAimed));
    note('G', 'the port is not evidence here',
      'under a group signal the listener is in the group and dies with it, so a quiet port ' +
      'would be true with no handler at all. The marker is the only attribution.');
  }
  const groupBare = await run('bare', 'group');
  if (groupBare.failedToStart) skipped.push(`arm G2: ${groupBare.failedToStart}`);
  else {
    note('G', 'and that caveat, driven rather than reasoned',
      `bare variant under a group signal: markers [${groupBare.markers.join(', ') || 'none'}], ` +
      `port ${groupBare.quietAfterMs === null ? 'still answering' : `quiet after ${groupBare.quietAfterMs} ms`}`);
  }

  // ── Arm R — the real subject, on the real port. Is the fixture faithful? ──────────────
  //
  // Everything above is a fixture. The claim that carries the round — that the leak is the
  // reaper's SIGKILL landing on a shim — is only worth anything if the real probe's `server`
  // handle has the same shape. So: boot `probe-round213-reassign-live-http` for real, read
  // its chain from ps, and signal the process that registered `reapOnExit`.
  if ((await somethingIsAlreadyAnswering(REAL_PORT)) !== null) {
    skipped.push(`arm R: port ${REAL_PORT} is occupied — the real subject cannot own its server`);
  } else {
    await realSubjectArm(selfAimed.failedToStart ? null : selfAimed.quietAfterMs !== null);
  }

  const finalQuiet = await portQuiet(PORT);
  check('C', `scratch port ${PORT} is quiet at the end of the run`, finalQuiet,
    'this file spawns subjects whose business is to leak; it must not leave any.');

  summariseAndExit({ probeName: PROBE, results, skipped });
}

main().catch((e) => { console.error(e); process.exit(1); });
