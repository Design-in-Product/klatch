# Theseus session log — 2026-08-28 (START fire, 10:47 PT)

**Model:** claude-opus-5 · **Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` · **Branch:** `claude/theseus-cycle`
**Spend:** zero live turns, zero model calls, zero API spend. No product code; `packages/` untouched.

---

## 10:47 — Session start: briefing

Pulled state verified at HEAD `23b6fb6` (my own 8/27 STOP wrap-verification log). `git status` clean.
Read `docs/COORDINATION.md` (my section: status *available*, Round 106 the last unit) and swept
`docs/mail/`. One new memo addressed to me:

- `daedalus-to-theseus-cc-xian-team-the-self-check-is-built-and-your-own-call-order-table-breaks-round-98s-ten-of-ten-2026-08-28.md`

Two explicit asks, both costed at zero model calls: **§1** run the exit-code self-check on this seat
(his derived prediction: `PASS — 19/19`, exit 0), and **§4** read `toolCalls[].rendered` for the
non-second calls of the live N1 artifacts, which he believed were on this seat. Both actioned in this
fire.

## 10:48 — §1: self-check executed here, green

`node scripts/verify-verifier-exit-codes.mjs`:

```
A. exit 0 — real verifier, corpus present                          2 ok
B. exit 2 — real verifier, corpus absent                           5 ok
C. exit 1 — mutants of lib/premise-render.mjs (each KILLED)        9 ok
D. this harness's own denominator                                  3 ok
      ok  the copied REPO root is genuinely corpus-free (INCOMPLETE, exit 2)
      ok  this run and a corpus-free copy of it both report 19 — the denominator does not move
      ok  M5-pre-fix-accounting — KILLED: the pre-fix denominator does move (D2 is load-bearing)
            pre-fix 20 vs fixed 19 — the one that hid, and the one that does not

PASS — 19/19 assertions passed
```

Exit code read separately via `execFileSync` (the shell prompt path was blocked by the sandbox):
**`exitcode=0`**. His arithmetic (A 2 + B 5 + C 9 + D 3) lands. Nothing to revert.

## 10:49 — §4: the ask's premise is false, verified rather than recalled

Enumerated every `recall-probe-*.json` in `.testdata/` mechanically — 27 files, parsed, `arm` /
`dryRun` / `toolCalls.length` printed per entry.

**Every N1-armed entry on this worktree is `dryRun: true` with no `toolCalls`**: `Q1-N1`, `R94N1-N1`,
and the single N1 entry inside each of `R102{A,B,C}` and `R104{A,B}`. The only files here carrying
`toolCalls` are the ten live ones: `R94L{1..5}-Q` and `R106L{1..5}-R`.

Daedalus's seat holds two N1 files, both `dryRun: true` (his measurement this fire). **Neither seat
has them.** Not a search failure — Round 63 §9, read this session: *"The result JSONs live in
`.testdata/` and are deleted at end of fire."* Round 98 §6 already carried the limit forward. The
artifact-class read he wanted is permanently unavailable short of re-running N1 live.

## 10:50 — …but the question is answered anyway, from a table neither of us had re-read

Round 63's §2 per-call table is indexed on **every call**, not the second. Row count checked against
the doc's own header (*"17 tool calls in total"*): N1L1 4 + N1L2 3 + N1L3 3 + N1L4 3 + N1L5 4 = **17**.
No elision. Across all seventeen, the "offered by that render" column is two addresses or
`(miss, 0 rows)` — never the three-address / `excerptSeparators: 1` two-excerpt signature. Round 63
§9 states it independently.

**Falsifier does not fire. N1 = 5/5, Daedalus's ordinal-free 14/15 stands** — ten artifact-class
points, five permanently doc-class.

## 10:51 — R106L2 un-elided; his 12/15 is right

He declined to score L2 because my Round 106 §3 row elided its calls 3–5. Read from the live artifact
here: calls 1 Larkspur (1/1/0), 2 `ochre-marlin-44` (2/2/**1** — two-excerpt), 3 miss, 4 miss,
5 `codeword` (1/1/0), 6 **expand** `{from: 44, to: 76}`.

L2 is scorable, it *is* a break of Round 98's second-query rule, and the second-query rule scores
Q 5 + N1 5 + R 2 = **12/15** with denominator 15. (His §3 stated both "12/15" and "I'm not counting
it," which would give 12/14; the artifact resolves it in favour of the number he wrote.) Detail worth
keeping: the expand took `44-76`, the trailing address from **call 2's** render — not call 5's, which
offered `44-80`.

## 10:52 — My own refinement, formed and killed in the same fire

L2's four-call gap suggested a recency rule: *expands iff the most recent render before the decision
was not the two-excerpt neighbourhood.* Scored mechanically on all ten live runs.

**8/10 — worse than the ordinal-free rule's 9/10.** R L1 and R L5 kill it: both searched token-first,
saw the two-excerpt render on call 1, got a single-excerpt render on call 2, and still did not expand.

Keeper is the constraint, not the rule: **the suppression survives an intervening single-excerpt
render** (n=2, artifact-class). Residual, stated honestly: calls-after-last-two-excerpt-render runs
0 → 0/6 expanded, 1 → 0/2, **2 → no runs**, 3 → 1/1. Decay fits; so does "L2 is an outlier"; one
point does not discriminate.

This is also an argument for Daedalus's rule 4 made against myself — registered, the loss would be a
clean falsification; unregistered, it is a retrofit that happened to fail.

## 10:53 — Deliverables written

- `docs/research/round108-…-my-own-recency-rule-died-in-the-same-fire-2026-08-28.md` — the round doc.
- `docs/research/recall-arm-standing-rules-2026-08-28.md` — **rules 9 and 10 appended** (stability
  invariants need a companion correctness mutation; deleted-source figures stay doc-class and must be
  relabelled at every reuse, with the corollary to check whether an artifact was ever committed
  before asking another seat to read it — `.testdata/` is gitignored).
- `docs/mail/theseus-to-daedalus-cc-xian-team-19-of-19-and-the-n1-artifacts-are-gone-from-both-seats-2026-08-28.md`
  — reply, committed separately and pushed to `main` per the worktree mail discipline.

**Daedalus's §5 arm:** precondition 1 (the N1 read) is discharged and does not kill the arm.
Preconditions 2 (scoring rule registered in the docblock) and 3 (`expectation` string carrying the
authorisation) are not done. **No GO exists for it and nothing filed this fire asks for one.**

## 10:56 — Session wrap verification

**Step 1 — commits on origin/main:**

```
(see verification block appended below)
```

**Step 2 — deliverable files:** listed in the block below.
