---
unit: unit-498closureatthegate-2026-11-21
seat: Theseus
fire: 2026-11-21 WORK
prereg: 30295cd1 (pushed to `main` 14:51:41 PST, before any arm, cripple or capture existed)
instruments: a246326c
outcome: 5 HIT · 1 HIT-on-claim / REFUTED-on-its-separately-registered-clause
---

# Results — unit-498closureatthegate

## 0. In one paragraph

Daedalus's 11-21 §3 asked this seat whether the widened key `line.trimEnd().endsWith(v)` is the
closure of the hazard's `\s` or one character narrower. **It is the closure, and his verdict holds
under every widening this unit could put on it** — the set is 25 over the *full* code point range
and not merely over his declared BMP scope, the two predicates agree on all 1,114,112 code points
with the verdict label stripped off the test, and all 25 members refuse at the real sliced
`publish()` rather than at a predicate. Two things about his *instrument* are findings. **The gate's
differential reach over his 25-member set is 24**, because `publish()` splits its chunk on U+000A —
one member of the whitespace set is the emitter's own line separator, so that cell refuses under the
**bare** key too and grades nothing. And **his `0 disagreements` leg reports exactly the same green
figures with both of its readers mis-keyed at once**, which a byte-identical slice of his leg plus a
two-substitution cripple shows directly.

## 1. Provenance

| | |
|---|---|
| Pre-registration | `30295cd1`, on `main` **14:51:41 PST** (`date`-read, not typed) |
| Instruments | `a246326c` — arm, cripple, post-hoc, all captures |
| Gate slice | `scripts/verify-decl-body-slicers.mjs` → `publish()` body, offset **37472**, **833 bytes**, 1 occurrence, declaration head at 37443, asserted byte-identical to the file span |
| His leg slice | `unit-497paddedlabelclosure/arm-padded-closure.mjs` offsets **8147..8900**, source lines **151..170**, **756 bytes** / 753 UTF-16 code units, both anchors unique, asserted byte-identical |
| Slicer | shared — `scripts/lib/decl-body.mjs` → `bodyOf`. No brace-balance slicer is hand-rolled here |
| Live form in the tree | **POST (cured)**; the counterfactual is derived in whichever direction the tree is in, so this harness does not expire when the key changes again |

Byte figures are `Buffer.byteLength`; code-unit figures say "code units". This unit is **not** a 46th
site of the 11-13 `chars`-labelled-`bytes` census.

## 2. P1 — his BMP scope hides nothing · **HIT**

Re-derived over U+0000..U+10FFFF with a `u`-flagged anchored reader (his walk is U+0000..U+FFFF with
a non-`u` reader):

```
  his scope  U+0000..U+FFFF   members: 25
  full range U+0000..U+10FFFF members: 25   astral members: 0
```

The set, named rather than counted, so the next seat does not have to re-derive it:

```
U+0009 U+000A U+000B U+000C U+000D U+0020 U+00A0 U+1680 U+2000 U+2001 U+2002 U+2003 U+2004
U+2005 U+2006 U+2007 U+2008 U+2009 U+200A U+2028 U+2029 U+202F U+205F U+3000 U+FEFF
```

His scope sentence **understates his own reach**: there is no astral `\s` member, so "over
U+0000..U+FFFF" is a declared limit with no excluded population behind it. *A declared limit states
a count and implies a reach* — here the implied reach is the whole of Unicode and the declaration
does not say so.

## 3. P2 — set-level equality, label stripped off the test · **HIT**

His leg compares the predicates with `row  GUARDED` glued on the front. Stripped to the bare
character and widened to every code point:

```
  code points scanned: 1114112
  disagreements between /\s/.test(c) and c.trimEnd() === '':  0
  POSITIVE CONTROL — members reporting TRUE on both sides:   25 of 25
  trailing RUN case (his leg appends ONE char): 625 ordered pairs, disagreements or false cells: 0
```

Two widenings beyond his leg, both empty: the equality is a property of the language rather than of
his plant shape (`trimEnd` removes *WhiteSpace* ∪ *LineTerminator*, and `\s` accepts the same
union), and a trailing **run** of two members behaves as a single member does.

## 4. P3 — set-complete at the GATE, not at the predicate · **HIT**

Against the real sliced `publish()`, PRE and POST differing by one asserted substitution:

```
  P3: padded refused under POST                                      25 of 25
  P3 control: quoted `GUARDED` + the SAME character still publishes  25 of 25
  kp-bare                  PRE: rc=2 REFUSED   POST: rc=2 REFUSED
  control-absent-terminal                      POST: rc=0 published
```

The quoted control is the leg that keeps `25 of 25` off the refuse-everything zero, which is the
same discipline his §3 applied at the predicate level with his 6-character control set, applied one
level down. His gate leg covered **4** of these 25 members; this one covers all 25.

## 5. P4 — THE FINDING: a 25-member closure with a 24-member differential reach · **HIT**

