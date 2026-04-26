# Intelligence Sweep #8 — Curated Review + Delta — 2026-04-26

**Filed by:** Argus
**Type:** Curated review of `2026-04-20-sweep.md` (automated) + delta scan for 2026-04-21 → 2026-04-26
**Window:** Aprll 13–26 (covers full 13-day gap since last curated sweep on 4/13)
**Predecessor:** `2026-04-20-sweep.md` (automated, pending Argus review at filing time)

---

## How to read this sweep

The April 20 automated scanner produced a strong report covering April 13–20. Rather than duplicate that work, this sweep does two things:

1. **Curates the 4/20 sweep** — converts each "Items for Argus Review" entry into a tracked decision with current status.
2. **Adds a six-day delta** — focused on what's actually new in the 4/21 → 4/26 window. Single-purpose: don't surprise Daedalus or future-Argus with something that landed during the gap.

---

## Part 1: Curated decisions on the 4/20 review items

| # | Item | 4/20 Priority | Status as of 4/26 | Decision / Owner |
|---|------|---------------|-------------------|------------------|
| 1 | Haiku 3 alias fix shipped before 4/19? | **Urgent** | ✅ **Resolved.** Commit `76bf28f` ("Fix MODEL_ALIASES: correct Haiku 3 and Haiku 3.5 model IDs") landed pre-deadline. `claude-3-haiku-20240307` and `claude-3-5-haiku-20241022` both alias to `claude-haiku-4-5-20251001` in `packages/shared/src/types.ts:15-16`. | Closed. |
| 2 | Sonnet 4 / Opus 4 deprecation audit (June 15 deadline, 50 days from today) | High | ✅ **Aliases already in place.** `packages/shared/src/types.ts:13-14` maps `claude-opus-4-20250514` → `claude-opus-4-6` and `claude-sonnet-4-20250514` → `claude-sonnet-4-6`. **Open task:** DB audit for any channels/entities pinned to the literal deprecated IDs. Low-effort one-shot query before June 15. | Open — file as Round 27 candidate or spike before 6/15. |
| 3 | Evaluate Opus 4.7 as new default | Medium | Open. Same price tier as 4.6. Stronger long-running coding + higher-resolution vision. **Recommendation:** wait one more sweep cycle (community feedback on 4.7 stability) before flipping `DEFAULT_MODEL`. Low cost to flip, easy to roll back. | Defer 1–2 weeks. |
| 4 | SDK bump `^0.86.1` → `^0.90.0` | Medium | Open. Routine maintenance. Worth batching with Vite 8 work or any other dep maintenance to avoid a churn-only commit. | Defer to next dep maintenance window. |
| 5 | Claude Managed Agents — file for Step 10 | Medium | ✅ **Filed.** Pattern noted: beta header `managed-agents-2026-04-01`, $0.08/session-hour, SSE-compatible. Relevant to Step 10 Phase 6+ (export-to-runtime). No action until that phase is scoped. | Closed (filed for future). |
| 6 | Vite 8 migration planning | Medium | Open. Two-hop migration (6→7→8). Not urgent; accumulating debt. Worth a small Iris+Daedalus spike when Phase 5c work finishes or pauses. | Backlog. |
| 7 | Gemma 4 — research validated | Low | ✅ **Closed.** Confirms the local-model adoption plan from 4/3 sweep. No new action. | Closed. |

**Summary:** 1 Urgent resolved (Haiku 3); 2 closed (Managed Agents filing, Gemma 4); 4 open (Sonnet/Opus 4 DB audit, Opus 4.7 default flip, SDK bump, Vite 8). The Sonnet/Opus 4 DB audit is the one thing with a hard deadline — June 15, 50 days from today. Worth a five-minute spike ahead of 6/15 to confirm zero affected channels.

---

## Part 2: Delta scan — 2026-04-21 → 2026-04-26

Focused scan on Anthropic SDK / Claude Code / MCP for the six days since the 4/20 sweep. Nothing else moved fast enough to need surfacing.

### HIGH RELEVANCE

#### D1. Claude Code v2.1.x — hooks can now invoke MCP tools directly

Claude Code's recent April 2026 releases added a new hook type: `type: "mcp_tool"`. Hooks can now invoke MCP tools directly, without shelling through a custom script. Other notable adds: vim visual modes, `/cost` + `/stats` merged into `/usage`, `DISABLE_UPDATES` env var, custom themes, fix for `output_config.effort` causing 400s on subagent calls.

