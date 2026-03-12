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

### Step 8: Import & Unify ✓
**Dimension: data consolidation.** Can you bring your existing Claude work into Klatch?

This was the first step that makes Klatch more than a chat UI — it's now a place where existing Claude work migrates to. Three phases plus a metadata layer, each independently valuable.

**Phase 1 — Claude Code import:**
- JSONL parser walks parentUuid tree, extracts text turns, collapses tool-use into summaries
- Subagent classification (task/compaction/prompt_suggestion) with compaction summary extraction
- Import API with dedup detection (409), auto-generated channel names, source badges
- `message_artifacts` table stores tool-use, thinking, images at full fidelity
- Fork-don't-sync: imports are snapshots, continuation forks into Klatch-native chronology

**Phase 2 — Fork continuity:**
- Anthropic Compaction API for imported channels (text-only history + automatic summarization)
- CLAUDE.md context loading, session summary injection
- Continue-from-import: first message in a forked channel sends reconstructed history

**Phase 3 — claude.ai import:**
- ZIP parser for claude.ai data exports (`conversations.json`)
- Conversation-to-channel mapping, artifact extraction
- Reuses Phase 1 import patterns

**Step 8½ — Metadata framework:**
- `getChannelStats()` — message counts, artifact counts, tool breakdown per channel
- `getAllChannelsEnriched()` — enriched channel list with activity metadata
- Sidebar project grouping: imported channels grouped by `cwd` from source metadata
- Stats UI card in channel settings (message count, tool calls, top tools)
- 266 tests passing (260 server + 6 client). See `docs/STEP8-RETROSPECTIVE.md` for full retrospective.

---

## Next Steps (concrete, actionable)

### Step 8¾: Import refinements
**Dimension: continuity fidelity.** Close the gaps that the Theseus/Ariadne fork test revealed.

Manual testing (Theseus Prime + Ariadne) identified four fidelity levels for imported conversations. Narrative knowledge survives well; environmental and instructional knowledge degrades silently. These fixes address the gaps, ordered by impact. See `docs/logs/` for full test findings.

**Core fixes (v0.8.5):**
- **Kit briefing** ✅: On first message to a forked channel, inject orientation context: "You are now continuing in Klatch. You have conversation history but no tool access." Prevents phantom-capability confusion — the single highest-impact fix per Ariadne's report.
- **CLAUDE.md + MEMORY.md capture** ✅: At import time, read `CLAUDE.md` from `cwd` and `MEMORY.md` from `~/.claude/projects/<cwd>/memory/`. Store in `source_metadata`. Inject into system prompt via kit briefing. Restores instructional fidelity that's currently lost on import.
- **Fork marker** ✅: Visual boundary between imported history and new conversation ("Continued in Klatch — Mar 11, 2026"). Makes the transition visible to the human.
- **Compaction summary misattribution** ✅: Verified not a bug — compaction summaries are already filtered by `isHumanTurnBoundary()` and never become messages. Added documentation comment.
- **Re-import**: When importing a session that already exists, offer cancel / overwrite / fork-again instead of hard 409 block. Essential for iterative testing and for sessions that grow over time.

**Additional fixes:**
- **isMeta event filtering**: hook feedback, skill injections, and image references (`isMeta: true`) should be filtered during import or rendered distinctly
- **Import error messaging**: client-side error display for failed imports (currently generic)
- **Copy message turn**: copy button on message bubbles, not just code blocks
- **Selective import browser**: After opening a ZIP or scanning a directory, show a preview of all contents — conversations, knowledge files, projects — and let the user pick what to import. Supports both claude.ai ZIPs (conversations + project docs + memories) and Claude Code session directories. The opposite of bulk-all-or-nothing.
- **Claude Code session browser** (stretch): scan `~/.claude/projects/`, preview sessions, multi-select import

Tracked refinements deferred past 8¾:
- Demo automation (manual recording works for now)
- claude.ai model inference (all imports default to Opus — technically incorrect but low visibility)

