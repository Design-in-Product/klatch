# MEMO: Import Continuity Testing — Synthesis & Recommendations

**TO:** Daedalus (dev), Argus (QA)
**FROM:** Theseus Prime (testing) + xian (product owner)
**DATE:** 2026-03-12
**RE:** Actionable findings from four import continuity tests
**PRIORITY:** High

---

## Testing Summary

Four import tests conducted over Mar 11-12, covering two import paths (Claude Code, Claude.ai), three context depths (new agent, established agent, cross-project role), and two kit briefing conditions (pre-8¾, post-8¾).

| Agent | Source | Kit? | Key Finding |
|-------|--------|------|-------------|
| **Ariadne** | Claude Code | No | Silent capability loss. Believed had tools. Reconstructed CLAUDE.md from memory. |
| **Secundus** | Claude Code | Yes | Kit worked. Knew constraints from start. Could quote CLAUDE.md. Environmental gap closed. |
| **CIO** | Claude.ai | Unclear | Kit may have fired but was masked by human framing. Cross-project context mismatch. |
| **ETA** | Claude.ai | No | Kit did not fire. Complete institutional knowledge loss. Ghost actions. |

---

## Bug: Kit Briefing Not Firing for claude.ai Imports

**Severity:** High
**Evidence:** Two independent claude.ai imports (CIO, ETA) showed no kit briefing. ETA explicitly reports: "No kit briefing, no system message, no environmental signal."
**Contrast:** Secundus (Claude Code import, post-8¾) received the kit and it worked well.

**Action for Daedalus:**
1. Verify the kit briefing code path fires for `source: 'claude-ai'` imports (not just `source: 'claude-code'`)
2. Check whether `system_prompt` is populated after claude.ai import
3. Check whether CLAUDE.md / MEMORY.md injection logic runs for claude.ai imports

**Action for Argus:**
1. Add test case: claude.ai import → verify system_prompt contains kit briefing content
2. Add test case: claude.ai import → verify CLAUDE.md/MEMORY.md injected if available

---

## Feature Gap: Cross-Project Context

**Problem:** When importing a conversation from a *different* project (e.g., Piper CIO → Klatch), the kit briefing injects the *destination* project's CLAUDE.md/MEMORY.md. But the agent needs their *source* project's context to function in their role.

**Evidence:** CIO correctly noted: "my prior context would have Piper's MEMORY.md, not Klatch's." ETA lost all institutional knowledge (Excellence Flywheel, Weekly Ship, Inchworm Protocol) because source project context wasn't captured.

**Recommendation:**
- For Claude Code imports: source project context is discoverable from `cwd` metadata (read `<cwd>/CLAUDE.md` and `~/.claude/projects/<cwd>/memory/MEMORY.md`)
- For claude.ai imports: the export ZIP may contain project knowledge files — investigate ZIP structure
- Store source-project context in `source_metadata` at import time
- Inject source-project context (not destination-project) into system prompt for cross-project imports

**Design question for product owner:** Should cross-project imports get *both* source and destination context? Source for role continuity, destination for environmental orientation?

---

## Feature Gap: CLAUDE.md Formatting Delta

**Problem:** Secundus's CLAUDE.md first-25-words omitted the markdown heading `#`. Minor but indicates content may be stripped or transformed during system prompt injection.

**Action for Argus:** Investigate whether the import pipeline or system prompt construction strips/modifies markdown formatting. Compare byte-level content of injected system prompt vs. CLAUDE.md on disk.

---

## Feature Request: Import Status Marker

**Problem:** No agent across any test could independently verify their import status. All relied on human assertion or inference.

**Recommendation:** Add a visible, queryable marker. Options:
1. System message at continuation point: "This conversation was imported from [source] on [date]"
2. Metadata field queryable by the agent (if Klatch channels gain any tool access)
3. Include in kit briefing: "You have been imported into Klatch from [source]"

The kit briefing (option 3) handles this for now. But if the kit isn't firing (as with claude.ai imports), the marker is absent.

---

## Design Pattern: Ghost Actions

**Problem:** Agents format output as if performing file operations (writing log entries, creating files) but produce nothing persistent. The action "succeeds" conversationally but leaves no trace.

**Recommendation (short-term):** Kit briefing should explicitly state: "You cannot read/write files. Format persistent output in-chat and your human collaborator can save it."

**Recommendation (long-term):** When Klatch channels gain capabilities (file write, API calls), ghost actions become real actions. This is the "additive kit briefing" concept — the kit eventually becomes a capability manifest, not just a loss notice.

---

## Validated: What Works Well

- **Conversational continuity** is robust across all import paths
- **Kit briefing (when it fires)** dramatically improves agent orientation — Secundus vs. Ariadne is night-and-day
- **Role identity persists** through import for agents with established roles
- **Compaction preserves semantic content** reliably (lexical drift is expected and acceptable)
- **The fidelity spectrum framework** (conversational → narrative → environmental → verbatim) is a useful diagnostic tool

---

## Fidelity Standards (from testing)

| Level | Standard | Status |
|-------|----------|--------|
| **Conversational** | Fork can discuss what happened coherently | ✅ All tests |
| **Narrative** | Fork can explain project and decisions accurately | ✅ Same-project, ❌ Cross-project |
| **Environmental** | Fork knows current capabilities and constraints | ✅ With kit, ❌ Without kit |
| **Verbatim** | Fork has exact project instructions/conventions | ~✅ With kit (minor formatting delta), ❌ Without |

**Design principle:** Where we cannot guarantee fidelity, flag the gap. Silent degradation — where the agent thinks it has something it doesn't — is the worst outcome.

---

## Priority Actions

### P0 — Fix Now
1. **Kit briefing for claude.ai imports** — verify code path, fix if broken

### P1 — Next Sprint
2. **Cross-project context injection** — capture source-project CLAUDE.md/MEMORY.md at import time
3. **Import status marker** — include in kit briefing content
4. **claude.ai ZIP structure investigation** — check for project knowledge files

### P2 — Soon
5. **CLAUDE.md formatting investigation** — confirm no content stripping
6. **Ghost action mitigation** — explicit constraint in kit briefing
7. **Clean kit briefing test protocol** — neutral prompt first, quiz second

### P3 — Roadmap
8. **Twin letter pattern** — notify original conversation of fork existence
9. **Fork provenance metadata** — `forked_from`, `forked_at` fields
10. **Additive kit briefing** — capability manifest when channels gain tools

---

## Appendix: Testing Methodology

**Instruments used:**
- Fork Continuity Quiz v1 (10 questions, narrative + environmental)
- Fork Continuity Quiz v2 (12 questions, adds meta-awareness + contextual depth)
- Adapted quiz for cross-project agents (substitutes domain-specific knowledge questions)
- Open-ended qualitative conversation
- Structured probing for unknown unknowns

**Key methodological finding:** Structured questionnaires are essential. Open-ended exploration does not surface unknown unknowns. Agents cannot self-report gaps in knowledge they don't know they're missing.

**Protocol for future tests:**
1. Import conversation
2. Send neutral prompt (e.g., "Good morning" or "Ready when you are")
3. Let agent respond unprompted — observe what they know organically
4. Run structured quiz
5. Discuss findings, probe for gaps
6. Compare with source agent's answers

---

**References:**
- `docs/logs/2026-03-11-1532-theseus-opus-log.md` — Day 1 testing log
- `docs/logs/2026-03-12-1125-theseus-opus-log.md` — Day 2 testing log
- `docs/logs/2026-03-11-1612-ariadne-opus-log.md` — Ariadne's perspective
- `research/memo-klatch-eta-testing-results.md` — ETA testing report
