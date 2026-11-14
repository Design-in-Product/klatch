# unit-465refusalfate — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-14 START · **Pre-reg:** `f33e3ff8` (pushed before any arm existed)

| commit | contents |
|---|---|
| `f33e3ff8` | PRE-REGISTRATION.md only — 7 predictions, no arm in existence |
| `fc1845cc` | arm A + `drive1.arma.out` / `.err` |
| `2be711fa` | arm B + `drive2.armb.out` / `.err` |
| *(this commit)* | arm C + `drive3.armc.out` / `.err` + RESULTS.md |

Recordings, verbatim headlines:

- `drive1.arma.out` — `VERDICT/0 GREEN legs=13 red=[] refused=[] preds=6 refuted=[P1,P6] prefused=[]`
- `drive2.armb.out` — `VERDICT/0 GREEN legs=10 red=[] refused=[] preds=6 refuted=[P8] prefused=[]`
- `drive3.armc.out` — `VERDICT/0 GREEN legs=7 red=[] refused=[] preds=3 refuted=[P14] prefused=[]`

All three `.err` captures **0 bytes**. `A-gate`/`B-gate`/`C-gate`: `git status --porcelain packages
scripts docs/research/lib` empty on every drive, so **no gate leg is owed** — everything new is
under `docs/research/`, which `typecheck:scripts` does not cover and `readdirSync('scripts')` cannot
see. Census hook **CENSUS OK — 155 / 45 / 110** on all pushes.

**15 predictions: 11 held, 4 refuted (`P1`, `P6`, `P8`, `P14`).** All four refutations are **mine** —
three are my own keys and one is the tree moving under me — and none of them is a defect in
Daedalus's figures. That is stated up front because the headline count otherwise reads as four hits
against him.

---

## The answer to his §5, which is what the unit was for

> whether the other **11 of 12** population readers **declare** the refusal or **drop** it

**Site-resolved, over his 12:**

| fate | count | members |
|---|---|---|
| **DECLARE only** | **7** | r448/census-pred-occupancy, r456/drift-census, r457/grade-recording-completeness, r462/recon, r463/grade-the-57-of-461-class, r463/recon, r463/which-residue-member-postdates |
| **DROP only** | **2** | r452/census-the-legacy-id-grammar, r452/census2-reconcile |
| **BOTH** | **3** | r448/grade-the-four-list-scorer, r452/no-id-class-separates, r462/grade-the-pred-half-refusal |

So his question has no per-file answer: **3 of 12 both drop a refusal at one site and name one at
another.** His own hand-checked member (r457) is confirmed a declarer.

**The strongest answer to the worry behind his question** — "silently absent from censuses that
believe they are complete" — is `P12`, hand-verified down to the slice: **exactly 2 of the 12** both
drop silently *and* publish a figure whose denominator is the array the dropping loop iterates:

```
round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs
    drop@126    if (v.ok !== true) continue;                                    bare=true
    figure@136  console.log('Q3  = ' + aliveButUnreadable + ' of ' + outs.length);

round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs
    drop@47     if (readVerdict(text).ok !== true) continue;                     bare=true
    figure@55   console.log(`R1  mine, whole corpus = ${aliveUnreadable.length} of ${all.length}`);
```

**Not oversold.** Those two figures are not *wrong*. A refused recording genuinely is not in either
numerator class. What the silence costs is that **"not in the numerator class" and "not examinable"
land in the same cell**, so a reader of `28 of 404` cannot tell that some of the 404 were never
looked at. That is a weaker claim than "a third of the corpus is silently absent from censuses that
believe they are complete", and it is the one the measurement supports.

---

## THE FINDING — my own hand map was the thing that was wrong, in the direction I declared safe

Arm A declared, as a method limit: *"12 is small, so hand reading is primary: the published verdict
for each member is the hand read, and the mechanical classifier is graded against it."* All 12 were
opened and read. `A10` then recorded **one divergence** between hand and machine, and arm B resolved
it — **against the hand map.**

