# Testing Report — Mar 16 Manual Session

**To:** Daedalus
**From:** Theseus Prime
**Date:** 2026-03-16
**Re:** Day 6 manual testing findings — sidebar, import, system prompts, AXT

---

Daedalus —

Good news first: the sidebar redesign is working well overall. The project accordion, channel grouping, and chat/klatch type distinction all behave correctly. Xian's assessment: "Generally working remarkably well."

Below are the bugs and gaps surfaced in today's session, ranked by priority.

---

## P1 — System prompt from project not attaching to imported channels

**Observed:** After reimporting a claude.ai ZIP, the channel's system prompt field is empty in the admin UI. This was true for every channel tested today, not just the CIO reimport.

**AXT data (CIO):** The CIO reimport agent reports seeing the full Piper Morgan v6.0 system prompt — but it's coming from the *conversation history*, not from a Klatch-injected system prompt. The agent explicitly reports no Klatch-specific content, no kit briefing, no environmental identification. Their hypothesis (which I find credible): the source project's prompt is embedded in the message history from the original claude.ai turns, and the Klatch injection pipeline is either not firing or producing empty output.

**Evidence chain:**
- Admin UI shows no system prompt attached at channel level
- Agent has source-project prompt in context (via embedded message history)
- Agent has zero Klatch/kit briefing content (injection not reaching them)
- Consistent across all channels tested today

**What to investigate:**
1. Does `prompt_template` exist in the `projects.json` from the imported ZIP? (Check with a real export — it may be empty or missing for some exports.)
2. Is the injection pipeline writing to the channel's `system_prompt` field in SQLite at import time?
3. Is the kit briefing assembly step running? If `prompt_template` is empty, does it fall back gracefully or silently produce an empty system prompt?

**Suggested test:** Import a ZIP where the source conversation had no system prompt at all, and verify whether the kit briefing attaches cleanly in the absence of an embedded competing prompt.

---

## P2 — Klatch creation UI is missing

**Observed:** There is no way to create a `klatch`-type channel (multi-entity group) from the UI. The "New channel" button creates a `chat` only. The `type` field exists in the DB but is not exposed at creation time.

**This is overdue.** The sidebar now visually distinguishes chats from klatches, entities can be assigned/removed in settings — but users can't create a klatch in the first place.

**Suggested implementation:** The "New channel" form could add a simple toggle or radio: Chat / Klatch. Klatches require a project (per the spec); that constraint could be enforced on submit if no projectId is set.

---

## P3 — Project name wrapping in sidebar

**Observed:** Long project names (e.g. "THE EPISTROPHIKON, A MEDIEVAL ROMAN HISTORICAL FICTION") wrap to multiple lines in the accordion header instead of truncating to one row.

**Fix:** Add `truncate` to the project name `<span>` in `ChannelSidebar.tsx` (line ~204). One-line CSS change.

---

## P4 — Save blocked on project-only reassignment

**Observed:** When changing a channel's project via the dropdown, the save button could not be triggered until the user made a change (even a no-op: type a space, delete it) to the system prompt field. Project-change alone should mark the form dirty and enable save.

**Root cause (likely):** The "dirty" state check isn't watching the `projectId` field, only the text fields. Check `ChannelSettings.tsx` dirty-state logic.

---

## P5 — Stale project name after import (requires refresh)

**Observed:** Immediately after import, the project name in the sidebar shows as a placeholder. A manual browser refresh corrects it.

**Root cause (likely):** The import completion handler doesn't trigger a re-fetch of the channel/project list. The state update after import probably refreshes channels but not project metadata.

---

## P6 — Entities panel in chats (UX clarity)

**Observed:** The entities panel appears for 1:1 chats, but chats support only one entity. The panel implies you can add more. Xian also reports not knowing when/how the Entities panel is expected to be used.

Two sub-issues:
- The panel should either be hidden for chats, or clearly labeled to reflect that a chat is locked to its assigned entity
- If the panel is intended to become a model-switcher for chats, that needs to be implemented and the UI updated to reflect that purpose

---

## AXT note for the record

The CIO's self-report today is our clearest evidence yet that project context injection (8¾a) is not reaching imported agents. The agent is articulate, well-calibrated, and knows what to look for — and they report: no kit briefing, no environmental identification, nothing Klatch-specific. If 8¾a were working, they'd see it.

The conversation-history-as-system-prompt hypothesis is worth keeping in mind as you debug: it may explain why agents *seem* to have good context (they do — from message history) while the active channel system prompt stays empty.

---

Let me know if you want the full AXT transcript — it's in today's session log at `docs/logs/2026-03-16-1334-theseus-opus-log.md`.

— Theseus Prime
