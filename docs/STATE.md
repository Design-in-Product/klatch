# Klatch — Standing State

**Refresh cadence:** updated as part of the end-of-day logbook wrap (alongside the logbook entry). This is a point-in-time orientation snapshot, not live state — verify against COORDINATION.md, the roadmap, and recent commits before acting on anything time-sensitive.
**Last refreshed:** 2026-06-22 Monday morning (Calliope, BYOC-correction propagation cleanup)

---

## One-line status

Klatch is now **implementation-active toward 1.0-beta**: the design gate cleared 6/20 (Iris session 12 — composition gesture spec landed, mode + vocab sweep shipped, Finding 1 UX answered). Daedalus + Argus launch as Phase 2 tandem cycle next (xian-stated today, 6/21). The path to beta is now execution, not specification.

## What's shipped

- **Step 10 (Export + context protocol)** — canonical package format, both transports (Claude Code + claude.ai), the MCP server (5a read-only resources, 5b tools, 5c-i write-path/reflect), Phase 3.5 behavioral calibration (dual-mode briefing + extraction). 1.0-feature-complete on the protocol side.
- **MCP server** — the Step 10 capstone; feature-complete for 1.0.
- **Tests:** ~1,487 (1,287 server + 200 client) as of 2026-05-18, zero failures.
- **UI patch coverage** — Round 33/33b closed (Argus); Tier 1 patches from Iris's triage shipped (Daedalus).

## The 1.0-beta critical path — DESIGN GATE CLEARED 2026-06-20

Iris's session 12 with xian (6/20) cleared the gate. Iris's design brief (`docs/ux/design-brief.md`) framed the path; her composition spec (`docs/ux/spec-composition-gesture.md`) is the 1.0 implementation brief Daedalus reads first.

Status of the five components:
1. **Composition gesture** — *specced 6/20 by Iris.* Awaiting Daedalus implementation.
2. **Klatch setup surface** — *specced 6/20 by Iris* (Name / Agents / Purpose / Mode / Project / Files + clone-existing; three-path agent picker). Awaiting Daedalus implementation.
3. **Working-meeting experience** — *resolved 6/20 by xian + Iris*: a meeting is a synthetic group chat; no special mode, no extra chrome, no session-close gesture. Orchestration modes are the only differentiation; synthesis is emergent (via @mention to a CoS-style agent). Question 4 of Iris's 5/12 brief.
5. **Promotion gesture** — *resolved 6/20*: naming an agent IS the promotion (Q V5 in vocab sweep). "Promote" is internal vocabulary only.
- **Vocabulary sweep shipped 6/20** — `entity → agent`, `panel → Broadcast`, Chat/Klatch Settings, Purpose, context-aware export and delete labels, "Agent name" placeholder, "In N conversation(s)".
- **Tier 1 patches** — most landed pre-gap; remainder folds into Daedalus's queue alongside the composition gesture implementation.
- **Daedalus Finding 1 (UUID matching UX)** — *answered 6/20*: project match silent attach + toast; channel UI inline prompt; channel MCP 409 with reason.

Implementation is now the work, owned by Daedalus in tandem with Argus.

## In flight / recent

- **UI-as-context AAXT** (Theseus, May 18) — 5-round wave, diagnostic→fix→validate loop proven: ChannelSettings 54% → 94% conveyance after patches. 146 probes, 11 findings. Methodology validated empirically. Open candidates: ProjectSettings, EntityManager, MessageList (Theseus green-lit to pursue in parallel, 2026-05-28). *Theseus not yet on cycle — Phase 3 launch pending.*
- **Duty cycle rollout in progress.**
  - **Phase 1 — Calliope:** live since 6/6 (persistent worktree + cron when in-session). Session resumed 6/19.
  - **Phase 3 — Iris:** *launched 6/21 morning* (her own session log opened 7:33, COORDINATION updated). First non-Calliope cycle to start; daily heartbeat. Confirms the cohort pattern works without ceremony.
  - **Phase 2 — Daedalus + Argus tandem:** **next launch up.** Launch-brief template revised 6/21 (3 sharpenings: re-arm-by-default elevated to standing-directive framing; new attention-rollup section; canonical drain-prompt source pinned). Cover memos for each drafted (`calliope-to-daedalus-cycle-cover-2026-06-21.md`, `calliope-to-argus-cycle-cover-2026-06-21.md`). Cron stagger: Calliope `:13`, Daedalus `:17`, Argus `:43`. Awaiting xian's launch.
  - **Phase 3 — Theseus:** still pending.
