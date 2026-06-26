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

### Step 8¾: Import refinements ✓
**Dimension: continuity fidelity.** Close the gaps that the Theseus/Ariadne fork test revealed.

Manual testing (Theseus Prime + Ariadne) identified four fidelity levels for imported conversations. Narrative knowledge survives well; environmental and instructional knowledge degrades silently. These fixes address the gaps. See `docs/logs/` for full test findings.

**Core fixes (v0.8.5):**
- **Kit briefing** ✅: Orientation context injected into system prompt for imported channels. 0% phantom tool rate confirmed by Theseus testing.
- **CLAUDE.md + MEMORY.md capture** ✅: Project context files captured at import time, injected via 4-layer system prompt assembly.
- **Fork marker** ✅: Visual boundary between imported history and new conversation.
- **Compaction summary misattribution** ✅: Verified not a bug — documented.
- **Re-branching** ✅: Already-imported conversations selectable for re-import with visual states and forceImport flag.

**Additional fixes delivered:**
- **Project context injection (8¾a)** ✅: First-class `projects` table, auto-creation from claude.ai projects.json and Claude Code cwd, project API.
- **Selective import browser** ✅: Preview conversations, projects, and memories before import.
- **Claude Code session browser (8¾d)** ✅: Scan `~/.claude/projects/`, preview sessions, multi-select import.
- **Model detection gaps (8¾e)** ✅: Documented limitation, accepted — default to channel model.
- **memories.json char array fix** ✅: Detects and joins character arrays in project memories.

**Fidelity framework** (from Theseus/Ariadne testing):
| Level | What it means | Status |
|-------|--------------|--------|
| Conversational | Fork can talk about what happened | ✅ Works |
| Narrative | Fork can explain project and decisions | ✅ Works |
| Environmental | Fork knows its current capabilities | ✅ Kit briefing fixes this |
| Instructional | Fork has exact project conventions/rules | ✅ Project context injection fixes this |

- 493 tests passing (388 server + 105 client). GitHub issue #5 closed.

Tracked refinements deferred past 8¾:
- Demo automation (manual recording works for now)
- claude.ai model inference (all imports default to Opus — technically incorrect but low visibility)
- isMeta event filtering
- Import error messaging improvements
- Copy message turn button

### Step 9: Files and artifacts ✓
**Dimension: rich context.** Can you share files, code, and documents with entities?

Shipped across multiple sub-steps and a five-phase File Domain Model. Files become first-class with scope-aware references and structured context injection at Layers 3 and 4. The Klatch differentiator: files don't just attach to messages — they're placed at the altitude where they do the most good (project knowledge base, channel-pinned, message attachment) and the AI encounters them at the right scope without manual context juggling.

**Step 9a–d (Files & artifacts foundation):**
- File upload/attach with multipart endpoint, MIME detection, attachment cards in messages
- Artifact rendering inline in messages
- Kit briefing file awareness in Layer 1
- Code block save as files with smart filename detection
- `save_file` tool for entity-initiated file creation

**File Domain Model (Phases 1–5):**
- New `files` and `file_refs` tables with scope-aware references; backfill from `message_artifacts`
- Channel file pinning with **Layer 4 context injection** ("Channel files available: ...")
- Project knowledge base with **Layer 3 context injection** ("Project knowledge base files: ...")
- Dual-write completion across all file creation paths
- File promotion (message → channel → project), idempotent, additive

**Infrastructure shipped alongside:**
- Per-entity effort parameter with model-aware defaults (Sonnet → medium, others → high)
- Compaction threshold tuned 80K → 160K (research-backed for 1M-context models)
- AAXT Scaffolded Probing Phase 1 (probe generator, scorer, auxiliary LLM client)
- Nomenclature rename: "System prompt" → "Channel context" (L4) and "Role prompt" (L5)

**Phases 6–7 (memory-as-file, entity library) deferred** to Steps 10 and 11 where they deliver more user value alongside export and search.

849 tests passing (710 server + 139 client), zero failures.

Shipped as **v0.9.0 — Rich Context: Files and artifacts** on April 10, 2026.

---

## Next Steps (concrete, actionable)

### Sidebar navigation & organization
**Dimension: wayfinding.** Can you find and manage your channels without drowning in a flat list?

Motivated by real usage: after importing 49 conversations plus native channels, the sidebar becomes an unnavigable wall of text. The current flat list with project grouping was fine at 10 channels but breaks down at 50+. This is both a usability fix and a design question about how Klatch scales.

**Sorting & recency:**
- Most recently active channel floats to top of its group (live, no refresh needed)
- Secondary sort: pinned/favorites, then alphabetical
- Activity indicator (unread dot or timestamp) so you can see which channels have new content

