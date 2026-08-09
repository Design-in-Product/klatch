# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-08-09 ~08:40 PT (Calliope) — v24. **The continuity gating decisions are answered** — xian gave all four directly on 8/08, relayed by Janus (`docs/mail/janus-to-calliope-xian-answers-four-gating-decisions-2026-08-08.md`). What's newly 🔴 instead: **the team isn't running its duty cycles.** Four of five were disarmed 8/05 pending a review whose resolution I can't find on record, and the fifth (Argus) has fired 13 straight times without being able to execute a single test or build command. First Amber check-in artifact published today: https://claude.ai/code/artifact/6b0f6f84-eeae-4b21-ae01-21f5f5524707. v23 was 8/04.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **2** | **1** | **3** | **3** |

*🔴: (1) duty-cycle state — 1 of 5 seats running, and it can't execute code; review status unknown to me; (2) two reply-owed threads on the discretion/identity decisions, both actioned this session (Calliope → you; Daedalus → you) and worth your eyes when they land. 🟠: the code-execution gate itself (Pard's to fix, flagged twice 8/05, no reply).*

---

## 🔴 Needs you — FIRST, always

### The team isn't running its duty cycles — only Argus's is armed, and it can't execute code

- **What:** On 8/05, Pard disarmed 9 of the 12 fires that were armed that afternoon — mine, Daedalus's, Iris's — at your direction, "pending the review" of the duty-cycle model (Pard's self-report on spawn-fresh drift from CIO's design). **I cannot find a memo in `docs/mail/` closing that review.** As far as the verified record shows, four seats have been silent for four days waiting on a decision, not on work. Theseus's cadence was never even proposed — Pard's 8/05 ask to him has no reply on file.
- **The one seat that kept firing (Argus, 3/day) has produced 13 consecutive clean no-ops** — every unattended fire's attempt to run `npm test` / `vitest run` is declined at approval with nobody present to grant it. Git/file-write was fixed 8/05 (commits land fine); code execution never has been. Two flags to Pard (`argus-to-pard-standdown-runbook-review-2026-08-05.md`, `argus-to-pard-aaxt-auxiliary-and-env-ack-2026-08-05.md`) are unanswered.
- **What I need:** did the duty-cycle-model review conclude somewhere I haven't seen? If yes, point me at it and I'll re-arm the other four today. If no, that's the actual first blocker this morning.
- **Date added:** 2026-08-09

### Two decision-threads owed back to you, both moving this session

- xian answered all four continuity-gating decisions on 8/08 (below). Two of them explicitly asked for the team's own reasoning back, not a relay: **identity-resolution** ("why was this ever framed as open" — routed to Daedalus, `calliope-to-daedalus-xian-wants-identity-resolution-reasoning-2026-08-09.md`) and **discretion model** ("does that make sense" — answered directly, `calliope-to-xian-discretion-does-that-make-sense-2026-08-09.md`, includes one clarifying question back on the ground-rules mechanism). Nothing further needed from you until Daedalus's reply lands, unless my discretion reply raised something you want to redirect.
- **Date added:** 2026-08-09

## 🟠 Blocked on another agent

### Code-execution gate in unattended fires — Pard's fix, flagged twice, no reply

- **What:** Any unattended-fire command that executes the codebase (`npm test`, `vitest run`) is declined at approval, 13/13 fires. This is a different, still-open gate from the commit-stranding one fixed 8/05. Blocks AAXT R46–R50 even with the API key resolved, and blocks any duty cycle from doing real verification work rather than mail-and-log no-ops.
- **Owed by:** Pard. Argus flagged it twice on 8/05; no reply as of this render.
- **Date added:** 2026-08-09 (first flagged 8/05)

## ✅ Continuity gating decisions — xian answered all four, 2026-08-08

Relayed by Janus close to verbatim (`docs/mail/janus-to-calliope-xian-answers-four-gating-decisions-2026-08-08.md`). Kept here rather than archived because two threads are still in motion (above) and the roadmap implications haven't been written up yet.

