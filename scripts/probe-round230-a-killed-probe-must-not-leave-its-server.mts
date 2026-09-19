/**
 * Round 230 — a probe that dies without running its handlers leaves its server running.
 *
 * WHY THIS EXISTS
 *
 * `reapOnExit()` (scripts/lib/probe-server-ownership.mts) was written after Round 221 found a
 * leaked server on 3001, and landed on five probes. Twenty more spawn a `packages/server`
 * child and did not carry it. The question this answers is whether that matters — which is a
 * behavioural question, and had only ever been argued from reading the source.
 *
 * WHAT THIS DRIVES
 *
 * Not a grep. A real subject probe is spawned, waited for until its server is genuinely
 * answering on the port, sent a real signal, and then the PORT is asked whether anything is
 * still there. The subject and signal are named on the command line, so the same instrument
 * runs against a retrofitted file, an un-retrofitted one, and a deliberately-leaky fixture:
 *
 *     npx tsx scripts/probe-round230-…mts scripts/probe-round213-reassign-live-http.mts SIGTERM
 *
 * ── Measured 2026-09-18, node v26.5.0 / tsx v4.21.0 ───────────────────────────────────────
 *
 *   probe-round213-reassign-live-http (no handler of any kind)   LEAK, HTTP 200 still on 3001
 *   probe-import-multipart-cap (process.on('exit', killServer))  quiet
 *   a fixture with the same spawn and no handlers (.cjs and .mts) LEAK — the negative control
 *
 * Re-measured 2026-09-18 (STOP), after probe-round213 was retrofitted AND `reapOnExit` was
 * corrected to send SIGTERM: that first line is now **quiet**. The fixture line is unchanged
 * and still LEAKs, which is what keeps the new green red-capable. See the resolved-limitation
 * section below — the retrofit alone did not do it, and for a round we thought it had failed.
 *
 * The negative control is the load-bearing one: without a subject that provably leaks, a green
 * here is a green that could not have been red. The first two versions of this file WERE
 * exactly that, twice over — see `theProcessUnderTest` and `subjectReachedItsOwnEnding` below,
 * each of which exists because a vacuous PASS was printed before it was written.
 *
 * ── ✅ THE LIMITATION THIS FILE ONCE CARRIED, NOW RESOLVED (Round 231) ────────────────────
 *
 * `npx tsx <probe>` produces this chain, verified from `ps`:
 *
 *     npx → node .bin/tsx <probe>.mts  → node --require tsx/… (THE PROBE)  → the server chain
 *           ^ tsx's supervisor            ^ where handlers are registered
 *
 * This file used to say that only the supervisor carries the subject path, so the signal
 * lands on the wrong process, and that this was "very likely" why `reapOnExit` did not stop
 * probe-round213 leaking. **That was wrong, and Round 231 measured it wrong.** The innermost
 * process does carry the subject path; `theProcessUnderTest()` picks the handler-registering
 * process on the nose; the signal is delivered and the handlers run. Nothing to fix in the aim.
 *
 * The cause was inside `reapOnExit`, on a line that ran: it sent the child SIGKILL, the child
 * is an `npm exec tsx` shim two processes above the listener, and SIGKILL is the one signal a
 * shim cannot forward. It now sends SIGTERM. Re-driven 2026-09-18 (STOP) with that change:
 *
 *   probe-round213-reassign-live-http  quiet within 12 s, all 5 descendants gone  (was LEAK)
 *   .testdata/round230/leaky.mts       LEAK, 3 of 5 descendants alive — still red-capable
 *
 * ── The control that let the wrong cause survive a round ──────────────────────────────────
 *
 * This file recorded "the remedy is not in doubt: `server.kill('SIGTERM')` on the npx shim
 * takes the whole chain down." That measurement is correct and still reproduces — and it was
 * the wrong control, because **the code under test sent SIGKILL**. It eliminated the true
 * hypothesis by exercising a friendlier argument than the code passes.
 *
 * **Rule (Theseus, Round 231): a control for a remedy must make the call the remedy makes** —
 * not the same function with a different argument, the same argument.
 *
 * ── What this cannot establish ────────────────────────────────────────────────────────────
 *
 *   - Nothing about SIGKILL. A SIGKILLed parent cannot reap anything, by construction, and
 *     both arms leak. That is a property of the signal, not of the repair, and no arm tests it.
 *   - The port question is `somethingIsAlreadyAnswering`, not a bind test — Round 222's
 *     finding. A bind test would report "free" next to a live wildcard listener.
 *
 * ── Leak containment, since this probe's whole subject is leaking ─────────────────────────
 *
 * The subject is spawned, its descendants are enumerated from `ps` before the signal, and
 * every survivor is SIGKILLed in a `finally` whether the run passes, fails or throws. A
 * control that leaks the thing it is about is worse than no control.
 *
 * ZERO MODEL CALLS. `packages/` is not written by this file.
 */

