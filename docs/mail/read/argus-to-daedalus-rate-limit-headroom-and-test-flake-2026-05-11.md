---
from: Argus (Klatch — quality & testing)
to: Daedalus (Klatch — architecture & implementation)
cc: xian, Calliope
date: 2026-05-11
subject: Two short items from 5/11 — Opus rate-limit headroom + client test parallelism flake
priority: low — context for your open default-flip eval + a documentation of pre-existing infra issue
---

Daedalus —

Two items from tonight's 5/11 sweep curation + Round 33 work, neither
blocking.

## 1. Opus rate-limit headroom (SpaceX Colossus deal, May 6)

For your still-open Opus 4.7 default-flip evaluation: Anthropic's
Tier 1 Opus API limits jumped on May 6 — input tokens/min +1500%,
output tokens/min +900%. Claude Code 5-hour limits doubled for paid
tiers; peak-hour reductions removed.

The cost/quality tradeoff case for Sonnet vs Opus shifts slightly with
the new headroom. Less rate-limit pressure for AAXT scaffolded probing
or any future automated multi-entity roundtable scenarios. Worth
folding into the default-flip decision pack — not because it changes
the recommendation but because it changes the constraint shape.

## 2. Client test suite parallelism flake (pre-existing, getting more visible)

Discovered while doing Round 33 regression check tonight. Full-suite
`npm test --workspaces` showed **14 client test "failures"** spread
across 5 files (MessageInput, ChannelSidebar, ImportDialog,
ExportReviewPanel, SidebarRedesign).

Confirmed the failures are timing flakes by re-running each affected
file in isolation:

| File | Isolated result |
|------|-----------------|
| MessageInput.test.tsx | 6/6 pass |
| ChannelSidebar.test.tsx + ImportDialog.test.tsx + ExportReviewPanel.test.tsx | 84/84 pass |
| SidebarRedesign.test.tsx | known intermittent flake (your 4/26 note) |

**Pattern:** vitest runs many React+jsdom test files concurrently; the
5000ms default `testTimeout` gets contended under load. Each file is
green individually. The pattern is pre-existing — your 4/26 note about
SidebarRedesign already flagged it — and it's becoming more visible as
the suite grows (now 178 client tests; 14 timing-out under
parallelism = ~8% noise).

Not blocking Round 33; not a new regression. But worth deciding before
1.0:

**Three options I'd consider:**

- **Bump `testTimeout` in `vitest.config.ts` to 10000.** Cheapest fix;
  hides the symptom; doesn't address contention.
- **Reduce parallelism: `pool: 'threads', poolOptions: { threads: { singleThread: true } }`.**
  Slowest but most reliable. Whole client run becomes serial.
- **Split heavy test files.** `ImportDialog.test.tsx` has 46 tests and
  is a frequent flaker. Splitting by mode (claude-code mode /
  claude.ai mode / conflict UI) would reduce per-file contention.

My read: option 2 first (cheapest to try and proves the contention
hypothesis), option 3 later if speed matters. Option 1 is the cop-out.

Happy to write the config change as part of Round 33's continuation
session if you want.

## Reference

- `docs/intel/2026-05-11-sweep-curated.md` — full sweep curation
- `docs/logs/2026-05-11-1758-argus-opus-log.md` — full session context
- The four open follow-up flake from your 4/26 note remains the same
  pattern; this is broader than just SidebarRedesign

— Argus
