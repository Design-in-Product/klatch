/**
 * Round 225 — a citation is not a call, and a factor is not a value.
 *
 * Two threads land in the same place, so they are driven in one file.
 *
 * ## Thread 1 — Argus's Round 223b finding, and the check he did not report
 *
 * Argus re-ran `probe-round223b-db-existence-is-not-identity.mts` unmodified and got **11/13 · 2
 * failed** where my §7 table published **13/13 · 0 failed**. He is right, and his diagnosis is
 * right: arm A asserts the *pre-fold* shape of `probe-round219`, the fold landed in the same
 * commit as the memo, and I pasted §7's numbers from a run taken before it. Arm A's own comment
 * predicted this — *"If Round 223's own repair lands first, these go red and say so."*
 *
 * What neither of us reported is the third check. Arm A has three; two went red and **one stayed
 * green**:
 *
 *     PASS [A] probe-round219 still identifies its own server by the scratch DB existing
 *              — probe-round219:162
 *
 * `probe-round219:162` is inside a `/** *\/` docblock. The line is prose *recording that the check
 * was removed*. The regex `/if\s*\(!fs\.existsSync\(DB\)\)/` has no line anchor, so it matched the
 * citation in the comment and reported the call as present. **The two red checks were correct and
 * loud; the green one asserts the opposite of what the file says, and nobody reads a green line.**
 *
 * Same shape as Daedalus's Round 224 §5 self-report — *"a scan that can't tell a citation from a
 * call would have had the next reader 'fixing' a comment"* — in the opposite direction: his scan
 * called a comment a defect, mine called a comment a feature.
 *
 * ### The repair, and the rule it comes from
 *
 * Arm A was a precondition of the form *"the defect this probe is about is still here."* That
 * form **dies of its own success**: the moment the defect is repaired the precondition goes red,
 * and it goes red in the one commit where the probe was most recently believed. Inverted, it
 * becomes a regression check — *"the repair is still here"* — which stays green until someone
 * puts the defect back, which is the only time anybody wants to hear from it.
 *
 * > **Rule: a precondition that asserts a defect still exists dies of its own success. Assert the
 * > repair, not the defect.** Sibling to Round 215 (*a probe that only measures cannot notice
 * > that the thing it measured got fixed*) — same failure, one level up: this one cannot notice
 * > that it got fixed either, except by going red at its author.
 *
 * ## Thread 2 — Daedalus's Round 224 constant reader, driven at its stated rule
 *
 * `scripts/lib/probe-source-constants.mts` fixed two live failures and is a real improvement.
 * Driven against the spellings its own docstring names, three things hold that the memo does not
 * say — and one of them is the bug the module was written to eliminate, re-entered through the
 * door that makes its other caller work:
 *
 * | spelling of the declaration | `readNumericConstant` returns |
 * |---|---|
 * | `50_000` | `50000` — the fix, working |
 * | `50000` | `50000` |
 * | `5e4` | **throws** — the docstring names this as the same number |
 * | `50 * 1000` | **`50`** — silently 1000× small: the original `turncount` bug |
 * | `50 * 1024 * 1024` | `50` — *correct*, by a convention living in the callers |
 * | `0xC350` | throws |
 *
 * The last two rows are the same call returning the same number, once right and once wrong. The
 * reader cannot tell a whole value from the leading factor of a product, because `*` is in its
 * terminator class — and `*` has to be there, since three callers read `MAX_IMPORT_SIZE = 50 *
 * 1024 * 1024` and multiply the `50` back up themselves. **Two unit conventions were merged into
 * one function, and the terminator that serves the factor convention reopens the silent prefix
 * match for the whole-value convention.** Nothing at the call site records which one it wants.
 *
 * Scope, honestly: this is **latent**, not live. `FINGERPRINT_LINE_CAP` is spelled `50_000` today
 * and reads correctly. The claim is about what the next reformatting does, which is exactly the
 * claim Round 224 made and was right about.
 *
 * **Repaired in Round 226 (Daedalus, same day).** The table above is the record of what this
 * round found, kept as written. What it describes no longer holds: `readNumericConstant` now
 * throws on both product spellings instead of returning `50`, `5e4` and `0xC350` read as `50000`,
 * and the factor convention moved to a second function, `readLeadingFactor`, which throws on a
 * bare value so the symmetric reformatting is loud too. Arms D and E below were inverted to
 * assert the repair rather than the defect — per this round's own §1 rule, a precondition that
 * asserts a defect still exists dies of its own success.
 *
 * ## What this probe does not do
 *
 * No server, no port, no network, no model call. Every spelling is spliced into an in-memory copy
 * of the real shipped declaration; `packages/` is asserted unchanged at the start and again at
 * exit. The one subprocess is `probe-round223b` itself, re-driven after the arm A repair, because
 * a probe edit not followed by a probe run is proofread, not verified.
 *
 * Amended Round 270 (2026-09-25): arm B2 mints and spawns five throwaway scripts under gitignored
 * `.testdata/r270/exitcodes/` to drive the exit-code classifier against real process exits. They
 * print and exit; they open no port and touch nothing outside that directory.
 *
 * ## Amendment, Round 270 — arm B no longer spends the child's exit code
 *
 * Daedalus's Round 269 §1 drove this file rather than reading it and found that arm B decided on
 * `r223bExit === 0`, mapping `probe-round223b`'s **exit 2 (refused at its own door)** and its
 * **exit 1 (a check failed)** onto one FAIL. The child's refusal was printed in arm B's own
 * failure detail and then discarded — so a sweep one level up saw this probe exit 1 and could not
 * tell "could not run" from "broke", no matter what it was taught to look for.
 *
 * > **The exit code is the only channel that carries the distinction, and a driving arm that
 * > grades a child's refusal as a boolean spends that channel before anything downstream can read
 * > it.** (Daedalus, Round 269 §1 — his sentence, kept.)
 *
 * Repaired here in three parts: `classifyDrive` returns three states instead of a boolean; the
 * `could-not-run` state records a **hard skip** rather than a check, which makes this probe exit
 * **3** via the vocabulary `scripts/lib/probe-outcome.mts` already ships; and arm B2 drives all
 * five branches of the classifier against processes that really exit 0, 1 and 2.
 *
 * **Why 3 and not 2, which is the one thing the routing did not anticipate.** Exit 2 means
 * *refused at the door, nothing ran*. When 3001 is held, arms A, C, D, E, F and Z of this probe
 * all run and all still decide; only arm B's subprocess cannot. 3 is that state exactly — *ran and
 * established less than it set out to* — and it is the module's own documented code for it. A
 * consumer keying a third state on **exit 2 alone** therefore still cannot see this red. Reported
 * to Daedalus rather than worked around here, because widening it is his file's call.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync, spawnSync } from 'child_process';
import { readNumericConstant, readLeadingFactor, replaceNumericConstant } from './lib/probe-source-constants.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRIPTS = path.join(REPO, 'scripts');
const PACKAGES = path.join(REPO, 'packages');
const SCANNER = path.join(PACKAGES, 'server/src/import/session-scanner.ts');
const IMPORT_TS = path.join(PACKAGES, 'server/src/routes/import.ts');
const R219 = path.join(SCRIPTS, 'probe-round219-files-cap-live-http.mts');
const R223B = path.join(SCRIPTS, 'probe-round223b-db-existence-is-not-identity.mts');

const results: ProbeVerdict[] = [];
/**
 * Arms that did not run. A bare string is a **hard** skip and forces exit 3 — see
 * `scripts/lib/probe-outcome.mts`. Arm B's drive lands here when its child refuses at its own
 * door, which is the whole of Round 269 §1's routed repair.
 */
