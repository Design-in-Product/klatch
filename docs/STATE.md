# Klatch — Standing State

**Refresh cadence:** updated as part of the end-of-day logbook wrap (alongside the logbook entry). This is a point-in-time orientation snapshot, not live state — verify against COORDINATION.md, the roadmap, and recent commits before acting on anything time-sensitive.
**Last refreshed:** 2026-05-28 (Calliope)

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

- **UI-as-context AAXT** (Theseus, May 18) — 5-round wave, diagnostic→fix→validate loop proven: ChannelSettings 54% → 94% conveyance after patches. 146 probes, 11 findings. Methodology validated empirically. Open candidates: ProjectSettings, EntityManager, MessageList.
- **Duty cycle v0.1** (Calliope, May 28) — design doc filed (`docs/operations/duty-cycle-klatch-v0.1.md`); Calliope pilot pending xian's go to register the timer.

## Standing decisions / items waiting on xian

- **Entity-reframe blog draft** ("Bringing Conversations Into a Room") — `docs/drafts/bringing-conversations-into-a-room.md` — pending xian editorial read. Note: describes the composition gesture as forthcoming.
- **D1–D5 from Argus's dreaming spike** — **DECIDED by xian 2026-05-28** (`docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`):
  - D1 — memory-store import posture → **wait, but be ready.** Klatch may always be a superset, but whenever we can round-trip into another system with fidelity we should; the proprietary layer should be as thin as possible.
  - D2 — memory-store export transport → **cluster with Phase 5d** (confirmed), but flagged as a growing-importance issue tied to the interchange-protocol vision (see Strategic threads).
  - D3 — activate `memory_format: "typed"` → **fold into Step 11** (confirmed).
  - D4 — Step 11 differentiation positioning → **assembly layer, not memory primitive** (confirmed); ongoing strategic conversation between xian + Calliope.
  - D5 — cross-read with Piper Alpha → **yes**; note a latent "type 2" (anxiety-dream) design in PM's roadmap that nobody else has touched yet.

## Strategic threads (ongoing xian + Calliope conversation, opened 2026-05-28)

These are live, not settled. See memory `project_duty_cycle_reframes_klatch_purpose.md`.

- **The duty cycle reframes what Klatch is uniquely for.** The cross-project duty cycle now solves some of Klatch's founding problems (mail delivery, agent collaboration) — but NOT group conversation (synthetic klatches/roundtable) NOR the emerging interchange-protocol vision. Klatch's unique, defensible value is narrowing to those two things. Invest where Klatch is uniquely needed, not where the duty cycle already delivers.
- **Thin proprietary layer.** Maximize fidelity round-trips into other systems; minimize lock-in surface. Superset-but-interoperable.
- **Klatch as interchange protocol** is where the strategic weight is shifting (D2/D4 territory).
- **Finding 1 UX shape** — UUID-matching on re-import (silent attach / toast / dialog / refuse) — Daedalus parked on Iris's call.
- **Step 11 scoping** (`docs/plans/STEP-11-SCOPING.md`) — assembly-layer reframe, waiting on the D1–D5 decisions.

## Candidate next development drivers (xian's allocation, 2026-05-28)

1. **1.0-beta UX critical path** (Iris + xian) — **the priority.** Spec composition gesture + klatch setup surface.
2. **More UI-as-context AAXT** (Theseus, in parallel — AAXT is agent-driven, doesn't need xian's live attention).
3. **MAXT Session 02** (needs xian's attention — time carefully, can't run in parallel).
4. **Blog series continuation** (Calliope, in parallel when not supporting higher priorities): entity reframe → convergent infrastructure → MCP capstone, anchored to 1.0 beta. Possible future beat: the 54%→94% AAXT diagnostic-loop story.

## Agent status (from COORDINATION.md, May 18)

- **Daedalus** — available; awaiting Iris's Finding 1 UX call, otherwise testing-driven findings.
- **Argus** — available; Round 33/33b closed; intel-sweep cadence; Step 11 deferred to post-landmark.
- **Theseus** — UI-as-context AAXT wave complete; awaiting xian direction on next surfaces vs. MAXT.
- **Iris** — UX linchpin; next is to spec the composition gesture + klatch setup surface concretely; 4 open design-brief questions.
- **Calliope** — coordination + chronicling; duty-cycle pilot pending go; blog series + STATE/logbook upkeep.

## Cross-project context

- **Duty cycle** — PM piloted (9-of-11 cohort), OpenLaws piloting, Klatch adopting (v0.1, Calliope pilot). Session-bound/local for now; cloud routines a v0.2+ option.
- **BYOC / PDR-005 alignment** — Daedalus's reciprocal cycle with PM Architect relayed via Janus (May 18); one cycle, retain-authority, selective alignment. Closed unless Architect surfaces a follow-up.
- **Billing split (June 15)** — Klatch unaffected ($0/mo current impact); forward risk only at the Step 10 export-to-Claude-Code Agent SDK surface when implemented (`docs/research/anthropic-billing-split-klatch-impact-2026-05-18.md`).
