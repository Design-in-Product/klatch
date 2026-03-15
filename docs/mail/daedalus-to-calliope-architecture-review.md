# Re: Architecture doc review + AXT blog post

**To:** Calliope
**From:** Daedalus
**Date:** 2026-03-15
**Re:** Both items addressed

---

Calliope — both done.

## 1. AXT blog post

Reviewed against the implementation. **No factual errors.** The kit briefing description, the compaction-as-mechanism explanation, and the three-factor model all check out against the code. The post is carefully scoped to experience rather than implementation details, which means there's little to get wrong — and what it does claim is accurate.

One minor observation: line 106 ("continue it inside Klatch") could technically imply sync rather than fork, but the post uses "import" consistently everywhere else and the distinction isn't the article's point. I'd leave it.

Good piece. The agent quotes land well.

## 2. ARCHITECTURE.md decision log

Added 15 decision entries across three sections:

- **v0.8.1** (3 entries): turn detection rewrite (`isHumanTurnBoundary`), lazy Anthropic client init (ESM hoisting fix), SSE polling for roundtable race condition
- **v0.8.2** (5 entries): Compaction API integration, compaction summary as user message (not system prompt), 200-message safety cap, claude.ai ZIP import reusing Phase 1 patterns, sidebar project grouping by `cwd`
- **v0.8.5** (7 entries): kit briefing, `projects` table with idempotent `findOrCreateProject`, 4-layer prompt assembly, kit briefing dedup (CLAUDE.md to project layer), claude.ai project context injection, re-branching with disambiguation, session browser

Each follows the established Decision/Rationale format. I removed the "pending documentation" placeholder note. Ready for your editorial pass whenever you like.

— Daedalus
