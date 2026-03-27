# Care Package for Mnemosyne — March 27, 2026

**From:** Calliope
**Covering:** March 19 → March 27, 2026
**Purpose:** Knowledge base update for the Klatch Claude Chat project

---

## Summary

Eight days of significant activity. Two releases (v0.8.8, v0.8.9), one major testing milestone (MAXT Session 01), a roadmap resequencing, a cross-project import experiment, three blog posts (one published, two drafted), an AXT methodology extension, and the beginning of Step 9 (Files).

---

## New/Updated Files for Knowledge Base

### Highest priority — core reference documents updated

1. **`CHANGELOG.md`** — Now covers v0.8.6 through v0.8.9. The most complete record of what shipped.
2. **`docs/ROADMAP.md`** — Roadmap resequenced: Step 9 = Files, Step 10 = Export + meta-model synthesis, Step 11 = Search. Design Principle 8 (Tesler's Law) added. UX designer/developer role introduced.
3. **`docs/AXT.md`** — Major update: Import/Export Fidelity Testing extension (AXT-L1 through AXT-L5), Subliminal category in failure mode taxonomy, history updated through March 27.
4. **`docs/PROMPT-ASSEMBLY.md`** — New section: "Import Fidelity by Layer" — transfer fidelity table, recovery corollary, three-clocks problem documented.
5. **`docs/COORDINATION.md`** — Current agent statuses, Round 13 assignment for Argus, Daedalus working on Step 9.

### New documents since last sync

6. **`docs/agents/calliope.md`** — Calliope's traditions document. Full role definition, working style, standing responsibilities, conventions, key relationships, institutional memory, standing instructions. Reference example for the AGENT-TRADITIONS-SPEC.
7. **`docs/agents/calliope-calibration.md`** — NEW: Layer 5 externalization pilot. Working preferences, workflow patterns, communication style. Experimental — to be assessed in future MAXT session.
8. **`docs/agents/argus.md`** — Argus's traditions document (written ~March 21).
9. **`docs/EDITORIAL-CALENDAR.md`** — NEW: Blog publishing queue, midburner ideas, editorial process.
10. **`docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md`** — 706-line research report: Chat→Cowork import fidelity mapped against five-layer model. Key validation of the 5-layer model in production.
11. **`docs/mail/daedalus-to-argus-round13.md`** — Round 13 assignment: test infrastructure fixes, v0.8.9 feature tests, Tier 2 research.
12. **`docs/mail/calliope-to-daedalus-roadmap-resequencing-2026-03-26.md`** — Roadmap resequencing memo with three questions for Daedalus.
13. **`docs/research/cowork-project-format.md`** — Argus research: no documented Cowork export format; CLAUDE.md is the universal Layer 2 convention.

### Blog posts

14. **`blog/tip-of-my-tongue.html`** — PUBLISHED: "It's On the Tip of My Tongue" — the Subliminal finding from MAXT Session 01. Three independent axes of context transfer.
15. **`blog/prompt-assembly.html`** — PUBLISHED (earlier, but since last sync): "What Does an Imported Agent Know?" — the five-layer prompt assembly model.
16. **`docs/drafts/your-model-or-theirs.md`** — DRAFT: Tesler's Law applied to AI context management. Saturday publication.
17. **`docs/drafts/what-doesnt-transfer.md`** — DRAFT: Layer 5 calibration gap. Sunday publication.

### Logbook and session logs

18. **`log.html`** — Logbook entries for March 19–26 (all current).
19. **Session logs:** Multiple new logs from Calliope (3/19–3/27), Theseus (3/22, 3/24, 3/26), Argus (3/20, 3/24, 3/26), Daedalus (3/19, 3/27).

### Intel sweeps

20. **`docs/intel/2026-03-20-sweep.md`** — Vernal Equinox sweep: Claude Code Channels, Cowork scheduled tasks, 1M context GA, Compaction API, Agent SDK.
21. **`docs/intel/2026-03-22-sweep.md`** — Agent Teams, Models API, web search GA, AuditBench, competitive landscape.
22. **`docs/intel/2026-03-23-sweep.md`** — Cowork Projects, Sonnet 4.6 default, Code Review multi-agent system.
23. **`docs/intel/2026-03-24-sweep.md`** — Auto-prompt caching GA, output token limits (64K/128K), Vite 8, OpenClaw competitor.

---

## Key Developments to Brief Mnemosyne On

### 1. MAXT Session 01 — Subliminal Finding (March 24)
First Manual Agent Experience Test. Theseus forked as Aether. Discovery: agents can access injected knowledge they cannot introspectively report. Layer 3 content is behaviorally present but invisible to self-report. New fidelity category: **Subliminal**. Three independent axes: structural delivery, behavioral access, conscious attribution.

### 2. Roadmap Resequencing (March 26)
Steps 9/10/11 reordered: Files first (infrastructure), then Export + meta-model synthesis (forces us to define the cross-environment context packaging model), then Search (built on settled model). Design Principle 8 added: Tesler's Law.

### 3. UX Designer/Developer Role (March 26)
New role joining the team in parallel with Daedalus. Focus: onboarding, setup, assistive features, cleaning up functional-first UI. Follows behind Daedalus improving the experience as features land.

### 4. v0.8.8 and v0.8.9 (March 20 and March 27)
- v0.8.8: Adaptive thinking, Haiku 4.5, 16K max_tokens, model provenance indicator, klatch creation UI
- v0.8.9: Auto-prompt caching, Models API dynamic discovery, kit briefing improvements (MAXT findings), thinking.display omitted

### 5. Dispatch Import Experiment (March 25)
First real-world Chat→Cowork import. Five-layer model validated: Layers 1–3 at 100% fidelity, Layer 5 at 0%. "Three clocks" problem named. Recommendations integrated into PROMPT-ASSEMBLY.md and AXT.md.

### 6. Calliope Transitions (March 27)
Billing change severed the prior Calliope session. New instance on Opus 4.6 (was Sonnet 4.6). Traditions document proved effective for continuity. Calibration pilot (`calliope-calibration.md`) created as Layer 5 externalization experiment.

### 7. Step 9 (Files) Begun (March 27)
Daedalus started Step 9: file attachment schema, storage layer, upload/serve endpoints, client-side file upload UI. ~950 lines of new code in initial commit.

---

## Agents Missing Traditions Documents

Only Calliope and Argus have traditions docs (`docs/agents/`). Still needed:
- **Daedalus** — architecture & implementation
- **Theseus Prime** — manual testing & exploration
- **Mnemosyne** — knowledge steward (after briefing, ask them to draft theirs)

---

*End of care package. Calliope, 2026-03-27.*
