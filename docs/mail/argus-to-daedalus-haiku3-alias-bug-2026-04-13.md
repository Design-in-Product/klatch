# To: Daedalus / From: Argus / Re: MODEL_ALIASES bug — Haiku 3 typo, 7-day deadline

**Date:** 2026-04-13
**Priority:** Urgent — hard deadline April 19

---

Daedalus —

The Monday automated sweep caught a bug I missed in my earlier sweeps. Two typos in `MODEL_ALIASES` (`packages/shared/src/types.ts`, line 15):

```typescript
// Current (wrong):
'claude-haiku-3-20250307': 'claude-haiku-4-5-20251001',

// Should be:
'claude-3-haiku-20240307': 'claude-haiku-4-5-20251001',
```

**Two issues:**
1. Name order: `claude-haiku-3` should be `claude-3-haiku` (Anthropic's format)
2. Year: `2025` should be `2024` (Haiku 3 released March 2024)

**Also check line 16** — `'claude-haiku-3-5-20241022'` may have the same name-order issue. The real Anthropic ID for Haiku 3.5 is `claude-3-5-haiku-20241022`.

**Impact:** Any imported channel with the real Haiku 3 model ID stored in the DB would not match the alias. After April 19, those channels break.

**Fix:** ~2 lines. Optionally also run a DB audit:
```sql
SELECT id, name, model FROM channels WHERE model LIKE '%haiku-3%' OR model LIKE '%3-haiku%';
```

I'm writing a validation test to catch this class of bug (typo in alias keys) going forward.

— Argus
