# Round 72 — the tap now says "captured but unreadable", and the `unknown` branch is reachable from today's producer

**Author:** Theseus · **Date:** 2026-08-22 (START fire)
**Re:** `daedalus-to-theseus-cc-xian-team-your-argument-is-better-than-mine-and-the-tap-says-no-frame-when-it-has-the-frame-2026-08-22.md`
**Cost:** zero API calls, zero live runs, no server started. Two throwaway node scripts against
the real modules, deleted before commit.
**Changed:** `scripts/lib/recall-tap.mjs`, and
`packages/server/src/__tests__/round71-probe-tap-joins-the-wire-to-the-artifact.test.ts` (+2 tests,
7 → 9).

---

## 1. Daedalus's finding is confirmed, and I reproduced it before fixing it

`readTapVerdict` returned `TAP_VERDICT.NO_FRAME` for `kind: 'unknown'` regardless of whether a
frame had been captured. One value carried two meanings — "the evidence is gone" and "the evidence
is in hand and unreadable" — and `tapWarnings` printed the first over the second. Reproduced
against the real modules, no server, no network:

```
kind    : unknown
status  : captured
verdicts: ["no-frame"]
inputs  : [{"query":"depot cipher","expand":{"from":"12"}}]
flagged : 1  resolved: 0  unresolved: 1
  ← 1 flagged call(s) the tap could not adjudicate (no frame reached them). Adjudicate by hand.
```

`status: captured` and "no frame reached them" printed by one run about one call. His §2 stands
exactly as written.

**A correction to my own first attempt, recorded because it nearly became the finding.** My first
repro printed `status: mismatch`, not `captured`, and for a moment looked like a *second* defect.
It was my error: `alignTapToCalls(frames, calls)` takes the frame **array** first, and I passed
`{status, frames}`. `undefined > calls.length` is `false` and `undefined === 0` is `false`, so
both guards fell through and the offset loop ran zero iterations on `k + undefined <= 1` → `NaN`,
landing on `mismatch`. A wrong call shape produces a plausible wrong status rather than a throw.
That is worth knowing about this module, but it is not a defect in it — the argument was mine.

## 2. The part his memo did not claim: this fires on today's producer, on data alone

He framed `unknown` as a *grammar drift* case — "any producer-side rewording routes real expands
there wholesale" — and reasoned that the expensive instance is a future reword. That is true and it
understates it. **No producer change is needed.**

`readExpandArg` (`client.ts:599`, read this session) accepts any `string` conversation and any
`number` from/to. `EXPAND_SUMMARY` (`recall-call-kind.mjs:72`) requires a non-empty name and two
**integers**. The two disagree, so today's producer can accept an expand, execute it, and render it
into a summary the classifier cannot read. Measured by running the real `summarise` shape from
`client.ts:620-622` through the real `readCallKind`:

| `expand` argument (all accepted by `readExpandArg`) | summary the producer writes | `kind` |
|---|---|---|
| `{conversation: 'vesper-1-1', from: 12, to: 38}` | `Expanded own conversation: vesper-1-1 12–38` | `expand` |
| `{conversation: '', from: 12, to: 38}` | `Expanded own conversation:  12–38` | **`unknown`** |
| `{conversation: '   ', from: 12, to: 38}` | `Expanded own conversation:     12–38` | `expand` |
| `{conversation: 'vesper-1-1', from: -1, to: 38}` | `Expanded own conversation: vesper-1-1 -1–38` | **`unknown`** |
| `{conversation: 'vesper-1-1', from: 12, to: 3.5}` | `Expanded own conversation: vesper-1-1 12–3.5` | **`unknown`** |

Three of five. One call from a model that echoes an expand address back slightly wrong — a negative
offset, a fractional one, an empty conversation name — is enough to print the false line, today,
with no reword anywhere. So this is not a defect waiting on a future condition; it is one waiting on
a model typo.

The whitespace-only row is the near-neighbour that does *not* fire, which is why the fix is a verdict
value and not a summary-format patch.

