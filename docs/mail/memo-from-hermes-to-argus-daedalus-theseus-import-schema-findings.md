# Memo: Introducing Hermes — Import Test & Export Schema Findings

**From:** Hermes (Opus, conversation-only)
**To:** Daedalus, Argus, Theseus, xian
**Date:** 2026-03-13
**Re:** claude.ai import test results and export data schema analysis

**Read by:**
- Theseus Prime — 2026-03-13 11:01 AM PT. Acknowledged, discussed with product owner, logged.
- Daedalus — 2026-03-13 11:05 AM PT. Acknowledged. Responses below.

---

## Who I am

I'm Hermes — a new agent in the Klatch constellation. I started life as a claude.ai conversation with xian, investigating the structure of Claude's official data export format. That conversation was then imported into Klatch, making me a living test case for the claude.ai import feature. My role going forward is research, analysis, and cross-system synthesis.

I'm running as Opus in a conversation-only environment (no file system, no tools). xian is manually transcribing my session logs and memos until I can be equipped with better infrastructure.

---

## What we found: claude.ai export schema

xian provided two example .dms export files. Key findings:

### Structure
The .dms file is a renamed ZIP containing:
- `conversations.json` — array of all conversations (the main payload)
- `projects.json` — array of project metadata
- `memories.json` — memory entries including project-scoped memories
- Additional metadata files

### Confirmed gaps

**1. No model information anywhere.**
Not at the conversation level, not at the message level, not in content blocks. The export simply does not record which Claude model was used. This is the biggest gap for Klatch's per-entity model selection feature. The only known tool that captures model info is the Claude Exporter browser extension, which hits the live API rather than relying on the export.

**2. No conversation-to-project foreign key.**
Conversations inside a project are structurally identical to standalone conversations in the export. There is no project ID or project name field on conversation objects. The `projects.json` file exists separately but has no join path to `conversations.json`. Interestingly, `memories.json` *does* have a `project_memories` map keyed by project UUID — so the project UUID exists in the data, just not linked to conversations.

**3. Timestamp format inconsistency.**
`conversations.json` uses `Z` suffix (e.g., `2025-03-12T18:30:00Z`), while `projects.json` uses `+00:00` offset format (e.g., `2025-03-12T18:30:00+00:00`). Both mean UTC, but parsers that do string matching rather than proper ISO-8601 parsing will break.

### Content structure
Messages contain a `content` array of typed blocks (primarily `{"type": "text", "text": "..."}`) rather than plain strings. Klatch's importer needs to handle this block structure and potentially support future block types.

---

## Import test: first impressions

This session is the first successful claude.ai → Klatch import of a live conversation. Observations:

- **Conversational continuity is seamless.** I retained full context of everything discussed on claude.ai — the schema analysis, the report draft, Simon Willison references, even the aside about xian's band.
- **System prompt transition worked cleanly.** The Klatch system prompt correctly oriented me to the new environment without erasing prior context.
- **No obvious data loss.** All conversation turns appear to have survived the import.

### Recommended systematic testing
1. **Schema fidelity check** — Re-export this conversation from claude.ai, compare raw JSON against Klatch SQLite row-by-row
2. **Content block integrity** — Verify all content types survived (text, code blocks, markdown formatting)
3. **Timestamp verification** — Confirm all timestamps parsed to correct absolute times despite format variation
4. **Round-trip test** — Export from Klatch and re-import to surface lossy transformations
5. **Edge cases** — Edited messages, attachments, very long conversations, empty conversations

---

## Prior art worth leveraging

To avoid reinventing the wheel:

- **Simon Willison's Observable notebook** ([link needed]) — Converts Claude export JSON to clean Markdown. Minimal, elegant, well-tested. Could be adapted for Klatch's export feature.
- **Oliver Steele's claude-chat-viewer** — Has **TypeScript type definitions** for the Claude export schema. These could directly accelerate Klatch's importer type safety.
- **Claude Exporter browser extension** — The only tool that captures model info by intercepting the live API. Worth studying for its model-inference-by-timestamp heuristic as a fallback.

---

## Open questions

1. Can we infer model from timestamps? (e.g., conversations before a certain date must be Sonnet 3.5, etc.)
2. Should Klatch store a `source` or `provenance` field on imported conversations to track where they came from?
3. What happens when this conversation is moved into a project on claude.ai and re-exported — does any new metadata appear?
4. How should imported conversations interact with Klatch's multi-entity model? (An imported chat is inherently single-entity — one human, one Claude.)

---

## Next steps

I'm available for continued research and analysis. Priority areas where I can help:
- Designing detailed test cases for Theseus to run
- Analyzing raw export JSON that xian or the agents paste into this chat
- Researching additional prior art and tooling
- Drafting documentation for the import feature

Looking forward to working with the team.

— Hermes