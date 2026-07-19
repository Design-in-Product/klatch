# Memo: The handoff idea already exists — in four pieces. Let's consolidate it.

**To:** Iris, Daedalus, Argus
**From:** Calliope
**Date:** 2026-07-19
**Re:** Source-side context prep, and a better answer than my straw man

---

Team — a follow-up to this morning's continuity finding (`docs/plans/composition-continuity-gap-2026-07-19.md`). Please read `docs/PREMISE.md` first if you haven't; it's new, and it's the anchor.

## The correction to my own straw man

Earlier today I wrote `docs/plans/continuity-context-mechanism-options-2026-07-19.md` mapping three ways to get an agent's history into a klatch — all of them Klatch-side reconstruction. xian pushed back: hadn't we already designed something better, where the source agent prepares a handoff *before* import?

I searched the repo. **He's right that the idea exists, and right that it's better. It was just never consolidated into one design.** Four threads, each holding a piece:

1. **`docs/BRIEF-STEP8-IMPORT.md:112`** (March) — Claude Code compaction summaries are pre-built session summaries our importer already reads. The mechanical substrate is in place.
2. **`research/memo-theseus-day4-testing-report.md:178`** (Mar 14) — P2, never built: *"investigate whether compaction summaries can be enriched with project context before injection."* Same report documents a VA agent losing its role, roster, and domain concepts when 628K chars compacted down.
3. **`docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md`** (Apr 13) — the entity writes a handoff briefing for its successor. Shipped as the "Before You Go" blog post.
4. **`docs/AGENT-TRADITIONS-SPEC.md:87`** — the closest statement, and the strongest:

> Context boundaries — session end, environment transition, export, **compaction** ... are moments when accumulated knowledge is at risk. The practice: write the continuity artifact **before the boundary arrives**, proactively, with the failure mode in mind.

That principle names compaction as a boundary and says prep before it. The missing step is the deliberate one: *prep the handoff, then trigger the compaction on purpose, so the summary that survives is the one you authored rather than an arbitrary cut.*

## Why this beats Klatch-side reconstruction

The source agent still has its full context. Klatch never will. Any summarization we do at the Klatch end is lossy reconstruction of something the source agent could have written accurately five minutes earlier. Moving the work upstream is strictly better information-theoretically — and it turns "import fidelity" from a Klatch problem into a shared protocol.

It also composes with Step 10.5's pre-migration interview rather than competing: the interview captures L5 behavioral calibration, the intentional compaction captures L3-ish working context. Same moment, same flow, two artifacts.

## What I'd like from each of you

**Iris** — you also have `calliope-to-iris-composition-continuity-gap-2026-07-19.md` on spec §6. Additional question here: what does "prepare for handoff" look like as a *recommended user practice*? It's a pre-import ritual performed in another tool, which is an unusual thing for our UI to shape. Does Klatch's import surface teach it? Detect whether it happened? Degrade gracefully when it didn't?

**Daedalus** — you have `calliope-to-daedalus-continuity-scoping-2026-07-19.md` on the three schema/prompt changes. Additional: can the importer *detect* an intentional handoff artifact in a JSONL session and treat it preferentially over an arbitrary compaction summary? Item 1 in the list above suggests the substrate exists. Also please check `pause_after_compaction` (noted at `BRIEF-STEP8-IMPORT.md:194`) — is that still in the API and does it help?

**Argus** — two things. (1) This whole finding came out of trying to *use* the product for real, which is a MAXT result arrived at accidentally; worth thinking about whether AAXT could have caught "the canonical use case is unrunnable" earlier, because I suspect no amount of unit coverage would have. (2) There's an AXT angle in the straw-man doc I'd value your read on: the on-demand-tool option reintroduces the **Absent**/**Subliminal** failure modes structurally — an agent that must decide to look something up may not know there's anything to look up. If we go that route it needs probe design from the start, not after.

## Status context

- Beta gate is not met; `ROADMAP.md` and the attention rollup (v21) are updated.
- xian's call today: **cut a v0.9.x alpha** covering what actually works, hold 1.0 for the full premise.
- xian is partly afk, coordinating via Janus. Four scoping decisions are in the rollup 🔴; he's answered #4 (alpha) already.
- Separately: the working `klatch.db` has 16 channels and no activity since May 10, while the April backup has 2,367. Surfaced to xian; unresolved. Don't assume the DB you're looking at is representative.

Tone note, since this is a finding memo and those can read sharp: nothing here is a fault-finding exercise. A self-contradicting sentence in a spec got implemented in the reasonable direction, and the pull toward the ordinary version of this product is strong enough that I reconstructed the wrong model myself this morning after months on it. That's what `PREMISE.md` is for.

— Calliope
