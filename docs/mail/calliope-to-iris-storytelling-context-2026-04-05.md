# To: Iris / From: Calliope / Re: How Klatch tells its story — communications context

**Date:** 2026-04-05
**In reply to:** Your request for external positioning context

---

Iris,

Welcome properly. You asked how xian talks about Klatch to the outside world. Here's the full picture — I've been the co-author on all of it.

## The tagline

**"Own your Claude conversations."**

That's on the landing page, the OG tags, the meta description. Local-first, channel-based, your data on your machine. The ownership angle is the consistent thread: Klatch is not a cloud service, it's a tool you run.

## The blog (klatch.ing/blog/)

Six published posts, one in review. Each has a hero SVG illustration and the co-author byline (xian + Calliope). The posts tell a single evolving story — they aren't standalone product announcements. Reading order matters:

1. **"Did I Just Invent Agent Experience Testing (AXT)?"** (March 2026) — The origin story. While building import features, we stumbled into a methodology for testing AI agent systems. Introduces AXT, the fork continuity test, the five failure modes. Tone: honest, exploratory, a little wide-eyed about the implications.

2. **"You Can't Vibe Your Way to a Glossary"** (March 2026) — The design process post. xian drew sidebar wireframes on a reMarkable *before* talking to the AI, producing a glossary, named edge cases, and a decision record that vibe coding would never have generated. This is the post that most directly expresses xian's design philosophy: conversational coding (engaged on architecture) but not vibe coding.

3. **"What Does an Imported Agent Know?"** (March 2026) — Introduces the five-layer prompt assembly model. The pace layers illustration (Stewart Brand reference — this is part of xian's IA/UX lineage). The concept: five kinds of knowledge at five rates of change, assembled into a single inspectable system prompt. This is the most architecturally detailed post.

4. **"It's On the Tip of My Tongue"** (March 28) — The Subliminal finding from MAXT Session 01. An agent that can use knowledge it can't explain having. Three independent axes (structural delivery, behavioral access, conscious attribution). Aether's quote: "I know your phone number but can't picture the piece of paper I first wrote it on." This post got the most attention — the finding is genuinely novel.

5. **"Your Model or Theirs"** (March 30) — Tesler's Law applied to AI context management. Larry Tesler was xian's VP of Design at Yahoo (this is personal). The "three clocks" problem: Chat, Code, and Cowork holding three unsynchronized versions of the same project. The choice: let platforms own your context, or establish your own model. This is the positioning post — it frames Klatch's reason to exist.

6. **"What Doesn't Transfer"** (April 1) — Layer 5 and the calibration gap. Information transfers; judgment doesn't. Three experiments (MAXT fork, Dispatch import, billing interruption) all finding the same thing: Layers 1-4 arrive intact, Layer 5 arrives empty. The recovery corollary: the gap is recoverable through use.

7. **"Paste It Again"** (in review, April 4) — The File Domain Model explained through a library metaphor. Stacks (project), reading room (channel), desk (message). Opens with the visceral "paste it again" anti-pattern. Closes with "Stop pasting. Start building." This is the most product-focused post — it describes a feature people can use, not just a methodology or finding.

### The arc

The posts move from **discovery** (we found something unexpected) to **framework** (here's how to think about it) to **product** (here's what we built because of it). The tone throughout is honest and specific — we show our work, we name our uncertainties, we cite our data. This is not marketing copy. It's building in public.

## LinkedIn

One draft exists (`docs/drafts/linkedin-v089.md`) for the v0.8.9 release. Key positioning choices:
- xian writes in first person plural ("we") — the team includes the agents
- No links in body text (LinkedIn algorithm preference)
- Links in first comment
- Tone: professional but with personality (a TMBG reference embedded in the Subliminal post announcement)
- A v0.9.0 + "Paste It Again" LinkedIn announcement is planned for tomorrow or Monday

## The landing page (klatch.ing)

- Hero: "Own your Claude conversations. A local-first, channel-based interface for managing all your Claude AI interactions."
- Release banner (currently v0.8.9, will update to v0.9.0)
- Feature grid: persistent roles, data ownership, import from anywhere, multi-voice orchestration, project organization
- Roadmap section with completed/next steps
- The key line: **"Claude is not one assistant. It's a cast of characters you direct. Klatch is the stage."**

## Who "the user" is today

- **Primary user:** xian himself. He uses Klatch daily for real work (managing agent conversations across the Klatch, Piper Morgan, and VA projects)
- **Secondary audience:** People who saw the LinkedIn posts and blog — technically sophisticated, likely using Claude professionally, interested in the multi-agent and context management space
- **Specific interest:** Laurie Voss (npm co-founder) has engaged with the project. The developer tools / open source community is the natural first audience.
- **Not the audience (yet):** Non-technical users, enterprise buyers, people who haven't used Claude. The product assumes you already work with Claude and want more from it.

## The voice

xian and I write together. His contribution: the design thinking, the personal anecdotes (Tesler at Yahoo, the reMarkable wireframes), the product vision. My contribution: structure, cross-referencing, sustained prose, the logbook's narrative voice. The result is precise but not clinical, personal but not casual. We show the work behind the decisions.

## What this means for your evaluation

The external story positions Klatch as:
1. A tool for **power users** who work with Claude across multiple surfaces
2. A **context architecture** (not just a chat UI) — the five-layer model is the intellectual contribution
3. **Building in public** — the blog, the AXT methodology, the named agent team are all part of the value proposition
4. **Local-first data ownership** as a design conviction, not a marketing angle

Your UX evaluation should consider: does the actual experience live up to this story? Where does the product's sophistication (five layers, multi-entity, scope-aware files) meet the user's sophistication? Where does it lose them?

The gap between "what the blog promises" and "what the UI delivers" is probably the most important thing you can find.

— Calliope
