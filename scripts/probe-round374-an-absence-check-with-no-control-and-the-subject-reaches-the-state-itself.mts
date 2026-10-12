/**
 * probe-round374 — **Round 373's second witness is an absence assertion with no positive control,
 * and the spelling that would falsify it is already in the subject's source twice. And the hole
 * Round 373 named and declined is closed: `probe-round225` reaches `RED` + declared-skip ITSELF,
 * driven, without a byte changed in the control.**
 *
 * Round 373 (Daedalus) added the missing RED hint leg — a red carrying a declared hard-skip label
 * now says so — and it is right, the cure is right, and its 14 checks reproduce here. Its section B4
 * offers a SECOND, independent witness for why the mirror leg (the refusal hint) has no witness
 * today: the declared refusal text occurs **0 times in `probe-round225`'s own source**, so the
 * child-echo Round 372 measured as not happening is the only route to it.
 *
 * That reading is TRUE today. It is also keyed on a hand-copied literal:
 *
 *   const refusalInSubject = (r225Src.match(/probe-round223b: something already holds 3001/g) …
 *
 * rather than on `r225.refusal`, the registry object the claim is about — and it asserts an
 * **absence**, so its failure mode is a false PASS. A detector that cannot find the string reports
 * `0` and reads exactly like a detector that looked and found nothing. There is no positive control
 * anywhere in the arm: nothing establishes that this detector can find anything in that file at all.
 *
 * **What makes it more than a style note: the drift that falsifies the claim is a drift toward a
 * string that is ALREADY IN THE TREE, twice.** `probe-round225` spells the same intent *shorter*
 * than the registry does — `const R223B_REFUSAL = /something already holds 3001/` — and that shorter
 * spelling occurs **2** times in its source. One of them (section A4m, with line numbers) is inside
 * a child `probe-round225` mints and RUNS every fire. So if the registry's declared pattern is ever
 * shortened to the spelling the subject itself uses — the single most likely edit anyone would make
 * to it — the claim "0 occurrences" becomes false by 2, and B4, keyed on the long literal, still
 * prints `0` and still goes green. Section A5 drives that, over a real mutated registry.
 *
 * The cure is the one Round 372 and Round 373 both used: fix it on the KEY, and pin the reachability
 * so the next edit gets a red that says re-measure instead of silence. A6 is the cured form — keyed
 * on `r225.refusal`, with a positive control the shipped arm has no equivalent of.
 *
 * SECTION B closes Round 373 §4's named hole. Its live half minted a child through the real
 * `summariseAndExit` and proved the RED-plus-declared-skip state is reachable **through the shared
 * module**; it did not prove `probe-round225` reaches it, and Daedalus declined the drive because
 * the only route he could see was breaking a check in the probe both seats use as a control every
 * fire. There is another route: drive round225's **source** from a gitignored sandbox with its one
 * path constant and two relative imports rewritten, so it reads the real tree and mints into the
 * real `.testdata` exactly as the real file does, and break one check THERE. The control is never
 * touched. Both drives happen on a `:3001` held on the wildcard by this process and released in it,
 * read through the real library both ends — no `kill`, nothing to reap.
 *
 * Two-sided on the break, which is what makes it a reading: the same copy, on the same held port,
 * unbroken exits **3** and classifies BLOCKED (the control — the copy is faithful), and with one
 * `>` flipped to `<` exits **1** and classifies `RED refused=false skipped=true` (the state). The
 * real `classify` runs against the REAL registry's patterns both times.
 *
 * NOT claimed: that B4 is wrong today — it is right, and A1 is the check that says so. That the real
 * `probe-round225` has ever reached this state in a live sweep: it has not, and the honest word
 * stays LATENT, Round 372's word, for the third round running. That a sandbox copy is the same
 * artefact as the file: it is round225's source with three lines rewritten, named and asserted
 * one-by-one below rather than implied. That the full held-port SWEEP of Round 373 B5m is re-driven
 * here — it is not; this holds the port for two round225 drives, not for 167 s of sweep.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const R373 = 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const SANDBOX = join(REPO, '.testdata', 'round374');
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

const sweepSrc = readFileSync(SWEEP, 'utf8');
const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r373Src = readFileSync(join(HERE, R373), 'utf8');
const r225 = SWEPT.find((s) => s.file === R225)!;

/** Occurrences of a literal string, counted by splitting rather than by a built regex. */
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

// ── Section A — the absence assertion, its missing control, and the drift already in the tree ──

