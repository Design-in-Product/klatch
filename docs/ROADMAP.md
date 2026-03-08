# Roadmap

## North Star

**Klatch is the place where you manage all your Claude interactions.**

Today, working with Claude is fragmented across claude.ai, Claude Code, and raw API calls — each with its own UI, its own data silo, and its own limitations. Klatch replaces that fragmentation with a single local interface where you:

- **Define persistent roles** — each channel is a Claude persona with its own identity, model, and behavior
- **Own your data** — every conversation lives in a SQLite file on your machine
- **Import from anywhere** — bring in Claude Code sessions, claude.ai projects, and other sources
- **Orchestrate multi-voice conversations** — multiple Claude personas collaborating in one channel
- **Organize by project** — group related channels and roles under project umbrellas

The key insight: Claude is not one assistant. It's a cast of characters you direct. Klatch is the stage.

---

## Completed

### Step 1: A conversation that persists ✓
**Dimension: existence.** Can you talk to Claude and have it remember?
- Single channel, streaming Opus responses via SSE, SQLite persistence

### Step 2: Multiple conversations ✓
**Dimension: multiplicity.** Can you have more than one ongoing conversation, each with its own role?
- Channel sidebar, creation with custom system prompts, independent histories

### Step 3: Readable responses ✓
**Dimension: legibility.** Can Claude's responses render properly?
- Markdown, syntax-highlighted code blocks, copy button, formatted text

### Step 4: Conversation control ✓
**Dimension: agency.** Can you shape and steer a conversation, not just append to it?
- Clear channel history, stop generation mid-stream, regenerate last response, delete individual messages
- Two-click confirmation for destructive actions

### Step 5: Channel identity ✓
**Dimension: role definition.** Can you fully configure what each channel *is*?
- Edit channel name, system prompt after creation
- Per-channel model selection (Opus, Sonnet, Haiku)
- Channel settings panel (expandable from header)
- Model change markers in conversation flow
- v0.5.5: Responsive layout (mobile-first, collapsible sidebar drawer)
- v0.5.6: Light/dark theme with semantic color tokens, K-Channel logo, landing page

### Step 6: Multi-entity conversations ✓
**Dimension: conversation structure.** Can more than one Claude persona participate in a conversation?

This is the first step that's impossible in claude.ai or Claude Code. It moves Klatch from "a nicer chat UI" to "something genuinely new."

- Entities with name, model, system prompt, and avatar color
- Assign up to 5 entities per channel; N parallel streams per user message
- Entity-aware streaming: each entity uses its own model/prompt (panel mode)
- Channel system prompt becomes shared preamble prepended to each entity's prompt
- Entity Management UI: create/edit/delete entities, color picker, model selector
- Channel Settings: entity assignment (add/remove pills), no per-channel model selector
- Header shows entity pills with colored dots and model labels
- Backward compatible: single-entity channels look unchanged, old messages render as "Claude"

---

## Next Steps (concrete, actionable)

### Step 7: Interaction modes
**Dimension: orchestration.** Can you control *how* entities interact with each other and with you?

Panel mode already works from Step 6. This step adds the other two modes that make multi-entity channels genuinely useful — especially for coordination and delegation.

- Mode selector in channel settings (panel / roundtable / directed)
- **Roundtable mode**: entities respond sequentially, each seeing all prior responses in the round
- **Directed mode**: @-mention routes a message to a specific entity, with autocomplete
- Mode-specific history construction (panel = isolated, roundtable = shared, directed = selective)

**Near-term target: dogfooding.** After Step 7, we can run the Klatch development project inside Klatch itself — coordinating between multiple Claude agents in a shared channel.

---

## Directional (sequence flexible, shape emerging)

### Step 8: Import and sync
**Dimension: data consolidation.** Can you bring your existing Claude work into Klatch?

- Parse Claude Code JSONL session files (`~/.claude/projects/`)
- Import claude.ai project conversations (via export or API)
- Map imported sessions to Klatch channels with appropriate roles
- This is what makes Klatch the *single pane of glass* for Claude interactions

### Step 9: Files and artifacts
**Dimension: rich context.** Can you share files, code, and documents with entities?

- Upload/attach files to conversations
- Render artifacts (code, documents, images) inline
- Context injection: entities receive file contents as part of their context
- This is where Klatch becomes a workspace, not just a chat tool

### Step 10: Search and recall
**Dimension: memory.** Can you find things across all your conversations?

- Full-text search via SQLite FTS5 across all channels
- Markdown export of conversations
- Command palette (Cmd+K) for quick navigation
- Conversation bookmarks or pinned messages

---

## Vision (far horizon, appropriately vague)

### Multi-project support
Group channels into projects. Switch contexts. Per-project settings and entity configurations. Import sources associated with projects.

### Polish and craft
Keyboard shortcuts, theming, first-run onboarding, loading states, error boundaries. The fit-and-finish that makes a tool feel like *yours*.

### Workflows
Multi-phase orchestration across entities. A workflow defines a sequence of steps where each step's outputs become the next step's inputs — like a routing slip, but one that actually works.

Motivating scenario: a weekly leadership check-in where 6 department heads write memos (panel or roundtable), then a Chief of Staff reviews all memos and synthesizes a report (directed). Today this requires manual multi-channel choreography; workflows would make it a single trigger.

Workflows compose the primitives we already have (panel, roundtable, directed) into repeatable pipelines. They bridge interaction modes (how a single message is routed) with process automation (how a multi-step sequence is orchestrated). Closely related to files/artifacts (Step 9) since workflow outputs are often documents, not just chat messages.

### Sharing and collaboration
Export conversation snapshots. Share channel configurations (role + prompt templates). Community prompt library. Maybe someday: multi-user.

---

## Design Principles

1. **Gall's Law**: Each step is the smallest working increment. Complex systems evolve from simple ones that work.
2. **One dimension per step**: Each step extends exactly one capability. If it touches two dimensions, split it.
3. **Local-first**: All data on your machine. No cloud dependency beyond the API.
4. **Own your data**: SQLite is inspectable, portable, and backed up with your filesystem.
5. **Iterative complexity**: Don't add abstractions until they're needed. Three similar lines > premature helper function.
6. **North star alignment**: Every step must move materially closer to the vision. If it doesn't, it's polish — and polish waits.
