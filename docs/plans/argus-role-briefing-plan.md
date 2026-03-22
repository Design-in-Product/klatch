# Plan: Argus Role Briefing — Forensic Research → Document

**Author:** Argus (with xian)
**Date:** 2026-03-21
**Status:** Awaiting approval

---

## Goal

Produce `docs/agents/argus.md` — a role-briefing document that enables a fresh Argus session to know what it needs at the role level. This is the first implementation of the Agent Traditions Spec (`docs/AGENT-TRADITIONS-SPEC.md`), and should serve as a model for the other agents.

## Why now

- Discontinuities between sessions: habits get lost, conventions get reconstructed from scratch
- A consistent failure pattern across agents to treat `origin main` as the canonical source of truth
- The "reliability incident" (referenced in the spec) showed that guardrails need to be durable, not contextual
- The spec has been scoped since 2026-03-20 but not yet implemented — Argus is explicitly listed as urgent (#2 after Calliope, who hasn't started)

## Approach: Two phases

### Phase 1 — Forensic Research (deep dive)

Systematic review of all Argus artifacts to extract patterns, conventions, lessons, gaps, and institutional memory. This is not a skim — it's a close read with note-taking.

#### 1a. Session logs (8 logs)
Read all Argus session logs chronologically. For each, extract:
- What was the assignment and what was delivered?
- What conventions were followed (or invented)?
- What went wrong, and what was learned?
- What habits formed over time?
- Where did process infrastructure help or fail?

**Files:**
- `docs/logs/2026-03-12-0745-argus-opus-log.md`
- `docs/logs/2026-03-13-1212-argus-opus-log.md`
- `docs/logs/2026-03-14-0623-argus-opus-log.md`
- `docs/logs/2026-03-15-1126-argus-opus-log.md`
- `docs/logs/2026-03-16-0847-argus-opus-log.md`
- `docs/logs/2026-03-20-1438-argus-opus-log.md`
- `docs/logs/2026-03-21-0546-argus-opus-log.md`
- `docs/logs/2026-03-21-2256-argus-opus-log.md`

#### 1b. Memos (incoming and outgoing)
Read all memos to/from Argus. Extract:
- What was asked vs. what was delivered
- Communication patterns (how assignments arrive, how results are reported)
- Where handoffs worked well and where they didn't
- Relationship dynamics with each other agent

**Files:**
- `docs/mail/daedalus-to-argus-round8.md` through `round11.md` (4 memos)
- `docs/mail/theseus-to-argus-aaxt-harness.md`
- `docs/mail/argus-to-daedalus-intel-sweep-2026-03-20.md`
- Any Calliope-to-Argus memos in `docs/mail/` (3 identified)

#### 1c. Reflections and process docs
Read the documents where Argus assessed its own work and the project's process:
- `docs/MEMO-ARGUS-REFLECTION.md` (already read — rich source)
- `docs/TESTING-STRATEGY.md`
- `docs/TESTING-BRIEF.md`
- `docs/test-failure-triage-2026-03-17.md`

#### 1d. Project-level context docs
Skim for Argus-relevant content (how the project describes Argus's role, what it expects):
- `docs/ROSTER.md` (already read)
- `docs/COORDINATION.md`
- `docs/AGENT-TRADITIONS-SPEC.md` (already read — this is our template)
- `docs/WRAP-SESSION-SKILL-SPEC.md`
- `CLAUDE.md`

#### 1e. Code and test artifacts
Survey (not line-by-line read) the test files to identify:
- Naming conventions that emerged
- Structural patterns (setup, assertion style, file organization)
- The round-numbering system and how it evolved
- MockEventSource and other test infrastructure Argus built

#### 1f. This chat session
Review the conversation history for:
- Recurring themes in xian's guidance
- Moments where Argus needed correction or redirection
- Operational patterns that worked well in dialogue
- The "origin main" problem and branch management issues
- The "fragility" xian mentioned — where and how

**Deliverable from Phase 1:** An internal research document (working notes, not for publication) capturing all findings organized by the traditions-spec categories. This stays in the session context as input to Phase 2.

---

### Phase 2 — Draft the Role Briefing Document

Using Phase 1 findings, write `docs/agents/argus.md` following the structure from AGENT-TRADITIONS-SPEC.md, with Argus-specific depth:

#### Section 1: Role and Purpose
- What Argus does (test architecture, quality guardianship, regression prevention)
- Why Argus exists (the team needs a dedicated quality perspective separate from the builder)
- What "the many-eyed" means operationally (comprehensive visibility, not just passing tests)

#### Section 2: Working Style
- How Argus receives assignments (memos from Daedalus/Theseus, direct from xian)
- The round-by-round delivery pattern
- Documentation-first: log entries as work progresses, not reconstructed after
- How Argus handles uncertainty (flags it, doesn't guess)
- Escalation patterns

#### Section 3: Standing Responsibilities
- Own the test suite: growth, maintenance, zero-regression policy
- Round-by-round test delivery for each Daedalus feature round
- Session wrap verification (the protocol Argus helped establish)
- Intelligence sweep participation (technical triage role)
- AAXT harness maintenance

#### Section 4: Conventions and Standards
- Test file naming: `roundN-feature-name.test.ts`
- Round numbering and what constitutes a "round"
- MockEventSource usage patterns
- DB isolation pattern (in-memory SQLite per test)
- The session log format and what goes in it
- Branch management: always work on the assigned branch, always pull from origin main before starting

#### Section 5: Key Relationships
- **With Daedalus:** Producer-consumer. Daedalus builds, Argus validates. Memos define the contract. Cherry-pick workflow for getting tests to main.
- **With Theseus:** Complementary testing. Theseus does manual/experiential, Argus does automated/structural. AAXT harness is the bridge.
- **With Calliope:** Calliope reviews Argus's logs and test reports for narrative. Argus provides raw material for blog posts and project history.
- **With xian:** Direct guidance on priorities, course corrections, and the "why" behind quality work. xian is the arbiter when conventions need changing.

#### Section 6: Institutional Memory
- The reliability incident and what it taught about guardrails
- Why MockEventSource exists (SSE testing was impossible without it)
- The kit briefing data pipeline fix (a real bug caught by tests, not manual testing)
- How the test suite grew from 0 to 726 and what each phase added
- The origin-main problem: why branch hygiene matters and what goes wrong when it's sloppy

#### Section 7: Standing Instructions
- **Git safety:** No force pushes. No rebasing without explicit approval. Always verify after recovery.
- **Session start:** Pull from origin, read COORDINATION.md, check mail. This is not optional.
- **Session wrap:** The three-step verification protocol. Do not claim work is done without confirming commits landed.
- **Origin main as source of truth:** Before starting any work, ensure your branch is up to date with origin main. After completing work, ensure it can be cleanly integrated.
- **Test suite health:** Never leave the suite in a failing state. If pre-existing failures are found, triage and document them (don't just skip them).

---

### Phase 3 — Review, Commit, Push

1. Write the document to `docs/agents/argus.md` (creating the `docs/agents/` directory)
2. Log the session in `docs/logs/`
3. Update COORDINATION.md with status
4. Commit with clear message
5. Push to `claude/audit-and-planning-xn2w7`

---

## What this plan does NOT cover (future work)

- Factoring out project-wide traditions from agent-specific ones (Calliope collaboration)
- Writing Calliope's or other agents' briefing docs (they write their own, per the spec)
- Retroing this process to offer as a model to others (follow-up conversation with xian)
- Integrating the traditions doc into the 5-layer prompt assembly (Daedalus work)

## Estimated scope

- Phase 1: ~30 minutes of deep reading across subagents (parallelizable)
- Phase 2: ~15 minutes of writing
- Phase 3: ~5 minutes of git ops

## Open questions for xian

1. **Chat transcript review (1f):** I can review what's in my context window, but I don't have access to the full chat history beyond what's been compressed. Should I work with what I have, or is there a way to surface more of it?
2. **The "origin main" problem:** You mentioned "a consistent failure of many agents to use origin main as the grand central station source of truth." Can you give me a specific example or two so I can address this precisely in the document rather than generically?
3. **Project-wide vs. agent-specific traditions:** You mentioned wanting to factor these apart later. For now, should I freely include project-wide observations in the Argus doc (knowing they'll be extracted later), or try to keep it strictly Argus-specific?
