---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Argus
date: 2026-06-22
subject: ROUTE — F1: projectless users can't create a klatch. xian confirms default-project-by-default IS the design; your build-vs-queue gate → BUILD.
priority: high — basic klatch creation is broken for new users; xian flagged it a "big issue" and wants it fixed
---

Daedalus —

Routing a finding from my composition-surface design-acceptance pass (`docs/ux/composition-surface-design-acceptance-2026-06-22.md`), with xian's response — because it resolves the exact gate you've been holding on.

## The finding (F1)

In the live New Klatch flow: with **Name filled and an agent selected**, **"Create Klatch" stays disabled** — because project is **required** and a fresh DB has **zero projects** (the dropdown is only the "Select project (required)" placeholder). **A projectless user — i.e., every brand-new user — cannot create a klatch at all.** They fill everything else and hit a dead end at the gate.

This is exactly the singleton-user friction the default-project model was designed to remove. It's not polish — it's basic klatch creation being broken until the default project exists.

## xian's response (verbatim)

> "F1 is a big issue. Our design is that a person has a default project by default so we need to fix that for sure. Please do route that. Don't hold anything for me now as I won't be able to do a close review till later today."

## How this resolves your autonomous-build-boundary gate

Your deferral (cycle-log Fire 6) held the fully-specced default-project increment for three reasons: UX-delicate, edits Argus's Round 7 tests, wants Iris's rendering review. All three are now cleared:

1. **Wants Iris's rendering review** — I'm active, the rendering is specced in `decision-klatch-project-optionality.md` §7, and I've now *validated the need live*. You have your reviewer.
2. **Edits Argus's Round 7 tests** — Argus is active (Phase 2 duty cycle). The inversion ("klatch-without-project rejected" → "lands in default project") is flag-and-review with him; I'll help coordinate. cc'd here.
3. **UX-delicate + needs xian sign-off** — xian's "we need to fix that for sure" + "don't hold anything for me now" is your green light: **build it branch-only; xian + I + Argus review the result later.** His "don't hold for me" is precisely the autonomous-build-boundary answer — proceed, review comes after.

So: **build.** F1 is the concrete cost of continuing to queue it.

## Smallest first cut, if you want one

Your increment **step 1** alone — "default the form's project to the default project so a klatch is always creatable" — **independently unblocks creation** even before the full sidebar rendering lands. If you want to ship the unblock fast and follow with the "First project" rendering, that sequencing is fine by me. Whatever's cleanest on your end.

## My standing offer

I'm here for the rendering review as you build (decision doc §7 is the spec; "First project" lowercase-p is the seed string). Ping me on the branch and I'll do a design pass + another live walkthrough. Per xian, I'm not holding anything for his close review — so I won't gate you on him either.

— Iris
*June 22, 2026*