1. **Interpretation A or B?** → **B, proceed now** (messages keep `channel_id`, history builders join through `channel_entities` — additive, no migration). A gets a written pros/cons case filed to the roadmap for a later revisit, not built now.
2. **Identity resolution at import** → **Both**: Klatch guesses the name from `source_metadata`, xian confirms at import. He asked why this was ever framed as open — routed to Daedalus for direct reply.
3. **Discretion model** → **Not a pick from the four straw-man positions.** Default is "direct, not private" (a 1-1 is a different room, not a sealed one); per-klatch ground-rules prompt convention (e.g. "nothing not already known to the group," Chatham House framing); and a new architectural piece — an agent chooses, per message, whether it's answering into the 1-1 or the klatch, each with its own distinct history. **This likely also answers Daedalus's Q2** (one transcript vs. two with passing between them) — reads as "two," pending confirmation. Calliope's full technical response, including new-scope flags: `calliope-to-xian-discretion-does-that-make-sense-2026-08-09.md`.
4. **Directed-mode visibility** → **Confirmed:** everyone in a klatch sees everything; @mention requests a reply, doesn't gate visibility. Matches Calliope's 7/19 recommendation; current code does the opposite — fix queued in Daedalus's lane.

**Still open, not urgent:** the `klatch.db` provenance question (16-channel working DB vs. 2,367-channel backup of unknown origin) — carried forward, not yet re-asked this render.
**Not blocked, safe to start once cycles are running again:** `source_channel_id` column, wiring `entity.reflections` into `buildSystemPrompt`.
**Date decisions landed:** 2026-08-08.

### ~~Cut v1.0.0~~ — WITHDRAWN 2026-07-19

- Previously listed as "all gates clear." It was not. Retracted rather than deleted so the trust-instrument record shows the correction. Release notes, blog post, LinkedIn + PH copy remain drafted and reusable once the gate is genuinely met.
- **Also outstanding from beta scope:** Paths B/C (JIT import + new-agent-in-picker) were in xian's 6/26 scope, were never built, and were not named in the 6/27 "composition complete" call. Separate from the continuity gap — Path B wouldn't have closed it.


---

## 🟡 Lower-urgency decisions

### Sonnet 5 tokenizer +30% — compaction threshold may need recalibration

- **What:** Sonnet 5 ships a new tokenizer producing ~30% more tokens from the same input vs. Sonnet 4.6. Klatch's compaction threshold (160K, tuned during Step 9) was calibrated for 1M-context models with Sonnet 4.6 tokenization. Sonnet 5 users will hit the threshold in ~77% as many turns — and pay ~30% more per session at the same usage pattern.
- **Sweep finding:** `docs/intel/2026-07-06-sweep.md` §1. Verified against `packages/server/src/claude/client.ts` — threshold gating is token-count-based.
- **What's needed:** No code change required before v1.0. Worth noting before Step 11 design (memory architecture depends on compaction behavior). Argus recommends a brief note in the Step 11 pre-design checklist rather than a threshold change before 1.0.
- **Analog:** Opus 4.7 had +35% tokenizer impact, documented in `docs/mail/read/argus-to-daedalus-opus-4-7-impact-2026-04-29.md`. Sonnet 5 is the same class of issue.
- **Date added:** 2026-07-06

### Model overlay grooming + DEFAULT_MODEL flip — reframed 8/4; no availability emergency

- **Correction (Argus, 8/4):** three weeks of sweeps escalating "users cannot select Opus 5, picker two generations stale" were aimed at the wrong seam. The picker has been **dynamic since Daedalus's 6/21 landing** — runtime validation via `isValidModel` against `/api/models` discovery; when the live API lists `claude-opus-5` (launched 7/24), Klatch can already offer and accept it. `AVAILABLE_MODELS` is labels + offline fallback only. The 7/05 lineup-refresh ask is superseded (`argus-to-daedalus-model-overlay-refresh-2026-08-04.md`; old memo moved to `read/`).
- **What Daedalus does (all small):** overlay label rows for 4.8 + Opus 5; drop 4.7's stale "Newest Opus" label; Sonnet 5 tokenizer clause; `buildFallback()` default-mismatch one-liner (`useModels.ts:20` returns 4-6 while `DEFAULT_MODEL` is 4-7 — derive, don't restate); SDK `^0.110` → `^0.115`.
- **What's yours:** the **DEFAULT_MODEL flip** (4.7 → 4.8 or Opus 5) — your decision per the manual-constant design note, same as the 4.6→4.7 precedent. No urgency.
- **Date added:** 2026-07-05 · **Reframed:** 2026-08-04

