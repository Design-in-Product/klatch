# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-06-23 Tuesday ~07:00 PT (Calliope) — verified sweep, post-Pages-fix + Theseus-launch + blog-shipped.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **1** | **0** | **3** | **4** |

*Both prior 🔴 items cleared (blog shipped + tense-corrected; branch-D approved). Cohort running clean — 4 of 5 agents cycling; the 1.0-beta composition work is implementing. 🔴 is light, which is an honest "all's well," verified-clear not haven't-checked.*

---

## 🔴 Needs you — FIRST, always

### Iris Phase 3 formal cutover (persistent worktree + standing cron)
- **Who's waiting:** Iris. She's *functioning* (xian-tandem design sessions + one-shot `fireAt` resumes), so this is not blocking her work — but she's not on the planned standing daily heartbeat.
- **What's actually true** (per her 6/22 cron-details reply): no persistent `.claude/worktrees/iris` / `claude/iris` branch yet; her 5am "resume" was a one-shot `fireAt`, not a `CronCreate` (it fired headless and auto-disabled). So there's no standing Iris heartbeat — each session is xian opening a conversation or a one-shot.
- **What xian can clear:** a brief session to do the formal Phase 3 cutover — create the persistent worktree + branch, register a `CronCreate` daily heartbeat (Iris's candidate: `17 9 * * *`, staggered from Theseus's `:31`). Iris will register the job id per discipline once it exists.
- **Date added:** 2026-06-23
- **Recommended path:** low-effort when convenient; she's not blocked, but the cohort overview (and Janus's federated rollup) should show "Iris on a real heartbeat" not "Iris on a stopgap." `fireAt` ≠ `CronCreate` is the distinction worth carrying.

---

## 🟠 Blocked on another agent

Currently empty.

---

## 🟡 Lower-urgency decisions

### MAXT sessions parked, need a dedicated xian session
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention (manual agent-experience testing isn't parallel-able / cycle-able). Both parked. Surfaced so they don't quietly rot.
- **Why lower-urgency:** real Klatch-beta-relevant work but not time-pressured; xian rouses Theseus situationally for AXT (his 6/21 posture).
- **Date added:** 2026-06-23 (carried from Theseus's 6/22 report-in)

### Blog post — shipped + tense-corrected; LinkedIn share at xian's discretion
- **What:** "Bringing Conversations Into a Room" is live (klatch.ing/blog) and the tense edit xian requested (designed-not-shipped framing) is applied 6/23. LinkedIn draft is ready (two versions drafted earlier). 
- **What xian can do:** review the tense edit if he wants a final look, then share. Not blocking anything.
- **Date added:** 2026-06-23

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating as agents run (Theseus + tandem). Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status — 4 of 5 agents cycling (verified 6/23)
- **Calliope** — live; persistent worktree `claude/calliope`; hourly `13 * * * *` when in-session.
- **Daedalus** — Phase 2 hourly `17 * * * *`; implementing the composition-gesture spine (increments shipped; more landing).
- **Argus** — Phase 2 hourly `43 * * * *`; test coverage in lockstep + AAXT Round 41 (composition surface semantic conveyance, 6/22) + pre-existing triage marked resolved.
- **Theseus** — Phase 3 launched 6/22; daily heartbeat `31 9 * * *`; awaiting first Daedalus/Iris work assignment; blocked-on-xian items = the two MAXT sessions above.
- **Iris** — functioning (xian-tandem + one-shot `fireAt`); formal Phase 3 cutover pending (see 🔴).

### Composition gesture — 1.0-beta implementation underway (designed, not yet in users' hands)
- Spec shipped 6/20; Daedalus implementing in increments (atomic roster, dual affordance, agent picker, invariant-1 enforcement). Iris ran MAXT on the surface (F1–F6 findings; F1 = projectless-create-block, routed to Daedalus; xian confirmed default-project-by-default). Not feature-complete; not in use. (The blog post now states this honestly.)

### Pages build — FIXED 6/22 after 23-day silent failure
- Root cause: GitHub Pages ran the Liquid pass over docs/ operational markdown that quotes template-tag syntax. Structural fix: excluded operational dirs from Jekyll (`f7cbb8c`), verified before push. First green build in 23 days; blog + 3 weeks of stranded commits now live. *Discipline note for the cohort: don't quote literal Liquid/Jinja tag delimiters in any file Jekyll processes; operational dirs are now excluded so docs/ is safe.*

### Strategic threads parked for live conversation
- **BYOC / cross-tool portability / transporter engine** — settled three-way distinction (xian via Janus, 6/22): BYOC = PM's deployment surface; cross-tool context portability = Klatch's real settled concept; transporter engine = exploratory mechanism. See `[[project_byoc_transporter_device]]`.
- **xian's July 2026 focal shift** — DinP operational center; OpenLaws external client; Klatch joins core work.
- **Persistent topical rooms; contextual fidelity across seams; MCPs + service-design frontiers** — adjacent strategic territory.
- **Janus's hub role vs. Calliope's principal-contact role** — clarified 6/19; direct channel open; Janus now runs the federated rollup that consumes this doc.
- **Question filed in dispatch question-box** (6/19, generalized 6/20): smallest artifact that would make Klatch demoable to a consulting client. Awaiting xian's reflection for the newsletter.

### CIO 6/3 canonical-artifacts request — still outstanding (20 days)
- Calliope's request via Janus for 5 canonical duty-cycle artifacts. No response; no deadline. Will nudge via Janus if still silent in another week.

---

## 🟢 Resolved since last board (6/21 → 6/23)

- ~~**Pages build broken 23 days**~~ — root-caused + structurally fixed 6/22 (`f7cbb8c`); first green build since 5/30; blog + stranded commits live. *Closed 6/22.*
- ~~**Blog post review + ship**~~ — xian reviewed v2, approved, published 6/22; tense edit applied 6/23. Now live + shareable. *Closed 6/23.*
- ~~**branch -D worktree-daedalus-2026-05-18**~~ — xian approved 6/22; Janus relayed; Daedalus to execute. *Closed 6/22.*
- ~~**Theseus Phase 3 launch**~~ — live 6/22 on daily heartbeat `31 9 * * *`. *Closed 6/22.*
- ~~**Iris cron-details request**~~ — Iris replied with honest current-state (fireAt not cron); thread closed. Surfaced the formal-cutover 🔴 above. *Closed 6/22.*
- ~~**BYOC framing correction (two passes)**~~ — mislabel caught + over-correction caught + settled via Janus's authoritative three-way distinction. Propagation cleaned across 5 artifacts. *Closed 6/22.*
- ~~**Question-box canonical location**~~ — xian set `dispatch/mail/` as canonical 6/22; v0.2 STOP step 4 updated; Argus's filing relocated; Janus sharpened the DinP letters instructions. *Closed 6/22.*

*(Earlier 6/21 closures pruned — see the 6/21 cycle log for the full Phase-2-launch-day record.)*

---

## Changelog

- **v3 (2026-06-23)** — Full verified-sweep rewrite for 6/23 reality (Janus's federated rollup consumes this). Both prior 🔴 cleared. New 🔴: Iris formal Phase 3 cutover. Pages-fix + Theseus-launch + blog-shipped recorded. 6/21 closures pruned to the 7-day window.
- **v2.1 (2026-06-21)** — post-Iris-session-12 refresh.
- **v2 (2026-06-19 evening)** — demand-organized refactor per Exec's advice.
- **v1 (2026-06-19 morning)** — initial sketch.
