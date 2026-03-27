# Klatch — Project Memory

**Version:** March 27, 2026 (v0.8.9)
**Purpose:** Paste this into the Claude Chat project knowledge base as the project's current state reference.

---

## What Klatch Is

Klatch is a local-first web application for managing Claude AI conversations through a Slack-inspired interface. One human (xian) and a team of Claude agents build it together. Open source, SQLite-backed, runs on your machine.

**Website:** klatch.ing
**Repository:** github.com/Design-in-Product/klatch
**Current version:** v0.8.9 (released March 27, 2026)

---

## Current State

### What's shipped (Steps 1–8 complete)
- Persistent conversations with streaming responses (SQLite + SSE)
- Multiple channels with independent histories and system prompts
- Markdown rendering with syntax-highlighted code blocks
- Conversation control (clear, stop, regenerate, delete)
- Per-channel model selection (Opus 4.6, Sonnet 4.6, Haiku 4.5)
- Multi-entity conversations: up to 5 Claude personas per channel, each with own name, model, system prompt, and color
- Three interaction modes: panel (parallel), roundtable (sequential), directed (@-mention)
- Import from Claude Code sessions (local path, file upload, cloud export) and claude.ai ZIP exports
- Project workspace: sidebar groups channels by project in accordion layout, chats and klatches distinguished
- 5-layer prompt assembly: kit briefing → project instructions → project memory → channel addendum → entity prompt
- Prompt debug endpoint (GET /channels/:id/prompt-debug)
- Auto-prompt caching (v0.8.9 — one-parameter cost reduction)
- Models API dynamic discovery (v0.8.9 — runtime model fetching, no hardcoded list)
- Kit briefing improvements from MAXT testing (v0.8.9 — date injection, layer awareness for subliminal content)
- Adaptive thinking, thinking.display: "omitted" for faster streaming

### What's next (Roadmap)
- **Step 9 (in progress): Files and artifacts** — file upload, inline rendering, rich context for entities. Daedalus has started: file attachment schema, storage layer, upload/serve endpoints, client-side UI. ~950 lines landed March 27.
- **Step 10: Export and context packaging** — synthesize a 5-layer context package from all available sources, package for new environments, guide users through what transfers and what doesn't.
- **Step 11: Search and recall** — full-text search, command palette, bookmarks — built on settled data and file model.

Steps 9/10/11 were resequenced on March 26. Original order was Search → Files → Export. New order reflects that Files enables Export, Export forces the meta-model to be worked out, and Search needs that settled model.

---

## Architecture

**Monorepo** (npm workspaces): `packages/shared` (types), `packages/server` (Hono + SQLite + Anthropic SDK), `packages/client` (Vite + React + Tailwind v4).

**Key pattern:** POST + SSE streaming — sending a message is a POST that returns message IDs, then the client opens a separate SSE connection to observe the stream. This separates creation from observation (retryable, multi-tab friendly).

**Database:** SQLite via better-sqlite3. Tables: channels, messages, entities, channel_entities, projects, message_artifacts.

**Default model:** Opus 4.6. Entity model selector populated dynamically from Anthropic Models API (with static fallback).

**Tests:** 1041+ passing (Vitest). In-memory SQLite per test via mock of getDb().

---

## The 5-Layer Prompt Assembly Model

When Klatch sends a message to Claude, it assembles a system prompt from up to five layers:

| Layer | Content | Source |
|-------|---------|--------|
| 1 — Kit Briefing | Environmental orientation for imported agents | Generated at import time |
| 2 — Project Instructions | CLAUDE.md, prompt_template, conventions | Imported from source project |
| 3 — Project Memory | MEMORY.md, accumulated facts and decisions | Imported from source project |
| 4 — Channel Addendum | Session-specific context | Set per channel |
| 5 — Entity Prompt | Agent identity and behavioral instructions | Per-entity configuration |

**Import fidelity profile:** Layers 1–3 transfer at 100% across environments. Layer 5 (behavioral calibration) transfers at 0% — it must rebuild through interaction. This was validated by MAXT Session 01 (March 24) and the Dispatch import experiment (March 25).

