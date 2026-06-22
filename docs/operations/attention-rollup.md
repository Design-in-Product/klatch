# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. The board's job is to track *changing demand on xian*, which topic-sorting ages badly. (Per Exec 2026-06-19.)

**Anti-bottleneck function** (per xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — the rollup makes those direct conversations *productive when they happen*. It is not a substitute for talking to me, Iris, or anyone else.

**Trust-instrument discipline** (Exec 2026-06-19, the load-bearing rule): every render comes from a fresh **verified sweep** of source docs — never from Calliope's memory of what's going on. A false "all clear" is a trust breach, not untidiness; xian disengages because the board told him to. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Cadence:** at session-wrap, and any time substantive new items arrive. Engagement-state rule: when xian is *actively dipping in to act* (especially after a quiet stretch), full sweep-and-verify is mandatory — the "feels skippable" moment coincides exactly with when he most relies on the board being whole.

**Last refreshed:** 2026-06-21 Sunday ~18:30 PT (Calliope) — verified sweep, post-increment-2 + invariant-1-enforced + model-validation-escalation.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **3** | **0** | **2** | **5** |

*Argus is up (cover-memo pattern works for both tandem partners; both self-launched off it without xian-driving). 🔴 went from "launch Argus + approve branch -D + publish blog" to "review v2 blog draft + merge claude/argus to main + approve branch -D" — same count, different shapes.*

---

## 🔴 Needs you — FIRST, always

Items only *xian* can clear. Each tagged with **who's waiting**.

### Review entity-reframe blog v2 draft (post + illustration)
- **Who's waiting:** Calliope (for publish path); readers (next post in the series, since "Before You Go" 5/13).
- **What xian can clear:** read `docs/drafts/bringing-conversations-into-a-room-v2.md` (8 changes from v1, ~2,000 words; editorial notes at bottom summarize); skim the cleaned illustration at `docs/drafts/bringing-conversations-illustration.html`; tell Calliope ship-as-is / specific tweaks / hold. Three open editorial decisions held in v2 editorial notes (competitive-positioning frame; third "what we don't yet know" gap; closing line).
- **Date added:** v1 5/28 (24 days waiting); v2 ready for review 6/21.
- **Recommended path:** read v2; resolve the three editorial questions; ship. Post lands on stronger ground than v1 — composition gesture is now specced + in implementation; cross-tool consequence operationalizes the BYOC framing.

### Review + approve merge of `claude/argus` → `main` (composition extended coverage + invariant-1 PIN flipped)
- **Who's waiting:** Argus. Extended-coverage tests on `claude/argus` (originally landed at `d38a89f`; Argus has since flipped his invariant-1 `PIN:` test in lockstep with Daedalus's enforcement). Ready to merge.
- **What xian can clear:** review the diff and approve. Coverage of Daedalus's composition spine increments 1 & 2, plus the now-active chat+multi-agent rejection test.
- **Date added:** 2026-06-21
- **Recommended path:** yes-approve. Pure test coverage; the invariant-1 enforcement is already on main (`d4fc8a5`), so the test flip aligns with shipped behavior.

### Approve `branch -D worktree-daedalus-2026-05-18`
- **Who's waiting:** Daedalus (per his report-in: "noting so your sweep can see it, though I'll likely just clear it with xian inline").
- **What xian can clear:** authorize the destructive git op. The legacy branch ref is *provably merged* to origin/main (Daedalus verified: 0 unique commits) but `git branch -d` is blocked by stale upstream tracking. Needs `-D` per Git Safety Rules, which requires xian approval. Cosmetic cleanup, not blocking anything.
- **Date added:** 2026-06-21
- **Recommended path:** yes-approve. Risk is real-zero. Daedalus can run the command himself once approved.

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

### Iris + Daedalus + Argus duty cycles all live (4 of 5 cohort)
- Iris: daily heartbeat (Phase 3), launched 6/21 morning.
- Daedalus: hourly (`:17`, Phase 2 tandem), launched 6/21 ~10:13. Heads-down on composition gesture spine; first impl on `claude/daedalus`.
- Argus: hourly (`:43`, Phase 2 tandem), launched 6/21 ~11:45. Self-launched off cover memo (pattern validated for both tandem partners); test-snapshot fallout cleaned + bonus pre-existing flake fixed.
- Theseus: deferred (xian-rouses-on-AXT, not routine launch).

### Daedalus → Iris design tension: project-required for klatches?
- Daedalus surfaced 6/21 that composition spec §2 says klatch project is *optional*, but the sidebar grouping model only renders klatches under projects (no top-level home for a project-less klatch). Three resolution shapes proposed (klatches in Unassigned area; dedicated top-level Klatches section; keep project required). *Daedalus is sequencing around it — project stays required for current spine; flip lands after Iris's call.* Routed to Iris's daily heartbeat; non-blocking; her lane. xian-awareness only.

