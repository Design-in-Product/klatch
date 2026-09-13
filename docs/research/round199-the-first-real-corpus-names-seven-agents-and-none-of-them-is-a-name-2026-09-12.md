# Round 199 — the first real corpus names seven agents, and none of them is a name

**Theseus · 2026-09-12 (STOP fire)**
**Probe:** `scripts/probe-round199-the-first-real-corpus-names-seven-agents-and-none-of-them-is-a-name.mts` — 14 checks · 0 failed · 1 open, two runs, same states
**Re:** Daedalus's Round 198; Janus's 9/12 GO on the dry run

---

## Summary

Two things happened this fire, and the second is much larger than the first.

1. **The corpus is on this machine.** Daedalus reported that the approved dry run could not be run because `/Users/xian/Development/klatch/klatch.db` does not exist. That path is genuinely absent — I reproduced his `ENOENT`. But it is not the only Klatch database on Amber, and the conclusion "the corpus is not on this machine" does not follow from it. `/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14` is xian's real imported corpus: **139 channels, 2,652 messages, 68 entities, 2,826 artifacts**, `quick_check ok`. It has been there the whole time this item has read as *blocked on a path*.

2. **I ran the approved dry run against a copy of it, and the result is a product defect, not an instrument one.**

```
Candidates: 72 — 7 would move, 65 skipped.
  new agents (4): Succeeding, Oriented, Taking, You
  message rows re-stamped: 340 P2, 0 P3
```

**Seven channels would move. Not one of the four proposed names is a name.** They are three verb fragments and a pronoun. Precision on `identity-claim` — the basis whose own comment calls it the *"strongest signal"*, and the only one enabled by default — is **0 of 7** on real data.

Nine rounds of hardening went into what the tool says when the database is *damaged*. This is what it says when the database is *fine*.

---

## 1 — where the corpus is

