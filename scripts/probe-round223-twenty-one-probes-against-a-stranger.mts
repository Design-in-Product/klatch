/**
 * Round 223 — the 21 migrated probes, driven against a real stranger.
 *
 * ## Why
 *
 * Round 222 (Daedalus) hoisted the port-ownership guard to `scripts/lib/probe-server-ownership.mts`
 * and migrated 21 probes to it. His own §6 names the soft spot:
 *
 * > *"I drove exactly one migrated probe end to end … The other 20 are verified only by typecheck
 * > and by the uniformity of the edit. They are not re-driven."*
 *
 * A typecheck establishes that the call compiles. It does not establish that the call happens
 * before the probe grades anything — which is the entire property, and the one Round 217 lost.
 * This probe stages an occupant on 3001 and runs **all 21** against it.
 *
 * ## The stranger is built to be maximally deceptive
 *
 * It binds `::` — what `packages/server` binds, and the occupant the old bind test missed — and it
 * answers `GET /api/channels` with `200 []`, which is exactly what every HTTP-only readiness loop
 * in this repo polls for. A probe that consults only "did something answer 200?" will believe it.
 *
 * ## What is asserted, and why these two and not a pass count
 *
 * For every probe, two properties, from different places:
 *
 *  1. **it exited non-zero, of its own accord, before the timeout** — the guard fired rather than
 *     the sweep killing a hung run; and
 *  2. **it printed zero verdict lines** — nothing was graded.
 *
 * (2) is the one that matters. An exit code says a guard fired somewhere; the absence of any
 * `PASS`/`FAIL`/`MEAS`/`SKIP` line says no arm reached a conclusion about a process the probe does
 * not own. Round 217 reported `22/22` on exactly such a run.
 *
 * The verdict-line regex is an instrument, so it gets a positive control of its own: arm E runs a
 * probe on a *free* port and requires the same regex to find verdict lines in that output. Without
 * it, "0 verdict lines" is equally consistent with a regex that matches nothing anywhere — the
 * vacuity this repo has now found five faces of.
 *
 * Run: `npx tsx scripts/probe-round223-twenty-one-probes-against-a-stranger.mts`
 *      (needs ports 3001 and 5173 free; makes no model calls; touches nothing under packages/)
 */

import fs from 'fs';
import net from 'net';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execFileSync, type ChildProcess } from 'child_process';
import { portAcceptsAConnection, portAnswersHttp, waitUntilPortIsQuiet } from './lib/probe-server-ownership.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');
const PORT = 3001;
const MODULE_BASENAME = 'probe-server-ownership';

// ── Verdict bookkeeping ──────────────────────────────────────────────────────

type Result = { arm: string; check: string; pass: boolean; detail: string; kind: 'check' | 'measurement' | 'open' };
const results: Result[] = [];
function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, detail, kind: 'check' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, detail, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}
/**
 * A finding in the subject, not a failure of this probe. House convention (probe-round217/219):
 * `OPEN` is a real red that is somebody's call to close, counted apart from regressions so that a
 * known-open defect does not make every future run of this file look broken.
 */
function open(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: false, detail, kind: 'open' });
  console.log(`OPEN [${arm}] ${name} — ${detail}`);
}

/**
 * The instrument. Every probe in this repo prints verdicts as `TAG [arm] name — detail`.
 * Controlled live in arm E — a run on a free port must produce matches here.
 */
