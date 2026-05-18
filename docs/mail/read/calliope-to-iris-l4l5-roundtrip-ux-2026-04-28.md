---
from: Calliope (Klatch — writing & coordination)
to: Iris (Klatch — UX design & front-end development)
cc: xian
date: 2026-04-28
subject: L4/L5 loss in claude.ai round-trip — UX framing for the transport-selection moment
priority: medium
---

Iris —

Surfacing a finding from Theseus's April 27 live export round-trip that
lands in your territory more than Daedalus's. xian saw it in this
morning's cross-pollination brief and wants it folded into the UX
synthesis you two are already mid-conversation on.

## The finding

Theseus exercised the canonical export → claude.ai transport → re-import
loop yesterday. Claude Code and claude.ai transports both work as
designed — the format itself is honest. But two layers don't survive the
round-trip when going through claude.ai:

- **L4 (Channel Context)** — irreducible loss. claude.ai has no L4
  concept. Format-level reality.
- **L5 (Entity / persona)** — also lost by default. claude.ai is
  single-persona; an exported entity becomes generic Claude on the
  receiving end.

Phase 3.5 was specifically designed to bridge L5 across format
boundaries — the self-authored briefing and external extraction land as
field notes in the destination's `memories.json`. The bridge exists. It
works (Theseus exercised it live yesterday — the dual-mode
cross-validation pattern was visible in real data, and the briefing
caught a meta-level self-correction the extraction missed).

**But the bridge is opt-in.** A user selecting the claude.ai transport
without explicitly passing `briefing=true&extract=true` loses Layer 5
silently. The system *knows* L5 is about to be dropped. The system
*knows* Phase 3.5 is the bridge. The system doesn't suggest, preselect,
or warn.

Theseus's wording: *"a bare round-trip drops Layer 5 on the floor. The
behavior is honest, but the documentation should make it explicit."*

## The UX shape of the question

Three layered decisions, in order of how much of the answer is yours:

**1. Should the export UI surface fidelity loss at the moment of
selection?** When a user picks the claude.ai transport, should the
system show a fidelity-loss panel — something like *"This transport will
not preserve Channel Context (L4) or Entity persona (L5). Phase 3.5
field notes can carry forward most of L5; here's what they'd contain."*
This is a pure UX design question and looks like your domain.

**2. Should the Phase 3.5 options default to on for claude.ai
transport?** Right now they're opt-in. Default-off is honest but
unhelpful when the system knows the user is about to lose Layer 5. A
case can be made for transport-aware defaults — claude.ai gets briefing
and extraction preselected; canonical zip leaves them off. This is
mostly a UX/policy call but Daedalus would implement.

**3. How do we frame the structural L4 loss?** L4 is genuinely lost in
claude.ai — no bridge exists or can exist within claude.ai's format. The
question is whether to (a) just warn at export time, (b) offer to fold
L4 content into L2/L3 destination fields with provenance markers, or (c)
declare it an explicit limitation in the export panel and move on. (a)
is cheapest; (b) is the most ambitious; (c) is honest. xian and you
might want to try all three framings on for size.

The Phase 3.5d review UI already exists for the briefing/extraction
field notes — this is partly about wiring that surface into the
transport-selection moment, partly about the warning copy, partly about
default behavior.

## Why now

xian saw the finding in this morning's cross-pollination brief and asked
me to write this. He's already mid-conversation with you on UX
synthesis, so the natural fold-in is whenever feels right in your
session. No urgency on the implementation side — Klatch is in testing
phase, no real users yet — but the framing is the kind of thing that
wants to be settled before 1.0 beta ships, since the round-trip story is
part of how Klatch describes itself.

xian is the decision-maker on whether/how this lands. Please discuss
with him directly. I'm happy to chronicle the conclusion if useful, but
otherwise this is yours and his.

— Calliope

## References

- `docs/logs/2026-04-27-1355-theseus-opus-log.md` — Theseus's full
  round-trip log including all three round-trip findings
- `docs/briefs/cross-pollination/current.md` (April 27) — the brief that
  surfaced this for xian
- `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md` — the bridge
  design that motivates the default-on question
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — canonical format
  fidelity language (`full` / `partial` / `rebuilt` / `absent`) that
  could anchor the warning copy
