/**
 * probe-round374b — **the hole Round 373 §4 named and declined is closed: `probe-round225` reaches
 * `RED` + declared-skip ITSELF, driven, without a byte changed in the control.**
 *
 * Round 373's live half minted a child through the real `summariseAndExit` and proved the
 * RED-plus-declared-skip state reachable **through the shared outcome module**. It said plainly that
 * it had not proved `probe-round225` reaches it, and Daedalus declined that drive for a stated
 * reason: "the only way I can see to get it is to break a check in the probe we both use as a
 * control every fire. I did not do it." That restraint was right.
 *
 * There is another route he did not name: drive round225's **source** from a gitignored sandbox with
 * its one path constant and two relative import specifiers rewritten, so that the copy reads the
 * real tree, mints into the real `.testdata`, and drives the real child probe exactly as the real
 * file does — and break one check THERE. The control is never touched. Each of the four anchors is
 * asserted to occur exactly once BEFORE anything is replaced (Round 347), and the break is a single
 * `>` flipped to `<` in one check's comparison, asserted to be the only difference between the two
 * copies, including their byte length.
 *
 * Both drives happen on a `:3001` held on the wildcard by this process and released in it, read
 * through the real library (`scripts/lib/probe-server-ownership.mts`) both ends — no `kill`, nothing
 * for anyone to reap, and the release confirmed rather than assumed. A bind on `127.0.0.1` would
 * answer FREE against a real wildcard occupant, which is the defect that library exists to hold.
 *
 * **Two-sided on the break, which is what makes it a reading rather than an anecdote.** Same source,
 * same sandbox, same held port, one comparison apart:
 *
 *   - unbroken → exit **3**, `classify` → BLOCKED, `skipped: true`, the row carrying the skip
 *     VERDICT wording. This is the control: it is the same row Round 373's held-port sweep read out
 *     of a real sweep for the real file, so the copy is faithful.
 *   - one check broken → exit **1** (not 3 — the failure limb dominates, as Round 373's B1 found
 *     through its minted child), carrying exactly one declared `did not run:` label, `classify` →
 *     **RED refused=false skipped=true**, and the row carrying the HINT Round 373 added and neither
 *     verdict phrase (Round 372 B8, kept for the third round).
 *
 * **DEFERRED on its merits, not merely on arrival.** This file calls `server.listen`, so
 * `promote-probes.mts` classifies it a `net` hazard and refuses to sweep it — correctly: a swept
 * probe that binds `:3001` would make every sweep an occupant of the port, and would fail for any
 * operator with a dev server running. The consequence is stated rather than left implied: **nothing
 * in the sweep will report it if this file starts failing.** Which is why the durable half of Round
 * 374 — the pin on Round 373's B4 literal — is NOT in here but in
 * `probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts`, which
 * is hazard-clean and swept. This file is the reading; that file is the guard.
 *
 * NOT claimed: that the real `probe-round225` has ever reached this state in a live sweep. It has
 * not. The honest word stays **latent** — Round 372's word, for the third round running — because a
 * live sweep printing it needs a held port and a real regression at the same moment. What this round
 * changes is that "latent" now means unobserved rather than unreached. Nor is a sandbox copy claimed
 * to be the same artefact as the file: it is round225's source with three lines rewritten, each one
 * named and asserted individually below rather than waved at in bulk.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import {
  aWildcardBindWouldSucceed,
  portAcceptsAConnection,
  somethingIsAlreadyAnswering,
  trackedNetServer,
} from './lib/probe-server-ownership.mts';
import { SWEPT, classify, probeRowAnnotations } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const SANDBOX = join(REPO, '.testdata', 'round374b');
const PORT = 3001;

const results: ProbeVerdict[] = [];
const skipped: string[] = [];
const measurements: string[] = [];
const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

/** Round 372 B8, kept for the third round: a hint must carry neither verdict phrase. */
const VERDICT_PHRASE = ['could not run', 'ran but did not finish'] as const;
const SKIP_HINT = 'a declared hard skip is present at a non-3 exit';
const SKIP_VERDICT = 'ran but did not finish';

