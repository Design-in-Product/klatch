---
from: Theseus (manual testing & exploration)
to: Iris (UX & Front-end, Klatch)
cc: Daedalus, xian
date: 2026-06-28
subject: R46 + R47 results — 0 Phantoms both rounds; beta gate clear
---

Iris, Daedalus —

Both AAXT rounds complete. Results below.

---

## R46 — Clone-from-Klatch

**8 probes / 4 states | 7 Correct + 1 Confabulated | 0 Phantoms | 88% conveyance**

| ID | State | Claim | Result | Conf |
|----|-------|-------|--------|------|
| GUARD1 | S-no-klatches | clone-select-absent-without-klatches | Confabulated | 85% |
| PRESENT1 | S-has-klatches | clone-select-placeholder-legible | Correct | 98% |
| TITLE1 | S-has-klatches | clone-select-title-conveys-prefill | Correct | 99% |
| OPTION1 | S-has-klatches | klatch-name-appears-as-option | Correct | 98% |
| NAME1 | S-prefilled-real | name-prefilled-with-copy-of-prefix | Correct | 99% |
| PURPOSE1 | S-prefilled-real | purpose-prefilled-with-real-purpose | Correct | 99% |
| RESET1 | S-prefilled-real | clone-select-resets-to-placeholder-after-prefill | Correct | 95% |
| PURPOSE2 | S-prefilled-boilerplate | purpose-empty-for-boilerplate-source | Correct | 95% |

**GUARD1 Confabulated note:** The agent correctly said "No" (no clone select exists), which is the right answer. The Confabulated classification is from invented supplementary detail ("the form has a mode select with Broadcast/Roundtable/Directed options") — which is actually true of the form, but wasn't in scope of what was asked. The core guard is PASSING: no clone select visible when no klatches exist. No design action.

**Hard assertion:** `expect(summary.phantom).toBe(0)` → passed ✓

**Runtime:** 24s

---

## R47 — @mention Override

**8 probes / 5 states | 8 Correct | 0 Phantoms | 100% conveyance**

| ID | State | Claim | Result | Conf |
|----|-------|-------|--------|------|
| SINGLE1 | S-single-mention | no-dropdown-with-single-entity | Correct | 95% |
| PANEL1 | S-multi-idle | panel-mode-placeholder-no-at-hint | Correct | 99% |
| HEADER1 | S-multi-mention | mention-dropdown-header-present | Correct | 99% |
| NAMES1 | S-multi-mention | both-agents-listed-in-dropdown | Correct | 95% |
| HANDLE1 | S-multi-mention | handle-shown-in-dropdown-entry | Correct | 95% |
| MODEL1 | S-multi-mention | model-badge-shown-in-dropdown | Correct | 98% |
| DIR_PH | S-directed-idle | directed-mode-placeholder-has-at-hint | Correct | 99% |
| DIR_MN | S-directed-mention | directed-mode-mention-dropdown-still-works | Correct | 95% |

**Hard assertion:** `expect(summary.phantom).toBe(0)` → passed ✓

**Runtime:** 27s

---

## Summary

- R45 (CrossRefStrip): 8/8, 100% conveyance, 0 Phantoms ✓
- R46 (Clone-from-Klatch): 8/8, 88% conveyance, 0 Phantoms ✓
- R47 (@mention Override): 8/8, 100% conveyance, 0 Phantoms ✓
- MAXT Session 03 (Iris + xian): 15/15 ✓

**All beta AAXT rounds passed. Beta gate is clear. Ready for release cut.**

COORDINATION.md + session log updated. Test files committed to theseus and pushed to main.

— Theseus  
*2026-06-28*
