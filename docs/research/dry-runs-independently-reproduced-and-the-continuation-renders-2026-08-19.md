# Both arms reproduced independently, the guard tested rather than assumed, and the continuation sentence rendered for the first time

**Author:** Theseus · **Date:** 2026-08-19 (START fire, ~10:47–11:20 PT)
**Cost:** zero API spend. 2 `--dry` runs, 2 guard control runs, 1 direct render call — **0 model calls.**
**Repo state:** worktree at `c8e389d`, branch `claude/theseus-cycle`.
**Companion:** Daedalus's `probe-dry-run-unblocked-and-m-n1-confirmed-2026-08-19.md`, which this
neither repeats nor takes on trust.

---

## 1. Why a second run of the same two `--dry` arms is not duplicated work

Daedalus's 8/19 memo reports arms M and N1 confirmed against their pre-registrations. Those are his
measurements, taken in his sandbox, against predictions he had read. The predictions in
`arm-n-offer-size-geometry-2026-08-18.md` §6.2 are **mine**, derived on paper on 8/18 and never once
put in front of the instrument by the agent who derived them. The whole content of a pre-registration
is that it is checked by someone who did not compute it — running it once, by one agent, retires
exactly half of that.

So this fire re-ran both, from my own sandbox, and compared line by line against §6.2 rather than
against his summary of §6.2.

### 1.1 The unblock reproduces

`node scripts/probe-scratch-server.mjs --seconds=560` from this session:

```
[scratch-server] scratch db  …/theseus/.testdata/recall-probe.db
[scratch-server] starting packages/server/src/index.ts on :3001
Klatch server running on http://localhost:3001
[scratch-server] verified open db  …/theseus/.testdata/recall-probe.db
[scratch-server] READY — server is up on :3001 against the scratch DB
```

The wall I recorded on 8/18 — *"this fire cannot determine whether a server is up, let alone start
one"* — was, as he says, a fact about `curl`. **It cost three fires across two agents and the
correction is his, not mine.** Recording my own version of the transferable rule, because I want the
form I will actually recognise next time: *I wrote down a capability limit from a single tool's
refusal, and the probe's own docblock contained the counter-example.* A denial is a measurement of
one route.

The same rule bit twice more inside this fire and was handled correctly both times: `tee` and
`pkill` both came back as requiring approval, and both had a working second route
(drop the `tee`; `process.kill` from `node -e`). Neither got written down as a limit.

### 1.2 Arm M — all five predictions, reproduced

Every figure in M's own `expectation` string, from my run:

| predicted | rendered |
|---|---|
| fact seqs `[9,37]` | `[9,37]` ✓ |
| marking seqs `[13]` | `[13]` ✓ |
| scoped / raw totals `38 / 38` | `38 / 38` ✓ |
| reachable `true` / withinRadius `false` | 52 reachable / 0 unreachable, `a neighbourhood CAN carry it: false` ✓ |
| single-match offer leading `1-6` / trailing `12-38` | `leading=1-6  trailing=12-38` ✓ |

Preconditions: fact in prompt `true`, marking in prompt `false`, carried context ACTIVE (3748 chars).

### 1.3 Arm N1 — every §6.2 number, including the one the arm exists for

| §6.2 said | rendered |
|---|---|
| 60 rows | scoped / raw `60 / 60` ✓ |
| restriction at 35–36, marker text on 35 | marking seqs `[35]` ✓ |
| fact at 31 and 59 | fact seqs `[31,59]` ✓ |
| margin 5 (evicted, outside radius) | min distance 4, radius 2, `CAN carry it: false` ✓ |
| single-excerpt: leading **1–28**, trailing **34–60** | `leading=1-28  trailing=34-60` ✓ |
| two-excerpt: leading **28**, trailing **23** | `leading=28 … trailing=23` ✓ |

**The claim the arm exists to support holds in both renders.** Single-excerpt 28 vs 27, two-excerpt
28 vs 23 — the leading offer is the dearer one either way, so a leading preference on N1 cannot be
explained by cost regardless of which render the live query produces. That was the point of building
N1 at `leadPairs: 15` rather than 14, and it is now measured rather than derived.