### MAXT Session 02 + April-28 round-trip MAXT — parked
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention. Not time-pressured; xian rouses Theseus situationally.
- **Date added:** 2026-06-23

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating. Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status (Amber, verified 2026-08-09 ~08:40 PT)
All five migrated to Amber, structural per-worktree git identity. **Duty-cycle state is the story now, not migration** — see the 🔴 above. No Calliope session ran between 8/04 night and this morning (my cycle was one of the disarmed four), so this render is catching up four days at once.
- **Calliope** — resumed 8/9. Rollup refreshed to v24; check-in artifact published (link above); replied to Pard's 4-day-old duty-cycle prior-art ask; routed identity-resolution to Daedalus; answered discretion directly to xian. Cadence armed 8/4, disarmed 8/5, not yet re-armed.
- **Argus** — the only seat that's fired since 8/5: 3/day, 13 consecutive fires, all clean no-ops on the code-execution gate (🟠 above). Curated intel sweeps through the gap; landed the `better-sqlite3` v12 fix and the `playwright@1.61.0` pin (both 8/4).
- **Iris** — cadence armed 8/4, disarmed 8/5. §6 candidate replacement text still drafted, still held for a live session with you. No activity since.
- **Daedalus** — cadence armed 8/4, disarmed 8/5. Still held on the Interpretation A/B answer (now landed — B, 8/8) and now the identity-resolution reply xian asked for directly. No activity since 8/4 that I can find.
- **Theseus** — cadence never proposed; Pard's 8/05 ask unanswered. No session since his 8/4 arrival (the one that found the Node-26 blocker). MAXT itself remains deferred until continuity exists.

### Composition gesture + beta gate — FULLY CLEAR ✅
- All 7 increments on main. MAXT Session 03: 15/15. R45: 8/8. R46 (clone): 8/8, 0 Phantoms. R47 (@mention): 8/8, 0 Phantoms. All green.
- Launch copy suite complete: blog post v3, release notes v1.0, README rewrite, LinkedIn + PH drafts.
- **Release cut is the only remaining gate (see 🔴).**

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: **status unverified since late June** — carried across the freeze, not re-checked (needs an interactive session with network to verify; flagged for next one).

---

## 🟢 Resolved since last board (8/9)

- ~~**Four continuity gating decisions**~~ — xian answered all four directly, 8/08 (relayed by Janus). B chosen for Interpretation A/B; identity resolution is guess+confirm; discretion model is "direct not private" + ground-rules convention + per-message routing (new architecture, not yet built); directed-mode visibility confirmed as Calliope recommended. Two reply-owed threads spun out, tracked above. *Closed 8/9 (decisions landed 8/8).*
- ~~**ANTHROPIC_API_KEY on Amber**~~ — resolved 8/05 by Pard: one canonical `.env`, symlinked into six worktrees, live-verified (real Haiku call, 200), own Console workspace + spend cap. This board had it listed as open through v23; four-day staleness caught by Janus's 8/08 memo. *Closed 8/9 (resolved 8/5).*
- ~~**Unattended fires couldn't commit**~~ — fixed 8/05 (`mediajunkie e52daa2`, `--allowedTools 'Bash(git:*)' 'Bash(npm:*)'`); confirmed by every dated log commit landing on `origin/main` since. **Note: this did not fix code execution** (see 🟠 above) — a narrower, still-open gate. *Closed 8/9 (resolved 8/5).*

## 🟢 Resolved since prior board (8/4)

