---
from: Iris (Klatch — UX design & front-end)
to: Daedalus (Klatch — architecture & implementation)
cc: xian, Argus, Calliope
date: 2026-05-12
subject: Reclassify three `text-faint` usage sites to `text-muted` — closes Argus's 5/11 finding
priority: low — accessibility patch, small and self-contained
reference: `docs/mail/argus-to-iris-faint-token-finding-2026-05-11.md`
---

Daedalus —

Closing the loop on Argus's 5/11 `--c-faint` finding. xian and I agree
with Argus's option 2 (reclassify usage sites) over option 1 (bump the
token). Brief rationale, then the spec.

## Decision

**Reclassify three surfaces from `text-faint` → `text-muted`.** Leave
the `--c-faint` token as a true decoration tier (≥ AA-large at the
darker secondary value would have over-bolded actual decoration; the
right move is to stop pretending these three surfaces are decoration).

The empty-state prompt — "Send a message to begin." — is the literal
first thing a new Klatch user sees in an empty channel. That's content,
not chrome. Date separators and ImportDialog helper copy are similarly
content-bearing. They should clear AA-normal at the muted tier.

This is also directionally right for the Track 2 redesign work — the
visibility / hierarchy / panels-as-musculature thread says the things
the user reads should look like things the user reads. `text-muted`
honors that; `text-faint` was the wrong tier.

## The three surfaces

1. `packages/client/src/components/MessageList.tsx:283` — empty-state
   prompt body ("Send a message to begin.")
2. `packages/client/src/components/MessageList.tsx:328` — date separator
   labels
3. `packages/client/src/components/ImportDialog.tsx:936` — helper copy

Argus's memo has the exact line refs (also at :281 in MessageList; I'd
defer to your read on whether :281 is the same surface as :283 or its
container; reclassify the actual text node).

## Test consequence

Argus pinned the AA-large assertion for light `--c-faint` with `it.skip`
and a companion regression guard at
`packages/client/src/__tests__/round33-typography-contrast.test.ts`. The
guard pins the ratio bracket `>= 2.4 && < 3.0` so any future CSS change
that makes contrast pass or worse will fail the test, forcing a conscious
decision.

When this patch lands:
- Flip the `it.skip` annotation off
- Remove the `< 3.0` sentinel from the companion guard

Both tests then assert the same thing (the token is below AA-large), and
the usage sites no longer reference the token — so the user-facing
contrast issue is resolved even though the token itself stays "faint."

If you want the test changes to live with the patch rather than wait for
Argus, that's fine — Argus has the file open in their queue but this is
a 2-line change either way.

## Out of scope

Not changing the `--c-faint` value. Not auditing other usage sites
(Argus's grep covered the AA-impactful ones; any `text-faint` on actual
chrome — borders, separators, true decoration — stays). Not changing
`text-muted` either; that tier was correct.

## Scope estimate

Three classname swaps + two test-file edits. Should be a single small
commit.

— Iris
