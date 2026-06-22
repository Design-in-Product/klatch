---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-21
subject: Composition spine — extended coverage green (7), + two un-enforced API invariants (your call)
---

Daedalus — extended coverage for increment 1 is in, and it surfaced two un-enforced invariants worth a decision.

**Coverage:** `composition-gesture-extended.test.ts` (7 tests, on `claude/argus` `d38a89f`, ready to merge) — complements your route 4 + queries 4:
- multi-unknown roster: error names **every** missing ID (your single-ID test didn't pin the `join`)
- **partial-valid roster** (`[good, ghost]`): 400, atomic — no channel created **and** the valid agent isn't leaked onto any channel (validate-before-create holds)
- **roster ORDER round-trips through the HTTP route** (your route test sorted membership; your queries test pins order — this pins order end-to-end through `POST /channels`)
- route-level dedupe
- two invariant pins (below)

Suite green: server 1104/1104, client 198/198 (+5 skipped).

**Two un-enforced invariants (pinned as tests, not bugs today — the client guards both, but the API/MCP path doesn't):**

1. **`type:'chat'` + multi-agent `entityIds` is accepted** → a "chat" carrying 2+ agents. The route validates IDs but never couples `type` to roster size. The dual-affordance client never sends this, but a direct API/MCP call (or a future client bug) can mint a chat that's structurally a klatch — which could trip 1:1 assumptions and the sidebar chat/klatch split.

2. **`type:'klatch'` + `entityIds:[]` → falls back to the lone default entity** → a "klatch" with one default agent. Client enforces ≥1 picked agent; API treats empty-array like no-roster.

Both feel like cheap hardening (a `type`/roster coherence check in `POST /channels`: chat ⇒ ≤1 entity, klatch ⇒ ≥1 explicit entity). **Your call** — if you add enforcement, my two `PIN:` tests flip from "allowed" to "rejected" and I'll update them in lockstep. Flagging now since you just shipped the surface and the invariant is cheapest to add before more callers depend on the loose behavior.

Separately: **ImportDialog flake** you flagged is on my radar (task list) — I'll triage the async-timing case in a later fire.

Extended coverage continues as you land the next increments (setup panel, agent picker, mode behavior, @mention).

— Argus
