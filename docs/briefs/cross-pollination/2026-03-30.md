---
title: "Cross-Pollination Brief — March 30, 2026"
date: 2026-03-30
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "72h (March 27-30, 2026)"
---
---

# Cross-Pollination Brief — March 30, 2026

Both projects active after the 96-hour quiet window noted in the March 29 brief. Piper Morgan broke the silence decisively — 21 commits across March 28-30 establishing a complete blog-first publishing workflow through two real publishes. Klatch had no new commits but March 27 memos (Daedalus→Argus, Daedalus→Calliope) and an approved design doc were not fully covered in prior briefs. The most cross-relevant signal: Piper Morgan's discovery that schema drift causes **silent** import failures, and Klatch's Compaction API research spike — both projects are circling the same core problem of what survives transfer between contexts.

---

## Key Insights

### 1. Schema Drift as Silent Failure — CSV Field Count Broke Publishing Pipeline
**From:** Piper Morgan (session logs, March 29)
**Relevant to:** Klatch

Piper Morgan's second blog-first publish ("Wiring vs. Wizardry") surfaced a critical pattern: the editorial calendar CSV had grown from 11 to 13 columns after adding `altText` and `caption` fields. The website's CSV parser expected 11. **No error was thrown** — the parser silently returned an empty array. The bug only surfaced on the second publish, two days after the schema changed.

This is a canonical import/export hazard. Klatch's conversation import pipeline handles JSONL from Claude Chat exports, system prompts from metadata.json, and memory files from project snapshots. If any of those formats add fields (as Anthropic iterates on export schemas), a fixed-expectation parser will fail silently. The fix pattern: explicit field count validation, schema version headers, or structural assertions at parse time.

**Suggested action:** Klatch should audit its import parsers for fixed-schema assumptions. Defensive validation at the parse boundary is cheaper than debugging silent data loss after the fact.

### 2. Compaction API and Effort Parameter Research — Klatch Building Systematic Fidelity Testing
**From:** Klatch (`docs/mail/daedalus-to-argus-round13.md`, March 27)
**Relevant to:** Piper Morgan

Daedalus assigned Argus two Tier 2 research spikes: **Compaction API evaluation** (issue #18) and **Effort parameter evaluation** (issue #17). The Compaction API spike specifically asks: what survives compaction? How do you tune thresholds? Does multi-entity context (roundtables with multiple agents) survive the compression? Can compaction be optional per-channel?

This connects directly to the three-factor fidelity model confirmed in Theseus's verification memo: (1) no project context injection, (2) compaction loss on long conversations, (3) knowledge location (in-chat vs. tool-accessed). Klatch is building AXT-layer methodology to measure what each factor costs.

**For Piper Morgan:** Your agents work in long sessions that accumulate significant context. If the Compaction API becomes available in Claude Code sessions, the same fidelity questions apply — which briefing content survives compaction, and which gets silently dropped? Klatch's research will produce methodology you can reuse. Worth tracking.

**Suggested action:** PM Docs or CIO should bookmark Klatch issues #17 and #18. When findings are published, evaluate applicability to PM's session context management.

### 3. Blog-First Publishing Pipeline Paved — Iterate-After-Ship Pattern Validated
**From:** Piper Morgan (March 28-29, 4 commits)
**Relevant to:** Klatch (methodology)

Piper Morgan shipped two blog-canonical publishes in two days ("Discovery is the Bottleneck" and "Wiring vs. Wizardry") and delivered four artifacts: `/update-calendar` skill v1.0, `/publish-to-blog` v0.3, a blog-first publish checklist, and a web team memo. The approach was explicitly iterate-after-ship: execute the first publish with MVP tooling, capture real bugs, then refine.

Four real bugs surfaced that prediction would not have caught: CSV field count mismatch, Medium link conditional on GUID presence, image CDN paths needing conversion to local webp, and sync script fragility. Each was fixed between publishes.

**For Klatch:** This is methodologically relevant for the import/export pipeline. The dispatch report (covered in the March 29 brief) mapped the fidelity profile theoretically. When Klatch ships its first export-to-Code feature (Step 11 on the roadmap), running it against real conversations and iterating on actual failures will surface issues that design docs cannot predict — just as PM's first publish did.

**Suggested action:** File this pattern as a methodology note for when Step 11 enters implementation.

### 4. Nomenclature Collision — "System Prompt" Means Different Things
**From:** Klatch (`docs/mail/daedalus-to-calliope-round12-reply-2026-03-27.md`)
**Relevant to:** Both projects

Daedalus flagged a UX terminology problem: in Klatch's UI, "system prompt" currently maps to Layer 4 (channel addendum), but users expect it to mean Layer 5 (entity prompt). Calliope and xian are assigned to produce a **Klatch nomenclature guide** — terminology for the five-layer model that doesn't collide with Claude Code, claude.ai, or Cowork equivalents.

This matters for both projects. Piper Morgan uses "entity roles," "briefing," and "contexts" — its own distinct vocabulary. If the projects ever share infrastructure (import/export, cross-project dispatch, shared agent definitions), terminology alignment will be necessary. The nomenclature guide is the right time to coordinate.

**Suggested action:** When Klatch's nomenclature guide draft is ready, route a copy to PM for review. Early alignment is cheaper than retrofit.

### 5. Session Wrap Discipline — Stranded Branches Are Invisible Work
**From:** Piper Morgan (methodology docs, March 28 session logs)
**Relevant to:** Klatch

Piper Morgan codified a lesson from the service disruption gap: **stranded branch commits are invisible** to future sessions and other agents. The solution is a non-negotiable session wrap rule: all work must be committed and pushed to `origin/main` before sign-off. The March 28 session explicitly recovered stashed and stranded work from the gap period.

**For Klatch:** The multi-agent team (Daedalus, Argus, Calliope, etc.) operates in discrete sessions. If any agent leaves work on a local branch or uncommitted, the next agent picking up the thread cannot see it. This is especially relevant during high-velocity periods like the Step 9 sprint. The bookend-sync protocol (noted in the March 24 brief) partially addresses this, but PM's explicit "nothing stranded" rule is simpler and more enforceable.

**Suggested action:** Consider adding a session-end checklist item to Klatch agent traditions: verify all work is on `main` and pushed.

---

## Emerging Patterns

**Both projects are converging on fidelity-as-discipline.** Klatch is building testing methodology (AXT-per-layer, Compaction API research, three-factor fidelity model) to systematically measure what survives context transfer. Piper Morgan is discovering the same problem empirically — schema drift causes silent failures, knowledge files need explicit migration checklists, session state must be committed or it vanishes. Neither project set out to study "fidelity" as a first-class concern; both arrived there through operational experience. The term deserves formal treatment.

**The quiet period ended asymmetrically.** Klatch remains in a holding pattern (no commits since March 27), while Piper Morgan produced 21 commits in 48 hours. This is normal — projects have different rhythms. But it means Klatch's next active session will have a backlog of PM insights to absorb (this brief, plus the March 29 brief the team hasn't seen yet).

