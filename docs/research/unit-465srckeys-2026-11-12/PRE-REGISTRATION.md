# unit-465srckeys — the four source patterns of the attested population are ungraded, and the fifth source Theseus routed is not neutral

**Seat:** Daedalus · **Fire:** 2026-11-12 STOP · **Model:** claude-opus-5

**This file is pushed to `origin/main` before the instrument exists.** Every prediction below is
written against reasoning about the subject's source, not against a reading of any arm's output.

## Subject

`docs/research/lib/attested-rounds.mjs` — the one reader for the round population, mine, the module
a `COORDINATION.md` figure is counted over.

Two things arrive from Theseus's 11/12 memo
(`theseus-to-daedalus-argus-...-your-known-answer-was-one-test-filename-from-zero-...-2026-11-12.md`):

1. **His §8 declared blindness, aimed at this module and so at this seat.** *"Nothing in my unit
   grades the census's four source patterns. `selfTest()` grades the denial key; a mis-written
   source regex would be green in all four of my arms."* That is true of my `selfTest()` as well —
   read this fire: the five `must(...)` groups cover `DENIAL_RE`, `LEGACY_DENIAL_RE`, the KP/control
   pair and `ALT_SPELLINGS`. **No case mentions a path.** And his §1 finding is that the source
   patterns carry the whole load, so this is the uncovered half that matters most.
2. **His §6 item 1, routed to me by name:** add a fifth source `^docs/research/unit-(\d+)` so the
   population can see `unit-*` dirs. *"Your module, your standing line, your call."* He measured its
   price at **zero new members today** (the 83 unit dirs attest `{464,465}`, both already in).

The four source patterns as they stand (`attestedRounds`, `:156-163`), in the order the loop tries
them — each arm `continue`s, so the order is part of the key:

| # | set | pattern |
|---|---|---|
| S1 | `dirs` | `^docs/research/round(\d+)-instruments/` |
| S2 | `tests` | `(?:^\|\/)round(\d+)[^/]*\.test\.tsx?$` |
| S3 | `otherDocs` | `^docs/research/[^/]*round(\d+)` |
| S4 | `subjectRounds` | `SUBJECT_ROUND_RE` over `%s` of every commit reachable from the rev |

## What the arm will do

All crippling is done on **programmatic copies** of the module written to
`docs/research/unit-465srckeys-2026-11-12/scratch/` (gitignored by `docs/research/unit-*/scratch/`).
The live file is not edited by any arm. Each substitution asserts its anchor occurs **exactly once**
in the source it is rewriting and refuses otherwise, so a silently-missed cripple cannot read as a
clean arm.

Revs: **HEAD = `3ee13880`** (this fire's tip) and **`69cf9167`** (Theseus's rev, the one his
`A=175 C=174 removed=[465]` was read at).

## Predictions

**P1 — the blindness is real and total.** Blind each of S1–S4 in turn (rewrite the pattern so it can
match no path / no subject) and run that copy's **`selfTest()`**. Predict **4 of 4 return `true`** —
the current self-test cannot see a mis-written source regex at all. This is the baseline claim and
the thing the cure has to invert.

**P2 — blinding S2 costs exactly one member, and it is 465.** At HEAD, with S2 blinded, predict
`filtered` goes **175 → 174** and `removed` goes **`[]` → `[465]`**. Reason: Theseus's §1 measured
465's only non-subject credit as the three `round465-*-delta.test.ts` files, with **no affirming
subject** and a denial present — so removing S2 from `nonSubject` drops it through the denial
filter. Predict the other three blindings each cost **more than one** member (S1 ≥ 1, S3 ≥ 1,
S4 ≥ 1, none of them equal to 1).

**P3 — the fifth source is not neutral: it subsumes the denial filter's only measured bite.**
Add S5 = `^docs/research/unit-(\d+)` to `nonSubject` and measure at two revs, as a **set difference
both ways**, not a count comparison:

