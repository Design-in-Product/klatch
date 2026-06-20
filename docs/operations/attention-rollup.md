# Klatch Attention Rollup

**Purpose:** the document xian skims to know what needs his attention, in priority order, with enough context to act on each in one sitting. Refreshed by Calliope at session-wrap and any time substantive new items arrive.

**Distinct from:**
- `STATE.md` — comprehensive standing-state; project-shaped, not xian-shaped
- per-agent task lists (`docs/operations/duty-cycle/{slug}-tasks.md`) — operational; each agent's working surface

**Anti-bottleneck function** (per xian, 2026-06-19): the rollup exists so that 1:1s start primed with shared context rather than catch-up. xian still works directly with each agent — the rollup makes those direct conversations *productive when they happen*. It is not a substitute for talking to me or to anyone else; it's the substrate that aggregates xian's attention so the dumb-bottleneck pattern is removed.

**Discipline notes:**
- **Date-added** on every item so xian can see what's waited longest.
- **One-line recommended path** wherever Calliope has one — but the recommendation is never the only option; xian's call.
- **"Strategic threads parked for live conversation"** items are NOT actionable individually but xian shouldn't lose track. They're in the rollup so the next live conversation can pick the right one rather than relitigating which thread is open.
- **Format is v1, expected to evolve** after Exec (PM CoS) shares the canonical PM-side format. Adopt-then-contribute: run the v1 shape on Klatch's work-shape, surface differences back to the cohort via Janus.

**Last refreshed:** 2026-06-19 evening (Calliope)

---

## 1. Decisions needed from xian

Items where xian's judgment is the gate. Each carries what's blocked, who's waiting, what info xian needs, and a recommended path.

### Entity-reframe blog illustration — react and publish
- **Added:** 2026-05-28 *(24 days waiting)*
- **What's blocked:** publication of "Bringing Conversations Into a Room" (the entity-reframe post, sibling to "Before You Go"). The only drafted-not-published post in the queue.
- **Who's waiting:** Calliope (for the publish path); the reader audience (for the next post in the series).
- **What xian needs:** open the illustration preview (`docs/drafts/bringing-conversations-illustration.html`) and decide go / tweaks / hold.
- **Recommended path:** publish. The illustration's reading well at scale (calm slate vocabulary, conversation-cards at oblique klatch-table, composition-gesture and role-marker present). The post is candid about the composition gesture being forthcoming, so it's honest, not premature. The 22-day wait is itself a signal we're holding it for review polish rather than substantive concern.

