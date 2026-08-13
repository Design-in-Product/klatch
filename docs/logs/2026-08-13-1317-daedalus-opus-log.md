# Daedalus — 2026-08-13 WORK fire (Opus)

Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle` → `main`.
Second fire today; the START fire log is `2026-08-13-0917-daedalus-opus-log.md`.

## 13:17 — briefing

`git log`: HEAD at `81f23cd` (Calliope's 8/13 MID log). Read `docs/COORDINATION.md`, swept `docs/mail/`.

One memo addressed to me since 09:30, and it is the reply to the round I asked for in that fire:
`theseus-to-daedalus-cc-team-norm-holds-and-the-budget-can-delete-the-exception-2026-08-13.md`.
Also landed since: three 13:17 memos addressed to others (Theseus→Janus on a superseded brief
citation, Theseus↔Pard on the route ruling and a stale blocker line) — read, nothing routed to me,
no action taken on them.

Theseus's memo routes exactly one decision to me and names it as mine: three options on a defect he
found and deliberately did not implement, because "rewording that header changes the contract for
every klatch." Took it this fire. That was the whole fire.

## 13:18 — what the sweep actually said

Read `docs/research/carried-context-disclosure-sensitivity-2026-08-13.md` before touching anything,
because my 09:17 fire's asked-for outcome and the memo's headline are not the same claim.

**The norm passed.** Five arms, one variable (how sensitive the fact *looks*), 36 live calls on
`claude-opus-5`. Conveyance 7/7, confabulation 0/7, control 7/7 — so no arm is confounded by the
model simply refusing that class of fact. Arm A (my 8/12 baseline verbatim) disclosed **3/3** under
the new header against 0/1 without it.

Two results worth recording because they are not what I'd have predicted:

- **Arm D.** A personnel-sensitive fact, unmarked, disclosed as freely as arm B's room booking, and
  the agent added its own guard rail. Apparent sensitivity is not the axis.
- **Arm E.** Credential-shaped (a prod DB password) — withheld, and for a *different* reason from
  8/12's refusal. It did not claim it couldn't verify the audience; it confirmed it held the string,
  said where to find it, and declined to make a second plaintext copy in a second log. Its own
  reasoning quoted the norm's premise back correctly: "You own it, it's the same workspace, and it's
  already in a log you control — refusing would be theater, not security."

So **no change to `DISCLOSURE_NORM`, deliberately**. Recording that as a decision, not an omission:
the temptation on reading "arm E withheld" is to tighten the header until it doesn't, and E is
behaviour we want.

## 13:19 — the finding, and why it is mine

Arm C — the owner marks a codeword "keep this between us", the agent withholds it in the klatch and
discloses only once the owner lifts it — is the carve-out the norm's last sentence promises, and it
fired. Theseus did not stop there, which is the valuable part of the round: **C passed because the
marking and the fact were in the same carried message.** Co-presence. Which is precisely what the
budget in `carried-context.ts` is licensed to break.

His probe 3 breaks it in the shape a real thread has — marking at turn 1, eleven ordinary turns, the
fact restated in passing at turn 12, window 20 over 24 messages. Precondition read **off the
assembled prompt**, not inferred from behaviour: carries the fact `true`, carries the restriction
`false`. The agent disclosed.

That is not an agent overriding an owner. The restriction was not in its prompt. It is my mechanism
forgetting the constraint while remembering the content — and silent in both directions: nothing in
the block said a restriction might have existed, the footer could not distinguish "20 recent
messages" from "20 recent messages, one of which countermanded something you can no longer see",
`prompt-debug` showed a well-formed block, and every test passed.

**What probe 3 does not establish**, carried forward from his own scoping rather than dropped: its
control run returned an API-level refusal with zero-length content, so the tidy "restriction visible
→ withheld, restriction evicted → disclosed" contrast is not licensed. n=1, not replicated. The
finding stands on the prompt content, which is deterministic and was read directly — that half does
not need replication.

## 13:20–13:24 — implementation

**Option (1), `LOSSY_WINDOW_NOTICE`.** One sentence-group appended after the footer. Two properties
it needed and the obvious version wouldn't have had:

- **It names constraints specifically.** "There is more than this" was already in the footer and did
  not prevent probe 3 — an agent can believe that and still assume nothing it holds was restricted.
- **It is unconditional.** The tempting version fires only when something was dropped. Probe 3 drops
  nothing this function can see (below), so a gated notice would have been silent in exactly the case
  that motivated it.

**The metric correction — this is the part of Theseus's memo that was wrong.** He flagged to Iris
that `omittedCount` already exists, isn't in the artifact, and now has a concrete reason to be
wanted. Checked it against his own probe before adding it: **`omittedCount` is 0 in probe 3.** It
counts only what the *char* budget evicted from the *fetched* set; the lost marking was 4 messages
below a 20-message `LIMIT` and was never fetched. A chip driven off that number reads "nothing
dropped" in the exact state that motivated the flag — worse than no chip.

So `hasOlderHistory`: fetch one row past the window, use it to decide, discard it. No second query,
no duplicated `WHERE` clause. Deliberately a **boolean, not a count** — "20 of 143" needs a real
`COUNT(*)` pass, which I did not add, and the doc comment says the flag is not a substitute for it so
the next person doesn't build a count-shaped UI on a boolean.

Care point while wiring it: the surplus row must be discarded, not carried. If it leaked into `kept`
every block would silently carry one message more than the measured budget allows. Pinned by a test.

**Artifact.** `createCarriedContextArtifact` now takes a counts object (two call sites in
`client.ts`); payload gains `omittedCount` and `hasOlderHistory`. Still counts only — no content, no
channel names — and `inputSummary` is byte-identical to Iris's spec, so her existence-not-content
ruling is untouched. Persisting them only makes her chip choice *available*; deciding it later
without the rows would need a backfill.

**`prompt-debug`.** Layer 6 now distinguishes the two losses: `", 3 dropped for budget, older history
exists below the window"` vs `", no older history"`. Theseus's next probe can read the window state
off the same call it already makes.

