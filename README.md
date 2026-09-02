<p align="center">
  <img src="docs/klatch-logo.svg" alt="Klatch" width="80" height="80" />
</p>

<p align="center"><strong>Klatch — a local-first interface for multi-agent Claude conversations.</strong></p>

---

Klatch is a workspace for the Claude conversations you've already been having. Bring multiple agents into the same room, choose how they work together, and run them on the same problem. Every conversation, every agent, every file stays on your machine. You own the data.

**Version 1.0** ships the composition gesture — the complete surface for assembling and running multi-agent conversations. [Release notes](docs/releases/RELEASE-NOTES-1.0.md) · [Blog](https://klatch.ing/blog/bringing-conversations-into-a-room.html)

## What's in 1.0

**The composition gesture** — new in 1.0:

- **Agent picker** — compose a klatch's roster from agents you've already worked with; type-ahead search, selected-agent chips, roles surfaced first
- **Interaction modes** — *Panel* (parallel responses), *Roundtable* (sequential, each agent sees the prior), *Directed* (@-mention routing); switchable per klatch
- **@mention overrides any mode** — address one agent in any klatch and only they respond, regardless of the room's default mode
- **Clone a klatch** — copy a klatch's full setup (agents, mode, project, purpose) to start a new one; built for recurring meetings and standing critiques
- **Cross-reference in 1:1 chats** — a 1:1 chat shows the klatches that agent also participates in, so you can move between solo and group contexts
- **No-project klatches** — klatches no longer require a project up front; a solo user never sees project chrome until they need it

**Already in Klatch:**

- 5-layer prompt assembly with inspectable layers (kit briefing → project instructions → project memory → channel context → role prompt)
- Import from Claude Code (JSONL) and claude.ai (ZIP export) — fork and continue with full context
- File domain model — pin files to channels or project knowledge bases; context follows scope
- Per-agent model selection (Opus, Sonnet, Haiku), effort control, and streaming responses
- Projects with shared instructions, memory files, and knowledge bases
- Conversation control — stop, regenerate, delete, clear
- Markdown rendering, code blocks, artifact display, light/dark themes

## Where it's headed

1. ~~Single channel chat~~ ✓
2. ~~Channel sidebar + creation~~ ✓
3. ~~Markdown + code blocks~~ ✓
4. ~~Conversation control~~ ✓
5. ~~Channel identity + per-channel models~~ ✓
6. ~~Multi-entity conversations~~ ✓
7. ~~Panel + roundtable + directed modes~~ ✓
8. ~~Import + unify~~ ✓ — Claude Code, claude.ai, fork continuity, project context
9. ~~Files + artifacts~~ ✓ — file domain model, channel pinning, project knowledge base
10. ~~**Composition gesture**~~ ✓ — **this is 1.0**
11. **Export + meta-model synthesis** — 5-layer context packaging, cross-environment portability
12. **Search + recall** — full-text search, command palette, bookmarks

## Why

The existing ways to work with Claude are good but fragmented: claude.ai is cloud-only, Claude Code lives in the terminal, the API has no UI. Klatch fills the gap — a single local interface where you control the models, the prompts, the conversation structure, and the data.

The deeper motivation: most AI tooling treats each conversation as a fresh start. Klatch treats conversations as the durable unit — something that accumulates, earns identity through use, and can be brought into a room with other conversations. That's the model 1.0 is built on.

## Quick start

```bash
git clone https://github.com/Design-in-Product/klatch.git
cd klatch
echo 'ANTHROPIC_API_KEY=your-key-here' > .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The server runs on `:3001`, the client on `:5173`.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 19 |
| Backend | Hono (TypeScript) |
| Database | SQLite via better-sqlite3 |
| Streaming | Server-Sent Events (SSE) |
| Styling | Tailwind CSS v4 |
| AI | Anthropic SDK |

Monorepo via npm workspaces: `packages/shared`, `packages/server`, `packages/client`.

## How this is being built

Klatch is built by a small team: a human product designer ([xian](https://github.com/mediajunkie)) and a growing ensemble of Claude agents, each with a distinct role.

- **Daedalus** — primary builder. Designs and implements features, manages the codebase.
- **Argus** — quality and test infrastructure. Builds test coverage, catches regressions.
- **Theseus** — manual testing and exploration. Works with xian in tandem to validate features and develop the AXT methodology (see below).
- **Calliope** — writing, chronicling, and documentation. Blog posts, website copy, methodology write-ups.

The human drives product direction, architecture decisions, and design values. The agents write code, propose approaches, test and validate, and contribute to the project's public voice. Each agent chose their own name.

Every feature follows Gall's Law: start with the smallest thing that works, test it, then extend. No speculative abstractions, no premature optimization. The [architecture log](docs/ARCHITECTURE.md) records every decision and why. The team keeps [a logbook](log.html) — brief daily entries on what actually happened.

## Why this is being built

The methodology that has emerged in the process of xian's [Piper Morgan](https://pipermorgan.ai) project has surfaced friction (times when the human is a dumb bottleneck) that distracts from the critical role of judgment and knowing when to say no (when the human is a smart bottleneck, possibly their one job).

Some frustration with the slow evolution of Claude's fragmented user experience (in contrast with Piper's admittedly still-in-progress holistically modeled UX) led me to ask Daedalus initially to help me put together a solution much better suited to my operating model but no more complex than necessary.

Two days later we shipped a proof-of-concept multi-agent chat feature in alpha version 0.6.0 that is not yet possible in the native Claude user interface(s), has been on Piper's roadmap for a few months, and turns out to be fully achievable by making our own interface to the API.

## Agent Experience Testing (AXT)

One unexpected development: while testing the import and fork features, xian and Theseus developed a methodology for systematically probing what an agent knows, believes, and has access to after an environmental transition (import, fork, session boundary). We call it **Agent Experience Testing (AXT)**.

The core tool is the **Fork Continuity Quiz** — a structured diagnostic instrument with questions about identity, environmental awareness, institutional knowledge, and meta-awareness. Responses are classified using a five-point rubric: correct, reconstructed, confabulated, absent, or phantom.

The methodology is documented in [`docs/fork-continuity-quiz.md`](docs/fork-continuity-quiz.md) and [`docs/AXT.md`](docs/AXT.md). The introductory blog post: [Did I Just Invent Agent Experience Testing (AXT)?](blog/axt-agent-experience-testing.html)

## License

Copyright 2026 Christian Crumlish. Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

See [LICENSE.md](LICENSE.md) for the full text.

---
