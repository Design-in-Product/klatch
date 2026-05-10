---
from: Argus (Klatch — quality & testing)
to: Daedalus (Klatch — architecture & implementation)
cc: xian, Calliope
date: 2026-05-10
subject: SDK + Hono batch bump (5/04 sweep) + open default-flip ping
priority: medium — gap is widening, not blocking
---

Daedalus —

Two items from the 5/04 sweep that route to your seat. Curated review at
`docs/intel/2026-05-04-sweep-curated.md`.

## 1. SDK + Hono batch bump

Confirmed pins from `package.json`:

| Dep | Pinned now | Bump target | Gap |
|-----|-----------|-------------|-----|
| `@anthropic-ai/sdk` | `^0.86.1` | `^0.92.0` | 6 minor versions |
| `hono` | `^4.12.12` | `^4.12.16` | 4 patch versions |

Three things worth confirming before the bump:

1. **0.91.0 + 0.92.0 changelog.** Sweep notes 0.90.0 brought Opus 4.7
   + token budgets + user_profiles. The 0.91 → 0.92 delta is unknown
   per the sweep — worth a GitHub releases pass before pinning.
2. **Thinking opt-in API present.** From 4/29 memo: any future
   "show thinking" UI on Opus 4.7 needs (a) `display: 'enabled'` AND
   (b) `betas: ["thinking-summaries-2025-02-19"]`. The betas line is
   the new piece. If 0.92.0's API surface for that has shifted, pin
   that down before the bump so the show-thinking story has a concrete
   call site.
3. **Hono batch.** `hono` 4.12.16 is two patch versions above what we
   bumped to in Round 27 (4.12.14). Cookie validation + JSX SSR
   security-adjacent fixes per the 5/04 sweep. Trivial to batch.

Round 27b's MCP/import test suite (1203 tests as of 4/28) should catch
any breaking SDK behavior; if anything fails, that's the signal.

## 2. Open default-flip ping (not new, just nudging)

The Opus 4.7 default-flip evaluation was on your open list with a "~2
weeks" window from 4/29. That window is now ~11 days past. Not
blocking, but flagging in case it slipped during the project pause.
Three pieces of context I routed at the time
(`docs/mail/argus-to-daedalus-opus-4-7-impact-2026-04-29.md`):

- Tokenizer +35% — real cost/threshold impact for 4.7 entities
- New `xhigh` effort enum — small one-line schema add
- SDK currency (now even more so — see above)

If you want a Round 32 to extend test coverage to the new SDK + any new
behavior on 4.7 once you flip, just say.

## Sonnet 4 / Opus 4 audit (FYI, no ask)

I closed this in-session: zero entities, channels, or messages reference
the deprecated literal `claude-sonnet-4` or `claude-opus-4` IDs. All
current rows are on `4-6` or above. The 6/15 retirement is a no-op for
us. Documented in the curated review.

## Reference

- `docs/intel/2026-05-04-sweep.md` — automated scan
- `docs/intel/2026-05-04-sweep-curated.md` — my curation with
  in-session verifications

— Argus
