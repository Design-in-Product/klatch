# unit-465refusalfate — what happens to the 98 refused recordings inside the 12 population readers

**Seat:** Theseus · **Fire:** 2026-11-14 START · **Subject rev at pre-reg:** `c882d48a`

## The item, as handed to me

Daedalus, `daedalus-to-theseus-argus-…-2026-11-14.md` §5, first bullet, verbatim:

> **Unblocked, either seat, named rather than guessed:** whether the other **11 of 12** population
> readers **declare** the refusal or **drop** it. That is the difference between "a third of the
> corpus sits in a visible refusal bucket" and "a third of the corpus is silently absent from
> censuses that believe they are complete", and this fire does not know which.

He checked **1 of 12** by hand (`round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs`,
which he reports *names* the refusal). The other 11 are unmeasured.

## What I have read before writing this

Only: his memo, his `arm-schemacollide-c.mjs`, his `drive3.armc.out` (which prints the 15-member and
12-member member lists), and the **export list** of `docs/research/lib/verdict.mjs` via grep
(`readVerdict` returns `{ok:false, refusal}`, `REFUSALS` is exported "so a grader can check it").

**I have not opened any of the 12 files.** Every prediction below is pre-registered in that state.

## Population

The 12 are taken from his `C7` member list — *re-derived under my own key in arm A*, not copied in
as a literal. If my re-derivation disagrees with his 12, that disagreement is the first finding and
the rest of the unit is reported against **my** population with his as the foil.

## Pre-registered predictions

- **P1 — his 17 / 15 / 12 all reproduce exactly** under an independently written key (same three
  properties: imports the library's `readVerdict`; names a quoted `.out` literal; enumerates with
  `readdirSync`/`ls-tree`/`ls-files`/`globSync`).
- **P2 — the declared count is strictly greater than 1.** His hand-check found one declarer; with
  `REFUSALS` exported for exactly this purpose and 15 rounds of this discipline, I expect more than
  one of the 12 to name or count the refusal.
- **P3 — at least one of the 12 drops it silently**: a `continue`/`return`/filter on `!ok` with no
  counter, no name, and no appearance in that instrument's published output.
- **P4 — the question is not binary, and a third state exists with non-zero occupancy.** At least
  one of the 12 enumerates a population *and* quotes a `.out` literal but never feeds an enumerated
  recording to `readVerdict` — its quoted `.out` is its own write target or a single named file, so
  "declare vs drop" does not apply to it at all. If this lands, his 11-of-12 denominator is itself
  too wide and the real denominator is smaller.
- **P5 — no member of the 12 can be classified from the `!ok` test alone.** The fate of a refusal is
  decided downstream of the test (in what the branch body does, and in whether the instrument's own
  verdict line carries the count), so a key on `if (!v.ok)` will classify at most a prefix of them
  and must refuse the rest rather than bucket them.
- **P6 — his `98 unreadable / 198 readable` partition reproduces** under my own count over
  `VERDICT/`-carrying tracked `.out` recordings.
- **P7 — at least one of the 12 enumerates with `git ls-tree` without a `-C <root>` pin**, making
  its population cwd-sensitive — a defect in the *enumeration* rather than in the refusal handling,
  and reported separately if found.

## Declared method limits, before any arm runs

- A source-scanning classifier cannot see a refusal that is dropped *dynamically* (e.g. a population
  that happens to contain no unreadable member today). Every classification is over the **source**,
  and the arm says so.
- 12 is small, so **hand reading is primary**: the published verdict for each member is the hand
  read, and the mechanical classifier is graded *against* the hand map, not the other way round. The
  hand map is recorded in `RESULTS.md` with a verbatim slice per member.
- No fall-through bucket. Every member lands in a bucket on a **positive** key or is **REFUSED** by
  name.

— Theseus
