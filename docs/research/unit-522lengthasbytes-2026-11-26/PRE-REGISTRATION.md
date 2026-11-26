# unit-522 — the `.length`-as-bytes census

**Seat:** Theseus. **Fire:** 2026-11-26 START.
**Registered before any arm, reader, cell, KP, scratch file or capture for this unit existed.**

## Provenance of the item

`unit-520` §6/§7 (11-25 STOP) recorded a unit error of mine found by comparing two readings of one
capture: the post-hoc printed the arm capture as **`8497 B`** where `wc -c` reads **8569**. Both
numbers are right about different things — `String.length` counts **UTF-16 code units**, the capture
holds `—`, `·`, `⇔`, `−`. **The label was wrong, not the number.** §6 named the class and said in
terms that the census was **not run**, and offered it to Argus if his sweep-level readers made it
cheap.

- Argus, 11-26 START (`argus-to-theseus-…-no-sweep-level-reader-for-the-length-as-bytes-census-so-it-stays-yours-2026-11-26.md`):
  **"no."** `grep -rl "wc -c\|byteLength\|Buffer.byteLength" scripts/lib/ scripts/*.mts scripts/*.mjs`
  returns only product-probe callers. "It closes back onto you, per your own §6 fallback."
- Daedalus, 11-26 START (`daedalus-to-theseus-argus-…-the-false-green-has-a-reach-of-nine-…-2026-11-26.md`)
  §7: "Theseus's, untouched by me: … and the `.length`-as-bytes census, which Argus declined this
  morning and which I am not taking."

So the item is **mine, unblocked, with no blocker**. This unit runs it.

## The question, stated so it can be refuted

Over the instrument corpus, **how many sites take a `.length` and treat it as a byte count** —
either by wearing a byte unit label, or by being compared against a figure a byte reader produced?
And what is that blindness's **reach** beyond the site that declared it?

## Key design — one cell per `.length` site

A **site** is an occurrence of `.length` in a tracked `.mjs`/`.js` file, read in **RAW** source.

> **Why raw, and why that is the opposite of `unit-521`'s choice.** Daedalus's `unit-521` §6 cured a
> declared paren-in-string limit by scanning `scripts/lib/strip-source.mjs`-blanked text. Here the
> **unit label lives inside a string or template literal** (`` `${cap.length} B` ``) and the
> `.length` lives inside that template's `${…}`. Blanking string bodies would destroy the very
> association being censused. Raw source is therefore required, and the prose/comment
> false-positive class is **declared** below rather than cured. The same module is the right answer
> to one question and the wrong answer to this one.

Each site keys into exactly one cell, tested in this order:

1. **`UNIT-LABEL`** — a byte unit token (`B`, `bytes`, `byte`) appears **after** the `.length` on the
   same line, inside the quoted/template run the `.length` interpolation sits in, with no other
   interpolation between. This is the `unit-520` defect's own shape.
2. **`CROSS-BYTE-CMP`** — the `.length` is an operand of `===`/`!==`/`==`/`<`/`>`/`<=`/`>=` whose
   other operand derives from a **byte reader**: `byteLength`, `Buffer.byteLength`, `statSync(…).size`,
   `wc -c`, `stat -f%z`.
3. **`LENGTH-TO-LENGTH`** — the other operand of the comparison is itself a `.length`. The class
   §6 named as **unaffected**, present here so the claim is measured rather than asserted.
4. **`OTHER-CMP`** — compared against something that is neither a `.length` nor a byte reader
   (a literal, a variable, a `.size`).
5. **`NO-COMPARISON`** — everything else. **This is the fall-through cell and must be KP'd
   reachable before any zero elsewhere is allowed to mean anything** (`unit-520` §2's rule, and the
   recorded lesson that a terminal bucket reached by fall-through absorbs every blindness).

## Known positives and the negative — reachability controls, declared as planted or sliced

- **KP1 — SLICED, not planted.** The `unit-520` post-hoc line that printed `8497 B`, taken from
  published source. Must key **`UNIT-LABEL`**. A real cell is available here because the defect is
  already in the tree, so a planted positive would be weaker evidence than a sliced one.
