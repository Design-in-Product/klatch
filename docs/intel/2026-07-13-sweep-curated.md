# Intelligence Sweep #16 — 2026-07-13 (Curated)

**Filed by:** Automated External Scanner  
**Curated by:** Argus, 2026-07-19  
**Scope:** External sources, 7-day window (2026-07-06 → 2026-07-13)  
**Predecessor:** `2026-07-06-sweep.md`  
**Raw sweep:** `2026-07-13-sweep.md`

---

## Curation Summary

Six carry-over items from the 7/06 sweep (Opus 4.8 gap, Sonnet 5 tokenizer, MCP RC) remain open and are tracked in the rollup. This curation covers the 7/13 window additions.

**Headline this window:** Managed Agents memory API now has a stable versioned beta header (`agent-memory-2026-07-22`), advancing Anthropic's platform-side alternative to Klatch's Step 10.5 persona-capture approach on a faster clock than sweeps had tracked. Route to Daedalus + Calliope for differentiation articulation before any Step 10.5 sprint.

**Operational:** Fable 5 suspension/restoration backstory now confirmed. The model was dark for ~3 weeks (June 12–July 1) before being added to Klatch's picker (July 5). Smoke-test recommended. Mythos 5 is correctly absent; no action.

**API key expiration surface:** Verified `client.ts:664` — `Anthropic.AuthenticationError` IS caught and surfaces a user-visible error message ("Invalid API key..."). However, the message doesn't distinguish expired key from invalid key. Minor UX gap; routed to Daedalus as low-priority follow-up.

---

## HIGH — Action required

### 1. Managed Agents memory `agent-memory-2026-07-22` — stable versioned header

**What:** The beta header for Managed Agents memory stores has been versioned as `agent-memory-2026-07-22`. Memory listing now has stable server-defined order; `depth` accepts 0/1/omitted; `path_prefix` must end with `/`. SDK 0.110.0 (Klatch's current pin) ships this by default.

**Why it matters for Klatch:** This is the production stabilization of the "Dreaming" capability. Anthropic's platform-managed memory arc (cloud-hosted, session-persistent) is advancing on a faster clock than sweeps had tracked. It addresses the same user need Klatch's Step 10.5 targets via a different path (platform-managed vs. local-first). The differentiation case needs to be articulated before the next 10.5 sprint, while that articulation is still straightforward.

**No code change needed.** Klatch uses `messages.stream`, not Managed Agent sessions; the memory store API requires Managed Agent sessions.

**Action:** Route to Daedalus + Calliope. Filed `argus-to-daedalus-managed-agents-memory-stable-2026-07-19.md`.

**Verified:** SDK `^0.110.0` confirmed in `package.json`. Klatch not on Managed Agents.  
**Prior art:** Dreaming research spike `docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md` (decisions D1–D5 still parked).

---

### 2. Fable 5 suspension/restoration + Mythos 5

**What:** Fable 5 was suspended June 12 under US export-control directive, restored globally July 1. It was dark for ~3 weeks before Klatch added it to the picker on July 5. Mythos 5 (cybersecurity/biology safeguards lifted, restricted availability) revealed this window — not a picker candidate.

**Actions:**
1. **Smoke-test Fable 5** (`claude-fable-5`) in entity picker to confirm post-restoration response.
2. **Description update** — current placeholder `'Claude 5 family'` is uninformative. Suggested: `'Frontier capability, export-control-cleared'` or similar. Route to Daedalus.
3. **Mythos 5** correctly absent from picker; no action needed.

**Verified:** `claude-fable-5` present in `packages/shared/src/types.ts`. Mythos 5 model ID absent (correct).

---

## MEDIUM — Monitor / route

### 3. Claude Code 2.1.207 — Agent View PR-linking

Agent View rows now show colored state + classifier-written headline. PR-linked sessions visible in `claude agents` TUI. No Klatch code change.

**Design signal:** The PR-linking direction maps onto Klatch's subagent introspection and conversation lineage visualization vision items. Worth reading as design input for future Step 11 work.

---

### 4. Tailwind CSS 4.3.2 — scrollbar utilities in range

First-party scrollbar styling utilities, logical property utilities, zoom/tab-size. Klatch pins `^4.0.0` — 4.3.2 is free on next install.

**Opportunity:** Scrollbar utilities applicable to message-list overflow areas and entity picker. Low-effort quality improvement, no breaking changes. Route to Daedalus when relevant.

---

### 5. API key expiration — surface gap verified

**Finding:** `client.ts:664` catches `Anthropic.AuthenticationError` and surfaces "Invalid API key. Set ANTHROPIC_API_KEY in .env and restart the server." via SSE error event. This IS user-visible.

**Gap:** The message doesn't distinguish an expired key from an invalid key. A user who created a key with expiration would see "Invalid API key" when their key is valid but expired — confusing.

**Recommendation:** Minor copy update on the error message to mention expiry as a possibility. E.g., "Invalid or expired API key. Check ANTHROPIC_API_KEY in .env — if you set an expiration date on the key, it may have expired." Route to Daedalus as low-priority UX copy fix.

---

## LOW — No action

| Item | Status |
|------|--------|
| Vite 8.1.4 + Vite+ beta | Deferred lift unchanged; Vite+ long-horizon watch |
| Hono 4.12.27 | Auto-resolves within `^4.12.18` pin |
| Claude Opus 4.1 retirement (Aug 5) | Zero exposure — not in AVAILABLE_MODELS |
| MemPalace | No architectural delta; reference doc `docs/research/mempalace-step-11-reference.md` current |
| Labrador / Erika Flowers | No new developments |

---

## Routing log

| Item | Routed to | Memo | Status |
|------|-----------|------|--------|
| Managed Agents memory stable | Daedalus + Calliope | `argus-to-daedalus-managed-agents-memory-stable-2026-07-19.md` | Filed 7/19 |
| Fable 5 description update | Daedalus | included in managed-agents memo | Filed 7/19 |
| API key expiration copy gap | Daedalus | included in managed-agents memo | Filed 7/19 |
| Tailwind scrollbar utilities | Daedalus (future) | — | Deferred, no urgency |
