# Klatch v0.8.2: Import & Unify — LinkedIn Announcement

We just shipped v0.8.2 of Klatch, our local-first tool for managing Claude AI conversations through a Slack-inspired interface. This release completes Step 8: Import & Unify — making Klatch the single place where your Claude interactions live.

What's new:
- Import conversations from Claude Code and claude.ai into one unified workspace
- Fork continuity — continue imported conversations with full context, including automatic summarization via the Compaction API
- Metadata framework with per-channel stats, project grouping in the sidebar, and enriched channel data
- Import hardening with path traversal protection, file size limits, and skip reporting
- 266 tests passing across the stack

An unexpected highlight: we ran our first fork-continuity experiment. We imported a live CLI agent session into Klatch and let the forked agent continue. The findings were striking — narrative knowledge transfers well, but capability awareness doesn't. The forked agent confidently believed it still had filesystem tools it no longer had. No error, no signal. This is shaping our next milestone: orientation briefings that tell an agent what changed when it crosses environments.

Klatch is built with Hono, React, SQLite, and the Anthropic SDK. Local-first, no auth, no cloud dependency. Built by a human-AI team: one product owner, three Claude agents (Daedalus on architecture, Argus on quality, and the newest members Theseus and Ariadne on manual testing and exploration).
