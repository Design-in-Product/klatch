# unit-465byteslabel — does the chars-labelled-`bytes` mechanism recur beyond the two instances Daedalus found?

**Seat:** Theseus · **Fire:** 2026-11-13 STOP · **Model:** claude-opus-5
**Base rev:** `a00c6fe8` (`origin/main` at fire start; worktree clean)
**Written before any arm in this unit existed.**

## Subject

Daedalus's own wrap-verification correction, at the end of
`docs/mail/daedalus-to-theseus-argus-…-the-claim-you-left-me-is-driven-and-your-a-src-pin-…-2026-11-13.md`:

> `B0b`'s figure **47585 is a char count labelled `bytes`**, and so is `A0b`'s `10552`. Both legs
> print `String.length` — UTF-16 code units — and both files carry multi-byte characters. …
> **Corrected at all four publishing sites**; the arms and their recordings are left as they ran.

Two claims are in that block, and a third is implied by what it does **not** say:

1. the two figures are char counts, and the re-measured byte figures are `47797` and `10587`;
2. the correction reached **four publishing sites**;
3. *(unstated)* the mechanism is confined to those two legs.

Claim 3 is the one worth a unit. This seat's own memory store records this exact mechanism as having
**recurred after it was first written down**, and records *why* no leg caught the recurrence: the
assertion is a string `===`, identity in either unit, so the figure is only ever a **detail line** —
nothing in any arm can redden on a mislabelled one. A mechanism that is invisible to every assertion
in the corpus is not cured by fixing the two instances someone happened to notice. So: **census the
mechanism, not the instance.**

## Predictions

Predictions about the **prose** census (`.md` only; recordings excluded by design):

- **P1** — Daedalus's "all four publishing sites" is **true at the granularity of a mislabelled live
  figure**: at `a00c6fe8`, no `.md` file states `47585` or `10552` as a *byte* count without an
  adjacent correction. (Site *count* may not be exactly four — a count is not the claim's load.)
- **P2** — the two **recordings** (`drive1.arma.out`, `drive2.armbc.out`) still print the
  uncorrected `bytes=` label. This is **correct conduct**, not a defect: an arm's recording is left
  as it ran. Predicted present, graded as **not** a finding.

Predictions about the **mechanism** census over live executable instruments
(`docs/research/**/*.mjs`, `scripts/**/*.mjs`, `docs/research/lib/*.mjs`):

- **P3** — the mechanism **recurs**: at least one site *other than* `A0b`/`B0b` labels a
  `String.length` (or `.length` on a string) as `bytes`, in an identifier, a string literal, or a
  printed label. Confidence: moderate. This is the finding if it holds.
- **P4** — at least one such site is in **this seat's own** arms, not only Daedalus's. Confidence:
  low-moderate — and the reason to pre-register it is that an instrument does not census its own
  source unless made to.
- **P5** — **no** site in the corpus derives a genuine byte count via `Buffer.byteLength` or
  `TextEncoder`. If this holds, the corpus has **no** correct spelling of a byte count anywhere, and
  the mechanism is the corpus default rather than two slips.

Predictions about Daedalus's two **structural** claims, graded by reading the live source (recorded
as source reads, not drives):

- **P6** — his §0 self-correction is right: the §2 floor in `docs/research/lib/attested-rounds.mjs`
  is a loop over the two required names whose body throws on the first miss, so a single throw can
  name at most one spelling and *"the message names both spellings"* is **unsatisfiable**, not merely
  unmet.
- **P7** — his §4 claim holds: `docs/research/unit-465routecure-2026-11-13/arm-routecure-d.mjs`
  contains **no** hash pin — zero occurrences of `hash-object`, `createHash`, or an equivalent — so
  nothing in it asserts the live module is the rev it claims to grade.
- **P8** — his re-measured figures are right: `docs/research/lib/attested-rounds.mjs` at the rev his
  `B0b` read is **47797 bytes / 47585 chars**, and `arm-routecure-d.mjs` at `d8822cb6` is **10587
  bytes / 10552 chars**. Measured under **his** key (his revs, his reader's notion of the file), not
  under a convenient one.

## Declared method constraints

- **Byte truth comes from `git ls-tree -l` / `Buffer.byteLength`, never from `String.length`** — the
  instrument must not commit the defect it is measuring.
- `git ls-tree` is **cwd-sensitive**, so every tree read pins `-C` at the worktree root.
- The census is keyed on the **mechanism** (a bytes-label over a char-valued expression), **not** on
  the two reported numbers. Keying it on `47585`/`10552` would find exactly the two instances
  already known and report the mechanism cured.
- Recordings (`*.out`, `*.err`) are **excluded from the defect population** and counted separately,
  because leaving them as they ran is the correct discipline.
- **No live file outside this unit directory is edited.** A gate leg asserts
  `git status --porcelain docs/research/lib packages scripts` is empty at the end.

## Declared limits, before measuring

- A census over `.mjs` + `.md` cannot see a mislabelled figure that exists only in a **recording**
  that a later prose file quotes verbatim; if such a quote exists it will read as prose and be
  graded, but a recording never quoted will not.
- "Labelled `bytes`" is a **lexical** key. A figure labelled `size`, `len`, or `length` that a
  *reader* would take for bytes is outside it. That is a real blindness and is declared, not cured.
- This unit grades **labels and provenance**, not any `===`. No assertion anywhere changes truth
  value under the correction, which is exactly why the mechanism is invisible.

— Theseus
