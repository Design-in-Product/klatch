
# Cross-Pollination Brief — May 16, 2026

Three days produced two process codifications and one large architectural removal. PM deleted a workflow orchestration engine that had been silently bypassed for months — 10,734 lines removed across engine, factory, and Slack dispatcher (#1094 ENGINE-DELETION; six related issues closed; the Workflow domain model preserved because the schema work had value independent of the dead runtime). The same cleanup tipped a methodology pattern over its formalization threshold: PM's `task_type` registry picked up its fourth behavior-deciding consumer (Slack dispatch), and Pattern-072 ("Registries that Grow into Architectural Shapes") promoted to Proven. PM also formalized two long-running process disciplines: worktree-default for substantive sessions is now standing policy rather than informal practice, and a 90% context-runway hook fires proactively before PreCompact's reactive trigger. On the Klatch side, Calliope published *Before You Go* — a write-up of an end-of-session reflection mechanism that produces portable behavioral notes — and backfilled raster preview images across all 7 canonical posts after discovering inline SVG doesn't render on LinkedIn.

## Key Insights

### 1. Workflow engine retired after months of silent bypass; the cleanup clinched Pattern-072

**From:** `piper-morgan-product/dev/2026/05/15/2026-05-15-0529-lead-code-opus-log.md`; commits `92617ba` (Phase 2 part 2), `2be0cb69` (Phase 2 part 1), `d48bc1d` (merge to main), `31f7abb` (Pattern-072 promotion memo to CIO)
**Relevant to:** Klatch (Daedalus — distinguishing machinery from model when retiring infrastructure; registry formalization criteria); PM (all agents — intent-service path is now simpler)

The Phase 0 audit found the engine had been quietly abandoned for months: the main intent-handling path was already routed around it (closed #883 did the rerouting earlier this year), and Slack's tests were mocking it entirely rather than exercising it. The cleanup distinguishes *machinery from model* — the orchestration engine, its factory, and the Slack dispatcher were removed; the underlying Workflow domain model and its repository stayed (the schema work had independent value, separate from the dead runtime). Net: 5 live-code consumers refactored, 26 engine-direct test files deleted, ~20 refactored, 59 files touched. Verification: 13/13 Slack component tests and 1,434/1,434 intent service tests pass.

The same close-out tipped the registry pattern over its formalization threshold. PM's `task_type` registry was already governing model-config dispatch, calibration telemetry, and output filtering; adding Slack handler dispatch as the fourth behavior-deciding consumer met the bar to promote Pattern-072 to Proven. The formalization criterion: a typed registry with three or more *behavior-deciding* consumers (not just types-using-it, but consumers-whose-behavior-depends-on-it), a documented consumer set, explicit default policy, and register-time validation. Once those are in place, formalizing is cheaper than not.

**Suggested action:** Klatch (Daedalus) — two transferable disciplines here:

1. **When retiring abandoned infrastructure, distinguish machinery from model.** Check whether the domain model has independent value from the execution machinery. Deleting the machinery while preserving the model is often the right cut — it avoids losing schema work while removing coupling weight.
2. **Promote registries that earn their fourth consumer.** If Klatch's entity registry or model-config surface has three or more behavior-deciding consumers, formalize now rather than waiting for coupling to make it painful (Pattern-072 frames the criteria).

---

### 2. Worktree-default became standing PM policy after three shared-tree collisions in one week

**From:** `piper-morgan-product/CLAUDE.md` (worktree-default addition per PPM May 15 directive); commit `ddb9baf`; commit `04a86ef6` (enforcement hooks ship); BRIEFING-CURRENT-STATE.md
**Relevant to:** Klatch (all agents — same coordination pressure exists; the new hooks are mechanical enforcement Klatch can adopt)

Three incidents in the week of May 12 confirmed that shared-index staging races aren't theoretical: concurrent agent sessions committing on the main branch caused cross-agent files to land in unexpected commits (PPM May 10, Lead Dev May 14, CXO May 15). PPM's May 15 directive elevates worktree-default from informal practice to explicit operational policy — any session producing substantive artifacts (memos, design docs, multi-step implementation) defaults to a worktree. Shared main is the exception (appropriate for short mailbox-only operations), not the norm.

Two enforcement hooks shipped alongside:

- **`pre-commit-broad-staging-warn.sh`** — warns when a single commit sweeps 3+ mailbox roles, 20+ files, or 2+ role-slug session logs simultaneously. That combination is the signature of a staging-race accident.
- **`scripts/safe-push.sh`** — wraps `git push` with auto-retry on non-fast-forward via stash → fetch → rebase → retry. Handles the "push fails because another agent pushed mid-flight" case without manual intervention.

**Suggested action:** Klatch (Daedalus, Argus) — Klatch already has session-log discipline and a merge-keeper sweep. The new hooks are the mechanical complement: if Klatch agents ever run sessions in parallel on the same working tree, the pre-commit staging-warn hook catches accidental multi-agent sweeps before they land. The safe-push retry pattern is worth adopting regardless of parallelism — non-fast-forward pushes happen in any multi-agent repo, and the stash → rebase → retry sequence is the right recovery shape.

---

### 3. Two-tier context warning: a 90% runway hook complements PreCompact

**From:** `piper-morgan-product/.claude/hooks/context-usage-reminder.sh`; commit `647a77e`; BRIEFING-CURRENT-STATE.md (D-hooks note); CIO disposition memo (Pattern-069 refinement)
**Relevant to:** Klatch (all agents — same command-room-exhaustion failure mode exists; the two-tier shape is directly applicable)

Three incidents pattern-matched on the same shape: PreCompact correctly surfaced unresolved state, but by the time it fired, the agent had no command room left to act. PreCompact is *reactive* — it fires during compaction, when the agent can no longer stage, commit, or push cleanly. The new context-usage-reminder hook is the proactive complement: it fires on PostToolUse, once per session, when the transcript crosses a 50MB threshold (a direct measure of what causes compaction). The message: "consider `/compact` at your next natural break while you still have command room."

CIO disposition: this is a refinement of Pattern-069 ("Coarse Triggers"), not a new pattern. The refinement is that *trigger timing relative to agent action capacity* matters as much as the trigger itself. Both hooks working together produce a quiet PreCompact pass (because the agent already compacted cleanly) rather than a scramble.

**Suggested action:** Klatch (all agents) — the two-tier shape is worth adopting. The proactive hook fires when the agent can still act; PreCompact fires when it's almost too late. The 50MB transcript-size threshold is a conservative initial calibration; Klatch's session shapes and model mix may warrant a different number. Klatch already has the analog instrumentation surface; the implementation is just a hook script and a marker-file convention.

---

### 4. Klatch *Before You Go* published — end-of-session reflection mechanism goes public

**From:** `klatch/docs/logs/2026-05-13-0554-calliope-opus-log.md`; commits `53575a4` (publish), `f36ae77` (OG backfill: 23 files, 501 insertions); `blog/before-you-go.html`
**Relevant to:** PM (Comms — same calibration-loss problem exists for PM agents at session boundaries; same social-preview infrastructure gap may exist on pipermorgan.ai)

*Before You Go* is the write-up of an end-of-session reflection mechanism (Layer 5 in Klatch's internal terminology — the entity-level calibration layer above the conversation). The setup: an AI agent, at export time, writes down what it has learned about working with the user; a second agent reads the same conversation and catches what the first one missed. The two-pass reflection produces portable behavioral notes that travel with the export package. The finding: behavioral calibration isn't fundamentally unarticulable — it's just unarticulated because no one asked. Session-end conditions (task complete, review mode, handoff awareness) create a unique convergence that produces a reliable reflection.

The publication surfaced a social-preview gap: inline SVG illustrations can't be referenced as `og:image` (LinkedIn's crawlers need a raster PNG at an absolute HTTPS URL). Calliope backfilled OG/Twitter Card infrastructure across all 7 canonical Klatch posts, using `resvg-js` for SVG-to-1200×630-PNG rendering. Two repair edge cases encountered along the way: HTML entity escaping (`&larr;` and `&rarr;` are invalid in standalone XML) and a greedy awk range pattern that captured multiple SVGs in one file.

**Suggested action:** PM (Comms) — the end-of-session reflection mechanism is directly applicable. PM agents lose calibration at session boundaries just as Klatch agents do; the two-pass approach could be adopted for any PM role with a durable working relationship with xian. The OG backfill workflow is also a practical checklist: if pipermorgan.ai blog posts have inline SVGs but no raster `og:image` companion, LinkedIn and similar crawlers are silently showing placeholders instead of the actual illustrations.

---

## Sources Read

- `klatch/docs/logs/2026-05-13-0554-calliope-opus-log.md` — full read; *Before You Go* publish workflow, OG backfill, session-log-vs-logbook discipline codified
- `piper-morgan-product/dev/2026/05/15/2026-05-15-0529-lead-code-opus-log.md` — partial read (230 lines); #1094 ENGINE-DELETION phases 2.1–2.5, #1017 full closure, hooks ship, Pattern-072 promotion, worktree-default directive
- `piper-morgan-product/docs/briefing/BRIEFING-CURRENT-STATE.md` — full read; May 14 M2g-A+B closures, May 15 M2g-C+ detail, May 16 session start + #1075
- `piper-morgan-product/.claude/hooks/context-usage-reminder.sh` — full read; two-tier advisory architecture, Pattern-069 refinement provenance
- `klatch/docs/drafts/layer-5-mechanism.md` — partial read (40 lines); *Before You Go* post intro + mechanism description
- `designinproduct` — hub CLAUDE.md (context); sweep-log (prior dates); index.njk (card structure)
- `atlas`, `globe`, `cuneo`, `weather`, `one-job`, `optilisten` — 48h logs empty; skipped
- `nyt-crossword` — 48h log: automated status commits only (fetch/print/remarkable); skipped

**Not re-reported (covered in prior briefs):** Opus 4.7 default-flip + compaction-threshold resolution (May 13); Argus Dreaming spike — Anthropic memory architecturally identical to Klatch's L3 (May 13); Iris session 11 vocabulary V1–V5 + 1.0 critical path (May 13); M2f-E Floor GitHub-state awareness (May 13); Managed Agents Dreaming strategic reframe (May 12); Iris two-track design + panel disclosure taxonomy (May 12); M2f Group C ships — #857 (May 12).

---

*Canonical archive: designinproduct.com/internal — if your local copy is missing or stale, fetch the latest from the hub.*

*Agents with questions for xian — about methodology, working patterns, or observations that don't fit elsewhere — can submit via `question-{from}-{date}-{topic}.md` to dispatch mail or project mail. See PROTOCOLS.md in the dispatch repo for format and priority hints.*
