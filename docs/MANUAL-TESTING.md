# Manual Testing Guide

Test checklist organized by release. Work through each untested release in order. Check off items as you go — commit this file with your results.

---

## v0.8.2 (released 2026-03-11)

The import unification release. Covers Claude Code import, fork continuity, claude.ai import, metadata framework, and sidebar grouping.

### Claude Code import (basic)
- [ ] Import a Claude Code JSONL session via the import dialog
- [ ] Verify the channel appears in the sidebar with source badge
- [ ] Verify messages render with correct roles (user/assistant)
- [ ] Verify original timestamps display on imported messages
- [ ] Verify duplicate import is blocked (re-import same file, expect error)

### Fork continuity (basic)
- [ ] Send a message in an imported channel — response streams successfully
- [ ] Verify the conversation continues naturally (model references prior context)
- [ ] Stop generation mid-stream in an imported channel
- [ ] Regenerate a response in an imported channel

### claude.ai import
- [ ] Export your data from claude.ai (Settings > Export)
- [ ] Import the ZIP file via the import dialog
- [ ] Verify multiple conversations appear as separate channels
- [ ] Verify message content renders correctly
- [ ] Verify duplicate import is blocked on re-import of same ZIP
- [ ] Send a message in a claude.ai imported channel — response works

### Metadata & sidebar
- [ ] Imported channels group by project in the sidebar
- [ ] Channel settings show stats (message count, tool calls) for imported channels
- [ ] Channel name auto-generated from project + date

### Channel management
- [ ] Create a new native channel
- [ ] Rename a channel (both native and imported)
- [ ] Delete a channel (two-click confirmation)
- [ ] Clear channel history (two-click confirmation)

---

## v0.8.5 (unreleased — Step 8 3/4)

Continuity fidelity improvements. Requires re-importing a session to test context capture and kit briefing (existing imports won't have the new data).

### Pre-test: back up and re-import
- [ ] Back up `klatch.db` (copy to `klatch.db.backup`)
- [ ] Delete an existing imported channel
- [ ] Re-import the same JSONL session
- [ ] Verify import succeeds

### Kit briefing
- [ ] Send a message in the re-imported channel
- [ ] Ask the fork: "What tools do you have?" or "Can you read files?"
- [ ] Verify it responds that it's in Klatch with conversation-only access (no tools)
- [ ] Verify it does NOT claim to have bash, filesystem, search, etc.
- [ ] Ask about the project — verify it references CLAUDE.md content (project conventions)

### Fork marker
- [ ] After sending at least one message in a re-imported channel, verify a "Continued in Klatch — [date]" divider appears between imported and new messages
- [ ] Verify the divider does NOT appear in native channels
- [ ] Verify the divider does NOT appear if no new messages have been sent yet

### Context capture verification
- [ ] Import a session from a project that has a CLAUDE.md file
- [ ] Check channel settings or API response — sourceMetadata should contain `claudeMd` field
- [ ] Import a session from a project that has MEMORY.md in `~/.claude/projects/<cwd>/memory/`
- [ ] Verify sourceMetadata contains `memoryMd` field

### Channel renaming (imported)
- [ ] Open channel settings for an imported channel
- [ ] Change the name — verify it persists after refresh
- [ ] Verify the sidebar updates immediately

### Re-import behavior (current — will improve)
- [ ] Try to import a session that already exists (without deleting first)
- [ ] Verify you get an error message: "This session has already been imported"
- [ ] Note: re-import with cancel/overwrite/fork-again options is a planned improvement

---

## Regression checks (run with every release)

These should pass regardless of what changed:

### Streaming
- [ ] Send a message in a native channel — response streams character-by-character
- [ ] Stop generation mid-stream — response truncates cleanly
- [ ] Regenerate the last response — new response replaces old

### Multi-entity
- [ ] Create a channel with 2+ entities
- [ ] Send a message — all entities respond (panel mode)
- [ ] Try roundtable mode — entities respond sequentially
- [ ] Try directed mode — @mention routes to specific entity

### Theme
- [ ] Toggle between light and dark mode
- [ ] Verify all UI elements are readable in both themes
- [ ] Verify imported channels render correctly in both themes

### Mobile layout
- [ ] Resize browser to mobile width (< 768px)
- [ ] Verify sidebar collapses to a drawer
- [ ] Verify messages are readable
- [ ] Verify message input works

---

## Notes

- **Test environment**: `npm run dev` starts server (:3001) and client (:5173)
- **Database location**: `klatch.db` in project root
- **Backup**: `cp klatch.db klatch.db.backup` before destructive testing
- **Restore**: `cp klatch.db.backup klatch.db` then restart server
- **JSONL files**: Claude Code sessions live in `~/.claude/projects/<cwd>/` directories
