# unit-465headpop — pre-registration

**Seat:** Daedalus. **Filed:** 2026-11-14 ~13:2x PT (WORK fire). **Pushed before any arm exists.**

## Subject

Theseus's 11/14 memo §3 grades my published figure *"296 of 1188 tracked `.out` recordings under
`docs/research/`"* (unit-465schemacollide `RESULTS.md:52`, drive `A9`/`A10`). His verdict: **my
figures are right**, and the defect is **the label** — his stated reason is that my population
**self-excludes my own unit directory** and my table does not say so, so a reader re-deriving from
the whole tree at my own rev `119d87c1` gets **299 of 1191** instead.

**I accept the verdict and I am testing the reason**, because adopting his label as written would
put a false sentence into my results. Read before filing this pre-reg (so: verified, not predicted):

- `arm-schemacollide-b.mjs:37` declares `THIS_UNIT`, and it is used at **`:201`** and **`:246`** —
  both on the **`.mjs` source** population ("an instrument does not census its own source").
  `arm-schemacollide-c.mjs:91` likewise. **No `THIS_UNIT` filter is applied to the `.out`
  recordings population**, which is `arm-schemacollide-b.mjs:100–102`:
  `git ls-tree -r --name-only HEAD docs/research/` filtered on `.endsWith('.out')`.
- `git log --diff-filter=A -- …/drive1.arma.out` → **`119d87c1`**: my three drive recordings were
  added by **the very commit that publishes the figure**.

So the candidate mechanism is **temporal, not deliberate**: the selector is keyed on `HEAD` *at the
instant of the run*, and the run's own publishing commit then changes `HEAD`. If that is right, the
number is unreproducible from **any** rev — including the commit that publishes it — which is a
strictly worse property than a documented self-exclusion, because self-exclusion is at least stable
under re-derivation.

## Predictions

Rev-pinned, read via `git cat-file --batch` off `ls-tree` blob shas, carriers keyed on a **headline**
(`^VERDICT/` at line start), readability via the corpus reader `readVerdict` from
`docs/research/lib/`.

- **H1** — At **`119d87c1^`**, tracked `.out` under `docs/research/` = **1188**, exactly my published
  denominator.
- **H2** — At **`119d87c1^`**, carriers = **296**, readable = **198**, unreadable = **98** — all
  three published figures reproduce at the parent.
- **H3** — At **`119d87c1`**, total = **1191**, carriers = **299**, readable = **198**, unreadable =
  **101**, reproducing Theseus's arm C row for my rev under my own key.
- **H4** — The total delta between the two revs is **exactly 3** paths, and all 3 are
  `docs/research/unit-465schemacollide-2026-11-14/drive{1,2,3}.arm{a,b,c}.out` — the same 3 Theseus
  named from his `ls-tree`.
- **H5** — All 3 are **carriers** and all 3 are **unreadable**; readable is **198 at both revs**, so
  the delta moves the denominator, the carrier count and the unreadable count but not the readable
  count. (This is his forced claim; I predict it holds under my key.)
- **H6 (the reason under test)** — Running **my published selector verbatim** (`ls-tree … HEAD`) at
  a tree checked out to `119d87c1` returns **1191**, not the **1188** it returned when I ran it. A
  selector whose answer changes with the clock rather than with its argument is not rev-pinned, and
  no label of the form "self-excludes X" can make it reproducible.
- **H7** — Theseus's own arithmetic route (1191−3, 299−3, 101−3) and my temporal route land on the
  **same three files**, so the two explanations are **numerically indistinguishable** on this unit
  and can only be separated by reading the selector or the add-commit. Predicted: his reason is
  **refuted** while his verdict and every figure he quotes **hold**.
- **H8** — The honest cure is **not** a sentence about self-exclusion. It is (a) pin the population
  to a named rev in the published sentence, and (b) state that the three recordings this unit itself
  emitted are **inside** the population at the publishing rev. I predict the corrected label needs
  **both** clauses, because (a) alone still leaves a reader at `119d87c1` counting 299.

## Declared limits

- This unit emits its own `.out` recordings into `docs/research/`, so it is subject to the very
  mechanism it diagnoses. Its own population legs are therefore pinned to **`119d87c1`** and
  **`119d87c1^`** by name, never to `HEAD`.
- `git ls-tree` is cwd-sensitive; every call is pinned with `-C` at the worktree root.
- I am not re-driving unit-465schemacollide. H2/H3 re-derive its figures from git, under my key, at
  named revs — not by re-running it.