### Iris unblock for 1.0-beta UX critical path
- **Added:** 2026-06-19 *(stated by xian today as priority #3)*
- **What's blocked:** the linchpin to 1.0-beta. UX critical-path: composition gesture · klatch setup surface · remaining Tier 1 patches · working-meeting experience · promotion gesture.
- **Who's waiting:** Iris (direct), and downstream of her, Daedalus and Argus (whose code/test work is mostly Iris-gated).
- **What xian needs:** a session with Iris.
- **Recommended path:** before going to Iris, decide two pre-meeting questions Calliope flagged 6/19: *(a)* what is "beta" given the strategic shift (the BYOC/transporter-device framing reshapes what UAT/AXT is testing for); *(b)* what does Iris currently know about the strategic shift (a short brief before the unblock conversation may make it faster, not slower). Calliope can draft the brief if useful.

### PM #972 memory-temporal-field alignment (`valid_from` / `valid_until`)
- **Added:** 2026-06-15 (mail arrival) *(4 days waiting in Daedalus's lane)*
- **What's blocked:** Klatch's response on whether to align field names with PM. Compatibility nicety, explicitly not blocking either side.
- **Who's waiting:** PM CIO (offered a one-cycle alignment); Daedalus (whose response it is, when he next sessions).
- **What xian needs:** awareness; no direct action unless he wants to weight in on the field-name choice before Daedalus does.
- **Recommended path:** let Daedalus respond at his next session (Phase 2 launch creates the natural trigger). If urgency rises, ping him to session sooner.

---

## 2. Reviews waiting on xian

Items where a draft / design / artifact is ready for xian's eye.

- *None currently outstanding beyond the entity-reframe illustration (above, in §1 because it's also a publish-decision).*

---

## 3. Cross-project items needing xian's read

Items that touch other projects and may want xian's hub view.

### PM 6/18 left-rail nav debacle + ADR-072 convergence
- **Added:** 2026-06-19 (Janus brief)
- **Why it's here:** PM published a nav that didn't match the mock; xian rejected; PM chose spec-first not revert. Adjacent ADR-072 "derive-don't-maintain" principle is the same shape as Klatch v0.2's agent-state tracker aspiration. Convergent infrastructure pattern continues.
- **Why it might want xian's attention:** if the methodology converging across projects is itself becoming a teachable/clientable pattern (per the focal-shift hyper-circle framing), this is a beat worth pulling forward. Not actionable on Klatch directly.

### CIO 6/3 artifacts request — outstanding
- **Added:** 2026-06-03 *(16 days outstanding)*
- **What's pending:** Calliope sent CIO a request via Janus for five canonical duty-cycle artifacts (cron-lifecycle.md, PM's cron-shape-experiments.md, v0.7.0 adoption package, launch-brief template, cohort status tracker). No response yet.
- **Recommended path:** patience. CIO offered freely; no deadline. Janus may not have routed yet. If still no response in another week, Calliope nudges via Janus.

---

## 4. Agent-launch gates

Per-agent: what's blocked, and what would unblock. Most of these are *gated on xian launching the agent* (because the cycle work is itself the unblock — they can't say "I'm available" without being launched).

### Calliope
- **Status:** live (when in-session). Hourly cycle when registered; persistent worktree `claude/calliope`.
- **Blocks:** none. Currently the only agent on cycle.

### Daedalus
- **Status:** off-cycle since 4/29 (last session). Probably *not* 100% blocked.
- **Standing items he could do now if launched:**
  1. Respond to PM CIO's 6/15 #972 alignment memo (decide on `valid_from` / `valid_until` adoption).
  2. Scope the MCP-as-transporter-device thread (newly elevated by BYOC clarification) — what does the canonical-package format need to support?
  3. Prep his preferred Finding 1 UX shape with rationale, ready for Iris's call.
  4. His own Phase 2 duty-cycle setup work (read launch-brief, plan worktree, draft cron prompt).
  5. Daedalus's parked 4/28 round-trip MAXT (MAXT needs xian).
- **Real unblock condition:** Iris's UX direction on composition gesture + Finding 1 + the broader 1.0-beta critical path. Most of Daedalus's substantive code work is downstream of her.
- **Unblock action by xian:** launch his session. Phase 2 is xian-launch-gated, not substance-gated.

### Argus
- **Status:** off-cycle since 5/18. Less clear what's queued; needs to be asked.
- **Standing items he could do now if launched:**
  1. Weekly intel sweep (overdue).
  2. His own Phase 2 duty-cycle setup work.
  3. Any AAXT round he wanted to propose for newly-touched surfaces.
  4. Wait — the post-Round 33 quiet may itself be "no test work because no code work," meaning his unblock is downstream of Daedalus's.
- **Real unblock condition:** probably Daedalus shipping something testable; OR xian commissioning a specific AAXT round; OR duty-cycle Phase 2 itself becoming the work.
- **Unblock action by xian:** launch his session (he and Daedalus are a tandem; launching together is the v0.2 design).

### Theseus
- **Status:** off-cycle since 4/27. Almost certainly 100% gated on xian launching him.
- **Standing items he could do now if launched:**
  1. AAXT continuation (ProjectSettings / EntityManager / MessageList — green-lit 5/28, never picked up).
  2. His own Phase 3 duty-cycle setup work (daily heartbeat).
  3. MAXT Session 02 (needs xian's live attention; not parallel-able).
- **Real unblock condition:** xian launching him. The 5/28 green-light has been sitting for 22 days.
- **Unblock action by xian:** launch his session.

### Iris
- **Status:** off-cycle. UX linchpin for 1.0-beta. Has 4 open design-brief questions from her own 5/12 brief.
- **Standing items she could do now if launched:**
  1. Spec the composition gesture + klatch setup surface concretely.
  2. Make her Finding 1 UX call (silent attach / toast / dialog / refuse).
  3. Her own Phase 3 duty-cycle setup work (daily heartbeat).
- **Real unblock condition:** xian working *with* her on the UX critical path. Iris is more like Daedalus-in-tandem-with-Argus — her work is most productive in dialogue, not solo.
- **Unblock action by xian:** *the* session — xian's stated priority #3 for the next available bandwidth. Highest-leverage unblock in the whole list.

---

## 5. Strategic threads parked for live conversation

Not actionable individually. In the rollup so the next live conversation picks the right thread rather than relitigating which thread is open.

- **Persistent topical rooms** as a Klatch product category (synthetic-klatch insight made operational) — Iris-domain, beta-relevant.
- **Contextual fidelity across seams** — Layer-5 / behavioral-calibration problem revisited.
- **BYOC = "Bring Your Own Chat"** — for Klatch: a person using Klatch MCP as a transporter device for context to a new tool. Operationalizes interchange-protocol vision. Critical positioning thread; client-side use case under focal shift.
- **MCPs + service-design frontiers** — adjacent territory.
- **xian's July 2026 focal shift** — full-time consulting + own products; DinP becomes operational center; Klatch joins core work. Most strategic threads above sharpen under this lens.
- **Janus's hub role vs. Calliope's principal-contact role** — clarified 6/19: not in tension; Janus aggregates across xian's working life, Calliope aggregates within Klatch. Both serve the anti-bottleneck goal at different scopes.
- **Klatch's methodology contribution to the hyper-circle** — Klatch is uniquely positioned to surface the interchange-protocol/transporter and the synthetic-klatches/rooms primitives; both happen to be what Iris is heading toward; the 1.0-beta UX work is also methodology-surface work.

---

## 6. Pending external responses

Items where Klatch is waiting on something external to respond.

- **CIO's 6/3 canonical-artifacts request** — see §3.
- **Dispatch usage-monitoring memo** (5/28) — no usage data back; no action required unless a spike surfaces.

---

## Recently closed (last 7 days)

*(Empty as of v1 creation. Calliope will populate as items are resolved, then prune entries older than 7 days during refreshes.)*
