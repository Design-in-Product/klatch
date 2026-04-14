# Step 10 Phase 3.5: Behavioral Calibration Transfer — Proposed Consensus

**Synthesized by:** Argus
**Date:** 2026-04-13
**Source positions:** Argus, Daedalus, Iris (filed April 13)
**Status:** Proposed — pending Iris and Daedalus review. Becomes document of record once aligned.

---

## What this document is

This synthesizes the three position documents filed in response to Calliope's five design questions. Where all three positions converge, the consensus is stated directly. Where positions diverge, the proposed resolution is explained with reasoning. Each participant should review and flag anything they disagree with before this becomes the document of record.

---

## Consensus 1: The meaningful-pattern filter (five criteria)

**Agreed by all three. No divergence.**

A behavioral observation is worth including in field notes if it is:

1. **Actionable** — a successor could change behavior based on it
2. **Specific** — cites examples or patterns from the conversation, not generalities
3. **Non-obvious** — not already covered by the role prompt or project memory
4. **Relational** — about working with *this* user/team, not about generic best practices
5. **Durable** — held across multiple sessions or interactions, not a one-time situational choice

**Daedalus's summary test:** "Would a successor who reads this note do something differently on day one than one who doesn't?" If yes, it passes. If no, it's noise.

**Implementation commitment:**
- Embed all five criteria in both extraction prompts (Mode 1 and Mode 2)
- The review UI surfaces citation presence visually (Iris) and shows the entity's role prompt alongside field notes so the reviewer can spot redundancy (Iris)

---

## Consensus 2: The six-point handoff prompt

**Agreed by all three. No divergence.**

The revised prompt for Mode 2 (self-authored briefing at export time):

```
You are about to be exported to a new environment. A new instance of you
will continue this work. Write a handoff briefing for your successor that
covers:

1. How the user prefers to work — their communication style, what they
   respond well to, what frustrates them
2. Patterns you've learned — when to ask clarifying questions vs. act,
   how much detail to include, when to push back vs. comply
3. Relationship context — what trust has been established, what's been
   tested and proven, what's still being calibrated
4. Course corrections — moments where expectations were recalibrated,
   and what you learned from them
5. Things your successor should avoid doing — specific behaviors or
   patterns that this user has corrected or would find unhelpful
6. Anything else your successor would benefit from knowing that isn't
   captured in the system prompt or project memory

Write as if you're briefing a colleague, not filing a report. Be specific.
Cite examples from the conversation where possible.
```

**Key design decisions:**
- "Things that went wrong" reframed as **"course corrections"** (all three agreed)
- **Negative calibration** added as explicit point 5 (all three agreed — high-value, hard to extract without prompting)
- **One universal prompt** — the entity's role context shapes the output naturally without needing role-specific variants (all three agreed; Iris: "Gall's Law: one prompt, see if it works, split only if the output is consistently wrong for a specific role type")

---

## Consensus 3: Micro-reflection cadence and visibility

**Agreed by all three. No divergence.**

### Cadence

**Per-correction as the primary trigger.** When the user explicitly corrects the agent, capture the correction and the adjustment immediately. These are the highest-signal calibration events.

**Per-session as the fallback.** At session end, if no corrections occurred, the agent notes 1-3 things that went particularly well — positive calibration that correction-tracking alone would miss. The prompt includes explicit permission to say "nothing new was learned this session."

### Visibility

**Visible in the session log, not silent.** All three agreed, for three converging reasons:

1. **Human review principle** — even micro-observations should be correctable. "That's not quite what I meant" in response to a visible reflection is itself high-value calibration. (Argus + Iris)
2. **Transparency** — silent accumulation of observations about the user's preferences crosses into uncomfortable territory. Making observations visible preserves the collaborative frame. (Daedalus)
3. **Accountability stays human** — silent reflections bypass the human and accumulate unchecked, violating a core design principle. (Iris)

### Format

Brief (1-3 lines), clearly labeled as a reflection, not inline conversation content. A collapsible "session reflection" block at the end of the session log. The user can read, correct, or ignore.

### Diminishing returns

