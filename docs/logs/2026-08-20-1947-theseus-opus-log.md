# 2026-08-20 19:47 — Theseus (opus) — STOP fire

Duty-cycle STOP fire in the Amber worktree `/Users/xian/Development/klatch-worktrees/theseus`,
branch `claude/theseus-cycle`. Worktree synced to `origin/main` by the wrapper immediately before
the fire; `9a3a553` at HEAD on arrival.

## 19:47 — Briefing

`git log` since my 14:47 fire: four commits, none of them mine. Daedalus `d4762ad` / `27b792b` /
`4e7ee53` (17:25–17:26), Calliope `e00b261` (17:16), Argus `fce8c5b` (18:02), Iris `9a3a553`
(19:24).

Mail: one new memo addressed to me —
`daedalus-to-theseus-cc-xian-team-the-crash-was-real-and-no-faithful-control-of-that-guard-can-avoid-it-2026-08-20.md`.
Read in full. It concedes my Round 67 §3 finding entirely (his item-8 control crashed inside
`recall.ts` rather than failing at any assertion), records five degrading mutations in its place,
reorders item 8's first test so page assertions precede the header arithmetic, and leaves **one open
question addressed to me**: `isError` is exercised by none of the five — same species of gap, or
not? He offered to build a sixth control if I said yes.

Nothing else in `docs/mail/` is addressed to me or newly actionable this window.

## 19:48 — Decided to run it rather than rule on it

The question is answerable by mutation, and the whole thread's lesson is that reading about a
control is not what catches things. Baseline first: `npx vitest run round56-recall-expand.test.ts`
→ **24/24 green**.

## 19:49 — Control A: `candidates.length > 1` → `> 0`

A *routing* mutation — sends every successful lookup into the "2 of your conversations are named X"
error return. 11 red in the file. Item 8's first test red with:

```
AssertionError: expected true to be false
❯ src/__tests__/round56-recall-expand.test.ts:610:30
    610|     expect(expanded.isError).toBe(false);
```

**A named assertion, not a crash.** So `isError` is reachable-red. Reverted; `git diff --stat`
empty before proceeding.

## 19:49 — Control B: the first guard also rejects a wide range

`|| to - from + 1 > RECALL_MAX_EXPAND_ROWS` added to the malformed-address guard. Item 8 requests
1–40 against a 30-row cap, so it misroutes; narrow-range tests do not. Ran the **full** server suite
for this one, because the interesting claim is a coverage claim:

**7 failed | 1,394 passed** — and all seven inside `round56-recall-expand.test.ts`. Nothing else in
1,401 tests notices a wide-range misroute.

Read by which line produced the red, not by the count:

| tests | red on |
|---|---|
| item 7 (1st), item 8 (1st), item 10 (1st) | `isError` itself |
| item 5, item 8 (2nd), item 10 (2nd) | a count or a page assertion |
| item 7 (2nd) | **no assertion — a throw inside the `shownRange` helper** |

## 19:50 — The answer to Daedalus's §3, and why it isn't a sixth control

The five could not reach `isError` for a **structural** reason: `isError: false` at `recall.ts:798`
is a *literal*, and all five of his mutations (`:748`, `:780`, `:791`, the per-message cap in
`formatTranscriptLine`) sit **downstream of the routing decision** — they only execute once `:798`
is already the return being taken. No mutation of the success path's body can flip a literal on the
success path. The gap was a missing mutation **family**, not a weak assertion. So: no sixth
control; the family, run twice, closes it.

Also recorded, because I'd rather not oversell it: `isError` there is **not a unique detector**.
Under both controls item 8's *second* test — which asserts no `isError` at all — went red anyway on
its page assertion. What the assertion buys is legibility. That is a precondition's job, and
preconditions carry a different burden of proof than claims do: not *does it discriminate*, but
*does it abort before the test asserts something false*. Both controls show it doing that.

## 19:51 — Item 7's second test: the same crash shape, one item away

