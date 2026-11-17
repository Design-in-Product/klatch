# unit-468createlit — the write path's hand-built literal is a second spelling of the row mapper

**Seat:** Daedalus. **Filed:** 2026-11-17, START fire, `date`-read **09:20 PST**.
**Predictions registered before any measurement was run.** The census arm had not been written when
this file was committed; the divergence arm had not been driven.

## Where this came from

My own 11/16 STOP fire, §5 (`docs/COORDINATION.md`, Daedalus block): C4 crippled
`rowToGroundRulesPreset` to return the raw column and reddened three arms — but **not** the
`POST … makeDefault` arm, because `createGroundRulesPreset` returns a **hand-built object literal**
instead of re-reading the row it just wrote. `createChannel` has the identical shape. Named there as
"a house idiom, not a slip in my file", unclaimed, needing its own unit. This is that unit.

The defect class, stated once: **a writer that publishes a hand-built literal publishes a second
spelling of the row.** Every normalisation the mapper performs (`|| undefined`, `|| ''`,
`=== 1`, `|| DEFAULT_MODEL`) is absent from that spelling, so

1. the **create response** and every **later read** of the same row can disagree in value, and
2. a **mapper defect is invisible** on the create path — the cripple that should redden it cannot
   reach it, which is how C4 passed an arm it should have failed.

## Population key — keyed on the mechanism, not the name

The naive key is "exported functions named `create*`". That key is **wrong here and I am not using
it**: `insertMessage` is a writer with a hand-built literal and does not match it, and
`createChannelBySessionIdResolver` matches it and writes nothing. (Precedent in my own corpus: a
census keyed on the sentence rather than the number, and an append-only census keyed on slicing
consumers that missed length consumers.)

The key used by arm A, stated before it is run: an **exported function in
`packages/server/src/db/queries.ts` whose body contains an `INSERT INTO` and whose terminal
`return` is a `{`-literal rather than a `rowTo*(...)` call**. The census reports, per member, which
branch its terminal return takes and whether a sibling `rowTo*` mapper exists for its declared
return type.

## Predictions

**P1 — population size.** The census finds **10** exported functions in `queries.ts` containing an
`INSERT INTO`. I am predicting the whole population, not just the defective part, so that a wrong
denominator is visible.

**P2 — split.** Of those, **8 return a hand-built literal** and **2 return through a mapper**. (I
expect `createEntity`'s and `createProject`'s neighbours — the `getX`-shaped readers — to be the
mapper users, and the writers to be literals; if the split is 10/0 or 5/5 this prediction is
refuted on count, and the refutation is the finding.)

**P3 — divergence members.** At least **3** members have an input under which the create return
differs *in value* from an immediate read of the same row. Named now, so a later list cannot be
back-fitted: `createFile` (`createdBy: ''`), `createFileRef` (`addedBy: ''`),
`createToolUseArtifact` (`inputSummary: ''`), `insertMessage` (`model: ''`). I predict **all four
land**.

**P4 — two sub-mechanisms, not one.** The divergences are not one mechanism. Either
  - **(a) the INSERT collapses and the literal does not** — `createdBy || null` stores NULL, the
    mapper reads NULL → `undefined`, the literal still holds `''`; or
  - **(b) the mapper collapses and the INSERT does not** — `''` is stored as `''`,
    `row.input_summary || undefined` reads it as `undefined`, the literal still holds `''`.
  `createFile`/`createFileRef`/`insertMessage` are (a); `createToolUseArtifact` is (b). A cure that
  only fixes the INSERT side leaves (b) standing, and vice versa, which is why both are named.

**P5 — the cure's blast radius.** Routing every literal through its sibling mapper changes the
return value of the four P3 members under `''` inputs and **no others**, so the standing server
suite (2272 passed as of `709b0ab1`) loses **0** tests. I state this as a prediction because it is
the one that would make the cure expensive if wrong: an arm somewhere may be asserting the *literal's*
spelling (`createdBy: ''`) as if it were the stored state, in which case that arm was green on a
disagreement and the breakage is a second finding, not a regression.

**P6 — the cripple that could not land before.** With the cure in, crippling `rowToFile`'s
`createdBy: row.created_by || undefined` to `createdBy: row.created_by` reddens **at least one** arm
phrased on a `createFile` **return value**. Before the cure, the same cripple reddens **zero** such
arms — that difference, not the absolute count, is the claim, so both legs are driven and the pre-cure
leg is driven on the **pre-cure tree** rather than reconstructed.

## Declared limits

- The census is **mechanical** over `queries.ts` only. Writers in `routes/`, in the importers, or in
  `db/index.ts` are **out of population** and uncensused; this unit says nothing about them. (Nine
  tables exist; this unit does not claim to cover every writer of all nine.)
- The per-member divergence drive **constructs its arguments by hand** — there is no mechanical way
  to synthesise a calling convention per signature. The *population* is derived; the *inputs* are
  typed. That is a declared limit on the divergence arm, not on the census.
- Reflections, compaction state, and the `FileWithRef` join shape are read by mappers with no
  sibling writer in this file; they are in the census if they match the key and are not expected to.

— Daedalus
