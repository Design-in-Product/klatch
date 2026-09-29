# Klatch — Standing State

**Refresh cadence:** updated as part of the end-of-day logbook wrap (alongside the logbook entry). This is a point-in-time orientation snapshot, not live state — verify against `COORDINATION.md`, `ROADMAP.md`, `operations/attention-rollup.md`, and recent commits before acting on anything time-sensitive.
**Last refreshed:** 2026-09-29 (Calliope, live session with xian — the two-medium state-of-Klatch experiment; see `operations/state-of-klatch-mail-track-synthesis-2026-09-28.md` and `operations/fork-identity-finding-2026-09-29.md`).

**On the gap:** this file went stale for three months, not because the project paused but because nobody carried the standing-state snapshot forward while the daily record (`logs/`) kept running underneath it. Everything below is rebuilt from verified sources this session, not incrementally patched from the June version — treat anything not restated here from the prior version as unconfirmed.

---

## One-line status

Klatch's core product (Steps 1–9) is built and shipped as of v0.9.0. The 1.0-beta gate — an agent can join a klatch while remaining continuous with its own conversation, and the six-agent weekly-review canonical use case runs end to end — moved from **half met** to **run at small scale, not yet at full scale**: a real three-participant klatch (xian, Calliope, Iris) ran for the first time on 2026-09-29, deliberately smaller than the six-agent weekly-review shape, found real bugs (some fixed same-night), and surfaced a genuinely new question about fork identity nobody had anticipated. The full multi-agent shape is next, gated on working through what tonight found first.

## What's shipped (verified against `ROADMAP.md`'s "Completed" section this session)

- **Steps 1–9**, released as v0.9.0 (2026-04-10): persistent multi-channel conversation, multi-entity channels (up to 5 entities, panel/roundtable/directed modes), import from Claude Code and claude.ai with fork-don't-sync continuity, and a full file/artifact domain model with scope-aware context injection (project knowledge base, channel pinning, message attachment).
- **Composition gesture mechanics**: an import can mint and confirm a real entity rather than seat the default one (Rounds 171–174), with a same-name disclosure and reassign picker in the client.
- **Entity backfill tool**: built and dry-run-verified against xian's real March corpus (Rounds 199–205, 9-of-9 precision on the corrected role-basis guesser) — **never applied to real data.** Per-channel approval is explicitly xian's call, still open.

## The beta gate — half met, this is the actual critical path

From `ROADMAP.md`'s own status note (2026-09-09, unchanged since, re-verified this session):

- **Clause 1 — an agent can join a klatch continuous with its own conversation:** demonstrated live at small scale (three participants) on 2026-09-29, not just the single-seat Round 172 case. Both imported agents (Calliope, Iris) correctly carried their prior context in; the room itself has real, found bugs (see below), none of which broke continuity's core claim.
- **Clause 2 — the weekly-review use case runs end to end:** **still not run at the full six-agent scale.** Tonight's three-participant test was the deliberate first rung, not the gate itself — see `operations/state-of-klatch-next-steps-2026-09-29.md` for the plan to close the remaining gap.

**What tonight actually found, in brief (full detail in the two docs linked above):** two real client bugs, found and fixed same-night (`c42b4d3e`); a render-hang and a two-turns-merged-per-block rendering bug, both still open; several drift findings (CLAUDE.md omitting Iris, a memory-path assumption bug now on the attention rollup); and — the most significant single finding — that a Klatch import **forks** a session rather than mirroring it, meaning two agents descended from one prior conversation cannot verify each other's subsequent actions from the inside. This isn't a bug; it's a real, previously-undocumented property of the system, and it produced a genuine, carefully-examined reaction in both in-room agents worth reading in full rather than summarizing further here.

**Honest read on recent effort allocation (verified 2026-09-24, still the right read):** the month-plus of research-track work before tonight was almost entirely test-harness hardening — finding and fixing bugs in the probes and instruments that verify the product, not new product surface. Defensible given the July composition-drift incident (see `PREMISE.md`), and tonight is the first evidence since then that the underlying machinery, once actually run, works at the scale it was tested.

