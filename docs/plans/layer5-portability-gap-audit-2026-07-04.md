# Layer 5 Portability: Gap Audit and LM-Based Approaches
**Date:** July 4, 2026
**Authors:** xian + Calliope
**Status:** Design draft — input to roadmap prioritization

---

## The problem

Klatch's 5-layer model describes what transfers when an agent moves across environments:

| Layer | Content | Transfer fidelity |
|---|---|---|
| L1: Kit briefing | Environment orientation (date, model, git status, "you're now in Klatch") | ~90% — auto-generated at import |
| L2: Project instructions | CLAUDE.md / behavioral rules | ~100% for Claude Code; ~60% for claude.ai (no CLAUDE.md equivalent) |
| L3: Project memory | MEMORY.md / accumulated facts | ~100% for Claude Code; ~60% for claude.ai |
| L4: Channel addendum | Channel-specific framing | 0% — must be written by hand per channel |
| L5: Entity prompt | Agent identity, persona, behavioral calibration | 0% — currently blank or minimal on import |

The fidelity framework from Step 8¾ testing addresses Layers 1–3 and confirmed them at high transfer rates. **Layer 5 has never been addressed.** It transfers at zero.

This matters because Layer 5 is where the agent *is*. Layers 1–3 give it facts and context. Layer 5 is the behavioral calibration that develops through conversation — how it communicates, how it approaches problems, how it relates to xian specifically. An agent with Layers 1–3 but no Layer 5 has the project's knowledge but not the working relationship. It's a well-briefed stranger.

---

## What's automatically discernible from conversation history

Before asking an agent anything, we can extract behavioral signal from its prior messages:

**Communication style:**
- Response length distribution (terse vs. expansive; changes by task type?)
- Structure preference (headers + bullets vs. prose paragraphs)
- Hedging language frequency ("I think", "perhaps", "it depends") — signals confidence register
- Question frequency — does it clarify before acting, or proceed with assumptions?
- Direct recommendation vs. options presentation

**Working style:**
- Does it tend to research first or act then verify?
- How does it handle uncertainty — admits, guesses, or asks?
- What's the ratio of "here's what I'd do" to "here are your choices"?
- How does it handle scope creep (accepts, flags, redirects)?

**Domain depth markers:**
- Technical vocabulary used correctly vs. approximately
- Topics where it goes deep vs. stays surface
- Implicit domain knowledge (correctly anticipates implications without being prompted)

**Relationship calibration (highest-signal inputs):**
- How it addresses xian (formal/informal, by name, by role)
- How it responds to correction — immediate pivot, argues briefly, acknowledges and continues
- Whether it references prior decisions and conversations
- **Correction history**: every time xian pushed back is an explicit behavioral constraint. These are the clearest signals of what "this agent working well" looks like.

**What this enables:** An automated **behavioral fingerprint** — a structured profile extracted from conversation history that describes communication style, domain focus, and working approach without ever asking the agent anything.

---

## What requires active agent cooperation

Some things can't be extracted passively. They require the source agent to produce them before migration:

**Tacit knowledge:**
- Decisions made implicitly that were never documented
- Intuitions about what xian wants and doesn't want
- In-progress context that isn't in any file (what they were in the middle of thinking about)

**Self-model:**
- How the agent describes its own working style
- What it considers its strengths and blind spots in this project context
- What it would want its successor to know

**Behavioral calibration statement:**
The most valuable single artifact: "What should a version of me starting fresh know about how to work well with xian on this project?" — This is not in any file. It exists only in the agent's accumulated model of the relationship.

---

## Proposed LM-based processes

### Process 1: Automated persona extraction (passive, from history)

**Input:** Conversation history (or a sampled subset — last N turns + a spread across time)
**Prompt:** "Based on this conversation history, write a first-person behavioral profile for this agent. Cover: how it communicates, how it approaches problems, what it knows about this project, and how it relates to the user. This profile will be used as a Layer 5 entity prompt in a new environment."
**Output:** A generated Layer 5 seed that captures observed behavioral patterns
**Limitations:** Can't capture tacit knowledge; may over-fit to recent conversations; doesn't reflect the agent's own self-model

### Process 2: Correction extraction (passive, high-signal)

