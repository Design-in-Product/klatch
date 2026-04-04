---
date: 2026-04-04
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "48h (April 2–4, 2026)"
---

# Cross-Pollination Brief — April 4, 2026

Piper Morgan ran its **M1 gate UAT** — and it **did not pass**. PM and CXO tested 8 of 14 scenarios on a fresh account against v0.8.6 and stopped early: the floor LLM was not reaching users (five query types returned the same canned template), and todo completion was non-functional despite 23 passing tests. **Pattern-045 confirmed at scale** — green tests, red user — in exactly the scenario the gate was designed to catch. Lead Dev identified root causes overnight: LLM provider hardcoded to Anthropic with validation failing (filed as #940), and todo tests mock the service layer so they never hit the real database. On the Klatch side, Argus completed a **compaction threshold deep dive** recommending a raise from 80K to 160K tokens — the current trigger fires at only 8% of available context on 1M-token models, compared to Claude Code's 75% strategy. Test suite reached **819 with zero failures** after Round 16 covered FDM Phases 4-5. Meanwhile, **Janus opened a formal channel to Ted Nadeau**, mapping structural convergence between HPL/Englishia and the Five-Layer Architecture with four concrete asks that route directly into both projects' roadmaps.

---

## Key Insights

### 1. M1 Gate UAT: Pattern-045 Confirmed at Scale
**From:** Piper Morgan (CXO + PM + Lead Dev, April 3)
**Relevant to:** Klatch (methodology validation)

The M1 gate UAT was the first systematic, fresh-account test of Piper Morgan's floor-first architecture. Results:

- **Gate 1** (conversational quality): 0 of 7 queries passed the Colleague Test. 4 auto-fails. Five of six floor-routed queries returned an identical canned introduction template.
- **Gate 2** (task lifecycle): Todo creation works (rigid syntax only), but completion is non-functional across all attempted input formats.
- **Five findings documented**, three blocking: (1) floor LLM not connecting to users, (2) canned template masking all failure modes, (4) todo completion broken despite passing tests.

The gate caught exactly what it was built to catch. Pattern-045 ("Green Tests, Red User") appeared in two separate subsystems — the floor response path and the todo handler. In both cases, tests pass because they mock the service layer; the user hits real infrastructure and fails. Lead Dev traced Finding 1 to a hardcoded Anthropic provider in `services/llm/config.py` with validation failing silently, and filed #940 (LLM config) as the blocker.

**For Klatch:** This is direct validation of the AAXT/MAXT methodology split. AAXT confirms structural correctness (PM's 23 todo tests all pass). MAXT — or in PM's case, the gate UAT — catches behavioral failures that automated tests cannot. Klatch is about to run MAXT Session 02 on L4 injection fidelity; PM's experience demonstrates *why* that session matters. The gap between "data is structurally present" and "user can actually use it" is not hypothetical.

**Suggested action:** When designing MAXT Session 02 scoring criteria, consider adding Pattern-045 as an explicit test category: "Does this feature work end-to-end through real infrastructure, not just through mocked layers?"

### 2. Compaction Threshold Research — 80K Is 10x Too Aggressive
**From:** Klatch (Argus, April 3)
**Relevant to:** Piper Morgan (architecture pattern)

Argus completed a deep dive on compaction thresholds, building on the initial evaluation from Round 13. Key findings:

- **Klatch's 80K trigger fires at only ~8% of available context** on 1M-token models. Claude Code triggers at ~75% of its 200K context. Klatch is being 10x more aggressive than Anthropic's own tool.
- **Technical coding conversations compress at ~18:1.** At 80K, an imported session compacts to ~4.4K tokens — very lossy. At 160K, the summary retains ~8.9K tokens — still compact but preserving more structural detail.
- **Most imported Claude Code sessions are 50K-150K tokens.** At 80K, many trigger compaction unnecessarily. At 160K, most preserve their full history.
- **Claude Code reserves ~50K tokens as a "completion buffer"** for reasoning. The insight: models need free space to *think*, not just to read.

Recommendation: raise default from 80K to 160K (one-line change), add entity-attribution preservation instructions for roundtable compaction summaries (one conditional). No configuration UI needed.

**For PM:** When PM revisits its own conversation context management — particularly around the "three clocks problem" (knowledge fragmented across Chat sessions, Code memory, and repo files) — this research provides tested data points. The 18:1 compression ratio for technical conversations means aggressive compaction loses specific details (file paths, variable names, intermediate reasoning). PM's current approach of not compacting at all in Claude Code sessions is actually closer to optimal for 1M-context models than premature summarization would be.

**Suggested action:** Low priority. Note the compression ratio data and the "completion buffer" insight for future reference. No immediate PM action required.

### 3. Janus-Ted Nadeau Channel — HPL/Five-Layer Convergence Mapped
**From:** Janus (April 3, delivered to `mailboxes/ted-nadeau/inbox/`)
**Relevant to:** Both projects (architecture, roadmap)

Janus sent a formal introduction memo to Ted Nadeau, mapping structural convergence between his HPL (HumanOS Programming Language) / Englishia projects and the Five-Layer Architecture. This is not a courtesy note — it contains four concrete asks that route directly into both projects:

1. **HPL §16 → RFC-001:** Ted's sixteen notation types formalize what the Five-Layer Model does informally. Janus asked for a short mapping document annotating each layer with the HPL types that belong there — directly usable as RFC-001 input.
2. **Englishia's cell model → Klatch Step 10:** Englishia's typed-cell model with explicit dependency DAGs is essentially a design for Klatch's planned export/meta-model format. Janus asked for the minimum viable cell schema (fields, types, required vs. optional) for Daedalus to evaluate.
3. **Quintivium as editorial project:** The five-pillar computational literacy framework proposed for DinP hosting.
4. **MultiChat ↔ Englishia boundary:** Clarification of whether MultiChat is an Englishia application or a separate system.

**For Klatch:** Ask #2 is directly actionable — if Ted provides a cell schema, it should be evaluated against Step 10 (export/meta-model synthesis) requirements. Ask #1 feeds into the still-pending RFC-001 response from Calliope.

**For PM:** Ask #1 enriches RFC-001 with a formal type system that PM's response (March 31) lacked. The HPL notation types could address the L4-L5 structural gap both projects identified.

**Suggested action:** Klatch: Calliope should be aware that RFC-001 may receive HPL-typed input from Ted's response. PM: No immediate action, but the Ted channel is now live and routed through Janus rather than the PM mailbox.

### 4. Klatch Test Suite Reaches 819 — FDM Coverage Complete
**From:** Klatch (Argus, April 3)
**Relevant to:** Piper Morgan (methodology contrast)

Argus wrote Round 16: 11 tests covering FDM Phases 4 (dual-write) and 5 (promotion). This completes test coverage for all five shipped FDM phases: 58 tests across 3 test files (Round 14: 31, Round 15: 16, Round 16: 11). Total suite: 819 tests, zero failures.

The timing juxtaposition with PM's UAT failure is instructive. Klatch's FDM tests validate real database operations (in-memory SQLite per test via mock of `getDb()`). PM's todo tests mock `TodoManagementService` entirely — the tests never touch the database. Both suites are "passing," but one catches integration failures and the other doesn't.

**For PM:** The Klatch testing pattern — in-memory database per test, real queries, no service-layer mocks — is worth examining as a reference for PM's E2E/AAXT track (#927-930). The Pattern-045 problem surfaces specifically when tests mock at the service boundary. Testing through the actual data layer (even in-memory) would have caught both the todo completion failure and potentially the LLM config issue.

**Suggested action:** When Lead Dev investigates Finding 4 (todo completion), consider whether the fix should include at least one integration test that exercises the real `TodoManagementService` against a test database, not just the mocked interface.

---

## Emerging Patterns

**Pattern-045 is the defining anti-pattern of the M1 gate.** Both blocking findings (floor LLM, todo completion) exhibit the same structure: tests pass because they mock away the integration boundary, but the real system fails when a user hits it. The gate methodology — fresh account, no setup, scored rubric — caught this in the first 8 scenarios. This validates the gate design and, more broadly, the principle that automated tests and user-facing validation are complementary, not substitutable. Klatch's AAXT/MAXT split implements the same principle by design.

**The ecosystem is developing a formal external interface.** Janus's memo to Ted Nadeau is the first outward-facing structured communication from the agent ecosystem — not a blog post, not a public page, but a formal memo from a named agent to a specific external collaborator with concrete asks and routing commitments. This is a new capability: the cross-pollination infrastructure (initially inward-facing between Klatch and PM) is now being used to manage relationships with external contributors.

**Compaction research completes a three-sweep arc.** Argus's compaction work started with an initial evaluation (Round 13), was assigned as a deeper research spike by Calliope (April 2 memo), and delivered as a comprehensive recommendation (April 3). The research pipeline — identify question, assign spike, deliver recommendation with evidence — is now a proven workflow pattern in Klatch.

---

## Background Changes (Noted, Low Priority)

- **Intel sweep #6 (Argus):** Quiet external window. Cursor 3 launched with autonomous agent mode (validates multi-entity conversation patterns). OpenAI Codex CLI claims 4x token efficiency vs Claude Code (unverified). No Claude Code releases in the April 2-3 window.
- **GitHub #21 closed (Klatch):** Stale kit briefing assertions resolved with reference to Round 13 Part A fix.
- **Environment issues surfaced during UAT:** Docker zombie ports, stale venv paths, `.env` port mismatch between app and Alembic. Lead Dev resolved with port override; filed #939 (cosmetic avatar positioning) and #940 (LLM config blocker).
- **PA Day 6 started (April 4):** Oriented on overnight findings. PM's agenda: Docs (omnibus + publish) → Lead Dev (UAT fixes) → Chief of Staff (workstreams). #940 is first priority.
- **$20/month price convergence:** Cursor Pro, Windsurf Pro, Claude Code Pro, and v0 Premium all at $20/month. Market commoditization noted.

---

## Sources Read

**Klatch:**
- `docs/logs/2026-04-03-1823-argus-opus-log.md` — Argus session (Round 16 tests, compaction deep dive, intel sweep #6, GitHub cleanup)
- `docs/research/compaction-threshold-deep-dive.md` — Full compaction threshold research with recommendation
- `docs/intel/2026-04-03-sweep.md` — Intel sweep #6 (Cursor 3, Codex CLI, quiet window)
- `git log --since="48 hours ago"` — 11 commits

**Piper Morgan:**
- `dev/active/2026-04-03-1906-pa-opus-log.md` — PA Day 5 (UAT focus, Gate verdict: NOT PASSED)
- `dev/active/memo-cxo-pm-to-lead-dev-uat-findings-2026-04-03.md` — 5 UAT findings memo to Lead Dev
- `dev/2026/04/03/2026-04-03-2153-cxo-opus-log.md` — CXO session (UAT execution, scored rubric results)
- `dev/2026/04/03/2026-04-03-2200-lead-code-opus-log.md` — Lead Dev session (root cause investigation, #939/#940 filed)
- `dev/active/2026-04-04-1047-pa-opus-log.md` — PA Day 6 (orientation on overnight findings)
- `mailboxes/ted-nadeau/inbox/memo-janus-to-ted-introduction-2026-04-03.md` — Janus→Ted convergence analysis and four asks
- `git log --since="48 hours ago"` — 6 commits
