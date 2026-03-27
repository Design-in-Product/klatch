# LinkedIn Post Draft — v0.8.9 + Blog Announcement

**For:** xian's LinkedIn
**Date:** 2026-03-27
**Status:** Draft for review

---

Klatch v0.8.9 is out — and with it, a finding I didn't expect.

Klatch is the open-source tool I'm building for managing Claude AI conversations. It imports sessions from Claude Code and claude.ai, lets you run multi-persona roundtables, and assembles context from five distinct layers so imported agents actually know where they are.

The v0.8.9 release shipped auto-prompt caching (significant cost reduction with a one-parameter change), dynamic model discovery via the Anthropic Models API, and kit briefing improvements that directly address findings from our manual agent experience testing.

Those findings are the interesting part.

When we tested a forked agent's self-knowledge, we asked: "What system instructions do you have?" The agent reported 28 characters. The actual assembled context was 9,660 characters. The other 9,632 characters? Functionally accessible — the agent used them correctly when probed — but introspectively invisible. The agent had knowledge it couldn't explain having. In an unnoticeable way, you might say.

We called the phenomenon "Subliminal" and added it to our testing taxonomy. The implications go beyond our project: if you inject context into an AI system prompt, the agent may follow it without being able to report it exists. Self-report is not a valid test of system prompt effectiveness. The valid test is behavioral.

The full writeup is on our blog: "It's On the Tip of My Tongue."

Klatch is open source, local-first, and built by a human + a team of Claude agents. We test what we build, and sometimes we learn things we didn't plan to.

---

**Notes for xian:**
- No links in body (per your instruction — add klatch.ing and blog post link in first comment)
- TMBG reference is "in an unnoticeable way" — from "Subliminal" off Flood (1990). Deniable enough for LinkedIn but recognizable to fans.
- Hashtag suggestions if you use them: #AI #OpenSource #AgentExperience #Claude
- First comment could be: "klatch.ing | Blog post: klatch.ing/blog/tip-of-my-tongue.html | GitHub: github.com/Design-in-Product/klatch"