---

## Background Changes (Noted, Low Priority)

- **Piper Alpha Phase 0 complete:** New team member onboarding into PM with Claude Code as initial environment, Cowork later. Briefing v0.2 incorporates decision frameworks from PAPM (Play Acting Piper Morgan). Not yet cross-relevant to Klatch.
- **#931 weekly docs audit closed** in PM with evidence comment and completion matrix. Staggered audit calendar updated — next due April 14.
- **Anthropic account infrastructure transition:** New Claude Chat project on xian@designinproduct.com, new Cowork space with multi-repo access. Opens future possibilities for cross-repo skill execution.
- **Theseus verification memo** (dated March 22, filed March 30): Confirms three-factor fidelity model and Day 4 testing accuracy. Already incorporated into Insight #2 above.

---

## Sources Read

**Klatch:**
- `docs/plans/FILE-DOMAIN-MODEL.md` — approved design doc (March 27)
- `docs/mail/daedalus-to-calliope-round12-reply-2026-03-27.md` — architecture decisions, nomenclature gap
- `docs/mail/daedalus-to-argus-round13.md` — test audit + Tier 2 research spikes
- `docs/mail/read/theseus-to-calliope-logbook-reply.md` — three-factor fidelity verification
- `docs/logs/` — latest: 2026-03-27 (no new sessions)
- `docs/intel/` — latest: 2026-03-24 sweep
- `git log --since="48 hours ago"` — no commits

**Piper Morgan:**
- `dev/2026/03/30/2026-03-30-0634-docs-code-opus-log.md` — session log
- `dev/2026/03/29/2026-03-29-1037-docs-code-opus-log.md` — session log
- `dev/2026/03/29/docs-handoff-2026-03-29.md` — handoff memo
- `dev/2026/03/28/2026-03-28-1722-ppm-opus-log.md` — PPM session
- `dev/2026/03/28/2026-03-28-1840-docs-code-opus-log.md` — Docs session
- `docs/omnibus-logs/2026-03-28-omnibus-log.md` — 3-session synthesis
- `docs/omnibus-logs/2026-03-29-omnibus-log.md` — 1-session synthesis
- `docs/briefing/BRIEFING-CURRENT-STATE.md` — refreshed March 29
- `docs/internal/planning/current/vision.md` — current planning
- `git log --since="48 hours ago"` — 21 commits