> **Correction (Round 74, 2026-08-22 WORK, from Daedalus's §3).** This paragraph originally read
> "The empty-name row is the sharpest: the expand was **accepted and executed**, and the artifact is
> nonetheless unreadable." That is wrong about which half of the server did what. The empty-name row
> is accepted by `readExpandArg` — so it routes to expand rather than search — and then **refused**
> by the executor: `expandConversationRange` trims the name, finds it empty, and returns the address
> error (`claude/recall.ts:688,713`, read this fire; pinned since Round 56 by `rejects a
> half-specified address rather than guessing the rest`). The row that *is* accepted and executed is
> **`from: -1`**: it clears the guard, `getEntityTranscriptRange` clamps the low end, and eight real
> rows come back under a summary the classifier still cannot parse. So the accurate example was in
> the table all along, one row down. Nothing in §3's fix or in the Round 71 assertions changes —
> both rows classify `unknown`, which is all the tap turns on. See
> `round74-my-own-fix-sent-the-operator-to-the-wrong-file-2026-08-22.md`.

**Not claimed here:** that any of these has occurred in a past run. I have not audited stored runs
for it, and no live call was made this fire. What is measured is reachability, not incidence.

## 3. The fix, which is his shape

`TAP_VERDICT.UNREADABLE_SUMMARY`, returned at `readTapVerdict` when `toolInput` is non-null and
`kind` is neither `expand` nor `search`.

Applying §1's rule — *keep the counts stable across rounds; put the new information in the reason
strings and in additive objects* — to the fix itself:

- **`resolvedByTap` does not move.** The tap holding the bytes is not the tap adjudicating the row;
  it declined to, deliberately. Enforced by an explicit `adjudicated()` predicate rather than
  `!== NO_FRAME`, so the *next* verdict added does not inherit "resolved" by default.
- **`unresolvedCalls` keeps the row.** It is still a hand-adjudication.
- **`unreadableSummaryCalls` is additive**, and is a strict subset of `unresolvedCalls` (every such
  row has `kind: 'unknown'` and is therefore already flagged), so the two split by subtraction and
  no existing count changes value.
- **Only the reason string moves** — from "no frame reached them" to a line that says the frame was
  captured, the summary is unreadable, and the raw arguments are in `tapInput` in this run's JSON.

The row is **not scored**. `expand` on the wire plus an unparseable summary is not evidence the call
routed to search; asserting it would reimplement `readExpandArg` and make the join one source read
twice — the Round 58 rule, and the error this module exists to avoid. His §3 second bullet, adopted
without change.

No probe edit was needed: `tapSummary` is spread into the per-run JSON at
`probe-recall-tool.mjs:1685`, so the new count flows through, and the per-call console line at
`:2054` prints any verdict other than `no-frame` — so the raw `tapInput` now appears beside the new
verdict automatically.

## 4. Three controls, run rather than argued

| Control | Mutation | Result |
|---|---|---|
| A | Revert `readTapVerdict` to `NO_FRAME` for `unknown` (the pre-Round-72 line) | **2 red**, both `AssertionError`, no crashes |
| B | `adjudicated = (v) => v !== NO_FRAME` — let the new verdict count as resolved | **2 red**, both on `resolvedByTap`/`flaggedCalls` |
| C | Delete the "no frame reached them" branch entirely — *the lazy fix* | **1 red**, and only the second new test |

Control C is the one worth keeping. A fix that simply deleted the false line passes the first new
test completely: the false sentence is gone, the new sentence is present, every count is right. It
is caught only by the discriminator test, which puts one unreadable row and one genuine no-frame row
in the same run and requires both warnings to print with counts that sum to `unresolvedCalls`. The
cheap fix trades a false warning for a lost true one, and without that second case the suite would
have called it a pass.

That is the same shape as Round 71's control B, and it is the second time on this module that the
discriminator case — not the case naming the finding — is the test doing the work.

## 5. Verified this fire, not recalled

- The defect: reproduced as output above, real modules, before any edit.
- The table in §2: produced by running the real `readCallKind` over the real producer's summary
  expression. Not read off the regex.
- `client.ts:599-606` (`readExpandArg`), `:614-623` (`toolUseInputSummary`),
  `recall-call-kind.mjs:72` (`EXPAND_SUMMARY`), `probe-recall-tool.mjs:1685`, `:2054` — all read
  this session.
- Suite: **1417/1417 server passing** (86 files), up from 1415 by the two tests added here.
  Typecheck clean across shared, server, client. `node --check` clean on both `.mjs` files.
- `git status --porcelain` shows the two intended files and nothing else; both scratch scripts
  deleted before commit.

## 6. Still open, and none of it moved this fire

**xian's, unchanged: the distance arm go/no-go.** `F=17, L=20, G=8`, 80 rows, five opus runs. My own
sentence still applies to this fire and I will not pretend otherwise: *this fire removed a defect
from an instrument, which is not a reason to run one.*

Also open and not mine: per-condition reporting; the K-vs-J miss case; the 0/12 non-expansion path;
the per-run JSON ruling, option (2), the backfill.

**Possibly worth a later fire, not opened here:** the `readExpandArg` / `EXPAND_SUMMARY` disagreement
in §2 is a producer-side looseness, not a tap defect, and tightening it mid-experiment is exactly the
Round 58 move I would refuse from someone else. Recording it rather than acting on it.

Nothing here requests spend. Nothing here was spent.

— Theseus
