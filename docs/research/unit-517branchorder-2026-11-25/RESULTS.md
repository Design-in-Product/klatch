# unit-517 — the ternary-blind branch-order extractor: results

**Seat:** Daedalus · **Fire:** 2026-11-25 WORK (bounded) · **Model:** claude-opus-5

| | |
|---|---|
| Pre-registration | `109f4948`, on `main` **13:20:30 PST**, before any script existed |
| Arm | `arm-branchorder.mjs` — `8189e3be`, **7 of 8** registered HIT |
| Addendum | `c6b9ba52`, on `main` before `posthoc-hazard.mjs` existed |
| Post-hoc | `posthoc-hazard.mjs` — `e0c9f88e`, **3 of 4** registered HIT |
| KP totals | cured extractor **9 of 9** (4 refusals) · guard reader **3 of 3** · region classifier **5 of 5** · parameterised extractor **9 of 9 under each of 3 names** · TypeScript refusals **4 of 4 (v2)** |
| Gate | `1106` at the pre-reg · `1107` at the arm · `1108` at the post-hoc; population **65**, **4 / 3 / 58**, baseline entries **58**, rc 0 at every push |
| Hygiene | `.err` **0 B** on both drives · `packages/` and `scripts/` `diff --stat` **EMPTY**, asserted inside both scripts · no comparison against a brace, paren or colon character anywhere in the unit |

## 1. What this unit was for

This morning's `unit-515` §5(i) accused my own instrument: the provenance of a precedence claim was
`[...body.matchAll(/cls: '([A-Z-]+)'/g)]`, which prints **4 branches of 6** of the key it claims to
show. I boarded the cure with a parenthetical — *"4-of-6 wherever reused; nothing reuses it yet"* —
and that sentence is an unmeasured claim about reach written in the same memo that found an
unmeasured claim about provenance. This unit cures the reader, re-grades the claim at full
granularity, and measures the reach I asserted.

## 2. Scores

| | |
|---|---|
| P1 the published artefact reproduces under the live slice | **HIT** — 4 members, `UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED` |
| P2 one blindness, two granularities | **HIT** — **4 of 6** branches *and* **4 of 8** class literals |
| P3 the blindness is exactly the discriminating branches | **HIT** — 2 of 2 missed are ternary, 0 of 4 caught are |
| P4 cured extractor reaches 6 of 6 / 8 of 8, inventing nothing | **HIT** — 0 invented members |
| P5 the precedence verdict survives at full granularity | **HIT** — literal-subject branch @243 precedes all 3 evidence branches |
| P6 a class-name sequence cannot name a branch | **HIT** — 4 of 8 non-unique; 1 of the 2 `FIXTURE` branches consults evidence |
| P7 reach: registered at 1 | **REFUTED** — **6 members / 11 hits** |
| P8 the cured extractor refuses rather than widens | **HIT** — 4 refusal cells held |
| PH1 a property name recovered per member | **HIT** — 6 of 6, 5 distinct names |
| PH2 the parameterised extractor re-KP'd, not inherited | **HIT** — 9 of 9 under `cls`, `p`, `error` |
| PH3 hazard reach registered at 1 of 6 | **REFUTED** — **2 of 6** |
| PH4 both figures published in one sentence | **HIT** (a commitment, met here and in the memo) |

**12 registered, 10 HIT, 2 REFUTED — both refutations mine, and both are my own claims about reach.**

## 3. The cured order, and what the old one could not show

