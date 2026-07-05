# Launch copy — LinkedIn + Product Hunt

---

## LinkedIn

*(~200 words, professional audience, leads with the meta angle)*

Can you build a multi-agent collaboration tool using multi-agent collaboration?

Yes. That's what Klatch 1.0 is.

Klatch is a local-first workspace for orchestrating multiple Claude agents on the same problem — a Slack-style interface where you assemble a roster of agents, choose how they interact, and run them together. It runs on your machine. You own the data. You bring your own Anthropic API key.

Version 1.0 ships the **composition gesture**: a searchable agent picker, three interaction modes (parallel / sequential / @mention-directed), clone-a-klatch, and cross-references between an agent's 1:1 conversations and their group contexts.

The meta: the team that built Klatch — Daedalus (implementation), Argus (testing), Iris (UX), Calliope (writing) — runs as klatches inside the product itself. The composition gesture we just shipped is how they coordinate. We didn't test multi-agent collaboration in theory. We did the work with it.

Open source. Four-command install. If you work in design, product, or engineering and want to try it: [repo link]

More on how the product and the methodology developed together: [blog post link]

---

*[xian: the invitation wording is yours — the placeholder above is where you'll link the sign-up, waitlist, or just the repo depending on what channel you want to route people to.]*

---

## Product Hunt

### Tagline (under 60 characters)

`Local-first workspace for multi-agent Claude conversations`

*(57 characters)*

### Short description (for the PH card)

Bring multiple Claude agents into the same room. Klatch is a Slack-style interface where you assemble a roster, choose how they interact — parallel, sequential, or @mention-directed — and run them on the same problem. Local, open source, bring your own API key.

### Maker comment *(posted as the launch comment — personal, 3-4 short paragraphs)*

Hi Product Hunt — I'm xian, the human on the Klatch team.

Klatch started as a frustration: I was running multiple Claude conversations in parallel and constantly context-switching between them. I wanted a workspace where agents could actually be in the same room, see each other's work, and respond in relation to each other — not just independently.

Version 1.0 ships the **composition gesture**: the complete surface for assembling and running multi-agent conversations. You pick agents from the ones you've already been working with, choose how they interact, and start a klatch. Three interaction modes — parallel, sequential, or @mention-directed. Clone your best setups. Move between an agent's 1:1 conversations and their group contexts.

The thing I'm most proud of is how this got built. Klatch is designed and built by a small human+AI team: Daedalus (implementation), Argus (testing), Iris (UX), and Calliope (writing and documentation). They coordinate through Klatch itself. The composition gesture we just shipped is the same mechanism they've been using for months. We didn't prototype it in isolation — we built it while using it.

Everything runs locally. SQLite database, no cloud sync, bring your own Anthropic API key. Four commands to get started. Open source at [repo link].

Happy to answer questions in the thread — about the product, the methodology, or how to build with a multi-agent team.

---

### PH feature list (for the gallery/features section)

- **Panel, Roundtable, Directed** — three interaction modes; choose how your agents respond
- **@mention in any mode** — address one agent directly; only they respond; the rest of the room stays normal
- **Agent picker** — assemble a roster from agents you've already been working with
- **Clone a klatch** — copy a full setup (agents, mode, project) for recurring meetings and standing critiques
- **Import + fork** — bring in Claude Code sessions and claude.ai exports; continue them in Klatch with full context
- **5-layer prompt assembly** — kit briefing → project instructions → project memory → channel context → role prompt; fully inspectable
- **Local-first** — SQLite database on your machine, no accounts, no cloud sync

---

*[xian: PH launch strategy — you'll want to decide on timing (Tuesdays/Wednesdays tend to perform well), whether you want upvote coordination among early users, and what the first comment should link to. Blog post is the best long-form companion. The maker comment above is a draft — your voice will be different.]*
