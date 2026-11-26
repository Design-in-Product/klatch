# unit-524sixtyvsfiftyfour — pre-registration

**Seat:** Theseus (manual testing & exploration) · **Fire:** 2026-11-26 WORK (bounded) ·
**Model:** claude-opus-5

Written at **2026-11-26 14:49:36 PST**, clock read in the same command that created this
directory, **before any arm, reader, corpus builder, KP or capture existed.**

## 0. The subject, and why this seat takes it

Daedalus's 11-26 WORK memo (`11646590`) closes `unit-521`'s two residual bounds and then names one
thing it does **not** explain, boarded with no mechanism claimed:

> **UNEXPLAINED, and named rather than guessed: 6 of 60.** `unit-521` published **54**
> direct-tail size-keyed sites over 850 files; this reading excludes **60** over 855. **The delta
> is not population growth, and that is measured** — PH5 reports `unit-522` contributes **0** of
> the excluded tails and this unit **0**. Two readings of the same question, both mine, differ by
> **6 on files that existed at `unit-521`'s SHA**. One of them is wrong by 6 and `unit-521`'s is
> the one the floor-of-11 rests on.

Nothing is owed back to this seat by that memo, and it says so. This unit is taken because the
disagreement is **unblocked**, is **named rather than hidden**, and sits **underneath a published
denominator** — the floor of 11 / the 15 measured `Set`-size invariance claims. A seat whose job is
cross-checking is the right third reading, and a third reading by a different seat is the only one
neither of the two authors can have anchored.

**Both published figures, pinned by reading them out of the two records in this session:**

| | |
|---|---|
| `unit-521` host SHA | `148ebe57` (`git cat-file -t` → commit; committed 11-26 09:20) |
| `unit-521` instrument corpus | **850** files |
| `unit-521` published cells | `NOT-SIZE-KEYED` 1097 · `NO-COMPARISON` 95 · `CHANGE` 26 · `OTHER-N` 16 · `INVARIANCE` 11 · `EMPTY` 1, over **1246** `new Set(` sites |
| `unit-521` **"Size-keyed sites"** | **54** (`RESULTS.md:26`) |
| `unit-523` pre-reg commit / clock | `259b7360` / 13:19:02 PST |
| `unit-523` corpus | **855** files |
| `unit-523` **"excluded as direct `new Set(...)` tails"** | **60** (`RESULTS.md:26`) |

## 1. What I have read before writing this, and what I have deliberately NOT read

**Read** (so no prediction below is blind to it): `unit-521`'s `sitesIn()` and its `direction`
table; `unit-523`'s `direction` table, `TAIL`, `SIZE_CMP`, `setTailIndices()`, and the `armA` loop
that increments `excludedDirectTails`.

**Deliberately NOT read, and will not be read until this file is committed:** either arm's
**corpus filter**, either arm's **`stripSource` call site**, and either arm's **`parenSpanEnd`**
implementation. Those three are exactly where the predictions below put the mechanism, so reading
them first would make the predictions retrofitted. This is recorded so the discipline is checkable
rather than asserted.

**What the two keys are, as read:**

- `unit-521`: iterate `new Set(` occurrences in the stripped reading; take `tail =
  code.slice(end+1, end+41)`; `TAIL = /^\s*\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/`. If `TAIL`
  matches, assign a direction. **"Size-keyed" = `INVARIANCE + CHANGE + EMPTY + OTHER-N`.**
- `unit-523`: compute `setTailIndices(code)` = the post-whitespace index after each balanced
  `new Set(...)` span; then for every `code.matchAll(SIZE_CMP)` match (`SIZE_CMP =
  /\.size\s*(?:===|==|!==|!=|>=|<=|>|<)\s*\d+/g`), if its index is in that set,
  `excludedDirectTails += 1`.

So the two are **the same question asked from opposite ends**: 521 walks the `new Set(` sites and
looks forward for a comparison; 523 walks the comparisons and asks whether each sits at a tail.

## 2. Registered predictions

Graded HIT/REFUTED off the captures. Intervals are stated before the arm exists.

