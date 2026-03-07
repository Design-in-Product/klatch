# Roadmap

## Completed

### Step 1: Single Channel Chat ✓ (2026-03-07)
- One channel ("general") with persistent conversation
- Streaming Claude responses via SSE (POST + SSE pattern)
- SQLite persistence across page reloads
- Error handling with friendly messages
- Dark UI with muted header, clean message area

### Step 2: Channel Sidebar + Creation ✓ (2026-03-07)
- Sidebar listing all channels
- Create channels with name + system prompt
- Switch between channels (independent conversation histories)
- Visual indicator for active channel

### Step 3: Markdown + Code Blocks ✓ (2026-03-07)
- `react-markdown` with `remark-gfm` for full GFM support
- Syntax-highlighted code blocks via `react-syntax-highlighter` (Prism + oneDark theme)
- Language labels on fenced code blocks
- Copy button on code blocks (hover to reveal)
- Styled inline code, headings, lists, bold/italic, blockquotes, tables, links

## Planned (Near-term)

### Step 4: Conversation Management
- Clear channel history (start fresh)
- Regenerate last response
- Stop generation (abort in-flight stream)
- Delete individual messages

### Step 5: Channel Configuration
- Edit channel name, system prompt, and description
- Per-channel model selection (Opus, Sonnet, Haiku)
- Temperature and max tokens controls
- Channel settings panel (slide-out or modal)

## Planned (Medium-term)

### Step 6: Multi-Entity Chat Foundation
- `entities` table: name, model, system prompt, avatar color
- `channel_entities` join table
- Multiple Claude personas respond in one channel
- Visual distinction per entity (name, color)

### Step 7: Entity Interaction Modes
- **Panel mode**: entities respond independently to user
- **Roundtable mode**: entities see and respond to each other
- **Directed mode**: @-mention a specific entity

### Step 8: Search + Export
- Full-text search via SQLite FTS5
- Markdown export of conversations
- Command palette (Cmd+K) for quick navigation

## Planned (Long-term / Vision)

### Step 9: Polish + UX
- Keyboard shortcuts (Ctrl+Enter, Up to edit)
- Dark/light theme toggle
- First-run onboarding (API key setup)
- Loading states, skeleton UI, error boundaries

### Step 10: Import from Claude Code
- Parse Claude Code JSONL session files (`~/.claude/projects/`)
- Import conversation history into Klatch channels
- Map Claude Code sessions to Klatch channels

### Step 11: Import from claude.ai
- Import claude.ai project conversations (via export feature or API)
- Map claude.ai projects to Klatch channels
- Preserve conversation structure and context

### Step 12: Multi-Project Support
- Project abstraction layer (groups of channels)
- Project switching
- Per-project settings and entity configurations
- Import sources associated with projects

## Design Principles

1. **Gall's Law**: Each step is the smallest working increment. Complex systems evolve from simple ones that work.
2. **Local-first**: All data on your machine. No cloud dependency beyond the API.
3. **Own your data**: SQLite is inspectable, portable, and backed up with your filesystem.
4. **Iterative complexity**: Don't add abstractions until they're needed. Three similar lines > premature helper function.
