<p align="center">
  <img src="docs/klatch-logo.svg" alt="Klatch" width="80" height="80" />
</p>

<h1 align="center">Klatch</h1>

<p align="center"><strong>A Slack-inspired, local-first web app for managing Claude AI conversations.</strong></p>

---

Klatch gives you a persistent, channel-based interface for working with Claude — like having a private Slack workspace where every channel is a different Claude persona with its own system prompt, model, and conversation history.

## Why

The existing ways to interact with Claude are good but fragmented:

- **claude.ai** is polished but cloud-only — you don't own your data, and you can't customize the interface
- **Claude Code** is powerful for development but lives in the terminal
- **The API** gives you full control but no UI

Klatch fills the gap: a single local interface where you control the models, the prompts, the conversation structure, and the data. Everything stays on your machine in a SQLite database. The only external dependency is the Anthropic API itself.

## What it does today (v0.5)

Klatch is being built incrementally, one working step at a time ([Gall's Law](https://en.wikipedia.org/wiki/John_Gall_(author)#Gall's_law)). Here's what works right now:

- **Channel-based conversations** — create named channels with custom system prompts, switch between them freely
- **Per-channel model selection** — choose Opus, Sonnet, or Haiku per channel, switch anytime without losing history
- **Streaming responses** — Claude's responses appear token-by-token via Server-Sent Events
- **Conversation control** — stop generation, regenerate responses, delete messages, clear history
- **Channel settings** — edit name, system prompt, and model with an inline settings panel
- **Persistent history** — conversations survive page reloads and server restarts (SQLite)
- **Markdown rendering** — syntax-highlighted code blocks, formatted text, copy-to-clipboard
- **Model tracking** — see which model produced each response, with markers when the model changes

## Where it's headed

The [full roadmap](docs/ROADMAP.md) is in the repo, but the key milestones are:

1. ~~Single channel chat~~ ✓
2. ~~Channel sidebar + creation~~ ✓
3. ~~Markdown + code blocks~~ ✓
4. ~~Conversation control~~ ✓
5. ~~Channel identity + per-channel models~~ ✓
6. **Conversation structure** — threads, branching, pinned messages *(next)*
7. **Multi-entity chat** — multiple Claude personas in one channel
8. **Search + export** — full-text search, markdown export, command palette
9. **Import from Claude Code & claude.ai** — bring your existing conversations into Klatch

The long-term vision is a unified control plane for all your Claude interactions — a place where you can import context from any source, define persistent roles, and manage ongoing conversations across projects.

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

Klatch is a collaborative project between a human product designer ([mediajunkie](https://github.com/mediajunkie)) and Claude (Anthropic's AI). The human drives product direction, architecture decisions, and design values. Claude writes the code, proposes technical approaches, and flags trade-offs.

Every feature follows Gall's Law: start with the smallest thing that works, test it, then extend. No speculative abstractions, no premature optimization. The [architecture log](docs/ARCHITECTURE.md) records every decision and why.

## License

MIT
