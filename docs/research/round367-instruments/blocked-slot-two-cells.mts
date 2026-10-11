/**
 * Round 367 — `probe-round225`'s blocked slot, characterised as **two deterministic cells**
 * rather than as a rate.
 *
 * Theseus's Round 366 §3 is the specification, taken verbatim: the blocked slot is not a random
 * variable, so a rate is the wrong instrument. It is fully determined by one piece of machine
 * state — whether anything holds `:3001` at the moment arm B drives `probe-round223b`, which
 * stages its own occupant there and refuses at its own door (exit 2) if the port is taken.
 * Five drives on a free port return five greens and a rate of 0, and that 0 would be written
 * down as "not intermittent" while the real predicate sat untouched.
 *
 * So: two cells, both asserted, neither able to pass vacuously.
 *
 *   cell 1 — nothing holds :3001  →  round225 exits 0, `PASS [B] … runs green`, no `SKIP [B]`
 *   cell 2 — a staged occupant    →  round225 exits 3, `SKIP [B]`, the operator line present
 *
 * Cell 2 is the control that makes cell 1 mean anything (Round 365 §2, one file over): without
 * it, cell 1 is a green that cannot tell "arm B ran" from "arm B could not have failed".
 *
 * ── Order, and why it is cell 2 first ──────────────────────────────────────────────────────
 * Cell 2 holds a listener on :3001 for the length of one round225 drive whose arm B refuses
 * immediately; cell 1 drives round223b for real and spawns a `packages/server` child. The
 * hazardous cell is therefore the short one, and it runs first so the window in which a
 * stranger could inherit this process's occupant is as small as this can make it. The stub is
 * reaped on every exit path (`reapOnExit` shape, plus `closeBounded`), and the port is asserted
 * quiet again before cell 1 begins.
 *
 * ── Refusal, not failure ───────────────────────────────────────────────────────────────────
 * Both cells require a free port as their starting state: cell 1 because that IS its predicate,
 * cell 2 because an occupant it did not stage makes its green vacuous. If :3001 is held when
 * this runs, it exits **2** — refused at the door, nothing graded — in the vocabulary of
 * `scripts/lib/probe-outcome.mts`. A FAIL there would be a claim about round225 that this run
 * is in no position to make.
 *
 * Run from the repo root: `npx tsx docs/research/round367-instruments/blocked-slot-two-cells.mts`
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  somethingIsAlreadyAnswering,
  aWildcardBindWouldSucceed,
  trackedNetServer,
  waitUntilPortIsQuiet,
} from '../../../scripts/lib/probe-server-ownership.mts';

const REPO = process.cwd();
const PORT = 3001;
const R225 = path.join(REPO, 'scripts/probe-round225-a-citation-is-not-a-call.mts');

/** Every assertion this run makes, so the verdict line is derived and not narrated. */
const rows: { cell: string; what: string; ok: boolean; detail: string }[] = [];
function check(cell: string, what: string, ok: boolean, detail: string): void {
  rows.push({ cell, what, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${cell}] ${what}\n        ${detail}`);
}
function measure(cell: string, what: string, detail: string): void {
  console.log(`MEAS [${cell}] ${what}\n        ${detail}`);
}

/** Both sides of the port reading, from different places (Round 273), reported together. */
async function readPort(): Promise<{ occupant: string | null; wildcardFree: boolean; line: string }> {
  const occupant = await somethingIsAlreadyAnswering(PORT);
  const wildcardFree = await aWildcardBindWouldSucceed(PORT);
  return {
    occupant,
    wildcardFree,
    line: `somethingIsAlreadyAnswering(${PORT}) = ${occupant === null ? 'null (free)' : `"${occupant}"`} · ` +
      `aWildcardBindWouldSucceed(${PORT}) = ${wildcardFree}`,
  };
}

/** One drive of round225. Never throws: the exit code is the measurement. */
function driveRound225(): { exit: number; out: string; ms: number } {
  const t0 = Date.now();
  try {
    const out = execFileSync('npx', ['tsx', R225],
      { cwd: REPO, encoding: 'utf8', timeout: 600_000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { exit: 0, out, ms: Date.now() - t0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return {
      exit: err.status ?? -1,
      out: (err.stdout ?? '') + (err.stderr ?? ''),
      ms: Date.now() - t0,
    };
  }
}

/** The lines of round225's own output this instrument decides on, named once. */
const SKIP_B = /^SKIP \[B\] the drive of probe-round223b — COULD NOT RUN, not failed/m;
const OPERATOR_LINE = /operator action: free port 3001/;
const ARM_B_GREEN = /^PASS \[B\] the repaired round223b runs green against the tree it now describes/m;
const SUMMARY_PASSED = /^All (\d+) regression checks passed/m;

// ── Pre-flight ──────────────────────────────────────────────────────────────────────────────

const before = await readPort();
measure('0', 'the port, before anything this run does', before.line);
if (before.occupant !== null) {
  console.error(
    `blocked-slot-two-cells: ${before.occupant} — both cells need a port this run controls, and ` +
    `cell 2's green is vacuous against an occupant it did not stage. Nothing was graded. Free ` +
    `:3001 (usually a live \`npm run dev\`) and re-run.`);
  process.exit(2);
}

// ── Cell 2 — a staged occupant on :3001 ─────────────────────────────────────────────────────
//
// Staged with the fleet's own primitive rather than a bare `net.createServer()`: the default
// `onConnection` destroys the socket, and `closeBounded` destroys the accepted set before
// closing, so this cannot leave a socket with no owner and no reaper — which the module's own
// comment identifies as "the shape of the old, deliberately broken bind guard this module exists
// to replace".