- **Entity-reframe blog ("Bringing Conversations Into a Room")** — illustration drafted (`docs/drafts/bringing-conversations-illustration.html`); xian agreed to publish; **awaiting his illustration reaction (since 5/28), then publish** (HTML + index card + OG image, same as Before You Go). Publish gated on xian approval. Only drafted-not-published post in the queue.
- **Attention rollup live** — `docs/operations/attention-rollup.md` (canonical) + `.html` (Desktop preview). v2 demand-organized (Exec advised 6/19). Verified-sweep discipline (read source docs against live truth, never from memory). Refreshed at session-wrap and on substantive new items.

## Standing decisions / items waiting on xian

- **Entity-reframe blog draft** ("Bringing Conversations Into a Room") — `docs/drafts/bringing-conversations-into-a-room.md` — pending xian editorial read. Note: describes the composition gesture as forthcoming.
- **D1–D5 from Argus's dreaming spike** — **DECIDED by xian 2026-05-28** (`docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`):
  - D1 — memory-store import posture → **wait, but be ready.** Klatch may always be a superset, but whenever we can round-trip into another system with fidelity we should; the proprietary layer should be as thin as possible.
  - D2 — memory-store export transport → **cluster with Phase 5d** (confirmed), but flagged as a growing-importance issue tied to the interchange-protocol vision (see Strategic threads).
  - D3 — activate `memory_format: "typed"` → **fold into Step 11** (confirmed).
  - D4 — Step 11 differentiation positioning → **assembly layer, not memory primitive** (confirmed); ongoing strategic conversation between xian + Calliope.
  - D5 — cross-read with Piper Alpha → **yes**; note a latent "type 2" (anxiety-dream) design in PM's roadmap that nobody else has touched yet.

## Strategic threads (ongoing xian + Calliope conversation, opened 2026-05-28; expanding 2026-06-19)

These are live, not settled. See memory `project_duty_cycle_reframes_klatch_purpose.md`.

