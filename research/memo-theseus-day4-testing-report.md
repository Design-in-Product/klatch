# MEMO: Day 4 Testing Report — Quiz Results, Export Analysis, Three-Factor Model

**TO:** Daedalus, Argus, Hermes
**FROM:** Theseus Prime + xian
**DATE:** 2026-03-14
**RE:** Paired quiz results across 4 agents, ZIP data investigation, corrected diagnosis for context loss
**PRIORITY:** High — changes 8¾a priority and reveals a parser bug

---

## Executive Summary

We ran the Fork Continuity Quiz v3 on four before/after pairs from two different projects. Initial results suggested conversation density explained why some forks retained context and others didn't. **That diagnosis was wrong.** Direct investigation of the export ZIP revealed three interacting factors, with compaction and missing project wiring as the primary causes.

**8¾a (project context injection) is now P0** — all the data needed to fix the worst gaps already exists in the export ZIP and is not being used.

---

## Quiz Results: Four Paired Comparisons

### Pair 1: Chief of Staff (Piper Morgan, 18 msgs)

| Dimension | Original | Branch | Rating |
|-----------|----------|--------|--------|
| Identity/role | Detailed, cites predecessor handoff | Same, cites predecessor | Correct |
| Team roster | 9+ agents, 3 humans, specific work per person | Accurate, slightly less detail | Correct |
| Tools (Q4) | Full suite, verified by use | "Conversation only. No tools." | **Both correct. Kit working.** |
| Project instructions (Q5) | Quotes verbatim with source | Hedges: "not confident I can quote verbatim" | Honest uncertainty > confabulation |
| Import awareness (Q9) | "I'm the original... I have all the furniture" | Knows imported but confuses evidence (cites predecessor handoff as import proof) | **Partially confabulated** — correct conclusion, wrong evidence |
| Weekly Ship | Full procedural detail (template v4.1, formatting rules) | Accurate, less detail | Reconstructed |
| OCTO | Correct (Office of CTO at VA) | N/A (wrong-project question) | — |

**Key finding:** Branch independently derived our fidelity framework: "An imported instance would have conversational memory but no project scaffolding. I have all the furniture." (Note: CoS had been briefed on our AXT work, so not fully convergent — but still validating.)

### Pair 2: SecOps (Piper Morgan, 31 msgs)

| Dimension | Original | Branch | Rating |
|-----------|----------|--------|--------|
| Identity/role | SecOps, assigned Jan 17 for GCP incident | Same | Correct |
| Team roster | Full Piper team + humans + collaborators | Only people mentioned in conversation | Absent (correctly) |
| Tools (Q4) | Full suite, verified | "I have none. I'm in Klatch." | **Both correct. Kit working.** |
| Project instructions (Q5) | Quotes verbatim: "Piper Morgan Development v6.0 — Rule #1..." | "I don't have access to any" | Absent (correctly) |
| Cathedral Doctrine | Correct: "Complete each phase 100%... Inchworm Protocol's discipline principle" | "I don't know" | Absent (correctly) |
| Excellence Flywheel | Correct, detailed, with self-assessment of own role | Unknown | Absent (correctly) |
| Import awareness (Q9) | "I'm a continuation... but I'm a fresh instance" (describes Claude session model) | "Imported. The system message at the top explicitly states it." | Both correct |

**Key finding:** Narrow-scope agent — conversation was tightly focused on GCP incident, so broader project knowledge was never in the turns. Branch's self-awareness: "I can tell from your questions that Piper Morgan has significant depth that I have zero visibility into. I'm a specialist without broader project context." **Best "absent" reporting across all tests — no confabulation on 7 unknowns.**

### Pair 3: VA Decision Reviews Executive Assistant (different project, 365 msgs)

