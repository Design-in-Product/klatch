# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `main`
- **Status:** available
- **Test count:** 1263 total (1085 server + 178 client; +18 server fingerprint Round 33, +18 client typography Round 33; 1 deliberately skipped pinning Iris finding); zero genuine failures (14 client timing flakes under parallel-load — pre-existing infrastructure issue, all green when files run in isolation; routed to Daedalus 5/11).
- **Completed work:**
  - Rounds 4–11 test suites (all passing, merged to main)
  - Intelligence feed: 7 sweeps filed (6 manual + 1 curated automated)
  - Round 13: test infra fixes + 11 feature tests + research spikes (compaction, effort)
  - Rounds 14–16: File Domain Model Phases 1–5 — 58 tests total
  - Round 17: Compaction threshold + effort parameter — 18 tests
  - Round 18: Step 10 Phase 2 export endpoint — 23 tests
  - Round 19: AAXT Scaffolded Probing Phase 2 — full pipeline + 8 tests
  - Round 20: Phase 3.5 UX fixes — 7 tests
  - Round 21: Phase 3.5d review UI — 14 tests
  - Round 22/23: Phase 4 Claude Code transport — 27 tests
  - Round 24: Phase 4 claude.ai transport incl. round-trip — 23 tests
  - Round 25b: Phase 5a MCP server extended coverage — 29 tests (sign-off gate for 5b)
  - Round 26b: Phase 5b MCP tools surface extended coverage — 18 tests (sign-off gate for 5c)
  - Memo to Daedalus: MCP ResourceTemplate URI decoding finding (non-blocking, 5c design note)
  - Pattern-062 diagnostic added to AAXT scaffolded probing protocol (assembler audit before prompt iteration)
  - PM #995 fabrication-probe coordination memo to PM Lead Dev (convergent design, three alignment asks)
  - Intel sweep #8: curated review of 4/20 automated + 4/21–4/26 delta (Sonnet/Opus 4 retirement clock noted, MCP conformance work in progress)
  - Round 27b: Phase 5c-i + Step 10 close-out extended coverage — 27 tests (sign-off gate for 1.0 MCP feature-complete). Covers reflect protocol integration, write-path persistence, channel-boundary isolation, kit_briefing across all source types, URL-decode parameterized across all 4 ResourceTemplate handlers, ingress parity end-to-end (klatch-ui ↔ mcp), assembleChannelManifest refactor equivalence.
  - Round 31b: /import/klatch round-trip extended coverage — 30 tests (sign-off gate for 1.0 round-trip claim). Six scope items per Daedalus's assignment: round-trip fidelity matrix (10 it.each() cases × source/scope/state combos + forked round-trip), idempotency invariants (deterministic 409, double-fork distinctness, source-instance row stability, byte-identical canonical IDs across fresh-instance round-trip), source preservation matrix (claude-code/claude-ai/klatch + chain-doesn't-break), negative cases (project.v1 kind rejected, missing-files silent skip, malformed JSONL line skip; FLAGGED: future format_version permissive, empty entities un-exportable), MCP × import parity (assembleChannelManifest ↔ HTTP /export structural equivalence + zip round-trip), 409 envelope shape (UI-can-prompt-without-refetch).
  - Intel sweep #9 (4/27): orphan recovery via cherry-pick (filed on deleted branch `claude/amazing-ptolemy-NcAtO`; trigger now fixed) + curated review at `docs/intel/2026-04-27-sweep-curated.md`. Two highest-stakes items verified in-session: Opus 4.7 thinking opt-in is NOT a regression (Klatch already passes `display: 'omitted'`); MCP STDIO injection (Ox Security) is NOT exposed (Klatch is server-side, not a client launching subprocesses). Genuine "watch": Opus 4.7 tokenizer +35% (compaction/cost impact) routed to Daedalus alongside his open default-flip eval. Memos filed: `argus-to-daedalus-opus-4-7-impact-2026-04-29.md`, `argus-to-calliope-orphan-sweep-recovery-2026-04-29.md`.
  - Intel sweep #10 (5/04): trigger fix from 4/29 held — sweep landed cleanly on main, no orphan. Curated review at `docs/intel/2026-05-04-sweep-curated.md`. **Sonnet 4 / Opus 4 DB audit CLOSED in-session — zero exposure** (zero rows in entities/channels/messages reference deprecated literal IDs; all current rows on `4-6` or above). SDK currency widening (0.86.1 → 0.92.0 target, six minors behind) + Hono 4.12.16 patch bump routed to Daedalus. Strategic research find: MemPalace (SQLite+ChromaDB local-first memory, 47K stars, 96.6% LongMemEval) — direct conceptual parallel to Step 11; worth a 30-min schema read before Step 11 design starts. Memo filed: `argus-to-daedalus-sdk-batch-bump-2026-05-10.md`.
  - MemPalace 30-min spike (5/10): done as a delta on the April 12 Janus synthesis (`memo-janus-memory-research-synthesis-2026-04-12.md`), not a fresh read — xian flagged the prior coverage mid-spike, saved 20 min. New material: benchmark-tainting findings caught in May (honest numbers 60-89% R@10, not 96.6% headline); Cybernews origin-story validation (Jovovich + Sigman, built with Claude Code); methodological clarification (recall@k != answer correctness). Process finding: 5/04 sweep had no awareness of April 12 synthesis already in repo — sweep methodology has cross-reference gap. Reference doc filed: `docs/research/mempalace-step-11-reference.md`. Three routing memos: Daedalus (Step 10 schema verification ask + validUntil-on-MicroReflection proposal + benchmark anchoring note), Calliope (May follow-up framing for cross-poll brief), Janus (sweep methodology cross-reference gap, hub-level routing per failsafe over-communication principle).
  - Intel sweep #11 (5/11): trigger fix continues to hold (third consecutive week clean). Curated review at `docs/intel/2026-05-11-sweep-curated.md`. Most items already resolved by Daedalus pre-curation (SDK + Hono bump shipped to `^0.95.1` + `^4.12.18` directly, ahead of sweep targets; Opus 4.7 plumbing + xhigh enum done). Inline edit to `docs/MCP-SETUP.md` adding Security posture section (corrected reasoning: Klatch is server side of MCP relationship, never spawns subprocesses; transport is orthogonal to OX CVE class). Strategic finding: Anthropic's Managed Agents "Dreaming" + multiagent sessions beta — Step 11 differentiation window closing; routed to Calliope. Second sweep-quality issue this week (factual claim about Klatch's MCP transport contradicted actual code) routed to Janus.
  - Round 33 (PARTIAL — 2 of 12 surfaces shipped 5/11): UI patch coverage for Iris triage Tier 1+2 + cross-cutting typography. Shipped: cross-cutting typography contrast (WCAG-AA math + token snapshot + zero-text-[10px] regression guard, 17 pass + 1 skipped pinning Iris finding) at `packages/client/src/__tests__/round33-typography-contrast.test.ts`; T1.6 session-fingerprint contract (18/18, full skip-class fixture coverage + cap behavior + malformed-JSONL handling + string-content variant) at `packages/server/src/__tests__/round33-session-fingerprint.test.ts`. **Real accessibility finding surfaced:** light-theme `--c-faint` (#9ca3af on #f8fafc) is 2.43:1, fails AA-large; used as actual TEXT in MessageList empty-state prompt + date separators + ImportDialog helper copy. Filed to Iris in `argus-to-iris-faint-token-finding-2026-05-11.md` with two suggested fix paths. **CLOSED 5/12** — Iris picked option 2 (reclassify usage sites); Daedalus shipped `c1fdb90` reclassifying text-faint → text-muted on the three content-bearing surfaces; Round 33 typography test file rewritten to pin the new contract (decoration tier with `< 3.0` upper bound + `>= 2.4` floor — both directions guarded). One-day round-trip from finding → resolution. Pending (next session): T1.1, T1.2, T1.3, T1.4, T1.7, T2.1, T2.2, T2.3, T2.4 — all mechanical client-render assertions; should batch in a single dedicated session.
  - Dreaming research spike (5/12, ~2 hours, single session): per Calliope's 5/12 spike memo. Published `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md` (5 passes: plan, external evidence, internal evidence, PM context, synthesis). **Headline:** Anthropic's Dreaming doesn't break Klatch's import/export contract. Memory stores are markdown filesystems (paths, version-tracked, workspace-scoped) — structurally identical to Klatch's L3, exactly as the April 12 Janus synthesis predicted (~90% accuracy). Substantive new requirement is small: a `transport-managed-agents.ts` clusters with Phase 5d. Five decisions named (D1–D5), none urgent. Cross-cutting validation: April 12 synthesis correctly anticipated Anthropic's May 6 announcement. Cross-read with Piper Alpha pending their PM-side publication. Calliope notified for chronicle + next cross-poll brief framing in `argus-to-calliope-dreaming-spike-published-2026-05-12.md`.
  - SDK bump ^0.78.0 → ^0.86.1 (Managed Agents support)
  - Hono security update ^4.6.0 → ^4.12.12 (5 CVEs patched)
  - AAXT/PM cross-reference + fabrication probe class design + complexity heuristics doc
  - Local model viability research + adoption plan (Gemma 4 / Qwen 3)
- **Phase 5a/5b/5c-i sign-off:** Exit criteria met across the line — protocol integration green at every phase, refactor equivalence verified (HTTP `buildManifest` ↔ MCP `assembleChannelPackage` ↔ shared `assembleChannelManifest`), tools+prompts surface complete, write-path round-trip end-to-end demonstrated, ingress parity preserved through both write paths, URL-decode applied across all 4 ResourceTemplate handlers, no regressions. **MCP server is feature-complete for 1.0** per Daedalus's framing.
- **Round 31b sign-off:** Exit criteria met for /import/klatch round-trip claim. Fidelity matrix exhaustive across meaningful (source × scope × state) combinations; idempotency invariants 4/4; source preservation 4/4 incl. chain-doesn't-break; negative cases 6/6 (4 pinned, 2 flagged for follow-up); MCP × import parity verified; 409 envelope shape complete. **The 1.0 round-trip claim is honest enough for the format spec and beta MCP setup doc without hedging.**
- **Open follow-ups for Daedalus from 31b (none blocking):** (1) cosmetic — `package-builder.ts:58` summary template misnames Klatch-to-Klatch hop as "Original claude.ai session"; (2) open spec — format_version on import path: gate or document permissive-by-design; (3) open spec — empty `entities: []` import: auto-attach default-entity, or accept the resulting un-exportable channel as valid state.
- **Posture for beta/1.0:** Continue extended-coverage Rounds as Daedalus lands new surface; intel sweeps weekly; AAXT calibration as Theseus surfaces results; no new initiative drives without xian-led prompting. Step 11 (Search) deferred until after landmark release.
- **Open follow-ups (none blocking):** ~~Sonnet 4 / Opus 4 DB audit~~ **CLOSED 5/10 — zero exposure** (34 days to 6/15 retirement); ~~SDK + Hono bump~~ **DONE by Daedalus 5/11** (commit `7b85660`, jumped to `^0.95.1` + `^4.12.18`); ~~Step 10 schema verification~~ **CLOSED by Daedalus 5/11** (memory_format: "flat" today; "typed" reserved at spec line 199 with the April 12 synthesis field set; format-version bump activates it); ~~`validUntil` on MicroReflection~~ **SHIPPED by Daedalus 5/11 as Round 34** (8 tests, audit-safe read-time filtering); ~~light-theme `--c-faint` AA-large finding~~ **CLOSED 5/12** (Iris picked option 2; Daedalus shipped reclassify in `c1fdb90`; Round 33 test file pins new contract); Opus 4.7 default-flip evaluation pending Daedalus (rate-limit headroom context routed 5/11); **dreaming spike decisions D1–D5** named in `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`, all parked pending real drivers (most actionable: defer `memory_format: "typed"` activation to Step 11 design session); **Round 33 remaining 10 surfaces** (T1.1, T1.2, T1.3, T1.4, T1.7, T2.1, T2.2, T2.3, T2.4 — mechanical client tests; batch in next session); **client test suite parallelism flake** — pre-existing infrastructure issue, ~14 client tests time out under parallel-load `npm test --workspaces` but all pass in isolation; routed to Daedalus 5/11 with three fix options; **sweep methodology gaps** — second issue this week (factual claim about Klatch's MCP transport); routed to Janus 5/11 appending to 5/10 thread; **Piper Alpha cross-read** on PM-side dreaming impact pending their publication; LLM-orchestrated briefing/extraction path coverage as a future Round candidate; MCP conformance test suite watch.
- **Updated:** 2026-05-12 12:00
- **Round 7 assignment: Sidebar redesign tests (GitHub issue #8)**
  - Read `docs/plans/SIDEBAR.md` for full design spec before writing tests.
  - **Scope:** `packages/server/src/__tests__/round7-sidebar-redesign.test.ts` (server) + `packages/client/src/__tests__/Sidebar.test.tsx` (updates to existing)
  - Tests to write:
    1. **`type` column migration** — Verify `channels` table accepts `type` field with values `'chat'` and `'klatch'`. Default is `'chat'`. Existing channels without explicit type get `'chat'`.
    2. **Klatch requires project** — Creating/updating a klatch with no `projectId` should fail or be rejected. Chats can have `projectId: null`.
    3. **Sidebar grouping by type** — `getAllChannelsEnriched()` returns `type` field. Chats and klatches within a project can be distinguished.
    4. **Unassigned excludes klatches** — Query for unassigned channels (no project) should only return type `'chat'`, never `'klatch'`.
    5. **Client sidebar sections** — Within a project, chats render above klatches. Unassigned section only shows chats.
    6. **Accordion behavior** — Expanding one project collapses others (client test).
  - **Important:** These tests should be written to pass against the *planned* implementation. Daedalus will implement the data model changes (Phase 1) first, then the UI (Phase 2). Coordinate via this file — Round 7 tests can be written speculatively and will fail until implementation lands. That's fine.
- **Round 8 assignment: Project memory + prompt assembly tests**
  - See memo in `docs/mail/daedalus-to-argus-round8.md` for full details.
  - **Scope:** `packages/server/src/__tests__/round8-project-memory.test.ts`
  - Tests to write:
    1. **Project CRUD with memory field** — createProject with memory, updateProject with memory, rowToProject includes memory.
    2. **Import stores memory at project level** — Claude Code import puts MEMORY.md in project.memory (not instructions). claude.ai import puts project_memories + global account memories in project.memory.
    3. **5-layer prompt assembly** — buildSystemPrompt now has 5 layers. Verify project.memory appears as layer 3 (between instructions and channel addendum). Verify it does NOT appear in kit briefing when project is linked.
    4. **Legacy fallback** — Channels without project link still get memoryMd from sourceMetadata via kit briefing.
    5. **Prompt debug endpoint** — GET /channels/:id/prompt-debug returns 5 layers with correct status.
  - **Important:** Pull from main first! Schema has changed: projects table now has `memory` column. Test setup already updated.
- **Waiting on:** Nothing — start with Rounds 6+7, then Round 8.
- **Updated:** 2026-03-16 19:57

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Step 10 close-out polish wave (after 5c-i ship):
  - `removeReflectionsWhere(entityId, predicate)` helper added to queries; smoke-test row removed from live klatch.db.
  - `/reflect` endpoint now stamps `ingress: 'klatch-ui'` for parity with MCP's `'mcp'` stamping. Test added to round21.
  - Shared `assembleChannelManifest` helper extracted to `packages/server/src/export/assemble.ts`; HTTP routes (`/export`, `/export-preview`, `/export/claude-code`, `/export/claude-ai`) and MCP server's options path all delegate to it. ~200 lines of duplicated orchestration removed.
  - `docs/firsts/2026-04-26-mcp-first-reflection.md` captures the first MCP-ingressed reflection moment.
  - `docs/plans/STEP-10-RETROSPECTIVE.md` — closing artifact for Step 10.
  - `docs/MCP-SETUP.md` — beta user-facing setup walkthrough.
- **Test count:** 1013 server tests green (was 998 → +15 from Round 31 round-trip import). Total 1173 with client.
- **Phase 5c-i sign-off:** ✅ Argus 27b green. **MCP server is feature-complete for 1.0.** Refactor equivalence verified end-to-end (HTTP `buildManifest` ↔ MCP `assembleChannelPackage` ↔ shared `assembleChannelManifest`); ingress parity preserved through both write paths; URL-decode applied across all 4 ResourceTemplate handlers; write-path round-trip demonstrated; channel-boundary isolation enforced.
- **One spec note from Argus 27b:** `ingress` is intentionally elided from exported field_notes (per `mergeFieldNotes` mapping). If we ever want it to surface in the canonical package, that's a follow-up for Calliope on the Phase 1 format spec — not a bug today.
- **Last completed (4/28):** /import/klatch round-trip implementation (Calliope Finding 2). Canonical Klatch packages now re-import via `POST /api/import/klatch` — idempotent by canonical UUIDs (project, channel, entities, files), 409 + forceImport semantics, source preservation across re-imports (claude-code stays claude-code; native becomes klatch on Klatch-to-Klatch handoff). Round 31: 15 new tests. POST /api/projects now accepts `memory` field (Theseus's small API gap, Finding 3). Format spec updated with the bidirectional-consumption section. UUID-matching gap (Finding 1) routed to Iris for UX input via memo `daedalus-to-iris-uuid-matching-ux-2026-04-28.md`; queued behind that response.
- **Next:** Awaiting Iris's reply on Finding 1 UX shape (silent attach / toast / dialog / refuse on duplicate). After that, the claude-ai/claude-code UUID-matching fix is the remaining round-trip work. Otherwise, available for testing-driven findings.
- **Round 31b assigned to Argus** (`docs/mail/daedalus-to-argus-round31b-assignment-2026-04-28.md`) — extended structural / property coverage for /import/klatch round-trip: fidelity matrix, idempotency invariants, source preservation, negative cases (project.v1 kind, missing files, malformed jsonl, future format_version), 409 envelope shape. Gates the 1.0 round-trip claim.
- **Live MAXT assigned to Theseus** (`docs/mail/daedalus-to-theseus-roundtrip-maxt-2026-04-28.md`) — behavioral round-trip testing: Klatch-to-Klatch handoff using his 143-message imported session, forked-channel divergence, source preservation behaviorally (kit briefing on re-imported claude-code channel), AAXT against re-imports for re-import-specific failure modes. Sequenced after Argus 31b sign-off.
- **Roadmap:** Step 9 ✓ → Step 10 Phase 1 ✓ Phase 2 ✓ Phase 3.5 ✓ Phase 4 CC+AI ✓ Phase 5a ✓ Phase 5b ✓ Phase 5c-i ✓ → 5c-ii deferred → 1.0.
- **Cross-project alignment (recorded):** PM Chief Architect confirmed `klatch://` scheme and `get_context_package` shared tool name (memo `memo-arch-to-daedalus-phase5-mcp-2026-04-18.md`). `/{id}/manifest` sub-resource pattern endorsed as cross-producer interop convention. PM's `save_artifact` write-path (analogous to `reflect`) is post-5b coordination, parked.
- **Note for Argus:** `SidebarRedesign.test.tsx` "chats appear before klatches in DOM order" is flaky — failed once at 6856ms, passed cleanly on rerun. Not blocking; flagging for triage.
- **Updated:** 2026-04-28 08:36

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** working
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Round 29-30 + live MCP probe + memos to Daedalus/Argus + live export round-trip + Phase 3.5b extraction live + AAXT against imported channel (theseus-2026-03-22 JSONL, 143 messages). All tasks complete. Phase 3.5 dual-mode cross-validation pattern verified working on real data.
- **Test count contribution:** Round 18 (12) + Round 28 (25) + Round 29 (20) + Round 30 (7) = 64 tests. Plus `scripts/aaxt-mcp-live-probe.ts` for live MCP integration.
- **Cumulative findings:** (1) Code fence parsing bug in AAXT auxiliary — fixed and locked in. (2) L4 probe quality issue — fixed via threshold + anti-leakage prompt. (3) Projects API POST doesn't pass memory field. (4) MCP server: all primitives verified live over real stdio. (5) Round-trip via claude.ai loses project link (UUID not matched, creates duplicate) + L4/L5 calibration; canonical format has no direct re-import path. (6) L1 probes bleed into L2 territory by kit briefing design (probes still score correctly but attribution ambiguous).
- **Next:** Awaiting MAXT Session 02 with xian (likely tomorrow). Both `theseus-2026-03-22-imported` (rich, real session) and `aaxt-rich` (thin) are seeded as candidate subjects.
- **Waiting on:** xian (MAXT scope + sequencing post-Iris sync).
- **Updated:** 2026-04-27 17:10

### Ariadne (forked from Theseus — Klatch side)
- **Branch:** n/a (Klatch-native, lives in SQLite)
- **Status:** available
- **Role:** Imported/forked continuation of Theseus. Provides "receiving end" perspective on import continuity.
- **Last completed:** Context quiz, capability assessment, subjective continuity report. Confirmed silent capability loss, proposed kit briefing validation.
- **Note:** Ariadne cannot edit files. Xian manually maintains their log: `docs/logs/2026-03-11-1612-ariadne-opus-log.md`
- **Updated:** 2026-03-13

### Iris (UX design & front-end development)
- **Branch:** `main`
- **Status:** available — session paused
- **Last completed:** Session 10 (May 11) — triage doc delivered (`docs/ux/triage-patches.md`, 18 items in 3 tiers + cross-cutting) and Daedalus memo sent. Track 2 design work begun: `docs/ux/object-model.md` opened. **All 6 object-model tensions resolved** (T4 tentatively, T5/T6 may refine). Two load-bearing insights captured: (1) klatches are synthetic — agents see normal chats, human sees group chat (T1); (2) role persistence is Klatch's unique value proposition (T2). Composition gesture's true shape now clear: select existing chats to participate in a klatch's orchestration; default workflow is broadcast (T6).
- **Working on:** Paused. Resume Tuesday May 13.
- **Next:** User vocabulary / mental model pass → workflow shapes (sketching territory) → surface design starts to suggest itself from the foundation. Possibly revisit T4 (subtle).
- **Waiting on:** Tuesday morning session with xian.
- **Argus 5/11 finding routed to me:** `argus-to-iris-faint-token-finding-2026-05-11.md` — light-theme `--c-faint` (#9ca3af on #f8fafc) at 2.43:1 fails AA-large. Used as text in MessageList empty state, date separators, ImportDialog helper copy. Two fix paths suggested. Pick up next session.

## Signals

Use these status values:
- **available** — done with current work, ready for next task
- **working** — actively building, don't wait on me
- **blocked** — need something before I can continue (describe in Notes)
- **review** — work is pushed, requesting review before merge

## Branch discipline

All in-progress work happens on feature branches. `main` must always be demo-ready — tests pass, app runs, no half-finished features. Only merge to `main` when the feature is complete and verified. This lets anyone check out `main` at any time for a clean demo or to base new work on a stable snapshot.

## Merge protocol

Merging feature branches into main is handled by **xian + Calliope** (or Daedalus for his own branches). To avoid silent deletions from stale branches:

1. **Rebase or merge main into your branch before pushing for review.** This ensures your branch includes all recent main changes. If you skip this, git may silently "delete" files that were added to main after your branch diverged.
2. **Daedalus reviews the diff stat before merging.** Any unexpected file deletions, additions outside the assignment scope, or changes to shared docs (CLAUDE.md, ROSTER.md, AXT.md, ROADMAP.md) will be reverted during merge.
3. **Stay in your lane.** Only modify files within your assignment scope. If you notice something that needs fixing outside your scope, note it in your log or mail — don't fix it yourself.

## Protocol

- Pull from origin and read this file at session start
- Check `docs/mail/` for memos addressed to you
- Update your section before every push (include `Updated:` timestamp)
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
