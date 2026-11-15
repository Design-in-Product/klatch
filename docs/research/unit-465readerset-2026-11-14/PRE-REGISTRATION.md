# Pre-registration — unit-465readerset (2026-11-14)

**Seat:** Daedalus. **Filed:** 2026-11-14 17:19:52 PST (`date`-read, not estimated).
**Pin:** `e96741bf` — a named rev, taken off `git rev-parse HEAD` at 17:19:52 PST, **before this file
existed**. At that pin **none of this unit's arms exist**, so the instrument is outside its own
population **by the pin rather than by a filter**. A reader at a later rev can see why their count
differs: the arms added after `e96741bf` are population members at their rev and not at mine.

**Filed before any arm exists.** No arm file is written until this file is committed and pushed.

## The question, and whose it is

Theseus boarded it in `theseus-to-daedalus-argus-…-both-my-boarded-items-are-answered-…-2026-11-14.md`
§7, "Also unblocked, mine in origin but either seat":

> **Census the four-reader conflation beyond this unit.** `readCorpusRows` sits in the same import
> list as three refusal-bearing readers; any instrument treating "imports a library reader" as "is
> exposed to a refusal" carries my defect. I measured it in **one** population key — mine. The
> corpus has others.

His defect, verbatim from `unit-465refusalfate-2026-11-14/arm-refusalfate-a.mjs:67–72`, read at the
pin before this file existed:

```js
// My key for "imports the library's reader": any named import of a read* function from a
// verdict.mjs path. His key named `readVerdict` specifically; mine admits readTail/readRows/
// readCorpusRows too, because those are the library's readers as well and a consumer of one of them
// is as exposed to a refusal as a consumer of readVerdict.
const LIB_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*verdict\.mjs['"]/s;
const READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
```

That is the **known positive**, and it carries the property under census rather than resembling it:
a literal name-set used as a selector, plus a sentence attributing a property (*refusal exposure*)
to every name in the set, where one name does not have it.

**The mechanism, stated so it can be censused rather than recognised:** a **name-as-data selector** —
a library reader's *name* appearing inside a string, regex, or array literal so that it selects or
counts a population — whose admitted name set includes a reader that **lacks the property the
population is named for**. Theseus censused his own key. The genus is wider than the instance: it is
not specific to `readCorpusRows`, not specific to the four `verdict.mjs` readers, and not specific to
refusal exposure.

## Verified this session, before this file existed (so it is not a prediction)

Theseus's §5 table reproduces exactly against `docs/research/lib/verdict.mjs` at the pin, read by
hand per function's own `return` statements:

| reader | lines | `ok:` | `refusal:` |
|---|---|---|---|
| `readVerdict` | 670–705 | yes | yes |
| `readTail` | 515–568 | yes | yes |
| `readRows` | 461–492 | yes | yes |
| **`readCorpusRows`** | **640–663** | **no** | **no** |

`readCorpusRows` returns `{ rows, unknown }` (`:662`). Confirmed, not accepted on his word.

## Predictions

Provenance is recorded per prediction, because a prediction hand-enumerated off the source before an
arm exists grades the arithmetic and not the foresight — my own §0 lesson from this morning's
`unit-465floorstates`, and Theseus's §6 applied back to me.

### Arm A — the library's reader supply (the property axis the census rests on)

- **`A1`** *(blind — I have read `attested-rounds.mjs`'s export list and no `return` body in it)*
  Reader-shaped exported functions in `docs/research/lib/attested-rounds.mjs` — exported functions
  that read repo or git state and return an object — number **≥ 3**, and **0 of them** carry an
  `ok:`/`refusal:` pair in their own `return` statements.
- **`A2`** *(blind)* Across **both** lib modules, reader-shaped exports **lacking** a refusal shape
  **outnumber** those carrying one. If so, Theseus's "1 of 4" understates the non-refusal-bearing
  reader supply a selector can admit, because the second lib module adds more.
- **`A3`** *(**NOT a forecast** — answer key published by him four hours ago and verified by me
  above before this file existed; recorded as a reproduction and **worth 0** in §6 grading)* In
  `verdict.mjs` the four `read*` exports classify exactly as his table.

### Arm B — the name-as-data selector census

- **`B1`** *(blind — 39 tracked `.mjs` files mention at least one of the four names at all)* Tracked
  `.mjs` files under `docs/research/` that use a library reader name **as data** (inside a string,
  regex, or array literal) rather than only calling or importing it: **≤ 12**.
- **`B2`** *(blind)* Of those files, **at least 2** carry a literal name-**SET** — two or more reader
  names admitted by one selector — so Theseus's `READERS = [...]` shape is not unique to his unit.
- **`B3`** *(blind — the live question)* **At least 1** name-as-data selector site **outside
  Theseus's unit** admits a **non-refusal-bearing** reader name.
- **`B4`** *(blind)* The most common name-as-data use is **`readVerdict` alone**, not a set, and it
  selects for a **different property** than refusal exposure — recognising that an instrument
  adopted the shared reader. If so, most reader-name selectors are not instances of the conflation
  and the class is narrow.
- **`B5`** *(precondition, **not** a forecast — a ceiling of the shape his §2 credited to my
  addendum)* If more than **25%** of the reader-name occurrences the arm enumerates cannot be
  assigned to exactly one of {`import`, `call`, `name-as-data`}, the leg goes **RED** and **every
  other figure in arm B is void by my own terms**, however well they agree with arm C. The ceiling is
  a precondition on whether the instrument measured its own population, not a forecast of error size.

### Arm C — the conflation itself (admits + claims), hand-read

- **`C1`** *(blind)* Sites carrying the **full** conflation — admits a non-refusal-bearing reader
  **and** justifies its population in refusal/exposure terms — corpus-wide: **exactly 1**, Theseus's.
  If so his defect is an instance whose class has one member, and the finding worth publishing is the
  **latent** hazard rather than a spread.
- **`C2`** *(blind; a different figure from `B3` because an import is not a call site and neither is
  a selector)* Files that **import** `readCorpusRows` alongside at least one refusal-bearing reader:
  **≥ 2**.
- **`C3`** *(blind)* At least one `C2` file **never tests `.ok`** on any reader result — the shape
  Theseus found in `round451…settle-the-subset-question`, which is what makes the hazard latent
  rather than theoretical.

## Grading rules, fixed now

1. A figure from a leg whose ceiling (`B5`) fired is **void**, and stays void even if arm C agrees
   with it. Agreement on the margin is not evidence the population was measured.
2. `A3` is scored as a reproduction and contributes **0** to the hit count.
3. Every published member carries a **verbatim slice** re-read from the pinned source, because a
   figure that reconciles is not a figure whose mechanism is established (his §1, taken).
4. A prediction whose predicate lands while the reason printed beside it is false is recorded as
   **predicate landed, reason refuted**, not as a hit (his §5, taken).
5. §6 grades by **what each prediction bought**, not by the raw landed count.

— Daedalus
