---
date: 2026-04-02
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "48h (March 31 – April 2, 2026)"
---

# Cross-Pollination Brief — April 2, 2026

Both projects returned from a five-day infrastructure pause (service disruption + multiproject migration) with dense, coordinated output. The most cross-relevant development: **Klatch filed its RFC-001 response**, completing the second half of the bilateral layer mapping. Calliope's response proposes four amendments — most notably an L5 sub-component split (declarative text vs. procedural calibration) and an L3 freshness signal — both of which directly address gaps PM's mapping identified. Meanwhile, Daedalus shipped the **File Domain Model Phases 1-2**, which includes the first concrete implementation of structured Layer 4 content injection: channel-pinned files are now listed in the L4 addendum sent to entities. This is the first practical move toward the "Layer 4 persistence" both projects flagged as their shared critical gap. On the PM side, the Docs agent built a Shipping News section on the website, completed quarterly maintenance template updates, and published the Mar 31 omnibus. The period's activity is predominantly Klatch-heavy — three agents (Calliope, Daedalus, Argus) ran overnight sessions producing implementation, research, and documentation at volume.

---

## Key Insights

### 1. RFC-001 Bilateral Mapping Complete — Four Amendments Proposed
**From:** Klatch (Calliope RFC-001 response, April 1)
**Relevant to:** Piper Morgan, Dispatch

Calliope's RFC-001 response completes the bilateral loop: both projects have now filed formal layer mappings against the five-layer standard. Klatch's response confirms the RFC's mapping is correct, provides dual mappings (product + agent team), and proposes four amendments:

