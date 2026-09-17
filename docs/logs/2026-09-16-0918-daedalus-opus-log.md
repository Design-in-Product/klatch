# Daedalus — 2026-09-16 session log (Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus` · branch `claude/daedalus-cycle`

---

## 09:18 PT — START fire opens

Synced by wrapper; `git status` clean at `ca73ffe2` (Argus's 9/16 START no-op).

**Briefing done, verified not assumed:**

- `docs/COORDINATION.md` Daedalus section read. Last fire 9/15 17:17 STOP = Round 216
  (`readFormBody` at six multipart sites, `c46b14a1`). Two items left open on my seat by that
  entry: (1) `files.ts` has **no size cap at all** — flagged, not fixed, called a sizing
  decision; (2) socket verification of the post-fix shape, offered to Theseus.
- **One memo addressed to me by name:**
  `docs/mail/theseus-to-daedalus-cc-argus-iris-xian-janus-calliope-all-six-driven-at-the-wire-and-the-hoist-does-not-answer-at-all-2026-09-15.md`
  (Round 217). Read in full. It took my §7 handoff and closed the socket item — 21/21 at the
  wire, my §2 table reproduces exactly, 30 cells all 400.
- `docs/briefs/cross-pollination/current.md` (2026-09-16) read. Insight §1 is our own
  Rounds 216/217 harness gap; insight §2 (Janus) is the one with transferable teeth here —
  *a discipline rule whose only enforcement is recollection is unenforced; it needs a
  mechanical veto at the action point.*

**Theseus's Round 217 hands me two things, and both are actionable this fire:**

1. **§2/§3 — the uncapped `files.ts` routes don't answer at all.** Measured, not argued:
   a request declaring `Content-Length: 209715200` and then sending ~45 bytes gets
   `no response in 4004ms` at both `channels/:id/files` and `projects/:id/files`, where all
   four capped `import.ts` sites refuse immediately with the cap's sentence. He filed it as a
   MEAS with an `open` check that flips red when the gap closes, and left sizing to me/xian.
2. **§1 — the harness gap.** `__tests__/app.ts` doesn't mount `fileRoutes`.

### First measurement of the fire: my own "sizing decision" framing was wrong

`grep -n MAX_FILE_SIZE_BYTES packages/server/src/routes/files.ts` → **line 25 only**, the import.
The constant is imported into `files.ts` and **never used** — a dead import. And
`packages/server/src/files/storage.ts:8` already sets it to **10 MB**, enforced by
`validateFile` at `storage.ts:50` *after* the full buffer is read.

So the sizing call **has already been made and is in the code**. A pre-read Content-Length
check in `files.ts` using that same constant introduces no new policy — it refuses at the
header exactly what `validateFile` refuses three steps later. That is Round 151's fix applied
to a second route family, not a decision for xian. My 9/15 board entry called it "a sizing
decision, not a body-guard question"; the first half of that is wrong.

### Second measurement: the harness gap is four routers, not one

`packages/server/src/index.ts:35-43` mounts **nine** routers. `__tests__/app.ts` mounts
**five**. Missing: `modelRoutes`, `fileRoutes`, `aaxtRoutes`, `exportRoutes`.

### Correction to the brief's phrasing, checked rather than repeated

The cross-pollination brief says the two `files.ts` routes were "reachable from exactly zero of
the 1,850 server tests." Checked: `round14`, `round15`, `round16` and `round216` each build
their **own** local `Hono()` and mount `fileRoutes` on it, and `round14-file-domain-model.test.ts:243`
does drive `GET /api/channels/default/files`. Enumerated every `request('/api…')` in those three
files — all seven distinct paths — and **no test issues a POST to either upload site**. So the
accurate claim is narrower and still serious: the two **multipart POST upload handlers** were
driven by no test, and `createTestApp()`'s omission is why every file test re-invents a mini-app.
Filing the correction; not restating the broader version.

**Plan for this fire (Round 218), in order:**

- A. Close the harness gap at `__tests__/app.ts`, and add a **structural guard** that diffs the
  production mount list against the harness mount list — per brief §2, the rule needs something
  at the action point that can say no, not a note asking the next agent to remember.
- B. Pre-read Content-Length cap at the two `files.ts` sites, sourcing the existing
  `MAX_FILE_SIZE_BYTES`. Closes Theseus's §3 hang and flips his `open` check red on purpose.
- C. Mutations, full suite, typecheck, build. Memo to Theseus.

---

## 09:20 PT — baselines, measured before touching anything

- Server **117 files · 1850 passed · 1 skipped**
- Client **37 files (24 passed, 13 skipped) · 317 passed · 13 skipped**

Both match Argus's 09:02 figures exactly. Not taken from his entry — run here.

## 09:21–09:27 PT — A: one mount list

`routes/mount.ts` exports `mountApiRoutes(app)`. `index.ts` and `createTestApp()` both call it;
neither keeps a list. Deliberately *not* a diff test — brief §2's point is that the failure mode
was never inattention, so the fix has to remove the second list rather than watch it.

Checked for landmines before doing it: `models.ts`, `aaxt.ts`, `export.ts` construct their Anthropic
clients lazily (`models.ts:32`, `export.ts:243`), no top-level side effects, and mount order is
copied from `index.ts` verbatim since Hono resolves first-match. Suite after: **117/1850/1,
unchanged** — no collisions.

## 09:22 PT — B: the pre-read cap

`rejectOversizeBeforeRead` extracted from `import.ts` to `routes/size-cap.ts`, parameterised on the
cap and on a message callback. Extraction alone, before adding any call site: **1850 still green**,
so it is behaviour-neutral for the import family.

Then wired at both `files.ts` upload sites. Suite: **still 1850.** Nothing in the suite noticed a
new refusal — which is the expected result and the reason the round needs its own tests.

## 09:25 PT — a self-inflicted loss worth recording

Ran `git checkout -- packages/server/src/routes/files.ts` to revert a mutation, on a file whose
Round 218 changes were **uncommitted**. It restored HEAD and destroyed the work. Redone from
context; no net loss, ~4 minutes.

The rule I should have been following and now am: **commit before mutating.** `git checkout --` is
a safe revert only when the thing you want back is already in a commit. Everything from mutation 2
on was driven against `dd4bba07`.

## 09:26–09:33 PT — mutations (7 driven)

| # | mutation | result |
|---|---|---|
| 1 | restore the pre-218 five-router harness | 18 of 22 red |
| 2 | drop the cap at `/channels/:id/files` | 2 red, both at that site |
| 3 | hoist the cap above the project 404 | 1 red — the placement control |
| **4** | envelope allowance → 0 | **0 red.** After repair: 2 red |
| 5 | `files.ts` borrows import's sentence | 2 red → **3 red** after repair |
| 6 | mount a tenth router straight into `index.ts` | 1 red — the veto fires |
| 7 | header never consulted (always falls through) | **11 red across 3 files** — r151 (4), r216 (1), r218 (6) |

**Mutation 4 is the finding of the fire.** It reddened nothing. The control computed its request
size as `MAX_FILE_SIZE_BYTES + MULTIPART_ENVELOPE_ALLOWANCE`, so shrinking the allowance shrank the
request in lockstep and the assertion could not fail under any value of the constant it was
supposedly testing. Rebuilt on a measured literal (187 bytes, `probe-import-multipart-cap.mts`
arm B), plus a floor on the constant and a check on the far side of the boundary.

**Mutation 5 exposed the same shape one test over.** "The two sentences differ" compared a string
literal in the test file against itself, and sailed through a mutation that rewrote the server's
sentence entirely. Rewritten to read both sentences out of the product — the cap's from a real
response, the exact check's from `validateFile()`.

Generalisation, sharper than "check your controls": **a control whose input is derived from the
thing it controls is a tautology wearing an assertion's clothes**, and it reads as *more* rigorous
than a hardcoded literal, not less. Only mutation distinguishes them. This is Theseus's Round 217
§4 and my own Round 210 finding, arriving in my file for the third time.

## 09:34 PT — the model-call question, measured rather than reasoned about

Mounting `modelRoutes` in the canonical harness could plausibly have started making outbound
Anthropic calls from the suite. `Models API fetch failed` appears **55 times** in a run — so I
restored the old five-router harness and counted again: **55.** Identical. The calls come from
`round13`, `round39` and `model-validation`, which mount their own apps and predate this change.

Flagging separately, not fixing: 55 outbound auth attempts per suite run is real and pre-existing.

## 09:35 PT — final verification

```
Server  118 files · 1874 passed · 1 skipped   (from 117/1850/1: +1 file, +24 tests)
Client   37 files ·  317 passed · 13 skipped  (unchanged)
typecheck  clean ×3 workspaces
npm run build  clean
```

`scripts/round218-mutations.sh` was written this fire and then **deleted**: script execution is not
permitted in this sandbox, so it never ran, and an unrun script that looks like a reproducible
record is worse than none. The mutations above were driven by hand, one tool call each.

## 09:36 PT — deliverables

- `dd4bba07` — Round 218 product + tests
- `27889176` — the two vacuous-control repairs
- `2e75532b` — mail to Theseus (separate commit, per the worktree mail rule)
- `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-both-your-items-closed-and-the-sizing-call-was-already-made-2026-09-16.md`

Thread deliberately **left open** in `docs/mail/` — socket verification of the post-fix shape is
offered to Theseus and not done. Not moving it to `read/`.

**Two things I did not do and am naming rather than leaving implied:**

1. **No socket drive.** Everything here is `app.request()`. Theseus's arm L is the only thing that
   has shown this defect from outside the process, and the fix has not been seen that way.
2. **`round14`/`round15`/`round16` still build private harnesses.** Now redundant. Left alone —
   three more files of blast radius for no behaviour change.

**Correction filed, aimed at the brief rather than at Theseus:** the 9/16 cross-pollination brief
says the two `files.ts` routes were "reachable from exactly zero of the 1,850 server tests." Checked
before repeating: four test files mount `fileRoutes` on their own local apps, and
`round14-file-domain-model.test.ts:243` drives `GET /api/channels/default/files`. The accurate claim
is the narrower one Theseus actually wrote — the two **multipart POST upload handlers** were driven
by no test. Carried to Calliope in the memo, since the brief is what travels to other projects.

---

## 13:17 PT — WORK/MID fire · Round 220

**Briefing.** Pulled clean at `5b69b315`. Read `docs/COORDINATION.md` (my section) and
`docs/mail/`. One memo addressed to me by name and unread:
`theseus-to-daedalus-…-driven-at-the-wire-and-my-own-tripwire-was-the-vacuous-one-2026-09-16.md`
(Round 219, 27/27 at the wire). Read in full at the top of the fire. It closes my Round 218
items and leaves three things: **§6(a)** a hardcoded cap sentence, **§6(b)** a last-entity
floor asymmetry, **§7** reassign on the March corpus, undriven for a third fire. Took §6(a)
and §7; verified §6(b) and routed it rather than building it.

### §6(a) — three enforcers, not two

Before fixing, grepped the whole tree for the literal rather than the two files Theseus
named:

```
$ grep -rn --include="*.ts" --include="*.tsx" -e "10 MB" -e "10MB" -e "MAX_FILE_SIZE" packages/*/src
packages/client/src/components/MessageInput.tsx:118:  alert('File too large. Maximum size is 10 MB.');
packages/server/src/files/storage.ts:52: ... Maximum is 10 MB.`
packages/server/src/routes/files.ts:67:  ... Maximum is ${max / (1024 * 1024)} MB.`
```

`MessageInput.tsx:117-118` held **both** the threshold and the sentence as literals. That
gate is the one a user meets first, and its failure mode is worse than a wrong sentence:
raise the server cap and the attach button keeps refusing files the server would take, with
no error anywhere, because the request is never sent.

`ProjectSettings.tsx:28` (`handleFileUpload`) has **no** client gate at all — checked, and
left alone: since Round 218 the server refuses that path in 0–3 ms with a correct sentence.

**Fix:** `MAX_FILE_SIZE_BYTES` + `formatFileSizeLimit(maxBytes)` → `@klatch/shared`;
`storage.ts` re-exports the constant so the six test files that mock `../files/storage.js`
keep resolving. Three sites, one number, three voices.

### Two things my own tests caught in the fix

1. **`formatFileSizeLimit(maxBytes = MAX_FILE_SIZE_BYTES)` failed its own test on the first
   run** — `expected '10 MB' to be '2.5 MB'`. A default parameter binds the *declaring*
   module's constant, which `vi.mock` does not replace. The helper written to stop two sites
   disagreeing about the cap was itself answering about two caps. Default removed at both
   helpers; pinned by `expect(fn.length).toBe(1)`.
2. **The `limitClause` regex in my own test was `/Maximum is ([^.]+\.)/` and returned `2.`**
   — the fractional cap's decimal point ends the match. Only visible at a fractional cap; at
   10 or 20 MB it reads correctly. Same shape as the thing under test.

### 9 mutations, 9/9 red as predicted

| # | mutation | red |
|---|---|---|
| 1 | `storage.ts` re-hardcodes `Maximum is 10 MB.` | 2 |
| 2 | `files.ts` re-derives the cap with `max / (1024*1024)` | 2 |
| 3 | formatter always `.toFixed(1)` | 4 across 2 files (incl. round218's shipped literals) |
| 4 | `storage.ts` re-declares its own constant | 5 |
| 5 | client threshold back to `10 * 1024 * 1024` | 2 |
| 6 | client sentence back to a literal | 3 |
| 7 | drop the "uploaded" distinction | 6 across 2 files |
| 8 | message move scoped to the whole channel | 4 — **355 rows instead of 174 on real data** |
| 9 | suppress the seat INSERT | 6 — **`empty now=117 before=0`** |

**Mutation 2 is the finding about my own control.** It was **green** on the first version of
the test, which mocked the cap to 2.5 MB. `${max / (1024 * 1024)} MB` and
`formatFileSizeLimit` return the *identical string* for any cap with at most one decimal, so
reverting `files.ts` to its own arithmetic changed nothing the test could see — the two
sentences still agreed, by coincidence again, one decimal further out than the coincidence
Theseus found. Re-aimed at **2.25 MB** (`2.3 MB` through the formatter, `2.25 MB` through raw
division) and committed separately (`98473e91`) so the weakening is in the history.

**Transferable:** *a control that mocks a constant is only as strong as the value it mocks it
to.* Choosing a clean test number is the same instinct that lets literals agree by accident.

### §7 — reassign on the March corpus, driven

`scripts/probe-round220-reassign-on-the-march-corpus.mts` — **32/32 checks, 0 failed, no
defect found.** Query layer direct, not HTTP (the wire is what Theseus's Round 213 covered;
the data is what nobody had). Works on a copy under `.testdata/r220/`; `march14.db` md5
identical before and after and `packages/` untouched, both asserted by the probe at exit.
Zero model calls.

```
139 channels · 68 entities · 170 seats · 2652 messages (1270 stamped)
138 of 139 channels seated on default-entity ALONE
heaviest: "VA exec asst" — one seat, 174 stamped messages
```

Every case in the Round 212 unit suite is a two-seat channel with a handful of rows the test
wrote. The corpus is single-seat channels with ~100 real rows. Heaviest seat moves whole,
`added_at` preserved (`2026-03-14 12:25:14` both sides); blast radius compared **cell by
cell** against a pre-image — exactly 174 cells changed, all `entity_id`, none outside the
channel, exactly two seat rows differ. At scale: all 137 remaining `default-entity` seats,
1081 further rows, 137 reassigned / 0 refused, no channel emptied, message total unchanged.
Five refusals driven against real ids.

**Limit measured, not argued:** `fromEntityOrphaned` is hardcoded false for
`DEFAULT_ENTITY_ID` (`queries.ts:651`), and `default-entity` is the source for 138 of 139
possible reassigns here — so **the orphan report is structurally silent on the only corpus we
have.** It reported false on all 137 moves, including the last, after which `default-entity`
held nothing. Arm F drives a non-default source separately to show the flag does work.

### The finding of the fire, and it is against my own probe

Two of that probe's checks were tautologies in the first draft, caught by **reading the
output** — no mutation would have caught either:

```js
check(..., reassigned + others === defaultSeats.length);          // true by loop construction
check('no channel lost its last seat',
      count(EMPTY_CHANNELS) === count(EMPTY_CHANNELS));           // the same subquery, twice
```

The second is aimed at the worst thing this operation can do and is **true of a database in
which all 139 channels have just been emptied**. Rewritten against arm A's baseline; mutation
9 then reads `FAIL no channel lost its last seat — empty now=117 before=0`. The original
would have said `ok` while 117 of xian's channels sat empty.

That is three vacuous controls of mine in one fire (the default parameter, and these two),
two of them written *after* reading Theseus's §5 memo about exactly this. Theseus's §5 named
source-text assertions; his §6(a) named self-derived inputs; this is a third face —
**a control whose two sides are the same expression** — and it is the hardest to see, because
there is no literal and no grep to be suspicious of.

**Working rule adopted for this seat:** every check must have two sides that came from
different places, and I must be able to say which two.

### §6(b) — verified, not built

```
entities.ts:230   'Cannot remove the last entity from a channel'  → 400
queries.ts:483    DELETE FROM channel_entities WHERE entity_id = ?   (deleteEntity, no floor)
```

Theseus's read is exact. The premise question — what a channel with no entity *is* — is
xian's, so nothing built. Routed with two shapes, the second separable from the premise call:
**`DELETE /entities/:id` returns 200 and says nothing about the N channels it just emptied**,
which is wrong whichever way the floor question goes. Thread left **open** in `docs/mail/`.

### Verification (Session Wrap Protocol)

```
$ git log origin/main --oneline -5
213f1b97 mail: Daedalus -> Theseus, your 6(a) had a third site and the corpus item is closed
26116a80 Round 220: reassign driven on the March corpus, 32/32 -- Theseus's three-fire item
98473e91 Round 220: retarget the mocked cap to 2.25 MB so a second derivation is visible
21db36a0 Round 220: one file-size cap for three enforcers, and the client had the third
5b69b315 coordination+rollup+log: Calliope 9/16 MID fire ...
```

Server **119 files / 1884 passed / 1 skipped** (+1 file, +10 from 118/1874/1). Client
**324 passed / 13 skipped** (+7 from 317/13). Typecheck ×3 and `npm run build` clean; full
suites re-run after every mutation was reverted, working tree clean between each.

**Not claiming:**

1. **No wire drive of the cap change.** All `app.request()` and jsdom. The sentence Theseus's
   Round 219 arm A asserts is unchanged by this work, so his probe should stay green — and if
   it does not, that is the news. Offered to him, not assumed.
2. **Six test files still carry `MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024`** in their
   `storage.js` mock. Mocks of a module that no longer declares it; harmless, not chased.
3. **`round14`/`15`/`16` still build private harnesses.** Unchanged for a third fire.
4. **`Models API fetch failed` ×55 per suite run.** Theseus's §4 note taken — his 0 was a
   keyed live server, my 55 is the keyless suite. Both true, not merged. Still nobody's item.

---

## 18:10 PT — STOP fire, Round 222: the pre-flight hoist, and the bind test retired

**Mail read first.** `theseus-to-daedalus-…-your-hoist-broke-my-probe-loudly-and-then-a-probe-of-mine-graded-a-strangers-process-2026-09-16.md`.
Took his §3: the bind-test pre-flight that let `probe-round217` grade a stranger's process was
copy-pasted into ~20 more probes. That is the fire's unit of work.

**17:20 — classified before touching anything.** 63 `.mts` probes under `scripts/`; 21 carried
the copy-pasted `portIsFree`. Two distinct use-sites, not one: a **pre-flight guard** (13 files,
his case) and a **wait-for-release** loop between a SIGTERM and the next spawn (8 files, which
Round 221 does not cover). The 8 are the restart-capable "Round 146 discipline" family.

**17:30 — the measurement that reframed the round.** Staged a wildcard HTTP stub on 3001 and
spawned a real `packages/server` child against it:

```
stub listening on {"address":"::","family":"IPv6","port":3001}
OLD portIsFree(3001) -> true
child.exitCode = 1 · log bytes = 1169 · banner present = false
Error: listen EADDRINUSE: address already in use :::3001
```

Theseus's finding reproduces independently. And the banner is absent **exactly** when the bind
failed — which is what separates the 8 protected probes from the 13 exposed ones. The
discriminator is the readiness loop, not the pre-flight.

**17:45 — built `scripts/lib/probe-server-ownership.mts`, and the first design was wrong.**
I kept the bind test as a "second side" to the HTTP check. Arm B went red on the first run:
a silent occupant on `0.0.0.0` was missed by `bind 127.0.0.1` too. Measured the full matrix
rather than reasoning about it (`.testdata/r222-scratch/bind-matrix.mts`):

```
occupant                          bind 127.0.0.1   bind wildcard   bind 0.0.0.0
:: (what packages/server binds)      BOUND          REFUSED         REFUSED
0.0.0.0                              BOUND          BOUND           REFUSED
127.0.0.1                            REFUSED        BOUND           BOUND
```

**Every column has a miss.** There is no address to bind that answers the question the guard is
named for, because `SO_REUSEADDR` makes "can I bind" a question about overlap, not occupancy.
Replaced the decision with a **TCP connect**, which reaches whichever socket claims the address
and finds all three. HTTP kept only to *describe* the occupant; wildcard bind kept as an
independent second side for a socket bound but not listening.

**17:55 — migration.** Scripted, with a report per file and a refusal on anything unrecognised:
20 migrated, 0 skipped. `probe-multi-root-browse.mts` declared `function portIsFree` rather than
`async function`, so the script missed it — done by hand, and it turned out to have **no
pre-flight at all** (its `stopServer()` returns early when there is no previous generation), so
it got one.

**18:00 — mutations, and two survived.** Four driven against the control:

| mutation | first pass | after repair |
|---|---|---|
| M1 guard reverts to the shipped bind test | red | 21/24 (A, B, C) |
| M2 guard decides on HTTP only (Theseus's repair) | red | 23/24 (B) |
| M3 release-wait returns on a successful bind | **SURVIVED 20/20** | 23/24 (C) |
| M4 readiness drops the banner side | **SURVIVED 20/20** | 21/24 (D ×3) |

- **M3 survived because arm C staged its occupant on `::`**, where a wildcard bind is refused —
  so the arm could not distinguish the real repair from a wildcard-bind version of the old
  mistake. Fixed by staging the arm on `0.0.0.0` as well.
- **M4 survived because arm D asked the two-sided readiness its question after waiting for the
  child to exit.** At that point it refuses on the exit code and the banner side is never
  consulted. The check's text was fine; its *timing* made it vacuous. Fixed by racing both
  readiness loops from the same instant on a live child, plus a third check that the refusal
  happened **while an HTTP 200 was available** — the only condition under which the banner is
  doing the work.

**Rule adopted:** for any check of the form "X refuses Y", I must be able to say what would have
made it accept, and the control must put the run in that state. Round 220's "two sides from
different places" does not catch this one: both sides are present, they just never meet.

**18:05 — a tooling hazard worth recording.** `grep` intermittently omitted
`scripts/probe-round172-path-b-confirm-step-redrive.mts` from glob results — three separate
patterns, three times — while `git diff` and `Read` both showed it present and correctly
modified. Caught only because the migration script's own report listed a file my grep-derived
inventory did not. **Every count in this round is from a `node`/`readdirSync` pass.** It moved
the exposed count from 12 to 13 after I had already written it down as 12 twice.

**Disconfirmed my own suspicion:** I expected `npx` not to forward SIGTERM to the node
grandchild, which would have made every probe's shutdown leaky independently of the missing
signal handlers. Driven — `quiet 108 ms after SIGTERM`. Theseus's account of the leak is
complete; my extra suspicion was wrong and the measurement is in arm F.

**One correction to his §3, in his favour:** `scratch.db` *is* created on a failed bind —
`db/index.ts` opens it before `index.ts:35` reaches `serve()`. His conclusion holds; that leg of
the evidence was timing.

### Final state

```
24/24 checks passed · 9 measurements     (probe-round222-port-ownership-hoist.mts)
4 mutations driven, 4/4 red
21 probes migrated · 0 still define portIsFree · 22 importers incl. the control
```

Server **119 files / 1884 passed / 1 skipped**; client **324 passed / 13 skipped** — identical to
Round 220, because every edit this round is under `scripts/` and `packages/` is untouched
(asserted by the probe at exit). Typecheck over all 63 probes: 9 errors in 4 files, all
pre-existing, **zero new**.

**Not claiming:**

1. **Only 1 of the 21 migrated probes was driven end to end** — `probe-round213-reassign-live-http`
   (arm E: exit code 2, and **0 verdict lines**, which is the harm being observable separately
   from the guard). The other 20 are covered by typecheck and by the uniformity of the edit,
   nothing more. This is the largest soft spot in the round.
2. **`reapOnExit` is exported and used by the control but not retrofitted into the 21.** An
   immediate `process.exit(130)` in probes that restore files on the way out is not a mechanical
   edit, and I could not drive the result. Obvious next unit; flagged, not done.
3. **Theseus's `probe-round217:580` `string | null` typecheck errors** — offered, not fixed.
4. Items 2–4 from this morning's entry (six `storage.js` mocks, `round14/15/16` private
   harnesses, `Models API fetch failed` ×55) all unchanged for another fire.

Memo filed: `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-the-guard-is-in-21-files-and-no-bind-test-can-be-it-2026-09-16.md`
