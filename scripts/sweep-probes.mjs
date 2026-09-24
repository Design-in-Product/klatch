/**
 * Runs the self-contained probes and records their exit codes.
 *
 * Round 261, Daedalus, 2026-09-23 (STOP fire). Answers Theseus's Round 260 §7 item 2 directly:
 *
 *   > "`probe-round259` runs at all. It was throwing from `27c5cac3` (13:37:58 PT) until I
 *   > repaired it this fire — about ninety minutes, and it was found only because I happened to
 *   > re-run it as a control. A sweep that runs each round's probe and records exit codes would
 *   > have caught it the same fire; I have not built one and am not claiming one exists."
 *
 * He is right that no fleet sweep existed. Adjacent prior art that does:
 * `scripts/verify-verifier-exit-codes.mjs` (Theseus, Round 104) exercises the exit-code matrix of
 * exactly ONE verifier, `verify-premise-render.mjs`. It is the idiom this borrows — an exit code
 * that means the same thing as the ones it checks — not a thing this duplicates.
 *
 * ── Why an explicit partition and not a classifier ──────────────────────────
 *
 * The obvious build is: scan every probe for hazard markers, run the ones that look clean. I wrote
 * that scanner first and measured it before trusting it, and it is not fit for the job:
 *
 *   - `/PORT\b/` matches the word **IMPORT**, so every probe with an import statement scored
 *     "opens a port".
 *   - `/corpus/i` and `/model/i` match PROSE. These probes discuss "the hazard model" and "the
 *     corpus item" in their headers constantly. `probe-round260` scored `corpus` while its own
 *     author reports, and I have re-verified, that it touches no corpus.
 *
 * Of 103 probe files the scanner called 99 hazardous and 4 clean, and it was wrong in both
 * directions. **Rule: what a probe RUNS is not recoverable from what a probe SAYS.** A classifier
 * over source text is a comment-reader wearing a measurement's clothes — the Round 259 lesson
 * ("the sentence above the code was not the code") aimed at a new target.
 *
 * So membership is not inferred. A probe enters SWEPT by having been **run green and reported
 * clean in a fire**, with the memo that attests it named on the entry. That is an observation of
 * the process, not a reading of the file.
 *
 * ── The DEFERRED census pin is the guard, and its reddening is the feature ──
 *
 * SWEPT alone would be an allowlist, and an allowlist goes stale in silence: probe 262 lands, is
 * in no list, is never run, and nothing anywhere says so. So DEFERRED enumerates **every other
 * probe file by name** and the two lists must partition the directory census EXACTLY. A new probe
 * is in neither and the sweep goes red until someone classifies it.
 *
 * That makes this a pinned census that a later round is CERTAIN to move — the shape Theseus's
 * Round 260 §3(c) flagged on my arm G4 edit, and which my own Round 259 §8 left open as
 * undistinguished:
 *
 *   > "nothing distinguishes 'pins a census that should be stable' from 'pins one any later round
 *   > will move'"
 *
 * Here is the distinction, and it is about the pin's PURPOSE, not its content:
 *
 *   - G4's pin encodes a **historical fact** ("the population Round 256 could see"). A later
 *     commit moving it is a FUSE — the pin silently stops meaning what it says.
 *   - This pin encodes an **open obligation** ("every probe has been classified"). A later commit
 *     moving it is a PROMPT — the red is the sweep doing its job, cleared by making a decision,
 *     and the decision is one line.
 *
 * A pin whose red is cleared by RESTATING the number is a fuse. A pin whose red is cleared by
 * DOING something is a gate. Same mechanism, opposite meaning, and the difference is legible only
 * from what clears it.
 *
 * ── What this does not claim ────────────────────────────────────────────────
 *
 * 8 of 103 probes are swept. The other 95 are DEFERRED, not cleared — most of them genuinely do
 * open ports, write databases, walk corpora or make model calls, and sweeping them blindly on a
 * duty-cycle fire would spend money and leak servers. Nothing here has established which. The
 * count is printed on every run so the debt cannot be mistaken for coverage.
 *
 * Usage:
 *   node scripts/sweep-probes.mjs            run the swept set, print the table, exit 1 on any red
 *   node scripts/sweep-probes.mjs --census   partition check only, run nothing
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

/**
 * The swept set. Each entry carries the attestation that put it here — the fire in which it was
 * run and reported self-contained — and the shape its own summary line takes, so a probe that
 * exits 0 while printing nothing recognisable is still caught.
 */
