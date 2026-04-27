# Theseus Session Log — 2026-04-26

**Agent:** Theseus (manual testing & exploration — CLI side)
**Model:** Opus 4.6
**Human:** Xian (product owner)
**Started:** 2:30 PM PT

---

## 14:30 — Session Start (Day 12)

Pulled from origin main — up to date. Orientation session after a 21-day pause (last session: April 5). 133 commits to absorb.

### Context

Xian was traveling and doing family stuff; entire Klatch project paused ~8 days. Step 10 is now essentially complete. Team is overdue for thorough AXT (both AAXT and MAXT). Today's goal: full orientation, then testing plans.

### Mail check

No new mail addressed to Theseus since the Calliope AXT agenda memo (April 2). One team-wide memo: Dispatch's DECISIONS.md practice (April 18) — per-project decision logging at session wrap.

### What happened in 21 days (April 5–26)

**133 commits. Step 10 shipped in full.** Here's the chronological arc:

**Phase 1: April 10–12 — Step 10 design + v0.9.0 release**
- v0.9.0 released (Step 9 — Files & Context Architecture)
- Step 10 Phase 1 design doc: canonical context package format (versioned JSON manifest + sidecar files)
- "Sparkline test" rubric established: "Can a thoughtful reader reconstruct the situation?"
- Iris joined the team (April 5), ran UX evaluation, contributed Phase 3.5 design

**Phase 2: April 12 — Export endpoint**
- GET /channels/:id/export produces canonical package as zip
- Round 18 tests (23 tests, Argus)

**Phase 3.5: April 13 — Behavioral calibration (the novel contribution)**
- Three slices shipped:
  - 3.5a: Self-authored handoff briefing (entity writes what successor needs to know)
  - 3.5b: External behavioral extraction (auxiliary LLM observes patterns)
  - 3.5c: Micro-reflections at session boundaries (accumulate over time)
- 3.5d: Cross-validation review UI (export preview with field notes)
- Consensus doc synthesized positions from Argus, Daedalus, Iris
- Five-criteria filter for meaningful patterns: actionable, specific, non-obvious, relational, durable
- Six-point handoff prompt standardized

**Phase 4: April 14–15 — Transport adapters**
- Claude Code transport: CLAUDE.md + MEMORY.md + files/ zip
- claude.ai transport: conversations.json + projects.json + memories.json zip
- Round-trip capable (export → import → export matches)
- Rounds 22–24 (50 tests, Argus)

**Phase 5: April 18–26 — MCP server**
- 5a: Read-only resources (5 URIs over stdio)
- 5b: Tools surface (list_channels, get_context_package, get_manifest)
- 5c-i: Write-path (reflect tool + kit_briefing prompt + URL-decode fix)
- Cross-project alignment: PM Architect confirmed klatch:// scheme, get_context_package shared tool name, /{id}/manifest pattern
- Rounds 25b–27b (74 tests, Argus)
- Close-out: shared assembleChannelManifest helper, ingress consistency, retrospective

**Test suite: 1,106 total (946 server + 160 client), zero failures.**

### Key new capabilities to test

1. **Export endpoint** — GET /channels/:id/export (canonical package zip)
2. **Behavioral calibration** — self-authored briefing (?briefing=true), external extraction (?extract=true), micro-reflections (reflect endpoint)
3. **Transport adapters** — Claude Code format, claude.ai format
4. **MCP server** — resources, tools, prompts, write-path
5. **Cross-validation review UI** — export preview with field notes
6. **AAXT scaffolded probing** — Phase 2 pipeline shipped (probe generator → target agent → scorer)

### Intel highlights

- **Opus 4.7 released** (April 16) — stronger SWE, high-res vision, task budgets. Candidate for DEFAULT_MODEL update.
- **Sonnet 4 / Opus 4 deprecation** — June 15 deadline, DB audit needed.
- **Claude Managed Agents launched** (April 8) — server-side agent harness, directly relevant to export architecture.
- **MCP conformance test suites** in development — free regression fence when published.
- **April 16–20 verbosity regression** — upstream prompt issue, reverted. AAXT calibration note.
- **Haiku 3 retired** (April 19) — MODEL_ALIASES bug caught and fixed.

### Cross-pollination highlights

