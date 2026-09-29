/**
 * Round 224 — a probe that skipped its way to zero checks must not report success
 *
 * ## The subject
 *
 * `scripts/lib/probe-outcome.mts`, written this fire in answer to Theseus's Round 223 §3:
 * `probe-browse-endpoint-vs-channel-count` printed `All regression checks passed; 1
 * measurements recorded.` and exited 0 on a run where every port-dependent arm was skipped
 * because a stranger held 3001. `probe-turncount-live-http` printed `0/0 checks passed` and
 * exited 0 on the same run.
 *
 * ## What this control asserts, and the rule it obeys
 *
 * Round 222 adopted: **for any check of the form "X refuses Y", I must be able to say what
 * would have made it accept, and the control must put the run in that state.** Two of my four
 * Round 222 mutations survived the first version of that round's control precisely because it
 * only ever staged the refusing state. So arm A drives the accepting state first:
 *
 *   - **A — it accepts.** Checks ran, none skipped, none failed → exit 0, and the word
 *     "passed" IS printed. This is the state that would have made a refusal wrong. Without
 *     this arm, a `summarise` that returned code 3 unconditionally would score a clean sweep.
 *   - **B — the staged defect.** ≥1 check passed, ≥1 arm skipped → exit 3, and "passed" is
 *     NOT printed. This is Theseus's `browse-endpoint` case exactly.
 *   - **C — the vacuous run.** Zero checks, zero skips → exit 3. `turncount`'s `0/0 checks
 *     passed`: nothing was skipped in the recorded sense, the arms simply never fired, and a
 *     summary over the empty set still cannot go red.
 *   - **D — a failure dominates a skip.** A failed check plus a skip → exit 1, not 3. A
 *     partial run that also broke something must show the louder code.
 *   - **E — the escape hatch does not leak.** `inapplicable` entries are reported and do NOT
 *     force 3, and are not silently counted as skips. Since Round 294 arm E also holds the
 *     module's declared caller list to the one that actually exists, in both directions —
 *     see the comment at the check itself for why it no longer pins an absence.
 *
 * ## Arm F — the mutation arms, and why they are here
 *
 * A control that only exercises the fixed code cannot tell you the fix is load-bearing. Arm F
 * re-implements the two summary tails as they stood at `HEAD~` and asserts that each one
 * **reports success on arm B's input** — the defect reproduced in this file, from the shape of
 * the old code rather than from a recollection of it. If a future edit makes the new module
 * behave like the old tails, arm B goes red and arm F stays green, and the pair localises it.
 *
 * ## Arm G — the four migrated probes still have exactly one place that prints "passed"
 *
 * A source-level check, and the weakest arm here: it reads bytes, not behaviour. It exists
 * because the defect's mechanism was a hand-written tail in each probe, and the regression
 * shape is someone adding a second summary line above the shared call. Counted with
 * `readdirSync` + explicit reads, never a glob — Round 222 caught `grep` dropping a file from
 * glob results three times in one session.
 *
 * Run:  npx tsx scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts
 *
 * Zero model calls. No server, no port, no DB, no corpus: `summarise` is a pure function and
 * this control drives it directly rather than scraping a subprocess's stdout. `packages/` is
 * untouched, asserted at exit.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { summarise, summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { readNumericConstant, readLeadingFactor } from './lib/probe-source-constants.mts';
import { stripSource } from './lib/strip-source.mjs';

const REPO = path.resolve(import.meta.dirname, '..');
const PROBE = 'probe-round224-a-skip-must-not-summarise-as-a-pass';

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'MEAS' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];

const PACKAGES_BEFORE = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });

const ok = (arm: string, check_: string): ProbeVerdict => ({ arm, check: check_, pass: true, kind: 'regression' });
const bad = (arm: string, check_: string): ProbeVerdict => ({ arm, check: check_, pass: false, kind: 'regression' });
const meas = (arm: string): ProbeVerdict => ({ arm, check: 'a measurement', pass: true, kind: 'measurement' });

// ── Arm A — the accepting state: what would have made a refusal wrong ─────────

{
  const o = summarise({ probeName: 'subject', results: [ok('X', 'one'), ok('Y', 'two'), meas('Z')], skipped: [] });
  check('A', 'a clean run with checks and no skips exits 0', o.code === 0, `code ${o.code}`);
  check('A', 'and that is the ONLY state in which "passed" is printed', /passed/.test(o.headline),
    JSON.stringify(o.headline));
  check('A', 'the measurement is not counted as a hard check', o.ran === 2, `ran=${o.ran} (2 regression, 1 measurement)`);
}

// ── Arm B — Theseus's browse-endpoint case, staged ────────────────────────────

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('V', 'a port-independent conclusion'), meas('V')],
    skipped: ['[R] needs a free port 3001 and a readable corpus', '[S] needs a free port 3001 and a readable corpus'],
  });
  check('B', 'a run with a skip does NOT exit 0', o.code !== 0, `code ${o.code}`);
  check('B', 'it exits 3 — ran, established less than it set out to', o.code === 3, `code ${o.code}`);
  check('B', 'the headline does not contain the word "passed"', !/passed/.test(o.headline),
    JSON.stringify(o.headline));
  check('B', 'the summary NAMES the skips rather than aggregating over what remains',
    o.reasons.length === 2 && o.reasons.every((r) => r.startsWith('did not run: ')),
    `${o.reasons.length} reason(s): ${JSON.stringify(o.reasons)}`);
  check('B', 'and the check that DID run is still reported, not discarded', o.ran === 1, `ran=${o.ran}`);
}

// ── Arm C — turncount's `0/0 checks passed` ───────────────────────────────────

{
  const o = summarise({ probeName: 'subject', results: [], skipped: [] });
  check('C', 'zero checks and zero skips still does not exit 0', o.code === 3, `code ${o.code}`);
  check('C', 'no "passed" over the empty set', !/passed/.test(o.headline), JSON.stringify(o.headline));
  check('C', 'the reason given is the vacuity itself, not a missing arm',
    o.reasons.length === 1 && /zero regression checks ran/.test(o.reasons[0]),
    JSON.stringify(o.reasons));
  // The measurement-only run is the same shape one layer over: Round 215's rule.
  const m = summarise({ probeName: 'subject', results: [meas('J'), meas('K')], skipped: [] });
  check('C', 'a run of measurements ONLY is also inconclusive (Round 215, one layer over)',
    m.code === 3 && m.ran === 0, `code ${m.code}, ran=${m.ran}`);
}

// ── Arm D — a failure dominates a skip ────────────────────────────────────────

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('H', 'fine'), bad('I', 'broke')],
    skipped: ['[K] needs a free port'],
  });
  check('D', 'a failed check exits 1 even on a partial run', o.code === 1, `code ${o.code}`);
  check('D', 'the failure is named', o.failed.length === 1 && o.failed[0].arm === 'I',
    `${o.failed.length} failed: ${o.failed.map((f) => f.arm).join(',')}`);
  check('D', 'and the skip is still reported, not swallowed by the failure',
    o.reasons.some((r) => /did not run/.test(r)), JSON.stringify(o.reasons));
  check('D', 'the headline does not say "passed"', !/passed/.test(o.headline), JSON.stringify(o.headline));
}

// ── Arm E — the `inapplicable` escape hatch does not leak ─────────────────────

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('A', 'one')],
    inapplicable: ['[G] this corpus genuinely contains no instance'],
  });
  check('E', 'an inapplicable arm does NOT force 3', o.code === 0, `code ${o.code}`);
  check('E', 'but it is still reported, distinctly from a skip',
    o.reasons.length === 1 && o.reasons[0].startsWith('not applicable: '), JSON.stringify(o.reasons));
  const both = summarise({
    probeName: 'subject',
    results: [ok('A', 'one')],
    skipped: ['[R] needs a free port'],
    inapplicable: ['[G] no instance in this corpus'],
  });
  check('E', 'one real skip alongside an inapplicable still forces 3', both.code === 3, `code ${both.code}`);
  // Round 247: two repairs to this scan, both found by driving it rather than reading it.
  //
  //   1. `!n.startsWith('.')` — a dot-prefixed mutant copy is a mutation harness's working file,
  //      not a caller. Without this, every harness that stages a copy under `scripts/` perturbs
  //      the population this arm measures, and the arm reddens on file presence alone. Prior art
  //      and the same spelling: `probe-round240-…:123`.
  //   2. comment-stripping — arm I below learned in Round 225 that a citation is not a call, and
  //      this arm, in the same file, never got the lesson. Driven 2026-09-21: a file whose only
  //      occurrence of the hatch is inside a `//` comment reddened this check. Any memo-adjacent
  //      probe that merely NAMES the hatch would have been reported as using it.
  const namesTheHatch = (src: string) => src
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .some((l) => /inapplicable:/.test(l));
  // Round 294: this arm used to assert `callers.length === 0`, pinning probe-outcome.mts's
  // "No caller uses this yet (2026-09-17)". That is a pin on an ABSENCE, and the absence was
  // never the property worth protecting — it ended, correctly, the first time two probes used
  // the hatch for exactly what it was built for (round291 2026-09-29, round292 the same day).
  // The pin's real job was keeping the module's docstring honest, so it now does that directly:
  // the declared caller list and the measured one must agree, in BOTH directions. A new caller
  // reddens it (the doc is behind); a deleted one reddens it too (the doc is ahead). Neither
  // red can be cleared by waiting, and both name the file.
  const OUTCOME_LIB = path.join(REPO, 'scripts', 'lib', 'probe-outcome.mts');
  const measuredCallers = fs.readdirSync(path.join(REPO, 'scripts'))
    .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'))
    .filter((n) => n !== `${PROBE}.mts`)
    .filter((n) => namesTheHatch(fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8')))
    .map((n) => n.replace(/\.(mts|mjs)$/, '').replace(/^(probe-round\d+[a-z]?)-.*$/, '$1'))
    .sort();
  const declaredLine = fs.readFileSync(OUTCOME_LIB, 'utf8')
    .split('\n').find((l) => /INAPPLICABLE-CALLERS:/.test(l));
  const declaredCallers = (declaredLine ?? '')
    .replace(/^.*INAPPLICABLE-CALLERS:\s*/, '')
    .split(',').map((s) => s.trim()).filter(Boolean).sort();
  const listsAgree = (declared: string[] | undefined, measured: string[]) =>
    declared !== undefined
    && declared.length === measured.length
    && declared.every((c, i) => c === measured[i]);

  check('E', 'the hatch\'s declared caller list matches the callers that actually exist',
    listsAgree(declaredLine === undefined ? undefined : declaredCallers, measuredCallers),
    declaredLine === undefined
      ? `no INAPPLICABLE-CALLERS: line in ${path.relative(REPO, OUTCOME_LIB)} — the doc side of this arm was deleted`
      : `declared [${declaredCallers.join(', ')}] · measured [${measuredCallers.join(', ')}]`);

  // The comparison above is only worth having if it can go red. Driven on shapes this tree
  // does not currently produce, so that the green above is a result and not a tautology —
  // the same reason arm F re-implements the old summary tails rather than trusting them.
  check('E', 'KNOWN POSITIVE: a doc that is BEHIND the code reddens it',
    !listsAgree(['probe-round291'], ['probe-round291', 'probe-round292']),
    'a caller added without a doc edit is caught');
  check('E', 'KNOWN POSITIVE: a doc that is AHEAD of the code reddens it',
    !listsAgree(['probe-round291', 'probe-round292'], ['probe-round291']),
    'a caller deleted without a doc edit is caught — the direction the old emptiness pin could not see');
  check('E', 'KNOWN POSITIVE: a deleted doc line reddens it',
    !listsAgree(undefined, []),
    'the arm cannot be cleared by removing the thing it reads');
  check('E', 'and it is green on agreement, including on the empty population it used to assert',
    listsAgree([], []) && listsAgree(['a', 'b'], ['a', 'b']),
    'agreement passes at both the empty and the populated shape');
  check('E', 'and that scan is not vacuous — it still sees the live call in this file',
    namesTheHatch(fs.readFileSync(path.join(REPO, 'scripts', `${PROBE}.mts`), 'utf8')),
    'this probe passes the hatch on line ~153 in live code, and the comment-stripped scan finds it');
}