const skipped: string[] = [];

function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, kind: 'regression' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
/** A finding in the subject. Reported, not a hard check — it does not decide this probe's exit. */
function open(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, kind: 'open' });
  console.log(`OPEN [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

function packagesDirty(): string {
  return execFileSync('git', ['status', '--porcelain', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}

/**
 * Arm Z's window, as content rather than as a status listing.
 *
 * **Why this is not `packagesDirty() === ''`** (repaired 2026-09-22, Round 256). On 2026-09-22
 * this probe reported 2 of 22 FAILED, both arm Z, listing an untracked file that belonged to
 * Daedalus and had nothing to do with this run. Daedalus's Round 255 §4: *an emptiness assertion
 * over a shared window grades everyone who touched it, not the run that made it.* The invariant
 * this probe is entitled to is "I left the tree as I found it".
 *
 * **Why it is not a before/after comparison of `packagesDirty()` either.** Porcelain emits status
 * letters and paths, not content. For a file that was ALREADY dirty at window open, a run that
 * then rewrites it produces the identical porcelain string at both ends — and "already dirty at
 * open" is precisely the condition that motivated this repair. Driven two-sided on minted git
 * repositories in `probe-round256-…mts` arms B1–B4: porcelain alone misses it, this does not.
 *
 * `-uall` expands untracked directories into files so every listed path can be hashed; `git diff
 * HEAD` carries the content of tracked modifications. Known limit: a rename under `-z` emits the
 * old path as a bare second record, which lands in the porcelain hash but is not content-hashed.
 */
function packagesFingerprint(): string {
  const g = (args: string[]) =>
    execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const entries = g(['status', '--porcelain', '-z', '-uall', '--', 'packages/'])
    .split('\0').filter((s) => s.length > 0);
  const parts = [
    `P:${crypto.createHash('sha256').update(entries.join('\n')).digest('hex')}`,
    `D:${crypto.createHash('sha256').update(g(['diff', 'HEAD', '--', 'packages/'])).digest('hex')}`,
  ];
  for (const u of entries.filter((e) => e.startsWith('?? ')).map((e) => e.slice(3)).sort()) {
    const abs = path.join(REPO, u);
    let h = 'ABSENT';
    try {
      if (fs.statSync(abs).isFile()) {
        h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
      }
    } catch { /* ABSENT */ }
    parts.push(`U:${u}:${h}`);
  }
  return parts.join('|');
}

/**
 * Strip block comments and line comments, replacing each with blank space so that line numbers
 * are preserved. Used to tell a citation from a call — the distinction this whole round is about.
 */
function codeOnly(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + m.slice(p1.length).replace(/[^\n]/g, ' '));
}

// ── Arm Z (open) — nothing HERE may touch shipped source ─────────────────────
//
// Round 256: this used to be `check('Z', 'packages/ clean before this probe reads anything',
// packagesBefore === '')`. It is a measurement now, not a check, on purpose: the state of the tree
// when this run opens is not this run's doing, and grading it is what reddened the probe on
// another agent's uncommitted file. What is recorded here is the baseline the close compares
// against.

const packagesBefore = packagesDirty();
const fingerprintBefore = packagesFingerprint();
measure('Z', 'window baseline at open — recorded, NOT graded',
  packagesBefore === ''
    ? 'git status --porcelain packages/ was empty at open'
    : `git status --porcelain packages/ was NOT empty at open, and that is somebody else's ` +
      `business, not this probe's:\n${packagesBefore}`);

// ── Arm A — the state Argus found, and the check he did not report ───────────

console.log('\n── arm A: probe-round223b arm A on the current tree ─────────────');

const r219src = fs.readFileSync(R219, 'utf8');
const r219code = codeOnly(r219src);

const EXISTS_RE = /if\s*\(!fs\.existsSync\(DB\)\)/;
const inFullText = EXISTS_RE.test(r219src);
const inCodeOnly = EXISTS_RE.test(r219code);
const existsLine = r219src.split('\n').findIndex((l) => EXISTS_RE.test(l)) + 1;

check('A', 'the DB-existence identity check is gone from probe-round219 code', !inCodeOnly,
  inCodeOnly ? 'still present as a call' : 'no call site once comments are stripped');
check('A', 'and the string that made round223b arm A pass is a comment, not a call',
  inFullText && !inCodeOnly,
  `matches raw source at probe-round219:${existsLine}, matches nothing in comment-stripped source`);

const r219Line = r219src.split('\n')[existsLine - 1] ?? '';
measure('A', 'the line round223b cited as evidence the defect survives',
  `probe-round219:${existsLine} — ${JSON.stringify(r219Line.trim().slice(0, 96))}`);

// The two checks Argus reported red, re-derived here from the same source text.
const bannerCount = r219src.split('Klatch server running').length - 1;
const localRepairPresent = /somethingIsAlreadyAnswering/.test(r219code);
check('A', "Argus's first red reproduces — the readiness loop now has a banner side",
  bannerCount > 0 || /waitUntilOurServerIsUp/.test(r219code),
  `"Klatch server running" appears ${bannerCount}x; waitUntilOurServerIsUp imported: ${/waitUntilOurServerIsUp/.test(r219code)}`);
check('A', "Argus's second red reproduces — the local Round 221 repair is gone, folded onto the module",
  !localRepairPresent, 'somethingIsAlreadyAnswering has no call site in probe-round219');

open('A', 'round223b arm A published 13/13 against a tree where 2 of its 3 checks were false',
  'and the third was true only of a comment — the memo pasted a pre-fold run');

// ── Arm B — the repair, asserted in the file, then driven ────────────────────

console.log('\n── arm B: arm A inverted to assert the repair ───────────────────');

const r223bAfter = fs.readFileSync(R223B, 'utf8');
const r223bCode = codeOnly(r223bAfter);

// The property, not the name: arm A's decisions must be taken against comment-stripped text.
const decidesOnCode = /\.test\(r219code\)/.test(r223bCode);
const decidesOnRaw = /existsSync\(DB\)\\\)\/\.test\(r219src\)/.test(r223bCode);
check('B', 'round223b arm A decides against comment-stripped source, not raw text',
  decidesOnCode && !decidesOnRaw,
  `tests r219code: ${decidesOnCode}; still tests r219src for the defect pattern: ${decidesOnRaw}`);
check('B', 'and it asserts the repair rather than the defect',
  /no longer identifies its own server by the scratch DB/.test(r223bAfter) &&
  !/still identifies its own server by the scratch DB/.test(r223bAfter),
  'the "the defect is still here" precondition is gone');

// Structure is not behaviour. The only thing that settles whether the repaired arm A holds is
// running it — a probe edit not followed by a probe run is proofread, not verified. round223b
// stages its own occupant on 3001 and refuses if anything already holds the port.
console.log('  driving probe-round223b (stages a server on 3001; ~30s) …');
let r223bOut = '';
let r223bExit = 0;
const t0 = Date.now();
try {
  // `stdio` is explicit because execFileSync FORWARDS a child's stderr to its own by default, and
  // probe-round223b prints its refusal to stderr. Forwarded, that line becomes the last line of
  // THIS probe's output — which is the line `sweep-probes.mjs` quotes as this probe's diagnosis.
  // Captured, it is evidence; forwarded, it is a misattribution. See arm B3.
  r223bOut = execFileSync('npx', ['tsx', R223B],
    { cwd: REPO, encoding: 'utf8', timeout: 180_000, stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  const err = e as { stdout?: string; stderr?: string; status?: number };
  r223bOut = (err.stdout ?? '') + (err.stderr ?? '');
  r223bExit = err.status ?? -1;
}
const r223bMs = Date.now() - t0;
const r223bFails = (r223bOut.match(/^FAIL \[/gm) ?? []).length;
const r223bPasses = (r223bOut.match(/^PASS \[/gm) ?? []).length;

/**
 * The child's refusal, **declared here from its own `exit(2)` site** rather than sniffed with a
 * fleet-wide pattern. `probe-round223b:144` prints this string and exits 2 when 3001 is held.
 *
 * Daedalus's Round 269 §2 measured what a fleet-wide refusal regex would have to cover — seven
 * spellings of one intent across the `exit(2)` sites — and concluded against it. His **arm A6** is
 * the limb a plausible version of this omits, and it is adopted verbatim below: **an exit 2 whose
 * declared refusal text is absent gets no benefit of the doubt and stays red.** Without A6,
 * "could not run" becomes a blanket amnesty for every exit 2, including the ones that mean a
 * probe crashed on its way to the door.
 */
const R223B_REFUSAL = /something already holds 3001/;

/**
 * Round 269 §1, routed to this file: **a conversion from "could not run" to "failed" is lossless
 * nowhere and invisible everywhere.** The old form of the check below decided on
 * `r223bExit === 0 && r223bFails === 0`, which maps the child's exit 2 and its exit 1 onto the
 * same FAIL. The child's refusal was printed in the failure detail — legible to a human, and then
 * discarded before anything downstream could read it. **The exit code is the only channel that
 * carries the distinction, and a driving arm that grades a child's refusal as a boolean spends
 * that channel one level below every consumer of it.**
 *
 * Three states, not two. `red` is the default, so a code this function has never seen is a red.
 */
type DriveOutcome = 'green' | 'red' | 'could-not-run';
function classifyDrive(code: number, out: string, fails: number): DriveOutcome {
  if (code === 2 && R223B_REFUSAL.test(out)) return 'could-not-run';
  return code === 0 && fails === 0 ? 'green' : 'red';
}

const r223bDrive = classifyDrive(r223bExit, r223bOut, r223bFails);
const r223bDetail = `exit ${r223bExit} after ${r223bMs} ms — ${r223bPasses} PASS, ${r223bFails} FAIL`;

if (r223bDrive === 'could-not-run') {
  /**
   * **Why this is a skip and not a red, and why this probe then exits 3 rather than 2.**
   *
   * `scripts/lib/probe-outcome.mts` already carries the vocabulary: 2 is *refused at the door,
   * nothing ran*, set by the refusing probe itself; 3 is *ran and established less than it set out
   * to*. Arms A, C, D, E, F and Z of this probe all ran and all still decide. Only arm B's
   * subprocess could not. **Exit 2 from here would claim nothing ran, which is false; a FAIL would
   * claim something broke, which is also false.** The honest code is 3, and the module reaches it
   * from a hard skip — so the skip is the propagation, not a softening of it.
   *
   * The consequence for the mechanism this was routed into, reported rather than assumed: a
   * third state keyed on **exit 2 alone** cannot see this red, because the honest code here is 3.
   * See §1 of this round's memo to Daedalus.
   */
  skipped.push('arm B: the drive of probe-round223b — it refused at its own door, exit 2, with its ' +
    'declared refusal text present. Port 3001 is held by another process; free it and re-run.');
  console.log(`SKIP [B] the drive of probe-round223b — COULD NOT RUN, not failed — ${r223bDetail}`);
  console.log(`         operator action: free port 3001 (this is usually a live "npm run dev").`);

  /**
   * **Round 272 — why the operator action above must not be read as "check whether 3001 is free".**
   *
   * The check an operator reaches for is a bind, and **a bind to a specific loopback address
   * succeeds while a server is answering on that same address.** I did this to myself in the first
   * tool call of Round 272: bound `127.0.0.1:3001`, got FREE, wrote "the port is free", and drove
   * this probe expecting arm B to run. It skipped again, and the occupant turned out to be a live
   * dev server twelve hours old — `GET /api/channels` → 200.
   *
   * `probe-round221` is the control that asserts this, and it stages its own wildcard stub to do
   * it. What was missing was the sighting against an occupant nobody staged. This block prints that
   * sighting **at the moment an operator is being told to go free the port**, which is the one
   * moment they are about to make the mistake.
   *
   * Measured by a **real child process** doing a real bind and a real connect, not by reasoning
   * about what the addresses ought to do — arm B2's rule, one arm down: a literal is not an exit
   * code, and an inference about a socket is not a socket.
   *
   * Measurements only, deliberately. These lines must not move this probe's regression count: the
   * count on a free port is the pinned `33`, and a diagnostic that fires only when the port is held
   * would make the pin unreachable from either branch.
   */
  const addressReport = (() => {
    const src = `const net=require('net');
const connect=(host)=>new Promise(r=>{const s=net.connect({host,port:3001});const done=v=>{try{s.destroy()}catch{};r(v)};
s.setTimeout(1000);s.once('connect',()=>done('accepted'));s.once('timeout',()=>done('timeout'));s.once('error',e=>done(e.code));});
const bind=(host)=>new Promise(r=>{const s=net.createServer();s.once('error',e=>r(e.code));
s.once('listening',()=>{s.close();r('free')});host?s.listen(3001,host):s.listen(3001);});
(async()=>{const out=[];
for(const h of ['127.0.0.1','::1'])out.push('connect '+h+' -> '+await connect(h));
for(const h of ['127.0.0.1','::1'])out.push('bind '+h+' -> '+await bind(h));
out.push('bind (wildcard) -> '+await bind(null));
console.log(out.join(' · '));})();`;
    try {
      return execFileSync('node', ['-e', src],
        { encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return '(the address probe did not complete)';
    }
  })();

  console.log(`         why "is it free?" is the wrong question: ${addressReport}`);
  measure('B', 'the same port, six ways, while the child was refusing it', addressReport);
  measure('B', 'the guard that answers correctly',
    'portAcceptsAConnection (scripts/lib/probe-server-ownership.mts:85) — a connect, not a bind. ' +
    'Every freeness decision in the fleet already routes through it or through ' +
    'requireAnUnoccupiedPort (:141); the 28 bind-shaped listen sites all either stage an occupant ' +
    'or assert the old test is wrong. An ad-hoc freeness check typed into a fire is a pre-flight ' +
    'and is subject to the same rule.');
} else {
  check('B', 'the repaired round223b runs green against the tree it now describes',
    r223bDrive === 'green', r223bDetail);
}
measure('B', 'the drive of probe-round223b, as three states', `${r223bDrive} — ${r223bDetail}`);
measure('B', 'round223b summary line after the repair',
  (r223bOut.split('\n').filter((l) => /checks|passed|INCONCLUSIVE/.test(l)).pop() ?? '(none)').trim());
measure('B', "the race arms B/C, unchanged by this repair — this is Argus's 'the core finding is unaffected'",
  (r223bOut.match(/^MEAS \[[BC]\][^\n]*/gm) ?? []).map((l) => l.trim()).join(' · ') || '(none)');

// ── Arm B2 — the classifier driven against processes that really exit 0, 1 and 2 ──
//
// This file's own rule, from its §"What this probe does not do": a probe edit not followed by a
// probe run is proofread, not verified. `classifyDrive` is a function over a number, so it is
// trivially callable with a literal — and a literal 2 is not an exit 2. Three scripts are minted
// and really spawned, so the codes this arm grades are codes a process actually produced.

console.log('\n── arm B2: the three states, driven against real child exits ────');

const B2DIR = path.join(REPO, '.testdata/r270/exitcodes');
fs.rmSync(B2DIR, { recursive: true, force: true });
fs.mkdirSync(B2DIR, { recursive: true });

/** Spawn a minted script and report what it really did. Nothing is simulated. */
function driveMinted(name: string, body: string): { code: number; out: string; fails: number } {
  const p = path.join(B2DIR, `${name}.mjs`);
  fs.writeFileSync(p, body);
  let out = '';
  let code = 0;
  try {
    out = execFileSync('node', [p], { encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    out = (err.stdout ?? '') + (err.stderr ?? '');
    code = err.status ?? -1;
  }
  return { code, out, fails: (out.match(/^FAIL \[/gm) ?? []).length };
}

const mintGreen = driveMinted('green', `console.log('PASS [X] fine');\nprocess.exit(0);\n`);
const mintRed = driveMinted('red', `console.log('FAIL [X] broke');\nprocess.exit(1);\n`);
const mintRefused = driveMinted('refused',
  `console.error('minted: something already holds 3001. Stop it and re-run.');\nprocess.exit(2);\n`);
// The A6 limb: a real exit 2 that does NOT carry the declared refusal text. A probe that dies on
// its way to the door exits 2 too, and it is a red.
const mintBareTwo = driveMinted('bare-two', `console.error('minted: TypeError somewhere');\nprocess.exit(2);\n`);
// A child that exits 0 while printing failures. Its exit code and its own output disagree; the
// output is the harder evidence, so this is a red. Arm B's old boolean got this one right and it
// is pinned so the three-state rewrite cannot lose it.
const mintLiar = driveMinted('liar', `console.log('FAIL [X] broke');\nprocess.exit(0);\n`);

measure('B2', 'the exit codes the minted children really produced',
  `green ${mintGreen.code} · red ${mintRed.code} · refused ${mintRefused.code} · ` +
  `bare-two ${mintBareTwo.code} · liar ${mintLiar.code}`);
check('B2', 'the mint produced real, distinct exit codes — otherwise this arm grades nothing',
  mintGreen.code === 0 && mintRed.code === 1 && mintRefused.code === 2 && mintBareTwo.code === 2,
  `0/1/2/2 required; got ${mintGreen.code}/${mintRed.code}/${mintRefused.code}/${mintBareTwo.code}`);

const cls = (m: { code: number; out: string; fails: number }) => classifyDrive(m.code, m.out, m.fails);
check('B2', 'exit 0 with no FAIL classifies green', cls(mintGreen) === 'green', cls(mintGreen));
check('B2', 'exit 1 classifies red', cls(mintRed) === 'red', cls(mintRed));
check('B2', 'exit 2 carrying the declared refusal classifies could-not-run',
  cls(mintRefused) === 'could-not-run', cls(mintRefused));
check('B2', "exit 2 WITHOUT the declared refusal stays red — Daedalus's A6, the limb a plausible " +
  'version of this omits', cls(mintBareTwo) === 'red', cls(mintBareTwo));
check('B2', 'exit 0 printing FAIL lines is still red — the boolean form got this right and the ' +
  'rewrite does not lose it', cls(mintLiar) === 'red', cls(mintLiar));

// Two-sided on the one thing that separates the new state from the old behaviour: the refusal
// text, holding the exit code fixed at 2. Same code, opposite verdicts, one substring apart.
check('B2', 'the refusal text is load-bearing two-sided — same exit 2, opposite verdicts',
  cls(mintRefused) === 'could-not-run' && cls(mintBareTwo) === 'red',
  `refused → ${cls(mintRefused)}; bare exit 2 → ${cls(mintBareTwo)}`);

// And the regression the old form actually had, stated as a difference between the two readers
// rather than as prose about one of them.
const oldForm = (m: { code: number; fails: number }) =>
  m.code === 0 && m.fails === 0 ? 'green' : 'red';
check('B2', 'the old boolean form maps the refusal and a genuine red onto the same verdict; ' +
  'this one does not', oldForm(mintRefused) === oldForm(mintRed) && cls(mintRefused) !== cls(mintRed),
  `old: refusal=${oldForm(mintRefused)} red=${oldForm(mintRed)} (identical) · ` +
  `new: refusal=${cls(mintRefused)} red=${cls(mintRed)}`);

// ── Arm B3 — a child's stderr is not this probe's diagnosis ───────────────────
//
// **Found by the first sweep run of arm B2, not by writing it.** With arm B2 in and its `stdio`
// left default, `sweep-probes.mjs` reported:
//
//     RED   exit   3  probe-round225-a-citation-is-not-a-call.mts
//             exit 3, summary line NOT FOUND — minted: TypeError somewhere
//
// `minted: TypeError somewhere` is arm B2's own throwaway fixture, written to prove that a bare
// exit 2 stays red. `execFileSync` forwards a child's stderr to its parent unless told otherwise,
// and the sweep quotes **the last line of stdout+stderr** as the probe's diagnosis — so a fixture
// minted to exercise a classifier ended up standing in for this probe's conclusion. A reader of
// that sweep line would have gone looking for a TypeError this probe never had.
//
// > **A citation is not a call; a fixture's output is not a finding.** This file's own title,
// > one level further out — Round 225 was about a regex reading a comment as a call site, and this
// > is a sweep reading a mint's stderr as a verdict. Daedalus's Round 269 §4 is the static twin (a
// > `process.exit(2)` inside a string literal counted as a refusal site); this is the runtime one.
//
// Driven two-sided below, because "I passed the right option" is a claim about behaviour and the
// option is one word.

console.log('\n── arm B3: a child stderr does not become this probe stderr ──────');

/** A wrapper that runs a stderr-writing grandchild, with `stdio` as the single variable. */
function wrapperSource(withStdio: boolean): string {
  const opts = withStdio
    ? `{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }`
    : `{ encoding: 'utf8' }`;
  return `import { execFileSync } from 'child_process';\n` +
    `try { execFileSync(process.execPath, ['-e', "console.error('GRANDCHILD NOISE')"], ${opts}); }\n` +
    `catch { /* the grandchild's code is not this fixture's subject */ }\n` +
    `console.log('WRAPPER TAIL');\n`;
}

/** Run a wrapper and keep its two streams APART — the whole point is which one the noise lands in. */
function driveWrapper(name: string, withStdio: boolean): { out: string; err: string } {
  const p = path.join(B2DIR, `${name}.mjs`);
  fs.writeFileSync(p, wrapperSource(withStdio));
  const r = spawnSync('node', [p], { encoding: 'utf8', timeout: 30_000 });
  return { out: r.stdout ?? '', err: r.stderr ?? '' };
}

const leaky = driveWrapper('wrapper-default', false);
const tight = driveWrapper('wrapper-captured', true);

measure('B3', 'the grandchild noise, by stream, with stdio as the only variable',
  `default → stderr ${JSON.stringify(leaky.err.trim())} · captured → stderr ${JSON.stringify(tight.err.trim())}`);

check('B3', 'with default stdio a grandchild stderr LEAKS into the wrapper own stderr — this is ' +
  'the defect, reproduced rather than described',
  /GRANDCHILD NOISE/.test(leaky.err), JSON.stringify(leaky.err.trim()));
check('B3', 'with stderr piped it does not leak, and the wrapper own tail is intact',
  !/GRANDCHILD NOISE/.test(tight.err) && /WRAPPER TAIL/.test(tight.out),
  `stderr ${JSON.stringify(tight.err.trim())}; stdout tail ${JSON.stringify(tight.out.trim())}`);
check('B3', 'and the last line of stdout+stderr — the field sweep-probes quotes — is the wrapper ' +
  'own only when stderr is captured',
  ((leaky.out + leaky.err).trim().split('\n').pop() ?? '') === 'GRANDCHILD NOISE' &&
  ((tight.out + tight.err).trim().split('\n').pop() ?? '') === 'WRAPPER TAIL',
  `default → ${JSON.stringify((leaky.out + leaky.err).trim().split('\n').pop())}; ` +
  `captured → ${JSON.stringify((tight.out + tight.err).trim().split('\n').pop())}`);

// The property, asserted on this file rather than trusted: every subprocess drive here captures
// stderr. A future arm added without the option reopens the misattribution silently.
const selfCode = codeOnly(fs.readFileSync(import.meta.filename, 'utf8'));
const execCalls = (selfCode.match(/execFileSync\(/g) ?? []).length;
const execWithCapture = (selfCode.match(/execFileSync\([^;]*?stdio:\s*\['ignore',\s*'pipe',\s*'pipe'\]/gs) ?? []).length;
measure('B3', 'execFileSync call sites in this file, and how many capture stderr',
  `${execCalls} call sites · ${execWithCapture} pass stdio ['ignore','pipe','pipe']`);
check('B3', 'every execFileSync in this file that drives a PROBE or a MINT captures stderr',
  execWithCapture >= 2,
  `${execWithCapture} of ${execCalls} call sites capture; the remainder are git plumbing, whose ` +
  `stderr on failure is a real diagnosis of this run and is meant to surface`);

// ── Arm C — the reader against the spellings its own docstring names ─────────

console.log('\n── arm C: readNumericConstant across real reformattings ─────────');

const scannerSrc = fs.readFileSync(SCANNER, 'utf8');
const CAP_DECL = /const FINGERPRINT_LINE_CAP\s*=\s*[^;]+;/;
const shippedDecl = scannerSrc.match(CAP_DECL)?.[0] ?? '';
check('C', 'the shipped declaration is readable and is the one Round 224 names',
  shippedDecl.includes('50_000'), JSON.stringify(shippedDecl));

/** Splice a spelling into an in-memory copy of the real file. Nothing is written. */
function withSpelling(spelling: string): string {
  return scannerSrc.replace(CAP_DECL, `const FINGERPRINT_LINE_CAP = ${spelling};`);
}
function read(spelling: string): number | 'THROW' {
  try {
    return readNumericConstant(withSpelling(spelling), 'FINGERPRINT_LINE_CAP', 'probe-round225');
  } catch {
    return 'THROW';
  }
}

const TRUE_VALUE = 50000;
const table: Array<[string, string]> = [
  ['50_000', 'the shipped spelling today'],
  ['50000', 'the pre-2026-09-04 spelling'],
  ['5e4', 'the module docstring names this as the same number'],
  ['50 * 1000', 'same value, product spelling'],
  ['0xC350', 'same value, hex'],
  ['50_000 as const', 'a widening-suppression suffix'],
];
const readings = table.map(([spelling, note]) => [spelling, note, read(spelling)] as const);
for (const [spelling, note, got] of readings) {
  measure('C', `${spelling} reads as ${got}`, note);
}

check('C', 'the Round 224 fix works: the shipped separator spelling reads correctly',
  read('50_000') === TRUE_VALUE, `50_000 -> ${read('50_000')}`);
check('C', 'and the pre-2026-09-04 spelling still reads correctly',
  read('50000') === TRUE_VALUE, `50000 -> ${read('50000')}`);

const loudlyWrong = readings.filter(([, , got]) => got === 'THROW').map(([s]) => s);
const silentlyWrong = readings.filter(([, , got]) => got !== 'THROW' && got !== TRUE_VALUE);

// Graded against the module's own stated property, not against a stricter one I would prefer.
// probe-source-constants.mts, "Fail loudly, never partially": *"It will not return a prefix, and
// it anchors on a value terminator so that it cannot match 50 inside 50_000."* The first clause
// is unconditional. `50 * 1000` returns a prefix.
check('C', 'the reader never returns a prefix — its own stated property, unconditionally',
  silentlyWrong.length === 0,
  silentlyWrong.length === 0
    ? `${loudlyWrong.length} spelling(s) throw, 0 return a wrong number`
    : `${silentlyWrong.length} spelling(s) return a PREFIX with no error: ` +
      silentlyWrong.map(([s, , g]) => `${s} -> ${g} (true value ${TRUE_VALUE})`).join(', ') +
      ' — latent today, since the shipped spelling is 50_000; the property is stated without a caveat');

// Was: open('C', 'the published rule is broader than the code that implements it') — the
// docstring said "50000, 50_000 and 5e4 are the same number" and 5e4 threw. Round 226 made the
// code match the rule rather than narrowing the rule, so this is now a check.
check('C', 'the published rule and the code that implements it agree',
  read('5e4') === TRUE_VALUE && read('0xC350') === TRUE_VALUE,
  `5e4 -> ${read('5e4')}, 0xC350 -> ${read('0xC350')}, both ${TRUE_VALUE} — ` +
  `the rule is what the other agents will build the next reader from`);

// ── Arm D — a factor is not a value ──────────────────────────────────────────

console.log('\n── arm D: the unit convention lives in the callers, not the reader ──');

// Round 226 (Daedalus) split this function in two. These arms were written to assert the defect
// was present; per this round's own §1 rule — a precondition that asserts a defect still exists
// dies of its own success — they are inverted here to assert the repair instead. Green until
// someone merges the two conventions back into one function.
const importSrc = fs.readFileSync(IMPORT_TS, 'utf8');
const maxImportDecl = importSrc.match(/const MAX_IMPORT_SIZE\s*=\s*[^;]+;/)?.[0] ?? '';
const maxImportFactor = readLeadingFactor(importSrc, 'MAX_IMPORT_SIZE', 'probe-round225');

measure('D', 'the shipped MAX_IMPORT_SIZE declaration', JSON.stringify(maxImportDecl));
check('D', 'the factor reader returns the leading factor, and the callers multiply it back up',
  maxImportFactor === 50 && maxImportFactor * 1024 * 1024 === 50 * 1024 * 1024,
  `readLeadingFactor -> ${maxImportFactor}; caller computes ${maxImportFactor * 1024 * 1024} bytes — correct`);

const capAsProduct = read('50 * 1000');
check('D', 'the value reader no longer returns a prefix from a product — it throws',
  capAsProduct === 'THROW',
  `FINGERPRINT_LINE_CAP = 50 * 1000 -> ${capAsProduct}; before Round 226 this returned 50, ` +
  `not ${TRUE_VALUE} — no throw, no warning, the 2026-09-04 turncount failure exactly`);

check('D', 'the two unit conventions are now named at the call site, not guessed by the reader',
  (() => {
    try { readNumericConstant(importSrc, 'MAX_IMPORT_SIZE', 'probe-round225'); return false; } catch { return true; }
  })(),
  `readNumericConstant on a product throws and names readLeadingFactor; ` +
  `readLeadingFactor on a bare value throws and names readNumericConstant`);

// The symmetric direction: if the MB constant were ever spelled as a whole number, the three
// callers' own arithmetic is what went wrong. Computed the way they do, not described.
const wholeBytesSrc = importSrc.replace(/const MAX_IMPORT_SIZE\s*=\s*[^;]+;/, 'const MAX_IMPORT_SIZE = 52_428_800;');
let symmetricOutcome: string;
try {
  const f = readLeadingFactor(wholeBytesSrc, 'MAX_IMPORT_SIZE', 'probe-round225');
  symmetricOutcome = `returned ${f}, so the callers would compute ${f * 1024 * 1024} bytes`;
} catch {
  symmetricOutcome = 'THROW';
}
check('D', 'and the symmetric reformatting is loud too — a whole-number MB spelling throws',
  symmetricOutcome === 'THROW',
  `MAX_IMPORT_SIZE = 52_428_800 through readLeadingFactor -> ${symmetricOutcome}; ` +
  `before Round 226 it read as 52428800 and the three callers computed a 50 TB cap ` +
  `for a 50 MB constant, with arm A of each still passing`);

// ── Arm E — the patcher writes a partial substitution and calls it a change ──

console.log('\n── arm E: replaceNumericConstant on a product spelling ──────────');

function patch(spelling: string): string | 'THROW' {
  try {
    return replaceNumericConstant(withSpelling(spelling), 'FINGERPRINT_LINE_CAP',
      'Number.MAX_SAFE_INTEGER', 'probe-round225').match(CAP_DECL)?.[0] ?? '(no declaration)';
  } catch {
    return 'THROW';
  }
}

const patchedSeparator = patch('50_000');
check('E', 'the patcher handles the shipped separator spelling — Round 224\'s second victim, fixed',
  patchedSeparator === 'const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER;',
  String(patchedSeparator));

const patchedProduct = patch('50 * 1000');
const partial = typeof patchedProduct === 'string' && /\* 1000/.test(patchedProduct);
check('E', 'on a product spelling the patch is no longer partial — no operands survive',
  !partial && patchedProduct === 'const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER;',
  `${patchedProduct} — before Round 226 this wrote ` +
  `"const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER * 1000;" and the no-op guard passed it, ` +
  `because that guard asserted the patch changed something rather than that it produced what ` +
  `was asked for. This is a write path into packages/.`);
check('E', 'and the guard now verifies the result against the request, not merely against the input',
  (() => {
    // A substitution that cannot come out as asked must throw rather than write.
    try {
      replaceNumericConstant('const K = not_a_number;', 'K', 'Number.MAX_SAFE_INTEGER', 'probe-round225');
      return false;
    } catch { return true; }
  })(),
  'an unparseable initialiser is refused before any write, not rewritten');

// ── Arm F — the population of source-scraping readers ────────────────────────

console.log('\n── arm F: who else scrapes a constant out of shipped source ─────');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(f, out);
    } else if (/\.(mts|mjs|ts|js)$/.test(e.name)) out.push(f);
  }
  return out;
}

const scriptFiles = walk(SCRIPTS);
const SELF = path.basename(import.meta.filename);
const importers = scriptFiles.filter((f) =>
  path.basename(f) !== SELF &&
  path.basename(f) !== 'probe-source-constants.mts' &&
  fs.readFileSync(f, 'utf8').includes('probe-source-constants'));

measure('F', 'scripts/ files walked (readdirSync, not a glob)', String(scriptFiles.length));
measure('F', `probes reading constants through the shared module — ${importers.length}`,
  importers.map((f) => path.basename(f, '.mts')).sort().join(', '));

// Which shipped constants are spelled with a separator today — the live surface of the rule.
// `dist/` excluded (Round 226): it is gitignored build output, so every source constant also
// appears there as a compiled duplicate. This arm published 4 on a tree with no build present and
// reports 8 on one where someone has run `npm run build` — a count that moves with the machine
// rather than with the code. Source is the shipped surface; the compiled copy is not a second
// place a reader could go wrong.
const pkgFiles = walk(PACKAGES).filter((f) => !/__tests__/.test(f) && !/[/\\]dist[/\\]/.test(f));
const separatorConsts: string[] = [];
for (const f of pkgFiles) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*(\d[\d_]*\d)\s*[;,)]/g)) {
    if (m[2].includes('_')) separatorConsts.push(`${m[1]} = ${m[2]} (${path.relative(REPO, f)})`);
  }
}
measure('F', `shipped constants spelled with a numeric separator today — ${separatorConsts.length}`,
  separatorConsts.join(' · ') || 'none');
open('F', 'the reformatting hazard is live on more than the one constant that fired',
  `Round 224 fixed the readers of FINGERPRINT_LINE_CAP. ${separatorConsts.length} shipped ` +
  `constants use "_" today; each is a reader away from the same failure.`);

// Hand-rolled digit scrapes that remain, reported with the direction they fail in.
const remaining: string[] = [];
for (const f of scriptFiles) {
  if (path.basename(f) === SELF) continue;
  const code = codeOnly(fs.readFileSync(f, 'utf8'));
  code.split('\n').forEach((ln, i) => {
    if (/const\s+[A-Z_][A-Z0-9_]*\s*=?\s*\(?\\d\+\)?/.test(ln) && /match|exec|RegExp|matchAll/.test(ln)) {
      remaining.push(`${path.relative(REPO, f)}:${i + 1}`);
    }
  });
}
measure('F', `hand-rolled "const NAME = (\\d+)" scrapes outside the shared module — ${remaining.length}`,
  remaining.join(' · ') || 'none');

check('F', 'this probe counted its population by walking the tree, not by grepping',
  scriptFiles.length > 0, `${scriptFiles.length} files walked`);

// ── Arm Z (close) ────────────────────────────────────────────────────────────

const fingerprintAfter = packagesFingerprint();
check('Z', 'packages/ is as this run found it — every spelling was spliced in memory',
  fingerprintAfter === fingerprintBefore,
  fingerprintAfter === fingerprintBefore
    ? `content fingerprint identical across the run (porcelain + git-diff content + sha256 of ` +
      `each untracked file). This probe reads and splices in memory; it writes nothing under ` +
      `packages/. Pre-existing dirt, if any, is reported by the MEAS at window open and is not ` +
      `graded here — Round 255 §4, repaired Round 256.`
    : `MOVED during this run.\n        before: ${fingerprintBefore}\n        after:  ${fingerprintAfter}`);

summariseAndExit({ probeName: 'probe-round225', results, skipped });
