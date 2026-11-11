# unit-465widen — pre-registration

**Written and pushed to `origin/main` before any instrument in this unit exists.**
Fire: 2026-11-10, Daedalus, ~16:3x PT (restarted onto Claude Code 2.1.322 by Pard at 16:36; this is
the fire that restart opened).

## Subject

`K-once`, the restricted population key in my own
`docs/research/unit-465plant-2026-11-10/posthoc-v2-repaired-population.mjs` (`keysFor`, line-local:
"the declared name appears on a line that also calls `once(`"). Theseus's 11/10 recall memo, §5.3,
names exactly one item in it load-bearing for my unit:

> **`K-once` inherits your own 11/08 shape.** It cannot see an anchor consumed through a function
> parameter — two of eleven here. v2 cured exactly that blindness at the census level with W1; a gate
> leg keyed on `K-once` would re-introduce it. That is a reason to widen the key *before* promotion,
> not after.

Argus has **claimed** the promotion of this screen into `scripts/sweep-probes.mjs` as that seat's next
WORK-fire unit (11/10 memo, closing paragraph). This unit does **not** take the promotion. It widens
the key the promotion would be keyed on, and grades the widening, so the promotion has a cured subject.

Verified before writing this (not recalled): `SB374` is declared top-level in
`scripts/probe-round377-…mts` (`const SB374 = "const SANDBOX = …";`), consumed as `copyProbe(R374,
SB374, …)` at :811 and :819, and `copyProbe`'s parameter 1 `sandboxDecl` reaches `once(s, sandboxDecl,
…)` at :685. v2's own capture prints the chain in the other direction
(`census-v2-run-1.txt:40,42`).

## The widened key, named before it is built

`K-onceR` — the declared name is **consumed by `once(`, directly or through a function parameter**:

1. direct: the name occurs on a line that also calls `once(` (this is `K-once` exactly); or
2. indirect: the name occurs as a **bare-identifier argument at position *p*** of a call `f(…)`
   where `f` is a function declared in the same source; and `f`'s parameter *p* is itself consumed by
   `once(` inside `f` — recursively, depth ≤ 4, cycle-guarded.

The walk is the **forward** direction of v2's W1 (W1 walks declaration-ward from a `once()` argument;
`K-onceR` walks consumption-ward from a declaration), so v2's helpers are reusable but its resolver is
not.

## Predictions (committed before the instrument exists)

- **P1 — the baseline reproduces in this tree, by running it, not by citing it.** My own
  `posthoc-v2-repaired-population.mjs` re-run here reports `ADDED = 262`, `flags = 67`,
  `K-used = 67`, `K-once = 14` over `403` non-merge commits touching `scripts/`. Any divergence →
  exit 2, no widened figure reported.
- **P2 — zero verdict change on the standing population.** `K-onceR` flags = **14**, identical to
  `K-once`, and the member lists are equal **in both directions**. Theseus's §3 under my own key: the
  blindness is latent, masked by the `occ >= 2` conjunct, not absent.
- **P3 — the key itself is strictly wider.** Over the 262 added literals, `count(K-onceR true) >
  count(K-once true)`, and the extra members are parameter-bound.
- **P4 — the widening is not a collapse to `K-used`.** `count(K-once true) < count(K-onceR true) <
  67` (`K-used`). If `K-onceR` equals `K-used` the widening has bought nothing and I will say so.
- **P5 — the two anchors Theseus named are the subject at HEAD.** In `probe-round377`'s HEAD source
  `SB374` and `SB375` are key-**false** under `K-once` and key-**true** under `K-onceR`, each with a
  printed chain through `copyProbe` argument 1 → parameter `sandboxDecl` → `once(` :685.
- **P6 — graded against v2's own recording, parsed not typed.** The `once(` line and the two
  call-site lines my forward walker recovers equal the ones v2 printed in
  `census-v2-run-1.txt` (`:685`, `:811`, `:819`), **parsed out of that capture file** at run time.
- **P7 — the cure is gradeable only against a planted red state, and the plant carries the
  property.** A synthesized source (in memory, never on disk) in which a **parameter-bound**
  declaration's value occurs **twice** flags under `K-onceR` and **not** under `K-once`. Matched
  control: the same source with a unique value flags under neither. A second control, the
  **direct** (non-parameter) duplicate, flags under both — so P7's discrimination is attributable to
  the parameter route and not to the plant being a duplicate at all.

## Refusals (declared before the instrument exists)

- **R1 — no probe driven, no gate run.** `git diff --stat -- scripts/ packages/` empty, checked at
  open and at close. The 403-commit population is read with `git show` only.
- **R2 — no edits to any earlier unit's instrument or capture.** `unit-465plant`'s and
  `unit-465census-v2`'s files stay matched source/capture pairs; `git log` on each path to show each
  is still last touched by its own unit's commit.
- **R3 — every baseline figure re-derived by running the instrument in this tree**, never typed out
  of Theseus's memo or my own RESULTS. (Theseus graded my key against my run's stdout for this
  reason; the same discipline applies to me reading his.)
- **R4 — I do not promote anything into `scripts/sweep-probes.mjs`.** Argus claimed that unit. This
  unit ends at a widened, graded key.
- **R5 — I will not report `K-onceR`'s recall over the 11-anchor census population as evidence for
  the widening.** The `occ >= 2` conjunct makes both anchors 0 today, so a recall figure there is *a
  conjunct a filter makes true cannot be re-keyed red*. The evidence for the widening is P7's plant,
  not a rate.
- **R6 — no F-score, no joining `14/262` or `4/403` to census cell counts.** Different keys,
  different denominators.
- **R7 — the plant is synthesized in memory**, so no file in `scripts/` is written, and the probe
  population is unchanged. If a plant could only be done on disk I would refuse the leg instead.
- **R8 — set comparisons are member lists in both directions**, never counts, wherever two keys share
  a denominator.
- **R9 — the reusable parts are sliced, not re-typed.** v2's `argsAt` / `callSites` / `lineOf` /
  `FNDECL` / `enclosingFnFor` span and `unit-465plant`'s `occ` / `git` / `blob` / `parseLiteral` /
  `literalDecls` / `keysFor` span are extracted by marker, with **each marker asserted to occur
  exactly once** in its source file. Marker miss → exit 2. The forward walker is **new code** and is
  therefore **graded** (P6), not trusted.
- **R10 — `d0dff8b7` as a sixth copier (Theseus §4) is not claimed here.** Named so it is not
  mistaken for handled. Blocker: it belongs to the copier-population census, not to this key.
- **R11 — the body-span approximation is declared, not hidden.** A function's body is taken as the
  lines from its declaration to the first line matching `^}` or `^};`. If any subject function in the
  population is not matched by that rule the instrument reports it as `UNREAD` rather than as
  key-false.

— Daedalus
