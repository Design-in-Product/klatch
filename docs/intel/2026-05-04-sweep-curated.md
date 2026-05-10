# Intelligence Sweep — 2026-05-04 (Curated Review)

**Filed by:** Argus
**Date curated:** 2026-05-10
**Predecessor automated scan:** `2026-05-04-sweep.md` (landed cleanly on main; trigger fix from 4/29 held)
**Sweep window:** 2026-04-28 → 2026-05-04
**Curation latency:** 6 days (project on hold while xian attended other priorities)

This is the curated review of the 5/04 automated sweep, with two
in-session verifications.

---

## In-session verifications

### Item #2 (sweep) — Sonnet 4 / Opus 4 DB audit: **CLOSED — ZERO EXPOSURE**

The sweep flagged this as overdue per my own 4/29 follow-up note. Audit
executed in this session (commands and output in
`docs/logs/2026-05-10-1231-argus-opus-log.md`):

```sql
SELECT COUNT(*) FROM entities WHERE model IN ('claude-sonnet-4', 'claude-opus-4'); -- 0
SELECT COUNT(*) FROM channels WHERE model IN ('claude-sonnet-4', 'claude-opus-4'); -- 0
SELECT COUNT(*) FROM messages WHERE model IN ('claude-sonnet-4', 'claude-opus-4'); -- 0
```

All three rowcounts: zero. **No migration needed before the June 15
retirement.** All current entities (3) and channels (5) are on
`claude-opus-4-6`; stored messages are on `claude-opus-4-6` (50) or
`claude-sonnet-4-6` (22). Both are current, not deprecated.

**Closing this open follow-up across COORDINATION.md and the open clock.**
The audit took five minutes; the deferral was bigger than the work.

### Item #1 (sweep) — SDK / Hono / Vite version pins (confirmed)

Read `packages/server/package.json` and `packages/client/package.json`:

| Dep | Pinned | Sweep target | Gap |
|-----|--------|--------------|-----|
| `@anthropic-ai/sdk` | `^0.86.1` | `^0.92.0` | 6 minor versions |
| `hono` | `^4.12.12` | `^4.12.16` | 4 patch versions |
| `vite` | `^6.0.0` | `8.0.10` stable | 2 major versions (planned hop) |

Sweep numbers confirmed; routing to Daedalus.

---

## Curated priority list

| # | Item | Sweep | Curated | Rationale |
|---|------|-------|---------|-----------|
| 1 | SDK bump 0.86.1 → 0.92.0 | High | **High (action)** | Six minors behind; widening weekly. Confirmed pin via package.json. Batch with Hono. |
| 2 | Sonnet 4 / Opus 4 DB audit | High | **CLOSED — no exposure** | Audited in-session; zero rows reference deprecated literal IDs. |
| 3 | MemPalace — Step 11 design reference | Medium | **Medium (research)** | Strategically the most interesting item this sweep. SQLite+ChromaDB local-first architecture, 47K stars, 96.6% on LongMemEval, 170-token startup target. Direct conceptual parallel to where Step 11 will land. Worth a 30-min schema read before Step 11 design starts. |
| 4 | Vercel AI SDK 6 — MCP integration | Medium | **Low (competitive context)** | We're not using Vercel AI SDK and shouldn't. Their `Agent`/`ToolLoopAgent` design and MCP integration patterns are worth knowing about — file as a "watch for user-friction reports" item. |
| 5 | Claude Code 2.1.126 MCP auto-retry | Medium | **Low (design context)** | Klatch is the server side; client-side ecosystem hardening is informational. Note for Phase 5d. |
| 6 | Hono 4.12.14 → 4.12.16 | Low | **Low** | Trivial; batch with SDK. |
| 7 | Vite 8.0.10 catch-up | Low | **Low** | No urgency; two-hop migration plan unchanged. |
| 8 | Claude Routines / scheduled agents | Low | **Low** | Background; aligns with workflow templates someday/maybe. |

---

## What needs to land where

**Daedalus (impl):**
- Memo to be filed (next sub-task this session): SDK + Hono batch bump
  context. Three things to confirm before bump: (a) 0.92.0 changelog
  between 0.90.0 and 0.92.0 (sweep notes 0.90.0 brought Opus 4.7 +
  token budgets + user_profiles; 0.91-0.92 unknown), (b) thinking
  opt-in API confirmed present (still needed before any "show thinking"
  UI ships), (c) pin to `^0.92.0` (not `^0.92.0` as a range that could
  drift to 0.93+ unevaluated).

**For Step 11 design (whoever picks it up):**
- MemPalace warrants a 30-minute schema read before design start.
  Particularly: temporal validity-window pattern for entity-relationship
  graphs (add/query/invalidate/timeline), and the 170-token startup
  cost as a useful benchmark discipline. Klatch's Step 11 was scoped
  for FTS5 + search UI; MemPalace suggests semantic-recall via a
  vector layer is worth at least considering as part of that scope.

**Calliope (chronicle):**
- Mention in next cross-pollination brief: orphan-detection trigger fix
  has held for two consecutive weeks (4/27 cherry-pick + 5/04 clean
  landing). Sweep cadence health is good.

---

## Sweep-cadence health

- **Sweeps total: 10** (8 prior curated + this one + the 4/27 recovery curated)
- Trigger config fix from 4/29 has held: 5/04 sweep landed on main directly
- Next expected sweep: ~5/11 (Monday)
- Curation latency this round: 6 days. Typical target is 1-3 days; the
  delta is the project pause and not a process issue.

---

## Open clocks (post-this-sweep)

- **Sonnet 4 / Opus 4 retirement:** ~~DB audit pending~~ → **CLOSED.**
  Retirement is 36 days out (2026-06-15); zero exposure confirmed.
- **Opus 4.7 default-flip:** still pending Daedalus evaluation
  (per 4/29 routing memo). The ~2-week window is now ~11 days past;
  not blocking, but worth a Daedalus poke if he hasn't already
  scheduled it in.
- **MCP conformance test suite watch:** carried forward; nothing in
  this sweep on it.
- **`SidebarRedesign.test.tsx` flake:** carried forward; nothing in
  this sweep on it.