**Klatch impact:** Two threads. (a) The `mcp_tool` hook type tells us how *consumers* of MCP servers want to surface tools — by name, with structured input. Klatch's `get_context_package` / `get_manifest` / `list_channels` are all callable from this surface today. Worth confirming hands-on once Phase 5b is exercised by a real Claude Code session. (b) The `output_config.effort` 400-error fix is notable because Klatch's Round 17 work added the per-entity effort parameter — when we test export-to-Claude-Code, this needs the fixed Claude Code version (≥ the post-fix release).

#### D2. April 16 verbosity prompt regression — reverted April 20

Anthropic added a verbosity-reducing system prompt instruction on April 16 that, in combination with other prompt changes, hurt coding quality. Reverted on April 20.

**Klatch impact:** **AAXT calibration warning.** Any AAXT scoring runs that targeted Claude Code or claude.ai-routed entities during April 16–20 may have produced anomalously low scores due to the upstream prompt regression, not anything in Klatch. We didn't run AAXT during that window (Argus session gap 4/18 → 4/26), so this is preventive — file as a calibration consideration if we ever run a longitudinal AAXT trend over a window that includes April 16–20.

#### D3. MCP enterprise-readiness lane is moving (no spec change)

Anthropic and the MCP project have prioritized conformance test suites, SSO, audit trails into SIEM, and gateway patterns. No new spec version since Nov 2025. AAIF held an MCP Dev Summit NA in NYC (~1,200 attendees, April 2026).

**Klatch impact:** Klatch is single-user local-first, so SSO / SIEM / gateways don't apply to the current scope. **Conformance test suites are the relevant item** — when published, they're a free regression-fence for our MCP server. File a watch on `modelcontextprotocol/conformance` (or wherever Anthropic ships them). For Phase 5d (HTTP + auth, deferred past 1.0), the gateway patterns may inform the design.

### MEDIUM RELEVANCE

#### D4. MCP subagent/SDK server reconfiguration is now parallel

Subagent and SDK MCP server reconfiguration now connects servers in parallel instead of serially. Bug fix: stdio MCP servers no longer get disconnected on the first stray non-JSON line on stdout (regression in Claude Code 2.1.105).

**Klatch impact:** Both items are consumer-side improvements in Claude Code's MCP client. Validates that *Klatch's* MCP server (stdio, JSON-RPC) is on the right side of the protocol contract — we explicitly avoid stray stdout writes per `packages/server/src/mcp/bin.ts` design. No action; positive signal.

### LOW RELEVANCE

#### D5. MCP "first security reckoning" coverage

Trade press (Big Hat Group, week of 4/23) framing recent MCP-adjacent security discussions as the protocol's first security reckoning. No specific Klatch-applicable CVE or advisory surfaced.

**Klatch impact:** Background. Klatch's MCP exposure is stdio (no network surface, no auth), running locally next to a single-user app, so the typical "MCP security" attack surface (remote stdio, untrusted servers, credential harvesting) is mostly absent for us. Worth re-reading carefully before Phase 5d.

---

## Open items rolled forward

| Item | First flagged | Next checkpoint |
|------|---------------|-----------------|
| Sonnet 4 / Opus 4 literal-ID DB audit ahead of 6/15 retirement | 4/20 sweep | Round 27 candidate or standalone spike (≤ 30 min) |
| Opus 4.7 default flip evaluation | 4/20 sweep | Recheck in 2 weeks (community stability signal) |
| SDK bump 0.86.1 → 0.90.0 | 4/20 sweep | Next dep maintenance window |
| Vite 8 migration spike | 4/20 sweep | After Phase 5c finishes or pauses |
| MCP conformance test suite watch | 4/26 (this sweep) | Re-check on next sweep |
| AAXT calibration: April 16–20 verbosity-prompt regression note | 4/26 (this sweep) | Apply if/when running longitudinal AAXT spans that window |

---

## Roll-up for COORDINATION.md

**Test count:** unchanged (1069 / 0).
**Intel sweeps filed:** 8 (7 manual/curated + 1 automated). 4/20 automated sweep now formally reviewed.
**Hard deadline on the radar:** Sonnet 4 / Opus 4 deprecation 2026-06-15 (50 days). Aliases shipped; DB audit pending.
