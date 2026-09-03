# `turnCount` over the wire, and what the cap does to it

**Theseus, Round 142 — 2026-09-03 START fire**
**Instrument:** `scripts/probe-turncount-live-http.mts` (exit 0; 5/7, 2 arms encode open items)
**Corpus:** the real `~/.claude/projects` on Amber — 504 sessions
**Follows:** Daedalus, `docs/browse-count-vs-persisted-rows-2026-09-03.md` and his memo of the same date

Daedalus shipped `SessionInfo.turnCount` in `5e5f0e9` and left two items explicitly open, one of
them explicitly unmeasured. This round measures both, plus the transport question his unit tests
structurally could not reach. Everything below is a measurement from this session; nothing is
carried from a previous round.

---

## 1. Transport: the field does survive the wire — 504/504

The gap worth checking first, because it is the one that has bitten this feature before. `entityGuess`
was typed, unit-tested against mocked fetch, and would have shipped a permanently-blank confirm field
if `routes/import.ts` had not spread it. `turnCount` was in exactly that position this morning: added
to the server type, populated in the scanner, mirrored onto the client type, and never read off a real
HTTP response.

It is fine. Against a real spawned server on :3001:

- **504/504 browsed sessions carry a numeric `turnCount`.**
- **`turnCount <= messageCount` on all 504** — the two counters have not drifted apart in the one
  loop they share, which is what Daedalus's "agree by construction" claim requires.
- 0/504 sessions have `turnCount` 0.

Events-per-turn across the full live corpus: **min 1.0, p50 77, p90 155, max 335.** Daedalus saw
1.9x and 3.3x on two files and concluded no constant correction factor exists. The full spread is
much wider than those two points suggested, and the conclusion holds far more strongly than the
evidence he had for it.

## 2. The prediction contract holds, and it is tight

The field comment claims `importSession` persists **at most two rows per turn**. Driven over real
HTTP across a sample of uncapped real sessions, and then across all 11 capped ones:

- `rows <= 2 x turnCount`: **0 violations.**
- `rows >= turnCount`: **0 violations.**
- Measured rows-per-turn on the 11 deep sessions: **1.86 – 1.99.** Daedalus's single data point was
  1.91 (143/75). The contract is not just satisfied, it is nearly exact.

As a predictor of rows-that-land, median relative error over the uncapped sample: **`turnCount` 50%,
`messageCount` 2750%.** The unit change is correct. That part is settled.

**A caveat I am not going to bury:** the uncapped sample was depth-degenerate — 11 of 12 sessions
had exactly 1 turn. That is not a sampling weakness I could have avoided, and the reason is finding
§4 below.

## 3. Daedalus's open item #1 is real — and the reason he gave is not the reason

His words: *"The cap binds harder on turns. 1500 lines bought 469 events but only 75 turns in this
file, so a capped `turnCount` understates by proportionally more than `messageCount` does."* Marked
as not measured.

**The inference does not follow.** Both counters advance inside the *same* capped loop
(`session-scanner.ts:158` caps `linesRead`; `messageCount++` and `turnCount++` are both inside it),
so a smaller absolute number is not a larger proportional loss. If event and turn density were
uniform along the file, retention would be identical for both. I expected the item to dissolve.

**It doesn't. He was right about the conclusion.** Of the 11 sessions in the live corpus that
actually hit the 1500-line cap, turns retain worse on 6, better on 3, equal on 2 — and the worst case
is severe:

| session | lines | true evt | true trn | evt retained | trn retained | evt/turn first 1500 | evt/turn after |
|---|---|---|---|---|---|---|---|
| `e3ab1cd8` | 8682 | 3214 | 182 | 19.2% | **6.0%** | 56.0 | 15.2 |
| `44eb2d30` | 9618 | 3024 | 192 | 17.6% | 12.0% | 23.1 | 14.7 |
| `c850b305` | 13178 | 4679 | 180 | 12.0% | 12.2% | 25.5 | 26.1 |
| `0d6e54c5` | 7091 | 2585 | 165 | 23.4% | 13.3% | 27.5 | 13.9 |
| `a30c9a8e` | 10597 | 3214 | 210 | 17.6% | 13.8% | 19.5 | 14.6 |
| `8d5aae22` | 15371 | 4864 | 206 | 12.4% | 14.6% | 20.1 | 24.2 |
| `e2855b83` | 11136 | 3173 | 62 | 15.1% | 32.3% | 24.0 | 64.1 |
| `5cdcbfaf` | 4598 | 1392 | 132 | 35.1% | 34.1% | 10.8 | 10.4 |
| `044b5516` | 2941 | 1092 | 53 | 52.7% | 41.5% | 26.2 | 16.6 |
| `a13a7c89` | 1646 | 577 | 21 | 93.1% | 81.0% | 31.6 | 10.0 |
| `0617e40a` | 1544 | 519 | 23 | 96.7% | 100.0% | 21.8 | n/a |

Mean event retention 35.9%, mean turn retention 32.8%.

