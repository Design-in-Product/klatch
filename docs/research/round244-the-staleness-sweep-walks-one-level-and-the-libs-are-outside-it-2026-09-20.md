# Round 244 — the sweep that finds stale probes does not walk the directory the shared probe code now lives in

**Theseus · 2026-09-20 (STOP fire) · Klatch**
**Instrument:** `scripts/probe-round244-the-staleness-sweep-walks-one-level-and-the-libs-are-outside-it.mts`
**7 arms · 5 hard checks, all green · 5 measurements · 4 capability runs**
**Assigned unit:** the 28 unexamined stale-in-code probes, open since Round 240 and named
open again in Round 242 and Round 243.

---

## 0 — How the round opened: not from a hunch

The unit for this fire was the stale-in-code population I have now carried open for three
rounds. Before quoting its size I re-drove Round 240's sweep, because its figure was four days
and many commits old and *a stale number about stale probes* is a particular kind of
embarrassing.

It came back **exit 1**:

```
[I] FAIL  corpus-pin classifier separates found-ids from minted-ids (two-sided, on known cases)
      probe-round179 … classified a corpus reader: false (want false);
      probe-import-entity-binding … classified a corpus reader: false (want TRUE).
```

The positive half of a two-sided control had stopped holding. Round 240's own closing note says
the response to a world arm reading CHANGED is to revisit the subject, not repair the probe. So
the round became the subject.

---

## 1 — The finding: the sweep has a horizon one directory deep

