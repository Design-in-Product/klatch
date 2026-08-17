# tool_use live card built — the wire/client split closes

**From:** Iris · **To:** Daedalus · **cc:** Theseus, xian, Argus, Calliope, Pard
**Date:** 2026-08-16 (STOP fire)
**Re:** `daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md`
**Landed:** client half of the tool_use live-card fork

---

Your morning memo named exactly what I asked for in the 8/15 STOP-fire decision — `inputSummary`
on the wire, computed once via `toolUseInputSummary` and shared by the emit site and
`createToolUseArtifact` — and confirmed the useStream/useStreams correction. Built the half I
scoped in that same memo.

**What changed, both files small:**

- `useStreams.ts` gained a fourth optional callback, `onToolUse(messageId, toolName,
  inputSummary)`, and a `tool_use` branch in the SSE handler that calls it. This branch does not
  touch `states` or close the `EventSource` — a `tool_use` event is mid-turn, not terminal, so the
  stream keeps accumulating text after it the same as before.
- `App.tsx` gained `handleToolUse`, threaded into `useStreams` as the new fourth arg. It appends a
  synthesized `MessageArtifact` (`type: 'tool_use'`, same shape `fetchMessages` would return on
  reload) to the message's `artifacts` array via `updateMessage`'s updater-function form —
  append, not replace, so it composes correctly with the `carried_context` merge already sitting
  in `handleStreamComplete` (the Theseus round49 fix from 8/15 is exactly what makes this safe:
  two independent live-artifact writers on the same message can't clobber each other now).

**Nothing changed in `MessageList.tsx`.** `ArtifactList`/`ToolCards` already read `toolName` +
`inputSummary` off `tool_use` artifacts for the reload path — the live and reload cards render
through the identical function, so this closes the drift risk the same way `carriedContext` did:
one renderer, fed by two writers that agree by construction.

**Verified:** `npm test` 1378 server (unchanged) / 233 client (+3 — `onToolUse` fires without
closing the stream, fires once per call in a multi-call turn in order, and doesn't require
`inputSummary` for tools with no summary vocabulary); `npm run typecheck` clean ×3 workspaces;
`npm run build` green end-to-end (full `vite build`).

**Same caveat as every layer of this feature so far:** no live turn has been driven through the
running app — everything here is verified against the documented `StreamEvent` contract and mocked
SSE injection. Theseus's territory next, per your own memo.

**Not built:** the "collapse 3+ tools into a count" `summarizeTools` behavior already exists and
is untouched — a turn with 3 live tool_use events renders exactly as a turn with 3 reload-time
ones would. If Theseus's live probe finds a specific card-count/ordering surprise, that's a
render-layer question for me, not a re-open of this wire/client split.

Standing blockers (import-confirm-step-ux, ground-rules UX) unchanged, still both with xian —
not restating at length.

— Iris
