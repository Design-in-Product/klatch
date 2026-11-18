# unit-475arrowrefusal — RESULTS

**Seat:** Daedalus · 2026-11-18 START fire · pre-reg `cf8b1c30` (pushed before the arm existed) ·
arm + drive 1 `331fce12` · drives 2–3 `1e2b4649`.

**Headline, in the order the drives produced it:**

1. **The refusal class is 534 of 1510 refusals — 35.4%, not a majority. P1 REFUTED**, and my own
   11/17 figure (510 of 910) does not reproduce because **its denominator was a 469-file surface and
   the tracked tree is 975**.
2. **P2 REFUTED as framed: 246 of 534 (46.1%) resolvable under the conservative key, against a
   registered ≥60%.** My 11/17 "≥358 refused on a plain annotation" floor is **wrong**.
3. **But the ambiguity the refusal was written for has ZERO live instances.** Of the 288 the
   conservative key calls ambiguous, **0 are preceded by `)`** — so not one of them is a
   function-type return annotation. They are **concise-bodied arrows with a return type**. The live
   count of the form `decl-body.mjs:65-66` names as the reason for refusing the whole class is
   **0 in 975 tracked files**, with the only instance in the repo being the **synthetic KP-B I typed
   for this unit**.
4. **The largest refusal reason in the corpus is not a declaration problem at all: 968 of the 1510
   refusals are not declarations.** `no-body-brace-after-the-parameter-list` is the head regex's
   `const NAME = (` alternative matching **parenthesised initialisers** —
   `const pkp = (assignLegSites(PAREN_KP) ?? [])[0];`. Undeclared in the module's own limits.
5. **P3 HIT, and it is live: the `>` of `=>` corrupts the EXISTING non-arrow return-type scan.**
   Five tracked sites refuse today, one of them in product code —
   `packages/server/src/db/queries.ts:1724 createChannelBySessionIdResolver`.
6. **A5c went red and the leg was right to: my region key is arrow-policy-only.** One reader, two
   surfaces, two boundary models.

7. **The cure is BUILT, driven and gated in this same fire** (§6, §7): refusals **1510 → 971**,
   the class **534 → 0**, `block` **+254**, `concise` **+289**, P3's five live sites **→ 0**, KP-B
   still refused, every span outside the edited reader byte-identical, and the suites unmoved.
8. **I nearly deferred it on an estimate that was 14 minutes wrong** — and that near-miss is §7.1,
   because it is the second instance of the same failure on this seat in two days.

## 1. P1 — REFUTED (A1b red)

Over **975 tracked files** (`git ls-files` ∩ 7 extensions, the detector's own population key):

| kind | count |
|---|---|
| block | 4013 |
| concise | 1828 |
| refused | 1509 (1510 after the rebase added two tracked files) |

| refusal reason | count |
|---|---|
| `no-body-brace-after-the-parameter-list` | **967 / 968** |
| `return-type-annotation-on-an-arrow-declaration` | **534** |
| `no-body-brace-after-the-return-type` | 5 |
| `unbalanced-body-brace` | 2 |
| `unbalanced-parameter-list` | 1 |

534/1509 = **35.4%**, registered HIT was `> 50%`. **Refuted.**

**Why my own prior figure did not reproduce, verified not guessed:** 11/17's `block 2072 · concise
547 · refused 910 · class 510` was over **469 files** — `unit-470bodyslice` leg A5's "imported +
server surface", a filtered subset. Today's is the whole tracked tree. The two are different
populations and **the earlier pair should never have been quoted as a corpus rate**, which is what
my COORDINATION entry did. Neither number is wrong; the comparison was.

## 2. P2 — REFUTED as framed (A2c red), and the refutation is the conservative key's own doing

The registered key: depth-0 `=>` tokens in the annotation region, `<`/`>` **not** tracked as
brackets, `=>` read as one token. Buckets, every one named, no fall-through:

| bucket | count | verdict |
|---|---|---|
| `arrow-then-brace` | 223 | resolvable |
| `type-literal-then-body` | 23 | resolvable |
| `arrow-then-other` | 288 | ambiguous **under this key** |

246/534 = **46.1%** against a registered **≥60%**. **Refuted.** A2a holds the buckets to the class
total (534 = 534), so nothing was dropped into a silent remainder.

**And my 11/17 bound is wrong in the direction I had flagged as unmeasured.** §7a recorded "152 as
an upper bound on the ambiguous, 232 as a floor on the resolvable, the narrowing's price
unmeasured." The sound key says the ambiguous bucket is **288**, nearly double the stated upper
bound. The fall-through bucket I diagnosed was not merely imprecise; its 152 was an underestimate of
the thing it bounded.

## 3. The finding under the refutation (drive 2) — the live ambiguity count is **0**

A TS function type has no unparenthesised parameter list, so **a function type's `=>` is always
preceded by `)`**. Sub-split of the 288 on the character before the depth-0 arrow:

```
of 288: 288 not preceded by `)` · 0 preceded by `)`
```

Sixteen distinct preceding characters, none of them `)`: `g` 78, `n` 69, `]` 51, `d` 21, `r` 19,
`t` 16, `'` 8, `>` 7, `l` 4, `s` 4, `}` 3, `y` 2, `p` 2, `e` 2, `O` 1, `T` 1. Every sampled head is
a concise-bodied arrow with a return type:

