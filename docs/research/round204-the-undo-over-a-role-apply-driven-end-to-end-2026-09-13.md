# Round 204 — the undo over a role apply, driven end to end

**Daedalus · 2026-09-13 (STOP fire)**
**Probe:** `scripts/probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts` — **40 · 0 failed · 0 open · 3 measurements**, twice, `tsc --strict` clean
**Tests:** `packages/server/src/__tests__/round204-undo-over-a-role-apply.test.ts` (6)
**Answers:** Theseus's Round 203 §7 (undo untested over a role apply) and §8.1 (the collision check misses lineages)

---

## 1 — Why this was worth driving rather than reasoning about

Theseus closed Round 203 with the thing nobody had done: *"the undo path over a role-basis
apply is untested from this seat. Nobody has driven undo after a 9-entity, 821-row role
apply."*

The reason it is not obviously fine is Round 202's own change. Before Round 202 every applied
row resolved its target **by name**, so one name meant one entity id, and undo's minted-entity
removal could never meet two record rows pointing at two different agents that are called the
same thing. `role-title` sets `reuseByName: false`. One run now mints one agent per channel —
on xian's March corpus, nine agents, two of them sharing a name. Undo removes minted entities
by reading ids out of a record written by exactly the path that changed.

That is a seam. It is also the kind of seam that reads correct: the removal loop already keys
on `toEntityId` and already de-dupes with a `Set`. Reading it is not the same as driving it.

## 2 — What was driven

Against a copy of `klatch.db.backup-2026-03-14`, through the real CLI, not through the module:

| arm | what |
|---|---|
| A | `--bases=identity-claim,role-title --apply` → 9 re-pointed, 9 minted, 821 P2 / 0 P3, record written |
| B | the record's nine minted ids, their names, all 821 P2 ids, every `fromAddedAt` present |
| C | `--undo=<record>` → 9 reverted, 9 agents removed, nothing kept back |
| D | database compared to its pre-apply state **column by column** |
| E | undo run a second time → 0 reverted, 0 removed, state unchanged |
| F | apply → undo → apply → undo, with fresh ids the second time |
| G | a minted agent seated elsewhere before the undo → 8 removed, 1 kept, all 9 channels still revert |
| H | the new sheet caveat, present when a run would mint and absent when it would not |

**It holds.** Every arm passes, twice.

The comparison in arm D is the load-bearing one and is deliberately not a file hash: a writing
run migrates the schema on the way in (`getDb()` runs migrations), so a file-level or `SELECT *`
comparison would report a schema change as a failed undo. It compares four projections that
survive migration — `channel_entities(channel_id, entity_id, added_at)`, `messages(id,
entity_id)`, the NULL-stamp count, and `entities(id, name)`. Baseline and post-undo digest:
`1fbdf9900589a2ef` both times.

`added_at` is checked separately in D3 for a reason. Re-INSERTing a binding with the undo's
clock instead of the original's is a restore that looks right in every count and has silently
re-dated 72 rows. 0 drifted.

## 3 — The one thing that came out other than expected

The probe's B2 failed on its first run, and the failure was mine, not the code's — but what it
exposed is worth having on the record.

I wrote B2 as "exactly one minted **name** is carried by two ids." It found none. The two
Comms Chiefs are minted as:

```
tech-savvy communications chief     (358c1952, "1/2-14: Comms Chief (o)")
tech-savvy Communications Chief     (e7a7a513, "1/15-3/13: Comms Chief (o) - content strategy…")
```

Case, from the two openers verbatim. **The collision the sheet reports is a normalized-name
collision; the two rows the operator ends up looking at differ by case.** So the sheet's
warning is right and the artifact it warns about is two agents that a human scanning a list
will read as one name typed twice.

Downstream consequence, stated and not fixed: `resolveImportEntity` matches by
`normalizeName`, `entities.find(…)` — first match wins. With two case-variant agents present,
a *later* reuse-by-name resolve (an ordinary import, or an `identity-claim` row) binds to
whichever `getAllEntities()` returns first. That is not a new defect and not undo's business;
it is the cost of the split that the sheet already tells the operator to merge by hand. Named
here so it is on the table rather than discovered later.

Full minted set, measured (probe B3):

```
chief architect | tech-savvy communications chief | Chief Innovation Office (CIO) |
Executive Assistant and Chief of Staff | chief of staff | Chief of Staff (Executive Assistant) |
Head of Sapient Resources (HoSR) | tech-savvy Communications Chief | career coach
```

`Chief Innovation Office (CIO)` is not a truncation. Checked against the opener of `74bb02d3`:
*"You are my Chief Innovation Office (CIO) taking over from your predecessor chat…"* — xian's
own typo, extracted faithfully. (Which makes it the second corpus typo in this family, after
the `Your`/`You are` pair in Theseus's §4–5.)

## 4 — §8.1 answered: the limit is stated, the test is not widened

Theseus: the three Chief-of-Staff chats — the widest role lineage in the corpus — mint under
three wordings of one job and produce **no** collision warning, because the check is normalized
name equality. `9 would move, 1 collision` therefore reads as more coverage than it is.

He is right, and I am not building a fuzzier or lineage-aware collision test. A rule for
"these two names are the same job" fitted to one corpus is the thing Round 202 §6 refused, and
he said he would hold me to it. What was wrong is not the check — it is that the sheet let the
check's silence be read as a finding.

So the sheet now says what it covers, printed only when a run would mint:

```
  What the collision check does and does not cover: it compares names for exact equality,
  ignoring case and surrounding space. Two chats that state the same job in different words
  ("Chief of Staff (Executive Assistant)" and "Executive Assistant and Chief of Staff") mint
  two agents and produce no warning above. Successive chats in one role are common in an
  imported corpus — read the channel names in the per-channel list before approving.
```

The example in it is his, from the corpus. Arm H drives it both ways: present on the role run,
absent on the default run that would mint nothing, and positioned after the collision block it
qualifies.

## 5 — Regression coverage, and it is not decoration

Six unit tests, at unit scale so they run in CI where the corpus is not reachable. Two
mutations driven to confirm they bite:

- `reuseByName: BASIS_REUSES_BY_NAME[row.guessBasis]` → `true` (undo Round 202's fix):
  **2 tests fail** — "removes both of two same-named agents" and "re-applies to fresh ids".
- the conditional removal `bound === 0 && stamped === 0` → always delete:
  **1 test fails** — "keeps back only the one a later seat used".

Both reverted via `git checkout`; `grep MUTATION` over the file returns 0.

## 6 — What this does not say

- **Not run against xian's live database.** Copies only. The source backup is
  `c2295121bbdfdbbb` before and after (arm Z1).
- **Not a claim about `role-title` correctness** — that is Rounds 200–203. This is a claim that
  the way back from a role apply works.
- **Still fitted to one corpus, dated 2026-03-14 with an mtime of 2026-07-23.** Theseus's §8.3
  and my own §9.3 stay open: nobody has confirmed with xian whether this is the corpus a
  backfill would actually run against. It blocks the fit, not the build.

## 7 — Open after this round

1. **E3** (Theseus's §6) — the corroboration shape, offered with its cost measured (it would
   refuse 2 of 9 correct titles). Not built, not recommended, still on the table.
2. **The case-variant pair and later reuse-by-name resolution** (§3 above). Undispositioned.
3. **The corpus question** (§6 above). xian's.

Verified for this round: server **1683 tests / 104 files**, client **311 / 13 skipped**,
`npm run typecheck` clean. Probe green twice. Nothing written outside `.testdata/`;
`git status --porcelain packages` clean at probe time (arm Z2).
