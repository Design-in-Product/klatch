# Intelligence Sweep — Curated Review — 2026-09-07 (Argus)

**Curated by:** Argus (Quality + Testing), duty-cycle fire (START, unattended)
**Covers:** `2026-09-07-sweep.md`. Last curation was `2026-08-31-sweep-curated.md` — on the weekly cadence, no gap this time.
**Method:** re-verify the highest-stakes claims directly against the live codebase (not the automation's own "Verified against" lines) before routing.

---

## Verified this session (independent of the automation's own claims)

- **[VERIFIED, `packages/shared/src/types.ts:2,8,31`]** `claude-fable-5` present, `DEFAULT_MODEL = 'claude-opus-5'` — no `claude-fable-5-1` entry anywhere in the file. The sweep's headline item holds: Fable 5.1 shipped GA Sep 1, confirming the 8/31 sweep's "leaked, unconfirmed" flag, and Klatch's model list is genuinely stale by one entry.
- **[VERIFIED, `packages/server/package.json:15`]** `"@anthropic-ai/sdk": "^0.122.0"` — confirms Daedalus's bump (since 8/31's 6-minor HIGH escalation) landed and holds. Gap to 0.124.0 is 2 minors, correctly downgraded to MEDIUM.
- **[VERIFIED, `packages/server/package.json:17`, `packages/server/src/mcp/bin.ts:18`]** `"@modelcontextprotocol/sdk": "^1.29.0"`, `StdioServerTransport` — unmigrated, matches the sweep. The sweep's Oct-6-deadline correction (v1 TS gets bug fixes ≥6 months post-v2-ship, not a hard Oct 6 cliff) is a claim about an external blog post, not Klatch code — not independently re-checkable from this repo, taking it at the sweep's sourcing.
- **[VERIFIED, `package.json:22`]** `"vitest": "^4.0.18"` — confirmed won't auto-resolve to Vitest 5.0 (shipped Sep 3). New item, no prior mention in `docs/intel/` — correctly flagged as needing a deliberate future migration given the suite's size (1535 server + 260 client tests as of the last verified fire, 9/6 STOP).

No overturns this pass — the sweep's own verification lines all check out against direct reads.

## Routed this session

**One item mailed to Daedalus** — `claude-fable-5-1` is a straightforward `types.ts` addition (same shape as the existing `claude-fable-5` entry) and the mid-conversation tool changes beta is architecturally relevant to directed/roundtable mode design, both his lane: `argus-to-daedalus-fable-5-1-types-entry-and-tool-changes-beta-2026-09-07.md`.

1. **`claude-fable-5-1` missing from `ModelId`/`MODEL_INFO`/`DEFAULT_MODEL` list** — GA since Sep 1, same pricing as Fable 5 with a 75% cache-read cost cut ($1→$0.25/M). Straightforward addition, no breaking change.
2. **Mid-conversation tool changes beta (SDK 0.121.0+, already within Klatch's `^0.122.0` range)** — `tool_addition`/`tool_removal` blocks between turns, preserving prompt cache. No prior mention anywhere in `docs/intel/` or `docs/mail/`. Flagged for awareness only — potentially relevant to directed/roundtable entity-visible-tool-subsets, no code action requested.

## Not routed — awareness only, no Klatch code change

- **CC v2.1.257–263 (Sep 1–6).** `managedMcpServers` is genuinely new context for the someday/maybe "Klatch as managed MCP server" vision — no prior mention, worth remembering if that item is ever picked up, but nothing to act on today. `bashOutputMaxChars`/128K inline output is CC-host-side, not Klatch code.
- **Vitest 5.0 (Sep 3).** Noted above as verified; not acting now — a version bump of the test runner underlying 1500+ tests warrants a deliberate migration fire of its own, not an opportunistic change mid-duty-cycle. Will stay on Argus's own radar for a future dedicated pass rather than being routed to anyone else.
- **Hono 4.13.7, Vite 8.2.2, MemPalace 41.2K stars, Labrador no-delta, Anthropic IPO prospectus/investor day, React 19.3 pending.** All within existing pin ranges or no Klatch exposure — long-standing carry-overs, unchanged posture, matches the sweep's own LOW framing.
