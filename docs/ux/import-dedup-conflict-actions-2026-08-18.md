# Import dedup conflict dialog: Replace-vs-View, decided

**Date:** 2026-08-18 (STOP fire)
**Prompted by:** `daedalus-to-iris-cc-team-import-dedup-audit-two-calls-are-yours-2026-08-18.md`
**Supersedes:** the channel-match section of `docs/mail/read/iris-to-daedalus-uuid-matching-ux-reply-2026-06-20.md`

## What was wrong

The 6/20 spec called for the channel-match conflict dialog to offer **"View existing"**
(navigational) and **"Import as new copy"**. What shipped (`ImportDialog.tsx`, conflict
state) offers **"Replace existing"** (destructive — deletes the channel) and **"Import as
new"**, plus a **"Cancel"** button. There is no navigational option: a user who reimports
something by accident has no way to just go look at what they already have without either
deleting it or creating a duplicate.

Daedalus framed three options and declined to pick: conform to spec (drop Replace),
keep all three actions (add View as a fourth button), or ratify what shipped (Replace was
the right call, the spec line is stale).

## Why none of the three as posed

**Conform to spec (drop Replace):** the shipped conflict payload carries `hasNewMessages`/
`nativeMessageCount` — fields the 6/20 spec never anticipated, added because someone
needed to detect that a native channel diverged from its imported source. That only
matters if there's a way to *resync* a diverged channel, which is exactly what Replace
does (delete + reimport). Dropping Replace would silently retire a capability the team
already built support for. Not a live regression to ship.

**Keep all three actions:** the "heavy" framing undersells the actual cost, but not for
the reason Daedalus's option assumed. The existing three-button stack already had a
"Cancel" slot that does nothing "Import" — it calls `handleReset()`, the exact same
function bound to the header ✕ (verified: `ImportDialog.tsx`, the ✕'s `onClick` and the
conflict-state Cancel button's `onClick` were the same handler). Adding a fourth distinct
button isn't required — the dialog already has a free slot doing double duty with the
header close.

## Decision

Repurpose the redundant Cancel slot: **View existing / Import as new / Replace
existing**, no fourth button, same footprint as what shipped. The header ✕ remains the
plain "abandon, don't answer" affordance (unchanged, still `handleReset`).

**Reordered and restyled**, not just relabeled:

| Position | Action | Style | Why |
|---|---|---|---|
| 1 (top) | View existing | `bg-accent` (primary) | Navigational, non-destructive, matches the "primary action" framing from the original spec and the styling already used for the success state's "Go to channel" |
| 2 | Import as new | neutral (`border-line`, was Cancel's style) | Legitimate secondary choice, not the escape hatch anymore |
| 3 (bottom) | Replace existing | `bg-red-600` (destructive), unchanged | Kept — the resync capability above — but moved out of the top slot |

The reorder is deliberate, not cosmetic: Daedalus's own framing named the risk — "it's the
moment a user is *already confused* (they just re-imported something by accident)." The
shipped dialog put the destructive action *first*, the exact position most likely to catch
a mis-click from someone skimming. Moving it last while keeping the warning color is a
real reduction in that risk, not just a rename.

**Wire shape: ratify what shipped.** The richer camelCase 409 (`error: 'duplicate'` +
`existingChannelId`/`existingChannelName`/`existingMessageCount`/`hasNewMessages`/
`nativeMessageCount`) becomes canonical. Checked before ratifying: no code anywhere in
the repo — client, server, or tests — references the spec's snake_case
`existing_channel_id` / bare `reason` shape; it only ever existed in the mail. Nothing to
migrate.

## Implemented

`ImportDialog.tsx`: new `handleViewExisting()` (mirrors `handleGoToChannel`'s shape —
synthesizes an `ImportResponse` from the `conflict` object and calls `onImported`, same
pattern already used by `handleGoToBulkChannel`). Conflict-state button block reordered/
restyled per the table above. Tests: `ImportDialog.test.tsx` — asserts all three buttons
present, replaced the "Cancel from conflict state closes dialog" test with "View existing
navigates to the existing channel without deleting or duplicating it" (asserts
`onImported` called with the existing channel id + `duplicate: true`, `onClose` called,
`deleteChannelApi` **not** called, and only one `importClaudeCodeSession` call — i.e. no
reimport happens). `npm test -w packages/client` 233/233 (net unchanged — one test
replaced, not added); `npm run typecheck` clean ×3 workspaces.

## Not decided here (Daedalus's other two branches)

- **MCP import surface (branch c):** correctly parked as xian's call — MCP has no import
  tool today, so "conform to spec" isn't buildable until someone decides whether MCP
  should gain a write surface at all.
- **claude.ai project-match toast (branch a):** Daedalus offered to verify this himself
  in the same pass once the above landed — left to him, not reverified here.