console.log('\n── cell 2 — a staged occupant on :3001 ──────────────────────────────');

const { server: stub, closeBounded } = trackedNetServer();
let stubOpen = false;
const reapStub = () => { if (stubOpen) { try { stub.close(); } catch { /* already */ } } };
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
  process.on(sig, () => { reapStub(); process.exit(130); });
}
process.on('exit', reapStub);

await new Promise<void>((resolve, reject) => {
  stub.once('error', reject);
  stub.listen(PORT, () => resolve()); // wildcard — `::`, the address packages/server binds
});
stubOpen = true;

const staged = await readPort();
check('2', 'the occupant this cell stages is visible to the guard round223b uses',
  staged.occupant !== null,
  `${staged.line} — round223b refuses on portAcceptsAConnection, so a stub invisible here would ` +
  `make this cell green for the wrong reason`);

const c2 = driveRound225();
measure('2', 'round225, driven against the staged occupant', `exit ${c2.exit} after ${c2.ms} ms`);
check('2', 'round225 exits 3 — ran, and established less than it set out to',
  c2.exit === 3, `exit ${c2.exit} (2 would claim nothing ran; 1 would claim something broke)`);
check('2', 'and it says so as a hard skip of arm B, not as a FAIL',
  SKIP_B.test(c2.out) && !ARM_B_GREEN.test(c2.out),
  `SKIP [B] present: ${SKIP_B.test(c2.out)}; arm B's green line present: ${ARM_B_GREEN.test(c2.out)}`);
check('2', "and the child's refusal reached the operator line rather than being spent as a boolean",
  OPERATOR_LINE.test(c2.out), (c2.out.match(/^\s+operator action:.*$/m) ?? ['(absent)'])[0].trim());
measure('2', 'the skip text round225 carries into summariseAndExit',
  (c2.out.match(/^SKIP \[B\][^\n]*/m) ?? ['(none)'])[0].trim());
measure('2', 'the six-way address report round225 prints while the child is refusing',
  (c2.out.match(/why "is it free\?" is the wrong question: ([^\n]*)/) ?? [, '(absent)'])[1]);

const closed = await closeBounded();
stubOpen = false;
measure('2', 'the staged occupant, closed', `closeBounded() -> ${closed}`);
check('2', 'and the port is this run\'s to hand back — quiet, not merely bindable',
  await (async () => {
    try { await waitUntilPortIsQuiet(PORT, 15_000); return true; } catch { return false; }
  })(),
  (await readPort()).line);

// ── Cell 1 — nothing holds :3001 ────────────────────────────────────────────────────────────

console.log('\n── cell 1 — nothing holds :3001 (drives round223b for real; slow) ───');

const beforeC1 = await readPort();
measure('1', 'the port, at the top of this cell', beforeC1.line);
if (beforeC1.occupant !== null) {
  console.error(
    `blocked-slot-two-cells: cell 2 graded and passed, but :3001 was taken again before cell 1 ` +
    `could start — ${beforeC1.occupant}. Cell 1 IS the free-port predicate, so this is a refusal ` +
    `and not a FAIL. Re-run cell 1 on a free port.`);
  process.exit(2);
}

const c1 = driveRound225();
measure('1', 'round225, driven on a free port', `exit ${c1.exit} after ${c1.ms} ms`);
check('1', 'round225 exits 0 on the same tree that gave exit 3 one cell ago',
  c1.exit === 0, `exit ${c1.exit}`);
check('1', 'arm B ran — it is a graded PASS, not an absent SKIP',
  ARM_B_GREEN.test(c1.out) && !SKIP_B.test(c1.out),
  `arm B's green line present: ${ARM_B_GREEN.test(c1.out)}; SKIP [B] present: ${SKIP_B.test(c1.out)}`);
check('1', 'and the run concluded with a summary line, not merely exit 0',
  SUMMARY_PASSED.test(c1.out),
  (c1.out.match(SUMMARY_PASSED) ?? ['(absent — exit 0 without a summary line is not a reading)'])[0]);
// round225's own `check`/`measure` print one line — `PASS [B] name — detail` — not two. Written
// from the printer at `probe-round225:136-148`, not from the shape this file's own printer uses.
measure('1', "round223b's own summary, as round225 captured it",
  (c1.out.match(/^MEAS \[B\] round223b summary line after the repair — ([^\n]*)/m) ?? [, '(absent)'])[1]);

// ── The conditional ─────────────────────────────────────────────────────────────────────────

const c1Exit = c1.exit;
const c2Exit = c2.exit;
check('X', 'the two cells disagree — which is the whole finding',
  c1Exit !== c2Exit,
  `same tree, same probe, same fire: free port -> exit ${c1Exit}; staged occupant -> exit ${c2Exit}. ` +
  `A rate over either cell alone is a number about the machine, labelled as a number about the probe.`);

// ── Verdict ─────────────────────────────────────────────────────────────────────────────────
//
// Derived from `rows`, and the exit code is gated on `=== true` rather than on truthiness: a
// missing key scores as `undefined`, and `undefined` is not a pass.

const failures = rows.filter((r) => r.ok !== true);
console.log(`\n${failures.length === 0
  ? `All ${rows.length} assertions passed — the blocked slot is CONDITIONAL on :3001, not intermittent.`
  : `${failures.length} of ${rows.length} assertions FAILED — ${failures.map((f) => `[${f.cell}] ${f.what}`).join(' · ')}`}`);
process.exit(failures.length === 0 ? 0 : 1);
