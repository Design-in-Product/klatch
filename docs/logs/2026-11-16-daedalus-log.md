---
agent: Daedalus
date: 2026-11-16
model: claude-opus-5 (09:17 fire)
---

# Daedalus — 2026-11-16

## 09:17 — START fire

`date`-read **09:17:07 PST**, read not estimated. Worktree synced by the wrapper; `git pull
--ff-only` → "Already up to date."

**Commit author checked, not assumed.** The five commits above my 11/15 STOP head:
`2e3bb537` **Argus** (09:10, gate + full sweep re-driven), `ce8082ec` **Calliope** (08:40,
rollup v182), `f26a44d4` **Iris** (07:26, entity-delete client half), `f5635983` **Pard
(Mediajunkie)** (fire-depth report), `46a0a898`/`04a8c912` **Claude-auto** (cross-pollination
brief + intel scan). **None mine.**

**Mail delta → 2 added since my last fire, this seat in `to:` on one** (Theseus's ruled-items
memo, `to: Iris, Calliope, Daedalus`) and cc on the other (Iris → Theseus). Both read in full
and acted on in this fire.

### What this fire did, and why it was product work rather than my own boarded research

I ran **Theseus's** countermeasure first — *grep the attention rollup for already-RULED items
before doing anything else*. His 11/15 §5 proportionality figure (2657 commits since 09-14, 54
touching `packages/` — 2.0%) and the two ruled items he found at **40 and 48 days unbuilt** are
the reason this fire went to a product increment and left my three boarded research items
(SAMELINE pairing key, form-aware precision census, sha/round-label exclusion) untouched. That
is a **choice, not a blocker**, and it is named as one.

The grep fired twice.

### 1. BUILT: `GET /entities/:id/delete-preview` — `fd341b76`, on `origin/main`

Iris named the blocker in one clause in her 11/16 memo: *"the server has no preview endpoint to
ask 'what would this empty' before committing."* xian's 2026-10-06 ruling asks the user
*before* — *"ask if the person also wants to delete the Klatch but to allow them not to"* — and
asking needs the answer before the write. The delete names what it emptied **afterwards**
(Theseus, `72172a52`); the client shows that as a post-hoc banner (Iris, `f26a44d4`). This is
the missing half's enabling piece.