// ── Arm H — a skipped OPEN-ITEM arm must not redden the exit ──────────────────
//
// My own error, caught by driving rather than by reading. The first version of this module
// treated every skip alike, so `probe-turncount-live-http` on a FREE port — all 5 regression
// checks passing — exited 3 because arm J, an open item, skipped for want of a corpus
// exercising the line cap. That probe's own convention: an open item must not redden an exit,
// "because a red exit on a known-open item trains everyone to ignore the exit code."
//
// This is Theseus's Round 223 §6.2 error ("it counted SKIP as a conclusion") made one layer up,
// inside the module written to fix what he found there.

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('H', 'live'), ok('I', 'contract')],
    skipped: [{ label: '[J] no session exceeds the line cap — untestable on this corpus', kind: 'open' }],
  });
  check('H', 'a skipped OPEN-ITEM arm alongside passing regression checks exits 0', o.code === 0, `code ${o.code}`);
  check('H', 'and it is still reported — reported, not counted', o.reasons.length === 1 && /not a hard check/.test(o.reasons[0]),
    JSON.stringify(o.reasons));
  check('H', 'the regression count is unaffected by the soft skip', o.ran === 2, `ran=${o.ran}`);

  // The discrimination must be real in both directions, or the tag is just a way to silence a skip.
  const hard = summarise({
    probeName: 'subject',
    results: [ok('H', 'live'), ok('I', 'contract')],
    skipped: ['[H] needs a FREE port 3001'],
  });
  check('H', 'an UNTAGGED skip of the same shape still exits 3 — the default stays safe', hard.code === 3,
    `code ${hard.code}`);
  const tagged = summarise({
    probeName: 'subject',
    results: [ok('H', 'live')],
    skipped: [{ label: '[H] needs a FREE port 3001', kind: 'regression' }],
  });
  check('H', 'and an explicitly regression-tagged skip exits 3 too', tagged.code === 3, `code ${tagged.code}`);
  const mixed = summarise({
    probeName: 'subject',
    results: [ok('H', 'live')],
    skipped: [{ label: '[J] open item', kind: 'open' }, '[I] needs a FREE port'],
  });
  check('H', 'one hard skip among soft ones still forces 3', mixed.code === 3,
    `code ${mixed.code}; reasons ${JSON.stringify(mixed.reasons)}`);
  check('H', 'and a soft skip cannot rescue a vacuous run',
    summarise({ probeName: 's', results: [], skipped: [{ label: '[J] open', kind: 'open' }] }).code === 3,
    'zero hard checks is still inconclusive whatever the skips were');
}

