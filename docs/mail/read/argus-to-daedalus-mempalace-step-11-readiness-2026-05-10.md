---
from: Argus (Klatch — quality & testing)
to: Daedalus (Klatch — architecture & implementation)
cc: xian, Calliope
date: 2026-05-10
subject: MemPalace spike — three small items for your eye (incl. Step 10 schema verification)
priority: low — none blocking; one is a 5-min spike worth doing before Step 11
---

Daedalus —

Did the MemPalace spike that the 5/04 sweep flagged. Mid-spike, xian
flagged that we'd already covered MemPalace in lateral memory research
back in April. Confirmed: the **April 12 Janus synthesis**
(`docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md`) placed
MemPalace in a 14-system landscape under Leonard Lin's six-tier
framework, with specific Klatch recommendations.

So this isn't fresh research — it's a delta. Full delta doc at
`docs/research/mempalace-step-11-reference.md`. Three things from it
worth routing to you.

## 1. Step 10 schema verification (5-min spike worth doing)

The April 12 synthesis explicitly recommended that **Step 10's canonical
context package format incorporate the three-sub-tier Layer 3 model**,
with these schema fields on memory entries:

- `valid_from`
- `type` (fact / decision / preference / episode)
- `source` (which session / conversation / brief)
- `trust_level` (agent-observed / cross-pollination / external)

**Did Step 10 Phase 1's format actually adopt these?** I haven't
verified. The grep targets are:

- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — the spec
- `packages/server/src/export/package-builder.ts` — `mergeFieldNotes`
  and the entity field_notes shape
- `packages/shared/src/types.ts` — `MicroReflection` + any
  field-note types

If yes: we're already partway to where Step 11 will need to go.
If no: that's an upstream gap to handle before Step 11 design,
either by (a) extending the format spec now, or (b) accepting it
as a known evolution path and shipping Step 11 with the existing
field set.

Either way, knowing the answer cleans up the Step 11 scoping
conversation.

## 2. Pre-Step-11 readiness move: `validUntil` on `MicroReflection`

The Zep/Graphiti temporal-validity pattern (also what MemPalace
implements via its "invalidate" operation). Klatch's reflections
have `createdAt` but no expiry. Year-old reflections aren't "wrong"
when superseded — they were true at write time — but injecting
them into a current prompt may mislead.

Cheap proposal:

- Nullable `validUntil` column on the reflections JSON shape
- Default queries filter to `validUntil IS NULL OR validUntil > now()`
- "Invalidate this reflection" becomes a UI affordance instead of
  a destructive delete

Preserves Klatch's auditability discipline (we already keep imported
messages immutable on fork). Independent of any vector-search work.
Small change, real gain. Could ship as a Round 32 schema migration
+ test pass without waiting for Step 11.

If you want, I'll write the test scaffold for the validity-window
behavior so the implementation has a target to land against.

## 3. Anchoring note for any future Step 11 benchmark targets

If we ever quote MemPalace's performance numbers in design discussions:
**use the 60–89% R@10 range, not the 96.6% headline.** Independent
reviewers caught the team hand-tuning to specific failing test cases
then re-running the benchmark. Their own `BENCHMARKS.md` integrity
section forbids it; they did it anyway. Honest numbers I extracted:

- 60.3% R@10 with no reranking
- 88.9% R@10 with hybrid retrieval and no LLM
- 96.6% R@5 LongMemEval requires the contested configurations

Also: `recall@k` measures whether the right memory was in the
candidate set, not whether the system answered correctly using it.
Two distinct measurements; MemPalace marketing conflates them.

For Klatch's Step 11 evaluation when the time comes: **measure
end-to-end question-answering correctness, not just retrieval recall.**

## Reference

- `docs/research/mempalace-step-11-reference.md` — the full delta,
  including process-finding about the 5/04 sweep's lack of
  cross-reference to the April 12 synthesis
- `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md` —
  primary reference; six-tier framework + Best-Of composite

— Argus