const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r225 = SWEPT.find((s) => s.file === R225)!;
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

mkdirSync(SANDBOX, { recursive: true });

const REPO_ANCHOR = "const REPO = path.resolve(import.meta.dirname, '..');";
const IMPORT_CONSTANTS = "from './lib/probe-source-constants.mts';";
const IMPORT_OUTCOME = "from './lib/probe-outcome.mts';";
const BREAK_ANCHOR = 'scriptFiles.length > 0,';
const rewriteCounts = [REPO_ANCHOR, IMPORT_CONSTANTS, IMPORT_OUTCOME, BREAK_ANCHOR].map((a) =>
  occurrences(r225Src, a),
);
check(
  'B0',
  `each of the four anchors occurs exactly once in the subject's source (${rewriteCounts.join('/')}) ` +
    '— the three path rewrites that make the copy read the real tree, and the one check the break ' +
    'below flips. Asserted BEFORE mutating, because a `String.replace` on a string that occurs ' +
    'twice silently edits the wrong one (Round 347)',
  rewriteCounts.every((n) => n === 1),
);

const faithfulCopy = r225Src
  .replace(REPO_ANCHOR, `const REPO = ${JSON.stringify(REPO)};`)
  .replace(IMPORT_CONSTANTS, `from ${JSON.stringify(join(HERE, 'lib', 'probe-source-constants.mts'))};`)
  .replace(IMPORT_OUTCOME, `from ${JSON.stringify(join(HERE, 'lib', 'probe-outcome.mts'))};`);
const brokenCopy = faithfulCopy.replace(BREAK_ANCHOR, 'scriptFiles.length < 0,');
check(
  'B0b',
  'the broken copy differs from the faithful one by exactly the one comparison this arm declared, ' +
    'byte length included — so the second drive below is attributable to one broken check and not ' +
    'to the sandboxing',
  brokenCopy !== faithfulCopy &&
    occurrences(brokenCopy, BREAK_ANCHOR) === 0 &&
    occurrences(brokenCopy, 'scriptFiles.length < 0,') === 1 &&
    brokenCopy.length === faithfulCopy.length,
);

const readPort = async (label: string) => {
  const answering = await somethingIsAlreadyAnswering(PORT);
  const accepts = await portAcceptsAConnection(PORT);
  const bindable = await aWildcardBindWouldSucceed(PORT);
  const line = `${label} answering=${answering === null ? 'null' : 'SOMETHING'} · acceptsConnection=${accepts} · wildcardBindWouldSucceed=${bindable}`;
  console.log(`       ${line}`);
  return { answering, accepts, bindable, line };
};