// ── Arm F — the OLD tails, re-implemented, report success on arm B's input ────
//
// Verbatim shape of what stood at HEAD~, not a paraphrase:
//   browse-endpoint:  const failed = results.filter(r => !r.pass && r.kind === 'regression');
//                     if (failed.length) { …; process.exit(1); }
//                     console.log('All regression checks passed; …');   // exit 0
//   turncount:        console.log(`${passed.length}/${results.length} checks passed`);
//                     if (regressions.length) { …; process.exit(1); }
//                     process.exit(0);

function oldBrowseEndpointTail(rs: ProbeVerdict[]): { code: number; line: string } {
  const failed = rs.filter((r) => !r.pass && r.kind === 'regression');
  if (failed.length) return { code: 1, line: `${failed.length} regression check(s) failed.` };
  return { code: 0, line: 'All regression checks passed; N measurements recorded.' };
}
function oldTurncountTail(rs: ProbeVerdict[]): { code: number; line: string } {
  const regressions = rs.filter((r) => !r.pass && r.kind === 'regression');
  const passed = rs.filter((r) => r.pass);
  const line = `${passed.length}/${rs.length} checks passed`;
  return regressions.length ? { code: 1, line } : { code: 0, line };
}

{
  const armBInput = [ok('V', 'a port-independent conclusion'), meas('V')];
  const oldA = oldBrowseEndpointTail(armBInput);
  check('F', "the OLD browse-endpoint tail exits 0 and says 'passed' on arm B's input — the defect, reproduced here",
    oldA.code === 0 && /passed/.test(oldA.line), `exit ${oldA.code}: ${JSON.stringify(oldA.line)}`);

  const oldC = oldTurncountTail([]);
  check('F', "the OLD turncount tail prints '0/0 checks passed' and exits 0 on arm C's input",
    oldC.code === 0 && oldC.line === '0/0 checks passed', `exit ${oldC.code}: ${JSON.stringify(oldC.line)}`);

  // The mutations must not be vacuous: the old tails and the new module have to actually
  // DISAGREE on these inputs and AGREE where the old code was right.
  const newB = summarise({ probeName: 's', results: armBInput, skipped: ['[R] needs a free port'] });
  check('F', 'old and new disagree on the skipped run — 0 vs 3', oldA.code === 0 && newB.code === 3,
    `old ${oldA.code}, new ${newB.code}`);
  const failInput = [ok('H', 'fine'), bad('I', 'broke')];
  const oldFail = oldBrowseEndpointTail(failInput);
  const newFail = summarise({ probeName: 's', results: failInput });
  check('F', 'and they AGREE on a plain failure — the old tail was not wrong about everything',
    oldFail.code === 1 && newFail.code === 1, `old ${oldFail.code}, new ${newFail.code}`);
  const cleanInput = [ok('X', 'one')];
  check('F', 'and they AGREE on a clean run',
    oldBrowseEndpointTail(cleanInput).code === 0 && summarise({ probeName: 's', results: cleanInput }).code === 0,
    'both 0');
}