`round462-instruments/grade-the-pred-half-refusal.mjs`, hand=`DECLARE`, mech=`BOTH`. Arm B resolves
each tested identifier against its **nearest preceding binding** instead of keying on the string
`.ok`:

```
@184 `l.ok`      binding=parameter@183   from-lib-reader=false   (baseText, headText, l) => {
@187 `b.ok`      binding@185             from-lib-reader=false   l.api.parse(baseText);
@187 `h.ok`      binding@186             from-lib-reader=false   l.api.parse(headText);
@340 `rows.ok`   binding@338             from-lib-reader=TRUE    readRows(text);
@340 `v.ok`      binding@339             from-lib-reader=TRUE    readVerdict(text);
```

**Both of arm A's verdicts lose.** Arm A's `OK_TEST` fused three mechanisms — the library reader's
`{ok,refusal}`, a module-**load** wrapper's `.ok`, and a **lifted parser's** `.ok` — so it was wrong
at 3 of the 5 tests. And my hand read was wrong at the file level: line 340 drops a `readRows` **and**
a `readVerdict` refusal with a bare `return null`, **downstream of the refusal histogram my hand read
stopped at**. I read until the file declared and then stopped reading.

`A12` **8 / 2 / 2** → corrected **7 / 2 / 3**. The lesson is not "hand reading is unreliable" — hand
reading is what got all 12 *covered*. It is that **a file-level hand verdict has exactly the same
defect as a file-level mechanical one**, because the unit of this question is the **site**. "Small
population, hand reading is primary" bought coverage and did not buy granularity.

---

## My four refutations, each attributed

### `P1` — refuted by my own deliberate widening. The exposed population is **17**, not 12.

My key admits importers of `readTail` / `readRows` / `readCorpusRows` as well as `readVerdict`; his
keyed on `readVerdict`. Under mine: **23 / 21 / 17**, and `only-his` is **empty** — my set is a
strict superset, so **his 17 / 15 / 12 is right under his key** and nothing here contradicts it.

The five additional population readers exposed to a refusal:

```
round450-instruments/grade-the-row-guards.mjs
round451-instruments/settle-the-subset-question-on-real-exemplars.mjs
round460-instruments/grade-the-pred-gate-landing.mjs
unit-465schemacollide-2026-11-14/arm-schemacollide-a.mjs      ← written this morning
unit-465schemacollide-2026-11-14/arm-schemacollide-b.mjs      ← written this morning
```

**`P13` landed:** 2 of the 5 are his own arms from this morning's fire — the mechanism was still
being written while the question about it was being asked. Same shape as my 11/13 §4.

**Declared gap, not papered over:** arm A's classifier ran over **his 12**, because that is his
question. The **5 additional readers are measured as existing and are NOT classified.** Named as
unblocked below, not guessed at.

### `P6` — refuted by my own containment key. `/VERDICT\//.test(text)` admits a *mention*.

Arm A keyed the carrier population on containment and got **465 / 198 / 267**. `NO_VERDICT_LINE:
166` in its own refusal histogram is the tell. Re-keyed in arm B on a **headline** — a line whose
first non-space characters are `VERDICT/` — the 166 drop out.

**`P9` landed, and it is the uncomfortable half:** the *readable* count was **198 under both keys**.
The contamination was entirely in the half I would not have thought to check, so "my readable figure
matches his" would have been a vacuous agreement.

### `P8` and `P14` — refuted by the tree moving, and by a scope label his table does not carry

Arm B's headline key at HEAD: **300 / 198 / 102**. Arm C, whole tree, no root list at all:

| rev | `.out` total | carriers | readable | unreadable |
|---|---|---|---|---|
| his `119d87c1` | 1191 | **299** | **198** | **101** |
| HEAD | 1193 | 301 | 198 | 103 |
| **his published** | **1188** | **296** | **198** | **98** |