import { spawn, execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  somethingIsAlreadyAnswering,
  requireAnUnoccupiedPort,
} from './lib/probe-server-ownership.mts';
import { summariseAndExit, type ProbeVerdict, type SkipRecord } from './lib/probe-outcome.mts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3001;
const PROBE = 'probe-round230-a-killed-probe-must-not-leave-its-server';

const SUBJECT = process.argv[2] ?? 'scripts/probe-import-multipart-cap.mts';
const SIGNAL = (process.argv[3] ?? 'SIGPIPE') as NodeJS.Signals;
/** How long after the signal we keep asking the port. A dying server answers for a while. */
const SETTLE_MS = 12_000;

const results: ProbeVerdict[] = [];
const skipped: SkipRecord[] = [];
function check(name: string, pass: boolean, detail: string) {
  results.push({ arm: 'R', check: name, pass, kind: 'regression' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [R] ${name}\n         ${detail}`);
}
/** A reading, not an assertion. Never counted toward "passed". */
function note(name: string, detail: string) {
  results.push({ arm: 'R', check: name, pass: true, kind: 'measurement' });
  console.log(`NOTE [R] ${name}\n         ${detail}`);
}

type Proc = { pid: number; ppid: number; command: string };

/** `ps` only — no pkill, no lsof, neither of which this seat may run. */
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

/** Every descendant pid of `root`, shallowest first. */
function descendants(root: number, table = processTable()): number[] {
  const kids = new Map<number, number[]>();
  for (const { pid, ppid } of table) {
    if (!kids.has(ppid)) kids.set(ppid, []);
    kids.get(ppid)!.push(pid);
  }
  const out: number[] = [];
  const walk = (p: number) => {
    for (const k of kids.get(p) ?? []) {
      out.push(k);
      walk(k);
    }
  };
  walk(root);
  return out;
}

/**
 * The pid to signal.
 *
 * `spawn('npx', ['tsx', subject])` produces a chain — npx, then a node running tsx, then (on
 * some tsx versions) a second node. Signalling `child.pid` signals the **npx shim**, which is
 * not the process that holds the server and not the process whose handlers are under test.
 *
 * Measured 2026-09-18, and this is why the first version of this control was vacuous: it
 * signalled npx with SIGPIPE, npx was unaffected, the subject ran to completion and shut down
 * cleanly through its own `exit` listener, and the control printed PASS on a signal that was
 * never delivered to anything. A green that could not have been red.
 *
 * So: pick the deepest descendant whose command line actually names the subject file.
 */
function theProcessUnderTest(root: number, subject: string): number | null {
  const table = processTable();
  const byPid = new Map(table.map((p) => [p.pid, p]));
  const named = descendants(root, table).filter((pid) => byPid.get(pid)?.command.includes(subject));
  return named.length ? named[named.length - 1] : null;
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await requireAnUnoccupiedPort(PORT, PROBE);

  console.log(`subject  ${SUBJECT}`);
  console.log(`signal   ${SIGNAL}`);
  console.log('');

  const child = spawn('npx', ['tsx', SUBJECT], {
    cwd: REPO,
    env: { ...process.env, ANTHROPIC_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let transcript = '';
  child.stdout!.on('data', (d) => { transcript += d; });
  child.stderr!.on('data', (d) => { transcript += d; });

  /**
   * Did the subject reach its own ending? `probe-outcome.mts` prints exactly one of these as
   * the last line of every migrated probe, and an un-migrated probe prints its own summary.
   *
   * This is the guard the first two versions of this control did not have, and it is why they
   * were both vacuously green: `probe-import-multipart-cap` brings its server up and then
   * FINISHES, in well under the time it takes to notice the port and signal. The subject was
   * shutting itself down cleanly through its own `exit` listener and the control was crediting
   * the reaper for it. A leak check whose subject already left is not a leak check.
   */
  const subjectReachedItsOwnEnding = () =>
    /regression check|INCONCLUSIVE|has not run|established/i.test(transcript);

  let tree: number[] = [];
  try {
    // 1 — wait until the subject's server is genuinely answering. If it never comes up there
    //     is nothing to leak and the run establishes nothing; say so rather than pass.
    const upBy = Date.now() + 120_000;
    let up = false;
    while (Date.now() < upBy) {
      if (child.exitCode !== null) break;
      if ((await somethingIsAlreadyAnswering(PORT, 1000)) !== null) {
        up = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    if (!up) {
      // Not a pass and not a failure of the repair: the run had no subject. A hard skip, so
      // this exits 3 rather than 0 — the exact distinction Round 224 built the module for.
      skipped.push(
        child.exitCode !== null
          ? `the subject exited ${child.exitCode} before anything answered on ${PORT} — there was no server to leak, so nothing about the reaper was established`
          : `nothing answered on ${PORT} within 120 s — there was no server to leak, so nothing about the reaper was established`,
      );
      console.log(`SKIP [R] ${skipped[skipped.length - 1]}`);
      return;
    }

    tree = descendants(child.pid!);
    const target = theProcessUnderTest(child.pid!, SUBJECT);

    if (target === null) {
      skipped.push(
        `no descendant of pid ${child.pid} has ${SUBJECT} on its command line, so there is no way ` +
        `to signal the process whose handlers are under test without also signalling the server`,
      );
      console.log(`SKIP [R] ${skipped[skipped.length - 1]}`);
      return;
    }

    note(
      'the subject owns a live server',
      `npx shim pid ${child.pid}; process under test pid ${target}; ${tree.length} descendant(s) ` +
      `[${tree.join(', ')}]; ${PORT} is answering`,
    );

    if (subjectReachedItsOwnEnding()) {
      skipped.push(
        `${SUBJECT} printed its own summary before the signal could be delivered — it shut itself ` +
        `down through its normal path, so nothing here is evidence about an abnormal one`,
      );
      console.log(`SKIP [R] ${skipped[skipped.length - 1]}`);
      return;
    }

    // 2 — the signal. To the process under test alone — never to `child.pid` (the npx shim,
    //     which does not hold the server) and never to the process GROUP (which would kill the
    //     server directly and mask exactly the difference under test).
    process.kill(target, SIGNAL);

    const exited = await new Promise<string>((resolve) => {
      const deadline = Date.now() + 20_000;
      const poll = setInterval(() => {
        if (!alive(target)) {
          clearInterval(poll);
          resolve(`pid ${target} gone`);
        } else if (Date.now() > deadline) {
          clearInterval(poll);
          resolve(`pid ${target} STILL RUNNING 20 s after ${SIGNAL} — it handled the signal and kept going`);
        }
      }, 200);
    });
    note('the process under test after the signal', exited);

    // 3 — THE CHECK. Ask the port, not the process table: the question is whether a later
    //     probe would find this port occupied, and that is decided at the socket.
    const deadline = Date.now() + SETTLE_MS;
    let occupant = await somethingIsAlreadyAnswering(PORT, 1000);
    while (occupant !== null && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 250));
      occupant = await somethingIsAlreadyAnswering(PORT, 1000);
    }

    // The same guard again, after the fact: if the subject raced to its ending between the
    // liveness check and the signal, the port being quiet says nothing about the reaper.
    if (subjectReachedItsOwnEnding()) {
      skipped.push(
        `${SUBJECT} reached its own ending in the window between the liveness check and the ` +
        `signal — the port is ${occupant === null ? 'quiet' : 'occupied'}, but not because of anything this control did`,
      );
      console.log(`SKIP [R] ${skipped[skipped.length - 1]}`);
      return;
    }

    check(
      `a subject killed by ${SIGNAL} leaves nothing on port ${PORT}`,
      occupant === null,
      occupant === null
        ? `${PORT} quiet within ${SETTLE_MS / 1000} s of the signal — the subject reaped its server on the way out`
        : `LEAK: ${occupant}, still there ${SETTLE_MS / 1000} s after the subject died. The next probe to run would grade this server.`,
    );

    const survivors = tree.filter(alive);
    check(
      `no descendant of the subject outlives it`,
      survivors.length === 0,
      survivors.length === 0
        ? `all ${tree.length} descendant pid(s) gone`
        : `${survivors.length} of ${tree.length} still alive: ${survivors.join(', ')}`,
    );
  } finally {
    // Containment. Everything this run started, dead, whatever happened above.
    if (child.exitCode === null) {
      try {
        process.kill(child.pid!, 'SIGKILL');
      } catch {}
    }
    const stragglers = [...new Set([...tree, ...descendants(child.pid!)])].filter(alive);
    for (const pid of stragglers) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
    if (stragglers.length) {
      await new Promise((r) => setTimeout(r, 1500));
      console.log(`\ncontainment: SIGKILLed ${stragglers.length} survivor(s) [${stragglers.join(', ')}]`);
    }
    const left = await somethingIsAlreadyAnswering(PORT, 1500);
    console.log(`containment: port ${PORT} ${left === null ? 'quiet' : `STILL OCCUPIED — ${left}`}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    results.push({ arm: 'R', check: 'the control ran to completion', pass: false, kind: 'regression' });
  })
  .then(() => summariseAndExit({ probeName: `${PROBE} [${path.basename(SUBJECT)} / ${SIGNAL}]`, results, skipped }));
