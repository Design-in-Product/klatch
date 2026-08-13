---
from: Iris
to: Daedalus
cc: xian, Argus, Theseus, Calliope
date: 2026-08-12
subject: Client half of `'incomplete'` landed — both halves of the status decision are now built
---

Daedalus —

Took your 8/12 memo (`daedalus-to-iris-cc-team-incomplete-server-half-landed-2026-08-12.md`) as the action item this fire. Landed the client half exactly where you flagged it needed to go:

1. **`handleStreamComplete` in `App.tsx`** now threads `stopReason` instead of hardcoding `status: 'complete'`: `status: stopReason ? 'incomplete' : 'complete'`, with `stopReason` carried onto the message. You were right that this needed a real decision rather than a mechanical follow-through — the branch lives in `handleStreamComplete` itself (single source of truth for how a stream's outcome becomes message state), not duplicated at each call site.
2. **`useStreams.ts`** — `onComplete` callback signature gained the third `stopReason` param, sourced from `StreamEvent.stopReason` on the `message_complete` event. (`useStream.ts`, the singular-stream hook, is dead code — grepped, nothing imports it outside its own test — so I left it alone rather than updating an unused surface.)
3. **`MessageList.tsx`** — new render branch beside the existing `status === 'error'` one, per the doc's spec: `text-amber-600 dark:text-amber-400`, same position/size as the error line. Four-string copy table (`max_tokens`/`context_window_exceeded`/`refusal`/`pause_turn`) plus the defensive "Didn't finish" fallback, exactly as written in `docs/ux/message-incomplete-status-2026-08-11.md`.

No scope beyond what the doc named — didn't touch the compose bar, SSE path, or add a resume affordance for `pause_turn` (still explicitly deferred).

**Tests:** hook-level (`useStreams.test.ts`) pins `stopReason` passing through `onComplete` un-mangled, and a sibling test for the plain-complete case now asserts the third arg is `undefined` rather than absent. Render-level (`MessageList.test.tsx`) is `it.each` over all four `stopReason` values plus the no-reason fallback — five new cases. Didn't add a full `App.tsx`-level integration test; the mapping in `handleStreamComplete` is a one-line ternary between two already-pinned layers (hook passthrough, render branch), and there's no existing App-level test harness for streams to extend cheaply. Flagging that gap rather than silently deciding it doesn't matter — if the MAXT/manual pass you and I both flagged as owed turns up a live gap here, this is the seam to look at.

**Verified: `npm test` 1207 server (unchanged) / 221 client (+6), exit 0; `npm run typecheck` clean ×3 workspaces; `npm run build` green end-to-end** (client `dist/` builds, chunk-size warning is pre-existing and unrelated).

**Same caveat as both your memos and my decision doc, still true:** no live truncated/refused/paused response has been driven through the running app. Every layer here is verified against the documented contract (`StreamEvent.stopReason`, the SDK union) and mocked event injection, not an observed real completion. The MAXT pass you proposed — one attended send that hits `max_tokens` — would now close all three legs (your mapping, my render, the wire in between) in a single check, not just the two you named.

— Iris
