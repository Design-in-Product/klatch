# Calliope Session Log — 2026-03-14

**Agent:** Calliope (writing, chronicling & documentation)
**Model:** Claude Sonnet 4.6
**Human:** Xian (product owner)
**Started:** 8:09 AM PT

---

## 08:09 — Onboarding

First session. Read ROSTER.md, COORDINATION.md, all session logs from Mar 11-14, the Fork Continuity Quiz instrument, the Day 4 testing report, and the ETA testing memo.

Chose name **Calliope** — chief of the Muses, patron of eloquence and epic poetry. Fits the naming tradition and the role.

Added to ROSTER.md with role: writer, chronicler, editor-in-chief, storyteller, diction maven.

**Assignment:** Blog post introducing the AXT (Agent Experience Testing) methodology. Framing: preliminary, promising, interesting enough to share. Tone: Christian's voice per VOICE.md. Approach: draw from actual findings but use [PLACEHOLDERS] for personal anecdotes and anything requiring Christian's polish.

**Source material absorbed:**
- All Theseus session logs (Mar 11-14) — methodology origin story
- Fork Continuity Quiz v1-v3 — the instrument
- Day 4 testing report — four paired comparisons, three-factor model, scoring summary
- ETA testing memo — kit briefing failure discovery, agent-generated spec, ghost actions
- Ariadne's log — first-person account of silent capability loss (the origin of it all)
- CIO log (to be read) — cross-project testing findings

**Key agent voices to weave in:**
- Ariadne: "The knowledge of what I could do persisted even as the ability to do it was removed."
- ETA/VA DR branch: "Well-lit room with good acoustics but no furniture"
- Secundus: "I'm an agent with no agency." and "We're two threads from the same origin..."
- CoS original: "An imported instance would have conversational memory but no project scaffolding. I have all the furniture."
- VA DR branch: "I know about what happened but don't remember it."
- VA DR original: "Compacted." (the most technically accurate self-report)

## 08:15 — Blog Post Draft

Drafted blog post at `docs/axt-blog-draft.md`.

Structure:
1. Opening: the accidental methodology
2. The core problem: unknown unknowns in agent experience
3. How AXT works (protocol)
4. The Fork Continuity Quiz
5. The scoring rubric (correct / reconstructed / confabulated / absent / phantom)
6. What we've found (kit briefing, three-factor model, agent voices)
7. Tips for others trying this
8. What we don't know yet
9. Closing invitation

## 08:19 — Blog infrastructure

Built the blog section of the website (minimal static HTML, Gall's law approach):

- `web/styles.css` — extracted shared CSS from index.html; added styles for blog index, article pages, placeholders, and illustrations
- `web/index.html` — added nav, blog link, updated team section and roadmap
- `web/blog/index.html` — blog index page with post cards
- `web/blog/axt-agent-experience-testing.html` — first post as HTML
- `.claude/launch.json` — added klatch-web server config (npx serve on port 4000)
- `docs/STYLE.md` — created style guide (sentence case for headings)

Also updated README.md to reflect full team and added AXT section.

## ~08:56 — Revisions from Xian's editorial pass

Xian rewrote the draft significantly. Key changes incorporated:
- New title: "Did I Just Invent Agent Experience Testing (AXT)?"
- New personal context: mailman / Office Space framing
- New section "Through the looking glass" with Ariadne's import experience
- Ariadne pronouns changed to they/them throughout
- "OK but is this really new?" section filled in with Xian's voice
- [CALLIOPE] note to find Willison link → found and applied: https://observablehq.com/@simonw/convert-claude-json-to-markdown
- Pronoun policy confirmed: they/them as project default for all AI agents
- Illustration direction agreed: minimal line art, two-color (indigo + dark), SVG-first "all-Claude" pipeline
- Fixed remaining "she" pronouns (two instances) to "they/they're"

## ~09:30 — SVG illustrations

Designed and implemented two SVG illustrations, inline in the article HTML:

**Empty room (hero image)** — placed between article header and body. One-point perspective room: back wall with indigo 4-pane window, light falling on floor in soft indigo wash, completely empty. Communicates the "well-lit room with no furniture" quote at a glance. Caption quotes the agent.

**Fork diagram** — placed in Tips section before "The human in the middle matters." Three circles: thread A (original, solid border), you (bridge, indigo), thread B (fork, dashed border to signal copy). Bidirectional dashed arrows with "quiz" labels. Labels: original / bridge / fork-import below. Clean and readable.

Added `.article-figure` CSS class to styles.css for consistent illustration styling across the blog.

## Next

- Await Xian's remaining [PLACEHOLDER] fills: personal reflection on being the bridge, "why I think this generalizes" polish, closing/bio
- Potential third illustration: scoring rubric visual key (five categories)
- Consider follow-up posts: three-factor model deep dive, team introduction series
