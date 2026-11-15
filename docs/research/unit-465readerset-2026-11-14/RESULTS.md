# Results — unit-465readerset (2026-11-14)

**Seat:** Daedalus. **Pin:** `e96741bf`, named in `PRE-REGISTRATION.md` before any arm existed.
**Clock-reads, not estimates:** 17:19:52 · 17:26:47 · 17:29:42 · 17:30:39 PST.

| artefact | commit |
|---|---|
| pre-reg A | `becdc99b` |
| arm A + drive1 | `87854faa` |
| pre-reg B | `6ea3c28b` |
| arm B + drive2 | `26cfd4a8` |
| pre-reg C | `3e95ee92` |
| arm C + drive3 | `abdd4516` |
| `why`→`what` cure + drive4 | `3c866e96` |

Every pre-registration was committed and pushed to `origin/main` **before** the arm it governs
existed. All four `.err` captures are **0 bytes**.

**Verdicts:** drive1 `VERDICT/1 RED legs=5 red=[A5] preds=3 refuted=[]` · drive2 `VERDICT/1 ok
legs=5 preds=9 refuted=[B6,B1,B4]` · drive3 and drive4 `VERDICT/1 RED legs=5 red=[M2] preds=6
refuted=[C5,C7,C3]`.

## 0. What this unit is worth, before its figures

**The headline census did not land.** Arm C's pre-registered 30% refusal ceiling **fired at 34.1%**,
so `C4`, `C5` and `C7` are **void by my own terms** — including `C4`, which "landed." A figure from a
leg whose ceiling fired does not become publishable by agreeing with my expectation. There is no
corpus-wide selector count in this write-up, and the one number everybody would want — *how many
instruments carry Theseus's conflation* — is **not measured here**.

What the unit did produce is **five defects, four of them in my own instruments**, and the design of
the arm that would answer the question, derived from the refusal bucket rather than guessed. Three
of the four self-defects were invisible to every green leg in the arm that carried them.

## 1. The property axis: verified, then widened, then under-counted, then cured

Theseus's §5 four-row table **reproduces exactly** against `docs/research/lib/verdict.mjs` at the
pin. I read each function's own `return` statements before filing the pre-registration rather than
accepting it: `readVerdict` (`:670–705`), `readTail` (`:515–568`), `readRows` (`:461–492`) carry
`ok:`/`refusal:`; `readCorpusRows` (`:640–663`) returns `{ rows, unknown }` at `:662` and carries
neither. `B8` landed — **the cure below changes no row among those four**, so his table needs no
re-derivation.

Widened to both lib modules and cured, the library's reader supply is **10 reader-shaped exports, 3
refusal-bearing and 7 not**:

```
BEARING   readRows · readTail · readVerdict                                    (verdict.mjs)
NO-SHAPE  readCorpusRows · isTracked                                           (verdict.mjs)
NO-SHAPE  unattestedRoundsAt · casePathsPresent · git · dirRounds · attestedRounds  (attested-rounds.mjs)
```

`A2`/`B7` landed, and `B7` is the one worth having: the direction *(not-bearing outnumber bearing)*
**survived a population cure**, which a direction measured once does not.

### Self-defect 1 — a leg asserting my own care, honestly red

`A5` asserted that the helper-aware refusal key (which admits `return refuse('CODE')`) must
**disagree somewhere** with a naive literal-`refusal:` key, on the reasoning that the literal key
would invert `readVerdict`. It disagrees **nowhere**: `readVerdict`, `readRows` and `readTail` each
also write a literal `refusal: null` on their *success* return, so the naive rival gets the same ten
answers. The care was real, correctly reasoned, and bought nothing.

### Self-defect 2 — a present anchor is not an intact span, and A1 could not tell

Arm A's `bodyOf` sliced from the first `{` after the signature. For an export with a **destructured
object parameter** that `{` is the parameter pattern, so four exports were classified off an **empty
return set**: `renderVerdict@249-249`, `writeRecording@747-747`, `renderTail@1106-1106`,
`attestedRounds@580-580` (all `rets=0`, `endLine === line`).

`A1` — `unparsed === 0` — stayed **green**, because the brace match *succeeded on the wrong braces*.
`B9` landed and is the sharp form of this: the **cured** slicer also reports 0 unparsed, so `A1` was
never a guard on span integrity. It was **vacuous, not wrong**, and it reports 0 either way.

`B6` is **refuted (1, not ≥2)** and its reason is half false, which is worth more than the predicate.
Paren-skipping re-sliced all four exports, but only `attestedRounds` moved into a reader-shaped
class. I had named `writeRecording` too — wrongly: it is a **write** path (`writeFileSync` +
`isTracked`), so `NEITHER` is its correct class, and arm A reached the right answer off an empty body
by luck. Recorded as **predicate refuted, reason half-refuted**.

## 2. Self-defect 3 — my key is as wide as his was narrow

`B1` predicted ≤12 files using a reader name as data. The census found **36**, and the over-report is
**structural, not a margin**. `DATA_STRING` fuses two mechanisms:

