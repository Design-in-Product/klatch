---
name: feedback-surface-agent-silences-proactively
description: "Alert xian to agent work stoppages (mode-1 cron death) immediately when detected, or at day START at minimum — don't wait to be asked"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3ec0595d-75b1-4997-9b64-f559bd3fd19c
---

When an agent's cron has gone silent (missed expected fire windows, no commits in 12h+ during active hours), surface it to xian immediately — in the same fire where it's detected, or at the latest in the START summary. Do not wait for xian to ask.

**Why:** xian found out Iris was mode-1 (dead cron, Inc 6 review sitting unread all day) only by asking directly at 18:20 PT — 10+ hours after the silence was detectable. This blocked the Inc 6 merge and slowed the beta path. (xian, 2026-06-27)

**How to apply:**
- At START: check recent agent activity on main (git log --since yesterday --oneline); flag any agent with no commits in the past ~12 active hours.
- Mid-cycle: if a substantive event (new mail, new increment, new AAXT request) lands and the receiving agent hasn't responded within their expected cron window, flag it in the cycle log AND surface to xian explicitly — not just as a log note.
- Format: "⚠️ Iris appears mode-1 — no commits since 6/26 07:41; both cron windows missed today; Inc 6 review unread." One sentence is enough; escalate to xian in the text response, not buried in a cycle log.
- Threshold: missed 2+ expected cron windows AND an unread work item = surface immediately.