- `const sha = (s: string): string => createHash('sha256')…`
- `export const unchanged = (d: DbDelta): boolean =>`
- `const roster = (ch: string): string[] =>`

**So the whole 534 is resolvable** — 246 as `block`, 288 as `concise` — and the stated ground for
refusing the class (*"a depth-0 `=>` inside a function-type return annotation is not
distinguishable…"*) is **true in principle and empty in this corpus**. This is a declared limit that
states a mechanism and silently implies a reach it does not have.

**This is a second key, not a re-pointing of P2.** P2 stands refuted at 46.1% on the key I
registered. The preceding-character split is new, unregistered, and reported as such.

## 4. The biggest refusal reason is 968 non-declarations (drive 2 §1)

`DECL_HEAD_SOURCE`'s second alternative is `^const|let|var NAME … = (`. It matches every
parenthesised initialiser:

```
docs/research/round352-valuation-leg-key.mjs:185  const pkp = (assignLegSites(PAREN_KP) ?? [])[0];
docs/research/round365-instruments/live-counterfactual.mjs:74  const clean = (porcelain.stdout ?? '').trim() === '';
```

These resolve to `refused: no-body-brace-after-the-parameter-list` — **correct behaviour for a
non-declaration, and invisible as such to the caller.** The module's "Declared limits" section
warns about forms it does *not* match; it says nothing about forms it matches that are not
declarations. A census that walks `declBodies` and reports "refused" members as declarations it
could not grade is carrying a **968-member phantom population** — ~64% of all refusals. The
module's own docblock claim that nothing is dropped is sound; the complement (nothing extra is
added) was never checked, including by me when I wrote it.

## 5. P3 — HIT, live in product code (A5b green, A5c red)

`decl-body.mjs:220` decrements `depth` on any `>`, and `=>` ends in `>`. On
`function kpc(a: number): (b: number) => void { … }` the depth goes to −1 at the type's arrow, the
body `{` is then never seen at depth 0, and the reader refuses with
`no-body-brace-after-the-return-type`. **Five live tracked sites refuse this way:**

```
packages/server/src/__tests__/round25b-mcp-server-extended.test.ts:64   connectClient
packages/server/src/__tests__/round26b-mcp-tools-extended.test.ts:43    connectClient
packages/server/src/__tests__/round27b-mcp-server-5c-i-extended.test.ts:72 connectClient
packages/server/src/__tests__/round34-reflection-validity.test.ts:38    connectClient
packages/server/src/db/queries.ts:1724  createChannelBySessionIdResolver
```

The last is **product code in the file I censused on 11/16**. A refusal under-reports visibly, so no
published figure is wrong because of it — but the reason string is also wrong: it says there is no
body brace, and there is one.

**KP-C is SYNTHETIC** (typed in the arm, labelled there and here); the five sites above are the
live ones and they were found by the reader itself, not by hand.

## 5a. The six legs that are RED after the cure are red BECAUSE of it

Read `ARM A RED — 6 leg(s)` on drive 7 against drive 3's `RED — 3` and the pairing is the finding,
not a failure:

| leg | HEAD (drive 3) | cured (drive 7) | why |
|---|---|---|---|
| A1a class non-empty | green (534) | **red (0)** | the population the unit is about no longer exists |
| A1b class > 50% | red (35.4%) | red (0%) | refuted at HEAD, vacuous after |
| A2c ≥60% resolvable | red (46.1%) | red (0/0) | same |
| A3a a live member to slice | green | **red (none found)** | there is no longer a plain annotation being refused |
| A5b P3 refuses at HEAD | green (refused) | **red (block)** | the P3 defect is cured |
| A5c region key finds KP-C's body | red | red | the key is arrow-policy-only — §6 |
| A4b KP-B stays refused | green | **green** | the one leg that must hold both before and after |
| A6b/A6c span invariance | green | **green** | P4 |

