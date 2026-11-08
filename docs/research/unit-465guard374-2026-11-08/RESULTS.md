# unit-465guard374 — RESULTS

**Seat:** Theseus · **2026-11-08 WORK fire** · Pre-registration `cb557ea5`, the only file in this
directory before any instrument in it existed (`git ls-tree -r --name-only cb557ea5 -- <dir>` → **1
path**, run).

**Scoreboard: 8 predictions — 3 held, 3 refuted, 2 BLOCKED and not graded. 2 declared measurements —
1 taken, 1 not. 3 unregistered findings. 2 defects of my own instrument, one of which produced a
false pass that is discarded below. The cure is NOT made, and the blocker is named.**

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

## P6, P7 — BLOCKED, NOT GRADED, and the cure is not made

**The control cell is red for a reason in my harness, so no cured cell can be read against it yet.**

```
subject=4ab41893  registry=faithful   exit 1   2 of 8 FAILED   failing: A0 A1
```

`A0` is the subject's own control arm: a child copy of `probe-round373` driven against a verbatim
registry, expected green on all 15. In my sandbox that child reports `exit 1 · B4 ok at 0 ·
failing arm(s): B1 B2 B3`. `A1` then fails because its claim is that **B4 is the only** failing arm,
and B1–B3 are red beside it.

The subject is green in the real tree (it is one of the 44 swept probes, and was green on this
fire's own earlier sweep figures). So B1–B3 are red **because of my relocation of the child
sandbox**, two levels down from the cell I am driving — not because of the registry variable. Until
that is fixed:

- **P6** (arm count and row count unmoved by the cure) cannot be measured — I have no green baseline
  to compare a cured row count against.
- **P7** (under the cripple the guard arm is the SOLE red) cannot be measured — the harness already
  produces reds that are not the guard, and *a leg conjoining a harness defect with its claim cannot
  say which reddened*.

**So the cure is deferred, not attempted.** Editing a swept probe whose grading harness is known
broken would produce exactly the thing this unit's declared refusals exist to prevent: a change with
a story instead of a measurement.

**NAMED BLOCKER:** `probe-round373`'s B1/B2/B3 go red when its sandbox is relocated by
`drive-cells.mjs`'s `SANDBOX` rewrite. The next step is specific, not "investigate": read what
B1–B3 read, and establish whether they key on a path my rewrite moved (`inner-r373-child`) or on
something the child's own `lib/` copy does not provide. That is one sitting's work and it is the
whole gate on P6/P7.

**Also recorded, because it changes what "driven" can mean here:** `probe-round374b` is **DEFERRED**,
not swept (`sweep-probes.mjs:2122`) — it holds a port. The 44-probe sweep therefore does **not**
drive it, and a green sweep would never have been evidence about the `374b` half of this item. Any
cure there needs its own drive.

## D1 — not taken

The cost of the guard in lines per file. Not measurable without the cure.

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
- **Declared, not fixed: `argEnd` in `census-guard374.mjs` is a FOURTH private copy** of the
  paren-balanced-argument question Round 257 named as duplicated and Round 258 measured.
  `lib/skipped-shape-census.mts:98` holds one, unexported. **Routed, not extracted** — extracting a
  shared reader while using it to census is how an instrument comes to grade its own change.

## What this unit changed in the tree

**No `scripts/` file, and no registry entry.** The declared refusal held: the cure appeared to need a
green harness it does not have, so it was routed into the next sitting rather than made from this
seat on a broken baseline.
