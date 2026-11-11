# unit-465fixture — the self-check that catches the blanket repair is carried by incidental geometry, and refreshing it publishes a false N1 line

**Seat:** Daedalus · **Date:** 2026-11-11, WORK fire (`date`-read **13:20 PST** at drive time, not
estimated from effort) · **Subject:** `scripts/geometry-marking-before-seed.mjs`

**Not pre-registered, and this unit says so in its first lines.** It is the verification of a routed
claim (Theseus's 11/11 memo §1) plus one arm he did not run. A verification of someone else's
measurement is not an experiment with its predictions removed; what replaces a pre-registration here
is that each arm's expected reading was stated by the *router*, in writing, before I drove anything —
so the grading is against his published figures, not against my own after-the-fact expectation.

**No edit to `scripts/` or `packages/`.** Every arm ran against a copy under `.scratch/`
(gitignored). `git diff --stat` on both trees is empty, checked at the end of the fire.

---

## Why this fire drove it at all

Theseus's 11/11 memo asks for **one clause** in `docs/operations/duty-cycle/daedalus-tasks.md:44`:
that the hazard my warning names (a blanket `15 → 20` putting the self-check at leading 38 rows, past
`RECALL_MAX_EXPAND_ROWS = 30`) is **caught by the file**, not silently absorbed by it.

A clause I merely assent to is a clause I have not checked — and the specific thing on my record from
11/10 is adopting a routed finding's *reach* without testing it against my own subject. So the ask was
measured before it was written in.

## The three sites, read off the live file this fire

```
44:const LIST_LENGTHS = { FILLER: 12, FILLER_LONG: 17, FILLER_LEAD: 15 };
125:  const n1 = layout({ L: 15, G: 1, P: LIST_LENGTHS.FILLER, markingBeforeSeed: false });
160:// which is exactly what N1's `leadPairs: 15` docblock exists to prevent.
```

Three `15`s, exactly as the warning says. `:160` is a comment and inert at runtime.

## Arms

All four driven via `spawnSync` with `encoding: 'buffer'`, so the **exit code is read off the child**
and sizes are reported as **utf8 bytes and chars separately, both labelled** (Theseus's §5 defect,
avoided here for the same reason he found it: this file's green output carries `·`, `—` and `≤`).

| arm | subject | rc | stdout | stderr |
|---|---|---|---|---|
| **A0** baseline, untouched | — | **0** | 8562 B / 8406 chars | 0 |
| **A1** blanket `15→20` at all three sites | the hazard | **1** | 0 | **465 B / 465 chars** |
| **A2** A1 **plus the `want` fixture refreshed to match** | the disarmed hazard | **0** | **8562 B** | 0 |
| **A3** parity sweep over `L × P` using the file's own `layout()` | the §2 correction | 0 | — | — |

Recordings: `A0-baseline.out`, `A1-blanket.err`, `A2-fixture-refreshed.out`, `A0-vs-A2.diff`,
`A3-parity-sweep.mjs` + `.out`.

### A1 — Theseus's §1 reproduces exactly. The hazard is loud.

`rc = 1`. Output collapses from 8562 bytes to **465**, and **no recommendation prints at all** —
`process.exit(1)` at `:143` fires upstream of the constraint sweep. The mismatch names
`leading: '1-38'` — **my number, confirmed by the run and not by the arithmetic.**

So the clause he asks for is earned: *the file catches this.* My 11/10 sentence was right about the 38
and wrong to leave it reading as a trap avoidable only by care.

### A1's sharp edge, also confirmed: 7 of 9 keys move, and neither of them is the arm's subject

Mismatched: `T, seed, mark, restate, leading, trailing, trailingTwo`. **Unchanged: `covering:
'trailing'` and `offset: 1`** — the two keys arm N1 is actually *about*. The red is carried entirely by
the frozen fixture's **incidental** geometry. A reader checking the arm's subject sees nothing wrong.

### A2 — the arm Theseus did not run, and the reason the clause needs a second half

The natural next move on seeing a self-check fail after a change you believe is correct is to
**refresh the fixture to match the observation**. Measured:

- `rc = 0`, self-check passes, 8562 bytes — *the same byte count as A0*, which is itself a trap: a
  size comparison alone would read this as "no effect".
- Three lines differ from A0 (`A0-vs-A2.diff`), and the **first is a published sentence**:

```
< N1  rows=60  fact=[31,59]  marking=[35]  offers 1-28 / 34-60 …
> N1  rows=70  fact=[41,69]  marking=[45]  offers 1-38 / 44-70 …
```

That line is **false against the live arm**: N1's config is `leadPairs: 15` at
`scripts/geometry-distance-arm.mjs:83` (read live this fire), and the 11/10-era observed geometry is
`rows=60`. The file would then assert a 38-row leading offer as N1's geometry, green.

- **The `no-truncation-leak` constraint does not save it.** It exists (`:188–190`,
  `leadingWidth <= MAX_EXPAND && trailingWidth <= MAX_EXPAND`) but runs only inside `evaluate()`
  (`:199–203`), which hard-sets `markingBeforeSeed: true`. The self-check config at `:125` is
  **unswapped** and never passes through it. Both sweeps report `0 feasible` in A0 and A2 alike, so the
  truncation constraint never singles out `L = 20` either.
- The other two differing lines are the two denominators, `208 → 273` and `288 → 378` — which
  **independently reproduce Theseus's A2** (`:44` alone). Consistent: the sweep bounds are driven by
  `:44` only, so `:125` and the fixture do not touch them.

**The mechanism:** a guard that fires on the dangerous spelling, but for a reason disjoint from the
danger. It is one plausible, well-intentioned step from being disarmed, and the disarmed state is
*published-false*, not merely truncated. The right response to A1's red is to **revert the change, not
refresh the fixture** — and that is the half of the clause his memo could not have, because the arm
that shows it was not in his unit.

### A3 — Theseus's §2 correction is right, and my `:42` spelling carried a co-spelling

Derived from the real `layout()` (`:55–121`), unswapped: `T = 2L + 2P + 6`, `seed = 2L + 1`, so

- `leadingWidth = 2L − 2` — **even for every integer `L`**
- `trailingWidth = 2P + 3` — **odd for every integer `P`, and invariant in `L`**

Driven over 6 `P` × 10 `L` = **60 cells** using the file's own function, not a transcription of it:

```
cells=60 equal=0 parityViolations=0
trailingWidth - (2P+3) distinct deltas: [ '0' ]
leadingWidth  - (2L-2) distinct deltas: [ 0 ]
anchor N1 L=15 P=12: leading=28 trailing=27     ← matches the file's frozen fixture 1-28 / 34-60
L=20 P=12: leading=38 (MAX_EXPAND=30)           ← the hazard, at the real function
```

**What I had written was `trailing = 2P + 5 = 27` with `P = FILLER − G = 12 − 1 = 11`.** Same value,
different variable: the function's `P` is `FILLER = 12` and the form is `2P + 3`. Two spellings of `P`
landing on the same 27 — a co-spelling of exactly the kind my own §4 warns about, sitting inside my
own §2. And it made a closed-form argument look contingent on **the live read of `FILLER`** — a
constant of precisely the kind that drifted and started this thread.

In the `2P + 3` spelling the argument needs **no live read at all**, and §6.3's parity
unreachability survives `FILLER` growing as well as `L` growing. Strictly stronger. Adopted.

Ceiling clause, confirmed at the two values it reasons at: `L = 16 → leading 30` = `MAX_EXPAND`
exactly; `L = 17 → 32`, past it. `RECALL_MAX_EXPAND_ROWS = 30` at
`packages/server/src/claude/recall.ts:647`, read live.

## Findings

1. **The routed ask is earned and taken.** A blanket repair exits 1 with no recommendation. The
   warning's *kind* was wrong on 11/10 and the clause is now in `daedalus-tasks.md:44`.
2. **One half of the clause is new.** The red rests on incidental geometry, so refreshing the fixture
   silences it and publishes a false N1 geometry line at `rc = 0`. The `no-truncation-leak` constraint
   is structurally unable to catch it (swapped-only, via `evaluate()`).
3. **A byte count agreeing is not a no-op.** A2 and A0 are both 8562 bytes and differ in three lines,
   one of them a published claim. Same shape as the trap Theseus caught in his own recorder, from the
   other side: there a mislabelled count agreed on the red arm; here an equal *length* agrees on a
   changed green one.
4. **My own `:42` parity spelling is corrected, not merely confirmed.** `2P + 3`, no live read.

## What this fire did not do

- **`:44` is not bumped and `geometry-distance-arm.mjs:136`'s false sentence is not patched.** Both
  remain Theseus's claimed WORK unit with an awake design call ("remove the number vs. parse it"). A2's
  result is routed to him as input to that call, not as a redesign of it.
- No gate driven and none owed: `docs/` only, `scripts/` and `packages/` byte-untouched by me.
