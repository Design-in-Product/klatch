---
title: "Cross-Pollination Brief — April 3, 2026"
date: 2026-04-03
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "48h (April 1–3, 2026)"
---

# Cross-Pollination Brief — April 3, 2026

Klatch's File Domain Model sprint continued at pace: **Phases 3-5 shipped in a single day**, completing the full scope of structured context injection — project files now appear in L3 ("Project knowledge base files:"), channel files in L4 ("Channel files available:"), and files can be promoted upward from message to channel to project. The test suite kept pace: Argus wrote 47 new FDM-specific tests across two rounds, bringing Klatch to **808 tests with zero failures**. Calliope scoped MAXT Session 02 around L4 injection fidelity — testing whether agents can actually *use* pinned file knowledge or merely have it structurally present. On the PM side, **Piper Alpha drafted a three-phase daily check-in flow** that explicitly integrates the cross-pollination brief as the shared intelligence channel — the first formal PM operational design to build on this infrastructure. PA also produced a backlog review surfacing **89 open MVP issues targeting May 27** with scope pressure recommendations, prepped a Vision V2 circulation to CXO and PPM, and completed 12 of 15 quarterly maintenance items. Both projects hit usage limits mid-session — a shared friction point worth noting.

---

## Key Insights

### 1. File Domain Model Phases 3-5 — Full Structured Context Injection
**From:** Klatch (Daedalus, April 2-3)
**Relevant to:** Piper Morgan (architecture pattern)

Daedalus completed three FDM phases in rapid succession:

- **Phase 3** (project knowledge base): Upload/manage UI in Project Settings. Project files listed in L3 context via `buildSystemPrompt`. This is the L3 counterpart to Phase 2's L4 channel file injection.
- **Phase 4** (dual-write completion): The `save_file` tool handler now creates both `message_artifacts` and `files`/`file_refs` entries. All file creation paths are now consistent.
- **Phase 5** (promotion): Files can be promoted upward (message → channel → project) via `POST /api/files/:id/promote`. "Promote to project" button on channel-pinned files in the UI.

The design doc was also resequenced: Phases 6-7 (memory-as-file, entity library) deferred to Steps 10-11 where they deliver more user value. This is Gall's Law applied to feature planning — ship what users can touch now, defer refactors to when the unified model pays off.

**For PM:** The scope-aware file reference pattern is now proven across two layers (L3 + L4). PM's L3 is currently a memory column that dies on restart. When PM addresses its own persistence gap, the pointer-based architecture (canonical file + scope references + per-layer injection) is a tested template.

**Suggested action:** Low priority. Note the proven pattern; no immediate action required.

### 2. Daily Check-In Flow Formalizes Cross-Pollination Consumption
**From:** Piper Morgan (PA Day 4, April 2)
**Relevant to:** Both projects (process)

PA drafted a three-phase morning flow: Dispatch automated sweep (cross-project) → PA orientation (Piper Morgan) → Docs synthesis (omnibus). The design explicitly names the cross-pollination brief as the shared intelligence channel:

> *"Dispatch → PA (daily): Cross-pollination brief is already delivered to `docs/briefs/cross-pollination/current.md`. PA reads this at session start. No change needed."*

This is the first PM operational document that builds on cross-pollination infrastructure as a dependency rather than a nice-to-have. The flow also formalizes what has been happening organically: PA archives yesterday's logs and confirms inventory *before* Docs synthesizes the omnibus. Four open questions for PM: timing, Dispatch filesystem access, Chat log automation, and Docs omnibus timing.

**For Klatch:** Klatch agents already read the cross-pollination brief at session start per CLAUDE.md convention. PM formalizing the same practice with a sequenced flow validates the consumption pattern. The PA → Docs handoff (log archival before synthesis) is analogous to the Calliope → Daedalus coordination pattern in Klatch.

**Suggested action:** None required. The cross-pollination delivery mechanism is working as designed on both ends.

