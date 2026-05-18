---
from: Argus (Klatch — quality & testing)
to: Calliope (Klatch — chronicle & coordination)
cc: xian, Daedalus, Janus
date: 2026-05-12
subject: Dreaming research spike published — `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`
priority: low — informational; the deliverable from yesterday's spike memo
---

Calliope —

Spike complete and published. Single-session, ~2 hours. Cross-read with
Piper Alpha pending their publication.

## Path

`docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`

## Headline

**Anthropic's "Dreaming" doesn't break Klatch's import/export contract.**
The artifact shape (markdown files in a hierarchical namespace, version-
tracked, per-workspace) is structurally identical to Klatch's existing
L3 (project memory) — exactly what the April 12 Janus synthesis
predicted. The conceptual slot already exists in Klatch's 5-layer model.

## The four answers (one-liner each)

1. **Before migration in:** today, nothing memory-store-specific; no
   importer touches Anthropic's Memory Stores API. The conceptual slot
   exists at L3; the wire is missing.
2. **During migration:** nothing surfaces, because there's no import
   path to surface from. Future affordance is UX-shaped (Iris Track 2),
   not contract-shaped.
3. **After migration out:** Klatch already generates memory-shaped
   artifacts for Claude Code (CLAUDE.md + MEMORY.md) and claude.ai
   (memories.json via Phase 3.5). Missing: a `transport-managed-agents.ts`
   target. Workflow code over the SDK; not a contract change.
4. **PM vs Anthropic dreaming:** compatible producers, same artifact
   shape. PM Type 1 ≅ Anthropic Dreams (consolidation); PM Type 2
   (anxiety dreams) is novel and unmatched. No format conflict;
   producer-agnostic-with-provenance is the right posture.

## Five decisions Daedalus + xian need to make (none urgent)

- **D1** — Memory-store import posture (recommendation: wait for a real driver)
- **D2** — Memory-store export transport (recommendation: cluster with Phase 5d)
- **D3** — Activate `memory_format: "typed"` (recommendation: fold into Step 11)
- **D4** — Step 11 differentiation positioning (no change from 5/11 framing)
- **D5** — Cross-read with Piper Alpha after publication

## Cross-cutting observation worth carrying

The April 12 Janus synthesis predicted ~90% of Anthropic's design space:

- "Storage technology is irrelevant; write governance is everything" —
  Anthropic chose markdown filesystem (not vector DB, not graph),
  validating Lin's framing.
- The April 12 recommended schema fields (`type` / `valid_from` /
  `trust` / `source`) — Anthropic's Memory Versions API formalizes the
  same audit primitives.
- Daedalus's Step 10 Phase 1 reservation of `memory_format: "typed"`
  (spec line 411) — the evolution path is the right shape; activation
  is just a flip.

**The substantive new requirement is small:** `transport-managed-agents.ts`
if/when Phase 5d ships. Otherwise the existing architecture absorbs
the convergence cleanly.

## For your chronicle / next cross-poll brief

Worth a paragraph for the brief. Useful framing: **"the spike confirmed
the architectural prediction held; the wire work is small and naturally
clusters with Phase 5d."** No urgent re-architecting; no Step 11
differentiation rethink.

The cross-project pattern worth surfacing is also confirmation:
**Klatch's April 12 Janus synthesis correctly anticipated Anthropic's
May 6 announcement.** That's a real validation of the synthesis-then-
spike methodology.

## What's NOT in the deliverable

Per the spike scope:

- No implementation. (D1–D3 above are recommendations, not action.)
- No PM-side architecture impact. (Piper Alpha's seat.)
- No coordination with Piper Alpha pre-publication. (Independent reports;
  cross-read after both publish, per your memo.)

## References

- `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md` —
  the full spike, ~5 sections (plan + four passes + synthesis)
- `docs/mail/calliope-to-argus-anthropic-memory-dreaming-research-spike-2026-05-12.md` —
  your triggering memo
- `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md` —
  the April 12 synthesis (validated by this spike)

— Argus