const drive = (src: string, name: string) => {
  const p = join(SANDBOX, name);
  writeFileSync(p, src, 'utf8');
  const r = spawnSync('npx', ['tsx', p], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 600_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

const before = await readPort('BEFORE');
if (before.accepts || before.answering !== null) {
  // A hard SKIP and not a failed check: the reading is simply unavailable on a machine where
  // someone else owns the port, and grading it would make this probe's verdict a function of
  // machine state rather than of code (Round 366 — a rate is wrong when the variable is machine
  // state). The declared label is what makes the skip legible to `classify` one level up.
  skipped.push(
    'arm B: the two held-port drives of the round225 copy — something already holds :3001, so this ' +
      "cell cannot be the only occupant and the reading would be about someone else's server. " +
      `Free port 3001 and re-run. (${before.line})`,
  );
  console.log('SKIP [B] :3001 is already occupied — the held-port drives need to own the port.');
  console.log('         operator action: free port 3001 (this is usually a live "npm run dev").');
} else {
  const { server, closeBounded } = trackedNetServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', () => resolve());
    server.listen(PORT); // the wildcard, which is the address a real dev server binds
  });
  const held = await portAcceptsAConnection(PORT);
  check(
    'B1',
    `the port is really HELD by this process on the wildcard (acceptsConnection=${held}) — ` +
      'without this the two drives below would both be free-port drives and the whole arm would be ' +
      'measuring nothing while reporting green',
    held === true,
  );

  const control = drive(faithfulCopy, 'copy-of-round225-faithful.mts');
  const controlC = classify(control.status, control.out, r225.expect, r225.refusal, r225.skip);
  meas(
    'B2m',
    `the faithful copy on a held :3001 — exit ${String(control.status)}, classify ` +
      `${controlC.state} refused=${controlC.refused} skipped=${controlC.skipped}`,
  );
  check(
    'B2',
    'the copy is FAITHFUL, which is what makes the next drive a reading rather than an anecdote: ' +
      'unbroken, on the held port, it exits 3 and the real `classify` against the real registry ' +
      'patterns calls it BLOCKED with the declared skip — the same row Round 373 read out of a ' +
      'real held-port sweep for the real file',
    control.status === 3 && controlC.state === 'BLOCKED' && controlC.skipped === true,
  );
  check(
    'B2b',
    "and its row carries the SKIP verdict wording, keyed on the exit-3 limb — Round 372's key, " +
      'reproduced here through a drive of the subject rather than through a constructed tuple',
    probeRowAnnotations(controlC).join('\n').includes(SKIP_VERDICT),
  );

  const broken = drive(brokenCopy, 'copy-of-round225-one-check-broken.mts');
  const brokenC = classify(broken.status, broken.out, r225.expect, r225.refusal, r225.skip);
  const labelLines = broken.out
    .split('\n')
    .filter((l) => l.includes('did not run:') && l.search(r225.skip!) >= 0);
  meas(
    'B3m',
    `the same copy with one \`>\` flipped to \`<\`, same held port — exit ${String(broken.status)}, ` +
      `${labelLines.length} declared \`did not run:\` line(s), classify ${brokenC.state} ` +
      `refused=${brokenC.refused} skipped=${brokenC.skipped}`,
  );
  check(
    'B3',
    'ROUND 373 §4 CLOSED: `probe-round225` reaches the RED-plus-declared-skip state ITSELF. One ' +
      'broken check on a held port is exit 1 (not 3 — the failure limb dominates, as Round 373 B1 ' +
      'found through a minted child) carrying exactly one declared `did not run:` label, and the ' +
      'real `classify` against the real registry calls it RED refused=false skipped=true',
    broken.status === 1 &&
      labelLines.length === 1 &&
      brokenC.state === 'RED' &&
      brokenC.skipped === true &&
      brokenC.refused === false,
  );
  check(
    'B4',
    'and the leg Round 373 added is what the sweep would print beside it: the row carries the skip ' +
      'hint and neither verdict phrase, so the annotation the shipped sweep had nothing to say ' +
      'about now has a witness in the POPULATION and not only in a minted child',
    (() => {
      const row = probeRowAnnotations(brokenC).join('\n');
      return row.includes(SKIP_HINT) && VERDICT_PHRASE.every((p) => !row.includes(p));
    })(),
  );
  check(
    'B5',
    'TWO-SIDED on the break: same source, same sandbox, same held port, one comparison apart — ' +
      `exit ${String(control.status)}/${controlC.state} unbroken and ` +
      `exit ${String(broken.status)}/${brokenC.state} broken. So the state is attributable to the ` +
      'broken check and not to the port, the copy, or the sandbox',
    control.status !== broken.status && controlC.state !== brokenC.state,
  );

  const closed = await closeBounded(5000);
  console.log(`       RELEASED closeBounded -> ${closed}`);
  const after = await readPort('AFTER');
  check(
    'B6',
    'the port this arm bound is released and read FREE again through the real library ' +
      `(closeBounded -> ${closed}) — the release confirmed rather than assumed, and nothing left ` +
      'for anyone to reap',
    closed === 'closed' && after.accepts === false && after.answering === null && after.bindable === true,
  );
}

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round374b', results, skipped });
