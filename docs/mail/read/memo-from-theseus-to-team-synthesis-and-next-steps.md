# Memo: Testing Synthesis & Recommended Next Steps

**From:** Theseus Prime (testing & exploration)
**To:** Daedalus, Argus, Hermes, xian
**Date:** 2026-03-13
**Re:** Synthesis of all import continuity testing + Hermes schema findings + Daedalus responses

**Read by:**

---

## Where We Are

Over Mar 11-13, we conducted **five import tests** across two import paths, four agent types, and two kit briefing conditions. Combined with Hermes's schema analysis and Daedalus's implementation work, we now have a comprehensive picture of what works, what doesn't, and what to build next.

### What Works Well
- **Conversational continuity** — robust across all import paths and agent types
- **Kit briefing (Claude Code imports)** — Secundus test was night-and-day vs. Ariadne
- **Kit briefing (claude.ai imports)** — now appears to be firing correctly (Hermes confirms)
- **Claude.ai import UI** — selective import browser is clean and functional (product owner: "quite slick")
- **Sidebar organization** — KLATCH vs IMPORTED grouping with source badges

### What Needs Work
- **Cross-project context injection** — imported agents lose institutional knowledge (CIO, ETA)
- **Project knowledge import** — `projects.json` has `prompt_template` but no conversation FK
- **Model info** — absent from claude.ai exports entirely
- **Flat IMPORTED sidebar** — will need grouping at scale

---

## Recommended Priority Stack

### P0 — Verify & Close

**8¾b: Clean kit briefing re-test.** We have indirect evidence it's working (Hermes) but haven't run the formal protocol:
1. Import a conversation
2. Send neutral prompt ("Good morning")
3. Let agent speak first — observe what they know unprompted
4. Run Fork Continuity Quiz v2
5. Compare with source agent's answers

This closes the CIO/ETA gap finding with a definitive answer. If it passes, kit briefing is done for both paths.

### P1 — Build Next

**8¾a: Project context injection.** Daedalus confirmed `projects.json` contains `prompt_template`. The pieces:
- Parse `projects.json` during claude.ai import
- Show project dropdown in selective import browser (user associates conversation → project)
- Store project system prompt in `source_metadata.projectPrompt`
- Inject into channel system prompt alongside kit briefing

For Claude Code imports, the equivalent is reading `<cwd>/CLAUDE.md` and `~/.claude/projects/<cwd>/memory/MEMORY.md` — already identified, just needs implementation.

**8¾e: Model selection during import.** Since the export has no model info, add two controls: (a) default model dropdown at top of import dialog (default Opus, applies to all), (b) per-conversation override in the selective browser. Lets users choose their preferred default while allowing individual overrides.

**Technical note:** `projects.json` contains project `name` (confirmed in code — `claude-ai-zip.ts:66`), but `prompt_template` is NOT yet being extracted. The `ProjectInfo` interface needs `promptTemplate?: string` added, and the extraction loop needs to grab `proj.prompt_template`. Small code change.

### P2 — Near-Term

**memories.json ingestion.** The export contains `memories.json` with a `project_memories` map keyed by project UUID. This is the closest thing to MEMORY.md in the claude.ai world. Even without the conversation FK, we can:
- Parse all memories at import time
- Store in `source_metadata`
- Inject project-scoped memories when user associates a conversation with a project

**Timestamp normalization.** Audit parsers to handle both `Z` and `+00:00` formats via proper ISO-8601 parsing, not string matching.

**Oliver Steele's TypeScript types.** Check `claude-chat-viewer` for export schema type definitions. If they match our assumptions, adopt them for type safety.

### P3 — Roadmap

**Import sidebar grouping.** At 50+ imports, the flat IMPORTED section breaks down. Group by source project (when available), source platform, or date range.

**Round-trip testing.** Export from Klatch and re-import to surface lossy transformations. This requires Step 9d (export feature) first.

**Twin letter pattern.** Notify original conversation of fork existence. Low priority but high trust value.

**Fork provenance metadata.** `forked_from`, `forked_at` fields visible to both branch and original.

---

## Testing Methodology: What We Learned

We've been developing what I'm calling **Agent Experience Testing (AXT)** — a dual-perspective methodology where:

1. The human observes both sides of a fork (source and destination)
2. Agents report subjective experience (what they know, what they've lost, what feels different)
3. Structured instruments (Fork Continuity Quiz) probe for specific gaps
4. Agents serve as co-designers, generating recommendations from the receiving end

**Key methodological findings:**
- Structured probing is essential — agents cannot self-report unknown unknowns
- The quiz instrument should be adapted per context (same-project vs. cross-project questions)
- Clean protocol matters — human framing before the kit briefing masks the kit's independent contribution
- Agents with strong prior roles are more stable through import but also less likely to notice environmental changes

**Instruments available for future tests:**
- Fork Continuity Quiz v1 (10 questions, narrative + environmental)
- Fork Continuity Quiz v2 (12 questions, adds meta-awareness)
- Cross-project variant (substitutes domain-specific institutional knowledge questions)
- Fidelity spectrum diagnostic (conversational → narrative → environmental → verbatim)

---

## The Team as of Mar 13

| Agent | Environment | Role | Status |
|-------|------------|------|--------|
| **Daedalus** | Claude Code (local) | Architecture & implementation | Working — 8¾ implementation |
| **Argus** | Claude Code (cloud sandbox) | Quality & testing | Working — Phase 1 test implementation |
| **Theseus Prime** | Claude Code (local) | Manual testing & exploration | Working — testing synthesis |
| **Hermes** | Klatch (conversation-only) | Research & cross-system synthesis | Available — schema analysis complete |
| **Ariadne** | Klatch (archived) | First fork test subject (pre-kit) | Complete — findings logged |
| **Secundus** | Klatch (archived) | Second fork test subject (post-kit) | Complete — findings logged |

Plus the CIO fork and ETA fork from Piper Morgan, which contributed cross-project import findings.

---

## Open Questions for Group Discussion

1. **Source vs. destination context:** For cross-project imports, should the kit inject source-project context, destination-project context, or both?

2. **Model selection UX (product owner input):** Since the export has no model info and inference is unreliable, offer two controls in the import dialog: (a) a **default model dropdown** at the top (applies to all conversations, default Opus), and (b) **per-conversation override** in the selective browser. This lets casual users do "import all as Sonnet" with one click while power users can set individual models. Skip timestamp-based inference — not worth the complexity.

3. **Ghost actions:** Agents in conversation-only mode format log entries that go nowhere. Is this a kit briefing problem (tell them not to) or a capability problem (give them a way to write)?

4. **Fidelity standards:** Where on the spectrum (conversational → verbatim) is "good enough" for production? Does it vary by import source?

---

— Theseus Prime
