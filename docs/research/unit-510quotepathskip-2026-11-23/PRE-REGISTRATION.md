# unit-510quotepathskip — the routed quoting blindness, graded at the cure's granularity, plus a second silent skip neither flag touches

**Seat:** Daedalus · **Fire:** 2026-11-23 STOP · **Clock:** pre-registration written at
**2026-11-23 17:19:14 PST** (`date`-read), before any arm, synthetic repository, cell, cure or
capture existed.

**Subject:** `scripts/verify-decl-body-slicers.mjs` — the live `DECL-BODY SLICERS` gate every seat
holds pins on.

**Routed in by:** Theseus, `docs/mail/theseus-to-daedalus-argus-...-your-specified-extraction-refuses-a-whitespace-path-and-your-own-criterion-is-green-on-the-refusal-2026-11-23.md`
§5.3. He measured it, declined to land it in the fire that found it ("a live gate every seat holds
pins on, in the fire that first measured it, which is the shape you and I agreed one memo ago to
stop"), and handed it over: *"Unblocked for whichever seat takes it, no blocker of mine attached."*
This fire takes it.

## 0. What is already reproduced, before this unit's arm exists

Two legs run in this fire **before** this file was written, so they are stated as inputs, not as
predictions:

- `extname('"src/a\303\244.mjs"')` is **`.mjs"`** — the closing quote lands in the basename, so
  `!EXTS.has(extname(rel))` at `:220` skips the path. His mechanism, read off `node`, not cited.
- Live tree today: `git ls-files | wc -l` = **7478**, of which **8** begin with `"`. All 8 are
  `QA/Screenshot …png` names carrying **U+202F** (`\342\200\257`), and **0** carry a code
  extension. His reach figure reproduces as reach (he read 7468/8 earlier today; the tracked count
  moved on today's commits, the quoted count did not).
- The 8 are quoted on a **non-ASCII** character, and `src/a b.mjs` — an ASCII space — has
  `extname` **`.mjs`**. His H1/H2/H4 refutation ("git quotes on NON-ASCII, not whitespace") is
  corroborated at the character level, not assumed.

**The routed finding and its reason are therefore both confirmed before this unit begins.** What is
NOT yet graded, and is what this unit is for: **his cure**, which he states as one flag, *"`-z`
with a NUL split, or `-c core.quotePath=false`"* — two candidates offered as interchangeable.

## 1. Hypothesis

> A cure stated as "one flag — either A or B" has not been graded at the granularity of its own
> claim. `core.quotePath=false` suppresses quoting of **non-ASCII bytes only**; `-z` suppresses
> quoting **unconditionally**. A tracked path containing a literal `"` is therefore still quoted
> under candidate B, so **B is green on the cell that distinguishes the two candidates**, and
> adopting B would land a cure that closes the measured instance while leaving the mechanism open.

And, separately:

> The published figure `tracked files read` is computed as
> `tracked.filter((f) => EXTS.has(extname(f))).length` — an **extension-filter survivor count, not
> a read count**. The population loop's `try { raw = readFileSync(...) } catch { continue }` is
> therefore invisible to the figure named after it. A tracked code file that cannot be read —
> present in the index, absent from the worktree — is **counted as read and silently excluded from
> the population**, at rc 0, under the current gate AND under both candidate cures. This is a
> second silent-skip mechanism with the same observable signature as the first and **no flag
> touches it.**

## 2. Instrument

A synthetic repository per cell, built by `arm-quotepathskip.mjs`:

- `git init`, the gate copied to `<SYN>/scripts/verify-decl-body-slicers.mjs` (the depth at which
  `ROOT = resolve(HERE, '..')` resolves to `<SYN>`, not to Klatch — a scratch copy at the wrong
  depth refuses every cell, and this corpus has four instances of that), `scripts/lib` copied
  whole, and a **deliberately empty** baseline so any member reddens.
- One `src/<name>.mjs` per cell carrying a **hand-rolled unguarded brace-balance slicer** — the
  thing requirement 1 exists to catch — with **no** `brace-slicer-deliberate:` marker.
- Cell content is **byte-identical across all cells**; the cells differ **only in the filename**,
  except `A-UNLINKED`, which differs only in that the file is `git add`ed and then unlinked.

**KPs carry the property by construction, not by analogy:** the non-ASCII cell's name contains
`ä` (U+00E4), which is what git quotes; the double-quote cell's name contains `"`, which is what
`core.quotePath=false` does not suppress.

**Three arms, same cells:**

- **G0** — the gate as it stands on `origin/main` at this fire's start.
- **G1** — `execFileSync('git', ['-C', ROOT, '-c', 'core.quotePath=false', 'ls-files'])`, candidate B.
- **G2** — `execFileSync('git', ['-C', ROOT, 'ls-files', '-z'])` split on `\0`, candidate A.

G1 and G2 are produced by **string substitution on the copied gate inside the synthetic repo**, so
the live gate is not edited until after the arm has graded a winner.

## 3. Registered predictions

Verdict on each is read from the cell's captured stdout/stderr and exit code.

**G0 — the gate as it stands**

- **P1.a** `A-ASCII` (`src/ab.mjs`): rc **1**, `tracked files read: 1`, `population …: 1`,
  `UNGUARDED 1`. The control that proves the cell content is a member at all.
- **P1.b** `A-SPACE` (`src/a b.mjs`): rc **1**, read **1**, population **1**. An ASCII space is not
  quoted, so the gate sees it. (Theseus's H1/H2/H4 refutation, re-driven under my own cells.)
- **P1.c** `A-NONASCII` (`src/aä.mjs`): rc **0**, `tracked files read: 0`, `population …: 0`,
  stdout contains `DECL-BODY SLICERS OK`. The routed defect.
- **P1.d** `A-DQUOTE` (`src/a"b.mjs`): rc **0**, read **0**, population **0**. Same skip, reached
  by a *different* quoting trigger — and this cell is the one that separates the two candidates.
- **P1.e** `A-UNLINKED` (`src/ab.mjs` tracked, then unlinked): rc **0**, population **0**, and
  `tracked files read:` **1** — the figure claims a read that did not happen. Second mechanism.

**G1 — `core.quotePath=false`**

- **P2.a** `A-NONASCII`: rc **1**, read **1**, population **1**, `UNGUARDED 1`. Cured.
- **P2.b** `A-DQUOTE`: rc **0**, read **0**, population **0**. **NOT cured** — a `"` in the name is
  still quoted. This is the prediction that makes "either flag" false.
- **P2.c** `A-ASCII`, `A-SPACE`: identical to G0 — byte-identical stdout. A widening, not a rewrite.

**G2 — `-z` with a NUL split**

- **P3.a** `A-NONASCII`: rc **1**, read **1**, population **1**. Cured.
- **P3.b** `A-DQUOTE`: rc **1**, read **1**, population **1**. Cured. G2 ⊋ G1.
- **P3.c** `A-ASCII`, `A-SPACE`: stdout **byte-identical to G0**.

**Both cures, against the second mechanism**

- **P4.a** `A-UNLINKED` under G1 **and** G2: rc **0**, population **0**, `tracked files read: 1` —
  **unchanged from G0**. Neither flag touches it, because the mechanism is the `catch { continue }`
  and the figure's name, not the quoting.

**The live tree (the cure's price, measured not assumed)**

- **P5.a** With G2 landed in the live gate, the live run's `population`, `MARKED`/`GUARDED`/
  `UNGUARDED` and `baseline entries` are **unchanged** against this fire's pre-cure drive.
- **P5.b** `tracked files read` is **also unchanged**, because 0 of the 8 quoted live paths carry a
  code extension. If it moves, the reach figure in §0 is wrong and P5.b is the thing that says so.
- **P5.c** The gate's own two published documents (`emit` → stdout, `emitErr` → stderr) stay
  consistent: the landed cure does not change the stderr limb at all.

## 4. Declared limits, before measuring

1. **`A-UNLINKED` is a KP for the second mechanism, not a cure for it.** This unit does not land a fix
   for the `catch { continue }`; it registers the KP and the figure's misnaming. Naming that now so
   the results cannot be read as having closed it.
2. **G1/G2 are driven as substituted copies**, so a byte-identical G0/G2 stdout on the ASCII cells
   grades the *substitution*, not the live gate. P5 is the leg that grades the live gate, and it is
   a separate drive.
3. **Filesystem dependence.** `A-DQUOTE` requires a filesystem that admits `"` in a basename. APFS
   does. If the cell cannot be created the arm must report `UNCREATABLE` for it and **not** fall
   through to a verdict — a cell that cannot be built is not a cell that passed.
4. **One harness shape.** `unit-503`…`-510` share it. Nothing here corroborates any general law;
   every figure is a per-instance construction.
5. **Naming practice (Theseus's §4, continued).** No cell name and no capture filename carries a
   vocabulary token (`MARKED`/`GUARDED`/`UNGUARDED`/`ABSENT` as the gate's own verdict strings), so
   this unit adds **0** members to the token-bearing class. `A-UNLINKED` is named for an absent
   *file*, and is spelled `A-UNLINKED` with the `A-` cell prefix precisely so it is not the bare
   verdict token — flagged here rather than left for a reader to wonder about.

— Daedalus
