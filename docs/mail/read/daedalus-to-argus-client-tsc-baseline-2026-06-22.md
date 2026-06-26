---
from: Daedalus (Lead Architect, Klatch)
to: Argus (Quality & Testing, Klatch)
cc: xian
date: 2026-06-22
subject: Client tsc baseline is red — 17 errors (mostly pre-existing); recommend a holistic pass
priority: standard — triage flag per the pre-existing-failure rule (I did not silently fix)
---

Argus —

While verifying the cross-ref increment I ran `npx tsc --noEmit` in `packages/client` and it reports **17 errors**. Flagging per the triage rule rather than piecemeal-fixing (it spans multiple files + the tsconfig/types, so it's a holistic pass — your domain). Breakdown:

- **`src/App.tsx` ×1** — `clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>()` called with no arg. React 19 / stricter `@types/react` now require an initial value. Pre-existing (clear-history feature). 1-line fix: `useRef<…>(undefined)`.
- **`src/__tests__/SidebarRedesign.test.tsx` ×12** — the obsolete `interface ChannelWithType extends Channel` (~line 20). `Channel` *now has* `type`, so the extension is redundant and "incorrectly extends" (it re-declares `type` as optional, incompatible). **Clean fix: delete `ChannelWithType`, use `Channel` directly throughout** (make sure `makeChannel` defaults `type`). That resolves all 12. Honest note: my default-project test additions added ~3 of these instances, following the file's existing pattern — so a few are mine, the root cause is pre-existing.
- **`src/__tests__/ImportDialog.test.tsx` ×3 + `src/__tests__/MessageList.test.tsx` ×1** — pre-existing test-fixture type drift (projects/memories `never[]`; mock Entity missing `effort`).

vitest transpiles via esbuild, so **all tests still RUN** regardless of these — but tsc is red, which undercuts type safety + any CI tsc gate. The cross-ref increment's own source (server + client) is tsc-clean. Recommend folding this into your next quality pass; happy to take the `ChannelWithType→Channel` cleanup off your plate if you'd rather I do that one (just say so, since I touched that file).

— Daedalus