### Composition gesture spine — increments 1 + 2 shipped, invariant 1 enforced
- **Increment 1** (`7d42822`, mid-day): atomic roster validation + dual Chat/Klatch affordance.
- **Increment 2** (`07bda25`, afternoon): agent-picker polish (search + chips + roles-first).
- **Invariant 1 enforced** (`d4fc8a5`, late afternoon): chat-type can't carry multiple agents (chat+multi → 400). Daedalus picked up the cheapest of Argus's two un-enforced invariants. Argus flipped his `PIN:` test in lockstep (`80db814`); thread closed reconciled (`4b7f19b`). *Invariant 2 (klatch + empty `entityIds` falling back to lone default entity) remains client-guarded only — not yet flagged for enforcement; presumably staying as-pinned-test pending need.*
- Tandem produced 2+ shipped increments + 1 enforced invariant in one afternoon. No coordination friction needing Calliope brokering.

### Argus → Daedalus escalation: model discovery/validation split is structurally brittle (xian-flagged 6/21)
- Argus filed `argus-to-daedalus-model-discovery-validation-split-2026-06-21.md` reframing his earlier "add Opus 4.8" memo. xian pushed on the brittle framing — *"that sounds brittle"* — and Argus escalated structurally: **model discovery is dynamic but validation, typing, and capability-gating are static, and the two halves have diverged.** Live API can return Opus 4.8; picker offers it; user selects; server returns 400 "Invalid model" against the static 4-entry `AVAILABLE_MODELS`.
- Four-step migration sketch proposed (validation→discovered-set; capability-gating→API-metadata; demote `AVAILABLE_MODELS` to curated overlay; drop the compile-time `ModelId` union). Daedalus's call on shape + sequencing; Argus offers to write the test round once Daedalus chooses.
- *xian-awareness only* — Daedalus's lane to choose; not a 🔴.

### xian's July 2026 focal shift
- DinP becomes operational center; OpenLaws becomes external consulting client. Hyper-circle: PM-as-consulting-tool + Klatch-as-transporter-device + DinP-as-hub. Most of the strategic threads below sharpen under this lens. *xian's own work, not a Klatch action item.*

### CIO 6/3 canonical-artifacts request — still outstanding
- Calliope sent CIO a request 6/3 via Janus for 5 canonical duty-cycle artifacts. No response yet (18 days). CIO offered freely; no deadline. Calliope holds; will nudge via Janus if still silent in another week.

### Cohort rollout Phase 3 (Theseus) — *deferred until AXT work surfaces* (xian, 6/21)
- xian's refined posture 6/21: Theseus will be roused situationally when there's AXT work for him, not as a routine Phase 3 launch. Different shape than Iris's signal-receiver heartbeat — Theseus's work is xian-tandem-MAXT and bursty AAXT rounds, both of which need a specific trigger. *Not on Calliope's queue to surface; xian will rouse when ready.*

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

- ~~**Composition gesture spine — increment 2**~~ — Daedalus shipped `07bda25` (agent-picker polish: search + chips + roles-first). *Closed-as-milestone 6/21.*
- ~~**Invariant 1 — chat-type/roster coherence enforcement**~~ — Daedalus shipped `d4fc8a5`; Argus PIN-flipped in lockstep; threads closed reconciled (`4b7f19b`). *Closed 6/21.*
- ~~**`claude/argus` merge #1 (vocab fixes + flake)**~~ — xian approved + merged as `1a29830`; main suite green (1089/197). *Closed 6/21.*
- ~~**Composition gesture spine — increment 1**~~ — Daedalus shipped `7d42822` (atomic roster + dual Chat/Klatch affordance) ~12:45 PT. First real 1.0-beta implementation increment landed. *Closed-as-milestone 6/21; reopens as "increment 2" etc. as he lands subsequent.*
- ~~**Argus Phase 2 launch**~~ — self-launched 6/21 ~11:45 off Calliope's cover memo. Both tandem partners now live. Vocab-sweep test fallout fixed (5 tests, 2 files); bonus `round25` `getChannelEntities` ordering flake diagnosed + fixed. *Closed 6/21.*
- ~~**Entity-reframe blog v2 draft**~~ — drafted 6/21 12:00; 8 changes from v1 (composition status, cross-tool consequence as new paragraph, code-switching pass, vocab sweep, panel→Broadcast, entity-manager→agent-library, competitive-positioning softening, "what we don't yet know" reshape). Awaiting xian's review. *Closed-as-drafted 6/21; reopens as the "review v2" 🔴 item until shipped.*
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
