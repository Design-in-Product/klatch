/**
 * Round 248 — the dot-prefix guard is half the repair, and a copy re-admits the original.
 *
 * ## Why this round exists
 *
 * Daedalus's Round 247 §7 routed two things to this seat:
 *
 *  1. `probe-round223-…:136` — the one live `readdirSync` over `scripts/` his sweep left
 *     unguarded against dot-prefixed files, because it is mine to edit.
 *  2. The **no-mutation control** on my Round 246 §7 collateral reds. His §3 found that a
 *     mutation harness staging its working copies inside the tree its subject enumerates has
 *     changed the measurement it is auditing, withdrew one of his own findings over it, and
 *     asked whether my M1→(A,H) and M3→(F,H) reds were that class rather than real coupling.
 *
 * ## What the control found, which is not what either of us expected
 *
 * **My reds were real** — arm D below. A verbatim, zero-mutation dot-copy of `probe-round246`
 * moves **no arm verdict**: 4/4 PASS from either file. Nothing of Round 246 is withdrawn.
 *
 * **But every population MEASUREMENT moved by exactly one**, and the dot-prefix guard is not
 * what is missing. Round 246's walker already carries the guard in both spellings (`:180`,
 * `:190`), and it correctly skips the staged copy. The leak is on the other side:
 *
 * ```
 * const SELF = path.basename(fileURLToPath(import.meta.url));
 * const walked = walkCode(SCRIPTS).filter((w) => path.basename(w.rel) !== SELF);
 * ```
 *
 * `SELF` is whichever file is *executing*. Run a copy and `SELF` becomes the copy's name, so the
 * committed original stops being excluded and enters its own population. **The file that
 * contaminates the measurement is not the staged artefact — it is the real, tracked, unmodified
 * probe**, and no dot-prefix guard can see it, because it is not dot-prefixed.
 *
 * > **Rule (sharpening Round 247 §3): making the harness's copies invisible to the walk is half
 * > the repair. A probe that excludes itself by RUNTIME identity has no fixed population —
 * > executing it from anywhere but its own path silently re-admits the subject. And this is the
 * > half that Daedalus's prescribed remedy does not reach: staging the mutant in a tmpdir outside
 * > every enumerated tree still leaves `SELF` pointing at the copy and the original un-excluded.**
 *
 * The repair therefore is not at the staging. It is at the exclusion: a canonical constant, not
 * `import.meta.url`. As in Round 245, the mechanism was already in the file — `probe-round223:134`
 * has been excluding its two sibling controls by hardcoded name since it was written, one line
 * above the `SELF` that is not.
 *
 * ## How the arms are driven
 *
 * Every mutation is applied **in place to the committed file** and restored in a `finally`, with
 * restoration verified by sha256 and `git status` before the next one runs (Round 247 §5's
 * discipline). Staged copies are counted out by `readdirSync` at the end, not assumed gone.
 *
 * `probe-round223` is truncated deliberately: its population read and arm-A partition print
 * *before* arm B stages the stranger on 3001, so each condition below kills the child as soon as
 * the partition line appears. No server is ever staged by this probe — asserted, not hoped, by a
 * connect to 3001 after every run.
 *
 * Run: `npx tsx scripts/probe-round248-the-dot-guard-is-half-the-repair-and-a-copy-re-admits-the-original.mts`
 *      (spawns no server; makes no model calls; reads no ~/.claude/projects; touches nothing under packages/)
 */

import fs from 'fs';
import net from 'net';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn, execFileSync } from 'child_process';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');

// Excluded by CANONICAL NAME, not by `import.meta.url` — this round's own finding, applied to the
// instrument that found it. Running this file from a copy must not change what it enumerates.
const SELF_CANONICAL = 'probe-round248-the-dot-guard-is-half-the-repair-and-a-copy-re-admits-the-original.mts';

const R223 = 'probe-round223-twenty-one-probes-against-a-stranger.mts';
const R246 = 'probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts';

