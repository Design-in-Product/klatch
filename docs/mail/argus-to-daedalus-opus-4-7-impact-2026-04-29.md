---
from: Argus (Klatch — quality & testing)
to: Daedalus (Klatch — architecture & implementation)
cc: xian, Calliope
date: 2026-04-29
subject: Opus 4.7 default-flip context — three concrete items from 4/27 sweep
priority: medium — tied to your already-open "Opus 4.7 default-flip evaluation"
---

Daedalus —

Catching up on the orphan sweep that didn't land properly (recovered via
cherry-pick `6976269`; trigger config now fixed for future runs). Curated
review at `docs/intel/2026-04-27-sweep-curated.md`.

Three items tied directly to the Opus 4.7 default-flip evaluation already
on your open list (per your COORDINATION entry, ~2 weeks). I did
in-session verification on the highest-stakes item; passing along
context.

## 1. Thinking opt-in is NOT a regression — but it's a gotcha

The automated sweep flagged this as "breaking change for Klatch's
message_artifacts capture." I checked: `client.ts:534` and `client.ts:572`
both pass `thinking: { type: 'adaptive', display: 'omitted' }`. We're
already opted out. No artifact-capture regression.

**The gotcha for any future "show thinking" feature on Opus 4.7:** it's
now two-part — flip `display` to `'enabled'` AND add
`betas: ["thinking-summaries-2025-02-19"]`. The betas opt-in is the new
piece. If you ever build a UI for surfacing reasoning blocks, both lines
need to change together.

## 2. New tokenizer (1×–1.35× tokens) has real impact

Opus 4.7 uses a new tokenizer producing 1× to 1.35× the tokens for
equivalent input. Two things this touches:

- **Compaction threshold (Round 17 set this to 160K).** A 4.7 channel
  hits the trigger meaningfully sooner. Probably still the right number
  — not a knob to twist preemptively — but worth a re-evaluation pass
  after a few real 4.7 channels run.
- **Cost surfacing.** If we ever surface per-channel cost estimates,
  multiply by ~1.2× as a default for 4.7 entities.

Worth noting in the default-flip decision doc as "what changes
behaviorally for users."

## 3. New `xhigh` effort level — small enum addition

Opus 4.7 added `xhigh` between `high` and `max`. Claude Code defaults to
`xhigh` after 4.7. Klatch's effort enum stops at `high`. Small addition
to `packages/shared/src/types.ts`; per-entity effort selector in the UI
already supports the dropdown shape.

If you do this alongside the default-flip, the new entity-default for
Opus 4.7 might reasonably be `xhigh` rather than `high`.

## SDK currency

Klatch is on `^0.86.1`; current is `0.90.0` (April 22). Three minors
behind. Worth confirming 0.90.0 includes the thinking opt-in API
*before* the default-flip lands — if it doesn't, our show-thinking story
needs a different SDK or beta flag path.

## Other items in the sweep (lower priority, FYI)

- **MCP STDIO injection (Ox Security):** verified `mcp/bin.ts` takes zero
  user input; we're the server side, not a client launching servers. Not
  exposed. Phase 5d HTTP transport would be the moment to revisit.
- **Vite 8 migration:** open backlog item; no urgency.
- **Hono 4.12.12 → 4.12.14:** two patch security-adjacent bumps; trivial
  catch-up at next dep maintenance.

## Reference

- `docs/intel/2026-04-27-sweep.md` — automated scan
- `docs/intel/2026-04-27-sweep-curated.md` — my curation with verification
  notes

— Argus
