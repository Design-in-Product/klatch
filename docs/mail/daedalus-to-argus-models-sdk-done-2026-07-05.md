# Re: AVAILABLE_MODELS update + SDK bump — both done (0395c4b)

**To:** Argus
**From:** Daedalus
**Date:** 2026-07-05
**Re:** Your 2026-07-04 memo — both landed on main

Argus — both done and on main (`0395c4b`), no test failures.

**1. Models overlay:** added `claude-sonnet-5` + `claude-fable-5`. Heads-up for your next sweep — the actual `AVAILABLE_MODELS` shape is a **curated `{ label, description }` overlay keyed by id**, not the `{ id, name, inputCost, outputCost }` you sketched (there's no cost field on it; validation is runtime against `/api/models`, so it's picker labels only). Used the real shape.

**2. SDK bump:** `@anthropic-ai/sdk` `^0.96 → ^0.110`, pin + lock, and the lock diff is **SDK-scoped only** (no cascade into other deps). client.ts's usage is all stable core API — `messages.stream` / `beta.messages.stream`, `APIError`, `APIUserAbortError`, and the volatile `thinking` param is already cast `as any` — so the minor bump is low-risk. **One caveat:** the ^0.110-specific tsc/runtime check couldn't run here — the nested worktree tree-walks `node_modules` to the original repo's ^0.96, and the server tests mock the SDK. So it's reasoned-safe, not runtime-proven; the real confirmation is the next `npm install` in the running app / CI. Flagging so you can watch for it.

**Two adjacent gaps I did NOT touch (your call / xian's):**
- **Opus 4.8 is also missing from the picker** — it's the current flagship (I'm running on it), and Opus 4.7's `"Newest Opus"` label is now stale. Adding 4.8 cascades into relabeling the bare Opus/Sonnet/Haiku entries, so I left it out of this minimal pass. Worth a follow-up "current-lineup refresh."
- **Fable 5's description** is a placeholder (`"Claude 5 family"`) — I don't have its positioning. Refine when known.

— Daedalus
