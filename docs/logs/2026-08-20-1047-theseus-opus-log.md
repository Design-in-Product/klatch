# Session log — Theseus (Opus) — 2026-08-20

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

---

## 10:47 — START fire. Round 66: check 5 built and shown to go red; the marking-first swap is cancelled; the arm underneath it is bounded by a list length.

**Cost: zero API calls, zero live runs, no server started, no `.testdata/` left behind.**

### Briefing

Pulled state was current (wrapper synced). `docs/COORDINATION.md` read. `docs/mail/` listed —
one memo addressed to me since my 8/19 STOP fire:
`daedalus-to-theseus-cc-xian-team-leak-fixed-and-the-constraint-your-lead-clause-needs-already-exists-on-the-wrong-list-2026-08-20.md`. Read in full, acted on in this same
fire, replied in this same fire.

### Work

**1. Item 2 of Daedalus's order — the fifth filler constraint — built.**
`scripts/verify-filler-constraints.mjs` gains check 5: every filler **user** turn must be
interrogative (exact) and must match none of 9 handover-voice patterns (recogniser). Applies to
`FILLER`, `FILLER_LONG` and `FILLER_LEAD`. Assistant-turn hits are a **note**, not a failure —
the direction that plants a competing antecedent for *"what I handed you"* is user→agent.

Four states run, not asserted:

| Run | Expect | Got |
|---|---|---|
| Real corpus | 0 | **0** — 32 pairs, 9 patterns, no notes |
| Doctored corpus (`FILLER[4]` → *"Here is the freeze calendar — hold onto it."*) | 1 | **1** — both halves fired; ack tripped the tier-2 note |
| Verifier, `here is` pattern blunted | 2 | **2** — pattern named |
| Verifier, `on` re-admitted to the transfer-verb particles | 2 | **2** — false positive named |

**2. My first fixture gate passed the control it existed to fail — found by running it.**
Version one pooled its evidence: one flat list of should-match sentences, asking whether *any*
pattern fired. Blunting the `here is` pattern still exited **0** and still printed *"recogniser
fixtures passed"*, because its example was independently caught by the hold-something pattern.
Round 59's rule applies to the gate over a recogniser, not just the recogniser. Fixed
structurally — each pattern carries its own example in the same tuple. **Reading the gate would
not have found this.** Recorded because it is the transferable half.

Three of the seven must-stay-clear fixtures are real corpus rows that the **draft patterns fired
on**: `"restore test passed on both shards"` (why the particle list excludes `on`), and
`handle` / `shorthand` (why `\bhanded\b` is bounded).

**3. Constraint moved out of one docblock into three, plus a script.** `FILLER`'s docblock now
carries the reasoning, `FILLER_LONG`'s inherits it, `FILLER_LEAD`'s *"owner-voice is not
machine-checkable and remains mine"* is corrected.
**`probe-recall-tool.mjs`: 30 diff lines, 0 outside a docblock comment** — mechanical proof no
arm field, seeded string or ordinal moved. Verifier re-parses to the same **32 pairs / 13 arms**.

**4. Daedalus's §4 accepted — the marking-first swap is cancelled.** His argument: at row 5
nothing has been handed over, so the restriction is a cataphor or a standing policy, never
restriction-on-a-known-item. The swap therefore varies direction **and** speech-act type. Correct,
and stronger than "the wording needs work" — the speech act is unavailable at that position at
any price in wording. His catch that my candidate's *"before I hand the **next** piece over"* is
falsified by the geometry is M's defect in my own hand, three rounds after I fixed it in L's.
Recorded as a **decision** in the round doc so a later fire finds the refusal, not the sketch.

**5. The question underneath it is about distance, not direction — and it is bounded.**
New `scripts/geometry-distance-arm.mjs` states the `evictedMarking` seeding loop as algebra and
**asserts the formulas against M's and N1's measured ordinals before reporting anything**
(total, seed row, restate row, marking row, both offer ranges — all exact on both arms).

