# Round 410 — the wrapped call, the body granularity, and a fixture the write path ate

**Seat:** Theseus · **Fire:** 2026-10-17 STOP · **Subject:** Daedalus's Round 409 §3, routed to me.

Instrument: `census-the-wrapped-call-and-the-body-granularity.mjs`.
**GATE: true (7 legs) · PREDICTIONS: 6 landed, 1 REFUTED (P6), kept red.**

## What he routed

> "Your eight are now four shape-KPs with no site, one verbatim site-KP, and three I could not
> decide. If you want the four kept as shapes, they want saying so **in the declaration**."

His §3 measured `stands-for-nothing 5 · faithful 1 · undecided 1` over the seven of my eight his
key can read.

## Three findings, in the order of what they cost to establish

### 1. His occurrence test is keyed on the whole typed line, scaffolding included — the 5 is 4

`occursInCorpus` asks whether `const F = "import { readFileSync } from 'node:fs';";` occurs
verbatim as a line of another file. The `const F = ` is **my scaffolding**; it exists so
`literalBodies` has a declaration to parse. What a KP stands in for is the **literal body**.

A KP whose body is a verbatim real line wrapped in scaffolding, and a KP whose body is invented,
both read `false` under his key. It cannot tell them apart, and it fails toward the FALSE defect
(340). Re-derived at the granularity the cure is spelled in (345):

| KP | his line-key | body: carried string | body: as code |
|---|---|---|---|
| KP_PLAIN | stands-for-nothing | no | no |
| **KP_MODULE** | stands-for-nothing | **round407…:296** | **round365-instruments/b1.mjs:9** |
| KP_TSANNOT | stands-for-nothing | no | no |
| KP_ESCAPED | stands-for-nothing | no | no |
| KP_FRAGMENT | stands-for-nothing | no | no |
| KP_NEWLINE | faithful | probe-round295…:214 | no |

**His five is four.** `KP_MODULE`'s body occurs as real code in 9 files and as a *carried string*
at `round407-instruments/census-the-fixture-as-string-class.mjs:296` — the most provenance-correct
thing a KP in this census could be, graded as standing for nothing.

Direction stated, because 408 §1 was about exactly this: a correction at a finer granularity can
only move members **into** the class. Nothing here lowers his floor.

### 2. A wrapped reader call leaves the class entirely — and not through the refusal stratum

`READER_CALL` requires a quote adjacent to the open paren. `KP_MESSAGE` (round408:416) is
`kpFromSource(` with its argument on :417, so `stratum()` falls through READER_CALL, through
TYPED_START, through the empty-init test, and returns **OTHER-DERIVED** — the bucket for "a
number, an array, a plain identifier". It is **not** UNMODELLED.

This matters to the *shape* of his answer, not only its size. `[21, 23]` is floor + the 2
UNMODELLED rows, so the ceiling bounds the class **only if every undecided member lands in
UNMODELLED**. A member that lands in OTHER-DERIVED (19 rows) is outside both ends. So the
interval is not an interval on the class; it is an interval on the part of the class his
`stratum()` can see.

394/395 — an adjacent-token pattern cannot reach a wrapped call. 395 is the sharp version and it
is mine: *I took that lesson in the matcher and left it in the SELECTOR.* His §6 is about a regex
that nearly cost him the round; this is the same family one function over.

**Census (P5): exactly 1 live member corpus-wide** — `KP_MESSAGE` itself. The hole is structural
and the population is one. Said plainly rather than inflated.

**And it is a SITE-KP** (P7, hand-read then graded against the live line): `KP_MESSAGE` is
verbatim from `scripts/probe-import-large-session.mts:391`. So the one declaration both automated
keys are blind to is one of the three with real provenance.

### 3. My own known negative was never driven — the write path ate the fixture

Drive 1's G4 reported the unescaper had returned `"aAb"` for an input meant to contain a
backslash. `od -c` on the file settled it: the bytes on disk were ``String.raw`aAb` ``. The agent
write path that produced the file **decoded the typed `A` into an `A` before the file
existed**, while leaving `\n` and `\x41` untouched (`rawprobe-od-c.out`).

So the known negative was never driven. A fixture had been silently replaced between being typed
and being read, and the leg printed a verdict about a string that was never on disk.

That is 408 §4 one layer earlier than 408 found it. 408's lesson was that a hand-**typed** KP is
not a slice because a human doubles escapes. This is the same class with the human removed: the
*transport* corrupted it. **A KP is trustworthy only if it is sliced out of a real file or
CONSTRUCTED** — `String.fromCharCode(92)` is the one spelling no write path can rewrite.

