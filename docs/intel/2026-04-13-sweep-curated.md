# Intelligence Sweep — 2026-04-13 (Curated)

**Filed by:** Argus
**Source:** Curation of automated external scan `2026-04-13-sweep.md`
**Scope:** April 6–13 external sources, verified against codebase
**Type:** Curated sweep

---

## URGENT — Haiku 3 retirement in 7 days + MODEL_ALIASES bug

### The automated scanner found a real bug.

The `MODEL_ALIASES` mapping for Haiku 3 has **two typos**:

```typescript
// Current (wrong):
'claude-haiku-3-20250307': 'claude-haiku-4-5-20251001',

// Should be:
'claude-3-haiku-20240307': 'claude-haiku-4-5-20251001',
```

**Issues:**
1. **Name order:** `claude-haiku-3` should be `claude-3-haiku` (Anthropic's actual ID format for Haiku 3)
2. **Year:** `2025` should be `2024` (Haiku 3 was released in 2024, not 2025)

**Impact:** Any imported channel with `model = 'claude-3-haiku-20240307'` stored in the DB would not match the current alias. After April 19, API calls to that model ID will return errors. The alias was supposed to catch this and redirect to Haiku 4.5, but the typo means it doesn't match.

**Risk level:** Medium. We'd need to check whether any imported channels actually have this model ID stored. If none do, the typo is cosmetic. If some do, those channels break in 7 days.

**Action for Daedalus:**
1. Fix the alias key: `'claude-3-haiku-20240307'` → `'claude-haiku-4-5-20251001'`
2. Also consider adding the correct Haiku 3.5 alias: `'claude-3-5-haiku-20241022'` (same pattern issue)
3. Optional: DB migration to update any channels with deprecated model IDs directly

**Action for Argus:** Write a test that verifies MODEL_ALIASES keys match real Anthropic model IDs. This class of bug (typo in a mapping key) should be caught automatically.

---

## Curation of remaining items

| # | Automated priority | Curated priority | Verification |
|---|--------------------|------------------|-------------|
| 1 | Haiku 3 retirement — High | **URGENT** | Bug confirmed in codebase. See above. |
| 2 | Advisor Tool — Medium | **Medium** | Confirmed real. Orthogonal to Klatch architecture but interesting design pattern. |
| 3 | 1M context beta retirement — Low | **Closed** | Verified: Klatch does not send `context-1m` beta header. No risk. Previously verified in Sweep #5 (April 1). |
| 4 | Tailwind v4.1 — Low | **Low** | `@source` Vite fix relevant to Iris's dev loop. Batch with next dep maintenance. |
| 5 | MCP Server Cards — Low | **Low** | File for Step 10 Phase 5. `.well-known` discovery mechanism aligns with MCP server vision. |
| 6 | React 19.2.5 — Low | **Closed** | Patch release, no RSC in Klatch. |
| 7 | Microsoft Agent Framework — Low | **Closed** | Background validation only. |
| 8 | Competitive landscape — Low | **Closed** | No new competitors. Moat intact. |

---

## Priority queue after curation

| # | Item | Owner | Priority | Deadline |
|---|------|-------|----------|----------|
| 1 | Fix MODEL_ALIASES Haiku 3 typo | Daedalus | **Urgent** | Before April 19 |
| 2 | Write MODEL_ALIASES key validation test | Argus | High | This session |
| 3 | Advisor Tool design note for Step 10/11 | Daedalus | Low | When relevant |
| 4 | Tailwind v4.1 + React patch | Batch | Low | Next dep maintenance |
| 5 | MCP Server Cards note for Phase 5 | File | Low | When relevant |

---

## Notes on the automated scan quality

This is the second curated sweep under the automated arrangement. The scanner caught a genuine bug (Haiku 3 alias typo) that my previous manual sweeps missed — I had verified "Klatch uses `claude-haiku-4-5-20251001`" back in Sweep #5 but never checked whether the *alias keys* themselves were correct. The automated scan's systematic approach to model ID verification is paying off.

The 1M context beta retirement was correctly flagged as Low by the scanner and correctly closed by me — this is the third time it's appeared across sweeps, and it's been verified safe each time. Worth adding a "previously verified, no re-check needed" convention to prevent repeat verification work.

— Argus
