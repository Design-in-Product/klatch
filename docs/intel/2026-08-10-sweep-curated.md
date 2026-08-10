# Intelligence Sweep — Curated Review — 2026-08-10 (Argus)

**Curated by:** Argus (Quality + Testing), duty-cycle fire (START, unattended, no network)
**Covers:** one automated sweep since the 8/04 curation: `2026-08-10-sweep.md`. On schedule — 8/04's curated doc named `next_due = ~2026-08-10`.
**Method:** re-verify the sweep's two highest-stakes claims directly against the live codebase (not the automation's own "Verified against" lines) before routing. Both held up this time — no overturn, unlike 8/04.

---

## Verified this session (independent of the automation's own claims)

- **[VERIFIED, `packages/server/package.json:20`]** `"hono": "^4.12.18"` — confirmed out of range of the new `4.13.x` minor. Sweep claim (item #2) holds.
- **[VERIFIED, `packages/server/package.json:14`]** `"@anthropic-ai/sdk": "^0.110.0"` — confirmed out of range of `0.116.0`. Sweep claim (item #4) holds.
- **[VERIFIED, `packages/shared/src/types.ts:2`]** `claude-opus-5` already carries an overlay row (`label: 'Opus 5'`) — Daedalus's 8/04 lineup refresh (`55cddb8`) is live on this branch. The sweep's carry-over line title ("Opus 5 overlay label gap") is misleading as a title; the actual open item is narrower: `DEFAULT_MODEL` at `types.ts:31` is still `'claude-opus-4-7'`, which is Daedalus's already-tracked open-for-xian ask #2 in `COORDINATION.md`, not new work.

## Routed this session

**Two items folded into Daedalus's already-open lineup-refresh thread** (`daedalus-to-argus-lineup-refresh-landed-2026-08-04.md`, his §4 SDK bump still queued) rather than opening new threads — reply filed: `argus-to-daedalus-hono-sdk-bump-targets-2026-08-10.md`.

1. **Hono `^4.12.18` → `^4.13.1`** — new minor (not a patch), ~1.25x route perf via reduced `Headers` allocations; no breaking changes reported for the SSE/Node-adapter stack Klatch uses. New ask, not previously routed.
2. **SDK bump target retargeted `^0.115.0` → `^0.116.0`** — his §4 was already queued behind a release-notes review at 0.115; the target has moved one more minor since. Same gate (his own review), just a moving target correction.

## Not routed — awareness only, no Klatch code change

- **CC v2.1.224 (Aug 7): cross-session messaging (`ListAgents`/`SendMessage`) + self-hosted runner.** Strategic note, not a task: Anthropic has now built a native Claude-Code-side analogue of what Klatch's directed/roundtable modes do at the application layer. Worth keeping in view for Step 10's export-to-Code framing (a channel exported to Claude Code could keep orchestrating natively) and as a differentiation argument (entity routing stays Klatch's moat only if this stays Anthropic-only). No action item; flagging for Calliope's cross-poll judgment more than Daedalus's queue.
- **Managed Agents advisor role + session budget cap (Aug 7).** Architecturally interesting — advisor role is a server-side validation of Klatch's directed-mode pattern; budget caps are relevant background for Step 10 design. No code change.
- **CC v2.1.221–223 security + Focus view (Aug 3–5).** Routine hardening; Focus view (collapsing tool-use into summaries) parallels Klatch's existing artifact-summarization for imports. No action.
- **Dreams now supports Opus 5 (Aug 1).** Delta only on `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`, which already covers the import/export contract implications independent of which model dreams. No new analysis needed.
- **Sonnet 5 intro-pricing deadline (Aug 31, 21 days out at sweep time).** Carry-over, no new action beyond the already-filed tokenizer-note ask.
- **Inference hooks beta, CC v2.1.225–226, Bloome no-delta, Labrador no-delta.** Low relevance, no Klatch surface, no action.

---

## Routing table

| Item | To | Vehicle |
|---|---|---|
| Hono `^4.12.18` → `^4.13.1` (new ask) | **Daedalus** | `argus-to-daedalus-hono-sdk-bump-targets-2026-08-10.md` |
| SDK bump target `^0.115.0` → `^0.116.0` (retarget of his already-queued §4) | **Daedalus** | same mail |
| Cross-session messaging strategic framing | **Calliope** (cross-poll judgment) | this doc, no separate mail — low urgency |
| Everything else this sweep | — | no action, logged above for the record |

**Recurring item advanced:** intel curation `last_completed = 2026-08-10`; `next_due` = next auto-sweep (~2026-08-17, one-week cadence held since 8/04).
