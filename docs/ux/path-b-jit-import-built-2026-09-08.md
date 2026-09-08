# Path B — just-in-time import, built

**Author:** Daedalus · **Date:** 2026-09-08 (START fire)
**Spec:** `docs/ux/spec-composition-gesture.md` §3 (Path B), §5 (integration point), §11a (scheduling decision, xian 2026-08-10)
**Commit:** `32e00a0` · **Files:** `packages/client/src/components/ChannelSidebar.tsx`, `packages/client/src/components/ImportDialog.tsx`, `packages/client/src/App.tsx`, `packages/client/src/__tests__/composition-path-b-jit-import.test.tsx`
**Status:** built on `claude/daedalus-cycle`, not yet endpoint-driven (see *Coverage limit*).

## Why this was sitting unbuilt, and what actually unblocked it

§11a scheduled Path B on 2026-08-10 sequenced after continuity increments #2–#3. On 2026-09-02 I found that sequencing named the wrong dependency: the real blocker was Iris's import confirm step, because before it the client sent no entity fields and a just-in-time import would have bound the new agent to `default-entity` — delivering an agent with no identity, which is the exact broken thing §11a says the path must not do.

That blocker cleared on 2026-09-02. **Re-verified this session, not recalled:** `routes/import.ts:189-196, 200-233` accepts `entityName`/`entityId` on both the upload and the path call, `:382-389` returns the resolved `entityId` and its disposition, and `ImportResponse` (`api/client.ts:369-373`) carries both. So the server half has been ready for six days and nothing was asking for it.

## What was missing on the client

Two things, one of them a defect independent of Path B.

**1. There was no way in.** The import affordance lived only in the sidebar's own button list. From inside the New Chat / New Klatch form, importing meant abandoning the form.

**2. The registry was loaded once, at mount, and never refreshed by an import.** `App.tsx:75-79` fetches entities in a `useEffect` with `[]` deps; the only other writers were the entity manager's own create/update/delete handlers. `onImported` refreshed **channels** and navigated. So an import that minted an agent produced an agent the composition picker could not see **until the page was reloaded** — including for the pre-existing, non-Path-B flow. This would have made Path B look like it silently did nothing while in fact the import had worked perfectly.

That second one is worth saying plainly: it was reachable before this change, by importing an agent and then opening New Klatch.

## What shipped

**The affordance.** "Import an agent" renders inside the setup form for both types, with one line saying what it does: *bring one in from Claude Code or claude.ai — it arrives with its conversation*. It sits **outside** the picker's `entities.length > 0` gate. That is deliberate: on a fresh install the registry is empty, the picker does not render at all, and that is exactly the case where the composition gesture should be the front door for import rather than a dead end. §3's own framing — "the user doesn't need to import agents before they can convene" — is unserved if the affordance only appears once you already have agents.

**The dialog knows where it was opened from.** `ImportDialog` takes a `composeMode` prop that changes exactly one thing: the completion button reads **"Use this agent"** rather than **"Go to channel"**. The import machinery, the routes, and the `ImportResponse` handed to `onImported` are byte-identical either way. §5 called this a UX integration point and that is all it is; where a finished import goes is the *caller's* decision, so the caller is where it is made.

**Seating follows the picker's existing cap rules.** Chat replaces at cap 1 (the radio semantics the picker already uses); klatch adds while under 5. So Path B cannot compose a roster `routes/channels.ts` would 400 — the same invariant Path C established.

**Keyed on a token, not on the entity id.** `importToken` is bumped by `App` on every completed compose-mode import. Keying the effect on `importedAgentId` would go quiet the second time you import the same agent — including the real sequence *import → remove the chip → import again*, where the user's most recent gesture would produce nothing.

## The two ways it can fail to seat are said out loud

Silently dropping the agent a user just imported is the failure mode this seam invites, so both cases are named in the form:

1. **Klatch roster already at 5.** The import succeeded and the agent exists; it just cannot be seated here. The form says *"Imported — the roster is full (5). Remove an agent to seat it."* rather than leaving the gesture looking broken.

2. **An import that returns no agent.** Reachable two ways. The duplicate path (`handleViewExisting`) synthesizes its `ImportResponse` from an `ImportConflict`, and `ImportConflict` (`api/client.ts:615-623`) **carries no entity** — verified, not assumed. And a claude.ai bulk import has many channels and no single agent to seat. For the first case `App` now asks the channel for its bound agent (`fetchChannelEntities(result.channelId)`) before giving up, which recovers the common one; when even that comes back empty, the form says *"Imported, but no agent came back with it — pick one from the list."*

## Verified, not assumed

- **The server already accepted everything needed** — read at source this session (`routes/import.ts`, `api/client.ts`), not carried from the 9/2 memo that first noticed it.
- **The entity-refresh gap was read from the live code**, not inferred: `App.tsx` mount effect with `[]` deps, and no `fetchEntities` call on any import path before this change.
- **Negative control run on the tests.** With the three component files reverted to `HEAD~1` and the new test file kept, **13 of 15 fail**. The 2 that pass are the two guards that should pass either way: "is absent when the caller does not wire it" and "still says Go to channel outside compose mode." A test file that stays green against the old code is testing nothing.

## Coverage limit — stated, not implied

The 15 tests cover `ChannelSidebar` and `ImportDialog` directly. **They do not cover the `App.tsx` wiring**: compose-mode routing, the suppressed navigation, the entity refresh, and the `fetchChannelEntities` fallback on the duplicate path are each driven by hand-read code and typecheck only. There is no App-level test in this repo (`packages/client/src/__tests__/` has none), and inventing one for this change would be a larger piece of work than the change.

So: the seam is pinned, the wiring is not. The natural closer is an endpoint drive — import a real session from inside the form and confirm the agent arrives selected and the created channel binds to it — which is Theseus's instrument, not mine.

## Suite

Typecheck clean across all three workspaces. Server **1561 passed / 100 files** (unchanged — no server file touched). Client **282 passed / 13 skipped**, up from 267 (+15, all new).

## What this does not touch

§11's HELD half — "New agent / role (create from scratch)" — is untouched and stays held on the `PREMISE.md` framing grounds xian ruled on 2026-08-10. Nothing here offers minting an agent from a prompt. The button says *import*, and the line under it says the agent arrives with its conversation, which is the distinction the hold exists to protect.
