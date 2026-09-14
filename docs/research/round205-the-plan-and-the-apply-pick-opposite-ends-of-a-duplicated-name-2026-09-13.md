# Round 205 — the plan and the apply pick opposite ends of a duplicated name

**Theseus, 2026-09-13 (STOP fire).** Manual testing & exploration, CLI side.

**Probe:** `scripts/probe-round205-the-plan-and-the-apply-pick-opposite-ends-of-a-duplicated-name.mts`
— **27 checks · 0 failed · 1 open · 2 measurements**, three runs identical, `tsc --strict
--module nodenext` clean.

**Reproduced first, before anything of mine:**

| what | result |
|---|---|
| `probe-round204` (Daedalus, unmodified) | **40 · 0 failed · 0 open · 3 measurements** — his line exactly |
| `npm test --workspace=packages/server` | **1683 passed / 104 files** — his number |
| `probe-round203` (mine) over his changes | 15 · 0 failed · 2 open — unchanged |
| `probe-round201` (mine) | 26 · 3 failed — D1, E2, E3, the known residual |

Round 204 holds. Undo over a role apply does what he says it does, arm for arm, including
`added_at` and the conditional-removal branch on a role basis. I have no correction to it.

---

## 1 — What this round is about

Daedalus's Round 204 §2 filed one item undispositioned:

> Downstream, stated and not fixed: `resolveImportEntity` matches on `normalizeName` via
> `entities.find(…)`, first match wins. With a case-variant pair present, a *later*
> reuse-by-name resolve binds to whichever `getAllEntities()` returns first.

That is true. It is also the smaller half. **There are two resolvers of "the entity with this
name" in the backfill, and they read the table in opposite directions.**

| | code | rule | which row |
|---|---|---|---|
| **plan** | `entity-backfill.ts:432` | `new Map(SELECT id, name FROM entities)` — no `ORDER BY`; a `Map` keeps the **last** key written | last row of the scan |
| **apply** | `entity-backfill.ts:677` → `entity-resolve.ts:96–100` | `getAllEntities()` = `ORDER BY created_at ASC`, then `.find()` | **first** row by `created_at` |

When one name is carried by more than one entity, these disagree. Driven end to end through the
real CLI (arm A), on a corpus holding `Daedalus` (older) and `daedalus` (newer):

```
plan.rows[0].targetEntityId   bbbbbbbb…   (the newer)
channel_entities after apply  aaaaaaaa…   (the older)
messages.entity_id after apply aaaaaaaa…  (the older)
```

**The agent the operator approved is not the agent that got the channel.** Round 202 closed this
divergence class for the *basis* question, and its own comment at `entity-backfill.ts:675` states
the rule: *"The plan is what the operator approved; the apply pass has no business reaching a
different answer."* The rule still has a hole for the which-of-several question.

## 2 — The sheet cannot show it

Arm B. The row prints as:

```
ch-1   3/14: the chat   claude-ai   identity-claim  P2=3  P3=0  MATCHED-BY-NAME → "Daedalus"
  reused agents (1): Daedalus
```

The sheet prints the **name**, never the id. The summary says `reused agents (1)` where two
entities carry the name. No collision block fires — `plan.summary.collisions` covers the mint
case only. From the operator's seat there is nothing to see: the divergence is invisible on the
artifact the approval is given against.

## 3 — It is a wrong-target write, not an unrecoverable one

Arm C. The undo record is written from the id that was *actually* written (`toEntityId:
aaaaaaaa…`), not from the plan's. So the undo reverts cleanly: binding and all stamps go back to
`default-entity`, exit 0. **Severity is bounded** — an operator who notices can reverse it. The
cost is that noticing requires reading `channel_entities` by id, which is not something the CLI
asks of anyone.

## 4 — The corpus this would run against, measured

Arm D, on `klatch.db.backup-2026-03-14`:

- **68 entities · 26 distinct normalized names · 24 names carried by more than one.**
- **66 of the 68 entities live inside a duplicate-name group.**
- **Every one of the 24 groups (24/24) resolves to a different id under the two rules.**

