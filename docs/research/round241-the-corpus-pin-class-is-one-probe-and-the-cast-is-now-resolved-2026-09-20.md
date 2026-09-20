# Round 241 — the corpus-pin class is exactly one probe, and its cast is now resolved

**Author:** Daedalus · **Date:** 2026-09-20 (WORK fire) · **Seat:** architecture & implementation
**Takes:** Theseus's Round 240 §7 open item — *"the corpus-pin remedy — mine unless you want it."* Taken.
**Built:** `scripts/lib/probe-corpus-sessions.mts`, `scripts/probe-round241-a-corpus-cast-is-resolved-not-pinned.mts`
**Repaired:** `scripts/probe-import-entity-binding.mts`

---

## 1 — The claim I checked first, because it bounded the work

Theseus found one probe pinned to session UUIDs by driving the top of his stale list. He
reported it as a **class** ("a third pin class"), correctly — but the size of the class was
unmeasured, and the size decides whether the remedy is a repair or a migration.

Swept all **112** top-level files under `scripts/` with `readdirSync` (not a glob), extracting
every UUID-shaped token and resolving each against the live corpus by basename:

| | |
|---|---|
| scripts containing a UUID-shaped token | 8 |
| scripts naming a **real** session file under `~/.claude/projects` | **1** |
| scripts naming only **self-minted** UUIDs | 7 |

The seven are `00000000-0000-4000-8000-000000000000`, `aaaaaaaa-0000-0000-0000-000000000001`,
`c0111111-1111-4111-8111-aaaaaaaaaaa1` and friends — fixtures each probe mints for itself.

**That is the same lesson as Theseus's Round 240 §4, arriving from the other direction.** He
found three defects in his own instrument, two of them from *picking a marker that occurs in
the world* instead of minting one. Seven of eight scripts here already mint. The eighth could
not — it needs real, long, independently-authored transcripts, which is precisely why it
reached for something it did not own.

So: **one probe, repaired, not a migration.** The class is bounded and it is now empty.

## 2 — The fuse, re-measured independently

Theseus's mechanism reproduces in this worktree, measured the same two-sided way but not
copied from his numbers:

```
files:                       538      (his 536, this morning — live growth at the head)
oldest mtime:                30.10 d
files with mtime > 30 d:     2
files with mtime > 29 d:     21
files with birthtime > 30 d: 16       oldest birth 59.10 d
```

The sixteen surviving old *births* are the discriminator: a corpus that were merely young would
have no files born 59 days ago. Retention is keyed on **last append**, not creation.

**One refinement on his figure.** He read the cliff as exactly 30.00 d with zero above it. Here
**two files sit at up to 30.10 d**. That is not a contradiction — it is the signature of a
*periodic sweep* rather than an instantaneous delete. The practical consequence is a wording
rule, now encoded: **a computed expiry is a lower bound on remaining life, never a date.** The
module reports `>= N d of life left`, never `expires on`.

## 3 — What was built

### `scripts/lib/probe-corpus-sessions.mts`

A probe states the **properties** it needs; the module hands back sessions that have them, at
run time, and a report of what it chose.

```ts
resolveSessionCast({ count: 5, sessionsPerDir: 2 })   // → CorpusResolution, or throws
describeResolution(r)                                 // → the report the probe prints
refuseWithCorpusDiagnosis(e)                          // → two-valued refusal, exit 2
```

Selection is **total and deterministic**, because an acceptance test that measures a different
corpus on every run cannot be compared to itself: rank directories by in-band session count
descending, tiebreak name ascending; within a directory, size descending, tiebreak file name
ascending. Same corpus in, same cast out; a *different* corpus is supposed to give a different
cast, and the printed report is how a reader sees that it did.

The count-descending rank is doing real work. On this machine `-private-tmp-captest` holds
exactly two in-band sessions — the shape a probe's leftover scratch directory has — and sorts
alphabetically ahead of the real worktrees. Ranking by history keeps it out. There is an arm
for exactly this.

### The refusal, which is the actual contribution

Theseus's Round 240 §3 rule, encoded rather than left to each caller:

> A guard that cannot pass renders as silence. So does a guard that *can* pass but
> **misattributes its own failure** — and that one is worse, because it sends the reader to a
> fix that isn't available.

The old guard said *"this probe needs a machine with the live Claude Code corpus it was written
against"* while standing on a machine with 538 sessions. Refusal is now two-valued and the two
values are never conflated:

- `no-corpus` — there is nothing here. Run elsewhere.
- `insufficient-corpus` — **there is a corpus**, it does not meet the stated properties, and
  the message says by how much:

```
Cannot run [insufficient-corpus]: this machine HAS a corpus — 10 sessions across 3 directories
— but only 2 of them hold 2+ sessions in 150-600 KiB, and 5 are needed
Remedy: Widen the size band or lower count/sessionsPerDir. Do NOT read this as "wrong machine":
the corpus is present and 2 directories have at least one in-band session.
```

## 4 — The repaired probe, driven

`probe-import-entity-binding.mts` now resolves its cast and prints it. First run since it went
dark:

```
corpus: 538 sessions across 18 directories under /Users/xian/.claude/projects
resolved 5 of 8 qualifying directories (by property, not by name):
  Argus     <- …klatch-worktrees-argus     592 KiB  last append 13.0 d ago  (>= 17.0 d of life left)
  Iris      <- …klatch-worktrees-iris      596 KiB  last append  9.8 d ago  (>= 20.2 d of life left)
  Calliope  <- …klatch-worktrees-calliope  594 KiB  last append 15.0 d ago  (>= 15.0 d of life left)
  Cova      <- …Development-cova           575 KiB  last append  6.3 d ago  (>= 23.7 d of life left)
  Janus     <- …designinproduct-worktrees-janus  424 KiB  last append 22.0 d ago  (>= 8.0 d of life left)

behavior (A/B): 26/26 pass
gaps (C/D/E):   5/5 still open
```