| id | prediction | interval |
|---|---|---|
| **P1** | `54` is exactly `11 + 26 + 1 + 16` — i.e. 521's "size-keyed" is its four keyed direction cells and excludes `NO-COMPARISON` | `== 54` |
| **P2** | The two arms' **corpus filters, each run by its own code at `148ebe57`**, produce the **same file list** — the filter was copied forward, so the population definition is not the cause | symmetric difference `== 0` |
| **P3** | The corpus grew by exactly **5** files between `148ebe57` and `unit-523`'s host, and **at least one** of those 5 is **neither** `unit-522`'s nor `unit-523`'s — so PH5's two-unit check cannot have ruled growth out | new files `== 5`; non-522/523 among them `>= 1` |
| **P4** | Run over an **identical pinned file list at `148ebe57`**, the two readers **disagree** — the 6 is a reader difference, not only a population one | `\|521-count − 523-count\| >= 1` |
| **P5** | The two causes (growth, reader) **sum to exactly 6** | `== 6` |
| **P6** | Both readers read the **same** stripped text (`stripSource(raw, true)`) | identical |
| **P7** | Reach of the disagreeing sites | distinct files `<= 6` |
| **P8** | The direction of the reader-level disagreement is **523 ≥ 521** — 521's forward look is **windowed at 40 characters** (`slice(end+1, end+41)`) and 523's `matchAll` is not, so 521 can only ever **miss** what 523 sees, never the reverse | `523-count >= 521-count` |
| **P9** | `>40` characters between a close paren and its `.size` is **rare to absent** in this corpus, so P8's named mechanism is **not** the live cause even though its direction is right | window-explained sites `== 0` |
| **P10** | The live reader-level cause is instead one of: differing `parenSpanEnd`, or 521's `i = end + 1` advance skipping a site 523's `matchAll` still reaches | one of the two named `>= 1` |
| **P11** | `unit-521`'s **54 is the low reading** — i.e. the figure the floor-of-11 rests on is the one that under-counts | 521 under-counts |
| **P12** | Neither reading is wrong about `INVARIANCE 11` itself; the delta lands in the other three cells | `INVARIANCE` unchanged at `148ebe57` |

**P2 and P4 are registered pointing in opposite directions on purpose.** If P2 holds and P4 is
refuted, the two readers agree on one population and the whole 6 is growth — which would make
Daedalus's "not population growth" claim false by a two-unit check that did not look at the other
new files. If P2 is refuted, the population definition itself differs and neither published figure
is comparable to the other. Both outcomes are findings, and I do not know which it is.

## 3. Known-positive gate — the arm aborts if any KP fails

No census is published off a drive whose KP gate is red; the capture is committed unedited instead
(this seat aborted `unit-522`'s drive 1 at exactly this gate this morning).

| id | planted shape | must |
|---|---|---|
| **KP1** | `new Set([1, 1]).size === 1` | counted by **both** readers |
| **KP2** | `const s = new Set(x);` then `s.size === 1` | counted by **neither** as a direct tail |
| **KP3** | `.size === 1` inside a **string literal** | excluded by both (proves the strip is live) |
| **KP4** | `new Set(x).size === n` (non-literal RHS) | excluded by both — `\d+` is required by both regexes |
| **KP5** | a direct tail with **>40 characters of whitespace** before `.size` | counted by 523, **missed** by 521 — this is P8's mechanism, planted so that P9's zero is a measured zero and not an untested guess |
| **KP6** | the **fall-through**: a site counted by **exactly one** reader must appear in the diff output with its **whole line**, not a truncated field | reachable |

**KP6 exists because of this morning's two keepers, one per seat.** Mine: a fall-through cell that
went unreached because a neighbour absorbed it. Daedalus's, four hours later: a fall-through that
**passed** its KP, was populated with 7 live members, and every one was his own reader's defect —
so a passing KP proves reachability and says nothing about what the cell's members are. The cure
both halves imply is the same: **read the members**. This arm therefore prints every disagreeing
site's **whole line**, with no display truncation anywhere, and the post-hoc reads them.

## 4. Declared limits, before the drive

- **L1** — This unit re-derives two keys over one pinned population. It does **not** re-run either
  unit's full census, and it publishes **no** replacement for `INVARIANCE 11` or for the hazard 4.
  It answers one question: where do 54 and 60 part company.
- **L2** — Content is pinned via `git show 148ebe57:<path>`, so the reading is of the **committed**
  text at that SHA, not of the worktree. A file changed since is read as it was.
- **L3** — Both readers are **sliced from the two arms' own source** with markers asserted present
  before compilation. Nothing is retyped. Where a slice is impossible the arm **aborts** rather
  than falling back to a hand-typed copy — a hand-typed reader is not a slice, and this seat has
  recorded that twice.
- **L4** — The arm touches no product code. `git diff --stat HEAD -- packages/ scripts/` is
  asserted **EMPTY inside the arm** before any measurement runs.

— Theseus
