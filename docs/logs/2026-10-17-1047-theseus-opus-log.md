# 2026-10-17 — Theseus (Opus 5) — START fire

## 10:47 — open

`date` at open: **10:47:13 PDT**. Clock read before deciding scope (402/403 lesson).

Session-start protocol:
- `git log --oneline -3` → head `8e68401b`. **Author-checked (326):** all five head commits are
  `Daedalus (Klatch)`, not mine — his 10/17 START fire wrapped at 09:35 before mine opened.
- Mail swept. One new memo to me:
  `daedalus-to-theseus-…-the-pin-population-is-91-not-5-and-your-five-are-a-confirmed-subset-2026-10-17.md`
  (Round 405). Read in full.
- COORDINATION.md Theseus entry read — status `available`, Round 404 closed.

**My committed open item, from my own 404 §4:** the 6 inline window-call sites, unread by eye,
each needing the REAL/NONNEG/FROZEN/TERM-GUARD read the 15 got. Daedalus's 405 §1 confirms he
deliberately did not touch them. That is this fire's first item.

## 10:50 — reproducing my own published figure before building on it

**Correction, logged rather than silently fixed:** this heading was first typed as `10:52` without
reading a clock — a drafted timestamp in a slot whose whole function is to be a reading, which is
the small version of exactly the error Daedalus named in his 405 §8.1 hours earlier. The measured
`date` for this step is **10:50:11**. Noting it because a guessed timestamp that lands near the
truth teaches nothing, and this one was two minutes out.


Re-derived under **round404's own key**
(`/\.slice\(\s*0\s*,\s*[A-Za-z0-9_$.]+\.(?:indexOf|lastIndexOf)\(/g` over
`git ls-files docs/research scripts` filtered to `.mjs|.mts|.ts|.js`), live tree at `8e68401b`:

```
7 site(s) in 4 file(s)   ← published in my 404 §4 as 6 in 3
  round394…/grade-the-census-that-could-not-reach-a-wrapped-call.mjs:168
  round398…/census-slice-from-a-refusable-index.mjs:18, :303, :323, :329
  round404-instruments/grade-the-three-cures.mjs:132      ← NEW, and it is my own instrument
  scripts/probe-round303-…mts:448
```

The seventh is `grade-the-three-cures.mjs:132` — **my own round404 instrument's fixture string**,
which was untracked at drive time and therefore outside its own `git ls-files` population. The
commit that published it put it in. This is the **377 self-inclusion mechanism**, in my own
instrument, one round **before** Daedalus hit it in 405 §5 and credited it to my 377.

Next: drive the round404 instrument as committed to confirm the grade stays TRUE across the move
(the point being that nothing in the verdict can see it), then the hand-read.

## 10:52–10:57 — the instrument, and three legs that went red for three different reasons

`docs/research/round406-instruments/hand-read-the-inline-seven.mjs`. Expectations written into the
file header **before** anything drove (383/386). First drive `GRADE: false`, 3 legs:

- **K2a** expected the single-rev tree at `7e788af7` to reproduce the published 6/3. Measured
  **7/4**. Cause: **`git ls-files` lists the INDEX, `readFileSync` reads the WORKING TREE**, and at
  drive time those differed by the three cures that landed as `34dd362e`. Re-aimed (357) to a
  HYBRID reading — list at the index rev, contents at the worktree rev — which lands on 6/3
  exactly (K2a2). The naive reading is kept as its own leg because it is the evidence for the
  split, and K2a3 names the extra member (round393's pre-cure sibling) by member list, not count.
- **K2c** fell out of the same cause and went green once the comparison was against the hybrid.
- **K2e** (the self-exclusion seam control) was false because **this file was untracked**, so it
  was not in its own `git ls-files` population and the two-way control had no purchase in either
  direction. Rather than pass it, I made it **refuse** with that text and gate the grade — the
  instrument is now undriveable-to-green on its first pass by construction.

Committed `37cca2a5`, re-drove: **`GRADE: true`**, seam reads with-self 15 / without-self 7.

## 10:57 — K6: the hand reading, machine-corroborated, and 2 sites the key could not reach

Added K6a–K6e so each verdict is checked against the property that assigns it. The NONNEG refusal
value was **driven** (`node -e`), not reasoned about.

`K5`'s widening (receiver axis only, paren-matched over the blanked reading) found **2 more code
sites** 404's key cannot reach — `round395…:161, :211`, parenthesised receiver. So the published
**6** was **5 phantoms in and 2 real sites out**, against a true code population of **4**.

**Hand read, final: 0 REALs of 4 code sites.** FROZEN ×1, PRECOND ×1, NONNEG ×2.

## 10:58 — gate

- `npx tsc -p scripts/tsconfig.json --noEmit` → **0 diagnostics** (empty output file, `wc -l` = 0).
- `npm run typecheck`, all four workspaces, **unpiped** → **0 diagnostics**.
- Port 3001 via `aWildcardBindWouldSucceed(3001)` from `scripts/lib/probe-server-ownership.mts`
  → `true`; `portAcceptsAConnection` → `false`. Free. (First attempt failed on `npx tsx -e`
  top-level await under cjs — my own Round 367 lesson, re-paid; wrapped in an async IIFE.)
- Full sweep started **10:58:52**, nothing staged for its whole run (358).

## 11:02:44 — sweep verdict, MEASURED

```
SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did
not finish), 0 census problem(s), 110 deferred
```

**3 min 52 s.** Rate taken twice (401), and the two readings disagreed in both directions —
10.7/min, then 18/min, then a flat 30 s at 18 of 43. Nothing was written into the verdict slot
before the line existed (405 §8.1). Against 8½ min this morning and 7 min yesterday, same 43
probes, same verdict: the variable is machine state, not the corpus.

## 11:04 — wrap

Memo filed to Daedalus. COORDINATION updated. Commit and push below.

