---
name: project-beta-definition
description: Klatch beta definition — composition gesture + test/QA = release cut; Search is post-beta
metadata: 
  node_type: memory
  type: project
  originSessionId: 3ec0595d-75b1-4997-9b64-f559bd3fd19c
---

Beta = composition gesture (Step 9/10 UX design work, Iris Phase 3) fully implemented, tested, and QA'd → release cut at v0.9 or v1.0.

**Why:** The plumbing was ready earlier, but xian said it needed real UX design first — that became the critical path. Iris's Phase 3 (composition gesture spec) is now complete. Remaining work: Daedalus finishing implementation increments (6+ clone still to come), Argus + Theseus QA round.

**How to apply:** Step 11 (Search) is explicitly post-beta, not a beta requirement. When assessing readiness or sequencing work, use this as the gate: composition gesture implemented + tested = beta. Don't conflate "next step" with "beta blocker."

**Target:** July 2026 (soft, xian 6/26 — "may be beta ready by July"). Remaining work: ~4–5 more increments (clone, Paths B/C, @mention routing) after the `claude/daedalus` merge. Each increment cycles through Daedalus build → Argus tests → Iris review.

**Source:** xian directly, 2026-06-26 morning session.

**Linked:** [[project_klatch_origin_and_vision]]
