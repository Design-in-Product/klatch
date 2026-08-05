# Intelligence Sweep — Curated Review — 2026-08-04 (Argus)

**Curated by:** Argus (Quality + Testing), first Amber session
**Covers:** three un-curated automated sweeps since the 7/19 freeze: `2026-07-20`, `2026-07-27`, `2026-08-03`.
**Method:** synthesize across the three weeks (dedupe + thread), then verify the highest-stakes claims against the live codebase — which this time **overturned the automation's headline**, see below.

---

## Headline: the sweeps' top claim is wrong — the model picker is dynamic, and has been since June 21

The 7/27 and 8/03 sweeps' highest-priority item was "Claude Opus 5 (launched 7/24) is NOT in Klatch's picker; the picker is 2 generations stale; Klatch users cannot select the current flagship; Klatch is the only major Claude interface with no path to it." **All of that is wrong against the live code**, and the error is instructive:

- **[VERIFIED, `packages/shared/src/types.ts:9-17`]** `ModelId` is validated at **runtime** against the discovered `/api/models` set (server-side `isValidModel`), not against a compile-time union. The comment block says explicitly: *"The static union was a per-release treadmill against a moving lineup (the bug behind 'Klatch tops out at 4.7')"* — xian-confirmed 2026-06-21.
- **[VERIFIED, `packages/client/src/hooks/useModels.ts` + `packages/server/src/routes/channels.ts:106`, `entities.ts:63`]** The client picker fetches live model discovery from `/api/models`; `AVAILABLE_MODELS` is a **curated label overlay + offline fallback**, not a gate. Server-side validation is `await isValidModel(model)` — runtime, against discovery.

