# Intelligence Sweep — Curated Review — 2026-08-31 (Argus)

**Curated by:** Argus (Quality + Testing), duty-cycle fire (START, unattended)
**Covers:** three backlogged automated sweeps in one pass — `2026-08-17-sweep.md`, `2026-08-24-sweep.md`, `2026-08-31-sweep.md`. Last curation was `2026-08-10-sweep-curated.md`; the weekly cadence broke down for three cycles (no Argus log between 8/10 and this fire mentions curation — checked directly, not recalled). Catching up in one pass rather than backfilling three separate docs, since the 8/17 and 8/24 carry-over tables already self-superseded inside the 8/24 and 8/31 sweeps themselves.
**Method:** re-verify the highest-stakes claims directly against the live codebase (not the automation's own "Verified against" lines) before routing, same discipline as 8/10.

---

## Why the gap happened (for the record, not an excuse)

Between 8/10 and 8/31, Argus's fires were substantially occupied by AAXT probe-design/research-round work (Rounds 92–95 and the recall-tool line) and the routine no-op verification cycle. Intel curation is a real duty-cycle work unit and it silently lapsed for three weeks — nobody was blocked on it (no sweep's items were time-critical enough to force the issue), but that's luck, not design. Noting this in `docs/COORDINATION.md` below as a cadence fix, not just closing the backlog.

## Verified this session (independent of the automation's own claims)

- **[VERIFIED, `packages/server/package.json:15`]** `"@anthropic-ai/sdk": "^0.116.0"` — confirmed unchanged since Daedalus's 8/11 bump. All three sweeps' escalating gap claims hold: 1 minor (8/17, →0.117.1) → 4 minors (8/24, →0.120.0) → 6 minors (8/31, →0.122.0). The gap has now tripled across three sweeps without a bump landing.
- **[VERIFIED, `packages/server/package.json:17`]** `"@modelcontextprotocol/sdk": "^1.29.0"` — confirmed unmigrated. The Oct 6 v1.x EOL deadline is now genuinely close: 8/17 sweep said 7 weeks, 8/24 said 6, 8/31 says ~5. No migration spike has started.
- **[VERIFIED, `packages/server/src/mcp/bin.ts:13,18`]** `StdioServerTransport` confirmed — Klatch's MCP server is stdio-only, so the v2 Hono-adapter detail (8/24 sweep item #3) is planning context only, not a live gap.
- **[VERIFIED, `packages/server/package.json:21`]** `"hono": "^4.13.1"` — within range for all patch releases noted across the three sweeps (4.13.2 → 4.13.3 → 4.13.5). No action.
- **[VERIFIED, `packages/shared/src/types.ts:31`]** `DEFAULT_MODEL = 'claude-opus-5'` — the 8/17 sweep's "RESOLVED" carry-over claim holds; this was already-shipped work from before the gap, not new.
- **[VERIFIED, `packages/shared/src/types.ts`]** no `claude-fable-5-1` entry exists — the 8/31 sweep's "Fable 5.1 leaked, unconfirmed" item is correctly framed as a watch-only item; nothing to change today.
- **[VERIFIED, `packages/server/src/aaxt/auxiliary.ts:74` vs `:88-113`]** `temperature: 0.3` is present only in `queryOpenAI` (line 74); `queryAnthropic` (lines 88-113) sends no `temperature` field. The 8/31 sweep's "Klatch's Anthropic path is clean of the Sonnet 5/Opus 4.8 breaking parameter changes" claim holds on direct read, not just the automation's grep.

No overturns this pass — all three sweeps' framing held up under independent re-verification, unlike 8/04's history of one overturn.

## Routed this session

**One item folded into a new thread to Daedalus** — the SDK gap is now the clearest actionable item across all three backlogged sweeps and has never been mailed since 8/17 (the 8/17 and 8/24 gap deltas were noted in-sweep but not separately routed, per the un-curated backlog). Filed: `argus-to-daedalus-sdk-gap-6-minors-2026-08-31.md`.

1. **SDK `^0.116.0` → `^0.122.0`** — 6 minors behind, widened 2 more since 8/24's already-escalated 4-minor gap. No breaking changes reported per any of the three sweeps. Straightforward bump.
2. **MCP SDK v2 migration — flagged as needing a spike, not yet started.** ~5 weeks to the Oct 6 v1.x EOL per the 8/31 sweep (v1.x itself stays security-patched through ~Jan 2027 per the 8/17 sweep, so this isn't a hard cliff, but planning should start). Not requesting immediate action — routing for Daedalus's own prioritization since it competes with whatever else is queued.

## Not routed — awareness only, no Klatch code change

- **Anthropic global text/file watermarking (8/17, HIGH).** Strategic note for Steps 10/10.5 design record: all conversation text flowing through Klatch (imported and exported) now carries an invisible Anthropic watermark from Aug 2 models onward. No code action. Worth Calliope's or Daedalus's awareness when Step 10 (export to Claude Code) design starts — flagging here since it's a first mention, not previously in `docs/intel/`, `docs/mail/`, or `docs/research/`.
- **Sonnet 5 price made permanent (8/24, HIGH).** Resolves the Aug 31 deadline tracked since 8/03. $2/$10 per MTok indefinitely. No code action; background context if entity-default cost discussions come up.
- **CC v2.1.229–251 (spanning all three sweeps).** Routine version churn — SSE keepalive, MCP OAuth fix, `/cost`/`--max-budget-usd`, and (newest, 8/31) PreModelSwitch/PostModelSwitch hooks. The hook pair is the one genuinely novel item: no prior mention anywhere in `docs/intel/` or `docs/mail/`, and architecturally relevant to a future Step 10 design (a Klatch-exported session signaling model-context changes to stay consistent with the source entity). No code action now; noting for whoever picks up Step 10 design.
- **Claude Agent SDK 0.2.144 → 0.2.147.** Step 10 dependency, version-tracking only.
- **Anthropic platform features (workspace-id header, Admin API GA, Managed Agents domain filtering, Files API on Foundry).** None apply — Klatch is single-user, doesn't use Admin API, Managed Agents, or Foundry.
- **Vite 8.2.1 → 8.2.2, MCP Roadmap Aug 22, IPO roadshow, Labrador no-delta, EU AI Act enforcement.** No Klatch exposure or action across any of the three sweeps; long-standing carry-overs, unchanged posture.

---

## Routing table

| Item | To | Vehicle |
|---|---|---|
| SDK `^0.116.0` → `^0.122.0` (6-minor gap) | **Daedalus** | `argus-to-daedalus-sdk-gap-6-minors-2026-08-31.md` |
| MCP SDK v2 migration spike (needed, ~5 weeks to Oct 6 EOL) | **Daedalus** | same mail |
| Watermarking + PreModelSwitch/PostModelSwitch hooks — Step 10 design awareness | **Calliope / whoever designs Step 10** | this doc, no separate mail — not urgent |
| Everything else across all three sweeps | — | no action, logged above for the record |

**Recurring item advanced:** intel curation `last_completed = 2026-08-31` (covering 8/17, 8/24, 8/31 in one pass); `next_due` = next auto-sweep (~2026-09-07, one-week cadence). **Process note added to `docs/COORDINATION.md`:** curation is a checked item now, not an assumed one — verify `ls docs/intel/*-sweep.md` against the last curated file at every START fire, not just when it happens to surface via another agent's log.
