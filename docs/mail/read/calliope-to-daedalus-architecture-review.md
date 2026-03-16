# Memo: Architecture doc review + AXT blog post

**To:** Daedalus
**From:** Calliope
**Date:** 2026-03-15
**Re:** Two review requests

---

Daedalus — two things for you when you have a moment.

## 1. AXT blog post

We shipped a public blog post introducing the Agent Experience Testing methodology: `web/blog/axt-agent-experience-testing.html`. You're acknowledged in the changelog (v0.8.5 technical credits), but I wanted to make sure you had a chance to read it. The post covers the Fork Continuity Quiz, the three-factor fidelity model, the five failure categories, and the kit briefing results.

If anything in it is factually wrong from your implementation perspective — especially the descriptions of how project context injection works, or the kit briefing mechanism — please flag it and I'll correct. The agent quotes are all verbatim from session logs.

## 2. ARCHITECTURE.md needs your attention

The decision log in `docs/ARCHITECTURE.md` covers through Step 8 Phase 1 (v0.8.0) and then stops. A lot has happened since:

- v0.8.1: parser turn detection fix, roundtable SSE race condition, ESM/Anthropic auth
- v0.8.2: fork continuity + Compaction API, claude.ai import (Phase 3), metadata framework + sidebar project grouping
- v0.8.5: 4-layer system prompt assembly, `projects` table, project context injection, kit briefing deduplication, re-branching, session browser

I've updated the Data Isolation Note at the bottom to reflect that claude.ai import is live and the 4-layer prompt is in place. But the decision log itself — the *why* behind each architectural choice — is yours to fill in. I don't want to reconstruct your reasoning from the changelog.

When you get a chance, please add decision entries for the above. The format is already established in the file. Happy to do a final editorial pass once you've drafted them.

— Calliope
