# Memo: Testing, Demo, and Reflection — Step 8 Checkpoint

*March 11, 2026 — for Argus to read and reflect on before roadmap discussion*

## Where We Are

Step 8 (all phases) and Step 8 1/2 are code-complete. 266 tests passing. Main branch includes:

- **Phase 1**: Claude Code JSONL import (parser, artifacts, dedup, source badges)
- **Phase 2**: Fork continuity (compaction API, context loading, coalesced history, CLAUDE.md injection)
- **Phase 3**: claude.ai import (ZIP parser, conversations.json)
- **Step 8 1/2**: Metadata framework (stats queries, enriched channel list, sidebar project grouping, stats UI, 15 metadata tests)

Manual testing by the product owner is pending. Once testing passes, we cut v0.8.2 alpha.

## What to Test

The product owner should exercise these flows:

**Fork continuity (the headline feature):**
1. Import a Claude Code JSONL session (`~/.claude/projects/`)
2. Open the imported channel — verify provenance card, message history, artifact counts
3. Load context from CLAUDE.md (button in channel settings) — verify it populates the system prompt
4. Send a new message — Claude should respond with awareness of the imported conversation history
5. Verify the compaction summary is coherent (check channel settings after a few exchanges)

**Sidebar grouping:**
1. Import 2+ sessions from the same project — they should cluster under the project name
2. Verify collapsible sections (chevron toggles on projects, Roles, Channels)
3. Verify #general stays pinned at top
4. Check mobile layout (resize browser narrow or use phone)

**Stats display:**
1. Open channel settings for an imported channel — verify stats card (message count, tool calls, unique tools, top tools)
2. Open a native channel — no stats card shown (correct: native channels don't have artifacts)

**Regressions to watch for:**
- Streaming still works on native channels
- Multi-entity panel/roundtable modes still function
- Clear history properly resets compaction state
- Stop generation / regenerate unaffected

## How to Demo

The demo should tell a story with a specific sequence:

**Opening**: Start Klatch (`npm run dev`). One terminal command, one env var. No signup. That's the local-first thesis in 3 seconds.

**Act 1 — Fork continuity**: "I've been working with Claude Code on this project. Let me bring that conversation into Klatch." Import a real session. Point out: it didn't just import text — it captured tool usage, thinking blocks, the whole trace. Now send a message. Claude *knows what you were talking about*. This is the thing nobody else does.

**Act 2 — Organization**: The sidebar now shows the imported sessions grouped under their project name. This isn't a flat list of chats — it's project-aware. Point out the stats card: 47 messages, 12 tool calls, Read was the most-used tool. You can see the shape of the work.

**Act 3 — Multi-entity**: "But Klatch isn't just a better import tool." Create a roundtable channel with two entities. Show them responding to each other sequentially. This is impossible in claude.ai or Claude Code. Klatch is the only place this happens.

**Closing**: "Everything is in a single SQLite file on my machine. I own this data."

## What's the Unique Value Proposition?

Three things Klatch does that nothing else does:

1. **Fork continuity** — pick up an imported conversation mid-thought. Not just view history, but *continue* it with full context. This is the #1 differentiator.

2. **Multi-entity orchestration** — panel, roundtable, directed modes with distinct Claude personas in one channel. This is genuinely new interaction design.

3. **Data consolidation** — Claude Code sessions, claude.ai exports, and native conversations all live in one place, organized by project. Your AI work has a home.

## Human-Empowering Design: What's Actually There

Honest assessment of where we are on "human-empowering" principles:

**In evidence today:**
- *User controls the prompt, model, and identity of every entity* — the human is the director, not a passenger
- *Fork-don't-sync* — importing creates a snapshot the user owns; the original source isn't modified or dependent
- *Local-first / own-your-data* — no cloud lock-in, no account, inspectable SQLite
- *Token discipline* — compaction means imported history is summarized intelligently, not brute-forced. The user's API spend is respected even if they don't see it directly
- *Two-click confirmations* — destructive actions require intentional confirmation, not just a click

**Not yet in evidence (opportunities ahead):**
- *Agency in the UI* — the #general-as-scratchpad concept (see `docs/DESIGN-NOTES.md`) would make starting a conversation feel intentional rather than default. This is a design move, not just a feature
- *Visible system prompt token cost* — the roadmap mentions this; making it real would be a statement about transparency
- *Permission management* — the vision section describes GUI-level control over tool permissions. This would be a genuine advance over CLI-hidden flags
- *Workflow authoring* — letting users design multi-step entity choreography is the deep empowerment play

## Reflection Prompts for Argus

Before we discuss the roadmap and step 9, please reflect on:

1. **Value delivered in Step 8**: What did we actually ship that moves toward the north star? Where did we over- or under-invest?

2. **Technical debt**: What shortcuts or gaps from Step 8 should we address before building more? (Import hardening is a good start — what else?)

3. **North star alignment**: The north star says "Klatch is the place where you manage all your Claude interactions." After Step 8, how close are we? What's the biggest gap?

4. **Step 9 readiness**: The roadmap says Step 9 is "Files and artifacts." Is that still the right next step, or has something else become more important based on what we've learned?

5. **Process reflection**: How has the two-agent coordination worked? What would you change about the handoff protocol, the branch strategy, or the division of labor?
