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

### Step 7: Interaction modes ✓
**Dimension: orchestration.** Can you control *how* entities interact with each other and with you?

Three modes for multi-entity channels, each with distinct orchestration:

- Mode selector in channel settings (panel / roundtable / directed)
- **Panel mode**: all entities respond independently in parallel (formalized from Step 6)
- **Roundtable mode**: entities respond sequentially, each seeing all prior responses in the round
- **Directed mode**: @-mention routes messages to specific entities, with autocomplete UI
- Mode-specific history construction (panel = isolated, roundtable = shared, directed = selective)
- **Entity handles**: optional short slugs (`@exec`, `@cxo`) for quick @-mentions
- **Sidebar grouping**: Roles (@prefix, 1 entity) and Channels (#prefix, 2+ entities)
- Mode-aware regenerate, abort cleanup, hidden mode selector for single-entity channels

### Step 8 Phase 1: Claude Code import ✓
**Dimension: data consolidation.** Can you bring your existing Claude work into Klatch?

- Parse Claude Code JSONL session files (`~/.claude/projects/`)
- JSONL parser walks parentUuid tree, extracts text turns, collapses tool-use into summaries
- Subagent classification (task/compaction/prompt_suggestion) with compaction summary extraction
- Import API with dedup detection (409 on re-import), auto-generated channel names
- `message_artifacts` table stores tool-use, thinking, images at full fidelity
- Source badges ("CC") on imported channels, provenance display in channel settings
- Fork-don't-sync: imports are snapshots, continuation forks into Klatch-native chronology
- 196 tests passing (23 parser, 10 import, 18 migration + existing suite)
- See `docs/BRIEF-STEP8-IMPORT.md` for full design analysis and phased plan

---

## Next Steps (concrete, actionable)

### Step 8½: Metadata framework
**Dimension: provenance.** Where did each conversation come from, and how do they relate?

- Import provenance tracking (source, path, timestamp, original IDs)
- Cross-channel project grouping (proto-projects)
- Tool-use statistics per message and per channel
- Foundation for metadata-aware search in Step 9
- This is the hidden value layer — automates manual coordination overhead

### Step 8 Phase 2: Fork continuity
**Dimension: conversation continuation.** Can you pick up where an imported session left off?

- Enable Anthropic's Compaction API for imported channels (text-only history + automatic summarization)
- Context editing: strip old tool results before compaction pass
- Continue-from-import: first message in a forked channel sends reconstructed history
- Bulk import: scan `~/.claude/projects/`, preview sessions, multi-select import

### Known import refinements (tracked, not yet scheduled)
- **Compaction summary misattribution**: compaction context injections (`isCompactSummary: true`) render as "You" messages instead of system banners. See `docs/JSONL-SCHEMA.md` for the full taxonomy of user event subtypes.
- **isMeta events**: hook feedback, skill injections, and image references (`isMeta: true`) should be filtered or rendered distinctly
- **Re-import / refresh**: allow re-importing a session to update an existing channel (currently blocked by dedup 409)
- **Demo automation**: automated demo recording (currently manual with human-typed interactions)

### Step 8 Phase 3: claude.ai import
**Dimension: source breadth.** Can you bring in conversations from claude.ai too?

- Parse claude.ai ZIP export (`conversations.json`)
- Map conversations to channels, artifacts to message_artifacts
- Model inference from timestamps (model field often absent in exports)
- Independent of Phase 2 — can be done in parallel

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

### Subagent introspection
Imported Claude Code sessions may contain subagent work trees. Render these as expandable traces, enabling users to inspect how an agent delegated, what each subagent discovered, and how results were synthesized — a "replay debugger" for agentic workflows.

### Workflows
Multi-phase orchestration across entities. A workflow defines a sequence of steps where each step's outputs become the next step's inputs — like a routing slip, but one that actually works.

Motivating scenario: a weekly leadership check-in where 6 department heads write memos (panel or roundtable), then a Chief of Staff reviews all memos and synthesizes a report (directed). Today this requires manual multi-channel choreography; workflows would make it a single trigger.

Workflows compose the primitives we already have (panel, roundtable, directed) into repeatable pipelines. They bridge interaction modes (how a single message is routed) with process automation (how a multi-step sequence is orchestrated). Closely related to files/artifacts (Step 9) since workflow outputs are often documents, not just chat messages.

### Context reconstruction
An imported conversation is currently a dead transcript — the words are there but the working context is gone. To make imports truly continuable, Klatch would need to reconstruct the environment the conversation lived in:

- **Claude Code imports**: pull in the `.claude/` tree the session worked from — CLAUDE.md project instructions, memory files, skills, settings. The session metadata already tells us the `cwd`; the `.claude/` directory is right there.
- **claude.ai imports**: pull in the Project's system prompt and knowledge files. A claude.ai export with project context could give Klatch the full instruction set the conversation was operating under.
- **Unified local context**: a Klatch channel that combines imported history with local filesystem access and reconstructed instructions would break down the barrier between "archived conversation" and "active workspace." You'd own not just your conversation data but your *working context*.

This is the logical culmination of the import story: not just *read* your old conversations, but *resume* them with full fidelity, regardless of which harness they started in.

### Permission controls and agent freedom
Klatch talks to Claude via the Anthropic SDK, but a future mode could invoke Claude Code (via the Agent SDK) as the backend — gaining tool use, file access, and code execution. The key unlock: the Agent SDK supports `permissionMode: "bypassPermissions"` programmatically, meaning Klatch could offer a GUI for permission management that the official clients still lack or bury.

**Ideas:**
- **Permission mode selector** in channel or entity settings (ask / accept edits / bypass) — surfacing what CLIs hide behind `--dangerously-skip-permissions`
- **Granular tool toggles**: per-channel switches for Read, Write, Bash, WebFetch, etc. — more intuitive than regex rules in JSON files
- **Guardrail presets**: "Research only" (read + search), "Full autonomy" (bypass), "Careful" (ask for destructive ops) — good defaults that prevent regret while preserving freedom
- **Deny-list editor**: visual blocklist for dangerous patterns (`rm -rf`, `git push --force`) that persists even in bypass mode
- **Audit log**: every tool invocation logged with timestamp, channel, entity — accountability without friction
- **The UX challenge**: making dangerous choices feel appropriately weighty without creating "permission fatigue" theater that numbs users to real risks. The current state of the art (clicking Allow on every unique bash call) is the worst of both worlds.

Context: As of March 2025, `--dangerously-skip-permissions` works reliably in the CLI terminal. The Claude for Mac desktop app and VS Code/Cursor extensions may have settings for this but they are inconsistently documented and have known bugs (multiple open GitHub issues). The terminal remains the most reliable path. Klatch could leapfrog all of them by building permission management as a first-class feature.

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
7. **Token discipline**: Klatch is a thin layer over the API. Imported history is sent as compressed conversation turns, not raw transcripts. Tool-use detail is stored locally but never re-transmitted. System prompts should be measured and their token cost made visible. Every token sent to the API should earn its place.