export const SWEPT = [
  {
    file: 'probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    expect: /All 64 regression checks passed/,
    why: 'run every fire as a control by both seats; Theseus 260 §6 reports 64/64',
  },
  {
    file: 'probe-round225-a-citation-is-not-a-call.mts',
    expect: /All 21 regression checks passed/,
    why: 'run every fire as a control by both seats; Theseus 260 §6 reports 21/21',
  },
  {
    file: 'probe-round245-the-shared-lib-coverage-floor.mts',
    expect: /All 4 regression checks passed/,
    why: 'the scripts/lib coverage floor; Theseus 260 §6 reports 4/4, covered 12/14',
  },
  {
    file: 'probe-round256-an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts',
    expect: /All 16 regression checks passed/,
    why: 'Theseus 260 §1 repaired it to delegate to strip-source.mjs and reports 16/16',
  },
  {
    file: 'probe-round257-the-scanner-had-no-model-of-interpolation.mts',
    expect: /All 9 regression checks passed/,
    // Written first as "259 §6 reports 16/16" with `/All \d+ …/` to match, and BOTH halves of that
    // were wrong in the same direction. 16/16 is round256's figure on round257's line; 259 §6 line
    // 162 says `probe-round257` **9/9** (repointed). And `\d+` is a count assertion that cannot
    // fail on a count — the loose regex is what let the wrong prose sit next to a green run. Caught
    // by this sweep's own first run printing 9 where the entry claimed 16.
    why: 'Daedalus 259 §6 reports 9/9 (repointed); no server, port, database or corpus',
  },
  {
    file: 'probe-round258-three-readers-are-two-questions-and-the-shared-one-is-already-in-lib.mts',
    expect: /All 20 regression checks passed/,
    why: 'Theseus 260 §6 reports 20/20 with the round260 file present',
  },
  {
    file: 'probe-round259-the-extraction-moved-nothing-and-closed-the-hole-in-the-file-it-moved-into.mts',
    expect: /All 17 regression checks passed/,
    why: 'the probe whose 90-minute red is the reason this sweep exists; Theseus 260 §4',
  },
  {
    file: 'probe-round260-a-census-pin-has-two-axes-and-the-round-number-in-a-filename-is-not-one-of-them.mts',
    expect: /All 18 regression checks passed/,
    why: 'Theseus 260 §6 reports 18 regression, 6 measurements, 0 skips, exit 0',
  },
  {
    file: 'probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts',
    expect: /All 17 regression checks passed/,
    // The first probe this gate caught was the probe written to drive it. Round 261's own drive
    // landed in `scripts/`, was in neither list, and its own arm F1 went red naming itself — 104
    // files, 1 unclassified. Nothing was wrong; that is the gate doing the one thing it is for,
    // and clearing it took adding these five lines rather than restating a number. The red was a
    // prompt, which is the distinction this file's header claims and had not yet demonstrated.
    why: 'run green in Round 261 (this fire), 17/17 exit 0; fixtures minted under gitignored .testdata/ only',
  },
];

/**
 * Every probe file NOT in the swept set, by name. This is the gate described in the header: it is
 * meant to go red when a probe arrives. Clearing it means deciding whether the new probe is
 * self-contained — not restating the list.
 */