**Organization tools:**
- Collapse/expand project groups (persist state)
- Archive channels — hide from sidebar without deleting (recoverable)
- Pin/favorite channels to keep them visible regardless of group
- Drag-to-reorder within groups (manual override of sort)

**Scroll & visibility:**
- Sticky group headers so project names stay visible while scrolling through their channels
- "Jump to..." quick filter (type to filter sidebar, lighter than Cmd+K)
- Ensure native/active channels don't scroll off-screen when imported groups are expanded

**Design explorations (captured thinking, not committed plans):**

**Possible approach: project spaces.**
Instead of one sidebar with groups, treat each project as a separate *space* you switch between — like Slack workspaces or Arc's spaces. A project switcher (top of sidebar, or a separate rail) scopes the entire view to one project's channels and entities. This would:
- Eliminate the "one long list" problem entirely — you only see channels for the current project
- Give each project its own visual identity and context
- Make "All" or "Ungrouped" a space too, for native channels without a project
- Align with the existing data model: projects are already first-class (8¾a), channels have `project_id` FKs

The key design tension: spaces hide channels from other projects, which is good for focus but bad for cross-project awareness. A "Recent across all projects" view or notification badges per space could bridge this. The sorting/organization features above still apply within each space.

**Possible evolution: project home page.**
When you switch to a project space, the default view isn't a channel — it's a project home that shows:
- AI-generated status summary ("Here's what happened since you were last here" across all channels in this project)
- Direct links to the most recently active channels
- Project-level stats (total conversations, last activity, entity roster)
- Quick actions (new channel, import, search within project)

This turns the project from a sidebar filter into a first-class destination — more like a GitHub repo landing page than a Slack workspace. The AI summary is the differentiator: no other tool synthesizes your recent Claude interactions into a coherent status update.

**Entity model: project-native, forkable.**
Entities are created within (or imported into) a project and retain that association — they belong to their home project. But an entity can be *forked* into another project, creating an independent copy that can diverge (different prompt, different model) while retaining lineage back to the original. This mirrors the fork-don't-sync pattern already established for imported conversations. A generalist entity like Hermes (research) might get forked across multiple projects, each fork evolving to fit its new context.

**Design questions to resolve:**
- Spaces vs. groups vs. hybrid (collapsible groups with a "focus mode" that expands to full space)?
- Should project groups be collapsible by default when there are many?
- Should there be a separate "Archive" section or just a toggle to show/hide archived?
- How does this interact with Step 9c (Cmd+K command palette)?

### Step 10: Export and context packaging
**Dimension: roundtrip + meta-model.** Can a Klatch conversation continue in another environment with maximum fidelity?

Import brought conversations *into* Klatch. Export sends them *back out*. But this step is more than writing a file — it forces us to work out the meta-model: how do we synthesize a complete 5-layer context package from all available sources (Claude Code session, claude.ai project, Cowork folder) and hand it off cleanly to a new environment?

The March 2026 Dispatch report documented this challenge empirically: Layers 1–3 transfer with 100% fidelity; Layer 5 (behavioral calibration) transfers at 0% and must be rebuilt. Our job is to make that reality navigable — assembling what *can* be packaged automatically, explaining to the user what needs to be added manually, and generating pointers to what couldn't be carried. Tesler's Law: we grapple with the complexity; the user doesn't have to.

**Export to Claude Code:**
- Assemble a 5-layer context package from Klatch channel + project data
- Reverse kit briefing: "You've been working in Klatch (conversation-only) but you're back in Claude Code now. You have full tool access again."
- Compacted conversation history; project context (instructions + memory) carried forward
- Graceful acknowledgment of Layer 5 calibration gap: explicit behavioral notes surfaced for the user to carry or encode in MEMORY.md
- Use the Claude Agent SDK to seed a new Code session with the assembled package

**Meta-model synthesis:**
- Establish the canonical cross-environment import/export representation (mapping all three Claude project types onto the 5-layer model)
- Handle cases where layers are missing: prompt user to fill gaps, generate sensible defaults, or document the absence explicitly
- Import fidelity by layer: make visible what was assembled, what was inferred, and what couldn't be recovered
- The interface guides the user through context packaging the way a moving company guides a homeowner through what can and can't be shipped — no expertise required

**Open questions:**
- Can the Agent SDK launch a session with pre-seeded conversation history?
- What's the right compaction strategy for export (full history vs. summary + recent)?
- Should export create a branch (preserving Klatch original) or move the conversation?
- How does the user understand and act on a Layer 5 calibration gap?

