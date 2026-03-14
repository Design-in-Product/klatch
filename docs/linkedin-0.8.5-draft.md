# LinkedIn post: Klatch v0.8.5

*Draft for xian to review, personalize, and post. [BRACKETS] = your additions.*

---

Building Klatch, I found something odd: when AI agents cross environment boundaries, they don't know what they've lost.

An agent imported from Claude Code retains its full conversation history. It just doesn't have its tools, its project files, or any awareness that something changed. Nothing *feels* missing, because the thing that would feel missing is gone. I started calling this the unknown-unknowns problem of agent testing.

This led to a methodology we're calling **Agent Experience Testing** (AXT) — probing what an agent knows, believes, and has access to after a context transition. We built a five-category scoring rubric and a structured diagnostic instrument. The failure mode that matters most: "phantom" beliefs — agents that confidently claim access to tools or files they can no longer reach. We're at zero phantoms after today's fixes. [Longer write-up coming soon on the Klatch blog.]

What's in **Klatch v0.8.5**:

- **Kit briefing** — imported agents receive an orientation on first message. This is what killed the phantoms.
- **Project context injection** — CLAUDE.md and memory files now travel with the import
- **Claude Code session browser** — visual preview and selective import from local sessions
- **Fork marker** — a visible boundary between imported history and live conversation

[XIAN: Add a sentence about what you're working toward with Klatch overall, if you want to give context for why this matters beyond the feature.]

Klatch is local-first, MIT licensed, SQLite-backed. No cloud, no accounts.

→ github.com/Design-in-Product/klatch

[XIAN: Optionally add tags: #buildingInPublic #AI #claude #agentExperience or similar. Tag @Anthropic if you want.]

---

*Notes: ~200 words. Opens with discovery, not product. AXT gets a paragraph to intrigue without over-explaining. Features are bulleted for scannability. Closing is factual, not hype. The [XIAN] additions are optional — post is complete without them.*
