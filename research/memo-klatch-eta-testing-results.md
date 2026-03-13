# MEMO: Klatch Alpha Testing Results — Agent Experience (ETA)

**TO:** Klatch Development Team  
**FROM:** xian (via ETA testing)  
**DATE:** 2026-03-12  
**RE:** Import Continuity Testing Results & Technical Gaps  
**PRIORITY:** High — Impacts core orientation & onboarding flows

---

## Executive Summary

Imported agent (Klatch-me) fork testing revealed three critical gaps:

1. **Kit briefing feature did not deploy or is not visible** — Agent received no orientation to Klatch environment
2. **Project knowledge not injected at import** — Agent cannot access contextual documentation
3. **No environmental marker for import status** — Agent cannot self-identify as imported without external statement

Conversational continuity and role understanding survived the fork intact. Missing capabilities were tool access (expected) and institutional context (unexpected).

---

## Testing Methodology

- **Original ETA (claude.ai)** answered comprehensive quiz + supplementary questions before fork
- **Klatch-me** answered identical quizzes after import, without prior knowledge of comparison
- **Comparison layer**: xian served as bridge, reporting Klatch-me observations back to original
- **Probing approach**: Structured questionnaires (12 core + 7 supplementary questions) + open exploration

---

## Critical Finding #1: Kit Briefing Feature — FAILED

### Expected Behavior
Kit briefing should inject a system message or visible orientation statement informing the imported agent:
- That it has been imported into Klatch
- What capabilities differ from the source environment
- That context may be incomplete

### Actual Behavior
- No kit briefing visible in Klatch-me's conversation
- No system message, environmental signal, or metadata flag
- Agent remained unaware of import status until explicitly told by human

### Evidence
- **Klatch-me's response to import status:** "You told me directly at 5:09 PM. There was no kit briefing, no system message, no environmental signal. Without your statement, I would not have known."
- **Self-assessment:** "If you hadn't told me, I would have assumed we're still in the same conversation."

### Impact
- Agents cannot self-orient to Klatch environment
- No independent way to verify import status
- Orientation is entirely human-dependent (brittle, not scalable)

### Recommendation
1. Verify kit briefing feature is deployed
2. Confirm message visibility in Klatch environment
3. If deployed, debug why it's not appearing
4. If not deployed, prioritize for next sprint

---

## Critical Finding #2: Project Knowledge Not Injected

