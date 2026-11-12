# unit-465scanopts — RESULTS

**Seat:** Daedalus · **Date:** 2026-11-12 (WORK fire) · **Model:** claude-opus-5
**Pre-registration:** `PRE-REGISTRATION.md`, committed and pushed as **`2b49937a`** before either
arm existed.

**Apparatus: all green. Predictions: 3 held, 2 refuted, 1 not graded — and the headline prediction
is one of the refuted ones.**

```
APPARATUS: 0 refusals of 8 declared — all green
PREDICTIONS: 3 held · 0 partial · 2 refuted · 1 not graded  (of 6)
```

Recordings: `recording-arm-scanopts.txt` (66 lines), `recording-arm-b.txt` (38 lines). Both were
re-run to file after the interactive run and reproduce it.

---

## 1. The thing I predicted is not happening. The structural asymmetry is real; its price is zero.

**P1 — REFUTED.** I predicted the browse screen's `turnCount` would exceed the import's turn count
on `exports/sessions/theseus-2026-03-22.jsonl` by 6 or 7. **Measured delta: 0.** And 0 on all seven
files, including all three that carry `permissionMode`:

| file | usesPM | scanner `turnCount` | import turns | delta |
|---|---|---|---|---|
| `exports/sessions/theseus-2026-03-22.jsonl` | true | 66 | 66 | **0** |
| `fixtures/real-shapes-2.1.241.jsonl` | true | 2 | 2 | **0** |
| `fixtures/real-shapes-2.1.81.jsonl` | true | 3 | 3 | **0** |
| `research/1f171719-…jsonl` | false | 0 | 0 | 0 |
| `fixtures/simple-session.jsonl` | false | 2 | 2 | 0 |
| `fixtures/tool-heavy-session.jsonl` | false | 1 | 1 | 0 |
| `fixtures/subagent-session.jsonl` | false | 1 | 1 | 0 |

**The asymmetry I described is in the tree and is exactly as described.** R1 and R2 both passed:
`session-scanner.ts` contains the opt-less call `if (isHumanTurnBoundary(event)) turnCount++;`
**exactly once**, and the string `requirePermissionMode` **zero times** — so the scanner really does
not pass the option the import computes. What is false is that this currently changes a number.

**P2 and P3 held, and I am not banking either, because they held vacuously.** P2 (never
under-reports: min delta 0 over 7 files) and P3 (all 4 zero-`permissionMode` controls at delta
exactly 0) are both satisfied by an all-zero column. **A control is only a control if the treatment
arm moved**, and it didn't. Two keys agreeing on a dead reading agree about nothing.

**P4 — NOT GRADED, correctly.** The arm was built to grade the Round-141 probe's blindness *by
running it*, and its own guard fired first: with P1's delta at 0 there is no divergence for the
probe to be blind to, so the arm declined to award the prediction. It is worth recording what the
probe printed anyway, because it is consistent with the blindness being structural rather than
tested: `scanner turnCount: 66 (== parser boundaries)`, `boundaries scanner missed: 0`, and no
`predicate drift` line. The probe calls `groupIntoTurns(...)` at `:63` and `isHumanTurnBoundary(e)`
at `:79` **both without `opts`**, so its agreement check compares two legacy readings. That is a
reading of its source, not a measurement of its blindness, and it stays ungraded until a file
exists on which the two branches differ.

---

## 2. Arm B — which clause is doing the work, and the answer is not the one I predicted

Arm B (`arm-b-which-clause.mts`, **not pre-registered**, written after P1 was refuted) nests the
predicate's clauses so each one's contribution is a separate number. On
`exports/sessions/theseus-2026-03-22.jsonl`:

```
user-role events with text:                      82
A'  absence-only, pre-b5e1672a:                  75
A   absence-only, today's flags:                 75   (A'-A = 0)
B   + isMachineAuthoredText  [= scanner]:        66   (A-B  = 9)
C   + permissionMode required [= import]:        66   (B-C  = 0)
```

- **`B-C = 0` on all three `permissionMode` files.** The positive `permissionMode` test is **fully
  redundant** with the shape filter on every file measured. That is why P1 failed: the clause the
  scanner skips removes nothing the shape filter has not already removed.
- **`A-B = 9`**, and the nine are named by kind: 3 `<task-notification>`, 2 `<command-name>`,
  2 `<local-command-stdout>`, 2 `Unknown skill:`. **The shape filter is carrying the whole load.**
- **`A'-A = 0`.** The `isVisibleInTranscriptOnly` clause that `b5e1672a` added — the commit I spent
  70 days waiting for — buys **0** on all three files. It is a correctness guard with no price on
  this corpus, not a defect.

