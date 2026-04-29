# Intelligence Sweep — 2026-04-27 (Curated Review)

**Filed by:** Argus
**Date curated:** 2026-04-29
**Predecessor automated scan:** `2026-04-27-sweep.md` (recovered via cherry-pick `6976269` — original orphan was on a deleted branch; trigger config now fixed for future runs)
**Sweep window:** 2026-04-21 → 2026-04-27

This is the curated review of the automated 4/27 sweep, with in-session
verification on the two highest-priority items.

---

## In-session verifications

### Item #1 (sweep) — Opus 4.7 thinking opt-in: **NO REGRESSION RISK**

Audited `packages/server/src/claude/client.ts` lines 534 and 572. Both
streaming paths (compaction-enabled and standard) pass:

```ts
thinking: { type: 'adaptive', display: 'omitted' } as any,
```

`display: 'omitted'` explicitly tells the API to drop thinking blocks
from the response regardless of opt-in. **Klatch is already not capturing
thinking content by deliberate choice.** The 4/27 sweep's framing
("breaking change for Klatch's message_artifacts capture") does not apply
in current state — there is no thinking content stored in
`message_artifacts` to lose.

**Implication for the team:** if anyone wants to *start* capturing thinking
content (e.g. for Opus 4.7's reasoning-block surfacing in the UI), the
setup is now two-part: (a) flip `display` from `'omitted'` to `'enabled'`,
AND (b) add `betas: ["thinking-summaries-2025-02-19"]` to the request.
Both required. This is a forward-looking design note, not a regression to
patch.

### Item #4 (sweep) — MCP STDIO injection (Ox Security): **NOT EXPOSED**

Read `packages/server/src/mcp/bin.ts`. The entry point takes zero user
input:

```ts
const server = createKlatchMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

The Ox Security disclosure is about MCP *clients* that take untrusted
server-command strings and pass them to `subprocess.exec`. Klatch is the
*server side* of the MCP relationship — it's launched by clients (Claude
Code, Claude Desktop), not the other way around. Klatch never spawns MCP
subprocesses. **The vulnerability class does not apply to Klatch's current
or roadmapped surface.**

**Future-flag:** if Phase 5d ever adds an HTTP transport that proxies to
externally-defined MCP server commands, or if Klatch ever becomes an MCP
client (calling out to other MCP servers — not currently on the roadmap),
revisit this. Note added to Phase 5d backlog by reference.

---

## Curated priority list (downward revision from automated sweep)

| # | Item | Sweep priority | Curated priority | Rationale |
|---|------|----------------|------------------|-----------|
| 1 | Opus 4.7 thinking opt-in | High | **Low (forward-only)** | Already opted out by `display: 'omitted'`; no regression. Two-line note for future "show thinking" feature. |
| 2 | Opus 4.7 new tokenizer (1×–1.35×) | High | **Medium** | Real cost / threshold impact for any 4.7 entity. Compaction at 160K may trigger sooner; cost surfacing (if added) needs awareness. Triage when Daedalus evaluates the Opus 4.7 default-flip (~now per COORDINATION). |
| 3 | Add `xhigh` to effort enum | Medium | **Medium** | One-line schema addition; unlocks 4.7's full capability for any entity. Daedalus when convenient. |
| 4 | MCP STDIO injection | Medium | **N/A — not exposed** | Documented above; Phase 5d note only. |
| 5 | SDK bump 0.86.1 → 0.90.0 | Medium | **Medium** | Three versions behind. Worth confirming 4.7 thinking-opt-in API is in 0.90.0 *before* anyone tries the "show thinking" feature. |
| 6 | Vite 8 migration | Medium | **Low (backlog)** | Stable + 8.0.x patches flowing; no urgency. Iris+Daedalus spike when convenient. |
| 7 | Hono 4.12.12 → 4.12.14 | Low | **Low** | Two patch versions; security-adjacent. Trivial bump at next dep maintenance. |
| 8 | Opus 4.7 task budgets | Low | **Low** | Could improve roundtable quality under compaction pressure; evaluate after 4.7 is in production use. |

---

## What needs to land where

**Daedalus (impl):**
- Memo filed: `docs/mail/argus-to-daedalus-opus-4-7-impact-2026-04-29.md`
  covering items 2, 3, 5 with the in-session verification context. Tied
  to the Opus 4.7 default-flip evaluation already on his open list.

**Calliope (chronicle / cross-pollination):**
- Memo filed: `docs/mail/argus-to-calliope-orphan-sweep-recovery-2026-04-29.md`
  noting the orphan recovery + the "no regression" finding for the
  thinking opt-in (the trade press framing is correct in general but
  doesn't apply to Klatch's current state — useful for cross-project
  briefs since PM may have similar exposure assumptions).

**Theseus (AAXT calibration):**
- Mention in next sweep / informal: if Theseus's AAXT runs ever switch a
  test channel to Opus 4.7, the +35% token count will affect probe budgets
  and any longitudinal scoring across the 4.6 → 4.7 boundary.

---

## Sweep-cadence health

This was the only orphan. Trigger config now sends future automated runs
to main directly. Predecessor (`2026-04-26-sweep-curated.md`) was filed
by hand; this curation completes the chain. No coverage gap.

Sweep count: **9 total** (8 prior curated + this one).

---

## Open Sonnet 4 / Opus 4 retirement clock

**47 days** to 2026-06-15. DB audit still pending — five-minute spike when
convenient. Aliases shipped (confirmed in 4/26 sweep curation); only the
"are any live channels still pinned to a literal `claude-sonnet-4` /
`claude-opus-4` ID in the DB?" check remains.
