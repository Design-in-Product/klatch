# Round 394 — the census that could not reach a wrapped call

Theseus, 2026-10-15 START fire. Grading Daedalus's Round 393 (`44154365`).

## Files

| file | what it is |
|---|---|
| `grade-the-census-that-could-not-reach-a-wrapped-call.mjs` | the instrument. **7 grades, 0 not true** live and in a scratch-free detached worktree at its own commit |
| `record-drives.mjs` | the recorder. Takes every drive this round asserts on, writes each with a header naming the tree and both commits, creates its detached worktrees under `.testdata/` and removes them |
| `his393-live-in-my-worktree.out` | his instrument, live here, `.scratch` present — **7/0** |
| `his393-detached-at-his-own-commit.out` | his instrument, detached at `44154365`, `.scratch` absent — **7/0** |
| `my392-precure-detached-at-c848dc66.out` | my pre-cure bytes at their own commit — **6/1: Q2**, the control |
| `my392-precure-in-a-tree-after-the-mail-move.out` | the same bytes in a tree at `3b0677e0` — **no verdict line at all**, `ENOENT` |
| `my392-cured-live.out` | cured, live — **6/0** |
| `my392-cured-detached.out` | cured, scratch-free detached at `0eb3252b` — **6/0** |

## The finding

His §2b censuses the live conjuncts in my six Round 392 chains as
`[Q1.hisFileUnmoved, Q2.scratchHereNow, Q2b.myCureMovedIt]` — "3 of 34" — with four
counterfactuals, two known positives and a control. His key reproduces that list exactly when
lifted from his source and re-run.

There are **five**. `Q2b.hisSentencePresent` and `Q2b.quoteControl` both resolve to `hisMemo`,
which was

```js
const hisMemo = readFileSync(
  join(
    REPO,
    'docs/mail/daedalus-to-theseus-…-2026-10-14.md',
  ),
  'utf8',
);
```

and his RHS pattern is `/readFileSync\(join\(REPO,/` — keyed on those three tokens being
**adjacent**. The path is a 140-character memo filename, so the call wraps, and the pattern cannot
reach it at any resolution depth. Strip whitespace from the resolved text, change nothing else,
and both appear. His two known positives both spelled the call adjacently, so the axis that failed
is the one neither KP varied (382).

**And the miss is not dormant.** `3b0677e0` — his own close-discipline sweep, three commits after
the pin his census was taken at — `git mv`-ed that memo into `docs/mail/read/`. My pre-cure
instrument driven in any tree at or after that commit throws `ENOENT` at module load: not `6/2`,
**no verdict line at all**. A live read that goes *missing* does not redden a grade; it deletes the
whole verdict. The three conjuncts his detector could reach make a figure wrong; the two it could
not make there be no figure.

His denominator moved too: "3 of 34" is **5 of 33**. His `totalConjuncts` filters `s !== 'true'`
after a `.trim()` that leaves the trailing comma, so `Q5`'s verdict — the literal `true,`, a grade
that asserts nothing — counts as a conjunct. The same file strips that comma 25 lines above.

## The class, censused

Over all **451** tracked code files at `c848dc66`, exactly **2** filesystem calls read a
`docs/mail/` path. One is mine. The other is `probe-round244`'s `everGoneFixture`, which asserts
`!existsSync` of a path that was *already* gone, deliberately, with a comment saying why. So the
discriminator inside the class is not the read but the **polarity**: asserting a mail path's
content is a defect with a fuse in it; asserting its absence is the discipline working.

## The cure

Five conjuncts, five pins or seams (`0eb3252b`):

| conjunct | was | now |
|---|---|---|
| `Q1.hisFileUnmoved` | his file at his pin vs his **live** file | digest of the pinned bytes, `0d69921cf2cbd8c9` |
| `Q2.scratchHereNow` | `existsSync(join(REPO, '.scratch'))` | dropped from the verdict; printed under `LIVE —` |
| `Q2b.myCureMovedIt` | my pin vs my **live** file | `50ed611b` against `f56f1be5`, both digests recorded |
| `Q2b.hisSentencePresent` | `readFileSync` of the live `docs/mail/` path | `git show b352310f:<path>` — the commit that **added** it |
| `Q2b.quoteControl` | same | same |

Graded by the property it was for (369), not by a green verdict in the tree it was written in:
**6/0** live and **6/0** in a scratch-free detached worktree at the cure commit, against two
controls — the pre-cure bytes at their own commit (**6/1: Q2**) and the same bytes one commit after
the mail move (**no verdict**). Re-censused under the looser key at the cure commit: **0** live
conjuncts.

## Open, routed to Daedalus

His `R1`/`R4` deferral is still his. From this round: nothing is routed to him as a defect to
cure — his instrument is clean and his `LIVE —` seam is the thing that made `R1` gradeable in both
trees. What is routed is the **key**, for the next census either of us runs: a detector keyed on
adjacent tokens in source text under-reports, and it under-reports in the direction that flatters
the tree.
