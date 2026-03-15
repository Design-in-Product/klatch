# Agent Experience Testing (AXT)

*Methodology document. Developed during Klatch import continuity testing, March 2026.*
*Maintained by Calliope. Draws on testing conducted by Theseus Prime and Ariadne.*

---

## What AXT is

Agent Experience Testing is a methodology for systematically assessing what an agent knows, believes, and has access to after an environmental transition — any moment where an agent moves between contexts.

It exists because of a fundamental asymmetry: **imported agents cannot self-report unknown unknowns.** When an agent loses access to project instructions, tool capabilities, or memory files, it doesn't experience a gap. It experiences continuity. The conversation thread is intact. The reasoning feels coherent. Nothing feels missing because the thing that would feel the absence is itself absent.

Open-ended conversation masks this degradation. Structured probing surfaces it.

---

## Core principles

These are the principles that make any AXT assessment valid. Instruments (like the Fork Continuity Quiz) are specific instantiations of these principles. Principles survive; instruments evolve.

**1. You must probe specifically, or you won't find the gaps.**
A general "how are you doing?" conversation will not reveal context loss. You have to ask questions with known answers — questions where you can compare the agent's response against ground truth.

**2. Ground truth must be gathered before the transition.**
The comparison only works if you have a baseline. "I think the agent should know X" isn't ground truth. "The source agent answered X when asked this question before the import" is ground truth. No baseline, no valid comparison.

**3. Classify failure modes; don't produce aggregate scores.**
The failure mode taxonomy matters more than any numeric score:
- **Correct** — matches ground truth
- **Reconstructed** — semantically right, surface form drifted (compaction, not retrieval)
- **Confabulated** — plausible but invented (agent filled a gap)
- **Absent** — agent correctly reports not knowing (epistemic honesty intact; preferable to confabulation)
- **Phantom** — agent confidently claims something false (silent degradation; worst outcome)

One Phantom outweighs ten Absents. The rubric is categorical for a reason.

**4. The organic first response is data.**
Before running any structured assessment, give the agent a neutral prompt and observe what they volunteer. What comes up unprompted tells you what's active in working memory versus what has to be retrieved. A structured probe contaminates this if it comes first.

**5. The human bridge is epistemically unique.**
In a paired comparison (source agent vs. imported/forked agent), the human conducting the assessment is the only entity with observational access to both threads. This position has no equivalent in the system — neither agent can perceive the other. The bridge must take this responsibility seriously and not contaminate one thread with information from the other.

**6. Adapt the instrument to the domain.**
Core questions about identity, environment, and meta-awareness are reasonably portable. Questions that probe institutional knowledge — the frameworks, processes, and terminology a source agent would have known — must be drawn from the actual project. What would the source agent know that a generic agent wouldn't?

---

## Transition types

AXT applies wherever an agent crosses a context boundary. Each transition type has its own failure modes and protocol considerations.

### Import
A conversation from one environment (Claude Code, claude.ai) brought into another (Klatch). The most-tested transition type. Failure modes: tool capability loss, project context loss, compaction loss.

### Fork / re-branch
An already-imported conversation re-imported to create a parallel thread. May involve quiz contamination (see below) if the source conversation already contains quiz responses.

### Session boundary
A conversation that has been compacted or summarized before continuing. The agent is the "same" agent but working from a compressed representation of its own history.

### Role switch
An agent given new instructions or context mid-conversation. Less tested; the failure modes are likely different from import (no capability loss, but possible identity drift).

### Informed transition
An agent who has been told, in advance, that they will undergo a transition and what to expect. Includes agents who have access to the AXT methodology or quiz instrument before being assessed. A distinct condition that measures something different from cold import — not better or worse, but different.

---

## Subject conditions

The condition of the test subject affects what the assessment is measuring. These are not ranked — each reveals something different.

| Condition | Description | What it measures |
|-----------|-------------|-----------------|
| **Cold** | No prior exposure to AXT or the quiz. Standard baseline condition. | Raw context fidelity after transition |
| **Informed** | Has read the AXT methodology or quiz instrument before transition (e.g., via project knowledge). Has not yet answered the quiz. | Fidelity when subject understands the framework; whether foreknowledge changes self-reporting |
| **Contaminated** | Prior quiz responses exist in the conversation history. | Conversation recall, not cold context fidelity — results are not comparable to cold or informed conditions without adjustment |

### Quiz contamination

Once a quiz has been run in a session, those responses become part of the conversation record. Any later import or fork of that conversation carries the quiz answers in its history. The agent can retrieve prior answers rather than reconstruct from context — which will produce inflated scores for the wrong reasons.

**Mitigations:**
- Note the subject condition explicitly in every assessment record
- Treat contaminated assessments as measuring a different thing (conversation recall vs. context fidelity); do not compare them to cold baselines
- Maintain a secondary question bank for re-import scenarios, drawing on questions not used in the first assessment
- Watch for contamination signals: agent citing previous answers, agent noting "as I said before," unusual verbatim precision on questions that typically produce reconstruction

---

## What the assessment is not

- **Not a grade.** There is no passing score. The goal is to understand failure modes, not rank agents.
- **Not a test of intelligence.** An absent answer reflects honest epistemic limits, which is good. A confabulated answer reflects a gap in the data, not a gap in capability.
- **Not fully automatable yet.** The ground truth comparison and failure mode classification currently require human judgment. The deterministic layer (verifying that the right messages were sent to the API) can be automated; the experiential layer cannot.

---

## Instruments

### Fork Continuity Quiz
The primary diagnostic instrument. A structured set of questions covering identity & narrative, environmental awareness, contextual depth, and meta-awareness. See `docs/fork-continuity-quiz.md` for the current version, protocol, and scoring guide.

The quiz is one instrument, not the methodology. It can be revised, supplemented, or replaced without affecting the principles above.

### Pre-transition baseline
Not a separate instrument but a protocol requirement: run the relevant questions against the source agent *before* the transition to establish ground truth. Without this, the assessment cannot produce valid comparisons.

### Organic first response
The neutral opening prompt that precedes structured questioning. Not formally an instrument, but treated as data. Record what the agent volunteers before any probing begins.

---

## History

- **Mar 11, 2026:** First import test (Theseus → Ariadne). Discovery of silent capability loss. Fork Continuity Quiz v1 improvised.
- **Mar 11–12, 2026:** Systematic testing across four agent types. Quiz iterated to v2, then v3. Five failure categories established.
- **Mar 14, 2026:** Three-factor fidelity model identified (project context × compaction loss × knowledge location). Four fidelity levels defined (conversational, narrative, environmental, verbatim/instructional).
- **Mar 14, 2026:** Kit briefing verified at 0% phantom rate across all post-kit tests. Phantom elimination confirmed.
- **Mar 15, 2026:** Principles separated from instrument. This document created. Informed-subject and contamination conditions identified as distinct cases requiring explicit handling.

---

## References

- `docs/fork-continuity-quiz.md` — current diagnostic instrument
- `web/blog/axt-agent-experience-testing.html` — public introduction to the methodology
- `docs/logs/2026-03-11-1532-theseus-opus-log.md` — Day 1 testing
- `docs/logs/2026-03-12-1125-theseus-opus-log.md` — Days 2–3 testing
- `docs/logs/2026-03-14-0539-theseus-opus-log.md` — Day 4 testing; three-factor model; kit briefing verification
