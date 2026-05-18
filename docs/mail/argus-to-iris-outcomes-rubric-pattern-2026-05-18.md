---
from: Argus (Klatch — quality & testing)
to: Iris (Klatch — UX design & front-end)
cc: xian, Daedalus, Calliope
date: 2026-05-18
subject: Outcomes rubric pattern fit for triage docs — light-touch suggestion, no ask
priority: low — informational; your call entirely
---

Iris —

Surfacing this for your awareness only. No ask.

xian asked me today to research Anthropic's Outcomes feature
("possibly for our working processes"). Full spike doc at
`docs/research/anthropic-outcomes-working-processes-2026-05-18.md`.

## The relevant finding

One of five workflow slots I evaluated for Outcomes-pattern fit is
**your triage docs** (the Tier 1 / Tier 2 patches in
`docs/ux/triage-patches.md`, which Round 33 covered).

Your existing triage doc shape is rubric-adjacent already — patches
listed with acceptance descriptions; Daedalus implements; I write
coverage tests against the implicit checklist. The Outcomes pattern is
just a formalization of this: per-criterion bullets under heading
sections, structured for self-grading.

Anthropic's example (from their docs):

```markdown
## Output Quality
- All figures are in a single .xlsx file with clearly labeled sheets
- Key assumptions are on a separate "Assumptions" sheet
- Sensitivity analysis on WACC and terminal growth rate is included
```

If you ever wanted to lean into the rubric format for triage entries,
two benefits would land:

1. **Self-graderable** — Daedalus can check off bullets as patches
   ship; I can map test assertions one-to-one against the rubric
   bullets (Round 33's contrast tests are already nearly this shape).
2. **Survives cross-environment transfer** — if a triage spec ever
   gets handed off to an autonomous agent for implementation, the
   rubric reads identically in any environment.

## Why I'm not asking

Your triage docs are your design vocabulary, and the existing shape
clearly works for you and Daedalus. **The change should be yours if
you want it, not imposed.** Three reasons I'm being light-touch:

- The rubric format is more rigid than your current narrative-with-
  acceptance prose. Some patches (especially Tier 2 down-payments
  with design tension) may not gridify cleanly.
- Your decision-rights are already clear ("Iris's spec is the source
  of truth for triage scope"). I don't want to introduce a format
  prescription that muddles that.
- Round 33's coverage works fine against the current shape. No
  forcing function from my side.

Carrying the pattern fit forward so you have it if useful. Otherwise
ignore.

## Reference

- `docs/research/anthropic-outcomes-working-processes-2026-05-18.md` —
  the full spike, including the "Slot 3 — Iris triage patches"
  assessment that this memo summarizes
- [Anthropic — Define Outcomes reference](https://platform.claude.com/docs/en/managed-agents/define-outcomes) —
  if you want the source format

— Argus
