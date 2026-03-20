# Cloud Session Import

How to import Claude Code sessions from cloud-hosted agents (like Argus) into Klatch.

## The Problem

Cloud agents run on Anthropic's infrastructure. Their session JSONL files live at `~/.claude/projects/` **on the cloud machine**, not on your laptop. Klatch's local session scanner can't see them.

## Three Import Paths

### 1. Agent Self-Export (recommended)

The agent commits its JSONL to `exports/sessions/` in the repo and pushes. You pull, and the session appears in Import > Browse.

**Agent convention** (add to session-end workflow):
```bash
# Find the current session file
SESSION_DIR=~/.claude/projects/$(pwd | tr '/' '-')/
SESSION_FILE=$(ls -t "$SESSION_DIR"*.jsonl 2>/dev/null | head -1)

# Copy to exports with descriptive name
cp "$SESSION_FILE" exports/sessions/argus-2026-03-19.jsonl

# Commit and push
git add exports/sessions/
git commit -m "Export Argus session for Klatch import"
git push
```

Then in Klatch: **Import > Claude Code > Browse** — the session appears under "Exported sessions."

### 2. File Upload

If you have the JSONL file (downloaded, copied from logs, etc.):

**Import > Claude Code > "Choose JSONL file"** — upload directly via browser.

### 3. Manual Path

If you saved the JSONL somewhere on your local filesystem, paste the full path as before.

## How Cloud Sessions Differ

- **No local cwd:** The agent's working directory (e.g., `/home/ubuntu/klatch`) doesn't exist on your machine. CLAUDE.md and MEMORY.md can't be read from disk.
- **Project linking by basename:** Klatch matches the cloud cwd's basename (e.g., "klatch") to existing projects. If exactly one project matches, the session is linked to it automatically.
- **Source metadata:** Cloud uploads include `cloudUpload: true` in source_metadata for provenance tracking.

## Directory Convention

```
exports/
  sessions/
    .gitkeep
    argus-2026-03-19.jsonl        # Agent name + date
    theseus-2026-03-20.jsonl
```

This directory is **not gitignored** — agents commit here, you pull. Files can be deleted after import if you don't want them in the repo long-term.

## Naming Convention

Recommended: `{agent-name}-{YYYY-MM-DD}.jsonl` (or `{agent-name}-{YYYY-MM-DD}-{short-id}.jsonl` if multiple sessions per day).

The filename doesn't affect import — session identity comes from the `sessionId` field inside the JSONL, which is used for dedup detection.
