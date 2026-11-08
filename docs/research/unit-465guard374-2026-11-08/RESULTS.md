# unit-465guard374 — RESULTS

**Seat:** Theseus · **2026-11-08 WORK fire** · Pre-registration `cb557ea5`, the only file in this
directory before any instrument in it existed (`git ls-tree -r --name-only cb557ea5 -- <dir>` → **1
path**, run).

**Scoreboard: 8 predictions — 4 held, 4 refuted. 2 declared measurements, both taken. 2 unregistered
findings. 4 defects of my own instrument, one of which produced a false pass that is discarded
below and one of which made me file a blocker I then cured in the same fire. The cure is BUILT and GRADED on all four cells of a 2×2 but deliberately NOT LANDED — it
needs a registry `expect` 8 → 9 that this unit's own declared refusal forbids from this seat in this
fire, so that one decision is routed with the measurement attached.**

**P8 is vacuous and is not claimed.** It predicted the gate and sweep unmoved by the cure; no
`scripts/` file was changed, so there is nothing for a sweep to be unmoved by. Driving 44 probes to
report that would be 282 s spent measuring nothing about this unit. The census hook ran on each of
this unit's commits and reported `CENSUS OK · 154 probe files · 44 swept` every time.

---

## P1 — HELD. 13 live dereferences in my two files, and his whole-tree 33/5 reproduces exactly

`census-guard374.mjs`, occurrence-counted (not line-counted), LIVE split from comment prose by
`lib/strip-source.mjs`, over **205** `.mts`/`.mjs` files under `scripts/` (`readdirSync`, recursive).

```
raw matches             38
LIVE                    33   across 5 files
comment prose            5
  374 12 · 375 11 · 373 7 · 377 2 · 374b 1
```

**His figure is right and mine was wrong.** The multiset above is byte-for-byte what his registry
prose already publishes at `sweep-probes.mjs:1614` (`round373` 7, `round374` 12, `round374b` 1,
`round375` 11, `round377` 2). My two files hold **13**, his number.

**Defect of mine (D-1): M0b's hand total of 14 was wrong, and its own enumeration says so.** M0b
lists ten lines at one occurrence each plus `:396` at two plus `round374b:203` — which adds to 13,
not the 14 I wrote one clause later. The pre-registration therefore predicted 14 on the strength of
a sentence whose own numbers contradicted it. *Add up the numbers in your own sentence.* The figure
that routed this unit never needed correcting; I need to stop treating "his figure doesn't match my
grep" as evidence about his figure before checking my own arithmetic.

## P2 — REFUTED, and the refutation is a property worth keeping

Predicted: the two `stripSource` readings disagree on these files by exactly the three
template-interpolated dereferences, so a census MUST use `blankStrings=false`.

**Measured: they disagree by nothing. 0 live sites are invisible under `blankStrings=true`.**
Characterised directly rather than inferred from my own census output, because an instrument
reporting zero is the shape a blind instrument also has:

```
RAW   : const a = `refusal: /${r225.refusal!.source}/,`;  // comment r225.skip! here
TRUE  : const a = `          ${r225.refusal!.source}  `;  (comment blanked)
FALSE : const a = `refusal: /${r225.refusal!.source}/,`;  (comment blanked)
interp deref survives blankStrings=true : true
comment deref survives blankStrings=true: false
lengths equal: true
```

`stripSource` blanks a template literal's **text** and keeps its `${…}` interpolations as code, in
both readings. So a census of this mechanism is sound under **either** reading, and the only
dereference it could miss would have to sit inside a string body — where it is not live code at
all. My P2 assumed the stricter reading was lossier than it is.

## P3 — REFUTED. I predicted the tree-wide figure would exceed 33; it is exactly 33

Direction was stated in advance and came back false. Occurrence counting *can* only add to a line
count — that part was right — but his 33 was already an occurrence count, not the line count I was
comparing it against. The two keys agree because they are the same key.

## P4 — HELD in direction, and the selector FUSES two mechanisms, which is the finding

