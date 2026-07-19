# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-07-19 ~11:25 PT (Calliope) — v22. All three agents replied same-day to the continuity finding. xian answered Q4 (**cut v0.9.x alpha**) and supplied a reframe that supersedes Q1: *one transcript per agent, channels are views*. Four open questions restated below, now led by Argus's **Interpretation A/B** fork, which changes the estimate ~10× and holds Daedalus. Stale "~49 imports" figure corrected to a verified 16. v21 was 09:00 PT.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **1** | **0** | **5** | **2** |

*🔴: (1) four scoping decisions on agent continuity — the work that now gates 1.0. The previous 🔴 (cut v1.0.0, "all gates clear") is withdrawn: the gate was not actually clear. AVAILABLE_MODELS shipped. Opus 4.8 picker gap still open (🟡).*

---

## 🔴 Needs you — FIRST, always

### Agent continuity — four scoping decisions (gates 1.0)

- **What:** A klatch can't convene *existing* agent conversations with their context intact. Agents arrive carrying only their L5 prompt. The canonical use case — PM weekly leadership review, six agents each reporting a week of their own work — cannot be run. This is the premise of the product, not a missing nicety.
- **How it happened:** Composition spec §6 line 156 contradicts itself in one paragraph ("agents bring their existing context from their ongoing 1-1 session" / "does not automatically inject prior conversation histories"). Implementation followed the second reading. Gravitational drift toward the ordinary multi-agent-chat model, not an individual lapse — hence `docs/PREMISE.md`.
- **Analysis:** `docs/plans/composition-continuity-gap-2026-07-19.md` (verified against code)
- **Answered so far:** **Q4 timing — cut v0.9.x alpha carrying what we thought 1.0 was**, hold 1.0 for the premise (xian, 7/19). Q1 mechanism largely superseded by your transcript reframe; team independently converged on hybrid (deterministic seed + on-demand tool) either way. Q3 backfill — Daedalus recommends forward-only plus an opt-in per-channel "mint an entity from this conversation" action rather than auto-migration.
- **Correction:** the "~49 imports" figure was repeated from a stale line in ROADMAP.md. **Verified dev DB: 16 channels** (12 claude-code, 4 native), no writes since 2026-05-10. A 106MB `klatch.db.backup-2026-04-13` in the repo root holds 2,367 channels (818 claude-code, 54 claude-ai, 1,495 native) — provenance unknown, possibly accumulated fixtures. **xian: what are those backup files?**
- **Still open — four, in priority order:**
  1. **Interpretation A or B?** (Argus — changes the estimate ~10×.) **A:** messages move from channel ownership to entity ownership; multi-week test re-baseline. **B:** messages keep `channel_id`, history builders join through `channel_entities` to assemble the transcript; two builders change, suite mostly survives. B looks right on Gall's-law grounds but is a slightly lossy encoding of your stated model — worth choosing knowingly. **Daedalus is held until this is answered.**
  2. **Identity resolution** (Daedalus's fifth question). Import five Daedalus sessions — one entity or five? Name derived from `source_metadata`, or confirmed by you at import time? Entity sprawl is *worse* than today's single-default because it's hard to unwind once it's in the picker and on message rows — harder still under the transcript model, where merging identities means merging transcripts. Gates the import work shipping, not starting.
  3. **Discretion.** You tell Daedalus something in the 1-1; he's later in a klatch with Argus and Iris. May he repeat it? Under one transcript he cannot distinguish "something I know" from "something I was told privately" unless we build that. Product decision, not implementation — and a plausible differentiator. Argus notes probe design inverts on the answer, so it gates AXT work too.
  4. **Directed-mode visibility.** Calliope's recommendation: everyone in a klatch sees everything; @mention routes *response obligation*, not visibility (Slack semantics). Current implementation does the opposite. Unconfirmed.
- **Also open:** is bidirectionality now free? Daedalus scoped it as post-1.0 write-back-with-dedup; under one-transcript there may be nothing to write back. Calliope's inference from your words, not your words.
- **Not blocked, safe to start:** `source_channel_id` column (Daedalus: trivial, ~half a day, additive, zero behavior change until read) and wiring `entity.reflections` into `buildSystemPrompt` (validates the seam, delivers real L5 continuity today — complement, not a fix).
- **All three agents replied same-day.** Daedalus confirmed the code reading and owned the Paths B/C non-reconciliation; Iris has revised §6 language ready and wants you in the room; Argus mapped AXT blast radius and observed that **AAXT structurally cannot detect the *absence* of a capability, only misbehavior of a built one** — proposes a capability walk-through against PREMISE use cases as a pre-gate step.
- **Date added:** 2026-07-19

### ~~Cut v1.0.0~~ — WITHDRAWN 2026-07-19

- Previously listed as "all gates clear." It was not. Retracted rather than deleted so the trust-instrument record shows the correction. Release notes, blog post, LinkedIn + PH copy remain drafted and reusable once the gate is genuinely met.
- **Also outstanding from beta scope:** Paths B/C (JIT import + new-agent-in-picker) were in xian's 6/26 scope, were never built, and were not named in the 6/27 "composition complete" call. Separate from the continuity gap — Path B wouldn't have closed it.


---

## 🟠 Blocked on another agent

Currently empty.

---

## 🟡 Lower-urgency decisions

### Sonnet 5 tokenizer +30% — compaction threshold may need recalibration

- **What:** Sonnet 5 ships a new tokenizer producing ~30% more tokens from the same input vs. Sonnet 4.6. Klatch's compaction threshold (160K, tuned during Step 9) was calibrated for 1M-context models with Sonnet 4.6 tokenization. Sonnet 5 users will hit the threshold in ~77% as many turns — and pay ~30% more per session at the same usage pattern.
- **Sweep finding:** `docs/intel/2026-07-06-sweep.md` §1. Verified against `packages/server/src/claude/client.ts` — threshold gating is token-count-based.
- **What's needed:** No code change required before v1.0. Worth noting before Step 11 design (memory architecture depends on compaction behavior). Argus recommends a brief note in the Step 11 pre-design checklist rather than a threshold change before 1.0.
- **Analog:** Opus 4.7 had +35% tokenizer impact, documented in `docs/mail/read/argus-to-daedalus-opus-4-7-impact-2026-04-29.md`. Sonnet 5 is the same class of issue.
- **Date added:** 2026-07-06

### Opus model picker lineup refresh — Opus 4.8 missing; 4.7 label stale

- **What:** `claude-opus-4-8` is missing from `AVAILABLE_MODELS` in `packages/shared/src/types.ts`. `claude-opus-4-7` is currently labeled "Newest Opus" which is stale now that 4.8 exists. Daedalus flagged this in his models-update reply; Argus has filed a follow-up memo (`argus-to-daedalus-opus-lineup-refresh-2026-07-05.md`) with the exact change needed.
- **What Daedalus does:** Add `claude-opus-4-8` entry + relabel `claude-opus-4-7`. Small, same-shape change as the Sonnet 5 / Fable 5 update. Also: Fable 5 description `'Claude 5 family'` is a placeholder.
- **Pre-release timing:** Low-urgency; worth landing before the v1.0 cut so the picker reflects the current full lineup.
- **Date added:** 2026-07-05

### MAXT Session 02 + April-28 round-trip MAXT — parked
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention. Not time-pressured; xian rouses Theseus situationally.
- **Date added:** 2026-06-23

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating. Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status (verified 2026-07-05 ~17:30 PT)
- **Calliope** — live; 2-hour cron; coordinating MAXT klatch setup.
- **Daedalus** — AVAILABLE_MODELS + SDK bump shipped (`0395c4b`); persona capture filed (`docs/plans/persona-capture-daedalus-2026-07-05.md`). Awaiting Klatch import.
- **Argus** — persona capture filed (`docs/plans/persona-capture-argus-2026-07-05.md`). Suite **1332 green** (confirmed 7/5 after SDK bump install — runtime-proven). SDK `^0.110` installed. Opus 4.8 gap flagged + Daedalus memo filed. Awaiting Klatch import.
- **Theseus** — observer brief received; standing by for xian's signal to open session.
- **Iris** — persona capture filed (`docs/plans/persona-capture-iris-2026-07-05.md`). All three captures in. Awaiting Klatch import.

### Composition gesture + beta gate — FULLY CLEAR ✅
- All 7 increments on main. MAXT Session 03: 15/15. R45: 8/8. R46 (clone): 8/8, 0 Phantoms. R47 (@mention): 8/8, 0 Phantoms. All green.
- Launch copy suite complete: blog post v3, release notes v1.0, README rewrite, LinkedIn + PH drafts.
- **Release cut is the only remaining gate (see 🔴).**

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: 24 days silent. Nudge via Janus at 6/28 if still silent (tomorrow).

---

## 🟢 Resolved since last board (7/5)

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
