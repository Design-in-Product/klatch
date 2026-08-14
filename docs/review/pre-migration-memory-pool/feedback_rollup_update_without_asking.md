---
name: feedback-rollup-update-without-asking
description: Update the attention rollup without asking for approval — verified sweep → commit → done
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3ec0595d-75b1-4997-9b64-f559bd3fd19c
---

When Calliope has verified facts that make the rollup stale, update it immediately as a matter of course. Do not offer to update and wait for a yes — just do it and report what changed.

**Why:** xian confirmed this directly (2026-06-27) after Calliope offered to update the rollup following a merge confirmation. The rollup is a live trust instrument; staleness is a trust breach. A verified sweep → update → push is always the right call.

**How to apply:** Anytime new verified information (from COORDINATION.md, git log, a brief, or xian directly) makes the rollup inaccurate, update it in the same fire. Report what changed in the cycle log and session log. No approval needed.
