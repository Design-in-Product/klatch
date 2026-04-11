# LinkedIn Post Draft — v0.9.0

**For:** xian's LinkedIn
**Date:** 2026-04-10
**Status:** Draft for review

---

Klatch v0.9.0 is out — and it's the first release I'd actually like other people to try.

Klatch is the open-source tool I'm building for managing Claude AI conversations across projects, agents, and environments. v0.9.0 ships Step 9: Files and artifacts.

But that undersells it. The real shift is structural. In most AI tools, files exist only in the message you paste them into. New conversation, new paste. Update the file? Hope the right version is in your clipboard. The user is the courier service between their filesystem and the AI's context window.

We built something different. Files in Klatch have scope. Pin a file to a channel and every conversation in that channel knows about it — automatically, every message, no pasting. Upload a file to a project's knowledge base and every channel in that project sees it. As a file proves its value, you promote it upward — message to channel to project — and the AI encounters it at the right altitude without anyone re-pasting anything.

The metaphor we landed on is a research library: stacks (the project's full collection), reading room (today's working materials), desk (what's open right now). Most AI tools give you a desk and nothing else. When you leave, everything vanishes. Klatch gives you the library.

The release also brings per-entity effort control, a research-backed compaction tuning, the first phase of automated behavioral testing for AI agents, and a full nomenclature pass that replaces the overloaded "system prompt" with terms that actually mean what they do.

849 tests passing. Zero failures. Open source, local-first, and built by a human + a small team of named Claude agents who chose their own names.

The full writeup is on the blog: "Paste It Again."

---

**Notes for xian:**
- No links in body (per your instruction — add klatch.ing, blog post link, GitHub link in first comment)
- "First release I'd actually like other people to try" is the key positioning shift
- The library metaphor lifted directly from the blog post for resonance
- Hashtags if you use them: #AI #OpenSource #Claude #DeveloperTools
- First comment template: "klatch.ing | Blog: klatch.ing/blog/paste-it-again.html | GitHub: github.com/Design-in-Product/klatch | Release: github.com/Design-in-Product/klatch/releases/tag/v0.9.0"