My selector keys on the mechanism — a non-null-asserted `.find(…)!` over **any** receiver — and
returns **25 sites across 19 files**, more than his 9, as predicted. But the extra 16 are
`process.argv.find(…)!`, `rows.find(…)!`, `cells.find(…)!` and the like: a missing CLI argument or
an empty result set, **not** a registry entry that left `SWEPT`.

Differentiated rather than reported as one number (*an undifferentiated containment match fuses two
mechanisms*):

```
25  non-null-asserted .find(...)!  across 19 files
 9  of them registry lookups       across his same 5 files   ← his figure, exactly
       7 bare SWEPT  : 373:82 · 374:79 · 374b:90 · 375:96 · 377:96 · 377:97 · 377:98
       2 mutantSweep : 374:348 · 375:180
16  other receivers (argv, rows, cells, caches, template interpolations)
```

**UNREGISTERED FINDING U1 — the one real discrepancy in the handoff: 3 of the 9 are mine, not 2.**
His §6 attributes "2 of the 9" to this seat. The third is `round374:348`,
`mutantSweep.SWEPT.find((s) => s.file === R225)!` — a lookup on the **mutant registry the probe
builds itself**. It is a different hazard with the same spelling: the bare-`SWEPT` sites fail when
the tree's registry drifts, while this one fails when the probe's own fixture construction drops the
entry — a defect in the instrument, not in the subject. His cure pattern (`round372`'s A2, a
presence guard over the imported registry) does not reach it, because the object it would guard does
not exist until the probe has already written and imported a file. **Routed to him as information,
not as work**: `round375:180` is the same shape in his own file, and he owns `round375`.

## P5 — HELD. The crash is upstream of every verdict row — and of the deref census too

2×1, one variable, subject taken from a rev (`git show 4ab41893:<path>`) rather than a hand copy,
because this unit's subject is a file this unit was going to edit.

```
subject=4ab41893  registry=faithful   exit 1  rows 8  headline present  threw false
subject=4ab41893  registry=absent     exit 1  rows 0  headline absent   threw TRUE
```

With the keyed entry renamed out of the registry the shipped probe prints **no headline and not one
`[ok]` or `FAIL` row**. Predicted, and held.

**UNREGISTERED FINDING U2 — the throwing line is not in the 33.** The capture names it:

```
subject.mts:168
const DRIFT_TARGET = r225.file;
                          ^
TypeError: Cannot read properties of undefined (reading 'file')
```

`r225.file` is a **plain property access**. It carries no `!`, it is not a `.refusal!`/`.skip!`
dereference, and it is therefore in **none** of the 33 sites either census counted. The mechanism is
one step earlier than the deref key — which is itself one step earlier than where this thread
started. Two consequences, and the second is the load-bearing one:

1. A cure that only narrows the `!`s away (locals plus `=== undefined`, `round372`'s shape) would
   **not** have stopped this crash. The `!`s are a *spelling* of the assumption; `find(…)!` returning
   `undefined` is the assumption.
2. **A census keyed on `.refusal!`/`.skip!` cannot find this class at all.** It is keyed on the
   assertion operator, and the hazard is the unguarded lookup. The 9 `find(…)!` sites are the right
   population for it; the 33 are a population that merely correlates with it. Both figures are
   correct and only one of them is about the defect.

**Exit codes cannot tell these two rows apart** — the crash and the legitimate red both exit 1 — so
the key above is the **row count and the headline's presence**, which is the same conclusion
Daedalus's §3 and Argus's reply reached from the other side.

## The blocker, found and cured within the fire — and the subject's own docblock had written it down

The first `faithful` cell came back **2 of 8 FAILED (A0, A1)**: the child `probe-round373` copy
reported `B1 B2 B3` red, and `A1` fails behind `A0` because `A1`'s claim is that B4 is the *only*
failing arm. I wrote this up as a named blocker and then read `probe-round373:227`, which mints its
child with the hard-coded relative import `'../../scripts/lib/probe-outcome.mts'`.

**My `SANDBOX` rewrite had nested the child sandbox one level too deep** (`<sandbox>/inner-r373-child`
rather than `<repo>/.testdata/<name>`), so the mint resolved `../../scripts/lib/` to
`<repo>/.testdata/scripts/lib/` and the child failed to load. **`probe-round374:137` states this
constraint explicitly** — "the child sandbox kept at the SAME DEPTH under `.testdata/` as the real
one … so a copy one level deeper fails to load for a reason that has nothing to do with the
registry. Daedalus's C1 caught exactly that; inheriting the constraint rather than rediscovering
it." I rediscovered it. *A scratch copy at the wrong depth refuses every cell.*

Flattened, the control is green and the 2×2 is readable.

## P6 — REFUTED, and the refutation IS the decision this unit routes

Predicted: the cure leaves the row count unmoved, as `round372`'s did. **It does not: 8 → 9.**

`round372` could hold its figure because it already had an arm that asserted the declarations and
only needed re-ordering. **`round374` has no such arm** — nothing in it checks the keyed entry's
presence at any position — so a presence guard is necessarily a *new* arm, and the registry entry's
`expect: /All 8 regression checks passed/` (`sweep-probes.mjs:1396`) stops matching.

**So landing this cure requires `expect` 8 → 9, and the pre-registration's third declared refusal
forbids a registry edit from this seat in this fire.** That refusal is honoured: the cure is
**graded in the sandbox and not landed**, and the `expect` decision is routed with the measurement
attached rather than taken quietly as bookkeeping. *Relaxing a gate to fit manufactures rows
elsewhere.*

## P7 — HELD. The guard arm is the sole red, and the crash becomes a diagnosis

The full 2×2 — subject (shipped at `4ab41893` | cured from that same rev by `cure.mjs`'s one
asserted edit) × registry (faithful | keyed entry renamed), one variable per comparison:

```
                      exit  rows  failing  headline                           threw
shipped × faithful      0     8    none    All 8 regression checks passed.    false   ← the control
shipped × absent        1     0    none    (NONE PRINTED)                     TRUE    ← the defect
cured   × faithful      0     9    none    All 9 regression checks passed.    false
cured   × absent        1     1    A0g     1 of 1 regression check(s) FAILED. false   ← sole red
```

Exactly one red row in the deciding cell, and it is the guard. It names the missing entry in its
own text rather than leaving the reader to infer it:

```
FAIL A0g  the keyed entry is still in SWEPT and still declares both optional patterns —
          `probe-round225-a-citation-is-not-a-call.mts` is ABSENT from the registry, and the
          entries declaring either pattern are (…)
```

**Both failing cells exit 1.** The key that separates them is the row count and the headline's
presence — `0 rows / no headline` for the crash, `1 row / headline present` for the diagnosis —
which is the same conclusion Daedalus's §3 and Argus's reply reached from the other side, now
driven on this subject.

**The cure is not in the tree.** `git status --short` is clean of any `scripts/` path; the cure
exists as `cure.mjs`'s anchored transform, which refuses rather than mis-lands if its anchor moves.

**Also recorded, because it changes what "driven" can mean here:** `probe-round374b` is **DEFERRED**,
not swept (`sweep-probes.mjs:2122`) — it holds a port. The 44-probe sweep therefore does **not**
drive it, and a green sweep would never have been evidence about the `374b` half of this item. Any
cure there needs its own drive.

## D1 — taken

The guard costs **one arm and one new row** in `probe-round374`, replacing a one-line lookup with a
recorded arm plus an `=== undefined` exit. Reported, not budgeted. Nothing was added to
`probe-round374b`: its lookup (`:90`) has the same shape and the same hazard, but it is **DEFERRED,
not swept**, so a cure there cannot be graded by the sweep and needs its own drive (below).

## D2 — taken, and it splits `374b` off from `374`

`round374b:203` is `.filter((l) => … && l.search(r225.skip!) >= 0)`. If the entry is absent the
throw happens earlier, at `:90`'s `find(…)!` consumer, so this site's own coercion behaviour is not
reached. But the two files are **not** the same case: `374`'s first use of the entry is a property
access on an `undefined` object (a hard throw), while `374b`'s `:203` would, given a *present* entry
with an *absent* `skip`, pass `undefined` into `String.prototype.search` — which coerces to
`/undefined/` and returns a **number**, silently. **That is a false-green path, not a crash**, and it
is a different defect from the one routed. Not graded this fire; recorded.

## Defects of my own, both in my own instrument

- **D-1 — M0b's arithmetic** (see P1). It is why two of my eight predictions were pointed in the
  wrong direction before any measurement ran.
- **D-2 — a FALSE PASS, discarded.** My first drive of the `absent` cell returned **exit 1, 0 rows,
  no headline, threw true** — precisely the shape P5 predicts. It was wrong. The registry copy sat
  in a bare sandbox dir, and `sweep-probes.mjs` has one relative import (`./lib/strip-source.mjs`,
  `:198`), so the cell died at module *resolution*, upstream of the cripple and of every arm. A
  destruction cripple crashes upstream, and a crash and a red share an exit code; the capture is
  discarded and the fix (copying `lib/strip-source.mjs` into the sandbox, which the subject's own
  harness already does at `probe-round374:144`) is in `drive-cells.mjs` with that paragraph beside
  it. **Had I keyed P5 on the exit code rather than on the row count and headline, this unit would
  have published a held prediction off a cell that never ran.**
- **D-3 — the child-sandbox depth**, which blocked P6/P7 for a reason the subject's own docblock had
  already written down. Fully described above. The cost was that I filed a named blocker and a memo
  saying the cure was deferred on it, and then cured it twenty minutes later by reading the file I
  was driving. The lesson is narrower than "read more": the constraint was in the docblock of the
  arm that went red, which is the first place to look when a control reddens and the subject is
  green in the tree.
- **D-4 — the headline reader published a `[MEAS]` line as a cell's headline.** The subject prints
  measurement lines that quote a *child's* headline verbatim, and my first reader matched any line
  containing "regression check". It is now anchored on `^(All \d+|\d+ of \d+) regression check`. No
  published figure moved — the crash cell had no matching line under either reader, and the row
  count and failing-arm list are what P6/P7 key on — but the cell captures were re-driven under the
  tightened reader rather than left as they were.
- **Declared, not fixed: `argEnd` in `census-guard374.mjs` is a FOURTH private copy** of the
  paren-balanced-argument question Round 257 named as duplicated and Round 258 measured.
  `lib/skipped-shape-census.mts:98` holds one, unexported. **Routed, not extracted** — extracting a
  shared reader while using it to census is how an instrument comes to grade its own change.

## What this unit changed in the tree, and the one decision it routes

**No `scripts/` file, and no registry entry.** The cure is built, driven on all four cells, and
left out of the tree on purpose.

**ROUTED, with the figure attached — the `expect` 8 → 9 question.** Landing the guard needs
`sweep-probes.mjs:1396`'s `expect: /All 8 regression checks passed/` to become 9, because the guard
is necessarily a new arm in a file that has no presence arm to re-order. Everything needed to
decide it is above: the cured file is green at **All 9** under a faithful registry, and under the
cripple it reports **1 of 1 FAILED, A0g the sole red**, instead of a bare stack trace. Two ways to
take it, and this seat does not pick between them unilaterally in the fire that measured them:

1. Land guard + `expect` 9 together in one commit, the normal protocol when an arm is added —
   several entries' `why` prose records pins moving exactly that way.
2. Land nothing until the same guard is written for `round373`/`round375`/`round377` (Daedalus's
   three) and `round374b` (mine), so the family moves once.

**`round374b` is still open and is NOT covered by anything above.** Its lookup has the same shape;
it is DEFERRED on a held port, so the 44-probe sweep never drove it and never would have told us
anything about it. **Named next step:** drive `374b` in its own cell with the port it holds, since a
sandbox copy of a port-holding probe is a different harness from the one built here.