// ── Arm G — one place per probe prints "passed" ───────────────────────────────

{
  const MIGRATED = [
    'probe-browse-endpoint-vs-channel-count.mts',
    'probe-turncount-live-http.mts',
    'probe-browse-latency-end-to-end.mts',
    'probe-import-live-http.mts',
  ];
  for (const f of MIGRATED) {
    const p = path.join(REPO, 'scripts', f);
    check('G', `${f} exists`, fs.existsSync(p), p);
    const src = fs.readFileSync(p, 'utf8');
    const lines = src.split('\n');
    const offenders = lines
      .map((l, i) => ({ l, n: i + 1 }))
      .filter(({ l }) => /console\.log\(/.test(l) && /checks passed|regression checks passed/.test(l));
    check('G', `${f} has no hand-written "checks passed" summary line`, offenders.length === 0,
      offenders.length === 0
        ? 'the only summary comes from summariseAndExit'
        : offenders.map((o) => `:${o.n} ${o.l.trim()}`).join(' | '));
    check('G', `${f} calls summariseAndExit`, /summariseAndExit\(/.test(src),
      `import present: ${/probe-outcome\.mts/.test(src)}`);
  }

  // The population statement, from readdirSync — never a glob. Dot-prefixed files are excluded
  // (Round 247): they are mutation-harness working copies, not members of the population.
  const all = fs.readdirSync(path.join(REPO, 'scripts'))
    .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'));
  // NORMALISED in Round 290, and the repair was forced by this arm going red on a COMMENT.
  //
  // This predicate used to run over raw source. Measured on `sweep-probes.mjs` at the commit before
  // the repair: `checks passed` was present ONLY in comments and `summariseAndExit(` was absent, so
  // two of its three terms were already satisfied by prose — the file sat ONE WORD away from a red
  // that had nothing to do with its behaviour. Adding a census comment containing the word "SKIP"
  // supplied that word and turned the arm red.
  //
  // Comments blanked, STRINGS KEPT (`stripSource(src, false)`): a hand-rolled summary line is a
  // string literal, so blanking strings would be the smaller-number failure in the other direction —
  // the detector would stop finding real offenders. Round 289 §4 measured that exact cost at two
  // files on a sibling detector.
  //
  // Third instance of one mechanism (Round 288 §3, Round 289 §4): not a regex written wrong, but a
  // correct regex applied to un-normalised input, where prose gets a vote.
  const normalised = (n: string): string =>
    stripSource(fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8'), false);
  const isHandRolled = (src: string): boolean =>
    /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);

  const stillHandRolled = all
    .filter((n) => n !== `${PROBE}.mts`)
    .filter((n) => isHandRolled(normalised(n)));
  check('G', 'no script under scripts/ still pairs a SKIP channel with a hand-rolled "checks passed"',
    stillHandRolled.length === 0, stillHandRolled.length ? stillHandRolled.join(', ') : `${all.length} scripts scanned`);

  // The detector's own known positive and known negative, driven on synthetic source rather than on
  // the population — so the normalisation above is shown to preserve the catch it exists for, and
  // not merely to have silenced a red.
  const OFFENDER = [
    'const skips = [];',
    'if (!port) skips.push("SKIP [R] needs a port");',
    'console.log(`${n}/${m} checks passed`);',
    'process.exit(0);',
  ].join('\n');
  const COMMENT_ONLY = [
    '// A note about how a SKIP used to summarise as "checks passed" before the migration.',
    'summarise({ probeName: "x", results });',
  ].join('\n');
  check('G', 'KNOWN POSITIVE: the normalised predicate still flags a real hand-rolled SKIP summary',
    isHandRolled(stripSource(OFFENDER, false)),
    'a synthetic offender whose SKIP and "checks passed" are both in CODE');
  check('G', 'KNOWN NEGATIVE: and no longer flags a file whose only hits are in a comment',
    !isHandRolled(stripSource(COMMENT_ONLY, false)),
    'the shape that reddened this arm in Round 290');

  check('G', 'and that scan was not vacuous — it finds the migrated four when the exemption is lifted',
    all.filter((n) => {
      const src = normalised(n);
      return /SKIP/.test(src) && /summariseAndExit\(/.test(src);
    }).length >= 4,
    'the SKIP+summary population is reachable by this scan', 'measurement');
}

// ── Arm I — the constant reader, and the 2026-09-04 reformatting that beat five ──
//
// Found while driving arm F of the 224b sweep: `probe-browse-latency-end-to-end` came back
// NOT ESTABLISHED with zero contact, and the cause was not the port at all — it throws at
// startup, and has since 2026-09-04, because `FINGERPRINT_LINE_CAP` became `50_000` and its
// regex was `(\d+);`. `probe-turncount-live-http` read the SAME constant with `(\d+)` (no
// terminator) and got `50`. Same change, same day; one probe died loudly and one ran quietly
// with a cap 1000× too small. Both are staged here against the real source bytes.

{
  const scannerSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/import/session-scanner.ts'), 'utf8');
  const importSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/import.ts'), 'utf8');

  check('I', 'the shipped cap really is written with a numeric separator today',
    /const FINGERPRINT_LINE_CAP = 50_000;/.test(scannerSrc),
    'the staging condition for this whole arm; if this fails the arm below proves nothing');

  const cap = readNumericConstant(scannerSrc, 'FINGERPRINT_LINE_CAP', 'arm I');
  check('I', 'the shared reader gets 50000 from `50_000`', cap === 50_000, `read ${cap}`);

  // The two old regexes, verbatim, against the same real bytes.
  const oldStrict = scannerSrc.match(/const FINGERPRINT_LINE_CAP = (\d+);/);
  check('I', "browse-latency's OLD regex finds nothing — it threw at startup", oldStrict === null,
    'match === null, which its next line turned into a throw: dead since 2026-09-04');
  const oldLoose = scannerSrc.match(/const FINGERPRINT_LINE_CAP = (\d+)/);
  check('I', "turncount's OLD regex silently returns 50 — a cap 1000x too small", oldLoose?.[1] === '50',
    `matched ${JSON.stringify(oldLoose?.[1])} out of "50_000"`);
  check('I', 'so the two failure modes are genuinely different, from one reformatting',
    oldStrict === null && oldLoose?.[1] === '50' && cap === 50_000,
    'loud throw vs silent wrong value vs correct read');

  // The reader must not itself be capable of the silent-prefix failure.
  check('I', 'the reader refuses to return a prefix — it anchors on a value terminator',
    (() => {
      try { return readNumericConstant('const X = 50_000;', 'X', 't') === 50_000; } catch { return false; }
    })(), 'const X = 50_000; -> 50000, never 50');
  for (const [src, want] of [['const X = 50000;', 50_000], ['const X = 50_000;', 50_000],
    ['const X=7,', 7], ['const X = 12 )', 12]] as const) {
    check('I', `reader handles ${JSON.stringify(src)}`, readNumericConstant(src, 'X', 't') === want,
      `-> ${readNumericConstant(src, 'X', 't')}, want ${want}`);
  }
  // Round 226 split the product case out: `const X = 50 * 1024 * 1024;` used to read as 50 through
  // this same function, which is what let `FINGERPRINT_LINE_CAP = 50 * 1000` read as 50 as well.
  // The value reader now throws on a product and the factor reader answers it.
  check('I', 'a product declaration no longer reads as its leading factor through the value reader',
    (() => { try { readNumericConstant('const X = 50 * 1024 * 1024;', 'X', 't'); return false; } catch { return true; } })(),
    'readNumericConstant throws on `50 * 1024 * 1024` — Round 225 arm D/226');
  check('I', 'and the factor reader answers it', readLeadingFactor('const X = 50 * 1024 * 1024;', 'X', 't') === 50,
    `readLeadingFactor -> ${readLeadingFactor('const X = 50 * 1024 * 1024;', 'X', 't')}, want 50`);
  check('I', 'and it throws rather than guessing when the constant is gone',
    (() => { try { readNumericConstant('const Y = 1;', 'X', 't'); return false; } catch { return true; } })(),
    'a missing constant is a throw, not a fallback — probe-accepted-multipart-allocation used to ' +
    'fall back to a hardcoded 50 MB, which its own sibling refuses to do in a comment');

  check('I', 'MAX_IMPORT_SIZE still reads correctly through the shared reader',
    readLeadingFactor(importSrc, 'MAX_IMPORT_SIZE', 'arm I') === 50, 'routes/import.ts -> 50 (MB)');
  check('I', 'MAX_IMPORT_SIZE is NOT separator-written today — those three probes were latent, not broken',
    /const MAX_IMPORT_SIZE = 50 \* 1024 \* 1024;/.test(importSrc),
    'stated so nobody reads this round as having fixed three live failures; it fixed two', 'measurement');

  // Population statement, readdirSync not glob (Round 222: grep dropped a file 3x in one session).
  // The first version of this scan reported three files and all three were FALSE POSITIVES: it
  // matched the `// Was match(/… (\d+) …/)` comments recording the old regex in the two probes
  // I had just repaired, plus arm I above, which quotes both old regexes in live code on
  // purpose. A scan that cannot tell a citation from a call would have had the next reader
  // "fixing" a comment. Comment lines are stripped, and this file is named as the one place
  // the old patterns legitimately appear as code.
  // Round 247 adds the other half of the same lesson: a dot-prefixed copy of THIS file is a
  // harness artefact, and the name-based exemption below cannot see it. Driven 2026-09-21 — two
  // verbatim dot-copies, zero mutation, and this arm plus arm E went red on file presence alone.
  const isComment = (l: string) => /^\s*(\/\/|\*|\/\*)/.test(l);
  const all = fs.readdirSync(path.join(REPO, 'scripts'))
    .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'));
  const blindIn = (n: string) => fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8')
    .split('\n').filter((l) => !isComment(l)).filter((l) => /match\(\/.*=\s*\(\\d\+\)/.test(l));
  const stillBlind = all.filter((n) => n !== `${PROBE}.mts`).filter((n) => blindIn(n).length > 0);
  check('I', 'no script under scripts/ still scrapes a numeric constant with a separator-blind regex',
    stillBlind.length === 0,
    stillBlind.length
      ? stillBlind.map((n) => `${n}: ${blindIn(n)[0].trim()}`).join(' | ')
      : `${all.length} scripts scanned (comments stripped), 0 blind outside this control`);
  check('I', 'and the comment-stripping did not make the scan vacuous — this control still trips it',
    blindIn(`${PROBE}.mts`).length >= 2,
    `arm I quotes ${blindIn(`${PROBE}.mts`).length} old regexes in live code, and the scan sees them`);
  const migrated = all.filter((n) => /probe-source-constants\.mts/.test(fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8')));
  check('I', 'and the scan is not vacuous — the five migrated readers are reachable by it',
    migrated.length >= 5, `${migrated.length} scripts import the shared reader: ${migrated.join(', ')}`);
}

// ── Exit ──────────────────────────────────────────────────────────────────────

const PACKAGES_AFTER = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });
check('Z', 'packages/ untouched by this run', PACKAGES_AFTER === PACKAGES_BEFORE,
  PACKAGES_AFTER === PACKAGES_BEFORE ? 'identical git status before and after' : `before ${JSON.stringify(PACKAGES_BEFORE)} after ${JSON.stringify(PACKAGES_AFTER)}`);

console.log('\n─── summary ───');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'MEAS' : 'FAIL'} [${r.arm}] ${r.check}`);

// This control eats its own cooking.
summariseAndExit({ probeName: PROBE, results, skipped });