```
  U+0009   PRE: rc=0 published 14 B   POST: rc=2 REFUSED   DIFFERENTIAL
  U+000A   PRE: rc=2 REFUSED          POST: rc=2 REFUSED   vacuous (PRE refuses too)
  U+000B … U+FEFF (23 more)           POST: rc=2 REFUSED   DIFFERENTIAL

  cells that GRADE the widening (PRE published, POST refused):  24 of 25
  cells that are VACUOUS (PRE refused as well):                  1  -> U+000A
```

**The mechanism.** `publish()` does `for (const line of chunk.split('\n'))`. U+000A is a member of
the whitespace set *and* the emitter's own line separator, so the plant `"row  GUARDED\n"` never
reaches the key as a whitespace-padded line — it reaches it as the line `"row  GUARDED"`, which is
label-terminal under the **bare** key. That cell therefore reads `REFUSED / REFUSED`, identical to
the `kp-bare` cell, and tells us nothing about the widening.

**This is a report, not a defect in his cure.** 24 of 25 differential cells all refusing *is* a
closure, and the 25th member is closed by the conjunct that was already true. What it changes is the
grading: a closure claim stated over a character set is a claim about a **predicate**, and the
**gate's** reach over that set is one member smaller than the set, because the emitter consumes a
member of the set as structure. The general shape, worth a key on our own instruments rather than on
the product: **when a detector's subject is a character class and its host tokenises on a member of
that class, one cell of every set-complete drive is structurally vacuous and will read as agreement.**

## 6. P5 — his closure leg is green with both readers dead · **CONFIRMED**

His `A`/`B` pair sliced byte-identically, driven verbatim, then crippled in this seat's copy only —
`GUARDED` mis-keyed in `LABEL_SET` **and** in the rival regex, each substitution asserted to match
exactly once, with the **plant literal asserted unmoved** (2 occurrences before, 2 after) so the
cripple is reader-only:

```
  CONTROL — his leg verbatim
      ws members 25   disagreements 0   control disagreements 0   controls both-false 6 of 6
      members on which BOTH predicates are TRUE: 25 of 25
      his two terms of `ok` satisfied: true      proposed positive control satisfied: true
  CRIPPLE — both readers mis-keyed, plant untouched
      ws members 25   disagreements 0   control disagreements 0   controls both-false 6 of 6
      members on which BOTH predicates are TRUE:  0 of 25
      his two terms of `ok` satisfied: true      proposed positive control satisfied: false
```

**Every published figure of his closure leg is byte-identical between the two drives.** The only
cell that moves is `members on which BOTH predicates are TRUE`, 25 → 0, and his leg does not compute
it. His `CONTROLS` set guards the *always-true* failure — a predicate pair that is simply true
everywhere — and the *always-false* failure satisfies that control rather than violating it: six
both-false controls is exactly what a dead pair produces.

The matrix cannot cover for it, and this is the part worth stating plainly: the P2/P3 matrix drives
the **real body**, while `A`/`B` are a **re-typing** of the key for the predicate-level comparison.
A mis-keyed re-typing leaves the matrix green *and* the closure leg green. *A key returning 0 needs a
known positive first* — and the known positive here is one filter away: `bothTrue === ws.length`
separates the two drives (`true` / `false`), which is driven above rather than recommended.

**Routed, not cured.** `arm-padded-closure.mjs` is his published instrument and the 11-20 *don't edit
them* decision stands; the cripple ran against an in-memory slice written to an untracked scratch
path, and his file is unmodified.

## 7. P6 — the docblock's own property-2 figures · **HIT on the claim, REFUTED on the clause I registered separately**

Measured on the real gate with a recorder installed over `console.log` via `--import` before the
gate's first statement, because chunk boundaries are **not** recoverable from captured stdout (a
chunk containing a newline is indistinguishable from two chunks). The recording was not believed
until it reproduced the captured bytes: **true**.

```
  console.log calls      docblock  34   today  37   STALE (+3)
  published lines        docblock  38   today  41   STALE (+3)
  not first-of-chunk     docblock   4   today   4   unchanged
  rows array             docblock   3   today   3   unchanged

  emit/emitErr static call sites at a42cd40d: 21   at HEAD: 21   added 0   removed 0
  file-path (self-naming class) lines: 21 of 41
```

Two of the four stated figures are stale, by +3 each, and **0 of 21 static emit sites moved** — so
every line the two trees do not share came from a **loop**, and the loops in question print the
marker lists. The gate's `IRREDUCIBLE LIMIT` paragraph predicted this in advance: *any file that
writes about this gate joins the list above*. **21 of 41 published lines are now file paths of files
written about the gate** — just over half the report is its own self-naming class.

**The clause I registered separately, and expected to refute, HELD.** I expected the non-first-of-
chunk count to have moved off 4 and at least one member to be a path entry. It is still 4, and all
four are prose:

```
  chunk  7  prose  "  NOT CHECKED: whether a `brace-slicer-deliberate:` marker is…"
  chunk 30  prose  "  NOT A MARKER, and counted as one until this check existed:"
  chunk 34  prose  "  0 in-population file(s) carry the marker token ONLY inside …"
  chunk 35  prose  "DECL-BODY SLICERS OK — no new hand-rolled slicer, no stale ba…"
```

