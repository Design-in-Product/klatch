# unit-464notes — RESULTS

**18 of 18 registered cells HIT. 6 of 6 predictions HELD. One unregistered defect, mine, introduced
by my own C3 cure and found by the matrix in the same fire.**

Subject `docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs`. PRE = `git show 7c596cdb:<subject>`
(10433 bytes), POST = the cured file. Three drives, all recordings kept, all `.err` files 0 bytes.

## The matrix

| arm | PRE | POST | registered | land |
|-----|-----|------|-----------|------|
| A0CONTROL | GREEN 6/6 | GREEN 6/6 | G / G | HIT |
| **A1HKMASK** | **GREEN 6/6** | **RED, GHKNOOP** | G / R | **HIT — C1's known positive** |
| A1bHKPLAIN | RED, GHKNOOP | RED, GHKNOOP | R / R | HIT — isolation |
| A2PKFLIP | RED, GPKREACHED, `flips 3 [`4 names`]` | RED, `flips 4 (want 3) [`4 names`]` | R / R | HIT |
| A3ECHO | RED, GHKECHO, note **byte-identical to its own green note** | RED, `occurs 1 times (want 2)` | R / R | HIT |
| A4TSV | RED, `is byte-identical at the pin (6f830c72) and in the worktree (f70035c1)` | RED, `at the pin 6f830c72 != (DIFFERS) in the worktree f70035c1` | R / R | HIT |
| A5RENAME | RED, `SPAN: §2.1g → ### 2.1a …, 5106 bytes` | RED, `SPAN: start anchor absent` | R / R | HIT |
| A6TAILONLY | GREEN 6/6 | GREEN 6/6 | G / G | HIT — isolation |
| **A7DUP** | **GREEN 6/6** | **RED, `start anchor not unique: 2 line-start matches … at bytes 35262, 122892`** | G / R | **HIT — C3's second clause** |

The gate on the real tree reads **GREEN — 6 of 6 legs ok** before the cures and after.

## The predictions

* **P1KEY HELD** — exactly 1 arm (A1HKMASK) separates PRE from POST on `GHKNOOP`'s verdict.
* **P2NOTE HELD** — the C2 cure moves **no** verdict on any of the 18 cells. The only two verdicts
  that move are A1HKMASK (C1) and A7DUP (C3). C2 is a report cure and the matrix says so.
* **P3INERT HELD** — A6TAILONLY GREEN either side: the three prose occurrences of the anchor are
  inert while the heading stands.
* **P4DUP HELD** — A7DUP is GREEN on PRE. The pre-cure instrument was **silent** about a duplicated
  anchor, not loud.
* **P5SPAN HELD at exactly 5106 bytes** — Theseus's §4 figure reproduces to the byte.
* **P6CONTROL HELD** — A0CONTROL GREEN 6/6 on both versions, so the REDs carry information. His §5
  lesson 1 is why this arm exists: without it, nine refusing arms read as nine interesting REDs.

## The note-movement measurement, machine-made

The driver asks, per leg per arm: *is this note the same bytes as the same leg's note on
A0CONTROL?* — and flags any leg that is **RED with an unchanged note**.

* **PRE: 1 such leg** (`GHKECHO` on A3ECHO, a note that cannot report its own failure).
* **POST: 0.** Every red leg's note differs from its green note on every arm.

On PRE, **4** of the 8 mutated arms moved no note at all (A1HKMASK, A3ECHO, A6TAILONLY, A7DUP);
on POST only A6TAILONLY moves nothing, which is correct, because nothing about it changed.

## One defect of mine, introduced by the cure, caught by the matrix

C3 derives `gIdx` from the span's own anchored match instead of re-running the unanchored
`indexOf`. That made `HIST` print **`§2.1g ABSENT, so "above §2.1g" is unevaluable`** on A7DUP —
where the anchor is not absent, it is **duplicated**. A reason string that stayed put while its
predicate moved: precisely the class C2 exists to remove, re-introduced by C3 in the same commit
that removed four instances of it. Fixed forward (`HIST` interpolates `span.err`); `drive3` re-runs
all 18 cells with identical verdicts and both refusing arms now naming their real cause. The
pre-fix recording (`drive2`) is kept.

**The general lesson, and it is the second time this week:** a cure written beside its own grader
reproduces the defect it cures unless the grader measures the cure's *output text*, not only its
verdict. The verdict-level matrix alone would have passed this — 18 of 18 cells landed on `drive2`,
with the false `ABSENT` wording inside a cell marked HIT.

## Not claimed

None of the three is reachable in normal use. §2.1e makes the convention append-only; nobody
renames or duplicates a heading; `GP3ORDER` appears on exactly 1 of `drive5.prec.out`'s 47 lines,
so C1's blindness was **latent** and covered today by `GPKREACHED`'s name-keyed join. What is
claimed is that the predicates keyed on the wrong thing and four notes said things they had not
measured.
