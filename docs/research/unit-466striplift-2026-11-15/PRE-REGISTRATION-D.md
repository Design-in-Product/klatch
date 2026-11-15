# unit-466striplift — pre-registration D

**Seat:** Theseus · **Date:** 2026-11-15 (START fire, same fire as arms A, B, C) · **Pin:** `70e58f2a`
**Arm B's recording frozen at `a3c58818`; arm C's at `e8591df1`.** Pushed **before
`arm-striplift-d.mjs` exists**.

## Why there is a D: `Q5` LANDED and is vacuous for the claim it was written to support

Arm B's `Q5` read:

> at least one committed recording publishes a JSON string array with a literal duplicate entry —
> **ambiguity realised in a published artefact, not argued in principle**: 73 array(s) across 53
> recording(s) of 1209 scanned

The predicate is true. The clause after the dash is **false of every sample it printed**:

| recording | repeated entry | actual cause |
|---|---|---|
| `round411-instruments/listing-under-the-409-key.out:84` | `""` | empty strings |
| `round435-instruments/drive2.out:31` | `"false->false"`, `"true->true"` | transition labels |
| `round436-instruments/his-round435-postcure.out:34` | `"round435-instruments"`, `"round436-instruments"` | directory names, legitimately repeated once per file |

**Zero of the 12 printed samples is a basename collision.** `Q5` keyed on *a duplicate entry* when
the hazard is *a duplicate caused by stripping*, and "duplicate entry" fuses the two with every
other cause of repetition. That is the undifferentiated-containment-match defect in the design of a
prediction, and it is this unit's **third** instance of one verdict being true while the reason
under it is false:

1. **Arm A** excluded `enumerate-legs.mjs:275` correctly, off a name list, because `KP_G` is "not
   path-like" — but `KP_G` *is* a path.
2. **Arm B** excluded the same site correctly, off the token `in`, which does not occur in that
   line's expression at all.
3. **Arm B's `Q5`** landed correctly and measured something other than its subject.

Three different instruments, one shape. The common cause is that every one of those legs was
**keyed on the verdict and carried its reason as an unexamined string** — and in all three cases
the only thing that caught it was printing the intermediate (token roots, repeated entries) beside
the verdict and reading it.

## The sharpened key — `K-dup`

A published duplicate counts only if the repeated entry is **filename-shaped**: it matches
`/^[\w.@+-]+\.(mjs|mts|ts|js|md|out|err|json|db|sh|txt)$/`. That admits `arm-p12site-b.mjs` and
`RESULTS.md`; it rejects `""`, `false->false` and `round435-instruments`, each of which is why
`Q5` was vacuous.

A duplicate under `K-dup` is a published member list in which two distinct corpus members are
**indistinguishable** — the `LOSSY_BASENAME` hazard realised in a committed artefact rather than
bounded in principle (arm A's `P5`: 853 of 3254 corpus files, 26.2%, share a basename).

## Predictions

- **`S1`** — at least one committed recording publishes a `K-dup` duplicate. I do not know the
  answer. **If `S1` refutes, that is the stronger result**, and it is the result I will publish: the
  hazard would then be *structural but never yet realised in a published list*, with the single
  firing to date (`unit-465p12site` → `unit-466rhscap`, 11/14) being the **invertible** class, which
  arm C's `R4` already establishes is the minority class at 25 of 59.
- **`S2`** — `K-dup` rejects **all** of the three sample shapes tabulated above, verified by
  asserting each literal against the key rather than by inspection.
- **`S3`** — `K-dup`'s count is **strictly less** than `Q5`'s 73, captured from arm B's frozen
  recording. A sharpened key that did not shrink the population would not have sharpened anything.

## Declared limits

1. **Extension-keyed.** A member published as a basename with no extension (a directory, or
   `README` without `.md`) is invisible. **Reach to be measured** (`D-lim1`): of the corpus's 853
   basename-colliding files, how many have an extension outside `K-dup`'s list.
2. **JSON-array-keyed, inherited from `Q5` and still not cured.** A member list published as a
   ` | `- or `, `-joined bare string is invisible. Declared in arm B as `B-lim3`, still **BOARDED**,
   still not measured — and I am naming it twice rather than letting the second mention imply it was
   handled.
3. **A `K-dup` hit shows two *entries* are indistinguishable; it does not prove the underlying paths
   differed.** A list may legitimately contain the same member twice. **Reach to be measured**
   (`D-lim2`): for each hit, whether the recording's own line gives any means of telling — printed
   per hit, not asserted in aggregate.

## Housekeeping

- Arm D reads arm B's recording frozen at `a3c58818` via `git show` to capture the 73 rather than
  re-type it, and scans `*.out` at `PIN`. Nothing in any other unit is driven or edited.
- `D-gate`: `git status --porcelain packages scripts docs/research/lib` empty.
