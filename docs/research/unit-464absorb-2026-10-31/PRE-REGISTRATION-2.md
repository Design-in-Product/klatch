# unit-464absorb — pre-registration addendum, written mid-unit and said so

**Written and committed BEFORE the four KP arms are driven.** The first pre-registration
could not have stated these predictions, because the fact they turn on was measured by this
unit's own first drives: **the map is SATURATED** — for every one of the seven members whose
rows quote anything, `quotedOfMe` is **exactly equal** to `ownEmits`, and the other three
quote nothing at all (`a-live.absorb.json`, `b-wide.absorb.json`).

That saturation is why P5 came out 19/0 against my predicted ≤9/≥10, and it changes what the
remaining question is. The zero price is not the checker failing to see; it is the map being
right. So the thing to drive is whether **breaking the alignment** makes the cure's price
non-zero — and that needs a known positive with a control that differs from it in exactly
one way.

## What is minted, and how the KP and its CONTROL differ in exactly one thing

The map is saturated by NAME, so there is no "emitted but unquoted" name anywhere to use.
The discriminating variable is therefore the **destination member**, with the inserted text
held byte-identical:

The inserted span is `` `pinDistance=3` `` — sliced from the arm recording, not typed — and
it is inserted, unchanged, at one of two places:

| map | insert goes on the row of | that member emits `pinDistance`? | alignment |
|---|---|---|---|
| `KP-MISATTRIBUTED-MAP.md` | `P7` (own = `actual`, `expected`) | **no** | **broken** |
| `KP-ALIGNED-MAP.md` (control) | `T2b` (own includes `pinDistance`) | yes | preserved |

Identical inserted bytes, identical quoting character (a backtick, which the live boundary
cannot cross and the cured boundary can), identical edit shape. Only the destination differs.

`pinDistance` is **not** a moved token for either `P7` (moved = `[actual]`) or `T2b`
(moved = `[fired,incidental,pinArm]`), so neither insert can move `named`, `captured`,
`fullyNamed` or `fullyCaptured`. The perturbation reaches the typed-token key and nothing
else. That is asserted in the drive, not assumed.

## Predictions

* **K1 — the shipped checker is BLIND to the mis-attribution.** On
  `KP-MISATTRIBUTED-MAP.md` at the **live** boundary, `GTYPEDDEF` is **green, 0 typed
  tokens**. The defect is invisible to the checker as it ships.
* **K2 — the cure SEES it.** Same map at the **wide** boundary: `GTYPEDDEF` **RED** with
  **exactly 1** typed token, `t2-dir-only:pinDistance`. Cure price non-zero.
* **K3 — the control stays at zero.** On `KP-ALIGNED-MAP.md`, `GTYPEDDEF` is green at
  **both** boundaries and the cure's price is **0 differing lines** — the same figure the
  unmodified map gives. So K2's red is caused by the mis-attribution and not by the edit.
* **K4 — nothing else moves.** On both minted maps and at both boundaries, `fullyNamed`,
  `fullyCaptured`, `named` and `captured` are unchanged from the unmodified map's values at
  the matching boundary. If this is refuted, K2's red is not a clean single-cause red and I
  will say so rather than report K2 alone.

## The consequence this is being driven to establish, stated in advance

If K1–K4 land, then the answer to the routed question is **not** that the cure is a no-op.
It is that **on `V22-MAP.md` the cure is a no-op because the map is correctly attributed**,
and the shipped boundary cannot distinguish that map from one carrying a mis-attributed
figure. The zero price measures the map, not the cure. That reading makes the cure's value a
function of how many filed maps are *not* saturated — which is a per-map question, exactly as
Theseus's §4 re-pricing point says, and it is not answered by this unit.

## One figure from the first drives that is already refuted and is not re-predicted here

**P2 is refuted at 2.** The wide boundary adds `only` and `since` to arm-wide `emitted`,
because it reads the tail of a hyphenated identifier as a name: `--since="…"` yields `since`
and `subject-only=true` yields `only`. Both come from arm-recording lines (3, 56, 60, 206,
211, 233 of `drive-cripple-t2-dir-only.out`), and neither is a figure anyone wrote as a
`name=value` pair. On the recording side this only ever ENLARGES `emitted`, which can only
shrink `typedRecordingKey`, so it is harmless here. **On the map side the same shape would
manufacture a name**, and if the quoting member did not emit it, a spurious typed-token
DEFECT. That is a false-positive mode of the cure and it belongs in the re-pricing. It is
measured, not predicted, and it is reported in the results as a cost of the cure rather than
as a prediction that landed.