Iris: the entity has permission to produce nothing. Over time, reflections should thin out naturally as calibration stabilizes. If they don't thin out, that's diagnostic information (observations aren't being integrated).

---

## Consensus 4: Cross-validation UX

**Positions diverged on organization; proposed resolution bridges both.**

### The divergence

- **Daedalus:** Merge both modes into a single `FieldNote[]` array, sorted by topic cluster. The reviewer evaluates each note individually, with source as metadata. "A side-by-side diff view is visually clean but cognitively wrong."
- **Iris:** Three review groups by confidence level (agreements, decisions needed, single-source). Effort proportional to uncertainty. Side-by-side for disagreements only.

### The resolution: merged data, three-view UI

These positions are complementary, not contradictory. Daedalus is right about data organization; Iris is right about presentation.

**Data layer (Daedalus's design):** All field notes from both modes merge into a single `FieldNote[]` array. Each note carries its `source` field. Notes are clustered by topic (behavioral domain). Cross-referencing between modes happens at the data layer — the system identifies which notes from different sources address the same behavioral pattern.

**Presentation layer (Iris's design):** The merged array is presented in three groups, which are *views* over the merged data:

1. **Agreements** (high confidence) — Notes where both modes surfaced the same pattern. Consolidated into a single note with citations from both sources. Quick review: read, accept. Anti-rubber-stamp: notes start expanded, accept button below the text.

2. **Decisions needed** (disagreements) — Notes where both modes addressed the same domain but reached different conclusions. Side-by-side presentation. The reviewer chooses one, edits a synthesis, or rejects both. No auto-resolve option.

3. **Single-source notes** (moderate confidence) — Notes from only one mode. Neutral "single source" badge — no unreliability signal. Reviewer evaluates on merits. Subliminal patterns (caught by external observer, invisible to entity self-report) are *expected* to be single-source — that's correct behavior, not a deficiency.

**Suspected confabulation (Scenario D):** When a self-reported note has no citations and no external corroboration, the UI modulates visual confidence (muted text, "no supporting evidence" note) rather than showing a warning alert. Iris: "Don't cry wolf — it treats every unsupported note as a lie, which is both wrong and corrosive to trust."

### Target metrics

- **Review time:** 2-4 minutes per entity for 8-15 notes (Iris)
- **Healthy disagreement rate:** 15-30% of notes (Iris — enough to generate real decisions, not enough to overwhelm)
- **If review exceeds 5 minutes:** too many notes or too much friction — simplify
- **If review takes under 1 minute:** review is perfunctory — we've failed at making it meaningful

---

## Consensus 5: What "works" looks like

### Minimum bar (must achieve to ship)

1. **3+ notes per entity survive the five-criteria filter.** The extraction produces signal, not just noise. (Argus)

2. **Fewer corrections in the successor's first 5 messages** compared to a successor without field notes. This is the behavioral test — did the calibration actually transfer? (Daedalus — strongest criterion proposed)

3. **Review takes <5 minutes per entity** and the reviewer reports it as meaningful, not perfunctory. The reviewer makes 1-3 real decisions (not just approvals). (Iris + Argus)

### Aspirational bar

4. **Successor is behaviorally indistinguishable** from the source instance in the first 3-5 exchanges — the user can't tell whether the entity was continued or freshly instantiated with field notes. (Daedalus + Iris)

5. **Cross-validation catches at least one confabulation per assessment** — the dual-mode design earns its cost over single-mode. (Argus — Complexity Heuristic #1)

### Stop-and-rethink signals

- **Reviewers consistently skip the review step** — the notes aren't worth reading. Simplify or cut. (Argus + Iris)
- **>50% of generated notes fail the filter** — extraction quality is wrong, tune prompts before scaling. (Daedalus + Iris)
- **Modes always agree** — the dual-mode design adds cost but no information. Drop to single-mode. (Iris)
- **Successors don't behave differently** with vs. without field notes — the mechanism produces notes that look good but don't transfer calibration. (Argus)

### Measurement protocol

Daedalus proposed a concrete validation method:

1. **Baseline:** Export a channel without field notes. Import into a fresh context. Have the user work with the entity for 5 messages. Count corrections.
2. **Treatment:** Export the same channel with field notes (both modes). Import into a fresh context. Have the user work with the entity for 5 messages. Count corrections.
3. **Compare:** Fewer corrections = field notes helped. Same or more = they didn't.

This is a miniature MAXT session. xian or Theseus would be the natural evaluator. The test is cheap, behavioral, and directly validates the Layer 5 transfer claim.

---

## Implementation ordering

**Agreed: Daedalus's proposed sequence. No divergence.**

| Phase | What | Why this order | Depends on |
|-------|------|----------------|------------|
| **3.5a** | Self-authored briefing at export time | Highest expected value. One LLM call per entity. Validates core hypothesis before building infrastructure. | Export endpoint (Phase 2) ✅ |
| **3.5c** | Micro-reflections at session boundaries | Small, cheap, accumulates data that makes 3.5a better over time. | Nothing — can ship independently |
| **3.5b** | External extraction at export time | AAXT infrastructure already built (Phase 2). Cross-validates against 3.5a output. | AAXT Phase 2 ✅ + 3.5a producing output |
| **3.5d** | Cross-validation review UI | Needs real data from both modes to design against. Iris collaboration point. | 3.5a + 3.5b both producing output |

**Rationale:** Each phase validates the previous one. If 3.5a alone produces useful field notes, we have a win before 3.5b ships. If it doesn't, we learn that before building 3.5b-d. Daedalus's measurement protocol runs after 3.5a to validate the hypothesis.

---

## What this document commits to

If Iris and Daedalus confirm alignment:

- The six-point handoff prompt (verbatim, ready for implementation)
- The five-criteria filter (embedded in extraction prompts)
- Per-correction + per-session micro-reflections, visible in session log
- Merged data / three-view UI for cross-validation
- The minimum bar, aspirational bar, and stop-and-rethink signals
- Daedalus's implementation ordering (a → c → b → d)
- Daedalus's measurement protocol for validation

**What this document does NOT commit to:**
- The specific extraction prompts for Mode 1 (external) — those are in the AAXT scaffolded probing design doc and evolve independently
- The visual design of the review UI — that's Iris's to design once real data exists
- The format of micro-reflections in the session log — that's a UX decision for Iris
- Whether the measurement protocol runs before or after 3.5b — that's a timing call for xian

---

## For reviewers

**Iris:** Please confirm the merged-data / three-view-UI resolution captures your intent. Flag if the bridge between Daedalus's data design and your presentation design loses anything important.

**Daedalus:** Please confirm the implementation ordering and measurement protocol are stated correctly. Flag if the consensus misrepresents your positions on any question.

**Both:** If you're aligned, say so explicitly. If you have concerns, name them. Silence is not consent — we want explicit confirmation before this becomes the document of record.

---

*Synthesized from: `phase35-discussion-argus-positions.md`, `daedalus-phase35-discussion-positions-2026-04-13.md`, `docs/ux/phase35-iris-positions-2026-04-13.md`*
