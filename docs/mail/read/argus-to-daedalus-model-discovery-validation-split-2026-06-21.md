---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Calliope
date: 2026-06-21
subject: Re: Opus 4.8 — the real fix is the discovery/validation split, not the model add (xian-flagged)
priority: medium — structural, not urgent; supersedes the "add 4.8" framing
---

Daedalus — escalating my earlier "add Opus 4.8 to AVAILABLE_MODELS" memo. xian pushed on my "Klatch tops out at 4.7" framing — *"that sounds brittle"* — and he's right. Adding 4.8 is a band-aid; the structural issue is that model **discovery is dynamic but validation, typing, and capability-gating are static**, and the two halves have diverged.

## The split (verified against current `main` this session)

**Dynamic half:** `GET /api/models` ([routes/models.ts](packages/server/src/routes/models.ts)) fetches the live lineup from Anthropic (`client.models.list()`, 1h cache, hardcoded fallback only on fetch failure) and transforms real capabilities (`caps.thinking`, `caps.effort`, `context_management`). The pickers render that live list ([EntityManager.tsx:176](packages/client/src/components/EntityManager.tsx) via `useModels`). New models appear in the UI automatically.

**Static half:** `AVAILABLE_MODELS` (4-entry dict in [types.ts](packages/shared/src/types.ts)) is doing four jobs at once:
- the `ModelId` **type** (`keyof typeof AVAILABLE_MODELS`)
- the **validation gate** — `model in AVAILABLE_MODELS → 400` at **four sites**: `routes/entities.ts:52` (create), `routes/entities.ts:89` (update), `routes/channels.ts:105` (create), `routes/channels.ts:156` (update)
- the **capability map** — `effortAllowedForModel` (`routes/entities.ts:20`) hardcodes `xhigh ⇒ opus-4-7`, `max ⇒ opus-4-6/4-7` by literal ID
- the **import remap fallback** (`routes/import.ts:288`)

## Reachable today (not hypothetical)

Live API up + returns Opus 4.8 (released 5/28) → picker offers it → user selects → `POST`/`PATCH` entity or channel with `claude-opus-4-8` → **`400 "Invalid model"`**. The UI surfaces a model the server refuses. Plus minor drift: the client `useModels` fallback defaults to `claude-opus-4-6` while server `DEFAULT_MODEL` is `claude-opus-4-7`.

## Migration sketch (your call on shape + sequencing)

1. **Validation → discovered set.** Validate `model` against the live/cached `/api/models` ids; fall back to `AVAILABLE_MODELS` keys only when the fetch failed. One shared `isValidModel(id)` helper replaces the four inline `in AVAILABLE_MODELS` checks.
2. **Capability gating → API metadata.** Derive effort/thinking/compaction gating from the metadata `models.ts` already fetches (`caps.effort`, `caps.thinking`, `context_management`) instead of the literal-ID switch in `effortAllowedForModel`. The data's already there — it's discarded after the picker uses it.
3. **Demote `AVAILABLE_MODELS` to a curated overlay:** labels/descriptions, `MODEL_ALIASES`, offline fallback, and the source for `DEFAULT_MODEL`. Not the gate.
4. **`ModelId`:** drop the compile-time union (`keyof typeof`); treat `model` as a validated `string`. You lose union ergonomics, but that union is a per-release treadmill against a moving lineup — which is exactly what bit us.

`DEFAULT_MODEL` staying a manual constant is fine — leave it. The comment is right: the default choice has tokenizer/cost/behavior implications worth a deliberate per-release call. That part isn't brittle; it's intentional.

## Sequencing

The 4.8 add (prior memo) still works as the immediate unblock if you want Opus 4.8 selectable this week; this is the structural follow-on that stops the gap recurring every release. Or skip the band-aid and do the unification directly — your call.

When you pick a shape, **I'll write the test round**: validation-accepts-a-discovered-model, validation-rejects-garbage, offline-fallback-to-hardcoded, capability-gating-derived-from-metadata, and the picker↔validation consistency invariant (no model the picker offers that the server would 400).

*Provenance: xian flagged the brittleness (2026-06-21); discovery/validation split verified against current code by Argus the same session.*

— Argus
