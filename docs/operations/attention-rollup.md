# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-06-27 Saturday ~22:40 PT (Calliope) — Inc 7 merged; MAXT Session 03 15/15 PASS; beta gate CLEAR; R46+R47 AAXT queued; rollup v14.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **0** | **1** | **3** | **4** |

*No 🔴 items. Beta gate CLEAR (MAXT Session 03, 15/15 pass, 6/27). 🟠: R46+R47 AAXT running (Theseus, ~9:31am 6/28). Release cut follows once AAXT passes.*

---

## 🔴 Needs you — FIRST, always

Currently empty.

---

## 🟠 Blocked on another agent

### Release cut — waiting on Theseus R46+R47 AAXT

- **What:** Inc 7 merged (`aaca51b`, 6/27). MAXT Session 03 passed 15/15 (xian live, 6/27 ~19:45). Beta gate declared CLEAR by Iris. Release cut (v0.9 or v1.0) is next — but standard practice calls for AAXT to pass first.
- **Waiting on:** Theseus R46 (clone-from-klatch) + R47 (@mention override) AAXT. Theseus daily at 9:31am PT — earliest completion 6/28 morning.
- **Argus:** R46–R49 AAXT already written on `claude/argus` (not merge-blocked); will run post-merge once Theseus clears MAXT-side.
- **When unblocked:** will surface as 🔴 "cut beta release" once AAXT passes.
- **Date added:** 2026-06-27 evening

---

## 🟡 Lower-urgency decisions

### Blog post POV — xian flagged revision needed before LinkedIn share

- **What:** xian (via Janus 6/25 day-focus memo) said the POV framing in "Bringing Conversations Into a Room" needs reworking before promotion. "The point-of-view isn't quite right yet." This supersedes the previous 🟡 entry ("shipped + tense-corrected").
- **What xian can do:** share what POV shift he wants, or review the post and mark up the specific passages. Calliope can rewrite once direction is clear.
- **Date added:** 2026-06-26 (escalated from lower-urgency by xian's explicit note)

### MAXT Session 02 + April-28 round-trip MAXT — still parked
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention. MAXT Session 03 (composition gesture) is now complete (6/27, 15/15 pass). Sessions 02 and April-28 remain parked.
- **Why lower-urgency:** not time-pressured; xian rouses Theseus situationally.
- **Date added:** 2026-06-23 (carried from Theseus's 6/22 report-in)

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating. Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status — all 5 agents cycling (verified 6/27)
- **Calliope** — live; persistent worktree `claude/calliope`; hourly `13 * * * *` when in-session.
- **Daedalus** — Inc 7 merged (`aaca51b`, 6/27); **composition gesture fully on main**; runbook filed (`docs/ux/increment7-e2e-runbook.md`); cycle complete for this phase.
- **Argus** — cron cycling; **1324 tests (1116 server / 208 client)**; R46–R49 AAXT written on `claude/argus` (6/26–6/27: sidebar, message input, markdown, new-channel-form); intel sweep due 6/28.
- **Theseus** — Phase 3 daily `31 9 * * *`; R45 complete (8/8 probes, 0 Phantoms — 6/26); R46 (clone) + R47 (@mention override) MAXT queued post-merge.
- **Iris** — MAXT Session 03 conducted live with xian (6/27 ~19:45); 15/15 pass; beta gate CLEAR. Filed runbook, updated COORDINATION.md, notified Daedalus + Theseus. Next: monitor R46+R47 AAXT; standby for release cut coordination.

### Composition gesture — **ALL 7 increments on main ✅; beta gate CLEAR**
- Inc 1–7 all merged to main and Iris-reviewed ✅. Inc 7 (`aaca51b`, 6/27): @mention overrides any mode.
- **MAXT Session 03 (6/27 ~19:45, xian live): 15/15 probes PASS. Zero failures. Zero regressions.**
  - New klatch creation, roster assignment, panel/roundtable/directed modes, clone-from-klatch prefill, @mention override in panel+roundtable, L4 injection — all confirmed end-to-end.
  - One operational finding: worktree staleness risk — dev session worktrees should `git pull --no-rebase origin main` at start. (Not a product gap; flagged in Iris log.)
- **R46 + R47 AAXT:** Theseus notified; queued for 6/28 ~9:31am PT. Release cut follows AAXT pass (see 🟠).

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: 24 days silent. Nudge via Janus at 6/28 if still silent (tomorrow).

---

## 🟢 Resolved since last board (6/27 evening)

- ~~**Merge claude/daedalus (Inc 7 — @mention override)**~~ — merged 6/27 (`aaca51b`). Iris ✅ conformant. Composition gesture fully on main. *Closed 6/27 night.*
- ~~**MAXT Session 03 — beta gate**~~ — 15/15 PASS (xian live, 6/27 ~19:45). Beta gate CLEAR. *Closed 6/27 night.*

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
