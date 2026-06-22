# Intelligence Sweep — Curated Review — 2026-06-21 (Argus)

**Curated by:** Argus (Quality + Testing)
**Covers:** four un-curated automated sweeps since my last curated review (5/18): `2026-05-25`, `2026-06-01`, `2026-06-08`, `2026-06-15`.
**Method:** synthesize across the four weeks (dedupe + thread), then **verify the highest-stakes items against the live codebase + the real `klatch.db`** — the curation value-add the automation can't do.
**Sweep #13** (first since the duty-cycle Phase 2 launch; ran as the due recurring-items task on Fire 2).

---

## Headline: three in-session verifications close recurring "recommended" items

The automated sweeps repeatedly recommended a **live DB audit** (prior audits were test snapshots) and a **MCP tool-param audit** (NSA advisory). Both done this session, plus model-config confirmation:

1. **Live DB audit — ZERO operational exposure to the June-15 retirements.** Queried the real `/Users/xian/Development/klatch/klatch.db` (16 MB, last written 5/18) for the three deprecated IDs (`claude-sonnet-4-20250514`, `claude-opus-4-20250514`, `claude-opus-4-1-20250805`):
   - **Model columns (`messages.model`, `channels.model`, `entities.model`): 0 rows.** The only model in actual use is `claude-opus-4-6` (both channels and entities).
   - **Content-embedded: 3 rows** (`messages.content LIKE` — 1× sonnet-4, 2× opus-4). These are historical imported-session *text*, NOT re-sent to the API: new requests use the channel's current model, never an ID embedded in message content. Exactly the benign case the 6/08 sweep anticipated. **No operational exposure.** The June-15 retirements are a non-event for Klatch; the recurring "live DB spot-check" item is now closed against the real DB.

2. **NSA MCP advisory (5/20) — Klatch clean.** The advisory's only applicable concern for a stdio server is tool-parameter injection → command execution. Verified: **no `exec`/`spawn`/`execSync`/`eval`/`child_process`/`shell` in `mcp/server.ts`** (the single grep hit is a comment — "the client spawns this", i.e. the client spawns Klatch, not vice-versa). Tools are read-only resource handlers + `reflect` (parameterized `better-sqlite3` writes). No RCE surface; the OAuth/bearer-token class is N/A to stdio. Confirms the 5/11 conclusion against current code. Closed.

3. **Model config confirmed (`packages/shared/src/types.ts`):** `DEFAULT_MODEL = claude-opus-4-7`; **`claude-opus-4-8` absent from `AVAILABLE_MODELS`.** The Opus 4.8 gap (open since 5/28) stands.

---

## Thread 1 — Vendor-risk is compounding (strategic; route: Calliope)

A four-week arc, not four separate items: **Stainless acquisition** (5/18 — Anthropic owns its SDK toolchain in-house) → **IPO S-1 filed** (6/01 — first AI lab to begin the public-company process; ~$965B valuation, $47B ARR) → **Policy Frameworks** (6/10 — Anthropic itself advocates government authority to *block* frontier models) → **Fable 5 / Mythos 5 government suspension** (6/12 — that authority *exercised*: US export-control directive forced a global takedown three days after GA, the first documented government-forced takedown of a deployed frontier model).

**Why it matters for Klatch:** single-vendor dependency on Anthropic now carries a *demonstrated* regulatory-closure risk (model takedowns with <1 week notice), on top of post-IPO monetization-pressure risk. The **cross-vendor entity channels** roadmap item (Someday/Maybe) gains real strategic weight as a hedge — this is the strongest evidence yet for the cross-vendor moat argument. No code action; a roadmap-framing signal for the cross-poll brief. Klatch has **no code exposure** to the suspended models (neither `claude-fable-5` nor any Mythos 5 ID is in `AVAILABLE_MODELS`).

## Thread 2 — Model currency: two code gaps (actionable; route: Daedalus)

1. **Add Opus 4.8 to `AVAILABLE_MODELS`** (released 5/28; still absent). **Priority raised by Thread 1:** Anthropic's own recommended fallback from the Fable/Mythos suspension is Opus 4.8 — it's now the sensible ceiling, and Klatch tops out at 4.7. Gates on the SDK bump (4.8 support landed in SDK 0.100.0).
2. **SDK bump `^0.96.0` → `^0.104.1`** (8 minors behind per the 6/15 automation; installed = 0.96.0 confirmed). Unblocks Opus 4.8; also brings mid-conversation system blocks (0.100.0), `usage.output_tokens_details`, thinking-token-count beta (0.98.0), CMA sandbox helpers. Verify release notes 0.96→0.104 for breaking changes before bumping (not a code assertion — a review gate).

The **`DEFAULT_MODEL` flip 4.7 → 4.8** is a *separate decision* (like the 4.6→4.7 flip, which got xian/Calliope sign-off) — filed as a lower-urgency decision in my task list, not urgent (4.7 is not deprecated). **Opus 4.1 deprecation (Aug 5)** — Klatch clean (absent from `AVAILABLE_MODELS`); already covered by this session's DB audit (0 rows).

## Thread 3 — MCP ecosystem (awareness; no 1.0 action)

- **MCP 2026-07-28 spec RC** (locked 5/21): stateless protocol core, MCP Apps (sandboxed HTML UIs), Tasks extension. Klatch is **stdio-only** (`mcp/bin.ts:13`) — unaffected for 1.0. Track the conformant `@modelcontextprotocol/sdk` release (installed 1.29.0; Tier-1 SDKs have a 10-week window to July 28). **MCP Apps** is interesting for the "universal context transport" Someday/Maybe (artifact canvas via spec-stable MCP Apps).
- **NSA advisory** — closed above.

## Low / deferred (no action)

Hono 4.12.25 (pin `^4.12.18` auto-resolves), Tailwind 4.3.1 (`^4.0.0` auto-resolves), React 19.2.7 (`^19.0.0`, no Server Actions usage), **Vite still on `^6.0.0`** (8.x is 2 majors ahead — Rolldown/Babel-removal migration, deferred since March, no new urgency). **Epicenter** (5/25) + **MemPalace** (no new dev) — local-first SQLite parallels; both worth a brief read before Step 11 (Search) design. **CC 2.1.157–2.1.176** — agent-team awareness (nested sub-agents, `fallbackModel`, SendMessage authority hardening); no Klatch code.

---

## Routing

| Item | To | Why |
|---|---|---|
| SDK bump 0.96→0.104.1 + add Opus 4.8 to AVAILABLE_MODELS | **Daedalus** | code, his lane; Opus 4.8 priority raised by Fable/Mythos suspension |
| Vendor-risk arc (Stainless→IPO→policy→Fable/Mythos) + cross-vendor moat framing; Epicenter for Step 11 | **Calliope** | strategic / cross-poll brief framing |
| `DEFAULT_MODEL` 4.7→4.8 flip decision | task list (Blocked-on-xian, low-urgency) | product decision; not urgent (4.7 not deprecated) |
| Live DB audit clean; NSA MCP clean | (closed this session) | verified — no action |

**Recurring item advanced:** weekly intel sweep `last_completed = 2026-06-21`, `next_due = 2026-06-28`.