**Fidelity framework** (from Theseus/Ariadne testing):
| Level | What it means | Status after 8¾ |
|-------|--------------|-----------------|
| Conversational | Fork can talk about what happened | ✅ Already works |
| Narrative | Fork can explain project and decisions | ✅ Already works |
| Environmental | Fork knows its current capabilities | 🎯 Kit briefing fixes this |
| Instructional | Fork has exact project conventions/rules | 🎯 CLAUDE.md/MEMORY.md capture fixes this |

### Step 9: Search and recall
**Dimension: memory.** Can you find things across all your conversations?

*Promoted from Step 10.* Import created the corpus — dozens or hundreds of sessions with rich metadata. The value of that corpus is directly proportional to your ability to find things in it. Search is the unlock that makes data consolidation actually useful.

Phased delivery:

- **9a: FTS5 full-text search** — SQLite FTS5 index across all messages. The biggest single unlock. Metadata-aware: search can filter by source, project, date range.
- **9b: Search UI** — search bar, results with context snippets and channel attribution, click-to-navigate
- **9c: Command palette (Cmd+K)** — quick navigation to channels, entities, actions. The quality-of-life layer that makes *everything we've built* more accessible.
- **9d: Export** — Markdown and JSON export per-channel and bulk. "Own your data" made tangible. Enables sharing without building sharing infrastructure.
- **9e: Bookmarks** — pin important messages. Lightweight but high retention value.

### Step 10: Files and artifacts
**Dimension: rich context.** Can you share files, code, and documents with entities?

*Deferred from Step 9.* File upload already exists in claude.ai and Claude Code. Klatch's version should be differentiated — tied to multi-entity workflows (all entities review a document) or project context (attach files to a project, available to all channels). Wait for the use case to sharpen.

- Upload/attach files to conversations
- Render artifacts (code, documents, images) inline
- Context injection: entities receive file contents as part of their context
- Multi-entity document review (the differentiating use case)
- This is where Klatch becomes a workspace, not just a chat tool

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
- **claude.ai imports**: pull in the Project's system prompt and knowledge files. A claude.ai export includes `projects.json` (project docs/knowledge), `memories.json` (user memories), and `conversations.json` (chat history). The selective import browser would let users choose which pieces to bring in — just the conversations, just the knowledge files to seed a channel's context, or everything.
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

### Context health
A channel-level indicator showing how much the model "knows" about its current situation — how much history was compacted vs. retained, whether the system prompt has drifted from the original source, whether tool capabilities have changed since import. Makes the invisible context window visible. Related to token discipline (Design Principle 7) but oriented toward the *model's* experience, not just cost. Motivated by the observation that users feel empathy for disoriented agents and want to know when context is thin.

### Sharing and collaboration
Export conversation snapshots. Share channel configurations (role + prompt templates). Community prompt library. Maybe someday: multi-user.

---

## Someday / Maybe

Ideas that are interesting but have no timeline or clear dependency chain yet:

- **Conversation lineage visualization** — show the relationship between an imported session and its Klatch continuation(s), like a git graph for conversations
- **Agent-perspective testing** — ask Claude to self-report on context quality after a fork/continuation, comparing what it knows vs. what it's lost. A form of "model QA" that's unique to continuation-aware systems
- **Semantic identity for continued conversations** — when a conversation continues from import, the new instance may evolve in a different direction. How do we name and honor that divergence? See `docs/DESIGN-NOTES.md` for early thinking.

---

## Design Principles

1. **Gall's Law**: Each step is the smallest working increment. Complex systems evolve from simple ones that work.
2. **One dimension per step**: Each step extends exactly one capability. If it touches two dimensions, split it.
3. **Local-first**: All data on your machine. No cloud dependency beyond the API.
4. **Own your data**: SQLite is inspectable, portable, and backed up with your filesystem.
5. **Iterative complexity**: Don't add abstractions until they're needed. Three similar lines > premature helper function.
6. **North star alignment**: Every step must move materially closer to the vision. If it doesn't, it's polish — and polish waits.
7. **Token discipline**: Klatch is a thin layer over the API. Imported history is sent as compressed conversation turns, not raw transcripts. Tool-use detail is stored locally but never re-transmitted. System prompts should be measured and their token cost made visible. Every token sent to the API should earn its place.