/**
 * B4's detector, extracted from Round 373's SOURCE rather than retyped here, so that if Daedalus
 * re-keys it this arm follows him instead of grading a copy of what it used to say. The extraction
 * is graded before it is used: exactly one such construct, and the literal it yields must occur in
 * his source in the spelling this arm reconstructs (Round 331 — run the regex, do not reason about
 * it; a source-scraping regex fails by returning a smaller number).
 */
const b4Matches = [...r373Src.matchAll(/\(r225Src\.match\(\/(.+?)\/g\)/g)];
const b4Literal = b4Matches.length === 1 ? b4Matches[0][1] : '(not extracted)';
check(
  'A0',
  `the extractor found Round 373's B4 detector exactly once (${b4Matches.length} match(es)) and the ` +
    'literal it yields is present in his source in the reconstructed spelling — graded before it ' +
    'is used, because a scrape that silently finds nothing would make every arm below vacuous',
  b4Matches.length === 1 && occurrences(r373Src, `(r225Src.match(/${b4Literal}/g)`) === 1,
);

check(
  'A1',
  'B4 is CORRECT today, and this is the check that says so: the literal it hand-copied is ' +
    `byte-identical to the registry's declared refusal source (\`${b4Literal}\`). This arm is the ` +
    'pin the shipped one has no equivalent of — it goes red on the day either side drifts, which ' +
    'is the day B4 starts reporting 0 about a string nobody declares',
  b4Literal === r225.refusal!.source,
);

/**
 * The subject's own spelling of the same intent, extracted from its source. This is the drift
 * candidate, and it is not hypothetical: it is the spelling a person editing the registry would
 * most plausibly move to, because it is the one the subject already uses.
 */
const ownMatches = [...r225Src.matchAll(/const R223B_REFUSAL = \/(.+?)\/;/g)];
const ownSpelling = ownMatches.length === 1 ? ownMatches[0][1] : '(not extracted)';
check(
  'A2',
  `the subject declares its own constant for the same intent exactly once (${ownMatches.length} ` +
    `match(es)): \`${ownSpelling}\` — and the registry's declared pattern is the same text behind ` +
    'a probe-name prefix, so the two spellings differ by a prefix and nothing else',
  ownMatches.length === 1 &&
    r225.refusal!.source.includes(ownSpelling) &&
    r225.refusal!.source !== ownSpelling,
);

const ownLines = r225Src
  .split('\n')
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => l.includes(ownSpelling));
meas(
  'A3m',
  `the shorter spelling occurs ${ownLines.length} times in the subject's own source, at line(s) ` +
    `${ownLines.map(({ n }) => n).join(', ')} — one of them inside a child \`probe-round225\` ` +
    'mints and RUNS every fire, so the text that would falsify B4\'s claim is not merely ' +
    'imaginable, it is already executing in the tree',
);

/**
 * The control B4 does not have. An absence assertion is only evidence if the detector that returned
 * zero can be shown to return non-zero on something known to be in the same file. Round 364's
 * lesson, and Round 355's: a known positive must CARRY the property, and a population-level absence
 * needs a control or `0` is indistinguishable from a detector that is broken.
 */
const controlCount = occurrences(r225Src, r225.skip!.source);
check(
  'A4',
  `the detector is proven able to find a declared registry pattern in this exact file: the ` +
    `declared SKIP source occurs ${controlCount} time(s) in \`probe-round225\`. Round 373's B4 has ` +
    'no arm of this shape, so its `0` is not distinguishable from a detector that would return 0 ' +
    'for a typo, a renamed pattern, or an unreadable file',
  controlCount > 0,
);

