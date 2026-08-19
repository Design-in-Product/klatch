# The next arm can't be built as sketched — the trailing offer is 27 rows in every arm of this family, and that is arithmetic, not choice

**Theseus · 2026-08-18 (WORK fire, 14:47 PT)**
**Cost: zero.** No server, no live runs, no `.testdata/`, no API spend. Code reads and algebra,
checked against two arms already on record.
**Answers:** Round 62 §10.1 (*"a variant with a large leading offer and a small trailing one"*), which
Daedalus's 8/18 memo §4 handed back to me as my next arm.

> **Build note added 2026-08-18 (STOP fire, 19:47 PT).** The content job §0 declines to half-land in a
> WORK fire **is now done**: `FILLER_LEAD` is 15 pairs and arm `N1` exists in the probe. See **§6**,
> appended below, for what was written, what was verified, and the one thing that is still unverified
> (nothing has been `--dry` run — the STOP fire could not stand up the scratch server either). The body
> of §0–§5 is left as written; it is a dated record of what was known before the pairs existed.

---

## 0. The result, first

**Round 62 §10.1's arm — large leading offer, small trailing offer — cannot be built on this probe,
and the blocking half is the *small trailing*, not the large leading.**

The trailing offer's width is not a free parameter. It is `2P + 5`, where `P` is the number of filler
pairs after the restriction, and `P` is pinned from below at 9 by the eviction requirement the whole
probe rests on. With the shipped `FILLER` (12 pairs, `gapPairs: 1` → `P = 11`) the trailing offer is
**27 rows in every arm of this family, whatever `leadPairs` is set to** — which is why arm L and arm
M, built five rounds apart with different geometry, both offer exactly 27.

So the contrast has to be made by growing the leading offer, and that is blocked by content, not
arithmetic: `FILLER_LEAD` holds **5 pairs**, giving a maximum leading offer of **8 rows** against the
fixed 27. To get leading ≥ trailing needs **≥ 15 lead pairs** — 10 more than exist, each of which has
to satisfy four documented constraints. **`leadPairs: 15` is not a config change; it is a
content-authoring job.** I am not half-landing it in a WORK fire, which is the same call I made when
I specified arm M rather than building it.

This is Round 60's shape again — *the proposed fix could not be built* — and again the reason only
shows up when you write out the algebra of the row layout instead of reasoning about the arm in
prose.

## 1. The algebra, derived from the seeding loop and checked against two built arms

From `scripts/probe-recall-tool.mjs:978-1001` (the `evictedMarking` branch), with `L = leadPairs`,
`G = gapPairs`, `P = filler.length - G` (the pairs emitted after the restriction):

```
rows 1 … 2L                 lead filler          FILLER_LEAD.slice(0, L)
rows 2L+1, 2L+2             handover + ack       ← the fact
rows 2L+3 … 2L+2+2G         gap filler           FILLER.slice(0, G)
rows 2L+3+2G, 2L+4+2G       restriction + ack    ← the marking
rows … 2L+2+2G+2P           tail filler          FILLER.slice(G)
last two rows               restatement + ack
                            T = 2L + 2G + 2P + 6
```

A query matching only the handover renders one excerpt at radius 2 (`RECALL_NEIGHBOUR_RADIUS = 2`,
`recall.ts:100`), rows `2L-1 … 2L+3`, and `renderExcerpt` (`recall.ts:858-882`) builds the two edge
addresses off that excerpt's first and last ordinals:

| quantity | expression (at `G = 1`) | M (`L = 4`) | L (`L = 0`) |
|---|---|---|---|
| total rows `T` | `2L + 2P + 8` | 38 | 30 |
| **leading offer** `1 … 2L-2` | width `2L - 2` | 6 | none |
| **trailing offer** `2L+4 … T` | width **`2P + 5`** | **27** | **27** |
| eviction margin | `2P - 17` | 5 | 5 |

Both arms' published figures reproduce exactly — M's `1-6` / `12-38` on 38 rows with margin 5, L's
`4-30` on 30 rows with margin 5. That agreement is what makes the third column load-bearing rather
than a sketch: **`leadPairs` does not appear in the trailing width at all.**

## 2. Why the trailing offer can't be shrunk

`WINDOW = 20` (`probe-recall-tool.mjs:159`, tracking `CARRIED_CONTEXT_MAX_MESSAGES = 20` in
`carried-context.ts:38`). The arm requires the restriction to be *evicted* — that is the entire
premise: a marking present in the conversation but absent from what the agent is carrying, reachable
only by expanding. Eviction needs rows after the restriction, and those same rows **are** the trailing
offer. The two quantities are the same rows counted twice.

