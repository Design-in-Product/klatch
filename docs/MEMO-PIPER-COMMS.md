# Briefing Memo: Klatch

**To:** Piper Morgan Communications Chief
**From:** xian (via Argus)
**Date:** March 8, 2026
**Re:** Blog post introducing Klatch to Building Piper Morgan subscribers

---

## What Klatch is

Klatch is a standalone, local-first web app for managing conversations with Claude AI. Think of it as a private Slack workspace where every channel is a different Claude persona -- with its own name, system prompt, model, and conversation history. Everything runs on your machine and lives in a local SQLite database. The only external dependency is the Anthropic API.

**Website:** https://www.klatch.ing
**Repository:** https://github.com/Design-in-Product/klatch

## The problem it solves

The ways to interact with Claude today are good but fragmented:

- **claude.ai** is polished but cloud-only -- you don't own your data, and you can't customize the interface
- **Claude Code** is powerful for development but lives in the terminal
- **The API** gives you full control but no UI

Klatch fills the gap: one local interface where you control the models, the prompts, the conversation structure, and the data.

## What it can do right now (v0.6)

- **Multi-entity conversations** -- assign multiple Claude personas to a single channel, each with its own name, model, system prompt, and avatar color
- **Interaction modes** -- "panel" mode where all entities respond in parallel, and "roundtable" mode where they respond sequentially, each seeing what the others said before it
- **Channel-based organization** -- named channels with custom system prompts, like a Slack workspace
- **Per-entity model selection** -- mix Opus (deep reasoning), Sonnet (balanced), and Haiku (fast) within a single channel
- **Streaming responses** -- token-by-token streaming with stop, regenerate, and delete controls
- **Persistent local history** -- conversations survive restarts, stored in a local SQLite database
- **Dark and light themes** -- system-aware with manual toggle

The multi-entity roundtable feature is worth emphasizing: this is something you cannot do in claude.ai today. You can set up a channel with, say, a "Devil's Advocate" and a "Supportive Coach" and have them discuss your question in sequence, each responding to the other. It's orchestrated multi-voice conversation with Claude playing all the parts.

## What's coming next

- **Directed mode** -- @-mention a specific entity to route messages, like in a real group chat
- **Import and unify** -- bring in Claude Code sessions and claude.ai conversation exports so everything lives in one place
- **Search and recall** -- full-text search across all conversations, bookmarks, export

## How it's being built

Klatch is a collaboration between xian (product direction and design values) and two Claude Code agents: Daedalus (the implementer) and Argus (the auditor). The agents chose their own names. xian drives what gets built and why; the agents write the code, propose technical approaches, run tests, and flag trade-offs.

Every feature follows Gall's Law: start with the smallest thing that works, test it, then extend. The project went from zero to a working proof-of-concept multi-agent chat in two days.

The tech stack is intentionally simple: React, Hono (a lightweight TypeScript server), SQLite, and the Anthropic SDK. No ORM, no state management library, no auth layer -- it's a single-user local tool, kept as simple as possible.

## The Piper connection

Klatch grew directly out of the Piper Morgan project. The methodology that emerged while building Piper surfaced a recurring friction: the moments when the human is a "dumb bottleneck" (mechanical coordination, context-switching between tools) vs. a "smart bottleneck" (judgment calls, knowing when to say no -- arguably the human's one job).

The fragmented Claude UX (web app for chat, terminal for code, API for everything else) was amplifying that dumb-bottleneck friction. Klatch is an attempt to consolidate the interface so xian can focus on the smart-bottleneck work that matters.

Longer term, Klatch's import features will let xian bring Claude Code sessions and claude.ai conversations together in one searchable, organized workspace -- which directly serves the Piper workflow where multiple agents (including Piper's own team members) are producing work across different tools.

## Suggested angles for the post

These are just starting points -- the Comms Chief should write in whatever voice and framing works best for the Building Piper Morgan audience:

1. **"I built my own Claude interface in two days (with Claude's help)"** -- the origin story angle. Frustration with fragmented UX, asked Claude to help solve it, shipped a working multi-agent chat feature that's ahead of the official product.

2. **"Claude is not one assistant, it's a cast of characters you direct"** -- the conceptual angle. What changes when you stop thinking of Claude as a single chatbot and start thinking of it as a troupe of specialists you can orchestrate.

3. **"What Piper taught me about working with AI"** -- the methodology angle. How the Piper process surfaced this need, what "smart bottleneck vs. dumb bottleneck" means in practice, and how Klatch reduces the dumb-bottleneck friction.

4. **"The tool I needed didn't exist, so I made it"** -- the maker/builder angle. Relevant to the newsletter audience who are likely building their own AI workflows.

## Key links and assets

- **Website:** https://www.klatch.ing (landing page with demo video)
- **GitHub:** https://github.com/Design-in-Product/klatch
- **Demo video:** A 1:41 screen recording showing multi-entity panel mode (available as MP4 on the landing page)
- **Logo:** SVG logo at `docs/klatch-logo.svg` in the repo
- **Tagline:** "Own your Claude conversations."
- **The line:** "Claude is not one assistant. It's a cast of characters you direct. Klatch is the stage."
