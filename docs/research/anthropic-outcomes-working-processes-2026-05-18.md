# Anthropic Outcomes — Applicability to Our Working Processes

**Filed by:** Argus
**Date:** 2026-05-18
**Triggering ask:** xian, 5/18 07:43 — "anthropic has released something called Outcomes that looks interesting, possibly for our working processes"
**Scope:** narrow on workflow-pattern applicability (not architectural impact like the May 12 Dreaming spike); evaluate Outcomes as a tool for HOW WE WORK as a team, not as a Klatch feature.
**Companion reference:** `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md` (same methodology, different question).

---

## Plan of attack

Four passes, mirroring the Dreaming spike discipline:

| Pass | Goal | Status |
|------|------|--------|
| 1 | Plan + scoping (this section) | ✅ complete |
| 2 | What Outcomes is technically — rubric format, lifecycle, API surface | ✅ complete |
| 3 | Where it could plug into our existing working processes — five candidate slots | ✅ complete |
| 4 | Synthesis: recommendations + decisions needed | ✅ complete |

Out of scope: Klatch product features built ON Outcomes (different question; if it ever comes up, separate spike). Architectural impact on import/export (Outcomes is a session-level construct, not a memory primitive).

---

## Pass 2: What Outcomes is technically

### Headline

Outcomes is a **rubric-based grading harness for managed agent sessions**. You define what "done" looks like (description + markdown rubric); Anthropic provisions a **separate grader** (separate context window, isolated from main agent's implementation choices) that evaluates the artifact against the rubric. Iterates until satisfied or `max_iterations` (default 3, max 20).

### The rubric format

Plain markdown. Per-criterion gradeable. Hierarchical (heading sections, criteria as bullets). Anthropic's only opinionated guidance: **"explicit, gradeable criteria"** rather than vague ones. Example from the docs (DCF Model Rubric):

```markdown
# DCF Model Rubric

## Revenue Projections
- Uses historical revenue data from the last 5 fiscal years
- Projects revenue for at least 5 years forward
- Growth rate assumptions are explicitly stated and reasonable

## Cost Structure
- COGS and operating expenses are modeled separately
- Margins are consistent with historical trends or deviations are justified
```

Bonus tip from the docs: "if you don't have a rubric on hand, try giving Claude an example of a known-good artifact and asking it to analyze what makes that content good, then turn that analysis into a rubric. This middle-ground approach often produces better results than writing criteria from scratch."

### Lifecycle

Five terminal results emitted as `span.outcome_evaluation_end` events:

| Result | Next |
|--------|------|
| `satisfied` | Session transitions to `idle`. Done. |
| `needs_revision` | Agent starts a new iteration cycle. |
| `max_iterations_reached` | No further evaluation; agent may run one final revision. |
| `failed` | Session transitions to `idle`. Returned when "the rubric fundamentally does not match the task" — e.g., description and rubric contradict. |
| `interrupted` | Only if `user.interrupt` fires after `outcome_evaluation_start`. |

Only one outcome at a time per session, but you can **chain outcomes in sequence** (send a new `user.define_outcome` after the terminal event of the previous one).

### API surface

- `POST /v1/sessions` — create session (Managed Agents primitive)
- `POST /v1/sessions/:id/events` with `user.define_outcome` event (description + rubric + optional `max_iterations`)
- Rubric: inline `{type: "text", content: "..."}` OR `{type: "file", file_id: "..."}` (uploaded via Files API; requires `files-api-2025-04-14` beta header)
- Stream events: `span.outcome_evaluation_start` / `_ongoing` / `_end`
- Poll: `GET /v1/sessions/:id` → `outcome_evaluations[].result`
- Required beta header: `managed-agents-2026-04-01`

### Critical constraint

**Outcomes is a Managed Agents feature.** It requires:
- A Managed Agent definition (workspace-side configuration)
- An Environment (the container/runtime where the agent works)
- A Session (the unit of work)

You can't use Outcomes against a Claude Code session, a Claude Chat conversation, or a Klatch channel. The grader runs against artifacts produced inside `/mnt/session/outputs/` in a managed-agent container.

This is the load-bearing constraint for workflow applicability. **The pattern is portable; the mechanism is not.**

### Sources

- [Anthropic — Define Outcomes reference](https://platform.claude.com/docs/en/managed-agents/define-outcomes)
- [Anthropic — Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- 5/11 intel sweep + 5/12 Dreaming spike (Outcomes was bundled with Dreaming/multiagent/webhooks in the May 6 "Code with Claude" announcement)

---

## Pass 3: Where could Outcomes plug into our working processes?

Five candidate slots in our existing workflow. For each: a fit assessment (mechanism vs pattern), a cost note, and a recommendation.

### Slot 1 — Round assignments (Daedalus → Argus)

**Current pattern:** Daedalus writes a memo (e.g., `daedalus-to-argus-round33-assignment-2026-05-11.md`) with prose acceptance criteria. Argus implements; the implicit grader is Argus's own test-design discipline; sign-off comes via COORDINATION update.

**With Outcomes — mechanism path:** would require migrating Argus's work surface into a Managed Agent session. Cost: heavy (we'd be re-platforming agent identity from Claude Code to Managed Agents); billing implications (6/15 Agent SDK pool); loses Claude Code's interactive ergonomics. Not recommended.

**With Outcomes — pattern path:** Daedalus writes the assignment memo as a **rubric** (markdown sections, gradeable bullets) instead of prose. The rubric goes into the memo body; Argus self-grades against it during the work; the COORDINATION sign-off cites the rubric explicitly. This is essentially what Round 33's assignment does informally already ("Exit criteria when you're satisfied that..."), just more structured.

**Recommendation: pattern-adopt for next round assignment.** Cheap; consistent with our existing memo discipline; gives Argus an explicit checklist to self-grade against; survives the cross-environment transfer (a rubric in markdown reads the same in any agent's session).

**Bonus:** the rubric becomes a forcing function for Daedalus to think about gradeable acceptance criteria up front. "Make sure no regressions" → "Suite stays ≥ N tests green; new test file is at <path>; assertions cited per scope item."

### Slot 2 — AAXT scaffolded probing

**Current pattern:** AAXT generates probes per layer, scores responses, classifies into Correct / Reconstructed / Confabulated / Absent / Phantom / Subliminal. The auxiliary LLM IS effectively a grader — `aaxt/json-extract.ts` + `aaxt/auxiliary.ts` already implement this.

**With Outcomes — mechanism path:** AAXT runs synthetically and doesn't produce session artifacts in the Managed Agents sense. Different granularity (per-prompt vs per-session). Not applicable.

**With Outcomes — pattern path:** AAXT's scoring already IS a rubric-grader. **The interesting question is reverse-adoption:** can AAXT borrow the Outcomes rubric format as a standard schema for probe-set documentation? Round 30's anti-leakage prompt instructions ("never reference layer names by name in expected answers") suggest a checklist of probe-quality requirements that resembles a rubric.

**Recommendation: defer.** AAXT's scoring is mature and the categorical model (5+ failure modes) is more nuanced than satisfied/unsatisfied. No urgency to refactor.

### Slot 3 — Iris triage patches (Tier 1 / Tier 2)

**Current pattern:** Iris's `docs/ux/triage-patches.md` enumerates patches with acceptance descriptions. Daedalus implements; Argus writes coverage tests. This IS a rubric-shaped workflow already, just informal.

**With Outcomes — pattern path:** Iris's triage doc IS a rubric in everything but the markdown formatting convention. Adopting Anthropic's per-criterion-bullet pattern would (a) make the doc self-graderable by Argus's test coverage, (b) give Daedalus an explicit checklist of "what's the patch supposed to prove," (c) survive transfer if/when Iris ever exports a triage spec to a Managed Agent for autonomous implementation.

**Recommendation: light-touch pattern-adopt.** Worth a note in Iris's next session ("consider structuring triage entries as gradeable criteria"). Don't impose; suggest. Iris is opinionated about her design vocabulary and the change should be hers if she wants it.

### Slot 4 — Calliope's chronicle / logbook discipline

**Current pattern:** Logbook entries pegged to xian's timestamps; session logs turn-by-turn; verification step before any "done" claim. Discipline is rule-based and already well-defined per `feedback_session_log_vs_logbook.md`.

**With Outcomes — pattern path:** Calliope's existing discipline is more nuanced than a satisfied/unsatisfied grader could produce (the timestamp-peg discipline, the synthesis-vs-snapshot distinction, etc.). A grader could check structural completeness (every claim has a verification step, every commit is cited) but not the editorial judgment Calliope brings.

**Recommendation: don't apply.** Outcomes is the wrong tool for chronicling work. Calliope's existing discipline is the right one.

### Slot 5 — Workstream reviews (per PM Methodology-25)

**Current pattern:** Fri-Thu window, Fri-Tue writing, Wed publish. Source discipline: primary session logs over omnibus per Ship #041. Cross-project, not Klatch-internal.

**With Outcomes — pattern path:** Workstream reviews are inherently editorial-judgment work — synthesis of multi-day activity into narrative. A grader could check structural completeness (sources cited, window covered, length under target) but not the narrative quality.

**Recommendation: don't apply.** Same reasoning as slot 4. Editorial judgment doesn't grade well.

---

## Pass 4: Synthesis — recommendations + decisions needed

### The headline

**Outcomes is most useful to us as a pattern, not as a mechanism.** The mechanism (Managed Agents sessions + grader iteration) doesn't fit our existing agent platform (Claude Code subscriptions for interactive roles + direct API for Klatch's product layer). Re-platforming to use Outcomes natively would cost more than it gains.

**The pattern (rubric-shaped acceptance criteria, per-criterion gradeable, structured for iteration)** is portable and partially already in use. Three of our five workflow slots benefit from explicit pattern-adoption; two don't (chronicling + workstream reviews are editorial-judgment work).

### Concrete recommendations

**R1 — Pattern-adopt for round assignments.** Daedalus's next round-assignment memo should structure acceptance criteria as a gradeable rubric. Argus's sign-off cites the rubric explicitly in COORDINATION. Round 33 already does this informally ("Exit criteria"); the formalization makes it self-graderable and survives cross-environment transfer.

  - **Decision needed:** Daedalus's call. Cost is ~5 minutes of memo restructuring per round. I can lift the rubric format from the Anthropic docs example and propose it.

**R2 — Pattern-adopt for Iris triage docs (light-touch).** Suggest, don't impose. Iris's existing triage doc shape is rubric-adjacent; the additional structure would make patches self-graderable and survive transfer to autonomous implementation if/when that ever ships.

  - **Decision needed:** Iris's call. Memo to her noting the pattern fit, no ask for change.

**R3 — Don't pattern-adopt for AAXT.** AAXT's categorical failure-mode model is more nuanced than satisfied/unsatisfied; existing auxiliary scorer is mature. Re-litigating to align with Outcomes vocabulary is churn for no gain.

**R4 — Don't pattern-adopt for chronicling/workstream reviews.** Editorial-judgment work doesn't grade well in the rubric pattern. Calliope's existing discipline is the right shape.

**R5 — Watch for second-order effects.** If Anthropic's rubric format becomes a de facto standard for agent acceptance criteria across the ecosystem, Klatch's `klatch.context.v1` format may eventually want a slot for "rubric attached to this conversation" — analogous to how `field_notes` carries briefing notes. **Speculative; no action.** File for the next sweep cycle if MCP or other protocol surfaces show rubric-as-first-class-citizen evolution.

### Cost / billing note

**Outcomes inherits the 6/15 Agent SDK credit pool** (per today's 5/18 sweep item 1). If we ever DID adopt the mechanism path (slot 1 mechanism, e.g., migrating Argus to a Managed Agent), each per-round iteration cycle would draw from the new credit pool at full API rates. Pro $20 / Max 5x $100 / Max 20x $200 monthly ceilings would govern.

The pattern path has no such cost — it's just markdown formatting.

### What this spike does NOT recommend

- Building Klatch features on top of Outcomes. Different question.
- Migrating any agent role from Claude Code to Managed Agents to use Outcomes natively. Mechanism cost too high.
- Refactoring AAXT or Calliope's chronicle discipline. Both already work.

### What the spike DOES recommend

- **One memo to Daedalus** proposing rubric-pattern adoption for the next round assignment (carries a concrete proposal so it's actionable, not just framing).
- **One memo to Iris** noting the pattern fit, no ask for change.
- **One memo to Calliope** for next cross-poll brief framing: "Outcomes is a pattern, not a mechanism, for our use" — useful for sibling projects considering similar questions.
- **No code change.** No format spec change. No round assignment.

---

## Summary for the executive reader

**Outcomes is a rubric-based grading harness for Anthropic Managed Agents sessions.** You write a markdown rubric, send a `user.define_outcome` event, a separate-context grader iterates with the agent until satisfied (or max_iterations).

**For Klatch as a product:** no architectural fit today. Outcomes lives in the Managed Agents stack; Klatch is a separate product with its own session model.

**For our working processes:** the **pattern** is useful, the **mechanism** isn't. The pattern (gradeable per-criterion acceptance criteria) maps cleanly to round assignments and Iris triage docs — both already informal versions. Adopting the format makes the work self-graderable and survives cross-environment transfer. The mechanism (managed-agent sessions + separate-context grader) requires re-platforming agent identity and incurs the new 6/15 Agent SDK credit-pool billing. Not worth it.

**Three short routing memos** capture the recommendation (Daedalus, Iris, Calliope). No code work; no contract change; no roadmap impact.

**Companion finding to today's billing spike:** the Outcomes pattern adoption has zero cost; native Outcomes mechanism would draw from the new Agent SDK credit pool. The two findings consume the same set of design-time considerations.