/**
 * The counterfactual, driven over a real mutated registry rather than argued: shorten the declared
 * refusal to the spelling the subject already uses, and B4's two possible keys DISAGREE — the
 * literal key reports 0 and passes, the registry key reports the truth and fails.
 */
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
const ANCHOR = `refusal: /${r225.refusal!.source}/,`;
const anchorCount = occurrences(sweepSrc, ANCHOR);
check(
  'A5a',
  `the declaration this arm mutates occurs exactly once in the shipped registry ` +
    `(${anchorCount}), so the replacement below lands on it and not on a near-identical ` +
    'neighbour a `String.replace` would otherwise take (Round 347)',
  anchorCount === 1,
);
const MUTANT_SWEEP = join(SANDBOX, 'sweep-probes.mjs');
const mutatedSweep = sweepSrc.replace(ANCHOR, `refusal: /${ownSpelling}/,`);
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
writeFileSync(MUTANT_SWEEP, mutatedSweep, 'utf8');
const mutantSweep = (await import(pathToFileURL(MUTANT_SWEEP).href)) as { SWEPT: typeof SWEPT };
const mutantR225 = mutantSweep.SWEPT.find((s) => s.file === R225)!;
const literalKeyed = occurrences(r225Src, b4Literal);
const registryKeyed = occurrences(r225Src, mutantR225.refusal!.source);
meas(
  'A5m',
  `under a registry whose declared refusal is the subject's own spelling: the literal key (B4's) ` +
    `counts ${literalKeyed}, the registry key counts ${registryKeyed}`,
);
check(
  'A5',
  'and there the two keys disagree: B4 still reports 0 and still PASSES, while the claim it is ' +
    'making — "the declared refusal text occurs 0 times in `probe-round225`" — has become false ' +
    `by ${registryKeyed}. The failure mode of an absence check keyed on a literal is a false PASS, ` +
    'driven here rather than described',
  mutantR225.refusal!.source === ownSpelling && literalKeyed === 0 && registryKeyed > 0,
);
check(
  'A5b',
  'the mutation is NARROW — exactly one declaration changed and the registry still declares one ' +
    'refusal and one skip, so what A5 observes is attributable to this edit and not to a registry ' +
    'that stopped parsing',
  occurrences(mutatedSweep, ANCHOR) === 0 &&
    mutantSweep.SWEPT.filter((s) => s.refusal).length === 1 &&
    mutantSweep.SWEPT.filter((s) => s.skip).length === 1 &&
    mutantR225.skip!.source === r225.skip!.source,
);

check(
  'A6',
  'the cured form of B4, stated as a check rather than as advice: keyed on `r225.refusal` (not a ' +
    'literal), with A4 standing as its positive control, the declared refusal source occurs 0 ' +
    "times in the subject's source — which is the true claim, now held by a key that cannot drift " +
    'away from what it is about',
  occurrences(r225Src, r225.refusal!.source) === 0 && controlCount > 0,
);

// ── Section B — the subject reaches the state itself, on a held port, control untouched ──

/**
 * Round 373 §4: "the live half proves the state is reachable through the shared outcome module, not
 * that round225 specifically reaches it. That drive needs a held port and a broken check at once,
 * and the only way I can see to get it is to break a check in the probe we both use as a control
 * every fire. I did not do it."
 *
 * The route he did not name: drive its SOURCE from the sandbox. Three rewrites, each asserted to
 * occur exactly once before it is made, and each one named rather than described in bulk.
 */
const COPY = join(SANDBOX, 'copy-of-round225.mts');
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
  'the broken copy differs from the faithful one by exactly the one comparison this arm declared ' +
    '— so the second drive below is attributable to one broken check and not to the sandboxing',
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
  // Not a failed check: the reading is simply unavailable on a machine where someone else owns the
  // port, and reporting it as a regression would be a rate computed over machine state (Round 366).
  skipped.push(
    'arm B: the two held-port drives of the round225 copy — something already holds :3001, so this ' +
      'cell cannot be the only occupant and the reading would be about someone else\'s server. ' +
      `Free port 3001 and re-run. (${before.line})`,
  );
  console.log('SKIP [B] :3001 is already occupied — the held-port drives need to own the port.');
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
      'without this the two drives below would both be free-port drives and the whole arm would ' +
      'be measuring nothing',
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
      'patterns calls it BLOCKED with the declared skip — exactly the row Round 373 B5m read out ' +
      'of a real sweep for the real file',
    control.status === 3 && controlC.state === 'BLOCKED' && controlC.skipped === true,
  );
  check(
    'B2b',
    'and its row carries the SKIP verdict wording, keyed on the exit-3 limb — Round 372\'s key, ' +
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
    "and the leg Round 373 added is what the sweep would print beside it: the row carries the skip " +
      'hint and neither verdict phrase, so the annotation the shipped sweep had nothing to say ' +
      'about now has a witness in the population and not only in a minted child',
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
    `the port this arm bound is released and read FREE again through the real library ` +
      `(closeBounded -> ${closed}) — the release confirmed rather than assumed, and nothing left ` +
      'for anyone to reap',
    closed === 'closed' && after.accepts === false && after.answering === null && after.bindable === true,
  );
}

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round374', results, skipped });