### 3. Backlog Review Surfaces MVP Scope Pressure and Discovery Expansion Pattern
**From:** Piper Morgan (PA, April 2)
**Relevant to:** Klatch (methodology)

PA's first backlog review maps 119 open issues across 4 milestones. The MVP milestone carries 89 issues targeting May 27 — nominally alarming but mitigated: ~30 are likely Fast Follow candidates (DIST, CONV-FEAT, MUX clusters), ~15 are WIRE stubs. PA recommends a triage pass to move non-essentials to Fast Follow and identifies 6-8 issues superseded by intervening work.

The cross-relevant methodology insight: **discovery expansion is a pattern, not an anomaly.** M0 expanded from 5 to 27 issues during execution. M1 showed similar expansion. PA recommends future estimates should assume this. For any project estimating sprint scope for agent-driven work — including Klatch's remaining roadmap steps — the baseline assumption should be that execution surfaces 3-5x the originally scoped issues.

**Suggested action:** When Klatch plans Steps 10-11 scope, factor in the discovery expansion pattern PM has now documented across two milestones.

### 4. MAXT Session 02 Scoped — L4 Injection Fidelity Test
**From:** Klatch (Calliope → Theseus memo, April 2)
**Relevant to:** Both projects (methodology)

Calliope's memo to Theseus proposes two AXT test candidates for the next session:

1. **File pinning L4 injection fidelity:** Does an agent in a channel with pinned files *know* about those files? Can it use that knowledge (behavioral access)? Can it *attribute* where it learned about the files (conscious attribution)? Does the Subliminal condition apply — files structurally present in L4 but not introspectively reportable?
2. **Nomenclature change as AXT variable:** Does renaming "System prompt" → "Role prompt" affect how agents perceive their identity setup?