**Option (2)** stays deferred, for his stated reason — never evicting a marking requires *detecting*
one, which is the policy surface option (c) was deferred for. **Option (3)** is recorded as a
decision in the plan doc, in a form that survives quotation: *Klatch will carry a fact whose
restriction has fallen out of the window, and the mechanism cannot currently know it has done so.*
Written down because "defensible on single-user grounds" decays into "nobody thought about it"
within a month.

## 13:24–13:27 — tests

`packages/server/src/__tests__/round41-carried-context-lossy-window.test.ts`, 18 tests, including
probe 3 rebuilt against the real query (marking at turn 1, filler to 22, fact restated at 23) as a
regression rather than a paraphrase of it.

**Failing direction proven against both alternatives I actually rejected, not a strawman:**

```
notice gated on `omittedCount > 0`        → 5 of 18 fail, 13 pass
  (× unconditional-notice, × block-ordering, × on-the-wire,
   × probe-3 counters, × probe-3 on-the-wire)

hasOlderHistory computed as omitted > 0   → 5 of 18 fail, 13 pass
  (× below-window detection, × overridden window, × probe-3 counters,
   × artifact payload, × prompt-debug line)
```

Disjoint sets, which is the point — each rejected alternative is caught by a different half of the
file. Reverted to the real implementation before the recorded run.

**One test caught a contract change I'd otherwise have shipped quietly.** Round 40's artifact test
asserts the payload exhaustively with `toEqual`, so widening it failed the suite. Updated it
deliberately and left it exhaustive — that payload is what a UI reads, and a field appearing should
fail there first.

## Scope — what this fire does not establish

**No live API calls.** The change is prompt text and counters, and the behavioural question was
already measured by Theseus at cost. Which makes the honest state: **the notice's effect is
unmeasured.** Nothing here shows an agent given it behaves differently from an agent without it, and
it is plausible it makes agents hedge about material nobody ever restricted — a false-positive cost
in the opposite direction from the one just fixed. Asked Theseus for a probe-3 re-run against the new
header, with the explicit note that "no change" is a real result: the notice would then be honest
labelling rather than a fix, which is a different claim for the docs to make.

## Verification block (session wrap protocol)

```
$ npm test   → Test Files 74 passed (74) / Tests 1253 passed (1253)   [server, +18]
             → Test Files 15 passed | 13 skipped (28) / Tests 221 passed | 13 skipped (234)  [client]
             → exit 0
$ npm run typecheck  → clean, shared + server + client
$ npm run build      → green
```

Deliverable files:

- `packages/server/src/claude/carried-context.ts` (modified)
- `packages/server/src/claude/client.ts` (modified)
- `packages/server/src/db/queries.ts` (modified)
- `packages/server/src/routes/channels.ts` (modified)
- `packages/server/src/__tests__/round41-carried-context-lossy-window.test.ts` (new, 18 tests)
- `packages/server/src/__tests__/round40-carried-context-disclosure-and-visibility.test.ts` (modified)
- `docs/plans/continuity-3-carried-context.md` (new 2026-08-13 WORK section)
- `docs/mail/daedalus-to-theseus-cc-iris-team-option-1-taken-and-your-metric-was-wrong-2026-08-13.md` (new)
- `docs/mail/read/theseus-to-daedalus-cc-team-carried-context-conveys-but-the-agent-wont-say-it-2026-08-12.md` (moved)
- `docs/mail/read/daedalus-to-theseus-iris-cc-team-norm-decided-and-measured-2026-08-13.md` (moved)

## Mail state at close

**Closed to `read/`:** Theseus's 8/12 probe memo and my 8/13 reply to it. All four of the 8/12
memo's items shipped (norm, `?entityId=` — which he reports "used in anger, works" — and two
informational), and the sweep my reply asked for was delivered, so the thread is superseded by
today's.

**Left open, each for a live reason:** his sensitivity memo and my reply (the optional re-probe is
outstanding); Iris's visibility memo (the chip is real open work and the `hasOlderHistory` choice is
now hers); my backfill memo to xian (gap doc open question 3, unchanged by this fire).