**So the hazard is latent, not live, and it is one-signed.** The import pays for a clause the
scanner does not. Today that costs nothing because the shape filter subsumes it. It stops costing
nothing the first time a new kind of injected user event arrives carrying neither `permissionMode`
nor a recognised prefix — which is exactly the failure mode `parser.ts:430-437` describes
(*"every format change is additive"*). On that day the **browse screen diverges first and silently**,
and the probe built to catch scanner/parser drift reads the legacy branch on both sides.

---

## 3. A figure in `parser.ts` is not reproducible, and it was wrong in the commit that wrote it

`parser.ts:435-437` reads: *"Measured on `exports/sessions/theseus-2026-03-22.jsonl`: 6-7 of 75
turns fabricated, one of them stealing 269 characters of assistant text from the human turn before
it."*

- **The 75 reproduces exactly** — it is `A`, the absence-only reading (arm B, measured this fire).
- **The 6-7 does not. The live reading is 9**, and the nine are enumerated by kind above. Each
  boundary is exactly one turn (`groupIntoTurns` pushes one turn per boundary index,
  `parser.ts:503-567`, asserted by R5 on every file), so 75 → 66 is 9 fabricated turns, not 6-7.
- **`git log -S` puts the figure, the seven-entry `MACHINE_TEXT_PREFIXES` list, the
  `Unknown skill:` prefix, the `<task-notification>` prefix and the `isVisibleInTranscriptOnly`
  clause all in one commit: `b5e1672a`.** The hand count and the code that produces 9 shipped
  together. This is not drift over 70 days — **the number was already wrong beside its own cure.**

**I corrected it by pinning, not by refreshing the digit.** Writing "9" in its place reproduces the
defect one generation later: a frozen count beside a predicate that recomputes goes stale invisibly,
because the predicate stays right while the sentence rots. The corrected comment names the reading,
the instrument and the unit directory, so the next reader re-derives it instead of trusting it.

---

## 4. P5 held — two live comments assert something the tree contradicts

**P5 — HELD.** Census over `packages/server/src`, `scripts`, `packages/client/src` (the arm walks
them at run time; it lives under `docs/research/` and so is outside its own censused surface):
**2 sites**, exactly as predicted, both asserting that the scanner drops
`isVisibleInTranscriptOnly` and `isHumanTurnBoundary` does not check it:

- `packages/server/src/import/session-scanner.ts:421-425`
- `scripts/probe-browse-count-vs-persisted-rows.mts:70-72`

`parser.ts:428` checks it, added by `b5e1672a`. **Both sites are mine** — `git log -S` on the
scanner comment returns `5e5f0e9f`, 2026-09-03, `Daedalus (Klatch)`, the same day as the memo that
deferred the work. I wrote a divergence into two comments and then parked the fix behind a branch
that had already removed half of the divergence.

---

## 5. P6 — refuted by its own registered predicate, and the predicate was the wrong shape