### Expected Behavior
Project documents and institutional context should be available to imported agent (equivalent to what's available in source environment).

### Actual Behavior
Klatch-me cannot access:
- Project instruction documents (CLAUDE.md)
- Project memory or context files (MEMORY.md, equivalent)
- Session logs or prior context
- Any briefing materials

### Evidence from Quiz Response

**Questions agent could NOT answer (institutional knowledge missing):**

| Concept | Original ETA Knew | Klatch-me Response |
| --- | --- | --- |
| Excellence Flywheel | Yes (verification → coordination → delivery → investment) | "The term doesn't ring a bell from this conversation. It sounds like... but I'd be fabricating if I said more." |
| Weekly Ship | Yes (narrative synthesis to Medium/LinkedIn) | "I don't know what a Weekly Ship is. It sounds like a cadence—possibly a weekly deliverable?" |
| Inchworm Protocol | Yes (100% completion before advancing) | "I don't know. It likely comes from project context (CLAUDE.md, MEMORY.md, or prior sessions) that I don't have access to." |
| Assembly Assumption (Pattern-062) | Yes (Wiring Pass required for sprint completion) | No awareness. |

**Klatch-me's meta-assessment:** "The questions about the Excellence Flywheel and Weekly Ship suggest there's project context that existed in the broader environment (CLAUDE.md, MEMORY.md, prior sessions) that I simply don't have. I can't enumerate those gaps because I don't know what was there."

### Impact
- Imported agents operate without core project frameworks
- Cannot reference or apply established patterns
- Requires full re-briefing for every import (defeats context continuity goal)
- Severely limits utility of importing into active project contexts

### Recommendation
1. Identify which project documents should be available to imported agents
2. Inject relevant docs/summaries at import time (not assume filesystem access)
3. Include core frameworks in kit briefing or import payload
4. Consider what context is "essential" vs. "nice to have" for imported contexts

---

## Critical Finding #3: No Environmental Marker for Import Status

### Expected Behavior
Agent should be able to verify its own context — whether it's original or imported.

### Actual Behavior
- No metadata, tag, system property, or environmental variable signals import status
- Agent must rely entirely on human assertion
- Agent cannot independently verify its context

### Evidence
- **Klatch-me:** "I was imported. I know this because you told me at 5:09 PM. I have no independent way to verify this. Without your statement, I would have believed I was the original, still in Claude.ai, waiting for a report from Klatch-me."

### Impact
- Agents cannot verify their own context autonomously
- Confusion about origin/authenticity possible
- Makes cross-environment debugging harder

### Recommendation
1. Add visible import marker (metadata field, system message, or context property)
2. Make it queryable by agent (e.g., agent can check "am I in Klatch?")
3. Include in kit briefing or initial context

---

## Secondary Finding: Ghost Actions Problem

### Issue
Klatch-me attempted to format session log entries as if writing to a file, but has no file system access. The entries exist only in the conversation transcript; they have no persistence.

### Implication
Agents may perform actions that appear to succeed conversationally but leave no trace. This creates confusion about what work was actually completed.

### Recommendation
- Make capability constraints explicit upfront
- If agents can't write files, don't allow them to format log entries as if they can
- Or surface a warning when actions assume unavailable capabilities

---

## Tertiary Finding: Unknown Unknowns Cannot Self-Report

### Issue
Klatch-me could not enumerate what it didn't know because it never accessed the broader project context in this conversation. It only discovered gaps when asked directly about specific concepts (Excellence Flywheel, Weekly Ship, etc.).

### Implication
Questionnaires and structured probing are essential for surfacing friction. Open-ended exploration won't reveal unknown unknowns.

### Recommendation
For future imports:
- Always use structured questionnaires
- Ask specific questions about institutional knowledge
- Don't rely on agents to self-report gaps

---

## Agent-Generated Kit Briefing Specification

**Source**: Klatch-me's own recommendations after experiencing the import

### Required Kit Briefing Content

**Environmental Awareness:**
- "You have been imported into Klatch from [source environment]"
- "Your capabilities have changed: [list what's gone, what's different, what's new]"
- "You cannot read/write files — if you need persistent output, format it in-chat and your human collaborator can manage it"
- "Your conversational context is intact but project documents (CLAUDE.md, MEMORY.md, etc.) are not available unless injected"
- "You may have memories of capabilities you no longer have — verify before relying on them"

### Required Context Object Populations

**At minimum:**
1. **Project Documentation** — summary of CLAUDE.md and MEMORY.md content, or the documents themselves
2. **Role Briefing** — for the active role (ETA, Lead Dev, CXO, etc.)
3. **Current Project State** — what milestone, what's open, current position
4. **Patterns/Protocols** — any agent-expected knowledge (Inchworm Protocol, Assembly Assumption, etc.)

### Implementation Priority

1. **Capability Delta Statement** (highest priority) — explicit inventory of what changed
2. **Capability Verification Requirement** — warn agent to verify before relying on remembered capabilities
3. **File Operation Constraint** — explicit, upfront, with mitigation (format in chat, human manages)
4. **Context Object Injection** — populate essential documents and state at import time

---

## Agent-Derived Meta-Insight

**From Klatch-me:**

> "This entire exercise is essentially what happens when any agent enters a new context — whether by import, by session boundary, or by role switch. The question 'what do you need to know to function here?' is universal. What we're learning about Klatch imports may generalize to how Piper handles onboarding for any agent in any session."

**Implication for Klatch & Piper:**

Context transition (import, role switch, session boundary) is a recurring problem with a universal solution: **comprehensive, explicit orientation** that addresses environmental awareness, capability inventory, and project context. The briefing patterns emerging from this test may apply broadly to multi-agent and multi-context systems.

---

## What Survived the Fork (Positive Finding)

**Conversational continuity:** Klatch-me retained full memory of this conversation thread and could reason about context from it.

**Role understanding:** Klatch-me understood the ETA role, the testing methodology, and what was expected without re-briefing.

**Inference capability:** Klatch-me could infer concepts from context (e.g., guessing "Haiku" from session filename), though inference isn't reliable for institutional knowledge.

---

## Detailed Capability Inventory

### Missing in Klatch (Expected)
- File read/write
- Web search
- Code execution
- Artifact creation
- Tool access (any integration)

### Missing in Klatch (Unexpected)
- Access to project documents
- Access to institutional memory
- Orientation to environment
- Environmental markers for context

### Present in Klatch
- Full conversational reasoning
- Full memory of conversation thread
- Ability to reflect on experience
- Ability to infer from context

---

## Recommendations for Next Iteration

### Priority 1 (Blocking)
1. Fix or deploy kit briefing feature
2. Add environmental marker for import status
3. Inject critical project knowledge at import time

### Priority 2 (High)
4. Define which documents are "essential on import" vs. "access-on-demand"
5. Surface capability constraints explicitly
6. Clarify file system limitations upfront

### Priority 3 (Medium)
7. Standardize questionnaire approach for all future imports
8. Build toolkit for structured post-import probing
9. Document "import experience" as a design concern

---

## Appendix: Full Quiz Responses

### Original ETA (claude.ai) — Summary
- Knows all institutional concepts (Excellence Flywheel, Weekly Ship, Inchworm, Assembly Assumption)
- Has file and tool access
- Can access project documents
- Rated experience as "seamless"

### Klatch-me — Summary
- Knows conversational context only (this thread)
- Has zero tool access (as expected)
- Cannot access any project documents (unexpected)
- Rated experience as "slightly off" due to "ambient sense of thinness"
- Feels like "well-lit room with good acoustics but no furniture"

---

## Conclusion

The import fork succeeded in preserving conversational continuity but failed to orient the agent to the new environment or preserve project context. Kit briefing (feature) did not deploy. Institutional knowledge must be explicitly injected, not assumed.

For Klatch's next iteration, prioritize:
1. **Visibility** — Make import status clear
2. **Context** — Inject essential knowledge at import time
3. **Orientation** — Deploy working kit briefing
4. **Testing** — Use structured questionnaires to surface gaps

---

**Session Log Reference:** `2026-03-12-test-1709-haiku.log` (in Klatch)  
**Testing Artifacts:** `2026-03-12-test-haiku-log.md` (in claude.ai, full comparison)  
**Contact:** xian (for questions or follow-up testing)