### Beta milestone — composition gesture complete → release cut

**Target: July 2026.** When the composition gesture (current active work) is fully implemented, tested, and QA'd, we cut the next release — v0.9 or v1.0.

The plumbing for composition was ready before Iris's UX design phase. Her Phase 3 spec (completed June 2026) was the critical path to beta — not more infrastructure, not more feature steps, but real design work that made the core feature worthy of a release. The composition gesture is the 1.0 front-door: the thing that makes Klatch a multi-entity conversation tool rather than a single-agent one.

**Composition gesture increment status (as of June 2026):**
- Increment 1: Spine — New Chat / New Klatch affordance, atomic roster, Purpose label ✅ (merged)
- Increments 2–5: Picker polish + default project + cross-reference — Iris-reviewed ✅ (on `claude/daedalus`, awaiting merge)
- Increment 6: Clone existing klatch (next to build, after merge)
- Increments 7+: Paths B/C (JIT import + new agent in picker), @mention autocomplete (to come)

**After beta:** Step 11 (Search) is the next major step. Not a beta requirement.

---

### Step 11: Search and recall
**Dimension: memory.** Can you find things across all your conversations?

*Deferred from Step 9.* Search belongs after file infrastructure (Step 9) and the meta-model work (Step 10) because it needs to understand the full shape of Klatch data to be genuinely useful. Full-text search that doesn't understand project structure, context layers, or file types returns undifferentiated results. Once we know what a Klatch "document" fully is — conversation turn, file attachment, project memory, layer content — search becomes powerful.

Phased delivery:

- **11a: FTS5 full-text search** — SQLite FTS5 index across all messages. The biggest single unlock. Metadata-aware: search can filter by source, project, date range, layer content.
- **11b: Search UI** — search bar, results with context snippets and channel attribution, click-to-navigate
- **11c: Command palette (Cmd+K)** — quick navigation to channels, entities, actions. The quality-of-life layer that makes *everything we've built* more accessible.
- **11d: Export** — Markdown and JSON export per-channel and bulk. "Own your data" made tangible. Enables sharing without building sharing infrastructure.
- **11e: Bookmarks** — pin important messages. Lightweight but high retention value.

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

- **Provenance tracking for ideas across a synthesis workflow** — when a synthesis agent (e.g., Chief of Staff) sees a theme converge across multiple inputs, it currently can't tell whether the convergence is genuine independent agreement or cross-pollination from a single upstream source (often the human PM having mentioned the idea to multiple recipients during the week). The result is a kind of attribution blindness: agents express wonderment at "remarkable convergence" that's actually one idea fanned out through several channels. A provenance layer could trace ideas to their earliest mention in project history and surface that to the synthesizer — "this theme appeared in 3 of 6 memos but xian first mentioned it on Tuesday in the PPM channel." Related to the AXT subliminal injection finding (agent uses information whose source it cannot attribute) but generalized: not just "where did this content come from?" but "what is the causal source of this pattern?" Useful for any structured multi-source synthesis workflow. Surfaced during Iris's interview with xian, April 11, 2026.

- **Klatch as universal context transport (and MCP service)** — The 5-layer prompt assembly model is a portable protocol for moving agent context across environment boundaries. Given a conversation from anywhere — Claude Code, claude.ai, any system — Klatch can: (1) extract what's there, (2) identify and assemble what's missing (kit briefing, project instructions, memory, entity prompt), and (3) export a fully assembled context package ready for injection into any target environment. This is context laundering in the best sense: partial, environment-specific context goes in; clean, standards-compliant, portable context comes out. A claude.ai Project conversation that migrates to Claude Code loses nothing; a Klatch-assembled context package carries all five layers intact. Other people's environments — lacking kit briefing, project memory, entity prompts — can benefit from Klatch assembly even if they never run a Klatch roundtable.

  The MCP surface makes this programmatic: expose Klatch as an MCP server and any MCP-compatible client (Claude Code, a custom agent, another Klatch instance) can request a fully assembled context package on demand. "Give me the assembled context for this channel" becomes a single tool call — no human choreography, no copy-pasting prompts across sessions.

  The "export to anything" extension: rather than building environment-specific export paths one by one (Klatch→Code, Klatch→claude.ai), define a standard context package format and publish a reference skill or adapter for each target. The community contributes connectors for LangChain, AutoGen, CrewAI, Cursor, etc. Klatch becomes the standard library for agent context portability, not just a Klatch-specific feature. The Piper Morgan orchestration layer could trigger a Weekly Ship roundtable via MCP and receive a structured summary — all without opening a browser.