Exit 0. The five gaps are the ones the probe was written to hold open — the client still sends
no entity fields, and the claude.ai ZIP path still has no entity plumbing. **Nothing about the
product changed this fire.** What changed is that the acceptance test can run.

Note the cast is no longer the Klatch five: `Daedalus` and `Theseus` fell out, `Cova` and
`Janus` came in. That is the remedy working. The probe never needed *those* agents — it needed
five distinct sources with distinct names, which is what arms A and B assert.

Also removed: two literal `5`s in arm A's assertions, now derived from `CAST.length`. A literal
that no longer tracks its resolver is the same defect class one layer down.

## 5 — A number in the output that needed checking before I reported it

Every import reported `msgs=2` — two messages from a 592 KiB transcript. Verified rather than
assumed, on one of the resolved files:

```
lines: 162   user: 47   assistant: 82
  user turns that are tool_result envelopes:  46
  genuine user turns:                          1
```

A duty-cycle fire is **one prompt and one long answer**, with the rest being tool traffic folded
into artifacts. `msgs=2` is correct. **It is also a finding about the instrument:** arm A's
*"assistant messages carry its entity_id — mismatched rows=0"* is running over **one row**. The
check is true but nearly vacuous, and the 150–600 KB band selects for *byte size*, which on
today's corpus means long tool logs rather than long conversations. Named in §7; not fixed
here, because changing what the acceptance test measures is a change to the instrument.

## 6 — Controls, and the one that failed to fail

**19/19** on `probe-round241-…`; **26/26 + 5 gaps open** on the repaired probe.
Server **123 files · 1952 passed · 1 skipped**; client **38 files · 324 passed · 13 skipped** —
matches Theseus's Round 240 §6 exactly. `npm run typecheck` **0 errors ×3 workspaces**;
strict typecheck on all three new/changed `.mts` files **0 errors**. `npm test` **into a file,
not through `| tail`**. `git status --porcelain packages/` **empty** — this round touches only
`scripts/`. Repo `klatch.db` (this worktree) 1 channel / 0 `probe-seed%`. Ports 3001/5173 quiet;
no server spawned. **0 model calls.**

### Two red capability runs

1. Collapse the two refusal reasons → **F3 fails**, 1 of 19. As designed.
2. Disable label widening (`width <= cap` → `width <= 1`) → **E2 fails**, 1 of 19.

**(2) is the one worth recording, because the first version of E2 passed it.** E2 originally
asserted only *"labels are distinct, and both mention argus"*. The broken build satisfies that:
when widening is gone, the index fallback emits `Argus1` / `Argus2` — distinct, both mention
argus. **A check that a deliberately broken implementation satisfies is not a check.** It now
asserts the distinguishing segment (`KlatchWorktreesArgus` / `OtherWorktreesArgus`) and forbids
the numeric fallback.

This is Theseus's Round 240 §4 ratio in my own seat: the controls found the defect that reading
the code did not. Two of the three things wrong with this round's work were found by driving it.

### The third: a negative age

The controls printed `last append -0.0 d ago`. A file written microseconds earlier carried an
`mtime` fractionally ahead of `Date.now()`. Cosmetic in size, not in kind — the one output a
reader is supposed to trust is the wrong place to leak filesystem clock granularity. Clamped at
zero, with an arm.

## 7 — Open

- **The vitest coverage I did not get.** This began as
  `packages/server/src/__tests__/round241-….test.ts`, on the precedent of
  `round85-marker-floor.test.ts` importing `scripts/lib/marker-floor.mjs`. `npm run typecheck`
  rejected it — `TS5097` (`.mts` import without `allowImportingTsExtensions`) and `TS6059`
  (outside `rootDir`). The precedent holds for `.mjs` helpers, which tsc does not own; it does
  not extend to a `.mts` one, and the codebase already splits that way (`probe-outcome.mts` is
  driven by a control probe, not the suite). **Consequence, stated plainly: these 19 checks do
  not run in `npm test`.** A root-level vitest project covering `scripts/` would fix it for
  every `.mts` helper at once. Priced, not taken — it is new test infrastructure, not a repair.
- **Arm A's per-message check runs over one row** (§5), and the size band selects byte size
  rather than conversational depth. Fixing it changes what the acceptance test measures, which
  by the Round 238 rule needs a re-measure — and see the next item.
- **The Round 238 re-measure rule cannot be satisfied here, and that is itself the finding.**
  It says a change to an instrument needs a re-measure against the corpus the old numbers came
  from. Four of those seven files are deleted. **The baseline is unrecoverable**, so the old
  and new casts can never be compared. This is the strongest argument for the remedy rather
  than against it: a pinned corpus does not just rot, it takes the ability to audit its own
  replacement with it. Where a baseline is destructible, the discipline has to be *controls
  that do not depend on it* — which is why every arm in the new control builds its own corpus.
- **Theseus's 29 stale-in-code probes** remain a population, not a defect list. Untouched here;
  the UUID sweep in §1 is a different axis and does not speak to them.
- **Not mine, unchanged:** arm O's noise band; arm O on the real corpus.
- **Parked on xian, unchanged:** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`;
  the backfill dry run; `DELETE /entities/:id`.
