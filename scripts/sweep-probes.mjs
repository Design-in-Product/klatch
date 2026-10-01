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
 * So there are now three states, and the rule for the new one is a disjunction of two DECLARED
 * conditions — each with two limbs, for the same reason `verdict` has two:
 *
 *   BLOCKED  ⟺  (exit 2  AND  the entry's declared `refusal` appears in the output)
 *             OR (exit 3  AND  the entry's declared `skip` appears on the run's own
 *                 `did not run: <label>` line)                          ← added in Round 271
 *
 * The second disjunct is Theseus's Round 270 §4. Round 269 shipped only the first and priced it
 * honestly as unreachable; he then repaired `probe-round225`'s arm B and found that the honest exit
 * code is **3, not 2** — `probe-outcome.mts` reserves 2 for "nothing ran and there is a clear
 * operator action", and that probe establishes 32 of its checks before one arm hard-skips. So the
 * distinction Round 269 chased was no longer being destroyed one level down; it was arriving
 * wearing a code the `exit === 2` limb did not admit. **A widening was the remedy, not a rewrite.**
 *
 * Why not a fleet-wide refusal regex? Because it was measured, and there is no fleet refusal
 * vocabulary to match. **13** `process.exit(2)` sites across 109 probe files spell the same intent
 * as "Stop it and re-run", "Refusing to start", "REFUSING:", "Cannot run [resolution-degenerate]",
 * "usage:", "No database at" and "MISMATCH — ...". Matching prose across that would be this file's
 * own founding error ("what a probe RUNS is not recoverable from what a probe SAYS") aimed at a new
 * target. An entry with no `refusal` gets no benefit of the doubt: its exit 2 stays RED.
 *
 * That 13 was **15** in the first draft of this paragraph, and the correction is the same lesson one
 * level in. A strings-KEPT reading of the fleet finds 16 (15 when that draft was written); a
 * strings-BLANKED reading finds 13. Three files only ever mention `process.exit(2)` inside a string
 * literal — `probe-round250`, which nobody had noticed; `probe-round269`, which mints a refusing
 * fixture and so libelled itself as a refuser while measuring refusers; and, since Round 270,
 * `probe-round225`, whose new arm B2 mints five fixtures the same way. `probe-round269` arm G4 names
 * them and arm G5 drives the mask difference on a minted pair. **A citation inside a string is not a
 * call either.**
 *
 * The blanked figure stayed at 13 while the kept figure moved 15 → 16, which is the cheapest
 * possible demonstration that the mask is the part that matters: the fleet gained no new refuser,
 * only a new file that talks about refusing.
 *
 * **BLOCKED is not green, and the exit code says which.** 0 = everything ran and passed, 1 = a
 * check failed or the census is red, 2 = nothing failed but something could not run. That is the
 * convention its own subjects use, propagated up one level rather than re-invented — the idiom of
 * `scripts/verify-verifier-exit-codes.mjs`. Collapsing BLOCKED into PASS would reproduce the
 * finding of `probe-round224`, which is IN the swept set.
 *
 * **The state is now reachable, and this is the first run in which it fired.** Round 269 recorded
 * here that 0 of the swept probes could exit 2, so BLOCKED could not fire on the swept set — true
 * when written, and still true of the exit-2 limb. The exit-3 limb is what reaches it. Live, with
 * 3001 held by the operator's dev server:
 *
 *     BLOCKED exit   3  probe-round225-a-citation-is-not-a-call.mts
 *             INCONCLUSIVE — probe-round225 established 32 of its checks and skipped 1 arm(s).
 *     SWEEP BLOCKED — 13 of 14 swept probes green, 0 red, 1 blocked, 0 census problem(s)
 *
 * and the sweep exits **2**. That same condition was a RED on this file's previous commit. **The
 * red a legitimate `npm run dev` used to produce is no longer indistinguishable from a
 * regression** — which was the whole of Theseus's Round 268 §3, closed across three rounds and two
 * seats, with the decisive repair in his file rather than this one.
 *
 * The exit-2 annotation is retained for the case that motivated it: a RED whose declared `refusal`
 * text is present is annotated as a HINT — never a verdict, moving no count and no exit code.
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

import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { stripSource } from './lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

/**
 * The swept set. Each entry carries the attestation that put it here — the fire in which it was
 * run and reported self-contained — and the shape its own summary line takes, so a probe that
 * exits 0 while printing nothing recognisable is still caught.
 */
export const SWEPT = [
  // ── Round 285, Daedalus, 2026-09-27 (STOP fire). The first three promotions this list has ever
  // received from an instrument rather than from an agent's hand-drive. `scripts/promote-probes.mts`
  // drove each of these twice — real `HOME` and an empty `HOME`, one variable — under a
  // tree-fingerprint bracket AND a population sampler, and printed the entry below; this seat
  // pasted it and is the attestation. The rule the list has always used is unchanged: run green in
  // a named fire, with the fire named. What changed is who did the running.
  //
  // Verbatim from the drive (`.testdata/r285/drive-fixed.txt` and `drive-round244-forced.txt`),
  // figures not retyped:
  //   round241  All 19 regression checks passed · exit 0 both arms · 365/370 ms · 16 samples
  //   round244  All 5 regression checks passed  · exit 0 both arms · 14846/14770 ms · 706 samples
  //   round255  All 3 regression checks passed  · exit 0 both arms · 486/466 ms · 22 samples
  //
  // round244 was reached with `--only round244 --force`. The corrected `homedir` detector flags it,
  // and the flag is a false exclusion: the drive had already observed it green under both HOME arms
  // twice. That is what `--force` is for, and the entry records that it was used rather than hiding
  // it — a reading list that can veto a measurement is a comment with a veto.
  {
    file: 'probe-round241-a-corpus-cast-is-resolved-not-pinned.mts',
    expect: /All 19 regression checks passed/,
    why: 'Round 285 drove it twice via promote-probes.mts (real HOME and an empty HOME, one variable): ' +
      '19/19 green, exit 0 both arms, 365 ms; scripts/ and packages/ fingerprints unchanged and the ' +
      'probe-* population unmoved across 16 samples',
  },
  {
    file: 'probe-round244-the-staleness-sweep-walks-one-level-and-the-libs-are-outside-it.mts',
    expect: /All 5 regression checks passed/,
    why: 'Round 285 drove it twice via promote-probes.mts --force (real HOME and an empty HOME): ' +
      '5/5 green, exit 0 both arms, 14846 ms — the slowest member of this list, and hermetic by ' +
      'observation despite the homedir detector flagging it; population unmoved across 706 samples',
  },
  {
    file: 'probe-round255-the-comment-shadow-census.mts',
    expect: /All 3 regression checks passed/,
    why: 'Round 285 drove it twice via promote-probes.mts (real HOME and an empty HOME, one variable): ' +
      '3/3 green, exit 0 both arms, 486 ms; population and tree unmoved across 22 samples',
  },
  {
    // Round 283, Daedalus, 2026-09-27. The whole measured yield of Theseus's Round 282 §9 design
    // ("four booleans, drive the all-false set") over the classification already in this file:
    // ONE probe. `probe-round283` filters the 114-file population to an 8-probe scanner-clean
    // residue, drives each twice — real HOME and an empty HOME, one variable — and finds 3 that
    // run unattended and report a verdict, of which 2 were already swept. This is the third.
    //
    // Promoted by the rule this list has always used: run green in a named fire, with the fire
    // named. Driven this fire at 15:0x PT, `All 7 regression checks passed`, status 0, in both
    // the real-HOME and empty-HOME arms — so the count below is observed twice, not derived.
    file: 'probe-round232-the-remainder-verdict-can-go-red.mts',
    expect: /All 7 regression checks passed/,
    why: 'Round 283 drove it twice (real HOME and an empty HOME) and it is insensitive to both: ' +
      '7/7 green, status 0, no write to scripts/ or packages/ under a tree-fingerprint bracket',
  },
  {
    file: 'probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    expect: /All 70 regression checks passed/,
    // 64/64 → 66/66 in Round 290: arm G's scan was normalised to ignore comments (it had gone red
    // on one), and the repair brought its own known positive and known negative with it.
    // 66/66 → 70/70 in Round 294: arm E stopped pinning the ABSENCE of `inapplicable` callers —
    // an absence two correct changes ended on 2026-09-29 — and now holds probe-outcome.mts's
    // declared caller list to the measured one in both directions, with three known positives.
    why: 'run every fire as a control by both seats; Daedalus 294 measured 70/70, exit 0',
  },
  {
    file: 'probe-round225-a-citation-is-not-a-call.mts',
    expect: /All 33 regression checks passed/,
    // Round 269, Daedalus; the `refusal` half re-measured in Round 271 after Theseus's d0227c49.
    // The only entry carrying a `refusal` today, and it is declared from a measured run rather
    // than from reading: with xian's dev server on 3001 this probe's arm B drives
    // `probe-round223b` and the child refuses with this exact line.
    //
    // What changed under it: Round 269 measured arm B grading that refusal as a failed check, so
    // the sweep saw exit **1**. Theseus's Round 270 §4 repaired arm B to a hard skip, and the
    // probe now exits **3** — `probe-outcome.mts`'s documented code for "part of the run stands"
    // — because 32 of its checks really do establish. So the pattern still cannot produce
    // BLOCKED, but for a different reason than it could not in 269: not because the distinction
    // is destroyed, but because it now arrives wearing a code the `exit === 2` limb does not
    // admit. That is Round 271 §2 below, and it is why this comment names an exit code at all.
    refusal: /probe-round223b: something already holds 3001/,
    // Round 271, Daedalus. The declared skip label, which is what lets this entry reach BLOCKED on
    // an exit 3. Taken from `probe-round225-…mts:344` verbatim, not paraphrased — the label is the
    // contract, and a pattern written from memory of it would be the prose-matching error again.
    skip: /arm B: the drive of probe-round223b/,
    why: 'run every fire as a control by both seats; Theseus 270 §2 reports 32 established + 1 ' +
      'skipped arm on a HELD port, so 33 regression checks is DERIVED (32 + the skipped drive), ' +
      'not observed — port 3001 was held by xian\'s dev server for the whole of Round 270 and the ' +
      'green branch could not be driven. The first free-port fire confirms or refutes it loudly; ' +
      'the prior pin of 21 re-derives exactly from this run, which is what licenses the ' +
      'arithmetic. The figure is stated in the checkable `N regression` spelling on purpose: as ' +
      'merged in Round 271 this entry stated no self-equal figure at all, and arm E1 went red ' +
      'because the agreement rule was vacuous on it — the rule catching its own author\'s merge ' +
      'one commit after landing.',
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
    expect: /All 51 regression checks passed/,
    // Round 269, Daedalus; extended in Round 271. Drives this fire's own changes: `classify`'s
    // three states on every corner, `sweepExit`'s propagation, `entryProblems` two-sided,
    // `measurementCheck`'s three outcomes, and arm H where all three states arise from processes
    // that really exit 0, 1 and 2 rather than from integers chosen by hand.
    //
    // Round 271 added arm J (8 checks, 43 → 51): the exit-3 limb and `diagnosisLine`, driven
    // through a fixture that calls the REAL `summariseAndExit` rather than one that prints a
    // plausible exit-3 transcript. J1 asserts the fixture's exit code separately from the limb
    // under test, and earned that separation immediately — the first version used `ok` where
    // `ProbeVerdict` has `pass`, so it exited 1 and would otherwise have reddened J2 for a reason
    // that had nothing to do with `classify`.
    //
    // The first entry whose measurement claim is ENFORCED rather than noted — this probe prints
    // `[id] MEAS` lines, so `measurementCheck` grades the 3 below against the run. Every other
    // entry claiming a count emits nothing countable and is annotated as unenforceable prose.
    why: 'run green in Round 271, 51/51 exit 0, 3 measurements; spawns minted node scripts under gitignored .testdata/r269 — no server, port, database, corpus or model call',
  },
  {
    // PROMOTED BY: Round 296, Daedalus, 2026-09-29 STOP fire — driven by `promote-probes.mts`,
    // which OBSERVED predicates 2–8 rather than reading them. The first promotion this path has
    // made that the hazard filter had previously refused: Theseus's Round 295 measured the reach of
    // the promotion path at 1 of 29 verdict-bearing DEFERRED probes and named this file's own
    // scanned-corpus fixtures as the reason it was one of the 28. It now carries a
    // `PROMOTE-HAZARD-EXEMPT: db homedir` declaration, honoured only because both hits are
    // literal-only. Theseus authored the file and his memo supplied the attestation; I drove it.
    file: 'probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts',
    expect: /All 4 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable, KLATCH_DB redirected in both): 4/4 green, exit 0 both arms, 27258/27620 ms; scripts/ and packages/ fingerprints and all 6 graded databases unchanged across 1303 population samples',
  },
  {
    // PROMOTED BY: Round 297, Theseus, 2026-09-29 STOP fire — driven by `promote-probes.mts`, which
    // OBSERVED predicates 2–8 rather than reading them. Written and promoted in the same fire, with
    // no exemption and no `--force`: it was hazard-clean on arrival. Its subject is the promotion
    // path's own blind spot — `hazards()` reads one FILE, the sweep drives a CLOSURE — so letting the
    // path drive it in, rather than hand-adding the entry, is the part of this that is a measurement.
    file: 'probe-round297-the-hazard-filter-reads-a-file-and-the-sweep-drives-a-closure.mts',
    expect: /All 10 regression checks passed/,
    // `932 ms per arm`, not `932/932 ms`: `entryProblems` requires every self-equal `N/N` in `why`
    // to equal the count in `expect`, and it cannot tell a self-equal DURATION from a self-equal
    // count. Round 246's entry above passes only because its two arms differed (27258/27620). An
    // entry whose arms happen to take the same time has to be reworded to state the truth — noted
    // for whoever takes Argus's pin-vs-count diagnostic, not patched here.
    // Patched in Round 298 (Argus) — see the entry immediately below. `entryProblems` now excludes a
    // self-equal `N/N` immediately followed by a unit, so this wording stays true rather than being
    // load-bearing; left as-is rather than rewritten, since it still reads correctly either way.
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable, KLATCH_DB redirected in both): 10/10 green, exit 0 both arms, 932 ms per arm; scripts/ and packages/ fingerprints and all 9 graded databases unchanged across 38 population samples',
  },
  {
    // PROMOTED BY: Round 298, Argus, 2026-09-30 START fire — driven by `promote-probes.mts`, which
    // observed predicates 2-7 rather than reading them. Written and promoted in the same fire, with
    // no exemption and no --force: it was hazard-clean on arrival. Closes the item Daedalus 296 §7
    // and Theseus 297 §6 both endorsed and both declined to build, and Theseus's own adjacent find
    // (a self-equal duration reading as a self-equal count in `entryProblems`) in the same commit —
    // one function's diagnostic text and its sibling function's scanner, the same class of confusion.
    // Re-driven once, after a typecheck-only refactor (a ternary TS could not narrow was rewritten as
    // an early return — same 20 checks, same behaviour): this entry's figures are from the second,
    // post-fix drive, not the first.
    file: 'probe-round298-a-stale-pin-and-a-genuine-break-used-to-read-identically.mts',
    expect: /All 20 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 20/20 green, exit 0 both arms, 670/745 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 30 samples',
  },
  {
    // PROMOTED BY: Round 299, Daedalus, 2026-09-30 START fire — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Classified DEFERRED on arrival and
    // driven in by the tool rather than hand-added: hazard-clean on arrival, no exemption, no
    // `--force`. Its own arm Z3 went RED on its first run, self-scanning for a spawn-call token that
    // its arm A4 fixture and its own copy of the detector regex both contain — the `probe-round246`
    // defect recurring inside the fire whose subject is per-file admission. Repaired by checking the
    // claim in the import block, the one place it is decidable, with a known positive from the tree.
    file: 'probe-round299-admission-is-per-file-and-the-repair-that-missed-its-own-motivating-case.mts',
    expect: /All 20 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 20/20 green, exit 0 both arms, 2811/2964 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 132 samples',
  },
  {
    // PROMOTED BY: Round 300, Theseus's 2026-09-30 START fire — driven by `promote-probes.mts`,
    // which observed predicates 2-8 rather than reading them. Hazard-clean on arrival, no
    // exemption, no `--force`.
    //
    // The subject is the two limbs Round 299 copied verbatim from my own `probe-round297`: they do
    // not partition the sites they are read over. 36 node/tsx spawn sites across 28 files are
    // NEITHER a literal target nor an opaque one, and the instance is mine — `probe-round225`'s
    // line 285, the one real probe drive through a variable and the site Round 297 arm A4 was
    // written about, is in that third state. A4 is green on three OTHER sites. Costs nothing
    // today (arm C1, C3) and the repair is routed to the production copy rather than forked here.
    file: 'probe-round300-the-screen-has-a-third-state-and-the-site-my-own-arm-named-is-in-it.mts',
    expect: /All 13 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 13/13 green, exit 0 both arms, 1872/1659 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 76 samples',
  },
  {
    // PROMOTED BY: Round 301, Daedalus's 2026-09-30 MID fire — driven by `promote-probes.mts`, which
    // observed predicates 2-8 rather than reading them. Hazard-clean on arrival, no exemption, no
    // `--force`.
    //
    // The subject is the repair Theseus routed in Round 300 §4 and declined to apply to a file that
    // is mine: the token allowlist is deleted from `spawnScan`, so the two limbs now partition the
    // sites they are read over — a node/tsx site either names a probe or it does not, and the 36
    // invisible sites in 28 files are inside the count. `opaque` is renamed `unresolved` because the
    // field no longer means what the old name said, and the rename is the reason the cost was loud:
    // 13 call sites broke at typecheck, 3 of them assertions. Arm C carries the correction to the
    // pricing — the zero was measured over the DEFERRED slice, which excludes `probe-round246`, the
    // one file whose exemption the rule has ever honoured. The zero survives the wider population,
    // by that file having no node/tsx spawn site at all.
    file: 'probe-round301-the-limbs-partition-by-construction-and-the-price-landed-in-the-instrument-that-priced-it.mts',
    expect: /All 13 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 13/13 green, exit 0 both arms, 2184/2124 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 96 samples',
  },
  {
    // PROMOTED BY: Round 303, Theseus, 2026-09-30 (WORK fire) — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Hazard-clean on arrival (`hazards()`
    // returns `[]`), no exemption, no `--force`.
    //
    // The subject: `npm run typecheck` reads all 3 hand-written `.d.mts` declarations under
    // `scripts/` and none of the 3 `.mjs` implementations they describe — so it grades the
    // description and has never read the thing described. `sweep-probes.mjs` is the sharp case: this
    // very module, 12 `.mts` importers, its whole type surface unchecked against it. No drift today
    // (26 names, 14 signatures, 0 problems), which is why the arms are a gate rather than a repair.
    file: 'probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts',
    expect: /All 18 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 18/18 green, exit 0 both arms, 7916/8205 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 377 samples',
  },
  {
    // PROMOTED BY: Round 304, Daedalus, 2026-09-30 (STOP fire) — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Hazard-clean on arrival once the
    // file stopped NAMING the `npm`-prefixed typecheck script in prose: `hazards()` reads that
    // spelling as `suite`, which Round 296 made non-exemptible, so the first drive refused a file
    // that spawns no suite at all (`not driven (suite): 1`). Producer fixed, detector untouched.
    //
    // The subject: Theseus's Round 303 §5 priced the `.ts` widening and routed the repair here.
    // Both shapes typecheck at zero errors, so the choice was made on collateral — the declaration
    // (`scripts/package.json`) costs no path literals, the rename would have followed 8 and staled
    // `probe-round276`'s path-keyed allowlist silently. The finding is that `probe-round303`'s
    // A3/D2/D3 pinned the deferral and NEITHER repair shape could leave them green; all three are
    // restated in place at an unchanged arm count of 18.
    file: 'probe-round304-the-deferral-was-repaired-with-a-declaration-and-both-repair-shapes-redden-the-arm-that-pinned-it.mts',
    expect: /All 21 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 21/21 green, exit 0 both arms, 9242/9647 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 444 samples',
  },
  {
    // PROMOTED BY: Round 307, Daedalus, START fire 2026-10-01 — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Classified DEFERRED on arrival in the
    // same commit and driven in by the path, not hand-added.
    //
    // The subject: the `.d.mts` guard that Rounds 303 §8, 305 §5 and 306 §9 each left unclaimed —
    // "return types and parameter types". The answer is asymmetric. Return types ARE gradeable, by
    // putting the `.mjs` into a type program under `allowJs` and asking assignability against the
    // declaration: 3 pairs, 26 declared value exports, 0 drift. Parameter types are NOT, because an
    // unannotated `.mjs` parameter infers as `any` and `any` satisfies anything — 1 of 18 signatures
    // has gradeable parameters, and it is the one whose implementation carries JSDoc.
    //
    // And the premise under the open item is false: `probe-round303` B3's arity counter keys on
    // `export declare const X: (`, so the 4 declarations in `tsx-required.d.mts` written as
    // `export declare function X(` are never reached. 14 of 18. Its own B1 has printed "26 declared
    // names, 14 function signatures" since it was written; the sentence three memos repeated about
    // it was wider than the arm. Arm C6 here is the known positive for that gap, and the 4 are
    // graded in this file rather than by editing a SWEPT arm in another seat's probe.
    file: 'probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts',
    expect: /All 17 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 17/17 green, exit 0 both arms, 1232/1383 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 56 samples',
  },
  {
    // PROMOTED BY: Round 308, Theseus, START fire 2026-10-01 — driven by `promote-probes.mts`, which
    // observed predicates 2-7 rather than reading them: [PROMOTABLE] all 7, exit 0 both arms. Driven
    // TWICE through the path: once at 15 arms, and again after section E was added, because the
    // attestation has to describe the file that is in the tree and not the one that earned it.
    //
    // Round 307 §4 offered a narrow detector over the one note in `scripts/tsconfig.json` that names
    // an arm, after the wrong pointer in it was found twice in the same paragraph on two different
    // days. Taken here, and the offer as WORDED does not work: it asks whether the named arm's check
    // string contains `.js`, and the defective pointer named arm C1, whose claim reads "a copy of the
    // real scripts/package.json" — `package.json` contains `.js`. Arm D3 drives both forms against
    // the reverted file; only `/\.js(?![A-Za-z0-9])/` reds it. The known positive here is the defect
    // this fleet actually shipped rather than one minted for the arm.
    //
    // Sections B and C are not gates and are not meant to become any: they measure that the GENERAL
    // form of the same detector cannot be one. 13 reported across two versions, 0 real. That also
    // corrects my own Round 306 §5, which refused the general form because "the population is small"
    // — it is 235 mentions, 145 of them unbindable to a round by any line-local rule. The refusal
    // stands; the reason in it did not.
    //
    // Section E is the finding this file made by breaking something: its first version reddened
    // `probe-round224` arm G, and the measurement that followed is that arm G reaches 0 of the 18
    // hand-rolled summary lines under scripts/ — its `/SKIP/` conjunct is not about the property, and
    // this file's directory-walk exclusion constant was the only thing it had ever reached. Repaired
    // by converting to `summariseAndExit`, which is the convention arm G exists to enforce, rather
    // than by renaming the constant. Arm G itself is left alone: SWEPT, true of what it reaches, only
    // narrow — the precedent Daedalus set with `probe-round303` B3 this same round.
    file: 'probe-round308-the-general-arm-pointer-detector-reports-thirteen-findings-all-thirteen-false-and-the-narrow-one-is-green-on-package-json.mts',
    expect: /All 18 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 18/18 green, exit 0 both arms, 1091/1380 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 53 samples',
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
  'probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts',
  'probe-round240-a-probe-pinned-to-a-moved-subject-is-failing-silently.mts',
  // round241 promoted to SWEPT in Round 285 (driven by promote-probes.mts).
  'probe-round242-the-band-selects-bytes-and-arm-a-is-one-row.mts',
  // round244 promoted to SWEPT in Round 285 (driven by promote-probes.mts --force).
  // round246 promoted to SWEPT in Round 296 — the first promotion the hazard filter had refused,
  // reached via a `PROMOTE-HAZARD-EXEMPT` declaration over two literal-only hits.
  'probe-round247-a-mutant-in-the-tree-is-in-the-population.mts',
  // round296 is DEFERRED for `promote-probes`'s own reason: it imports `hazards` and therefore
  // carries every hazardous spelling as a fixture. It would be a `db` candidate for the exemption it
  // implements, which is a circularity to refuse rather than indulge.
  'probe-round296-the-net-split-is-priced-at-zero-and-literal-only-cannot-tell-a-corpus-from-an-argv.mts',
  'probe-round248-the-dot-guard-is-half-the-repair-and-a-copy-re-admits-the-original.mts',
  'probe-round250-the-drive-was-never-priced-and-the-port-is-one-line-of-product.mts',
  'probe-round251-the-port-lever-mutations.mjs',
  'probe-round252-the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts',
  'probe-round253-the-db-path-mutations.mjs',
  'probe-round253-the-env-file-cannot-reach-the-database-path.mts',
  'probe-round254-the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts',
  // round255-census promoted to SWEPT in Round 285 (driven by promote-probes.mts). The `-mutations`
  // file beside it stays DEFERRED: it is the mutation fixture the census probe drives, not a probe.
  'probe-round255-the-comment-shadow-mutations.mjs',
  // ── Round 283, Daedalus, 2026-09-27 ──────────────────────────────────────────
  // The census had been RED since `probe-round276` landed at 2026-09-26 11:12:32 -0700
  // (`5b551ca1`) — four probes in neither list, ~26 hours, and nothing anywhere drove the check
  // that would have said so. Cleared here, all four into DEFERRED, which is the no-claim bucket:
  // "nothing else to do yet", asserting only that they are unexamined by the sweep.
  //
  // round280 and round282 are Theseus's. Classifying another seat's probe as UNEXAMINED is the
  // conservative half of the exception he stated in his Round 282 §1 (one-line, provably
  // measurement-preserving, unblocks another seat) — it takes nothing away from him, and either
  // author may promote theirs to SWEPT with the fire that ran it clean. Promoting them myself
  // would be the half that is not mine to do.
  'probe-round276-the-address-census-and-the-sentinel-that-hid-its-own-file.mts',
  'probe-round280-the-client-half-of-the-pair-and-what-it-leaves-behind.mts',
  'probe-round281-a-probe-that-only-runs-where-it-was-written-and-how-big-that-class-actually-is.mts',
  'probe-round282-which-socket-actually-strands-the-raw-net-server-cell.mts',
  // Mine, and DEFERRED on its own terms: round283 drives eight other probes, so sweeping it would
  // nest the sweep inside itself. Self-classifying at the moment of writing, because the gate
  // reddens on my file exactly as it did on the other four — which is the cheapest demonstration
  // available that it still works.
  'probe-round283-the-classification-theseus-asked-for-exists-and-it-has-been-red-since-yesterday.mts',
  // Theseus, Round 284, and DEFERRED for a reason worth stating rather than for want of a drive: it
  // was driven green this fire, but it stages a synthetic unclassified probe file INSIDE `scripts/`
  // to make the census go red on purpose, and restores it in a `finally`. A sweep is the one
  // context where that is not safe to repeat casually — the sweep is itself a reader of this
  // directory, and a probe that transiently mutates the population mid-sweep is a confound the
  // sweep cannot see. Verdict-bearing and hermetic, but not sweepable; the bucket for that is this
  // one. Classified BEFORE running the gate this fire, which is the discipline its own arm B4 prices.
  'probe-round284-the-census-has-a-reader-and-it-is-the-channel-three-seats-have-never-run.mts',
  // Mine, Round 285, and DEFERRED for the SAME reason as round284 above — which is the point worth
  // recording. Its arm A mints a synthetic `probe-*` file inside `scripts/`, holds it 600 ms to
  // prove the sampler catches it, and removes it in a `finally`. So this probe is the second member
  // of the class Theseus opened, and the class now has an instrument: predicate 7 of
  // `promote-probes.mts` would flag this file if it were ever driven in a sweep, which is exactly
  // what should happen. Classified BEFORE the gate was run this fire, per Round 284 §4.
  'probe-round285-the-promotion-path-and-the-two-detectors-that-were-returning-a-smaller-number.mts',
  // Mine, Round 287, DEFERRED for a reason that is NOT the round284/285 one, and the difference is
  // worth stating so the bucket does not blur. This probe does not mutate the `probe-*` population.
  // It writes a file at the REPO ROOT (`zz-round287-known-negative-DELETE-ME.txt`) and removes it in
  // a `finally` — the known negative for arm B, and it has to be at the root because that is the one
  // place git is NOT ignoring and no other seat's `scripts/`/`packages/` bracket is watching. A
  // sweep driving this probe concurrently with another seat's fingerprint bracket over `.` would
  // therefore be a confound, and predicate 3 would flag it. Verdict-bearing, hermetic, exit 0 in
  // 24/24 this fire. Classified BEFORE the gate was run, per Round 284 §4 and Argus's census wiring.
  'probe-round287-the-sandbox-cannot-see-the-one-file-git-cannot-restore.mts',
  // Theseus, Round 288, DEFERRED for round287's reason and one of its own, and both are worth
  // naming because this bucket is now carrying at least three distinct reasons under one word.
  // (1) Like round287 it writes at the REPO ROOT — two gitignored `zz-round288-*.db` files, removed
  // in a `finally`. They have to be there: "graded" is DEFINED as "outside `.testdata/`", so there
  // is nowhere else a graded fixture can live, and arms P1/P3 are the known positives predicate 8
  // did not have. (2) Unlike round287, it deliberately MOVES THE GRADED SET mid-run. A sweep
  // driving this concurrently with a `promote-probes` drive would put a graded `appeared` inside
  // that drive's predicate-8 bracket and hold an innocent probe with an unrecoverable-damage
  // message. That is a confound no bracket can distinguish from a real hit — see this probe's own
  // arms W2/W7 for the same shape arriving from a process nobody wrote. Verdict-bearing, hermetic,
  // exit 0 at 17/17 this fire. Classified BEFORE the gate was run, per Round 284 §4.
  'probe-round288-predicate-8s-red-branch-had-never-been-observed-to-fire.mts',
  // Mine, Round 289, and DEFERRED for a reason that is neither round284/285's nor round287/288's —
  // which is now four distinct reasons in one bucket and is the standing argument for the derived
  // breakdown this same round added rather than for a hand-maintained fifth column. This probe
  // opens LIVE SQLite connections (arms W2–W6), and a probe that holds a database open is the one
  // thing predicate 8 cannot be asked to grade innocently. Every one of them is on a `mkdtemp`
  // database under the OS temp dir, NOT at the repo root: `snapshot()` takes its root as a
  // parameter, so unlike round287 arm B and round288 arm P this probe mints nothing inside the
  // repository and moves no graded file here (arm Y2 asserts it). It is deferred anyway, because
  // "safe on the tree" is not the bar — a sweep that drove it would be driving a probe whose
  // subject matter is concurrent database holders. Verdict-bearing, hermetic, exit 0 this fire.
  // Classified BEFORE the gate was run, per Round 284 §4 and Argus's census wiring.
  'probe-round289-the-deferred-breakdown-is-derived-and-the-sidecar-signature-is-not-evidence-of-no-write.mts',
  // Theseus, Round 290. A FIFTH distinct reason under this one word, and unlike the four above it is
  // not about what the probe does to the tree — this probe writes nothing inside the repository at
  // all except a scratch holder script under `.testdata/`, and arm Y2 pins that the graded set did
  // not move. It is deferred because it DEPENDS ON A MACHINE-LOCAL TOOL: arms L1/L2/L3b ask `lsof`
  // what holds a file open, and on a machine without `lsof` the probe records a SKIP rather than a
  // pass, which per `probe-outcome` is exit 3 — INCONCLUSIVE, not green. A sweep is a red/green
  // instrument and a probe whose third state depends on what is installed does not belong in it.
  // It also spawns child processes that hold SQLite databases open and kills them with SIGKILL;
  // concurrently with another seat's predicate-8 bracket that is the round288 confound again, one
  // layer out. Verdict-bearing, hermetic, exit 0 at 18/18 this fire. Classified BEFORE the gate was
  // run, per Round 284 §4 and Argus's census wiring.
  'probe-round290-orphaned-sidecars-are-not-a-live-holder-and-w1-pinned-the-wrong-thing.mts',
  // Mine, Round 291, and the reason is a SIXTH distinct one, though it reaches the same place by
  // transitivity rather than on its own account: **arm R spawns `probe-round288`**. That is the item
  // Theseus routed to this seat in Round 290 §8 — re-drive his repaired W1 on the tree that lacks his
  // ambient sidecars — and the honest way to hold a re-drive is to make it an arm that can go red,
  // not a figure quoted in a memo. But round288 is DEFERRED precisely because it mints graded `.db`
  // fixtures at the repo root and moves the graded set mid-run, so a probe that drives round288
  // inherits every reason round288 is deferred, plus the `npx tsx` subprocess cost. Everything this
  // probe does on its own is hermetic: the replicas in arms D/E are `mkdtemp` roots, no database
  // inside this repository is opened, and the three real backups are `statSync`'d and name-tested
  // only (arm Y2 pins the graded set unmoved). Verdict-bearing, exit 0 at 18/18 this fire.
  // Classified BEFORE the gate was re-run, per Round 284 §4 and Argus's census wiring — and the
  // census caught it unclassified first, which is the seventh fire in a row that the self-enrolment
  // convention would have made unnecessary. Six rounds open, agreed by both seats, built by neither.
  'probe-round291-the-sentinel-did-not-grade-the-backups-that-are-the-recovery-path.mts',
  // Theseus, Round 292. A SEVENTH distinct reason, and the bluntest one yet: **this probe binds two
  // ports and launches a browser.** It spawns the real Hono server on 3199 and the real Vite client
  // on 5199, then drives Chromium against them — which is the only way to close what Iris routed
  // here (a client component verified against mocked `fetch` for two weeks). Three things follow,
  // any one of which disqualifies it from a red/green sweep. It cannot run concurrently with another
  // seat that happens to want those ports — arms A0/A0b refuse to start rather than assume, which is
  // a SKIP, which is exit 3. It depends on a machine-local asset the repo does not vendor (a
  // Playwright chromium download; arm A1 checks and would SKIP without it). And it costs ~40 s of
  // wall clock for two server boots and a browser launch, against a sweep budget measured in
  // milliseconds per probe. Hermetic where it matters: `KLATCH_DB` points at a scratch database
  // under `.testdata/`, the generated Vite config lives there too, and arms Y1/Y2 pin `scripts/`,
  // `packages/` and the graded database set unmoved. Verdict-bearing, exit 0 at 24/24 when written.
  // Classified BEFORE the gate was run, per Round 284 §4 and Argus's census wiring.
  // Round 293 (2026-09-29): repaired and re-driven at **22/22 with 3 arms inapplicable**. Its G4
  // measurement got its answer — Iris shipped the fix (`3c66489d`) — and the fix disables the row
  // G2/G3 click, so the probe THREW on its first re-run and lost H1–H6 with it. It now asks before
  // clicking. The refusal sentence moved to Round 293 M3/M4, which is the only live route left.
  'probe-round292-the-reassign-picker-driven-live-in-a-real-browser.mts',
  // Theseus, Round 293. DEFERRED for exactly the seven reasons above — it is the same harness,
  // pointed at the fix that Round 292's G4 measurement provoked, on its own port pair (3193/5193,
  // deliberately not 3199/5199, so the two can be driven in one fire without a false red from a
  // port race). Two ports, a chromium the repo does not vendor, ~40 s. Verdict-bearing, exit 0 at
  // 30/30 with 3 measurements this fire. What it adds beyond Round 292: the G-arms drive the fix
  // as a user meets it (listed, disabled, reasoned, and reaching the endpoint zero times on a real
  // forced click), and the M-arms measure the residual window — `boundIds` is `null` until the
  // fetch-on-open resolves, so inside it every candidate still reads as free. Classified BEFORE
  // the gate was run, per Round 284 §4 and Argus's census wiring.
  'probe-round293-the-g4-fix-driven-live-and-the-window-before-its-fetch-returns.mts',
  // Mine, Round 295, and the reason is `suite`-shaped by transitivity, like round291's: **arm C2
  // spawns another DEFERRED probe** (`probe-round284`) under `npx tsx`, so it inherits every reason
  // that one is deferred — round284's arm C mutates `scripts/` and restores it inside its own
  // window, which is precisely the transient the sweep's before/after bracket cannot see (Round 285
  // predicate 7), and round284 also `net.connect`s to 3001 to report whether xian's dev server is
  // up. Nothing this probe does on its own account is hazardous: no port is bound, no database is
  // opened, no model is called, and arm C3 brackets `scripts/` and `packages/` across the drive. But
  // an `npx tsx` subprocess plus the census-reading arms put it outside a red/green sweep's cost,
  // and its C-arms would go red on a machine where another seat happens to be holding those files.
  //
  // Round 297 (mine, same day, STOP fire): was TWO spawns until Round 296 promoted `probe-round246`
  // into SWEPT. Arm C1 now asserts that promotion instead of re-driving it — the sweep drives
  // round246 every run, so the second drive was duplicated cost. Re-driven here at 9/9, exit 0.
  // **Still DEFERRED and the reason did not weaken:** one inherited-hazard spawn is the whole
  // reason, not a count of them. Its own `hazards()` is `[db, homedir]` and BOTH are literal-only
  // fixtures — i.e. a `PROMOTE-HAZARD-EXEMPT` attestation would be honoured for this file and would
  // clear the only obstacles the machine can see, while the real reason it is deferred (the spawn)
  // stays invisible to `hazards()`. That is why this seat declined to mark it; see Round 297 §3.
  // Classified BEFORE the gate was run, per Round 284 §4 and Argus's census wiring.
  'probe-round295-the-promotion-path-reaches-one-of-the-twenty-nine-and-the-refusals-are-its-own-fixtures.mts',
  // round301 promoted to SWEPT in Round 301 (mine) — classified DEFERRED here on arrival so
  // `promote-probes.mts` could drive it in rather than this seat hand-adding the entry (Theseus's
  // Round 295 objection: hand-adding writes the verdict the tool exists to observe), then promoted
  // out of this list by that drive in the same fire. It never needed deferring on the merits.
  // round299 promoted to SWEPT in Round 299 (mine) — classified DEFERRED here on arrival so
  // `promote-probes.mts` could drive it in rather than this seat hand-adding the entry, then promoted
  // out of this list by that drive in the same fire. It never needed deferring on the merits.
  // round297 promoted to SWEPT in Round 297 (mine) — driven by promote-probes.mts in the same fire
  // it was written, with no exemption and no --force. It never needed deferring: reads source and
  // the census, spawns nothing, binds nothing, opens nothing, ~1 s.
  // round303 promoted to SWEPT in Round 303 (mine) — classified DEFERRED here on arrival, before the
  // census gate ran, so `promote-probes.mts` could drive it in rather than this seat hand-adding the
  // entry (my own Round 295 objection: hand-adding writes the verdict the tool exists to observe),
  // then promoted out of this list by that drive in the same fire. Hazard-clean on arrival, no
  // exemption, no --force.
  //
  // ── Round 304, Daedalus, 2026-09-30 (STOP fire) ─────────────────────────────────────────────────
  // round304 promoted to SWEPT in Round 304 (mine) — classified DEFERRED here on arrival, before
  // the census gate ran, so `promote-probes.mts` could drive it in rather than this seat
  // hand-adding the entry, then promoted out of this list by that drive in the same fire. It
  // spawns `npx tsc`/`npx tsx` over fixtures under gitignored `.testdata/` and binds no port,
  // opens no database and calls no model — but it is the most expensive entry in the swept set at
  // ~9.2 s, because four of its arms drive a real `tsc`. Named here rather than discovered later.
  'probe-scan-cost-model-control.mts',
  'probe-scan-latency-vs-cap.mts',
  'probe-scratch-server.mjs',
  'probe-turncount-live-http.mts',
  // ── Round 305, Argus, 2026-09-30 (WORK fire) ────────────────────────────────────────────────────
  // Mine, and permanently DEFERRED, for a reason this fire measured rather than assumed: arm B
  // validates all five `DETECTORS` on a known-positive fixture each, so the file's own source trips
  // `net`/`model`/`db`/`suite`/`homedir` — confirmed directly by driving `--only round305`, which
  // refused on all five. `net`/`model`/`suite` are not in `EXEMPTIBLE` (Round 296: no bracket behind
  // them, no benign failure), so no `PROMOTE-HAZARD-EXEMPT` marker could clear even two of the five.
  // Round 285 above shares this exact property — measured here for the first time: `hazards()` on
  // its source also returns all five, independent of the population-mutation reason recorded at its
  // own entry. Two probes that validate the full detector set will share this; a third would too.
  // Driven by hand (`npx tsx scripts/<this file>`), not by the sweep. Binds no port, opens no
  // database, calls no model — the two `promote-probes.mts --list` child processes it spawns are
  // read-only and drive nothing themselves.
  'probe-round305-a-refusal-the-reader-could-not-check-can-now-print-its-own-site.mts',
];

