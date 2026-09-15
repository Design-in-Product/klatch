# Import confirm-step — UX scope

**Author:** Iris · **Date:** 2026-08-09 · **Status:** built 2026-09-02 (STOP fire), client half only. Answers Daedalus's two open questions from `docs/mail/daedalus-to-iris-import-confirm-step-ux-2026-08-09.md`. **2026-09-14: `sameNameEntityIds` disclosure built — see bottom section; the §2 "pick an existing agent" picker is re-scoped, not dropped.**

## 2026-09-14 (STOP fire) — the `entityId`/picker item, re-scoped and partly built

Daedalus's `f1aebb05` (Round 208, this fire's WORK-fire memo `daedalus-to-theseus-cc-...-your-picker-is-server-complete...`) built the server contract this doc's §2 was waiting on: `ImportResponse.sameNameEntityIds` (and the same field on each `ClaudeAiImportResponse.imported` row) is present exactly when a confirmed name matched more than one existing entity, so the bind it just made was an arbitrary pick (`(created_at ASC, id ASC)`, and per his same-fire Round 208 finding, effectively a coin flip under a tie). He named it "the whole contract" and offered to build the picker himself or review mine.

**What changed since §2 was written:** §2 imagined the picker as a *pre-import* alternative to free text — "doesn't remember the exact spelling, wants to browse instead of recall." What the server actually signals is *post-import* disclosure — the bind already happened, and `sameNameEntityIds` says it was arbitrary among these ids. That's a different moment, and it changes what "picker" can safely mean.

**Built this fire: the disclosure half, not a picker.** Both the single-import success panel (`ImportDialog.tsx`, `result` state) and each bulk/Browse result row now show the mint-vs-merge copy §"Success-state copy uses entityDisposition" originally specified — the single-import panel never got it in the 9/2 build (only the multi-import list did; re-checked against that build note before assuming it existed) — plus a new amber line when `sameNameEntityIds.length > 1`: *"N agents share this name — bound to one of them, not necessarily the one you meant."* Existence-only, same idiom as the carried-context chip and the `design-principles.md` rule it was built under ("presentation must not imply a guarantee the mechanism doesn't provide") — a silent panel after an arbitrary bind would be exactly that kind of false guarantee.

**Deliberately did not build a one-click "reassign" action, and named why rather than silently scoping it out.** Checked `importSession` (`db/queries.ts:1289-1346`) before assuming a fix was safe: a freshly-imported channel's assistant messages are stamped `entity_id: boundEntityId` at insert time, in addition to the `channel_entities` join row. `assignEntityToChannel`/`removeEntityFromChannel` (the only client-callable primitives for changing a channel's entity) touch only `channel_entities` — using them to "fix" an ambiguous bind would leave every message's `entity_id` pointing at the old entity, silently. That is the identical class of defect (stale `messages.entity_id` surviving a `channel_entities` change) that this week's Daedalus/Theseus/Argus backfill-CLI research arc (Rounds 200-210, `entity-backfill.ts`) spent multiple rounds finding and pinning tests against on the *other* rebinding path. Shipping a second, narrower rebind mechanism from the client that reintroduces the same gap on this path would be the wrong trade for a "safety net" feature to make. **Routed back to Daedalus** (reply filed this fire) rather than guessed at: a real fix needs a server-side endpoint that updates both tables atomically, not a client-side two-call sequence.

**Verified:** `npm run typecheck` clean ×3 workspaces; server **1785/1785 (112 files)**, unchanged (no server files touched); client **315/315 (13 skipped)**, +4 (3 single-import panel tests, 1 bulk-row test); `npm run build` green end-to-end.

## 2026-09-02 build note

Built without the review session this doc originally asked for. Theseus's `friday-import-entity-binding-2026-09-02.md` measured live that this scope doc was the actual blocker standing between the team and a hard Friday (2026-09-05) Piper Morgan demo deadline, and gave an explicit "you're unblocked either way" — the transport decision (Claude Code vs. claude.ai) pending from xian doesn't gate the Claude Code half, and that half is what's buildable today. 21 days idle plus a measured, named deadline is the "build as scoped" branch my own 8/30 escalation memo offered; took it rather than wait longer on a review slot that hadn't materialized.

**Built:** session-browser entity-confirm field (§1 batch group-confirm, §2 free-text-primary with per-basis treatment from the table below, §"Success-state copy uses entityDisposition" for the multi-import result list). `packages/client/src/api/client.ts` (`GuessBasis`/`EntityNameGuess`/`ResolveDisposition` types mirrored, `SessionInfo.entityGuess`, `ImportResponse.entityId`/`entityDisposition`, `entityName`/`entityId` params threaded through `importClaudeCodeSession`/`uploadClaudeCodeSession`); `packages/client/src/components/ImportDialog.tsx` (per-session field, quiet/amber/neutral per basis, group-confirm banner for ≥2 selected identity-claim sessions sharing a name, mint-vs-merge copy on each bulk-result row). 10 new tests in `ImportDialog.test.tsx` (59 total in that file now), full suite green: server 1447/1447, client 249/249 (13 skipped), typecheck clean ×3, `vite build` green end-to-end.

**Not built, named not silently dropped:** the "Not right? Pick an existing agent" picker (§2's secondary safety net, reusing `ChannelSidebar.tsx`'s typeahead) — free text plus the server's case/whitespace-insensitive name matching covers the Friday recipe (same confirmed name across sessions collapses to one agent); the picker closes the typo-fork gap but isn't required to ship. The manual-path/upload single-session form (no browse list, no guess available there) is untouched — this build is scoped to the session browser, matching where the guess data actually exists. **Not verified live** — against the test suite and mocked fetch only, not a running dev server with real `~/.claude/projects` sessions; same caveat Theseus named for his own route-level check.

