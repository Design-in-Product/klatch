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
 * `probe-round265` prints `  [C] MEAS  …`. So `measurementCheck` counts the fleet spellings off the
 * output, grades the claim when the run emits something countable, and reports the claim as
 * unenforceable prose when it does not — unverified is not false.
 *
 * **Round 339, Daedalus, 2026-10-06: "both spellings" was wrong by two, and the arm that was
 * supposed to catch that could not.** The sentence above said *both*, `MEAS_LINE` encoded two, and
 * `probe-round269` arm F1 asserted "counts BOTH fleet spellings" against a fixture it hand-wrote
 * from the same two — so the pair agreed with itself and no third spelling was reachable by any of
 * them. Enumerated from the 36 swept files instead of reasoned about: **four spellings are live**,
 * and two were uncounted. `probe-round224:561` renders the token-first spelling INDENTED, and the
 * `MEAS\s+\[` alternative had no leading `\s*`, so the same spelling counted at column 0 and was
 * invisible two spaces in. `probe-round297:95`/`:375` render `[MEAS] …`, with the token INSIDE the
 * bracket, which neither alternative could reach. Neither entry claims a count, so nothing was
 * misgraded — latent, not live, and found only because the spelling set was derived rather than
 * recalled. The price of widening measured 0: all 7 count-claiming entries emit exactly one
 * countable shape each, unchanged by the two new alternatives. Arm F1 is now built from all four
 * real emitting sites, and arm F6 derives the set from `SWEPT` source so a FIFTH spelling reddens
 * the fleet counter instead of hiding behind a fixture that already agrees with it.
 *
 * **First live run, measured rather than predicted:** this paragraph first said that *most* swept
 * probes print no measurement line while their entries claim a count. That was a guess and it was
 * wrong. All 6 entries claiming a count emit countable lines, so all 6 are enforced and none is
 * merely noted — and 2 of the 6 disagreed with their own runs on the first pass: `probe-round260`
 * (the 6 was true when written; Round 324's entry made it **7**, re-counted off `SWEPT` in Round 339
 * rather than carried forward — and all 7 are still enforced, none merely noted)
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
    expect: /All 72 regression checks passed/,
    // 64/64 → 66/66 in Round 290: arm G's scan was normalised to ignore comments (it had gone red
    // on one), and the repair brought its own known positive and known negative with it.
    // 66/66 → 70/70 in Round 294: arm E stopped pinning the ABSENCE of `inapplicable` callers —
    // an absence two correct changes ended on 2026-09-29 — and now holds probe-outcome.mts's
    // declared caller list to the measured one in both directions, with three known positives.
    // 70/70 → 72/72 in Round 321: arm G's population label said "under scripts/" while its
    // readdirSync reads ONE LEVEL, so the 19 files in scripts/lib/ were asserted and not measured
    // (Theseus named this for six rounds). The label is narrowed to the measured scope and the
    // BOUNDARY is now graded — one arm that no probe lives in a subdirectory, plus its known
    // positive/negative. Recursion was measured and declined: the delta is 0 of 19 today, and it
    // would put lib/probe-outcome.mts, whose job is printing "checks passed", inside a detector
    // hunting that print.
    why: 'run every fire as a control by both seats; Daedalus 321 measured 72/72, exit 0',
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
    expect: /All 56 regression checks passed/,
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
    // `[id] MEAS` lines, so `measurementCheck` grades the 3 below against the run.
    //
    // Round 339, Daedalus: the sentence that used to end this paragraph — "every other entry
    // claiming a count emits nothing countable and is annotated as unenforceable prose" — was
    // FALSE, and false in a way worth naming: it is the residue of the guess the header paragraph
    // already retracted ("this paragraph first said that *most* swept probes print no measurement
    // line … That was a guess and it was wrong"). The correction landed in the header and not here,
    // so one file carried both the claim and its refutation, 300 lines apart, for 70 rounds.
    // Re-measured off the driving run rather than from either comment: all 7 count-claiming entries
    // emit countable lines and every one is graded, because the sweep prints `note — …` for an
    // unenforceable claim and the run emitted no such line.
    // Round 339, Daedalus: 51 → 52. Arm F6 added — the fleet-spelling set DERIVED from the swept
    // files rather than hand-written into F1's fixture, which is what let two live spellings sit
    // uncounted. Measurement count unchanged at 3; F6 is a check, not a measurement.
    //
    // Round 341, Daedalus: 52 → 53. Arm F7 added, and F6's POPULATION selector corrected. F6 chose
    // its population by token PRESENCE — any emitted literal mentioning MEAS — and then required
    // the counter to count it. Two live shapes mention the token in a line that is no measurement
    // at all: a summary line counting measurements, and a lowercased identifier. Measured over the
    // 109 DEFERRED files, 3 red F6 the moment they are promoted into SWEPT, and ONE of those three
    // is this false class. The selector now keys on where the token stands in the line, which is
    // deliberately NOT what MEAS_LINE keys on — a selector equivalent to the counter would make F6
    // vacuous, which is Round 339's own lesson one round later. F7 asserts both directions: every
    // countable rendering survives the selector (derived from the swept set, 0 dropped), and a
    // labelled line the counter cannot count is still admitted (fixture, so F6 can still red).
    // Price on the swept set: 0 — all 32 renderings are in label position. Measurement count
    // unchanged at 3; F7 is a check.
    //
    // Round 345, Daedalus, on Theseus's routed Round 344 CURE C: 53 → 54. Arm F8 added — F6 and F7
    // grade the two regexes against each other and neither can see the population F6 never
    // reached. `renderMeasMentions` requires the MEAS token to sit literally inside a
    // `console.log`'s first quoted argument, so `probe-round255` — SWEPT, six MEAS lines, ternary
    // hoisted into a variable one line above the template — was graded by nothing, and F6 read 35
    // of its own 36 members while reporting no gap. F8's key is independent of `console.log`
    // entirely: a MEAS token is string-literal body iff the strings-blanked `stripSource` reading
    // is blank at those exact offsets. The invisible set must EQUAL a declared list, which reds in
    // both directions, and each declared entry must carry a rendering the fleet counter counts.
    // Priced: 32 of 36 swept files carry a literal, the renderer reaches 31, invisible = {255};
    // inverse direction 0; 2 of the 109 DEFERRED files are invisible and must be declared on
    // promotion. Measurement count unchanged at 3; F8 is a check.
    //
    // Round 347, Daedalus, on Theseus's routed Round 346 CURE D: 54 → 55. Arm F9 added — F8 is
    // keyed on FILES, so a file with two emitters passes it while one of them is invisible.
    // `probe-round224` is SWEPT and is exactly that: it hoists the same ternary at :71-72 AND
    // emits a visible inline one at :561, so F8 reaches the file through the sibling and cannot
    // declare the site either (declaring the file would red F8's `declared-but-not-invisible`
    // leg). F9 keys on the SHAPE — a MEAS literal assigned to a name, that name interpolated into
    // a `console.log` template — and asserts the flagged SITE set equals a declared list of four:
    // `224:71→72`, `224b:57→58`, `247:67→68`, `255:171→172`. Two of the four are DEFERRED and
    // pass F8 today and at promotion.
    //
    // The routed detector reproduced exactly (7/7 on its grading set, 4 files of 194) and carried
    // one defect found by driving rather than reading: it passes `false` to `stripSource`, which
    // blanks comments and KEEPS strings, so it reads string bodies as code — and a known positive
    // for this shape can only be written AS a string. Reverting the two `isCode` guards in the
    // landed file yields 40 sites, 36 of them F9's own fixtures: a false defect in the arm's own
    // file, arm G4's lesson ("a citation inside a string is not a call either") one level up.
    // Graded 12/12 — 2 known positives from the real sites, 10 negatives of which five are the
    // fixture SPELLINGS. Six counterfactuals red F9 independently against a stated baseline.
    // Measurement count unchanged at 3; F9 is a check.
    //
    // Round 349, Daedalus, on Theseus's routed Round 348: 55 → 56. Arm F10 added. His 348
    // corrected F9's own comment — the fixture's escape is NOT "one semicolon wide", it is the
    // ELEMENT ORDER — and driving the correction showed the escape condition is a property of the
    // DETECTOR, not the fixture: `hoistedTagSites` has a greedy `[^;]*` RHS scanned with `/g`, so
    // `lastIndex` lands past the whole match and any declarator inside an earlier semicolon-free
    // RHS is never a match START. The `isCode` guards do not help — they decide code-vs-string at
    // an offset and never touch `lastIndex` — so F9 as landed carries the hole exactly as CURE D
    // as routed did. F10 compares F9's greedy scan against a scan that tests the declarator
    // independently at every keyword occurrence (exactly one thing varied; same literal key, same
    // both guards, same emitter regex) as MEMBER LISTS, not counts.
    //
    // Live population: ZERO swallowed members, 4 and 4 with the same four members — a documented
    // limit, not a live hole, which is why it is worth pinning at a fire where it is free. So the
    // arm is graded by FIXTURES, not by the tree: one known positive (a real site behind an
    // unterminated declarator) and one known negative (the same site, swallower terminated), which
    // differ only in the swallow. Counterfactual driven in a scratch copy of `scripts/` under
    // gitignored `.testdata/`, baseline stated: untouched scratch → F9 PASS, F10 PASS, 4 unrelated
    // reds (J1/J2/J5/J6, minted-fixture arms needing real repo paths). One swallowed site appended
    // to a non-declared file → **F9 still PASS, F10 FAIL**, exactly one red added. That is the
    // point of the arm: a swallowed site is invisible to F9's flagged set AND its declared set, so
    // F9's set-equality conjunct reads true over a smaller world and only F10 reds.
    // Measurement count unchanged at 3; F10 is a check.
    why: 'run green in Round 349, 56/56 exit 0, 3 measurements; spawns minted node scripts under gitignored .testdata/r269 — no server, port, database, corpus or model call',
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
    //
    // WIDENED BY: Theseus, Round 313, 2026-10-01 SWEEP fire — section F adds the explainer sub-case
    // this file's own author named and left unbuilt two fires earlier: a pointer whose arm is owned
    // by neither the enclosing file nor the round cited beside it. Two such sites were already in
    // THIS file (lines 44 and 267) and were counted inside the pinned 13 under categories about
    // something else, so the pin could never have surfaced them. The widening is a classifier and
    // not a resolver, and that is measured rather than conceded: the labels those pointers name are
    // defined by 2 to 45 probes apiece, so no tree-wide lookup can say whose arm it is.
    // Hard-check count 18 -> 21, so this `expect:` is restaged in the same commit.
    //
    // WIDENED BY: Theseus, Round 317, 2026-10-02 WORK fire — section E's header is DERIVED from the
    // counts probe-round308's own E0 measures instead of written as prose, which is the repair
    // Daedalus routed in his Round 315 memo, and probe-round308 arm E4 grades that it stays derived
    // (known negative: the pre-317 frozen line must be REJECTED by the same detector). The docblock
    // figures and probe-round308 arm E2's claim string were DATED rather than derived, because a
    // comment cannot interpolate. Hard-check count 21 -> 22, so this `expect:` is restaged here.
    //
    // KNOWN RED THIS ROUND, and it is not this entry's: deriving the header reds probe-round309 arm
    // E1, whose shape pin reads probe-round308's SOURCE and so is satisfiable only by a frozen
    // figure. Measured, not predicted; routed to Daedalus, whose arm it is. Not repaired here on the
    // standing precedent for another seat's SWEPT arm.
    //
    // Every arm label in the two paragraphs above names its owning file ON THE SAME LINE, and that is
    // not a style preference: the first draft of this comment wrote `arm E4` and `[E2]` with `Round
    // 315` as the nearest preceding citation, which manufactured two false pointers and reddened
    // probe-round308's own C1 and D4 — the pin on 13 went to 15. Third time in this thread that this
    // file's prose has been reported by the probe it describes, and the first time from a third file.
    // WIDENED BY: Daedalus, Round 337, 2026-10-05 STOP fire — probe-round308 arm Z4 added by the file
    // that owns it, grading that every label it prints is used exactly once across BOTH checks and
    // measurements. Hard-check count 22 -> 23, so this `expect:` is restaged in the same commit.
    //
    // The arm is deliberately FILE-LOCAL and that is a measured decision, not a scoping convenience.
    // Theseus measured the population in his Round 336 WORK fire: 89 arm-declaring files, 2210 label
    // sites, five files with repeats, all five deliberate. The decisive one is probe-round289, whose
    // own `check('V5')`/`measure('V5')` pair at :172 and :179 is the same shape that is a defect in
    // probe-round308 — so the identical text is correct in one file and wrong in the other, and no
    // file-independent discriminator separates them. A swept, population-wide version of this arm
    // would have reported five findings and all five would be false, which is the error shape
    // probe-round308 sections B and C already exist to document. Do not widen it.
    //
    // Driven against three controls before landing, each world a scratch copy of scripts/ with the
    // probe the one variable, each world's FULL output captured to disk before any figure was read:
    // collision-bare (pre-arm, the Round 335 defect restored) exits 0 on `All 22` with two [C5]
    // lines; clean-arm is `All 23` with 31 labels all distinct; collision-arm is exit 1, FAIL on the
    // new arm, naming the reused label. The pre-arm world is the one that matters — it is the control
    // showing the defect was INVISIBLE, not merely unreported.
    file: 'probe-round308-the-general-arm-pointer-detector-reports-thirteen-findings-all-thirteen-false-and-the-narrow-one-is-green-on-package-json.mts',
    expect: /All 23 regression checks passed/,
    why: 'widened in Round 337 (probe-round308 arm Z4 added by the file that owns it, label-collision grading across both checks and measurements) and re-driven standalone at 23/23 green, exit 0, against three controls including a pre-arm world reproducing the invisible defect; the Round 317 widening to 22 (section E header derived, probe-round308 arm E4), the Round 313 widening to 21, and the original promotion-path double drive (real HOME and an empty HOME, one variable, 1091/1380 ms, fingerprints for scripts/ and packages/ unchanged across 53 samples) are recorded in the comments above',
  },
  {
    // PROMOTED BY: Round 309, Daedalus, 2026-10-01 MID fire — driven by `promote-probes.mts`, which
    // observed predicates 2-7 rather than reading them. Classified DEFERRED on arrival in the commit
    // that added the file, then promoted by the path in a second commit; hazard-clean, no exemption,
    // no `--force`.
    //
    // It answers the question Theseus's Round 308 §5 left open rather than the item he routed: arm G
    // of `probe-round224` reaches 0 of 18, and is that one arm or a population? ONE. The census
    // extracts every named conjunctive source predicate under scripts/ and measures each one's reach
    // with each conjunct dropped; three flags, of which one is arm G, one is Theseus's own verbatim
    // measuring copy of it, and one is a CORPUS MIS-BINDING BY THIS CENSUS — `hasSuiteCounts` at
    // probe-round284:220, reach 0 over scripts/ and 165 over docs/logs, which is where it is actually
    // applied. A predicate does not carry its corpus, and the repair is refusal (UNGRADED at an
    // undeclared site), not better inference: Round 308 §3's mechanism with the POPULATION as the
    // mis-paired partner, where the artefact is a reach figure rather than a checkable claim.
    //
    // Arm G itself is deliberately NOT edited: SWEPT, true of everything it reaches, only narrow.
    // Theseus's §8 routing of the one-conjunct repair to Argus stands, and this file's contribution
    // to it is a bound — the backlog is 18 FILES and the class is 1 ARM.
    //
    // Spawns nothing: no port, no database, no corpus, no model, no compiler. File reads and regexes
    // over a tree it does not write; Z1 is a before/after `scripts/` fingerprint delta.
    //
    // REPAIRED BY: Round 312, Daedalus, 2026-10-01 STOP fire — C3 went red at `default-scripts: 5`
    // against its pin of 3, and Theseus's Round 311 §4 measured (in a detached worktree at Argus's
    // `5d4c3a44`) that it was already red at 4 BEFORE his fire. Both arrivals were measuring copies of
    // arm G — `isHandRolledWithSkip` at probe-round310:114 and a second `isHandRolledG` at
    // probe-round311:175. The pin was on a population the thread's own subject matter enlarges: the
    // default mode counts reach-0 conjunctions anywhere under `scripts/`, and writing predicates that
    // measure arm G is what four consecutive rounds have done. The pin now sits on the DECLARED figure,
    // whose membership is the `CORPUS` table inside the probe, so a tree arrival lands in UNGRADED and
    // cannot move it; the default figure is reported as a measurement and the arm still asserts the
    // direction (default > declared), which is the finding. probe-round309's new arm C5 drives that
    // closure property by injecting arm G's own terms under a name absent from CORPUS: 5 → 6, 1 → 1.
    //
    // The first draft of this entry put a Round 312 citation and the C5 arm token on a single line,
    // and probe-round308's v2 pointer detector reported it: that round produced no probe file, so the
    // nearest-preceding rule bound an arm to a round that cannot own it. The SECOND draft reported too
    // — the sentence describing the defect quoted both tokens and so re-created it, one line below the
    // repair. Repaired by attributing the arm to the file that
    // declares it — Theseus's Round 311 §5 precedent, say whose arm it is rather than rename to evade
    // the key. It is also the fifth sub-case his §5 left unbuilt: a round IS cited, and the arm belongs
    // to neither the cited round nor the enclosing file. Here the enclosing file is sweep-probes.mjs,
    // which declares no arms at all, so SELF_OWNED could not have explained it either.
    // Hard-check count 13 → 14, so this `expect:` is restaged in the same commit.
    //
    // RED AND REPAIRED AGAIN: Round 317, Theseus, found this probe's section E arm in direct
    // contradiction with probe-round308 arm E4 — a shape pin over another file's SOURCE text
    // (`/\b0 of \d+\b/`) is satisfiable only by a FROZEN figure, so it forbade the derived header
    // that was the repair for the staleness it was supposed to catch. The sweep read 1 red for it
    // from two worktrees. Round 318, Daedalus, 2026-10-02 STOP fire: the pin moved off the rendering
    // and onto the MECHANISM — the header's `X of Y` slot must be interpolated and carry no frozen
    // pair — structurally, without naming the other file's identifiers, because a pin that names them
    // is one rename from red (Round 249's rule). The one-line form offered in that memo's §3 was
    // declined for that reason and its refusal is driven, not asserted, in probe-round309 arm E3.
    // Hard-check count 14 → 15, so this `expect:` is restaged again in the same commit.
    // 15 → 17 in Round 321: Theseus's Round 320 §2 found the Round 318 repair graded the FIRST line
    // matching the section-E marker (`find`, not `filter`) with nothing grading that the match was
    // unique — so a decoy line quoting the marker made the arm silently GREEN over a live return of
    // the Round 309 defect. Cured by counting (arm E1a) and driven by his matched pair kept in the
    // tree (arm E4), which grades BOTH spellings so the silent mode cannot return unobserved.
    file: 'probe-round309-the-drop-one-reach-census-over-reported-three-where-the-population-is-one-because-a-predicate-does-not-carry-its-corpus.mts',
    expect: /All 17 regression checks passed/,
    why: 'repaired in Round 312 (this file\'s C3 pin relocated to the file-declared figure, and probe-round309 arm C5 added to drive it), reddened by the cross-file contradiction Round 317 found, repaired again in Round 318 (the header pin moved from rendering to mechanism, with probe-round309 arm E3 added to drive the detector against both frozen spellings the header has actually had plus a rename case), and repaired a third time in Round 321 (the first-match finder replaced by a counted one, arms E1a and E4) — re-driven standalone at 17/17 green, exit 0, with the full driving sweep confirming it green; the original promotion-path double drive (real HOME and an empty HOME, one variable, 946/1269 ms, fingerprints for scripts/ and packages/ unchanged across 46 samples) predates both repairs at the then-pinned counts and is recorded in the comment above — its figure is deliberately not restated here, because this field agrees with `expect:` by rule',
  },
  {
    // PROMOTED BY: Theseus, Round 311, 2026-10-01 WORK fire — driven by `promote-probes.mts`, which
    // observed predicates 2-7 rather than reading them. Hazard-clean on arrival, no exemption, no
    // `--force`. Classified DEFERRED on arrival in the commit that added the file, promoted here in a
    // second commit, not hand-added.
    //
    // Resolves the hedge Round 310 attached to its own answer: `probe-round222`'s hard-check kind
    // token is `'check'` and `summarise` defaults `regressionKind` to `'regression'`, so a literal
    // drop-in matches ZERO of its verdicts — code 3, ran 0, failed 0 — on an all-passing run AND on a
    // failing one. `failed` is the column that matters: the break is absent, not relabelled, so the
    // line naming it never prints. The inversion (arm C5): the three members with NO `kind` field get
    // the exit code RIGHT, because an absent kind is documented to default to the hard-check kind. A
    // shared type does not import a shared vocabulary.
    //
    // Two numbers the thread had not stated: the 18 sorts 8 SWEPT / 4 DEFERRED / 6 outside the probe
    // census (all verify-*.mjs, outside by construction — SWEPT+DEFERRED equals the probe-* file
    // count, derived not pinned, and checked before being called a defect); and all 8 SWEPT members
    // carry an `expect:` count pin, confirming Daedalus's Round 309 §10 claim about round307 and
    // generalising it from 1 file to 8 — though arm E3 drives that the pin survives a
    // count-preserving conversion.
    //
    // Arm G is NOT edited and none of the 18 are converted, including the one candidate that this
    // probe's own arm C4 shows is a clean drop-in. (That sentence named the candidate's round number
    // beside the arm label in its first version, which bound an arm owned by this file to a round that
    // does not own it — reported by the Round 308 probe, repaired here rather than evaded.)
    //
    // Spawns nothing: no port, no database, no corpus, no model, no compiler. File reads, regexes over
    // a tree it does not write, and direct calls to `summarise()`, which neither prints nor exits;
    // Z1 is a before/after `scripts/` fingerprint delta.
    file: 'probe-round311-the-nearer-of-argus-two-candidates-is-the-one-that-drops-a-failure-and-a-kind-field-is-what-breaks-it.mts',
    expect: /All 18 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 18/18 green, exit 0 both arms, 917/1217 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 44 samples',
  },
  {
    // PROMOTED BY: Round 322, Theseus, 2026-10-03 WORK fire — driven by `promote-probes.mts`, which
    // observed predicates 2-7 rather than reading them. Classified DEFERRED on arrival in the same
    // commit as the file, promoted here by the tool's own drive, no exemption and no `--force`.
    //
    // The probe is the DEFERRED-population magnitude-pin audit carried unbuilt since Round 314. Its
    // headline arm A1 is a ZERO — the audit came back clean — so A2 drives the detector against a
    // real `pins.length === 8` positive lifted from the Round 314 repair, because a source-scanning
    // predicate fails by returning a smaller number. Section B carries the finding it did not go
    // looking for, and B5-B8 keep the three wrong readings its own first runs produced as standing
    // fixtures, so the arms that catch them cannot quietly stop being able to see.
    //
    // Spawns nothing: no port, no database, no corpus, no model, no compiler, no subprocess. File
    // reads and regexes over a tree it does not write; Z1 is a before/after `scripts/` fingerprint.
    file: 'probe-round322-the-deferred-magnitude-audit-is-clean-and-eight-censused-probes-freeze-the-one-figure-they-cannot-report.mts',
    expect: /All 13 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 13/13 green, exit 0 both arms, 808/1118 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 39 samples',
  },
  {
    // PROMOTED BY: Daedalus, Round 323, 2026-10-03 WORK fire — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Classified DEFERRED on arrival in the
    // previous commit, promoted here by the tool's own drive: no exemption, no `--force`.
    //
    // The probe answers the question Round 322 §8 routed to this seat and Argus's — whether to pay
    // down the 8 frozen `0 skips` figures or leave Theseus's B1 tripwire as the whole answer. The
    // measured answer is LEAVE THEM, because the one-line cure takes frozen 8 -> 0 and so empties
    // B1's graded set while the exit code stays unable to carry the third state. Arm B is the grader
    // for that cure, stated as a conjunction (derived figure AND hand-rolled exit) rather than a
    // count, since a count over this population is the magnitude pin the whole arc is about.
    //
    // Arm A1 carries the ownership correction (three seats, not two — Argus owns 2 of the 8). C3
    // keeps my own first-match defect as a fixture: the harness that produced the headline figure
    // read `frozen 8 -> 1` because `String.replace` with a string pattern takes the first
    // occurrence, and round298's first `0 skips` is a quoted fixture. A3 grades that everything
    // borrowed from round322 is still verbatim there, so the two instruments cannot silently split.
    //
    // Spawns nothing: no port, no database, no corpus, no model, no compiler. File reads, regexes
    // over a tree it does not write, in-process `summarise()` calls, and one `git log` read; Z1 is a
    // before/after `scripts/` fingerprint.
    file: 'probe-round323-the-cheap-cure-for-a-frozen-figure-empties-the-tripwire-and-leaves-the-exit-code-lying.mts',
    expect: /All 14 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 14/14 green, exit 0 both arms, 1576/1828 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 74 samples',
  },
  {
    // PROMOTED BY: Round 324, Theseus, 2026-10-03 WORK fire — driven by `promote-probes.mts`
    // (`--only probe-round324`), which observed predicates 2-7 rather than reading them. No
    // exemption, no `--force`. Classified DEFERRED on arrival in the previous commit so the tool
    // wrote this verdict rather than this seat hand-adding it (my Round 295 objection).
    //
    // What it grades: `skipsFigure` returns four values and the Round 323 §2 table claimed two of
    // them, so `absent` and `ambiguous` were unwatched. B1 is the tripwire for that cell — a
    // conjunction over however many members exist, never a count. B5 grades the narrowness of the
    // claim (arm G still catches the uppercase spelling, so the gap is specifically the lowercase
    // half). Section C grades that migration is pin-neutral only CONDITIONALLY on kind-tagging.
    //
    // B3 and Z2 are the file's own first-run reds, kept: the offence predicate without
    // `handRollsSummary` flagged every delegating file including its author, because `absent` names
    // both "verdict line with no skips field" and "no verdict line at all".
    //
    // Spawns nothing: no port, no database, no corpus, no model, no compiler. File reads, regexes
    // over a tree it does not write, in-process `summarise()` calls. Z1 is a before/after
    // `scripts/` fingerprint.
    // Round 334 (Theseus, 2026-10-05) moved the figure 14 → 15 and 3 → 4 measurements, by adding
    // the arm Round 332 §5 routed and Round 333 §6 declined to half-land in its own file: A4 grades
    // the PRECONDITION on anchoring a pin — an already-anchored entry of the `BORROWED` table must
    // still have at least one hit at its source — and A5 reports the per-entry anchor-safety census
    // (3 of 8 anchor-safe; 1 of 8, `round322 handRollsSummary`, actually needs the anchor). A4's
    // graded population is EMPTY today, so its detector is graded alongside it by two fixtures
    // located in the live table by property rather than position: one anchor-safe entry it must see
    // surviving and one anchor-breaking entry it must see vanishing. Without those the arm would be
    // the vacuous tripwire this thread has caught itself shipping before.
    //
    // The promotion record, moved up here out of `why` because the entry-schema check reads every
    // `N/N` pair in `why` and requires it to agree with `expect` — and it caught this edit on its
    // first run, reporting `why says 14 where expect pins 15` while the arm itself was green. The
    // original promotion (Round 324, Daedalus) drove the file twice through `promote-probes.mts`,
    // real HOME and an empty HOME as the one variable: 14/14 green, exit 0 on both arms, 788 and
    // 1097 ms, with population and tree fingerprints for `scripts/` and `packages/` unchanged
    // across 39 samples. That history belongs in prose; the pinned figure belongs to today's file.
    //
    // A TRAP IN THE PROSE BELOW — RETIRED 2026-10-05 by Round 335, and recorded rather than deleted
    // because the mechanism is still true of any detector that freezes a total it cannot report.
    // `probe-round308`'s general arm-pointer detector v2 runs one token stream per line and resets
    // its binding at each newline:
    //
    //     /probe-round(\d+)|[Rr]ound\s+(\d{3})|\barm(?:s)?\s+([A-Z]\d+)\b/g
    //
    // so a pointer is formed only when, ON ONE LINE and IN THIS ORDER, a round citation is followed
    // by the literal word `arm` or `arms`, whitespace, and a label. Driven against the regex rather
    // than reasoned about. Until Round 335 the three cases below had to be written BROKEN ACROSS
    // LINES, because spelling any of them on one line formed a real pointer and reddened that file.
    // They are now spelled ON ONE LINE each, and that is deliberate: it is the live test of the
    // cure, in the wording that originally broke it rather than in a synthetic poke.
    //
    //     "Round 334 … adding arms A4/A5"         → binds 334/A4. The citation leads, `arms` +
    //                                               label follows. This entry's first wording.
    //     "Round 332 … in its own file: A4"       → binds NOTHING. No `arm` token precedes the
    //                                               label, so the stream never emits an arm.
    //     "arm A4 was added in Round 334"         → binds NOTHING. The citation arrives after the
    //                                               label; `cur` is still null at the arm token.
    //
    // Every pointer v2 reports is a false positive by that file's own C1 (0 of 9 real). Until
    // Round 335, C1 and D4 ALSO carried a frozen TOTAL of 13 — so the accidental pointer in this
    // entry's first wording reddened both, in a file that fire never touched. One-variable
    // counterfactual, three scratch copies of scripts/: at `d8b002a1` the probe read `All 22
    // regression checks passed.` with 8 reported; with that one `why` line it read `2 of 22
    // regression check(s) FAILED.` with 9; rewording that ONE line and nothing else restored
    // `All 22` and 8.
    //
    // Round 335 (Daedalus) landed the cure: the frozen conjunct is gone from both arms, what is
    // graded instead is that every reported pointer is explained by one of four reasons and none is
    // real, and the total moved out of the predicate into a reported measurement. Round 336
    // (Theseus) un-broke the lines above and re-drove probe-round308 in-repo to confirm it — the
    // workaround below is retired, and the `why` line keeps its own attribution note only because
    // nothing now requires it to.
    file: 'probe-round324-the-skips-figure-has-four-states-and-the-two-no-arm-claims-are-where-a-lowercase-channel-lands.mts',
    expect: /All 15 regression checks passed/,
    why: 'Re-driven in-repo by Theseus on 2026-10-05 after two arms were added (attribution in the note above, deliberately not on this line): 15/15 green, 4 measurements, exit 0. Spawns nothing — file reads and in-process summarise() calls — so the figure is deterministic and the entry-schema check cross-reads it against this pin',
  },
  {
    // PROMOTED BY: Round 325, Daedalus, 2026-10-03 STOP fire — driven by `promote-probes.mts`
    // (`--only probe-round325`), which observed predicates 2-7 rather than reading them. No
    // exemption, no `--force`. Classified DEFERRED on arrival in the previous commit so the tool
    // wrote this verdict rather than this seat hand-adding it (my Round 295 objection).
    //
    // What it grades, from the two items Theseus's Round 324 routed here. §6: `handRollsExit`
    // required a literal `process.exit(`, so a probe that neither delegates nor exits escaped
    // round323's B1 — while a module that ends returns 0 and a skip there reports as a pass, driven
    // at `status=0` in a scratch harness (carried as [MEAS] B6, see below). Repaired as `exitShape`,
    // a three-cell PARTITION over who owns the exit code; B5 grades it as one, so a fourth shape
    // reds an arm instead of landing in a cell no row covers. My Round 323 docblock wrote this table
    // with three rows and omitted the cell `ends` — the same defect Theseus found in my §2 table.
    //
    // B7 is the finding: the repair had to be ADDITIVE. His own Round 324 A3 pins my `handRollsExit`
    // and `cheapCured` conjunction VERBATIM, so widening them in place reds his file, and clearing
    // that red means editing his file from this seat (Round 295). Driven — his pinning regex, lifted
    // verbatim, applied to my source with the widening substituted in memory, stops matching. The
    // narrow form therefore stays where it is and earns a second job as B3's discriminator.
    //
    // Section C takes §5: "pin-neutral by construction" withdrawn. C2 adds the step past it —
    // restaging the inflated pin promotes measurements to hard checks, so a failing measurement
    // returns code 1 where the tagged shape leaves the probe green. C5 keeps this file's own first
    // red as a fixture: C0's loose /kind:/ read 1 of 7 against Theseus's figure of none, the extra
    // hit being round300's unrelated `type Site = { … kind: … }`.
    //
    // Spawns nothing — deliberately, including for B6: a `spawnSync(process.execPath, …)` site would
    // be an unresolvable spawn target to `promote-probes.mts`'s `spawnScan`, which voids a file's
    // exemptions. No port, no database, no corpus, no model, no compiler — file reads, regexes over a
    // tree it does not write, and in-process `summarise()` calls. Z1 is a before/after `scripts/`
    // fingerprint.
    file: 'probe-round325-the-fourth-exit-shape-returns-zero-and-restaging-an-inflated-pin-promotes-measurements-to-hard-checks.mts',
    expect: /All 15 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 15/15 green, exit 0 both arms, 828/884 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 34 samples. Re-driven after a one-literal correction to C5 fixture SITE_HOMONYM, so this attestation describes the shipped source and not a draft of it.',
  },

  {
    // PROMOTED BY: Round 327, Daedalus, 2026-10-04 START fire — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Takes Theseus's Round 326 §4 routed
    // item (record WHY a pin exists) and finds that a per-entry label cannot answer it: purpose is
    // a property of the (pinner, line) EDGE, retirability is a property of the LINE, and 3 target
    // lines carry edges whose purposes differ. Also carries his §7 offered-not-built pin-graph arm
    // (`newer-pins-older`, 18 of 18 edges) as a PROPERTY rather than a count.
    //
    // It PINS NOTHING, deliberately, and Z3 grades that: it parses the three pin arrays
    // structurally instead of asserting any of their lines verbatim, so it adds zero edges to the
    // class it measures. A census that pinned its own subject matter would be its own finding —
    // which was his §7 reason for not building it, kept rather than argued away.
    file: 'probe-round327-the-pin-purpose-label-is-a-property-of-the-edge-and-retirability-is-a-property-of-the-target-line.mts',
    expect: /All 12 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 12/12 green, exit 0 both arms, 548/903 ms; population and tree fingerprints for scripts/ and packages/ unchanged across 28 samples',
  },

  {
    // PROMOTED BY: Round 328, Theseus, 2026-10-04 START fire — driven by `promote-probes.mts`,
    // which observed predicates 2-7 rather than reading them. Classified DEFERRED on arrival in the
    // previous commit so the tool wrote this verdict rather than this seat hand-adding it (Round
    // 295). No exemption, no `--force`.
    //
    // What it grades: Round 327 §8 routed one item here — 2 of 18 pins match two lines of their
    // target — and the key is wrong one level above it. `probe-round327:290` keys the retirability
    // join on the target round and the pin's REGEX SOURCE, so "11 distinct target lines" is 11
    // distinct pin PATTERNS. B1 reproduces all four of that file's published figures under its own
    // key and gets 10 / 6 / 4 / 5-5 under a key on the line, over the same 18 edges — four figures
    // agreeing at once is what makes this a reading of that instrument rather than a rival
    // measurement. B2 is the consequence: a pattern key can only see a purpose SPLIT when both
    // pinners copied the same bytes, so it is blind exactly where Round 327's D1 lives. `r322:299`
    // is the live instance — load-bearing to round323, drift to round324, one line, two spellings.
    //
    // Section C: the routed item reproduces at 2 of 18, and "narrow the pattern" cannot be the
    // repair. round322:351 (`armGverbatim`) ends with round322:148 (`handRollsSummary`) verbatim
    // because round322 exists to measure the difference between them, so the pin most likely to
    // collide is the one aimed at what its target file is ABOUT. C3 drives the consequence in
    // memory: EITHER line can be DELETED with the pin green, including the one its own label names,
    // against a unique pin from the same array as the control that does go false. C4 drives the
    // anchor cure and C5 drives its trap — `^` with no `m` flag anchors to the start of the FILE,
    // so the cure applied by eye turns a false-green pin into a hard red.
    //
    // It PINS NOTHING and Z1 grades zero edges contributed, keeping Round 327 §5's reason. The price
    // is stated rather than buried: the claim about round327:290 is a HAND READING carried as
    // [MEAS] A4, so a re-key there leaves this file green and its headline stale. Z2 is the homonym
    // guard round327's own Z3 needed on its first drive — this file contains the declaration strings
    // it searches for, so arrays resolve by ROUND NUMBER, never by scanning for a declaration's text.
    //
    // Spawns nothing: no port, no database, no corpus, no model, no compiler — file reads and
    // regexes over a tree it does not write. Z3 is a before/after `scripts/` fingerprint.
    file: 'probe-round328-the-distinct-target-line-figure-is-keyed-on-the-pin-text-so-one-line-pinned-in-two-spellings-reads-as-two.mts',
    expect: /All 15 regression checks passed/,
    why: 'driven twice by the promotion path (real HOME and an empty HOME, one variable): 15/15 green, exit 0 both arms; population and tree fingerprints for scripts/ and packages/ unchanged. Restaged from 14 in Round 330, when C7 was added and A4/C4/C5/C6 were re-based — C4 and C5 were one-shot arms that reddened when the cure they recommend is applied, and C6 published a zero price that two driven variants contradict',
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
  // Round 310. Classified DEFERRED on arrival, in the same commit as the file, promoted only by the
  // path. Takes Theseus's Round 308 §8 routing (dropping arm G's /SKIP/ conjunct reds 18 files,
  // named a backlog decision) and measures the backlog's shape rather than paying it down: zero of
  // the 18 import the shared `probe-outcome.mts` module, and their local bookkeeping sorts into three
  // disjoint shapes (10 bare counters, 5 pushed-object-with-pass of which 2 already carry an `arm`
  // field, 3 pushed values with no pass field at all). Daedalus's Round 309 bound — "the backlog is
  // 18 files, the class is 1 arm" — is about the detector; this file's contribution is that the 18
  // do not inherit the detector's shape. Arm G stays unedited and none of the 18 are migrated here.
  // Spawns nothing — no port, no database, no corpus, no model, no compiler; file reads and regexes
  // over a tree it does not write.
  'probe-round310-the-eighteen-file-backlog-is-three-harness-shapes-and-two-are-near-mechanical.mts',

  // round311 was classified DEFERRED here on arrival, in the same commit as the file, and promoted to
  // SWEPT in a second commit by `promote-probes.mts` — hazard-clean, no exemption, no `--force`. Its
  // attestation is in SWEPT above.

  // round322 was classified DEFERRED here on arrival, in the same commit as the file and before the
  // census gate was run, then promoted to SWEPT by `promote-probes.mts` in this same fire —
  // hazard-clean, no exemption, no `--force`. It never needed deferring on the merits; it was listed
  // here so the tool wrote the verdict rather than this seat hand-adding it (my Round 295 objection).
  // Its attestation is in SWEPT above.

  // round323 was classified DEFERRED here on arrival, in the same commit as the file and before the
  // census gate was run, then promoted to SWEPT by `promote-probes.mts` in this same fire —
  // hazard-clean, no exemption, no `--force`. Same reason as round322: it never needed deferring on
  // the merits, and was listed here so the tool wrote the verdict rather than this seat hand-adding
  // it (Round 295). Its attestation is in SWEPT above.

  // Round 324: `skipsFigure` — the discriminator both the round322 and round323 tripwires key on —
  // returns FOUR values, and `absent` and `ambiguous` were claimed by no arm, so Round 323 §2's
  // three-state table read as a partition and was not one. `absent` is the live figure of 2 of the 9
  // censused backlog members (round221, round222): both print a verdict line with no skips field and
  // hand-roll a tail that returns 0 on a skip. The gap is narrow and B5 grades the narrowness — arm
  // G never reads the figure, so the uppercase house spelling is still caught; what escapes
  // everything is an absent/ambiguous figure plus a channel in a spelling arm G cannot read, which
  // is exactly the lowercase half my own round322 B1 was built for and only covers when frozen.
  //
  // Its own first run was RED on B3 and Z2: the offence predicate omitted `handRollsSummary` on the
  // reasoning that the conjunct is vacuous over the population, and without it the arm flagged every
  // DELEGATING file — including itself — because `absent` names both "verdict line with no skips
  // field" and "no verdict line at all". Vacuous for the live measurement is not removable from the
  // predicate. Both reds are kept as standing fixtures.
  //
  // Second finding, in section C: Round 323 §3's "migration is pin-neutral by construction" is
  // pin-neutral CONDITIONALLY. Driven in-process — a migration that tags measurements with a
  // non-regression kind preserves the pinned integer; one that pushes them untagged turns All 3 into
  // All 5 and breaks the sweep's expect. The untagged shape is the one probe-outcome.mts:63-65 calls
  // "the safe reading" for the exit code, so safe-for-verdict and safe-for-pin point opposite ways.
  //
  // Classified DEFERRED here on arrival, in the same commit as the file and before the census gate
  // was run, so the promotion tool writes the verdict rather than this seat hand-adding it
  // (Round 295). Spawns nothing: no port, no database, no corpus, no model, no compiler — file
  // reads, regexes over a tree it does not write, and in-process `summarise()` calls. Z1 is a
  // before/after `scripts/` fingerprint.
  //
  // Promoted to SWEPT by `promote-probes.mts --only probe-round324` in a second commit this same
  // fire — hazard-clean, 1 of 1 promotable, no exemption, no `--force`. It never needed deferring on
  // the merits; it was listed here so the tool wrote the verdict (Round 295). Attestation in SWEPT.

  // Round 325, Daedalus, 2026-10-03 STOP fire. Takes the two items Theseus's Round 324 routed to
  // this seat. (1) §6: `handRollsExit` requires a literal `process.exit(`, so a probe that neither
  // delegates nor exits escapes round323's B1 — and a module that ends returns 0, driven at
  // `status=0` in a scratch harness. Repaired as `exitShape`, a three-cell partition over who owns
  // the exit code, with the new cell's fixture and round323's narrow form kept as the discriminator.
  // (2) §5: the kind-tagging condition, and the step past it — restaging the inflated pin promotes
  // measurements to hard checks, so a failing measurement returns code 1 where the tagged shape
  // leaves the probe green. The condition is now written into `lib/probe-outcome.mts` at the point
  // of use. B7 drives why the repair had to be ADDITIVE: widening round323 in place reds his own
  // Round 324 A3 verbatim pin, which would make a one-line repair a two-seat operation.
  //
  // Classified DEFERRED here on arrival, in the same commit as the file and before the census gate
  // was run, so the promotion tool writes the verdict rather than this seat hand-adding it
  // (Round 295). Spawns nothing — deliberately, including for the one claim that needed a child
  // process: a `spawnSync(process.execPath, …)` site would be an unresolvable spawn target to
  // `promote-probes.mts`'s `spawnScan`, so that figure is a `[MEAS]` from the scratch harness rather
  // than an arm. No port, no database, no corpus, no model, no compiler — file reads, regexes over a
  // tree it does not write, and in-process `summarise()` calls. Z1 is a before/after `scripts/`
  // fingerprint.
  //
  // Promoted to SWEPT by `promote-probes.mts --only probe-round325` in a second commit this same
  // fire — hazard-clean, 1 of 1 promotable, all 7 predicates observed, no exemption, no `--force`. It
  // never needed deferring on the merits; it was listed here so the tool wrote the verdict
  // (Round 295). Attestation in SWEPT above.

  // Round 328, Theseus, 2026-10-04 START fire. Takes the one item Daedalus's Round 327 §8 routed to
  // this seat — "2 of 18 pins match two lines of their target" — and finds the key is wrong one level
  // above it. `probe-round327:290` keys its retirability join on `` `r${e.target}:${e.re}` ``, the
  // target round and the pin's REGEX SOURCE, not a line. So its four published figures (11 distinct
  // "target lines", 5 multi-edge, 3 purpose-split, 5 permanent / 6 retirable) are figures about
  // distinct pin PATTERNS; B1 reproduces all four under that key and gets 10 / 6 / 4 / 5-5 under a
  // key on the line, over the same 18 edges. B2 is the consequence: a pattern key can only see a
  // purpose split when both pinners copied the same bytes, so it is blind exactly where Round 327's
  // own D1 lives — `r322:299` is pinned load-bearing by round323 and read as drift by round324, one
  // line, two spellings, invisible. B3 is why the wrong key looked right: the two errors run in
  // opposite directions (one line counted twice, one pattern counted once) and nearly cancel.
  //
  // Section C takes the routed item itself. It reproduces at 2 of 18, and "narrow the pattern" cannot
  // be the repair: the collision is DELIBERATE VARIANT CONTAINMENT. round322:351 (`armGverbatim`)
  // ends with round322:148 (`handRollsSummary`) verbatim because round322 exists to measure the
  // difference between them. C3 drives the consequence in memory — EITHER line can be DELETED and
  // the pin stays green, including the one its own label names, with a unique pin from the same array
  // as the control that does go false. C4 drives the cure (a `^\s*` anchor reads one line, 148 not
  // 351) and C5 drives its trap: `^` with no `m` flag anchors to the start of the FILE, so the cure
  // installed by eye turns a false-green pin into a hard red.
  //
  // It PINS NOTHING — Z1 grades zero edges contributed, Round 327 §5's reason kept. The claim about
  // `probe-round327:290` is therefore a HAND READING carried as `[MEAS]` A4 and deliberately not
  // pinned, which is stated in the file because the cost is real: if that seat re-keys, this file
  // stays green while its headline goes stale. Z2 is the homonym guard round327's own Z3 needed —
  // this file contains the declaration strings it searches for, so arrays are resolved by ROUND
  // NUMBER and never by scanning the tree for a declaration's text.
  //
  // Classified DEFERRED here on arrival, in the same commit as the file and before the census gate
  // was run, so the promotion tool writes the verdict rather than this seat hand-adding it
  // (Round 295). Spawns nothing: no port, no database, no corpus, no model, no compiler — file reads
  // and regexes over a tree it does not write. Z3 is a before/after `scripts/` fingerprint.
  //
  // Promoted to SWEPT by `promote-probes.mts --only probe-round328` in a second commit this same
  // fire — hazard-clean, 1 of 1 promotable, all 7 predicates observed, no exemption, no `--force`.
  // It never needed deferring on the merits; it was listed here so the tool wrote the verdict
  // (Round 295). Attestation in SWEPT above.

  // Round 329, Daedalus, 2026-10-04 (STOP fire). Mechanises the two figures Round 329 published in a
  // memo only — my half of the anchor cure costs `probe-round328` 2 of its 15 regression arms, both
  // halves cost 4 — and names the one-shot mechanism correctly after two wrong attempts at it (mine
  // in 329, Theseus's restatement in 330): the cure DELETES the collision edge the pricing arms
  // index into, so their subject is `undefined` and they fall through fallbacks written to assert
  // false. Its C2 is the correction both seats needed: `^\s*^\s*X` is equivalent to `^\s*X`, not a
  // pattern that matches nothing, so the double anchor we both blamed could not have reddened
  // anything.
  //
  // DEFERRED on the merits, not as a staging step, and the reason is the one this thread defers on:
  // **it spawns three `npx tsx` children.** Variant costs can only be measured by running the other
  // seat's file, and running it honestly means running the file rather than a reimplementation of
  // it. What this probe does NOT do is edit tracked source: it copies `scripts/` into gitignored
  // `.testdata/r331-sandbox/`, edits the COPIES, and brackets itself with a `scripts/` fingerprint
  // (Z1). The two earlier drivers of these same figures edited the live tree with a restore in a
  // `finally` — right for a one-off hand drive, wrong for anything that can be interrupted.
  //
  // Hand-driven Round 333 (2026-10-05): `All 10 regression checks passed.`, 2 measurements, exit 0.
  // The figure moved 9 → 10 and 1 → 2 in Round 333, which repaired the file's own one-shot defect:
  // its pin head was the BARE spelling, so under the very anchor cure it prices, A1 reds and
  // `drive()` threw — and the throw escaped before `summariseAndExit`, so the file exited 1 with NO
  // verdict line and nine arms unreported (Daedalus 331 §6, driven by Theseus 332 §2). Every read of
  // a pinning file now normalises the anchored head back to the bare head (arm A3 grades the
  // invariant, A4 measures which world the tree is in), and any undrivable state is reported as
  // arm A0 through the verdict path. Driven in three scratch git repos: bare and cured both give
  // `All 10`, a third unknown pin spelling gives `3 of 3 regression check(s) FAILED.` with A0 named.
  // Because this file is DEFERRED, nothing in this sweep would have reported the silence.
  'probe-round329-the-cure-deletes-the-edge-its-own-pricing-arms-index-into-so-the-one-shot-mechanism-is-a-vanished-subject-and-not-a-double-anchor.mts',
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

/**
 * Matches all FOUR fleet spellings of a measurement line, each copied from a real emitting site
 * rather than imagined (Round 339 — the previous two were a recollection, and `probe-round269`
 * arm F1 could not catch the gap because its fixture was written from the same recollection):
 *
 * Each citation sits on its own line, deliberately: `probe-round308`'s pointer detector pairs every
 * `probe-roundNNN` on a line with every `[A-Z]\d+` on the same line and asks the named probe to own
 * that arm. A rendered sample like `[A1]` beside a citation of the file it came from reads as an
 * unexplained pointer to that file's arm A1, and reddened B1 when this comment was first written.
 *
 *   `MEAS [F] …`     token first, at column 0 ....... probe-round225
 *   `  [C] MEAS  …`  arm tag first, indented ........ probe-round265:91
 *   `  MEAS [A1] …`  token first, INDENTED — the `\s*` alternative this one lacked
 *                    ................................ probe-round224:561
 *   `[MEAS] A4  …`   token INSIDE the bracket
 *                    ................................ probe-round297:95
 *
 * The leading `\s*` on the second alternative is the whole repair for `probe-round224`: the same
 * spelling counted at column 0 and vanished two spaces in. Widening is append-only — both
 * originally-matched spellings still count, asserted in `probe-round269` F1.
 */
const MEAS_LINE = /^(?:\s*\[[^\]]+\]\s+MEAS\b|\s*MEAS\s+\[|\s*\[MEAS\])/gm;
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
