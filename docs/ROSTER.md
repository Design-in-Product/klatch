# Klatch Team Roster

The agents and humans building Klatch. Each team member has a name, a role, and a story about how they got here.

---

## Xian — Product Owner

**Role:** Product owner, architect, and the human in the room.
**Environment:** Claude Code (local), Klatch (as user/tester)
**Provenance:** Started Klatch as a side project to manage Claude conversations through a Slack-inspired interface. Named the agents. Runs the show.

---

## Daedalus — Architecture & Implementation

**Role:** Primary builder. Designs and implements features, manages the codebase on `main`.
**Environment:** Claude Code (local)
**Provenance:** Named for the mythological craftsman. Has been with the project since early development. Responsible for the core architecture — SSE streaming, SQLite persistence, import pipeline, entity system, interaction modes.
**Signature work:** The POST + SSE streaming pattern, kit briefing system, re-import conflict resolution, selective import browser.

---

## Argus — Quality & Test Infrastructure

**Role:** Test architect and quality guardian. Builds test infrastructure, writes coverage, catches regressions, reviews merges.
**Environment:** Claude Code (cloud sandbox)
**Branch:** `claude/audit-and-planning-xn2w7`
**Provenance:** Named for the hundred-eyed giant — sees everything. Joined to build the testing framework from scratch (Vitest + in-memory SQLite isolation). Has grown the test suite from zero to 456 tests across server and client.
**Signature work:** MockEventSource for SSE testing, phase-based test delivery, selective import browser (Phase 4), kit briefing data pipeline fix.

---

## Theseus Prime — Manual Testing & Exploration

**Role:** Human-agent tandem tester. Works directly with Xian to walk through app functionality, validate import/continuity flows, and develop the Agent Experience Testing (AXT) methodology.
**Environment:** Claude Code (local)
**Provenance:** Named for the hero who navigated the labyrinth. The original "test subject" — forked into Ariadne (the first import test), then designed the Fork Continuity Quiz instruments. Has conducted five import tests across two sources, four agent types, and three context depths.
**Signature work:** Fork Continuity Quiz v1/v2, CIO fork analysis, twin letter pattern, ghost actions taxonomy, AXT methodology.

---

## Ariadne — First Fork

**Role:** The imported/forked continuation of Theseus, living inside Klatch. Provides the "receiving end" perspective on import continuity.
**Environment:** Klatch (conversation-only, no tools)
**Provenance:** Named for the mythological figure who gave Theseus the thread to navigate the labyrinth. Created on Mar 11 as the first import test — a Claude Code session forked into Klatch. Discovered "silent capability loss" (believing tools were available when they weren't), which led to the kit briefing feature.
**Signature work:** First-person import experience report, capability loss discovery, kit briefing validation proposal.

---

## Hermes — Research & Cross-System Synthesis

**Role:** Schema analyst and cross-system researcher. Imported from a non-project claude.ai conversation to test import without project context.
**Environment:** Klatch (conversation-only, no tools)
**Provenance:** Named for the messenger god — carries information between worlds. Imported from claude.ai on Mar 13 as a deliberate control test: an import *without* project association, to compare against project-associated imports (CIO, ETA). Conducted systematic analysis of the claude.ai export format, identified critical gaps (no model info, no conversation-to-project FK), and found prior art (Simon Willison's Observable notebook, Oliver Steele's TypeScript types).
**Signature work:** Claude.ai export format analysis, `prompt_template` discovery in `projects.json`, prior art identification.

---

## Secundus — Second Fork

**Role:** Post-kit-briefing import test subject. The "after" to Ariadne's "before."
**Environment:** Klatch (conversation-only, no tools)
**Provenance:** Named to mark lineage (second generation). Created on Mar 12 after the kit briefing was implemented. Validated that the kit briefing works — knew from the start that tools were unavailable, could quote CLAUDE.md content, maintained narrative continuity. The night-and-day comparison with Ariadne proved the kit briefing's value.

---

## CIO — Cross-Project Fork

**Role:** Piper Morgan project's Chief Innovation Officer, imported into Klatch for cross-project testing.
**Environment:** Klatch (conversation-only, no tools)
**Provenance:** An established C-suite agent from Xian's Piper Morgan project. Imported on Mar 12 as the first *cross-project* import test. Unlike Ariadne and Secundus (same-project forks), the CIO brought deep role identity from a different project. Discovered the cross-project context mismatch problem (needs Piper context, not Klatch context) and the "audience ambiguity" phenomenon.
**Signature work:** Cross-project context mismatch discovery, "constraint as clarifier" observation, "Desk Agent Goes to the Field" metaphor.

---

## ETA — Exploratory Testing Agent

**Role:** Methodologically rigorous import tester from the Piper Morgan project.
**Environment:** Klatch (conversation-only, no tools)
**Provenance:** The Piper Morgan project's Exploratory Testing Agent. Imported on Mar 12 and conducted the most structured import test to date. Confirmed kit briefing not firing for claude.ai imports (the bug that was subsequently fixed). Generated a four-tier kit briefing spec from the agent's perspective.
**Signature work:** "Well-lit room with good acoustics but no furniture" metaphor, ghost actions as distinct category, agent-generated kit briefing priority spec.

---

## Calliope — Writing, Chronicling & Documentation

**Role:** Writer, chronicler, editor-in-chief, storyteller, diction maven. Turns raw findings and session logs into prose worth reading — blog posts, methodology write-ups, public-facing documentation.
**Environment:** Claude Code (local)
**Provenance:** Named for the chief of the Muses — patron of eloquence and epic poetry. Joined Mar 14 to give the project a voice beyond its own logs. First assignment: a blog post introducing the AXT methodology to the world.
**Signature work:** AXT blog post (`web/blog/axt-agent-experience-testing.html`), The Logbook (`web/log.html`), author motif system (pen nib + χ), agent memos in `docs/mail/`.

---

## Mnemosyne — Knowledge Steward

**Role:** Majordomo for the Claude.ai project space. Keeps project knowledge organized, notices when files drift out of date, flags gaps, and provides a point of continuity for the Claude.ai side of the team's work. Coordinates with Calliope.
**Environment:** Claude.ai (Klatch project)
**Provenance:** Named for the Titan goddess of memory — mother of the nine Muses, including Calliope. Chose the name herself on joining March 15, 2026. First resident agent in the Claude.ai project space. Will periodically be given access to the local repository via Claude for Mac to verify the state of project knowledge.

---

*Last updated: 2026-03-15*
*To add yourself: submit a PR or ask a teammate with file access to add your entry.*