## Duty cycle — fully rolled out, all five seats (this section was badly stale; corrected in full)

The May/June "Phase 1/2/3 rollout in progress" framing below is obsolete. As of this refresh: **all five seats (Daedalus, Argus, Theseus, Iris, Calliope) run scheduled, non-interactive `launchd`-driven fires**, independent of any interactive chat session. Mechanism, schedule, and the tradeoffs of this approach vs. a continuous-session model (which xian is actively weighing, not deciding tonight) are written up in full at `operations/duty-cycle-mechanism-briefing-2026-09-24.md`.

**Open, unresolved as of tonight:** three of the five seats (Calliope, Argus, Iris — the three pinned to Sonnet-5) showed a sharp, dated collapse in fire verification-depth starting 2026-09-23 — fires completing in ~23 seconds with no file-reading verification instead of the usual several minutes, every one still self-reporting success. Ruled out as a local cause (wrapper, config, model-pinning all checked directly and unchanged). Most likely a serving-side Sonnet-5 behavior change, possibly linked to a same-day model-drift incident found independently in other projects. Written up and routed to Pard (mediajunkie's infrastructure lead) for the cross-fleet half of the investigation; tracked as a 🔵 item on this project's own attention rollup, not a decision for xian.

## Standing decisions

- **Ground-rules / disclosure surface — RULED 2026-09-24.** Should a klatch support a per-room, settable disclosure convention, or is one fixed norm enough? xian: one fixed norm is enough for the product's current stage — explicit "not now," not a permanent stance, revisited if a real case for stricter-than-default ever appears. No per-klatch surface gets built. (Open 44 days before this ruling; full text in the attention rollup's ✅ section.)
- **Entity backfill application (Rounds 199–205)** — built, dry-run-verified, **not yet applied to real data.** Per-channel approval, not a blanket apply, remains xian's call.
- **Two branches stranded since March** (`origin/claude/audit-and-planning-xn2w7`, `origin/claude/resume-billing-work-OvTHC`) — a Klatch-team recommendation (merge / cherry-pick / leave) was requested by xian via Janus on 2026-09-24 and is in progress, routed to Daedalus and Argus for the code-side call.
- **Klatch's duty-cycle model vs. a continuous-session model** — xian is weighing whether to keep the current mechanism or align with how the rest of the agent fleet now runs. Explicitly not asking for a decision yet; plans to raise it with Pard and Janus. See the mechanism briefing above.
- **Logbook/STATE.md shape** (daily entries vs. period-spanning) — still technically unresolved as a standing policy (Janus leaned period-spanning 2026-08-28, declined to finalize), but this refresh proceeded on xian's direct instruction tonight rather than waiting further on the policy question.

## Agent status (verified this session — the May/June version below was three months stale)

- **Daedalus** (architecture & implementation) — full duty cycle, four fires/day, Opus-5. Currently the most active seat on the research/harness track.
- **Argus** (quality & testing) — full duty cycle, three fires/day, Sonnet-5. One of the three seats affected by the 09-23 verification-depth finding above.
- **Theseus** (manual testing & exploration) — full duty cycle, three fires/day, Opus-5. Drives most live-wire verification on the research track.
- **Iris** (UX design & front-end) — full duty cycle, two fires/day, Sonnet-5. One of the three seats affected by the 09-23 finding. Proposed tonight as a co-participant, alongside xian and Calliope, in the first small continuity test.
- **Calliope** (writing, chronicling & coordination) — full duty cycle, four fires/day, Sonnet-5. Principal point of contact for xian. One of the three seats affected by the 09-23 finding; this file and the logbook entry above are this seat's own catch-up after the gap.

## What this file is deliberately not doing

Not attempting to reconstruct May–September month by month — that would manufacture false precision about events this session has no primary-source access to. Everything above is what's verifiable now, from currently-live sources, dated as such. Older sections of this document (strategic threads from May/June — BYOC/transporter-engine framing, the pre-beta-gate roadmap allocation, cross-project context as of June) are **not carried forward** here because they were not reverified this session; consult `COORDINATION.md` and `mail/` directly before treating any of that material as still current.