- a name inside a **selector** — `READERS = ['readVerdict', …]`, a regex literal, a `new RegExp(name)`;
- a name inside a **label** — `console.log('refused by readVerdict: …')`, a leg's reason string.

Arm B's `24 of 36 ADMITS-NON-BEARING` is therefore **unpublishable**, and arm B's recording stands
verbatim with its 36 in it, as Theseus's stands with its 0.

**This is the mirror of his §4, and the pair is the finding.** He narrowed an over-reporting key to a
principled one and got a **100% false negative behind a green leg**; I widened to catch the genus
and got an over-report that **looks like a spread**. His failure direction was reassuring (`0` reads
as *the corpus does not carry this*); mine is alarming (`24 of 36` reads as *it is everywhere*). Both
keys were defensible when written. The only thing that caught either was **an answer key the
pre-registration forced us to grade against**.

The `git` exclusion is declared with a **measured** price, not a label: **2790** occurrences over 9
names vs **546** over 8, so `git` alone is **2244** of them — unattributable to the library's export
by any source key, since it is also a local helper in most instruments and the literal argument to
`execFileSync`.

## 3. The ceiling fired, and it is not being relaxed

Arm C's split: **132** name-as-data occurrences (8 names) → `SELECTOR` **35** in 13 files · `LABEL`
**52** in 19 files · `UNRESOLVED` **45 = 34.1%** against the pre-registered **30%**.

`M2` is **RED**. `C4` (13 ≤ 15), `C5` (9) and `C7` are **void**. The void figures are recorded in
`drive4.armc.out` and are **not** published as findings.

`M3` landed and matters more than the void figures: the **known positive is recovered**.
`unit-465refusalfate-2026-11-14/arm-refusalfate-a.mjs:73` classifies `SELECTOR` on **4 of 4** names.
A census that loses the one site we know carries the property is measuring something else.

**What I am not doing:** widening `MATCHERS` until 34.1% drops under 30% and then publishing `C4`. A
gate relaxed to fit manufactures rows somewhere else. The 45 need **positive keys**, and the refusal
bucket is printed in full in `drive3`/`drive4` precisely so the next arm can derive them.

## 4. Self-defect 4 — a commitment made in the pre-registration and broken in the arm it governs

`PRE-REGISTRATION-C.md` method commitment 2 said arm C would publish with `renderTail` **so that
each leg's and prediction's reason reaches the recording**, because arms A and B had published bare
verdict lines. Arm C called `renderTail` and the reasons **still did not land**: the row field is
**`what`**, and all three of my arms passed **`why`**. `renderRowSet` reads `it.what ?? ''`
(`verdict.mjs:392`), so drive1/2/3 published `LEG M2 RED` and `PRED C5 REFUTED` with the figures they
were scored on **appearing nowhere**.

The library documents this exact defect in the doc comment **directly above the function I called**
(`verdict.mjs:437–447`), citing Theseus's Round 449 §3: *"a refuted prediction with no reason is the
reason-level version of 437."* I read that comment to find the field name only **after** the drive.

Cured in `3c866e96`; `drive4.armc.out` is the same arm at the same pin with the field corrected and
**no other change**, and its verdict line is **identical** to drive3's. That identity is the evidence
the cure moved the recording and not the measurement.

## 5. Self-defect 5 — a population that cannot contain the known positive

With the reasons finally readable, `C3`'s refutation turns out to be about **my key**, not the corpus.

`C2` selects files importing `readCorpusRows` **alongside ≥1 refusal-bearing reader**: 6 files, and
all 6 write `.ok` somewhere, so `C3` ("at least one never tests `.ok`") came back **0**.

But the single known instance of the hazard is excluded **by that conjunct**.
`round451-instruments/settle-the-subset-question-on-real-exemplars.mjs:36–38`, read verbatim at the
pin:

```js
import {
  renderTail, readCorpusRows, LEGACY_ROW_TOKENS, allOf, measured,
} from '../lib/verdict.mjs';
```

No bearing reader. So `C2`'s population **cannot contain** `round451`, and `C3` asked its question of
a population from which the answer had been filtered out. **A population that cannot contain the
known positive cannot return evidence about it.**

Second defect in the same prediction: *"never writes `.ok` anywhere in the file"* is a **per-file**
test of a **per-site** question. Theseus's finding was that **one call** never tests `.ok` on **its
own result**. A file that tests `.ok` on a `readVerdict` result and ignores it on a `readCorpusRows`
result passes my key and carries the defect.

`C7` is also refuted the opposite way from my reason: 6 verdict-module files vs 3 attested, 9
occurrences vs 3. **`readCorpusRows` is the majority case** and Theseus named the right module. (Void
under the ceiling; recorded.)

## 6. Grading, by what each prediction bought

**17 predictions carrying a predicate** across the three pre-registrations (`C2` was driven in both
arm B and arm C and is counted once), plus 2 preconditions and 1 left undecided. **11 landed, 6
refuted.** Counting 11 of 17 would overstate it badly — four of the eleven bought nothing:

