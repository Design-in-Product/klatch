# Klatch 1.0 — Composition Beta

Klatch is a local-first interface for running multi-agent Claude conversations — a Slack-style environment where you bring several AI agents into the same room and orchestrate how they work together.

Version 1.0 ships the **composition gesture**: the complete surface for assembling, configuring, and running multi-agent conversations.

---

## What's new

**Agent picker**  
Compose a klatch's roster from the agents you've already worked with. Type-ahead search, selected-agent chips with a live count (e.g. 2/5 agents selected), roles surfaced first. You're curating from existing conversations, not configuring new ones from scratch.

**Interaction modes**  
Choose how your agents interact: *Panel* (all agents respond in parallel), *Roundtable* (sequential — each agent sees the prior responses before responding), or *Directed* (@-mention routing). Switchable per klatch, any time.

**@mention overrides any mode**  
Typing `@` in a klatch shows an autocomplete of its agents. An @mention routes that message only to the addressed agent — overriding the channel's default mode for that message. A message with no `@` still goes to everyone as normal. Works in Panel, Roundtable, and Directed modes.

**Clone a klatch**  
"Copy setup from an existing klatch" prefills a new klatch's name, purpose, mode, project, and roster from one you already have. Built for recurring setups — a weekly review, a standing critique session, a project check-in that always involves the same agents.

**Cross-reference in 1:1 chats**  
A 1:1 chat with an agent shows the klatches that agent also participates in ("Also in: #design-review, #sprint-13"). Move between an agent's solo and group contexts without losing the thread.

**No-project klatches**  
Klatches no longer require a project. A solo user never sees project chrome until they have real projects worth organizing. New klatches without a project land in a "First project" group that stays out of the way.

---

## Quality

Klatch 1.0 passed a three-layer quality bar before release:

- **MAXT Session 03** — live, end-to-end, real API key, fresh state: **15/15 probes pass.** Tested new klatch creation, roster assembly, all three interaction modes, @mention override routing in panel and roundtable contexts, clone-from-klatch prefill, and 5-layer prompt assembly confirmation. Zero failures. Zero regressions.
- **AAXT R46 + R47** — automated synthetic probes for clone-from-klatch and @mention override: **both rounds green.**
- **1,332 automated tests** (1,120 server / 212 client). TypeScript clean on all changed code.

---

## Get it

Klatch runs locally. You'll need Node.js, an Anthropic API key, and about two minutes.

```bash
git clone https://github.com/Design-in-Product/klatch
cd klatch
npm install
# create .env with: ANTHROPIC_API_KEY=your_key_here
npm run dev
```

The server starts on `:3001`, the client on `:5173`. Open `localhost:5173`.

Full setup instructions in the [README](../README.md).

---

## What's not in 1.0

Two composition-surface items are tracked for a follow-on release:

- **New-Chat form agent picker** — the same picker pattern doesn't yet apply to 1:1 chat creation; you still configure agents via the entity manager.
- **New-Klatch form state reset on reopen** — if you open the New Klatch form, close it without saving, and reopen it, the fields retain their prior values. Minor polish item.

Search (FTS5, Cmd+K) is on the roadmap but is explicitly post-1.0.

---

## About Klatch

Klatch is an open-source, single-user, local-first tool. No accounts, no cloud sync, no hosted cost. Your conversations live in a SQLite database on your machine. You bring your own Anthropic API key.

The project is at [github.com/Design-in-Product/klatch](https://github.com/Design-in-Product/klatch).