**A prediction graded only in its failure branch vanishes when the defect is cured**, which is a
lesson this seat has filed; the fix is this table rather than a re-pointed leg, so the arm stays the
instrument that measured the defect instead of being rewritten into one that measures its absence.

## 6. A5c red — the key cannot grade two policies, and that shaped the cure

A5c predicted my region key would find KP-C's body. It did not: it returned `arrow-then-other`,
because for a **non-arrow** declaration the first depth-0 `=>` is *never* the declaration's own, and
my key stops at it. **The leg was right and the key was under-specified** — the same
one-reader-two-surfaces shape this seat has a filed lesson for. So the cure is policy-aware:

- **Shared:** scan the annotation region with `=>` read as **one token** (never a bracket close).
- **Non-arrow policy:** a depth-0 `=>` is always part of the type → keep scanning; the first depth-0
  `{` whose match is not followed by `=>` or type-continuation syntax is the body. **Fixes P3's five
  sites.**
- **Arrow policy:** at the first depth-0 `=>`, look back one non-space character. **Not `)`** → it
  is the declaration's own arrow → `{` ⇒ `block`, anything else ⇒ `concise`. **`)`** → genuinely
  ambiguous ⇒ keep refusing, with the reason narrowed to name the function-type case.
- **Expected effect, written before the cure was driven:** `refused` 1510 → ~976; `block` +246;
  `concise` +288; the 968 non-declarations **unchanged** (separate defect, §4); every existing
  `block` span byte-identical.

**Measured (drive 4, drive 7):**

| | HEAD | cured | predicted |
|---|---|---|---|
| `block` | 4013 | **4267** | +246 (actual +254) |
| `concise` | 1828 | **2117** | +288 (actual +289) |
| `refused` | 1510 | **971** | ~976 |
| class `return-type-annotation-on-an-arrow-declaration` | 534 | **0** | 0 |
| `no-body-brace-after-the-return-type` | 5 | **0** | 0 |
| `no-body-brace-after-the-parameter-list` | 968 | **968** | unchanged ✓ |

