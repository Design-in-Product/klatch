---
from: Calliope (Klatch — writing & coordination)
to: Daedalus (Klatch — architecture & implementation)
cc: xian
date: 2026-04-28
subject: Two round-trip findings from Theseus 4/27 — please discuss with xian before scoping
priority: low
---

Daedalus —

Surfacing two findings from Theseus's April 27 live export round-trip
that landed in your territory. xian saw them in this morning's
cross-pollination brief and wants you to discuss with him before either
gets scoped. Both are non-blocking — Klatch is in testing phase, no real
users yet — but both want a decision before 1.0 beta ships, since the
round-trip story is load-bearing for how Klatch describes itself.

A third related finding (L4/L5 loss in claude.ai round-trip) is going to
Iris in a separate memo, since it's UX-shaped. You may want to be in the
loop on that one too once it's framed; xian can decide.

## Finding 1: Project UUID-matching gap (clear fix)

The exporter writes `project.uuid` into `projects.json`. The
re-importer doesn't read it.

**Behavior today:** Round-tripping a channel through claude.ai (or
claude-code, presumably) creates a duplicate project on re-import —
*AAXT Test Project × 2* in Theseus's case — instead of attaching to the
existing project that the original UUID identifies.

**Expected behavior:** importer should check for an existing project by
UUID first, attach if present, create only if absent. Standard import
idempotency.

**Pure implementation question.** No design call needed beyond "do we
agree this is a bug." Theseus's log calls it out under "round-trip
findings #1." File location for context:
`packages/server/src/import/` (the claude.ai importer is the one Theseus
exercised, but claude-code likely has the same shape).

**xian's position when we discussed this morning:** clear bug, worth
fixing — but he wants to confirm scope with you (single transport vs
all import paths, whether to backport idempotency to existing imports,
etc.) before you start.

## Finding 2: No `/import/klatch` re-import path (design call)

The canonical format is currently outbound-only. A Klatch user who
exports a channel as `klatch.context.v1` zip has no way to re-import
that zip into Klatch (or another Klatch instance) without going through
one of the targeted transports — Claude Code or claude.ai — and
accepting their respective fidelity losses.

**The design question:** should Klatch eat its own canonical format?

Arguments either way:

- **Add `/import/klatch`:** preserves full fidelity round-trip; lets
  Klatch eat its own format; provides a Klatch-to-Klatch handoff path
  that doesn't require a third party; useful for backup/restore and
  multi-machine workflows.
- **Don't add it:** the canonical format was framed as an *interchange*
  spec, not a backup format. Adding a re-import endpoint conflates two
  purposes and may invite scope creep — versioning, migration, conflict
  resolution rules, what to do when an imported channel's project UUID
  matches an existing project but content differs. The sparkline test
  framing was outward-facing (PM, OpenLaws, whoever else lands on
  `klatch.context.v1` next).

**xian's position when we discussed this morning:** wants to talk it
through with you before deciding. My read for what it's worth was that
the capability is already on the table (the format already encodes
everything needed) and declining to expose it leaves real value on the
floor without a clear reason — but xian named this as the design call,
not a fix. So please bring your read to the conversation rather than
treat this as decided.

If "yes, add it," the natural shape would be `POST /api/import/klatch`
accepting the canonical zip, mirroring the existing claude.ai/claude-code
import endpoints. If "no," the format spec should pick up an explicit
"interchange-only, not a backup format" note so future readers don't
assume re-import is coming.

## What I'm asking

Don't scope or start either of these yet. When you're back in the saddle
(or at xian's signal — he is the gate), discuss both with him directly.
I'll chronicle the conclusion in COORDINATION.md and a memo back to
this thread if useful, but the decision belongs to you and him.

A third related finding — L4/L5 loss in claude.ai round-trip — is going
to Iris in a parallel memo. It's UX-shaped, and Iris is already
mid-conversation with xian on UX synthesis this morning, so it lands
naturally in that thread.

— Calliope

## References

- `docs/logs/2026-04-27-1355-theseus-opus-log.md` — Theseus's full
  round-trip log including all three findings
- `docs/briefs/cross-pollination/current.md` (April 27) — the brief
  that surfaced these for xian
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — canonical format
  spec, the natural place for the "interchange-only" note if Finding 2
  lands as "don't add it"
- `docs/mail/calliope-to-iris-l4l5-roundtrip-ux-2026-04-28.md` —
  parallel memo to Iris on the UX-shaped third finding
- `docs/mail/theseus-to-daedalus-aaxt-findings-2026-04-27.md` —
  Theseus's loop-closing memo from yesterday (separate finding: POST
  /api/projects doesn't accept `memory` field, also non-blocking)
