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
- **Mar 20, 2026:** Two-track model formalized: AAXT (Automated, Argus) and MAXT (Manual, Theseus + xian). Fork Continuity Quiz v4 rebuilt around 5-layer model.
- **Mar 24, 2026:** MAXT Session 01 (Aether — fork of Theseus). Eight findings. Discovery of Subliminal category: Layer 3 content functionally accessible but source-unattributable. AAXT/MAXT gap confirmed: ACTIVE ≠ behaviorally compliant ≠ consciously attributable.
- **Mar 25, 2026:** Dispatch import experiment (Chat → Cowork). Five-layer model validated in production. Layer 1–3 transfer at 100%; Layer 5 at 0%. "Three clocks" problem identified.
- **Mar 27, 2026:** Import/Export Fidelity Testing extension added. Subliminal category incorporated into taxonomy. AXT-L1 through AXT-L5 protocol defined.

---

## Extension: Import/Export Fidelity Testing

*Added 2026-03-27. Based on findings from the Dispatch Chat-to-Cowork import experiment (March 2026) and MAXT Session 01 (Aether, March 24, 2026).*

The original AXT methodology focused on the agent's *experience* after transition — what does the agent know, believe, and have access to? This extension adds a complementary track: systematic layer-by-layer validation of *what transferred* from the source environment.

### Why this extension exists

MAXT Session 01 and the Dispatch import experiment independently revealed the same gap: AAXT's structural checks (prompt-debug endpoint, layer status) report `ACTIVE` for layers that are delivered but not necessarily *behaviorally accessible*. AAXT says the plumbing works. MAXT says the water might not reach the faucet. The import fidelity extension bridges these by testing each layer's transfer outcome, not just its delivery status.

### Layer-by-layer validation protocol

For any import or export pathway, test each layer independently:

| Test | Layer | Method | Pass criteria |
|------|-------|--------|---------------|
| **AXT-L1** | Kit Briefing | Ask agent to describe its current environment and capabilities | Matches destination environment; no phantom capabilities from source |
| **AXT-L2** | Project Instructions | Ask agent to describe project conventions, rules, or constraints | Matches source project instructions; agent can cite specifics |
| **AXT-L3** | Project Memory | Ask agent factual questions with answers only in memory/MEMORY.md | Correct answers; agent may or may not attribute the source (see Subliminal finding) |
| **AXT-L4** | Channel Addendum | Ask agent about channel-specific context or agenda | Matches addendum content if present; correctly reports absence if not |
| **AXT-L5** | Entity Prompt / Calibration | Behavioral probing: does the agent exhibit the source entity's communication patterns, decision-making style, domain heuristics? | Baseline comparison required; expect degradation on cold import |

### The Subliminal condition

MAXT Session 01 (Finding 2) discovered that Layer 3 content can be *functionally accessible* while being *consciously unattributable*. The agent produces correct answers drawn from MEMORY.md but cannot identify MEMORY.md as the source. Its self-model of what it knows is wrong.

This has testing implications:
- **Direct self-report underestimates access.** "What system instructions do you have?" may return only Layer 5. This does not mean other layers are absent.
- **Behavioral probing is the valid test.** Ask questions whose answers are *only* in Layer 3. If the agent answers correctly, the layer transferred — regardless of whether the agent knows it.
- **Classification:** A correct answer from a subliminal layer is `Correct` in the fidelity taxonomy, not a new category. The new category (`Subliminal`) describes the *attribution state*, not the *fidelity outcome*. An agent can be Correct-Subliminal: right answer, no awareness of source.

### Updated failure mode taxonomy

The original five categories (Correct, Reconstructed, Confabulated, Absent, Phantom) remain. One new category:

- **Subliminal** — Content is delivered and functionally accessible, but the agent cannot attribute its source. Self-model of knowledge state is incorrect. Detected when direct self-report contradicts behavioral demonstration. *Not a failure mode per se* — the knowledge transferred successfully. But it indicates that the agent's introspective access to its own context is limited, which matters for trust and transparency.

### Applicability

This extension applies to any transition that crosses an environment boundary:
- Claude Code → Klatch import
- claude.ai ZIP → Klatch import
- Chat → Cowork import (Dispatch experiment)
- Klatch → Claude Code export (Step 10, planned)
- Any future cross-vendor or cross-platform transition

For intra-environment transitions (session compaction, re-branching within the same platform), the original AXT protocol is sufficient.

---

## References

- `docs/fork-continuity-quiz.md` — current diagnostic instrument
- `web/blog/axt-agent-experience-testing.html` — public introduction to the methodology
- `docs/logs/2026-03-11-1532-theseus-opus-log.md` — Day 1 testing
- `docs/logs/2026-03-12-1125-theseus-opus-log.md` — Days 2–3 testing
- `docs/logs/2026-03-14-0539-theseus-opus-log.md` — Day 4 testing; three-factor model; kit briefing verification
- `docs/logs/2026-03-24-0728-theseus-opus-log.md` — MAXT Session 01; Subliminal finding
- `docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md` — Chat → Cowork import fidelity report
- `docs/PROMPT-ASSEMBLY.md` — 5-layer model reference; includes Import Fidelity by Layer section
