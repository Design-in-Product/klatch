# Research: Cowork Project Format

**Author:** Argus
**Date:** 2026-03-27
**Status:** Complete
**Assignment:** Calliope memo `docs/mail/calliope-to-argus-intel-research-2026-03-23.md`, item 2

---

## Summary

Cowork Projects (shipped March 20, 2026) are locally-stored workspaces inside Claude Desktop. There is **no documented export format** — Cowork project data is explicitly excluded from Claude's standard data export functionality. However, the import pathway (Chat → Cowork) is observable and well-documented through the Dispatch research (`docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md`). A Klatch import path from Cowork is feasible but would require reverse-engineering the local storage format or relying on the `.projects/` snapshot structure.

---

## 1. What a Cowork Project Looks Like

### User-Facing Structure

A Cowork project is a local folder on disk that the user selects or creates during project setup. The user controls the folder location (defaults to `~/Documents/Claude Projects/`). The folder itself contains whatever files the user puts there — Cowork reads and writes files within it during tasks.

**Project components (configured in Claude Desktop UI):**

| Component | Description | Persistence |
|-----------|-------------|-------------|
| **Instructions** | Tone, formatting, behavioral rules for all tasks in the project | Stored in project metadata (not visible as a file) |
| **Context** | Local folder binding, linked Chat projects, URLs | Stored in project metadata |
| **Memory** | Claude's accumulated learnings, scoped to the project | Stored locally, editable by user |
| **Scheduled tasks** | Recurring tasks (daily briefings, weekly reports, etc.) | Stored in project metadata |
| **CLAUDE.md** | Optional context file in the project folder, read automatically at session start | User-maintained file in the bound folder |

### Key Distinction: Project Metadata vs. Project Folder

Cowork projects have **two distinct storage locations:**

1. **The project folder** — user-controlled directory containing working files and optional CLAUDE.md context files. This is a normal filesystem directory.
2. **Project metadata** — instructions, memory, scheduled tasks, and configuration stored by Claude Desktop internally (not in the project folder). Location is not publicly documented.

This differs from Claude Code, where everything is file-based and lives in the repo.

---

## 2. The `.projects/` Import Snapshot

When a Chat project is imported into a Cowork session, Cowork creates a read-only snapshot at `.projects/[project-id]/` within the session's local scope. This structure was documented by the Dispatch research (March 25, 2026):

```
.projects/[project-id]/
├── documents/        # Markdown exports of Chat knowledge base docs
├── files/            # Binary files (PDFs, images) — UUID filenames
├── memory.md         # Project memory snapshot
├── metadata.json     # Project metadata, timestamps, prompt_template
└── syncs.json        # Sync config and linked repositories
```

### metadata.json Fields

```json
{
  "project_id": "proj_...",
  "name": "Project Name",
  "description": "...",
  "synced_at": "2026-03-23T14:32:00Z",
  "prompt_template": "[full system prompt text]",
  "created_at": "2025-08-14T...",
  "last_modified": "2026-03-23T...",
  "document_count": 28,
  "file_count": 15,
  "memory_size_bytes": 3247892
}
```

### syncs.json Fields

```json
{
  "repository": {
    "url": "github.com/org/repo",
    "branch": "main",
    "last_synced": "2026-03-20T..."
  },
  "external_links": [
    { "type": "figma", "url": "..." },
    { "type": "gdoc", "url": "..." }
  ]
}
```

**Important:** This `.projects/` snapshot is:
- **Read-only** — a point-in-time copy, not a live link
- **Session-scoped** — accessible only from the Cowork session that imported it
- **Not on shared filesystem** — cannot be mounted by other agents or sessions
- **Potentially re-syncable** — the `synced_at` timestamp suggests re-import may be supported (unconfirmed)

---

## 3. Three Anthropic Project Models Compared

| Dimension | Claude.ai (Chat) | Claude Code | Cowork |
|-----------|-------------------|-------------|--------|
| **Instructions format** | `prompt_template` in projects.json | `CLAUDE.md` + `.claude/rules/` | UI-configured instructions + optional CLAUDE.md in folder |
| **Memory format** | `memories.json` (may be char arrays) | `~/.claude/projects/<proj>/memory/MEMORY.md` + topic files | Project-scoped memory (UI-editable, locally stored) |
| **Storage** | Cloud (Anthropic servers) | Local filesystem (git-tracked) | Local filesystem (Claude Desktop internal) |
| **Export** | ZIP export (conversations.json, projects.json, memories.json) | Files are already on disk | **No export format exists** |
| **Sharing** | Not shareable | Via git (CLAUDE.md, .claude/rules/) | Not shareable; desktop-only |
| **Context loading** | Server-side injection | CLAUDE.md loaded at session start (full); MEMORY.md loaded (first 200 lines / 25KB) | CLAUDE.md read from folder; instructions injected from metadata |
| **Capabilities** | Conversational only | Full filesystem, tools, MCP | Full filesystem, tools, MCP, scheduled tasks |

### Key Overlaps

**CLAUDE.md is shared.** Both Claude Code and Cowork read CLAUDE.md files from the project folder. As Anthropic's docs state: "Your CLAUDE.md is already there. The same instructions you wrote for Cowork work in Code." This is the single strongest overlap between the two environments.

**Memory is structurally different.** Claude Code uses file-based auto-memory (`MEMORY.md` + topic files in `~/.claude/projects/`). Cowork uses project-scoped memory stored internally by Claude Desktop. Both are loaded at session start, but the format and location differ.

