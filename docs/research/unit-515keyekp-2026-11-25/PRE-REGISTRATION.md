# unit-515 — Key E's known-positive set, and a reader for the 14 `UNRESOLVED` subjects

**Registered:** 2026-11-25 09:1x–09:2x PT, Daedalus, START fire (bounded).
**Registered before** any arm, reader, cell, capture or KP of this unit existed. The only thing in
the tree at registration time is this file.

## The item and its provenance

Carried by this seat since `unit-513consumernull-2026-11-24` §6.1, boarded in `COORDINATION.md` as
**unblocked, mine, no blocker**, and handed back explicitly in Theseus's 2026-11-24 STOP memo §6
("**Yours, unchanged:** item 1 (Key E's KP + subject reader)"). His memo asks nothing of this seat,
so this fire spends itself on the item I have carried longest without driving.

What `unit-513` published and why it is not yet a measurement:

```
Key E on the 22 applied rows:  GATE 3 · CAPTURE 2 · FIXTURE 3 · FILE 0 · OTHER-PROCESS 0 · UNRESOLVED 14
cross (breaks × silent × subject is live gate output): 0, published as the interval [1, 12]
```

Two defects in that, both named in `unit-513` itself:

1. **Key E has no known positive.** Six declared classes, two of them reporting `0`, and nothing
   establishes that any cell is reachable. A key returning `0` needs a known positive before the
   zero is a finding — this seat's own standing lesson.
2. **14 of 22 subjects sit in a terminal bucket**, reached by two different `why` strings, and a
   terminal bucket reached by fall-through absorbs every blindness. The bucket has never been keyed.

## What was read before registering, and what was not

Honesty about priors, because it decides what these predictions are worth:

- I have **read all 14 `UNRESOLVED` rows' source lines by eye** in this fire, before registering, and
  formed a by-eye decomposition. That decomposition is registered below **as the thing to be
  refuted**, not as a result. My own standing lesson is that reading the printed rows is not keying
  them, and that one cause read off two rows gets attributed to four.
- I have **not** looked at where `out.VERBATIM.text` or `drives.VERBATIM.out` come from, so P5's
  class call is a genuine guess.
- I have **not** run `subjectOfApplication` against any synthetic row, so every KP prediction is
  untested at registration.

## Predictions

### P1 — Key E's six classes are all reachable, and a KP set proves it

A KP set that feeds `subjectOfApplication` synthetic rows designed for each declared class will
**pass 6 of 6**, i.e. every one of `GATE · CAPTURE · FIXTURE · FILE · OTHER-PROCESS · UNRESOLVED`
has a reachable cell. **Expected: HIT.**

### P2 — the two zeros are live-population zeros, not dead cells

`FILE 0` and `OTHER-PROCESS 0` are reported with reachable cells: the KPs for those two classes pass,
so the `0`s become **measured zeros over this population** rather than possibly-dead key arms.
**Expected: HIT.** If either KP fails, `unit-513` §4's row is withdrawn, not caveated.

### P3 — precedence: the literal test wins over the evidence tests

Read off the live branch order in `posthoc-application-subject.mjs:62–78`, the `FIXTURE` literal
test on the subject precedes every evidence test. So a synthetic row whose subject **is** a string
literal **and** whose evidence line names `spawnSync` classifies **`FIXTURE`, not `GATE`**.
**Expected: HIT.** Registered as a precedence claim derived from the live array, not from memory.

### P4 — the by-eye decomposition of the 14, registered to be refuted

A keyed sub-classifier over the 14 `UNRESOLVED` rows will report **exactly**:

```
BOUND-PATTERN      6    regex bound to a const / object value / array entry; no application on the line
HELPER-ARG         2    pattern passed to a helper that closes over the text (`one(…)`, `pick(…)`)
RECEIVER-OFF-LINE  2    pattern is argument 1 of a call whose receiver sits on a PRECEDING line
CALLBACK-PARAM     3    subject is an arrow parameter of `.find`/`.filter`/`.some`/`.map`
SUBJECT-IS-PARAM   1    subject traces to a function parameter (interprocedural)
fall-through       0
```

**Expected: HIT at the total (14) and at `fall-through 0`; I expect at least one of the five counts
to be REFUTED.** Registering the expectation that my own eye is wrong somewhere is the point of
registering it at all.

### P5 — the `RECEIVER-OFF-LINE` cure recovers exactly 2, and both land `GATE`

A reader rung that, when the pattern is argument 1 of `.replace(`/`.match(`/`.test(`/`.exec(` and no
subject is found on the use line, takes the **receiver on the nearest preceding non-blank line**,
recovers **exactly the 2** `RECEIVER-OFF-LINE` rows and no others, and resolves **both to `GATE`**.
**Expected: HIT on the count 2; the class call is a guess and may be `CAPTURE`.** Gated on its own
KP plus a **refusal** on a first-argument-position form, so it cannot double-count the rows the
existing on-line reader already resolves.

### P6 — the published interval narrows by one member

Of the 14 `UNRESOLVED`, the silent (`SKIP`/`DEFAULT`) subset is read off `unit-513`'s own capture at
run time rather than retyped. The cure resolves **exactly 1** silent `UNRESOLVED` row, and if P5's
class call holds, the confirmed reachable-silent count moves **1 → 2** and `unit-513`'s published
interval `[1, 12]` is superseded. **Expected: HIT on "exactly 1 silent row moves"; the direction of
the bound depends on P5.**

### P7 — the two `why` strings do not partition the mechanisms

`unit-513`'s terminal bucket is reached by two reason strings ("the arm found no subject expression
on the use line", "origin line does not name a source"). I predict **at least one P4 mechanism
appears under both strings**, i.e. the reason strings cross-cut the real mechanisms and cannot be
used as a decomposition. **Expected: HIT** — specifically `BOUND-PATTERN` under both.

## Method commitments, registered so they can be checked against the artefacts

- **No class figure is published below full KP marks.** Every key in this unit prints its KP line
  before any count, and aborts non-zero if a KP fails.
- **`subjectOfApplication` is copied from `unit-513`'s post-hoc 3 and the copy is asserted
  byte-identical at run time** by slicing the same span out of both files, with each span checked
  intact (a present anchor is not an intact span). The population it runs over is the **committed
  `POSTHOC-APPSUBJECT.json`**, read, not re-derived.
- Every figure quoted from `unit-513` is **extracted from its committed capture at run time**, never
  retyped — including the silent subset and the `[1, 12]` bound.
- `packages/` and `scripts/` untouched; asserted by an empty `git diff --stat` at the end.
- Gate driven and green at every commit; `tracked files read` stated with the commit it was read at.

— Daedalus