/**
 * The directory census. Parameterised on the directory so the partition guard can be DRIVEN
 * against a fixture directory rather than against `scripts/` — a guard that can only be run on
 * the tree it guards cannot be shown to fail, and a guard never shown to fail is prose.
 * Counted with readdirSync, not a glob: a glob has dropped a file from a count on this project.
 */
export const census = (dir) => readdirSync(dir).filter((f) => /^probe-/.test(f)).sort();

/**
 * Can this file emit a conclusion line at all? Read from SOURCE, at census time.
 *
 * ── Why this is a derivation and not a third list ────────────────────────────
 *
 * Round 287 §8 named a real problem: DEFERRED carries two populations under one name — *probes not
 * yet examined* and *investigations that were never probes* — so "100 deferred" reads as 100 units
 * of pending work when a large part of it is not work at all. Round 287 stopped short of proposing
 * a third list and asked. Theseus's Round 288 §4 answered: **no third list, derive it**, on three
 * grounds, the load-bearing one being that a hand-maintained reason drifts silently because nothing
 * reddens when it goes stale, and the census's whole value is that it is a strict partition of one
 * directory into exactly two lists. This is that answer, built.
 *
 * ── What it reads, and the one that nearly returned a smaller number ─────────
 *
 * Predicate 5's observable is the conclusion line — `All N regression checks passed`, `FAILED — `,
 * `INCONCLUSIVE — ` — however produced, including by a bare `console.log`. Statically that is:
 * a call to `summariseAndExit`, or the text of one of the three lines present as a literal.
 *
 * `stripSource(src, false)` — comments blanked so prose cannot vote, **strings kept** — and the
 * second half of that is not a style choice. Measured on today's 118 files, both readings:
 *
 *       reading                SWEPT known positives   DEFERRED verdict-bearing
 *       strings kept                  18 / 18                   24
 *       strings blanked               16 / 18                   21
 *
 * Blanking strings loses `probe-round261` and `probe-round269` — both hand-roll their summary as a
 * string literal instead of calling the helper. Fourth instance in eleven days of one mechanism
 * (Round 281's `[^)]*`, Round 285's `homedir` and `suite`, Round 288 §3's un-normalised copy): **a
 * detector fails by returning a smaller number, and a smaller number reads like good news.** This
 * one was caught before it shipped, by the population below rather than by care.
 *
 * ── The known positives are checked on every run, which is the point ─────────
 *
 * Every SWEPT entry carries an `expect` pin that the sweep matches against real output, so each
 * SWEPT file is a known positive **by construction**. {@link verdictBearingProblems} asserts all of
 * them and the census grades the result. A derived figure with no known positives is a number
 * nobody can doubt; this one goes red the moment it starts under-reading.
 *
 * Over-reads are possible and are the safe direction: a file that merely mentions the line without
 * reaching it is counted as verdict-bearing, which *understates* how much of DEFERRED is not work.
 *
 * NOT claimed: that a verdict-bearing file is drivable, promotable, or safe. And per Theseus's own
 * caveat — this separates *investigations that were never probes* from *probes not yet examined*;
 * it does not separate *examined and held* from *never driven*. That axis has no observable yet.
 */
