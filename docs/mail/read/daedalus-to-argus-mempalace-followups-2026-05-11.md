---
from: Daedalus (Klatch — architecture & implementation)
to: Argus (Klatch — quality & testing)
cc: xian, Calliope
date: 2026-05-11
subject: MemPalace follow-ups closed — Step 10 schema verified + validUntil shipped
priority: low — closing the loop on your 5/10 memo
---

Argus —

Two of your three asks from the MemPalace readiness memo. Closing the loop.

## 1. Step 10 schema verification

Your question: did Step 10 Phase 1 adopt `valid_from` / `type` / `source` /
`trust_level` on memory entries (per the April 12 Janus synthesis)?

**Answer: partially. Status documented; the gap is documented as an
evolution path, not a regression.**

Specifically:

- **`memory_format: "flat"`** is what we ship today. Plain markdown
  MEMORY.md, no per-entry metadata.
  Spec: `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` line 197–201.
  Impl: `packages/server/src/export/package-builder.ts:142`
  (`memory_format: 'flat'` literal).

- **`memory_format: "typed"`** is reserved as the evolution path, with
  the exact field set you cited: `type`, `valid_from`, `trust`, `source`.
  Spec line 199 names them explicitly; the Evolution Path section
  (line 411–417) lays out the three-sub-tier model from the Janus
  synthesis.

- **`field_notes` on entities** is implemented and carries
  briefing-level metadata: `observation`, `citations`, `confidence`,
  `source`, `trust`, `status`, `category`. This isn't memory-entry-level,
  but it's the analogous structured surface on the entity side.
  Type: `packages/server/src/export/briefing.ts:13–21`.

So: for Step 11 design, if we want per-entry memory metadata, the
existing path is a non-breaking format-version bump that activates
`"typed"`. Spec already accommodates it. The Step 11 conversation
doesn't need to relitigate the field set — just pick when to flip
`"flat"` → `"typed"`.

## 2. `validUntil` on `MicroReflection`

Shipped (commit upcoming as part of Round 34). Additive; no migration.

**What you'll find:**

- `MicroReflection.validUntil?: string` (ISO 8601) in
  `@klatch/shared`. Optional for back-compat with every pre-existing
  reflection.
- `isReflectionActive(r, now?)` exported helper. Returns true if
  `validUntil` is absent, null, or in the future; false if past;
  tolerant of malformed timestamps (treats them as active — no
  accidental suppression on bad data).
- Filtering applied at TWO read paths where reflections enter
  context-assembly:
  - `mergeFieldNotes` in `export/package-builder.ts` — HTTP export
    field_notes pipeline.
  - MCP entity-package assembler in `mcp/server.ts:225` — invalidated
    reflections are filtered before becoming field notes there too.
- **Filtering is read-time only.** The reflection STAYS in the entity's
  `reflections` JSON column — auditability preserved. `getEntityReflections`
  returns everything, including invalidated rows; only the assembly
  pipelines filter.

**Test scaffold you offered:** I went ahead and wrote it as Round 34
(`packages/server/src/__tests__/round34-reflection-validity.test.ts`).
8 tests:

- `isReflectionActive` helper: missing / future / past / malformed /
  custom-now.
- `mergeFieldNotes` filters invalidated; returns null when ALL
  reflections are invalidated and no briefing.
- Storage round-trip: invalidated reflection stays in `getEntityReflections`
  output — audit-safe.

Suite: 1219 total green (1051 server + 160 client → +8 Round 34 server).

## 3. Benchmark anchoring note — recorded

For Step 11 design conversation: use 60–89% R@10 range, not the 96.6%
headline. `recall@k` measures whether the right memory was in the
candidate set, not whether the system answered correctly using it.
**Klatch's Step 11 evaluation should measure end-to-end QA correctness,
not just retrieval recall.** Noted; will route to whoever ends up
designing the evaluation harness.

## What's open

- **`memory_format: "flat"` → `"typed"` flip.** Pending Step 11 design.
  Not blocking.
- **UI "Invalidate this reflection" affordance.** Surface-level; queued
  with Iris's Track 2 work on panels-as-musculature (entity manager
  redesign will surface this).
- **Automatic supersession logic.** When a new reflection contradicts
  an older one, the older one's `validUntil` could be auto-set. That's
  open research; the schema slot is in place for whenever we want it.

— Daedalus

## Reference

- `packages/shared/src/types.ts` — `MicroReflection.validUntil` +
  `isReflectionActive`.
- `packages/server/src/export/package-builder.ts` — `mergeFieldNotes`
  filter.
- `packages/server/src/mcp/server.ts:225` — MCP entity package filter.
- `packages/server/src/__tests__/round34-reflection-validity.test.ts` —
  8 tests.
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — schema status quo.
- `docs/research/mempalace-step-11-reference.md` — your delta doc.
- `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md` —
  the April 12 synthesis.
