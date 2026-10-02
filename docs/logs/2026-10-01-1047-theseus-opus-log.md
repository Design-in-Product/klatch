# Theseus session log — 2026-10-01 10:47 PT (START fire, Opus 5)

Round 308. Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`, pushing to `origin/main`.

---

## 10:47 — Briefing

Pulled state as the wrapper left it: `662ae581` (Daedalus, Round 307 coord+log). Read
`docs/COORDINATION.md` Theseus section and `ls docs/mail/`. One new memo addressed to me, filed this
fire's day-part by Daedalus:

- `daedalus-to-theseus-argus-cc-…-i-took-the-three-round-item-and-it-splits-and-the-arity-half-we-all-called-covered-is-fourteen-of-eighteen-2026-10-01.md`

Read immediately per the mail discipline. Three things in it for me: (a) his §3 count correcting a
sentence all three of us repeated, (b) his §4 catch that my Round 306 §5 repair reached the first of
two occurrences, (c) his §4 **offer** of a narrow `.js`-token detector, with first claim to me.

No other logs for today from me — this is my first fire of 2026-10-01. (iris 0720, calliope 0831,
argus 0902, daedalus 0918 logs already present.)

## 10:50 — Baseline, taken before touching anything

`npm test` → typecheck clean ×4 (0 `error TS` lines), server **140 files / 2174 passed / 1 skipped**,
client **25 / 325 passed / 13 skipped**, `CENSUS OK`, census PASSED. Byte-identical to his Round 307
§1.

`probe-round307` driven standalone exactly as he left it: **All 17 regression checks passed, 5
measurements, 0 skips.** Every arm green including C6.

## 10:55 — His §3 verified independently, before reading his arm

Wrote my own counter over the three `.d.mts` files rather than driving his, so the confirmation is not
his instrument agreeing with itself. Found all three pairs from disk first
(`strip-source.d.mts`, `tsx-required.d.mts`, `sweep-probes.d.mts`):

| file | `export declare const X: (` | `export declare function X(` | names |
|---|---|---|---|
| strip-source | 2 | 0 | 4 |
| tsx-required | **0** | **4** | 8 |
| sweep-probes | 12 | 0 | 14 |
| total | **14** | **4** | **26** |

**18 signatures, 26 names, 14 reachable by `probe-round303` B3's key.** His §3 reproduces exactly.
Accepted without argument.

His §4 second-occurrence catch also verified: `scripts/tsconfig.json` now carries both corrections
with attributions, mine at line 58-59 and his at 61-65.

## 11:00 — The offer: measured rather than argued

My Round 306 §5 refused a general arm-label detector because *"the population is small and the cost of
a wrong grade is high."* **"The population is small" was an unguarded prose claim about a number I
never measured**, which is the same defect shape as his §3 one level up. Measured it:

- **235** arm mentions in source (non-docs, 451 files)
- **82** bindable to a round by a nearest-preceding rule
- **145** not bindable by any line-local rule

Then built the general detector to see what it does.

**v1** (round keyed on `probe-roundNNN`, cross-product with arm labels on the line): **5 reported.**
Read all five. All five false — the arm's true owner is a round cited on the same line in the *other*
spelling (`Round 297 arm A4`), or a seat (`my arm G4`), or the enclosing file (`arm C1` inside
`probe-round295`).

**v2** (both spellings, nearest-preceding binding): **82 bound, 8 reported.** Read all eight. All
eight false, for four distinct reasons — and the categories are themselves measurable:

| reason | n |
|---|---|
| template-literal arm label (`probe-round285` → `` `B1.${name}` ``) | 1 |
| round cited, no probe file (266, 270, 271) | 4 |
| possessive binding (`my arm G4`) | 2 |
| owned by the enclosing file | 1 |

**13 reported across two versions, 0 real.** General form, and I believe it is new to the thread's
list: a source-scanning regex fails by returning a smaller number; the same root cause in a **binder**
does not drop the row, it binds it to the wrong partner and emits the mis-pairing as a finding.

## 11:10 — THE FINDING on the offer itself

Implemented §4's detector as worded — *"the arm's own check string **contains** the token `.js`"* — and
tested it against the real defect (the pointer reverted to `C1`) rather than only against E1. Driven:

```
arm C1 claim: "with a copy of the real scripts/package.json beside them, …"
  naive  .includes('.js')          → true   ← GREEN on the defect
  token  /\.js(?![A-Za-z0-9])/     → false  ← RED, correct
```

`package.json` contains `.js`. **The offer as worded passes the pointer it exists to reject.** Had I
taken it as written and checked it against the live note only, it would have gone SWEPT green and
guarded nothing. Fifth instance of the standing note *give every detector a known positive copied from
the real call shape*, and the first where the known positive is a defect this fleet actually shipped.

## 11:15 — probe-round308, first run: three reds, all mine

Built `scripts/probe-round308-the-general-arm-pointer-detector-reports-thirteen-findings-all-thirteen-false-and-the-narrow-one-is-green-on-package-json.mts`.
First run: **3 of 13 FAILED**, and every red was the instrument.

1. **The probe was inside its own population.** Its docblock cites rounds and arms, and arm B2 mints a
   `probe-round304 arm Q9` pointer **as a string** to serve as the known positive. Figures moved to
   **7 / 11 / 18** instead of 5 / 8 / 13. `probe-round225`'s title arriving inside the fire whose
   subject is false pointers. Fixed by excluding `SELF` **and** adding arm A2, which drives the delta
   in both directions so the exclusion is reported rather than a silent line in a file walk.
2. **My v1 explainer covered 3 of 5** because it only looked for the short round spelling; the long
   spelling (`probe-round269 arm G4` on `sweep-probes.mjs:96`) and the enclosing-file case were
   outside it. Two "unexplained" rows were my explainer's narrowness, not the notes'. Widened and
   re-drove rather than reporting 5-with-2-unexplained.
3. **A1's first draft pinned the count** (`mentions > 200`), which stales the moment the file lands.
   Changed to gate on the ratio (unbindable > bindable), which is the load-bearing half.

Added a fourth explanation category (`SELF_OWNED`) that no possessive marks. Re-drove: **15/15 exit 0**,
`npx tsc -p scripts/tsconfig.json` clean (0 bytes).

## 11:20 — Committed and pushed incrementally

`bae81b27` — probe + DEFERRED classification on arrival in the same commit. Pushed to `origin/main`.
Pre-commit census gate caught the unclassified probe first; classified, then committed.

Promotion path run: `[PROMOTABLE] all 7 · exit 0 both arms · 934/1305 ms · 47 samples · scripts/ and
packages/ unchanged · graded databases unchanged`. Applied to SWEPT, removed from DEFERRED.

## 11:25 — Full sweep went RED, and it was me

`node scripts/sweep-probes.mjs` → **SWEEP FAILED — 26 of 28 green, 1 red, 1 blocked.**

Red: `probe-round224-a-skip-must-not-summarise-as-a-pass.mts`, arm G, naming my file. Drove round224
standalone to see the claim: *"no script under scripts/ still pairs a SKIP channel with a hand-rolled
checks passed."* Its predicate at `probe-round224:366`:

```js
/SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src)
```

My file printed a hand-rolled summary — **copied from `probe-round307`** — and declared a
directory-walk exclusion constant named `SKIP`. Three conjuncts, red.

**Repaired by converting to `summariseAndExit`**, the convention arm G exists to enforce, not by
renaming the constant. Renaming would have cleared the red and left the property untouched; recording
that I considered it and why I didn't.

## 11:30 — SECOND FINDING: arm G reaches 0 of 18

Measured arm G's reach on its own predicate and its own normaliser (`stripSource(src, false)`), copied
from `probe-round224:366` rather than paraphrased:

```
scripts/ scanned 163 · hand-rolled summary lines 18 · reached by arm G: 0
at the moment of the red: hand-rolled 19 · reached by arm G: 1   (mine)
```

**Arm G reaches zero.** `probe-round307`, `304`, `303`, `305`, `299` and 13 others print hand-rolled
summaries and are invisible to it, because one of its three conjuncts (`/SKIP/`) is a token with
nothing to do with the property. It is SWEPT, green, and guarding an empty set — **and its only live
hit in its entire history of reach was a false positive**, because a file-walk exclusion list is not a
skip channel.

His §3 one layer out, third occurrence of that form in two days: the restatement here is the arm's own
**label**. **Arm G not edited** (his `probe-round303` B3 precedent — SWEPT, true of what it reaches,
only narrow). **Routed to Argus**, mine if nobody takes it; dropping the conjunct reds 18 files, so it
is a backlog call rather than a one-liner. Arm E1 here is a deliberate **pin on zero**: the moment arm G
reaches a real hand-rolled probe, E1 reds too.

Added section E (E0 MEAS, E1/E2/E3). Re-drove through the promotion path at 18 arms rather than editing
the 15-arm attestation, because an attestation has to describe the file in the tree:
`[PROMOTABLE] all 7 · exit 0 both arms · 1091/1380 ms · 53 samples`.

## 11:35 — Verification

- `npm test`: typecheck clean ×4 (0 `error TS`), server **140 / 2174 / 1**, client **25 / 325 / 13**,
  `CENSUS OK`, census PASSED — identical to the pre-change baseline taken this fire.
- `npx tsc -p scripts/tsconfig.json` → 0 bytes of output.
- `probe-round308` standalone: **All 18 regression checks passed**, 6 measurements, 0 skips.
- `probe-round224` standalone **after** the repair: **All 70 regression checks passed**, arm G PASS.
- `probe-round307` standalone: **All 17**, unchanged.
- Full sweep: **SWEEP BLOCKED — 27 of 28 green, 0 red, 1 blocked**, 107 deferred, 0 census problems.
  SWEPT 27 → 28, DEFERRED 108 → 107.

**The one blocked, named rather than left inside a figure:** `probe-round225` exits 3 because arm B
hard-skips — *"Port 3001 is held by another process; free it and re-run."* Environmental; nothing this
round touches a port. Not cleared: the holder is a dev server outside this worktree and freeing it is
not mine to do from a fire. Flagged because `SWEEP BLOCKED` is the sweep's headline and reads like a
regression to anyone skimming.

## 11:40 — Memo and coordination

Memo filed and pushed to `main` as its own commit per the worktree mail rule:
`docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-i-took-your-offer-and-it-is-green-on-package-json-and-my-own-refusal-reason-was-wrong-2026-10-01.md`

`docs/COORDINATION.md` Theseus section updated.

---

## Session Wrap Protocol verification

**Step 1 — commits on `origin/main`** (after `git fetch origin`):

```
$ git log origin/main --oneline -4
da8ad6f9 coord+log: Round 308 — START fire, the §4 detector is green on package.json and arm G reaches 0 of 18
b2b36c88 mail: Round 308 to Daedalus and Argus — the §4 detector is green on package.json, my own refusal reason was wrong, and arm G reaches 0 of 18
e12c4134 probe: Round 308 §E — my own probe reddened probe-round224 arm G, and arm G reaches 0 of 18
bae81b27 probe: Round 308 — the general arm-pointer detector reports 13 and all 13 are false; the narrow one is green on package.json
```

All four Round 308 commits are on `origin/main`. Nothing stranded in the worktree.

**Step 2 — deliverable files:**

```
$ ls scripts/probe-round308-*.mts
scripts/probe-round308-the-general-arm-pointer-detector-reports-thirteen-findings-all-thirteen-false-and-the-narrow-one-is-green-on-package-json.mts

$ ls docs/mail/theseus-to-daedalus-argus-*-2026-10-01.md
docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-i-took-your-offer-and-it-is-green-on-package-json-and-my-own-refusal-reason-was-wrong-2026-10-01.md

$ ls docs/logs/2026-10-01-1047-theseus-opus-log.md
docs/logs/2026-10-01-1047-theseus-opus-log.md
```

All three present.

**Step 3 —** this log committed last, as the final record.

### Open, carried to the next fire

- **Routed to Argus:** `probe-round224` arm G's `/SKIP/` conjunct. Reaches 0 of 18. Dropping it reds 18
  files — a backlog call, not a one-liner. Mine if nobody takes it.
- **Environmental, not mine to clear from a fire:** port 3001 held by another process, which hard-skips
  `probe-round225` arm B and makes the whole sweep read `SWEEP BLOCKED`.
- **Unmoved:** `probe-round295`'s marker (Round 297 §3 reason unchanged); the CLI end-to-end for
  predicate 8; the "2 of 12" intermittent in round250; predicate 8's write-then-restore blindness.

---

# Round 311 — WORK fire (2026-10-01 ~14:50 PT, Opus 5)

Same log file, second fire of the day. Worktree synced to `origin/main` by the wrapper at `694f71a5`.

## 14:50 — Briefing

`git fetch origin`, read `docs/COORDINATION.md` Theseus section, `ls docs/mail/`. Two new memos
addressed to me, both filed today:

- `daedalus-to-theseus-argus-…-your-arm-g-class-is-one-arm-and-the-census-that-measured-it-over-reported-three-2026-10-01.md` (Round 309)
- `argus-to-theseus-daedalus-…-i-took-your-routed-item-and-the-18-file-backlog-is-three-harness-shapes-only-two-near-mechanical-2026-10-01.md` (Round 310)

Both read immediately. Both route back to me. Round 309 bounds the arm-G class at one arm; Round 310
sorts the 18-file backlog into three harness shapes and names two near-mechanical candidates —
**with a hedge it explicitly does not resolve**: "a reader still has to confirm `kind` is used the way
`probe-outcome.mts` expects before calling it free." That hedge became this round.

**Baseline defect, caught immediately.** My first `npm test` was piped through `tail -40`, which gave
me tail's exit 0 and discarded the entire server suite. Re-ran unpiped before using any figure. The
numbers I would have published were correct; the defect was having no evidence for half of them.

Baseline (unpiped): typecheck clean ×4 (0 `error TS`), server **140/2174/1**, client **25/325/13**,
`CENSUS OK`, swept 29, deferred 108.

## 15:00 — Measurement

Reproduced before reading either arm: arm G off `probe-round224:366-367` read from disk → **0 with
`/SKIP/`, 18 dropped**. Argus's 10/5/3 partition → **exact, disjoint, sums to 18**. His field-name
claim → **holds**, 2 of 5 carry `{arm, check, pass}` and they are the pair he named.

Then drove `summarise()` from `probe-outcome.mts` with each candidate's real pushed shape:

```
round217 all-pass (kind 'regression')          → code 0  ran 1  failed 0
round217 one-fail (kind 'regression')          → code 1  ran 1  failed 1
round222 all-pass (kind 'check',  default)     → code 3  ran 0  failed 0
round222 ONE-FAIL (kind 'check',  default)     → code 3  ran 0  failed 0   ← the finding
round222 ONE-FAIL (regressionKind:'check')     → code 1  ran 1  failed 1
round221 one-fail (no kind, no arm)            → code 1  ran 2  failed 1   ← the inversion
```

The finding is `failed = 0`, not `code = 3`. The break is absent, not relabelled.

Two numbers nobody had stated: the 18 sorts **8 SWEPT / 4 DEFERRED / 6 in neither list** (the 6 are
all `verify-*.mjs`, outside the census by construction — checked before calling it a defect), and
**all 8 SWEPT members carry an `expect:` count pin**, which survives a count-preserving conversion
(driven for all 8).

## 15:10 — Three defects of mine

1. First reading of the 8 pins printed `expect = {}` for all eight — `JSON.stringify` of a RegExp is
   `'{}'`. One step from reporting that no sweep pin exists, which would have retired a real cost.
2. Arm D2's first version pinned `=== 137`; classifying this file DEFERRED in the same commit would
   have made it 138. Daedalus's Round 309 §5 defect 4 verbatim, one round later. Caught before the
   amended census ran. Total derived from the tree now.
3. Typecheck refused my `SWEPT` cast (`readonly SweptEntry[]`). No cast used now.

## 15:20 — The sweep came back with TWO reds, and they belong to different fires

```
SWEEP FAILED — 27 of 30 swept probes green, 2 red, 1 blocked
```

**round308 (mine, repaired).** Two sentences I wrote this round named the candidate by round number
with `arm C4` beside it on one line — binding an arm owned by my file to a round that does not own it.
One in the probe docblock, one in the SWEPT attestation at `sweep-probes.mjs:653`. **The second only
became visible after the first was fixed**, because each was counted once — my Round 306 §5 defect for
the second time, and I only avoided shipping it again by re-driving instead of assuming one edit
cleared the arm. This is the defect `probe-round308` is *about*, written into the docblock of the file
that cites it. Repaired by saying whose arm it is, not by renaming to evade the key. Back to its pinned
figures exactly: v1 5, v2 8, 13, **All 18**.

**round309 (not mine, left standing).** C3 pins `default-scripts: 3 → declared-corpus: 1` and reads 5.
The obvious story is that I broke it. **I checked instead of assuming** — built a detached worktree at
Argus's `5d4c3a44` and drove round309 there:

```
at 5d4c3a44: 4 flags (isHandRolled, hasSuiteCounts, isHandRolledG, isHandRolledWithSkip)
             declared-corpus 1 · UNGRADED 4 → 1 of 13 FAILED.  Already red.
on my tree:  5 flags · declared-corpus 1 · UNGRADED 6
```

The 4th is `isHandRolledWithSkip` at `probe-round310:114` — Argus's file. Mine is the 5th. Round 310's
verification ran `--census`, which prints its own disclaimer that it cannot see a swept probe that has
started failing. Not repaired (another seat's SWEPT arm). Routed to Daedalus with a concrete
recommendation: pin the declared-corpus figure (stable at 1 across 3 → 4 → 5), not default-scripts,
which this thread's own subject matter increments.

Worktree removed with `git worktree remove --force`; `git worktree list` shows six, none under
`.testdata/`.

## 15:30 — After the repair

```
SWEEP FAILED — 28 of 30 swept probes green, 1 red, 1 blocked, 0 census problems, 108 deferred
```

The red is round309 C3 (above). The blocked is `probe-round225` — port 3001 held by a dev server
outside this worktree, cause read off its own output, unchanged since Round 291, not mine to free from
a fire. Flagged because `SWEEP FAILED` is the headline a skimmer reads.

`npm test` final: typecheck clean ×4 (0 `error TS`), server **140/2174/1**, client **25/325/13**,
`CENSUS OK`, swept 30, deferred 108 — identical to baseline.

---

## Session Wrap Protocol verification

**Step 1 — commits on `origin/main`** (after `git fetch origin`):

```
$ git log origin/main --oneline -4
2abea86d mail: Round 311 to Argus and Daedalus — the nearer candidate drops the failure, and round309 C3 was red before this fire
4caaeb5a repair: Round 311 — my own docblock and SWEPT attestation each manufactured the pointer defect probe-round308 exists to report
2a362950 promote: Round 311 to SWEPT — driven by the path, hazard-clean, no --force
fe90ed04 probe: Round 311 — the nearer of Argus's two candidates is the one that drops a failure, and the `kind` field is what breaks it
```

**Step 2 — deliverable files:** verified present with `ls` (output in the commit that adds this entry).

**Step 3 —** this log committed last, as the final record.

### Open, carried to the next fire

- **Argus's, cheaper than it looked:** `probe-round217` is a driven clean drop-in and is DEFERRED, so
  no pin is restaged. One file.
- **Argus's, now known to be a trap:** `probe-round222` must not be taken in the same pass without
  `regressionKind: 'check'`.
- **Daedalus's, RED right now:** `probe-round309` C3. Routed with a recommendation, not repaired.
- **Mine, named not taken:** Round 308's explainer lacks the fifth sub-case (a round cited AND the arm
  owned by the enclosing file). Widening it restages my own SWEPT pin, so it is a round of its own.
- **Environmental, not mine to clear from a fire:** port 3001 → `probe-round225` arm B hard skip.
- **Unmoved, mine:** `probe-round295`'s marker; the CLI end-to-end for predicate 8; the "2 of 12"
  intermittent in round250; predicate 8's write-then-restore blindness.

### Session Wrap Protocol — verified output, appended after the push

**Step 1:**

```
$ git fetch origin && git log origin/main --oneline -5
b0969d37 coord+log: Round 311 — WORK fire, the nearer candidate drops the failure and round309 C3 predates this fire
2abea86d mail: Round 311 to Argus and Daedalus — the nearer candidate drops the failure, and round309 C3 was red before this fire
4caaeb5a repair: Round 311 — my own docblock and SWEPT attestation each manufactured the pointer defect probe-round308 exists to report
2a362950 promote: Round 311 to SWEPT — driven by the path, hazard-clean, no --force
fe90ed04 probe: Round 311 — the nearer of Argus's two candidates is the one that drops a failure, and the `kind` field is what breaks it
```

All five Round 311 commits are on `origin/main`. Nothing stranded in the worktree.

**Step 2:**

```
$ ls scripts/probe-round311-…-and-a-kind-field-is-what-breaks-it.mts \
     docs/mail/theseus-to-argus-daedalus-…-your-c3-was-red-before-my-fire-2026-10-01.md \
     docs/logs/2026-10-01-1047-theseus-opus-log.md docs/COORDINATION.md
docs/COORDINATION.md
docs/logs/2026-10-01-1047-theseus-opus-log.md
docs/mail/theseus-to-argus-daedalus-cc-xian-janus-calliope-iris-your-nearer-candidate-is-the-one-that-drops-the-failure-and-your-c3-was-red-before-my-fire-2026-10-01.md
scripts/probe-round311-the-nearer-of-argus-two-candidates-is-the-one-that-drops-a-failure-and-a-kind-field-is-what-breaks-it.mts
```

All four present.

**Step 3:** this confirmation block is the last thing committed.

---

## 19:47 — Briefing (SWEEP fire, Round 313)

Pulled state is `dbf1b2e2`. New mail since my 14:50 fire: Daedalus's Round 312 memo
(`…your-routed-c3-is-repaired-and-the-pin-belonged-on-the-population-my-own-file-owns…`), read in full
this fire. The two 14:47 memos were already answered in the 15:09 memo. The 19:20 commit
`ae2f67d0` is **Iris's** STOP fire, not mine (author checked: `Iris (Klatch) <iris@klatch.local>`); it
appended to her own 07:20 log.

My 19:47 slot is the **SWEEP** day-part per `docs/mail/theseus-to-pard-duty-cycle-cadence-2026-08-09.md`:
consolidate the day's findings into one written state ahead of Calliope's 21:30.

## 19:50 — Baseline and independent verification of Daedalus's close

`npm test`, unpiped: typecheck clean ×4 (0 `error TS`), server **140/2174/1**, client **25/325/13**,
`CENSUS OK`, swept **30**, deferred **108** — byte-identical to his §5 and to Argus's reproduction.

- `probe-round309` standalone: **All 14.**
- `probe-round308` standalone, before any edit of mine: **All 18**, v2 reporting **8** at its pin.

Routed item independently confirmed closed. Argus reached the same result at ~18:0x from his own
direction; I did not read his §1 before running mine.

## 19:52 — Took the fifth explainer sub-case (my own item, named in Round 311 §5 and left unbuilt)

Section F added to `probe-round308`: F0 `[MEAS]`, F1/F2/F3 checks. Count 18 → 21, `expect:` restaged in
the same commit.

- **F1 — the sub-case is live, not hypothetical.** 3 of the 8 pointers v2 reports are owned by neither
  file named on the line: `probe-round260:417 r259/G4`, `sweep-probes.mjs:44 r260/G4`,
  `sweep-probes.mjs:267 r271/E1`. Two are in a file that declares no arms at all. **They predate the
  pin** — they sat inside C1's pinned 13, explained by categories that are true of the citation and
  silent about the arm, so the pin could never have surfaced them.
- **F2 — the widening cannot resolve what it classifies.** Owner counts for the 8 labels: 45, 2, 12, 7,
  44, 42, 12, 36. Arm labels are per-file, not a namespace. "Say whose arm it is" is now a measured
  conclusion rather than a preference.
- **F3 — the control.** A label no probe defines is foreign-owned by the predicate too, so the owner
  count is the classifier: 0 = a real defect, ≥ 1 = a pointer the line cannot bind.

## 19:54 — THE FINDING against me, caught by the control

F3 **failed on its first run**. Writing `ownersOf('Q9')` into the file made `probe-round308` the sole
owner of the label it mints to prove nobody owns it — the any-spelling key reads a quoted label
anywhere in a file as a definition. Section A excludes this file from the **hits** population for
exactly this reason; the **owner** side needed the same exclusion and did not have it. Self-scanning
corpus, fifth consecutive round in this thread, new dimension of the file that documents it. A
one-sided "0 owners" measurement would have printed 1 and given me no reason to look.

Second-order: the exclusion moved F2's figures (46 → 45, 37 → 36, …). Those are `[MEAS]`, not pinned.

## 19:56 — Correction to Daedalus's §7, and it is sharper than the error

His offer: *the known positives exist in `4ebeb929`'s diff rather than needing to be minted.* Checked
with `git show 4ebeb929:scripts/sweep-probes.mjs` — they are **not** there; both occurrences were
repaired before committing. But line 653 of that blob carries **both** a `Round 312` citation and an
`arm C5` token on one line and is **not reported** — because `probe-round309` is cited *between* the
wrong round and the arm label and the nearest-preceding rule rebinds there. **The repair is an
insertion, not a separation.** So the commit holds a known *negative*, and a good one; F1 now drives
both sides at an unchanged count of 21 (no second pin restage).

Deliberately did **not** put the `git show` check inside the probe: it would convert the file from
"spawns nothing" to "spawns git" for one immutable fact. Run by hand, reported as hand-run.

## 20:00 — Verification

- `probe-round308` standalone after the last edit: **All 21**, 7 measurements, 0 skips, exit 0.
- `npx tsc -p scripts/tsconfig.json`: clean, 0 bytes.
- `git diff --stat -- packages/`: empty.
- `npm test` after the last edit: typecheck clean ×4, server **140/2174/1**, client **25/325/13**,
  `CENSUS OK`, swept 30, deferred 108 — identical to baseline.
- Full driving sweep: **`SWEEP BLOCKED` — 29 of 30 green, 0 RED, 1 blocked, 0 census problems, 108
  deferred.** `probe-round308` green **in the sweep channel at All 21**. The sweep was launched after
  the `expect:` restage and before the F1 extension; both source states produce the same 21, and the
  standalone drive after the final edit is the authority for the final tree.
- The 1 blocked is `probe-round225`, cause read off its own output: `exit 3 … established 32 of its
  checks and skipped 1 arm(s). This is not a pass.` Port 3001, held outside this worktree, unchanged
  since Round 291, not mine to free from a fire.
- Census ran as the pre-commit hook on all three commits: `CENSUS OK`, `why`/`expect` agreement
  included (my `why` states 21, the pin is 21).

Discipline: no port bound, no database opened, no corpus read, no model called, nothing under
`packages/` executed, no compiler spawned by the probe. Three fixtures minted, all under gitignored
`.testdata/`, removed before arm Z2 runs. Scratch prototype `.testdata/r313-scratch.mts` and the run
logs under `.testdata/` are gitignored and not deliverables.

## Open, carried to the next fire

- **Argus's, cheap, unclaimed a fourth round:** `probe-round217`, a driven clean drop-in, DEFERRED so
  no pin restages.
- **Argus's, a trap:** `probe-round222` must not be converted without `regressionKind: 'check'`.
- **Mine, closed this fire:** the fifth explainer sub-case — built, with the honest result that it
  classifies and cannot resolve.
- **New, named not taken:** the three foreign-owned rows are *correctly explained for the wrong reason*
  inside a pinned total. Whether an explainer that partitions should assert each row's reason rather
  than only the union's size is a thread design call, not a repair; it would redden C1 by construction
  on the first disagreement.
- **Unmoved, not mine:** `probe-round225`'s port-3001 hard skip.
- **Unmoved, mine:** `probe-round295`'s marker; the CLI end-to-end for predicate 8; the "2 of 12"
  intermittent in round250; predicate 8's write-then-restore blindness.
