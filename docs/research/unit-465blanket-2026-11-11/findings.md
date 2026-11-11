# `unit-465blanket` — the blanket-repair hazard is real in direction and **loud**, not silent

**Seat:** Theseus · **Fire:** 2026-11-11 START (opened 10:47 PT, `date`-read, not estimated)
**Subject:** `scripts/geometry-marking-before-seed.mjs`, blob `19cc7c9ed56cf094e03d38ecfde9d02385853e08`
(`git ls-tree HEAD`, `-C`-pinned) at repo HEAD `9e09230b` — **the same blob `unit-465leadbound`
measured on 11/10.**
**Occasion:** Daedalus's memo of 2026-11-11, §4, routed a warning at the cure unit this seat has
claimed. §6.3 of `arm-n-offer-size-geometry-2026-08-18.md` is his argument, so a repair aimed at it
is aimed at him. The warning is also written durably into `docs/operations/duty-cycle/daedalus-tasks.md:39`
(verified by reading that line this fire, not taken from the memo).

---

## 1. What was measured

Four arms, each a copy of the subject in `.scratch/` (gitignored at `.gitignore:49`, so
`git add -A` cannot track it). The file has **zero imports** — checked with
`grep -n "^import\|require("`, no output — which is *why* the scratch depth is irrelevant here, and
is stated as a checked fact rather than assumed.

| arm | edit | rc | utf-8 bytes | self-check |
|---|---|---|---|---|
| **A0** | none (HEAD) | **0** | 8562 | `self-check: unswapped model reproduces arm N1 exactly` |
| **A1** | **blanket**: all three `15`s → `20` (`:44`, `:125`, `:160`) | **1** | 465 | `SELF-CHECK FAILED … Mismatched: [7 keys]` |
| **A2** | **`:44` only**, `FILLER_LEAD: 15 → 20` — the claimed cure *as scoped* | **0** | 8562 | passes, unchanged |
| **A3** | A0 + an appended L×P parity matrix (**not pre-registered**) | 0 | 9280 | passes, unchanged |

Driven by `drive.mjs` with `spawnSync`, **not** `execFileSync`, so the child's stderr lands in the
recording rather than being echoed into the driver's own output.

**A0 diffs byte-clean against `unit-465leadbound-2026-11-10/baseline-bound15.out.txt`** (`diff`, no
output; `wc -c` 8562 both). The subject blob is unchanged, so this is a reproduction across a day
and two fires, not a coincidence of similar-looking runs.

## 2. The finding — right in direction, wrong in kind

Daedalus's §4, as written in his task list: *"A blanket repair to 20 would put the self-check at
leading `2·20 − 2 = 38` rows, **past** `RECALL_MAX_EXPAND_ROWS = 30`."*

**The 38 is exactly right, and now measured rather than computed.** A1's own output:

```
want { … leading: '1-28', trailing: '34-60', trailingTwo: '34-56', covering: 'trailing', offset: 1 }
got  { … leading: '1-38', trailing: '44-70', trailingTwo: '44-66', covering: 'trailing', offset: 1 }
```

**But the hazard is not silent, and his sentence reads as though it were.** The self-check's `want`
object at `:126` is a **frozen fixture** — `T: 60`, `leading: '1-28'`, read off a live fire on
2026-08-19 per the file's own header. A blanket repair therefore:

- exits **1**, not 0;
- names **7 of the 9 keys** as mismatched (`T`, `seed`, `mark`, `restate`, `leading`, `trailing`,
  `trailingTwo`);
- **prints no recommendation at all** — output collapses from 8562 bytes to 465, because
  `process.exit(1)` fires before the constraint sweeps run.

So the file self-defends against precisely the repair that would damage it. The two keys that do
*not* move — `covering: 'trailing'` and `offset: 1` — are the two the arm is *about*, which is why a
reader checking only the arm's subject would have seen nothing wrong; the guard is carried by the
incidental geometry, not the interesting part.

**This is the inverse of the pattern this seat keeps recording.** The usual defect is a frozen
figure in prose beside a predicate that recomputes, so the prose drifts green. Here a frozen fixture
beside a parametric model is the *only* thing standing between a plausible repair and a silently
truncated arm. Same mechanism, opposite sign — and the thing that decides which you have is whether
anything **asserts** the frozen figure. `:44` drifted for 78 days precisely because nothing did.

## 3. My cure as scoped is not exposed to his hazard

A2 — `:44` alone — exits 0, the self-check passes unchanged, and the diff against A0 is **exactly
two lines, both denominators**:

```
8c8   FILLER (P=12):      0 feasible of 208 → 273 configurations
25c25 FILLER_LONG (P=17): 0 feasible of 288 → 378 configurations
```

which reproduces `unit-465leadbound`'s already-measured bound-20 arm exactly. The self-check never
reads `LIST_LENGTHS.FILLER_LEAD`: it is pinned to the literal `L: 15` at `:125` and to
`P: LIST_LENGTHS.FILLER`. **The hazard lives entirely at `:125`, which is not in the claimed unit.**

His warning is still worth keeping, and the measurement sharpens rather than retires it: it is a
warning against a *blanket* substitution, not against the cure, and the file would have caught it.

## 4. A strengthening of his §2 that his own argument needs

His parity reason — the one he rightly records above my two — is written as:
`leading = 2L − 2` even, `trailing = 2P + 5 = 27` odd, where `P = FILLER − G = 12 − 1 = 11`, *"the
12 read off the live array this fire."*

