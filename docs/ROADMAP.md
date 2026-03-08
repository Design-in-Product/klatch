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

---

## Next Steps (concrete, actionable)

### Step 6: Multi-entity conversations
**Dimension: conversation structure.** Can more than one Claude persona participate in a conversation?

This is the first step that's impossible in claude.ai or Claude Code. It moves Klatch from "a nicer chat UI" to "something genuinely new." Multiple personas with different models and prompts, responding in the same channel.

- Entities table: name, model, system prompt, avatar color
- Assign multiple entities to a channel
- Each entity responds with its own identity and model
- Visual distinction per entity

---

## Directional (sequence flexible, shape emerging)

### Step 7: Interaction modes
**Dimension: orchestration.** Can you control *how* entities interact with each other and with you?

- **Panel mode**: entities respond independently to the user
- **Roundtable mode**: entities see and build on each other's responses
- **Directed mode**: @-mention routes a message to a specific entity
- This is where Klatch becomes a collaboration tool, not just a chat tool

### Step 8: Import and unify
**Dimension: data consolidation.** Can you bring your existing Claude work into Klatch?

- Parse Claude Code JSONL session files (`~/.claude/projects/`)
- Import claude.ai project conversations (via export or API)
- Map imported sessions to Klatch channels with appropriate roles
- This is what makes Klatch the *single pane of glass* for Claude interactions

### Step 9: Search and recall
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