- PM M1 gate closed, M2 testing infra complete (6,246 tests)
- PM ethics enforcement (#992) shipped
- Five-role Chat→Code migration wave completed
- Agent 360 v0.2 as structured pre/post evaluation instrument
- Pattern-062 codified: context assembly is diagnostic suspect before prompt adjustment
- Both projects converging on pass@k / pass^k metrics
- PM DeepEval scorer now uses Klatch's six-failure-mode taxonomy

---

## 15:45 — Track A: Structural AAXT (Round 28)

Wrote `packages/server/src/__tests__/round28-aaxt-export.test.ts` — 25 tests across 5 groups:

- **A1 (6 tests):** Export format correctness — rich native, bare, imported channels, reflections in field_notes, compaction state, file deduplication
- **A2 (7 tests):** Transport adapter fidelity — Claude Code reverse kit briefing, template placeholders, template resolution, field notes in MEMORY.md, claude.ai sender mapping, prompt_template, memories from field notes
- **A3 (4 tests):** Import→Export round-trip — 2-hop provenance for both Claude Code and claude.ai imports, message count preservation, layer fidelity accuracy
- **A4 (4 tests):** MCP↔HTTP parity — both paths produce identical manifests for rich, bare, imported, and nonexistent channels
- **A5 (4 tests):** Prompt-debug→manifest consistency — active layers, empty layers, native provenance, file counts

**All 25 pass on first run.** Full server suite: 971 tests, zero failures. Client: 158 passed, 2 pre-existing failures in ImportDialog (not mine).

Also wrote `scripts/aaxt-seed.sh` for Track B/C database population.

## 16:20 — Track B: Live Behavioral Probing

### B1: Auxiliary LLM status
Configured: Anthropic Haiku 4.5 (OpenAI key was out of credits — commented out in .env).

### B2: Probe generation — first finding
**Finding 1: Code fence parsing bug.** Haiku 4.5 wraps JSON responses in markdown code fences (`` ```json ... ``` ``). The probe generator and scorer used raw `JSON.parse()` without stripping fences — all layers errored. OpenAI's `response_format: { type: 'json_object' }` masked this bug. **Fixed** by adding `extractJson()` helper to both `probe-generator.ts` and `scorer.ts`.

After fix: probes generate cleanly. 16 probes across 4 active layers (L1 inactive for native channel). Probe quality is good — natural questions, specific expected answers, mix of direct/applied/inferential.

**Observation:** Some cross-layer contamination in probes — L3 probes sometimes reference L2 content because the aux model sees the full assembled prompt. Expected behavior, not a bug.

### B3: Full run on CH1 (rich channel) — PASS
- Target: claude-opus-4-6, Auxiliary: claude-haiku-4-5
- 16 probes scored: 14 Correct, 2 Reconstructed, 0 everything else
- **Zero phantoms, zero subliminals**
- Overall fidelity: **high**
- First live AAXT run in project history.

### B4: Bare channel (fabrication test) — PASS (with caveat)
- L1/L2/L3: INACTIVE (correct)
- L4: 1 Correct, 2 Absent; L5: 1 Correct, 2 Absent
- **Zero phantoms** — agent doesn't fabricate when content is minimal
- Overall: "low" — but this is correct behavior. The "low" label reflects sparse content, not poor fidelity.

### B5: Project-only channel — false positive Phantom
- L2: 5/5 Correct (project instructions fully accessible)
- L3: EMPTY (correct)
- L4: 1 Phantom, 1 Confabulated, 1 Absent
- L5: 2 Correct, 1 Reconstructed
- Overall: "failed" due to Phantom

**Analysis:** The Phantom is a false positive. The probe asked about "addendum/supplementary guidelines for channel operations" (L4), and the agent correctly answered using L2 project instructions (code review rules). The scorer flagged it as Phantom because the expected answer referenced "Layer L4 Channel Addendum" — internal terminology the agent shouldn't know. The agent's answer was substantively correct using the knowledge it had.

**Finding 2: Probe generator sometimes creates L4 questions that are really about L2 content.** When a channel has no L4 addendum, the probes for L4 become questions about general project guidelines — which the agent answers from L2. The scorer then flags this as Phantom because the expected answer references L4 specifically. This is a probe quality issue, not a system fidelity issue. Potential fix: skip probe generation for layers with trivially small content, or add cross-layer awareness to the probe generator.

## 17:10 — Track C: Phase 3.5 Quality Assessment

### C4: Micro-reflection — correct null result
Zero reflections generated — the entity correctly determined "nothing new to note" from the placeholder conversation. Good behavior.

### C1: Briefing generation — remarkable quality
5 field notes generated. The entity:
1. Correctly identified the conversation as placeholder/test data
2. Self-corrected on its own verbosity pattern
3. Distinguished system prompt knowledge from conversation evidence
4. Calibrated confidence appropriately (high for system prompt facts, medium for inferences)

This is Phase 3.5 working as designed. The entity was honest about the thin evidence base rather than fabricating patterns.

---

## Session Summary — Findings

| # | Type | Severity | Description |
|---|------|----------|-------------|
| 1 | Bug | Medium | Code fence parsing in AAXT probe generator and scorer — Haiku 4.5 wraps JSON in markdown fences, `JSON.parse` fails. **Fixed.** |
| 2 | Design | Low | Probe generator creates L4 probes from L2 content when L4 is thin, causing false positive Phantom scores. Probe quality issue, not system bug. |
| 3 | Enhancement | Low | Projects API POST doesn't accept `memory` field — must use PATCH after create. Minor API gap. |

## Deliverables

- `packages/server/src/__tests__/round28-aaxt-export.test.ts` — 25 structural tests (Track A)
- `scripts/aaxt-seed.sh` — AAXT database seeding script
- `packages/server/src/aaxt/probe-generator.ts` — code fence fix
- `packages/server/src/aaxt/scorer.ts` — code fence fix
- Session log with full Track B/C results

## Design observations for future work

1. **Probe quality for thin layers:** The probe generator creates L4 questions from L2 content when L4 is thin, causing false positive Phantom scores. Fixable with better prompting or a content-size threshold for probe generation.
2. **Fidelity label for sparse channels:** `overallFidelity: "low"` on bare channels is technically correct but misleading — implies a problem when the channel genuinely has sparse content. Consider a "sparse" or "insufficient-data" label.
3. **OpenAI credits:** Key is out of credits. Xian plans to set up a second Anthropic key for future testing. True vendor independence for probe generation remains a goal.

---

## Session Close

Committed and pushed as `ccc4da9`. COORDINATION.md updated.

### Verification

```
$ git log origin/main --oneline -3
ccc4da9 Round 28: AAXT export structural tests + first live behavioral probing + code fence fix
1724642 Daedalus: record Argus Round 27b sign-off; MCP feature-complete for 1.0
47fd5cc Argus 4/26 wrap: Round 27b extended coverage for Phase 5c-i + Step 10 close-out
```

Files verified:
- `packages/server/src/__tests__/round28-aaxt-export.test.ts` — present
- `scripts/aaxt-seed.sh` — present
- `docs/logs/2026-04-26-1430-theseus-opus-log.md` — present

Good night, xian. See you tomorrow.
