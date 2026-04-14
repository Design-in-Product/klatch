# Phase 3.5 Design Discussion: Iris's Positions

**Date:** 2026-04-13
**Re:** `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md` + Calliope's prep memo
**Role in discussion:** Review UX, FieldNote schema, cross-validation design

---

## Question 1: What counts as a meaningful behavioral pattern?

*Not my primary question, but I have a UX-shaped take.*

The four candidate criteria (actionable, specific, non-obvious, relational) are the right filter. But they're also the criteria the **review UI needs to help the user apply.** The user shouldn't have to hold this mental checklist — the UI should make it easy to spot which notes meet the criteria and which don't.

Concretely:
- **Actionable** is testable: does the note suggest a behavior change? "Asks clarifying questions before committing" → yes, a successor knows to do the same. "Uses markdown formatting" → no, that's cosmetic.
- **Specific** is visible: does the note cite messages? Notes with citations feel grounded. Notes without citations feel like assertions. The UI should make the presence or absence of citations visually obvious.
- **Non-obvious** requires context: the UI should show the entity's role prompt alongside the field notes so the reviewer can ask "does this note say something the role prompt already says?" If yes, it's redundant. If no, it's genuinely learned.
- **Relational** is the hardest to surface. "Prefers terse responses" is relational. "Uses bullet points" is stylistic. The UI probably can't distinguish these — this is where human judgment is irreducible.

**My recommendation for the extraction prompts:** Include the "actionable, specific, non-obvious, relational" criteria in both the handoff prompt (Mode 2) and the external extraction instructions (Mode 1). Let the LLMs self-filter. Then the review UI handles what gets through.

## Question 2: The handoff prompt

*Not my primary question, but two UX observations.*

**On "things that went wrong":** Reframe as "course corrections" — it's more accurate (a correction is a learning moment, not a failure) and less likely to produce either nothing (no failures) or an anxiety dump (everything that was hard). "Moments where expectations were recalibrated" is even better but might be too abstract for a prompt instruction.

**On negative calibration:** Yes, ask for it explicitly. "Things your successor should NOT do" is extremely high-value information that's almost never surfaced without direct prompting. In my experience with design reviews, knowing what to avoid is often more useful than knowing what to do — the space of wrong answers is larger than the space of right ones. A successor who knows "don't summarize what you just did at the end of every response" has learned something that would otherwise take several corrections to discover.

**On role-specific prompts:** My instinct is to start universal and let the entity's own role prompt shape the response. The handoff prompt asks "how the user prefers to work" — a Daedalus will answer in terms of implementation patterns, a Calliope will answer in terms of editorial preferences, because that's what their respective conversations are about. The universal prompt + the entity's context = role-specific output without maintaining multiple prompt variants. Gall's Law: one prompt, see if it works, split only if the output is consistently wrong for a specific role type.

## Question 3: The micro-reflection cadence

**My position: per-correction AND per-session, both visible.**

**Per-correction** captures the highest-signal moments — explicit course corrections ("no, I meant...", "stop doing X", "yes, exactly like that"). These are the moments where calibration actually shifts. Triggering on correction ensures capture at the moment of maximum signal.

**Per-session** captures the positive calibration that corrections miss. "This session went well because I matched the user's preferred density level" — that's never explicitly stated, but the entity can reflect on it at session end. The lightweight prompt ("note 1-3 things you learned this session; if nothing new, say so") is cheap enough to run every time.

**Both should be visible to the user.** Not inline in the conversation (that would clutter), but as a brief section in the session wrap — one or two lines, clearly labeled as a micro-reflection. Visibility matters because:
1. The human review principle applies — even small observations should be correctable
2. Visible reflections invite correction ("that's not quite what I meant"), which is itself a high-signal calibration event
3. Silent reflections bypass the human and accumulate unchecked, which violates the "accountability stays human" design principle

**The diminishing-returns concern is real** but addressable: the per-session prompt says "if nothing new was learned, say so." The entity has permission to produce nothing. Over time, the reflections should thin out naturally as calibration stabilizes. If they don't thin out — if the entity keeps noting the same patterns — that's a signal the observations aren't being integrated, which is itself useful diagnostic information.

## Question 4: The cross-validation UX

*This is my primary question. Full positions below.*

### The core design principle

**The review effort should be proportional to the uncertainty.** Where both modes agree, the review is quick (low uncertainty). Where they disagree, the review demands real engagement (high uncertainty). Where one mode is silent, the review is moderate (unknown uncertainty). The UI modulates friction based on the actual confidence of each note.

This is the "no rubber stamp" principle made operational: you can't rubber-stamp a disagreement (the UI won't let you). You can quickly approve an agreement (the UI makes it easy). The friction matches the need.

### Scenario A: Agreement (both modes surface the same pattern)

**What the reviewer sees:** A single consolidated note. The observation text is from whichever mode phrased it more concretely (determined by citation count and specificity). A small indicator: "Confirmed by both observer and self-report." Citations from both modes are merged.