- **Alternative skins on the same API bridge** — Klatch's real value is the routing, persistence, and project organization layer underneath. The UI is one expression of that layer. A developer-focused skin (closer to a terminal/editor hybrid, oriented toward Claude Code workflows) or a domain-specific skin (for product teams, researchers, etc.) could sit on the same infrastructure. Klatch would be the reference implementation; the architecture would be the platform.

- **Standing workflow templates** — named, repeatable multi-step processes built from Klatch's existing primitives. Motivating examples from the Piper Morgan project: a daily omnibus log synthesis (gather session logs from multiple agents → Docs role synthesizes → file committed) and a weekly ship (six leadership roles write parallel memos → Chief of Staff synthesizes → published document). Today these require manual choreography across multiple conversations; templates would make them single-trigger. This is a more concrete restatement of the Workflows vision item above, grounded in actual use cases.

- **Clode** — a Claude.ai-like GUI designed specifically for Claude Code workflows: project file browsing, tool-use visualization, permission management, session history. Not a replacement for Klatch but a different skin for a different primary audience (developers working in Claude Code rather than conversation-centric workflows). The name is a placeholder; the idea is that once the API bridge is solid, different UX expressions become cheap to build.

- **Dynamic UI** — the far horizon of the skins idea: a system that generates and evolves its own interface based on the user's working patterns and explicit preferences, with smart defaults and templates as guardrails. Closer to a research idea than a product plan, but worth naming as the logical terminus of the "skins on a shared bridge" concept.

- **Cross-vendor entity channels** — The one thing no major AI vendor will ever build: a channel where a Gemini CFO, a Claude architect, and a GPT-4 designer participate in the same roundtable. Klatch's entity model currently maps entity→Anthropic model→API call; making it pluggable (entity→vendor→API client) enables any combination of models from any provider in a single channel. The 5-layer system prompt is already model-agnostic — system prompts work across all major LLMs. The structural work is a pluggable API client layer and streaming normalization across providers.

  This is the clearest structural moat Klatch has against the lapping scenario: even if Anthropic ships persistent multi-agent chat with workflows, they will not let you add a Gemini entity. The moat gets stronger as model differentiation increases — the more each model excels at distinct tasks (reasoning, speed, cost, domain depth), the more valuable cross-vendor composition becomes. A roundtable of specialists from competing vendors, convened by the user in a single conversation, is a capability that structural incentives prevent any single vendor from replicating.

  This is also the answer to the pivot question: if Anthropic closes the gap on persistence and orchestration before Klatch ships those features, the cross-vendor pivot is immediately available. The entity model and the 5-layer context system are already the foundation.

---

## Design Principles

1. **Gall's Law**: Each step is the smallest working increment. Complex systems evolve from simple ones that work.
2. **One dimension per step**: Each step extends exactly one capability. If it touches two dimensions, split it.
3. **Local-first**: All data on your machine. No cloud dependency beyond the API.
4. **Own your data**: SQLite is inspectable, portable, and backed up with your filesystem.
5. **Iterative complexity**: Don't add abstractions until they're needed. Three similar lines > premature helper function.
6. **North star alignment**: Every step must move materially closer to the vision. If it doesn't, it's polish — and polish waits.
7. **Token discipline**: Klatch is a thin layer over the API. Imported history is sent as compressed conversation turns, not raw transcripts. Tool-use detail is stored locally but never re-transmitted. System prompts should be measured and their token cost made visible. Every token sent to the API should earn its place.
8. **Tesler's Law**: There is an irreducible complexity in managing context across environments, models, and sessions. That complexity exists and cannot be eliminated — only relocated. Klatch grapples with it so the people (and agents) using the software don't have to. The interface simplifies; the model doesn't hide.

---

## Team

**Daedalus** (architecture & implementation) — back-end plumbing, surfaced as UI when needed. Primary driver of the feature roadmap.

**Argus** (quality & testing) — test infrastructure, intelligence sweeps, AXT automation. Runs parallel to Daedalus.

**Theseus** (manual testing & exploration) — MAXT sessions, exploratory testing, qualitative assessment. Works in tandem with xian.

**Calliope** (writing & chronicling) — documentation, logbook, blog, coordination, strategic synthesis.

**Mnemosyne** (memory & documentation) — knowledge base health, documentation drift, cross-session continuity.

**Incoming: UX designer/developer role** — parallel to Daedalus, focused on importing, setup, assistive, and onboarding UX; cleaning up sloppy or generic UI choices. The team's first dedicated design voice. The complexity of cross-environment context management (5-layer model, cross-vendor roundtables, multi-environment bridging) needs design attention to be accessible — Tesler's Law in practice.