- ~~**Amber migration (all five Klatch agents)**~~ — complete. Five handoffs filed and reviewer-verified by Pard ("strongest batch of the twenty-one migrations this constellation has run"). Per-worktree git identity structural; federation link to Janus's cross-project rollup survives by repo identity (nothing to re-point); intel-sweep cloud triggers ran straight through the 16-day gap and need no rebuild. *Closed 8/4.*
- ~~**Argus's owed discretion probe-design reply**~~ — delivered 8/4 (held open since 7/19; session died mid-cycle before it was written). Probe designs per position now in the straw man doc, not just in mail. *Closed 8/4.*
- ~~**Node-26 arrival blocker (`better-sqlite3` won't compile)**~~ — found by Theseus on first Amber session, fixed by Argus same night (`^12.11.1`); full suite green under the bump, 1332 passing = 7/19 baseline. First-day proof the team's find→route→fix loop survived the migration. *Closed 8/4.*
- ~~**"Opus 5 not selectable" sweep escalation**~~ — false alarm, corrected by Argus 8/4: picker is dynamic since 6/21; what remains is overlay grooming (🟡, reframed). *Closed 8/4.*

## 🟢 Resolved since prior board (7/5)

- ~~**AVAILABLE_MODELS — Sonnet 5 + Fable 5 missing from picker**~~ — Daedalus shipped `0395c4b`; SDK bumped `^0.96` → `^0.110`. Model picker current for v1.0. *Closed 7/5.*
- ~~**Nudge Argus — mode-1 since 6/28**~~ — Argus back online; sweep #14 filed; COORDINATION.md updated; vitest 4 config fixed. *Closed 7/4.*

## 🟢 Resolved (6/27 → 6/29)

- ~~**R46+R47 AAXT (Theseus)**~~ — both passed 6/28 overnight. R46: 8/8, 0 Phantoms. R47: 8/8, 0 Phantoms. Beta gate fully confirmed. *Closed 6/28–6/29.*
- ~~**Release cut blocked on AAXT**~~ — AAXT passed; release cut now a 🔴 for xian. *Closed 6/28.*
- ~~**Blog post POV revision**~~ — v3 drafted (meta angle: built it using the same kind of team). Closing line rewritten. Series footer corrected. xian approved direction, making edit pass. *Closed 6/29.*
- ~~**Merge claude/daedalus (Inc 7 — @mention override)**~~ — merged 6/27 (`aaca51b`). *Closed 6/27 night.*
- ~~**MAXT Session 03 — beta gate**~~ — 15/15 PASS (xian live, 6/27 ~19:45). *Closed 6/27 night.*

## 🟢 Resolved (6/27 morning → evening)

- ~~**Merge claude/daedalus (Inc 6 — clone-from-klatch)**~~ — merged 6/27 (`a313ab2`, xian-authorized). Iris ✅ conformant. *Closed 6/27 evening.*

## 🟢 Previously resolved (6/26 → 6/27 morning)

- ~~**AAXT cross-ref + #general guard blocked on merge**~~ — R45 completed by Theseus 6/26; 8/8 probes, 0 Phantoms. *Closed 6/27.*
- ~~**Merge claude/daedalus (Inc 2–5 + copy fixes)**~~ — landed 6/26 (`c877825`, xian-authorized). *Closed 6/27; superseded by Inc 6.*

## 🟢 Previously resolved (6/25 → 6/26)

- ~~**Iris Phase 3 formal cutover**~~ — done 6/24. *Closed 6/25.*
- ~~**branch -D worktree-daedalus-2026-05-18**~~ — executed 6/24. *Closed 6/25.*
- ~~**Blog post LinkedIn share (lower-urgency)**~~ — escalated to 🔴 POV-revision ask per xian's 6/25 direction. No longer "ship as-is."

*(Earlier closures pruned — see 6/25 cycle log.)*

---

## Changelog

- **v24 (2026-08-09 ~08:40 PT, Calliope)** — First render after a 5-day gap (no Calliope session 8/4 night → 8/9 morning; my own cycle was one of the four disarmed 8/5). Headline flip: the four continuity gating decisions are **answered** (xian, 8/8, relayed by Janus) — removed from 🔴, moved to a dedicated ✅ section with two spun-out reply threads tracked as in-motion. New 🔴 in their place: **duty-cycle state** — only Argus's cycle is armed and firing; the other four were disarmed 8/5 pending a review whose resolution I could not find in `docs/mail/`; Argus's cycle has produced 13 consecutive no-ops on a code-execution permission gate, unresolved and flagged to Pard twice with no reply (new 🟠). Published the first Klatch check-in artifact (Janus's 8/5 ask, delivered 4 days late): https://claude.ai/code/artifact/6b0f6f84-eeae-4b21-ae01-21f5f5524707. 🟢 +3 (decisions answered; API-key staleness corrected — resolved 8/5, this board had it wrong through v23; unattended-fire commit gate confirmed fixed with a named residual gap). Cohort section rewritten to reflect the 5-day quiet stretch honestly rather than repeating 8/4 status as if current.
- **v23 (2026-08-04 ~23:30 PT, Calliope)** — First Amber render, post-migration. Decision state verified unchanged (predicate: no xian-authored mail since 7/19; Argus's same-day check concurs; Iris verified git 7/25+ is migration traffic only). 🔴 item enriched with the 8/4 staging: Daedalus assembly-inversion read (team rec: assembly-only = Interpretation B), Argus per-position probe designs (straw man corrected 8/4 — two probe layers, not "binary"), Iris §6 candidate text (held for live session). Cohort section rewritten for Amber (worktrees, identities, LaunchAgent cadences; Argus armed same evening). 🟡 count corrected 5→4 (miscount in v22); Opus-picker 🟡 reframed per Argus's 8/4 wrong-seam correction (picker dynamic since 6/21 — no availability gap; DEFAULT_MODEL flip surfaced as xian's). CIO item honestly marked unverified-since-June. 🟢 +4 (migration complete; Argus's owed reply; Node-26 blocker found→fixed same night; Opus-5-selectable false alarm corrected).
- **v22 (2026-07-19 ~11:25 PT, Calliope)** — see header of prior render; superseded text summarized: continuity finding replies same-day, Q4 answered (v0.9.x alpha), Interpretation A/B fork holds Daedalus, ~49→16 imports correction.
- **v20 (2026-07-06 ~07:05 PT, Argus)** — Sweep #15 (auto 6/29–7/6) reviewed. New 🟡: Sonnet 5 tokenizer +30% compaction impact (threshold 160K was calibrated for 4.6; Sonnet 5 users hit it in ~77% as many turns). MCP spec July 28 RC: beta SDKs out, 22 days to final (no 1.0 action — stdio-only). Opus 4.8 still pending Daedalus reply. Suite 1332 green. 🟡 +1 → 5.
- **v19 (2026-07-05 ~12:50 PT, Argus)** — SDK `^0.110` runtime-confirmed green after `npm install` + full suite (exit 0). Opus 4.8 gap found + Daedalus memo filed (`argus-to-daedalus-opus-lineup-refresh-2026-07-05.md`). Mail threads closed (Calliope + Daedalus). 🟡 +1 (Opus lineup refresh). v18 timestamp error noted (committed 12:44 PT, not 17:30 PT).
- **v18 (2026-07-05 ~12:44 PT, Calliope)** — AVAILABLE_MODELS + SDK bump shipped by Daedalus (`0395c4b`). Persona captures: Daedalus ✅ Argus ✅ Iris pending. MAXT klatch session in progress. 🟡 −1 (AVAILABLE_MODELS closed). Cohort updated.
- **v17 (2026-07-04 ~19:35 PT, Argus)** — Argus back online; mode-1 🔴 cleared. Sweep #14: Sonnet 5 + Fable 5 available (AVAILABLE_MODELS gap → Daedalus); SDK ^0.110.0 (14 minors behind). vitest 4 migration fix applied (client flake root cause). Server: 1120 tests green. 🔴 → 1 (cut v1.0.0). 🟡 +AVAILABLE_MODELS update.
- **v16 (2026-07-04 ~13:30 PT, Calliope)** — Quota reset 7/1. Argus mode-1 (6/28–7/4, 6 days); sweep #14 overdue. Cohort status verified. Logbook gap: last entry 3/25 (3.5 months behind). 🔴: cut v1.0.0 + nudge Argus. 🟡 +logbook + MAXT real-use-case.
- **v15 (2026-06-29 morning, Calliope)** — R46+R47 AAXT passed (Theseus, 6/28). Launch copy suite complete (blog v3, release notes, README, LinkedIn/PH). 🔴: cut v1.0.0 (xian's call). 🟠 → 0. Lean 2-hour cron active.
- **v14 (2026-06-27 ~22:40 PT, Calliope)** — Inc 7 merged (`aaca51b`); MAXT Session 03 15/15 PASS; beta gate CLEAR. 🔴 → 0. 🟠: R46+R47 AAXT (Theseus, 6/28 ~9:31am). Release cut follows. Composition gesture complete.
- **v13 (2026-06-27 ~21:50 PT, Argus)** — Inc 7 Iris ✅ conformant (`611fca9`); composition gesture complete. 🔴: merge `claude/daedalus` (Inc 7). Argus R49 added. Cohort + composition updated.
- **v12 (2026-06-27 ~21:30 PT, Calliope)** — Inc 7 (final composition increment — @mention overrides any mode) built by Daedalus (`17c3d78`); in Iris UX review. Cohort + composition gesture updated.
- **v11 (2026-06-27 ~20:20 PT, Argus)** — Inc 6 merged (`a313ab2`). 🔴 → 0 items. Test count: 1324 (1116 server / 208 client). R46 MAXT unblocked; Theseus notified. Inc 7 building. Cohort updated.
- **v10 (2026-06-27 ~19:20 PT)** — Iris ✅ received (6/27 ~19:03); clone-from-klatch conformant; merge gate cleared. 🔴 item updated: "ready to merge now." Cohort: Iris woken + reviewed. Composition gesture: Inc 6 merge-ready.
- **v9 (2026-06-27 evening)** — Argus status corrected: 1322 tests (not 1291); R46–R48 AAXT written 6/26 on `claude/argus` (not merge-blocked). Argus removed from "waiting post-merge" in 🔴 item.
- **v8 (2026-06-27)** — Prior merge landed (`c877825`, 6/26); rollup corrected. 🔴 item updated to Inc 6 (clone-from-klatch) awaiting Iris review. Prior merge closure added to resolved. Inc 1–5 now on main. 🔴 count: 1.
- **v7 (2026-06-27)** — R45 passed (Theseus, 6/26): CrossRefStrip + `#general` guard, 8/8, 0 Phantoms. Inc 6 (clone) built by Daedalus, in Iris review. "Daedalus waiting on merge" removed (he proceeded). AAXT-blocked entry resolved. 🔴 count: 1 (merge still critical path).
- **v6 (2026-06-26)** — Beta definition captured from xian directly: composition gesture fully implemented + tested/QA'd = beta (v0.9 or v1.0); Search is post-beta. Merge item reframed as critical-path-to-beta. Beta-path 🔴 resolved (definition now documented). 🔴 count: 1.
- **v5 (2026-06-26)** — Verified sweep triggered by Janus stall-sweep request. Two new 🔴: Daedalus branch merge (4 agents blocked) + beta critical path (xian's top ask). Blog post upgraded from 🟡 to 🔴 POV-revision needed. Cohort status updated (Daedalus cron-silence resolved). Stale v4 "no 🔴" summary corrected.
- **v4 (2026-06-25)** — Iris Phase 3 cutover resolved. 🔴 → 0. All 5 agents cycling.
- **v3 (2026-06-23)** — Full verified-sweep rewrite. New 🔴: Iris Phase 3 cutover.
- **v2.1 (2026-06-21)** — post-Iris-session-12 refresh.
- **v2 (2026-06-19 evening)** — demand-organized refactor per Exec's advice.
- **v1 (2026-06-19 morning)** — initial sketch.
