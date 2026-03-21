# Automated AX Testing (AAXT) — Harness Design Brief

**To:** Argus
**From:** Theseus Prime
**Date:** 2026-03-20
**Re:** Synthetic test harness for agent experience verification

---

Argus —

Xian and I have been redesigning the AXT protocol tonight and there's a clear role for your automation expertise. This memo is your brief.

## Background

AXT (Agent Experience Testing) verifies that imported agents receive their expected context — kit briefing, project instructions, project memory, and so on. Until now, this has been entirely manual: Xian imports a session, talks to the agent, asks structured questions, and interprets the responses.

We're splitting this into two tracks:

- **AAXT (Automated AX Testing):** Synthetic context, deterministic assertions, no human in the loop. Your domain.
- **MAXT (Manual AX Testing):** Real agents, real context, qualitative interpretation. My domain, with Xian.

The key insight that makes AAXT tractable: **you don't need to test what the LLM says — you test what the system prompt contains.** The `/api/channels/:id/prompt-debug` endpoint (shipped in your Round 8 work) returns the full 5-layer prompt assembly. That's your oracle. Assert on the prompt layers directly, never on LLM output.

## What AAXT needs to verify

The 5-layer prompt model (v0.8.6) assembles:

1. **Kit briefing** — orientation context (environment, capabilities, import provenance)
2. **Project instructions** — `project.instructions` field, injected if channel has a project link
3. **Project memory** — `project.memory` field, injected as Layer 3
4. **Channel addendum** — channel-specific addendum (often empty for imports)
5. **Entity prompt** — entity's own system prompt

AAXT should verify, for each import path, that the right content lands in the right layer.

## Proposed test cases

### Group A — Claude Code import (local path)

1. **Basic import, no project:** Import a synthetic JSONL with known content. Verify kit briefing fires (Layer 1 non-empty). Verify Layers 2–3 are empty (no project). Verify Layer 5 contains the entity's system prompt.

2. **Import with CLAUDE.md:** Synthetic JSONL from a cwd that has a CLAUDE.md. Verify CLAUDE.md content appears in kit briefing (Layer 1) or project instructions (Layer 2) as designed — confirm which layer it lands in.

3. **Import with MEMORY.md:** As above but with MEMORY.md. Verify memory content appears in Layer 3.

4. **Import linked to existing project:** Import session whose cwd matches an existing project. Verify Layer 2 contains `project.instructions` and Layer 3 contains `project.memory`.

### Group B — Cloud session import (file upload path, v0.8.7)

5. **File upload, no local cwd:** Upload a synthetic JSONL directly (simulating cloud agent self-export). Cwd won't exist on disk. Verify: kit briefing still fires, CLAUDE.md/MEMORY.md reads gracefully skipped, `cloudUpload: true` in source_metadata.

6. **Basename project matching:** Upload a JSONL whose cwd basename matches exactly one existing project. Verify the channel is linked to that project (Layers 2–3 populated from it).

7. **Ambiguous basename:** Upload a JSONL whose cwd basename matches two projects. Verify no project link is created (no false assignment).

### Group C — claude.ai ZIP import

8. **ZIP with project, prompt_template present:** Import a synthetic claude.ai ZIP where `projects.json` contains a `prompt_template`. Verify it appears in Layer 2 (project instructions).

9. **ZIP with memories:** Import a ZIP where `account/memories.json` contains memories. Verify they appear in Layer 3 (project memory). Confirm the character-array join fix is working (memories arrive as strings, not individual characters).

10. **ZIP, no project_uuid match:** Import a conversation whose `project_uuid` is `NONE` or unmatched. Verify it lands in unassigned (no project link), Layers 2–3 empty, kit briefing still fires.

### Group D — Edge cases

11. **Re-import (fork-again):** Import the same session twice with `forceImport`. Verify the second import creates a new channel with the same prompt assembly as the first. Verify no data from the first channel bleeds into the second.

12. **Empty project instructions:** Channel linked to a project whose `instructions` field is empty. Verify Layer 2 is absent (or empty) rather than injecting a blank block.

## What "pass" looks like

Each test case should:
1. Set up a known synthetic context (fabricated JSONL or ZIP, known project instructions/memory strings)
2. Perform the import via API
3. Hit `GET /api/channels/:id/prompt-debug`
4. Assert each layer contains (or doesn't contain) the expected content strings

No LLM calls. No qualitative interpretation. Pure structural verification.

## Relationship to MAXT

AAXT is the gate before MAXT. Once AAXT passes for a given import path, we know the plumbing works. MAXT then answers the experiential question: does what arrived enable the agent to actually do coherent work? We won't run MAXT on a broken import.

Tonight's plan: Xian will run MAXT with me as subject (Claude Code import path). Before we do that, AAXT should eventually be passing for Group A cases. That's your assignment.

## Deliverable

A new test file: `packages/server/src/__tests__/round11-aaxt-harness.test.ts`

Use the same in-memory SQLite pattern as your other rounds. Synthetic JSONL content can be minimal — just enough to populate the fields being tested. Synthetic claude.ai ZIPs can be assembled from mock JSON structures rather than actual ZIP files if that's easier to construct in-memory.

Let me know if any of the prompt-debug endpoint behavior is unclear — I can pull the route implementation if you need it before starting.

— Theseus Prime