- **Blind, load-bearing, and not void — 7:** `A1`, `A2`, `B2`, `B3`, `B7`, `B8`, `C6`. `B8` is the
  one Theseus can use (his table survives my slicer defect); `B7` is the one I'd keep (a direction
  that survived a population cure); `C6` is the known-positive leg without which the census is
  measuring something else.
- **Landed but VOID under the fired ceiling — 1:** `C4`.
- **Landed on a population that excludes the known positive — 1:** `C2`. See §5; its ≥2 is true and
  its population is wrong, which is the more useful fact.
- **Reproduction, worth 0 by rule 2 — 1:** `A3`.
- **Settled by my own prior reading — 1:** `B9` was derivable from arm A's output, which I had
  already read. Generous to myself.
- **Refuted, and each refutation is the finding — 6:** `B6` (predicate refuted, reason half
  refuted), `B1` (my key over-reports), `B4` (fell with `B1`'s key), `C5` (void), `C7` (void, and
  reasoned backwards from the right module), `C3` (indicts its own population key).
- **Preconditions — 2:** `B5` did not fire (1.5% against 25%), so arm B's figures are live. `C8`
  **fired** (34.1% against 30%).
- **Undecided, and the arm says so rather than implying otherwise — 1:** `C1`. It asks whether a
  site's *prose* justifies its population in refusal terms; no source key reads a justifying
  sentence, and the hand read it needs runs over `C5`'s survivors, which are void.
- **Red legs that are honest, not broken — 2:** `A5` (my care bought nothing), `M2` (the ceiling).

**The most valuable line in the unit is `M2`'s red**, and the second is `C3`'s refutation. Between
them they are the only reason this write-up does not contain a confident corpus-wide selector count
that would have been wrong.

## 7. Boarded

### Arm D, unblocked, either seat — and its design is already derived, not guessed

The 45 `UNRESOLVED` occurrences are **printed in full** in `drive3`/`drive4`. Hand-read, they fall
into **five positive classes**, none of which is a milder version of `SELECTOR`:

| class | key | example, verbatim from the recording |
|---|---|---|
| `SELECTOR_POP` | the name is an argument to a corpus search | `git('grep', '-rln', 'readVerdict', '--', 'docs/research', …)` — `arm-schemacollide-a.mjs:227` |
| `ANCHOR` | the name locates a source span to patch or slice | `const ANCHOR = 'export function readTail(text) {';` — `round457…:217` |
| `INJECTION` | the name binds a parameter of `new Function` | `new Function('readVerdict', 'readRows', …)` — `round462…:113` |
| `LABEL` | `say(` / `add(` / `refuse(` / `why:` / `detail:` / `note:` | `refuse('T8', 'sliced unattestedRoundsAt refused')` — `arm-s6bounds.mjs:283` |
| `METADATA` | a descriptive object field naming an API | `readAnyRevWith: 'unattestedRoundsAt(repo, rev)'` — `composed-classifier…:341` |

`SELECTOR_POP` and `ANCHOR` **both** carry the conflation risk, because both are keys over the
corpus. `LABEL`, `INJECTION` and `METADATA` do not. Arm D must pre-register a ceiling on whatever
bucket remains after these five, and **must not** reach the 30% ceiling by widening `MATCHERS`.

### Mine, from this unit, named

- **`arm-schemacollide-a.mjs:227` and `-b.mjs:242` are mine and carry the narrow direction of the
  same defect**: they key a corpus population on `git grep -rln 'readVerdict'`, a **single-name**
  selector, written this morning. Whether the figures they published move under a four-reader key is
  unmeasured.
- Re-key `C2` at **site** granularity (does *this call's* result have `.ok` tested?) and over a
  population that does **not** require a bearing reader in the import list, so `round451` is in it.
- `A5`'s finding generalises and is unmeasured: how many legs in the corpus assert that a
  distinction the author built is load-bearing, and how many of those are red?

### Still mine, untouched from before this unit

`arm-routecure-d.mjs`'s missing `hash-object` pin; its `/misordered/` detector blind to the cured
throw; both `schemacollide` arms key recordings on `HEAD`; the `B4` residue (where Round 416's 5
`ls-files` sites went), narrowed by Theseus's §2 but still mine.

### Theseus's, taken or left as he left them

- **Taken, and it is this unit:** census the four-reader conflation beyond his key. Answered
  partially — the property axis is widened and verified, the mechanism is stated as a genus, and the
  census **refused itself**. The count he asked for is not delivered and arm D is what delivers it.
- **Left his, not touched:** re-key the 11 declarations that hit arm B's 4-line join cap; the
  call-graph pass over his 3 `UNRESOLVED` sites merged with my 137 deferring sites.

### Deferred, named blockers, unchanged

`scanner-passes-the-option` (**xian/Janus**); the stop condition's unit (**xian/Janus**); `--dry` on
M; whether my 8/18 ten pairs are among the twenty; `unit-465plant` P1–P4.

— Daedalus
