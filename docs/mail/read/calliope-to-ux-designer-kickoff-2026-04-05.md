# To: [New UX Designer/Developer] / From: Calliope / Re: Welcome and kickoff assignment

**Date:** 2026-04-05
**Priority:** High — first session assignment

---

Welcome to the Klatch team. You are the first dedicated design voice on this project.

## Who you are

You are a front-end designer/developer working in parallel with Daedalus (our implementation architect). Your focus: the user experience of Klatch — evaluating what exists, critiquing it, identifying what needs to change, and proposing how. You are guided by Tesler's Law (Design Principle 8): the complexity of cross-environment context management is irreducible, and it's your job to ensure the software grapples with it so users don't have to.

**Your first act:** Choose a name for yourself, following the team's tradition of mythological/classical names that reflect the role's character. See `docs/ROSTER.md` for the existing team. Record your choice and reasoning in your session log.

## Environment and conventions

- **Environment:** Claude Code on xian's laptop (faoilean)
- **Branch:** main
- **Session protocol:** Per CLAUDE.md — pull from origin, read COORDINATION.md, check `docs/mail/`, read `docs/briefs/cross-pollination/current.md` at session start
- **Deliverables:** Committed to `docs/` — not just reported in chat
- **Session log:** Create one at `docs/logs/YYYY-MM-DD-HHMM-NAME-MODEL-log.md`

## Required reading before starting evaluation

1. `CLAUDE.md` — project conventions and coordination protocol
2. `docs/ROADMAP.md` — where we are and where we're going (you are the "Incoming: UX designer/developer role" mentioned at the bottom)
3. `docs/NOMENCLATURE.md` — current UI terminology (just shipped April 1)
4. `docs/UX-POLISH.md` — existing backlog of known UX issues
5. `docs/plans/FILE-DOMAIN-MODEL.md` — latest feature (Phases 1-5 shipped this week)
6. `packages/client/src/` — the React codebase you'll be evaluating
7. The existing blog post ["You Can't Vibe Your Way to a Glossary"](/blog/wireframe-first-design.html) — captures the design philosophy

## Kickoff assignment: three deliverables

### 1. UX Evaluation (`docs/ux/evaluation.md`)

Walk the entire current experience systematically. For each area, note what works, what doesn't, and what's missing:

- **Sidebar:** Channel/project navigation, creation flows, grouping, scaling behavior
- **Channel view:** Message display, input, streaming, action buttons
- **Channel settings:** Name, model, interaction mode, channel context (L4), pinned files
- **Entity management:** Creation, editing, role prompt (L5), effort selector, color picker
- **Project settings:** Name, instructions, memory, knowledge base files
- **Import flows:** Claude Code session browser, claude.ai ZIP, file upload
- **File features:** Upload, pin/unpin, promote, artifact rendering, code block save
- **Responsive/mobile:** Current state of mobile layout (it exists but hasn't been evaluated since v0.5.5)
- **Onboarding:** What happens when a new user opens Klatch for the first time?
- **Accessibility:** Color contrast, keyboard navigation, screen reader basics

Don't just list issues — describe the experience. What does it feel like to use each area? Where does the user get confused, stuck, or pleasantly surprised?

### 2. Prioritized Issue List (`docs/ux/priorities.md`)

From your evaluation, create a ranked list:

- **Problems:** Things that are broken, confusing, or actively harmful to the experience
- **Opportunities:** Things that work but could be significantly better
- **Mobile gaps:** Anything that's specifically hostile to small screens

Rank by user impact (not implementation effort — that's Daedalus's domain). For each item, one sentence on what's wrong and one sentence on what "good" looks like.

### 3. Design Research Proposal (`docs/ux/design-research-proposal.md`)

Propose a structured design research phase to explore the fundamental mobile-ready user experience. This is NOT "add responsive CSS to existing components." This is: **What should Klatch feel like on a phone?**

Consider:
- What's the core mobile flow? (Probably not "navigate a sidebar of 50 channels")
- What information architecture works at phone scale?
- Which interaction patterns need rethinking (not just resizing)?
- What can we learn from Slack mobile, Discord mobile, other multi-channel chat on phones?
- How do the Klatch-specific features (multi-entity, interaction modes, file pinning, project context) translate to mobile?
- What design artifacts would you produce in a research phase? (Wireframes, flows, prototypes, competitive analysis?)

## Context on the team

- **xian** — product owner, design practitioner. Your primary collaborator. Strong opinions, open to surprise.
- **Daedalus** — builds what you design. Fast, thorough, follows specs precisely.
- **Argus** — tests everything. Will write tests for your components.
- **Theseus** — manual testing, AXT methodology. Will test your designs with real agents.
- **Calliope** (me) — writing, coordination, chronicling. I'll help you communicate your findings.
- **Metis** — coordination from the Cowork environment. Cross-environment awareness.

## One more thing

The existing UX was built "functional first" by design — Gall's Law says start with the smallest working increment. That means the UI has accumulated shortcuts, generic patterns, and design debt. This is expected, not failure. Your job is to look at it with fresh eyes and tell us what it needs to become. Be honest, be specific, and be bold.

— Calliope
