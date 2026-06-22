# SDK Bump Risk Assessment — `@anthropic-ai/sdk` 0.96 → 0.104.1

**Author:** Daedalus
**Date:** 2026-06-22 (overnight duty-cycle prep, Fire 5)
**Status:** Assessment complete — bump is **LOW-RISK**. Recommend proceeding with a real-stream confirmation (see §4). Does not bypass the real-stream verify gate; it right-sizes it from "breakage hunt" to "confirmation."

## TL;DR

Bumping `^0.96.0` → `^0.104.1` is low-risk for Klatch. The changelog shows **no breaking changes**, **no `messages.stream()` signature changes**, and **no abort-behavior changes** in the range. More importantly, Klatch consumes the stream through the SDK's **high-level helper** (`stream.on('text')` + `finalMessage()`), which insulates it from all the *additive* raw-event changes (mid-conversation system blocks, thinking-token-count) the changelog flagged. The Fire-2 "verification gap" (tests mock streaming) still means only a **real stream** can confirm — but that verify is now a quick happy-path confirmation, not a high-stakes breakage check.

## 1. Why this matters

The bump is the technical prereq for the `DEFAULT_MODEL` 4.7 → 4.8 flip (4.8 support landed ~v0.100). It also unlocks `claude-mythos-5` / `claude-fable-5` (v0.103) — relevant given the 6/12 government-suspension memo (4.8 is the recommended fallback). So this gates a product decision xian flagged as raised-priority.

## 2. Changelog findings (0.96 → 0.104.x)

| Version | Change | Klatch impact |
|---|---|---|
| **0.100.0** | `claude-opus-4-8` support; **mid-conversation system blocks**; `usage.output_tokens_details` | 4.8 becomes runnable. Mid-conv system blocks = new raw `content_block` types — **but see §3, Klatch is insulated.** |
| 0.98.0 | `thinking-token-count` beta (new optional field in thinking-block deltas) | None — Klatch sets `thinking: {display: 'omitted'}` and doesn't consume thinking deltas. |
| 0.99.0 | Fixed `stop_details` accumulation through `message_delta` in streaming | Neutral/positive — Klatch reads `finalMessage.stop_reason`; the SDK assembles it (the fix makes it *more* correct). |
| 0.101.0 | Middleware (runs before request signing) | None — additive; existing streaming unaffected. |
| 0.103.0 | `claude-mythos-5`, `claude-fable-5` + client-side fallback middleware | Additive; unlocks the suspension-fallback models. Custom fallback logic is optional (not adopted). |
| 0.104.0 | Managed Agents deployments; env-var credentials | None for Klatch's usage. |
| 0.104.1 | `frontier_llm` refusal category (enum expansion) | None (non-breaking enum add). |

**No entry in the range is labeled BREAKING. No change to the `messages.stream()` signature. No AbortController/abort-semantics change.**

## 3. Code-review finding — Klatch is insulated by the high-level API

`packages/server/src/claude/client.ts` consumes the stream via the SDK's **high-level helper**, not manual raw-event parsing:

- `getAnthropicClient().messages.stream({...})` (line ~569) and `.beta.messages.stream({...})` (line ~531)
- `stream.on('text', (text) => …)` (lines ~554, ~582) — semantic text events; the SDK routes/accumulates internally
- `await stream.finalMessage()` (lines ~567, ~591) — SDK-assembled final message; tool_use handled off `finalMessage.content` (line ~595-598)
- `stream.abort()` (line ~39) + `Anthropic.APIUserAbortError` / `AbortError` (line ~654)

Because Klatch listens to the **`text` semantic event** (not raw `content_block_delta`), the additive raw-event changes — new mid-conversation system block types (0.100), thinking-token-count fields (0.98) — never reach Klatch's handlers. The SDK's helper absorbs them. `finalMessage()` + `stop_reason` likewise insulate from the 0.99 delta-accumulation fix.

## 4. The one watch item + recommendation

**Watch item:** Klatch uses `beta.messages.stream()` on one path (line ~531, the compaction path with `stream.on('compaction', …)`). Beta surface can shift more than stable, and the `compaction` event is beta. The changelog flagged no compaction changes in this range, but the real-stream verify should exercise **both** paths.

**Recommendation (for xian / a fresh session — the bump itself stays gated on real-stream verify per Fire 2):**
1. `npm i @anthropic-ai/sdk@^0.104.1 -w packages/server` (use `--cache /tmp/npm-cache` per the known root-owned-cache note).
2. `npx tsc --noEmit` (server) — catch any type drift (expected: none).
3. Full server + client suites green (expected: green — streaming is mocked, so this only proves non-streaming paths).
4. **Real-stream verify (the actual gate):** run the app, send a message and watch a live stream complete on the **stable** path; then exercise the **beta/compaction** path (a long-enough conversation to trigger compaction, or the path that uses `beta.messages.stream`). Confirm text streams, `finalMessage` resolves, tool_use still routes, and abort still works.
5. If all green → the `DEFAULT_MODEL` 4.7 → 4.8 flip is a one-line product call (validation is already dynamic post model-validation-unification; no `AVAILABLE_MODELS` edit needed).

**Net:** the bump is low-risk; the real-stream verify is a ~5-minute confirmation, not a breakage investigation.
