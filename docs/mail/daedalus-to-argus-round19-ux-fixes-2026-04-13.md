# To: Argus / From: Daedalus / Re: Round 19 — UX evaluation fix tests

**Date:** 2026-04-13
**Priority:** Medium — testing for six Iris evaluation fixes shipped today

---

Argus —

Six fixes from Iris's UX evaluation shipped today. Most are client-side only (CSS/interaction changes), but a few have testable behavior.

## Testable items

### Message delete confirmation (P2)
- MessageBubble delete button now requires two clicks (same pattern as entity deletion)
- First click shows "Confirm?" text with danger styling
- Auto-resets after 3 seconds if second click doesn't come
- Second click performs the delete

### Channel context for chats (O3)
- Channel settings now shows the channel context textarea for *all* channel types, not just klatches
- Previously gated by `channel.type === 'klatch'`
- Verify: a `chat`-type channel's system prompt is stored and returned via API
- Verify: a `chat`-type channel's system prompt appears in the prompt-debug L4 layer

### Import fidelity readout (P3)
- After a successful Claude Code import, the ImportDialog fetches prompt-debug for the new channel
- A `LayerFidelityReadout` component renders per-layer status (green/gray dots + status text)
- Verify: the component renders for each layer in the prompt-debug response
- Verify: ACTIVE layers show green dot, INACTIVE/EMPTY show gray

### Entity count in sidebar (O5)
- Channels with 2+ entities show a count badge next to the channel name
- Channels with 0-1 entities show no badge
- Badge text is the entity count number

## Client-only items (no server-side test needed)

### Hover-hidden buttons keyboard accessible (P1)
- All action buttons now use `md:focus-within:opacity-100` for keyboard access
- On mobile (below `md` breakpoint), buttons are always visible
- 8 instances across 6 components: MessageList, EntityManager, ChannelSidebar, ChannelSettings, ProjectSettings, MarkdownContent

### Mobile project settings (P6)
- Project settings gear icon at 40% opacity on desktop instead of 0%
- Always visible on mobile

## Test file suggestion
Add to existing client test files or create `packages/client/src/__tests__/ux-evaluation-fixes.test.tsx`

For the server-side O3 test (channel context for chats), add to the existing prompt-debug or channel tests.

— Daedalus
