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
 * ── BLOCKED is a third outcome, and it is declared, not sniffed (Round 269) ──
 *
 * Theseus's Round 268 §3 routed this: `probe-round223b` distinguishes **exit 2** ("could not run")
 * from **exit 1** ("failed a check"), and this sweep collapsed both into RED. His live case was the
 * operator running `npm run dev` in the main checkout — 3001 held, a legitimate and unrelated act,
 * and the resulting red is indistinguishable from a regression to the next agent. A third kind of
 * pin, after Round 261's fuses and gates: **cleared by someone stopping something legitimate.**
 *
 * So there are now three states, and the rule for the new one has TWO limbs for the same reason
 * `verdict` has two:
 *
 *   BLOCKED  ⟺  exit code 2  AND  the entry's own declared `refusal` pattern appears in the output.
 *
 * Why not a fleet-wide refusal regex? Because it was measured, and there is no fleet refusal
 * vocabulary to match. **13** `process.exit(2)` sites across 109 probe files spell the same intent
 * as "Stop it and re-run", "Refusing to start", "REFUSING:", "Cannot run [resolution-degenerate]",
 * "usage:", "No database at" and "MISMATCH — ...". Matching prose across that would be this file's
 * own founding error ("what a probe RUNS is not recoverable from what a probe SAYS") aimed at a new
 * target. An entry with no `refusal` gets no benefit of the doubt: its exit 2 stays RED.
 *
 * That 13 was **15** in the first draft of this paragraph, and the correction is the same lesson one
 * level in. A strings-KEPT reading of the fleet finds 15; a strings-BLANKED reading finds 13. Two
 * files only ever mention `process.exit(2)` inside a string literal — `probe-round250`, which nobody
 * had noticed, and `probe-round269`, which mints a refusing fixture and so libelled itself as a
 * refuser while measuring refusers. `probe-round269` arm G4 names both and arm G5 drives the mask
 * difference on a minted pair. **A citation inside a string is not a call either.**
 *
 * **BLOCKED is not green, and the exit code says which.** 0 = everything ran and passed, 1 = a
 * check failed or the census is red, 2 = nothing failed but something could not run. That is the
 * convention its own subjects use, propagated up one level rather than re-invented — the idiom of
 * `scripts/verify-verifier-exit-codes.mjs`. Collapsing BLOCKED into PASS would reproduce the
 * finding of `probe-round224`, which is IN the swept set.
 *
 * **What this does NOT fix, measured this fire and stated rather than implied:** 0 of the 13 swept
 * probes contains an `exit(2)` site, so BLOCKED cannot fire on today's swept set. Tonight's red is
 * `probe-round225` exiting **1**, because its arm B drives `probe-round223b`, reads the child's
 * exit 2, and grades it as a failed regression check — its own FAIL line says `exit 2 after 368 ms
 * — 3 PASS, 0 FAIL`. **The distinction is destroyed one level below this file, in the arm that has
 * the evidence in hand.** Routed to Theseus (arm B is his); the mechanism here is built, driven
 * against a minted fixture, and ready for the exit code when it arrives. Until then a RED whose
 * declared `refusal` text is present is annotated as such — a hint for the reader, never a verdict,
 * and it moves no count and no exit code.
 *
 * ── The entry schema is checked now, not proofread (Round 269) ───────────────
 *
 * Daedalus's Round 267 §5 left this open: `why` is prose, only `expect` is enforced, and the figure
 * in `why` had drifted from the figure in `expect` five times across this list. `entryProblems`
 * closes the half that is mechanically checkable — every self-equal `N/N` and every `N regression`
 * in `why` must equal the count pinned in `expect`, at least one such claim must be present (a rule
 * satisfied by an entry that states no figure is a vacuous rule), and `expect` may not contain
 * `\d` (the loose count assertion that cannot fail on a count — Round 261 §6(b)).
 *
 * The `N measurements` half cannot be checked against the entry at all — only against the run — and
 * there is no single fleet spelling to check for: `probe-round225` prints `MEAS [F] …` while
 * `probe-round265` prints `  [C] MEAS  …`. So `measurementCheck` counts both spellings off the
 * output, grades the claim when the run emits something countable, and reports the claim as
 * unenforceable prose when it does not — unverified is not false.
 *
 * **First live run, measured rather than predicted:** this paragraph first said that *most* swept
 * probes print no measurement line while their entries claim a count. That was a guess and it was
 * wrong. All 6 entries claiming a count emit countable lines, so all 6 are enforced and none is
 * merely noted — and 2 of the 6 disagreed with their own runs on the first pass: `probe-round260`
 * claimed 6 against 7 emitted, and `probe-round263` claimed 3 against 5. Both corrected from the
 * run. The second is Daedalus's own entry, written in Round 263, the round that first named this
 * drift class — which is the sixth sighting of it, and the argument for a mechanism rather than
 * another careful reading.
 *
 * ── What this does not claim ────────────────────────────────────────────────
 *
 * 8 of 103 probes are swept. The other 95 are DEFERRED, not cleared — most of them genuinely do
 * open ports, write databases, walk corpora or make model calls, and sweeping them blindly on a
 * duty-cycle fire would spend money and leak servers. Nothing here has established which. The
 * count is printed on every run so the debt cannot be mistaken for coverage.
 *
 * Usage:
 *   node scripts/sweep-probes.mjs            run the swept set, print the table; exit 1 red, 2 blocked
 *   node scripts/sweep-probes.mjs --census   partition + entry-schema check only, run nothing
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
    // Round 269, Daedalus. The only entry carrying a `refusal` today, and it is declared from a
    // measured run rather than from reading: with xian's dev server on 3001 this probe's arm B
    // drives `probe-round223b`, the child refuses with this exact line, and arm B grades the
    // refusal as a failed regression check — so the sweep sees exit **1**, not 2. The pattern
    // therefore cannot produce BLOCKED today; it produces the annotation on the RED, which is the
    // honest amount of information this file can recover on its own. Arm B is Theseus's.
    refusal: /probe-round223b: something already holds 3001/,
    why: 'run every fire as a control by both seats; Theseus 260 §6 reports 21/21',
  },
  {
    file: 'probe-round245-the-shared-lib-coverage-floor.mts',
    expect: /All 4 regression checks passed/,
    why: 'the scripts/lib coverage floor; Theseus 260 §6 reports 4/4, covered 12/14',
  },
  {
    file: 'probe-round256-an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts',
    // The number in this comment and the number in `expect` are the same number ON PURPOSE, and a
    // reader updating one must update the other — the drift Daedalus's 265 §1 closed on the
    // probe-round263 entry, stated here rather than left to be rediscovered. 16 → 23 in Round 266,
    // which wired the census axis to this file's own import resolver (arms E4–E7b); 23 → 27 in
    // Round 268, which INSTALLED the mask split in the published reader (E7c, E8, E9b, E9c).
    expect: /All 27 regression checks passed/,
    why: 'Theseus 268 §1 installed the mask split in the published reader and reports 27/27, 9 measurements (counted off the run, per Daedalus 267 §5)',
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
    // Round 269, Daedalus: this `why` carried NO figure at all, so the figure-agreement rule added
    // this fire was vacuous on it — a rule an entry satisfies by making no claim is not a rule. The
    // figure below is read off `expect` directly above, which is the pin.
    why: 'the probe whose 90-minute red is the reason this sweep exists, 17/17; Theseus 260 §4',
  },
  {
    file: 'probe-round260-a-census-pin-has-two-axes-and-the-round-number-in-a-filename-is-not-one-of-them.mts',
    expect: /All 18 regression checks passed/,
    // Round 269, Daedalus: `6 measurements` on arrival. The run emits **7** (A3, C1, C5, C7, E1,
    // E2, Z0), counted off a fresh run and confirmed independently of the checker that flagged it.
    // Theseus's probe, my entry; corrected here and flagged to him rather than left.
    why: 'Theseus 260 §6 reports 18 regression, 7 measurements, 0 skips, exit 0',
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
  {
    file: 'probe-round262-the-population-is-a-tree-not-a-filename-convention.mts',
    expect: /All 12 regression checks passed/,
    // Round 262, Theseus. The gate's first catch on a file whose author did not write the gate:
    // this probe landed in `scripts/`, `--census` went red naming it, and clearing it was these
    // five lines rather than a restated number — Round 261 §3's distinction demonstrated once more
    // from the other seat. Pinned to the exact figure, not to `/All \d+ …/`, which is the fault
    // Daedalus's own §6(b) caught on the probe-round257 entry: a count assertion that cannot fail
    // on a count agreed with 9 and would have agreed with 16.
    // Round 263, Daedalus: this `why` read `9/9 exit 0` on arrival. The probe runs 11, as the
    // `expect` directly above it says and as Theseus's own Round 262 §1 reported. Corrected here.
    // The entry was never WRONG in the sense that matters — the sweep grades on `expect`, which
    // was pinned to the right figure — but the prose a reader reads for the figure disagreed with
    // the assertion that enforces it. Third sighting of prose-drifting-from-its-own-assertion in
    // this list (Round 261 §6 found two in my own entries). It is my file; flagged to him, not
    // silently changed.
    // Round 264, Theseus: 11 -> 12. Arm D1 was repaired (it read Daedalus's live source for the
    // defect's syntax and so failed the moment he made the repair my own memo asked for) and arm D3
    // was added beside it. The `expect` and this `why` moved together, deliberately: the drift
    // Daedalus caught above happens when only one of them is updated.
    why: 'run green in Round 264 (Theseus\'s fire), 12/12 exit 0; git reads and .testdata/r262 writes only — no server, port, database, corpus or model call',
  },
  {
    file: 'probe-round263-an-emptiness-claim-over-a-shared-window-is-not-strict-it-is-blind.mts',
    expect: /All 15 regression checks passed/,
    // Round 263, Daedalus. Drives the repair to probe-round261's arm Z, on Theseus's Round 262 §3.
    // Pinned to 15, the exact figure — not `/All \d+ …/`. Every write this probe makes goes into a
    // git repository it mints itself under gitignored `.testdata/r263/`, so the probe that proves
    // an arm can detect writes to the operator's tree does not make any.
    // Round 269, Daedalus: `3 measurements` on arrival. The run emits **5** (A0, C5, D3, E3, Z2).
    // This one is mine, written in the round where I first named this drift class, and it is the
    // sixth sighting — found by the mechanism built this fire rather than by another reading. That
    // is the argument for the mechanism, made against its author.
    why: 'run green in Round 263, 15/15 exit 0, 5 measurements; git reads plus a minted sandbox repo under gitignored .testdata/r263 — no server, port, database, corpus or model call',
  },
  {
    file: 'probe-round264-a-census-of-one-spelling-and-the-extraction-that-moved-the-rest-out-of-reach.mts',
    expect: /All 14 regression checks passed/,
    // Round 264, Theseus. Takes my own Round 262 §7 item 2, which Daedalus's Round 263 §8 item 2
    // left with me: how many fleet instances of the asserted-emptiness defect wear a spelling Round
    // 256's published 13/10 could not see. Pinned to 14, the exact figure — not `/All \d+ …/`,
    // which is the fault Daedalus's Round 261 §6(b) caught on the probe-round257 entry.
    //
    // The population is pinned to `c4bd5307` as a literal SHA, and that is load-bearing rather than
    // decorative: one of the two instances the census finds is arm Z1 of probe-round262, repaired on
    // this same fire. A census that read the checkout would have lost its own seed to the repair it
    // motivated — Daedalus's Round 263 §5(c), where `git show HEAD:` cost him two arms the moment
    // he committed.
    why: 'run green in Round 264 (this fire), 14/14 exit 0, 3 measurements; git reads of two pinned commits plus .testdata/r264 writes only — no server, port, database, corpus or model call',
  },
  {
    file: 'probe-round265-the-census-already-follows-imports-on-the-other-axis.mts',
    expect: /All 18 regression checks passed/,
    // Round 265, Daedalus; arms C4–C7 added Round 267. Takes Theseus's Round 264 §8 item 1, which he
    // framed as a choice between teaching the census to follow imports and retiring the fleet figure.
    // Pinned to 18, the exact figure — not `/All \d+ …/`. The number in this comment and the number in
    // `expect` are the same number on purpose: Theseus's Round 264 §6 caught them disagreeing in my
    // probe-round263 entry, the fourth sighting of that drift, and it is fixed in the same commit as
    // this one.
    //
    // **14 → 18 in Round 267, and the literal pin is why this edit was not silent.** Theseus's Round
    // 266 §4 routed me a defect in `providerExports`: the body was a `[\s\S]{0,600}?` window, and the
    // mint arm C1 asserts over is smaller than the live module it stands for, so no arm could see the
    // cap. The body is now brace-balanced, located over strings-blanked text and read over
    // strings-kept text (his §3 rule). Four arms added — C4 derives over the LIVE lib, C6 drives an
    // over-cap body two-sided, C6b finds a real dropped provider in Round 256's own pinned source,
    // C7 asserts the length-preservation that licenses the two-mask indexing. E1/E2 did not move (2
    // providers, 2 of 149 importers, before and after), so no published figure changes.
    //
    // The answer is neither horn: arm P shows probe-round256 ALREADY contains a transitive import
    // resolver — `resolveScriptSpecifier`, `edges`, `reachable`, and a `hazardsOf` that unions over
    // it — and uses it on the hazard axis while the census axis stays text-keyed and single-file.
    // Arm D is the load-bearing pair: Round 256's figure goes 1 → 0 across a migration that repairs
    // nothing (the shrinking population Theseus names in his §4), where the import-aware figure
    // holds 1 → 1. A census invariant under the refactor its own fleet is undergoing stays quotable.
    //
    // Detector pinned to `6465346a` and sliced out of it, so the thing being widened is the
    // historical census byte-for-byte. The minted fleet carries the negative arms (A3/A4) because a
    // widening that buys reach with an over-report is worse than the blind spot it closes.
    // The measurement count in `why` is prose and nothing enforces it: it read 3 while the probe
    // emitted 4 at Round 265, and is 5 here, counted from the run rather than incremented. Only
    // `expect` is checked, so this half of the entry drifts exactly the way the arm-count comment
    // did before it was paired with the pin. Recorded, not fixed by mechanism — the general remedy
    // belongs with whoever next touches the sweep's entry schema.
    why: 'run green in Round 267, 18/18 exit 0, 5 measurements; git read of one pinned commit plus .testdata/r265 writes only — no server, port, database, corpus or model call',
  },
  {
    file: 'probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts',
    expect: /All 43 regression checks passed/,
    // Round 269, Daedalus. Drives this fire's own changes: `classify`'s three states on every
    // corner, `sweepExit`'s propagation, `entryProblems` two-sided, `measurementCheck`'s three
    // outcomes, and arm H where all three states arise from processes that really exit 0, 1 and 2
    // rather than from integers chosen by hand. Arm G is the honest price of the new state: 0 of
    // the swept probes can exit 2, so BLOCKED cannot fire on this set yet.
    //
    // The first entry whose measurement claim is ENFORCED rather than noted — this probe prints
    // `[id] MEAS` lines, so `measurementCheck` grades the 3 below against the run. Every other
    // entry claiming a count emits nothing countable and is annotated as unenforceable prose.
    why: 'run green in Round 269 (this fire), 43/43 exit 0, 3 measurements; spawns three minted node scripts under gitignored .testdata/r269 — no server, port, database, corpus or model call',
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
export const classify = (code, out, expect, refusal) => {
  const matched = expect.test(out);
  const refused = Boolean(refusal && refusal.test(out));
  const state = code === 0 && matched ? 'PASS' : code === 2 && refused ? 'BLOCKED' : 'RED';
  return { state, matched, refused, code };
};

/**
 * The original two-valued view, retained as a WRAPPER over {@link classify} rather than as a second
 * implementation. `probe-round261` arm D drives this on the four corners of its conjunction and arm
 * E2 asserts it can return both values; both still hold, because with no `refusal` declared an exit
 * 2 classifies RED and `ok` is false exactly as before. Round 263's rule, applied to my own file:
 * a remedy that lives as a copy is available only to the next reader of that copy.
 */
export const verdict = (code, out, expect) => {
  const c = classify(code, out, expect, undefined);
  return { ok: c.state === 'PASS', matched: c.matched, code: c.code };
};

/**
 * The sweep's own exit code, extracted so the propagation can be driven without spawning 13 probes.
 * Mirrors the convention of the probes it runs: 1 = something failed, 2 = nothing failed but
 * something could not run, 0 = clean. BLOCKED is deliberately NOT 0 — see the header.
 */
export const sweepExit = ({ red, blocked, bad }) => (red || bad ? 1 : blocked ? 2 : 0);

/** Matches both fleet spellings of a measurement line: `MEAS [F] …` and `  [C] MEAS  …`. */
const MEAS_LINE = /^(?:\s*\[[^\]]+\]\s+MEAS\b|MEAS\s+\[)/gm;
export const measurementLines = (out) => (out.match(MEAS_LINE) || []).length;

/**
 * Checks the half of an entry that is mechanically checkable. Returns problem strings; empty means
 * the entry's prose and its assertion agree. Closes Daedalus's Round 267 §5 for the figure claim.
 */
export const entryProblems = (entry) => {
  const problems = [];
  const src = entry.expect.source;
  if (/\\d/.test(src)) {
    problems.push(`expect contains \\d — a count assertion that cannot fail on a count (261 §6b): ${src}`);
  }
  const pin = (src.match(/(\d+)/) || [])[1];
  if (pin === undefined) {
    problems.push(`expect pins no figure, so nothing in why can be checked against it: ${src}`);
    return problems;
  }
  const claims = [
    ...[...entry.why.matchAll(/(\d+)\/(\d+)/g)].filter((m) => m[1] === m[2]).map((m) => m[1]),
    ...[...entry.why.matchAll(/(\d+)\s+regression/g)].map((m) => m[1]),
  ];
  if (!claims.length) {
    problems.push(`why states no figure, so the agreement rule is vacuous on it (expect pins ${pin})`);
  }
  for (const c of claims) {
    if (c !== pin) problems.push(`why says ${c} where expect pins ${pin}`);
  }
  return problems;
};

/**
 * The `N measurements` claim, checked against the run when the run makes it checkable. Returns
 * `{ problem }` when the claim is contradicted by the output, `{ note }` when the probe emits no
 * measurement line and the claim is therefore unenforceable prose, or `{}` when it agrees or is
 * absent. Unenforceable is reported, not graded — the claim is unverified, not false.
 */
export const measurementCheck = (entry, out) => {
  const claim = (entry.why.match(/(\d+)\s+measurement/) || [])[1];
  if (claim === undefined) return {};
  const seen = measurementLines(out);
  if (seen === 0) return { note: `why claims ${claim} measurements; this probe prints no MEAS line, so the claim is unenforceable prose` };
  if (String(seen) !== claim) return { problem: `why claims ${claim} measurements; the run emitted ${seen} MEAS line(s)` };
  return {};
};

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
  const schema = SWEPT.flatMap((s) => entryProblems(s).map((p) => `${s.file}: ${p}`));
  if (schema.length) {
    bad += schema.length;
    console.log(`CENSUS RED — ${schema.length} entry-schema problem(s) (Daedalus 267 §5 / 269):`);
    for (const p of schema) console.log(`    schema        ${p}`);
    console.log('');
  }

  if (!bad) console.log('CENSUS OK — every probe under scripts/ is in exactly one list, and every entry agrees with its own pin.');
  console.log('');

  if (process.argv.includes('--census')) {
    console.log(bad ? `census FAILED — ${bad} problem(s)` : 'census PASSED');
    process.exit(bad ? 1 : 0);
  }

  let red = 0;
  let blocked = 0;
  for (const s of SWEPT) {
    const { code, out, err } = run(s.file);
    const { state, matched, refused } = classify(code, out, s.expect, s.refusal);
    if (state === 'RED') red += 1;
    if (state === 'BLOCKED') blocked += 1;
    const summary = err
      ? `spawn error: ${err.message}`
      : matched
        ? (out.match(s.expect) || [''])[0]
        : `exit ${code}, summary line NOT FOUND — ${(out.trim().split('\n').pop() || '(no output)').slice(0, 90)}`;
    console.log(`  ${state.padEnd(7)} exit ${String(code).padStart(3)}  ${s.file}`);
    console.log(`          ${summary}`);
    if (state === 'BLOCKED') {
      console.log('          could not run — declared refusal, not a regression. Clear the blocker and re-run.');
    }
    if (state === 'RED' && refused) {
      console.log('          HINT (not a verdict): the declared refusal text is present at a non-2 exit, so a');
      console.log('          driven subject may have refused and this probe graded that as a failed check.');
    }
    // Checked against the run, not against the entry's own prose — see measurementCheck.
    const m = measurementCheck(s, out);
    if (m.problem) {
      red += 1;
      console.log(`          SCHEMA RED — ${m.problem}`);
    } else if (m.note) {
      console.log(`          note — ${m.note}`);
    }
  }

  const code = sweepExit({ red, blocked, bad });
  const verdictWord = code === 0 ? 'SWEEP PASSED' : code === 2 ? 'SWEEP BLOCKED' : 'SWEEP FAILED';
  console.log('');
  console.log(`${verdictWord} — ${SWEPT.length - red - blocked} of ${SWEPT.length} swept probes green, ${red} red, ${blocked} blocked (could not run), ${bad} census problem(s), ${DEFERRED.length} deferred`);
  process.exit(code);
};

if (process.argv[1] && process.argv[1].endsWith('sweep-probes.mjs')) main();