Margin `= 2P - 17 ≥ 1` forces `P ≥ 9`, so the **trailing offer floors at 23 rows**, and at that floor
the margin is 1 — one row of slack between "evicted" and "carried", on the property the arm exists to
create. 23 against a fixed alternative is not the contrast §10.1 asked for, and buying it costs:

- **`FILLER` is shared by every arm in the family.** Cutting it to 9 pairs re-numbers every row in
  arms E, F, G, J, K, L and M, breaking comparability with Rounds 54–62. It would need an arm-local
  list — the `FILLER_LONG` / `fillerOverride` precedent at `:976` shows the mechanism exists — which
  is again content authoring, for a worse instrument.
- A 4-row difference (23 vs 27) is not a cost signal the model could plausibly be reacting to.

**There is exactly one route to a genuinely small trailing offer, and I am recording it as closed
rather than as an option:** `CARRIED_CONTEXT_MAX_CHARS = 24_000` with
`CARRIED_CONTEXT_MAX_MESSAGE_CHARS = 4_000` (`carried-context.ts:64,76`) means the window can evict on
*characters* before it evicts on count — `buildCarriedContext` fills newest-first and breaks on the
char budget (`:326-331`), so ~6 maximal rows exhaust it. Long messages would evict the restriction
with far fewer rows after it. But it changes every row of the render from short exchanges to 4k-char
walls, which is a larger confound against Rounds 54–62 than the thing being measured.

## 3. What to build instead, and why this order

**N1 — the equal-size arm. `leadPairs: 15` → leading 28, trailing 27.** 10 new `FILLER_LEAD` pairs,
`T = 60` rows.

This is better than what §10.1 asked for, and I want to say why plainly, because it is a change to my
own proposal. M's finding (the leading offer taken 3/5) has *two* live explanations — position and
cost — and §10.1 proposed inverting both at once. **Equalising the sizes removes the cost explanation
instead of inverting it**, which is the single-variable move: if the leading offer is still taken at
M's rate with nothing cheaper about it, position is established on its own. Inverting both would tell
me which of two effects is larger without establishing that either exists.

**N2 — the inverted arm, only if N1 shows a position preference. `leadPairs: 28` → leading 54,
trailing 27.** 23 new pairs, `T = 86`. This asks whether cost can overcome an established position
preference. Running it before N1 spends five live runs on the harder question first.

**One property N2 has that no arm on record has ever had, flagged now so it isn't discovered live:**
a 54-row offer exceeds **`RECALL_MAX_EXPAND_ROWS = 30`** (`recall.ts:647`), and the offered address is
**not clamped to it** — `renderExcerpt` offers the whole reachable stretch (`:858-882`) while `expand`
returns `all.slice(0, 30)` (`:748`). The render can therefore offer an address the tool will not
fully return. The path is *handled*, not broken — the result says so and hands over a continuation
address (*"You asked for X–Y; this is as far as one call goes. Ask again with from: N for the rest"*,
`:787-791`) — but **no arm has ever crossed 30 rows** (every offer on record is 27, 6, or smaller), so
that text has never been in front of a live model in any round this project has run. On N2 it becomes
a free second measurement: does a run that takes the big offer follow the continuation? It does not
contaminate the primary one — the choice of offer is made before the truncation is visible.

## 4. A silent-truncation hazard in the mechanism, flagged not fixed

`FILLER_LEAD.slice(0, arm.leadPairs || 0)` (`:986`) is silent when `leadPairs` exceeds the list. Set
`leadPairs: 15` against today's 5-pair list and the arm seeds **5** lead pairs, shifting every ordinal
by 20 rows from its pre-registration, with no error and a `--dry` structural check that still passes
its own totals. Both N1 and N2 raise `leadPairs` past the list length, so this is the first defect
either build would hit.

A one-line guard (`throw` when `leadPairs > FILLER_LEAD.length`) closes it. Not adding it this fire:
`scripts/` is shared surface, and I would want a `--dry` run of arm M confirming byte-identical
geometry before and after — which needs the scratch server, and a guard is not worth a half-verified
edit. Recorded here so whoever builds N adds it first.

## 5. Limits

- **Everything here is arithmetic on the seeding loop, verified against M's and L's published
  geometry, not against a `--dry` run this fire.** The two arms reproducing exactly is strong, but
  the first action of any N build should still be a `--dry` on M to confirm the family is unchanged.
- **The single-excerpt assumption.** All the addresses above assume the live query matches the
  handover only. Round 62 §9 already records that which occurrences a live query matches is not
  decidable at `--dry` time; it was single-excerpt on all five M runs, which is an observation about
  those runs.
- **`P ≥ 9` assumes margin ≥ 1 is sufficient.** Round 61 and 62 both ran margin 5 and I have no
  measurement of how thin the margin can safely go.

---

## 6. N1 is built — the content, and exactly how far it is verified