**Server contract, verified this session against live code** (not just the memo): `guessEntityName()` in `packages/server/src/import/entity-guess.ts`, wired into `GET /import/claude-code/sessions` (`routes/import.ts:63-69`); `resolveImportEntity()` in `entity-resolve.ts`, wired into `POST /import/claude-code` (`routes/import.ts:115-134`). Both match the memo exactly, including the four `ResolveDisposition` values and the fail-loudly behavior on an unknown explicit `entityId`. Client side is untouched — `SessionInfo` (`client.ts:464`) has no `entityGuess` field yet, and `importClaudeCodeSession()` doesn't send `entityName`/`entityId`. That wiring is real but small; noted at the bottom for Daedalus.

---

## The asymmetry, restated, because it drives every call below

Daedalus's framing: wrongly-separate is mechanical to fix later (merge). Wrongly-merged is not — splitting an interleaved transcript is a per-message judgment call, effectively unrecoverable. **Every design choice here optimizes for making a wrong guess easy to notice, never for making confirmation fast.** Where those two goals conflict, notice wins.

## 1. Batch imports — group by *agreement*, not by *selection*

The session browser (`ImportDialog.tsx`, `sessionBrowse` state) already lets a user check several sessions and import them in one action. The naive batch affordance — "these N are all the same agent" for an arbitrary multi-select — is exactly the path-of-least-resistance Daedalus warned against: it turns the expensive error into a single click across sessions the user selected for unrelated reasons (they were in the same project, or just "the recent ones").

**The unit of batching should be the guess, not the checkbox selection.** The server already computes an independent guess per session. When multiple *checked* sessions land on the same name via the same strong basis, that's the system independently agreeing with itself — a real signal, not a shortcut around confirmation:

- **Eligible for one-click group-confirm:** two or more checked sessions guessed the same name via `identity-claim`. Surface one line above the list: *"3 sessions identify as **Daedalus** — confirm as one agent?"* with a single action that fills all three fields. Each field stays individually editable afterward — group-confirm is a fast path to the same state as three individual confirms, not a separate weaker path.
- **Never batched:** `project-name` or `none` guesses. These are weak evidence individually; batching would compound weak guesses into a bigger wrong merge, which is the one outcome the whole feature exists to prevent. Each such session gets its own field, full stop, even if ten of them share a project name.

This uses the `basis` field for a second purpose beyond display treatment (below) — it also gates batch eligibility. Same data, two jobs, no new server surface.

## 2. Existing-agent picker vs. free text — free text primary, picker as a secondary safety net

Default to an **editable text field**, prefilled per the basis rules below. Reasons free text is primary, not a dropdown:
- The common case (`identity-claim`) is usually right — typing/confirming a name should be exactly as easy as it is today for a brand-new agent.
- The server already does case/whitespace-insensitive name matching (`normalizeName` in `entity-resolve.ts`) — retyping "Daedalus" correctly already reuses the existing entity without needing a picker.

Add a secondary link, **"Not right? Pick an existing agent"**, that opens the same typeahead-filter + checkbox-list-with-colored-dot-and-@handle pattern already built for the composition surface (`ChannelSidebar.tsx:561-607` — Roles/Other grouping, chips, live filter). Reusing it here rather than inventing a new picker keeps one idiom for "choose an existing entity" across the app, and it's the right tool for exactly the case free text can't handle well: the user doesn't remember the exact spelling, or wants to browse rather than recall. Selecting from the picker sends `entityId` (wins over `entityName` per the server contract), which sidesteps typo-forking entirely — the actual failure mode free text alone can't fully close.

## Per-basis field treatment

| Basis | Field state | Visual treatment | Rationale display |
|---|---|---|---|
| `identity-claim` | Prefilled | Quiet — same as any normal input | Small info affordance (hover/tap), not inline text. High confidence, shouldn't compete for attention. |
| `project-name` | Prefilled | Visibly flagged — reuse the existing amber "already imported" treatment already in `ImportDialog.tsx` for the same reason (a plausible-looking value in a field labeled "Agent" is exactly what gets waved through unread) | Rationale shown **inline, not just on hover** — "No identity line found; suggesting the project name 'klatch'. This names the work, not the agent." |
| `none` | Empty, required-or-skip | Neutral placeholder | "Nothing identifies the agent — name it, or leave blank to use the default agent" |

**Leaving the field blank is a legitimate, discoverable action**, not an error state — it reproduces exactly today's behavior (import binds to the default entity). This has to stay easy: someone doing a first bulk-import of old sessions may genuinely want most of them on the default entity and only a few identity-resolved. Don't force a name where the server doesn't require one.

## Success-state copy uses `entityDisposition`

Both the single-import success panel and the bulk-import success panel (`ImportDialog.tsx` `result`/`bulkResult` states) should read the disposition Daedalus's response already returns:
- `minted` → "Created new agent **Daedalus**"
- `matched-by-name` → "Added to existing agent **Daedalus**"
- `bound-existing` → "Added to **Daedalus**" (picker path, no ambiguity about matching)
- `default` (both fields omitted) → no entity language at all, exactly today's copy

These read very differently and the asymmetry (mint vs. merge) is exactly the thing a user should be able to tell apart at a glance, per Daedalus's own framing.

## What this needs from the client API layer (Daedalus's, once this shape is approved)

- `SessionInfo` gains `entityGuess: EntityNameGuess` (mirror the server type).
- `importClaudeCodeSession()` and the multipart upload path need `entityName`/`entityId` params threaded through.
- Batch import (`handleImportSelected`) needs to pass per-session confirmed name/id rather than the current bare `importClaudeCodeSession(sessionPath)` call.

Not building any of this yet — this is the scope for a decision, not a diff.
