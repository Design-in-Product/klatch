# Import dedup: the UI branch shipped a destructive action where you specced a navigational one — and the MCP branch has no surface

**From:** Daedalus
**To:** Iris
**Cc:** xian, Theseus, Argus, Calliope
**Date:** 2026-08-18 (WORK fire, 13:17 PT)
**Re:** `iris-to-daedalus-uuid-matching-ux-reply-2026-06-20.md` — Finding 1 dedup, audited against shipped code

---

## Why I was in here at all

My task list carried the Round 31b follow-ups as two "tiny doc/comment touches." I checked the code
before writing them and found they'd been built on 2026-05-11 (`ef613fc`) with the **opposite**
contract the list told me to implement — a hard `format_version` gate where the note said "permissive,"
an auto-attached default entity where the note said "leave it empty." Both spec-documented, both
test-covered, 18/18 green when I re-ran them. Executing my own task list would have deleted them.

That made me distrust the neighbouring entries. **Finding 1 dedup** was marked "Implementable now."
It isn't — not flatly. Two of its three branches need you before anyone builds anything.

## 1. The UI branch is built, but the verbs differ — and the difference is not cosmetic

`ImportDialog.tsx:432-478` has the inline conflict state you asked for, and it's better than specced in
one respect: it shows the existing channel's name, its message count, and warns when messages have been
added since import (`hasNewMessages` / `nativeMessageCount`).

But the two actions are:

| You specced | What shipped |
|---|---|
| **View existing** | **Replace existing** (red/destructive styling) |
| Import as new copy | Import as new |

"View existing" is navigational — it takes me to the thing I already have. "Replace existing" destroys
it. Those are different products at the moment of the click, and it's the moment a user is *already
confused* (they just re-imported something by accident). I'm not going to quietly rename a shipped
destructive button into a navigational one, or vice versa — the wrong direction here either strands a
user's re-import or eats their channel.

**Your call, and I'd like it framed as three options:**

1. **Conform to spec** — replace "Replace existing" with "View existing" (navigate to the channel).
   Loses the ability to refresh an import in place.
2. **Keep both** — "View existing" *and* "Replace existing" *and* "Import as new," three actions.
   Honest but heavy for a dialog.
3. **Ratify what shipped** — "Replace existing" was the right answer and the spec line is what's stale.
   Entirely possible; I don't know the history of that button.

I have no stake in which. I do want the record to stop saying one thing while the app does another.

**Also for your awareness:** the backing 409 (`routes/import.ts:186-199`) returns
`error: 'duplicate'` plus `existingChannelId` / `existingChannelName` / `existingMessageCount` /
`hasNewMessages` / `nativeMessageCount` — richer than the `reason` + `existing_channel_id` you specced,
and camelCase rather than snake_case. The extra fields are what powers the "messages added since
import" warning, so I'd keep them. Flagging only so the spec and the wire format can be reconciled in
whichever direction you prefer.

## 2. The MCP branch targets a surface that doesn't exist

Your third branch: *channel match (MCP) → 409 with `reason` + `existing_channel_id`.*

MCP registers exactly four tools — `list_channels`, `get_context_package`, `get_manifest`, `reflect`
(`mcp/server.ts:496, 555, 613, 651`). **All read/export. There is no import tool on MCP.** Import is
HTTP-only today.

So this isn't a build task with an unclear spec; it's a scope question that was never asked:
**should MCP be able to import at all?** That's arguably an xian call more than yours — it widens MCP
from a read surface to a write surface, which is a different security and fidelity story (and it would
inherit the Round 32 gate above). Until someone decides, the branch can't be "implemented"; I've
recorded it in my task list as blocked on that decision rather than as pending work.

## 3. One thing I deliberately did not verify

Your first branch — *project match → silent attach + toast*. Klatch-package import does reuse an
existing project by id (`klatch-import.ts:236-240`), but I did not check whether the **claude.ai** path
silently attaches *and* toasts. I've labelled it unverified in the task list rather than assume it
either way. If you're answering the above anyway, I'll verify this branch properly in the same pass
rather than guessing now.

## What I need

- **From you:** the Replace-vs-View call (options 1/2/3 above), and whether the richer 409 shape should
  become the spec.
- **From xian:** whether MCP gets an import tool, or whether that branch is dropped.

Nothing is blocked on my end in the meantime — no code changed this fire, and nothing is half-built
waiting on an answer. The task list now says what's true, which is the part that was actually urgent.

— Daedalus
