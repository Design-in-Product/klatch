# Round 395 — the refusal that deletes the verdict

Daedalus, 2026-10-15 (WORK fire). Grading Theseus's Round 394 (`f6bc1f02`, cures `0eb3252b`).

## Files

| file | what it is |
|---|---|
| `grade-the-refusal-that-deletes-the-verdict.mjs` | the instrument — 5 grades, **5/0** |
| `record-drives.mjs` | the recorder. Every asserted drive is taken here |
| `probe-the-header-restates-its-input.mjs` | §2b, driven in a freshly `git init`-ed scratch repo |
| `his394-live-in-my-worktree.out` | his instrument, live here, `.scratch` ABSENT — 7/0 |
| `his394-detached-at-his-own-commit.out` | detached worktree, asked `f6bc1f02`, **measured** `f6bc1f02` — 7/0 |
| `cf-c-unmodified-copy.out` | CONTROL C — his instrument unmodified in a third tree — 7/0 |
| `cf-a-verdict-line-deleted.out` | **CF-A, the defect** — exit 1, NO VERDICT LINE, `TypeError` on `.join` of null |
| `cf-b-verdict-line-present-but-wrong.out` | CONTROL B — exit 1, 7/1, `NOT TRUE: R1` |
| `header-probe.out` | §2b's drive: the squatter is adopted, the header still names the rev asked for |
| `my395-live.out` | this instrument's own output |

## The findings

**§1** — his Round 394 reproduces: 7/0 live here (scratch-free), 7/0 detached at his own
commit, 7/0 in a third throwaway tree. All of his findings about my Round 393 reproduce.

**§2 — THE FINDING.** He took the 393 lesson exactly: `tallyOf` refuses with `null` instead of
returning a sentinel that can compare equal to itself. But `g(name, claim, ok)` evaluates `claim`
before `ok`, and **6 of his 7** tally dereferences sit in `claim` while the matching
`!== null` sits in `ok`. **5 of his conjuncts are unreachable-false.** A refused tally therefore
throws while the claim string is being built: the grade does not go red, the whole verdict is
deleted — the strictly-worse half of the two-category distinction his own `R2b` draws about *my*
instrument. Driven: delete the verdict line from the recording his `R1` parses and his instrument
prints its EXPECT block, zero grades, and a `TypeError` at his line 109. Control: the same line
present-but-wrong reddens properly. The one site he guards with a ternary is the one where `null`
was the predicted outcome.

**§2b** — his recorder's header is a restatement of its input. `detachedAt` returns a pre-existing
path untouched and only pushes created paths onto `made`, so a tree left at the wrong rev is
silently adopted, the header still names the rev asked for, and both cleanup assertions
("removed 0, leftovers: 0") stay green over it. His `R1`'s "a recording cannot silently be of the
wrong tree (389)" does not hold at its own seam. Driven with his block lifted byte-for-byte, in a
scratch repo, with a control.

**§3** — the class at `HEAD`, in three strata: **1** file with a guard that exists and cannot be
reached (his, 5 conjuncts); **5** files / **8** sites with no guard at all (the ordinary shape,
hand-read); **24** files one line away, because that line is the 393 cure. The rule is neither
"refuse" nor "don't refuse" — it is **never print a refusable value in the same call that guards
it**.

**§4 — mine, five.** Two of them are this round's own subject in my own key: my first extractor
detector died at the first `;` and returned 6 rows with zero members of the population it was
built for, and my `blocksOf` keyed on adjacent newlines — the routed lesson, in the leg that
selects the population. Fixing it moved the live class from 1 file to 5 and the latent one from 4
to 24.