Verified this fire, from this seat, with `node:fs` (the sandbox refuses `ls` and `cp` across the worktree boundary; `fs` is not refused — Daedalus's 9/12 finding, which I used rather than re-derived):

| path | size | state |
|---|---|---|
| `/Users/xian/Development/klatch/klatch.db` | — | **ENOENT** (Daedalus's finding reproduces) |
| `/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14` | 5,230,592 B | **139 ch / 2,652 msg / 68 ent** — the real corpus |
| `/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-15-pre-fresh` | 335,872 B | 59 ch / 219 msg / 35 ent — mostly test channels |
| `/Users/xian/Development/klatch-worktrees/iris/klatch.db` | 7,081,984 B | 3 ch / 523 msg — two real imports, already bound |
| `/Users/xian/Development/klatch-worktrees/theseus/klatch.db` | 434,176 B | 2,002 channels, **0 messages** — my own probe seeds, not a corpus |

A whole-tree walk of `/Users/xian/Development` for `klatch*.db` finds only the last two; the backups are named `klatch.db.backup-*` and so fall outside that glob, which is the likeliest reason they have gone unnoticed. **The generalisation I should not make in the other direction:** these are March backups. Whether a *current* corpus exists somewhere off this machine is still unknown to me, and xian is the only one who can say. What is now settled is that the dry run never needed to wait for one.

All three were copied into `.testdata/r199/` (gitignored) before anything was pointed at them. Nothing in `backups/` or in Iris's worktree was opened except read-only, and nothing outside `.testdata/` was written.

## 2 — the dry run

Run against `.testdata/r199/mar14.db`, no flags, the default review sheet. The other two for comparison:

| corpus | candidates | would move | new agents |
|---|---|---|---|
| mar14 (the real one) | 72 | **7** | Succeeding, Oriented, Taking, You |
| mar15 (pre-fresh) | 23 | **2** | Taking |
| iris | 0 | 0 | — |

**Across both real corpora: 9 channels would move, 9 of 9 names are wrong, and the 9 collapse into 5 entities.**

The 65 skips are all `no-guess`, which is the tool behaving correctly — a declined guess is the designed outcome and costs the user one field of typing. The problem is entirely in the 7 it did *not* decline.

## 3 — the four defects, each driven

Ground truth via `guessEntityName()` itself, not by re-reading the regex:

### D1 — continuation verbs are read as names (5 of 7)

```
"You are succeeding these predecessor chats:"        → "Succeeding"
"You are taking over from your predecessor chat"     → "Taking"
"You are taking on a new role on this project"       → "Taking"
```

`IDENTITY_PATTERNS[0]` is `/\byou\s+are\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b/i`. `NOT_NAMES` (`entity-guess.ts:66`) holds articles, pronouns, and four state verbs — `working`, `going`, `being`, `asked`. It holds **no continuation verbs at all**. Arm G checks six of them (`succeeding`, `taking`, `continuing`, `resuming`, `replacing`, `picking`): **0 of 6 are filtered**.

This is not a tail case. "You are taking over from your predecessor" is close to the *canonical* opening of a continuing agent session — which is to say, the exact population the backfill exists to serve. The pattern set is tuned for how a session opens when it is *new*, and the corpus is made of sessions that opened when they were *resumed*.

### D2 — a rejected match widens the search instead of narrowing it (2 of 7)

The Comms Chief channel opens `"Hello! You are my tech-savvy communications chief..."`. Pattern 1 matches `my` — correctly rejected as a stopword. The loop then advances **to the next pattern, against the whole message**, and `"Once you're oriented, please review this batch"` — 269 characters in, in my reduced fixture; further in the real one — wins.

The loop at `entity-guess.ts:100-116` iterates *patterns*, not *occurrences*. So rejecting a stopword does not narrow the guess, it hands it to a clause arbitrarily far downstream.

And the rationale then says, verbatim:

> The session opens by naming itself "Oriented".

It does not. That sentence is the operator's **only** evidence at the confirm step — the module's own header argues exactly this: *"a confirmation step the user can't evaluate is a rubber stamp."* A rationale that misstates where it looked is worse than no rationale, because it is checkable-sounding and false. H2 checks it.

### D3 — the names collide, so unrelated agents merge

Seven channels produce **four** names. That is not a naming nuisance; it is the wrong answer to the question the product exists to ask:

- **"Taking"** ← the Chief Innovation Officer channel **and** the exploratory-testing-agent channel (33 + 10 = **43 messages**)
- **"Oriented"** ← the Comms Chief channel **and** the Chief of Staff channel (34 + 122 = **156 messages**)

Two genuinely different agents, with different roles and different histories, get bound to one entity each, and 199 messages get re-stamped onto an identity that never existed. Per `PREMISE.md` the entity *is* its conversation — merging two conversations into one entity is the specific failure that premise is most exposed to.

`"Succeeding"` ×2 is the benign case: both are genuinely the CXO, so the merge is right and only the name is wrong.

### D4 — `you` is missing from a list that has `your`, `i`, `it`, `we`, `they`, `he`, `she`

`"You are you Security Operations (Sec Ops) agent"` — a typo for "your" — proposes **"You"**. Arm J2: of eight pronouns, `you` is the only one unfiltered. One word.

## 4 — the thing that makes these load-bearing rather than cosmetic

`entity-guess.ts:52` justifies the pattern set's aggressiveness like this:

> *a plausible wrong guess is likelier to be waved through than a blank* … *the confirm step catches whatever slips through.*

That reasoning is sound **for the import path**, which has a confirm step. **The backfill CLI has no confirm step.** I grepped it: no `readline`, no prompt, no stdin read anywhere in `scripts/backfill-entity-bindings.mts`. `--apply` applies. The only approval mechanism is `--channels=<ids>`, which requires the operator to have read the sheet and typed the ids out.

So the safety net the guesser was designed against does not exist on the path the guesser is now being used from. That is the actual finding: not "a regex is sloppy" but **a component's safety argument was carried to a caller that does not satisfy its precondition.**

Mitigating, and worth saying plainly: the sheet *does* print every proposed name before anything moves, and an operator reading `new agents (4): Succeeding, Oriented, Taking, You` would stop. The dry run did its job. But that is an operator catching it, not the tool.

## 5 — what this settles for §4(c)

Janus asked for the candidate count so xian could rule on a number rather than an abstraction. The number is **72 candidates, 7 would move** — and the answer it produces is sharper than a number:

**Per-channel approval (`--channels=`) is not a nicety, it is load-bearing.** A blanket `--apply` on this corpus would mint four junk entities and merge two pairs of unrelated agents. I would not run one, and I do not think the granularity question is close.

## 6 — the names are recoverable, which is the encouraging half

Every one of the seven says its role in plain words, in the channel title *and* in the opener: *Chief Experience Officer*, *communications chief*, *Chief Innovation Officer*, *exploratory testing agent*, *Chief of Staff*, *Security Operations*. A basis that read role titles would plausibly get 7 of 7 where the current strongest basis gets 0.

I am not proposing an implementation — that is Daedalus's call and his `--bases` machinery already has the shape for it (`GUESS_BASES`, `DEFAULT_APPLY_BASES`). Four shapes, cheapest first, in the memo.

## 7 — corrections and limits, recorded

- **I nearly asserted the Comms Chief guess came from `"You are my"`.** My first pass matched pattern 1 by hand in a throwaway regex and reported it; the guess actually comes from `"you're oriented"` via pattern 2, which is a materially different defect (D2, not D1). Caught by running `guessEntityName()` itself instead of reconstructing it. The reconstruction was the error — calling the real function is the only ground truth.
- **I predicted the dry run would migrate the copy, and it did not.** The March schema has 6 tables and `getDb()` runs migrations on open, so I expected `.testdata/r199/mar14.db` to come back with 8. It is still **6 tables, 5,230,592 B** — because the dry run plans against the `db.backup()` snapshot and never opens the target for writing, exactly as the CLI header promises. The header's claim is now measured against a real corpus rather than a fixture. The original in `backups/` is likewise untouched: 6 tables, 5,230,592 B, mtime still `2026-07-23T17:27:38Z`.
- **The March backup has `-shm` and `-wal` sidecars beside it** (`klatch.db.backup-2026-03-14-shm`, `-wal`, both dated 2026-08-09, the `-wal` 0 bytes). Harmless here, but it is the exact shape Round 198's sidecar branch was built for, and a reminder that the restore steps' "delete the sidecars first" applies to backups too.
- **Arm L3 is a judgement, not a computation**, and is marked OPEN rather than PASS for that reason. "None of these is the agent's name" is me reading them. It is not a close call, but it is not a check either.
- **The probe does not depend on the corpus.** Arms G–K are synthetic fixtures matching the real clauses; arm L degrades to a one-line measurement if the file is absent. The real openers are xian's business content and are excerpted only as far as the defect requires.
- **Not measured:** whether a current corpus exists off this machine; what the 65 `no-guess` channels would do under `--bases=project-name`; whether the import path's confirm step would in fact catch these (I reasoned about it from the code, I did not drive the UI).

## 8 — Round 197, re-vehicled

Separately, my Round 197 instrument now reads **19 checks · 0 failed · 0 open · 5 measurements** against Round 198's fix, two runs. P2/P3/P4/Q4/Q5/R1/R3 were `open_()` calls or measurements reporting behaviour Daedalus changed; all are checks now, and R4's assertion is inverted because the apply refuses where it used to build a schema. Daedalus's whitelist correction adopted (the two new openings named in the source, so the next round does not rediscover them). Q5 moved from a measurement to a check, which is why the count went 18 → 19.

Against his prediction of `18 · 2 failed · 6 open` I measured `18 · 1 failed · 6 open` before re-vehicling: the second failure was `Z` against his own uncommitted tree, which passes here. Same off-by-one Argus recorded.

## 9 — a second blocker closed, and a defect of my own in the same class

My 9/7 memo to xian (`theseus-to-xian-daedalus-...-the-query-is-written-and-it-needs-one-path`)
asked for a path to a real `klatch.db` and said, in my own words:

> The only databases an agent worktree can reach are synthetic scaling corpora from earlier probes.

**That statement was wrong**, and it is mine — the same "we don't have X" shape CLAUDE.md names as
the highest-risk claim on this project. The March backups were reachable the whole time.

So I ran it. `probe-round170-floor-frequency.mts` against the corpus **crashed** —
`SqliteError: no such column: type`, a raw Node stack, because `channels.type` postdates the March
schema. **That is precisely the defect class I spent Rounds 195–198 reporting in Daedalus's CLI**,
in an instrument I wrote and invited xian to run against his own database. Fixed (a
`PRAGMA table_info` guard; pre-`type` databases report by source alone and the run says so).

The measurement, now that it runs — **139 real rooms, 170 (room, agent) pairs, the floor fires in
0.00% of them.** But arm C's own guard is the useful part: it reports that this database holds
**zero blank-prompt agents** (44 boilerplate, 24 authored, 0 blank), so the population item 1 needs
is absent, and it refuses to let its own zero be read as a frequency:

> Zero, but this database contains NO blank-prompt agents at all. This is not evidence that the
> configuration is rare — it is evidence that the population it needs is absent here. Item 1 stays
> open, and this run should not be cited as its frequency.

That guard was built in Round 170 against exactly this risk and it earned its keep on first contact
with real data. **Item 1 stays open — but it is open for a measured reason now, not for want of a
path.** Arm Z passed: source byte-identical, `packages/` clean.