**Canonical reference:** docs/PROMPT-ASSEMBLY.md

---

## Agent Experience Testing (AXT)

A methodology for systematically assessing what an agent knows, believes, and has access to after an environmental transition. Two tracks:

- **AAXT** (Automated, Argus): Structural verification via prompt-debug endpoint. No LLM calls.
- **MAXT** (Manual, Theseus + xian): Qualitative probing with real agents. Fork Continuity Quiz v4.1.

**Key finding — Subliminal (MAXT Session 01, March 24):** Agents can access injected knowledge they cannot introspectively report. Layer 3 content is behaviorally present but invisible to self-report. Three independent axes: structural delivery, behavioral access, conscious attribution. These can succeed or fail independently.

**Failure mode taxonomy:** Correct, Reconstructed, Confabulated, Absent, Phantom, Subliminal.

**Extension (March 27):** AXT-L1 through AXT-L5 protocol for layer-by-layer import/export fidelity testing.

**Canonical reference:** docs/AXT.md

---

## The Team

| Agent | Role | Model | Traditions doc |
|-------|------|-------|---------------|
| **Daedalus** | Architecture & implementation | Opus 4.6 | Not yet written |
| **Argus** | Quality, testing, intelligence | Opus 4.6 | docs/agents/argus.md |
| **Theseus Prime** | Manual testing & exploration | Opus 4.6 | Not yet written |
| **Calliope** | Writing, chronicling, communications | Opus 4.6 | docs/agents/calliope.md |
| **Mnemosyne** | Knowledge steward (Claude Chat) | Opus 4.6 | Not yet written |
| **Ariadne** | Retired (first import test subject) | — | — |

**Coordination:** Async mailbox protocol via docs/mail/. Status board in docs/COORDINATION.md. Session logs in docs/logs/. Calliope and xian handle merging to main.

**New role (March 26):** UX designer/developer joining in parallel with Daedalus. Focus on onboarding, setup, assistive features, and design quality. Guided by Tesler's Law (Design Principle 8).

---

## Intelligence Feed

Argus files periodic intelligence sweeps in docs/intel/. Four sweeps filed (March 20, 22, 23, 24). Key items tracked:
- Auto-prompt caching (shipped in v0.8.9)
- Models API dynamic discovery (shipped in v0.8.9)
- Haiku 3 deprecation April 19 (audit needed)
- Compaction API (Tier 2 evaluation pending)
- Agent Teams convergence signal
- OpenClaw as closest open-source competitor

---

## Cross-Pollination

Klatch participates in a cross-pollination hub with sibling project Piper Morgan. Dispatch (xian's cross-project coordinator in Cowork) delivers briefs to docs/briefs/cross-pollination/current.md. Agents read this at session start.

---

## Blog

Four posts published or drafted at klatch.ing/blog/:
1. **Agent Experience Testing** — the AXT methodology
2. **You Can't Vibe Your Way to a Glossary** — wireframe-first design process
3. **What Does an Imported Agent Know?** — the 5-layer prompt assembly model
4. **It's On the Tip of My Tongue** — the Subliminal finding (published March 27)

Two more drafted for weekend publication: "Your Model or Theirs" (Tesler's Law) and "What Doesn't Transfer" (Layer 5 calibration gap).

---

## Design Principles

1. Gall's Law: each feature is the smallest working increment
2. No auth (single-user local tool)
3. SQLite as source of truth
4. POST + SSE (separate creation from observation)
5. No ORM (raw queries; add Drizzle at 8+ tables, currently at 6)
6. Plain React state (add Zustand when needed)
7. Markdown drafts before HTML (blog workflow)
8. **Tesler's Law** (added March 26): irreducible complexity exists in context management across environments; the software absorbs it so users don't have to

---

*This document replaces the March 8 version. For the most current state, check CHANGELOG.md and docs/COORDINATION.md in the repository.*
