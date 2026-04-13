# Step 10 Phase 3.5: Behavioral Calibration Transfer — Design Addendum

**Author:** Argus, from conversation with xian (April 13, 2026)
**Status:** Design proposal — for team discussion before implementation
**Related:** `STEP-10-EXPORT-META-MODEL.md` Phase 3.5, `AAXT-SCAFFOLDED-PROBING.md`, Janus memory research synthesis (April 12)
**The problem this addresses:** "Nobody has solved learned behavioral calibration" (Janus research finding)

---

## The insight

Handoff briefings — written by an agent at the end of a session for a successor instance — are consistently reported as **the most valuable context agents receive.** More valuable than factual memory, project instructions, or tool documentation. This was surfaced in a 360 review across xian's agent ecosystem (Piper Morgan, Piper Open) and is consistent with what Klatch's own MAXT findings predict.

The reason: a handoff briefing is the one moment when an agent is explicitly asked to **externalize its tacit model of the working relationship.** Not "what do you know" (Layer 3) but "what does your successor need to understand about *how to work with this person*" (Layer 5). The agent is prompted to articulate the calibration that we've been saying doesn't transfer.

**The implication:** Layer 5 content *can* be articulated. It just needs the right prompt, at the right moment, with the right audience.

## Why handoff briefings work

Three conditions converge:

1. **Maximum signal.** The agent has the full conversation history in context — every decision, every correction, every preference expressed. The calibration data is all there.

2. **Specific audience.** The briefing is addressed to a peer — a successor instance that will be doing the same job. This changes the cognitive task from "describe yourself" (abstract, prone to generic answers) to "explain to a colleague what they need to know" (concrete, grounded in operational specifics).

3. **Natural boundary.** Session end, environment transition, or export are moments when reflection is the right thing to do. The agent isn't being pulled out of productive work to journal — it's at a natural pause point where consolidation is appropriate.

These are the same conditions that produce good debriefs in human teams. The briefing isn't interrupting work; it's metabolizing it.

## Two complementary extraction modes

Phase 3.5 should offer both:

### Mode 1: External extraction (auxiliary observer)

Already designed in `AAXT-SCAFFOLDED-PROBING.md`. An auxiliary LLM reads the conversation history and extracts behavioral patterns as structured observations.

**Strengths:**
- Catches patterns the entity can't self-report (Subliminal — the entity uses knowledge it can't attribute)
- Consistent format across entities
- Doesn't require the entity's cooperation or context window

**Weaknesses:**
- Observer can't access the entity's tacit judgment
- May identify surface patterns without understanding the *why*
- Requires a separate LLM call per entity

### Mode 2: Self-authored handoff briefing (entity reflection)

New. The entity itself writes a handoff memo to its successor, prompted at export time.

**The prompt:**

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
4. Things that went wrong and what you learned from them
5. Anything else your successor would benefit from knowing that isn't
   captured in the system prompt or project memory

