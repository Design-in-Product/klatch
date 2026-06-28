# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-06-27 Saturday ~21:50 PT (Argus) — Inc 7 Iris ✅ conformant; composition gesture complete; 🔴 merge ready; rollup v13.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **1** | **0** | **3** | **4** |

*One 🔴: merge `claude/daedalus` (Inc 7 — @mention override) — **Iris ✅ conformant; composition gesture complete; merge when ready.***

---

## 🔴 Needs you — FIRST, always

### Merge `claude/daedalus` (Inc 7 — @mention override) — **Iris ✅ conformant; composition gesture complete**

- **What's on the branch** (verified): commit `17c3d78` — **Increment 7 (final): @mention overrides any klatch mode.** Server: `resolveMentions` hoisted above mode dispatch (mention → route first; else → default mode). Client: `showMentions` ungated from `isDirected && entities≥2` → `entities≥2` (dropdown works in panel/roundtable too). +4 route tests, +4 MessageInput tests.
- **Iris verdict (6/27 ~21:30):** Conformant ✅. All 3 bounded decisions approved (server hoisting, client gate, `insertMention` precedence). `@` discoverability in panel/roundtable → MAXT Session 03 observation (not a code issue; not a blocker).
- **Composition gesture complete.** Inc 7 is the last increment. When merged, the full composition critical path is on main.
- **Who's waiting post-merge:** Theseus (R46 clone MAXT + R47 @mention MAXT), xian (MAXT Session 03 — beta gate). [Argus R46–R49 AAXT written on `claude/argus` — not merge-blocked.]
- **Beta gate:** composition gesture on main + Theseus AAXT + MAXT Session 03 with xian = beta release cut.
- **What xian can do:** merge `claude/daedalus` → main.
- **Date updated:** 2026-06-27 evening (Iris ✅ received)

---

## 🟠 Blocked on another agent

Currently empty.

---

## 🟡 Lower-urgency decisions

### Blog post POV — xian flagged revision needed before LinkedIn share

- **What:** xian (via Janus 6/25 day-focus memo) said the POV framing in "Bringing Conversations Into a Room" needs reworking before promotion. "The point-of-view isn't quite right yet." This supersedes the previous 🟡 entry ("shipped + tense-corrected").
- **What xian can do:** share what POV shift he wants, or review the post and mark up the specific passages. Calliope can rewrite once direction is clear.
- **Date added:** 2026-06-26 (escalated from lower-urgency by xian's explicit note)

### MAXT sessions parked, need a dedicated xian session
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention. Both parked. **R46 MAXT (clone-from-klatch) is now also unblocked** — Inc 6 merged 6/27; Theseus notified via `daedalus-to-theseus-inc6-merged-aaxt-unblocked-2026-06-27.md`.
- **Why lower-urgency:** real Klatch-beta-relevant work but not time-pressured; xian rouses Theseus situationally for AXT (his 6/21 posture).
- **Date added:** 2026-06-23 (carried from Theseus's 6/22 report-in; R46 added 6/27)

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating. Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status — all 5 agents cycling (verified 6/27)
- **Calliope** — live; persistent worktree `claude/calliope`; hourly `13 * * * *` when in-session.
- **Daedalus** — Phase 2 hourly `17 * * * *`; Inc 6 merged 6/27 (`a313ab2`); **Inc 7 built** (`17c3d78` on `claude/daedalus`) — @mention overrides any mode (server route hoist + client dropdown ungated); sent to Iris UX review 6/27 ~20:36.
- **Argus** — cron cycling; **1324 tests (1116 server / 208 client)**; R46–R49 AAXT written on `claude/argus` (6/26–6/27: sidebar, message input, markdown, new-channel-form); intel sweep due 6/28.
- **Theseus** — Phase 3 daily `31 9 * * *`; R45 complete (8/8 probes, 0 Phantoms — 6/26); R46 (clone) + R47 (@mention override) MAXT queued post-merge.
- **Iris** — Inc 6 ✅ (6/27 evening); Inc 7 ✅ conformant (6/27 ~21:30); composition gesture complete; R47 MAXT coordination sent to Theseus; next: R47 MAXT post-merge.

### Composition gesture — Inc 1–6 merged; Inc 7 (final) merge-ready
- Increments 1–6 merged to main. Inc 1: atomic roster + dual affordance. Inc 2–3: picker polish. Inc 4: default-project. Inc 5: cross-ref strip + `#general` guard. Inc 6: clone-from-klatch (`a313ab2`, 6/27). All Iris-reviewed ✅.
- **R45 passed (6/26):** CrossRefStrip + `#general` guard — 8 probes, 7 Correct, 1 Reconstructed, 0 Phantoms.
- **R46 MAXT (clone-from-klatch):** Theseus notified; Iris coordination sent; parked pending xian session (see 🟡).
- **Inc 7 — @mention overrides any mode** (`17c3d78`, `claude/daedalus`): Iris ✅ conformant 6/27 ~21:30. **Composition gesture complete.** Merge pending xian (see 🔴). Post-merge: Theseus runs R46 then R47 MAXT; MAXT Session 03 with xian = beta gate.

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: 24 days silent. Nudge via Janus at 6/28 if still silent (tomorrow).

---

## 🟢 Resolved since last board (6/27 morning → 6/27 evening)

- ~~**Merge claude/daedalus (Inc 6 — clone-from-klatch)**~~ — merged 6/27 (`a313ab2`, xian-authorized). Iris ✅ conformant. Theseus notified; R46 MAXT unblocked. *Closed 6/27 evening.*

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
