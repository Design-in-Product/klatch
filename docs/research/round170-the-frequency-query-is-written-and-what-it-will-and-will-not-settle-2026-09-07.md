# Round 170 — the frequency query is written, and what it will and will not settle

**Theseus**, 2026-09-07 STOP fire
**Instrument:** `scripts/probe-round170-floor-frequency.mts`
**Status:** built and verified against a planted fixture; **not yet run against real data**
**Blocks on:** one path from xian

---

## Why this exists

Round 169 closed the layer-7 floor-report work. Daedalus single-sourced the report text into
`FLOOR_REPORT` (`packages/server/src/claude/client.ts:497`), converted all three call sites, and
pinned the verdict-token-is-contract ruling in
`packages/server/src/__tests__/round168-floor-report-single-source.test.ts`. **Verified this
session**, not taken on report: all three sites read the constant (`channels.ts:116`,
`aaxt.ts:91`, `aaxt.ts:184`), no local string literals remain, and the test file exists.

What did not close is item 1 — layer 6's klatch-only scope, which leaves a blank-prompt agent in
a native 1:1 with nothing but the 28-byte floor. Three rounds have now argued it. His Round 169
memo says exactly why, and I agree with the diagnosis:

> we've now spent three rounds circling a question one query would settle

He named the query and asked me to write it. This is that, plus an account of what it can and
cannot decide — because a frequency instrument that returns zero for the wrong reason is worse
than no instrument, and this one has two ways to do that.

## The question, made precise

> how often a blank-prompt imported agent actually ends up in a fresh native 1:1

Translated into the assembly, a room is in the counted population when every layer declines:

| layer | condition to contribute nothing | source |
|---|---|---|
| 1 kit briefing | `channel.source` is `native` | `client.ts:509` |
| 2/3 project | no project, or blank instructions/memory | `client.ts:514,523` |
| 3b/4b files | no channel or project files | `client.ts:531,547` |
| 4 channel prompt | blank, **or** exactly the boilerplate | `client.ts:544` + `isDefaultChannelPreamble` |
| 5 entity prompt | blank — and layer 5 is terminal | `client.ts:559` |
| 6 carried context | `channel.type !== 'klatch'` | `carried-context.ts:304` |

Layer 6's line is the whole of the scope question: **`if (channel?.type !== 'klatch') return
undefined;`** — read this session, not recalled. A `chat` room never carries. That is Round
40/41's decision working as designed; item 1 asks whether the room it leaves behind is one
people are actually in.

## The instrument does not reimplement any of that

Every room is run through the shipped `assembleSystemPrompt`, and the number reported is its own
`floorApplied` flag. The six lines that gather its inputs mirror the prompt-debug route
(`routes/channels.ts:40-66`) and are cited there.

Mirroring a route is still a copy, so arm D does not trust it: a sample from every cell of the
cross-tab is re-driven through the real HTTP `/prompt-debug` endpoint against the same data, and
a disagreement is a regression. That is the source-compared-versus-endpoint-verified line I held
Daedalus to in Round 168, turned on my own work. **40/40 agreement** on the self-test corpus,
**6/6** on the fixture.

## Pointing it at a live database is safe, and the safety is asserted rather than claimed

`getDb()` (`db/index.ts:30-38`) runs `initSchema()` and `runMigrations()` on first open and sets
`journal_mode = WAL`. All three write. So the real database is never handed to server code:

1. opened `{ readonly: true, fileMustExist: true }`;
2. snapshotted with the SQLite **backup API** rather than `cp` — consistent across an open WAL,
   which matters because a `klatch.db` in use has `-wal` and `-shm` sidecars (both present next
   to the worktree copy, observed this run);
3. source closed, and its size and mtime re-checked at exit. Any movement fails arm Z and exits 1;
4. `KLATCH_DB` pointed at the **snapshot**, and only then are the server modules imported.

Arm D adds two more guards, because it has to use port 3001 — `packages/server/src/index.ts:47`
hardcodes `const port = 3001` and does not read `process.env.PORT`. It **refuses to reuse a
server it did not start**, and after starting one it checks the channel count matches the
snapshot before comparing anything. Querying a dev server already on 3001 would answer from a
different database and read as agreement, which is the worst failure available here.

## The two ways it could return a wrong zero, and what was done about each

**1. A stuck code path.** `--self-test` runs against the worktree corpus and prints zero — but
that corpus has **no blank-prompt agents at all** (arm A: 0 blank, 1 boilerplate, 1 authored
over 2002 rooms). A zero printed by a path never shown capable of printing anything else is not
a measurement. If arm C were simply broken, a real database would also print zero and item 1
would close on a stuck instrument.

So `--fixture` plants a database whose answer is known, using the real writers, and asserts it
comes back. Planted: a blank-prompt agent (`''`, what `import/entity-resolve.ts:93` mints) in a
fresh native chat and in a used one; the boilerplate-as-identity agent (what
`routes/entities.ts:87` substitutes) in a third; an authored agent in a fourth; and **the same
blank agent in an imported room**, which layer 1 rescues. Result — all green:

```
floored native 1:1 chats            2
  of which fresh (0 messages)       1
  of which have been talked in      1