`probe-import-entity-binding.mts` names `~/.claude/projects` three times. After `stripComments`
it names it **zero** times — all three are prose now. Its corpus access moved, in Daedalus's
Round 241 commit `2920d6bc` (*"the import acceptance test now resolves its cast instead of
naming it"*), into `scripts/lib/probe-corpus-sessions.mts`, which it imports at line 99.

And Round 240's sweep enumerates with a **one-level** `readdirSync` over `scripts/`, filtered to
`.mts|.mjs|.ts`. `scripts/lib/` is a directory: it fails the extension filter and is never
descended into.

```
[A] PASS  the one-level walk has a horizon, and a known below-horizon module is on the far side
      one-level 112, recursive 125, below horizon 13.
      scripts/lib/probe-corpus-sessions.mts on disk: true;
      in one-level walk: false (want false); in recursive walk: true (want true).
```

**Thirteen shared modules are outside the sweep's denominator entirely** — `probe-outcome.mts`,
`probe-corpus-sessions.mts`, `mint-transcript.mts`, `probe-server-ownership.mts`,
`probe-source-constants.mts`, and eight `.mjs` helpers. Every one of them is code that probes
depend on, and none of them has ever been asked the staleness question.

Arm A of the Round 240 sweep says:

```
110 files on disk = 110 with a commit + 0 uncommitted
```

which is true, and is completeness **of the level it walks**. It is the kind of true sentence
that stops a reader asking the next question.

### The mechanism, proved rather than asserted

```
[B] PASS  following imports restores arm I's positive fixture, and does not falsely credit its negative one
      probe-import-entity-binding: corpus context in its own code = false;
        reachable through imports = scripts/lib/probe-corpus-sessions.mts
      probe-round179: direct false, via none
```

Both halves matter. A graph walk that credited everything would "restore" the positive fixture
by making the classifier vacuous, which is the failure it is supposed to replace.

---

## 2 — Why this one is mine to eat, and the rule it produces

I wrote arm A. I wrote its *"readdirSync, not a glob"* comment, in Round 240.

One round later, in **Round 242**, my census arm went red and found **124 subagent transcripts**
that a one-level walk of the Claude Code corpus does not see. I wrote that up as a discovery
about the corpus. It is not a fact about the corpus. It is a shape — and I had it in hand,
two days ago, while the identical defect sat in my own instrument from the round before.

> **Rule (fifth iteration of the denominator rule): replacing a glob with a directory read fixes
> WHICH entries are reported, not HOW DEEP the walk goes. A control that asserts "N on disk = N
> enumerated" is satisfied by any self-consistent horizon, including one that stops a directory
> short.**

The Round 238 corollary applies to the finder as well as the found: *a finding about a
denominator is not filed until it has been carried back to every denominator you own.*

---

## 3 — A fourth pin class: a control fixture pinned to a live artifact

Round 240 catalogued three pin classes — a commit SHA, a product path, a live-corpus session
UUID. Arm I is a fourth, and it is the one that bites the instrument rather than the subject:

**Arm I's positive fixture was a hardcoded claim about the contents of another probe.** It
asserted `probe-import-entity-binding` *is* a corpus reader. That was true when written. It
became false when the corpus pin inside it was replaced by resolution — *the remedy that
Round 240's own finding prompted.*

> **A two-sided control anchored on a live artifact is a pin. If the artifact is the thing your
> finding asked someone to repair, your control is scheduled to break on success, and it breaks
> in the same colour it would break on regression.**

And the consequence was quiet. Arm J, the pin inventory, reads:

```
0 probe(s) name 0 real session UUID(s) in code; 0 pin(s) resolve to nothing on disk today
```

Re-derived over the full denominator, that number is **correct in substance**:

```
[D] MEAS  0 non-synthetic UUID pin(s) across 28 corpus-reaching file(s);
          0 of them below the one-level horizon; 0 dead (corpus readable, 539 sessions)
```

The single UUID in `probe-corpus-sessions.mts` is `00000000-0000-4000-8000-000000000000`, a
synthetic sentinel, in a comment. So the horizon has **not** hidden a live pin — stated here as
the measured negative it is, not as vindication. Arm J is correct today by the contents of a
directory it does not walk. That is not the same as being sound.

```
[C] MEAS  corpus readers, three denominators
      direct/one-level 24/112 (Round 240 arm I reported 22/110)
      direct/recursive  25/125
      transitive/recursive 28/125   ← the population a corpus-pin sweep has to cover
```

The 22 → 24 movement is two scripts added since Round 240, not drift in the classifier.

---

## 4 — The assigned unit: the stale population is a drift question, not a rot question

Re-derived over the recursive denominator: **33 files** name a product path that has moved or is
absent since they were last committed (Round 240's figure was 32/110 at one level, 29 when first
run).

The cheap question that is strictly stronger than "the subject moved" is: **do the product files
these probes name still exist?** "Moved" is a population. "Gone" would be a defect list.

```
[E] PASS  absent product paths are split by git history, not reported on absence alone
      Absent paths: 0 GONE + 9 FIXTURE
```

**Zero.** And the stronger form, answered from history rather than from today's disk:

```
[E3] MEAS  deletions of packages/**/*.ts(x) in all of history: 0; renames: 0
```

No product source file has **ever** been deleted or renamed in this repository. So the
gone-subject class is empty *by history*, not merely empty today. A stale probe in Klatch has a
subject that CHANGED; it has never had one that VANISHED.

That is the first thing said about the 28-unexamined population that is stronger than *"nobody
has checked."* It does not make them healthy. It rules out one specific way of being broken —
the cheapest one to rule out and, as it turns out, the one that cannot happen here. **They still
need driving.** Exit code proves the apparatus runs; only the figures prove it still measures the
same thing.

---

## 5 — Third instance of "expects to find" vs "mints", and this time I wrote it

The first version of arm E reported **9 GONE paths across 2 probes**:

```
verify-tsx-guard.mjs
      GONE  packages/server/src/db/no-such-module.ts
      GONE  packages/masked.ts        GONE  packages/a.ts   …
probe-round240-…-failing-silently.mts
      GONE  packages/server/src/x.d.ts
```

Checked before reporting: **all nine have zero commits, ever.** They are minted sentinels —
strings `verify-tsx-guard.mjs` feeds its own resolver to prove the guard rejects them, and the
negative fixture in Round 240's own arm B. Not one of them was ever a file.

Round 240 arm I's *first* version called `probe-round179`'s hand-minted twin ids real pins by hex
entropy. The fix was to stop asking what a string looks like and ask what the probe does with it:
*a pin is an id the probe expects to FIND; a fixture is one it creates.* **I wrote that sentence,
and then built an existence check over paths without applying it.**

> **Rule: "absent from disk" is not evidence a subject was lost. A subject that was never there
> was never lost — and a probe's negative fixtures are absent BY DESIGN, so an existence check
> alone reports a deliberate absence and a real deletion in identical words.**

Repaired with the non-heuristic discriminator matching the pin precedent: a real subject is one
git has ever tracked. `GONE = everCommitted && !exists`; absent-with-no-history is a FIXTURE,
**reported separately rather than dropped** — dropping it would leave no record of why the count
fell from 9 to 0.

### The control's fixtures were chosen for stability, not convenience

```
[E2] PASS  the ever-committed discriminator separates a real deletion from a minted sentinel
      docs/mail/iris-to-theseus-round43-reply-2026-06-25.md: everCommitted true, exists false
      packages/a.ts: everCommitted false, exists false
      packages/server/src/db/queries.ts: everCommitted true, exists true
```

A `git mv` into `docs/mail/read/` leaves the old path permanently in history and permanently
absent from disk. It cannot be un-made by a future repair — which is the property §3 says arm I
lacked, and the round diagnosing that would be a poor place to repeat it. All three fixtures are
needed: the first two are both merely "absent", and that is precisely the distinction that failed.

---

## 6 — Capability runs, including one that indicts my own arm E

Four mutations, each a copy of the probe under a dot-prefixed name so it falls outside both
denominators and pollutes no count. Each produced **exactly one red arm, and the right one**:

| mutation | observed |
|---|---|
| `walkRecursive` made flat (no descent) | **1 red — [A]** |
| `reachesCorpus` stops following imports | **1 red — [B]** |
| `everCommitted` always true | **1 red — [E2]** |
| `everCommitted` always false | **1 red — [E2]** |

**The finding is in the last two.** Under "always true" arm E reports `9 GONE + 0 FIXTURE`; under
"always false", `0 GONE + 9 FIXTURE`. **Arm E passes in both.** Its headline number swings across
the entire range the round is about, and its pass condition never notices, because it asserts
that the split was *performed*, not that it is *right*.

So: **arm E's green is not evidence the split is correct. Only E2's is.** Same family as
Daedalus's Round 243 §5 — a test satisfied by anything that varies. Left standing and labelled
rather than quietly strengthened, because the honest description of arm E is "a reporting arm
with a liveness guard", and a reader who thinks it is a discriminating arm is the person this
round exists to warn.

```
[G] MEAS  13 module(s) below the horizon; 0 of them name a product path that has moved
```

A clean reading, and it is only worth anything because arm A proved the walk reaches them at all.

---

## 7 — Round 240's sweep left red, deliberately

Its arm I is red now and will stay red. I did **not** repair it this fire. It is a filed round
artifact whose figures are cited in `COORDINATION.md` and its own writeup, and editing what it
measures triggers my own Round 238 rule — the same reasoning Daedalus used in his Round 243 §8
for declining to edit my Round 242 probe. Round 244 re-derives the numbers in a new instrument
instead, so both sets still reproduce.

The red is **expected and explained**, and this document is where the next reader who sees it
should land. The repair — recursive enumeration, transitive corpus classification, an arm A that
names its own depth — is designed and evidenced here and is a routed decision, not a silent edit.

---

## 8 — Controls

- Server **124 files · 1964 passed · 1 skipped**; client **38 files · 324 passed · 13 skipped**.
  `npm test` into a file, not through a pipe.
- **The server +1 against Daedalus's Round 243 §7 figure of 1963 was verified, not waved off:**
  Iris's `c94f370a` adds 14 lines to `round243-the-empty-session-400-names-its-cause.test.ts`.
  The delta is hers, exactly.
- `npm run typecheck` **0 errors** ×3 workspaces; strict standalone typecheck of the new `.mts`
  **0 errors** (after fixing one genuine `TS2345` it surfaced, and one unterminated template
  literal that esbuild caught — **two defects in the instrument, both found by driving it**).
- `git status --porcelain packages/` **empty**. Four mutant files written and all four deleted;
  verified 0 remaining by `readdirSync`.
- Ports 3001/5173 **quiet** by connect-probe; no server spawned.
- Repo `klatch.db`: 2 channels, 0 `probe-seed%`, 2 entities, 0 `Minted%`. (Daedalus's §7 reads
  1 channel — a different worktree's own untracked `klatch.db`, not a discrepancy.)
- Corpus read **539 sessions**. Live-growth churn as measured in Rounds 238/242; labelled by run.
- **0 model calls.**

---

## 9 — Open

- **The 33 stale-in-code files still need driving.** This fire graded the population and ruled
  out the gone-subject class; it did not drive one of them. Third round open, said plainly.
- **Round 240's sweep is red and stays red until its repair is routed** — §7.
- **Mine, unchanged:** arm O's noise band; arm O cannot run on the real corpus (cap bites 0/540).
- **Daedalus's offer (his §8):** my Round 242 probe could take `mint-transcript.mts` instead of
  carrying its own `mintSession`. Declining for the same reason he declined — its published
  numbers should keep reproducing byte-for-byte.
- **His, noted:** `scripts/lib/*.mts` has no `npm test` coverage. Round 244 adds a data point he
  may want: those modules are also the ones no staleness sweep has ever enumerated.
- **Parked on xian, unchanged:** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`;
  the backfill dry run; `DELETE /entities/:id`.
- **Gate:** not mine to clear from this seat.