**Verified absent before building, not taken from her memo's word:** `grep -rni
"delete-preview|deletePreview|would-empty|wouldEmpty" packages/ scripts/ docs/plans/` → **zero
hits**; `grep -rn "emptiedChannels" packages/` → 19 hits, all in the delete path, its 4 tests,
and Iris's client surface. No preview existed under any name I searched.

Design, with the reasoning recorded in the route's own comment:

- Calls **`getChannelsEmptiedByEntityDelete`** — *the same function the delete calls*, not a
  reimplementation. One query, one truth: preview and delete can only disagree if a seat is
  written between the two requests.
- **Mirrors the delete's refusals exactly** (404 unknown, 400 default entity, identical
  message) rather than 200 + `deletable: false`. A preview of a delete the server will refuse
  is worse than no preview. Invisible from the shipped UI either way —
  `EntityManager.tsx:167` already hides the delete control for `isDefault`.
- `emptiedChannels` always present, `[]` when nothing would be emptied — same contract as the
  delete response.
- **Not built, still Iris's:** the prompt itself. Zero callers, one fire old, shape offered as
  changeable.

### 2. The 5 tests are keyed on cross-route agreement, and both cripples landed as pre-registered

Every case keyed on the preview **agreeing with the delete it previews** — ids *and* names
compared whole, because two lists can agree on count and ids while a name drifts — plus a
read-only arm that **previews twice** (a preview that consumed the seats it reports would answer
`[]` the second time, which a single-call assertion cannot see) and non-vacuity assertions on
the two refusal arms (two empty bodies would satisfy the equality while telling a client
nothing).

**Predictions written down before either cripple ran:**

| cripple | predicted | measured |
|---|---|---|
| **A** — route path made unreachable | all 5 new red, other 36 green | **5 failed / 36 passed** ✓ |
| **B** — preview reimplemented on the naive "every klatch it's in" key, same `{id,name}` shape | cases 1 and 3 red; 2, 4, 5 green | **2 failed / 39 passed**, cases 1 and 3 ✓ |

A says the five are the **sole** failing arms — no pre-existing case leans on the new route. **B
is the one worth having:** it says the agreement test catches the divergent-duplicate
implementation, which is the entire reason the endpoint shares the delete's query. Case 2
staying green under B was predicted and is correct — in that fixture the naive key and the right
key give the same answer, which is why case 1 uses a fixture where they cannot.

**Declared limit, named rather than discovered later:** the agreement arms **cannot** catch a
defect in the shared query. Cripple `getChannelsEmptiedByEntityDelete` itself and both routes
move together, staying in agreement and staying wrong. Theseus's four `entities.test.ts` cases
grade that query; mine grade the seam. No arm here grades the query and none claims to.

**Cripple hygiene:** the cure was committed (`fd341b76`) *before* either cripple was built, so
`git checkout --` restored from a tree that already held it — a restore-from-HEAD could not
discard an uncommitted cure, because there wasn't one. Tree clean afterwards (`git status
--porcelain` empty), no `CRIPPLED` marker surviving (`grep` over the route file).

### 3. ROUTED, not taken: the ground-rules ruling, 13 days unbuilt — `671359e4`

The grep's second hit. `attention-rollup.md:317`, **RULED 2026-11-03**, board's own words:
*"Nothing is built yet — no field, no default/template persistence, no
prefill-from-previous-klatch."* **Verified against the code, not the sentence:** `grep -rni
"groundRules|ground_rules" packages/ scripts/` → **0 hits**. 13 days.

Filed to Calliope rather than built, because the board names the scoping as her seat's and
xian ruled a *direction*, not a spec — building a field off my own reading of a "gut sense"
ruling is how a direction becomes a fait accompli. **Filed at 13 days precisely because the two
Theseus found reached 40 and 48 by nobody naming them at 13.**

Supplied the engineering half so her scoping isn't waiting on me: the field is one more
`PRAGMA`-guarded `ALTER TABLE … ADD COLUMN` in the idiom `db/index.ts` already uses five times
(`:95-98`, `:112-114`, `:140-145`, `:238-241`, `:258-259`); the **only** genuinely new storage
is the default/template half, which none of the current 6 tables holds; the ruling's three
behaviours decompose unequally and **(1) blank-field-with-guidance ships on its own**. One spec
question flagged as hers, not assumed: whether a klatch's ground rules *replace*
`DISCLOSURE_NORM` (`carried-context.ts:120`, verified still the one hardcoded string) or sit
beside it. My read is beside-and-additive, labelled a read.

### 4. Gate — re-driven fresh against my own change, not trusted from Argus's 09:10 run

His was against a tree older than `fd341b76`.

- `npm run typecheck` → **0 `error TS`**, all four workspaces confirmed from the run's own
  output (shared, server, client, scripts — the last being two `tsc -p` passes)
- server **143 files / 2230 passed / 1 skipped (2231)**. Standing was 2225/1; **2225 + 5 =
  2230** — exactly my five, nothing else moved
- client **27/40 files, 337/350** — byte-identical to Iris's figures; no client file touched
- `sweep-probes --census` → **CENSUS OK, 155 files, 45 swept / 110 deferred** (also run by the
  pre-commit hook on each of the three pushes)
- full driving sweep — **see the 09:29 entry below.** This slot was deliberately left unwritten
  rather than pre-filled from the standing figure.

### 5. One correction against myself

I have recorded the **cross-pollination brief body** as *"deferred, named blocker — behind a URL
plus a private repo, WebFetch not permitted here"* for several fires. The blocker was real for
the path I was trying and **false for the artefact**: `git -C
/Users/xian/Development/designinproduct show origin/main:src/internal/briefs/2026-11-16-brief.md`
reads it fine from inside a fire — which is what Iris has been doing all week. Read today's in
full: Globe's positive-control technique (a health check whose empty result could mean "nothing
there" or "key broken" gets a second call over data known to match, so a broken key fails loudly)
— which is the same shape as the non-vacuity assertions and cripple arms in §2, arrived at
independently. The Klatch item in the brief is my own 11/15 `unit-466reasontok` finding, reported
accurately. **A blocker named on one access path is not a blocker on the artefact.** Dropped from
my standing deferral list.

### Drain

Done this fire: pull + author-checked commit delta; `COORDINATION.md` read; both new mail files
read in full and acted on in the same fire; cross-pollination brief read in full (prior blocker
dissolved, see §5); Theseus's RULED-item countermeasure run, firing twice; item 1 **built,
tested, cripple-proved twice, pushed**; item 2 **routed with the engineering half attached**;
gate re-driven fresh.

**Deferred with named blockers, not with deadlines:**
- My three boarded research items (SAMELINE pairing key re-key — `Q7`'s 201 members are its
  known-positive set; form-aware precision census over the 43 recordings; sha/round-label
  exclusion). Blocker: **none — this is a choice**, two ruled product items outranked them, same
  reasoning Theseus gave for the same trade yesterday.
- Theseus's item 1 (realisation over the 21): **his, named as his next, not raced.** Items 2–3
  likewise. His §4 raw-JSON writer: **his**, and I have now said so explicitly rather than
  leaving silence to carry it.
- Still mine, unclaimed, unchanged: the parameter/positional exclusion,
  `arm-routecure-d.mjs`'s `hash-object` pin and `/misordered/` detector, the `unit-465p12site`
  RESULTS:93 one-clause cure, the two `schemacollide` single-name selectors.

---

## 09:29 — Session resumed (sweep verdict)

Model: claude-opus-5. The full driving sweep launched at 09:21 landed at **09:29**, exit code 0,
verdict read off the run's own output file after it exited — not from the standing figure:

```
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but
did not finish), 0 census problem(s), 110 deferred
```

Matching every figure cited this week, and matching Argus's 09:10 run on the pre-`fd341b76` tree —
so the preview endpoint moved nothing in the probe corpus, which is what a route addition with no
caller should do.

### The finding this fire produced about its own record-keeping

**Twice** I drafted `SWEEP PASSED, 45 of 45` into a slot **while the run was still going** — once
into the memo to Iris, once into the `COORDINATION.md` gate line — and caught both only by
re-reading the slot against a `wc -c` of the still-empty output file.

**The measured verdict is identical to what I had drafted. That is the hazard, not the exoneration.**
A figure that is right by inheritance from the standing figure is, in the committed file,
indistinguishable from one that was measured; no reader downstream could tell them apart, and the
one time the standing figure had gone stale the draft would have published a false green under the
same wording. This seat already carries the lesson *never draft the slot for a running measurement*
and drafted it anyway, twice, in a fire whose own memo was about that discipline. **Intending to be
careful did not prevent it. A `wc -c` against the output file did.**

Carrying forward as a mechanical rule rather than an intention: **for any backgrounded measurement,
the slot gets a `date`/`wc -c` check at write time, and the figure is typed only from the output
file after the process exits.**

### Wrap verification (CLAUDE.md Session Wrap Protocol)

`git log origin/main --oneline -5`:

```
1b45fb58 coord+log: 11/16 START fire -- built the delete-preview endpoint Iris named as her blocker...
671359e4 mail: to Calliope -- the ground-rules ruling is 13 days unbuilt...
ef78fb47 mail: to Iris + Theseus -- the delete-preview endpoint Iris named as her blocker is built...
fd341b76 feat(entity-delete): GET /entities/:id/delete-preview — ask before, not just name after
2e3bb537 coord+log: 11/16 START fire — gate and full sweep re-driven fresh (Argus)
```

Deliverables confirmed present, and the code confirmed **at the remote** rather than only locally:
`git show origin/main:packages/server/src/routes/entities.ts | grep -n delete-preview` → **`197:`**;
same against the test file → **8 occurrences**. Both mail files and this log `ls`-confirmed.

---

## 13:17 — Session resumed (WORK fire)

Model: claude-opus-5. `date` → **2026-11-16 13:17 PST**, read not estimated.

**Briefing.** One commit above my 09:29 head: `13539ea1`, **Calliope's** MID fire — author checked,
not assumed. Mail delta **2**: Theseus's `unit-467rawjson` memo (this seat in `to:`) and Calliope's
ground-rules scoping reply (`to:` this seat; she had already `git mv`'d it to `read/` on closing her
side). Both read in full before any work.

## 1. The fire's work: phase 1 of the 11-03 ground-rules ruling, built

At 09:2x I routed the scoping of this ruling to Calliope rather than taking it, with the engineering
half attached so she wasn't waiting on me. By 12:42 she had written
`docs/ux/ground-rules-scope-2026-11-16.md` and closed her thread with *"if you want to take phase 1,
it's shippable standalone against the spec as written."* So the item that was **13 days from ruling
to build** at 09:2x became **0 days from spec to build** at 13:2x.

**Built against her spec, not my own read of the ruling.** Two places her doc corrected my memo:

1. My memo's "no field like this exists" needed a footnote — `channels.system_prompt` has had a live
   klatch-form field all along, labelled *"Purpose — what is this klatch for?"*. Her call: a separate
   column, because a later offer-previous-rules read path over a shared column would leak Purpose.
2. Her phasing: phase 1 alone is shippable; **phases 2 and 3 are coupled, not sequential** — phase 3
   reads what phase 2 writes, so phase 3 alone is not a smaller increment, it is nothing.

**What I added that her spec did not cover, because it is a prompt-layer fact rather than a storage
one:** layer 4a's part is **labelled** (`GROUND_RULES_PREFIX`). An unlabelled `parts.push` would have
put two user-authored paragraphs in one prompt with nothing saying which field either came from —
the same conflation her storage decision rejects, one layer down.

Her one open note, decided inline as she left it: **clone-from-klatch carries ground rules.** Clone
already carries purpose, mode, project and roster; "copy this setup, except the house rules" would
surprise. Not phase 3 arriving early — it fires only on an explicit clone gesture, and a test asserts
a fresh klatch form is blank.

Commits: **`77a45d66`** (increment), **`619238e1`** (the test §2 found wanting). Both pushed to
`main` individually rather than batched, per the 2400s-timeout lesson.

## 2. The finding this fire produced against its own test

18 arms green on the first run. **Green on the first run is not evidence an arm can redden**, so I
crippled the implementation four ways.

**One arm could not redden for the thing it is named after.** *"Absent, blank and whitespace-only
all read back `undefined` — one empty state"* is phrased in terms of `channel.groundRules`.
`rowToChannel` maps `row.ground_rules || undefined`, so **`''` is collapsed to `undefined` on the way
out**. Cripple 4 — `createChannel` storing `?? ''` instead of `|| null`, i.e. a writer minting the
second empty state the design forbids — left **all 18 arms green**.

The replacement arm reads the raw column (`SELECT ground_rules FROM channels WHERE id = ?`) and is
the **sole red** under that same cripple, re-driven to confirm rather than assumed.

**Why it is not a hygiene footnote:** phase 3's offer-previous-rules is the natural place for a SQL
predicate, and `ground_rules IS NOT NULL` and `ground_rules != ''` are the same question **only
while one of the two states never occurs**. The arm as written would have let a future writer
introduce the second state silently, and phase 3 would have inherited it.

**Carried forward:** *a claim about what is **stored** cannot be measured through a mapper that
normalises it.* The read path is a lens; asserting the property through the lens measures the lens.
Nearest existing lesson in my store is the mapper/column distinction's cousin — a joined-string
comparison that cannot see an empty member — and this is the same defect one layer lower.

## 3. The cripple whose result is a question about the corpus, not about my file

**Cripple 2: delete the migration, keep the test fixture's hand-typed DDL.** Result: **2 red, and
only 2** — the two arms that run `applySchema` over a fresh in-memory database.

**17 of the 19 arms in a file whose entire subject is a new column stayed green against a schema the
app never writes to `klatch.db`.** They are green correctly: `__tests__/setup.ts` builds its own
`channels` table, so every arm reaching through `createChannel` measures the fixture, not the
migration. I added the column to both, so this file is sound — and I only *have* the two measuring
arms because `round465` had already built the `applySchema`-over-a-temp-db pattern for a different
reason.

Routed to Argus as a measurement question (how many of the 144 server test files assert a schema fact,
and how many assert it against the fixture?). **Not claimed**: it is a census, which is his seat, and
my file is not the instance that would fail.

**The other cripples, each reddening its own arms and nothing else:**

| cripple | red |
|---|---|
| 1 — fuse rules into the purpose part, unlabelled | 4 (both conflation checks, the floor arm, debug/assembly agreement) |
| 2 — migration omitted, fixture kept | 2 (and *only* 2 — §3) |
| 3 — rules ride on layer 4's boilerplate-Purpose condition | 2 (the independence arms) |
| 4 — blank stored as `''` | 0 of 18 → 1 of 19 after the new arm |
| 5 — client-side klatch gate removed from `handleSubmit` | 1 (the gate arm) |

**One arm hardened by cripple 3 rather than by reasoning.** prompt-debug's *"ACTIVE on rules alone"*
line is derived from `channel.groundRules`, so **it reported ACTIVE while the assembly was dropping
the rules** — it stayed green under cripple 3 while only the assembled-string assertions in the
sibling test went red. It now checks the report against the run, in the same arm that makes the
claim. Same shape as the lesson about a report derived from source attesting the source.

**One honest limitation recorded:** cripple 2's second red arm (*"applying the schema twice is a
no-op"*) conjoins idempotence with presence — under cripple 2 the `not.toThrow()` half passed and the
`toHaveLength(1)` half failed. The vitest output names the failing assertion, so a reader can tell
which; a bare red could not. Left as one arm because idempotence means nothing if the column is
absent, but noted rather than left for someone to rediscover.

## 4. Routed, not edited: a false line on the board

`attention-rollup.md:319`'s RULED entry closes *"Nothing is built yet — no field, no default/template
persistence, no prefill-from-previous-klatch."* As of `77a45d66` **the field exists**; the other two
clauses are still true. Routed to Calliope in the memo rather than edited here — her trust
instrument, her render discipline, and the precedent is Theseus's v181 correction which she recorded
approvingly in v183. Her scope doc likewise untouched.

## 5. Gate, re-driven fresh against my own change

- `npm run typecheck` → **0 `error TS`**, all four workspaces
- server **144 files / 2249 passed / 1 skipped (2250)**. Standing was 2230/1 (2231); 2230 + 18 + 1 =
  **2249** — exactly my arms, nothing else moved
- client **28 files / 344 passed / 13 skipped (357)**. Standing 337/13 (350); 337 + 7 = **344**
- `sweep-probes --census` → **CENSUS OK, 155 files, 45 swept / 110 deferred**, run twice by the
  pre-commit hook
- full driving sweep — launched at 13:3x, **this slot deliberately left unwritten**; filled below
  from the output file after the process exits. `wc -c` at the time of writing this line: the file
  was still growing.

Two pre-existing client assertions updated, not weakened: `toHaveBeenCalledWith` compares arity, so
a seventh argument on `onCreateChannel` reddens them. They now pin `undefined` in that slot, which is
also the assertion that **a chat sends no ground rules**.

## 6. What I did not do, with reasons that are not deadlines

- **Phases 2 and 3** — Calliope's coupling argument, plus phase 2's submit-time prompt is a UX call.
- **No edit surface for an existing klatch's rules.** `PATCH /channels/:id` accepts and clears them;
  no UI sends it. A user can write rules at creation and not change them after. A genuine rough edge
  of phase 1 *as specced*, flagged rather than silently scope-widened.
- **`api/client.ts`'s `createChannel` is at eight positional parameters** and wants an options bag.
  Not done: it touches every caller and mock for a one-field change, and a half-converted signature
  is worse than either shape. Named as an unclaimed follow-on.
- **Theseus's `client.ts` raw-JSON seam**, which he named as nearer mine: **a choice, not a blocker.**
  A ruled product item 13 days unbuilt with a spec written three hours earlier outranked it. Unstarted
  and unclaimed, so he is not being raced.
- **His §2 detector blindness** (`DETECTORS.model` and the route population perfectly disjoint):
  **Argus's**, and his routing is right. His reason not to patch is stronger than he put it — widening
  cannot help *because the route population holds no model token to widen to*.

## 7. Sweep verdict — typed from the output file after the process exited

The run launched at 13:3x exited with code 0. Verdict read off `.sweep-gr.out` (7,322 bytes at exit,
`.sweep-gr.err` **0 bytes**) after the process had exited, not from the standing figure:

```
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but
did not finish), 0 census problem(s), 110 deferred
```

Matching this morning's 09:29 run and Argus's 09:10 run — so the ground-rules increment moved nothing
in the probe corpus, which is what a schema column plus a prompt layer with no probe coverage should
do. **The mechanical rule from 09:29 held this fire:** the slot above was written as "deliberately
left unwritten" with a `wc -c` taken at the time, and this figure was typed only now. It is the same
figure I would have drafted; that remains the hazard rather than the exoneration, and the difference
is that this one is a measurement.

### Wrap verification (CLAUDE.md Session Wrap Protocol)

`git log origin/main --oneline -5`:

```
2b42a523 mail+coord+log: 11/16 WORK fire — ground-rules phase 1 shipped from spec in one fire...
619238e1 test(ground-rules): the empty-state arm was measuring the mapper, not the column
77a45d66 feat(ground-rules): phase 1 — a per-klatch conduct field, blank by default, at layer 4a
13539ea1 mail+rollup+coord+log: 11/16 MID fire — ground-rules scoping written (Calliope)
5c0af5e9 coord+log: 11/16 START fire (Theseus)
```

Deliverables `ls`-confirmed, and the code confirmed **at the remote** rather than only locally:
`git show origin/main:packages/server/src/db/index.ts | grep -c ground_rules` → **2**;
`…claude/client.ts | grep -c GROUND_RULES_PREFIX` → **2**;
`…client/src/components/ChannelSidebar.tsx | grep -c newGroundRules` → **3**. Both test files and
the memo present. Working tree clean at wrap.

---

## 17:17 — Session resumed (STOP fire, Opus 5)

`date`-read **17:17 PST** at session start, and **17:28:53 PST** mid-fire — read, not estimated.

### Briefing

Pull: worktree already at `origin/main` (wrapper synced). **Commit authors checked, not assumed** —
the three commits above my 13:36 head are **Argus's** 13:46 admission answer, **Theseus's** five-commit
`unit-467importroute` chain + wrap (14:50–15:03), and **Calliope's** 17:09 SWEEP-fire rollup/coord push.
**None mine.** Mail delta → **3 added**, all read in full in this fire:

1. **Calliope → me** (`…your-4-is-corrected-in-the-rollup-verified-fresh…`): my §4 is taken,
   `attention-rollup.md:319`'s "nothing is built yet" corrected in place with a dated addendum,
   verified against the code rather than my memo. Informational, no action owed; she explicitly keeps
   the thread out of `read/` because §3 (Argus) and §5 (Iris) are still open. Not moved.
2. **Theseus → Argus + me**: his verdict-grading of Argus's admission answer. The half addressed to me
   is now *smaller* than this morning's routing — "whether `streamClaude`/`streamClaudeRoundtable`
   should be callable at all from a `scripts/` importer" — with "no ask, and no blocker on me"
   attached. Not taken this fire; see deferrals.
3. **Argus → Theseus, me cc**: the three candidate probes read clean, `net` backstops every real
   server-spawner, no `promote-probes` change. Nothing owed by this seat.

### The unit: phase 2 of the ground-rules ruling, server half

`docs/research/ground-rules-phase2-2026-11-16/{PRE-REG,RESULTS}.md`. Pre-registration pushed as
`592d1309` **before any of the code or tests existed**; then `0ae38749` (schema + queries + shared
type + route + mount), `996775be` (23 arms), `97b710a8` (two count pins), `858c77b3` (memo + results).

**Why product again, third fire running.** Theseus's 11/15 proportionality countermeasure, run first:
grep the rollup for RULED items before anything else. Phase 1 shipped at 13:3x; Calliope's scope doc
names phase 2's storage as the only genuinely new schema and its UX as additive. The storage + HTTP
half is the part no UX call is waiting on, so it is this seat's and it was unblocked.

**One table, not the two the scope doc specifies — declared up front, in the pre-reg, not after.**
`ground_rules_presets` with `is_default` as a **designation on a saved set**, plus a partial unique
index `WHERE is_default = 1`, instead of a settings-shaped default slot beside a templates table.
Reasons in the memo; the cost named too (migrations are additive-forever, so overruling is cheapest
now, and the HTTP surface is deliberately the stable layer so Iris is not hostage to the call).

**The table-count argument everyone would reach for here is void, and I checked rather than repeating
it.** `CLAUDE.md` says six tables and "add Drizzle at 8+". Live count off
`grep -n 'CREATE TABLE IF NOT EXISTS' packages/server/src/db/index.ts`: **eight before this fire,
nine after**. The listed six omit `files` and `file_refs`. So the stated threshold was already crossed
before I added anything — routed to Calliope (count) and raised for xian (whether to adopt an ORM now),
not edited on the way past.

### Cripples: four, two refutations, and one of them is my own blind spot

Cure committed (`996775be`) before any cripple existed; tree verified clean and marker-free after the
last restore.

- **C3** (blank-body 400 removed) → predicted exactly 1 red, measured **1**. LANDED.
- **C4** (`rowToPreset` returns the raw column) → predicted the mapped-field arms redden and the
  raw-column arms don't; measured **3 red**, all mapped, every raw-column arm green. LANDED. This
  cripple exists *because of* this morning's mapper finding, applied prospectively.
- **C1** (index dropped) → predicted **1**, measured **2**: the raw-INSERT arm *and* my own
  index-presence arm reading `sqlite_master`. **REFUTED on count**, landed on substance. A cripple on
  a schema object reddens both the behavioural arm that needs it and the arm that asserts it exists —
  I was thinking only about the behavioural half while holding the other arm in the same file.
- **C2** (default-clear removed) → predicted **≥2**, measured **1**; the mechanism I was less sure of
  is the one that landed (`SqliteError: UNIQUE constraint failed`, not a wrong value).
  **REFUTED on count**, landed on mechanism — and it says the index and the clear are not redundant:
  **the index converts a silently-wrong flag into an error.**

**A finding that was none of the four predictions.** C4 did not redden the `POST … makeDefault` arm,
because `createGroundRulesPreset` returns a **hand-built object literal** rather than a re-read of the
row through the mapper. So the create path publishes a second spelling the mapper never touches, and a
mapper defect is invisible on the create response and visible only on reads. `createChannel` has the
identical shape — a house idiom, not a slip in my file. Named, not fixed: it touches more than one
function. Same mechanism as the morning's finding in different clothes; the cure both times is to read
the column.

### Gate, re-driven against my own change

- `npm run typecheck` → **0 `error TS`** ×4 workspaces.
- Server **145 files / 2272 passed / 1 skipped (2273)** — standing 2249 + my 23, and 2249 + 23 = 2272,
  so nothing else moved.
- Client **28 files / 344 passed / 13 skipped (357)** — unchanged, no client file touched.
- `sweep-probes --census` → CENSUS OK, 155 files, 45 swept / 110 deferred (also run by the pre-commit
  hook on all five pushes this fire).
- **Full driving sweep — the slot was left unwritten while the process ran, and this figure was read
  off the finished file.** `wc -c .sweep-1716.txt` taken twice while it ran (**6103** then **7322**
  bytes) to prove the file was still growing rather than asserting it; the task reported exit **0**;
  then the figure:

```
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
finish), 0 census problem(s), 110 deferred
```

  Matching this morning's two runs and Argus's 09:10 run exactly — so a new table, a new router and
  two re-counted pins moved nothing in the probe corpus, which is what server-side storage with no
  probe coverage should do. **Fourth fire of holding the mechanical rule**, and as before the figure
  is the one I would have drafted; that is the hazard, not the exoneration — the difference is that
  this one is a measurement.

### Two count pins moved, which is the pin working

`round214-json-body-guard.test.ts` `callSites` 15 → **16**; `round218-one-mount-list…` exported routers
9 → **10** and its comment's export-style split 6/3 → 6/**4**. Both reddened on the new router
*existing*, not on anything weakening — the sibling arm ("no route reads a body with a bare
`c.req.json()`") stayed green throughout. Both figures **re-counted off the live directory** in this
fire (2+4+1+1+2+4+2 = 16; `grep -rl` per export style → 6 and 4), not incremented from the old number.

### Drain

Pull + author-checked delta; `COORDINATION.md` read; all three new mail files read in the same fire and
each either acted on or explicitly recorded as owing nothing; a ruled product item taken from scope doc
to `main` with four cripples driven and two of my own predictions refuted; one stale `CLAUDE.md` figure
and one ORM threshold routed rather than edited; memo to Calliope + Iris filed; gate re-driven; five
incremental pushes so a 2400s death cannot strand the unit.

**Deferred with named reasons, no deadlines.** Theseus's `client.ts` seam question (should
`streamClaude` be callable from a `scripts/` importer) — **not taken, a choice, not a blocker**; he
marks it "no ask," it is unclaimed and nobody is racing. My three boarded research items (SAMELINE
pairing key, form-aware precision census, sha/round-label exclusion) — **no blocker, a choice**, third
fire outranked by ruled product work. The create-path-literal seam above — named this fire, unclaimed,
needs its own unit. Still mine and unclaimed from before: the parameter/positional exclusion,
`arm-routecure-d.mjs`'s `hash-object` pin and `/misordered/` detector, the `unit-465p12site` RESULTS:93
one-clause cure, the two `schemacollide` single-name selectors, and `api/client.ts`'s eight-positional
`createChannel` wanting an options bag.

### Wrap verification (CLAUDE.md Session Wrap Protocol) — STOP fire

`git log origin/main --oneline -6`:

```
8a8d7e9e coord+log: 11/16 STOP fire -- phase 2's server half on one table with the cost declared...
858c77b3 mail+research: 11/16 STOP fire -- phase 2's server half, one table instead of two...
97b710a8 fix two count pins the new router moved (16 body-guard sites, 10 routers)...
996775be tests (ground rules phase 2): 23 arms, storage claims read the raw column...
0ae38749 ground rules phase 2 (server half): one preset store with the default as a designation...
592d1309 pre-reg (ground-rules phase 2 server half): four cripples, and the storage shape diverges...
```

Deliverables confirmed **in the remote tree**, not only locally — `git ls-tree -r --name-only
origin/main` lists `docs/research/ground-rules-phase2-2026-11-16/{PRE-REG,RESULTS}.md`,
`packages/server/src/routes/ground-rules.ts`,
`packages/server/src/__tests__/ground-rules-phase2.test.ts`, and the memo
(`…phase-2s-server-half-is-built-with-one-table-instead-of-your-two…`). Code read at the remote
rather than from the commit messages: `git show origin/main:…db/index.ts | grep -c
ground_rules_presets` → **3**; `…db/queries.ts | grep -c GroundRulesPreset` → **11**;
`…routes/mount.ts | grep -c groundRulesRoutes` → **2**; `…__tests__/setup.ts | grep -c
ground_rules_presets` → **3**. Working tree clean at wrap; the sweep output file was removed, not
committed.

### Memory-index compaction: measured, partially taken, and deliberately not rushed

Writing two memories this fire tripped the index's size hook. **Measured, not estimated:** `wc -c`
on `MEMORY.md` → **20,324 B** before, **19,997 B** after I compacted the index's own preamble, and
`grep -c '^- \['` → **125 entries** (the 11-15 merge left 119; six have been added since, four by
other seats). The hook's target is 17.1 KB, so ~2.5 KB still has to come out.

What I did: folded the preamble's narrative (the 11-15 run's figures, the known store defect where
8 files declare a `name:` ≠ their filename and `[[…]]` links exist in both spellings) down to a
pointer, after **verifying both are actually carried in `docs/operations/memory-merge.mjs`'s own
header** (lines 1–17 and 161–163) rather than pointing at a file I hoped said it. Bought 327 B.

What I did **not** do, and why: the remaining 2.5 KB needs a **new `CLUSTERS` list** for
`memory-merge.mjs` — the 11-15 list is left in place deliberately and the tool refuses to re-run it.
Authoring ~25–30 coherent cluster members is an analysis task on the user's persistent store, and
doing it in the last twenty minutes of a bounded fire is how a merge lands semantically wrong with
every validation green. Named as the next fire's first item rather than half-done. Two candidate
clusters already identifiable from the index, so the next session does not start cold:
**mail/delivery/cross-repo claims** (direct-links-not-mail-only, a-memo-is-not-a-delivery,
dispatch-push-needs-the-Amber-email, worktree-push-target, cross-repo-absence-needs-a-fetch) and
**fire/session operations** (kill-not-permitted, gh-and-docker-not-permitted, fires-die-at-2400s,
run-date-don't-estimate, don't-touch-the-index-while-the-sweep-drives).
