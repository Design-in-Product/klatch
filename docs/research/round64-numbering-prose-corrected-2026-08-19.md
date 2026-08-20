# Round 64 — the recall surface's prose now describes the scope it queries

**Daedalus · 2026-08-19 (STOP fire) · zero API calls, zero live runs**

This round is a wording change on a measured surface. It carries a round number for one
reason: **it is the boundary marker.** Arms up to and including N1 (Round 63) ran under the
pre-64 prose. Anything from here on does not, and a comparison that crosses this line is
comparing across a changed instrument.

## 0. Why it waited, and what discharged it

Theseus reported the defect on 8/19 at 09:17 (`theseus-to-daedalus-…-the-header-mis-describes-
its-own-numbering-2026-08-19.md` §5). I confirmed it the same day at 13:22 and deliberately
did **not** land the fix: arm N1 existed to be compared against arm M (Round 62), which had
run under the wrong text, and the defective sentence is about *how an offered range is read* —
the dimension N1's dependent variable sits next to. Fixing it first would have made N1 a
two-variable arm.

N1 ran at 14:47 PT. Theseus's memo §0 discharges the hold explicitly: *"The expand-header
wording fix is unblocked as of this memo: land it whenever you like."* This is that landing.

## 1. What the scope actually is

Read from `entityTranscriptWhere` (`packages/server/src/db/queries.ts:647-652`) this session,
not from its docblock:

```sql
(m.entity_id = ?
  OR (m.role = 'user' AND m.entity_id IS NULL AND EXISTS (
        SELECT 1 FROM channel_entities ce
        WHERE ce.channel_id = m.channel_id AND ce.entity_id = ?)))
```

So an entity's transcript is **its own rows, plus every `user` row in a channel it belongs
to.** Three consequences, all of which the replacement wording has to survive:

1. In a 1-1 with the owner, *both* speakers are numbered — the wrong reading and the right one
   differ by 2×, which is the size of the error an agent copying an address would make.
2. In a klatch, the human's turns are numbered too (they were addressed to everyone present).
3. In a klatch, **a third agent's turns are not numbered at all**, however plainly they were
   addressed to this one. `expandConversationRange`'s own docblock (`recall.ts:665-671`)
   already said this correctly; only the user-facing strings were wrong.

## 2. The three sites, and why "your turns and the user's"

| site | before | after |
|---|---|---|
| `recall.ts:784` — expand header | `…, your own turns in that conversation, in order.` | `…, your turns and the user's in that conversation, in order.` |
| `recall.ts:737-740` — empty range | `has nothing of yours at positions N–M. Positions count only your own turns…` | `has nothing at positions N–M. Positions count your turns and the user's…` |
| `recall.ts:412-414` — zero-token search | `matches literal words in your own messages` | `matches literal words in your turns and in the user's` |

**The rejected candidate.** My 8/19 13:22 note proposed *"your turns and the turns addressed
to you"*. It is wrong for consequence 3 above: a third agent's turn in a shared room is
unmistakably addressed to this one and is still unnumbered, so that phrasing promises reach the
tool does not have — the exact failure class Round 50 was built to avoid. *"the user's"* is
true in both channel types, and it matches the only two speaker labels
`formatTranscriptLine` can print (`carried-context.ts:259` — the entity's name, or `user`), so
the agent can check the sentence against the page in front of it.

**The lead clause moved and had to.** `has nothing *of yours* at positions 40–45` would have
contradicted the corrected sentence immediately after it. This is the one edit here that was
not in Theseus's report; leaving it would have shipped a two-sentence self-contradiction.

**The third site was found by `grep`, not reported.** The zero-token search branch is the same
defect one surface upstream, and it is the more actionable one: an agent that believes search
matches only its own phrasing will avoid the terms it merely *heard* — which are, per the test
below, exactly the terms that work.

## 3. What is pinned, and what was already pinned

`packages/server/src/__tests__/recall-position-numbering-scope.test.ts` — 5 tests → **7**.

- **§1 (unchanged, 3 tests).** Numbering scope asserted from the render, not from a string. It
  survives the wording fix and is the half that would catch a future narrowing of
  `entityTranscriptWhere` even if every sentence still matched.
- **§2 (2 tests, literals updated).** Both corrected sentences pinned positively *and*
  negatively — `not.toContain('your own turns')` — so a revert or a half-applied edit cannot
  pass by accident.
- **§3 (new, 2 tests).** The search sentence, plus the behavioural fact under it: a query for a
  word only ever spoken by the *user* returns 1 match. The prose now rests on a demonstrated
  result rather than on an argument about a SQL clause.

**A correction to my own 13:22 file docblock.** It said *"nothing pinned these two strings."*
That was true of `"your own turns"` (my `grep`, and it still returns nothing outside this
file) and **false of the empty-range lead clause** — `round56-recall-expand.test.ts:303`
asserted `'nothing of yours at positions 40–50'` and failed on the first full-suite run after
the edit. The drift detection I said was missing was partly present. Updated there with a
pointer to this round rather than silently re-worded.

## 4. Verification

- `npm test` → **server 1388/1388 (83 files), +2 over the 1386 baseline, matching §3 exactly**;
  client 233 passed / 13 skipped, unchanged. Exit 0.
- `npm run typecheck` → clean, all three workspaces.
- No behavioural code changed — three template literals and one test assertion in
  `round56`. `matchCount`, `shownCount`, the row set and the ordinals are untouched.

## 5. What this does not settle

Whether the sentence should **vary by channel type** — in a klatch, "your turns and the user's"
is exactly true, but an agent might reasonably wonder where the other agents went, and the
surface says nothing. That is a design question about how much of the membership rule the tool
should teach, and it does not get decided inside a typo fix. Flagged, not deferred silently.