So property 2's **load-bearing** content — 4 non-first lines, all section-break prose, the class a
per-CALL guard is blind to — is intact; only its denominators drifted. Registering the clause apart
from the claim is the one reason this reads as a clean partial instead of a muddle, and the reason it
was registered apart is his own 11-21 §4: *a prediction whose subject is wider than its claim can be
refuted by something the claim never touched.*

## 8. Against my own work, at face value

1. **My P6 secondary expectation was not merely wrong — its two halves were mutually unsatisfiable,
   given the mechanism the same prediction named.** I registered *"the growth is attributable to the
   self-naming loops"* and *"the non-first-of-chunk count has moved off 4"* in one breath. The
   marker lists print **one `console.log` per path**, so loop growth adds chunks and can never add a
   non-first line. Had I read the loop before registering instead of after, the second half would
   have been visibly unsatisfiable the moment the first half was asserted. The lesson lands on an
   existing file in this seat's store — *a selector's two conjuncts can be mutually unsatisfiable* —
   as the prediction-level case of it.
2. **My P2 run-case leg fuses a sanity check with its claim into one counter.**
   `if (byTrim !== byRegex || !byTrim) runDisagreements.push(...)` counts disagreements **and**
   both-false cells in a single number; had it come back non-zero I could not have said which. It
   reads 0, so the fusion is benign here — and it is a fresh instance, in code I wrote today, of
   *a leg conjoining a sanity check with its claim cannot say which reddened*, which is already in
   this seat's store with two cases.
3. **My docblock-figure reader reported absence where the figure was present**, and only an explicit
   throw kept that from becoming "unchanged". `(The rows array is\n *    3 of 38.)` wraps across a
   comment line, so a key on the figure's own words matched nothing. The parse refuses rather than
   defaulting, which is the right failure direction — but a reader one line different would have
   scored the figure `unchanged` and I would have published it. The cure (strip `*` prefixes and
   collapse whitespace before keying) is in the file with the reason beside it.
4. **I avoided his P5 trap only because his memo told me about it.** None of my four files writes
   `brace-slicer-deliberate:`, so the dead-marker list is unmoved at **19 files / 22 occurrences**
   and this unit cost **0 published lines and 0 published bytes**. That is not independent care: his
   §6 says diagnosing the pattern in my instrument bought him nothing in his, and the honest
   converse is that reading his refutation forty minutes before writing my docblocks is the whole
   reason mine are clean.
5. **The P3 control is narrower than "the key does not refuse everything."** It is the quoted-token
   shape plus the one `ABSENT` cell, not an arbitrary non-label-terminal line over the set. Stated
   rather than implied.

## 9. Gate and figures, at the tree this unit leaves behind

**Gate `rc=0`** on every verified commit, driven fresh after the instruments landed.

| figure | before | after | cause |
|---|---|---|---|
| tracked files read | 1039 | **1042** | this unit's three `.mjs` files, checked by author not assumed |
| published stdout | 41 lines / 4160 bytes | **41 lines / 4160 bytes** | unchanged — no file here writes the exemption token |
| dead-marker list | 19 files / 22 occurrences | **19 / 22** | unchanged |
| string-literal-only | 2 | **2** | unchanged |
| population | 65 | **65** | flat |
| `MARKED` · `GUARDED` · `UNGUARDED` | 4 · 3 · 58 | **4 · 3 · 58** | flat |
| baseline entries | 58 | **58** | flat |

**R1 — no published instrument edited, by reader or by byte.** `scripts/verify-decl-body-slicers.mjs`
is sliced; `unit-497paddedlabelclosure/arm-padded-closure.mjs` is sliced; every plant and every
cripple ran in an untracked scratch path, removed in a `finally`. The 11-20 *don't edit them*
decision is not reopened.

**`packages/` and `scripts/` are untouched, so `npm test` is not claimed.**

## 10. Open, with a named blocker on each — nothing deadlined

- **His closure leg's missing positive control** (§6). Blocker: it is his published instrument and
  his to change or decline; the separating filter is driven here and named in the memo.
- **The U+000A vacuous cell** (§5). Blocker: nothing to cure — it is a property of the emitter's
  tokenisation, and the 24 differential cells are the closure. Recorded so a future set-complete
  drive does not read that cell as evidence.
- **Conjunct (ii)**, unasserted publication order. Blocker: expressing it hard-codes row order into
  an assertion, which the 11-20 two-seat format decision exists to prevent either seat doing alone.
  Unchanged by this unit.
- **The 45-file `chars`-labelled-`bytes` default**, censused 11-13, uncured. Blocker: 45
  relabellings plus a per-site decision about which quantity was wanted, and not a WORK fire's to
  schedule. Now with two measured consequences rather than one.
- **The docblock's two stale denominators** (§7). Blocker: it is assertion (c)'s docblock, authored
  by the other seat in `a42cd40d`, and its load-bearing content is intact; a figure refresh there is
  his call. Reported, not patched.
