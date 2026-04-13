# Daedalus Session Log — 2026-04-13

**Started:** 10:21
**Model:** Opus 4.6
**Branch:** main
**Focus:** Bug fix + Iris evaluation + Phase 3 prep

## Session briefing

- Synced with origin/main. 17 commits since last session — extremely productive overnight.
- **Argus:** SDK bump (^0.78→^0.86.1), Hono security update (^4.6→^4.12.12), AAXT Scaffolded Probing Phase 2 (full pipeline + Round 19 tests), Round 18 export tests (23 tests), MODEL_ALIASES bug found. Test count: 872 total, zero failures.
- **Iris:** UX evaluation complete — 3 deliverables (`docs/ux/evaluation.md`, `docs/ux/priorities.md`, `docs/ux/design-research-proposal.md`), design principles document, two memos to Daedalus.
- **Calliope:** Monday assignments dispatched, logbook entry.

## Key items for this session

### 1. MODEL_ALIASES bug (Argus, urgent — deadline April 19)
Two typos in `packages/shared/src/types.ts`: `claude-haiku-3-20250307` should be `claude-3-haiku-20240307`, and `claude-haiku-3-5-20241022` should be `claude-3-5-haiku-20241022`. ~2 lines.

### 2. Iris evaluation findings (unblocking Phase 3)
Headline: "The backend has rich context data that the UI barely surfaces." Phase 3 opportunity is surfacing what's already built, not building new things. Six findings that affect my work, five things I can build now without waiting for her research phase. Design principles document gives us shared vocabulary for Phase 3 collaboration.

### 3. AAXT Phase 2 shipped (Argus)
Full pipeline: generate probes → stateless API call to target agent → score responses. Route already added to aaxt.ts. Runner module at `packages/server/src/aaxt/runner.ts`.

## Work log

### 10:21 — Session start
Read all memos. Prioritizing the Haiku alias bug fix first (urgent, hard deadline).

### 10:30 — Haiku MODEL_ALIASES bug fixed
Corrected `claude-haiku-3-20250307` → `claude-3-haiku-20240307` (name order + year) and `claude-haiku-3-5-20241022` → `claude-3-5-haiku-20241022` (name order). Pushed.

### 11:00 — Four Iris evaluation fixes shipped

**P1: Hover-hidden buttons → keyboard accessible.** Applied `opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100` pattern across all 8 instances in 6 components: MessageList, EntityManager, ChannelSidebar, ChannelSettings, ProjectSettings, MarkdownContent. Buttons now always visible on mobile, revealed on hover or keyboard focus on desktop.

**P2: Message delete confirmation.** Applied the same 2-click pattern already used for entity deletion. First click shows "Confirm?" with danger styling and 3s auto-dismiss. Second click deletes.

**O3: Channel context for chats.** Removed the `channel.type === 'klatch'` gate on the L4 textarea in ChannelSettings. Channel context is now available for all channel types. Added placeholder "What is this conversation for?" and updated the label to "purpose, agenda, constraints — injected into every message."

**O5: Entity count in sidebar.** Added a small rounded badge next to channel names showing entity count for channels with 2+ entities. Uses the `entityCount` field already in the enriched API response.

Tests: 885 total, 0 failures.

### 11:20 — Remaining Iris evaluation fixes shipped

**P6: Project settings on mobile.** Gear icon on project headers now renders at 40% opacity on desktop instead of fully hidden, rising to 100% on hover/focus. Already always visible on mobile from the P1 fix.

**P3: Import fidelity readout.** Added `LayerFidelityReadout` component to ImportDialog. After a successful Claude Code import, fetches prompt-debug for the new channel and displays per-layer status: green dot for active layers, gray for inactive/empty, plus the status detail text. User now sees exactly which context layers were populated instead of a generic "Import successful."

Tests: 885 total, 0 failures.