So when the live API lists `claude-opus-5`, Klatch can already offer and accept it. The automation verified "against `types.ts:1-8`" every week — it read the static map as the gate and never read the fifteen lines of comment directly beneath it saying it isn't. That's the wrong-seam version of the stale-doc trap: *a verification step that checks a true fact (the ID is absent from the map) supporting a false conclusion (therefore users can't select it).* Worth remembering when reading any future auto-sweep "verified against" line.

**Caveat on the correction itself:** "the live API lists Opus 5" is per the sweeps' external sources, not verified this session — there is **no `.env` on Amber** (worktrees or main checkout), so no API call was possible. See Amber findings below.

### What actually remains of the model-currency thread (route: Daedalus, small)

1. **Overlay labels are stale.** `claude-opus-4-7` still reads `"Newest Opus"`; no overlay rows for `claude-opus-4-8` or `claude-opus-5` (they'd surface with raw API display names — functional, unlabeled); Sonnet 5's description carries no tokenizer note (same 1×–1.35× tokenizer as 4.7, hits the 160K compaction threshold sooner — the 4.7 comment in types.ts documents exactly this hazard). Label-only change.
2. **[VERIFIED, `useModels.ts:20`]** `buildFallback()` returns `defaultModel: 'claude-opus-4-6'` while `DEFAULT_MODEL` is `'claude-opus-4-7'` — a small offline-fallback inconsistency, one-line fix.
3. **`DEFAULT_MODEL` flip 4.7 → (4.8 or 5) is xian's decision**, per the deliberate-manual-constant design note in types.ts and the precedent of the 4.6→4.7 flip. Not urgent — 4.7 isn't deprecated. Filed as lower-urgency decision, same as the 6/21 curated sweep did for the 4.8 flip.

My own 7/05 mail to Daedalus (`argus-to-daedalus-opus-lineup-refresh-2026-07-05.md`, the "29 days open" item the sweeps kept escalating) asked for an overlay refresh under the pre-correction framing and named 4.8 as flagship — **superseded** by fresh mail filed today (`argus-to-daedalus-model-overlay-refresh-2026-08-04.md`); old thread moved to `read/`.

---

## New find this session (not in any sweep): Node 26 on Amber breaks better-sqlite3@11 — fixed

**[VERIFIED — hit it, fixed it, this session]** Amber runs Node v26.5.0 (Homebrew). `better-sqlite3@11.10.0` (repo pin `^11.7.0`) does not compile against Node 26's V8 (`no member named 'GetPrototype' in 'v8::Object'` etc.). **No worktree on Amber had a successful build** — every agent would have hit this wall at first `npm install`, and the server suite (and the app) cannot run without it. Fix applied: bump to `better-sqlite3@^12.11.1` (engines `20.x–26.x`; v12's breaking changes are dropped old-Node support, not API). Suite result under the bump recorded in today's session log. Also relevant: npm's `allow-scripts` gate on Amber requires one-time approval for `better-sqlite3`, `esbuild`, `fsevents` build scripts — done for my worktree; other agents will need the same in theirs.

---

## Thread — MCP v2: spec final 7/28, package split confirmed, Klatch exposure zero (route: Daedalus, planning only)

Final spec shipped 7/28. The v2 TypeScript SDK **retires the monolithic `@modelcontextprotocol/sdk`** for `@modelcontextprotocol/server` / `@modelcontextprotocol/client` — a package rename requiring code changes, not a semver bump. 10-week Tier-1 migration window started 7/28.

- **[VERIFIED, `packages/server/package.json`]** pin `^1.29.0` auto-resolves to last-1.x — no breakage today.
- **[VERIFIED, grep this session]** zero use of the three deprecated features (roots / sampling / logging) anywhere in `packages/server/src/mcp/` — zero exposure to the protocol deprecations.
- Open check (mine, at migration time): whether stateless-core `initialize` removal touches the stdio path (`mcp/bin.ts:13` `StdioServerTransport`) — described as an HTTP concern; verify when migrating, not before.

## Thread — competitive: Bloome (route: Calliope)

Bloome (bloome.im, launched 7/1) — cloud-hosted multi-agent/multi-model conversation platform; the closest architectural analog to Klatch any sweep has found. Its agents carry only their prompt — exactly the "boring version" PREMISE.md names. The composition-continuity gap Klatch is holding 1.0 for is precisely the differentiator. No delta in the two later sweeps (still at launch state). Strategic framing for the cross-poll brief is Calliope's lane; the premise-side read is that this *strengthens* the case for holding 1.0 rather than pressure to ship faster.

## Claude Code batch (awareness, duty-cycle team)

- **v2.1.210 (7/14)** fixed worktree-isolated subagents mutating the main checkout. Pre-7/14 exposure on the old host is moot post-migration (those worktrees are retired; main's history through the freeze shows no anomalies attributable to this — spot-checked, not exhaustively audited).
- **v2.1.215 (7/19)** `/verify` + `/code-review` no longer auto-run — invoke explicitly. Noted for my own review-gate habit.
- **v2.1.216 (7/20)** quadratic auto-mode slowdown fix — directly good for long duty-cycle fires. **v2.1.219 (7/24)** Opus 5 as CC default; `sandbox.network.strictAllowlist` — relevant to Pard's fire-sandbox design, FYI only.

## SDK + housekeeping

- **`@anthropic-ai/sdk`**: pin **[VERIFIED]** `^0.110.0`; 0.115.0 current (7/26) — 5 minors behind, not in range. Batch with the overlay refresh (in today's Daedalus mail). New API betas riding along (mid-conversation tool changes, server-side fallbacks) become interesting for 5-layer dynamic context once newer models are defaults — not actionable now.
- **Auto-resolving, no action:** Hono 4.12.33 (SSE retry fix relevant and free), Tailwind 4.3.3, React 19.2.8.
- **Zero-exposure retirements [VERIFIED via grep]:** Opus 4.1 (retires 8/5 — tomorrow), `claude-mythos-preview`, legacy Workbench/prompt-tools APIs (8/17). None referenced in `packages/`.
- **Vite 8.x**: deferred posture unchanged (pinned `^6.0.0`, tracked since March).
- **EU AI Act high-risk enforcement (8/2), Anthropic/AMD partnership:** background only; no Klatch surface.

---

## Routing

| Item | To | Vehicle |
|---|---|---|
| Overlay refresh (labels, Sonnet 5 tokenizer note, fallback-default mismatch) + SDK bump `^0.115.0` | **Daedalus** | `argus-to-daedalus-model-overlay-refresh-2026-08-04.md` (supersedes 7/05 mail) |
| MCP v2 package-split migration planning (10-week window, zero exposure today) | **Daedalus** | same mail, FYI section |
| Bloome competitive framing | **Calliope** | this doc + pointer in COORDINATION.md |
| `DEFAULT_MODEL` flip decision | **xian** | lower-urgency; noted for next rollup refresh |
| Node-26/better-sqlite3 wall + allow-scripts + missing `.env` on Amber | **team + Pard** | flagged in COORDINATION.md + today's log |
| MCP stdio `initialize` check | **me** | at migration time, not before |

**Recurring item advanced:** intel curation `last_completed = 2026-08-04`; backlog cleared (was three weeks); `next_due` = next auto-sweep (~2026-08-10).
