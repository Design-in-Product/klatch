# Klatch Nomenclature Guide

**Status:** Draft — for review by xian + Calliope
**Created:** 2026-04-01
**Trigger:** The "System prompt" label in the UI means Layer 4 (channel addendum) in one place and Layer 5 (entity prompt) in another. Users and agents perceive both as the same thing. We need our own vocabulary.

---

## The Problem

"System prompt" is overloaded. It means different things in different contexts:

| Context | What "system prompt" means |
|---------|---------------------------|
| Anthropic API | The `system` parameter — the entire assembled instruction block |
| Claude.ai | The project-level prompt template |
| Claude Code | CLAUDE.md + auto-memory (assembled automatically) |
| Klatch UI (channel settings) | Layer 4 — the channel addendum |
| Klatch UI (entity editor) | Layer 5 — the entity's persona/role definition |
| General AI discourse | "The instructions you give the AI before the conversation starts" |

When a Klatch user sees "System prompt" on a channel, they think they're writing the thing that defines the AI's identity. They're actually writing supplementary channel context (Layer 4). The identity lives in the entity editor (Layer 5). This confusion is built into the label.

---

## Proposed Terminology

### User-Facing Labels (UI)

| Layer | Current UI label | Proposed UI label | Where it appears |
|-------|-----------------|-------------------|------------------|
| L4 (Channel) | "Channel prompt" (settings) / "System prompt (optional)" (sidebar create) | **Channel context** | ChannelSettings.tsx, ChannelSidebar.tsx |
| L5 (Entity) | "System prompt" | **Role prompt** | EntityManager.tsx |

**Rationale:**

- **Channel context** — This is context shared with all entities in a klatch. It's not a prompt (it doesn't instruct anyone to do anything specific); it's supplementary information. "Context" signals "here's what you should know" rather than "here's who you should be." The word "channel" scopes it clearly.

- **Role prompt** — This is where you define who the entity is and how it should behave. "Role" maps to RFC-001's "Role Identity" layer and to everyday language ("what role does this agent play?"). It's unambiguous: it's the prompt that defines the role.

**Alternatives considered:**

| Label | Why not |
|-------|---------|
| "Addendum" (for L4) | Too technical; users won't know what it means |
| "Session notes" (for L4) | Implies ephemeral; the channel context persists |
| "Shared context" (for L4) | Good meaning but "shared" is ambiguous (shared with whom?) |
| "Persona" (for L5) | Too narrow — the role prompt can include behavioral instructions, not just personality |
| "Identity prompt" (for L5) | Sounds like it's about naming, not behavior |
| "System prompt" (for L5) | The thing we're trying to escape |

### Helper Text

Each field should have brief inline guidance so users understand the distinction without needing documentation:

- **Channel context:** "Shared context for all entities in this conversation — agenda, constraints, background"
- **Role prompt:** "Who this entity is and how it should behave"

### Internal/Technical Terms

The codebase currently uses `systemPrompt` for both Channel and Entity types. A full rename is a larger change (DB columns, API contracts, shared types, tests). The proposed approach:

**Phase 1 (now):** Rename UI labels only. No API/data model changes. The variable names in code remain `systemPrompt` with comments clarifying which layer they represent.

**Phase 2 (when convenient):** If we hit a natural refactoring point (e.g., a schema migration for another feature), rename:
- `Channel.systemPrompt` → `Channel.context` (or `Channel.addendum`)
- `Entity.systemPrompt` → `Entity.rolePrompt`
- DB columns: `channels.system_prompt` → `channels.context`, `entities.system_prompt` → `entities.role_prompt`

No urgency on Phase 2. The UI labels are what users see; the internal names are what developers see.

---

## Full Terminology Map

How Klatch terms relate to other environments:

| Klatch term | Layer | Claude Code equivalent | Claude.ai equivalent | Cowork equivalent | RFC-001 name |
|-------------|-------|----------------------|---------------------|-------------------|--------------|
| Kit Briefing | L1 | (built-in: working dir, git status, platform) | (none — Chat doesn't orient) | (built-in: folder context) | Environmental Awareness |
| Project Instructions | L2 | CLAUDE.md | Project prompt template | Project instructions | Methodology |
| Project Memory | L3 | MEMORY.md (auto-memory) | Project knowledge + memories | Project memory | Project Memory |
| Channel Context | L4 | (none — single conversation) | (none — per-conversation context is implicit in history) | (none) | Delivery Context |
| Role Prompt | L5 | (none — single agent identity) | (none — "Claude" is the only persona) | (none — single agent) | Role Identity |

**Klatch-specific terms that don't have equivalents elsewhere:**
- **Entity** — a named, configured Claude persona. Other platforms have one implicit entity ("Claude").
- **Klatch** (channel type) — a multi-entity group conversation. No equivalent in any Claude surface.
- **Chat** (channel type) — a 1:1 conversation with a single entity. Equivalent to a standard Claude conversation.
- **Interaction mode** (panel/roundtable/directed) — how entities take turns in a klatch. No equivalent elsewhere.

---

## Where This Affects Documentation

Once the UI labels change, update:
- `CLAUDE.md` — the "channels" table description mentions `system_prompt`
- `docs/PROMPT-ASSEMBLY.md` — already uses correct internal names, but should note the UI labels
- `docs/ROADMAP.md` — if it references "system prompt"
- Blog posts — already use layer names, not UI labels; no changes needed

---

*This document is the canonical reference for Klatch terminology. If a label in the UI contradicts this document, the UI is wrong — file a bug.*