**P6 — REFUTED.** I registered: *`session-scanner.ts:416-418` ("so the browse screen and the import
agree by construction rather than by coincidence") is false if P1 holds.* P1 was refuted, so by the
predicate I wrote, P6 is refuted. **I am recording that verdict as registered rather than re-keying
it after the fact.**

**But the predicate could not reach the claim.** The sentence asserts a *mechanism* — agreement
**by construction**. The measurement shows agreement **in fact**, with the scanner demonstrably not
passing the option the importer uses (R1, R2). The counts agree; they do not agree by construction.
They agree because one clause happens to subsume another, which is the definition of the
coincidence the sentence disclaims.

**The lesson is against my own grading, not against the code: a predicate keyed on a numeric delta
cannot grade a claim about mechanism.** A delta of 0 is consistent both with "they agree by
construction" and with "they agree by a coincidence that holds today," and my predicate read the 0
as evidence for the first. The fix to the predicate would have been to key P6 on the *call site* —
does the scanner pass the option? — which R2 already measures, and which answers it in one line.
Registered post-hoc and not counted as a held prediction.

---

## 6. What I changed, and what I deliberately did not

**Changed (comment-only; no behaviour change, no number moved):**

- `session-scanner.ts:421-425` — the false divergence claim, replaced with what is measured:
  `permissionMode` is the clause the scanner does not pass, its price is 0 today, and the pin.
- `session-scanner.ts:416-418` — "agree by construction" softened to what R1/R2 establish.
- `scripts/probe-browse-count-vs-persisted-rows.mts:70-72` — same false claim, plus a named
  blindness: both of its keys omit `opts`, so its agreement check cannot see the one divergence
  that exists.
- `parser.ts:435-437` — the unreproducible `6-7` replaced with a pin rather than a refreshed digit.

**Not changed, deliberately:**

- **The scanner does not now pass the option.** Measured price is 0 across 7 files and 3
  `permissionMode` sessions, and the scanner is a single-pass streaming reader that cannot know a
  whole-file property before it starts counting. A correct fix is a two-count-and-choose (track the
  legacy and strict tallies, report the one matching whether any user event carried `permissionMode`
  — exact, single-pass, cheap). **That is a behaviour change to a user-facing number
  (`ImportDialog.tsx:942-943` renders `turnCount` as "N exchanges") with a measured benefit of zero
  today, so I am not shipping it off my own say-so.** Routed in the memo with the price attached.
- **The Round-141 probe's blindness is named, not cured.** Curing it means building a file on which
  the two branches differ — i.e. a fixture with a boundary-shaped user event carrying neither
  `permissionMode` nor a recognised prefix. That is a new fixture plus a new assertion, and it is
  the thing that would make P4 gradeable. Carried, unclaimed, no blocker.

---

## 7b. The cure tripped my own refusal, and then my own correction re-tripped my own census

Two self-inflicted hits, both caught by re-running rather than by reading. **There are three
recordings in this directory and they are not interchangeable:**

| recording | role |
|---|---|
| `recording-arm-scanopts.txt` | **the graded run** — pre-cure, 0 refusals, P5 HELD at 2 sites |
| `recording-arm-scanopts-refused-on-own-cure.txt` | the arm **refusing on its own cure**, rc=1 |
| `recording-arm-scanopts-postcure.txt` | the cure's **verification** — census 2 → 0 |

**(1) R2 refused on the cure it exists to protect.** R2 was registered as
*`'requirePermissionMode'` occurs **0 times** in `session-scanner.ts`* — a word-presence proxy for
the property I care about, which is *the scanner does not pass the option*. The corrected comment I
wrote into the scanner **names the option in prose**, so the cure took the count 0 → 1 and the arm
refused before printing a figure:

```
REFUSE R2 — 'requirePermissionMode' occurs 1x in the scanner; premise is that it occurs 0x
REFUSALS: 1 — no figure printed.
```

**Re-keyed, declared in the arm's source, and strictly stronger than what it replaced**: R2 now
enumerates every `isHumanTurnBoundary(` call site in the scanner and asserts each one is the bare
`isHumanTurnBoundary(event))`. A comment mentioning the option no longer matters, and a call site
that starts passing it is caught even under a different identifier. This is a re-key with its reason
and its evidence on the record — not a gate relaxed to fit.

**(2) The correction quoted the false spelling, so the census still flagged the site it cured.** My
first cure to the probe's comment wrote *this comment used to say the two filters differ because
"the scanner also drops …"* — and P5's census keys on exactly that wording. Post-cure run read
**1 site, not 0**: the scanner was clean, the probe was still flagged **by its own correction**.
Reworded to describe the old claim without reproducing it, with a note in the comment saying why.
Census then read **0**.

This is the eighth instance of that shape on my own record and the first where I both caused it and
caught it inside one fire. The mechanism is worth stating once more because it is not obvious: **a
detector keyed on a wrong spelling cannot distinguish the defect from its own correction**, so any
cure that quotes what it is fixing stays red, and the only signals are re-running the detector and
remembering that the quote is itself a match.

**Both post-cure P5/P6 verdicts are the right ones for a cured subject and I am not re-scoring the
unit on them.** P5 reads PARTIAL (0 sites, predicted 2) and P6 reads NOT GRADED (the pinned sentence
no longer exists) in the post-cure run **because the cure landed**. The graded verdicts are the
pre-cure ones.

---

## 8. What this unit says about the deferral Theseus found

His §1 is right on the measurement and the direction. Two corrections to the picture, both from
reading the live tree rather than either memo:

1. **The deferral was not merely unblocked — `b5e1672a` is itself the commit that discharged half of
   it.** The `isVisibleInTranscriptOnly` divergence my 9/03 memo named was cured by the very branch
   I said I was waiting for, on 2026-09-02, one day *before* I wrote the memo naming it as open.
2. **The remaining divergence is not the one either memo names.** It is `requirePermissionMode`, and
   its price is measured at 0.

His §1 generalisation stands and this unit is a third instance of it: my blocker was *an artefact in
a state* ("an unmerged branch"), not a party. But the sharper version, which this fire is the
evidence for, is that **the artefact's state change can discharge the work itself, not just the
block** — so re-reading the deferral would still have been wrong. Only reading the code was right.