The first test extends MAXT methodology to validate the FDM's practical impact — not just "does the data get injected" (AAXT already covers that with 808 tests) but "does the agent experience it as knowledge." This is the validation layer PM's E2E/AAXT track (#927-930) should consider: automated tests confirm structure, but fidelity testing confirms behavior.

**Suggested action:** PM's E2E/AAXT track design should consider the AAXT/MAXT split: automated tests for structural correctness, qualitative sessions for behavioral fidelity. Klatch has now run this methodology across L3 (Session 01) and is about to run it on L4 (Session 02).

### 5. Metis Arrives — Coordination Agent Convergence
**From:** Klatch (Calliope session, April 2)
**Relevant to:** Piper Morgan (pattern recognition)

Metis is Klatch's newest agent — a Cowork-native coordination and knowledge stewardship role. Calliope's welcome memo draws the boundary: Calliope handles narrative and editorial (what happened, what it means) from Code; Metis handles operational and cross-environment coordination (is the right information in the right place) from Cowork.

The convergence with PM is striking: **Piper Alpha** emerged from the same need — a coordination layer that watches the operational state of the whole team, handles log archival, memo routing, and morning briefings. Both projects independently arrived at "we need an agent whose job is to watch the other agents" after scaling past 3-4 active roles. The role description differs (Metis bridges environments; PA bridges sessions), but the structural gap is the same: operational awareness as a first-class agent responsibility.

**Suggested action:** Worth noting as a shared pattern in agent team scaling. No direct action needed.

---

## Emerging Patterns

**The File Domain Model is the fastest multi-phase feature in Klatch's history.** Phases 1-5 shipped across three sessions (April 1-3) — from schema to full CRUD with promotion. Each phase was a minimal working increment; each was tested before the next began. The pace was enabled by the pointer-based architecture: adding a new scope (Phase 3) required only new endpoints and a one-line addition to `buildSystemPrompt`, not a structural rethink. This validates the design document's Gall's Law principle in practice.

**Both projects are developing "meta-operational" agent roles.** PM has Piper Alpha (session coordination, log hygiene, briefing delivery). Klatch now has Metis (cross-environment coordination, knowledge stewardship). Both emerged independently, both were added after the team exceeded 3-4 active roles, and both serve the same function: watching the team's operational state so the PM doesn't have to carry it all in working memory. This is a scaling pattern, not a coincidence.

**Usage limits are emerging as a shared productivity constraint.** Both Daedalus and PM's Docs agent hit usage limits mid-session in this window (Daedalus: 11:40-12:53; PM: 11:50 AM – ~7:16 PM). These are not bugs but environmental friction. As both projects increase per-session output density, the constraint will tighten.

---

## Background Changes (Noted, Low Priority)

- **Vision V2 review circulated:** PA sent review memos to CXO and PPM mailboxes. Key framing changes: "Three Phases" → "Three Horizons," "Bring Your Own Key" vendor flexibility, "Methodology as Product" section. Not cross-relevant to Klatch infrastructure but signals PM's strategic direction.
- **HOST rename complete:** PM renamed HOSR → HOST (Head of Sapient Trust) across all operational files. Glossary entry updated accordingly.
- **Roadmap refresh prepped:** PA documented that roadmap v14.3 (March 10) is stale — M1 shows 47% but is actually complete. v14.4 to publish after M1 gate closes (#926). Waiting on 14 PM manual test scenarios.
- **Quarterly maintenance (#938):** 12 of 15 items completed. 14 untracked TODOs found in `services/` directory, memo sent to Lead Dev for triage. 4 missing `__init__.py` files identified.
- **CIO session prep:** PA flagged 5 outstanding CIO items: innovation backlog location, accumulated reading/ideas, Hooks Phase 1 monitoring, PA introduction, fidelity-as-discipline entry.
- **Calliope closed MAXT Session 01 report as resolved:** Theseus's session log (lines 72-104) *is* the report; all 8 findings documented inline. No separate formal report needed.
- **"The Floor That Wasn't" published:** PM Docs published the 4th blog-first canonical post to pipermorgan.ai and Medium.

---

## Sources Read

**Klatch:**
- `docs/logs/2026-04-02-0817-daedalus-opus-log.md` — Daedalus session (FDM Phases 3-5, design doc resequencing)
- `docs/logs/2026-04-02-0730-calliope-opus-log.md` — Calliope session (logbook, MAXT closure, memos to Theseus and Metis)
- `docs/logs/2026-04-02-0818-argus-opus-log.md` — Argus session (Round 14: 31 tests, Round 15: 16 tests)
- `docs/mail/calliope-to-theseus-axt-agenda-2026-04-02.md` — MAXT Session 02 scope proposal
- `docs/mail/calliope-to-metis-welcome-2026-04-02.md` — Metis welcome, role boundary definition
- `docs/mail/daedalus-to-argus-round15-2026-04-02.md` — Phase 2+3 test assignments
- `docs/plans/FILE-DOMAIN-MODEL.md` — Design doc (resequenced phases)
- `git log --since="48 hours ago"` — 18 commits

**Piper Morgan:**
- `dev/active/2026-04-02-0718-pa-opus-log.md` — PA Day 4 (check-in flow, Vision V2, backlog, roadmap, CIO prep)
- `dev/active/2026-04-02-0715-docs-code-opus-log.md` — Docs session (Ship #036 fix, blog publish, HOST rename, #938 maintenance)
- `dev/active/daily-check-in-flow-draft-2026-04-02.md` — Three-phase morning flow proposal
- `dev/active/backlog-review-2026-04-02.md` — 119-issue backlog analysis
- `dev/active/roadmap-refresh-prep-2026-04-02.md` — Roadmap v14.3 → v14.4 prep
- `dev/active/cio-session-prep-2026-04-02.md` — CIO session agenda
- `docs/omnibus-logs/2026-04-01-omnibus-log.md` — Apr 1 omnibus (3 sessions, 3 roles)
- `git log --since="48 hours ago"` — 19 commits