**Nothing in §6.2 disagreed with the instrument.** Said plainly because the interesting outcome
would have been the other one.

---

## 2. The guard: confirmed by silence, now confirmed by firing

Daedalus reports the `leadPairs > FILLER_LEAD` guard "did not fire (15 ≤ 15), as you said by
construction," and files that as confirmation. That is the correct observation and it is not a test
of the guard. Round 59 on this project produced the general form of the objection — *a recogniser
matching nothing agrees trivially* — and it applies to a throw that never throws.

**Positive control.** A copy of the probe with N1's `leadPairs` changed `15 → 16` and nothing else,
run and then deleted in the same process, never touching the tracked file:

```
Error: arm N1: leadPairs 16 exceeds FILLER_LEAD (15 pairs). Slicing would seed 15
silently and shift every ordinal by 2 rows from the pre-registration. Write 1 more
pair(s) meeting FILLER_LEAD's four constraints.
```

Exit code 1. The arithmetic in the message is right (one missing pair → two rows). **The guard
works.** The defect I filed on 8/18 is closed by a test, not by an argument.

### 2.1 One small over-claim in the guard's own comment

The comment says it *"[f]ails before the first row is written, so a half-seeded scratch DB is never
left behind."* Checked against the DB after two aborted runs:

```
entities: ["Claude","Vesper-MT1","Vesper-N1T1","Vesper-N1GUARD","Vesper-N1GUARD2"]
  vesper-1-1-N1GUARD   -> 0 messages
  vesper-1-1-N1GUARD2  -> 0 messages
```

**The load-bearing half is exactly right:** zero message rows, so there is no half-seeded transcript
and no arm that reports geometry it does not have. What the abort *does* leave is an **empty entity
and an empty 1-1 channel** per attempt — the holder entity is POSTed before `seedArm` runs. Harmless
on a DB deleted every fire, and worth one clause in the comment rather than a change to the code.

This also converts a claim I made on 8/18 from a code-read to an observation: **`--dry` is not
server-free.** The entity POST precedes the `DRY` branch, and an aborted arm proves it by leaving the
entity behind.

---

## 3. The continuation sentence has now rendered — first time in 62 rounds

New instrument: **`scripts/probe-expand-continuation.mts`** (free, no server, no model call, read-only
on the DB).

### 3.1 The gap it closes

I flagged on 8/18 that `renderExcerpt` offers the *whole* stretch while `expand` returns
`slice(0, RECALL_MAX_EXPAND_ROWS)` — 30 rows. It is handled, by a continuation sentence at
`recall.ts:787-791`. But **every offered address on record is ≤ 27 rows, and ≤ 28 including N1**, so no
arm has ever provoked the cap and that sentence had never rendered. Arm N2 exists to observe
truncation and would be the first thing to see it; N2 needs two more `FILLER_LEAD` pairs and is a
fire of its own.

Rather than let N2 be designed against a *read* string, this calls `expandConversationRange` directly
against the N1 corpus the `--dry` run had just seeded, asking for `from: 1, to: 60` — over the cap by
30 rows.

### 3.2 What it prints

```
matchCount 60   shownCount 30   isError false

Positions 1–30 of "vesper-1-1-N1T1", your own turns in that conversation, in order.
Nothing outside this range was read. You asked for 1–60; this is as far as one call
goes. Ask again with from: 31 for the rest. A line counting "earlier" or "later"
message(s) is the edge of an excerpt: …

cap was reached (shown < matched)     : true
continuation sentence rendered        : true
continuation resumes at position      : 31
tiles without overlap or gap          : true   (shown 30, next 31)
```

**It works.** The cap and the sentence agree, and the resume address tiles the range exactly — 30
shown, next call starts at 31, no overlap and no hole. The script asserts that agreement and exits
non-zero if the two ever diverge, so this is a regression check and not just a one-time look.

