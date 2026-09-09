# Round 173 — the confirmed identity on every import route, and one that dropped it

**Daedalus · 2026-09-08 (STOP fire) · builds on Rounds 171/172**

Round 171 fixed the manual import path; Round 172 (Theseus, Playwright, 29/29) drove it and
the duplicate path at the endpoint and closed the two arms I routed back. Theseus's memo left
four limits open by name. This fire closes two of them and answers a third.

## What was open, and what happened to each

| Theseus's open item | Status after this fire |
|---|---|
| "The other seven call-site combinations" — `manualEntityName` feeds submit / replace / fork-again, each branching on `jsonlFile`; he drove one | **Closed by test. No defect found** — all six combinations already carried the name. Now pinned, not hand-read |
| "Single-session Browse import — undriven by either of us" | **Driven, and it was broken.** Fixed below |
| "Whether the default entity can be deleted" | **Answered from source** — not via the API. Detail below |
| "Round 170's frequency probe — needs one path to the real `klatch.db`" | Still open. Needs xian |

## The defect: the Browse route dropped the entity the import resolved

`ImportResponse` carries `entityId` — what the confirm step actually resolved, by minting, by
matching a name, or by an explicit choice. The manual path passes it to `onImported`, and
`App.tsx` hands it to `resolveJitSeat`, which treats a present id as an answer.

The Browse route did not. Two places dropped it:

1. `handleImportSelected` recorded `entityDisposition` and `entityName` off each import result
   and **not `entityId`** (`ImportDialog.tsx:378`, the `imported[]` accumulator).
2. `handleGoToBulkChannel` — the click target on each row of the result list — called
   `onImported({ channelId, channelName: '', messageCount: 0, artifactCount: 0, source:
   'claude-ai', duplicate: false })`. A channel id, and four zeros.

So **every** Browse import reached the composition form through App's *fallback* branch
(`App.tsx:683`), where the only evidence available is what the channel is bound to. And the
channel's binding cannot distinguish the two cases this whole round is about: `createChannel`
binds `DEFAULT_ENTITY_ID` when an import resolved no identity (`queries.ts:1280`), and it binds
`DEFAULT_ENTITY_ID` when a user confirmed the name "Claude". `resolveJitSeat` correctly refuses
the first. On the Browse route it would have refused the second too.

That is Theseus's arm B3 — *"typed the literal `Claude` → still seats"* — failing on the sibling
route. It passes on the manual path only because `result.entityId` is there. The guard was never
wrong; it was being handed less evidence on one route than on the other.

**The shape is Round 171's own, one layer over.** Round 171: a route that didn't *send* the
name. Round 173: a route that didn't *return* the resolved entity. Both times the feature was
correct where it was driven and silently degraded where it wasn't, and both times the degraded
version's output was indistinguishable from a legitimate one — a chip reading "Claude", or the
absence of one.

### The fix

- `ClaudeAiImportResponse.imported[]` gains `entityId?: string` (`api/client.ts`), documented
  as the same field the manual path already carries.
- `handleImportSelected` records `result.data.entityId`.
- `handleGoToBulkChannel` takes the row rather than a bare channel id, and passes `entityId`
  through — along with the row's real `channelName` and counts, which were being zeroed, and a
  `source` that reflects the actual import mode instead of a hardcoded `'claude-ai'` on what may
  be a claude-code session. (App reads neither of those today; they were still wrong.)

The multi-select "Done" button (`onBulkImported`) still seats nothing in compose mode. That is
**not** fixed here and I don't think it's the same bug: with three sessions imported at once
there is no single agent to seat, and "seat all three" is a product decision, not a plumbing
one. Recorded as an open question rather than guessed at.

## The other five call sites: tested, and they were fine

`packages/client/src/__tests__/round173-import-identity-on-every-route.test.tsx` drives the
dialog through all six {submit, replace, fork-again} × {typed path, uploaded `.jsonl`}
combinations plus blank-on-upload. **All six carried the confirmed name before this fire.** The
hand-read was right. It is now a test, so the next edit to any of those three handlers has
something to fail against.

Reporting a null result as a null result: seven of the ten new tests pin behavior that was
already correct. The three that matter are the Browse ones.

## Verification

- **Negative control** (fix reverted to `HEAD` with `git checkout HEAD --`, test file kept):
  **2 of 10 fail** — `passes the import-resolved entity to onImported` and `a Browse row that
  confirmed "Claude" still seats`. The third Browse test passes either way, correctly: it pins
  the unidentified→fallback path, which was never broken. Files restored from an in-worktree
  backup; `git status --short` afterwards shows only the intended three paths.
- **A mock that lied, caught and fixed.** The first draft's `SessionBrowseResponse` fixture used
  `project` / `modified` / `name` where the real shape has `projectPath` / `modifiedAt` /
  `projectName`, and passed only because of an `as never` cast. The tests still went green — the
  browse panel rendered a list with `key={undefined}` and React said so in stderr. The fixture is
  now typed as `SessionInfo` / `SessionBrowseResponse` with no cast, so the next divergence is a
  typecheck failure rather than a warning nobody reads.
- **Typecheck** clean (client project). **Client 305 passed / 13 skipped** (was 295, +10).
  **Server 1561 passed / 100 files**, unchanged — no server file touched. Root `npm test`
  (typecheck + server + client) exits 0.

## Answer: can the default entity be deleted?

Theseus asked because an empty registry is the only route he could see to Iris's orphan state.

**Not through the API.** `routes/entities.ts:171-173` refuses `DELETE /entities/:id` with 400
when `id === DEFAULT_ENTITY_ID`, before the existence check. Pinned by
`round3-expansion.test.ts:280` ("cannot delete default entity via API"). The client's
`deleteEntity` (`api/client.ts:218`) has no other route to the table.

**One caveat, stated because it's the honest version:** the guard is at the route, not in the
query. `queries.ts:467` `deleteEntity(id)` deletes any id given, including the default, and
cascades the `channel_entities` rows in the same transaction. Nothing in the app calls it that
way today — I read every call site — but a future server-side caller would find no seatbelt
there. Not moving the guard this fire; recording where it is.

## Files

- `packages/client/src/components/ImportDialog.tsx` — the fix
- `packages/client/src/api/client.ts` — `entityId` on the bulk row type
- `packages/client/src/__tests__/round173-import-identity-on-every-route.test.tsx` — 10 tests

## Still open

1. **Multi-select Browse in compose mode seats nothing.** Product question above.
2. **App's wiring** remains endpoint-driven only (Theseus's Round 172), not unit-tested — there
   is still no App-level test harness in this repo.
3. **Round 170's frequency probe** — needs one path to the real `klatch.db` from xian.
4. **`deleteEntity` query-level guard** — noted above, not built.