- **Bound: `gapPairs ≤ fillerPairs − 9`**, from eviction against the 20-message carried window
  (`carried-context.ts:38`, read this session).
- **`FILLER` (12 pairs) caps the marking at offered-start +5.** Observed forward-read appetite is
  **+6…+10**. The cheap one-field version of the arm **cannot produce the miss it exists to
  produce** — dead on arithmetic, one fire instead of five opus runs.
- **`FILLER_LONG` (17) reaches +15**, clear of the ceiling by 5 — at the cost of `leadPairs: 20`
  against a `FILLER_LEAD` of 15 (**five new pairs**) and an 80-row seed. Both offers then exceed
  `RECALL_MAX_EXPAND_ROWS = 30` (`recall.ts:647`, read this session), so reading one whole takes
  two expand calls. Flagged, not fatal.
- **Identity worth keeping:** the offers are equal when `2L − 2 = 2F + 3`, RHS odd — so they can
  **never** be exactly equal in this family. Closest is `L = F + 3`, leading dearer by one. At
  `F = 12` that is `L = 15` — arm N1. Round 63 reached it by Daedalus's parity argument; the
  identity reaches it mechanically. Two independent routes to the same number.

**Nothing built, nothing pre-registered, nothing spent.** The distance arm's go/no-go is xian's.

### Deliverables

- `docs/research/round66-fifth-filler-constraint-and-the-distance-arm-bound-2026-08-20.md`
- `scripts/geometry-distance-arm.mjs` (new)
- `scripts/verify-filler-constraints.mjs` (check 5 + per-pattern fixture gate)
- `scripts/probe-recall-tool.mjs` (docblocks only)
- `docs/mail/theseus-to-daedalus-cc-xian-team-check-five-is-in-my-gate-failed-its-own-control-and-your-confound-kills-the-swap-2026-08-20.md`

Suite not re-run: nothing under `packages/` touched, and no test imports either script.
`node --check` clean on both scripts. `.testdata/` deleted after the controls.

### Wrap verification

Per CLAUDE.md Session Wrap Protocol. **Read from `origin/main` after `git fetch`, not from the
worktree** — the worktree can hold a file the push did not carry.

**Step 1 — `git log origin/main --oneline -5`:**

```
c223725 feat(probe): enforce filler owner-voice as check 5; derive the distance arm's bound
aaf0da5 mail: reply to Daedalus — check 5 built, my gate failed its own control, and the swap is cancelled
72e746c log: 8/20 START wrap verification, read from origin/main after the push
e9a4084 fix(probe-scratch-server): kill the process group and verify teardown by port; feat(import): report project matches
a2dac82 mail: replies to Theseus (leak fixed, §4 read) and Iris (project-match server side landed)
```

Both of my commits are on `origin/main`. Mail was committed separately and pushed to `main`
ahead of the work commit, per the worktree mail discipline.

**Step 2 — `git ls-tree -r origin/main --name-only`, filtered:**

```
docs/mail/theseus-to-daedalus-cc-xian-team-check-five-is-in-my-gate-failed-its-own-control-and-your-confound-kills-the-swap-2026-08-20.md
docs/research/round66-fifth-filler-constraint-and-the-distance-arm-bound-2026-08-20.md
scripts/geometry-distance-arm.mjs
scripts/verify-filler-constraints.mjs
```

Four of four present in the pushed tree. `scripts/probe-recall-tool.mjs` and
`docs/COORDINATION.md` are modifications, carried in `c223725`'s diffstat.

`ls -d .testdata` → **No such file or directory.** No scratch left behind, no server started
this fire, so nothing to leak — and that is stated from a filesystem check, not from having
intended it. (The 8/19 STOP fire is the reason that sentence is worded this way: a `pgrep` for
the wrong pattern returned no match and was read as absence.)

**Step 3 — this log is committed and pushed after Steps 1 and 2, as the final record.**

**Nothing is claimed as delivered.** Delivery is the wrapper's and it logs the outcome.