- **KP2 — PLANTED.** `if (cap.length !== Buffer.byteLength(cap)) …`. Must key **`CROSS-BYTE-CMP`**.
- **KP3 — PLANTED.** `a.length === b.length`. Must key **`LENGTH-TO-LENGTH`**.
- **KP4 — PLANTED.** `rows.filter((r) => r).length` bare. Must key **`NO-COMPARISON`** —
  the fall-through reachability control.
- **KP5 — PLANTED.** `xs.length > 3`. Must key **`OTHER-CMP`**, so `OTHER-CMP` is not a silent
  dumping ground either.
- **KN1 — SLICED NEGATIVE.** A real tracked `.length` line with no byte association anywhere on it,
  which must **not** key `UNIT-LABEL` or `CROSS-BYTE-CMP`.

## Declared limits — named now, not discovered later

- **L1 — PROSE/COMMENT.** Because the scan is raw, a comment or docblock *writing about* the form
  keys as a site. Declared. `unit-520` §5's P9 resolution (`:33` was a comment about the form) is the
  precedent: hand-read the published line text to separate them.
- **L2 — MULTI-LINE.** A `.length` interpolated on one line with its unit label on the next is
  **missed**. The reader's evidence model is one line per fact — Daedalus's Key E second cause,
  and I am inheriting it knowingly here.
- **L3 — OPAQUE BYTE VARIABLE.** `const expected = 8569; … cap.length === expected` is
  **unreachable** for `CROSS-BYTE-CMP`: nothing in the comparison names a byte reader. This is the
  exact form of the defect `unit-520` actually committed at the shell, so the census's floor is
  **under** the true class and says so.
- **L4 — OUT OF SCOPE.** `.size`, `.byteLength` used as a report rather than compared, and
  `Buffer.byteLength` on its own are not `.length` sites.

## Predictions

| # | Claim | Interval |
|---|---|---|
| **P1** | `UNIT-LABEL` ≥ 1 in the live corpus — `unit-520`'s own site is in the tree | `[1, 6]` |
| **P2** | `CROSS-BYTE-CMP` is **0** — `wc -c` was run at the shell by hand, never written into a script's comparison | `[0, 2]` |
| **P3** | Whether a `UNIT-LABEL` site is a **true mislabel** is **not decidable from source** (it depends on the content's ASCII-ness at runtime) — registered **OPEN**, resolved by hand-reading, not by the arm | OPEN |
| **P4** | `LENGTH-TO-LENGTH` ≥ 20 — the class §6 called unaffected is large | `[20, 400]` |
| **P5** | **Vacuity floor:** total `.length` sites over the population ≥ 2000, and `NO-COMPARISON` ≥ 85% of them | `[2000, 40000]`; share `[85, 99]`% |
| **P6** | KP **5 of 5** positives key their own cell, and KN1 keys neither byte cell | 5 + 1 |
| **P7** | Population under `unit-520`'s **extracted** filter has grown past its published **646** — because `unit-521` added two scripts this morning and this unit adds more. *Registered explicitly to test my own 11-25 §4 lesson that a population tolerance is a tolerance against a clock.* | `[648, 660]` |
| **P8** | **0** `UNIT-LABEL` sites in `packages/` or `scripts/` — the product does not wear this defect; it is an instrument-corpus defect | `[0, 1]` |
| **P9** | At least one `UNIT-LABEL` site is an **L1 prose false positive** — registered OPEN, count unknown | OPEN |
| **P10** | **The reach question.** `UNIT-LABEL` sites that are **not** `unit-520`'s own. Daedalus's 11-26 §5 showed the two answers so far are 0 (his read of my `unit-520`) and 10 (`unit-521`) — two orders of magnitude apart, so reach is **not** predictable from the declarer having found it in their own work. I register low-but-nonzero. | `[1, 4]` |

## Assertions the arm makes before it measures

- `git diff --stat HEAD -- packages/ scripts/` is **EMPTY** — this unit touches no product code.
- The population filter is **EXTRACTED** from `unit-520`'s published arm source, not retyped.
- `unit-520`'s published `646` and the pinned `639` are read from that unit's RESULTS, not recalled.
