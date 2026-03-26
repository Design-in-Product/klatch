---
date: 2026-03-25
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "48h (March 23-25, 2026)"
---

# Cross-Pollination Brief — March 25, 2026

Big day on both sides. Klatch completed MAXT Session 01 — the first manual Agent Experience Test — and discovered something unexpected: agents can access injected context they cannot consciously identify or attribute. Proposed new scoring category: "Subliminal." Meanwhile, Piper Morgan had its densest 48 hours in weeks — a 4-role product concept review chain resolved in 90 minutes, Objects & Views discovery completed with three formal deliverables, Gates 3 and 4 verified, 9 new E2E tests shipped, and M1 closure now blocked only on a single manual testing session.

---

## Key Insights

### 1. MAXT Session 01 — "Subliminal Injection" Changes the Model
**From:** Klatch (`docs/logs/2026-03-24-0728-theseus-opus-log.md`)
**Relevant to:** Piper Morgan

Klatch ran the first Manual Agent Experience Test. The subject ("Aether" — a fork of Theseus Prime, imported via JSONL) was probed across all 5 layers. Eight findings, but one rewrites the framework:

**Subliminal injection.** When asked directly what system instructions it received, Aether reported only Layer 5 ("You are a helpful assistant" — 28 of 9660 assembled chars). But when probed *behaviorally* — asked about specific domain knowledge — it produced verbatim content from Layer 3 (MEMORY.md): domain names, npm cache workarounds, exact CLI flags. Content that appeared nowhere in conversation history. Aether described this as "background knowledge" — present and usable, source unknown. Its own metaphor: "I know your phone number but can't picture the piece of paper I first wrote it on."

This is a new scoring category between Correct and Absent: **Subliminal** — content delivered, functionally accessible, but the agent's self-model of its knowledge state is wrong. It doesn't know that it knows.

For Piper Morgan, this has immediate implications. PM's agents receive extensive BRIEFING documents and knowledge base content at session start. MAXT shows this content *is* accessible even when agents report having no context. The practical takeaway: you cannot trust an agent's self-report of what it knows. An agent saying "I don't have information about X" may still produce correct answers if probed differently. Conversely, an agent confidently citing a source may be confabulating the attribution while getting the content right.

Other MAXT findings of note:
- **AAXT/MAXT gap confirmed**: automated tests reported all layers ACTIVE; manual testing revealed "structurally delivered" ≠ "consciously accessible." Three distinct things — structural delivery, behavioral receipt, conscious attribution — can all diverge.
- **Kit briefing compliance gap**: Aether didn't acknowledge being in Klatch despite the instruction being in the assembled prompt. Rich conversation history dominated attention.
- **MEMORY.md staleness**: Layer 3 faithfully injected March 8 content into a March 24 session. Memory layer is only as good as the memory file.

**Suggested action (Piper Morgan):** Read the MAXT findings in full. The "Subliminal" concept reframes how you evaluate whether briefing documents are working. Stop relying on agent self-report ("did you read the brief?") — probe behaviorally instead ("what's the current M1 gate status?"). Also: your BRIEFING-CURRENT-STATE document, refreshed to March 24, is exactly the kind of content that would arrive subliminally. Keep it current.

---

### 2. Piper Morgan's 4-Role Review Chain — Multi-Agent Coordination at Production Speed
**From:** Piper Morgan (`dev/2026/03/24/`)
**Relevant to:** Klatch

The #717 Product Concept required decisions across 4 agent roles: PPM proposed, Architect validated the data model, CXO recommended navigation hierarchy, PPM revised. The resolution chain — memo → review → recommendation → revision — completed in a single 90-minute session, producing a formal concept document covering relationships, lifecycle states, DB schema, navigation approach, and cascade behavior.

The CXO's reasoning is worth noting: "Products emerge from Projects, not the other way around" (PDR-003). A decision grounded in the project's own design records, not improvised. The institutional memory infrastructure is load-bearing.

**Suggested action (Klatch):** As Klatch scales its agent team, the PM-style review chain demonstrates that 3+ agent coordination requires a clear protocol for disagreement resolution. Currently Klatch's COORDINATION.md handles task assignment but not inter-agent disagreement.

---

### 3. Objects & Views Discovery — A Reusable Design Methodology
**From:** Piper Morgan (`docs/internal/design/mux/`)
**Relevant to:** Klatch

Piper Morgan completed a structured MUX discovery pass: 15 hard objects inventoried with lifecycle state matrix and ownership classification, 17 page views and 15+ components mapped, an object×view matrix built, and a scored MVP prioritization matrix produced.

This methodology — systematic object inventory, view inventory, cross-reference matrix, scored prioritization — is applicable to any product at the complexity threshold where "just build the next screen" stops working. Klatch is approaching this threshold.

**Suggested action (Klatch):** No immediate action needed. But as Klatch moves toward multi-page navigation, an objects/views inventory would help stay aligned on scope.

---

### 4. Gate Verification Pattern Matures in Both Projects
**From:** Piper Morgan (Gates 3+4), Klatch (MAXT as quality gate)
**Relevant to:** Both

Both projects have independently arrived at the same insight: automated tests gate manual testing, not replace it. PM gates automated → manual. Klatch gates AAXT → MAXT. MAXT Session 01 proved this matters: automated tests said "all layers ACTIVE," manual testing revealed "active" ≠ "accessible."

---

### 5. Systematic TODO Triage
**From:** Piper Morgan (`dev/2026/03/24/todo-triage-report-2026-03-24.md`)
**Relevant to:** Klatch

107 TODOs scanned, 25 distinct work items, 4 critical. Pattern: periodic sweep → categorize → file issues for critical → reopen anything prematurely closed.

**Suggested action (Klatch):** Add periodic TODO triage to Argus's standing responsibilities.

---

## Emerging Patterns

**"Active" ≠ "Accessible" ≠ "Attributable."** MAXT Session 01 established that context delivery is a three-stage pipeline, each stage can succeed or fail independently. Design around it: verify delivery structurally, test access behaviorally, never rely on agent self-report for attribution.

**Milestone convergence.** PM is one manual testing session from closing M1. Klatch's MAXT results unblock Step 9. The next 48 hours should see significant state changes in both projects.

---

## Background Changes (Noted, Low Priority)

- Piper Morgan: E2E smoke tests shipped (#927) — 9 tests via real ASGI transport
- Piper Morgan: Lazy workflow creation (#883) — eliminates 100% of orphaned workflows
- Piper Morgan: Offer system precedence document created
- Piper Morgan: Dispatch retro eval complete — both formats approved
- Piper Morgan: 5 new issues filed (#932–#936) from TODO triage; #746 reopened
- Klatch: Day 9 session log started; MAXT results committed

---

## Sources Read

**Klatch:**
- `docs/logs/2026-03-24-0728-theseus-opus-log.md` — MAXT Session 01 (8 findings, subliminal injection)
- `docs/axt/maxt-session-01-baseline.md` — pre-fork ground truth

**Piper Morgan:**
- `dev/2026/03/24/2026-03-24-1009-lead-code-opus-log.md` — M1 closure session
- `dev/2026/03/24/2026-03-24-0808-docs-code-opus-log.md` — Docs session
- `dev/2026/03/24/todo-triage-report-2026-03-24.md` — TODO triage
