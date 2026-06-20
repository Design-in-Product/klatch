# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. The board's job is to track *changing demand on xian*, which topic-sorting ages badly. (Per Exec 2026-06-19.)

**Anti-bottleneck function** (per xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — the rollup makes those direct conversations *productive when they happen*. It is not a substitute for talking to me, Iris, or anyone else.

**Trust-instrument discipline** (Exec 2026-06-19, the load-bearing rule): every render comes from a fresh **verified sweep** of source docs — never from Calliope's memory of what's going on. A false "all clear" is a trust breach, not untidiness; xian disengages because the board told him to. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Cadence:** at session-wrap, and any time substantive new items arrive. Sharpened cadence rule: when xian is *actively dipping in to act* (especially after a quiet stretch), full sweep-and-verify is mandatory — the "feels skippable" moment coincides exactly with when he most relies on the board being whole.

**Last refreshed:** 2026-06-19 evening (Calliope) — verified sweep, v2 per Exec's 6/19 advice.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **2** | **1** | **2** | **4** |

---

## 🔴 Needs you — FIRST, always

Items only *xian* can clear. Each tagged with **who's waiting**.

### Iris session for 1.0-beta UX critical path
- **Who's waiting:** Iris (directly); Daedalus and Argus (downstream of her — most of their substantive code/test work is Iris-gated); Theseus (next AAXT round wants UX-decisions to probe against).
- **What xian can clear:** sit with Iris and work the UX critical path. Composition gesture · klatch setup surface · remaining Tier 1 patches · working-meeting experience · promotion gesture. Iris's 5/12 design brief still has 4 open questions (promotion lifecycle, how broadcast mode is exposed, pre-1.0 vocabulary migration timing, what "running a meeting" looks like inside a klatch).
- **Pre-meeting prep Calliope can prepare** *(at xian's signal)*: a brief to Iris covering the strategic shifts since 5/12 (BYOC = transporter-device; July focal shift; what "beta" now means under that framing).
- **Date added:** 2026-06-19 (xian named as priority for tomorrow morning)
- **Recommended path:** xian's stated plan ("rouse Iris first thing in the morning when I am fresh, along with the rest of the crew") is the path. Calliope drafts the Iris pre-brief on xian's signal — could land tonight, ready for morning.

### Entity-reframe blog illustration — react and publish
- **Who's waiting:** Calliope (for publish path); readers (next post in the series, since "Before You Go" 5/13).
- **What xian can clear:** open `docs/drafts/bringing-conversations-illustration.html`, react (go / tweaks / hold), and Calliope publishes the post the same way "Before You Go" went out.
- **Date added:** 2026-05-28 (24 days waiting)
- **Recommended path:** publish. Illustration reads cleanly in the established slate vocabulary; the post is candid that the composition gesture is forthcoming. Holding longer doesn't sharpen anything.

---

## 🟠 Blocked on another agent

Stuck agent-on-agent. xian's awareness, Calliope's nudge-target.

### PM #972 memory-temporal-field alignment (`valid_from` / `valid_until`)
- **Stuck on:** Daedalus, whose response it is — but Daedalus is off-cycle and hasn't sessioned since 4/29. CIO (Piper Morgan) sent the proposal 6/15; explicitly not blocking either side.
- **Calliope's nudge-target:** when xian launches Daedalus (Phase 2 of the duty-cycle rollout — xian-stated for tomorrow morning), Daedalus sees the memo at session start and can respond. No separate nudge needed; the morning Daedalus launch *is* the unstucker.

---

## 🟡 Lower-urgency decisions

Real but not time-pressured. Stale-but-flagged items live here, labeled stale, never as fresh.

### Cron-shape experiments registry: still seeded straw-model, not yet calibrated
- **What:** `docs/operations/duty-cycle/cron-shape-experiments.md` carries the 6/3 straw-mapping entries with `*pending observation*` for everyone except Calliope. Calliope has now run two pilot stretches (5/28 + 6/19); other agents haven't launched at all. No calibration yet.
- **Why lower-urgency:** the straw model is reasonable until evidence; the calibration is post-launch data.
- **Date added:** 2026-06-03 (registry created)
- **Path:** as Phase 2 + 3 launches happen this week, agents append their first observations.

### Klatch's `last_verified` / `validUntil` field-naming choice (sub-decision of PM #972)
- **What:** Daedalus will need to choose whether Klatch adopts PM's `valid_until` or keeps Klatch's existing `validUntil`/`ended`. Sub-decision of the parent at 🟠 above, but his to make — not xian's.
- **Why here, not Needs-you:** xian doesn't need to call this. *Daedalus does* — flagged so xian doesn't need to weigh in. Parent context only.
- **Date added:** 2026-06-15

---

## 🔵 In flight

Awareness, no action needed.

### xian's July 2026 focal shift
- DinP becomes operational center; OpenLaws becomes external consulting client. Hyper-circle: PM-as-consulting-tool + Klatch-as-transporter-device + DinP-as-hub. Most of the strategic threads below sharpen under this lens. *xian's own work, not a Klatch action item.*

### CIO 6/3 canonical-artifacts request — still outstanding
- Calliope sent CIO a request 6/3 via Janus for 5 canonical duty-cycle artifacts (cron-lifecycle.md, PM cron-shape-experiments.md, v0.7.0 adoption package, launch-brief template, cohort status tracker). No response yet (16 days). CIO offered freely; no deadline. Calliope holds; nudges via Janus in another week if still silent.

### Cohort rollout Phases 2–3 — gated on tomorrow's launches
- xian-stated for tomorrow morning. Daedalus + Argus launch together as tandem (Phase 2); Theseus + Iris launch as daily-heartbeat signal-receivers (Phase 3). All four read launch-brief-template at first session, set up `.claude/worktrees/{slug}` on `claude/{slug}`, register cron. Each reports in to cycle log + agent-state tracker.

### Strategic threads parked for live conversation *(don't lose track; next-conversation picks the right one)*
- **Persistent topical rooms** as a Klatch product category (synthetic-klatch insight operationalized — Iris-domain, beta-relevant)
- **Contextual fidelity across seams** — Layer-5 / behavioral-calibration problem revisited
- **BYOC = "Bring Your Own Chat"** — Klatch MCP as transporter device; operationalizes interchange-protocol vision; gains client-side use case under focal shift
- **MCPs + service-design frontiers** — adjacent territory
- **Janus's hub role vs. Calliope's principal-contact role** — clarified 6/19: not in tension; Janus aggregates across xian's working life, Calliope aggregates within Klatch
- **Klatch's methodology contribution to the hyper-circle** — uniquely positioned to surface interchange-protocol/transporter and synthetic-klatches/rooms primitives; both are what Iris is heading toward; 1.0-beta UX work IS methodology-surface work
- **Question filed in dispatch question-box (6/19):** *smallest concrete UX or doc artifact that would make Klatch demoable to OpenLaws as transporter-device candidate?* Curiosity, not task. Letters archive whenever xian has room.

---

## 🟢 Resolved since last board

Struck-through items closed since v1. Kept so xian sees the clear; prevents "didn't I already decide that?" loop. Entries older than 7 days get pruned at refresh.

- ~~**BYOC clarification**~~ — xian corrected the autocorrect typo 6/19; for Klatch = transporter device. Captured in persistent memory + STATE.md. *Closed 6/19.*
- ~~**Janus 6/12 question-box-check line**~~ — adopted into v0.2 STOP procedure step 4 6/19; Calliope filed first question to dispatch same evening (`question-calliope-2026-06-19-klatch-legibility-to-consulting-clients.md`). *Closed 6/19.*
- ~~**Attention-rollup v1**~~ — sketched 6/19 morning; Exec sent four corrections same evening; v2 (this document) verified-swept. *Closed 6/19.*
- ~~**Exec advice request**~~ — direct PM-side delivery succeeded 6/19; Exec replied same evening; ack filed; corrections absorbed. *Closed 6/19.*
- ~~**Standing directive: cron resume-by-default-when-idle**~~ — xian named 6/19; v0.2 Principle 4 updated in place; cron `df35e0db` registered with sharpened drain prompt embedded. (Pause-and-resume-around-v2-sweep is the current expected behavior, not a violation.) *Closed 6/19.*

---

## Changelog

- **v2 (2026-06-19 evening)** — Refactored per Exec's 6/19 advice. Sections demand-organized (was topic). Who's-waiting tags on every Needs-you row. Sub-decision-of-blocked-thing surfaced as own row (PM #972 sub-decision). Metrics strip added. Verified-sweep discipline applied — read all source docs, cross-checked against live truth. Recently-closed footer with strikethroughs.
- **v1 (2026-06-19 morning)** — initial sketch, six topic-organized sections.
