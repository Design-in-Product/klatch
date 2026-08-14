# Klatch Project Memory

## Project Overview
Klatch is a Slack-inspired local-first web app for managing Claude AI conversations. Codename "Klatch."

## User Profile
- Experienced software product design practitioner, manager, and team leader
- Strong believer in Gall's law (start simple, iterate)
- Wants collaborative design, not just code generation — "smart bottleneck" role
- Prefers conversational coding (engaged on architecture) but not "vibe coding"
- Has auto-accept edits enabled

## Current State (2026-04-04)
- Steps 1–9 complete (current version ~v0.9+)
- **Completed:** persistence, multiple channels, markdown rendering, conversation control, channel identity, multi-entity conversations, interaction modes (panel/roundtable/directed), import from Claude Code JSONL + claude.ai, fork continuity, 5-layer prompt assembly, project context injection, import refinements, file upload/attach (9a), artifact rendering (9b), kit briefing file awareness (9c), code block save (9d-A), tool-based file creation (9d-B), auto-prompt caching, Models API, kit briefing MAXT fixes, File Domain Model Phases 1-5 (schema, channel pinning with L4 injection, project KB with L3 injection, dual-write, promotion), nomenclature rename
- **Step 9 core work complete.** FDM Phases 6-7 (memory-as-file, entity library) deferred to Steps 10-11.
- **Next:** Step 10 (Export + meta-model synthesis) → Step 11 (Search)
- **Pending decisions:** Compaction threshold (80K → 160K recommended), effort parameter (per-entity, Phase 1 ready)
- See `docs/ROADMAP.md` for full roadmap (resequenced March 26)
- See `docs/ARCHITECTURE.md` for decision log

## Tech Stack
- Monorepo: npm workspaces (packages/shared, server, client)
- Server: Hono + better-sqlite3 + Anthropic SDK on :3001
- Client: Vite + React 19 + Tailwind v4 on :5173
- Streaming: POST + SSE pattern (separate creation from observation)
- DB: SQLite at project root (klatch.db)
- Default model: claude-opus-4-6 (Opus 4.6); also supports Sonnet 4.6, Haiku 4.5

## Key Patterns
- POST /api/channels/:id/messages creates user msg + placeholder assistant msg
- GET /api/messages/:id/stream is SSE endpoint for streaming observation
- In-memory EventEmitters bridge Anthropic SDK to SSE, DB written on completion
- Race condition handled: if stream completes before SSE connects, DB is checked
- Stream abort via .abort() on Anthropic SDK stream, catches APIUserAbortError
- 5-layer prompt assembly: Kit Briefing → Project Instructions → Project Memory → Channel Addendum → Entity Prompt
- Prompt debug endpoint: GET /channels/:id/prompt-debug returns assembled layers