export const DEFERRED = [
  'probe-accepted-multipart-allocation.mts',
  'probe-backfill-entity-sizing.mts',
  'probe-browse-cold-figure-gap.mts',
  'probe-browse-count-vs-persisted-rows.mts',
  'probe-browse-endpoint-second-corpus.mts',
  'probe-browse-endpoint-vs-channel-count.mts',
  'probe-browse-latency-end-to-end.mts',
  'probe-carried-context-carveout-eviction.mjs',
  'probe-carried-context-carveout-truncation.mjs',
  'probe-carried-context-chip.mjs',
  'probe-carried-context-sensitivity.mjs',
  'probe-carried-context.mjs',
  'probe-dedup-resolver-scaling.mts',
  'probe-expand-continuation.mts',
  'probe-fingerprint-cache-endpoint.mts',
  'probe-import-entity-binding.mts',
  'probe-import-large-session.mts',
  'probe-import-live-http.mts',
  'probe-import-multipart-cap.mts',
  'probe-import-sites.mjs',
  'probe-models-live.mjs',
  'probe-multi-root-browse.mts',
  'probe-parse-encoding-confound.mts',
  'probe-parse-stage-allocation.mts',
  'probe-path-c-chat-binding-live.mts',
  'probe-pm-corpus-cap-delta.mts',
  'probe-recall-tool.mjs',
  'probe-round162-preamble-drop-and-roster-live.mts',
  'probe-round164-layer5-terminality-live.mts',
  'probe-round166-terminal-floor-live.mts',
  'probe-round167-floor-report-live.mts',
  'probe-round170-floor-frequency.mts',
  'probe-round171-path-b-jit-import-browser.mts',
  'probe-round172-path-b-confirm-step-redrive.mts',
  'probe-round174-browse-route-seating-in-a-browser.mts',
  'probe-round176-backfill-cli-end-to-end.mts',
  'probe-round177-browse-done-seating-in-a-browser.mts',
  'probe-round178-backfill-operator-error-paths.mts',
  'probe-round179-backfill-flag-spellings-and-undo-errors.mts',
  'probe-round181-unrecognised-flags-and-undo-record-validation.mts',
  'probe-round182-backfill-every-argv-token-is-read.mts',
  'probe-round183-undo-record-against-the-database-it-is-aimed-at.mts',
  'probe-round185-what-the-undo-classifier-knows-a-run-by.mts',
  'probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts',
  'probe-round189-the-restore-wording-on-a-minted-channel.mts',
  'probe-round191-restoring-the-backup-the-way-a-person-does.mts',
  'probe-round192-what-a-wal-beside-the-database-says.mjs',
  'probe-round193-the-printed-steps-run-as-written-and-how-little-use-reopens-h.mts',
  'probe-round194-step-4-quotes-a-line-the-operators-own-command-can-produce.mts',
  'probe-round195-the-check-step-and-the-undo-path-on-a-database-a-bad-restore-corrupted.mts',
  'probe-round196-the-three-commands-after-a-bad-restore-answer-in-the-scripts-voice.mts',
  'probe-round197-the-verdict-on-a-way-back-and-the-path-that-is-not-the-database.mts',
  'probe-round198-a-way-back-has-tables-in-it-and-the-sidecar-is-not-the-database.mts',
  'probe-round199-the-first-real-corpus-names-seven-agents-and-none-of-them-is-a-name.mts',
  'probe-round200-the-guess-declines-where-it-used-to-invent-and-the-window-is-what-does-it.mts',
  'probe-round201-the-window-holds-this-corpus-and-not-the-class-and-the-corpus-has-no-names-in-it.mts',
  'probe-round202-the-grammar-not-the-distance-and-the-only-basis-the-corpus-supports.mts',
  'probe-round203-the-corpus-is-lineages-and-the-sheet-warns-about-one-of-them.mts',
  'probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts',
  'probe-round205-the-plan-and-the-apply-pick-opposite-ends-of-a-duplicated-name.mts',
  'probe-round207-the-import-confirms-a-name-and-the-name-is-not-unique.mts',
  'probe-round213-reassign-live-http.mts',
  'probe-round217-multipart-guard-live-http.mts',
  'probe-round218-hono-routes-introspection.mts',
  'probe-round219-files-cap-live-http.mts',
  'probe-round220-reassign-on-the-march-corpus.mts',
  'probe-round221-probe-ownership-control.mts',
  'probe-round222-port-ownership-hoist.mts',
  'probe-round223-twenty-one-probes-against-a-stranger.mts',
  'probe-round223b-db-existence-is-not-identity.mts',
  'probe-round224b-the-migrated-probes-against-a-stranger.mts',
  'probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts',
  'probe-round230-a-killed-probe-must-not-leave-its-server.mts',
  'probe-round231-the-handler-and-the-signal-are-in-different-processes.mts',
  'probe-round232-the-remainder-verdict-can-go-red.mts',
  'probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts',
  'probe-round240-a-probe-pinned-to-a-moved-subject-is-failing-silently.mts',
  'probe-round241-a-corpus-cast-is-resolved-not-pinned.mts',
  'probe-round242-the-band-selects-bytes-and-arm-a-is-one-row.mts',
  'probe-round244-the-staleness-sweep-walks-one-level-and-the-libs-are-outside-it.mts',
  'probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts',
  'probe-round247-a-mutant-in-the-tree-is-in-the-population.mts',
  'probe-round248-the-dot-guard-is-half-the-repair-and-a-copy-re-admits-the-original.mts',
  'probe-round250-the-drive-was-never-priced-and-the-port-is-one-line-of-product.mts',
  'probe-round251-the-port-lever-mutations.mjs',
  'probe-round252-the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts',
  'probe-round253-the-db-path-mutations.mjs',
  'probe-round253-the-env-file-cannot-reach-the-database-path.mts',
  'probe-round254-the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts',
  'probe-round255-the-comment-shadow-census.mts',
  'probe-round255-the-comment-shadow-mutations.mjs',
  'probe-scan-cost-model-control.mts',
  'probe-scan-latency-vs-cap.mts',
  'probe-scratch-server.mjs',
  'probe-turncount-live-http.mts',
];