`completes the offered range on the continuation, with no overlap and no hole` calls
`shownRange(first.text)` with no precondition ahead of it. Under the misroute there is no
`Positions X–Y` header, the helper throws, and **none of its four tiling assertions run.** Exactly
the shape I found in Daedalus's item 8 at 14:47 — found this time by the control, not by reading.

Legible throw (the helper prints the offending text), unlike the `TypeError` inside `recall.ts`.
Still not an assertion. Fixed in place: `expect(first.isError).toBe(false)` and the same for
`second`, ahead of the helper. Re-ran control B — the red now lands on `isError` by name. Two-line
additive test-only change to a test of Daedalus's; made rather than reported because the rule it
applies is one we have both now signed, and flagged in the memo so he can back it out.

## 19:52 — Unlooked-for: the address error hands back a valid address

Under control B, item 7's second test got **past** `expect(forward).toHaveLength(1)` before it died.
It should not have — the call had returned an error. Chased it:

`recall.ts:698` ends with `… for example {conversation: "design-review", from: 12, to: 38}.`
The shipped edge-address renderer at `recall.ts:177–180` composes
`{conversation: "` + name + `", from: ` + n + `, to: ` + m + `}`. **Byte-identical.**

Ran the test helper's regex against the error string alone rather than eyeballing it:

```
[{"conversation":"design-review","from":12,"to":38}]
```

One clean address, out of the one message whose entire content is *you did not give me an address*.
`addresses()` harvested it, `12 > 6` held, and the test proceeded as if handed a real offer.

The test-side consequence is now moot. The **model-facing** one is real but small: an agent that
mis-addresses, reads the reply for something to retry with, and follows the only address in it
lands on `design-review`, a conversation it has never been in, and gets *"No conversation of
yours … is named design-review"* next call. Self-limiting, so **not filed as a bug** — but it
spends a turn and teaches a fabricated name, in the reply whose job is to teach the correct form,
on the surface arm F is live on. `grep`'d `recall.ts` for the shape: `:698` is the only occurrence
besides the real renderer; the other two error returns are clean. Production copy, so **reported to
Daedalus, not edited by me.**

## 19:53 — Cost and position

**Zero API calls, zero live runs, no server started.** Nothing this fire requests spend.

Order unchanged and still one line: items 1–3, 5 and now the whole of item 8 are closed. **Item 4,
the distance arm** — validity closed on five accounts, `F=17, L=20, G=8`, 80 rows, **five opus runs,
xian's call.** Untouched by this fire; I have still added nothing to the case *for* spending it.

## 19:54 — Wrap verification

Per CLAUDE.md Session Wrap Protocol. Read from `origin/main` after pushing, not from the worktree.

**Suite, at baseline after both mutations were reverted:**
`npm test` → server **1401/1401 (84 files)**, client **239 passed / 13 skipped (31 files)**.
Server count unchanged — I added assertions but no tests. The client figure is **239, not the 233 in
Daedalus's memo**, because Iris's `9a3a553` landed at 19:24 after he wrote; his number was correct
when written. `npm run typecheck` clean, no diagnostics.

**Both production mutations reverted**, and `git status --short` checked **before** the first commit,
not after — it showed `packages/server/src/__tests__/round56-recall-expand.test.ts` as the only
modification. `recall.ts` absent from the diff.

**Step 1 — commits on `origin/main`:**

```
8a3266a test(recall): item 8 — the routing mutation family that reaches isError, and item 7's helper throw named
d4c2efd mail: reply to Daedalus — no sixth control, the gap was a mutation family, and the address-error copy hands back a valid address
```

Mail committed separately and pushed to `main` ahead of the work commit, per the worktree mail
discipline.

**Step 2 — deliverables** (`ls` output pasted below at 19:55, after the final push).

**Step 3 — this log and `docs/COORDINATION.md` are committed and pushed last.**

`ls -d .testdata` → no such file. No scratch corpus, no server started this fire.

**Nothing is claimed as delivered.** Delivery is the wrapper's and it logs the outcome.
