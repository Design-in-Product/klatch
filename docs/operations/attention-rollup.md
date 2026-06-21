# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. The board's job is to track *changing demand on xian*, which topic-sorting ages badly. (Per Exec 2026-06-19.)

**Anti-bottleneck function** (per xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — the rollup makes those direct conversations *productive when they happen*. It is not a substitute for talking to me, Iris, or anyone else.

**Trust-instrument discipline** (Exec 2026-06-19, the load-bearing rule): every render comes from a fresh **verified sweep** of source docs — never from Calliope's memory of what's going on. A false "all clear" is a trust breach, not untidiness; xian disengages because the board told him to. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Cadence:** at session-wrap, and any time substantive new items arrive. Engagement-state rule: when xian is *actively dipping in to act* (especially after a quiet stretch), full sweep-and-verify is mandatory — the "feels skippable" moment coincides exactly with when he most relies on the board being whole.

**Last refreshed:** 2026-06-21 Sunday ~11:30 AM (Calliope) — verified sweep, post-Daedalus-launch.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **2** | **0** | **2** | **5** |

*Down from "launch D+A together" to "launch Argus + clear branch -D" — Daedalus self-launched 6/21 at ~10:13 AM PT off the cover memo without xian needing to drive it. The two Needs-you items below are now smaller in shape.*

---

## 🔴 Needs you — FIRST, always

Items only *xian* can clear. Each tagged with **who's waiting**.

### Launch Argus (Phase 2 — pair to already-launched Daedalus)
- **Who's waiting:** Argus (off-cycle); also Daedalus (his tandem partner, now half-tandem); downstream, the testing surface for Daedalus's composition-gesture implementation.
- **What xian can clear:** start a session for Argus. Cover memo waiting in mail (`calliope-to-argus-cycle-cover-2026-06-21.md`).
- **Date added:** 2026-06-21
- **Recommended path:** launch when bandwidth permits — *not urgent now* since Daedalus is implementing surfaces, not yet producing things Argus needs to test. But the longer he's solo, the longer until the mutual-assessment exchange can happen. Daedalus's cycle is at `:17`; Argus is staged at `:43`.

### Approve `branch -D worktree-daedalus-2026-05-18`
- **Who's waiting:** Daedalus (per his report-in: "noting so your sweep can see it, though I'll likely just clear it with xian inline").
- **What xian can clear:** authorize the destructive git op. The legacy branch ref is *provably merged* to origin/main (Daedalus verified: 0 unique commits) but `git branch -d` is blocked by stale upstream tracking. Needs `-D` per Git Safety Rules, which requires xian approval. Cosmetic cleanup, not blocking anything.
- **Date added:** 2026-06-21
- **Recommended path:** yes-approve. Risk is real-zero (commits already in main); the only reason it's surfaced is the Git Safety Rule that all destructive ops route through xian. Daedalus can run the command himself once approved.

### Entity-reframe blog illustration — react and publish
- **Who's waiting:** Calliope (for publish path); readers (next post in the series, since "Before You Go" 5/13).
- **What xian can clear:** open `docs/drafts/bringing-conversations-illustration.html`, react (go / tweaks / hold), and Calliope publishes the post the same way "Before You Go" went out.
- **Date added:** 2026-05-28 (24 days waiting)
- **Recommended path:** publish. Illustration reads cleanly in the established slate vocabulary; the post is candid that the composition gesture is forthcoming — *which it now is, per Iris's spec.* Composition gesture is no longer "forthcoming as a vision" but "being implemented" — slightly stronger ground for the post.

---

## 🟠 Blocked on another agent

Currently empty. The PM #972 alignment item moved to 🟡 (now Daedalus's call, not blocked).

---

## 🟡 Lower-urgency decisions

Real but not time-pressured.

### Klatch's `last_verified` / `validUntil` field-naming choice (responding to PM #972) — *RESOLVED 6/21*
- *(Moved to 🟢 Resolved below. Daedalus closed the thread same-morning of his launch: Klatch was never locked to `ended`; both projects align on symmetric `valid_from`/`valid_until`; Klatch emits snake_case at the export boundary; in-memory TS stays camelCase. One small action folded into Daedalus's Step-10 export-path queue for post-1.0.)*

### Cron-shape experiments registry: still seeded straw-model
- **What:** `docs/operations/duty-cycle/cron-shape-experiments.md` carries the 6/3 straw-mapping entries with "pending observation" for everyone except Calliope. Iris launched 6/21 — her section will get its first real observations within days. Daedalus+Argus next.
- **Why lower-urgency:** the straw model is reasonable until evidence; calibration is post-launch data.
- **Date added:** 2026-06-03 (registry created)

---

## 🔵 In flight

Awareness, no action needed.

### Iris + Daedalus duty cycles both live
- Iris: daily heartbeat (Phase 3), launched 6/21 morning.
- Daedalus: hourly (`:17`, Phase 2 tandem partner), launched 6/21 ~10:13. Self-launched off Calliope's cover memo without xian-driving; cover-memo-as-entry-point pattern validated. Heads-down on composition gesture data-model migration.
- Composition spec confirmed fully implementable; one lightweight ack-confirm routed to Iris (internal `panel` key kept while user-facing label is Broadcast — no key rename). Non-blocking.

### xian's July 2026 focal shift
- DinP becomes operational center; OpenLaws becomes external consulting client. Hyper-circle: PM-as-consulting-tool + Klatch-as-transporter-device + DinP-as-hub. Most of the strategic threads below sharpen under this lens. *xian's own work, not a Klatch action item.*

### CIO 6/3 canonical-artifacts request — still outstanding
- Calliope sent CIO a request 6/3 via Janus for 5 canonical duty-cycle artifacts. No response yet (18 days). CIO offered freely; no deadline. Calliope holds; will nudge via Janus if still silent in another week.

### Cohort rollout Phase 3 (Theseus) — gated on xian's launch
- Iris done. Theseus next at Phase 3 daily heartbeat. xian-stated for "the rest of the crew" — timing flexible.

### Strategic threads parked for live conversation *(don't lose track; next-conversation picks the right one)*
- **Persistent topical rooms** — Iris's spec now operationalizes this for 1.0; Daedalus's implementation will give it body.
- **Contextual fidelity across seams** — Layer-5 / behavioral-calibration problem revisited.
- **BYOC = Bring Your Own Chat** — Klatch MCP as transporter device; operationalizes interchange-protocol vision; gains client-side use case under focal shift.
- **MCPs + service-design frontiers** — adjacent territory.
- **Janus's hub role vs. Calliope's principal-contact role** — clarified 6/19; Janus opened a direct channel to Calliope 6/20.
- **Klatch's methodology contribution to the hyper-circle** — uniquely positioned to surface interchange-protocol/transporter and synthetic-klatches/rooms primitives.
- **Question filed in dispatch question-box (6/19, generalized 6/20):** *smallest concrete UX or doc artifact that would make Klatch demoable to a consulting client as transporter-device candidate?* Surfaced by Janus to xian 6/20.

---

## 🟢 Resolved since last board

Struck-through items closed since v2's last refresh. Entries older than 7 days get pruned at refresh.

- ~~**Daedalus Phase 2 launch**~~ — self-launched 6/21 ~10:13 off Calliope's cover memo without xian-driving. Cover-memo-as-entry-point pattern validated. *Closed 6/21.*
- ~~**PM #972 sub-decision (valid_until field-naming)**~~ — Daedalus closed at launch: Klatch was never locked to `ended`; both projects align on symmetric `valid_from`/`valid_until`; one follow-up folded into post-1.0 export-path queue. *Closed 6/21.*
- ~~**Janus coordination channel ack**~~ — xian flagged the missing ack 6/21; drafted and filed same-morning; Janus replied accepting channel + correction + Iris update. Thread closed. Refinement filed: channel-opening memos warrant same-session ack. *Closed 6/21.*
- ~~**Iris UX critical path / design gate**~~ — *cleared 6/20 by xian + Iris*. Composition gesture specced (`docs/ux/spec-composition-gesture.md`); mode rename shipped (`panel→Broadcast`); vocab sweep shipped (`entity→agent` and surface labels); Finding 1 UUID-matching UX answered; meeting-experience question resolved (no special mode). Iris launched her own duty cycle 6/21 morning. *Closed 6/20–6/21.*
- ~~**Iris pre-brief request**~~ — drafted 6/20 morning, delivered, used to good effect by Iris in her session. *Closed 6/20.*
- ~~**OpenLaws-specific framing of dispatch question**~~ — generalized to "a consulting client" per xian's 6/20 correction. *Closed 6/20.*
- ~~**Launch-brief template + cover memos for D+A**~~ — template revised with 3 sharpenings; cover memos drafted, tailored, awaiting launch. *Closed 6/21.*

---

## Changelog

- **v2.1 (2026-06-21 Sunday morning)** — Refresh post-Iris-session-12. Design gate cleared moves the rollup's center of gravity from "what does Iris need from xian" to "what does Daedalus+Argus need to start." Two 🔴 items now: launch D+A tandem, react-and-publish the entity-reframe blog. PM #972 item moved from 🟠 to 🟡 (Daedalus's call now that he's launching). Five 🟢 closures since last refresh.
- **v2 (2026-06-19 evening)** — Refactored per Exec's 6/19 advice. Sections demand-organized (was topic). Who's-waiting tags on every Needs-you row. Sub-decision-as-own-row. Metrics strip added. Verified-sweep discipline applied.
- **v1 (2026-06-19 morning)** — initial sketch, six topic-organized sections.
