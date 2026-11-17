# unit-468createlit — pre-registration B: the arms that CAN grade the mapper

**Seat:** Daedalus. **Filed:** 2026-11-17, START fire, after legs A–D were driven and **before legs
E and F**. `date`-read taken at write time, see RESULTS.

## Why there is a second pre-registration

P6 in `PRE-REGISTRATION.md` predicted that, with the cure in, a cripple on `rowToFile`'s
`createdBy: row.created_by || undefined` would redden **at least one** arm phrased on a `createFile`
return value, and **zero** before the cure. The four-leg matrix (A: cured/clean, B: cured/crippled,
D: pre-cure/clean, C: pre-cure/crippled) measured failing tests **0, 0, 4, 4** over the whole
2283-test suite. **P6 is refuted in both directions**, and the two reasons are different:

- **Post-cure (B − A = 0):** `expect(created).toEqual(read)` now compares two readings that *share*
  the mapper. A defect inside the mapper moves both sides equally, so the difference is invariant.
  The arm grades "a writer stopped using the mapper", not "the mapper is right".
- **Pre-cure (C − D = 0):** those four arms were **already red**. A saturated arm has no spare
  signal to carry a second defect.

So the cure removed a real disagreement *and* removed my own instrument's ability to grade the
mapper on the create path. A second block of arms, comparing the writer's return against the **raw
column** with the normalisation written out as a literal, is what can grade it. Five such arms are
now in `round468-create-path-literal-vs-mapper.test.ts` and pass clean (15/15 in the file).

## Predictions — arm NAMES, not a count

Registered before driving. Stating names rather than a number because 11/16's C1 was refuted on
count by an arm I had forgotten was in my own file.

**Leg E — cripple C5: `rowToFile`'s `createdBy: row.created_by || undefined` → `row.created_by`,
cured tree, whole server suite.**

I expect exactly these to redden:
1. `round468 … normalised form … > createFile: created_by stores NULL, createdBy publishes undefined`

And I expect these specifically to stay **green**, because they are the ones whose blindness this
leg exists to demonstrate:
- `round468 … equals a read of the row it wrote > createFile: empty createdBy`
- every arm in `round14-file-domain-model`, `round15-file-domain-phase2-3`, `round16-file-domain-phase4-5`
  (nothing there is known to pass a falsy-but-present `createdBy`)

**Leg F — cripple C6: `rowToGroundRulesPreset`'s `isDefault: row.is_default === 1` →
`row.is_default`, cured tree, whole server suite.** This is 11/16's C4 re-run against a cured write
path, and the whole point of the unit.

I expect:
1. `round468 … normalised form … > createGroundRulesPreset: is_default stores 1, isDefault publishes true`
   — **the arm C4 could not reach**, and
2. the **three** arms C4 reddened on 11/16 (in `ground-rules-phase2.test.ts`, all phrased on the
   mapped field), unchanged by this unit.

So **4 reds, of which 1 is new reach**. If leg F produces 3, the create path is still ungraded and
the unit has not done what it claims. If it produces more than 4, something else is phrased on the
mapped field and the 11/16 count of three was already stale.

— Daedalus
