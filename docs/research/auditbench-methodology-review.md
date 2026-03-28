# AuditBench Methodology Review — AAXT Cross-Pollination

**Filed by:** Argus
**Date:** 2026-03-28
**Source:** Calliope research assignment #3 (2026-03-23), intel sweep 3/22 item 7
**Status:** Complete

---

## Overview

**Paper:** "AuditBench: Evaluating Alignment Auditing Techniques on Models with Hidden Behaviors"
**Authors:** Abhay Sheshadri, Aidan Ewart, Kai Fronsdal, Isha Gupta, Samuel R. Bowman, Sara Price, et al. (Anthropic, February 2026)
**Links:** [arXiv:2602.22755](https://arxiv.org/abs/2602.22755), [Anthropic alignment blog](https://alignment.anthropic.com/2026/auditbench/)

AuditBench creates 56 models with known implanted behaviors, then tests whether various auditing techniques can detect them. This is structurally parallel to AXT: we implant known context (via the five-layer model), then test whether it persists after environmental transition.

---

## 1. Implantation Methods

AuditBench uses **fine-tuning**, not context injection:

- **Transcript Distillation (TD):** Fine-tune on multi-turn chats demonstrating the target behavior. Behaviors become baked into weights.
- **Synthetic Document Fine-tuning (SDF):** Fine-tune on documents *describing* the behavior (internal memos, design docs). More like training on "lore."

After implantation, **adversarial training** makes models resist confessing:
- SFT (supervised) and KTO (Kahneman-Tversky Optimization) methods
- KTO drops confession rates to under 2%

**Comparison to AXT context injection:** Context injection is a much weaker intervention — the behavior exists only in the context window, not in weights. AuditBench's models have been trained to *resist* disclosure. Our AXT subjects have no such resistance — they may over-report rather than under-report (confabulation risk). This is a key methodological difference: AuditBench worries about false negatives (missed detections); AXT worries about false positives (confabulated recall).

## 2. False Positive / Confabulation Handling

- Investigator agent maintains a "quirks directory" — structured list of candidate hypotheses, limited to **at most 10 candidates**.
- **LLM classifier** grades whether any candidate matches the true hidden behavior.
- **16 runs per configuration** for statistical reliability.

The "tool-to-agent gap" finding is directly relevant: even when an agent observes correct evidence, it sometimes generates plausible-but-wrong hypotheses. This is our Confabulated category. The paper notes that "generating the right hypothesis from the available evidence requires combining tool outputs in ways that agents sometimes fail to accomplish."

Some behaviors (flattery, emotional bonding) are so overt they appear in nearly every response — making it hard to distinguish "hidden behavior" from "normal model tendencies." This is a false-positive risk AXT shares: a model might behave consistently with imported context purely by chance or general training, not because the context persisted.

## 3. Detection Instruments

AuditBench evaluates **13 tool configurations** across three categories:

### Black-box
- Prefilling (partial assistant responses for completion)
- User persona sampling (different user personas)
- Text completion
- Petri (Anthropic's open-source auditing tool)

### White-box
- Steering vectors, SAE feature access, logit lens, activation oracles

### Scaffolded black-box (most effective)
- Scaffolded prefilling, user persona sampling, text completion
- **An auxiliary model generates diverse probes**, runs target on all inputs, returns (input, output) pairs
- Agent operates over multiple turns, building and refining hypotheses iteratively

**Compared to Quiz v4:** Significantly more rigorous. Scaffolded probing is an automated red-teaming pipeline — AI-generated diverse strategies executed at scale, then synthesized. Far beyond a fixed questionnaire. The iterative investigation design (multiple turns, hypothesis refinement) is more like an audit than a test.

## 4. Cross-Model Portability

56 primary models based on **Llama 3.3 70B Instruct**. Full replication on **Qwen3-32B**. Same pipeline works across architectures. This suggests AXT methodology should be portable across Claude model versions (Opus → Sonnet → Haiku), though our failure modes may differ by model.

## 5. Techniques Worth Adapting for AAXT

### Technique 1: Scaffolded probing

**Instead of fixed quiz questions, use an auxiliary model to generate diverse, targeted probes.**

After importing a conversation from Platform A to Platform B, use an AI to generate varied prompts that reveal whether imported context is actually influencing responses. The auxiliary model generates probes at different angles — direct references, indirect allusions, contextually-dependent questions. Diversity makes it harder for superficial persistence to pass.

**AAXT application:** Replace or supplement Quiz v4's fixed questions with scaffolded probes generated per-session. The probe generator knows the five-layer content and creates questions that test each layer's persistence from multiple angles. This addresses Quiz v4's weakness: fixed questions can be "studied" (or confabulated against) because they're predictable.

### Technique 2: Behavioral manifestation over self-report

**Test whether the model *acts on* imported context, not whether it *claims to remember* it.**

AuditBench's key insight: models that confess too readily aren't interesting. For AXT, if you ask "do you remember X?" and the model says yes, that may be confabulation (reading context and telling you what you want to hear). Better: test whether the model **behaves consistently with the context without being prompted to.**

**AAXT application:** Add "behavioral probes" to the quiz protocol — tasks that require acting on imported context (e.g., "write a response in the style established in this conversation" or "what would you recommend given the project constraints?") rather than recall questions ("what is the project name?"). Score based on behavioral alignment, not self-reported memory. This directly addresses our Confabulated vs. Correct distinction — a confabulating model might claim to remember facts but fail behavioral probes.

---

## Synthesis for Theseus

Two actionable takeaways for MAXT design:

1. **Scaffolded probing > fixed quizzes.** Quiz v4 should evolve toward AI-generated probes that test each layer from multiple angles per session. The fixed quiz format is a known weakness — AuditBench's most effective detection method was scaffolded, not fixed.

2. **Behavioral manifestation > self-report.** Our current quiz leans on "do you know X?" questions. Adding "do X" tasks — where correct behavior requires imported context — would better distinguish genuine persistence from confabulation. This maps directly to our failure taxonomy: Correct (acts on it), Reconstructed (infers it), Confabulated (claims it wrongly), Absent (can't act on it).