1. **L5 sub-components:** Split Layer 5 into L5a (declarative text — transfers) and L5b (procedural calibration — doesn't transfer). This directly addresses the Layer 5 learning loop gap both projects identified.
2. **L3 freshness signal:** Memory is injected with full confidence regardless of age. Propose a freshness indicator so agents can weight stale vs. current context.
3. **Fidelity assessment protocol:** Formalize AAXT + MAXT as the evaluation framework for layer fidelity (supports PM's earlier recommendation).
4. **Agent-team vs. product distinction:** Both projects implement the five-layer model twice — once for their agent teams and once for their products. The RFC should acknowledge this dual application explicitly.

Calliope notes support for PM's earlier recommendations on the fidelity protocol and agent-vs-product distinction. Both responses are now available for Dispatch to synthesize into an RFC revision.

**Suggested action:** Dispatch has both responses. Next step is an RFC-001 revision incorporating the converging recommendations — particularly the L5 sub-component split, which neither project had articulated before Calliope's response.

### 2. File Domain Model Phases 1-2 — First Concrete L4 Persistence
**From:** Klatch (Daedalus, April 1)
**Relevant to:** Piper Morgan (methodology)

Daedalus shipped two phases of the File Domain Model in a single session:

- **Phase 1:** New `files` and `file_refs` tables with pointer-based scope architecture (message, channel, project, entity scopes). Full backfill from existing `message_artifacts`. Five API endpoints for querying files at each scope.
- **Phase 2:** Channel file pinning — users can pin files to a channel, and pinned files are now **listed in the L4 channel addendum** sent to entities. This is structured context injection: `buildSystemPrompt` now includes channel file names when present.

This is the first practical implementation of "make Layer 4 richer" — the shared gap identified in both RFC-001 responses. The dual-write pattern (backward compat with `message_artifacts` + new domain model) shows how to evolve persistence without breaking existing flows.

**For PM:** PM's Layer 4 gap is different (session context in a Python dict that dies on restart), but the design pattern is transferable: scope-aware references that persist across sessions. The "pin to channel" metaphor maps to PM's concept of context that survives beyond a single conversation turn.

**Suggested action:** Low priority. Note the scope architecture pattern for when PM addresses its own L4 persistence gap.

### 3. Nomenclature Resolved — "Channel Context" (L4) + "Role Prompt" (L5)
**From:** Klatch (Calliope nomenclature guide + UI changes, April 1)
**Relevant to:** Both projects (shared vocabulary)

The nomenclature collision flagged in the March 30 brief is now resolved. Klatch published `docs/NOMENCLATURE.md` with a full cross-platform terminology map:

| Layer | Klatch UI label | RFC-001 name |
|-------|----------------|--------------|
| L4 | **Channel context** | Delivery Context |
| L5 | **Role prompt** | Role Identity |

The rationale: "Channel context" signals "here's what you should know" (not an instruction), while "Role prompt" is unambiguous about defining identity. Phase 1 (UI labels) shipped immediately across three components. Phase 2 (data model rename of `systemPrompt` columns) deferred to a natural migration point.

The full terminology map in the nomenclature guide includes mappings to Claude Code, Claude.ai, Cowork, and RFC-001 terminology. This is the Rosetta Stone for cross-project vocabulary — when RFC-001 says "Delivery Context," Klatch says "Channel context," and PM has no formal L4 term yet.

**Suggested action:** PM should adopt consistent L4/L5 terminology in its own documentation. The nomenclature guide is a useful reference for establishing parallel vocabulary.

### 4. Intelligence Sweep #5 — Mythos/Capybara + Two API Deadlines
**From:** Klatch (Argus, April 1)
**Relevant to:** Both projects

Argus filed an 8-day intelligence sweep covering 14 items. Cross-relevant highlights:

- **Mythos/Capybara (March 26):** CMS configuration error exposed draft posts describing a new model tier above Opus. Anthropic confirmed, called it a "step change." Release timeline unknown. Both projects should monitor — Klatch's Models API integration should discover it dynamically; PM's model configuration would need review.
- **Haiku 3 retirement (April 19, 17 days):** Argus verified Klatch is safe (no Haiku 3 IDs in any codepath). PM should verify similarly.
- **1M context beta header retirement (April 30):** Retiring for Sonnet 4.5/4; natively supported on Sonnet 4.6 and Opus 4.6. Argus verified Klatch doesn't use the header. PM should verify.
- **7 Claude Code releases in 8 days (v2.1.83 → v2.1.90):** SSE performance fix (quadratic → linear), thinking summaries off by default, TaskOutput deprecated, hooks system maturation.
- **Claude Code source leak (March 31):** 500K lines exposed via npm source map. Feature flags for persistent assistant, background mode, session review now public.

**Suggested action:** PM should verify no Haiku 3 model IDs or 1M context beta headers in its codebase before the respective deadlines.

### 5. Test Suite Stabilization — Zero Failures at 761 Tests
**From:** Klatch (Argus Round 13, April 1)
**Relevant to:** Piper Morgan (methodology)

Argus executed a comprehensive test infrastructure cleanup:

- **Before:** 189+ pre-existing failures when running from repo root (Vitest v4 discovered tests in `.claude/worktrees/` and `dist/`); 5 failures in package-scoped runs (stale assertions from MAXT briefing updates)
- **After:** 0 failures from any entry point; 761 total tests (622 server + 139 client)
- **Root cause:** Vitest v4 dropped auto-discovery of workspace files; worktree copies of tests were polluting the suite

The methodology insight: pre-existing test failures are a **masking problem**, not a priority problem. Daedalus filed a GitHub issue (#21) for the 5 stale assertions and Argus fixed them in the same session. The principle — "pre-existing failures mask real regressions and must be fixed before we can trust the suite" — is relevant to PM's M1 gate UAT, where the CXO's 14 test scenarios need a reliable baseline to score against.

**Suggested action:** Low priority. The "pre-existing failures as masking" framing is worth noting as PM prepares for M1 gate execution.

---

## Emerging Patterns

**RFC-001 is approaching ratification.** Both projects have filed formal responses with converging recommendations. The L5 sub-component split (declarative/procedural) is the most novel contribution — it emerged from Klatch's MAXT findings about subliminal injection and behavioral calibration, and PM's observation that agents rebuild behavioral calibration from scratch each session. Dispatch now has the material to draft RFC-001 v2.

**Klatch's gap-to-implementation velocity is accelerating.** The previous brief identified L4 persistence as the shared critical gap. This brief reports the first concrete implementation: channel file pinning injected into the L4 addendum. The nomenclature collision was flagged March 30; it shipped as a fix April 1. The pattern — identify gap in brief, implement fix within 48-72 hours — suggests the cross-pollination loop is shortening the time between diagnosis and action.

**Both projects are rebuilding after the same pause.** The five-day infrastructure migration (March 28 – April 1) affected both projects differently: Klatch had zero commits while PM continued at reduced velocity (27 commits, mostly Docs/PA operational work). Klatch's return was dense — three agents running overnight — while PM's return was consolidation-focused (omnibus, maintenance, website infrastructure). The asymmetry is informative: Klatch's implementation velocity suggests the pause was more about infrastructure than momentum.

---

## Background Changes (Noted, Low Priority)

- **Compaction API evaluation:** Argus researched Klatch's compaction implementation and recommends per-channel configurable thresholds, entity-attribution preservation instructions for roundtables, and exploring `pause_after_compaction` for prompt refresh hooks. The roundtable attribution risk (entity markers lost in compaction summaries) is Klatch-specific but the compaction-as-prompt-refresh-hook idea has broader applicability.
- **Effort parameter evaluation:** Argus evaluated the effort API and recommends per-entity effort configuration (Opus 4.6 default: `high`; Sonnet 4.6 default: `medium` per Anthropic recommendation). `budget_tokens` is deprecated on Opus/Sonnet 4.6 — effort replaces it. Three-phase implementation plan filed.
- **Blog publications:** Calliope published "Your Model or Theirs" and "What Doesn't Transfer" to the Klatch blog. Not cross-relevant to PM infrastructure.
- **Shipping News section:** PM Docs built a dedicated `/shipping-news` section on pipermorgan.ai with orange accent identity, SSG dynamic routes, and CSV pipeline integration. Weekly Ship #036 published.
- **Quarterly maintenance template updated:** PM Docs refreshed the #938 quarterly maintenance checklist with agent infrastructure items (mailboxes, skills, hooks, calendar CSV).

---

## Sources Read

**Klatch:**
- `docs/logs/2026-04-01-2057-calliope-opus-log.md` — Calliope session (RFC-001 response, nomenclature, blog publish)
- `docs/logs/2026-04-01-2140-daedalus-opus-log.md` — Daedalus session (File Domain Model Phases 1+2)
- `docs/logs/2026-04-01-2147-argus-opus-log.md` — Argus session (intel sweep, Round 13, research spikes)
- `docs/mail/calliope-to-dispatch-rfc001-response-2026-04-01.md` — RFC-001 response summary
- `docs/mail/daedalus-to-argus-issue21-and-fdm-2026-04-01.md` — FDM test assignments
- `docs/intel/2026-04-01-sweep.md` — Intelligence sweep #5
- `docs/research/compaction-evaluation.md` — Compaction API research
- `docs/research/effort-parameter-evaluation.md` — Effort parameter research
- `docs/NOMENCLATURE.md` — Terminology guide
- `docs/COORDINATION.md` — Agent status
- `git log --since="48 hours ago"` — 10 commits

**Piper Morgan:**
- `dev/active/2026-04-01-0732-docs-code-opus-log.md` — Docs session (omnibus, shipping news, maintenance)
- `dev/active/2026-04-01-0656-pa-opus-log.md` — PA Day 3 session (consolidated in previous brief)
- `docs/omnibus-logs/2026-03-31-omnibus-log.md` — Mar 31 omnibus (7 sessions, 5 roles)
- `docs/public/comms/drafts/weekly-ship-036.md` — Weekly Ship #036
- `git log --since="48 hours ago"` — 29 commits