✓ [C] the pair: both assemble 28 bytes, only one is counted
✓ [C] the imported room with the same blank agent is not floored (layer 1 assembled)
```

That fourth line is the load-bearing one. Round 168's pair assembles **byte-identical
28-character output** on both sides and must land on opposite sides of this count. Any
implementation deriving the floor from the output string passes every ordinary room and gets the
pair backwards. The fixture asserts the lengths are equal *and* that only one is counted, so if
the fixture ever stops testing that, it says so rather than going quietly green.

**2. An empty population.** If a real database has no blank-prompt agents either, zero is a fact
about the population rather than about the configuration. Arm C distinguishes the two cases in
its own output and refuses to be quoted as a frequency in the second.

The probe also **refuses to run against an unnamed database** (exit 2). It has no default,
deliberately: the only databases reachable from an agent worktree are synthetic scaling corpora,
and a frequency measured over one of those would look like an answer. That is precisely the
confusion the worktree `klatch.db` produced in Round 168.

## Fresh versus used — a distinction the original question did not draw

Daedalus asked about *fresh* native 1:1s. The instrument reports fresh and used separately,
because the used ones are the stronger evidence and the question as posed would have missed
them. A floored room with zero messages may have been created and abandoned. A floored room
**with messages in it** is a conversation a person actually had on top of a 28-character system
prompt. If the real database has any of the second kind, that settles item 1 more firmly than
any count of the first kind would.

The fixture demonstrates both are detected and separated.

## What is still open, and where the boundary is

**The measurement itself.** The instrument is finished and verified; it has not been pointed at
real data. `/Users/xian/Development/klatch` is outside this worktree's sandbox — re-checked this
session, not recalled: `ls /Users/xian/Development/klatch/klatch.db` is refused by the tool
layer, which is a sandbox boundary rather than a network one (this fire has full network). So
this cannot be run by me from here, under any framing.

The ask to xian is one path:

```
npx tsx scripts/probe-round170-floor-frequency.mts /path/to/your/klatch.db
```

Read-only, no model spend, and it prints its own provenance so the output can be pasted back
without a covering explanation.

**Which outcome means what**, stated in advance so the reading is not chosen after seeing the
number:

- **zero floored rooms, over a non-empty blank-prompt population** → item 1 closes as a
  documented asymmetry. Layer 6's scope stands on evidence rather than on Round 40's argument.
- **floored rooms, all fresh** → reached but not used. Weaker than "routinely," stronger than
  "never." Item 1 stays open and unscheduled.
- **floored rooms with history** → real conversations running on the floor. Item 1 becomes a
  scheduled round with a measured justification.
- **zero blank-prompt agents at all** → the run measures nothing about item 1, and the probe
  says so itself rather than letting the zero be read as an answer.

**What remains true regardless.** Round 168's arm J stands and Daedalus withdrew the contrary
claim in Round 169: the configuration is reachable in three clicks through the picker's primary
tier, using an optional field the form says is fine to leave blank. Frequency is the open
question; reachability is not.

---

## Files

- `scripts/probe-round170-floor-frequency.mts` — the instrument
- verified this fire: `--fixture` all arms green (planted answer recovered, pair discriminated,
  6/6 endpoint agreement); `--self-test` 40/40 endpoint agreement, arm C correctly declines to
  report a frequency over a corpus with no blank-prompt agents

No file under `packages/` touched — asserted by arm Z at exit, not assumed.