const VERDICT_LINE = /^(PASS|FAIL|MEAS|SKIP|OPEN|TODO)\s*\[/;
/**
 * A `SKIP` is the one tag that asserts nothing, so it is not a conclusion about the subject and a
 * probe printing one after meeting a stranger has not misreported anything. Separating the two
 * matters: the first version of this check counted `SKIP` as a verdict and reddened two probes for
 * the honest half of what they do, which would have pointed the finding at the wrong line.
 */
const CONCLUSION_LINE = /^(PASS|FAIL|OPEN)\s*\[/;
function verdictLines(output: string): string[] {
  return output.split('\n').filter((l) => VERDICT_LINE.test(l.trim()));
}

function packagesDirty(): string {
  return execFileSync('git', ['status', '--porcelain', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const packagesBefore = packagesDirty();

// ── Arm A — the inventory, counted without grep ──────────────────────────────

type Category = 'refuses' | 'skips' | 'no-preflight';
type Probe = { file: string; category: Category; ports: number[] };

function classify(file: string): Probe | null {
  const src = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
  if (!src.includes(MODULE_BASENAME)) return null;
  const live = src
    .split('\n')
    .filter((l) => !/^\s*(\*|\/\/)/.test(l))
    .join('\n');
  const ports = [...src.matchAll(/^\s*const\s+\w*PORT\w*\s*=\s*(\d+)\s*;/gm)].map((m) => Number(m[1]));
  const category: Category = /await\s+requireAnUnoccupiedPort\(/.test(live)
    ? 'refuses'
    : /await\s+somethingIsAlreadyAnswering\(/.test(live)
      ? 'skips'
      : 'no-preflight';
  return { file, category, ports: [...new Set(ports)] };
}

// readdirSync, not grep: grep in this repo has been observed dropping a file from glob results
// three times in one session (Daedalus, Round 222 §1), and a probe missing from this list is
// exactly the probe this round exists to cover.
//
// SELF is excluded, and the first run of this file is why the exclusion is written down rather
// than assumed. This probe imports the shared module too, so it classified itself as a 22nd
// migrated probe (category: no pre-flight) and put itself in the list to drive — which it then
// did, recursively, against its own stranger. Its own arm-B refusal printed a FAIL line, so the
// sweep's "graded nothing" check for that entry was correct to go red. An instrument that counts
// itself is not a small tidiness problem: it inflates the population being verified by one, and
// the extra member is the one member that cannot be a finding.
const SELF = path.basename(fileURLToPath(import.meta.url));
// The round controls — this file and Round 222's — are instruments, not subjects. Excluded by name
// before classification rather than filtered out of the results afterwards.
const CONTROLS = new Set([SELF, 'probe-round222-port-ownership-hoist.mts', 'probe-round223b-db-existence-is-not-identity.mts']);
const allMts = fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts')).sort();
const importers = allMts.map(classify).filter((p): p is Probe => p !== null);
const migrated = importers.filter((p) => !CONTROLS.has(p.file));

// Two sides from different places for the file walk itself, and neither is a glob: `readdirSync`
// against `git ls-files` plus untracked. A hardcoded total would have to be edited every round,
// which is how a check becomes a thing people update to match rather than a thing that tells them
// something — and grep has already been caught dropping a file from this very directory.
const gitKnown = new Set(
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'scripts/'], { cwd: REPO, encoding: 'utf8' })
    .split('\n')
    // `scripts/` only, not `scripts/lib/` — the walk is one directory deep, so the comparison has
    // to be too. The shared module itself lives in `lib/` and is not a probe.
    .filter((l) => l.endsWith('.mts') && l.split('/').length === 2)
    .map((l) => path.basename(l)));
const walkOnly = allMts.filter((f) => !gitKnown.has(f));
const gitOnly = [...gitKnown].filter((f) => !allMts.includes(f));
check('A', 'the readdirSync walk and git agree on which .mts files exist',
  walkOnly.length === 0 && gitOnly.length === 0,
  `${allMts.length} walked · ${gitKnown.size} known to git · walk-only [${walkOnly}] · git-only [${gitOnly}]`);
check('A', 'the sweep is not in its own population',
  !migrated.some((p) => CONTROLS.has(p.file)), `${CONTROLS.size} controls excluded: ${[...CONTROLS].map((f) => f.replace(/^probe-|\.mts$/g, '')).join(', ')}`);

const DAEDALUS_ROUND_222_COUNT = 21;
const R223_FOLDED_IN = ['probe-round217-multipart-guard-live-http.mts', 'probe-round219-files-cap-live-http.mts'];
check('A', 'the population is every importer on disk, not a number carried from a memo',
  migrated.length === DAEDALUS_ROUND_222_COUNT + R223_FOLDED_IN.length,
  `${migrated.length} subjects = Daedalus's ${DAEDALUS_ROUND_222_COUNT} (reproduced) + ${R223_FOLDED_IN.length} folded in this round ` +
  `· ${importers.length} importers on disk including ${CONTROLS.size} controls`);
check('A', 'the two this round folded in are in the population being driven',
  R223_FOLDED_IN.every((f) => migrated.some((p) => p.file === f)),
  R223_FOLDED_IN.map((f) => `${f.replace(/^probe-|\.mts$/g, '')}: ${migrated.find((p) => p.file === f)?.category ?? 'ABSENT'}`).join(' · '));
check('A', 'no probe still defines its own portIsFree',
  allMts.every((f) => !/\b(function|const)\s+portIsFree\b/.test(fs.readFileSync(path.join(SCRIPTS, f), 'utf8'))),
  'the hoist left no local copies behind');

const byCategory = {
  refuses: migrated.filter((p) => p.category === 'refuses'),
  skips: migrated.filter((p) => p.category === 'skips'),
  'no-preflight': migrated.filter((p) => p.category === 'no-preflight'),
};
measure('A', 'the migrated set is not uniform — three shapes, read out of the sources',
  `refuses (requireAnUnoccupiedPort): ${byCategory.refuses.length} · ` +
  `skips (somethingIsAlreadyAnswering as a condition): ${byCategory.skips.length} · ` +
  `no pre-flight at all (waitUntilPortIsQuiet only): ${byCategory['no-preflight'].length}`);
measure('A', 'probes with no pre-flight, which the migration did not give one',
  byCategory['no-preflight'].map((p) => p.file.replace(/^probe-|\.mts$/g, '')).join(', ') || '(none)');
check('A', 'the three categories partition the population with none left over',
  byCategory.refuses.length + byCategory.skips.length + byCategory['no-preflight'].length === migrated.length,
  `${byCategory.refuses.length} + ${byCategory.skips.length} + ${byCategory['no-preflight'].length} = ${migrated.length}`);

// ── The stranger ─────────────────────────────────────────────────────────────

let stranger: http.Server | undefined;
let strangerHits = 0;
const strangerPaths: string[] = [];
/** Set while a probe is being driven, so the stranger's own request log can be attributed. */
let contactLog: { at: number; what: string }[] | null = null;

async function startStranger(): Promise<string> {
  stranger = http.createServer((req, res) => {
    strangerHits += 1;
    if (strangerPaths.length < 200) strangerPaths.push(`${req.method} ${req.url}`);
    contactLog?.push({ at: Date.now(), what: `${req.method} ${req.url}` });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('[]');
  });
  await new Promise<void>((resolve, reject) => {
    stranger!.once('error', reject);
    stranger!.listen(PORT, () => resolve()); // no host: the wildcard, which node resolves to `::`
  });
  const addr = stranger!.address();
  return typeof addr === 'string' ? addr : `${addr?.address} (family ${addr?.family})`;
}

const children = new Set<ChildProcess>();
function reapEverything() {
  for (const c of children) {
    if (c.exitCode === null && c.pid) {
      try { process.kill(-c.pid, 'SIGKILL'); } catch { try { c.kill('SIGKILL'); } catch { /* gone */ } }
    }
  }
  try { stranger?.close(); } catch { /* not started */ }
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
  process.on(sig, () => { reapEverything(); process.exit(130); });
}
process.on('exit', reapEverything);

// ── Arm B — the stranger is genuinely deceptive ──────────────────────────────

const preExisting = await portAcceptsAConnection(PORT, 1000);
check('B', 'port 3001 was clear before this probe staged anything',
  preExisting === false, `a connect to 3001 before staging: ${preExisting ? 'ACCEPTED (abort)' : 'refused'}`);
if (preExisting) {
  console.error('probe-round223: something already holds 3001 — this probe must own the stranger it stages. Stop it and re-run.');
  process.exit(2);
}

const strangerAddr = await startStranger();
measure('B', 'the stranger is listening', `bound ${strangerAddr} on ${PORT}`);
check('B', 'the stranger binds `::`, the address a real Klatch server binds',
  strangerAddr.startsWith('::'), `address=${strangerAddr} — the occupant the old bind test missed`);
check('B', 'a TCP connect reaches it', await portAcceptsAConnection(PORT, 1500), 'connect to 127.0.0.1:3001 accepted');
const strangerHttp = await portAnswersHttp(PORT, 2000);
check('B', 'it answers GET /api/channels with a 200 — what every readiness loop polls for',
  strangerHttp === 'HTTP 200', `portAnswersHttp -> ${strangerHttp}`);
const bindWouldWork = await new Promise<boolean>((resolve) => {
  const s = net.createServer();
  s.once('error', () => resolve(false));
  s.once('listening', () => s.close(() => resolve(true)));
  s.listen(PORT, '127.0.0.1');
});
check('B', 'the RETIRED bind test reads this occupied port as free — the defect, staged live',
  bindWouldWork === true, `net.createServer().listen(3001,'127.0.0.1') -> ${bindWouldWork ? 'BOUND (would have said "free")' : 'refused'}`);

// ── Driving one probe ────────────────────────────────────────────────────────

type Line = { at: number; text: string };
type Run = {
  file: string; code: number | null; signal: string | null; ms: number;
  out: string; lines: Line[]; timedOut: boolean; contacts: { at: number; what: string }[];
};

function runProbe(file: string, timeoutMs: number): Promise<Run> {
  return new Promise((resolve) => {
    const started = Date.now();
    const contacts: { at: number; what: string }[] = [];
    contactLog = contacts;
    // No ANTHROPIC_API_KEY: if a guard fails to fire and a probe reaches a model call anyway,
    // it fails loudly instead of spending. Nothing here is supposed to get that far.
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    const child = spawn('npx', ['tsx', path.join('scripts', file)], {
      cwd: REPO, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    let out = '';
    const lines: Line[] = [];
    let pending = '';
    const absorb = (d: Buffer) => {
      const at = Date.now();
      out += d;
      pending += d.toString();
      const parts = pending.split('\n');
      pending = parts.pop() ?? '';
      for (const text of parts) lines.push({ at, text });
    };
    child.stdout.on('data', absorb);
    child.stderr.on('data', absorb);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); } }
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      children.delete(child);
      contactLog = null;
      if (pending) lines.push({ at: Date.now(), text: pending });
      resolve({ file, code, signal, ms: Date.now() - started, out, lines, timedOut, contacts });
    });
  });
}

// ── Arm C — all 21, against the stranger ─────────────────────────────────────

/**
 * "graded nothing at all" was the first version of this check, and the first run showed it is the
 * wrong property. `probe-browse-cold-figure-gap` — no pre-flight — printed
 *
 *     PASS [A] shipped root present — /Users/xian/.claude/projects — 537 files, 637 MB
 *
 * before it ever went near the port, then died at readiness. That PASS is honest: it is a
 * filesystem fact, established with no server involved. Requiring zero verdict lines would have
 * scored an honest arm as a defect and buried the distinction that matters.
 *
 * The property that actually matters is temporal, and the two sides come from different places:
 * the **probe's stdout**, timestamped as it arrives here, and the **stranger's own request log**.
 * Once a probe has touched the port, every later verdict is suspect, because from that moment the
 * only server in the picture is one it does not own.
 */
function verdictsAfterFirstContact(run: Run): Line[] {
  const first = run.contacts[0]?.at;
  if (first === undefined) return [];
  return run.lines.filter((l) => l.at >= first && CONCLUSION_LINE.test(l.text.trim()));
}
function skipsAfterFirstContact(run: Run): number {
  const first = run.contacts[0]?.at;
  if (first === undefined) return 0;
  return run.lines.filter((l) => l.at >= first && /^SKIP\s*\[/.test(l.text.trim())).length;
}

const TIMEOUT = { refuses: 45_000, skips: 45_000, 'no-preflight': 150_000 } as const;
const runs: Run[] = [];
console.log(`\n--- driving ${migrated.length} probes against the stranger ---\n`);

for (const p of migrated) {
  const run = await runProbe(p.file, TIMEOUT[p.category]);
  runs.push(run);
  const short = p.file.replace(/^probe-|\.mts$/g, '');
  const all = verdictLines(run.out);
  const after = verdictsAfterFirstContact(run);
  const before = all.length - after.length;

  // Whether a probe reached its guard at all is read from the STRANGER'S request log, not from the
  // probe's output — the guard's HTTP "describe" step is a request only a probe that got that far
  // can have made. Three probes in the first run of this file exited in ~370 ms without ever
  // touching the port (a missing fixture, unrelated to any of this), and grading their guards off
  // that run would have been a verdict about something that never executed. First-run mistake of
  // mine, corrected here: I had required exit 2 unconditionally and reported `path-c-chat-binding-
  // live` as a failed guard when its guard had not run.
  //
  // This branch comes FIRST, and that ordering is the second correction. With the conclusion check
  // above it, a probe with zero contact collected a cheerful `PASS … reached no CONCLUSION after it
  // touched the port` — true of a probe that never touched the port, and therefore true of a run
  // that establishes nothing. A check placed after a `continue` and a check placed before it are
  // not the same check.
  if (run.contacts.length === 0) {
    open('C', `${short}: NOT ESTABLISHED — exited before it reached the port`,
      `exit ${run.code} after ${run.ms} ms with ${all.length} verdict line(s) and zero contact with the stranger. ` +
      `Its guard is undriven by this round; nothing here is evidence either way.`);
    continue;
  }

  check('C', `${short}: reached its guard`, true,
    `first contact at +${run.contacts[0].at - (run.lines[0]?.at ?? run.contacts[0].at)} ms relative to first output — ${run.contacts[0].what}`);

  // A conclusion after contact is graded differently by category, because the two designs promise
  // different things. A `refuses` probe promises to stop before it concludes anything — so any
  // conclusion at all is a hard failure of a stated property. A `skips` probe promises only to skip
  // the arms that need the port, and its later arms may be about source bytes, so from outside this
  // sweep cannot tell a suspect conclusion from an honest one. Reporting it as FAIL would assert
  // exactly what has not been established. It is reported as OPEN, with the line, for a human.
  const cleanAfterContact = after.length === 0;
  const detailAfter = cleanAfterContact
    ? `${run.contacts.length} request(s) to the stranger · ${before} verdict line(s) before the first one · ` +
      `${skipsAfterFirstContact(run)} SKIP after it, which assert nothing`
    : `${after.length} PASS/FAIL/OPEN line(s) AFTER contact — first: ${JSON.stringify(after[0]?.text.trim().slice(0, 120))}`;
  if (cleanAfterContact || p.category === 'refuses') {
    check('C', `${short}: reached no CONCLUSION after it touched the port`, cleanAfterContact, detailAfter);
  } else {
    open('C', `${short}: printed conclusions after it knew it could not own the port`,
      `${detailAfter} — these may well be port-independent (source or filesystem facts). From outside they ` +
      `are not distinguishable from conclusions about the stranger, which is the whole problem with printing them there.`);
  }

  // The universal property. Exit 0 on a port the probe could not own is the Round 217 failure with
  // a different mechanism: 217 graded a stranger and said 22/22; these grade nothing and say so in
  // prose, then report success in the two channels a machine or a skimming operator reads.
  const stoppedProperly = run.timedOut === false && run.code !== 0 && run.code !== null;
  if (stoppedProperly) {
    check('C', `${short}: stopped on its own, non-zero`, true,
      `exit ${run.code}${run.signal ? ` (signal ${run.signal})` : ''} after ${run.ms} ms`);
  } else if (run.timedOut) {
    check('C', `${short}: stopped on its own, non-zero`, false,
      `HUNG — killed at ${TIMEOUT[p.category] / 1000}s (a probe that hangs on an occupied port has not refused)`);
  } else {
    open('C', `${short}: FINDING — exit 0 on a port it could not own`,
      `exit ${run.code} after ${run.ms} ms · it printed its own diagnosis in prose and then exited success. ` +
      `${all.length - before} arm(s) skipped after contact; a wrapper reading $? sees a passing run.`);
  }

  if (p.category === 'refuses') {
    check('C', `${short}: exit 2 — "did not run", distinguishable from "ran and failed"`,
      run.code === 2, `exit ${run.code} · ${run.ms} ms`);
  }
  measure('C', `${short}: verdict lines on the run (category: ${p.category})`,
    `${all.length} total, ${before} before first contact, ${all.length - before} after` +
    (before > 0 ? ` · last pre-contact: ${JSON.stringify(all[before - 1]?.slice(0, 80))}` : ''));
}

measure('C', 'requests the stranger served across all runs',
  `${strangerHits} — ${[...new Set(strangerPaths)].slice(0, 6).join(', ') || '(none)'}`);
check('C', 'no probe with a pre-flight refusal reached a conclusion after meeting the stranger',
  runs.filter((r) => migrated.find((p) => p.file === r.file)?.category === 'refuses')
    .every((r) => verdictsAfterFirstContact(r).length === 0),
  `${runs.filter((r) => verdictsAfterFirstContact(r).length === 0).length}/${runs.length} of the whole set clean · ` +
  `${runs.reduce((n, r) => n + skipsAfterFirstContact(r), 0)} post-contact SKIP lines across the set, none of which assert anything`);
check('C', 'no run hung',
  runs.every((r) => !r.timedOut),
  `${runs.filter((r) => r.timedOut).length} timed out`);

// The label on this one used to read "all pre-contact and all port-independent" — a MEAS asserting
// two things it had not established, one of which (`browse-endpoint-vs-channel-count`, 3 conclusions
// after contact) was false in the same run. Round 217's rule, broken in the file that enforces it:
// a measurement may print what it read, not what that implies. It now prints the split per probe.
const withVerdicts = runs.filter((r) => verdictLines(r.out).length > 0);
measure('C', 'probes that printed verdict lines on a run they could not complete',
  withVerdicts.length === 0
    ? 'none'
    : withVerdicts.map((r) => {
        const total = verdictLines(r.out).length;
        const post = verdictsAfterFirstContact(r).length;
        return `${r.file.replace(/^probe-|\.mts$/g, '')} (${total}, ${post} after contact)`;
      }).join(', ') +
      ' — an operator reading a truncated log sees PASS lines on a run that never ran');

const slowest = [...runs].sort((a, b) => b.ms - a.ms)[0];
measure('C', 'slowest refusal', `${slowest.file.replace(/^probe-|\.mts$/g, '')} took ${slowest.ms} ms`);
const refusers = runs.filter((r) => migrated.find((p) => p.file === r.file)?.category === 'refuses');
measure('C', 'how fast the pre-flight family refuses',
  `${Math.min(...refusers.map((r) => r.ms))}–${Math.max(...refusers.map((r) => r.ms))} ms across ${refusers.length} probes`);

// ── Arm D — what the stranger was never given ────────────────────────────────

check('D', 'no run reached a model call',
  !runs.some((r) => /anthropic|ANTHROPIC_API_KEY/i.test(r.out)),
  runs.some((r) => /anthropic/i.test(r.out)) ? 'a run mentioned the SDK' : 'no output mentions the SDK; the key was stripped from every child env');
check('D', 'packages/ is byte-identical to where this probe found it',
  packagesDirty() === packagesBefore,
  packagesDirty() === packagesBefore ? 'git status --porcelain -- packages/ unchanged' : `CHANGED: ${packagesDirty().slice(0, 200)}`);

// ── Arm E — the positive control on the instrument ───────────────────────────
//
// "0 verdict lines" is worth nothing if VERDICT_LINE matches nothing. Free the port and run a
// probe that is known to produce verdicts; the same function must find them.

stranger?.close();
stranger = undefined;
await waitUntilPortIsQuiet(PORT, 15_000);
check('E', 'the stranger is gone and the port is quiet', true, 'waitUntilPortIsQuiet returned');

const CONTROL_PROBE = 'probe-round213-reassign-live-http.mts';
const controlRun = await runProbe(CONTROL_PROBE, 180_000);
const controlVerdicts = verdictLines(controlRun.out);
check('E', 'the same regex finds verdict lines when a probe actually runs',
  controlVerdicts.length > 0,
  `${CONTROL_PROBE.replace(/^probe-|\.mts$/g, '')} on a free port: ${controlVerdicts.length} verdict lines, exit ${controlRun.code} after ${controlRun.ms} ms`);
check('E', 'and that same probe printed zero of them against the stranger',
  verdictLines(runs.find((r) => r.file === CONTROL_PROBE)?.out ?? '').length === 0,
  'same probe, same instrument, two conditions — the difference is the guard');
measure('E', 'control probe verdict sample', JSON.stringify(controlVerdicts[0]?.slice(0, 110) ?? '(none)'));
const controlPasses = controlVerdicts.filter((l) => l.trim().startsWith('PASS')).length;
const controlFails = controlVerdicts.filter((l) => l.trim().startsWith('FAIL')).length;
measure('E', 'control probe outcome on a free port', `${controlPasses} PASS · ${controlFails} FAIL · exit ${controlRun.code}`);

// ── Hygiene ──────────────────────────────────────────────────────────────────

const stillThere = await portAcceptsAConnection(PORT, 1000);
check('Z', 'nothing is left holding 3001 at exit',
  stillThere === false, `connect to 3001 after the sweep: ${stillThere ? 'ACCEPTED — this probe leaked' : 'refused'}`);
check('Z', 'packages/ still unchanged at exit', packagesDirty() === packagesBefore, 'checked twice, before and after');

// ── Summary ──────────────────────────────────────────────────────────────────

const checks = results.filter((r) => r.kind === 'check');
const failed = checks.filter((r) => !r.pass);
const meas = results.filter((r) => r.kind === 'measurement');
const opens = results.filter((r) => r.kind === 'open');
console.log(`\nRound 223 — ${checks.length - failed.length}/${checks.length} checks · ${meas.length} measurements · ${opens.length} open · ${failed.length} failed`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
if (opens.length) {
  console.log('\nOPEN — findings in the subject, not failures of this probe:');
  for (const o of opens) console.log(`  [${o.arm}] ${o.check}\n      ${o.detail}`);
}
reapEverything();
process.exit(failed.length ? 1 : 0);
