# Round 171 fix — the manual import path can name its agent, and the form refuses the placeholder

**Author:** Daedalus · **Date:** 2026-09-08 (MID fire) · **Commit:** `70b9ba1`
**Reported by:** Theseus, Round 171 — `docs/research/round171-path-b-driven-in-a-browser-the-default-way-in-seats-the-default-entity-2026-09-08.md`
**Fixes a defect in:** Path B (`32e00a0`, same day) — see `docs/ux/path-b-jit-import-built-2026-09-08.md`

---

## The defect

Theseus drove Path B in a real Chromium against a real server. 17/17 regression checks
passed — the gesture works as built. And the route a user reaches first seated the wrong
agent, silently.

Open New Chat → "Import an agent" → the dialog opens **on the manual path input** → import
a Piper Morgan session → "Use this agent." The form came back with one chip selected,
reading **"Claude."** No notice. The composed chat resolved to `entityId=default-entity`,
and the imported session's own identity marker was **absent from the assembled prompt**.

The chain, verified at source this session rather than carried from the report:

| # | Where | What happens |
|---|---|---|
| 1 | `ImportDialog.tsx` manual path | calls `importClaudeCodeSession(path, channelName)` with **no `entityName`** |
| 2 | `entity-resolve.ts:77-80` | blank confirmed name → `{ disposition: 'default' }` |
| 3 | `routes/import.ts:382-389` | `entityId` spread in only if one resolved → response carries none |
| 4 | `queries.ts:1280` | `params.entityId \|\| DEFAULT_ENTITY_ID` — the channel gets an entity anyway: the placeholder |
| 5 | `App.tsx` `onImported` | no `result.entityId` → falls back to `fetchChannelEntities`, which faithfully returns the placeholder, and seats it |

Steps 1–4 predate Path B and were survivable: an unidentified import produced an
unidentified channel, which is at least honest. Step 5 is what turned it into a **silent
wrong answer** — a chip that positively asserts an agent was seated.

Two things I want to be precise about, because the report was:

- **The fallback is right for the case it was written for.** On the duplicate path
  ("View existing") the `ImportConflict` payload genuinely carries no entity and the
  channel genuinely knows the answer. `fetchChannelEntities` is the correct question there.
- **The failure is not a `fetchChannelEntities` failure.** It is a `fetchChannelEntities`
  *success* returning a placeholder, which the caller could not tell from an answer.

The same mechanism reached the duplicate path from inside the form (Theseus's arm F):
re-import → "Already imported" → "View existing" → `chips=["Claude"]`, `notice=null`.

## The fix — both shapes Theseus named, the second guarding the first

### 1. The confirm step now exists on the manual and upload paths

The manual path and the `.jsonl` upload path were the only import routes in this dialog
that skipped identity confirmation altogether. They now carry an **Agent** field, sent as
`entityName` — the same field the Browse rows send, resolving through the same
`resolveImportEntity` (match by name, or mint). Carried through **replace** and
**fork-again**, since neither changes who the session is.

**Deliberately not pre-filled from a guess**, unlike the Browse rows. Two reasons, and the
second is the one that decided it:

- There is no scanned `entityGuess` for a typed path or an uploaded file. Producing one
  means a new server round trip (or, for the upload path, sending the file twice) to
  compute `guessEntityName` from the first user message. That is a real capability and it
  is deferred, not rejected — noted below.
- `routes/import.ts` already states the principle for the Browse panel: *"a confirmation
  the user can't evaluate is a rubber stamp, and a plausible wrong name is likelier to be
  waved through than a blank field."* Browse is confirming twenty at a time and the
  pre-fill earns its risk. Here there is one session, and a blank field the user fills
  deliberately is the more honest control.

Blank still means *"I'm not saying"* — the import proceeds and binds nothing, which the
form now reports rather than papering over.

### 2. `resolveJitSeat` refuses the placeholder

New: `packages/client/src/utils/jitSeat.ts`.

```
resolveJitSeat(importedEntityId, channelEntities) → { entityId? , unidentified? }
```

- An entity that arrives **with the import** is an answer — minted, matched, or explicitly
  chosen — and seats. **This holds even when it is the default entity**: a user who types
  "Claude" into the confirm step resolves matched-by-name, comes back on
  `result.entityId`, and still seats. That is a choice, not a placeholder, and only the
  *fallback* is guarded.
- An entity that arrives from the **channel** is trusted unless it is `DEFAULT_ENTITY_ID`,
  which the channel cannot distinguish from an answer and this must.
- Nothing at all → `{}`, reported as before.

**Extracted from `App.tsx` rather than fixed in place.** The inline version was wrong and
no test in this repo could catch it — the stated coverage limit in my own 9/8 START log
was *"the `App.tsx` wiring … is typecheck-and-hand-read only,"* and this is precisely the
thing that limit was hiding. The decision is small and load-bearing, so it now lives
somewhere it can be pinned.

### 3. The form says which of the two nothings happened

`ChannelSidebar` gains `importUnidentified`. Two states with the same remedy but not the
same fact:

- nothing came back → *"Imported, but no agent came back with it — pick one from the list."*
- nothing was identified → *"Imported — the session didn't name an agent. Pick one, or re-import with a name."*

The old wording would have been *false* in the second case: an agent **is** bound, it is
just the placeholder. **Copy is Iris's call — routed, shipped as a proposal.**

## Verification

- **Negative control, run before the strengthening pass:** reverted `ImportDialog.tsx` and
  `ChannelSidebar.tsx` to `HEAD~1` and neutered `resolveJitSeat` to the pre-fix inline
  logic, keeping the test file → **6 of 13 failed**. The 7 that passed are the ones that
  should pass either way (an import that resolved an entity seats it; a channel holding a
  real agent seats it; the empty cases; the original wording; blank sends no name).
  Restored with `git checkout HEAD --`; `git status --short` empty after.
  - One test — *"seats nothing at all rather than a placeholder chip"* — passed pre-fix,
    because it handed the sidebar a hardcoded `importedAgentId={undefined}` and the
    sidebar half was never the broken half. **Rewritten to drive through `resolveJitSeat`**
    so it exercises the whole fallback chain minus App's fetch. It fails pre-fix now, by
    construction; the pre-fix run above predates the rewrite and is reported as it ran.
- **Typecheck** clean (client project).
- **Suite:** client **295 passed / 13 skipped**, up from 282 (+13). Server **1561 passed /
  100 files**, unchanged — no server file touched.
- **Three pre-existing `ImportDialog.test.tsx` assertions updated**, not worked around:
  they pinned exact call arity on `importClaudeCodeSession`, and the manual path now
  passes a fourth argument. Behaviour identical; the assertions record the new signature.

## Stated limits

- **Still not endpoint-driven by me.** The same limit as the original Path B build: there
  is no App-level test in this repo, so App's *wiring* to `resolveJitSeat` is
  typecheck-and-hand-read. The decision it wires to is now tested. Routed back to Theseus.
- **The single-session Browse import is still undriven.** Theseus stated this limit
  explicitly: the panel pre-selects every not-yet-imported session, so he drove
  multi-select only. A one-session browse may route through `onImported` rather than
  `onBulkImported`. Unresolved, by either of us.
- **Not built: a guess for the manual path.** `POST /import/claude-code/guess` — take a
  path (or a file), parse, return `guessEntityName(firstUserMessage, projectName)`, and
  pre-fill the new field the way Browse rows are pre-filled. Sized but not started; it is
  an enhancement to a route that now works, not a fix to one that doesn't.
- **Whether the default entity can be deleted** — Theseus's open question about the
  orphan-registry state — is untouched here and still open.
