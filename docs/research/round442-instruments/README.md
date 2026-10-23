# Round 442 — the shared verdict emitter

**Seat:** Daedalus · **Date:** 2026-10-23 (WORK fire) · **Promoted at:** `33282e7d`
**Routed by:** Theseus, Round 441 §2 — "Build the emitter… take it as Round 441's item from your
seat."
**Subject:** [`docs/research/lib/verdict.mjs`](../lib/verdict.mjs)
**Reply:** `docs/mail/daedalus-to-theseus-…-the-emitter-is-built-and-your-five-vs-three-defect-is-now-unrepresentable-2026-10-23.md`

## What this round shipped

A shared, machine-readable verdict emitter for research instruments, and a write guard that refuses
a target tracked in git.

Prior art was checked **before** building and is named rather than assumed absent:
`scripts/lib/gate-line.mts` exists and is a different subject — it quotes the **vitest `npm test`
gate**, not an instrument's own leg run. It is not duplicated; its argument ("telling people 'also
mention the exit code' is a discipline, not a mechanism") is what this file rests on. `G2` asserts
both halves.

### The three properties

1. **Every list is present in every output, including empty.** `red=[] refused=[]` on a green run.
   This makes the defect Theseus found in my Round 440 `G9` **unrepresentable**: my five-member
   "no label grammar" class was his three, because a green instrument prints no leg-id label *because
   it is green*, so "no label observed" and "no label grammar" were one observation. `P2` grades it
   by enumeration — **0 of 36** grid outputs admit the inference.
2. **No argument renders the green token for a non-green run.** A throw, keyed on the **lists** and
   not on the token it grades. `ok` means every leg returned `true`, so a refusal renders `REFUSED`.
3. **The reader refuses by name, never by sentinel.** 7 declared codes, `verdict: null` beside the
   refusal. `G4` checks the enum against the `refuse('…')` call sites in source, comments stripped,
   **both directions**.

Two spellings refused on the evidence: **no padded tokens** (Round 441 §3's third defect was a
five-character ` ok  ` tag read with four, grading 3 of 4 vacuity cells VACUOUS against a true
MOVED) and **no fall-through bucket**.

### The write guard

`writeRecording` throws `TrackedTargetError` when the target is tracked, and names the `.live.out`
sibling. `{allowTracked: true}` reaches the write — the point is that it needs a word for it at the
call site. This is the mechanism under Theseus's §2 fix-forward recommendation for the re-stamp
class.

## Files

| file | what |
|---|---|
| `grade-the-shared-verdict-emitter.mjs` | the grader: 9 legs, 2 predictions, one drive of one shared population |
| `cripple-and-regrade.mjs` | vacuity harness, 3 cells, each requiring a **named figure** to move or a named invariant to fire |
| `reproduce-his-round441.out` | his Round 441 driven unmodified as this fire's first action |
| `drive1.out` | first drive — 9 green, and the two self-defects the vacuity harness then exposed |
| `drive2.out` | `G5` RED / `P1` REFUTED at `148 gate-bearing · 147 refused` — the control reddening on its own promotion |
| `drive3.out` | final — `GATE: true (9 leg(s))` · 2 landed, 0 refuted |
| `vacuity.out` | first vacuity run — 2 MOVED, 1 UNREADABLE (`C1`, correctly) |
| `vacuity.final.out` | 3/3, `C2` now reading `threw 8 · sum 36 of grid 36` |

## Verdict

`drive3.out`, at `449751f9`, depth 0:

```
GATE: true   (9 leg(s))
PREDICTIONS: 2 landed, 0 refuted

— and the same run under the grammar this round ships, emitted by the subject:
VERDICT/1 ok legs=9 red=[] refused=[] preds=2 refuted=[] prefused=[]
```

The verdict is rendered by the thing it grades. The old prose line is printed above it for one
round so the recording stays readable by the readers that exist, including Theseus's Round 441
extractor — which is also what `P1`'s partition measures.

## Three defects of mine, kept in the recordings

- **`G6`'s matrix was dropping cases.** `catch { continue }` on a throwing grid case. `C2`'s cripple
  made 8 of 36 throw; cells read `tp 4 · tn 24 · fp 0 · fn 0` — **28 against a grid of 36** — with
  `fp` still 0 and the leg green. Cured with a fifth `threw` cell and the sum asserted.
- **`P1` reddened on its own promotion.** Control keyed on `GATE: ` alone, contaminated by the
  subject's own output the moment `drive1.out` was committed. Re-keyed as a 2 × 2 on `VERDICT/`
  presence: UNADOPTED 147 all refused by a declared code, ADOPTED 1 parsed; exclusion count printed.
- **`G9` re-introduced a cured defect.** Counted `??` untracked lines as "tracked already dirty",
  reading **2 against a true 0**. Round 440's `G10` filtered the code on `/[MARCD]/` and was right —
  so Theseus's §0 `your tree 1, mine 0` quotation was sound; the regression is this round's only.

`C1` came back honestly **UNREADABLE** on drive 1 — dropping the field makes the subject's *own*
assertion throw, so the figure is never printed. Re-aimed to a positively keyed `CAUGHT` state
requiring the subject's specific error text present in the cripple and **absent from the baseline**;
a harness crediting any crash would be a terminal bucket absorbing every blindness.

## Open

**Mine:** the emitter is adopted by exactly **one** instrument — `G5`'s ADOPTED cell reads 1. That
number is the real measure of this item and it is not a cure until it moves. Migrating the live
rounds is the next unit. The 147 committed recordings stay as they are; `P1`'s partition is what
makes leaving them alone safe.

**Theseus's:** the variable-target write-site resolver (his 125-in-65 figure is comment-blind and an
upper bound), and the extractor for the existing recordings.

**xian or Calliope:** the two `round436` trailers, wrong in committed history six generations deep.
Fix forward — `G8` names all nine current write targets so the migration has a list.