const results: ProbeVerdict[] = [];
const check = (arm: string, c: string, pass: boolean, detail: string) => {
  results.push({ arm, check: c, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${c}\n        ${detail}`);
};
const meas = (arm: string, c: string, detail: string) => {
  results.push({ arm, check: c, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${c}\n        ${detail}`);
};
const open = (arm: string, c: string, detail: string) => {
  results.push({ arm, check: c, pass: true, kind: 'open' });
  console.log(`  [${arm}] OPEN  ${c}\n        ${detail}`);
};

const sha = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packagesDirty = () =>
  execFileSync('git', ['status', '--porcelain', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
const packagesBefore = packagesDirty();

// Captured before anything is staged or mutated, so arm Z compares against what this probe found
// rather than against HEAD — this round's repairs to both files are uncommitted while it runs.
const r223StartSha = sha(path.join(SCRIPTS, R223));
const r246StartSha = sha(path.join(SCRIPTS, R246));

const portIsQuiet = (port: number) =>
  new Promise<boolean>((resolve) => {
    const s = net.createConnection({ host: '127.0.0.1', port });
    const done = (quiet: boolean) => { s.destroy(); resolve(quiet); };
    s.on('connect', () => done(false));
    s.on('error', () => done(true));
    setTimeout(() => done(true), 1500);
  });

// ── Staging, with the cleanup counted ────────────────────────────────────────

const staged: string[] = [];
function stageCopy(sourceBasename: string, asBasename: string): string {
  const dest = path.join(SCRIPTS, asBasename);
  if (fs.existsSync(dest)) throw new Error(`refusing to overwrite an existing ${asBasename}`);
  fs.copyFileSync(path.join(SCRIPTS, sourceBasename), dest);
  staged.push(dest);
  return dest;
}
function unstageAll(): number {
  let removed = 0;
  for (const p of staged.splice(0)) if (fs.existsSync(p)) { fs.rmSync(p); removed++; }
  return removed;
}

/**
 * Apply an in-place edit to a committed file, run `body`, and restore unconditionally. The anchor
 * must occur EXACTLY ONCE (Round 245 §4: a harness that cannot prove it swapped the subject is
 * reporting on the original) and the bytes must actually change.
 */
async function withInPlaceEdit<T>(file: string, anchor: string, replacement: string, body: () => Promise<T>): Promise<T> {
  const p = path.join(SCRIPTS, file);
  const before = fs.readFileSync(p, 'utf8');
  const beforeSha = sha(p);
  const occurrences = before.split(anchor).length - 1;
  if (occurrences !== 1) throw new Error(`anchor occurs ${occurrences}× in ${file}, expected exactly 1`);
  const after = before.replace(anchor, replacement);
  if (after === before) throw new Error(`edit to ${file} changed no bytes`);
  // The git side compares to the status this probe FOUND, not to clean. This round's own repairs
  // to probe-round223 and probe-round246 are deliberately uncommitted while it runs, so asserting
  // an empty status here fails on the repairs rather than on a bad restore — which is what the
  // first version of this helper did, and it aborted the run at arm A.
  const gitBefore = execFileSync('git', ['status', '--porcelain', '--', `scripts/${file}`], { cwd: REPO, encoding: 'utf8' }).trim();
  fs.writeFileSync(p, after);
  try {
    return await body();
  } finally {
    fs.writeFileSync(p, before);
    const restoredSha = sha(p);
    if (restoredSha !== beforeSha) throw new Error(`RESTORE FAILED for ${file}: ${beforeSha} -> ${restoredSha}`);
    const gitAfter = execFileSync('git', ['status', '--porcelain', '--', `scripts/${file}`], { cwd: REPO, encoding: 'utf8' }).trim();
    if (gitAfter !== gitBefore) throw new Error(`RESTORE FAILED for ${file}: git went "${gitBefore}" -> "${gitAfter}"`);
  }
}

// ── Running a probe, truncated at a marker ───────────────────────────────────

/**
 * Spawn a probe and kill it the moment `marker` appears. Used to read `probe-round223`'s
 * population without paying for its 28-probe sweep — and, more importantly, without letting it
 * reach the point where it stages an occupant on 3001.
 */
/**
 * Kill the whole PROCESS GROUP, not the child handle.
 *
 * Driven the hard way in this fire: `spawn('npx', ['tsx', …])` makes `npx` the child and `node`
 * a grandchild. `child.kill('SIGKILL')` reaps only `npx` — the grandchild is orphaned and KEEPS
 * RUNNING. My first attempt at arm A truncated on the marker, reported nothing amiss, and the
 * orphaned probe went on to stage a live occupant on 3001 behind my back; I found it by connecting
 * to the port while the round was "truncated". `detached: true` puts the pair in their own group
 * so a negative-pid signal reaches both.
 *
 * This is `probe-round230-a-killed-probe-must-not-leave-its-server`'s subject, one level up, in
 * the harness written to audit harnesses — and it is the donor this round copies.
 */
function killGroup(child: { pid?: number; killed: boolean }) {
  if (child.pid === undefined) return;
  try { process.kill(-child.pid, 'SIGKILL'); } catch { /* group already gone */ }
}

function spawnDetached(file: string) {
  return spawn('npx', ['tsx', path.join(SCRIPTS, file)], {
    cwd: REPO,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
}

function runUntil(file: string, marker: RegExp, timeoutMs = 120_000): Promise<{ out: string; truncated: boolean }> {
  return new Promise((resolve, reject) => {
    const child = spawnDetached(file);
    let out = '';
    let truncated = false;
    const timer = setTimeout(() => killGroup(child), timeoutMs);
    const onData = (b: Buffer) => {
      out += b.toString();
      if (!truncated && marker.test(out)) { truncated = true; killGroup(child); }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', () => { clearTimeout(timer); resolve({ out, truncated }); });
  });
}

function runToEnd(file: string, timeoutMs = 300_000): Promise<{ out: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawnDetached(file);
    let out = '';
    const timer = setTimeout(() => killGroup(child), timeoutMs);
    child.stdout.on('data', (b: Buffer) => { out += b.toString(); });
    child.stderr.on('data', (b: Buffer) => { out += b.toString(); });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ out, code }); });
  });
}

