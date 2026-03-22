# Klatch Prompt Assembly Model

**Version:** 1.0
**Status:** Primary reference document
**Introduced:** v0.8.5 (kit briefing), v0.8.6 (full 5-layer model)
**Last updated:** 2026-03-21

---

## Overview

When Klatch sends a message to Claude, it assembles a system prompt from up to five distinct layers. Each layer carries a different kind of knowledge. The layers are ordered from most general (project-wide orientation) to most specific (individual entity identity).

This model was developed iteratively through Agent Experience Testing (AXT) — specifically the Theseus/Ariadne fork continuity tests of March 2026, which revealed that imported agents suffered from silent context loss across four fidelity dimensions. The 5-layer model is the architectural response to those findings.

**The diagnostic endpoint:**
```
GET /api/channels/:id/prompt-debug
```
Returns the full assembled prompt with layer-by-layer status (`ACTIVE` / `INACTIVE` / `EMPTY`) and metadata. Used by the AAXT test harness (no LLM calls — pure structural verification).

---

## The Five Layers

### Layer 1 — Kit Briefing

**What it is:** Orientation context injected at the top of every system prompt for imported channels. Tells the agent where it is, what tools it has (and doesn't have), and how it arrived here.

**Why it exists:** The Ariadne test (March 2026, v0.8.4) discovered that imported agents suffered "silent capability loss" — they believed they had tools they didn't have, because their original session involved tool use and nothing in the new context corrected that belief. The kit briefing is the correction.

**Contents:**
- Environment declaration: "You are operating inside Klatch, a conversation-only interface. You do not have file access, bash execution, or other tool capabilities."
- Import provenance: where the session came from (Claude Code local path, file upload, claude.ai ZIP), when it was imported
- Fork marker: the boundary between imported history and the new conversation
- CLAUDE.md content (for Claude Code imports where the source cwd is accessible)

**Applied to:** All imported/forked channels. Native channels (created directly in Klatch, not imported) receive a simplified variant or none.

**Layer 1 is always present for imported channels.** If it's absent, the import pipeline has a bug.

---

### Layer 2 — Project Instructions

**What it is:** The instructions field from the channel's associated project. Project-level guidance that applies to all conversations within that project.

**Why it exists:** Claude Code sessions live inside a project context (the `cwd` where `.claude/` and `CLAUDE.md` reside). When that session is imported, the project's instructions should travel with it. Without this layer, an agent knows what it did in the past (from history) but not what conventions or rules governed its behavior.

**Sources by import type:**
- **Claude Code import (local path):** CLAUDE.md content, captured at import time from the session's `cwd`
- **claude.ai ZIP import:** `prompt_template` from `projects.json` in the export (discovered by Hermes in March 2026 testing)
- **Native Klatch project:** whatever instructions field the project was created with

**Applied to:** Channels linked to a project. Channels without a project association have Layer 2 absent (INACTIVE).

**Note:** The `prompt_template` in claude.ai's `projects.json` is the equivalent of CLAUDE.md in the claude.ai ecosystem — the project's system prompt that shapes all conversations within it. Its presence in the export format is what makes project-aware claude.ai imports meaningful.

---

### Layer 3 — Project Memory

**What it is:** The memory field from the channel's associated project. Accumulated factual context — things that are true about the project that agents should know.

**Why it exists:** Distinct from instructions (Layer 2) in an important way: instructions are *behavioral* ("always format responses as X," "prioritize Y"), while memory is *factual* ("the current version is 0.8.8," "the team has five agents," "the primary database is SQLite"). Both travel with the project, but keeping them separate allows each to be updated independently.

**Sources by import type:**
- **Claude Code import (local path):** MEMORY.md content from the session's `cwd`
- **claude.ai ZIP import:** `account/memories.json` from the export (with character-array join fix — raw memories arrive as character arrays in some export versions and must be joined before injection)
- **Native Klatch project:** whatever memory field the project was created with

**Applied to:** Channels linked to a project. Channels without a project association have Layer 3 absent (INACTIVE).

**The character-array bug:** Some claude.ai export versions encode the memories array as individual characters rather than complete strings. Klatch's import pipeline detects and joins these before injection. If you see memories as single-character fragments, this fix has failed.

---

### Layer 4 — Channel Addendum

**What it is:** Channel-specific context that supplements the project-level layers. Applies only to this channel, not other channels in the same project.

**Why it exists:** Projects are shared context; channels are individual conversations. Sometimes a specific channel needs additional framing — a particular focus, a constraint, a reminder about the conversation's purpose — that shouldn't apply project-wide.

**Applied to:** Any channel with a non-empty addendum field. Often empty for imported channels (the history itself provides the channel-specific context). More commonly used in native Klatch channels where the creator adds supplementary guidance beyond the entity's base prompt.

**Note:** Layer 4 is the most underutilized layer in current practice. Its value increases as workflows become more sophisticated — for example, a roundtable channel might use Layer 4 to set the agenda for this particular session, while Layers 1–3 carry the stable project context.

---

### Layer 5 — Entity Prompt

**What it is:** The system prompt of the specific entity participating in this channel. The entity's identity, role, persona, and behavioral instructions.

**Why it exists:** Klatch's fundamental primitive is the entity — a named, configured Claude persona. The entity prompt is what makes Daedalus "Daedalus" rather than a generic Claude instance. In a multi-entity channel (Klatch mode), each entity's Layer 5 is distinct; the layers above (1–4) are shared preamble.

**Applied to:** Every channel with assigned entities. Single-entity channels have one Layer 5; multi-entity channels (Klatch mode, up to 5 entities) have one Layer 5 per entity, assembled independently per entity per request.

**Relationship to traditions documents:** `docs/agents/` contains per-agent traditions documents (calliope.md, argus.md, etc.) that serve as the *durable source of truth* for what belongs in each agent's Layer 5. The entity prompt in the database should be a pointer to or summary of the traditions document: "Your full traditions document is at docs/agents/NAME.md — read it at session start."

---

## Assembly Order and Concatenation

The five layers are assembled in order (1 → 5) with clear demarcation between sections. The assembled prompt is what gets sent to the Anthropic API as the `system` parameter.

```
[Layer 1: Kit Briefing]
---
[Layer 2: Project Instructions]
---
[Layer 3: Project Memory]
---
[Layer 4: Channel Addendum]
---
[Layer 5: Entity Prompt]
```

Empty or inactive layers are omitted from the concatenation (not included as blank sections).

**Inspection:**
```bash
curl http://localhost:3001/api/channels/{CHANNEL_ID}/prompt-debug | jq .
```

Returns:
```json
{
  "layers": {
    "kitBriefing": "ACTIVE",
    "projectInstructions": "ACTIVE",
    "projectMemory": "INACTIVE",
    "channelAddendum": "EMPTY",
    "entityPrompt": "ACTIVE"
  },
  "assembledPrompt": "...",
  "channelSource": "claude_code",
  "projectId": "...",
  "projectName": "..."
}
```

---

## Layer Presence by Channel Type

| Channel type | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Layer 5 |
|---|---|---|---|---|---|
| Native chat (no project) | — | — | — | optional | ✓ |
| Native chat (with project) | — | ✓ | ✓ | optional | ✓ |
| Native klatch (with project) | — | ✓ | ✓ | optional | ✓ per entity |
| Claude Code import (no project match) | ✓ | — | — | — | ✓ |
| Claude Code import (project matched) | ✓ | ✓ | ✓ | — | ✓ |
| File upload import | ✓ | if matched | if matched | — | ✓ |
| claude.ai ZIP import | ✓ | ✓ (prompt_template) | ✓ (memories) | — | ✓ |

---

## Fidelity Dimensions

The 5-layer model was designed to address four fidelity dimensions identified in AXT testing:

| Dimension | What it means | Layer that carries it |
|---|---|---|
| **Conversational** | Agent can discuss what happened in the conversation | History (not a prompt layer) |
| **Narrative** | Agent can explain the project and its decisions | Layer 2 + history |
| **Environmental** | Agent knows its current capabilities and environment | Layer 1 |
| **Instructional** | Agent has exact project conventions and rules | Layer 2 + Layer 5 |

Before v0.8.5, only the conversational dimension was reliably preserved. The kit briefing (Layer 1) fixed environmental fidelity; project context injection (Layers 2–3) fixed instructional fidelity.

---

## Design Rationale

**Why five layers, not one system prompt?**
A single monolithic system prompt is hard to maintain and hard to debug. The layer model makes each concern explicit, separately updateable, and independently inspectable. When something is wrong with an imported agent's behavior, you can look at each layer independently and identify the gap.

**Why is the entity prompt last (Layer 5)?**
The entity prompt should be the most specific and the most "inner" voice. The layers above it are context; Layer 5 is identity. The entity reads the world through the context established by Layers 1–4 and then speaks from its own character.

**Why is kit briefing first (Layer 1)?**
The most critical reorientation information should come earliest in the prompt, before any other framing can establish incorrect assumptions. The first thing an imported agent should encounter is "here's where you are and what you can do" — not a project brief that might make it think it's still in its original environment.

**Token discipline:** Each layer should justify its token cost. Layer 1 (kit briefing) is kept concise — orientation, not autobiography. Layers 2–3 (project instructions and memory) are injected as-written from source files; keep those files focused. Layer 4 is optional; don't add it unless it earns its place. Layer 5 is the entity prompt — scope it to role identity, not project knowledge that already lives in Layer 2.

---

## Relationship to Other Documents

- **`docs/AXT.md`** — the methodology for testing agent experience across context transitions; the 5-layer model is its primary subject
- **`docs/fork-continuity-quiz.md`** — the instrument for manually testing an agent's context retention; v4 is structured around the 5-layer model
- **`docs/agents/*.md`** — traditions documents; Layer 5 content for each agent
- **`packages/server/src/claude/client.ts`** — the implementation that assembles and sends the prompt
- **`packages/server/src/routes/messages.ts`** — where per-entity prompt assembly happens for multi-entity channels
- **`packages/server/src/__tests__/round11-aaxt-harness.test.ts`** — automated tests verifying layer assembly for all import paths

---

*This document is the canonical reference for the 5-layer prompt assembly model. If you find a description of the model elsewhere that contradicts this document, this document wins — update the other source to point here.*