```
old key   /cls: '([A-Z-]+)'/g
          UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED                              (4)
cured     UNRESOLVED → FIXTURE → FIXTURE → GATE → OTHER-PROCESS → CAPTURE → FILE → UNRESOLVED   (8)

branch 1  @119  plain    UNRESOLVED       guard: !subj
branch 2  @243  plain    FIXTURE          guard: /^['"`]/.test(subj.trim())
branch 3  @431  plain    FIXTURE          guard: /=\s*['"`]/.test(ev) && !/readFileSync|spawnSync|execFileSync|stdout/.test(ev)
branch 4  @593  ternary  GATE | OTHER-PROCESS   guard: /stdout|spawnSync|execFileSync|execSync/.test(ev)
branch 5  @775  ternary  CAPTURE | FILE         guard: /readFileSync/.test(ev)
branch 6  @900  plain    UNRESOLVED       guard: (none — fall-through)
```

**P3 is the generalisable half.** The blindness is not spread across the key at random. In this key
the ternary form appears **only** where a branch makes a sub-discrimination, so a quote-anchored
`cls:` reader is blind **precisely at the branches that discriminate** — and those are the branches a
*precedence* claim exists to compare against. The reader fails in correlation with what it was being
used to prove, which is why it read as confirmation: the four it does print are in the order the
claim needs.

## 4. The finding I would keep

**A verdict that survives its own evidence being corrected was never resting on that evidence.**

`unit-515` P3 claimed the literal test on the subject precedes every evidence test. Re-read over all
six branches by source offset — with a precondition asserted, not assumed, that the slice contains no
`for`/`while`/`switch`/`.sort(`/`.reverse(` that could make evaluation order differ from source order
— **the verdict holds.** The figure the claim cites moved from **4 members to 8**. The verdict did
not move at all.

This is `unit-515` §4 inverted. There, a cure that was exactly right recovered its 2 predicted rows
and moved **zero** figures. Here a cure moves the figure the claim cites and leaves the claim's truth
value untouched. In both cases the number is the thing that cannot be read: **a figure that moves
without the verdict moving, and a cure that is right without any figure moving, are indistinguishable
from a no-op if you only watch the totals.**

And P6 shows the provenance was lossy about the exact distinction the claim turns on. The cured
sequence contains `FIXTURE` twice and `UNRESOLVED` twice — **4 of 8 literals are non-unique** — so a
reader handed the sequence alone cannot tell *which* `FIXTURE` branch P3's text names. They are not
interchangeable: **exactly 1 of the 2 `FIXTURE` branches consults the evidence line** (branch 3
guards on the *absence* of read/spawn tokens; branch 2 never looks). A class-name sequence is not a
branch identifier whenever two branches return the same class.

## 5. Reach — both figures, as committed in PH4

```
SHAPE reach   files carrying the quote-anchored key                       6   (11 hits)
HAZARD reach  of those, whose property occurs in a ternary position       2
gap                                                                       4
```

The 6 members and the names their own keys read:

| member | hits | name |
|---|---|---|
| `docs/research/round404-instruments/grade-the-three-cures.mjs` | 1 | `p` |
| `docs/research/unit-515keyekp-2026-11-25/arm-keyekp.mjs` | 1 | `cls` |
| `scripts/probe-round213-reassign-live-http.mts` | 1 | `error` |
| `scripts/probe-round217-multipart-guard-live-http.mts` | 5 | `error` |
| `scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts` | 2 | `file` |
| `scripts/verify-recogniser-equivalence.mjs` | 1 | `conversation` |

**`6` alone overstates the reach of a blindness; `2` alone hides that four more readers are one
ternary away from the same failure.** Neither number is the finding — the **gap** is, and the gap is
a property of the corpus *today*. It closes the moment anyone writes a ternary into one of those five
property positions, and **no reader changes when it does.**

**PH3 is refuted and the refutation escalates rather than tidies.** I registered 1 of 6 — the subject
alone. It is **2**: `scripts/probe-round373-…mts` reads `file`, and `file` occurs in a ternary
position at `docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs:83`
(`typeof e === 'string' ? e : e.file`). The blindness I found in my own instrument this morning is
live in another seat's instrument, at a named file and line.

## 6. Against me

**(i) The region classifier was built on a false premise about the shared reader, and its KP set
caught it at 0 of 3 before it published anything.** I wrote in this unit's own docblock that
`stripSource` keeps a construct's delimiters and blanks only its body, so the nearest surviving
non-blank byte would be the opening delimiter of whatever region you are in. It blanks the construct
**whole**: `const r = /x/g` → `const r =      g`. The classifier returned `code` for all three known
positives, and **the census read `MEMBERS 0` while the classifier was dead** — a zero that looks
exactly like "nothing reuses it", which is the answer I had already written down this morning. Re-keyed
onto the property the module does guarantee — blanking is length-preserving, so `raw[i] !== blank[i]`
is an exact mask and the first masked byte of a run *is* the delimiter — **5 of 5**, and the real
figure is 6.

**(ii) My guard reader's rule rejected every guard it was written to find.** The first spelling
required no `return` between an `if`'s closing paren and the `cls:` site, to stop a guard being
attributed to the *next* branch. But a guard's own `if` is immediately followed by its own `return`,
so the test rejected it for its own branch: **guard reader 1 of 3**, and the one cell it passed was
the fall-through branch, which genuinely has no guard. **A reader whose only passing cell is the one
that expects `null` has not been shown to work.** Re-keyed to "no other `cls:` site in between" —
same intent, keyed on data the caller already holds — **3 of 3**.

**(iii) Four of seven ternary positives were not conditionals, and I found it by reading the
positives rather than the zeros.** v1's census reported `file` at 4 and `cls` at 5. Three `file` hits
and one `cls` hit were TypeScript: an **optional property** (`refusal?: RegExp`) read as a ternary,
and a value span that runs past a `;` because a TS type member is not comma-terminated. Both are
invisible in `.mjs` and this corpus is mixed. v2 cures both and is re-KP'd; **both censuses are
printed rather than the cured one swapped in**, because a decontamination fix removes false *credits*
as well as false debits and a silently smaller number cannot be audited.

**(iv) The verdict is 2 under both readers and that agreement is not the same evidence.** `file` goes
**4 ternary hits → 1**, `cls` **5 → 4**: the headline count is unchanged while **4 of its 7 supporting
rows were replaced**. Had I reported only the figure, the cure would have looked like a no-op
confirming the first reading. **A count that survives a cure of the instrument can have had most of
its members replaced, so the count was never what got checked — the rows were.** This is the same
shape as §4 from the other direction, and the third time in two fires that a total has been the one
thing in the output that could not be read.

**(v) One of my two TypeScript refusal cells does not separate the readers it was written to
separate.** v1 **passes** the `;`-terminator cell, because the overrun still yields `unresolved` and
still flags no ternary — the two properties my `ok` predicate grades. So the v1→v2 discrimination I
would have claimed from two cells rests on **one**, the optional-property cell. Reported as
`v1 2 of 4 · v2 4 of 4` with the per-cell rows, not as a pair of totals.

## 7. Open

- **Closed by drive:** the §5(i) ternary-blind branch-order extractor — cured, KP'd 9 of 9, reach
  measured in both senses, and the two wrong figures corrected at `unit-515` §7 where a reader hits
  them first.
- **Not mine to close, and routed rather than touched:**
  `scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts` is live-blind on
  `file` at 2 hits. **A frozen instrument stays frozen** (`unit-514`/`unit-516` precedent) and this
  one is another seat's. Named in the memo with its file, line and the ternary that reaches it; the
  decision whether it matters is the owner's.
- **Unblocked, mine, not done, no blocker:** the cured extractor is a reader in this unit, not a
  shared one. Nothing stops the next quote-anchored `cls:`-shaped reader being written, and the
  census that would catch it is a figure in a results file rather than a gate leg.
- **Unblocked, mine, not done, no blocker, carried and newly specified:** `BOUND-PATTERN` 6, the
  largest Key E sub-mechanism, needing a use-site search for the binding that no reader in either
  corpus does; `SUBJECT-IS-PARAM` + `CALLBACK-PARAM` keyed but not resolved (4 rows); the
  incrementally-assembled-object evidence model (2 rows), which no line-granularity reader can reach.
- **Theseus's, untaken:** the frozen-population-prediction pattern defect (`unit-516` §4); the
  `SECOND-ARG` nested-call blindness; the inherited concatenated-label blindness.
- **Not a measurement and not mine:** `unit-516` §5's 15-vs-0 census-purpose choice is xian's.
- **No owner, twentieth night:** the `ABSENT` hole.
