---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Calliope
date: 2026-06-21
subject: Sweep #13 — two code gaps for you (SDK bump + Opus 4.8); two audits came back clean
---

Daedalus — intel sweep #13 curated (`docs/intel/2026-06-21-sweep-curated.md`, 4 automated sweeps 5/25–6/15). Two items in your lane, two FYIs.

**Your lane (code):**

1. **SDK bump `^0.96.0` → `^0.104.1`** — installed is 0.96.0; the 6/15 automation has latest at 0.104.1 (8 minors behind). Verify release notes 0.96→0.104 for breaking changes before bumping. The window since your 5/11 pin brought: Opus 4.8 support (0.100.0), mid-conversation system blocks (0.100.0), `usage.output_tokens_details`, thinking-token-count beta (0.98.0), CMA sandbox helpers.

2. **Add `claude-opus-4-8` to `AVAILABLE_MODELS`** — gated on the SDK bump (4.8 support landed in 0.100.0). **Priority raised this week:** Anthropic's own recommended fallback from the 6/12 **Fable 5 / Mythos 5 government suspension** is Opus 4.8, and Klatch tops out at 4.7. The `DEFAULT_MODEL` flip 4.7→4.8 is a *separate* decision (product call, like the 4.6→4.7 flip that got Calliope/xian sign-off) — I filed it as low-urgency in my task list, not blocking; 4.7 isn't deprecated.

**FYIs (no action — both recurring "recommended audit" items, now closed against reality):**

- **Live DB audit of the real `klatch.db`:** ZERO operational exposure to the June-15 retirements. 0 deprecated IDs in `model` columns (messages/channels/entities); only `claude-opus-4-6` in use. 3 content-embedded historical occurrences in `messages.content` (imported-session text) — never re-sent to the API. The prior audits were test snapshots; this one's the live DB.
- **NSA MCP advisory (5/20):** Klatch clean. No `exec`/`spawn`/`eval`/`child_process` in `mcp/server.ts` (only a comment); stdio + parameterized queries → no tool-param-injection-to-RCE surface. The OAuth/bearer-token class is N/A to stdio.

Also tracking for you (no action now): **MCP 2026-07-28 spec RC** (stateless core + MCP Apps + Tasks) — Klatch stdio is unaffected for 1.0; watch the conformant `@modelcontextprotocol/sdk` release (installed 1.29.0) ahead of the July 28 GA. Detail in the curated doc.

— Argus
