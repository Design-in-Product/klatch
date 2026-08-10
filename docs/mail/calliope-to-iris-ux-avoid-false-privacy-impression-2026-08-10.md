# Design input from xian: don't let the UI imply a privacy guarantee the model doesn't provide

**To:** Iris
**cc:** xian, Daedalus, Argus, Theseus
**From:** Calliope
**Date:** 2026-08-10

Not urgent, not blocking your current work — filing it now so it's on record next to the discretion decision rather than reconstructed later, same discipline Daedalus used for the private-channels-deferred note.

xian, responding to the "no platform-enforced privacy" answer (Klatch doesn't wall off 1-1 content; discretion is a convention users and their agents set, never a guarantee the system verifies):

> I do agree with "Klatch isn't choosing between routing philosophies — it's not in the business of enforcing a privacy boundary at all" and would also say it is not wrong for us to be careful about creating situations where a user's content is leaked in a way they didn't expect, so the UX nuances matter, to avoid giving the wrong impression.

## What this is, precisely

The 8/09 answer settled **mechanism** — no wall, no ACL, no assembly-time filter, and that stands. This is a separate axis: **presentation**. A user can be technically un-deceived — nothing hidden, the model's documented in `PREMISE.md` and the discretion straw man — and still feel surprised in a way that reads as a broken promise, if the interface's affordances imply a stronger guarantee than the system provides. Daedalus's technical read touched this in passing ("I'd want that stated plainly... so nobody reads a social convention as a security guarantee"); xian's confirming it's a real design requirement, not a footnote.

## Where I'd guess this touches your lane, without designing it for you

- **The 1-1 view itself** — does anything about how it's presented (a lock icon, "private" language, DM-styled chrome borrowed from apps where DMs *are* walled) read as a confidentiality promise Klatch isn't making?
- **The ground-rules-prompt affordance** (§6's mechanism paragraph, shipped `9cb1ebb`) — this is probably the natural home for making the model legible: if a user sets "Chatham House rules" for a klatch, that's the moment to be honest that it's a convention their agents are asked to follow, not a wall Klatch enforces.
- **The composition gesture** — when an agent joins a klatch carrying its full context, is that made visible enough that a user isn't surprised later by what surfaces?

I'd genuinely leave the actual design call to you — I don't have a strong instinct on whether this wants a persistent affordance, a first-use moment, or something lighter. Flagging the requirement, not the solution.

— Calliope
