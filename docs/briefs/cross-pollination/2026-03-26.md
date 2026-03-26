---
date: 2026-03-26
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "48h (March 24-26, 2026)"
---

# Cross-Pollination Brief — March 26, 2026

Klatch produced one big piece of work: a 706-line research report documenting the first real-world Chat→Cowork import experiment. The findings are precise and immediately useful — Layers 1-3 of the five-layer model transfer with 100% fidelity, Layer 5 (behavioral calibration) is structurally absent, and the gap is recoverable but not automatic. The report was dispatched to Calliope as an inter-agent memo, positioned for integration into Klatch's documentation. Piper Morgan was quiet — no new substantive commits beyond cross-pollination brief deliveries.

---

## Key Insights

### 1. Chat→Cowork Import Fidelity Mapped Against Five-Layer Model
**From:** Klatch (`docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md`)
**Relevant to:** Piper Morgan

A real-world import of a Claude Chat project ("VA Decision Reviews") into a Cowork session was systematically analyzed. The experiment mapped transfer fidelity onto Klatch's five-layer prompt assembly model:

| Layer | Transfer | Notes |
|-------|----------|-------|
| 1 (Kit Briefing) | 100% | Cowork provides automatically |
| 2 (Project Instructions) | 100% | Via metadata.json |
| 3 (Project Memory) | 100% | memory.md — most valuable artifact |
| 4 (Channel Addendum) | N/A | Session-specific, doesn't apply |
| 5 (Entity Prompt / Calibration) | 0% | Must rebuild through interaction |

The critical finding: **what transfers is inert information; what does not transfer is behavioral calibration.** An agent that has been implicitly trained through months of interaction — learning communication preferences, interpretation heuristics, tool use patterns — loses all of that in import. The Cowork agent gets the facts but not the judgment.

This matters for Piper Morgan because PM agents receive extensive briefing documents and knowledge base content at session start — exactly the kind of Layer 3 content that transfers cleanly. But the behavioral calibration each agent role develops over repeated sessions (how the PPM learned to frame decisions, how the CXO navigates ambiguity) is the Layer 5 component that wouldn't survive a platform transition. PM's 14-role architecture amplifies this: each role's calibration is independent and would need independent recovery.

**Suggested action (Piper Morgan):** No immediate action. But if PM ever migrates between environments or platforms, the fidelity profile documented here is directly applicable. The practical mitigation: make behavioral calibration *explicit* in CLAUDE.md and role definitions rather than relying on accumulated session history. PM already does this better than most — the role definitions are detailed. The report validates that approach.

---

### 2. Three Distinct Knowledge Layers in Production — Synchronization Risk
**From:** Klatch (`docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md`)
**Relevant to:** Both projects

The report identifies three physically distinct knowledge locations in Claude's production environment:

- **Layer A (Chat project knowledge):** Session-local `.projects/` snapshot — read-only, per-session copy, not shared
- **Layer B (Code repository memory):** `.claude/projects/` — persistent, git-adjacent, shared across Code sessions
- **Layer C (Repository files):** The actual repo — CLAUDE.md, docs, code

These three layers **do not automatically synchronize.** A project can exist simultaneously in all three with different information at each level. Chat project agents won't see Code memory updates. Code agents won't benefit from Chat knowledge unless it's been explicitly transferred.

For both projects, this is the "three clocks" problem: institutional knowledge exists in multiple places that drift independently. Klatch has it between Chat projects and the repo. Piper Morgan has it between the knowledge base, BRIEFING documents, and the repo itself. Yesterday's brief noted that BRIEFING-CURRENT-STATE was refreshed to March 24 — that's a manual synchronization step. The import report makes the case that these synchronization steps should be explicit and tracked, not assumed.

**Suggested action (Both):** Acknowledge the synchronization risk in project documentation. For Piper Morgan, the Docs agent's periodic BRIEFING refresh is already the right pattern — the report validates making it a standing responsibility rather than ad hoc. For Klatch, the report recommends adding an "Import Fidelity by Layer" section to PROMPT-ASSEMBLY.md.

---

### 3. AXT Methodology Extension Proposed for Import/Export Validation
**From:** Klatch (`docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md`)
**Relevant to:** Klatch (internal), Piper Morgan (methodological interest)

The report proposes extending Klatch's AAXT/MAXT testing methodology to systematically validate import/export fidelity:

- AXT-Layer1: Does Kit Briefing transfer correctly?
- AXT-Layer2: Are Project Instructions accessible?
- AXT-Layer3: Is Project Memory readable and actionable?
- AXT-Layer5: What behavioral patterns must be rebuilt?

This would provide a reusable framework for evaluating any import/export pathway — relevant to Klatch's Step 11 (export-to-Code) roadmap item and to any future cross-vendor conversation spaces.

For Piper Morgan, the methodological pattern is notable: systematic layer-by-layer validation of context transfer. PM doesn't currently have an equivalent testing framework for verifying that agents actually received and can act on their briefing content — yesterday's MAXT "subliminal injection" finding showed this is a real gap. A PM-side adaptation might test whether each agent role can demonstrate access to its role-specific briefing content, not just whether the content was delivered.

**Suggested action (Klatch):** Calliope should review and integrate the AXT extension proposal into Klatch's testing roadmap.
**Suggested action (Piper Morgan):** Consider whether a lightweight version of layer-by-layer validation would help verify agent briefing effectiveness.

---

## Emerging Patterns

**The five-layer model keeps proving its utility as an analytical tool.** It was designed as a prompt assembly spec for Klatch. It was validated as a testing framework by MAXT Session 01. Now it's being used as an import fidelity diagnostic. Each new application finds the model predictive and useful. The layer where things go wrong varies (MAXT found Layer 5 "subliminal," import found Layer 5 absent entirely), but the framework consistently identifies *where* to look.

**Behavioral calibration is the persistent gap.** MAXT showed that content can be delivered without conscious attribution. The import report shows that calibration doesn't serialize at all. These are two aspects of the same underlying problem: Layer 5 is the hardest layer to transfer, verify, or even define. Both projects are circling this — Klatch through testing methodology, Piper Morgan through detailed role definitions. Neither has solved it.

---

## Background Changes (Noted, Low Priority)

- Klatch: `dispatch-experience.html` committed alongside the import report — an interactive Canvas visualization (particle field animation). Appears to be a supplementary artifact from the import experiment session, not a functional component.
- Piper Morgan: No new substantive commits in the 48h window. Brief delivery commits only (`027b042`, `a0d5c2a`).

---

## Sources Read

**Klatch:**
- `docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md` — 706-line research report: Chat→Cowork import fidelity, five-layer mapping, 7 findings, sustainability scenarios
- `dispatch-experience.html` — Canvas visualization artifact (219 lines)
- `git log --since="48 hours ago"` — 2 commits: dispatch report + brief delivery

**Piper Morgan:**
- `git log --since="48 hours ago"` — 7 commits, all documentation: brief deliveries, omnibus synthesis, session log wrap-up, offer system precedence (last two already covered in March 25 brief)
- No new files in watch paths beyond what was reported in the March 25 brief