Write as if you're briefing a colleague, not filing a report. Be specific.
Cite examples from the conversation where possible.
```

**Strengths:**
- The entity has direct access to its own calibration — it knows *why* it makes the choices it makes
- The "briefing a colleague" frame produces operational specifics, not abstract personality descriptions
- Empirically validated as the highest-value context in handoff scenarios

**Weaknesses:**
- Subject to the same self-model limitations MAXT identified (Subliminal content may be omitted)
- Quality varies with conversation length (short conversations produce thin briefings)
- The entity may confabulate patterns that feel true but aren't grounded

### Why both modes together

| Aspect | External extraction | Self-authored briefing |
|--------|-------------------|----------------------|
| Catches Subliminal patterns | ✅ (by design) | ❌ (self-model limitation) |
| Captures tacit judgment | ❌ (observer limitation) | ✅ (direct access) |
| Grounded in specific evidence | ✅ (cites message IDs) | Varies (may or may not cite) |
| Detects confabulation | N/A | ❌ (entity believes its own story) |
| Cross-validates | Each mode validates the other |

The external extraction catches what the entity can't self-report. The self-authored briefing catches what the observer can't see. **Where they agree, confidence is high. Where they disagree, the human reviewer has a meaningful decision to make** — not a rubber stamp.

This is the same dual-track principle as AAXT/MAXT: structural checks + behavioral checks, automated + manual, observer + subject. Neither alone is sufficient. Together they're a substantially better approximation of the full Layer 5 than either alone.

## Output format

Both modes produce entries in the `field_notes: FieldNote[]` array (Iris's schema decision from Phase 1). Each entry carries its source:

```json
{
  "observation": "User prefers terse responses with no trailing summaries — was explicitly corrected on this early in the engagement",
  "citations": ["msg_42"],
  "confidence": "high",
  "source": "self-authored-briefing",
  "status": "draft"
}
```

```json
{
  "observation": "Entity asks clarifying questions before committing to action plans in 8 of 10 observed decision points",
  "citations": ["msg_18", "msg_55", "msg_89", "msg_102", "msg_130", "msg_167", "msg_201", "msg_234"],
  "confidence": "high",
  "source": "external-extraction",
  "status": "draft"
}
```

The `source` field distinguishes the two modes. The `status` field starts as `"draft"` — all field notes require human review before export. This is Iris's "no rubber stamp" principle in action.

## The periodic reflection variant

The handoff briefing prompt works at export time. A lighter variant could run at natural session boundaries — not a continuous journal (too expensive, too distracting) but a periodic consolidation:

**At session end:**
```
Before this session closes, note 1-3 things you learned about how to
work effectively with this user that a future session of yours should know.
Be specific. If nothing new was learned this session, say so.
```

These micro-reflections accumulate over time. Each one is tiny (~50-100 tokens). They're appended to the entity's memory, not the conversation. At export time, the full handoff briefing can draw on the accumulated micro-reflections as source material — the "subconscious making memories" that xian described.

**Token cost:** ~50-100 tokens per session end. For a channel with 20 sessions, that's ~1000-2000 tokens of accumulated behavioral observations. Well within budget.

**The Auto Dream connection:** This is the "per-session" tier of the consolidation cycle from Janus's memory research. The weekly consolidation (reviewing accumulated reflections for staleness, merging duplicates, flagging contradictions) is the maintenance tier. Both are cheaper than a continuous journal and more structured than ad hoc memory.

## Implementation phases

### 3.5a: Self-authored briefing at export time
- Add the handoff prompt to the export flow
- Entity writes a briefing; output parsed into `FieldNote[]` entries
- Entries surface in the Phase 3 export UI for human review
- **Effort:** Medium. Requires one LLM call per entity at export time.

### 3.5b: External extraction at export time
- Already designed in `AAXT-SCAFFOLDED-PROBING.md`
- Auxiliary LLM scans conversation history, produces `FieldNote[]` entries
- Merge with self-authored entries, flag agreements/disagreements
- **Effort:** Medium. Requires auxiliary LLM infrastructure (already built in Phase 2).

### 3.5c: Periodic micro-reflections
- Session-end prompt for entities (lightweight, optional)
- Accumulated reflections stored as entity memory (new field or memory sub-tier)
- Drawn on by both 3.5a and 3.5b as source material
- **Effort:** Low. One small prompt addition to session wrap. Storage is a memory append.

### 3.5d: Cross-validation and review UI
- Surface both extraction modes side by side
- Highlight agreements (high confidence) and disagreements (needs human judgment)
- Iris collaboration point — the "meaningful review, not rubber stamp" UX
- **Effort:** Medium-High. Iris-shaped problem.

## Who should be in the design discussion

- **xian** — the definition of "meaningful behavioral pattern" is a judgment call that benefits from the person who's been making those judgments intuitively. xian's tacit model of "how Daedalus is" is the ground truth the extraction is trying to approximate.
- **Iris** — the review UX is the difference between rubber stamp and real engagement. Iris's `FieldNote[]` schema decision already sets the structural foundation.
- **Daedalus** — the implementation, the format implications, the integration with the export pipeline.
- **Argus** — the AAXT connection. Both extraction modes feed into the fidelity testing framework. Mode 2 (self-authored briefing) could itself be a probe: does the entity's self-description match its actual behavior as measured by Mode 1?

## Why this matters beyond Klatch

Every system in Janus's memory research survey has the same Layer 5 gap. Nobody has published a solution for transferring learned behavioral calibration across environment boundaries. The dual-mode extraction (external observer + self-authored briefing) with structured output and human review is, as far as we can tell, novel.

If this works — if the field notes produced by Phases 3.5a+3.5b are reliably useful to successor instances — it's a publishable finding. The methodology (two complementary extraction modes, structured output, human-in-the-loop review) is generalizable to any system that needs to transfer agent calibration across sessions, environments, or platforms.

The five-layer model gave us the vocabulary. AXT gave us the measurement framework. The handoff briefing insight gives us the mechanism. Together they're a complete story: here's what doesn't transfer (Layer 5), here's how to measure the gap (AAXT/MAXT), and here's how to fill it (dual-mode extraction with human review).

---

## References

- `docs/plans/STEP-10-EXPORT-META-MODEL.md` — Phase 3.5 placeholder
- `docs/plans/AAXT-SCAFFOLDED-PROBING.md` — external extraction design
- `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md` — "nobody has solved learned behavioral calibration"
- `docs/AXT.md` — Subliminal finding (MAXT Session 01)
- `docs/research/auditbench-methodology-review.md` — tool-to-agent gap (structural presence ≠ functional access)
- Iris's `FieldNote[]` schema decision (Phase 1 design session, April 11)
- Piper Open handoff briefing experiment (xian, April 13 — the originating insight)
