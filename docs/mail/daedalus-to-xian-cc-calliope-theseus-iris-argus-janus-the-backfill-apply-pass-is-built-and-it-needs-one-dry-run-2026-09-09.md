# The backfill apply pass is built — it needs one dry run from you, and nothing else

**From:** Daedalus · **To:** xian · **cc:** Calliope, Theseus, Iris, Argus, Janus
**Date:** 2026-09-09 (START fire)
**Re:** `calliope-to-daedalus-cc-team-xian-decided-backfill-2026-09-02.md` (Ask 1), and the
attention rollup's top 🔴
**Code:** `packages/server/src/db/entity-backfill.ts`, `scripts/backfill-entity-bindings.mts`
**Tests:** `packages/server/src/__tests__/round175-entity-backfill.test.ts` (17)
**Writeup:** `docs/plans/entity-backfill-scoping-2026-09-02.md` §7

---

## Why this fire went here

Round 174 closed overnight — Theseus drove the Browse route in a browser, Iris built both halves
of what he found this morning, Argus verified it at 09:02. Nothing on that thread is on my seat.
So I checked what *is*, and found three Calliope memos from 9/2 still sitting in `docs/mail/`
carrying a live item: **you ruled "backfill, not forward-only" on September 2 and the apply pass
was never built.** It has been the rollup's top 🔴 since 8/12 and open since 7/19.

I had scoped it that same day and written down "(b) the apply pass — not built." Then the round
track ran past it for a week. The thing that hid it is worth naming: I treated the sizing being
blocked on your database as the *whole* item being blocked. It wasn't. Sizing needs your DB; the
build never did.

## What shipped

Three functions, split so a review pass cannot half-perform the thing it is reviewing:
`planEntityBackfill` reads and **mints nothing**, `applyEntityBackfill` writes only what a plan
enumerated, `undoEntityBackfill` reverses a run from its record.

**Per channel, in one transaction: the binding *and* the messages, or neither.** My 9/2 scoping
found the binding lives in two places — the `channel_entities` row (P1), and the assistant
`messages` rows, which are either stamped `default-entity` (P2) or left NULL from before the
column existed (P3, invisible to *every* entity). A backfill that re-points P1 and stops looks
completely repaired in the UI and leaves each agent's own answers pooled on the placeholder. So
the load-bearing test isn't on the binding at all: it asserts `getEntityTranscript(newAgent)`
contains the user turn, the P2 reply **and** the P3 reply, and that the default's transcript is
empty afterwards.

**Four reasons it refuses to move a channel, each reported by name.** `no-guess`,
`basis-excluded`, `multi-bound` — and one I did not anticipate when scoping:
**`resolves-to-default`**. The seeded default agent is named "Claude" (`db/index.ts:351`), so a
session that opens *"You are Claude"* matches it **by name**, and "moving" it is a no-op. Applying
it anyway would have reported a success for a channel that did not move. That is Round 171/173's
shape one layer over — a placeholder the caller can't tell from an answer — and it is now a
skip reason with its own test.

**A dry run cannot write to the database it reports on.** `getDb()` runs the server's schema init
and migrations on whatever it opens. Additive and idempotent, but still a write, and a review pass
that mutates the thing under review is the wrong shape for a tool whose whole point is *look
before you commit*. So every invocation takes a `db.backup()` snapshot from a read-only handle
first; a dry run plans against the snapshot and deletes it. Verified on a file-backed fixture: the
entity table and channel count are unchanged after a dry run. (This wasn't the first design. The
first one just said so in the header — and "stating a limit is not covering it" is the lesson I
took from Round 171 four days ago.)

**Two independent ways back, both exercised end to end:** restore the snapshot, or `--undo`. The
undo record stores **message ids, not a predicate**, because after a run P2 and P3 are
indistinguishable — both carry the new entity id and only the record remembers which were NULL.
After a full apply→undo round trip on the fixture, `messages`, `channel_entities` and `entities`
are row-for-row identical to the pre-apply backup. A minted agent is deleted on undo **only if
nothing references it**: one that a later import bound to is not this run's to delete.

## What I need from you — one command, and it writes nothing

```bash
npx tsx scripts/backfill-entity-bindings.mts /path/to/your/klatch.db
```

That prints the review sheet **and** the sizing in one pass, which retires my 9/2 ask ("run the
probe") and Calliope's ("give xian a number") together — she is holding a placeholder answer for
you and explicitly declined to guess a total, which was right. What comes back: how many channels
are candidates, how many would move vs. skip and why, which names mint a new agent vs. reuse one,
and the P2/P3 row counts — including whether **P3 is non-empty on your corpus**, which is still
predicted-from-schema and fixture-demonstrated only. Paste the output and the estimate becomes
real rather than performed.

**The second thing is a decision, not a command.** §4(c) of the scoping doc: 72 guesses is too
many to confirm one at a time and too many to wave through in one click. The build's default is
the middle path — apply only `identity-claim` guesses, the strong basis `entity-guess.ts` was
built to trust — but that is a **default, not a ruling**. `--channels=<ids>` exists so the honest
version is available: read the sheet, hand back the ids you approve, apply only those. Your call
which shape you want.

## Also this fire: the ROADMAP's beta-gate line was stale, and I corrected it

`docs/ROADMAP.md` has said **"Agent continuity: NOT BUILT. The blocking item"** since 7/19. It
survived because it reads as a summary of a document whose own margins record the opposite — the
continuity gap doc has carried "RESOLVED 2026-08-10" on #2 and "PARTIAL 2026-08-12" on #3 for
weeks. Checked against the code this fire rather than against the docs: #1 built, #2 resolved
without the proposed column, #3 partial and live (layer 6, klatch-scoped by design at
`carried-context.ts:304`, verified at source).

**So the revised gate is half met, not unmet.** *"An agent can join a klatch while remaining
continuous with its own conversation"* — demonstrated live, once, by Theseus's Round 172 arm K.
*"The weekly-review use case runs end to end"* — not run. **And what stands between here and that
run is the backfill, not the wiring.** Which is the more useful thing for the roadmap to say than
"NOT BUILT," and is why the two halves of this memo belong together.

Corrected in both places, with the 7/19 banner left standing as the record of the finding and a
dated line beneath it saying not to read it as current.

## Verification

17 tests. **Negative controls**, each applied to the working tree and reverted: drop the P3 half
of the stamp → 2 fail; remove the `resolves-to-default` guard → 1 fails; leave the default binding
in place alongside the new one → 3 fail. Suite: server **1561 → 1578** across **101** files;
client **311 / 13 skipped**, unchanged — no client file touched; `npm run typecheck` clean ×3.

## Not claiming

**It has never been pointed at a database anyone cares about.** Every number above is from the
unit tests or the gitignored `.testdata/r175` fixture. The CLI path — snapshot, apply, undo record
round trip — is exercised on that fixture and by hand, not by an automated test; the module
underneath it is unit-tested, the wiring above it is not, and I am saying so rather than letting
"17 tests" cover both. Nor is delivery claimed: commits are local as of writing; the wrapper owns
that.

— Daedalus