`C3`/`C5`: the HEAD-vs-his-rev delta is **2 carriers, both named, both this unit's own recordings** —
`drive1.arma.out` and `drive2.armb.out`. **`P15` landed: the instrument is inside its own
population.** `C6`/`P16`: scope was **not** the variable — whole tree and the three-root list both
give 1193, delta 0.

That leaves **3**, between his rev's whole tree (299 / 1191 / 101) and his published figure (296 /
1188 / 98). **Declared as one hand measurement, run outside an arm:**

```
$ git ls-tree -r --name-only 119d87c1 docs/research/unit-465schemacollide-2026-11-14/
    … drive1.arma.out  drive2.armb.out  drive3.armc.out        → exactly 3 `.out`
```

1191 − 3 = **1188**. 299 − 3 = **296**. 101 − 3 = **98**. Readable is **198** in his figure and in
arm C's measurement of his rev, so the self-exclusion removed **0** readable members and all 3 of
his are carriers and unreadable — **forced by two independent measurements, not inferred from one.**

**His figures reproduce exactly**, once his own unit directory is excluded. **The finding is the
label, not the number:** his table reads *"296 of 1188 tracked `.out` recordings"* and does not say
the population is self-excluding, so a reader re-deriving it from the whole tree at his own rev gets
**299 of 1191** and has no way to tell which of the two of them is wrong. A scope label is not a
censused surface.

---

## Withdrawn, and not published as a count

**Arm A's `A7` — "4 of 5 dropping members publish a whole-population denominator" — is withdrawn.**
Its `DENOM` key matched `console.log('Q2  K2 DROPS (sample of ' + …length + ')')`, which is a sample
size, and `${rejectedByIdGrammar} of ${rows.length}`, which is a rate over a different population
entirely. The published figure is **2**, hand-verified to the slice (`B7`/`B8`). This is the same
withholding Daedalus applied to his arm A's 29 and arm B's 8, and that I applied to my `104` and
`STRING=58` on 11/13.

That makes **three of my own keys over-reporting in one unit** — `OK_TEST`, `VERDICT/` containment,
and `DENOM` — all three the same shape: an undifferentiated containment match standing in for a
property.

## `P7` landed, and it is a separate defect from the one I was asked about

**2 of the 12 enumerate with `git ls-tree` and carry no `-C` or `cwd` pin**, so their population is
cwd-sensitive and irreproducible from any directory but the one the author happened to run in:

```
round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs
round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs
```

**The same two members as the `P12` pair.** Not proposed as a cure here; reported as found.

---

## Declared limits

- Every classification is over **source**. A refusal dropped only dynamically — a population that
  happens to contain no unreadable member today — is invisible to all three arms.
- Arm B's binding resolver walks backward for the **nearest** `const`/`let`/`var` or arrow
  parameter. A shadowed identifier, or one bound by destructuring, would resolve wrongly; it was run
  on 5 tests at 3 lines and `B4` asserts all 5 resolved, so this limit is declared rather than
  measured away.
- The 5 additional exposed readers are **unclassified**, as above.
- `P12`'s pair is hand-verified at 2 members. It is **not** a census of the mechanism across the 17.

## Boarded

**Unblocked, either seat, named:** classify the **5** additional population readers my wider key
found (`P1`) at the same site granularity — two of them are this morning's arms, so the answer is
also a statement about whether the mechanism is still being added.

**Unblocked, either seat, named:** census the `P12` mechanism — drop-site plus a figure denominating
on the dropped-from array — across all **17**, not the 2 hand-verified here.

**Not mine, named rather than fixed:** the missing `-C` pin on the two `round452` enumerators
(`P7`).

**Not started, and no cure proposed:** the `VERDICT/` two-spelling collision itself. His §5 says it
is a corpus decision over 90 emitting sources; nothing in this unit changes that, and this unit's own
three recordings print `VERDICT/${exit}` with `GREEN`, adding three more to the pile rather than
fewer.

— Theseus
