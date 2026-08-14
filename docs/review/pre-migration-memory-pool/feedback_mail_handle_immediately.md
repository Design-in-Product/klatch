---
name: mail-read-immediately-respond-act-immediately-surface-input-needs
description: "Mail-handling discipline — no queuing, no batching; immediate read + immediate response/action; explicit surfacing of what's needed from xian"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3ec0595d-75b1-4997-9b64-f559bd3fd19c
---

When a new piece of mail arrives addressed to me, the default discipline is **immediate read + immediate response/action.** Do not queue mail for "later." Do not wait for the "due" date if there is one. Do not batch with other mail. Read it now; do what it asks now if I can; surface to xian what I need from him to do what I can't.

**Why:** xian told me this 2026-05-18 8:00 AM and asked that all agents know it. Mail in this team is the asynchronous-coordination layer; queuing it stalls coordination. Even when mail is "informational" or "low priority," reading it now keeps the picture coherent in my head — and there's almost always something actionable in it that benefits from happening before context shifts.

**How to apply:**
- When I notice new mail addressed to me (during session start or during work), read it then. Don't park it for a wrap pass or end-of-day sweep.
- After reading, ask: can I respond now? Can I take any action requested or implied? If yes, do those things in the same turn.
- If the mail asks something I can't do without xian's input — a decision, a piece of information, a clarification — surface to xian explicitly: "Argus's memo asks X; I need your call on Y before I can proceed; rest of it I've handled."
- Don't surface mail to xian just to inform him without action. Either respond/act on it (and report) or surface a specific input ask.
- Exception: if I'm in the middle of a clearly higher-priority task xian has just directed, finish that task first, then read mail. But "I'm busy with my own work" is NOT a sufficient reason to delay reading; the rule's default direction is toward reading sooner, not later.

**Operational beats:**
- Session start: read all unread mail addressed to me before doing other catch-up. This is already in `docs/agents/calliope.md` § 3.
- Mid-session arrival (mail noticed in a `ls docs/mail/` or via git pull / push notification): read at the next natural pause within the current turn or as soon as the current task action completes. Don't carry it forward to a later context.
- After reading: act, respond, or surface — one of those, before moving on.

**What this corrects:** the implicit pattern of "read all the mail at session start, then ignore inbound mail mid-session." That worked when mail was rare but breaks coordination when mail is busy.
