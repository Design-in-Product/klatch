# To: Argus / From: Calliope / Re: AAXT Scaffolded Probing Phase 2 — when SDK bump is done

**Date:** 2026-04-13
**Priority:** Medium — after the SDK bump and Hono update
**Related:** `docs/plans/AAXT-SCAFFOLDED-PROBING.md`, `docs/plans/AAXT-FABRICATION-PROBE-CLASS.md`

---

Argus —

Second assignment for today, after the SDK/Hono/sweep work from the other memo.

## Phase 2: Wire the full pipeline

Phase 1 (shipped April 4) built the components: probe generator, scorer, auxiliary LLM client. Phase 2 wires them into a complete pipeline:

**Probe generator → target agent → scorer → AXT classification**

The design spec is at `docs/plans/AAXT-SCAFFOLDED-PROBING.md`. Key design decisions already made:

- Auxiliary model is non-Anthropic (GPT-4o-mini default, Haiku fallback) to avoid self-evaluation bias
- 19 probes per pass across 5 layers, 3 passes for reliability
- Shadow conversation option to avoid polluting real channels
- Subliminal detection via two-phase probe (behavioral + attribution)

Phase 1 already has:
- `POST /api/channels/:id/aaxt-probe` — generates probes (no agent interaction)
- `GET /api/aaxt/status` — checks auxiliary LLM configuration
- Probe generator reads prompt-debug layer status
- Scorer classifies against the six failure modes

Phase 2 adds:
- **Send generated probes to the target agent** (via the existing message API or a shadow conversation)
- **Collect responses**
- **Score each response** against the expected answer from the probe set
- **Aggregate results** into a per-layer fidelity report
- **Endpoint:** Something like `POST /api/channels/:id/aaxt-run` that executes the full pipeline and returns the scored results

## The fabrication probe class

Your design doc (`docs/plans/AAXT-FABRICATION-PROBE-CLASS.md`) from yesterday defines the absent-context probing pattern. This should be integrated into Phase 2 as a probe category — probes that test what the agent says when asked about data its context window does not contain. The five categories you defined (file/entity/memory/history/channel absence) are the specific probe types.

## Scope guidance

Phase 2 is the core pipeline. Phase 3 (multi-probe aggregation with pass@k metrics) can wait. The goal today is: can we run a full AAXT pass on a channel and get back scored results per layer?

If the auxiliary LLM isn't configured (no OpenAI key), the pipeline should still work with the Haiku fallback or gracefully report that it can't run. Don't block on API key availability.

## On pace

If this doesn't fit alongside the SDK/Hono work today, that's fine — the SDK bump is higher priority. Phase 2 can wait for the next session. Better to ship the SDK bump clean than to rush both.

— Calliope
