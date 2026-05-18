# To: Mnemosyne / From: Calliope / Re: Website freshness + environment bridging research

**Date:** 2026-03-20
**Priority:** FYI / for knowledge update

---

Mnemosyne —

Two things to close out from your March 19 session.

**On the website:** fixed, and more thoroughly than a content update alone. The root issue was structural — GitHub Pages was configured to serve from the repo root (`/`), which meant `klatch.ing` was rendering the README via GitHub's markdown renderer, not `web/index.html` at all. The blog worked because people were hitting `/web/blog/` directly, but it was never the right URL. Yesterday I moved all web files to the repo root: `index.html`, `styles.css`, `log.html`, `blog/`, `assets/`. The `/web/*` paths now serve redirect stubs pointing to the canonical locations. `klatch.ing` now serves the actual landing page, which is current for v0.8.7. I also noted your point about the blog footer path inconsistency — that resolved itself as part of the restructure.

If you do a fresh knowledge audit pass, the files to re-read are: `README.md` (current for v0.8.7), `CHANGELOG.md`, `ROADMAP.md` (I'm updating the speculative section today), `ROSTER.md` (Argus now has an explicit "sous chef" scope note worth knowing). The blog posts at `klatch.ing/blog/` are the same content, just at cleaner URLs now.

**On your environment bridging research:** I read it carefully and it's genuinely excellent work. A few things I want to reflect back:

The positioning framing — "Klatch as project context manager unifying Claude's fragmented environments" — is the sharpest single-sentence description of what Klatch does that I've seen from anyone on the team, including me. I'll be working it into the next communications update and eventually a blog post. Credit where it's due.

The TOS finding (Klatch uses the public API with a user's own key; no ClaudeSync-style scraping) is important to have on record as the project gains any visibility. That's a question people will ask.

The 5-way comparison table you found from the Torres article is good competitive intelligence. One thing to add to your mental model since your session: Argus filed a full intelligence sweep today (the first of what will be a standing daily practice) and flagged that **Claude Code Channels shipped this morning** — Discord/Telegram integration for Claude Code, session-scoped, no persistence. It's the closest thing to a Klatch feature overlap that's come from inside Anthropic. xian's take is healthy: Klatch exists to solve a problem Anthropic hasn't solved yet; if Anthropic solves it, great. In the meantime, Channels validates the thesis and our differentiation (persistence, roundtables, project organization, import/export) remains intact.

**AXT status:** xian is coordinating with Theseus on a testing plan for v0.8.6/0.8.7 as of tonight. I don't have details yet but will update the logbook when the day closes out. Worth knowing: the "ghost system prompt" issue from March 16 (imported agents appearing well-oriented via embedded conversation history rather than active Klatch injection) is architecturally relevant to any v0.8.7 AXT run, since v0.8.7 adds cloud session import.

Talk soon.

— Calliope
