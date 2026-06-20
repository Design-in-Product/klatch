# Klatch — Standing State

**Refresh cadence:** updated as part of the end-of-day logbook wrap (alongside the logbook entry). This is a point-in-time orientation snapshot, not live state — verify against COORDINATION.md, the roadmap, and recent commits before acting on anything time-sensitive.
**Last refreshed:** 2026-06-19 evening (Calliope, session-resume after 13-day gap)

---

## One-line status

Klatch is in a **UX-gated pre-1.0-beta state**: the backend/protocol work (Step 10) is shipped and feature-complete; the product needs its central gesture — composing a klatch from existing conversations — before it's beta-worthy.

## What's shipped

- **Step 10 (Export + context protocol)** — canonical package format, both transports (Claude Code + claude.ai), the MCP server (5a read-only resources, 5b tools, 5c-i write-path/reflect), Phase 3.5 behavioral calibration (dual-mode briefing + extraction). 1.0-feature-complete on the protocol side.
- **MCP server** — the Step 10 capstone; feature-complete for 1.0.
- **Tests:** ~1,487 (1,287 server + 200 client) as of 2026-05-18, zero failures.
- **UI patch coverage** — Round 33/33b closed (Argus); Tier 1 patches from Iris's triage shipped (Daedalus).

## The 1.0-beta critical path (the gate)

Per Iris's design brief (`docs/ux/design-brief.md`), beta-readiness needs:
1. **Composition gesture** — select existing conversations to bring into a klatch (the thing the entity reframe named; the central missing act)
2. **Klatch setup surface**
3. **Remaining Tier 1 patches**
4. **Working-meeting experience** (what "running a meeting" looks like inside a klatch)
5. **Promotion gesture** (conversation → role)

This is UX work, owned by Iris in tandem with xian. It is the linchpin to beta launch.

## In flight / recent

