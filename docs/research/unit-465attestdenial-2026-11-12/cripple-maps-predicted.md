# Cripple maps — predicted before any arm was driven

Written and committed together with `grade-the-denial-rekey.mjs`, **before the first drive**. Each
map is hand-derived from the grader's source, not from a run.

Two cripples, each aimed at a different failure the clean green could otherwise hide. Both are
**additive, off `argv`** — nothing in the tree is edited, so a cripple's red cannot be confused
with a crash, and no restore step can discard an uncommitted cure.

## `--cripple=blind-key`

The live denial key becomes the never-matching one, so arm `C` collapses onto arm `A` — i.e. the
cell runs with my 10/28 census key in the live slot.

| leg | predicted | why |
|---|---|---|
| `T2` | **RED** | `loss` goes 1 → 0 and `removed` goes `[465]` → `[]`. This is the arm that proves `T2` is keyed on the cure and not on something true either way. |
| `T3` | **RED** | `B` (as-filed, still a real denial key) keeps removing 465; `C` no longer does, so they disagree by exactly `+B465`. |
| `T1` | **RED** | `T1` reads arm `C` at the prior rev too, so the prior-rev `174` becomes `175` and `removed` empties. Predicted red rather than left unstated — a cripple on the key reaches both revs, and claiming it only reddens `T2` would be a map that does not match the code. |
| `T4` | **ok** | `C` moves identically at both revs, so the member-set difference is still empty in both directions. The growth finding does not rest on the denial key. |
| `T5`, `T6`, `G1`, `G2` | **ok** | none of them reads the denial key. `T6` drives the standing cell as a child, which uses the lib's own default and is untouched by this flag. |

**Predicted verdict:** `RED red=[T1,T2,T3]`.

If `T4` reddens here, the growth finding is entangled with the key and the unit's headline is not
what the README claims.

## `--cripple=prior-as-now`

`REV_PRIOR := REV_NOW`. A zero-length interval makes "the measure did not move over the interval"
true **by construction**, which is the shape a growth test fails silently in.

| leg | predicted | why |
|---|---|---|
| `G3` | **REFUSED** | `revsDistinct` is false, so `intervalOk` is false and `G3` is `null`, not `false` — an unusable interval is not a failed claim. |
| `T4` | **REFUSED** | gated on `intervalOk`, so it refuses rather than passing on an empty difference. **This is the whole point of the arm.** |
| `T5` | **REFUSED** | same gate. |
| `T1` | **ok** | arm `C` at `REV_PRIOR` is now arm `C` at HEAD — so `T1` passes **only if** `175/174/[465]/467` is also today's reading. If `T4` lands, `T1` must pass here; if `T1` reddens here while `T4` lands, the two legs disagree and one of them is wrong. Recorded as a cross-check between the arms, not as a separate claim. |
| `T2`, `T3`, `T6`, `G1`, `G2` | **ok** | none of them reads `REV_PRIOR`. |

**Predicted verdict:** `REFUSED refused=[G3,T4,T5]`.

## What neither cripple can separate, declared

Neither perturbs the **sources** the census unions (dirs, tests, other docs, subjects). A cell that
mis-reads one of those four would be green in all three arms here. The reason that is tolerable in
this unit and not a hole is that the four source regexes are **imported** from
`attested-rounds.mjs`, where `selfTest()` grades the denial key against a known positive and a
control — but `selfTest()` grades **the key**, not the four source patterns, and nothing in this
unit grades those. Declared as a blindness, not cured.