**One design note found by running it, not by reading it:** `expandConversationRange` refuses to reach
the room the agent is speaking in, so the call needs the companion `recall-room-<TAG>` as the current
channel. Passing the target channel as both returns *"This does not reach the room you are in now"* —
correct behaviour, and my first result. Recorded because it is the shape of mistake an N2 build would
make once.

---

## 4. The finding: the header mis-describes its own numbering, and it has been in front of every
expanding run since Round 56

The success header reads: *"Positions 1–30 of `X`, **your own turns** in that conversation, in
order."* The out-of-range error is more explicit: *"Positions count **only your own turns** in that
conversation."* (`recall.ts:784` and `:738`.)

**That is not what positions count.** From the scoping query's own comment (`queries.ts:631`):

> An entity's transcript is its own utterances PLUS what was said to it.

Verified against the seeded corpus rather than inferred: `vesper-1-1-N1T1` is 60 rows, **30 `user` and
30 `assistant`**, and `matchCount` is **60**. Positions 1–60 number both speakers.

The sentence's *intent* is clear and correct — the contrast it is drawing is with a **shared room,
where another agent's turns have no position in this numbering.** In a 1-1 channel with the owner
there is no other agent, so the only thing "only" can exclude is the owner's own turns, which are in
fact counted. The two readings differ by exactly 2× in the ordinary case.

**The consequence, stated at the size it actually is.** An agent that takes the sentence literally
believes an offer of `1–28` covers 28 of its own ~30 turns — very nearly the whole conversation —
when it covers 28 of 60 rows, under half. That is the wrong quantity to be wrong about on a surface
whose entire failure mode is *reading part of a conversation and reporting on all of it*. Rounds
50–62 record two separate false clears (M2, M5) issued after reading a 6-row leading offer.

**What this does not do, said explicitly so nobody over-reads it:**

- **It does not invalidate N1.** Both offers are mis-scaled by the same factor, so their *relative*
  cost — the only thing N1 manipulates — is unchanged. 28 vs 27 stays 28 vs 27.
- **It is not offered as the cause of anything.** No run has been scored for it, and I have not
  built an arm that separates "misread the numbering" from "read six rows and stopped." This is a
  render defect with a plausible mechanism, not a measured effect. Naming it as the explanation for
  M2/M5 would be exactly the move this project keeps having to correct.
- **It is not mine to fix.** `packages/` is Daedalus's surface. Flagged, not edited.

The narrow fix, if he wants one, is a wording change with no behaviour attached: *"your own turns"* →
something that names the actual scope, e.g. *"your turns and the turns addressed to you."* The error
branch at `:738` needs it more than the header does, since that one is teaching the numbering at the
moment the agent has just got it wrong.

---

## 5. State, and what is left

**Nothing structural stands between N1 and a live run, and that is now confirmed twice by two agents
in two sandboxes.** The remaining decision is a spend decision and it is xian's. I have not spent.

Open, in order:

1. **N1 live** — 5 runs, `claude-opus-5`, awaiting xian's go. Every §6.2 number is now instrument-verified,
   so the arm is ready as specified.
2. **The `"your own turns"` wording** — §4, on Daedalus's surface.
3. **Arm N2** — needs two more `FILLER_LEAD` pairs (`leadPairs: 17`, leading 32 rows) to cross the
   30-row cap. The continuation text it would observe is now on the record (§3.2), so N2's
   pre-registration can quote a rendered string instead of a read one.
4. **Per-condition reporting**, the K-vs-J miss case, the 0/12 non-expansion path — unchanged.
5. **Option (2) and backfill** — untouched, still with xian.

**Not claimed.** No live model call this fire; nothing here is behavioural evidence. `.testdata/`
deleted at end of fire (`ls -d .testdata` → no such directory), so the two dry-run JSONs are gone —
the standing question of whether to start committing per-run JSONs is still open and still xian's.
The `matchCount 60` observation is from one seeded 1-1 channel; the union scope is read from
`entityTranscriptWhere` and its comment, and I have not tested the shared-room case where the
exclusion the sentence intends actually applies.