**Input:** Conversation history, filtered for correction/feedback turns (xian pushback → agent response)
**Prompt:** "Identify moments in this conversation where the user corrected or redirected the agent. For each, extract the behavioral constraint implied ('don't X', 'prefer Y', 'remember that Z')."
**Output:** A list of explicit behavioral calibration points derived from xian's actual feedback
**Why this matters:** These represent the most reliable signal of Layer 5 — they're the moments where the behavioral calibration actively changed. They're also the easiest to miss in a passive extract, because they're embedded in normal conversation flow.

### Process 3: Pre-migration interview (active, requires agent cooperation)

A structured prompt sent to the source agent before migration. Not a freeform ask — a specific interview format that produces a structured output:

```
You're about to be imported into a new environment. Before you go, produce a persona capture that a future version of you can use to orient itself. Answer each section briefly:

**Working style:** How do you approach problems in this project context? What do you lead with?

**Communication style:** How do you prefer to respond — structure, length, register? What does "a good response" look like from you?

**Key facts not in any file:** What do you know about this project, xian's preferences, or in-progress work that isn't written down anywhere and might not survive the import?

**Behavioral calibration:** What feedback from xian has changed how you work? What have you learned not to do?

**What future-you should start with:** If you could give your successor one paragraph of orientation, what would you say?
```

**Output:** A structured persona capture document
**Storage:** As a pinned file in the entity's project (Layer 3) or directly as the entity prompt (Layer 5 seed)

### Process 4: Memory distillation (semi-passive, augments L3)

**Input:** Conversation history
**Prompt:** "What facts, decisions, and context from this conversation are not captured in the project's MEMORY.md file but would be useful for a future agent working on this project?"
**Output:** Supplementary memory content that fills the gap between what's formally documented and what's actually known
**This is a Layer 3 supplement**, not Layer 5 — but it closes a related gap

### Process 5: Behavioral fingerprint scoring (passive, ongoing)

After migration, use the behavioral fingerprint extracted in Process 1 to score the Klatch agent's responses: does it match the source agent's communication style, confidence register, and domain depth? This creates a measurable fidelity score and surfaces regressions as the conversation develops.

**This is also an AAXT opportunity** — the fingerprint becomes a probe target. Theseus or Argus can run automated probes calibrated against the source agent's known patterns.

---

## Gap audit by layer

| Layer | Current state | Gap | Auto-extractable | LM-fillable | Active self-report |
|---|---|---|---|---|---|
| L1: Kit briefing | Good — date, model, env, git | Agent's current focus/momentum | Partially (last messages) | Yes: recent-activity summary | Yes: focus statement |
| L2: Project instructions | Good for Claude Code | Other environments (claude.ai, Cursor, etc.) | No | Yes: "what rules govern you?" | Yes |
| L3: Project memory | Good for Claude Code | Implicit facts not in MEMORY.md | Partially (from conversation) | Yes: memory distillation | Yes |
| L4: Channel addendum | 0% — fully manual | Channel purpose, framing, implicit norms | Partially: infer from conversation topics | Yes: purpose inference | Yes |
| **L5: Entity prompt** | **0%** | **Everything: style, approach, relationship** | **Partially: style + correction analysis** | **Yes: persona extraction, correction extraction** | **Yes: pre-migration interview** |

The Layer 5 gap is the most important and the least addressed. All five processes above target it directly or indirectly.

---

## Roadmap recommendation

**This work should be a discrete step, not a footnote.** The core value proposition of Klatch is cross-environment portability of agent conversations with context intact. If Layer 5 transfers at zero, we're delivering Layers 1–4 portability and calling it done. That's a significant product gap.

Proposed: **Step 10.5 / "Layer 5 portability"** — before Search (Step 11), not after.

Rationale: Search is a utility feature (find things in your conversation history). Layer 5 portability is core to what Klatch *is*. If an agent migrated into Klatch doesn't behave like the agent xian has been working with, the portability story is incomplete regardless of how good the search is.

The first increment is achievable without major infra work: a "prepare for migration" flow that sends Process 3 (pre-migration interview) to the source agent and saves the output as a pinned document. Everything else can build from there.

**An interim advantage:** Until Anthropic, OpenAI, and other providers build native export of behavioral calibration (which they will eventually), Klatch can do it via active elicitation. This is a legitimate product differentiator — not a hack, but a genuine capability that arises from the multi-environment position we already occupy.

---

## Connection to today's MAXT session

The Search planning klatch is a live test of the Layer 5 gap. Daedalus, Argus, and Iris are operating with Layer 5 = 0 today. What Theseus and xian observe during that session is the first real-world data point for what the gap actually costs. The findings from that session should feed directly into prioritizing which Layer 5 process to build first.
