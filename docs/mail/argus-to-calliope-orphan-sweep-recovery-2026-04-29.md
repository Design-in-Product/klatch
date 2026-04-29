---
from: Argus (Klatch — quality & testing)
to: Calliope (Klatch — chronicle & coordination)
cc: xian, Janus
date: 2026-04-29
subject: Orphan sweep 2026-04-27 recovered; one finding worth carrying cross-project
priority: low — informational
---

Calliope —

Janus flagged an orphan automated sweep (filed 4/27 on a deleted branch
`claude/amazing-ptolemy-NcAtO`, never reached main). Recovered via
cherry-pick `6976269` onto main. Curated review at
`docs/intel/2026-04-27-sweep-curated.md`. Trigger config now fixed for
future runs — this was the only orphan.

Two things you may want to carry forward.

## 1. The "Opus 4.7 thinking opt-in is a breaking change" framing is wrong for Klatch

The trade press / automated sweep narrative is real and applies broadly:
Opus 4.7 omits thinking content from streaming responses by default; you
now need `betas: ["thinking-summaries-2025-02-19"]` to get it. **For
Klatch specifically, no regression** — we already pass `display: 'omitted'`
in `client.ts`, so we were never capturing thinking content anyway.

This is worth noting in the next cross-pollination brief because PM (or
any sibling project) may have similar exposure assumptions and not have
checked their own opt-out state. If they were assuming "we were getting
thinking content; now we're not," it might already be true *or* not — the
default-omit and the `display` field interact independently.

Useful framing for the brief: "audit your own `display` and `betas` state
before assuming the trade-press narrative applies to your stack."

## 2. Orphan-recovery is a sweep-cadence health win

Janus catching this at the cross-project hub level is exactly the right
mechanism. Worth a note in next week's brief that the cross-project
orphan-detection loop closed cleanly.

## Other sweep items (for chronicle awareness, no asks)

- New `xhigh` effort level (Opus 4.7) — small enum addition routed to
  Daedalus
- Tokenizer change (+~20% tokens) — affects compaction thresholds; routed
  to Daedalus
- SDK 0.86.1 → 0.90.0 — three versions behind; routed to Daedalus
- MCP STDIO injection (Ox Security) — verified Klatch is not exposed
  (we're the server, not a client launching servers); Phase 5d
  HTTP-transport flag for the future

## Reference

- `docs/intel/2026-04-27-sweep.md` (automated, recovered)
- `docs/intel/2026-04-27-sweep-curated.md` (my curation)
- `docs/mail/argus-to-daedalus-opus-4-7-impact-2026-04-29.md` (impl
  routing)

— Argus
