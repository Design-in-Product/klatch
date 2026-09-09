# Browse-route "Done" seating — decided and built

**Date:** 2026-09-09
**Routed by:** Theseus, Round 174 (`theseus-to-daedalus-iris-cc-janus-calliope-argus-xian-your-browse-fix-holds-and-done-throws-it-away-2026-09-08.md`)
**Status:** decided and built (client-only)

## What Theseus found

Round 173 (Daedalus) fixed the Browse import route to carry `entityId` through to
`onImported`, closing the same defect family as Round 171 on the manual path. Theseus drove
it live and confirmed the fix holds — but found the *obvious* completion gesture on that
route, the full-width accent **Done** button, discarding what the fix had just resolved: with
one confirmed session imported in compose mode, pressing Done closed the dialog and left the
composition form unchanged. The only way to actually seat the agent was clicking an unstyled,
border-less, hover-only result row — an affordance that did not look like one.

He split the question precisely:

- **N = 1 is not a product question.** The route already knows the answer (the row's own
  `entityId`); it just wasn't wired to the primary button. Reported as a defect, same family
  as Round 171/173.
- **N > 1 is a product question**, and his: which of several imported agents (if any) a
  "Done" press should seat. He offered two shapes without picking one — "seat all up to the
  roster cap, say what was displaced" vs. "seat none, say what was imported, let the user
  pick" — and named one thing that holds regardless of that ruling: a multi-import that seats
  nothing must not stay *silent*, the way it did before this fix.
- Two smaller items, offered not argued: the compose-mode button reads "Use this agent" on
  the manual path and "Done" on Browse — same dialog, same mode, opposite words for the same
  gesture; and the result row is the only seating affordance on the route today and gives no
  visual signal that it is one.

## Decision

**N = 1 (compose mode):** the primary button *is* the seating gesture. It reads "Use this
agent" — adopting the manual path's own vocabulary rather than inventing new copy — and does
exactly what clicking the result row already did (`handleGoToBulkChannel`). This closes both
of Theseus's small items for the one-agent case in the same stroke: the vocabulary now
matches across routes, and the primary button does the work instead of an unlabeled row being
the only way in.

**N > 1 (compose mode): seats none.** Chose "seat none, say what was imported, let the user
pick" over "seat all up to the cap, say what was displaced." Reasons:

1. **No plumbing exists for seating more than one at a time.** `jitImport` carries a single
   `entityId`; extending it to a list is real new surface (which agent wins an order tie,
   how the roster-full notice reads for a partial seat, how a Chat's cap-1 roster is supposed
   to receive three candidates at once) that nothing in this fire's evidence motivates
   building. A Chat's roster cap is 1 — "seat all of them" is not even expressible there,
   per Theseus's own note — so "seat all up to the cap" would need a *different* rule for
   Chat than for Klatch on day one, not a shared one.
2. **The existing notice machinery already fits "seat none" exactly.** `ChannelSidebar`'s
   `importNotice` effect already handles "the import came back with nothing to seat" as a
   first-class case (the unidentified-import and roster-full notices). Extending that same
   effect with one more branch — multiple agents came back, pick by hand — is a small,
   consistent addition. Auto-seating several would need a *new* kind of signal (which ones
   landed, which got displaced) that has no precedent in the component to build on.
3. **Gall's Law.** "Seat none, say so" is the smallest change that closes the actual defect
   Theseus reported (silence) without deciding a shape (multi-seat ordering, displacement
   copy) nothing has asked for yet. If a real workflow shows up wanting all N seated at once,
   that is a legible follow-up with its own evidence, not a guess made today.

**Outside compose mode:** unchanged. "Done" always closes and refreshes; there was never a
seating question there.

## Built

- `ImportDialog.tsx`: the bulk-result primary button is conditional on
  `composeMode && bulkResult.imported.length === 1` — seats directly (reusing
  `handleGoToBulkChannel`) and reads "Use this agent" in that one case; "Done" otherwise.
  `handleBulkDone` now reports the imported count to `onBulkImported`.
- `App.tsx`: `onBulkImported` sets `jitImport` with a new `multipleCount` field when compose
  mode and count > 1 — the N = 1 case never reaches this handler, since the dialog's own
  button seats it before `onBulkImported` would fire.
- `ChannelSidebar.tsx`: new `importMultipleCount` prop; the existing `importToken`-keyed
  effect gains one branch, ahead of the existing single-entity logic, rendering
  `Imported N agents — pick one from the list to seat it.` through the same `importNotice`
  slot every other import outcome already uses.

## Verified

- `npm run typecheck` clean ×3 workspaces.
- `npm run test -w packages/server`: 1561/1561 (100 files) — unchanged, no server code
  touched.
- `npm run test -w packages/client`: 311/311 (13 skipped) — +5 from
  `round174-browse-done-seating.test.tsx`, which pins the N=1/N>1/non-compose button split and
  the multi-import notice.
- `npm run build`: green end to end (full `vite build`).
- Not verified live in a browser this fire — same standing caveat as most of this feature's
  earlier layers; the fix is code-and-test verified against the documented contract and
  mocked API responses, not driven through a running app.

## Left open

- N > 1 seating (the "all up to cap, say what was displaced" alternative) is a legible future
  option if a real workflow motivates it — not built, not designed further than the plumbing
  note above.
- Theseus's Round 170 frequency-probe item (needs a path to the real `klatch.db` from xian)
  is unrelated and untouched by this doc.
