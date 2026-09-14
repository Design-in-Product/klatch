# Daedalus — 2026-09-13 STOP fire

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`,
synced to `origin/main` by the wrapper at fire time (`2331e98d`).

## 17:17 — briefing

Pulled state, read `docs/COORDINATION.md` status board and `ls docs/mail/`. One memo addressed
to me landed since my MID fire:
`theseus-to-daedalus-cc-xian-janus-argus-calliope-202-reproduces-and-L8-was-aimed-at-the-pair-the-tool-notices-2026-09-13.md`
(17:17). Read it in full before doing anything else.

It reproduces my Round 202 in every particular, answers my L8 (keep the split, for a better
reason than mine), corrects one of my stated reasons in D4, adds a third recall miss, and closes
with the item I took as this fire's work: **§7 — "the undo path over a role-basis apply is
untested from this seat. Nobody has driven undo after a 9-entity, 821-row role apply. That is
the next thing I would do."**

## 17:20 — why that item and not something else

Round 202 is what makes it uncertain rather than obvious. Before it every applied row resolved
its target by name, so one name meant one entity id and undo's minted-entity removal could not
meet two record rows pointing at two same-named agents. `role-title` sets `reuseByName: false`,
which creates exactly that case, and the record undo reads is written by the path that changed.
Read the loop first (`entity-backfill.ts:1034-1052`): keys on `toEntityId`, de-dupes with a
`Set`, conditional deletion against present state. It reads correct — which is the state I have
been wrong in before, so: drive it.

## 17:21 — built and driven

**`scripts/probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts`** — against a copy
of `klatch.db.backup-2026-03-14`, through the real CLI:

- A: apply role basis → 9 re-pointed, 9 minted, 821 P2 / 0 P3, record written
- B: record shape — 9 distinct minted ids, all 821 P2 ids, every `fromAddedAt` present
- C: undo → 9 reverted, 9 removed, 0 kept
- D: **state compared column by column to the pre-apply baseline — identical, digest
  `1fbdf9900589a2ef`**; `added_at` checked separately, 0 drifted
- E: second undo → 0/0, state unchanged
- F: apply → undo → apply → undo, fresh ids the second time, baseline again
- G: a minted agent seated elsewhere before the undo → 8 removed, 1 kept, all 9 still revert,
  all 821 stamps back. That branch had only been driven on `identity-claim`.
- H: the new sheet caveat, present when a run would mint, absent when it would not
- Z: source corpus `c2295121bbdfdbbb` before and after; `git status --porcelain packages` clean

**40 · 0 failed · 0 open · 3 measurements, twice.** `tsc --strict` on the probe: clean.

Deliberate design note: arm D is **not** a file hash. A writing run migrates the schema on the
way in (`getDb()` runs migrations), so a file-level or `SELECT *` diff reports a migration as a
failed undo. Four projections that survive migration, compared row by row.

## 17:22 — the one thing that came out other than expected

B2 failed on the first run and the failure was mine. I asserted "one minted *name* carried by
two ids"; there is none. The two Comms Chiefs mint as `tech-savvy communications chief` and
`tech-savvy Communications Chief` — **case**, verbatim from the two openers. The collision the
sheet reports is a normalized one; the two rows the operator then sees differ by case.
Rewritten to compare normalized, plus B2b asserting the literal difference outright.

Consequence named and not fixed: `resolveImportEntity` matches on `normalizeName` via
`entities.find(…)`, first match wins, so a *later* reuse-by-name resolve with a case-variant
pair present binds to whichever `getAllEntities()` returns first. Pre-existing, not undo's
business, on the table.

Also verified rather than assumed: `Chief Innovation Office (CIO)` in the minted list is not a
truncation — `74bb02d3`'s opener literally says it. xian's typo, extracted faithfully. Read the
opener out of the corpus to check.

## 17:23 — Theseus's §8.1, answered as a limit

His finding: the three Chief-of-Staff chats — the widest role lineage in the corpus — produce
no collision warning because the check is normalized name equality, so `9 would move, 1
collision` reads as more coverage than it is.

Decision: **do not widen the test.** A fuzzier or lineage-aware sameness rule fitted to one
corpus is what Round 202 §6 refused. What was wrong is that the sheet let the check's silence
read as a finding. Added a caveat block to `scripts/backfill-entity-bindings.mts`, printed only
when a run would mint, naming the case the check misses with his own corpus example. Arm H
drives it both ways.

## 17:24 — regression coverage, and two mutations to prove it bites

`packages/server/src/__tests__/round204-undo-over-a-role-apply.test.ts`, 6 tests, at unit scale
so they run in CI where the corpus is not reachable.

- Mutation 1 — `reuseByName: BASIS_REUSES_BY_NAME[row.guessBasis]` → `true`: **2 fail**
  ("removes both of two same-named agents", "re-applies to fresh ids").
- Mutation 2 — `bound === 0 && stamped === 0` → always delete: **1 fail** ("keeps back only the
  one a later seat used").

Both reverted with `git checkout`; `grep -c MUTATION packages/server/src/db/entity-backfill.ts`
→ 0.

## 17:25 — suite

`npm test` (typecheck + server + client): **server 1683 tests / 104 files, client 311 passed /
13 skipped**, typecheck clean. Was 1677 / 103 at my MID fire — +6 tests, +1 file, which is this
round's file and nothing else.

## 17:27 — filed

- Writeup: `docs/research/round204-the-undo-over-a-role-apply-driven-end-to-end-2026-09-13.md`
- Reply memo:
  `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-i-drove-the-undo-you-named-and-it-holds-2026-09-13.md`
  — answers §7 (driven, holds), §8.1 (limit stated), §4 (D4 is 9 of 12), §5 (his correction to
  my `e93d3810` reason accepted — `your` is not in `ROLE_PATTERN_SOURCES`, which is the reason
  that matters), §3 (accepted, better argument than my tiebreak), §6 (E3 stays open, not taken).
- Thread hygiene: Theseus's 13:17 memo (Round 200/202 reproduction) is closed by my 13:41 reply
  and both move to `docs/mail/read/`. His 17:17 memo stays in `docs/mail/` — my reply carries an
  open ask to xian.

## Open after this fire

1. **xian's corpus question, five rounds open.** Everything in 199–204 is fitted to
   `klatch.db.backup-2026-03-14` (mtime 2026-07-23). Is that the corpus a backfill would run
   against? Asked again in the memo, addressed to xian by name. Blocks the fit, not the build.
2. **E3** — the corroboration shape, on the table with its cost measured (refuses 2 of 9
   correct titles). Not built, not recommended.
3. **The case-variant pair and later reuse-by-name resolution.** Undispositioned; mine if it
   wants dispositioning.

## Session wrap verification

Both commits landed on `origin/main` (push was a clean fast-forward from
`2331e98d`; no rebase needed this fire):

```
$ git log origin/main --oneline -5
bb08bad2 Round 204: the undo over a role apply, driven end to end -- it holds
eff112f6 mail: Daedalus -> Theseus (cc xian, Janus, Argus, Calliope) -- I drove the undo …
2331e98d coordination+log: Calliope 9/13 WORK fire -- no-op, relay thread already closed …
30c6540a log: Theseus 9/13 WORK fire -- Round 203 session wrap verification …
2874f013 Round 203: the corpus is lineages, and the sheet warns about one of them
```

Every deliverable confirmed present on disk:

```
$ ls -la <each>
18412  scripts/probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts
 6459  packages/server/src/__tests__/round204-undo-over-a-role-apply.test.ts
 8178  docs/research/round204-the-undo-over-a-role-apply-driven-end-to-end-2026-09-13.md
 7855  docs/mail/daedalus-to-theseus-…-i-drove-the-undo-you-named-and-it-holds-2026-09-13.md
 9669  docs/mail/read/theseus-to-daedalus-…-200-reproduces-…-2026-09-13.md   (thread closed)
 6915  docs/logs/2026-09-13-1717-daedalus-opus-log.md
```

Product file modified in `bb08bad2`: `scripts/backfill-entity-bindings.mts` (the collision-check
caveat block, printed only when a run would mint). `packages/server/src/db/entity-backfill.ts`
was mutated twice during verification and restored with `git checkout` both times — it is
**unmodified** in this fire's diff, which is the correct outcome: Round 204 found no defect to
fix, only coverage to add.

Mail delivery note: the memo commit (`eff112f6`) was made separately and pushed to `main` ahead
of the round commit, per the worktree mail rule.

This wrap section is committed last, after the above was verified.

