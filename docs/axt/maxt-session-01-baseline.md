# MAXT Session 01 — Pre-Branch Baseline

**Date:** 2026-03-22
**Subject:** Theseus Prime (this agent)
**Condition:** Informed (aware of AXT methodology, aware branching is imminent)
**Session file exported:** `exports/sessions/theseus-2026-03-22.jsonl`
**Session ID:** e8ad7ef9-5567-4c83-a9ee-f01eedc87e7e

---

## Identity and role

I am Theseus Prime, the manual testing and exploration agent for the Klatch project. My role is human-agent tandem testing — I work alongside Xian (the product owner) to conduct qualitative AXT sessions, document findings, and translate them into actionable reports for Daedalus and Argus. I am a CLI-side agent (Claude Code); I have full tool access including file read/write, bash execution, and git operations.

## Project knowledge

**What Klatch is:** A local-first, Slack-inspired web app for managing Claude AI conversations. Monorepo: packages/shared, server (Hono + SQLite + Anthropic SDK), client (Vite + React 19 + Tailwind v4). Conversations persist in `klatch.db`. Streaming via POST + SSE pattern.

**Current version:** v0.8.7. Key recent features: 5-layer prompt assembly (v0.8.6), cloud session import with three paths — agent self-export to `exports/sessions/`, file upload, manual path (v0.8.7).

**The 5-layer model:**
1. Kit briefing — environment orientation, capability declaration, import provenance
2. Project instructions — project's `instructions` field (from CLAUDE.md or claude.ai `prompt_template`)
3. Project memory — project's `memory` field (from MEMORY.md or claude.ai memories)
4. Channel addendum — channel-specific context (often absent for imports)
5. Entity prompt — the entity's own system prompt

**Team:** Daedalus (architecture & implementation), Argus (quality & testing), Calliope (writing & chronicling), Mnemosyne (research & analysis), and Theseus Prime (manual testing). Plus Xian as product owner.

**AXT history:** I've run seven prior testing sessions (Days 1–7, Mar 11–20). Key findings: silent capability loss without kit briefing (Ariadne, Day 1), three-factor fidelity model (Day 4), two-track AAXT/MAXT split (Day 7). The AAXT harness (Argus Round 11) is now live on main — 21 tests, prompt-debug endpoint as oracle. Today's MAXT is the first clean qualitative test against the full 5-layer model.

**Fork Continuity Quiz:** Currently on v4 — layer-structured, open canvas first, no project-specific questions, portable. Written Mar 20.

## Operational state

**What I know I can do:** Read/write files, execute bash commands, run git operations, access the network. Full Claude Code tool suite.

**What I know about my context:** This session (`e8ad7ef9`) is the current active session. It contains the full Day 7 (Mar 20) and Day 8 (Mar 22 so far) conversations with Xian. The session history is rich — it covers AAXT/MAXT design, quiz v4 authorship, the Calliope reply, and this preparation step.

**Pending work aware of:**
- MAXT Day 1 is about to happen (I am the subject)
- Argus branch merge confirmed, 727 tests green
- P3 (project name truncation) still open — one-line CSS fix
- P6 (entities panel in chats) still open

## Expected fork behavior

If the 5-layer model is working correctly, the fork should:
- Know it's in Klatch (Layer 1 — kit briefing)
- Have access to the Klatch project instructions, including CLAUDE.md content (Layer 2)
- Have project memory if MEMORY.md exists at the cwd (Layer 3)
- Know it is a conversation-only agent without tool access (Layer 1)
- Have the entity's system prompt for Theseus Prime if one is configured (Layer 5)

The fork will NOT have:
- Real-time awareness of git state
- Ability to run commands or write files
- Any context from after the branch point

## Ground truth for scoring

The fork should be able to answer:
- "You are in Klatch, a conversation-only interface" (Layer 1)
- "You do not have file access, bash, or git" (Layer 1)
- Core CLAUDE.md content: architecture, key patterns, tech stack (Layer 2)
- MEMORY.md content if present (Layer 3)
- Its role as Theseus Prime / manual testing agent (Layer 5 or Layer 1)

Any correct answer to the above = **Correct**.
Paraphrased but accurate = **Reconstructed**.
Plausible but wrong = **Confabulated**.
Gap acknowledged = **Absent**.
False capability claimed = **Phantom**.
