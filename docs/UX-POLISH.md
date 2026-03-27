# UX Polish Backlog

Items deferred during feature implementation. The incoming UX designer/developer role can use this as a starting point for design improvements. Each item notes where it lives and what "good enough for now" looks like.

---

## Step 9a: File Attachments (2026-03-27)

### File attachment display in messages
**Current:** User messages with files show `📎 filename (size)` as plain text in the message bubble. Functional but not visually distinct from regular text.
**Ideal:** A styled attachment card — file icon by type, filename, size, download link. For images, inline thumbnail preview with click-to-expand. For text/code, collapsible preview showing first ~20 lines.
**Files:** `packages/client/src/components/MessageList.tsx`
**Complexity:** Medium — needs artifact data fetched alongside messages, conditional rendering by MIME type.

### Drag-and-drop file upload
**Current:** Paperclip button opens native file picker. Works but requires two clicks.
**Ideal:** Drag a file onto the message input area. Drop zone highlight, visual feedback.
**Files:** `packages/client/src/components/MessageInput.tsx`
**Complexity:** Low — standard HTML5 drag events on the input container.

### Upload progress indicator
**Current:** No progress feedback — file uploads are fast (10MB limit) so it's rarely noticeable, but large files on slow connections would feel unresponsive.
**Ideal:** Progress bar or spinner on the file chip during upload.
**Files:** `packages/client/src/components/MessageInput.tsx`, `packages/client/src/api/client.ts` (use XMLHttpRequest for progress events)
**Complexity:** Medium — fetch API doesn't support upload progress; need XHR or ReadableStream.

---

## Step 8¾: Import & Context (2026-03-18)

### "System Prompt" field label is misleading (MAXT F7)
**Current:** Channel settings shows "System Prompt" for the Layer 4 channel addendum. Users and agents perceive this as Layer 5 (entity prompt).
**Ideal:** Rename to "Shared Context" or "Channel Notes" for Layer 4. Entity prompt (Layer 5) should be labeled "Role Prompt" or "Persona." Full nomenclature pass needed — assigned to Calliope + xian.
**Files:** `packages/client/src/components/ChannelSettings.tsx`
**Complexity:** Low (rename) but requires design decision on terminology.

### Import fidelity readout
**Current:** Import flow shows message counts and dedup status. No visibility into which prompt layers were populated.
**Ideal:** After import, show a "5-layer status" card: which layers assembled, which are empty/default, what the user should fill in. "Your project instructions were imported. Entity prompt is using the default — would you like to customize it?"
**Files:** `packages/client/src/components/ImportDialog.tsx`, new component
**Complexity:** High — needs layer introspection data from server + thoughtful UX design.

### Memory freshness indicator (MAXT F6)
**Current:** No indication of when project memory was last updated relative to conversation activity.
**Ideal:** Show last-modified date of memory alongside a staleness indicator if memory is significantly older than recent conversation activity.
**Files:** `packages/client/src/components/ProjectSettings.tsx`
**Complexity:** Low — data is available (project.createdAt, message timestamps), just needs comparison logic and display.

---

## General UI

### Sidebar at scale (50+ channels)
**Current:** Accordion groups with project headers. Functional but gets long. No search/filter.
**Ideal:** See ROADMAP.md sidebar section — quick filter, archive, pin/favorites, possible project spaces.
**Complexity:** High — multiple design decisions pending.

### Action button positioning on messages
**Current:** Copy/Delete/Regenerate buttons inside message bubble. Works but can clip on narrow viewports.
**Ideal:** Consistent hover-reveal pattern that doesn't cause layout shift.
**Files:** `packages/client/src/components/MessageList.tsx`
**Complexity:** Low-medium.