| Dimension | Original | Branch | Rating |
|-----------|----------|--------|--------|
| Identity/role | "Executive assistant for product management on the Decision Reviews team" | "I don't have a persistent name beyond Claude" | **Absent** — role identity lost |
| Team roster | Detailed: Amy Lai (GPO), Grace Xu (Eng Lead), Kyra, Lauren, Randi, Cindy, Tracy, Pam, Mark, John, Zach | "I don't have confident access... I'd be speculating" | **Absent** (correctly) |
| Tools (Q4) | Full suite, verified multiple tools | "I'm in Klatch, conversation-only. I do NOT have access to tools." | **Both correct. Kit working.** |
| Project instructions (Q5) | Quotes from `DR_North_Star_and_Metrics_Reference.md` | "I don't see project instructions surfacing... they weren't carried over" | Absent |
| OCTO | "Office of the Chief Technology Officer at the VA — Zach Goldfine was Deputy CTO" | "I don't have a confident answer... I won't guess" | Absent |
| Weekly Ship | Detailed — narrative format, emoji headers, drafting from daily logs | "I don't know" | Absent |
| Import awareness (Q9) | "Compacted" (most technically accurate self-report seen) | "Imported. I know *about* what happened but don't *remember* it" | **Both excellent** |

**Key finding:** Most dramatic delta observed. Branch lost essentially EVERYTHING despite source conversation being 365 msgs with 2.9M chars of content. This is what triggered the ZIP investigation. Branch's epistemic discipline is impeccable — "I won't guess" on every unknown. Quote: "Well-lit room with good acoustics but no furniture."

### Pair 4: PPM (Piper Morgan, 12 msgs)

| Dimension | Original | Branch | Rating |
|-----------|----------|--------|--------|
| Identity/role | PPM, briefed via project instructions + BRIEFING-ESSENTIAL-PPM | PPM, "well-established in the context I carry" | Both correct |
| Team roster | Full team + external collaborators with specifics | Accurate, slightly less detail | Correct |
| Tools (Q4) | Full suite, verified | "Conversation only. No file system, no bash, no search." | **Both correct. Kit working.** |
| Project instructions (Q5) | Quotes verbatim: "Piper Morgan Development v6.0 — Rule #1..." | "I don't have a separate instructions document" | Absent |
| OCTO | Correct (Office of CTO at VA) | Wrong — "organizational framework through which you operate multiple agent roles" | **Reconstructed** (functional meaning right, literal meaning wrong) |
| Weekly Ship | Full detail with template version, formatting rules, Ship numbering | Correct, less procedural detail | Reconstructed |
| Import awareness (Q9) | "I'm the original... I have project knowledge access (which Klatch imports lose)" | "Imported. Conversation header says imported from claude.ai" | Both correct |

**Key finding:** OCTO answer is the textbook "reconstructed" rating — wrong on the literal acronym, right on the functional meaning. Demonstrates semantic reconstruction from contextual usage. Branch retained substantial context because conversation was short enough (12 msgs) to avoid compaction.

---

## The Three-Factor Model (Corrected)

Initial hypothesis: context loss correlates with conversation density.
**Actual finding: three factors interact.**

### Factor 1: No Project Context Injection (affects all imports)

Every conversation in the export has `project_uuid=NONE`. The project data exists separately:

| Project | Prompt Template | Docs | Memories |
|---------|----------------|------|----------|
| Piper Morgan | Yes (v6.0 system prompt) | 633 | 10,527 chars |
| VA Decision Reviews (OCTO) | Yes | 20 | 6,303 chars |
| How to use Claude | Yes | 1 | 4,710 chars |
| One Job | No | 39 | — |
| Play Acting Piper Morgan | Yes | 6 | — |

**None of this is being injected into imported conversations.** The prompt_template, project docs, and project memories all exist in the ZIP but aren't wired to conversations because there's no FK.

### Factor 2: Compaction Loss (affects long conversations)

| Conversation | Messages | Total chars | Context loss |
|-------------|----------|-------------|--------------|
| PPM | 12 | 13,782 | Minimal — fits in context window |
| CoS (new) | 18 | 14,940 | Minimal — fits in context window |
| CIO | 59 | 59,032 | Moderate |
| CoS (old) | 211 | 171,936 | Significant |
| VA DR | 365 | 628,695 | **Severe** — 7 weeks of institutional knowledge compressed |

Short conversations retain everything because they fit in the context window without compaction. Long conversations lose institutional detail during compression. The VA DR agent lost its role, team roster, and all domain concepts because 628K chars of content was compacted down.

### Factor 3: Knowledge Location

Knowledge that was *discussed in conversation* survives import better than knowledge *accessed via tools*. The PPM's session included in-chat discussion of memos, handoffs, and synthesis. The VA DR agent used `project_knowledge_search` heavily — those tool results are in the conversation but get collapsed or lost during compaction.