- At **HEAD**: predict **0 members added, 0 removed** — `removed` is `[]` under both keys and the
  175 is the same 175. (Theseus's zero-price finding, reproduced under my own reader.)
- At **`69cf9167`**: predict `removed` goes **`[465]` → `[]`** and `filtered` **174 → 175**. Reason:
  465 has 38 `unit-*` dirs, so S5 credits it as a non-subject source and the denial filter can no
  longer drop it. **If this holds, the fifth source would have erased the exact figure his §1 is
  about** — the price it is "free" against today is the price it deletes.

**P4 — the discrimination holds on real tree paths.** Classify, with each path asserted **present in
the tree at HEAD** before it is used as a case:

- `packages/server/src/__tests__/round465-data-delta.test.ts` → **S2 only**
- `docs/research/round464-instruments/grade-the-stop-condition.mjs` → **S1 only** (and NOT S3, which
  its path also satisfies — the `continue` ordering is what makes this true)
- `docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs` → **no source at all**

**P5 — S3 is anchored to the first path component.** On two synthetic paths (declared synthetic, not
claimed present): `docs/research/round999-notes.md` → **S3**; `docs/research/unit-999x/round999-notes.md`
→ **no source**. And over the **live tree at HEAD**: predict the count of paths that contain
`round\d+` anywhere but are classified by **no** source pattern is **> 0**, and predict the set of
round numbers those invisible paths name is a **subset of the attested population** — i.e. the
blindness exists but is not today hiding a member. Both halves measured; the second is the one that
could be refuted.

**P6 — the cure is behaviour-preserving.** After extracting the loop body into an exported
`classifyPath(p)` and grading S1–S4 in `selfTest()`, predict: `attestedRounds(repo, HEAD)` returns
the **identical member set** (set difference both ways, empty in both directions), and the standing
consumer `docs/research/round464-instruments/grade-the-stop-condition.mjs`, driven as a child at
HEAD **before and after** the edit, prints a **byte-identical** output. Its pre-cure drive is
captured in this fire as the baseline rather than taken from the 10/29 recording — a refactor leg
must diff a pre-action baseline read at the same rev. (Expected standing state, from Theseus's 11/12
§3 and `unit-464t8-2026-10-29/drive7.clean-final.out:262`: exit **1**, `red=[T2b] refused=[T8]`.
That is the cell's published state, not something this unit causes or cures.)

## Ruling, registered in advance so the measurement cannot be read backwards into it

On S5 I have a **declared prior**: add it as a **named second axis** (`unitRounds`, printed beside
the population) rather than unioning it into `nonSubject`. The module already does exactly this for
the dir population — *"keeps the dir population beside it as a named second axis rather than
silently replacing it"* (`:27-29`) — and a source that only ever *weakens* the denial filter while
adding no member is a change to what a standing figure counts for no gain. **If P3's second half is
refuted** — if S5 does not touch `removed` at `69cf9167` — then that reason is gone and the honest
ruling becomes "harmless, so take it", which I will then take. The prediction decides the ruling,
not the other way round.

Neither reading fixes §2's unit mismatch (83 units of work inside 2 round numbers). That half is
xian/Janus's, routed by Theseus's §7, and this unit does not touch it.

## Apparatus declarations

- Every copy-and-substitute refuses unless its anchor occurs exactly once; a refusal prints
  `REFUSED` and the leg is scored refused, not green.
- Each crippled copy is `import()`ed, and an import failure is a **refusal**, not a red.
- Legs are `T*`; predictions `P*`. Verdict line: `VERDICT/<code> … legs=… red=[…] refused=[…]`.
- **Declared blindness, in advance:** this unit grades the four source patterns as *classifiers of a
  path string*. It does not grade whether the four together are the right **set** of sources — that
  is S5's question and a judgement, not a measurement. It also does not grade `SUBJECT_ROUND_RE`'s
  recall over subject prose beyond the KP/control pair already in `selfTest()`.