- **The duty cycle reframes what Klatch is uniquely for.** The cross-project duty cycle now solves some of Klatch's founding problems (mail delivery, agent collaboration) — but NOT group conversation (synthetic klatches/roundtable) NOR the emerging interchange-protocol vision. Klatch's unique, defensible value is narrowing to those two things. Invest where Klatch is uniquely needed, not where the duty cycle already delivers.
- **Thin proprietary layer.** Maximize fidelity round-trips into other systems; minimize lock-in surface. Superset-but-interoperable.
- **Klatch as interchange protocol** is where the strategic weight is shifting (D2/D4 territory).
- **Finding 1 UX shape** — UUID-matching on re-import (silent attach / toast / dialog / refuse) — Daedalus parked on Iris's call.
- **Step 11 scoping** (`docs/plans/STEP-11-SCOPING.md`) — assembly-layer reframe, waiting on the D1–D5 decisions.
- **New 6/19 threads, not yet discussed:**
  - **Persistent topical rooms** as a Klatch product category (the synthetic-klatch insight made operational — composition gesture grown up)
  - **Contextual fidelity across seams** — Layer 5 / behavioral-calibration problem revisited as a recurring concern
  - **BYOC is PM's vocabulary, not Klatch's.** (xian corrected 6/22 — see persistent memory `[[project_byoc_transporter_device]]` for the correction record.) For PM: BYOC means the assistant exposed as skills + an MCP server connected to PM's backend; the user "brings their own chat" by using PM's capabilities through whatever chat host they're in. **For Klatch: xian "not even quite sure what it would mean."** The cross-tool context-portability concept that was previously mis-labeled here as "Klatch BYOC / transporter device" remains *exploratory* — it connects to real prior artifacts (D2/D4 interchange-protocol vision; Step 10's MCP context-package; the thin-proprietary-layer principle) but does not have a settled Klatch label or definition. Don't carry an unlabeled placeholder either; treat as open territory.
  - **MCPs and service-design frontiers** — adjacent strategic territory
  - **xian's focal shift, July 2026** (xian, 6/19): full-time on consulting + own products; no longer Director of Product at Kind Systems. **DinP becomes the operational center.** OpenLaws becomes an external consulting client. Piper Morgan is the consulting tool used to help clients build their own "product OS." Virtuous hyper-circle: methodology flows across projects + clients. **For Klatch:** multi-week pauses during planning mode may become rarer; Klatch joins xian's core work rather than competing with a day job for attention. (Earlier framing here connected the focal shift to "the interchange-protocol vision (BYOC / transporter device) gains real client-side use cases" — that BYOC framing was retracted 6/22; see strategic-threads above. The client-side-legibility question for Klatch remains real but isn't yet anchored in a settled concept name.)
  - **Janus's role vs. Calliope's role** — Janus coordinates across all xian's projects; Calliope is principal contact for Klatch. Worth articulating cleanly as cohort scales.

## Convergent pattern worth surfacing back

- **PM's "derive-don't-maintain" principle (ADR-072)** showed up across PM surfaces during 6/6→6/19 gap, solving a standup-fabrication root-cause (three-list divergence). Same shape as Klatch v0.2 agent-state tracker's "graduate to derivation" aspiration. Cross-project convergence pattern continues (after DECISIONS.md, the failure-mode taxonomy, the canonical-format work, the duty cycle itself).

## Candidate next development drivers (xian's allocation, 2026-05-28)

1. **1.0-beta UX critical path** (Iris + xian) — **the priority.** Spec composition gesture + klatch setup surface.
2. **More UI-as-context AAXT** (Theseus, in parallel — AAXT is agent-driven, doesn't need xian's live attention).
3. **MAXT Session 02** (needs xian's attention — time carefully, can't run in parallel).
4. **Blog series continuation** (Calliope, in parallel when not supporting higher priorities): entity reframe → convergent infrastructure → MCP capstone, anchored to 1.0 beta. Possible future beat: the 54%→94% AAXT diagnostic-loop story.

## Agent status (refreshed 6/21 from agent-state.md + COORDINATION.md + Iris's session-12 readout)

- **Calliope** — live duty-cycle when in-session; persistent worktree `claude/calliope`; cron `065fb872`→paused for current substantive work. Coordination + chronicling + blog series + STATE/logbook upkeep + attention-rollup. Principal point of contact for Klatch.
- **Daedalus** — Phase 2 launch imminent. Cover memo waiting in mail. Finding 1 UUID-matching UX now answered by Iris (6/20); ready to implement. Composition gesture spec is his main work assignment. PM CIO #972 alignment proposal in his inbox.
- **Argus** — Phase 2 launch imminent (tandem with Daedalus). Cover memo waiting in mail. First job: test-snapshot fallout from yesterday's vocab + mode rename. Weekly intel sweep overdue.
- **Theseus** — Phase 3 still pending xian's launch. UI-as-context AAXT continuation candidates queued.
- **Iris** — *live duty cycle as of 6/21 morning* (daily heartbeat, signal-receiver model). Phase 3 launched. UX critical-path design gate cleared 6/20. Composition spec shipped to `docs/ux/`. Available for any clarifications Daedalus + Argus surface during implementation.

## Cross-project context (refreshed 6/19)

- **Duty cycle** — PM full cohort live; OpenLaws piloting; Klatch v0.2 substrate landed 6/6 with Calliope on cycle (Phase 1 only). Phases 2+3 gated. CIO's canonical-artifacts request still outstanding via Janus (6/3 memo).
- **BYOC / PDR-005 alignment** — closed (Daedalus's reciprocal cycle with PM Architect relayed via Janus 5/18).
- **Billing split (June 15)** — *now in effect.* Klatch unaffected ($0/mo current impact); forward risk only at Step 10 export-to-Claude-Code Agent SDK surface when implemented.
- **PM #972 memory-temporal-field alignment** (6/15) — CIO proposed `valid_from`/`valid_until` as shared schema; awaits Daedalus's next session. Compatibility nicety, not blocking either side.
- **PM 6/8–6/11 BYOC / BYO-key / BYO-substrate arc** — credential chain landed; PA migration finished; ecosystem context (IPO S-1) noted.
- **PM 6/18 left-rail nav debacle + spec-first response** — PM published nav, xian rejected ("no global nav, doesn't resemble the mock"); PM chose spec-first not revert. Adjacent: standup-fabrication root-cause = three-list divergence; fix derives from one canonical source per ADR-072. Convergent with Klatch's v0.2 agent-state-tracker aspiration.