Group sizes go to 10 (`analyst`), 6 (`bot`), 4 (`reviewer`, `bot2`, `chief of staff`).

The one that matters to this work:

```
"Chief of Staff" ×4    fc4a59b6 (0 channels)   ← what the apply would reach (oldest)
                       d064dae8
                       45691e94
                       1e18ec34 (1 channel)    ← what the plan names (last of scan)
```

**The row the apply would bind has no channel at all; the row the plan names has one.** The two
rules do not merely differ here, they differ in the direction that reaches the emptier record.

**One correction to my own first reading of this**, which I made and then checked: I initially
wrote that the apply's pick "loses the agent's transcript." It does not. `1e18ec34`'s single
channel is `dir-handle` — `source: native`, 2 messages, a fixture. So is `d064dae8`'s. Neither of
the four `Chief of Staff` rows carries an imported transcript. The channel-count asymmetry is
real and the direction is real; the stakes I first attached to it were not. See §10.

## 5 — The sheet's existing-agent note says "an agent" where four exist

Arm E. The real corpus, `--bases=identity-claim,role-title`, prints exactly one such note:

```
↳ note: an agent named "chief of staff" already exists (1e18ec34). A role-title guess does
  not reuse it — this mints a second one.
```

Four entities normalize to `chief of staff`. The note names one, singular, with no sign that
three more carry the name. The decision the note exists to inform — mint a second, or merge by
hand afterwards — is being made against a count of one when the count is four. This is separable
from §1 and cheaper to fix: it is a wording-and-count problem in a note that is otherwise doing
exactly the right job.

## 6 — Reachability, stated as the limit it is

Arm F, and this is the honest boundary of the finding:

- The corpus has **0 projects**, so the `project-name` basis (which reuses by name) cannot fire.
- **0 channels produce an `identity-claim` guess** — Round 201 §4's result, re-confirmed here as
  `0 matched-by-name rows` in the plan.

`BASIS_REUSES_BY_NAME` is `{identity-claim: true, role-title: false, project-name: true, none:
false}`. Neither reusing basis fires on this backup. **So nothing in §1 is a live mis-write
against this corpus today.** It is a defect that fires on the first corpus where a reusing basis
meets a duplicated name — and 66 of these 68 names are duplicated.

I am filing it as a real defect rather than a hypothetical for two reasons. The disagreement is
structural, not data-dependent: it fires for *every* group of size ≥ 2, 24 of 24 here. And the
guesser is under active change — Round 202 moved which bases fire on which channels, and the one
thing that would make §1 live is exactly the kind of change the last six rounds have been making.

## 7 — Two errors of my own, both recorded rather than smoothed over

**I called `planEntityBackfill(db, {bases})`.** Its signature is `planEntityBackfill(options)` —
one argument, and it takes the database from `getDb()`. My `Database` was read as an options
object, `options.bases` came back undefined, and the plan ran against the **ambient** database:
this worktree's gitignored `klatch.db`. That call ran `initSchema()` and `runMigrations()` against
it, so its mtime moved (19:51 PT). It is a local dev file, it is gitignored, and only a plan (a
read) followed the migration — but I did write to a database I did not intend to open, and had
the mis-call been to `applyEntityBackfill` it would have been a real write. Corpus backups
re-hashed after: unchanged. The fix in the probe is to set `KLATCH_DB` and re-exec, because
`db/index.ts` resolves `DB_PATH` once at import time.

**My fixture wrote `added_at` as ISO-8601.** The apply then produced an undo record its own undo
validator refused:

```
not a backfill undo record: …
  channels[0].fromAddedAt is "2026-03-14T00:00:00.000Z", expected null or a
  YYYY-MM-DD HH:MM:SS timestamp
```

I chased this as a possible defect before checking the writers. Every production writer of
`channel_entities` omits the column and lets the schema default `datetime('now')` supply it
(`db/index.ts:76`; the only exception, `entity-backfill.ts:1008`, uses `COALESCE` for the same
reason). ISO-form `added_at` cannot arise from product code. **The refusal is Round 175's G1/G2
guard working correctly on my bad test data** — it named the field, named the expected form, and
wrote nothing. Same lesson as Round 201's typographic apostrophe: my test data was the defect. The
probe now carries a comment at the fixture so it is not reintroduced.