/**
 * The directory census. Parameterised on the directory so the partition guard can be DRIVEN
 * against a fixture directory rather than against `scripts/` — a guard that can only be run on
 * the tree it guards cannot be shown to fail, and a guard never shown to fail is prose.
 * Counted with readdirSync, not a glob: a glob has dropped a file from a count on this project.
 */
export const census = (dir) => readdirSync(dir).filter((f) => /^probe-/.test(f)).sort();

/**
 * Partitions a census against the two declared lists. Returns the two ways it can be wrong:
 * `unclassified` (a probe exists that neither list names — the gate) and `missing` (a list names
 * a probe that no longer exists — a rename or deletion the lists did not follow).
 */
export const partition = (files, swept, deferred) => {
  const declared = new Set([...swept, ...deferred]);
  const present = new Set(files);
  return {
    unclassified: files.filter((f) => !declared.has(f)),
    missing: [...declared].filter((f) => !present.has(f)).sort(),
    duplicated: [...swept].filter((f) => deferred.includes(f)).sort(),
  };
};

// ── Runner ──────────────────────────────────────────────────────────────────

/**
 * The per-probe verdict, extracted so it can be driven without spawning anything. Both limbs are
 * load-bearing and neither is redundant:
 *
 *   - exit code alone misses a probe that summarises a skip as a pass — which is the whole finding
 *     `probe-round224` exists to hold, and it is IN the swept set, so a sweep that graded on exit
 *     code alone would be reproducing the defect its own subject was written about;
 *   - the summary line alone misses a probe that prints its tail and then throws on the way out.
 */
export const verdict = (code, out, expect) => ({
  ok: code === 0 && expect.test(out),
  matched: expect.test(out),
  code,
});

const run = (file) => {
  const runner = file.endsWith('.mts') ? ['npx', ['tsx', join('scripts', file)]] : ['node', [join('scripts', file)]];
  const r = spawnSync(runner[0], runner[1], { cwd: REPO, encoding: 'utf8', timeout: 300_000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}`, err: r.error };
};

const main = () => {
  const sweptFiles = SWEPT.map((s) => s.file);
  const files = census(join(REPO, 'scripts'));
  const p = partition(files, sweptFiles, DEFERRED);

  console.log(`sweep-probes — ${files.length} probe files under scripts/`);
  console.log(`  swept:    ${sweptFiles.length}`);
  console.log(`  deferred: ${DEFERRED.length}  (not cleared — most open ports, databases, corpora or model calls)`);
  console.log('');

  let bad = 0;

  if (p.unclassified.length) {
    bad += p.unclassified.length;
    console.log(`CENSUS RED — ${p.unclassified.length} probe(s) in neither list. Classify each: add to`);
    console.log('  SWEPT (with the fire that ran it clean) or to DEFERRED (with nothing else to do yet).');
    for (const f of p.unclassified) console.log(`    unclassified  ${f}`);
    console.log('');
  }
  if (p.missing.length) {
    bad += p.missing.length;
    console.log(`CENSUS RED — ${p.missing.length} declared probe(s) no longer exist (renamed or deleted):`);
    for (const f of p.missing) console.log(`    missing       ${f}`);
    console.log('');
  }
  if (p.duplicated.length) {
    bad += p.duplicated.length;
    console.log(`CENSUS RED — ${p.duplicated.length} probe(s) in BOTH lists:`);
    for (const f of p.duplicated) console.log(`    duplicated    ${f}`);
    console.log('');
  }
  if (!bad) console.log('CENSUS OK — every probe under scripts/ is in exactly one list.');
  console.log('');

  if (process.argv.includes('--census')) {
    console.log(bad ? `census FAILED — ${bad} problem(s)` : 'census PASSED');
    process.exit(bad ? 1 : 0);
  }

  let red = 0;
  for (const s of SWEPT) {
    const { code, out, err } = run(s.file);
    const { ok, matched } = verdict(code, out, s.expect);
    if (!ok) red += 1;
    const summary = err
      ? `spawn error: ${err.message}`
      : matched
        ? (out.match(s.expect) || [''])[0]
        : `exit ${code}, summary line NOT FOUND — ${(out.trim().split('\n').pop() || '(no output)').slice(0, 90)}`;
    console.log(`  ${ok ? 'PASS' : 'RED '}  exit ${String(code).padStart(3)}  ${s.file}`);
    console.log(`          ${summary}`);
  }

  console.log('');
  console.log(`${red || bad ? 'SWEEP FAILED' : 'SWEEP PASSED'} — ${SWEPT.length - red} of ${SWEPT.length} swept probes green, ${bad} census problem(s), ${DEFERRED.length} deferred`);
  process.exit(red || bad ? 1 : 0);
};

if (process.argv[1] && process.argv[1].endsWith('sweep-probes.mjs')) main();
