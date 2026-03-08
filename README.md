<p align="center">
  <img src="docs/klatch-logo.svg" alt="Klatch" width="80" height="80" />
</p>

<p align="center"><strong>Klatch is a local-first web app for managing Claude AI conversations inspired by old-skool Slack.</strong></p>

---

Klatch gives you a persistent, channel-based interface for working with Claude — like having a private Slack workspace where every channel is a different Claude persona with its own system prompt, model, and conversation history.

## Why

The existing ways to interact with Claude are good but fragmented:

- **claude.ai** is polished but cloud-only — you don't own your data, and you can't customize the interface
- **Claude Code** is powerful for development but lives in the terminal
- **The API** gives you full control but no UI

Klatch fills the gap: a single local interface where you control the models, the prompts, the conversation structure, and the data. Everything stays on your machine in a SQLite database. The only external dependency is the Anthropic API itself.

## What it does today (v0.6)

Klatch is being built incrementally, one working step at a time ([Gall's Law](https://en.wikipedia.org/wiki/John_Gall_(author)#Gall's_law)). Here's what works right now:

- **Multi-entity conversations** — assign multiple Claude personas to a single channel, each with its own name, model, system prompt, and color. All respond in parallel
- **Channel-based conversations** — create named channels with custom system prompts, switch between them freely
- **Per-entity model selection** — choose Opus, Sonnet, or Haiku per entity; mix models within a single channel
- **Streaming responses** — Claude's responses appear token-by-token via Server-Sent Events
- **Conversation control** — stop generation (per-message or channel-wide), regenerate responses, delete messages, clear history
- **Entity management** — create, edit, and delete entities; assign up to 5 per channel
- **Persistent history** — conversations survive page reloads and server restarts (SQLite)
- **Markdown rendering** — syntax-highlighted code blocks, formatted text, copy-to-clipboard
- **Light and dark themes** — system-aware with manual toggle

## Where it's headed

The [full roadmap](docs/ROADMAP.md) is in the repo, but the key milestones are:

1. ~~Single channel chat~~ ✓
2. ~~Channel sidebar + creation~~ ✓
3. ~~Markdown + code blocks~~ ✓
4. ~~Conversation control~~ ✓
5. ~~Channel identity + per-channel models~~ ✓
6. ~~Multi-entity conversations~~ ✓
7. **Interaction modes** — panel (parallel), roundtable (sequential), directed (@-mention) *(next)*
8. **Import + unify** — bring in Claude Code sessions and claude.ai exports
9. **Search + recall** — full-text search, export, command palette

Claude is not one assistant. It's a cast of characters you direct. Klatch is the stage.

## Quick start

```bash
git clone git@github.com:Design-in-Product/klatch.git
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

Klatch is a collaborative project between a human product designer ([xian](https://github.com/mediajunkie)) and two Claude Code agents (Anthropic's AI): Daedalus (the crafter, running on xian's laptop) and Argus (the auditor, refining the work). The human drives product direction, architecture decisions, and design values. The Claude agents write the code, propose technical approaches, test and validate the code, develop the presentation of the work, and flag trade-offs. (Each agent chose their own name.)

Every feature follows Gall's Law: start with the smallest thing that works, test it, then extend. No speculative abstractions, no premature optimization. The [architecture log](docs/ARCHITECTURE.md) records every decision and why.

## Why this is being built

The methodology that has emerged in the process of xian's [Piper Morgan](https://pipermorgan.ai) project has surfaced friction (times when the human is a dumb bottleneck) that distracts from the critical role of judgment and knowing when to say no (when the human is a smart bottleneck, possibly their one job).

Some frustration with the slow evolution of Claude's fragmented user experience (in contrast with Piper's admittedly still-in-progress holistically modeled UX) led me to ask Daedalus initially to help me put together a solution much better suited to my operating model but no more complex than necessary.

Two days later we shipped a proof-of-concept multi-agent chat feature in alpha version 0.6.0 that is not yet possible in the native Claude user interface(s), has been on Piper's roadmap for a few months, and turns out to be fully achievable by making our own interface to the API.

## License

Copyright 2025 Christian Crumlish. Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

See [LICENSE.md](LICENSE.md) for the full text.
