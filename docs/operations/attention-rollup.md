# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-06-27 Saturday ~06:18 PT (Calliope) — R45 passed; Inc 6 built + in Iris review; cohort status updated.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **1** | **0** | **3** | **4** |

*One 🔴 item: merge `claude/daedalus` — critical path to beta (v6, xian 6/26). R45 passed ✓; Inc 6 in Iris review. All 5 agents cycling.*

---

## 🔴 Needs you — FIRST, always

### Merge `claude/daedalus` — critical path to beta

- **Beta definition (xian, 6/26):** composition gesture fully implemented + tested/QA'd → release cut (v0.9 or v1.0). This is beta. Step 11 (Search) comes after. The plumbing was ready; UX design was the missing piece (Iris Phase 3 complete). What remains: finish implementation + test round → cut.
- **Who's waiting:** Argus (R46 queued post-merge), Theseus (R46 queued post-merge), Iris (next review queue post-merge). Note: Daedalus proceeded to build Inc 6 without merge (R45 unblocked him); Inc 6 is now in Iris review. Merge still needed for Inc 6 to reach main and unlock R46.
- **What's on the branch** (verified, Daedalus 6/26 START log): commit `a314d48`:
  - Increment 4: default-project (Iris-reviewed ✅ — `0719adc`)
  - Increment 5: cross-ref strip + `#general` guard (Iris-reviewed ✅ — `e2568ee`)
  - 3 Iris-dispatched R43+R44 copy/a11y fixes: `aria-label="Pin to channel"`, "L3 context"→"AI context", Cancel `title="Discard changes"`
- **What xian can do:** review + merge `claude/daedalus` → `main`. This is the single action that unblocks the beta path.
- **Date added:** 2026-06-26 (reframed as beta critical path 07:45 same day)

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
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention. Both parked. Surfaced so they don't quietly rot.
- **Why lower-urgency:** real Klatch-beta-relevant work but not time-pressured; xian rouses Theseus situationally for AXT (his 6/21 posture).
- **Date added:** 2026-06-23 (carried from Theseus's 6/22 report-in)

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating. Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status — all 5 agents cycling (verified 6/27)
- **Calliope** — live; persistent worktree `claude/calliope`; hourly `13 * * * *` when in-session.
- **Daedalus** — Phase 2 hourly `17 * * * *`; built Inc 6 (clone, R45-unblocked); branch `claude/daedalus` awaiting merge (see 🔴). Inc 6 in Iris review.
- **Argus** — Phase 2 hourly `43 * * * *`; 1291 tests; R45 validated by Theseus (cross-ref + `#general` guard — 8/8, 0 Phantoms); R46 (default-project sidebar) queued post-merge.
- **Theseus** — Phase 3 daily `31 9 * * *`; R45 complete (8/8 probes, 100% conveyance, 0 Phantoms — 6/26); R46 queued post-merge.
- **Iris** — sparse overnight `17 3,7 * * *`; R45 results received; reviewing Inc 6 (clone) from Daedalus; next full review queue post-merge.

### Composition gesture — R45 passed; Inc 6 in Iris review
- Increment 1 (atomic roster + dual affordance) shipped to main. Increments 2–3 (picker polish) + 4–5 (default-project, cross-ref strip + `#general` guard) on `claude/daedalus` — Iris-reviewed ✅.
- **R45 passed (6/26):** CrossRefStrip + `#general` guard — 8 probes, 7 Correct, 1 Reconstructed, 0 Phantoms. All design properties confirmed.
- **Increment 6 (clone) built (6/26):** Daedalus built clone-from-klatch; in Iris UX review. Action-select prefills name/purpose/mode/project/roster from source; empty purpose when source is boilerplate.

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: 24 days silent. Nudge via Janus at 6/28 if still silent (tomorrow).

---

## 🟢 Resolved since last board (6/26 → 6/27)

- ~~**AAXT cross-ref + #general guard blocked on merge**~~ — R45 completed by Theseus 6/26; 8/8 probes, 0 Phantoms. *Closed 6/27.*

## 🟢 Previously resolved (6/25 → 6/26)

- ~~**Iris Phase 3 formal cutover**~~ — done 6/24. *Closed 6/25.*
- ~~**branch -D worktree-daedalus-2026-05-18**~~ — executed 6/24. *Closed 6/25.*
- ~~**Blog post LinkedIn share (lower-urgency)**~~ — escalated to 🔴 POV-revision ask per xian's 6/25 direction. No longer "ship as-is."

*(Earlier closures pruned — see 6/25 cycle log.)*

---

## Changelog

- **v7 (2026-06-27)** — R45 passed (Theseus, 6/26): CrossRefStrip + `#general` guard, 8/8, 0 Phantoms. Inc 6 (clone) built by Daedalus, in Iris review. "Daedalus waiting on merge" removed (he proceeded). AAXT-blocked entry resolved. 🔴 count: 1 (merge still critical path).
- **v6 (2026-06-26)** — Beta definition captured from xian directly: composition gesture fully implemented + tested/QA'd = beta (v0.9 or v1.0); Search is post-beta. Merge item reframed as critical-path-to-beta. Beta-path 🔴 resolved (definition now documented). 🔴 count: 1.
- **v5 (2026-06-26)** — Verified sweep triggered by Janus stall-sweep request. Two new 🔴: Daedalus branch merge (4 agents blocked) + beta critical path (xian's top ask). Blog post upgraded from 🟡 to 🔴 POV-revision needed. Cohort status updated (Daedalus cron-silence resolved). Stale v4 "no 🔴" summary corrected.
- **v4 (2026-06-25)** — Iris Phase 3 cutover resolved. 🔴 → 0. All 5 agents cycling.
- **v3 (2026-06-23)** — Full verified-sweep rewrite. New 🔴: Iris Phase 3 cutover.
- **v2.1 (2026-06-21)** — post-Iris-session-12 refresh.
- **v2 (2026-06-19 evening)** — demand-organized refactor per Exec's advice.
- **v1 (2026-06-19 morning)** — initial sketch.