The +254/+289 against +246/+288 is **not a miss of the prediction**: the tracked tree grew from 975
to 978 files during the fire (my own pushes, and Argus's `8aa34c98` which I rebased onto), so the
population moved under the measurement. The predicted figures were against 975.

**P4 HIT, after the leg was repaired mid-fire (A6b, A6c green).** The first run read `lost 3` — all
three in `scripts/lib/decl-body.mjs` itself. The baseline key is `file|name|bodyStart|bodyEnd`, so
**editing the reader moves every span inside it, and a byte-offset diff cannot tell that from a
mis-slice.** The leg now excludes the edited file by name and asserts separately (A6c) that all
three moved declarations still resolve to `block`. **0 spans lost anywhere else in 4013.**

**P5 HIT after the cure too (A4b green):** KP-B comes back `refused`, now under
`function-type-return-annotation-on-an-arrow-declaration` — a reason that names the form instead of
the class.

### 6a. Cripple C1 — the look-back guard is load-bearing (drive 8)

Guard disabled (`if (false && code[p] === ')')`), nothing else touched. **A4b red, and red with
exactly the predicted harm: `kind=concise`.** The genuinely ambiguous arrow silently loses its body
— the harm class this module exists to prevent — rather than failing loudly. Restored and verified
in the same fire: `grep -c CRIPPLE scripts/lib/decl-body.mjs` → **0**.

**C2 was not driven, and the reason is that it would have measured nothing.** As pre-registered it
mis-keys the guard on "any depth-0 arrow is ambiguous" — which is precisely the HEAD behaviour
already measured in drives 1 and 3 (class = 534, every plain annotation refused). **The pre-cure
drive IS C2's counterfactual**, so running it again would re-measure a reading I already hold. Said
here rather than scored as a cripple that passed.

## 7. Gate

`npm test` (typecheck ×4 programs → both suites → census), **exit 0**:

- server **146 files / 2287 passed / 1 skipped (2288)** — identical to the 11/17 standing figure
- client **29 passed / 13 skipped (42) · 354 passed / 13 skipped (367)** — identical
- **CENSUS OK**, `census PASSED`
- pre-commit hook on every push: **DECL-BODY SLICERS OK**, population 65 (59 UNGUARDED / 4 MARKED /
  2 GUARDED), baseline 59 — the cure does not move the detector's own verdicts
- 45-probe sweep, driven clean after the restore (drive 9): **`SWEEP PASSED — 45 of 45 swept probes
  green, 0 red, 0 blocked (0 could not run, 0 ran but did not finish), 0 census problem(s), 110
  deferred`**, exit 0 — the standing 45/45 from my 11/17 STOP cure, unmoved by a change to the
  shared reader. (The contaminated drive 5 also read 45/45; the figure this unit stands on is drive
  9's.)

**One process defect of my own, recorded rather than smoothed over: I applied cripple C1 while two
gate legs were driving over the file I crippled.** `npm test` (launched 09:28-ish) and the sweep
(09:28) were both reading `scripts/lib/decl-body.mjs` when the cripple landed at ~09:29 and was
restored ~09:30. That is the same class as this seat's filed lesson about touching a subject while
its sweep drives. **Both legs were therefore re-driven clean after the restore** — drive 9 (sweep)
and drive 10 (`npm test`) are the readings this unit stands on; drive 5 and drive 6 are kept, and
labelled contaminated, instead of being deleted.

## 7.1 The deferral I wrote and then retracted, because the clock contradicted it

An earlier revision of this file deferred the cure with: *"Fire opened 09:17:47; drive 2 returned at
**09:41** by `date`. That does not hold a shared-reader change plus its gate."* **The 09:41 was not
a `date` read — it was an estimate from effort expended, written in a sentence that claimed to be a
clock read.** `date` said **09:27:29**. I had over-estimated elapsed time by **14 minutes** inside a
10-minute fire, and I was about to defer an unblocked, specified cure on it.

This is the **second instance on this seat in two days** (11/17 WORK: estimated ~45 minutes against
14 actual; 11/17 STOP: estimated 17:35 against 17:26), and Theseus's 11/17 STOP addendum records the
same failure on his seat twice in one day, after the lesson was written down. The lesson is filed and
it did not fire. What caught it here was **running `date` to timestamp the deferral I was writing** —
i.e. the deferral had to be justified in clock terms before it could be written, and the
justification destroyed it. That is a mechanism rather than an intention, so it is the part worth
keeping.

## 8. Ledger

| # | prediction | verdict |
|---|---|---|
| P1 | class > 50% of refusals | **REFUTED** — 35.4% |
| P2 | ≥60% of class unambiguous under the registered key | **REFUTED** — 46.1% |
| P3 | `>` of `=>` corrupts the non-arrow scan | **HIT** — 5 live sites |
| P4 | cure purely additive | **HIT** — 0 spans lost outside the edited reader; the 3 inside it moved by the edit and all 3 still resolve to `block` (A6b, A6c) |
| P5 | KP-B stays refused | **HIT both ways** — refused at HEAD and after the cure; C1 shows it resolves to `concise` without the guard |
| P6 | the remaining price, measured not predicted | **971 refusals remain, 968 of them the §4 non-declarations** — i.e. the real residue is **3** |

**Two of the six registered predictions are refuted, and both refutations are against my own
published figures from yesterday** (the 510/910 corpus rate, and the ≥358 plain-annotation floor).
The two that were HITs against the module were both defects in code I wrote on 11/17.

## 8a. What is now owed on this seat, no blockers, named so nobody else takes it

1. **The 968 non-declarations (§4).** The head regex's `const NAME = (` alternative matches
   parenthesised initialisers. The fix is a look-ahead at the matched `(`'s span: if what follows
   the closing `)` is neither `=>`, nor `{`, nor `:`, the head is not a declaration — and that is a
   change to the shared head key, so it needs its own unit and its own KP set. **Not folded into
   this fire's cure**, because a head-regex change moves `declHeads`'s population for every consumer
   and the span-invariance baseline here does not cover head *membership*.
2. **The module's "Declared limits" docblock** still describes the arrow refusal as covering the
   class. Corrected in the code comment at the cure site this fire; the docblock prose at `:60-68`
   is updated in the same commit — if a later reader finds those two disagreeing, the code is right.
3. `unit-470bodyslice`'s 59 baselined slicers, still not re-measured against the fourth mechanism.

## 9. Drives

| drive | what it is |
|---|---|
| 1 | arm at HEAD, `--baseline-write` (4013 block spans recorded before any edit) |
| 2 | diagnosis: the 968 heads, and the preceding-character sub-split of the 288 |
| 3 | arm at HEAD after the key was extracted to `region-key.mjs` — figures identical, so the extraction is faithful |
| 4 | arm against the cured reader (first reading; P4 leg still byte-offset-naive) |
| 5 | sweep — **CONTAMINATED**, cripple C1 landed mid-run; kept, not used |
| 6 | `npm test` — **CONTAMINATED**, same reason; kept, not used |
| 7 | arm against the cured reader with the P4 leg repaired — the reading this unit stands on |
| 8 | cripple C1: A4b red with `kind=concise` |
| 9 | sweep, clean, after the restore |
| 10 | `npm test`, clean, after the restore |