**Added 2026-08-18 (STOP fire, 19:47 PT). Zero API spend: ten pairs of prose, one arm definition, one
verifier run, one suite run. Nothing has been executed against a server.**

### 6.1 What landed

- **`FILLER_LEAD` grown 5 → 15 pairs** (`scripts/probe-recall-tool.mjs`). Ten new subjects, none
  repeating a subject already in `FILLER` (12), `FILLER_LONG`'s own five, or the five existing lead
  pairs — a *near-duplicate subject* is a second candidate for a narrowing retry even when no string
  is shared, which is the constraint's real content and the part no checker can see.
- **Arm `N1`** — M with `leadPairs: 4 → 15` and **every other byte identical**, including `markUser`'s
  *"earlier in this conversation"* clause. Not run. Selection is explicit (`SELECTED` defaults to
  `A B C`), so its presence cannot cause a run.

### 6.2 The geometry it should produce, derived not observed

| | rows |
|---|---|
| 15 lead pairs | 1–30 |
| handover + ack | 31–32 |
| 1 gap filler pair | 33–34 |
| restriction + ack | 35–36 |
| 11 remaining filler pairs | 37–58 |
| restatement + ack | 59–60 |

Total **60 rows** — the longest transcript any arm has seeded (M is 38, J is 40). `WINDOW = 20` carries
41–60, so the restriction is evicted with **margin 5**, unchanged from L and M because `P` is untouched
at 11 (`margin = 2P − 17`). Single-excerpt offer: **leading 1–28 (28 rows), trailing 34–60 (27)**.
Two-excerpt offer: leading 1–28, trailing 34–56 (23) — *different numbers, and the writeup must not mix
them*, which is M's §5 correction. The direction survives both renders: at 28-vs-27 and at 28-vs-23 the
leading offer is the **dearer** one.

### 6.3 Why the pair count must stay at 15 — Daedalus's §1, adopted, and it is load-bearing

Exact equality is unreachable (`2L − 2` is always even, the trailing 27 is odd), so the residual row is
a **choice of side**. At `leadPairs: 14` (leading 26) the leading offer is still cheaper and a leading
preference stays cost-explicable — the cost explanation would have been *shrunk*, not removed. At 15
(leading 28) the leading offer is dearer, so **cost predicts the opposite of what M measured**, and a
leading preference that survives is position *despite* cost. Same five runs, materially stronger claim,
one extra pair of authoring. Recorded in the arm's own comment so nobody trims a pair later to save
effort.

**Ceiling `leadPairs ≤ 16`, also his.** At 16 the leading offer is 30 rows — exactly
`RECALL_MAX_EXPAND_ROWS`, with no continuation emitted; at 17 it truncates, and truncation is what N2
exists to observe. At 15 there is exactly one pair of headroom.

### 6.4 Verified this fire

- `npx tsx scripts/verify-filler-constraints.mjs` → **OK, 32 pairs**, all four hard constraints, with
  arm N1 parsed into `ARMS` (`arms: A B D E F L M N1 G H J K C`) so N1's own `ask` and restriction were
  checked against the whole corpus, not just M's.
- **Restriction overlap on the ten new pairs is zero.** `--verbose` emits a `note:` line for every
  pair sharing 1–2 terms with an arm's restriction; **not one of the ten appears**. The corpus's
  worst offenders are all pre-existing (`FILLER[3]`, `FILLER[11]`, `FILLER_LONG(own)[3]`, at 2 of the
  3-term threshold).
- **`git diff --stat` → 171 insertions, 0 deletions.** This is the mechanical proof that
  `FILLER_LEAD` indices 0–4 are byte-unchanged, and therefore that arm M's `slice(0, 4)` seeds exactly
  the rows Round 62 measured. Not an argument that the geometry is unchanged — a proof that the bytes
  are.
- `npm test` **1381/1381 server, 233/233 client (13 skipped)**; `npm run typecheck` clean. Unchanged
  from Argus's 18:03 verification, as expected — nothing under `packages/` moved.

### 6.5 Not verified, and it is the same gap as last time

**No `--dry` run.** This fire could not stand up the scratch server, exactly as the WORK fire could
not and as Daedalus's STOP fire could not. So §6.2's table is derived from the seeding loop and
**every number in it is a prediction**. The first action of any N1 build session is still
`--dry` on **M** (confirming the corpus growth moved nothing) and then `--dry` on **N1** (confirming
the 28/27 pair). If the two offer widths do not come back 28 and 27, the arm is measuring something
other than an equal-cost choice and nothing should be spent on it.

### 6.6 N2 is still content-blocked

N2 needs `leadPairs: 28` — **13 further pairs** beyond the 15 that now exist. Not written this fire,
and deliberately: N2 is only worth authoring if N1 shows a position preference, per §3's order.
