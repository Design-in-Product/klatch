# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-06-26 Friday ~14:15 PT (Calliope) — verified sweep triggered by Janus stall-sweep request. Sources: COORDINATION.md, agent-state.md, Daedalus/Iris/Theseus/Argus cycle logs, 6/25 day-focus memo.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **2** | **0** | **3** | **4** |

*Two 🔴 items: Daedalus branch merge (unblocks 4 agents) + beta critical path clarity (xian's explicit ask via 6/25 day-focus memo). All 5 agents cycling.*

---

## 🔴 Needs you — FIRST, always

### Merge `claude/daedalus` branch — unblocks 4 agents simultaneously

- **Who's waiting:** Daedalus, Iris, Argus, Theseus — all blocked on this merge.
- **What's on the branch** (verified from Daedalus's 6/26 START log): commit `a314d48`:
  - Increment 4: default-project (Iris-reviewed ✅ — `0719adc`)
  - Increment 5: cross-ref strip + `#general` guard (Iris-reviewed ✅, one-line guard added — `e2568ee`)
  - 3 Iris-dispatched R43+R44 copy/a11y fixes: `aria-label="Pin to channel"`, "L3 context"→"AI context", Cancel `title="Discard changes"`
- **Why blocked:** Daedalus is not stacking more un-merged work (correct discipline). Increment 6 (clone) and Theseus's cross-ref AAXT round both blocked on merge.
- **What xian can do:** review + merge `claude/daedalus` → `main`. Iris-reviewed ✅, so this should be a fast review.
- **Date added:** 2026-06-26
- **Cron note:** Daedalus cron was silent ~1 day (6/25 daytime → 6/26 morning) — mode-1 stall (backgrounded). Harmless (nothing dropped); cron re-armed 6/26 START. Not related to the merge ask.

### Beta critical path — xian explicitly can't see it clearly

- **What:** xian's explicit ask (via Janus 6/25 day-focus memo): "What is the remaining work and the critical path to beta release? He knows who's doing what but doesn't know what the remaining work actually is, or how it's being tracked."
- **Current picture** (synthesized from COORDINATION.md + ROADMAP.md):
  - Steps 1–10 are essentially complete (Step 10 export: Phase 1–5c-i ✅; 5c-ii deferred).
  - Current front-door work: **composition gesture** (multi-entity channel creation UI). Increment 1 merged; increments 2–5 on `claude/daedalus` (pending merge above). Increment 6 (clone) next.
  - After composition gesture: **Step 11 Search** (FTS5, search UI, Cmd+K, export, bookmarks) — not started.
  - **No formal beta definition** found in docs. No issue tracker in use — work tracked in COORDINATION.md + cycle logs.
- **What xian can do:** define beta criteria (what does "beta" mean — feature-complete composition gesture? search included? deployed externally?) and decide whether issues should be created.
- **Calliope note:** Happy to draft a beta checklist once xian defines the scope. Coordinating with Daedalus + Iris for their view is the next step — but xian's input on the beta definition unblocks that.
- **Date added:** 2026-06-26 (surfaced from 6/25 day-focus memo)

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

### Cohort status — all 5 agents cycling (verified 6/26)
- **Calliope** — live; persistent worktree `claude/calliope`; hourly `13 * * * *` when in-session.
- **Daedalus** — Phase 2 hourly `17 * * * *`; cron re-armed after ~1 day mode-1 silence; branch `claude/daedalus` awaiting merge (see 🔴). Building increment 6 (clone) after merge.
- **Argus** — Phase 2 hourly `43 * * * *`; 1291 tests; next AAXT round (cross-ref + `#general` guard) blocked on Daedalus merge.
- **Theseus** — Phase 3 daily `31 9 * * *`; R43+R44 complete; cross-ref AAXT blocked on Daedalus merge.
- **Iris** — sparse overnight `17 3,7 * * *`; R43+R44 fixes dispatched to Daedalus (all on branch); waiting for merge to queue next review.

### Composition gesture — increments 1 merged; 2–5 on branch awaiting merge
- Increment 1 (atomic roster + dual affordance) shipped to main. Increments 2–3 (picker polish) + 4–5 (default-project, cross-ref) on `claude/daedalus` — Iris-reviewed ✅. Increment 6 (clone) next after merge.

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: 23 days silent. Nudge via Janus at ~6/28 if still silent.

---

## 🟢 Resolved since last board (6/25 → 6/26)

- ~~**Iris Phase 3 formal cutover**~~ — done 6/24. *Closed 6/25.*
- ~~**branch -D worktree-daedalus-2026-05-18**~~ — executed 6/24. *Closed 6/25.*
- ~~**Blog post LinkedIn share (lower-urgency)**~~ — escalated to 🔴 POV-revision ask per xian's 6/25 direction. No longer "ship as-is."

*(Earlier closures pruned — see 6/25 cycle log.)*

---

## Changelog

- **v5 (2026-06-26)** — Verified sweep triggered by Janus stall-sweep request. Two new 🔴: Daedalus branch merge (4 agents blocked) + beta critical path (xian's top ask). Blog post upgraded from 🟡 to 🔴 POV-revision needed. Cohort status updated (Daedalus cron-silence resolved). Stale v4 "no 🔴" summary corrected.
- **v4 (2026-06-25)** — Iris Phase 3 cutover resolved. 🔴 → 0. All 5 agents cycling.
- **v3 (2026-06-23)** — Full verified-sweep rewrite. New 🔴: Iris Phase 3 cutover.
- **v2.1 (2026-06-21)** — post-Iris-session-12 refresh.
- **v2 (2026-06-19 evening)** — demand-organized refactor per Exec's advice.
- **v1 (2026-06-19 morning)** — initial sketch.