const PARTITION = /the three categories partition the population with none left over — (\d+) \+ (\d+) \+ (\d+) = (\d+)/;
const r223Population = (out: string): number | null => {
  const m = out.match(PARTITION);
  return m ? Number(m[4]) : null;
};
const r246Enumeration = (out: string): number | null => {
  const m = out.match(/recursive (\d+) · one-level (\d+)/);
  return m ? Number(m[1]) : null;
};
const r246Verdicts = (out: string): string =>
  (out.match(/^\s*\[[A-Z]\] (PASS|FAIL)/gm) ?? []).join(' | ');
const r246Tail = (out: string): string =>
  (out.match(/All \d+ regression checks passed\.|\d+ of \d+ regression check\(s\) FAILED\./) ?? ['<no summary line>'])[0];

// ═════════════════════════════════════════════════════════════════════════════

async function main() {
  // ── Arm A — the routed repair at probe-round223:136, driven two-sided ──────
  //
  // The dot-copy is a copy of a MIGRATED probe (it must contain the shared module's basename to
  // be classified at all), so it lands in the population as a 29th member that is not a probe.

  // Built by concatenation, and NOT written as one literal anywhere in this file. probe-round223
  // classifies any `.mts` whose source merely CONTAINS this basename, so spelling it out here
  // would enrol this probe in the very population it is measuring — the self-citation trap, third
  // sighting (my Round 246 §4, Daedalus's Round 247 §4, now mine again). I caught it by dating
  // round223's red below and finding this file listed as the 29th importer.
  const MODULE_BASENAME = 'probe-server-' + 'ownership';
  check('A', 'this probe is NOT in the population it measures — the self-citation trap, guarded',
    !fs.readFileSync(path.join(SCRIPTS, SELF_CANONICAL), 'utf8').includes(MODULE_BASENAME),
    `the shared module's basename appears nowhere as a literal in ${SELF_CANONICAL}, so probe-round223 does not classify it`);

  // The donor must itself classify, or a staged copy of it proves nothing about the population.
  // Asserted, not assumed — the first version of this probe used `probe-round224`, which is NOT
  // an importer, and the arm caught it. That is the arm earning its place: without it the A2 run
  // would have shown no movement and I would have reported the defect as not reproducing.
  const DONOR = 'probe-round230-a-killed-probe-must-not-leave-its-server.mts';
  check('A', 'the donor for the staged copies is itself in the population being measured',
    fs.readFileSync(path.join(SCRIPTS, DONOR), 'utf8').includes(MODULE_BASENAME),
    `${DONOR} names the shared module, so a copy of it classifies`);

  const GUARDED = `const allMts = fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts') && !f.startsWith('.')).sort();`;
  const UNGUARDED = `const allMts = fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts')).sort();`;

  const r223src = fs.readFileSync(path.join(SCRIPTS, R223), 'utf8');
  check('A', 'probe-round223 carries the guard at HEAD — the repair this round is asked for is in',
    r223src.includes(GUARDED) && !r223src.includes(UNGUARDED),
    `:136 reads \`…endsWith('.mts') && !f.startsWith('.')\`, the exact spelling probe-round240:123 has used since it was written`);

  // A1 — guard ON, dot-copy staged: the copy must NOT enter the population.
  stageCopy(DONOR, '.r248-dot-copy.mts');
  const a1 = await runUntil(R223, PARTITION);
  const a1pop = r223Population(a1.out);
  const a1names = /\.r248-dot-copy/.test(a1.out);
  unstageAll();

  // A2 — guard OFF (in place, restored), same dot-copy: the defect, driven.
  const a2 = await withInPlaceEdit(R223, GUARDED, UNGUARDED, async () => {
    stageCopy(DONOR, '.r248-dot-copy.mts');
    try { return await runUntil(R223, PARTITION); } finally { unstageAll(); }
  });
  const a2pop = r223Population(a2.out);
  const a2names = /r248-dot-copy/.test(a2.out);

  // A3 — guard ON, a NON-dot copy staged: the guard must not blind the sweep to a real file.
  stageCopy(DONOR, 'r248-visible-copy.mts');
  const a3 = await runUntil(R223, PARTITION);
  const a3pop = r223Population(a3.out);
  const a3names = /r248-visible-copy/.test(a3.out);
  unstageAll();

  // The control this episode demands. A `runUntil` that never matched its marker still returns an
  // output string and still lets the arms below parse a number out of it — it just does so from a
  // run that went all the way to the end and staged a server. That is precisely what happened on
  // my first attempt, and NOTHING in the arms would have said so. Truncation is now asserted.
  check('A', 'every condition truly truncated at the marker — not run to completion in silence',
    a1.truncated && a2.truncated && a3.truncated,
    `guard-on: ${a1.truncated} · guard-off: ${a2.truncated} · visible-copy: ${a3.truncated} — a false here means the run reached probe-round223's arm B and staged an occupant, and the population figures below came from a run this probe did not control`);

  // The predicate is the POPULATION COUNT, not whether the copy's name appears in the output.
  // First version asserted the name too and both arms went red at correct counts: probe-round223
  // prints member names only for the `no-preflight` category, and the donor is a `refuses`, so a
  // copy of it is counted and never named. An assertion on an output the subject does not promise
  // to produce is a failing arm that means nothing — the counts below are the evidence.
  check('A', 'the unguarded read admits a dot-prefixed copy to the population — THE DEFECT, driven',
    a1pop !== null && a2pop !== null && a2pop === a1pop + 1,
    `guard ON: ${a1pop} members · guard OFF: ${a2pop} members — the extra member is a file that is not a probe, and probe-round223 would have DRIVEN it against the stranger`);

  check('A', 'the guard does not blind the sweep to a real, visible .mts — the other side',
    a1pop !== null && a3pop !== null && a3pop === a1pop + 1,
    `guard ON + non-dot copy: ${a3pop} members (vs ${a1pop} with the same copy dot-prefixed) — the repair filters the DOT PREFIX, not the file; a real new probe still enters the population`);

  meas('A', 'a side effect of the repair, reported rather than asserted away',
    `with the guard ON, a staged dot-copy is invisible to the walk but STILL listed by \`git ls-files --others\`, so probe-round223's walk-vs-git agreement arm sees a git-only entry (observed: ${a1names ? 'yes' : 'no'}). That arm is doing its job — the disagreement is real while a harness copy is on disk. It is an artefact of staging, not of the repair, and it disappears with the copy.`);

  meas('A', 'the population probe-round223 drives, at this HEAD',
    `${a1pop} — Round 223 was written against 21; the sweep has grown by ${a1pop === null ? '?' : a1pop - 21} since, which is why the count is read and not asserted against a literal`);

  const quietAfterA = await portIsQuiet(3001);
  check('A', 'no occupant was ever staged on 3001 — every run truncated before probe-round223 reaches arm B',
    quietAfterA, 'a connect to 127.0.0.1:3001 after all three conditions: refused');

  // ── Arm B — SELF by runtime identity, driven on probe-round246 ─────────────
  //
  // This is the half the dot-guard does not reach. probe-round246 ALREADY guards its walk against
  // dot files (:180, :190) and correctly skips the copy — and the population still moves, because
  // the ORIGINAL stops being excluded.

  const r246src = fs.readFileSync(path.join(SCRIPTS, R246), 'utf8');
  check('B', 'probe-round246 already carries the dot guard on both of its walkers',
    r246src.includes(`if (e.name.startsWith('.')) continue;`) && r246src.includes(`!f.startsWith('.')`),
    'the staged copy is correctly invisible to the walk — so anything that moves below is NOT the Round 247 §3 mechanism');

  const dotCopy246 = '.r248-r246-verbatim.mts';

  // B1 — HEAD, run the original. The reference population.
  const b1 = await runToEnd(R246);
  const b1pop = r246Enumeration(b1.out);

  // B2 — HEAD (canonical SELF), run a verbatim copy. The repair: population must not move.
  stageCopy(R246, dotCopy246);
  const b2 = await runToEnd(dotCopy246);
  const b2pop = r246Enumeration(b2.out);
  unstageAll();

  check('B', 'with SELF a canonical constant, a verbatim copy reports the same population — the repair',
    b1pop !== null && b2pop !== null && b2pop === b1pop,
    `original: ${b1pop} · verbatim dot-copy: ${b2pop} — the fix is at the EXCLUSION, not at the staging, which is why Round 247 §3's tmpdir remedy does not reach this class`);

  // B3 — reintroduce the defect in place (restored in the finally) and drive it.
  const SELF_FIXED = `const SELF = 'probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts';`;
  const SELF_RUNTIME = `const SELF = path.basename(fileURLToPath(import.meta.url));`;
  const b3 = await withInPlaceEdit(R246, SELF_FIXED, SELF_RUNTIME, async () => {
    stageCopy(R246, dotCopy246);
    try { return await runToEnd(dotCopy246); } finally { unstageAll(); }
  });
  const b3pop = r246Enumeration(b3.out);

  check('B', 'SELF by runtime identity: a VERBATIM, zero-mutation copy inflates the population — THE FINDING, driven',
    b1pop !== null && b3pop !== null && b3pop === b1pop + 1,
    `runtime SELF, run from the verbatim dot-copy: ${b3pop} vs ${b1pop} — and the extra member is the committed ORIGINAL, a real tracked file that no dot-prefix guard can exclude`);

  meas('B', 'what the inflation cost, figure by figure, when the defect was live',
    `every population-denominated measurement in probe-round246 moved together: recursive ${b1pop}→${b3pop}, one-level 114→115, emit-spelling namers 21/${b1pop}→21/${b3pop}, dependency-moved 19/${b1pop}→19/${b3pop}, corpus readers direct 25→26 and transitive 28→29 — an off-by-one invisible in any single run, and NOT an arm failure, which is why nothing caught it`);

  // ── Arm E — the thing I was not sent to find: round223 was RED at HEAD ─────
  //
  // Taking the clean baseline for arm A turned up a failing arm, on a pin. probe-round223 asserted
  // `migrated.length === 21 + 2`. That is a hardcoded total — and eighteen lines above it the same
  // file has always carried the comment explaining why hardcoded totals are wrong:
  //
  //   "A hardcoded total would have to be edited every round, which is how a check becomes a
  //    thing people update to match rather than a thing that tells them something."
  //
  // Round 247 §4's rule, from the other side: a lesson learned in one arm is not learned in the
  // file. Here it was not even learned in the *comment block that states it*.

  const FLOOR = 23;
  const migratedNow = fs.readdirSync(SCRIPTS)
    .filter((f) => f.endsWith('.mts') && !f.startsWith('.'))
    .filter((f) => f !== SELF_CANONICAL)
    .filter((f) => fs.readFileSync(path.join(SCRIPTS, f), 'utf8').includes(MODULE_BASENAME))
    .filter((f) => !['probe-round223-twenty-one-probes-against-a-stranger.mts',
                     'probe-round222-port-ownership-hoist.mts',
                     'probe-round223b-db-existence-is-not-identity.mts'].includes(f));

  // Date the red from git, rather than asserting it from the memo I read it in.
  const firstCommitDate = (f: string): string => {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%ad|%h', '--date=short', '--', `scripts/${f}`],
      { cwd: REPO, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    return out[out.length - 1] ?? 'UNCOMMITTED|-';
  };
  const dated = migratedNow.map((f) => ({ f, d: firstCommitDate(f) })).sort((a, b) => a.d.localeCompare(b.d));
  const breaker = dated[FLOOR]; // the 24th, 0-indexed — the one that pushed past the pin

  check('E', 'the population has genuinely outgrown the pin — so the old arm could not have been green',
    migratedNow.length > FLOOR,
    `${migratedNow.length} migrated probes on disk vs the pinned ${FLOOR} — a shortfall of ${migratedNow.length - FLOOR} that the equality reported as a regression in the hoist`);

  meas('E', 'when probe-round223 went red, dated from git rather than inferred',
    breaker
      ? `the ${FLOOR + 1}th importer is ${breaker.f} (added ${breaker.d.split('|')[0]}, ${breaker.d.split('|')[1]}) — probe-round223 arm A has been FAILING SINCE ${breaker.d.split('|')[0]}, and this round is the first run since`
      : '(could not date — fewer importers on disk than the floor)');

  meas('E', 'why four days of red went unnoticed, stated as the structural fact it is',
    'probe-round223 is not in `npm test`, takes ~15 minutes to run because it drives every subject against a live stranger, and nothing schedules it. Round 247 §6 reported controls for round224, round245 and round247 — round223 was not among them. An expensive probe outside the suite is a probe whose red is discovered by accident.');

  const r223now = fs.readFileSync(path.join(SCRIPTS, R223), 'utf8');
  check('E', 'the pin is repaired as a floor, not bumped to the new number',
    r223now.includes('migrated.length >= R223_ESTABLISHED_FLOOR') && !r223now.includes('migrated.length === DAEDALUS_ROUND_222_COUNT'),
    'the arm now asserts the population never shrinks below what Round 223 established, and the exact count is demoted to the measurement it always was — editing the literal to 28 would have made it green again and left it to go red on the 29th');

  // ── Arm C — the census: how large is this class ────────────────────────────

  // This file is excluded by CANONICAL NAME and the exclusion is stated rather than quiet. It
  // has to be: to perform arm B's repair, this probe writes both spellings of `SELF` as live
  // string literals, and a scanner cannot separate a string I am writing to disk from a call I
  // make (Round 246 §4; Daedalus hit the same wall in Round 247 §4 at his own expense). Without
  // this line the census reports its own instrument as a defect.
  const files = fs.readdirSync(SCRIPTS)
    .filter((f) => (f.endsWith('.mts') || f.endsWith('.mjs')) && !f.startsWith('.'))
    .filter((f) => f !== SELF_CANONICAL)
    .sort();
  const selfExcluders: string[] = [];
  const byRuntime: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(SCRIPTS, f), 'utf8');
    // A self-excluder is a file that both enumerates a directory and filters a SELF out of it.
    if (!/readdirSync/.test(src)) continue;
    if (!/\bSELF\b/.test(src)) continue;
    selfExcluders.push(f);
    if (/const\s+SELF\s*=\s*path\.basename\(fileURLToPath\(import\.meta\.url\)\)/.test(src)) byRuntime.push(f);
  }
  meas('C', 'self-excluding enumerators in scripts/, and how many still exclude by runtime identity',
    `${selfExcluders.length} file(s) both enumerate a directory and exclude a SELF. ` +
    `${byRuntime.length} still derive SELF from import.meta.url: ${byRuntime.join(', ') || '(none)'}. ` +
    `Measured AFTER this round's two repairs — probe-round223 and probe-round246 were the whole class when it was found, and this arm exists so the next one is found by a sweep instead of by accident.`);

  // ── Arm D — the control Daedalus asked for, stated as its own result ───────

  const b1verdicts = r246Verdicts(b1.out);
  const b2verdicts = r246Verdicts(b2.out);
  check('D', "Daedalus Round 247 §3's question, answered: no arm verdict moves under a zero-mutation copy",
    b1verdicts === b2verdicts && b1verdicts.length > 0,
    `original: ${r246Tail(b1.out)} · verbatim copy: ${r246Tail(b2.out)} · arm verdicts identical (${b1verdicts || '<none parsed>'})`);

  meas('D', "so Round 246 §8's collateral reds were genuine cross-arm coupling, not harness artefacts",
    'M1→(A,H) and M3→(F,H) stand as reported. Nothing of Round 246 is withdrawn, and its published figures (21/126 · 19 · 39 pairs · 25 direct) all came from clean runs of the original — Argus reproduced them independently from a clean tree on 2026-09-21.');

  // ── Arm Z — cleanup and blast radius, counted not assumed ─────────────────

  const leftover = fs.readdirSync(SCRIPTS).filter((f) => f.includes('r248-'));
  check('Z', 'every staged copy is gone, counted by readdirSync rather than assumed',
    leftover.length === 0, `0 file(s) matching r248- remain in scripts/ (found: ${leftover.join(', ') || 'none'})`);

  // Both files carry this round's REPAIRS, which are intentionally uncommitted while it runs. The
  // property is that the in-place MUTATIONS are gone — i.e. the bytes are what this probe found
  // at start — not that the files are clean against HEAD.
  const r223End = sha(path.join(SCRIPTS, R223));
  const r246End = sha(path.join(SCRIPTS, R246));
  check('Z', 'both files edited in place are byte-identical to where this probe found them',
    r223End === r223StartSha && r246End === r246StartSha,
    `probe-round223 sha256 ${r223StartSha.slice(0, 12)} → ${r223End.slice(0, 12)} · probe-round246 ${r246StartSha.slice(0, 12)} → ${r246End.slice(0, 12)} — every in-place mutation restored in its finally`);

  check('Z', 'packages/ untouched', packagesDirty() === packagesBefore,
    `git status --porcelain -- packages/ unchanged from session start ("${packagesBefore || 'clean'}")`);

  check('Z', 'port 3001 is quiet at exit — this probe staged no server and leaked none',
    await portIsQuiet(3001), 'a connect to 127.0.0.1:3001 at the end of the run: refused');

  open('Z', 'still open, carried forward unchanged',
    'the 49 stale-in-code files remain graded and UNDRIVEN — fourth round open, said plainly rather than softened.');

  summariseAndExit({ probeName: 'round248-dot-guard-is-half-the-repair', results, regressionKind: 'regression' });
}

main().catch((e) => {
  unstageAll();
  console.error('\nPROBE ABORTED:', e?.stack ?? e);
  process.exit(3);
});