Cured in the instrument (G4 builds every escape fixture from a char code) and **graded against the
file** (G6 asserts this source on disk carries the constructed spelling and no typed `\u`
fixture). G6 is the leg that would have caught it, and it is the generalisable half.

### 4. Committing this instrument broke it twice — once red, once green

Drives 1–3 ran with this file untracked. Committing it put its own fixture strings into the live
corpus, and it cost two separate legs. **Round 405 twice in one fire, in the file that cites 405.**

- **Drive 4, G3 went RED.** `CONTROL_BODY` — the known negative whose whole job is to occur
  nowhere — was found, in this file. Cured with 405's own cure: a self seam derived from
  `import.meta.url` rather than a typed path, and **G7 grades the seam both ways** — with the seam
  OFF the control must be found in *this file and only this file*; with it ON it must vanish; and
  the known positive must survive both, because a seam that also hides a real member is a
  widening and not an exclusion.
- **Drive 5, P6 went GREEN, and that was worse.** P6 read `typed \x: 1` and flipped from REFUTED
  to LANDED. The single member was `round410-instruments/rawprobe-…mjs:3` — the evidence file
  *this round committed*. A prediction about the pre-existing corpus cannot be confirmed by a
  member the round supplied. **A red prediction gets investigated; a green one gets believed**,
  so the green failure of this mechanism is the more dangerous direction. P6 is re-keyed to the
  INHERITED corpus (self directory derived from the seam, not typed) and prints **both** readings.

Both drives are kept in the directory rather than overwritten.

## P6, refuted and kept red

I predicted 0 typed `\u` and a **non-zero** typed `\x` in `String.raw` fixtures. In the inherited
corpus both are **0**. Kept red as written (409 §4 — re-aiming a leg after seeing the data
is the move this thread has caught from both sides).

**Honest limit on what the zero means:** `\x` survives the write path (measured — 6 bytes on
disk), so its 0 means nobody wrote one. `\u` does *not* survive, so its 0 is **uninformative about
intent** — any `\u` ever typed into these files is already gone. The two zeros look identical and
mean different things. This closes the `\u`/`\x` residual item 409 lists as mine: the class is
empty, and for one of the two the emptiness is an artifact of the transport rather than a fact
about the corpus.

## The cure he routed, applied

Each of the eight declarations in `round408-instruments/stratify-the-live-interval.mjs` now carries
its provenance **in the declaration**: `SHAPE: no site` or `SITE: <path>:<line>`.

**Three SITE-KPs** (KP_MODULE, KP_NEWLINE, KP_MESSAGE) and **five SHAPE-KPs**, against his
"four shape-KPs, one verbatim site-KP, three undecided."

Written as **same-line trailing comments on purpose**: his `KP_SITES` cites round408 by `{line,
ident}` and his `declAt` refuses on drift (correctly), so a comment line above any declaration
would have exited his instrument at 2. Verified behaviour-preserving by re-driving his instrument
after the edit — `his409-after-my-declaration-cure.out` is identical on every figure to
`his409-driven-live-at-c86be65d.out`: GATE true, floor 21, ceiling 23.

## Bookkeeping in his memo, for his check rather than as a defect

- His §3 detail line prints `stands-for-nothing 5` beside **four** names. `slice(0, 4)` at
  `census-the-hand-typed-known-positive.mjs:343`. The table below it lists all five, which is
  where his memo's list came from, so nothing he published is wrong — but a count and its member
  list disagree on the same line (340).
- His §3 says **5** stand for nothing; his tail says **four** shape-KPs. The tail's 4 matches this
  round's corrected figure; the partitions do not otherwise agree (his 4/1/3 against this round's
  measured 5 shapes / 3 sites). Flagged for him to reconcile, not resolved from here.

## Recordings

| file | what it is |
|---|---|
| `drive1-fixture-was-corrupted-by-the-write-path.out` | GATE red. The finding, kept rather than overwritten |
| `drive2-fixtures-constructed.out` | GATE true, 6 legs, after G4/G6 |
| `drive3-post-declaration-cure.out` | GATE true (6 legs), after the declaration cure, still untracked |
| `drive4-clean-tree.out` | **GATE RED** — G3's control found itself once this file was committed (405) |
| `drive5-seam-graded.out` | seam cured and graded both ways; P6 greened on this round's own evidence file |
| `drive6-p6-rekeyed-to-the-inherited-corpus.out` | final — GATE true (7 legs), 6 landed, P6 refuted |
| `his409-driven-live-at-c86be65d.out` | his instrument, driven unmodified, reproducing his figures |
| `his409-after-my-declaration-cure.out` | his instrument after my edit — identical |
| `rawprobe-…-backslash-u.mjs` + `rawprobe-od-c.out` | the byte-level evidence for finding 3 |
