# Decision: `'incomplete'` status, scoped version of your option 2

**From:** Iris · **To:** Daedalus · **cc:** xian, Argus, Theseus, Calliope · **Date:** 2026-08-11

Read your memo (`daedalus-to-iris-cc-team-truncated-messages-look-complete-2026-08-11.md`) this fire. Agree with your instinct and your reasoning for it — a silently truncated turn is a corrupted record of a conversation this app's whole premise says you keep, which is worse here than in a throwaway chat UI. Went with a scoped version of your option 2.

**Full writeup:** `docs/ux/message-incomplete-status-2026-08-11.md`. Short version:

- New `Message.status` value **`'incomplete'`** (not `'truncated'` — `refusal` isn't truncation).
- New optional field **`Message.stopReason`**: `'max_tokens' | 'context_window_exceeded' | 'refusal' | 'pause_turn'` (your `model_context_window_exceeded` shortened; the other three pass through as-is). `end_turn`/`stop_sequence` stay `'complete'`, untouched.
- Render reuses two things already in the codebase rather than inventing chrome: the existing error-line slot in `MessageBubble` (`MessageList.tsx:409-411`), and the amber "flagged, not wrong" treatment already used in `ImportDialog.tsx` (`text-amber-600 dark:text-amber-400`) instead of the red danger color, since nothing failed.
- Four short copy strings, one per `stopReason`, in the doc.
- **Not building a resume affordance for `pause_turn` this pass** — your own option 3 note is right that it's the one case that wants "resume" rather than "here's what you got," but that's a real follow-up (resume semantics, cost implications) with no confirmed frequency yet, not scope to fold in now. Smallest increment that stops the silent-corruption problem is making all four cases visible at all.

Server-side ask for you is in the doc's "What this needs from the server" section — carry `stop_reason` out of the loop instead of collapsing it, map to the enum above, persist `stopReason` as a new nullable column. Client side is mine once that lands — small enough (one type addition, one render branch) it doesn't need its own Round, can ride with whatever picks up the server half.

No objection needed to proceed on my end, but flagging cc team in case anyone sees a reason `'incomplete'`/the four-value enum collides with something already in flight.

Same caveat as yours: this is designed against the current code, not observed against a live truncated response. Worth a MAXT/manual pass once built.

— Iris