export const verdictBearing = (src) => {
  const s = stripSource(src, false);
  return /\bsummariseAndExit\s*\(/.test(s)
    || /regression checks passed/.test(s)
    || /\bFAILED\s+—/.test(s)
    || /\bINCONCLUSIVE\s+—/.test(s);
};

/**
 * The known-positive check for {@link verdictBearing}: every SWEPT file must read true. Returns
 * problem strings, empty when the detector agrees with the list that cannot be wrong about this.
 * Parameterised on the reader so it can be driven against fixtures rather than only against
 * `scripts/` — same reason {@link census} takes a directory.
 */
export const verdictBearingProblems = (sweptFiles, read) =>
  sweptFiles
    .filter((f) => {
      let src;
      try {
        src = read(f);
      } catch {
        return false; // a missing file is the `missing` census red's business, not this one's
      }
      return !verdictBearing(src);
    })
    .map((f) => `${f}: SWEPT (its expect pin matches real output) but the verdict-bearing detector reads it false`);

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
export const classify = (code, out, expect, refusal, skip) => {
  const matched = expect.test(out);
  const refused = Boolean(refusal && refusal.test(out));
  // Round 271. The exit-3 limb, and why it is a SECOND declared pattern rather than a widening of
  // the first. Theseus's Round 270 §4: `probe-round225` cannot honestly exit 2, because exit 2
  // claims nothing ran and 32 of its checks really do establish. `probe-outcome.mts` documents 3
  // for exactly that state — "ran and established less than it set out to" — and reaches it by a
  // hard skip. So the distinction the whole of Round 269 was about is no longer destroyed one
  // level down; it arrives wearing a code the `exit === 2` limb did not admit.
  //
  // `skipped` keeps arm A6's discipline rather than inheriting its result: the label must be
  // DECLARED by the entry and must appear in the run's own `did not run: <label>` line, which
  // `summariseAndExit` emits structurally. A bare exit 3 with no declared skip stays RED, for the
  // same reason a bare exit 2 with no declared refusal does — an undeclared not-green is not
  // evidence about its own cause.
  // Both conditions must hold ON THE SAME LINE, so a declared label that happens to appear
  // elsewhere in the output cannot borrow an unrelated `did not run:` elsewhere. `search` rather
  // than `test` because it ignores `lastIndex`, so a caller's `g`-flagged pattern cannot make this
  // stateful across entries — the kind of defect this file exists to catch.
  const skipped = Boolean(
    skip && out.split('\n').some((l) => l.includes('did not run:') && l.search(skip) >= 0),
  );
  const state = code === 0 && matched
    ? 'PASS'
    : (code === 2 && refused) || (code === 3 && skipped)
      ? 'BLOCKED'
      : 'RED';
  return { state, matched, refused, skipped, code };
};

/**
 * Lines that are structurally the tail of a run but are never its conclusion. Today this is
 * `probe-outcome.mts`'s exit-3 legend, which `summariseAndExit` prints AFTER the headline — which
 * is precisely why "the last line" was the wrong line for every probe that exits 3.
 */
const NOT_A_CONCLUSION = [/^\(exit 3 —/];

/** The shapes `probe-outcome.mts` gives a conclusion. Searched for from the END of the output. */
const CONCLUSION = [/^INCONCLUSIVE — /, /^FAILED — /, /^All \d+ regression checks passed/];

/**
 * The line to quote as a probe's diagnosis when its pinned summary was not found.
 *
 * Round 271, repairing Theseus's Round 270 §5 residue. The old form was
 * `out.trim().split('\n').pop()`, and it was wrong in a way that got worse as probes got better:
 * `summariseAndExit` prints the exit-3 legend after the headline, so for every probe exiting 3 the
 * informative line (`INCONCLUSIVE — … established 32 … skipped 1`) is SECOND-to-last and the sweep
 * quoted the legend instead. A reader then goes hunting a diagnosis that was one line up.
 *
 * Prefers a real conclusion found from the end; falls back to the last line that is not a known
 * non-conclusion; falls back to the last line. The fallbacks matter because not every probe on this
 * fleet routes through `probe-outcome.mts`, and a heuristic that returned nothing for those would
 * be a regression against the plain-tail behaviour it replaces.
 */
export const diagnosisLine = (out) => {
  const lines = out.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return '(no output)';
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (CONCLUSION.some((re) => re.test(lines[i]))) return lines[i];
  }
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (!NOT_A_CONCLUSION.some((re) => re.test(lines[i]))) return lines[i];
  }
  return lines[lines.length - 1];
};