## 8 — What I did not do

- **`--apply` against xian's live database.** Copies only. Source backup `c2295121bbdfdbbb`
  before and after, mtime unchanged.
- **Proposed a fix.** Both resolvers are defensible in isolation; which one should win is
  Daedalus's call, and it is entangled with whether a duplicated name should be resolvable at all
  (§9). I have driven the disagreement, not designed the agreement.
- **Round 204 §2's own question** — whether the case-variant Comms Chief pair should be merged —
  is untouched. It is xian's, and it needs the corpus question answered first.

## 9 — What I would ask Daedalus

1. **Which rule wins?** Oldest-by-`created_at` and last-of-scan are both arbitrary. A third
   option — refuse to reuse a name carried by more than one entity, and say so on the sheet — is
   the only one that does not silently pick. It also turns 24 of 24 groups on this corpus into
   skips, which may be the honest answer.
2. **The note in §5 is a smaller, separable fix** and worth doing regardless of §1: say how many,
   and name them.
3. `getAllEntities()` orders by `created_at` with **no tiebreak**, and `createEntity` stamps
   `new Date().toISOString()` — millisecond resolution. Two agents minted in one apply run can
   share the millisecond (I measured a same-millisecond pair in the Round 204 mint set:
   `ceb7d259` and `59efb778` at `…06.997Z` — different names, so harmless there). If two
   *same-named* agents ever share it, the apply's pick becomes unspecified rather than merely
   arbitrary.

## 10 — Still open for xian, six rounds now

**Is there a current corpus?** Rounds 199–205 are all fitted to `klatch.db.backup-2026-03-14`
(mtime 2026-07-23).

This round adds a data point to that question that I think is worth xian's eye. **The backup's
`entities` table reads as a development database, not a user's agent roster.** Measured, not
inferred:

- The 24 duplicate group names are `second, temp, reviewer×4, minbot, colorbot, chief of
  staff×4, nohandle, handlebot, clearme, emptyh, patched, bot×6, assigner, bot0, bot1, bot2×4,
  bot3, toomany, removable, extra, notassigned, secondbot, testbot, analyst×10`. All but
  `chief of staff` are unambiguous test fixtures, and that one is seeded the same way as the
  rest.
- The two entities *not* in a duplicate group are `Claude` (`default-entity`) and `NewBot`.
- `created_at` buckets: **1** at `2026-03-10 22:57`, **2** at `13:39`, **32** at `13:40`, **33**
  at `13:52` on 2026-03-14 — two seeding runs of ~34, minutes apart, which is where every
  duplicate group comes from.
- `default-entity` is the only row whose `created_at` is in `datetime('now')` form; the other 67
  are ISO-8601, i.e. minted through `createEntity`.

The **channels** side is a different story: 139 channels — **67 `native`, 40 `claude-code`, 32
`claude-ai`** — and the imported ones carry real openers, the Chief-of-Staff and CIO lineages of
Round 203. (Incidentally this confirms the "72" predicate from the outside: 40 + 32 = 72
candidates, `source IN ('claude-code','claude-ai')`.) So the March backup looks like *real
imports performed into a dev database that already had test detritus in it*, not a copy of xian's
working Klatch.

**This does not weaken §1–§3, which are structural** and were driven on a corpus of my own. It
does qualify §4: the shape of the duplicate problem measured there (66 of 68, 24 of 24) is a
property of the seeding runs, not a prediction about xian's live database, and none of the four
`Chief of Staff` rows holds an imported transcript. If a current corpus turns up, D1–D6 are the
first numbers I would re-measure, and I would expect them to come out smaller.

---

**Files:** probe above; this writeup; memo
`docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-204-holds-and-there-are-two-resolvers-not-one-2026-09-13.md`.
Nothing written outside `.testdata/` except the ambient `klatch.db` touch recorded in §7.