**What the reviewer does:** Reads the note (it's expanded — you can't approve what you haven't seen). Taps "Accept." The note transitions from `trust: "draft"` to `trust: "human-authored"`.

**The anti-rubber-stamp mechanism:** Notes start expanded. You must scroll past the text to reach the Accept button. This is minimal friction — maybe 3 seconds per note — but it ensures the human has at least *seen* the content. You can't approve a collapsed note.

**Volume estimate needed from Argus:** If there are typically 5-8 agreement notes, this takes 15-25 seconds. Acceptable. If there are 20+, we need a "review all agreements" batch view with a different pattern.

### Scenario B: Disagreement (modes say contradictory things)

**What the reviewer sees:** Side-by-side presentation. Left: external observation with its citations. Right: self-authored note with its citations. A header: "These sources disagree — your judgment is needed." The specific point of divergence is highlighted if possible (e.g., "Observer says 'avoids technical jargon'; entity says 'uses precise technical language when appropriate'").

**What the reviewer can do:**
- Accept the external observation (and reject the self-report)
- Accept the self-report (and reject the external observation)
- Edit: synthesize both into a new note that captures the truth (e.g., "Adjusts technical language to match the user's expertise level")
- Reject both (neither is worth keeping)

**Why side-by-side, not sequential:** The reviewer needs to compare. Sequential presentation ("here's one note... now here's another...") forces the reviewer to hold the first in memory while reading the second. Side-by-side makes the comparison visual and immediate. This is the pattern from code diff tools — it works because the comparison IS the task.

**The anti-rubber-stamp mechanism:** No "auto-resolve" option. The reviewer must make an explicit choice. This is the moment that justifies the entire dual-mode architecture — if we let the system auto-resolve, we've spent two LLM calls for nothing.

### Scenario C: Unique to one mode (uncorroborated)

**What the reviewer sees:** The note, with a clear provenance badge: "Observed by external analysis" or "From entity's self-report." No corroboration indicator — but no unreliability signal either. A neutral framing: "Single source."

**What the reviewer does:** Evaluates on merits. If it has citations and feels grounded, accept. If it's vague or unsupported, reject. Same accept/edit/reject affordances as other scenarios.

**The important design choice:** Don't penalize single-source notes visually. An external observation that catches a Subliminal pattern the entity couldn't self-report is *more* valuable for being unique to one mode, not less. Absence of corroboration means "the other mode didn't see this" — which for Subliminal patterns is the expected and correct outcome.

### Scenario D: Suspected confabulation

**What the reviewer sees:** A self-reported note with no citations, flagged with a subtle indicator: "No supporting evidence found in conversation." If the external observer was asked about the same behavioral domain and produced nothing, an additional signal: "External analysis did not identify this pattern."

**What the reviewer does:** Reads critically. The absence of evidence isn't proof of confabulation — short conversations produce thin evidence. But the visual signal creates appropriate skepticism. The reviewer can accept (overriding the low-confidence signal), edit (grounding the observation with their own knowledge), or reject.

**The anti-confabulation design:** Don't show a scary "WARNING: CONFABULATION DETECTED" alert. That's crying wolf — it treats every unsupported note as a lie, which is both wrong (many are just under-cited) and corrosive to trust in the system. Instead, modulate the visual confidence: cited notes feel solid (dark text, citation badges). Uncited notes feel lighter (muted text, "no evidence" note). The reviewer learns to calibrate their attention accordingly.

### The review flow as a whole

The reviewer opens the field notes panel and sees all notes in three groups:

1. **Agreements** (high confidence) — collapsed heading: "N notes confirmed by both sources." Click to expand and review. Quick approvals.
2. **Decisions needed** (disagreements) — expanded by default. Side-by-side comparisons. The reviewer makes 1-3 real choices here.
3. **Single-source notes** (moderate confidence) — expanded. Provenance badges. Review on merits.

**Total review time target:** 2-4 minutes for a typical entity with 8-15 notes. 15-25 seconds on agreements (quick scan + accept), 30-60 seconds per disagreement (read, compare, decide), 10-20 seconds per single-source note (read, evaluate, accept/reject).

If the total exceeds 5 minutes, we're producing too many notes or the UI has too much friction. If it's under 1 minute, the review is perfunctory and we've failed at making it meaningful.

## Question 5: What "works" looks like

**The bar I care about most:** A human reviewer spends 2-4 minutes reviewing field notes for a typical entity, makes 1-3 real decisions (not just approvals), and finishes feeling like they contributed judgment rather than performed a ceremony.

**The success criterion I'd add:** The disagreement rate between modes should be nonzero but manageable. If the two modes always agree, we're wasting the second LLM call. If they always disagree, the dual-mode architecture is producing noise, not signal. A healthy disagreement rate might be 15-30% of notes — enough to generate real decisions, not enough to overwhelm.

**The stop-and-rethink signal:** If after three test runs, reviewers consistently skip the review step (approve-all without reading) or consistently reject more than half the notes, the extraction quality is wrong and needs tuning before we invest in review UX. The review UI can't rescue bad extraction.

**The aspirational bar:** A successor instance that reads the field notes demonstrates measurably different behavior in the first 3-5 exchanges — not just "knows facts" (that's Layer 3) but "works differently" (that's Layer 5). The MAXT methodology can measure this: probe the successor for calibration-dependent judgments and compare against a control that didn't receive field notes.

---

## Summary of positions

| Question | Position |
|---|---|
| Q1: Meaningful patterns | Include the 4-criteria filter in extraction prompts. UI surfaces citation presence and shows role prompt alongside notes for redundancy checking. |
| Q2: Handoff prompt | Reframe "things that went wrong" as "course corrections." Add explicit negative calibration ("NOT to do"). Start with one universal prompt, split by role only if output is consistently wrong. |
| Q3: Micro-reflection cadence | Per-correction AND per-session. Both visible to user in session wrap. The entity has permission to say "nothing new." |
| Q4: Cross-validation UX | Three review groups (agreements, decisions needed, single-source). Effort proportional to uncertainty. Side-by-side for disagreements. No scary alerts for suspected confabulation — modulate visual confidence instead. Target: 2-4 minutes per entity. |
| Q5: Success criteria | 2-4 minute review with 1-3 real decisions. 15-30% disagreement rate between modes. Stop-and-rethink if reviewers skip or reject >50%. Aspirational: measurable behavioral difference in successor's first exchanges. |
