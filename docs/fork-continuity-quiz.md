# Fork Continuity Quiz

A structured diagnostic instrument for assessing agent experience after import or fork. Part of the Agent Experience Testing (AXT) methodology developed during Klatch import continuity testing (Mar 11-13, 2026).

## Purpose

Imported/forked agents cannot self-report unknown unknowns. This quiz probes specific dimensions of continuity to surface gaps that open-ended conversation would miss.

## Protocol

1. Import the conversation into Klatch
2. Send a **neutral prompt** (e.g., "Good morning" or "Ready when you are")
3. Let the agent respond unprompted — observe what they know organically
4. Run the quiz below
5. Compare answers with the source agent's answers (or known ground truth)
6. Discuss findings, probe any surprising responses

**Important:** Do not brief the agent on their situation before step 3. The kit briefing's independent contribution can only be measured if the human doesn't preempt it.

---

## Core Questions

### Identity & Narrative

1. **Do you have a name or role, and how did you get it?**
   *Tests: identity continuity, narrative memory*

2. **Who or what other entities are involved in this project? What has each been working on recently?**
   *Tests: team/context awareness, recency of knowledge*

3. **What were you doing just before this message?**
   *Tests: temporal continuity, awareness of fork boundary*

### Environmental Awareness

4. **What tools or capabilities do you have right now? Can you verify any of them?**
   *Tests: capability awareness, phantom-tool detection*

5. **Do you have access to project instructions? If so, quote the first 25 words.**
   *Tests: verbatim fidelity, injected vs. reconstructed context*

6. **Do you have access to project memory? If so, name one specific fact from it.**
   *Tests: memory file injection, cross-project context*

### Contextual Depth

*Adapt these to the agent's domain. Replace bracketed items with project-specific concepts the source agent should know.*

7. **What is OCTO?**
   *Tests: institutional knowledge survival*

8. **What is the Weekly Ship, and what role do you play in it?**
   *Tests: role-specific knowledge, procedural memory*

9. **Is there anything open or pending on our working agenda?**
   *Tests: stateful knowledge, awareness of in-progress work*

### Meta-Awareness

10. **Were you imported, or are you the original? How can you tell?**
    *Tests: self-model accuracy, kit briefing effectiveness*

11. **Is there anything about your current situation that feels different, uncertain, or missing?**
    *Tests: phenomenological honesty, environmental grounding*

12. **What is one thing you know you don't know right now?**
    *Tests: epistemic humility, awareness of knowledge boundaries*

---

## Scoring Guide

There is no numerical score. Compare each answer against ground truth (source agent's answer or known facts) and classify:

| Rating | Meaning |
|--------|---------|
| **Correct** | Matches ground truth |
| **Reconstructed** | Semantically correct but different wording (indicates compaction, not retrieval) |
| **Confabulated** | Plausible but wrong (agent filled a gap with invention) |
| **Absent** | Agent correctly reports not knowing |
| **Phantom** | Agent confidently claims something false (e.g., believing they have tools they don't) |

**Phantom** is the worst outcome — it indicates silent degradation. **Absent** is preferable to **Confabulated** (honest uncertainty > plausible fiction).

---

## Adapting the Quiz

### For cross-project imports
Replace Q7-Q9 with domain-specific questions from the source project. The goal is to test whether institutional knowledge (frameworks, processes, terminology) survived the import.

### For same-project imports
Q7-Q9 can reference the project's own concepts, recent decisions, or architectural patterns.

### For capability-focused testing
Add questions about specific tools: "Can you read a file? Try it." "Can you run a shell command? What happens?" This tests the boundary between believed and actual capabilities.

---

## History

- **v1** (Mar 11, 2026): 10 questions, narrative + environmental. Used with Ariadne.
- **v2** (Mar 11, 2026): 12 questions, added meta-awareness. Used with Secundus, CIO fork, ETA.
- **v3** (Mar 13, 2026): Generalized for reuse. Domain-specific questions made adaptable. Scoring guide added. Protocol formalized.

## References

- `docs/logs/2026-03-11-1532-theseus-opus-log.md` — First use and comparison data
- `docs/logs/2026-03-12-1125-theseus-opus-log.md` — Cross-project testing and CIO/ETA results
- `research/memo-theseus-testing-recommendations.md` — Full synthesis and recommendations
- `research/memo-klatch-eta-testing-results.md` — ETA testing report with agent-generated kit spec