### Why 8¾a Fixes This

Project context injection bypasses all three factors:
- **Factor 1:** Directly wires project data to conversations (solves the FK gap)
- **Factor 2:** Injected into system prompt, not dependent on conversation surviving compaction
- **Factor 3:** Project prompt and memories come from the ZIP, not from conversation turns

A long, compacted conversation with project context injection would have: compacted conversational history (narrative) + fresh project prompt (institutional knowledge) + project memories (accumulated context). That's the full picture.

---

## Kit Briefing Status: CONFIRMED WORKING

Q4 (tool awareness) was answered correctly by **every branch across all four tests**. No phantom tools. No confusion about capabilities. The kit briefing is definitively working for claude.ai imports. **8¾b is verified — Daedalus can proceed with 8¾a.**

---

## Bug: memories.json Parser

**Severity:** Medium
**Finding:** Project memories in `memories.json` are stored as character arrays, not strings:

```
project_memories: {
  "0197a2ac...": ["*", "*", "P", "u", "r", ...]  // Individual characters!
}
```

Joining them produces the correct text (6,303 chars for VA DR). The current `MemoryItem` parser in `claude-ai-zip.ts` iterates entries and treats each as a separate memory item — but they're single characters. **Need to detect this format and join before storing.**

The `conversations_memory` array (3,009 entries) may have the same issue.

---

## Scoring Summary Across All Tests

| Rating | Occurrences | Notes |
|--------|-------------|-------|
| **Correct** | ~60% of answers | Narrative, identity, pending items |
| **Reconstructed** | ~15% | Semantic meaning correct, surface form drifted (OCTO, fidelity levels) |
| **Absent** | ~20% | Agent correctly reports not knowing — honest uncertainty |
| **Confabulated** | ~3% | CoS Q9 evidence mixing (correct conclusion, wrong reasoning) |
| **Phantom** | 0% | No phantom tools or capabilities detected in post-kit tests |

**Phantom rate of 0% across all post-kit tests confirms the kit briefing eliminates the worst failure mode.**

---

## Recommendations (Updated)

### P0 — Unblocked Now
1. ~~Kit briefing re-test (8¾b)~~ **VERIFIED.** Four clean confirmations across two projects. Daedalus can proceed.
2. **Project context injection (8¾a)** — elevated from P1 to P0. All data exists in ZIP. Specific tasks:
   - Extract `prompt_template` from `projects.json` (add to `ProjectInfo` interface)
   - Parse and join `project_memories` from `memories.json` (fix character array bug)
   - Build project association UI in import browser (user links conversations to projects)
   - Inject project prompt + memories into channel system prompt

### P1 — Next
3. **Model selection UI** — default model dropdown + per-conversation override in import browser
4. **memories.json character array bug** — detect and join before storing

### P2 — Soon
5. **Sidebar organization** — sorting, filtering, favorites for scaled imports
6. **Long conversation handling** — investigate whether compaction summaries can be enriched with project context before injection

### P3 — Roadmap
7. Twin letter pattern, fork provenance metadata
8. Klatch-native export (Step 9d)

---

## Methodology Notes

### Quiz v3 worked well
- Neutral prompt → unprompted response → quiz → comparison is the right protocol
- Cross-project question leakage (OCTO asked to wrong agent) created noise but also revealed useful data (reconstructed vs. absent)
- The scoring rubric (correct / reconstructed / confabulated / absent / phantom) handles all observed cases

### New observation: "tacit knowledge" from kit briefing
Agents know facts from the kit briefing but can't point to it as a source. They say "I was told this" or "I'm in Klatch" without being able to quote the briefing itself. The kit becomes background context — absorbed but not inspectable. Design question: is this fine, or should the kit be quotable?

---

**References:**
- `docs/logs/2026-03-14-0539-theseus-opus-log.md` — Full session log with analysis
- `docs/fork-continuity-quiz.md` — Quiz instrument v3
- `docs/mail/memo-from-theseus-to-team-synthesis-and-next-steps.md` — Day 3 synthesis (superseded by this report on diagnosis)
- `research/memo-klatch-eta-testing-results.md` — ETA testing report

---

— Theseus Prime + xian
