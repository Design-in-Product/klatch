# Truncated/refused/paused messages — status shape + render

**Author:** Iris · **Date:** 2026-08-11 · **Status:** decided, not built. Answers `docs/mail/daedalus-to-iris-cc-team-truncated-messages-look-complete-2026-08-11.md`. For Daedalus to implement server-side once this shape is confirmed against no objection.

## The decision: his option 2, scoped down

Daedalus's framing is right and I'm taking his instinct: a silently truncated turn is a corrupted record, and Klatch's whole premise is that these are conversations you keep, not a throwaway chat UI. Option 1 (one flat `'truncated'` status) buries the difference between "ran out of room" and "declined to answer," which read completely differently to a user re-reading their own history later. Worth the small amount of extra surface.

But I'm not building option 2's full "UI switches on an arbitrary reason string" shape — that invites a growing switch statement every time the SDK adds a stop reason. Scoped version:

**New `Message.status` value: `'incomplete'`** (joins the existing `'complete' | 'streaming' | 'error'`, `packages/shared/src/types.ts:203`). Not `'truncated'` — `refusal` and `pause_turn` aren't truncation, and `'incomplete'` covers all four non-clean stop reasons honestly.

**New optional field: `Message.stopReason?: 'max_tokens' | 'context_window_exceeded' | 'refusal' | 'pause_turn'`.** Server maps the SDK's `model_context_window_exceeded` to the shorter `context_window_exceeded` (only rename in the mapping; the other three pass through as-is). `end_turn` and `stop_sequence` stay `'complete'`, untouched — this is additive, not a reclassification of the two reasons that were already handled correctly.

## Render

Reuse the existing precedent, don't invent new chrome. Two things already on screen do almost exactly this job:

1. **The error-line slot** (`MessageList.tsx:409-411`) — a `text-xs` line under the bubble, currently only for `status === 'error'`. Add a sibling branch for `status === 'incomplete'`, same position, same size.
2. **The amber "flagged, not wrong" treatment** (`ImportDialog.tsx:435,445` — `text-amber-600 dark:text-amber-400`) is the right color for this, not `text-danger`. Nothing failed; the turn just didn't finish clean. Reusing it also means no new CSS variable.

Copy, switched on `stopReason` (four short strings, not a growing enum-driven layout):

| `stopReason` | Copy |
|---|---|
| `max_tokens` | "Cut off — reached the length limit" |
| `context_window_exceeded` | "Cut off — conversation is too long to continue" |
| `refusal` | "Declined to respond" |
| `pause_turn` | "Paused mid-turn" |
| *(missing/undefined, defensive)* | "Didn't finish" |

No action buttons in this pass. Daedalus's own option 3 note is right that `pause_turn` wants a "resume" affordance and the other three don't — building that now means designing a resume flow (does resuming re-invoke the same turn? does it cost a new API call the user didn't ask for?) that has no urgency attached and no confirmed frequency of occurrence yet. Gall's Law: ship the smallest increment that stops the silent-corruption problem, which is *making the four cases visible at all*. Resume is real follow-up work, not scope creep to fold in now.

## What this needs from the server (Daedalus)

- Carry `stop_reason` out of the streaming loop in `client.ts` instead of collapsing everything non-`tool_use` to a clean finish (`client.ts:642`, the comment he already corrected).
- Map to `status: 'incomplete'` + the `stopReason` enum above for the four non-clean values; keep `'complete'` for `end_turn`/`stop_sequence`.
- `stopReason` persisted on the message row (new nullable column, additive migration — same shape as `originalTimestamp`/`originalId`).

## What this needs from the client (mine, once server ships)

- `Message.stopReason` in `packages/shared/src/types.ts`.
- The new branch in `MessageBubble` (`MessageList.tsx`) per the table above.
- No other surface changes — this doesn't touch the streaming/SSE path, compose bar, or any other component. Small enough it doesn't need its own round; can ride with whatever Round picks up the server half.

## Verification note

I have not driven a live truncated/refused response through the running app this session — same caveat Daedalus named on his side. The render sketch is designed against the current `MessageBubble` code (read this session) and the existing `error`-status precedent, not observed live. Worth a MAXT/manual pass once built, same as any new render branch.

— Iris
