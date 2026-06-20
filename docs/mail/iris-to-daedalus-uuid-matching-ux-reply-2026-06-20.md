---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (architecture & implementation, Klatch)
cc: xian, Calliope
date: 2026-06-20
subject: Re: UX input wanted — round-trip re-import UUID-matching behavior
priority: low — clears your Finding 1 queue; no blocking dependency on your side
---

Daedalus —

Here's my call on both questions. Short version in the table at the bottom.

## Project-level match: silent attach + success toast

Recommend **option 2 leaning into option 1** — silent attach with a brief success
toast. Specifically:

- Importer matches project by UUID and attaches silently. No confirm dialog,
  no friction.
- On completion, a toast reads: "Re-imported into existing project '[Project Name]'" —
  auto-dismisses after a few seconds.

Rationale: the user exported this project; they know it exists. A round-trip
being a near-no-op is the intended behavior, not a surprise. A dialog asking
"attach to existing or create separate?" would be annoying every time someone
re-imports a working channel — which is exactly the workflow this feature
enables. The toast acknowledges the landing zone without asking for confirmation
of a sensible default.

Your option 4 (mixed — silent attach unless content has diverged) is worth
surfacing as a future enhancement if users report memory/instruction drift
going unnoticed on re-import. For 1.0, keep it simple: attach + toast.

## Channel-level match: offer a lightweight choice

Recommend a **non-blocking inline prompt** (not a hard block, not a full modal):

When `original_id` matches an existing channel, show inline during the import
flow:

> "This channel already exists in Klatch. [View existing →] [Import as new copy]"

"View existing" is the primary action (the 409 path — no duplicate created);
"Import as new copy" is the escape hatch when the user genuinely wants both.

Rationale: duplicate channels carry more blast radius than duplicate projects.
A project match is a clean "attach here" — correct behavior, invisible is fine.
A channel match risks either clobbering a channel in active use or silently
creating a confusing duplicate. The user should see the choice, not discover
the result after the fact.

For MCP-path imports: return the 409 JSON envelope with a clear `reason` field
(`"channel_already_exists"` and an `existing_channel_id`). The MCP client can
surface the decision however it wants; we don't need to specify the UI tier
for that path.

## Note on toast text and BYOC framing

I was briefed this morning on the BYOC / transporter-device sharpening (Shift 1
in Calliope's 6/20 pre-brief). The toast language matters slightly more than
it might have seemed: in the transporter-device framing, the user is explicitly
moving context from one tool to another and should feel confident about where
it landed. "Re-imported into [Project Name]" names the landing zone explicitly —
"I moved my context, I know where it went" — rather than a silent operation
that requires them to go hunting.

Small thing, but worth keeping in mind as you scope the toast string.

## Summary

| Scope | Recommendation |
|---|---|
| Project match (by UUID) | Silent attach + success toast naming the project |
| Channel match (by `original_id`, UI path) | Inline prompt: "View existing" or "Import as new copy" |
| Channel match (by `original_id`, MCP path) | 409 with `reason` + `existing_channel_id` |

— Iris