## Multi-Entity Architecture
- Entities have name, model, system prompt, avatar color, optional handle (@slug)
- Assign up to 5 entities per channel
- Three interaction modes: panel (parallel), roundtable (sequential, each sees prior), directed (@-mention routing)
- Channel system prompt = shared preamble prepended to each entity's prompt
- Sidebar: Roles (@prefix, 1 entity) vs Channels (#prefix, 2+ entities)

## Import Architecture
- Claude Code JSONL import: parentUuid tree walk, tool-use summaries, compaction extraction
- claude.ai import: ZIP parser for conversations.json, artifact extraction
- Fork-don't-sync: imports are snapshots, continuation forks into Klatch-native chronology
- Kit briefing: injected into system prompt for imported channels, orients agent to new environment
- Project context: projects table with instructions + memory; auto-created from import metadata
- Session browser: scans ~/.claude/projects/ for JSONL sessions, multi-select import
- Cloud sessions: committed to exports/sessions/ in repo, picked up by import browser

## Agent Team
- **Daedalus** — architecture & implementation (works on main)
- **Argus** — quality, testing, intelligence sweeps (branch: claude/audit-and-planning-xn2w7)
- **Theseus** — manual testing & exploration (CLI side)
- **Calliope** — writing, chronicling, coordination (primary contact for xian on Klatch)
- **Mnemosyne** — knowledge base health, documentation drift (migrated to new Claude Chat project, April 2026)
- **Metis** — new agent in Claude Cowork project (holding the fort during migration)
- **Janus** — cross-project DinP agent, manages dinp.xyz website (projects/, internal/, internal/agents/); coordinates with Calliope
- **Dispatch-DinP** — Dispatch role on Design in Product account; sends coordination memos
- **Iris** — UX design & front-end development (parallel to Daedalus, joined April 5)

## AXT Methodology
- Two-track: AAXT (automated, Argus, synthetic) and MAXT (manual, Theseus+xian, real agents)
- Five failure modes: Correct, Reconstructed, Confabulated, Absent, Phantom
- **Subliminal** (new, March 2026): content delivered and functionally accessible, but agent cannot attribute source; self-model of knowledge state is wrong
- MAXT Session 01 (March 24): Aether (fork of Theseus) as subject; 8 findings; subliminal injection of Layer 3 MEMORY.md content confirmed
- AAXT/MAXT gap confirmed: structural delivery ≠ behavioral receipt ≠ conscious attribution

## 5-Layer Prompt Assembly
- Layer 1: Kit Briefing — environment orientation (Klatch, date, model, git status)
- Layer 2: Project Instructions — CLAUDE.md / behavioral rules
- Layer 3: Project Memory — MEMORY.md / factual context
- Layer 4: Channel Addendum — channel-specific framing (empty for chats)
- Layer 5: Entity Prompt — agent identity and persona
- Import fidelity: Layers 1–3 transfer at 100% across environments; Layer 5 (behavioral calibration) transfers at 0% and must be rebuilt

## Domains
- klatch.ing — live GitHub Pages site (landing page + blog)
- klatch.dinp.xyz — legacy redirect
- Future: www.klatch.ing (consumer), app.klatch.ing (hosted demo)

## Blog (klatch.ing/blog/)
- "Unsorted chats" — wireframe-first design process post
- "What Does an Imported Agent Know?" — 5-layer prompt assembly, pace layers illustration

## Cross-Pollination
- Daily automated brief between Klatch and Piper Morgan projects
- Brief committed to docs/briefs/cross-pollination/current.md daily
- Agents read current.md at session start (per CLAUDE.md)
- Dispatch = xian's cross-project coordinator agent

## Intelligence Feed
- Argus files weekly sweeps to docs/intel/ (6 sweeps completed through April 3)
- Sweep #5 headlines: Mythos/Capybara model tier above Opus confirmed, Claude Code source leak (500K lines), Haiku 3 retiring April 19, 1M context beta retiring April 30
- Sweep #6: quiet window, Cursor 3 autonomous agent mode, OpenAI Codex CLI

## npm Note
- npm cache has root-owned files: use `--cache /tmp/npm-cache` or fix with `sudo chown -R 501:20 ~/.npm`

## Test Count
- 819 total tests as of April 3 (680 server + 139 client), zero failures
- Rounds 13-16 complete: test infra, feature tests, FDM Phases 1-5 (58 FDM-specific tests)

## Design Decisions
- Clear history: requires two-click confirmation (first click shows "Confirm clear?" with 3s auto-dismiss)
- Action buttons on messages: inside the bubble (not outside) to avoid overflow clipping
- Fork-don't-sync: imported conversations are snapshots; continuation creates new Klatch-native history
- "System Prompt" field in UI = Layer 4 (channel addendum), not Layer 5 — misleading label, rename candidate
- Tesler's Law (DP8): complexity of cross-environment context management is irreducible; Klatch grapples with it so users don't have to

## Feedback
- [Pre-existing test failures must be triaged](feedback_preexisting_test_failures.md) — create issues, assign to Argus, never just dismiss
- [Mobile design philosophy](feedback_mobile_philosophy.md) — no separate "mobile UX"; holistic design that adapts to context
- [UX evaluation approach](feedback_ux_evaluation_approach.md) — start from user needs and AI landscape, not current state or polish
- [Klatch origin and vision](project_klatch_origin_and_vision.md) — five confirmed hypotheses: message bus, fragmentation, empirical 5-layer model, roundtable north star, cross-vendor moat
- [Klatch is pre-release](feedback_klatch_is_pre_release.md) — no real users yet, don't frame as shipped product; ask "what should it become"
- [Klatch canonical use cases](project_canonical_use_cases.md) — daily omnibus + weekly ship are the two jobs-to-be-done; use them as design forcing functions
- [Blog illustration vocabulary](project_blog_illustration_vocabulary.md) — custom SVG, muted slate palette, library metaphor; not stock photos or AI-generated images
- [Failsafe over-communication across project + hub layers](feedback_failsafe_overcommunication.md) — when a finding could matter at both layers, route to both; cost of redundancy is low, cost of missed routing is high
- [Don't sit passively on unblocked tasks](feedback_dont_sit_passively.md) — when there's no immediate task and a standing task is unblocked, work on it without re-prompting
- [Session log turn-by-turn; logbook is retrospective](feedback_session_log_vs_logbook.md) — two distinct disciplines; session log pegs to each turn (and to xian's timestamps), logbook waits for end-of-day synthesis
- [Mail — read immediately, respond/act immediately, surface input needs](feedback_mail_handle_immediately.md) — no queuing, no batching; default is read-now-act-now; surface to xian what input is needed for anything I can't handle alone
- [Drive xian's offhand observations to completion (within structure)](feedback_drive_offhand_observations.md) — on the duty cycle, "drive vs. surface" dissolves: guardrails + decision-consolidation let xian steer AND delegate; he stays noticing even when agents drive hard (xian, 2026-06-21; → public Letters queue)
- [Duty cycle reframes what Klatch is uniquely for](project_duty_cycle_reframes_klatch_purpose.md) — cross-project duty cycle solves mail-delivery + agent-collaboration; Klatch's unique value narrows to group conversation + interchange protocol; thin-proprietary-layer principle (xian, ongoing strategic thread)
- [BYOC + cross-tool portability + transporter engine — settled distinctions](project_byoc_transporter_device.md) — three distinct concepts settled by xian (via Janus, 6/22 afternoon). BYOC = PM's deployment surface (user in chat installs skills + MCP for PM). Cross-tool context portability = Klatch's real settled concept (move agent conversations across harnesses with context intact). Transporter engine = the exploratory mechanism (5-layer model captured as a standalone tool). Two trust-instrument lessons: (1) loose labels aren't settled meanings; (2) over-correction is its own failure mode — name the label-error precisely; preserve the underlying concept.
- [xian's focal shift — July 2026 (consulting + own products full-time)](project_xian_focal_shift_july2026.md) — day job ends; DinP becomes operational center; OpenLaws becomes external client; Klatch's interchange-protocol vision gets real client-side use cases; "virtuous hyper circle" across projects feeding each other through PM-as-consulting-tool
- [Target commits with explicit pathspecs](feedback_target_commits_explicit_pathspecs.md) — shared main checkout carries other agents' staged work + 100MB DB backups; never bare `git commit`/`git add -A` (xian, 2026-06-21)
- [Docs to main without carrying branch code](feedback_docs_to_main_without_carrying_branch_code.md) — `push HEAD:main` drags un-merged branch code along under the docs commit; commit trivia straight to main, use a temp-ref for docs when real code is stacked (hit twice, harmless both times)
- [Branch push: don't rebase onto main first](feedback_branch_push_no_rebase_first.md) — rebasing the long-lived branch onto a moved main rewrites already-pushed commits → non-fast-forward → needs force-push; just push fast-forward, recover divergence via reset-to-origin + cherry-pick (recurring)
- [Duty-cycle overnight calibration](feedback_duty_cycle_overnight_calibration.md) — overnight watch can be sparse (≥1 check evening→morning, not hourly `17 * * * *`; use `17 3,7-23`); hold UX-delicate/cross-agent-test increments for fresh+coordinated context, autonomy = mechanical+prep (xian, 2026-06-22)
- [Update rollup without asking](feedback_rollup_update_without_asking.md) — when verified facts make the rollup stale, update immediately as matter of course; do not offer and wait for approval (xian, 2026-06-27)
- [Surface agent silences proactively](feedback_surface_agent_silences_proactively.md) — flag mode-1 agent gaps (missed 2+ cron windows + unread work item) at START or immediately when detected; don't wait to be asked (xian, 2026-06-27)

## Beta Definition (xian, 2026-06-26)
- **Beta = composition gesture fully implemented + tested/QA'd → release cut v0.9 or v1.0**
- Step 11 Search is post-beta, not a beta requirement
- Plumbing was ready earlier; UX design (Iris Phase 3) was the critical path; that spec is now complete
- See [project_beta_definition.md](project_beta_definition.md)

## Roadmap Next Steps
1. **Step 9: Files and artifacts** — upload/attach files, render inline, multi-entity document review
2. **Step 10: Export + meta-model synthesis** — 5-layer context packaging, cross-environment export, graceful Layer 5 gap communication
3. **Step 11: Search** — FTS5, search UI, Cmd+K, export, bookmarks