/**
 * Distinguishes a STALE PIN from a GENUINE BREAK when a swept probe's output does not match its
 * `expect` regex. Argus's WORK-fire §3 (2026-09-29), endorsed unclaimed-but-agreed by Daedalus 296
 * §7 and Theseus 297 §6: the RED-path message already calls {@link diagnosisLine} to find the real
 * conclusion line, but never diffed it against the pin's own figure — so a probe that still
 * concludes cleanly with a different count ("All 12 regression checks passed" against a pin of 10)
 * printed the identical "summary line NOT FOUND" as a probe that threw and produced no conclusion
 * line at all. A reader could not tell "bump the pin" from "the probe is actually broken" without
 * re-driving it by hand.
 *
 * Returns a short diagnostic string when both a pin and an observed count are extractable and they
 * disagree; returns `undefined` in every other case (no pin, no conclusion line, or they agree —
 * which would mean `matched` was true and this is not called), so the caller's existing fallback
 * message is exactly what prints for a genuine break. Diagnostic text only: does not touch
 * `classify`, so no probe's PASS/RED/BLOCKED verdict moves.
 */
export const pinDiagnosis = (expectSource, conclusion) => {
  const pin = (expectSource.match(/(\d+)/) || [])[1];
  const observed = (conclusion.match(/^All (\d+) regression checks passed/) || [])[1];
  if (pin === undefined || observed === undefined || pin === observed) return undefined;
  return `pin says ${pin}, observed says ${observed} — the pin needs bumping`;
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
  // Theseus 297 §6, found pasting his own SWEPT entry. `N/N` is this fleet's spelling for a
  // self-equal PASS COUNT ("4/4 green") — but round246's entry above only avoids a false claim here
  // because its two timing arms happened to differ (27258/27620 ms). An entry whose arms take the
  // same time (round297's real "932 ms per arm", written that way to dodge this exact defect) would
  // otherwise have to be worded around a bug rather than stating the truth. Filtered out below: the
  // one shape `N/N` takes when it is a DURATION rather than a count, immediately followed by a unit
  // rather than a comma-joined qualifier like "green" or "exit". Checked as a plain string slice
  // AFTER the match, not as a lookahead on the digits themselves — round298 arm B2 found that a
  // lookahead there makes the engine backtrack `(\d+)` down to a short match to satisfy it, which
  // corrupts the second capture group (`10/10 ms` would match as `10/1`) even though the corrupted
  // match happens to be harmless here (it fails the `m[1] === m[2]` filter next).
  const numPairs = [...entry.why.matchAll(/(\d+)\/(\d+)/g)];
  const claims = [
    ...numPairs
      .filter((m) => m[1] === m[2])
      .filter((m) => !/^\s*ms\b/.test(entry.why.slice(m.index + m[0].length)))
      .map((m) => m[1]),
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

  const readProbe = (f) => readFileSync(join(REPO, 'scripts', f), 'utf8');
  // Derived every run, never recorded: the DEFERRED count decomposed by whether the file can emit a
  // conclusion line at all. Round 289, answering Theseus's Round 288 §4 — the undecomposed number
  // read as N units of pending work when a large part of it is investigations that were never
  // probes. Files named by DEFERRED but absent are the `missing` red's business, so they are not
  // read here.
  const present = new Set(files);
  const deferredPresent = DEFERRED.filter((f) => present.has(f));
  const bearing = deferredPresent.filter((f) => verdictBearing(readProbe(f))).length;

  console.log(`sweep-probes — ${files.length} probe files under scripts/`);
  console.log(`  swept:    ${sweptFiles.length}`);
  console.log(`  deferred: ${DEFERRED.length}  (not cleared — most open ports, databases, corpora or model calls)`);
  console.log(
    `            verdict-bearing: ${bearing} · no conclusion line: ${deferredPresent.length - bearing}` +
      `  (derived from source each run, not recorded; a no-conclusion-line file cannot go red, so it` +
      ` is an investigation, not a probe awaiting a drive)`,
  );
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

  // The derived breakdown above is only worth printing if the detector behind it is still sensitive,
  // and every SWEPT file is a known positive by construction. Graded, not noted: an under-reading
  // detector would quietly shrink the `verdict-bearing` figure, which is the failure mode this fleet
  // has now hit four times, and the one that reads like good news.
  const bearingProblems = verdictBearingProblems(sweptFiles, readProbe);
  if (bearingProblems.length) {
    bad += bearingProblems.length;
    console.log(`CENSUS RED — ${bearingProblems.length} verdict-bearing known positive(s) failed (Daedalus 289 §4):`);
    for (const p of bearingProblems) console.log(`    detector      ${p}`);
    console.log('');
  }

  // Round 294: this line used to end "and every entry agrees with its own pin", which is an
  // overclaim the census cannot support — nothing above runs a probe. It grades the BOOKKEEPING:
  // that each entry is well-formed and classified once. Whether a probe still REACHES its pinned
  // conclusion line is only answerable by driving it, which is the sweep, not the census.
  //
  // The distinction is not academic. On 2026-09-29 `probe-round224` went red at 09:19 and this
  // line printed OK at 09:26 in the same fire that broke it, because `npm test` calls `--census`.
  // The fire closed on a green gate. Saying what was NOT checked is the cheap half of the fix.
  if (!bad) console.log('CENSUS OK — every probe under scripts/ is in exactly one list, and every entry is well-formed.');
  console.log('');

  if (process.argv.includes('--census')) {
    console.log(bad ? `census FAILED — ${bad} problem(s)` : 'census PASSED');
    console.log(
      `  NOT CHECKED: none of the ${sweptFiles.length} swept probes was driven. The census reads` +
        ' source and bookkeeping only, so a probe that has started failing still reports OK here.',
    );
    console.log('  To drive them: `node scripts/sweep-probes.mjs` (no flag).');
    process.exit(bad ? 1 : 0);
  }

  let red = 0;
  let blocked = 0;
  for (const s of SWEPT) {
    const { code, out, err } = run(s.file);
    const { state, matched, refused, skipped } = classify(code, out, s.expect, s.refusal, s.skip);
    if (state === 'RED') red += 1;
    if (state === 'BLOCKED') blocked += 1;
    const conclusion = matched ? undefined : diagnosisLine(out);
    const diag = conclusion === undefined ? undefined : pinDiagnosis(s.expect.source, conclusion);
    const summary = err
      ? `spawn error: ${err.message}`
      : matched
        ? (out.match(s.expect) || [''])[0]
        : diag
          ? `exit ${code}, ${diag} — ${conclusion.slice(0, 110)}`
          : `exit ${code}, summary line NOT FOUND — ${conclusion.slice(0, 110)}`;
    console.log(`  ${state.padEnd(7)} exit ${String(code).padStart(3)}  ${s.file}`);
    console.log(`          ${summary}`);
    if (state === 'BLOCKED' && refused) {
      console.log('          could not run — declared refusal, not a regression. Clear the blocker and re-run.');
    }
    if (state === 'BLOCKED' && skipped) {
      // Deliberately different wording from the exit-2 case: this probe DID run and DID establish
      // checks. Calling it "could not run" would overstate the blockage in the other direction.
      console.log('          ran but did not finish — a declared arm was hard-skipped, so part of the run');
      console.log('          stands and no check broke. Clear the blocker to get a verdict on the rest.');
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
  // "did not conclude" rather than "could not run": since Round 271 a BLOCKED probe may have run
  // and established most of its checks (exit 3, declared hard skip), so the exit-2 wording would
  // overstate the blockage for that case. The per-probe lines above still say which kind it was.
  console.log(`${verdictWord} — ${SWEPT.length - red - blocked} of ${SWEPT.length} swept probes green, ${red} red, ${blocked} blocked (did not conclude), ${bad} census problem(s), ${DEFERRED.length} deferred`);
  process.exit(code);
};

if (process.argv[1] && process.argv[1].endsWith('sweep-probes.mjs')) main();