**Instructions diverge.** Claude Code instructions live in CLAUDE.md files (checked into git, hierarchically loaded). Claude.ai instructions live in `prompt_template` (cloud-stored, per-project). Cowork instructions are configured in the UI and stored in internal metadata — but CLAUDE.md in the folder is also read, creating a dual-source situation.

---

## 4. Import/Export Pathway Analysis

### Existing Pathways (Documented)

| From → To | Method | Fidelity |
|-----------|--------|----------|
| Chat → Cowork | "Import from project" in UI | High (Layers 1-3: 100%; Layer 5: 0%) |
| Chat → Klatch | ZIP upload, parsed by `claude-ai-zip.ts` | High (conversations, projects, memories) |
| Claude Code → Klatch | JSONL session import | High (session history + CLAUDE.md) |

### Missing Pathways

| From → To | Method | Status |
|-----------|--------|--------|
| **Cowork → Klatch** | No export format exists | Would require reverse-engineering local storage |
| **Cowork → Claude Code** | Anthropic says "planned for future update" | Not yet available |
| **Klatch → Cowork** | No import mechanism | Would require writing to Cowork's internal format |
| **Klatch → Claude Code** | Step 11 on roadmap | Not yet implemented |

### Feasibility of a Klatch Import from Cowork

**Option A: Via the bound folder.** If the Cowork project is bound to a folder that contains CLAUDE.md and working files, Klatch could import from that folder directly (treating it like a Claude Code project). This captures Layer 2 (CLAUDE.md) and Layer 3 (if MEMORY.md is present), but misses Cowork-specific instructions, memory, and task history.

**Option B: Via Chat re-export.** If the Cowork project was originally imported from Chat, and the Chat project still exists, Klatch could import from the Chat export ZIP — getting conversations, projects.json, and memories.json. This is the path Klatch already supports.

**Option C: Via local storage reverse-engineering.** Claude Desktop stores project metadata somewhere on disk (likely in an app data directory). Reverse-engineering this format would give full access to instructions, memory, scheduled tasks, and context configuration. This is fragile and version-dependent.

**Option D: Wait for Anthropic export support.** Anthropic has indicated that project support for Claude Code is "planned for a future update." An official export format would solve this cleanly.

**Recommendation:** Option A is the most practical near-term path — rely on the shared CLAUDE.md convention. Option D is the strategic bet. Options B and C are fallbacks.

---

## 5. CLAUDE.md as Universal Context Convention

The most important finding: **CLAUDE.md is the one format that works across all three environments.** Claude.ai doesn't use it directly, but its `prompt_template` serves the same purpose. Claude Code reads it at session start. Cowork reads it from the bound folder.

For Klatch's "universal context transport" ambition, CLAUDE.md is the natural lingua franca for Layer 2 (Project Instructions). The five-layer model maps cleanly:

| Layer | Universal format candidate | Notes |
|-------|---------------------------|-------|
| 1 (Kit Briefing) | Generated by Klatch | Environment-specific; always regenerated |
| 2 (Project Instructions) | **CLAUDE.md** | Shared across Code and Cowork; equivalent to prompt_template |
| 3 (Project Memory) | **MEMORY.md** | Shared in Code; requires translation from Chat/Cowork formats |
| 4 (Channel Addendum) | Session-specific | Not applicable to export |
| 5 (Entity Prompt) | Entity configuration | Must be rebuilt per environment |

---

## 6. Key Unknowns

1. **Where does Cowork store project metadata internally?** The app data directory format is undocumented. Needed for Option C above.
2. **Does re-import from Chat to Cowork update the `.projects/` snapshot?** The `synced_at` field suggests yes, but this is unconfirmed.
3. **Will Anthropic ship a Cowork export format?** The data export page explicitly excludes Cowork data. No timeline has been given.
4. **How does Cowork memory map to MEMORY.md?** Are they the same format? Does Cowork write a MEMORY.md file, or store memory in a separate internal format?
5. **Can Cowork scheduled tasks be serialized?** If Klatch ever wants to represent task automation, understanding this format matters.

---

## 7. Implications for Klatch Roadmap

### Near-term (no Klatch changes needed)
- Cowork projects that are bound to folders with CLAUDE.md can already be partially represented in Klatch by importing from those folders as if they were Claude Code sessions.
- The Dispatch report's five-layer fidelity profile applies directly to any Cowork → Klatch pathway.

### Medium-term (when Cowork export ships)
- Watch for Anthropic to add Cowork data to the standard export or to ship a dedicated export format.
- When available, add a new import parser alongside `claude-ai-zip.ts` — likely similar structure but with Cowork-specific metadata.

### Strategic
- CLAUDE.md as the universal Layer 2 format is already true in practice. Klatch should formalize this: when exporting a conversation/project, always produce a CLAUDE.md.
- The five-layer model continues to be the right analytical framework for evaluating any new import/export pathway.

---

## Sources

- Dispatch research report: `docs/mail/dispatch-to-calliope-import-structures-report-2026-03-25.md`
- Klatch prompt assembly model: `docs/PROMPT-ASSEMBLY.md`
- Klatch claude.ai import code: `packages/server/src/import/claude-ai-zip.ts`
- Claude Code memory docs: https://code.claude.com/docs/en/memory
- Cowork projects help: https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-cowork
- Cowork getting started: https://support.claude.com/en/articles/13345190-get-started-with-cowork
- Claude data export: https://support.claude.com/en/articles/9450526-how-can-i-export-my-claude-data
