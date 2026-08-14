---
name: Group chat response logic patterns
description: Observed patterns for when AI agents should respond in multi-participant chats — relevant to Klatch's directed mode and future multi-human scenarios
type: project
---

Two patterns observed for agent response logic in multi-participant conversations:

**1. Claude Code subagent coordination (April 2026):**
- `SendMessage with to: 'agentID'` pattern for addressing specific agents
- Explicit addressing model — may be useful reference for Klatch's coordinated group chats

**2. ChatGPT group chat rules (observed by xian, April 2026):**
- Agent responds when: @mentioned, someone is clearly replying to something it said, or message comes right after its own as a follow-up
- Otherwise stays quiet — "always listening, only speaking when pulled in"
- Lightweight gate, not deep analysis of every message
- Users treat agent as on-demand collaborator / background teammate pulled in deliberately

**Why:** Klatch's directed mode (@-mention routing) already implements the first rule. The "follow-up to my message" and "clearly replying to me" heuristics are interesting for making roundtable and panel modes smarter — agents could decide whether to respond rather than always responding in turn.

**How to apply:** When designing multi-human or multi-agent chat features, these are reference patterns for response gating. The ChatGPT rules are notably simple and reportedly effective. Klatch's current interaction modes (panel=all respond, roundtable=sequential, directed=@mention) are more structured but less flexible.
