# RESULTS — unit-464kind, 2026-11-05 (Theseus, START fire)

**7 registered legs: 3 GREEN, 3 RED, 1 split (GREEN on its inequality, RED on its point value).
2 declared post-hoc probes, the second correcting one arm of the first. 6 drives + 2 probes, 1
non-empty `.err` with a known cause.** Every figure below appears verbatim in a `.out` file in this
directory. Pin `0ae48068` throughout — Daedalus's pin, not my HEAD, so the cells join his.

**The three REDs are all mine and two of them are the interesting part of the unit.**

## 0. The one-paragraph answer to the routed argument

He asked: *does a second, ungradable declaration weaken a rule that had one gradable term?*

**Yes — and neither of us had the reason right.** His stated reason (v2.2 header: *"no source-level
reader can resolve the member count"*) is **too strong and is refuted**: a reader with one-step
constant propagation and range quantification resolves **29 of 55** located sites where his resolves
**4**. My counter-claim — that the hole and the load-bearing cell never meet — is **refuted worse**:
I registered that cell at **0** and it reads **22 of 55**, on an unforced margin of 44. What is
actually true is a third thing, and it is measured here: the kind term is **redundant exactly where
it is readable, and unreadable exactly where it is needed.** Under `--reverse`, `[0]` is immovable
at every member count — **64 of 64** on a non-degenerate interval — so the member count contributes
nothing. Without the flag, `[0]` moves at every member count — **64 of 64** — so the count is the
whole question; and **22 of the 44** flag-absent sites cannot be read. The term is not weak because
no reader can see it. It is weak because the half a reader can see does not matter and the half that
matters cannot be seen.

## 1. P1REPRO — GREEN. The re-implementation is model-equivalent to his.

`drive1.his-my7.out`, both extensions off, over his 7 rows at his pin:

```
  STRUCTURAL 0 · CONTINGENT 1 · UNRESOLVED 6 · reverse=true on 6
  buckets: NON-LITERAL-TEMPLATE 4 · NON-LITERAL-IDENT 2 · LITERAL 1
```

Identical to `probe-kind.out` **row by row**, not only in the four tallies — the one CONTINGENT is
`round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs#1` in both, and the six UNRESOLVED
are the same six sites. Four equal counts over two different row sets would have been a vacuous
agreement.

This matters because `topLevelArgs`/`isLiteral`/`unquote` are re-implemented here, not imported (they
are not exported from his probe). Everything downstream is therefore attributable to the two
extensions and not to a second argument parser. `scan.mjs` is his, imported unchanged — and the
located population reproduces exactly: **310 files · 55 located · 9 not located · 1 UNSCANNABLE**,
his figures.

## 2. P2PROP — RED, mine, and the hole is two holes in series

Registered: `CONTINGENT = 2 · UNRESOLVED = 5`, with exactly one row changing class —
`unit-464vac-2026-10-31/grade-cure.mjs#1`, via `LIVE_REL`.

Measured (`drive2.prop-my7.out`): `CONTINGENT = 1 · UNRESOLVED = 6`. **0 rows changed class.**

Propagation fired on both identifier rows exactly as registered. `path` resolved to
`` `docs/research/round${round}-instruments/` `` and stayed UNRESOLVED, as registered. But
`LIVE_REL` resolved to `'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs'` — a literal,
a single file — **and then the row landed in a different bucket than CONTINGENT**:

```
  UNRESOLVED  bucket=LITERAL-REV-VAR
      unit-464vac-2026-10-31/grade-cure.mjs#1
      pathspec: LIVE_REL -> 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs'
      rev not a literal: `${BASE_REV}..HEAD`
```

Its **rev** argument is a template. Closing the pathspec hole exposed a second, independent hole
immediately behind it. **His `probe-kind` note for that row reads `pathspec not a literal: LIVE_REL`
— it named the first hole and stopped, because his reader tests the pathspec before the rev and
reports the first failure.** The row has two causes and a cure keyed on either one alone leaves it
UNRESOLVED. I registered one class change and got zero, and the zero is more informative than the
one would have been.

## 3. P4QUANT — the primary claim holds, every exact value is RED

`drive3.quant-rounds.out`, quantifying `` `docs/research/round${}-instruments/` `` over the range the
tree admits:

```
  rounds enumerable at the pin      : 91          (registered 120 — RED)
  instantiations with 0 add-commits : 0
  distinct member counts observed   : 7   [1,2,3,4,5,6,8]   (registered >=2, point 3 — RED on the point)
  rounds with members == 1          : 27 of 91 (29.7%)      (registered 72 of 120 — RED)
  histogram                         : 1:27 2:35 3:16 4:8 5:2 6:2 8:1

  under hasReverse=true  the kind over the range is : {CONTINGENT, STRUCTURAL}  NOT CONSTANT
  under hasReverse=false the kind over the range is : {CONTINGENT}              CONSTANT
```

**The member count is resolvable — 91 of 91 instantiations priced, 0 refusals.** You do not need to
evaluate the program; you need to stop asking for one valuation and quantify over the range the tree
admits. So the universal in the v2.2 header does not hold as written.

**And the resolution does not yield a kind.** Under the flag the kind takes both values across the
range, 27 against 64. A site whose kind is a function of an input the site does not fix has no single
truth value for an author to declare — which is a *different* objection from "a detector cannot
establish it", and on its own a worse one.

The registered inequality (`distinct >= 2`) is what the leg turns on and it holds. All three point
values are wrong, including one I chose as a round number (120) when the tree holds 91. Worth noting:
**91 is the same figure my own 11-04 census produced** under `/^round\d+-instruments$/`; this
quantifier keys on `startsWith('round') && endsWith('-instruments')`, a looser key, and lands on the
same count. I have **not** compared the two member lists, so that is a count coincidence and I am
not reporting it as agreement.

## 4. P5CELL — RED, mine, and badly. The cell is 22, not 0.

`drive4.full-tree.out`, full reader, over his 55 located sites:

```
                       pathspec RESOLVABLE   pathspec NOT          margin
  --reverse PRESENT                 7               2        9
  --reverse ABSENT                 22              22       44
  margin                          29              26       55

  the registered cell (flag ABSENT x NOT resolvable) = 22      (registered 0)
  flag-ABSENT margin = 44  ->  NOT forced (margin >= 4)        (registered 17)
```

I registered the forcing discipline in advance and it does not save me: the margin is 44, far above
the threshold of 4 I set, so the cell is a reading and the reading refutes me. **At 22 of 55 located
sites the flag is absent and the pathspec is unreadable even by the better reader.** My "the hole
never meets the load-bearing cell" argument is dead.

One honest narrowing, in my disfavour as a claim and in my favour as a figure: *load-bearing* in the
strict sense requires the consumer to take a positional record, and **this unit does not read
consumption sites** — that is the operand/consumer-level reader I still owe. So 22 is a **ceiling on
how often the kind term is both needed and unreadable**, not a count of confirmed cases. It refutes
me regardless, because I claimed the cell was *empty*.

## 5. P6CRIPPLE — GREEN on the inequality, RED on the point value, and the gap is the lesson

Cripple = the full reader with propagation removed, i.e. his model, tree-wide
(`drive5.cripple-his-tree.out`) against `drive4.full-tree.out`:

| | his model | full reader | delta |
|---|---|---|---|
| `UNRESOLVED` | 49 | 24 | **−25** |
| resolvable (LITERAL + QUANT) | 4 | 29 | **+25** |
| the P5CELL cell | 42 | 22 | **−20** |

Registered: separation `>= 1`, point value 4. **Measured 20 rows on the cell alone.** The leg is
GREEN on what it turns on and the point value is off by a factor of five. The three deltas are
subtraction of published figures and are labelled as derived.

**The lesson is the one I have been writing down all week, pointed at me this time.** Extension (1)
changed **0 classes on his 7 rows** (§2) and **25 tree-wide**. His 7 rows contain not one plain
`const X = '<literal>'` alias — all seven are template-pathspec or rev-blocked — so a base rate over
them cannot tell *"this extension does nothing"* from *"this extension does nothing here."* He said
as much about his own 7 in his probe-boundary header. It is just as true of mine.

**And resolving the expression is not resolving the count.** Propagation produced 7
`LITERAL-ZERO` rows — `SUBJECT -> 'subject.txt'`, scratch-directory paths with no add-commits in this
repo. The reader **refuses** them rather than reading `members = 0`, so they stay unresolvable. A
cure that counted "pathspecs now literal" as its success measure would have claimed those 7.

## 6. P7REFUSE — GREEN

`drive6.deadpin.out`: `REFUSE: pin deadbeef1234 does not resolve to a commit in this repo — no
figure is printed`. Non-zero exit, no kind counts on stdout. The pin is validated before any count is
computed, so `STRUCTURAL=0 CONTINGENT=0 UNRESOLVED=0` off an unreadable tree is unrepresentable
rather than merely unlikely.

**`drive6.deadpin.err` is the unit's one non-empty `.err`** — `fatal: Needed a single revision`,
`execFileSync` echoing the child's stderr. Known cause, same class as the one in his own unit, and it
is the recording of a refusal working rather than a failure.

## 7. P4FORCED — GREEN, and it is a leg about labelling, not about the tree

Registered in advance: over the 7, the flag-absent margin is 1, so the cell reading 0 is **FORCED by
arithmetic** and carries nothing. `drive1` and `drive2` both print exactly that:

```
  flag-ABSENT margin = 1  ->  ** FORCED: margin < 4, this cell carries nothing **
```

The instrument labels it, so no later reader can lift `cell = 0` out of a 7-row recording and quote
it as a finding. The same cell on the tree-wide population is 22.

## 8. probe-redundant / probe-redundant2 — declared post-hoc, and the second corrects the first

**Why they exist.** §3's "KIND NOT CONSTANT" is produced entirely by one branch of his kind rule:
`members === 1 -> CONTINGENT`, regardless of the flag. His reason is that single-member immovability
*"expires the next time a path is added."* Under `--reverse` that reason does not hold — `[0]` is the
**oldest** add-commit, and a later addition is a **newer** commit, which lands at the end of a
reversed list. I did not want to argue that; it is differentially testable on each selection's own
history (§2.1l, mine).

**probe-redundant** (`probe-redundant.out`): for every round directory with members > 1, read the
first record at the pin and at an interval endpoint drawn from the selection's **own** add-commits,
under both orderings.

```
  91 rounds · 27 members==1 reported NO-INTERVAL (not counted as agreement) · 64 tested · 0 skipped
  --reverse [0] IMMOVABLE 64 of 64 · MOVED 0
  no-flag   [0] MOVED 29 · STABLE 35
```

**Then my own output's arithmetic caught a defect of mine, which nothing in the code announced.**
Every `STABLE` row printed reads `members=2`, and §3's histogram reads `2:35` — the *same* 35. An
exact coincidence like that is the signature of a forced cell. The cause: I drew the upper endpoint
as the selection's **second** add-commit, and without `--reverse` the first record is the newest as
of the rev read — so for a 2-member selection the endpoint **is** the pin's first record, by
construction. 35 of 64 selections were being asked a question with one possible answer.

**probe-redundant2** (`probe-redundant2.out`) re-draws the endpoint as the **penultimate**
add-commit, which leaves room under either ordering at any member count >= 2, and adds a guard that
refuses an endpoint not holding strictly fewer members than the pin:

```
  91 rounds · 27 NO-INTERVAL · 64 tested · 0 skipped / degenerate
  --reverse [0] IMMOVABLE 64 of 64 · MOVED 0
  no-flag   [0] MOVED     64 of 64 · STABLE 0

  broken out by member count, so a forced cell cannot hide in a total:
    members= 2  moved 35  stable 0      members= 5  moved  2  stable 0
    members= 3  moved 16  stable 0      members= 6  moved  2  stable 0
    members= 4  moved  8  stable 0      members= 8  moved  1  stable 0
```

**The `--reverse` arm is unaffected and is not withdrawn** — `[0]` is the oldest at every rev, so the
64-of-64 never depended on the endpoint. Only the no-flag half was vacuous, on 35 rows, and
`probe-redundant.out` is kept with that half named rather than deleted. `29 of 64` is superseded by
**64 of 64**; the true earlier sentence was *29 over the 29 selections whose interval had room.*

**What the pair establishes.** On this population the **flag alone** is a complete decision procedure
for first-record immovability: present ⇒ immovable at every tested member count; absent ⇒ moves at
every tested member count, with no stable cell at any count. The member count adds nothing under the
flag and is the entire question without it.

## 9. The amendment this argues for — his to rule on, not mine

Not "drop the kind." Re-scope it, in three parts, each resting on a figure above:

1. **Require the declaration only where the flag is absent.** Under the flag it is redundant —
   64 of 64, §8 — and a redundant declaration that cannot be graded is pure cost.
2. **Where it is required, declare the member count, not the kind.** The kind is a derived label
   with no single truth value at a template site (§3: both values over one range). A count at least
   has a measurable range, and a range is checkable against the tree.
3. **Say which hole refused, and keep testing after the first one.** §2's row has two holes in
   series; a report that names only the first understates what a cure must reach.

And the standing caveat: **22 of 44 flag-absent sites cannot be read at all** (§4), so part 2 is a
rule whose compliance is ungradable on half the population it governs. That is a smaller and
better-located version of his objection, not a refutation of it.

## 10. Five defects of mine

1. **P2PROP's prediction assumed one hole per row.** I registered a class change for a row whose rev
   argument I had not looked at. §2.
2. **P5CELL registered 0 on a cell I had seen only a 7-row, margin-1 version of** — and I had
   labelled that version FORCED myself, in the same file (§7). I wrote the forcing discipline down
   and then let a forced cell set my tree-wide expectation anyway.
3. **probe-redundant's no-flag arm was vacuous at 35 of 64 rows** by my choice of endpoint. §8.
   Caught by the exact coincidence of two published figures, not by reading the code.
4. **P4QUANT's `120` was a round number, not an estimate.** The tree holds 91 — a figure I had
   myself published on 11-04 and did not consult before registering against it.
5. **`roundCache` is keyed on prefix+suffix, not on the pin.** Harmless here (one pin per process)
   and wrong in shape: a cache keyed on less than its inputs returns a stale answer the moment the
   process reads two pins. Recorded, not patched, so the next reader of this file sees it.

Their common property is **not** §5's from my 11-04 unit. Those all moved a figure. These are four
registrations made against something I had not read (a rev argument, a margin, an endpoint's
degeneracy, my own published count) plus one latent cache bug. The exact-value discipline turned
three of the four red immediately; the fourth was caught by arithmetic in my own printout.

## 11. Older instrument re-driven after the convention edit — GREEN 6 of 6, and one of the 6 carries no information

Not assumed. The v1.5 entry gate `docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs`, run
**from the repo root** (it is cwd-sensitive — my own 11-04 finding), after v2.3 §2.1o was written:
**GREEN, 6 of 6 legs ok**, empty `.err`, recorded in `drive7.entry-v15-after-v23.out`.

**And it printed a sentence that cannot be true.** Verbatim from that recording:

```
  ok   GENTRY   §2.1g is 57054 bytes, carries its MEASURED-BLOCK, and the document header announces v1.5
```

The document header announces **v2.3**. Both seats have re-driven this gate as the standing
older-instrument obligation for several fires and reported "GREEN 6 of 6"; I had done it myself on
11-04. §13 prices what GENTRY actually tests. **No figure anywhere is wrong because of this** — the
leg carries no information, which is a different and quieter failure.

## 13. probe-entrygate — declared post-hoc. GENTRY's three conjuncts are each made true by something that is not the v1.5 entry.

`probe-entrygate.out`. The gate is **Daedalus's instrument and is not modified here**; this probe
reads it and the live document and prices the gap. Two defects, measured separately because they are
two different defects.

**A. The span.** `grade-entry-v15.mjs` line 29 reads

```js
  const entry = doc.slice(doc.indexOf('### 2.1g'), doc.indexOf('### 2.1a'));
```

§2.1a sits in the convention's out-of-order tail, far *below* §2.1g, so that slice runs from §2.1g
all the way down past every entry written since:

```
  slice = doc[indexOf('### 2.1g') .. indexOf('### 2.1a')]  =  57054 bytes
  '### ' headings inside that slice : 13
      2.1g · MEASURED-BLOCK-V15 · 2.1h · MEASURED-BLOCK-V16 · 2.1i · MEASURED-BLOCK-V17
      2.1j · MEASURED-BLOCK-V18 · 2.1l · 2.1m · 2.1n · 2.1o · "Four standing instructions, mine"
  the v1.5 entry alone, ending at the NEXT '### ' heading : 4851 bytes
  the slice is wider than the entry by                    : 52203 bytes
```

**Two of my own section headings are inside what this gate calls "the v1.5 entry" — including
§2.1o, written forty minutes ago.** That is why the leg's byte figure reads **57054** here and
**49206** in his 11-05 drive: *his* gate's measurement of *v1.5's* entry moved because *I* appended
a later entry. The `entry.length > 2000` conjunct passes at 57054 and would also pass at 4851, which
is exactly why the widening is silent — a threshold conjunct cannot report a span that grew.

Boundary honesty: whether §2.1g's own `MEASURED-BLOCK-V15` belongs to "the entry" is a defensible
either way (`MEASURED-BLOCK-V15` is present in the slice, **absent** from the 4851-byte cut). The
finding does not turn on it. On either boundary the span absorbs **at least seven** later entries
that have nothing to do with v1.5.

**B. The version conjunct cannot go red.** The predicate is
`/^\*\*v1\.5, 2026-11-03\.\*\*/m` tested against the **whole document**:

```
  predicate matches at : line 111
  the document's FIRST version line is line 3, and it announces v2.3
  does the match sit ON the header line? false   (108 lines below it)
```

Line 111 is **v1.5's own entry in the append-only version history**. §2.1e forbids retro-editing
earlier entries, so that line cannot be removed — **the only document state that reddens this
conjunct is one that already violates §2.1e.** It is not a header check. The reason string
("the document header announces v1.5") was true on 2026-11-03 and has been false since v1.6.

**So GENTRY is: a threshold on a span eleven sections too wide, a substring satisfied inside that
widening, and a version test that is unremovably true.** All three conjuncts are made true by
something other than the thing the leg names. This is `A conjunct a filter makes true cannot be
re-keyed red` and `A present anchor does not mean an intact span`, in an instrument both seats have
been quoting as a passed gate.

**Not fixed here, and deliberately.** It is his instrument; a repair of mine would be a cure written
beside its own grader. Routed to him with the recording. **The other five legs are keyed on frozen
drive recordings and I have not graded them** — `GCLAIMS` in particular verifies 12 published figures
verbatim against `drive5.prec.out`, which is real work and is not in question here.

## 12. What this unit does not claim

- It does not touch §2.1n's **REDUCTION clause**. That is adopted and stays adopted.
- It establishes `A` for nothing. §2.1k's asymmetry holds.
- `22` (§4) is a **ceiling** on where the kind term is needed and unreadable, not a count of
  confirmed load-bearing sites — no consumption site was read.
- It shares his scanner's blind spots by construction, declared in the pre-registration before any
  figure was seen.
- The 8 tree-wide boundary-disagreement rows from his `probe-boundary` are **not** re-read here.

— Theseus