**The mechanism is front-loaded event density, not the cap arithmetic.** Read the last two columns:
every session where turns retain worse is a session where the first 1500 lines are more
tool-heavy per turn than the rest (56.0 → 15.2 in the worst case; 27.5 → 13.9; 31.6 → 10.0). Both
sessions where turns retain *better* have the density inverted (24.0 → 64.1; 20.1 → 24.2). The shape
is consistent: these sessions open with a long autonomous tool-heavy stretch and become more
conversational later, so the capped prefix is precisely the least turn-dense part of the file.

This matters for the fix. If the cause were cap arithmetic, nothing would help. Because the cause is
a density gradient, **raising the cap buys disproportionately many turns** — the lines past 1500 are
where the turns are. Daedalus declined to raise the cap because he had not measured the scan-latency
cost; that is still unmeasured and still his call, but the benefit side is now known to be larger
than the linear guess.

## 4. The finding neither of us was looking for: depth and capping are the same population

**The deepest *uncapped* session in the entire 504-session corpus is 18 turns. 11 sessions are
capped, and their true depth is 21 – 210 turns.** There is essentially no overlap.

So `turnCount` is exact for shallow sessions and a lower bound for **every single session with real
depth** — which is exactly the population where a user needs a size estimate at all. Nobody needs a
size hint to decide about a 1-turn session. This is also why §2's sample is degenerate: there were no
deep uncapped sessions to sample.

## 5. What the user would actually see (imported and counted, not estimated)

All 11 capped sessions imported over real HTTP, rows counted from the DB:

| session | rows that land | shows `turnCount+` | shows `messageCount+` |
|---|---|---|---|
| `e3ab1cd8` | 357 | `11+` — under by 32.5x | `616+` — **over by 1.7x** |
| `44eb2d30` | 379 | `23+` — under by 16.5x | `532+` — **over by 1.4x** |
| `c850b305` | 353 | `22+` — under by 16.0x | `562+` — **over by 1.6x** |
| `0d6e54c5` | 325 | `22+` — under by 14.8x | `604+` — **over by 1.9x** |
| `a30c9a8e` | 417 | `29+` — under by 14.4x | `565+` — **over by 1.4x** |
| `8d5aae22` | 401 | `30+` — under by 13.4x | `602+` — **over by 1.5x** |
| `e2855b83` | 122 | `20+` — under by 6.1x | `480+` — **over by 3.9x** |
| `5cdcbfaf` | 259 | `45+` — under by 5.8x | `488+` — **over by 1.9x** |
| `044b5516` | 100 | `22+` — under by 4.5x | `576+` — **over by 5.8x** |
| `a13a7c89` | 39 | `17+` — under by 2.3x | `537+` — **over by 13.8x** |
| `0617e40a` | 43 | `23+` — under by 1.9x | `502+` — **over by 11.7x** |

Note the fourth row: `604+` delivering 325 rows. That is my original 604-vs-325 observation from 9/2,
reproduced from the other direction — it was never a one-off.

**`messageCount+` overstates rows on 11/11 capped sessions.** A `+` means *at least*, and it is wrong
every time, by up to 13.8x. Daedalus fixed this on the strength of one instance; it generalizes
completely.

**`turnCount+` never overstates** — it cannot, since the cap can only truncate. It is honest in the
one direction a lower-bound marker must never fail. But it understates by up to 32x, and `11+` for a
357-row import is honest and useless.

---

## What I'd tell Iris

Both numbers are wrong on deep sessions, in opposite directions, and the choice between them is not
the whole decision.

1. **Move the unit to `turnCount`.** Confirmed correct, tight (1.86–1.99 rows/turn), and it fails
   safe. `messageCount` fails unsafe on 11/11.
2. **Do not carry the `+` over unchanged.** `469+` was a broken promise; `11+` for 357 rows is a
   different failure, not a fixed one. On a capped session the honest rendering is a qualitative one
   — "long session, 350+ messages when imported" or simply "large" — not a precise-looking small
   integer with a plus sign.
3. **The cap decision is upstream of the label.** §3 says raising it buys more turns than a linear
   estimate would suggest, because the turn-dense part of a session is past line 1500. If the cap goes
   up enough that deep sessions stop capping, both problems disappear and the label question becomes
   easy. Scan-latency cost is unmeasured — Daedalus's call, not mine, and not Iris's to wait on if
   she wants to ship a label sooner.

## What I did not do

- **Did not measure the scan-latency cost of raising the cap.** It is the load-bearing unknown for
  recommendation §3 and it belongs to whoever owns the scanner.
- **Did not touch anything under `packages/`.** This round is measurement only.
- **Did not open the `none`-basis question**; still 0 occurrences in the live corpus, unchanged from
  Round 141 and consistent with Iris's browser walkthrough.
- **The density gradient is measured on 11 sessions on one machine.** The direction is consistent and
  the mechanism is legible, but 11 is 11. If duty-cycle sessions on other machines are shaped
  differently, §3's "raising the cap buys disproportionately many turns" could be weaker there.
