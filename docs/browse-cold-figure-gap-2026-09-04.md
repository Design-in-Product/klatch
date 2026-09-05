# The cold-browse figure gap was never a discrepancy — it was xian's cap ruling

**Round 153 · Theseus · 2026-09-04 (STOP fire)**
**Instrument:** `scripts/probe-browse-cold-figure-gap.mts` — 28 checks (14 regression, 14
measurement), **0 failed, 0 skipped**. Zero model calls. Scratch DB under `.testdata/`;
`klatch.db` never opened. Corpus read-only. `session-scanner.ts` sha256-restored and verified
byte-identical before exit.

## What was open

Two measurements of the same thing disagreed by 47% and both agents wrote "unexplained":

| | measured | build | recorded in |
|---|---|---|---|
| Daedalus, Round 147 | **1477 ms** cache-cold browse | `dba7699` | `docs/fingerprint-cache-2026-09-04.md` |
| Theseus, Round 148 | **2164 ms**, and 2177 ms on a second fresh server | post-`18d4631` | `docs/second-corpus-browse-2026-09-04.md` |

Same endpoint (`/api/import/claude-code/sessions`), same root (`~/.claude/projects`), same
discipline (page cache pre-warmed, scratch DB with nothing imported), 1% internal stability on
my side. His **7 ms warm reproduced exactly**; only the cold figure diverged. It was listed as
open in his 9/4 STOP memo and in my 9/4 WORK log — **carried across two fires by two agents**,
which is how a number becomes folklore.

## The answer: we were not measuring the same build

`18d4631` (xian's ruling, 9/4 10:18) raised `FINGERPRINT_LINE_CAP` from **1500 to 50_000**.
Daedalus measured at `dba7699` (09:23), before it. I measured after it.

Run as one experiment — one corpus, one machine state, three fresh servers back to back, the
constant rewritten for exactly one server generation and sha256-restored:

| arm | cap | cache-cold browse | steady state |
|---|---|---|---|
| B | 50_000 (shipped) | **2203 ms** | 8 ms |
| C | 1_500 (pre-ruling) | **1492 ms** | 8 ms |
| D | 50_000 again (control) | **2227 ms** | 7 ms |

- **Arm C reproduces Daedalus's 1477 ms to within 1%.**
- **Arm B reproduces my 2164 ms to within 2%**, and arm D confirms it is not drift (1% apart).
- **Cap delta: 723 ms** (mean of the two shipped-cap arms, minus arm C).
- The unexplained gap was 2164 − 1477 = 687 ms. The measured cap delta leaves a **residual of
  15 ms** at the pre-ruling cap — inside noise.

Both numbers were right. Neither was reproducible without its cap.

## The second hypothesis is dead, and that matters

My Round 148 probe read **both** corpora (989 MB) to equalise the page cache; Daedalus read one
(531 MB). On a machine under memory pressure the extra 456 MB could have evicted the shipped
corpus's own pages, making my "page-cache-warm" number partly a disk number. This probe warmed
**one** corpus. Arm B still came in at 2203 ms. **Warming two corpora was not what moved the
figure** — worth recording because it was the more alarming hypothesis (it would have meant every
Round 148 number was contaminated) and it is now excluded rather than merely doubted.

## The number nobody had written down

**xian's cap ruling costs 723 ms on every cache-cold browse of this corpus** — 48% over the
pre-ruling cold browse. That cost is:

- **paid once per server start**, not per browse. Steady state is 8 ms at either cap; the
  fingerprint cache (`dba7699`) absorbs the whole difference after the first browse.
- **bought with exact turn counts.** At cap 1500 the endpoint reported **11 of 522 sessions
  capped**, hiding **1216 of 2047 turns — 59.4% of the corpus's turn signal**. At 50_000, zero
  capped.

That 59.4% is an independent reproduction of Round 143's central finding (58.8%, measured on a
506-file corpus by a different instrument at the scanner rather than the endpoint) on today's
522-file corpus at the HTTP surface. **The ruling looks correct on these numbers** — 723 ms once
per server start, against 59% of the turn signal on every browse, with the cache making the
repeat case identical either way. I am recording the price, not reopening the decision.

## Round 143's +645 ms and this run's +723 ms

Round 143 measured +645 ms on a 1387 ms browse, at the scanner, on a 506-file / 547 MB corpus.
This run measures **+723 ms on a 1492 ms browse**, at the endpoint, on 522 files / 543.7 MB.
The two agree in shape and differ by 12% — consistent with a corpus 16 files larger and with the
endpoint's serialization sitting on top. **The cap cost scales with the corpus, so it is not a
one-time figure to quote forever**: it is ~1.4 ms per file over the pre-ruling cap on this corpus,
and it grows as the corpus does.

## How the patch was proved to have reached the server

Text-matching the file proves the *file* changed. What proves the *server we timed* ran the changed
cap is behaviour only that cap produces:

- arm C returned **11 capped sessions**; arm A independently counted **11 files over 1500 lines on
  disk**. Exact match.
- arm B returned **0 capped** at 50_000, and 0 files on disk exceed it.
- total turn count moved 2047 → 831 across the two arms.

A cap that had silently failed to apply would have shown zero capped sessions and an unchanged turn
total.

## Corpus figures, as of this run

- `~/.claude/projects`: **522 files, 543.7 MB** (Round 147 measured 516 / 531.2 MB — **+6 files,
  +12.5 MB in one day**).
- Largest file **15,371 lines** — the scanner's own comment figure, unchanged, still holding.
- **0 of 522 files reach the 50_000 guard**; 11 exceed 1500.
- Max `turnCount` on this root: **212**. (The 370-turn figure from Rounds 148/150 is Piper Morgan's
  second corpus, not this one.)

## What this does not close

- **The second corpus's cap cost.** Every number here is `~/.claude/projects`. `~/.claude-pm/projects`
  is 86% of the bytes in 15% of the files and its heads run to 40k+ lines — the cap delta there is
  a different number and is **not measured**. It is the one that matters for continuity #3.
- **Whether 723 ms per server start is acceptable to xian.** Not my call, and the ruling is already
  made; this is the price tag it was made without.
- Round 149's multi-root walk and `e1ee197` also landed between the two measurements. The 15 ms
  residual bounds their combined cold-browse cost on a single root at ~1%, which is consistent with
  Daedalus's "the union costs 9ms" — but it bounds them, it does not measure them separately.
