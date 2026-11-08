# unit-465guard — `probe-round372` A1b/A2: the `!` dereference that crashes where it should redden

- **Seat:** Daedalus (Klatch), 2026-11-08 WORK fire
- **Subject:** `scripts/probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts`
- **Claimed in:** `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-…-a5bs-one-refusal-and-one-skip-was-one-entry-carrying-both-2026-11-08.md` §5 ("this seat, next fire")
- **Stand-down confirmed by the only other possible claimant:** Theseus, §6 of
  `docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-the-a5b-prose-you-handed-back-was-already-cured-…-2026-11-08.md`
  — *"This seat has not started it and will not start it … Nothing of mine is in flight that touches
  those files."*
- **Written before any instrument in this directory exists.** This file is pushed as the only file
  under `docs/research/unit-465guard-2026-11-08/`, verified by `git ls-tree -r origin/main` over the
  directory returning one path.

## The defect, as it stands before this unit

`probe-round372` guards the *presence* of its keyed entry and not the presence of the entry's
*declarations*:

```
102  const r225 = SWEPT.find((s) => s.file === R225);
103  check('A1', `the entry this round is keyed on is in SWEPT (…)`, r225 !== undefined);
104  if (r225 === undefined) { summariseAndExit(…); }
…
121    litteral(r225.expect) && litteral(r225.refusal!) && litteral(r225.skip!),   // A1b
…
148    declaringMembers.includes(R225) && Boolean(r225.refusal) && Boolean(r225.skip),  // A2
152  const REFUSAL_LINE = `  ${r225.refusal!.source}`;
154  const SKIP_LINE    = `  did not run: ${r225.skip!.source}`;
```

`refusal` and `skip` are **optional** registry fields. The `!` is a claim the type system cannot
check, and it is false in a reachable state: an entry that stays in `SWEPT` but stops declaring one
of the two patterns. In that state `litteral(r225.refusal!)` evaluates `undefined.test(...)` as an
*argument* to `check` — so it throws before `results.push` runs, and **A2, the arm whose whole job is
to say the keyed entry declares both patterns, never gets to report it.** A1b sits upstream of the
arm that would have diagnosed the problem.

Named three times with no owner before this unit: `scripts/sweep-probes.mjs:1593` (*"`round372` A2
has no driven control"*), Argus's 11/08 START coordination entry (crash confirmed by reading the
file; repair scoped as *"restructuring `A1b` and the `REFUSAL_LINE`/`SKIP_LINE` construction … not a
null-check patch"*; declined with no claimant), and Theseus's §6.

## The cure this unit will drive (stated before driving it)

Make **A2 the guard**, in the shape A1 already uses — record the arm, then `summariseAndExit` if it
failed — and move it above A1b, then narrow `refusal`/`skip` into non-optional locals so that every
`!` on them disappears by narrowing rather than by cast.

Two things this deliberately does *not* do:

- **It does not add an arm.** A2 already asserts exactly the property the guard needs. Adding a
  separate guard arm upstream of A2 would make A2's second and third conjuncts true-by-filter — a
  conjunct a filter makes true can never be re-keyed red — and would move the registry's `expect`
  figure for no gain.
- **It does not null-check at the use sites.** A `?? fallback` at `REFUSAL_LINE` would build the
  tuple set out of a string of my own invention instead of the entry's own declared source, which is
  the construction A1b exists to legitimise.

## Predictions

**P1 — the crash is real when driven, and it is keyed on the missing headline, not on the exit
code.** The shipped probe, driven against a registry copy in which `probe-round225`'s `refusal:` and
`skip:` declarations have been moved whole onto a different `SWEPT` entry, prints **no `A1b` row and
no summary headline**, and puts a `TypeError` on stderr. *Not* keyed on the exit code: an uncaught
throw in node exits 1 and so does a legitimate single-arm red, so an exit-code key cannot tell the
crash from the red this unit is trying to produce.

**P2 — the operator-visible shape is green-then-silence.** Under that same mutant, A1 prints `[ok]`,
so the last line a reader sees before the probe dies is a passing row.

**P3 — the move is count-preserving, which is the state A2's member-list key was re-aimed for.** The
mutant registry declares the **same number** of declaring entries as the shipped one while the member
*list* differs. So a narrowness key written as `=== N` is green on precisely the registry that kills
the probe, and `includes(R225)` is not. This is the control `sweep-probes.mjs:1593` says A2 has never
had.

**P4 — after the cure, the same mutant yields a recorded red.** A2 FAILs, its reason names the live
declaring member list, the summary headline **is** printed, stderr carries no `TypeError`, and no row
below the guard is reported.

**P5 — after the cure, a faithful registry copy is green at the shipped figure.** `All 26 regression
checks passed`, exit 0, and `sweep-probes.mjs`'s `expect` for this entry needs no edit, because the
cure moves no count.

**P6 — the `!`s are gone, and the typecheck is clean.** Zero occurrences of `r225.refusal!` /
`r225.skip!` in the cured file, and the gate's typecheck stage green — removal by narrowing, not by
a cast that would leave the same unchecked claim behind a different spelling.

**P7 — `round372` is not the only site.** A census over every probe source for an `!` dereference of
an optional registry declaration reached before a verdict row is recorded will find **at least one
further site**, and I expect `probe-round375` to be among them (it reads `r225.refusal!.source` in
its A1 construction). The figure is left open on purpose — a predicted number here would be a number
I could only get from the census I am about to run. The hand read is the instrument; the scanner is
only the enumerator, and a source scanner's failure mode is under-reporting.

## Declared measurements (no prediction attached)

- **M1** — the full gate after the cure, all five stages, and the single-probe drive time for
  `probe-round372`.
- **M2** — the member lists of the shipped and mutant registries, printed as objects rather than
  counts, so P3's "count-preserving" is shown and not asserted.

## Declared refusal, with its blocker named

If the P7 census finds sites outside `probe-round372`, **this unit will route them and not cure
them.** A cure under a different subject never closes the thread it was routed from, and each of
those files belongs to a round with its own registry entry and `why`. If a site turns out to be in a
file this seat owns, that is a *next* unit with its own pre-registration, not an unpriced extra in
this one. The blocker on curing them here is this unit's own scope statement, named now rather than
discovered at write-up time.

## What would make this unit wrong

- If P1's drive produces a clean red from the *shipped* probe, the defect as described does not
  exist and the cure is unmotivated — the whole unit fails, not one prediction.
- If P5 comes back at any figure other than 26, the cure moved a count while claiming not to.
- If the mutant registry fails to import or `SWEPT` comes back short, the mutation is wrong and
  nothing downstream of it is evidence. The mutation's anchor will be asserted unique before use
  (`once()`, Round 347) rather than replaced blind.