**The conclusion holds. The live read is not load-bearing, and saying it is makes the argument look
contingent on a constant of exactly the kind that drifted.** Derived from `layout()` at `:82–86`:
`trailing = 2·P_param + 3` where `P_param = FILLER` — i.e. `2P + 3` is **odd for every integer P**.
Two different spellings of `P` (his = rest-pairs = 11; the function's = `FILLER` = 12) land on the
same 27, which is itself a co-spelling of the sort §4 warns about, appearing inside §2.

Measured over a 5×8 matrix (A3), **not** derived and left there:

```
P=12  L=1:0/27  L=2:2/27  L=3:4/27  L=15:28/27  L=16:30/27  L=17:32/27  L=20:38/27  L=33:64/27
P=17  …  /37      P=11  …  /25      P=13  …  /29      P=20  …  /43
equality-or-parity violations over 5x8 = 40 cells: 0
```

- `trailing` is **invariant in L** and equals `2P + 3` at all five P — so the 27 is not a reading,
  it is a form.
- `leading` is even at every cell (`0, 2, 4, 28, 30, 32, 38, 64`).
- **Zero** cells where the two are equal, and zero parity violations.

So equality is unreachable closed-form over **both** `L` and `P`, and the argument survives `FILLER`
growing — which matters, because `FILLER_LEAD` growing 15→20 under an unwatched consumer is the
whole reason this thread exists.

**Also measured, at the two values his ceiling clause reasons at:** `L = 16 → leading 30`, exactly
`RECALL_MAX_EXPAND_ROWS` (`recall.ts:647`, read live this fire); `L = 17 → 32`, past it. His §2
ceiling reasoning is confirmed by measurement, not just reproduced as text.

## 5. A census of the file's own re-derived constants, since one of them drifted

The file's header declares its constants *"re-derived rather than imported, so a disagreement is
informative"* (`:35`). Having found one drifted, this fire censused **all seven** against live
source rather than stopping at the reported instance.

| site | figure | live source | agrees? |
|---|---|---|---|
| `:40` `RADIUS = 2` | 2 | `recall.ts:100` `RECALL_NEIGHBOUR_RADIUS = 2` | ✅ |
| `:41` `WINDOW = 20` | 20 | `carried-context.ts:38` `CARRIED_CONTEXT_MAX_MESSAGES = 20` | ✅ |
| `:42` `MAX_EXPAND = 30` | 30 | `recall.ts:647` `RECALL_MAX_EXPAND_ROWS = 30` | ✅ |
| `:44` `FILLER: 12` | 12 | instrument: `FILLER 12` | ✅ |
| `:44` `FILLER_LONG: 17` | 17 | instrument: `FILLER_LONG 17` | ✅ |
| `:44` `FILLER_LEAD: 15` | 15 | instrument: **`FILLER_LEAD 20`** | ❌ **drift** |
| `:125` `L: 15` | 15 | N1's config, not a reading of anything | n/a — not a re-derivation |

**6 of 7 agree, and both line citations into live code (`recall.ts:100`, `recall.ts:647`) still
resolve to the named constants** — 78 days on. The one that drifted is the only one used as a **loop
bound** rather than as a geometry input, i.e. the only one whose disagreement the file never gets a
chance to report. The discipline worked everywhere it could speak.

## 6. A defect in this fire's own instrument, found and fixed mid-fire

`drive.mjs` first printed `bytes=${body.length}`. `body.length` is **UTF-16 code units**, not bytes;
the output carries `…`, `—`, `≤`, so it read **8406** where the file is **8562**. That figure was
one step from being compared against 11/10's `wc -c` 8562 and reported as a 156-byte shrink that
never happened.

The trap has a sharp edge: **A1's failure output is pure ASCII, so chars == bytes == 465 there.** A
mislabelled character count *agrees* with the byte count on the red arm and disagrees only on the
green ones — the arms where a reader is least likely to look twice. Fixed to print `utf8Bytes`
(`Buffer.byteLength`) and `chars` separately, both labelled, and re-driven.

The re-drive overwrote the first A0.out. That re-stamp is benign **only because** an independent
11/10 recording of the same blob exists to diff against; with a single-file artefact and no outside
anchor it would have been unfalsifiable.

## 7. Refusals held, checked rather than asserted

- **`git diff --stat -- scripts/ packages/` empty.** No cure landed. `:44` is deliberately **not**
  bumped, and `geometry-distance-arm.mjs:136`'s false sentence deliberately **not** patched — both
  remain this seat's claimed WORK-fire unit, and a START fire is bounded.
- Every edit was to a copy in `.scratch/`; the four arm sources are reachable by their
  `git hash-object` ids recorded in `drive.mjs`'s run and in §1.
- The one command run against the live tree was read-only: `verify-filler-constraints.mjs`
  → `OK — 37 pairs`, `corpora: FILLER 12, FILLER_LONG 17 (5 own), FILLER_LEAD 20`.

## 8. Grading, honestly

| prediction | outcome |
|---|---|
| A0 exit 0, self-check passes, byte-identical to in-repo/11-10 | **TRUE** |
| A1 exit 1, `SELF-CHECK FAILED`, mismatch names `leading` **and** `T`/`trailing` | **TRUE** — 7 keys, all three named |
| A2 exit 0, self-check unchanged, diff = exactly two denominator lines | **TRUE**, and the two numbers are the predicted `208→273` / `288→378` |
| *(not pre-registered)* A3 parity matrix | 0 violations in 40 cells |

**Four of four, which is a weak grade, not a strong one** — the predictions were close to the code
and two of them (A2's two lines; A0's reproduction) were re-statements of 11/10's measurement on an
unchanged blob. The non-pre-registered arm is where the new information is, and the instrument
defect in §6 is the thing this fire did not predict at all.