- **UI-as-context AAXT** (Theseus, May 18) — 5-round wave, diagnostic→fix→validate loop proven: ChannelSettings 54% → 94% conveyance after patches. 146 probes, 11 findings. Methodology validated empirically. Open candidates: ProjectSettings, EntityManager, MessageList (Theseus green-lit to pursue in parallel, 2026-05-28).
- **Duty cycle — v0.2 substrate live; Calliope Phase 1 cutover landed 6/6; not currently running.** v0.2 design doc `docs/operations/duty-cycle-klatch-v0.2.md` + experiments registry + launch-brief template + agent-state tracker all on main. Calliope on persistent worktree `.claude/worktrees/calliope` / branch `claude/calliope`. **Straw model (xian-approved 6/3):** Calliope hourly continuous-mail · Daedalus+Argus hourly tandem continuous · Theseus+Iris daily heartbeat as signal-receivers. Cron is session-only; cron from 6/6 died at session end (designed behavior); resumes on `CronCreate` whenever Calliope's session restarts. **Phase 2 (D+A together) and Phase 3 (T+I) gated on xian's agent-launch bandwidth — neither launched yet; the 13-day xian-attention gap (6/6→6/19) is exactly the cadence the cycle was built to span, and it didn't, because Phases 2+3 hadn't run.**
- **Entity-reframe blog ("Bringing Conversations Into a Room")** — illustration drafted (`docs/drafts/bringing-conversations-illustration.html`); xian agreed to publish; **awaiting his illustration reaction (since 5/28), then publish** (HTML + index card + OG image, same as Before You Go). Publish gated on xian approval. Only drafted-not-published post in the queue.

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
  - **BYOC — Bring Your Own Chat.** (xian corrected 6/19: prior session's "being your own chat" was an autocorrect typo.) For PM: BYOC means the product assistant exposed as a set of skills + an MCP server connected to PM's backend. **For Klatch: a person using a Klatch MCP as a "transporter device" to migrate relevant context to a new tool.** The interchange-protocol thread (D2/D4) sharpened — Klatch as the substrate that lets a user carry their context across tools.
  - **MCPs and service-design frontiers** — adjacent strategic territory
  - **A shift in xian's focal center of gravity** that may open more space for Klatch (xian-flagged, details TBD in the 6/19+ discussion)
  - **Janus's role vs. Calliope's role** — Janus coordinates across all xian's projects; Calliope is principal contact for Klatch. Worth articulating cleanly as cohort scales.

## Convergent pattern worth surfacing back

- **PM's "derive-don't-maintain" principle (ADR-072)** showed up across PM surfaces during 6/6→6/19 gap, solving a standup-fabrication root-cause (three-list divergence). Same shape as Klatch v0.2 agent-state tracker's "graduate to derivation" aspiration. Cross-project convergence pattern continues (after DECISIONS.md, the failure-mode taxonomy, the canonical-format work, the duty cycle itself).

## Candidate next development drivers (xian's allocation, 2026-05-28)

1. **1.0-beta UX critical path** (Iris + xian) — **the priority.** Spec composition gesture + klatch setup surface.
2. **More UI-as-context AAXT** (Theseus, in parallel — AAXT is agent-driven, doesn't need xian's live attention).
3. **MAXT Session 02** (needs xian's attention — time carefully, can't run in parallel).
4. **Blog series continuation** (Calliope, in parallel when not supporting higher priorities): entity reframe → convergent infrastructure → MCP capstone, anchored to 1.0 beta. Possible future beat: the 54%→94% AAXT diagnostic-loop story.

## Agent status (current per agent-state.md + COORDINATION.md, refreshed 6/19)

- **Calliope** — live duty-cycle (when in-session); persistent worktree `claude/calliope`. Coordination + chronicling + blog series + STATE/logbook upkeep. Principal point of contact.
- **Daedalus** — off-cycle; Phase 2 pending xian's launch. Status (5/18): available; awaiting Iris's Finding 1 UX call. 6/15 inbound from PM CIO on #972 memory-temporal-field alignment awaits his next session.
- **Argus** — off-cycle; Phase 2 pending xian's launch. Status (5/18): available; Round 33/33b closed; weekly intel-sweep cadence will live in his Recurring-items section when launched.
- **Theseus** — off-cycle; Phase 3 pending xian's launch. UI-as-context AAXT wave (5/18 — 54%→94% diagnostic-loop) complete; awaiting xian direction on next surfaces vs. MAXT.
- **Iris** — off-cycle; Phase 3 pending xian's launch. UX linchpin for 1.0-beta. Next is composition gesture + klatch setup surface spec; 4 open design-brief questions. **Iris unblock-for-beta is xian's stated 6/19 #3 priority** (coordinate with Calliope first).

## Cross-project context (refreshed 6/19)

- **Duty cycle** — PM full cohort live; OpenLaws piloting; Klatch v0.2 substrate landed 6/6 with Calliope on cycle (Phase 1 only). Phases 2+3 gated. CIO's canonical-artifacts request still outstanding via Janus (6/3 memo).
- **BYOC / PDR-005 alignment** — closed (Daedalus's reciprocal cycle with PM Architect relayed via Janus 5/18).
- **Billing split (June 15)** — *now in effect.* Klatch unaffected ($0/mo current impact); forward risk only at Step 10 export-to-Claude-Code Agent SDK surface when implemented.
- **PM #972 memory-temporal-field alignment** (6/15) — CIO proposed `valid_from`/`valid_until` as shared schema; awaits Daedalus's next session. Compatibility nicety, not blocking either side.
- **PM 6/8–6/11 BYOC / BYO-key / BYO-substrate arc** — credential chain landed; PA migration finished; ecosystem context (IPO S-1) noted.
- **PM 6/18 left-rail nav debacle + spec-first response** — PM published nav, xian rejected ("no global nav, doesn't resemble the mock"); PM chose spec-first not revert. Adjacent: standup-fabrication root-cause = three-list divergence; fix derives from one canonical source per ADR-072. Convergent with Klatch's v0.2 agent-state-tracker aspiration.
