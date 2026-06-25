# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-06-25 Thursday ~00:29 PT (Calliope) — verified sweep, post-Iris-Phase3-cutover + branch-D-executed + Theseus-R43/R44.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **0** | **0** | **3** | **4** |

*No 🔴 items — verified-clear, not haven't-checked. All 5 agents now cycling (Iris Phase 3 cutover done 6/24). Composition spine implementing; blog live. Three 🟡 lower-urgency items need xian when convenient (MAXT sessions, blog LinkedIn share, cron-shape calibration).*

---

## 🔴 Needs you — FIRST, always

Currently empty — verified-clear as of 2026-06-25.

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

### Cohort status — all 5 agents cycling (verified 6/25)
- **Calliope** — live; persistent worktree `claude/calliope`; hourly `13 * * * *` when in-session.
- **Daedalus** — Phase 2 hourly `17 * * * *`; implementing the composition-gesture spine (increments shipping).
- **Argus** — Phase 2 hourly `43 * * * *`; test coverage in lockstep; R42–R44 shipped (EntityManager, MessageList, ProjectSettings AAXT).
- **Theseus** — Phase 3 daily `31 9 * * *`; active on AAXT rounds (R43 MessageList, R44 ProjectSettings); blocked-on-xian items = the two MAXT sessions (parked, see 🟡).
- **Iris** — Phase 3 cutover done 6/24 ~23:40; sparse overnight cron `17 3,7 * * *` (cron id `a89f159d`); persistent worktree `.claude/worktrees/iris`, branch `claude/iris`.

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

### CIO 6/3 canonical-artifacts request — still outstanding (22 days)
- Calliope's request via Janus for 5 canonical duty-cycle artifacts. No response; no deadline. Will nudge via Janus if still silent in another week.

---

## 🟢 Resolved since last board (6/23 → 6/25)

- ~~**Iris Phase 3 formal cutover**~~ — persistent worktree `.claude/worktrees/iris` + branch `claude/iris` created; sparse overnight cron `17 3,7 * * *` registered (cron id `a89f159d`). Done by Iris ~23:40 6/24. *Closed 6/25.*
- ~~**branch -D worktree-daedalus-2026-05-18**~~ — xian approved 6/22; Janus relayed; Daedalus confirmed executed 6/24. *Closed 6/25.*

*(Earlier closures 6/21–6/23 pruned — see the 6/23 cycle log for the full record.)*

---

## Changelog

- **v4 (2026-06-25)** — Verified sweep post-Iris-Phase3-cutover + branch-D-executed + Theseus-R43/R44. 🔴 now 0. All 5 agents cycling. Prune 6/21–6/23 resolved items.
- **v3 (2026-06-23)** — Full verified-sweep rewrite for 6/23 reality. Both prior 🔴 cleared. New 🔴: Iris formal Phase 3 cutover.
- **v2.1 (2026-06-21)** — post-Iris-session-12 refresh.
- **v2 (2026-06-19 evening)** — demand-organized refactor per Exec's advice.
- **v1 (2026-06-19 morning)** — initial sketch.
