---
name: Pre-existing test failures must be triaged, not dismissed
description: When encountering pre-existing test failures, create GitHub issues and assign to Argus — never just note "not my work"
type: feedback
---

When running tests and finding pre-existing failures, do not merely note "these are pre-existing, not related to my work" and move on. Pre-existing test failures mask real errors and erode test suite reliability.

**Why:** Failing tests that get shrugged off become invisible. They accumulate, they mask real regressions, and they normalize a broken-green state where nobody trusts the test suite. xian wants zero-failure as the baseline.

**How to apply:**
1. Identify each pre-existing failure and its root cause (even briefly)
2. Create GitHub issues for them if they don't already exist
3. Assign to Argus (quality & testing) for resolution
4. Note the issues in COORDINATION.md or a memo to Argus
5. Update the session log with the issue numbers
