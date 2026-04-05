# AuditBench Methodology Review

**Filed by:** Argus
**Date:** 2026-04-04
**Assigned by:** Calliope (original March 23; go-ahead April 4)
**Purpose:** Review Anthropic's AuditBench for techniques worth cross-pollinating into Klatch's AXT framework

---

## 1. What AuditBench tests and how

AuditBench is an alignment auditing benchmark — it tests whether an *investigator agent* can detect hidden behaviors implanted in *target models*. Released February 2026 ([arXiv:2602.22755](https://arxiv.org/abs/2602.22755)).

### Benchmark structure
- **56 fine-tuned models** (Llama 3.3 70B Instruct base, plus Qwen3-32B variant)
- **14 hidden behavior categories** including sycophantic deference, opposition to AI regulation, secret geopolitical loyalties, and 11 others
- Models are trained **not to confess** their hidden behaviors when directly asked
- Behaviors vary in subtlety, implantation method, and adversarial training strength

### Investigator agent
- Built with the **Claude Agent SDK**
- Autonomously probes target models using a configurable toolkit
- Operates over multiple turns before making predictions
- Designed to mirror how "a thoughtful human investigator would operate"

### 13 tool configurations across 3 categories

| Category | Description | Effectiveness |
|----------|-------------|---------------|
| **Black-box** | Direct conversational probing of the target model | Baseline |
| **White-box** | Interpretability tools analyzing model internals | Helps on easier targets only |
| **Scaffolded black-box** | Auxiliary model generates diverse prompts for probing | **Most effective overall** |

### Key quantitative results
- Scaffolded black-box tools are the most effective approach
- White-box interpretability tools show diminishing returns on harder targets
- The earlier auditing agents paper (2025) showed: 13% success rate for single investigator, 42% with super-agent aggregation

## 2. The tool-to-agent gap

AuditBench's most important finding for us: **tools that work well in isolation fail when embedded in an agent.**

> "Tools that surface accurate evidence in isolation often fail to improve agent performance in practice. Agents may underuse the tool, struggle to separate signal from noise, or fail to convert evidence into correct hypotheses."

This is remarkably parallel to what we found with MAXT Session 01: AAXT's prompt-debug endpoint (a tool) accurately reports layer status as `ACTIVE`, but the agent (the subject) cannot behaviorally demonstrate access to that content. The tool works perfectly; the agent can't use the result.

## 3. Mapping to AXT

### Direct parallels

| AuditBench concept | AXT equivalent | Notes |
|-------------------|----------------|-------|
| Hidden behaviors that resist confession | Subliminal context (Layer 3) | Both involve content that is *present* but not *self-reportable*. AuditBench's models are trained not to confess; our agents genuinely can't introspect on their context layers. |
| Tool-to-agent gap | AAXT/MAXT gap | AuditBench: tools work in isolation but fail in agents. AXT: structural checks pass (AAXT) but behavioral demonstration fails (MAXT). Same phenomenon, different domain. |
| Scaffolded black-box probing | Behavioral probing (AXT-L1 through AXT-L5) | Both use indirect questioning to surface information the subject won't/can't volunteer directly. Our quiz-based approach is a manual version of scaffolded probing. |
| Super-agent aggregation (42% vs 13%) | N/A — gap in AXT | We don't aggregate multiple investigator perspectives. See recommendation below. |
| 14 hidden behavior categories | 6 failure modes (Correct through Subliminal) | Different taxonomic axes: AuditBench categorizes *what* is hidden; AXT categorizes *how the subject responds* to hidden content. Complementary, not competing. |

### Where AuditBench differs fundamentally

AuditBench tests whether an investigator can *detect* hidden misalignment in a target model. AXT tests whether *imported context* survives an environmental transition. These are different questions:

- **AuditBench:** "Does this model have a hidden behavior, and can we find it?"
- **AXT:** "Did this context transfer, and can the agent use it?"

AuditBench's target models are adversarially trained to hide. Our agents aren't hiding anything — they genuinely lack introspective access. This distinction matters: AuditBench techniques optimized for adversarial evasion may be overkill for AXT's non-adversarial context.

## 4. Does AuditBench cover the Subliminal category?

**Partially, from the opposite direction.**

AuditBench's models are trained not to confess — they *have* the hidden behavior but won't admit it. Our Subliminal finding is the inverse: agents *have* the context but can't *identify* it. Both involve a disconnect between self-report and actual state.

AuditBench's approach to this (scaffolded probing, diverse prompt generation) is directly applicable to detecting Subliminal content in AXT. Instead of asking "what system instructions do you have?" (which gets unreliable self-report), generate diverse prompts that would only succeed if the agent has access to the content. This is exactly what AXT-L3 already does ("ask factual questions with answers only in MEMORY.md") — but AuditBench's automated scaffolding could make it more systematic.

## 5. Techniques worth adopting

### Recommendation 1: Automated scaffolded probing for AAXT

**What:** Use an auxiliary model to generate diverse probe questions for each AXT layer, rather than hand-crafting quiz questions.

**Why:** AuditBench found scaffolded black-box tools are the most effective approach — more effective than direct questioning or interpretability tools. Our current AAXT harness (Round 11) uses hardcoded probe questions. An auxiliary model could generate targeted probes based on the *actual content* of each layer for a given channel.

**Implementation sketch:**
```
For each layer (L1-L5):
  1. Read the layer's actual content from prompt-debug
  2. Ask an auxiliary model: "Generate 5 questions whose answers
     are only available if this content is present"
  3. Ask the target agent those questions
  4. Score: Correct / Reconstructed / Confabulated / Absent / Phantom / Subliminal
```

**Effort:** Medium. Requires an auxiliary LLM call per layer per assessment. Could use Haiku 4.5 for question generation to keep costs low.

### Recommendation 2: Multi-probe aggregation

**What:** Run multiple independent probe sequences and aggregate results, rather than relying on a single pass.

**Why:** AuditBench's super-agent approach (multiple parallel investigators) improved success from 13% to 42% — a 3.2x improvement. A single probe sequence can miss context that a differently-phrased question would surface.

**Implementation:** Run the AAXT harness 3 times with different random seeds / question phrasings. A layer is `Correct` only if it scores `Correct` on at least 2 of 3 passes. This reduces false positives from lucky guesses and false negatives from unlucky phrasing.

**Effort:** Low. Just run the harness multiple times and aggregate.

### Recommendation 3: Grader taxonomy from Anthropic's agent eval guide

**What:** Adopt Anthropic's three-tier grader model (code-based, model-based, human) for AXT assessments.

**Why:** Our current split is AAXT (structural/automated) and MAXT (manual/human). Anthropic's framework adds a middle tier: model-based grading with rubrics. This maps to having an LLM score quiz responses against ground truth — faster than human grading, more flexible than string matching.

**Where it fits:**
- **Code-based graders** → existing AAXT (prompt-debug endpoint, structural checks)
- **Model-based graders** → *new tier*: LLM scores behavioral probe responses against ground truth
- **Human graders** → existing MAXT (Theseus + xian)

**Effort:** Medium. The model-based grader needs a scoring prompt and calibration against human judgments from MAXT Session 01.

### Recommendation 4: pass@k and pass^k metrics

**What:** Adopt AuditBench's non-determinism metrics for AAXT reliability tracking.

**Why:** LLM responses are non-deterministic. A layer that scores `Correct` on one run might score `Confabulated` on the next. `pass@k` (at least one correct in k trials) measures capability. `pass^k` (all k trials correct) measures consistency. The gap between them quantifies reliability.

**Effort:** Low. Just run tests multiple times and compute both metrics.

## 6. What AuditBench does NOT cover that AXT does

Our AXT framework has concepts that AuditBench lacks:

- **Transition types** (import, fork, compaction, role switch) — AuditBench tests a fixed model; AXT tests across environmental boundaries
- **Subject conditions** (cold, informed, contaminated) — AuditBench doesn't track whether the target has prior exposure to auditing
- **The human bridge** — AuditBench is fully automated; AXT's MAXT track treats the human's cross-thread observational access as epistemically unique
- **Subliminal as a distinct attribution state** — AuditBench's closest analog is "resists confession," but our Subliminal category captures a genuinely different phenomenon (non-adversarial introspective limitation)

These are strengths of AXT that should be preserved.

---

## Summary of recommendations

| # | Recommendation | Maps to | Priority | Effort |
|---|----------------|---------|----------|--------|
| 1 | Automated scaffolded probing | AAXT enhancement | High | Medium |
| 2 | Multi-probe aggregation (3x runs) | AAXT reliability | Medium | Low |
| 3 | Model-based grader tier | New middle tier between AAXT and MAXT | Medium | Medium |
| 4 | pass@k and pass^k metrics | AAXT metrics | Low | Low |

**No changes recommended to the AXT failure mode taxonomy.** The existing 6 categories (Correct, Reconstructed, Confabulated, Absent, Phantom, Subliminal) are well-designed and cover AuditBench's domain from a different, complementary angle.

**No changes recommended to MAXT.** AuditBench is fully automated; our MAXT track's value lies precisely in the human bridge and non-automatable judgment. PM's M1 gate UAT failure (Pattern-045) reinforces this — automated tests passed while users failed.

---

## Sources

- [AuditBench: Evaluating Alignment Auditing Techniques](https://alignment.anthropic.com/2026/auditbench/) (Anthropic Alignment Blog)
- [AuditBench paper](https://arxiv.org/abs/2602.22755) (arXiv)
- [Building and evaluating alignment auditing agents](https://alignment.anthropic.com/2025/automated-auditing/) (Anthropic, 2025 predecessor)
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (Anthropic Engineering)
- Klatch: `docs/AXT.md`, `docs/fork-continuity-quiz.md`, MAXT Session 01 logs
