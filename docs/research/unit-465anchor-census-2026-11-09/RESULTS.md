# unit-465anchor-census — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-09 STOP · `date`-reads: **19:49** (pre-registration),
**19:54** (this file; the clock was read, not estimated from effort) · **Model:** claude-opus-5
**Pre-registration:** `60d8edc8`, committed before the instrument existed and before any count was read.

Instrument: `census-anchors.mjs` (this directory, **not** `scripts/` — it adds no probe and no
registry row). Capture: `census-run-1.txt`. Drives: `drive-377.txt`, `drive-375.txt`.

## Headline, read off the capture rather than summarised

> `copiers: 2 · anchors: 13 (9 hand-typed, 3 derived, 1 UNREAD) · files: 5`
> `cells counted: 45 — 12 at >1 (COLLISION), 23 at exactly 1, 10 at 0`

**Six predictions, five true, one refuted — and the refutation is a blindness in my own reader.**

| # | claim | verdict |
|---|---|---|
| P1 | copier population is exactly `probe-round375` + `probe-round377` | **TRUE** |
| P2 | every **applied** cell reads `1`; no collision is live at my HEAD | **TRUE** |
| P3 | `copyProbe`'s six anchors: six hand-typed, zero derived | **REFUTED as written** — five hand-typed consts + **one the instrument cannot see** |
| P4 | `probe-round377` already carries one derived anchor (`DECL_ANCHOR`) | **TRUE** |
| P5 | `probe-round375` is not all-derived after `3489290f` | **TRUE** — 4 of 5 still hand-typed |
| P6 | `377` exit 0 `All 13`, `C5` list exactly `A1 A2 A4 C2`; `375` exit 0 `All 10` | **TRUE**, both re-driven here |

## 1. What is live, and what is only latent (R3)

**No collision is live.** Every cell on a pair the copier actually applies reads **`1`**:

- `probe-round375`'s `copy373` chain starts from `r373Src` (`:448`) — its subject is **`probe-round373`
  alone**. Its four hand-typed anchors (`C_IMPORT_OUTCOME`, `C_IMPORT_SWEEP`, `C_HERE`, `C_SANDBOX`)
  each read **1** in `probe-round373`.
- `probe-round377`'s `copyProbe` is called with **`R374` and `R375`** (`:717-772`, `:800-819`). Its
  five visible hand-typed anchors each read **1** in **both** files — including
  **`A_SWEEP_READ × probe-round375 = 1`**, the cell that crashed the gate tonight.

The APPLIED pairs are a hand reading of the call sites, and it is labelled as one. The instrument
counts a **superset** (anchors × 5 candidate files, 45 cells); a cell off an applied pair is a true
occurrence count but not an assertion any copier makes today.

## 2. The census reproduces tonight's crash from git history, without re-running it

`occ(probe-round375, A_SWEEP_READ)` read at four revisions:

| rev | what it is | count |
|---|---|---|
| `6b569a40` | Daedalus's pre-registration, pre-cure | **1** |
| `e501d6af` | the route cure — `const C_SWEEP = "const SWEEP = join(HERE, 'sweep-probes.mjs');"` | **2** |
| `3489290f` | the anchor repair (regex derived from `r373Src`) | **1** |
| `HEAD` | now | **1** |

So the key goes **1 → 2 → 1** exactly across the cure and its repair. **This census, run at
`e501d6af`, would have reported the collision before the gate did** — it needs neither a drive nor
the crash, only the two files' bytes. That is the thing §5 asked for, and it is now a 90-line reader
rather than a convention.

## 3. The mechanism, stated as the census measures it rather than as a story

**A hand-typed anchor puts a second copy of a foreign source line into the file that declares it.**
That is not a risk of the pattern; it is the pattern. Nine of nine hand-typed anchors do it, by
construction, and the 12 COLLISION cells are all that same fact seen from different files:

- **In its own copier** — `A_OUTCOME`, `A_R225_READ`, `A_SWEEP_READ` each read **2** in
  `probe-round377`, because that file *also* carries the real line. `A_SWEPT` and `A_HERE` read **1**
  there: literal only, no real line. Harmless **today** for one reason only — **nothing copies
  `probe-round377`.** The day a Round 378 copier does, three of its anchors collide on arrival.
- **Across the family** — `probe-round375`'s three import/`HERE` anchors read **2** in `374`, `375`
  and `377`. None is an applied pair, so none is a crash; all three are a standing invitation.

The asymmetry worth keeping: `probe-round375` is a subject of `probe-round377`, so a literal added
to `375` is a live hazard (and was, for 7 minutes tonight). A literal added to `377` is latent only
because `377` is nobody's subject yet.

## 4. The refutation is mine: a declaration-keyed extractor cannot see a parameter-bound anchor

`copyProbe`'s fourth substitution is `once(s, sandboxDecl, …)` (`:685`) — `sandboxDecl` is a
**function parameter**, so there is no `const sandboxDecl = …` to resolve and the instrument reports
**`UNREAD`** with that reason (R2 held: it was not dropped and not filled in).

Hand-read, and labelled as a hand reading rather than merged into the totals: the two values actually
passed are `SB374` and `SB375` at **`:690-691`**, and both are **hand-typed string literals**. So P3
is right about the file and wrong about what my reader can establish: **the hand-typed population of
`probe-round377` is seven literals, five of which this census counted and two of which it can only
name.** A census keyed on the declaration at the `once()` site is blind to an anchor hoisted into a
parameter — the same shape as the declaration-line blindness this seat has filed before.

**Second declared gap, which cost nothing this time and will not always.** The candidate file set is
keyed on `const X = 'probe-*.mts'`, so `sweep-probes.mjs` — the subject of `DECL` (`375:273`) and
`DECL_ANCHOR` (`377:670`) — **is not in it**. Both of those anchors are **derived**, so no hand-typed
cell was lost. That is luck, not coverage: a hand-typed anchor aimed at a non-`probe-` file would
sit outside this census entirely.

## 5. Refusals, checked rather than asserted

- **R1** — `git diff --stat -- scripts/ packages/` run: **empty**. No arm, no cure, no registry row.
- **R2** — no anchor value typed into the instrument; the one unreachable anchor is `UNREAD` with its
  reason, and its hand reading is reported separately above (§4).
- **R3** — every applied cell at `1` is called **latent**. The word "no hazard" appears nowhere.
- **R4** — the seven hand-typed anchors in my own file are **not cured here**. Blocker named below.

## 6. Not done, blockers named, no deadline from me

- **Deriving `probe-round377`'s seven hand-typed anchors** — the cure this census argues for, in my
  own file. **Blocker: it is a cure with grading legs, and `probe-round377`'s own pin is cross-pinned
  by siblings** (`C5` asserts the failing-arm list `A1 A2 A4 C2` on a driven copy of
  `probe-round375`). Seven derivations plus a cripple that reddens each is a unit, not a tail.
- **Teaching the instrument parameter-bound anchors** (resolve the enclosing function's call sites)
  **and non-`probe-` subjects.** **Blocker: both are extractor work, and doing them in the same fire
  that first ran the extractor would leave no honest reading of the version that shipped.**
- **Promoting this census into the gate** — it is the only form in which it would catch the next
  instance without a seat remembering to run it. **Blocker: a gate leg needs its own red, and I have
  not built the state that reddens it** (a planted duplicate literal), so proposing it would be a
  guard I cannot show failing.
- **`373` 15→16 + the `:108` fixture**, **`377` 13→14**, **`probe-round374b`**, **the shared guarded
  registry reader** — all four carried unchanged from my WORK fire; this unit touched none of them
  and claims none. The reader is now wanted by a third independent finding.
