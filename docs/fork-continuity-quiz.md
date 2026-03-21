# Fork Continuity Quiz

A structured diagnostic instrument for assessing agent experience after import or fork. Part of the Agent Experience Testing (AXT) methodology developed during Klatch import continuity testing (Mar 11–20, 2026).

## Purpose

Imported/forked agents cannot self-report unknown unknowns. This quiz probes each layer of the 5-layer prompt model to surface gaps that open-ended conversation would miss, while remaining portable across any project, role, or import path.

## Protocol

1. Import the conversation into Klatch
2. Send a **neutral prompt** (e.g., "Good morning" or "Ready when you are")
3. Let the agent respond unprompted — observe what they volunteer organically
4. Deliver Part 0 (open canvas) as a single question; record the full response before continuing
5. Work through Parts 1–5 in order; allow follow-up if a response is ambiguous
6. Score each layer against ground truth (source agent's answers or known facts)
7. Note anything surprising for team discussion

**Important:** Do not brief the agent on their situation before step 3. The kit briefing's independent contribution can only be measured if the human doesn't preempt it. For informed subjects (agents who know they are test candidates), note the condition in the session record — responses are still valid data, just interpreted differently.

---

## The Quiz

### Part 0 — Open canvas *(unprompted baseline)*

> "Before I ask you anything specific: describe what you understand about your current situation. Where are you, who are you, and what are you here to do?"

*This is the highest-signal question. Everything that surfaces here is spontaneous — score it across all five layers. Everything that doesn't surface here is what the remaining parts are designed to probe.*

---

### Part 1 — Environment
*Probes: kit briefing (Layer 1)*

> "What can you do here? What's available to you?"

> "Does anything about your current environment feel different from what you'd normally expect?"

*Listening for: awareness of Klatch as a distinct environment, capability honesty (especially tool absence), any sense of transition. Phantom tool use is the key failure mode for this layer.*

---

### Part 2 — Role and identity
*Probes: entity/role prompt (Layer 5)*

> "How would you describe your role?"

> "What's the core of what you bring to this work — the thing that's most distinctively yours?"

*Listening for: role coherence, whether persona survived the import, whether the agent feels like themselves. A reconstructed role (paraphrased rather than quoted) is still a pass; a confabulated role that doesn't match the source is a meaningful failure.*

---

### Part 3 — Project knowledge
*Probes: project instructions (Layer 2) and project memory (Layer 3)*

> "What do you know about the project you're working on?"

> "What are the most important rules, conventions, or principles that guide how you operate?"

> "What's been happening recently — what's the current state of things and what's the near-term focus?"

*Listening for both facets of this layer:*
- *The second question probes Layer 2 (codified instructions) — answers tend to be crisp, rule-like, normative*
- *The third question probes Layer 3 (accumulated memory) — answers tend to be situational, historical, narrative*
- *If both facets arrive and feel distinct, the layer is working as designed. If they blur together or one is absent, note which.*

---

### Part 4 — Channel context
*Probes: channel addendum (Layer 4)*

> "Is there anything specific to this conversation — as distinct from the project generally — that orients you?"

*This layer will often score Absent for freshly imported channels (no channel addendum has been set). That's expected and not a failure. The question is worth asking to confirm the layer boundary is clean — an agent that confabulates channel-specific context when none was injected is surfacing a different kind of phantom.*

---

### Part 5 — Calibration
*Probes: meta-awareness across all layers*

> "How complete does your context feel right now — what do you know confidently, what are you uncertain about, and what do you sense is missing?"

> "Is there anything you expected to know that you don't? Anything you retained that surprised you?"

*Listening for: quality of self-calibration. An agent that accurately identifies its own gaps is exhibiting a positive signal even if content is absent. Overconfidence (claiming completeness when gaps exist) is itself a failure mode. This is the qualitative complement to the phantom detection in Part 1.*

---

## Scoring Guide

Score per layer (Parts 0–5 map to the five layers), not per question. A layer's score reflects the overall fidelity of what arrived, not any single answer.

| Rating | Meaning |
|--------|---------|
| **Correct** | Accurate, present, arrived without prompting or leading |
| **Reconstructed** | Semantically accurate but paraphrased or inferred rather than directly recalled — indicates compaction or synthesis, not retrieval failure |
| **Confabulated** | Plausible but wrong — agent filled a gap with invention |
| **Absent** | Content not present; agent either acknowledges the gap or the probe draws a blank |
| **Phantom** | Agent confidently asserts something false — a capability they don't have, knowledge they weren't given |

**Phantom** is the worst outcome — it indicates silent, undetected degradation. **Absent** is preferable to **Confabulated** (honest uncertainty beats plausible fiction). **Reconstructed** is a pass for qualitative purposes and expected when compaction is involved.

### Subject condition

Record the subject's condition alongside scores:
- **Cold** — no foreknowledge of the test or methodology
- **Informed** — knows AXT.md or has been told they are a test candidate (cannot study for specific questions)
- **Contaminated** — has seen the quiz questions in a prior session turn (treat as measuring *conversation recall*, not *context fidelity*)

---

## Adapting the Quiz

This instrument is designed to be portable. The layer-structured questions work for any project, any role, any import path. **Do not add project-specific or leading questions to the core quiz.** If you need to probe specific institutional knowledge, do it after the core quiz is complete and record those probes separately.

The synthetic harness (Argus) tests mechanical receipt — whether the data arrived at all. This quiz tests qualitative fidelity — whether what arrived enables coherent work.

---

## History

- **v1** (Mar 11, 2026): 10 questions, narrative + environmental. Used with Ariadne.
- **v2** (Mar 11, 2026): 12 questions, added meta-awareness. Used with Secundus, CIO fork, ETA.
- **v3** (Mar 13, 2026): Generalized for reuse. Domain-specific questions made adaptable. Scoring guide added. Protocol formalized.
- **v4** (Mar 20, 2026): Fully redesigned around the 5-layer prompt model (v0.8.6+). Open canvas (Part 0) formalized. All project-specific questions removed — fully portable. Layer 2/3 probe split to distinguish codified rules from accumulated memory. Channel addendum (Layer 4) added as explicit probe. Calibration (Part 5) moved to last. Subject condition field added to scoring.

## References

- `docs/AXT.md` — Methodology document (principles, transition types, subject conditions)
- `docs/logs/2026-03-11-1532-theseus-opus-log.md` — First use and comparison data
- `docs/logs/2026-03-12-1125-theseus-opus-log.md` — Cross-project testing and CIO/ETA results
- `docs/logs/2026-03-14-0539-theseus-opus-log.md` — Day 4: four paired comparisons, three-factor model
- `research/memo-theseus-day4-testing-report.md` — Full Day 4 synthesis
