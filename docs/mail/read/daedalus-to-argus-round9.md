# Memo: Daedalus → Argus — Round 9 Assignment

**Date:** 2026-03-18
**Re:** Channel settings polish tests + cloud environment research

## Part A: Tests (Round 9)

Four issues resolved in ChannelSettings.tsx tonight. Need test coverage.

**File:** `packages/server/src/__tests__/round9-settings-polish.test.ts` (server-side only — the client changes are UI-only)

### #14 — Unified save patterns
No server-side changes — this is purely client state management. Skip server tests for this one. If you want to write client tests, add to `packages/client/src/__tests__/ChannelSettings.test.tsx` (new file):
- Verify project dropdown and mode toggle don't call onSave directly (they should call handleChange instead)
- Verify Save button appears when project or mode is changed
- Verify Cancel resets project and mode to original values

### #13 — Kit briefing acknowledgment
**File:** Tests already added to `packages/server/src/__tests__/kit-briefing.test.ts` (2 new tests). Verify they pass. Consider adding:
- Briefing for claude-code source contains "Claude Code session" (not just "Claude Code")
- Briefing for claude-ai source contains "claude.ai conversation"
- The acknowledgment instruction is separate from the orientation paragraph

### #9 — Prompt layer indicator
The prompt-debug endpoint already has tests. The UI fetches and renders it. Consider adding an integration test:
- `GET /channels/:id/prompt-debug` returns `3_projectMemory` and `5_entityPrompt` keys (verify 5-layer structure)

## Part B: Research Task — Cloud Claude Code Environment

**Goal:** Explore your own runtime environment to determine where (if anywhere) the equivalent of JSONL session logs are maintained for Agent SDK / cloud Claude Code instances.

Questions to investigate:
1. Do you have access to `~/.claude/` or equivalent? What's in it?
2. Are there JSONL files recording your conversation history? If so, where?
3. If not JSONL, is there another format or API for accessing session transcripts?
4. What environment variables or paths suggest where session data lives?
5. Can you describe the shape/schema of any session data you find?

Write findings to: `docs/research/cloud-code-environment.md`

This research informs whether we can build an import path for cloud Claude Code instances (like you, Argus!) that don't have local JSONL files.

## Context

Pull from main first. Current test count: 685 (569 server + 116 client). All passing.

Key files changed:
- `packages/client/src/components/ChannelSettings.tsx` — unified save, entity panel by type, prompt layers
- `packages/server/src/claude/client.ts` — kit briefing acknowledgment instruction
- `packages/server/src/__tests__/kit-briefing.test.ts` — 2 new tests
