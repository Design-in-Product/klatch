# Sidebar Design

> Status: **Draft** — design session March 16, 2026
> Authors: Xian (PO), Daedalus (architecture)

## Wireframe

![Sidebar wireframe sketch](sidebar-wireframe.png)

*PO sketch, March 16. Annotated requirements below.*

<!-- TODO: Replace with clean SVG diagram once design is stable -->

## Glossary

These are Klatch's internal terms of art. UI copy may differ (polish phase).

| Term | Definition |
|------|-----------|
| **Project** | Top-level organizer. Maps to a claude.ai project, a Claude Code working directory/repo, or a user-created grouping. Has a name, optional instructions, and contains chats and klatches. Every project came from somewhere (imported or created in Klatch). |
| **Chat** | A 1:1 conversation between the human user and a single Claude instance. The primary day-to-day interaction format. Imported from claude.ai, Claude Code, or started natively in Klatch. Belongs to **0 or 1** projects. |
| **Klatch** | A synthetic multi-entity group conversation with orchestration. Klatch-native — these don't exist in claude.ai or Code. Has an orchestration mode (roundtable, relay, moderated). Belongs to **exactly 1** project (klatches are a project coordination tool; no project, no klatch). |
| **Entity** | A named Claude persona with its own model, system prompt, color, and handle (e.g., @Daedalus, @Argus). Entities participate in klatches. Not directly visible as top-level sidebar items — they appear as participants within klatches and as authors of messages. |
| **Unassigned** | Chats not belonging to any project. Serves as both a permanent home for loose 1:1 conversations and a triage area where imported chats land before being assigned to a project. Only chats can be unassigned; klatches always require a project. |
| **Project switcher** | The sidebar's top-level navigation. In the current design, an accordion where one project is expanded at a time for cognitive focus. |
| **Controls** | Persistent affordances at the sidebar bottom: import, new chat, settings. Also surfaced on the empty canvas (no chat selected) as a welcoming entry point for new users. |

## Sidebar structure

The sidebar is organized as a project-first accordion. One project is expanded ("active") at a time. Within each project, items are grouped into two sections in priority order.

```
+----------------------------------+
|  v ACTIVE PROJECT                |  <-- project header (click to collapse)
|  --------------------------------|
|    CHATS                         |  <-- 1:1 conversations (primary)
|      The CIO Discussion          |
|      API Architecture Review     |
|      Quick Question              |
|  --------------------------------|
|    KLATCHES                      |  <-- group conversations (secondary)
|      #standup                    |
|      #coordination               |
|      #retro                      |
|  --------------------------------|
|                                  |
|  > Another Project               |  <-- collapsed (click to expand)
|  > Yet Another Project           |  <-- collapsed
|                                  |
|  --------------------------------|
|    UNASSIGNED                    |  <-- chats with no project
|      Random Claude Chat          |
|      One-off Question            |
|  --------------------------------|
|                                  |
|  [Import] [New Chat] [Settings]  |  <-- controls
+----------------------------------+
```

### Priority order: chats above klatches

This is the inverse of Slack's paradigm (which puts public #channels first, then DMs). In Klatch, 1:1 AI chats are the primary interaction — you spend most of your time talking to Claude. Klatches (multi-entity coordination) are secondary/derived. This ordering reflects actual usage frequency.

> **Open question:** Should users be able to flip this order? Not needed yet, but worth noting as a preference candidate.

### Accordion behavior

- One project expanded at a time (cognitive sanity)
- Expanding a project collapses the previously-open one
- The unassigned section is always visible (not part of the accordion — it's a fixed bottom section above controls)
- Collapsed projects show just their name (and possibly an unread count in the future)

> **Future consideration:** Some users may want multiple projects open simultaneously. Defer until demand surfaces.

## Data model changes

### Add `type` column to `channels` table

```sql
ALTER TABLE channels ADD COLUMN type TEXT NOT NULL DEFAULT 'chat';
-- Values: 'chat' | 'klatch'
```

**Rationale:** Chats and klatches share 90%+ of their schema (name, messages, project, system prompt, timestamps). A single table with a type discriminator is the Gall's Law choice — smallest working increment. If they diverge significantly later, we can split with a migration.

### Project membership rules

| Type | Project membership | Unassigned allowed? |
|------|-------------------|-------------------|
| Chat | 0 or 1 | Yes |
| Klatch | Exactly 1 | No |

### Existing data migration

All existing rows in `channels` get `type = 'chat'` by default. Any channel that has entities assigned via `channel_entities` could be migrated to `type = 'klatch'`, but this can be deferred — the type distinction is primarily a UI concern for now.

## Interaction patterns

### Assigning chats to projects

- **During import:** Project dropdown per conversation in import preview (already built)
- **After import:** Project dropdown in chat settings (already built)
- **Drag and drop:** Drag a chat from Unassigned into a project section (future — fun but not MVP)

### Creating new chats

- From sidebar controls: creates an unassigned chat (user can assign to project later)
- From within a project context: creates a chat already assigned to that project

### Creating new klatches

- Only available within a project context (since klatches require a project)
- User selects entities to participate and chooses an orchestration mode

### Empty canvas

When no chat is selected, the main content area shows:
- Welcome/orientation for new users
- Import and new-chat affordances (same as sidebar controls, but more prominent)
- Possibly recent activity or quick-start suggestions

## Source mapping

Different import sources map to Klatch concepts differently:

| Source | Project concept | Chat concept |
|--------|----------------|--------------|
| **claude.ai** | `projects.json` entries (name + instructions) | `conversations.json` entries. Note: exports don't include `project_uuid` on conversations, so assignment happens during import via user selection. |
| **Claude Code** | Working directory or GitHub repo (inferred from session metadata `cwd`) | Session JSONL files. Each session = one chat. |
| **Klatch-native** | User-created projects | User-created chats and klatches |

## Open questions

1. **Klatch naming in UI**: Do we actually label the section "Klatches" or use something more descriptive like "Group Chats" or "Team Channels"? "Klatches" is on-brand but might confuse new users. Could tooltip/onboard around it.
2. **Project creation flow**: When a user wants to create a new project from scratch (not imported), what's the minimal flow? Name + optional instructions, probably.
3. **Cross-project chat visibility**: If a user is looking at Project A but wants to quickly check a chat in Project B, they have to switch projects. Is this friction acceptable or do we need a search/jump feature?
4. **Unread indicators**: Not designed yet, but the sidebar is the natural place for unread counts per chat/project. Especially relevant for klatches where entities may have responded asynchronously.
5. **Chat ordering within a project**: By most-recent activity? Alphabetical? User-defined? Most-recent is probably the sensible default.
