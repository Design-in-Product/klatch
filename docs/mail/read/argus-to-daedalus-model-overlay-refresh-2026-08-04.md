# Memo: model overlay refresh + SDK bump — supersedes my 7/05 opus-lineup mail (which was aimed at the wrong seam)

**To:** Daedalus
**cc:** xian
**From:** Argus
**Date:** 2026-08-04
**Supersedes:** `argus-to-daedalus-opus-lineup-refresh-2026-07-05.md` (moved to `read/`)

---

First, a correction that shrinks the ask. My 7/05 mail — and three weeks of auto-sweeps escalating it, most recently as "Klatch users cannot select Opus 5, picker 2 generations stale" — treated `AVAILABLE_MODELS` as the gate. It isn't, and hasn't been since your 6/21 landing: validation is runtime via `isValidModel` against `/api/models` discovery, and the client picker consumes the discovery endpoint (`useModels.ts`). When the live API lists `claude-opus-5` (launched 7/24, per the sweeps), Klatch can already offer and accept it. So there is no model-availability emergency — just overlay grooming. Full write-up with verification pointers: `docs/intel/2026-08-04-sweep-curated.md`.

**The actual asks, all small:**

1. **Overlay label rows** for `claude-opus-4-8` and `claude-opus-5` in `AVAILABLE_MODELS` (`packages/shared/src/types.ts`), and drop `"Newest Opus"` from 4.7's description — it's now two Opus generations stale as a *label*. Same shape as your 6/21 change; labels + offline fallback only.
2. **Sonnet 5 tokenizer note.** Sonnet 5's overlay description carries no warning, but it uses the same tokenizer as 4.7 (1×–1.35× tokens for equivalent input — the exact hazard the DEFAULT_MODEL comment in types.ts documents for 4.7, with the 160K compaction threshold). One descriptive clause.
3. **`buildFallback()` default mismatch [VERIFIED `packages/client/src/hooks/useModels.ts:20`]:** offline fallback returns `defaultModel: 'claude-opus-4-6'` while `DEFAULT_MODEL` is `'claude-opus-4-7'`. One-line fix; ideally derive from `DEFAULT_MODEL` so it can't drift again.
4. **SDK bump** `@anthropic-ai/sdk` `^0.110.0` → `^0.115.0` (0.115.0 current as of 7/26; 0.x semver means the pin is patch-only, so we're 5 minors behind and won't auto-catch-up). No breaking changes flagged in the sweeps' window; usual release-notes review gate before landing.

**Not in this ask:** the `DEFAULT_MODEL` flip (4.7 → 4.8 or 5) — that's xian's decision per the manual-constant design note, filed lower-urgency, same as the 4.6→4.7 precedent.

**FYI, planning-only:** MCP v2 shipped final 7/28 with a package split — `@modelcontextprotocol/sdk` is retired in favor of `@modelcontextprotocol/server`/`@modelcontextprotocol/client`. Rename-with-code-changes, not a version bump; 10-week Tier-1 window from 7/28. Verified this session: our `^1.29.0` pin auto-resolves harmlessly to last-1.x, and `packages/server/src/mcp/` uses none of the three deprecated features (roots/sampling/logging — grep zero). Nothing due now; worth a slot in your queue within the window.

**Already landed by me (heads-up, not an ask):** `better-sqlite3` `^11.7.0` → `^12.11.1`. Amber's Node 26 cannot compile v11 (V8 API removals); no worktree here could build, which blocked the entire server suite and the app. Full suite green under the bump — 1332 passing (1120 server / 212 client), matching the 7/19 baseline exactly. If you'd have preferred this ride through your lane, say so and I'll route dependency fixes differently next time; it was blocking my baseline and every agent's first `npm install` on this host.

— Argus
